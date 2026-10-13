/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',   // toggled via .dark on <html>
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        accent: {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
        // Dark mode neutrals
        ink: {
          900: '#0b1220',
          800: '#111827',
          700: '#1f2937',
          600: '#334155',
        },
      },
      boxShadow: {
        card:  '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 4px 12px -4px rgb(15 23 42 / 0.08)',
        hover: '0 4px 8px 0 rgb(0 0 0 / 0.05), 0 12px 24px -8px rgb(15 23 42 / 0.12)',
        glow:  '0 0 0 4px rgb(99 102 241 / 0.15)',
      },
      keyframes: {
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.35s ease-out',
        'fade-in':    'fadeIn 0.25s ease-out',
        'scale-in':   'scaleIn 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
