import type { PolizaDetalleResponse } from '@nexa/api';
import { Button } from '@nexa/ui';
import { useRef, useState } from 'react';

import { CobrarVencidasButton } from '../../pagos';
import { useCuponPagoFacil } from '../api/useCuponPagoFacil';
import { reglasAcciones } from '../lib/reglasAcciones';
import { ETIQUETA_ACCIONES, TEXTO_CANCELAR_POLIZA, TEXTO_CUPON } from '../textosDetalle';
import { CancelarPolizaDialog } from './CancelarPolizaDialog';
import { CuponPanel } from './CuponPanel';

/**
 * Barra de acciones de B10: cobro en caja (B-17), cupón Pago Fácil y cancelar póliza.
 * El cobro no hace requests al montar; cupón y cancelar siguen `reglasAcciones`.
 */
export function PolizaAcciones({ poliza }: { poliza: PolizaDetalleResponse }) {
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const reglas = reglasAcciones(poliza.estado, poliza.cuotas);
  const cupon = useCuponPagoFacil(reglas.cuotaCupon?.id ?? null);
  const pidiendo = useRef(false);
  // El cupón solo se muestra si se pidió en este montaje: no se reutiliza uno anterior.
  const [pedido, setPedido] = useState(false);

  function pedirCupon() {
    if (!reglas.puedeCupon || pidiendo.current) return;
    pidiendo.current = true;
    setPedido(true);
    void cupon.refetch().finally(() => {
      pidiendo.current = false;
    });
  }

  return (
    <>
      <div
        role="group"
        aria-label={ETIQUETA_ACCIONES}
        className="flex flex-wrap items-start gap-sp-8"
      >
        <CobrarVencidasButton polizaId={poliza.id} cuotas={poliza.cuotas} />
        <Button
          label={TEXTO_CUPON}
          variant="secondary"
          size="m"
          aria-disabled={!reglas.puedeCupon}
          onClick={pedirCupon}
        />
        <Button
          label={TEXTO_CANCELAR_POLIZA}
          variant="ghost"
          size="m"
          className="!text-status-cancelada-text"
          aria-disabled={!reglas.puedeCancelar}
          onClick={() => {
            if (reglas.puedeCancelar) setDialogoAbierto(true);
          }}
        />
      </div>
      {pedido ? (
        <CuponPanel
          cargando={cupon.isFetching}
          error={cupon.error}
          cupon={cupon.data}
          vigenciaMeses={poliza.vigenciaMeses}
        />
      ) : null}
      {dialogoAbierto ? (
        <CancelarPolizaDialog
          polizaId={poliza.id}
          numero={poliza.numero}
          onCerrar={() => setDialogoAbierto(false)}
        />
      ) : null}
    </>
  );
}
