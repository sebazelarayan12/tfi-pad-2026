import { ApiClientProvider, createApiClient } from '@nexa/api';
import { servidorMock } from '@nexa/api/mocks/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

import { cerrarSesion } from '../sesion/store';
import { LoginPage } from './LoginPage';

function respuestaLogin(debeCambiarPassword?: boolean) {
  return {
    token: `cabecera.${btoa(JSON.stringify({ email: 'a@b.com' }))}.firma`,
    rol: 'Empleado',
    expiraEn: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    ...(debeCambiarPassword === undefined ? {} : { debeCambiarPassword }),
  };
}

async function iniciar(respuesta: ReturnType<typeof respuestaLogin>) {
  servidorMock.use(http.post('*/api/auth/login', () => HttpResponse.json(respuesta)));
  const usuario = userEvent.setup();
  const cliente = createApiClient({ baseUrl: 'https://api.test' });
  render(
    <ApiClientProvider client={cliente}>
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/inicio" element={<p>Pantalla de inicio</p>} />
            <Route path="/cambiar-password" element={<p>Pantalla de cambio</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ApiClientProvider>,
  );
  await usuario.type(screen.getByLabelText('Email'), 'a@b.com');
  await usuario.type(screen.getByLabelText('Contraseña'), 'Prueba-Ficticia-1');
  await usuario.click(screen.getByRole('button', { name: 'Ingresar' }));
}

afterEach(() => {
  cerrarSesion('manual');
  sessionStorage.clear();
});

describe('LoginPage y cambio de contraseña obligatorio', () => {
  it('login_con_bandera_navega_a_cambiar_password', async () => {
    await iniciar(respuestaLogin(true));
    expect(await screen.findByText('Pantalla de cambio')).toBeInTheDocument();
  });

  it('login_sin_bandera_sigue_yendo_a_inicio', async () => {
    await iniciar(respuestaLogin(false));
    expect(await screen.findByText('Pantalla de inicio')).toBeInTheDocument();
  });

  it('login_sin_el_campo_sigue_yendo_a_inicio', async () => {
    await iniciar(respuestaLogin());
    expect(await screen.findByText('Pantalla de inicio')).toBeInTheDocument();
  });
});
