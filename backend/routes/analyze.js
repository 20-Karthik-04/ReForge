/**
 * @fileoverview POST /api/analyze route — crawl + analyze a target webpage
 * @module backend/routes/analyze
 */

import { Router } from 'express';
import { AnalyzeRequestSchema } from '../../shared/schemas.js';
import { WebCrawler } from '../modules/WebCrawler.js';
import { AnalysisBuilder } from '../modules/AnalysisBuilder.js';
import { validateBody } from '../middleware/validateBody.js';
import { ssrfGuard } from '../middleware/ssrfGuard.js';

const router = Router();

/**
 * POST /api/analyze
 *
 * Crawls the target URL, parses the HTML, and returns a structured WebPageAnalysis.
 *
 * Request body: { url: string }
 * Response:     { analysis: WebPageAnalysis }
 */
router.post(
    '/analyze',
    validateBody(AnalyzeRequestSchema),
    ssrfGuard,
    async (req, res, next) => {
        try {
            const { url } = req.body;

            const crawler = new WebCrawler();
            const { html, finalUrl } = await crawler.fetch(url);

            // Use finalUrl (after redirects) as the canonical URL in the analysis
            const analysis = await AnalysisBuilder.build(finalUrl, html);

            return res.status(200).json({ analysis });
        } catch (err) {
            return next(err);
        }
    }
);

export default router;
