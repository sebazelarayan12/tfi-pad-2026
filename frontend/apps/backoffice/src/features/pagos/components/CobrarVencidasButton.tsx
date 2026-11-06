import { ESTADO_CUOTA_NUMERO } from '@nexa/api';
import { AlertaError, Button } from '@nexa/ui';
import { WalletIcon } from '@phosphor-icons/react/dist/csr/Wallet';
import { useMemo, useRef, useState } from 'react';

import { useCobrarCuotas } from '../api/usePagos';
import type { CuotaCobrable } from '../types/cobro';
import { mensajeDeError } from './mensajesError';

export interface CobrarVencidasButtonProps {
  polizaId: string;
  cuotas: ReadonlyArray<CuotaCobrable>;
}

/**
 * Cobra con un clic todas las cuotas Vencida de una póliza (RV-D10).
 * No dispara ninguna request al montar ni permite un segundo POST en vuelo.
 */
export function CobrarVencidasButton({ polizaId, cuotas }: CobrarVencidasButtonProps) {
  const [exito, setExito] = useState(false);
  const enviandoRef = useRef(false);
  const mutacion = useCobrarCuotas(polizaId);

  const cuotaIds = useMemo(
    () =>
      cuotas
        .filter((cuota) => cuota.estado === ESTADO_CUOTA_NUMERO.Vencida)
        .sort((a, b) => a.numero - b.numero)
        .map((cuota) => cuota.id),
    [cuotas],
  );
  const deshabilitado = cuotaIds.length === 0 || mutacion.isPending;

  function cobrar() {
    if (deshabilitado || enviandoRef.current) return;

    enviandoRef.current = true;
    setExito(false);
    mutacion.mutate(
      { cuotaIds },
      {
        onSuccess: () => setExito(true),
        onSettled: () => {
          enviandoRef.current = false;
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-sp-8">
      <Button
        label="Registrar pago en caja"
        variant="primary"
        size="m"
        icon={<WalletIcon size={16} weight="regular" />}
        onClick={cobrar}
        disabled={deshabilitado}
        aria-disabled={deshabilitado}
      />
      {exito ? <p role="status">Pago registrado.</p> : null}
      {mutacion.isError ? <AlertaError>{mensajeDeError(mutacion.error)}</AlertaError> : null}
    </div>
  );
}
