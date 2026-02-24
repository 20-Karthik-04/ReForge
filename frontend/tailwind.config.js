/**
 * @file tailwind.config.js
 * @description Tailwind CSS v4 configuration.
 *
 * In Tailwind v4, design tokens (colors, spacing, radii, shadows, etc.) are
 * declared as CSS custom properties inside the `@theme { }` block in
 * `src/index.css` — NOT here. This file is intentionally minimal.
 *
 * What still belongs here:
 *   - `content` — file globs for class scanning
 *   - `plugins` — any Tailwind plugins
 *
 * Do NOT add theme.extend back here. Single source of truth: index.css @theme.
 */

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './index.html',
        './src/**/*.{js,jsx}',
    ],
    plugins: [],
}
