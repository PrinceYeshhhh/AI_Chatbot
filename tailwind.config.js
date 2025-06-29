/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Ensure text colors are properly defined
        'text-black': '#000000',
        'text-white': '#ffffff',
      }
    },
  },
  plugins: [],
  safelist: [
    'text-black',
    'text-white',
    'text-gray-900',
    'text-gray-700',
    'text-gray-600',
    'text-gray-500',
    'text-gray-400'
  ]
};
