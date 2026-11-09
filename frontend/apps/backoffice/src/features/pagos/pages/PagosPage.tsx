import { useState } from 'react';

import { TAMANO_PAGINA_PAGOS, usePagosListado } from '../api/usePagosListado';
import { CajaRail } from '../components/CajaRail';
import { PagosFilters } from '../components/PagosFilters';
import { Paginacion } from '../components/Paginacion';
import { ResultadoPagos } from '../components/ResultadoPagos';
import { filtrosPagosSchema } from '../schemas/filtrosPagos';
import type { FiltrosPagos } from '../types/filtrosPagos';

/**
 * B11 "Pagos y facturas". El título lo pinta el Topbar del layout (`handle.titulo` de la ruta).
 * Con el rail debajo de 1280 px, la tabla hace scroll horizontal dentro de su recuadro.
 */
export function PagosPage() {
  const [filtros, setFiltros] = useState<FiltrosPagos>(() => filtrosPagosSchema.parse({}));
  const consulta = usePagosListado(filtros);
  const pagos = consulta.data?.items;

  // Cambiar un filtro vuelve a la página 1; paginar conserva los filtros.
  const cambiarFiltros = (cambio: Partial<Pick<FiltrosPagos, 'medio' | 'estado'>>) =>
    setFiltros((actuales) => ({ ...actuales, ...cambio, pagina: 1 }));

  return (
    <div className="grid grid-cols-1 gap-sp-24 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex min-w-0 flex-col gap-sp-16">
        <PagosFilters medio={filtros.medio} estado={filtros.estado} onCambiar={cambiarFiltros} />
        <ResultadoPagos
          pagos={pagos}
          cargando={consulta.isPending}
          actualizando={consulta.isFetching}
          error={consulta.error}
        />
        <Paginacion
          pagina={filtros.pagina}
          tamano={TAMANO_PAGINA_PAGOS}
          total={consulta.data?.total ?? 0}
          filas={pagos?.length ?? 0}
          cargando={consulta.isPending}
          onCambiar={(pagina) => setFiltros((actuales) => ({ ...actuales, pagina }))}
        />
      </div>
      <aside className="xl:border-l xl:border-border-hairline xl:pl-sp-24">
        <CajaRail />
      </aside>
    </div>
  );
}
