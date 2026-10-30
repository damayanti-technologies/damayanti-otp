/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060911',
          900: '#0B0F19',
          800: '#111827',
          700: '#1F2937',
        },
        accent: {
          blue: '#3B82F6',
          violet: '#8B5CF6',
          cyan: '#06B6D4',
        },
      },
    },
  },
  plugins: [],
};
