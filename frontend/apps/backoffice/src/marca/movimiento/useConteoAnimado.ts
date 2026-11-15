import { useEffect, useRef, useState } from 'react';

const DURACION_MS = 800;

/** Sin `matchMedia` (tests) o con movimiento reducido, las cifras se muestran directo. */
function puedeAnimar(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function suavizar(avance: number): number {
  return 1 - (1 - avance) ** 3;
}

/**
 * Cuenta desde el valor anterior (cero la primera vez) hasta `valor`. Es solo visual:
 * el valor real sigue disponible para lectores de pantalla en quien lo use.
 */
export function useConteoAnimado(valor: number): number {
  const [animar] = useState(puedeAnimar);
  const [mostrado, setMostrado] = useState(animar ? 0 : valor);
  const desde = useRef(0);

  useEffect(() => {
    if (!animar) return undefined;
    const inicio = performance.now();
    const origen = desde.current;
    let cuadro = 0;
    function paso(ahora: number) {
      const avance = Math.min((ahora - inicio) / DURACION_MS, 1);
      const actual = Math.round(origen + (valor - origen) * suavizar(avance));
      desde.current = actual;
      setMostrado(actual);
      if (avance < 1) cuadro = requestAnimationFrame(paso);
    }
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [animar, valor]);

  return animar ? mostrado : valor;
}
