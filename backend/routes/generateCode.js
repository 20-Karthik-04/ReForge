/**
 * @fileoverview POST /api/generate-code route — generate React component code
 * @module backend/routes/generateCode
 */

import { Router } from 'express';
import {
    GenerateCodeRequestSchema,
    GeneratedOutputSchema,
} from '../../shared/schemas.js';
import { buildRenderPlan } from '../modules/CodeGenerator.js';
import { generateAppComponent } from '../modules/AppGenerator.js';
import { validateBody } from '../middleware/validateBody.js';

const router = Router();

/**
 * POST /api/generate-code
 *
 * Accepts a validated AIRedesignPlan and WebPageAnalysis.
 * Calls the deterministic code generation pipeline (buildRenderPlan → generateAppComponent).
 * Returns a GeneratedOutput with the App.jsx content as an in-memory file.
 *
 * IMPORTANT: This endpoint does NOT write any files to disk.
 *
 * Request body: {
 *   redesignPlan: AIRedesignPlan,
 *   targetAnalysis: WebPageAnalysis
 * }
 * Response: { output: GeneratedOutput }
 */
router.post(
    '/generate-code',
    validateBody(GenerateCodeRequestSchema),
    async (req, res, next) => {
        try {
            const { redesignPlan, targetAnalysis } = req.body;

            // Step 1: Build structured render plan (pure data — validates template registry)
            const renderPlan = buildRenderPlan(redesignPlan, targetAnalysis);

            // Step 2: Generate App.jsx content string (in-memory, no file writes)
            const appJsxContent = generateAppComponent(renderPlan);

            // Step 3: Assemble GeneratedOutput shape
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

            // Step 4: Validate output against schema before sending
            const validatedOutput = GeneratedOutputSchema.parse(generatedOutput);

            return res.status(200).json({ output: validatedOutput });
        } catch (err) {
            return next(err);
        }
    }
);

export default router;
