import { leerEstadoNavegacion, type EstadoPagoPublico } from '../../polizas';

/** Resultado de leer `location.state` en W5 (W-07 §6 paso 1). */
export type EstadoCuponPagoFacil =
  { tipo: 'sin-estado' } | { tipo: 'sin-cuotas' } | { tipo: 'valido'; estado: EstadoPagoPublico };

function sinCuotaIds(state: unknown): unknown {
  if (typeof state !== 'object' || state === null || Array.isArray(state)) return state;
  return Object.fromEntries(Object.entries(state).filter(([clave]) => clave !== 'cuotaIds'));
}

/**
 * Sin estado de W2 válido → `sin-estado` (vuelve a W2). Con estado de W2 pero sin cuotas válidas
 * (faltan, vacías, repetidas, más de 24 o ajenas a la consulta) → `sin-cuotas` (vuelve a W4 con el
 * mismo estado, W5 §2). No lanza.
 */
export function leerEstadoCupon(state: unknown): EstadoCuponPagoFacil {
  const estado = leerEstadoNavegacion(state);
  if (estado !== null && 'cuotaIds' in estado) {
    const conocidas = new Set(estado.consulta.cuotas.map((cuota) => cuota.idCuota));
    if (estado.cuotaIds.every((id) => conocidas.has(id))) return { tipo: 'valido', estado };
    return { tipo: 'sin-cuotas' };
  }
  if (leerEstadoNavegacion(sinCuotaIds(state)) === null) return { tipo: 'sin-estado' };
  return { tipo: 'sin-cuotas' };
}
