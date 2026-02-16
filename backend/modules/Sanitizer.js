/**
 * @fileoverview HTML sanitization service for removing sensitive and dynamic content
 * @module backend/modules/Sanitizer
 */

import * as cheerio from 'cheerio';
import { removeSensitiveData } from '../utils/utils.js';

/**
 * Sanitizer service for cleaning HTML content
 */
export class Sanitizer {
    /**
     * Sanitizes HTML by removing JavaScript, forms, tracking scripts, and sensitive data
     * @param {string} html - Raw HTML to sanitize
     * @returns {CheerioStatic} Sanitized Cheerio instance
     */
    static sanitize(html) {
        const $ = cheerio.load(html);

        // Remove all script tags
        $('script').remove();

        // Remove inline event handlers
        $('*').each((_, element) => {
            const $el = $(element);
            const attrs = element.attribs || {};
            Object.keys(attrs).forEach((attr) => {
                if (attr.startsWith('on')) {
                    // Remove onclick, onload, etc.
                    $el.removeAttr(attr);
                }
            });
        });

        // Remove form elements and inputs
        $('form').remove();
        $('input, textarea, select, button[type="submit"]').remove();

        // Remove tracking and external resources
        $('iframe').remove();
        $('noscript').remove();

        // Remove data attributes used by frameworks (React, Vue, Angular)
        $('*').each((_, element) => {
            const $el = $(element);
            const attrs = element.attribs || {};
            Object.keys(attrs).forEach((attr) => {
                if (attr.startsWith('data-') || attr.startsWith('ng-') || attr.startsWith('v-') || attr.startsWith(':')) {
                    $el.removeAttr(attr);
                }
            });
        });

        // Sanitize text content to remove sensitive data
        $('*').each((_, element) => {
            const $el = $(element);
            const children = $el.contents();

            children.each((_, child) => {
                if (child.type === 'text') {
                    child.data = removeSensitiveData(child.data);
                }
            });
        });

        // Remove external link hrefs (keep structure, remove actual URLs for privacy)
        $('link[rel="stylesheet"]').remove();
        $('a[href^="http"]').each((_, element) => {
            $(element).attr('href', '#');
        });

        return $;
    }

    /**
     * Creates a clean HTML string from sanitized Cheerio instance
     * @param {CheerioStatic} $ - Sanitized Cheerio instance
     * @returns {string} Clean HTML string
     */
    static toHTML($) {
        return $.html();
    }
}

export default Sanitizer;
