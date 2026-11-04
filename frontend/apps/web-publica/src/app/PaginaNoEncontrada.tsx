import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/** Ruta desconocida. El foco va al `h1` para lectores de pantalla (FC16). */
export function PaginaNoEncontrada() {
  const titulo = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titulo.current?.focus();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-sp-16 p-sp-24">
      <h1 ref={titulo} tabIndex={-1} className="text-text-primary">
        Página no encontrada
      </h1>
      <Link to="/" className="text-action-primary underline">
        Volver al inicio
      </Link>
    </main>
  );
}
