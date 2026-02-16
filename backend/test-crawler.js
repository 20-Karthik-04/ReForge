/**
 * @fileoverview Test script for Phase 3 web crawling module
 * @module backend/test-crawler
 */

import { WebCrawler } from './modules/WebCrawler.js';
import { AnalysisBuilder } from './modules/AnalysisBuilder.js';

/**
 * Main test function
 */
async function testCrawler() {
    console.log('='.repeat(60));
    console.log('Phase 3: Web Crawling Module Test');
    console.log('='.repeat(60));
    console.log('');

    // Test URL (using a simple, public webpage)
    const testUrl = 'https://example.com';

    try {
        console.log(`1. Testing WebCrawler with URL: ${testUrl}`);
        console.log('-'.repeat(60));

        const crawler = new WebCrawler();
        const { html, finalUrl, statusCode } = await crawler.fetch(testUrl);

        console.log(`✓ Successfully fetched HTML`);
        console.log(`  - Final URL: ${finalUrl}`);
        console.log(`  - Status Code: ${statusCode}`);
        console.log(`  - HTML Length: ${html.length} characters`);
        console.log('');

        console.log('2. Testing AnalysisBuilder');
        console.log('-'.repeat(60));

        const analysis = await AnalysisBuilder.build(testUrl, html);

        console.log(`✓ Successfully built webpage analysis`);
        console.log('');

        console.log('3. Analysis Results:');
        console.log('-'.repeat(60));
        console.log(`  Title: ${analysis.title}`);
        console.log(`  Description: ${analysis.description || 'N/A'}`);
        console.log(`  Viewport: ${analysis.viewport || 'N/A'}`);
        console.log('');

        console.log(`  Sections (${analysis.sections.length}):`);
        analysis.sections.forEach((section, index) => {
            console.log(`    ${index + 1}. ${section.type} (${section.layoutSignal})`);
            console.log(`       - Words: ${section.contentLength}`);
            console.log(`       - Headings: ${section.headingCount}`);
            console.log(`       - Density: ${section.contentDensity}%`);
            if (section.callsToAction && section.callsToAction.length > 0) {
                console.log(`       - CTAs: ${section.callsToAction.join(', ')}`);
            }
        });
        console.log('');

        console.log(`  Metrics:`);
        console.log(`    - Total Words: ${analysis.metrics.totalWordCount}`);
        console.log(`    - Total Headings: ${analysis.metrics.totalHeadings}`);
        console.log(`    - Mobile Optimized: ${analysis.metrics.hasMobileOptimization ? 'Yes' : 'No'}`);
        console.log('');

        console.log(`  Issues (${analysis.issues.length}):`);
        if (analysis.issues.length === 0) {
            console.log('    No issues detected');
        } else {
            analysis.issues.forEach((issue, index) => {
                console.log(`    ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`);
                if (issue.location) {
                    console.log(`       Location: ${issue.location}`);
                }
            });
        }
        console.log('');

        console.log('='.repeat(60));
        console.log('✓ All tests passed successfully!');
        console.log('='.repeat(60));
        console.log('');
        console.log('Full analysis object:');
        console.log(JSON.stringify(analysis, null, 2));
    } catch (error) {
        console.error('');
        console.error('✗ Test failed with error:');
        console.error(error.message);
        console.error('');
        console.error('Stack trace:');
        console.error(error.stack);
        process.exit(1);
    }
}

// Run test
testCrawler();
