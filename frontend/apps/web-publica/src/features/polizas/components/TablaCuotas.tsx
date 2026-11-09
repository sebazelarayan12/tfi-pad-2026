import { formatearImporte, type CuotaPublica } from '@nexa/api';
import { EstadoBadge } from '@nexa/ui';
import { CheckIcon } from '@phosphor-icons/react/dist/csr/Check';

import { esCuotaElegible, type SeleccionCuotas } from '../hooks/useSeleccionCuotas';
import { BADGE_POR_ESTADO, textoVencimiento } from './cuotaVista';

// Anchos de columna del Figma (Cuota/Fila, nodo 18:1568): casilla 20, cuota 160, importe 140, estado 120.
const CELDA = 'border-b border-border-hairline px-sp-8 py-sp-12 align-middle';
const ENCABEZADO = 'px-sp-8 py-sp-12 text-left text-label text-text-secondary';

interface CasillaCuotaProps {
  cuota: CuotaPublica;
  total: number;
  seleccion: SeleccionCuotas;
  /** Clases del `label` que envuelve la casilla (por ejemplo, la zona de toque de 44 px en móvil). */
  className?: string;
}

/**
 * Casilla de 20 px del Figma (nodo 18:1498): sin marcar, borde `border-strong`; marcada, fondo
 * `action-primary` con check blanco de 14 px. Es un `input` nativo, así que conserva teclado y lector.
 */
export function CasillaCuota({ cuota, total, seleccion, className }: CasillaCuotaProps) {
  return (
    <label
      className={`flex shrink-0 cursor-pointer items-center justify-center ${className ?? ''}`}
    >
      <span className="relative inline-flex size-5">
        <input
          type="checkbox"
          aria-label={`Seleccionar cuota ${cuota.numero} de ${total}`}
          checked={seleccion.estaSeleccionada(cuota.idCuota)}
          disabled={seleccion.estaBloqueada(cuota)}
          onChange={() => seleccion.alternar(cuota)}
          className="peer size-5 cursor-pointer appearance-none border border-border-strong bg-surface-panel checked:border-action-primary checked:bg-action-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary disabled:cursor-not-allowed disabled:opacity-50"
        />
        <CheckIcon
          aria-hidden="true"
          size={14}
          weight="bold"
          className="pointer-events-none absolute inset-0 m-auto hidden text-action-on-primary peer-checked:block"
        />
      </span>
    </label>
  );
}

interface TablaCuotasProps {
  cuotas: ReadonlyArray<CuotaPublica>;
  seleccion: SeleccionCuotas;
}

/** Tabla de cuotas de escritorio. Solo las impagas tienen casilla (W3 §6). */
export function TablaCuotas({ cuotas, seleccion }: TablaCuotasProps) {
  const total = cuotas.length;

  return (
    <div className="overflow-x-auto rounded-input border border-border-hairline bg-surface-panel">
      <table className="w-full table-fixed border-separate border-spacing-0">
        <caption className="sr-only">Cuotas de la póliza</caption>
        <colgroup>
          <col className="w-11" />
          <col className="w-[176px]" />
          <col />
          <col className="w-[156px]" />
          <col className="w-[144px]" />
        </colgroup>
        <thead>
          <tr className="bg-surface-subtle">
            <th scope="col" className={`${ENCABEZADO} pl-sp-16`}>
              <span className="sr-only">Seleccionar</span>
            </th>
            <th scope="col" className={ENCABEZADO}>
              Cuota
            </th>
            <th scope="col" className={ENCABEZADO}>
              Vencimiento
            </th>
            <th scope="col" className={`${ENCABEZADO} text-right`}>
              Importe
            </th>
            <th scope="col" className={`${ENCABEZADO} pr-sp-16`}>
              Estado
            </th>
          </tr>
        </thead>
        <tbody>
          {cuotas.map((cuota) => (
            <tr key={cuota.idCuota}>
              <td className={`${CELDA} pl-sp-16`}>
                {esCuotaElegible(cuota) ? (
                  <CasillaCuota
                    cuota={cuota}
                    total={total}
                    seleccion={seleccion}
                    className="size-5"
                  />
                ) : null}
              </td>
              <td className={`${CELDA} text-body text-text-primary`}>
                {`Cuota ${cuota.numero} de ${total}`}
              </td>
              <td className={`${CELDA} text-body-sm text-text-secondary`}>
                {textoVencimiento(cuota)}
              </td>
              <td className={`${CELDA} text-right font-mono text-mono text-text-primary`}>
                {formatearImporte(cuota.total)}
              </td>
              <td className={`${CELDA} pr-sp-16`}>
                <EstadoBadge estado={BADGE_POR_ESTADO[cuota.estado]} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
