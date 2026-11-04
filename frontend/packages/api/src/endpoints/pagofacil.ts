import type { ApiClient } from '../client';
import { ApiError, parseHttpError } from '../client/errores';
import type {
  CuponPagoFacilResponse,
  HistorialRendicionResponse,
  RendicionResponse,
} from '../dto/pagofacil';

const ruta = '/api/pagofacil';
const rendiciones = `${ruta}/rendiciones`;

export const pagoFacilKeys = {
  rendiciones: () => ['pagoFacil', 'rendiciones'] as const,
  /** Usar staleTime: 0. Los vencimientos dependen de la fecha argentina. */
  cuponEmpleado: (cuotaId: string) => ['pagoFacil', 'cuponEmpleado', cuotaId] as const,
};

export function subirRendicion(cliente: ApiClient, archivo: File): Promise<RendicionResponse> {
  const body = new FormData();
  body.append('archivo', archivo);
  return cliente.post<RendicionResponse>(rendiciones, body);
}

export function listarRendiciones(cliente: ApiClient): Promise<HistorialRendicionResponse[]> {
  return cliente.get<HistorialRendicionResponse[]>(rendiciones);
}

export async function descargarBasePositiva(
  cliente: ApiClient,
): Promise<{ nombreArchivo: string; contenido: string }> {
  const respuesta = await cliente.get(`${ruta}/base-positiva`, { responseType: 'raw' });
  const { ok, status, contentType, texto } = respuesta;
  if (!ok) throw parseHttpError(status, contentType, texto);

  const tipo = contentType?.split(';', 1)[0]?.trim().toLowerCase();
  const encabezado = tipo === 'text/plain' ? /^H(\d{5})(\d{8})/.exec(texto) : null;
  if (!encabezado) throw new ApiError({ status, kind: 'respuesta-invalida' });

  const [, empresa, fecha] = encabezado;
  return { nombreArchivo: `BASEPOS_${empresa}_${fecha}.txt`, contenido: texto };
}

export function obtenerCuponEmpleado(
  cliente: ApiClient,
  cuotaId: string,
): Promise<CuponPagoFacilResponse> {
  return cliente.get<CuponPagoFacilResponse>(`${ruta}/cuotas/${encodeURIComponent(cuotaId)}/cupon`);
}
