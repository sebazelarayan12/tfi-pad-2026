import type { RouteObject } from 'react-router-dom';

import { CambiarPasswordPage } from './pages/CambiarPasswordPage';
import { LoginPage } from './pages/LoginPage';

export const rutas: RouteObject[] = [{ path: '/login', element: <LoginPage /> }];

/** Ruta con sesión pero fuera del layout del backoffice (US-FE-B-26). */
export const rutasConSesion: RouteObject[] = [
  { path: '/cambiar-password', element: <CambiarPasswordPage /> },
];
