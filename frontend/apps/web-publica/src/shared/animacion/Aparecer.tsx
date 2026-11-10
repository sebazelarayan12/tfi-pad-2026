import { useEffect, useRef, useState, type ReactNode } from 'react';

interface AparecerProps {
  children: ReactNode;
  /** Retraso de la entrada, para escalonar elementos de una misma fila. */
  retardoMs?: number;
  className?: string;
}

const UMBRAL_VISIBLE = 0.15;

/**
 * Entrada suave (opacidad y desplazamiento) cuando el bloque entra en pantalla. Respeta
 * `prefers-reduced-motion` y, sin `IntersectionObserver`, muestra el contenido de entrada.
 */
export function Aparecer({ children, retardoMs = 0, className = '' }: AparecerProps) {
  const nodo = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const elemento = nodo.current;
    if (visible || !elemento) return;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada?.isIntersecting) return;
        setVisible(true);
        observador.disconnect();
      },
      { threshold: UMBRAL_VISIBLE },
    );
    observador.observe(elemento);
    return () => observador.disconnect();
  }, [visible]);

  const estado = visible
    ? 'opacity-100 translate-y-0'
    : 'translate-y-6 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100';

  return (
    <div
      ref={nodo}
      style={{ transitionDelay: `${retardoMs}ms` }}
      className={`transition duration-700 ease-out motion-reduce:transition-none ${estado} ${className}`}
    >
      {children}
    </div>
  );
}
