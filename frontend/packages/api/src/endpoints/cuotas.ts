import type { ApiClient } from '../client';
import type { PaginaRequest, PaginaResponse } from '../dto/comunes';
import type { CuotaListItemMock } from '../dto/polizas';

/**
 * Claves de caché de cuotas globales.
 * `vencidas` es MOCK (PB-24): `GET /api/cuotas` no existe en el back.
 */
export const cuotasKeys = {
  all: ['cuotas'] as const,
  vencidas: (opciones: PaginaRequest = {}) => [...cuotasKeys.all, 'vencidas', opciones] as const,
};

/**
 * MOCK (PB-24): cuotas vencidas globales.
 * `GET /api/cuotas` no existe en el back; solo la implementa el handler MSW.
 * No se conecta a la UI hasta que PB-24 se publique.
 */
export function listarCuotasVencidasMock(
  api: ApiClient,
  opciones: PaginaRequest = {},
): Promise<PaginaResponse<CuotaListItemMock>> {
  return api.get<PaginaResponse<CuotaListItemMock>>('/api/cuotas', {
    query: { ...opciones, estado: 'Vencida' },
  });
}
