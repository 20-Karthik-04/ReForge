/**
 * @fileoverview Footer template component for ReForge code generation.
 *
 * Implements a dark-background, multi-column footer with:
 *  - Company branding column (logo, tagline, social links)
 *  - Arbitrary number of link-group columns driven by the `linkGroups` prop
 *  - Optional presentational newsletter form (rendered only when `showNewsletter` is true)
 *  - Copyright bar
 *
 * All visible text comes from props — zero hardcoded labels.
 * No form submission logic — purely presentational.
 * Uses semantic <footer> element as required.
 *
 * @module Footer
 */

import PropTypes from 'prop-types';
import { cn } from '../templateUtils.js';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * SocialLink — A single social media icon link rendered as an accessible anchor.
 *
 * Rendering the icon: `icon` is expected to be a plain SVG string or a data-URI.
 * When a React SVG component cannot be assumed (since we are a static template),
 * we support both a `label` (visible sr-only text) and a simple text/emoji
 * `iconText` fallback rendered inside the button circle.
 *
 * @param {object} props
 * @param {string} props.href       - Link destination.
 * @param {string} props.label      - Screen-reader label.
 * @param {string} [props.iconText] - Visible placeholder text / emoji inside the circle.
 */
function SocialLink({ href, label, iconText }) {
    return (
        <a
            href={href}
            aria-label={label}
            className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full',
                'bg-white/10 text-white/60 text-sm',
                'hover:bg-white/20 hover:text-white transition-colors duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:ring-offset-2 focus-visible:ring-offset-dark-navy'
            )}
            target="_blank"
            rel="noopener noreferrer"
        >
            <span aria-hidden="true">{iconText || '↗'}</span>
        </a>
    );
}

SocialLink.propTypes = {
    href: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    iconText: PropTypes.string,
};

/**
 * CompanyColumn — Branding block: logo text, tagline, social links.
 *
 * @param {object}   props
 * @param {string}   props.logoText     - Company / product name rendered as logo text.
 * @param {string}   [props.tagline]    - Short brand tagline.
 * @param {Array}    [props.socialLinks] - Array of { href, label, iconText }.
 */
function CompanyColumn({ logoText, tagline, socialLinks }) {
    return (
        <div className="flex flex-col gap-4">
            {/* Logo text */}
            <span className="text-xl font-extrabold tracking-tight text-white">
                {logoText}
            </span>

            {/* Tagline */}
            {tagline && (
                <p className="max-w-xs text-sm text-white/50 leading-relaxed">
                    {tagline}
                </p>
            )}

            {/* Social links */}
            {socialLinks && socialLinks.length > 0 && (
                <ul className="flex flex-wrap gap-2" role="list" aria-label="Social media links">
                    {socialLinks.map((social) => (
                        <li key={social.href}>
                            <SocialLink
                                href={social.href}
                                label={social.label}
                                iconText={social.iconText}
                            />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

CompanyColumn.propTypes = {
    logoText: PropTypes.string.isRequired,
    tagline: PropTypes.string,
    socialLinks: PropTypes.arrayOf(
        PropTypes.shape({
            href: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            iconText: PropTypes.string,
        })
    ),
};

/**
 * LinkGroupColumn — A titled column of navigation links.
 *
 * @param {object} props
 * @param {string} props.heading - Column heading text.
 * @param {Array}  props.links   - Array of { label, href }.
 */
function LinkGroupColumn({ heading, links }) {
    return (
        <div className="flex flex-col gap-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40">
                {heading}
            </h3>
            <ul className="flex flex-col gap-2.5" role="list">
                {links.map((link) => (
                    <li key={link.href}>
                        <a
                            href={link.href}
                            className={cn(
                                'text-sm text-white/60',
                                'hover:text-white transition-colors duration-150',
                                'focus:outline-none focus-visible:underline focus-visible:text-white'
                            )}
                        >
                            {link.label}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}

LinkGroupColumn.propTypes = {
    heading: PropTypes.string.isRequired,
    links: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string.isRequired,
            href: PropTypes.string.isRequired,
        })
    ).isRequired,
};

/**
 * NewsletterForm — Presentational newsletter subscription form.
 * No submission logic — purely visual / structural.
 *
 * @param {object} props
 * @param {string} props.heading       - Newsletter section heading.
 * @param {string} [props.description] - Supporting text below heading.
 * @param {string} [props.placeholder] - Placeholder for email input.
 * @param {string} [props.buttonLabel] - Subscribe button label.
 */
function NewsletterForm({ heading, description, placeholder, buttonLabel }) {
    return (
        <div className="flex flex-col gap-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40">
                {heading}
            </h3>

            {description && (
                <p className="text-sm text-white/50 leading-relaxed">{description}</p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
                <label htmlFor="footer-newsletter-email" className="sr-only">
                    {placeholder || 'Email address'}
                </label>
                <input
                    id="footer-newsletter-email"
                    type="email"
                    placeholder={placeholder || 'Enter your email'}
                    className={cn(
                        'flex-1 rounded-lg border border-white/20 bg-white/10',
                        'px-4 py-2.5 text-sm text-white placeholder:text-white/40',
                        'focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2 focus:ring-offset-dark-navy'
                    )}
                    readOnly
                />
                <button
                    type="button"
                    className={cn(
                        'rounded-lg bg-primary-blue px-5 py-2.5 text-sm font-semibold text-white',
                        'hover:bg-primary-blue-light transition-colors duration-200',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2'
                    )}
                >
                    {buttonLabel || 'Subscribe'}
                </button>
            </div>
        </div>
    );
}

NewsletterForm.propTypes = {
    heading: PropTypes.string.isRequired,
    description: PropTypes.string,
    placeholder: PropTypes.string,
    buttonLabel: PropTypes.string,
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/**
 * Footer — Multi-column footer template for ReForge-generated pages.
 *
 * @component
 * @param {object}  props
 * @param {string}  props.logoText               - Company / product name as logo text (required).
 * @param {string}  [props.tagline]              - Short brand tagline shown below the logo.
 * @param {Array}   [props.socialLinks]          - Social media links: [{ href, label, iconText }].
 * @param {Array}   props.linkGroups             - Link columns: [{ heading, links: [{ label, href }] }].
 * @param {boolean} [props.showNewsletter]       - Whether to render the newsletter form column.
 * @param {object}  [props.newsletter]           - Newsletter form config.
 * @param {string}  props.newsletter.heading     - Newsletter column heading.
 * @param {string}  [props.newsletter.description] - Description text.
 * @param {string}  [props.newsletter.placeholder] - Email input placeholder.
 * @param {string}  [props.newsletter.buttonLabel] - Subscribe button label.
 * @param {string}  [props.copyrightText]        - Copyright notice rendered in the bottom bar.
 *
 * @example
 * <Footer
 *   logoText="ReForge"
 *   tagline="AI-powered website redesign, in seconds."
 *   linkGroups={[
 *     { heading: 'Product', links: [{ label: 'Features', href: '#features' }, { label: 'Pricing', href: '#pricing' }] },
 *     { heading: 'Legal', links: [{ label: 'Privacy', href: '/privacy' }, { label: 'Terms', href: '/terms' }] },
 *   ]}
 *   showNewsletter
 *   newsletter={{ heading: 'Stay updated', placeholder: 'you@example.com', buttonLabel: 'Subscribe' }}
 *   copyrightText="© 2025 ReForge. All rights reserved."
 * />
 */
function Footer({
    logoText,
    tagline,
    socialLinks,
    linkGroups,
    showNewsletter,
    newsletter,
    copyrightText,
}) {
    return (
        <footer
            className="w-full bg-dark-navy border-t border-white/10"
            aria-label="Site footer"
        >
            {/* Main grid */}
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
                <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(auto-fill,_minmax(140px,_1fr))]">
                    {/* Company column */}
                    <CompanyColumn
                        logoText={logoText}
                        tagline={tagline}
                        socialLinks={socialLinks}
                    />

                    {/* Link group columns */}
                    {linkGroups.map((group) => (
                        <LinkGroupColumn
                            key={group.heading}
                            heading={group.heading}
                            links={group.links}
                        />
                    ))}

                    {/* Optional newsletter column */}
                    {showNewsletter && newsletter && (
                        <NewsletterForm
                            heading={newsletter.heading}
                            description={newsletter.description}
                            placeholder={newsletter.placeholder}
                            buttonLabel={newsletter.buttonLabel}
                        />
                    )}
                </div>
            </div>

            {/* Copyright bar */}
            {copyrightText && (
                <div className="border-t border-white/10">
                    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                        <p className="text-xs text-white/30 text-center">
                            {copyrightText}
                        </p>
                    </div>
                </div>
            )}
        </footer>
    );
}

Footer.defaultProps = {
    tagline: '',
    socialLinks: [],
    linkGroups: [],
    showNewsletter: false,
    newsletter: null,
    copyrightText: '',
};

Footer.propTypes = {
    /** Company / product name as logo text — required. */
    logoText: PropTypes.string.isRequired,
    /** Short brand tagline shown beneath the logo. */
    tagline: PropTypes.string,
    /** Social media link items. */
    socialLinks: PropTypes.arrayOf(
        PropTypes.shape({
            /** Destination URL. */
            href: PropTypes.string.isRequired,
            /** Screen-reader aria-label. */
            label: PropTypes.string.isRequired,
            /** Visible text / emoji rendered inside the icon circle. */
            iconText: PropTypes.string,
        })
    ),
    /** Array of link-group column definitions. */
    linkGroups: PropTypes.arrayOf(
        PropTypes.shape({
            /** Column heading label. */
            heading: PropTypes.string.isRequired,
            /** Array of anchor links in this group. */
            links: PropTypes.arrayOf(
                PropTypes.shape({
                    label: PropTypes.string.isRequired,
                    href: PropTypes.string.isRequired,
                })
            ).isRequired,
        })
    ),
    /** Whether to render the newsletter subscription form. */
    showNewsletter: PropTypes.bool,
    /** Newsletter form configuration (required when showNewsletter is true). */
    newsletter: PropTypes.shape({
        heading: PropTypes.string.isRequired,
        description: PropTypes.string,
        placeholder: PropTypes.string,
        buttonLabel: PropTypes.string,
    }),
    /** Copyright notice text rendered in the bottom bar. */
    copyrightText: PropTypes.string,
};

export default Footer;
