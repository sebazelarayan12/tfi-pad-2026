import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { router, rutasApp, rutasPorFeature } from './router';
import { validarOrdenRutas } from './ordenRutas';

function montar(entrada: string) {
  const memoria = createMemoryRouter(rutasApp, { initialEntries: [entrada] });
  render(<RouterProvider router={memoria} />);
  return memoria;
}

function paths(rutas: RouteObject[], base = ''): string[] {
  return rutas.flatMap((ruta) => {
    const actual = ruta.path === undefined ? base : `${base}/${ruta.path}`.replace(/\/+/g, '/');
    return [...(ruta.path === undefined ? [] : [actual]), ...paths(ruta.children ?? [], actual)];
  });
}

describe('router', () => {
  it('/ redirige a /inicio', () => {
    const memoria = montar('/');
    expect(memoria.state.location.pathname).toBe('/inicio');
  });

  it('una ruta desconocida muestra PaginaNoEncontrada', () => {
    montar('/cualquiera');
    expect(screen.getByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument();
  });

  it('el enlace "Volver al inicio" lleva a /inicio', async () => {
    const memoria = montar('/cualquiera');
    const enlace = screen.getByRole('link', { name: 'Volver al inicio' });
    expect(enlace).toHaveAttribute('href', '/inicio');
    await userEvent.click(enlace);
    expect(memoria.state.location.pathname).toBe('/inicio');
  });

  it('el foco de la página no encontrada queda en el h1', () => {
    montar('/cualquiera');
    expect(screen.getByRole('heading', { name: 'Página no encontrada' })).toHaveFocus();
  });

  it('router existe y contiene las rutas no vacías de cada feature', () => {
    expect(router.routes.length).toBeGreaterThan(0);
    const todas = paths(rutasApp);
    for (const rutas of Object.values(rutasPorFeature)) {
      for (const path of paths(rutas)) expect(todas).toContain(path);
    }
  });

  it('compone las once features', () => {
    expect(Object.keys(rutasPorFeature).sort()).toEqual([
      'auth',
      'clientes',
      'cotizaciones',
      'cuotas',
      'inicio',
      'pago-facil',
      'pagos',
      'planes',
      'polizas',
      'usuarios',
      'vehiculos',
    ]);
  });

  it('las rutas compuestas respetan el orden estáticas antes que dinámicas', () => {
    expect(validarOrdenRutas(rutasApp)).toEqual([]);
  });
});
