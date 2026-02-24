/**
 * @file AppLayout.jsx
 * @description Minimal static layout shell for the ReForge application.
 * Renders a sticky header with brand identity and a Get Started nav link,
 * a main content area via React Router's <Outlet />, and a compact footer.
 * Purely presentational — no business logic, no API calls, no state.
 */

import PropTypes from 'prop-types';
import { Link, Outlet } from 'react-router-dom';

/**
 * AppHeader – sticky top navigation bar with the ReForge wordmark and a
 * primary navigation CTA.
 *
 * @returns {JSX.Element}
 */
function AppHeader() {
    return (
        <header
            className="sticky top-0 z-50 border-b border-light-gray-dark bg-white/90 backdrop-blur-sm"
            role="banner"
        >
            <div className="mx-auto flex w-full max-w-container items-center justify-between px-container-x py-4 lg:px-container-x-lg">
                {/* Brand wordmark */}
                <Link
                    to="/"
                    className="flex items-center gap-2 text-xl font-bold text-dark-navy hover:text-primary transition-colors duration-200"
                    aria-label="ReForge – go to home"
                >
                    {/* SVG logo mark */}
                    <svg
                        width="28"
                        height="28"
                        viewBox="0 0 28 28"
                        fill="none"
                        aria-hidden="true"
                        focusable="false"
                    >
                        <rect width="28" height="28" rx="6" fill="#4A90E2" />
                        <path
                            d="M8 8h7a5 5 0 0 1 0 10h-7V8z"
                            fill="white"
                        />
                        <circle cx="20" cy="20" r="3" fill="#7C3AED" />
                    </svg>
                    ReForge
                </Link>

                {/* Primary nav CTA */}
                <nav aria-label="Main navigation">
                    <Link
                        to="/generate"
                        className="inline-flex items-center justify-center rounded-button bg-gradient-to-r from-primary to-primary-light px-4 py-2 text-sm font-semibold text-white shadow-button-primary transition-all duration-200 hover:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                        Get Started
                    </Link>
                </nav>
            </div>
        </header>
    );
}

AppHeader.propTypes = {};

/**
 * AppFooter – compact single-row footer with copyright notice.
 *
 * @returns {JSX.Element}
 */
function AppFooter() {
    return (
        <footer
            className="border-t border-light-gray-dark bg-dark-navy py-6"
            role="contentinfo"
        >
            <div className="mx-auto flex w-full max-w-container flex-col items-center justify-between gap-2 px-container-x text-sm sm:flex-row lg:px-container-x-lg">
                <p className="font-semibold text-white">ReForge</p>
                <p className="text-white/60">
                    AI-assisted frontend redesign. Built with care.
                </p>
                <p className="text-white/40">
                    &copy; {new Date().getFullYear()} ReForge
                </p>
            </div>
        </footer>
    );
}

AppFooter.propTypes = {};

/**
 * AppLayout – root layout wrapper. Composes AppHeader, the routed page
 * content via <Outlet />, and AppFooter into a full-page flex column.
 *
 * @returns {JSX.Element}
 */
function AppLayout() {
    return (
        <div className="flex min-h-screen flex-col bg-white font-sans text-dark-navy">
            <AppHeader />
            <main className="flex-1" id="main-content">
                <Outlet />
            </main>
            <AppFooter />
        </div>
    );
}

AppLayout.propTypes = {};

export default AppLayout;
