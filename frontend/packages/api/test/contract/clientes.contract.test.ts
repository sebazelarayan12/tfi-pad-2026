// @vitest-environment node
import { beforeEach } from 'vitest';
import { z } from 'zod';
import type {
  ClienteResponse,
  ClienteResumenResponse,
  CuentaClienteResponse,
  CuotaResponse,
} from '../../src';
import {
  CLIENTE_JUAN_ID,
  CLIENTE_LUCIA_ID,
  tokensMockClientes,
} from '../../mocks/fixtures/clientes';
import { crearHandlersClientes } from '../../mocks/handlers/clientes';
import { servidorMock } from '../../mocks/server';
import { contratoEndpoint, type CasoError } from './harness';
import { fetchContrato, leerConfiguracion } from './setup';

const esMock = leerConfiguracion().objetivo === 'mock';
beforeEach(() => {
  if (esMock) servidorMock.use(...crearHandlersClientes());
});

// .NET Guid permits the fixed seed values without RFC UUID version/variant bits.
const esquemaGuid = z.string().regex(/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i);
const esquemaResumen = z.strictObject({
  id: esquemaGuid,
  dni: z.string().regex(/^\d{8}$/),
  nombre: z.string(),
  apellido: z.string(),
  email: z.string(),
  telefono: z.string().nullable(),
  activo: z.boolean(),
}) satisfies z.ZodType<ClienteResumenResponse>;
const esquemaCliente = z.looseObject({
  ...esquemaResumen.shape,
  cuil: z.string().regex(/^\d{11}$/),
  fechaNacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sexo: z.enum(['M', 'F', 'X']),
  calle: z.string(),
  numero: z.string(),
  localidad: z.string(),
  provincia: z.string(),
  codigoPostal: z.string(),
  validadoRenaper: z.boolean(),
  fechaValidacionRenaper: z.string().nullable(),
}) satisfies z.ZodType<ClienteResponse>;
const esquemaCuota = z.looseObject({
  id: esquemaGuid,
  numero: z.number().int(),
  importe: z.number(),
  recargo: z.number(),
  fechaVencimiento: z.string(),
  estado: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  fechaPago: z.string().nullable(),
}) satisfies z.ZodType<CuotaResponse>;
const esquemaCuenta = z.looseObject({
  deudaVencida: z.number(),
  cuotaVencidaConRecargo: esquemaCuota.nullable(),
  proximaCuota: esquemaCuota.nullable(),
}) satisfies z.ZodType<CuentaClienteResponse>;
const esquemaPagina = z.looseObject({
  items: z.array(esquemaResumen),
  pagina: z.number().int(),
  tamanoPagina: z.number().int(),
  total: z.number().int(),
});
const inexistente = '00000000-0000-0000-0000-000000000099';
const json = { 'Content-Type': 'application/json' };
const contacto = {
  email: 'lucia.actualizada@ejemplo.com',
  telefono: null,
  calle: 'Rivadavia',
  numero: '456',
  localidad: 'Yerba Buena',
  provincia: 'Tucumán',
  codigoPostal: '4107',
};

/** Real-mode fixtures must be explicitly selected; never delete an arbitrary production client. */
function idFixture(
  variable: 'CONTRACT_CLIENTE_ID' | 'CONTRACT_CLIENTE_BAJA_ID' | 'CONTRACT_CLIENTE_CON_POLIZA_ID',
): string {
  if (esMock) return variable === 'CONTRACT_CLIENTE_BAJA_ID' ? CLIENTE_LUCIA_ID : CLIENTE_JUAN_ID;
  const valor = process.env[variable];
  if (!valor)
    throw new Error(
      `Falta ${variable}: seleccionar un cliente de prueba para los contratos reales de clientes.`,
    );
  return valor;
}
function rutaCliente(id: string): string {
  return `/api/clientes/${encodeURIComponent(id)}`;
}

function erroresAuth(ruta: string, metodo = 'GET', cuerpo?: unknown): CasoError[] {
  const opciones = {
    method: metodo,
    headers: json,
    ...(cuerpo === undefined ? {} : { body: JSON.stringify(cuerpo) }),
  };
  return [
    {
      nombre: 'sin sesión',
      estado: 401,
      esquema: 'problem',
      request: () => fetchContrato(ruta, opciones),
    },
    ...(esMock
      ? [
          {
            nombre: 'rol no admitido (fixture MSW)',
            estado: 403,
            esquema: 'problem' as const,
            request: () =>
              fetchContrato(ruta, {
                ...opciones,
                headers: { ...json, Authorization: `Bearer ${tokensMockClientes.sinPermiso}` },
              }),
          },
        ]
      : []),
  ];
}

contratoEndpoint({
  nombre: 'Listado real de siete campos',
  metodo: 'GET',
  ruta: '/api/clientes',
  requiereSesion: true,
  destructivo: false,
  exito: {
    estado: 200,
    esquema: esquemaPagina,
    request: () => fetchContrato('/api/clientes', { conSesion: true }),
  },
  errores: [
    ...erroresAuth('/api/clientes'),
    {
      nombre: 'tamaño fuera de rango',
      estado: 400,
      esquema: 'validation',
      request: () => fetchContrato('/api/clientes?tamanoPagina=101', { conSesion: true }),
    },
  ],
});
contratoEndpoint({
  nombre: 'Detalle del cliente activo',
  metodo: 'GET',
  ruta: '/api/clientes/{id}',
  requiereSesion: true,
  destructivo: false,
  exito: {
    estado: 200,
    esquema: esquemaCliente,
    request: () =>
      fetchContrato(rutaCliente(idFixture('CONTRACT_CLIENTE_ID')), { conSesion: true }),
  },
  errores: [
    ...erroresAuth(rutaCliente(inexistente)),
    {
      nombre: 'cliente inexistente',
      estado: 404,
      esquema: 'problem',
      request: () => fetchContrato(rutaCliente(inexistente), { conSesion: true }),
    },
  ],
});
contratoEndpoint({
  nombre: 'Modificar contacto y domicilio',
  metodo: 'PUT',
  ruta: '/api/clientes/{id}',
  requiereSesion: true,
  destructivo: true,
  exito: {
    estado: 200,
    esquema: esquemaCliente,
    request: async () => {
      const ruta = rutaCliente(esMock ? CLIENTE_LUCIA_ID : idFixture('CONTRACT_CLIENTE_ID'));
      // In real mode preserve the selected client's current contact values.
      const actual = esMock
        ? null
        : esquemaCliente.parse(await (await fetchContrato(ruta, { conSesion: true })).json());
      const cuerpo = actual
        ? {
            email: actual.email,
            telefono: actual.telefono,
            calle: actual.calle,
            numero: actual.numero,
            localidad: actual.localidad,
            provincia: actual.provincia,
            codigoPostal: actual.codigoPostal,
          }
        : contacto;
      return fetchContrato(ruta, {
        method: 'PUT',
        headers: json,
        body: JSON.stringify(cuerpo),
        conSesion: true,
      });
    },
  },
  errores: [
    ...erroresAuth(rutaCliente(inexistente), 'PUT', contacto),
    {
      nombre: 'campos requeridos',
      estado: 400,
      esquema: 'validation',
      request: () =>
        fetchContrato(rutaCliente(inexistente), {
          method: 'PUT',
          headers: json,
          body: '{}',
          conSesion: true,
        }),
    },
    {
      nombre: 'inexistente con body válido',
      estado: 404,
      esquema: 'problem',
      request: () =>
        fetchContrato(rutaCliente(inexistente), {
          method: 'PUT',
          headers: json,
          body: JSON.stringify(contacto),
          conSesion: true,
        }),
    },
    ...(esMock
      ? [
          {
            nombre: 'email de otro cliente',
            estado: 400,
            esquema: 'problem' as const,
            request: () =>
              fetchContrato(rutaCliente(CLIENTE_LUCIA_ID), {
                method: 'PUT',
                headers: json,
                body: JSON.stringify({ ...contacto, email: 'juan.perez@ejemplo.com' }),
                conSesion: true,
              }),
          },
        ]
      : []),
  ],
});
contratoEndpoint({
  nombre: 'Baja lógica sin cuerpo',
  metodo: 'DELETE',
  ruta: '/api/clientes/{id}',
  requiereSesion: true,
  destructivo: true,
  exito: {
    estado: 204,
    request: () =>
      fetchContrato(rutaCliente(idFixture('CONTRACT_CLIENTE_BAJA_ID')), {
        method: 'DELETE',
        conSesion: true,
      }),
  },
  errores: [
    ...erroresAuth(rutaCliente(inexistente), 'DELETE'),
    {
      nombre: 'cliente inexistente',
      estado: 404,
      esquema: 'problem',
      request: () => fetchContrato(rutaCliente(inexistente), { method: 'DELETE', conSesion: true }),
    },
    {
      nombre: 'póliza activa impide baja',
      estado: 400,
      esquema: 'problem',
      request: () =>
        fetchContrato(rutaCliente(idFixture('CONTRACT_CLIENTE_CON_POLIZA_ID')), {
          method: 'DELETE',
          conSesion: true,
        }),
    },
  ],
});
contratoEndpoint({
  nombre: 'Cuenta propuesta (PB-28, exclusivamente MSW)',
  metodo: 'GET',
  ruta: '/api/clientes/{id}/cuenta',
  requiereSesion: true,
  destructivo: false,
  soloMock: true,
  exito: {
    estado: 200,
    esquema: esquemaCuenta,
    request: () => fetchContrato(`${rutaCliente(CLIENTE_JUAN_ID)}/cuenta`, { conSesion: true }),
  },
  errores: [
    ...erroresAuth(`${rutaCliente(CLIENTE_JUAN_ID)}/cuenta`),
    {
      nombre: 'cliente inexistente',
      estado: 404,
      esquema: 'problem',
      request: () => fetchContrato(`${rutaCliente(inexistente)}/cuenta`, { conSesion: true }),
    },
  ],
});
