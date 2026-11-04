import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { validarOrdenRutas } from './ordenRutas';
import { router, rutasApp } from './router';

function paths(rutas: RouteObject[], base = ''): string[] {
  return rutas.flatMap((ruta) => {
    const actual = ruta.path === undefined ? base : `${base}/${ruta.path}`.replace(/\/+/g, '/');
    return [...(ruta.path === undefined ? [] : [actual]), ...paths(ruta.children ?? [], actual)];
  });
}

function montar(entrada: string) {
  const memoria = createMemoryRouter(rutasApp, { initialEntries: [entrada] });
  render(<RouterProvider router={memoria} />);
  return memoria;
}

describe('router', () => {
  it('crea el router sin lanzar', () => {
    expect(router.routes.length).toBeGreaterThan(0);
  });

  it('no declara dos rutas con el mismo path', () => {
    const todas = paths(rutasApp);
    expect(new Set(todas).size).toBe(todas.length);
  });

  it('declara las rutas estáticas antes que las dinámicas con el mismo prefijo', () => {
    expect(validarOrdenRutas(rutasApp)).toEqual([]);
  });

  it('una ruta desconocida muestra la página no encontrada y mueve el foco al h1', () => {
    montar('/ruta-inexistente');
    const titulo = screen.getByRole('heading', { name: 'Página no encontrada' });
    expect(titulo).toHaveFocus();
  });

  it('/ renderiza el layout sin pantallas', () => {
    montar('/');
    expect(screen.queryByRole('heading')).toBeNull();
  });
});
