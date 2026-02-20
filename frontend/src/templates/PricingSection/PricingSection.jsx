/**
 * @fileoverview PricingSection template component for ReForge code generation.
 *
 * Supports two layout variants:
 *  - three-tier : Three-column pricing grid (default). On mobile stacks to 1 column.
 *  - two-tier   : Two-column pricing grid, centred on larger screens.
 *
 * The `highlighted` flag on individual plan objects (not automatic middle-card logic)
 * controls which tier receives the featured/recommended visual treatment.
 *
 * No annual/monthly toggle unless defined in TODO.md.
 *
 * @module PricingSection
 */

import PropTypes from 'prop-types';
import { cn, resolveVariant } from '../templateUtils.js';
import PricingCard from './PricingCard.jsx';

// ---------------------------------------------------------------------------
// Shared section header
// ---------------------------------------------------------------------------

/**
 * @param {object} props
 * @param {string} [props.heading]
 * @param {string} [props.subheading]
 */
function SectionHeader({ heading, subheading }) {
    if (!heading && !subheading) return null;
    return (
        <div className="mx-auto max-w-2xl text-center mb-12">
            {heading && (
                <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                    {heading}
                </h2>
            )}
            {subheading && (
                <p className="mt-4 text-base text-white/60 leading-relaxed">
                    {subheading}
                </p>
            )}
        </div>
    );
}

SectionHeader.propTypes = {
    heading: PropTypes.string,
    subheading: PropTypes.string,
};

// ---------------------------------------------------------------------------
// Three-tier variant
// ---------------------------------------------------------------------------

/**
 * Three-column pricing grid — 1 col on mobile, 3 cols on lg+.
 *
 * @param {object} props
 * @param {string} [props.heading]
 * @param {string} [props.subheading]
 * @param {object[]} props.plans
 */
function ThreeTierPricing({ heading, subheading, plans }) {
    return (
        <section
            className="w-full bg-dark-navy py-16 sm:py-20 lg:py-24"
            aria-labelledby="pricing-heading-three"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <SectionHeader heading={heading} subheading={subheading} />
                <div
                    className={cn(
                        'grid gap-8 items-stretch',
                        'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                    )}
                >
                    {plans.map((plan, idx) => (
                        <PricingCard
                            key={plan.name ?? idx}
                            name={plan.name}
                            price={plan.price}
                            description={plan.description}
                            features={plan.features}
                            ctaLabel={plan.ctaLabel}
                            ctaHref={plan.ctaHref}
                            highlighted={!!plan.highlighted}
                            badge={plan.badge}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

ThreeTierPricing.propTypes = {
    heading: PropTypes.string,
    subheading: PropTypes.string,
    plans: PropTypes.array.isRequired,
};

// ---------------------------------------------------------------------------
// Two-tier variant
// ---------------------------------------------------------------------------

/**
 * Two-column pricing grid — centred max-width container.
 *
 * @param {object} props
 * @param {string} [props.heading]
 * @param {string} [props.subheading]
 * @param {object[]} props.plans
 */
function TwoTierPricing({ heading, subheading, plans }) {
    return (
        <section
            className="w-full bg-dark-navy py-16 sm:py-20 lg:py-24"
            aria-labelledby="pricing-heading-two"
        >
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                <SectionHeader heading={heading} subheading={subheading} />
                <div className="grid gap-8 items-stretch grid-cols-1 sm:grid-cols-2">
                    {plans.map((plan, idx) => (
                        <PricingCard
                            key={plan.name ?? idx}
                            name={plan.name}
                            price={plan.price}
                            description={plan.description}
                            features={plan.features}
                            ctaLabel={plan.ctaLabel}
                            ctaHref={plan.ctaHref}
                            highlighted={!!plan.highlighted}
                            badge={plan.badge}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

TwoTierPricing.propTypes = {
    heading: PropTypes.string,
    subheading: PropTypes.string,
    plans: PropTypes.array.isRequired,
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/**
 * PricingSection — Pricing tier section template for ReForge-generated pages.
 *
 * @component
 * @param {object} props
 * @param {'three-tier'|'two-tier'} [props.variant='three-tier'] - Layout variant.
 * @param {string} [props.heading]    - Section h2 heading.
 * @param {string} [props.subheading] - Supporting paragraph below heading.
 * @param {Array<{
 *   name: string,
 *   price: string,
 *   description?: string,
 *   features?: string[],
 *   ctaLabel: string,
 *   ctaHref?: string,
 *   highlighted?: boolean,
 *   badge?: string
 * }>} props.plans - Array of pricing plan objects.
 *
 * @example
 * <PricingSection
 *   variant="three-tier"
 *   heading="Simple, transparent pricing"
 *   plans={[
 *     { name: 'Starter', price: 'Free', features: ['5 projects'], ctaLabel: 'Start free' },
 *     { name: 'Pro', price: '$49/mo', features: ['Unlimited projects'], ctaLabel: 'Get Pro', highlighted: true, badge: 'Most Popular' },
 *     { name: 'Enterprise', price: '$199/mo', features: ['Custom SLA'], ctaLabel: 'Contact sales' },
 *   ]}
 * />
 */
function PricingSection({ variant, heading, subheading, plans }) {
    const resolvedVariant = resolveVariant('PricingSection', variant);

    const sharedProps = { heading, subheading, plans };

    if (resolvedVariant === 'two-tier') {
        return <TwoTierPricing {...sharedProps} />;
    }
    // Default: 'three-tier'
    return <ThreeTierPricing {...sharedProps} />;
}

PricingSection.defaultProps = {
    variant: 'three-tier',
    heading: '',
    subheading: '',
    plans: [],
};

PricingSection.propTypes = {
    /** Layout variant. Must be one of VARIANTS.PricingSection. */
    variant: PropTypes.oneOf(['three-tier', 'two-tier']),
    /** Section h2 heading text. */
    heading: PropTypes.string,
    /** Supporting paragraph below the heading. */
    subheading: PropTypes.string,
    /** Array of pricing plan objects. */
    plans: PropTypes.arrayOf(
        PropTypes.shape({
            /** Plan display name — required per item. */
            name: PropTypes.string.isRequired,
            /** Price string (e.g. "$49/mo") — required per item. */
            price: PropTypes.string.isRequired,
            /** Short tagline. */
            description: PropTypes.string,
            /** List of feature strings. */
            features: PropTypes.arrayOf(PropTypes.string),
            /** CTA button label — required per item. */
            ctaLabel: PropTypes.string.isRequired,
            /** Href for the CTA anchor element. */
            ctaHref: PropTypes.string,
            /** When true, the card receives highlighted/featured treatment. */
            highlighted: PropTypes.bool,
            /** Badge text for highlighted cards (e.g. "Most Popular"). */
            badge: PropTypes.string,
        })
    ),
};

export default PricingSection;
