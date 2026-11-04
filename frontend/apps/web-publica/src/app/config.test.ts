// @vitest-environment node
// `vite.config.ts` importa Vite, que en jsdom falla por el `TextEncoder` de esbuild.
import { describe, expect, it } from 'vitest';

import html from '../../index.html?raw';
import config from '../../vite.config';

describe('configuración de la app', () => {
  it('vite.config expone el puerto 5174 con strictPort', () => {
    expect(config.server).toMatchObject({ port: 5174, strictPort: true });
    expect(config.preview).toMatchObject({ port: 5174, strictPort: true });
  });

  it('index.html declara lang="es"', () => {
    expect(html).toMatch(/<html lang="es">/);
  });

  it('index.html tiene el título Nexa Seguros', () => {
    expect(html).toMatch(/<title>Nexa Seguros<\/title>/);
  });
});
