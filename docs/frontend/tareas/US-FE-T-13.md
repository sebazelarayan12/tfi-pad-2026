# US-FE-T-13: Backoffice: sesión y guardas

T · Ola 2 · Tamaño M · Rama sugerida `feature/US-FE-T-13-sesion-guardas` · Tarjeta Trello `US-FE-T-13`

## 1. Objetivo

El backoffice tiene un estado de sesión (`token`, `rol`, `expiraEn`) en memoria y en `sessionStorage` con `try/catch`, con margen de 5 segundos antes del vencimiento, cierre automático por vencimiento y por `401` en endpoints protegidos (FB7.5), y dos guardas de ruta: `RequireSesion` y `RequireRol`. Lo usan US-FE-B-01 (login), US-FE-T-16 (sidebar por rol) y todas las páginas protegidas.

## 2. Alcance

**Entra**
- `frontend/apps/backoffice/src/features/auth/` (dueño de `index.ts`, FC1):
  - `types/sesion.ts`: tipo `Sesion`.
  - `sesion/vigencia.ts`: margen y `estaVigente`.
  - `sesion/claims.ts`: lectura del `email` del JWT sin verificar firma.
  - `sesion/almacenamiento.ts`: `sessionStorage` con `try/catch`.
  - `sesion/store.ts`: estado, `iniciarSesion`, `cerrarSesion`, `sesionActual`, `useSesion`, `useRol`, `alCerrarSesion`.
  - `index.ts`: API pública del feature.
- `frontend/apps/backoffice/src/app/guards/RequireSesion.tsx` y `RequireRol.tsx` (reemplazan los stubs de US-FE-T-14).
- Cableado del `401` global en `frontend/apps/backoffice/src/app/providers.tsx` (un bloque, ver DP-3).
- Tests en `features/auth/**/*.test.ts(x)` y `app/guards/*.test.tsx`.

**NO entra**
- Página y formulario de login, y schema zod: US-FE-B-01 (`pages/LoginPage.tsx`, `schemas/`).
- Llamada `POST /api/auth/login`: la hace B-01; esta tarea solo recibe el `LoginResponse`.
- Sidebar y layout: US-FE-T-15 y US-FE-T-16.

## 3. Dependencias

- **Puede empezar sin esperar a:** US-FE-T-15 (no comparten archivos).
- **Depende de:** US-FE-T-08 (`configurarClienteHttp` con `obtenerToken` y `onUnauthorized`, y `ApiError`), US-FE-T-12 (`LoginResponse`, `RolUsuario`), US-FE-T-14 (router exportado como `router`, `queryClient`, stubs de guardas).
- **Bloqueada por pedidos al back:** ninguna. PB-04 (nombre del usuario) no bloquea: la sesión solo usa `email` del claim.
- **Workaround MSW:** no requiere mock.

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB3 (features y reglas de `app/`), FB7.5 (sesión), FB7.10 (roles).
- `docs/frontend/tareas/INDEX.md`: FC1 (dueño de `index.ts`), FC12 (almacenamiento), FC13 (red).
- `docs/frontend/contratos-api/seguridad-clientes-publico.md` §2.1 (modelo de sesión: sin refresh, `expiraEn`, `ClockSkew` 0), §2.3 (políticas), §2.6 (login: 401 de credenciales no redirige).
- `docs/frontend/contratos-api/convenciones-transversales.md` §2.2 (claims del JWT) y §2.4 (401 de login frente a 401 de token; distinguir por URL).
- `docs/frontend/analisis-front.md` §6.3 (estado global = sesión) y §7.2 (401 en login y en otros endpoints; 403).
- `docs/frontend/pantallas/B1-login.md` §2 (ruta `/login`, redirección si hay sesión, recordar la ruta de origen) y §8.
- `docs/frontend/pantallas/B13-planes.md` §2 y `docs/frontend/pantallas/B14-usuarios.md` §2 (guardas de administrador).

## 5. Archivos a crear o modificar

| Archivo | Dueño |
|---|---|
| `apps/backoffice/src/features/auth/**` | US-FE-T-13 (dueño de `index.ts`; incluye el selector `emailSesion` para el saludo de B-02, RV-19) |
| `apps/backoffice/src/app/guards/RequireSesion.tsx`, `RequireRol.tsx` | US-FE-T-13 (reemplaza stubs de T-14) |
| `apps/backoffice/src/app/providers.tsx` (bloque de sesión, cableado del 401) | US-FE-T-14 es dueño; T-13 edita solo ese bloque, con acuerdo (RV-16) |
| `apps/backoffice/src/features/auth/**/*.test.ts(x)`, `app/guards/*.test.tsx` | US-FE-T-13 |

## 6. Pasos de implementación

1. `types/sesion.ts`: `export interface Sesion { token: string; rol: RolUsuario; expiraEn: Date; email: string | null; }`.
2. `sesion/vigencia.ts`: `export const MARGEN_EXPIRACION_MS = 5_000;` y `estaVigente(sesion, ahoraMs)`, que devuelve `ahoraMs < sesion.expiraEn.getTime() - MARGEN_EXPIRACION_MS`.
3. `sesion/claims.ts`: `leerEmailDelToken(token): string | null`. Toma el segundo segmento del JWT, lo convierte de base64url a JSON dentro de `try/catch` y devuelve `email` si es string. No verifica la firma (seguridad §2.1: solo para mostrar). Nunca lanza.
4. `sesion/almacenamiento.ts`: clave `nexa.backoffice.sesion`. Funciones `guardar`, `leer` y `borrar`, cada una dentro de `try/catch`. `leer` devuelve `null` si el JSON está corrupto o si la sesión ya venció, y borra la clave en ambos casos.
5. `sesion/store.ts`:
   - Estado en una variable de módulo y lista de suscriptores.
   - `iniciarSesion(respuesta: LoginResponse, ahoraMs = Date.now()): boolean`: parsea `expiraEn` con `new Date(...)`; si es `NaN`, devuelve `false` y no guarda. Si es válido, guarda en memoria, en storage (sin lanzar si falla) y programa un timer para cerrar en `expiraEn - MARGEN`, con clamp a `2_147_483_647` ms.
   - `cerrarSesion(motivo: 'manual' | 'expirada' | 'no-autorizada'): void`: limpia memoria, storage y timer; ejecuta los callbacks de `alCerrarSesion`; notifica a suscriptores. Es idempotente.
   - Al cargar el módulo: `leer()` y, si la sesión está vigente, restaurarla con su timer.
6. `index.ts` del feature exporta `iniciarSesion`, `cerrarSesion`, `sesionActual`, `useSesion`, `useRol`, `alCerrarSesion`, el tipo `Sesion` y `RUTA_LOGIN = '/login'`. No exporta el storage.
7. `useSesion()` y `useRol()` con `useSyncExternalStore`.
8. `app/guards/RequireSesion.tsx`: sin sesión vigente → `<Navigate to="/login" replace state={{ desde: ubicacion.pathname + ubicacion.search }} />`. Con sesión → `<Outlet />`. Comprueba antes de renderizar hijos.
9. `app/guards/RequireRol.tsx`: props `roles: RolUsuario[]`. Si el rol actual no está en `roles`, renderiza el panel de §8 y no renderiza hijos. Comprueba antes de renderizar.
10. Cableado del 401 global en `app/providers.tsx`:
    ```ts
    configurarClienteHttp({
      obtenerToken: () => sesionActual()?.token ?? null,
      onUnauthorized: ({ ruta }) => {
        if (ruta === RUTA_LOGIN_API) return;      // "/api/auth/login": el 401 es de credenciales
        cerrarSesion('no-autorizada');
        router.navigate(RUTA_LOGIN, { replace: true });
      },
    });
    ```
    `RUTA_LOGIN_API` es `/api/auth/login`. La forma exacta de `onUnauthorized` la define US-FE-T-08 (ver §13, DP-3).
11. `alCerrarSesion(() => queryClient.clear())` se registra en `app/providers.tsx`. Así `features/auth` no importa de `app/` (FB3 regla 4).
12. Escribir los tests de §10.

## 7. Contrato con el back

No hay endpoint nuevo. Consume `LoginResponse` de `POST /api/auth/login` (Implementado, convenciones §2.1; el request lo escribe B-01):

```ts
interface LoginResponse { token: string; rol: RolUsuario; expiraEn: string; } // de @nexa/api (T-12)
```

Forma persistida en `sessionStorage` (clave `nexa.backoffice.sesion`):

```json
{ "token": "eyJ...", "rol": "Empleado", "expiraEn": "2026-11-01T08:00:00+00:00", "email": "empleado@ejemplo.com" }
```

API pública del feature:

```ts
export function iniciarSesion(respuesta: LoginResponse, ahoraMs?: number): boolean;
export function cerrarSesion(motivo: 'manual' | 'expirada' | 'no-autorizada'): void;
export function sesionActual(): Sesion | null;
export function useSesion(): Sesion | null;
export function useRol(): RolUsuario | null;
export function alCerrarSesion(callback: () => void): () => void; // devuelve la función para desregistrar
```

Los `401` y `403` del back no tienen `detail` garantizado (seguridad §1.2, forma C). La decisión se toma por status y por URL, nunca por texto.

## 8. Contenido de UI

- Redirección: `/login` (B1 §2).
- Panel de `RequireRol` sin permiso: "No tenés permiso para esta acción." (texto de analisis §7.2). El panel no tiene más texto ni acciones.
- Ningún otro texto. El mensaje de credenciales inválidas lo muestra B-01.

## 9. Estados y casos borde

- Sin sesión: redirige a `/login` y guarda `state.desde` para volver después del login.
- Token vencido en memoria o en storage: la sesión se borra y se redirige a `/login`.
- Faltan menos de 5 s para `expiraEn`: la sesión ya no está vigente. No se usa un token al límite.
- `sessionStorage` no disponible (modo privado, cuota llena): la sesión queda solo en memoria y la app no se rompe.
- JSON corrupto en storage: `leer` devuelve `null` y borra la clave.
- `expiraEn` inválido en `iniciarSesion`: devuelve `false` y no guarda; B-01 muestra el error genérico.
- `401` de `/api/auth/login`: no cierra la sesión (B-01 muestra el mensaje en el formulario).
- `401` de cualquier otro endpoint: cierra la sesión y redirige a `/login`.
- `403`: no cierra la sesión; la pantalla muestra su error (seguridad §2.4).
- `RequireRol` con rol Empleado en una ruta de Administrador: panel de §8, sin hijos y sin redirección (DP-2).
- `cerrarSesion` llamado dos veces: segunda llamada sin efecto.

## 10. Tests requeridos

Vitest, Testing Library y MSW (los tests de `401` usan `servidorMock` de US-FE-T-11).

- `sesion/vigencia.test.ts`
  - "vigente a `expiraEn - 5001 ms`".
  - "no vigente a `expiraEn - 5000 ms` ni después".
- `sesion/claims.test.ts`
  - "lee `email` del payload sin verificar la firma".
  - "token malformado devuelve `null` y no lanza".
- `sesion/almacenamiento.test.ts`
  - "`setItem` que lanza no rompe `iniciarSesion` y la sesión queda en memoria".
  - "JSON corrupto devuelve `null` y borra la clave".
  - "sesión vencida en storage se borra al leer".
- `sesion/store.test.ts`
  - "`iniciarSesion` guarda token, rol y `expiraEn` en memoria y en storage".
  - "`iniciarSesion` con `expiraEn` inválido devuelve `false` y no guarda".
  - "`cerrarSesion` limpia memoria y storage, ejecuta `alCerrarSesion` y es idempotente".
  - "el timer cierra la sesión en `expiraEn - 5 s` (`vi.useFakeTimers`)".
  - "un `expiraEn` mayor al máximo de `setTimeout` no rompe el timer (clamp)".
- `app/guards/RequireSesion.test.tsx`
  - "sin sesión redirige a `/login` con `state.desde`".
  - "con sesión vigente renderiza la ruta hija".
- `app/guards/RequireRol.test.tsx`
  - "Administrador accede a una ruta de Administrador".
  - "Empleado no ve los hijos y ve el texto de §8".
- `features/auth/cableado401.test.tsx`
  - "`401` de endpoint protegido cierra la sesión y navega a `/login`".
  - "`401` de `/api/auth/login` no cierra la sesión".
  - "`403` no cierra la sesión".

## 11. Criterios de aceptación

1. `iniciarSesion` guarda la sesión en memoria y en `sessionStorage`; `cerrarSesion` la elimina de ambos.
2. Una sesión con `expiraEn` a menos de 5 s se considera no vigente.
3. Ninguna lectura o escritura de storage lanza hacia afuera.
4. El token nunca se guarda en `localStorage` (`rg localStorage apps/backoffice` sin resultados).
5. `RequireSesion` redirige a `/login` sin renderizar hijos cuando no hay sesión vigente.
6. `RequireRol` no renderiza hijos cuando el rol no está permitido, y muestra el texto de §8.
7. Un `401` de endpoint protegido cierra la sesión y lleva a `/login`; un `401` de login no.
8. `features/auth` no importa de `app/` (`eslint-plugin-boundaries` en verde).
9. Tests de §10 en verde; `lint`, `typecheck`, `test` y `build` en verde.

## 12. Verificación manual

Antes de que B-01 esté mergeada, la prueba se hace con DevTools:
1. Abrir `http://localhost:5173/inicio` sin sesión: la app redirige a `/login`.
2. En DevTools, Application, Session Storage, crear la clave `nexa.backoffice.sesion` con `{"token":"<JWT de prueba con tres partes separadas por punto>","rol":"Empleado","expiraEn":"<fecha futura ISO con +00:00>","email":"a@b.com"}` y recargar `/inicio`: debe quedar en la página.
3. Poner `expiraEn` en el pasado y recargar: vuelve a `/login` y la clave desaparece.

## 13. Decisiones pendientes

- **DP-1 Momento de expiración.** Default: `expiraEn` del login (mismo instante que `exp` del JWT). FB7.5 dice "al vencer `exp`": si `expiraEn` falta o es inválido, se usa el claim `exp`. Alternativa: solo claim `exp`. Tradeoff: el claim exige decodificar el token y no es el campo de contrato.
- **DP-2 Rol sin permiso.** Default: panel en la misma URL. Alternativa: redirigir a `/inicio`. B13 y B14 dicen "NO DEFINIDO". Tradeoff: el panel explica el motivo; la redirección es menos fricción pero oculta por qué.
- **DP-3 Cableado de `401` global.** Default: en `app/providers.tsx`, bloque de T-14. Alternativa: `features/auth` configura el cliente al importarse. La alternativa rompe FB3 regla 4 (`features` no debe importar de `app`) y además depende del orden de carga, por eso se descarta.
- **DP-4 Clave de `sessionStorage`.** Default: `nexa.backoffice.sesion`. Cambiarla solo afecta a sesiones ya guardadas (se cierran).
- **DP-5 Limpieza de caché al cerrar sesión.** Default: sí (`queryClient.clear()`), para que el siguiente usuario no vea datos del anterior.

## 14. Riesgos y errores comunes

- Guardar el token en `localStorage`: prohibido por FB7.5.
- `setTimeout` con más de 2 147 483 647 ms se dispara de inmediato. Por eso hay clamp.
- Importar `router` o `queryClient` desde `features/`: viola FB3. Se usan callbacks registrados desde `app/`.
- Redirigir por `401` desde la propia pantalla de login genera un bucle. Se excluye `/api/auth/login`.
- Renderizar los hijos antes de comprobar el rol produce un destello de contenido restringido. La comprobación va antes del render.
- Confiar en el claim `role` del JWT para decidir permisos: el rol que se usa es el de `LoginResponse`; la autorización real la hace el back.

## 15. Definición de terminado

`npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` en verde en `apps/backoffice`. Criterios de §11 tildados con evidencia observada. Sin secretos (la clave de storage no es un secreto). Accesibilidad: el panel de §8 usa texto propio y no mueve el foco; la revisión con el harness de US-FE-T-19 se hace en B-01.

## 16. Observaciones al índice

- Resuelto (RV-16): `app/guards/*` lo crea T-14 como stubs con los mismos nombres y T-13 los reemplaza. El INDEX lo registra en la tabla de ownership.
- Resuelto (RV-16): el cableado del 401 (DP-3) edita `app/providers.tsx`, de T-14, en un bloque. Se hace en el PR de T-13 con el acuerdo del dueño.
- Resuelto (RV-D04): `loginRequest` lo escribe T-32. T-13 recibe `LoginResponse` y no lo necesita.
