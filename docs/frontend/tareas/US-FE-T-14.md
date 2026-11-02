# US-FE-T-14: Scaffold backoffice

T · Ola 1 (INDEX; ver §16 si se declara T-11 como dependencia) · Tamaño M · Rama sugerida `feature/US-FE-T-14-scaffold-backoffice` · Tarjeta Trello `US-FE-T-14`

## 1. Objetivo

La app `apps/backoffice` arranca con Vite en `http://localhost:5173` (`strictPort`), React 18, providers (`QueryClient` con `retry: 0` en mutaciones), un router `createBrowserRouter` que compone las rutas de cada feature, `lang="es"`, `.env.example` y stubs de `routes.tsx`, guardas y layout que después reemplazan US-FE-T-13 y US-FE-T-16. Destinatarios: todas las features del backoffice.

## 2. Alcance

**Entra**
- `apps/backoffice/index.html` (`lang="es"`).
- `apps/backoffice/vite.config.ts` (plugin React, `server: { port: 5173, strictPort: true }`).
- `apps/backoffice/tailwind.config.cjs` y `apps/backoffice/postcss.config.cjs` (preset de `@nexa/config`, `content` que incluye `packages/ui`).
- `apps/backoffice/.env.example`.
- `apps/backoffice/src/vite-env.d.ts` (tipos de `ImportMetaEnv`).
- `apps/backoffice/src/main.tsx` y `src/index.css`.
- `apps/backoffice/src/app/providers.tsx`, `app/queryClient.ts`, `app/router.tsx`, `app/ordenRutas.ts`, `app/PaginaNoEncontrada.tsx`.
- Stubs: `app/guards/RequireSesion.tsx`, `app/guards/RequireRol.tsx`, `app/layouts/LayoutBackoffice.tsx`.
- `apps/backoffice/src/features/{auth,inicio,cuotas,clientes,vehiculos,cotizaciones,polizas,pagos,pago-facil,planes,usuarios}/routes.tsx` con `export const rutas: RouteObject[] = [];`.
- Tests en `app/`.

**NO entra**
- Sesión, `401` global y guardas reales: US-FE-T-13.
- Layout con sidebar, topbar y shell: US-FE-T-16.
- Pantallas: B-01 a B-25.
- Dependencias npm y scripts de `package.json`: US-FE-T-01.
- Docker y README: US-FE-T-20 y US-FE-T-22.

## 3. Dependencias

- **Puede empezar sin esperar a:** US-FE-T-15.
- **Depende de:** US-FE-T-02 (tsconfig, ESLint y config Vitest base), US-FE-T-03 (`tokens.css` y fuentes, importados en `main.tsx`), US-FE-T-08 (`ApiError`, usado por la regla de reintentos).
- **Bloqueada por pedidos al back (PB-NN):** —.
- **Workaround MSW (FB7.7):** `VITE_USE_MOCKS` con `false` por defecto. T-14 no declara T-11: el bootstrap de mocks en `main.tsx` lo agregan B-01 (backoffice) y W-06 (web) (RV-D03).

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB1 (Vite, React 18, React Router 6, TanStack Query 5), FB2 (estructura de `apps/`), FB3 (`src/app`, `src/features/*/routes.tsx`), FB7.5, FB7.7.
- `docs/frontend/tareas/INDEX.md`: FC3 (flag global), FC11 (`retry: 0` en mutaciones), FC14 (rutas estáticas antes que dinámicas; `routes.tsx`), FC15 (idioma).
- `docs/frontend/contratos-api/convenciones-transversales.md` §1.1 y §1.2 (origen de la API y `VITE_API_BASE_URL`), §1.4 (CORS: puertos 5173 y 5174).
- `docs/frontend/analisis-front.md` §2.1 (rutas del backoffice), §3.5 (árbol de carpetas), §7.5 (variables de entorno), §9.2 (`lang="es"`).
- `docs/frontend/design-system.md` §4 (preset de Tailwind, ruta del archivo) y §8.6 (`lang="es"`).
- `docs/frontend/pantallas/B1-login.md` §2 y `docs/frontend/pantallas/B2-inicio.md` §2 (rutas `/login` e `/inicio`).

## 5. Archivos a crear o modificar

| Archivo | Dueño |
|---|---|
| `apps/backoffice/vite.config.ts`, `.env.example`, `app/router.tsx`, `app/providers.tsx` | US-FE-T-14 (en el INDEX) |
| `apps/backoffice/index.html`, `src/main.tsx`, `src/index.css`, `src/vite-env.d.ts`, `tailwind.config.cjs`, `postcss.config.cjs` | US-FE-T-14 (ownership en RV-07) |
| `apps/backoffice/public/mockServiceWorker.js` | US-FE-T-14 (RV-07 f) |
| `apps/backoffice/src/app/queryClient.ts`, `app/ordenRutas.ts`, `app/PaginaNoEncontrada.tsx` | US-FE-T-14 |
| `apps/backoffice/src/app/guards/RequireSesion.tsx`, `RequireRol.tsx` (stubs) | Creados por T-14; reemplaza US-FE-T-13 |
| `apps/backoffice/src/app/layouts/LayoutBackoffice.tsx` (stub) | Creado por T-14; reemplaza US-FE-T-16 |
| `apps/backoffice/src/features/<dominio>/routes.tsx` (11 stubs) | Creados por T-14; la primera tarea del feature los completa |
| Tests en `app/` | US-FE-T-14 |

## 6. Pasos de implementación

1. `index.html`: `<html lang="es">`, `<title>Nexa Seguros · Backoffice</title>` (propuesta, §8), `<div id="root">` y `<script type="module" src="/src/main.tsx">`.
2. `vite.config.ts`: `defineConfig({ plugins: [react()], server: { port: 5173, strictPort: true } })`. No declarar alias de `@nexa/*`: lo resuelve el workspace (T-01 y T-02).
3. `tailwind.config.cjs`: `module.exports = { presets: [require('@nexa/config/tailwind/nexa.preset')], content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'] };`. Se usa `.cjs` porque el preset es CommonJS (design-system §4).
4. `app/queryClient.ts`: `new QueryClient({ defaultOptions: { mutations: { retry: 0 }, queries: { retry: reintentarConsulta, staleTime: 0 } } })`. `reintentarConsulta(intento, error)`: devuelve `false` si `error` es `ApiError` con status menor a 500 o igual a 429; si no, `intento < 2` (DP-3).
5. `app/providers.tsx`: `ProveedoresApp` renderiza `<QueryClientProvider client={queryClient}><RouterProvider router={router} /></QueryClientProvider>`. Dejar un comentario `// bloque de sesión: US-FE-T-13` donde irá el cableado de `401`.
6. `app/ordenRutas.ts`: `validarOrdenRutas(rutas: RouteObject[]): string[]` devuelve los paths donde una ruta estática aparece después de una dinámica del mismo nivel con prefijo compatible. Sirve a FC14 y se prueba en §10.
7. `app/router.tsx`: `export const router = createBrowserRouter([...])` con esta forma:
   - `auth.rutas` (públicas, incluye `/login` de B-01 cuando exista).
   - `{ element: <RequireSesion />, children: [{ element: <LayoutBackoffice />, children: rutasProtegidas }] }`, donde `rutasProtegidas` es la concatenación de `rutas` de las demás features en orden alfabético.
   - `{ path: '/', element: <Navigate to="/inicio" replace /> }`.
   - `{ path: '*', element: <PaginaNoEncontrada /> }`.
   - `errorElement` con un mensaje propio (§8).
8. Stubs: `RequireSesion` y `RequireRol` devuelven `<Outlet />` (y `RequireRol` el hijo sin chequeo). `LayoutBackoffice` devuelve `<Outlet />`. Cada stub tiene un comentario con el ID de la tarea que lo reemplaza.
9. Stubs `routes.tsx` de las once features: `export const rutas: RouteObject[] = [];`.
10. `main.tsx`: importar `./index.css`, los tokens de T-03 (`@nexa/ui/styles/tokens.css`) y ejecutar
    ```ts
    void iniciarMocksSiCorresponde().then(() => {
      createRoot(document.getElementById('root')!).render(<ProveedoresApp />);
    });
    ```
    Evitar `await` de nivel superior para no depender del target de Vite.
11. `.env.example`: `VITE_API_BASE_URL=http://localhost:8080` y `VITE_USE_MOCKS=false`. Sin secretos.
12. `vite-env.d.ts`: `interface ImportMetaEnv { readonly VITE_API_BASE_URL: string; readonly VITE_USE_MOCKS: string; }`.
13. Escribir los tests de §10.

## 7. Contrato con el back

No aplica: la tarea no hace requests ni define endpoints. Variables de entorno:

| Variable | Valor en `.env.example` | Uso |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080` | Origen de la API (convenciones §1.2). Con `dotnet run` se usa `http://localhost:5148` en `.env.local`. |
| `VITE_USE_MOCKS` | `false` | Activa MSW (FB7.7). Solo lo lee `iniciarMocksSiCorresponde`. |

## 8. Contenido de UI

- `<html lang="es">` (FB7.8, design §8.6).
- `<title>`: "Nexa Seguros · Backoffice" (propuesta, el Figma no define título).
- Página no encontrada (`PaginaNoEncontrada`): "Página no encontrada" (propuesta) y un enlace "Volver al inicio" a `/inicio` (propuesta).
- Error de ruta (`errorElement`): "Algo salió mal. Volvé a intentarlo." (propuesta).

## 9. Estados y casos borde

- `/` redirige a `/inicio`.
- Ruta desconocida muestra `PaginaNoEncontrada`.
- Puerto 5173 ocupado: Vite no arranca y no cambia de puerto (`strictPort`).
- `VITE_USE_MOCKS=false`: no se inicia MSW.
- Error al cargar una ruta: `errorElement`, sin pantalla en blanco.
- Un `routes.tsx` con rutas dinámicas antes que estáticas: `validarOrdenRutas` lo detecta en tests.

## 10. Tests requeridos

Vitest, Testing Library y `createMemoryRouter` con la misma composición de rutas.

- `app/router.test.tsx`
  - "`/` redirige a `/inicio`".
  - "una ruta desconocida muestra el texto de `PaginaNoEncontrada`".
  - "`router` existe y contiene una ruta por cada feature con `rutas` no vacías (test que no falla con los stubs vacíos)".
- `app/ordenRutas.test.ts`
  - "`/clientes/nuevo` antes que `/clientes/:clienteId` no produce error".
  - "`/clientes/:clienteId` antes que `/clientes/nuevo` produce un error en `validarOrdenRutas`".
  - "`/polizas/nueva` antes que `/polizas/:id` no produce error".
- `app/providers.test.tsx`
  - "`queryClient.getDefaultOptions().mutations?.retry` es `0`".
  - "`reintentarConsulta` no reintenta un error 404".
  - "`reintentarConsulta` no reintenta un error 429".
  - "`reintentarConsulta` reintenta un error 503 hasta 2 veces".
- `app/providers.test.tsx` (smoke)
  - "`ProveedoresApp` renderiza sin errores".

## 11. Criterios de aceptación

1. `npm run dev` en `apps/backoffice` sirve en `http://localhost:5173`, y con el puerto ocupado no arranca.
2. `index.html` tiene `lang="es"`.
3. `.env.example` existe, tiene las dos variables de §7 y no tiene secretos.
4. `/` redirige a `/inicio`; una ruta desconocida muestra `PaginaNoEncontrada`.
5. El router compone las rutas de las once features en el orden de §6, paso 7.
6. Existen los stubs de `RequireSesion`, `RequireRol`, `LayoutBackoffice` y los once `routes.tsx`.
7. `queryClient` tiene `retry: 0` para mutaciones (test de §10 en verde).
8. Ningún archivo de la app hace `fetch` directo (`rg "fetch\(" apps/backoffice/src` sin resultados).
9. Tests de §10, `lint`, `typecheck` y `build` en verde, con evidencia.

## 12. Verificación manual

1. En `apps/backoffice`, `npm run dev`. Abrir `http://localhost:5173`: la URL pasa a `/inicio`.
2. Abrir `http://localhost:5173/cualquiera`: aparece "Página no encontrada" y el enlace "Volver al inicio" lleva a `/inicio`.
3. Con otra terminal, levantar un servidor en el puerto 5173 y repetir `npm run dev`: Vite debe fallar con error de puerto, sin cambiar de puerto.

## 13. Decisiones pendientes

- **DP-1 Dependencia de US-FE-T-11 (resuelta, RV-D03).** Default: T-14 no importa `iniciarMocksSiCorresponde`. El bootstrap de mocks en `main.tsx` lo agregan B-01 (backoffice) y W-06 (web), que declaran T-11. T-14 no depende de T-11 y queda en Ola 1.
- **DP-2 Stubs de guardas y layout.** Default: T-14 crea los stubs para que el router compile; T-13 y T-16 los reemplazan. Alternativa: el router no incluye guardas ni layout hasta esas tareas. Tradeoff: la alternativa deja la app sin layout entre tareas.
- **DP-3 Reintentos de consultas.** Default: hasta 2 reintentos para errores 5xx y de red; ninguno para 4xx ni 429 (FC13 y convenciones §4). Alternativa: `retry: 0` global. Tradeoff: el default recupera de caídas breves; la alternativa es más simple.
- **DP-4 Textos de título, página no encontrada y error.** Default: propuestas de §8. Confirmar con producto.
- **DP-5 Formato de la config de Tailwind.** Default: `.cjs` (preset CommonJS). Alternativa: `.ts` si el preset se migra a ESM. Tradeoff: cambiar el preset obliga a tocar este archivo.

## 14. Riesgos y errores comunes

- Montar `RouterProvider` fuera de `QueryClientProvider` si después se usan hooks de TanStack en el layout: el orden de `ProveedoresApp` evita el problema.
- Cambiar el puerto a mano en tests o en `vite.config.ts` rompe CORS con el back (`Cors:AllowedOrigins` tiene 5173 y 5174, convenciones §1.4).
- Olvidar `lang="es"` rompe la lectura en lectores de pantalla (FC16).
- Poner `VITE_*` secretos en `.env.example`: las variables `VITE_*` se incrustan en el bundle y son públicas (convenciones §1.2).
- Ruta dinámica antes que estática (`/clientes/:clienteId` antes de `/clientes/nuevo`): la alta de cliente no se abre nunca. Por eso existe `validarOrdenRutas`.
- Un `tailwind.config` sin `packages/ui` en `content` deja sin estilos los componentes compartidos.
- Commitear `.env` en lugar de `.env.example`.

## 15. Definición de terminado

`npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` en verde en `apps/backoffice`. Criterios de §11 tildados con evidencia observada. Sin secretos. Accesibilidad: `lang="es"` presente y el foco de la página no encontrada queda en el `h1` (FC16); la revisión completa con US-FE-T-19 se hace en las pantallas.

## 16. Observaciones al índice

- Resuelto (RV-D03): T-14 declara T-03 y no declara T-11. El bootstrap de mocks lo agregan B-01 y W-06, que declaran T-11.
- Resuelto (RV-07): `index.html`, `main.tsx`, `index.css`, `vite-env.d.ts`, `tailwind.config.*` y `postcss.config.*` son de T-14 (scaffold backoffice; T-17 para la web). El INDEX los registra en la tabla de ownership.
- Resuelto (RV-16 / RV-07): los stubs de `app/guards/*` (los reemplaza T-13) y de `app/layouts/*` (los reemplaza T-16) los crea T-14.
- Resuelto (RV-07): `app/queryClient.ts`, `app/ordenRutas.ts` y `app/PaginaNoEncontrada.tsx` los crea T-14, y el INDEX los registra en la tabla de ownership.
