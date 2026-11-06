import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  createApiClient,
  crearCliente,
  previsualizarRenaper,
  validarRenaper,
  obtenerCliente,
  listarClientes,
  clientesKeys,
  type ClienteAltaRequest,
  type ApiClient,
} from '../index';
import {
  CLIENTE_JUAN_ID,
  CLIENTE_LUCIA_ID,
  CLIENTE_INACTIVO_ID,
  clientesFixture,
  tokensMockClientes,
} from '../../mocks/fixtures/clientes';
import { altaClienteFixture, personasRenaperFixture } from '../../mocks/fixtures/renaper';
import {
  crearHandlersClientes,
  variantesClientesAltaRenaper as variantes,
} from '../../mocks/handlers/clientes';
import { servidorMock } from '../../mocks/server';

const api = createApiClient({
  baseUrl: 'https://api.test',
  getToken: () => tokensMockClientes.empleado,
});
const alta = altaClienteFixture;
const ahora = () => new Date('2026-11-06T18:00:00Z');
beforeAll(() => servidorMock.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => servidorMock.use(...crearHandlersClientes([], { ahora })));
afterEach(() => {
  servidorMock.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => servidorMock.close());

describe('alta de clientes (T-25)', () => {
  it('201 valida con Renaper, reemplaza identidad/domicilio y persiste para CU05', async () => {
    const cuerpo = {
      ...alta,
      nombre: 'Dato ingresado',
      apellido: 'Dato ingresado',
      cuil: '11111111111',
      fechaNacimiento: '2010-07-12',
      sexo: 'F' as const,
      calle: 'Rivadavia',
      email: '  nuevo@ejemplo.com ',
      telefono: ' 3815550123 ',
    };
    const creado = await crearCliente(api, cuerpo);
    expect(creado).toMatchObject({
      ...alta,
      id: expect.any(String),
      email: 'nuevo@ejemplo.com',
      telefono: '3815550123',
      validadoRenaper: true,
      activo: true,
      fechaValidacionRenaper: ahora().toISOString(),
    });
    expect(await obtenerCliente(api, creado.id)).toEqual(creado);
    expect((await listarClientes(api, { dni: alta.dni })).total).toBe(1);
  });
  it.each([
    [{ ...alta, dni: ' 30123456 ' }, 'Dni', 'El DNI debe tener 8 dígitos.'],
    [{ ...alta, cuil: '20-30123456-5' }, 'Cuil', 'El CUIL debe tener 11 dígitos.'],
    [{ ...alta, fechaNacimiento: '2026-02-30' }, 'FechaNacimiento', undefined],
    [{ ...alta, sexo: 'XX' }, 'Sexo', undefined],
    [{ ...alta, nombre: 'a'.repeat(101) }, 'Nombre', undefined],
  ])('400 preserva validaciones PascalCase %#', async (cuerpo, campo, mensaje) => {
    await expect(api.post('/api/clientes', cuerpo)).rejects.toMatchObject({
      status: 400,
      errors: { [campo]: mensaje ? [mensaje] : expect.any(Array) },
    });
  });
  it('campos omitidos no reciben defaults silenciosos', async () => {
    await expect(api.post('/api/clientes', {})).rejects.toMatchObject({
      status: 400,
      errors: {
        Dni: expect.any(Array),
        Cuil: expect.any(Array),
        FechaNacimiento: expect.any(Array),
        Sexo: expect.any(Array),
      },
    });
  });
  it('duplicado DNI no se reintenta ni transforma el detail', async () => {
    await crearCliente(api, alta);
    await expect(crearCliente(api, { ...alta, email: 'otro@ejemplo.com' })).rejects.toMatchObject({
      status: 400,
      detail: "RN01: Ya existe un cliente con el DNI '30123456'.",
    });
  });
  it('email duplicado no distingue mayúsculas ni excluye inactivos', async () => {
    servidorMock.use(...crearHandlersClientes(clientesFixture, { ahora }));
    await expect(
      crearCliente(api, { ...alta, dni: '99999999', email: 'INACTIVO@ejemplo.com' }),
    ).rejects.toMatchObject({
      status: 400,
      detail: "RN01: Ya existe un cliente con el email 'INACTIVO@ejemplo.com'.",
    });
  });
  it.each([
    ['20111222', 'RN02: La persona figura como fallecida en Renaper.'],
    ['99999999', "El DNI '99999999' no figura en Renaper."],
    ['45123456', 'RN01: El cliente debe tener 18 años o más.'],
  ])('rechaza %s sin persistir', async (dni, detail) => {
    await expect(crearCliente(api, { ...alta, dni })).rejects.toMatchObject({
      status: 400,
      detail,
    });
    expect((await listarClientes(api)).total).toBe(0);
  });
  it('sexo de un carácter fuera de enum es error de negocio', async () => {
    await expect(api.post('/api/clientes', { ...alta, sexo: '?' })).rejects.toMatchObject({
      status: 400,
      detail: 'El sexo debe ser M, F o X.',
    });
  });
  it('Renaper caído responde 201 sin validar y conserva los datos ingresados', async () => {
    servidorMock.use(...crearHandlersClientes([], { ahora, renaperDisponible: false }));
    const creado = await crearCliente(api, { ...alta, dni: '99999999', telefono: ' ' });
    expect(creado).toMatchObject({
      dni: '99999999',
      nombre: alta.nombre,
      validadoRenaper: false,
      fechaValidacionRenaper: null,
      telefono: null,
    });
    expect(await obtenerCliente(api, creado.id)).toEqual(creado);
  });
  it('Renaper caído sigue rechazando menores y permite revalidar después', async () => {
    servidorMock.use(...crearHandlersClientes([], { ahora, renaperDisponible: false }));
    await expect(
      crearCliente(api, { ...alta, fechaNacimiento: '2010-07-12' }),
    ).rejects.toMatchObject({ status: 400 });
    const creado = await crearCliente(api, alta);
    servidorMock.use(
      ...crearHandlersClientes(
        [
          {
            cliente: creado,
            tienePolizaActiva: false,
            cuenta: { deudaVencida: 0, cuotaVencidaConRecargo: null, proximaCuota: null },
          },
        ],
        { ahora },
      ),
    );
    expect(await validarRenaper(api, creado.id)).toMatchObject({
      validadoRenaper: true,
      fechaValidacionRenaper: ahora().toISOString(),
    });
  });
  it.each([
    ['2008-11-06', true],
    ['2008-11-07', false],
  ] as const)('RN01 cumple 18 años: %s', async (fechaNacimiento, aceptado) => {
    servidorMock.use(...crearHandlersClientes([], { ahora, renaperDisponible: false }));
    const resultado = crearCliente(api, { ...alta, fechaNacimiento });
    if (aceptado) expect(await resultado).toMatchObject({ activo: true });
    else await expect(resultado).rejects.toMatchObject({ status: 400 });
  });
  it('500 mantiene el texto genérico', async () => {
    servidorMock.use(variantes.altaError500);
    await expect(crearCliente(api, alta)).rejects.toMatchObject({
      status: 500,
      detail: 'Ocurrió un error inesperado.',
    });
  });
  it('ante 502 hace una sola request', async () => {
    let solicitudes = 0;
    servidorMock.use(
      http.post('*/api/clientes', () => {
        solicitudes++;
        return new HttpResponse(null, { status: 502 });
      }),
    );
    await expect(crearCliente(api, alta)).rejects.toMatchObject({ status: 502 });
    expect(solicitudes).toBe(1);
  });
});

describe('preview y validación Renaper (T-25)', () => {
  it('200 VIGENTE incluye domicilio completo y 200 FALLECIDO no es excepción', async () => {
    expect(await previsualizarRenaper(api, '30123456')).toEqual(personasRenaperFixture[0]);
    expect(await previsualizarRenaper(api, '20111222')).toMatchObject({
      estado: 'FALLECIDO',
      fechaFallecimiento: '2024-11-02',
    });
    expect(await previsualizarRenaper(api, '45123456')).toMatchObject({
      domicilio: { piso: '2', depto: 'B' },
    });
  });
  it('GET desconocido devuelve 404 con código y DNI inválido devuelve 400', async () => {
    await expect(previsualizarRenaper(api, '99999999')).rejects.toMatchObject({
      status: 404,
      codigo: 'PERSONA_NO_ENCONTRADA',
    });
    await expect(previsualizarRenaper(api, '123')).rejects.toMatchObject({
      status: 400,
      detail: 'El DNI debe tener 8 dígitos.',
    });
  });
  it('preview recorta en el backend mock, no en el request', async () => {
    expect(await previsualizarRenaper(api, ' 30123456 ')).toMatchObject({ dni: '30123456' });
  });
  it('POST actualiza solo datos Renaper y devuelve fecha UTC', async () => {
    servidorMock.use(...crearHandlersClientes(clientesFixture, { ahora }));
    const actualizado = await validarRenaper(api, CLIENTE_JUAN_ID);
    expect(actualizado).toMatchObject({
      validadoRenaper: true,
      email: alta.email,
      telefono: null,
      fechaValidacionRenaper: ahora().toISOString(),
    });
    expect(await obtenerCliente(api, CLIENTE_JUAN_ID)).toEqual(actualizado);
  });
  it('POST inexistente devuelve código y POST menor devuelve 400', async () => {
    servidorMock.use(...crearHandlersClientes(clientesFixture, { ahora }));
    await expect(validarRenaper(api, '00000000-0000-0000-0000-000000000000')).rejects.toMatchObject(
      { status: 404, codigo: 'CLIENTE_NO_ENCONTRADO' },
    );
    await expect(validarRenaper(api, CLIENTE_LUCIA_ID)).rejects.toMatchObject({
      status: 400,
      detail: 'RN01: El cliente debe tener 18 años o más.',
    });
    await expect(validarRenaper(api, CLIENTE_INACTIVO_ID)).rejects.toMatchObject({
      status: 400,
      detail: "El DNI '30512468' no figura en Renaper.",
    });
  });
  it('caída de preview y revalidación devuelve 502 sin texto fijo', async () => {
    servidorMock.use(
      ...crearHandlersClientes(clientesFixture, { ahora, renaperDisponible: false }),
    );
    await expect(previsualizarRenaper(api, alta.dni)).rejects.toMatchObject({ status: 502 });
    await expect(validarRenaper(api, CLIENTE_JUAN_ID)).rejects.toMatchObject({ status: 502 });
  });
});

const acciones: Array<[string, (cliente: ApiClient) => Promise<unknown>]> = [
  ['alta', (c) => crearCliente(c, alta)],
  ['preview', (c) => previsualizarRenaper(c, alta.dni)],
  ['validar', (c) => validarRenaper(c, CLIENTE_JUAN_ID)],
];
it.each(acciones)('%s exige sesión y rol', async (_nombre, ejecutar) => {
  for (const [token, status] of [
    [null, 401],
    [tokensMockClientes.invalido, 401],
    [tokensMockClientes.sinPermiso, 403],
  ] as const) {
    await expect(
      ejecutar(createApiClient({ baseUrl: 'https://api.test', getToken: () => token })),
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      ejecutar(createApiClient({ baseUrl: 'https://api.test', getToken: () => token })),
    ).rejects.toMatchObject({ status });
  }
});
it.each(Object.keys(variantes) as Array<keyof typeof variantes>)(
  'variante %s se activa por nombre',
  async (nombre) => {
    servidorMock.use(variantes[nombre]);
    const accion = nombre.startsWith('renaper')
      ? () => previsualizarRenaper(api, alta.dni)
      : nombre.startsWith('validar') || nombre === 'clienteNoExiste'
        ? () => validarRenaper(api, CLIENTE_JUAN_ID)
        : () => crearCliente(api, alta);
    if (nombre === 'renaperFallecido')
      expect(await accion()).toMatchObject({ estado: 'FALLECIDO' });
    else if (nombre === 'altaRenaperCaido')
      expect(await accion()).toMatchObject({
        validadoRenaper: false,
        fechaValidacionRenaper: null,
      });
    else {
      const status =
        nombre === 'altaError500'
          ? 500
          : nombre === 'renaperNoFigura' || nombre === 'clienteNoExiste'
            ? 404
            : nombre === 'renaperCaido' || nombre === 'validarRenaperCaido'
              ? 502
              : nombre === 'sinToken'
                ? 401
                : 400;
      await expect(accion()).rejects.toMatchObject({ status });
    }
  },
);
it.each([
  ['validarRenaperNoFigura', "El DNI '99999999' no figura en Renaper."],
  ['validarRenaperFallecido', 'RN02: La persona figura como fallecida en Renaper.'],
  ['validarRenaperMenor', 'RN01: El cliente debe tener 18 años o más.'],
] as const)('%s conserva 400 y detail sin transformar', async (nombre, detail) => {
  servidorMock.use(variantes[nombre]);
  await expect(validarRenaper(api, CLIENTE_JUAN_ID)).rejects.toMatchObject({ status: 400, detail });
});
it.each(acciones)('sinToken se activa en %s aun con header', async (_nombre, ejecutar) => {
  servidorMock.use(variantes.sinToken);
  await expect(ejecutar(api)).rejects.toMatchObject({ status: 401 });
});
it('codifica rutas, no modifica el body ni agrega body al POST de validación', async () => {
  const get = vi.fn().mockResolvedValue({});
  const post = vi.fn().mockResolvedValue({});
  const cliente = { ...api, get, post };
  const cuerpo: ClienteAltaRequest = Object.freeze({
    ...alta,
    dni: ' 30123456 ',
    cuil: ' 20301234565 ',
  });
  await crearCliente(cliente, cuerpo);
  await previsualizarRenaper(cliente, 'a/b?c');
  await validarRenaper(cliente, 'a/b?c');
  expect(post.mock.calls[0]).toEqual(['/api/clientes', cuerpo]);
  expect(post.mock.calls[0]![1]).toBe(cuerpo);
  expect(get).toHaveBeenCalledWith('/api/clientes/renaper/a%2Fb%3Fc');
  expect(post.mock.calls[1]).toEqual(['/api/clientes/a%2Fb%3Fc/validar-renaper']);
  expect(clientesKeys.renaper('30123456')).toEqual(['clientes', 'renaper', '30123456']);
});
