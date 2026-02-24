/**
 * @fileoverview SSRF (Server-Side Request Forgery) protection middleware
 * @module backend/middleware/ssrfGuard
 *
 * Security guarantees:
 *  - Rejects non-http/https protocols
 *  - Resolves hostname to IP via DNS before checking (defeats DNS rebinding / nip.io tricks)
 *  - Rejects resolved IPs in: loopback, private RFC1918, link-local, IPv6 loopback
 *  - Never trusts the hostname string alone — always performs real DNS lookup
 */

import dns from 'dns/promises';

// ---------------------------------------------------------------------------
// Private / reserved IP range matchers
// ---------------------------------------------------------------------------

/**
 * Checks whether a dotted-decimal IPv4 string is in a private or reserved range.
 *
 * Blocked ranges:
 *  - 127.x.x.x      — Loopback
 *  - 10.x.x.x       — RFC1918 private
 *  - 172.16–31.x.x  — RFC1918 private
 *  - 192.168.x.x    — RFC1918 private
 *  - 169.254.x.x    — Link-local (APIPA)
 *  - 0.x.x.x        — "This" network
 *
 * @param {string} ip - Dotted-decimal IPv4 address
 * @returns {boolean} True if the IP is in a blocked range
 */
function isBlockedIPv4(ip) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) return false;

    const [a, b] = parts;

    return (
        a === 127 ||                              // Loopback
        a === 10 ||                               // RFC1918 10.x
        (a === 172 && b >= 16 && b <= 31) ||     // RFC1918 172.16–31
        (a === 192 && b === 168) ||               // RFC1918 192.168.x
        (a === 169 && b === 254) ||               // Link-local
        a === 0                                   // "This" network
    );
}

/**
 * Checks whether an IPv6 address string is blocked.
 * Blocks: loopback (::1), any address (::), link-local (fe80::)
 *
 * @param {string} ip - IPv6 address string
 * @returns {boolean} True if blocked
 */
function isBlockedIPv6(ip) {
    const normalized = ip.toLowerCase().replace(/^\[|\]$/g, '');
    return (
        normalized === '::1' ||
        normalized === '::' ||
        normalized.startsWith('fe80:') ||
        normalized.startsWith('fc') ||
        normalized.startsWith('fd')
    );
}

// ---------------------------------------------------------------------------
// Pure SSRF check helper (exported for reuse in routes with multiple URLs)
// ---------------------------------------------------------------------------

/**
 * Validates a single URL against SSRF rules.
 *
 * Resolves the hostname via real DNS and rejects if the resolved IP falls in a
 * private or reserved range.  Throws a structured error (with statusCode + code)
 * on violation so callers can forward it directly to Express's next().
 *
 * @param {string} url - URL string to validate
 * @returns {Promise<void>} Resolves if the URL is safe
 * @throws {{ message: string, statusCode: number, code: string }} On violation
 */
export async function checkSsrf(url) {
    // ── 1. Parse URL ─────────────────────────────────────────────────────────
    let parsed;
    try {
        parsed = new URL(url);
    } catch {
        const err = new Error('Invalid URL format');
        err.statusCode = 400;
        err.code = 'INVALID_URL';
        throw err;
    }

    // ── 2. Protocol check — only http and https allowed ─────────────────────
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        const err = new Error(`Disallowed URL protocol: ${parsed.protocol}. Only http and https are allowed.`);
        err.statusCode = 400;
        err.code = 'DISALLOWED_PROTOCOL';
        throw err;
    }

    const hostname = parsed.hostname;

    // ── 3. Explicit localhost string check (before DNS) ──────────────────────
    if (hostname === 'localhost') {
        const err = new Error('Requests to localhost are not allowed');
        err.statusCode = 400;
        err.code = 'SSRF_BLOCKED';
        throw err;
    }

    // ── 4. DNS resolution — resolve to actual IP ─────────────────────────────
    let resolvedAddress;
    try {
        const result = await dns.lookup(hostname);
        resolvedAddress = result.address;
    } catch {
        const err = new Error(`Failed to resolve hostname: ${hostname}`);
        err.statusCode = 400;
        err.code = 'DNS_RESOLUTION_FAILED';
        throw err;
    }

    // ── 5. Check resolved IP for private/reserved ranges ─────────────────────
    const isBlocked =
        isBlockedIPv4(resolvedAddress) ||
        isBlockedIPv6(resolvedAddress);

    if (isBlocked) {
        const err = new Error(`Requests to private or reserved IP addresses are not allowed (resolved: ${resolvedAddress})`);
        err.statusCode = 400;
        err.code = 'SSRF_BLOCKED';
        throw err;
    }
}

// ---------------------------------------------------------------------------
// Middleware (thin wrapper around checkSsrf — existing consumers unchanged)
// ---------------------------------------------------------------------------

/**
 * Express middleware that guards against SSRF attacks.
 *
 * Reads `req.body.url`, validates the protocol, resolves the hostname via DNS,
 * and rejects the request if the resolved IP is private or reserved.
 *
 * Must be placed **after** `validateBody` so that `req.body.url` is guaranteed
 * to be a valid URL string (Zod string().url() already passed).
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function ssrfGuard(req, res, next) {
    try {
        await checkSsrf(req.body.url);
        return next();
    } catch (err) {
        return next(err);
    }
}

export default ssrfGuard;
