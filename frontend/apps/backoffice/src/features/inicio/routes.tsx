import { Button } from '@nexa/ui';
import type { RouteObject } from 'react-router-dom';
import { InicioPage } from './pages/InicioPage';

export const inicioRoutes: RouteObject[] = [
  {
    path: '/inicio',
    element: <InicioPage />,
    handle: {
      titulo: 'Inicio',
      // V-01 (DP del usuario): como en el Figma, pero deshabilitado hasta que exista el flujo de cotización.
      accion: <Button label="Nueva cotización" variant="primary" size="m" disabled aria-disabled />,
    },
  },
];

export { inicioRoutes as rutas };
