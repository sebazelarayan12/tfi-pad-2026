import { listarPolizas, polizasKeys, useApiClient, type PolizaFiltroQuery } from '@nexa/api';
import { useQuery } from '@tanstack/react-query';

/** Máximo que acepta el back por página; más pólizas muestran el aviso de D-B07-8. */
export const TAMANO_POLIZAS = 100;

/** Pólizas del cliente, sin filtrar por estado: la ficha muestra también las vencidas. */
export function usePolizasDelCliente(clienteId: string, habilitado: boolean) {
  const api = useApiClient();
  const filtro: PolizaFiltroQuery = { clienteId, tamano: TAMANO_POLIZAS };
  return useQuery({
    queryKey: polizasKeys.lista(filtro),
    queryFn: () => listarPolizas(api, filtro),
    enabled: habilitado,
    retry: false,
  });
}
