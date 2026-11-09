import { isApiError, type CotizacionListItemResponse } from '@nexa/api';
import { AlertaError } from '@nexa/ui';

import { TAMANO_PAGINA_COTIZACIONES } from '../api/useCotizacionesListado';
import { CotizacionesTabla } from './CotizacionesTabla';

const FILAS_ESQUELETO = Array.from({ length: TAMANO_PAGINA_COTIZACIONES }, (_, i) => i);

const TEXTO_VACIO = 'No hay cotizaciones para mostrar.';
const TEXTO_ERROR = 'No se pudieron cargar las cotizaciones.';

interface ResultadoCotizacionesProps {
  cotizaciones: ReadonlyArray<CotizacionListItemResponse> | undefined;
  cargando: boolean;
  actualizando: boolean;
  error: unknown;
}

function MensajeError({ error }: { error: unknown }) {
  const detalle = isApiError(error) ? error.detail : null;
  return <AlertaError>{detalle ? `${TEXTO_ERROR} ${detalle}` : TEXTO_ERROR}</AlertaError>;
}

/** Tabla con su esqueleto, su estado vacío y su error, todos dentro del mismo recuadro. */
export function ResultadoCotizaciones({
  cotizaciones,
  cargando,
  actualizando,
  error,
}: ResultadoCotizacionesProps) {
  const hayError = error !== null && error !== undefined;

  return (
    <div
      aria-busy={actualizando}
      className="overflow-x-auto rounded-input border border-border-hairline bg-surface-panel"
    >
      {hayError ? <MensajeError error={error} /> : null}
      {!hayError && cotizaciones !== undefined ? (
        <CotizacionesTabla cotizaciones={cotizaciones} />
      ) : null}
      {!hayError && cotizaciones?.length === 0 ? (
        <p className="px-sp-16 py-sp-24 text-center text-body-sm text-text-secondary">
          {TEXTO_VACIO}
        </p>
      ) : null}
      {cargando ? (
        <div aria-hidden="true" data-testid="esqueleto-cotizaciones" className="flex flex-col">
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
