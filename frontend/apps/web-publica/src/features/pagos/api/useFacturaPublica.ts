import { obtenerFacturaPublica, publicoKeys, useApiClient } from '@nexa/api';
import { useQuery } from '@tanstack/react-query';

/**
 * Factura del pago aprobado (`POST /api/publico/factura`) con número de pago + DNI (RV-D17).
 * Solo la usa la vista del pago `APROBADO`. Un 404 significa "todavía sin factura" y no se muestra
 * como error. Sin reintento (RN20, FC13).
 */
export function useFacturaPublica(numeroPago: string, dni: string) {
  const cliente = useApiClient();

  return useQuery({
    queryKey: publicoKeys.factura(numeroPago),
    queryFn: () => obtenerFacturaPublica(cliente, { numeroPago, dni }),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
