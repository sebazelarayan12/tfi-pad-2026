import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, expect, expectTypeOf, it } from 'vitest';
import {
  ApiError,
  consultarPoliza,
  crearPagoPublico,
  createApiClient,
  cuponPublicoMock,
  estadoPagoPublicoMock,
  listarMediosPagoMock,
  obtenerFacturaPublica,
  publicoKeys,
  type ConsultaEstadoPagoRequest,
  type ConsultaPublicaRequest,
  type ConsultaPublicaResponse,
  type CuponPublicoRequest,
  type FacturaPublica,
  type PagoPublicoRequest,
  type PagoPublicoResponse,
  type PublicoFacturaRequest,
} from '@nexa/api';
import type { CuponPagoFacilResponse as CuponPagoFacilT30 } from '../../src/dto/pagofacil';
import type { FacturaResponse as FacturaPagos } from '../../src/dto/pagos';
import type {
  CuponPagoFacilResponse as CuponPublico,
  FacturaResponse as FacturaPublico,
} from '../../src/dto/publico';
import { variantesPublico as variantes } from '../../mocks/handlers/publico';
import { servidorMock } from '../../mocks/server';

const baseUrl = 'https://api.test';
const anonimo = createApiClient({ baseUrl });

const consultaBody: ConsultaPublicaRequest = { dni: '30123456', numeroPoliza: 'POL-0000001' };
const pagoBody: PagoPublicoRequest = {
  dni: '30123456',
  numeroPoliza: 'POL-0000001',
  cuotaIds: ['f1000000-0000-0000-0000-000000000002'],
  proveedor: 'pasarela1',
};
const facturaBody: PublicoFacturaRequest = { dni: '30123456', numeroPago: 'PAG-6f1c2a' };
const cuponBody: CuponPublicoRequest = {
  dni: '30123456',
  numeroPoliza: 'POL-0000001',
  numeroCuota: 2,
};
const estadoBody: ConsultaEstadoPagoRequest = { dni: '30123456', numeroPago: 'PAG-6f1c2a' };

const mensajeNoEncontrado = 'No se encontró un registro con los datos indicados.';
const mensajeRateLimit = 'Se superó el límite de intentos. Volvé a intentarlo en un minuto.';

beforeAll(() => servidorMock.listen({ onUnhandledRequest: 'error' }));
afterEach(() => servidorMock.resetHandlers());
afterAll(() => servidorMock.close());

async function capturar(promesa: Promise<unknown>): Promise<ApiError> {
  try {
    await promesa;
  } catch (error) {
    if (error instanceof ApiError) return error;
    throw error;
  }
  throw new Error('Se esperaba un ApiError.');
}

it('POST consulta devuelve ConsultaPublicaResponse VIGENTE con coberturaVigente true', async () => {
  const respuesta = await consultarPoliza(anonimo, consultaBody);

  expect(respuesta.numeroPoliza).toBe('POL-0000001');
  expect(respuesta.estado).toBe('VIGENTE');
  expect(respuesta.coberturaVigente).toBe(true);
  expect(respuesta.cuotas.map((cuota) => cuota.numero)).toEqual([1, 2, 3]);
  expect(respuesta.cuotas[0]).toMatchObject({ estado: 'PAGADA', total: 12000 });
  expectTypeOf(respuesta).toEqualTypeOf<ConsultaPublicaResponse>();
});

it('POST consulta no envía Authorization (anónimo)', async () => {
  let authorization: string | null = 'no-interceptado';
  servidorMock.use(
    http.post('*/api/publico/consulta', ({ request }) => {
      authorization = request.headers.get('Authorization');
      return HttpResponse.json<ConsultaPublicaResponse>({
        numeroPoliza: 'POL-0000001',
        estado: 'VIGENTE',
        coberturaVigente: true,
        vigenteDesde: '2026-10-15',
        vigenteHasta: '2027-04-15',
        plan: { codigo: 'RC', nombre: 'Responsabilidad Civil' },
        vehiculo: { patente: 'AB123CD', marca: 'Toyota', modelo: 'Corolla XEi', anio: 2021 },
        cuotas: [],
      });
    }),
  );

  await consultarPoliza(anonimo, consultaBody);

  expect(authorization).toBeNull();
});

it('POST consulta devuelve 400 con errors.Dni "El DNI debe tener 8 dígitos."', async () => {
  servidorMock.use(variantes.consultaDniInvalido);

  const error = await capturar(consultarPoliza(anonimo, { ...consultaBody, dni: '123' }));

  expect(error.status).toBe(400);
  expect(error.errors?.Dni).toEqual(['El DNI debe tener 8 dígitos.']);
});

it('POST consulta devuelve 400 con errors.NumeroPoliza "El número de póliza debe tener el formato POL-0000000."', async () => {
  servidorMock.use(variantes.consultaNumeroInvalido);

  const error = await capturar(
    consultarPoliza(anonimo, { ...consultaBody, numeroPoliza: 'pol-0000001' }),
  );

  expect(error.status).toBe(400);
  expect(error.errors?.NumeroPoliza).toEqual([
    'El número de póliza debe tener el formato POL-0000000.',
  ]);
});

it('POST consulta devuelve 400 con textos de ASP.NET para campos vacíos', async () => {
  servidorMock.use(variantes.consultaCamposVacios);

  const error = await capturar(consultarPoliza(anonimo, { dni: '', numeroPoliza: '' }));

  expect(error.status).toBe(400);
  expect(error.errors).toEqual({
    Dni: ['The Dni field is required.'],
    NumeroPoliza: ['The NumeroPoliza field is required.'],
  });
});

it('POST consulta devuelve 404 con el mensaje genérico', async () => {
  servidorMock.use(variantes.consultaNoEncontrada);

  const error = await capturar(consultarPoliza(anonimo, consultaBody));

  expect(error.status).toBe(404);
  expect(error.detail).toBe(mensajeNoEncontrado);
  expect(error.codigo).toBeNull();
});

it('POST consulta devuelve 429 con detail fijo y sin Retry-After', async () => {
  servidorMock.use(variantes.consulta429);

  const respuesta = await fetch(`${baseUrl}/api/publico/consulta`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(consultaBody),
  });

  expect(respuesta.status).toBe(429);
  expect(respuesta.headers.get('Retry-After')).toBeNull();
  await expect(respuesta.json()).resolves.toMatchObject({
    status: 429,
    detail: mensajeRateLimit,
  });
});

it('POST consulta no reintenta ante 429 (una request)', async () => {
  let peticiones = 0;
  const alIniciarPeticion = ({ request }: { request: Request }) => {
    if (request.method === 'POST' && new URL(request.url).pathname === '/api/publico/consulta') {
      peticiones += 1;
    }
  };
  servidorMock.events.on('request:start', alIniciarPeticion);
  servidorMock.use(variantes.consulta429);

  try {
    await expect(consultarPoliza(anonimo, consultaBody)).rejects.toMatchObject({ status: 429 });
    expect(peticiones).toBe(1);
  } finally {
    servidorMock.events.removeListener('request:start', alIniciarPeticion);
  }
});

it('POST pagos devuelve 201 con PagoPublicoResponse', async () => {
  const respuesta = await anonimo.post('/api/publico/pagos', pagoBody, { responseType: 'raw' });
  const cuerpo = JSON.parse(respuesta.texto) as PagoPublicoResponse;

  expect(respuesta.status).toBe(201);
  expect(cuerpo.numeroPago).toBe('PAG-6f1c2a');
  expect(cuerpo.idPago).toBe('f3000000-0000-0000-0000-000000000001');
  expect(cuerpo.urlPago).toContain('pasarela1.example');
  expect(cuerpo.fechaExpiracion).toBe('2026-10-30T21:00:00Z');
});

const erroresNegocio = [
  {
    caso: 'proveedor inválido',
    handler: variantes.pagoProveedorInvalido,
    detail: 'El proveedor de pago indicado no existe.',
  },
  {
    caso: 'cuotas de otra póliza',
    handler: variantes.pagoCuotasDeOtraPoliza,
    detail: 'Todas las cuotas deben pertenecer a la póliza indicada.',
  },
  {
    caso: 'cuota pagada o anulada',
    handler: variantes.pagoCuotaNoPagable,
    detail: 'Solo se pueden pagar cuotas pendientes o vencidas (RN11).',
  },
  {
    caso: 'cuota con pago en curso',
    handler: variantes.pagoEnCurso,
    detail: 'Alguna de las cuotas ya tiene un pago en curso. Intente de nuevo más tarde.',
  },
  {
    caso: 'cuotas repetidas',
    handler: variantes.pagoCuotasRepetidas,
    detail: 'Las cuotas no pueden repetirse.',
  },
];

it.each(erroresNegocio)(
  'POST pagos devuelve 400 de negocio: $caso',
  async ({ handler, detail }) => {
    servidorMock.use(handler);

    await expect(crearPagoPublico(anonimo, pagoBody)).rejects.toMatchObject({
      status: 400,
      detail,
    });
  },
);

it.each([
  ['DNI inválido', variantes.pagoDniInvalido, 'Dni'],
  ['demasiadas cuotas', variantes.pagoDemasiadasCuotas, 'CuotaIds'],
  ['proveedor vacío', variantes.pagoProveedorValidacion, 'Proveedor'],
] as const)('POST pagos devuelve 400 de validación: %s', async (_caso, handler, clave) => {
  servidorMock.use(handler);

  const error = await capturar(crearPagoPublico(anonimo, pagoBody));

  expect(error.status).toBe(400);
  expect(error.errors?.[clave]).toBeDefined();
});

it('POST pagos devuelve 404 genérico', async () => {
  servidorMock.use(variantes.pagoNoEncontrado);

  const error = await capturar(crearPagoPublico(anonimo, pagoBody));

  expect(error.status).toBe(404);
  expect(error.detail).toBe(mensajeNoEncontrado);
});

it('POST pagos devuelve 429', async () => {
  servidorMock.use(variantes.pagoRateLimit);

  const error = await capturar(crearPagoPublico(anonimo, pagoBody));

  expect(error.status).toBe(429);
  expect(error.detail).toBe(mensajeRateLimit);
});

it('POST pagos devuelve 502 y no reintenta (una request)', async () => {
  let peticiones = 0;
  const alIniciarPeticion = ({ request }: { request: Request }) => {
    if (request.method === 'POST' && new URL(request.url).pathname === '/api/publico/pagos') {
      peticiones += 1;
    }
  };
  servidorMock.events.on('request:start', alIniciarPeticion);
  servidorMock.use(variantes.pagoPasarelaCaida);

  try {
    await expect(crearPagoPublico(anonimo, pagoBody)).rejects.toMatchObject({ status: 502 });
    expect(peticiones).toBe(1);
  } finally {
    servidorMock.events.removeListener('request:start', alIniciarPeticion);
  }
});

it('POST pagos rechaza proveedor distinto de pasarela1 o pasarela2 (tipo y validación)', async () => {
  expectTypeOf<PagoPublicoRequest['proveedor']>().toEqualTypeOf<'pasarela1' | 'pasarela2'>();
  servidorMock.use(variantes.pagoProveedorInvalido);

  const error = await capturar(
    crearPagoPublico(anonimo, {
      ...pagoBody,
      proveedor: 'pasarela3' as PagoPublicoRequest['proveedor'],
    }),
  );

  expect(error.status).toBe(400);
  expect(error.detail).toBe('El proveedor de pago indicado no existe.');
});

it('POST factura devuelve FacturaResponse AUTORIZADA', async () => {
  const factura = await obtenerFacturaPublica(anonimo, facturaBody);

  expect(factura.tipo).toBe('B');
  expect(factura.estado).toBe('AUTORIZADA');
  expect(factura.cae).toBe('12345678901234');
  expect(factura.vencimientoCae).toBe('2026-11-20');
  expectTypeOf(factura).toEqualTypeOf<FacturaPublica>();
});

it('POST factura devuelve PENDIENTE_CAE sin CAE (variante)', async () => {
  servidorMock.use(variantes.facturaPendienteCae);

  const factura = await obtenerFacturaPublica(anonimo, facturaBody);

  expect(factura.estado).toBe('PENDIENTE_CAE');
  expect(factura.cae).toBeNull();
  expect(factura.vencimientoCae).toBeNull();
});

it.each(['PAG-pendiente', 'PAG-rechazado'])(
  'POST factura devuelve 404 genérico para %s (mismo mensaje)',
  async (numeroPago) => {
    servidorMock.use(variantes.facturaNoEncontrada);

    const error = await capturar(obtenerFacturaPublica(anonimo, { ...facturaBody, numeroPago }));

    expect(error.status).toBe(404);
    expect(error.detail).toBe(mensajeNoEncontrado);
  },
);

it('POST factura devuelve 400 con errors.Dni', async () => {
  servidorMock.use(variantes.facturaValidacion);

  const error = await capturar(obtenerFacturaPublica(anonimo, { ...facturaBody, dni: '123' }));

  expect(error.status).toBe(400);
  expect(error.errors?.Dni).toEqual(['El DNI debe tener 8 dígitos.']);
});

it('POST factura devuelve 429', async () => {
  servidorMock.use(variantes.facturaRateLimit);

  const error = await capturar(obtenerFacturaPublica(anonimo, facturaBody));

  expect(error.status).toBe(429);
  expect(error.detail).toBe(mensajeRateLimit);
});

it('Mock cupón (PB-02) devuelve el DTO con totalCuotas null y la fecha del DTO (MOCK)', async () => {
  const cupon = await cuponPublicoMock(anonimo, cuponBody);

  expect(cupon.numeroCuota).toBe(2);
  expect(cupon.totalCuotas).toBeNull();
  expect(cupon.fechaSegundoVencimiento).toBe('2026-12-20');
  expect(cupon.codigoBarras).toHaveLength(42);
});

it('Mock cupón (PB-02) devuelve 400 para cuota pagada (MOCK)', async () => {
  servidorMock.use(variantes.cuponCuotaPagada);

  const error = await capturar(cuponPublicoMock(anonimo, cuponBody));

  expect(error.status).toBe(400);
  expect(error.detail).toContain('Pagada');
});

it('Mock cupón (PB-02) devuelve 404 genérico (MOCK)', async () => {
  servidorMock.use(variantes.cuponNoEncontrado);

  const error = await capturar(cuponPublicoMock(anonimo, cuponBody));

  expect(error.status).toBe(404);
  expect(error.detail).toBe(mensajeNoEncontrado);
});

it('Mock estado de pago (PB-01) usa DNI en el cuerpo y nunca en la URL', async () => {
  let dniEnCuerpo: string | undefined;
  let urlSinDni = false;
  servidorMock.use(
    http.post('*/api/publico/pagos/estado', async ({ request }) => {
      const body = (await request.json()) as ConsultaEstadoPagoRequest;
      dniEnCuerpo = body.dni;
      urlSinDni = !new URL(request.url).searchParams.has('dni');
      return HttpResponse.json({
        numeroPago: 'PAG-6f1c2a',
        estado: 'APROBADO',
        fechaAcreditacion: '2026-10-30T20:55:00Z',
        urlPago: null,
        factura: null,
      });
    }),
  );

  const estado = await estadoPagoPublicoMock(anonimo, estadoBody);

  expect(dniEnCuerpo).toBe('30123456');
  expect(urlSinDni).toBe(true);
  expect(estado.estado).toBe('APROBADO');
});

it.each([
  ['pendiente', variantes.estadoPendiente, 'PENDIENTE'],
  ['rechazado', variantes.estadoRechazado, 'RECHAZADO'],
] as const)('Mock estado de pago (PB-01) devuelve %s (MOCK)', async (_caso, handler, estado) => {
  servidorMock.use(handler);

  await expect(estadoPagoPublicoMock(anonimo, estadoBody)).resolves.toMatchObject({ estado });
});

it('Mock medios de pago (PB-22) devuelve nombres provisionales y no los fija en el código', async () => {
  const medios = await listarMediosPagoMock(anonimo);

  expect(medios).toEqual([
    { proveedor: 'pasarela1', nombre: 'Pasarela A', orden: 1, activo: true },
    { proveedor: 'pasarela2', nombre: 'Pasarela B', orden: 2, activo: true },
  ]);

  servidorMock.use(
    http.get('*/api/publico/medios-pago', () =>
      HttpResponse.json([
        { proveedor: 'pasarela2', nombre: 'Nombre configurable', orden: 1, activo: true },
      ]),
    ),
  );
  const configurados = await listarMediosPagoMock(anonimo);

  expect(configurados[0]?.nombre).toBe('Nombre configurable');
});

it('Mock medios de pago (PB-22) admite la lista vacía (MOCK)', async () => {
  servidorMock.use(variantes.mediosPagoVacios);

  await expect(listarMediosPagoMock(anonimo)).resolves.toEqual([]);
});

it('las copias de FacturaResponse y CuponPagoFacilResponse tienen la misma forma que sus dueños', () => {
  expectTypeOf<FacturaPublico>().toEqualTypeOf<FacturaPagos>();
  expectTypeOf<CuponPublico>().toEqualTypeOf<CuponPagoFacilT30>();
});

it('expone claves de caché propias de la API pública', () => {
  expect(publicoKeys.mediosPago()).toEqual(['publico', 'mediosPago']);
  expect(publicoKeys.cupon('POL-0000001', 'f1000000-0000-0000-0000-000000000002')).toEqual([
    'publico',
    'cupon',
    'POL-0000001',
    'f1000000-0000-0000-0000-000000000002',
  ]);
});
