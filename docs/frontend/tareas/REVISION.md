# Revisión de reconciliación del plan de tareas del front

Fecha: 2026-11-01. Alcance: `tareas/INDEX.md` (65 filas), las 65 fichas `tareas/US-FE-*.md` (§3, §5, §7, §13, §16) y `00-decisiones-base.md` (FB1..FB7, manda). Este documento no edita INDEX ni fichas; la sección 6 es el plan que otro agente ejecuta una vez el orquestador confirme las decisiones.

Clases: **MECANICO** = error objetivo (dependencia omitida, dueño faltante, ID o texto que contradice otra fuente); se corrige sin preguntar. **DECISION** = alternativas con consecuencias de producto, seguridad, arquitectura u orden de oleadas; lo decide el equipo. Cada DECISION trae el default recomendado (que la sección 6 aplica) y el costo de equivocarse.

Método: §3 se parseó desde "Depende de" hasta el siguiente bullet. Los cambios de ola se calcularon con el grafo del INDEX más los cambios indicados. Los números son marginales sobre el escenario B (sección 5).

---

## 1. Resultados de los chequeos

| # | Chequeo | Resultado |
|---|---|---|
| a | Dependencias declaradas que existen | 0 inexistentes en INDEX ni en §3. **Desalineación INDEX ↔ §3:** 26 tareas declaran en §3 dependencias que el INDEX no tiene: B-03, B-08, B-09, B-10, B-11, B-12, B-13, B-14, B-15, B-16, T-02, T-03, T-08, T-09, T-14, T-15, T-17, T-19, T-20, W-01, W-02, W-04, W-05, W-06, W-07, W-08 (detalle en RV-01; algunas, como T-08 con T-12 o W-06 con W-04, son alternativas o navegación y no deps reales). 2 tareas tienen dependencias en el INDEX que §3 no declara: B-10 (T-06) y B-13 (T-04, T-26, T-27). Parser de §3 corregido para la forma "Depende de (INDEX):". |
| b | Ciclos | Ninguno, con el grafo del INDEX y con la unión INDEX + §3. |
| c | Oleada = 1 + max(deps) | Coincide en 65/65 con las dependencias del INDEX. Conteo actual: Ola 0: 6, Ola 1: 8, Ola 2: 15, Ola 3: 6, Ola 4: 13, Ola 5: 12, Ola 6: 5. La sección "Oleadas" coincide con la columna (los rangos T-24..T-32 se leen completos). Con la unión INDEX + §3 cambian 63 tareas; la mayoría por las deps que §3 declara y el INDEX no (RV-01). |
| d | Endpoints de fichas con API card dueña | 55 rutas distintas en fichas; 39 filas en la matriz "Endpoint → tarea", todas usadas. Sin dueño de API card real: **`GET /api/inicio/resumen`** (B-03; B-02 también lo cita). Dueño de hecho: B-03, sin API card (RV-D16). Las demás "sin fila" del parser son prefijos (`/api/publico/`) o plantillas. `POST /api/externo/cotizaciones` (T-26): "PR #57, no lo consume el front", correcto que no esté en la matriz. `POST /api/pagos/{id}/conciliar` (T-29): fuera del front, correcto. |
| e | Archivos de §5 con dueño único | 415 rutas resueltas (contra el encabezado "Bajo `frontend/…`"). 356 sin fila, pero la mayoría están dentro de `features/<dominio>/` (FC1: el dueño es la primera tarea del feature) o bajo globs de carpeta (`packages/ui/src/components/<Primitivo>/`, que el parser no reconoce). **Fuera de `features/`: 88 rutas sin fila.** Revisadas una por una: la mayoría son globs de componentes de `@nexa/ui` (cubiertos por la fila de componentes), tests o archivos de T-02/T-18/T-19/T-21. Las que no tienen dueño real o están en disputa se listan en RV-07. **Dos dueños o dueño en disputa:** `apps/*/index.html`, `src/main.tsx` (T-01 crea stub, T-14/T-17 lo reemplazan), `app/providers.tsx` (T-14 dueño, T-13 edita bloque), `app/layouts/LayoutBackoffice.tsx` (T-14 stub, T-16 dueña), `app/guards/RequireSesion.tsx` (T-13/T-14), `packages/config/tsconfig*.json` (T-01 crea, T-02 dueña), `packages/ui/package.json` (T-01 y T-19 lo editan: FC17), `packages/api/package.json` (T-23 lo edita: FC17), `package-lock.json` y `package.json` raíz (T-01; T-21 con excepción de devDep). `packages/ui/src/index.ts` y `packages/api/src/index.ts` (barrels por bloques, OK por regla de barrels). `app/router.tsx` aparece en §5 de B-09, B-10, B-13, W-01 como "sin editar": sin conflicto. |
| f | Pantallas W1..W6 y B1..B14 cubiertas | 20/20 con al menos una tarea. Sin faltantes. |
| g | Textos de UI en conflicto | (1) 401 de login: "Credenciales inválidas." aparece 23 veces (INDEX, convenciones, B1, B-01, T-07, T-08, T-10, T-11, T-21) y "Email o contraseña incorrectos." 14 veces (B1, B-01, T-07, T-21, analisis-front). (2) "Pendiente CAE" 45 veces (B10 y otros) y "Pendiente de CAE" 23 veces (B11, W6, B-17, B-19, W-08). (3) Totales: `convenciones-transversales.md:386` dice "el front no recalcula recargos ni totales"; B-17 D-B17-03 propone sumar en el front. |
| — | Hooks: ¿dónde viven? | FB3 y FC2: hooks en `features/<dominio>/api/`, funciones de request en `@nexa/api`. Las fichas T-25..T-32 (D-API-1) dicen que el prompt pide hooks en `@nexa/api`; la regla de FB3/FC2 manda (RV-44). B-03 deja una request sin API card (RV-D16). |
| — | Filtros que el back real ignora | B-14 (`numero`, `dni`), B-19 (`GET /api/polizas?numero=`), B-23 y T-27 (`incluirInactivos`), B-13 (`planCodigo`): el back ignora el parámetro y responde 200 (T-27 §16). Esto contradice FC3 ("pasar a real = cambiar el flag"). RV-D29. |

---

## 2. Ítems MECANICO

### 2.1 Dependencias y oleadas

| ID | Fichas | INDEX hoy (línea) | Problema y resolución propuesta | Archivos |
|---|---|---|---|---|
| RV-01 | Las 26 de chequeo a (§3 con deps no declaradas en INDEX) y las 2 del INDEX no declaradas en §3 | Columna "Depende de" de cada fila (líneas 47–111) | Una sola fuente: la fila del INDEX. Se agregan a la fila las deps reales listadas en RV-04, RV-05 y las decisiones; §3 se reescribe igual que la fila. Lista exacta de §3 no declaradas en INDEX: B-03 (T-05, T-06, T-09, T-10, T-11), B-08 (B-05, T-04, T-05, T-07, T-10), B-09 (T-07, T-08, T-10, T-12, T-13, T-14), B-10 (T-08, T-09, T-13), B-11 (T-07, T-09, T-10), B-12 (T-07, T-08, T-09, T-10, T-13), B-14 (T-04, T-05), B-15 (T-05, T-09, T-10, T-24, T-26), B-16 (T-05, T-07, T-08, T-09, T-10), T-02 (T-01, rebase; ver RV-D02), T-03 (T-01, rebase), T-08 (T-12 solo como alternativa, RV-D08), T-09 (T-01/T-02, rebase), T-14 (T-03, T-11), T-15 (T-03), T-17 (T-11, condicional, RV-D03; T-03 se agrega por RV-04), T-19 (T-01/T-02, rebase), T-20 (T-01, rebase), W-01 (T-05, T-07 por Shell/Backdrop), W-02 (T-06, T-09), W-04 (T-05, T-06, T-07, T-09, T-18), W-05 (T-05, T-09, T-18), W-06 (W-04: solo navegación, no dep; ver RV-46), W-07 (T-18, W-04), W-08 (T-05, T-18). Revisar a mano las de W-* antes de aplicar (el parser de §3 de W-* es el menos fiable). | `tareas/INDEX.md` (columna Depende de); fichas §3 |
| RV-04 | B-01…B-25 y W-01…W-08 (ver lista), T-14, T-15, T-16, T-17, T-23, T-25 | Filas 47–111 | Imports reales no declarados. **Ninguno cambia ola salvo T-25** (escenario B). Adiciones: B-01 +T-11 (tests MSW) y +T-32 (`loginRequest`, RV-D04). B-02 +T-13 (`emailSesion`, RV-19). B-03 +T-05, T-06, T-09, T-10, T-11. B-04 +T-11, T-19. B-07 +T-10, T-11. B-08 +B-05, T-04, T-05, T-07, T-10. B-09 +T-07, T-08, T-10, T-12, T-13, T-14. B-10 +T-06 (ya en INDEX, falta en §3), T-08, T-09, T-13. B-11 +T-07, T-09, T-10. B-12 +T-07, T-08, T-09, T-10, T-13. B-13 +T-05, T-09, T-10, T-13 (T-27 se quita mientras el select esté oculto, RV-31). B-14 +T-04, T-05. B-15 +T-05, T-09, T-10, T-24, T-26. B-16 +T-05, T-07, T-08, T-09, T-10, B-17 (RV-D10). B-17 +T-28 (invalidación de `polizasKeys`, RV-27). B-22 +T-09. B-23 +T-07, T-09. B-25 +T-07. **Test de convención (FC5, FC8):** toda pantalla B y W declara T-11 (mocks de tests) y T-19 (a11y). Costo medido: 0 cambios de ola. T-14 +T-03. T-15 +T-03. T-16 +T-05, T-07, T-19. T-17 +T-03. T-23 +T-08. T-25 +T-23, T-24 (**T-25 pasa a Ola 3**; B-05, B-06 y B-08 no cambian). | `tareas/INDEX.md` filas indicadas; fichas §3 |
| RV-05 | T-21 | Fila 67: `Depende de: US-FE-B-03, US-FE-W-08` | El flujo 1 necesita login (B-01) y el flujo 2 termina en W3 (W-04), no en W-08 (T-21 §16). Deps: B-01, B-03, T-11, T-31, W-03, W-04. Ola 6 se mantiene (costo 0). | INDEX fila 67 |
| RV-06 | Todas | Sección "Oleadas" (líneas 119–125) y "Camino más largo" (129) | Con el escenario B: Ola 2 pasa de 15 a 14 tareas (sale T-25) y Ola 3 de 6 a 7 (entra T-25). Recalcular con el script al aplicar. | INDEX líneas 119–129 |

### 2.2 Ownership de archivos

| ID | Fichas | INDEX hoy (línea) | Problema y resolución propuesta | Archivos |
|---|---|---|---|---|
| RV-07 | T-01, T-02, T-03, T-11, T-14, T-17, T-19, T-20, T-21, T-23, T-24, B-01, B-05, B-06, B-20, B-21, W-04, W-08 | Tabla de ownership, líneas 230–256 | Filas que faltan. **Criterio:** un único dueño por ruta; el que crea el stub (T-01) no es el dueño del archivo final. (a) **Root (T-01):** `frontend/package.json` (ya), `frontend/eslint.config.js`, `frontend/.nvmrc`, `frontend/.gitignore`, `frontend/docker/nginx.conf` → **T-20** (solo este). (b) **App (T-14 backoffice, T-17 web):** `apps/*/index.html`, `apps/*/src/main.tsx`, `apps/*/src/index.css`, `apps/*/src/vite-env.d.ts`, `apps/*/tsconfig.json`, `apps/*/tailwind.config.*`, `apps/*/postcss.config.*`, `apps/*/src/app/queryClient.ts`, `apps/*/src/app/ordenRutas.ts`, `apps/*/src/app/PaginaNoEncontrada.tsx`. T-01 **no** crea estos archivos (D-T01-6): CI de T-01 corre sin apps. (c) **Packages:** `packages/config/*` → T-02 (T-01 no crea `tsconfig.base.json` ni `tsconfig.react.json`; los crea T-02). `packages/ui/tsconfig.json`, `packages/api/tsconfig.json` → T-01 (stub) y no se reemplazan. (d) **Vitest por workspace** (`apps/*/vitest.config.ts`, `packages/*/vitest.config.ts`, `packages/config/vitest/*`) → **T-02**. (e) **Shared de app:** `apps/*/src/shared/formato/listaCuotas.ts` y `apps/*/src/shared/hooks/useMediaQuery.ts` → **W-04** (primero en usarlos). (f) **Mock:** `packages/api/mocks/fixtures/<dominio>.ts` → API card del dominio (T-24 para clientes); `apps/*/public/mockServiceWorker.js` → **T-14** y **T-17**. (g) **Features auth:** `apps/backoffice/src/features/auth/components/LayoutAcceso.tsx` → **B-01** (RV-08). (h) **Testing UI:** `packages/ui/src/testing/*` → **T-19**. (i) **E2E:** `frontend/e2e/*` y `frontend/playwright.config.ts` → **T-21** (excepción FC17 para devDep). (j) **Clientes schemas:** `features/clientes/schemas/provincias.ts` → **B-05** (RV-10). (k) **UI componentes:** `packages/ui/src/components/PublicNav/*` y `PublicFooter/*` → **T-18** (RV-09). `packages/ui/src/components/EstadoBadge/*` → T-05 (la fila de componentes ya lo cubre con su glob; anotarlo). (l) **API:** `packages/api/src/endpoints/<dominio>.ts`, `packages/api/src/auth/*` → ver RV-D04 (T-32 por default). | `tareas/INDEX.md` (tabla "Ownership") |
| RV-08 | B-01 §4 | Fila 250 (`app/layouts/*` → T-16) | B1 §4 pone `LayoutAcceso` en `app/`; FB3-4 prohíbe que `features` importe de `app/`, y la ruta de login vive en `features/auth`. Resolución: `features/auth/components/LayoutAcceso.tsx` con dueño B-01 (fila explícita). Gana FB3-4 sobre B1 §4. | INDEX tabla ownership; B1 §4 (doc) |
| RV-09 | T-18 §16 | Sin fila | `PublicNav` y `PublicFooter` van en `@nexa/ui` (W1 §4, analisis-front §3.4) y no tienen dueño. Dueño: T-18 (fila nueva dentro de `packages/ui/src/components/`). | INDEX tabla ownership (línea 234) |
| RV-10 | B-05 §16, B-08 §16 | Sin fila | `features/clientes/schemas/provincias.ts` (catálogo de 24 jurisdicciones): dueño B-05; B-08 declara B-05 en deps (RV-04). Alternativa: `shared/` (no cambia ola). | INDEX tabla ownership; fila 86 |
| RV-11 | B-21 §16 #3 | Fila 99 | `RendicionCard.tsx` y `PagoFacilPage.tsx` los escribe B-20; B-21 agrega bloques. Filas explícitas: dueño B-20, B-21 edita bloque (B-21 ya declara B-20). | INDEX tabla ownership; filas 98–99 |
| RV-12 | B-20 §16 #1, B-21 §16 #2 | Fila 98 | El aviso de duplicado queda en B-20 (en `RendicionCard`). La invalidación de `pagoFacilKeys.rendiciones` tras subir la rendición la hace el hook de B-20 (`features/pago-facil/api`). Agregar a la fila 98. | INDEX fila 98 |
| RV-13 | B-03 §16, T-11 §16, T-28 §16 | Fila 242 (`handlers/<dominio>.ts` → API card), fila 256 (`handlers/inicio.ts` → B-03) | **T-11** crea `handlers/index.ts` y los 11 placeholders que su ficha lista (incluye `inicio.ts`). **T-28** es dueño de `handlers/cuotas.ts` (T-11 no lo crea). **B-03** llena `handlers/inicio.ts` y registra su export en `handlers/index.ts` en el mismo PR, acordado con T-11. | INDEX filas 242, 256 |
| RV-14 | T-08 §16 | Fila 235 (`packages/api/src/index.ts` → T-12) y fila 54 | T-08 agrega un bloque al barrel: agregar T-08 como colaborador. T-08 además expone la respuesta cruda (RV-18) y no reintenta `POST` (FC11). Las instancias `createApiClient` con `VITE_API_BASE_URL` las crean T-14 y T-17. | INDEX línea 235 y fila 54 |
| RV-15 | T-24 §16, T-25 §16 | Filas 237 y 242 ("API card del dominio") | T-24 crea `dto/clientes.ts`, `endpoints/clientes.ts` y `handlers/clientes.ts`; T-25 agrega su bloque y declara T-24 (RV-04). Ídem para cualquier dominio con dos API cards. | INDEX filas 237, 242 |
| RV-16 | T-13 §16, T-14 §16 | Filas 244, 249 | `app/providers.tsx` es de T-14. T-13 cablea el 401 global en un bloque de ese archivo, con acuerdo de T-14 (dependencia ya declarada). `app/guards/*` los crea T-14 como stubs y T-13 los reemplaza. | INDEX filas 244, 249 |
| RV-17 | T-17 §16, T-18 §16 | Fila 251 | `PublicLayout.tsx` es de T-18; T-17 crea el stub para que el router compile. Escribirlo en la fila 251 ("stub T-17, dueña T-18"). | INDEX fila 251 |
| RV-18 | B-21 §16 #1, T-30 §16, T-08 | Filas 54, 76 | Para la base positiva (`GET` que devuelve `text/plain`) el cliente necesita leer `res.ok`, `Content-Type` y el cuerpo sin parsear JSON. T-08 expone esa forma (respuesta cruda, con status y Content-Type) y T-30 la usa. Sin cambio de ola (T-08 es Ola 0). | INDEX filas 54, 76 |
| RV-19 | B-02 §16 #4 | Fila 59 (T-13) | B-02 saluda con el email del claim si falla `yo`. T-13 expone un selector `emailSesion`. B-02 declara T-13 (RV-04). | INDEX fila 59 |
| RV-20 | T-19 §16, T-01 | Fila 65 | `packages/ui/src/testing/` sin dueño: asignar a T-19. El subpath `@nexa/ui/testing` (exports) lo declara T-01. **T-19 no edita `packages/ui/package.json`** (FC17): quitarlo de §5 de T-19. | INDEX tabla ownership; T-01; T-19 §5 |
| RV-21 | T-23 §16 | Fila 243 y fila 69 | La carpeta `packages/api/test/contract/` no es de T-23 completa: T-23 es dueña del harness y cada API card agrega `<dominio>.contract.test.ts` (RV-D31). Fila 69: agregar T-08 (`createApiClient` con `baseUrl` inyectable). **T-23 no edita `packages/api/package.json`** (FC17): quitarlo de §5 de T-23. | INDEX filas 69, 243; T-23 §5 |
| RV-22 | T-10 §16 | Sin fila | `EstadoBadgeValue` (y `BADGE_ESTADOS`, RV-D07) sin dueño. Dueño T-10, en `packages/api/src/enums/`. | INDEX tabla ownership (línea 240) |
| RV-23 | T-03 §16, T-01 §16 | Fila 232 | `apps/*/tailwind.config.*` y el `content` de Tailwind: dueños T-14 (backoffice) y T-17 (web). Sin stub de T-01 (D-T01-6). | INDEX tabla ownership (línea 232) |

### 2.3 Dependencias de librerías (T-01, FB1, FC17)

| ID | Fichas | INDEX hoy (línea) | Problema y resolución propuesta | Archivos |
|---|---|---|---|---|
| RV-24 | T-01 §16, T-23 §16, T-19, T-21 | Fila 47 (T-01) | La fila omite paquetes que las fichas usan y FB1/FC17 exigen. Agregar a T-01: `@hookform/resolvers` (compatible con react-hook-form y zod, verificar con `npm view`), `jsdom`, `@testing-library/dom`, `@testing-library/user-event`, `@testing-library/jest-dom`, `@vitejs/plugin-react`, `postcss`, `autoprefixer`, `typescript`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-config-prettier`, `eslint-plugin-jsx-a11y` (D-T01-4, default agregar), `@types/*` necesarios, ambas familias `@fontsource/*` (FB7.2), `cross-env` (devDep, T-23 D-4), `zod` devDep de `packages/api` (T-23), Playwright y `@playwright/test` (excepción de T-21), `exports` del subpath `@nexa/ui/testing`. FB1 debe listar `cross-env`, `jsx-a11y` y Playwright. | INDEX fila 47; FB1 |

### 2.4 Contratos y tareas puntuales

| ID | Fichas | INDEX hoy (línea) | Problema y resolución propuesta | Archivos |
|---|---|---|---|---|
| RV-26 | B-22 §16 #1, B-23, T-09 §16 | Fila 55 (T-09), filas 100–101 | Parseo de importes es-AR (`27.500,00` → `27500`) sin dueño. T-09 exporta `parseImporteEsAR` (en `packages/api/src/format/`). B-22 y B-23 declaran T-09 (RV-04). | INDEX fila 55; filas 100–101 |
| RV-27 | B-17 (de T-29), T-29 §16 #2 | Fila 75 (T-29), fila 95 (B-17) | T-29 no importa `polizasKeys` de T-28 (un API no invalida cachés de otro dominio). La invalidación cruzada la hace el hook de la feature (B-17, `features/pagos/api`). B-17 declara T-28; no cambia su ola (3). | INDEX fila 95 |
| RV-28 | T-31 §16 | Fila 77 | `publicoKeys.cupon` (triage final; antes `pagoFacilKeys.cupon`) (usado por W-07 con `useQueries`) lo exporta T-31 junto al handler. Agregar a la fila 77. | INDEX fila 77 |
| RV-29 | T-26 §16, T-26 D-26-3 | Fila 72 | `PUT` y `DELETE` de vehículos están implementados en el back (PR #47) y ninguna tarea ni pantalla los consume. Documentar la exclusión ("fuera de alcance; tarjeta propia si se necesitan"). | INDEX fila 72 |
| RV-30 | T-27 §16 | Fila 73 | `GET /api/planes?incluirInactivos=true` devuelve 200 aunque el back no soporte el parámetro (fallo silencioso). Pedido al back (PB-09): agregarlo en `pedidos-al-back.md` (doc PR aparte; ninguna tarea de front edita ese archivo). Ver RV-D29. | `pedidos-al-back.md` PB-09 (doc PR) |
| RV-31 | B-13 §16 | Fila 91 | La fila lista `GET /api/vehiculos/{id}` (la lista no trae `vehiculoId`) y `GET /api/planes` (select oculto por PB-06). Quitar ambos endpoints; quitar T-27 de deps mientras el select esté oculto. Agregar T-05, T-09, T-10, T-13 (RV-04). | INDEX fila 91 |
| RV-32 | B-15 §16 | Fila 93, matriz fila 203 | El detalle ya trae `cuotas`; `GET /api/polizas/{id}/cuotas` no se llama desde B-15. Quitarlo de la fila 93 y de la matriz (fila 203). Agregar T-05, T-09, T-10, T-24, T-26 (RV-04). | INDEX filas 93, 203 |
| RV-33 | B-10 §16 | Fila 88 | La fila dice "lista de opciones con `GET /api/planes`". Las opciones salen de `POST /api/cotizaciones` (RN05); `GET /api/planes` solo aporta la descripción. Corregir texto. | INDEX fila 88 |
| RV-34 | B-10 §16, B-11 §16 | Fila 89 | El CTA "Emitir" figura en B-10 y B-11. Lo implementa B-10 (ambas fichas lo acuerdan). Quitar el CTA de la fila 89. | INDEX fila 89 |
| RV-35 | B-07 §16, D-17 | Fila 85 | "pestañas Vehículos y Pólizas": D-17 manda, Vehículos es pestaña y Pólizas es sección apilada. Corregir texto. Agregar T-10 y T-11 a deps (RV-04). | INDEX fila 85 |
| RV-36 | B-02 §16 #2 | Fila 80 | KPI 4 ("cuotas vencidas") sin dueño claro: INDEX lo da a B-03, que solo agrega el widget de la tabla. Default de B-02: renderiza el total con el mock de `GET /api/cuotas` (T-28, PB-24). Agregar `GET /api/cuotas` (mock, T-28) al endpoint de la fila 80 y dejar escrito que el donut y KPI 4 son de B-02. | INDEX fila 80 |
| RV-37 | B-03 §16 | Fila 81 | Promo de rendición: `features/inicio/components/PromoRendicion.tsx` (default de B-03; B2 §4 la pone en `pago-facil`, que no es dependencia). Aceptar el default. | INDEX fila 81 (texto) |
| RV-38 | B-06 §16, B-08 §16 | Fila 84 y 86 | La fila de B-06 atribuye `POST .../validar-renaper` al alta. El endpoint necesita `id` y el alta redirige en el 201. El reintento es de B-08 (D-B06-1 de B-06; D-B08-7). Quitarlo de la fila 84 y agregarlo a la fila 86. Timeout de cliente y reintento ante 502: T-25 (D-25-2). | INDEX filas 84, 86 |
| RV-39 | B-05 §16 | Fila 83 | "Puede empezar sin esperar a B-07", pero ambas editan `routes.tsx` (FC14: `/clientes/nuevo` antes de `/clientes/:clienteId`). Cambiar la columna "Puede empezar" de B-05 a "merge antes que B-07 (routes.tsx)". | INDEX fila 83 |
| RV-40 | B-08 §16 | Fila 86 | Deps incompletas (T-04, T-05, T-07, T-10) y B-05 (provincias y diálogo). Agregar (RV-04). | INDEX fila 86 |
| RV-41 | B-04 §16, B-05 §16, B-08 §16 | Filas 82, 83, 86 | El aviso de alta/baja (`location.state.avisoAlta`) no lo lee ninguna tarea del INDEX. Clave única `aviso` con `{ tipo, texto }`: B-05 y B-08 lo producen; B-04 lo muestra (agregarlo a su alcance, fila 82). Renombrar en las tres fichas. | INDEX filas 82, 83, 86 |
| RV-42 | B-04 §16 | Fila 82 | Deps incompletas: T-11 y T-19 (RV-04). El título y el botón "Nuevo cliente" van en el slot `accion` de T-16 (DP-6: cada página pasa su acción), no dentro de la página; alinear B-04 D-B04-4 con T-16 DP-6. | INDEX fila 82 |
| RV-43 | B-14 §16 | Fila 92 | La fila dice "Resuelve DNI con `GET /api/clientes?dni=`" y no menciona que la búsqueda por número y DNI depende de PB-06 (constante `BUSQUEDA_NUMERO_DNI_DISPONIBLE = false`, DP-B14-01). Corregir texto; agregar T-04 y T-05 a deps. Ver RV-D29. | INDEX fila 92 |
| RV-44 | T-25..T-32 (D-API-1) | Sin fila (FB3, FC2) | Hooks: FB3 y FC2 mandan (`features/<dominio>/api/` para hooks, `@nexa/api` para funciones de request). D-API-1 dice que el prompt pide hooks en `@nexa/api`; ese prompt no cambia la regla. Corregir D-API-1 en T-25..T-32 para que diga "FC2 manda". | Fichas T-25..T-32 (D-API-1) |
| RV-45 | W-03 §16 | Fila 106 | La fila dice "tipos de `location.state` para W3 a W5 y W6". W-06 no recibe estado: corregir a "W3 a W5". W3 §8 debe incluir `consulta` (W-04 §9.1 lo necesita). | INDEX fila 106; W3 §8 (doc) |
| RV-46 | W-06 §16 | Fila 109 | W-06 no muestra la opción Pago Fácil en el alcance. Agregar al alcance. No agregar dependencia de W-07: navegar por ruta no es dependencia (INDEX, "Dependencias", línea 13). | INDEX fila 109 |
| RV-47 | W-04 §16 | Línea 252 (`shared/`) | `shared/formato/listaCuotas.ts` lo usan W-04, W-05, W-06 y W-07. Dueño W-04 (primera en usarlo). W-05 declara W-04 (ya en INDEX). | INDEX línea 252 |
| RV-48 | W-05 §16 | Sin fila | "Barra fija" (DN-W5-1) no está en INDEX. Agregar como decisión menor de la pantalla W5 (D-36, RV-68). | INDEX decisiones |
| RV-49 | T-04 §16 y FC8 | Línea 28 (FC8) | FC8 dice que la revisión de accesibilidad de cada pantalla usa T-19 y T-19 depende de T-04..T-07 (circular para los primitivos). Aclarar en FC8: los primitivos usan `vitest-axe` directo; T-19 es el helper para pantallas. | INDEX línea 28 |
| RV-50 | T-15 §16, T-16 §16 | Filas 61, 62 | T-15 usa T-03; T-16 usa T-05, T-07 y T-19 sin declararlos. Agregar (RV-04). Sin cambio de ola de T-16 (sigue en 3). | INDEX filas 61, 62 |
| RV-51 | T-17 §16 | Fila 63 | T-17 necesita T-03 (estilos en `main.tsx`). El import de T-11 en `main.tsx` es condicional (RV-D03). Agregar T-03. | INDEX fila 63 |
| RV-53 | T-21 §16 | Fila 67 | La fila no menciona que el smoke usa login (B-01) y que T-21 agrega Playwright como excepción de FC17. Escribirlo en la fila. | INDEX fila 67 |
| RV-54 | T-22 §16 | Fila 68 | El README reproduce la tabla de ownership; debe enlazar al INDEX. Sumar T-01 a deps (ya es ancestro; no cambia ola). | INDEX fila 68; README |
| RV-55 | T-24 §16 | Sin fila | `CuotaCuentaCliente` copia la forma de `CuotaResponse`. Deuda de tipos: anotar en el INDEX (si T-28 publica el tipo, T-24 lo importa). | INDEX (nota) |
| RV-56 | T-28 §16 | Fila 74 | El filtro de PB-24 necesita el mapa de enum de T-10. Cuando PB-24 se resuelva, sumar T-10. Nada hoy. | INDEX fila 74 (nota) |
| RV-57 | T-29 §16 | Fila 75 | `POST /api/pagos/{id}/conciliar` existe en back y queda fuera del front (contrato §10.4). Nota en la fila. | INDEX fila 75 (nota) |
| RV-58 | T-02 §16 | Fila 48 | Cada workspace necesita su `vitest.config.ts` (RV-07). La convención de Ola 0 está en RV-D02. | INDEX fila 48 y ownership |
| RV-59 | T-09 §16, B3 D-10 | Fila 55 | `DNI` lo formatea `@nexa/api` (FC9, INDEX); B3 D-10 dice `@nexa/ui`. Se sigue el INDEX; corregir B3 D-10 (doc). | `pantallas/B3-clientes.md` D-10 (doc) |
| RV-60 | T-03 §16, design-system | Fila 49 | `design-system.md §1.2` pone `frontend/packages/ui/src/styles/tokens.css` y `§2.1` pone Google Fonts; el INDEX y FB7.2 mandan (`packages/ui/src/tokens.css`, `@fontsource`). Corregir design-system §1.2 y §2.1 (doc PR). | `design-system.md` §1.2, §2.1 (doc PR) |
| RV-61 | B-25 §16 | Fila 103 | Falta T-07 (`AlertaError`, `Backdrop`) en deps. Agregar (RV-04). | INDEX fila 103 |
| RV-63 | B-09 §16, B-13 §16 | Filas 87, 91 | Deps incompletas (T-07, T-10, T-13). Agregar (RV-04). | INDEX filas 87, 91 |
| RV-65 | B-12 §16 | Fila 90 | Deps incompletas (T-07, T-08, T-09, T-10, T-13). Agregar (RV-04). | INDEX fila 90 |
| RV-66 | B-16 §16, B-18 §16 | Filas 94, 96 | B-16 deps incompletas (RV-04). El botón "Registrar pago en caja" sin dueño: RV-D10. | INDEX filas 94, 96 |
| RV-68 | Índice de decisiones | Líneas 266–298 | Faltan decisiones citadas por las fichas. Agregar D-34: buscador y campana (B2 D-6, D-7; T-16 DP-5, DP-7). D-35: breakpoint móvil 768 px (design-system §7.4; T-18, W-04). D-36: barra fija de W5 (DN-W5-1). D-37: ubicación de `Dialogo` (RV-D05). D-38: destino de pedidos de contraste (RV-D25). D-39: `hooks/` en FB3 (RV-D26). D-40: filtros ignorados por el back (RV-D29). D-41: PB-04 (RV-D30). D-42: contract tests de API cards (RV-D31). | INDEX líneas 266–298 |

---

## 3. Ítems DECISION

### RV-D01. Texto de error cuando Figma y back difieren (FB5 vs FB7.6)
- **Fichas:** B-01 (D-B01-1, §16), T-07 (D-T07-5), T-21 (§16), W-03 (DN-W3-1, §16).
- **INDEX hoy:** fila 79 dice `401` "Credenciales inválidas." en el formulario; fila 106 dice "404 y 429 con `detail`".
- **Conflicto:** FB5 y B1 §5 dicen que los textos de UI vienen del Figma ("Email o contraseña incorrectos."). FB7.6 dice que la UI muestra `detail` ("Credenciales inválidas."). W2 §7 y §13.1 piden el texto del Figma para 404 y no el `detail`.
- **Opciones:** (a) texto del Figma en la alerta, `detail` solo en logs; (b) `detail` del back tal cual; (c) Figma para mensajes genéricos, `detail` para errores de negocio.
- **Default recomendado:** (a) para login y 404 de W-03. FB5 manda sobre textos de UI; el mensaje no revela si el email existe. FB7.6 se acota a "errores de negocio sin texto propio".
- **Costo de equivocarse:** bajo en seguridad (ninguna opción revela existencia del email); alto en confianza si el texto de QA no coincide con el del Figma. Confirmar con diseño.

### RV-D02. Convención de Ola 0 con T-01 (y T-02) como prerrequisito
- **Fichas:** T-02 §16, T-03 §3, T-08 §3, T-09 §3, T-19 §3, T-20 §3.
- **INDEX hoy:** Oleadas (línea 119) dice que Ola 0 "rebasa sobre T-01"; las filas de T-02, T-03, T-08, T-09, T-19, T-20 dicen "Depende de: Nada".
- **Conflicto:** las fichas declaran T-01 (y T-02 en T-09 y T-19) como dependencia de config y tests. Declararlos cambia 47 tareas de ola (escenario G).
- **Opciones:** (a) convención explícita: T-01 y T-02 son prerrequisitos de rebase y no cuentan para la ola; (b) declararlos y aceptar la cascada.
- **Default recomendado:** (a), escrito en el encabezado de "Oleadas". Las fichas dicen "rebase sobre T-01" en lugar de "dependencia".
- **Costo de equivocarse:** con (b), 47 tareas cambian de ola. Con (a), el riesgo es un merge sobre una T-01 no mergeada; se mitiga con la regla de rebase de FC7.

### RV-D03. T-14 y el bootstrap de MSW (T-11)
- **Fichas:** T-14 §3 y §16 (DP-1), T-17 (import condicional), T-11 §13.
- **INDEX hoy:** T-14 "Depende de: T-02, T-08"; Ola 1.
- **Conflicto:** `main.tsx` importa `iniciarMocksSiCorresponde` (T-11). Declararlo en T-14 cambia 31 tareas de ola (escenario A): T-13, T-16 y casi todo el backoffice.
- **Opciones:** (a) declarar T-11 en T-14; (b) T-14 sin bootstrap; el bootstrap lo agrega **B-01** en `main.tsx` (backoffice, primera pantalla con mocks) y **W-06** (web, primera pantalla que usa mock de T-31).
- **Default recomendado:** (b). Costo medido de B-01 +T-11 y W-06 +T-11: 0 cambios de ola. T-03 se declara en T-14 (sin cambio).
- **Costo de equivocarse:** (a) cambia 31 tareas. (b) deja la app sin mocks hasta B-01 y W-06; el dev con back real no lo necesita.

### RV-D04. Dueño de `loginRequest` (función de request de auth)
- **Fichas:** T-12 §16, T-13 §16, B-01 §16 (`packages/api/src/auth/*` sin fila).
- **INDEX hoy:** FC2 asigna "las funciones de request de auth" a T-12; la fila 58 de T-12 solo menciona tipos. Ninguna tarea escribe `loginRequest`. T-32 ya tiene `POST /api/auth/usuarios` y `GET /api/auth/yo` (mock), depende de T-08 y T-12, y es Ola 2.
- **Conflicto:** la función necesita el cliente (T-08) y los tipos (T-12).
- **Opciones:** (a) T-32 escribe `loginRequest` en `packages/api/src/auth/login.ts` (T-32 ya es dueña de `/api/auth/*`); B-01 declara T-32. (b) T-12 declara T-08 (cascada de 24 tareas). (c) B-01 lo escribe en `features/auth/api/` (excepción a FC2).
- **Default recomendado:** (a). Costo medido de B-01 +T-32: **0 cambios de ola**. FC2 se enmienda para decir "auth: T-12 tipos, T-32 funciones de `/api/auth/*`".
- **Costo de equivocarse:** (b) cascadea 24 tareas. (c) saca la función de `@nexa/api`.

### RV-D05. Diálogo de confirmación en `@nexa/ui`
- **Fichas:** B-05 §16 y D-B05-3, B-08 §16 y D-B08-8, B-23 D-B23-02.
- **INDEX hoy:** no hay primitivo de diálogo en ownership ni en `@nexa/ui`.
- **Conflicto:** B-05 crea un `DialogoModal` en `features/clientes`; B-08 lo reutiliza; B-23 lo necesita en `features/planes`. Un feature no importa de otro (FB3-1).
- **Opciones:** (a) T-07 agrega `Dialogo` a `@nexa/ui` sin depender de T-05 (los botones entran como `children`); (b) nueva tarea de primitivo en Ola 1.
- **Default recomendado:** (a). No cambia oleadas. B-08 y B-23 declaran T-07.
- **Costo de equivocarse:** (a) hace crecer T-07 (ya es M). (b) agrega una tarea a Ola 1.

### RV-D06. Shell compartido o duplicado (backoffice y web pública)
- **Fichas:** T-16 §16, T-18 §16 ("Shell privado para la web"), W-01 §16, design-system §5.15, analisis-front §3.4.
- **INDEX hoy:** fila 62 (T-16) y fila 250 asignan `Shell` a `apps/backoffice/src/app/layouts/`.
- **Conflicto:** analisis-front lo pone en `@nexa/ui`; design-system §5.15 lo define como componente; W-01 y W-03 (web) lo necesitan.
- **Opciones:** (a) `Shell` en `@nexa/ui` (T-07); (b) duplicado en `app/layouts` (backoffice) y en `packages/ui` (web, T-18); (c) T-16 lo sube a `@nexa/ui` cuando W-01 lo pida.
- **Default recomendado:** (a). T-16 y T-18 importan de `@nexa/ui` (ambas declaran T-07 tras RV-04). Sin cambio de ola.
- **Costo de equivocarse:** (b) duplica un layout. (c) bloquea T-18 hasta que T-16 termine.

### RV-D07. Mapa de badges: dónde vive `EstadoBadgeValue` y `BADGE_ESTADOS`
- **Fichas:** T-05 §16 (pide que T-10 importe `BADGE_ESTADOS` de `@nexa/ui`), T-10 §16 DP-3 (pide que T-05 importe `EstadoBadgeValue` de `@nexa/api`).
- **INDEX hoy:** T-05 y T-10 no se declaran.
- **Conflicto:** las dos fichas se piden la dependencia en sentido contrario. FB2: `@nexa/api` no depende de `@nexa/ui`.
- **Opciones:** (a) T-10 es dueño de `EstadoBadgeValue` en `@nexa/api`; T-05 define su propia unión de 9 literales y una prueba en una app compara ambos arrays; (b) T-05 es dueño y T-10 la importa (T-10 pasa a Ola 2); (c) duplicado sin prueba.
- **Default recomendado:** (a). Costo medido de (b): **+1 tarea** (T-10 de Ola 1 a Ola 2), sin cascada adicional.
- **Costo de equivocarse:** (b) cambia T-10 de ola; (c) deja drift silencioso.

### RV-D08. `ProblemDetails` en T-08 o importado de T-12
- **Fichas:** T-08 §16 y D-T08-1.
- **INDEX hoy:** T-08 "Depende de: Nada"; T-12 es Ola 0 y dueña de `dto/comunes.ts` (`ProblemDetails`).
- **Conflicto:** dos definiciones del mismo contrato wire.
- **Opciones:** (a) T-08 valida la forma wire con guardas sobre `unknown` y no re-declara el tipo; (b) T-08 importa de T-12.
- **Default recomendado:** (a). Costo medido de (b): **+54 tareas** (cascada por T-08 y su ruta crítica).
- **Costo de equivocarse:** (b) cascadea casi todo el backoffice.

### RV-D09. Tipos compartidos entre T-31 y T-29/T-30 (`FacturaResponse`, `CuponPagoFacilResponse`)
- **Fichas:** T-31 §3 y §16, T-29 §16, T-30 §16.
- **Conflicto:** `dto/publico.ts` importa tipos de T-29 y T-30.
- **Opciones:** (a) T-31 declara T-29 y T-30; (b) T-31 copia los dos tipos en `dto/publico.ts` y T-23 valida la forma contra el contrato.
- **Default recomendado:** (b). Costo medido de (a): **+8 tareas** (T-31 a Ola 3, W-03..W-08 y T-21).
- **Costo de equivocarse:** (a) cascadea. (b) puede divergir; T-23 lo detecta.

### RV-D10. Botón "Registrar pago en caja" del encabezado de la póliza
- **Fichas:** B-15 §16, B-16 §16, B-18 §16 (botón sin dueño), B10 §5.
- **INDEX hoy:** B-18 y B-16 describen el cobro del rail; ninguna tarea nombra el botón del encabezado.
- **Opciones:** (a) B-18 agrega el botón en la fila de acciones (creada por B-16) y declara B-16; costo medido: **B-18 pasa a Ola 7**; (b) B-17 (dueño de `CobroCaja`) exporta `CobrarVencidasButton`, B-16 coloca el botón en la fila de acciones y declara B-17 (Ola 3); B-18 lo reutiliza en el widget.
- **Default recomendado:** (b). Costo medido: **0 cambios de ola** (B-16 sigue en 6; B-17 ya es Ola 3). Dueño del componente: B-17, acorde con el cobro.
- **Costo de equivocarse:** (a) agrega una ola nueva con una sola tarea.

### RV-D11. Cobro desde el widget de B10: sin checkboxes (D1 de B10)
- **Fichas:** B-17 §13 D-B17-01, B-18 §13 D-B18-01, B-19 §13 D-B19-05.
- **Conflicto:** `CobroCaja` con checkboxes (B-17) frente al widget de B-18 que cobra todas las vencidas con un clic. B10 D1 es decisión crítica de producto.
- **Opciones:** (a) el widget cobra todas las vencidas con un clic; la selección queda en B11 (B-19); (b) checkboxes en el widget; (c) confirmación con el importe.
- **Default recomendado:** (a), con resumen visible (`Cuotas 6 y 7`) y sin paso extra.
- **Costo de equivocarse:** (a) puede cobrar más cuotas de las deseadas; (b) más clics y componentes. Confirmar antes de B-18.

### RV-D12. Destino del botón "Emitir póliza" de B-13
- **Fichas:** B-13 §13 DP-B13-03, B-12 §16 (no hay pantalla para elegir cotización), B-10.
- **Opciones:** (a) `/clientes` (el empleado elige cliente, vehículo y cotización); (b) quitar el botón; (c) selector de cotizaciones de la póliza.
- **Default recomendado:** (a). Sin cambio de ola.
- **Costo de equivocarse:** (a) alarga el flujo; (b) oculta una acción del diseño; (c) requiere tarea nueva.

### RV-D13. Forma de los listados de pagos (PB-05) y de `GET /api/polizas/{id}/pagos`
- **Fichas:** B-18 §13 D-B18-04, B-19 §13 D-B19-06, T-29 (D-29-3), pedidos PB-05.
- **Conflicto:** PB-05 propone `PagoResumen` sin `factura`; el widget de B-18 necesita el estado de factura. B-19: B11 §9 propone `PaginaResponse<PagoListadoResponse>`, PB-05 otra forma.
- **Opciones:** (a) `PagoResponse[]` con `factura` (B-18) y la forma de B11 §9 (B-19); (b) la forma de PB-05.
- **Default recomendado:** (a). Actualizar PB-05 en `pedidos-al-back.md` (doc PR) para que el back confirme.
- **Costo de equivocarse:** (b) obliga a una llamada extra para la factura o a quitar el estado de factura del widget.

### RV-D14. Total previo al cobro (suma en el front)
- **Fichas:** B-17 §13 D-B17-03, B-17 §8.
- **Conflicto:** B11 §6 pide "Total a registrar" sumado en el front; `convenciones-transversales.md:386` dice que el front no recalcula totales.
- **Opciones:** (a) no sumar: mostrar el importe del back; (b) suma en centavos enteros (default de B-17).
- **Default recomendado:** (a), porque la convención es explícita y el importe confirmado es `PagoResponse.importe`.
- **Costo de equivocarse:** bajo; (b) puede mostrar un total distinto del cobrado si hay recargos.

### RV-D15. Texto del estado "Pendiente CAE" vs "Pendiente de CAE"
- **Fichas:** B-17 §13 D-B17-04, B-19 (texto de celda), W-08 (W6).
- **Conflicto:** el Figma usa "Pendiente CAE" (badge, B10) y "Pendiente de CAE" (texto de celda, B11 y W6).
- **Opciones:** (a) badge "Pendiente CAE" y celda "Pendiente de CAE" (default de B-17); (b) un solo texto.
- **Default recomendado:** (a) hasta que diseño confirme.
- **Costo de equivocarse:** bajo; cambia el literal de `EstadoFactura` en T-10.

### RV-D16. Request del resumen de inicio (`GET /api/inicio/resumen`, PB-08) sin API card
- **Fichas:** B-03 §16, B-02 (cita el endpoint), chequeo d.
- **INDEX hoy:** matriz (fila 181): "B-03 (mock local)"; `handlers/inicio.ts` lo escribe B-03.
- **Conflicto:** FC2 manda que las requests vivan en `@nexa/api` por dominio; `inicio` no tiene API card.
- **Opciones:** (a) request, tipo y hook en `features/inicio/` hasta que PB-08 se publique, luego se mueve a `@nexa/api`; (b) API card nueva para `inicio`.
- **Default recomendado:** (a), como excepción documentada a FC2.
- **Costo de equivocarse:** (b) agrega una tarea de Ola 2; (a) deja una excepción que hay que recordar al mover.

### RV-D17. DNI y `numeroPago` en el retorno de la pasarela (W-06 y W-08)
- **Fichas:** W-08 §13 DB-W8-1, W-06 §16 (FC12), pedidos PB-01.
- **INDEX hoy:** fila 111 (W-08) con PB-01 bloqueante; FC12 (línea 32) dice que el único dato en `sessionStorage` es `numeroPago`.
- **Conflicto:** `POST /api/publico/factura` y `POST /api/publico/pagos/estado` exigen `dni`. El retorno de la pasarela no trae DNI.
- **Opciones:** (a) el back acepta `numeroPago` sin DNI (PB-01); MSW hasta entonces con desviación marcada; (b) guardar DNI y número de póliza en `sessionStorage` (rompe FC12); (c) DNI en la URL de retorno (prohibido por DP-B14-04 y W-05).
- **Default recomendado:** (a). Único que respeta FC12 y no expone DNI en URL. Pedido al back en `pedidos-al-back.md` (doc PR).
- **Costo de equivocarse:** (b) guarda un dato personal en storage del navegador; (c) expone DNI en URL, historial y logs del proxy. Decisión de seguridad: confirmar antes de W-06.

### RV-D18. Contraseña temporal generada en el front (B-24)
- **Fichas:** B-24 §13 D-B24-02 y D-B24-05.
- **Conflicto:** el default genera la contraseña en el front (`crypto.getRandomValues`); la política de Identity la aplica el back.
- **Opciones:** (a) el front genera (default de B-24); (b) el back genera y devuelve la contraseña; (c) el admin escribe la contraseña y el back la valida.
- **Default recomendado:** (b) o (c). Si el equipo mantiene (a), que el back valide la política al crear y que la contraseña no persista en el estado de la app tras copiarla.
- **Costo de equivocarse:** (a) sin validación del back puede crear contraseñas rechazadas por Identity. Decisión de seguridad.

### RV-D19. Hosting de producción del front y registro de imágenes (T-20)
- **Fichas:** T-20 §13 (1 y 3), §16; convenciones §1.4 (dominios de Cloudflare Pages en `.env.example`).
- **Conflicto:** `.env.example` menciona Cloudflare Pages; `CORS_ORIGIN_*` del back debe listar los orígenes.
- **Opciones:** (a) Cloudflare Pages; (b) contenedores en la VM con nginx; (c) decidir después.
- **Default recomendado:** (c), con imágenes que sirven en cualquier host (default de T-20).
- **Costo de equivocarse:** cambia CORS del back y el build arg `VITE_API_BASE_URL`.

### RV-D20. Edad mínima en el alta (bloqueo vs aviso)
- **Fichas:** B-05 §13 D-B05-4 (B4 D-10).
- **Conflicto:** B4 D-10 propone solo avisar; el default bloquea (el back aplica la misma regla sin Renaper).
- **Opciones:** (a) bloquear en el front; (b) avisar y dejar que el back decida.
- **Default recomendado:** (a).
- **Costo de equivocarse:** (a) bloquea un alta que el back aceptaría si la regla cambia; (b) muestra un aviso que el back rechazará igual.

### RV-D21. Textos y destinos "NO DEFINIDO" (agrupado)
- **Fichas:** T-18 §13 (logo, Planes, Contacto, menú móvil, "A confirmar"), T-16 §13 (DP-1 Vehículos y Cotizaciones sin link; DP-4 cerrar sesión; DP-5..7), W-01 §13 (DN-W1-1 "Ver ejemplo de cupón"), W-04 §13 (tope de 24), T-17 §13 ("Nexa Seguros"), T-14 §13 (títulos de error).
- **Conflicto:** textos y destinos sin decisión de producto ni diseño.
- **Opciones:** (a) aceptar los defaults de cada ficha y marcarlos para confirmar; (b) bloquear hasta que diseño responda.
- **Default recomendado:** (a). Ningún default deja enlaces rotos (los ítems sin destino no son interactivos); el enlace a W5 sin estado queda fuera (W-01).
- **Costo de equivocarse:** bajo; cambian textos o destinos, no oleadas.

### RV-D22. Precios "desde" y valores de planes (Figma vs seed; factores RN06)
- **Fichas:** W-01 §13 (DN-W1-5), W-02 §13 (DN-W2-1, DN-W2-2).
- **Conflicto:** el Figma muestra $10.000 / $18.000 / $27.500; el seed 12.000 / 18.000 / 30.000. El "desde" con factor de moto (0,70, RN06) puede ser mayor que el mínimo real de una moto.
- **Opciones:** (a) `primaBase` del endpoint (D-07); (b) recalcular con factores (el front no calcula factores, B7 D-B7-02).
- **Default recomendado:** (a) y pedido a diseño por la diferencia de Figma vs seed.
- **Costo de equivocarse:** (a) muestra un "desde" mayor al mínimo real de motos; tema de negocio.

### RV-D23. Renaper: reintento ante 502 y excepción de FC10 (marcar el campo DNI con 404)
- **Fichas:** T-25 §13 (D-25-2, D-25-5), B-06 §13 (D-B06-4).
- **Conflicto:** FC10 solo permite marcar un campo con `errors`; T-25 y B-06 marcan el campo DNI con `codigo === 'PERSONA_NO_ENCONTRADA'`.
- **Opciones:** (a) aceptar la excepción y documentarla en FC10; (b) error en caja general.
- **Default recomendado:** (a), y 1 reintento ante 502. Documentar en FC10 (línea 30).
- **Costo de equivocarse:** bajo.

### RV-D24. Acceso denegado: panel o redirección (rol sin permiso)
- **Fichas:** T-13 §13 (DP-2), B-13 y B-14 (NO DEFINIDO).
- **Opciones:** (a) panel "sin permiso" en la misma URL (default); (b) redirección a `/inicio`.
- **Default recomendado:** (a).
- **Costo de equivocarse:** bajo.

### RV-D25. Destino de los pedidos de contraste y de diseño (T-19)
- **Fichas:** T-19 §13 (3) y §16.
- **Conflicto:** INDEX fila 65 pide el registro "en el detalle de los pedidos de contraste a diseño"; `pedidos-al-back.md` es de back.
- **Opciones:** (a) `design-system.md §9` (default); (b) documento nuevo `docs/frontend/pedidos-a-diseno.md`.
- **Default recomendado:** (a). Asignar dueño de docs.
- **Costo de equivocarse:** bajo.

### RV-D26. Hooks de UI sin carpeta en FB3 (`useSeleccionCuotas`)
- **Fichas:** W-04 §16.
- **Opciones:** (a) agregar `hooks/` a FB3; (b) mantenerlo en `components/`.
- **Default recomendado:** (a). Sin impacto en oleadas. Requiere decisión del equipo porque FB3 "manda".
- **Costo de equivocarse:** bajo; (b) mezcla componentes y lógica.

### RV-D27. Decisiones de diseño menores (agrupado)
- **Fichas:** T-04 §13 (D-T04-1, foco 2 px vs anillo), T-05 §13 (D-T05-1, disabled de Button), T-06 §13 (D-T06-1, ancho de columnas; D-T06-4, activación de pestañas), T-07 §13 (D-T07-1, estilo de Dato; D-T07-2, variante de AlertaError B1 vs B4), T-15 §13 (DP-6, color del rol), B-04 §13 (D-B04-6, debounce), B-14 §13 (DP-B14-05, DNI 7 u 8).
- **Default recomendado:** los defaults de cada ficha. Ancho de columnas: "width opcional; sin `width`, reparto igual". AlertaError: variante B1. Registrar en D-34..D-39 (RV-68).
- **Costo de equivocarse:** bajo; estilos y comportamientos reversibles.

### RV-D28. Credenciales del back real y E2E en CI (T-21, T-23)
- **Fichas:** T-23 §13 (3, 5), T-21 §13 (3, 4).
- **Conflicto:** `CONTRACT_EMAIL` y `CONTRACT_PASSWORD` sin definición; el seed usa `SEED_ADMINISTRADOR_*`. E2E en CI sin definir.
- **Default recomendado:** variables locales sin valores en el repo; E2E fuera de CI.
- **Costo de equivocarse:** bajo; (b) agrega costo de CI.

### RV-D29. Filtros que el back real ignora (mock-only) y FC3
- **Fichas:** B-14 §13 (DP-B14-01), B-19 §13 (D-B19-03), B-23 §13 (D-B23-04), B-13 §13 (PB-06), T-27 §16, T-28 §13 (D-28-1), B-19 §16.
- **INDEX hoy:** matriz fila 200 ("GET /api/polizas?numero= y dni= (NO, PB-06)"); filas 74, 91, 92, 101 los mencionan; FC3 (línea 23) dice que pasar a real es "cambiar el flag".
- **Conflicto:** el back real responde 200 e ignora `numero`, `dni`, `incluirInactivos`, `planCodigo`, por eso el mock "funciona" y el real muestra todo. FC3 no cubre esto.
- **Opciones:** (a) ocultar el control (constante) hasta que el PB lo publique (DP-B14-01 y D-B23-04 de las fichas) y agregar a FC3 que un filtro ignorado no se activa con el flag: se activa con la constante; (b) dejar el control activo con MSW y un aviso.
- **Default recomendado:** (a). Costo de (b): el empleado puede creer que buscó y ver todas las pólizas (B-19 puede cobrar la póliza equivocada).
- **Costo de equivocarse:** (b) riesgo de cobro o consulta sobre datos equivocados.

### RV-D30. PB-04: contrato de usuarios (`PATCH` vs `POST` de activación; `tamano` vs `tamanoPagina`)
- **Fichas:** B-25 §13 (D-B25-03), B-14 (pantalla §9 propone `POST .../desactivar`), PB-04 en `pedidos-al-back.md`.
- **INDEX hoy:** filas 102–103 y 78 (T-32) usan `PATCH /api/usuarios/{id}/activo`, `tamano`.
- **Conflicto:** B14 §9 propone `POST .../desactivar` y `POST .../activar` (204) y `?pagina=1&tamano=20`; PB-04 propone `PATCH` y `?pagina=&tamanoPagina=`.
- **Opciones:** (a) `PATCH` y `tamano` (default de B-25); (b) la forma de B14 §9; (c) la forma de PB-04 literal.
- **Default recomendado:** (a) y ajustar B14 §9 y PB-04 (doc PR). Mock de T-32 con la misma forma.
- **Costo de equivocarse:** (b) y (c) cambian el mock y la función de T-32; no cambian oleadas.

### RV-D31. Harness de contract tests en las API cards (FC5)
- **Fichas:** T-23 §16, T-24..T-32 (FC5 los obliga a usar el harness).
- **INDEX hoy:** fila 69 (T-23) dice que es Ola 2; las API cards no la declaran.
- **Conflicto:** FC5 exige el harness, pero declarar T-23 en las nueve API cards las sube a Ola 3 (costo medido: **+20 tareas**, incluidas B-17, B-19, T-21, W-01..W-08).
- **Opciones:** (a) declarar T-23 en las API cards (cascada); (b) cada API card agrega su `<dominio>.contract.test.ts` al rebasar sobre T-23 (sin dependencia declarada); (c) relajar FC5 para API cards.
- **Default recomendado:** (b). Sin cambio de ola. Registrar la regla en FC5.
- **Costo de equivocarse:** (a) cascada de 20 tareas. (b) el orden de merge de T-23 queda por convención; si T-23 se mergea tarde, las API cards pueden mergearse sin contract tests.

---

## 4. Ítems sin acción (verificados)

- **B-01 §16 #5 (T-16 implícita):** correcto, "Puede empezar sin esperar a T-16".
- **B-05 §16 (T-10 omitida en INDEX):** ya está en la fila 83. Observación desactualizada.
- **T-14 §16 y T-01 §16 ("router.tsx" en §5 de otras fichas):** no es conflicto; las fichas lo listan como "sin editar" (B-09 línea 66, B-13 línea 69, W-01 línea 66, B-10 línea 72 y 91).
- **T-26 `POST /api/externo/cotizaciones`:** no está en la matriz; correcto ("PR #57, no lo consume el front").
- **T-29 `POST /api/pagos/{id}/conciliar`:** no está en la matriz; correcto (fuera de alcance del front, contrato §10.4).
- **B-19 `POST /api/polizas/por-numero/{numero}`:** solo es alternativa de B11 §9; no hay conflicto.
- **T-11 y T-19 declarados en pantallas B y W:** costo 0 cambios de ola (sección 5); es MECANICO por FC5/FC8 (RV-04).

---

## 5. Costos medidos (cambios de ola, marginales sobre el escenario B)

Escenario B = RV-04 + RV-D03 default (b) + T-14 +T-03. Único cambio respecto del INDEX: **T-25 de Ola 2 a Ola 3**.

| Decisión | Cambios marginales vs B |
|---|---|
| RV-D03 (a): T-14 depende de T-11 | 30 |
| RV-D31 (a): T-23 en las nueve API cards | 20 |
| RV-04 convención: T-11 y T-19 en todas las pantallas B y W | 0 |
| RV-D07 (b): T-10 depende de T-05 | 1 (T-10 a Ola 2) |
| RV-D09 (a): T-31 depende de T-29 y T-30 | 8 (incluye T-21) |
| RV-D10 (a): B-18 depende de B-16 | 1 (B-18 a Ola 7) |
| RV-D10 (b'): B-16 depende de B-17 | 0 |
| RV-D04 (a): B-01 depende de T-32 | 0 |
| RV-D04 (b): T-12 depende de T-08 | 24 |
| RV-D02 (b): T-02, T-03, T-08, T-09, T-19, T-20 dependen de T-01/T-02 | 47 |
| RV-D08 (b): T-08 depende de T-12 | 54 |
| RV-D03 (b) con owners B-01 y W-06 (+T-11) | 0 |
| T-21 con deps corregidas (RV-05) | 0 |

---

## 6. Plan de correcciones (ejecutable; aplica los defaults)

Orden: primero el orquestador confirma o cambia las DECISION (defaults abajo); después un agente ejecuta los pasos en orden. Cada paso dice el archivo y el cambio literal.

### Paso 1. `tareas/INDEX.md`: tabla "Tabla índice" (líneas 47–111)

1. Fila 47 (T-01): en "Alcance" agregar al final la lista de RV-24 (paquetes). En "Depende de" dejar "—".
2. Fila 48 (T-02): "Depende de": "— (rebase sobre T-01, RV-D02)".
3. Fila 49 (T-03): igual que 48.
4. Fila 54 (T-08): "Alcance": agregar "respuesta cruda (status, Content-Type, texto) para base positiva; `POST` sin reintento". "Depende de": "— (rebase sobre T-01)". Agregar T-08 como colaborador del barrel (RV-14).
5. Fila 55 (T-09): "Alcance": agregar "parseo `parseImporteEsAR`". "Depende de": "— (rebase sobre T-01, RV-D02)".
6. Fila 56 (T-10): sin cambio de deps. Agregar a "Alcance": "`EstadoBadgeValue` en `@nexa/api`; `BADGE_ESTADOS` lo define T-05 (RV-D07)".
7. Fila 58 (T-12): "Alcance": agregar "tipos de `/api/auth/*` (tipos, no funciones; las funciones de `/api/auth/*` las escribe T-32, RV-D04)".
8. Fila 59 (T-13): "Alcance": agregar "selector `emailSesion`". Sin cambio de deps.
9. Fila 60 (T-14): "Depende de": "T-02, T-03, T-08". Agregar a "Alcance": "bootstrap de mocks lo agregan B-01 y W-06 (RV-D03)".
10. Fila 61 (T-15): "Depende de": "T-03, T-05, T-07".
11. Fila 62 (T-16): "Depende de": "T-05, T-07, T-13, T-14, T-15, T-19". "Shell": `@nexa/ui` (RV-D06).
12. Fila 63 (T-17): "Depende de": "T-02, T-03, T-08". Agregar "stub de `PublicLayout` (dueña T-18)".
13. Fila 64 (T-18): agregar "PublicNav y PublicFooter" al alcance (RV-09).
14. Fila 65 (T-19): "Depende de": "T-04, T-05, T-06, T-07 (primer uso)". Destino de pedidos: `design-system.md §9` (RV-D25).
15. Fila 66 (T-20): sin deps nuevas. Agregar a "Alcance": "`frontend/docker/nginx.conf` (propio)". Hosting: RV-D19 (c).
16. Fila 67 (T-21): "Depende de": "US-FE-B-01, US-FE-B-03, US-FE-T-11, US-FE-T-31, US-FE-W-03, US-FE-W-04" (RV-05).
17. Fila 68 (T-22): "Depende de": "T-01, T-11, T-14, T-17, T-20".
18. Fila 69 (T-23): "Depende de": "T-08, T-11, T-12". Alcance: "harness; cada API card agrega su `<dominio>.contract.test.ts` al rebasar (RV-D31)".
19. Fila 71 (T-25): "Depende de": "T-08, T-11, T-12, T-23, T-24" (T-25 queda en Ola 3).
20. Fila 72 (T-26): "Alcance": agregar "PUT y DELETE de vehículos fuera de alcance (sin pantalla, RV-29)".
21. Fila 73 (T-27): "Alcance": agregar "`incluirInactivos` y `PATCH activo` solo en MSW (RV-D29)".
22. Fila 74 (T-28): sin cambio de deps. Alcance: agregar "handler de cuotas (`handlers/cuotas.ts`, RV-13)".
23. Fila 75 (T-29): sin cambio de deps.
24. Fila 76 (T-30): "Alcance": agregar "función que expone la respuesta cruda para la base positiva (RV-18)".
25. Fila 77 (T-31): "Alcance": agregar "export de `pagoFacilKeys`" (RV-28). Copiar `FacturaResponse` y `CuponPagoFacilResponse` en `dto/publico.ts` (RV-D09 b).
26. Fila 78 (T-32): "Alcance": agregar "`loginRequest` en `packages/api/src/auth/login.ts` (RV-D04)". Sin cambio de deps.
27. Fila 79 (B-01): "Depende de": "T-04, T-05, T-07, T-11, T-12, T-13, T-14, T-32". Texto: "401 con 'Email o contraseña incorrectos.' en el formulario (RV-D01)". Agregar "bootstrap de mocks en `main.tsx` (RV-D03)". `LayoutAcceso` en `features/auth/components/` (RV-08).
28. Fila 80 (B-02): "Depende de": "T-07, T-13, T-16, T-28, T-32". Endpoints: agregar `GET /api/cuotas` (mock, T-28). KPI 4 y donut: B-02 (RV-36).
29. Fila 81 (B-03): "Depende de": "B-02, T-05, T-06, T-09, T-10, T-11, T-28, T-30". Promo en `features/inicio` (RV-37).
30. Fila 82 (B-04): "Depende de": "T-04, T-05, T-06, T-09, T-11, T-16, T-19, T-24". Alcance: agregar "muestra `location.state.aviso`" (RV-41); título y acción en slot de T-16 (RV-42).
31. Fila 83 (B-05): "Puede empezar": "merge antes que US-FE-B-07 (routes.tsx)" (RV-39). Alcance: producir `location.state.aviso` (RV-41).
32. Fila 84 (B-06): quitar `POST .../validar-renaper` del endpoint (RV-38). "Depende de": sin cambio; agregar "T-07" si no está (ya está).
33. Fila 85 (B-07): "Depende de": "B-04, T-06, T-07, T-09, T-10, T-11, T-16, T-24, T-26, T-28". Pestañas: "Datos" y "Vehículos" más "Pólizas" como sección (D-17, RV-35).
34. Fila 86 (B-08): "Depende de": "B-05, B-07, T-04, T-05, T-07, T-10, T-24, T-25". Endpoint: agregar `POST /api/clientes/{id}/validar-renaper` (RV-38). Aviso `aviso` (RV-41).
35. Fila 87 (B-09): "Depende de": "T-04, T-05, T-07, T-08, T-10, T-12, T-13, T-14, T-16, T-24, T-26" (RV-63).
36. Fila 88 (B-10): reemplazar "lista de opciones con `GET /api/planes`" por "lista de opciones con `POST /api/cotizaciones`; `GET /api/planes` solo para la descripción" (RV-33). "Depende de": "T-05, T-06, T-08, T-09, T-13, T-16, T-24, T-26, T-27".
37. Fila 89 (B-11): quitar "CTA 'Emitir'..." del alcance (RV-34). "Depende de": "B-10, T-07, T-09, T-10, T-26".
38. Fila 90 (B-12): "Depende de": "B-13, T-04, T-05, T-06, T-07, T-08, T-09, T-10, T-13, T-16, T-24, T-26, T-27, T-28" (RV-65).
39. Fila 91 (B-13): quitar `GET /api/vehiculos/{id}` y `GET /api/planes` de endpoints (RV-31). "Depende de": "T-04, T-05, T-06, T-09, T-10, T-13, T-16, T-28" (sin T-26 ni T-27 hasta PB-06).
40. Fila 92 (B-14): alcance: "búsqueda por número y DNI detrás de la constante `BUSQUEDA_NUMERO_DNI_DISPONIBLE = false` hasta PB-06 (RV-43)". "Depende de": "B-13, T-04, T-05, T-24, T-28".
41. Fila 93 (B-15): quitar `GET /api/polizas/{id}/cuotas` de endpoints (RV-32). "Depende de": "B-13, T-05, T-06, T-09, T-10, T-16, T-24, T-26, T-28".
42. Fila 94 (B-16): "Depende de": "B-15, B-17, T-05, T-07, T-08, T-09, T-10, T-28, T-30". Alcance: fila de acciones con `CobrarVencidasButton` de B-17 (RV-D10 b').
43. Fila 95 (B-17): "Depende de": "T-04, T-05, T-07, T-09, T-10, T-28, T-29". Alcance: exportar `CobrarVencidasButton` (RV-D10). Invalidación de `polizasKeys` (RV-27).
44. Fila 96 (B-18): "Depende de": "B-15, B-17, T-29". Alcance: reutilizar `CobrarVencidasButton`; sin cambio de ola (RV-D10 b').
45. Fila 97 (B-19): sin cambio de deps; filtro de número oculto hasta PB-06 (RV-D29).
46. Fila 98 (B-20): "Depende de": "T-07, T-08, T-10, T-16, T-30". Alcance: aviso de duplicado en `RendicionCard`; invalidar `pagoFacilKeys.rendiciones` (RV-11, RV-12).
47. Fila 99 (B-21): "Depende de": "B-20, T-30". Alcance: bloque de tabla debajo del aviso en `RendicionCard` (RV-11).
48. Fila 100 (B-22): "Depende de": "T-04, T-05, T-06, T-09, T-13, T-16, T-27". (Textarea local, sin cambio.)
49. Fila 101 (B-23): "Depende de": "B-22, T-07, T-09, T-27". Diálogo de T-07 (RV-D05).
50. Fila 102 (B-24): "Depende de": "T-04, T-05, T-10, T-13, T-16, T-32". Sin cambio.
51. Fila 103 (B-25): "Depende de": "B-24, T-06, T-07, T-32". (RV-61.)
52. Fila 104 (W-01): alcance: "sin enlace a W5 hasta DN-W1-1 (RV-D21)". "Depende de": "T-18, W-02" + "T-05, T-07" (RV-04).
53. Fila 105 (W-02): "Depende de": "T-05, T-06, T-07, T-09, T-17, T-27".
54. Fila 106 (W-03): "Alcance": tipos de `location.state` para W3 a W5 (no W6) (RV-45). Texto 404 según RV-D01 (texto del Figma).
55. Fila 107 (W-04): "Depende de": "T-05, T-06, T-07, T-09, T-18, W-03". Alcance: `shared/formato/listaCuotas.ts` y `shared/hooks/useMediaQuery.ts` (RV-47). `useSeleccionCuotas` en `components/` salvo que se apruebe RV-D26.
56. Fila 108 (W-05): "Depende de": "T-09, T-18, W-04".
57. Fila 109 (W-06): alcance: agregar "opción Pago Fácil (navega a W-07 por ruta, sin dependencia)" (RV-46). "Depende de": "T-04, T-05, T-07, T-09, T-11, T-18, T-31, W-03". T-11 para el bootstrap de mocks (RV-D03).
58. Fila 110 (W-07): "Depende de": "T-05, T-07, T-09, T-18, T-31, W-03, W-04" (W-04 solo para `shared`). Alcance: `pagoFacilKeys` ya lo exporta T-31 (RV-28).
59. Fila 111 (W-08): "Depende de": "T-07, T-09, T-18, T-31, W-06". Texto DB-W8-1 según RV-D17 (a).

### Paso 2. `tareas/INDEX.md`: "Oleadas" (líneas 119–125) y "Camino más largo" (129)

Recalcular con el script tras el paso 1. Esperado: Ola 2 = 14 tareas (sale T-25), Ola 3 = 7 (entra T-25). Ningún otro cambio de ola.

### Paso 3. `tareas/INDEX.md`: "Ownership" (líneas 228–256)

1. Fila 230: `frontend/package.json` y `package.json` de workspace → T-01. Agregar `frontend/eslint.config.js`, `frontend/.nvmrc`, `frontend/.gitignore`, `frontend/docker/nginx.conf` → T-01 (los tres primeros), T-20 (nginx) (RV-07 a).
2. Fila 231: `packages/config/**` → T-02 (incluye `tsconfig.base.json`, `tsconfig.react.json`, `vitest/*`, `test/*`). `packages/*/vitest.config.ts` y `apps/*/vitest.config.ts` → T-02 (RV-07 d).
3. Fila 232: `packages/config/tailwind/*` y `packages/ui/src/tokens.css` → T-03. `apps/*/tailwind.config.*` y `apps/*/postcss.config.*` → T-14 (backoffice) y T-17 (web) (RV-23).
4. Fila 234: agregar `packages/ui/src/components/PublicNav/` y `PublicFooter/` → T-18 (RV-09). `EstadoBadge/` → T-05 (RV-07 k).
5. Fila 235: `packages/api/src/index.ts` → T-12; T-08 agrega bloque (RV-14).
6. Fila 236: `dto/comunes.ts`, `dto/auth.ts` → T-12 (sin cambio).
7. Fila 237: `dto/<dominio>.ts` → API card del dominio; clientes: T-24 crea, T-25 agrega bloque (RV-15). `dto/usuarios.ts` → T-32 (T-12 DP-1 ya acepta el INDEX).
8. Fila 238: `packages/api/src/client/*` → T-08 (sin cambio).
9. Fila 240: `packages/api/src/enums/*` y `messages/*` → T-10; `EstadoBadgeValue` en `enums/badges.ts` (RV-22).
10. Fila 241: `packages/api/mocks/server.ts`, `browser.ts`, `handlers/index.ts`, `fixtures/comunes.ts` → T-11. Agregar `public/mockServiceWorker.js` → T-14 y T-17 (RV-07 f).
11. Fila 242: `packages/api/mocks/handlers/<dominio>.ts` → API card del dominio; `handlers/cuotas.ts` → T-28; `handlers/inicio.ts` → B-03 (llena el placeholder de T-11) (RV-13).
12. Fila 243: `packages/api/test/contract/*` → T-23 (harness); `<dominio>.contract.test.ts` → cada API card (RV-21, RV-D31).
13. Fila 244: `apps/backoffice/vite.config.ts`, `.env.example`, `src/app/router.tsx`, `src/app/providers.tsx`, `src/main.tsx`, `src/index.html`, `src/index.css`, `src/vite-env.d.ts`, `tsconfig.json` → T-14 (stubs de T-01 no se crean; los crea T-14) (RV-07 b, RV-16).
14. Fila 245: lo mismo para `apps/web-publica` → T-17 (RV-07 b).
15. Fila 246: sin cambio (routes.tsx por feature).
16. Fila 248: `apps/backoffice/src/features/auth/` → T-13 (store), B-01 (`pages/LoginPage.tsx`, `schemas/`, `components/LayoutAcceso.tsx`) (RV-08).
17. Fila 249: `apps/backoffice/src/app/guards/*` → T-13 (T-14 deja stubs) (RV-16).
18. Fila 250: `apps/backoffice/src/app/layouts/*` → T-16 (T-14 deja stubs) (RV-07 b).
19. Fila 251: `apps/web-publica/src/app/layouts/PublicLayout.tsx` → T-18 (stub de T-17) (RV-17).
20. Fila 252: `apps/*/src/shared/formato/listaCuotas.ts`, `shared/hooks/useMediaQuery.ts` → W-04 (RV-47). Resto de `shared/*`: quien lo necesite primero.
21. Fila 253: `frontend/docker-compose.yml`, `frontend/Dockerfile*`, `frontend/docker/nginx.conf` → T-20 (sin cambio más nginx).
22. Fila 256: `apps/backoffice/src/features/cuotas/*` → B-03 (sin cambio). `packages/api/mocks/handlers/inicio.ts` → B-03 (RV-13).
23. Agregar filas: `packages/api/mocks/fixtures/<dominio>.ts` → API card del dominio (T-24 para clientes). `packages/ui/src/testing/*` → T-19 (RV-20). `frontend/e2e/*` y `frontend/playwright.config.ts` → T-21 (RV-07 i). `apps/backoffice/src/features/clientes/schemas/provincias.ts` → B-05 (RV-10). `packages/api/src/auth/login.ts` → T-32 (RV-D04). `packages/api/src/endpoints/<dominio>.ts` → API card del dominio (FC2).

### Paso 4. `tareas/INDEX.md`: "Decisiones pendientes" (líneas 264–298)

Agregar D-34..D-42 (RV-68 y RV-D29..RV-D31). Para las DECISION de la sección 3, registrar el default aplicado en su fila o en el nuevo ítem. Corregir D-07 (línea 272) con la nota: "El seed no coincide con el Figma (RC 12.000 vs 10.000; TR 30.000 vs 27.500)" (RV-D22).

### Paso 5. `tareas/INDEX.md`: "Convenciones comunes" (líneas 19–37)

1. FC2 (línea 22): agregar "auth: T-12 tipos, T-32 funciones de `/api/auth/*`; `inicio` sin API card hasta PB-08 (excepción, RV-D16)".
2. FC3 (línea 23): agregar "Un filtro que el back real ignora no se activa con el flag: se oculta con constante hasta el PB (RV-D29)".
3. FC5 (línea 25): agregar "API cards: contract test al rebasar sobre T-23 (RV-D31)".
4. FC8 (línea 28): agregar "Los primitivos usan `vitest-axe` directo; T-19 es el helper de pantallas (RV-49)".
5. FC10 (línea 30): agregar "Excepción: marcar el campo DNI con 404 por `codigo` (T-25, RV-D23)".
6. FC12 (línea 32): sin cambio (RV-D17 a).
7. Encabezado de "Oleadas" (línea 117): agregar "Ola 0 rebasa sobre T-01 (y T-02 para T-02…T-03) sin contar como dependencia (RV-D02)".

### Paso 6. Fichas `tareas/US-FE-*.md`

1. §3 "Depende de" de cada tarea: copiar la fila final del INDEX (paso 1) (RV-01).
2. §5 de T-23: quitar `packages/api/package.json` (FC17). §5 de T-19: quitar `packages/ui/package.json` (FC17). §5 de T-01: agregar stubs de `packages/config/tsconfig.base.json` y `tsconfig.react.json` como stub, reemplazados por T-02 (RV-07 c).
3. D-API-1 de T-25..T-32: "FC2 manda" (RV-44).
4. B-01 §4: `LayoutAcceso` en `features/auth/components/` (RV-08). B-01 §5: agregar `loginRequest` como importe de T-32 (RV-D04). B-01 §13: texto de error del Figma (RV-D01).
5. B-02 §13/§16: KPI 4 y donut son de B-02; endpoint `GET /api/cuotas` (RV-36).
6. B-04, B-05, B-08: clave `aviso` (RV-41).
7. B-08 §5 y §7: endpoint `POST .../validar-renaper` (RV-38).
8. B-17 y B-18: `CobrarVencidasButton` en B-17 (RV-D10 b'). B-17: invalidación de `polizasKeys` en el hook (RV-27).
9. B-20 y B-21: `RendicionCard.tsx` y `PagoFacilPage.tsx` (RV-11, RV-12).
10. T-08 §5: colaborador de `packages/api/src/index.ts` (RV-14). T-08 §7: respuesta cruda (RV-18). T-30: función de respuesta cruda (RV-18).
11. T-13 §5: selector `emailSesion` (RV-19).
12. T-31 §5: `pagoFacilKeys` (RV-28); tipos copiados (RV-D09 b).
13. T-19 §5: `packages/ui/src/testing/*` (RV-20). Quitar `packages/ui/package.json`.
14. T-23 §5: quitar `packages/api/package.json` (RV-21). Dependencias: `zod` y `cross-env` las agrega T-01 (RV-24).
15. T-24 §5: `packages/api/mocks/fixtures/clientes.ts` (RV-07 f).
16. T-25 §3: deps T-23 y T-24 (RV-04).
17. W-04 §5: `shared/hooks/useMediaQuery.ts` (RV-07 e).
18. W-06 §3: T-11 (RV-D03 b).

### Paso 7. Documentos fuera de `tareas/` (doc PR aparte)

1. `design-system.md` §1.2 (ruta de `tokens.css` → `packages/ui/src/tokens.css`) y §2.1 (Google Fonts → `@fontsource`, FB7.2) (RV-60).
2. `pantallas/B3-clientes.md` D-10 (DNI en `@nexa/api`) (RV-59).
3. `pantallas/B1-login.md` §4 (`LayoutAcceso` en features/auth) (RV-08).
4. `pantallas/W3-mi-poliza.md` §8 (incluir `consulta` hacia W4 y W5) (RV-45).
5. `pantallas/B14-usuarios.md` §9 y `pedidos-al-back.md` PB-04 (`PATCH` y `tamano`, RV-D30).
6. `pedidos-al-back.md`: PB-05 (forma de pagos, RV-D13); PB-09 (`incluirInactivos` silencioso, RV-30); PB-01 (DNI, RV-D17).
7. `00-decisiones-base.md`: FB1 (paquetes: `cross-env`, `jsx-a11y`, Playwright, RV-24); FB3 (`hooks/`, RV-D26); FB7.6 (texto de UI, RV-D01); FC2 y FC3 se amplían en el INDEX (paso 5), no en FB.

### Paso 8. Verificación

Volver a correr el script sobre INDEX y fichas. Esperado: (a) 0 desalineaciones (INDEX ↔ §3); (b) 0 ciclos; (c) columna = cálculo y Oleadas = columna; Ola 2 = 14, Ola 3 = 7; (d) solo `GET /api/inicio/resumen` sin API card (excepción RV-D16); (e) fuera de `features/`, 0 rutas sin fila y 0 con dos dueños no declarados; (f) 20/20; (g) un solo texto de login y un solo texto de CAE.

---

## 7. Conteo

- **MECANICO:** 61 ítems en las tablas de la sección 2 (los IDs que faltan se eliminaron por no tener acción).
- **DECISION:** 31 ítems (RV-D01 a RV-D31).
- **Sin acción:** sección 4.
- **Checks:** (a) 26 + 2 desalineaciones; (b) 0 ciclos; (c) 65/65; (d) 1 endpoint sin API card (`GET /api/inicio/resumen`); (e) 88 rutas fuera de `features/` sin fila, revisadas; (f) 20/20; (g) 2 textos en conflicto y 1 tema de totales.

## Observaciones ABIERTAS consolidadas (triage final)

Las observaciones cerradas ya figuran como `Resuelto (triage final...)` en la sección 16 de cada ficha. Quedan `ABIERTO` solo las de esta tabla: preguntas de producto, diseño o back. El default se aplica mientras no haya respuesta.

| Ficha | Pregunta | Default | Tipo |
|---|---|---|---|
| T-02 | FB3 regla 2: ¿`components/` puede importar de `api/`? | No (solo la restricción explícita, D-T02-2). Si se permite, se afloja en T-02 | Equipo (afecta el lint de todas las features) |
| B-18 | ¿"Deuda vencida" se suma en el front (importe + recargo) o lo trae el back? | Sumar en el front con T-09 | Producto / back |
| T-31 / W-07 | Campo `totalCuotas` en el cupón público | Mock opcional (D-31-4) | PB-02 |
| W-08 | Subtítulo "Pagaste las cuotas…" depende de datos que el back no expone | Texto genérico hasta PB-01 | PB-01 |
| W-08 | URL de retorno de la pasarela sin `numeroPago` | Coordinar config por entorno con el back | PB-01 / infraestructura |
| B-16 | Cupón de póliza Vencida | Degradado del INDEX | PB-30 |
| B-04 / B-08 / B-14 | Campos de `ClienteResumenResponse`, cuerpo de `PUT` y DNI | Los de PB-03 (mock de T-24) | PB-03 |
| B-11 | `calculo` en el DTO de cotización | Tipo local si T-26 no lo agrega | PB-10 |
| B-07 | Límite de 100 pólizas; N+1 de próxima cuota | Aceptar el límite; una query por póliza activa | Back (pedir `proximoVencimiento`) |
| B-03 | La promo no depende de PB-08 (sale del historial de rendiciones); el INDEX mantiene PB-08 como bloqueo | Mantener el bloqueo del INDEX (MSW) | Equipo |
| T-26 | Sin dependencia de T-10 para la función; confirmar con su dueño | Sin dependencia | Equipo |
| T-30 | `handlers/index.ts` (T-11) debe aceptar respuestas no JSON (handlers de texto plano) | T-11 lo soporta; si no, T-30 lo agrega | Equipo |
| W-02 | El router de T-17 acepta un módulo de rutas vacío | Confirmar con el dueño de T-17 | Equipo |
| W-05 | Pie móvil | `PublicFooter` | Diseño |
| T-03 | Licencia de fuentes | SIL OFL (design-system §2.1) | Diseño |

Las decisiones `[CONFIRMAR]` de producto (RV-D01, D11, D17, D18, D19, D22) siguen en `00-decisiones-base.md` FB8 y no se repiten acá.
