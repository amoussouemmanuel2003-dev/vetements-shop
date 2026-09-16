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
          50: '#f8fafc',
          100: '#f1f5f9',
          600: '#0f172a',
          700: '#020617',
          DEFAULT: '#0f172a'
        },
        accent: {
          DEFAULT: '#e11d48',
          hover: '#be123c'
        }
      }
    },
  },
  plugins: [],
}
