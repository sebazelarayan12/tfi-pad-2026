import { clientesKeys, listarClientes, useApiClient } from '@nexa/api';
import { useQuery } from '@tanstack/react-query';

import { BUSQUEDA_NUMERO_DNI_DISPONIBLE } from '../lib/busquedaDisponible';
import { clasificarBusqueda } from '../lib/clasificarBusqueda';
import type { FiltrosPolizas } from '../schemas/polizasListadoQuery';
import { usePolizasListado } from './usePolizasListado';

export function useBusquedaPolizas(texto: string, filtros: FiltrosPolizas) {
  const api = useApiClient();
  const busqueda = clasificarBusqueda(texto);
  const tipo = busqueda?.tipo;
  const valor = busqueda?.valor ?? '';
  const habilitada = BUSQUEDA_NUMERO_DNI_DISPONIBLE;

  const buscaPorDni = habilitada && tipo === 'dni';
  const filtroCliente = { dni: valor, pagina: 1, tamanoPagina: 1 };
  const clientes = useQuery({
    queryKey: clientesKeys.lista(filtroCliente),
    queryFn: () => listarClientes(api, filtroCliente),
    enabled: buscaPorDni,
    retry: false,
  });
  const clienteId = clientes.data?.items[0]?.id;
  const dniSinCliente = buscaPorDni && clientes.isSuccess && clienteId === undefined;

  const consulta = usePolizasListado(filtros, {
    ...(tipo === 'patente' ? { patente: valor } : {}),
    ...(habilitada && tipo === 'numero' ? { numero: valor } : {}),
    ...(clienteId === undefined ? {} : { clienteId }),
    // El DNI espera al cliente: sin él, una lista vacía de `clienteId` devolvería todo.
    enabled: !buscaPorDni || clienteId !== undefined,
  });

  return {
    consulta,
    dniSinCliente,
    errorCliente: buscaPorDni && clientes.isError ? clientes.error : undefined,
    formatoInvalido: tipo === 'invalido',
    noDisponible: !habilitada && (tipo === 'numero' || tipo === 'dni'),
  };
}
