import { describe, expect, it } from 'vitest';
import { formatearDni, quitarFormatoDni, TEXTO_SIN_DATO } from '@nexa/api';

describe('formatearDni', () => {
  it.each(['30512468', '30.512.468', ' 30 512 468 '])('muestra %s como 30.512.468', (valor) => {
    expect(formatearDni(valor)).toBe('30.512.468');
  });

  it('conserva ceros iniciales', () => {
    expect(formatearDni('01234567')).toBe('01.234.567');
  });

  it.each(['1234567', '123456789', 'ABC', '', ' 1234567 '])(
    'conserva sin cambios el DNI inválido %s',
    (valor) => {
      expect(formatearDni(valor)).toBe(valor);
    },
  );

  it.each([null, undefined])('muestra — para %s', (valor) => {
    expect(formatearDni(valor)).toBe(TEXTO_SIN_DATO);
  });
});

describe('quitarFormatoDni', () => {
  it.each([' 30.512.468 ', '30 512 468', '30.512.468', '30\u00a0512\u00a0468'])(
    'normaliza %s como 30512468',
    (valor) => {
      expect(quitarFormatoDni(valor)).toBe('30512468');
    },
  );

  it('quita solo separadores, sin convertir números ni validar el contenido', () => {
    expect(quitarFormatoDni(' A.B-C ')).toBe('AB-C');
    expect(quitarFormatoDni('')).toBe('');
  });
});
