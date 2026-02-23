/**
 * @fileoverview Test suite for Phase 8.1–8.4 (Render Plan Construction) + Architectural Rules.
 *
 * Tests cover:
 *  - 8.1 Section type → registry mapping
 *  - 8.2 Variant validation (valid, invalid, absent → default)
 *  - 8.3 Required props validation
 *  - 8.4 Render plan construction (happy path + all failure modes)
 *  - Rule 1: Props precedence (sectionProps wins over componentMappings, no merge)
 *  - Rule 2: Duplicate section rejection
 *  - Rule 3: layoutVariants unknown key rejection
 *  - Rule 4: webPageAnalysis non-usage in Phase 8.1–8.4
 *
 * Run with:  node backend/test-phase8.js
 */

import { buildRenderPlan, getBackendTemplateRegistry } from './modules/CodeGenerator.js';
import {
    validateSectionOrdering,
    validateSectionType,
    validateVariant,
    validateRequiredProps,
    validateLayoutVariantKeys,
} from './modules/RenderPlanValidator.js';

// ─────────────────────────────────────────────────────────────────────────────
// Test harness
// ─────────────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

/**
 * Asserts that `fn()` throws an error whose message includes `expectedFragment`.
 */
function assertThrows(label, fn, expectedFragment) {
    try {
        fn();
        console.error(`  ✗ FAIL [${label}]: Expected error containing "${expectedFragment}" but no error was thrown.`);
        failed++;
    } catch (err) {
        if (err.message.includes(expectedFragment)) {
            console.log(`  ✓ PASS [${label}]`);
            passed++;
        } else {
            console.error(
                `  ✗ FAIL [${label}]: Error thrown but message did not contain "${expectedFragment}".\n` +
                `    Actual message: ${err.message}`
            );
            failed++;
        }
    }
}

/**
 * Asserts that `fn()` does NOT throw and its return value satisfies `checkFn`.
 */
function assertOk(label, fn, checkFn) {
    try {
        const result = fn();
        if (!checkFn || checkFn(result)) {
            console.log(`  ✓ PASS [${label}]`);
            passed++;
        } else {
            console.error(`  ✗ FAIL [${label}]: Return value did not satisfy assertion. Got: ${JSON.stringify(result)}`);
            failed++;
        }
    } catch (err) {
        console.error(`  ✗ FAIL [${label}]: Unexpected error: ${err.message}`);
        failed++;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: minimal valid redesign plan and analysis
// ─────────────────────────────────────────────────────────────────────────────

function makeRedesignPlan(overrides = {}) {
    return {
        sectionOrdering: ['hero', 'features', 'footer'],
        layoutVariants: {
            hero: 'split',
            features: 'grid3',
            footer: 'default',
        },
        contentTone: 'professional',
        contentEmphasis: ['headline'],
        missingSections: [],
        redundantSections: [],
        componentMappings: [],
        sectionProps: {
            hero: { headline: 'Welcome to ReForge' },
            features: { heading: 'Key Features', features: [{ icon: '⚡', title: 'Fast', description: 'Very fast.' }] },
            footer: { logoText: 'ReForge', linkGroups: [] },
        },
        ...overrides,
    };
}

function makeWebPageAnalysis(overrides = {}) {
    return {
        url: 'https://example.com',
        title: 'Example Site',
        description: 'An example site.',
        sections: [
            { type: 'hero', contentLength: 100, headingCount: 1, contentDensity: 50, layoutSignal: 'single-column' },
        ],
        issues: [],
        metrics: { totalWordCount: 500, totalHeadings: 5, hasMobileOptimization: true },
        ...overrides,
    };
}

const REGISTRY = getBackendTemplateRegistry();

// ─────────────────────────────────────────────────────────────────────────────
// 1. RenderPlanValidator unit tests
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── RenderPlanValidator: validateSectionOrdering ──');

assertOk(
    'valid array passes',
    () => validateSectionOrdering(['hero', 'footer']),
    (r) => r === undefined
);

assertThrows(
    'null throws',
    () => validateSectionOrdering(null),
    'sectionOrdering'
);

assertThrows(
    'empty array throws',
    () => validateSectionOrdering([]),
    'sectionOrdering'
);

assertThrows(
    'string throws',
    () => validateSectionOrdering('hero,footer'),
    'sectionOrdering'
);

// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── RenderPlanValidator: validateSectionType ──');

assertOk(
    '"hero" is registered',
    () => validateSectionType('hero', REGISTRY),
    (entry) => entry.componentName === 'HeroSection'
);

assertOk(
    '"footer" returns Footer entry',
    () => validateSectionType('footer', REGISTRY),
    (entry) => entry.componentName === 'Footer'
);

assertThrows(
    'unknown type "landing_page" throws',
    () => validateSectionType('landing_page', REGISTRY),
    'Unknown section type'
);

assertThrows(
    'empty string throws',
    () => validateSectionType('', REGISTRY),
    'non-empty string'
);

// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── RenderPlanValidator: validateVariant ──');

assertOk(
    'valid variant "split" for hero',
    () => validateVariant('hero', 'split', REGISTRY.hero),
    (v) => v === 'split'
);

assertOk(
    'undefined variant resolves to default "centered"',
    () => validateVariant('hero', undefined, REGISTRY.hero),
    (v) => v === 'centered'
);

assertOk(
    'null variant resolves to default "centered"',
    () => validateVariant('hero', null, REGISTRY.hero),
    (v) => v === 'centered'
);

assertThrows(
    'invalid variant string throws (no silent fallback)',
    () => validateVariant('hero', 'invalid-variant', REGISTRY.hero),
    'Invalid variant'
);

assertThrows(
    'invalid variant for "pricing" throws',
    () => validateVariant('pricing', 'grid', REGISTRY.pricing),
    'Invalid variant'
);

// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── RenderPlanValidator: validateRequiredProps ──');

assertOk(
    'all required props present — hero',
    () => validateRequiredProps('hero', { headline: 'Hello' }, ['headline']),
    (r) => r === undefined
);

assertOk(
    'all required props present — footer',
    () => validateRequiredProps('footer', { logoText: 'Foo', linkGroups: [] }, ['logoText', 'linkGroups']),
    (r) => r === undefined
);

assertThrows(
    'missing single required prop throws',
    () => validateRequiredProps('hero', {}, ['headline']),
    'Missing required props'
);

assertThrows(
    'missing multiple required props — error lists all',
    () => validateRequiredProps('features', {}, ['heading', 'features']),
    'Missing required props'
);

assertThrows(
    'null props value treated as missing',
    () => validateRequiredProps('hero', { headline: null }, ['headline']),
    'Missing required props'
);

assertThrows(
    'non-object props throws',
    () => validateRequiredProps('hero', 'bad', ['headline']),
    'plain object'
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. buildRenderPlan integration tests
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── CodeGenerator: buildRenderPlan — happy path ──');

assertOk(
    'returns array with correct length',
    () => buildRenderPlan(makeRedesignPlan(), makeWebPageAnalysis()),
    (plan) => Array.isArray(plan) && plan.length === 3
);

assertOk(
    'first item is hero/HeroSection/split',
    () => buildRenderPlan(makeRedesignPlan(), makeWebPageAnalysis()),
    (plan) =>
        plan[0].sectionType === 'hero' &&
        plan[0].componentName === 'HeroSection' &&
        plan[0].variant === 'split' &&
        plan[0].props.headline === 'Welcome to ReForge'
);

assertOk(
    'last item is footer/Footer/default',
    () => buildRenderPlan(makeRedesignPlan(), makeWebPageAnalysis()),
    (plan) =>
        plan[2].sectionType === 'footer' &&
        plan[2].componentName === 'Footer' &&
        plan[2].variant === 'default'
);

// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── CodeGenerator: buildRenderPlan — variant defaults ──');

assertOk(
    'no layoutVariants specified → all sections use default variant',
    () =>
        buildRenderPlan(
            makeRedesignPlan({
                sectionOrdering: ['hero'],
                layoutVariants: {},
                sectionProps: { hero: { headline: 'Test' } },
            }),
            makeWebPageAnalysis()
        ),
    (plan) => plan[0].variant === 'centered'  // default for HeroSection
);

assertOk(
    'faq with no variant uses default "default"',
    () =>
        buildRenderPlan(
            makeRedesignPlan({
                sectionOrdering: ['faq'],
                layoutVariants: {},
                sectionProps: { faq: { faqs: [{ question: 'Q?', answer: 'A.' }] } },
            }),
            makeWebPageAnalysis()
        ),
    (plan) => plan[0].variant === 'default'
);

// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── CodeGenerator: buildRenderPlan — failure cases ──');

assertThrows(
    'empty sectionOrdering throws before plan construction',
    () => buildRenderPlan(makeRedesignPlan({ sectionOrdering: [] }), makeWebPageAnalysis()),
    'sectionOrdering'
);

assertThrows(
    'null sectionOrdering throws',
    () => buildRenderPlan(makeRedesignPlan({ sectionOrdering: null }), makeWebPageAnalysis()),
    'sectionOrdering'
);

assertThrows(
    'unknown section type throws',
    () =>
        buildRenderPlan(
            makeRedesignPlan({
                // Only provide layoutVariants for sections in sectionOrdering (Rule 3 must pass first)
                sectionOrdering: ['hero', 'unknown_section'],
                layoutVariants: { hero: 'split', unknown_section: 'default' },
                sectionProps: {
                    hero: { headline: 'Test' },
                    unknown_section: {},
                },
            }),
            makeWebPageAnalysis()
        ),
    'Unknown section type'
);

assertThrows(
    'invalid variant throws (no fallback)',
    () =>
        buildRenderPlan(
            makeRedesignPlan({
                layoutVariants: { hero: 'super-hero-layout', features: 'grid3', footer: 'default' },
            }),
            makeWebPageAnalysis()
        ),
    'Invalid variant'
);

assertThrows(
    'missing required prop throws',
    () =>
        buildRenderPlan(
            makeRedesignPlan({
                sectionOrdering: ['hero'],
                layoutVariants: { hero: 'split' },
                sectionProps: { hero: {} },  // headline is required but missing
            }),
            makeWebPageAnalysis()
        ),
    'Missing required props'
);

assertThrows(
    'missing required prop error mentions prop name',
    () =>
        buildRenderPlan(
            makeRedesignPlan({
                sectionOrdering: ['hero'],
                layoutVariants: { hero: 'split' },
                sectionProps: { hero: {} },
            }),
            makeWebPageAnalysis()
        ),
    '"headline"'
);

assertThrows(
    'null redesignPlan throws',
    () => buildRenderPlan(null, makeWebPageAnalysis()),
    'redesignPlan'
);

assertThrows(
    'null webPageAnalysis throws',
    () => buildRenderPlan(makeRedesignPlan(), null),
    'webPageAnalysis'
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. Determinism test — same input always produces same output
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── CodeGenerator: Determinism ──');

assertOk(
    'identical inputs produce identical outputs',
    () => {
        const plan1 = buildRenderPlan(makeRedesignPlan(), makeWebPageAnalysis());
        const plan2 = buildRenderPlan(makeRedesignPlan(), makeWebPageAnalysis());
        return JSON.stringify(plan1) === JSON.stringify(plan2);
    },
    Boolean
);

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// 4. Architectural Rule Tests
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── Rule 2: Duplicate Section Policy ──');

assertOk(
    'no duplicates — valid ordering passes',
    () => validateSectionOrdering(['hero', 'features', 'footer']),
    (r) => r === undefined
);

assertThrows(
    'single duplicate entry throws',
    () => validateSectionOrdering(['hero', 'hero', 'features']),
    'duplicate section types'
);

assertThrows(
    'multiple different duplicates throw',
    () => validateSectionOrdering(['hero', 'features', 'hero', 'features']),
    'duplicate section types'
);

assertThrows(
    'error message names the duplicate type',
    () => validateSectionOrdering(['hero', 'hero']),
    '"hero"'
);

assertThrows(
    'duplicate via buildRenderPlan is rejected early',
    () =>
        buildRenderPlan(
            makeRedesignPlan({
                sectionOrdering: ['hero', 'hero'],
                layoutVariants: { hero: 'split' },
                sectionProps: { hero: { headline: 'Test' } },
            }),
            makeWebPageAnalysis()
        ),
    'duplicate section types'
);

// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── Rule 3: layoutVariants Key Validation ──');

assertOk(
    'all layoutVariants keys in sectionOrdering — ok',
    () => validateLayoutVariantKeys({ hero: 'split', footer: 'default' }, ['hero', 'footer']),
    (r) => r === undefined
);

assertOk(
    'empty layoutVariants object — ok',
    () => validateLayoutVariantKeys({}, ['hero', 'footer']),
    (r) => r === undefined
);

assertOk(
    'null layoutVariants — treated as absent, ok',
    () => validateLayoutVariantKeys(null, ['hero', 'footer']),
    (r) => r === undefined
);

assertOk(
    'undefined layoutVariants — treated as absent, ok',
    () => validateLayoutVariantKeys(undefined, ['hero', 'footer']),
    (r) => r === undefined
);

assertThrows(
    'ghostSection key not in sectionOrdering throws',
    () => validateLayoutVariantKeys({ hero: 'split', ghostSection: 'grid' }, ['hero', 'footer']),
    'not present in sectionOrdering'
);

assertThrows(
    'error message names the unknown key',
    () => validateLayoutVariantKeys({ ghost: 'grid' }, ['hero']),
    '"ghost"'
);

assertThrows(
    'via buildRenderPlan — layoutVariants ghost key rejected',
    () =>
        buildRenderPlan(
            makeRedesignPlan({
                sectionOrdering: ['hero'],
                layoutVariants: { hero: 'split', features: 'grid3' },  // features not in ordering
                sectionProps: { hero: { headline: 'Test' } },
            }),
            makeWebPageAnalysis()
        ),
    'not present in sectionOrdering'
);

// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── Rule 1: Props Precedence (sectionProps wins, no merge) ──');

assertOk(
    'sectionProps wins over componentMappings for same section',
    () =>
        buildRenderPlan(
            makeRedesignPlan({
                sectionOrdering: ['hero'],
                layoutVariants: { hero: 'centered' },
                sectionProps: {
                    hero: { headline: 'FROM_SECTION_PROPS' },
                },
                componentMappings: [
                    {
                        sectionType: 'hero',
                        templateId: 'hero',
                        variant: 'split',
                        props: { headline: 'FROM_COMPONENT_MAPPINGS' },
                    },
                ],
            }),
            makeWebPageAnalysis()
        ),
    (plan) => plan[0].props.headline === 'FROM_SECTION_PROPS'  // sectionProps wins
);

assertOk(
    'componentMappings used when sectionProps absent for that section',
    () =>
        buildRenderPlan(
            makeRedesignPlan({
                sectionOrdering: ['hero'],
                layoutVariants: { hero: 'centered' },
                sectionProps: {},  // no hero key — sectionProps absent for hero
                componentMappings: [
                    {
                        sectionType: 'hero',
                        templateId: 'hero',
                        variant: 'centered',
                        props: { headline: 'FROM_MAPPINGS_FALLBACK' },
                    },
                ],
            }),
            makeWebPageAnalysis()
        ),
    (plan) => plan[0].props.headline === 'FROM_MAPPINGS_FALLBACK'
);

assertOk(
    'sectionProps wins: merged keys from componentMappings are NOT present',
    () =>
        buildRenderPlan(
            makeRedesignPlan({
                sectionOrdering: ['hero'],
                layoutVariants: { hero: 'centered' },
                sectionProps: {
                    hero: { headline: 'Primary', extraFromSectionProps: true },
                },
                componentMappings: [
                    {
                        sectionType: 'hero',
                        templateId: 'hero',
                        variant: 'centered',
                        props: { headline: 'Secondary', extraFromMappings: true },
                    },
                ],
            }),
            makeWebPageAnalysis()
        ),
    // Rule 1: no merge — only sectionProps keys present, not componentMappings keys
    (plan) =>
        plan[0].props.extraFromSectionProps === true &&
        plan[0].props.extraFromMappings === undefined
);

// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── Rule 4: webPageAnalysis Not Used For Prop Extraction ──');

assertOk(
    'webPageAnalysis data does NOT appear in render plan props',
    () =>
        buildRenderPlan(
            makeRedesignPlan({
                sectionOrdering: ['hero'],
                layoutVariants: { hero: 'centered' },
                sectionProps: { hero: { headline: 'Explicit' } },
            }),
            makeWebPageAnalysis({ title: 'PAGE_TITLE_SHOULD_NOT_LEAK', url: 'https://example.com' })
        ),
    // title from webPageAnalysis must NOT be injected into any props
    (plan) =>
        plan[0].props.headline === 'Explicit' &&
        plan[0].props.title === undefined &&
        plan[0].props.url === undefined
);

assertOk(
    'buildRenderPlan output is identical regardless of webPageAnalysis content',
    () => {
        const planA = buildRenderPlan(
            makeRedesignPlan(),
            makeWebPageAnalysis({ title: 'Version A', url: 'https://a.com' })
        );
        const planB = buildRenderPlan(
            makeRedesignPlan(),
            makeWebPageAnalysis({ title: 'Version B', url: 'https://b.com' })
        );
        return JSON.stringify(planA) === JSON.stringify(planB);
    },
    Boolean
);

console.log(`\n${'─'.repeat(56)}`);
console.log(`Phase 8.1–8.4 Tests: ${passed} passed, ${failed} failed`);

if (failed > 0) {
    console.error('Some tests FAILED. Review output above.');
    process.exit(1);
} else {
    console.log('All tests PASSED ✓');
    process.exit(0);
}
