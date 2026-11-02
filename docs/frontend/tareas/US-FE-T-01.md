# US-FE-T-01: Monorepo y CI del front

Tipo: T · Oleada: 0 · Tamaño: S · Rama sugerida: `feature/US-FE-T-01-monorepo-ci` · Tarjeta Trello: `US-FE-T-01`

## 1. Objetivo

Al terminar, existe `frontend/` como monorepo npm workspaces con cinco workspaces (`apps/backoffice`, `apps/web-publica`, `packages/ui`, `packages/api`, `packages/config`), un único `package-lock.json` con todo el stack de FB1 y FB7, scripts raíz `lint`, `typecheck`, `test`, `build`, y un job `frontend` en CI que pasa en la rama de esta tarea sin depender de otras tareas.

Para quién: todas las tareas siguientes del front. Ninguna tarea después de esta edita un `package.json` ni el lockfile (FC17); si falta una librería, se pide el cambio a esta tarea.

Esta tarea no escribe componentes, tokens, configuración de TypeScript/ESLint/Vitest reales ni pantallas. Crea solo lo mínimo para que el monorepo instale y las cuatro verificaciones pasen en verde.

## 2. Alcance

**Entra:**
- `frontend/package.json` raíz: workspaces, scripts y todas las dependencias del stack (sección 5).
- `frontend/package-lock.json`, generado con `npm install` en `frontend/` y commiteado.
- `frontend/.nvmrc` con `20`.
- `frontend/.gitignore` (el `.gitignore` raíz solo ignora `bin/` y `obj/`; no se toca).
- `package.json` de cada workspace con `name`, `type`, `exports`, `scripts` y `dependencies`/`devDependencies`.
- Stubs de arranque, cada uno con reemplazo nombrado (sección 5, columna "Reemplaza").
- Job `frontend` en `.github/workflows/ci.yml`. El job `backend`, `branch-name` y `secrets-scan` no se tocan.

**NO entra:**
- Configuración real de TypeScript, ESLint, Prettier y Vitest: US-FE-T-02.
- `tokens.css`, preset de Tailwind y fuentes: US-FE-T-03.
- `index.html`, `main.tsx`, `vite.config.ts` y providers reales de las apps: US-FE-T-14 (backoffice) y US-FE-T-17 (web).
- Contenido de `packages/api` (cliente, DTO, formateadores, mocks): US-FE-T-08, T-09, T-10, T-11, T-12.
- Docker del front: US-FE-T-20. README: US-FE-T-22. Playwright: US-FE-T-21.
- Ruleset de GitHub (required checks): decisión del equipo (sección 13).

## 3. Dependencias

- **Puede empezar sin esperar a:** Nada.
- **Depende de:** — (ninguna; las tareas de Ola 0 rebasan sobre T-01 sin contarla como dependencia, RV-D02).
- **Bloqueada por pedidos al back (PB-NN):** —.
- **Workaround MSW (FB7.7):** no aplica.

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB1 (stack, Node 20, npm workspaces, Vite + React 18, Tailwind 3.4, Vitest, ESLint, CI `frontend`), FB2 (estructura del monorepo y alias `@nexa/ui`, `@nexa/api`, `@nexa/config`), FB7.2 (fuentes por `@fontsource`).
- `docs/frontend/tareas/INDEX.md`: fila US-FE-T-01 de la tabla índice, convenciones FC7 (ramas y commits), FC17 (dependencias npm), sección "Ownership de archivos compartidos" (primera fila: `frontend/package.json`, workspaces, lockfile, `.github/workflows/*` job `frontend`).
- `docs/frontend/analisis-front.md` §3.5 (árbol de carpetas de `frontend/`).
- `.github/workflows/ci.yml` (job `backend` como referencia de formato; no se modifica).

## 5. Archivos a crear o modificar

Dueño de todos: US-FE-T-01, salvo los stubs marcados.

| Archivo | Contenido | Reemplaza (stub) |
|---|---|---|
| `frontend/package.json` | `"name": "nexa-frontend"`, `"private": true`, `"type": "module"`, `"engines": { "node": ">=20" }`, `"workspaces": ["apps/*", "packages/*"]`, scripts raíz (abajo), devDependencies de tooling (abajo) | No aplica |
| `frontend/.nvmrc` | `20` | No aplica |
| `frontend/.gitignore` | `node_modules/`, `dist/`, `coverage/`, `*.tsbuildinfo`, `.env`, `.env.*`, `!.env.example` | No aplica |
| `frontend/package-lock.json` | Generado con `npm install` en `frontend/` | No aplica |
| `frontend/eslint.config.js` | Stub: `export default [];` | US-FE-T-02 |
| `frontend/apps/backoffice/package.json` | `"name": "@nexa/backoffice"`, `"private": true`, `"type": "module"`, scripts de workspace (abajo), dependencias de runtime de la app | No aplica |
| `frontend/apps/backoffice/index.html` | Stub: documento HTML5 vacío con `<div id="root"></div>` y `<script type="module" src="/src/main.tsx">` | US-FE-T-14 |
| `frontend/apps/backoffice/src/main.tsx` | Stub: sin render (solo `export {};`) | US-FE-T-14 |
| `frontend/apps/backoffice/tsconfig.json` | Stub: `{ "extends": "../../packages/config/tsconfig.react.json", "include": ["src"] }` | US-FE-T-14 (y T-02 provee la base) |
| `frontend/apps/web-publica/*` | Mismos cuatro archivos que backoffice, con `"name": "@nexa/web-publica"` | US-FE-T-17 |
| `frontend/packages/ui/package.json` | `"name": "@nexa/ui"`, `"type": "module"`, `"exports": { ".": "./src/index.ts", "./tokens.css": "./src/tokens.css" }`, `peerDependencies` react/react-dom 18, devDependency `@nexa/config` | No aplica |
| `frontend/packages/ui/src/index.ts` | Stub: `export {};` | US-FE-T-03 |
| `frontend/packages/ui/tsconfig.json` | Stub: `{ "extends": "../config/tsconfig.react.json", "include": ["src", "test"] }` | US-FE-T-02 (base) |
| `frontend/packages/api/package.json` | `"name": "@nexa/api"`, `"type": "module"`, `"exports": { ".": "./src/index.ts", "./mocks/*": "./mocks/*" }`, devDependency `@nexa/config`, `msw` | No aplica |
| `frontend/packages/api/src/index.ts` | Stub: `export {};` | US-FE-T-12 |
| `frontend/packages/api/tsconfig.json` | Stub: `{ "extends": "../config/tsconfig.base.json", "include": ["src", "mocks", "test"] }` | US-FE-T-02 (base) |
| `frontend/packages/config/package.json` | `"name": "@nexa/config"`, `"type": "commonjs"` (ver sección 13, D-T01-7), `"exports"` abajo | No aplica |
| `frontend/packages/config/tsconfig.base.json` | Stub: `{ "compilerOptions": { "strict": true } }` | US-FE-T-02 |
| `frontend/packages/config/tsconfig.react.json` | Stub: `{ "extends": "./tsconfig.base.json", "compilerOptions": { "jsx": "react-jsx" } }` (lo extienden `apps/*/tsconfig.json` y `packages/ui/tsconfig.json`) | US-FE-T-02 |
| `.github/workflows/ci.yml` | Job nuevo `frontend` (abajo) | No aplica (agregado) |

**Scripts raíz** (`frontend/package.json`):
- `"lint": "eslint ."`
- `"typecheck": "npm run typecheck --workspaces --if-present"`
- `"test": "npm run test --workspaces --if-present"`
- `"build": "npm run build --workspaces --if-present"`
- `"format:check": "prettier --check ."`

**Scripts por workspace:**
- `apps/*`: `"dev": "vite"`, `"build": "vite build"`, `"typecheck": "tsc --noEmit"`, `"test": "vitest run --passWithNoTests"`.
- `packages/ui` y `packages/api`: `"typecheck": "tsc --noEmit"`, `"test": "vitest run --passWithNoTests"`. No tienen `build`: se consumen como fuente TypeScript.
- `packages/config`: `"test": "vitest run --passWithNoTests"` (la usa T-02 para los tests de reglas de ESLint). No tiene `typecheck` ni `build`.

**`exports` de `packages/config`** (las rutas se declaran ahora; los archivos los crean T-02 y T-03; FC17 prohíbe editar este `package.json` después):
- `"./tsconfig.base.json"` → `./tsconfig.base.json`
- `"./tsconfig.react.json"` → `./tsconfig.react.json`
- `"./eslint"` → `./eslint/index.mjs`
- `"./vitest/base"` → `./vitest/base.mjs`
- `"./tailwind/nexa.preset"` → `./tailwind/nexa.preset.js`

**Job `frontend`** en `.github/workflows/ci.yml`, al mismo nivel que `backend`:
- `name: frontend`, `runs-on: ubuntu-latest`, `defaults.run.working-directory: frontend`.
- Pasos: `actions/checkout@v4`; `actions/setup-node@v4` con `node-version-file: frontend/.nvmrc` y `cache: npm` con `cache-dependency-path: frontend/package-lock.json` (en este paso el directorio de trabajo es la raíz del repo, por eso la ruta completa); `npm ci`; `npm run lint`; `npm run typecheck`; `npm run test`; `npm run build`.

**Dependencias que T-01 declara** (FC17). Majors y nombres vienen de FB1 y FB7; las versiones exactas las fija `npm install` con el rango mayor indicado (no inventar versiones; ver sección 13):
- Runtime en apps: `react@18`, `react-dom@18`, `react-router-dom@6`, `@tanstack/react-query@5`, `react-hook-form@7`, `@hookform/resolvers`, `zod`, `@nexa/ui`, `@nexa/api`.
- Runtime en `packages/ui`: `@phosphor-icons/react@2`, `@fontsource/plus-jakarta-sans`, `@fontsource/jetbrains-mono`. Peer: `react@18`, `react-dom@18`.
- Build y tooling (raíz): `typescript@5`, `vite@6` (mayor por defecto, ver D-T01-1), `@vitejs/plugin-react`, `tailwindcss@3.4`, `postcss`, `autoprefixer`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/dom`, `@testing-library/user-event`, `@testing-library/jest-dom`, `vitest-axe`, `msw@2`, `eslint@9`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, `eslint-plugin-boundaries`, `eslint-config-prettier`, `prettier@3`, `@types/react@18`, `@types/react-dom@18`, `@types/node@20`.
- Workspace devDependency `@nexa/config` (`"*"`) en `packages/ui`, `packages/api` y ambas apps: el preset de Tailwind y las configs compartidas se importan por ese nombre.

## 6. Pasos de implementación

1. Crear `frontend/` con `.nvmrc`, `.gitignore`, `package.json` raíz y los cinco `package.json` de workspace con sus `exports` y scripts (sección 5).
2. Crear los stubs marcados (sección 5). Cada stub con sintaxis que admite comentarios lleva uno de una línea con el ID de la tarea que lo reemplaza (`// Stub de US-FE-T-0X` en `.ts`, `.tsx`, `.js` y `tsconfig.json`; `<!-- Stub de US-FE-T-0X -->` en `index.html`). Los `package.json` no admiten comentarios: su reemplazo se anota en el PR.
3. Ejecutar `npm install` en `frontend/`. Verificar que `package-lock.json` se genera y que no hay peer deps sin resolver (`npm install` con salida de error = paso no completo).
4. Verificar enlaces de workspace: `@nexa/ui`, `@nexa/api` y `@nexa/config` aparecen como enlaces simbólicos en `frontend/node_modules/@nexa/`.
5. Ejecutar localmente `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` y anotar el resultado.
6. Agregar el job `frontend` en `.github/workflows/ci.yml` sin cambiar los jobs existentes.
7. Confirmar que el job pasa en el PR (rama de esta tarea), con los stubs, sin esperar a T-02.

Orden de merge sugerido: T-01 primero. Ola 0 rebasa sobre T-01.

## 7. Contrato con el back

No aplica. Esta tarea no llama a ningún endpoint.

## 8. Contenido de UI

No aplica. No hay pantallas ni textos de UI.

## 9. Estados y casos borde

- **Instalación limpia:** `rm -rf node_modules` y `npm ci` desde `frontend/` deben completar sin error.
- **Workspace sin script:** `npm run <script> --workspaces --if-present` salta el workspace sin el script. No fallar por eso; es el comportamiento esperado para `packages/config` sin `typecheck`.
- **Sin tests:** `vitest run --passWithNoTests` sale con 0 cuando no hay archivos de test. Los tests reales los agregan las tareas siguientes.
- **Stubs en CI:** `vite build` sin `index.html` falla; por eso el stub de `index.html` existe. `tsc --noEmit` sin archivos de entrada falla con TS18003; por eso los stubs `index.ts` existen.
- **Node distinto de 20:** `engines` lo declara; `.nvmrc` lo fija para CI y para quien usa `nvm`.

## 10. Tests requeridos

Esta tarea no tiene tests unitarios propios: es configuración. Su verificación son los comandos y comprobaciones de la sección 15. Para cada comando, el resultado observado va en el PR.

| Verificación | Qué afirma | Herramienta |
|---|---|---|
| `npm ci` en `frontend/` | Instalación reproducible desde el lockfile | npm |
| `npm ls --workspaces --depth=0` | Los cinco workspaces aparecen y no hay `invalid` ni `missing` | npm |
| `fd -t l . frontend/node_modules/@nexa` | Existen los tres enlaces `@nexa/ui`, `@nexa/api`, `@nexa/config` | fd |
| `npm run lint`, `typecheck`, `test`, `build` | Los cuatro scripts raíz terminan con código 0 | npm |
| Job `frontend` en el PR | El check `frontend` aparece en verde junto a `backend` y `branch-name` | GitHub Actions |

## 11. Criterios de aceptación

1. `frontend/package.json` declara `"workspaces": ["apps/*", "packages/*"]`, `"type": "module"` y `"engines.node" >= 20`.
2. `frontend/.nvmrc` contiene `20`.
3. `frontend/.gitignore` ignora `node_modules/`, `dist/`, `coverage/` y `.env` y permite `.env.example`.
4. `frontend/package-lock.json` existe y está commiteado.
5. Existen los cinco `package.json` de workspace con los nombres `@nexa/backoffice`, `@nexa/web-publica`, `@nexa/ui`, `@nexa/api`, `@nexa/config`.
6. `packages/config/package.json` declara `"type": "commonjs"`, y `packages/ui` y `packages/api` declaran `"type": "module"`.
7. `packages/ui` exporta `"."` → `./src/index.ts` y `"./tokens.css"` → `./src/tokens.css`.
8. `packages/config` exporta `./tailwind/nexa.preset` → `./tailwind/nexa.preset.js`, y los demás subpaths de la sección 5.
9. Las dependencias de la sección 5 están instaladas en el workspace indicado (verificable con `npm ls --workspaces --depth=0`).
10. Cada stub de la sección 5 contiene un comentario que nombra la tarea que lo reemplaza.
11. `npm run lint` termina con código 0.
12. `npm run typecheck` termina con código 0.
13. `npm run test` termina con código 0.
14. `npm run build` termina con código 0.
15. `npm run format:check` termina con código 0 (archivos generados por esta tarea están formateados).
16. `.github/workflows/ci.yml` tiene un job `frontend` con `working-directory: frontend`, Node 20 desde `.nvmrc`, `npm ci`, y los cuatro comandos.
17. Los jobs `backend`, `branch-name` y `secrets-scan` quedan idénticos al estado anterior (diff sin cambios en esos bloques).
18. El check `frontend` del PR está en verde.
19. No hay archivos de `backend/`, `docs/` ni de otras tareas en el diff del PR, salvo `.github/workflows/ci.yml`.

## 12. Verificación manual

Sin prueba manual: solo infraestructura de build. Las verificaciones son los comandos de la sección 10 y el check del PR. La primera prueba visual ocurre en US-FE-T-14 (scaffold backoffice).

## 13. Decisiones pendientes

- **D-T01-1. Mayores de dependencias.** Default: `react@18`, `react-router-dom@6`, `@tanstack/react-query@5`, `react-hook-form@7`, `tailwindcss@3.4` (FB1), `msw@2`, `eslint@9`, `prettier@3`, `typescript@5`, `@phosphor-icons/react@2`, `vite@6`. `vite` y `vitest` se eligen como la mayor que resuelva sin conflicto de peer con `@vitejs/plugin-react` y que sea compatible con Node 20 (verificar `engines` del paquete con `npm view <pkg> engines`). `zod` y `@hookform/resolvers`: la mayor que `@hookform/resolvers` declare compatible en su peer dependency; verificar con `npm view`.
- **D-T01-2. `clsx` o similar.** Default: no agregar. Las clases condicionales se resuelven con plantillas de string en `packages/ui`. Si el equipo prefiere `clsx`, se agrega aquí, en esta tarea.
- **D-T01-3. Librería de código de barras (W-07, `CuponBarras`).** Default: no agregar. Si W-07 necesita dibujar barras, lo hace con SVG propio en su tarea.
- **D-T01-4. `eslint-plugin-jsx-a11y`.** Default: agregar (FC16 pide labels, `aria-invalid` y foco, que el plugin ayuda a verificar).
- **D-T01-5. Required check `frontend` en el ruleset de GitHub.** Acción manual del repo, no de código. Default: pedir al equipo que lo agregue después del primer merge verde. Mientras tanto el job corre pero no bloquea.
- **D-T01-6. Stubs en `apps/*/tailwind.config.*`.** Hoy no hay ownership asignado (ver sección 16). Default: lo crea T-14 (backoffice) y T-17 (web) junto con `content` de Tailwind; no se crea stub aquí.
- **D-T01-7. Tipo de módulo de `packages/config`.** Default: `"type": "commonjs"`, porque el preset de `design-system.md §4` usa `module.exports` y `require`. Los archivos ESM de esa carpeta llevan extensión `.mjs` (`eslint/index.mjs`, `vitest/base.mjs`). Alternativa: preset como `.cjs` con `"type": "module"`; se descarta para no cambiar el contenido que el design system documenta.

## 14. Riesgos y errores comunes

- **Peers no resueltos en npm 7+:** `npm install` puede fallar por `@testing-library/react` sin `@testing-library/dom`, o por `eslint-plugin-react-hooks` con ESLint 9. Incluir `@testing-library/dom` y verificar el rango de peer de cada plugin antes de fijar mayores.
- **Ejecución con Node distinto de 20:** `engines` solo advierte. Verificar `node -v` antes de `npm ci`.
- **Stub que nadie reemplaza:** si la tarea dueña no reemplaza el stub (por ejemplo `index.ts` en `packages/api`), el typecheck pasa, pero el workspace queda vacío. Cada tarea dueña lo reemplaza en su PR; revisar en el review que el stub desapareció.
- **`npm run lint` recorre `dist/`:** hasta que T-02 agregue `ignores` en la config, la salida de `vite build` puede generar avisos. La carpeta `dist/` ya está en `.gitignore`, pero ESLint no lee `.gitignore` sin configuración. Mitigación: el stub de `eslint.config.js` no tiene reglas; T-02 agrega `ignores` (`dist`, `coverage`, `node_modules`).
- **Editar el lockfile en paralelo:** dos ramas que agregan dependencias generan conflicto de lockfile. Mitigación: ninguna otra tarea agrega dependencias (FC17). Un cambio en dependencias pasa por T-01 o por un PR de dependencias acordado.
- **Export map de `packages/config` sin archivos:** los subpaths apuntan a archivos que T-02 y T-03 crean después. Importarlos antes de esas tareas falla con error de resolución; es el comportamiento esperado.

## 15. Definición de terminado

- `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` en verde desde `frontend/`, con el resultado anotado en el PR.
- `npm run format:check` en verde.
- Check `frontend` en verde en el PR.
- Criterios de la sección 11, cada uno con evidencia observada (comando y salida o captura del check).
- Sin secretos: `.env` ignorado; ningún valor real en archivos del PR.
- Diff revisado: solo los archivos de la sección 5 y `.github/workflows/ci.yml`.

## 16. Observaciones al índice

- Resuelto (RV-24): la fila de T-01 del INDEX declara los paquetes que faltaban (`@hookform/resolvers`, `jsdom`, `@testing-library/*`, `@vitejs/plugin-react`, `postcss`, `autoprefixer`, `typescript`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-config-prettier`, `eslint-plugin-jsx-a11y`, `@types/*`, `@fontsource/*`, `cross-env`, `zod`, Playwright y el `exports` de `@nexa/ui/testing`). La sección 5 los declara según FC17.
- Resuelto (RV-07 / RV-23): el root (`eslint.config.js`, `.nvmrc`, `.gitignore`) queda en T-01. Los archivos de app (`index.html`, `main.tsx`, `tsconfig.json`, `tailwind.config.*`, `postcss.config.*`) quedan en T-14 y T-17. T-01 no crea stub de `tailwind.config.*` (D-T01-6).
- Resuelto (RV-D02): T-01 es prerrequisito de rebase de Ola 0 y no cuenta para la oleada. El job `frontend` pasa con stubs y no espera a T-02; cada stub lo reemplaza su tarea dueña.
