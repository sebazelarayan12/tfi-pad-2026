import { describe, expect, it } from 'vitest';
import { altaInicial, toVehiculoAltaRequest, vehiculoAltaSchema } from './vehiculoAltaSchema';

const completo = {
  ...altaInicial,
  patente: 'AB123CD',
  marca: 'Toyota',
  modelo: 'Hilux',
  anio: '2023',
  numeroMotor: 'MOT123456',
  numeroChasis: 'CHA123456',
};

describe('schema: alta de vehículo', () => {
  it.each(['AB123CD', 'ABC123'])('acepta %s', (patente) => {
    expect(vehiculoAltaSchema.parse({ ...completo, patente }).patente).toBe(patente);
  });

  it.each(['AB12CDE', 'ABC1234', 'A123', '', '   '])('rechaza %j', (patente) => {
    expect(vehiculoAltaSchema.safeParse({ ...completo, patente }).success).toBe(false);
  });

  it('normaliza la patente antes de validar y envía los datos con tipos numéricos', () => {
    const valores = vehiculoAltaSchema.parse({ ...completo, patente: ' ab123cd ', tipo: '2' });
    expect(toVehiculoAltaRequest(valores, 'id-cliente')).toEqual({
      clienteId: 'id-cliente',
      patente: 'AB123CD',
      uso: 0,
      marca: 'Toyota',
      modelo: 'Hilux',
      anio: 2023,
      tipo: 2,
      numeroMotor: 'MOT123456',
      numeroChasis: 'CHA123456',
    });
  });

  it('inicia con Particular y Auto y rechaza un uso vacío o desconocido', () => {
    expect(altaInicial.uso).toBe('0');
    expect(altaInicial.tipo).toBe('0');
    for (const uso of ['', '2', 0]) {
      expect(vehiculoAltaSchema.safeParse({ ...completo, uso }).success).toBe(false);
    }
  });

  it.each(['marca', 'modelo', 'numeroMotor', 'numeroChasis'])('exige %s', (campo) => {
    expect(vehiculoAltaSchema.safeParse({ ...completo, [campo]: '   ' }).success).toBe(false);
  });

  it.each(['', '23', '1900', '3000', 'abcd'])('rechaza el año %j', (anio) => {
    expect(vehiculoAltaSchema.safeParse({ ...completo, anio }).success).toBe(false);
  });
});
