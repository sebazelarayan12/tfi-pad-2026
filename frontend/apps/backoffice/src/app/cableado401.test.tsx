import { ApiError } from '@nexa/api';
import { createMemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cerrarSesion, iniciarSesion, sesionActual } from '../features/auth';
import { crearApiClientApp } from './apiClient';

const BASE = 'http://api.test';
const AHORA = Date.now();

function respuestaConStatus(status: number): Response {
  return new Response(null, { status });
}

function montar() {
  const router = createMemoryRouter([{ path: '*', element: null }], {
    initialEntries: ['/inicio'],
  });
  const api = crearApiClientApp({
    baseUrl: BASE,
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

describe('cableado del 401 global', () => {
  it('envía el token de la sesión en Authorization', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(respuestaConStatus(204)));
    vi.stubGlobal('fetch', fetchMock);
    const { api } = montar();

    await api.get('/api/clientes');

    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer jwt-de-prueba');
  });

  it('401 de un endpoint protegido cierra la sesión y navega a /login', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(respuestaConStatus(401))),
    );
    const { api, router } = montar();

    await expect(api.get('/api/clientes')).rejects.toBeInstanceOf(ApiError);

    expect(sesionActual()).toBeNull();
    expect(router.state.location.pathname).toBe('/login');
  });

  it('401 de /api/auth/login no cierra la sesión', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(respuestaConStatus(401))),
    );
    const { api, router } = montar();

    await expect(
      api.post('/api/auth/login', { email: 'a@b.com', password: 'x' }),
    ).rejects.toBeInstanceOf(ApiError);

    expect(sesionActual()).not.toBeNull();
    expect(router.state.location.pathname).toBe('/inicio');
  });

  it('403 no cierra la sesión', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(respuestaConStatus(403))),
    );
    const { api, router } = montar();

    await expect(api.get('/api/planes')).rejects.toBeInstanceOf(ApiError);

    expect(sesionActual()).not.toBeNull();
    expect(router.state.location.pathname).toBe('/inicio');
  });
});
