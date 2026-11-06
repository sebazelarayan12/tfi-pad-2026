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
