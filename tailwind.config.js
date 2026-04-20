/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0d0d14',
          raised: '#111118',
          overlay: '#161620',
        },
        success: { 500: '#22c55e' },
        warning: { 500: '#f59e0b' },
        error: { 500: '#ef4444' },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
        'spin-slow': 'spin 1.5s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
