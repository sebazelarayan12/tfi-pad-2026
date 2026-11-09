import { http, HttpResponse } from 'msw';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from 'vitest';
import {
  createApiClient,
  listarVehiculosDeCliente,
  obtenerVehiculo,
  crearVehiculo,
  cotizarVehiculo,
  obtenerCotizacion,
  previsualizarDnrpaMock,
  vehiculosKeys,
  cotizacionesKeys,
  type ApiClient,
  type OpcionCotizacion,
  type OpcionCotizacionMock,
  type VehiculoAltaRequest,
} from '../index';
import {
  CLIENTE_JUAN_ID,
  CLIENTE_LUCIA_ID,
  CLIENTE_INACTIVO_ID,
  tokensMockClientes,
} from '../../mocks/fixtures/clientes';
import {
  crearEstadoVehiculos,
  VEHICULO_ID,
  VEHICULO_BAJA_ID,
  COTIZACION_ID,
  GUID_VACIO,
} from '../../mocks/fixtures/vehiculos';
import { crearHandlersVehiculos, variantesVehiculos } from '../../mocks/handlers/vehiculos';
import {
  crearHandlersCotizaciones,
  variantesCotizaciones,
} from '../../mocks/handlers/cotizaciones';
import { servidorMock } from '../../mocks/server';

const api = createApiClient({
  baseUrl: 'https://api.test',
  getToken: () => tokensMockClientes.empleado,
});
const alta: VehiculoAltaRequest = {
  clienteId: CLIENTE_JUAN_ID,
  patente: 'AE789FG',
  uso: 0,
  marca: 'Toyota',
  modelo: 'Hilux SRX',
  anio: 2023,
  tipo: 2,
  numeroMotor: 'MOT123456',
  numeroChasis: 'CHA123456',
};
const reloj = new Date('2026-11-06T18:00:00Z');
beforeAll(() => servidorMock.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  const estado = crearEstadoVehiculos();
  servidorMock.use(
    ...crearHandlersVehiculos(estado),
    ...crearHandlersCotizaciones(estado, () => reloj),
  );
});
afterEach(() => {
  servidorMock.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => servidorMock.close());

describe('vehículos', () => {
  it('lista solo activos del cliente en orden de patente, incluyendo un alta posterior', async () => {
    expect((await listarVehiculosDeCliente(api, CLIENTE_JUAN_ID)).map((v) => v.id)).toEqual([
      VEHICULO_ID,
    ]);
    await crearVehiculo(api, alta);
    expect((await listarVehiculosDeCliente(api, CLIENTE_JUAN_ID)).map((v) => v.patente)).toEqual([
      'AB123CD',
      'AE789FG',
    ]);
    expect(await listarVehiculosDeCliente(api, CLIENTE_LUCIA_ID)).toEqual([]);
    expect(await listarVehiculosDeCliente(api, GUID_VACIO.replace(/0$/, '9'))).toEqual([]);
  });
  it.each(['', GUID_VACIO])('sin clienteId válido %s devuelve el 400 personalizado', async (id) => {
    await expect(listarVehiculosDeCliente(api, id)).rejects.toMatchObject({
      status: 400,
      detail: "El parámetro 'clienteId' es obligatorio.",
    });
  });
  it('clienteId inválido responde validación de binding', async () => {
    await expect(listarVehiculosDeCliente(api, 'texto')).rejects.toMatchObject({
      status: 400,
      errors: { clienteId: expect.any(Array) },
    });
  });
  it('detalle de baja permanece consultable', async () => {
    expect(await obtenerVehiculo(api, VEHICULO_BAJA_ID)).toMatchObject({ activo: false });
  });
  it('detalle inexistente devuelve 404 y el identificador', async () => {
    await expect(obtenerVehiculo(api, GUID_VACIO)).rejects.toMatchObject({
      status: 404,
      detail: `El vehículo ${GUID_VACIO} no existe.`,
    });
  });
  it('ruta sin Guid no devuelve un error de negocio', async () => {
    const response = await fetch('https://api.test/api/vehiculos/texto', {
      headers: { Authorization: 'Bearer mock' },
    });
    expect(response.status).toBe(404);
    expect(await response.text()).toBe('');
  });
  it('alta normaliza en MSW y permite consultar el vehículo nuevo y cotizarlo', async () => {
    const cuerpo = Object.freeze({ ...alta, patente: ' ae789fg ' });
    const creado = await crearVehiculo(api, cuerpo);
    expect(cuerpo.patente).toBe(' ae789fg ');
    expect(creado).toMatchObject({
      clienteId: alta.clienteId,
      patente: 'AE789FG',
      uso: 0,
      tipo: 2,
      marca: 'Toyota',
      modelo: 'Hilux SRX',
      anio: 2023,
      activo: true,
      validadoDnrpa: false,
    });
    expect(await obtenerVehiculo(api, creado.id)).toEqual(creado);
    expect(
      (await cotizarVehiculo(api, { vehiculoId: creado.id })).opciones.map((v) => v.primaMensual),
    ).toEqual([14400, 21600, 36000]);
  });
  it.each([
    [{ ...alta, patente: '' }, 'Patente'],
    [{ clienteId: CLIENTE_JUAN_ID, patente: 'AE789FG' }, 'Uso'],
    [{ ...alta, uso: 'Particular' }, 'Uso'],
    [{ ...alta, clienteId: 'texto' }, 'ClienteId'],
  ])('validación de alta preserva PascalCase %#', async (cuerpo, campo) => {
    await expect(api.post('/api/vehiculos', cuerpo)).rejects.toMatchObject({
      status: 400,
      errors: { [campo]: expect.any(Array) },
    });
  });
  it.each([
    [
      { ...alta, patente: 'AB12CDE' },
      "La patente 'AB12CDE' no tiene un formato válido (AA000AA o AAA000).",
    ],
    [{ ...alta, uso: 9 }, 'El uso del vehículo es obligatorio y debe ser válido.'],
    [
      { ...alta, clienteId: CLIENTE_INACTIVO_ID },
      `El cliente ${CLIENTE_INACTIVO_ID} está dado de baja.`,
    ],
    [
      { ...alta, patente: 'AB123CD' },
      "Ya existe un vehículo registrado con la patente 'AB123CD' (RN03).",
    ],
    [
      { ...alta, patente: 'ABC123' },
      "Ya existe un vehículo registrado con la patente 'ABC123' (RN03).",
    ],
  ])('alta rechaza sin persistir cada regla de negocio %#', async (cuerpo, detail) => {
    await expect(api.post('/api/vehiculos', cuerpo)).rejects.toMatchObject({ status: 400, detail });
    expect(await listarVehiculosDeCliente(api, CLIENTE_JUAN_ID)).toHaveLength(1);
  });
  it('alta con cliente inexistente devuelve 404', async () => {
    await expect(crearVehiculo(api, { ...alta, clienteId: GUID_VACIO })).rejects.toMatchObject({
      status: 404,
      detail: `El cliente ${GUID_VACIO} no existe.`,
    });
  });
  it('DNRPA caído devuelve 502 sin depender de su texto', async () => {
    servidorMock.use(variantesVehiculos.altaDnrpaCaido);
    await expect(crearVehiculo(api, alta)).rejects.toMatchObject({ status: 502 });
  });
  it('DNRPA SOLO MOCK enmascara el titular y no filtra datos registrales privados', async () => {
    const vista = await previsualizarDnrpaMock(api, 'AB123CD');
    expect(vista.titularDniEnmascarado).toBe('***.456');
    expect(vista.coincideConCliente).toBeNull();
    expect(JSON.stringify(vista)).not.toMatch(/30123456|titularNombre|numeroMotor|numeroChasis/);
  });
});

describe('cotizaciones', () => {
  it('POST devuelve opciones ordenadas y GET recupera cada id sin datos mock en el detalle', async () => {
    const resultado = await cotizarVehiculo(api, { vehiculoId: VEHICULO_ID });
    expect(resultado.fechaVencimiento).toBe('2026-11-21T18:00:00.000Z');
    expect(resultado.opciones.map((v) => v.codigoPlan)).toEqual(['RC', 'TC', 'TR']);
    expect(resultado.opciones.map((v) => v.primaMensual)).toEqual([12000, 18000, 30000]);
    for (const opcion of resultado.opciones) {
      const detalle = await obtenerCotizacion(api, opcion.idCotizacion);
      expect(detalle).toMatchObject({
        id: opcion.idCotizacion,
        codigoPlan: opcion.codigoPlan,
        primaMensual: opcion.primaMensual,
        clienteId: CLIENTE_JUAN_ID,
        vehiculoId: VEHICULO_ID,
        origen: 1,
        fechaVencimiento: resultado.fechaVencimiento,
      });
      expect(detalle).not.toHaveProperty('vigente');
      expect(detalle).not.toHaveProperty('calculo');
    }
  });
  it('cada POST crea ids nuevos (PB-26)', async () => {
    const a = await cotizarVehiculo(api, { vehiculoId: VEHICULO_ID });
    const b = await cotizarVehiculo(api, { vehiculoId: VEHICULO_ID });
    expect(new Set([...a.opciones, ...b.opciones].map((v) => v.idCotizacion)).size).toBe(6);
  });
  it.each([
    ['cotizarSinPlanes', 400, 'Ningún plan es compatible con el vehículo.'],
    ['cotizarClienteNoExiste', 404, `El cliente ${GUID_VACIO} del vehículo no existe.`],
  ] as const)('%s preserva el error', async (variante, status, detail) => {
    servidorMock.use(variantesCotizaciones[variante]);
    await expect(cotizarVehiculo(api, { vehiculoId: VEHICULO_ID })).rejects.toMatchObject({
      status,
      detail,
    });
  });
  it('la variante sinToken de cotizaciones responde 401', async () => {
    servidorMock.use(variantesCotizaciones.sinToken);
    await expect(cotizarVehiculo(api, { vehiculoId: VEHICULO_ID })).rejects.toMatchObject({
      status: 401,
    });
  });
  it.each([
    [VEHICULO_BAJA_ID, 400],
    [GUID_VACIO, 404],
  ] as const)('cotizar %s devuelve %s', async (id, status) => {
    await expect(cotizarVehiculo(api, { vehiculoId: id })).rejects.toMatchObject({ status });
  });
  it('cotizar sin id devuelve errors.VehiculoId', async () => {
    await expect(api.post('/api/cotizaciones', {})).rejects.toMatchObject({
      status: 400,
      errors: { VehiculoId: expect.any(Array) },
    });
  });
  it('POST ante 502 hace exactamente una request sin reintentos', async () => {
    let cantidad = 0;
    servidorMock.use(
      http.post('*/api/cotizaciones', () => {
        cantidad++;
        return new HttpResponse(null, { status: 502 });
      }),
    );
    await expect(cotizarVehiculo(api, { vehiculoId: VEHICULO_ID })).rejects.toMatchObject({
      status: 502,
    });
    expect(cantidad).toBe(1);
  });
  it('GET admite fecha UTC sin Z y detalle inexistente', async () => {
    expect((await obtenerCotizacion(api, COTIZACION_ID)).fechaCotizacion).toBe(
      '2026-11-06T18:00:00.000',
    );
    await expect(obtenerCotizacion(api, GUID_VACIO)).rejects.toMatchObject({
      status: 404,
      detail: `La cotización ${GUID_VACIO} no existe.`,
    });
  });
  it('calculo es opcional y no pertenece al contrato real', () => {
    expectTypeOf<OpcionCotizacionMock>().toExtend<OpcionCotizacion>();
    expectTypeOf<OpcionCotizacionMock['calculo']>().toBeNullable();
    expectTypeOf<undefined>().toExtend<OpcionCotizacionMock['calculo']>();
    expectTypeOf<OpcionCotizacion>().not.toHaveProperty('calculo');
  });
});

const funciones: Array<[string, (cliente: ApiClient) => Promise<unknown>]> = [
  ['listar', (c) => listarVehiculosDeCliente(c, CLIENTE_JUAN_ID)],
  ['obtener vehículo', (c) => obtenerVehiculo(c, VEHICULO_ID)],
  ['crear', (c) => crearVehiculo(c, alta)],
  ['cotizar', (c) => cotizarVehiculo(c, { vehiculoId: VEHICULO_ID })],
  ['obtener cotización', (c) => obtenerCotizacion(c, COTIZACION_ID)],
];
it.each(funciones)('%s exige sesión y rol', async (_nombre, ejecutar) => {
  for (const [token, status] of [
    [null, 401],
    [tokensMockClientes.invalido, 401],
    [tokensMockClientes.sinPermiso, 403],
  ] as const) {
    await expect(
      ejecutar(createApiClient({ baseUrl: 'https://api.test', getToken: () => token })),
    ).rejects.toMatchObject({ status });
  }
});
it('requests codifican identificadores, preservan bodies y exportan las claves acordadas', async () => {
  const get = vi.fn().mockResolvedValue({});
  const post = vi.fn().mockResolvedValue({});
  const cliente = { ...api, get, post };
  await obtenerVehiculo(cliente, 'a/b?c');
  await obtenerCotizacion(cliente, 'a/b?c');
  await crearVehiculo(cliente, alta);
  expect(get.mock.calls.map((v) => v[0])).toEqual([
    '/api/vehiculos/a%2Fb%3Fc',
    '/api/cotizaciones/a%2Fb%3Fc',
  ]);
  expect(post).toHaveBeenCalledWith('/api/vehiculos', alta);
  expect(vehiculosKeys.listaPorCliente('c')).toEqual(['vehiculos', 'lista', 'c']);
  expect(vehiculosKeys.detalle('v')).toEqual(['vehiculos', 'detalle', 'v']);
  expect(cotizacionesKeys.detalle('q')).toEqual(['cotizaciones', 'detalle', 'q']);
});
