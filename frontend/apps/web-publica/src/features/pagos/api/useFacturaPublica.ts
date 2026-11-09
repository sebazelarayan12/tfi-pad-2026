import { obtenerFacturaPublica, publicoKeys, useApiClient } from '@nexa/api';
import { useQuery } from '@tanstack/react-query';

/**
 * Factura del pago aprobado (`POST /api/publico/factura`), por `numeroPago` y sin DNI
 * (DB-W8-1 opción A, RV-D17). Solo la usa la vista del pago `APROBADO`. Un 404 significa
 * "todavía sin factura" y no se muestra como error. Sin reintento (RN20, FC13).
 */
export function useFacturaPublica(numeroPago: string) {
  const cliente = useApiClient();

  return useQuery({
    queryKey: publicoKeys.factura(numeroPago),
    queryFn: () => obtenerFacturaPublica(cliente, { numeroPago }),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
