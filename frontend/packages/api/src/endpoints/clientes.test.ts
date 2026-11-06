import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  clientesKeys,
  createApiClient,
  darDeBajaCliente,
  listarClientes,
  modificarCliente,
  obtenerCliente,
  obtenerCuentaCliente,
  type ClienteModificacionRequest,
} from '../index';
import {
  CLIENTE_JUAN_ID,
  CLIENTE_LUCIA_ID,
  tokensMockClientes,
} from '../../mocks/fixtures/clientes';
import { crearHandlersClientes } from '../../mocks/handlers/clientes';
import { servidorMock } from '../../mocks/server';

const api = createApiClient({
  baseUrl: 'https://api.test',
  getToken: () => tokensMockClientes.empleado,
});
const cuerpo: ClienteModificacionRequest = {
  email: 'lucia.actualizada@ejemplo.com',
  telefono: ' 3815550123 ',
  calle: ' Rivadavia ',
  numero: '456',
  localidad: 'Yerba Buena',
  provincia: 'Tucumán',
  codigoPostal: '4107',
};
beforeAll(() => servidorMock.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => servidorMock.use(...crearHandlersClientes()));
afterEach(() => {
  servidorMock.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => servidorMock.close());

describe('requests de clientes', () => {
  it('envía solo los filtros con valor y recorta apellido, sin modificar el filtro', async () => {
    let parametros: URLSearchParams | undefined;
    servidorMock.use(
      http.get('*/api/clientes', ({ request }) => {
        parametros = new URL(request.url).searchParams;
        return HttpResponse.json({ items: [], pagina: 2, tamanoPagina: 10, total: 0 });
      }),
    );
    const filtro = Object.freeze({ dni: '', apellido: ' pér ', pagina: 2, tamanoPagina: 10 });
    await listarClientes(api, filtro);
    expect(Object.fromEntries(parametros!)).toEqual({
      apellido: 'pér',
      pagina: '2',
      tamanoPagina: '10',
    });
    expect(filtro.apellido).toBe(' pér ');
    await listarClientes(api, { dni: ' ', apellido: '   ' });
    expect([...parametros!]).toEqual([]);
    await listarClientes(api);
    expect([...parametros!]).toEqual([]);
  });

  it('envía el DNI tal como se recibe, sin agregar ni quitar puntos', async () => {
    const recibidos: Array<string | null> = [];
    servidorMock.use(
      http.get('*/api/clientes', ({ request }) => {
        recibidos.push(new URL(request.url).searchParams.get('dni'));
        return HttpResponse.json({ items: [], pagina: 1, tamanoPagina: 20, total: 0 });
      }),
    );
    await listarClientes(api, { dni: '30123456' });
    await listarClientes(api, { dni: '30.123.456' });
    expect(recibidos).toEqual(['30123456', '30.123.456']);
  });

  it('modificarCliente envía el mismo body sin normalizarlo ni mutarlo', async () => {
    const solicitud = Object.freeze({ ...cuerpo });
    const espia = vi.spyOn(api, 'put');
    await modificarCliente(api, CLIENTE_LUCIA_ID, solicitud);
    expect(espia.mock.calls[0]?.[1]).toBe(solicitud);
    expect(solicitud.telefono).toBe(' 3815550123 ');
  });

  it('darDeBajaCliente resuelve undefined con 204', async () => {
    await expect(darDeBajaCliente(api, CLIENTE_LUCIA_ID)).resolves.toBeUndefined();
  });

  it('obtenerCliente propaga ApiError 404 con código y detalle', async () => {
    const error = await obtenerCliente(api, '00000000-0000-0000-0000-000000000099').catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 404,
      codigo: 'CLIENTE_NO_ENCONTRADO',
      detail: expect.any(String),
    });
  });

  it('expone la cuenta propuesta sin incluirla en el detalle', async () => {
    await expect(obtenerCuentaCliente(api, CLIENTE_JUAN_ID)).resolves.toMatchObject({
      deudaVencida: 12600,
    });
    expect(await obtenerCliente(api, CLIENTE_JUAN_ID)).not.toHaveProperty('deudaVencida');
  });

  it('codifica el id como un solo segmento y no permite inyectar una query', async () => {
    const espia = vi.spyOn(api, 'get').mockResolvedValue({});
    await obtenerCliente(api, 'id/ajeno?dni=1');
    expect(espia).toHaveBeenCalledWith('/api/clientes/id%2Fajeno%3Fdni%3D1');
  });

  it.each(['PUT', 'DELETE'] as const)('no reintenta %s ante 500', async (metodo) => {
    let llamadas = 0;
    const responder = () => {
      llamadas++;
      return new HttpResponse(null, { status: 500 });
    };
    servidorMock.use(
      metodo === 'PUT'
        ? http.put('*/api/clientes/:id', responder)
        : http.delete('*/api/clientes/:id', responder),
    );
    await expect(
      metodo === 'PUT'
        ? modificarCliente(api, CLIENTE_LUCIA_ID, cuerpo)
        : darDeBajaCliente(api, CLIENTE_LUCIA_ID),
    ).rejects.toMatchObject({ status: 500 });
    expect(llamadas).toBe(1);
  });
});

it('clientesKeys distingue filtros y permite invalidar listas, detalle y cuenta', () => {
  expect(clientesKeys.todos).toEqual(['clientes']);
  expect(clientesKeys.lista({ dni: '30123456' })).not.toEqual(
    clientesKeys.lista({ apellido: 'Pérez' }),
  );
  expect(clientesKeys.lista({ pagina: 1 })).not.toEqual(clientesKeys.lista({ pagina: 2 }));
  expect(clientesKeys.lista({}).slice(0, 2)).toEqual(clientesKeys.listas());
  expect(clientesKeys.detalle(CLIENTE_JUAN_ID).slice(0, 2)).toEqual(clientesKeys.detalles());
  expect(clientesKeys.cuenta(CLIENTE_JUAN_ID)).toEqual(['clientes', 'cuenta', CLIENTE_JUAN_ID]);
  expect(clientesKeys.detalle(CLIENTE_JUAN_ID)).not.toEqual(clientesKeys.cuenta(CLIENTE_JUAN_ID));
});
