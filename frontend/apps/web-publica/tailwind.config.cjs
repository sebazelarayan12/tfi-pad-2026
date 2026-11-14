/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  presets: [require('@nexa/config/tailwind/nexa.preset')],
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  // Identidad Nexa Seguros de la web pública (src/marca/tema.css). Solo afecta a esta app.
  theme: {
    extend: {
      colors: {
        marca: {
          marino: 'var(--marca-marino)',
          'marino-hover': 'var(--marca-marino-hover)',
          azul: 'var(--marca-azul)',
          'azul-hover': 'var(--marca-azul-hover)',
          celeste: 'var(--marca-celeste)',
          'celeste-suave': 'var(--marca-celeste-suave)',
          niebla: 'var(--marca-niebla)',
        },
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        display: ['Montserrat', ...defaultTheme.fontFamily.sans],
      },
      fontSize: {
        // Escala de títulos grandes con tracking negativo (DESIGN.md, Type Scale).
        hero: ['64px', { lineHeight: '1.04', fontWeight: '700', letterSpacing: '-0.04em' }],
        'hero-sm': ['40px', { lineHeight: '1.08', fontWeight: '700', letterSpacing: '-0.032em' }],
        'titulo-xl': ['48px', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.034em' }],
        'titulo-lg': ['36px', { lineHeight: '1.14', fontWeight: '700', letterSpacing: '-0.028em' }],
        'titulo-md': ['24px', { lineHeight: '1.25', fontWeight: '600', letterSpacing: '-0.02em' }],
        'body-lg': ['18px', { lineHeight: '1.55', fontWeight: '400', letterSpacing: '-0.01em' }],
      },
      borderRadius: {
        card: '20px',
        input: '8px',
        boton: '40px',
      },
      spacing: {
        'sp-56': '56px',
        'sp-80': '80px',
        'sp-112': '112px',
      },
      maxWidth: {
        pagina: '1440px',
      },
    },
  },
};
