import { describe, expect, it } from 'vitest';
import {
  formatearFechaCalendario,
  formatearFechaHora,
  parsearFechaUtc,
  TEXTO_SIN_DATO,
  ZONA_ARGENTINA,
} from '@nexa/api';

describe('formatearFechaCalendario', () => {
  it.each([
    ['2026-11-10', '10/11/2026'],
    ['2024-02-29', '29/02/2024'],
    ['2000-02-29', '29/02/2000'],
    ['0001-01-01', '01/01/0001'],
    ['0004-02-29', '29/02/0004'],
    ['9999-12-31', '31/12/9999'],
  ])('muestra DateOnly %s como %s sin cambio de día', (valor, esperado) => {
    expect(formatearFechaCalendario(valor)).toBe(esperado);
  });

  it.each([
    null,
    undefined,
    '',
    '2026-02-30',
    '2026-02-29',
    '1900-02-29',
    '0001-02-29',
    '0000-01-01',
    '2026-00-10',
    '2026-13-10',
    '2026-11-00',
    '2026-11-31',
    '10/11/2026',
    '2026-1-01',
    ' 2026-11-10 ',
    '2026-11-10T00:00:00Z',
  ])('muestra — para DateOnly inválida %s', (valor) => {
    expect(formatearFechaCalendario(valor)).toBe(TEXTO_SIN_DATO);
  });
});

describe('parsearFechaUtc y formatearFechaHora (PB-16)', () => {
  it('publica la zona de negocio de Argentina', () => {
    expect(ZONA_ARGENTINA).toBe('America/Argentina/Buenos_Aires');
  });

  it.each([
    ['2026-11-01T12:00:00Z', '01/11/2026 09:00'],
    ['2026-11-01T02:30:00', '31/10/2026 23:30'],
    ['2026-11-01T12:00:00.1234567', '01/11/2026 09:00'],
    ['2026-11-01T12:00:00.1234567Z', '01/11/2026 09:00'],
    ['2026-11-01T12:00:00+00:00', '01/11/2026 09:00'],
    ['2026-11-01T12:00:00+0000', '01/11/2026 09:00'],
    ['2026-11-01T09:00:00-03:00', '01/11/2026 09:00'],
    ['2026-11-01T09:00:00-0300', '01/11/2026 09:00'],
    ['2026-11-01T15:00:00+03:00', '01/11/2026 09:00'],
    ['2026-11-01T03:00:00Z', '01/11/2026 00:00'],
    ['2027-01-01T02:00:00Z', '31/12/2026 23:00'],
  ])('muestra %s como %s independientemente del TZ del proceso', (valor, esperado) => {
    expect(formatearFechaHora(valor)).toBe(esperado);
  });

  it('conserva los milisegundos al truncar los siete dígitos del backend', () => {
    expect(parsearFechaUtc('2026-11-01T12:00:00.1234567')?.toISOString()).toBe(
      '2026-11-01T12:00:00.123Z',
    );
  });

  it('interpreta la hora sin offset como UTC', () => {
    expect(parsearFechaUtc('2026-11-01T02:30:00')?.toISOString()).toBe('2026-11-01T02:30:00.000Z');
  });

  it.each([null, undefined, '', '  ', 'no es una fecha', '2026-13-01T12:00:00Z'])(
    'devuelve null y — para DateTime inválida %s',
    (valor) => {
      expect(parsearFechaUtc(valor)).toBeNull();
      expect(formatearFechaHora(valor)).toBe(TEXTO_SIN_DATO);
    },
  );
});
