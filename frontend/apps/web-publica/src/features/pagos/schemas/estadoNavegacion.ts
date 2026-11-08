import { z } from 'zod';

import { leerEstadoNavegacion, type EstadoMiPoliza, type EstadoPagoPublico } from '../../polizas';

/** Tope del back para un pago (`PagoPublicoRequest.cuotaIds`, W4 §2). */
const MAXIMO_CUOTAS_POR_PAGO = 24;

const cuotaIdsSchema = z
  .array(z.string().min(1))
  .min(1)
  .max(MAXIMO_CUOTAS_POR_PAGO)
  .refine((ids) => new Set(ids).size === ids.length);

/** Resultado de leer `location.state` en W4 (W-06 §6 paso 1). */
export type EstadoMedioDePago =
  | { tipo: 'sin-estado' }
  | { tipo: 'cuotas-invalidas'; base: EstadoMiPoliza }
  | { tipo: 'valido'; estado: EstadoPagoPublico };

function esRegistro(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sinCuotaIds(state: unknown): unknown {
  if (!esRegistro(state)) return state;
  return Object.fromEntries(Object.entries(state).filter(([clave]) => clave !== 'cuotaIds'));
}

/**
 * Sin estado de W2 válido → `sin-estado` (vuelve a W2). Con estado de W2 pero `cuotaIds` vacío,
 * repetido, de más de 24 o con cuotas que no son de la consulta → `cuotas-invalidas` (vuelve a W3
 * con el mismo estado). No lanza.
 */
export function leerEstadoMedioDePago(state: unknown): EstadoMedioDePago {
  const navegacion = leerEstadoNavegacion(sinCuotaIds(state));
  if (navegacion === null) return { tipo: 'sin-estado' };

  const { dni, numeroPoliza, consulta } = navegacion;
  const base: EstadoMiPoliza = { dni, numeroPoliza, consulta };

  const cuotaIds = cuotaIdsSchema.safeParse(esRegistro(state) ? state.cuotaIds : undefined);
  if (!cuotaIds.success) return { tipo: 'cuotas-invalidas', base };

  const conocidas = new Set(consulta.cuotas.map((cuota) => cuota.idCuota));
  if (!cuotaIds.data.every((id) => conocidas.has(id))) return { tipo: 'cuotas-invalidas', base };

  return { tipo: 'valido', estado: { ...base, cuotaIds: cuotaIds.data } };
}
