import type { CuotaResponse } from './polizas';

export type SexoCliente = 'M' | 'F' | 'X';

/** Detalle de CU05. Los campos de Renaper pertenecen al detalle, no al resumen del listado. */
export interface ClienteResponse {
  id: string;
  dni: string;
  cuil: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  sexo: SexoCliente;
  email: string;
  telefono: string | null;
  calle: string;
  numero: string;
  localidad: string;
  provincia: string;
  codigoPostal: string;
  validadoRenaper: boolean;
  /** UTC; puede llegar sin Z al leer desde SQL Server (PB-16). */
  fechaValidacionRenaper: string | null;
  activo: boolean;
}

/** Resumen de siete campos del backend; los campos adicionales de PB-03 siguen pendientes. */
export interface ClienteResumenResponse {
  id: string;
  dni: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  activo: boolean;
}

export interface ClienteFiltro {
  dni?: string;
  apellido?: string;
  pagina?: number;
  tamanoPagina?: number;
}

/** CU05 permite editar solo contacto y domicilio; excluye identidad y datos de Renaper. */
export interface ClienteModificacionRequest {
  email: string;
  telefono?: string | null;
  calle: string;
  numero: string;
  localidad: string;
  provincia: string;
  codigoPostal: string;
}

export type CuotaCuentaCliente = CuotaResponse;

/** Contrato propuesto, exclusivo de MSW (PB-28). No habilita el panel Cuenta. */
export interface CuentaClienteResponse {
  deudaVencida: number;
  cuotaVencidaConRecargo: CuotaCuentaCliente | null;
  proximaCuota: CuotaCuentaCliente | null;
}
