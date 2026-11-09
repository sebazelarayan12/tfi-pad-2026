import {
  cobrarEnCaja,
  isApiError,
  obtenerFacturaDePago,
  obtenerPago,
  obtenerPdfDeFactura,
  pagosKeys,
  polizasKeys,
  useApiClient,
  type PagoCajaRequest,
} from '@nexa/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

const MAX_REINTENTOS_CONSULTA = 2;
const STATUS_SERVER_ERROR = 500;
const REVOCAR_URL_MS = 60_000;

function reintentarFactura(intento: number, error: unknown): boolean {
  if (isApiError(error) && error.status > 0 && error.status < STATUS_SERVER_ERROR) return false;
  return intento < MAX_REINTENTOS_CONSULTA;
}

/**
 * Cobra cuotas en caja. No reintenta (FC11) y, al terminar, invalida las cuotas
 * y los pagos porque un cobro puede tocar varias pólizas del mismo cliente.
 */
export function useCobrarCuotas(polizaId?: string) {
  const cliente = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: PagoCajaRequest) => cobrarEnCaja(cliente, body),
    retry: 0,
    // Sin conexión falla en el momento: no queda pausado ni se envía solo al volver la red (PB-12).
    networkMode: 'always',
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: polizasKeys.all });
      void queryClient.invalidateQueries({ queryKey: pagosKeys.all });
      if (polizaId !== undefined) {
        void queryClient.invalidateQueries({ queryKey: polizasKeys.cuotas(polizaId) });
      }
    },
    onError: () => {
      // Tras un error de red o de negocio, la UI tiene que releer el estado real.
      void queryClient.invalidateQueries({ queryKey: polizasKeys.all });
    },
  });
}

/** Detalle de un pago (`GET /api/pagos/{id}`). */
export function usePago(pagoId: string) {
  const cliente = useApiClient();

  return useQuery({
    queryKey: pagosKeys.detalle(pagoId),
    queryFn: () => obtenerPago(cliente, pagoId),
    enabled: pagoId.length > 0,
  });
}

/** Descarga el PDF de la factura y lo abre en una pestaña nueva. */
export function useAbrirFacturaPdf(pagoId: string) {
  const cliente = useApiClient();
  const [estado, setEstado] = useState<'reposo' | 'abriendo' | 'error'>('reposo');

  // No es una mutación de TanStack: descargar un PDF no cambia nada en el servidor ni en la caché.
  const abrir = useCallback(async () => {
    setEstado('abriendo');
    try {
      const { blob } = await obtenerPdfDeFactura(cliente, pagoId);
      const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.target = '_blank';
      enlace.rel = 'noopener';
      enlace.click();
      // Se libera tarde: la pestaña nueva todavía necesita leer el blob.
      setTimeout(() => URL.revokeObjectURL(url), REVOCAR_URL_MS);
      setEstado('reposo');
    } catch {
      setEstado('error');
    }
  }, [cliente, pagoId]);

  return { abrir, abriendo: estado === 'abriendo', fallo: estado === 'error' };
}

/** Factura de un pago (`GET /api/pagos/{id}/factura`); un 404 no se reintenta. */
export function useFactura(pagoId: string) {
  const cliente = useApiClient();

  return useQuery({
    queryKey: pagosKeys.factura(pagoId),
    queryFn: () => obtenerFacturaDePago(cliente, pagoId),
    enabled: pagoId.length > 0,
    retry: reintentarFactura,
  });
}
