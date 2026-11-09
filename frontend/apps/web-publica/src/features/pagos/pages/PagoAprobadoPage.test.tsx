import {
  ApiClientProvider,
  createApiClient,
  type EstadoPagoPublicoMock,
  type FacturaPublica,
} from '@nexa/api';
import { variantesPublico } from '@nexa/api/mocks/handlers/publico';
import { servidorMock } from '@nexa/api/mocks/server';
import { expectSinViolacionesA11y } from '@nexa/ui/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { TEXTO_FACTURA_EN_PROCESO } from '../components/NotaFacturaEnProceso';
import { PagoAprobadoPage } from './PagoAprobadoPage';

const BASE_URL = 'https://api.test';
const RUTA = '/pago/exito';
const URL_ESTADO = '*/api/publico/pagos/estado';
const URL_FACTURA = '*/api/publico/factura';
const CLAVE_NUMERO_PAGO = 'nexa.publico.numeroPago';
const NUMERO_PAGO = 'PAG-6f1c2a';

const NO_IDENTIFICADO = 'No pudimos identificar tu pago.';

const FACTURA_PENDIENTE: FacturaPublica = {
  id: 'f4000000-0000-0000-0000-000000000002',
  pagoId: 'f3000000-0000-0000-0000-000000000001',
  numero: '',
  tipo: 'B',
  importe: 51250,
  estado: 'PENDIENTE_CAE',
  cae: null,
  vencimientoCae: null,
  fechaEmision: '2026-10-28T17:32:00Z',
};

function estadoAprobado(parcial: Partial<EstadoPagoPublicoMock> = {}): EstadoPagoPublicoMock {
  return {
    numeroPago: NUMERO_PAGO,
    estado: 'APROBADO',
    fechaAcreditacion: '2026-10-28T17:32:00Z',
    urlPago: null,
    factura: null,
    ...parcial,
  };
}

function Sonda() {
  const { pathname } = useLocation();
  return <p data-testid="ruta">{pathname}</p>;
}

function renderizar() {
  const cliente = createApiClient({ baseUrl: BASE_URL });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <ApiClientProvider client={cliente}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[RUTA]}>
          <main>
            <Routes>
              <Route path={RUTA} element={<PagoAprobadoPage />} />
              <Route path="*" element={<Sonda />} />
            </Routes>
          </main>
        </MemoryRouter>
      </QueryClientProvider>
    </ApiClientProvider>,
  );
}

interface Pedido {
  url: string;
  body: unknown;
}

/** Registra cada request que llega a MSW (URL y body). */
function espiarPedidos() {
  const pedidos: Pedido[] = [];
  const escuchar = ({ request }: { request: Request }) => {
    const copia = request.clone();
    void copia.text().then((texto) => {
      pedidos.push({ url: request.url, body: texto ? (JSON.parse(texto) as unknown) : null });
    });
  };
  servidorMock.events.on('request:start', escuchar);
  return {
    pedidos,
    deRuta: (fragmento: string) => pedidos.filter((pedido) => pedido.url.includes(fragmento)),
    soltar: () => servidorMock.events.removeListener('request:start', escuchar),
  };
}

function usarEstado(respuesta: EstadoPagoPublicoMock) {
  servidorMock.use(http.post(URL_ESTADO, () => HttpResponse.json(respuesta)));
}

function usarFactura(respuesta: FacturaPublica) {
  servidorMock.use(http.post(URL_FACTURA, () => HttpResponse.json(respuesta)));
}

beforeAll(() => servidorMock.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  sessionStorage.clear();
  sessionStorage.setItem(CLAVE_NUMERO_PAGO, NUMERO_PAGO);
});
afterEach(() => {
  servidorMock.resetHandlers();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
afterAll(() => servidorMock.close());

describe('PagoAprobadoPage sin número de pago', () => {
  it('sin numeroPago muestra no identificado y no hace peticiones', async () => {
    sessionStorage.clear();
    const espia = espiarPedidos();
    renderizar();

    expect(await screen.findByRole('heading', { level: 1, name: NO_IDENTIFICADO })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Consultar póliza' })).toHaveAttribute(
      'href',
      '/consultar-poliza',
    );
    await act(() => new Promise((resolver) => setTimeout(resolver, 50)));
    expect(espia.pedidos).toHaveLength(0);
    espia.soltar();
  });

  it('sessionStorage que lanza muestra no identificado', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    renderizar();

    expect(await screen.findByRole('heading', { level: 1, name: NO_IDENTIFICADO })).toBeVisible();
  });
});

describe('PagoAprobadoPage aprobado', () => {
  it('con numeroPago APROBADO muestra Pago aprobado', async () => {
    usarEstado(estadoAprobado());
    renderizar();

    const titulo = await screen.findByRole('heading', { level: 1, name: 'Pago aprobado' });
    expect(titulo.closest('[role="status"]')).not.toBeNull();
    expect(screen.getByText('Tu pago está registrado.')).toBeVisible();
  });

  it('el foco va al h1 al montar', async () => {
    usarEstado(estadoAprobado());
    renderizar();

    const titulo = await screen.findByRole('heading', { level: 1, name: 'Pago aprobado' });
    expect(titulo).toHaveFocus();
  });

  it('manda solo el numeroPago, sin DNI (DB-W8-1 opción A)', async () => {
    usarEstado(estadoAprobado());
    const espia = espiarPedidos();
    renderizar();

    await screen.findByRole('heading', { level: 1, name: 'Pago aprobado' });
    await waitFor(() => expect(espia.deRuta('/factura')).toHaveLength(1));
    expect(espia.deRuta('/pagos/estado')[0]?.body).toEqual({ numeroPago: NUMERO_PAGO });
    expect(espia.deRuta('/factura')[0]?.body).toEqual({ numeroPago: NUMERO_PAGO });
    espia.soltar();
  });

  it('muestra el número de operación del back', async () => {
    usarEstado(estadoAprobado());
    renderizar();

    await screen.findByRole('heading', { level: 1, name: 'Pago aprobado' });
    const etiqueta = screen.getByText('Número de operación');
    expect(etiqueta.tagName).toBe('DT');
    expect(screen.getByText(NUMERO_PAGO).tagName).toBe('DD');
  });

  it('fecha con hora de Buenos Aires', async () => {
    usarEstado(estadoAprobado({ fechaAcreditacion: '2026-10-28T17:32:00Z' }));
    renderizar();

    await screen.findByRole('heading', { level: 1, name: 'Pago aprobado' });
    expect(screen.getByText('Fecha')).toBeVisible();
    expect(screen.getByText('28/10/2026 14:32')).toBeVisible();
  });

  it('sin fechaAcreditacion no muestra la fila de fecha', async () => {
    usarEstado(estadoAprobado({ fechaAcreditacion: null }));
    renderizar();

    await screen.findByRole('heading', { level: 1, name: 'Pago aprobado' });
    expect(screen.queryByText('Fecha')).not.toBeInTheDocument();
  });

  it('no muestra Total pagado ni Cuotas por defecto', async () => {
    usarEstado(estadoAprobado());
    renderizar();

    await screen.findByRole('heading', { level: 1, name: 'Pago aprobado' });
    expect(screen.queryByText('Total pagado')).not.toBeInTheDocument();
    expect(screen.queryByText('Cuotas')).not.toBeInTheDocument();
  });

  it('no hay botón de descarga', async () => {
    usarEstado(estadoAprobado());
    renderizar();

    await screen.findByRole('heading', { level: 1, name: 'Pago aprobado' });
    expect(screen.queryByText('Descargar comprobante')).not.toBeInTheDocument();
  });

  it('"Volver a mi póliza" lleva a la consulta (DN-W8-4)', async () => {
    usarEstado(estadoAprobado());
    const usuario = userEvent.setup();
    renderizar();

    await usuario.click(await screen.findByRole('link', { name: 'Volver a mi póliza' }));
    expect(screen.getByTestId('ruta')).toHaveTextContent('/consultar-poliza');
  });
});

describe('PagoAprobadoPage factura', () => {
  it('factura PENDIENTE_CAE muestra la nota literal', async () => {
    usarEstado(estadoAprobado());
    usarFactura(FACTURA_PENDIENTE);
    renderizar();

    expect(await screen.findByText(TEXTO_FACTURA_EN_PROCESO)).toBeVisible();
    expect(screen.queryByText(/Te la enviamos por email/)).not.toBeInTheDocument();
  });

  it('factura AUTORIZADA oculta la nota', async () => {
    usarEstado(estadoAprobado());
    const espia = espiarPedidos();
    renderizar();

    await screen.findByRole('heading', { level: 1, name: 'Pago aprobado' });
    await waitFor(() => expect(espia.deRuta('/factura')).toHaveLength(1));
    await act(() => new Promise((resolver) => setTimeout(resolver, 20)));
    expect(screen.queryByText(TEXTO_FACTURA_EN_PROCESO)).not.toBeInTheDocument();
    espia.soltar();
  });

  it('factura 404 oculta la nota sin error', async () => {
    usarEstado(estadoAprobado());
    servidorMock.use(variantesPublico.facturaNoEncontrada);
    const espia = espiarPedidos();
    renderizar();

    await screen.findByRole('heading', { level: 1, name: 'Pago aprobado' });
    await waitFor(() => expect(espia.deRuta('/factura')).toHaveLength(1));
    await act(() => new Promise((resolver) => setTimeout(resolver, 20)));
    expect(screen.queryByText(TEXTO_FACTURA_EN_PROCESO)).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Pago aprobado' })).toBeVisible();
    espia.soltar();
  });

  it('no pide factura si el pago no está aprobado', async () => {
    servidorMock.use(variantesPublico.estadoPendiente);
    const espia = espiarPedidos();
    renderizar();

    await screen.findByRole('heading', { level: 1, name: 'Verificando el pago' });
    await act(() => new Promise((resolver) => setTimeout(resolver, 50)));
    expect(espia.deRuta('/factura')).toHaveLength(0);
    espia.soltar();
  });
});

describe('PagoAprobadoPage otros estados', () => {
  it('PENDIENTE muestra verificando y no hace polling', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    servidorMock.use(variantesPublico.estadoPendiente);
    const espia = espiarPedidos();
    renderizar();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Verificando el pago' }),
    ).toBeVisible();
    expect(
      screen.getByText(
        'Todavía no recibimos la confirmación de la pasarela. Podés volver a consultar en unos minutos.',
      ),
    ).toBeVisible();
    await act(() => vi.advanceTimersByTimeAsync(5000));
    expect(espia.deRuta('/pagos/estado')).toHaveLength(1);
    espia.soltar();
  });

  it('"Volver a consultar" vuelve a pedir el estado por clic', async () => {
    servidorMock.use(variantesPublico.estadoPendiente);
    const usuario = userEvent.setup();
    const espia = espiarPedidos();
    renderizar();

    await screen.findByRole('heading', { level: 1, name: 'Verificando el pago' });
    usarEstado(estadoAprobado());
    await usuario.click(screen.getByRole('button', { name: 'Volver a consultar' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Pago aprobado' })).toHaveFocus();
    expect(espia.deRuta('/pagos/estado')).toHaveLength(2);
    espia.soltar();
  });

  it('RECHAZADO muestra el mensaje propuesto', async () => {
    servidorMock.use(variantesPublico.estadoRechazado);
    renderizar();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'El pago no se pudo confirmar.' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Consultar póliza' })).toHaveAttribute(
      'href',
      '/consultar-poliza',
    );
  });

  it('estado 404 muestra no identificado', async () => {
    servidorMock.use(variantesPublico.estadoNoEncontrado);
    renderizar();

    expect(await screen.findByRole('heading', { level: 1, name: NO_IDENTIFICADO })).toBeVisible();
  });

  it('estado 429 muestra el texto fijo sin reintento', async () => {
    servidorMock.use(variantesPublico.estado429);
    const espia = espiarPedidos();
    renderizar();

    expect(
      await screen.findByText('Hiciste muchos intentos. Esperá un minuto y volvé a probar.'),
    ).toBeVisible();
    await act(() => new Promise((resolver) => setTimeout(resolver, 50)));
    expect(espia.deRuta('/pagos/estado')).toHaveLength(1);
    espia.soltar();
  });

  it('error de red muestra el texto genérico y permite volver a consultar', async () => {
    servidorMock.use(http.post(URL_ESTADO, () => HttpResponse.error()));
    renderizar();

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'No pudimos consultar el estado del pago.',
      }),
    ).toBeVisible();
    expect(screen.getByText('Intentá de nuevo en unos minutos.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Volver a consultar' })).toBeEnabled();
  });

  it('mientras carga anuncia la consulta', async () => {
    usarEstado(estadoAprobado());
    renderizar();

    expect(screen.getByRole('status')).toHaveTextContent('Consultando el estado del pago…');
    await screen.findByRole('heading', { level: 1, name: 'Pago aprobado' });
  });
});

describe('PagoAprobadoPage storage y accesibilidad', () => {
  it('no escribe en storage', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem');
    usarEstado(estadoAprobado());
    usarFactura(FACTURA_PENDIENTE);
    renderizar();

    await screen.findByText(TEXTO_FACTURA_EN_PROCESO);
    expect(setItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
  });

  it('no tiene violaciones de accesibilidad (aprobado con nota)', async () => {
    usarEstado(estadoAprobado());
    usarFactura(FACTURA_PENDIENTE);
    const { container } = renderizar();

    await screen.findByText(TEXTO_FACTURA_EN_PROCESO);
    const tarjeta = screen.getByRole('region', { name: 'Pago aprobado' });
    expect(within(tarjeta).getByRole('link', { name: 'Volver a mi póliza' })).toBeVisible();
    await expectSinViolacionesA11y(container);
  });

  it('no tiene violaciones de accesibilidad (verificando)', async () => {
    servidorMock.use(variantesPublico.estadoPendiente);
    const { container } = renderizar();

    await screen.findByRole('heading', { level: 1, name: 'Verificando el pago' });
    await expectSinViolacionesA11y(container);
  });
});
