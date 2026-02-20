/**
 * @fileoverview ReForge Template Library entry point.
 *
 * Re-exports all template components and shared utilities.
 * Phase 8's CodeGenerator imports from this index to assemble pages.
 *
 * @module templates
 *
 * @example
 * import { NavHeader, HeroSection, VARIANTS } from '../templates/index.js';
 *
 * // Validate variant before generating component code
 * if (!VARIANTS.NavHeader.includes(chosenVariant)) throw new Error('...');
 */

// Utilities & variant registry
export { VARIANTS, resolveVariant, getDefaultVariant, cn } from './templateUtils.js';

// Phase 7.2 — Navigation Header
export { default as NavHeader } from './NavHeader/NavHeader.jsx';

// Phase 7.3 — Hero Section
export { default as HeroSection } from './HeroSection/HeroSection.jsx';

// Phase 7.4 — Features Section
export { default as FeaturesSection } from './FeaturesSection/FeaturesSection.jsx';
export { default as FeatureCard } from './FeaturesSection/FeatureCard.jsx';

// Phase 7.5 — Course Showcase
export { default as CourseShowcase } from './CourseShowcase/CourseShowcase.jsx';
export { default as CourseCard } from './CourseShowcase/CourseCard.jsx';

// Phase 7.6 — Benefits Section
export { default as BenefitsSection } from './BenefitsSection/BenefitsSection.jsx';

// Phase 7.7 — Testimonials Section
export { default as TestimonialsSection } from './TestimonialsSection/TestimonialsSection.jsx';
export { default as TestimonialCard } from './TestimonialsSection/TestimonialCard.jsx';

// Phase 7.8 — Pricing Section
export { default as PricingSection } from './PricingSection/PricingSection.jsx';
export { default as PricingCard } from './PricingSection/PricingCard.jsx';

// Phase 7.9 — FAQ Section
export { default as FAQSection } from './FAQSection/FAQSection.jsx';

// Phase 7.10 — Final CTA Section
export { default as FinalCTA } from './FinalCTA/FinalCTA.jsx';

// Phase 7.11 — Footer
export { default as Footer } from './Footer/Footer.jsx';

// Phase 7.12 — Template Registry
export { TEMPLATE_REGISTRY, default as TemplateRegistry } from './TemplateRegistry.js';
