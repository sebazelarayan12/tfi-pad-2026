import { isApiError, type PagoListadoResponse } from '@nexa/api';
import { AlertaError } from '@nexa/ui';

import { TAMANO_PAGINA_PAGOS } from '../api/usePagosListado';
import { PagosTable } from './PagosTable';

const FILAS_ESQUELETO = Array.from({ length: TAMANO_PAGINA_PAGOS }, (_, i) => i);

const TEXTO_VACIO = 'No hay pagos para mostrar.';
const TEXTO_ERROR = 'No se pudieron cargar los pagos.';

interface ResultadoPagosProps {
  pagos: ReadonlyArray<PagoListadoResponse> | undefined;
  cargando: boolean;
  actualizando: boolean;
  error: unknown;
}

function MensajeError({ error }: { error: unknown }) {
  const detalle = isApiError(error) ? error.detail : null;
  return <AlertaError>{detalle ? `${TEXTO_ERROR} ${detalle}` : TEXTO_ERROR}</AlertaError>;
}

/** Tabla con su esqueleto, su estado vacío y su error, todos dentro del mismo recuadro. */
export function ResultadoPagos({ pagos, cargando, actualizando, error }: ResultadoPagosProps) {
  const hayError = error !== null && error !== undefined;

  return (
    <div
      aria-busy={actualizando}
      className="overflow-x-auto rounded-input border border-border-hairline bg-surface-panel"
    >
      {hayError ? <MensajeError error={error} /> : null}
      {!hayError && pagos !== undefined ? <PagosTable pagos={pagos} /> : null}
      {!hayError && pagos?.length === 0 ? (
        <p className="px-sp-16 py-sp-24 text-center text-body-sm text-text-secondary">
          {TEXTO_VACIO}
        </p>
      ) : null}
      {cargando ? (
        <div aria-hidden="true" data-testid="esqueleto-pagos" className="flex flex-col">
          {FILAS_ESQUELETO.map((fila) => (
            <div
              key={fila}
              className="h-12 animate-pulse border-b border-border-hairline bg-surface-subtle"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
