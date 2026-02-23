/**
 * @fileoverview Centralized error handling middleware for ReForge API
 * @module backend/middleware/errorHandler
 */

import { ZodError } from 'zod';

/**
 * Formats Zod validation issues into a concise array of messages
 * @param {import('zod').ZodIssue[]} issues - Zod validation issues
 * @returns {string[]} Human-readable error messages
 */
function formatZodIssues(issues) {
    return issues.map((issue) => {
        const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
        return `${path}${issue.message}`;
    });
}

/**
 * Express centralized error middleware (must be registered last with 4 parameters)
 *
 * Error shape returned:
 * ```json
 * {
 *   "error": {
 *     "message": "Human-readable message",
 *     "code": "VALIDATION_ERROR | INTERNAL_ERROR | ...",
 *     "details": ["field: issue", ...]   // only for validation errors
 *   }
 * }
 * ```
 *
 * @param {Error} err - Error object
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next (required for 4-arg signature)
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
    const isProd = process.env.NODE_ENV === 'production';

    // ── Zod validation error (from validateBody middleware) ──────────────────
    if (err instanceof ZodError) {
        return res.status(400).json({
            error: {
                message: 'Request validation failed',
                code: 'VALIDATION_ERROR',
                details: formatZodIssues(err.issues),
            },
        });
    }

    // ── Structured error thrown by middleware (e.g. ssrfGuard, validateBody) ─
    if (err.statusCode) {
        const body = {
            error: {
                message: err.message || 'Request error',
                code: err.code || 'REQUEST_ERROR',
            },
        };
        if (err.details) {
            body.error.details = err.details;
        }
        return res.status(err.statusCode).json(body);
    }

    // ── Unexpected / internal errors ─────────────────────────────────────────
    console.error('[ReForge] Unhandled error:', isProd ? err.message : err);

    return res.status(500).json({
        error: {
            message: isProd ? 'Internal server error' : (err.message || 'Internal server error'),
            code: 'INTERNAL_ERROR',
            // Never expose stack traces in production
            ...(isProd ? {} : { stack: err.stack }),
        },
    });
}

export default errorHandler;
