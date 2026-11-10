interface BloqueCodigoProps {
  /** Nombre accesible del bloque, p. ej. "Ejemplo de respuesta". */
  etiqueta: string;
  codigo: string;
}

/** Bloque de código con scroll horizontal (los navegadores lo vuelven enfocable). */
export function BloqueCodigo({ etiqueta, codigo }: BloqueCodigoProps) {
  return (
    <pre
      aria-label={etiqueta}
      className="m-0 overflow-x-auto rounded-input border border-border-strong bg-surface-panel p-sp-16 font-mono text-body-sm text-text-primary"
    >
      <code>{codigo}</code>
    </pre>
  );
}
