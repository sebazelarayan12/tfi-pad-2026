import { WidgetCuotasVencidas } from '../../cuotas';
import { useConteosPolizas } from '../api/useConteosPolizas';
import { useCuotasVencidasTotal } from '../api/useCuotasVencidasTotal';
import { DonutPolizasPorEstado } from '../components/DonutPolizasPorEstado';
import { GridKpis } from '../components/GridKpis';
import { PromoRendicion } from '../components/PromoRendicion';
import { SaludoInicio } from '../components/SaludoInicio';
import { ESTADOS_POLIZA } from '../types/indicadores';

export function InicioPage() {
  const conteos = useConteosPolizas();
  const cuotas = useCuotasVencidasTotal();
  const completos = ESTADOS_POLIZA.every(
    (estado) => conteos[estado].data !== undefined && !conteos[estado].isError,
  );
  const total = completos
    ? ESTADOS_POLIZA.reduce((suma, estado) => suma + (conteos[estado].data ?? 0), 0)
    : undefined;

  return (
    <div className="grid min-w-0 gap-sp-24 min-[1280px]:grid-cols-[minmax(0,1fr)_252px]">
      <div className="flex min-w-0 flex-col gap-sp-24">
        <SaludoInicio
          vencidas={cuotas.isSuccess ? cuotas.data : undefined}
          pendientes={conteos.Pendiente.isError ? undefined : conteos.Pendiente.data}
        />
        <GridKpis conteos={conteos} cuotas={cuotas} total={total} />
        <WidgetCuotasVencidas />
      </div>
      <aside aria-label="Distribución de pólizas y rendición" className="flex flex-col gap-sp-16">
        <DonutPolizasPorEstado conteos={conteos} total={total} />
        <PromoRendicion />
      </aside>
    </div>
  );
}
