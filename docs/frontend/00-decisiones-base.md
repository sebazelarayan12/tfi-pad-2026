# Frontend: decisiones base (fuente de verdad)

Todo el análisis y las tareas del front se alinean a este documento. Si algo de acá choca con otro `.md` de `docs/frontend/`, **manda este**. Los defaults se pueden cambiar en la reunión del equipo; si cambian, se edita acá y se avisa en el PR.

## FB1. Stack (defaults)

| Tema | Decisión |
|------|----------|
| Lenguaje | **TypeScript** con `strict: true`. Prohibido `any` explícito (usar `unknown` y validar). |
| Runtime / gestor | Node 20 LTS, **npm workspaces** (sin pnpm/yarn). |
| Build | Vite + React 18. |
| Router | React Router v6 (`createBrowserRouter`). |
| Datos del servidor | TanStack Query v5. Nada de `fetch` suelto en componentes. |
| Formularios | react-hook-form + **zod** (el esquema zod es la fuente del tipo del formulario). |
| Estilos | Tailwind CSS 3.4 con los tokens de Figma en un preset compartido. Sin estilos inline para valores del diseño. |
| Tests | Vitest + Testing Library + MSW (mock de la API) + `vitest-axe`. `cross-env` para los scripts. E2E con Playwright solo en T-21, fuera de CI (RV-D28). Un test por regla de UI relevante. |
| Calidad | ESLint + Prettier + `eslint-plugin-boundaries` (hace cumplir la arquitectura, ver FB3) + `eslint-plugin-jsx-a11y` (RV-24). |
| CI | Se agrega un check `frontend` (install, lint, typecheck, test, build) sin tocar los checks del back. |

## FB2. Monorepo

```
frontend/
  apps/
    backoffice/        # empleados y admin (JWT)
    web-publica/       # clientes, sin login (/api/publico/*)
  packages/
    ui/                # design system: tokens, primitivos (Button, Input, Select, Badge, Chip, Table, Card, NavItem...)
    api/               # cliente HTTP base, manejo de errores (ProblemDetails), tipos de DTO
    config/            # tsconfig, eslint y preset de Tailwind compartidos
```

Paquetes con alias `@nexa/ui`, `@nexa/api`, `@nexa/config`. Ninguna app importa de la otra.

## FB3. Arquitectura Screaming (por dominio, no por tipo de archivo)

La carpeta `src/` de cada app **grita el negocio**: se abre y se ve "polizas, clientes, cotizaciones, pagos", no "components, hooks, utils".

```
src/
  app/                 # providers, router, layouts (shell), guards de ruta. Sin lógica de negocio.
  features/
    <dominio>/         # ej: polizas, clientes, vehiculos, cotizaciones, pagos, facturas, pago-facil, planes, usuarios, auth
      api/             # llamadas HTTP + hooks de TanStack Query del dominio
      components/      # componentes del dominio
      hooks/           # hooks de UI del dominio, sin TanStack Query (RV-D26)
      pages/           # una página por ruta; delgada: compone, no calcula
      schemas/         # zod
      types/           # tipos propios (los DTO compartidos viven en @nexa/api)
      index.ts         # API pública del feature: lo único que otros pueden importar
  shared/              # solo lo agnóstico de dominio y propio de la app (ej: hooks genéricos)
```

Reglas (las verifica `eslint-plugin-boundaries`):
1. Un feature **solo** importa de otro feature a través de su `index.ts`, nunca de sus carpetas internas.
2. `pages/` puede importar de `components/`, `api/`, `schemas/`; nunca al revés.
3. `shared/` y `@nexa/ui` no conocen ningún feature.
4. `app/` compone features; los features no importan de `app/`.
5. Nombres de feature = términos del dominio del back, en español (`polizas`, `cuotas`, `cotizaciones`). Identificadores técnicos en inglés (`useQuery`, `Provider`). Los campos de DTO se usan **tal cual los devuelve la API**, sin renombrar.

## FB4. Convenciones de contrato con el back

- La fuente de verdad del contrato es el **código del back** (`backend/Aseguradora.Api/Controllers`, `backend/Aseguradora.Application/Dtos`) y, para lo aún no implementado, `docs/AnalisisBack.md` §7 y `docs/tareas-divididas.md`.
- Todo endpoint documentado lleva un estado: **Implementado** (existe en `development`), **En PR** (número de PR) o **Especificado** (solo en spec/tareas). El front no arranca una pantalla contra un endpoint "Especificado" sin mock: se trabaja con MSW hasta que el back lo publique.
- Errores: se consumen con el formato `ProblemDetails` que arma `ExceptionMiddleware`. El detalle exacto está en `contratos-api/convenciones-transversales.md`.
- Plata, fechas, enums y estados: un solo formateador en `@nexa/ui` o `@nexa/api`. Nadie formatea a mano.

## FB5. Documentación y tareas

- Idioma de los `.md` y de los textos de UI: **español neutro** (los textos de UI vienen del Figma, tal cual).
- IDs de tarea: `US-FE-T-NN` (transversal), `US-FE-B-NN` (backoffice), `US-FE-W-NN` (web pública). Rama: `feature/US-FE-B-03-nombre-descriptivo`.
- Una tarea = un archivo en `docs/frontend/tareas/<ID>.md`. El índice corto está en `docs/frontend/tareas/INDEX.md`. Una IA que toma una tarea lee **solo** su archivo y los documentos que ese archivo enlaza.
- Una tarea está lista solo cuando se cumplen todos sus criterios de aceptación (workflow, regla de calidad general).

## FB6. Mapa de documentos

| Documento | Contenido |
|-----------|-----------|
| `00-decisiones-base.md` | Este archivo. |
| `analisis-front.md` | Visión, rutas, mapa pantalla ↔ endpoint, flujos, riesgos. |
| `design-system.md` | Tokens y componentes del Figma. |
| `pantallas/<ID>.md` | Una pantalla del Figma (W1..W6, B1..B14). |
| `contratos-api/*.md` | Endpoints, DTOs como tipos TypeScript, errores, estado de cada endpoint. |
| `pedidos-al-back.md` | Huecos del back detectados (endpoints que faltan, bugs, inconsistencias) para pasar al equipo del back. |
| `tareas/INDEX.md` y `tareas/<ID>.md` | Índice y detalle de cada tarea. |

Figma: https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros (páginas: `00 Fundamentos`, `01 Web publica`, `02 Backoffice`).

## FB7. Decisiones derivadas del análisis (defaults, salieron de leer el back y el Figma)

1. **Íconos:** Phosphor (`@phosphor-icons/react`), no lucide: los nombres de capa del Figma son de Phosphor.
2. **Fuentes:** Plus Jakarta Sans y JetBrains Mono, instaladas con `@fontsource/*` (local, sin CDN).
3. **Enums:** el back los serializa como **número** (no hay `JsonStringEnumConverter` global) salvo `PagoResponse` y `FacturaResponse`, que mandan string en mayúsculas. `@nexa/api` define un mapa por enum (valor del back → literal TS → etiqueta de UI → variante de Badge). Ningún componente usa números crudos. Pedir al back un converter global es un "pedido al back" y no bloquea.
4. **Fechas:** un `DateTime` sin `Z` se interpreta como UTC; un `DateOnly` se parsea sin zona. Un único formateador, zona `America/Argentina/Buenos_Aires`.
5. **Sesión (backoffice):** JWT en memoria y `sessionStorage` (nunca `localStorage`). No hay refresh: con 401 o al vencer `exp` se cierra la sesión y se redirige a `/login`.
6. **Errores del back:** muchos 400 de negocio no traen código estable, solo `detail`. La UI muestra `detail` solo en errores de negocio sin texto propio (RV-D01): el login y el 404 de W-03 muestran el texto del Figma. Marca un campo solo cuando llega `errors` por campo. Los mensajes en inglés de ASP.NET se traducen en una capa de mapeo de `@nexa/api`.
7. **Endpoints que no existen o están en PR:** se trabaja contra MSW (`frontend/packages/api/mocks`), activable con `VITE_USE_MOCKS=true`. Cada tarea bloqueada lista qué endpoints mockea y cuál es el contrato mínimo que espera.
8. **Accesibilidad:** hay tokens que no cumplen contraste AA (texto terciario, badge Suspendida, borde de input). Se implementan como están en el Figma y se registran como pedido a diseño; nadie cambia colores por su cuenta.
9. **Mutaciones sensibles** (`POST /api/cotizaciones` persiste una cotización por plan en cada llamada; pagos): se deshabilita el botón mientras corre, `retry: 0` en toda mutación, y nunca se dispara en el montaje de una pantalla.
10. **Sidebar por rol:** `Planes` y `Usuarios` solo los ve el Admin, aunque el Figma del Empleado los muestre.
11. **Pantallas con datos que el back no devuelve:** la pantalla se construye con el dato como opcional y un estado "no disponible"; el hueco queda en `pedidos-al-back.md`. No se inventan campos.

## FB8. Resolución de las decisiones de `tareas/REVISION.md` (2026-11-01)

Se aplican los defaults recomendados de `REVISION.md` salvo lo marcado. Las filas **[CONFIRMAR]** son de producto, seguridad o infraestructura: se aplican igual para no bloquear, pero el equipo debe confirmarlas antes de que arranque la tarea afectada.

| ID | Resolución |
|----|------------|
| RV-D01 | Texto del Figma en alertas de login y 404 de W-03 (FB5 manda); `detail` del back solo en errores de negocio sin texto propio. Se acota FB7.6. **[CONFIRMAR con diseño]** |
| RV-D02 | T-01 y T-02 son prerrequisitos de rebase y no cuentan para la oleada (convención escrita en "Oleadas"). |
| RV-D03 | T-14 no arranca MSW; el bootstrap lo agregan B-01 (backoffice) y W-06 (web) y declaran T-11. T-14 declara T-03. |
| RV-D04 | T-32 escribe `loginRequest` en `packages/api/src/auth/login.ts`; B-01 declara T-32. FC2: "auth: T-12 tipos, T-32 funciones de `/api/auth/*`". |
| RV-D05 | T-07 agrega `Dialogo` a `@nexa/ui`; B-05, B-08 y B-23 lo importan de ahí. |
| RV-D06 | `Shell` vive en `@nexa/ui` (T-07); T-16 y T-18 lo importan. |
| RV-D07 | T-10 es dueña de `EstadoBadgeValue` en `@nexa/api`; T-05 define su propia unión de 9 literales y una prueba compara ambas. |
| RV-D08 | T-08 valida la forma wire de `ProblemDetails` con guardas sobre `unknown`; no depende de T-12. |
| RV-D09 | T-31 copia `FacturaResponse` y `CuponPagoFacilResponse` en `dto/publico.ts`; T-23 valida la forma. |
| RV-D10 | B-17 exporta `CobrarVencidasButton`; B-16 lo coloca en la fila de acciones y declara B-17; B-18 lo reutiliza. |
| RV-D11 | **[CONFIRMAR producto antes de B-18]** El widget cobra todas las vencidas con un clic y resumen visible; la selección por cuota queda en B11 (B-19). |
| RV-D12 | "Emitir póliza" de B-13 lleva a `/clientes`. |
| RV-D13 | `PagoResponse[]` con `factura` para el widget (B-18) y la forma de B11 §9 para B-19. Corregir PB-05. |
| RV-D14 | No se suma en el front: se muestra el importe del back (`PagoResponse.importe`). |
| RV-D15 | Badge "Pendiente CAE"; texto de celda "Pendiente de CAE", hasta que diseño confirme. |
| RV-D16 | La request de `GET /api/inicio/resumen` vive en `features/inicio/` como excepción documentada a FC2, hasta que PB-08 se publique. |
| RV-D17 | **Decidido por Martin (2026-11-12): `numeroPago` + `dni`.** `POST /api/publico/pagos/estado` (PB-01, resuelto) y `POST /api/publico/factura` piden los dos. El DNI viaja en `location.state` y, si no está (recarga o vuelta desde la pasarela), la pantalla lo pide. Prohibido guardar el DNI en storage o ponerlo en la URL. FC12 se mantiene. |
| RV-D18 | **Decidido por el usuario (2026-11-06).** El front genera la contraseña temporal del alta de usuario (botón `Generar`, `crypto.getRandomValues`, 16 caracteres con mayúscula, minúscula, dígito y símbolo). Es temporal: el empleado debe cambiarla en su primer ingreso (US-F1-09 en el back y US-FE-B-26 en el front, PB-31). Hasta que existan, la temporal no vence. Queda pendiente la confirmación del equipo (seguridad). |
| RV-D19 | **[CONFIRMAR infraestructura]** Hosting de producción sin decidir; las imágenes sirven en cualquier host. |
| RV-D20 | El alta bloquea por edad mínima en el front (el back aplica la misma regla). |
| RV-D21 | Se aceptan los defaults de cada ficha para textos y destinos "NO DEFINIDO"; los ítems sin destino no son interactivos. Marcados para confirmar con diseño. |
| RV-D22 | **[CONFIRMAR negocio/diseño]** "Desde" = `primaBase` del endpoint. Pedir a diseño que alinee los precios del Figma con el seed. |
| RV-D23 | Se acepta marcar el campo DNI con `codigo === 'PERSONA_NO_ENCONTRADA'` (excepción documentada en FC10) y 1 reintento ante 502. |
| RV-D24 | Sin permiso: panel "sin permiso" en la misma URL. |
| RV-D25 | Los pedidos de contraste y diseño se registran en `design-system.md` §9. |
| RV-D26 | Se agrega `hooks/` a la estructura de feature de FB3. |
| RV-D27 | Defaults de cada ficha (ancho de columna opcional con reparto igual; AlertaError variante B1; resto reversible). |
| RV-D28 | Credenciales de contract tests y E2E solo en variables locales; E2E fuera de CI por ahora. |
| RV-D29 | Los filtros que el back ignora (`numero`, `dni`, `incluirInactivos`, `planCodigo`) quedan ocultos tras una constante hasta que el PB se publique; **no** se activan con `VITE_USE_MOCKS`. FC3 se amplía con esta regla. |
| RV-D30 | `PATCH /api/usuarios/{id}/activo` y `tamano`; se ajustan B14 §9 y PB-04. |
| RV-D31 | Las API cards no declaran T-23: agregan su `<dominio>.contract.test.ts` al rebasar sobre T-23. Regla en FC5. |

Los 61 ítems MECÁNICOS de `REVISION.md` se aplican sin consulta.
