import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { RUTA_LOGIN, useSesion } from '../../features/auth';

/** Sin sesión vigente redirige a `/login` y recuerda la ruta de origen en `state.desde`. */
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
  return <Outlet />;
}
