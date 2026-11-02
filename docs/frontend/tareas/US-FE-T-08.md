# US-FE-T-08: `@nexa/api`: cliente HTTP y errores

Tipo: T · Oleada: 0 · Tamaño: M · Rama sugerida: `feature/US-FE-T-08-cliente-http` · Tarjeta Trello: `US-FE-T-08`

## 1. Objetivo

Al terminar, `@nexa/api` exporta `createApiClient(options)`: un cliente HTTP único que construye la URL contra una base de origen, agrega `Authorization: Bearer` desde un getter de token, envía JSON o `FormData`, devuelve JSON, texto o blob, serializa la query omitiendo `null` y `undefined`, acepta `AbortSignal`, y convierte cualquier falla en un `ApiError` con los campos de `ProblemDetails` y `ValidationProblemDetails`. Dispara `onUnauthorized` ante 401 en cualquier endpoint excepto el login. No reintenta nunca. Para: todas las features (vía los hooks de TanStack Query de cada una) y, por ellas, los usuarios de backoffice y web pública.

## 2. Alcance

**Entra:**
- `createApiClient(options)` con `get`, `post`, `put`, `patch` y `delete`.
- `ApiError` (clase), `isApiError(valor)` y los tipos `ApiClientOptions`, `RequestOptions`, `ResponseType`, `ApiBlob`.
- Respuesta cruda (`responseType: "raw"`), tipo `ApiRespuestaCruda`, para la base positiva (RV-18).
- Serializador de query en `packages/api/src/client/query.ts`.
- Parseo de errores en `packages/api/src/client/errores.ts`.
- Tests en `packages/api/test/client/*.test.ts` con `msw/node` (`setupServer` local al test; sin handlers de dominio).
- Bloque de export en `packages/api/src/index.ts` (barrel de T-12; ver sección 3).

**NO entra:**
- Lectura de `import.meta.env.VITE_API_BASE_URL` y creación de la instancia de la app: lo hacen T-14 (backoffice) y T-17 (web). El paquete no lee variables de entorno.
- Estado de sesión (token, `expiraEn`, guardas, redirección a `/login`): US-FE-T-13. Esta tarea solo llama al callback.
- DTO por dominio, tipos de `ProblemDetails` como módulo de DTO comunes: US-FE-T-12 (dueño de `src/dto/comunes.ts`).
- Mapa de mensajes en español para `detail` en inglés y mapa de enums: US-FE-T-10.
- Handlers MSW de dominio y servidor compartido para las apps: US-FE-T-11.
- Contract tests contra el back real: US-FE-T-23.

## 3. Dependencias

- **Puede empezar sin esperar a:** Nada.
- **Depende de:** — (rebase sobre T-01).
- **Bloqueada por pedidos al back (PB-NN):** —.
- **Workaround MSW (FB7.7):** no aplica. Los tests usan MSW con handlers propios del test.

## 4. Documentos a leer

- `docs/frontend/contratos-api/convenciones-transversales.md`:
  - §1.2 (la variable es solo el origen; todas las rutas ya incluyen `/api`).
  - §1.4 (CORS: sin `AllowCredentials`, sin `WithExposedHeaders`; el front no envía cookies).
  - §2.1 (login: 401 con `detail` "Credenciales inválidas." no redirige; `POST /api/auth/login` es anónimo).
  - §2.2 (JWT en `Authorization: Bearer`; solo header, no query).
  - §2.4 (401 y 403: forma de respuesta y cuidado con el 401 del login).
  - §3.1 (fuentes A, B, C y D de error; todas `application/problem+json`).
  - §3.2 (tabla excepción → status → body; 502 y 503 con `detail`; 500 con mensaje genérico).
  - §3.3 (validación por campo: `errors` con clave PascalCase).
  - §3.4 (tipo `ProblemDetails` de referencia) y §3.5 (ejemplos de body).
  - §4 (429 sin `Retry-After`; no reintentar `/api/publico/*`).
  - §7.1 (no reintentar POST).
  - §7.2 (headers no legibles desde JavaScript: `Location`, `Retry-After`, `Content-Disposition`).
  - §7.3 (upload `multipart/form-data`, campo `archivo`; descarga `text/plain` como blob).
- `docs/frontend/analisis-front.md` §7.1 (capa de cliente HTTP) y §7.2 (tabla de tratamiento de errores por status).
- `docs/frontend/00-decisiones-base.md` FB4 (un único cliente, sin `fetch` suelto en componentes), FB7.5 (sesión: 401 cierra sesión y redirige) y FB7.9 (mutaciones sensibles: `retry: 0`, no reenviar tras error de red).
- `docs/frontend/tareas/INDEX.md` FC10 (todo error llega como `ApiError`), FC11 (`retry: 0` en mutaciones) y FC13 (todo pasa por el cliente; `/api/publico/*` no reintenta ante 429).

## 5. Archivos a crear o modificar

Dueño de todos: US-FE-T-08, salvo `packages/api/src/index.ts` (dueño T-12; esta tarea agrega su bloque tras el merge de T-12).

| Archivo | Contenido |
|---|---|
| `frontend/packages/api/src/client/createApiClient.ts` | `createApiClient`, tipos de opciones y request |
| `frontend/packages/api/src/client/errores.ts` | `ApiError`, `isApiError`, parseo del cuerpo de error |
| `frontend/packages/api/src/client/query.ts` | `serializarQuery(query)` |
| `frontend/packages/api/src/client/index.ts` | Reexporta lo público del cliente |
| `frontend/packages/api/src/index.ts` | Bloque: `export * from './client/index'`. Se agrega después del bloque de T-12 (orden de merge, no dependencia) |
| `frontend/packages/api/test/client/createApiClient.test.ts` | Tests de requests, headers, cuerpos y respuestas |
| `frontend/packages/api/test/client/errores.test.ts` | Tests de `ApiError` y de cada forma de error |

## 6. Pasos de implementación

1. **RED.** Escribir los tests de la sección 10 con `setupServer` de `msw/node` en el propio archivo de test. Ejecutar `npm run test --workspace @nexa/api`: fallan porque no hay cliente. Anotar el resultado.
2. **`ApiError`.** Clase con campos de solo lectura: `status: number`, `kind: "http" | "red" | "respuesta-invalida"`, `title: string | null`, `detail: string | null`, `traceId: string | null`, `codigo: string | null`, `errors: Record<string, string[]> | null`. `message` = `detail ?? "Error de la API (<status>)"`. `name = "ApiError"`. `isApiError(valor: unknown): valor is ApiError` con `instanceof`.
3. **Parseo de error (`errores.ts`).** Dado un `Response` con status ≥ 400:
   - Leer el cuerpo como texto. Si el `Content-Type` contiene `json` (`application/problem+json` o `application/json`), intentar `JSON.parse`. Si el resultado es un objeto, leer: `title` (string o null), `detail` (string o null), `traceId`, `codigo` (string), `errors` (objeto cuyos valores son arrays de strings; si no cumple, `null`).
   - Si el cuerpo no es JSON o falla el parseo, los campos quedan en `null`, `status` = `response.status`.
   - Devolver `ApiError` con `kind: "http"`.
4. **`serializarQuery`.** Omite `undefined` y `null`. `boolean` y `number` se convierten a string. Devuelve un `URLSearchParams` o cadena vacía; no agrega `?` si no hay parámetros.
5. **`createApiClient`.**
   - `options`: `baseUrl: string`, `getToken?: () => string | null`, `onUnauthorized?: () => void`.
   - Validación: `baseUrl` vacía lanza `TypeError` en la creación. Se quitan barras finales.
   - `request(method, path, { query, body, signal, responseType })`:
     - `path` debe empezar con `/api/`; si no, `TypeError` (error de desarrollo, no de red).
     - URL = `baseUrl + path + (query ? "?" + serializarQuery : "")`.
     - Headers: `Accept` según `responseType` (JSON: `application/json, application/problem+json`; texto: `text/plain`; blob: `*/*`). Si `getToken()` devuelve string no vacío, `Authorization: Bearer <token>`. Si `body` es `FormData`, no se fija `Content-Type`; si es otro valor distinto de `undefined`, `JSON.stringify` con `Content-Type: application/json`.
     - `credentials: "omit"`.
     - `fetch` dentro de `try`: si lanza y es `AbortError`, se relanza tal cual; cualquier otro error se convierte en `ApiError` con `kind: "red"`, `status: 0`.
     - Si `response.status === 401` y `path` (sin query) no es `/api/auth/login`, llamar `onUnauthorized?.()` antes de lanzar.
     - Si `response.ok` es falso, parsear el error (paso 3) y lanzar.
     - Éxito: `204` o cuerpo vacío → `undefined` (en JSON) o `""` (en texto). JSON: parsear; si falla, lanzar `ApiError` con `kind: "respuesta-invalida"`. Texto: `response.text()`. Blob: `{ blob: await response.blob(), contentType: response.headers.get("content-type") }`.
   - Métodos `get`, `post`, `put`, `patch`, `delete` delegan en `request`. Ninguno tiene `retry`.
6. **Barrel.** `packages/api/src/index.ts` agrega `export * from "./client/index"`. Si T-12 ya se mergeó, la línea va después de su bloque; si no, se resuelve el conflicto del barrel al rebasar (sección 3).
7. **GREEN.** Ejecutar `npm run test --workspace @nexa/api`, typecheck y lint.

## 7. Contrato con el back

Esta tarea no define endpoints, pero sí fija cómo interpreta el cliente las respuestas del back:

| Respuesta del back | Status | `ApiError` resultante | Fuente (`convenciones §3.1`) |
|---|---|---|---|
| Éxito sin cuerpo | 204 | `undefined` | Cualquier endpoint sin cuerpo |
| Validación por campo | 400 | `kind: "http"`, `errors` por clave PascalCase, `title` en inglés | D (ValidationProblemDetails) |
| Regla de negocio | 400 | `detail` en español, `codigo` `null` | A (BusinessRuleException) |
| No encontrado con código | 404 | `codigo` como `CLIENTE_NO_ENCONTRADO`, `detail` | A (NotFoundException) |
| Credenciales inválidas | 401 | `detail` "Credenciales inválidas.", `onUnauthorized` NO se llama | A (CredencialesInvalidasException) |
| Token vencido o sin token | 401 | `onUnauthorized` se llama | B |
| Rol sin permiso | 403 | sin cuerpo garantizado: `detail` `null` | B |
| Rate limit público | 429 | `detail` fijo; sin `Retry-After`; sin reintento | C |
| Servicio externo caído | 502 | `detail` del back | A (ExternalServiceException) |
| Servicio no disponible | 503 | `detail` del back; `Retry-After` no legible | A (ServicioNoDisponibleException) |
| Error inesperado | 500 | `detail` "Ocurrió un error inesperado.", `traceId` | A |
| Respuesta no JSON (proxy, HTML) | cualquiera | `detail` `null` | Fuera de contrato |
| Falla de red o CORS | — | `kind: "red"`, `status: 0` | Browser |

Constantes que el cliente usa: ruta de login `"/api/auth/login"` (única excepción al 401).

**Tipos de respuesta:**
- `json` (default): el tipo `T` lo fija el llamador. El cliente no valida en runtime; la validación de contrato la hace T-23.
- `text`: `string`.
- `blob`: `ApiBlob = { blob: Blob; contentType: string | null }`. Se usa para `GET /api/pagofacil/base-positiva` (`text/plain`). `Content-Disposition` no se lee (CORS, `convenciones §7.2`): el nombre del archivo lo arma la feature.
- `raw`: `ApiRespuestaCruda = { status: number; ok: boolean; contentType: string | null; texto: string }`. No lanza por status HTTP: la feature revisa `ok` y `Content-Type` (RV-18, como B-21). Lo usa T-30 para `GET /api/pagofacil/base-positiva`. Los fallos de red siguen como `ApiError` con `kind: "red"`.

## 8. Contenido de UI

No aplica. El cliente no muestra textos. Los mensajes al usuario (por ejemplo, el texto genérico cuando `detail` es `null`) los resuelve T-10 y cada pantalla.

## 9. Estados y casos borde

- **401 en el login.** No llama `onUnauthorized`; el `ApiError` lleva el `detail` para mostrarlo en el formulario (`convenciones §2.4`).
- **401 con varias requests en vuelo.** Si tres queries reciben 401 a la vez, `onUnauthorized` se llama tres veces. El cliente no deduplica: la sesión (T-13) debe hacerlo.
- **429 en `/api/publico/*`.** Una sola request, sin reintento (`convenciones §4`). La pantalla muestra el texto fijo de 60 s (D-32 del INDEX).
- **Cancelación.** Un `AbortSignal` cancelado produce `AbortError` sin envolver. TanStack Query lo ignora; no es un error de la app.
- **FormData con archivo grande.** El cliente no valida tamaño (5 MB es regla de la pantalla de Pago Fácil, `convenciones §7.3`). El back responde 400 de negocio si se excede.
- **Respuesta 2xx con cuerpo vacío en JSON.** Devuelve `undefined`, no error.
- **Respuesta 2xx con JSON inválido.** Lanza `ApiError` con `kind: "respuesta-invalida"`; no devuelve `null` silencioso.
- **Error 5xx con cuerpo HTML.** `detail` `null`; el `status` queda para que la pantalla decida el texto.
- **Token vacío `""`.** Se trata como ausente: no hay header `Authorization`.
- **Base con barra final.** `https://api.nexaseguros.me/` se normaliza a sin barra.

## 10. Tests requeridos

Herramientas: Vitest (environment `node`, de `packages/api/vitest.config.ts`) + `msw/node` (`setupServer`, `http`, `HttpResponse`).

| Test | Qué afirma |
|---|---|
| `arma la URL con base sin barra final y path /api` | La request llega a `https://api.test/api/clientes` aunque la base tenga `/` final |
| `lanza TypeError si baseUrl está vacía` | `createApiClient({ baseUrl: "" })` lanza `TypeError` |
| `lanza TypeError si el path no empieza con /api/` | `get("/clientes")` lanza `TypeError` antes de hacer fetch |
| `agrega Authorization Bearer si hay token` | El header llega como `Bearer abc.def` |
| `no agrega Authorization si el token es null o vacío` | Sin header con `null` y con `""` |
| `POST con objeto envía JSON y Content-Type application/json` | Body parseado igual al objeto; `content-type` JSON |
| `FormData se envía sin Content-Type fijado por el cliente` | El `content-type` empieza con `multipart/form-data` (con boundary) |
| `204 devuelve undefined` | `delete` contra 204 resuelve `undefined` |
| `query omite null y undefined y serializa números y booleanos` | `?tamano=10&soloActivos=true` sin `estado` ni `dni` |
| `400 de ValidationProblemDetails produce errors por clave` | `errors.Email` es `["El email es obligatorio."]` y `kind` `http` |
| `400 con detail y sin errors deja errors en null` | `detail` presente, `errors` `null` |
| `404 con codigo conserva codigo` | `codigo` `CLIENTE_NO_ENCONTRADO` |
| `401 en endpoint protegido llama onUnauthorized y lanza ApiError` | El spy se llama una vez; el error tiene `status` 401 |
| `401 en POST /api/auth/login no llama onUnauthorized` | El spy no se llama; el `detail` es "Credenciales inválidas." |
| `403 sin cuerpo produce ApiError con detail null` | `detail` `null`, `status` 403 |
| `429 no reintenta y lanza ApiError status 429` | El handler cuenta 1 request; el error tiene `status` 429 |
| `500 con cuerpo HTML produce ApiError con detail null` | `detail` `null`, `status` 500 |
| `error de red produce ApiError kind red y status 0 sin reintento` | `fetch` rechazado → `kind` `red`, `status` 0, 1 request |
| `AbortSignal cancelado relanza AbortError sin envolver` | `error.name === "AbortError"` y `isApiError` falso |
| `responseType blob devuelve blob y contentType` | `blob` es `Blob` y `contentType` es `text/plain; charset=utf-8` |
| `responseType text devuelve string` | Resultado `"hola"` |
| `responseType raw devuelve status, ok, contentType y texto sin parsear` | Con 400 no lanza: `ok` es `false`, `status` 400 y el texto llega tal cual |
| `2xx con JSON inválido produce ApiError kind respuesta-invalida` | `kind` `respuesta-invalida` |
| `request no envía credenciales` | El `Request` que ve el handler tiene `credentials` `omit` |
| `isApiError distingue ApiError de Error común` | `isApiError(new Error())` es `false` y `isApiError(new ApiError(...))` es `true` |

## 11. Criterios de aceptación

1. `createApiClient`, `ApiError`, `isApiError` y los tipos `ApiClientOptions`, `RequestOptions`, `ResponseType`, `ApiBlob` se exportan desde `@nexa/api`.
2. El paquete no lee `import.meta.env` ni `process.env` (verificable con `rg "import.meta.env|process.env" frontend/packages/api/src`).
3. `createApiClient` no importa nada de `apps/` (verificable con `rg "apps/" frontend/packages/api/src`).
4. Toda request lleva `credentials: "omit"`.
5. `Authorization` se envía solo si `getToken()` devuelve un string no vacío.
6. `FormData` se envía sin `Content-Type` fijado por el cliente.
7. Un 204 o un cuerpo vacío devuelve `undefined` (JSON) o `""` (texto).
8. La query omite `null` y `undefined`.
9. Todo error no-2xx llega como `ApiError`; ningún `Response` de error se devuelve como éxito.
10. `errors` llega como `Record<string, string[]>` solo cuando el cuerpo lo trae con esa forma.
11. `onUnauthorized` se llama en 401 de cualquier endpoint excepto `/api/auth/login`, y no se llama en otros status.
12. No hay ningún reintento: un test por cada status de la tabla de la sección 7 comprueba que hubo una sola request.
13. Una falla de red produce `ApiError` con `kind: "red"` y `status: 0`.
14. Un `AbortError` se relanza sin envolver.
15. `responseType: "blob"` devuelve `ApiBlob` con el `contentType` de la respuesta.
16. Un 2xx con JSON inválido produce `ApiError` con `kind: "respuesta-invalida"`.
17. `npm run test`, `npm run typecheck` y `npm run lint` del workspace `@nexa/api` pasan, con los 25 tests de la sección 10.

## 12. Verificación manual

Sin prueba manual de UI. Una verificación opcional, con el backend local (`docker compose up`, `http://localhost:8080`): ejecutar `createApiClient({ baseUrl: "http://localhost:8080" }).post("/api/auth/login", { email: "x@x.com", password: "x" })` desde un script de Node y revisar que el error tiene `status` 401 y `detail` "Credenciales inválidas.". La prueba de contrato completa queda para US-FE-T-23.

## 13. Decisiones pendientes

- **D-T08-1. Tipos de error sin dependencia de T-12 (default: locales).** `errores.ts` parsea el cuerpo desde `unknown` y lo estrecha con guardas de tipo (FB1: `unknown` y validar). No importa `ProblemDetails` de `dto/comunes.ts`, así que la Oleada sigue en 0. Alternativa: importar `ProblemDetails` de T-12; entonces T-08 pasa a Oleada 1 con el efecto en cadena de la sección 16.
- **D-T08-2. Inyección de configuración (resuelta).** El paquete recibe `baseUrl`, `getToken` y `onUnauthorized` como opciones (decisión de esta tarea). La instancia de la app la crean T-14 y T-17 con `import.meta.env.VITE_API_BASE_URL`. Así el paquete no depende de Vite y los tests no necesitan variables de entorno.
- **D-T08-3. Errores de red como `ApiError`.** Default: sí, con `kind: "red"` y `status: 0`. Alternativa: relanzar el `TypeError` de `fetch`. Se elige `ApiError` para que la UI tenga un solo tipo de error (FC10).
- **D-T08-4. Mensaje de `ApiError` sin `detail`.** Default: `"Error de la API (<status>)"`, en español. Es un texto de desarrollo (para logs); la UI no lo muestra. Pendiente de confirmar con el equipo.
- **D-T08-5. Entorno de test.** Default: `node` (configurado en T-02), porque el cliente no usa DOM. Con `jsdom`, `fetch` y `Response` pueden fallar en Vitest.

## 14. Riesgos y errores comunes

- **`Content-Type` fijado con FormData.** Si el cliente fija `multipart/form-data` sin boundary, el back no lee el archivo. El test de `FormData` lo detecta.
- **`response.json()` en 204.** Lanza en un cuerpo vacío. El cliente lee texto y parsea solo si hay contenido.
- **Login con 401 que dispara la redirección.** Si la exclusión de `/api/auth/login` se olvida, el usuario que se equivoca de contraseña vuelve a `/login` sin ver el error. El test de login lo cubre.
- **Reintentos implícitos.** TanStack Query reintenta queries por defecto (3 veces) y `retry: 0` solo en mutaciones (FC11). El cliente no reintenta, y el `QueryClient` de T-14 fija `retry` para queries de `/api/publico/*`. Un reintento de una mutación de pago es un defecto grave (FB7.9).
- **Abort mal manejado.** Envolver `AbortError` en `ApiError` hace que TanStack Query lo muestre como error de la app. Se relanza tal cual.
- **Token en la URL.** Nunca. El token va solo en `Authorization` (`convenciones §2.2`).
- **Base con `/api` al final.** `VITE_API_BASE_URL` es solo el origen. Si la app la configura con `/api`, las rutas quedan `/api/api/...`. Se documenta en el README (T-22).
- **Orden de merge con T-12.** El barrel `src/index.ts` lo comparten T-12 y esta tarea. Se mergea T-12 primero para evitar conflicto. Ver D-T08-1 y sección 16.

## 15. Definición de terminado

- `npm run test`, `npm run typecheck`, `npm run lint` en verde en `@nexa/api`.
- Los 25 tests de la sección 10 pasan, con el RED inicial anotado.
- Criterios de la sección 11 con evidencia (comandos `rg` de los criterios 2 y 3 con salida vacía).
- Verificación opcional de la sección 12 anotada si se hizo.
- Sin secretos ni URLs reales de producción en tests (usar `https://api.test`).
- Diff revisado: solo archivos de la sección 5 y el bloque de `index.ts`.

## 16. Observaciones al índice

- Resuelto (RV-D08): T-08 valida la forma wire de `ProblemDetails` con guardas sobre `unknown` y no importa de T-12. La Oleada queda en 0 (D-T08-1).
- Resuelto (RV-14): T-08 es colaborador del barrel `packages/api/src/index.ts` y agrega su bloque después del de T-12 (fila 54 del INDEX y tabla de ownership).
- Resuelto (RV-14): las instancias `createApiClient` con `VITE_API_BASE_URL` las crean T-14 (backoffice) y T-17 (web). El paquete no lee variables de entorno (D-T08-2).
- Resuelto (RV-16): la redirección a `/login` ante 401 es de T-13 (cableado global en `app/providers.tsx`, con acuerdo de T-14). T-08 solo llama al callback `onUnauthorized`.
