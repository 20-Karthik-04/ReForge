/**
 * @fileoverview AppGenerator — Phase 8.5–8.7 Deterministic Code Generation (JSX + File Output).
 *
 * Consumes a fully validated render plan (output of `buildRenderPlan`) and produces
 * a deterministic `App.jsx` file. No validation logic lives here — the render plan
 * is assumed to be correct and frozen by the time these functions are called.
 *
 * Phases implemented here:
 *  - 8.5  Import statement generation
 *  - 8.6  JSX string generation + App.jsx assembly
 *  - 8.7  Deterministic project file output
 *
 * Determinism guarantees:
 *  - Imports are alphabetically sorted by component name.
 *  - JSX sections are rendered strictly in render plan order.
 *  - Props keys are sorted alphabetically before serialization (insertion-order independence).
 *  - Props are serialized via `JSON.stringify` — no manual string formatting.
 *  - All newlines are explicitly `\n` (cross-OS safety — never `\r\n`).
 *  - No randomness, no timestamps, no environment-dependent behavior.
 *  - Identical render plan → identical file content, always.
 *
 * @module backend/modules/AppGenerator
 */

import fs from 'fs';
import path from 'path';

// =============================================================================
// 8.5 — Import Statement Generation
// =============================================================================

/**
 * Generates a deterministic block of ES module import statements from a render plan.
 *
 * Rules:
 *  - One import per unique `componentName` (deduplication guaranteed).
 *  - Alphabetical ordering by component name (stable across runs).
 *  - All imports are named exports from `'./templates'`.
 *  - No React import — modern Vite JSX transform does not require it.
 *
 * @param {import('./CodeGenerator.js').RenderPlanItem[]} renderPlan
 *   The validated render plan array produced by `buildRenderPlan`.
 * @returns {string} A newline-separated string of import statements.
 *
 * @example
 * generateImports([
 *   { componentName: 'HeroSection', ... },
 *   { componentName: 'FeaturesSection', ... },
 * ]);
 * // =>
 * // "import { FeaturesSection } from './templates';\nimport { HeroSection } from './templates';"
 */
export function generateImports(renderPlan) {
    // Collect unique component names, then sort alphabetically for determinism.
    const uniqueNames = [...new Set(renderPlan.map((item) => item.componentName))].sort();

    return uniqueNames
        .map((name) => `import { ${name} } from './templates';`)
        .join('\n');
}

// =============================================================================
// 8.6 — JSX Section Rendering
// =============================================================================

/**
 * Generates JSX lines for each section in the render plan.
 *
 * Each section renders as a self-closing JSX element using the spread pattern:
 *
 * ```jsx
 * <ComponentName
 *   variant="split"
 *   {...{
 *     headline: "Hello",
 *     features: [...]
 *   }}
 * />
 * ```
 *
 * Why the spread-with-serialized-object pattern?
 *  - Avoids manual key-by-key string formatting and escaping bugs.
 *  - Handles nested objects, arrays, and special characters safely.
 *  - `JSON.stringify` is the single source of truth for value serialization.
 *  - Guarantees no formatting drift between runs.
 *
 * Sections are rendered strictly in render plan order.
 *
 * @param {import('./CodeGenerator.js').RenderPlanItem[]} renderPlan
 *   The validated render plan array produced by `buildRenderPlan`.
 * @returns {string[]} An array of JSX element strings, one per section.
 *   Each string contains leading whitespace for the 4-space indentation level
 *   expected inside a `<>...</>` Fragment block.
 *
 * @example
 * generateJSX([{ componentName: 'HeroSection', variant: 'split', props: { headline: 'Hi' }, sectionType: 'hero' }]);
 * // => [
 * //   "      <HeroSection\n        variant=\"split\"\n        {...{\n          \"headline\": \"Hi\"\n        }}\n      />"
 * // ]
 */
export function generateJSX(renderPlan) {
    return renderPlan.map(({ componentName, variant, props }) => {
        // ── Sort props keys alphabetically before serialization ──────────────
        // JSON.stringify preserves insertion order, which can differ between AI
        // plan runs. Sorting keys here guarantees identical output regardless of
        // how the upstream plan was constructed.
        const sortedProps = Object.fromEntries(
            Object.entries(props).sort(([a], [b]) => a.localeCompare(b))
        );

        // ── Serialize and normalize newlines ─────────────────────────────────
        // JSON.stringify always produces \n on all platforms (ECMAScript spec),
        // but .replace ensures safety if the props object contains embedded \r\n.
        const rawJson = JSON.stringify(sortedProps, null, 2).replace(/\r\n/g, '\n');

        // Indent continuation lines by 10 spaces so they sit flush inside the
        // 6-space-indented `{...{ ... }}` block.
        const serializedProps = rawJson
            .split('\n')
            .map((line, idx) => (idx === 0 ? line : `          ${line}`))
            .join('\n');

        return (
            `      <${componentName}\n` +
            `        variant="${variant}"\n` +
            `        {...${serializedProps}}\n` +
            `      />`
        );
    });
}

// =============================================================================
// 8.7 — App.jsx Assembly
// =============================================================================

/**
 * Assembles a complete, deterministic `App.jsx` file content string.
 *
 * Output shape:
 * ```jsx
 * import { ComponentA } from './templates';
 * import { ComponentB } from './templates';
 *
 * function App() {
 *   return (
 *     <>
 *       <ComponentA
 *         variant="split"
 *         {...{
 *           "headline": "Hello"
 *         }}
 *       />
 *       <ComponentB
 *         variant="grid3"
 *         {...{
 *           "heading": "Features",
 *           "features": [...]
 *         }}
 *       />
 *     </>
 *   );
 * }
 *
 * export default App;
 * ```
 *
 * Determinism guarantees:
 *  - Import order is alphabetical.
 *  - Section order exactly matches render plan order.
 *  - Props are JSON-serialized — no hand-formatted values.
 *  - Indentation is fixed (2 spaces for JSX, 4 spaces for return body).
 *  - No trailing whitespace, no blank lines inside JSX body.
 *  - Final newline is always present (POSIX convention).
 *
 * @param {import('./CodeGenerator.js').RenderPlanItem[]} renderPlan
 *   The validated render plan array produced by `buildRenderPlan`.
 * @returns {string} The complete file content for `App.jsx`.
 */
export function generateAppComponent(renderPlan) {
    const imports = generateImports(renderPlan);
    const jsxSections = generateJSX(renderPlan).join('\n');

    return (
        `${imports}\n` +
        `\n` +
        `function App() {\n` +
        `  return (\n` +
        `    <>\n` +
        `${jsxSections}\n` +
        `    </>\n` +
        `  );\n` +
        `}\n` +
        `\n` +
        `export default App;\n`
    );
}

// =============================================================================
// 8.7 — Deterministic Project File Output
// =============================================================================

/**
 * Writes the generated `App.jsx` to `<outputDir>/src/App.jsx`.
 *
 * Behaviour:
 *  - Creates `<outputDir>/src/` if it does not exist (recursive mkdir).
 *  - Writes only `App.jsx`. No other files are written or deleted.
 *  - Overwrites any existing `App.jsx` at that path (idempotent by design —
 *    the same render plan always produces the same content).
 *  - Does not touch templates, Tailwind config, or any other existing files.
 *  - Does not recursively clear or enumerate the output directory.
 *
 * @param {import('./CodeGenerator.js').RenderPlanItem[]} renderPlan
 *   The validated render plan array produced by `buildRenderPlan`.
 * @param {string} outputDir
 *   Absolute path to the root output directory (the project root where `src/`
 *   should live). For the ReForge frontend this would be `frontend/`.
 * @returns {void}
 *
 * @example
 * writeProjectFiles(renderPlan, path.resolve('frontend'));
 * // Writes to: frontend/src/App.jsx
 */
export function writeProjectFiles(renderPlan, outputDir) {
    const srcDir = path.join(outputDir, 'src');
    const appJsxPath = path.join(srcDir, 'App.jsx');
    const content = generateAppComponent(renderPlan);

    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(appJsxPath, content, 'utf8');
}
