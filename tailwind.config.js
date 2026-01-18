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
        primary: {
          50: '#e8f1ff',
          100: '#a8c5f0',
          200: '#7598da',
          300: '#5a7bb8',
          400: '#3f5e96',
          500: '#263360',
          600: '#202c50',
          700: '#1a2540',
          800: '#141e30',
          900: '#0a0f1a',
        },
        accent: {
          300: '#a8c5f0',
          400: '#7598da',
          500: '#5a7bb8',
          600: '#3f5e96',
        },
        success: {
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
        },
        warning: {
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
        },
        error: {
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
        },
        neutral: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #141e30 0%, #3f5e96 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #e8f1ff 0%, #a8c5f0 100%)',
        'gradient-accent': 'linear-gradient(135deg, #3f5e96 0%, #5a7bb8 100%)',
        'gradient-hero': 'linear-gradient(135deg, #141e30 0%, #3f5e96 50%, #5a7bb8 100%)',
      },
      animation: {
        'shimmer': 'shimmer 2s infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      boxShadow: {
        'glow': '0 0 20px rgba(63, 94, 150, 0.3)',
        'glow-lg': '0 0 40px rgba(63, 94, 150, 0.4)',
      }
    },
  },
  plugins: [],
}