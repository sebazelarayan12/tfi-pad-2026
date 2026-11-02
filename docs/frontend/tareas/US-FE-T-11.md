# US-FE-T-11: @nexa/api: MSW base

T · Ola 1 · Tamaño M · Rama sugerida `feature/US-FE-T-11-msw-base` · Tarjeta Trello `US-FE-T-11`

## 1. Objetivo

MSW queda operativo en `@nexa/api`: `server.ts` para tests (Node), `browser.ts` para desarrollo (worker), un flag global `VITE_USE_MOCKS`, un agregador `handlers/index.ts` con un archivo por dominio y fixtures comunes de errores. Las API cards agregan sus handlers sin tocar el agregador (FC3). Destinatarios: API cards T-24..T-32, B-03 y los tests de todas las features.

## 2. Alcance

**Entra**
- `frontend/packages/api/mocks/server.ts`: `servidorMock` (`setupServer` de `msw/node`).
- `frontend/packages/api/mocks/browser.ts`: `worker` (`setupWorker` de `msw/browser`) e `iniciarMocksSiCorresponde()`.
- `frontend/packages/api/mocks/handlers/index.ts`: agregador.
- `frontend/packages/api/mocks/handlers/{auth,clientes,vehiculos,planes,cotizaciones,polizas,pagos,pagofacil,publico,usuarios,inicio}.ts`: placeholders con `handlers` vacío tipado.
- `frontend/packages/api/mocks/fixtures/comunes.ts`: constructores de `ProblemDetails`.
- Tests en `frontend/packages/api/test/mocks/`.

**NO entra**
- Handlers de endpoints concretos: los escriben las API cards (T-24..T-32) y B-03 (`handlers/inicio.ts`).
- Contract tests: US-FE-T-23.
- `public/mockServiceWorker.js` de cada app: lo generan US-FE-T-14 (backoffice) y US-FE-T-17 (web).
- Lectura de `VITE_USE_MOCKS` en código de feature: prohibido (FC3).

## 3. Dependencias

- **Puede empezar sin esperar a:** US-FE-T-10 (mapas de enums).
- **Depende de:** US-FE-T-08 (convención de base URL del cliente) y US-FE-T-12 (tipo `ProblemDetails` y `ValidationProblemDetails`).
- **Bloqueada por pedidos al back (PB-NN):** —. Esta tarea es el workaround de FB7.7.
- **Workaround MSW (FB7.7):** es el mecanismo mismo.

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB1 (Vitest, MSW), FB7.7 (mocks mientras no hay endpoint).
- `docs/frontend/tareas/INDEX.md`: convención FC3 (un handler por dominio, flag global), FC5 (tests mínimos).
- `docs/frontend/analisis-front.md` §7.4 (transición mock a real) y §8.2 (qué se prueba).
- `docs/frontend/contratos-api/convenciones-transversales.md` §3.1 a §3.4 (formas de error para los fixtures) y §4 (429 sin `Retry-After`, mensaje fijo).
- `docs/frontend/contratos-api/seguridad-clientes-publico.md` §1.2 (forma C: 401 y 403 sin `detail` garantizado).
- `docs/frontend/tareas/INDEX.md`, sección Ownership: `packages/api/mocks/*` es de T-11 y `handlers/<dominio>.ts` es de la API card.

## 5. Archivos a crear o modificar

| Archivo | Dueño |
|---|---|
| `frontend/packages/api/mocks/server.ts`, `browser.ts`, `handlers/index.ts`, `fixtures/comunes.ts` | US-FE-T-11 |
| `frontend/packages/api/mocks/handlers/<dominio>.ts` (placeholders vacíos, once archivos) | Creados por T-11; los llena la API card (B-03 llena `inicio.ts`) |
| `frontend/packages/api/test/mocks/*.test.ts` | US-FE-T-11 |

## 6. Pasos de implementación

1. `server.ts`: `export const servidorMock = setupServer(...handlers);`. Solo lo importan los tests. El setup de Vitest (definido en T-02 o T-14, ver DP-2) hace `beforeAll(() => servidorMock.listen({ onUnhandledRequest: 'error' }))`, `afterEach(() => servidorMock.resetHandlers())` y `afterAll(() => servidorMock.close())`.
2. `browser.ts`: `export const worker = setupWorker(...handlers);` y
   ```ts
   export async function iniciarMocksSiCorresponde(): Promise<void> {
     if (import.meta.env.VITE_USE_MOCKS !== 'true') return;
     try {
       await worker.start({ onUnhandledRequest: 'bypass' });
     } catch (error) {
       console.error('[MSW] No se pudo iniciar el worker; la app sigue sin mocks.', error);
     }
   }
   ```
   Esta función es el único lugar que lee el flag (FC3).
3. `handlers/index.ts`: `export const handlers = [...auth, ...clientes, ...cotizaciones, ...inicio, ...planes, ...polizas, ...pagofacil, ...pagos, ...publico, ...usuarios, ...vehiculos];` importando el array `handlers` de cada dominio. Orden alfabético. Nada más en el agregador.
4. Cada placeholder: `export const handlers: HttpHandler[] = [];` (tipo de `msw`), más un comentario de una línea con el ID de la API card dueña.
5. Patrón de URL en los handlers de dominio: `'*/api/<ruta>'`. Así no dependen de `VITE_API_BASE_URL` y funcionan en tests y en dev.
6. `fixtures/comunes.ts`: constructores de §7. Usan `traceId` fijo con el formato de convenciones §3.5 (`00-0000...-01`) y `instance` como path sin query string.
7. Los constructores 401 y 403 no incluyen `detail` (seguridad §1.2, forma C). El 429 usa el `detail` de convenciones §4 y no incluye ningún campo de `Retry-After`.
8. Escribir los tests de §10.
9. Comentar en `handlers/index.ts` cómo agregar un handler (una línea: "crear el handler en el archivo del dominio y exportarlo en `handlers`").

## 7. Contrato con el back

No aplica: la tarea no define endpoints. Los fixtures reproducen las formas de error del back (convenciones §3.4 y seguridad §1.2). El tipo `ProblemDetails` lo define US-FE-T-12.

```ts
export function problemaNegocio(detail: string): ProblemDetails;                       // 400, sin codigo
export function problemaNoEncontrado(detail: string, codigo?: string): ProblemDetails; // 404
export function problemaValidacion(errors: Record<string, string[]>): ValidationProblemDetails; // 400, claves PascalCase
export function problemaSinSesion(): ProblemDetails;                                   // 401, sin detail
export function problemaSinPermiso(): ProblemDetails;                                  // 403, sin detail
export function problemaRateLimit(): ProblemDetails;                                   // 429, sin Retry-After
export function problemaErrorInesperado(): ProblemDetails;                             // 500
```

## 8. Contenido de UI

No hay pantallas. Los únicos textos que aparecen en fixtures son los de convenciones:
- "Se superó el límite de intentos. Volvé a intentarlo en un minuto." (429, convenciones §4).
- "Ocurrió un error inesperado." (500, convenciones §3.2).
- "Credenciales inválidas." (401 de login, convenciones §2.4), solo como fixture.

## 9. Estados y casos borde

- Request sin handler en tests: falla (no sale a red). Es intencional.
- Flag `false`: no se registra el worker; las requests van al back real.
- Flag `true` con `VITE_API_BASE_URL` apuntando a un back real: el worker intercepta las rutas con handler y deja pasar el resto (`bypass`).
- Mutación mockeada: el handler devuelve `201` con body y nunca reintenta (FC11).
- Falla al iniciar el worker (archivo `mockServiceWorker.js` faltante): se registra el error y la app sigue sin mocks. No se rompe el arranque.
- Un `resetHandlers()` olvidado hace que un test herede handlers de otro: el setup de §6 paso 1 lo evita.

## 10. Tests requeridos

Vitest, con `vi.mock('msw/browser')` y `vi.stubEnv` para el flag.

- `test/mocks/flag.test.ts`
  - "`iniciarMocksSiCorresponde` no inicia el worker si `VITE_USE_MOCKS` es `false`".
  - "lo inicia cuando el flag es `true`".
  - "si `worker.start` falla, no lanza y registra error".
- `test/mocks/handlers.test.ts`
  - "el agregador contiene la suma de handlers de los once dominios".
  - "los placeholders están vacíos (cada archivo exporta un arreglo vacío)".
- `test/mocks/servidor.test.ts`
  - "una request sin handler falla con `onUnhandledRequest: 'error'`".
  - "`resetHandlers` quita los handlers agregados dentro de un test".
- `test/mocks/fixtures.test.ts`
  - "`problemaSinSesion` y `problemaSinPermiso` no tienen `detail`".
  - "`problemaValidacion` devuelve `status` 400 y `errors` con claves PascalCase".
  - "`problemaRateLimit` devuelve el texto fijo de convenciones §4".

## 11. Criterios de aceptación

1. Existen `server.ts` (con `servidorMock`) y `browser.ts` (con `worker` e `iniciarMocksSiCorresponde`), y ambos exportan lo indicado.
2. Con `VITE_USE_MOCKS=false` no se inicia el worker (test de §10 en verde).
3. `handlers/index.ts` importa los once archivos de dominio y no contiene lógica de handlers.
4. Los once placeholders existen y exportan arreglos vacíos.
5. Los siete constructores de §7 existen y cumplen las formas de §7 (401 y 403 sin `detail`).
6. Ningún archivo fuera de `packages/api/mocks/` lee `VITE_USE_MOCKS` (`rg` sin resultados fuera de `iniciarMocksSiCorresponde`).
7. Tests de §10 en verde; `lint`, `typecheck` y `build` en verde.

## 12. Verificación manual

Pasos (requiere que US-FE-T-14 esté mergeada para tener `public/mockServiceWorker.js`):
1. En `apps/backoffice/.env.local` poner `VITE_USE_MOCKS=true`.
2. Ejecutar `npm run dev` del backoffice y abrir `http://localhost:5173`.
3. En la consola del navegador aparece `[MSW] Mocking enabled.`.
4. Cambiar el flag a `false`, reiniciar el dev y verificar que la línea no aparece.

Si T-14 no está mergeada, la tarea se verifica solo con los tests de §10 y se registra "sin prueba manual: falta el worker de T-14".

## 13. Decisiones pendientes

- **DP-1 Patrón de URL.** Default: `'*/api/...'` (independiente del env). Alternativa: construir la URL con `VITE_API_BASE_URL`. Tradeoff: la alternativa obliga a definir la variable en tests.
- **DP-2 Ubicación del setup de Vitest.** Default: `apps/*/src/test/setup.ts` importa `servidorMock`, en la tarea de scaffold de cada app. Alternativa: `packages/config/vitest/setup.ts` (ownership de US-FE-T-02). Tradeoff: la alternativa comparte un solo setup y acopla `config` a `api`.
- **DP-3 `onUnhandledRequest` en el navegador.** Default: `bypass`. Alternativa: `warn`. Tradeoff: `warn` ensucia la consola pero avisa de rutas sin mock.
- **DP-4 Generación del worker.** Default: `npx msw init apps/<app>/public` sin `--save`. Con `--save` MSW agrega `msw.workerDirectory` a `package.json`, lo que FC17 prohíbe fuera de T-01.

## 14. Riesgos y errores comunes

- Usar `npx msw init --save` modifica `package.json` y viola FC17.
- Importar `msw/browser` en un test de Node rompe el arranque del test. Los tests importan `server.ts`.
- Leer `VITE_USE_MOCKS` en una feature: el flag se vuelve local y deja de ser global (FC3).
- Un handler con URL absoluta fija (`http://localhost:8080/api/...`) no matchea en tests si el env cambia.
- El array `handlers` es compartido: un test que lo muta contamina a los demás. Los tests usan `servidorMock.use(...)` y `resetHandlers`.
- Un handler de mutación que devuelve error y el cliente reintenta: los handlers no reintentan, el cliente tampoco (FC11).

## 15. Definición de terminado

`npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` en verde en `packages/api`. Criterios de §11 tildados con evidencia observada. Sin secretos. Accesibilidad: no aplica.

## 16. Observaciones al índice

- Resuelto (RV-13): T-11 crea `handlers/index.ts` y los once placeholders `handlers/<dominio>.ts`, incluido `inicio.ts`, que B-03 llena y registra en `handlers/index.ts`. `handlers/cuotas.ts` lo crea T-28.
- Resuelto (RV-07): `public/mockServiceWorker.js` lo generan T-14 (backoffice) y T-17 (web), no T-11 (fila de ownership de `apps/*/public/mockServiceWorker.js`).
