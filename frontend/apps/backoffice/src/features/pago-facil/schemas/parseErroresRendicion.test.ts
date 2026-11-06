import { expect, it } from 'vitest';
import { parseLineasMalFormadas } from './parseErroresRendicion';

it('separa los motivos por punto y coma y conserva las comas', () => {
  expect(
    parseLineasMalFormadas(
      'El archivo de rendición tiene líneas mal formadas: línea 1: dato, inválido; línea 2: longitud inválida',
    ),
  ).toEqual(['línea 1: dato, inválido', 'línea 2: longitud inválida']);
});

it('devuelve null para otros errores', () => {
  expect(parseLineasMalFormadas('El archivo de rendición está vacío.')).toBeNull();
});
