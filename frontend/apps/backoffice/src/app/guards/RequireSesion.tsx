import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { RUTA_CAMBIAR_PASSWORD, RUTA_LOGIN, useSesion } from '../../features/auth';

const RUTA_INICIO = '/inicio';

/**
 * Sin sesión vigente redirige a `/login` y recuerda la ruta de origen en `state.desde`.
 * Con el cambio de contraseña pendiente (US-F1-09) solo deja ver `/cambiar-password`; sin
 * cambio pendiente esa ruta no tiene nada que mostrar y vuelve a `/inicio`.
 */
export function RequireSesion() {
  const sesion = useSesion();
  const ubicacion = useLocation();

  if (sesion === null) {
    return (
      <Navigate
        to={RUTA_LOGIN}
        replace
        state={{ desde: `${ubicacion.pathname}${ubicacion.search}` }}
      />
    );
  }

  const enCambioPassword = ubicacion.pathname === RUTA_CAMBIAR_PASSWORD;
  if (sesion.debeCambiarPassword && !enCambioPassword) {
    return <Navigate to={RUTA_CAMBIAR_PASSWORD} replace />;
  }
  if (!sesion.debeCambiarPassword && enCambioPassword) {
    return <Navigate to={RUTA_INICIO} replace />;
  }
  return <Outlet />;
}
