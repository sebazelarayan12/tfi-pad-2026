import type { CuotaResponse } from './polizas';

export type SexoCliente = 'M' | 'F' | 'X';

/** Detail returned by CU05. Renaper fields belong to the detail, not the list summary. */
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
  /** UTC, potentially without Z when read from SQL Server (PB-16). */
  fechaValidacionRenaper: string | null;
  activo: boolean;
}

/** Exact seven-field backend summary; the extra list fields of PB-03 remain unavailable. */
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

/** CU05 only changes contact details and address, never identity or Renaper data. */
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

/** Proposed contract, exclusively MSW (PB-28). Does not enable the account rail. */
export interface CuentaClienteResponse {
  deudaVencida: number;
  cuotaVencidaConRecargo: CuotaCuentaCliente | null;
  proximaCuota: CuotaCuentaCliente | null;
}
