import type { Linter } from 'eslint';

export interface NexaEslintConfigOptions {
  /** Raíz del monorepo del front (`frontend/`). Por defecto, `process.cwd()`. */
  root?: string;
}

export function nexaEslintConfig(options?: NexaEslintConfigOptions): Linter.Config[];
