import { z } from 'zod';

import type { EstadoNavegacion } from '../types/navegacion';

const fechaISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const estadoPolizaSchema = z.enum(['PENDIENTE', 'VIGENTE', 'SUSPENDIDA', 'CANCELADA', 'VENCIDA']);

const estadoCuotaSchema = z.enum(['PENDIENTE', 'VENCIDA', 'PAGADA', 'ANULADA']);

/**
 * Mínimo de `ConsultaPublicaResponse` que necesita W3 (`W3-mi-poliza.md` §9.1).
 * La respuesta completa la valida el contrato de `@nexa/api`; acá alcanza con lo que se pinta.
 */
export const consultaPublicaSchema = z.object({
  numeroPoliza: z.string().regex(/^POL-\d{7}$/),
  estado: estadoPolizaSchema,
  coberturaVigente: z.boolean(),
  vigenteDesde: fechaISO,
  vigenteHasta: fechaISO,
  plan: z.object({
    codigo: z.string().min(1),
    nombre: z.string().min(1),
  }),
  vehiculo: z.object({
    patente: z.string().min(1),
    marca: z.string().min(1),
    modelo: z.string().min(1),
    anio: z.number().int(),
  }),
  cuotas: z.array(
    z.object({
      idCuota: z.string().min(1),
      numero: z.number().int().positive(),
      importe: z.number(),
      recargo: z.number(),
      total: z.number(),
      vencimiento: fechaISO,
      estado: estadoCuotaSchema,
    }),
  ),
});

/** Estado que W2 deja en `location.state` para W3/W4. */
export const estadoMiPolizaSchema = z.object({
  dni: z.string().regex(/^\d{8}$/),
  numeroPoliza: z.string().regex(/^POL-\d{7}$/),
  consulta: consultaPublicaSchema,
});

const cuotaIdsSchema = z
  .array(z.string().min(1))
  .min(1)
  .max(24)
  .refine((ids) => new Set(ids).size === ids.length, 'Las cuotas no pueden repetirse.');

/** Estado de W4 a W7: el de W2 más las cuotas elegidas (1 a 24, sin repetidos). */
export const estadoPagoPublicoSchema = estadoMiPolizaSchema.extend({
  cuotaIds: cuotaIdsSchema,
});

function esRegistro(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Lee `location.state` sin lanzar (W-03 §6.2). Si el estado trae `cuotaIds`, también los valida:
 * un estado de pago con cuotas inválidas devuelve `null` en vez de un estado a medias.
 */
export function leerEstadoNavegacion(state: unknown): EstadoNavegacion | null {
  const base = estadoMiPolizaSchema.safeParse(state);
  if (!base.success) return null;
  if (!esRegistro(state) || !('cuotaIds' in state)) return base.data;

  const pago = estadoPagoPublicoSchema.safeParse(state);
  return pago.success ? pago.data : null;
}
