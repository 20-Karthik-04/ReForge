/**
 * @fileoverview AI Client service for Groq API integration
 * @module backend/modules/AIClient
 *
 * PROVIDER: Groq  —  endpoint: https://api.groq.com/openai/v1/chat/completions
 * AI is used ONLY for high-level redesign planning – NOT for code generation.
 * All code generation remains fully deterministic.
 */

/* global setTimeout, fetch */

import { validateAIRedesignPlan, WebPageAnalysisSchema } from '../../shared/schemas.js';
import { PromptBuilder } from './PromptBuilder.js';

/** Groq REST API endpoint (OpenAI-compatible) */
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/** Default model – low temperature to preserve planning stability */
const GROQ_DEFAULT_MODEL = 'llama-3.3-70b-versatile';

/**
 * AIClient service for generating redesign plans using the Groq LLM API.
 * AI assists ONLY in planning; code generation remains deterministic.
 */
export class AIClient {
    /**
     * Creates a new AIClient instance.
     * @param {Object} options - Configuration options
     * @param {string} [options.apiKey]    - Groq API key (defaults to GROQ_API_KEY env var)
     * @param {string} [options.apiUrl]    - Override API endpoint (for testing)
     * @param {string} [options.model]     - Override model name
     * @param {number} [options.timeout=30000]   - Request timeout in milliseconds
     * @param {number} [options.maxRetries=3]    - Maximum number of retry attempts
     */
    constructor(options = {}) {
        this.apiKey = options.apiKey || process.env.GROQ_API_KEY;
        this.apiUrl = options.apiUrl || GROQ_API_URL;
        this.model = options.model || process.env.LLM_MODEL || GROQ_DEFAULT_MODEL;
        this.timeout = options.timeout || 30000;
        this.maxRetries = options.maxRetries || 3;

        if (!this.apiKey) {
            console.warn('⚠️  GROQ_API_KEY not configured. AI client will use fallback plans.');
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC API  (signatures preserved exactly)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Generates a redesign plan using the Groq LLM.
     * Pipeline order is preserved: validate → build prompt → validate prompt →
     * call provider → parse JSON → validate schema → return plan.
     *
     * @param {Object}   targetAnalysis    - WebPageAnalysis object
     * @param {string[]} goals             - Array of redesign goals
     * @param {Object}   [referenceAnalysis] - Optional ReferenceAnalysis object
     * @returns {Promise<Object>} AIRedesignPlan object
     * @throws {Error} If input validation fails (programming error, not AI error)
     */
    async generateRedesignPlan(targetAnalysis, goals, referenceAnalysis = null) {
        // CRITICAL: Input validation runs OUTSIDE the AI-failure catch block.
        // A bad input is a programming error, not an AI service failure — it must
        // NOT be silently absorbed and replaced with a fallback plan.
        this._validateInputSafety(targetAnalysis);

        try {
            // Build prompt from structured data
            const prompt = PromptBuilder.buildPrompt(targetAnalysis, goals, referenceAnalysis);

            // Validate the constructed prompt for safety before transmission.
            // validatePromptSafety only emits console.warn for PII — it throws
            // only on hard violations (raw HTML, script tags).
            PromptBuilder.validatePromptSafety(prompt.user);

            // Log prompt structure (no sensitive data)
            console.log('📤 Sending structured redesign request to Groq AI...');
            console.log(`   Goals: ${goals.join(', ')}`);
            console.log(`   Sections to analyze: ${targetAnalysis.sections.length}`);

            // Make API request with retry logic
            const responseText = await this._makeRequest(prompt);

            // Parse and validate response
            const plan = this._parseResponse(responseText);

            // Log success (no sensitive data)
            console.log('✓ AI redesign plan generated successfully');
            console.log(`   Recommended sections: ${plan.sectionOrdering.length}`);
            console.log(`   Component mappings: ${plan.componentMappings.length}`);

            return plan;
        } catch (error) {
            console.warn('⚠️  AI plan generation failed:', error.message);
            console.log('   Using fallback default plan...');

            // Return fallback plan (only reached on AI API / parse / schema errors)
            return this._getDefaultPlan(targetAnalysis);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE METHODS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * CRITICAL: Validates input safety before sending to AI.
     * Ensures no raw HTML, scripts, DOM, or unbounded strings are present.
     * @private
     * @param {Object} targetAnalysis - WebPageAnalysis to validate
     * @throws {Error} If input contains unsafe data
     */
    _validateInputSafety(targetAnalysis) {
        // Re-validate against schema to ensure structured data only
        try {
            WebPageAnalysisSchema.parse(targetAnalysis);
        } catch (schemaError) {
            throw new Error(`Input validation failed: Invalid WebPageAnalysis schema - ${schemaError.message}`);
        }

        const jsonString = JSON.stringify(targetAnalysis);

        // Reject if contains HTML tags (indicates raw HTML leaked in)
        if (/<\/?[a-z][\s\S]*>/i.test(jsonString)) {
            throw new Error('Input validation failed: Raw HTML detected in analysis data');
        }

        // Reject if contains script tags or javascript: protocol
        if (/(<script|javascript:)/i.test(jsonString)) {
            throw new Error('Input validation failed: Script content detected in analysis data');
        }

        // Reject if contains suspiciously long strings (>10000 chars in a single field)
        if (/"[^"]{10000,}"/.test(jsonString)) {
            throw new Error('Input validation failed: Unbounded string detected (possible raw DOM)');
        }

        // Reject data URIs or script URLs
        if (
            targetAnalysis.url &&
            (targetAnalysis.url.startsWith('data:') || targetAnalysis.url.startsWith('javascript:'))
        ) {
            throw new Error('Input validation failed: Invalid URL protocol');
        }
    }

    /**
     * Parses and validates the AI response.
     * CRITICAL: Strict JSON-only parsing — rejects JSX, HTML, and non-JSON content.
     * @private
     * @param {string} responseText - Raw AI response text
     * @returns {Object} Validated AIRedesignPlan
     * @throws {Error} If response is invalid or contains non-JSON content
     */
    _parseResponse(responseText) {
        // Guard: empty or missing content from provider must throw, not silently fail
        if (!responseText || !responseText.trim()) {
            throw new Error('AI response parsing failed: Empty LLM response');
        }

        let jsonText = responseText.trim();

        // Primary strip: capture group extracts the content between fences precisely
        const codeBlockMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
        if (codeBlockMatch) {
            jsonText = codeBlockMatch[1].trim();
        } else {
            // Secondary strip: belt-and-suspenders for edge cases where Groq wraps
            // without a trailing newline before the closing fence
            jsonText = jsonText.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
        }

        // CRITICAL: Reject if contains JSX tags (React components)
        if (/<[A-Z][a-zA-Z0-9]*[\s\S]*?>/.test(jsonText)) {
            throw new Error('AI response validation failed: JSX component tags detected (expected JSON only)');
        }

        // CRITICAL: Reject if contains HTML tags
        if (/<\/?[a-z][\s\S]*>/i.test(jsonText)) {
            throw new Error('AI response validation failed: HTML tags detected (expected JSON only)');
        }

        // CRITICAL: Reject non-JSON code fences
        if (/```(?!json)[\w-]+/.test(responseText)) {
            throw new Error('AI response validation failed: Non-JSON code blocks detected (expected JSON only)');
        }

        // Parse JSON
        let parsedData;
        try {
            parsedData = JSON.parse(jsonText);
        } catch (parseError) {
            throw new Error(`AI response parsing failed: Invalid JSON - ${parseError.message}`);
        }

        // CRITICAL: Validate against AIRedesignPlan schema (strict validation)
        try {
            return validateAIRedesignPlan(parsedData);
        } catch (validationError) {
            throw new Error(`AI response validation failed: Schema mismatch - ${validationError.message}`);
        }
    }

    /**
     * Makes a Groq API request (OpenAI-compatible) with retry logic.
     * Uses native fetch — no external HTTP library required.
     *
     * @private
     * @param {Object} prompt   - Structured prompt object { system, user }
     * @param {number} [attempt=1] - Current attempt number
     * @returns {Promise<string>} AI response text (content field)
     * @throws {Error} If all retries fail
     */
    async _makeRequest(prompt, attempt = 1) {
        if (!this.apiKey) {
            throw new Error('GROQ_API_KEY not configured');
        }

        const requestBody = {
            model: this.model,
            messages: [
                { role: 'system', content: prompt.system },
                { role: 'user', content: prompt.user },
            ],
            temperature: 0.2,          // Low temperature to preserve planning stability
            // Note: response_format is NOT used — mixtral-8x7b-32768 does not support it.
            // JSON output is enforced via the system prompt's explicit JSON-only constraint.
        };

        // AbortController for timeout enforcement
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        let response;
        try {
            response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal,
            });
        } catch (fetchError) {
            clearTimeout(timeoutId);

            // Network-level error or abort (timeout)
            const isTimeout = fetchError.name === 'AbortError';
            const shouldRetry = attempt < this.maxRetries && isTimeout;

            if (shouldRetry) {
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                console.log(`   Retry ${attempt}/${this.maxRetries} after ${delay}ms...`);
                await this._sleep(delay);
                return this._makeRequest(prompt, attempt + 1);
            }

            throw new Error(`LLM API request failed: ${isTimeout ? 'Request timed out' : fetchError.message}`);
        }

        clearTimeout(timeoutId);

        // Handle HTTP-level errors
        if (!response.ok) {
            const status = response.status;
            const shouldRetry =
                attempt < this.maxRetries &&
                (status === 429 || status === 500 || status === 503);

            if (shouldRetry) {
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                console.log(`   Retry ${attempt}/${this.maxRetries} after ${delay}ms (HTTP ${status})...`);
                await this._sleep(delay);
                return this._makeRequest(prompt, attempt + 1);
            }

            // Wrap provider error — do NOT leak raw error body
            throw new Error(`LLM API request failed: HTTP ${status}`);
        }

        let data;
        try {
            data = await response.json();
        } catch {
            throw new Error('LLM API request failed: Invalid JSON in provider response');
        }

        // Log token usage
        const usage = data.usage;
        if (usage) {
            console.log(
                `   Tokens used: ${usage.total_tokens} ` +
                `(prompt: ${usage.prompt_tokens}, completion: ${usage.completion_tokens})`
            );
        }

        // Extract content from OpenAI-compatible response shape
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
            throw new Error('Empty response from Groq API');
        }

        return content;
    }

    /**
     * Generates a fallback default plan when AI is unavailable.
     * @private
     * @param {Object} targetAnalysis - WebPageAnalysis object
     * @returns {Object} Default AIRedesignPlan
     */
    _getDefaultPlan(targetAnalysis) {
        const sectionTypes = targetAnalysis.sections.map((s) => s.type);

        const standardOrder = [
            'navigation', 'hero', 'features', 'benefits', 'courses',
            'testimonials', 'pricing', 'faq', 'cta', 'footer',
        ];

        const orderedSections = [];
        for (const type of standardOrder) {
            if (sectionTypes.includes(type)) {
                orderedSections.push(type);
            }
        }
        for (const type of sectionTypes) {
            if (!orderedSections.includes(type)) {
                orderedSections.push(type);
            }
        }

        // CRITICAL: variant strings MUST match BACKEND_TEMPLATE_REGISTRY exactly
        // so the fallback plan can pass validateVariant() in CodeGenerator.
        const layoutVariants = {
            hero: 'split',
            features: 'grid3',
            benefits: 'alternating',
            courses: 'grid',
            testimonials: 'carousel',
            pricing: 'three-tier',
            faq: 'default',
            cta: 'gradient',
        };

        const componentMappings = targetAnalysis.sections.map((section) => ({
            sectionType: section.type,
            templateId: `${section.type}-template`,
            variant: layoutVariants[section.type] || 'default',
        }));

        const plan = {
            sectionOrdering: orderedSections,
            layoutVariants,
            contentTone: 'professional and approachable',
            contentEmphasis: ['value proposition', 'call-to-action', 'social proof'],
            missingSections: standardOrder.filter((type) => !sectionTypes.includes(type)),
            redundantSections: [],
            componentMappings,
        };

        // Always validate fallback plan against schema to catch future schema drift
        return validateAIRedesignPlan(plan);
    }

    /**
     * Sleep utility for retry delays.
     * @private
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise<void>}
     */
    _sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

export default AIClient;
