import { expect, it } from 'vitest';
import { parametrosCotizacion } from './parametrosCotizacion';

const vehiculoId = 'b1000000-0000-0000-0000-000000000001';
it('exige un Guid del vehículo y acepta que falte el cliente', () => {
  expect(parametrosCotizacion.safeParse({}).success).toBe(false);
  expect(parametrosCotizacion.safeParse({ vehiculoId: 'invalido' }).success).toBe(false);
  expect(parametrosCotizacion.parse({ vehiculoId })).toEqual({ vehiculoId });
});
