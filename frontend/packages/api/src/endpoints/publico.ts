import type { ApiClient } from '../client';
import type {
  ConsultaEstadoPagoRequest,
  ConsultaPublicaRequest,
  ConsultaPublicaResponse,
  CuponPublicoRequest,
  CuponPublicoRespuestaMock,
  EstadoPagoPublicoMock,
  FacturaPublica,
  MedioPagoPublicoMock,
  PagoPublicoRequest,
  PagoPublicoResponse,
  PublicoFacturaRequest,
} from '../dto/publico';

/**
 * Claves de caché de la API pública.
 * `cupon` la usa W-07 (RV-28); `mediosPago` solo existe en el mock (PB-22).
 * `estadoPago` y `factura` las usa W-08 (retorno de la pasarela), por `numeroPago`.
 */
export const publicoKeys = {
  all: ['publico'] as const,
  mediosPago: () => [...publicoKeys.all, 'mediosPago'] as const,
  cupon: (numeroPoliza: string, cuotaId: string) =>
    [...publicoKeys.all, 'cupon', numeroPoliza, cuotaId] as const,
  estadoPago: (numeroPago: string) => [...publicoKeys.all, 'estadoPago', numeroPago] as const,
  factura: (numeroPago: string) => [...publicoKeys.all, 'factura', numeroPago] as const,
};

/** `POST /api/publico/consulta`. Anónimo, no reintentar (RN20, FC13). */
export function consultarPoliza(
  api: ApiClient,
  body: ConsultaPublicaRequest,
): Promise<ConsultaPublicaResponse> {
  return api.post<ConsultaPublicaResponse>('/api/publico/consulta', body);
}

/** `POST /api/publico/pagos`. Anónimo, no reintentar (RN20, FC13). */
export function crearPagoPublico(
  api: ApiClient,
  body: PagoPublicoRequest,
): Promise<PagoPublicoResponse> {
  return api.post<PagoPublicoResponse>('/api/publico/pagos', body);
}

/** `POST /api/publico/factura`. Anónimo, no reintentar (RN20, FC13). */
export function obtenerFacturaPublica(
  api: ApiClient,
  body: PublicoFacturaRequest,
): Promise<FacturaPublica> {
  return api.post<FacturaPublica>('/api/publico/factura', body);
}

/**
 * MOCK (PB-02): `POST /api/publico/cupon` no existe en el back.
 * Solo lo implementa el handler MSW; no se conecta a la UI hasta que PB-02 se publique.
 */
export function cuponPublicoMock(
  api: ApiClient,
  body: CuponPublicoRequest,
): Promise<CuponPublicoRespuestaMock> {
  return api.post<CuponPublicoRespuestaMock>('/api/publico/cupon', body);
}

/**
 * MOCK (PB-01): `POST /api/publico/pagos/estado` no existe en el back.
 * Solo lo implementa el handler MSW. W-08 lo usa con `VITE_USE_MOCKS` y body `{ numeroPago }`.
 */
export function estadoPagoPublicoMock(
  api: ApiClient,
  body: ConsultaEstadoPagoRequest,
): Promise<EstadoPagoPublicoMock> {
  return api.post<EstadoPagoPublicoMock>('/api/publico/pagos/estado', body);
}

/**
 * MOCK (PB-22): `GET /api/publico/medios-pago` no existe en el back.
 * Solo lo implementa el handler MSW; no se conecta a la UI hasta que PB-22 se publique.
 */
export function listarMediosPagoMock(api: ApiClient): Promise<MedioPagoPublicoMock[]> {
  return api.get<MedioPagoPublicoMock[]>('/api/publico/medios-pago');
}
