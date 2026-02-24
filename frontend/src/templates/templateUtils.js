/**
 * @fileoverview Template utilities shared across all ReForge template components.
 *
 * VARIANTS is the single source of truth for all valid variant names.
 * Phase 8's CodeGenerator must validate against this object before assembling any component.
 *
 * @module templateUtils
 */

/**
 * Canonical variant registry for all ReForge template components.
 *
 * Each key maps to the component name; the value is an ordered array of
 * supported variant strings. Order matters — the first entry is the default.
 *
 * Phase 8 usage pattern:
 * ```js
 * import { VARIANTS } from '../templates/templateUtils.js';
 * if (!VARIANTS.NavHeader.includes(variant)) throw new Error(`Invalid NavHeader variant: ${variant}`);
 * ```
 *
 * @constant
 * @type {Object.<string, string[]>}
 */
export const VARIANTS = {
    NavHeader: ['minimal', 'centered', 'sticky'],
    HeroSection: ['centered', 'split', 'fullwidth'],
    FeaturesSection: ['grid3', 'grid2', 'list'],
    CourseShowcase: ['scroll', 'grid'],
    BenefitsSection: ['alternating', 'steps'],
    // Phase 7.7
    TestimonialsSection: ['grid', 'carousel'],
    // Phase 7.8
    PricingSection: ['three-tier', 'two-tier'],
    // Phase 7.9 — FAQSection has no variants; single accordion layout.
    FAQSection: ['default'],
    // Phase 7.10
    FinalCTA: ['gradient', 'image-overlay'],
    // Phase 7.11 — Footer has no layout variants; column count is data-driven.
    Footer: ['default'],
};

/**
 * Returns the default variant (first in array) for a given component.
 *
 * @param {keyof typeof VARIANTS} componentName - Component key in VARIANTS.
 * @returns {string} The default variant string.
 * @throws {Error} If the component is not registered in VARIANTS.
 *
 * @example
 * getDefaultVariant('NavHeader'); // 'minimal'
 */
export function getDefaultVariant(componentName) {
    if (!VARIANTS[componentName]) {
        throw new Error(`[templateUtils] Unknown component: "${componentName}". Register it in VARIANTS.`);
    }
    return VARIANTS[componentName][0];
}

/**
 * Validates a variant string against the registered variants for a component.
 * Returns the variant if valid, otherwise falls back to the default variant and
 * emits a console warning (non-throwing — safe for runtime production use).
 *
 * Phase 8 generators should call the throwing version directly; this version is
 * intended for component render-time prop coercion.
 *
 * @param {keyof typeof VARIANTS} componentName - Component key in VARIANTS.
 * @param {string} variant - The variant string to validate.
 * @returns {string} A valid variant string.
 */
export function resolveVariant(componentName, variant) {
    const allowed = VARIANTS[componentName];
    if (!allowed) {
        // eslint-disable-next-line no-console
        console.warn(`[templateUtils] Unknown component "${componentName}". Returning variant as-is.`);
        return variant;
    }
    if (!allowed.includes(variant)) {
        const fallback = allowed[0];
        // eslint-disable-next-line no-console
        console.warn(
            `[templateUtils] Invalid variant "${variant}" for ${componentName}. ` +
            `Expected one of: [${allowed.join(', ')}]. Falling back to "${fallback}".`
        );
        return fallback;
    }
    return variant;
}

/**
 * Lightweight class name composer — joins truthy string arguments with a space.
 * Avoids adding clsx/classnames as a dependency.
 *
 * @param {...(string|undefined|null|false)} classes - Class strings to combine.
 * @returns {string} Combined class string.
 *
 * @example
 * cn('px-4', isActive && 'bg-blue-600', 'text-white')
 */
export function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}
