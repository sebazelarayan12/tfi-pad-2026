import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { altaClienteSchema, MENSAJES_ALTA, type AltaClienteFormValues } from './altaClienteSchema';
import {
  aFechaIso,
  deFechaIso,
  edadEnAnios,
  enmascararCuil,
  enmascararFecha,
  esTelefonoArgentino,
  fechaMaximaNacimiento,
  leerFecha,
} from './formatos';
import { normalizarAltaCliente } from './normalizarAltaCliente';
import { PROVINCIAS } from './provincias';

const VALIDO: AltaClienteFormValues = {
  dni: '30.123.456',
  sexo: 'F',
  nombre: ' Ana ',
  apellido: 'Gómez',
  cuil: '27-30123456-4',
  fechaNacimiento: '14/02/1990',
  email: ' ana@example.test ',
  telefono: '',
  calle: 'Calle Falsa',
  numero: '123',
  localidad: 'Rosario',
  provincia: 'Santa Fe',
  codigoPostal: '2000',
};

function mensajes(valores: Partial<AltaClienteFormValues>) {
  const resultado = altaClienteSchema.safeParse({ ...VALIDO, ...valores });
  if (resultado.success) return {};
  // El formulario muestra el primer mensaje de cada campo.
  const primeros: Record<string, string> = {};
  for (const issue of resultado.error.issues) primeros[String(issue.path[0])] ??= issue.message;
  return primeros;
}

beforeEach(() => {
  vi.useFakeTimers();
  // 07/11/2026, mediodía en Argentina.
  vi.setSystemTime(new Date('2026-11-07T15:00:00Z'));
});
afterEach(() => vi.useRealTimers());

describe('altaClienteSchema', () => {
  it('acepta un alta válida y limpia DNI, CUIL y espacios', () => {
    const resultado = altaClienteSchema.parse(VALIDO);
    expect(resultado).toMatchObject({
      dni: '30123456',
      cuil: '27301234564',
      nombre: 'Ana',
      email: 'ana@example.test',
    });
  });

  it('DNI vacío y de 7 dígitos son inválidos; con puntos es válido', () => {
    expect(mensajes({ dni: '' }).dni).toBe(MENSAJES_ALTA.dni);
    expect(mensajes({ dni: '1234567' }).dni).toBe(MENSAJES_ALTA.dni);
    expect(mensajes({ dni: '35.874.219' }).dni).toBeUndefined();
  });

  it('CUIL de 10 dígitos es inválido; con máscara es válido', () => {
    expect(mensajes({ cuil: '27-3012345-4' }).cuil).toBe(MENSAJES_ALTA.cuil);
    expect(mensajes({ cuil: '27-30123456-4' }).cuil).toBeUndefined();
  });

  it('nombre y apellido vacíos muestran sus textos', () => {
    expect(mensajes({ nombre: '  ' }).nombre).toBe(MENSAJES_ALTA.nombre);
    expect(mensajes({ apellido: '' }).apellido).toBe(MENSAJES_ALTA.apellido);
  });

  it('fecha vacía, inválida y de menor de 18 años', () => {
    expect(mensajes({ fechaNacimiento: '' }).fechaNacimiento).toBe(MENSAJES_ALTA.fechaObligatoria);
    expect(mensajes({ fechaNacimiento: '31/02/1990' }).fechaNacimiento).toBe(
      MENSAJES_ALTA.fechaInvalida,
    );
    expect(mensajes({ fechaNacimiento: '1990-02-14' }).fechaNacimiento).toBe(
      MENSAJES_ALTA.fechaInvalida,
    );
    expect(mensajes({ fechaNacimiento: '14/02/2010' }).fechaNacimiento).toBe(MENSAJES_ALTA.menor);
  });

  it('cumple 18 años justo hoy: válido; mañana: menor', () => {
    expect(mensajes({ fechaNacimiento: '07/11/2008' }).fechaNacimiento).toBeUndefined();
    expect(mensajes({ fechaNacimiento: '08/11/2008' }).fechaNacimiento).toBe(MENSAJES_ALTA.menor);
  });

  it('email vacío e inválido', () => {
    expect(mensajes({ email: '' }).email).toBe(MENSAJES_ALTA.emailObligatorio);
    expect(mensajes({ email: 'sin-arroba' }).email).toBe(MENSAJES_ALTA.emailFormato);
  });

  it('sexo y provincia sin elegir', () => {
    expect(mensajes({ sexo: '' }).sexo).toBe(MENSAJES_ALTA.sexo);
    expect(mensajes({ provincia: '' }).provincia).toBe(MENSAJES_ALTA.provincia);
    expect(mensajes({ provincia: 'Atlántida' }).provincia).toBe(MENSAJES_ALTA.provincia);
  });

  it('calle, localidad, número y código postal obligatorios', () => {
    expect(mensajes({ calle: '' }).calle).toBe(MENSAJES_ALTA.calle);
    expect(mensajes({ localidad: '' }).localidad).toBe(MENSAJES_ALTA.localidad);
    expect(mensajes({ numero: '' }).numero).toBe(MENSAJES_ALTA.numero);
    expect(mensajes({ codigoPostal: '' }).codigoPostal).toBe(MENSAJES_ALTA.codigoPostal);
  });

  it('número y código postal solo admiten dígitos (D-B05-8)', () => {
    expect(mensajes({ numero: '12B' }).numero).toBe(MENSAJES_ALTA.numeroFormato);
    expect(mensajes({ numero: 'S/N' }).numero).toBe(MENSAJES_ALTA.numeroFormato);
    expect(mensajes({ codigoPostal: 'S2000' }).codigoPostal).toBe(
      MENSAJES_ALTA.codigoPostalFormato,
    );
    expect(mensajes({ numero: '1450', codigoPostal: '4000' })).toEqual({});
  });

  it('respeta los máximos del back', () => {
    expect(mensajes({ nombre: 'a'.repeat(101) }).nombre).toBeDefined();
    expect(mensajes({ email: `${'a'.repeat(150)}@x.test` }).email).toBeDefined();
    expect(mensajes({ codigoPostal: '1'.repeat(11) }).codigoPostal).toBeDefined();
  });

  it('el teléfono vacío es válido y uno con formato argentino también (D-B05-9)', () => {
    expect(mensajes({ telefono: '' }).telefono).toBeUndefined();
    expect(mensajes({ telefono: '11 2345-6789' }).telefono).toBeUndefined();
    expect(mensajes({ telefono: '12345' }).telefono).toBe(MENSAJES_ALTA.telefono);
    expect(mensajes({ telefono: 'abc' }).telefono).toBe(MENSAJES_ALTA.telefono);
  });
});

describe('esTelefonoArgentino', () => {
  it.each([
    '1123456789',
    '11 2345-6789',
    '(011) 2345-6789',
    '011 2345 6789',
    '0381 456-7890',
    '+54 11 2345-6789',
    '+54 9 11 2345-6789',
    '+5491123456789',
    '343.456.7890',
  ])('%s es válido', (telefono) => expect(esTelefonoArgentino(telefono)).toBe(true));

  it.each([
    '',
    '123',
    '112345678',
    '11234567890',
    '+34 91 123 4567',
    '+54 0 11 2345-6789',
    '011 15 2345 6789',
    '0000000000',
    '11-2345-67ab',
    '++5491123456789',
  ])('%s es inválido', (telefono) => expect(esTelefonoArgentino(telefono)).toBe(false));
});

describe('provincias', () => {
  it('son 24 y empiezan y terminan en el orden de B4', () => {
    expect(PROVINCIAS).toHaveLength(24);
    expect(PROVINCIAS[0]).toBe('Buenos Aires');
    expect(PROVINCIAS[23]).toBe('Tucumán');
  });
});

describe('formatos de fecha', () => {
  it('leerFecha valida el calendario real', () => {
    expect(leerFecha('29/02/2024')).toEqual({ anio: 2024, mes: 2, dia: 29 });
    expect(leerFecha('29/02/2023')).toBeNull();
    expect(leerFecha('00/01/2000')).toBeNull();
    expect(leerFecha('1/1/2000')).toBeNull();
    expect(leerFecha('01/01/1800')).toBeNull();
  });

  it('edadEnAnios usa la fecha de Argentina, no la UTC', () => {
    // 07/11/2026 02:00 UTC todavía es 06/11 en Argentina.
    const ahora = new Date('2026-11-07T02:00:00Z');
    expect(edadEnAnios({ anio: 2008, mes: 11, dia: 6 }, ahora)).toBe(18);
    expect(edadEnAnios({ anio: 2008, mes: 11, dia: 7 }, ahora)).toBe(17);
  });

  it('convierte entre dd/mm/aaaa y yyyy-MM-dd', () => {
    expect(aFechaIso('14/02/1990')).toBe('1990-02-14');
    expect(deFechaIso('1990-02-14')).toBe('14/02/1990');
  });

  it('la fecha máxima del calendario es hoy menos 18 años', () => {
    expect(fechaMaximaNacimiento()).toBe('2008-11-07');
    expect(fechaMaximaNacimiento(new Date('2028-02-29T15:00:00Z'))).toBe('2010-02-28');
  });

  it('enmascara fecha y CUIL mientras se escribe', () => {
    expect(enmascararFecha('1402')).toBe('14/02');
    expect(enmascararFecha('14021990')).toBe('14/02/1990');
    expect(enmascararFecha('14/02/19901234')).toBe('14/02/1990');
    expect(enmascararCuil('2730123456')).toBe('27-30123456');
    expect(enmascararCuil('27301234564')).toBe('27-30123456-4');
  });
});

describe('normalizarAltaCliente', () => {
  it('arma el body de ClienteAltaRequest con fecha ISO y teléfono null', () => {
    const body = normalizarAltaCliente(altaClienteSchema.parse(VALIDO));
    expect(body).toEqual({
      dni: '30123456',
      sexo: 'F',
      nombre: 'Ana',
      apellido: 'Gómez',
      cuil: '27301234564',
      fechaNacimiento: '1990-02-14',
      email: 'ana@example.test',
      telefono: null,
      calle: 'Calle Falsa',
      numero: '123',
      localidad: 'Rosario',
      provincia: 'Santa Fe',
      codigoPostal: '2000',
    });
  });

  it('conserva el teléfono escrito (sin la barra de relleno)', () => {
    const body = normalizarAltaCliente(
      altaClienteSchema.parse({ ...VALIDO, telefono: ' 11 2345-6789 ' }),
    );
    expect(body.telefono).toBe('11 2345-6789');
  });
});
