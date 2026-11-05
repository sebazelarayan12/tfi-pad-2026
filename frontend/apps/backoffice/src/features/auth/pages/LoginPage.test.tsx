import { ApiClientProvider, createApiClient } from '@nexa/api';
import { servidorMock } from '@nexa/api/mocks/server';
import { expectSinViolacionesA11y } from '@nexa/ui/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cerrarSesion, sesionActual } from '../sesion/store';
import { LoginPage } from './LoginPage';

const BASE_URL = 'https://api.test';
const URL_LOGIN = '*/api/auth/login';

function tokenFalso(email: string): string {
  const cuerpo = btoa(JSON.stringify({ email })).replace(/=+$/, '');
  return `cabecera.${cuerpo}.firma`;
}

function respuestaLogin(rol = 'Empleado') {
  return {
    token: tokenFalso('mariela@nexaseguros.com.ar'),
    rol,
    expiraEn: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  };
}

function UbicacionActual() {
  const ubicacion = useLocation();
  return <p data-testid="ubicacion">{`${ubicacion.pathname}${ubicacion.search}`}</p>;
}

interface OpcionesRender {
  entrada?: string | { pathname: string; state?: unknown };
  onUnauthorized?: () => void;
}

function renderizarLogin({ entrada = '/login', onUnauthorized }: OpcionesRender = {}) {
  const cliente = createApiClient({
    baseUrl: BASE_URL,
    ...(onUnauthorized ? { onUnauthorized } : {}),
  });
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: 0 }, queries: { retry: false } },
  });

  return render(
    <ApiClientProvider client={cliente}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[entrada]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/inicio" element={<p>Pantalla de inicio</p>} />
            <Route path="/clientes" element={<p>Pantalla de clientes</p>} />
          </Routes>
          <UbicacionActual />
        </MemoryRouter>
      </QueryClientProvider>
    </ApiClientProvider>,
  );
}

async function completarYEnviar(email: string, password: string) {
  const usuario = userEvent.setup();
  if (email) await usuario.type(screen.getByLabelText('Email'), email);
  if (password) await usuario.type(screen.getByLabelText('Contraseña'), password);
  await usuario.click(screen.getByRole('button', { name: 'Ingresar' }));
  return usuario;
}

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});
afterEach(() => {
  cerrarSesion('manual');
});

describe('LoginPage: formulario', () => {
  it('muestra los labels visibles Email y Contraseña asociados a sus campos', () => {
    renderizarLogin();

    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Email')).not.toHaveAttribute('placeholder');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Ingresar al panel' }),
    ).toBeInTheDocument();
  });

  it('los campos arrancan vacíos (sin valores de muestra)', () => {
    renderizarLogin();

    expect(screen.getByLabelText('Email')).toHaveValue('');
    expect(screen.getByLabelText('Contraseña')).toHaveValue('');
  });

  it('muestra "El email es obligatorio." y no llama a la API', async () => {
    const solicitudes = vi.fn();
    servidorMock.events.on('request:start', solicitudes);
    renderizarLogin();

    await completarYEnviar('', 'secreto');

    expect(await screen.findByText('El email es obligatorio.')).toBeInTheDocument();
    expect(solicitudes).not.toHaveBeenCalled();
    servidorMock.events.removeListener('request:start', solicitudes);
  });

  it('muestra "El email no tiene un formato válido." para email inválido', async () => {
    renderizarLogin();

    await completarYEnviar('correo-sin-arroba', 'secreto');

    expect(await screen.findByText('El email no tiene un formato válido.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('muestra "La contraseña es obligatoria." para contraseña vacía', async () => {
    renderizarLogin();

    await completarYEnviar('mariela@nexaseguros.com.ar', '');

    expect(await screen.findByText('La contraseña es obligatoria.')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('aria-invalid', 'true');
  });

  it('con campos inválidos enfoca el primer campo inválido', async () => {
    renderizarLogin();

    await completarYEnviar('', '');

    await waitFor(() => expect(screen.getByLabelText('Email')).toHaveFocus());
  });

  it('muestra la ayuda de la contraseña como texto, sin link', () => {
    renderizarLogin();

    expect(
      screen.getByText('¿Olvidaste tu contraseña? Pedila a un administrador.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('no renderiza "Foto: sede de atención" ni imágenes del panel', () => {
    const { container } = renderizarLogin();

    expect(screen.queryByText('Foto: sede de atención')).not.toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('Panel interno de Nexa Seguros')).toBeInTheDocument();
  });

  it('el toggle de contraseña alterna type, aria-pressed y aria-label', async () => {
    renderizarLogin();
    const usuario = userEvent.setup();

    const toggle = screen.getByRole('button', { name: 'Mostrar contraseña' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await usuario.click(toggle);

    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});

describe('LoginPage: envío', () => {
  it('envía POST /api/auth/login con body { email, password } y recorta el email', async () => {
    let cuerpo: unknown;
    servidorMock.use(
      http.post(URL_LOGIN, async ({ request }) => {
        cuerpo = await request.json();
        return HttpResponse.json(respuestaLogin());
      }),
    );
    renderizarLogin();

    await completarYEnviar('  mariela@nexaseguros.com.ar  ', 'secreto');

    await waitFor(() =>
      expect(cuerpo).toEqual({ email: 'mariela@nexaseguros.com.ar', password: 'secreto' }),
    );
  });

  it.each(['Empleado', 'Administrador'])(
    '200 guarda token, rol y expiraEn en el store y navega a /inicio (%s)',
    async (rol) => {
      const respuesta = respuestaLogin(rol);
      servidorMock.use(http.post(URL_LOGIN, () => HttpResponse.json(respuesta)));
      renderizarLogin();

      await completarYEnviar('mariela@nexaseguros.com.ar', 'secreto');

      await waitFor(() => expect(screen.getByTestId('ubicacion')).toHaveTextContent('/inicio'));
      expect(sesionActual()).toMatchObject({ token: respuesta.token, rol });
      expect(sesionActual()?.expiraEn.toISOString()).toBe(respuesta.expiraEn);
    },
  );

  it('200 no escribe en localStorage', async () => {
    servidorMock.use(http.post(URL_LOGIN, () => HttpResponse.json(respuestaLogin())));
    renderizarLogin();

    await completarYEnviar('mariela@nexaseguros.com.ar', 'secreto');

    await waitFor(() => expect(sesionActual()).not.toBeNull());
    expect(localStorage.length).toBe(0);
  });

  it('200 con un rol desconocido no guarda la sesión y muestra el error genérico', async () => {
    servidorMock.use(http.post(URL_LOGIN, () => HttpResponse.json(respuestaLogin('Gerente'))));
    renderizarLogin();

    await completarYEnviar('mariela@nexaseguros.com.ar', 'secreto');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos iniciar sesión. Probá de nuevo en unos minutos.',
    );
    expect(sesionActual()).toBeNull();
  });

  it('401 muestra "Email o contraseña incorrectos." en role="alert"', async () => {
    servidorMock.use(
      http.post(URL_LOGIN, () =>
        HttpResponse.json(
          { status: 401, title: 'Unauthorized', detail: 'Credenciales inválidas.' },
          { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    );
    renderizarLogin();

    await completarYEnviar('mariela@nexaseguros.com.ar', 'incorrecta');

    expect(await screen.findByRole('alert')).toHaveTextContent('Email o contraseña incorrectos.');
    expect(screen.queryByText('Credenciales inválidas.')).not.toBeInTheDocument();
  });

  it('401 no redirige, vacía la contraseña, enfoca el email y no dispara onUnauthorized', async () => {
    servidorMock.use(
      http.post(URL_LOGIN, () =>
        HttpResponse.json(
          { status: 401, title: 'Unauthorized', detail: 'Credenciales inválidas.' },
          { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    );
    const onUnauthorized = vi.fn();
    renderizarLogin({ onUnauthorized });

    await completarYEnviar('mariela@nexaseguros.com.ar', 'incorrecta');

    await screen.findByRole('alert');
    expect(screen.getByTestId('ubicacion')).toHaveTextContent('/login');
    expect(screen.getByLabelText('Contraseña')).toHaveValue('');
    await waitFor(() => expect(screen.getByLabelText('Email')).toHaveFocus());
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('400 con errors.Email marca el campo con aria-invalid y aria-describedby', async () => {
    servidorMock.use(
      http.post(URL_LOGIN, () =>
        HttpResponse.json(
          {
            status: 400,
            title: 'Bad Request',
            errors: { Email: ['The Email field is not a valid e-mail address.'] },
          },
          { status: 400, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    );
    renderizarLogin();

    await completarYEnviar('mariela@nexaseguros.com.ar', 'secreto');

    const email = await screen.findByLabelText('Email');
    await waitFor(() => expect(email).toHaveAttribute('aria-invalid', 'true'));
    expect(email).toHaveAccessibleDescription('El email no tiene un formato válido.');
    expect(screen.queryByText(/is not a valid/)).not.toBeInTheDocument();
  });

  it('400 con clave desconocida no muestra el texto del back', async () => {
    servidorMock.use(
      http.post(URL_LOGIN, () =>
        HttpResponse.json(
          { status: 400, title: 'Bad Request', errors: { Otro: ['Texto en inglés del back.'] } },
          { status: 400, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    );
    renderizarLogin();

    await completarYEnviar('mariela@nexaseguros.com.ar', 'secreto');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos iniciar sesión. Probá de nuevo en unos minutos.',
    );
    expect(screen.queryByText('Texto en inglés del back.')).not.toBeInTheDocument();
  });

  it('500 muestra el mensaje genérico y no reintenta', async () => {
    let peticiones = 0;
    servidorMock.use(
      http.post(URL_LOGIN, () => {
        peticiones += 1;
        return HttpResponse.json({ status: 500, title: 'Error' }, { status: 500 });
      }),
    );
    renderizarLogin();

    await completarYEnviar('mariela@nexaseguros.com.ar', 'secreto');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos iniciar sesión. Probá de nuevo en unos minutos.',
    );
    expect(peticiones).toBe(1);
  });

  it('error de red muestra el mensaje genérico', async () => {
    servidorMock.use(http.post(URL_LOGIN, () => HttpResponse.error()));
    renderizarLogin();

    await completarYEnviar('mariela@nexaseguros.com.ar', 'secreto');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos iniciar sesión. Probá de nuevo en unos minutos.',
    );
  });

  it('durante el envío campos y botón están deshabilitados y no hay segundo POST', async () => {
    let peticiones = 0;
    let liberar: () => void = () => undefined;
    const espera = new Promise<void>((resolver) => {
      liberar = resolver;
    });
    servidorMock.use(
      http.post(URL_LOGIN, async () => {
        peticiones += 1;
        await espera;
        return HttpResponse.json(respuestaLogin());
      }),
    );
    renderizarLogin();

    const usuario = await completarYEnviar('mariela@nexaseguros.com.ar', 'secreto');

    const boton = await screen.findByRole('button', { name: 'Ingresar' });
    await waitFor(() => expect(boton).toBeDisabled());
    expect(boton).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByLabelText('Email')).toBeDisabled();
    expect(screen.getByLabelText('Contraseña')).toBeDisabled();
    await usuario.click(boton);
    liberar();

    await waitFor(() => expect(sesionActual()).not.toBeNull());
    expect(peticiones).toBe(1);
  });

  it('Enter en el campo contraseña envía el formulario', async () => {
    let peticiones = 0;
    servidorMock.use(
      http.post(URL_LOGIN, () => {
        peticiones += 1;
        return HttpResponse.json(respuestaLogin());
      }),
    );
    renderizarLogin();
    const usuario = userEvent.setup();

    await usuario.type(screen.getByLabelText('Email'), 'mariela@nexaseguros.com.ar');
    await usuario.type(screen.getByLabelText('Contraseña'), 'secreto{Enter}');

    await waitFor(() => expect(peticiones).toBe(1));
  });
});

describe('LoginPage: sesión y navegación', () => {
  it('ya autenticado se redirige a /inicio sin mostrar el formulario', async () => {
    servidorMock.use(http.post(URL_LOGIN, () => HttpResponse.json(respuestaLogin())));
    const primera = renderizarLogin();
    await completarYEnviar('mariela@nexaseguros.com.ar', 'secreto');
    await waitFor(() => expect(sesionActual()).not.toBeNull());
    primera.unmount();

    renderizarLogin();

    expect(screen.getByTestId('ubicacion')).toHaveTextContent('/inicio');
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
  });

  it('tras el login vuelve a la ruta de origen (state.desde) si es interna', async () => {
    servidorMock.use(http.post(URL_LOGIN, () => HttpResponse.json(respuestaLogin())));
    renderizarLogin({ entrada: { pathname: '/login', state: { desde: '/clientes' } } });

    await completarYEnviar('mariela@nexaseguros.com.ar', 'secreto');

    await waitFor(() => expect(screen.getByTestId('ubicacion')).toHaveTextContent('/clientes'));
  });

  it.each(['https://sitio-malicioso.example', '//sitio-malicioso.example', '/login'])(
    'ignora un state.desde no interno o que apunta al login (%s)',
    async (desde) => {
      servidorMock.use(http.post(URL_LOGIN, () => HttpResponse.json(respuestaLogin())));
      renderizarLogin({ entrada: { pathname: '/login', state: { desde } } });

      await completarYEnviar('mariela@nexaseguros.com.ar', 'secreto');

      await waitFor(() => expect(screen.getByTestId('ubicacion')).toHaveTextContent('/inicio'));
    },
  );

  it('con motivo sesionVencida muestra el banner', () => {
    renderizarLogin({ entrada: { pathname: '/login', state: { motivo: 'sesionVencida' } } });

    expect(screen.getByRole('alert')).toHaveTextContent('Tu sesión venció. Volvé a ingresar.');
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('sin motivo no muestra ninguna alerta', () => {
    renderizarLogin();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('LoginPage: accesibilidad', () => {
  it('no tiene violaciones de accesibilidad', async () => {
    const { container } = renderizarLogin();

    await expectSinViolacionesA11y(container);
  });

  it('no tiene violaciones de accesibilidad con errores de validación', async () => {
    const { container } = renderizarLogin();
    await completarYEnviar('', '');
    await screen.findByText('El email es obligatorio.');

    await expectSinViolacionesA11y(container);
  });
});
