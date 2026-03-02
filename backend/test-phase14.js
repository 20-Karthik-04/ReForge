/**
 * @fileoverview Phase 14.1 verification test suite — POST /api/preview
 * @module backend/test-phase14
 *
 * Tests:
 *  - Validation (400 on missing/malformed body)
 *  - Successful preview document generation
 *  - Security: CDN injection present, no eval, data-reforge-preview boundary
 *  - Entry-point-not-found → 422 ENTRY_NOT_FOUND
 *  - Sanitization: <script>, <iframe>, <form>, inline event handlers stripped
 *  - Determinism: same input → identical responses
 *
 * Runs without any test framework — pure Node.js (requires Node 18+).
 *
 * Usage:
 *   NODE_ENV=test node backend/test-phase14.js
 */

import 'dotenv/config';

process.env.NODE_ENV = 'test';

const { default: app } = await import('./server.js');
import http from 'http';

// ---------------------------------------------------------------------------
// Test infrastructure (same pattern as test-phase9-zip.js)
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
const results = [];

function assert(label, condition, detail = '') {
    if (condition) {
        passed++;
        results.push(`  ✓ PASS — ${label}`);
    } else {
        failed++;
        results.push(`  ✗ FAIL — ${label}${detail ? ` (${detail})` : ''}`);
    }
}

function postRaw(server, path, body) {
    return new Promise((resolve, reject) => {
        const addr = server.address();
        const data = JSON.stringify(body);
        const req = http.request(
            {
                hostname: '127.0.0.1',
                port: addr.port,
                path,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data),
                },
            },
            (res) => {
                const chunks = [];
                res.on('data', (c) => chunks.push(c));
                res.on('end', () => {
                    const buffer = Buffer.concat(chunks);
                    const text = buffer.toString('utf8');
                    let json = null;
                    try { json = JSON.parse(text); } catch { /* html or binary */ }
                    resolve({ status: res.statusCode, headers: res.headers, text, json });
                });
            }
        );
        req.on('error', reject);
        req.setTimeout(15000, () => req.destroy(new Error('Request timed out')));
        req.write(data);
        req.end();
    });
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ENTRY_HTML = '<section class="bg-white text-center p-8"><h1>Hello ReForge</h1></section>';

const VALID_GENERATED_OUTPUT = {
    files: [
        { path: 'src/App.jsx', content: ENTRY_HTML, type: 'component' },
        { path: 'src/main.jsx', content: '// entry', type: 'other' },
    ],
    dependencies: [
        { package: 'react', version: '^18.0.0' },
    ],
    previewMetadata: { entryPoint: 'src/App.jsx', framework: 'react' },
};

/** Output where the entry-point path is NOT present in files[] */
const MISSING_ENTRY_OUTPUT = {
    files: [
        { path: 'src/main.jsx', content: '// entry', type: 'other' },
    ],
    dependencies: [],
    previewMetadata: { entryPoint: 'src/App.jsx', framework: 'react' },
};

/** Output whose entry-point contains dangerous constructs — sanitizer must strip them */
const DANGEROUS_CONTENT_OUTPUT = {
    files: [
        {
            path: 'src/App.jsx',
            content: [
                '<div>',
                '  <script>alert("xss")</script>',
                '  <iframe src="http://evil.example"></iframe>',
                '  <form action="/steal"><input /></form>',
                '  <button onclick="stealCookies()">Click</button>',
                '  <img onerror="doEvil()" src="x" />',
                '  <p>Safe paragraph</p>',
                '</div>',
            ].join('\n'),
            type: 'component',
        },
    ],
    dependencies: [],
    previewMetadata: { entryPoint: 'src/App.jsx', framework: 'react' },
};

// ---------------------------------------------------------------------------
// Run tests
// ---------------------------------------------------------------------------

async function run() {
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    console.log(`\n🧪 Phase 14.1 test suite running on port ${server.address().port}\n`);

    // ==========================================================================
    // Group 1: Validation
    // ==========================================================================
    console.log('── Group 1: Validation ─────────────────────────────────────────');
    {
        const r1 = await postRaw(server, '/api/preview', {});
        assert('Empty body → 400', r1.status === 400, `got ${r1.status}`);
        assert('Empty body → VALIDATION_ERROR code', r1.json?.error?.code === 'VALIDATION_ERROR');

        const r2 = await postRaw(server, '/api/preview', { foo: 'bar' });
        assert('Missing generatedOutput → 400', r2.status === 400, `got ${r2.status}`);

        const r3 = await postRaw(server, '/api/preview', {
            generatedOutput: { files: 'not-an-array', dependencies: [], previewMetadata: { entryPoint: 'x', framework: 'react' } },
        });
        assert('Invalid generatedOutput shape → 400', r3.status === 400, `got ${r3.status}`);
    }

    // ==========================================================================
    // Group 2: Successful generation
    // ==========================================================================
    console.log('\n── Group 2: Successful generation ──────────────────────────────');
    {
        const r = await postRaw(server, '/api/preview', { generatedOutput: VALID_GENERATED_OUTPUT });
        assert('Valid request → 200', r.status === 200, `got ${r.status} — ${r.text.slice(0, 200)}`);
        assert('Content-Type is text/html', r.headers['content-type']?.includes('text/html'), r.headers['content-type']);
        assert('Cache-Control: no-store', r.headers['cache-control']?.includes('no-store'), r.headers['cache-control']);
        assert('Response is non-empty', r.text.length > 0);

        // Document structure
        assert('Contains <!DOCTYPE html>', r.text.includes('<!DOCTYPE html>'));
        assert('Contains <html lang="en">', r.text.includes('<html lang="en">'));
        assert('Contains charset utf-8', r.text.includes('charset="utf-8"'));
        assert('Contains viewport meta', r.text.includes('name="viewport"'));

        // Tailwind CDN injection
        assert(
            'Tailwind CDN script injected',
            r.text.includes('<script src="https://cdn.tailwindcss.com"></script>'),
            'CDN script tag not found'
        );

        // Preview boundary
        assert(
            'Root div has data-reforge-preview attribute',
            r.text.includes('data-reforge-preview="true"'),
            'attribute missing'
        );
        assert(
            'Root div has id="root"',
            r.text.includes('id="root"'),
            'id missing'
        );

        // Entry-point content present
        assert(
            'Entry-point content injected into document',
            r.text.includes('Hello ReForge'),
            'content not found in response'
        );
    }

    // ==========================================================================
    // Group 3: Entry-point not found
    // ==========================================================================
    console.log('\n── Group 3: Entry-point not found ──────────────────────────────');
    {
        const r = await postRaw(server, '/api/preview', { generatedOutput: MISSING_ENTRY_OUTPUT });
        assert('Missing entry-point → 422', r.status === 422, `got ${r.status}`);
        assert('Missing entry-point → ENTRY_NOT_FOUND code', r.json?.error?.code === 'ENTRY_NOT_FOUND');
    }

    // ==========================================================================
    // Group 4: Security — no eval / Function in response
    // ==========================================================================
    console.log('\n── Group 4: Security — no eval / Function injection ────────────');
    {
        const r = await postRaw(server, '/api/preview', { generatedOutput: VALID_GENERATED_OUTPUT });
        assert('Response does not contain eval(', !r.text.includes('eval('));
        assert('Response does not contain new Function(', !r.text.includes('new Function('));
        // No additional scripts beyond CDN
        const scriptMatches = [...r.text.matchAll(/<script/gi)];
        assert(
            'Only one <script> tag (the Tailwind CDN)',
            scriptMatches.length === 1,
            `found ${scriptMatches.length} script tags`
        );
    }

    // ==========================================================================
    // Group 5: Sanitization — dangerous constructs stripped
    // ==========================================================================
    console.log('\n── Group 5: Sanitization ───────────────────────────────────────');
    {
        const r = await postRaw(server, '/api/preview', { generatedOutput: DANGEROUS_CONTENT_OUTPUT });
        assert('Dangerous input → 200 (sanitized, not rejected)', r.status === 200, `got ${r.status}`);

        // Injected <script> from entry content should be gone
        // (Tailwind CDN script is the ONLY allowed script — already tested in Group 4)
        const allScripts = [...r.text.matchAll(/<script/gi)];
        assert(
            'Only Tailwind CDN script remains (entry scripts stripped)',
            allScripts.length === 1,
            `found ${allScripts.length} script elements`
        );

        assert(
            '<iframe> stripped from entry content',
            !r.text.includes('evil.example'),
            'iframe content leaked through'
        );

        assert(
            '<form> stripped from entry content',
            !r.text.includes('/steal'),
            'form action leaked through'
        );

        assert(
            'onclick= handler stripped',
            !r.text.includes('stealCookies'),
            'onclick handler leaked through'
        );

        assert(
            'onerror= handler stripped',
            !r.text.includes('doEvil'),
            'onerror handler leaked through'
        );

        // Safe content must survive sanitization
        assert(
            'Safe paragraph content preserved through sanitization',
            r.text.includes('Safe paragraph'),
            'safe content was accidentally stripped'
        );
    }

    // ==========================================================================
    // Group 6: Determinism
    // ==========================================================================
    console.log('\n── Group 6: Determinism ────────────────────────────────────────');
    {
        const r1 = await postRaw(server, '/api/preview', { generatedOutput: VALID_GENERATED_OUTPUT });
        const r2 = await postRaw(server, '/api/preview', { generatedOutput: VALID_GENERATED_OUTPUT });

        assert('Same input → same response length', r1.text.length === r2.text.length,
            `${r1.text.length} vs ${r2.text.length}`);
        assert('Same input → identical response body', r1.text === r2.text,
            'responses differ — not deterministic');
    }

    // ==========================================================================
    // Summary
    // ==========================================================================
    console.log('\n═══════════════════════════════════════════════════════════════');
    results.forEach((line) => console.log(line));
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`\nResults: ${passed} passed, ${failed} failed\n`);

    server.close();

    if (failed > 0) process.exit(1);
}

run().catch((err) => {
    console.error('\n❌ Test suite crashed:', err);
    process.exit(1);
});
