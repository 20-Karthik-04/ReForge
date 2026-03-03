/**
 * @fileoverview Phase 15 verification test suite for ReForge API
 * @module backend/test-phase15
 *
 * Tests:
 *  - POST /api/generate-zip all Phase 15 requirements
 *
 * Runs without any test framework — pure Node.js (requires Node 18+).
 *
 * Usage:
 *   NODE_ENV=test node backend/test-phase15.js
 *
 * The server is imported programmatically (no separate process needed) because
 * server.js skips app.listen() when NODE_ENV === 'test'.
 */

import 'dotenv/config';

process.env.NODE_ENV = 'test';

const { default: app } = await import('./server.js');
import http from 'http';

// Lazy-load JSZip so we can inspect returned ZIP buffers
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
function postRaw(server, reqPath, body) {
    return new Promise((resolve, reject) => {
        const addr = server.address();
        const data = JSON.stringify(body);

        const req = http.request(
            {
                hostname: '127.0.0.1',
                port: addr.port,
                path: reqPath,
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
        req.setTimeout(15000, () => req.destroy(new Error('Request timed out after 15s')));
        req.write(data);
        req.end();
    });
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Minimal valid GeneratedOutput for Phase 15 tests */
const VALID_GENERATED_OUTPUT = {
    files: [
        {
            path: 'src/main.jsx',
            content: 'import React from "react";\nimport ReactDOM from "react-dom/client";\nimport App from "./App.jsx";\nReactDOM.createRoot(document.getElementById("root")).render(<App />);',
            type: 'component',
        },
        {
            path: 'src/App.jsx',
            content: 'export default function App() { return <div className="p-4">Hello from ReForge</div>; }',
            type: 'component',
        },
        {
            path: 'src/components/Hero.jsx',
            content: 'export default function Hero() { return <section>Hero</section>; }',
            type: 'component',
        },
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
    console.log(`\n🧪 Phase 15 test suite running on port ${server.address().port}\n`);

    // ==========================================================================
    // Group 1: Validation — missing / malformed body
    // ==========================================================================
    console.log('── Group 1: Validation — missing or malformed body ────────────');
    {
        // Missing body entirely
        const r1 = await postRaw(server, '/api/generate-zip', {});
        assert('Missing body → 400', r1.status === 400, `got ${r1.status}`);
        assert('Missing body → VALIDATION_ERROR', r1.json?.error?.code === 'VALIDATION_ERROR',
            `code=${r1.json?.error?.code}`);

        // generatedOutput missing entirely
        const r2 = await postRaw(server, '/api/generate-zip', { foo: 'bar' });
        assert('Missing generatedOutput → 400', r2.status === 400, `got ${r2.status}`);

        // files is not an array
        const r3 = await postRaw(server, '/api/generate-zip', {
            generatedOutput: {
                files: 'not-an-array',
                dependencies: [],
                previewMetadata: { entryPoint: 'src/App.jsx', framework: 'react' },
            },
        });
        assert('files not an array → 400', r3.status === 400, `got ${r3.status}`);

        // missing previewMetadata
        const r4 = await postRaw(server, '/api/generate-zip', {
            generatedOutput: {
                files: [{ path: 'src/App.jsx', content: 'x', type: 'component' }],
                dependencies: [],
            },
        });
        assert('Missing previewMetadata → 400', r4.status === 400, `got ${r4.status}`);
    }

    // ==========================================================================
    // Group 2: Path safety — traversal and absolute path rejection
    // ==========================================================================
    console.log('\n── Group 2: Path safety ────────────────────────────────────────');
    {
        // Direct .. traversal
        const r1 = await postRaw(server, '/api/generate-zip', {
            generatedOutput: {
                files: [{ path: '../etc/passwd', content: 'x', type: 'other' }],
                dependencies: [],
                previewMetadata: { entryPoint: 'src/App.jsx', framework: 'react' },
            },
        });
        assert('Path with .. → 400', r1.status === 400, `got ${r1.status}`);
        assert('Path with .. → INVALID_FILE_PATH', r1.json?.error?.code === 'INVALID_FILE_PATH',
            `code=${r1.json?.error?.code}`);

        // Nested traversal that normalizes to escape root
        const r2 = await postRaw(server, '/api/generate-zip', {
            generatedOutput: {
                files: [{ path: 'src/../../etc/shadow', content: 'x', type: 'other' }],
                dependencies: [],
                previewMetadata: { entryPoint: 'src/App.jsx', framework: 'react' },
            },
        });
        assert('Nested traversal path → 400', r2.status === 400, `got ${r2.status}`);
        assert('Nested traversal → INVALID_FILE_PATH', r2.json?.error?.code === 'INVALID_FILE_PATH',
            `code=${r2.json?.error?.code}`);

        // Absolute path
        const r3 = await postRaw(server, '/api/generate-zip', {
            generatedOutput: {
                files: [{ path: '/etc/passwd', content: 'x', type: 'other' }],
                dependencies: [],
                previewMetadata: { entryPoint: 'src/App.jsx', framework: 'react' },
            },
        });
        assert('Absolute path → 400', r3.status === 400, `got ${r3.status}`);
        assert('Absolute path → INVALID_FILE_PATH', r3.json?.error?.code === 'INVALID_FILE_PATH',
            `code=${r3.json?.error?.code}`);

        // Safe path with dot segments that STAYS within root (should succeed)
        const r4 = await postRaw(server, '/api/generate-zip', {
            generatedOutput: {
                files: [{ path: 'src/./components/Hero.jsx', content: 'x', type: 'component' }],
                dependencies: [],
                previewMetadata: { entryPoint: 'src/App.jsx', framework: 'react' },
            },
        });
        assert('Safe path with ./ → 200 (normalizes safely)', r4.status === 200, `got ${r4.status}`);

        // Empty string path — normalizes to '.', must be rejected
        const r5 = await postRaw(server, '/api/generate-zip', {
            generatedOutput: {
                files: [{ path: '', content: 'x', type: 'other' }],
                dependencies: [],
                previewMetadata: { entryPoint: 'src/App.jsx', framework: 'react' },
            },
        });
        // Zod schema requires path.min(1), so this fails at schema validation before our guard
        assert('Empty string path → 400', r5.status === 400, `got ${r5.status}`);

        // Dot path '.' — normalizes to '.', must be rejected by guard
        const r6 = await postRaw(server, '/api/generate-zip', {
            generatedOutput: {
                files: [{ path: '.', content: 'x', type: 'other' }],
                dependencies: [],
                previewMetadata: { entryPoint: 'src/App.jsx', framework: 'react' },
            },
        });
        assert('Dot path "." → 400', r6.status === 400, `got ${r6.status}`);
        assert('Dot path → INVALID_FILE_PATH', r6.json?.error?.code === 'INVALID_FILE_PATH',
            `code=${r6.json?.error?.code}`);
    }

    // ==========================================================================
    // Group 3: Successful generation — HTTP contract
    // ==========================================================================
    console.log('\n── Group 3: Successful generation — HTTP contract ──────────────');
    {
        const r = await postRaw(server, '/api/generate-zip', { generatedOutput: VALID_GENERATED_OUTPUT });
        assert('Valid request → 200', r.status === 200, `got ${r.status}. JSON: ${JSON.stringify(r.json)}`);
        assert('Content-Type is application/zip',
            r.headers['content-type']?.includes('application/zip'),
            r.headers['content-type']);
        assert('Content-Disposition present',
            r.headers['content-disposition']?.includes('reforge-output.zip'));
        assert('Response is a Buffer', Buffer.isBuffer(r.buffer));
        assert('Response is non-empty', r.buffer.length > 0);
    }

    // ==========================================================================
    // Group 4: Archive structure — required files present under reforge-output/
    // ==========================================================================
    console.log('\n── Group 4: Archive structure ──────────────────────────────────');
    {
        const r = await postRaw(server, '/api/generate-zip', { generatedOutput: VALID_GENERATED_OUTPUT });
        const zip = await JSZip.loadAsync(r.buffer);
        const entries = Object.keys(zip.files);

        // Root prefix must be reforge-output/
        const hasCorrectPrefix = entries.every((e) => e.startsWith('reforge-output/') || e === 'reforge-output/');
        assert('All entries under reforge-output/ prefix', hasCorrectPrefix,
            `entries: ${JSON.stringify(entries.slice(0, 5))}`);

        // Required structural files
        assert('reforge-output/package.json present',
            entries.includes('reforge-output/package.json'),
            JSON.stringify(entries));
        assert('reforge-output/README.md present',
            entries.includes('reforge-output/README.md'),
            JSON.stringify(entries));
        assert('reforge-output/.gitignore present',
            entries.includes('reforge-output/.gitignore'),
            JSON.stringify(entries));

        // src/ files from generatedOutput
        assert('reforge-output/src/App.jsx present',
            entries.includes('reforge-output/src/App.jsx'),
            JSON.stringify(entries));
        assert('reforge-output/src/main.jsx present',
            entries.includes('reforge-output/src/main.jsx'),
            JSON.stringify(entries));
        assert('reforge-output/src/components/Hero.jsx present',
            entries.includes('reforge-output/src/components/Hero.jsx'),
            JSON.stringify(entries));
    }

    // ==========================================================================
    // Group 5: package.json — required fields
    // ==========================================================================
    console.log('\n── Group 5: package.json fields ────────────────────────────────');
    {
        const r = await postRaw(server, '/api/generate-zip', { generatedOutput: VALID_GENERATED_OUTPUT });
        const zip = await JSZip.loadAsync(r.buffer);
        const pkgRaw = await zip.file('reforge-output/package.json').async('string');
        const pkg = JSON.parse(pkgRaw);

        assert('package.json name = "reforge-output"', pkg.name === 'reforge-output', pkg.name);
        assert('package.json version = "1.0.0"', pkg.version === '1.0.0', pkg.version);
        assert('package.json private = true', pkg.private === true, String(pkg.private));
        assert('package.json type = "module"', pkg.type === 'module', pkg.type);
        assert('package.json scripts.dev = "vite"', pkg.scripts?.dev === 'vite', pkg.scripts?.dev);
        assert('package.json scripts.build = "vite build"', pkg.scripts?.build === 'vite build', pkg.scripts?.build);
        assert('package.json has no preview script', pkg.scripts?.preview === undefined,
            `preview="${pkg.scripts?.preview}"`);
        assert('package.json dependencies has react', 'react' in (pkg.dependencies ?? {}));
        assert('package.json dependencies has react-dom', 'react-dom' in (pkg.dependencies ?? {}));
        assert('package.json devDependencies has vite', 'vite' in (pkg.devDependencies ?? {}));
        assert('package.json devDependencies has tailwindcss', 'tailwindcss' in (pkg.devDependencies ?? {}));

        // No timestamp — no Date-like strings
        assert('package.json contains no timestamp', !pkgRaw.includes('generatedAt') && !pkgRaw.includes('Date'));
    }

    // ==========================================================================
    // Group 6: README.md — required content
    // ==========================================================================
    console.log('\n── Group 6: README.md content ──────────────────────────────────');
    {
        const r = await postRaw(server, '/api/generate-zip', { generatedOutput: VALID_GENERATED_OUTPUT });
        const zip = await JSZip.loadAsync(r.buffer);
        const readme = await zip.file('reforge-output/README.md').async('string');

        assert('README.md contains npm install', readme.includes('npm install'), readme.slice(0, 200));
        assert('README.md contains npm run dev', readme.includes('npm run dev'), readme.slice(0, 200));
        assert('README.md contains ReForge attribution', readme.includes('ReForge'), readme.slice(0, 200));
        assert('README.md contains no timestamp', !readme.includes('generatedAt') && !readme.includes(new Date().getFullYear().toString().slice(0, 3)));
    }

    // ==========================================================================
    // Group 7: .gitignore — required entries
    // ==========================================================================
    console.log('\n── Group 7: .gitignore entries ─────────────────────────────────');
    {
        const r = await postRaw(server, '/api/generate-zip', { generatedOutput: VALID_GENERATED_OUTPUT });
        const zip = await JSZip.loadAsync(r.buffer);
        const gitignore = await zip.file('reforge-output/.gitignore').async('string');

        assert('.gitignore contains node_modules', gitignore.includes('node_modules'));
        assert('.gitignore contains dist', gitignore.includes('dist'));
        assert('.gitignore contains .env', gitignore.includes('.env'));
    }

    // ==========================================================================
    // Group 8: src file content round-trip
    // ==========================================================================
    console.log('\n── Group 8: File content round-trip ────────────────────────────');
    {
        const r = await postRaw(server, '/api/generate-zip', { generatedOutput: VALID_GENERATED_OUTPUT });
        const zip = await JSZip.loadAsync(r.buffer);

        for (const file of VALID_GENERATED_OUTPUT.files) {
            const entry = zip.file(`reforge-output/${file.path}`);
            if (entry) {
                const content = await entry.async('string');
                assert(`Content of ${file.path} round-trips correctly`, content === file.content,
                    `length mismatch: got ${content.length}, expected ${file.content.length}`);
            } else {
                assert(`${file.path} found in archive`, false, 'entry missing');
            }
        }
    }

    // ==========================================================================
    // Group 9: Determinism — same input → identical extracted content per file
    // ==========================================================================
    console.log('\n── Group 9: Determinism ────────────────────────────────────────');
    {
        const r1 = await postRaw(server, '/api/generate-zip', { generatedOutput: VALID_GENERATED_OUTPUT });
        const r2 = await postRaw(server, '/api/generate-zip', { generatedOutput: VALID_GENERATED_OUTPUT });

        const zip1 = await JSZip.loadAsync(r1.buffer);
        const zip2 = await JSZip.loadAsync(r2.buffer);

        const entries1 = Object.keys(zip1.files).sort();
        const entries2 = Object.keys(zip2.files).sort();

        assert('Same input → same entry list', JSON.stringify(entries1) === JSON.stringify(entries2),
            `${JSON.stringify(entries1)} vs ${JSON.stringify(entries2)}`);

        // Compare file contents (not raw buffer — compression metadata may differ between runs
        // but extracted content must be byte-identical)
        let contentMismatch = false;
        for (const name of entries1) {
            if (zip1.files[name].dir) continue;
            const c1 = await zip1.file(name).async('string');
            const c2 = await zip2.file(name).async('string');
            if (c1 !== c2) {
                contentMismatch = true;
                results.push(`    ⚠ Content differs for: ${name}`);
                break;
            }
        }
        assert('Same input → identical extracted content per file', !contentMismatch,
            'at least one file had differing content');
    }

    // ==========================================================================
    // Group 10: Security — no eval( in any file
    // ==========================================================================
    console.log('\n── Group 10: Security — no eval( in archive ────────────────────');
    {
        const r = await postRaw(server, '/api/generate-zip', { generatedOutput: VALID_GENERATED_OUTPUT });
        const zip = await JSZip.loadAsync(r.buffer);

        let evalFound = false;
        const evalFiles = [];

        for (const [name, entry] of Object.entries(zip.files)) {
            if (entry.dir) continue;
            const content = await entry.async('string');
            if (content.includes('eval(')) {
                evalFound = true;
                evalFiles.push(name);
            }
        }

        assert('No file in archive contains eval(', !evalFound,
            `eval( found in: ${JSON.stringify(evalFiles)}`);
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
    console.error('\n❌ Phase 15 test suite crashed:', err);
    process.exit(1);
});
