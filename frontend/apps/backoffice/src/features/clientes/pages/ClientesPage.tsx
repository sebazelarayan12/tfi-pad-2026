import { AlertaError, Button } from '@nexa/ui';
import { useSearchParams } from 'react-router-dom';
import { useClientes } from '../api/useClientes';
import { AvisoAlta } from '../components/AvisoAlta';
import { FiltrosClientes } from '../components/FiltrosClientes';
import { PaginacionTabla } from '../components/PaginacionTabla';
import { TablaClientes } from '../components/TablaClientes';
import { useBusquedaClientes } from '../hooks/useBusquedaClientes';

export function ClientesPage() {
  const [parametros, setParametros] = useSearchParams();
  const texto = (parametros.get('q') ?? '').slice(0, 100);
  const numero = Number(parametros.get('pagina') ?? 1);
  const pagina = Number.isSafeInteger(numero) && numero >= 1 && numero <= 21474836 ? numero : 1;
  const { filtro, pendiente } = useBusquedaClientes(texto);
  const consulta = useClientes(filtro, pagina, !pendiente);
  const cargando = pendiente || consulta.isFetching;
  const hayError = consulta.isError && !pendiente;
  const buscar = (valor: string) => setParametros(valor ? { q: valor } : {}, { replace: true });
  const limpiar = () => setParametros({}, { replace: true });

  return (
    <section aria-label="Listado de clientes" className="flex min-w-0 flex-col gap-sp-24">
      <AvisoAlta />
      <FiltrosClientes
        valor={texto}
        total={hayError ? undefined : consulta.data?.total}
        cargando={cargando}
        onBuscar={buscar}
      />
      {hayError ? (
        <div className="flex flex-col items-start gap-sp-12">
          <AlertaError>No pudimos cargar los clientes.</AlertaError>
          <Button label="Reintentar" variant="secondary" onClick={() => void consulta.refetch()} />
        </div>
      ) : (
        <TablaClientes
          clientes={consulta.data?.items ?? []}
          cargando={cargando}
          buscando={Object.keys(filtro).length > 0}
          onLimpiar={limpiar}
        />
      )}
      <PaginacionTabla
        pagina={pagina}
        total={hayError ? undefined : consulta.data?.total}
        cargando={cargando}
        onCambiar={(siguiente) =>
          setParametros({ ...(texto ? { q: texto } : {}), pagina: String(siguiente) })
        }
      />
    </section>
  );
}
