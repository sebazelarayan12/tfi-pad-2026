import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createApiClient, cuotasKeys, listarCuotasVencidasMock, type ApiClient } from '../../src';
import { cuotasSinVencidas } from '../../mocks/handlers/cuotas';
import { servidorMock } from '../../mocks/server';

const API_URL = 'https://api.test';

function api(): ApiClient {
  return createApiClient({ baseUrl: API_URL, getToken: () => 'token' });
}

function apiSinToken(): ApiClient {
  return createApiClient({ baseUrl: API_URL });
}

beforeAll(() => servidorMock.listen({ onUnhandledRequest: 'error' }));
afterEach(() => servidorMock.resetHandlers());
afterAll(() => servidorMock.close());

describe('MOCK PB-24: GET /api/cuotas', () => {
  it('la cuota vencida mock se marca MOCK y devuelve estado "Vencida"', async () => {
    expect(listarCuotasVencidasMock.name).toBe('listarCuotasVencidasMock');

    const pagina = await listarCuotasVencidasMock(api(), {});
    expect(pagina.total).toBe(1);
    expect(pagina.items[0]?.estado).toBe('Vencida');
    expect(pagina.items[0]?.numeroPoliza).toBe('POL-0000001');
  });

  it('envía estado=Vencida y la paginación en la query', async () => {
    const queries: URLSearchParams[] = [];

    servidorMock.use(
      http.get('*/api/cuotas', ({ request }) => {
        queries.push(new URL(request.url).searchParams);
        return HttpResponse.json({ items: [], pagina: 2, tamanoPagina: 5, total: 0 });
      }),
    );

    await listarCuotasVencidasMock(api(), { pagina: 2, tamano: 5 });

    expect(queries[0]?.get('estado')).toBe('Vencida');
    expect(queries[0]?.get('pagina')).toBe('2');
    expect(queries[0]?.get('tamano')).toBe('5');
  });

  it('la variante cuotasSinVencidas devuelve una página vacía', async () => {
    servidorMock.use(cuotasSinVencidas);

    const pagina = await listarCuotasVencidasMock(api(), {});
    expect(pagina.items).toEqual([]);
    expect(pagina.total).toBe(0);
  });

  it('devuelve 401 sin token', async () => {
    await expect(listarCuotasVencidasMock(apiSinToken())).rejects.toMatchObject({ status: 401 });
  });

  it('cuotasKeys.vencidas distingue opciones distintas', () => {
    expect(cuotasKeys.vencidas({ pagina: 1 })).not.toEqual(cuotasKeys.vencidas({ pagina: 2 }));
  });
});
