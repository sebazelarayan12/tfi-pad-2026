import { useCallback, useSyncExternalStore } from 'react';

export function estaVigente(limite: number | undefined): boolean {
  return limite !== undefined && Date.now() <= limite;
}

export function useCotizacionVigente(limite: number | undefined): boolean {
  const consultar = useCallback(() => estaVigente(limite), [limite]);
  const suscribir = useCallback(
    (actualizar: () => void) => {
      if (limite === undefined || !estaVigente(limite)) return () => {};
      // RN06: la cotización vence a los 15 días, dentro del límite de setTimeout.
      const timer = window.setTimeout(actualizar, Math.max(0, limite - Date.now() + 1));
      return () => window.clearTimeout(timer);
    },
    [limite],
  );
  return useSyncExternalStore(suscribir, consultar);
}
