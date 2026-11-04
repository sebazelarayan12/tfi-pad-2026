import type { RouteObject } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { validarOrdenRutas } from './ordenRutas';

describe('validarOrdenRutas', () => {
  it('una estática antes que la dinámica no produce error', () => {
    const rutas: RouteObject[] = [{ path: '/polizas/nueva' }, { path: '/polizas/:id' }];
    expect(validarOrdenRutas(rutas)).toEqual([]);
  });

  it('una estática después de la dinámica que la captura produce un error', () => {
    const rutas: RouteObject[] = [{ path: '/polizas/:id' }, { path: '/polizas/nueva' }];
    expect(validarOrdenRutas(rutas)).toEqual(['/polizas/nueva']);
  });

  it('compone el path de las rutas hijas y recorre las rutas sin path', () => {
    const rutas: RouteObject[] = [
      { children: [{ path: '/polizas', children: [{ path: ':id' }, { path: 'nueva' }] }] },
    ];
    expect(validarOrdenRutas(rutas)).toEqual(['/polizas/nueva']);
  });

  it('una lista vacía no produce error', () => {
    expect(validarOrdenRutas([])).toEqual([]);
  });
});
