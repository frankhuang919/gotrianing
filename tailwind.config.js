/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'wood-texture': "url('/wood-pattern.jpg')", // Placeholder
      },
      colors: {
        'board-wood': '#e3c08d',
        'board-line': '#000000',
      }
    },
  },
  plugins: [],
}
