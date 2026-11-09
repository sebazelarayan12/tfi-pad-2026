import { actualizarUsuarioMock, useApiClient } from '@nexa/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { EditarUsuarioPayload } from '../schemas/editarUsuarioSchema';

const CLAVE_LISTA_USUARIOS = ['usuarios', 'lista'] as const;

/** `PUT /api/usuarios/{id}` (mock, PB-04). Sin reintentos (FC11): el body es solo nombre, apellido y rol. */
export function useEditarUsuario() {
  const cliente = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: EditarUsuarioPayload }) =>
      actualizarUsuarioMock(cliente, id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE_LISTA_USUARIOS }),
    retry: 0,
    networkMode: 'always',
  });
}
