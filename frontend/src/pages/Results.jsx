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

import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import Container from '../components/layout/Container';
import Section from '../components/layout/Section';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import usePipeline from '../context/usePipeline.js';
import { RESET, SET_ERROR } from '../context/pipelineReducer.js';
import { downloadZIP, fetchPreviewHtml } from '../services/apiClient.js';

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
 * Device widths used by the responsive preview toggle.
 * Values are applied as inline `width` on the preview container.
 * Desktop uses 100% to fill the available column; tablet and mobile use fixed
 * pixel widths that match standard breakpoints.
 *
 * @type {Record<'desktop'|'tablet'|'mobile', string>}
 */
const DEVICE_WIDTHS = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
};

/**
 * CompleteView – shown when `stage === 'complete'`.
 *
 * Renders:
 *  1. "Redesign Complete" heading with success badge.
 *  2. Generated file structure (or static placeholder when absent).
 *  3. Responsive live preview iframe with device toggle and fullscreen support.
 *  4. Action buttons: "Download Source Code" and "Start Over".
 *
 * Preview lifecycle:
 *  - On mount (stage === 'complete'), calls fetchPreviewHtml({generatedOutput}).
 *  - Backend sanitizes and wraps the entry-point file into a static HTML doc.
 *  - Result is placed into a blob URL supplied to the iframe src attribute.
 *  - Object URL is revoked on unmount and whenever the source changes.
 *  - Errors dispatch SET_ERROR and invoke the onError callback.
 *
 * @param {object}   props
 * @param {object|null} props.generatedOutput - The generatedOutput from state.
 * @param {Function} props.onDownload  - Called when Download button is clicked.
 * @param {Function} props.onStartOver - Called when Start Over button is clicked.
 * @param {Function} props.onError     - Called with a structured error if preview fetch fails.
 * @param {boolean}  props.isDownloading - Whether a download is in flight.
 * @returns {JSX.Element}
 */
function CompleteView({ generatedOutput, onDownload, onStartOver, onError, isDownloading }) {
    const fileStructure = generatedOutput?.fileStructure ?? null;

    // ── Device toggle state ────────────────────────────────────────────────
    /** @type {'desktop'|'tablet'|'mobile'} */
    const [deviceMode, setDeviceMode] = useState('desktop');

    // ── Preview blob URL state ─────────────────────────────────────────────
    /** Blob URL for the preview iframe, or null while loading/unavailable. */
    const [previewSrc, setPreviewSrc] = useState(null);

    /**
     * Fetch the preview HTML from the backend, convert to a blob URL,
     * and store it in state. Runs once when generatedOutput is available.
     * Cleans up the previous blob URL before creating a new one.
     *
     * Guard: only runs when generatedOutput is non-null (avoids redundant
     * fetches when the component is rendered without output).
     */
    useEffect(() => {
        if (!generatedOutput) return undefined;

        let objectUrl = null;
        let cancelled = false;

        async function load() {
            try {
                const html = await fetchPreviewHtml({ generatedOutput });
                if (cancelled) return;

                const blob = new Blob([html], { type: 'text/html' });
                objectUrl = URL.createObjectURL(blob);
                setPreviewSrc(objectUrl);
            } catch (err) {
                if (cancelled) return;
                // Surface error to the parent page component which will dispatch
                // SET_ERROR and navigate to /error — matching the download handler pattern.
                const structured =
                    err && typeof err.message === 'string'
                        ? err
                        : { message: 'Preview failed to load.', code: 'PREVIEW_ERROR' };
                onError(structured);
            }
        }

        load();

        return () => {
            // Revoke object URL on unmount or if generatedOutput changes (cleanup).
            cancelled = true;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
        // onError is stable (useCallback in parent); generatedOutput identity is
        // controlled by the reducer and only changes on RESET / SET_GENERATED.
    }, [generatedOutput, onError]);

    // ── Fullscreen support ─────────────────────────────────────────────────
    /** Ref attached to the preview container element for Fullscreen API targeting. */
    const previewContainerRef = useRef(null);

    /**
     * Requests fullscreen on the preview container.
     * Falls back gracefully if the Fullscreen API is unavailable (e.g. some
     * mobile browsers) or if the browser rejects the request.
     */
    function handleFullscreen() {
        const el = previewContainerRef.current;
        if (!el) return;

        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {
                // Ignore errors on exit — no observable state to restore
            });
        } else if (el.requestFullscreen) {
            el.requestFullscreen().catch(() => {
                // Ignore — fallback environments (e.g. embedded WebView) may reject
            });
        }
    }

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
                {/* ── Preview toolbar: device toggles + fullscreen ──── */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-dark-navy">
                        Live Preview
                    </p>

                    <div className="flex items-center gap-2">
                        {/* Device toggle buttons */}
                        {/** @type {Array<{id: 'desktop'|'tablet'|'mobile', label: string}>} */}
                        {[
                            { id: 'desktop', label: 'Desktop' },
                            { id: 'tablet', label: 'Tablet' },
                            { id: 'mobile', label: 'Mobile' },
                        ].map(({ id, label }) => (
                            <button
                                key={id}
                                type="button"
                                id={`preview-device-${id}`}
                                aria-pressed={deviceMode === id}
                                onClick={() => setDeviceMode(id)}
                                className={[
                                    'rounded px-3 py-1 text-xs font-medium transition-colors',
                                    deviceMode === id
                                        ? 'bg-dark-navy text-white'
                                        : 'bg-light-gray text-dark-navy hover:bg-light-gray-dark',
                                ].join(' ')}
                            >
                                {label}
                            </button>
                        ))}

                        {/* Fullscreen toggle */}
                        <button
                            type="button"
                            id="preview-fullscreen-btn"
                            onClick={handleFullscreen}
                            className="rounded px-3 py-1 text-xs font-medium bg-light-gray text-dark-navy hover:bg-light-gray-dark transition-colors"
                        >
                            Open Fullscreen Preview
                        </button>
                    </div>
                </div>

                {/* ── Device-width constrained preview frame ───────── */}
                {/*
                 * Outer wrapper: centers the inner container and clips overflow.
                 * Inner container: width transitions smoothly on device change.
                 * The ref targets the inner container for Fullscreen API.
                 */}
                <div className="overflow-x-auto rounded-card border-2 border-light-gray-dark bg-light-gray">
                    <div
                        ref={previewContainerRef}
                        style={{
                            width: DEVICE_WIDTHS[deviceMode],
                            transition: 'width 0.3s ease',
                            margin: '0 auto',
                            minHeight: '480px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {previewSrc ? (
                            <iframe
                                src={previewSrc}
                                title="Generated site preview"
                                style={{ width: '100%', minHeight: '480px', border: 0, display: 'block' }}
                                sandbox="allow-scripts"
                            />
                        ) : (
                            <p className="text-sm text-dark-navy-light">
                                {generatedOutput
                                    ? 'Loading preview…'
                                    : 'Preview not available in this environment.'}
                            </p>
                        )}
                    </div>
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
    /**
     * Called with a structured error if the preview fetch fails.
     * Parent dispatches SET_ERROR and navigates to /error.
     */
    onError: PropTypes.func.isRequired,
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

    /**
     * Tracks whether the component is still mounted.
     * Prevents calling setIsDownloading(false) after navigate() has unmounted
     * the component (avoids the "can't perform a state update on unmounted
     * component" scenario).
     */
    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

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

            // Anchor must be appended to document.body before .click() is
            // called; otherwise Firefox silently ignores the download.
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reforge-output.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

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
            // Guard: only update local state if still mounted.
            // navigate('/error') above unmounts this component before finally runs.
            if (mountedRef.current) {
                setIsDownloading(false);
            }
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

    // ── Preview error handler ───────────────────────────────────────────────

    /**
     * Called by CompleteView when the preview fetch fails.
     * Mirrors the download error-handling pattern: dispatch SET_ERROR then
     * navigate to /error. Uses useCallback to keep the reference stable
     * (CompleteView's useEffect depends on it via the onError prop).
     *
     * IMPORTANT: must be declared here (before all early returns) to satisfy
     * React's Rules of Hooks — Hooks must be called unconditionally.
     *
     * @type {(err: {message: string, code: string}) => void}
     */
    const handlePreviewError = useCallback(
        (err) => {
            dispatch({
                type: SET_ERROR,
                payload: { error: err },
            });
            navigate('/error');
        },
        [dispatch, navigate]
    );

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
                            onError={handlePreviewError}
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
