# US-FE-B-01: Login del backoffice

Tipo: B · Oleada: 3 · Tamaño: S · Rama sugerida: `feature/US-FE-B-01-login` · Tarjeta Trello: `US-FE-B-01`

Pantalla: [B1 Login](../pantallas/B1-login.md). Índice: [INDEX](INDEX.md), fila US-FE-B-01.

---

## 1. Objetivo

Un empleado o un administrador ingresa con email y contraseña en `/login`, el back devuelve el JWT y el rol, la sesión queda guardada en el store de sesión (US-FE-T-13) y el usuario llega a `/inicio`. Si ya hay una sesión válida, `/login` redirige a `/inicio`. Para: empleados y administradores del backoffice (`apps/backoffice`).

## 2. Alcance

**Entra**
- Ruta pública `/login` en `apps/backoffice/src/features/auth/routes.tsx` (bloque del feature; el stub lo crea US-FE-T-14).
- `LoginPage` (formulario con react-hook-form + zod), `LayoutAcceso` (layout de acceso sin sidebar) y el hook de mutación.
- Validaciones de campo con los textos de B1 §5 (sección 8 de esta tarea).
- Bootstrap de mocks en `main.tsx`: bloque que llama a `iniciarMocksSiCorresponde` de T-11 antes del render (RV-D03). El archivo `main.tsx` es de T-14.
- `ApiClientProvider` y `useApiClient` en `packages/api/src/client/ApiClientProvider.tsx` (FC18), exportados por bloque en el barrel, y su montaje en `app/providers.tsx` con el cliente de `app/apiClient.ts` (archivo de T-14; solo se monta el provider).
- Manejo de 200, 400 por campo, 401 de credenciales, 5xx, timeout y sin conexión.
- Redirección a `/inicio` tras login y redirección desde `/login` si la sesión es válida.
- Accesibilidad de la pantalla (FC16) y test de axe con el helper de US-FE-T-19.

**NO entra**
- Store de sesión, `RequireSesion`, `RequireRol` y cierre de sesión por 401 global: **US-FE-T-13**.
- Primitivos `Input`, `Select`, `Button`, `AlertaError`, `Logo`: **US-FE-T-04, T-05, T-07**.
- Cliente HTTP, `ApiError`, `onUnauthorized`: **US-FE-T-08**.
- Tipos `LoginRequest` y `LoginResponse`: **US-FE-T-12**. Función `loginRequest` (`packages/api/src/auth/login.ts`): **US-FE-T-32** (RV-D04).
- Layout con sidebar (`LayoutBackoffice`): **US-FE-T-16**.
- Recuperación de contraseña, logout y límite de intentos: no existen en el back ni en el diseño (B1 D-4, D-5).

## 3. Dependencias

- **Oleada:** 3.
- **Depende de:** US-FE-T-04, US-FE-T-05, US-FE-T-07, US-FE-T-11, US-FE-T-12, US-FE-T-13, US-FE-T-14, US-FE-T-19, US-FE-T-32.
- **Puede empezar sin esperar a:** US-FE-T-16 (la pantalla no usa el layout con sidebar).
- **Bloqueada por pedidos al back:** ninguno. `POST /api/auth/login` está Implementado.

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB1 (TypeScript estricto, zod, RHF), FB3 (reglas 1 a 4), FB4, FB5, FB7.5 (sesión en memoria y `sessionStorage`, nunca `localStorage`), FB7.7, FB7.8.
- `docs/frontend/pantallas/B1-login.md`: §2 (ruta y guardas), §3 (estructura, solo medidas clave), §4 (componentes), §5 (contenido literal), §6 (campos), §7 (estados), §8 (acciones), §9 (endpoint y almacenamiento), §11 (responsive), §12 (accesibilidad), §13 (D-1, D-2, D-4, D-6, D-8, D-10).
- `docs/frontend/contratos-api/seguridad-clientes-publico.md`: §1.2 (formas de error), §2.1 (modelo de sesión), §2.2 (roles), §2.6 (login).
- `docs/frontend/contratos-api/convenciones-transversales.md`: §2.1 (endpoints de auth), §3.3 (validación por campo), §3.4 (tipo de error).
- `docs/frontend/design-system.md`: §5.1 Button, §5.2 Input (estados y props), §8.2 (error de Input), §8.3 (foco visible).
- `docs/frontend/tareas/INDEX.md`: convenciones FC10, FC12, FC16 y la sección Ownership.
- `docs/frontend/pedidos-al-back.md`: PB-15 (mensajes en inglés).
- Nota de ubicación: B1 §4 pone `LayoutAcceso` en `app/`; RV-08 manda (`features/auth/components/`).

## 5. Archivos a crear o modificar

Todos bajo `frontend/apps/backoffice/src/`, salvo `frontend/packages/api/src/client/ApiClientProvider.tsx` (nuevo, FC18) y su bloque en `packages/api/src/index.ts`.

| Archivo | Dueño | Notas |
|---|---|---|
| `features/auth/pages/LoginPage.tsx` | US-FE-B-01 | Página delgada: compone el formulario y el layout. |
| `features/auth/pages/LoginPage.test.tsx` | US-FE-B-01 | Tests de §10. |
| `features/auth/schemas/loginSchema.ts` | US-FE-B-01 | Esquema zod. Fuente del tipo `LoginFormValues`. |
| `features/auth/api/useLogin.ts` | US-FE-B-01 | `useMutation` del feature. Único hook de login. |
| `features/auth/components/LayoutAcceso.tsx` | US-FE-B-01 | Layout de dos columnas sin sidebar. Ver sección 16. |
| `features/auth/routes.tsx` | US-FE-B-01 | Completa el stub de US-FE-T-14 con la ruta `/login`. |
| `features/auth/index.ts` | US-FE-T-13 | B-01 solo agrega su bloque de export si hace falta. |
| `features/auth/store/*` y `app/guards/*` | US-FE-T-13 | No tocar. |
| `packages/api/src/auth/login.ts` (función `loginRequest`) | US-FE-T-32 (RV-D04) | No tocar: la escribe T-32; B-01 la importa. |
| `apps/backoffice/src/main.tsx` | US-FE-T-14 (B-01 agrega un bloque) | Solo el bloque de bootstrap de mocks que llama a `iniciarMocksSiCorresponde` de T-11, antes del render (RV-D03). No tocar el resto. |

Ninguna tarea de este archivo edita `package.json`, lockfile ni `app/layouts/*` (FC17, ownership de T-16).

## 6. Pasos de implementación

1. Confirmar que T-04, T-05, T-07, T-11, T-12, T-13, T-14, T-19 y T-32 están mergeadas. Leer sus exports reales antes de escribir código (los nombres de la sección 7 son sugeridos).
2. Crear `loginSchema.ts`: `email` con `trim()`, requerido y formato email; `password` requerido. El tipo sale de `z.infer`.
3. Crear `useLogin.ts`: `const cliente = useApiClient();` y `useMutation({ mutationFn: (body) => loginRequest(cliente, body), retry: 0 })` (FC18). Al éxito llama a la acción de sesión del store de T-13 con `token`, `rol` y `expiraEn`, y navega a `/inicio` (o al `from` de la sección 8).
4. Crear `LayoutAcceso.tsx`: columna del formulario (680 px, centrada) y columna del panel de marca (oculta por debajo de 1024 px). Sin imagen (D-6 en sección 13).
5. Crear `LoginPage.tsx` con `useForm` y `zodResolver(loginSchema)`. Valores iniciales vacíos (nunca los valores de muestra de B1 §5).
6. Campos: dos `Input` de `@nexa/ui` con `label` visible. Email con `type="email"`, `autoComplete="username"`. Contraseña con `type="password"` y `autoComplete="current-password"`. El botón de mostrar/ocultar va junto al campo (no dentro del primitivo; ver sección 16).
7. Botón `Button` variante `primary`, tamaño `m`, label `Ingresar`. Se deshabilita mientras la mutación corre y se marca `aria-busy`.
8. Al enviar: si hay errores de zod, no se llama a la API y el foco va al primer campo inválido. Después de un error, cada campo se revalida al cambiar (B1 §6).
9. Al 401: mostrar `AlertaError` (texto de sección 8), vaciar la contraseña y enfocar el email. No redirigir.
10. Al 400 con `errors`: buscar las claves `Email` y `Password` de forma insensible a mayúsculas. Si existen, marcar el campo con `error` y `helper` con el copy propio. Nunca mostrar el texto del back.
11. Al 5xx, timeout o error de red: `AlertaError` con el texto genérico de sección 8. No reintentar.
12. En el montaje: si `estaAutenticado()` de T-13 es `true`, `<Navigate to="/inicio" replace />`.
13. Si la ruta llegó con `location.state.motivo === "sesionVencida"` (lo setea la guarda de T-13), mostrar el banner de sesión vencida.
14. Confirmar en el cliente de T-08 que `POST /api/auth/login` no dispara `onUnauthorized` ante 401 (ver test de §10).
15. Escribir los tests de §10 antes que la página (test-first donde aplique) y correr `lint`, `typecheck`, `test`, `build`.
16. Agregar en `main.tsx` el bloque de bootstrap de mocks (RV-D03): `iniciarMocksSiCorresponde` de T-11 antes del render. Con `VITE_USE_MOCKS=false` no se carga MSW.

## 7. Contrato con el back

| Método y ruta | Estado | Request | Response 200 | Errores |
|---|---|---|---|---|
| `POST /api/auth/login` | Implementado (`AuthController`, `[AllowAnonymous]`) | `LoginRequest` | `LoginResponse` | 400 `ValidationProblemDetails`; 401 `ProblemDetails` con `detail: "Credenciales inválidas."`; 500 |

```ts
// Tipos en @nexa/api (dueño US-FE-T-12, dto/auth.ts). No redefinir en la feature.
export type RolUsuario = 'Administrador' | 'Empleado';

export interface LoginRequest {
  email: string;      // obligatorio, formato email
  password: string;   // obligatorio, sin largo mínimo en el login
}

export interface LoginResponse {
  token: string;      // JWT. Se envía como "Authorization: Bearer <token>"
  rol: RolUsuario;    // string, no número
  expiraEn: string;   // ISO 8601 con offset, por ejemplo "2026-11-01T08:00:00+00:00"
}
```

- Request: `POST` con body JSON `{ "email": "...", "password": "..." }` (camelCase).
- 401 de login = **credenciales**. Un 401 de cualquier otra URL = **sesión** (contrato §2.6). Se distingue por URL, no por status.
- `expiraEn` se compara con el reloj local con un margen de 5 segundos (contrato §2.1, recomendación).
- Handler MSW: no aplica (endpoint Implementado). En tests, cada caso sobrescribe el handler con `server.use(http.post('*/api/auth/login', ...))`, sin editar el handler común de US-FE-T-11 (FB7.7).
- Degrada por PB-15: los mensajes de validación en inglés de ASP.NET no se muestran nunca. La UI usa su propio copy (sección 8). Si el back devuelve `errors`, solo se usa la clave para marcar el campo.

## 8. Contenido de UI

Textos literales de B1 §5 (tildes y puntuación tal cual). Los marcados (propuesta) son copy no diseñado.

| Elemento | Texto |
|---|---|
| Logo (texto junto a la marca) | `Nexa Seguros` |
| Título H1 | `Ingresar al panel` |
| Subtítulo | `Acceso para empleados y administradores de Nexa Seguros.` |
| Label email | `Email` |
| Label contraseña | `Contraseña` |
| Ayuda bajo la contraseña (texto, sin link, alineada a la derecha) | `¿Olvidaste tu contraseña? Pedila a un administrador.` |
| Botón | `Ingresar` |
| Error de acceso (401) | `Email o contraseña incorrectos.` (ver D-B01-1) |
| Panel: título | `Panel interno de Nexa Seguros` |
| Panel: descripción | `Clientes, pólizas, cuotas y cobros en un solo lugar.` |
| Validación: email vacío | `El email es obligatorio.` (propuesta, copy del back) |
| Validación: email inválido | `El email no tiene un formato válido.` (propuesta, copy del back) |
| Validación: contraseña vacía | `La contraseña es obligatoria.` (propuesta, copy del back) |
| Toggle de contraseña (aria-label) | `Mostrar contraseña` / `Ocultar contraseña` (propuesta) |
| Error de red o 5xx (propuesta) | `No pudimos iniciar sesión. Probá de nuevo en unos minutos.` |
| Sesión vencida (propuesta, B1 §7) | `Tu sesión venció. Volvé a ingresar.` |

**No renderizar:** `Foto: sede de atención` (anotación del Figma), los valores de muestra `mariela.quiroga@nexaseguros.com.ar` y `••••••••••` (D-8). Los campos arrancan vacíos.

## 9. Estados y casos borde

| Caso | Comportamiento |
|---|---|
| Inicial | Campos vacíos, botón habilitado, sin alerta. |
| Campo inválido (cliente) | `Input` en estado error, `helper` con el copy de §8, sin llamada a la API. |
| Enviando | Campos y botón deshabilitados, `aria-busy` en el botón, texto del botón sin cambios (B1 §7). |
| 200 | Guarda sesión (T-13) y navega a `/inicio` o al `from`. |
| 401 | `AlertaError` con `role="alert"`, contraseña vacía, foco en email. |
| 400 con `errors` | Marca el campo que corresponde; si la clave no es Email ni Password, muestra el error en alerta general sin texto del back. |
| 5xx, timeout, sin conexión | Alerta genérica de §8. No se reintenta. |
| Doble clic en Ingresar | Un solo POST (botón deshabilitado durante la mutación, `retry: 0`). |
| Enter dentro de un campo | Envía el formulario (comportamiento de `<form>`). |
| Ya autenticado al entrar a `/login` | Redirige a `/inicio` sin mostrar el formulario. |
| Llegada con `motivo: sesionVencida` | Muestra el banner de sesión vencida y el formulario. |
| Espacios alrededor del email | Se recortan antes de validar y de enviar. |
| Rol fuera de `Administrador`/`Empleado` en la respuesta | Se trata como error genérico y no se guarda la sesión. |
| Foco | Anillo de 2 px `action/primary` en campos y botones (design-system §8.3). |

## 10. Tests requeridos

Herramientas: Vitest, Testing Library y MSW (`server.use` por caso).

| Test | Qué afirma | Herramienta |
|---|---|---|
| `muestra los labels visibles Email y Contraseña asociados a sus campos` | `getByLabelText` encuentra ambos campos; no hay placeholder usado como label. | Testing Library |
| `los campos arrancan vacíos (sin valores de muestra)` | Valores iniciales `""`. | Testing Library |
| `muestra "El email es obligatorio." y no llama a la API` | Regla de email requerido; el MSW handler no recibe requests. | Testing Library + MSW |
| `muestra "El email no tiene un formato válido." para email inválido` | Regla de formato. | Testing Library |
| `muestra "La contraseña es obligatoria." para contraseña vacía` | Regla de contraseña requerida. | Testing Library |
| `recorta los espacios del email antes de enviar` | El body tiene el email sin espacios. | MSW (captura del body) |
| `envía POST /api/auth/login con body { email, password }` | Método, ruta y claves camelCase. | MSW |
| `200 guarda token, rol y expiraEn en el store y navega a /inicio` | Store de T-13 con los tres valores; ruta final `/inicio`. Se prueba con rol `Empleado` y con `Administrador`. | Testing Library + MSW |
| `200 no escribe en localStorage` | `localStorage.length` no cambia. | Vitest |
| `401 muestra "Email o contraseña incorrectos." en role="alert"` | Texto y rol de la alerta. | Testing Library + MSW |
| `401 no redirige, vacía la contraseña y enfoca el email` | `location` no cambia; `value` de contraseña `""`; `document.activeElement` es el email. | Testing Library |
| `401 de login no dispara onUnauthorized` | El spy del cliente de T-08 no se llama. | Vitest + MSW |
| `400 con errors.Email marca el campo con aria-invalid y aria-describedby` | Mapeo de clave en mayúsculas. | Testing Library + MSW |
| `400 con clave desconocida no muestra el texto del back` | La alerta usa copy propio. | Testing Library + MSW |
| `500 muestra el mensaje genérico y no reintenta` | Texto de §8; un solo request. | Testing Library + MSW |
| `error de red muestra el mensaje genérico` | `HttpResponse.error()`. | Testing Library + MSW |
| `durante el envío campos y botón están deshabilitados y no hay segundo POST` | Doble clic y `disabled`. | Testing Library + MSW |
| `ya autenticado se redirige a /inicio` | Navegación sin render del formulario. | Testing Library |
| `con motivo sesionVencida muestra el banner` | Texto de §8. | Testing Library |
| `el toggle de contraseña alterna type y aria-pressed` | `type` cambia y `aria-pressed` se invierte; `aria-label` cambia. | Testing Library |
| `Enter en el campo contraseña envía el formulario` | Un POST. | Testing Library |
| `no renderiza "Foto: sede de atención" ni imágenes del panel` | Ausencia de texto e `img`. | Testing Library |
| `no tiene violaciones de accesibilidad` | Helper de US-FE-T-19 sobre la página completa. | vitest-axe |

## 11. Criterios de aceptación

1. `/login` es accesible sin sesión y responde en el router del backoffice.
2. Los campos Email y Contraseña tienen label visible asociado con `htmlFor`/`id`; ningún placeholder cumple función de label.
3. Al cargar, los dos campos están vacíos.
4. Email vacío, email con formato inválido y contraseña vacía muestran los textos de §8 y no llaman a la API.
5. El email se envía sin espacios al inicio ni al final.
6. El request es `POST /api/auth/login` con body `{ "email", "password" }`.
7. Un 200 guarda `token`, `rol` y `expiraEn` en el store de T-13 y navega a `/inicio`. No se usa `localStorage`.
8. Un 401 muestra "Email o contraseña incorrectos." en un elemento con `role="alert"`, no redirige, vacía la contraseña y enfoca el email.
9. Un 401 de `/api/auth/login` no dispara la redirección global de sesión.
10. Un 400 con `errors.Email` o `errors.Password` marca el campo con `aria-invalid="true"` y `aria-describedby`.
11. Un 5xx o un error de red muestran el mensaje genérico y no se reintenta.
12. Con la petición en curso, campos y botón están deshabilitados y solo sale un POST.
13. Una sesión válida que entra a `/login` queda redirigida a `/inicio`.
14. El botón de contraseña tiene `aria-label` que cambia y `aria-pressed` que alterna.
15. Enter dentro de un campo envía el formulario.
16. La pantalla no renderiza `Foto: sede de atención`, ni `img` en el panel de marca.
17. Los tests de §10 están en verde y el test de axe no tiene violaciones.
18. `npm run lint`, `typecheck`, `test` y `build` están en verde en `apps/backoffice`, sin `any`.
19. `main.tsx` solo suma el bloque de bootstrap de mocks de T-11 (RV-D03): con `VITE_USE_MOCKS=false` no se inicia MSW.

## 12. Verificación manual

Requiere el back local y un usuario de prueba que el equipo confirme (no inventar credenciales).

1. Levantar el back y el backoffice (`VITE_USE_MOCKS=false`, `VITE_API_BASE_URL` apuntando al back).
2. Abrir `http://localhost:5173/login`. Verificar que los campos están vacíos.
3. Pulsar Ingresar sin datos. Ver los dos mensajes de requerido.
4. Escribir `correo-sin-arroba` y ver el mensaje de formato.
5. Ingresar un email real con contraseña incorrecta. Ver "Email o contraseña incorrectos.", el foco en el email y la contraseña vacía.
6. Ingresar credenciales válidas de Empleado. Ver `/inicio`. Recargar la página: la sesión sigue.
7. Abrir `/login` con la sesión activa. Ver que redirige a `/inicio`.
8. Confirmar con la persona responsable los pasos 5 y 6. Esperar su confirmación antes del PR (workflow regla 7).

## 13. Decisiones pendientes (con default)

- [CONFIRMAR] **D-B01-1. Texto del 401.** Default: `Email o contraseña incorrectos.` (texto del Figma, RV-D01 y FB8). El `detail` del back no se muestra. No cerrar sin confirmación del equipo: diseño.
- **D-B01-2. Ruta de origen tras login.** Default: si la ruta llegó desde una guarda con `location.state.from`, vuelve ahí; si no, `/inicio` (B1 §2, propuesta).
- **D-B01-3. Imagen del panel de marca.** Default: sin imagen, fondo `accent/lime-soft`, solo texto (B1 D-6). Pedir el asset a diseño.
- **D-B01-4. Validación.** Default: al enviar y revalidar cada campo al cambiarlo después de un error (B1 §6, propuesta).
- **D-B01-5. Estado "enviando".** Default: campos y botón deshabilitados con `aria-busy`, sin spinner de página (B1 §7, propuesta).
- **D-B01-6. Botón de contraseña.** Default: toggle con `aria-label` y `aria-pressed` (B1 §8 y §12).
- **D-B01-7. Límite de intentos y recuperación.** Default: sin límite local y sin enlace (B1 D-4). No se implementa.
- **D-B01-8. Sesión vencida.** Default: banner con el copy de §8 cuando llega `motivo: sesionVencida`.

## 14. Riesgos y errores comunes

- **Redirección en bucle:** si T-08 trata cualquier 401 como sesión vencida, el login de credenciales inválidas manda a `/login` otra vez. Evitar: excluir la URL de login de `onUnauthorized` y cubrirlo con el test de §10.
- **Guardar el token en `localStorage`** al copiar un ejemplo de otra app: prohibido por FB7.5.
- **Mostrar el texto del back** (en inglés o con prefijos): PB-15 y FC10. Usar solo las claves de `errors` para marcar campos.
- **Placeholder como label:** el primitivo `Input` lo prohíbe (design-system §5.2). Usar `label` siempre.
- **`expiraEn` con `+00:00`:** `new Date(expiraEn)` lo interpreta bien. No parsear a mano.
- **Doble envío:** deshabilitar el botón y mantener `retry: 0`.
- **Rol:** es el string `"Administrador"` o `"Empleado"`. No hay enum numérico en este endpoint.
- **Foco:** tras un error, el foco debe ir al email, no al botón.

## 15. Definición de terminado

- `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` en verde en `apps/backoffice`.
- Accesibilidad revisada con el helper de US-FE-T-19 (test de axe en verde).
- Sin secretos, sin `localStorage` para el token, sin valores de muestra en el código.
- Criterios de §11 tildados, cada uno con evidencia observada (salida de test o captura).

## 16. Observaciones al índice

- Resuelto (RV-D01 / FB8, D-43 del INDEX): el 401 muestra el texto del Figma `Email o contraseña incorrectos.`; el `detail` del back no se muestra. Se confirma con diseño (D-B01-1).
- Resuelto (RV-D04): `loginRequest` lo escribe US-FE-T-32 en `packages/api/src/auth/login.ts`; T-12 queda con los tipos. B-01 declara T-32 y no escribe la función.
- Resuelto (RV-08): `LayoutAcceso` vive en `features/auth/components/LayoutAcceso.tsx`, con dueño B-01 (fila explícita de Ownership). B1 §4 queda para el doc PR aparte (REVISION paso 7).
- Resuelto (triage final, default de la ficha): slot de acción en `Input` para el botón de mostrar contraseña. La ficha asume un wrapper propio de B-01 (§6 paso 6) hasta que T-04 decida. Motivo: no figura en REVISION.md ni en FB8.
- Resuelto (sin acción, REVISION §4): "Puede empezar sin esperar a US-FE-T-16" es correcto; no hay dependencia de código.

