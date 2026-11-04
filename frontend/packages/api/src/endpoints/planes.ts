import type { ApiClient } from '../client';
import type { ActivoPlanRequest, PlanListResponse, PlanRequest, PlanResponse } from '../dto/planes';

const rutaPlanes = '/api/planes';
const rutaPlan = (id: string) => `${rutaPlanes}/${encodeURIComponent(id)}`;

/** PB-09: las vistas mantienen ocultos los inactivos y la reactivación. */
export const PLANES_INACTIVOS_DISPONIBLES = false;

export const planesKeys = {
  lista: ({ incluirInactivos }: { incluirInactivos?: boolean } = {}) =>
    ['planes', 'lista', { incluirInactivos }] as const,
  detalle: (id: string) => ['planes', 'detalle', id] as const,
};

export function listarPlanes(cliente: ApiClient): Promise<PlanListResponse> {
  return cliente.get<PlanListResponse>(rutaPlanes);
}

export function obtenerPlan(cliente: ApiClient, id: string): Promise<PlanResponse> {
  return cliente.get<PlanResponse>(rutaPlan(id));
}

export function crearPlan(cliente: ApiClient, body: PlanRequest): Promise<PlanResponse> {
  return cliente.post<PlanResponse>(rutaPlanes, body);
}

export function actualizarPlan(
  cliente: ApiClient,
  id: string,
  body: PlanRequest,
): Promise<PlanResponse> {
  return cliente.put<PlanResponse>(rutaPlan(id), body);
}

export function desactivarPlan(cliente: ApiClient, id: string): Promise<void> {
  return cliente.delete<void>(rutaPlan(id));
}

/** MOCK (PB-09). El backend real ignora incluirInactivos. */
export function listarPlanesIncluyendoInactivos(cliente: ApiClient): Promise<PlanListResponse> {
  return cliente.get<PlanListResponse>(rutaPlanes, { query: { incluirInactivos: true } });
}

/** MOCK (PB-09). El backend real todavía no publica esta ruta. */
export function reactivarPlan(
  cliente: ApiClient,
  id: string,
  activo: boolean,
): Promise<PlanResponse> {
  const body: ActivoPlanRequest = { activo };
  return cliente.patch<PlanResponse>(`${rutaPlan(id)}/activo`, body);
}
