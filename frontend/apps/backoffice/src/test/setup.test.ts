import { servidorMock } from '@nexa/api/mocks/server';
import { http, HttpResponse } from 'msw';
import { expect, it, vi } from 'vitest';

const url = 'https://api.test/api/prueba-setup';

it('el setup rechaza las solicitudes sin handler', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  await expect(fetch(url)).rejects.toThrow();
});

it('un handler agregado dentro de un test responde', async () => {
  servidorMock.use(http.get('*/api/prueba-setup', () => HttpResponse.json({ ok: true })));
  const respuesta = await fetch(url);
  await expect(respuesta.json()).resolves.toEqual({ ok: true });
});

it('el handler del test anterior no se hereda', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  await expect(fetch(url)).rejects.toThrow();
});
