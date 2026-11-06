import type { ApiClient } from '../client';
import type {
  VehiculoAltaRequest,
  VehiculoListResponse,
  VehiculoResponse,
  VehiculoDnrpaPreviewMock,
} from '../dto/vehiculos';

const ruta = '/api/vehiculos';
export const vehiculosKeys = {
  listaPorCliente: (clienteId: string) => ['vehiculos', 'lista', clienteId] as const,
  detalle: (id: string) => ['vehiculos', 'detalle', id] as const,
};

export function listarVehiculosDeCliente(
  api: ApiClient,
  clienteId: string,
): Promise<VehiculoListResponse> {
  return api.get<VehiculoListResponse>(ruta, { query: { clienteId } });
}

export function obtenerVehiculo(api: ApiClient, id: string): Promise<VehiculoResponse> {
  return api.get<VehiculoResponse>(`${ruta}/${encodeURIComponent(id)}`);
}

export function crearVehiculo(
  api: ApiClient,
  cuerpo: VehiculoAltaRequest,
): Promise<VehiculoResponse> {
  return api.post<VehiculoResponse>(ruta, cuerpo);
}

/** SOLO MOCK (PB-23): no usar desde una pantalla visible hasta publicar el endpoint. */
export function previsualizarDnrpaMock(
  api: ApiClient,
  patente: string,
): Promise<VehiculoDnrpaPreviewMock> {
  return api.get<VehiculoDnrpaPreviewMock>(`${ruta}/dnrpa/${encodeURIComponent(patente)}`);
}
