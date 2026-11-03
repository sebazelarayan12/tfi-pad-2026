// Preset de Tailwind del diseño Nexa (docs/frontend/design-system.md §4).
// CommonJS a propósito (packages/config es "commonjs", D-T01-7). No define `content`: lo define cada app.
const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        backdrop: {
          start: 'var(--nexa-bg-backdrop-start)',
          end: 'var(--nexa-bg-backdrop-end)',
        },
        surface: {
          panel: 'var(--nexa-surface-panel)',
          sidebar: 'var(--nexa-surface-sidebar)',
          subtle: 'var(--nexa-surface-subtle)',
        },
        border: {
          hairline: 'var(--nexa-border-hairline)',
          strong: 'var(--nexa-border-strong)',
        },
        text: {
          primary: 'var(--nexa-text-primary)',
          secondary: 'var(--nexa-text-secondary)',
          tertiary: 'var(--nexa-text-tertiary)',
        },
        action: {
          primary: 'var(--nexa-action-primary)',
          'on-primary': 'var(--nexa-action-on-primary)',
        },
        accent: {
          lime: 'var(--nexa-accent-lime)',
          'lime-soft': 'var(--nexa-accent-lime-soft)',
          promo: 'var(--nexa-accent-promo)',
        },
        status: {
          vigente: {
            text: 'var(--nexa-status-vigente-text)',
            bg: 'var(--nexa-status-vigente-bg)',
          },
          pendiente: {
            text: 'var(--nexa-status-pendiente-text)',
            bg: 'var(--nexa-status-pendiente-bg)',
          },
          suspendida: {
            text: 'var(--nexa-status-suspendida-text)',
            bg: 'var(--nexa-status-suspendida-bg)',
          },
          cancelada: {
            text: 'var(--nexa-status-cancelada-text)',
            bg: 'var(--nexa-status-cancelada-bg)',
          },
          vencida: {
            text: 'var(--nexa-status-vencida-text)',
            bg: 'var(--nexa-status-vencida-bg)',
          },
        },
      },

      fontFamily: {
        sans: ['"Plus Jakarta Sans"', ...defaultTheme.fontFamily.sans],
        mono: ['"JetBrains Mono"', ...defaultTheme.fontFamily.mono],
      },

      fontSize: {
        display: ['40px', { lineHeight: '44px', fontWeight: '700', letterSpacing: '0' }],
        h1: ['28px', { lineHeight: '34px', fontWeight: '600', letterSpacing: '0' }],
        h2: ['20px', { lineHeight: '26px', fontWeight: '600', letterSpacing: '0' }],
        h3: ['16px', { lineHeight: '22px', fontWeight: '600', letterSpacing: '0' }],
        body: ['14px', { lineHeight: '20px', fontWeight: '400', letterSpacing: '0' }],
        'body-sm': ['13px', { lineHeight: '18px', fontWeight: '400', letterSpacing: '0' }],
        label: ['12px', { lineHeight: '16px', fontWeight: '500', letterSpacing: '0' }],
        caption: ['11px', { lineHeight: '14px', fontWeight: '500', letterSpacing: '0' }],
        mono: ['13px', { lineHeight: '18px', fontWeight: '400', letterSpacing: '0' }],
        'mono-lg': ['22px', { lineHeight: '28px', fontWeight: '500', letterSpacing: '0' }],
      },

      spacing: {
        'sp-4': '4px',
        'sp-8': '8px',
        'sp-12': '12px',
        'sp-16': '16px',
        'sp-20': '20px',
        'sp-24': '24px',
        'sp-32': '32px',
        'sp-40': '40px',
        'sp-48': '48px',
        'sp-64': '64px',
      },

      borderRadius: {
        card: '16px',
        input: '12px',
        shell: '24px',
        pill: '999px',
      },

      boxShadow: {
        shell: '0px 24px 60px 0px rgba(60, 70, 40, 0.1)',
      },

      backgroundImage: {
        backdrop:
          'linear-gradient(to bottom right, var(--nexa-bg-backdrop-start), var(--nexa-bg-backdrop-end))',
      },
    },
  },
};
