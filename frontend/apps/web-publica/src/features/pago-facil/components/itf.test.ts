import { describe, expect, it } from 'vitest';

import { codificarItf, esCodificableItf } from './itf';

describe('codificarItf', () => {
  it('codifica el par 12 intercalando barras (1) y espacios (2) entre inicio y fin', () => {
    // 1 = WNNNW en barras, 2 = NWNNW en espacios; inicio NNNN y fin WNN.
    expect(codificarItf('12')).toEqual([1, 1, 1, 1, 3, 1, 1, 3, 1, 1, 1, 1, 3, 3, 3, 1, 1]);
  });

  it('cada dígito tiene 2 elementos anchos y 3 angostos', () => {
    const anchos = codificarItf('0123456789');
    const datos = anchos.slice(4, -3);
    for (let par = 0; par < datos.length; par += 10) {
      const barras = datos.slice(par, par + 10).filter((_, i) => i % 2 === 0);
      const espacios = datos.slice(par, par + 10).filter((_, i) => i % 2 === 1);
      expect(barras.filter((a) => a === 3)).toHaveLength(2);
      expect(espacios.filter((a) => a === 3)).toHaveLength(2);
    }
  });

  it('un código de 42 dígitos tiene 21 pares: 4 + 210 + 3 elementos', () => {
    expect(codificarItf('1'.repeat(42))).toHaveLength(217);
  });

  it('rechaza una cantidad impar de dígitos o caracteres no numéricos', () => {
    expect(esCodificableItf('123')).toBe(false);
    expect(esCodificableItf('12a4')).toBe(false);
    expect(esCodificableItf('')).toBe(false);
    expect(() => codificarItf('123')).toThrow(RangeError);
  });
});
