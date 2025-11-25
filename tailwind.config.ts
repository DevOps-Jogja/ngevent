import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#fff7ed',
                    100: '#ffedd5',
                    200: '#fed7aa',
                    300: '#fdba74',
                    400: '#fb923c',
                    500: '#f97316',
                    600: '#ea580c',
                    700: '#c2410c',
                    800: '#9a3412',
                    900: '#7c2d12',
                    950: '#431407',
                },
                dark: {
                    50: '#f6f6f7',
                    100: '#e1e3e5',
                    200: '#c3c7cd',
                    300: '#9fa5ad',
                    400: '#7b838e',
                    500: '#616873',
                    600: '#4d5259',
                    700: '#3f4349',
                    800: '#2d3035',
                    900: '#1a1d1f',
                    950: '#0a0b0c',
                },
            },
            backgroundColor: {
                'dark-primary': '#0f172a', // Slate 900
                'dark-secondary': '#334155', // Slate 700
                'dark-card': '#1e293b', // Slate 800
            },
            typography: {
                DEFAULT: {
                    css: {
                        color: '#374151',
                        maxWidth: 'none',
                    },
                },
                invert: {
                    css: {
                        color: '#d1d5db',
                    },
                },
            },
            animation: {
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
};

export default config;