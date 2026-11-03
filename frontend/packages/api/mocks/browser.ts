/// <reference types="vite/client" />

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

export async function iniciarMocksSiCorresponde(): Promise<void> {
  if (import.meta.env.VITE_USE_MOCKS !== 'true') return;
  try {
    await worker.start({ onUnhandledRequest: 'bypass' });
  } catch (error) {
    console.error('[MSW] No se pudo iniciar el worker; la app sigue sin mocks.', error);
  }
}
