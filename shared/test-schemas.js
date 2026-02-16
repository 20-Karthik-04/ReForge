/**
 * Test script for validating shared schemas
 * Run with: node shared/test-schemas.js
 */

import {
    WebPageAnalysisSchema,
    ReferenceAnalysisSchema,
    RedesignGoals,
    RedesignGoalSchema,
    AIPromptInputSchema,
    GeneratedOutputSchema,
    AnalyzeRequestSchema,
    validateSafe,
    validateWebPageAnalysis,
    validateAIRedesignPlan,
} from './schemas.js';

console.log('🧪 Testing ReForge Schemas\n');

// Test 1: WebPageAnalysis Schema
console.log('Test 1: WebPageAnalysis Schema');
try {
    const validAnalysis = {
        url: 'https://example.com',
        title: 'Example Website',
        description: 'An example website',
        viewport: 'width=device-width, initial-scale=1',
        sections: [
            {
                type: 'hero',
                contentLength: 150,
                headingCount: 2,
                contentDensity: 75,
                layoutSignal: 'split',
                callsToAction: ['Get Started', 'Learn More'],
            },
            {
                type: 'features',
                contentLength: 300,
                headingCount: 4,
                contentDensity: 60,
                layoutSignal: 'grid',
            },
        ],
        issues: [
            {
                type: 'accessibility',
                severity: 'medium',
                description: 'Missing alt text on images',
                location: 'Hero section',
            },
        ],
        metrics: {
            totalWordCount: 450,
            totalHeadings: 6,
            hasMobileOptimization: true,
        },
    };

    const parsed = validateWebPageAnalysis(validAnalysis);
    console.log('✅ Valid WebPageAnalysis parsed successfully');
    console.log(`   - URL: ${parsed.url}`);
    console.log(`   - Sections: ${parsed.sections.length}`);
    console.log(`   - Issues: ${parsed.issues.length}`);
} catch (error) {
    console.log('❌ WebPageAnalysis validation failed:', error.message);
}

// Test 2: Invalid WebPageAnalysis (should fail)
console.log('\nTest 2: Invalid WebPageAnalysis (missing required fields)');
try {
    const invalidAnalysis = {
        url: 'not-a-valid-url',
        title: '',
        sections: [],
    };
    WebPageAnalysisSchema.parse(invalidAnalysis);
    console.log('❌ Should have failed validation');
} catch (error) {
    console.log('✅ Correctly rejected invalid data');
    if (error.errors && error.errors.length > 0) {
        console.log(`   - First error: ${error.errors[0].message}`);
    }
}

// Test 3: ReferenceAnalysis Schema
console.log('\nTest 3: ReferenceAnalysis Schema');
try {
    const validReference = {
        url: 'https://reference.com',
        layoutPatterns: {
            heroType: 'split',
            featureLayout: 'grid',
            contentPattern: 'alternating',
        },
        sectionOrdering: ['hero', 'features', 'testimonials', 'pricing', 'cta'],
        visualStructure: {
            gridColumns: 3,
            spacingPattern: 'normal',
            cardLayouts: ['elevated', 'bordered'],
        },
    };

    const parsed = ReferenceAnalysisSchema.parse(validReference);
    console.log('✅ Valid ReferenceAnalysis parsed successfully');
    console.log(`   - Hero Type: ${parsed.layoutPatterns.heroType}`);
    console.log(`   - Sections: ${parsed.sectionOrdering.length}`);
} catch (error) {
    console.log('❌ ReferenceAnalysis validation failed:', error.message);
}

// Test 4: RedesignGoals
console.log('\nTest 4: RedesignGoals Constants');
try {
    const goals = [
        RedesignGoals.MODERN_DESIGN,
        RedesignGoals.IMPROVED_CONVERSION,
        RedesignGoals.MOBILE_RESPONSIVENESS,
    ];

    goals.forEach((goal) => {
        RedesignGoalSchema.parse(goal);
    });
    console.log('✅ All RedesignGoals valid');
    console.log(`   - Available goals: ${Object.values(RedesignGoals).join(', ')}`);
} catch (error) {
    console.log('❌ RedesignGoals validation failed:', error.message);
}

// Test 5: AIRedesignPlan Schema
console.log('\nTest 5: AIRedesignPlan Schema');
try {
    const validPlan = {
        sectionOrdering: ['hero', 'features', 'benefits', 'testimonials', 'pricing', 'cta'],
        layoutVariants: {
            hero: 'split',
            features: 'grid-3',
            testimonials: 'carousel',
        },
        contentTone: 'professional-friendly',
        contentEmphasis: ['value-proposition', 'social-proof', 'clear-pricing'],
        missingSections: ['faq'],
        redundantSections: [],
        componentMappings: [
            {
                sectionType: 'hero',
                templateId: 'hero-split-v1',
                variant: 'image-right',
            },
        ],
    };

    const parsed = validateAIRedesignPlan(validPlan);
    console.log('✅ Valid AIRedesignPlan parsed successfully');
    console.log(`   - Section ordering: ${parsed.sectionOrdering.length} sections`);
    console.log(`   - Missing sections: ${parsed.missingSections.join(', ') || 'none'}`);
} catch (error) {
    console.log('❌ AIRedesignPlan validation failed:', error.message);
}

// Test 6: AIPromptInput Schema
console.log('\nTest 6: AIPromptInput Schema');
try {
    const validPromptInput = {
        targetAnalysis: {
            url: 'https://example.com',
            title: 'Example',
            sections: [
                {
                    type: 'hero',
                    contentLength: 100,
                    headingCount: 1,
                    contentDensity: 50,
                    layoutSignal: 'single-column',
                },
            ],
            issues: [],
            metrics: {
                totalWordCount: 100,
                totalHeadings: 1,
                hasMobileOptimization: false,
            },
        },
        goals: [RedesignGoals.MODERN_DESIGN, RedesignGoals.MOBILE_RESPONSIVENESS],
        constraints: 'Keep existing brand colors',
    };

    const parsed = AIPromptInputSchema.parse(validPromptInput);
    console.log('✅ Valid AIPromptInput parsed successfully');
    console.log(`   - Goals: ${parsed.goals.length}`);
} catch (error) {
    console.log('❌ AIPromptInput validation failed:', error.message);
}

// Test 7: GeneratedOutput Schema
console.log('\nTest 7: GeneratedOutput Schema');
try {
    const validOutput = {
        files: [
            {
                path: 'src/App.jsx',
                content: 'import React from "react";...',
                type: 'component',
            },
            {
                path: 'src/index.css',
                content: '@tailwind base;...',
                type: 'style',
            },
        ],
        dependencies: [
            { package: 'react', version: '^18.0.0' },
            { package: 'tailwindcss', version: '^3.0.0' },
        ],
        previewMetadata: {
            entryPoint: 'src/App.jsx',
            framework: 'react',
        },
    };

    const parsed = GeneratedOutputSchema.parse(validOutput);
    console.log('✅ Valid GeneratedOutput parsed successfully');
    console.log(`   - Files: ${parsed.files.length}`);
    console.log(`   - Dependencies: ${parsed.dependencies.length}`);
} catch (error) {
    console.log('❌ GeneratedOutput validation failed:', error.message);
}

// Test 8: API Request Schema
console.log('\nTest 8: API Request Schema (AnalyzeRequest)');
try {
    const validRequest = { url: 'https://example.com' };
    AnalyzeRequestSchema.parse(validRequest);
    console.log('✅ Valid AnalyzeRequest parsed successfully');

    // Test invalid URL
    try {
        AnalyzeRequestSchema.parse({ url: 'not-a-url' });
        console.log('❌ Should have rejected invalid URL');
    } catch {
        console.log('✅ Correctly rejected invalid URL');
    }
} catch (error) {
    console.log('❌ AnalyzeRequest validation failed:', error.message);
}

// Test 9: validateSafe helper function
console.log('\nTest 9: validateSafe helper function');
const safeResult = validateSafe(AnalyzeRequestSchema, { url: 'invalid-url' });
if (safeResult.success) {
    console.log('❌ Should have returned success: false');
} else {
    console.log('✅ validateSafe correctly returned error object');
    if (safeResult.error && safeResult.error.errors) {
        console.log(`   - Error count: ${safeResult.error.errors.length}`);
    }
}

console.log('\n✨ All tests completed!\n');
