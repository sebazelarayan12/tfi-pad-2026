import { type HttpHandler } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  cobrarEnCaja,
  createApiClient,
  listarPagosDePolizaMock,
  listarPagosMock,
  obtenerFacturaDePago,
  obtenerPago,
  pagosKeys,
  type ApiClient,
  type FacturaConPdfMock,
  type FacturaResponse,
  type PagoListadoResponse,
  type PagoResponse,
} from '../../src';
import {
  PAGO_UNO_ID,
  cajaClientesDistintos,
  cajaConflictoConcurrencia,
  cajaCuotaIdsVacio,
  cajaCuotaNoExiste,
  cajaCuotaNoPagable,
  cajaCuotasRepetidas,
  cajaErrorRed,
  cajaFacturaPendienteCae,
  cajaPolizaNoExiste,
  facturaConPdf,
  facturaNoExiste,
  facturaPendienteCae,
  pagosVacios,
  pagoNoExiste,
} from '../../mocks/handlers/pagos';
import { POLIZA_UNO_ID } from '../../mocks/handlers/polizas';
import { servidorMock } from '../../mocks/server';

const API_URL = 'https://api.test';
const SOLICITUD = { cuotaIds: ['f1000000-0000-0000-0000-000000000002'] };

function api(): ApiClient {
  return createApiClient({ baseUrl: API_URL, getToken: () => 'token' });
}

function apiSinToken(): ApiClient {
  return createApiClient({ baseUrl: API_URL });
}

const CASOS_400: Array<[string, HttpHandler, string]> = [
  ['cuotas repetidas', cajaCuotasRepetidas, 'Las cuotas no pueden repetirse.'],
  [
    'cuota anulada o pagada',
    cajaCuotaNoPagable,
    'Solo se pueden pagar cuotas pendientes o vencidas (RN11).',
  ],
  [
    'cuotas de dos clientes',
    cajaClientesDistintos,
    'Todas las cuotas deben pertenecer al mismo cliente.',
  ],
  [
    'conflicto de RowVersion',
    cajaConflictoConcurrencia,
    'El pago o sus cuotas fueron modificados por otro cobro. Recargue los datos.',
  ],
];

const CASOS_404: Array<[string, HttpHandler, string]> = [
  ['cuota inexistente', cajaCuotaNoExiste, 'Alguna de las cuotas indicadas no existe.'],
  ['póliza inexistente', cajaPolizaNoExiste, 'Alguna de las pólizas indicadas no existe.'],
];

beforeAll(() => servidorMock.listen({ onUnhandledRequest: 'error' }));
afterEach(() => servidorMock.resetHandlers());
afterAll(() => servidorMock.close());

describe('POST /api/pagos/caja', () => {
  it('devuelve 201 con PagoResponse APROBADO y medio CAJA', async () => {
    const crudo = await api().post('/api/pagos/caja', SOLICITUD, { responseType: 'raw' });
    const pago = JSON.parse(crudo.texto) as PagoResponse;

    expect(crudo.status).toBe(201);
    expect(pago.numero).toBe('PAG-6f1c2a');
    expect(pago.estado).toBe('APROBADO');
    expect(pago.medio).toBe('CAJA');
    expect(pago.factura?.estado).toBe('AUTORIZADA');
  });

  it('devuelve 400 de validación con errors.CuotaIds cuando cuotaIds está vacío', async () => {
    servidorMock.use(cajaCuotaIdsVacio);

    await expect(cobrarEnCaja(api(), { cuotaIds: [] })).rejects.toMatchObject({
      status: 400,
      errors: { CuotaIds: ['Debe indicar al menos una cuota.'] },
    });
  });

  it.each(CASOS_400)('devuelve 400 de negocio: %s', async (_caso, handler, detail) => {
    servidorMock.use(handler);

    await expect(cobrarEnCaja(api(), SOLICITUD)).rejects.toMatchObject({
      status: 400,
      detail,
    });
  });

  it.each(CASOS_404)('devuelve 404 con detail: %s', async (_caso, handler, detail) => {
    servidorMock.use(handler);

    await expect(cobrarEnCaja(api(), SOLICITUD)).rejects.toMatchObject({
      status: 404,
      detail,
    });
  });

  it('devuelve 400 por RowVersion con el texto de recarga', async () => {
    servidorMock.use(cajaConflictoConcurrencia);

    await expect(cobrarEnCaja(api(), SOLICITUD)).rejects.toMatchObject({
      status: 400,
      detail: 'El pago o sus cuotas fueron modificados por otro cobro. Recargue los datos.',
    });
  });

  it('no reintenta ante 502', async () => {
    let peticiones = 0;
    const alIniciarPeticion = ({ request }: { request: Request }) => {
      if (request.method === 'POST' && new URL(request.url).pathname === '/api/pagos/caja') {
        peticiones += 1;
      }
    };
    servidorMock.events.on('request:start', alIniciarPeticion);
    servidorMock.use(cajaErrorRed);

    try {
      await expect(cobrarEnCaja(api(), SOLICITUD)).rejects.toMatchObject({ status: 502 });
      expect(peticiones).toBe(1);
    } finally {
      servidorMock.events.removeListener('request:start', alIniciarPeticion);
    }
  });

  it('con factura PENDIENTE_CAE devuelve 201, no error', async () => {
    servidorMock.use(cajaFacturaPendienteCae);

    const pago = await cobrarEnCaja(api(), SOLICITUD);

    expect(pago.estado).toBe('APROBADO');
    expect(pago.factura?.estado).toBe('PENDIENTE_CAE');
    expect(pago.factura?.numero).toBe('');
    expect(pago.factura?.cae).toBeNull();
  });
});

describe('GET /api/pagos/{id}', () => {
  it('devuelve PagoResponse con estado en mayúsculas', async () => {
    const pago = await obtenerPago(api(), PAGO_UNO_ID);

    expect(pago.id).toBe(PAGO_UNO_ID);
    expect(pago.estado).toBe('APROBADO');
    expect(pago.medio).toBe('CAJA');
    expect(pago.factura?.estado).toBe('AUTORIZADA');
  });

  it('devuelve 404 con detail "El pago no existe."', async () => {
    servidorMock.use(pagoNoExiste);

    await expect(obtenerPago(api(), 'no-existe')).rejects.toMatchObject({
      status: 404,
      detail: 'El pago no existe.',
    });
  });
});

describe('GET /api/pagos/{id}/factura', () => {
  it('devuelve FacturaResponse AUTORIZADA con CAE de 14 dígitos', async () => {
    const factura: FacturaResponse = await obtenerFacturaDePago(api(), PAGO_UNO_ID);

    expect(factura.estado).toBe('AUTORIZADA');
    expect(factura.tipo).toBe('B');
    expect(factura.cae).toMatch(/^\d{14}$/);
    expect(factura.vencimientoCae).toBe('2026-11-18');
  });

  it('devuelve PENDIENTE_CAE con número vacío y CAE null', async () => {
    servidorMock.use(facturaPendienteCae);

    const factura = await obtenerFacturaDePago(api(), PAGO_UNO_ID);

    expect(factura.estado).toBe('PENDIENTE_CAE');
    expect(factura.numero).toBe('');
    expect(factura.cae).toBeNull();
    expect(factura.vencimientoCae).toBeNull();
  });

  it('devuelve 404 con detail "No se encontró la factura del pago."', async () => {
    servidorMock.use(facturaNoExiste);

    await expect(obtenerFacturaDePago(api(), 'no-existe')).rejects.toMatchObject({
      status: 404,
      detail: 'No se encontró la factura del pago.',
    });
  });
});

describe('Mocks de PB-05 y PB-11', () => {
  it('el mock de PDF (PB-11) devuelve urlPdf null mientras PENDIENTE_CAE', async () => {
    servidorMock.use(facturaPendienteCae);
    const pendiente = (await obtenerFacturaDePago(api(), PAGO_UNO_ID)) as FacturaConPdfMock;

    expect(pendiente.urlPdf).toBeNull();

    servidorMock.use(facturaConPdf);
    const autorizada = (await obtenerFacturaDePago(api(), PAGO_UNO_ID)) as FacturaConPdfMock;

    expect(autorizada.urlPdf).toContain('https://');
  });

  it('el mock de listado (PB-05) se marca MOCK y devuelve PaginaResponse', async () => {
    expect(listarPagosMock.name).toBe('listarPagosMock');

    const pagina = await listarPagosMock(api(), {});
    const pagos: PagoListadoResponse[] = pagina.items;

    expect(pagos).toHaveLength(2);
    expect(pagos.map((pago) => pago.estado)).toEqual(['APROBADO', 'RECHAZADO']);
    expect(pagos[0]?.factura?.estado).toBe('AUTORIZADA');
    expect(pagina.tamanoPagina).toBe(20);
    expect(pagina.total).toBe(2);

    servidorMock.use(pagosVacios);
    const vacia = await listarPagosMock(api(), {});
    expect(vacia.items).toEqual([]);
    expect(vacia.total).toBe(0);
  });

  it('el mock por póliza (PB-05) devuelve PagoResponse[] con factura', async () => {
    expect(listarPagosDePolizaMock.name).toBe('listarPagosDePolizaMock');

    const pagos = await listarPagosDePolizaMock(api(), POLIZA_UNO_ID);

    expect(pagos).toHaveLength(2);
    expect(pagos[0]?.factura?.estado).toBe('AUTORIZADA');
    expect(pagos[1]?.factura).toBeNull();
  });

  it('pagosKeys separa detalle, factura, listado y pagos por póliza', () => {
    expect(pagosKeys.detalle('a')).not.toEqual(pagosKeys.factura('a'));
    expect(pagosKeys.lista({ pagina: 1 })).not.toEqual(pagosKeys.lista({ pagina: 2 }));
    expect(pagosKeys.listado({ pagina: 1 })).toEqual(pagosKeys.lista({ pagina: 1 }));
    expect(pagosKeys.porPoliza('a')).not.toEqual(pagosKeys.porPoliza('b'));
    expect(pagosKeys.dePoliza('a')).toEqual(pagosKeys.porPoliza('a'));
  });
});

describe('Autenticación', () => {
  const llamadas: Array<[string, (cliente: ApiClient) => Promise<unknown>]> = [
    ['cobrarEnCaja', (cliente) => cobrarEnCaja(cliente, SOLICITUD)],
    ['obtenerPago', (cliente) => obtenerPago(cliente, PAGO_UNO_ID)],
    ['obtenerFacturaDePago', (cliente) => obtenerFacturaDePago(cliente, PAGO_UNO_ID)],
    ['listarPagosMock', (cliente) => listarPagosMock(cliente, {})],
    ['listarPagosDePolizaMock', (cliente) => listarPagosDePolizaMock(cliente, POLIZA_UNO_ID)],
  ];

  it.each(llamadas)('%s devuelve 401 sin token', async (_nombre, llamada) => {
    await expect(llamada(apiSinToken())).rejects.toMatchObject({ status: 401 });
  });
});
