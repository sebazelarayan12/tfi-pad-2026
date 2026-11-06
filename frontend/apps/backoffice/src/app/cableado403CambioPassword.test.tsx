import { ApiError } from '@nexa/api';
import { createMemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cerrarSesion, iniciarSesion, sesionActual } from '../features/auth';
import { crearApiClientApp } from './apiClient';

const AHORA = Date.now();

function problema403(codigo?: string): Response {
  return new Response(JSON.stringify({ status: 403, title: 'Forbidden', ...(codigo ? { codigo } : {}) }), {
    status: 403,
    headers: { 'Content-Type': 'application/problem+json' },
  });
}

function montar() {
  const router = createMemoryRouter([{ path: '*', element: null }], { initialEntries: ['/clientes'] });
  const api = crearApiClientApp({
    baseUrl: 'http://api.test',
    navegar: (ruta, opciones) => router.navigate(ruta, opciones),
  });
  return { router, api };
}

beforeEach(() => {
  iniciarSesion(
    { token: 'jwt-de-prueba', rol: 'Empleado', expiraEn: new Date(AHORA + 60_000).toISOString() },
    AHORA,
  );
});

afterEach(() => {
  cerrarSesion('manual');
  sessionStorage.clear();
  vi.unstubAllGlobals();
});

describe('cableado del 403 PASSWORD_CAMBIO_REQUERIDO', () => {
  it('403_password_cambio_requerido_lleva_a_cambiar_password_sin_cerrar_sesion', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(problema403('PASSWORD_CAMBIO_REQUERIDO'))));
    const { api, router } = montar();

    await expect(api.get('/api/clientes')).rejects.toBeInstanceOf(ApiError);

    expect(sesionActual()?.debeCambiarPassword).toBe(true);
    expect(router.state.location.pathname).toBe('/cambiar-password');
  });

  it('otro_403_no_toca_la_sesion_ni_navega', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(problema403())));
    const { api, router } = montar();

    await expect(api.get('/api/clientes')).rejects.toBeInstanceOf(ApiError);

    expect(sesionActual()?.debeCambiarPassword).toBe(false);
    expect(router.state.location.pathname).toBe('/clientes');
  });
});
