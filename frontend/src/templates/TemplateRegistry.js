/**
 * @fileoverview TemplateRegistry — static mapping of section types to template components.
 *
 * Maps each section type string (as it would appear in an AIRedesignPlan) to a
 * metadata object describing:
 *   - `component`     : The imported template React component.
 *   - `variants`      : The variants array from the VARIANTS registry (source of truth).
 *   - `requiredProps` : Array of prop key strings that the component requires (non-optional).
 *
 * Usage by Phase 8 CodeGenerator:
 * ```js
 * import { TEMPLATE_REGISTRY } from './TemplateRegistry.js';
 * const { component: Comp, variants, requiredProps } = TEMPLATE_REGISTRY['hero'];
 * if (!variants.includes(chosenVariant)) throw new Error('Invalid variant');
 * ```
 *
 * Rules enforced:
 *  - Static and deterministic — no runtime logic, no conditionals.
 *  - No imports from backend modules.
 *  - No Phase 8 generation code.
 *  - Uses VARIANTS as the canonical source for all variant arrays.
 *
 * @module TemplateRegistry
 */

import { VARIANTS } from './templateUtils.js';

import NavHeader from './NavHeader/NavHeader.jsx';
import HeroSection from './HeroSection/HeroSection.jsx';
import FeaturesSection from './FeaturesSection/FeaturesSection.jsx';
import CourseShowcase from './CourseShowcase/CourseShowcase.jsx';
import BenefitsSection from './BenefitsSection/BenefitsSection.jsx';
import TestimonialsSection from './TestimonialsSection/TestimonialsSection.jsx';
import PricingSection from './PricingSection/PricingSection.jsx';
import FAQSection from './FAQSection/FAQSection.jsx';
import FinalCTA from './FinalCTA/FinalCTA.jsx';
import Footer from './Footer/Footer.jsx';

/**
 * @typedef {object} TemplateMetadata
 * @property {React.ComponentType} component    - The template React component.
 * @property {string[]}            variants     - Valid variant strings (from VARIANTS registry).
 * @property {string[]}            requiredProps - Required prop keys for this component.
 */

/**
 * TEMPLATE_REGISTRY — Static map from section-type key → TemplateMetadata.
 *
 * Section-type keys match the identifiers used in `AIRedesignPlan.sections[].type`.
 *
 * @type {Object.<string, TemplateMetadata>}
 */
export const TEMPLATE_REGISTRY = {
    /** 7.2 — Navigation header */
    nav: {
        component: NavHeader,
        variants: VARIANTS.NavHeader,
        requiredProps: ['logoText', 'navLinks'],
    },

    /** 7.3 — Hero section */
    hero: {
        component: HeroSection,
        variants: VARIANTS.HeroSection,
        requiredProps: ['headline'],
    },

    /** 7.4 — Features section */
    features: {
        component: FeaturesSection,
        variants: VARIANTS.FeaturesSection,
        requiredProps: ['heading', 'features'],
    },

    /** 7.5 — Course showcase */
    courses: {
        component: CourseShowcase,
        variants: VARIANTS.CourseShowcase,
        requiredProps: ['heading', 'courses'],
    },

    /** 7.6 — Benefits / How It Works */
    benefits: {
        component: BenefitsSection,
        variants: VARIANTS.BenefitsSection,
        requiredProps: ['heading', 'items'],
    },

    /** 7.7 — Testimonials section */
    testimonials: {
        component: TestimonialsSection,
        variants: VARIANTS.TestimonialsSection,
        requiredProps: ['heading', 'testimonials'],
    },

    /** 7.8 — Pricing section */
    pricing: {
        component: PricingSection,
        variants: VARIANTS.PricingSection,
        requiredProps: ['heading', 'plans'],
    },

    /** 7.9 — FAQ section */
    faq: {
        component: FAQSection,
        variants: VARIANTS.FAQSection,
        requiredProps: ['faqs'],
    },

    /** 7.10 — Final CTA section */
    cta: {
        component: FinalCTA,
        variants: VARIANTS.FinalCTA,
        requiredProps: ['headline'],
    },

    /** 7.11 — Footer */
    footer: {
        component: Footer,
        variants: VARIANTS.Footer,
        requiredProps: ['logoText', 'linkGroups'],
    },
};

export default TEMPLATE_REGISTRY;
