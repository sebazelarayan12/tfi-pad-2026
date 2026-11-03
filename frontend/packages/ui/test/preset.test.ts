import { createRequire } from 'node:module';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import { describe, expect, it } from 'vitest';

type Palette = { [key: string]: string | Palette };

interface NexaPreset {
  theme: {
    extend: {
      colors: Palette;
      spacing: Record<string, string>;
      fontSize: Record<string, [string, Record<string, string>]>;
      borderRadius: Record<string, string>;
      boxShadow: Record<string, string>;
      backgroundImage: Record<string, string>;
    };
  };
}

const require = createRequire(import.meta.url);
const preset = require('@nexa/config/tailwind/nexa.preset') as NexaPreset;
const theme = preset.theme.extend;

async function generate(classes: string): Promise<string> {
  const result = await postcss([
    tailwindcss({
      presets: [preset as never],
      content: [{ raw: `<div class="${classes}"></div>`, extension: 'html' }],
      corePlugins: { preflight: false },
    }),
  ]).process('@tailwind utilities;', { from: undefined });
  return result.css;
}

describe('nexa.preset', () => {
  it('preset: colores semánticos resuelven a var(--nexa-*)', () => {
    const colors = theme.colors as {
      surface: { panel: string };
      text: { primary: string };
      status: { cancelada: { text: string } };
    };
    expect(colors.surface.panel).toBe('var(--nexa-surface-panel)');
    expect(colors.text.primary).toBe('var(--nexa-text-primary)');
    expect(colors.status.cancelada.text).toBe('var(--nexa-status-cancelada-text)');
  });

  it('preset: espaciado sp-N', () => {
    expect(theme.spacing['sp-12']).toBe('12px');
    expect(theme.spacing['sp-64']).toBe('64px');
  });

  it('preset: tipografía con line-height y peso', () => {
    expect(theme.fontSize.h1).toEqual([
      '28px',
      { lineHeight: '34px', fontWeight: '600', letterSpacing: '0' },
    ]);
  });

  it('preset: radios y sombra', () => {
    expect(theme.borderRadius.input).toBe('12px');
    expect(theme.boxShadow.shell).toBe('0px 24px 60px 0px rgba(60, 70, 40, 0.1)');
  });

  it('preset: backdrop con to bottom right', () => {
    expect(theme.backgroundImage.backdrop).toContain('to bottom right');
  });

  it('preset genera bg-surface-panel', async () => {
    const css = await generate('bg-surface-panel');
    expect(css).toContain('.bg-surface-panel');
    expect(css).toContain('background-color: var(--nexa-surface-panel)');
  });

  it('preset genera p-sp-12 y text-h1', async () => {
    const css = await generate('p-sp-12 text-h1');
    expect(css).toMatch(/\.p-sp-12\s*\{[^}]*padding:\s*12px/);
    expect(css).toMatch(/\.text-h1\s*\{[^}]*font-size:\s*28px/);
  });

  it('preset genera bg-backdrop', async () => {
    const css = await generate('bg-backdrop');
    expect(css).toContain(
      'linear-gradient(to bottom right, var(--nexa-bg-backdrop-start), var(--nexa-bg-backdrop-end))',
    );
  });
});
