import { useEffect, useRef } from 'react';

import { useMediaQuery } from '../hooks/useMediaQuery';

const MOVIMIENTO_REDUCIDO = '(prefers-reduced-motion: reduce)';

/**
 * Reproduce el video una sola vez cada vez que su bloque entra en pantalla: al cargar la página
 * corre la animación y queda quieto en el último cuadro (sin `loop`); si la persona baja y vuelve
 * a subir, arranca de nuevo. Con movimiento reducido no se reproduce y queda el `poster`.
 */
export function useReproducirAlEntrar<T extends HTMLElement>() {
  const bloqueRef = useRef<T>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reducido = useMediaQuery(MOVIMIENTO_REDUCIDO);

  useEffect(() => {
    const bloque = bloqueRef.current;
    const video = videoRef.current;
    if (!bloque || !video || reducido || typeof IntersectionObserver === 'undefined') return;

    let visible = false;
    const observador = new IntersectionObserver(([entrada]) => {
      if (!entrada) return;
      if (entrada.isIntersecting && !visible) {
        video.currentTime = 0;
        // Si el navegador bloquea la reproducción automática, queda el poster: no es un error.
        video.play().catch(() => undefined);
      }
      visible = entrada.isIntersecting;
    });
    observador.observe(bloque);
    return () => observador.disconnect();
  }, [reducido]);

  return { bloqueRef, videoRef };
}
