import { Select, type SelectOption } from '@nexa/ui';

import type { FiltrosCotizaciones } from '../schemas/filtrosCotizaciones';

type Vigencia = FiltrosCotizaciones['vigencia'];

const OPCIONES_VIGENCIA: ReadonlyArray<SelectOption<Vigencia>> = [
  { value: 'Todas', label: 'Todas' },
  { value: 'Vigentes', label: 'Vigentes' },
  { value: 'Vencidas', label: 'Vencidas' },
];

interface CotizacionesFiltersProps {
  vigencia: Vigencia;
  onCambiar: (vigencia: Vigencia) => void;
}

/** Filtro `Estado`: una cotización vale 15 días desde que se genera (RN06). */
export function CotizacionesFilters({ vigencia, onCambiar }: CotizacionesFiltersProps) {
  return (
    <div className="flex flex-wrap gap-sp-16">
      <div className="w-[180px]">
        <Select label="Estado" options={OPCIONES_VIGENCIA} value={vigencia} onChange={onCambiar} />
      </div>
    </div>
  );
}
