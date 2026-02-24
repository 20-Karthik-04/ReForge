/**
 * @file Home.jsx
 * @description ReForge landing page. Presents the product value proposition,
 * a three-step how-it-works section, a benefits summary, and a bottom CTA.
 * Fully token-based styling. No API calls. No state management.
 */

import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Container from '../components/layout/Container';
import Section from '../components/layout/Section';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

// ─── Static content ────────────────────────────────────────────────────────

/** How It Works — three sequential steps. */
const HOW_IT_WORKS_STEPS = [
    {
        id: 'step-analyze',
        step: '01',
        icon: (
            <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                aria-hidden="true"
                focusable="false"
            >
                <circle cx="20" cy="20" r="20" fill="#EBF4FF" />
                <path
                    d="M13 20a7 7 0 1 1 14 0 7 7 0 0 1-14 0z"
                    stroke="#4A90E2"
                    strokeWidth="2"
                />
                <path
                    d="M25 25l4 4"
                    stroke="#4A90E2"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            </svg>
        ),
        title: 'Analyze Your Website',
        description:
            "Paste your target URL. ReForge crawls the page, extracts its structure, and identifies UX, accessibility, and layout issues — without touching a single line of your code.",
    },
    {
        id: 'step-plan',
        step: '02',
        icon: (
            <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                aria-hidden="true"
                focusable="false"
            >
                <circle cx="20" cy="20" r="20" fill="#F5F0FF" />
                <rect x="12" y="13" width="16" height="3" rx="1.5" fill="#7C3AED" />
                <rect x="12" y="19" width="11" height="3" rx="1.5" fill="#7C3AED" opacity="0.6" />
                <rect x="12" y="25" width="8" height="3" rx="1.5" fill="#7C3AED" opacity="0.3" />
            </svg>
        ),
        title: 'AI Plans the Redesign',
        description:
            "A structured AI prompt — never raw HTML — receives a sanitized analysis and your redesign goals. The AI returns a high-level plan: section ordering, layout variants, and content emphasis.",
    },
    {
        id: 'step-generate',
        step: '03',
        icon: (
            <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                aria-hidden="true"
                focusable="false"
            >
                <circle cx="20" cy="20" r="20" fill="#ECFDF5" />
                <path
                    d="M15 20l3.5 3.5L25 16"
                    stroke="#16A34A"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        ),
        title: 'Generate Production Code',
        description:
            "The AI plan is fed into a deterministic code generator. The same input always produces the same output — clean React components with Tailwind CSS, ready to download and deploy.",
    },
];

/** Benefits cards — product differentiators. */
const BENEFITS = [
    {
        id: 'benefit-ai-planning',
        icon: (
            <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                aria-hidden="true"
                focusable="false"
            >
                <rect width="32" height="32" rx="8" fill="#4A90E2" />
                <circle cx="16" cy="13" r="4" fill="white" />
                <path
                    d="M9 24c0-3.866 3.134-7 7-7s7 3.134 7 7"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            </svg>
        ),
        title: 'AI-Assisted Planning',
        description:
            "AI operates strictly at the planning layer. It recommends section ordering and layout variants — it never writes JSX or CSS. You stay in full control of what gets generated.",
    },
    {
        id: 'benefit-deterministic',
        icon: (
            <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                aria-hidden="true"
                focusable="false"
            >
                <rect width="32" height="32" rx="8" fill="#7C3AED" />
                <path
                    d="M10 16l4 4 8-8"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        ),
        title: 'Deterministic Code Output',
        description:
            "The same analysis and goals always produce identical code. No randomness, no surprises. Every generated file is clean, readable, and auditable by your team.",
    },
    {
        id: 'benefit-deploy',
        icon: (
            <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                aria-hidden="true"
                focusable="false"
            >
                <rect width="32" height="32" rx="8" fill="#16A34A" />
                <path
                    d="M16 22V12M12 16l4-4 4 4"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        ),
        title: 'Ready-to-Deploy React Code',
        description:
            "The output is a downloadable ZIP containing a complete React + Tailwind CSS project. Open in your editor, run npm install, and you have a modern landing page ready to ship.",
    },
];

// ─── Section Components ────────────────────────────────────────────────────

/**
 * HeroSection – full-width opening section with headline, subheadline,
 * primary and secondary CTAs, and trust indicators.
 *
 * @returns {JSX.Element}
 */
function HeroSection() {
    return (
        <Section
            className="bg-gradient-to-br from-light-gray to-white"
            as="div"
        >
            <Container>
                <div className="flex flex-col items-center text-center">
                    {/* Eyebrow badge */}
                    <span className="mb-6 inline-flex items-center gap-2 rounded-badge border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="currentColor"
                            aria-hidden="true"
                            focusable="false"
                        >
                            <path d="M7 0l1.545 4.755H13.5L9.228 7.69l1.545 4.755L7 9.51l-3.773 2.935L4.772 7.69.5 4.755h4.955z" />
                        </svg>
                        AI-Powered Website Redesign
                    </span>

                    {/* Headline */}
                    <h1 className="mb-6 max-w-3xl text-4xl font-bold leading-tight text-dark-navy sm:text-5xl lg:text-6xl">
                        Redesign Any Website with{' '}
                        <span className="bg-gradient-to-r from-primary to-accent-purple bg-clip-text text-transparent">
                            AI-Powered Intelligence
                        </span>
                    </h1>

                    {/* Subheadline */}
                    <p className="mb-10 max-w-2xl text-lg text-dark-navy-light sm:text-xl">
                        Paste a URL. Pick your goals. Get clean, modern React&nbsp;+&nbsp;Tailwind
                        code — generated deterministically in seconds. No templates. No guesswork.
                    </p>

                    {/* CTA pair */}
                    <div className="flex flex-col items-center gap-4 sm:flex-row">
                        <Link to="/generate">
                            <Button variant="primary" className="px-8 py-3 text-base">
                                Start Redesigning
                            </Button>
                        </Link>
                        <a href="#how-it-works">
                            <Button variant="secondary" className="px-8 py-3 text-base">
                                See How It Works
                            </Button>
                        </a>
                    </div>

                    {/* Trust indicators */}
                    <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-dark-navy-light">
                        <span className="flex items-center gap-1.5">
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                aria-hidden="true"
                                focusable="false"
                            >
                                <path
                                    d="M13 5l-6 6-3-3"
                                    stroke="#16A34A"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            No credit card required
                        </span>
                        <span className="flex items-center gap-1.5">
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                aria-hidden="true"
                                focusable="false"
                            >
                                <path
                                    d="M13 5l-6 6-3-3"
                                    stroke="#16A34A"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            AI never writes raw code
                        </span>
                        <span className="flex items-center gap-1.5">
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                aria-hidden="true"
                                focusable="false"
                            >
                                <path
                                    d="M13 5l-6 6-3-3"
                                    stroke="#16A34A"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            Download-ready ZIP output
                        </span>
                    </div>
                </div>
            </Container>
        </Section>
    );
}

HeroSection.propTypes = {};

/**
 * HowItWorksSection – three numbered step cards explaining the core pipeline.
 *
 * @returns {JSX.Element}
 */
function HowItWorksSection() {
    return (
        <Section id="how-it-works" className="bg-white">
            <Container>
                {/* Section heading */}
                <div className="mb-12 text-center">
                    <h2 className="mb-4 text-3xl font-bold text-dark-navy sm:text-4xl">
                        From URL to Modern React — in Three Steps
                    </h2>
                    <p className="mx-auto max-w-2xl text-base text-dark-navy-light sm:text-lg">
                        ReForge separates AI reasoning from code execution. AI plans.
                        Deterministic software generates. You get predictable, high-quality output every time.
                    </p>
                </div>

                {/* Step cards */}
                <div className="grid gap-8 md:grid-cols-3">
                    {HOW_IT_WORKS_STEPS.map((step) => (
                        <Card key={step.id} className="relative flex flex-col gap-5 p-8">
                            {/* Step number badge */}
                            <span
                                className="absolute right-6 top-6 text-4xl font-black text-light-gray-dark"
                                aria-hidden="true"
                            >
                                {step.step}
                            </span>

                            {/* Icon */}
                            <div>{step.icon}</div>

                            {/* Content */}
                            <div>
                                <h3 className="mb-2 text-lg font-semibold text-dark-navy">
                                    {step.title}
                                </h3>
                                <p className="text-sm leading-relaxed text-dark-navy-light">
                                    {step.description}
                                </p>
                            </div>
                        </Card>
                    ))}
                </div>
            </Container>
        </Section>
    );
}

HowItWorksSection.propTypes = {};

/**
 * BenefitsSection – three benefit cards on a light-gray background.
 *
 * @returns {JSX.Element}
 */
function BenefitsSection() {
    return (
        <Section className="bg-light-gray">
            <Container>
                {/* Section heading */}
                <div className="mb-12 text-center">
                    <h2 className="mb-4 text-3xl font-bold text-dark-navy sm:text-4xl">
                        Why ReForge?
                    </h2>
                    <p className="mx-auto max-w-xl text-base text-dark-navy-light">
                        Purpose-built for engineers and developers who want reliable,
                        maintainable frontend output — not unpredictable AI-generated spaghetti.
                    </p>
                </div>

                {/* Benefit cards */}
                <div className="grid gap-8 md:grid-cols-3">
                    {BENEFITS.map((benefit) => (
                        <Card key={benefit.id} className="flex flex-col gap-5 bg-white p-8">
                            {/* Icon */}
                            <div>{benefit.icon}</div>

                            {/* Content */}
                            <div>
                                <h3 className="mb-2 text-lg font-semibold text-dark-navy">
                                    {benefit.title}
                                </h3>
                                <p className="text-sm leading-relaxed text-dark-navy-light">
                                    {benefit.description}
                                </p>
                            </div>
                        </Card>
                    ))}
                </div>
            </Container>
        </Section>
    );
}

BenefitsSection.propTypes = {};

/**
 * BottomCtaSection – full-width gradient CTA block at the bottom of the page.
 *
 * @returns {JSX.Element}
 */
function BottomCtaSection() {
    return (
        <Section
            className="bg-gradient-to-r from-primary to-accent-purple"
            as="div"
        >
            <Container>
                <div className="flex flex-col items-center gap-8 text-center">
                    <div>
                        <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
                            Ready to Transform Your Website?
                        </h2>
                        <p className="mx-auto max-w-xl text-base text-white/80 sm:text-lg">
                            Stop manually rewriting outdated frontends. Let ReForge analyze,
                            plan, and generate modern React code — deterministically.
                        </p>
                    </div>
                    <Link to="/generate">
                        <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-button bg-white px-8 py-3 text-base font-semibold text-primary shadow-button transition-all duration-200 hover:bg-light-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
                        >
                            Get Started Free
                        </button>
                    </Link>
                </div>
            </Container>
        </Section>
    );
}

BottomCtaSection.propTypes = {};

// ─── Page Component ────────────────────────────────────────────────────────

/**
 * Home – ReForge landing page.
 *
 * Composes the Hero, How It Works, Benefits, and Bottom CTA sections.
 * No API calls. No state. No side effects.
 *
 * @returns {JSX.Element}
 */
function Home() {
    return (
        <>
            <HeroSection />
            <HowItWorksSection />
            <BenefitsSection />
            <BottomCtaSection />
        </>
    );
}

Home.propTypes = {};

export default Home;
