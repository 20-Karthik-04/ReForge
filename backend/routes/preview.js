/**
 * @fileoverview POST /api/preview route — generate sandboxed HTML preview document
 * @module backend/routes/preview
 *
 * Security guarantees:
 *  - Input validated via Zod (PreviewRequestSchema)
 *  - Entry-point content defensively sanitized before injection:
 *      - <script> tags stripped
 *      - <iframe> tags stripped
 *      - <form> tags stripped
 *      - inline event handler attributes (on*=) stripped
 *  - Tailwind injected via CDN only (no user-provided scripts)
 *  - No filesystem writes
 *  - No persistent storage
 *  - No eval, no Function(), no dynamic code execution
 *  - Returns plain HTML string only
 *
 * Determinism invariant:
 *  Same generatedOutput input → same HTML output on every call.
 *  No timestamps, no randomness, no server state introduced.
 *
 * Architecture note:
 *  The entry-point file content is treated as opaque serialized HTML produced
 *  by the deterministic code generator. Even though that generator is trusted,
 *  the preview route provides a defensive second layer of sanitization because
 *  the content ultimately traces back to crawled external websites processed
 *  through AI summaries — both of which are untrusted input surfaces.
 *
 * Tailwind CDN tradeoff:
 *  The injected <script src="https://cdn.tailwindcss.com"> executes inside the
 *  sandboxed iframe (which has allow-scripts). This is accepted scope for
 *  Phase 14: Tailwind CDN provides utility-class styling without requiring a
 *  build step. A future hardening pass could replace CDN with precompiled CSS.
 */

import { Router } from 'express';
import { PreviewRequestSchema } from '../../shared/schemas.js';
import { validateBody } from '../middleware/validateBody.js';

const router = Router();

// ---------------------------------------------------------------------------
// Sanitization
// ---------------------------------------------------------------------------

/**
 * Regex patterns for dangerous HTML constructs to strip from entry content
 * before it is injected into the preview document.
 *
 * Patterns are applied in order. Each strips the matched tag (opening +
 * content + closing) or attribute from the string.
 *
 * @type {Array<{pattern: RegExp, description: string}>}
 */
const SANITIZE_RULES = [
    {
        // Strip <script>…</script> blocks (case-insensitive, dotall)
        pattern: /<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,
        description: 'script tags',
    },
    {
        // Strip bare <script …/> self-closing variants
        pattern: /<script\b[^>]*\/>/gi,
        description: 'self-closing script tags',
    },
    {
        // Strip <iframe>…</iframe> blocks
        pattern: /<iframe\b[^>]*>[\s\S]*?<\/iframe\s*>/gi,
        description: 'iframe tags',
    },
    {
        // Strip <form>…</form> blocks
        pattern: /<form\b[^>]*>[\s\S]*?<\/form\s*>/gi,
        description: 'form tags',
    },
    {
        // Strip inline event handler attributes: on*="…" or on*='…'
        // Covers onclick, onload, onerror, onmouseover, etc.
        pattern: /\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi,
        description: 'inline event handlers',
    },
];

/**
 * Defensively sanitizes HTML content before it is injected into the preview
 * document.
 *
 * Strips:
 *  - <script> tags (including self-closing)
 *  - <iframe> elements
 *  - <form> elements
 *  - Inline event handler attributes (on*=)
 *
 * This is a defence-in-depth measure: the deterministic generator should not
 * produce these constructs, but the content ultimately originates from crawled
 * external pages processed through AI, so a second sanitization pass is
 * applied unconditionally.
 *
 * @param {string} html - Raw HTML string from a GeneratedFile's content field.
 * @returns {string} Sanitized HTML string, safe to inject into the preview document.
 */
function sanitizeEntryContent(html) {
    let result = html;
    for (const { pattern } of SANITIZE_RULES) {
        result = result.replace(pattern, '');
    }
    return result;
}

// ---------------------------------------------------------------------------
// HTML document builder
// ---------------------------------------------------------------------------

/**
 * Assembles the full static HTML preview document.
 *
 * Structure:
 *   <!DOCTYPE html>
 *   <html lang="en">
 *     <head> charset + viewport + Tailwind CDN </head>
 *     <body>
 *       <div id="root" data-reforge-preview="true"> sanitized entry content </div>
 *     </body>
 *   </html>
 *
 * The `data-reforge-preview` attribute on the root div:
 *  - Creates an explicit preview boundary for future CSS isolation / instrumentation.
 *  - Prevents naming collisions with assumptions in generated code.
 *  - Is purely additive and has zero functional effect on the rendered output.
 *
 * @param {string} sanitizedContent - Sanitized entry-point file content.
 * @returns {string} Complete HTML document string.
 */
function buildPreviewDocument(sanitizedContent) {
    return [
        '<!DOCTYPE html>',
        '<html lang="en">',
        '<head>',
        '  <meta charset="utf-8" />',
        '  <meta name="viewport" content="width=device-width, initial-scale=1" />',
        '  <title>ReForge Preview</title>',
        '  <script src="https://cdn.tailwindcss.com"></script>',
        '</head>',
        '<body>',
        '  <div id="root" data-reforge-preview="true">',
        sanitizedContent,
        '  </div>',
        '</body>',
        '</html>',
    ].join('\n');
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

/**
 * POST /api/preview
 *
 * Accepts a validated GeneratedOutput and returns a sandboxed HTML preview
 * document as a plain HTML string.
 *
 * Request body: { generatedOutput: GeneratedOutput }
 * Response: text/html; charset=utf-8
 *
 * Error cases:
 *  - 400 VALIDATION_ERROR: body does not match PreviewRequestSchema
 *  - 422 ENTRY_NOT_FOUND: previewMetadata.entryPoint not found in files[]
 *
 * IMPORTANT:
 *  No files are written to disk.
 *  No dynamic code is executed.
 *  Entry content is sanitized before injection.
 */
router.post(
    '/preview',
    validateBody(PreviewRequestSchema),
    (req, res, next) => {
        try {
            const { generatedOutput } = req.body;
            const { entryPoint } = generatedOutput.previewMetadata;

            // Locate the entry-point file in the files array
            const entryFile = generatedOutput.files.find((f) => f.path === entryPoint);

            if (!entryFile) {
                const err = new Error(
                    `Entry point '${entryPoint}' not found in generatedOutput.files`
                );
                err.statusCode = 422;
                err.code = 'ENTRY_NOT_FOUND';
                return next(err);
            }

            // Defensively sanitize before injection (defence-in-depth)
            const sanitized = sanitizeEntryContent(entryFile.content);

            // Build the static preview document
            const html = buildPreviewDocument(sanitized);

            res.set('Content-Type', 'text/html; charset=utf-8');
            // Prevent browsers from caching preview responses
            res.set('Cache-Control', 'no-store');
            return res.send(html);
        } catch (err) {
            return next(err);
        }
    }
);

export default router;
