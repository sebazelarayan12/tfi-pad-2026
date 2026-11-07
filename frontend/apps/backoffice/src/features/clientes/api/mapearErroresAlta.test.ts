import { ApiError } from '@nexa/api';
import { describe, expect, it } from 'vitest';

import { MENSAJE_GENERAL_ALTA, mapearErroresAlta } from './mapearErroresAlta';

function http(status: number, cuerpo: Record<string, unknown> = {}) {
  return new ApiError({ kind: 'http', status, ...cuerpo });
}

describe('mapearErroresAlta', () => {
  it('400 con errors en PascalCase marca el campo y traduce el inglés', () => {
    const resultado = mapearErroresAlta(
      http(400, {
        errors: { Dni: ['El DNI debe tener 8 dígitos.'], Email: ['The Email field is required.'] },
      }),
    );
    expect(resultado.campos).toEqual({
      dni: 'El DNI debe tener 8 dígitos.',
      email: 'Este campo es obligatorio.',
    });
    expect(resultado.general).toBeNull();
  });

  it('la clave se compara sin distinguir mayúsculas', () => {
    expect(
      mapearErroresAlta(http(400, { errors: { FECHANACIMIENTO: ['x'] } })).campos,
    ).toHaveProperty('fechaNacimiento');
    expect(mapearErroresAlta(http(400, { errors: { codigoPostal: ['x'] } })).campos).toHaveProperty(
      'codigoPostal',
    );
  });

  it('una clave desconocida va al aviso general', () => {
    const resultado = mapearErroresAlta(
      http(400, { errors: { $: ['Invalid JSON.'], Dni: ['El DNI debe tener 8 dígitos.'] } }),
    );
    expect(resultado.campos).toHaveProperty('dni');
    expect(resultado.general).toBe(MENSAJE_GENERAL_ALTA);
  });

  it('solo claves desconocidas: aviso general y ningún campo', () => {
    const resultado = mapearErroresAlta(http(400, { errors: { request: ['x'] } }));
    expect(resultado).toEqual({ campos: {}, general: MENSAJE_GENERAL_ALTA });
  });

  it('400 con detail de negocio: texto sin el prefijo RNxx y ningún campo', () => {
    const resultado = mapearErroresAlta(
      http(400, { detail: "RN01: Ya existe un cliente con el DNI '30123456'." }),
    );
    expect(resultado).toEqual({
      campos: {},
      general: "Ya existe un cliente con el DNI '30123456'.",
    });
  });

  it('5xx, 403 y sin conexión: aviso general', () => {
    expect(mapearErroresAlta(http(500)).general).toBe(MENSAJE_GENERAL_ALTA);
    expect(mapearErroresAlta(http(403)).general).toBe(MENSAJE_GENERAL_ALTA);
    expect(mapearErroresAlta(new ApiError({ kind: 'red', status: 0 })).general).toBe(
      MENSAJE_GENERAL_ALTA,
    );
    expect(mapearErroresAlta(new Error('x')).general).toBe(MENSAJE_GENERAL_ALTA);
  });
});
