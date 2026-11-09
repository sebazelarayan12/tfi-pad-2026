import type { CuotaResponse } from '@nexa/api';

import { DeudaVencidaWidget } from './DeudaVencidaWidget';
import { PagosWidget } from './PagosWidget';

/** Contenido del rail derecho de B10: deuda vencida y pagos, en ese orden. */
export function PolizaRail({
  polizaId,
  cuotas,
}: {
  polizaId: string;
  cuotas: ReadonlyArray<CuotaResponse>;
}) {
  return (
    <div className="flex flex-col gap-sp-24">
      <DeudaVencidaWidget polizaId={polizaId} cuotas={cuotas} />
      <PagosWidget polizaId={polizaId} />
    </div>
  );
}
