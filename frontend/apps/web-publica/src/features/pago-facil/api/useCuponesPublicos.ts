import {
  cuponPublicoMock,
  publicoKeys,
  useApiClient,
  type CuotaPublica,
  type CuponPagoFacilResponse,
} from '@nexa/api';
import { useQueries } from '@tanstack/react-query';

interface CuponesPublicosParams {
  dni: string;
  numeroPoliza: string;
  /** Cuotas elegidas, ya ordenadas por número. */
  cuotas: ReadonlyArray<CuotaPublica>;
}

/**
 * Un `POST /api/publico/cupon` por cuota, con `numeroCuota` (PB-02, DN-W7-5). Hoy solo existe en
 * MSW. Sin reintento automático (RN20, FC13) y sin caché entre visitas: el código cambia con la
 * fecha (W5 §6.3). Nunca usa `GET /api/pagofacil/...`, que es de empleados.
 */
export function useCuponesPublicos({ dni, numeroPoliza, cuotas }: CuponesPublicosParams) {
  const cliente = useApiClient();

  return useQueries({
    queries: cuotas.map((cuota) => ({
      queryKey: publicoKeys.cupon(numeroPoliza, cuota.idCuota),
      queryFn: (): Promise<CuponPagoFacilResponse> =>
        cuponPublicoMock(cliente, { dni, numeroPoliza, numeroCuota: cuota.numero }),
      retry: false,
      staleTime: 0,
      gcTime: 0,
      refetchOnWindowFocus: false,
    })),
  });
}
