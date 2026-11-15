import { ClockCountdownIcon } from '@phosphor-icons/react/dist/csr/ClockCountdown';
import { PauseCircleIcon } from '@phosphor-icons/react/dist/csr/PauseCircle';
import { ShieldCheckIcon } from '@phosphor-icons/react/dist/csr/ShieldCheck';
import { WarningCircleIcon } from '@phosphor-icons/react/dist/csr/WarningCircle';
import type { EstadoPolizaInicio, Indicador } from '../types/indicadores';
import { porcentajePolizas } from '../schemas/distribucionPolizas';
import { KpiCard } from './KpiCard';

const TAMANO_ICONO = 20;

interface GridKpisProps {
  conteos: Record<EstadoPolizaInicio, Indicador>;
  cuotas: Indicador;
  total?: number;
}

export function GridKpis({ conteos, cuotas, total }: GridKpisProps) {
  const vigentes = conteos.Vigente.data;
  return (
    <div className="nx-escalonado grid grid-cols-1 gap-sp-16 sm:grid-cols-2 min-[1280px]:grid-cols-4">
      <KpiCard
        titulo="Pólizas vigentes"
        indicador={conteos.Vigente}
        icono={<ShieldCheckIcon size={TAMANO_ICONO} weight="duotone" />}
        tono="vigente"
        nota={
          total !== undefined && vigentes !== undefined
            ? `${porcentajePolizas(vigentes, total)}% de las pólizas`
            : undefined
        }
      />
      <KpiCard
        titulo="Pendientes de pago"
        indicador={conteos.Pendiente}
        icono={<ClockCountdownIcon size={TAMANO_ICONO} weight="duotone" />}
        tono="pendiente"
      />
      <KpiCard
        titulo="Suspendidas"
        indicador={conteos.Suspendida}
        icono={<PauseCircleIcon size={TAMANO_ICONO} weight="duotone" />}
        tono="suspendida"
      />
      <KpiCard
        titulo="Cuotas vencidas hoy"
        indicador={cuotas}
        icono={<WarningCircleIcon size={TAMANO_ICONO} weight="duotone" />}
        tono="cancelada"
        nota="Recargo 5% aplicado"
        chip="Atender hoy"
        degradar
      />
    </div>
  );
}
