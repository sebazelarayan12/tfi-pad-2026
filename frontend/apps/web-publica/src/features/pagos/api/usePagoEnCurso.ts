import { consultarEstadoPagoPublico, publicoKeys, useApiClient } from '@nexa/api';
import { useQuery } from '@tanstack/react-query';

/**
 * Estado del pago (`POST /api/publico/pagos/estado`, PB-01) con número de pago + DNI (RV-D17,
 * decisión de Martin). Solo corre cuando el usuario lo pide (`habilitada`): "Ya pagué, verificar"
 * o el DNI cargado. Sin reintento ni polling (RN20, FC13): las reconsultas son `refetch` por clic.
 */
export function usePagoEnCurso(numeroPago: string | null, dni: string | null, habilitada: boolean) {
  const cliente = useApiClient();

  return useQuery({
    queryKey: publicoKeys.estadoPago(numeroPago ?? ''),
    queryFn: () =>
      consultarEstadoPagoPublico(cliente, { numeroPago: numeroPago ?? '', dni: dni ?? '' }),
    enabled: habilitada && numeroPago !== null && dni !== null,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
