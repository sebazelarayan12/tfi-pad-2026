import { estadoPagoPublicoMock, publicoKeys, useApiClient } from '@nexa/api';
import { useQuery } from '@tanstack/react-query';

/**
 * Estado del pago que dejó W4, por `numeroPago` y sin DNI (DB-W8-1 opción A, RV-D17).
 * `POST /api/publico/pagos/estado` no existe en el back (PB-01): hoy responde MSW.
 * Sin reintento ni polling (RN20, FC13): "Volver a consultar" llama a `refetch` por clic.
 */
export function usePagoEnCurso(numeroPago: string | null) {
  const cliente = useApiClient();

  return useQuery({
    queryKey: publicoKeys.estadoPago(numeroPago ?? ''),
    queryFn: () => estadoPagoPublicoMock(cliente, { numeroPago: numeroPago ?? '' }),
    enabled: numeroPago !== null,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
