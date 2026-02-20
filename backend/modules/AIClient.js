/**
 * @fileoverview AI Client service for LLM API integration
 * @module backend/modules/AIClient
 */

/* global setTimeout */

import axios from 'axios';
import { validateAIRedesignPlan, WebPageAnalysisSchema, AIRedesignPlanSchema } from '../../shared/schemas.js';
import { PromptBuilder } from './PromptBuilder.js';

/**
 * AIClient service for generating redesign plans using LLM API
 * AI is used ONLY for high-level redesign planning - NOT for code generation
 */
export class AIClient {
    /**
     * Creates a new AIClient instance
     * @param {Object} options - Configuration options
     * @param {string} [options.apiKey] - LLM API key (defaults to env var)
     * @param {string} [options.apiUrl] - LLM API endpoint (defaults to env var)
     * @param {string} [options.model] - LLM model name (defaults to env var)
     * @param {number} [options.timeout=30000] - Request timeout in milliseconds
     * @param {number} [options.maxRetries=3] - Maximum number of retry attempts
     */
    constructor(options = {}) {
        this.apiKey = options.apiKey || process.env.LLM_API_KEY;
        this.provider = options.provider || process.env.LLM_PROVIDER || 'openai';
        this.model = options.model || process.env.LLM_MODEL || 'gpt-4';
        this.timeout = options.timeout || 30000;
        this.maxRetries = options.maxRetries || 3;

        // Set API URL based on provider
        if (options.apiUrl) {
            this.apiUrl = options.apiUrl;
        } else if (process.env.LLM_API_URL) {
            this.apiUrl = process.env.LLM_API_URL;
        } else if (this.provider === 'gemini') {
            // Gemini API URL format: https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
            this.apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;
        } else {
            // Default to OpenAI
            this.apiUrl = 'https://api.openai.com/v1/chat/completions';
        }

        if (!this.apiKey) {
            console.warn('⚠️  LLM_API_KEY not configured. AI client will use fallback plans.');
        }
    }

    /**
     * Generates a redesign plan using LLM
     * @param {Object} targetAnalysis - WebPageAnalysis object
     * @param {string[]} goals - Array of redesign goals
     * @param {Object} [referenceAnalysis] - Optional ReferenceAnalysis object
     * @returns {Promise<Object>} AIRedesignPlan object
     * @throws {Error} If input validation fails
     */
    async generateRedesignPlan(targetAnalysis, goals, referenceAnalysis = null) {
        try {
            // CRITICAL: Validate input safety before processing
            this._validateInputSafety(targetAnalysis);

            // Build prompt from structured data
            const prompt = PromptBuilder.buildPrompt(targetAnalysis, goals, referenceAnalysis);

            // Log prompt (without sensitive data - only structure)
            console.log('📤 Sending structured redesign request to AI...');
            console.log(`   Goals: ${goals.join(', ')}`);
            console.log(`   Sections to analyze: ${targetAnalysis.sections.length}`);

            // Make API request with retry logic
            const responseText = await this._makeRequest(prompt);

            // Parse and validate response
            const plan = this._parseResponse(responseText);

            // Log success (without sensitive data)
            console.log('✓ AI redesign plan generated successfully');
            console.log(`   Recommended sections: ${plan.sectionOrdering.length}`);
            console.log(`   Component mappings: ${plan.componentMappings.length}`);

            return plan;
        } catch (error) {
            console.warn('⚠️  AI plan generation failed:', error.message);
            console.log('   Using fallback default plan...');

            // Return fallback plan
            return this._getDefaultPlan(targetAnalysis);
        }
    }

    /**
     * CRITICAL: Validates input safety before sending to AI
     * Ensures no raw HTML, scripts, DOM, or unbounded strings are present
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

        // Check for raw HTML patterns (should not exist in structured JSON)
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

        // Additional check: ensure URL is valid and not a data URI or script
        if (targetAnalysis.url && (targetAnalysis.url.startsWith('data:') || targetAnalysis.url.startsWith('javascript:'))) {
            throw new Error('Input validation failed: Invalid URL protocol');
        }
    }

    /**
     * Parses and validates AI response
     * CRITICAL: Strict JSON-only parsing - rejects JSX, HTML, and non-JSON content
     * @private
     * @param {string} responseText - Raw AI response text
     * @returns {Object} Validated AIRedesignPlan
     * @throws {Error} If response is invalid or contains non-JSON content
     */
    _parseResponse(responseText) {
        // Extract JSON from response (AI might wrap in markdown code blocks)
        let jsonText = responseText.trim();

        // Remove markdown code fences if present (must be JSON only)
        const codeBlockMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
        if (codeBlockMatch) {
            jsonText = codeBlockMatch[1].trim();
        }

        // CRITICAL: Reject if contains JSX tags (React components)
        if (/<[A-Z][a-zA-Z0-9]*[\s\S]*?>/.test(jsonText)) {
            throw new Error('AI response validation failed: JSX component tags detected (expected JSON only)');
        }

        // CRITICAL: Reject if contains HTML tags
        if (/<\/?[a-z][\s\S]*>/i.test(jsonText)) {
            throw new Error('AI response validation failed: HTML tags detected (expected JSON only)');
        }

        // CRITICAL: Reject if contains non-JSON code fences
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
     * Makes LLM API request with retry logic
     * @private
     * @param {Object} prompt - Structured prompt object
     * @param {number} [attempt=1] - Current attempt number
     * @returns {Promise<string>} AI response text
     * @throws {Error} If all retries fail
     */
    async _makeRequest(prompt, attempt = 1) {
        if (!this.apiKey) {
            throw new Error('LLM_API_KEY not configured');
        }

        try {
            // Build request config based on provider
            let requestBody, headers;

            if (this.provider === 'gemini') {
                // Gemini API format
                requestBody = {
                    contents: [
                        {
                            parts: [
                                { text: `${prompt.system}\n\n${prompt.user}` }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 2000
                    }
                };
                headers = {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': this.apiKey
                };
            } else {
                // OpenAI API format
                requestBody = {
                    model: this.model,
                    messages: [
                        { role: 'system', content: prompt.system },
                        { role: 'user', content: prompt.user },
                    ],
                    temperature: 0.7,
                    max_tokens: 2000,
                    response_format: { type: 'json_object' }
                };
                headers = {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.apiKey}`
                };
            }

            const response = await axios.post(
                this.apiUrl,
                requestBody,
                {
                    timeout: this.timeout,
                    headers
                }
            );

            // Track token usage (format differs by provider)
            if (this.provider === 'gemini') {
                const usage = response.data.usageMetadata;
                if (usage) {
                    console.log(`   Tokens used: ${usage.totalTokenCount || 0} (prompt: ${usage.promptTokenCount || 0}, completion: ${usage.candidatesTokenCount || 0})`);
                }
            } else {
                const usage = response.data.usage;
                if (usage) {
                    console.log(`   Tokens used: ${usage.total_tokens} (prompt: ${usage.prompt_tokens}, completion: ${usage.completion_tokens})`);
                }
            }

            // Extract response text (format differs by provider)
            let content;
            if (this.provider === 'gemini') {
                content = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
            } else {
                content = response.data.choices?.[0]?.message?.content;
            }

            if (!content) {
                throw new Error('Empty response from LLM API');
            }

            return content;
        } catch (error) {
            // Check if should retry
            const shouldRetry =
                attempt < this.maxRetries &&
                (error.code === 'ECONNABORTED' || // Timeout
                    error.code === 'ETIMEDOUT' ||
                    error.response?.status === 429 || // Rate limit
                    error.response?.status === 500 || // Server error
                    error.response?.status === 503); // Service unavailable

            if (shouldRetry) {
                // Exponential backoff
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                console.log(`   Retry ${attempt}/${this.maxRetries} after ${delay}ms...`);
                await this._sleep(delay);
                return this._makeRequest(prompt, attempt + 1);
            }

            // No more retries - throw error
            const errorMessage = error.response?.data?.error?.message || error.message;
            throw new Error(`LLM API request failed: ${errorMessage}`);
        }
    }

    /**
     * Generates a fallback default plan when AI is unavailable
     * @private
     * @param {Object} targetAnalysis - WebPageAnalysis object
     * @returns {Object} Default AIRedesignPlan
     */
    _getDefaultPlan(targetAnalysis) {
        // Extract section types in original order
        const sectionTypes = targetAnalysis.sections.map((s) => s.type);

        // Define standard section ordering
        const standardOrder = ['navigation', 'hero', 'features', 'benefits', 'courses', 'testimonials', 'pricing', 'faq', 'cta', 'footer'];

        // Sort sections by standard order, keeping existing sections
        const orderedSections = [];
        for (const type of standardOrder) {
            if (sectionTypes.includes(type)) {
                orderedSections.push(type);
            }
        }

        // Add any remaining sections not in standard order
        for (const type of sectionTypes) {
            if (!orderedSections.includes(type)) {
                orderedSections.push(type);
            }
        }

        // Create default layout variants
        const layoutVariants = {
            hero: 'split',
            features: 'grid',
            benefits: 'alternating',
            courses: 'grid',
            testimonials: 'carousel',
            pricing: '3-column',
            faq: 'accordion',
            cta: 'centered',
        };

        // Create component mappings
        const componentMappings = targetAnalysis.sections.map((section) => ({
            sectionType: section.type,
            templateId: `${section.type}-template`,
            variant: layoutVariants[section.type] || 'default',
        }));

        return {
            sectionOrdering: orderedSections,
            layoutVariants,
            contentTone: 'professional and approachable',
            contentEmphasis: ['value proposition', 'call-to-action', 'social proof'],
            missingSections: standardOrder.filter((type) => !sectionTypes.includes(type)),
            redundantSections: [],
            componentMappings,
        };
    }

    /**
     * Sleep utility for retry delays
     * @private
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise<void>}
     */
    _sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

export default AIClient;
