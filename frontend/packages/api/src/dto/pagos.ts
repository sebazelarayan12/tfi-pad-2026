/**
 * DTOs de pagos y facturas.
 * Contrato: `docs/frontend/contratos-api/pagos-facturas.md` §3, §6 y §7.
 *
 * `estado` y `medio` viajan como string en mayúsculas, no como número
 * (contrato §2.1; a diferencia de pólizas y cuotas, PB-13).
 *
 * Dueño: US-FE-T-29.
 */

/** Estado de un pago tal como llega en el JSON. */
export type EstadoPago = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

/** Medio de pago tal como llega en el JSON. */
export type MedioPagoApi = 'CAJA' | 'PASARELA' | 'PAGO_FACIL';

/** Estado de una factura tal como llega en el JSON. */
export type EstadoFactura = 'PENDIENTE_CAE' | 'AUTORIZADA';

/** Tipo de comprobante; hoy siempre "B" (contrato §3). */
export type TipoFactura = 'B';

/** Factura de un pago (`Application/Dtos/FacturaResponse.cs`). */
export interface FacturaResponse {
  id: string;
  pagoId: string;
  /** "" mientras `estado` es `PENDIENTE_CAE`; luego el número de ARCA. */
  numero: string;
  tipo: TipoFactura;
  /** Total del pago, IVA incluido. El front no recalcula (contrato §5.4). */
  importe: number;
  estado: EstadoFactura;
  /** 14 dígitos; `null` mientras `PENDIENTE_CAE`. */
  cae: string | null;
  /** "yyyy-MM-dd"; `null` mientras `PENDIENTE_CAE`. */
  vencimientoCae: string | null;
  /** ISO 8601 en UTC con `Z`. */
  fechaEmision: string;
}

/** Pago (`Application/Dtos/PagoResponse.cs`). */
export interface PagoResponse {
  id: string;
  clienteId: string;
  /** "PAG-" + 6 caracteres hexadecimales, p. ej. "PAG-6f1c2a". */
  numero: string;
  estado: EstadoPago;
  medio: MedioPagoApi;
  /** Total del pago, IVA incluido. El front no recalcula (contrato §5.4). */
  importe: number;
  /** ISO 8601; puede venir con o sin `Z` (PB-16). */
  fechaCreacion: string;
  /** ISO 8601; `null` mientras el pago no está aprobado. */
  fechaAcreditacion: string | null;
  /** `null` si el pago no tiene factura (p. ej. `RECHAZADO` o `PENDIENTE`). */
  factura: FacturaResponse | null;
}

/** Body de `POST /api/pagos/caja` (`Application/Dtos/PagoCajaRequest.cs`). */
export interface PagoCajaRequest {
  /** Mínimo 1. Sin importe, cliente ni medio: el back los deduce. */
  cuotaIds: string[];
}

/**
 * MOCK (PB-05): fila del listado de pagos propuesta en el contrato §7.4.
 * `GET /api/pagos` y `GET /api/polizas/{id}/pagos` no existen en el back.
 * La forma efectiva que consumen B-18 y B-19 es `PagoListadoResponse` (RV-D13).
 */
export interface PagoResumenMock {
  id: string;
  numero: string;
  estado: EstadoPago;
  medio: MedioPagoApi;
  importe: number;
  fechaCreacion: string;
  fechaAcreditacion: string | null;
  cuotaIds: string[];
}

/**
 * MOCK (PB-05): filtros de `GET /api/pagos`.
 * Solo los implementa el handler MSW; el back no expone este endpoint.
 */
export interface PagoListadoFiltroMock {
  estado?: EstadoPago;
  medio?: MedioPagoApi;
  /** PB-06: el back real todavía no filtra por número de póliza. */
  numeroPoliza?: string;
  pagina?: number;
  tamano?: number;
}

/**
 * MOCK (PB-05): fila de `GET /api/pagos` para la tabla de B11 §9 (RV-D13).
 * La UI de B-19 la consume hasta que PB-05 se publique.
 */
export interface PagoListadoResponse {
  id: string;
  numero: string;
  /** ISO 8601; puede venir con o sin `Z` (PB-16). */
  fechaCreacion: string;
  clienteNombre: string;
  numeroPoliza: string;
  /** Números de cuota incluidos en el pago. */
  cuotas: number[];
  medio: MedioPagoApi;
  importe: number;
  estado: EstadoPago;
  factura: { numero: string; estado: EstadoFactura } | null;
}

/**
 * MOCK (PB-11): `FacturaResponse` con `urlPdf`.
 * El back todavía no devuelve `urlPdf`; solo existe en MSW.
 * B-17 oculta el botón de descarga hasta que PB-11 se publique (D-29-2).
 */
export interface FacturaConPdfMock extends FacturaResponse {
  /** `null` mientras `estado` es `PENDIENTE_CAE`. */
  urlPdf: string | null;
}
