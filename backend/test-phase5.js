/**
 * @fileoverview Phase 5 Test Suite - Data Sanitization & Structuring
 * Tests enhanced issue detection and analysis summary generation
 */

import { AnalysisBuilder, AnalysisSummarizer } from './modules/index.js';
import { validateWebPageAnalysis } from '../shared/schemas.js';

console.log('='.repeat(80));
console.log('PHASE 5 TEST SUITE - Data Sanitization & Structuring');
console.log('='.repeat(80));
console.log('');

/**
 * Test 1: Enhanced Accessibility Issue Detection
 */
async function testAccessibilityIssues() {
    console.log('TEST 1: Enhanced Accessibility Issue Detection');
    console.log('-'.repeat(80));

    const testHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Accessibility Test Page</title>
            <meta name="viewport" content="width=500px">
        </head>
        <body>
            <div class="header">
                <h2>Welcome</h2>
            </div>
            <div class="main-content">
                <img src="logo.png">
                <img src="hero.jpg" alt="">
                <img src="banner.jpg" alt="Company Banner">
                <h4>Our Features</h4>
                <p>Some content here</p>
            </div>
            <div class="footer">
                <p>Copyright 2024</p>
            </div>
        </body>
        </html>
    `;

    try {
        const analysis = await AnalysisBuilder.build('https://test.example.com', testHTML);

        console.log('✅ Analysis completed successfully');
        console.log(`Found ${analysis.issues.length} issues:`);

        const accessibilityIssues = analysis.issues.filter((i) => i.type === 'accessibility');
        console.log(`  - ${accessibilityIssues.length} accessibility issues`);

        // Check for Phase 5 specific issues
        const missingAltIssue = analysis.issues.find((i) => i.description.includes('missing alt text'));
        const semanticHTMLIssue = analysis.issues.find((i) => i.description.includes('semantic HTML'));
        const missingH1Issue = analysis.issues.find((i) => i.description.includes('Missing h1'));
        const skippedHeadingIssue = analysis.issues.find((i) => i.description.includes('Skipped heading level'));

        console.log('');
        console.log('Phase 5 Enhanced Checks:');
        console.log(`  ✓ Missing alt text detection: ${missingAltIssue ? 'PASS' : 'FAIL'}`);
        console.log(`  ✓ Semantic HTML detection: ${semanticHTMLIssue ? 'PASS' : 'FAIL'}`);
        console.log(`  ✓ Missing h1 detection: ${missingH1Issue ? 'PASS' : 'FAIL'}`);
        console.log(`  ✓ Skipped heading levels: ${skippedHeadingIssue ? 'PASS' : 'FAIL'}`);

        console.log('');
        console.log('Detected Issues:');
        analysis.issues.forEach((issue) => {
            console.log(`  [${issue.severity.toUpperCase()}] ${issue.type}: ${issue.description}`);
            if (issue.location) {
                console.log(`    Location: ${issue.location}`);
            }
        });

        return true;
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return false;
    }
}

/**
 * Test 2: UX Issue Detection
 */
async function testUXIssues() {
    console.log('');
    console.log('TEST 2: UX Issue Detection');
    console.log('-'.repeat(80));

    const testHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>UX Test Page</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
            <section>
                <h1>Landing Page</h1>
                ${Array(200).fill('<p>Lorem ipsum dolor sit amet</p>').join('')}
            </section>
            <section>
                <h2>Empty Section</h2>
            </section>
            <section>
                <a class="btn">CTA 1</a>
                <a class="btn">CTA 2</a>
                <a class="btn">CTA 3</a>
                <a class="btn">CTA 4</a>
                <a class="btn">CTA 5</a>
                <a class="btn">CTA 6</a>
                <a class="btn">CTA 7</a>
                <a class="btn">CTA 8</a>
                <a class="btn">CTA 9</a>
                <a class="btn">CTA 10</a>
                <a class="btn">CTA 11</a>
                <a class="btn">CTA 12</a>
            </section>
        </body>
        </html>
    `;

    try {
        const analysis = await AnalysisBuilder.build('https://test-ux.example.com', testHTML);

        console.log('✅ Analysis completed successfully');

        const uxIssues = analysis.issues.filter((i) => i.type === 'ux');
        console.log(`Found ${uxIssues.length} UX issues:`);

        const highDensityIssue = analysis.issues.find((i) => i.description.includes('high content density'));
        const excessiveCTAIssue = analysis.issues.find((i) => i.description.includes('call-to-action elements detected'));

        console.log('');
        console.log('Phase 5 UX Checks:');
        console.log(`  ✓ High content density detection: ${highDensityIssue ? 'PASS' : 'FAIL'}`);
        console.log(`  ✓ Excessive CTAs detection: ${excessiveCTAIssue ? 'PASS' : 'FAIL'}`);

        console.log('');
        console.log('UX Issues:');
        uxIssues.forEach((issue) => {
            console.log(`  [${issue.severity.toUpperCase()}] ${issue.description}`);
        });

        return true;
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return false;
    }
}

/**
 * Test 3: Analysis Summary Generation
 */
async function testAnalysisSummary() {
    console.log('');
    console.log('TEST 3: Analysis Summary Generation');
    console.log('-'.repeat(80));

    const testHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Complete Landing Page</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
            <nav>
                <a href="/">Home</a>
            </nav>
            <section class="hero">
                <h1>Welcome to Our Platform</h1>
                <p>Transform your business with AI</p>
                <button>Get Started</button>
            </section>
            <section class="features">
                <h2>Features</h2>
                <div><img src="icon1.png" alt="Feature 1"><p>Feature 1</p></div>
                <div><img src="icon2.png" alt="Feature 2"><p>Feature 2</p></div>
                <div><img src="icon3.png" alt="Feature 3"><p>Feature 3</p></div>
            </section>
            <section class="testimonials">
                <h2>What Our Customers Say</h2>
                <blockquote>Great product!</blockquote>
            </section>
            <section class="pricing">
                <h2>Pricing</h2>
                <p>$99/month</p>
            </section>
            <section class="cta">
                <h2>Ready to get started?</h2>
                <button>Sign Up Now</button>
            </section>
            <footer>
                <p>Copyright 2024</p>
            </footer>
        </body>
        </html>
    `;

    try {
        const analysis = await AnalysisBuilder.build('https://complete.example.com', testHTML);

        console.log('✅ Analysis completed successfully');
        console.log('');

        // IMPORTANT: Call AnalysisSummarizer explicitly (NOT from analysis object)
        const summary = AnalysisSummarizer.generateSummary(analysis);

        console.log('Summary Object Structure:');
        console.log(`  - overview: ${typeof summary.overview}`);
        console.log(`  - sections: ${typeof summary.sections}`);
        console.log(`  - criticalIssues: ${typeof summary.criticalIssues}`);
        console.log(`  - recommendations: Array with ${summary.recommendations.length} items`);

        console.log('');
        console.log('Human-Readable Summary:');
        const formattedSummary = AnalysisSummarizer.formatAsText(summary);
        console.log(formattedSummary);

        // Verify summary is NOT in analysis object (purity check)
        console.log('');
        console.log('Purity Check:');
        const hasSummaryProperty = 'summary' in analysis;
        console.log(`  ✓ Summary NOT in analysis object: ${hasSummaryProperty ? 'FAIL' : 'PASS'}`);

        return !hasSummaryProperty;
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return false;
    }
}

/**
 * Test 4: Schema Validation
 */
async function testSchemaValidation() {
    console.log('');
    console.log('TEST 4: Schema Validation');
    console.log('-'.repeat(80));

    const testHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Schema Test</title>
        </head>
        <body>
            <h1>Test Page</h1>
            <p>Simple content</p>
        </body>
        </html>
    `;

    try {
        const analysis = await AnalysisBuilder.build('https://schema-test.example.com', testHTML);

        // Validate against schema
        const validatedAnalysis = validateWebPageAnalysis(analysis);

        console.log('✅ Schema validation passed');
        console.log(`  - URL: ${validatedAnalysis.url}`);
        console.log(`  - Title: ${validatedAnalysis.title}`);
        console.log(`  - Sections: ${validatedAnalysis.sections.length}`);
        console.log(`  - Issues: ${validatedAnalysis.issues.length}`);
        console.log(`  - Metrics: totalWordCount=${validatedAnalysis.metrics.totalWordCount}`);

        return true;
    } catch (error) {
        console.error('❌ Schema validation failed:', error.message);
        if (error.errors) {
            console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
        }
        return false;
    }
}

/**
 * Run all tests
 */
async function runAllTests() {
    const results = {
        accessibility: await testAccessibilityIssues(),
        ux: await testUXIssues(),
        summary: await testAnalysisSummary(),
        schema: await testSchemaValidation(),
    };

    console.log('');
    console.log('='.repeat(80));
    console.log('TEST RESULTS SUMMARY');
    console.log('='.repeat(80));
    console.log('');

    const passed = Object.values(results).filter((r) => r).length;
    const total = Object.keys(results).length;

    Object.entries(results).forEach(([name, result]) => {
        const status = result ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} - ${name}`);
    });

    console.log('');
    console.log(`Overall: ${passed}/${total} tests passed`);
    console.log('='.repeat(80));

    process.exit(passed === total ? 0 : 1);
}

// Run tests
runAllTests().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
