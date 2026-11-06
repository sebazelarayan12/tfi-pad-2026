import { describe, expect, it } from 'vitest';

import { consultaSchema, MENSAJES_CONSULTA } from './consulta';

function mensajeDe(resultado: ReturnType<typeof consultaSchema.safeParse>): string | undefined {
  return resultado.success ? undefined : resultado.error.issues[0]?.message;
}

describe('consultaSchema', () => {
  it('recorta el DNI y normaliza la póliza a mayúsculas', () => {
    const resultado = consultaSchema.safeParse({
      dni: ' 30123456 ',
      numeroPoliza: ' pol-0000042 ',
    });

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data).toEqual({ dni: '30123456', numeroPoliza: 'POL-0000042' });
    }
  });

  it('rechaza el DNI vacío con el texto de la ficha', () => {
    const resultado = consultaSchema.safeParse({ dni: '   ', numeroPoliza: 'POL-0000042' });
    expect(mensajeDe(resultado)).toBe(MENSAJES_CONSULTA.dniVacio);
  });

  it('rechaza un DNI de menos de 8 dígitos con el mensaje del back', () => {
    const resultado = consultaSchema.safeParse({ dni: '1234', numeroPoliza: 'POL-0000042' });
    expect(mensajeDe(resultado)).toBe('El DNI debe tener 8 dígitos.');
  });

  it('rechaza un DNI con puntos con el mensaje del back', () => {
    const resultado = consultaSchema.safeParse({ dni: '30.123.456', numeroPoliza: 'POL-0000042' });
    expect(mensajeDe(resultado)).toBe('El DNI debe tener 8 dígitos.');
  });

  it('rechaza la póliza vacía con el texto de la ficha', () => {
    const resultado = consultaSchema.safeParse({ dni: '30123456', numeroPoliza: '  ' });
    expect(mensajeDe(resultado)).toBe(MENSAJES_CONSULTA.numeroPolizaVacio);
  });

  it('rechaza una póliza sin el formato POL-0000000 con el mensaje del back', () => {
    const resultado = consultaSchema.safeParse({ dni: '30123456', numeroPoliza: 'POL-42' });
    expect(mensajeDe(resultado)).toBe('El número de póliza debe tener el formato POL-0000000.');
  });
});
