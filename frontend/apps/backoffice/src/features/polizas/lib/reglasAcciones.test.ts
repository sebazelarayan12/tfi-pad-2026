import type { CuotaResponse } from '@nexa/api';
import { describe, expect, it } from 'vitest';

import { reglasAcciones } from './reglasAcciones';

const PENDIENTE = 0;
const VIGENTE = 1;
const SUSPENDIDA = 2;
const CANCELADA = 3;
const VENCIDA = 4;

const cuota = (numero: number, estado: number): CuotaResponse => ({
  id: `q${numero}`,
  numero,
  importe: 10500,
  recargo: 0,
  fechaVencimiento: '2026-12-10',
  estado: estado as CuotaResponse['estado'],
  fechaPago: null,
});

describe('reglasAcciones', () => {
  it.each([PENDIENTE, VIGENTE, SUSPENDIDA])('estado %i puede cancelar', (estado) => {
    expect(reglasAcciones(estado, [cuota(1, 0)]).puedeCancelar).toBe(true);
  });

  it.each([CANCELADA, VENCIDA])('estado %i no puede cancelar', (estado) => {
    expect(reglasAcciones(estado, [cuota(1, 0)]).puedeCancelar).toBe(false);
  });

  it('una póliza Cancelada no tiene cupón', () => {
    const reglas = reglasAcciones(CANCELADA, [cuota(1, 0)]);
    expect(reglas.puedeCupon).toBe(false);
    expect(reglas.cuotaCupon).toBeNull();
  });

  it('sin cuotas Pendiente ni Vencida no hay cupón', () => {
    expect(reglasAcciones(VIGENTE, [cuota(1, 2), cuota(2, 3)]).puedeCupon).toBe(false);
    expect(reglasAcciones(VIGENTE, []).puedeCupon).toBe(false);
  });

  it('la cuota del cupón es la elegible de menor número', () => {
    const reglas = reglasAcciones(VIGENTE, [cuota(4, 0), cuota(1, 2), cuota(3, 1), cuota(2, 3)]);
    expect(reglas.cuotaCupon?.numero).toBe(3);
  });

  it('una póliza Vencida con cuotas elegibles tiene cupón', () => {
    const reglas = reglasAcciones(VENCIDA, [cuota(5, 1)]);
    expect(reglas.puedeCupon).toBe(true);
    expect(reglas.puedeCancelar).toBe(false);
  });
});
