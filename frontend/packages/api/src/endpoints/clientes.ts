import type { ApiClient } from '../client';
import type {
  ClienteFiltro,
  ClienteModificacionRequest,
  ClienteResponse,
  ClienteResumenResponse,
  CuentaClienteResponse,
} from '../dto/clientes';
import type { PaginaResponse } from '../dto/comunes';

const ruta = '/api/clientes';
const rutaCliente = (id: string) => `${ruta}/${encodeURIComponent(id)}`;

/** Features invalidate list prefixes, detail and account after a mutation (FC2). */
export const clientesKeys = {
  todos: ['clientes'] as const,
  listas: () => [...clientesKeys.todos, 'lista'] as const,
  lista: (filtro: ClienteFiltro) => [...clientesKeys.listas(), filtro] as const,
  detalles: () => [...clientesKeys.todos, 'detalle'] as const,
  detalle: (id: string) => [...clientesKeys.detalles(), id] as const,
  cuenta: (id: string) => [...clientesKeys.todos, 'cuenta', id] as const,
};

export function listarClientes(
  api: ApiClient,
  filtro: ClienteFiltro = {},
): Promise<PaginaResponse<ClienteResumenResponse>> {
  return api.get<PaginaResponse<ClienteResumenResponse>>(ruta, {
    query: {
      dni: filtro.dni?.trim() ? filtro.dni : undefined,
      apellido: filtro.apellido?.trim() || undefined,
      pagina: filtro.pagina,
      tamanoPagina: filtro.tamanoPagina,
    },
  });
}

export function obtenerCliente(api: ApiClient, id: string): Promise<ClienteResponse> {
  return api.get<ClienteResponse>(rutaCliente(id));
}

export function modificarCliente(
  api: ApiClient,
  id: string,
  cuerpo: ClienteModificacionRequest,
): Promise<ClienteResponse> {
  return api.put<ClienteResponse>(rutaCliente(id), cuerpo);
}

export function darDeBajaCliente(api: ApiClient, id: string): Promise<void> {
  return api.delete<void>(rutaCliente(id));
}

/** MOCK ONLY: no account endpoint exists on the backend (PB-28); the rail stays hidden. */
export function obtenerCuentaCliente(api: ApiClient, id: string): Promise<CuentaClienteResponse> {
  return api.get<CuentaClienteResponse>(`${rutaCliente(id)}/cuenta`);
}
