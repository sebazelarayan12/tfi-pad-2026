/**
 * DTOs de la API pública (`/api/publico/*`), sin login.
 * Contratos: `seguridad-clientes-publico.md` §6, `pagos-facturas.md` §3 y §10.5-10.6.
 *
 * Dueño: US-FE-T-31.
 */

/**
 * Copia de `dto/pagos.ts` (T-29), RV-D09 (b).
 * T-31 no importa de T-29 para no bloquear la tarea; T-23 valida que la forma coincida.
 */
export interface FacturaResponse {
  id: string;
  pagoId: string;
  numero: string;
  tipo: 'B';
  importe: number;
  estado: 'PENDIENTE_CAE' | 'AUTORIZADA';
  cae: string | null;
  vencimientoCae: string | null;
  fechaEmision: string;
}

/**
 * Copia de `dto/pagofacil.ts` (T-30), RV-D09 (b).
 * T-31 no importa de T-30 para no bloquear la tarea; T-23 valida que la forma coincida.
 */
export interface CuponPagoFacilResponse {
  cuotaId: string;
  numeroPoliza: string;
  numeroCuota: number;
  importePrimerVencimiento: number;
  fechaPrimerVencimiento: string;
  importeSegundoVencimiento: number;
  fechaSegundoVencimiento: string;
  codigoBarras: string;
}

export interface ConsultaPublicaRequest {
  /** `^\d{8}$`. El back no hace trim: recortar antes de enviar. */
  dni: string;
  /** `^POL-\d{7}$`. Distingue mayúsculas: normalizar antes de enviar. */
  numeroPoliza: string;
}

export type EstadoPolizaPublico = 'PENDIENTE' | 'VIGENTE' | 'SUSPENDIDA' | 'CANCELADA' | 'VENCIDA';

export type EstadoCuotaPublica = 'PENDIENTE' | 'VENCIDA' | 'PAGADA' | 'ANULADA';

export interface PlanPublico {
  codigo: string;
  nombre: string;
}

export interface VehiculoPublico {
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
}

export interface CuotaPublica {
  /** Único id expuesto; lo necesita `POST /api/publico/pagos`. */
  idCuota: string;
  numero: number;
  importe: number;
  /** 0 hasta que la cuota vence (RN08). */
  recargo: number;
  /** importe + recargo. */
  total: number;
  /** `yyyy-MM-dd`. */
  vencimiento: string;
  estado: EstadoCuotaPublica;
}

export interface ConsultaPublicaResponse {
  numeroPoliza: string;
  estado: EstadoPolizaPublico;
  /** true solo si `estado === 'VIGENTE'` (RN10). */
  coberturaVigente: boolean;
  /** `yyyy-MM-dd`. */
  vigenteDesde: string;
  /** `yyyy-MM-dd`. */
  vigenteHasta: string;
  plan: PlanPublico;
  vehiculo: VehiculoPublico;
  /** Ordenadas por `numero` ascendente. */
  cuotas: CuotaPublica[];
}

export interface PagoPublicoRequest {
  /** `^\d{8}$`. */
  dni: string;
  /** Máximo 20 caracteres. */
  numeroPoliza: string;
  /** 1 a 24, de una sola póliza. */
  cuotaIds: string[];
  /** Cualquier otro valor da 400. */
  proveedor: 'pasarela1' | 'pasarela2';
}

export interface PagoPublicoResponse {
  /** `PAG-xxxxxx`. Lo pide la factura. */
  numeroPago: string;
  idPago: string;
  /** Link de checkout de la pasarela. */
  urlPago: string;
  /** ISO UTC; vencimiento del link, no la reserva de 60 min. */
  fechaExpiracion: string;
}

export interface PublicoFacturaRequest {
  /** `^\d{8}$`. */
  dni: string;
  /** Máximo 20 caracteres. */
  numeroPago: string;
}

/** Respuesta 200 de `POST /api/publico/factura` (copia de T-29, RV-D09). No es MOCK: el endpoint está implementado. */
export type FacturaPublica = FacturaResponse;

/** MOCK (PB-02): `POST /api/publico/cupon` no existe en el back. */
export interface CuponPublicoRequest {
  dni: string;
  numeroPoliza: string;
  numeroCuota: number;
}

/** MOCK (PB-02): cupón público con el total de cuotas de la póliza. */
export interface CuponPublicoRespuestaMock extends CuponPagoFacilResponse {
  /** "9 de 12" en W-05; hoy no hay dato (D-31-4: `null`). */
  totalCuotas: number | null;
}

/** MOCK (PB-01): `POST /api/publico/pagos/estado` no existe en el back. */
export interface ConsultaEstadoPagoRequest {
  /** Viaja en el cuerpo, nunca en la URL. */
  dni: string;
  numeroPago: string;
}

/** MOCK (PB-01): estado público del pago. */
export interface EstadoPagoPublicoMock {
  numeroPago: string;
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  fechaAcreditacion: string | null;
  /** Solo si está PENDIENTE y no expiró. */
  urlPago: string | null;
  factura: FacturaPublica | null;
}

/** MOCK (PB-22): `GET /api/publico/medios-pago` no existe en el back. */
export interface MedioPagoPublicoMock {
  proveedor: 'pasarela1' | 'pasarela2';
  /** Nombre comercial provisional: "Pasarela A" / "Pasarela B" (D-09, PB-22). */
  nombre: string;
  orden: number;
  activo: boolean;
}
