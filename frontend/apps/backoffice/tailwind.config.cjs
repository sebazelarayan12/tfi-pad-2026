const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('@nexa/config/tailwind/nexa.preset')],
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', ...defaultTheme.fontFamily.sans] },
      colors: {
        'marca-marino': 'var(--marca-marino)',
        'tema-fondo-alt': 'rgb(var(--tema-fondo-alt) / <alpha-value>)',
        'tema-boton-fuerte': 'rgb(var(--tema-boton-fuerte) / <alpha-value>)',
        'tema-acento': 'rgb(var(--tema-acento) / <alpha-value>)',
      },
    },
  },
};
