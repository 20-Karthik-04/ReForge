/**
 * @fileoverview Test suite for Phase 8.5–8.7 (JSX Generation + File Output).
 *
 * Tests cover:
 *  - 8.5 Import statement generation (count, deduplication, alphabetical order)
 *  - 8.6 JSX section rendering (order, variant presence, props spread)
 *  - 8.7 App.jsx assembly (structure, export, determinism)
 *  - writeProjectFiles writes only src/App.jsx (no destructive operations)
 *
 * Run with:  node backend/test-phase8-5.js
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { generateImports, generateJSX, generateAppComponent, writeProjectFiles } from './modules/AppGenerator.js';

// ─────────────────────────────────────────────────────────────────────────────
// Test harness (same pattern as test-phase8.js)
// ─────────────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

/**
 * Asserts that `fn()` throws an error whose message includes `expectedFragment`.
 */
function assertThrows(label, fn, expectedFragment) {
    try {
        fn();
        console.error(`  ✗ FAIL [${label}]: Expected error containing "${expectedFragment}" but no error was thrown.`);
        failed++;
    } catch (err) {
        if (err.message.includes(expectedFragment)) {
            console.log(`  ✓ PASS [${label}]`);
            passed++;
        } else {
            console.error(
                `  ✗ FAIL [${label}]: Error thrown but message did not contain "${expectedFragment}".\n` +
                `    Actual message: ${err.message}`
            );
            failed++;
        }
    }
}

/**
 * Asserts that `fn()` does NOT throw and its return value satisfies `checkFn`.
 */
function assertOk(label, fn, checkFn) {
    try {
        const result = fn();
        if (!checkFn || checkFn(result)) {
            console.log(`  ✓ PASS [${label}]`);
            passed++;
        } else {
            console.error(`  ✗ FAIL [${label}]: Return value did not satisfy assertion. Got: ${JSON.stringify(result)}`);
            failed++;
        }
    } catch (err) {
        console.error(`  ✗ FAIL [${label}]: Unexpected error: ${err.message}`);
        failed++;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared test fixtures
// ─────────────────────────────────────────────────────────────────────────────

/** Minimal render plan with 3 sections (hero, features, footer). */
function makeRenderPlan() {
    return [
        {
            sectionType: 'hero',
            componentName: 'HeroSection',
            variant: 'split',
            props: { headline: 'Welcome to ReForge', subheadline: 'Build faster.' },
        },
        {
            sectionType: 'features',
            componentName: 'FeaturesSection',
            variant: 'grid3',
            props: { heading: 'Key Features', features: [{ icon: '⚡', title: 'Fast', description: 'Yes.' }] },
        },
        {
            sectionType: 'footer',
            componentName: 'Footer',
            variant: 'default',
            props: { logoText: 'ReForge', linkGroups: [] },
        },
    ];
}

/** Render plan with a single section. */
function makeSingleSectionPlan() {
    return [
        {
            sectionType: 'hero',
            componentName: 'HeroSection',
            variant: 'centered',
            props: { headline: 'Solo Hero' },
        },
    ];
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. generateImports
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── Phase 8.5: generateImports ──');

assertOk(
    'produces one import line per unique component',
    () => generateImports(makeRenderPlan()).split('\n'),
    (lines) => lines.length === 3
);

assertOk(
    'each line is a valid named import from ./templates',
    () => generateImports(makeRenderPlan()).split('\n'),
    (lines) => lines.every((ln) => /^import \{ \w+ \} from '\.\/templates';$/.test(ln))
);

assertOk(
    'imports are alphabetically sorted (FeaturesSection < Footer < HeroSection)',
    () => generateImports(makeRenderPlan()).split('\n'),
    (lines) => {
        const names = lines.map((ln) => ln.match(/\{ (\w+) \}/)[1]);
        return (
            names[0] === 'FeaturesSection' &&
            names[1] === 'Footer' &&
            names[2] === 'HeroSection'
        );
    }
);

assertOk(
    'duplicate componentName entries produce only one import',
    () => {
        // Two sections sharing the same componentName (unusual but must be handled).
        const planWithDup = [
            { sectionType: 'hero', componentName: 'HeroSection', variant: 'split', props: { headline: 'A' } },
            { sectionType: 'hero2', componentName: 'HeroSection', variant: 'centered', props: { headline: 'B' } },
        ];
        return generateImports(planWithDup).split('\n');
    },
    (lines) => lines.length === 1 && lines[0].includes('HeroSection')
);

assertOk(
    'single-section plan produces exactly one import',
    () => generateImports(makeSingleSectionPlan()).split('\n'),
    (lines) => lines.length === 1
);

assertOk(
    'no React import is generated',
    () => generateImports(makeRenderPlan()),
    (imports) => !imports.includes("import React") && !imports.includes("from 'react'")
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. generateJSX
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── Phase 8.6: generateJSX ──');

assertOk(
    'returns one JSX string per section',
    () => generateJSX(makeRenderPlan()),
    (lines) => Array.isArray(lines) && lines.length === 3
);

assertOk(
    'first JSX element contains HeroSection',
    () => generateJSX(makeRenderPlan()),
    (lines) => lines[0].includes('HeroSection')
);

assertOk(
    'sections appear in strict render plan order',
    () => generateJSX(makeRenderPlan()),
    (lines) => {
        return (
            lines[0].includes('HeroSection') &&
            lines[1].includes('FeaturesSection') &&
            lines[2].includes('Footer')
        );
    }
);

assertOk(
    'each JSX line includes the variant prop',
    () => generateJSX(makeRenderPlan()),
    (lines) => {
        const plan = makeRenderPlan();
        return lines.every((line, i) => line.includes(`variant="${plan[i].variant}"`));
    }
);

assertOk(
    'props are emitted via spread pattern {...{...}}',
    () => generateJSX(makeRenderPlan()),
    (lines) => lines.every((line) => line.includes('{...{'))
);

assertOk(
    'hero JSX contains serialized headline string',
    () => generateJSX(makeRenderPlan()),
    (lines) => lines[0].includes('"headline"') && lines[0].includes('"Welcome to ReForge"')
);

assertOk(
    'features JSX contains serialized array for features',
    () => generateJSX(makeRenderPlan()),
    (lines) => lines[1].includes('"features"') && lines[1].includes('"Fast"')
);

assertOk(
    'each JSX element is self-closing (ends with />)',
    () => generateJSX(makeRenderPlan()),
    (lines) => lines.every((line) => line.trimEnd().endsWith('/>'))
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. generateAppComponent
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── Phase 8.7: generateAppComponent ──');

assertOk(
    'output contains function App() declaration',
    () => generateAppComponent(makeRenderPlan()),
    (src) => src.includes('function App()')
);

assertOk(
    'output contains export default App',
    () => generateAppComponent(makeRenderPlan()),
    (src) => src.includes('export default App;')
);

assertOk(
    'output contains Fragment root <> and </>',
    () => generateAppComponent(makeRenderPlan()),
    (src) => src.includes('<>') && src.includes('</>')
);

assertOk(
    'output includes import block at top',
    () => generateAppComponent(makeRenderPlan()),
    (src) => src.startsWith("import {")
);

assertOk(
    'output does not import React',
    () => generateAppComponent(makeRenderPlan()),
    (src) => !src.includes("import React") && !src.includes("from 'react'")
);

assertOk(
    'all three component names present in output',
    () => generateAppComponent(makeRenderPlan()),
    (src) =>
        src.includes('HeroSection') &&
        src.includes('FeaturesSection') &&
        src.includes('Footer')
);

assertOk(
    'output ends with a final newline',
    () => generateAppComponent(makeRenderPlan()),
    (src) => src.endsWith('\n')
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. Determinism
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── Phase 8.7: Determinism ──');

assertOk(
    'generateImports: identical inputs produce identical output',
    () => generateImports(makeRenderPlan()) === generateImports(makeRenderPlan()),
    Boolean
);

assertOk(
    'generateJSX: identical inputs produce identical output',
    () => {
        const a = generateJSX(makeRenderPlan()).join('\n');
        const b = generateJSX(makeRenderPlan()).join('\n');
        return a === b;
    },
    Boolean
);

assertOk(
    'generateAppComponent: identical inputs produce identical output',
    () => {
        const a = generateAppComponent(makeRenderPlan());
        const b = generateAppComponent(makeRenderPlan());
        return a === b;
    },
    Boolean
);

assertOk(
    'generateAppComponent: different plan order → different output',
    () => {
        const planA = makeRenderPlan();           // hero, features, footer
        const planB = [...makeRenderPlan()].reverse();  // footer, features, hero
        return generateAppComponent(planA) !== generateAppComponent(planB);
    },
    Boolean
);

// ─────────────────────────────────────────────────────────────────────────────
// 5. writeProjectFiles
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── Phase 8.7: writeProjectFiles ──');

assertOk(
    'creates src/App.jsx in the output directory',
    () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reforge-test-'));
        writeProjectFiles(makeRenderPlan(), tmpDir);
        const appPath = path.join(tmpDir, 'src', 'App.jsx');
        const exists = fs.existsSync(appPath);
        // Cleanup
        fs.rmSync(tmpDir, { recursive: true, force: true });
        return exists;
    },
    Boolean
);

assertOk(
    'App.jsx content matches generateAppComponent output',
    () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reforge-test-'));
        const plan = makeRenderPlan();
        writeProjectFiles(plan, tmpDir);
        const written = fs.readFileSync(path.join(tmpDir, 'src', 'App.jsx'), 'utf8');
        const expected = generateAppComponent(plan);
        fs.rmSync(tmpDir, { recursive: true, force: true });
        return written === expected;
    },
    Boolean
);

assertOk(
    'only src/App.jsx is created — no extra files written',
    () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reforge-test-'));
        writeProjectFiles(makeRenderPlan(), tmpDir);
        // Enumerate all files created inside tmpDir
        const files = [];
        function walk(dir) {
            for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
                const full = path.join(dir, entry.name);
                if (entry.isDirectory()) walk(full);
                else files.push(path.relative(tmpDir, full));
            }
        }
        walk(tmpDir);
        fs.rmSync(tmpDir, { recursive: true, force: true });
        return files.length === 1 && files[0] === path.join('src', 'App.jsx');
    },
    Boolean
);

assertOk(
    'writeProjectFiles is idempotent: calling twice produces the same file',
    () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reforge-test-'));
        const plan = makeRenderPlan();
        writeProjectFiles(plan, tmpDir);
        const first = fs.readFileSync(path.join(tmpDir, 'src', 'App.jsx'), 'utf8');
        writeProjectFiles(plan, tmpDir);
        const second = fs.readFileSync(path.join(tmpDir, 'src', 'App.jsx'), 'utf8');
        fs.rmSync(tmpDir, { recursive: true, force: true });
        return first === second;
    },
    Boolean
);

assertOk(
    'writeProjectFiles creates src/ dir if it does not exist',
    () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reforge-test-'));
        // Confirm src/ does NOT exist before calling
        const srcBefore = fs.existsSync(path.join(tmpDir, 'src'));
        writeProjectFiles(makeRenderPlan(), tmpDir);
        const srcAfter = fs.existsSync(path.join(tmpDir, 'src'));
        fs.rmSync(tmpDir, { recursive: true, force: true });
        return !srcBefore && srcAfter;
    },
    Boolean
);

// ─────────────────────────────────────────────────────────────────────────────
// 6. Props Key Sorting & Newline Normalization
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── Phase 8.6: Props Key Sorting & Newline Normalization ──');

assertOk(
    'props keys are sorted alphabetically in JSX regardless of insertion order',
    () => {
        // Deliberately reverse-ordered keys to prove insertion order is not relied upon.
        const plan = [
            {
                sectionType: 'hero',
                componentName: 'HeroSection',
                variant: 'centered',
                props: {
                    subheadline: 'Sub',   // 's' > 'h' — would be SECOND if sorted
                    headline: 'Hello',    // 'h' < 's' — should appear FIRST when sorted
                },
            },
        ];
        const jsx = generateJSX(plan)[0];
        const headlinePos = jsx.indexOf('"headline"');
        const subheadlinePos = jsx.indexOf('"subheadline"');
        // 'headline' must appear before 'subheadline' (alphabetical order)
        return headlinePos !== -1 && subheadlinePos !== -1 && headlinePos < subheadlinePos;
    },
    Boolean
);

assertOk(
    'props with many unordered keys produce alphabetically sorted JSON',
    () => {
        const plan = [
            {
                sectionType: 'features',
                componentName: 'FeaturesSection',
                variant: 'grid3',
                // Keys in deliberately jumbled insertion order: z, a, m
                props: { zebra: true, apple: 'yes', mango: 42 },
            },
        ];
        const jsx = generateJSX(plan)[0];
        const applePos = jsx.indexOf('"apple"');
        const mangoPos = jsx.indexOf('"mango"');
        const zebraPos = jsx.indexOf('"zebra"');
        return applePos < mangoPos && mangoPos < zebraPos;
    },
    Boolean
);

assertOk(
    'generateAppComponent output contains no Windows-style \\r\\n line endings',
    () => generateAppComponent(makeRenderPlan()),
    (src) => !src.includes('\r\n') && !src.includes('\r')
);

assertOk(
    'generateJSX output contains no Windows-style \\r\\n line endings',
    () => generateJSX(makeRenderPlan()).join('\n'),
    (src) => !src.includes('\r\n') && !src.includes('\r')
);

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(56)}`);
console.log(`Phase 8.5–8.7 Tests: ${passed} passed, ${failed} failed`);

if (failed > 0) {
    console.error('Some tests FAILED. Review output above.');
    process.exit(1);
} else {
    console.log('All tests PASSED ✓');
    process.exit(0);
}
