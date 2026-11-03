import { describe, expect, it } from 'vitest';

import type { Sesion } from '../types/sesion';
import { estaVigente, MARGEN_EXPIRACION_MS } from './vigencia';

const EXPIRA_EN = 10_000_000;
const sesion: Sesion = {
  token: 'token',
  rol: 'Empleado',
  expiraEn: new Date(EXPIRA_EN),
  email: null,
};

describe('estaVigente', () => {
  it('el margen es de 5 segundos', () => {
    expect(MARGEN_EXPIRACION_MS).toBe(5_000);
  });

  it('vigente a expiraEn - 5001 ms', () => {
    expect(estaVigente(sesion, EXPIRA_EN - 5_001)).toBe(true);
  });

  it('no vigente a expiraEn - 5000 ms', () => {
    expect(estaVigente(sesion, EXPIRA_EN - 5_000)).toBe(false);
  });

  it('no vigente después de expiraEn', () => {
    expect(estaVigente(sesion, EXPIRA_EN + 1)).toBe(false);
  });
});
