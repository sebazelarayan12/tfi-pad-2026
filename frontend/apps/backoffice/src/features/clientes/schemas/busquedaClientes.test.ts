import { describe, expect, it } from 'vitest';
import { busquedaClientes } from './busquedaClientes';

describe('búsqueda de clientes', () => {
  it.each([
    ['30.123.456', { dni: '30123456' }],
    [' 30 123 456 ', { dni: '30123456' }],
    ['30123456', { dni: '30123456' }],
    [' pér ', { apellido: 'pér' }],
    ['3051', { apellido: '3051' }],
    ['3051246', { apellido: '3051246' }],
    ['', {}],
    ['   ', {}],
    ['..', {}],
  ])('normaliza %s', (entrada, filtro) => expect(busquedaClientes.parse(entrada)).toEqual(filtro));
  it('limita a 100 caracteres y admite el borde', () => {
    expect(busquedaClientes.safeParse('a'.repeat(101)).success).toBe(false);
    expect(busquedaClientes.safeParse('a'.repeat(100)).success).toBe(true);
  });
});
