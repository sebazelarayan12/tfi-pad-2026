# Índice de tareas del frontend

Objetivo: dividir todo el front (dos apps React, backoffice y web pública) en tarjetas de Trello. Una tarea = una tarjeta = una rama = un PR hacia `development`.

**Cómo usar este índice.** Elegí una tarea por su fila. Antes de tomarla: (1) verificá que todas sus dependencias "Depende de" estén mergeadas; (2) leé `tareas/<ID>.md` (detalle, criterios de aceptación); (3) leé solo los documentos que ese archivo enlaza (pantalla, contrato, PB). Los IDs y nombres de este índice no cambian sin actualizar todas las referencias.

**Fuentes:** `00-decisiones-base.md` (FB1..FB7, manda), `analisis-front.md`, `pedidos-al-back.md` (PB-NN), `pantallas/*.md`, `contratos-api/*.md`, `design-system.md`.

**Leyenda de estado de endpoint** (de `analisis-front.md` §4): *Impl* = Implementado en `development`; *PR #50* = en PR sin merge; *Esp* = Especificado (solo spec); *NO* = NO EXISTE. Todo endpoint *PR #50*, *Esp* o *NO* se trabaja con MSW (FB7.7) hasta que el back lo publique.

**Tamaño:** S (menos de ~250 líneas propias), M (~250 a ~400). Ninguna tarea supera ~400 líneas; las pantallas grandes se partieron.

**Dependencias:** "Depende de" = código o tipos que tienen que estar mergeados antes (imports reales). Navegar a otra pantalla por ruta **no** es dependencia. "Puede empezar sin esperar a" = tareas relacionadas que no hace falta esperar porque la tarea trabaja contra MSW o contra tipos fijados en su detalle.

**Oleadas:** `Ola N` = 1 + máximo de las dependencias de la tarea (Ola 0 no tiene dependencias).

---

## Convenciones comunes

- **FC1. Ownership por feature.** Cada app tiene `src/features/<dominio>/` (FB3) con `api/`, `components/`, `pages/`, `schemas/`, `types/` e `index.ts`. El primer task que crea una feature es dueño de su `index.ts`; los demás lo editan en su PR y declaran como dependencia a ese primer task. Un feature importa de otro solo por su `index.ts`.
- **FC2. Requests en `@nexa/api`, hooks en la app.** Las funciones de request tipadas y los DTO viven en `@nexa/api` (dueño: la tarea API del dominio, `US-FE-T-24..T-32`, o `US-FE-T-12` para comunes y auth). Regla de hooks: cada tarea escribe hooks TanStack Query solo dentro de `features/<dominio>/api/` de su propio feature. Para leer otro dominio consume las funciones de request de `@nexa/api` (nunca el hook de otro feature). Cada API card exporta también las query keys de sus endpoints (por ejemplo `polizasKeys.lista(filtros)`), así una mutación en un feature invalida la caché de otro. Ninguna tarea escribe en la carpeta de otro feature. Excepciones (RV-D04, RV-D16): `auth` tiene tipos en T-12 y funciones de `/api/auth/*` en T-32; `inicio` no tiene API card hasta PB-08, así que su request, tipo y hook viven en `features/inicio/`.
- **FC3. MSW.** Un handler por dominio en `packages/api/mocks/handlers/<dominio>.ts`, dueño la tarea API. El agregador lo mantiene `US-FE-T-11`. El handler replica método, URL, body y respuesta del `contratos-api/*.md`. `VITE_USE_MOCKS` es un flag global; el código de feature nunca lo lee. Pasar a real = cambiar el flag, sin tocar código. Excepción (RV-D29): un filtro que el back real ignora se oculta con constante hasta que su PB se publique; no se activa con el flag.
- **FC4. Datos de ejemplo.** Solo los que aparecen en los documentos. Nada de nombres de muestra ("Tomás Iturralde") como texto fijo (`design-system.md §9.16`).
- **FC5. Tests mínimos por tipo.** Pantalla: un test por regla de validación, por cada estado (carga, vacío, error) y por cada error mapeado (propuesta de `analisis-front.md §8.3`, ver D-28). API card: test de contrato con el harness de `US-FE-T-23` y un test por cada código de error de su tabla. Primitivo UI: un test por estado. Regla de UI: un test por regla. Vitest + Testing Library + MSW (FB1). Las API cards agregan su `<dominio>.contract.test.ts` al rebasar sobre T-23, sin dependencia declarada (RV-D31).
- **FC6. Definición de terminado.** Se cumplen todos los criterios de aceptación de `tareas/<ID>.md` y cada uno tiene evidencia observada. Checkboxes sin evidencia no cuentan (`docs/workflow.md`).
- **FC7. Ramas y commits.** Rama `feature/US-FE-<X>-NN-nombre` desde `development` actualizado (nunca desde `main`). Commit Conventional: `feat(front): US-FE-B-03 descripción` (o `fix(front)`, `docs:`). Verificar `git branch --show-current` antes de cada commit. PR hacia `development`. Push y PR solo con pedido explícito (`docs/workflow.md`, reglas 1 a 5).
- **FC8. Verificación antes del PR.** `lint`, `typecheck`, `test` y `build` en verde (job `frontend` de `US-FE-T-01`). Accesibilidad: revisión con el harness de `US-FE-T-19` en cada pantalla. Los primitivos usan `vitest-axe` directo; T-19 es el helper de pantallas (RV-49). Prueba manual local si hay algo que probar a mano: se le pasan al usuario los pasos y se espera su confirmación (`docs/workflow.md`, regla 7).
- **FC9. Enums, fechas y dinero.** Ningún componente usa números crudos de enum: se usa el mapa `(dominio, valor)` de `US-FE-T-10`. Importes, fechas y DNI pasan por el único formateador de `US-FE-T-09`. Nadie formatea a mano (FB4).
- **FC10. Errores.** Todo error llega como `ApiError` (`US-FE-T-08`). La UI muestra `detail`; marca un campo solo si llega `errors` por campo; nunca muestra prefijos `RNxx:`. Los textos en inglés de ASP.NET se traducen en `US-FE-T-10` (FB7.6). Excepciones: marcar el campo DNI con 404 por `codigo` (T-25, RV-D23); login y 404 de W-03 muestran el texto del Figma, no `detail` (RV-D01, FB8).
- **FC11. Mutaciones sensibles.** `retry: 0` en toda mutación; el botón se deshabilita mientras corre; nunca se dispara una mutación de pago, cotización o emisión al montar una pantalla; no se reenvía a ciegas tras error de red (FB7.9).
- **FC12. Almacenamiento.** Sesión backoffice en memoria y `sessionStorage`, nunca `localStorage` (FB7.5). Web pública: DNI, cuotas y resultados viajan en `location.state`; único dato en `sessionStorage` es `numeroPago` (W4 §8). Sin cookies.
- **FC13. Red.** Nada de `fetch` suelto en componentes (FB1). Todo pasa por el cliente de `US-FE-T-08`. Las rutas `/api/publico/*` no reintentan ante 429 (`convenciones-transversales.md §4`).
- **FC14. Router.** Rutas estáticas antes que dinámicas (`/clientes/nuevo` antes de `/clientes/:clienteId`, `/polizas/nueva` antes de `/polizas/:id`). Cada feature exporta sus rutas desde `routes.tsx`; el router solo las compone.
- **FC15. Idioma.** Textos de UI en español del Figma, con voseo, tal cual (FB5). Código, identificadores y comentarios técnicos en inglés o español según el archivo ya existente (`00-decisiones-base.md`: identificadores técnicos en inglés).
- **FC16. Accesibilidad.** Labels visibles (nunca placeholder como label), `aria-invalid` y `aria-describedby` en errores, `role="alert"` en alertas de resultado, foco al primer error o al `h1` según la pantalla, `focus-visible` con anillo de 2 px en interactivos (propuesta de `design-system.md §8.3`), `lang="es"` (FB7.8, `analisis-front.md §9.2`).
- **FC17. Dependencias npm.** T-01 declara todas las dependencias del stack (FB1, FB7). Ninguna otra tarea edita un `package.json` ni el lockfile. Si falta una librería, se pide el cambio a T-01 o se acuerda con el equipo; única excepción: T-21 (ver Ownership).
- **FC18. Cliente HTTP en los hooks.** Las funciones de request de `@nexa/api` reciben el cliente como primer parámetro: `fn(cliente: ApiClient, ...args)` (D-T08-2: el paquete no tiene cliente global). Los §7 de las fichas API y los hooks de ejemplo de las fichas de pantalla escriben `fn(body)` por brevedad. En un hook: `const cliente = useApiClient();` y `mutationFn: (body) => fn(cliente, body)` o `queryFn: () => fn(cliente, filtros)`; nunca `mutationFn: fn` directo. `ApiClientProvider` y `useApiClient` viven en `@nexa/api` (dueña US-FE-B-01). Cada app monta el provider en su `app/providers.tsx` con el cliente de `app/apiClient.ts`; los features no importan de `app/` (FC1). En los tests, el provider recibe un cliente apuntando a MSW.

---

## Tabla índice

Pantallas enlazadas en la columna "Pantallas". Detalle en `tareas/<ID>.md`.

| ID | Título | Alcance (máx. 2 líneas) | Tipo | Pantallas | Endpoints (estado) | Ola | Depende de | Puede empezar sin esperar a | Bloqueada por PB (workaround MSW) | Tamaño | Detalle |
|---|---|---|---|---|---|---|---|---|---|---|---|
| US-FE-T-01 | Monorepo y CI del front | Crea `frontend/` con npm workspaces (`apps/backoffice`, `apps/web-publica`, `packages/ui`, `packages/api`, `packages/config`), Node 20 y scripts raíz lint/typecheck/test/build. Crea todos los `package.json` de workspace y el lockfile, e instala el stack de FB1 y FB7 (React 18, Vite, React Router 6, TanStack Query 5, react-hook-form, zod, Tailwind 3.4, @phosphor-icons/react, @fontsource, MSW, Vitest, Testing Library, vitest-axe, ESLint, Prettier, eslint-plugin-boundaries). Agrega el job `frontend` en CI sin tocar `backend`. Declara los paquetes de RV-24: `@hookform/resolvers`, `jsdom`, `@testing-library/dom`, `@testing-library/user-event`, `@testing-library/jest-dom`, `@vitejs/plugin-react`, `postcss`, `autoprefixer`, `typescript`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-config-prettier`, `eslint-plugin-jsx-a11y`, `@types/*`, `@fontsource/*`, `cross-env`, `zod` (devDep de `packages/api`), `@playwright/test` y el `exports` de `@nexa/ui/testing`. Stubs de `packages/config/tsconfig.base.json`, `tsconfig.react.json` y `packages/*/tsconfig.json` (RV-07 c). | T | — | — | 0 | — | Nada | — | S | [ver](US-FE-T-01.md) |
| US-FE-T-02 | `@nexa/config`: TS, ESLint, Prettier, Vitest | `tsconfig` base `strict`, ESLint con `eslint-plugin-boundaries` (reglas 1 a 4 de FB3), Prettier y configuración base de Vitest y Testing Library. | T | — | — | 0 | — (rebase sobre T-01, RV-D02) | Nada | — | M | [ver](US-FE-T-02.md) |
| US-FE-T-03 | `@nexa/ui`: tokens, preset Tailwind y fuentes | `tokens.css` con los tokens de `design-system.md §1 a §3`, preset `@nexa/config/tailwind` y fuentes `@fontsource` (FB7.2). Dueño de `packages/ui/src/index.ts`. | T | — | — | 0 | — (rebase sobre T-01) | Nada | — | M | [ver](US-FE-T-03.md) |
| US-FE-T-04 | `@nexa/ui`: Input y Select | Estados Default/Focus/Error/Disabled, label visible, `aria-invalid` y `aria-describedby`, foco de 2 px, alto táctil (`design-system.md §5.2, §5.3`). | T | — | — | 1 | US-FE-T-02, US-FE-T-03 | US-FE-T-05, US-FE-T-06 | — | M | [ver](US-FE-T-04.md) |
| US-FE-T-05 | `@nexa/ui`: Button, Chip y Badge/Estado | Button (`§5.1`), Chip seleccionable con Seleccionado, Sin seleccionar y Destacado (`§5.5`), Badge/Estado por variante (`§5.4`). Foco visible propuesto (`§8.3`). | T | — | — | 1 | US-FE-T-02, US-FE-T-03 | US-FE-T-04, US-FE-T-06 | — | M | [ver](US-FE-T-05.md) |
| US-FE-T-06 | `@nexa/ui`: Table y Tabs | Table/Header y Table/Row con `<th scope="col">` y `<caption>`; Tabs con patrón `tablist`, `tab`, `tabpanel` (`analisis-front.md §9.2`). | T | — | — | 1 | US-FE-T-02, US-FE-T-03 | US-FE-T-04, US-FE-T-05 | — | M | [ver](US-FE-T-06.md) |
| US-FE-T-07 | `@nexa/ui`: Card/Widget, Dato, AlertaError, Backdrop, Logo, Dialogo, Shell | CardWidget (`§5.13`), Dato (par etiqueta/valor), AlertaError con `role="alert"` (lo usan B1 y B4), Backdrop (`§5.14`), Logo/Nexa (`§5.7`), `Dialogo` de confirmación (RV-D05: lo usan B-05, B-08, B-23) y `Shell` compartido (RV-D06: lo usan T-16 y T-18). | T | — | — | 1 | US-FE-T-02, US-FE-T-03 | US-FE-T-04, US-FE-T-05 | — | M | [ver](US-FE-T-07.md) |
| US-FE-T-08 | `@nexa/api`: cliente HTTP y errores | Cliente único con base `VITE_API_BASE_URL`, `Authorization` desde un getter de token, body JSON o FormData, `ApiError` desde ProblemDetails y ValidationProblemDetails, callback `onUnauthorized` (FB7.5, FB7.7). No importa apps. Expone la respuesta cruda (status, Content-Type, texto) para la base positiva (RV-18); `POST` sin reintento (FC11); valida `ProblemDetails` con guardas sobre `unknown` (RV-D08); colabora en el barrel `packages/api/src/index.ts` (RV-14). | T | — | — | 0 | — (rebase sobre T-01) | Nada | — | M | [ver](US-FE-T-08.md) |
| US-FE-T-09 | `@nexa/api`: formateadores | Importe `es-AR` (`$ 25.000,00`), `DateOnly` sin zona, `DateTime` sin `Z` tratado como UTC y mostrado en `America/Argentina/Buenos_Aires`, DNI con puntos (FB7.4, `convenciones §5.3, §5.4`). Exporta `parseImporteEsAR` en `packages/api/src/format/` (RV-26). | T | — | — | 0 | — (rebase sobre T-01 y T-02, RV-D02) | Nada | — | S | [ver](US-FE-T-09.md) |
| US-FE-T-10 | `@nexa/api`: mapas de enums y mensajes | Mapa `(dominio, valor)` → literal, etiqueta y variante Badge (FB7.3, `analisis-front §6.2`). Traducción de mensajes de validación en inglés y de `detail` sin prefijo `RNxx:` (FB7.6, PB-15). `EstadoBadgeValue` en `packages/api/src/enums/` (RV-22); T-05 define su propia unión de 9 literales y una prueba compara ambas (RV-D07). | T | — | — | 1 | US-FE-T-08, US-FE-T-12 | US-FE-T-11, US-FE-T-24..T-32 | PB-13 (mapa por dominio, sin converter global) | M | [ver](US-FE-T-10.md) |
| US-FE-T-11 | `@nexa/api`: MSW base | `mocks/server.ts` (tests) y `browser.ts` (dev), flag `VITE_USE_MOCKS`, agregador `handlers/index.ts` con placeholders por dominio, fixtures comunes (FB7.7). | T | — | — | 1 | US-FE-T-08, US-FE-T-12 | US-FE-T-10 | — | M | [ver](US-FE-T-11.md) |
| US-FE-T-12 | `@nexa/api`: barrel, DTO comunes y auth | Dueño de `packages/api/src/index.ts` y de `src/dto/` (un archivo por dominio, vacíos salvo comunes). Tipos `ProblemDetails`, `ValidationProblemDetails`, `PaginaResponse<T>`, `LoginRequest`, `LoginResponse`, `RolUsuario` (`analisis-front §6.1`). Tipos de `/api/auth/*` (solo tipos; las funciones las escribe T-32, RV-D04). | T | — | — | 0 | — | Nada | — | S | [ver](US-FE-T-12.md) |
| US-FE-T-13 | Backoffice: sesión y guardas | `features/auth`: store de sesión (token, rol, `expiraEn`) en memoria y `sessionStorage` con try/catch, margen de 5 s, 401 global a `/login` (FB7.5). `app/guards`: `RequireSesion` y `RequireRol` (Admin, FB7.10). Selector `emailSesion` para el saludo de B-02 (RV-19). | T | — | — | 2 | US-FE-T-08, US-FE-T-12, US-FE-T-14 | US-FE-T-15 | — | M | [ver](US-FE-T-13.md) |
| US-FE-T-14 | Scaffold backoffice | Vite en puerto 5173 con `strictPort`, React 18, providers (QueryClient con `retry: 0` en mutaciones), router `createBrowserRouter` que compone los `routes.tsx` de cada feature (FC14), `lang="es"`, `.env.example`, stubs de `routes.tsx`. El bootstrap de mocks en `main.tsx` lo agregan B-01 (backoffice) y W-06 (web); T-14 no declara T-11 (RV-D03). | T | — | — | 1 | US-FE-T-02, US-FE-T-03, US-FE-T-08 | US-FE-T-15 | — | M | [ver](US-FE-T-14.md) |
| US-FE-T-15 | `@nexa/ui`: NavItem y Sidebar | NavItem con estados y foco (`§5.6`), Sidebar que recibe sus ítems por prop (`§5.8`). El filtrado por rol lo hace el layout (FB7.10). | T | — | — | 2 | US-FE-T-03, US-FE-T-05, US-FE-T-07 | US-FE-T-13 | — | S | [ver](US-FE-T-15.md) |
| US-FE-T-16 | Backoffice: Topbar, Shell y LayoutBackoffice | Topbar con campana (`aria-label`) y usuario (`§5.9`), Shell blanco flotante (`§5.15`, vive en `@nexa/ui` por T-07, RV-D06), `LayoutBackoffice` con sidebar filtrada por rol: Planes y Usuarios solo Admin. | T | — | — | 3 | US-FE-T-05, US-FE-T-07, US-FE-T-13, US-FE-T-14, US-FE-T-15, US-FE-T-19 | US-FE-B-01 (login, sin layout), US-FE-W-02 | — | M | [ver](US-FE-T-16.md) |
| US-FE-T-17 | Scaffold web pública | Vite en puerto 5174 con `strictPort`, providers, router público compuesto por `routes.tsx` de W1 a W6, `lang="es"`, `.env.example`, stubs. Stub de `PublicLayout` (dueña T-18, RV-17). | T | — | — | 1 | US-FE-T-02, US-FE-T-03, US-FE-T-08 | US-FE-T-18 | — | S | [ver](US-FE-T-17.md) |
| US-FE-T-18 | Web: PublicNav, PublicFooter y PublicLayout | PublicNav de 72 px con menú mobile `icon/list` (destino NO DEFINIDO, sin link), PublicFooter con "A confirmar" como texto fijo (`§5.10, §5.11`; W1 D10), `PublicLayout` (dueño). `PublicNav` y `PublicFooter` viven en `@nexa/ui` (RV-09). | T | — | — | 2 | US-FE-T-07, US-FE-T-17 | US-FE-W-02 | — | S | [ver](US-FE-T-18.md) |
| US-FE-T-19 | Accesibilidad transversal | Harness `vitest-axe`, helper reutilizable de test a11y, checklist de `analisis-front §9.2`, registro de pedidos de contraste en `design-system.md §9` (FB7.8, RV-D25). No cambia colores. Primitivos: `vitest-axe` directo; el helper es para pantallas (RV-49). Helper en `packages/ui/src/testing/` (RV-20). | T | — | — | 2 | US-FE-T-04, US-FE-T-05, US-FE-T-06, US-FE-T-07 | Nada | — | S | [ver](US-FE-T-19.md) |
| US-FE-T-20 | Docker y despliegue del front | Dockerfile multi-stage por app (build Vite y servidor estático), servicios en `frontend/docker-compose.yml` (archivo propio; el compose del back no se toca), `VITE_API_BASE_URL` como build arg pública, CORS con puertos 5173 y 5174 (`convenciones §1.1, §1.4`). `frontend/docker/nginx.conf` es propio de T-20 (RV-07 a). Hosting de producción sin decidir: las imágenes sirven en cualquier host (RV-D19) **[CONFIRMAR]** infraestructura. | T | — | — | 2 | US-FE-T-14, US-FE-T-17 | Nada | — | M | [ver](US-FE-T-20.md) |
| US-FE-T-21 | Smoke e2e | Dos flujos de navegador sobre MSW: login hasta `/inicio` y consulta pública W2 hasta W3. Herramienta NO DEFINIDA: default Playwright (D-27). El smoke de login usa B-01; Playwright es excepción de FC17 (RV-53). | T | B1, W2, W3 | — | 6 | US-FE-B-01, US-FE-B-03, US-FE-T-11, US-FE-T-31, US-FE-W-03, US-FE-W-04 | — | — | M | [ver](US-FE-T-21.md) |
| US-FE-T-22 | README del front | `frontend/README.md`: comandos, variables de entorno, puertos, cómo correr con mocks, cómo agregar una feature, reglas de ownership (ver sección Ownership). Enlaza al INDEX en lugar de repetir la tabla de ownership (RV-54). | T | — | — | 3 | US-FE-T-11, US-FE-T-14, US-FE-T-17, US-FE-T-20 | Nada | — | S | [ver](US-FE-T-22.md) |
| US-FE-T-23 | Harness de contract tests | Carpeta `packages/api/test/contract`: valida handlers MSW contra los DTO de `contratos-api/*.md` y permite correr los mismos tests contra `VITE_API_BASE_URL` (FB7.7, `clientes D14`). Cada API card agrega su `<dominio>.contract.test.ts` al rebasar sobre T-23; T-23 no edita `packages/api/package.json` (RV-21, RV-D31). | T | — | — | 2 | US-FE-T-08, US-FE-T-11, US-FE-T-12 | Nada | — | M | [ver](US-FE-T-23.md) |
| US-FE-T-24 | API clientes: lectura, edición, baja y cuenta | `GET /api/clientes` (lista paginada), `GET /api/clientes/{id}`, `PUT` y `DELETE` `/api/clientes/{id}`, `GET /api/clientes/{id}/cuenta`. DTO `clientes.ts` y handlers MSW (PB-03, PB-28). `CuotaCuentaCliente` copia la forma de `CuotaResponse` (RV-55). Fixtures en `packages/api/mocks/fixtures/clientes.ts` (RV-07 f). | T | B3, B5, B6, B7, B8, B9 (consumidores) | GET /api/clientes (Esp); GET /api/clientes/{id} (Esp); PUT (Esp); DELETE (Esp); /cuenta (NO) | 2 | US-FE-T-08, US-FE-T-11, US-FE-T-12 | US-FE-B-04 | PB-03 (MSW), PB-28 (MSW, rail oculto) | M | [ver](US-FE-T-24.md) |
| US-FE-T-25 | API clientes: alta y Renaper | `POST /api/clientes`, `GET /api/clientes/renaper/{dni}`, `POST /api/clientes/{id}/validar-renaper`. MSW con el contrato mínimo de PR #50. Renaper caído = 201 con `validadoRenaper=false` (C8). Marca el campo DNI con `codigo === 'PERSONA_NO_ENCONTRADA'` y 1 reintento ante 502 (RV-D23). | T | B4 | POST /api/clientes (PR #50); GET renaper/{dni} (PR #50); POST validar-renaper (PR #50) | 3 | US-FE-T-08, US-FE-T-11, US-FE-T-12, US-FE-T-23, US-FE-T-24 | US-FE-B-05 | PB-14, PB-15, PB-29 (degrada, mensajes propios) | S | [ver](US-FE-T-25.md) |
| US-FE-T-26 | API vehículos y cotizaciones | `GET /api/vehiculos?clienteId`, `GET /api/vehiculos/{id}`, `POST /api/vehiculos`, `POST /api/cotizaciones`, `GET /api/cotizaciones/{id}`. Mock de vista DNRPA (PB-23), de `calculo` de la prima (PB-10) y de `GET /api/vehiculos/dnrpa/{patente}`. PUT y DELETE de vehículos fuera de alcance: ninguna pantalla los consume (RV-29). | T | B5, B6, B7, B8, B9 | GET /api/vehiculos?clienteId (Impl); GET /api/vehiculos/{id} (Impl); POST /api/vehiculos (Impl); POST /api/cotizaciones (Impl); GET /api/cotizaciones/{id} (Impl); DNRPA preview (NO) | 2 | US-FE-T-08, US-FE-T-11, US-FE-T-12 | US-FE-B-09, US-FE-B-10 | PB-23 (MSW, opcional), PB-10 (MSW, línea de cálculo), PB-26 (sin listado) | M | [ver](US-FE-T-26.md) |
| US-FE-T-27 | API planes | `GET /api/planes` (anónimo, lo usan web y backoffice), `GET /api/planes/{id}`, `POST`, `PUT`, `DELETE` `/api/planes`. Mock de `incluirInactivos`, `PATCH /api/planes/{id}/activo` (PB-09). DTO `planes.ts`. `incluirInactivos` y `PATCH activo` solo con MSW; el filtro se oculta con constante, no con `VITE_USE_MOCKS` (RV-D29). | T | W1, B7, B8, B13 | GET /api/planes (Impl); GET /api/planes/{id} (Impl); POST (Impl); PUT (Impl); DELETE (Impl); inactivos y PATCH activo (NO) | 2 | US-FE-T-08, US-FE-T-11, US-FE-T-12 | US-FE-W-02, US-FE-B-22 | PB-09 (MSW, reactivar oculto) | S | [ver](US-FE-T-27.md) |
| US-FE-T-28 | API pólizas y cuotas | `GET /api/polizas` (filtros de `PolizaFiltro`, mock de `numero`, `dni` y `planCodigo`, PB-06), `GET /api/polizas/{id}`, `GET /api/polizas/{id}/cuotas`, `POST /api/polizas`, `POST /api/polizas/{id}/cancelar`, `GET /api/cuotas?estado=Vencida` (mock, PB-24). Handler de cuotas en `handlers/cuotas.ts` (RV-13). Al resolver PB-24, sumar T-10 (RV-56). | T | B2, B5, B8, B9, B10, B11 | GET /api/polizas (Impl); GET /api/polizas/{id} (Impl); GET /api/polizas/{id}/cuotas (Impl); POST /api/polizas (Impl); POST cancelar (Impl); búsqueda por número/DNI (NO); GET /api/cuotas (NO) | 2 | US-FE-T-08, US-FE-T-11, US-FE-T-12 | US-FE-B-13, US-FE-B-12 | PB-06 (MSW), PB-24 (MSW) | M | [ver](US-FE-T-28.md) |
| US-FE-T-29 | API pagos y factura | `POST /api/pagos/caja`, `GET /api/pagos/{id}`, `GET /api/pagos/{id}/factura` (Impl). Mock de `GET /api/pagos` (NO), `GET /api/polizas/{id}/pagos` (NO) y `urlPdf` (PB-11). DTO `pagos.ts`. `POST /api/pagos/{id}/conciliar` queda fuera del front (RV-57). Listados de pagos: `PagoResponse[]` con `factura` para B-18 y `PaginaResponse<PagoListadoResponse>` para B-19 (RV-D13). | T | B10, B11 | POST /api/pagos/caja (Impl); GET /api/pagos/{id} (Impl); GET /api/pagos/{id}/factura (Impl); GET /api/pagos (NO); GET /api/polizas/{id}/pagos (NO) | 2 | US-FE-T-08, US-FE-T-11, US-FE-T-12 | US-FE-B-17, US-FE-B-18 | PB-05 (MSW), PB-11 (MSW, sin botón de PDF) | M | [ver](US-FE-T-29.md) |
| US-FE-T-30 | API Pago Fácil (empleado) | `POST /api/pagofacil/rendiciones` (multipart `archivo`), `GET /api/pagofacil/rendiciones`, `GET /api/pagofacil/base-positiva` (blob `text/plain`), `GET /api/pagofacil/cuotas/{cuotaId}/cupon` (solo Empleado). DTO `pagofacil.ts`. Función que expone la respuesta cruda para la base positiva (RV-18). | T | B2, B10, B12 | POST rendiciones (Impl); GET rendiciones (Impl); GET base-positiva (Impl); GET cupón empleado (Impl) | 2 | US-FE-T-08, US-FE-T-11, US-FE-T-12 | US-FE-B-20, US-FE-B-21 | PB-17 (degrada: sin `Content-Disposition`), PB-19 (degrada) | M | [ver](US-FE-T-30.md) |
| US-FE-T-31 | API pública | `POST /api/publico/consulta`, `POST /api/publico/pagos`, `POST /api/publico/factura` (Impl). Mock de `POST /api/publico/cupon` (Esp), `POST /api/publico/pagos/estado` (NO) y `GET /api/publico/medios-pago` (NO). Respuestas 429 sin `Retry-After`. DTO `publico.ts`. Exporta `pagoFacilKeys` (incluye `cupon`, RV-28). Copia `FacturaResponse` y `CuponPagoFacilResponse` en `dto/publico.ts` (RV-D09). | T | W2, W3, W4, W5, W6 | consulta (Impl); pagos (Impl); factura (Impl); cupon (Esp); estado del pago (NO); medios-pago (NO) | 2 | US-FE-T-08, US-FE-T-11, US-FE-T-12 | US-FE-W-03, US-FE-W-07 | PB-01, PB-02, PB-22 (MSW), PB-17 (degrada) | M | [ver](US-FE-T-31.md) |
| US-FE-T-32 | API usuarios | `POST /api/auth/usuarios` (Impl). Mock de `GET /api/usuarios`, `PUT /api/usuarios/{id}`, `PATCH /api/usuarios/{id}/activo` y `GET /api/auth/yo` (NO, PB-04). DTO `usuarios.ts`. `loginRequest` en `packages/api/src/auth/login.ts` (RV-D04). `PATCH` de activación y `tamano` (RV-D30, PB-04). | T | B2, B14 | POST /api/auth/usuarios (Impl); GET /api/usuarios (NO); PUT (NO); PATCH activo (NO); GET /api/auth/yo (NO) | 2 | US-FE-T-08, US-FE-T-11, US-FE-T-12 | US-FE-B-25 | PB-04 (MSW) | S | [ver](US-FE-T-32.md) |
| US-FE-B-01 | Login | `/login` (ruta pública): email y contraseña con zod, `POST /api/auth/login`, 401 con "Email o contraseña incorrectos." (texto del Figma, RV-D01) **[CONFIRMAR]** en el formulario sin redirigir, 400 por campo, foco al campo tras error. `LayoutAcceso` en `features/auth/components/` (RV-08). Bootstrap de mocks en `main.tsx` (RV-D03). Agrega `ApiClientProvider` y `useApiClient` a `@nexa/api` y monta el provider (FC18). | B | [B1](../pantallas/B1-login.md) | POST /api/auth/login (Impl) | 3 | US-FE-T-04, US-FE-T-05, US-FE-T-07, US-FE-T-11, US-FE-T-12, US-FE-T-13, US-FE-T-14, US-FE-T-19, US-FE-T-32 | US-FE-T-16 | — | S | [ver](US-FE-B-01.md) |
| US-FE-B-02 | Inicio: saludo y KPIs de pólizas | `/inicio`: saludo (nombre desde `GET /api/auth/yo` mock; degrada a email del claim), cuatro KPIs y distribución por estado con cinco llamadas `pagina=1&tamano=1`. Crea `features/inicio`. KPI de cuotas vencidas y donut: de B-02, con mock de `GET /api/cuotas` (T-28, RV-36). | B | [B2](../pantallas/B2-inicio.md) | GET /api/polizas?estado=X&pagina=1&tamano=1 (Impl) x5; GET /api/auth/yo (NO); GET /api/cuotas?estado=Vencida (NO, KPI 4 y donut; RV-36) | 4 | US-FE-T-07, US-FE-T-11, US-FE-T-13, US-FE-T-16, US-FE-T-19, US-FE-T-28, US-FE-T-32 | US-FE-B-04 | PB-04 (degrada: saludo con email) | M | [ver](US-FE-B-02.md) |
| US-FE-B-03 | Inicio: cuotas vencidas y promo de rendición | Widget de cuotas vencidas recientes (mock `GET /api/cuotas` y `inicio/resumen`), promo de rendición con `GET /api/pagofacil/rendiciones`. Widget de tareas oculto (D-11). Crea `features/cuotas`. Promo en `features/inicio/components/PromoRendicion.tsx` (RV-37). La request de `inicio/resumen` vive en `features/inicio/` hasta PB-08 (RV-D16). | B | [B2](../pantallas/B2-inicio.md) | GET /api/cuotas?estado=Vencida (NO); GET /api/pagofacil/rendiciones (Impl); inicio/resumen (NO, PB-08) | 5 | US-FE-B-02, US-FE-T-05, US-FE-T-06, US-FE-T-09, US-FE-T-10, US-FE-T-11, US-FE-T-19, US-FE-T-28, US-FE-T-30 | US-FE-B-04 | PB-08 (MSW), PB-24 (MSW) | M | [ver](US-FE-B-03.md) |
| US-FE-B-04 | Clientes: listado | `/clientes`: filtros DNI y apellido, tabla paginada (10 filas por defecto, D-01), chip con total, botón de alta hacia B-05. Crea `features/clientes` (dueño de su `index.ts`). Muestra `location.state.aviso` (RV-41). Título y botón "Nuevo cliente" en el slot `accion` de T-16 (RV-42). | B | [B3](../pantallas/B3-clientes.md) | GET /api/clientes (Esp) | 4 | US-FE-T-04, US-FE-T-05, US-FE-T-06, US-FE-T-09, US-FE-T-11, US-FE-T-16, US-FE-T-19, US-FE-T-24 | US-FE-T-25 | PB-03 (MSW) | M | [ver](US-FE-B-04.md) |
| US-FE-B-05 | Alta de cliente: formulario | `/clientes/nuevo` (ruta estática antes que la dinámica): campos de `B4 §6`, zod (DNI 8 dígitos, CUIL 11, email), `POST /api/clientes`, 400 por campo y `detail` general. No llama a Renaper. Produce `location.state.aviso` como `{ tipo, texto }` (RV-41). | B | [B4](../pantallas/B4-nuevo-cliente.md) | POST /api/clientes (PR #50) | 5 | US-FE-B-04, US-FE-T-04, US-FE-T-05, US-FE-T-07, US-FE-T-10, US-FE-T-11, US-FE-T-16, US-FE-T-19, US-FE-T-25 | merge antes que US-FE-B-07 (routes.tsx, RV-39) | PB-14, PB-15, PB-29 (degrada) | M | [ver](US-FE-B-05.md) |
| US-FE-B-06 | Alta de cliente: validación Renaper | Precarga con `GET /api/clientes/renaper/{dni}` (404 en el campo DNI, 502 con aviso). Aviso de `validadoRenaper=false` con badge Pendiente (el reintento lo hace B-08, RV-38). | B | [B4](../pantallas/B4-nuevo-cliente.md) | GET renaper/{dni} (PR #50) | 6 | US-FE-B-05, US-FE-T-07, US-FE-T-11, US-FE-T-19, US-FE-T-25 | US-FE-B-08 | Renaper caído: 201 con aviso (D-16) | S | [ver](US-FE-B-06.md) |
| US-FE-B-07 | Ficha de cliente: cabecera y pestañas | `/clientes/:clienteId`: cabecera (nombre, DNI, CUIL, badge Renaper), pestaña Vehículos y sección Pólizas apilada (D-17, RV-35), próxima cuota por póliza, rail Cuenta oculto (D-33). Dueño de `useCliente`. | B | [B5](../pantallas/B5-ficha-cliente.md) | GET /api/clientes/{id} (Esp); GET /api/vehiculos?clienteId (Impl); GET /api/polizas?clienteId (Impl); GET /api/polizas/{id}/cuotas (Impl); cuenta (NO) | 5 | US-FE-B-04, US-FE-T-06, US-FE-T-07, US-FE-T-09, US-FE-T-10, US-FE-T-11, US-FE-T-16, US-FE-T-19, US-FE-T-24, US-FE-T-26, US-FE-T-28 | US-FE-B-09 | PB-03 (MSW), PB-28 (MSW, rail oculto) | M | [ver](US-FE-B-07.md) |
| US-FE-B-08 | Ficha de cliente: editar y dar de baja | Edición de contacto y domicilio con `PUT`; baja lógica con `DELETE` en `role="alertdialog"` con foco en Cancelar. Reintento de validación Renaper reutiliza T-25. Reintento `POST .../validar-renaper` (RV-38). Aviso `location.state.aviso` (RV-41). | B | [B5](../pantallas/B5-ficha-cliente.md) | PUT /api/clientes/{id} (Esp); DELETE /api/clientes/{id} (Esp); POST /api/clientes/{id}/validar-renaper (PR #50) | 6 | US-FE-B-05, US-FE-B-07, US-FE-T-04, US-FE-T-05, US-FE-T-07, US-FE-T-10, US-FE-T-11, US-FE-T-19, US-FE-T-24, US-FE-T-25 | — | PB-03 (MSW) | M | [ver](US-FE-B-08.md) |
| US-FE-B-09 | Nuevo vehículo | `/clientes/:clienteId/vehiculos/nuevo`: patente y uso (Particular por defecto, D-B6-08), `POST /api/vehiculos` 201 y vuelta a la ficha. Sin botón DNRPA (D-13). Crea `features/vehiculos`. | B | [B6](../pantallas/B6-nuevo-vehiculo.md) | POST /api/vehiculos (Impl); GET /api/clientes/{id} (Esp); GET /api/vehiculos/{id} (Impl); DNRPA preview (NO) | 4 | US-FE-T-04, US-FE-T-05, US-FE-T-07, US-FE-T-08, US-FE-T-10, US-FE-T-11, US-FE-T-12, US-FE-T-13, US-FE-T-14, US-FE-T-16, US-FE-T-19, US-FE-T-24, US-FE-T-26 | US-FE-B-07 | PB-23 (sin paso DNRPA), PB-13 (uso numérico) | M | [ver](US-FE-B-09.md) |
| US-FE-B-10 | Cotizar: planes y acción Cotizar | `/cotizaciones/nueva?vehiculoId&clienteId`: contexto de vehículo y cliente; `POST /api/cotizaciones` solo al clic, nunca al montar; lista de opciones con `POST /api/cotizaciones` (RN05); `GET /api/planes` solo para la descripción; ninguna preseleccionada (D-18). Crea `features/cotizaciones`. CTA "Emitir" hacia `/polizas/nueva?cotizacionId` (RV-34). | B | [B7](../pantallas/B7-cotizar.md) | POST /api/cotizaciones (Impl); GET /api/cotizaciones/{id} (Impl); GET /api/planes (Impl); GET /api/vehiculos/{id} (Impl); GET /api/clientes/{id} (Esp) | 4 | US-FE-T-05, US-FE-T-06, US-FE-T-08, US-FE-T-09, US-FE-T-11, US-FE-T-13, US-FE-T-16, US-FE-T-19, US-FE-T-24, US-FE-T-26, US-FE-T-27 | US-FE-B-07 | PB-26 (degrada: cotizar al clic, sin recarga) | M | [ver](US-FE-B-10.md) |
| US-FE-B-11 | Cotizar: línea de cálculo y rail | Línea `primaBase × factores` y rail de factores con el mock de `calculo` (PB-10). Sin el campo, se muestra solo `primaMensual`. | B | [B7](../pantallas/B7-cotizar.md) | POST /api/cotizaciones (campo calculo, PB-10, NO) | 5 | US-FE-B-10, US-FE-T-07, US-FE-T-09, US-FE-T-10, US-FE-T-11, US-FE-T-19, US-FE-T-26 | US-FE-B-12 | PB-10 (bloquea la línea; MSW + degrada) | S | [ver](US-FE-B-11.md) |
| US-FE-B-12 | Emitir póliza | `/polizas/nueva?cotizacionId`: resumen de cotización, vigencia 1, 6 o 12 meses (RN07), preview de cuotas con leyenda "fechas a confirmar" (PB-20), `POST /api/polizas` sin reintento automático. | B | [B8](../pantallas/B8-emitir-poliza.md) | POST /api/polizas (Impl); GET /api/cotizaciones/{id} (Impl); GET /api/vehiculos/{id} (Impl); GET /api/planes/{id} (Impl); GET /api/clientes/{id} (Esp) | 5 | US-FE-B-13, US-FE-T-04, US-FE-T-05, US-FE-T-06, US-FE-T-07, US-FE-T-08, US-FE-T-09, US-FE-T-10, US-FE-T-11, US-FE-T-13, US-FE-T-16, US-FE-T-19, US-FE-T-24, US-FE-T-26, US-FE-T-27, US-FE-T-28 | US-FE-B-10, US-FE-B-11 | PB-20 (bloquea: leyenda con fechas a confirmar) | M | [ver](US-FE-B-12.md) |
| US-FE-B-13 | Pólizas: listado y filtro por estado | `/polizas`: tabla paginada (`tamano=10`, D-01), filtro por estado, acciones de fila a detalle y emisión ("Emitir póliza" lleva a `/clientes`, RV-D12). Filtro por plan oculto (PB-06). Crea `features/polizas` (dueño de `index.ts`). | B | [B9](../pantallas/B9-polizas.md) | GET /api/polizas (Impl) | 4 | US-FE-T-04, US-FE-T-05, US-FE-T-06, US-FE-T-09, US-FE-T-10, US-FE-T-11, US-FE-T-13, US-FE-T-16, US-FE-T-19, US-FE-T-28 | US-FE-B-10 | PB-06 (filtro de plan oculto) | M | [ver](US-FE-B-13.md) |
| US-FE-B-14 | Pólizas: búsqueda por número, DNI y patente | Buscador único por número, DNI o patente. Resuelve DNI con `GET /api/clientes?dni=`. La búsqueda por número y DNI queda detrás de `BUSQUEDA_NUMERO_DNI_DISPONIBLE = false` hasta PB-06 (RV-43). Patente exacta hasta que el back la haga parcial. | B | [B9](../pantallas/B9-polizas.md) | GET /api/polizas?numero/dni (NO, PB-06); GET /api/clientes?dni= (Esp) | 5 | US-FE-B-13, US-FE-T-04, US-FE-T-05, US-FE-T-11, US-FE-T-19, US-FE-T-24, US-FE-T-28 | — | PB-06, PB-03 (MSW) | S | [ver](US-FE-B-14.md) |
| US-FE-B-15 | Detalle de póliza: encabezado, ciclo y cuotas | `/polizas/:id` (ruta dinámica después de `/polizas/nueva`): encabezado, ciclo de vida, tabla de cuotas con estado, fecha y recargo. Datos de cancelación no disponibles (PB-27). | B | [B10](../pantallas/B10-detalle-poliza.md) | GET /api/polizas/{id} (Impl) (el detalle trae `cuotas`, RV-32) | 5 | US-FE-B-13, US-FE-T-05, US-FE-T-06, US-FE-T-09, US-FE-T-10, US-FE-T-11, US-FE-T-16, US-FE-T-19, US-FE-T-24, US-FE-T-26, US-FE-T-28 | US-FE-B-12 | PB-27 (degrada: sin motivo ni historial) | M | [ver](US-FE-B-15.md) |
| US-FE-B-16 | Detalle de póliza: cancelar y cupón de empleado | `POST /api/polizas/{id}/cancelar` con confirmación (RN13), sin reintento. Cupón de cuota con `GET /api/pagofacil/cuotas/{cuotaId}/cupon` (solo Empleado, nunca desde la web pública). Coloca en la fila de acciones el botón "Registrar pago en caja" con `CobrarVencidasButton` de B-17 (RV-D10). | B | [B10](../pantallas/B10-detalle-poliza.md) | POST /api/polizas/{id}/cancelar (Impl); GET /api/pagofacil/cuotas/{cuotaId}/cupon (Impl) | 6 | US-FE-B-15, US-FE-B-17, US-FE-T-05, US-FE-T-07, US-FE-T-08, US-FE-T-09, US-FE-T-10, US-FE-T-11, US-FE-T-19, US-FE-T-28, US-FE-T-30 | US-FE-B-18 | PB-30 (degrada: cupón de póliza Vencida) | M | [ver](US-FE-B-16.md) |
| US-FE-B-17 | Pagos: cobro en caja y factura | Componente `CobroCaja` (selección de cuotas, `POST /api/pagos/caja`, botón deshabilitado mientras corre, mensaje de RowVersion) y vista de factura (PENDIENTE_CAE). Crea `features/pagos`. Exporta `CobrarVencidasButton` (RV-D10) e invalida `polizasKeys` al cobrar (RV-27). | B | [B10](../pantallas/B10-detalle-poliza.md), [B11](../pantallas/B11-pagos-y-facturas.md) | POST /api/pagos/caja (Impl); GET /api/pagos/{id} (Impl); GET /api/pagos/{id}/factura (Impl) | 3 | US-FE-T-04, US-FE-T-05, US-FE-T-07, US-FE-T-09, US-FE-T-10, US-FE-T-11, US-FE-T-19, US-FE-T-28, US-FE-T-29 | US-FE-B-15 | PB-12 (degrada), PB-25 (no se muestra forma de pago) | M | [ver](US-FE-B-17.md) |
| US-FE-B-18 | Detalle de póliza: rail de cobro y pagos | Rail derecho con cuotas impagas y `CobroCaja` de B-17. Lista de pagos de la póliza con mock de `GET /api/polizas/{id}/pagos`. Reutiliza `CobrarVencidasButton` de B-17 (RV-D10). Cobro de todas las vencidas con un clic y resumen visible **[CONFIRMAR]** producto (RV-D11). | B | [B10](../pantallas/B10-detalle-poliza.md) | POST /api/pagos/caja (Impl); GET /api/polizas/{id}/pagos (NO) | 6 | US-FE-B-15, US-FE-B-17, US-FE-T-11, US-FE-T-19, US-FE-T-29 | US-FE-B-16 | PB-05 (MSW), PB-25 | M | [ver](US-FE-B-18.md) |
| US-FE-B-19 | Pagos y facturas: listado | `/pagos`: tabla con filtros de medio y estado; filtro de póliza por número oculto hasta PB-06 (RV-D29); detalle de pago y factura de B-17; cobro desde el rail. Reintento de factura oculto (D-12). | B | [B11](../pantallas/B11-pagos-y-facturas.md) | GET /api/pagos (NO); GET /api/polizas?numero (NO); POST /api/pagos/caja (Impl) | 4 | US-FE-B-17, US-FE-T-04, US-FE-T-05, US-FE-T-06, US-FE-T-07, US-FE-T-11, US-FE-T-16, US-FE-T-19, US-FE-T-28, US-FE-T-29 | US-FE-B-18 | PB-05 (MSW), PB-06 (MSW) | M | [ver](US-FE-B-19.md) |
| US-FE-B-20 | Pago Fácil: subir rendición | `/pago-facil`: validación previa (archivo hasta 5 MB, nombre `A-Za-z0-9._-` de 1 a 90), `POST /api/pagofacil/rendiciones` multipart; 201 con rechazadas se muestra como resultado parcial. Copiar o descargar antes de salir (PB-19). Aviso de duplicado en `RendicionCard` e invalidación de `pagoFacilKeys.rendiciones` en el hook de B-20 (RV-11, RV-12). | B | [B12](../pantallas/B12-pago-facil.md) | POST /api/pagofacil/rendiciones (Impl) | 4 | US-FE-T-07, US-FE-T-08, US-FE-T-10, US-FE-T-11, US-FE-T-16, US-FE-T-19, US-FE-T-30 | US-FE-B-21 | PB-19 (degrada: resultado no persistido) | M | [ver](US-FE-B-20.md) |
| US-FE-B-21 | Pago Fácil: historial y base positiva | Historial con `GET /api/pagofacil/rendiciones` y botón "Generar base positiva" (blob, revisar `res.ok` y `Content-Type`, nombre `BASEPOS_<empresa>_<yyyyMMdd>.txt` desde el registro H). Historial de bases oculto (D-12). Bloque de tabla debajo del aviso en `RendicionCard` (RV-11). | B | [B12](../pantallas/B12-pago-facil.md) | GET /api/pagofacil/rendiciones (Impl); GET /api/pagofacil/base-positiva (Impl) | 5 | US-FE-B-20, US-FE-T-11, US-FE-T-19, US-FE-T-30 | — | PB-17 (degrada: nombre armado en el front), PB-18 (degrada: desborde) | M | [ver](US-FE-B-21.md) |
| US-FE-B-22 | Planes: listado y edición | `/planes` (solo Admin): tabla de planes activos, panel de edición con `PUT /api/planes/{id}`, chips de `TiposPermitidos`, antigüedad "Sin límite" si es null. Crea `features/planes`. | B | [B13](../pantallas/B13-planes.md) | GET /api/planes (Impl); GET /api/planes/{id} (Impl); PUT /api/planes/{id} (Impl) | 4 | US-FE-T-04, US-FE-T-05, US-FE-T-06, US-FE-T-09, US-FE-T-11, US-FE-T-13, US-FE-T-16, US-FE-T-19, US-FE-T-27 | US-FE-B-23 | — | M | [ver](US-FE-B-22.md) |
| US-FE-B-23 | Planes: alta, desactivación, inactivos y reactivación | `POST /api/planes` (201), `DELETE /api/planes/{id}` para desactivar, listado de inactivos y reactivar con `PATCH .../activo` (ambos mock). Reactivar oculto hasta el PB. | B | [B13](../pantallas/B13-planes.md) | POST /api/planes (Impl); DELETE (Impl); inactivos y PATCH activo (NO) | 5 | US-FE-B-22, US-FE-T-07, US-FE-T-09, US-FE-T-11, US-FE-T-19, US-FE-T-27 | — | PB-09 (MSW, reactivar oculto) | S | [ver](US-FE-B-23.md) |
| US-FE-B-24 | Usuarios: alta de empleado o administrador | `/usuarios` (solo Admin): nombre, apellido, email, contraseña inicial que escribe el admin, y rol sin preselección (D-20), `POST /api/auth/usuarios` 201. Crea `features/usuarios`. El back valida la política de contraseña; el front no la genera (RV-D18) **[CONFIRMAR]** seguridad. | B | [B14](../pantallas/B14-usuarios.md) | POST /api/auth/usuarios (Impl) | 4 | US-FE-T-04, US-FE-T-05, US-FE-T-10, US-FE-T-11, US-FE-T-13, US-FE-T-16, US-FE-T-19, US-FE-T-32 | US-FE-B-25 | PB-15 (degrada) | S | [ver](US-FE-B-24.md) |
| US-FE-B-25 | Usuarios: listado, edición y activación | Listado con rol y estado, edición (`PUT`) y activación (`PATCH`), todo contra mock (PB-04). Sin último ingreso. `PATCH` de activación y `tamano` según RV-D30 (PB-04). | B | [B14](../pantallas/B14-usuarios.md) | GET /api/usuarios (NO); PUT /api/usuarios/{id} (NO); PATCH activo (NO) | 5 | US-FE-B-24, US-FE-T-04, US-FE-T-06, US-FE-T-07, US-FE-T-11, US-FE-T-19, US-FE-T-32 | — | PB-04 (MSW) | M | [ver](US-FE-B-25.md) |
| US-FE-W-01 | Inicio público: hero, cómo pagar y footer | `/` (ruta pública): hero con CTA a `/consultar-poliza`, sección "Cómo pagar", composición de la TablaPlanes de W-02 y PublicFooter. Imagen del hero provisional (NO DEFINIDO). Crea `features/inicio` web. Sin enlace a W5 hasta DN-W1-1 (RV-D21). | W | [W1](../pantallas/W1-inicio.md) | — (estático) | 4 | US-FE-T-05, US-FE-T-07, US-FE-T-11, US-FE-T-18, US-FE-T-19, US-FE-W-02 | US-FE-W-03 | — | S | [ver](US-FE-W-01.md) |
| US-FE-W-02 | Planes públicos: tabla de planes | Componente `TablaPlanes` de la feature `planes` (web) con `GET /api/planes` anónimo: nombre, código y tipos; "desde" = PrimaBase (D-07, **[CONFIRMAR]**); matriz de coberturas oculta (D-08). Carga y error con reintento. Variante mobile. | W | [W1](../pantallas/W1-inicio.md) | GET /api/planes (Impl) | 3 | US-FE-T-05, US-FE-T-06, US-FE-T-07, US-FE-T-09, US-FE-T-11, US-FE-T-17, US-FE-T-19, US-FE-T-27 | US-FE-W-03 | — | S | [ver](US-FE-W-02.md) |
| US-FE-W-03 | Consulta de póliza y tipos de navegación | `/consultar-poliza` (desktop y W2m mobile): DNI de 8 dígitos y `POL-` + 7 dígitos, `POST /api/publico/consulta`, 404 con el texto del Figma (RV-D01) y 429 con espera fija de 60 s (PB-17). Define los tipos de `location.state` para W3 a W5 (RV-45). Crea `features/polizas` web. | W | [W2](../pantallas/W2-consultar-poliza.md) | POST /api/publico/consulta (Impl) | 3 | US-FE-T-04, US-FE-T-05, US-FE-T-07, US-FE-T-11, US-FE-T-17, US-FE-T-18, US-FE-T-19, US-FE-T-31 | US-FE-W-02 | PB-17 (degrada: espera fija), PB-29 (DNI corto, mejora) | M | [ver](US-FE-W-03.md) |
| US-FE-W-04 | Mi póliza: resumen y selección de cuotas | `/poliza` con `location.state` válido (si no, redirige a `/consultar-poliza`). Datos de póliza y tabla de cuotas seleccionables con total y máximo 24 (`useSeleccionCuotas` en `hooks/` del feature, RV-D26). Sin titular (D-10). Variante desktop. Dueña de `shared/formato/listaCuotas.ts` y `shared/hooks/useMediaQuery.ts` (RV-47). | W | [W3](../pantallas/W3-mi-poliza.md) | Reuso de POST /api/publico/consulta (sin request nueva) | 4 | US-FE-T-05, US-FE-T-06, US-FE-T-07, US-FE-T-09, US-FE-T-11, US-FE-T-18, US-FE-T-19, US-FE-W-03 | US-FE-W-06, US-FE-W-07 | PB-07 (degrada: sin bloque titular) | M | [ver](US-FE-W-04.md) |
| US-FE-W-05 | Mi póliza: variante mobile y acciones | W3m (390 px, padding de 16 px, D-26), botón "Pagar seleccionadas" en desktop y "Pagar" en mobile (D-30), acceso a W4 con `cuotaIds` y a W5 "Descargar cupón". DNI nunca en la URL. Barra fija según DN-W5-1 (D-36). | W | [W3](../pantallas/W3-mi-poliza.md) | — | 5 | US-FE-T-05, US-FE-T-09, US-FE-T-11, US-FE-T-18, US-FE-T-19, US-FE-W-04 | US-FE-W-06 | PB-07 | S | [ver](US-FE-W-05.md) |
| US-FE-W-06 | Elegir medio de pago | `/poliza/pagar/medio-de-pago`: guard (`cuotaIds` de 1 a 24), total de cuotas, opciones Pasarela A y B (D-09), `POST /api/publico/pagos` con doble clic bloqueado, sin reintento automático. Guarda `numeroPago` en `sessionStorage` (nunca el DNI, RV-D17 **[CONFIRMAR]** seguridad). `window.location.assign(urlPago)`. Crea `features/pagos` web. Opción Pago Fácil: navega a W-07 por ruta, sin dependencia (RV-46). | W | [W4](../pantallas/W4-elegir-medio-pago.md) | POST /api/publico/pagos (Impl); GET /api/publico/medios-pago (NO) | 5 | US-FE-T-04, US-FE-T-05, US-FE-T-07, US-FE-T-09, US-FE-T-11, US-FE-T-18, US-FE-T-19, US-FE-T-31, US-FE-W-03, US-FE-W-04 | US-FE-W-07 | PB-22 (MSW, bloquea nombres), PB-12 (degrada) | M | [ver](US-FE-W-06.md) |
| US-FE-W-07 | Cupón Pago Fácil | `/poliza/pagar/pago-facil`: `POST /api/publico/cupon` (mock), código de barras de 42 dígitos (`CuponBarras`), fecha de segundo vencimiento del DTO (D-05), "no disponible para este importe" ante desborde (PB-18), foco al `h1`, un cupón por cuota (D-04). Crea `features/pago-facil`. Usa `publicoKeys.cupon` exportado por T-31 (RV-28). | W | [W5](../pantallas/W5-cupon-pago-facil.md) | POST /api/publico/cupon (Esp) | 5 | US-FE-T-05, US-FE-T-07, US-FE-T-09, US-FE-T-11, US-FE-T-18, US-FE-T-19, US-FE-T-31, US-FE-W-03, US-FE-W-04 | US-FE-W-06 | PB-02 (MSW, bloquea), PB-21 (bloquea: fecha del DTO), PB-18 (degrada) | M | [ver](US-FE-W-07.md) |
| US-FE-W-08 | Pago aprobado | `/pago/exito`: lee `numeroPago` de `sessionStorage`; estado con `POST /api/publico/pagos/estado` (mock, PB-01) y factura con `POST /api/publico/factura`. Estados PENDIENTE, APROBADO, RECHAZADO y "no identificado". Sin descarga de comprobante (D-06). El back acepta `numeroPago` sin DNI en `pagos/estado` y `factura` (PB-01, RV-D17) **[CONFIRMAR]** seguridad. | W | [W6](../pantallas/W6-pago-aprobado.md) | POST /api/publico/factura (Impl); POST /api/publico/consulta (Impl); POST /api/publico/pagos/estado (NO) | 6 | US-FE-T-05, US-FE-T-07, US-FE-T-09, US-FE-T-11, US-FE-T-18, US-FE-T-19, US-FE-T-31, US-FE-W-06 | — | PB-01 (MSW, bloquea), PB-11 (degrada: sin comprobante), PB-16 (degrada) | M | [ver](US-FE-W-08.md) |
| US-FE-V-01 | Verificación visual: Backoffice: acceso e inicio | Compara B1, B2 contra el Figma con el MCP de Figma, corrige diferencias del front y documenta excepciones; capturas lado a lado en el PR. | V | [B1](../pantallas/B1-login.md), [B2](../pantallas/B2-inicio.md) | — | 7 | US-FE-B-01, US-FE-B-02, US-FE-B-03, US-FE-T-16 | — | — | S | [ver](US-FE-V-01.md) |
| US-FE-V-02 | Verificación visual: Backoffice: clientes y vehículos | Compara B3, B4, B5, B6 contra el Figma con el MCP de Figma, corrige diferencias del front y documenta excepciones; capturas lado a lado en el PR. | V | [B3](../pantallas/B3-clientes.md), [B4](../pantallas/B4-nuevo-cliente.md), [B5](../pantallas/B5-ficha-cliente.md), [B6](../pantallas/B6-nuevo-vehiculo.md) | — | 7 | US-FE-B-04, US-FE-B-05, US-FE-B-06, US-FE-B-07, US-FE-B-08, US-FE-B-09 | — | — | M | [ver](US-FE-V-02.md) |
| US-FE-V-03 | Verificación visual: Backoffice: cotizar y emitir | Compara B7, B8 contra el Figma con el MCP de Figma, corrige diferencias del front y documenta excepciones; capturas lado a lado en el PR. | V | [B7](../pantallas/B7-cotizar.md), [B8](../pantallas/B8-emitir-poliza.md) | — | 7 | US-FE-B-10, US-FE-B-11, US-FE-B-12 | — | — | S | [ver](US-FE-V-03.md) |
| US-FE-V-04 | Verificación visual: Backoffice: pólizas y pagos | Compara B9, B10, B11 contra el Figma con el MCP de Figma, corrige diferencias del front y documenta excepciones; capturas lado a lado en el PR. | V | [B9](../pantallas/B9-polizas.md), [B10](../pantallas/B10-detalle-poliza.md), [B11](../pantallas/B11-pagos-y-facturas.md) | — | 7 | US-FE-B-13, US-FE-B-14, US-FE-B-15, US-FE-B-16, US-FE-B-17, US-FE-B-18, US-FE-B-19 | — | — | M | [ver](US-FE-V-04.md) |
| US-FE-V-05 | Verificación visual: Backoffice: Pago Fácil, planes y usuarios | Compara B12, B13, B14 contra el Figma con el MCP de Figma, corrige diferencias del front y documenta excepciones; capturas lado a lado en el PR. | V | [B12](../pantallas/B12-pago-facil.md), [B13](../pantallas/B13-planes.md), [B14](../pantallas/B14-usuarios.md) | — | 7 | US-FE-B-20, US-FE-B-21, US-FE-B-22, US-FE-B-23, US-FE-B-24, US-FE-B-25 | — | — | M | [ver](US-FE-V-05.md) |
| US-FE-V-06 | Verificación visual: Web pública: inicio y consulta | Compara W1, W2 contra el Figma con el MCP de Figma, corrige diferencias del front y documenta excepciones; capturas lado a lado en el PR. | V | [W1](../pantallas/W1-inicio.md), [W2](../pantallas/W2-consultar-poliza.md) | — | 7 | US-FE-W-01, US-FE-W-02, US-FE-W-03, US-FE-T-18 | — | — | S | [ver](US-FE-V-06.md) |
| US-FE-V-07 | Verificación visual: Web pública: mi póliza y pago | Compara W3, W4, W5, W6 contra el Figma con el MCP de Figma, corrige diferencias del front y documenta excepciones; capturas lado a lado en el PR. | V | [W3](../pantallas/W3-mi-poliza.md), [W4](../pantallas/W4-elegir-medio-pago.md), [W5](../pantallas/W5-cupon-pago-facil.md), [W6](../pantallas/W6-pago-aprobado.md) | — | 7 | US-FE-W-04, US-FE-W-05, US-FE-W-06, US-FE-W-07, US-FE-W-08 | — | — | M | [ver](US-FE-V-07.md) |

---

## Oleadas

Orden de arranque. Dentro de cada ola todas las tareas pueden tomarse en paralelo, siempre que sus dependencias de la fila ya estén mergeadas (las de la ola anterior).

Convención (RV-D02): T-01 y T-02 son prerrequisitos de rebase y no cuentan para la ola. Ola 0 rebasa sobre T-01 (T-09 también sobre T-02) sin contarse como dependencia.

- **Ola 0, día 1 (6 tareas):** `US-FE-T-01`, `US-FE-T-02`, `US-FE-T-03`, `US-FE-T-08`, `US-FE-T-09`, `US-FE-T-12`.
- **Ola 1 (8):** `US-FE-T-04` (primitivos), `US-FE-T-05` (primitivos), `US-FE-T-06` (primitivos), `US-FE-T-07` (primitivos), `US-FE-T-10` (enums y mensajes), `US-FE-T-11` (MSW base), `US-FE-T-14` (scaffold backoffice), `US-FE-T-17` (scaffold web).
- **Ola 2 (14):** `US-FE-T-13` (sesión), `US-FE-T-15` (NavItem y Sidebar), `US-FE-T-18` (PublicLayout), `US-FE-T-19` (a11y), `US-FE-T-20` (Docker), `US-FE-T-23` (contract tests), `US-FE-T-24`, `US-FE-T-26`, `US-FE-T-27`, `US-FE-T-28`, `US-FE-T-29`, `US-FE-T-30`, `US-FE-T-31`, `US-FE-T-32`.
- **Ola 3 (7):** `US-FE-T-16` (layout backoffice), `US-FE-T-22` (README), `US-FE-T-25` (API clientes: alta y Renaper), `US-FE-B-01` (login), `US-FE-B-17` (cobro en caja), `US-FE-W-02` (planes públicos), `US-FE-W-03` (consulta de póliza).
- **Ola 4 (11):** `US-FE-B-02`, `US-FE-B-04`, `US-FE-B-09`, `US-FE-B-10`, `US-FE-B-13`, `US-FE-B-19`, `US-FE-B-20`, `US-FE-B-22`, `US-FE-B-24`, `US-FE-W-01`, `US-FE-W-04`.
- **Ola 5 (13):** `US-FE-B-03`, `US-FE-B-05`, `US-FE-B-07`, `US-FE-B-11`, `US-FE-B-12`, `US-FE-B-14`, `US-FE-B-15`, `US-FE-B-21`, `US-FE-B-23`, `US-FE-B-25`, `US-FE-W-05`, `US-FE-W-06`, `US-FE-W-07`.
- **Ola 6 (6):** `US-FE-B-06`, `US-FE-B-08`, `US-FE-B-16`, `US-FE-B-18`, `US-FE-T-21`, `US-FE-W-08`.

- **Ola 7 (7):** `US-FE-V-01` a `US-FE-V-07` (verificación visual contra el Figma, un grupo de pantallas por tarea).

**Cuenta por tipo:** T = 32 tareas, B = 25, W = 8, V = 7 (total 72).

**Camino más largo (hasta Ola 6):** T-08 → T-14 → T-13 → T-16 → B-04 → B-05 → B-06, y B-04 → B-07 → B-08. Cadena de web pública: W-03 → W-04 → W-06 → W-08 (Ola 6). W-04 es dueño de `shared/formato/listaCuotas.ts`, que W-06 reutiliza (RV-47); W-07 depende de W-04.

---

## Matriz de cobertura

### Pantalla → tareas

| Pantalla | Tareas que la cubren |
|---|---|
| [B1 Login](../pantallas/B1-login.md) | US-FE-B-01 |
| [B2 Inicio](../pantallas/B2-inicio.md) | US-FE-B-02, US-FE-B-03 |
| [B3 Clientes](../pantallas/B3-clientes.md) | US-FE-B-04 |
| [B4 Nuevo cliente](../pantallas/B4-nuevo-cliente.md) | US-FE-B-05, US-FE-B-06 |
| [B5 Ficha de cliente](../pantallas/B5-ficha-cliente.md) | US-FE-B-07, US-FE-B-08 |
| [B6 Nuevo vehículo](../pantallas/B6-nuevo-vehiculo.md) | US-FE-B-09 |
| [B7 Cotizar](../pantallas/B7-cotizar.md) | US-FE-B-10, US-FE-B-11 |
| [B8 Emitir póliza](../pantallas/B8-emitir-poliza.md) | US-FE-B-12 |
| [B9 Pólizas](../pantallas/B9-polizas.md) | US-FE-B-13, US-FE-B-14 |
| [B10 Detalle de póliza](../pantallas/B10-detalle-poliza.md) | US-FE-B-15, US-FE-B-16, US-FE-B-17 (rail y factura), US-FE-B-18 |
| [B11 Pagos y facturas](../pantallas/B11-pagos-y-facturas.md) | US-FE-B-17, US-FE-B-19 |
| [B12 Pago Fácil](../pantallas/B12-pago-facil.md) | US-FE-B-20, US-FE-B-21 |
| [B13 Planes](../pantallas/B13-planes.md) | US-FE-B-22, US-FE-B-23 |
| [B14 Usuarios](../pantallas/B14-usuarios.md) | US-FE-B-24, US-FE-B-25 |
| [W1 Inicio público](../pantallas/W1-inicio.md) | US-FE-W-01, US-FE-W-02 |
| [W2 Consultar póliza](../pantallas/W2-consultar-poliza.md) | US-FE-W-03 |
| [W3 Mi póliza](../pantallas/W3-mi-poliza.md) | US-FE-W-04, US-FE-W-05 |
| [W4 Elegir medio de pago](../pantallas/W4-elegir-medio-pago.md) | US-FE-W-06 |
| [W5 Cupón Pago Fácil](../pantallas/W5-cupon-pago-facil.md) | US-FE-W-07 |
| [W6 Pago aprobado](../pantallas/W6-pago-aprobado.md) | US-FE-W-08 |

Las 20 pantallas tienen al menos una tarea de pantalla. Mobile: solo W2m y W3m tienen frame en Figma; W1, W4, W5 y W6 mobile son propuestas (`W1 §11`, `W4 §11`, `W5 §11`, `W6 §11`) y se implementan con el criterio de la tarea.

### Endpoint → tarea

Estado según `analisis-front.md §4`. "API" = tarea que escribe la función de request, DTO y handler MSW. "Consumo" = tareas de pantalla que lo usan.

| Endpoint | Estado | API | Consumo |
|---|---|---|---|
| `POST /api/publico/consulta` | Impl | T-31 | W-03 (W2); W-04 (W3, reuso); W-08 (W6, estado de cuotas) |
| `GET /api/planes` | Impl | T-27 | W-02 (W1); B-10 (B7); B-22 (B13) |
| `POST /api/publico/pagos` | Impl | T-31 | W-06 (W4) |
| `POST /api/publico/factura` | Impl | T-31 | W-08 (W6) |
| `POST /api/publico/cupon` | Esp | T-31 (mock) | W-07 (W5); W-04 y W-05 solo enlazan |
| `GET /api/pagofacil/cuotas/{id}/cupon` | Impl, solo Empleado | T-30 | B-16 (B10). No se usa desde la web pública. |
| `GET /api/publico/medios-pago` | NO (PB-22) | T-31 (mock) | W-06 (W4) |
| `POST /api/publico/pagos/estado` | NO (PB-01) | T-31 (mock) | W-08 (W6) |
| Descarga de comprobante (W6, PB-11) | NO | — | Sin botón (D-06) |
| `POST /api/auth/login` | Impl | T-12, T-13 | B-01 (B1) |
| `GET /api/polizas?estado=X&pagina=1&tamano=1` | Impl | T-28 | B-02 (B2) |
| `GET /api/auth/yo` | NO (PB-04) | T-32 (mock) | B-02 (B2) |
| `GET /api/cuotas?estado=Vencida` | NO (PB-24) | T-28 (mock) | B-02 (B2, KPI 4 y donut); B-03 (B2, widget) |
| `GET /api/inicio/resumen` | NO (PB-08) | B-03 (mock local) | B-03 (B2) |
| Tareas del día (B2) | NO | — | Oculto (D-11); no se construye |
| `GET /api/pagofacil/rendiciones` | Impl | T-30 | B-03 (B2, promo); B-21 (B12, historial) |
| `GET /api/clientes` (lista) | Esp | T-24 | B-04 (B3) |
| `POST /api/clientes` | PR #50 | T-25 | B-05 (B4) |
| `GET /api/clientes/renaper/{dni}` | PR #50 | T-25 | B-06 (B4) |
| `POST /api/clientes/{id}/validar-renaper` | PR #50 | T-25 | B-08 (B5, reintento) |
| `GET /api/clientes/{id}` | Esp | T-24 | B-07 (B5); B-08 (B5); B-09 (B6); B-10 (B7); B-12 (B8) |
| `PUT /api/clientes/{id}` | Esp | T-24 | B-08 (B5) |
| `DELETE /api/clientes/{id}` | Esp | T-24 | B-08 (B5) |
| `GET /api/clientes/{id}/cuenta` (deuda consolidada) | NO (PB-28) | T-24 (mock) | B-07 (B5, rail oculto) |
| `GET /api/clientes?dni=` | Esp | T-24 | B-14 (B9) |
| `GET /api/vehiculos?clienteId=` | Impl | T-26 | B-07 (B5) |
| `POST /api/vehiculos` | Impl | T-26 | B-09 (B6) |
| `GET /api/vehiculos/{id}` | Impl | T-26 | B-09 (B6); B-10 (B7); B-12 (B8) |
| `GET /api/vehiculos/dnrpa/{patente}` (vista previa) | NO (PB-23) | T-26 (mock, opcional) | B-09 (B6), oculto |
| `POST /api/cotizaciones` | Impl | T-26 | B-10 (B7); B-11 (línea de cálculo, PB-10) |
| `GET /api/cotizaciones/{id}` | Impl | T-26 | B-12 (B8) |
| `GET /api/polizas` (filtros) | Impl | T-28 | B-07 (B5, por cliente); B-13 (B9); B-14 (B9, búsqueda) |
| `GET /api/polizas?numero=` y `dni=` (búsqueda directa) | NO (PB-06) | T-28 (mock) | B-14 (B9); B-19 (B11) |
| `POST /api/polizas` | Impl | T-28 | B-12 (B8) |
| `GET /api/polizas/{id}` | Impl | T-28 | B-15 (B10) |
| `GET /api/polizas/{id}/cuotas` | Impl | T-28 | B-07 (B5, próxima cuota) |
| `POST /api/polizas/{id}/cancelar` | Impl | T-28 | B-16 (B10) |
| `GET /api/polizas/{id}/pagos` (lista de pagos) | NO (PB-05) | T-29 (mock) | B-18 (B10) |
| `POST /api/pagos/caja` | Impl | T-29 | B-17 (B10, B11); B-18 (B10); B-19 (B11) |
| `GET /api/pagos/{id}` | Impl | T-29 | B-17 |
| `GET /api/pagos/{id}/factura` | Impl | T-29 | B-17 |
| `GET /api/pagos` (listado) | NO (PB-05) | T-29 (mock) | B-19 (B11) |
| Reintento de factura | NO | — | Fuera de alcance (D-12) |
| `POST /api/pagofacil/rendiciones` | Impl | T-30 | B-20 (B12) |
| `GET /api/pagofacil/base-positiva` | Impl | T-30 | B-21 (B12) |
| Historial de bases generadas | NO | — | Fuera de alcance (D-12) |
| `GET /api/planes/{id}` | Impl | T-27 | B-12 (B8) |
| `PUT /api/planes/{id}` | Impl | T-27 | B-22 (B13) |
| `POST /api/planes` | Impl | T-27 | B-23 (B13) |
| `DELETE /api/planes/{id}` | Impl | T-27 | B-23 (B13, desactivar) |
| `GET /api/planes?incluirInactivos=true` y `PATCH /api/planes/{id}/activo` | NO (PB-09) | T-27 (mock) | B-23 (B13) |
| `POST /api/auth/usuarios` | Impl | T-32 | B-24 (B14) |
| `GET /api/usuarios`, `PUT /api/usuarios/{id}`, `PATCH /api/usuarios/{id}/activo` | NO (PB-04) | T-32 (mock) | B-25 (B14) |

---

## Ownership de archivos compartidos

Regla general: un archivo compartido tiene un único dueño. Si otra tarea necesita cambiarlo, lo cambia el dueño o se le pide a él. Los barrels (`index.ts`) se editan por bloques: cada tarea agrega su bloque y se rebasa; los PR que tocan el mismo barrel se mergean en serie.

| Archivo o carpeta | Dueño | Notas |
|---|---|---|
| `frontend/package.json`, `package.json` de workspace, `frontend/package-lock.json`, `frontend/eslint.config.js`, `frontend/.nvmrc`, `frontend/.gitignore`, `.github/workflows/*` (job `frontend`) | US-FE-T-01 | Ninguna otra tarea agrega dependencias ni toca CI. Excepción: US-FE-T-21 agrega su herramienta E2E (D-27) de acuerdo con T-01 (FC17). |
| `packages/ui/package.json`, `packages/api/package.json` | US-FE-T-01 | FC17. T-19 y T-23 no los editan (RV-20, RV-21). |
| `packages/api/src/client/ApiClientProvider.tsx` | US-FE-B-01 | `ApiClientProvider` y `useApiClient` (FC18). Se exportan por bloque en el barrel. B-01 lo monta en `app/providers.tsx` del backoffice (dueña T-14) y W-02 en el de la web (dueña T-17); solo montan el provider, nada más. |
| `packages/config/tsconfig.base.json`, `packages/config/tsconfig.react.json` | US-FE-T-02 | T-01 deja stub; T-02 reemplaza (RV-07 c). |
| `packages/config/*` (ESLint, Prettier, `vitest/*`, `test/*`), `packages/*/vitest.config.ts`, `apps/*/vitest.config.ts` | US-FE-T-02 | Reglas de boundaries (FB3). Cada workspace tiene su `vitest.config.ts` (RV-07 d, RV-58). |
| `packages/ui/tsconfig.json`, `packages/api/tsconfig.json` | US-FE-T-01 | Stub; no se reemplazan (RV-07 c). |
| `packages/config/tailwind/*` (preset), `packages/ui/src/tokens.css` | US-FE-T-03 | |
| `apps/*/tailwind.config.*`, `apps/*/postcss.config.*` | T-14 (backoffice), T-17 (web) | Sin stub de T-01 (D-T01-6, RV-23). |
| `packages/ui/src/index.ts` | US-FE-T-03 | Cada primitivo agrega su bloque de export. |
| `packages/ui/src/components/<Primitivo>/` | Tarea de primitivo (T-04, T-05, T-06, T-07, T-15) | Un primitivo, un dueño. `EstadoBadge/` lo crea T-05 (RV-07 k); `Shell` y `Dialogo` los crea T-07 (RV-D05, RV-D06). |
| `packages/ui/src/components/PublicNav/`, `packages/ui/src/components/PublicFooter/` | US-FE-T-18 | RV-09. |
| `packages/ui/src/testing/*` | US-FE-T-19 | El subpath `@nexa/ui/testing` lo declara T-01 (RV-20). |
| `packages/api/src/index.ts` | US-FE-T-12 | Cada API card y T-08 agregan su bloque (RV-14). |
| `packages/api/src/dto/comunes.ts`, `dto/auth.ts` | US-FE-T-12 | |
| `packages/api/src/dto/<dominio>.ts` (clientes, vehiculos, planes, cotizaciones, polizas, pagos, pagofacil, publico, usuarios) | API card del dominio (T-24..T-32) | Un archivo por dominio. `clientes`: T-24 crea y T-25 agrega bloque (RV-15). `publico.ts` copia `FacturaResponse` y `CuponPagoFacilResponse` (T-31, RV-D09). |
| `packages/api/src/endpoints/<dominio>.ts` | API card del dominio | FC2. |
| `packages/api/src/auth/login.ts` (y demás funciones de `/api/auth/*`) | US-FE-T-32 | RV-D04. T-12 queda solo con tipos. |
| `packages/api/src/client/*` | US-FE-T-08 | |
| `packages/api/src/format/*` | US-FE-T-09 | Incluye `parseImporteEsAR` (RV-26). |
| `packages/api/src/enums/*`, `packages/api/src/messages/*` | US-FE-T-10 | `EstadoBadgeValue` en `enums/badges.ts` (RV-22, RV-D07). |
| `packages/api/mocks/server.ts`, `browser.ts`, `handlers/index.ts`, fixtures comunes | US-FE-T-11 | |
| `apps/*/public/mockServiceWorker.js` | T-14 (backoffice), T-17 (web) | RV-07 f. |
| `packages/api/mocks/handlers/<dominio>.ts` | API card del dominio | `handlers/cuotas.ts` → T-28 (RV-13). `handlers/inicio.ts` → B-03 (llena el placeholder de T-11 y registra su export en `handlers/index.ts`, RV-13). |
| `packages/api/mocks/fixtures/<dominio>.ts` | API card del dominio (T-24 para clientes) | RV-07 f. |
| `packages/api/test/contract/*` (harness) | US-FE-T-23 | Cada API card agrega su `<dominio>.contract.test.ts` (RV-21, RV-D31). |
| `apps/backoffice/`: `vite.config.ts`, `.env.example`, `src/app/router.tsx`, `src/app/providers.tsx`, `src/app/queryClient.ts`, `src/app/ordenRutas.ts`, `src/app/PaginaNoEncontrada.tsx`, `src/main.tsx`, `src/index.html`, `src/index.css`, `src/vite-env.d.ts`, `tsconfig.json` | US-FE-T-14 | T-01 no los crea (D-T01-6). `providers.tsx`: T-13 edita un bloque del 401 con acuerdo de T-14 (RV-16). `main.tsx`: B-01 agrega el bootstrap de mocks (RV-D03). |
| `apps/web-publica/` (mismos archivos que backoffice) | US-FE-T-17 | `main.tsx`: W-06 agrega el bootstrap de mocks (RV-D03). |
| `apps/*/src/features/<dominio>/routes.tsx` | Stub por T-14 / T-17; dueño la primera tarea del feature | Backoffice: B-04 (clientes), B-09 (vehiculos), B-10 (cotizaciones), B-13 (polizas), B-17 (pagos), B-20 (pago-facil), B-22 (planes), B-24 (usuarios), B-02 (inicio), B-03 (cuotas), B-01 (auth, login). Web: W-01 (inicio), W-02 (planes), W-03 (polizas), W-06 (pagos), W-07 (pago-facil). |
| `apps/*/src/features/<dominio>/index.ts` | Primera tarea del feature (ver arriba) | Las siguientes agregan exports en su PR y declaran dependencia. |
| `apps/*/src/features/<dominio>/hooks/` | Primera tarea del feature que lo use | Hooks de UI sin TanStack Query (FB3, RV-D26). |
| `apps/backoffice/src/features/auth/` (store de sesión) | US-FE-T-13 | `pages/LoginPage.tsx`, `schemas/` y `components/LayoutAcceso.tsx` los escribe US-FE-B-01 (RV-08). |
| `apps/backoffice/src/app/guards/*` | US-FE-T-13 | T-14 deja stubs (RV-16). |
| `apps/backoffice/src/app/layouts/*` (LayoutBackoffice, Topbar) | US-FE-T-16 | T-14 deja stubs. `Shell` vive en `@nexa/ui` (T-07, RV-D06). |
| `apps/web-publica/src/app/layouts/PublicLayout.tsx` | US-FE-T-18 | Stub de T-17 (RV-17). |
| `apps/backoffice/src/features/clientes/schemas/provincias.ts` | US-FE-B-05 | Catálogo de 24 jurisdicciones (RV-10). |
| `apps/*/src/shared/formato/listaCuotas.ts`, `apps/*/src/shared/hooks/useMediaQuery.ts` | US-FE-W-04 | Primera en usarlos; W-05 y W-07 los consumen (RV-47, RV-07 e). Resto de `shared/*`: quien lo necesite primero, solo hooks genéricos. |
| `apps/backoffice/src/features/inicio/` | US-FE-B-02 (crea la carpeta); `components/PromoRendicion.tsx` y `api/` (`inicio/resumen`) → US-FE-B-03 | RV-37, RV-D16. |
| `apps/backoffice/src/features/cuotas/*` | US-FE-B-03 | |
| `apps/backoffice/src/features/pago-facil/PagoFacilPage.tsx`, `components/RendicionCard.tsx` | US-FE-B-20 | B-21 agrega bloques (RV-11). |
| `frontend/docker-compose.yml`, `frontend/Dockerfile*`, `frontend/docker/nginx.conf` | US-FE-T-20 | Archivo propio del front. El compose del back (raíz) no se toca. |
| `frontend/README.md` | US-FE-T-22 | Enlaza a este índice; no repite la tabla (RV-54). |
| `frontend/e2e/*`, `frontend/playwright.config.ts` | US-FE-T-21 | Excepción de FC17 (RV-07 i). |
| `docs/frontend/design-system.md` §9 (registro de pedidos de contraste) | US-FE-T-19 | RV-D25. |
| `docs/frontend/pedidos-al-back.md` | Equipo de docs, PR aparte | Ninguna tarea de front lo edita. |

---

## Decisiones pendientes (con default)

Cada default es la propuesta que sale de los documentos. El equipo confirma en la reunión; si cambia, se actualiza este índice y el detalle de la tarea afectada.

| ID | Tema | Default | Fuente |
|---|---|---|---|
| D-01 | Tamaño de página en listados (B3, B9, B11) | 10 filas (diseño). Spec: 20 por defecto, máximo 100. | B3 D-5; B9 D8 |
| D-02 | Ruta de inicio | `/inicio`. Corregir la mención "/" de B11. | analisis-front §11.2 #19 |
| D-03 | Pago Fácil en backoffice | Una sola ruta `/pago-facil`; rendiciones y base positiva son secciones, no subrutas. | analisis-front §11.2 #20 |
| D-04 | Cupón con varias cuotas | Un cupón por cuota (opción b de W3). W5 muestra N cupones. | W3 D5; W4 D1; W5 D1 |
| D-05 | Segundo vencimiento del cupón (PB-21) | Mostrar `fechaSegundoVencimiento` del DTO. Nunca la fecha del Figma. | W5 D4; PB-21 |
| D-06 | Descarga de comprobante (W6, PB-11) | Sin botón de descarga. | W6 D6 |
| D-07 | Precio "desde" de cada plan (W1) | `PrimaBase` tal cual, sin recalcular. El seed no coincide con el Figma (RC 12.000 vs 10.000; TR 30.000 vs 27.500). **[CONFIRMAR]** (RV-D22). | W1 §13 #2; RV-D22 |
| D-08 | Matriz de coberturas (W1) | Fuera de alcance. No hay endpoint. | W1 §13 #3 |
| D-09 | Nombres de pasarelas | "Pasarela A" = `pasarela1`; "Pasarela B" = `pasarela2`, nombres fijos hasta PB-22. | W4 D2; PB-22 |
| D-10 | Titular y DNI en consulta pública (PB-07) | Omitir el bloque "Titular". No inventar nombre. | PB-07 |
| D-11 | Widget de tareas del día (B2, PB-08) | Oculto. | B2 D-11 |
| D-12 | Reintento de factura (B11) e historial de bases (B12) | Ocultos. | analisis-front §4.2 |
| D-13 | Validar DNRPA antes de guardar (B6, PB-23) | Quitar el paso. Alta en un paso. | B6; PB-23 |
| D-14 | Forma de pago en caja (PB-25) | No se muestra. | PB-25 |
| D-15 | Baja de cliente con pólizas activas | Enviar `DELETE` y mostrar el `detail` del 400 que devuelva el back. | B5 D-B5-08 |
| D-16 | Renaper caído en el alta (C8) | 201 con `validadoRenaper=false`: aviso y badge Pendiente con reintento. | B4 §13 D-9; convenciones C8 |
| D-17 | Pestaña inicial de la ficha (B5) | Vehículos activa; Pólizas como sección apilada. | B5 D-B5-03 |
| D-18 | Plan seleccionado en cotizar (B7) | Ninguno; "Continuar" deshabilitado hasta elegir. | B7 D-B7-05 |
| D-19 | Cuotas preseleccionadas (B11) | Ninguna. | B11 #10 |
| D-20 | Rol inicial en alta de usuario (B14) | Sin preselección; el rol es obligatorio. | B14 #8 |
| D-21 | Contraseña inicial del alta de usuario (B14) | El admin escribe la contraseña; el back valida la política de Identity. El front no genera contraseñas (cambia el default de B-24). **[CONFIRMAR]** (RV-D18). | B14 #6; RV-D18 |
| D-22 | "Número de operación" en W6 (D5) | `numeroPago` del back (`PAG-xxxxxx`). | W6 D5 |
| D-23 | Color del badge "Vencida" (W4 D10, analysis §11.1 #10) | Tokens de `design-system §5.4` hasta que diseño confirme. | W4 D10 |
| D-24 | Contraste AA (FB7.8) | Implementar tokens como están; registrar pedido a diseño en T-19. | FB7.8; analisis §9.1 |
| D-25 | Ancho del backoffice | Mínimo 1280 px; sin variante mobile. | B6 y B7 (propuesta) |
| D-26 | Padding móvil de W3m (12 o 16 px) | 16 px hasta medir. | design-system §7.4; W3 #17 |
| D-27 | Herramienta E2E (`analisis-front §8.2`) | Playwright (propuesta), solo para T-21. | analisis §8.2 |
| D-28 | Cobertura mínima de tests por tipo de tarea (`analisis §8.3`, NO DEFINIDO) | Propuesta de FC5. | analisis §8.3 |
| D-29 | Enums en el wire (PB-13) | Mapas en `@nexa/api`. No se bloquea por el converter global. | FB7.3; PB-13 |
| D-30 | Texto del botón de pago (W3 D7) | Desktop "Pagar seleccionadas", mobile "Pagar", según Figma. | W3 D7 |
| D-31 | Imprimir cupón (W5 D7) | `window.print()`. | W5 D7 |
| D-32 | Reintento tras 429 sin `Retry-After` (PB-17) | Texto fijo de 60 s, sin reintento automático. | convenciones §4 |
| D-33 | Rail "Cuenta" de la ficha (PB-28) | Oculto hasta que el back publique la deuda. | B5 D-B5-05 |
| D-34 | Buscador (topbar y sidebar) y campana del backoffice (B2 D-6, D-7; T-16 DP-5, DP-7) | Propuesta de B2 D-6: 8 dígitos o formato DNI busca cliente por DNI; el resto, por apellido. Campana y menú de usuario según T-16 DP-5 y DP-7. | B2 D-6, D-7; T-16 DP-5, DP-7 |
| D-35 | Breakpoint móvil | 768 px (propuesta de design-system §7.4; no hay frame de 768 px en Figma). Afecta T-18 y W-04. | design-system §7.4; RV-68 |
| D-36 | Barra fija de W5 (DN-W5-1) | Default de la ficha de W-05 (DN-W5-1). Decisión menor, reversible. | RV-48 |
| D-37 | Ubicación de `Dialogo` | En `@nexa/ui` (T-07), sin depender de T-05; los botones entran como `children`. B-05, B-08 y B-23 lo importan de ahí. | RV-D05 |
| D-38 | Destino de pedidos de contraste y de diseño (T-19) | `design-system.md §9`. `pedidos-al-back.md` queda para el back. | RV-D25 |
| D-39 | `hooks/` en la estructura de feature | Se agrega `hooks/` a FB3 (lo usa W-04 para `useSeleccionCuotas`). | RV-D26; FB8 |
| D-40 | Filtros que el back ignora (`numero`, `dni`, `incluirInactivos`, `planCodigo`) | Ocultos tras constante hasta que el PB se publique. No se activan con `VITE_USE_MOCKS`. FC3 ampliada. | RV-D29; FB8 |
| D-41 | Contrato de usuarios (PB-04) | `PATCH /api/usuarios/{id}/activo` y `tamano` (no `POST .../activar` ni `tamanoPagina`). B14 §9 alineado. | RV-D30; FB8 |
| D-42 | Contract tests de API cards (FC5) | Cada API card agrega `<dominio>.contract.test.ts` al rebasar sobre T-23; sin dependencia declarada (sin cascada). | RV-D31; FB8 |
| D-43 | Texto de error de login y 404 de W-03 | Texto del Figma ("Email o contraseña incorrectos."; 404 de W2) en vez de `detail`. Solo errores de negocio sin texto propio usan `detail`. **[CONFIRMAR]** con diseño. | RV-D01; FB8 |
| D-44 | Cobro desde el widget de B10 (`CobrarVencidasButton`) | Cobra todas las vencidas con un clic y resumen visible (p. ej. `Cuotas 6 y 7`); la selección por cuota queda en B11 (B-19). **[CONFIRMAR]** con producto antes de B-18. | RV-D11; FB8 |
| D-45 | Número de pago en el retorno de la pasarela (W-06, W-08) | El back acepta `numeroPago` sin DNI (PB-01). Prohibido guardar el DNI en storage o en la URL. MSW hasta que el back lo publique. **[CONFIRMAR]** seguridad antes de W-06. | RV-D17; FB8 |
| D-46 | Hosting de producción del front | Sin decidir; las imágenes sirven en cualquier host. **[CONFIRMAR]** infraestructura. | RV-D19; FB8 |

---

## Errores conocidos de los documentos (no corregidos aquí)

- Conflicto de rutas de Pago Fácil: `pantallas/B2-inicio.md §8` usa `/pago-facil/rendiciones` y `/pago-facil/base-positiva`; `pantallas/B12-pago-facil.md §2` usa `/pago-facil`. Se resuelve con D-03 (una ruta).
- Conflicto de ruta de inicio: `pantallas/B11-pagos-y-facturas.md §8` dice `/` y B1 y B2 dicen `/inicio`. Se resuelve con D-02.
- Resuelto (RV-47, decisión del orquestador): `W-06` usa `shared/formato/listaCuotas.ts` (dueño W-04) y declara W-04 como dependencia. W-06 pasa a Ola 5 y W-08 a Ola 6.
