// @vitest-environment node
import { beforeEach } from 'vitest';
import { z } from 'zod';
import type {
  ClienteResponse,
  ClienteResumenResponse,
  CuentaClienteResponse,
  CuotaResponse,
  PersonaRenaperResponse,
} from '../../src';
import {
  CLIENTE_JUAN_ID,
  CLIENTE_LUCIA_ID,
  tokensMockClientes,
} from '../../mocks/fixtures/clientes';
import { crearHandlersClientes } from '../../mocks/handlers/clientes';
import { altaClienteFixture } from '../../mocks/fixtures/renaper';
import { servidorMock } from '../../mocks/server';
import { contratoEndpoint, type CasoError } from './harness';
import { fetchContrato, leerConfiguracion } from './setup';

const esMock = leerConfiguracion().objetivo === 'mock';
beforeEach(() => {
  if (esMock) servidorMock.use(...crearHandlersClientes());
});

// Guid de .NET admite los valores fijos del seed sin exigir bits de versión o variante RFC UUID.
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

/** El modo real exige seleccionar clientes de prueba; nunca elimina un cliente arbitrario. */
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
      // En modo real se conservan los datos de contacto actuales del cliente seleccionado.
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

// T-25: mismos endpoints en MSW y en el backend publicado; sin ampliar el resumen de T-24.
const esquemaDomicilioRenaper = z.strictObject({
  calle: z.string(),
  numero: z.string(),
  piso: z.string().nullable(),
  depto: z.string().nullable(),
  localidad: z.string(),
  provincia: z.string(),
  codigoPostal: z.string(),
});
const esquemaPersonaRenaper = z.strictObject({
  dni: z.string().regex(/^\d{8}$/),
  cuil: z.string().regex(/^\d{11}$/),
  nombre: z.string(),
  apellido: z.string(),
  fechaNacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sexo: z.enum(['M', 'F', 'X']),
  domicilio: esquemaDomicilioRenaper,
  estado: z.enum(['VIGENTE', 'FALLECIDO']),
  fechaFallecimiento: z.string().nullable(),
}) satisfies z.ZodType<PersonaRenaperResponse>;
const esquemaClienteExacto = esquemaCliente.strict();
let clienteCreadoT25: string | undefined;
function cuerpoAltaT25() {
  if (esMock) return altaClienteFixture;
  if (!process.env.CONTRACT_ALTA_DNI || !process.env.CONTRACT_ALTA_EMAIL)
    throw new Error(
      'Faltan CONTRACT_ALTA_DNI y CONTRACT_ALTA_EMAIL: seleccionar una persona adulta de Renaper no registrada en un entorno de prueba aislado.',
    );
  return {
    ...altaClienteFixture,
    dni: process.env.CONTRACT_ALTA_DNI,
    email: process.env.CONTRACT_ALTA_EMAIL,
  };
}
const rutaAltaT25 = '/api/clientes';
const rutaPreviewT25 = '/api/clientes/renaper/30123456';
const rutaValidarT25 = () =>
  `${rutaCliente(esMock ? CLIENTE_JUAN_ID : clienteCreadoT25 || process.env.CONTRACT_CLIENTE_VALIDAR_ID || idFixture('CONTRACT_CLIENTE_ID'))}/validar-renaper`;
const enviarAltaT25 = (body: unknown) =>
  fetchContrato(rutaAltaT25, {
    method: 'POST',
    headers: json,
    body: JSON.stringify(body),
    conSesion: true,
  });
contratoEndpoint({
  nombre: 'T-25 alta con identidad oficial y contrato exacto',
  metodo: 'POST',
  ruta: rutaAltaT25,
  requiereSesion: true,
  destructivo: true,
  exito: {
    estado: 201,
    esquema: esquemaClienteExacto,
    request: async () => {
      if (esMock) servidorMock.use(...crearHandlersClientes([]));
      const respuesta = await enviarAltaT25(cuerpoAltaT25());
      if (respuesta.status === 201) {
        const cliente = esquemaClienteExacto.parse(await respuesta.clone().json());
        clienteCreadoT25 = cliente.id;
      }
      return respuesta;
    },
  },
  errores: [
    ...erroresAuth(rutaAltaT25, 'POST', {}),
    {
      nombre: 'campos obligatorios',
      estado: 400,
      esquema: 'validation',
      request: () => enviarAltaT25({}),
    },
    {
      nombre: 'DNI y CUIL con separadores',
      estado: 400,
      esquema: 'validation',
      request: () =>
        enviarAltaT25({ ...altaClienteFixture, dni: '30.123.456', cuil: '20-30123456-5' }),
    },
    ...(
      [
        ['fechaNacimiento', '2026-02-30'],
        ['sexo', 'XX'],
      ] as const
    ).map(([campo, valor]): CasoError => ({
      nombre: `deserialización de ${campo}`,
      estado: 400,
      esquema: 'validation',
      request: async () => {
        const respuesta = await enviarAltaT25({ ...altaClienteFixture, [campo]: valor });
        z.object({
          errors: z.strictObject({
            request: z.array(z.string()).min(1),
            [`$.${campo}`]: z.array(z.string()).min(1),
          }),
        }).parse(await respuesta.clone().json());
        return respuesta;
      },
    })),
    {
      nombre: 'persona desconocida (400, sin código)',
      estado: 400,
      esquema: 'problem',
      request: () =>
        enviarAltaT25({ ...altaClienteFixture, dni: '99999999', email: 'nofigura@ejemplo.com' }),
    },
    {
      nombre: 'persona fallecida',
      estado: 400,
      esquema: 'problem',
      request: () =>
        enviarAltaT25({ ...altaClienteFixture, dni: '20111222', email: 'fallecido@ejemplo.com' }),
    },
    {
      nombre: 'persona menor',
      estado: 400,
      esquema: 'problem',
      request: () => {
        if (esMock) servidorMock.use(...crearHandlersClientes([]));
        return enviarAltaT25({
          ...altaClienteFixture,
          dni: '45123456',
          email: 'menor@ejemplo.com',
        });
      },
    },
  ],
});
contratoEndpoint({
  nombre: 'T-25 preview de Renaper con campos exactos',
  metodo: 'GET',
  ruta: '/api/clientes/renaper/{dni}',
  requiereSesion: true,
  destructivo: false,
  exito: {
    estado: 200,
    esquema: esquemaPersonaRenaper,
    request: () => fetchContrato(rutaPreviewT25, { conSesion: true }),
  },
  errores: [
    ...erroresAuth(rutaPreviewT25),
    {
      nombre: 'DNI inválido',
      estado: 400,
      esquema: 'problem',
      request: () => fetchContrato('/api/clientes/renaper/123', { conSesion: true }),
    },
    {
      nombre: 'PERSONA_NO_ENCONTRADA',
      estado: 404,
      esquema: 'problem',
      request: async () => {
        const respuesta = await fetchContrato('/api/clientes/renaper/99999999', {
          conSesion: true,
        });
        const body: unknown = await respuesta.clone().json();
        z.object({ codigo: z.literal('PERSONA_NO_ENCONTRADA') }).parse(body);
        return respuesta;
      },
    },
  ],
});
contratoEndpoint({
  nombre: 'T-25 revalidación explícita',
  metodo: 'POST',
  ruta: '/api/clientes/{id}/validar-renaper',
  requiereSesion: true,
  destructivo: true,
  exito: {
    estado: 200,
    esquema: esquemaClienteExacto,
    request: () => fetchContrato(rutaValidarT25(), { method: 'POST', conSesion: true }),
  },
  errores: [
    ...erroresAuth(`/api/clientes/${inexistente}/validar-renaper`, 'POST'),
    {
      nombre: 'CLIENTE_NO_ENCONTRADO',
      estado: 404,
      esquema: 'problem',
      request: async () => {
        const respuesta = await fetchContrato(`/api/clientes/${inexistente}/validar-renaper`, {
          method: 'POST',
          conSesion: true,
        });
        z.object({ codigo: z.literal('CLIENTE_NO_ENCONTRADO') }).parse(
          await respuesta.clone().json(),
        );
        return respuesta;
      },
    },
  ],
});
