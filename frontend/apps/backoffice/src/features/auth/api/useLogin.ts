import { isApiError, loginRequest, useApiClient, type LoginResponse } from '@nexa/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { iniciarSesion } from '../sesion/store';
import type { LoginPayload } from '../schemas/loginSchema';

export type CampoLogin = 'email' | 'password';

export type ErrorLogin =
  { tipo: 'credenciales' } | { tipo: 'campos'; campos: CampoLogin[] } | { tipo: 'generico' };

const ROLES_VALIDOS: readonly string[] = ['Administrador', 'Empleado', 'Grupo'];

/**
 * Traduce el error del back a lo que muestra la pantalla. El 401 de este endpoint son
 * credenciales (contrato §2.6). Del 400 solo se usan las claves de `errors`, nunca su texto (PB-15).
 */
export function clasificarErrorLogin(error: unknown): ErrorLogin {
  if (!isApiError(error) || error.kind !== 'http') return { tipo: 'generico' };
  if (error.status === 401) return { tipo: 'credenciales' };
  if (error.status === 400 && error.errors) {
    const campos = Object.keys(error.errors).flatMap((clave): CampoLogin[] => {
      const normalizada = clave.toLowerCase();
      if (normalizada === 'email') return ['email'];
      if (normalizada === 'password') return ['password'];
      return [];
    });
    if (campos.length > 0) return { tipo: 'campos', campos };
  }
  return { tipo: 'generico' };
}

async function ingresar(
  cliente: ReturnType<typeof useApiClient>,
  body: LoginPayload,
): Promise<LoginResponse> {
  const respuesta = await loginRequest(cliente, body);
  if (!ROLES_VALIDOS.includes(respuesta.rol) || !iniciarSesion(respuesta)) {
    throw new Error('Respuesta de login inválida.');
  }
  return respuesta;
}

/** Mutación de login (FC18). Al éxito la sesión queda guardada; la página navega al verla. */
export function useLogin() {
  const cliente = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: LoginPayload) => ingresar(cliente, body),
    // Datos de una sesión anterior no deben quedar en caché para el usuario que entra.
    onSuccess: () => queryClient.invalidateQueries(),
    retry: 0,
  });
}
