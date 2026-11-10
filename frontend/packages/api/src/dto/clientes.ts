import type { CuotaResponse } from './polizas';
import type { ProblemDetails } from './comunes';

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

/**
 * Resumen del listado. `cantidadPolizasActivas` cuenta Pendiente, Vigente y Suspendida (la misma regla
 * que bloquea la baja del cliente, RN15); `cantidadVehiculos` cuenta solo los vehículos activos.
 */
export interface ClienteResumenResponse {
  id: string;
  dni: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  activo: boolean;
  validadoRenaper: boolean;
  cantidadVehiculos: number;
  cantidadPolizasActivas: number;
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

/** CU04: los datos oficiales de Renaper reemplazan identidad y domicilio al validar. */
export interface ClienteAltaRequest extends ClienteModificacionRequest {
  dni: string;
  nombre: string;
  apellido: string;
  cuil: string;
  fechaNacimiento: string;
  sexo: SexoCliente;
}

export interface DomicilioRenaperResponse {
  calle: string;
  numero: string;
  piso: string | null;
  depto: string | null;
  localidad: string;
  provincia: string;
  codigoPostal: string;
}

/**
 * Lo que Renaper publica de la persona. OpenRENAPER no informa apellido (viene junto con el nombre),
 * fecha de nacimiento ni domicilio, y cualquier dato puede faltar: `null` es "no publicado", nunca un valor inventado.
 */
export interface PersonaRenaperResponse {
  dni: string;
  cuil: string | null;
  nombre: string;
  apellido: string | null;
  fechaNacimiento: string | null;
  sexo: SexoCliente | null;
  domicilio: DomicilioRenaperResponse | null;
  estado: 'VIGENTE' | 'FALLECIDO';
  fechaFallecimiento: string | null;
}

export type ErrorClienteCodigo = 'CLIENTE_NO_ENCONTRADO' | 'PERSONA_NO_ENCONTRADA';
export interface ProblemDetailsConCodigo extends ProblemDetails {
  codigo?: ErrorClienteCodigo;
}
