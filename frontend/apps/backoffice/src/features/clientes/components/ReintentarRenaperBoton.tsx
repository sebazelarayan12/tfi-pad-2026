import { isApiError } from '@nexa/api';
import { AlertaError, Button, toast } from '@nexa/ui';
import { useRef } from 'react';

import { mensajeMutacionCliente } from '../api/mensajeMutacionCliente';
import { useReintentarValidacionRenaper } from '../api/useReintentarValidacionRenaper';

function mensajeRenaper(error: unknown) {
  if (isApiError(error) && (error.status === 502 || error.kind === 'red')) {
    return 'Renaper no responde. Probá de nuevo más tarde.';
  }
  return mensajeMutacionCliente(error, 'No pudimos validar al cliente en Renaper. Probá de nuevo.');
}

export function ReintentarRenaperBoton({ clienteId }: { clienteId: string }) {
  const validacion = useReintentarValidacionRenaper(clienteId);
  const enviando = useRef(false);

  function validar() {
    if (enviando.current) return;
    enviando.current = true;
    validacion.mutate(undefined, {
      onSuccess: () => toast.success('Cliente validado en Renaper.'),
      onSettled: () => {
        enviando.current = false;
      },
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-sp-8">
      <Button
        label="Validar en Renaper"
        size="s"
        variant="secondary"
        disabled={validacion.isPending}
        aria-busy={validacion.isPending}
        onClick={validar}
      />
      {validacion.isError ? <AlertaError>{mensajeRenaper(validacion.error)}</AlertaError> : null}
    </div>
  );
}
