import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const setupFile = fileURLToPath(new URL('./setup.mjs', import.meta.url));

/**
 * Configuración base de Vitest compartida por todos los workspaces.
 * @param {{ environment?: 'jsdom' | 'node' }} [options]
 */
export function createVitestConfig({ environment = 'jsdom' } = {}) {
  return defineConfig({
    esbuild: { jsx: 'automatic' },
    test: {
      environment,
      setupFiles: [setupFile],
      clearMocks: true,
      restoreMocks: true,
    },
  });
}
