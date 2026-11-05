import { formatearImporte, type PlanResponse } from '@nexa/api';
import { AlertaError, Button } from '@nexa/ui';

import { usePlanesPublicos } from '../api/usePlanesPublicos';

// Textos de la ficha W-02 §8. Carga, error y vacío son propuestas (NO DEFINIDOS en el Figma, DN-W2-5).
const CAPTION = 'Planes de cobertura de referencia';
const TEXTO_CARGANDO = 'Cargando planes…';
const TEXTO_ERROR = 'No pudimos cargar los planes.';
const TEXTO_REINTENTAR = 'Reintentar';
const TEXTO_VACIO = 'Por el momento no hay planes disponibles.';
const TEXTO_DESDE = 'desde';
const TEXTO_POR_MES = 'por mes';

// Único destacado de la tabla, como en el Figma (DN-W2-3).
const CODIGO_DESTACADO = 'TC';
const FILAS_SKELETON = 3;

const TABLA = 'w-full table-fixed border-separate border-spacing-0';
const MARCO = 'overflow-hidden rounded-card border border-border-hairline bg-surface-subtle';

function fondo(plan: PlanResponse) {
  return plan.codigo === CODIGO_DESTACADO ? 'bg-accent-lime-soft' : '';
}

/**
 * Tabla de planes de la web pública (`GET /api/planes`). El precio "desde" es `primaBase` tal cual
 * (D-07, [CONFIRMAR]). Bajo 768 px el encabezado queda solo para el lector de pantalla y cada
 * celda de precio muestra su plan con `data-label`, sin duplicar el DOM (ficha §6.3).
 */
export function TablaPlanes() {
  const { data: planes, isPending, isError, refetch } = usePlanesPublicos();

  if (isPending) {
    return (
      <div className={MARCO}>
        <table aria-busy="true" className={TABLA}>
          <caption className="sr-only">{CAPTION}</caption>
          <tbody>
            <tr>
              <td className="p-sp-24">
                <span className="sr-only">{TEXTO_CARGANDO}</span>
                <span aria-hidden="true" className="flex flex-col gap-sp-12 md:flex-row">
                  {Array.from({ length: FILAS_SKELETON }, (_, indice) => (
                    <span
                      key={indice}
                      className="h-[112px] flex-1 animate-pulse rounded-input bg-surface-panel"
                    />
                  ))}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-start gap-sp-12">
        <AlertaError>{TEXTO_ERROR}</AlertaError>
        <Button label={TEXTO_REINTENTAR} variant="secondary" onClick={() => void refetch()} />
      </div>
    );
  }

  if (planes.length === 0) {
    return <p className="text-body text-text-secondary">{TEXTO_VACIO}</p>;
  }

  return (
    <div className={MARCO}>
      <table className={TABLA}>
        <caption className="sr-only">{CAPTION}</caption>
        <thead className="max-md:sr-only">
          <tr>
            {planes.map((plan) => (
              <th
                key={plan.id}
                scope="col"
                data-destacado={plan.codigo === CODIGO_DESTACADO ? 'true' : undefined}
                className={`px-sp-24 pt-sp-24 pb-sp-4 text-left align-top ${fondo(plan)}`.trimEnd()}
              >
                <span className="block text-h3 text-text-primary">{plan.codigo}</span>
                <span className="block text-body-sm text-text-secondary">{plan.nombre}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="max-md:flex max-md:flex-col">
            {planes.map((plan) => (
              <td
                key={plan.id}
                data-label={`${plan.codigo} · ${plan.nombre}`}
                data-destacado={plan.codigo === CODIGO_DESTACADO ? 'true' : undefined}
                className={`px-sp-24 pb-sp-24 align-top max-md:border-b max-md:border-border-hairline max-md:last:border-b-0 max-md:pt-sp-16 max-md:before:block max-md:before:text-h3 max-md:before:text-text-primary max-md:before:content-[attr(data-label)] ${fondo(plan)}`.trimEnd()}
              >
                <span className="block text-caption text-text-tertiary">{TEXTO_DESDE}</span>
                <span className="block font-mono text-mono-lg text-text-primary">
                  {formatearImporte(plan.primaBase)}
                </span>
                <span className="block text-caption text-text-tertiary">{TEXTO_POR_MES}</span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
