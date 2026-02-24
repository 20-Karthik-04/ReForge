/**
 * @file Error.jsx
 * @description Application error page. Purely presentational — no error
 * detection, no props, no useState, no useEffect. Displays a static error
 * state with an icon, message, and action buttons.
 *
 * Rendered at: /error (nested inside AppLayout)
 */

import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Container from '../components/layout/Container';
import Section from '../components/layout/Section';
import Button from '../components/ui/Button';

/**
 * Error – static application error page.
 *
 * Contains:
 *  - An inline SVG error icon.
 *  - A bold "Something Went Wrong" heading.
 *  - A short explanatory message consistent with the ReForge design voice.
 *  - A visual-only "Try Again" button (no handler).
 *  - A "Back to Home" link rendered via React Router's &lt;Link&gt;.
 *
 * @returns {JSX.Element}
 */
function Error() {
    return (
        <Section>
            <Container>
                <div className="mx-auto max-w-lg flex flex-col items-center gap-8 text-center">

                    {/* ── Error icon ───────────────────────────────────── */}
                    <span
                        aria-hidden="true"
                        className="flex h-20 w-20 items-center justify-center rounded-full bg-status-error/10"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-10 w-10 text-status-error"
                            aria-hidden="true"
                            focusable="false"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </span>

                    {/* ── Heading + message ────────────────────────────── */}
                    <div className="flex flex-col gap-3">
                        <h1 className="text-3xl font-bold text-dark-navy sm:text-4xl">
                            Something Went Wrong
                        </h1>

                        <p className="text-base text-dark-navy-light">
                            ReForge encountered an unexpected problem while processing your
                            request. This is likely a transient issue — please try again, or
                            return to the home page to start fresh.
                        </p>
                    </div>

                    {/* ── Action buttons ────────────────────────────────── */}
                    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                        <Button variant="primary" className="w-full sm:w-auto px-8">
                            Try Again
                        </Button>

                        <Link
                            to="/"
                            className={[
                                'inline-flex items-center justify-center',
                                'rounded-button border border-primary',
                                'px-8 py-2.5',
                                'text-sm font-semibold text-primary',
                                'transition-all duration-300',
                                'hover:bg-light-gray',
                                'focus-visible:outline-none focus-visible:ring-2',
                                'focus-visible:ring-primary focus-visible:ring-offset-2',
                            ].join(' ')}
                        >
                            Back to Home
                        </Link>
                    </div>

                </div>
            </Container>
        </Section>
    );
}

Error.propTypes = {};

export default Error;
