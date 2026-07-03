/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        quest: {
          teal: '#14b8a6',
          green: '#22c55e',
          yellow: '#facc15',
          coral: '#fb7185',
          ink: '#172554'
        }
      },
      boxShadow: {
        soft: '0 16px 40px rgba(15, 23, 42, 0.12)'
      }
    }
  },
  plugins: []
};
