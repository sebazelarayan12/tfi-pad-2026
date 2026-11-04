import { createBrowserRouter, type RouteObject } from 'react-router-dom';

import { rutas as rutasInicio } from '../features/inicio/routes';
import { rutas as rutasPagoFacil } from '../features/pago-facil/routes';
import { rutas as rutasPagos } from '../features/pagos/routes';
import { rutas as rutasPlanes } from '../features/planes/routes';
import { rutas as rutasPolizas } from '../features/polizas/routes';
import { PublicLayout } from './layouts/PublicLayout';
import { PaginaNoEncontrada } from './PaginaNoEncontrada';

/** Un feature por vez, en el orden de la ficha T-17 §6.7 (FC14: estáticas antes que dinámicas). */
export const rutasApp: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [
      ...rutasInicio,
      ...rutasPlanes,
      ...rutasPolizas,
      ...rutasPagos,
      ...rutasPagoFacil,
      // Placeholder: sin pantallas, `/` renderiza el `Outlet` vacío. US-FE-W-01 lo reemplaza
      // con la home (su `index` va antes y este se borra).
      { index: true },
      { path: '*', element: <PaginaNoEncontrada /> },
    ],
  },
];

export const router = createBrowserRouter(rutasApp);
