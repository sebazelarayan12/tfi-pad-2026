import { Button, Dialogo } from '@nexa/ui';
import { useEffect, useRef } from 'react';

interface Props {
  onSeguirEditando: () => void;
  onDescartar: () => void;
}

/** Confirmación al cancelar con datos cargados (D-B05-3). El foco inicial va a "Seguir editando". */
export function ConfirmarDescarte({ onSeguirEditando, onDescartar }: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  useEffect(() => {
    contenedor.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }, []);

  return (
    <div ref={contenedor}>
      <Dialogo titulo="¿Descartar los datos cargados?">
        <Button label="Seguir editando" variant="secondary" onClick={onSeguirEditando} />
        <Button label="Descartar" onClick={onDescartar} />
      </Dialogo>
    </div>
  );
}
