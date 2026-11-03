import type { RouteObject } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { validarOrdenRutas } from './ordenRutas';

describe('validarOrdenRutas', () => {
  it('/clientes/nuevo antes que /clientes/:clienteId no produce error', () => {
    const rutas: RouteObject[] = [{ path: '/clientes/nuevo' }, { path: '/clientes/:clienteId' }];
    expect(validarOrdenRutas(rutas)).toEqual([]);
  });

  it('/clientes/:clienteId antes que /clientes/nuevo produce un error', () => {
    const rutas: RouteObject[] = [{ path: '/clientes/:clienteId' }, { path: '/clientes/nuevo' }];
    expect(validarOrdenRutas(rutas)).toEqual(['/clientes/nuevo']);
  });

  it('/polizas/nueva antes que /polizas/:id no produce error', () => {
    const rutas: RouteObject[] = [{ path: '/polizas/nueva' }, { path: '/polizas/:id' }];
    expect(validarOrdenRutas(rutas)).toEqual([]);
  });

  it('una estática de otro prefijo después de una dinámica no es error', () => {
    const rutas: RouteObject[] = [{ path: '/clientes/:clienteId' }, { path: '/polizas/nueva' }];
    expect(validarOrdenRutas(rutas)).toEqual([]);
  });

  it('compone el path de las rutas hijas', () => {
    const rutas: RouteObject[] = [
      {
        path: '/clientes',
        children: [{ path: ':clienteId' }, { path: 'nuevo' }],
      },
    ];
    expect(validarOrdenRutas(rutas)).toEqual(['/clientes/nuevo']);
  });

  it('ignora las rutas sin path (layouts) pero recorre sus hijas', () => {
    const rutas: RouteObject[] = [
      { children: [{ path: '/clientes/:clienteId' }] },
      { children: [{ path: '/clientes/nuevo' }] },
    ];
    expect(validarOrdenRutas(rutas)).toEqual(['/clientes/nuevo']);
  });

  it('una lista vacía no produce error', () => {
    expect(validarOrdenRutas([])).toEqual([]);
  });
});
