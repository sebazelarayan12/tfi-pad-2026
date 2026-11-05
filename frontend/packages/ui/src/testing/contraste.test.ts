import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { ratioContraste } from './contraste';

// Los colores se leen de tokens.css (US-FE-T-03), no de una copia. Los ratios y veredictos de
// PARES son la referencia de design-system.md §8.1: si T-03 cambia un token, el ratio calculado
// deja de coincidir y este test falla, lo que obliga a revisar la tabla (FB7.8, ficha §10.1).
const css = readFileSync(join(import.meta.dirname, '../tokens.css'), 'utf8');

function token(nombre: string): string {
  const coincidencia = new RegExp(`--nexa-${nombre}:\\s*(#[0-9a-fA-F]{6})\\s*;`).exec(css);
  if (!coincidencia?.[1]) throw new Error(`tokens.css no define --nexa-${nombre} como #rrggbb`);
  return coincidencia[1].toLowerCase();
}

const TOKEN = {
  surfacePanel: token('surface-panel'),
  surfaceSidebar: token('surface-sidebar'),
  borderStrong: token('border-strong'),
  textPrimary: token('text-primary'),
  textTertiary: token('text-tertiary'),
  actionPrimary: token('action-primary'),
  actionOnPrimary: token('action-on-primary'),
  accentLime: token('accent-lime'),
  suspendidaText: token('status-suspendida-text'),
  suspendidaBg: token('status-suspendida-bg'),
  canceladaText: token('status-cancelada-text'),
} as const;

const AA_TEXTO = 4.5;
const AA_NO_TEXTUAL = 3;
const TOLERANCIA = 0.01;

const PARES = [
  {
    par: 'text/tertiary sobre surface/panel',
    a: TOKEN.textTertiary,
    b: TOKEN.surfacePanel,
    ratio: 3.3,
    umbral: AA_TEXTO,
    cumple: false,
  },
  {
    par: 'text/tertiary sobre surface/sidebar',
    a: TOKEN.textTertiary,
    b: TOKEN.surfaceSidebar,
    ratio: 3.02,
    umbral: AA_TEXTO,
    cumple: false,
  },
  {
    par: 'status/suspendida/text sobre status/suspendida/bg',
    a: TOKEN.suspendidaText,
    b: TOKEN.suspendidaBg,
    ratio: 4.42,
    umbral: AA_TEXTO,
    cumple: false,
  },
  {
    par: 'border/strong sobre surface/panel',
    a: TOKEN.borderStrong,
    b: TOKEN.surfacePanel,
    ratio: 1.48,
    umbral: AA_NO_TEXTUAL,
    cumple: false,
  },
  {
    par: 'status/cancelada/text sobre surface/panel',
    a: TOKEN.canceladaText,
    b: TOKEN.surfacePanel,
    ratio: 6.02,
    umbral: AA_TEXTO,
    cumple: true,
  },
  {
    par: 'action/primary sobre surface/panel',
    a: TOKEN.actionPrimary,
    b: TOKEN.surfacePanel,
    ratio: 17.61,
    umbral: AA_NO_TEXTUAL,
    cumple: true,
  },
  {
    par: 'text/primary sobre accent/lime',
    a: TOKEN.textPrimary,
    b: TOKEN.accentLime,
    ratio: 13.54,
    umbral: AA_TEXTO,
    cumple: true,
  },
  {
    par: 'action/on-primary sobre action/primary',
    a: TOKEN.actionOnPrimary,
    b: TOKEN.actionPrimary,
    ratio: 17.61,
    umbral: AA_TEXTO,
    cumple: true,
  },
] as const;

describe('contraste de pares documentados', () => {
  it.each(PARES)('$par: $ratio:1, cumple AA = $cumple', ({ a, b, ratio, umbral, cumple }) => {
    const calculado = ratioContraste(a, b);
    expect(Math.abs(calculado - ratio)).toBeLessThanOrEqual(TOLERANCIA);
    expect(calculado >= umbral).toBe(cumple);
  });

  it('es simétrico', () => {
    expect(ratioContraste(TOKEN.textPrimary, TOKEN.surfacePanel)).toBe(
      ratioContraste(TOKEN.surfacePanel, TOKEN.textPrimary),
    );
  });

  it('rechaza un color que no es #rrggbb', () => {
    expect(() => ratioContraste('#fff', TOKEN.surfacePanel)).toThrow(TypeError);
  });
});
