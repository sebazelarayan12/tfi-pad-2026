import { createVitestConfig } from '@nexa/config/vitest/base';
import { mergeConfig } from 'vitest/config';

export default mergeConfig(createVitestConfig(), { test: { setupFiles: ['./src/test/setup.ts'] } });
