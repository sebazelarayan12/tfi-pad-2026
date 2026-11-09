import { useState } from 'react';

import { TAMANO_PAGINA_COTIZACIONES, useCotizacionesListado } from '../api/useCotizacionesListado';
import { CotizacionesFilters } from '../components/CotizacionesFilters';
import { PaginacionCotizaciones } from '../components/PaginacionCotizaciones';
import { ResultadoCotizaciones } from '../components/ResultadoCotizaciones';
import { filtrosCotizacionesSchema, type FiltrosCotizaciones } from '../schemas/filtrosCotizaciones';

/** Listado de cotizaciones. El título y el botón "Nueva cotización" los pinta el Topbar del layout. */
export function CotizacionesPage() {
  const [filtros, setFiltros] = useState<FiltrosCotizaciones>(() =>
    filtrosCotizacionesSchema.parse({}),
  );
  const consulta = useCotizacionesListado(filtros);
  const cotizaciones = consulta.data?.items;

  return (
    <div className="flex min-w-0 flex-col gap-sp-16">
      {/* Cambiar el filtro vuelve a la página 1; paginar conserva el filtro. */}
      <CotizacionesFilters
        vigencia={filtros.vigencia}
        onCambiar={(vigencia) => setFiltros({ vigencia, pagina: 1 })}
      />
      <ResultadoCotizaciones
        cotizaciones={cotizaciones}
        cargando={consulta.isPending}
        actualizando={consulta.isFetching}
        error={consulta.error}
      />
      <PaginacionCotizaciones
        pagina={filtros.pagina}
        tamano={TAMANO_PAGINA_COTIZACIONES}
        total={consulta.data?.total ?? 0}
        filas={cotizaciones?.length ?? 0}
        cargando={consulta.isPending}
        onCambiar={(pagina) => setFiltros((actuales) => ({ ...actuales, pagina }))}
      />
    </div>
  );
}
