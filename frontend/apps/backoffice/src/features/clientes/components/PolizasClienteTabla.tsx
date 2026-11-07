import {
  formatearFechaCalendario,
  TEXTO_SIN_DATO,
  type PolizaListItemResponse,
  type VehiculoResponse,
} from '@nexa/api';
import { Table, type TableColumn } from '@nexa/ui';
import type { ReactNode } from 'react';

import { vehiculoDePoliza } from '../api/reglaPolizaActiva';
import type { ProximoVencimiento } from '../api/useProximasCuotas';
import { BadgeEstadoPoliza } from './BadgeEstadoPoliza';

/** Sin cuota pendiente (o sin pedirla) el diseño muestra un guion simple (B-07 §8). */
const SIN_CUOTA = '-';

interface FilaPoliza {
  id: string;
  numero: ReactNode;
  vehiculo: ReactNode;
  plan: ReactNode;
  vigencia: ReactNode;
  estado: ReactNode;
  proximo: ReactNode;
}

const columnas: TableColumn<FilaPoliza>[] = [
  { key: 'numero', header: 'Número', mono: true, render: (fila) => fila.numero },
  { key: 'vehiculo', header: 'Vehículo', render: (fila) => fila.vehiculo },
  { key: 'plan', header: 'Plan', render: (fila) => fila.plan },
  { key: 'vigencia', header: 'Vigencia', render: (fila) => fila.vigencia },
  { key: 'estado', header: 'Estado', render: (fila) => fila.estado },
  { key: 'proximo', header: 'Próx. vencimiento', render: (fila) => fila.proximo },
];

interface PolizasClienteTablaProps {
  polizas: readonly PolizaListItemResponse[];
  vehiculos: readonly VehiculoResponse[];
  proximos: ReadonlyMap<string, ProximoVencimiento>;
}

export function PolizasClienteTabla({ polizas, vehiculos, proximos }: PolizasClienteTablaProps) {
  const filas: FilaPoliza[] = polizas.map((poliza) => {
    const vehiculo = vehiculoDePoliza(poliza, vehiculos);
    const fecha = proximos.get(poliza.id)?.fecha;
    const inicio = formatearFechaCalendario(poliza.fechaInicio);
    const fin = formatearFechaCalendario(poliza.fechaFin);
    return {
      id: poliza.id,
      numero: poliza.numero,
      vehiculo: vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio}` : TEXTO_SIN_DATO,
      plan: poliza.codigoPlan,
      vigencia: `${inicio} a ${fin}`,
      estado: <BadgeEstadoPoliza estado={poliza.estado} />,
      proximo: fecha ? formatearFechaCalendario(fecha) : SIN_CUOTA,
    };
  });

  return (
    <div className="overflow-x-auto rounded-input border border-border-hairline bg-surface-panel">
      <Table
        caption="Pólizas del cliente"
        columns={columnas}
        rows={filas}
        getRowKey={(fila) => fila.id}
      />
    </div>
  );
}
