import { formatearImporte, type CuotaPublica } from '@nexa/api';
import { EstadoBadge } from '@nexa/ui';

import { esCuotaElegible, type SeleccionCuotas } from '../hooks/useSeleccionCuotas';
import { BADGE_POR_ESTADO, textoVencimiento } from './cuotaVista';

interface ListaCuotasMobileProps {
  cuotas: ReadonlyArray<CuotaPublica>;
  seleccion: SeleccionCuotas;
}

/** Cuotas en tarjetas para menos de 768 px. Lista semántica, sin tabla (W3 §3.2). */
export function ListaCuotasMobile({ cuotas, seleccion }: ListaCuotasMobileProps) {
  const total = cuotas.length;

  return (
    <ul className="flex flex-col rounded-input border border-border-hairline bg-surface-panel">
      {cuotas.map((cuota) => (
        <li
          key={cuota.idCuota}
          className="flex items-center gap-sp-8 border-b border-border-hairline px-sp-8 py-sp-4 last:border-b-0"
        >
          {/* Zona de toque de 44 × 44 px (design-system §8.5), también en las filas sin casilla. */}
          <span className="flex size-11 shrink-0 items-center justify-center">
            {esCuotaElegible(cuota) ? (
              <label className="flex size-11 cursor-pointer items-center justify-center">
                <input
                  type="checkbox"
                  aria-label={`Seleccionar cuota ${cuota.numero} de ${total}`}
                  checked={seleccion.estaSeleccionada(cuota.idCuota)}
                  disabled={seleccion.estaBloqueada(cuota)}
                  onChange={() => seleccion.alternar(cuota)}
                  className="size-5 accent-action-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary disabled:cursor-not-allowed"
                />
              </label>
            ) : null}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-sp-4">
            <span className="text-body-sm text-text-primary">{`Cuota ${cuota.numero} de ${total}`}</span>
            <span className="text-caption text-text-secondary">{textoVencimiento(cuota)}</span>
          </div>
          <div className="flex flex-col items-end gap-sp-4">
            <span className="font-mono text-mono text-text-primary">
              {formatearImporte(cuota.total)}
            </span>
            <EstadoBadge estado={BADGE_POR_ESTADO[cuota.estado]} />
          </div>
        </li>
      ))}
    </ul>
  );
}
