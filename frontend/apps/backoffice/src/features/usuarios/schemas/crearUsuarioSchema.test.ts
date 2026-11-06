import { describe, expect, it } from 'vitest';

import { crearUsuarioSchema } from './crearUsuarioSchema';

const valido = {
  nombre: 'Julieta',
  apellido: 'Ávila',
  email: 'julieta.avila@example.test',
  password: 'Prueba-Ficticia-1',
  rol: 'Empleado',
};

function mensajes(valores: Record<string, unknown>): string[] {
  const resultado = crearUsuarioSchema.safeParse(valores);
  return resultado.success ? [] : resultado.error.issues.map((issue) => issue.message);
}

describe('crearUsuarioSchema', () => {
  it('acepta_un_alta_completa', () => {
    expect(crearUsuarioSchema.safeParse(valido).success).toBe(true);
  });

  it('rechaza_email_invalido', () => {
    expect(mensajes({ ...valido, email: 'no-es-un-email' })).toContain(
      'El email no tiene un formato válido.',
    );
  });

  it('rechaza_email_de_mas_de_256', () => {
    const largo = `${'a'.repeat(250)}@example.test`;
    expect(mensajes({ ...valido, email: largo })).toContain(
      'El email no puede superar los 256 caracteres.',
    );
  });

  it('rechaza_rol_ausente', () => {
    expect(mensajes({ ...valido, rol: undefined })).toContain('El rol es obligatorio.');
  });

  it('rechaza_password_vacia', () => {
    expect(mensajes({ ...valido, password: '' })).toContain('La contraseña es obligatoria.');
  });

  it('no_impone_politica_de_password_en_el_front', () => {
    expect(crearUsuarioSchema.safeParse({ ...valido, password: 'abc' }).success).toBe(true);
  });

  it('no_recorta_la_password', () => {
    const resultado = crearUsuarioSchema.safeParse({ ...valido, password: '  abc  ' });
    expect(resultado.success && resultado.data.password).toBe('  abc  ');
  });
});
