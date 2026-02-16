/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    blue: '#4A90E2',
                    'blue-light': '#5B9EF5',
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
            },
            fontFamily: {
                sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Inter', 'sans-serif'],
            },
            spacing: {
                '18': '4.5rem',
                '88': '22rem',
                '112': '28rem',
                '128': '32rem',
            },
        },
    },
    plugins: [],
}
