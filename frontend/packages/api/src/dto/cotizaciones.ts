export type OrigenCotizacion = 0 | 1 | 2;

export interface CotizarVehiculoRequest {
  vehiculoId: string;
}

export interface OpcionCotizacion {
  idCotizacion: string;
  codigoPlan: string;
  plan: string;
  primaMensual: number;
}

export interface CotizacionResultado {
  fechaVencimiento: string;
  opciones: OpcionCotizacion[];
}

export interface CotizacionDto {
  id: string;
  planId: string;
  codigoPlan: string;
  clienteId: string | null;
  vehiculoId: string | null;
  primaMensual: number;
  fechaCotizacion: string;
  fechaVencimiento: string;
  origen: OrigenCotizacion;
}

/** Fila de `GET /api/cotizaciones`: la cotización con el cliente, la patente y el plan ya resueltos. */
export interface CotizacionListItemResponse {
  id: string;
  planId: string;
  codigoPlan: string;
  nombrePlan: string;
  clienteId: string | null;
  /** `null` cuando se cotizó sin un cliente registrado. */
  clienteNombre: string | null;
  vehiculoId: string | null;
  /** `null` cuando la cotización no tiene un vehículo registrado. */
  patente: string | null;
  primaMensual: number;
  /** ISO 8601 en UTC. */
  fechaCotizacion: string;
  /** ISO 8601 en UTC; la cotización vale hasta ese instante inclusive (RN06). */
  fechaVencimiento: string;
  vigente: boolean;
  origen: OrigenCotizacion;
}

/** Filtros de `GET /api/cotizaciones`; todos son opcionales. */
export interface CotizacionListadoFiltro {
  /** `true` solo vigentes, `false` solo vencidas; se omite para ver todas. */
  vigente?: boolean;
  clienteId?: string;
  vehiculoId?: string;
  patente?: string;
  pagina?: number;
  tamano?: number;
}

/** SOLO MOCK (PB-10): no se recalculan primas en el consumidor. */
export interface CalculoPrimaMock {
  primaBase: number;
  factorTipo: number;
  factorAntiguedad: number;
  factorEdad: number;
  factorUso: number;
}

export interface OpcionCotizacionMock extends OpcionCotizacion {
  calculo?: CalculoPrimaMock | null;
}
