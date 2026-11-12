import {
  ApiClientProvider,
  createApiClient,
  type EstadoPagoPublico,
  type FacturaPublica,
} from '@nexa/api';
import { variantesPublico } from '@nexa/api/mocks/handlers/publico';
import { servidorMock } from '@nexa/api/mocks/server';
import { expectSinViolacionesA11y } from '@nexa/ui/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
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

const DNI = '30123456';
const URL_PADI = 'https://padi.example/checkout/tok123';

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

function estadoAprobado(parcial: Partial<EstadoPagoPublico> = {}): EstadoPagoPublico {
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

function renderizar(state?: unknown) {
  const cliente = createApiClient({ baseUrl: BASE_URL });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <ApiClientProvider client={cliente}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[{ pathname: RUTA, state }]}>
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

/** Vuelta desde otra pasarela: el número sale de `sessionStorage` y el DNI se carga en pantalla. */
async function renderizarYVerificar() {
  const resultado = renderizar();
  const usuario = userEvent.setup();
  await usuario.type(await screen.findByLabelText('DNI'), DNI);
  await usuario.click(screen.getByRole('button', { name: 'Verificar pago' }));
  return resultado;
}

/** Estado que deja W4 al pagar con PADI (pestaña nueva). */
function estadoPadi() {
  return { numeroPago: NUMERO_PAGO, dni: DNI, urlPago: URL_PADI, medio: 'padi' };
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

function usarEstado(respuesta: EstadoPagoPublico) {
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
    await renderizarYVerificar();

    const titulo = await screen.findByRole('heading', { level: 1, name: 'Pago aprobado' });
    expect(titulo.closest('[role="status"]')).not.toBeNull();
    expect(screen.getByText('Tu pago está registrado.')).toBeVisible();
  });

  it('el foco va al h1 al montar', async () => {
    usarEstado(estadoAprobado());
    await renderizarYVerificar();

    const titulo = await screen.findByRole('heading', { level: 1, name: 'Pago aprobado' });
    expect(titulo).toHaveFocus();
  });

  it('manda número de pago + DNI a estado y factura (RV-D17)', async () => {
    usarEstado(estadoAprobado());
    const espia = espiarPedidos();
    await renderizarYVerificar();

    await screen.findByRole('heading', { level: 1, name: 'Pago aprobado' });
    await waitFor(() => expect(espia.deRuta('/factura')).toHaveLength(1));
    expect(espia.deRuta('/pagos/estado')[0]?.body).toEqual({ numeroPago: NUMERO_PAGO, dni: DNI });
    expect(espia.deRuta('/factura')[0]?.body).toEqual({ numeroPago: NUMERO_PAGO, dni: DNI });
    espia.soltar();
  });

  it('muestra el número de operación del back', async () => {
    usarEstado(estadoAprobado());
    await renderizarYVerificar();

    await screen.findByRole('heading', { level: 1, name: 'Pago aprobado' });
    const etiqueta = screen.getByText('Número de operación');
    expect(etiqueta.tagName).toBe('DT');
    expect(screen.getByText(NUMERO_PAGO).tagName).toBe('DD');
  });

  it('fecha con hora de Buenos Aires', async () => {
    usarEstado(estadoAprobado({ fechaAcreditacion: '2026-10-28T17:32:00Z' }));
    await renderizarYVerificar();

    await screen.findByRole('heading', { level: 1, name: 'Pago aprobado' });
    expect(screen.getByText('Fecha')).toBeVisible();
    expect(screen.getByText('28/10/2026 14:32')).toBeVisible();
  });

  it('sin fechaAcreditacion no muestra la fila de fecha', async () => {
    usarEstado(estadoAprobado({ fechaAcreditacion: null }));
    await renderizarYVerificar();

    await screen.findByRole('heading', { level: 1, name: 'Pago aprobado' });
    expect(screen.queryByText('Fecha')).not.toBeInTheDocument();
  });

  it('no muestra Total pagado ni Cuotas por defecto', async () => {
    usarEstado(estadoAprobado());
    await renderizarYVerificar();

    await screen.findByRole('heading', { level: 1, name: 'Pago aprobado' });
    expect(screen.queryByText('Total pagado')).not.toBeInTheDocument();
    expect(screen.queryByText('Cuotas')).not.toBeInTheDocument();
  });

  it('no hay botón de descarga', async () => {
    usarEstado(estadoAprobado());
    await renderizarYVerificar();

    await screen.findByRole('heading', { level: 1, name: 'Pago aprobado' });
    expect(screen.queryByText('Descargar comprobante')).not.toBeInTheDocument();
  });

  it('"Volver a mi póliza" lleva a la consulta (DN-W8-4)', async () => {
    usarEstado(estadoAprobado());
    const usuario = userEvent.setup();
    await renderizarYVerificar();

    await usuario.click(await screen.findByRole('link', { name: 'Volver a mi póliza' }));
    expect(screen.getByTestId('ruta')).toHaveTextContent('/consultar-poliza');
  });
});

describe('PagoAprobadoPage factura', () => {
  it('factura PENDIENTE_CAE muestra la nota literal', async () => {
    usarEstado(estadoAprobado());
    usarFactura(FACTURA_PENDIENTE);
    await renderizarYVerificar();

    expect(await screen.findByText(TEXTO_FACTURA_EN_PROCESO)).toBeVisible();
    expect(screen.queryByText(/Te la enviamos por email/)).not.toBeInTheDocument();
  });

  it('factura AUTORIZADA oculta la nota', async () => {
    usarEstado(estadoAprobado());
    const espia = espiarPedidos();
    await renderizarYVerificar();

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
    await renderizarYVerificar();

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
    await renderizarYVerificar();

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
    await renderizarYVerificar();

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
    await renderizarYVerificar();

    await screen.findByRole('heading', { level: 1, name: 'Verificando el pago' });
    usarEstado(estadoAprobado());
    await usuario.click(screen.getByRole('button', { name: 'Volver a consultar' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Pago aprobado' })).toHaveFocus();
    expect(espia.deRuta('/pagos/estado')).toHaveLength(2);
    espia.soltar();
  });

  it('RECHAZADO muestra el mensaje propuesto', async () => {
    servidorMock.use(variantesPublico.estadoRechazado);
    await renderizarYVerificar();

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
    await renderizarYVerificar();

    expect(await screen.findByRole('heading', { level: 1, name: NO_IDENTIFICADO })).toBeVisible();
  });

  it('estado 429 muestra el texto fijo sin reintento', async () => {
    servidorMock.use(variantesPublico.estado429);
    const espia = espiarPedidos();
    await renderizarYVerificar();

    expect(
      await screen.findByText('Hiciste muchos intentos. Esperá un minuto y volvé a probar.'),
    ).toBeVisible();
    await act(() => new Promise((resolver) => setTimeout(resolver, 50)));
    expect(espia.deRuta('/pagos/estado')).toHaveLength(1);
    espia.soltar();
  });

  it('error de red muestra el texto genérico y permite volver a consultar', async () => {
    servidorMock.use(http.post(URL_ESTADO, () => HttpResponse.error()));
    await renderizarYVerificar();

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
    servidorMock.use(
      http.post(URL_ESTADO, async () => {
        await delay(100);
        return HttpResponse.json(estadoAprobado());
      }),
    );
    await renderizarYVerificar();

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
    await renderizarYVerificar();

    await screen.findByText(TEXTO_FACTURA_EN_PROCESO);
    expect(setItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
  });

  it('no tiene violaciones de accesibilidad (aprobado con nota)', async () => {
    usarEstado(estadoAprobado());
    usarFactura(FACTURA_PENDIENTE);
    const { container } = await renderizarYVerificar();

    await screen.findByText(TEXTO_FACTURA_EN_PROCESO);
    const tarjeta = screen.getByRole('region', { name: 'Pago aprobado' });
    expect(within(tarjeta).getByRole('link', { name: 'Volver a mi póliza' })).toBeVisible();
    await expectSinViolacionesA11y(container);
  });

  it('no tiene violaciones de accesibilidad (verificando)', async () => {
    servidorMock.use(variantesPublico.estadoPendiente);
    const { container } = await renderizarYVerificar();

    await screen.findByRole('heading', { level: 1, name: 'Verificando el pago' });
    await expectSinViolacionesA11y(container);
  });
});

describe('PagoAprobadoPage sin DNI en memoria', () => {
  it('pide el DNI antes de consultar y no hace peticiones al montar', async () => {
    const espia = espiarPedidos();
    renderizar();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Verificá tu pago' }),
    ).toHaveFocus();
    expect(screen.getByLabelText('DNI')).toBeVisible();
    await act(() => new Promise((resolver) => setTimeout(resolver, 50)));
    expect(espia.pedidos).toHaveLength(0);
    espia.soltar();
  });

  it.each([
    ['', 'Ingresá tu DNI.'],
    ['123', 'El DNI debe tener 8 dígitos.'],
  ])('DNI "%s" muestra "%s" bajo el campo sin consultar', async (valor, mensaje) => {
    const espia = espiarPedidos();
    const usuario = userEvent.setup();
    renderizar();

    const campo = await screen.findByLabelText('DNI');
    if (valor) await usuario.type(campo, valor);
    await usuario.click(screen.getByRole('button', { name: 'Verificar pago' }));

    expect(await screen.findByText(mensaje)).toBeVisible();
    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(campo).toHaveFocus();
    expect(espia.pedidos).toHaveLength(0);
    espia.soltar();
  });

  it('404 con el DNI cargado permite ingresar otro DNI', async () => {
    servidorMock.use(variantesPublico.estadoNoEncontrado);
    const usuario = userEvent.setup();
    await renderizarYVerificar();

    await usuario.click(await screen.findByRole('button', { name: 'Ingresar otro DNI' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Verificá tu pago' }),
    ).toBeVisible();
    expect(screen.getByLabelText('DNI')).toHaveValue('');
  });

  it('el DNI cargado no se guarda en storage', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    usarEstado(estadoAprobado());
    await renderizarYVerificar();

    await screen.findByRole('heading', { level: 1, name: 'Pago aprobado' });
    expect(setItem).not.toHaveBeenCalled();
  });
});

describe('PagoAprobadoPage con PADI (pestaña nueva)', () => {
  it('muestra la espera con el link a PADI y no consulta hasta abrir PADI o verificar', async () => {
    sessionStorage.clear();
    const espia = espiarPedidos();
    renderizar(estadoPadi());

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Completá el pago en PADI' }),
    ).toHaveFocus();
    const enlace = screen.getByRole('link', { name: /Abrir PADI para pagar/ });
    expect(enlace).toHaveAttribute('href', URL_PADI);
    expect(enlace).toHaveAttribute('target', '_blank');
    expect(enlace).toHaveAttribute('rel', 'noopener noreferrer');
    expect(enlace).toHaveAccessibleName('Abrir PADI para pagar (se abre en una pestaña nueva)');
    expect(screen.getByText(NUMERO_PAGO)).toBeVisible();
    await act(() => new Promise((resolver) => setTimeout(resolver, 50)));
    expect(espia.pedidos).toHaveLength(0);
    espia.soltar();
  });

  it('"Ya pagué, verificar" consulta con número de pago + DNI y muestra PENDIENTE con el link', async () => {
    servidorMock.use(variantesPublico.estadoPendiente);
    const espia = espiarPedidos();
    const usuario = userEvent.setup();
    renderizar(estadoPadi());

    await usuario.click(await screen.findByRole('button', { name: 'Ya pagué, verificar' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Verificando el pago' }),
    ).toBeVisible();
    expect(espia.deRuta('/pagos/estado')[0]?.body).toEqual({ numeroPago: NUMERO_PAGO, dni: DNI });
    expect(screen.getByRole('link', { name: /Abrir PADI para pagar/ })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Ya pagué, verificar' })).toBeEnabled();
    espia.soltar();
  });

  it('volver a verificar con el pago aprobado muestra Pago aprobado', async () => {
    servidorMock.use(variantesPublico.estadoPendiente);
    const espia = espiarPedidos();
    const usuario = userEvent.setup();
    renderizar(estadoPadi());

    await usuario.click(await screen.findByRole('button', { name: 'Ya pagué, verificar' }));
    await screen.findByRole('heading', { level: 1, name: 'Verificando el pago' });
    usarEstado(estadoAprobado());
    await usuario.click(screen.getByRole('button', { name: 'Ya pagué, verificar' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Pago aprobado' })).toHaveFocus();
    expect(espia.deRuta('/pagos/estado')).toHaveLength(2);
    expect(screen.queryByRole('link', { name: /Abrir PADI/ })).not.toBeInTheDocument();
    espia.soltar();
  });

  it('RECHAZADO muestra el mensaje propuesto', async () => {
    servidorMock.use(variantesPublico.estadoRechazado);
    const usuario = userEvent.setup();
    renderizar(estadoPadi());

    await usuario.click(await screen.findByRole('button', { name: 'Ya pagué, verificar' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'El pago no se pudo confirmar.' }),
    ).toBeVisible();
  });

  it('429 muestra el texto fijo', async () => {
    servidorMock.use(variantesPublico.estado429);
    const usuario = userEvent.setup();
    renderizar(estadoPadi());

    await usuario.click(await screen.findByRole('button', { name: 'Ya pagué, verificar' }));

    expect(
      await screen.findByText('Hiciste muchos intentos. Esperá un minuto y volvé a probar.'),
    ).toBeVisible();
  });

  it('al abrir PADI consulta sola cada 10 s y pasa a Pago aprobado sin tocar nada', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    servidorMock.use(variantesPublico.estadoPendiente);
    const espia = espiarPedidos();
    const usuario = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderizar(estadoPadi());

    await usuario.click(await screen.findByRole('link', { name: /Abrir PADI para pagar/ }));
    await waitFor(() => expect(espia.deRuta('/pagos/estado')).toHaveLength(1));
    expect(espia.deRuta('/pagos/estado')[0]?.body).toEqual({ numeroPago: NUMERO_PAGO, dni: DNI });
    expect(
      screen.getByRole('heading', { level: 1, name: 'Completá el pago en PADI' }),
    ).toBeVisible();

    await act(() => vi.advanceTimersByTimeAsync(10_000));
    await waitFor(() => expect(espia.deRuta('/pagos/estado')).toHaveLength(2));
    expect(
      screen.getByRole('heading', { level: 1, name: 'Completá el pago en PADI' }),
    ).toBeVisible();

    usarEstado(estadoAprobado());
    await act(() => vi.advanceTimersByTimeAsync(10_000));
    expect(await screen.findByRole('heading', { level: 1, name: 'Pago aprobado' })).toBeVisible();

    const pedidos = espia.deRuta('/pagos/estado').length;
    await act(() => vi.advanceTimersByTimeAsync(30_000));
    expect(espia.deRuta('/pagos/estado')).toHaveLength(pedidos);
    espia.soltar();
  });

  it('el sondeo se corta ante un 429 y no reintenta', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    servidorMock.use(variantesPublico.estado429);
    const espia = espiarPedidos();
    const usuario = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderizar(estadoPadi());

    await usuario.click(await screen.findByRole('link', { name: /Abrir PADI para pagar/ }));
    expect(
      await screen.findByText('Hiciste muchos intentos. Esperá un minuto y volvé a probar.'),
    ).toBeVisible();

    await act(() => vi.advanceTimersByTimeAsync(30_000));
    expect(espia.deRuta('/pagos/estado')).toHaveLength(1);
    espia.soltar();
  });

  it('el sondeo se corta a los 50 minutos', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    servidorMock.use(variantesPublico.estadoPendiente);
    const espia = espiarPedidos();
    const usuario = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderizar(estadoPadi());

    await usuario.click(await screen.findByRole('link', { name: /Abrir PADI para pagar/ }));
    await act(() => vi.advanceTimersByTimeAsync(50 * 60_000));
    const pedidos = espia.deRuta('/pagos/estado').length;
    expect(pedidos).toBeGreaterThan(1);

    await act(() => vi.advanceTimersByTimeAsync(5 * 60_000));
    expect(espia.deRuta('/pagos/estado')).toHaveLength(pedidos);
    espia.soltar();
  });

  it('no tiene violaciones de accesibilidad (espera)', async () => {
    const { container } = renderizar(estadoPadi());

    await screen.findByRole('heading', { level: 1, name: 'Completá el pago en PADI' });
    await expectSinViolacionesA11y(container);
  });
});
