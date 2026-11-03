import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { ApiError, createApiClient, isApiError } from '../../src';

const baseUrl = 'https://api.test';
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it.each([400, 401, 403, 404, 429, 500, 502, 503])(
  'preserva ProblemDetails %i sin reintentar',
  async (status) => {
    const onUnauthorized = vi.fn();
    const body = {
      title: 'Error',
      detail: 'Detalle del error.',
      traceId: 'trace-test',
      codigo: 'CLIENTE_NO_ENCONTRADO',
      errors: { Email: ['El email es obligatorio.'] },
    };
    const handler = vi.fn(() =>
      HttpResponse.json(body, { status, headers: { 'Content-Type': 'application/problem+json' } }),
    );
    server.use(http.get(`${baseUrl}/api/publico/consulta`, handler));
    await expect(
      createApiClient({ baseUrl, onUnauthorized }).get('/api/publico/consulta'),
    ).rejects.toMatchObject({
      ...body,
      status,
      kind: 'http',
      name: 'ApiError',
      message: body.detail,
    });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(onUnauthorized).toHaveBeenCalledTimes(status === 401 ? 1 : 0);
  },
);

it('401 del login con query no cierra sesión', async () => {
  const onUnauthorized = vi.fn();
  server.use(
    http.post(`${baseUrl}/api/auth/login`, () =>
      HttpResponse.json({ detail: 'Credenciales inválidas.' }, { status: 401 }),
    ),
  );
  const api = createApiClient({ baseUrl, onUnauthorized });
  await expect(api.post('/api/auth/login?origen=web', {})).rejects.toMatchObject({
    status: 401,
    detail: 'Credenciales inválidas.',
    errors: null,
  });
  expect(onUnauthorized).not.toHaveBeenCalled();
});

it.each([
  { status: 403, text: '', type: 'application/problem+json' },
  { status: 500, text: '<html>Error</html>', type: 'text/html' },
  { status: 502, text: '{mal', type: 'application/json' },
  { status: 400, text: 'null', type: 'application/json' },
  { status: 400, text: '[]', type: 'application/json' },
  {
    status: 400,
    text: '{"title":4,"detail":false,"traceId":{},"codigo":1,"errors":{"Email":[4]}}',
    type: 'application/json',
  },
])(
  'cuerpo inválido conserva status $status y campos nulos ($text)',
  async ({ status, text, type }) => {
    server.use(
      http.get(
        `${baseUrl}/api/clientes`,
        () => new HttpResponse(text, { status, headers: { 'Content-Type': type } }),
      ),
    );
    await expect(createApiClient({ baseUrl }).get('/api/clientes')).rejects.toMatchObject({
      status,
      kind: 'http',
      title: null,
      detail: null,
      traceId: null,
      codigo: null,
      errors: null,
      message: `Error de la API (${status})`,
    });
  },
);

it.each([null, [], { Email: 'inválido' }, { Email: ['válido'], Dni: [1] }])(
  'descarta errors de forma incorrecta: %j',
  async (errors) => {
    server.use(
      http.get(`${baseUrl}/api/clientes`, () =>
        HttpResponse.json({ detail: 'Regla de negocio.', errors }, { status: 400 }),
      ),
    );
    await expect(createApiClient({ baseUrl }).get('/api/clientes')).rejects.toMatchObject({
      detail: 'Regla de negocio.',
      errors: null,
    });
  },
);

it('isApiError distingue la clase de errores comunes', () => {
  expect(isApiError(new ApiError({ status: 400, kind: 'http' }))).toBe(true);
  expect(isApiError(new Error())).toBe(false);
  expect(isApiError(null)).toBe(false);
  expect(isApiError({ name: 'ApiError' })).toBe(false);
});
