import { cambiarPassword, useApiClient } from '@nexa/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { CambiarPasswordPayload } from '../schemas/cambiarPasswordSchema';

/**
 * Mutación de `POST /api/auth/cambiar-password` (FC11, FC18): sin reintentos y sin cola offline.
 * La respuesta (un token) no se guarda en la caché: la página la pasa a `iniciarSesion`. Como la
 * sesión se reemplaza, se invalida lo cacheado con el token anterior (igual que el login).
 */
export function useCambiarPassword() {
  const cliente = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CambiarPasswordPayload) => cambiarPassword(cliente, body),
    onSuccess: () => queryClient.invalidateQueries(),
    retry: 0,
    networkMode: 'always',
    gcTime: 0,
  });
}
