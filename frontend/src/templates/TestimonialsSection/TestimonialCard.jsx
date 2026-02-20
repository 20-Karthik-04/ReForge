/**
 * @fileoverview TestimonialCard sub-component for the TestimonialsSection template.
 *
 * Renders a single testimonial with an avatar, author name, role, star rating,
 * and quote text. Used internally by TestimonialsSection.
 *
 * @module TestimonialCard
 */

import PropTypes from 'prop-types';
import { cn } from '../templateUtils.js';

// ---------------------------------------------------------------------------
// Star rating helper
// ---------------------------------------------------------------------------

/**
 * Renders a row of star icons for a given rating (1–5).
 *
 * @param {object} props
 * @param {number} props.rating - Integer rating between 1 and 5 inclusive.
 * @param {string} [props.label] - Accessible label (e.g. "4 out of 5 stars").
 */
function StarRating({ rating, label }) {
    const clamped = Math.min(5, Math.max(0, Math.round(rating)));
    return (
        <div
            className="flex items-center gap-0.5"
            role="img"
            aria-label={label || `${clamped} out of 5 stars`}
        >
            {Array.from({ length: 5 }, (_, i) => (
                <svg
                    key={i}
                    className={cn(
                        'h-4 w-4',
                        i < clamped ? 'text-yellow-400' : 'text-white/20'
                    )}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
}

StarRating.defaultProps = {
    label: '',
};

StarRating.propTypes = {
    /** Integer rating 1–5. */
    rating: PropTypes.number.isRequired,
    /** Accessible label string for the rating. */
    label: PropTypes.string,
};

// ---------------------------------------------------------------------------
// TestimonialCard
// ---------------------------------------------------------------------------

/**
 * TestimonialCard — Displays a single testimonial entry.
 *
 * @component
 * @param {object} props
 * @param {string} props.quote - The testimonial quote text (required).
 * @param {string} props.name - Author full name (required).
 * @param {string} [props.role] - Author's role/title (e.g. "CEO at Acme").
 * @param {string} [props.avatar] - URL of the author's avatar image.
 * @param {string} [props.avatarAlt] - Explicit alt text for the avatar image.
 * @param {number} [props.rating] - Star rating 1–5. Omit to hide stars.
 *
 * @example
 * <TestimonialCard
 *   quote="ReForge cut our launch time in half."
 *   name="Jane Doe"
 *   role="CTO at Startup"
 *   avatar="https://example.com/jane.jpg"
 *   rating={5}
 * />
 */
function TestimonialCard({ quote, name, role, avatar, avatarAlt, rating }) {
    return (
        <article className="flex flex-col gap-5 rounded-2xl bg-dark-navy-light/60 ring-1 ring-white/10 p-6 hover:ring-white/20 transition-colors duration-200">
            {/* Star rating */}
            {typeof rating === 'number' && rating > 0 && (
                <StarRating rating={rating} label={`${name} rated ${rating} out of 5 stars`} />
            )}

            {/* Quote */}
            <blockquote className="flex-1">
                <p className="text-base text-white/80 leading-relaxed italic">
                    &ldquo;{quote}&rdquo;
                </p>
            </blockquote>

            {/* Author */}
            <footer className="flex items-center gap-3 pt-2 border-t border-white/10">
                {avatar && (
                    <img
                        src={avatar}
                        alt={avatarAlt || `${name} avatar`}
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-white/20 shrink-0"
                        loading="lazy"
                    />
                )}
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white leading-tight">{name}</span>
                    {role && (
                        <span className="text-xs text-white/50 leading-tight">{role}</span>
                    )}
                </div>
            </footer>
        </article>
    );
}

TestimonialCard.defaultProps = {
    role: '',
    avatar: '',
    avatarAlt: '',
    rating: 0,
};

TestimonialCard.propTypes = {
    /** The testimonial quote — required. */
    quote: PropTypes.string.isRequired,
    /** Author full name — required. */
    name: PropTypes.string.isRequired,
    /** Author role or title. */
    role: PropTypes.string,
    /** URL of the author's avatar image. */
    avatar: PropTypes.string,
    /** Explicit alt text for the avatar image. */
    avatarAlt: PropTypes.string,
    /** Star rating 1–5. Values ≤ 0 hide the star row. */
    rating: PropTypes.number,
};

export default TestimonialCard;
