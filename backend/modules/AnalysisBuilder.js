/**
 * @fileoverview Analysis builder service for creating structured WebPageAnalysis output
 * @module backend/modules/AnalysisBuilder
 */

import { WebPageAnalysisSchema } from '../../shared/schemas.js';
import { HTMLParser } from './HTMLParser.js';
import { ContentAnalyzer } from './ContentAnalyzer.js';
import { Sanitizer } from './Sanitizer.js';

/**
 * AnalysisBuilder service for building complete webpage analysis
 */
export class AnalysisBuilder {
    /**
     * Builds complete webpage analysis from HTML
     * @param {string} url - Original URL
     * @param {string} html - Raw HTML content
     * @returns {Object} WebPageAnalysis object validated against schema
     */
    static async build(url, html) {
        // Step 1: Sanitize HTML
        const $ = Sanitizer.sanitize(html);

        // Step 2: Parse HTML structure and metadata
        const parseResult = HTMLParser.parse($.html());
        const { metadata, headingHierarchy } = parseResult;

        // Step 3: Identify sections
        const identifiedSections = HTMLParser.identifySections($);

        // Step 4: Analyze each section
        const analyzedSections = [];
        identifiedSections.forEach((section, index) => {
            const analysis = ContentAnalyzer.analyzeSection(section, $, index);

            // Only include sections with meaningful content (skip navigation/footer for main sections)
            if (section.type === 'navigation' || section.type === 'footer') {
                // Add these special sections
                analyzedSections.push({
                    type: section.type,
                    contentLength: analysis.contentLength,
                    headingCount: analysis.headingCount,
                    contentDensity: analysis.contentDensity,
                    layoutSignal: analysis.layoutSignal,
                    callsToAction: analysis.callsToAction,
                });
            } else if (analysis.contentLength > 0) {
                // Add content sections with actual content
                analyzedSections.push({
                    type: analysis.type,
                    contentLength: analysis.contentLength,
                    headingCount: analysis.headingCount,
                    contentDensity: analysis.contentDensity,
                    layoutSignal: analysis.layoutSignal,
                    callsToAction: analysis.callsToAction,
                });
            }
        });

        // Ensure at least one section exists
        if (analyzedSections.length === 0) {
            // Fallback: create a single generic section from body
            const bodyText = $('body').text();
            const wordCount = bodyText.trim().split(/\s+/).length;
            analyzedSections.push({
                type: 'other',
                contentLength: wordCount,
                headingCount: headingHierarchy.length,
                contentDensity: 50,
                layoutSignal: 'single-column',
            });
        }

        // Step 5: Calculate overall metrics
        const metrics = ContentAnalyzer.calculateMetrics(analyzedSections, metadata);

        // Step 6: Detect issues
        const issues = ContentAnalyzer.detectIssues(analyzedSections, headingHierarchy, metadata);

        // Step 7: Build final analysis object
        const analysis = {
            url,
            title: metadata.title,
            description: metadata.description,
            viewport: metadata.viewport,
            sections: analyzedSections,
            issues,
            metrics,
        };

        // Step 8: Validate against schema
        const validatedAnalysis = this._validateAnalysis(analysis);

        return validatedAnalysis;
    }

    /**
     * Validates analysis against WebPageAnalysisSchema
     * @private
     * @param {Object} analysis - Analysis object to validate
     * @returns {Object} Validated analysis
     * @throws {Error} If validation fails
     */
    static _validateAnalysis(analysis) {
        try {
            const validated = WebPageAnalysisSchema.parse(analysis);
            return validated;
        } catch (error) {
            console.error('Validation error:', error.errors);
            throw new Error(`Analysis validation failed: ${error.message}`, { cause: error });
        }
    }
}

export default AnalysisBuilder;
