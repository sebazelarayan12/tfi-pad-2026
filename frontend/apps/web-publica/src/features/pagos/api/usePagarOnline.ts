import { crearPagoPublico, publicoKeys, useApiClient, type PagoPublicoRequest } from '@nexa/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';

import { guardarNumeroPagoEnCurso } from './almacenamientoPago';
import { redirigirA } from './redireccion';

/**
 * `POST /api/publico/pagos` (RN20). Sin reintento automático ni reenvío ciego (FC11, FC13): un
 * segundo POST crea un segundo pago. El ref corta el doble clic antes de que React pinte el
 * botón deshabilitado. Con 201 guarda solo `numeroPago` y sale a la pasarela.
 */
export function usePagarOnline() {
  const cliente = useApiClient();
  const queryClient = useQueryClient();
  const enCurso = useRef(false);

  const mutacion = useMutation({
    mutationFn: (body: PagoPublicoRequest) => crearPagoPublico(cliente, body),
    onSuccess: async (pago) => {
      guardarNumeroPagoEnCurso(pago.numeroPago);
      // Las cuotas elegidas quedan con un pago en curso: si el cliente vuelve con "Atrás", ningún
      // dato público cacheado (cupón, medios de pago) debe mostrarse como antes del pago.
      await queryClient.invalidateQueries({ queryKey: publicoKeys.all });
      redirigirA(pago.urlPago);
    },
    // Con éxito el ref queda tomado: el navegador ya está saliendo a la pasarela.
    onError: () => {
      enCurso.current = false;
    },
    retry: 0,
  });

  function pagar(body: PagoPublicoRequest) {
    if (enCurso.current) return;
    enCurso.current = true;
    mutacion.mutate(body);
  }

  return {
    pagar,
    /** También tras el 201: el botón no se rehabilita mientras el navegador redirige. */
    enviando: mutacion.isPending || mutacion.isSuccess,
    error: mutacion.error,
  };
}
