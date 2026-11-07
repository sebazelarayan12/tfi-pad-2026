import { ApiError, cotizacionesKeys, cotizarVehiculo, useApiClient } from '@nexa/api';
import { toast } from '@nexa/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';

export function useCotizar() {
  const api = useApiClient();
  const cache = useQueryClient();
  const enCurso = useRef(false);
  const mutacion = useMutation({
    mutationFn: (vehiculoId: string) => cotizarVehiculo(api, { vehiculoId }),
    retry: 0,
    onSuccess: ({ opciones }) => {
      for (const opcion of opciones) {
        void cache.invalidateQueries({
          queryKey: cotizacionesKeys.detalle(opcion.idCotizacion),
          exact: true,
          refetchType: 'none',
        });
      }
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) return;
      const mensaje =
        error instanceof ApiError && error.detail?.trim()
          ? error.detail
          : 'No se pudo cotizar el vehículo. Intentá de nuevo.';
      toast.error(mensaje);
    },
    onSettled: () => {
      enCurso.current = false;
    },
  });

  function cotizar(vehiculoId: string) {
    // PB-12: el POST escribe una cotización por opción y dos clics pueden llegar antes del render.
    if (enCurso.current) return;
    enCurso.current = true;
    mutacion.mutate(vehiculoId);
  }

  return { cotizar, resultado: mutacion.data, cotizando: mutacion.isPending };
}
