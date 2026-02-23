/**
 * @fileoverview CodeGenerator — Phase 8.1–8.4 Deterministic Render Plan Construction.
 *
 * This module accepts a validated `AIRedesignPlan` and `WebPageAnalysis`, validates
 * every section against the backend template registry, then constructs and returns
 * a structured render plan (pure data — no JSX, no files, no side effects).
 *
 * Phases implemented here:
 *  - 8.1 Section → TemplateRegistry mapping
 *  - 8.2 Variant validation
 *  - 8.3 Required props validation
 *  - 8.4 Render plan construction (pure data structure)
 *
 * NOT implemented here (separate batch 8.5–8.7):
 *  - File generation
 *  - JSX rendering / preview
 *  - Filesystem logic
 *
 * @module backend/modules/CodeGenerator
 */

import {
    validateSectionOrdering,
    validateSectionType,
    validateVariant,
    validateRequiredProps,
    validateLayoutVariantKeys,
} from './RenderPlanValidator.js';

// =============================================================================
// Backend Template Registry
// =============================================================================

/**
 * IMPORTANT:
 * This registry MUST stay in sync with frontend/src/templates/TemplateRegistry.js.
 * Any change in template variants or requiredProps must be mirrored here.
 * Drift between the two will break deterministic code generation.
 *
 * Source of truth for variants: frontend/src/templates/templateUtils.js → VARIANTS
 * Source of truth for requiredProps: frontend/src/templates/TemplateRegistry.js → TEMPLATE_REGISTRY
 *
 * This backend mirror exists because the frontend TemplateRegistry imports React
 * components, which cannot be loaded in a Node.js backend context.
 *
 * @type {Object.<string, { componentName: string, variants: string[], requiredProps: string[] }>}
 */
const BACKEND_TEMPLATE_REGISTRY = {
    /** 7.2 — Navigation header */
    navigation: {
        componentName: 'NavHeader',
        variants: ['minimal', 'centered', 'sticky'],
        requiredProps: ['logoText', 'navLinks'],
    },

    /** 7.3 — Hero section */
    hero: {
        componentName: 'HeroSection',
        variants: ['centered', 'split', 'fullwidth'],
        requiredProps: ['headline'],
    },

    /** 7.4 — Features section */
    features: {
        componentName: 'FeaturesSection',
        variants: ['grid3', 'grid2', 'list'],
        requiredProps: ['heading', 'features'],
    },

    /** 7.5 — Course showcase */
    courses: {
        componentName: 'CourseShowcase',
        variants: ['scroll', 'grid'],
        requiredProps: ['heading', 'courses'],
    },

    /** 7.6 — Benefits / How It Works */
    benefits: {
        componentName: 'BenefitsSection',
        variants: ['alternating', 'steps'],
        requiredProps: ['heading', 'items'],
    },

    /** 7.7 — Testimonials section */
    testimonials: {
        componentName: 'TestimonialsSection',
        variants: ['grid', 'carousel'],
        requiredProps: ['heading', 'testimonials'],
    },

    /** 7.8 — Pricing section */
    pricing: {
        componentName: 'PricingSection',
        variants: ['three-tier', 'two-tier'],
        requiredProps: ['heading', 'plans'],
    },

    /** 7.9 — FAQ section */
    faq: {
        componentName: 'FAQSection',
        variants: ['default'],
        requiredProps: ['faqs'],
    },

    /** 7.10 — Final CTA section */
    cta: {
        componentName: 'FinalCTA',
        variants: ['gradient', 'image-overlay'],
        requiredProps: ['headline'],
    },

    /** 7.11 — Footer */
    footer: {
        componentName: 'Footer',
        variants: ['default'],
        requiredProps: ['logoText', 'linkGroups'],
    },
};

// =============================================================================
// Types (JSDoc only — no runtime enforcement in this module beyond validators)
// =============================================================================

/**
 * A single item in the render plan output.
 *
 * @typedef {Object} RenderPlanItem
 * @property {string} sectionType   - Section type key (e.g. "hero", "features").
 * @property {string} componentName - React component name from the registry (e.g. "HeroSection").
 * @property {string} variant       - Validated variant string (e.g. "split").
 * @property {Object} props         - Validated props object for this section.
 */

// =============================================================================
// Internal helpers
// =============================================================================

/**
 * Extracts props for a given section type from the `AIRedesignPlan`.
 *
 * ## Rule 1 — Props Precedence (explicit override, NOT a merge)
 *
 * Source priority (highest to lowest):
 *  1. `redesignPlan.sectionProps[sectionType]` — if this key exists and is a
 *     non-null plain object, it is returned as-is and all other sources are
 *     IGNORED. There is no merging with componentMappings.
 *  2. `redesignPlan.componentMappings[].props` — the first mapping entry whose
 *     `sectionType` matches is used, only if source #1 was absent/falsy.
 *  3. `{}` empty object — if neither source provides props. Required-props
 *     validation in the caller will surface any gaps.
 *
 * This precedence is deterministic: for identical inputs the same source is
 * always chosen. The two sources are never combined.
 *
 * ## Rule 4 — webPageAnalysis is NOT used for prop extraction in Phase 8.1–8.4
 *
 * `webPageAnalysis` is accepted as a parameter for forward-compatibility with
 * Phase 8.5–8.7 (where it may be used to populate default values). In this
 * phase it is intentionally left unread here — there are no hidden heuristics
 * or coupling to the analysis data.
 *
 * @param {string} sectionType - The section type key.
 * @param {Object} redesignPlan - The validated AIRedesignPlan.
 * @param {Object} _webPageAnalysis - Reserved for Phase 8.5–8.7. Not read.
 * @returns {Object} A plain props object (may be empty — validators will catch missing requiredProps).
 */
// eslint-disable-next-line no-unused-vars
function extractPropsForSection(sectionType, redesignPlan, _webPageAnalysis) {
    // ── Source 1: sectionProps (highest priority — absolute override) ────────
    if (redesignPlan.sectionProps && typeof redesignPlan.sectionProps === 'object') {
        const explicit = redesignPlan.sectionProps[sectionType];
        if (explicit && typeof explicit === 'object' && !Array.isArray(explicit)) {
            // Rule 1: sectionProps wins entirely. componentMappings is NOT consulted.
            return explicit;
        }
    }

    // ── Source 2: componentMappings (fallback — used only when Source 1 absent) ──
    if (Array.isArray(redesignPlan.componentMappings)) {
        const mapping = redesignPlan.componentMappings.find(
            (m) => m && m.sectionType === sectionType
        );
        if (mapping && mapping.props && typeof mapping.props === 'object' && !Array.isArray(mapping.props)) {
            return mapping.props;
        }
    }

    // ── Source 3: no props found — empty object, let validator surface the gap ──
    return {};
}

// =============================================================================
// 8.4 — Render Plan Construction
// =============================================================================

/**
 * Builds a deterministic render plan from a validated `AIRedesignPlan` and `WebPageAnalysis`.
 *
 * Steps (all validation runs BEFORE any plan items are constructed):
 *  1. Validate `redesignPlan.sectionOrdering` is a non-empty array.
 *  2. For each section in ordering: validate section type exists in registry.
 *  3. For each section: validate variant (if provided) or resolve default.
 *  4. For each section: extract and validate required props.
 *  5. If all validations pass, construct and return the render plan array.
 *
 * This function is pure and deterministic: the same inputs always produce the same output.
 * No randomness, no timestamps, no dynamic behavior.
 *
 * @param {Object} redesignPlan   - A validated AIRedesignPlan object.
 *   @param {string[]}  redesignPlan.sectionOrdering   - Ordered list of section type keys.
 *   @param {Object}    redesignPlan.layoutVariants     - Map of sectionType → variant string.
 *   @param {Object}    [redesignPlan.sectionProps]     - Optional map of sectionType → props object.
 *   @param {Object[]}  [redesignPlan.componentMappings] - AI component mapping instructions.
 *
 * @param {Object} webPageAnalysis - A validated WebPageAnalysis object.
 *   @param {string}    webPageAnalysis.url      - Analyzed page URL.
 *   @param {string}    webPageAnalysis.title    - Page title.
 *   @param {Object[]}  webPageAnalysis.sections - Detected page sections.
 *
 * @returns {RenderPlanItem[]} An ordered array of render plan items (one per section).
 * @throws {Error} If sectionOrdering is missing or empty.
 * @throws {Error} If any section type is not in the registry.
 * @throws {Error} If any variant string is invalid for its section type.
 * @throws {Error} If any required prop is missing from the extracted props.
 *
 * @example
 * const plan = buildRenderPlan(redesignPlan, webPageAnalysis);
 * // => [
 * //   { sectionType: 'hero', componentName: 'HeroSection', variant: 'split', props: { headline: '...' } },
 * //   { sectionType: 'features', componentName: 'FeaturesSection', variant: 'grid3', props: { heading: '...', features: [...] } },
 * // ]
 */
export function buildRenderPlan(redesignPlan, webPageAnalysis) {
    // ── Input presence checks ──────────────────────────────────────────────
    if (!redesignPlan || typeof redesignPlan !== 'object') {
        throw new Error('[CodeGenerator] buildRenderPlan: redesignPlan must be a non-null object.');
    }
    if (!webPageAnalysis || typeof webPageAnalysis !== 'object') {
        throw new Error('[CodeGenerator] buildRenderPlan: webPageAnalysis must be a non-null object.');
    }

    // ── 8.1 Validate sectionOrdering ──────────────────────────────────────
    const { sectionOrdering, layoutVariants = {} } = redesignPlan;
    validateSectionOrdering(sectionOrdering);   // Rule 2: also rejects duplicates

    // ── Rule 3: layoutVariants must not reference sections outside sectionOrdering
    validateLayoutVariantKeys(layoutVariants, sectionOrdering);

    // ── Validation pass: collect all validated entries before constructing ──
    // Each entry: { sectionType, registryEntry, resolvedVariant, props }
    const validatedEntries = [];

    for (const sectionType of sectionOrdering) {
        // 8.1 — Map section type → registry entry (throws on unknown type)
        const registryEntry = validateSectionType(sectionType, BACKEND_TEMPLATE_REGISTRY);

        // 8.2 — Validate variant (throws on invalid non-null variant; resolves default for absent)
        const requestedVariant = layoutVariants[sectionType] ?? null;
        const resolvedVariant = validateVariant(sectionType, requestedVariant, registryEntry);

        // 8.3 — Extract props then validate required props (throws if any required prop is missing)
        const props = extractPropsForSection(sectionType, redesignPlan, webPageAnalysis);
        validateRequiredProps(sectionType, props, registryEntry.requiredProps);

        validatedEntries.push({
            sectionType,
            registryEntry,
            resolvedVariant,
            props,
        });
    }

    // ── 8.4 — Construction pass (only reached if ALL validations passed) ──
    return validatedEntries.map(({ sectionType, registryEntry, resolvedVariant, props }) => ({
        sectionType,
        componentName: registryEntry.componentName,
        variant: resolvedVariant,
        props,
    }));
}

/**
 * Returns a plain JS object describing the shape of a single render plan item.
 * Intended for documentation and downstream consumers to understand the structure
 * without importing type definitions.
 *
 * @returns {{ sectionType: string, componentName: string, variant: string, props: Object }}
 *   A descriptor of a render plan item.
 */
export function getRenderPlanItemSchema() {
    return {
        sectionType: 'string — one of the registered section type keys',
        componentName: 'string — React component name from the registry',
        variant: 'string — validated variant for this section',
        props: 'object — validated props to pass to the component',
    };
}

/**
 * Exposes the backend registry for inspection and testing.
 * Do NOT mutate the returned object.
 *
 * @returns {Object.<string, { componentName: string, variants: string[], requiredProps: string[] }>}
 */
export function getBackendTemplateRegistry() {
    return BACKEND_TEMPLATE_REGISTRY;
}
