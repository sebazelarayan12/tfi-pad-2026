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
const MARCO = 'overflow-hidden rounded-card border border-border-hairline bg-tema-elevado';

// El plan destacado va en el marino de la marca, con texto blanco; el resto, blanco con borde fino.
function esDestacado(plan: PlanResponse) {
  return plan.codigo === CODIGO_DESTACADO;
}

function fondo(plan: PlanResponse) {
  return esDestacado(plan) ? 'bg-tema-destacado' : '';
}

function textoFuerte(plan: PlanResponse) {
  return esDestacado(plan) ? 'text-white' : 'text-tema-titulo';
}

function textoSuave(plan: PlanResponse) {
  return esDestacado(plan) ? 'text-white/75' : 'text-text-secondary';
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
                      className="h-[160px] flex-1 animate-pulse rounded-input bg-tema-fondo-alt"
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
                className={`border-l border-border-hairline px-sp-32 pb-sp-8 pt-sp-32 text-left align-top first:border-l-0 ${fondo(plan)}`.trimEnd()}
              >
                <span className={`block font-display text-titulo-md ${textoFuerte(plan)}`}>
                  {plan.codigo}
                </span>
                <span className={`block text-body font-normal ${textoSuave(plan)}`}>
                  {plan.nombre}
                </span>
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
                className={`px-sp-32 pb-sp-32 pt-sp-16 align-top md:border-l md:border-border-hairline md:first:border-l-0 max-md:border-b max-md:border-border-hairline max-md:last:border-b-0 max-md:px-sp-24 max-md:pt-sp-24 max-md:before:mb-sp-8 max-md:before:block max-md:before:font-display max-md:before:text-titulo-md max-md:before:content-[attr(data-label)] ${esDestacado(plan) ? 'max-md:before:text-white' : 'max-md:before:text-tema-titulo'} ${fondo(plan)}`.trimEnd()}
              >
                <span className={`block text-label ${textoSuave(plan)}`}>{TEXTO_DESDE}</span>
                <span className={`block font-display text-titulo-lg ${textoFuerte(plan)}`}>
                  {formatearImporte(plan.primaBase)}
                </span>
                <span className={`block text-label ${textoSuave(plan)}`}>{TEXTO_POR_MES}</span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
