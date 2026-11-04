export interface ErrorLineaRendicion {
  linea: number;
  motivo: string;
}

export interface RendicionResponse {
  id: string;
  nombreArchivo: string;
  cantidadRegistros: number;
  importeTotal: number;
  procesadas: number;
  rechazadas: number;
  errores: ErrorLineaRendicion[];
}

export interface HistorialRendicionResponse {
  id: string;
  nombreArchivo: string;
  fechaRendicion: string;
  fechaProceso: string;
  cantidadRegistros: number;
  importeTotal: number;
  pagosAprobados: number;
}

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
