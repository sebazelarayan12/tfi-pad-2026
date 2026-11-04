import { useId } from 'react';
import type { ReactNode } from 'react';

export interface DialogoProps {
  titulo: string;
  descripcion?: string;
  /** Acciones: los botones los pasa la pantalla, que también decide el foco inicial (RV-D05). */
  children: ReactNode;
}

/**
 * Diálogo de confirmación: `<dialog>` nativo con `role="alertdialog"`, sin botones propios.
 * Se renderiza abierto; la pantalla decide cuándo montarlo.
 */
export function Dialogo({ titulo, descripcion, children }: DialogoProps) {
  const id = useId();
  const idTitulo = `${id}-titulo`;
  const idDescripcion = `${id}-descripcion`;

  return (
    <dialog
      open
      role="alertdialog"
      aria-labelledby={idTitulo}
      aria-describedby={descripcion ? idDescripcion : undefined}
      className="flex flex-col gap-sp-16 rounded-card bg-surface-panel p-sp-24"
    >
      <h2 id={idTitulo} className="text-h3 text-text-primary">
        {titulo}
      </h2>
      {descripcion ? (
        <p id={idDescripcion} className="text-body-sm text-text-secondary">
          {descripcion}
        </p>
      ) : null}
      <div className="flex justify-end gap-sp-8">{children}</div>
    </dialog>
  );
}
