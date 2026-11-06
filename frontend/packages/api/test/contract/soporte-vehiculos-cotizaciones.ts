import { beforeEach } from 'vitest';
import { z } from 'zod';
import type { VehiculoResponse, CotizacionDto, CotizacionResultado } from '../../src';
import { crearEstadoVehiculos, VEHICULO_ID, COTIZACION_ID } from '../../mocks/fixtures/vehiculos';
import { crearHandlersVehiculos } from '../../mocks/handlers/vehiculos';
import { crearHandlersCotizaciones } from '../../mocks/handlers/cotizaciones';
import { servidorMock } from '../../mocks/server';
import { tokensMockClientes } from '../../mocks/fixtures/clientes';
import type { CasoError } from './harness';
import { fetchContrato, leerConfiguracion } from './setup';

export const esMock = leerConfiguracion().objetivo === 'mock';
export function instalarFixtures() {
  beforeEach(() => {
    if (esMock) {
      const estado = crearEstadoVehiculos();
      servidorMock.use(...crearHandlersVehiculos(estado), ...crearHandlersCotizaciones(estado));
    }
  });
}
// Guid .NET no exige versión ni variante RFC para los ids del seed.
const guid = z.string().regex(/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i);
export const esquemaVehiculo = z.strictObject({
  id: guid,
  clienteId: guid,
  patente: z.string(),
  marca: z.string(),
  modelo: z.string(),
  anio: z.number().int(),
  tipo: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  uso: z.union([z.literal(0), z.literal(1)]),
  validadoDnrpa: z.boolean(),
  activo: z.boolean(),
}) satisfies z.ZodType<VehiculoResponse>;
export const esquemaCotizacion = z.strictObject({
  id: guid,
  planId: guid,
  codigoPlan: z.string(),
  clienteId: guid.nullable(),
  vehiculoId: guid.nullable(),
  primaMensual: z.number(),
  fechaCotizacion: z.string(),
  fechaVencimiento: z.string(),
  origen: z.union([z.literal(0), z.literal(1), z.literal(2)]),
}) satisfies z.ZodType<CotizacionDto>;
export const esquemaResultado = z.strictObject({
  fechaVencimiento: z.string().regex(/Z$/),
  opciones: z
    .array(
      z.looseObject({
        idCotizacion: guid,
        codigoPlan: z.string(),
        plan: z.string(),
        primaMensual: z.number(),
      }),
    )
    .min(1),
}) satisfies z.ZodType<CotizacionResultado>;

export function idVehiculo() {
  return esMock ? VEHICULO_ID : process.env.CONTRACT_VEHICULO_ID || VEHICULO_ID;
}
export function idCotizacion() {
  if (esMock) return COTIZACION_ID;
  const valor = process.env.CONTRACT_COTIZACION_ID;
  if (!valor)
    throw new Error(
      'Falta CONTRACT_COTIZACION_ID: seleccionar una cotización local para probar el GET.',
    );
  return valor;
}
export function solicitud(ruta: string, metodo = 'GET', cuerpo?: unknown, sesion = true) {
  return fetchContrato(ruta, {
    method: metodo,
    conSesion: sesion,
    ...(cuerpo === undefined
      ? {}
      : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) }),
  });
}
export function erroresAuth(ruta: string, metodo = 'GET', cuerpo?: unknown): CasoError[] {
  return [
    {
      nombre: 'sin sesión',
      estado: 401,
      esquema: 'problem',
      request: () => solicitud(ruta, metodo, cuerpo, false),
    },
    ...(esMock
      ? [
          {
            nombre: 'rol no admitido (solo fixture MSW)',
            estado: 403,
            esquema: 'problem' as const,
            request: () =>
              fetchContrato(ruta, {
                method: metodo,
                headers: {
                  Authorization: `Bearer ${tokensMockClientes.sinPermiso}`,
                  'Content-Type': 'application/json',
                },
                ...(cuerpo === undefined ? {} : { body: JSON.stringify(cuerpo) }),
              }),
          },
        ]
      : []),
  ];
}
