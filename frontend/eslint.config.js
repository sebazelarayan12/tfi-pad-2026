import { fileURLToPath } from 'node:url';
import { nexaEslintConfig } from '@nexa/config/eslint';

const root = fileURLToPath(new URL('.', import.meta.url));

export default [
  ...nexaEslintConfig({ root }),
  {
    // Los fixtures tienen violaciones a propósito; los lintea el test de reglas con `ignore: false`.
    ignores: ['packages/config/test/fixtures/**', 'apps/*/public/mockServiceWorker.js'],
  },
];
