import { describe, expect, it } from 'vitest';

import {
  cancelarPolizaSchema,
  MSG_MOTIVO_LARGO,
  MSG_MOTIVO_VACIO,
} from '../schemas/cancelarPolizaSchema';
import { largo, recortar } from './motivo';

const mensaje = (motivo: string) => {
  const resultado = cancelarPolizaSchema.safeParse({ motivo });
  return resultado.success ? null : resultado.error.issues[0]?.message;
};

describe('motivo', () => {
  it('recorta espacios y cuenta después de recortar', () => {
    expect(recortar('  hola  ')).toBe('hola');
    expect(largo('  hola  ')).toBe(4);
  });

  it('200 caracteres pasa y 201 falla', () => {
    expect(mensaje('a'.repeat(200))).toBeNull();
    expect(mensaje('a'.repeat(201))).toBe(MSG_MOTIVO_LARGO);
  });

  it('cuenta después de recortar: 200 con espacios en los bordes pasa', () => {
    expect(mensaje(` ${'a'.repeat(200)} `)).toBeNull();
  });

  it('vacío o solo espacios falla con el mensaje de vacío', () => {
    expect(mensaje('')).toBe(MSG_MOTIVO_VACIO);
    expect(mensaje('   ')).toBe(MSG_MOTIVO_VACIO);
  });
});
