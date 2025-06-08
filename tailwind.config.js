/** @type {import('tailwindcss').Config} */

const typography = require('@tailwindcss/typography');
const scrollhide = require('tailwind-scrollbar-hide');

module.exports = {
    content: ['./src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {},
    },
    plugins: [
        typography,
        scrollhide
    ],
};
