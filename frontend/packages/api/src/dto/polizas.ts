/**
 * DTOs de pólizas y cuotas.
 * Contrato: `docs/frontend/contratos-api/polizas-cuotas-pagofacil.md` §2 y §5.
 *
 * Los enums viajan como número en las respuestas y como nombre en la query
 * (contrato §1.3, PB-13, D1).
 *
 * Dueño: US-FE-T-28.
 */

/** Valores numéricos de `EstadoPoliza` en el back (contrato §2). */
export const ESTADO_POLIZA_NUMERO = {
  Pendiente: 0,
  Vigente: 1,
  Suspendida: 2,
  Cancelada: 3,
  Vencida: 4,
} as const;

/** Estado de póliza tal como llega en el JSON. */
export type EstadoPolizaNumero = (typeof ESTADO_POLIZA_NUMERO)[keyof typeof ESTADO_POLIZA_NUMERO];

/** Estado de póliza tal como se envía en la query string. */
export type EstadoPolizaNombre = keyof typeof ESTADO_POLIZA_NUMERO;

/** Valores numéricos de `EstadoCuota` en el back (contrato §2). */
export const ESTADO_CUOTA_NUMERO = {
  Pendiente: 0,
  Vencida: 1,
  Pagada: 2,
  Anulada: 3,
} as const;

/** Estado de cuota tal como llega en el JSON. */
export type EstadoCuotaNumero = (typeof ESTADO_CUOTA_NUMERO)[keyof typeof ESTADO_CUOTA_NUMERO];

/** Query de `GET /api/polizas` (contrato §5.2). */
export interface PolizaFiltroQuery {
  /** Nombre del enum en la query. */
  estado?: EstadoPolizaNombre;
  clienteId?: string;
  /** Coincidencia exacta en el back (PB-06 / D18); el mock ignora mayúsculas y espacios. */
  patente?: string;
  /** Default 1. */
  pagina?: number;
  /** 1..100; default 20 en el back. */
  tamano?: number;
}

/** Body de `POST /api/polizas` (contrato §4.1). */
export interface EmitirPolizaRequest {
  /** `idCotizacion` de la opción elegida, no la fecha de vencimiento. */
  cotizacionId: string;
  /** RN07. */
  vigenciaMeses: 1 | 6 | 12;
}

/** Body de `POST /api/polizas/{id}/cancelar` (contrato §5.4). */
export interface CancelarPolizaRequest {
  /** 1..200 caracteres después de trim. */
  motivo: string;
}

/** Fila de `GET /api/polizas` (contrato §5.2.1). */
export interface PolizaListItemResponse {
  id: string;
  /** "POL-0000001". */
  numero: string;
  clienteId: string;
  /** "Nombre Apellido" del titular. */
  clienteNombre: string;
  patente: string;
  vehiculoMarca: string;
  vehiculoModelo: string;
  vehiculoAnio: number;
  codigoPlan: string;
  primaMensual: number;
  /** "yyyy-MM-dd". */
  fechaInicio: string;
  /** "yyyy-MM-dd". */
  fechaFin: string;
  estado: EstadoPolizaNumero;
  /** "yyyy-MM-dd": vencimiento de la primera cuota `Pendiente`; `null` si no tiene. */
  proximoVencimiento: string | null;
}

/** Cuota de una póliza (contrato §5.5). */
export interface CuotaResponse {
  id: string;
  numero: number;
  importe: number;
  /** 0 hasta `Vencida`; luego 5 %. */
  recargo: number;
  /** "yyyy-MM-dd". */
  fechaVencimiento: string;
  estado: EstadoCuotaNumero;
  /** ISO 8601; puede venir sin `Z` (PB-16). */
  fechaPago: string | null;
}

/** Detalle de una póliza (contrato §5.3). */
export interface PolizaDetalleResponse {
  id: string;
  numero: string;
  clienteId: string;
  vehiculoId: string;
  patente: string;
  marca: string;
  modelo: string;
  planId: string;
  codigoPlan: string;
  nombrePlan: string;
  cotizacionId: string | null;
  primaMensual: number;
  vigenciaMeses: number;
  /** ISO 8601; puede venir con o sin `Z` (PB-16). */
  fechaEmision: string;
  /** "yyyy-MM-dd". */
  fechaInicio: string;
  /** "yyyy-MM-dd". */
  fechaFin: string;
  estado: EstadoPolizaNumero;
  /** Ordenadas por `numero`. */
  cuotas: CuotaResponse[];
}

/**
 * MOCK (PB-06): filtros de búsqueda que el back todavía no acepta.
 * `numero`, `dni` y `planCodigo` solo existen en el handler MSW.
 * La UI de B-14 los oculta tras una constante hasta que PB-06 se publique (RV-D29).
 */
export interface PolizaBusquedaMock extends PolizaFiltroQuery {
  /** Coincidencia parcial `^POL-?\d*`. */
  numero?: string;
  /** `^\d{8}$`; resuelto por el back contra el cliente. */
  dni?: string;
  planCodigo?: 'RC' | 'TC' | 'TR';
}

/**
 * MOCK (PB-24): fila del listado global de cuotas vencidas.
 * `GET /api/cuotas` no existe en el back; solo lo implementa el handler MSW.
 */
export interface CuotaListItemMock {
  cuotaId: string;
  polizaId: string;
  numeroPoliza: string;
  clienteNombre: string;
  clienteApellido: string;
  numeroCuota: number;
  /** "yyyy-MM-dd". */
  fechaVencimiento: string;
  importe: number;
  recargo: number;
  /** PB-13 sigue abierto: el mock devuelve el nombre, no el número. */
  estado: 'Vencida';
}
