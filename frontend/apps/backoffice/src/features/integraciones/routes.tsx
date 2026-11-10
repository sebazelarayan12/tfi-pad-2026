import type { RouteObject } from 'react-router-dom';

import { IngresoGrupoPage } from './pages/IngresoGrupoPage';
import { IntegracionesPage } from './pages/IntegracionesPage';
import { SolicitarAccesoPage } from './pages/SolicitarAccesoPage';
import { RUTA_INGRESO_GRUPO, RUTA_INTEGRACIONES, RUTA_REGISTRO_GRUPO } from './rutas';

export const integracionesRoutes: RouteObject[] = [
  {
    path: RUTA_INTEGRACIONES,
    element: <IntegracionesPage />,
    handle: { titulo: 'Integraciones', ocultarBuscador: true },
  },
];

/** Pantallas de acceso del grupo, fuera de la sesión y del layout del backoffice. */
export const integracionesRutasPublicas: RouteObject[] = [
  { path: RUTA_INGRESO_GRUPO, element: <IngresoGrupoPage /> },
  { path: RUTA_REGISTRO_GRUPO, element: <SolicitarAccesoPage /> },
];

export { integracionesRoutes as rutas };
