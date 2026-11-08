import {
  ApiClientProvider,
  createApiClient,
  publicoKeys,
  type ConsultaPublicaResponse,
  type CuotaPublica,
  type PagoPublicoResponse,
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

import { redirigirA } from '../api/redireccion';
import { MedioDePagoPage } from './MedioDePagoPage';

vi.mock('../api/redireccion', () => ({ redirigirA: vi.fn() }));

const BASE_URL = 'https://api.test';
const URL_PAGOS = '*/api/publico/pagos';
const RUTA = '/poliza/pagar/medio-de-pago';
const DNI = '30123456';
const CLAVE_NUMERO_PAGO = 'nexa.publico.numeroPago';

const PAGO_CREADO: PagoPublicoResponse = {
  numeroPago: 'PAG-6f1c2a',
  idPago: 'a1000000-0000-0000-0000-000000000001',
  urlPago: 'https://pasarela1.example/checkout/PSR-PAG-6f1c2a',
  fechaExpiracion: '2026-11-08T15:00:00Z',
};

function idCuota(numero: number): string {
  return `f1000000-0000-0000-0000-${String(numero).padStart(12, '0')}`;
}

function cuota(numero: number, parcial: Partial<CuotaPublica> = {}): CuotaPublica {
  return {
    idCuota: idCuota(numero),
    numero,
    importe: 25000,
    recargo: 0,
    total: 25000,
    vencimiento: '2026-11-10',
    estado: 'PENDIENTE',
    ...parcial,
  };
}

/** 12 cuotas: 1 a 7 pagadas, la 8 vencida con recargo y la 9 a 12 pendientes (W4 §5). */
function doceCuotas(): CuotaPublica[] {
  return Array.from({ length: 12 }, (_, i) => {
    const numero = i + 1;
    if (numero <= 7) return cuota(numero, { estado: 'PAGADA' });
    if (numero === 8) {
      return cuota(8, {
        estado: 'VENCIDA',
        recargo: 1250,
        total: 26250,
        vencimiento: '2026-10-10',
      });
    }
    return cuota(numero, { vencimiento: `2026-${String(numero + 2).padStart(2, '0')}-10` });
  });
}

function consultaDe(cuotas: CuotaPublica[] = doceCuotas()): ConsultaPublicaResponse {
  return {
    numeroPoliza: 'POL-0000042',
    estado: 'VIGENTE',
    coberturaVigente: true,
    vigenteDesde: '2026-03-01',
    vigenteHasta: '2027-03-01',
    plan: { codigo: 'TC', nombre: 'Terceros Completo' },
    vehiculo: { patente: 'AB123CD', marca: 'Toyota', modelo: 'Etios', anio: 2019 },
    cuotas,
  };
}

function estadoDe(cuotaIds: unknown = [idCuota(8), idCuota(9)], cuotas?: CuotaPublica[]) {
  return { dni: DNI, numeroPoliza: 'POL-0000042', consulta: consultaDe(cuotas), cuotaIds };
}

function Sonda() {
  const ubicacion = useLocation();
  return (
    <>
      <p data-testid="ruta">{ubicacion.pathname}</p>
      <p data-testid="search">{ubicacion.search}</p>
      <pre data-testid="estado">{JSON.stringify(ubicacion.state ?? null)}</pre>
    </>
  );
}

function renderizar(state: unknown = estadoDe()) {
  const cliente = createApiClient({ baseUrl: BASE_URL });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: 3, retryDelay: 0 } },
  });

  return render(
    <ApiClientProvider client={cliente}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[{ pathname: RUTA, state }]}>
          <main>
            <Routes>
              <Route path={RUTA} element={<MedioDePagoPage />} />
              <Route path="*" element={<Sonda />} />
            </Routes>
          </main>
        </MemoryRouter>
      </QueryClientProvider>
    </ApiClientProvider>,
  );
}

function estadoNavegado(): unknown {
  return JSON.parse(screen.getByTestId('estado').textContent ?? 'null') as unknown;
}

function botonContinuar() {
  return screen.getByRole('button', { name: 'Continuar' });
}

async function elegirYContinuar(opcion: string) {
  const usuario = userEvent.setup();
  await usuario.click(screen.getByRole('radio', { name: opcion }));
  await usuario.click(botonContinuar());
  return usuario;
}

/** Cuenta los POST a `/api/publico/pagos` (con body) mientras dura el test. */
function espiarPagos() {
  const cuerpos: unknown[] = [];
  const escuchar = ({ request }: { request: Request }) => {
    if (new URL(request.url).pathname !== '/api/publico/pagos') return;
    void request
      .clone()
      .json()
      .then((cuerpo: unknown) => cuerpos.push(cuerpo));
  };
  servidorMock.events.on('request:start', escuchar);
  return {
    cuerpos,
    cantidad: () => cuerpos.length,
    soltar: () => servidorMock.events.removeListener('request:start', escuchar),
  };
}

beforeAll(() => servidorMock.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});
afterEach(() => {
  servidorMock.resetHandlers();
  vi.mocked(redirigirA).mockReset();
  vi.restoreAllMocks();
});
afterAll(() => servidorMock.close());

describe('MedioDePagoPage: guardas de estado', () => {
  it('sin estado redirige a /consultar-poliza', () => {
    renderizar(null);
    expect(screen.getByTestId('ruta')).toHaveTextContent('/consultar-poliza');
  });

  it('cuotaIds vacío redirige a /poliza con el estado de W2', () => {
    renderizar(estadoDe([]));

    expect(screen.getByTestId('ruta')).toHaveTextContent(/^\/poliza$/);
    expect(estadoNavegado()).toEqual({
      dni: DNI,
      numeroPoliza: 'POL-0000042',
      consulta: consultaDe(),
    });
  });

  it('más de 24 cuotas redirige a /poliza', () => {
    const cuotas = Array.from({ length: 25 }, (_, i) => cuota(i + 1));
    renderizar(
      estadoDe(
        cuotas.map((c) => c.idCuota),
        cuotas,
      ),
    );
    expect(screen.getByTestId('ruta')).toHaveTextContent(/^\/poliza$/);
  });

  it('cuotaIds repetidos redirige a /poliza', () => {
    renderizar(estadoDe([idCuota(8), idCuota(8)]));
    expect(screen.getByTestId('ruta')).toHaveTextContent(/^\/poliza$/);
  });

  it('una cuota que no es de la consulta redirige a /poliza', () => {
    renderizar(estadoDe([idCuota(99)]));
    expect(screen.getByTestId('ruta')).toHaveTextContent(/^\/poliza$/);
  });
});

describe('MedioDePagoPage: encabezado y opciones', () => {
  it('h1 y subtítulo con las cuotas y la póliza; el foco va al h1', () => {
    renderizar();

    const titulo = screen.getByRole('heading', { level: 1, name: 'Elegí tu medio de pago' });
    expect(titulo).toHaveFocus();
    expect(
      screen.getByText(
        (_, nodo) =>
          nodo?.tagName === 'P' &&
          nodo.textContent === 'Vas a pagar las cuotas 8 y 9 de la póliza POL-0000042.',
      ),
    ).toBeInTheDocument();
  });

  it('subtítulo singular con una cuota', () => {
    renderizar(estadoDe([idCuota(8)]));

    expect(
      screen.getByText(
        (_, nodo) =>
          nodo?.tagName === 'P' &&
          nodo.textContent === 'Vas a pagar la cuota 8 de la póliza POL-0000042.',
      ),
    ).toBeInTheDocument();
  });

  it('tres opciones en un radiogroup sin preseleccionar', () => {
    renderizar();

    const grupo = screen.getByRole('radiogroup', { name: 'Medio de pago' });
    const radios = within(grupo).getAllByRole('radio');
    expect(radios).toHaveLength(3);
    for (const radio of radios) expect(radio).not.toBeChecked();
    expect(within(grupo).getByRole('radio', { name: 'Pasarela A' })).toBeInTheDocument();
    expect(within(grupo).getByRole('radio', { name: 'Pasarela B' })).toBeInTheDocument();
    expect(within(grupo).getByRole('radio', { name: 'Pago Fácil' })).toHaveAccessibleDescription(
      'Efectivo con cupón de código de barras. Acreditación hasta 72 h hábiles.',
    );
    expect(within(grupo).getByRole('radio', { name: 'Pasarela A' })).toHaveAccessibleDescription(
      'Pago online con tarjeta o dinero en cuenta.',
    );
  });

  it('Continuar deshabilitado hasta elegir una opción', async () => {
    renderizar();
    expect(botonContinuar()).toBeDisabled();

    await userEvent.setup().click(screen.getByRole('radio', { name: 'Pasarela B' }));

    expect(screen.getByRole('radio', { name: 'Pasarela B' })).toBeChecked();
    expect(botonContinuar()).toBeEnabled();
  });

  it('muestra el texto de privacidad', () => {
    renderizar();
    expect(
      screen.getByText('Tus datos viajan cifrados y no se guardan en este dispositivo.'),
    ).toBeInTheDocument();
  });
});

describe('MedioDePagoPage: envío', () => {
  it('Pago Fácil navega a W5 sin POST', async () => {
    const pagos = espiarPagos();
    renderizar();

    await elegirYContinuar('Pago Fácil');

    expect(screen.getByTestId('ruta')).toHaveTextContent('/poliza/pagar/pago-facil');
    expect(estadoNavegado()).toEqual(estadoDe());
    expect(pagos.cantidad()).toBe(0);
    pagos.soltar();
  });

  it('Pasarela A envía proveedor pasarela1 con el body de contrato', async () => {
    const pagos = espiarPagos();
    renderizar();

    await elegirYContinuar('Pasarela A');

    await waitFor(() => expect(pagos.cantidad()).toBe(1));
    expect(pagos.cuerpos[0]).toEqual({
      dni: DNI,
      numeroPoliza: 'POL-0000042',
      cuotaIds: [idCuota(8), idCuota(9)],
      proveedor: 'pasarela1',
    });
    pagos.soltar();
  });

  it('Pasarela B envía proveedor pasarela2', async () => {
    const pagos = espiarPagos();
    renderizar();

    await elegirYContinuar('Pasarela B');

    await waitFor(() => expect(pagos.cantidad()).toBe(1));
    expect(pagos.cuerpos[0]).toMatchObject({ proveedor: 'pasarela2' });
    pagos.soltar();
  });

  it('201 guarda solo numeroPago y redirige a urlPago', async () => {
    servidorMock.use(http.post(URL_PAGOS, () => HttpResponse.json(PAGO_CREADO, { status: 201 })));
    renderizar();

    await elegirYContinuar('Pasarela A');

    await waitFor(() => expect(redirigirA).toHaveBeenCalledWith(PAGO_CREADO.urlPago));
    expect(sessionStorage.length).toBe(1);
    expect(sessionStorage.getItem(CLAVE_NUMERO_PAGO)).toBe('PAG-6f1c2a');
  });

  it('201 invalida la caché pública antes de redirigir', async () => {
    const invalidar = vi.spyOn(QueryClient.prototype, 'invalidateQueries');
    renderizar();

    await elegirYContinuar('Pasarela A');

    await waitFor(() => expect(redirigirA).toHaveBeenCalled());
    expect(invalidar).toHaveBeenCalledWith({ queryKey: publicoKeys.all });
    expect(invalidar.mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(redirigirA).mock.invocationCallOrder[0] ?? 0,
    );
  });

  it('el DNI no se guarda en storage', async () => {
    renderizar();

    await elegirYContinuar('Pasarela A');

    await waitFor(() => expect(redirigirA).toHaveBeenCalled());
    for (const almacen of [sessionStorage, localStorage]) {
      for (let i = 0; i < almacen.length; i += 1) {
        const clave = almacen.key(i) ?? '';
        expect(clave).not.toContain(DNI);
        expect(almacen.getItem(clave)).not.toContain(DNI);
        expect(almacen.getItem(clave)).not.toContain('POL-0000042');
      }
    }
    expect(localStorage.length).toBe(0);
  });

  it('sessionStorage que lanza no rompe el flujo', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    renderizar();

    await elegirYContinuar('Pasarela A');

    await waitFor(() => expect(redirigirA).toHaveBeenCalledWith(PAGO_CREADO.urlPago));
  });

  it('doble clic envía una sola petición', async () => {
    servidorMock.use(
      http.post(URL_PAGOS, async () => {
        await delay(50);
        return HttpResponse.json(PAGO_CREADO, { status: 201 });
      }),
    );
    const pagos = espiarPagos();
    renderizar();
    const usuario = userEvent.setup();

    await usuario.click(screen.getByRole('radio', { name: 'Pasarela A' }));
    await usuario.dblClick(botonContinuar());

    await waitFor(() => expect(redirigirA).toHaveBeenCalled());
    expect(pagos.cantidad()).toBe(1);
    pagos.soltar();
  });

  it('al volver desde la pasarela con la página restaurada del caché, se puede elegir de nuevo', async () => {
    servidorMock.use(http.post(URL_PAGOS, () => HttpResponse.json(PAGO_CREADO, { status: 201 })));
    renderizar();
    await elegirYContinuar('Pasarela A');
    await waitFor(() => expect(botonContinuar()).toBeDisabled());

    act(() => {
      window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    });

    await waitFor(() => expect(botonContinuar()).toBeEnabled());
    for (const radio of screen.getAllByRole('radio')) expect(radio).toBeEnabled();
  });

  it('un pageshow sin restaurar del caché no cambia el estado de envío', async () => {
    servidorMock.use(http.post(URL_PAGOS, () => HttpResponse.json(PAGO_CREADO, { status: 201 })));
    renderizar();
    await elegirYContinuar('Pasarela A');
    await waitFor(() => expect(botonContinuar()).toBeDisabled());

    act(() => {
      window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: false }));
    });

    expect(botonContinuar()).toBeDisabled();
  });

  it('mientras envía, el botón está deshabilitado y aria-busy', async () => {
    servidorMock.use(
      http.post(URL_PAGOS, async () => {
        await delay('infinite');
        return HttpResponse.json(PAGO_CREADO, { status: 201 });
      }),
    );
    renderizar();

    await elegirYContinuar('Pasarela A');

    await waitFor(() => expect(botonContinuar()).toBeDisabled());
    expect(botonContinuar()).toHaveAttribute('aria-busy', 'true');
    for (const radio of screen.getAllByRole('radio')) expect(radio).toBeDisabled();
  });
});

describe('MedioDePagoPage: errores', () => {
  it('400 muestra el detail del back y conserva la opción', async () => {
    servidorMock.use(variantesPublico.pagoEnCurso);
    renderizar();

    await elegirYContinuar('Pasarela A');

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent(
      'Alguna de las cuotas ya tiene un pago en curso. Intente de nuevo más tarde.',
    );
    expect(alerta.parentElement).toHaveFocus();
    expect(screen.getByRole('radio', { name: 'Pasarela A' })).toBeChecked();
    expect(botonContinuar()).toBeEnabled();
    expect(redirigirA).not.toHaveBeenCalled();
  });

  it('404 muestra el detail del back', async () => {
    servidorMock.use(variantesPublico.pagoNoEncontrado);
    renderizar();

    await elegirYContinuar('Pasarela A');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se encontró un registro con los datos indicados.',
    );
  });

  it('429 muestra el texto fijo y no reintenta', async () => {
    servidorMock.use(variantesPublico.pagoRateLimit);
    const pagos = espiarPagos();
    renderizar();

    await elegirYContinuar('Pasarela A');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Hiciste muchos intentos. Esperá un minuto y volvé a probar.',
    );
    expect(pagos.cantidad()).toBe(1);
    pagos.soltar();
  });

  it('502 con detail muestra el detail del back', async () => {
    servidorMock.use(variantesPublico.pagoPasarelaCaida);
    renderizar();

    await elegirYContinuar('Pasarela A');

    expect(await screen.findByRole('alert')).toHaveTextContent('La pasarela no está disponible.');
  });

  it('502 sin detail muestra el texto de pasarela', async () => {
    servidorMock.use(http.post(URL_PAGOS, () => new HttpResponse(null, { status: 502 })));
    renderizar();

    await elegirYContinuar('Pasarela A');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos conectar con la pasarela. Intentá de nuevo en unos minutos.',
    );
  });

  it('error de red muestra el texto de red y no reintenta', async () => {
    servidorMock.use(http.post(URL_PAGOS, () => HttpResponse.error()));
    const pagos = espiarPagos();
    renderizar();

    await elegirYContinuar('Pasarela A');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos iniciar el pago. Revisá tu conexión e intentá de nuevo.',
    );
    expect(pagos.cantidad()).toBe(1);
    pagos.soltar();
  });
});

describe('MedioDePagoPage: resumen', () => {
  it('el total suma los totales en centavos y muestra el recargo', () => {
    renderizar();

    expect(screen.getByText('Total a pagar (2 cuotas)')).toBeInTheDocument();
    expect(screen.getByText('Incluye el recargo de la cuota 8')).toBeInTheDocument();
    expect(screen.getByText('$ 51.250,00')).toBeInTheDocument();
  });

  it('suma importes con decimales sin error de coma flotante', () => {
    const cuotas = [cuota(1, { importe: 0.1, total: 0.1 }), cuota(2, { importe: 0.2, total: 0.2 })];
    renderizar(estadoDe([idCuota(1), idCuota(2)], cuotas));

    expect(screen.getByText('$ 0,30')).toBeInTheDocument();
  });

  it('detalle muestra recargo solo en cuotas con recargo', () => {
    renderizar();

    expect(screen.getByText('Cuota 8 de 12')).toBeInTheDocument();
    expect(screen.getByText('Vencimiento 10/10/2026')).toBeInTheDocument();
    expect(screen.getByText('Cuota 9 de 12')).toBeInTheDocument();
    expect(screen.getAllByText('Importe de la cuota')).toHaveLength(2);
    expect(screen.getAllByText('Recargo por vencimiento (5%)')).toHaveLength(1);
    expect(screen.getByText('$ 1.250,00')).toBeInTheDocument();
    expect(screen.getByText('Total cuota 8')).toBeInTheDocument();
    expect(screen.queryByText('Total cuota 9')).toBeNull();
    expect(screen.getByText('Vencida')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('muestra la póliza y el plan, y "Cambiar cuotas" vuelve a W3 sin cuotaIds ni datos en la URL', async () => {
    renderizar();

    expect(screen.getByText('Póliza POL-0000042 · Plan TC Terceros Completo')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('link', { name: 'Cambiar cuotas' }));

    expect(screen.getByTestId('ruta')).toHaveTextContent(/^\/poliza$/);
    expect(screen.getByTestId('search')).toBeEmptyDOMElement();
    expect(estadoNavegado()).toEqual({
      dni: DNI,
      numeroPoliza: 'POL-0000042',
      consulta: consultaDe(),
    });
  });

  it('no tiene violaciones de accesibilidad', async () => {
    const { container } = renderizar();
    await expectSinViolacionesA11y(container);
  });
});
