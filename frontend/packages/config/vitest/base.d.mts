import type { ViteUserConfig } from 'vitest/config';

export interface CreateVitestConfigOptions {
  environment?: 'jsdom' | 'node';
}

export function createVitestConfig(options?: CreateVitestConfigOptions): ViteUserConfig;
