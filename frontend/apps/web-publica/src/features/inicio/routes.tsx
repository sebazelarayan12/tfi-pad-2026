import type { RouteObject } from 'react-router-dom';

import { InicioPage } from './pages/InicioPage';

/** `/` de la web pública (D-02). Va antes que el resto de las rutas del layout (FC14). */
export const rutas: RouteObject[] = [{ path: '/', element: <InicioPage /> }];
