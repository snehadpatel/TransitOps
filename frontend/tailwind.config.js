/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: '#161A24',
        'sidebar-hover': '#1E2333',
        'sidebar-active': '#252D40',
        amber: {
          primary: '#F5A623',
          hover: '#E09015',
        },
        status: {
          available: '#22C55E',
          ontrip: '#3B82F6',
          inshop: '#F97316',
          retired: '#EF4444',
          suspended: '#EF4444',
          draft: '#9CA3AF',
          dispatched: '#3B82F6',
          completed: '#22C55E',
          cancelled: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
