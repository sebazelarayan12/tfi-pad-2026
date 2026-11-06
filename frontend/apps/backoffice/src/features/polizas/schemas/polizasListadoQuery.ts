import type { EstadoPolizaNombre } from '@nexa/api';
import { z } from 'zod';

/** Estados que se pueden filtrar, por nombre (contrato §1.3). "Todas" es la ausencia de estado. */
export const ESTADOS_FILTRO = [
  'Pendiente',
  'Vigente',
  'Suspendida',
  'Cancelada',
  'Vencida',
] as const satisfies readonly EstadoPolizaNombre[];

/** `int.MaxValue / 100` del back (contrato §5.2). */
const PAGINA_MAXIMA = 21_474_836;

const esquema = z.object({
  estado: z.enum(ESTADOS_FILTRO).optional().catch(undefined),
  pagina: z.coerce.number().int().min(1).max(PAGINA_MAXIMA).catch(1),
});

export interface FiltrosPolizas {
  estado?: EstadoPolizaNombre;
  pagina: number;
}

/** Lee los filtros de la URL. Un valor inválido cae al valor por defecto, sin error visible. */
export function leerFiltrosPolizas(params: URLSearchParams): FiltrosPolizas {
  const { estado, pagina } = esquema.parse({
    estado: params.get('estado') ?? undefined,
    pagina: params.get('pagina') ?? undefined,
  });
  return estado === undefined ? { pagina } : { estado, pagina };
}

/** Escribe solo lo que difiere del default: sin `estado` en "Todas" y sin `pagina` en 1. */
export function escribirFiltrosPolizas({ estado, pagina }: FiltrosPolizas): URLSearchParams {
  const params = new URLSearchParams();
  if (estado !== undefined) params.set('estado', estado);
  if (pagina > 1) params.set('pagina', String(pagina));
  return params;
}
