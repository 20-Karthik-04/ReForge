/**
 * @fileoverview FeaturesSection template component for ReForge code generation.
 *
 * Supports three layout variants:
 *  - grid3  : Three-column card grid (default). Falls to 2-col at md, 1-col at sm.
 *  - grid2  : Two-column card grid. Falls to 1-col on mobile.
 *  - list   : Single-column list with icon left of title/description.
 *
 * @module FeaturesSection
 */

import PropTypes from 'prop-types';
import { resolveVariant } from '../templateUtils.js';
import FeatureCard from './FeatureCard.jsx';

// ---------------------------------------------------------------------------
// Section Header
// ---------------------------------------------------------------------------

/**
 * Renders the optional section heading and subheading.
 *
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
// Variant renderers
// ---------------------------------------------------------------------------

/**
 * Three-column grid variant (default).
 */
function Grid3Features({ heading, subheading, features }) {
    return (
        <section
            className="w-full bg-dark-navy py-16 sm:py-20 lg:py-24"
            aria-labelledby="features-heading-grid3"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <SectionHeader heading={heading} subheading={subheading} />
                <ul
                    role="list"
                    className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                >
                    {features.map((feature, idx) => (
                        <li key={feature.title ?? idx}>
                            <FeatureCard
                                icon={feature.icon}
                                title={feature.title}
                                description={feature.description}
                                layout="grid"
                            />
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}

Grid3Features.propTypes = {
    heading: PropTypes.string,
    subheading: PropTypes.string,
    features: PropTypes.array.isRequired,
};

/**
 * Two-column grid variant.
 */
function Grid2Features({ heading, subheading, features }) {
    return (
        <section
            className="w-full bg-dark-navy py-16 sm:py-20 lg:py-24"
            aria-labelledby="features-heading-grid2"
        >
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                <SectionHeader heading={heading} subheading={subheading} />
                <ul
                    role="list"
                    className="grid gap-6 sm:grid-cols-2"
                >
                    {features.map((feature, idx) => (
                        <li key={feature.title ?? idx}>
                            <FeatureCard
                                icon={feature.icon}
                                title={feature.title}
                                description={feature.description}
                                layout="grid"
                            />
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}

Grid2Features.propTypes = {
    heading: PropTypes.string,
    subheading: PropTypes.string,
    features: PropTypes.array.isRequired,
};

/**
 * List layout variant — single column, icon on the left.
 */
function ListFeatures({ heading, subheading, features }) {
    return (
        <section
            className="w-full bg-dark-navy py-16 sm:py-20 lg:py-24"
            aria-labelledby="features-heading-list"
        >
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                <SectionHeader heading={heading} subheading={subheading} />
                <ul role="list" className="flex flex-col gap-4">
                    {features.map((feature, idx) => (
                        <li key={feature.title ?? idx}>
                            <FeatureCard
                                icon={feature.icon}
                                title={feature.title}
                                description={feature.description}
                                layout="list"
                            />
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}

ListFeatures.propTypes = {
    heading: PropTypes.string,
    subheading: PropTypes.string,
    features: PropTypes.array.isRequired,
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/**
 * FeaturesSection — Features section template for ReForge-generated pages.
 *
 * @component
 * @param {object} props
 * @param {'grid3'|'grid2'|'list'} [props.variant='grid3'] - Layout variant.
 * @param {string} [props.heading] - Section heading (h2).
 * @param {string} [props.subheading] - Supporting paragraph below heading.
 * @param {Array<{icon?: string, title: string, description?: string}>} props.features
 *   - Array of feature items to display.
 *
 * @example
 * <FeaturesSection
 *   variant="grid3"
 *   heading="Everything you need"
 *   subheading="Built for speed and reliability."
 *   features={[
 *     { icon: 'https://example.com/icon1.svg', title: 'Fast', description: 'Generates in seconds.' },
 *     { icon: 'https://example.com/icon2.svg', title: 'Reliable', description: 'Always consistent output.' },
 *   ]}
 * />
 */
function FeaturesSection({ variant, heading, subheading, features }) {
    const resolvedVariant = resolveVariant('FeaturesSection', variant);

    const sharedProps = { heading, subheading, features };

    if (resolvedVariant === 'grid2') {
        return <Grid2Features {...sharedProps} />;
    }
    if (resolvedVariant === 'list') {
        return <ListFeatures {...sharedProps} />;
    }
    // Default: 'grid3'
    return <Grid3Features {...sharedProps} />;
}

FeaturesSection.defaultProps = {
    variant: 'grid3',
    heading: '',
    subheading: '',
    features: [],
};

FeaturesSection.propTypes = {
    /** Layout variant. Must be one of VARIANTS.FeaturesSection. */
    variant: PropTypes.oneOf(['grid3', 'grid2', 'list']),
    /** Section h2 heading text. */
    heading: PropTypes.string,
    /** Supporting paragraph below the heading. */
    subheading: PropTypes.string,
    /** Array of feature items. */
    features: PropTypes.arrayOf(
        PropTypes.shape({
            /** URL of the feature icon/image. */
            icon: PropTypes.string,
            /** Feature title — required within each item. */
            title: PropTypes.string.isRequired,
            /** Short feature description. */
            description: PropTypes.string,
        })
    ).isRequired,
};

export default FeaturesSection;
