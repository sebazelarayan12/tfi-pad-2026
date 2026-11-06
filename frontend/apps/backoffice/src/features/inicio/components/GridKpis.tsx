import type { EstadoPolizaInicio, Indicador } from '../types/indicadores';
import { porcentajePolizas } from '../schemas/distribucionPolizas';
import { KpiCard } from './KpiCard';

interface GridKpisProps {
  conteos: Record<EstadoPolizaInicio, Indicador>;
  cuotas: Indicador;
  total?: number;
}

export function GridKpis({ conteos, cuotas, total }: GridKpisProps) {
  const vigentes = conteos.Vigente.data;
  return (
    <div className="grid grid-cols-1 gap-sp-16 sm:grid-cols-2 min-[1280px]:grid-cols-4">
      <KpiCard
        titulo="Pólizas vigentes"
        indicador={conteos.Vigente}
        nota={
          total !== undefined && vigentes !== undefined
            ? `${porcentajePolizas(vigentes, total)}% de las pólizas`
            : undefined
        }
      />
      <KpiCard titulo="Pendientes de pago" indicador={conteos.Pendiente} />
      <KpiCard titulo="Suspendidas" indicador={conteos.Suspendida} />
      <KpiCard
        titulo="Cuotas vencidas hoy"
        indicador={cuotas}
        nota="Recargo 5% aplicado"
        chip="Atender hoy"
        degradar
      />
    </div>
  );
}
