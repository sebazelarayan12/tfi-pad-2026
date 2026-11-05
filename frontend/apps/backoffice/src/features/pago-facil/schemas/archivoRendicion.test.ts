import { expect, it } from 'vitest';
import { validarArchivoRendicion } from './archivoRendicion';

const LIMITE = 5 * 1024 * 1024;
const archivo = (nombre: string, bytes = 1) => new File([new Uint8Array(bytes)], nombre);

it('rechaza una extensión distinta de txt', () => {
  expect(validarArchivoRendicion(archivo('rendicion.csv'))).toBe('Elegí un archivo .txt.');
});

it('acepta TXT en mayúsculas', () => {
  expect(validarArchivoRendicion(archivo('RENDICION.TXT'))).toBeNull();
});

it('rechaza más de 5 MB', () => {
  expect(validarArchivoRendicion(archivo('rendicion.txt', LIMITE + 1))).toBe(
    'El archivo supera el máximo de 5 MB.',
  );
});

it('acepta exactamente 5 MB', () => {
  expect(validarArchivoRendicion(archivo('rendicion.txt', LIMITE))).toBeNull();
});

it('rechaza nombres con acentos o espacios', () => {
  expect(validarArchivoRendicion(archivo('rendición.txt'))).toContain('El nombre');
  expect(validarArchivoRendicion(archivo('rendicion 1.txt'))).toContain('El nombre');
});

it('acepta hasta 90 caracteres, incluida la extensión', () => {
  expect(validarArchivoRendicion(archivo(`${'a'.repeat(86)}.txt`))).toBeNull();
  expect(validarArchivoRendicion(archivo(`${'a'.repeat(87)}.txt`))).toContain('El nombre');
});
