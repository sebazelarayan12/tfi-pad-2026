# US-FE-T-02: `@nexa/config`: TS, ESLint, Prettier, Vitest

Tipo: T · Oleada: 0 · Tamaño: M · Rama sugerida: `feature/US-FE-T-02-config-compartida` · Tarjeta Trello: `US-FE-T-02`

## 1. Objetivo

Al terminar, todas las tareas siguientes heredan la misma configuración: TypeScript `strict`, ESLint 9 con reglas de arquitectura (FB3, reglas 1 a 4), Prettier y Vitest con jest-dom. Quien crea un feature no toca configuración: las reglas de FB3 fallan en el lint si un import viola la arquitectura. Para: todos los implementadores del front y el job `frontend` de CI.

## 2. Alcance

**Entra:**
- `packages/config/tsconfig.base.json` (reemplaza el stub de T-01) y `packages/config/tsconfig.react.json`.
- `frontend/eslint.config.js` (reemplaza el stub de T-01): configuración raíz que usa el preset de `packages/config/eslint/index.mjs`.
- `packages/config/eslint/index.mjs` y `packages/config/eslint/index.d.mts`: preset reutilizable de reglas de arquitectura, `no-explicit-any`, `jsx-a11y` y `ignores`.
- `frontend/.prettierrc.json`.
- `packages/config/vitest/base.mjs`, `packages/config/vitest/base.d.mts`, `packages/config/vitest/setup.mjs`: configuración base de Vitest con jsdom y jest-dom.
- `vitest.config.ts` en `packages/ui`, `packages/api` (con `environment: 'node'`), `apps/backoffice` y `apps/web-publica`. Cada uno importa `createVitestConfig` del preset.
- Tests de la propia configuración en `packages/config/test/` (incluye fixtures de reglas).

**NO entra:**
- Los `tsconfig.json` de cada workspace (stubs de T-01): los completan T-03, T-08 y las tareas de app. Solo se tocan `tsconfig.base.json` y `tsconfig.react.json` de `packages/config`.
- Tokens, preset de Tailwind y fuentes: US-FE-T-03.
- Servidor MSW (`setupServer`, `beforeAll`/`afterAll`): US-FE-T-11. Esta tarea no levanta MSW.
- Contenido de componentes o de features: cada tarea dueña.
- Cambios en `package.json` (FC17): las dependencias ya están instaladas por T-01.

## 3. Dependencias

- **Puede empezar sin esperar a:** Nada.
- **Depende de:** — (rebase sobre T-01, RV-D02).
- **Bloqueada por pedidos al back (PB-NN):** —.
- **Workaround MSW (FB7.7):** no aplica.

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB1 (TypeScript `strict: true`, prohibido `any` explícito, Vitest + Testing Library, ESLint + Prettier + `eslint-plugin-boundaries`), FB3 (reglas 1 a 5 de la arquitectura; las reglas 1 a 4 son de esta tarea).
- `docs/frontend/analisis-front.md` §3.1 (reglas FB3), §8.1 (herramientas), §8.2 (qué se prueba por capa).
- `docs/frontend/tareas/INDEX.md`: fila US-FE-T-02 (alcance) y sección "Ownership de archivos compartidos" (fila `packages/config/tsconfig*.json`, ESLint, Prettier, config Vitest: dueño T-02).
- `docs/frontend/tareas/US-FE-T-01.md` §5 (stubs que esta tarea reemplaza y `exports` de `packages/config`).

## 5. Archivos a crear o modificar

Dueño de todos: US-FE-T-02.

| Archivo | Contenido |
|---|---|
| `frontend/packages/config/tsconfig.base.json` | Reemplaza el stub. Opciones en el paso 2 |
| `frontend/packages/config/tsconfig.react.json` | `extends` del base, `"jsx": "react-jsx"` |
| `frontend/eslint.config.js` | Reemplaza el stub. Exporta `nexaEslintConfig()` como array de config plano |
| `frontend/packages/config/eslint/index.mjs` | Exporta `nexaEslintConfig({ root })` con reglas de arquitectura |
| `frontend/packages/config/eslint/index.d.mts` | Tipos del preset (`nexaEslintConfig(options?: { root?: string }): Linter.Config[]`) |
| `frontend/.prettierrc.json` | Opciones del paso 5 |
| `frontend/packages/config/vitest/base.mjs` | Exporta `createVitestConfig(options?)` |
| `frontend/packages/config/vitest/base.d.mts` | Tipos de `createVitestConfig` |
| `frontend/packages/config/vitest/setup.mjs` | Setup común: jest-dom y `cleanup` solo si hay `document` |
| `frontend/packages/ui/vitest.config.ts` | `export default createVitestConfig();` |
| `frontend/packages/api/vitest.config.ts` | `export default createVitestConfig({ environment: 'node' });` |
| `frontend/apps/backoffice/vitest.config.ts` | `export default createVitestConfig();` |
| `frontend/apps/web-publica/vitest.config.ts` | `export default createVitestConfig();` |
| `frontend/packages/config/test/vitest-setup.test.tsx` | Smoke test del setup (jsdom) |
| `frontend/packages/config/test/tsconfig.test.ts` | Test del `tsconfig.base.json` |
| `frontend/packages/config/test/eslint-boundaries.test.ts` | Tests de reglas con `ESLint` (Node API) |
| `frontend/packages/config/test/fixtures/frontend/**` | Árbol mínimo de fixtures (apps, packages, features) para lintear |
| `frontend/packages/config/vitest.config.ts` | `environment: 'node'` para los tests de configuración |

## 6. Pasos de implementación

1. **RED.** Escribir primero `eslint-boundaries.test.ts` y `tsconfig.test.ts` con sus fixtures. Ejecutar `npm run test --workspace @nexa/config`: deben fallar (los stubs no tienen reglas ni `strict` completo). Anotar el resultado. El test de reglas carga el config con `new ESLint({ cwd: <raíz de fixtures>, overrideConfigFile: true, overrideConfig: nexaEslintConfig({ root: <raíz de fixtures> }), ignore: false })`: `ignore: false` evita que los `ignores` del config raíz oculten los fixtures, y así un test "sin error" no pasa en falso.
2. **`tsconfig.base.json`.** Opciones: `target: "ES2022"`, `lib: ["ES2023", "DOM", "DOM.Iterable"]`, `module: "ESNext"`, `moduleResolution: "Bundler"`, `strict: true`, `noImplicitAny: true`, `noUnusedLocals: true`, `noUnusedParameters: true`, `noImplicitOverride: true`, `noFallthroughCasesInSwitch: true`, `isolatedModules: true`, `verbatimModuleSyntax: true`, `skipLibCheck: true`, `noEmit: true`, `resolveJsonModule: true`, `forceConsistentCasingInFileNames: true`.
3. **`tsconfig.react.json`.** `extends: "./tsconfig.base.json"`, `compilerOptions.jsx: "react-jsx"`.
4. **Preset ESLint** (`eslint/index.mjs`): exporta `nexaEslintConfig({ root })`. Las reglas se definen con `eslint-plugin-boundaries` (elementos y reglas de la sección 9). Antes de escribir, verificar la API de la versión instalada con `npm ls eslint-plugin-boundaries` y su README local (`node_modules/eslint-plugin-boundaries/README.md`); no usar claves de una versión que no esté instalada.
5. **Config raíz** (`frontend/eslint.config.js`): calcula la raíz con `fileURLToPath(new URL(".", import.meta.url))`, usa `nexaEslintConfig({ root })` y agrega `ignores: ["**/dist/**", "**/coverage/**", "**/node_modules/**", "packages/config/test/fixtures/**"]`. Los fixtures tienen violaciones a propósito (R6 y R7 se aplican a `packages/**`), por eso van en `ignores`.
6. **Prettier.** `.prettierrc.json` con `singleQuote: true`, `semi: true`, `trailingComma: "all"`, `printWidth: 100`. Ejecutar `npm run format:check` y corregir solo los archivos de esta tarea.
7. **Vitest base.** `createVitestConfig({ environment = "jsdom" } = {})` devuelve `defineConfig({ test: { environment, setupFiles: [<ruta absoluta de setup.mjs>], clearMocks: true, restoreMocks: true } })`. El setup importa `@testing-library/jest-dom/vitest` y, solo si `typeof document !== "undefined"`, registra `afterEach(cleanup)` de `@testing-library/react`.
8. **Workspaces.** Crear los cuatro `vitest.config.ts` (sección 5).
9. **GREEN.** Ejecutar los tests y el lint raíz (`npm run lint`). Todo en verde antes de commit.
10. Revisar que los tests de fixtures fallan por la regla correcta (no por error de sintaxis), leyendo el mensaje de ESLint de cada caso.

## 7. Contrato con el back

No aplica. No hay endpoints.

## 8. Contenido de UI

No aplica. No hay textos de UI.

## 9. Estados y casos borde

**Reglas de arquitectura (`eslint-plugin-boundaries`).** Elementos (`settings`):
- `app-shell`: `apps/*/src/app/**`.
- `feature`: `apps/*/src/features/*/**` (captura el nombre del feature).
- `feature-api`, `feature-components`, `feature-pages`, `feature-schemas`, `feature-types`: subcarpetas `api/`, `components/`, `pages/`, `schemas/`, `types/` dentro de un feature. Declarar primero los de capa y después el feature general, para que la coincidencia sea la más específica.
- `shared`: `apps/*/src/shared/**`.
- `ui-package`: `packages/ui/src/**`.
- `api-package`: `packages/api/src/**` y `packages/api/mocks/**`.

Reglas:
- **R1 (FB3-1).** Un feature importa de otro feature solo su `index.ts` (regla `entry-point` sobre el elemento `feature`).
- **R2 (FB3-2).** `feature-pages` puede importar `feature-components`, `feature-api`, `feature-schemas` y `feature-types`. Ningún elemento que no sea `feature-pages` importa `feature-pages`: `feature-components`, `feature-api`, `feature-schemas` y `feature-types` no pueden importar páginas, ni de su feature ni de otro.
- **R3 (FB3-3).** `shared` y `ui-package` no importan `feature` ni `app-shell`.
- **R4 (FB3-4).** `feature` y sus capas no importan `app-shell`. `app-shell` sí puede importar `feature` (solo su `index.ts`, por R1).
- **R5 (extra).** Una app no importa la otra: `no-restricted-imports` sobre `apps/*` desde `apps/*` distinto (patrón `**/apps/<otra>/**` y `@nexa/web-publica` / `@nexa/backoffice`). Los paquetes (`ui-package`, `api-package`) no importan de `apps/**` ni de `@nexa/backoffice` ni de `@nexa/web-publica`.
- **R6.** `no-explicit-any: error` en todo el código del front.
- **R7.** `jsx-a11y/recommended` como `error` en `apps/**` y `packages/**`.

**Casos borde.**
- Un import relativo desde `features/clientes/pages/X.tsx` a `features/clientes/components/Y.tsx` no es violación (mismo feature).
- Un import por alias `@nexa/ui` desde un feature no es violación de R1 (es un paquete); sí lo es de R3 si el origen es `shared`.
- Un archivo fuera de `apps/` y `packages/` (por ejemplo `docs/`) no recibe reglas de arquitectura.
- `dist/` y `coverage/` quedan ignorados por `ignores` del config raíz.
- Los fixtures de `packages/config/test/fixtures/**` están en `ignores` del config raíz. Sin esto, `npm run lint` falla porque R6 y R7 se aplican a `packages/**`. El test de reglas los lintea con `ignore: false` (paso 1).

## 10. Tests requeridos

Herramienta: Vitest (Node API de ESLint para las reglas, API de TypeScript para el tsconfig).

| Test | Qué afirma |
|---|---|
| `R1: feature importa internals de otro feature → error` | Un import de `features/polizas/components/X` desde `features/clientes/pages/Y` produce un mensaje de `boundaries` |
| `R1: feature importa index.ts de otro feature → sin error` | Un import de `features/polizas/index.ts` desde `features/clientes/pages/Y` no produce mensaje |
| `R2: pages importa components, api y schemas → sin error` | Los tres imports no producen mensaje |
| `R2: components importa pages → error` | Un import de `feature-pages` desde `feature-components` produce mensaje |
| `R2: schemas importa pages → error` | Idem para `feature-schemas` |
| `R3: shared importa feature → error` | Import de `features/x/index.ts` desde `shared/` produce mensaje |
| `R3: ui-package importa feature → error` | Import desde `packages/ui/src/` a un feature produce mensaje |
| `R4: feature importa app-shell → error` | Import de `app/router.tsx` desde un feature produce mensaje |
| `R4: app-shell importa feature index.ts → sin error` | Import de `features/x/index.ts` desde `app/` no produce mensaje |
| `R5: backoffice importa web-publica → error` | `no-restricted-imports` produce mensaje |
| `R5: ui-package importa de apps → error` | `no-restricted-imports` produce mensaje |
| `R6: any explícito → error` | Un archivo con `: any` produce `@typescript-eslint/no-explicit-any` |
| `R7: img sin alt → error` | `jsx-a11y/alt-text` produce mensaje |
| `tsconfig.base rechaza implicit any` | `ts.createProgram` con las opciones del base reporta TS7006 para `function f(x) { return x }` |
| `tsconfig.base acepta código tipado` | Un archivo con tipos explícitos no reporta diagnósticos |
| `setup expone matchers jest-dom` | En jsdom, `expect(el).toBeInTheDocument()` pasa |
| `setup hace cleanup` | Un `render` en un test no queda en el DOM del test siguiente |

## 11. Criterios de aceptación

1. `packages/config/tsconfig.base.json` tiene `strict: true`, `noImplicitAny: true` y `verbatimModuleSyntax: true`.
2. `packages/config/tsconfig.react.json` extiende el base y declara `jsx: "react-jsx"`.
3. `frontend/eslint.config.js` ya no es el stub de T-01: exporta la configuración con las reglas R1 a R7.
4. Existe al menos un test por cada regla R1 a R7, y los 17 tests de la sección 10 pasan.
5. Cada test de regla lintea un fixture real y verifica el `ruleId` del mensaje, no solo que haya un error.
6. `npm run lint` desde `frontend/` pasa en el repo con todo el código de la rama.
7. `frontend/.prettierrc.json` define las cuatro opciones de la sección 6 y `npm run format:check` pasa.
8. `createVitestConfig` existe en `packages/config/vitest/base.mjs` con tipos en `base.d.mts`.
9. `packages/api/vitest.config.ts` usa `environment: 'node'`; los demás usan `jsdom`.
10. El setup importa `@testing-library/jest-dom/vitest` y no falla en el entorno node.
11. `npm run test` desde `frontend/` pasa, con los tests de esta tarea y sin tests de otras.
12. `npm run typecheck` pasa en `packages/ui`, `packages/api` y las apps. `packages/config` no tiene script `typecheck` (T-01, sección 5); sus tests tipados se verifican con `npm run test`.
13. Ningún `package.json` cambió en esta tarea (verificable con `git diff --stat -- frontend/**/package.json`).
14. Ningún archivo fuera de la sección 5 cambió.

## 12. Verificación manual

Sin prueba manual: es configuración y se verifica con tests y lint. La primera prueba visual de la configuración ocurre en US-FE-T-14.

## 13. Decisiones pendientes

- **D-T02-1. Opciones de Prettier.** Default: `singleQuote`, `trailingComma: "all"`, `printWidth: 100`, `semi: true`. Son las que sugiere el estilo de los ejemplos de `design-system.md §4`; no hay regla documentada.
- **D-T02-2. Componentes que importan API.** Default: sin restricción adicional. FB3-2 solo prohíbe importar `pages/` desde las otras capas. Si el equipo quiere que `components/` no llame a `api/` (hooks), se agrega una regla R2b.
- **D-T02-3. `verbatimModuleSyntax`.** Default: `true`. Obliga a `import type` para tipos; es más estricto, pero evita imports sin efecto en Vite.
- **D-T02-4. Nivel de `jsx-a11y`.** Default: `error` (R7). Si el equipo lo prefiere como `warn`, se cambia en el preset y no en cada app.

## 14. Riesgos y errores comunes

- **API de `eslint-plugin-boundaries` distinta por versión.** Las claves de `settings` y los nombres de reglas cambian entre mayores. Verificar la versión instalada antes de escribir la config (paso 4). Un error de config se ve como "rule not found"; se corrige la config, nunca se desactiva el error.
- **Reglas que no disparan.** Una regla mal configurada no falla: deja pasar todo. Por eso cada regla tiene un fixture que debe producir error. Si un fixture pasa, la regla no está activa.
- **Resolución de alias.** Un import por alias (`@/features/...`) puede no resolverse a un elemento y pasar sin control. Mitigación: el repo no usa alias `@/` en features (solo `@nexa/*` de paquetes). Si se agrega, primero se configura el resolver.
- **Config de ESLint en CJS vs ESM.** `packages/config` es `commonjs` (T-01 D-T01-7); los archivos del preset son `.mjs`. Importarlos con `require` falla. El `eslint.config.js` raíz es ESM (`"type": "module"` del raíz).
- **Tipos de `.mjs` sin `.d.mts`.** TypeScript con `strict` falla con TS7016 al importar un `.mjs` sin declaración. Mitigación: los `.d.mts` de la sección 5.
- **Fixtures dentro del repo.** Los fixtures tienen `import` a archivos que no compilan a propósito en algún caso; `tsc` del workspace los excluye en `tsconfig` (`exclude: ["test/fixtures"]`). Verificar que `npm run typecheck` no los incluye.

## 15. Definición de terminado

- `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` en verde desde `frontend/`, con salida anotada.
- `npm run format:check` en verde.
- Los 17 tests de la sección 10 pasan; el RED inicial está anotado en el PR.
- Criterios de la sección 11 con evidencia.
- Sin secretos.
- Diff revisado: solo archivos de la sección 5.

## 16. Observaciones al índice

- Resuelto (RV-07 / RV-58): los `vitest.config.ts` de cada workspace (`packages/*` y `apps/*`) son de T-02, según la fila de ownership de la config Vitest.
- Resuelto (RV-07): el ownership de los `.d.mts` del preset queda en T-02, junto con los `.mjs` de `packages/config/*`.
- Resuelto (RV-D02): T-01 es prerrequisito de rebase y declara el script `test` de `packages/config`. No cuenta para la oleada.
- ABIERTO: FB3 regla 2 con ambigüedad. El texto dice "pages/ puede importar de components/, api/, schemas/; nunca al revés", pero no dice si `components/` puede importar de `api/`. Esta tarea implementa solo la restricción explícita (D-T02-2). Pedido a la reunión: confirmar la regla. (No figura en REVISION ni en FB8; D-T02-2 aplica su default.)
