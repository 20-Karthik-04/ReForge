/**
 * @file Error.jsx
 * @description Application error page. Reads the structured error from the
 * pipeline context and displays it to the user. The "Try Again" button
 * dispatches RESET and navigates back to /generate.
 *
 * Fallback message is shown when no error is present in state (e.g. when the
 * user navigates directly to /error without a prior pipeline failure).
 *
 * Rendered at: /error (nested inside AppLayout)
 */

import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import Container from '../components/layout/Container';
import Section from '../components/layout/Section';
import Button from '../components/ui/Button';
import usePipeline from '../context/usePipeline.js';
import { RESET } from '../context/pipelineReducer.js';

/** Fallback message shown when no error detail is available in state. */
const FALLBACK_MESSAGE =
    'ReForge encountered an unexpected problem while processing your ' +
    'request. This is likely a transient issue — please try again, or ' +
    'return to the home page to start fresh.';

/**
 * Error – pipeline error page.
 *
 * Reads `state.error` from pipeline context:
 *  - If present: displays `error.message`.
 *  - If absent:  displays a generic fallback message.
 *
 * "Try Again" button:
 *  1. Dispatches RESET (restores full initialState).
 *  2. Navigates to /generate.
 *
 * @returns {JSX.Element}
 */
function Error() {
    const { state, dispatch } = usePipeline();
    const navigate = useNavigate();

    /** Resolved error message — from context or fallback. */
    const errorMessage = state.error?.message ?? FALLBACK_MESSAGE;

    /**
     * Handles the "Try Again" action: resets global state then navigates
     * to the generate page so the user can start a fresh pipeline run.
     */
    function handleRetry() {
        dispatch({ type: RESET });
        navigate('/generate');
    }

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
                            {errorMessage}
                        </p>
                    </div>

                    {/* ── Action buttons ────────────────────────────────── */}
                    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                        <Button
                            variant="primary"
                            className="w-full sm:w-auto px-8"
                            onClick={handleRetry}
                        >
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
