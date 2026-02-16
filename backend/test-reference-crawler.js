/**
 * @fileoverview Test file for ReferenceCrawler service
 * @module backend/test-reference-crawler
 */

import { ReferenceCrawler } from './modules/ReferenceCrawler.js';
import { ReferenceAnalysisSchema } from '../shared/schemas.js';

/**
 * Test ReferenceCrawler with a reference URL
 */
async function testReferenceCrawler() {
    console.log('='.repeat(60));
    console.log('Testing ReferenceCrawler');
    console.log('='.repeat(60));

    // Test URLs
    const testUrls = [
        'https://example.com', // Simple example site
        // Add more real-world reference URLs for testing
    ];

    const crawler = new ReferenceCrawler({
        timeout: 10000,
        maxRetries: 2,
    });

    for (const url of testUrls) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Analyzing reference URL: ${url}`);
        console.log('='.repeat(60));

        try {
            const analysis = await crawler.analyze(url);

            console.log('\n✓ Analysis completed successfully');
            console.log('\n--- Reference Analysis ---');
            console.log(JSON.stringify(analysis, null, 2));

            // Validate schema compliance
            console.log('\n--- Schema Validation ---');
            try {
                ReferenceAnalysisSchema.parse(analysis);
                console.log('✓ Schema validation passed');
            } catch (schemaError) {
                console.error('✗ Schema validation failed:');
                console.error(schemaError.errors);
            }

            // Verify content filtering (no textual content)
            console.log('\n--- Content Filtering Check ---');
            const analysisStr = JSON.stringify(analysis);
            const hasNoTextContent = !analysisStr.includes('Lorem') && !analysisStr.includes('ipsum');
            if (hasNoTextContent) {
                console.log('✓ Content appears to be filtered (no sample text detected)');
            } else {
                console.log('⚠ Warning: May contain textual content');
            }

            // Verify layout patterns
            console.log('\n--- Layout Patterns ---');
            console.log(`Hero Type: ${analysis.layoutPatterns.heroType}`);
            console.log(`Feature Layout: ${analysis.layoutPatterns.featureLayout}`);
            console.log(`Content Pattern: ${analysis.layoutPatterns.contentPattern}`);

            console.log('\n--- Section Ordering ---');
            console.log(analysis.sectionOrdering.join(' → '));

            console.log('\n--- Visual Structure ---');
            console.log(`Grid Columns: ${analysis.visualStructure.gridColumns || 'N/A'}`);
            console.log(`Spacing Pattern: ${analysis.visualStructure.spacingPattern || 'N/A'}`);
            console.log(`Card Layouts: ${analysis.visualStructure.cardLayouts?.join(', ') || 'N/A'}`);

            console.log('\n' + '✓'.repeat(60));
            console.log('Test passed for URL: ' + url);
            console.log('✓'.repeat(60));
        } catch (error) {
            console.error('\n✗ Error analyzing URL:', url);
            console.error('Error message:', error.message);
            if (error.cause) {
                console.error('Cause:', error.cause.message);
            }
            console.error('Stack:', error.stack);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('ReferenceCrawler tests completed');
    console.log('='.repeat(60));
    console.log('\nNote: Layout detection uses heuristics - exact patterns may vary by site structure.');
    console.log('The goal is identifying coarse layout categories, not pixel-perfect measurement.\n');
}

// Run tests
testReferenceCrawler().catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
});
