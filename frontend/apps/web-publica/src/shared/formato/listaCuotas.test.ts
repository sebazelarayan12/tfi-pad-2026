import { describe, expect, it } from 'vitest';

import { formatearListaCuotas } from './listaCuotas';

describe('formatearListaCuotas', () => {
  it('sin cuotas devuelve el guión', () => {
    expect(formatearListaCuotas([])).toBe('—');
  });

  it('una cuota devuelve su número', () => {
    expect(formatearListaCuotas([8])).toBe('8');
  });

  it('dos cuotas se unen con "y"', () => {
    expect(formatearListaCuotas([8, 9])).toBe('8 y 9');
  });

  it('tres o más cuotas usan comas y "y" al final', () => {
    expect(formatearListaCuotas([8, 9, 10])).toBe('8, 9 y 10');
    expect(formatearListaCuotas([1, 2, 3, 4])).toBe('1, 2, 3 y 4');
  });
});
