/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff5f5',
          100: '#ffe3e3',
          200: '#ffc9c9',
          300: '#ffa3a3',
          400: '#ff7070',
          500: '#ff3b3b',
          600: '#d22c2c', // Dream11 Red
          700: '#b02020',
          800: '#911a1a',
          900: '#781616',
          950: '#450a0a',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
