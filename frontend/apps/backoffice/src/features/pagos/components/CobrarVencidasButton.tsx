import { ESTADO_CUOTA_NUMERO } from '@nexa/api';
import { AlertaError, Button, Dialogo, toast } from '@nexa/ui';
import { WalletIcon } from '@phosphor-icons/react/dist/csr/Wallet';
import { useMemo, useRef, useState } from 'react';

import { useCobrarCuotas } from '../api/usePagos';
import type { CuotaCobrable } from '../types/cobro';
import { mensajeDeError } from './mensajesError';
import { textoCuotas } from './textoCuotas';

const TEXTO_PAGO_REGISTRADO = 'Pago registrado.';

export interface CobrarVencidasButtonProps {
  polizaId: string;
  cuotas: ReadonlyArray<CuotaCobrable>;
  /** Si viene, cobra solo estas cuotas (selección manual); si no, todas las Vencida. */
  cuotaIds?: ReadonlyArray<string>;
}

/**
 * Cobra con un clic todas las cuotas Vencida de una póliza (RV-D10), o solo las de `cuotaIds`.
 * Pide confirmación antes de cobrar y avisa el éxito con un toast.
 * No dispara ninguna request al montar ni permite un segundo POST en vuelo.
 */
export function CobrarVencidasButton({
  polizaId,
  cuotas,
  cuotaIds: elegidas,
}: CobrarVencidasButtonProps) {
  const [confirmando, setConfirmando] = useState(false);
  const enviandoRef = useRef(false);
  const mutacion = useCobrarCuotas(polizaId);

  const cuotaIds = useMemo(
    () =>
      elegidas
        ? [...elegidas]
        : cuotas
            .filter((cuota) => cuota.estado === ESTADO_CUOTA_NUMERO.Vencida)
            .sort((a, b) => a.numero - b.numero)
            .map((cuota) => cuota.id),
    [cuotas, elegidas],
  );
  const deshabilitado = cuotaIds.length === 0 || mutacion.isPending;

  const numeros = useMemo(() => {
    const idsACobrar = new Set(cuotaIds);
    return cuotas
      .filter((cuota) => idsACobrar.has(cuota.id))
      .sort((a, b) => a.numero - b.numero)
      .map((cuota) => cuota.numero);
  }, [cuotas, cuotaIds]);

  function cobrar() {
    setConfirmando(false);
    if (deshabilitado || enviandoRef.current) return;

    enviandoRef.current = true;
    mutacion.mutate(
      { cuotaIds },
      {
        onSuccess: () => toast.success(TEXTO_PAGO_REGISTRADO),
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
        onClick={() => setConfirmando(true)}
        disabled={deshabilitado}
        aria-disabled={deshabilitado}
      />
      {confirmando ? (
        <Dialogo
          titulo="Confirmar pago en caja"
          descripcion={`Se va a registrar el pago de ${numeros.length === 1 ? 'la cuota' : 'las cuotas'} ${textoCuotas(numeros)}. Esta acción no se puede deshacer.`}
          onCancelar={() => setConfirmando(false)}
        >
          <Button
            label="Cancelar"
            variant="secondary"
            onClick={() => setConfirmando(false)}
            data-foco-inicial
          />
          <Button label="Confirmar pago" onClick={cobrar} />
        </Dialogo>
      ) : null}
      {mutacion.isError ? <AlertaError>{mensajeDeError(mutacion.error)}</AlertaError> : null}
    </div>
  );
}
