import { pagoFacilKeys, subirRendicion, useApiClient } from '@nexa/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useSubirRendicion() {
  const cliente = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (archivo: File) => subirRendicion(cliente, archivo),
    retry: 0,
    // Una subida iniciada sin conexión falla en el momento, sin quedar en cola.
    networkMode: 'always',
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pagoFacilKeys.rendiciones() });
    },
  });
}
