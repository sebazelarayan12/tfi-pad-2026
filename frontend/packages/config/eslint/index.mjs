import boundaries from 'eslint-plugin-boundaries';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tseslint from 'typescript-eslint';

const SOURCE_FILES = ['**/*.{ts,tsx,mts,cts}'];
const FRONT_FILES = ['apps/**/*.{ts,tsx,mts,cts}', 'packages/**/*.{ts,tsx,mts,cts}'];
const FEATURE_LAYERS = ['api', 'components', 'pages', 'schemas', 'types'];

/** Patrones de import que una app o un paquete no puede usar para llegar a una app. */
function appImportPatterns(app) {
  return [`**/apps/${app}/**`, `**/${app}/src/**`, `@nexa/${app}`, `@nexa/${app}/**`];
}

const APPS = ['backoffice', 'web-publica'];

const boundariesSettings = (root) => ({
  // Sin esto los imports sin extensión ('../components/X') no resuelven a .ts/.tsx y ninguna regla dispara.
  'import/resolver': {
    node: { extensions: ['.ts', '.tsx', '.mts', '.cts', '.js', '.mjs', '.cjs', '.json'] },
  },
  'boundaries/root-path': root,
  'boundaries/include': ['apps/**/*', 'packages/**/*'],
  'boundaries/elements': [
    {
      type: 'feature',
      pattern: 'apps/*/src/features/*',
      capture: ['app', 'feature'],
    },
    { type: 'app-shell', pattern: 'apps/*/src/app', capture: ['app'] },
    { type: 'shared', pattern: 'apps/*/src/shared', capture: ['app'] },
    { type: 'ui-package', pattern: 'packages/ui/src' },
    { type: 'api-package', pattern: 'packages/api/src' },
    { type: 'api-package', pattern: 'packages/api/mocks' },
  ],
  'boundaries/files': FEATURE_LAYERS.map((layer) => ({
    category: `feature-${layer}`,
    pattern: `apps/*/src/features/*/${layer}/**`,
  })),
});

/**
 * Preset de ESLint del front (FB3, reglas 1 a 4, más R5 a R7).
 * @param {{ root?: string }} [options] Raíz del monorepo del front (`frontend/`).
 */
export function nexaEslintConfig({ root = process.cwd() } = {}) {
  return [
    { ignores: ['**/dist/**', '**/coverage/**', '**/node_modules/**'] },
    { ...tseslint.configs.base, files: SOURCE_FILES },
    {
      ...jsxA11y.flatConfigs.recommended,
      files: FRONT_FILES,
    },
    {
      files: SOURCE_FILES,
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
      },
    },
    {
      files: FRONT_FILES,
      plugins: { boundaries },
      settings: boundariesSettings(root),
      rules: {
        'boundaries/dependencies': [
          2,
          {
            default: 'allow',
            checkInternals: true,
            policies: [
              {
                from: { element: { type: 'feature' } },
                disallow: {
                  to: {
                    element: {
                      type: 'feature',
                      internalPath: '!index.ts',
                      captured: { feature: '!{{ from.element.captured.feature }}' },
                    },
                  },
                },
                message: 'Entre features se importa solo el index.ts (FB3-1).',
              },
              {
                from: {
                  file: {
                    categories: [
                      'feature-api',
                      'feature-components',
                      'feature-schemas',
                      'feature-types',
                    ],
                  },
                },
                disallow: { to: { file: { categories: 'feature-pages' } } },
                message: 'Solo pages/ puede importar pages/ (FB3-2).',
              },
              {
                from: { element: { types: ['shared', 'ui-package'] } },
                disallow: { to: { element: { types: ['feature', 'app-shell'] } } },
                message: 'shared y @nexa/ui no importan features ni el app-shell (FB3-3).',
              },
              {
                from: { element: { type: 'feature' } },
                disallow: { to: { element: { type: 'app-shell' } } },
                message: 'Un feature no importa el app-shell (FB3-4).',
              },
            ],
          },
        ],
      },
    },
    ...APPS.map((app) => ({
      files: [`apps/${app}/**/*.{ts,tsx,mts,cts}`],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: APPS.filter((other) => other !== app).flatMap((other) =>
              appImportPatterns(other),
            ),
          },
        ],
      },
    })),
    {
      files: ['packages/**/*.{ts,tsx,mts,cts}'],
      rules: {
        'no-restricted-imports': [
          'error',
          { patterns: APPS.flatMap((app) => appImportPatterns(app)) },
        ],
      },
    },
  ];
}
