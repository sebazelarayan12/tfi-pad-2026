import { describe, expect, it } from 'vitest';
import { formatearImporte, parseImporteEsAR, TEXTO_SIN_DATO } from '@nexa/api';

describe('formatearImporte', () => {
  it('formatea 25000 con U+00A0 entre el símbolo y el número', () => {
    const resultado = formatearImporte(25000);
    const esperado = '$\u00a025.000,00';
    expect(resultado).toBe(esperado);
    expect([...resultado].map((caracter) => caracter.charCodeAt(0))).toEqual(
      [...esperado].map((caracter) => caracter.charCodeAt(0)),
    );
  });

  it.each([
    [-1500.25, '-$\u00a01.500,25'],
    [12000.5, '$\u00a012.000,50'],
    [0, '$\u00a00,00'],
    [1.005, '$\u00a01,01'],
    [-1.005, '-$\u00a01,01'],
  ])('formatea %s como %s sin redondeo previo', (valor, esperado) => {
    expect(formatearImporte(valor)).toBe(esperado);
  });

  it.each([null, undefined, NaN, Infinity, -Infinity])('muestra — para %s', (valor) => {
    expect(formatearImporte(valor)).toBe(TEXTO_SIN_DATO);
  });
});

describe('parseImporteEsAR (RV-26)', () => {
  it.each([
    ['27.500,00', 27500],
    ['12000,5', 12000.5],
    ['0', 0],
    ['0,01', 0.01],
    ['-1.500,25', -1500.25],
    ['  27.500,00  ', 27500],
    ['$\u00a025.000,00', 25000],
    ['-$\u00a01.500,25', -1500.25],
  ])('normaliza %s como %s', (valor, esperado) => {
    expect(parseImporteEsAR(valor)).toBe(esperado);
  });

  it.each([
    null,
    undefined,
    '',
    '  ',
    'abc',
    'NaN',
    'Infinity',
    '12.00',
    '1,234.56',
    '27.50,00',
    '1,234',
    '1,2,3',
    '1e3',
    '0x10',
    '9'.repeat(400),
  ])('rechaza el importe inválido %s sin convertirlo silenciosamente en cero', (valor) => {
    expect(parseImporteEsAR(valor)).toBeNull();
  });
});
