import type { ClienteResponse } from '@nexa/api';
import { Button } from '@nexa/ui';
import { PencilSimpleIcon } from '@phosphor-icons/react/dist/csr/PencilSimple';
import { TrashIcon } from '@phosphor-icons/react/dist/csr/Trash';
import { useState } from 'react';

import { ConfirmarBajaCliente } from './ConfirmarBajaCliente';
import { EditarContactoDomicilio } from './EditarContactoDomicilio';

export function AccionesFichaCliente({ cliente }: { cliente: ClienteResponse }) {
  const [accion, setAccion] = useState<'editar' | 'baja' | null>(null);
  const cerrar = () => setAccion(null);

  return (
    <>
      <Button
        label="Editar"
        variant="secondary"
        icon={<PencilSimpleIcon size={18} />}
        onClick={() => setAccion('editar')}
      />
      <Button
        label="Dar de baja"
        variant="ghost"
        className="!text-status-cancelada-text"
        icon={<TrashIcon size={18} />}
        onClick={() => setAccion('baja')}
      />
      {accion === 'editar' ? <EditarContactoDomicilio cliente={cliente} onCerrar={cerrar} /> : null}
      {accion === 'baja' ? <ConfirmarBajaCliente cliente={cliente} onCerrar={cerrar} /> : null}
    </>
  );
}
