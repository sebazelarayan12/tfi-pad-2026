import { ApiClientProvider, createApiClient, type CambiarPasswordRequest } from '@nexa/api';
import { servidorMock } from '@nexa/api/mocks/server';
import { Toaster } from '@nexa/ui';
import { expectSinViolacionesA11y } from '@nexa/ui/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cerrarSesion, iniciarSesion, sesionActual } from '../sesion/store';
import { CambiarPasswordPage } from './CambiarPasswordPage';

const URL_CAMBIO = '*/api/auth/cambiar-password';
// Contraseñas ficticias solo para estos tests.
const TEMPORAL = 'Temporal-Ficticia-1';
const NUEVA = 'Definitiva-Ficticia-2';

function problema(status: number, cuerpo: Record<string, unknown>) {
  return HttpResponse.json(
    { status, title: 'Error', ...cuerpo },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  );
}

function respuestaOk() {
  return HttpResponse.json({
    token: 'token',
    rol: 'Empleado',
    expiraEn: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    debeCambiarPassword: false,
  });
}

function capturarCambio(respuesta?: () => Response | Promise<Response>) {
  const capturas: CambiarPasswordRequest[] = [];
  servidorMock.use(
    http.post(URL_CAMBIO, async ({ request }) => {
      capturas.push((await request.json()) as CambiarPasswordRequest);
      return respuesta?.() ?? respuestaOk();
    }),
  );
  return capturas;
}

function Ubicacion() {
  const ubicacion = useLocation();
  return <p data-testid="ubicacion">{ubicacion.pathname}</p>;
}

function montar() {
  const usuario = userEvent.setup();
  const cliente = createApiClient({ baseUrl: 'https://api.test' });
  const vista = render(
    <QueryClientProvider client={new QueryClient()}>
      <ApiClientProvider client={cliente}>
        <MemoryRouter initialEntries={['/cambiar-password']}>
          <Routes>
            <Route path="/cambiar-password" element={<CambiarPasswordPage />} />
            <Route path="/inicio" element={<p>Pantalla de inicio</p>} />
            <Route path="/login" element={<p>Pantalla de login</p>} />
          </Routes>
          <Ubicacion />
        </MemoryRouter>
        <Toaster />
      </ApiClientProvider>
    </QueryClientProvider>,
  );
  return { usuario, ...vista };
}

const campo = (nombre: string) => screen.getByLabelText(nombre) as HTMLInputElement;
const enviar = () => screen.getByRole('button', { name: /Cambiar contraseña|Cambiando contraseña/ });

async function completar(usuario: ReturnType<typeof userEvent.setup>, nueva = NUEVA) {
  await usuario.type(campo('Contraseña temporal'), TEMPORAL);
  await usuario.type(campo('Contraseña nueva'), nueva);
  await usuario.type(campo('Repetir contraseña nueva'), nueva);
}

beforeEach(() => {
  iniciarSesion({
    token: 'token',
    rol: 'Empleado',
    expiraEn: new Date(Date.now() + 60_000).toISOString(),
    debeCambiarPassword: true,
  });
});

afterEach(() => {
  cerrarSesion('manual');
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe('CambiarPasswordPage', () => {
  it('muestra_textos_y_foco_inicial', async () => {
    montar();
    expect(screen.getByRole('heading', { name: 'Cambiá tu contraseña' })).toBeInTheDocument();
    expect(screen.getByText('Es tu primer ingreso. Elegí una contraseña nueva para seguir.')).toBeInTheDocument();
    ['Contraseña temporal', 'Contraseña nueva', 'Repetir contraseña nueva'].forEach((etiqueta) =>
      expect(campo(etiqueta)).toBeInTheDocument(),
    );
    expect(screen.getByText(/Al menos 12 caracteres/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
    await waitFor(() => expect(campo('Contraseña temporal')).toHaveFocus());
  });

  it('envio_vacio_muestra_errores_y_no_llama_a_la_api', async () => {
    const capturas = capturarCambio();
    const { usuario } = montar();
    await usuario.click(enviar());
    expect(await screen.findByText('Ingresá la contraseña temporal.')).toBeInTheDocument();
    expect(capturas).toHaveLength(0);
  });

  it('envia_el_body_con_actual_y_nueva', async () => {
    const capturas = capturarCambio();
    const { usuario } = montar();
    await completar(usuario);
    await usuario.click(enviar());
    await waitFor(() => expect(capturas).toHaveLength(1));
    expect(capturas[0]).toEqual({ passwordActual: TEMPORAL, passwordNueva: NUEVA });
  });

  it('200_reemplaza_la_sesion_y_navega_a_inicio', async () => {
    capturarCambio();
    const { usuario } = montar();
    await completar(usuario);
    await usuario.click(enviar());
    expect(await screen.findByText('Pantalla de inicio')).toBeInTheDocument();
    expect(sesionActual()?.debeCambiarPassword).toBe(false);
  });

  it('400_actual_incorrecta_muestra_toast_y_no_cierra_sesion', async () => {
    capturarCambio(() => problema(400, { detail: 'La contraseña actual es incorrecta.' }));
    const { usuario } = montar();
    await completar(usuario);
    await usuario.click(enviar());
    expect(await screen.findByText('La contraseña actual es incorrecta.')).toBeInTheDocument();
    expect(sesionActual()).not.toBeNull();
    expect(screen.getByTestId('ubicacion')).toHaveTextContent('/cambiar-password');
    await waitFor(() => expect(campo('Contraseña temporal')).toHaveFocus());
  });

  it('400_politica_rechazada_muestra_el_texto_del_back', async () => {
    const texto = 'La contraseña debe incluir al menos un carácter no alfanumérico.';
    capturarCambio(() => problema(400, { detail: texto }));
    const { usuario } = montar();
    await completar(usuario);
    await usuario.click(enviar());
    expect(await screen.findByText(texto)).toBeInTheDocument();
  });

  it('400_errors_muestra_texto_en_espanol', async () => {
    capturarCambio(() => problema(400, { errors: { PasswordNueva: ['Password is too weak.'] } }));
    const { usuario } = montar();
    await completar(usuario);
    await usuario.click(enviar());
    expect(await screen.findByText('Revisá la contraseña nueva.')).toBeInTheDocument();
    expect(screen.queryByText('Password is too weak.')).not.toBeInTheDocument();
    expect(campo('Contraseña nueva')).toHaveAttribute('aria-invalid', 'true');
  });

  it('403_muestra_texto_propio', async () => {
    capturarCambio(() => new HttpResponse(null, { status: 403 }));
    const { usuario } = montar();
    await completar(usuario);
    await usuario.click(enviar());
    expect(await screen.findByText('No tenés permiso para cambiar la contraseña.')).toBeInTheDocument();
  });

  it('error_de_red_muestra_mensaje_y_no_reenvia', async () => {
    const capturas: unknown[] = [];
    servidorMock.use(
      http.post(URL_CAMBIO, () => {
        capturas.push(1);
        return HttpResponse.error();
      }),
    );
    const { usuario } = montar();
    await completar(usuario);
    await usuario.click(enviar());
    expect(
      await screen.findByText('No pudimos cambiar la contraseña. Revisá tu conexión e intentá de nuevo.'),
    ).toBeInTheDocument();
    expect(capturas).toHaveLength(1);
  });

  it('doble_clic_envia_un_post', async () => {
    const capturas = capturarCambio(async () => {
      await delay(50);
      return respuestaOk();
    });
    const { usuario } = montar();
    await completar(usuario);
    await usuario.dblClick(enviar());
    await screen.findByText('Pantalla de inicio');
    expect(capturas).toHaveLength(1);
  });

  it('nueva_igual_a_la_temporal_no_se_envia', async () => {
    const capturas = capturarCambio();
    const { usuario } = montar();
    await usuario.type(campo('Contraseña temporal'), NUEVA);
    await usuario.type(campo('Contraseña nueva'), NUEVA);
    await usuario.type(campo('Repetir contraseña nueva'), NUEVA);
    await usuario.click(enviar());
    expect(
      await screen.findByText('La contraseña nueva debe ser distinta de la temporal.'),
    ).toBeInTheDocument();
    expect(capturas).toHaveLength(0);
  });

  it('mostrar_ocultar_cambia_type_y_aria_label', async () => {
    const { usuario } = montar();
    expect(campo('Contraseña nueva')).toHaveAttribute('type', 'password');
    await usuario.click(screen.getAllByRole('button', { name: 'Mostrar contraseña' })[1] as HTMLElement);
    expect(campo('Contraseña nueva')).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toBeInTheDocument();
  });

  it('cerrar_sesion_va_a_login', async () => {
    const { usuario } = montar();
    await usuario.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(await screen.findByText('Pantalla de login')).toBeInTheDocument();
    expect(sesionActual()).toBeNull();
  });

  it('las_passwords_no_se_guardan_en_storage', async () => {
    capturarCambio();
    const sesionSpy = vi.spyOn(Storage.prototype, 'setItem');
    const { usuario } = montar();
    await completar(usuario);
    await usuario.click(enviar());
    await screen.findByText('Pantalla de inicio');
    sesionSpy.mock.calls.forEach(([, valor]) => {
      expect(String(valor)).not.toContain(TEMPORAL);
      expect(String(valor)).not.toContain(NUEVA);
    });
  });

  it('a11y_sin_violaciones', async () => {
    const { container } = montar();
    await expectSinViolacionesA11y(container);
  });
});
