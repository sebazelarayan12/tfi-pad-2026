import { cambiarActivoUsuarioMock, useApiClient } from '@nexa/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const CLAVE_LISTA_USUARIOS = ['usuarios', 'lista'] as const;

/**
 * `PATCH /api/usuarios/{id}/activo` (mock, PB-04). La lista se vuelve a pedir siempre, también ante un
 * error (p. ej. 404), para no dejar una fila desactualizada.
 */
export function useActivarUsuario() {
  const cliente = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      cambiarActivoUsuarioMock(cliente, id, activo),
    onSettled: () => queryClient.invalidateQueries({ queryKey: CLAVE_LISTA_USUARIOS }),
    retry: 0,
    networkMode: 'always',
  });
}
