import { etiquetaEnum, type EstadoPago, type MedioPagoApi } from '@nexa/api';
import { Select, type SelectOption } from '@nexa/ui';

import type { FiltrosPagos } from '../types/filtrosPagos';

type Medio = FiltrosPagos['medio'];
type Estado = FiltrosPagos['estado'];

const MEDIOS: ReadonlyArray<MedioPagoApi> = ['CAJA', 'PAGO_FACIL', 'PASARELA'];
const ESTADOS: ReadonlyArray<EstadoPago> = ['PENDIENTE', 'APROBADO', 'RECHAZADO'];

const OPCIONES_MEDIO: ReadonlyArray<SelectOption<Medio>> = [
  { value: 'Todos', label: 'Todos' },
  ...MEDIOS.map((medio) => ({ value: medio, label: etiquetaEnum('MedioPago', medio) })),
];

const OPCIONES_ESTADO: ReadonlyArray<SelectOption<Estado>> = [
  { value: 'Todos', label: 'Todos' },
  ...ESTADOS.map((estado) => ({ value: estado, label: etiquetaEnum('EstadoPago', estado) })),
];

interface PagosFiltersProps {
  medio: Medio;
  estado: Estado;
  onCambiar: (cambio: Partial<Pick<FiltrosPagos, 'medio' | 'estado'>>) => void;
}

/** Filtros `Medio` y `Estado`. El filtro `Período` no existe en el back (D-B19-02). */
export function PagosFilters({ medio, estado, onCambiar }: PagosFiltersProps) {
  return (
    <div className="flex flex-wrap gap-sp-16">
      <div className="w-[180px]">
        <Select
          label="Medio"
          options={OPCIONES_MEDIO}
          value={medio}
          onChange={(valor) => onCambiar({ medio: valor })}
        />
      </div>
      <div className="w-[180px]">
        <Select
          label="Estado"
          options={OPCIONES_ESTADO}
          value={estado}
          onChange={(valor) => onCambiar({ estado: valor })}
        />
      </div>
    </div>
  );
}
