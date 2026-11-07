import { Button, Dialogo } from '@nexa/ui';
import { useEffect, useRef } from 'react';

interface Props {
  nombre: string;
  enviando: boolean;
  onCancelar: () => void;
  onConfirmar: () => void;
}

/**
 * Confirmación de `Desactivar` (D-B25-06). El foco inicial va a `Cancelar`; `Escape` cierra sin enviar.
 * Confirmar se deshabilita mientras corre para enviar un solo PATCH.
 */
export function ConfirmarDesactivarUsuarioDialog({
  nombre,
  enviando,
  onCancelar,
  onConfirmar,
}: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  useEffect(() => {
    contenedor.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }, []);

  return (
    <div
      ref={contenedor}
      role="presentation"
      onKeyDown={(evento) => {
        if (evento.key === 'Escape') onCancelar();
      }}
    >
      <Dialogo
        titulo={`Desactivar a ${nombre}`}
        descripcion="Deja de poder ingresar al sistema hasta que lo actives de nuevo."
      >
        <Button label="Cancelar" variant="secondary" onClick={onCancelar} />
        <Button label="Desactivar" onClick={onConfirmar} disabled={enviando} aria-busy={enviando} />
      </Dialogo>
    </div>
  );
}
