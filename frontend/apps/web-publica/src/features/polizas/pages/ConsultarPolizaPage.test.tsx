import { ApiClientProvider, createApiClient, type ConsultaPublicaResponse } from '@nexa/api';
import { problemaRateLimit } from '@nexa/api/mocks/fixtures/comunes';
import { variantesPublico } from '@nexa/api/mocks/handlers/publico';
import { servidorMock } from '@nexa/api/mocks/server';
import { expectSinViolacionesA11y } from '@nexa/ui/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { ConsultarPolizaPage } from './ConsultarPolizaPage';

const BASE_URL = 'https://api.test';
const URL_CONSULTA = '*/api/publico/consulta';

const CONSULTA: ConsultaPublicaResponse = {
  numeroPoliza: 'POL-0000001',
  estado: 'VIGENTE',
  coberturaVigente: true,
  vigenteDesde: '2026-10-15',
  vigenteHasta: '2027-04-15',
  plan: { codigo: 'RC', nombre: 'Responsabilidad Civil' },
  vehiculo: { patente: 'AB123CD', marca: 'Toyota', modelo: 'Corolla XEi', anio: 2021 },
  cuotas: [
    {
      idCuota: 'f1000000-0000-0000-0000-000000000001',
      numero: 1,
      importe: 12000,
      recargo: 0,
      total: 12000,
      vencimiento: '2026-11-10',
      estado: 'PAGADA',
    },
    {
      idCuota: 'f1000000-0000-0000-0000-000000000002',
      numero: 2,
      importe: 12000,
      recargo: 0,
      total: 12000,
      vencimiento: '2026-12-10',
      estado: 'PENDIENTE',
    },
    {
      idCuota: 'f1000000-0000-0000-0000-000000000003',
      numero: 3,
      importe: 12000,
      recargo: 0,
      total: 12000,
      vencimiento: '2027-01-10',
      estado: 'PENDIENTE',
    },
  ],
};

function SondaPoliza() {
  const ubicacion = useLocation();
  return (
    <>
      <p data-testid="ruta">{`${ubicacion.pathname}${ubicacion.search}`}</p>
      <pre data-testid="estado">{JSON.stringify(ubicacion.state ?? null)}</pre>
    </>
  );
}

interface OpcionesRender {
  retryMutaciones?: number;
}

function renderizar({ retryMutaciones = 0 }: OpcionesRender = {}) {
  const cliente = createApiClient({ baseUrl: BASE_URL });
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: retryMutaciones, retryDelay: 0 },
      queries: { retry: false },
    },
  });

  return render(
    <ApiClientProvider client={cliente}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/consultar-poliza']}>
          <main>
            <Routes>
              <Route path="/consultar-poliza" element={<ConsultarPolizaPage />} />
              <Route path="/poliza" element={<SondaPoliza />} />
            </Routes>
          </main>
        </MemoryRouter>
      </QueryClientProvider>
    </ApiClientProvider>,
  );
}

async function completarYEnviar(dni = '30123456', numeroPoliza = 'POL-0000001') {
  const usuario = userEvent.setup();
  if (dni) await usuario.type(screen.getByLabelText('DNI'), dni);
  if (numeroPoliza) await usuario.type(screen.getByLabelText('Número de póliza'), numeroPoliza);
  await usuario.click(screen.getByRole('button', { name: 'Consultar' }));
  return usuario;
}

function estadoNavegado(): unknown {
  const texto = screen.getByTestId('estado').textContent ?? 'null';
  return JSON.parse(texto) as unknown;
}

beforeAll(() => servidorMock.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  servidorMock.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => servidorMock.close());

describe('ConsultarPolizaPage: formulario', () => {
  it('muestra los textos de la ficha y un único h1', () => {
    renderizar();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Consultá tu póliza' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Ingresá tu DNI y el número de póliza para ver su estado y pagar sus cuotas.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('DNI')).toHaveAttribute('placeholder', '30123456');
    expect(screen.getByLabelText('Número de póliza')).toHaveAttribute('placeholder', 'POL-0000042');
    expect(screen.getByRole('button', { name: 'Consultar' })).toBeEnabled();
    expect(
      screen.getByText('Tus datos viajan cifrados y no se guardan en este dispositivo.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('asocia las ayudas con aria-describedby', () => {
    renderizar();

    expect(screen.getByLabelText('DNI')).toHaveAccessibleDescription('Sin puntos ni espacios.');
    expect(screen.getByLabelText('Número de póliza')).toHaveAccessibleDescription(
      'Los datos figuran en tu póliza.',
    );
  });

  it('un DNI vacío muestra "Ingresá tu DNI." y no llama a la API', async () => {
    const solicitudes = vi.fn();
    servidorMock.events.on('request:start', solicitudes);
    renderizar();

    await completarYEnviar('', 'POL-0000001');

    expect(await screen.findByText('Ingresá tu DNI.')).toBeInTheDocument();
    expect(screen.getByLabelText('DNI')).toHaveAttribute('aria-invalid', 'true');
    expect(solicitudes).not.toHaveBeenCalled();
    servidorMock.events.removeListener('request:start', solicitudes);
  });

  it('un DNI de menos de 8 dígitos muestra el mensaje del back', async () => {
    renderizar();

    await completarYEnviar('1234');

    expect(await screen.findByText('El DNI debe tener 8 dígitos.')).toBeInTheDocument();
    expect(screen.getByLabelText('DNI')).toHaveAttribute('aria-invalid', 'true');
  });

  it('una póliza sin formato muestra el mensaje del back', async () => {
    renderizar();

    await completarYEnviar('30123456', 'POL-42');

    expect(
      await screen.findByText('El número de póliza debe tener el formato POL-0000000.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Número de póliza')).toHaveAttribute('aria-invalid', 'true');
  });

  it('enfoca el primer campo inválido', async () => {
    renderizar();

    await completarYEnviar('', '');

    await waitFor(() => expect(screen.getByLabelText('DNI')).toHaveFocus());
  });
});

describe('ConsultarPolizaPage: envío', () => {
  it('envía el body con el DNI y la póliza normalizada a mayúsculas', async () => {
    let cuerpo: unknown;
    servidorMock.use(
      http.post(URL_CONSULTA, async ({ request }) => {
        cuerpo = await request.json();
        return HttpResponse.json(CONSULTA);
      }),
    );
    renderizar();

    await completarYEnviar('30123456', 'pol-0000042');

    expect(cuerpo).toEqual({ dni: '30123456', numeroPoliza: 'POL-0000042' });
  });

  it('un 200 navega a /poliza con el estado de navegación', async () => {
    renderizar();

    await completarYEnviar();

    await waitFor(() => expect(screen.getByTestId('ruta')).toHaveTextContent('/poliza'));
    expect(screen.getByTestId('ruta')).toHaveTextContent(/^\/poliza$/);
    expect(estadoNavegado()).toMatchObject({
      dni: '30123456',
      numeroPoliza: 'POL-0000001',
      consulta: { numeroPoliza: 'POL-0000001', estado: 'VIGENTE' },
    });
  });

  it('un 404 muestra el texto del Figma y no el detail del back', async () => {
    servidorMock.use(variantesPublico.consultaNoEncontrada);
    renderizar();

    await completarYEnviar();

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent(
      'No encontramos una póliza con esos datos. Revisá el DNI y el número de póliza.',
    );
    expect(alerta).toHaveClass('bg-status-cancelada-bg');
    expect(
      screen.queryByText('No se encontró un registro con los datos indicados.'),
    ).not.toBeInTheDocument();
  });

  it('un 429 muestra la alerta de aviso y no reintenta', async () => {
    let llamadas = 0;
    servidorMock.use(
      http.post(URL_CONSULTA, () => {
        llamadas += 1;
        return HttpResponse.json(problemaRateLimit(), {
          status: 429,
          headers: { 'Content-Type': 'application/problem+json' },
        });
      }),
    );
    renderizar({ retryMutaciones: 3 });

    await completarYEnviar();

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('Hiciste muchos intentos. Esperá un minuto y volvé a probar.');
    expect(alerta).toHaveClass('bg-status-suspendida-bg');
    await waitFor(() => expect(llamadas).toBe(1));
    await new Promise((resolver) => setTimeout(resolver, 50));
    expect(llamadas).toBe(1);
  });

  it('un 400 con errors.Dni marca el campo DNI', async () => {
    servidorMock.use(variantesPublico.consultaDniInvalido);
    renderizar();

    await completarYEnviar();

    expect(await screen.findByText('El DNI debe tener 8 dígitos.')).toBeInTheDocument();
    expect(screen.getByLabelText('DNI')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('un 400 con errors.NumeroPoliza marca el campo de la póliza', async () => {
    servidorMock.use(variantesPublico.consultaNumeroInvalido);
    renderizar();

    await completarYEnviar();

    expect(
      await screen.findByText('El número de póliza debe tener el formato POL-0000000.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Número de póliza')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('un 500 muestra el mensaje genérico', async () => {
    servidorMock.use(variantesPublico.sinCuerpoEnTransporte);
    renderizar();

    await completarYEnviar();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos consultar tu póliza. Intentá de nuevo en unos minutos.',
    );
  });

  it('deshabilita el botón mientras envía y un doble clic envía una sola petición', async () => {
    let llamadas = 0;
    let liberar = () => {};
    const espera = new Promise<void>((resolver) => {
      liberar = resolver;
    });
    servidorMock.use(
      http.post(URL_CONSULTA, async () => {
        llamadas += 1;
        await espera;
        return HttpResponse.json(CONSULTA);
      }),
    );
    const { container } = renderizar();
    const usuario = userEvent.setup();
    await usuario.type(screen.getByLabelText('DNI'), '30123456');
    await usuario.type(screen.getByLabelText('Número de póliza'), 'POL-0000001');

    await usuario.click(screen.getByRole('button', { name: 'Consultar' }));
    const enCurso = await screen.findByRole('button', { name: 'Consultando…' });
    expect(enCurso).toBeDisabled();
    expect(container.querySelector('form')).toHaveAttribute('aria-busy', 'true');
    await usuario.click(enCurso);

    expect(llamadas).toBe(1);
    liberar();
    await waitFor(() => expect(screen.getByTestId('ruta')).toHaveTextContent('/poliza'));
  });

  it('no escribe datos del cliente en storage, cookies ni en la URL', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const cookie = vi.spyOn(document, 'cookie', 'set');
    renderizar();

    await completarYEnviar();
    await waitFor(() => expect(screen.getByTestId('ruta')).toHaveTextContent('/poliza'));

    expect(setItem).not.toHaveBeenCalled();
    expect(cookie).not.toHaveBeenCalled();
    expect(screen.getByTestId('ruta')).toHaveTextContent(/^\/poliza$/);
    expect(screen.getByTestId('ruta').textContent).not.toContain('30123456');
  });
});

describe('ConsultarPolizaPage: accesibilidad', () => {
  it('no tiene violaciones de accesibilidad con una alerta visible', async () => {
    servidorMock.use(variantesPublico.consultaNoEncontrada);
    const { container } = renderizar();

    await completarYEnviar();
    await screen.findByRole('alert');

    await expectSinViolacionesA11y(container);
  });
});
