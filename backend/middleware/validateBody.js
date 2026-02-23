/**
 * @fileoverview Zod validation middleware factory for Express route bodies
 * @module backend/middleware/validateBody
 */

/**
 * Returns an Express middleware that validates `req.body` against the given Zod schema.
 *
 * On success: replaces `req.body` with the parsed (type-coerced) result and calls `next()`.
 * On failure: calls `next` with a structured 400 error containing Zod issue details.
 *
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @returns {import('express').RequestHandler} Express middleware function
 *
 * @example
 * router.post('/api/analyze', validateBody(AnalyzeRequestSchema), analyzeHandler);
 */
export function validateBody(schema) {
    return function (req, res, next) {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            const details = result.error.issues.map((issue) => {
                const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
                return `${path}${issue.message}`;
            });

            const err = new Error('Request body validation failed');
            err.statusCode = 400;
            err.code = 'VALIDATION_ERROR';
            err.details = details;
            return next(err);
        }

        // Replace req.body with the validated (possibly coerced) value
        req.body = result.data;
        return next();
    };
}

export default validateBody;
