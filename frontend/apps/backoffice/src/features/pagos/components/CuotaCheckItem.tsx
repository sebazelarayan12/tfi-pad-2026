import { badgeEnum, etiquetaEnum, formatearImporte, type EstadoCuotaNumero } from '@nexa/api';
import { EstadoBadge, type BadgeEstado } from '@nexa/ui';

import type { CuotaCobrable } from '../types/cobro';

export interface CuotaCheckItemProps {
  cuota: CuotaCobrable;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (id: string, checked: boolean) => void;
}

function badgeDe(estado: EstadoCuotaNumero): BadgeEstado {
  return badgeEnum('EstadoCuota', estado) ?? 'Pendiente';
}

/** Fila de una cuota cobrable: checkbox, número, estado e importe del back (B11 §3). */
export function CuotaCheckItem({
  cuota,
  checked,
  disabled = false,
  onCheckedChange,
}: CuotaCheckItemProps) {
  return (
    <label
      className={`flex min-h-12 items-center gap-sp-12 rounded-card px-sp-8 py-sp-4 text-body-sm ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      }`}
    >
      <input
        type="checkbox"
        name={`cuota-${cuota.id}`}
        value={cuota.id}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onCheckedChange(cuota.id, event.target.checked)}
        className="h-[18px] w-[18px] shrink-0 accent-action-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
      />
      <span className="text-text-primary">Cuota {cuota.numero}</span>
      <EstadoBadge
        estado={badgeDe(cuota.estado)}
        texto={etiquetaEnum('EstadoCuota', cuota.estado)}
      />
      {/* RV-D14: se muestra el importe del back; no se suma el recargo en el front. */}
      <span className="ml-auto font-mono text-mono text-text-primary">
        {formatearImporte(cuota.importe)}
      </span>
    </label>
  );
}
