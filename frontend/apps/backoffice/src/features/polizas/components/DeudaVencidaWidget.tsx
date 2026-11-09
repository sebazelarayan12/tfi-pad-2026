import { ESTADO_CUOTA_NUMERO, formatearImporte, type CuotaResponse } from '@nexa/api';
import { CardWidget } from '@nexa/ui';

import { CobrarVencidasButton, textoCuotas } from '../../pagos';
import { importeCuota } from '../lib/importeCuota';
import { TEXTO_SIN_VENCIDAS, TITULO_DEUDA_VENCIDA, detalleVencidas } from '../textosDetalle';

/**
 * Widget Deuda vencida: suma informativa de `importe + recargo` de las cuotas Vencida.
 * El cobro lo hace `CobrarVencidasButton` de B-17; el back calcula el total real.
 */
export function DeudaVencidaWidget({
  polizaId,
  cuotas,
}: {
  polizaId: string;
  cuotas: ReadonlyArray<CuotaResponse>;
}) {
  const vencidas = cuotas
    .filter((cuota) => cuota.estado === ESTADO_CUOTA_NUMERO.Vencida)
    .sort((a, b) => a.numero - b.numero);
  const centavos = vencidas.reduce(
    (suma, cuota) => suma + Math.round(importeCuota(cuota) * 100),
    0,
  );

  return (
    <CardWidget title={TITULO_DEUDA_VENCIDA}>
      <div className="flex flex-col gap-sp-12">
        {vencidas.length > 0 ? (
          <>
            <p className="font-mono text-mono-lg text-status-cancelada-text">
              {formatearImporte(centavos / 100)}
            </p>
            <p className="text-body-sm text-text-secondary">
              {detalleVencidas(textoCuotas(vencidas.map((cuota) => cuota.numero)), vencidas.length)}
            </p>
          </>
        ) : (
          <p className="text-body-sm text-text-secondary">{TEXTO_SIN_VENCIDAS}</p>
        )}
        <CobrarVencidasButton polizaId={polizaId} cuotas={cuotas} />
      </div>
    </CardWidget>
  );
}
