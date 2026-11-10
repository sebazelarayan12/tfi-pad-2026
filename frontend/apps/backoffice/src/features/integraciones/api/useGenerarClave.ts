import { generarClaveGrupo, gruposKeys, useApiClient } from '@nexa/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/** Genera una clave nueva (la anterior deja de funcionar) y refresca el resumen de la cuenta. */
export function useGenerarClave() {
  const cliente = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => generarClaveGrupo(cliente),
    onSettled: () => queryClient.invalidateQueries({ queryKey: gruposKeys.miCuenta() }),
    retry: 0,
  });
}
