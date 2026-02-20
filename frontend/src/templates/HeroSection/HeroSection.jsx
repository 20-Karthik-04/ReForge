/**
 * @fileoverview HeroSection template component for ReForge code generation.
 *
 * Supports three layout variants:
 *  - centered  : All content centered, radial gradient background
 *  - split     : Content left / hero image right (stacks to single column on mobile)
 *  - fullwidth : Full-width background image with a Tailwind overlay (bg-black/50).
 *                Text is always inside a relative container — never absolutely
 *                positioned outside it. backgroundImage is the ONLY inline style used.
 *
 * @module HeroSection
 */

import PropTypes from 'prop-types';
import { cn, resolveVariant } from '../templateUtils.js';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * Renders the headline and subheadline block.
 *
 * @param {object} props
 * @param {string} props.headline
 * @param {string} [props.subheadline]
 * @param {string} [props.align] - Tailwind text-align class, e.g. 'text-center'.
 */
function HeroText({ headline, subheadline, align }) {
    return (
        <div className={cn('flex flex-col gap-4', align)}>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl leading-tight">
                {headline}
            </h1>
            {subheadline && (
                <p className="max-w-xl text-lg text-white/75 leading-relaxed">
                    {subheadline}
                </p>
            )}
        </div>
    );
}

HeroText.propTypes = {
    headline: PropTypes.string.isRequired,
    subheadline: PropTypes.string,
    align: PropTypes.string,
};

/**
 * Renders the CTA button group (primary + optional secondary).
 *
 * @param {object} props
 * @param {{ label: string, href: string }} [props.primaryCTA]
 * @param {{ label: string, href: string }} [props.secondaryCTA]
 * @param {string} [props.justify] - Tailwind justify-* class for the flex container.
 */
function CTAGroup({ primaryCTA, secondaryCTA, justify }) {
    if (!primaryCTA && !secondaryCTA) return null;
    return (
        <div className={cn('flex flex-wrap gap-3 mt-2', justify)}>
            {primaryCTA && (
                <a
                    href={primaryCTA.href}
                    className="inline-block rounded-lg bg-primary-blue px-6 py-3 text-base font-semibold text-white shadow-md hover:bg-primary-blue-light transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
                >
                    {primaryCTA.label}
                </a>
            )}
            {secondaryCTA && (
                <a
                    href={secondaryCTA.href}
                    className="inline-block rounded-lg border border-white/30 px-6 py-3 text-base font-semibold text-white hover:bg-white/10 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
                >
                    {secondaryCTA.label}
                </a>
            )}
        </div>
    );
}

CTAGroup.propTypes = {
    primaryCTA: PropTypes.shape({
        label: PropTypes.string.isRequired,
        href: PropTypes.string.isRequired,
    }),
    secondaryCTA: PropTypes.shape({
        label: PropTypes.string.isRequired,
        href: PropTypes.string.isRequired,
    }),
    justify: PropTypes.string,
};

/**
 * Renders a list of short trust indicator strings (e.g. "10k+ users", "No credit card").
 *
 * @param {object} props
 * @param {string[]} props.indicators
 * @param {string} [props.justify] - Tailwind justify-* for the flex container.
 */
function TrustIndicators({ indicators, justify }) {
    if (!indicators || indicators.length === 0) return null;
    return (
        <ul
            aria-label="Trust indicators"
            className={cn('flex flex-wrap gap-x-5 gap-y-2 mt-1', justify)}
            role="list"
        >
            {indicators.map((item) => (
                <li
                    key={item}
                    className="flex items-center gap-1.5 text-sm text-white/60"
                >
                    {/* Checkmark icon */}
                    <svg
                        className="h-4 w-4 shrink-0 text-green-400"
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
                    {item}
                </li>
            ))}
        </ul>
    );
}

TrustIndicators.propTypes = {
    indicators: PropTypes.arrayOf(PropTypes.string),
    justify: PropTypes.string,
};

/**
 * Renders the hero image with a rounded card shadow — used in the 'split' variant.
 *
 * @param {object} props
 * @param {string} props.src
 * @param {string} [props.alt]
 */
function HeroImage({ src, alt }) {
    return (
        <div className="flex-1 flex items-center justify-center">
            <div className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                <img
                    src={src}
                    alt={alt || 'Hero illustration'}
                    className="w-full h-auto object-cover"
                    loading="eager"
                />
            </div>
        </div>
    );
}

HeroImage.propTypes = {
    src: PropTypes.string.isRequired,
    alt: PropTypes.string,
};

// ---------------------------------------------------------------------------
// Variant renderers
// ---------------------------------------------------------------------------

/**
 * Centered variant — content centered, radial gradient background.
 */
function CenteredHero({ headline, subheadline, primaryCTA, secondaryCTA, trustIndicators }) {
    return (
        <section
            className="relative w-full min-h-[520px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-dark-navy via-dark-navy-light to-accent-purple"
            aria-labelledby="hero-heading-centered"
        >
            {/* Decorative radial glow */}
            <div
                className="pointer-events-none absolute inset-0"
                aria-hidden="true"
                style={{
                    background:
                        'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(124,58,237,0.18) 0%, transparent 70%)',
                }}
            />

            <div className="relative z-10 mx-auto max-w-3xl px-4 py-20 sm:px-6 text-center flex flex-col items-center gap-6">
                <HeroText headline={headline} subheadline={subheadline} align="text-center items-center" />
                <CTAGroup primaryCTA={primaryCTA} secondaryCTA={secondaryCTA} justify="justify-center" />
                <TrustIndicators indicators={trustIndicators} justify="justify-center" />
            </div>
        </section>
    );
}

CenteredHero.propTypes = {
    headline: PropTypes.string.isRequired,
    subheadline: PropTypes.string,
    primaryCTA: PropTypes.object,
    secondaryCTA: PropTypes.object,
    trustIndicators: PropTypes.arrayOf(PropTypes.string),
};

/**
 * Split variant — content left, image right; stacks vertically on mobile.
 */
function SplitHero({ headline, subheadline, primaryCTA, secondaryCTA, trustIndicators, heroImageUrl, heroImageAlt }) {
    return (
        <section
            className="relative w-full min-h-[520px] flex items-center overflow-hidden bg-gradient-to-r from-dark-navy to-dark-navy-light"
            aria-labelledby="hero-heading-split"
        >
            {/* Decorative side accent */}
            <div
                className="pointer-events-none absolute inset-y-0 right-0 w-1/2"
                aria-hidden="true"
                style={{
                    background:
                        'radial-gradient(ellipse 80% 80% at 80% 50%, rgba(74,144,226,0.15) 0%, transparent 70%)',
                }}
            />

            <div className="relative z-10 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-16 md:py-24 flex flex-col md:flex-row items-center gap-12">
                {/* Left: Text content */}
                <div className="flex-1 flex flex-col gap-6">
                    <HeroText headline={headline} subheadline={subheadline} />
                    <CTAGroup primaryCTA={primaryCTA} secondaryCTA={secondaryCTA} />
                    <TrustIndicators indicators={trustIndicators} />
                </div>

                {/* Right: Image */}
                {heroImageUrl && (
                    <HeroImage src={heroImageUrl} alt={heroImageAlt} />
                )}
            </div>
        </section>
    );
}

SplitHero.propTypes = {
    headline: PropTypes.string.isRequired,
    subheadline: PropTypes.string,
    primaryCTA: PropTypes.object,
    secondaryCTA: PropTypes.object,
    trustIndicators: PropTypes.arrayOf(PropTypes.string),
    heroImageUrl: PropTypes.string,
    heroImageAlt: PropTypes.string,
};

/**
 * Fullwidth variant — background image via inline style (the ONLY inline style used).
 *
 * Structure rules (enforced):
 *  1. `backgroundImage` is set via inline `style` on the outermost <section>.
 *  2. A sibling `<div>` with `absolute inset-0 bg-black/50` provides the overlay.
 *  3. All text/content lives inside a `relative z-10` container — never outside it.
 *  4. No text is absolutely positioned.
 */
function FullwidthHero({ headline, subheadline, primaryCTA, secondaryCTA, trustIndicators, heroImageUrl, heroImageAlt }) {
    return (
        <section
            className="relative w-full min-h-[580px] flex items-center overflow-hidden bg-dark-navy"
            style={heroImageUrl ? { backgroundImage: `url(${heroImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
            aria-labelledby="hero-heading-fullwidth"
        >
            {/* Dark overlay via Tailwind — covers background image */}
            <div className="absolute inset-0 bg-black/50" aria-hidden="true" />

            {/* Gradient fade at bottom for smooth section transition */}
            <div
                className="pointer-events-none absolute bottom-0 left-0 right-0 h-32"
                aria-hidden="true"
                style={{ background: 'linear-gradient(to bottom, transparent, rgba(26,32,44,0.8))' }}
            />

            {/* Content container — relative z-10 keeps it above the overlay */}
            <div className="relative z-10 mx-auto max-w-3xl w-full px-4 sm:px-6 lg:px-8 py-24 text-center flex flex-col items-center gap-6">
                {/* Screen-reader accessible image description when heroImageUrl is provided */}
                {heroImageUrl && (
                    <span className="sr-only">{heroImageAlt || 'Hero background image'}</span>
                )}
                <HeroText headline={headline} subheadline={subheadline} align="text-center items-center" />
                <CTAGroup primaryCTA={primaryCTA} secondaryCTA={secondaryCTA} justify="justify-center" />
                <TrustIndicators indicators={trustIndicators} justify="justify-center" />
            </div>
        </section>
    );
}

FullwidthHero.propTypes = {
    headline: PropTypes.string.isRequired,
    subheadline: PropTypes.string,
    primaryCTA: PropTypes.object,
    secondaryCTA: PropTypes.object,
    trustIndicators: PropTypes.arrayOf(PropTypes.string),
    heroImageUrl: PropTypes.string,
    heroImageAlt: PropTypes.string,
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/**
 * HeroSection — Hero section template for ReForge-generated pages.
 *
 * @component
 * @param {object} props
 * @param {'centered'|'split'|'fullwidth'} [props.variant='centered'] - Layout variant.
 * @param {string} props.headline - Main H1 heading text (required).
 * @param {string} [props.subheadline] - Supporting paragraph below headline.
 * @param {{ label: string, href: string }} [props.primaryCTA] - Primary action button.
 * @param {{ label: string, href: string }} [props.secondaryCTA] - Secondary action link.
 * @param {string[]} [props.trustIndicators] - Short trust phrases (e.g. ['No credit card', '10k+ users']).
 * @param {string} [props.heroImageUrl] - URL for hero image (split/fullwidth variants).
 * @param {string} [props.heroImageAlt] - Alt text for hero image.
 *
 * @example
 * <HeroSection
 *   variant="split"
 *   headline="Build faster with ReForge"
 *   subheadline="AI-powered frontend generation from any website."
 *   primaryCTA={{ label: 'Get Started', href: '#start' }}
 *   secondaryCTA={{ label: 'See Demo', href: '#demo' }}
 *   heroImageUrl="https://example.com/hero.png"
 *   heroImageAlt="ReForge dashboard preview"
 *   trustIndicators={['No credit card required', '100% free to try']}
 * />
 */
function HeroSection({
    variant,
    headline,
    subheadline,
    primaryCTA,
    secondaryCTA,
    trustIndicators,
    heroImageUrl,
    heroImageAlt,
}) {
    const resolvedVariant = resolveVariant('HeroSection', variant);

    const sharedProps = {
        headline,
        subheadline,
        primaryCTA,
        secondaryCTA,
        trustIndicators,
        heroImageUrl,
        heroImageAlt,
    };

    if (resolvedVariant === 'split') {
        return <SplitHero {...sharedProps} />;
    }
    if (resolvedVariant === 'fullwidth') {
        return <FullwidthHero {...sharedProps} />;
    }
    // Default: 'centered'
    return <CenteredHero {...sharedProps} />;
}

HeroSection.defaultProps = {
    variant: 'centered',
    subheadline: '',
    primaryCTA: null,
    secondaryCTA: null,
    trustIndicators: [],
    heroImageUrl: '',
    heroImageAlt: 'Hero image',
};

HeroSection.propTypes = {
    /** Layout variant. Must be one of VARIANTS.HeroSection. */
    variant: PropTypes.oneOf(['centered', 'split', 'fullwidth']),
    /** Primary H1 headline — required. */
    headline: PropTypes.string.isRequired,
    /** Supporting paragraph shown below the headline. */
    subheadline: PropTypes.string,
    /** Primary CTA button config. */
    primaryCTA: PropTypes.shape({
        label: PropTypes.string.isRequired,
        href: PropTypes.string.isRequired,
    }),
    /** Secondary CTA link config (optional). */
    secondaryCTA: PropTypes.shape({
        label: PropTypes.string.isRequired,
        href: PropTypes.string.isRequired,
    }),
    /** Short trust signals rendered below the CTAs. */
    trustIndicators: PropTypes.arrayOf(PropTypes.string),
    /** Hero image URL — used in 'split' and 'fullwidth' variants. */
    heroImageUrl: PropTypes.string,
    /** Alt text for the hero image. */
    heroImageAlt: PropTypes.string,
};

export default HeroSection;
