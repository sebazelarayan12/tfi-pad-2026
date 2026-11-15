import { useEffect, useRef, useState, type ReactNode } from 'react';

interface AparecerProps {
  children: ReactNode;
  /** Retraso de la entrada, para escalonar elementos de una misma fila. */
  retardoMs?: number;
  className?: string;
}

const UMBRAL_VISIBLE = 0.15;
// Recorta un poco el borde de abajo de la ventana: el bloque entra cuando ya asomó, no en el borde.
const MARGEN_VENTANA = '0px 0px -8% 0px';

/**
 * Entrada y salida suaves (opacidad, desplazamiento y desenfoque) al hacer scroll: el bloque
 * aparece cuando entra en pantalla y se vuelve a desvanecer cuando sale, hacia arriba o hacia
 * abajo. Respeta `prefers-reduced-motion` y, sin `IntersectionObserver`, muestra el contenido.
 */
export function Aparecer({ children, retardoMs = 0, className = '' }: AparecerProps) {
  const nodo = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const elemento = nodo.current;
    if (!elemento || typeof IntersectionObserver === 'undefined') return;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada) setVisible(entrada.isIntersecting);
      },
      { threshold: UMBRAL_VISIBLE, rootMargin: MARGEN_VENTANA },
    );
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  const estado = visible
    ? 'translate-y-0 opacity-100 blur-0'
    : 'translate-y-12 opacity-0 blur-sm motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:blur-0';

  return (
    <div
      ref={nodo}
      // El retraso solo escalona la entrada; al salir, todo se desvanece a la vez.
      style={{ transitionDelay: visible ? `${retardoMs}ms` : '0ms' }}
      className={`transition-[opacity,transform,filter] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${estado} ${className}`}
    >
      {children}
    </div>
  );
}
