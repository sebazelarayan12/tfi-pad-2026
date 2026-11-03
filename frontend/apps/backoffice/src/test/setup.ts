import { servidorMock } from '@nexa/api/mocks/server';
import { afterAll, afterEach, beforeAll } from 'vitest';

// Setup de MSW para los tests del backoffice (T-11 §6.1, DP-2).
// Una request sin handler falla: no sale a la red.
beforeAll(() => servidorMock.listen({ onUnhandledRequest: 'error' }));
afterEach(() => servidorMock.resetHandlers());
afterAll(() => servidorMock.close());
