import { DotsThreeIcon } from '@phosphor-icons/react/dist/csr/DotsThree';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

interface MenuUsuarioProps {
  nombre: string;
  activo: boolean;
  /** Si no es `null`, `Desactivar` queda bloqueado y se muestra este motivo (D-B25-02). */
  motivoBloqueo: string | null;
  onEditar: () => void;
  onDesactivar: () => void;
  onActivar: () => void;
}

const ITEM =
  'w-full px-sp-12 py-sp-8 text-left text-body-sm text-text-primary hover:bg-surface-subtle focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-action-primary aria-disabled:cursor-not-allowed aria-disabled:text-text-secondary';

/**
 * Menú de acciones de una fila (B14 §8, D-B25-07): `Editar` y `Desactivar` o `Activar`.
 * Flechas mueven el foco, `Escape` cierra y devuelve el foco al botón.
 */
export function MenuUsuario({
  nombre,
  activo,
  motivoBloqueo,
  onEditar,
  onDesactivar,
  onActivar,
}: MenuUsuarioProps) {
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const idMotivo = useId();
  const desactivarBloqueado = activo && motivoBloqueo !== null;

  const items = () =>
    Array.from(raiz.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []);

  // Al abrir el foco va al primer ítem; al hacer clic afuera se cierra sin robar el foco.
  useEffect(() => {
    if (!abierto) return;
    items()[0]?.focus();
    const afuera = (evento: MouseEvent) => {
      if (!raiz.current?.contains(evento.target as Node)) setAbierto(false);
    };
    document.addEventListener('mousedown', afuera);
    return () => document.removeEventListener('mousedown', afuera);
  }, [abierto]);

  function cerrar(devolverFoco: boolean) {
    setAbierto(false);
    if (devolverFoco) boton.current?.focus();
  }

  function alTeclear(evento: KeyboardEvent) {
    if (evento.key === 'Escape') {
      evento.preventDefault();
      cerrar(true);
      return;
    }
    if (evento.key === 'Tab') {
      setAbierto(false);
      return;
    }
    if (evento.key !== 'ArrowDown' && evento.key !== 'ArrowUp') return;
    evento.preventDefault();
    const lista = items();
    const actual = lista.indexOf(document.activeElement as HTMLButtonElement);
    const paso = evento.key === 'ArrowDown' ? 1 : -1;
    lista[(actual + paso + lista.length) % lista.length]?.focus();
  }

  function elegir(accion: () => void) {
    cerrar(false);
    accion();
  }

  return (
    <div ref={raiz} role="presentation" className="relative inline-flex" onKeyDown={alTeclear}>
      <button
        ref={boton}
        type="button"
        aria-label={`Acciones de ${nombre}`}
        aria-haspopup="menu"
        aria-expanded={abierto}
        onClick={() => setAbierto((valor) => !valor)}
        className="inline-flex rounded-input p-sp-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
      >
        <span aria-hidden="true" className="inline-flex">
          <DotsThreeIcon size={16} weight="regular" />
        </span>
      </button>
      {abierto ? (
        <div
          role="menu"
          aria-label={`Acciones de ${nombre}`}
          className="absolute right-0 top-full z-10 mt-sp-4 flex w-56 flex-col rounded-input border border-border-strong bg-surface-panel py-sp-4 shadow-card"
        >
          <button type="button" role="menuitem" className={ITEM} onClick={() => elegir(onEditar)}>
            Editar
          </button>
          {activo ? (
            <button
              type="button"
              role="menuitem"
              aria-disabled={desactivarBloqueado || undefined}
              aria-describedby={desactivarBloqueado ? idMotivo : undefined}
              className={ITEM}
              onClick={() => {
                if (!desactivarBloqueado) elegir(onDesactivar);
              }}
            >
              Desactivar
            </button>
          ) : (
            <button
              type="button"
              role="menuitem"
              className={ITEM}
              onClick={() => elegir(onActivar)}
            >
              Activar
            </button>
          )}
          {desactivarBloqueado ? (
            <p id={idMotivo} className="px-sp-12 pb-sp-8 text-body-sm text-text-secondary">
              {motivoBloqueo}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
