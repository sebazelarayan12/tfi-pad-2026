import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { createApiClient, isApiError } from '../../src';

const baseUrl = 'https://api.test';
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => server.close());
const client = () => createApiClient({ baseUrl });

describe('createApiClient', () => {
  it('normaliza la base, serializa query y omite valores ausentes', async () => {
    server.use(
      http.get(`${baseUrl}/api/clientes`, ({ request }) => HttpResponse.json({ url: request.url })),
    );
    const api = createApiClient({ baseUrl: `${baseUrl}///` });
    await expect(
      api.get('/api/clientes', {
        query: {
          tamano: 10,
          soloActivos: true,
          estado: null,
          dni: undefined,
          apellido: 'Pérez & Díaz',
        },
      }),
    ).resolves.toEqual({
      url: `${baseUrl}/api/clientes?tamano=10&soloActivos=true&apellido=P%C3%A9rez+%26+D%C3%ADaz`,
    });
    await expect(api.get('/api/clientes', { query: { dni: null } })).resolves.toEqual({
      url: `${baseUrl}/api/clientes`,
    });
  });
  it.each(['', '   '])('rechaza base vacía %j', (baseUrl) => {
    expect(() => createApiClient({ baseUrl })).toThrow(TypeError);
  });
  it('rechaza rutas fuera de /api/ antes de fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await expect(client().get('/clientes')).rejects.toBeInstanceOf(TypeError);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it.each([null, '', 'abc.def'])('lee el token actual y omite cookies: %j', async (token) => {
    server.use(
      http.get(`${baseUrl}/api/clientes`, ({ request }) =>
        HttpResponse.json({
          auth: request.headers.get('authorization'),
          credentials: request.credentials,
        }),
      ),
    );
    const getToken = vi.fn(() => token);
    const api = createApiClient({ baseUrl, getToken });
    await expect(api.get('/api/clientes')).resolves.toEqual({
      auth: token ? `Bearer ${token}` : null,
      credentials: 'omit',
    });
    getToken.mockReturnValue('nuevo');
    await expect(api.get('/api/clientes')).resolves.toMatchObject({ auth: 'Bearer nuevo' });
  });
  it.each(['post', 'put', 'patch', 'delete'] as const)('%s envía JSON', async (method) => {
    server.use(
      http.all(`${baseUrl}/api/clientes`, async ({ request }) =>
        HttpResponse.json({
          method: request.method,
          type: request.headers.get('content-type'),
          body: await request.json(),
        }),
      ),
    );
    await expect(client()[method]('/api/clientes', { nombre: 'Ana' })).resolves.toEqual({
      method: method.toUpperCase(),
      type: 'application/json',
      body: { nombre: 'Ana' },
    });
  });
  it('envía FormData con boundary generado por fetch', async () => {
    server.use(
      http.post(`${baseUrl}/api/rendiciones`, async ({ request }) => {
        const data = await request.formData();
        return HttpResponse.json({
          type: request.headers.get('content-type'),
          archivo: await (data.get('archivo') as Blob).text(),
        });
      }),
    );
    const body = new FormData();
    body.append('archivo', new Blob(['rendicion']), 'prueba.txt');
    await expect(client().post('/api/rendiciones', body)).resolves.toEqual({
      type: expect.stringMatching(/^multipart\/form-data; boundary=/),
      archivo: 'rendicion',
    });
  });
  it.each([200, 204])('%i vacío devuelve undefined o texto vacío', async (status) => {
    server.use(http.all(`${baseUrl}/api/clientes`, () => new HttpResponse(null, { status })));
    await expect(client().delete('/api/clientes')).resolves.toBeUndefined();
    await expect(client().get('/api/clientes', { responseType: 'text' })).resolves.toBe('');
  });
  it('devuelve texto y Accept correcto', async () => {
    server.use(
      http.get(`${baseUrl}/api/archivo`, ({ request }) => {
        expect(request.headers.get('accept')).toBe('text/plain');
        return HttpResponse.text('hola');
      }),
    );
    const result: string = await client().get('/api/archivo', { responseType: 'text' });
    expect(result).toBe('hola');
  });
  it('devuelve blob y contentType', async () => {
    server.use(
      http.get(`${baseUrl}/api/archivo`, ({ request }) => {
        expect(request.headers.get('accept')).toBe('*/*');
        return HttpResponse.text('hola', {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }),
    );
    const result = await client().get('/api/archivo', { responseType: 'blob' });
    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.contentType).toBe('text/plain; charset=utf-8');
    expect(await result.blob.text()).toBe('hola');
  });
  it.each([200, 400, 401])('raw devuelve texto sin lanzar ante %i', async (status) => {
    const onUnauthorized = vi.fn();
    server.use(
      http.get(`${baseUrl}/api/archivo`, () =>
        HttpResponse.text('sin parsear', {
          status,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        }),
      ),
    );
    const api = createApiClient({ baseUrl, onUnauthorized });
    await expect(api.get('/api/archivo', { responseType: 'raw' })).resolves.toEqual({
      status,
      ok: status === 200,
      contentType: 'text/plain; charset=utf-8',
      texto: 'sin parsear',
    });
    expect(onUnauthorized).toHaveBeenCalledTimes(status === 401 ? 1 : 0);
  });
  it('JSON inválido se informa como respuesta-invalida', async () => {
    server.use(http.get(`${baseUrl}/api/clientes`, () => HttpResponse.text('<html/>')));
    await expect(client().get('/api/clientes')).rejects.toMatchObject({
      kind: 'respuesta-invalida',
      status: 200,
    });
  });
  it('red no reintenta', async () => {
    const handler = vi.fn(() => HttpResponse.error());
    server.use(http.get(`${baseUrl}/api/clientes`, handler));
    await expect(client().get('/api/clientes')).rejects.toMatchObject({ kind: 'red', status: 0 });
    expect(handler).toHaveBeenCalledTimes(1);
  });
  it('AbortError se relanza sin envolver', async () => {
    const controller = new AbortController();
    controller.abort();
    const error: unknown = await client()
      .get('/api/clientes', { signal: controller.signal })
      .catch((error: unknown) => error);
    expect(error).toMatchObject({ name: 'AbortError' });
    expect(isApiError(error)).toBe(false);
  });
});
