import {
  aprobarGrupo,
  rechazarGrupo,
  revocarGrupo,
  useApiClient,
  type GrupoListItemResponse,
} from '@nexa/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export type AccionGrupo =
  | { tipo: 'aprobar'; id: string }
  | { tipo: 'rechazar'; id: string; motivo: string }
  | { tipo: 'revocar'; id: string; motivo: string };

const CLAVE_LISTA_GRUPOS = ['grupos', 'lista'] as const;

/**
 * Aprueba, rechaza o revoca un grupo. La lista se vuelve a pedir siempre, también ante un error
 * (p. ej. otro administrador ya resolvió la solicitud), para no dejar una fila desactualizada.
 */
export function useResolverGrupo() {
  const cliente = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<GrupoListItemResponse, Error, AccionGrupo>({
    mutationFn: (accion) => {
      switch (accion.tipo) {
        case 'aprobar':
          return aprobarGrupo(cliente, accion.id);
        case 'rechazar':
          return rechazarGrupo(cliente, accion.id, { motivo: accion.motivo });
        case 'revocar':
          return revocarGrupo(cliente, accion.id, { motivo: accion.motivo });
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: CLAVE_LISTA_GRUPOS }),
    retry: 0,
  });
}
