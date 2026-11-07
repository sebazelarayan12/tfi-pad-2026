import { obtenerEnum, type CuotaResponse } from '@nexa/api';

/**
 * Próxima cuota (D-B07-2): la primera, por número, con estado Pendiente. Una cuota Vencida
 * no cuenta: ya pasó su fecha y se ve en otra pantalla.
 */
export function proximaCuota(cuotas: readonly CuotaResponse[]): CuotaResponse | undefined {
  return [...cuotas]
    .sort((a, b) => a.numero - b.numero)
    .find((cuota) => obtenerEnum('EstadoCuota', cuota.estado)?.literal === 'Pendiente');
}
