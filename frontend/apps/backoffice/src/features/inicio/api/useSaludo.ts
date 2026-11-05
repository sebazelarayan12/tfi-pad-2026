import { obtenerYoMock, useApiClient, usuariosKeys } from '@nexa/api';
import { useQuery } from '@tanstack/react-query';
import { emailSesion, useSesion } from '../../auth';

export function useSaludo() {
  const cliente = useApiClient();
  const email = emailSesion(useSesion());
  const perfil = useQuery({
    queryKey: usuariosKeys.yo(),
    queryFn: () => obtenerYoMock(cliente),
    retry: false,
    networkMode: 'always',
  });
  return perfil.data?.nombre?.trim() || email;
}
