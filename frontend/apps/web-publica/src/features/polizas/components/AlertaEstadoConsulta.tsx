import { ClockIcon } from '@phosphor-icons/react/dist/csr/Clock';
import { WarningCircleIcon } from '@phosphor-icons/react/dist/csr/WarningCircle';
import type { ReactNode } from 'react';

export type TonoAlertaEstadoConsulta = 'error' | 'aviso';

const ESTILOS: Record<TonoAlertaEstadoConsulta, string> = {
  error: 'bg-status-cancelada-bg text-status-cancelada-text',
  aviso: 'bg-status-suspendida-bg text-status-suspendida-text',
};

const ICONOS = {
  error: WarningCircleIcon,
  aviso: ClockIcon,
} as const;

export interface AlertaEstadoConsultaProps {
  tono: TonoAlertaEstadoConsulta;
  children: ReactNode;
}

/**
 * Alerta de resultado de la consulta pública (`W2-consultar-poliza.md` §3.1).
 * El texto lo define la pantalla; el ícono es decorativo y `role="alert"` anuncia el cambio.
 */
export function AlertaEstadoConsulta({ tono, children }: AlertaEstadoConsultaProps) {
  const Icono = ICONOS[tono];

  return (
    <div
      role="alert"
      className={`flex items-start gap-sp-12 rounded-card p-sp-16 text-body-sm ${ESTILOS[tono]}`}
    >
      <span aria-hidden="true" className="shrink-0">
        <Icono size={20} weight="regular" />
      </span>
      <p>{children}</p>
    </div>
  );
}
