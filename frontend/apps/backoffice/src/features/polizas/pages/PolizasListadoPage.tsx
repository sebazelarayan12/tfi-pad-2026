import { isApiError } from '@nexa/api';
import { AlertaError, Button } from '@nexa/ui';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useBusquedaPolizas } from '../api/useBusquedaPolizas';
import { TAMANO_PAGINA } from '../api/usePolizasListado';
import { useVistaListado } from '../api/useVistaListado';
import { BuscadorPolizas } from '../components/BuscadorPolizas';
import { PaginacionPolizas } from '../components/PaginacionPolizas';
import { PolizasFiltros } from '../components/PolizasFiltros';
import { ResultadoPolizas } from '../components/ResultadoPolizas';
import {
  escribirFiltrosPolizas,
  leerFiltrosPolizas,
  type FiltrosPolizas,
} from '../schemas/polizasListadoQuery';
import { TEXTO_BUSQUEDA_NO_DISPONIBLE, TEXTO_ERROR_GENERICO } from '../textos';

const RUTA_CLIENTES = '/clientes';

function detalleDe(error: unknown): string {
  return isApiError(error) && error.detail ? error.detail : TEXTO_ERROR_GENERICO;
}

export function PolizasListadoPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const filtros = leerFiltrosPolizas(params);
  const [busqueda, setBusqueda] = useState('');
  const { consulta, dniSinCliente, errorCliente, formatoInvalido, noDisponible } =
    useBusquedaPolizas(busqueda, filtros);
  const vista = useVistaListado(consulta);
  const filas = dniSinCliente ? [] : vista.filas;
  const total = dniSinCliente ? 0 : vista.total;

  const cambiarFiltros = (siguientes: FiltrosPolizas) =>
    setParams(escribirFiltrosPolizas(siguientes));

  return (
    <section className="flex flex-col gap-sp-24">
      <header className="flex items-center justify-between gap-sp-16">
        <h1 className="text-h1 text-text-primary">Pólizas</h1>
        <Button label="Emitir póliza" onClick={() => void navigate(RUTA_CLIENTES)} />
      </header>

      <BuscadorPolizas
        formatoInvalido={formatoInvalido}
        onBuscar={(texto) => {
          setBusqueda(texto);
          cambiarFiltros({ ...filtros, pagina: 1 });
        }}
      />
      {noDisponible ? (
        <p role="status" className="text-body-sm text-text-secondary">
          {TEXTO_BUSQUEDA_NO_DISPONIBLE}
        </p>
      ) : null}

      <PolizasFiltros
        estado={filtros.estado}
        onCambiar={(estado) =>
          cambiarFiltros(estado === undefined ? { pagina: 1 } : { estado, pagina: 1 })
        }
      />

      {errorCliente === undefined ? null : <AlertaError>{detalleDe(errorCliente)}</AlertaError>}
      {vista.hayError ? <AlertaError>{detalleDe(vista.error)}</AlertaError> : null}
      {vista.hayError && !vista.errorDeFiltro ? (
        <div>
          <Button label="Reintentar" variant="secondary" onClick={() => void consulta.refetch()} />
        </div>
      ) : null}

      <ResultadoPolizas
        filas={filas}
        cargandoPrimera={vista.cargandoPrimera}
        actualizando={consulta.isFetching}
      />

      <PaginacionPolizas
        pagina={filtros.pagina}
        tamano={TAMANO_PAGINA}
        total={total}
        filas={filas?.length ?? 0}
        cargando={vista.cargandoPrimera}
        onCambiar={(pagina) => cambiarFiltros({ ...filtros, pagina })}
      />
    </section>
  );
}
