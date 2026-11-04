import { expect, it } from 'vitest';
import { traducirMensajeValidacion } from '@nexa/api';

it.each([
  ['The Dni field is required.', 'Este campo es obligatorio.'],
  ['The Email field is not a valid e-mail address.', 'Ingresá un email válido.'],
  [
    "The field Nombre must be a string or array type with a maximum length of '100'.",
    'Supera el largo máximo de 100 caracteres.',
  ],
  ['El email es obligatorio.', 'El email es obligatorio.'],
  ['The field Nombre is invalid.', 'Revisá este campo.'],
])('traduce o conserva %s', (mensaje, esperado) => {
  expect(traducirMensajeValidacion(mensaje, 'Campo')).toBe(esperado);
});
