import { gruposKeys, registrarGrupo, useApiClient, type RegistroGrupoRequest } from '@nexa/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/** Crea la cuenta del grupo y su solicitud de acceso (queda pendiente de aprobación). */
export function useRegistrarGrupo() {
  const cliente = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: RegistroGrupoRequest) => registrarGrupo(cliente, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: gruposKeys.lista() }),
    retry: 0,
  });
}
