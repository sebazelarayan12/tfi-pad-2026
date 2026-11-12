import { consultarEstadoPagoPublico, publicoKeys, useApiClient } from '@nexa/api';
import { useQuery } from '@tanstack/react-query';

/** Cada cuánto se consulta mientras el cliente paga en PADI. RN20 admite 10 pedidos por minuto y por IP. */
export const INTERVALO_SONDEO_MS = 10_000;
/** El link de PADI vence antes que la reserva (60 min menos 10): pasado ese tiempo no tiene sentido seguir. */
export const DURACION_MAXIMA_SONDEO_MS = 50 * 60_000;

interface Sondeo {
  /** Instante (ms) en que el cliente abrió PADI. */
  desde: number;
}

/**
 * Estado del pago (`POST /api/publico/pagos/estado`, PB-01) con número de pago + DNI (RV-D17,
 * decisión de Martin). Corre cuando el usuario lo pide (`habilitada`): "Ya pagué, verificar" o el DNI
 * cargado. Con `sondeo` (el cliente abrió PADI) además se repite solo cada `INTERVALO_SONDEO_MS` hasta que
 * el pago deja de estar pendiente, la consulta falla (incluido el 429) o pasa `DURACION_MAXIMA_SONDEO_MS`.
 */
export function usePagoEnCurso(
  numeroPago: string | null,
  dni: string | null,
  habilitada: boolean,
  sondeo: Sondeo | null = null,
) {
  const cliente = useApiClient();

  return useQuery({
    queryKey: publicoKeys.estadoPago(numeroPago ?? ''),
    queryFn: () =>
      consultarEstadoPagoPublico(cliente, { numeroPago: numeroPago ?? '', dni: dni ?? '' }),
    enabled: habilitada && numeroPago !== null && dni !== null,
    retry: false,
    refetchOnWindowFocus: sondeo !== null,
    // El cliente está en la pestaña de PADI: la de acá queda en segundo plano.
    refetchIntervalInBackground: true,
    refetchInterval: (consulta) => {
      if (sondeo === null || consulta.state.error) return false;
      if (consulta.state.data && consulta.state.data.estado !== 'PENDIENTE') return false;
      return Date.now() - sondeo.desde < DURACION_MAXIMA_SONDEO_MS ? INTERVALO_SONDEO_MS : false;
    },
  });
}
