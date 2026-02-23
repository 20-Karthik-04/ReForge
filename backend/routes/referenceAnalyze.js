/**
 * @fileoverview POST /api/reference-analyze route — crawl + analyze a reference webpage
 * @module backend/routes/referenceAnalyze
 */

import { Router } from 'express';
import { ReferenceAnalyzeRequestSchema } from '../../shared/schemas.js';
import { ReferenceCrawler } from '../modules/ReferenceCrawler.js';
import { validateBody } from '../middleware/validateBody.js';
import { ssrfGuard } from '../middleware/ssrfGuard.js';

const router = Router();

/**
 * POST /api/reference-analyze
 *
 * Crawls the reference URL and extracts layout/structural patterns.
 * Returns a ReferenceAnalysis (no textual content — layout only).
 *
 * Request body: { url: string }
 * Response:     { analysis: ReferenceAnalysis }
 */
router.post(
    '/reference-analyze',
    validateBody(ReferenceAnalyzeRequestSchema),
    ssrfGuard,
    async (req, res, next) => {
        try {
            const { url } = req.body;

            const referenceCrawler = new ReferenceCrawler();
            const analysis = await referenceCrawler.analyze(url);

            return res.status(200).json({ analysis });
        } catch (err) {
            return next(err);
        }
    }
);

export default router;
