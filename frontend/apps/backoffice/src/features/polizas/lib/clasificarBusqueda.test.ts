import { describe, expect, it } from 'vitest';

import { clasificarBusqueda } from './clasificarBusqueda';

describe('clasificarBusqueda', () => {
  it('POL-0000042 es un número de póliza', () => {
    expect(clasificarBusqueda('POL-0000042')).toEqual({ tipo: 'numero', valor: 'POL-0000042' });
  });

  it.each(['30123456', '3012345'])('%s es un DNI de 7 u 8 dígitos', (texto) => {
    expect(clasificarBusqueda(texto)).toEqual({ tipo: 'dni', valor: texto });
  });

  it.each(['30.123.456', '301234', '301234567'])('%s no es un DNI', (texto) => {
    expect(clasificarBusqueda(texto)?.tipo).toBe('invalido');
  });

  it.each(['AE789FG', 'ABC123'])('%s es una patente de cualquiera de los dos formatos', (texto) => {
    expect(clasificarBusqueda(texto)).toEqual({ tipo: 'patente', valor: texto });
  });

  it('recorta espacios y pasa a mayúsculas', () => {
    expect(clasificarBusqueda('  ae789fg ')).toEqual({ tipo: 'patente', valor: 'AE789FG' });
    expect(clasificarBusqueda(' pol-0000042 ')).toEqual({ tipo: 'numero', valor: 'POL-0000042' });
  });

  it.each(['hola 123', 'AE 789 FG', 'AE-789-FG', 'POL-42'])('%s es inválido', (texto) => {
    expect(clasificarBusqueda(texto)?.tipo).toBe('invalido');
  });

  it.each(['', '   '])('el texto vacío no es una búsqueda ni es inválido', (texto) => {
    expect(clasificarBusqueda(texto)).toBeUndefined();
  });
});
