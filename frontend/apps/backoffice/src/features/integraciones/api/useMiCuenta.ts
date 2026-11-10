import { gruposKeys, obtenerMiCuentaGrupo, useApiClient } from '@nexa/api';
import { useQuery } from '@tanstack/react-query';

/** Cuenta del grupo con la sesión abierta: estado de la solicitud y resumen de su clave. */
export function useMiCuenta(habilitado: boolean) {
  const cliente = useApiClient();
  return useQuery({
    queryKey: gruposKeys.miCuenta(),
    queryFn: () => obtenerMiCuentaGrupo(cliente),
    enabled: habilitado,
    retry: 0,
  });
}
