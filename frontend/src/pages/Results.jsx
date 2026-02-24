/**
 * @file Results.jsx
 * @description Results / Preview page. Displays a static loading status block
 * and a live-preview iframe placeholder. Purely presentational — no API calls,
 * no useState, no useEffect, no navigation on button click.
 *
 * Rendered at: /results (nested inside AppLayout)
 */

import PropTypes from 'prop-types';
import Container from '../components/layout/Container';
import Section from '../components/layout/Section';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';

/**
 * Results – static preview page shown while (or after) generation runs.
 *
 * Contains:
 *  - A centered status block with a Spinner, heading, and descriptive subtext.
 *  - A bordered preview container housing a titled iframe placeholder.
 *  - Two visual-only action buttons ("Download ZIP", "Regenerate").
 *
 * @returns {JSX.Element}
 */
function Results() {
    return (
        <Section>
            <Container>
                <div className="mx-auto max-w-3xl flex flex-col gap-10">

                    {/* ── Status block ─────────────────────────────────── */}
                    <div className="flex flex-col items-center gap-4 text-center">
                        <Spinner size="lg" />

                        <h1 className="text-3xl font-bold text-dark-navy sm:text-4xl">
                            Generating Your Redesign&hellip;
                        </h1>

                        <p className="max-w-prose text-base text-dark-navy-light">
                            ReForge is analyzing your website, building a component plan, and
                            assembling a production-ready React codebase. This may take
                            20&ndash;60 seconds.
                        </p>
                    </div>

                    {/* ── Live preview container ────────────────────────── */}
                    <div className="flex flex-col gap-3">
                        <p className="text-sm font-semibold text-dark-navy">
                            Live Preview
                        </p>

                        <div
                            className={[
                                'rounded-card border-2 border-light-gray-dark',
                                'bg-light-gray overflow-hidden',
                                'min-h-[480px] flex items-center justify-center',
                            ].join(' ')}
                        >
                            {/* Placeholder iframe — no src, no dynamic content */}
                            <iframe
                                title="Generated preview"
                                className="h-full w-full border-none"
                                aria-label="Live preview of generated redesign"
                            />
                        </div>
                    </div>

                    {/* ── Action buttons ────────────────────────────────── */}
                    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                        <Button variant="primary" className="w-full sm:w-auto px-8">
                            Download ZIP
                        </Button>
                        <Button variant="secondary" className="w-full sm:w-auto px-8">
                            Regenerate
                        </Button>
                    </div>

                </div>
            </Container>
        </Section>
    );
}

Results.propTypes = {};

export default Results;
