import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';
import { servidorMock } from '../../mocks/server';

const url = 'https://api.test/api/prueba-msw';

beforeAll(() => servidorMock.listen({ onUnhandledRequest: 'error' }));
afterEach(() => servidorMock.resetHandlers());
afterAll(() => servidorMock.close());

it('rechaza las solicitudes sin handler', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  await expect(fetch(url)).rejects.toThrow();
});

it('quita los handlers temporales al restablecer el servidor', async () => {
  servidorMock.use(http.get('*/api/prueba-msw', () => HttpResponse.json({ ok: true })));
  const response = await fetch(url);
  await expect(response.json()).resolves.toEqual({ ok: true });

  servidorMock.resetHandlers();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  await expect(fetch(url)).rejects.toThrow();
});
