/**
 * @fileoverview Phase 9.6 & 9.7 verification test suite for ReForge API
 * @module backend/test-phase9-zip
 *
 * Tests:
 *  - POST /api/generate-zip (Phase 9.6)
 *  - POST /api/generate-full (Phase 9.7)
 *
 * Runs without any test framework — pure Node.js (requires Node 18+).
 *
 * Usage:
 *   NODE_ENV=test node backend/test-phase9-zip.js
 *
 * The server is imported programmatically (no separate process needed) because
 * server.js skips app.listen() when NODE_ENV === 'test'.
 */

import 'dotenv/config';

process.env.NODE_ENV = 'test';

const { default: app } = await import('./server.js');
import http from 'http';

// ── Lazy-load JSZip so we can inspect the returned ZIP buffers ────────────────
const JSZip = (await import('jszip')).default;

// ---------------------------------------------------------------------------
// Test infrastructure
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
const results = [];

/**
 * Asserts a condition and records the result.
 * @param {string} label
 * @param {boolean} condition
 * @param {string} [detail]
 */
function assert(label, condition, detail = '') {
    if (condition) {
        passed++;
        results.push(`  ✓ PASS — ${label}`);
    } else {
        failed++;
        results.push(`  ✗ FAIL — ${label}${detail ? ` (${detail})` : ''}`);
    }
}

/**
 * Makes a POST request to the test server and returns raw buffer + headers.
 * @param {http.Server} server
 * @param {string} path
 * @param {object} body
 * @returns {Promise<{status: number, headers: object, buffer: Buffer, json: object|null}>}
 */
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
                res.on('data', (chunk) => chunks.push(chunk));
                res.on('end', () => {
                    const buffer = Buffer.concat(chunks);
                    let json = null;
                    try { json = JSON.parse(buffer.toString()); } catch { /* binary */ }
                    resolve({ status: res.statusCode, headers: res.headers, buffer, json });
                });
            }
        );

        req.on('error', reject);
        req.setTimeout(30000, () => req.destroy(new Error('Request timed out after 30s')));
        req.write(data);
        req.end();
    });
}

// ---------------------------------------------------------------------------
// Fixtures (reused from test-phase9.js to guarantee same shapes)
// ---------------------------------------------------------------------------

const VALID_ANALYSIS = {
    url: 'https://example.com',
    title: 'Example Domain',
    sections: [
        { type: 'hero', contentLength: 100, headingCount: 1, contentDensity: 50, layoutSignal: 'single-column' },
        { type: 'features', contentLength: 200, headingCount: 3, contentDensity: 60, layoutSignal: 'grid' },
        { type: 'footer', contentLength: 50, headingCount: 0, contentDensity: 20, layoutSignal: 'multi-column' },
    ],
    issues: [],
    metrics: { totalWordCount: 350, totalHeadings: 4, hasMobileOptimization: true },
};

/** Minimal valid GeneratedOutput fixture */
const VALID_GENERATED_OUTPUT = {
    files: [
        { path: 'src/App.jsx', content: 'export default function App() { return <div>Hello</div>; }', type: 'component' },
    ],
    dependencies: [
        { package: 'react', version: '^18.0.0' },
        { package: 'react-dom', version: '^18.0.0' },
    ],
    previewMetadata: { entryPoint: 'src/App.jsx', framework: 'react' },
};

// ---------------------------------------------------------------------------
// Run tests
// ---------------------------------------------------------------------------

async function run() {
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    console.log(`\n🧪 Phase 9.6 & 9.7 test suite running on port ${server.address().port}\n`);

    // ==========================================================================
    // Group 1: POST /api/generate-zip — validation
    // ==========================================================================
    console.log('── Group 1: POST /api/generate-zip — validation ───────────────');
    {
        // Missing body
        const r1 = await postRaw(server, '/api/generate-zip', {});
        assert('Empty body → 400', r1.status === 400, `got ${r1.status}`);
        assert('Empty body → VALIDATION_ERROR code', r1.json?.error?.code === 'VALIDATION_ERROR');

        // Missing generatedOutput
        const r2 = await postRaw(server, '/api/generate-zip', { foo: 'bar' });
        assert('Missing generatedOutput → 400', r2.status === 400, `got ${r2.status}`);

        // Invalid generatedOutput shape (missing files array)
        const r3 = await postRaw(server, '/api/generate-zip', {
            generatedOutput: { files: 'not-an-array', dependencies: [], previewMetadata: { entryPoint: 'x', framework: 'react' } },
        });
        assert('Invalid generatedOutput shape → 400', r3.status === 400, `got ${r3.status}`);
    }

    // ==========================================================================
    // Group 2: POST /api/generate-zip — successful ZIP generation
    // ==========================================================================
    console.log('\n── Group 2: POST /api/generate-zip — successful generation ────');
    {
        const r = await postRaw(server, '/api/generate-zip', { generatedOutput: VALID_GENERATED_OUTPUT });
        assert('Valid request → 200', r.status === 200, `got ${r.status}. JSON: ${JSON.stringify(r.json)}`);
        assert('Content-Type is application/zip', r.headers['content-type']?.includes('application/zip'), r.headers['content-type']);
        assert('Content-Disposition present', r.headers['content-disposition']?.includes('reforge-output.zip'));
        assert('Response is a Buffer (binary)', Buffer.isBuffer(r.buffer));
        assert('Response is non-empty', r.buffer.length > 0);

        // Inspect ZIP contents
        const zip = await JSZip.loadAsync(r.buffer);
        const files = Object.keys(zip.files);
        assert('ZIP contains src/App.jsx', files.some((f) => f.endsWith('src/App.jsx')), JSON.stringify(files));
        assert('ZIP contains package.json', files.some((f) => f.endsWith('package.json')), JSON.stringify(files));
        assert('ZIP contains README.md', files.some((f) => f.endsWith('README.md')), JSON.stringify(files));
        assert('ZIP contains .gitignore', files.some((f) => f.endsWith('.gitignore')), JSON.stringify(files));

        // Verify App.jsx content round-trips correctly
        const appJsxEntry = Object.entries(zip.files).find(([k]) => k.endsWith('src/App.jsx'));
        if (appJsxEntry) {
            const content = await appJsxEntry[1].async('string');
            assert('ZIP App.jsx content matches input', content === VALID_GENERATED_OUTPUT.files[0].content);
        } else {
            assert('ZIP App.jsx content matches input', false, 'App.jsx not found in ZIP');
        }
    }

    // ==========================================================================
    // Group 3: POST /api/generate-zip — determinism
    // ==========================================================================
    console.log('\n── Group 3: POST /api/generate-zip — determinism ──────────────');
    {
        const r1 = await postRaw(server, '/api/generate-zip', { generatedOutput: VALID_GENERATED_OUTPUT });
        const r2 = await postRaw(server, '/api/generate-zip', { generatedOutput: VALID_GENERATED_OUTPUT });

        assert('Same input → same buffer length', r1.buffer.length === r2.buffer.length,
            `${r1.buffer.length} vs ${r2.buffer.length}`);
        assert('Same input → byte-identical ZIP', r1.buffer.equals(r2.buffer),
            'buffers differ — ZIP is non-deterministic');
    }

    // ==========================================================================
    // Group 4: POST /api/generate-full — validation
    // ==========================================================================
    console.log('\n── Group 4: POST /api/generate-full — validation ──────────────');
    {
        // Missing body
        const r1 = await postRaw(server, '/api/generate-full', {});
        assert('Empty body → 400', r1.status === 400, `got ${r1.status}`);
        assert('Empty body → VALIDATION_ERROR', r1.json?.error?.code === 'VALIDATION_ERROR');

        // Missing url
        const r2 = await postRaw(server, '/api/generate-full', { goals: ['modern_design'] });
        assert('Missing url → 400', r2.status === 400, `got ${r2.status}`);

        // Missing goals
        const r3 = await postRaw(server, '/api/generate-full', { url: 'https://example.com' });
        assert('Missing goals → 400', r3.status === 400, `got ${r3.status}`);

        // Empty goals array
        const r4 = await postRaw(server, '/api/generate-full', { url: 'https://example.com', goals: [] });
        assert('Empty goals array → 400', r4.status === 400, `got ${r4.status}`);

        // Invalid goal value
        const r5 = await postRaw(server, '/api/generate-full', { url: 'https://example.com', goals: ['invalid_xyz'] });
        assert('Invalid goal value → 400', r5.status === 400, `got ${r5.status}`);

        // Invalid URL format
        const r6 = await postRaw(server, '/api/generate-full', { url: 'not-a-url', goals: ['modern_design'] });
        assert('Invalid URL format → 400', r6.status === 400, `got ${r6.status}`);
    }

    // ==========================================================================
    // Group 5: POST /api/generate-full — SSRF protection
    // ==========================================================================
    console.log('\n── Group 5: POST /api/generate-full — SSRF protection ─────────');
    {
        // SSRF on primary url
        const r1 = await postRaw(server, '/api/generate-full', {
            url: 'http://192.168.1.1/',
            goals: ['modern_design'],
        });
        assert('SSRF on url → 400', r1.status === 400, `got ${r1.status}`);
        assert('SSRF on url → SSRF_BLOCKED', r1.json?.error?.code === 'SSRF_BLOCKED');

        // SSRF on referenceUrl (primary url is safe/public but referenceUrl is private)
        const r2 = await postRaw(server, '/api/generate-full', {
            url: 'https://example.com',
            referenceUrl: 'http://10.0.0.1/',
            goals: ['modern_design'],
        });
        assert('SSRF on referenceUrl → 400', r2.status === 400, `got ${r2.status}`);
        assert('SSRF on referenceUrl → SSRF_BLOCKED', r2.json?.error?.code === 'SSRF_BLOCKED');

        // localhost blocked on url
        const r3 = await postRaw(server, '/api/generate-full', {
            url: 'http://localhost/admin',
            goals: ['modern_design'],
        });
        assert('localhost on url → 400', r3.status === 400, `got ${r3.status}`);

        // localhost blocked on referenceUrl
        const r4 = await postRaw(server, '/api/generate-full', {
            url: 'https://example.com',
            referenceUrl: 'http://localhost/internal',
            goals: ['modern_design'],
        });
        assert('localhost on referenceUrl → 400', r4.status === 400, `got ${r4.status}`);
    }

    // ==========================================================================
    // Group 6: POST /api/generate-full — full pipeline (uses fallback AI plan)
    // ==========================================================================
    console.log('\n── Group 6: POST /api/generate-full — full pipeline ────────────');
    {
        // Use a real public URL; AI will use fallback plan in test env (no API key)
        const r = await postRaw(server, '/api/generate-full', {
            url: 'https://example.com',
            goals: ['modern_design'],
        });

        // The pipeline involves a real HTTP crawl — it may succeed or fail due to
        // network conditions in the test environment. Both outcomes are valid here;
        // we focus on the contract (zip on success, structured error on failure).
        if (r.status === 200) {
            assert('Full pipeline → 200 (network available)', r.status === 200);
            assert('Full pipeline → Content-Type application/zip',
                r.headers['content-type']?.includes('application/zip'), r.headers['content-type']);
            assert('Full pipeline → non-empty buffer', r.buffer.length > 0);

            // Inspect ZIP
            const zip = await JSZip.loadAsync(r.buffer);
            const files = Object.keys(zip.files);
            assert('Full pipeline ZIP contains App.jsx', files.some((f) => f.endsWith('App.jsx')), JSON.stringify(files));
            assert('Full pipeline ZIP contains package.json', files.some((f) => f.endsWith('package.json')));
        } else {
            // Structured error (network unavailable / SSRF edge-case in CI) — still valid
            assert('Full pipeline returned structured error on failure', typeof r.json?.error?.message === 'string',
                `status=${r.status} body=${JSON.stringify(r.json)}`);
            console.log(`   (Note: pipeline failed with code=${r.json?.error?.code} — likely no network in test env)`);
        }
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
