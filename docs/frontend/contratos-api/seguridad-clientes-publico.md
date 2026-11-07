# Contratos API: autenticación y usuarios, clientes y web pública

Contrato del back para el frente. Sigue `docs/frontend/00-decisiones-base.md` (FB4): los estados son **Implementado** (existe en `development`), **En PR #N** o **Especificado** (solo en spec). Los DTO se consumen tal cual los devuelve la API (camelCase).

**Fuentes.** Código de `development` (`backend/Aseguradora.Api/Controllers`, `backend/Aseguradora.Application/Security`, `backend/Aseguradora.Application/Publico`, `backend/Aseguradora.Api/Security`, `backend/Aseguradora.Api/Middleware`, `backend/Aseguradora.Data/Identity`), PR #50 (`gh pr diff 50`, solo lectura) y la spec: `docs/AnalisisBack.md` (§3, §4, §7) y `docs/tareas-divididas.md` (Frente 1, US-F1-01 a US-F1-08).

**Citas.** `ruta:línea`. Las citas marcadas **(PR #50)** son líneas del archivo en la rama de la PR, no de `development`.

**Alcance.** Este documento cubre: login y alta de usuarios, clientes (CU04 y CU05), y la consulta pública de póliza (CU02). No cubre pagos, cupón, factura ni vehículos.

---

## 0. Estado de cada grupo

| Grupo | Estado | Dónde |
|---|---|---|
| Login (`POST /api/auth/login`) | Implementado | `backend/Aseguradora.Api/Controllers/AuthController.cs:21-26` |
| Alta de usuarios (`POST /api/auth/usuarios`) | Implementado | `AuthController.cs:29-41` |
| Consulta pública (`POST /api/publico/consulta`) | Implementado | `backend/Aseguradora.Api/Controllers/PublicoConsultaController.cs:14-20` |
| Alta, validación y previsualización de clientes (`/api/clientes` POST, `POST /{id}/validar-renaper`, `GET /renaper/{dni}`) | Implementado | `backend/Aseguradora.Api/Controllers/ClientesController.cs` |
| Listado, detalle, modificación y baja de clientes | Implementado (US-F1-06, PR #58) | `ClientesController.cs`, `Application/Clientes/ClienteService.cs` y sus DTO |
| Cuenta del cliente (`GET /api/clientes/{id}/cuenta`) | No implementado (PB-28) | Solo propuesta MSW; rail oculto (D-33) |

**Actualización de clientes (2026-11-04, base `8e7df6f`):** `ClientesController` ya está en `development`. §3.4 se contrastó con el código de US-F1-06 (PR #58). Las citas históricas a PR #50 de §3.1/§3.2 describen el origen del contrato de alta/Renaper, no un bloqueo actual de publicación. El resumen real no incluye Renaper ni conteos; esa ampliación continúa pendiente en PB-03.

---

## 1. Convenciones transversales

### 1.1 Formato JSON

- Nombres de propiedad en **camelCase** (`numeroPoliza`, `tamanoPagina`). Los tests usan `JsonSerializerDefaults.Web` y leen claves camelCase: `backend/Aseguradora.Tests/Api/PublicoConsultaControllerTests.cs:164`.
- `DateOnly` → `"yyyy-MM-dd"` (por ejemplo `"2026-11-10"`).
- `DateTimeOffset` (`expiraEn` del login) → ISO 8601 con offset. Sale de `GetUtcNow()`, así que el offset es `+00:00` (`backend/Aseguradora.Api/Security/JwtTokenService.cs:27-28`).
- `DateTime?` (`fechaValidacionRenaper` del cliente): **NO DEFINIDO** si lleva sufijo `Z`. No hay conversor UTC en `backend/Aseguradora.Data` (búsqueda sin resultados), así que no se asume formato. Ver Dudas.
- `decimal` (importes) → número JSON con dos decimales (`12000.00`). Formatear siempre con el formateador de `@nexa/api` (FB4).
- `char` (`sexo`) → string de un carácter (`"M"`, `"F"`, `"X"`).

### 1.2 Formas de error

El front recibe tres formas distintas. Todas usan `Content-Type: application/problem+json` salvo que se indique.

**A. Error de dominio o de aplicación** (`backend/Aseguradora.Api/Middleware/ExceptionMiddleware.cs:33-41`): `ProblemDetails` con `status`, `title`, `detail` (mensaje en español), `instance`, `traceId`. El `type` puede venir `null` o ausente; no fijarse en él.

```ts
export interface ProblemDetails {
  type?: string | null;
  title?: string;
  status: number;
  detail?: string;      // mensaje legible en español, generado por el back
  instance?: string;    // path de la request
  traceId?: string;
}

/** Sólo aparece en los 404 de clientes de PR #50 (ExceptionMiddleware.cs:43-44). */
export interface ProblemDetailsConCodigo extends ProblemDetails {
  codigo?: 'CLIENTE_NO_ENCONTRADO' | 'PERSONA_NO_ENCONTRADA';
}
```

**B. Validación de modelo** (`[ApiController]`, sin `InvalidModelStateResponseFactory` personalizado; búsqueda sin resultados): `ValidationProblemDetails` con `errors`. Las claves de `errors` son el **nombre de la propiedad C# en PascalCase** (`Dni`, `NumeroPoliza`), según `PublicoConsultaControllerTests.cs:119-131`.

```ts
export interface ValidationProblemDetails extends ProblemDetails {
  status: 400;
  errors: Record<string, string[]>; // claves PascalCase: "Dni", "NumeroPoliza", "Email", ...
}
```

**C. Respuestas sin cuerpo de la capa de autenticación** (401 sin token, 403 sin rol): `Program.cs:20-21` declara que se devuelven como ProblemDetails, pero `AuthControllerTests.cs:72-89` sólo valida el status. **No hay `detail` garantizado.** No mostrar texto del back para estos casos; usar mensaje propio del front.

Regla para el front: en 400 con `errors`, mapear por clave y mostrar el mensaje propio del campo. **No mostrar el texto de `errors` tal cual**: muchos mensajes son los default de ASP.NET en inglés (ver sección 4).

### 1.3 Códigos de estado que este contrato usa

| Código | Cuándo aparece en este grupo | Forma |
|---|---|---|
| 200 | login, consulta pública, Renaper y GET/PUT de clientes correctos | cuerpo |
| 204 | baja lógica de cliente correcta (`DELETE /api/clientes/{id}`) | sin cuerpo |
| 201 | alta de usuario (`AuthController.cs:40`), alta de cliente (PR #50, `ClientesController.cs:33`) | cuerpo; el alta de usuario **no** manda `Location` |
| 400 | validación de modelo (B) o regla de negocio (A) | B o A |
| 401 | credenciales inválidas en login (A); token ausente, vencido o inválido en el resto (C) | A o C |
| 403 | rol insuficiente (C) | C |
| 404 | póliza no encontrada o DNI no pertenece (A, mensaje fijo, RN20); cliente o persona inexistente (A + `codigo`, PR #50) | A |
| 429 | límite RN20 de `/api/publico/*` | A |
| 502 | falla o timeout de Renaper (`ExceptionMiddleware.cs:61`) | A |
| 500 | error no controlado (`ExceptionMiddleware.cs:64`): mensaje fijo `"Ocurrió un error inesperado."` (`:14`) | A |
| **409** | **nunca se emite** en este grupo (búsqueda en `backend/` y en el diff de PR #50 sin resultados) | — |
| **422** | **nunca se emite** (misma búsqueda) | — |

**Consecuencia para el front:** un email o DNI duplicado es un **400**, no un 409. Además el back no manda `codigo` para esos casos (`BusinessRuleException` no tiene código, `backend/Aseguradora.Application/Exceptions/BusinessRuleException.cs:3-9`). La única forma de distinguirlo es el texto de `detail`. Ver Dudas D2.

### 1.4 Reintentos y límites

- **RN20 (429):** `/api/publico/*` tiene un límite global por IP de **10 requests por ventana de 60 segundos** (`backend/Aseguradora.Api/Security/PublicoRateLimitExtensions.cs:18-19`, `:53-68`). Es una ventana fija, no deslizante.
  - El contador es **compartido por todas las rutas `/api/publico/*`** (consulta, pagos, cupón, factura).
  - **Cada request cuenta**, incluidas las que dan 400 o 404, porque el limiter corre antes de MVC (`Program.cs:110`).
  - El 429 **no trae `Retry-After`** (`PublicoRateLimitExtensions.cs:74-89`). Cuerpo: `detail` = `"Se superó el límite de intentos. Volvé a intentarlo en un minuto."` (`:25`).
  - **Para el front:** no reintentar automáticamente. Con TanStack Query, `useQuery` reintenta 3 veces por defecto y consumiría el cupo. La consulta es `POST`, así que debe ir en `useMutation` (sin reintentos por defecto) o con `retry: false`.
- Login y alta de usuarios **no** tienen límite (RN20 aplica sólo a `/api/publico`). Ver Dudas D4.

---

## 2. Autenticación y sesión (empleados y administradores)

### 2.1 Modelo de sesión

- Sólo empleados y administradores tienen usuario (RN17, `docs/AnalisisBack.md:226`). Los clientes no tienen login.
- El login devuelve un **JWT** firmado con HS256. Claims: `sub` (id del usuario), `email`, `role` (`backend/Aseguradora.Api/Security/JwtTokenService.cs:30-36`; el claim de rol se llama `role`, `backend/Aseguradora.Api/Security/ClaimsAseguradora.cs:16`).
- Vigencia: `ExpiracionMinutos`, por defecto **480 minutos** (`backend/Aseguradora.Api/Security/JwtOpciones.cs:16`). Es configurable; el front no debe asumir 480 fijo, sino usar `expiraEn`.
- Validación del token: issuer, audience, lifetime y firma; **`ClockSkew = 0`** (`backend/Aseguradora.Api/Security/AuthenticationExtensions.cs:46-57`). Un token vencido cuenta como 401 en el segundo exacto.
- **No hay refresh token ni logout en el servidor.** Cerrar sesión = descartar el token en el cliente. Está fuera de alcance según `docs/tareas-divididas.md:654`.
- **No hay endpoint `/me`.** La respuesta del login no trae nombre ni email. El front puede leer el claim `email` del JWT **sin verificar la firma** (sólo para mostrarlo); la autorización la hace el back.
- Enviar el token como `Authorization: Bearer <token>`. El esquema es `Bearer` (`AuthenticationExtensions.cs:32-36`, `backend/Aseguradora.Api/Security/Politicas.cs`).

### 2.2 Roles

Fuente: `backend/Aseguradora.Application/Security/Roles.cs:8-9`.

```ts
export type RolUsuario = 'Administrador' | 'Empleado';
```

- `Roles.Asignables` = `[Administrador, Empleado]`, en ese orden de privilegio (`Roles.cs:15`). Si una cuenta tiene más de un rol, el login toma el primero de esa lista (`AutenticacionService.cs:36`). Desde la API sólo se crean cuentas con un rol.
- Una cuenta sin rol válido **no puede loguearse**: responde 401 con el mismo mensaje que credenciales incorrectas (`AutenticacionService.cs:36-37`).

### 2.3 Políticas

Fuente: `backend/Aseguradora.Api/Security/AuthenticationExtensions.cs:62-70` y `Politicas.cs`.

| Política | Quién la cumple | Endpoints en este documento |
|---|---|---|
| `Politicas.Empleado` | rol `Empleado` **o** `Administrador` | clientes (PR #50) |
| `Politicas.Admin` | rol `Administrador` | `POST /api/auth/usuarios` |
| anónimo (`AllowAnonymous`) | cualquiera | `POST /api/auth/login`, `POST /api/publico/consulta` |

### 2.4 Qué puede hacer cada rol (en este grupo)

| Acción | Anónimo | Empleado | Administrador | Fuente |
|---|---|---|---|---|
| Login | sí | sí | sí | `AuthController.cs:22` |
| Crear empleado o administrador | 401 | **403** | sí (201) | `AuthController.cs:30`; `AuthControllerTests.cs:72-89` |
| Alta, validación y previsualización de clientes (PR #50) | 401 | sí | sí (igual que Empleado) | `ClientesController.cs:16`; spec `tareas-divididas.md:761` |
| Listado, detalle, modificación y baja de clientes (Especificado) | 401 | sí | sí | `tareas-divididas.md:783-795` |
| Consulta pública de póliza | sí | sí | sí | `PublicoController.cs:12` |

- **Administrador** puede todo lo de Empleado más crear usuarios. Hoy es el único diferencial implementado (la ABM de planes también será sólo Admin, fuera de alcance).
- **Empleado** no puede crear usuarios (403). No puede listar, editar ni dar de baja usuarios porque **esos endpoints no existen**.

### 2.5 Crear usuario de empleado o administrador

#### `POST /api/auth/usuarios`

- **Estado:** Implementado.
- **Política:** `Politicas.Admin` (`AuthController.cs:30`). CU03 (`docs/AnalisisBack.md:140`).
- **Propósito:** crear un empleado o un administrador. Un cliente no puede tener usuario (RN17).

##### Request

```ts
export interface CrearUsuarioRequest {
  email: string;        // obligatorio, formato email, máx. 256
  password: string;     // obligatorio, sin largo mínimo en el DTO; lo fija Identity (ver abajo)
  rol: RolUsuario;      // obligatorio, sólo 'Administrador' | 'Empleado' (exacto, distingue mayúsculas)
  nombre: string;       // obligatorio, máx. 100
  apellido: string;     // obligatorio, máx. 100
}
```

Validaciones del DTO (`backend/Aseguradora.Application/Security/DTOs/CrearUsuarioRequest.cs`):

| Campo | Regla | Línea | Mensaje (`ErrorMessage`) |
|---|---|---|---|
| `email` | requerido | 10 | `"El email es obligatorio."` |
| `email` | formato email | 11 | `"El email no tiene un formato válido."` |
| `email` | máx. 256 | 12 | `"El email no puede superar los 256 caracteres."` |
| `password` | requerido | 14-15 | `"La contraseña es obligatoria."` |
| `rol` | requerido | 16 | `"El rol es obligatorio."` |
| `rol` | valores permitidos `Administrador` o `Empleado` | 17-18 | `"El rol debe ser Administrador o Empleado."` |
| `nombre` | requerido, máx. 100 | 20-21 | `"El nombre es obligatorio."`, `"El nombre no puede superar los 100 caracteres."` |
| `apellido` | requerido, máx. 100 | 23-24 | `"El apellido es obligatorio."`, `"El apellido no puede superar los 100 caracteres."` |

**Contraseña:** el DTO sólo exige que no esté vacía. El resto lo aplica **ASP.NET Identity con sus valores por defecto** (no hay override en el repo: búsqueda de `Password.` y `RequiredLength` sin resultados en `backend/`). Equivale a: largo mínimo 6, al menos una mayúscula, una minúscula, un dígito y un carácter no alfanumérico. Los mensajes en español están en `backend/Aseguradora.Data/Identity/IdentityErrorDescriberEspanol.cs:76-98`. Si hay varios fallos, llegan **todos en un solo `detail`, separados por espacio** (`IdentityUsuarioStore.cs:99-100`). El front no puede validar el password sin reproducir esas reglas; conviene mostrar el requisito y dejar que el back responda.

Ejemplo:

```json
{
  "email": "empleado.nuevo@ejemplo.com",
  "password": "Clave_Segura1!",
  "rol": "Empleado",
  "nombre": "Ana",
  "apellido": "Gómez"
}
```

##### Response 201

```ts
export interface UsuarioResponse {
  id: string;        // Identity id (string, no GUID tipado)
  email: string;
  rol: RolUsuario;
}
```

No incluye password ni entidad (`backend/Aseguradora.Application/Security/DTOs/UsuarioResponse.cs:7`; `AuthControllerTests.cs:102-107`).

```json
{
  "id": "6f1c0a3e-2b8d-4f7a-9c11-0a2b3c4d5e6f",
  "email": "empleado.nuevo@ejemplo.com",
  "rol": "Empleado"
}
```

##### Errores

| Status | Cuándo | Forma | Mensaje (`detail` o `errors`) |
|---|---|---|---|
| 400 | campo faltante, email inválido, rol fuera de la lista, largo excedido | B (`errors`) | mensajes de la tabla de validaciones (español) o **default de ASP.NET en inglés** para atributos sin `ErrorMessage` (ver sección 4) |
| 400 | email ya registrado | A | `"El email ya está registrado."` (`backend/Aseguradora.Application/Security/AutenticacionService.cs:13,55-56`) |
| 400 | password que no cumple la política de Identity | A | textos de `IdentityErrorDescriberEspanol.cs` unidos por espacio |
| 401 | sin token | C | — |
| 403 | token de Empleado | C | — |
| 500 | error no previsto | A | `"Ocurrió un error inesperado."` |

**Notas para el front**
- 400 con `errors`: marcar el campo y mostrar el mensaje propio. 400 con `detail`: mostrar `detail` en el formulario (es texto en español del back).
- El email duplicado **no se distingue por código** del resto de los 400 (Dudas D2). Hay que comparar `detail` con `"El email ya está registrado."`, o mejor mostrar el `detail` sin lógica adicional.
- Si la asignación de rol falla, el back borra el usuario recién creado (`IdentityUsuarioStore.cs:80-85`). No queda usuario sin rol.
- Un 401 aquí significa token ausente o vencido: cerrar sesión y volver al login.

---

### 2.6 Login

#### `POST /api/auth/login`

- **Estado:** Implementado.
- **Política:** `[AllowAnonymous]` (`AuthController.cs:22`). CU01 (`docs/AnalisisBack.md:138`).
- **Propósito:** validar credenciales de empleado o administrador y devolver el JWT con su rol.

##### Request

```ts
export interface LoginRequest {
  email: string;     // obligatorio, formato email
  password: string;  // obligatorio, sin validación de largo
}
```

Validaciones (`backend/Aseguradora.Application/Security/DTOs/LoginRequest.cs`): `email` requerido (línea 7, `"El email es obligatorio."`) y formato email (línea 8, `"El email no tiene un formato válido."`); `password` requerido (líneas 10-11, `"La contraseña es obligatoria."`).

```json
{
  "email": "empleado@ejemplo.com",
  "password": "Clave_Segura1!"
}
```

##### Response 200

```ts
export interface LoginResponse {
  token: string;     // JWT, "Bearer" en el header Authorization
  rol: RolUsuario;   // claim role
  expiraEn: string;  // ISO 8601 UTC con offset, ej. "2026-11-01T08:00:00+00:00"
}
```

No trae datos personales (`backend/Aseguradora.Application/Security/DTOs/LoginResponse.cs:3-7`).

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZjFj...(truncado)",
  "rol": "Administrador",
  "expiraEn": "2026-11-01T08:00:00+00:00"
}
```

##### Errores

| Status | Cuándo | Forma | Mensaje |
|---|---|---|---|
| 400 | email vacío o con formato inválido, o password vacío | B | `errors.Email` / `errors.Password` con los mensajes de `LoginRequest.cs` |
| 401 | email inexistente **o** password incorrecta **o** cuenta sin rol válido | A | `"Credenciales inválidas."` (`backend/Aseguradora.Application/Exceptions/CredencialesInvalidasException.cs:9`) |
| 500 | error no previsto | A | `"Ocurrió un error inesperado."` |

El 401 es **idéntico** para email inexistente y password incorrecta. El back ejecuta el mismo trabajo de hash en ambos casos (`AutenticacionService.cs:27-32`) y `AuthControllerTests.cs:65-68` verifica el mismo `detail`.

**Notas para el front**
- Este 401 es de **credenciales**: mostrar "credenciales inválidas" en el formulario. No redirigir.
- Un 401 de **otro** endpoint es de **sesión** (token vencido o inválido): borrar el token y volver al login. Distinguir por URL, no por status.
- Guardar `expiraEn` y cerrar sesión al llegar (ClockSkew es 0, así que conviene un margen de 5 segundos). Esto es recomendación, no requisito del back.
- No hay límite de intentos en el login (Dudas D4).

---

## 3. Clientes (CU04 y CU05)

Todos los endpoints de clientes requieren `Politicas.Empleado` (rol Empleado o Administrador). Los clientes **no tienen usuario** (RN17): nunca se loguean ni llaman a estos endpoints.

### 3.1 Alta de cliente con validación Renaper

#### `POST /api/clientes`

- **Estado:** Implementado en `development` (US-F1-05, PR #50 mergeada).
- **Política:** `Politicas.Empleado` (PR #50 `ClientesController.cs:16`).
- **Propósito:** dar de alta un cliente. Si Renaper conoce el DNI, sus datos pisan los cargados a mano (RN02).

##### Request

```ts
export type SexoCliente = 'M' | 'F' | 'X';

export interface ClienteAltaRequest {
  dni: string;               // obligatorio, regex ^\d{8}$
  email: string;             // obligatorio, formato email, máx. 150
  telefono?: string | null;  // opcional, máx. 20, sin formato
  nombre: string;            // obligatorio, máx. 100 (Renaper lo pisa si valida)
  apellido: string;          // obligatorio, máx. 100 (Renaper lo pisa si valida)
  cuil: string;              // obligatorio, regex ^\d{11}$
  fechaNacimiento: string;   // obligatorio, "yyyy-MM-dd" (DateOnly)
  sexo: SexoCliente;         // obligatorio, 'M' | 'F' | 'X' (el service acepta minúscula y la pasa a mayúscula)
  calle: string;             // obligatorio, máx. 150
  numero: string;            // obligatorio, máx. 20
  localidad: string;         // obligatorio, máx. 100
  provincia: string;         // obligatorio, máx. 100
  codigoPostal: string;      // obligatorio, máx. 10
}
```

Validaciones del DTO (PR #50, `backend/Aseguradora.Application/Clientes/DTOs/ClienteAltaRequest.cs`, líneas en el archivo de la PR):

| Campo | Regla | Línea | Mensaje |
|---|---|---|---|
| `dni` | requerido | 12 | default ASP.NET (inglés) |
| `dni` | `^\d{8}$` | 13 | `"El DNI debe tener 8 dígitos."` |
| `email` | requerido; `[EmailAddress]`; máx. 150 | 17-19 | `[EmailAddress]` y `MaxLength` sin mensaje: default ASP.NET (inglés) |
| `telefono` | máx. 20 | 23 | default ASP.NET |
| `nombre` / `apellido` | requeridos; máx. 100 | 27-28, 32-33 | default ASP.NET |
| `cuil` | requerido; `^\d{11}$` | 37-38 | `"El CUIL debe tener 11 dígitos."` |
| `fechaNacimiento` | requerido | 42 | default ASP.NET |
| `sexo` | requerido (`char?`) | 46-47 | default ASP.NET. Valores fuera de M/F/X los rechaza el service, no el DTO |
| `calle`, `numero`, `localidad`, `provincia`, `codigoPostal` | requeridos; máx. 150 / 20 / 100 / 100 / 10 | 50-71 | default ASP.NET |

Reglas de negocio aplicadas en `ClienteService.AltaAsync` (PR #50, `backend/Aseguradora.Application/Clientes/ClienteService.cs`): ver sección 3.1.1.

Ejemplo:

```json
{
  "dni": "45123456",
  "email": "lucia.fernandez@ejemplo.com",
  "telefono": "3815550123",
  "nombre": "Lucía",
  "apellido": "Fernández",
  "cuil": "27451234564",
  "fechaNacimiento": "2010-07-12",
  "sexo": "F",
  "calle": "Rivadavia",
  "numero": "456",
  "localidad": "Yerba Buena",
  "provincia": "Tucumán",
  "codigoPostal": "4107"
}
```

##### Response 201

```ts
export interface ClienteResponse {
  id: string;                          // Guid
  dni: string;
  cuil: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;             // "yyyy-MM-dd"
  sexo: SexoCliente;
  email: string;
  telefono: string | null;
  calle: string;
  numero: string;
  localidad: string;
  provincia: string;
  codigoPostal: string;
  validadoRenaper: boolean;            // RN02
  fechaValidacionRenaper: string | null; // RN16, formato NO DEFINIDO (ver Dudas D8)
  activo: boolean;                     // RN15
}
```

PR #50 `backend/Aseguradora.Application/Clientes/DTOs/ClienteResponse.cs:23-40` (record). El `Location` del 201 es `/api/clientes/{id}` (`ClientesController.cs:33`).

```json
{
  "id": "b7d2e8a1-4c3f-4e9a-8d21-5f6a7b8c9d0e",
  "dni": "30123456",
  "cuil": "20301234565",
  "nombre": "Juan Carlos",
  "apellido": "Pérez",
  "fechaNacimiento": "1985-03-21",
  "sexo": "M",
  "email": "juan.perez@ejemplo.com",
  "telefono": null,
  "calle": "San Martín",
  "numero": "1234",
  "localidad": "San Miguel de Tucumán",
  "provincia": "Tucumán",
  "codigoPostal": "4000",
  "validadoRenaper": true,
  "fechaValidacionRenaper": "2026-10-15T00:00:00",
  "activo": true
}
```

El ejemplo de `fechaValidacionRenaper` sin `Z` es el formato que sale de `DateTime` sin conversor; **no está verificado en ejecución** (Dudas D8).

#### 3.1.1 Reglas que disparan 400 en el alta

Orden de evaluación en `ClienteService.AltaAsync` (`ClienteService.cs:49-81`, PR #50):

| Orden | Condición | Línea (PR #50) | Status | `detail` exacto | RN |
|---|---|---|---|---|---|
| 1 | DNI no tiene 8 dígitos ASCII (tras trim) | 55 | 400 | `"El DNI debe tener 8 dígitos."` | (inalcanzable por HTTP: el DTO ya lo rechaza sin trim; ver nota) |
| 2 | sexo fuera de M/F/X | 60 | 400 | `"El sexo debe ser M, F o X."` | — |
| 3 | fecha de nacimiento ausente | 63 | 400 | `"La fecha de nacimiento es obligatoria."` | (inalcanzable: el DTO la exige) |
| 4 | ya existe cliente con ese DNI | 66 | 400 | `"RN01: Ya existe un cliente con el DNI '{dni}'."` | RN01 |
| 5 | ya existe cliente con ese email (sin distinguir mayúsculas) | 69 | 400 | `"RN01: Ya existe un cliente con el email '{email}'."` | RN01 |
| 6 | Renaper dice FALLECIDO | 74 | 400 | `"RN02: La persona figura como fallecida en Renaper."` | RN02 |
| 7 | Renaper responde sin datos para ese DNI | 77 | 400 | `"El DNI '{dni}' no figura en Renaper."` | RN02 |
| 8 | menor de 18 años (fecha de Renaper si existe, si no la tipeada) | 81 | 400 | `"RN01: El cliente debe tener 18 años o más."` | RN01 |

**Renaper caído (no es error):** si Renaper falla con `ExternalServiceException`, el service **igual crea el cliente** con `validadoRenaper = false` y los datos tipeados (`ClienteService.cs:179-184`, regla C8). Responde **201**. El front no recibe un aviso distinto: debe leer `validadoRenaper` y ofrecer el reintento vía `POST /api/clientes/{id}/validar-renaper`.

**Nota sobre el paso 1:** la comparación es sobre `request.Dni.Trim()` (`ClienteService.cs:53`), pero el regex del DTO no hace trim. Un DNI con espacios al costado da 400 por el DTO con el mensaje del regex (`errors.Dni`), antes de llegar al service.

**Estados de error sin cuerpo que no cambian:** 401 (token ausente o inválido) y 403 (token sin rol Empleado ni Administrador).

**Notas para el front**
- Los cuatro 400 de negocio (pasos 4 a 8) son `detail` sin `codigo`. Para mostrar el mensaje en el campo correcto hay que comparar texto (Dudas D2).
- Enviar `sexo` como un solo carácter. Un valor como `"Masculino"` da error de conversión JSON, no de negocio.
- El back **pisa** nombre, apellido, cuil, fecha de nacimiento, sexo y domicilio con los datos de Renaper cuando valida (`AplicarDatosRenaper`, definido en `ClienteService.cs:199`, invocado en `:104-105`). Si el front quiere mostrar el dato cargado y el dato final, el dato final es el de la respuesta.

### 3.2 Reintentar validación Renaper

#### `POST /api/clientes/{id}/validar-renaper`

- **Estado:** Implementado en `development` (`ClientesController.ValidarRenaper`).
- **Política:** `Politicas.Empleado`.
- **Request:** sin cuerpo. `id` en la ruta, tipo `Guid` (`{id:guid}`; un valor que no es Guid no llega al service y responde 404 del routing).
- **Response 200:** `ClienteResponse` (sección 3.1).
- **Propósito:** reintentar la validación cuando Renaper estuvo caído (CU04). Si responde VIGENTE, marca `validadoRenaper = true`, refresca los datos y guarda `fechaValidacionRenaper` (RN02, RN16).

| Status | Cuándo | Forma | `detail` / `codigo` |
|---|---|---|---|
| 400 | Renaper no tiene el DNI del cliente | A | `"El DNI '{dni}' no figura en Renaper."` (`ClienteService.cs:131`) |
| 400 | Renaper dice FALLECIDO (RN02) | A | `"RN02: La persona figura como fallecida en Renaper."` (`:134`) |
| 400 | menor de 18 años (RN01) | A | `"RN01: El cliente debe tener 18 años o más."` (`:137`) |
| 401 | sin token | C | — |
| 404 | el `id` no existe | A + `codigo` | `"El cliente {id} no existe."`, `codigo: "CLIENTE_NO_ENCONTRADO"` (`:128`) |
| 502 | Renaper caído o timeout (`ExternalServiceException`) | A | mensaje de la excepción de Integrations; **texto no fijo** |

**Nota:** en este endpoint, "no figura en Renaper" es **400**. En `GET /renaper/{dni}` la misma situación es **404** con otro `codigo` (sección 3.3). El front debe usar el endpoint correcto para cada caso, no reutilizar un único manejo de error.

### 3.3 Previsualizar datos de Renaper

#### `GET /api/clientes/renaper/{dni}`

- **Estado:** Implementado en `development` (`ClientesController.PreviewRenaper`).
- **Política:** `Politicas.Empleado`.
- **Request:** sin cuerpo. `dni` en la ruta; el back valida 8 dígitos ASCII después del trim (`ClienteService.cs:161-163`, no con regex ni atributo de ruta).
- **Propósito:** cargar el formulario de alta con los datos de Renaper antes de guardar (CU04).

```ts
export interface PersonaRenaperResponse {
  dni: string;
  cuil: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;          // "yyyy-MM-dd"
  sexo: SexoCliente;
  domicilio: DomicilioRenaperResponse;
  estado: 'VIGENTE' | 'FALLECIDO';  // texto fijo generado por el back (ClienteService.cs:247)
  fechaFallecimiento: string | null; // "yyyy-MM-dd", sólo si está fallecido
}

export interface DomicilioRenaperResponse {
  calle: string;
  numero: string;
  piso: string | null;     // opcional según Renaper
  depto: string | null;    // opcional según Renaper
  localidad: string;
  provincia: string;
  codigoPostal: string;
}
```

Fuente: `backend/Aseguradora.Application/Clientes/DTOs/PersonaRenaperResponse.cs:13-41` (PR #50).

```json
{
  "dni": "30123456",
  "cuil": "20301234565",
  "nombre": "Juan Carlos",
  "apellido": "Pérez",
  "fechaNacimiento": "1985-03-21",
  "sexo": "M",
  "domicilio": {
    "calle": "San Martín",
    "numero": "1234",
    "piso": null,
    "depto": null,
    "localidad": "San Miguel de Tucumán",
    "provincia": "Tucumán",
    "codigoPostal": "4000"
  },
  "estado": "VIGENTE",
  "fechaFallecimiento": null
}
```

| Status | Cuándo | Forma | `detail` / `codigo` |
|---|---|---|---|
| 400 | DNI con formato inválido (no 8 dígitos) | A | `"El DNI debe tener 8 dígitos."` (`ClienteService.cs:163`) |
| 401 | sin token | C | — |
| 404 | Renaper no conoce el DNI | A + `codigo` | `"El DNI '{dni}' no figura en Renaper."`, `codigo: "PERSONA_NO_ENCONTRADA"` (`ClienteService.cs:166`) |
| 502 | Renaper caído o timeout | A | mensaje de la excepción; **texto no fijo** |

**Nota:** el back **no** valida el formato del DNI en la ruta con regex; lo hace el service. Un DNI de 7 dígitos da 400 `"El DNI debe tener 8 dígitos."`. El front debe validar antes de llamar.

**Nota:** `GET` con DNI en la URL. Es un dato personal en la URL. Así lo define la PR, no es una decisión del front, pero conviene saberlo para logs de proxy.

**Nota:** un fallecido **no** da error acá: devuelve `estado: "FALLECIDO"` y el front debe mostrarlo (el error de RN02 sale recién en el alta).

### 3.4 Listado, detalle, modificación y baja de clientes

**Estado: Implementado** en `development`, US-F1-06, PR #58. Fuentes: `backend/Aseguradora.Api/Controllers/ClientesController.cs` y `backend/Aseguradora.Application/Clientes/DTOs/` (`ClienteFiltro.cs`, `ClienteResumenResponse.cs`, `ClienteModificacionRequest.cs`, `ClienteResponse.cs`). Reglas: `ClienteService.cs`.

| Método | Ruta | Política | Respuesta |
|---|---|---|---|
| GET | `/api/clientes` | `Politicas.Empleado` | 200 `PaginaResponse<ClienteResumenResponse>`, solo activos |
| GET | `/api/clientes/{id}` | `Politicas.Empleado` | 200 `ClienteResponse`; 404 para inexistente/inactivo |
| PUT | `/api/clientes/{id}` | `Politicas.Empleado` | 200 `ClienteResponse` actualizado, solo contacto/domicilio |
| DELETE | `/api/clientes/{id}` | `Politicas.Empleado` | 204 sin cuerpo; baja lógica |

Tipos del contrato real (camelCase):

```ts
export interface ClienteFiltro {
  dni?: string;          // exacto, ignora espacios laterales
  apellido?: string;     // contiene, sin distinguir mayúsculas ni espacios laterales
  pagina?: number;       // default 1, rango 1..21474836
  tamanoPagina?: number; // default 20, rango 1..100
}

// Importar desde @nexa/api; tipo común de T-12, no redefinir en el dominio.
export interface PaginaResponse<T> {
  items: T[];
  pagina: number;
  tamanoPagina: number;
  total: number;
}

export interface ClienteResumenResponse {
  id: string;
  dni: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  activo: boolean;
}

export interface ClienteModificacionRequest {
  email: string;
  telefono?: string | null;
  calle: string;
  numero: string;
  localidad: string;
  provincia: string;
  codigoPostal: string;
}
```

- Orden estable del listado: apellido, nombre y DNI. Página fuera del total: `items: []`, conservando `total`.
- Paginación fuera de rango: 400 de validación (forma B), con claves `Pagina`/`TamanoPagina`; no exigir `detail`.
- El resumen **no contiene** `validadoRenaper`, `cantidadVehiculos` ni `cantidadPolizasActivas`. Pendiente parcial PB-03; no incluirlos artificialmente en el DTO o mock actual. El detalle sí devuelve `validadoRenaper`.
- GET detalle, PUT y DELETE de inexistente/inactivo: 404 con `codigo: CLIENTE_NO_ENCONTRADO` y `detail`.
- PUT: DataAnnotations de `ClienteModificacionRequest.cs` generan 400 con `errors`. Email de otro cliente (incluido uno inactivo) genera 400 de negocio con `detail`, sin modificar datos. Se recortan contacto/domicilio; teléfono vacío u omitido se normaliza a null.
- DNI, nombre y datos Renaper no forman parte del PUT. El cuerpo recibido se envía sin agregar campos desde el front.
- Baja bloqueada con 400 cuando hay póliza Pendiente, Vigente o Suspendida. Baja repetida: 404. El cliente inactivo deja de aparecer en la lista.
- Autenticación JWT: Empleado o Administrador. Sin sesión válida: 401; sin rol admitido: 403 (forma C).
- `/api/clientes/{id}/cuenta` no existe: PB-28 conserva su propuesta solo MSW y el rail oculto (D-33).

---

## 4. Validaciones y mensajes

Regla general: el back valida en **dos capas**. La primera son los atributos del DTO (400 con `errors`). La segunda son reglas del service (400 con `detail`). Un mismo campo puede fallar en las dos.

### 4.1 Formatos de identificación

| Dato | Regla exacta del back | Dónde | Notas para el front |
|---|---|---|---|
| **DNI** (consulta pública) | `^\d{8}$` | `backend/Aseguradora.Application/Publico/DTOs/ConsultaPublicaRequest.cs:10` | Exactamente 8 dígitos ASCII. **Sin trim**: un espacio al costado da 400. Recortar antes de enviar. |
| **DNI** (alta de cliente) | `^\d{8}$` | PR #50 `ClienteAltaRequest.cs:13` | Igual. El service además hace trim y revalida (`ClienteService.cs:197`). |
| **DNI** (previsualización) | sólo lo valida el service: 8 caracteres, todos dígitos ASCII (`ClienteService.cs:197`) | PR #50 | Sin atributo de ruta. Mismo resultado en la práctica. |
| **CUIL** | `^\d{11}$` | PR #50 `ClienteAltaRequest.cs:38` | **Sólo 11 dígitos. No valida dígito verificador.** Un CUIL mal armado pasa. Ver D6. |
| **Número de póliza** | `^POL-\d{7}$` | `ConsultaPublicaRequest.cs:15` | **Distingue mayúsculas.** `pol-0000001` da 400. Normalizar a mayúsculas en el front. No hay trim: un espacio da 400. |
| **Email** (login, alta de usuario, alta de cliente) | `[EmailAddress]` de .NET | `LoginRequest.cs:8`, `CrearUsuarioRequest.cs:11`, PR #50 `ClienteAltaRequest.cs:18` | El validador de .NET es menos estricto que `zod.email()`: acepta más formatos y no verifica dominio. Si el front usa zod, puede rechazar algo que el back acepta. Usar zod sólo como ayuda visual. |
| **Email**, largo | máx. 256 (usuario); máx. 150 (cliente, PR #50 línea 19) | `CrearUsuarioRequest.cs:12`; PR #50 | Distinto límite según el endpoint. |
| **Teléfono** | máx. 20 caracteres (PR #50 línea 23). **Sin formato.** | PR #50 `ClienteAltaRequest.cs:22-23` | Cualquier texto de hasta 20 caracteres. Opcional: `null` o vacío se guarda como `null` (`ClienteService.cs:88`). |
| **Sexo** | un carácter `M`, `F` o `X` | PR #50 `ClienteService.cs:58-60` | El service pasa a mayúscula, así que `m` se acepta. Cualquier otro carácter: 400. |
| **Fecha de nacimiento** | `DateOnly` obligatorio, `"yyyy-MM-dd"`. Edad mínima 18 (RN01) | PR #50 `ClienteAltaRequest.cs:42-43`, `ClienteService.cs:81` | La edad se calcula en zona horaria de Argentina (`ClienteService.cs:189`). |
| **Password** | sólo no vacía (DTO); política de Identity por defecto | `CrearUsuarioRequest.cs:14-15`, `IdentityErrorDescriberEspanol.cs:76-98` | Ver sección 2.5. |

### 4.2 Mensajes por defecto de ASP.NET (en inglés)

Los atributos sin `ErrorMessage` producen mensajes en inglés que el back **no** traduce. Ejemplos de la forma (no copiar literal):

- `The Dni field is required.`
- `The field Nombre must be a string or array type with a maximum length of '100'.`
- `The Email field is not a valid e-mail address.`

Afectan a: todos los campos de `ClienteAltaRequest` salvo DNI y CUIL (PR #50, `ClienteAltaRequest.cs`); `[Required]` de `ConsultaPublicaRequest` (`ConsultaPublicaRequest.cs:9,14`); `[Required]`, `[EmailAddress]` y `[MaxLength]` del alta de cliente.

**Regla para el front:** mapear por clave de `errors` y mostrar su propio texto en español. No mostrar `errors[...][0]` tal cual.

### 4.3 Errores de JSON (no de validación)

Un tipo mal formado (por ejemplo `sexo` como número, o `fechaNacimiento` con formato `dd/mm/yyyy`) falla **antes** de los validadores, en la deserialización. El back responde 400 con `ValidationProblemDetails` cuyo `errors` puede tener la clave del campo con un mensaje técnico de ASP.NET. Mismo tratamiento que 4.2.

---

## 5. Reglas de negocio visibles al usuario

Códigos tomados de `docs/AnalisisBack.md` §4 y de los comentarios de código. Cada RN indica dónde se ve.

| RN | Regla | Dónde se ve en la API | Fuente |
|---|---|---|---|
| **RN01** | DNI y email de cliente son únicos; el cliente debe tener 18 años o más. | 400 en alta (`"RN01: Ya existe un cliente con el DNI '...'."`, `"RN01: Ya existe ... email ..."`, `"RN01: El cliente debe tener 18 años o más."`). También en PUT de clientes (Especificado). | `AnalisisBack.md:180`; PR #50 `ClienteService.cs:66,69,81` |
| **RN02** | Antes de emitir una póliza, el cliente debe estar validado en Renaper (existe y no está fallecido). Los datos de Renaper pisan los cargados a mano. | 400 en alta y en validar-renaper por fallecido o no figura; `validadoRenaper` en la respuesta; datos pisados en la respuesta. La validación para emitir la póliza es de frente 3 (fuera de alcance). | `AnalisisBack.md:181`; PR #50 `ClienteService.cs:74,77,134,199` |
| **RN10** | Sólo una póliza **Vigente** da cobertura. | `coberturaVigente: true` sólo si `estado === 'VIGENTE'`. | `AnalisisBack.md:206`; `backend/Aseguradora.Application/Publico/ConsultaPublicaService.cs:31` |
| **RN15** | No se borran físicamente clientes; baja lógica `activo = false`. | `activo` en `ClienteResponse`. DELETE es Especificado. | `AnalisisBack.md:224`; PR #50 `ClienteService.cs` (Activo = true al alta) |
| **RN16** | Fechas en UTC. | `fechaValidacionRenaper` (formato no fijado, Dudas D8). | `AnalisisBack.md:225`; PR #50 `ClienteService.cs:100` |
| **RN17** | Roles Administrador y Empleado. Los clientes no tienen usuario. | Login sólo para empleados y admins. | `AnalisisBack.md:226` |
| **RN20** | La consulta pública exige DNI **y** número de póliza, y deben corresponder a la misma póliza. Si no, "no encontrada" sin decir cuál falló. Límite de 10 intentos por minuto por IP. | 404 con mensaje fijo; 429 con el mensaje de sección 1.4. | `AnalisisBack.md:228`; `backend/Aseguradora.Application/Publico/VerificadorPublico.cs:8-10,18`; `PublicoRateLimitExtensions.cs:18-19` |
| **CU01 / CU03 (RN17)** | Login con credenciales; sólo admins crean usuarios. | 401 `"Credenciales inválidas."`; 403 para Empleado en alta de usuario. | `CredencialesInvalidasException.cs:9`; `AuthController.cs:30` |

---

## 6. Consulta pública de póliza (CU02)

### 6.1 Cómo se identifica al cliente

Es **sin login**. El cliente ingresa **DNI + número de póliza**. No hay búsqueda por patente, nombre, ni código de cliente. Fuente: `VerificadorPublico.cs:21-29`.

La verificación (`VerificadorPublico.VerificarPolizaAsync`):

1. Busca el cliente por `Dni` exacto (tras `Trim()`), **sin filtrar por `activo`** (`VerificadorPublico.cs:42-47`, la línea 45 no tiene filtro de activo).
2. Busca la póliza por `Numero` exacto (tras `Trim()`) **y** `ClienteId` del cliente encontrado (`:25`).
3. Si cualquiera falla, lanza `NotFoundException` con `MensajeNoEncontrado` (`:18`, `:28`). **Mismo mensaje y mismo status** para DNI inexistente, póliza inexistente o póliza de otro cliente (RN20).

### 6.2 Request

```ts
export interface ConsultaPublicaRequest {
  dni: string;          // ^\d{8}$  (ConsultaPublicaRequest.cs:10)
  numeroPoliza: string; // ^POL-\d{7}$  (ConsultaPublicaRequest.cs:15)
}
```

Mensajes del DTO (en español, `ConsultaPublicaRequest.cs:10,15`):
- `dni` ausente o vacío: default de ASP.NET (inglés, `[Required]`, línea 9).
- `dni` con formato inválido: `"El DNI debe tener 8 dígitos."`
- `numeroPoliza` ausente o vacío: default de ASP.NET (inglés, línea 14).
- `numeroPoliza` con formato inválido: `"El número de póliza debe tener el formato POL-0000000."`

```json
{
  "dni": "30123456",
  "numeroPoliza": "POL-0000001"
}
```

**Endpoint:** `POST /api/publico/consulta`. **Estado:** Implementado. **Política:** anónimo (`PublicoController.cs:12`). **POST** por diseño (`docs/AnalisisBack.md:554`): el DNI viaja en el cuerpo, no en la URL.

### 6.3 Response 200

```ts
export type EstadoPoliza = 'PENDIENTE' | 'VIGENTE' | 'SUSPENDIDA' | 'CANCELADA' | 'VENCIDA';
export type EstadoCuota = 'PENDIENTE' | 'VENCIDA' | 'PAGADA' | 'ANULADA';

export interface ConsultaPublicaResponse {
  numeroPoliza: string;
  estado: EstadoPoliza;      // estado guardado en la base
  coberturaVigente: boolean; // true sólo si estado === 'VIGENTE' (RN10)
  vigenteDesde: string;      // "yyyy-MM-dd"
  vigenteHasta: string;      // "yyyy-MM-dd"
  plan: PlanPublico;
  vehiculo: VehiculoPublico;
  cuotas: CuotaPublica[];    // ordenadas por numero ascendente
}

export interface PlanPublico {
  codigo: string;
  nombre: string;
}

export interface VehiculoPublico {
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
}

export interface CuotaPublica {
  idCuota: string;       // Guid. El único id expuesto; lo necesita POST /api/publico/pagos
  numero: number;        // 1..N
  importe: number;
  recargo: number;       // 0 hasta que la cuota venza (RN08)
  total: number;         // importe + recargo
  vencimiento: string;   // "yyyy-MM-dd"
  estado: EstadoCuota;
}
```

Fuente: `backend/Aseguradora.Application/Publico/DTOs/ConsultaPublicaResponse.cs:8-32`; mapeo en `ConsultaPublicaService.cs:28-40`. Los strings de `estado` son el nombre del enum en mayúsculas (`ConsultaPublicaService.cs:43`; enums en `backend/Aseguradora.Domain/Enums/EstadoPoliza.cs:5-9` y `EstadoCuota.cs:5-8`).

Ejemplo (datos del seed, `backend/Aseguradora.Data/Seed/SeedData.cs`; coinciden con `PublicoConsultaControllerTests.cs:72-94`):

```json
{
  "numeroPoliza": "POL-0000001",
  "estado": "VIGENTE",
  "coberturaVigente": true,
  "vigenteDesde": "2026-10-15",
  "vigenteHasta": "2027-04-15",
  "plan": { "codigo": "RC", "nombre": "Responsabilidad Civil" },
  "vehiculo": { "patente": "AB123CD", "marca": "Toyota", "modelo": "Corolla XEi", "anio": 2021 },
  "cuotas": [
    {
      "idCuota": "f1000000-0000-0000-0000-000000000001",
      "numero": 1,
      "importe": 12000.00,
      "recargo": 0,
      "total": 12000.00,
      "vencimiento": "2026-11-10",
      "estado": "PAGADA"
    }
    // cuotas 2 a 6 omitidas en el ejemplo
  ]
}
```

**Qué NO devuelve** (`ConsultaPublicaResponse.cs:3-7`, RN20): ids de cliente, de póliza, de vehículo ni de plan; nombre ni apellido del titular; entidades. El test lo verifica con las claves exactas del JSON (`PublicoConsultaControllerTests.cs:150-171`).

### 6.4 Estados posibles de la póliza y de la cuota

**Póliza (`estado`):**

| Valor | Significado para el usuario | `coberturaVigente` |
|---|---|---|
| `PENDIENTE` | emitida, aún sin pagar la cuota 1 (RN07) | `false` |
| `VIGENTE` | con cobertura | `true` |
| `SUSPENDIDA` | con cuotas vencidas impagas (RN09) | `false` |
| `CANCELADA` | cancelada (RN13) | `false` |
| `VENCIDA` | llegó a la fecha de fin (RN14) | `false` |

**Cuota (`estado`):**

| Valor | Significado |
|---|---|
| `PENDIENTE` | sin pagar, todavía no vence |
| `VENCIDA` | sin pagar después del vencimiento; suma recargo del 5 % (RN08, `Cuota.cs:32-39`) |
| `PAGADA` | pagada |
| `ANULADA` | anulada por cancelación de la póliza (RN13) |

**Importante:** la consulta muestra el **estado guardado**. Una cuota que ya venció puede seguir `PENDIENTE` hasta que corra el job de vencimientos (`tareas-divididas.md:916`; Dudas D10).

### 6.5 Errores

| Status | Cuándo | Forma | Mensaje |
|---|---|---|---|
| 400 | DNI o número con formato inválido | B (`errors.Dni` / `errors.NumeroPoliza`) | mensajes de 6.2 |
| 404 | DNI no existe, póliza no existe o póliza de otro cliente (mismo mensaje) | A | `"No se encontró un registro con los datos indicados."` (`VerificadorPublico.cs:18`) |
| 429 | más de 10 requests por minuto desde la misma IP (cualquier ruta `/api/publico/*`) | A | `"Se superó el límite de intentos. Volvé a intentarlo en un minuto."` (`PublicoRateLimitExtensions.cs:25`) |
| 500 | error no previsto | A | `"Ocurrió un error inesperado."` |

El 404 **no** lleva `codigo` (`NotFoundException` sin código, `VerificadorPublico.cs:28`).

**Notas para el front**
- Un 400 también consume cupo del 429 (sección 1.4). Validar formato en el cliente antes de enviar.
- Con el 404 **no** se puede saber si falló el DNI o el número. Esto es intencional (RN20): no mostrar hints como "el DNI es correcto".
- Para mostrar "póliza inexistente" vs "DNI mal escrito" no hay forma. Un solo mensaje para ambos.
- `cuotas[].idCuota` se usa en `POST /api/publico/pagos` (fuera de alcance de este documento).

---

## 7. Reglas de validación del DTO resumidas

Para `@nexa/api` y los schemas zod del front:

```ts
// Espejo de las reglas del back. Son ayuda visual: el back es la fuente de verdad.
export const REGEX_DNI = /^\d{8}$/;                 // ConsultaPublicaRequest.cs:10; ClienteAltaRequest.cs:13
export const REGEX_CUIL = /^\d{11}$/;               // ClienteAltaRequest.cs:38 (PR #50). No verifica dígito verificador.
export const REGEX_NUMERO_POLIZA = /^POL-\d{7}$/;   // ConsultaPublicaRequest.cs:15 (distingue mayúsculas)
export const MAX_EMAIL_USUARIO = 256;               // CrearUsuarioRequest.cs:12
export const MAX_EMAIL_CLIENTE = 150;               // ClienteAltaRequest.cs:19 (PR #50)
export const MAX_TELEFONO = 20;                     // ClienteAltaRequest.cs:23 (PR #50)
export const MAX_NOMBRE_USUARIO = 100;              // CrearUsuarioRequest.cs:21
export const ROLES = ['Administrador', 'Empleado'] as const; // Roles.cs:8-9
export const SEXOS = ['M', 'F', 'X'] as const;      // ClienteService.cs:58-60 (PR #50)
export const EDAD_MINIMA = 18;                      // ClienteService.cs:28 (PR #50)
export const RN20_INTENTOS_POR_MINUTO = 10;         // PublicoRateLimitExtensions.cs:18
```

---

## 8. Dudas

Ninguna de estas bloquea el contrato documentado. Cada una dice qué asume el front hoy.

- **D1. Sin `codigo` para 400 de negocio.** Los 400 de `BusinessRuleException` no traen código estable (`BusinessRuleException.cs:3-9`); el front depende del texto de `detail`. *Propuesta del back a decidir:* agregar un `codigo` también a `BusinessRuleException` (mismo mecanismo que `NotFoundException.Codigo`). *Hoy:* el front compara texto o muestra `detail` sin lógica.
- **D2. Email duplicado = 400 genérico.** Sin código, no hay forma de marcar el campo `email` sin comparar `"El email ya está registrado."` (usuarios) o `"RN01: Ya existe un cliente con el email '...'."` (clientes). *Asunción:* el front muestra `detail` en el formulario.
- **D3. 401 y 403 sin `detail` garantizado.** `Program.cs:20-21` dice que son ProblemDetails, pero los tests sólo validan el status (`AuthControllerTests.cs:72-89`). *Asunción:* mensaje propio en el front.
- **D4. Login sin límite de intentos ni bloqueo.** RN20 cubre sólo `/api/publico` (`PublicoRateLimitExtensions.cs:55`). Bloqueo por intentos: "no está en la spec; no se implementa" (`tareas-divididas.md:629`). *Asunción:* no hay protección contra fuerza bruta en el login.
- **D5. Usuarios sólo tiene POST.** No hay listado, detalle, edición, baja ni cambio de password de usuarios. §7 de la spec sólo lista `POST /usuarios` (`AnalisisBack.md:465-470`). **NO DEFINIDO** para el resto. *Asunción:* la pantalla de usuarios, si existe, se limita a alta.
- **D6. CUIL sin validación de dígito verificador.** Sólo 11 dígitos (PR #50 `ClienteAltaRequest.cs:38`). La spec tampoco lo define. *Asunción:* el back acepta cualquier 11 dígitos.
- **D7. DNI de 7 dígitos rechazado.** Regex fijo de 8 (`tareas-divididas.md:772` lo propone; `ConsultaPublicaRequest.cs:10`). Personas con DNI de 7 dígitos no pueden consultar ni darse de alta. *Asunción:* la spec decidió 8.
- **D8. Formato de `fechaValidacionRenaper` (UTC).** `DateTime?` sin conversor en `backend/Aseguradora.Data` (búsqueda sin resultados). La spec pide UTC (RN16). **NO DEFINIDO** si sale con `Z` o sin sufijo. *Asunción:* parsear sin confiar en el sufijo; mostrar en zona de Argentina con una función de `@nexa/api`.
- **D9. Consulta pública no filtra clientes inactivos.** `VerificadorPublico.cs:45` no mira `Activo`. Un cliente dado de baja (RN15) podría consultar su póliza. *Asunción:* el back lo permite hoy; la spec no lo prohíbe explícitamente.
- **D10. Estado de cuotas puede estar desactualizado.** La consulta muestra el valor guardado; el job de vencimientos (frente 3) lo cambia (`tareas-divididas.md:916`). *Asunción:* el front muestra el estado tal cual y no recalcula vencimiento ni recargo.
- **D11. Resumen de clientes definido.** US-F1-06 publica siete campos: `id`, `dni`, `nombre`, `apellido`, `email`, `telefono` y `activo`. Los campos adicionales de Renaper y conteos siguen en PB-03; no bloquean el consumo del resumen real.
- **D12. Renaper caído en el alta devuelve 201.** El front sólo sabe por `validadoRenaper: false`. No hay campo de aviso. *Asunción:* mostrar un aviso cuando `validadoRenaper` sea `false` y ofrecer el reintento.
- **D13. `GET renaper/{dni}` con DNI en la URL.** Dato personal en la URL. Es decisión de la PR #50, distinta de la consulta pública (que usa POST). *Asunción:* aceptado, pero conviene confirmarlo con el equipo.
- **D14. Contrato publicado de US-F1-05.** PR #50 está mergeada. Los tres endpoints se verifican contra `ClientesController`, `ClienteService` y los DTO actuales; T-25 agrega pruebas de contrato MSW y reales.
- **D15. Consulta: `cuotas` y `recargo` con importes del seed.** El ejemplo usa `12000.00` del seed (`SeedData.cs`), no un cálculo real. *Asunción:* ningún dato del ejemplo es normativo.

---

## Tabla resumen: endpoint → estado

| Método | Ruta | Estado | Política | Fuente principal |
|---|---|---|---|---|
| POST | `/api/auth/login` | Implementado | anónimo | `AuthController.cs:21-26` |
| POST | `/api/auth/usuarios` | Implementado | `Politicas.Admin` | `AuthController.cs:29-41` |
| POST | `/api/clientes` | En PR #50 | `Politicas.Empleado` | PR #50 `ClientesController.cs:25-30` (archivo línea 25 a 30) |
| POST | `/api/clientes/{id}/validar-renaper` | En PR #50 | `Politicas.Empleado` | PR #50 `ClientesController.cs:39-46` |
| GET | `/api/clientes/renaper/{dni}` | En PR #50 | `Politicas.Empleado` | PR #50 `ClientesController.cs:52-59` |
| GET | `/api/clientes` | Especificado | `Politicas.Empleado` | `docs/tareas-divididas.md:788` |
| GET | `/api/clientes/{id}` | Especificado | `Politicas.Empleado` | `tareas-divididas.md:789` |
| PUT | `/api/clientes/{id}` | Especificado | `Politicas.Empleado` | `tareas-divididas.md:790` |
| DELETE | `/api/clientes/{id}` | Especificado | `Politicas.Empleado` | `tareas-divididas.md:791` |
| POST | `/api/publico/consulta` | Implementado | anónimo + RN20 | `PublicoConsultaController.cs:14-20` |
</content>
