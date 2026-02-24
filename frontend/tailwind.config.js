/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './index.html',
        './src/**/*.{js,jsx}',
    ],
    theme: {
        extend: {
            // ─── Color Palette ────────────────────────────────────────────────
            colors: {
                primary: {
                    DEFAULT: '#4A90E2',
                    light: '#5B9EF5',
                    dark: '#2F6EC4',
                },
                dark: {
                    navy: '#1A202C',
                    'navy-light': '#2D3748',
                },
                light: {
                    gray: '#F7FAFC',
                    'gray-dark': '#EDF2F7',
                },
                accent: {
                    purple: '#7C3AED',
                    'purple-light': '#8B5CF6',
                },
                // Semantic status colors mapped to design tokens
                status: {
                    success: '#16A34A',
                    'success-bg': '#F0FDF4',
                    'success-border': '#BBF7D0',
                    error: '#DC2626',
                    'error-bg': '#FEF2F2',
                    'error-border': '#FECACA',
                    warning: '#D97706',
                    'warning-bg': '#FFFBEB',
                    'warning-border': '#FDE68A',
                },
            },

            // ─── Typography ───────────────────────────────────────────────────
            fontFamily: {
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
            },
            fontSize: {
                xs: ['0.75rem', { lineHeight: '1rem' }],
                sm: ['0.875rem', { lineHeight: '1.25rem' }],
                base: ['1rem', { lineHeight: '1.5rem' }],
                lg: ['1.125rem', { lineHeight: '1.75rem' }],
                xl: ['1.25rem', { lineHeight: '1.75rem' }],
                '2xl': ['1.5rem', { lineHeight: '2rem' }],
                '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
                '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
                '5xl': ['3rem', { lineHeight: '1' }],
            },

            // ─── Spacing (8px base unit) ──────────────────────────────────────
            spacing: {
                // Semantic spacing aliases
                'section-y': '5rem',      // 80px — vertical section padding
                'section-y-sm': '3rem',   // 48px — compact section padding
                'container-x': '1.5rem',  // 24px — container horizontal padding
                'container-x-lg': '2rem', // 32px
                // Additional scale
                '18': '4.5rem',
                '22': '5.5rem',
                '88': '22rem',
                '104': '26rem',
                '112': '28rem',
                '128': '32rem',
            },

            // ─── Border Radius ────────────────────────────────────────────────
            borderRadius: {
                card: '0.75rem',   // 12px
                button: '0.5rem',  // 8px
                input: '0.375rem', // 6px
                badge: '9999px',
            },

            // ─── Shadows ──────────────────────────────────────────────────────
            boxShadow: {
                card: '0 2px 8px 0 rgba(0, 0, 0, 0.08), 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                'card-hover': '0 8px 24px 0 rgba(0, 0, 0, 0.12), 0 2px 6px 0 rgba(0, 0, 0, 0.08)',
                dropdown: '0 10px 30px -4px rgba(0, 0, 0, 0.15), 0 4px 12px -2px rgba(0, 0, 0, 0.08)',
                button: '0 1px 3px 0 rgba(0, 0, 0, 0.12), 0 1px 2px -1px rgba(0, 0, 0, 0.10)',
                'button-primary': '0 4px 12px 0 rgba(74, 144, 226, 0.35)',
                input: '0 0 0 3px rgba(74, 144, 226, 0.15)',
            },

            // ─── Max Width ────────────────────────────────────────────────────
            maxWidth: {
                container: '75rem', // 1200px
            },
        },
    },
    plugins: [],
}
