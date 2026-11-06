// Barrel de @nexa/api: un bloque por archivo; cada API card agrega el suyo.
export * from './dto/comunes';
export * from './dto/auth';
export * from './client/index';
export * from './format';
export * from './enums';
export * from './messages';
export * from './dto/polizas';
export * from './endpoints/polizas';
export * from './endpoints/cuotas';
export * from './dto/usuarios';
export * from './auth/cambiarPassword';
export * from './auth/login';
export * from './endpoints/usuarios';
export * from './dto/pagofacil';
export * from './endpoints/pagofacil';
export * from './dto/planes';
export * from './endpoints/planes';
export * from './dto/pagos';
export * from './endpoints/pagos';
export * from './dto/clientes';
export * from './endpoints/clientes';
// T-31: API pública. `FacturaResponse` y `CuponPagoFacilResponse` viven en
// dto/publico.ts como copias (RV-D09), pero no se re-exportan acá para no
// duplicar los nombres de T-29 y T-30; se importan desde sus dominios dueños.
export type {
  ConsultaEstadoPagoRequest,
  ConsultaPublicaRequest,
  ConsultaPublicaResponse,
  CuotaPublica,
  CuponPublicoRequest,
  CuponPublicoRespuestaMock,
  EstadoCuotaPublica,
  EstadoPagoPublicoMock,
  EstadoPolizaPublico,
  FacturaPublica,
  MedioPagoPublicoMock,
  PagoPublicoRequest,
  PagoPublicoResponse,
  PlanPublico,
  PublicoFacturaRequest,
  VehiculoPublico,
} from './dto/publico';
export * from './endpoints/publico';
// US-FE-B-01: ApiClientProvider y useApiClient (FC18).
export { ApiClientProvider, useApiClient } from './client/ApiClientProvider';
export type { ApiClientProviderProps } from './client/ApiClientProvider';
