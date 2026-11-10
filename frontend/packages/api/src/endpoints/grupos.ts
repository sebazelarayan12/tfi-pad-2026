import type { ApiClient } from '../client';
import type { LoginRequest, LoginResponse } from '../dto/auth';
import type { PaginaResponse } from '../dto/comunes';
import type {
  ClaveGeneradaResponse,
  FiltroGrupos,
  GrupoCuentaResponse,
  GrupoListItemResponse,
  MotivoGrupoRequest,
  RegistroGrupoRequest,
} from '../dto/grupos';

const rutaGrupos = '/api/grupos';
const rutaGrupo = (id: string) => `${rutaGrupos}/${encodeURIComponent(id)}`;

export const gruposKeys = {
  lista: (filtro: FiltroGrupos = {}) => ['grupos', 'lista', { ...filtro }] as const,
  miCuenta: () => ['grupos', 'mi-cuenta'] as const,
};

/** Crea la cuenta y la solicitud de acceso (queda pendiente de aprobación). */
export function registrarGrupo(
  cliente: ApiClient,
  body: RegistroGrupoRequest,
): Promise<GrupoCuentaResponse> {
  return cliente.post<GrupoCuentaResponse>('/api/publico/grupos/registro', body);
}

/** Login de un grupo externo. El token solo abre su panel de integraciones. */
export function loginGrupo(cliente: ApiClient, body: LoginRequest): Promise<LoginResponse> {
  return cliente.post<LoginResponse>('/api/publico/grupos/login', body);
}

export function obtenerMiCuentaGrupo(cliente: ApiClient): Promise<GrupoCuentaResponse> {
  return cliente.get<GrupoCuentaResponse>(`${rutaGrupos}/mi-cuenta`);
}

/** Genera una clave nueva; la anterior deja de funcionar. Solo si la solicitud está aprobada. */
export function generarClaveGrupo(cliente: ApiClient): Promise<ClaveGeneradaResponse> {
  return cliente.post<ClaveGeneradaResponse>(`${rutaGrupos}/mi-cuenta/clave`, {});
}

export function listarGrupos(
  cliente: ApiClient,
  filtro: FiltroGrupos = {},
): Promise<PaginaResponse<GrupoListItemResponse>> {
  return cliente.get<PaginaResponse<GrupoListItemResponse>>(rutaGrupos, { query: filtro });
}

export function aprobarGrupo(cliente: ApiClient, id: string): Promise<GrupoListItemResponse> {
  return cliente.post<GrupoListItemResponse>(`${rutaGrupo(id)}/aprobar`, {});
}

export function rechazarGrupo(
  cliente: ApiClient,
  id: string,
  body: MotivoGrupoRequest,
): Promise<GrupoListItemResponse> {
  return cliente.post<GrupoListItemResponse>(`${rutaGrupo(id)}/rechazar`, body);
}

export function revocarGrupo(
  cliente: ApiClient,
  id: string,
  body: MotivoGrupoRequest,
): Promise<GrupoListItemResponse> {
  return cliente.post<GrupoListItemResponse>(`${rutaGrupo(id)}/revocar`, body);
}
