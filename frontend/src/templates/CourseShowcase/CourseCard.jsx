/**
 * @fileoverview CourseCard sub-component for the CourseShowcase template.
 *
 * Renders a single course card with thumbnail, title, instructor,
 * star rating, and price. Used internally by CourseShowcase.
 *
 * @module CourseCard
 */

import PropTypes from 'prop-types';

// ---------------------------------------------------------------------------
// Star Rating helper
// ---------------------------------------------------------------------------

/**
 * Renders up to 5 filled/half/empty star icons for a numeric rating.
 *
 * @param {object} props
 * @param {number} props.rating - Numeric rating 0–5 (decimals supported).
 */
function StarRating({ rating }) {
    const clamped = Math.min(5, Math.max(0, rating));
    const full = Math.floor(clamped);
    const hasHalf = clamped - full >= 0.5;
    const empty = 5 - full - (hasHalf ? 1 : 0);

    const starClass = 'h-4 w-4';

    return (
        <div
            className="flex items-center gap-0.5"
            aria-label={`Rating: ${clamped} out of 5 stars`}
            role="img"
        >
            {Array.from({ length: full }).map((_, i) => (
                <svg key={`full-${i}`} className={`${starClass} text-yellow-400`} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
            {hasHalf && (
                <svg key="half" className={`${starClass} text-yellow-400`} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <defs>
                        <linearGradient id="half-grad">
                            <stop offset="50%" stopColor="currentColor" />
                            <stop offset="50%" stopColor="transparent" />
                        </linearGradient>
                    </defs>
                    <path fill="url(#half-grad)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            )}
            {Array.from({ length: empty }).map((_, i) => (
                <svg key={`empty-${i}`} className={`${starClass} text-white/20`} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
            <span className="ml-1 text-xs text-white/50">{clamped.toFixed(1)}</span>
        </div>
    );
}

StarRating.propTypes = {
    rating: PropTypes.number.isRequired,
};

// ---------------------------------------------------------------------------
// CourseCard
// ---------------------------------------------------------------------------

/**
 * CourseCard — Displays a single course with thumbnail, meta, and price.
 *
 * @component
 * @param {object} props
 * @param {string} [props.thumbnail] - URL of the course thumbnail image.
 * @param {string} props.title - Course title (required).
 * @param {string} [props.instructor] - Instructor name.
 * @param {number} [props.rating] - Numeric rating 0–5.
 * @param {string} [props.price] - Display price string (e.g. '$49.99' or 'Free').
 *
 * @example
 * <CourseCard
 *   thumbnail="https://example.com/course.jpg"
 *   title="React for Beginners"
 *   instructor="Jane Doe"
 *   rating={4.7}
 *   price="$49.99"
 * />
 */
function CourseCard({ thumbnail, title, instructor, rating, price }) {
    return (
        <article className="group flex flex-col overflow-hidden rounded-2xl bg-dark-navy-light/60 ring-1 ring-white/10 transition-colors duration-200 hover:bg-dark-navy-light hover:ring-white/20">
            {/* Thumbnail */}
            <div className="relative aspect-video w-full overflow-hidden bg-dark-navy">
                {thumbnail ? (
                    <img
                        src={thumbnail}
                        alt={`${title} thumbnail`}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <svg
                            className="h-12 w-12 text-white/20"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14m0-4v4m0-4l-6 2.25v-4.5L15 10z"
                            />
                        </svg>
                    </div>
                )}
            </div>

            {/* Card body */}
            <div className="flex flex-1 flex-col gap-3 p-5">
                <h3 className="text-base font-semibold leading-snug text-white line-clamp-2">
                    {title}
                </h3>

                {instructor && (
                    <p className="text-xs text-white/50">{instructor}</p>
                )}

                {rating != null && <StarRating rating={rating} />}

                {price && (
                    <p className="mt-auto text-sm font-bold text-primary-blue">
                        {price}
                    </p>
                )}
            </div>
        </article>
    );
}

CourseCard.defaultProps = {
    thumbnail: '',
    instructor: '',
    rating: null,
    price: '',
};

CourseCard.propTypes = {
    /** URL of the course thumbnail image. */
    thumbnail: PropTypes.string,
    /** Course title — required. */
    title: PropTypes.string.isRequired,
    /** Instructor name. */
    instructor: PropTypes.string,
    /** Numeric rating 0–5. */
    rating: PropTypes.number,
    /** Display price string (e.g. '$49.99' or 'Free'). */
    price: PropTypes.string,
};

export default CourseCard;
