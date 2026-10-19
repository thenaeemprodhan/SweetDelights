/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./*.html', './js/**/*.js'],
  theme: {
    extend: {
      colors: {
        cream: '#FBF6EE',
        sand: '#F3E9DA',
        ink: '#2B1D16',
        muted: '#6E5A4E',
        maroon: { DEFAULT: '#6B1E2E', dark: '#521522', light: '#8A2E40' },
        saffron: { DEFAULT: '#D99A2B', light: '#F4D9A4' },
        pistachio: '#6F8F3C',
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(59, 35, 20, 0.25)',
      },
    },
  },
  plugins: [],
};
