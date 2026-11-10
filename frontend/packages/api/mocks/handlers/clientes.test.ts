import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  createApiClient,
  darDeBajaCliente,
  listarClientes,
  modificarCliente,
  obtenerCliente,
  obtenerCuentaCliente,
  type ApiClient,
  type ClienteModificacionRequest,
} from '../../src';
import {
  CLIENTE_INACTIVO_ID,
  CLIENTE_JUAN_ID,
  CLIENTE_LUCIA_ID,
  clientesFixture,
  tokensMockClientes,
} from '../fixtures/clientes';
import { servidorMock } from '../server';
import { crearHandlersClientes } from './clientes';

const api = createApiClient({
  baseUrl: 'https://api.test',
  getToken: () => tokensMockClientes.empleado,
});
const contacto: ClienteModificacionRequest = {
  email: 'lucia.actualizada@ejemplo.com',
  telefono: ' 3815550123 ',
  calle: ' Rivadavia ',
  numero: ' 456 ',
  localidad: ' Yerba Buena ',
  provincia: ' Tucumán ',
  codigoPostal: ' 4107 ',
};
const inexistente = '00000000-0000-0000-0000-000000000099';
beforeAll(() => servidorMock.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => servidorMock.use(...crearHandlersClientes()));
afterEach(() => servidorMock.resetHandlers());
afterAll(() => servidorMock.close());

describe('listado', () => {
  it('solo lista activos, ordenados por apellido, nombre y DNI, con Renaper y conteos', async () => {
    const pagina = await listarClientes(api);
    expect(pagina).toMatchObject({ pagina: 1, tamanoPagina: 20, total: 2 });
    expect(pagina.items.map((c) => c.id)).toEqual([CLIENTE_LUCIA_ID, CLIENTE_JUAN_ID]);
    for (const item of pagina.items)
      expect(Object.keys(item).sort()).toEqual([
        'activo',
        'apellido',
        'cantidadPolizasActivas',
        'cantidadVehiculos',
        'dni',
        'email',
        'id',
        'nombre',
        'telefono',
        'validadoRenaper',
      ]);
  });

  it('filtra por DNI exacto y por apellido parcial sin distinguir mayúsculas', async () => {
    expect((await listarClientes(api, { dni: '30123456' })).items.map((c) => c.id)).toEqual([
      CLIENTE_JUAN_ID,
    ]);
    expect((await listarClientes(api, { dni: '3012' })).items).toEqual([]);
    for (const apellido of ['pér', ' PÉR ']) {
      expect((await listarClientes(api, { apellido })).items.map((c) => c.apellido)).toEqual([
        'Pérez',
      ]);
    }
    expect((await listarClientes(api, { dni: '45123456', apellido: 'Pérez' })).total).toBe(0);
  });

  it('el apellido se busca sin distinguir tildes: "pe" y "perez" encuentran a Pérez', async () => {
    for (const apellido of ['pe', 'perez', 'PEREZ', 'pér']) {
      expect((await listarClientes(api, { apellido })).items.map((c) => c.apellido)).toContain(
        'Pérez',
      );
    }
    expect(
      (await listarClientes(api, { apellido: 'fernandez' })).items.map((c) => c.apellido),
    ).toEqual(['Fernández']);
  });

  it('pagina=2 y tamanoPagina=1 devuelve el segundo y total correcto', async () => {
    const pagina = await listarClientes(api, { pagina: 2, tamanoPagina: 1 });
    expect(pagina).toMatchObject({ pagina: 2, tamanoPagina: 1, total: 2 });
    expect(pagina.items.map((c) => c.id)).toEqual([CLIENTE_JUAN_ID]);
    expect(await listarClientes(api, { pagina: 3, tamanoPagina: 1 })).toMatchObject({
      items: [],
      total: 2,
    });
  });

  it.each([
    ['pagina', '0', 'Pagina'],
    ['pagina', '-1', 'Pagina'],
    ['pagina', '21474837', 'Pagina'],
    ['pagina', '1.5', 'Pagina'],
    ['pagina', 'abc', 'Pagina'],
    ['pagina', '', 'Pagina'],
    ['tamanoPagina', '101', 'TamanoPagina'],
    ['tamanoPagina', '0', 'TamanoPagina'],
  ])('rechaza %s=%s con ValidationProblemDetails', async (campo, valor, clave) => {
    await expect(api.get('/api/clientes', { query: { [campo]: valor } })).rejects.toMatchObject({
      status: 400,
      errors: { [clave]: expect.any(Array) },
      detail: null,
    });
  });
});

describe('detalle, edición y baja', () => {
  it.each([inexistente, CLIENTE_INACTIVO_ID])(
    'devuelve 404 en detalle/PUT/DELETE/cuenta para %s',
    async (id) => {
      for (const operacion of [
        () => obtenerCliente(api, id),
        () => modificarCliente(api, id, contacto),
        () => darDeBajaCliente(api, id),
        () => obtenerCuentaCliente(api, id),
      ]) {
        await expect(operacion()).rejects.toMatchObject({
          status: 404,
          codigo: 'CLIENTE_NO_ENCONTRADO',
        });
      }
    },
  );

  it.each(['juan.perez@ejemplo.com', ' JUAN.PEREZ@EJEMPLO.COM ', 'inactivo@ejemplo.com'])(
    'rechaza email ocupado %s sin modificar nada',
    async (email) => {
      const anterior = await obtenerCliente(api, CLIENTE_LUCIA_ID);
      await expect(
        modificarCliente(api, CLIENTE_LUCIA_ID, { ...contacto, email }),
      ).rejects.toMatchObject({ status: 400, detail: expect.stringContaining('RN01:') });
      expect(await obtenerCliente(api, CLIENTE_LUCIA_ID)).toEqual(anterior);
    },
  );

  it('edita solo contacto y domicilio, recorta texto y preserva identidad y Renaper', async () => {
    const anterior = await obtenerCliente(api, CLIENTE_LUCIA_ID);
    const editado = await api.put(`/api/clientes/${CLIENTE_LUCIA_ID}`, {
      ...contacto,
      dni: '00000000',
      nombre: 'No modificar',
      validadoRenaper: true,
    });
    expect(editado).toEqual({
      ...anterior,
      email: contacto.email,
      telefono: '3815550123',
      calle: 'Rivadavia',
      numero: '456',
      localidad: 'Yerba Buena',
      provincia: 'Tucumán',
      codigoPostal: '4107',
    });
    expect((await listarClientes(api, { dni: '45123456' })).items[0]?.email).toBe(contacto.email);
  });

  it.each([undefined, null, '', '   '])(
    'normaliza teléfono %s a null y permite el propio email',
    async (telefono) => {
      const anterior = await obtenerCliente(api, CLIENTE_LUCIA_ID);
      const editado = await modificarCliente(api, CLIENTE_LUCIA_ID, {
        ...contacto,
        email: anterior.email,
        telefono,
      });
      expect(editado.telefono).toBeNull();
      expect(editado.email).toBe(anterior.email);
    },
  );

  it.each([
    ['email', '', 'Email'],
    ['email', 'no-es-email', 'Email'],
    ['email', 'a'.repeat(151), 'Email'],
    ['calle', '  ', 'Calle'],
    ['calle', 'a'.repeat(151), 'Calle'],
    ['numero', 'a'.repeat(21), 'Numero'],
    ['localidad', 'a'.repeat(101), 'Localidad'],
    ['provincia', 'a'.repeat(101), 'Provincia'],
    ['codigoPostal', 'a'.repeat(11), 'CodigoPostal'],
    ['telefono', '1'.repeat(21), 'Telefono'],
  ])('valida %s antes de guardar', async (campo, valor, clave) => {
    const anterior = await obtenerCliente(api, CLIENTE_LUCIA_ID);
    await expect(
      api.put(`/api/clientes/${CLIENTE_LUCIA_ID}`, { ...contacto, [campo]: valor }),
    ).rejects.toMatchObject({ status: 400, errors: { [clave]: expect.any(Array) } });
    expect(await obtenerCliente(api, CLIENTE_LUCIA_ID)).toEqual(anterior);
  });

  it('DELETE devuelve 204 vacío, excluye de la lista y responde 404 en repetición', async () => {
    const respuesta = await api.delete(`/api/clientes/${CLIENTE_LUCIA_ID}`, undefined, {
      responseType: 'raw',
    });
    expect(respuesta).toMatchObject({ status: 204, texto: '' });
    expect((await listarClientes(api)).items.map((c) => c.id)).toEqual([CLIENTE_JUAN_ID]);
    await expect(darDeBajaCliente(api, CLIENTE_LUCIA_ID)).rejects.toMatchObject({ status: 404 });
    await expect(obtenerCliente(api, CLIENTE_LUCIA_ID)).rejects.toMatchObject({ status: 404 });
    expect(clientesFixture.find((r) => r.cliente.id === CLIENTE_LUCIA_ID)?.cliente.activo).toBe(
      true,
    );
  });

  it('bloquea la baja con póliza activa y no modifica el estado', async () => {
    const anterior = await obtenerCliente(api, CLIENTE_JUAN_ID);
    await expect(darDeBajaCliente(api, CLIENTE_JUAN_ID)).rejects.toMatchObject({
      status: 400,
      detail: expect.stringContaining('póliza activa'),
    });
    expect(await obtenerCliente(api, CLIENTE_JUAN_ID)).toEqual(anterior);
  });

  it('cada nueva fábrica restaura el estado sin mutar las semillas', async () => {
    await darDeBajaCliente(api, CLIENTE_LUCIA_ID);
    servidorMock.use(...crearHandlersClientes());
    expect((await obtenerCliente(api, CLIENTE_LUCIA_ID)).activo).toBe(true);
  });

  it('cuenta propuesta con cuota vencida, próxima y variante vacía', async () => {
    const cuenta = await obtenerCuentaCliente(api, CLIENTE_JUAN_ID);
    expect(cuenta.deudaVencida).toBe(12600);
    expect(cuenta.cuotaVencidaConRecargo).toMatchObject({
      importe: 12000,
      recargo: 600,
      estado: 1,
    });
    expect(cuenta.proximaCuota).toMatchObject({ estado: 0, fechaVencimiento: '2026-11-10' });
    await expect(obtenerCuentaCliente(api, CLIENTE_LUCIA_ID)).resolves.toEqual({
      deudaVencida: 0,
      cuotaVencidaConRecargo: null,
      proximaCuota: null,
    });
  });
});

const operaciones: Array<[string, (cliente: ApiClient) => Promise<unknown>]> = [
  ['lista', (cliente) => listarClientes(cliente)],
  ['detalle', (cliente) => obtenerCliente(cliente, CLIENTE_JUAN_ID)],
  ['PUT', (cliente) => modificarCliente(cliente, CLIENTE_LUCIA_ID, contacto)],
  ['DELETE', (cliente) => darDeBajaCliente(cliente, CLIENTE_LUCIA_ID)],
  ['cuenta propuesta', (cliente) => obtenerCuentaCliente(cliente, CLIENTE_JUAN_ID)],
];
it.each(operaciones)('%s exige sesión y rol admitido', async (_nombre, operar) => {
  for (const token of [null, tokensMockClientes.invalido, tokensMockClientes.sinPermiso]) {
    const cliente = createApiClient({ baseUrl: 'https://api.test', getToken: () => token });
    await expect(operar(cliente)).rejects.toMatchObject({
      status: token === tokensMockClientes.sinPermiso ? 403 : 401,
    });
  }
});
it('también admite administrador', async () => {
  const admin = createApiClient({
    baseUrl: 'https://api.test',
    getToken: () => tokensMockClientes.administrador,
  });
  await expect(obtenerCliente(admin, CLIENTE_JUAN_ID)).resolves.toMatchObject({ activo: true });
});
