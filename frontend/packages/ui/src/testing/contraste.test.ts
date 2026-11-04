import { describe, expect, it } from 'vitest';

import { ratioContraste } from './contraste';

// Valores de design-system.md §1 y §8.1 (tokens.css de US-FE-T-03).
// Si un token cambia en el diseño, este test falla y obliga a actualizar la tabla (FB7.8).
const TOKEN = {
  surfacePanel: '#ffffff',
  surfaceSidebar: '#f5f5f2',
  borderStrong: '#d3d5ce',
  textPrimary: '#17191c',
  textTertiary: '#8a8e93',
  actionPrimary: '#17191c',
  actionOnPrimary: '#ffffff',
  accentLime: '#dceb6b',
  suspendidaText: '#9a6400',
  suspendidaBg: '#fbf0d6',
  canceladaText: '#b03a2e',
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
