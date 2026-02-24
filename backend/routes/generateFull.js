/**
 * @fileoverview POST /api/generate-full route — full pipeline: crawl → analyze → plan → generate → zip
 * @module backend/routes/generateFull
 *
 * Pipeline (in order):
 *  1. Validate request body
 *  2. SSRF-guard both url and referenceUrl (if present)
 *  3. Crawl + analyze target URL  → WebPageAnalysis
 *  4. Crawl + analyze referenceUrl (optional) → ReferenceAnalysis | null
 *  5. AIClient.generateRedesignPlan() → AIRedesignPlan
 *  6. buildRenderPlan() → RenderPlanItem[]
 *  7. generateAppComponent() → App.jsx string
 *  8. Assemble GeneratedOutput
 *  9. buildZipBuffer() → ZIP buffer
 * 10. Return ZIP
 *
 * Security:
 *  - checkSsrf() applied independently to url and referenceUrl before any network I/O
 *  - No raw HTML or AI responses are logged
 *
 * Determinism:
 *  - Same inputs → identical ZIP bytes (via buildZipBuffer deterministic guarantees)
 */

import { Router } from 'express';
import { GenerateFullRequestSchema } from '../../shared/schemas.js';
import { validateBody } from '../middleware/validateBody.js';
import { checkSsrf } from '../middleware/ssrfGuard.js';
import { WebCrawler } from '../modules/WebCrawler.js';
import { AnalysisBuilder } from '../modules/AnalysisBuilder.js';
import { ReferenceCrawler } from '../modules/ReferenceCrawler.js';
import { AIClient } from '../modules/AIClient.js';
import { buildRenderPlan } from '../modules/CodeGenerator.js';
import { generateAppComponent } from '../modules/AppGenerator.js';
import { buildZipBuffer } from './generateZip.js';

const router = Router();

/**
 * POST /api/generate-full
 *
 * Runs the complete ReForge pipeline in a single request and returns a ZIP archive.
 *
 * Request body: {
 *   url: string,
 *   referenceUrl?: string,
 *   goals: RedesignGoal[]
 * }
 * Response: Binary ZIP stream (Content-Type: application/zip)
 *
 * If any stage fails the pipeline is aborted and a structured JSON error is returned.
 */
router.post(
    '/generate-full',
    validateBody(GenerateFullRequestSchema),
    async (req, res, next) => {
        try {
            const { url, referenceUrl, goals } = req.body;

            // ── Stage 0: SSRF protection for both URLs ────────────────────────
            // checkSsrf() throws a structured error on violation (picked up by errorHandler)
            await checkSsrf(url);
            if (referenceUrl) {
                await checkSsrf(referenceUrl);
            }

            // ── Stage 1: Crawl + analyze target → WebPageAnalysis ─────────────
            const crawler = new WebCrawler();
            const { html, finalUrl } = await crawler.fetch(url);
            const targetAnalysis = await AnalysisBuilder.build(finalUrl, html);

            // ── Stage 2: Crawl + analyze reference (optional) ─────────────────
            let referenceAnalysis = null;
            if (referenceUrl) {
                const referenceCrawler = new ReferenceCrawler();
                referenceAnalysis = await referenceCrawler.analyze(referenceUrl);
            }

            // ── Stage 3: AI redesign plan ─────────────────────────────────────
            const aiClient = new AIClient();
            const redesignPlan = await aiClient.generateRedesignPlan(
                targetAnalysis,
                goals,
                referenceAnalysis
            );

            // ── Stage 4: Deterministic code generation ─────────────────────────
            const renderPlan = buildRenderPlan(redesignPlan, targetAnalysis);
            const appJsxContent = generateAppComponent(renderPlan);

            // ── Stage 5: Assemble GeneratedOutput (mirrors generate-code route) ─
            const generatedOutput = {
                files: [
                    {
                        path: 'src/App.jsx',
                        content: appJsxContent,
                        type: 'component',
                    },
                ],
                dependencies: [
                    { package: 'react', version: '^18.0.0' },
                    { package: 'react-dom', version: '^18.0.0' },
                ],
                previewMetadata: {
                    entryPoint: 'src/App.jsx',
                    framework: 'react',
                },
            };

            // ── Stage 6: Create in-memory ZIP ────────────────────────────────
            const zipBuffer = await buildZipBuffer(generatedOutput);

            res.set('Content-Type', 'application/zip');
            res.set('Content-Disposition', 'attachment; filename="reforge-output.zip"');
            return res.send(zipBuffer);
        } catch (err) {
            return next(err);
        }
    }
);

export default router;
