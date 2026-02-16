/**
 * @fileoverview Content analyzer service for detecting section types and analyzing content
 * @module backend/modules/ContentAnalyzer
 */

import {
    extractText,
    calculateWordCount,
    detectLayoutPattern,
    countDOMNodes,
    calculateContentDensity,
    containsCTAKeywords,
} from '../utils/utils.js';

/**
 * ContentAnalyzer service for analyzing webpage content and detecting section types
 */
export class ContentAnalyzer {
    /**
     * Analyzes a section element and determines its type and characteristics
     * @param {Object} section - Section object with element and Cheerio instance
     * @param {CheerioElement} section.element - Section DOM element
     * @param {CheerioAPI} section.$el - Cheerio wrapped element
     * @param {CheerioStatic} $ - Cheerio instance
     * @param {number} index - Section index
     * @returns {Object} Section analysis
     */
    static analyzeSection(section, $, index) {
        const { $el, element } = section;
        const text = extractText($el);
        const wordCount = calculateWordCount(text);
        const nodeCount = countDOMNodes(element, $);
        const contentDensity = calculateContentDensity(wordCount, nodeCount);

        // Count headings
        const headings = $el.find('h1, h2, h3, h4, h5, h6');
        const headingCount = headings.length;

        // Detect layout pattern
        const layoutDetection = detectLayoutPattern(element, $);

        // Detect section type
        const sectionType = this._detectSectionType($el, $, text, index);

        // Detect CTAs
        const callsToAction = this._detectCTAs($el, $);

        return {
            type: sectionType.type,
            confidence: sectionType.confidence,
            contentLength: wordCount,
            headingCount,
            contentDensity,
            layoutSignal: layoutDetection.pattern,
            layoutConfidence: layoutDetection.confidence,
            callsToAction: callsToAction.length > 0 ? callsToAction : undefined,
        };
    }

    /**
     * Detects the type of a section using heuristics
     * @private
     * @param {CheerioAPI} $el - Section element
     * @param {CheerioStatic} $ - Cheerio instance
     * @param {string} text - Section text content
     * @param {number} index - Section index
     * @returns {{type: string, confidence: number}} Section type and confidence
     */
    static _detectSectionType($el, $, text, index) {
        const className = $el.attr('class')?.toLowerCase() || '';
        const id = $el.attr('id')?.toLowerCase() || '';
        const combined = className + ' ' + id + ' ' + text.toLowerCase();

        // Navigation detection
        if ($el.is('nav, header') || /nav|header|menu/.test(combined)) {
            return { type: 'navigation', confidence: 0.9 };
        }

        // Footer detection
        if ($el.is('footer') || /footer|copyright/.test(combined)) {
            return { type: 'footer', confidence: 0.9 };
        }

        // Hero detection (usually first section, large heading, CTA)
        const hasLargeHeading = $el.find('h1, h2').length > 0;
        const hasCTA = $el.find('button, a[class*="btn"], a[class*="cta"]').length > 0;
        const isFirstSection = index === 0 || index === 1;

        if (isFirstSection && hasLargeHeading && (hasCTA || /hero|banner|jumbotron/.test(combined))) {
            return { type: 'hero', confidence: 0.85 };
        }

        // Features detection (grid layout, repeated items, icons)
        const hasIcons = $el.find('svg, i[class*="icon"], img[class*="icon"]').length >= 3;
        const hasGrid = /grid|col-|features/.test(combined);
        const hasRepeatedStructure = $el.children().length >= 3;

        if ((hasGrid || hasRepeatedStructure) && (hasIcons || /feature|benefit|why/.test(combined))) {
            return { type: 'features', confidence: 0.75 };
        }

        // Testimonials detection
        const hasQuotes = $el.find('blockquote').length > 0 || /testimonial|review|quote/.test(combined);
        const hasRatings = $el.find('[class*="star"], [class*="rating"]').length > 0;
        const hasAvatars = $el.find('img[class*="avatar"], img[class*="profile"]').length > 0;

        if (hasQuotes || (hasRatings && hasAvatars) || /testimonial|review/.test(combined)) {
            return { type: 'testimonials', confidence: 0.8 };
        }

        // Pricing detection
        const hasPriceSymbols = /\$\d+|€\d+|£\d+|price|pricing|plan/.test(text.toLowerCase());
        const hasPricingTerms = /month|year|annual|subscription|tier/.test(text.toLowerCase());
        const hasPricingClass = /pricing|plan|package/.test(combined);

        if ((hasPriceSymbols || hasPricingTerms) && hasPricingClass) {
            return { type: 'pricing', confidence: 0.8 };
        }

        // FAQ detection
        const hasQuestions = /\?/.test(text) && text.split('?').length >= 3;
        const hasFAQClass = /faq|question|accordion/.test(combined);

        if (hasQuestions || hasFAQClass) {
            return { type: 'faq', confidence: 0.75 };
        }

        // CTA detection
        const hasStrongCTA = containsCTAKeywords(text) && hasCTA;
        const isCTASection = /cta|call-to-action|get-started/.test(combined);

        if (hasStrongCTA || isCTASection) {
            return { type: 'cta', confidence: 0.7 };
        }

        // Benefits/How it works detection
        const hasSteps = /step|how it works|how to|process/.test(combined);
        const hasNumberedList = $el.find('ol').length > 0;
        const hasAlternating = detectLayoutPattern($el.get(0), $).pattern === 'alternating';

        if (hasSteps || hasNumberedList || (hasAlternating && /benefit|work/.test(combined))) {
            return { type: 'benefits', confidence: 0.7 };
        }

        // Courses detection (specific to education platforms)
        const hasCourses = /course|class|lesson/.test(combined);
        const hasCardLayout = $el.find('[class*="card"]').length >= 2;

        if (hasCourses && hasCardLayout) {
            return { type: 'courses', confidence: 0.75 };
        }

        // Default to 'other'
        return { type: 'other', confidence: 0.5 };
    }

    /**
     * Detects call-to-action elements in a section
     * @private
     * @param {CheerioAPI} $el - Section element
     * @param {CheerioStatic} $ - Cheerio instance
     * @returns {Array<string>} Array of CTA texts
     */
    static _detectCTAs($el, $) {
        const ctas = [];

        // Find buttons
        $el.find('button, a[class*="btn"], a[class*="cta"], a[class*="button"]').each((_, element) => {
            const text = extractText($(element));
            if (text && containsCTAKeywords(text)) {
                ctas.push(text);
            }
        });

        return [...new Set(ctas)]; // Remove duplicates
    }

    /**
     * Calculates overall page metrics
     * @param {Array} sections - Array of analyzed sections
     * @param {Object} metadata - Page metadata
     * @returns {Object} Overall metrics
     */
    static calculateMetrics(sections, metadata) {
        const totalWordCount = sections.reduce((sum, section) => sum + section.contentLength, 0);
        const totalHeadings = sections.reduce((sum, section) => sum + section.headingCount, 0);
        const hasMobileOptimization = !!metadata.viewport;

        return {
            totalWordCount,
            totalHeadings,
            hasMobileOptimization,
        };
    }

    /**
     * Detects issues in the analyzed page (Phase 5 enhanced)
     * @param {Array} sections - Array of analyzed sections
     * @param {Array} headingHierarchy - Heading hierarchy
     * @param {Object} metadata - Page metadata
     * @param {CheerioStatic} $ - Cheerio instance for DOM inspection
     * @returns {Array} Array of identified issues
     */
    static detectIssues(sections, headingHierarchy, metadata, $ = null) {
        const issues = [];

        // =====================================================================
        // Accessibility Issues (Phase 3 + Phase 5 enhanced)
        // =====================================================================

        // Check for missing h1
        const hasH1 = headingHierarchy.some((h) => h.level === 1);
        if (!hasH1) {
            issues.push({
                type: 'accessibility',
                severity: 'high',
                description: 'Missing h1 heading - important for SEO and accessibility',
            });
        }

        // Check for skipped heading levels
        for (let i = 1; i < headingHierarchy.length; i++) {
            const prevLevel = headingHierarchy[i - 1].level;
            const currLevel = headingHierarchy[i].level;
            if (currLevel - prevLevel > 1) {
                issues.push({
                    type: 'accessibility',
                    severity: 'medium',
                    description: `Skipped heading level from h${prevLevel} to h${currLevel}`,
                    location: `Heading: "${headingHierarchy[i].text}"`,
                });
                break; // Only report first instance
            }
        }

        // Phase 5: Check for missing alt text on images
        if ($) {
            const $images = $('img');
            const imagesWithoutAlt = [];
            $images.each((_, img) => {
                const $img = $(img);
                const alt = $img.attr('alt');
                const src = $img.attr('src') || 'unknown';
                if (alt === undefined || alt === null || alt.trim() === '') {
                    imagesWithoutAlt.push(src.substring(0, 50)); // Truncate long URLs
                }
            });

            if (imagesWithoutAlt.length > 0) {
                issues.push({
                    type: 'accessibility',
                    severity: 'medium',
                    description: `${imagesWithoutAlt.length} image(s) missing alt text - impacts screen reader accessibility`,
                    location: imagesWithoutAlt.length <= 3 ? `Images: ${imagesWithoutAlt.join(', ')}` : undefined,
                });
            }
        }

        // Phase 5: Check for poor semantic HTML usage
        if ($) {
            const $main = $('main');
            const $header = $('header');
            const $footer = $('footer');
            const $nav = $('nav');

            const semanticIssues = [];
            if ($main.length === 0) {
                semanticIssues.push('No <main> element found');
            }
            if ($header.length === 0 && $('body [class*="header"], body [id*="header"]').length > 0) {
                semanticIssues.push('Header area not using <header> element');
            }
            if ($footer.length === 0 && $('body [class*="footer"], body [id*="footer"]').length > 0) {
                semanticIssues.push('Footer area not using <footer> element');
            }
            if ($nav.length === 0 && $('body [class*="nav"], body [id*="nav"]').length > 0) {
                semanticIssues.push('Navigation not using <nav> element');
            }

            if (semanticIssues.length > 0) {
                issues.push({
                    type: 'accessibility',
                    severity: 'low',
                    description: `Poor semantic HTML: ${semanticIssues.join('; ')}`,
                });
            }
        }

        // =====================================================================
        // Responsiveness Issues (Phase 3)
        // =====================================================================

        // Check for missing viewport
        if (!metadata.viewport) {
            issues.push({
                type: 'responsiveness',
                severity: 'high',
                description: 'Missing viewport meta tag - page may not render correctly on mobile devices',
            });
        }

        // Phase 5: Enhanced mobile responsiveness check
        if (metadata.viewport && !/width\s*=\s*device-width/.test(metadata.viewport)) {
            issues.push({
                type: 'responsiveness',
                severity: 'medium',
                description: 'Viewport does not include device-width - may cause mobile rendering issues',
                location: `Current viewport: "${metadata.viewport}"`,
            });
        }

        // =====================================================================
        // UX Issues (Phase 3 + Phase 5 enhanced)
        // =====================================================================

        // Check for excessive content density
        const highDensitySections = sections.filter((s) => s.contentDensity > 80);
        if (highDensitySections.length > 0) {
            issues.push({
                type: 'ux',
                severity: 'low',
                description: `${highDensitySections.length} section(s) have very high content density, which may impact readability`,
            });
        }

        // Phase 5: Enhanced - Check for very low content density (empty sections)
        const emptyOrLowContentSections = sections.filter(
            (s) => s.type !== 'navigation' && s.type !== 'footer' && s.contentDensity < 10 && s.contentLength > 0
        );
        if (emptyOrLowContentSections.length > 0) {
            issues.push({
                type: 'ux',
                severity: 'low',
                description: `${emptyOrLowContentSections.length} section(s) have very low content density - may appear sparse or incomplete`,
            });
        }

        // Check for missing CTAs
        const hasCTAs = sections.some((s) => s.callsToAction && s.callsToAction.length > 0);
        if (!hasCTAs) {
            issues.push({
                type: 'ux',
                severity: 'medium',
                description: 'No clear call-to-action elements detected - may impact conversion',
            });
        }

        // Phase 5: Check for excessive CTAs (can be overwhelming)
        const totalCTAs = sections.reduce((sum, s) => sum + (s.callsToAction?.length || 0), 0);
        if (totalCTAs > 10) {
            issues.push({
                type: 'ux',
                severity: 'low',
                description: `${totalCTAs} call-to-action elements detected - may overwhelm users and reduce effectiveness`,
            });
        }

        return issues;
    }
}

export default ContentAnalyzer;
