import { clientesKeys, crearCliente, useApiClient, type ClienteAltaRequest } from '@nexa/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Alta de cliente (FC11, FC18). Sin reintentos y sin pausa por falta de red: un alta no se
 * repite sola. Al éxito invalida las listas para que el listado muestre el cliente nuevo.
 */
export function useAltaCliente() {
  const cliente = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ClienteAltaRequest) => crearCliente(cliente, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clientesKeys.listas() }),
    retry: 0,
    networkMode: 'always',
  });
}
