import { describe, expect, it } from 'vitest';

import {
  loginGrupoSchema,
  MENSAJES_REGISTRO_GRUPO,
  registroGrupoSchema,
} from './registroGrupoSchema';

const VALIDO = {
  nombre: 'Estacionamiento Sur',
  contacto: 'Ana Pérez',
  email: 'ana@example.test',
  descripcion: 'Consultar seguros por patente.',
  password: 'Grupo-Demo-Mock-1!',
  confirmacion: 'Grupo-Demo-Mock-1!',
};

function mensajes(valores: object): string[] {
  const resultado = registroGrupoSchema.safeParse(valores);
  return resultado.success ? [] : resultado.error.issues.map((i) => i.message);
}

describe('registroGrupoSchema', () => {
  it('acepta una solicitud completa', () => {
    expect(registroGrupoSchema.safeParse(VALIDO).success).toBe(true);
  });

  it('exige 12 caracteres', () => {
    expect(mensajes({ ...VALIDO, password: 'Ab1!', confirmacion: 'Ab1!' })).toContain(
      MENSAJES_REGISTRO_GRUPO.passwordCorta,
    );
  });

  it('exige mayúscula, minúscula, número y símbolo', () => {
    const sinSimbolo = 'Grupodemomock12';
    expect(mensajes({ ...VALIDO, password: sinSimbolo, confirmacion: sinSimbolo })).toContain(
      MENSAJES_REGISTRO_GRUPO.passwordRequisitos,
    );
  });

  it('exige que la confirmación coincida', () => {
    expect(mensajes({ ...VALIDO, confirmacion: 'Otra-Clave-Mock-1!' })).toContain(
      MENSAJES_REGISTRO_GRUPO.confirmacionDistinta,
    );
  });

  it('exige nombre, contacto y descripción', () => {
    const faltan = mensajes({ ...VALIDO, nombre: ' ', contacto: '', descripcion: '' });
    expect(faltan).toEqual(
      expect.arrayContaining([
        MENSAJES_REGISTRO_GRUPO.nombreObligatorio,
        MENSAJES_REGISTRO_GRUPO.contactoObligatorio,
        MENSAJES_REGISTRO_GRUPO.descripcionObligatoria,
      ]),
    );
  });

  it('rechaza un email inválido', () => {
    expect(mensajes({ ...VALIDO, email: 'sin-arroba' })).toContain(
      MENSAJES_REGISTRO_GRUPO.emailInvalido,
    );
  });
});

describe('loginGrupoSchema', () => {
  it('pide email y contraseña', () => {
    expect(loginGrupoSchema.safeParse({ email: '', password: '' }).success).toBe(false);
  });
});
