/**
 * @file Generate.jsx
 * @description Main generation form page. Collects the target URL, redesign
 * goals, and an optional reference URL from the user. Performs client-side
 * validation only. No API calls. No useEffect. No navigation on submit.
 */

import PropTypes from 'prop-types';
import { useState } from 'react';
import Container from '../components/layout/Container';
import Section from '../components/layout/Section';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

// ─── Static constants ──────────────────────────────────────────────────────

/**
 * Redesign goals available for selection.
 * Derived from PRD §6: "Redesign Goals".
 *
 * @type {Array<{id: string, label: string, description: string}>}
 */
const REDESIGN_GOALS = [
    {
        id: 'modern-design',
        label: 'Modern Design',
        description: 'Refresh visual style with contemporary aesthetics and layout patterns.',
    },
    {
        id: 'conversion-rate',
        label: 'Improved Conversion Rate',
        description: 'Strengthen CTAs, tighten value propositions, and reduce friction.',
    },
    {
        id: 'mobile-responsiveness',
        label: 'Better Mobile Responsiveness',
        description: 'Optimize layout, spacing, and touch targets for mobile devices.',
    },
    {
        id: 'accessibility',
        label: 'Enhanced Accessibility',
        description: 'Fix heading hierarchy, contrast ratios, and keyboard navigation.',
    },
    {
        id: 'cleaner-layout',
        label: 'Cleaner Layout and Structure',
        description: 'Remove visual clutter and establish clear content hierarchy.',
    },
];

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Returns true if the given string is a syntactically valid HTTP/HTTPS URL.
 *
 * @param {string} value - The string to test.
 * @returns {boolean}
 */
function isValidUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

// ─── Sub-components ────────────────────────────────────────────────────────

/**
 * GoalChip – a single toggleable goal badge.
 *
 * @param {object}   props             - Component props.
 * @param {string}   props.id          - Goal identifier.
 * @param {string}   props.label       - Display label.
 * @param {string}   props.description - Short description shown on the chip.
 * @param {boolean}  props.selected    - Whether this goal is currently selected.
 * @param {Function} props.onToggle    - Callback invoked with `id` when clicked.
 * @returns {JSX.Element}
 */
function GoalChip({ id, label, description, selected, onToggle }) {
    return (
        <button
            type="button"
            id={`goal-${id}`}
            aria-pressed={selected}
            onClick={() => onToggle(id)}
            className={[
                'flex flex-col gap-1 rounded-card border-2 p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                selected
                    ? 'border-primary bg-primary text-white shadow-button-primary'
                    : 'border-light-gray-dark bg-white text-dark-navy hover:border-primary/40 hover:shadow-card',
            ].join(' ')}
        >
            <span className="text-sm font-semibold leading-snug">{label}</span>
            <span
                className={[
                    'text-xs leading-relaxed',
                    selected ? 'text-white/80' : 'text-dark-navy-light',
                ].join(' ')}
            >
                {description}
            </span>
        </button>
    );
}

GoalChip.propTypes = {
    /** Goal identifier */
    id: PropTypes.string.isRequired,
    /** Display label */
    label: PropTypes.string.isRequired,
    /** One-line description shown inside the chip */
    description: PropTypes.string.isRequired,
    /** Whether this chip is selected */
    selected: PropTypes.bool.isRequired,
    /** Toggle handler — receives goal `id` */
    onToggle: PropTypes.func.isRequired,
};

// ─── Page Component ────────────────────────────────────────────────────────

/**
 * Generate – main generation form page.
 *
 * Collects the target URL, one or more redesign goals, and an optional
 * reference URL. Validates inputs client-side on submit attempt.
 * Does NOT call any API. Does NOT navigate on submit. Does NOT use useEffect.
 *
 * Allowed useState:
 *   - targetUrl    {string}       – controlled URL input value
 *   - referenceUrl {string}       – controlled optional URL input value
 *   - selectedGoals {Set<string>} – set of selected goal IDs
 *   - errors        {object}      – validation error strings keyed by field
 *
 * @returns {JSX.Element}
 */
function Generate() {
    const [targetUrl, setTargetUrl] = useState('');
    const [referenceUrl, setReferenceUrl] = useState('');
    const [selectedGoals, setSelectedGoals] = useState(new Set());
    const [errors, setErrors] = useState({});

    /**
     * Toggles a goal ID in/out of the selectedGoals Set.
     *
     * @param {string} goalId - The goal to toggle.
     */
    function handleGoalToggle(goalId) {
        setSelectedGoals((prev) => {
            const next = new Set(prev);
            if (next.has(goalId)) {
                next.delete(goalId);
            } else {
                next.add(goalId);
            }
            return next;
        });
        // Clear goal error as soon as user makes a selection
        if (errors.goals) {
            setErrors((prev) => ({ ...prev, goals: '' }));
        }
    }

    /**
     * Validates the form. Returns an errors object — empty means valid.
     *
     * @returns {Record<string, string>}
     */
    function validate() {
        const next = {};

        if (!targetUrl.trim()) {
            next.targetUrl = 'Target URL is required.';
        } else if (!isValidUrl(targetUrl.trim())) {
            next.targetUrl = 'Please enter a valid URL (e.g. https://example.com).';
        }

        if (selectedGoals.size === 0) {
            next.goals = 'Select at least one redesign goal.';
        }

        if (referenceUrl.trim() && !isValidUrl(referenceUrl.trim())) {
            next.referenceUrl = 'Please enter a valid URL (e.g. https://example.com).';
        }

        return next;
    }

    /**
     * Submit handler — validates only. No API call. No navigation.
     *
     * @param {React.FormEvent<HTMLFormElement>} event
     */
    function handleSubmit(event) {
        event.preventDefault();
        const validationErrors = validate();
        setErrors(validationErrors);
        // Stub: when validation passes, pipeline integration goes here (Phase 12+)
    }

    return (
        <Section>
            <Container>
                <div className="mx-auto max-w-2xl">
                    {/* Page heading */}
                    <div className="mb-10 text-center">
                        <h1 className="mb-3 text-3xl font-bold text-dark-navy sm:text-4xl">
                            Redesign Your Website
                        </h1>
                        <p className="text-base text-dark-navy-light">
                            Provide your target URL and goals. ReForge will analyze, plan,
                            and generate a modern React codebase — deterministically.
                        </p>
                    </div>

                    {/* Generation form */}
                    <form
                        onSubmit={handleSubmit}
                        noValidate
                        aria-label="Website redesign generation form"
                        className="flex flex-col gap-8"
                    >
                        {/* ── Target URL ──────────────────────────────── */}
                        <Input
                            id="target-url"
                            label="Target Website URL"
                            type="url"
                            value={targetUrl}
                            onChange={(e) => {
                                setTargetUrl(e.target.value);
                                if (errors.targetUrl) {
                                    setErrors((prev) => ({ ...prev, targetUrl: '' }));
                                }
                            }}
                            placeholder="https://your-website.com"
                            error={errors.targetUrl || ''}
                        />

                        {/* ── Redesign Goals ───────────────────────────── */}
                        <fieldset>
                            <legend className="mb-1 text-sm font-medium text-dark-navy">
                                Redesign Goals{' '}
                                <span className="text-dark-navy-light font-normal">
                                    (select all that apply)
                                </span>
                            </legend>

                            <div
                                className="mt-3 grid gap-3 sm:grid-cols-2"
                                role="group"
                                aria-label="Redesign goals"
                            >
                                {REDESIGN_GOALS.map((goal) => (
                                    <GoalChip
                                        key={goal.id}
                                        id={goal.id}
                                        label={goal.label}
                                        description={goal.description}
                                        selected={selectedGoals.has(goal.id)}
                                        onToggle={handleGoalToggle}
                                    />
                                ))}
                            </div>

                            {/* Goals error */}
                            {errors.goals && (
                                <p
                                    role="alert"
                                    className="mt-2 text-xs text-status-error"
                                >
                                    {errors.goals}
                                </p>
                            )}
                        </fieldset>

                        {/* ── Reference URL (optional) ─────────────────── */}
                        <div>
                            <Input
                                id="reference-url"
                                label="Reference Website (optional)"
                                type="url"
                                value={referenceUrl}
                                onChange={(e) => {
                                    setReferenceUrl(e.target.value);
                                    if (errors.referenceUrl) {
                                        setErrors((prev) => ({ ...prev, referenceUrl: '' }));
                                    }
                                }}
                                placeholder="https://a-website-you-like.com"
                                error={errors.referenceUrl || ''}
                            />
                            <p className="mt-1.5 text-xs text-dark-navy-light">
                                Optional. ReForge extracts layout patterns from this URL for
                                design inspiration only — no content or branding is copied.
                            </p>
                        </div>

                        {/* ── Submit ───────────────────────────────────── */}
                        <div className="flex flex-col items-center gap-4 sm:flex-row">
                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full sm:w-auto px-8 py-3 text-base"
                            >
                                Generate Redesign
                            </Button>
                            <p className="text-xs text-dark-navy-light text-center sm:text-left">
                                Analysis and code generation may take 20–60 seconds.
                            </p>
                        </div>
                    </form>
                </div>
            </Container>
        </Section>
    );
}

Generate.propTypes = {};

export default Generate;
