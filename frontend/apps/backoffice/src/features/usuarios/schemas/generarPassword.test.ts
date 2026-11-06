import { afterEach, describe, expect, it, vi } from 'vitest';

import { generarPasswordTemporal } from './generarPassword';

afterEach(() => vi.restoreAllMocks());

describe('generarPasswordTemporal', () => {
  it('genera_16_caracteres_con_las_cuatro_clases', () => {
    for (let i = 0; i < 200; i += 1) {
      const password = generarPasswordTemporal();
      expect(password).toHaveLength(16);
      expect(password).toMatch(/[A-Z]/);
      expect(password).toMatch(/[a-z]/);
      expect(password).toMatch(/\d/);
      expect(password).toMatch(/[^A-Za-z0-9]/);
    }
  });

  it('usa_crypto_getRandomValues_y_nunca_math_random', () => {
    const cripto = vi.spyOn(globalThis.crypto, 'getRandomValues');
    const azar = vi.spyOn(Math, 'random');
    generarPasswordTemporal();
    expect(cripto).toHaveBeenCalled();
    expect(azar).not.toHaveBeenCalled();
  });

  it('no_repite_entre_llamadas', () => {
    const generadas = new Set(Array.from({ length: 100 }, () => generarPasswordTemporal()));
    expect(generadas.size).toBe(100);
  });

  it('no_usa_caracteres_ambiguos', () => {
    for (let i = 0; i < 200; i += 1) {
      expect(generarPasswordTemporal()).not.toMatch(/[0O1lI]/);
    }
  });
});
