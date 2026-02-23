/**
 * @fileoverview Backend server entry point for ReForge API
 * @module backend/server
 *
 * Starts an Express server with:
 *  - CORS for frontend access
 *  - JSON body parsing (1 MB limit)
 *  - Morgan request logging
 *  - API routes mounted at /api
 *  - Centralized error handling
 *
 * Conditional listen:
 *  The app is exported without calling app.listen() when NODE_ENV === 'test',
 *  so test scripts can import the app without spawning duplicate listeners.
 */

import 'dotenv/config';

import express from 'express';
import cors from 'cors';

// Routes
import analyzeRouter from './routes/analyze.js';
import referenceAnalyzeRouter from './routes/referenceAnalyze.js';
import generatePlanRouter from './routes/generatePlan.js';
import generateCodeRouter from './routes/generateCode.js';

// Middleware
import { errorHandler } from './middleware/errorHandler.js';

// ---------------------------------------------------------------------------
// App configuration
// ---------------------------------------------------------------------------

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security: CORS ──────────────────────────────────────────────────────────
// Allow the frontend dev server and configured frontend origin
const allowedOrigins = [
    'http://localhost:5173',  // Vite default
    'http://localhost:3000',  // CRA default
    process.env.FRONTEND_URL, // Production origin (optional)
].filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (e.g. server-to-server, curl)
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) return callback(null, true);
            return callback(new Error(`CORS: origin '${origin}' not allowed`));
        },
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    })
);

// ── Body parsing: JSON with 1 MB limit ─────────────────────────────────────
// Prevents excessively large payloads from overwhelming the server
app.use(express.json({ limit: '1mb' }));

// ── Request logging ─────────────────────────────────────────────────────────
// Use morgan only when not in test mode (keeps test output clean)
if (process.env.NODE_ENV !== 'test') {
    // Dynamic import so morgan is not a hard dependency during tests
    const morgan = (await import('morgan')).default;
    app.use(morgan('dev'));
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'reforge-api' });
});

// ---------------------------------------------------------------------------
// API Routes — each router is a thin delegation layer
// ---------------------------------------------------------------------------

app.use('/api', analyzeRouter);
app.use('/api', referenceAnalyzeRouter);
app.use('/api', generatePlanRouter);
app.use('/api', generateCodeRouter);

// ── 404 handler for unregistered routes ─────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({
        error: { message: 'Not found', code: 'NOT_FOUND' },
    });
});

// ── Centralized error middleware (must be registered LAST) ───────────────────
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Start listening — skipped in test mode to prevent duplicate servers
// ---------------------------------------------------------------------------

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`✓ ReForge API server running on http://localhost:${PORT}`);
        console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
        console.log(`  LLM provider: ${process.env.LLM_PROVIDER || 'openai'}`);
    });
}

export default app;
