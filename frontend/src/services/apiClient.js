/**
 * @file apiClient.js
 * @description Pure transport layer for the ReForge backend API.
 *
 * Exports one function per backend endpoint. Each function:
 *  - Uses a shared axios instance with base URL from env.
 *  - Makes a single POST request and returns the parsed response data.
 *  - Throws a structured { message, code, status } error on non-2xx.
 *
 * Rules enforced:
 *  - No business logic.
 *  - No dispatch calls.
 *  - No navigation.
 *  - No retry logic.
 */

import axios from 'axios';

// ─── Axios Instance ─────────────────────────────────────────────────────────

/**
 * Shared axios instance pre-configured with the backend base URL.
 * Base URL is read from the Vite env variable VITE_API_URL, falling
 * back to the default local dev server address.
 */
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
    headers: {
        'Content-Type': 'application/json',
    },
});

// ─── Response Interceptor — Structured Error Normalisation ──────────────────

/**
 * Intercepts every failed response and converts it into a structured error
 * object before it propagates to callers. This ensures the reducer never
 * receives a raw Axios error.
 *
 * Structured error shape: { message: string, code?: string, status?: number }
 */
api.interceptors.response.use(
    (response) => response,
    (axiosError) => {
        /** @type {{ message: string, code?: string, status?: number }} */
        const structured = {
            message: 'An unexpected error occurred. Please try again.',
            code: 'UNKNOWN_ERROR',
        };

        if (axiosError.response) {
            // Backend responded with a non-2xx status
            structured.status = axiosError.response.status;
            const body = axiosError.response.data;

            if (body?.error?.message) {
                structured.message = body.error.message;
                structured.code = body.error.code ?? 'API_ERROR';
            } else if (body?.message) {
                structured.message = body.message;
                structured.code = body.code ?? 'API_ERROR';
            } else {
                structured.message = `Request failed with status ${axiosError.response.status}.`;
                structured.code = 'HTTP_ERROR';
            }
        } else if (axiosError.request) {
            // Request was made but no response received (network error)
            structured.message =
                'Unable to reach the ReForge server. Check your network connection.';
            structured.code = 'NETWORK_ERROR';
        }

        return Promise.reject(structured);
    }
);

// ─── API Functions ──────────────────────────────────────────────────────────

/**
 * Crawls and analyzes the target website URL.
 *
 * @param {string} url - The target website URL to analyze.
 * @returns {Promise<{ analysis: object }>} Resolved response data.
 * @throws {{ message: string, code: string, status?: number }}
 */
export async function analyzeURL(url) {
    const response = await api.post('/api/analyze', { url });
    return response.data;
}

/**
 * Crawls and analyzes the reference website URL for layout inspiration.
 *
 * @param {string} url - The reference website URL.
 * @returns {Promise<{ analysis: object }>} Resolved response data.
 * @throws {{ message: string, code: string, status?: number }}
 */
export async function analyzeReference(url) {
    const response = await api.post('/api/reference-analyze', { url });
    return response.data;
}

/**
 * Sends target analysis, optional reference analysis, and goals to the AI
 * planning endpoint and returns a structured redesign plan.
 *
 * @param {{ targetAnalysis: object, referenceAnalysis: object|null, goals: string[] }} data
 * @returns {Promise<{ plan: object }>} Resolved response data.
 * @throws {{ message: string, code: string, status?: number }}
 */
export async function generatePlan(data) {
    const response = await api.post('/api/generate-plan', data);
    return response.data;
}

/**
 * Passes the redesign plan and target analysis to the deterministic code
 * generation engine and returns a GeneratedOutput.
 *
 * @param {{ redesignPlan: object, targetAnalysis: object }} data
 * @returns {Promise<{ output: object }>} Resolved response data.
 * @throws {{ message: string, code: string, status?: number }}
 */
export async function generateCode(data) {
    const response = await api.post('/api/generate-code', data);
    return response.data;
}

/**
 * Packages a GeneratedOutput into a downloadable ZIP archive.
 * Response is returned as an ArrayBuffer for client-side file saving.
 *
 * NOTE: This function is implemented but not yet wired to UI (Phase 13+).
 *
 * @param {{ generatedOutput: object }} data
 * @returns {Promise<ArrayBuffer>} Raw ZIP bytes.
 * @throws {{ message: string, code: string, status?: number }}
 */
export async function downloadZIP(data) {
    const response = await api.post('/api/generate-zip', data, {
        responseType: 'arraybuffer',
    });
    return response.data;
}
