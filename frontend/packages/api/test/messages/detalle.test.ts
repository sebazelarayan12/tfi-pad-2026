import { expect, it } from 'vitest';
import { ApiError, leerMensajeDetalle } from '@nexa/api';

it.each([
  [{ detail: 'RN01: El DNI ya existe.' }, null, 'El DNI ya existe.'],
  [{ detail: 'VEHICULO_NO_ENCONTRADO: No figura.' }, 'VEHICULO_NO_ENCONTRADO', 'No figura.'],
  [
    { detail: 'VEHICULO_NO_ENCONTRADO: RN02: No figura.', codigo: 'EXPLICITO' },
    'EXPLICITO',
    'No figura.',
  ],
  [{ detail: null }, null, 'Ocurrió un error inesperado.'],
  [{ detail: 'RN01:  ' }, null, 'Ocurrió un error inesperado.'],
  [{ detail: 'Credenciales inválidas.' }, null, 'Credenciales inválidas.'],
] as const)('normaliza %j', (problema, codigo, mensaje) => {
  expect(leerMensajeDetalle(problema)).toEqual({ codigo, mensaje });
});

it('acepta un ApiError con código nulo', () => {
  const error = new ApiError({ status: 400, kind: 'http', detail: 'RN01: DNI duplicado.' });
  expect(leerMensajeDetalle(error)).toEqual({ codigo: null, mensaje: 'DNI duplicado.' });
});
