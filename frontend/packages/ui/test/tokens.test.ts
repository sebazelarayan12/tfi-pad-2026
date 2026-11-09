import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const tokensPath = join(import.meta.dirname, '../src/tokens.css');
const css = readFileSync(tokensPath, 'utf8');

// Valores exactos de docs/frontend/design-system.md §1.2.
const EXPECTED: Record<string, string> = {
  '--nexa-bg-backdrop-start': '#eef2b8',
  '--nexa-bg-backdrop-end': '#d5dde3',
  '--nexa-surface-panel': '#ffffff',
  '--nexa-surface-sidebar': '#f5f5f2',
  '--nexa-surface-subtle': '#f1f2ee',
  '--nexa-border-hairline': '#e7e8e3',
  '--nexa-border-strong': '#d3d5ce',
  '--nexa-text-primary': '#17191c',
  '--nexa-text-secondary': '#5c6066',
  '--nexa-text-tertiary': '#8a8e93',
  '--nexa-action-primary': '#17191c',
  '--nexa-action-on-primary': '#ffffff',
  '--nexa-accent-lime': '#dceb6b',
  '--nexa-accent-lime-soft': '#f3f7c9',
  '--nexa-accent-promo': '#f6e7a8',
  '--nexa-status-vigente-text': '#1f7a4d',
  '--nexa-status-vigente-bg': '#e3f4ea',
  '--nexa-status-pendiente-text': '#5a5f8c',
  '--nexa-status-pendiente-bg': '#ecedf7',
  '--nexa-status-suspendida-text': '#956100',
  '--nexa-status-suspendida-bg': '#fbf0d6',
  '--nexa-status-cancelada-text': '#b03a2e',
  '--nexa-status-cancelada-bg': '#fbe5e2',
  '--nexa-status-vencida-text': '#5c6066',
  '--nexa-status-vencida-bg': '#eeefec',
  '--nexa-radius-card': '16px',
  '--nexa-radius-input': '12px',
  '--nexa-radius-shell': '24px',
  '--nexa-radius-pill': '999px',
  '--nexa-spacing-4': '4px',
  '--nexa-spacing-8': '8px',
  '--nexa-spacing-12': '12px',
  '--nexa-spacing-16': '16px',
  '--nexa-spacing-20': '20px',
  '--nexa-spacing-24': '24px',
  '--nexa-spacing-32': '32px',
  '--nexa-spacing-40': '40px',
  '--nexa-spacing-48': '48px',
  '--nexa-spacing-64': '64px',
};

function rootDeclarations(): Record<string, string> {
  const root = /:root\s*\{([^}]*)\}/.exec(css);
  expect(root, 'tokens.css no tiene un bloque :root').not.toBeNull();
  const declarations: Record<string, string> = {};
  for (const match of (root?.[1] ?? '').matchAll(/(--nexa-[\w-]+)\s*:\s*([^;]+);/g)) {
    declarations[match[1] as string] = (match[2] as string).trim();
  }
  return declarations;
}

describe('tokens.css', () => {
  it('tokens.css define las 39 variables de design-system §1.2', () => {
    const names = Object.keys(rootDeclarations()).sort();
    expect(names).toHaveLength(39);
    expect(names).toEqual(Object.keys(EXPECTED).sort());
  });

  it('cada variable tiene el valor exacto del diseño', () => {
    expect(rootDeclarations()).toEqual(EXPECTED);
  });

  it('tokens.css importa las fuentes de @fontsource', () => {
    const imports = [...css.matchAll(/@import\s+["']([^"']+)["']\s*;/g)].map((m) => m[1]);
    expect(imports).toEqual([
      '@fontsource/plus-jakarta-sans/400.css',
      '@fontsource/plus-jakarta-sans/500.css',
      '@fontsource/plus-jakarta-sans/600.css',
      '@fontsource/plus-jakarta-sans/700.css',
      '@fontsource/jetbrains-mono/400.css',
      '@fontsource/jetbrains-mono/500.css',
    ]);
    // Un @import después de una regla se ignora en silencio: tienen que ir primero.
    expect(css.lastIndexOf('@import')).toBeLessThan(css.indexOf(':root'));
  });

  it('tokens.css no referencia Google Fonts', () => {
    expect(css).not.toMatch(/google/i);
  });
});
