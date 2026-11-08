import { defineConfig, devices } from '@playwright/test';

const PUERTO_BACKOFFICE = 5173;
const PUERTO_WEB = 5174;

/** Dev server de un workspace, con MSW y en su puerto fijo (`strictPort` está en su vite.config). */
function servidor(workspace: string, puerto: number) {
  return {
    command: `npm run dev --workspace=${workspace}`,
    url: `http://localhost:${puerto}`,
    reuseExistingServer: !process.env.CI,
    env: { VITE_USE_MOCKS: 'true' },
    timeout: 120_000,
  };
}

/**
 * Smoke e2e (US-FE-T-21): dos flujos de navegador con las dos apps contra MSW.
 * Cada spec fija su `baseURL` con `test.use`, porque el backoffice y la web son apps distintas.
 */
export default defineConfig({
  testDir: './e2e',
  // Los resultados (trazas) quedan dentro de node_modules para no ensuciar el árbol de git.
  outputDir: './node_modules/.cache/playwright-resultados',
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    trace: 'retain-on-failure',
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: [
    servidor('@nexa/backoffice', PUERTO_BACKOFFICE),
    servidor('@nexa/web-publica', PUERTO_WEB),
  ],
});
