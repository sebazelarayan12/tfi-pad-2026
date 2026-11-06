import { describe, expect, it } from 'vitest';

import { textoCuotas } from './textoCuotas';

describe('textoCuotas', () => {
  it('una cuota devuelve su número', () => {
    expect(textoCuotas([8])).toBe('8');
  });

  it('dos cuotas se unen con "y"', () => {
    expect(textoCuotas([8, 9])).toBe('8 y 9');
  });

  it('tres o más usan comas y "y" al final', () => {
    expect(textoCuotas([8, 9, 10])).toBe('8, 9 y 10');
  });

  it('sin cuotas devuelve el texto de dato faltante', () => {
    expect(textoCuotas([])).toBe('—');
  });
});
