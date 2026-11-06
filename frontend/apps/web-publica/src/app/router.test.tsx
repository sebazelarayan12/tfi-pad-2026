import { servidorMock } from '@nexa/api/mocks/server';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router-dom';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { validarOrdenRutas } from './ordenRutas';
import { Providers } from './providers';
import { router, rutasApp } from './router';

// La home pide los planes (`TablaPlanes`): se responden con el handler de MSW.
beforeAll(() => servidorMock.listen({ onUnhandledRequest: 'error' }));
afterEach(() => servidorMock.resetHandlers());
afterAll(() => servidorMock.close());

function paths(rutas: RouteObject[], base = ''): string[] {
  return rutas.flatMap((ruta) => {
    const actual = ruta.path === undefined ? base : `${base}/${ruta.path}`.replace(/\/+/g, '/');
    return [...(ruta.path === undefined ? [] : [actual]), ...paths(ruta.children ?? [], actual)];
  });
}

function montar(entrada: string) {
  const memoria = createMemoryRouter(rutasApp, { initialEntries: [entrada] });
  render(
    <Providers>
      <RouterProvider router={memoria} />
    </Providers>,
  );
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

  it('/ renderiza la home dentro del layout', async () => {
    montar('/');
    const titulo = screen.getByRole('heading', {
      level: 1,
      name: 'Tu vehículo asegurado, tu póliza siempre a mano.',
    });
    expect(screen.getByRole('main')).toContainElement(titulo);
    await screen.findByText('$ 12.000,00');
  });
});
