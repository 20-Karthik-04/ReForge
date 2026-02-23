/**
 * @fileoverview RenderPlanValidator — pure, stateless validation helpers for Phase 8 render plan construction.
 *
 * All functions in this module are:
 *  - Pure (no side effects, no I/O)
 *  - Deterministic (same inputs always produce same result)
 *  - Throwing (invalid input always throws — no silent fallbacks)
 *
 * These helpers are intentionally decoupled from `CodeGenerator.js` so they can be
 * imported and tested independently.
 *
 * ## Architectural Rules (Phase 8.1–8.4)
 *
 * ### Rule 1 — Props Precedence (enforced in CodeGenerator.extractPropsForSection)
 *   `redesignPlan.sectionProps[sectionType]` has absolute precedence over
 *   `redesignPlan.componentMappings[].props`. The two sources are NEVER merged.
 *   If sectionProps is present and truthy for a section, componentMappings props
 *   are ignored entirely for that section. This is an explicit override, not a merge.
 *
 * ### Rule 2 — Duplicate Section Policy (enforced by validateSectionOrdering)
 *   Duplicate entries in `sectionOrdering` are DISALLOWED and cause an immediate throw.
 *   Rationale: props are keyed by sectionType (not by position), so two occurrences
 *   of the same type would receive identical props — making the duplicate meaningless
 *   and the output non-deterministic when sources diverge.
 *
 * ### Rule 3 — layoutVariants Key Validation (enforced by validateLayoutVariantKeys)
 *   All keys present in `redesignPlan.layoutVariants` MUST appear in `sectionOrdering`.
 *   Extra keys (variants for sections not being rendered) are treated as errors — they
 *   indicate a mismatch between the AI plan's variant map and its section list, which
 *   signals an upstream bug or a stale plan.
 *
 * ### Rule 4 — webPageAnalysis Usage
 *   In Phase 8.1–8.4, `webPageAnalysis` is accepted by `buildRenderPlan` as a
 *   parameter for forward-compatibility with Phase 8.5–8.7, but it is NOT read
 *   for prop extraction. All props must come from `redesignPlan.sectionProps` or
 *   `redesignPlan.componentMappings`. There are no hidden heuristics or coupling.
 *
 * @module backend/modules/RenderPlanValidator
 */

// =============================================================================
// 8.1 — Section → TemplateRegistry Mapping
// =============================================================================

/**
 * Looks up a section type in the provided backend registry and returns its entry.
 *
 * @param {string} sectionType - The section type key (e.g. "hero", "features").
 * @param {Object.<string, {componentName: string, variants: string[], requiredProps: string[]}>} registry
 *   The backend template registry to look up against.
 * @returns {{ componentName: string, variants: string[], requiredProps: string[] }}
 *   The registry entry for the section type.
 * @throws {Error} If `sectionType` is not registered.
 *
 * @example
 * const entry = validateSectionType('hero', BACKEND_TEMPLATE_REGISTRY);
 * // => { componentName: 'HeroSection', variants: ['centered','split','fullwidth'], requiredProps: ['headline'] }
 */
export function validateSectionType(sectionType, registry) {
    if (typeof sectionType !== 'string' || sectionType.trim() === '') {
        throw new Error(
            `[CodeGenerator] Section type must be a non-empty string. Received: ${JSON.stringify(sectionType)}`
        );
    }

    const entry = registry[sectionType];
    if (!entry) {
        const knownTypes = Object.keys(registry).join(', ');
        throw new Error(
            `[CodeGenerator] Unknown section type: "${sectionType}". ` +
            `Known section types are: [${knownTypes}]`
        );
    }

    return entry;
}

// =============================================================================
// 8.2 — Variant Validation
// =============================================================================

/**
 * Validates a variant string against the allowed variants for a section.
 *
 * Rules:
 *  - If `variant` is `undefined` or `null`, the default variant (first in array) is returned silently.
 *  - If `variant` is provided but invalid, an error is thrown — **no silent fallback**.
 *  - If `variant` is valid, it is returned as-is.
 *
 * @param {string} sectionType - The section type key (for error messages).
 * @param {string | undefined | null} variant - The requested variant string, or absent.
 * @param {{ variants: string[] }} registryEntry - The registry entry containing valid variants.
 * @returns {string} A valid, resolved variant string.
 * @throws {Error} If `variant` is a non-null string not present in `registryEntry.variants`.
 *
 * @example
 * validateVariant('hero', 'split', { variants: ['centered','split','fullwidth'] });
 * // => 'split'
 *
 * validateVariant('hero', undefined, { variants: ['centered','split','fullwidth'] });
 * // => 'centered'  (default)
 *
 * validateVariant('hero', 'unknown', { variants: ['centered','split','fullwidth'] });
 * // throws Error: [CodeGenerator] Invalid variant "unknown" for section "hero" ...
 */
export function validateVariant(sectionType, variant, registryEntry) {
    const { variants } = registryEntry;

    // No variant specified → use the default (first in array)
    if (variant === undefined || variant === null) {
        return variants[0];
    }

    // Variant provided → must be exactly one of the registered values
    if (!variants.includes(variant)) {
        throw new Error(
            `[CodeGenerator] Invalid variant "${variant}" for section "${sectionType}". ` +
            `Valid variants are: [${variants.join(', ')}]. ` +
            `No fallback is performed — provide a valid variant or omit to use the default ("${variants[0]}").`
        );
    }

    return variant;
}

// =============================================================================
// 8.3 — Required Props Validation
// =============================================================================

/**
 * Validates that all required props for a section type are present in the provided props object.
 *
 * All missing props are collected before throwing, so the error message lists every
 * absent prop rather than failing on the first one.
 *
 * @param {string} sectionType - The section type key (for error messages).
 * @param {Object} props - The props object to validate.
 * @param {string[]} requiredProps - Array of required prop key strings.
 * @returns {void}
 * @throws {Error} If one or more required props are missing from `props`.
 *
 * @example
 * validateRequiredProps('hero', { headline: 'Hello' }, ['headline']);
 * // => (no error)
 *
 * validateRequiredProps('hero', {}, ['headline', 'subheadline']);
 * // throws Error: [CodeGenerator] Missing required props for section "hero": ["headline", "subheadline"]
 */
export function validateRequiredProps(sectionType, props, requiredProps) {
    if (!props || typeof props !== 'object' || Array.isArray(props)) {
        throw new Error(
            `[CodeGenerator] Props for section "${sectionType}" must be a plain object. ` +
            `Received: ${JSON.stringify(props)}`
        );
    }

    const missing = requiredProps.filter(
        (key) => !(key in props) || props[key] === undefined || props[key] === null
    );

    if (missing.length > 0) {
        throw new Error(
            `[CodeGenerator] Missing required props for section "${sectionType}": ` +
            `[${missing.map((k) => `"${k}"`).join(', ')}]. ` +
            `Provided props keys: [${Object.keys(props).map((k) => `"${k}"`).join(', ')}]`
        );
    }
}

// =============================================================================
// Helper — sectionOrdering validation
// =============================================================================

/**
 * Validates that `sectionOrdering` is a non-empty array of strings.
 *
 * @param {unknown} sectionOrdering - The sectionOrdering value from AIRedesignPlan.
 * @returns {void}
 * @throws {Error} If `sectionOrdering` is not a non-empty array.
 *
 * @example
 * validateSectionOrdering(['hero', 'features', 'footer']); // ok
 * validateSectionOrdering([]);   // throws
 * validateSectionOrdering(null); // throws
 */
export function validateSectionOrdering(sectionOrdering) {
    if (!Array.isArray(sectionOrdering)) {
        throw new Error(
            `[CodeGenerator] AIRedesignPlan.sectionOrdering must be an array. ` +
            `Received: ${JSON.stringify(sectionOrdering)}`
        );
    }

    if (sectionOrdering.length === 0) {
        throw new Error(
            `[CodeGenerator] AIRedesignPlan.sectionOrdering must not be empty. ` +
            `Provide at least one section type.`
        );
    }

    // Rule 2 — Duplicate Section Policy: duplicates are explicitly disallowed.
    // Props are keyed by sectionType, so two identical section types would share
    // the same props object, making the duplicate redundant and error-prone.
    const seen = new Set();
    const duplicates = [];
    for (const sectionType of sectionOrdering) {
        if (seen.has(sectionType)) {
            duplicates.push(sectionType);
        }
        seen.add(sectionType);
    }
    if (duplicates.length > 0) {
        throw new Error(
            `[CodeGenerator] AIRedesignPlan.sectionOrdering contains duplicate section types: ` +
            `[${[...new Set(duplicates)].map((s) => `"${s}"`).join(', ')}]. ` +
            `Each section type may appear at most once. ` +
            `If you need two instances of the same component, use distinct section types.`
        );
    }
}

// =============================================================================
// Rule 3 — layoutVariants Key Validation
// =============================================================================

/**
 * Validates that every key in `layoutVariants` corresponds to a section type
 * present in `sectionOrdering`. Extra keys indicate a mismatch between the AI
 * plan's variant map and its section list.
 *
 * Rule: ALL layoutVariants keys MUST appear in sectionOrdering. Unknown keys throw.
 *
 * @param {Object.<string, string>} layoutVariants - Map of sectionType → variant string.
 * @param {string[]} sectionOrdering - The validated, de-duplicated section ordering.
 * @returns {void}
 * @throws {Error} If any key in `layoutVariants` is not present in `sectionOrdering`.
 *
 * @example
 * validateLayoutVariantKeys({ hero: 'split' }, ['hero', 'footer']);  // ok
 * validateLayoutVariantKeys({ ghost: 'grid' }, ['hero', 'footer']);  // throws
 */
export function validateLayoutVariantKeys(layoutVariants, sectionOrdering) {
    if (!layoutVariants || typeof layoutVariants !== 'object' || Array.isArray(layoutVariants)) {
        // layoutVariants is optional — null/undefined is acceptable, treated as empty map
        return;
    }

    const orderingSet = new Set(sectionOrdering);
    const unknownKeys = Object.keys(layoutVariants).filter((key) => !orderingSet.has(key));

    if (unknownKeys.length > 0) {
        throw new Error(
            `[CodeGenerator] redesignPlan.layoutVariants contains keys not present in sectionOrdering: ` +
            `[${unknownKeys.map((k) => `"${k}"`).join(', ')}]. ` +
            `Remove these entries or add them to sectionOrdering. ` +
            `sectionOrdering is: [${sectionOrdering.map((s) => `"${s}"`).join(', ')}]`
        );
    }
}
