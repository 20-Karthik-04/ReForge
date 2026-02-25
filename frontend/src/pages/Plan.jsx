/**
 * @file Plan.jsx
 * @description Displays the AI-generated redesign plan and allows the user to
 * regenerate it or approve and trigger code generation.
 *
 * State wiring:
 *  - Reads `state.stage`, `state.redesignPlan`, `state.targetAnalysis`,
 *    `state.referenceAnalysis`, and `state.inputs` from the pipeline context.
 *  - Dispatches PLAN_START / PLAN_SUCCESS / GENERATE_START / GENERATE_SUCCESS / SET_ERROR.
 *  - All async calls are in the component (not the reducer).
 *  - Each button handler has its own try/catch (one failure boundary per action).
 *
 * Guard:
 *  - If `redesignPlan` is null and `stage` is not 'planning' on mount
 *    (e.g. user refreshed or deep-linked), redirects to `/generate`.
 *
 * Navigation:
 *  - navigate('/generate') – stale-state guard
 *  - navigate('/results')  – after successful GENERATE_SUCCESS
 *  - navigate('/error')    – on any error
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
    GENERATE_START,
    GENERATE_SUCCESS,
    SET_ERROR,
} from '../context/pipelineReducer.js';
import { generatePlan, generateCode } from '../services/apiClient.js';

// ─── Page Component ────────────────────────────────────────────────────────

/**
 * Plan – displays the AI redesign plan and exposes approve / regenerate actions.
 *
 * Rendering behaviour:
 *   stage === 'planning'           → spinner + "Generating Redesign Plan…"
 *   stage === 'generating' or later → full plan display + action buttons
 *
 * Component will redirect to /generate if `redesignPlan` is null and stage is
 * not 'planning' on mount (handles browser refresh and invalid deep-links).
 *
 * @returns {JSX.Element}
 */
function Plan() {
    const { state, dispatch } = usePipeline();
    const navigate = useNavigate();

    /** Prevents double-trigger while regenerate call is in flight. */
    const [isRegenerating, setIsRegenerating] = useState(false);

    /** Prevents double-trigger while code generation call is in flight. */
    const [isGenerating, setIsGenerating] = useState(false);

    const { stage, redesignPlan, targetAnalysis, referenceAnalysis, inputs } = state;

    /** True when any async operation is in progress on this page. */
    const isBusy = isRegenerating || isGenerating;

    // ── Stale-state guard ──────────────────────────────────────────────────
    // If the user refreshed or navigated directly to /plan without a valid plan
    // (and not currently generating one), redirect them back to /generate.
    useEffect(() => {
        if (redesignPlan === null && stage !== 'planning') {
            navigate('/generate', { replace: true });
        }
    }, [redesignPlan, stage, navigate]);

    // ── Regenerate plan ────────────────────────────────────────────────────

    /**
     * Re-runs the planning step with the existing analysis data.
     * Does NOT re-run analysis.
     */
    async function handleRegenerate() {
        if (isBusy) return;
        setIsRegenerating(true);

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
            setIsRegenerating(false);
        }
    }

    // ── Approve & generate code ────────────────────────────────────────────

    /**
     * Triggers deterministic code generation using the approved plan.
     * Code generation must only begin after the user explicitly approves.
     */
    async function handleApprove() {
        if (isBusy) return;
        setIsGenerating(true);

        dispatch({ type: GENERATE_START });

        try {
            const { output } = await generateCode({
                redesignPlan,
                targetAnalysis,
            });

            dispatch({
                type: GENERATE_SUCCESS,
                payload: { generatedOutput: output },
            });

            navigate('/results');
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
            setIsGenerating(false);
        }
    }

    // ── Render: spinner while planning ─────────────────────────────────────
    if (stage === 'planning') {
        return (
            <Section>
                <Container>
                    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 py-20 text-center">
                        <Spinner size="lg" />
                        <div>
                            <h1 className="mb-2 text-2xl font-bold text-dark-navy">
                                Generating Redesign Plan
                            </h1>
                            <p className="text-sm text-dark-navy-light">
                                The AI is planning your website redesign based on the
                                analysis. This usually takes 10–20 seconds.
                            </p>
                        </div>
                    </div>
                </Container>
            </Section>
        );
    }

    // ── Render: plan display ───────────────────────────────────────────────
    // Safely extract plan fields with optional chaining since the AI response
    // shape may vary. Fallback to empty arrays/null where safe to do so.
    const sectionOrdering = redesignPlan?.sectionOrdering ?? [];
    const layoutVariants = redesignPlan?.layoutVariants ?? [];
    const addedSections = redesignPlan?.addedSections ?? null;
    const removedSections = redesignPlan?.removedSections ?? null;

    return (
        <Section>
            <Container>
                <div className="mx-auto max-w-2xl">
                    {/* Page heading */}
                    <div className="mb-8 text-center">
                        <h1 className="mb-2 text-3xl font-bold text-dark-navy sm:text-4xl">
                            Redesign Plan
                        </h1>
                        <p className="text-base text-dark-navy-light">
                            Review the AI-generated plan below. You can regenerate it or
                            approve and generate the code.
                        </p>
                    </div>

                    <div className="flex flex-col gap-6">
                        {/* ── Section ordering ──────────────────────────── */}
                        <div className="rounded-card border border-light-gray-dark bg-white p-5 shadow-card">
                            <h2 className="mb-3 text-base font-semibold text-dark-navy">
                                Section Ordering
                            </h2>
                            {sectionOrdering.length > 0 ? (
                                <ol className="flex flex-col gap-2 pl-1">
                                    {sectionOrdering.map((section, idx) => (
                                        <li
                                            key={idx}
                                            className="flex items-center gap-3 text-sm text-dark-navy"
                                        >
                                            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                                                {idx + 1}
                                            </span>
                                            <span>
                                                {typeof section === 'string'
                                                    ? section
                                                    : section.type ??
                                                    section.componentName ??
                                                    JSON.stringify(section)}
                                            </span>
                                        </li>
                                    ))}
                                </ol>
                            ) : (
                                <p className="text-sm text-dark-navy-light">
                                    No section ordering available.
                                </p>
                            )}
                        </div>

                        {/* ── Layout variants ───────────────────────────── */}
                        {layoutVariants.length > 0 && (
                            <div className="rounded-card border border-light-gray-dark bg-white p-5 shadow-card">
                                <h2 className="mb-3 text-base font-semibold text-dark-navy">
                                    Layout Variants
                                </h2>
                                <ul className="flex flex-col gap-2">
                                    {layoutVariants.map((variant, idx) => (
                                        <li
                                            key={idx}
                                            className="flex items-start gap-2 text-sm text-dark-navy"
                                        >
                                            <span
                                                aria-hidden="true"
                                                className="mt-0.5 text-primary"
                                            >
                                                ▸
                                            </span>
                                            <span>
                                                {typeof variant === 'string'
                                                    ? variant
                                                    : variant.name ?? JSON.stringify(variant)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* ── Added / removed sections ───────────────────── */}
                        {(addedSections?.length > 0 || removedSections?.length > 0) && (
                            <div className="rounded-card border border-light-gray-dark bg-white p-5 shadow-card">
                                <h2 className="mb-3 text-base font-semibold text-dark-navy">
                                    Section Changes
                                </h2>
                                {addedSections?.length > 0 && (
                                    <div className="mb-3">
                                        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-status-success">
                                            Added
                                        </p>
                                        <ul className="flex flex-col gap-1">
                                            {addedSections.map((s, idx) => (
                                                <li
                                                    key={idx}
                                                    className="text-sm text-dark-navy"
                                                >
                                                    + {typeof s === 'string' ? s : s.type ?? JSON.stringify(s)}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {removedSections?.length > 0 && (
                                    <div>
                                        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-status-error">
                                            Removed
                                        </p>
                                        <ul className="flex flex-col gap-1">
                                            {removedSections.map((s, idx) => (
                                                <li
                                                    key={idx}
                                                    className="text-sm text-dark-navy"
                                                >
                                                    − {typeof s === 'string' ? s : s.type ?? JSON.stringify(s)}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Actions ───────────────────────────────────── */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                            <Button
                                type="button"
                                variant="secondary"
                                disabled={isBusy}
                                onClick={handleRegenerate}
                            >
                                {isRegenerating ? 'Regenerating…' : '↺ Regenerate Plan'}
                            </Button>

                            <Button
                                type="button"
                                variant="primary"
                                disabled={isBusy}
                                onClick={handleApprove}
                                className="px-8"
                            >
                                {isGenerating ? 'Generating Code…' : 'Approve & Generate Code →'}
                            </Button>
                        </div>
                    </div>
                </div>
            </Container>
        </Section>
    );
}

Plan.propTypes = {};

export default Plan;
