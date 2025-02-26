/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          'primary': '#1E88E5',
          'primary-dark': '#1565C0',
          'secondary': '#43A047',
          'warning': '#E53935',
        },
      },
    },
    plugins: [],
  }