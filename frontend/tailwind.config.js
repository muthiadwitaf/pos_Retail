/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#2367F6', // Majoo Blue
                    dark: '#1A52C9',
                    light: '#EBF1FF',
                },
                secondary: '#10B981',
                danger: '#EF4444',
                surface: '#FFFFFF',
                background: '#F8F9FD',
                muted: '#94A3B8',
            },
            borderRadius: {
                'xl': '1rem',
                '2xl': '1.5rem',
            },
            boxShadow: {
                'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
                'premium': '0 10px 30px -5px rgba(35, 103, 246, 0.1)',
            }
        },
    },
    plugins: [],
}
