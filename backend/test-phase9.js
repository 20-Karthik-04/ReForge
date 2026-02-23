/**
 * @fileoverview Phase 9 verification test suite for ReForge API endpoints
 * @module backend/test-phase9
 *
 * Tests all endpoints defined in Phase 9.1–9.5.
 * Runs without any test framework — pure Node.js (requires Node 18+ for fetch).
 *
 * Usage:
 *   NODE_ENV=test node backend/test-phase9.js
 *
 * The server is imported programmatically (no separate process needed) because
 * server.js skips app.listen() when NODE_ENV === 'test'.
 */

import 'dotenv/config';

// ── Server starts in test mode (no listener) — we inject directly to app ─────
process.env.NODE_ENV = 'test';
process.env.PORT = '3099'; // isolated port for tests

// Force-set test PORT before importing the server
const { default: app } = await import('./server.js');
import http from 'http';

// ---------------------------------------------------------------------------
// Test infrastructure
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
const results = [];

/**
 * Asserts a condition and records the result.
 * @param {string} label - Test label
 * @param {boolean} condition - Whether the assertion passes
 * @param {string} [detail] - Optional detail for failures
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
 * Makes a POST request against the app using a local HTTP server.
 * @param {http.Server} server - Bound HTTP server
 * @param {string} path - URL path
 * @param {object} body - JSON body
 * @returns {Promise<{status: number, json: object}>} Response
 */
function post(server, path, body) {
    return new Promise((resolve, reject) => {
        const addr = server.address();
        const port = addr.port;
        const data = JSON.stringify(body);

        const req = http.request(
            {
                hostname: '127.0.0.1',
                port,
                path,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data),
                },
            },
            (res) => {
                let raw = '';
                res.on('data', (chunk) => (raw += chunk));
                res.on('end', () => {
                    let json;
                    try { json = JSON.parse(raw); } catch { json = null; }
                    resolve({ status: res.statusCode, json });
                });
            }
        );

        req.on('error', reject);
        req.setTimeout(15000, () => {
            req.destroy(new Error('Request timed out after 15s'));
        });
        req.write(data);
        req.end();
    });
}

/**
 * Makes a GET request against the app.
 * @param {http.Server} server - Bound HTTP server
 * @param {string} path - URL path
 * @returns {Promise<{status: number, json: object}>} Response
 */
function get(server, path) {
    return new Promise((resolve, reject) => {
        const addr = server.address();
        const port = addr.port;

        const req = http.request(
            { hostname: '127.0.0.1', port, path, method: 'GET' },
            (res) => {
                let raw = '';
                res.on('data', (chunk) => (raw += chunk));
                res.on('end', () => {
                    let json;
                    try { json = JSON.parse(raw); } catch { json = null; }
                    resolve({ status: res.statusCode, json });
                });
            }
        );
        req.on('error', reject);
        req.end();
    });
}

// ---------------------------------------------------------------------------
// Minimal valid test fixtures
// ---------------------------------------------------------------------------

/** Minimal valid WebPageAnalysis fixture */
const VALID_ANALYSIS = {
    url: 'https://example.com',
    title: 'Example Domain',
    sections: [
        {
            type: 'hero',
            contentLength: 100,
            headingCount: 1,
            contentDensity: 50,
            layoutSignal: 'single-column',
        },
        {
            type: 'features',
            contentLength: 200,
            headingCount: 3,
            contentDensity: 60,
            layoutSignal: 'grid',
        },
        {
            type: 'footer',
            contentLength: 50,
            headingCount: 0,
            contentDensity: 20,
            layoutSignal: 'multi-column',
        },
    ],
    issues: [],
    metrics: {
        totalWordCount: 350,
        totalHeadings: 4,
        hasMobileOptimization: true,
    },
};

/** Minimal valid AIRedesignPlan fixture (bypasses AIClient — no network call) */
const VALID_REDESIGN_PLAN = {
    sectionOrdering: ['hero', 'features', 'footer'],
    layoutVariants: {
        hero: 'centered',
        features: 'grid3',
        footer: 'default',
    },
    contentTone: 'professional',
    contentEmphasis: ['value proposition'],
    missingSections: [],
    redundantSections: [],
    componentMappings: [
        {
            sectionType: 'hero',
            templateId: 'hero-template',
            variant: 'centered',
            props: {
                headline: 'Welcome to Example',
            },
        },
        {
            sectionType: 'features',
            templateId: 'features-template',
            variant: 'grid3',
            props: {
                heading: 'Features',
                features: [
                    { title: 'Fast', description: 'Lightning quick', icon: '⚡' },
                    { title: 'Secure', description: 'Safe and secure', icon: '🔒' },
                    { title: 'Easy', description: 'Simple to use', icon: '✅' },
                ],
            },
        },
        {
            sectionType: 'footer',
            templateId: 'footer-template',
            variant: 'default',
            props: {
                logoText: 'Example',
                linkGroups: [],
            },
        },
    ],
    // sectionProps takes precedence over componentMappings.props
    sectionProps: {
        hero: { headline: 'Welcome to Example' },
        features: {
            heading: 'Features',
            features: [
                { title: 'Fast', description: 'Lightning quick', icon: '⚡' },
                { title: 'Secure', description: 'Safe and secure', icon: '🔒' },
                { title: 'Easy', description: 'Simple to use', icon: '✅' },
            ],
        },
        footer: { logoText: 'Example', linkGroups: [] },
    },
};

// ---------------------------------------------------------------------------
// Run tests
// ---------------------------------------------------------------------------

async function run() {
    // Bind the app to a random available port
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address();
    console.log(`\n🧪 Phase 9 test suite running on port ${port}\n`);

    // ==========================================================================
    // Group 1: Health check
    // ==========================================================================
    console.log('── Group 1: Health check ──────────────────────────────────────');
    {
        const r = await get(server, '/health');
        assert('GET /health returns 200', r.status === 200, `got ${r.status}`);
        assert('GET /health returns status:ok', r.json?.status === 'ok', JSON.stringify(r.json));
    }

    // ==========================================================================
    // Group 2: POST /api/analyze — validation & SSRF
    // ==========================================================================
    console.log('\n── Group 2: POST /api/analyze ─────────────────────────────────');
    {
        // Missing url
        const r1 = await post(server, '/api/analyze', {});
        assert('Missing url → 400', r1.status === 400, `got ${r1.status}`);
        assert('Missing url → VALIDATION_ERROR code', r1.json?.error?.code === 'VALIDATION_ERROR');

        // Invalid URL format
        const r2 = await post(server, '/api/analyze', { url: 'not-a-url' });
        assert('Invalid URL format → 400', r2.status === 400, `got ${r2.status}`);

        // SSRF: localhost
        const r3 = await post(server, '/api/analyze', { url: 'http://localhost/admin' });
        assert('SSRF localhost → 400', r3.status === 400, `got ${r3.status}`);
        assert('SSRF localhost → SSRF_BLOCKED code', r3.json?.error?.code === 'SSRF_BLOCKED');

        // SSRF: explicit 127.0.0.1 (resolves to loopback)
        const r4 = await post(server, '/api/analyze', { url: 'http://127.0.0.1/' });
        assert('SSRF 127.0.0.1 → 400', r4.status === 400, `got ${r4.status}`);

        // SSRF: private IP 192.168.1.1
        const r5 = await post(server, '/api/analyze', { url: 'http://192.168.1.1/' });
        assert('SSRF 192.168.1.1 → 400', r5.status === 400, `got ${r5.status}`);

        // SSRF: private IP 10.0.0.1
        const r6 = await post(server, '/api/analyze', { url: 'http://10.0.0.1/' });
        assert('SSRF 10.0.0.1 → 400', r6.status === 400, `got ${r6.status}`);

        // Non-http protocol
        const r7 = await post(server, '/api/analyze', { url: 'ftp://example.com' });
        assert('FTP protocol → 400', r7.status === 400, `got ${r7.status}`);
        assert('FTP protocol → DISALLOWED_PROTOCOL', r7.json?.error?.code === 'DISALLOWED_PROTOCOL');
    }

    // ==========================================================================
    // Group 3: POST /api/reference-analyze — validation & SSRF
    // ==========================================================================
    console.log('\n── Group 3: POST /api/reference-analyze ───────────────────────');
    {
        const r1 = await post(server, '/api/reference-analyze', {});
        assert('Missing url → 400', r1.status === 400, `got ${r1.status}`);

        const r2 = await post(server, '/api/reference-analyze', { url: 'http://127.0.0.1/' });
        assert('SSRF 127.0.0.1 → 400', r2.status === 400, `got ${r2.status}`);

        const r3 = await post(server, '/api/reference-analyze', { url: 'javascript://evil' });
        assert('javascript: protocol → 400', r3.status === 400, `got ${r3.status}`);
    }

    // ==========================================================================
    // Group 4: POST /api/generate-plan — validation
    // ==========================================================================
    console.log('\n── Group 4: POST /api/generate-plan ───────────────────────────');
    {
        // Missing required fields
        const r1 = await post(server, '/api/generate-plan', {});
        assert('Empty body → 400', r1.status === 400, `got ${r1.status}`);

        // Missing goals array
        const r2 = await post(server, '/api/generate-plan', {
            targetAnalysis: VALID_ANALYSIS,
        });
        assert('Missing goals → 400', r2.status === 400, `got ${r2.status}`);

        // Invalid goal value
        const r3 = await post(server, '/api/generate-plan', {
            targetAnalysis: VALID_ANALYSIS,
            goals: ['invalid_goal_xyz'],
        });
        assert('Invalid goal → 400', r3.status === 400, `got ${r3.status}`);

        // Valid structure without referenceAnalysis — goes to AIClient (may use fallback)
        const r4 = await post(server, '/api/generate-plan', {
            targetAnalysis: VALID_ANALYSIS,
            goals: ['modern_design'],
        });
        assert('Valid request → 200', r4.status === 200, `got ${r4.status}`);
        assert('Response has plan key', 'plan' in (r4.json || {}));
        assert('plan.sectionOrdering is array', Array.isArray(r4.json?.plan?.sectionOrdering));
        assert('plan.componentMappings is array', Array.isArray(r4.json?.plan?.componentMappings));

        console.log(`   (Note: AI used ${r4.json?.plan ? 'fallback or real' : 'unknown'} plan)`);
    }

    // ==========================================================================
    // Group 5: POST /api/generate-code — validation and generation
    // ==========================================================================
    console.log('\n── Group 5: POST /api/generate-code ───────────────────────────');
    {
        // Missing body
        const r1 = await post(server, '/api/generate-code', {});
        assert('Empty body → 400', r1.status === 400, `got ${r1.status}`);

        // Missing targetAnalysis
        const r2 = await post(server, '/api/generate-code', {
            redesignPlan: VALID_REDESIGN_PLAN,
        });
        assert('Missing targetAnalysis → 400', r2.status === 400, `got ${r2.status}`);

        // Missing redesignPlan
        const r3 = await post(server, '/api/generate-code', {
            targetAnalysis: VALID_ANALYSIS,
        });
        assert('Missing redesignPlan → 400', r3.status === 400, `got ${r3.status}`);

        // Valid request — should succeed deterministically (no AI, no network)
        const r4 = await post(server, '/api/generate-code', {
            redesignPlan: VALID_REDESIGN_PLAN,
            targetAnalysis: VALID_ANALYSIS,
        });
        assert('Valid request → 200', r4.status === 200, `got ${r4.status}. Error: ${JSON.stringify(r4.json?.error)}`);
        assert('Response has output key', 'output' in (r4.json || {}));
        assert('output.files is array', Array.isArray(r4.json?.output?.files));
        assert('output.files[0].path is src/App.jsx', r4.json?.output?.files?.[0]?.path === 'src/App.jsx');
        assert('output.files[0].content is string', typeof r4.json?.output?.files?.[0]?.content === 'string');
        assert('App.jsx contains HeroSection', r4.json?.output?.files?.[0]?.content?.includes('HeroSection'));
        assert('App.jsx contains FeaturesSection', r4.json?.output?.files?.[0]?.content?.includes('FeaturesSection'));
        assert('App.jsx contains Footer', r4.json?.output?.files?.[0]?.content?.includes('Footer'));
        assert('output.previewMetadata.entryPoint correct', r4.json?.output?.previewMetadata?.entryPoint === 'src/App.jsx');
        assert('output.previewMetadata.framework is react', r4.json?.output?.previewMetadata?.framework === 'react');

        // Determinism check — same input twice must produce identical content
        const r5 = await post(server, '/api/generate-code', {
            redesignPlan: VALID_REDESIGN_PLAN,
            targetAnalysis: VALID_ANALYSIS,
        });
        assert(
            'Determinism: same input → identical App.jsx',
            r4.json?.output?.files?.[0]?.content === r5.json?.output?.files?.[0]?.content,
            'contents differed between two identical requests'
        );
    }

    // ==========================================================================
    // Group 6: Unknown routes
    // ==========================================================================
    console.log('\n── Group 6: Unknown routes ─────────────────────────────────────');
    {
        const r1 = await get(server, '/api/unknown-endpoint');
        assert('Unknown route → 404', r1.status === 404, `got ${r1.status}`);
        assert('Unknown route → NOT_FOUND code', r1.json?.error?.code === 'NOT_FOUND');
    }

    // ==========================================================================
    // Summary
    // ==========================================================================
    console.log('\n═══════════════════════════════════════════════════════════════');
    results.forEach((line) => console.log(line));
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`\nResults: ${passed} passed, ${failed} failed\n`);

    server.close();

    if (failed > 0) {
        process.exit(1);
    }
}

run().catch((err) => {
    console.error('\n❌ Test suite crashed:', err);
    process.exit(1);
});
