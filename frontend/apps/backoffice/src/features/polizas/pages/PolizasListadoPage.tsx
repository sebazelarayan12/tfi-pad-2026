import { isApiError } from '@nexa/api';
import { AlertaError, Button } from '@nexa/ui';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { TAMANO_PAGINA, usePolizasListado } from '../api/usePolizasListado';
import { useVistaListado } from '../api/useVistaListado';
import { PaginacionPolizas } from '../components/PaginacionPolizas';
import { PolizasFiltros } from '../components/PolizasFiltros';
import { ResultadoPolizas } from '../components/ResultadoPolizas';
import {
  escribirFiltrosPolizas,
  leerFiltrosPolizas,
  type FiltrosPolizas,
} from '../schemas/polizasListadoQuery';
import { TEXTO_ERROR_GENERICO } from '../textos';

const RUTA_CLIENTES = '/clientes';

function detalleDe(error: unknown): string {
  return isApiError(error) && error.detail ? error.detail : TEXTO_ERROR_GENERICO;
}

export function PolizasListadoPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const filtros = leerFiltrosPolizas(params);
  const consulta = usePolizasListado(filtros);
  const vista = useVistaListado(consulta);

  const cambiarFiltros = (siguientes: FiltrosPolizas) =>
    setParams(escribirFiltrosPolizas(siguientes));

  return (
    <section className="flex flex-col gap-sp-24">
      <header className="flex items-center justify-between gap-sp-16">
        <h1 className="text-h1 text-text-primary">Pólizas</h1>
        <Button label="Emitir póliza" onClick={() => void navigate(RUTA_CLIENTES)} />
      </header>

      <PolizasFiltros
        estado={filtros.estado}
        onCambiar={(estado) =>
          cambiarFiltros(estado === undefined ? { pagina: 1 } : { estado, pagina: 1 })
        }
      />

      {vista.hayError ? <AlertaError>{detalleDe(vista.error)}</AlertaError> : null}
      {vista.hayError && !vista.errorDeFiltro ? (
        <div>
          <Button label="Reintentar" variant="secondary" onClick={() => void consulta.refetch()} />
        </div>
      ) : null}

      <ResultadoPolizas
        filas={vista.filas}
        cargandoPrimera={vista.cargandoPrimera}
        actualizando={consulta.isFetching}
      />

      <PaginacionPolizas
        pagina={filtros.pagina}
        tamano={TAMANO_PAGINA}
        total={vista.total}
        filas={vista.filas?.length ?? 0}
        cargando={vista.cargandoPrimera}
        onCambiar={(pagina) => cambiarFiltros({ ...filtros, pagina })}
      />
    </section>
  );
}
