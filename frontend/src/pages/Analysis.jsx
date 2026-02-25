/**
 * @file Analysis.jsx
 * @description Displays the result of the target website analysis and allows
 * the user to proceed to plan generation.
 *
 * State wiring:
 *  - Reads `state.stage`, `state.targetAnalysis`, `state.referenceAnalysis`,
 *    and `state.inputs` from the pipeline context.
 *  - Dispatches PLAN_START / PLAN_SUCCESS / SET_ERROR.
 *  - All async calls are in the component (not the reducer).
 *  - Single try/catch wraps the async sequence (one failure boundary).
 *
 * Guard:
 *  - If `targetAnalysis` is null on mount (e.g. user refreshed or deep-linked),
 *    redirects to `/generate` immediately via a useEffect.
 *
 * Navigation:
 *  - navigate('/generate') – "Edit Inputs" button or stale-state guard
 *  - navigate('/plan')     – after successful PLAN_SUCCESS
 *  - navigate('/error')    – on any planning error
 */

import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import Container from '../components/layout/Container';
import Section from '../components/layout/Section';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import usePipeline from '../context/usePipeline.js';
import {
    PLAN_START,
    PLAN_SUCCESS,
    SET_ERROR,
} from '../context/pipelineReducer.js';
import { generatePlan } from '../services/apiClient.js';

// ─── Sub-components ────────────────────────────────────────────────────────

/**
 * MetricItem – a single labelled metric value.
 *
 * @param {object} props
 * @param {string} props.label - Display label.
 * @param {string|number} props.value - Metric value.
 * @returns {JSX.Element}
 */
function MetricItem({ label, value }) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-card border border-light-gray-dark bg-light-gray px-4 py-2">
            <span className="text-sm text-dark-navy-light">{label}</span>
            <span className="text-sm font-semibold text-dark-navy">{value}</span>
        </div>
    );
}

MetricItem.propTypes = {
    /** Display label for the metric */
    label: PropTypes.string.isRequired,
    /** The measured value */
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

// ─── Page Component ────────────────────────────────────────────────────────

/**
 * Analysis – displays the target website analysis result.
 *
 * Rendering behaviour:
 *   stage === 'analyzing'          → spinner + "Analyzing Website…"
 *   stage === 'planning' or later  → full analysis summary + action buttons
 *
 * Component will redirect to /generate if `targetAnalysis` is null on mount
 * (handles browser refresh and invalid deep-links to /analysis).
 *
 * @returns {JSX.Element}
 */
function Analysis() {
    const { state, dispatch } = usePipeline();
    const navigate = useNavigate();

    /** Prevents double-trigger while planning API call is in flight. */
    const [isPlanningBusy, setIsPlanningBusy] = useState(false);

    const { stage, targetAnalysis, referenceAnalysis, inputs } = state;

    // ── Stale-state guard ──────────────────────────────────────────────────
    // If the user refreshed or navigated directly to /analysis without first
    // going through the generation form, redirect them back to /generate.
    useEffect(() => {
        if (targetAnalysis === null && stage !== 'analyzing') {
            navigate('/generate', { replace: true });
        }
    }, [targetAnalysis, stage, navigate]);

    // ── Plan trigger ───────────────────────────────────────────────────────

    /**
     * Starts the planning step. Dispatches PLAN_START, awaits the API,
     * dispatches PLAN_SUCCESS, then navigates to /plan.
     * Must only be called on user intent (button click).
     */
    async function handleProceedToPlan() {
        if (isPlanningBusy) return;
        setIsPlanningBusy(true);

        dispatch({ type: PLAN_START });

        try {
            const { plan } = await generatePlan({
                targetAnalysis,
                referenceAnalysis,
                goals: inputs.goals,
            });

            dispatch({
                type: PLAN_SUCCESS,
                payload: { redesignPlan: plan },
            });

            navigate('/plan');
        } catch (error) {
            const structured =
                error && typeof error.message === 'string'
                    ? error
                    : { message: 'An unexpected error occurred.', code: 'UNKNOWN_ERROR' };

            dispatch({
                type: SET_ERROR,
                payload: { error: structured },
            });

            navigate('/error');
        } finally {
            setIsPlanningBusy(false);
        }
    }

    // ── Render: spinner while analyzing ───────────────────────────────────
    if (stage === 'analyzing') {
        return (
            <Section>
                <Container>
                    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 py-20 text-center">
                        <Spinner size="lg" />
                        <div>
                            <h1 className="mb-2 text-2xl font-bold text-dark-navy">
                                Analyzing Website
                            </h1>
                            <p className="text-sm text-dark-navy-light">
                                ReForge is crawling and inspecting your website.
                                This usually takes 10–30 seconds.
                            </p>
                        </div>
                    </div>
                </Container>
            </Section>
        );
    }

    // ── Render: analysis summary ───────────────────────────────────────────
    // Safely extract commonly available fields from the analysis object.
    // We use optional chaining throughout since the API shape is flexible.
    const sectionTypes = targetAnalysis?.sections
        ? targetAnalysis.sections.map((s) => s.type ?? s.sectionType ?? 'Unknown')
        : [];

    const issues = targetAnalysis?.issues ?? [];

    const wordCount = targetAnalysis?.metrics?.wordCount ?? targetAnalysis?.wordCount ?? null;
    const headingCount =
        targetAnalysis?.metrics?.headingCount ?? targetAnalysis?.headingCount ?? null;

    return (
        <Section>
            <Container>
                <div className="mx-auto max-w-2xl">
                    {/* Page heading */}
                    <div className="mb-8 text-center">
                        <h1 className="mb-2 text-3xl font-bold text-dark-navy sm:text-4xl">
                            Analysis Complete
                        </h1>
                        <p className="text-base text-dark-navy-light">
                            Here&rsquo;s what ReForge found. Review the results, then
                            proceed to generate your redesign plan.
                        </p>
                        {inputs.targetUrl && (
                            <p className="mt-2 break-all text-xs text-primary">
                                {inputs.targetUrl}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-6">
                        {/* ── Detected sections ─────────────────────────── */}
                        <div className="rounded-card border border-light-gray-dark bg-white p-5 shadow-card">
                            <h2 className="mb-3 text-base font-semibold text-dark-navy">
                                Detected Section Types
                            </h2>
                            {sectionTypes.length > 0 ? (
                                <ul className="flex flex-wrap gap-2">
                                    {sectionTypes.map((type, idx) => (
                                        <li
                                            key={idx}
                                            className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                                        >
                                            {type}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-dark-navy-light">
                                    No section types detected.
                                </p>
                            )}
                        </div>

                        {/* ── Identified issues ─────────────────────────── */}
                        <div className="rounded-card border border-light-gray-dark bg-white p-5 shadow-card">
                            <h2 className="mb-3 text-base font-semibold text-dark-navy">
                                Identified Issues
                            </h2>
                            {issues.length > 0 ? (
                                <ul className="flex flex-col gap-2">
                                    {issues.map((issue, idx) => (
                                        <li
                                            key={idx}
                                            className="flex items-start gap-2 text-sm text-dark-navy"
                                        >
                                            <span
                                                aria-hidden="true"
                                                className="mt-0.5 text-status-warning"
                                            >
                                                ⚠
                                            </span>
                                            <span>
                                                {typeof issue === 'string'
                                                    ? issue
                                                    : issue.description ?? issue.message ?? JSON.stringify(issue)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-dark-navy-light">
                                    No issues identified.
                                </p>
                            )}
                        </div>

                        {/* ── Basic metrics ─────────────────────────────── */}
                        {(wordCount !== null || headingCount !== null) && (
                            <div className="rounded-card border border-light-gray-dark bg-white p-5 shadow-card">
                                <h2 className="mb-3 text-base font-semibold text-dark-navy">
                                    Basic Metrics
                                </h2>
                                <div className="flex flex-col gap-2">
                                    {wordCount !== null && (
                                        <MetricItem label="Word Count" value={wordCount} />
                                    )}
                                    {headingCount !== null && (
                                        <MetricItem label="Heading Count" value={headingCount} />
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── Actions ───────────────────────────────────── */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                            <Button
                                type="button"
                                variant="secondary"
                                disabled={isPlanningBusy}
                                onClick={() => navigate('/generate')}
                            >
                                ← Edit Inputs
                            </Button>

                            <Button
                                type="button"
                                variant="primary"
                                disabled={isPlanningBusy}
                                onClick={handleProceedToPlan}
                                className="px-8"
                            >
                                {isPlanningBusy ? 'Generating Plan…' : 'Proceed to Plan →'}
                            </Button>
                        </div>
                    </div>
                </div>
            </Container>
        </Section>
    );
}

Analysis.propTypes = {};

export default Analysis;
