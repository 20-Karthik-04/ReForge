/**
 * @fileoverview HTML parser service for extracting document structure and metadata
 * @module backend/modules/HTMLParser
 */

import * as cheerio from 'cheerio';
import { extractText } from '../utils/utils.js';

/**
 * HTMLParser service for parsing HTML and extracting structure
 */
export class HTMLParser {
    /**
     * Parses HTML and extracts document structure
     * @param {string} html - HTML content to parse
     * @returns {Object} Parsed document data
     */
    static parse(html) {
        const $ = cheerio.load(html);

        return {
            metadata: this._extractMetadata($),
            structure: this._extractStructure($),
            headingHierarchy: this._extractHeadingHierarchy($),
            $, // Return Cheerio instance for further processing
        };
    }

    /**
     * Extracts metadata from HTML
     * @private
     * @param {CheerioStatic} $ - Cheerio instance
     * @returns {Object} Metadata object
     */
    static _extractMetadata($) {
        const metadata = {
            title: $('title').first().text().trim() || 'Untitled',
            description: $('meta[name="description"]').attr('content')?.trim() || undefined,
            viewport: $('meta[name="viewport"]').attr('content')?.trim() || undefined,
            ogTitle: $('meta[property="og:title"]').attr('content')?.trim() || undefined,
            ogDescription: $('meta[property="og:description"]').attr('content')?.trim() || undefined,
            ogImage: $('meta[property="og:image"]').attr('content')?.trim() || undefined,
        };

        return metadata;
    }

    /**
     * Extracts document structure (header, main, footer, nav)
     * @private
     * @param {CheerioStatic} $ - Cheerio instance
     * @returns {Object} Structure object
     */
    static _extractStructure($) {
        const structure = {
            hasHeader: $('header').length > 0,
            hasNav: $('nav').length > 0,
            hasMain: $('main').length > 0,
            hasFooter: $('footer').length > 0,
            hasArticle: $('article').length > 0,
            hasAside: $('aside').length > 0,
            sections: [],
        };

        // Extract sections
        $('section, article, div[class*="section"], div[id*="section"]').each((index, element) => {
            const $el = $(element);
            structure.sections.push({
                tagName: element.tagName,
                className: $el.attr('class') || '',
                id: $el.attr('id') || '',
                index,
            });
        });

        return structure;
    }

    /**
     * Extracts heading hierarchy (h1-h6)
     * @private
     * @param {CheerioStatic} $ - Cheerio instance
     * @returns {Array} Array of heading objects
     */
    static _extractHeadingHierarchy($) {
        const headings = [];

        $('h1, h2, h3, h4, h5, h6').each((index, element) => {
            const $el = $(element);
            const level = parseInt(element.tagName.substring(1), 10);
            const text = extractText($el);

            if (text) {
                headings.push({
                    level,
                    text,
                    index,
                });
            }
        });

        return headings;
    }

    /**
     * Identifies sections by analyzing HTML structure
     * @param {CheerioStatic} $ - Cheerio instance
     * @returns {Array} Array of identified section elements
     */
    static identifySections($) {
        const sections = [];

        // Identify navigation
        const $nav = $('header, nav').first();
        if ($nav.length > 0) {
            sections.push({ type: 'navigation', element: $nav.get(0), $el: $nav });
        }

        // Identify main content sections
        const $main = $('main').length > 0 ? $('main') : $('body');
        const $contentSections = $main.find('section, article, div[class*="section"], div[id*="section"]').filter((_, el) => {
            // Filter out nested sections to get top-level only
            const $el = $(el);
            const hasParentSection = $el.parent().closest('section, article, div[class*="section"]').length > 0;
            return !hasParentSection;
        });

        $contentSections.each((_, element) => {
            sections.push({
                type: 'content',
                element,
                $el: $(element),
            });
        });

        // If no sections found in main, use direct children of body/main
        if (sections.length <= 1) {
            $main.children('div, section, article').each((_, element) => {
                sections.push({
                    type: 'content',
                    element,
                    $el: $(element),
                });
            });
        }

        // Identify footer
        const $footer = $('footer').first();
        if ($footer.length > 0) {
            sections.push({ type: 'footer', element: $footer.get(0), $el: $footer });
        }

        return sections;
    }
}

export default HTMLParser;
