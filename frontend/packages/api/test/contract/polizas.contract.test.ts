import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  buscarPolizasMock,
  cancelarPoliza,
  createApiClient,
  emitirPoliza,
  listarCuotasDePoliza,
  listarPolizas,
  obtenerPoliza,
  type ApiClient,
  type EstadoPolizaNombre,
  type PolizaDetalleResponse,
  type PolizaFiltroQuery,
  type PolizaListItemResponse,
} from '../../src';
import {
  POLIZA_UNO_ID,
  busquedaSinResultados,
  cancelarEstadoInvalido,
  cuotasPolizaNoExiste,
  emitirCotizacionNoExiste,
  emitirErrorNegocio,
  emitirErrorRed,
  polizaNoExiste,
} from '../../mocks/handlers/polizas';
import { servidorMock } from '../../mocks/server';

const API_URL = 'https://api.test';
const COTIZACION_ID = 'e1000000-0000-0000-0000-000000000001';
const SOLICITUD = { cotizacionId: COTIZACION_ID, vigenciaMeses: 6 } as const;

function api(): ApiClient {
  return createApiClient({ baseUrl: API_URL, getToken: () => 'token' });
}

function apiSinToken(): ApiClient {
  return createApiClient({ baseUrl: API_URL });
}

const DETALLES_NEGOCIO = [
  'La cotización está vencida (RN06).',
  'La cotización ya se usó para emitir una póliza.',
  'La cotización no tiene cliente ni vehículo registrados: no se puede emitir una póliza desde una cotización externa.',
  'El cliente de la cotización no existe o no está activo.',
  'El cliente no está validado en Renaper (RN02).',
  'El vehículo de la cotización no existe o no está activo.',
  'El vehículo no está validado en DNRPA (RN03).',
  'El vehículo no pertenece al cliente de la cotización (RN03).',
  'El vehículo AB123CD ya tiene una póliza pendiente, vigente o suspendida (RN04).',
  'El plan de la cotización no existe o no está activo.',
  'El plan RC no acepta vehículos de tipo Particular (RN05).',
  'El plan RC acepta vehículos de hasta 10 años y este tiene 12 (RN05).',
  'La vigencia debe ser de 1, 6 o 12 meses.',
  'La prima mensual debe ser mayor que cero.',
  'Otra emisión con la misma cotización o el mismo vehículo se guardó al mismo tiempo (RN04). Recargue los datos.',
];

const CASOS_FILTRO: Array<[string, PolizaFiltroQuery, string]> = [
  ['pagina fuera de rango', { pagina: 0 }, 'Pagina'],
  ['tamano fuera de rango', { tamano: 101 }, 'Tamano'],
  ['estado inexistente', { estado: 'Inexistente' as unknown as EstadoPolizaNombre }, 'Estado'],
];

const CASOS_MOTIVO: Array<[string, string]> = [
  ['vacío', ''],
  ['solo espacios', '   '],
  ['201 caracteres', 'a'.repeat(201)],
];

beforeAll(() => servidorMock.listen({ onUnhandledRequest: 'error' }));
afterEach(() => servidorMock.resetHandlers());
afterAll(() => servidorMock.close());

describe('POST /api/polizas', () => {
  it('devuelve 201 con PolizaDetalleResponse', async () => {
    const crudo = await api().post('/api/polizas', SOLICITUD, { responseType: 'raw' });
    const poliza = JSON.parse(crudo.texto) as PolizaDetalleResponse;

    expect(crudo.status).toBe(201);
    expect(poliza.numero).toBe('POL-0000001');
    expect(poliza.estado).toBe(1);
    expect(poliza.codigoPlan).toBe('RC');
    expect(poliza.cuotas).toHaveLength(6);
  });

  it('devuelve 404 con el detail de cotización inexistente', async () => {
    servidorMock.use(emitirCotizacionNoExiste);

    await expect(emitirPoliza(api(), SOLICITUD)).rejects.toMatchObject({
      status: 404,
      detail: `La cotización ${COTIZACION_ID} no existe.`,
    });
  });

  it.each(DETALLES_NEGOCIO)('devuelve 400 de negocio: %s', async (detail) => {
    servidorMock.use(emitirErrorNegocio(detail));

    await expect(emitirPoliza(api(), SOLICITUD)).rejects.toMatchObject({
      status: 400,
      detail,
    });
  });

  it('devuelve 400 de validación cuando el body no deserializa', async () => {
    const respuesta = await fetch(`${API_URL}/api/polizas`, {
      method: 'POST',
      headers: { Authorization: 'Bearer token', 'Content-Type': 'application/json' },
      body: '{',
    });
    const cuerpo = (await respuesta.json()) as { errors?: Record<string, string[]> };

    expect(respuesta.status).toBe(400);
    expect(cuerpo.errors).toEqual({ $: expect.any(Array) });
  });

  it('no reintenta ante 502', async () => {
    let peticiones = 0;
    const alIniciarPeticion = ({ request }: { request: Request }) => {
      if (request.method === 'POST' && new URL(request.url).pathname === '/api/polizas') {
        peticiones += 1;
      }
    };
    servidorMock.events.on('request:start', alIniciarPeticion);
    servidorMock.use(emitirErrorRed);

    try {
      await expect(emitirPoliza(api(), SOLICITUD)).rejects.toMatchObject({ status: 502 });
      expect(peticiones).toBe(1);
    } finally {
      servidorMock.events.removeListener('request:start', alIniciarPeticion);
    }
  });
});

describe('GET /api/polizas', () => {
  it('devuelve PaginaResponse con tamanoPagina y no tamano', async () => {
    const pagina = await listarPolizas(api(), { pagina: 1, tamano: 10 });

    expect(pagina.items).toHaveLength(2);
    expect(pagina.pagina).toBe(1);
    expect(pagina.tamanoPagina).toBe(10);
    expect(pagina.total).toBe(2);
    expect(pagina).not.toHaveProperty('tamano');
  });

  it('envía estado como nombre en la query y lee el número en el resultado', async () => {
    let estadoRecibido: string | null = null;
    const item: PolizaListItemResponse = {
      id: POLIZA_UNO_ID,
      numero: 'POL-0000001',
      clienteId: 'c1000000-0000-0000-0000-000000000001',
      clienteNombre: 'Juan Carlos Pérez',
      patente: 'AB123CD',
      vehiculoMarca: 'Toyota',
      vehiculoModelo: 'Corolla XEi',
      vehiculoAnio: 2021,
      codigoPlan: 'RC',
      primaMensual: 12000,
      fechaInicio: '2026-11-01',
      fechaFin: '2027-05-01',
      estado: 1,
      proximoVencimiento: '2027-01-10',
    };

    servidorMock.use(
      http.get('*/api/polizas', ({ request }) => {
        estadoRecibido = new URL(request.url).searchParams.get('estado');
        return HttpResponse.json({ items: [item], pagina: 1, tamanoPagina: 20, total: 1 });
      }),
    );

    const pagina = await listarPolizas(api(), { estado: 'Vigente' });

    expect(estadoRecibido).toBe('Vigente');
    expect(pagina.items[0]?.estado).toBe(1);
  });

  it.each(CASOS_FILTRO)(
    'devuelve 400 de validación con errors (%s)',
    async (_caso, filtro, clave) => {
      await expect(listarPolizas(api(), filtro)).rejects.toMatchObject({
        status: 400,
        errors: { [clave]: expect.any(Array) },
      });
    },
  );
});

describe('GET /api/polizas/{id}', () => {
  it('devuelve PolizaDetalleResponse', async () => {
    const poliza: PolizaDetalleResponse = await obtenerPoliza(api(), POLIZA_UNO_ID);

    expect(poliza.id).toBe(POLIZA_UNO_ID);
    expect(poliza.numero).toBe('POL-0000001');
    expect(poliza.marca).toBe('Toyota');
    expect(poliza.estado).toBe(1);
  });

  it('devuelve 404 con el detail "La póliza {id} no existe."', async () => {
    servidorMock.use(polizaNoExiste);

    await expect(obtenerPoliza(api(), 'no-existe')).rejects.toMatchObject({
      status: 404,
      detail: 'La póliza no-existe no existe.',
    });
  });
});

describe('GET /api/polizas/{id}/cuotas', () => {
  it('devuelve CuotaResponse[] ordenadas por numero', async () => {
    const cuotas = await listarCuotasDePoliza(api(), POLIZA_UNO_ID);

    expect(cuotas).toHaveLength(6);
    expect(cuotas.map((cuota) => cuota.numero)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(cuotas[0]?.estado).toBe(2);
    expect(cuotas[0]?.fechaPago).toBe('2026-12-03T13:10:00');
    expect(cuotas[1]?.estado).toBe(0);
  });

  it('devuelve 404 si la póliza no existe', async () => {
    servidorMock.use(cuotasPolizaNoExiste);

    await expect(listarCuotasDePoliza(api(), 'no-existe')).rejects.toMatchObject({
      status: 404,
      detail: 'La póliza no-existe no existe.',
    });
  });
});

describe('POST /api/polizas/{id}/cancelar', () => {
  it('devuelve 200 y las cuotas impagas en estado 3', async () => {
    const poliza = await cancelarPoliza(api(), POLIZA_UNO_ID, {
      motivo: 'Cliente solicitó la baja',
    });

    expect(poliza.estado).toBe(3);
    expect(poliza.cuotas.filter((cuota) => cuota.estado === 3)).toHaveLength(5);
    expect(poliza.cuotas[0]?.estado).toBe(2);
  });

  it.each(CASOS_MOTIVO)(
    'devuelve 400 de validación con errors.Motivo (%s)',
    async (_caso, motivo) => {
      await expect(cancelarPoliza(api(), POLIZA_UNO_ID, { motivo })).rejects.toMatchObject({
        status: 400,
        errors: { Motivo: expect.any(Array) },
      });
    },
  );

  it('devuelve 400 con el detail de transición inválida', async () => {
    servidorMock.use(cancelarEstadoInvalido);

    await expect(
      cancelarPoliza(api(), POLIZA_UNO_ID, { motivo: 'Cliente solicitó la baja' }),
    ).rejects.toMatchObject({
      status: 400,
      detail: 'No se puede pasar una póliza de Vencida a Cancelada.',
    });
  });

  it('devuelve 404 si la póliza no existe', async () => {
    servidorMock.use(polizaNoExiste);

    await expect(
      cancelarPoliza(api(), 'no-existe', { motivo: 'Cliente solicitó la baja' }),
    ).rejects.toMatchObject({
      status: 404,
      detail: 'La póliza no-existe no existe.',
    });
  });
});

describe('Mocks de PB-06 y PB-24', () => {
  it('la búsqueda mock (PB-06) tiene nombre de función mock y devuelve PaginaResponse', async () => {
    expect(buscarPolizasMock.name).toBe('buscarPolizasMock');

    const pagina = await buscarPolizasMock(api(), { numero: 'POL-0000001' });
    expect(pagina.total).toBe(1);
    expect(pagina.items[0]?.numero).toBe('POL-0000001');

    servidorMock.use(busquedaSinResultados);
    const vacia = await buscarPolizasMock(api(), { numero: 'POL-9999999' });
    expect(vacia.items).toEqual([]);
    expect(vacia.total).toBe(0);
  });
});

describe('Autenticación', () => {
  const llamadas: Array<[string, (cliente: ApiClient) => Promise<unknown>]> = [
    ['emitirPoliza', (cliente) => emitirPoliza(cliente, SOLICITUD)],
    ['listarPolizas', (cliente) => listarPolizas(cliente)],
    ['obtenerPoliza', (cliente) => obtenerPoliza(cliente, POLIZA_UNO_ID)],
    ['listarCuotasDePoliza', (cliente) => listarCuotasDePoliza(cliente, POLIZA_UNO_ID)],
    [
      'cancelarPoliza',
      (cliente) => cancelarPoliza(cliente, POLIZA_UNO_ID, { motivo: 'Cliente solicitó la baja' }),
    ],
  ];

  it.each(llamadas)('%s devuelve 401 sin token', async (_nombre, llamada) => {
    await expect(llamada(apiSinToken())).rejects.toMatchObject({ status: 401 });
  });
});
