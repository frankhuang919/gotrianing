/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'serif-jp': ['"Noto Serif JP"', 'serif'],
        'sans-jp': ['"Noto Sans JP"', 'sans-serif'],
      },
      colors: {
        'board-wood': '#e3c08d',
        'board-line': '#000000',
        'ink': {
          950: '#0C0A09',
          900: '#1C1917',
          850: '#292524',
          800: '#44403C',
          700: '#57534E',
          500: '#78716C',
          400: '#A8A29E',
          100: '#FAFAF9',
        },
        'gold': {
          DEFAULT: '#CA8A04',
          light: '#EAB308',
          dark: '#A16207',
        },
      },
      backgroundImage: {
        'wood-texture': "url('/wood-pattern.jpg')",
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'float': 'float 8s ease-in-out infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(3deg)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(202, 138, 4, 0.15)' },
          '50%': { boxShadow: '0 0 40px rgba(202, 138, 4, 0.35)' },
        },
      },
    },
  },
  plugins: [],
}
