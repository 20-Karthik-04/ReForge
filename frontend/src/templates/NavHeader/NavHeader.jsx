/**
 * @fileoverview NavHeader template component for ReForge code generation.
 *
 * Supports three layout variants:
 *  - minimal  : Logo left | nav links center | CTA button right
 *  - centered : Logo centered top | nav links centered below
 *  - sticky   : Fixed to viewport top with backdrop-blur and semi-transparent background
 *
 * All variants include a responsive hamburger menu for mobile breakpoints.
 *
 * @module NavHeader
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { cn, resolveVariant } from '../templateUtils.js';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * Renders the logo — either an image (when imageUrl provided) or a styled text mark.
 *
 * @param {object} props
 * @param {string} [props.text] - Fallback text logo.
 * @param {string} [props.imageUrl] - Optional logo image URL.
 * @param {string} [props.alt] - Alt text when imageUrl is provided.
 */
function Logo({ text, imageUrl, alt }) {
    if (imageUrl) {
        return (
            <a href="/" aria-label={alt || text || 'Home'} className="flex items-center shrink-0">
                <img src={imageUrl} alt={alt || text || 'Logo'} className="h-8 w-auto object-contain" />
            </a>
        );
    }
    return (
        <a href="/" aria-label={text ? `${text} - Home` : 'Home'} className="flex items-center shrink-0">
            <span className="text-xl font-bold tracking-tight text-white">{text || 'Brand'}</span>
        </a>
    );
}

Logo.propTypes = {
    text: PropTypes.string,
    imageUrl: PropTypes.string,
    alt: PropTypes.string,
};

/**
 * Renders a horizontal list of navigation links.
 *
 * @param {object} props
 * @param {Array<{label: string, href: string}>} props.links
 * @param {string} [props.className]
 */
function NavLinks({ links, className }) {
    return (
        <nav aria-label="Primary navigation">
            <ul className={cn('flex gap-6', className)} role="list">
                {links.map((link) => (
                    <li key={link.href}>
                        <a
                            href={link.href}
                            className="text-sm font-medium text-white/80 hover:text-white transition-colors duration-200 focus:outline-none focus-visible:underline"
                        >
                            {link.label}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

NavLinks.propTypes = {
    links: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string.isRequired,
            href: PropTypes.string.isRequired,
        })
    ).isRequired,
    className: PropTypes.string,
};

/**
 * Renders the primary CTA button.
 *
 * @param {object} props
 * @param {string} props.label
 * @param {string} props.href
 */
function CTAButton({ label, href }) {
    return (
        <a
            href={href}
            className="inline-block rounded-lg bg-primary-blue px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary-blue-light transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        >
            {label}
        </a>
    );
}

CTAButton.propTypes = {
    label: PropTypes.string.isRequired,
    href: PropTypes.string.isRequired,
};

/**
 * Mobile dropdown menu — rendered below the header bar on small screens.
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {Array<{label: string, href: string}>} props.links
 * @param {{ label: string, href: string }} [props.cta]
 * @param {string} props.menuId - ID matching aria-controls on the toggle button.
 */
function MobileMenu({ isOpen, links, cta, menuId }) {
    return (
        <div
            id={menuId}
            role="navigation"
            aria-label="Mobile navigation"
            aria-hidden={!isOpen}
            className={cn(
                'md:hidden overflow-hidden transition-all duration-300',
                isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
            )}
        >
            <ul className="flex flex-col gap-1 px-4 pb-4 pt-2" role="list">
                {links.map((link) => (
                    <li key={link.href}>
                        <a
                            href={link.href}
                            className="block rounded-md px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors duration-200"
                        >
                            {link.label}
                        </a>
                    </li>
                ))}
                {cta && (
                    <li className="mt-2">
                        <a
                            href={cta.href}
                            className="block w-full rounded-lg bg-primary-blue px-4 py-2 text-center text-sm font-semibold text-white hover:bg-primary-blue-light transition-colors duration-200"
                        >
                            {cta.label}
                        </a>
                    </li>
                )}
            </ul>
        </div>
    );
}

MobileMenu.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    links: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string.isRequired,
            href: PropTypes.string.isRequired,
        })
    ).isRequired,
    cta: PropTypes.shape({
        label: PropTypes.string.isRequired,
        href: PropTypes.string.isRequired,
    }),
    menuId: PropTypes.string.isRequired,
};

// ---------------------------------------------------------------------------
// Variant renderers
// ---------------------------------------------------------------------------

/**
 * Renders the inner header row for the 'minimal' variant.
 * Layout: [Logo] ——— [Nav Links] ——— [CTA]
 */
function MinimalBar({ logo, navLinks, cta, onToggle, menuOpen, menuId }) {
    return (
        <div className="flex items-center justify-between">
            <Logo {...logo} />
            <NavLinks links={navLinks} className="hidden md:flex" />
            <div className="flex items-center gap-3">
                {cta && <div className="hidden md:block"><CTAButton {...cta} /></div>}
                <HamburgerButton isOpen={menuOpen} onToggle={onToggle} menuId={menuId} />
            </div>
        </div>
    );
}

MinimalBar.propTypes = {
    logo: PropTypes.object.isRequired,
    navLinks: PropTypes.array.isRequired,
    cta: PropTypes.object,
    onToggle: PropTypes.func.isRequired,
    menuOpen: PropTypes.bool.isRequired,
    menuId: PropTypes.string.isRequired,
};

/**
 * Renders the inner header row for the 'centered' variant.
 * Layout: [Logo centered] / [Nav Links centered]
 */
function CenteredBar({ logo, navLinks, cta, onToggle, menuOpen, menuId }) {
    return (
        <>
            {/* Mobile row */}
            <div className="flex items-center justify-between md:hidden">
                <Logo {...logo} />
                <HamburgerButton isOpen={menuOpen} onToggle={onToggle} menuId={menuId} />
            </div>
            {/* Desktop centered layout */}
            <div className="hidden md:flex flex-col items-center gap-3">
                <Logo {...logo} />
                <div className="flex items-center gap-6">
                    <NavLinks links={navLinks} />
                    {cta && <CTAButton {...cta} />}
                </div>
            </div>
        </>
    );
}

CenteredBar.propTypes = {
    logo: PropTypes.object.isRequired,
    navLinks: PropTypes.array.isRequired,
    cta: PropTypes.object,
    onToggle: PropTypes.func.isRequired,
    menuOpen: PropTypes.bool.isRequired,
    menuId: PropTypes.string.isRequired,
};

/**
 * Hamburger toggle button — shared across all variants.
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onToggle
 * @param {string} props.menuId - Must match the id of the controlled element.
 */
function HamburgerButton({ isOpen, onToggle, menuId }) {
    return (
        <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-expanded={isOpen}
            aria-controls={menuId}
            aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={onToggle}
        >
            {isOpen ? (
                /* Close icon */
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            ) : (
                /* Hamburger icon */
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
            )}
        </button>
    );
}

HamburgerButton.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onToggle: PropTypes.func.isRequired,
    menuId: PropTypes.string.isRequired,
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/**
 * NavHeader — Navigation header template for ReForge-generated pages.
 *
 * @component
 * @param {object} props
 * @param {'minimal'|'centered'|'sticky'} [props.variant='minimal'] - Layout variant.
 * @param {{ text?: string, imageUrl?: string, alt?: string }} props.logo - Logo configuration.
 * @param {Array<{label: string, href: string}>} props.navLinks - Navigation link items.
 * @param {{ label: string, href: string }} [props.cta] - Primary CTA button.
 * @param {boolean} [props.transparent=false] - Removes background (for use over hero sections).
 *
 * @example
 * <NavHeader
 *   variant="minimal"
 *   logo={{ text: 'Acme' }}
 *   navLinks={[{ label: 'Features', href: '#features' }]}
 *   cta={{ label: 'Get Started', href: '#cta' }}
 * />
 */
function NavHeader({ variant, logo, navLinks, cta, transparent }) {
    const resolvedVariant = resolveVariant('NavHeader', variant);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuId = 'nav-mobile-menu';

    const handleToggle = () => setMenuOpen((prev) => !prev);

    // Base wrapper classes — shared across all variants
    const isSticky = resolvedVariant === 'sticky';
    const wrapperClasses = cn(
        'w-full z-50',
        isSticky
            ? 'fixed top-0 left-0 backdrop-blur-md bg-dark-navy/80 border-b border-white/10 shadow-lg'
            : transparent
                ? 'absolute top-0 left-0 bg-transparent'
                : 'relative bg-dark-navy'
    );

    const innerPaddingClasses =
        resolvedVariant === 'centered'
            ? 'px-4 py-4 md:py-5'
            : 'px-4 py-3 md:px-8 md:py-4';

    return (
        <header className={wrapperClasses} role="banner">
            <div className={cn('max-w-7xl mx-auto', innerPaddingClasses)}>
                {resolvedVariant === 'centered' ? (
                    <CenteredBar
                        logo={logo}
                        navLinks={navLinks}
                        cta={cta}
                        onToggle={handleToggle}
                        menuOpen={menuOpen}
                        menuId={menuId}
                    />
                ) : (
                    /* 'minimal' and 'sticky' both use the MinimalBar layout */
                    <MinimalBar
                        logo={logo}
                        navLinks={navLinks}
                        cta={cta}
                        onToggle={handleToggle}
                        menuOpen={menuOpen}
                        menuId={menuId}
                    />
                )}
            </div>

            {/* Mobile menu — rendered inside <header> so it's part of the banner landmark */}
            <div className={cn('max-w-7xl mx-auto', isSticky ? 'px-0' : '')}>
                <MobileMenu isOpen={menuOpen} links={navLinks} cta={cta} menuId={menuId} />
            </div>
        </header>
    );
}

NavHeader.defaultProps = {
    variant: 'minimal',
    logo: { text: 'Brand' },
    navLinks: [],
    cta: null,
    transparent: false,
};

NavHeader.propTypes = {
    /** Layout variant. Must be one of VARIANTS.NavHeader. */
    variant: PropTypes.oneOf(['minimal', 'centered', 'sticky']),
    /** Logo configuration — provide imageUrl for image logo, text for text mark. */
    logo: PropTypes.shape({
        text: PropTypes.string,
        imageUrl: PropTypes.string,
        alt: PropTypes.string,
    }),
    /** Navigation link items shown in the nav bar. */
    navLinks: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string.isRequired,
            href: PropTypes.string.isRequired,
        })
    ),
    /** Primary call-to-action button. Omit to hide the CTA. */
    cta: PropTypes.shape({
        label: PropTypes.string.isRequired,
        href: PropTypes.string.isRequired,
    }),
    /** When true, renders header with transparent background (for hero overlays). */
    transparent: PropTypes.bool,
};

export default NavHeader;
