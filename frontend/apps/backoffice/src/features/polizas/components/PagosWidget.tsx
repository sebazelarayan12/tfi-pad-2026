import { isApiError, leerMensajeDetalle } from '@nexa/api';
import { AlertaError, CardWidget } from '@nexa/ui';

import { usePagosPoliza } from '../api/usePagosPoliza';
import { TEXTO_ERROR_PAGOS, TEXTO_SIN_PAGOS, TITULO_PAGOS } from '../textosDetalle';
import { PagoResumenItem } from './PagoResumenItem';

const MAXIMO_PAGOS = 5;
const FILAS_ESQUELETO = [0, 1, 2];

function Esqueleto() {
  return (
    <div aria-hidden="true" data-testid="esqueleto-pagos" className="flex flex-col gap-sp-12">
      {FILAS_ESQUELETO.map((fila) => (
        <span
          key={fila}
          className="h-10 rounded-input bg-surface-subtle motion-safe:animate-pulse"
        />
      ))}
    </div>
  );
}

/** Widget Pagos: los 5 más recientes, sin "Ver todos" (D-B18-07). */
export function PagosWidget({ polizaId }: { polizaId: string }) {
  const pagos = usePagosPoliza(polizaId);
  const recientes = [...(pagos.data ?? [])]
    .sort((a, b) => Date.parse(b.fechaCreacion) - Date.parse(a.fechaCreacion))
    .slice(0, MAXIMO_PAGOS);

  return (
    <CardWidget title={TITULO_PAGOS}>
      {pagos.isPending ? <Esqueleto /> : null}
      {pagos.isError ? (
        <AlertaError>
          {TEXTO_ERROR_PAGOS}
          {isApiError(pagos.error) && pagos.error.detail
            ? ` ${leerMensajeDetalle(pagos.error).mensaje}`
            : ''}
        </AlertaError>
      ) : null}
      {pagos.isSuccess && recientes.length === 0 ? (
        <p className="text-body-sm text-text-secondary">{TEXTO_SIN_PAGOS}</p>
      ) : null}
      {recientes.length > 0 ? (
        <ul className="flex flex-col gap-sp-12">
          {recientes.map((pago) => (
            <PagoResumenItem key={pago.id} pago={pago} />
          ))}
        </ul>
      ) : null}
    </CardWidget>
  );
}
