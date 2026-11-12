import { crearPagoPublico, publicoKeys, useApiClient, type PagoPublicoRequest } from '@nexa/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { guardarNumeroPagoEnCurso } from './almacenamientoPago';
import type { EstadoVerificacionPago } from '../schemas/estadoVerificacion';
import { redirigirA } from './redireccion';

/** Pantalla de espera y verificación del pago (W6). */
const RUTA_VERIFICACION = '/pago/exito';

/**
 * Cómo sigue el cliente tras el 201: `redirigir` sale a la pasarela en esta pestaña (Pasarela B);
 * `pestana-nueva` (PADI) queda en el sitio, en la pantalla de espera con el link para abrir PADI.
 */
export type SalidaPago = 'redirigir' | 'pestana-nueva';

/**
 * `POST /api/publico/pagos` (RN20). Sin reintento automático ni reenvío ciego (FC11, FC13): un
 * segundo POST crea un segundo pago. El ref corta el doble clic antes de que React pinte el
 * botón deshabilitado. Con 201 guarda solo `numeroPago`; con `redirigir` sale a la pasarela y con
 * `pestana-nueva` (PADI) navega a la espera llevando el DNI en `location.state`, nunca en storage (FC12).
 */
export function usePagarOnline() {
  const cliente = useApiClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const enCurso = useRef(false);
  const salida = useRef<SalidaPago>('redirigir');

  const mutacion = useMutation({
    mutationFn: (body: PagoPublicoRequest) => crearPagoPublico(cliente, body),
    onSuccess: async (pago, body) => {
      guardarNumeroPagoEnCurso(pago.numeroPago);
      // Las cuotas elegidas quedan con un pago en curso: si el cliente vuelve con "Atrás", ningún
      // dato público cacheado (cupón, medios de pago) debe mostrarse como antes del pago.
      await queryClient.invalidateQueries({ queryKey: publicoKeys.all });
      if (salida.current === 'redirigir') {
        redirigirA(pago.urlPago);
        return;
      }
      const estado: EstadoVerificacionPago = {
        numeroPago: pago.numeroPago,
        dni: body.dni,
        urlPago: pago.urlPago,
        medio: 'padi',
      };
      void navigate(RUTA_VERIFICACION, { state: estado });
    },
    // Con éxito el ref queda tomado: el navegador ya está saliendo a la pasarela.
    onError: () => {
      enCurso.current = false;
    },
    retry: 0,
  });

  // Al volver con "Atrás" el navegador puede restaurar la página desde su caché con el estado
  // anterior (pago enviado, botón deshabilitado): se limpia para poder elegir otro medio.
  const { reset } = mutacion;
  useEffect(() => {
    function alMostrarPagina(evento: PageTransitionEvent) {
      if (!evento.persisted) return;
      enCurso.current = false;
      reset();
    }
    window.addEventListener('pageshow', alMostrarPagina);
    return () => window.removeEventListener('pageshow', alMostrarPagina);
  }, [reset]);

  function pagar(body: PagoPublicoRequest, como: SalidaPago = 'redirigir') {
    if (enCurso.current) return;
    enCurso.current = true;
    salida.current = como;
    mutacion.mutate(body);
  }

  return {
    pagar,
    /** También tras el 201: el botón no se rehabilita mientras el navegador redirige. */
    enviando: mutacion.isPending || mutacion.isSuccess,
    error: mutacion.error,
  };
}
