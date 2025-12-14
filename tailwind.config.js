/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html"], 
  theme: {
    extend: {
      colors: {
        'neon-green': '#10b981',
        'main-dark': '#0f172a', 
        'card-dark': '#1e293b',
        'prime': '#334155', 
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}