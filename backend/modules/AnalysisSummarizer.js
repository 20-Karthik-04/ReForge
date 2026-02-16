/**
 * @fileoverview Analysis summarizer service for generating human-readable analysis summaries
 * @module backend/modules/AnalysisSummarizer
 */

/**
 * AnalysisSummarizer service for creating human-readable summaries from WebPageAnalysis data
 * This is a pure utility module that does NOT modify the analysis output
 */
export class AnalysisSummarizer {
    /**
     * Generates a comprehensive human-readable summary from WebPageAnalysis
     * @param {Object} webPageAnalysis - WebPageAnalysis object (validated)
     * @returns {Object} Summary object with overview, sections, issues, and recommendations
     */
    static generateSummary(webPageAnalysis) {
        const { url, title, sections, issues, metrics } = webPageAnalysis;

        return {
            overview: this._generateOverview(url, title, sections, metrics),
            sections: this._generateSectionSummary(sections),
            criticalIssues: this._highlightCriticalIssues(issues),
            recommendations: this._generateRecommendations(sections, issues, metrics),
        };
    }

    /**
     * Generates overview text
     * @private
     * @param {string} url - Page URL
     * @param {string} title - Page title
     * @param {Array} sections - Page sections
     * @param {Object} metrics - Page metrics
     * @returns {string} Overview text
     */
    static _generateOverview(url, title, sections, metrics) {
        const sectionCount = sections.length;
        const wordCount = metrics.totalWordCount;
        const hasResponsive = metrics.hasMobileOptimization ? 'mobile-optimized' : 'not mobile-optimized';

        return `Analysis of "${title}" (${url}): ${sectionCount} sections detected with ${wordCount} total words. Page is ${hasResponsive}.`;
    }

    /**
     * Generates section summary with counts by type
     * @private
     * @param {Array} sections - Page sections
     * @returns {Object} Section summary with counts and details
     */
    static _generateSectionSummary(sections) {
        const sectionCounts = {};
        const sectionDetails = [];

        sections.forEach((section, index) => {
            // Count by type
            sectionCounts[section.type] = (sectionCounts[section.type] || 0) + 1;

            // Build detail entry
            sectionDetails.push({
                index,
                type: section.type,
                contentLength: section.contentLength,
                headingCount: section.headingCount,
                layoutSignal: section.layoutSignal,
                hasCTAs: !!(section.callsToAction && section.callsToAction.length > 0),
            });
        });

        // Generate human-readable list
        const sectionTypesList = Object.entries(sectionCounts)
            .map(([type, count]) => `${count} ${type} section${count > 1 ? 's' : ''}`)
            .join(', ');

        return {
            total: sections.length,
            byType: sectionCounts,
            summary: `Detected: ${sectionTypesList}`,
            details: sectionDetails,
        };
    }

    /**
     * Highlights critical (high severity) issues
     * @private
     * @param {Array} issues - Identified issues
     * @returns {Object} Critical issues summary
     */
    static _highlightCriticalIssues(issues) {
        const critical = issues.filter((issue) => issue.severity === 'high');
        const medium = issues.filter((issue) => issue.severity === 'medium');
        const low = issues.filter((issue) => issue.severity === 'low');

        return {
            total: issues.length,
            high: critical.length,
            medium: medium.length,
            low: low.length,
            criticalList: critical.map((issue) => ({
                type: issue.type,
                description: issue.description,
                location: issue.location,
            })),
            summary:
                critical.length > 0
                    ? `⚠️  ${critical.length} critical issue(s) found: ${critical.map((i) => i.description).join('; ')}`
                    : '✅ No critical issues detected',
        };
    }

    /**
     * Generates layout and structure recommendations
     * @private
     * @param {Array} sections - Page sections
     * @param {Array} issues - Identified issues
     * @param {Object} metrics - Page metrics
     * @returns {Array<string>} List of recommendations
     */
    static _generateRecommendations(sections, issues, metrics) {
        const recommendations = [];

        // Layout recommendations based on detected sections
        const hasHero = sections.some((s) => s.type === 'hero');
        const hasFeatures = sections.some((s) => s.type === 'features');
        const hasCTA = sections.some((s) => s.type === 'cta');
        const hasTestimonials = sections.some((s) => s.type === 'testimonials');
        const hasPricing = sections.some((s) => s.type === 'pricing');

        if (!hasHero) {
            recommendations.push('Consider adding a prominent hero section to immediately capture visitor attention');
        }

        if (!hasFeatures) {
            recommendations.push('Consider adding a features section to highlight key benefits');
        }

        if (!hasCTA) {
            recommendations.push('Add a clear call-to-action section to drive conversions');
        }

        if (!hasTestimonials) {
            recommendations.push('Consider adding testimonials to build trust and credibility');
        }

        // Layout pattern recommendations
        const layoutPatterns = sections.map((s) => s.layoutSignal);
        const hasDiverseLayouts = new Set(layoutPatterns).size > 2;

        if (!hasDiverseLayouts) {
            recommendations.push(
                'Consider using varied layout patterns (grid, split, alternating) to create visual interest'
            );
        }

        // Content recommendations
        if (metrics.totalWordCount < 300) {
            recommendations.push('Page has minimal content - consider expanding key sections for better SEO');
        } else if (metrics.totalWordCount > 3000) {
            recommendations.push('Page has extensive content - consider breaking into multiple pages or sections');
        }

        // Issue-based recommendations
        const hasAccessibilityIssues = issues.some((i) => i.type === 'accessibility');
        if (hasAccessibilityIssues) {
            recommendations.push('Address accessibility issues to improve usability for all users');
        }

        const hasResponsivenessIssues = issues.some((i) => i.type === 'responsiveness');
        if (hasResponsivenessIssues) {
            recommendations.push('Implement responsive design patterns for better mobile experience');
        }

        // Default recommendation if no issues
        if (recommendations.length === 0) {
            recommendations.push('Page structure looks solid - focus on content quality and performance optimization');
        }

        return recommendations;
    }

    /**
     * Formats summary as human-readable text (for logging/console output)
     * @param {Object} summary - Summary object from generateSummary()
     * @returns {string} Formatted text summary
     */
    static formatAsText(summary) {
        const lines = [];

        lines.push('='.repeat(80));
        lines.push('WEBPAGE ANALYSIS SUMMARY');
        lines.push('='.repeat(80));
        lines.push('');

        lines.push('OVERVIEW:');
        lines.push(`  ${summary.overview}`);
        lines.push('');

        lines.push('SECTIONS:');
        lines.push(`  ${summary.sections.summary}`);
        lines.push(`  Total: ${summary.sections.total} sections`);
        lines.push('');

        lines.push('ISSUES:');
        lines.push(`  ${summary.criticalIssues.summary}`);
        if (summary.criticalIssues.total > 0) {
            lines.push(`  Total issues: ${summary.criticalIssues.total} (High: ${summary.criticalIssues.high}, Medium: ${summary.criticalIssues.medium}, Low: ${summary.criticalIssues.low})`);
        }
        lines.push('');

        lines.push('RECOMMENDATIONS:');
        summary.recommendations.forEach((rec, index) => {
            lines.push(`  ${index + 1}. ${rec}`);
        });
        lines.push('');

        lines.push('='.repeat(80));

        return lines.join('\n');
    }
}

export default AnalysisSummarizer;
