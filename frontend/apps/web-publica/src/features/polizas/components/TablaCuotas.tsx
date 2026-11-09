import { formatearImporte, type CuotaPublica } from '@nexa/api';
import { EstadoBadge } from '@nexa/ui';

import { esCuotaElegible, type SeleccionCuotas } from '../hooks/useSeleccionCuotas';
import { BADGE_POR_ESTADO, textoVencimiento } from './cuotaVista';

const CELDA =
  'border-b border-border-hairline px-sp-16 align-middle text-body-sm text-text-primary';

interface TablaCuotasProps {
  cuotas: ReadonlyArray<CuotaPublica>;
  seleccion: SeleccionCuotas;
}

/** Tabla de cuotas de escritorio. Solo las impagas tienen casilla (W3 §6). */
export function TablaCuotas({ cuotas, seleccion }: TablaCuotasProps) {
  const total = cuotas.length;

  return (
    <div className="overflow-x-auto rounded-input border border-border-hairline bg-surface-panel">
      <table className="w-full border-separate border-spacing-0">
        <caption className="sr-only">Cuotas de la póliza</caption>
        <thead>
          <tr className="bg-surface-subtle">
            <th scope="col" className="h-10 w-12 px-sp-16 text-left">
              <span className="sr-only">Seleccionar</span>
            </th>
            {['Cuota', 'Vencimiento', 'Importe', 'Estado'].map((titulo) => (
              <th
                key={titulo}
                scope="col"
                className="h-10 px-sp-16 text-left text-label text-text-secondary"
              >
                {titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cuotas.map((cuota) => (
            <tr key={cuota.idCuota} className="h-12">
              <td className={CELDA}>
                {esCuotaElegible(cuota) ? (
                  <input
                    type="checkbox"
                    aria-label={`Seleccionar cuota ${cuota.numero} de ${total}`}
                    checked={seleccion.estaSeleccionada(cuota.idCuota)}
                    disabled={seleccion.estaBloqueada(cuota)}
                    onChange={() => seleccion.alternar(cuota)}
                    className="size-4 accent-action-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary disabled:cursor-not-allowed"
                  />
                ) : null}
              </td>
              <td className={CELDA}>{`Cuota ${cuota.numero} de ${total}`}</td>
              <td className={CELDA}>{textoVencimiento(cuota)}</td>
              <td className={`${CELDA} font-mono text-mono`}>{formatearImporte(cuota.total)}</td>
              <td className={CELDA}>
                <EstadoBadge estado={BADGE_POR_ESTADO[cuota.estado]} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
