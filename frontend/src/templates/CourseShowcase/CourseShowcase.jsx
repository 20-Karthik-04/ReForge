/**
 * @fileoverview CourseShowcase template component for ReForge code generation.
 *
 * Supports two layout variants:
 *  - scroll : Horizontal scrollable row of CourseCards (default).
 *             Renders a single-row track that overflows horizontally on mobile
 *             and reveals cards via scroll; no JS carousel library required.
 *  - grid   : Responsive multi-column grid of CourseCards.
 *
 * @module CourseShowcase
 */

import PropTypes from 'prop-types';
import { resolveVariant } from '../templateUtils.js';
import CourseCard from './CourseCard.jsx';

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
        <div className="mx-auto max-w-2xl mb-10">
            {heading && (
                <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                    {heading}
                </h2>
            )}
            {subheading && (
                <p className="mt-3 text-base text-white/60 leading-relaxed">
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
 * Horizontal scroll variant — a snap-scrollable card track.
 */
function ScrollShowcase({ heading, subheading, courses }) {
    return (
        <section
            className="w-full bg-dark-navy py-16 sm:py-20 lg:py-24 overflow-hidden"
            aria-labelledby="courses-heading-scroll"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <SectionHeader heading={heading} subheading={subheading} />
            </div>

            {/* Scrollable track — negative side margins + matching padding lets cards
                bleed to the viewport edge while the heading stays aligned to max-w-7xl */}
            <div
                className="flex gap-5 overflow-x-auto pb-4 px-4 sm:px-6 lg:px-8 snap-x snap-mandatory"
                role="list"
                aria-label="Course list"
                /* scrollbar-hide via utility below; falls back gracefully without it */
                style={{ scrollbarWidth: 'none' }}
            >
                {courses.map((course, idx) => (
                    <div
                        key={course.title ?? idx}
                        role="listitem"
                        className="shrink-0 w-72 sm:w-80 snap-start"
                    >
                        <CourseCard
                            thumbnail={course.thumbnail}
                            title={course.title}
                            instructor={course.instructor}
                            rating={course.rating}
                            price={course.price}
                        />
                    </div>
                ))}
            </div>
        </section>
    );
}

ScrollShowcase.propTypes = {
    heading: PropTypes.string,
    subheading: PropTypes.string,
    courses: PropTypes.array.isRequired,
};

/**
 * Grid variant — responsive multi-column grid.
 */
function GridShowcase({ heading, subheading, courses }) {
    return (
        <section
            className="w-full bg-dark-navy py-16 sm:py-20 lg:py-24"
            aria-labelledby="courses-heading-grid"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <SectionHeader heading={heading} subheading={subheading} />
                <ul
                    role="list"
                    className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                >
                    {courses.map((course, idx) => (
                        <li key={course.title ?? idx}>
                            <CourseCard
                                thumbnail={course.thumbnail}
                                title={course.title}
                                instructor={course.instructor}
                                rating={course.rating}
                                price={course.price}
                            />
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}

GridShowcase.propTypes = {
    heading: PropTypes.string,
    subheading: PropTypes.string,
    courses: PropTypes.array.isRequired,
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/**
 * CourseShowcase — Course listing section template for ReForge-generated pages.
 *
 * @component
 * @param {object} props
 * @param {'scroll'|'grid'} [props.variant='scroll'] - Layout variant.
 * @param {string} [props.heading] - Section heading (h2).
 * @param {string} [props.subheading] - Supporting paragraph below heading.
 * @param {Array<{thumbnail?: string, title: string, instructor?: string, rating?: number, price?: string}>} props.courses
 *   - Array of course items to display.
 *
 * @example
 * <CourseShowcase
 *   variant="scroll"
 *   heading="Top Courses"
 *   subheading="Learn from the best instructors."
 *   courses={[
 *     { thumbnail: 'https://example.com/t1.jpg', title: 'React 101', instructor: 'Jane Doe', rating: 4.8, price: '$29.99' },
 *     { thumbnail: 'https://example.com/t2.jpg', title: 'Node.js Pro', instructor: 'John Smith', rating: 4.5, price: 'Free' },
 *   ]}
 * />
 */
function CourseShowcase({ variant, heading, subheading, courses }) {
    const resolvedVariant = resolveVariant('CourseShowcase', variant);

    const sharedProps = { heading, subheading, courses };

    if (resolvedVariant === 'grid') {
        return <GridShowcase {...sharedProps} />;
    }
    // Default: 'scroll'
    return <ScrollShowcase {...sharedProps} />;
}

CourseShowcase.defaultProps = {
    variant: 'scroll',
    heading: '',
    subheading: '',
    courses: [],
};

CourseShowcase.propTypes = {
    /** Layout variant. Must be one of VARIANTS.CourseShowcase. */
    variant: PropTypes.oneOf(['scroll', 'grid']),
    /** Section h2 heading text. */
    heading: PropTypes.string,
    /** Supporting paragraph below the heading. */
    subheading: PropTypes.string,
    /** Array of course items. */
    courses: PropTypes.arrayOf(
        PropTypes.shape({
            /** URL of the course thumbnail image. */
            thumbnail: PropTypes.string,
            /** Course title — required within each item. */
            title: PropTypes.string.isRequired,
            /** Instructor display name. */
            instructor: PropTypes.string,
            /** Numeric rating 0–5. */
            rating: PropTypes.number,
            /** Display price string (e.g. '$49.99' or 'Free'). */
            price: PropTypes.string,
        })
    ).isRequired,
};

export default CourseShowcase;
