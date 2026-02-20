/**
 * @fileoverview TestimonialsSection template component for ReForge code generation.
 *
 * Supports two layout variants:
 *  - grid     : Responsive CSS grid of TestimonialCards (default).
 *               Adapts from 1 → 2 → 3 columns based on viewport.
 *  - carousel : Manual previous/next carousel. No auto-rotation. No swipe libraries.
 *               One testimonial visible at a time, navigated via prev/next buttons.
 *
 * All visible text comes from props. No hardcoded strings. No animations libraries.
 *
 * @module TestimonialsSection
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { cn, resolveVariant } from '../templateUtils.js';
import TestimonialCard from './TestimonialCard.jsx';

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
// Grid variant
// ---------------------------------------------------------------------------

/**
 * Responsive CSS grid of testimonial cards.
 *
 * @param {object} props
 * @param {string} [props.heading]
 * @param {string} [props.subheading]
 * @param {object[]} props.testimonials
 */
function GridTestimonials({ heading, subheading, testimonials }) {
    return (
        <section
            className="w-full bg-dark-navy py-16 sm:py-20 lg:py-24"
            aria-labelledby="testimonials-heading-grid"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <SectionHeader heading={heading} subheading={subheading} />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {testimonials.map((t, idx) => (
                        <TestimonialCard
                            key={t.name ?? idx}
                            quote={t.quote}
                            name={t.name}
                            role={t.role}
                            avatar={t.avatar}
                            avatarAlt={t.avatarAlt}
                            rating={t.rating}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

GridTestimonials.propTypes = {
    heading: PropTypes.string,
    subheading: PropTypes.string,
    testimonials: PropTypes.array.isRequired,
};

// ---------------------------------------------------------------------------
// Carousel variant
// ---------------------------------------------------------------------------

/**
 * Manual prev/next carousel — one testimonial at a time.
 * No auto-rotation, no timers, no swipe libraries.
 *
 * @param {object} props
 * @param {string} [props.heading]
 * @param {string} [props.subheading]
 * @param {object[]} props.testimonials
 * @param {string} [props.prevLabel] - Accessible label for the previous button.
 * @param {string} [props.nextLabel] - Accessible label for the next button.
 */
function CarouselTestimonials({ heading, subheading, testimonials, prevLabel, nextLabel }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const count = testimonials.length;

    if (count === 0) return null;

    function handlePrev() {
        setActiveIndex((prev) => (prev === 0 ? count - 1 : prev - 1));
    }

    function handleNext() {
        setActiveIndex((prev) => (prev === count - 1 ? 0 : prev + 1));
    }

    const current = testimonials[activeIndex];

    return (
        <section
            className="w-full bg-dark-navy py-16 sm:py-20 lg:py-24"
            aria-labelledby="testimonials-heading-carousel"
            aria-roledescription="carousel"
        >
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                <SectionHeader heading={heading} subheading={subheading} />

                {/* Slide */}
                <div
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`Testimonial ${activeIndex + 1} of ${count}`}
                >
                    <TestimonialCard
                        quote={current.quote}
                        name={current.name}
                        role={current.role}
                        avatar={current.avatar}
                        avatarAlt={current.avatarAlt}
                        rating={current.rating}
                    />
                </div>

                {/* Controls */}
                <div className="mt-8 flex items-center justify-center gap-6">
                    <button
                        type="button"
                        onClick={handlePrev}
                        aria-label={prevLabel || 'Previous testimonial'}
                        className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-full',
                            'bg-white/10 text-white ring-1 ring-white/20',
                            'hover:bg-white/20 hover:ring-white/40',
                            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-blue',
                            'transition-colors duration-150 disabled:opacity-40'
                        )}
                        disabled={count <= 1}
                    >
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path
                                fillRule="evenodd"
                                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>

                    {/* Dot indicators */}
                    <div className="flex items-center gap-2" aria-hidden="true">
                        {testimonials.map((_, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => setActiveIndex(idx)}
                                className={cn(
                                    'h-2 rounded-full transition-all duration-150',
                                    idx === activeIndex
                                        ? 'w-6 bg-primary-blue'
                                        : 'w-2 bg-white/30 hover:bg-white/50'
                                )}
                                tabIndex={-1}
                            />
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={handleNext}
                        aria-label={nextLabel || 'Next testimonial'}
                        className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-full',
                            'bg-white/10 text-white ring-1 ring-white/20',
                            'hover:bg-white/20 hover:ring-white/40',
                            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-blue',
                            'transition-colors duration-150 disabled:opacity-40'
                        )}
                        disabled={count <= 1}
                    >
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path
                                fillRule="evenodd"
                                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                </div>

                {/* Screen-reader position announcement */}
                <p className="sr-only" aria-live="polite" aria-atomic="true">
                    {`Showing testimonial ${activeIndex + 1} of ${count}`}
                </p>
            </div>
        </section>
    );
}

CarouselTestimonials.defaultProps = {
    heading: '',
    subheading: '',
    prevLabel: 'Previous testimonial',
    nextLabel: 'Next testimonial',
};

CarouselTestimonials.propTypes = {
    heading: PropTypes.string,
    subheading: PropTypes.string,
    testimonials: PropTypes.array.isRequired,
    prevLabel: PropTypes.string,
    nextLabel: PropTypes.string,
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/**
 * TestimonialsSection — Social proof section template for ReForge-generated pages.
 *
 * @component
 * @param {object}   props
 * @param {'grid'|'carousel'} [props.variant='grid']  - Layout variant.
 * @param {string}   [props.heading]     - Section h2 heading.
 * @param {string}   [props.subheading]  - Supporting paragraph below heading.
 * @param {Array<{
 *   quote: string,
 *   name: string,
 *   role?: string,
 *   avatar?: string,
 *   avatarAlt?: string,
 *   rating?: number
 * }>} props.testimonials - Array of testimonial objects.
 * @param {string}   [props.prevLabel]   - Carousel: accessible label for the prev button.
 * @param {string}   [props.nextLabel]   - Carousel: accessible label for the next button.
 *
 * @example
 * <TestimonialsSection
 *   variant="carousel"
 *   heading="What Our Students Say"
 *   testimonials={[
 *     { quote: 'ReForge changed everything.', name: 'Alice', role: 'Developer', avatar: '…', rating: 5 },
 *     { quote: 'Best tool we have used.', name: 'Bob', role: 'Designer', avatar: '…', rating: 4 },
 *   ]}
 * />
 */
function TestimonialsSection({ variant, heading, subheading, testimonials, prevLabel, nextLabel }) {
    const resolvedVariant = resolveVariant('TestimonialsSection', variant);

    const sharedProps = { heading, subheading, testimonials };

    if (resolvedVariant === 'carousel') {
        return <CarouselTestimonials {...sharedProps} prevLabel={prevLabel} nextLabel={nextLabel} />;
    }
    // Default: 'grid'
    return <GridTestimonials {...sharedProps} />;
}

TestimonialsSection.defaultProps = {
    variant: 'grid',
    heading: '',
    subheading: '',
    testimonials: [],
    prevLabel: 'Previous testimonial',
    nextLabel: 'Next testimonial',
};

TestimonialsSection.propTypes = {
    /** Layout variant. Must be one of VARIANTS.TestimonialsSection. */
    variant: PropTypes.oneOf(['grid', 'carousel']),
    /** Section h2 heading text. */
    heading: PropTypes.string,
    /** Supporting paragraph below the heading. */
    subheading: PropTypes.string,
    /** Array of testimonial objects. */
    testimonials: PropTypes.arrayOf(
        PropTypes.shape({
            /** The testimonial quote — required per item. */
            quote: PropTypes.string.isRequired,
            /** Author full name — required per item. */
            name: PropTypes.string.isRequired,
            /** Author role or title. */
            role: PropTypes.string,
            /** URL of the author's avatar image. */
            avatar: PropTypes.string,
            /** Explicit alt text for the avatar image. */
            avatarAlt: PropTypes.string,
            /** Star rating 1–5. */
            rating: PropTypes.number,
        })
    ),
    /** Carousel only: accessible label for the previous button. */
    prevLabel: PropTypes.string,
    /** Carousel only: accessible label for the next button. */
    nextLabel: PropTypes.string,
};

export default TestimonialsSection;
