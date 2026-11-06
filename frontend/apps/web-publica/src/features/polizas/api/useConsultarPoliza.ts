import { consultarPoliza, publicoKeys, useApiClient, type ConsultaPublicaRequest } from '@nexa/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * `POST /api/publico/consulta` (RN20). Sin reintento automático: un 429 reintentado empeora el
 * bloqueo (FC13). El botón se deshabilita con `isPending` en la página.
 */
export function useConsultarPoliza() {
  const cliente = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: ConsultaPublicaRequest) => consultarPoliza(cliente, body),
    // La consulta no llena una caché propia; se invalidan las consultas públicas para que un
    // cupón o los medios de pago montados no queden asociados a la póliza anterior.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: publicoKeys.all }),
    retry: 0,
  });
}
