import { useId, useLayoutEffect, useRef } from 'react';
import type { ReactNode } from 'react';

export interface DialogoProps {
  titulo: string;
  descripcion?: string;
  rol?: 'dialog' | 'alertdialog';
  /** Activa la modalidad nativa y delega el cierre por Escape a la pantalla. */
  onCancelar?: () => void;
  /** Acciones: los botones los pasa la pantalla, que también decide el foco inicial (RV-D05). */
  children: ReactNode;
}

/**
 * Diálogo nativo sin acciones propias. La pantalla decide cuándo montarlo.
 * Con onCancelar usa showModal; data-foco-inicial señala el control que recibe el foco.
 */
export function Dialogo({
  titulo,
  descripcion,
  rol = 'alertdialog',
  onCancelar,
  children,
}: DialogoProps) {
  const id = useId();
  const elemento = useRef<HTMLDialogElement>(null);
  const idTitulo = `${id}-titulo`;
  const idDescripcion = `${id}-descripcion`;
  const modal = onCancelar !== undefined;

  useLayoutEffect(() => {
    const dialogo = elemento.current;
    if (!modal || !dialogo) return;
    const disparador = document.activeElement;
    if (typeof dialogo.showModal === 'function') dialogo.showModal();
    else dialogo.open = true;
    dialogo.querySelector<HTMLElement>('[data-foco-inicial]')?.focus();
    return () => {
      if (typeof dialogo.close === 'function') dialogo.close();
      else dialogo.open = false;
      if (disparador instanceof HTMLElement && disparador.isConnected) disparador.focus();
    };
  }, [modal]);

  return (
    <dialog
      ref={elemento}
      open={modal ? undefined : true}
      role={rol}
      aria-modal={modal || undefined}
      aria-labelledby={idTitulo}
      aria-describedby={descripcion ? idDescripcion : undefined}
      onCancel={(evento) => {
        if (!onCancelar) return;
        evento.preventDefault();
        onCancelar();
      }}
      onKeyDown={(evento) => {
        if (evento.key === 'Escape' && typeof evento.currentTarget.showModal !== 'function') {
          onCancelar?.();
        }
      }}
      className={
        modal
          ? 'm-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg flex-col gap-sp-16 overflow-y-auto rounded-card bg-surface-panel p-sp-24 open:flex backdrop:bg-black/40'
          : 'flex flex-col gap-sp-16 rounded-card bg-surface-panel p-sp-24'
      }
    >
      <h2 id={idTitulo} className="text-h3 text-text-primary">
        {titulo}
      </h2>
      {descripcion ? (
        <p id={idDescripcion} className="text-body-sm text-text-secondary">
          {descripcion}
        </p>
      ) : null}
      {modal ? children : <div className="flex justify-end gap-sp-8">{children}</div>}
    </dialog>
  );
}
