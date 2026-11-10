import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { RUTA_CAMBIAR_PASSWORD, RUTA_LOGIN, useSesion } from '../../features/auth';

const RUTA_INICIO = '/inicio';
const RUTA_INTEGRACIONES = '/integraciones';

/**
 * Sin sesión vigente redirige a `/login` y recuerda la ruta de origen en `state.desde`.
 * Con el cambio de contraseña pendiente (US-F1-09) solo deja ver `/cambiar-password`; sin
 * cambio pendiente esa ruta no tiene nada que mostrar y vuelve a `/inicio`.
 * Un grupo externo (rol `Grupo`) solo ve `/integraciones`: cualquier otra ruta lo devuelve ahí.
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

  if (sesion.rol === 'Grupo') {
    const enIntegraciones =
      ubicacion.pathname === RUTA_INTEGRACIONES ||
      ubicacion.pathname.startsWith(`${RUTA_INTEGRACIONES}/`);
    return enIntegraciones ? <Outlet /> : <Navigate to={RUTA_INTEGRACIONES} replace />;
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
