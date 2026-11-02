# US-FE-T-17: Scaffold web pública

Tipo T · Oleada 1 · Tamaño S · Rama sugerida `feature/US-FE-T-17-scaffold-web` · Tarjeta Trello `US-FE-T-17`

## 1. Objetivo

Dejar `apps/web-publica` arrancando con Vite en el puerto **5174** (`strictPort: true`), con los providers de datos, un router público que compone los `routes.tsx` de cada feature web, `lang="es"` en el HTML y `.env.example` con las variables documentadas. Al terminar, la app abre en `http://localhost:5174` sin pantallas (solo el contenedor vacío), `build` genera `dist/` y los tests del router pasan.

Lo usan: US-FE-T-18 (layout público), US-FE-W-01 a W-08 (pantallas que reemplazan los stubs) y US-FE-T-20 (Docker del front).

## 2. Alcance

**Entra**
- `apps/web-publica/index.html` con `<html lang="es">` y `<title>Nexa Seguros</title>`.
- `apps/web-publica/vite.config.ts` (objeto, no función) con `server` y `preview` en `port: 5174`, `strictPort: true`, y el plugin de React.
- `apps/web-publica/.env.example` con placeholders (ver sección 7).
- `apps/web-publica/tsconfig.json` que extiende la base de `@nexa/config` (publicada por US-FE-T-02).
- `apps/web-publica/src/vite-env.d.ts` que tipa `VITE_API_BASE_URL` y `VITE_USE_MOCKS`.
- `apps/web-publica/src/index.css`, `tailwind.config.ts` y `postcss.config.js` (archivos de la app que el INDEX asigna a esta tarea, RV-07 b y RV-23).
- `apps/web-publica/public/mockServiceWorker.js`: copia de la app web (RV-07 f).
- `apps/web-publica/src/app/queryClient.ts`, `src/app/ordenRutas.ts` y `src/app/PaginaNoEncontrada.tsx` (RV-07 b).
- `apps/web-publica/src/main.tsx`: monta `<Providers>` y `<RouterProvider>`.
- `apps/web-publica/src/app/providers.tsx`: `QueryClientProvider` con defaults de la sección 13.
- `apps/web-publica/src/app/router.tsx`: `createBrowserRouter` que compone los `rutas` de cada feature web (FC14).
- `apps/web-publica/src/app/layouts/PublicLayout.tsx`: **stub** con `<Outlet />` y un comentario `// stub: US-FE-T-18 lo reemplaza`. El ownership del INDEX asigna este archivo a T-18; T-17 solo lo crea para que el router compile y T-18 reemplaza su contenido sin tocar `router.tsx`.
- Stubs de rutas: `apps/web-publica/src/features/{inicio,planes,polizas,pagos,pago-facil}/routes.tsx`, cada uno con `export const rutas: RouteObject[] = [];`.
- Tests: `apps/web-publica/src/app/router.test.ts` y `apps/web-publica/src/app/config.test.ts` (sección 10).

**NO entra**
- PublicNav, PublicFooter y el layout real: US-FE-T-18.
- Cualquier pantalla W1 a W6, `index.ts` de features, hooks o componentes de dominio: US-FE-W-01 a W-08. La primera tarea de cada feature reemplaza su stub de `routes.tsx` y crea su `index.ts` (FC1).
- Activación de MSW en `main.tsx` (`VITE_USE_MOCKS`, `iniciarMocks`): la agrega US-FE-W-06 (RV-D03). T-17 no importa `iniciarMocks`.
- Dockerfile y compose: US-FE-T-20.
- Agregar o cambiar dependencias npm o el `package.json` de la app: US-FE-T-01 (FC17).
- Preset de Tailwind, tokens y fuentes: US-FE-T-03.

## 3. Dependencias

- **Depende de:** US-FE-T-02, US-FE-T-03, US-FE-T-08.
- **Oleada:** 1.
- **Puede empezar sin esperar a:** US-FE-T-18.
- **Bloqueada por pedidos al back (PB-NN):** ninguno.
- **Workaround MSW (FB7.7):** no aplica. La app no hace llamadas en esta tarea.

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB1 (stack), FB2 (monorepo), FB3 (reglas 1 a 5), FB7.7 (flag `VITE_USE_MOCKS`).
- `docs/frontend/tareas/INDEX.md`: sección "Convenciones comunes", FC1, FC14, FC15, FC17; sección "Ownership de archivos compartidos", filas de `apps/web-publica/...` y `apps/*/src/features/<dominio>/routes.tsx`.
- `docs/frontend/analisis-front.md`: §2.2 (rutas web), §3.3 (features web), §3.5 (árbol de carpetas web), §7.5 (variables y puertos).
- `docs/frontend/contratos-api/convenciones-transversales.md`: §1.1 (puertos y URLs), §1.2 (`VITE_API_BASE_URL`), §1.4 (CORS: el origen debe ser exacto, `http://localhost:5174`).

## 5. Archivos a crear

Todos bajo `frontend/apps/web-publica/`:

| Archivo | Dueño | Notas |
|---|---|---|
| `index.html` | T-17 | `lang="es"` |
| `vite.config.ts` | T-17 | Puerto 5174 |
| `tsconfig.json` | T-17 | Extiende la base de T-02 |
| `.env.example` | T-17 | Placeholders |
| `src/vite-env.d.ts` | T-17 | Tipos de `import.meta.env` |
| `src/index.css`, `tailwind.config.ts`, `postcss.config.js` | T-17 | Ownership del INDEX (RV-07 b, RV-23). Sin stub de T-01 |
| `public/mockServiceWorker.js` | T-17 | Copia de la app web (RV-07 f) |
| `src/app/queryClient.ts`, `src/app/ordenRutas.ts`, `src/app/PaginaNoEncontrada.tsx` | T-17 | Ownership del INDEX (RV-07 b) |
| `src/main.tsx` | T-17 | Punto de entrada |
| `src/app/providers.tsx` | T-17 | Ownership del INDEX |
| `src/app/router.tsx` | T-17 | Ownership del INDEX |
| `src/app/router.test.ts`, `src/app/config.test.ts`, `src/app/providers.test.tsx` | T-17 | |
| `src/app/layouts/PublicLayout.tsx` | T-17 crea el stub; T-18 es dueña del contenido | Ver sección 2 |
| `src/features/inicio/routes.tsx` | Stub T-17; dueña la primera tarea del feature (US-FE-W-01) | |
| `src/features/planes/routes.tsx` | Stub T-17; dueña US-FE-W-02 | |
| `src/features/polizas/routes.tsx` | Stub T-17; dueña US-FE-W-03 | |
| `src/features/pagos/routes.tsx` | Stub T-17; dueña US-FE-W-06 | |
| `src/features/pago-facil/routes.tsx` | Stub T-17; dueña US-FE-W-07 | |

No crear `src/features/*/index.ts` ni `src/shared/` en esta tarea.

## 6. Pasos de implementación

1. Verificar que `frontend/apps/web-publica/package.json` existe (T-01). No editarlo.
2. Crear `index.html` con `<html lang="es">`, `<meta name="viewport" content="width=device-width, initial-scale=1">`, `<title>Nexa Seguros</title>` y `<div id="root">`.
3. Crear `vite.config.ts`: exportar un objeto literal con `plugins: [react()]`, `server: { port: 5174, strictPort: true }` y `preview: { port: 5174, strictPort: true }`. Sin función, para que el test de la sección 10 lo lea directamente.
4. Crear `tsconfig.json` con `"extends"` a la base de `@nexa/config` (nombre exacto que publique T-02) e `include` de `src`.
5. Crear `src/vite-env.d.ts`: declarar `ImportMetaEnv` con `readonly VITE_API_BASE_URL: string` y `readonly VITE_USE_MOCKS?: string`.
6. Crear `src/app/providers.tsx`: exportar `Providers` que envuelve `children` en `QueryClientProvider` con el `QueryClient` de la sección 13.
7. Crear los cinco stubs `routes.tsx` con `export const rutas: RouteObject[] = [];` (importar `RouteObject` de `react-router-dom`, v6).
8. Crear `src/app/layouts/PublicLayout.tsx` con `export function PublicLayout() { return <Outlet />; }` y el comentario de stub.
9. Crear `src/app/router.tsx`: exportar `router = createBrowserRouter([{ element: <PublicLayout />, children: [...rutasInicio, ...rutasPlanes, ...rutasPolizas, ...rutasPagos, ...rutasPagoFacil] }])`. Los imports de cada `routes.tsx` van con alias (`rutasInicio`, `rutasPlanes`, etc.) para que el orden y el origen sean legibles. Esta tarea no agrega ningún path.
10. Crear `src/main.tsx`: obtener el nodo `root` con guarda (si `document.getElementById('root')` es `null`, lanzar un error explícito; sin `!`) y hacer `createRoot(raiz).render(...)` con `<Providers><RouterProvider router={router} /></Providers>` dentro de `StrictMode`. No lee `VITE_USE_MOCKS` ni llama a `iniciarMocks`: el bootstrap de mocks lo agrega W-06 (RV-D03).
11. Crear `.env.example` (sección 7).
12. Escribir los tests de la sección 10 antes de cerrar la tarea y correrlos.
13. Correr `build` de la app y el dev server para observar el puerto.

## 7. Contrato con el back

No aplica: la tarea no hace requests. Se fijan solo las variables de entorno:

```dotenv
# apps/web-publica/.env.example (placeholders, sin secretos)
VITE_API_BASE_URL=http://localhost:8080
VITE_USE_MOCKS=true
```

- `VITE_API_BASE_URL` es solo el origen, sin `/api` (convenciones §1.2). Con Docker Compose local del back el valor es `http://localhost:8080`; con `dotnet run`, `http://localhost:5148`.
- Las variables `VITE_*` se incrustan en el bundle y son públicas: nunca poner claves ni tokens (FB7.5, convenciones §1.2).
- Un `.env` real no se commitea. Solo `.env.example` (`docs/workflow.md`, reglas de secretos).

## 8. Contenido de UI

No aplica: no hay textos de pantalla. El único texto visible es el título del documento, `Nexa Seguros` (marca de W1 §5).

## 9. Estados y casos borde

- **Puerto ocupado:** con `strictPort` Vite falla con error. No debe cambiar a otro puerto. Un origen distinto de `http://localhost:5174` falla en CORS sin body legible (convenciones §1.4).
- **Ruta inexistente:** el router debe responder sin crashear. Sin pantallas, solo `/` renderiza el `Outlet` vacío del stub.
- **Variables faltantes:** si `VITE_API_BASE_URL` no está definida, la app debe arrancar igual (no hay llamadas en esta tarea). El cliente de T-08 es quien la valida al usarla.
- **Mocks activados (`VITE_USE_MOCKS=true`):** T-17 no lee el flag. Ningún archivo de la app lo lee en esta tarea (FB7.7); el bootstrap de `main.tsx` lo agrega W-06 (RV-D03).

## 10. Tests requeridos

Vitest + Testing Library. Un test por regla.

| Archivo | Test | Afirma |
|---|---|---|
| `src/app/router.test.ts` | `crea el router sin lanzar` | `router` es una instancia válida con al menos una ruta raíz. |
| `src/app/router.test.ts` | `no declara dos rutas con el mismo path` | Recorrer `router.routes` recursivamente; no hay paths duplicados. |
| `src/app/router.test.ts` | `declara las rutas estáticas antes que las dinámicas con el mismo prefijo` | FC14: para cada path con `:`, ninguna ruta estática del mismo prefijo aparece después. Con los stubs vacíos el test pasa trivialmente; queda como guarda para W-01 a W-08. |
| `src/app/config.test.ts` | `vite.config expone el puerto 5174 con strictPort` | `server.port === 5174`, `server.strictPort === true`, `preview.port === 5174`, `preview.strictPort === true`. |
| `src/app/config.test.ts` | `index.html declara lang="es"` | Leer `index.html` y comprobar `<html lang="es">`. |
| `src/app/providers.test.tsx` | `las mutaciones no reintentan` | El `QueryClient` del provider tiene `defaultOptions.mutations.retry === 0` (FC11). |

## 11. Criterios de aceptación

1. `apps/web-publica/index.html` tiene `<html lang="es">`.
2. `vite.config.ts` define `server.port` y `preview.port` en 5174 con `strictPort: true`.
3. `npm run dev` de la app levanta en `http://localhost:5174` y no cambia de puerto si está ocupado.
4. `/` renderiza sin errores en consola (el stub de layout con `Outlet` vacío).
5. Existen los cinco stubs `routes.tsx` y `router.tsx` los compone en el orden de la sección 6, paso 9.
6. `src/vite-env.d.ts` tipa `VITE_API_BASE_URL` como `string`.
7. `.env.example` contiene solo los dos placeholders de la sección 7; no hay `.env` en el diff.
8. El `QueryClient` tiene `mutations.retry = 0`.
9. Ningún archivo de T-17 lee `VITE_USE_MOCKS`.
10. `npm run build` de la app genera `dist/` sin errores.
11. `npm run lint`, `npm run typecheck` y `npm run test` del workspace están en verde.
12. No aparece `any` explícito ni `fetch` en el código de la app.

## 12. Verificación manual

Pasos para la persona responsable antes del PR:

1. Correr `npm run dev` de `apps/web-publica` y abrir `http://localhost:5174`. Esperado: página vacía, sin errores en la consola del navegador.
2. Abrir `http://localhost:5174/ruta-inexistente`. Esperado: sin pantalla de error de Vite ni crash.
3. Ocupar el puerto 5174 (otro proceso) y volver a correr `npm run dev`. Esperado: Vite falla con error de puerto ocupado, sin moverse a 5175.

Confirmar el resultado con el equipo antes de abrir el PR (`docs/workflow.md`, regla 7).

## 13. Decisiones pendientes (con default)

- **Defaults de TanStack Query:** queries con `retry: 1`; mutaciones con `retry: 0` (FC11). Default: esto. Si el equipo cambia el default de queries, se cambia en `providers.tsx`.
- **Activación de MSW:** la agrega US-FE-W-06 en `main.tsx` (RV-D03). T-17 no importa `iniciarMocks`.
- **Estilos de `@nexa/ui`:** default: `main.tsx` importa el archivo de estilos que publica US-FE-T-03 (dependencia declarada en la sección 3).
- **Título del documento:** default `Nexa Seguros`. Confirmar con diseño (W1 §13 #11).

## 14. Riesgos y errores comunes

- **Quitar `strictPort`:** Vite cambia a 5175 y la API deja de aceptar el origen (CORS exacto). Mantener `strictPort: true`.
- **Abrir la app con `127.0.0.1:5174`:** el origen es distinto de `localhost:5174` y CORS falla. Documentar en el README (US-FE-T-22).
- **Leer `VITE_USE_MOCKS` en un feature:** rompe FB7.7. Solo el bootstrap de W-06 en `main.tsx` lo lee.
- **Poner una ruta dinámica antes que una estática:** FC14. El test de la sección 10 lo detecta cuando haya rutas reales.
- **Editar `package.json` para agregar una librería:** FC17. Pedirlo a T-01.
- **Commitear `.env`:** solo `.env.example`.

## 15. Definición de terminado

- `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` en verde.
- Accesibilidad: `<html lang="es">` verificado por test.
- Sin secretos en el diff.
- Los 12 criterios de la sección 11 tildados con evidencia observada (salida del comando o captura de la prueba de la sección 12).

## 16. Observaciones al índice

- Resuelto (RV-17): `PublicLayout.tsx` es de T-18; T-17 crea el stub (sección 2) para que el router compile, y T-18 reemplaza su contenido sin tocar `router.tsx`. El INDEX lo registra como "stub T-17, dueña T-18".