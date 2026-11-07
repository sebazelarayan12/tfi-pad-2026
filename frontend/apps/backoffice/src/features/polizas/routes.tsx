import type { RouteObject } from 'react-router-dom';

import { EmitirPolizaPage } from './pages/EmitirPolizaPage';
import { PolizasListadoPage } from './pages/PolizasListadoPage';

// FC14: las rutas estáticas van antes que las dinámicas.
// B-15 agrega `/polizas/:id` después de las rutas estáticas.
export const rutas: RouteObject[] = [
  { path: '/polizas', element: <PolizasListadoPage />, handle: { titulo: 'Pólizas' } },
  {
    path: '/polizas/nueva',
    element: <EmitirPolizaPage />,
    handle: { titulo: 'Emitir póliza', tituloPrincipal: true, ocultarBuscador: true },
  },
];
