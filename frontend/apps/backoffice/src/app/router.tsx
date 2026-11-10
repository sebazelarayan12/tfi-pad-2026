import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';

import { rutas as auth, rutasConSesion } from '../features/auth/routes';
import { rutas as clientes } from '../features/clientes/routes';
import { rutas as cotizaciones } from '../features/cotizaciones/routes';
import { rutas as cuotas } from '../features/cuotas/routes';
import { rutas as grupos } from '../features/grupos/routes';
import { rutas as inicio } from '../features/inicio/routes';
import {
  integracionesRutasPublicas,
  rutas as integraciones,
} from '../features/integraciones/routes';
import { rutas as pagoFacil } from '../features/pago-facil/routes';
import { rutas as pagos } from '../features/pagos/routes';
import { rutas as planes } from '../features/planes/routes';
import { rutas as polizas } from '../features/polizas/routes';
import { rutas as usuarios } from '../features/usuarios/routes';
import { rutas as vehiculos } from '../features/vehiculos/routes';
import { ErrorRuta } from './ErrorRuta';
import { RequireSesion } from './guards/RequireSesion';
import { LayoutBackoffice } from './layouts/LayoutBackoffice';
import { PaginaNoEncontrada } from './PaginaNoEncontrada';

/** Rutas públicas (incluye `/login` cuando B-01 lo agregue). */
const rutasPublicas = [...auth, ...integracionesRutasPublicas];

/** Rutas protegidas: las demás features en orden alfabético (FC14, ficha T-14 §6.7). */
const rutasProtegidas: RouteObject[] = [
  ...clientes,
  ...cotizaciones,
  ...cuotas,
  ...grupos,
  ...inicio,
  ...integraciones,
  ...pagoFacil,
  ...pagos,
  ...planes,
  ...polizas,
  ...usuarios,
  ...vehiculos,
];

export const rutasPorFeature: Record<string, RouteObject[]> = {
  auth,
  clientes,
  cotizaciones,
  cuotas,
  grupos,
  inicio,
  integraciones,
  'pago-facil': pagoFacil,
  pagos,
  planes,
  polizas,
  usuarios,
  vehiculos,
};

export const rutasApp: RouteObject[] = [
  {
    errorElement: <ErrorRuta />,
    children: [
      ...rutasPublicas,
      {
        element: <RequireSesion />,
        children: [
          ...rutasConSesion,
          { element: <LayoutBackoffice />, children: rutasProtegidas },
        ],
      },
      { path: '/', element: <Navigate to="/inicio" replace /> },
      { path: '*', element: <PaginaNoEncontrada /> },
    ],
  },
];

export const router = createBrowserRouter(rutasApp);
