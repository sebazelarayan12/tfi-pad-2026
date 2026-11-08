import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { guardarNumeroPagoEnCurso, leerNumeroPagoEnCurso } from './almacenamientoPago';

beforeEach(() => sessionStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('almacenamientoPago', () => {
  it('guarda y lee el numeroPago en sessionStorage', () => {
    guardarNumeroPagoEnCurso('PAG-6f1c2a');

    expect(leerNumeroPagoEnCurso()).toBe('PAG-6f1c2a');
    expect(sessionStorage.getItem('nexa.publico.numeroPago')).toBe('PAG-6f1c2a');
  });

  it('sin numeroPago guardado devuelve null', () => {
    expect(leerNumeroPagoEnCurso()).toBeNull();
  });

  it('si el storage lanza, guardar no lanza y leer devuelve null', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    expect(() => guardarNumeroPagoEnCurso('PAG-6f1c2a')).not.toThrow();
    expect(leerNumeroPagoEnCurso()).toBeNull();
  });
});
