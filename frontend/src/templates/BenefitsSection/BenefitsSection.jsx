/**
 * @fileoverview BenefitsSection template component for ReForge code generation.
 *
 * Supports two layout variants:
 *  - alternating : Image and content alternate sides row by row (default).
 *                  Even-indexed items: image left / content right.
 *                  Odd-indexed items : content left / image right.
 *                  Both stack to single column on mobile.
 *  - steps       : Numbered vertical step list — no images required,
 *                  though an optional image is shown when provided.
 *
 * @module BenefitsSection
 */

import PropTypes from 'prop-types';
import { cn, resolveVariant } from '../templateUtils.js';

// ---------------------------------------------------------------------------
// Section Header (shared)
// ---------------------------------------------------------------------------

/**
 * @param {object} props
 * @param {string} [props.heading]
 * @param {string} [props.subheading]
 */
function SectionHeader({ heading, subheading }) {
    if (!heading && !subheading) return null;
    return (
        <div className="mx-auto max-w-2xl text-center mb-14">
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
// Alternating variant helpers
// ---------------------------------------------------------------------------

/**
 * Single alternating row — image and content swap sides based on index.
 *
 * @param {object} props
 * @param {string} [props.image] - URL of the benefit image.
 * @param {string} [props.imageAlt] - Alt text for the benefit image.
 * @param {string} props.title - Benefit title.
 * @param {string} [props.description] - Benefit description.
 * @param {boolean} props.imageLeft - When true, image is on the left.
 */
function AlternatingRow({ image, imageAlt, title, description, imageLeft }) {
    const imageBlock = image ? (
        <div className="flex-1 flex items-center justify-center">
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl shadow-xl ring-1 ring-white/10">
                <img
                    src={image}
                    alt={imageAlt || title}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                />
            </div>
        </div>
    ) : null;

    const textBlock = (
        <div className="flex-1 flex flex-col gap-4">
            <h3 className="text-2xl font-bold text-white leading-snug">
                {title}
            </h3>
            {description && (
                <p className="text-base text-white/60 leading-relaxed">
                    {description}
                </p>
            )}
        </div>
    );

    return (
        <div
            className={cn(
                'flex flex-col gap-10 md:flex-row md:items-center md:gap-16',
                !imageLeft && 'md:flex-row-reverse'
            )}
        >
            {imageBlock}
            {textBlock}
        </div>
    );
}

AlternatingRow.propTypes = {
    image: PropTypes.string,
    imageAlt: PropTypes.string,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    imageLeft: PropTypes.bool.isRequired,
};

// ---------------------------------------------------------------------------
// Variant renderers
// ---------------------------------------------------------------------------

/**
 * Alternating variant — rows alternate image/content layout.
 */
function AlternatingBenefits({ heading, subheading, items }) {
    return (
        <section
            className="w-full bg-dark-navy py-16 sm:py-20 lg:py-24"
            aria-labelledby="benefits-heading-alternating"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <SectionHeader heading={heading} subheading={subheading} />
                <div className="flex flex-col gap-16 lg:gap-24">
                    {items.map((item, idx) => (
                        <AlternatingRow
                            key={item.title ?? idx}
                            image={item.image}
                            imageAlt={item.imageAlt}
                            title={item.title}
                            description={item.description}
                            imageLeft={idx % 2 === 0}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

AlternatingBenefits.propTypes = {
    heading: PropTypes.string,
    subheading: PropTypes.string,
    items: PropTypes.array.isRequired,
};

/**
 * Numbered steps vertical flow variant.
 */
function StepsBenefits({ heading, subheading, items }) {
    return (
        <section
            className="w-full bg-dark-navy py-16 sm:py-20 lg:py-24"
            aria-labelledby="benefits-heading-steps"
        >
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                <SectionHeader heading={heading} subheading={subheading} />
                <ol className="relative flex flex-col gap-0" role="list">
                    {items.map((item, idx) => {
                        const isLast = idx === items.length - 1;
                        return (
                            <li key={item.title ?? idx} className="relative flex gap-6">
                                {/* Step connector line */}
                                {!isLast && (
                                    <div
                                        className="absolute left-5 top-10 bottom-0 w-px bg-white/10"
                                        aria-hidden="true"
                                    />
                                )}

                                {/* Step number badge */}
                                <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-blue font-bold text-white text-sm shadow-lg">
                                    {idx + 1}
                                </div>

                                {/* Step content */}
                                <div className={cn('flex flex-col gap-3 pb-12', isLast && 'pb-0')}>
                                    <h3 className="text-xl font-bold text-white leading-snug pt-1.5">
                                        {item.title}
                                    </h3>
                                    {item.description && (
                                        <p className="text-sm text-white/60 leading-relaxed">
                                            {item.description}
                                        </p>
                                    )}
                                    {item.image && (
                                        <div className="mt-3 overflow-hidden rounded-xl shadow-lg ring-1 ring-white/10 max-w-sm">
                                            <img
                                                src={item.image}
                                                alt={item.imageAlt || item.title}
                                                className="w-full h-auto object-cover"
                                                loading="lazy"
                                            />
                                        </div>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </div>
        </section>
    );
}

StepsBenefits.propTypes = {
    heading: PropTypes.string,
    subheading: PropTypes.string,
    items: PropTypes.array.isRequired,
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/**
 * BenefitsSection — Benefits / How It Works section template for ReForge-generated pages.
 *
 * @component
 * @param {object} props
 * @param {'alternating'|'steps'} [props.variant='alternating'] - Layout variant.
 * @param {string} [props.heading] - Section heading (h2).
 * @param {string} [props.subheading] - Supporting paragraph below heading.
 * @param {Array<{image?: string, imageAlt?: string, title: string, description?: string}>} props.items
 *   - Array of benefit/step items to display.
 *
 * @example
 * <BenefitsSection
 *   variant="alternating"
 *   heading="How It Works"
 *   subheading="Three simple steps to get started."
 *   items={[
 *     { image: 'https://example.com/step1.png', title: 'Paste your URL', description: 'We analyse your current site structure.' },
 *     { image: 'https://example.com/step2.png', title: 'Pick your goals', description: 'Tell us what you want to improve.' },
 *     { image: 'https://example.com/step3.png', title: 'Download your code', description: 'Get production-ready React components.' },
 *   ]}
 * />
 */
function BenefitsSection({ variant, heading, subheading, items }) {
    const resolvedVariant = resolveVariant('BenefitsSection', variant);

    const sharedProps = { heading, subheading, items };

    if (resolvedVariant === 'steps') {
        return <StepsBenefits {...sharedProps} />;
    }
    // Default: 'alternating'
    return <AlternatingBenefits {...sharedProps} />;
}

BenefitsSection.defaultProps = {
    variant: 'alternating',
    heading: '',
    subheading: '',
    items: [],
};

BenefitsSection.propTypes = {
    /** Layout variant. Must be one of VARIANTS.BenefitsSection. */
    variant: PropTypes.oneOf(['alternating', 'steps']),
    /** Section h2 heading text. */
    heading: PropTypes.string,
    /** Supporting paragraph below the heading. */
    subheading: PropTypes.string,
    /** Array of benefit/step items. */
    items: PropTypes.arrayOf(
        PropTypes.shape({
            /** URL of the benefit/step image. */
            image: PropTypes.string,
            /** Alt text for the image. */
            imageAlt: PropTypes.string,
            /** Item title — required within each entry. */
            title: PropTypes.string.isRequired,
            /** Supporting description text. */
            description: PropTypes.string,
        })
    ).isRequired,
};

export default BenefitsSection;
