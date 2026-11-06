import type { PolizaListItemResponse } from '@nexa/api';

import { TAMANO_PAGINA } from '../api/usePolizasListado';
import { TEXTO_VACIO } from '../textos';
import { PolizasTabla } from './PolizasTabla';

const FILAS_ESQUELETO = Array.from({ length: TAMANO_PAGINA }, (_, i) => i);

interface ResultadoPolizasProps {
  filas: PolizaListItemResponse[] | null;
  cargandoPrimera: boolean;
  actualizando: boolean;
}

/** Tabla con su esqueleto (primera carga) y su estado vacío; ambos van dentro del recuadro. */
export function ResultadoPolizas({ filas, cargandoPrimera, actualizando }: ResultadoPolizasProps) {
  return (
    <div
      aria-busy={actualizando}
      className="overflow-hidden rounded-input border border-border-hairline bg-surface-panel"
    >
      {filas === null ? null : <PolizasTabla polizas={filas} />}
      {cargandoPrimera ? (
        <div aria-hidden="true" data-testid="esqueleto-polizas" className="flex flex-col">
          {FILAS_ESQUELETO.map((fila) => (
            <div
              key={fila}
              className="h-12 animate-pulse border-b border-border-hairline bg-surface-subtle"
            />
          ))}
        </div>
      ) : null}
      {filas !== null && filas.length === 0 ? (
        <p className="px-sp-16 py-sp-24 text-center text-body-sm text-text-secondary">
          {TEXTO_VACIO}
        </p>
      ) : null}
    </div>
  );
}
