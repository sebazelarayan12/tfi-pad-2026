/** Valores del wire: Auto, Moto y Camioneta (FB7.3). */
export type TipoVehiculo = 0 | 1 | 2;
export type UsoVehiculo = 0 | 1;

export interface VehiculoAltaRequest {
  clienteId: string;
  patente: string;
  uso: UsoVehiculo;
  marca: string;
  modelo: string;
  anio: number;
  tipo: TipoVehiculo;
  numeroMotor: string;
  numeroChasis: string;
}

export interface VehiculoResponse {
  id: string;
  clienteId: string;
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  tipo: TipoVehiculo;
  uso: UsoVehiculo;
  validadoDnrpa: boolean;
  activo: boolean;
}

export type VehiculoListResponse = VehiculoResponse[];

/** SOLO MOCK (PB-23): la vista previa no existe en el backend ni se muestra en B-09. */
export interface VehiculoDnrpaPreviewMock {
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  tipo: TipoVehiculo;
  titularDniEnmascarado: string;
  coincideConCliente: boolean | null;
}
