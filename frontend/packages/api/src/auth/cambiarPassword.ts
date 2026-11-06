import type { ApiClient } from '../client';
import type { CambiarPasswordRequest, LoginResponse } from '../dto/auth';

/**
 * `POST /api/auth/cambiar-password` (PB-31, US-F1-09). Con 200 devuelve un `LoginResponse` nuevo
 * (token sin la marca de cambio pendiente) que reemplaza la sesión.
 */
export function cambiarPassword(
  cliente: ApiClient,
  body: CambiarPasswordRequest,
): Promise<LoginResponse> {
  return cliente.post<LoginResponse>('/api/auth/cambiar-password', body);
}
