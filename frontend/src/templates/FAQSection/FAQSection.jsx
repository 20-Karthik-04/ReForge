/**
 * @fileoverview FAQSection template component for ReForge code generation.
 *
 * Implements a single-open accordion — only one FAQ item can be expanded at
 * a time. State is managed with useState(activeIndex) where activeIndex is a
 * number | null. No multiple-open logic. No nested state complexity.
 *
 * Accessibility:
 *  - Trigger buttons use aria-expanded and aria-controls.
 *  - Accordion panels are keyboard accessible (Enter/Space via native <button>).
 *  - ARIA live region is not required — the panel's existence/visibility
 *    is communicated via aria-expanded and aria-controls per WAI-ARIA patterns.
 *
 * @module FAQSection
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { cn } from '../templateUtils.js';

// ---------------------------------------------------------------------------
// FAQ Accordion Item
// ---------------------------------------------------------------------------

/**
 * FAQItem — A single accordion row with a trigger button and collapsible panel.
 *
 * @param {object}  props
 * @param {string}  props.question  - The FAQ question text.
 * @param {string}  props.answer    - The FAQ answer text.
 * @param {boolean} props.isOpen    - Whether this item is currently expanded.
 * @param {string}  props.panelId   - Unique id for the answer panel element.
 * @param {function} props.onToggle - Callback fired when the trigger is activated.
 */
function FAQItem({ question, answer, isOpen, panelId, onToggle }) {
    return (
        <div className="border-b border-white/10 last:border-b-0">
            {/* Trigger */}
            <h3>
                <button
                    type="button"
                    id={`${panelId}-trigger`}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={onToggle}
                    className={cn(
                        'flex w-full items-center justify-between gap-4 py-5 text-left',
                        'text-sm font-semibold text-white leading-relaxed',
                        'hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:ring-offset-2 focus-visible:ring-offset-dark-navy',
                        'transition-colors duration-150'
                    )}
                >
                    <span>{question}</span>

                    {/* Chevron icon — rotates 180° when open */}
                    <span
                        className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                            'bg-white/10 text-white/60',
                            'transition-transform duration-200',
                            isOpen && 'rotate-180'
                        )}
                        aria-hidden="true"
                    >
                        <svg
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </span>
                </button>
            </h3>

            {/* Collapsible panel */}
            <div
                id={panelId}
                role="region"
                aria-labelledby={`${panelId}-trigger`}
                hidden={!isOpen}
            >
                <p className="pb-5 text-sm text-white/60 leading-relaxed">
                    {answer}
                </p>
            </div>
        </div>
    );
}

FAQItem.propTypes = {
    /** The FAQ question — required. */
    question: PropTypes.string.isRequired,
    /** The FAQ answer — required. */
    answer: PropTypes.string.isRequired,
    /** Whether this item is currently expanded. */
    isOpen: PropTypes.bool.isRequired,
    /** Unique id for the answer panel (used by aria-controls). */
    panelId: PropTypes.string.isRequired,
    /** Toggle callback. */
    onToggle: PropTypes.func.isRequired,
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/**
 * FAQSection — Single-open accordion FAQ section template for ReForge-generated pages.
 *
 * Only one accordion item may be open at a time (single-open model).
 * State: useState<number | null>(null) — null means all collapsed.
 *
 * @component
 * @param {object} props
 * @param {string} [props.heading]    - Section h2 heading.
 * @param {string} [props.subheading] - Supporting paragraph below heading.
 * @param {Array<{ question: string, answer: string }>} props.faqs
 *   - Array of FAQ items. Each item requires question and answer.
 * @param {string} [props.idPrefix]   - Prefix for generated panel IDs (for uniqueness when multiple
 *   FAQSection instances appear on the same page). Defaults to 'faq'.
 *
 * @example
 * <FAQSection
 *   heading="Frequently Asked Questions"
 *   faqs={[
 *     { question: 'What is ReForge?', answer: 'ReForge is an AI-powered website redesign tool.' },
 *     { question: 'Is it free?', answer: 'We offer a free tier with up to 5 projects.' },
 *   ]}
 * />
 */
function FAQSection({ heading, subheading, faqs, idPrefix }) {
    // Single-open accordion: activeIndex is the index of the open item, or null.
    const [activeIndex, setActiveIndex] = useState(null);

    /**
     * Toggle a specific FAQ item open/closed.
     * If the tapped item is already open, close it (set null).
     *
     * @param {number} idx
     */
    function handleToggle(idx) {
        setActiveIndex((prev) => (prev === idx ? null : idx));
    }

    return (
        <section
            className="w-full bg-dark-navy py-16 sm:py-20 lg:py-24"
            aria-labelledby="faq-section-heading"
        >
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                {(heading || subheading) && (
                    <div className="mb-12 text-center">
                        {heading && (
                            <h2
                                id="faq-section-heading"
                                className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
                            >
                                {heading}
                            </h2>
                        )}
                        {subheading && (
                            <p className="mt-4 text-base text-white/60 leading-relaxed">
                                {subheading}
                            </p>
                        )}
                    </div>
                )}

                {/* Accordion list */}
                <div
                    className="divide-y divide-white/10 rounded-2xl bg-dark-navy-light/60 ring-1 ring-white/10 px-6"
                    role="list"
                >
                    {faqs.map((faq, idx) => {
                        const panelId = `${idPrefix}-panel-${idx}`;
                        return (
                            <div key={panelId} role="listitem">
                                <FAQItem
                                    question={faq.question}
                                    answer={faq.answer}
                                    isOpen={activeIndex === idx}
                                    panelId={panelId}
                                    onToggle={() => handleToggle(idx)}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

FAQSection.defaultProps = {
    heading: '',
    subheading: '',
    faqs: [],
    idPrefix: 'faq',
};

FAQSection.propTypes = {
    /** Section h2 heading text. */
    heading: PropTypes.string,
    /** Supporting paragraph below the heading. */
    subheading: PropTypes.string,
    /** Array of FAQ items (question + answer). */
    faqs: PropTypes.arrayOf(
        PropTypes.shape({
            /** FAQ question text — required. */
            question: PropTypes.string.isRequired,
            /** FAQ answer text — required. */
            answer: PropTypes.string.isRequired,
        })
    ),
    /** Prefix for generated panel IDs. Use unique values when multiple FAQSection instances exist on one page. */
    idPrefix: PropTypes.string,
};

export default FAQSection;
