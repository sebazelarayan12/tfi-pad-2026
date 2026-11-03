import { afterEach, expect, it, vi } from 'vitest';
import { iniciarMocksSiCorresponde, worker } from '../../mocks/browser';

vi.mock('msw/browser', () => ({ setupWorker: () => ({ start: vi.fn() }) }));

afterEach(() => vi.unstubAllEnvs());

it.each([undefined, 'false'])('no inicia MSW con el flag %s', async (flag) => {
  vi.stubEnv('VITE_USE_MOCKS', flag);
  await iniciarMocksSiCorresponde();
  expect(worker.start).not.toHaveBeenCalled();
});

it('inicia MSW y deja pasar las rutas sin handler con el flag true', async () => {
  vi.stubEnv('VITE_USE_MOCKS', 'true');
  await iniciarMocksSiCorresponde();
  expect(worker.start).toHaveBeenCalledWith({ onUnhandledRequest: 'bypass' });
});

it('registra el fallo al iniciar y permite continuar el arranque', async () => {
  vi.stubEnv('VITE_USE_MOCKS', 'true');
  const error = new Error('Falta el worker');
  vi.mocked(worker.start).mockRejectedValueOnce(error);
  const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  await expect(iniciarMocksSiCorresponde()).resolves.toBeUndefined();
  expect(log).toHaveBeenCalledWith(expect.stringContaining('[MSW]'), error);
});
