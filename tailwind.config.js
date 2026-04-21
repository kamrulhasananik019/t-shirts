/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f8f8f8',
          100: '#f7f0ba',
          200: '#f4e37f',
          300: '#f0d542',
          400: '#d8c036',
          500: '#c0aa2f',
          600: '#a08e28',
          700: '#7b6e20',
          800: '#5a5218',
          900: '#3f390f',
        },
        accent: {
          100: '#f2d0d0',
          200: '#d98a8a',
          300: '#bf3f3f',
          400: '#8f1414',
          500: '#1d0000',
        },
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'sans-serif'],
        serif: ['var(--font-playfair-display)', 'serif'],
      },
    },
  },
  plugins: [],
}