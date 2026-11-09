import { describe, expect, it } from 'vitest';
import { altaInicial, toVehiculoAltaRequest, vehiculoAltaSchema } from './vehiculoAltaSchema';

describe('schema: alta de vehículo', () => {
  it.each(['AB123CD', 'ABC123'])('acepta %s', (patente) => {
    expect(vehiculoAltaSchema.parse({ ...altaInicial, patente }).patente).toBe(patente);
  });

  it.each(['AB12CDE', 'ABC1234', 'A123', '', '   '])('rechaza %j', (patente) => {
    expect(vehiculoAltaSchema.safeParse({ ...altaInicial, patente }).success).toBe(false);
  });

  it('normaliza la patente antes de validar y envía uso numérico', () => {
    const valores = vehiculoAltaSchema.parse({ ...altaInicial, patente: ' ab123cd ' });
    expect(toVehiculoAltaRequest(valores, 'id-cliente')).toEqual({
      clienteId: 'id-cliente',
      patente: 'AB123CD',
      uso: 0,
    });
  });

  it('inicia con Particular y rechaza un uso vacío o desconocido', () => {
    expect(altaInicial.uso).toBe('0');
    for (const uso of ['', '2', 0]) {
      expect(vehiculoAltaSchema.safeParse({ patente: 'ABC123', uso }).success).toBe(false);
    }
  });
});
