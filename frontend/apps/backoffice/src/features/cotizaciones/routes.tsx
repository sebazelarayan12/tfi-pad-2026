import type { RouteObject } from 'react-router-dom';
import { NuevaCotizacionPage } from './pages/NuevaCotizacionPage';

export const rutas: RouteObject[] = [
  {
    path: '/cotizaciones/nueva',
    element: <NuevaCotizacionPage />,
    handle: { titulo: 'Nueva cotización', tituloPrincipal: true, ocultarBuscador: true },
  },
];
