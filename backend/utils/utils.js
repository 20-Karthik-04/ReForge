/**
 * @fileoverview Utility functions for web crawling and HTML analysis
 * @module backend/utils/utils
 */

/* global URL */

/**
 * Validates if a string is a valid URL
 * @param {string} urlString - URL to validate
 * @returns {boolean} True if valid URL
 */
export function isValidURL(urlString) {
    try {
        const url = new URL(urlString);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * Sanitizes and normalizes a URL
 * @param {string} urlString - URL to sanitize
 * @returns {string} Sanitized URL
 * @throws {Error} If URL is invalid
 */
export function sanitizeURL(urlString) {
    if (!isValidURL(urlString)) {
        throw new Error(`Invalid URL: ${urlString}`);
    }
    const url = new URL(urlString);
    // Remove fragment and normalize
    url.hash = '';
    return url.toString();
}

/**
 * Extracts clean text from a Cheerio element
 * @param {CheerioElement} element - Cheerio element
 * @returns {string} Extracted text
 */
export function extractText(element) {
    if (!element) return '';
    return element
        .text()
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Calculates word count from text
 * @param {string} text - Text to count words in
 * @returns {number} Word count
 */
export function calculateWordCount(text) {
    if (!text || typeof text !== 'string') return 0;
    const words = text.trim().split(/\s+/);
    return words.filter((word) => word.length > 0).length;
}

/**
 * Detects layout pattern from a Cheerio element
 * @param {CheerioElement} element - Element to analyze
 * @param {CheerioStatic} $ - Cheerio instance
 * @returns {{pattern: string, confidence: number}} Layout pattern and confidence (0-1)
 */
export function detectLayoutPattern(element, $) {
    const $el = $(element);
    const children = $el.children();
    const childCount = children.length;

    // Check for grid patterns
    const hasGridClass = $el.attr('class')?.match(/grid|col-|flex/i);
    if (hasGridClass && childCount >= 3) {
        return { pattern: 'grid', confidence: 0.8 };
    }

    // Check for split layout (two main children)
    if (childCount === 2) {
        const firstChildWidth = children.first().attr('class')?.match(/w-\d+|col-\d+/);
        const secondChildWidth = children.last().attr('class')?.match(/w-\d+|col-\d+/);
        if (firstChildWidth || secondChildWidth) {
            return { pattern: 'split', confidence: 0.7 };
        }
    }

    // Check for carousel indicators
    const hasCarousel = $el.find('[class*="carousel"], [class*="slider"], [class*="swiper"]').length > 0;
    if (hasCarousel) {
        return { pattern: 'carousel', confidence: 0.9 };
    }

    // Check for alternating pattern (image-text-image-text)
    const images = $el.find('img').length;
    const textBlocks = $el.find('p, div').length;
    if (images >= 2 && textBlocks >= 2 && Math.abs(images - textBlocks) <= 1) {
        return { pattern: 'alternating', confidence: 0.6 };
    }

    // Check for multi-column
    if (childCount >= 2 && hasGridClass) {
        return { pattern: 'multi-column', confidence: 0.7 };
    }

    // Default to single-column
    return { pattern: 'single-column', confidence: 0.5 };
}

/**
 * Counts DOM nodes in an element (including nested elements)
 * @param {CheerioElement} element - Element to count nodes in
 * @param {CheerioStatic} $ - Cheerio instance
 * @returns {number} Number of DOM nodes
 */
export function countDOMNodes(element, $) {
    if (!element) return 0;
    const $el = $(element);
    return $el.find('*').length + 1; // +1 for the element itself
}

/**
 * Calculates content density based on word count and DOM node count
 * @param {number} wordCount - Number of words
 * @param {number} nodeCount - Number of DOM nodes
 * @returns {number} Content density score (0-100)
 */
export function calculateContentDensity(wordCount, nodeCount) {
    if (nodeCount === 0) return 0;
    // Ratio of words to nodes, normalized to 0-100 scale
    // Typical dense content: 5-10 words per node
    // Sparse content: < 2 words per node
    const ratio = wordCount / nodeCount;
    const normalized = Math.min((ratio / 10) * 100, 100);
    return Math.round(normalized);
}

/**
 * Checks if text contains CTA-related keywords
 * @param {string} text - Text to check
 * @returns {boolean} True if CTA keywords found
 */
export function containsCTAKeywords(text) {
    const ctaPatterns = /get started|sign up|try free|subscribe|buy now|contact us|learn more|download|register|join now|start trial/i;
    return ctaPatterns.test(text);
}

/**
 * Removes sensitive data patterns from text
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
export function removeSensitiveData(text) {
    if (!text) return '';
    // Remove email addresses
    const sanitized = text.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[email]');
    // Remove phone numbers (various formats)
    return sanitized.replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[phone]');
}
