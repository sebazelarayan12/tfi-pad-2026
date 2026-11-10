import { loginGrupo, useApiClient, type LoginRequest } from '@nexa/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { iniciarSesion } from '../../auth';

/** Login de un grupo externo. Solo vale una respuesta con rol `Grupo` y sesión vigente. */
export function useIngresoGrupo() {
  const cliente = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: LoginRequest) => {
      const respuesta = await loginGrupo(cliente, body);
      if (respuesta.rol !== 'Grupo' || !iniciarSesion(respuesta)) {
        throw new Error('Respuesta de login inválida.');
      }
      return respuesta;
    },
    // Datos de una sesión anterior no deben quedar en caché para quien entra.
    onSuccess: () => queryClient.invalidateQueries(),
    retry: 0,
  });
}
