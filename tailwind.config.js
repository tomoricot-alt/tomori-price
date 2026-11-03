/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tomori: {
          dark: '#16382b',
          primary: '#1e4d3b',
          accent: '#2f7457',
          light: '#e8f3ed',
          bg: '#fcfbf9',
          card: '#ffffff',
          sand: '#f4efe6',
          border: '#e6e1d7',
          muted: '#768178',
          text: '#222d26',
        }
      },
      fontFamily: {
        sans: ['"Noto Sans JP"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
