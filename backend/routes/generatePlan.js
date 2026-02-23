/**
 * @fileoverview POST /api/generate-plan route — generate AI redesign plan
 * @module backend/routes/generatePlan
 */

import { Router } from 'express';
import { GeneratePlanRequestSchema } from '../../shared/schemas.js';
import { AIClient } from '../modules/AIClient.js';
import { validateBody } from '../middleware/validateBody.js';

const router = Router();

/**
 * POST /api/generate-plan
 *
 * Accepts a validated WebPageAnalysis (and optional ReferenceAnalysis + goals),
 * calls the AIClient to generate a structured redesign plan.
 *
 * Request body: {
 *   targetAnalysis: WebPageAnalysis,
 *   referenceAnalysis?: ReferenceAnalysis,
 *   goals: RedesignGoal[]
 * }
 * Response: { plan: AIRedesignPlan }
 */
router.post(
    '/generate-plan',
    validateBody(GeneratePlanRequestSchema),
    async (req, res, next) => {
        try {
            const { targetAnalysis, referenceAnalysis, goals } = req.body;

            // AIClient uses env vars for API key / model configuration
            const aiClient = new AIClient();
            const plan = await aiClient.generateRedesignPlan(
                targetAnalysis,
                goals,
                referenceAnalysis ?? null
            );

            return res.status(200).json({ plan });
        } catch (err) {
            return next(err);
        }
    }
);

export default router;
