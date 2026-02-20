/**
 * @fileoverview PricingCard sub-component for the PricingSection template.
 *
 * Renders a single pricing tier with plan name, price, feature list, and CTA.
 * The `highlighted` prop (not automatic middle-card logic) controls the
 * visually prominent "recommended" treatment.
 *
 * @module PricingCard
 */

import PropTypes from 'prop-types';
import { cn } from '../templateUtils.js';

/**
 * PricingCard — Displays a single pricing tier.
 *
 * @component
 * @param {object}   props
 * @param {string}   props.name         - Plan name (e.g. "Pro"). Required.
 * @param {string}   props.price        - Price string (e.g. "$49/mo"). Required.
 * @param {string}   [props.description]  - Short tagline for the plan.
 * @param {string[]} [props.features]   - List of feature strings.
 * @param {string}   props.ctaLabel     - CTA button label (e.g. "Get Started"). Required.
 * @param {string}   [props.ctaHref]    - Href for the CTA button/link.
 * @param {boolean}  [props.highlighted]  - When true renders the card as the recommended/featured tier.
 * @param {string}   [props.badge]      - Optional badge text shown on highlighted cards (e.g. "Most Popular").
 *
 * @example
 * <PricingCard
 *   name="Pro"
 *   price="$49/mo"
 *   description="For growing teams."
 *   features={['Unlimited projects', 'Priority support', 'Custom domain']}
 *   ctaLabel="Get Started"
 *   ctaHref="#"
 *   highlighted
 *   badge="Most Popular"
 * />
 */
function PricingCard({ name, price, description, features, ctaLabel, ctaHref, highlighted, badge }) {
    return (
        <article
            className={cn(
                'relative flex flex-col rounded-2xl p-8 ring-1 transition-shadow duration-200',
                highlighted
                    ? 'bg-primary-blue ring-primary-blue shadow-2xl shadow-primary-blue/30 scale-[1.02]'
                    : 'bg-dark-navy-light/60 ring-white/10 hover:ring-white/20'
            )}
            aria-label={`${name} pricing plan`}
        >
            {/* Badge */}
            {highlighted && badge && (
                <div
                    className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-yellow-400 px-4 py-1 text-xs font-bold text-gray-900 shadow-md"
                    aria-label={badge}
                >
                    {badge}
                </div>
            )}

            {/* Plan name */}
            <h3
                className={cn(
                    'text-lg font-bold leading-snug',
                    highlighted ? 'text-white' : 'text-white'
                )}
            >
                {name}
            </h3>

            {/* Description */}
            {description && (
                <p
                    className={cn(
                        'mt-1 text-sm leading-relaxed',
                        highlighted ? 'text-white/80' : 'text-white/50'
                    )}
                >
                    {description}
                </p>
            )}

            {/* Price */}
            <p className="mt-6 flex items-baseline gap-1">
                <span
                    className={cn(
                        'text-4xl font-extrabold tracking-tight',
                        highlighted ? 'text-white' : 'text-white'
                    )}
                >
                    {price}
                </span>
            </p>

            {/* Feature list */}
            {features && features.length > 0 && (
                <ul className="mt-8 flex flex-col gap-3" role="list">
                    {features.map((feature, idx) => (
                        <li
                            key={idx}
                            className={cn(
                                'flex items-start gap-3 text-sm leading-relaxed',
                                highlighted ? 'text-white/90' : 'text-white/70'
                            )}
                        >
                            {/* Checkmark icon */}
                            <svg
                                className={cn(
                                    'mt-0.5 h-4 w-4 shrink-0',
                                    highlighted ? 'text-yellow-300' : 'text-primary-blue'
                                )}
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            {feature}
                        </li>
                    ))}
                </ul>
            )}

            {/* CTA */}
            <div className="mt-auto pt-8">
                <a
                    href={ctaHref || '#'}
                    className={cn(
                        'block w-full rounded-xl px-6 py-3 text-center text-sm font-semibold transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                        highlighted
                            ? 'bg-white text-primary-blue hover:bg-white/90 focus-visible:outline-white'
                            : 'bg-primary-blue/20 text-white hover:bg-primary-blue/30 focus-visible:outline-primary-blue'
                    )}
                >
                    {ctaLabel}
                </a>
            </div>
        </article>
    );
}

PricingCard.defaultProps = {
    description: '',
    features: [],
    ctaHref: '#',
    highlighted: false,
    badge: '',
};

PricingCard.propTypes = {
    /** Plan display name — required. */
    name: PropTypes.string.isRequired,
    /** Price string (e.g. "$49/mo") — required. */
    price: PropTypes.string.isRequired,
    /** Short tagline for the plan. */
    description: PropTypes.string,
    /** Array of feature strings for the feature list. */
    features: PropTypes.arrayOf(PropTypes.string),
    /** CTA button label — required. */
    ctaLabel: PropTypes.string.isRequired,
    /** Href for the CTA anchor element. */
    ctaHref: PropTypes.string,
    /** When true, renders the card as the highlighted/recommended tier. */
    highlighted: PropTypes.bool,
    /** Badge text displayed above highlighted cards (e.g. "Most Popular"). */
    badge: PropTypes.string,
};

export default PricingCard;
