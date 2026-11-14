/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

const conCanal = (variable) => `rgb(var(${variable}) / <alpha-value>)`;

module.exports = {
  // Modo oscuro por atributo: lo pone el interruptor del nav (src/marca/tema/).
  darkMode: ['selector', '[data-tema="oscuro"]'],
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
        // Colores que cambian con el modo claro/oscuro (src/marca/tema.css).
        tema: {
          fondo: conCanal('--tema-fondo'),
          'fondo-alt': conCanal('--tema-fondo-alt'),
          elevado: conCanal('--tema-elevado'),
          titulo: conCanal('--tema-titulo'),
          acento: conCanal('--tema-acento'),
          banda: conCanal('--tema-banda'),
          'boton-fuerte': conCanal('--tema-boton-fuerte'),
          'boton-fuerte-hover': conCanal('--tema-boton-fuerte-hover'),
          'sobre-fuerte': conCanal('--tema-sobre-fuerte'),
          destacado: conCanal('--tema-destacado'),
        },
        // Pie gris en los dos modos.
        pie: {
          fondo: conCanal('--pie-fondo'),
          texto: conCanal('--pie-texto'),
          suave: conCanal('--pie-suave'),
          borde: conCanal('--pie-borde'),
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
