import { useSyncExternalStore } from 'react';

/** Breakpoint de escritorio (design-system §7.4, D-35). */
const QUERY_ESCRITORIO = '(min-width: 768px)';

const haySoporte = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function';

/**
 * Indica si la media query coincide y se actualiza cuando cambia.
 * Sin `matchMedia` (jsdom, render en servidor) devuelve `true`: se muestra la vista de escritorio.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (avisar) => {
      if (!haySoporte()) return () => undefined;
      const lista = window.matchMedia(query);
      lista.addEventListener('change', avisar);
      return () => lista.removeEventListener('change', avisar);
    },
    () => (haySoporte() ? window.matchMedia(query).matches : true),
    () => true,
  );
}

/** `true` desde 768 px (W-04 usa la vista de escritorio; W-05 agrega la rama móvil). */
export function useEsEscritorio(): boolean {
  return useMediaQuery(QUERY_ESCRITORIO);
}
