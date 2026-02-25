/**
 * @file Results.jsx
 * @description Code generation display and preview/download page.
 *
 * Stage-driven rendering:
 *   idle        → redirect to /generate (guard)
 *   generating  → GeneratingView (spinner + cycling label)
 *   complete    → CompleteView  (file tree, preview iframe, action buttons)
 *
 * Rules enforced:
 *  - No async in render.
 *  - No side effects in reducer.
 *  - All async stays inside event handlers.
 *  - Blob URLs revoked on unmount / data change.
 *  - No new reducer actions.
 *  - No new global state.
 *
 * Rendered at: /results (nested inside AppLayout)
 */

import { useEffect, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import Container from '../components/layout/Container';
import Section from '../components/layout/Section';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import usePipeline from '../context/usePipeline.js';
import { RESET, SET_ERROR } from '../context/pipelineReducer.js';
import { downloadZIP } from '../services/apiClient.js';

// ─── Constants ───────────────────────────────────────────────────────────────

/**
 * Sub-labels that cycle during code generation to give the user feedback.
 * Cycled every LABEL_INTERVAL_MS milliseconds.
 *
 * @type {string[]}
 */
const GENERATING_LABELS = [
    'Assembling Components…',
    'Injecting Templates…',
    'Finalizing Structure…',
];

/** Interval (ms) between label transitions in the generating view. */
const LABEL_INTERVAL_MS = 2000;

// ─── FileStructureNode ────────────────────────────────────────────────────────

/**
 * @typedef {object} FileNode
 * @property {string}      name     - File or directory name.
 * @property {'file'|'directory'} type - Node type.
 * @property {FileNode[]}  [children] - Child nodes (directories only).
 */

/**
 * FileStructureNode – recursively renders a single node (file or directory)
 * from the generated file tree.
 *
 * Defensively guards against malformed backend responses:
 *  - Treats absent / non-array `children` as an empty list.
 *  - Does not crash on unexpected node shapes.
 *
 * @param {object}   props
 * @param {FileNode} props.node  - The file/directory node to render.
 * @param {number}   [props.depth=0] - Nesting depth (controls indentation).
 * @returns {JSX.Element}
 */
function FileStructureNode({ node, depth = 0 }) {
    const isDir = node.type === 'directory';
    const icon = isDir ? '📁' : '📄';
    const children = Array.isArray(node.children) ? node.children : [];

    return (
        <li>
            <span
                className="flex items-center gap-1.5 text-sm text-dark-navy"
                style={{ paddingLeft: `${depth * 16}px` }}
            >
                <span aria-hidden="true">{icon}</span>
                <span>{node.name}</span>
            </span>
            {isDir && children.length > 0 && (
                <ul className="list-none p-0">
                    {children.map((child, idx) => (
                        <FileStructureNode
                            key={`${child.name}-${depth}-${idx}`}
                            node={child}
                            depth={depth + 1}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
}

FileStructureNode.propTypes = {
    /** The file/directory node to render. */
    node: PropTypes.shape({
        name: PropTypes.string.isRequired,
        type: PropTypes.oneOf(['file', 'directory']).isRequired,
        children: PropTypes.array,
    }).isRequired,
    /** Nesting depth for indentation. */
    depth: PropTypes.number,
};

// ─── GeneratingView ───────────────────────────────────────────────────────────

/**
 * GeneratingView – shown while `stage === 'generating'`.
 *
 * Displays a spinner, a heading, and a sub-label that cycles through
 * {@link GENERATING_LABELS} every {@link LABEL_INTERVAL_MS} ms.
 *
 * The interval is started only when `stage === 'generating'` and is always
 * cleared on unmount via the useEffect cleanup.
 *
 * @param {object} props
 * @param {string} props.stage - Current pipeline stage (used to gate interval).
 * @returns {JSX.Element}
 */
function GeneratingView({ stage }) {
    const [labelIndex, setLabelIndex] = useState(0);

    useEffect(() => {
        // Only cycle while actively generating
        if (stage !== 'generating') return undefined;

        const interval = setInterval(() => {
            setLabelIndex((prev) => (prev + 1) % GENERATING_LABELS.length);
        }, LABEL_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [stage]);

    return (
        <div className="flex flex-col items-center gap-6 py-20 text-center">
            <Spinner size="lg" />

            <div>
                <h1 className="mb-2 text-2xl font-bold text-dark-navy sm:text-3xl">
                    Generating Frontend Code…
                </h1>
                <p className="text-sm text-dark-navy-light">
                    {GENERATING_LABELS[labelIndex]}
                </p>
            </div>
        </div>
    );
}

GeneratingView.propTypes = {
    /** Current pipeline stage — used to gate the cycling interval. */
    stage: PropTypes.string.isRequired,
};

// ─── CompleteView ─────────────────────────────────────────────────────────────

/**
 * CompleteView – shown when `stage === 'complete'`.
 *
 * Renders:
 *  1. "Redesign Complete" heading with success badge.
 *  2. Generated file structure (or static placeholder when absent).
 *  3. Live preview iframe (or placeholder text when no previewHtml).
 *  4. Action buttons: "Download Source Code" and "Start Over".
 *
 * @param {object}   props
 * @param {object|null} props.generatedOutput - The generatedOutput from state.
 * @param {Function} props.onDownload  - Called when Download button is clicked.
 * @param {Function} props.onStartOver - Called when Start Over button is clicked.
 * @param {boolean}  props.isDownloading - Whether a download is in flight.
 * @returns {JSX.Element}
 */
function CompleteView({ generatedOutput, onDownload, onStartOver, isDownloading }) {
    const fileStructure = generatedOutput?.fileStructure ?? null;
    const previewHtml = generatedOutput?.previewHtml ?? null;

    // ── Blob lifecycle for preview iframe ─────────────────────────────────
    // Derived synchronously to satisfy the react-hooks/set-state-in-effect lint rule.
    const iframeSrc = useMemo(() => {
        if (!previewHtml) return null;
        try {
            const blob = new Blob([previewHtml], { type: 'text/html' });
            return URL.createObjectURL(blob);
        } catch {
            // ReForge codebase is strictly warning-free; suppress logging here
            return null;
        }
    }, [previewHtml]);

    useEffect(() => {
        // Revoke the object URL on unmount or when previewHtml changes
        return () => {
            if (iframeSrc) {
                URL.revokeObjectURL(iframeSrc);
            }
        };
    }, [iframeSrc]);

    // ── Static placeholder nodes (shown when fileStructure is null) ────────
    /** @type {FileNode} */
    const PLACEHOLDER_TREE = {
        name: 'src',
        type: 'directory',
        children: [
            { name: 'components', type: 'directory', children: [] },
            { name: 'pages', type: 'directory', children: [] },
            { name: 'App.jsx', type: 'file' },
            { name: 'main.jsx', type: 'file' },
        ],
    };

    return (
        <>
            {/* ── Success heading ─────────────────────────────────────── */}
            <div className="flex flex-col items-center gap-4 text-center">
                <span
                    aria-hidden="true"
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-status-success/10"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-10 w-10 text-status-success"
                        aria-hidden="true"
                        focusable="false"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="9 12 11 14 15 10" />
                    </svg>
                </span>

                <h1 className="text-3xl font-bold text-dark-navy sm:text-4xl">
                    Redesign Complete
                </h1>

                <p className="max-w-prose text-base text-dark-navy-light">
                    Your React codebase has been generated. Preview it below or
                    download the ZIP to get started.
                </p>
            </div>

            {/* ── File Structure ──────────────────────────────────────── */}
            <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-dark-navy">
                    Generated File Structure
                </p>

                <div className="rounded-card border border-light-gray-dark bg-white p-4 shadow-card">
                    <ul className="list-none p-0">
                        {fileStructure ? (
                            <FileStructureNode node={fileStructure} depth={0} />
                        ) : (
                            <FileStructureNode node={PLACEHOLDER_TREE} depth={0} />
                        )}
                    </ul>
                </div>
            </div>

            {/* ── Live Preview ─────────────────────────────────────────── */}
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
                    {iframeSrc ? (
                        <iframe
                            src={iframeSrc}
                            title="Generated site preview"
                            className="h-full w-full min-h-[480px] border-0"
                            sandbox="allow-scripts"
                        />
                    ) : (
                        <p className="text-sm text-dark-navy-light">
                            Preview not available in this environment.
                        </p>
                    )}
                </div>
            </div>

            {/* ── Action Buttons ───────────────────────────────────────── */}
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Button
                    type="button"
                    variant="primary"
                    className="w-full sm:w-auto px-8"
                    disabled={isDownloading}
                    onClick={onDownload}
                >
                    {isDownloading ? 'Downloading…' : 'Download Source Code'}
                </Button>

                <Button
                    type="button"
                    variant="secondary"
                    className="w-full sm:w-auto px-8"
                    disabled={isDownloading}
                    onClick={onStartOver}
                >
                    Start Over
                </Button>
            </div>
        </>
    );
}

CompleteView.propTypes = {
    /** Resolved generated output from the pipeline state. */
    generatedOutput: PropTypes.object,
    /** Handler for the "Download Source Code" button. */
    onDownload: PropTypes.func.isRequired,
    /** Handler for the "Start Over" button. */
    onStartOver: PropTypes.func.isRequired,
    /** True while a download request is in flight — disables both buttons. */
    isDownloading: PropTypes.bool.isRequired,
};

// ─── Page Component ────────────────────────────────────────────────────────

/**
 * Results – stage-driven code generation display page.
 *
 * Rendering rules:
 *   stage === 'idle'       → redirect to /generate  (stale-state guard)
 *   stage === 'generating' → GeneratingView  (spinner + cycling label)
 *   stage === 'complete'   → CompleteView    (file tree + preview + actions)
 *   stage === anything else (error, etc.) → nothing; let routing handle it
 *
 * Event handlers:
 *   handleDownload  – calls downloadZIP, triggers browser file-save, error-routes on failure.
 *   handleStartOver – dispatches RESET, navigates to /generate.
 *
 * @returns {JSX.Element|null}
 */
function Results() {
    const { state, dispatch } = usePipeline();
    const navigate = useNavigate();

    const { stage, generatedOutput } = state;

    /** True while a ZIP download request is in flight. */
    const [isDownloading, setIsDownloading] = useState(false);

    // ── Idle guard ─────────────────────────────────────────────────────────
    // Prevents invalid deep-links: /results visited without preceding state.
    useEffect(() => {
        if (stage === 'idle') {
            navigate('/generate', { replace: true });
        }
    }, [stage, navigate]);

    // ── Download handler ───────────────────────────────────────────────────

    /**
     * Packages the generatedOutput into a ZIP archive via the API and triggers
     * a browser file download. All async work is confined to this handler.
     *
     * @returns {Promise<void>}
     */
    async function handleDownload() {
        // Safety guard: do nothing if output is unexpectedly absent
        if (!generatedOutput) return;
        if (isDownloading) return;

        setIsDownloading(true);

        try {
            const blobData = await downloadZIP({ generatedOutput });

            const blob = new Blob([blobData], { type: 'application/zip' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'reforge-output.zip';
            a.click();
            a.remove();

            URL.revokeObjectURL(url);
        } catch (err) {
            const structured =
                err && typeof err.message === 'string'
                    ? err
                    : { message: 'An unexpected error occurred.', code: 'UNKNOWN_ERROR' };

            dispatch({
                type: SET_ERROR,
                payload: { error: structured },
            });

            navigate('/error');
        } finally {
            setIsDownloading(false);
        }
    }

    // ── Start Over handler ─────────────────────────────────────────────────

    /**
     * Fully resets the pipeline state and returns to the start of the flow.
     */
    function handleStartOver() {
        dispatch({ type: RESET });
        navigate('/generate');
    }

    // ── Stage-gated rendering ──────────────────────────────────────────────

    if (stage === 'generating') {
        return (
            <Section>
                <Container>
                    <div className="mx-auto max-w-3xl flex flex-col gap-10">
                        <GeneratingView stage={stage} />
                    </div>
                </Container>
            </Section>
        );
    }

    if (stage === 'complete') {
        return (
            <Section>
                <Container>
                    <div className="mx-auto max-w-3xl flex flex-col gap-10">
                        <CompleteView
                            generatedOutput={generatedOutput}
                            onDownload={handleDownload}
                            onStartOver={handleStartOver}
                            isDownloading={isDownloading}
                        />
                    </div>
                </Container>
            </Section>
        );
    }

    // For idle (guarded by effect above) and any transient states, render nothing.
    return null;
}

Results.propTypes = {};

export default Results;
