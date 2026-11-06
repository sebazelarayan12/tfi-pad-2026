import { describe, expect, it } from 'vitest';

import { cambiarPasswordSchema } from './cambiarPasswordSchema';

// Contraseñas ficticias solo para estos tests.
const TEMPORAL = 'Temporal-Ficticia-1';
const FUERTE = 'Definitiva-Ficticia-2';

function validar(passwordNueva: string, extra: { passwordActual?: string; repetir?: string } = {}) {
  return cambiarPasswordSchema.safeParse({
    passwordActual: extra.passwordActual ?? TEMPORAL,
    passwordNueva,
    repetir: extra.repetir ?? passwordNueva,
  });
}

function mensajes(resultado: ReturnType<typeof validar>): string[] {
  return resultado.success ? [] : resultado.error.issues.map((issue) => issue.message);
}

describe('cambiarPasswordSchema', () => {
  it('rechaza_menos_de_12_caracteres', () => {
    expect(mensajes(validar('Aa-1bcdefgh'))).toContain('Usá al menos 12 caracteres.');
  });

  it('rechaza_sin_mayuscula', () => {
    expect(mensajes(validar('definitiva-ficticia-2'))).toContain('Agregá una mayúscula.');
  });

  it('rechaza_sin_minuscula', () => {
    expect(mensajes(validar('DEFINITIVA-FICTICIA-2'))).toContain('Agregá una minúscula.');
  });

  it('rechaza_sin_numero', () => {
    expect(mensajes(validar('Definitiva-Ficticia-x'))).toContain('Agregá un número.');
  });

  it('rechaza_sin_simbolo', () => {
    expect(mensajes(validar('DefinitivaFicticia2'))).toContain('Agregá un símbolo.');
  });

  it('acepta_una_password_fuerte', () => {
    expect(validar(FUERTE).success).toBe(true);
  });

  it('rechaza_repeticion_distinta', () => {
    expect(mensajes(validar(FUERTE, { repetir: 'Otra-Ficticia-3x' }))).toContain(
      'Las contraseñas no coinciden.',
    );
  });

  it('rechaza_nueva_igual_a_la_temporal', () => {
    expect(mensajes(validar(TEMPORAL))).toContain(
      'La contraseña nueva debe ser distinta de la temporal.',
    );
  });

  it('rechaza_actual_vacia', () => {
    expect(mensajes(validar(FUERTE, { passwordActual: '' }))).toContain('Ingresá la contraseña temporal.');
  });

  it('no_recorta_las_passwords', () => {
    const resultado = validar(' Definitiva-Ficticia-2 ');
    expect(resultado.success).toBe(true);
    if (resultado.success) expect(resultado.data.passwordNueva).toBe(' Definitiva-Ficticia-2 ');
  });
});
