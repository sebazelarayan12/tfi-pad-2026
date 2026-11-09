import {
  ApiClientProvider,
  createApiClient,
  type ConsultaPublicaResponse,
  type CuotaPublica,
  type CuponPublicoRequest,
  type CuponPublicoRespuestaMock,
} from '@nexa/api';
import { problemaNegocio } from '@nexa/api/mocks/fixtures/comunes';
import { variantesPublico } from '@nexa/api/mocks/handlers/publico';
import { servidorMock } from '@nexa/api/mocks/server';
import { expectSinViolacionesA11y } from '@nexa/ui/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { CuponPagoFacilPage } from './CuponPagoFacilPage';

const BASE_URL = 'https://api.test';
const URL_CUPON = '*/api/publico/cupon';
const RUTA = '/poliza/pagar/pago-facil';
const DNI = '30123456';
const CODIGO = '123450120000020261210000000100112600001026';

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

function consultaDe(): ConsultaPublicaResponse {
  return {
    numeroPoliza: 'POL-0000042',
    estado: 'VIGENTE',
    coberturaVigente: true,
    vigenteDesde: '2026-03-01',
    vigenteHasta: '2027-03-01',
    plan: { codigo: 'TC', nombre: 'Terceros Completo' },
    vehiculo: { patente: 'AB123CD', marca: 'Toyota', modelo: 'Etios', anio: 2019 },
    cuotas: Array.from({ length: 12 }, (_, i) =>
      cuota(i + 1, { estado: i + 1 <= 7 ? 'PAGADA' : 'PENDIENTE' }),
    ),
  };
}

function estadoDe(cuotaIds: unknown = [idCuota(9)]) {
  return { dni: DNI, numeroPoliza: 'POL-0000042', consulta: consultaDe(), cuotaIds };
}

function cuponDe(numeroCuota: number, parcial: Partial<CuponPublicoRespuestaMock> = {}) {
  const cupon: CuponPublicoRespuestaMock = {
    cuotaId: idCuota(numeroCuota),
    numeroPoliza: 'POL-0000042',
    numeroCuota,
    importePrimerVencimiento: 25000,
    fechaPrimerVencimiento: '2026-11-10',
    importeSegundoVencimiento: 26250,
    fechaSegundoVencimiento: '2026-11-20',
    codigoBarras: CODIGO,
    totalCuotas: null,
    ...parcial,
  };
  return cupon;
}

/** Responde el cupón de la cuota pedida; `porCuota` permite cambiar la respuesta de una. */
function instalarCupones(porCuota: Record<number, () => Response> = {}) {
  const pedidos: CuponPublicoRequest[] = [];
  servidorMock.use(
    http.post(URL_CUPON, async ({ request }) => {
      const body = (await request.json()) as CuponPublicoRequest;
      pedidos.push(body);
      const especial = porCuota[body.numeroCuota];
      return especial ? especial() : HttpResponse.json(cuponDe(body.numeroCuota));
    }),
  );
  return pedidos;
}

function Sonda() {
  const ubicacion = useLocation();
  return (
    <>
      <p data-testid="ruta">{ubicacion.pathname}</p>
      <pre data-testid="estado">{JSON.stringify(ubicacion.state ?? null)}</pre>
    </>
  );
}

function renderizar(state: unknown = estadoDe()) {
  const cliente = createApiClient({ baseUrl: BASE_URL });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 3, retryDelay: 0 } },
  });

  return render(
    <ApiClientProvider client={cliente}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[{ pathname: RUTA, state }]}>
          <main>
            <Routes>
              <Route path={RUTA} element={<CuponPagoFacilPage />} />
              <Route path="*" element={<Sonda />} />
            </Routes>
          </main>
        </MemoryRouter>
      </QueryClientProvider>
    </ApiClientProvider>,
  );
}

function tarjeta(numero: number) {
  return screen.getByRole('article', { name: `Cuota ${numero} de 12` });
}

beforeAll(() => servidorMock.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  servidorMock.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => servidorMock.close());

describe('CuponPagoFacilPage: guardas de estado', () => {
  it('sin estado redirige a /consultar-poliza', () => {
    renderizar(null);
    expect(screen.getByTestId('ruta')).toHaveTextContent('/consultar-poliza');
  });

  it('cuotaIds vacío redirige a W4 con el estado', () => {
    renderizar(estadoDe([]));

    expect(screen.getByTestId('ruta')).toHaveTextContent('/poliza/pagar/medio-de-pago');
    expect(JSON.parse(screen.getByTestId('estado').textContent ?? 'null')).toEqual(estadoDe([]));
  });

  it('sin cuotaIds redirige a W4', () => {
    const { cuotaIds: _sinCuotas, ...base } = estadoDe();
    renderizar(base);
    expect(screen.getByTestId('ruta')).toHaveTextContent('/poliza/pagar/medio-de-pago');
  });

  it('una cuota que no es de la consulta redirige a W4', () => {
    renderizar(estadoDe([idCuota(99)]));
    expect(screen.getByTestId('ruta')).toHaveTextContent('/poliza/pagar/medio-de-pago');
  });
});

describe('CuponPagoFacilPage: pedidos', () => {
  it('una petición por cuota con numeroCuota', async () => {
    const pedidos = instalarCupones();
    renderizar(estadoDe([idCuota(9), idCuota(8)]));

    await waitFor(() => expect(pedidos).toHaveLength(2));
    expect(pedidos.map((p) => p.numeroCuota).toSorted()).toEqual([8, 9]);
    expect(pedidos[0]).toEqual({ dni: DNI, numeroPoliza: 'POL-0000042', numeroCuota: 8 });
  });

  it('nunca llama a GET /api/pagofacil/cuotas/.../cupon', async () => {
    const rutas: string[] = [];
    const escuchar = ({ request }: { request: Request }) => {
      rutas.push(`${request.method} ${new URL(request.url).pathname}`);
    };
    servidorMock.events.on('request:start', escuchar);
    instalarCupones();
    renderizar();

    expect(await screen.findByText('$ 26.250,00')).toBeInTheDocument();
    expect(rutas).toEqual(['POST /api/publico/cupon']);
    servidorMock.events.removeListener('request:start', escuchar);
  });

  it('N cuotas muestran N cupones en orden de número', async () => {
    instalarCupones();
    renderizar(estadoDe([idCuota(10), idCuota(8), idCuota(9)]));

    const tarjetas = await screen.findAllByRole('article');
    expect(tarjetas.map((t) => t.getAttribute('aria-label'))).toEqual([
      'Cuota 8 de 12',
      'Cuota 9 de 12',
      'Cuota 10 de 12',
    ]);
  });
});

describe('CuponPagoFacilPage: contenido', () => {
  it('h1 "Cupón de pago" con foco', () => {
    instalarCupones();
    renderizar();
    expect(screen.getByRole('heading', { level: 1, name: 'Cupón de pago' })).toHaveFocus();
  });

  it('muestra póliza, cuota "9 de 12" y DNI formateado', () => {
    instalarCupones();
    renderizar();

    const cupon = within(tarjeta(9));
    expect(cupon.getByText('POL-0000042')).toBeInTheDocument();
    expect(cupon.getByText('9 de 12')).toBeInTheDocument();
    expect(cupon.getByText('30.123.456')).toBeInTheDocument();
  });

  it('no muestra Titular ni nombre del titular', async () => {
    instalarCupones();
    renderizar();

    await screen.findByText('$ 26.250,00');
    expect(screen.queryByText(/Titular/)).toBeNull();
  });

  it('vencimientos del DTO, no del Figma', async () => {
    instalarCupones();
    renderizar();

    expect(await screen.findByText('20/11/2026')).toBeInTheDocument();
    expect(screen.getByText('$ 26.250,00')).toBeInTheDocument();
    expect(screen.getByText('$ 25.000,00')).toBeInTheDocument();
    expect(screen.getByText('2do vencimiento, con recargo 5%')).toBeInTheDocument();
    expect(screen.queryByText('17/11/2026')).toBeNull();
  });

  it('fechas DateOnly no se desplazan por zona', async () => {
    instalarCupones();
    renderizar();
    expect(await screen.findByText('10/11/2026')).toBeInTheDocument();
  });

  it('muestra los 42 dígitos con su aria-label y dibuja las barras', async () => {
    instalarCupones();
    renderizar();

    expect(
      await screen.findByRole('img', { name: `Código de barras: ${CODIGO}` }),
    ).toHaveTextContent(CODIGO);
    const barras = screen.getByTestId('barras-itf');
    expect(barras).toHaveAttribute('aria-hidden', 'true');
    // 21 pares × 5 barras + 2 de inicio + 2 de fin.
    expect(barras.querySelectorAll('rect')).toHaveLength(109);
  });

  it('código de longitud distinta muestra no disponible y no dibuja barras', async () => {
    instalarCupones({ 9: () => HttpResponse.json(cuponDe(9, { codigoBarras: CODIGO.slice(1) })) });
    renderizar();

    expect(await screen.findByText('No disponible para este importe.')).toBeInTheDocument();
    expect(screen.queryByTestId('barras-itf')).toBeNull();
  });

  it('Imprimir llama a window.print', async () => {
    const imprimir = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    instalarCupones();
    renderizar();

    await screen.findByText('$ 26.250,00');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Imprimir' }));
    expect(imprimir).toHaveBeenCalledTimes(1);
  });

  it('Imprimir está deshabilitado mientras carga', () => {
    instalarCupones();
    renderizar();
    expect(screen.getByRole('button', { name: 'Imprimir' })).toBeDisabled();
  });

  it('no hay botón Descargar PDF', async () => {
    instalarCupones();
    renderizar();

    await screen.findByText('$ 26.250,00');
    expect(screen.queryByRole('button', { name: /PDF/ })).toBeNull();
  });
});

describe('CuponPagoFacilPage: errores', () => {
  it('400 por importe muestra el texto de desborde', async () => {
    instalarCupones({
      9: () =>
        HttpResponse.json(
          problemaNegocio('El importe 99999.99 no entra en el código de Pago Fácil.'),
          {
            status: 400,
            headers: { 'Content-Type': 'application/problem+json' },
          },
        ),
    });
    renderizar();

    expect(await screen.findByRole('alert')).toHaveTextContent('No disponible para este importe.');
    expect(screen.queryByRole('button', { name: 'Reintentar' })).toBeNull();
  });

  it('400 genérico muestra el texto de cuota no pagable', async () => {
    servidorMock.use(variantesPublico.cuponCuotaPagada);
    renderizar();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Esta cuota no se puede pagar con cupón.',
    );
  });

  it('404 muestra el texto y permite reintentar a mano', async () => {
    let intentos = 0;
    instalarCupones({
      9: () => {
        intentos += 1;
        return intentos === 1
          ? HttpResponse.json({ status: 404, detail: 'No se encontró.' }, { status: 404 })
          : HttpResponse.json(cuponDe(9));
      },
    });
    renderizar();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos generar el cupón. Volvé a consultar tu póliza.',
    );
    expect(intentos).toBe(1);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('$ 26.250,00')).toBeInTheDocument();
    expect(intentos).toBe(2);
  });

  it('429 muestra el texto fijo sin reintento automático', async () => {
    const pedidos: unknown[] = [];
    servidorMock.events.on('request:start', ({ request }) => pedidos.push(request.url));
    servidorMock.use(variantesPublico.cupon429);
    renderizar();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Hiciste muchos intentos. Esperá un minuto y volvé a probar.',
    );
    expect(pedidos).toHaveLength(1);
    servidorMock.events.removeAllListeners('request:start');
  });

  it('error de red muestra el texto genérico con Reintentar', async () => {
    instalarCupones({ 9: () => HttpResponse.error() });
    renderizar();

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos generar el cupón.');
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeEnabled();
  });

  it('una tarjeta con error no oculta las demás', async () => {
    instalarCupones({ 8: () => HttpResponse.error() });
    renderizar(estadoDe([idCuota(8), idCuota(9)]));

    expect(await within(tarjeta(8)).findByRole('alert')).toBeInTheDocument();
    expect(await within(tarjeta(9)).findByText('$ 26.250,00')).toBeInTheDocument();
  });
});

describe('CuponPagoFacilPage: storage y accesibilidad', () => {
  it('no guarda nada en storage', async () => {
    const escribir = vi.spyOn(Storage.prototype, 'setItem');
    instalarCupones();
    renderizar();

    await screen.findByText('$ 26.250,00');
    expect(escribir).not.toHaveBeenCalled();
  });

  it('no tiene violaciones de accesibilidad', async () => {
    instalarCupones();
    const { container } = renderizar(estadoDe([idCuota(8), idCuota(9)]));

    await screen.findAllByText('$ 26.250,00');
    await expectSinViolacionesA11y(container);
  });
});
