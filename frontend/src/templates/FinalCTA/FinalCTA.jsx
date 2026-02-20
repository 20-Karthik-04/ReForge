/**
 * @fileoverview FinalCTA template component for ReForge code generation.
 *
 * Supports two layout variants:
 *  - gradient       : Bold gradient background (from-accent-purple via-primary-blue to-dark-navy).
 *  - image-overlay  : Full-width background image with a dark overlay (bg-black/60).
 *                     Same discipline as HeroSection `fullwidth`:
 *                       • backgroundImage  — the ONLY inline style, on the outer <section>.
 *                       • A sibling <div> with `absolute inset-0 bg-black/60` provides the overlay.
 *                       • All text/content lives inside a `relative z-10` container.
 *
 * Email input:
 *  - Rendered ONLY when `showEmailInput` prop is explicitly true.
 *  - Purely presentational — no form submission logic.
 *
 * @module FinalCTA
 */

import PropTypes from 'prop-types';
import { cn, resolveVariant } from '../templateUtils.js';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * CTAContent — headline + subheadline + CTA group.
 *
 * @param {object} props
 * @param {string} props.headline
 * @param {string} [props.subheadline]
 * @param {{ label: string, href: string }} [props.primaryCTA]
 * @param {boolean} [props.showEmailInput]
 * @param {string} [props.emailPlaceholder]
 * @param {string} [props.emailButtonLabel]
 */
function CTAContent({ headline, subheadline, primaryCTA, showEmailInput, emailPlaceholder, emailButtonLabel }) {
    return (
        <div className="flex flex-col items-center gap-6 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight">
                {headline}
            </h2>

            {subheadline && (
                <p className="max-w-xl text-lg text-white/75 leading-relaxed">
                    {subheadline}
                </p>
            )}

            {/* Email capture form — presentational only, no submission */}
            {showEmailInput ? (
                <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
                    <label htmlFor="cta-email-input" className="sr-only">
                        {emailPlaceholder || 'Email address'}
                    </label>
                    <input
                        id="cta-email-input"
                        type="email"
                        placeholder={emailPlaceholder || 'Enter your email'}
                        className={cn(
                            'flex-1 rounded-lg border border-white/20 bg-white/10',
                            'px-4 py-3 text-sm text-white placeholder:text-white/50',
                            'focus:outline-none focus:ring-2 focus:ring-white/50'
                        )}
                        readOnly
                    />
                    <button
                        type="button"
                        className={cn(
                            'rounded-lg bg-white px-6 py-3 text-sm font-semibold',
                            'text-dark-navy shadow-md',
                            'hover:bg-white/90 transition-colors duration-200',
                            'focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2'
                        )}
                    >
                        {emailButtonLabel || 'Get Started'}
                    </button>
                </div>
            ) : (
                primaryCTA && (
                    <a
                        href={primaryCTA.href}
                        className={cn(
                            'inline-block rounded-lg bg-white px-8 py-3.5 text-base font-semibold',
                            'text-dark-navy shadow-md',
                            'hover:bg-white/90 transition-colors duration-200',
                            'focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2'
                        )}
                    >
                        {primaryCTA.label}
                    </a>
                )
            )}
        </div>
    );
}

CTAContent.propTypes = {
    headline: PropTypes.string.isRequired,
    subheadline: PropTypes.string,
    primaryCTA: PropTypes.shape({
        label: PropTypes.string.isRequired,
        href: PropTypes.string.isRequired,
    }),
    showEmailInput: PropTypes.bool,
    emailPlaceholder: PropTypes.string,
    emailButtonLabel: PropTypes.string,
};

// ---------------------------------------------------------------------------
// Variant renderers
// ---------------------------------------------------------------------------

/**
 * GradientCTA — bold gradient background variant.
 */
function GradientCTA(props) {
    return (
        <section
            className="relative w-full overflow-hidden bg-gradient-to-br from-accent-purple via-primary-blue to-dark-navy"
            aria-labelledby="final-cta-heading-gradient"
        >
            {/* Decorative radial glow */}
            <div
                className="pointer-events-none absolute inset-0"
                aria-hidden="true"
                style={{
                    background:
                        'radial-gradient(ellipse 80% 70% at 50% 50%, rgba(255,255,255,0.06) 0%, transparent 70%)',
                }}
            />

            <div className="relative z-10 mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
                <CTAContent {...props} />
            </div>
        </section>
    );
}

GradientCTA.propTypes = CTAContent.propTypes;

/**
 * ImageOverlayCTA — full-width background image with dark overlay variant.
 *
 * Structure rules (same as HeroSection fullwidth):
 *  1. `backgroundImage` is set via inline `style` on the outermost <section>.
 *  2. A sibling <div> with `absolute inset-0 bg-black/60` provides the overlay.
 *  3. All content lives inside a `relative z-10` container.
 */
function ImageOverlayCTA({ backgroundImageUrl, backgroundImageAlt, ...contentProps }) {
    return (
        <section
            className="relative w-full overflow-hidden bg-dark-navy"
            style={
                backgroundImageUrl
                    ? { backgroundImage: `url(${backgroundImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : undefined
            }
            aria-labelledby="final-cta-heading-overlay"
        >
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/60" aria-hidden="true" />

            {/* Gradient fade bottom */}
            <div
                className="pointer-events-none absolute bottom-0 left-0 right-0 h-24"
                aria-hidden="true"
                style={{ background: 'linear-gradient(to bottom, transparent, rgba(26,32,44,0.6))' }}
            />

            <div className="relative z-10 mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
                {backgroundImageUrl && (
                    <span className="sr-only">{backgroundImageAlt || 'CTA background image'}</span>
                )}
                <CTAContent {...contentProps} />
            </div>
        </section>
    );
}

ImageOverlayCTA.propTypes = {
    ...CTAContent.propTypes,
    backgroundImageUrl: PropTypes.string,
    backgroundImageAlt: PropTypes.string,
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/**
 * FinalCTA — Final call-to-action section template for ReForge-generated pages.
 *
 * @component
 * @param {object}  props
 * @param {'gradient'|'image-overlay'} [props.variant='gradient'] - Layout variant.
 * @param {string}  props.headline          - Main h2 heading text (required).
 * @param {string}  [props.subheadline]     - Supporting paragraph below headline.
 * @param {{ label: string, href: string }} [props.primaryCTA] - CTA button (used when showEmailInput is false).
 * @param {boolean} [props.showEmailInput]  - When true, renders an email input + submit button.
 * @param {string}  [props.emailPlaceholder]  - Placeholder text for the email input.
 * @param {string}  [props.emailButtonLabel]  - Label for the email submit button.
 * @param {string}  [props.backgroundImageUrl]  - URL for background image (image-overlay variant only).
 * @param {string}  [props.backgroundImageAlt]  - Screen-reader description for background image.
 *
 * @example
 * <FinalCTA
 *   variant="gradient"
 *   headline="Start redesigning your site today"
 *   subheadline="No credit card required. Go live in minutes."
 *   primaryCTA={{ label: 'Get Started Free', href: '#start' }}
 * />
 *
 * @example
 * <FinalCTA
 *   variant="image-overlay"
 *   headline="Your next great website starts here"
 *   subheadline="Join thousands of creators using ReForge."
 *   showEmailInput
 *   emailPlaceholder="you@example.com"
 *   emailButtonLabel="Notify Me"
 *   backgroundImageUrl="https://example.com/bg.jpg"
 *   backgroundImageAlt="Team collaborating on a laptop"
 * />
 */
function FinalCTA({
    variant,
    headline,
    subheadline,
    primaryCTA,
    showEmailInput,
    emailPlaceholder,
    emailButtonLabel,
    backgroundImageUrl,
    backgroundImageAlt,
}) {
    const resolvedVariant = resolveVariant('FinalCTA', variant);

    const contentProps = {
        headline,
        subheadline,
        primaryCTA,
        showEmailInput,
        emailPlaceholder,
        emailButtonLabel,
    };

    if (resolvedVariant === 'image-overlay') {
        return (
            <ImageOverlayCTA
                {...contentProps}
                backgroundImageUrl={backgroundImageUrl}
                backgroundImageAlt={backgroundImageAlt}
            />
        );
    }

    // Default: 'gradient'
    return <GradientCTA {...contentProps} />;
}

FinalCTA.defaultProps = {
    variant: 'gradient',
    subheadline: '',
    primaryCTA: null,
    showEmailInput: false,
    emailPlaceholder: '',
    emailButtonLabel: '',
    backgroundImageUrl: '',
    backgroundImageAlt: '',
};

FinalCTA.propTypes = {
    /** Layout variant. Must be one of VARIANTS.FinalCTA. */
    variant: PropTypes.oneOf(['gradient', 'image-overlay']),
    /** Primary h2 headline — required. */
    headline: PropTypes.string.isRequired,
    /** Supporting paragraph shown below the headline. */
    subheadline: PropTypes.string,
    /** CTA button config. Used when showEmailInput is false. */
    primaryCTA: PropTypes.shape({
        label: PropTypes.string.isRequired,
        href: PropTypes.string.isRequired,
    }),
    /** When true, renders an email input + submit button instead of the primary CTA anchor. */
    showEmailInput: PropTypes.bool,
    /** Placeholder label for the email input. */
    emailPlaceholder: PropTypes.string,
    /** Label for the email submit button. */
    emailButtonLabel: PropTypes.string,
    /** Background image URL — used in 'image-overlay' variant only. */
    backgroundImageUrl: PropTypes.string,
    /** Screen-reader description of the background image. */
    backgroundImageAlt: PropTypes.string,
};

export default FinalCTA;
