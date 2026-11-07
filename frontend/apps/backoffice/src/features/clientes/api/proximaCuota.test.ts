import { ESTADO_CUOTA_NUMERO, type CuotaResponse, type EstadoCuotaNumero } from '@nexa/api';
import { describe, expect, it } from 'vitest';

import { proximaCuota } from './proximaCuota';

const cuota = (
  numero: number,
  estado: EstadoCuotaNumero,
  fechaVencimiento: string,
): CuotaResponse => ({
  id: `cuota-${numero}`,
  numero,
  importe: 1000,
  recargo: 0,
  fechaVencimiento,
  estado,
  fechaPago: null,
});

const {
  Pendiente: PENDIENTE,
  Vencida: VENCIDA,
  Pagada: PAGADA,
  Anulada: ANULADA,
} = ESTADO_CUOTA_NUMERO;

describe('proximaCuota (D-B07-2)', () => {
  it('devuelve la primera cuota Pendiente por número', () => {
    const cuotas = [
      cuota(3, PENDIENTE, '2027-03-10'),
      cuota(1, PAGADA, '2026-12-10'),
      cuota(2, PENDIENTE, '2027-01-10'),
    ];
    expect(proximaCuota(cuotas)?.fechaVencimiento).toBe('2027-01-10');
  });

  it('una cuota Vencida no cuenta como próxima', () => {
    const cuotas = [cuota(1, VENCIDA, '2026-10-10'), cuota(2, PENDIENTE, '2026-11-10')];
    expect(proximaCuota(cuotas)?.numero).toBe(2);
  });

  it('sin cuotas Pendientes devuelve undefined', () => {
    expect(
      proximaCuota([cuota(1, PAGADA, '2026-12-10'), cuota(2, ANULADA, '2027-01-10')]),
    ).toBeUndefined();
    expect(proximaCuota([])).toBeUndefined();
  });
});
