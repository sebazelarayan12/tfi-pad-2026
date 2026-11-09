import { obtenerEnum, type PolizaListItemResponse, type VehiculoResponse } from '@nexa/api';

/** RN04 (D-B07-6): una póliza ocupa el vehículo mientras esté Pendiente, Vigente o Suspendida. */
const ESTADOS_ACTIVOS: readonly string[] = ['Pendiente', 'Vigente', 'Suspendida'];

/** Quita espacios y mayúsculas: el cruce no depende de cómo viene escrita la patente. */
export function normalizarPatente(patente: string): string {
  return patente.replace(/\s+/g, '').toUpperCase();
}

export function esPolizaActiva(poliza: Pick<PolizaListItemResponse, 'estado'>): boolean {
  const estado = obtenerEnum('EstadoPoliza', poliza.estado);
  return estado !== null && ESTADOS_ACTIVOS.includes(estado.literal);
}

/**
 * Póliza activa de un vehículo: la primera del listado que cumple RN04. El back ordena por
 * `fechaEmision` descendente, así que la primera es la más reciente (no la de número mayor).
 */
export function polizaActivaDeVehiculo(
  vehiculo: Pick<VehiculoResponse, 'patente'>,
  polizas: readonly PolizaListItemResponse[],
): PolizaListItemResponse | undefined {
  const patente = normalizarPatente(vehiculo.patente);
  return polizas.find(
    (poliza) => esPolizaActiva(poliza) && normalizarPatente(poliza.patente) === patente,
  );
}

/** Vehículo de una póliza por patente, para la columna "Vehículo" de la tabla. */
export function vehiculoDePoliza(
  poliza: Pick<PolizaListItemResponse, 'patente'>,
  vehiculos: readonly VehiculoResponse[],
): VehiculoResponse | undefined {
  const patente = normalizarPatente(poliza.patente);
  return vehiculos.find((vehiculo) => normalizarPatente(vehiculo.patente) === patente);
}
