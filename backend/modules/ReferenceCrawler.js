/**
 * @fileoverview Reference website crawler for extracting layout patterns
 * @module backend/modules/ReferenceCrawler
 */

import { WebCrawler } from './WebCrawler.js';
import { HTMLParser } from './HTMLParser.js';
import { detectLayoutPattern } from '../utils/utils.js';
import { ReferenceAnalysisSchema } from '../../shared/schemas.js';

/**
 * ReferenceCrawler service for analyzing reference websites
 * Focuses on layout patterns and structure, filtering out all textual content
 */
export class ReferenceCrawler {
    /**
     * Creates a new ReferenceCrawler instance
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        this.crawler = new WebCrawler(options);
    }

    /**
     * Analyzes a reference website and extracts layout patterns
     * @param {string} url - Reference website URL
     * @returns {Promise<Object>} ReferenceAnalysis object
     */
    async analyze(url) {
        // Fetch HTML
        const { html } = await this.crawler.fetch(url);

        // Parse HTML structure
        const { $, structure } = HTMLParser.parse(html);

        // Identify sections
        const sections = HTMLParser.identifySections($);

        // Extract layout patterns
        const layoutPatterns = this._extractLayoutPatterns(sections, $);

        // Extract section ordering
        const sectionOrdering = this._extractSectionOrdering(sections, $);

        // Extract visual structure
        const visualStructure = this._extractVisualStructure(sections, $);

        // Build ReferenceAnalysis object
        const analysis = {
            url,
            layoutPatterns,
            sectionOrdering,
            visualStructure,
        };

        // Validate against schema
        const validated = ReferenceAnalysisSchema.parse(analysis);

        return validated;
    }

    /**
     * Extracts layout patterns from sections
     * @private
     * @param {Array} sections - Array of section objects
     * @param {CheerioStatic} $ - Cheerio instance
     * @returns {Object} Layout patterns
     */
    _extractLayoutPatterns(sections, $) {
        const heroType = this._detectHeroType(sections, $);
        const featureLayout = this._detectFeatureLayout(sections, $);
        const contentPattern = this._detectContentPattern(sections, $);

        return {
            heroType,
            featureLayout,
            contentPattern,
        };
    }

    /**
     * Detects hero section type
     * @private
     * @param {Array} sections - Array of section objects
     * @param {CheerioStatic} $ - Cheerio instance
     * @returns {string} Hero type
     */
    _detectHeroType(sections, $) {
        // Find first content section (likely hero)
        const heroSection = sections.find((s) => s.type === 'content');
        if (!heroSection) return 'minimal';

        const { $el } = heroSection;
        const className = $el.attr('class')?.toLowerCase() || '';
        const id = $el.attr('id')?.toLowerCase() || '';
        const combined = className + ' ' + id;

        // Check for split layout (two columns, image + text)
        const hasImageTextColumns = $el.find('img').length > 0 && this._hasTwoColumnLayout($el, $);
        if (hasImageTextColumns || /split|two-col/.test(combined)) {
            return 'split';
        }

        // Check for full-width with background
        const hasBackground = /full|hero|banner|jumbotron/.test(combined);
        const isWide = $el.css?.('width') === '100%' || !$el.attr('class')?.includes('container');
        if (hasBackground || isWide) {
            return 'full-width';
        }

        // Check for centered layout
        const hasCenteredText = this._hasCenteredContent($el, $);
        if (hasCenteredText) {
            return 'centered';
        }

        return 'minimal';
    }

    /**
     * Detects feature section layout
     * @private
     * @param {Array} sections - Array of section objects
     * @param {CheerioStatic} $ - Cheerio instance
     * @returns {string} Feature layout type
     */
    _detectFeatureLayout(sections, $) {
        // Find section that looks like features
        const featureSection = sections.find((s) => {
            const { $el } = s;
            const className = $el.attr('class')?.toLowerCase() || '';
            const id = $el.attr('id')?.toLowerCase() || '';
            const combined = className + ' ' + id;
            return /feature|benefit|service|why/.test(combined);
        });

        if (!featureSection) return 'grid';

        const { $el } = featureSection;
        const className = $el.attr('class')?.toLowerCase() || '';

        // Check for carousel indicators
        const hasCarousel = /carousel|slider|swiper/.test(className) || $el.find('[class*="carousel"], [class*="slider"]').length > 0;
        if (hasCarousel) {
            return 'carousel';
        }

        // Count grid columns
        const columnCount = this._detectGridColumns($el, $);
        if (columnCount === 3) {
            return '3-column';
        } else if (columnCount === 2) {
            return '2-column';
        }

        // Check for list layout
        const hasList = $el.find('ul, ol').length > 0 || /list/.test(className);
        if (hasList) {
            return 'list';
        }

        return 'grid';
    }

    /**
     * Detects overall content pattern
     * @private
     * @param {Array} sections - Array of section objects
     * @param {CheerioStatic} $ - Cheerio instance
     * @returns {string} Content pattern
     */
    _detectContentPattern(sections, $) {
        let alternatingCount = 0;
        let gridCount = 0;
        let stackedCount = 0;

        sections.forEach((section) => {
            if (section.type === 'navigation' || section.type === 'footer') return;

            const { $el } = section;
            const layoutDetection = detectLayoutPattern($el.get(0), $);

            if (layoutDetection.pattern === 'alternating') {
                alternatingCount++;
            } else if (layoutDetection.pattern === 'grid' || layoutDetection.pattern === 'multi-column') {
                gridCount++;
            } else if (layoutDetection.pattern === 'single-column') {
                stackedCount++;
            }
        });

        // Determine dominant pattern
        if (alternatingCount >= 2) {
            return 'alternating';
        } else if (gridCount > stackedCount) {
            return 'grid';
        } else if (stackedCount > 0) {
            return 'stacked';
        }

        return 'mixed';
    }

    /**
     * Extracts section ordering (types only, no content)
     * @private
     * @param {Array} sections - Array of section objects
     * @param {CheerioStatic} $ - Cheerio instance
     * @returns {Array<string>} Section type ordering
     */
    _extractSectionOrdering(sections, $) {
        const ordering = [];

        sections.forEach((section, index) => {
            const { $el, type } = section;
            const className = $el.attr('class')?.toLowerCase() || '';
            const id = $el.attr('id')?.toLowerCase() || '';
            const combined = className + ' ' + id;

            // Classify section type based on structure only
            let sectionType = 'content';

            if (type === 'navigation' || /nav|header/.test(combined)) {
                sectionType = 'navigation';
            } else if (type === 'footer' || /footer/.test(combined)) {
                sectionType = 'footer';
            } else if (index === 0 || index === 1) {
                sectionType = 'hero';
            } else if (/feature|benefit/.test(combined)) {
                sectionType = 'features';
            } else if (/testimonial|review/.test(combined)) {
                sectionType = 'testimonials';
            } else if (/pricing|plan/.test(combined)) {
                sectionType = 'pricing';
            } else if (/faq|question/.test(combined)) {
                sectionType = 'faq';
            } else if (/cta|call/.test(combined)) {
                sectionType = 'cta';
            }

            ordering.push(sectionType);
        });

        return ordering;
    }

    /**
     * Extracts visual structure metadata
     * @private
     * @param {Array} sections - Array of section objects
     * @param {CheerioStatic} $ - Cheerio instance
     * @returns {Object} Visual structure
     */
    _extractVisualStructure(sections, $) {
        const gridColumns = this._detectDominantGridColumns(sections, $);
        const spacingPattern = this._detectSpacingPattern(sections, $);
        const cardLayouts = this._detectCardLayouts(sections, $);

        return {
            gridColumns: gridColumns > 0 ? gridColumns : undefined,
            spacingPattern,
            cardLayouts: cardLayouts.length > 0 ? cardLayouts : undefined,
        };
    }

    /**
     * Detects dominant grid column count across sections
     * @private
     * @param {Array} sections - Array of section objects
     * @param {CheerioStatic} $ - Cheerio instance
     * @returns {number} Most common grid column count
     */
    _detectDominantGridColumns(sections, $) {
        const columnCounts = [];

        sections.forEach((section) => {
            if (section.type === 'navigation' || section.type === 'footer') return;
            const count = this._detectGridColumns(section.$el, $);
            if (count > 0) {
                columnCounts.push(count);
            }
        });

        if (columnCounts.length === 0) return 0;

        // Find most common count
        const frequency = {};
        columnCounts.forEach((count) => {
            frequency[count] = (frequency[count] || 0) + 1;
        });

        const mostCommon = Object.keys(frequency).reduce((a, b) => (frequency[a] > frequency[b] ? a : b));
        return parseInt(mostCommon, 10);
    }

    /**
     * Detects spacing pattern (coarse categorization)
     * @private
     * @param {Array} sections - Array of section objects
     * @param {CheerioStatic} $ - Cheerio instance
     * @returns {string} Spacing pattern
     */
    _detectSpacingPattern(sections, $) {
        // Use coarse heuristic based on section count and structure
        // Avoid pixel-perfect measurement
        const contentSections = sections.filter((s) => s.type === 'content');

        if (contentSections.length <= 3) {
            return 'spacious';
        } else if (contentSections.length >= 7) {
            return 'compact';
        }

        return 'normal';
    }

    /**
     * Detects card-based layouts
     * @private
     * @param {Array} sections - Array of section objects
     * @param {CheerioStatic} $ - Cheerio instance
     * @returns {Array<string>} Card layout types
     */
    _detectCardLayouts(sections, $) {
        const cardTypes = new Set();

        sections.forEach((section) => {
            const { $el } = section;
            const cards = $el.find('[class*="card"]');

            if (cards.length >= 2) {
                // Determine card type based on structure
                if ($el.find('[class*="carousel"]').length > 0) {
                    cardTypes.add('carousel-cards');
                } else if (this._detectGridColumns($el, $) >= 3) {
                    cardTypes.add('grid-cards');
                } else {
                    cardTypes.add('standard-cards');
                }
            }
        });

        return Array.from(cardTypes);
    }

    /**
     * Detects grid columns in a section
     * @private
     * @param {CheerioAPI} $el - Section element
     * @param {CheerioStatic} $ - Cheerio instance
     * @returns {number} Column count (0 if not grid)
     */
    _detectGridColumns($el, $) {
        const className = $el.attr('class')?.toLowerCase() || '';

        // Check for explicit grid classes
        if (/col-3|grid-3|three-col/.test(className)) return 3;
        if (/col-2|grid-2|two-col/.test(className)) return 2;
        if (/col-4|grid-4|four-col/.test(className)) return 4;

        // Count direct children that look like columns
        const children = $el.children('div, article, section');
        const visibleChildren = children.filter((_, el) => {
            const $child = $(el);
            const display = $child.css?.('display');
            return display !== 'none';
        });

        const childCount = visibleChildren.length;

        // Heuristic: if 3-4 direct children, likely 3-column grid
        if (childCount >= 3 && childCount <= 4) return 3;
        if (childCount === 2) return 2;

        return 0;
    }

    /**
     * Checks if section has two-column layout
     * @private
     * @param {CheerioAPI} $el - Section element
     * @param {CheerioStatic} $ - Cheerio instance
     * @returns {boolean} True if two-column layout detected
     */
    _hasTwoColumnLayout($el, $) {
        const children = $el.children('div, article, section');
        if (children.length === 2) return true;

        const className = $el.attr('class')?.toLowerCase() || '';
        return /col-2|two-col|split/.test(className);
    }

    /**
     * Checks if content is centered
     * @private
     * @param {CheerioAPI} $el - Section element
     * @param {CheerioStatic} $ - Cheerio instance
     * @returns {boolean} True if centered
     */
    _hasCenteredContent($el, $) {
        const className = $el.attr('class')?.toLowerCase() || '';
        const textAlign = $el.css?.('text-align');

        return /center|centered/.test(className) || textAlign === 'center';
    }
}

export default ReferenceCrawler;
