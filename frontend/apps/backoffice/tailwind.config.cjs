/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('@nexa/config/tailwind/nexa.preset')],
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
};
