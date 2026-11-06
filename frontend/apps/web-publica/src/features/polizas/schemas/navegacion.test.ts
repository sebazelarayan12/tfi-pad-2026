import type { ConsultaPublicaResponse } from '@nexa/api';
import { describe, expect, it } from 'vitest';

import { estadoMiPolizaSchema, estadoPagoPublicoSchema, leerEstadoNavegacion } from './navegacion';

function consultaValida(): ConsultaPublicaResponse {
  return {
    numeroPoliza: 'POL-0000001',
    estado: 'VIGENTE',
    coberturaVigente: true,
    vigenteDesde: '2026-10-15',
    vigenteHasta: '2027-04-15',
    plan: { codigo: 'RC', nombre: 'Responsabilidad Civil' },
    vehiculo: { patente: 'AB123CD', marca: 'Toyota', modelo: 'Corolla XEi', anio: 2021 },
    cuotas: [
      {
        idCuota: 'f1000000-0000-0000-0000-000000000001',
        numero: 1,
        importe: 12000,
        recargo: 0,
        total: 12000,
        vencimiento: '2026-11-10',
        estado: 'PAGADA',
      },
    ],
  };
}

function estadoBase() {
  return {
    dni: '30123456',
    numeroPoliza: 'POL-0000001',
    consulta: consultaValida(),
  };
}

function ids(cantidad: number): string[] {
  return Array.from({ length: cantidad }, (_, indice) => `cuota-${indice + 1}`);
}

describe('estadoMiPolizaSchema', () => {
  it('acepta el estado que deja W2', () => {
    expect(estadoMiPolizaSchema.safeParse(estadoBase()).success).toBe(true);
  });

  it('rechaza un DNI que no tiene 8 dígitos', () => {
    expect(estadoMiPolizaSchema.safeParse({ ...estadoBase(), dni: '1234' }).success).toBe(false);
  });
});

describe('estadoPagoPublicoSchema', () => {
  it('acepta entre 1 y 24 cuotas sin repetidos', () => {
    expect(estadoPagoPublicoSchema.safeParse({ ...estadoBase(), cuotaIds: ids(1) }).success).toBe(
      true,
    );
    expect(estadoPagoPublicoSchema.safeParse({ ...estadoBase(), cuotaIds: ids(24) }).success).toBe(
      true,
    );
  });

  it('rechaza más de 24 cuotas', () => {
    expect(estadoPagoPublicoSchema.safeParse({ ...estadoBase(), cuotaIds: ids(25) }).success).toBe(
      false,
    );
  });

  it('rechaza cuotas repetidas', () => {
    expect(
      estadoPagoPublicoSchema.safeParse({ ...estadoBase(), cuotaIds: ['cuota-1', 'cuota-1'] })
        .success,
    ).toBe(false);
  });

  it('rechaza una lista vacía', () => {
    expect(estadoPagoPublicoSchema.safeParse({ ...estadoBase(), cuotaIds: [] }).success).toBe(
      false,
    );
  });
});

describe('leerEstadoNavegacion', () => {
  it('devuelve null sin estado', () => {
    expect(leerEstadoNavegacion(undefined)).toBeNull();
    expect(leerEstadoNavegacion(null)).toBeNull();
  });

  it('devuelve null con un objeto incompleto', () => {
    expect(leerEstadoNavegacion({ dni: '30123456' })).toBeNull();
  });

  it('devuelve null si el estado de pago trae cuotaIds vacío', () => {
    expect(leerEstadoNavegacion({ ...estadoBase(), cuotaIds: [] })).toBeNull();
  });

  it('devuelve null si el estado de pago trae cuotas repetidas', () => {
    expect(leerEstadoNavegacion({ ...estadoBase(), cuotaIds: ['cuota-1', 'cuota-1'] })).toBeNull();
  });

  it('devuelve el estado base cuando no hay cuotaIds', () => {
    const estado = leerEstadoNavegacion(estadoBase());
    expect(estado).not.toBeNull();
    expect(estado?.dni).toBe('30123456');
    expect(estado !== null && 'cuotaIds' in estado).toBe(false);
  });

  it('devuelve el estado de pago cuando las cuotas son válidas', () => {
    const estado = leerEstadoNavegacion({ ...estadoBase(), cuotaIds: ids(2) });
    expect(estado).not.toBeNull();
    expect(estado !== null && 'cuotaIds' in estado && estado.cuotaIds).toEqual(ids(2));
  });
});
