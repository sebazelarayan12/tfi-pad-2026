import type { ApiClient } from '../client';
import type { PaginaResponse } from '../dto/comunes';
import type {
  ActualizarUsuarioMock,
  CrearUsuarioRequest,
  UsuarioListItemMock,
  UsuarioResponse,
  YoResponseMock,
} from '../dto/usuarios';

type FiltroUsuarios = { pagina?: number; tamano?: number };
const rutaUsuarios = '/api/usuarios';
const rutaUsuario = (id: string) => `${rutaUsuarios}/${encodeURIComponent(id)}`;

export const usuariosKeys = {
  lista: (filtro: FiltroUsuarios = {}) => ['usuarios', 'lista', { ...filtro }] as const,
  yo: () => ['usuarios', 'yo'] as const,
};

export function crearUsuario(
  cliente: ApiClient,
  body: CrearUsuarioRequest,
): Promise<UsuarioResponse> {
  return cliente.post<UsuarioResponse>('/api/auth/usuarios', body);
}

/** MOCK (PB-04). */
export function listarUsuariosMock(
  cliente: ApiClient,
  filtro: FiltroUsuarios = {},
): Promise<PaginaResponse<UsuarioListItemMock>> {
  return cliente.get<PaginaResponse<UsuarioListItemMock>>(rutaUsuarios, { query: filtro });
}

/** MOCK (PB-04). */
export function actualizarUsuarioMock(
  cliente: ApiClient,
  id: string,
  body: ActualizarUsuarioMock,
): Promise<UsuarioListItemMock> {
  return cliente.put<UsuarioListItemMock>(rutaUsuario(id), body);
}

/** MOCK (PB-04). */
export function cambiarActivoUsuarioMock(
  cliente: ApiClient,
  id: string,
  activo: boolean,
): Promise<UsuarioListItemMock> {
  return cliente.patch<UsuarioListItemMock>(`${rutaUsuario(id)}/activo`, { activo });
}

/** MOCK (PB-04). El backend real todavía no publica esta ruta. */
export function obtenerYoMock(cliente: ApiClient): Promise<YoResponseMock> {
  return cliente.get<YoResponseMock>('/api/auth/yo');
}
