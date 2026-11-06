import { crearUsuario, useApiClient } from '@nexa/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { CrearUsuarioPayload } from '../schemas/crearUsuarioSchema';

const CLAVE_LISTA_USUARIOS = ['usuarios', 'lista'] as const;

/**
 * Alta de empleado o administrador (FC11, FC18). Sin reintentos y sin pausa por falta de red:
 * un alta no se repite sola. El que la usa debe llamar `reset()` al terminar para que la contraseña
 * no quede en `variables`.
 */
export function useCrearUsuario() {
  const cliente = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CrearUsuarioPayload) => crearUsuario(cliente, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE_LISTA_USUARIOS }),
    retry: 0,
    networkMode: 'always',
  });
}
