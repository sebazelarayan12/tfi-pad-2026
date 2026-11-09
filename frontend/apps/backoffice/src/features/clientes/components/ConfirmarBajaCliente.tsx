import { isApiError, type ClienteResponse } from '@nexa/api';
import { AlertaError, Button, Dialogo } from '@nexa/ui';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { CLIENTE_NO_ENCONTRADO, mensajeMutacionCliente } from '../api/mensajeMutacionCliente';
import { useDarDeBajaCliente } from '../api/useDarDeBajaCliente';

export function ConfirmarBajaCliente({
  cliente,
  onCerrar,
}: {
  cliente: ClienteResponse;
  onCerrar: () => void;
}) {
  const baja = useDarDeBajaCliente(cliente.id);
  const navegar = useNavigate();
  const enviando = useRef(false);

  function irAlListado(tipo: 'exito' | 'advertencia', texto: string) {
    void navegar('/clientes', { replace: true, state: { aviso: { tipo, texto } } });
  }

  function confirmar() {
    if (enviando.current) return;
    enviando.current = true;
    baja.mutate(undefined, {
      onSuccess: () => irAlListado('exito', 'Cliente dado de baja.'),
      onError: (error) => {
        if (isApiError(error) && error.status === 404)
          irAlListado('advertencia', CLIENTE_NO_ENCONTRADO);
      },
      onSettled: () => {
        enviando.current = false;
      },
    });
  }

  function cancelar() {
    if (!enviando.current) onCerrar();
  }

  return (
    <Dialogo
      titulo={`¿Dar de baja a ${cliente.nombre} ${cliente.apellido}?`}
      descripcion="El cliente deja de aparecer en el listado. Sus datos se conservan."
      onCancelar={cancelar}
    >
      {baja.isError ? (
        <AlertaError>
          {mensajeMutacionCliente(baja.error, 'No pudimos dar de baja al cliente. Probá de nuevo.')}
        </AlertaError>
      ) : null}
      <div className="flex flex-wrap justify-end gap-sp-8">
        <Button
          label="Cancelar"
          variant="secondary"
          disabled={baja.isPending}
          data-foco-inicial
          onClick={cancelar}
        />
        <Button
          label="Dar de baja"
          variant="ghost"
          className="!text-status-cancelada-text"
          disabled={baja.isPending}
          aria-busy={baja.isPending}
          onClick={confirmar}
        />
      </div>
    </Dialogo>
  );
}
