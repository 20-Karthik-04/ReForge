/**
 * @fileoverview Web crawler service for fetching HTML content from URLs
 * @module backend/modules/WebCrawler
 */

/* global setTimeout */

import axios from 'axios';
import https from 'https';

/**
 * Shared HTTPS agent that skips certificate verification.
 * Required for crawling arbitrary third-party sites where the local
 * Node.js CA bundle may not include the site's issuer chain.
 * (UNABLE_TO_GET_ISSUER_CERT_LOCALLY fix)
 */
const PERMISSIVE_HTTPS_AGENT = new https.Agent({ rejectUnauthorized: false });
import { isValidURL, sanitizeURL } from '../utils/utils.js';

/**
 * WebCrawler service class for fetching webpage HTML
 */
export class WebCrawler {
    /**
     * Creates a new WebCrawler instance
     * @param {Object} options - Configuration options
     * @param {number} [options.timeout=15000] - Request timeout in milliseconds
     * @param {number} [options.maxRetries=3] - Maximum number of retry attempts
     * @param {string} [options.userAgent='ReForge/1.0 (Web Analysis Bot)'] - User agent string
     */
    constructor(options = {}) {
        this.timeout = options.timeout || parseInt(process.env.CRAWLER_TIMEOUT, 10) || 15000;
        this.maxRetries = options.maxRetries || 2; // reduced from 3 to limit worst-case hang to ~30s
        this.userAgent = options.userAgent || process.env.CRAWLER_USER_AGENT || 'ReForge/1.0 (Web Analysis Bot)';
    }

    /**
     * Fetches HTML content from a URL
     * @param {string} url - URL to fetch
     * @returns {Promise<{html: string, finalUrl: string, statusCode: number}>} Fetched HTML and metadata
     * @throws {Error} If URL is invalid or fetch fails
     */
    async fetch(url) {
        // Validate URL
        if (!isValidURL(url)) {
            throw new Error(`Invalid URL: ${url}`);
        }

        const sanitizedUrl = sanitizeURL(url);
        let lastError = null;

        // Retry logic with exponential backoff
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const response = await this._makeRequest(sanitizedUrl);
                return {
                    html: response.data,
                    finalUrl: response.request?.res?.responseUrl || sanitizedUrl,
                    statusCode: response.status,
                };
            } catch (error) {
                lastError = error;

                // Don't retry on client errors (4xx) except 429 (rate limit)
                if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
                    throw new Error(`Client error (${error.response.status}): ${error.message}`, { cause: error });
                }

                // Wait before retry with exponential backoff
                if (attempt < this.maxRetries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                    await this._sleep(delay);
                }
            }
        }

        // All retries failed
        throw new Error(
            `Failed to fetch URL after ${this.maxRetries} attempts: ${lastError?.message || 'Unknown error'}`,
            { cause: lastError }
        );
    }

    /**
     * Makes HTTP request to fetch HTML
     * @private
     * @param {string} url - URL to request
     * @returns {Promise<Object>} Axios response
     */
    async _makeRequest(url) {
        const response = await axios.get(url, {
            timeout: this.timeout,
            httpsAgent: PERMISSIVE_HTTPS_AGENT, // bypass local CA cert issues on arbitrary external sites
            headers: {
                'User-Agent': this.userAgent,
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
            },
            maxRedirects: 5,
            validateStatus: (status) => {
                // Accept 2xx and 3xx status codes
                return status >= 200 && status < 400;
            },
            responseType: 'text',
        });

        // Validate content type
        const contentType = response.headers['content-type'] || '';
        if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
            throw new Error(`Invalid content type: ${contentType}. Expected HTML content.`);
        }

        return response;
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

    /**
     * Validates URL without fetching
     * @param {string} url - URL to validate
     * @returns {boolean} True if valid
     */
    static isValidURL(url) {
        return isValidURL(url);
    }
}

export default WebCrawler;
