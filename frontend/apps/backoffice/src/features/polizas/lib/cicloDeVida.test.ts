import type { CuotaResponse } from '@nexa/api';
import { describe, expect, it } from 'vitest';

import { cicloDeVida } from './cicloDeVida';
import { importeCuota } from './importeCuota';

const cuota = (parcial: Partial<CuotaResponse> = {}): CuotaResponse => ({
  id: 'c1',
  numero: 1,
  importe: 10500,
  recargo: 0,
  fechaVencimiento: '2026-11-10',
  estado: 0,
  fechaPago: null,
  ...parcial,
});

const poliza = (estado: number, cuotas: CuotaResponse[] = [cuota()]) => ({
  estado,
  fechaEmision: '2026-11-01T14:03:00',
  fechaFin: '2027-05-01',
  cuotas,
});

describe('cicloDeVida', () => {
  it.each([
    ['Pendiente', 0, 1],
    ['Vigente', 1, 2],
    ['Suspendida', 2, 3],
    ['Vencida', 4, 5],
  ])('%s marca el paso %i como actual', (_nombre, estado, esperado) => {
    expect(cicloDeVida(poliza(estado)).actual).toBe(esperado);
  });

  it('Cancelada no marca ningún paso como actual', () => {
    expect(cicloDeVida(poliza(3)).actual).toBeUndefined();
  });

  it('devuelve los 5 pasos con sus textos', () => {
    const { pasos } = cicloDeVida(poliza(2));
    expect(pasos.map((paso) => paso.estado)).toEqual([
      'Pendiente',
      'Vigente',
      'Suspendida',
      'Vigente',
      'Vencida',
    ]);
    expect(pasos[0]?.nota).toBe('Emitida 01/11/2026');
    expect(pasos[2]?.nota).toBe('No disponible');
    expect(pasos[3]?.nota).toBe('Al pagar las vencidas');
  });

  it('el paso 5 muestra la fecha de fin', () => {
    expect(cicloDeVida(poliza(4)).pasos[4]?.nota).toBe('01/05/2027');
  });

  it('el paso 2 muestra la fecha de la cuota 1 pagada', () => {
    const pagada = cuota({ estado: 2, fechaPago: '2026-11-02T15:30:00' });
    expect(cicloDeVida(poliza(1, [pagada])).pasos[1]?.nota).toBe('02/11/2026, cuota 1 pagada');
  });

  it('el paso 2 queda sin nota si la cuota 1 no está pagada', () => {
    expect(cicloDeVida(poliza(1, [cuota()])).pasos[1]?.nota).toBe('');
  });
});

describe('importeCuota', () => {
  it('suma el recargo al importe', () => {
    expect(importeCuota({ importe: 10500, recargo: 525 })).toBe(11025);
  });

  it('no arrastra error de coma flotante', () => {
    expect(importeCuota({ importe: 0.1, recargo: 0.2 })).toBe(0.3);
  });
});
