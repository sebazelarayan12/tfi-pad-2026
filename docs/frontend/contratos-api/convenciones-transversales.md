# Convenciones transversales del backend

Contrato común para todo endpoint del back, leído desde el código (`backend/`) y la configuración del repo. Estado de este documento: **Implementado** en el código actual (HEAD `4ba3d4b`, rama de trabajo `docs/frontend-analisis-tareas`).

Convenciones de lectura de este documento:

- `ruta/archivo.cs:línea` es el origen del dato. Las rutas son relativas a la raíz del repo.
- **[CÓDIGO]**: lo define el código fuente.
- **[TEST]**: lo fija un test existente (cita del test).
- **[DEFAULT]**: comportamiento por defecto de ASP.NET Core 8 que el repo no configura. No está probado por un test del repo.
- **[INFERIDO]**: deducción a partir del código. Hay que confirmarla con una respuesta real antes de depender de ella (ver sección 9).
- **NO DEFINIDO**: no se encontró en el código ni en la documentación. Va a la sección 9.

---

## 1. URL base, entornos y configuración del front

### 1.1 Puertos y URLs

| Entorno | URL de la API | Origen |
|---|---|---|
| Producción | `https://api.nexaseguros.me` (Cloudflare Tunnel) | `docs/despliegue.md:20`, `.env.example:65` |
| Local con Docker Compose | `http://localhost:8080` (`API_PORT`, publicado solo en `127.0.0.1`) | `docker-compose.yml:49`, `.env.example:18` |
| Local con `dotnet run` (perfil http) | `http://localhost:5148` | `backend/Aseguradora.Api/Properties/launchSettings.json:17` |
| Local con `dotnet run` (perfil https) | `https://localhost:7158` | `backend/Aseguradora.Api/Properties/launchSettings.json:27` |
| Puerto interno del contenedor | `8080` | `backend/Dockerfile:25` |

Todas las rutas de la API **ya incluyen el prefijo `/api`** (por ejemplo `/api/auth/login`). Por eso la variable del front debe ser solo el **origen**, sin `/api` al final.

### 1.2 Variables de entorno que necesita el front (propuesta)

El front solo necesita la URL base. Las variables `VITE_*` se incrustan en el bundle y son **públicas**: nunca poner en ellas claves, `X-Api-Key` ni secretos.

| Variable propuesta | Ejemplo local | Ejemplo producción | Uso |
|---|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080` | `https://api.nexaseguros.me` | Origen de todas las llamadas HTTP. El cliente HTTP de `@nexa/api` concatena `/api/...` |

Recomendación (no existe todavía en el repo): `vite.config.ts` de cada app con `server: { port: 5173, strictPort: true }` en `backoffice` y `port: 5174, strictPort: true` en `web-publica`. Los puertos deben coincidir con CORS (sección 1.4).

### 1.3 Swagger y health

| Recurso | Cuándo existe | Origen |
|---|---|---|
| `GET /swagger/index.html` (UI) | Desarrollo por defecto. En producción solo si `Swagger:Habilitado=true` | `backend/Aseguradora.Api/Program.cs:95-99`, `docker-compose.yml:11` (`SWAGGER_HABILITADO`, por defecto `false`) |
| `GET /swagger/v1/swagger.json` | Igual que la UI | `backend/Aseguradora.Tests/Api/FaseCeroTests.cs:48,62`, `DespliegueTests.cs:14-28` |
| `GET /health` (anónimo) | Siempre | `backend/Aseguradora.Api/Program.cs:116-117`. Consulta la base (`AddDbContextCheck`, `Program.cs:44`). Responde 200 si está sano y 503 si no (**[DEFAULT]** del health check, cuerpo en texto plano) |

El front **no** debe depender de Swagger en producción. Swagger sirve solo para revisar los contratos en local.

### 1.4 CORS

- Config: `backend/Aseguradora.Api/Program.cs:49-54`. Política por defecto con `WithOrigins(...)`, `AllowAnyHeader()`, `AllowAnyMethod()`.
- **No** tiene `AllowCredentials()`. El front no debe enviar cookies: la autenticación es solo por header `Authorization`.
- **No** tiene `WithExposedHeaders(...)`. Ver sección 9 (headers no legibles desde JavaScript).
- Orígenes: lista `Cors:AllowedOrigins` (`backend/Aseguradora.Api/appsettings.json:11-13`, vacía por defecto).
  - Local (`appsettings.Development.json:8-10`): `http://localhost:5173` y `http://localhost:5174`.
  - Docker Compose: `Cors__AllowedOrigins__0` ← `CORS_ORIGIN_BACKOFFICE` (default `http://localhost:5173`), `Cors__AllowedOrigins__1` ← `CORS_ORIGIN_PUBLIC` (default `http://localhost:5174`) (`docker-compose.yml:14-15`).
  - Producción: dominios de Cloudflare Pages de los dos fronts (`.env.example:20-23`, `docs/despliegue.md:90`).
- El match es exacto (esquema + host + puerto). Un front en otro puerto recibe error de CORS en el navegador, sin body legible.

### 1.5 Proxy y forwarded headers

- El back está detrás de Cloudflare Tunnel. Solo restaura el esquema (`X-Forwarded-Proto`) (`Program.cs:56-65`).
- La IP del cliente para el rate limit sale de `CF-Connecting-IP` solo desde redes confiables (`backend/Aseguradora.Api/Security/ClientIpResolver.cs:13,19,41-46`). Esto no afecta al front.

---

## 2. Autenticación y autorización

### 2.1 Endpoints de autenticación

| Método y ruta | Auth | Request | Response OK | Origen |
|---|---|---|---|---|
| `POST /api/auth/login` | Anónimo | `LoginRequest` | `200` `LoginResponse` | `backend/Aseguradora.Api/Controllers/AuthController.cs:21-23` |
| `POST /api/auth/usuarios` | Policy `Admin` | `CrearUsuarioRequest` | `201` `UsuarioResponse` (+ `Location`) | `AuthController.cs:29-34` |

```ts
// POST /api/auth/login  (backend/Aseguradora.Application/Security/DTOs/LoginRequest.cs:6-11)
export interface LoginRequest {
  email: string;     // obligatorio, formato email
  password: string;  // obligatorio
}

// 200  (backend/Aseguradora.Application/Security/DTOs/LoginResponse.cs:7)
export interface LoginResponse {
  token: string;                              // JWT
  rol: 'Administrador' | 'Empleado';          // único rol que el front necesita
  expiraEn: string;                           // ISO 8601 con offset "+00:00" (DateTimeOffset en UTC)
}
```

```ts
// POST /api/auth/usuarios  (CrearUsuarioRequest.cs:9-25; solo Administrador)
export interface CrearUsuarioRequest {
  email: string;                              // <= 256 caracteres, formato email, único
  password: string;                           // política de Identity (mayúscula, minúscula, número, símbolo)
  rol: 'Administrador' | 'Empleado';          // cualquier otro valor = 400
  nombre: string;                             // <= 100
  apellido: string;                           // <= 100
}

// 201  (backend/Aseguradora.Application/Security/DTOs/UsuarioResponse.cs:7)
export interface UsuarioResponse {
  id: string;                                 // Guid
  email: string;
  rol: 'Administrador' | 'Empleado';
}
```

Reglas de login (`backend/Aseguradora.Application/Security/AutenticacionService.cs:23-41`):

- Email inexistente y contraseña incorrecta devuelven **el mismo 401** con `detail: "Credenciales inválidas."` (`backend/Aseguradora.Application/Exceptions/CredencialesInvalidasException.cs:9`) [TEST: `backend/Aseguradora.Tests/Api/AuthControllerTests.cs:65-67`].
- Si la cuenta tiene más de un rol, gana `Administrador` (orden de `Roles.Asignables`, `backend/Aseguradora.Application/Security/Roles.cs:15`).
- Una cuenta sin rol válido no puede entrar (mismo 401).

### 2.2 JWT

Emisión: `backend/Aseguradora.Api/Security/JwtTokenService.cs:22-50`. Validación: `backend/Aseguradora.Api/Security/AuthenticationExtensions.cs:42-58`.

| Dato | Valor | Origen |
|---|---|---|
| Algoritmo | HS256 | `JwtTokenService.cs:40` |
| Issuer | `Aseguradora` (default; `Jwt__Issuer`) | `JwtOpciones.cs:14,19` |
| Audience | `Aseguradora` (default; `Jwt__Audience`) | `JwtOpciones.cs:15,22` |
| Duración | **480 minutos** (default; `Jwt__ExpiracionMinutos`) | `JwtOpciones.cs:16,28-29` |
| Tolerancia de reloj | `0` (el token vence exacto) | `AuthenticationExtensions.cs:56` |
| Refresh token | **No existe**. Al vencer hay que volver a loguear | `AuthController.cs` (solo login y alta) |
| Logout / revocación | **No existe** endpoint. El logout es solo borrar el token en el front | — |

Claims del token:

| Claim | Contenido | Origen |
|---|---|---|
| `sub` | Id del usuario (Guid en string) | `JwtTokenService.cs:32` |
| `email` | Email | `JwtTokenService.cs:33` |
| `role` | `Administrador` o `Empleado` | `JwtTokenService.cs:35`, `ClaimsAseguradora.cs:16` |
| `nbf`, `exp`, `iss`, `aud` | Estándar | `JwtTokenService.cs:42-48` |

Cómo se envía: **solo** en el header `Authorization: Bearer <token>`. No hay lectura de token por query string ni cookie (no hay `OnMessageReceived` en `AuthenticationExtensions.cs`). Esquema de Swagger: `Bearer` (`backend/Aseguradora.Api/Program.cs:27-33`).

Tests de referencia: `backend/Aseguradora.Tests/Api/AuthControllerTests.cs:24-43` (login OK, `expiraEn` futuro, `sub`); `backend/Aseguradora.Tests/Security/AutorizacionTests.cs:67-74` (token expirado = 401).

### 2.3 Roles y políticas

Roles (`backend/Aseguradora.Application/Security/Roles.cs:8-9`):

| Valor exacto | Qué puede |
|---|---|
| `Administrador` | Todo lo de `Empleado` más alta de usuarios y planes |
| `Empleado` | Operación diaria (vehículos, cotizaciones, pólizas, pagos, Pago Fácil) |

Políticas (`backend/Aseguradora.Api/Security/Politicas.cs:10,13,16`; reglas en `AuthenticationExtensions.cs:62-75`):

| Nombre exacto | Regla | Uso típico |
|---|---|---|
| `Empleado` | rol `Empleado` **o** `Administrador` | Backoffice en general |
| `Admin` | rol `Administrador` | Alta de usuarios (`AuthController.cs:30`), ABM de planes (`PlanesController.cs:36,49,60`) |
| `ApiKey` | esquema `ApiKey`, claim `proveedor` | Solo sistemas externos (`/api/webhooks/*`, `/api/externo/*`). **El front nunca la usa** |

Regla para el front: un usuario `Administrador` también pasa las pantallas de `Empleado`. El front decide visibilidad por `rol` del login, nunca por nombre de política.

Controladores y su política de clase (lectura de atributos):

| Prefijo | Política | Origen |
|---|---|---|
| `/api/auth` | login anónimo; usuarios `Admin` | `AuthController.cs:21,29-30` |
| `/api/planes` | GET anónimo; POST/PUT/DELETE `Admin` | `PlanesController.cs:21,28,36,49,60` |
| `/api/vehiculos`, `/api/cotizaciones`, `/api/polizas`, `/api/pagos`, `/api/pagofacil` | `Empleado` (en clase) | `VehiculosController.cs:15`, `CotizacionesController.cs:14`, `PolizasController.cs:16`, `PagosController.cs:12`, `PagoFacilController.cs:16` |
| `/api/publico/*` | anónimo + rate limit RN20 | `PublicoController.cs:13`, sección 4 |
| `/api/webhooks/*`, `/api/externo/*` | `ApiKey` | `WebhooksController.cs:12`, `ExternoSeguroController.cs:16`, `DeudaExternaController.cs:15` |
| `/health` | anónimo | `Program.cs:117` |

### 2.4 Respuestas 401 y 403

| Caso | Status | Content-Type | Body | Origen y verificación |
|---|---|---|---|---|
| Sin token, token inválido, token vencido | `401` | `application/problem+json` | ProblemDetails (ver sección 3.2) | `Program.cs:20-21` (comentario: el 401/403 del middleware de auth se convierte a ProblemDetails). [TEST: `backend/Aseguradora.Tests/Security/AutorizacionTests.cs:21-27,67-74,140-147`: verifica content-type y `status`] |
| Token válido con rol sin permiso | `403` | `application/problem+json` | ProblemDetails | [TEST: `AutorizacionTests.cs:31-38`] |
| Login con credenciales malas | `401` | `application/problem+json` | `detail: "Credenciales inválidas."` | [CÓDIGO: `ExceptionMiddleware.cs:58`] [TEST: `ExceptionMiddlewareTests.cs:46-54`] |
| Header `X-Api-Key` inválido en `/api/externo` o `/api/webhooks` | `401` | `application/problem+json` | ProblemDetails | [TEST: `AutorizacionTests.cs:115-126`] |

Headers de 401: `WWW-Authenticate: Bearer` es el valor **[DEFAULT]** del handler JWT. No está probado en el repo. El front no lo necesita: la decisión se toma por status.

Cuidado: el **401 del login** y el **401 por token vencido** son el mismo status. El front debe redirigir a login por 401 **solo** en requests protegidos, nunca en `POST /api/auth/login`. El 401 de login muestra `detail` en el formulario y no dispara la redirección de sesión vencida.

---

## 3. Formato de errores

### 3.1 Qué emite cada fuente

Hay cuatro fuentes de errores. Las cuatro usan `application/problem+json`.

| # | Fuente | Status | Campos que emite |
|---|---|---|---|
| A | `ExceptionMiddleware` (excepciones de la aplicación) | 400, 401, 404, 500, 502, 503 | `title`, `status`, `detail`, `instance`, `traceId`, y `codigo` solo en algunos 404 |
| B | Autorización (401 y 403 del pipeline de auth) | 401, 403 | `status` (pinneado por test). Los demás campos son **[DEFAULT]** del writer de ProblemDetails |
| C | Rate limit RN20 | 429 | `title`, `status`, `detail`, `instance`, `traceId`. Sin `Retry-After` |
| D | Validación automática de `[ApiController]` (DataAnnotations, tipos de parámetros) | 400 | `ValidationProblemDetails`: `type`, `title`, `status`, `errors`, `traceId` ([DEFAULT] del framework salvo `errors` y `status`) |

Escritura de A y C: `backend/Aseguradora.Api/Middleware/ExceptionMiddleware.cs:33-50` y `backend/Aseguradora.Api/Security/PublicoRateLimitExtensions.cs:74-89`. Ambos usan `WriteAsJsonAsync(problem, options: null, contentType: "application/problem+json")`. Con `options: null`, el serializador usa defaults web (camelCase). [TEST: `ExceptionMiddlewareTests.cs:41-43` lee `status`, `detail`, `instance` en camelCase.]

### 3.2 Tabla excepción → status → body

Mapeo en `backend/Aseguradora.Api/Middleware/ExceptionMiddleware.cs:54-65`. El front **no** debe mostrar `title` al usuario: viene del `ReasonPhrases` de ASP.NET en inglés (`"Not Found"`, `"Bad Request"`). Mostrar `detail` (en español) o un texto propio del front.

| Excepción C# | Status | `detail` | `codigo` | Notas |
|---|---|---|---|---|
| `NotFoundException` | 404 | mensaje de la excepción | Solo si se creó con código | Con código: `CLIENTE_NO_ENCONTRADO` (`backend/Aseguradora.Application/Services/DeudaExternaService.cs:24`). Sin código: `"La cuota no existe."` (`PagoFacil/CuponPagoFacilService.cs:28`), sin `codigo`. [TEST: `ExceptionMiddlewareTests.cs:96-115`] |
| `BusinessRuleException` | 400 | mensaje | No | Regla de negocio. Ejemplo: `VEHICULO_NO_ENCONTRADO: La patente '...' no figura en el registro de DNRPA.` (`backend/Aseguradora.Application/Services/VehiculoService.cs:21,55`). **El código va como prefijo dentro de `detail`, no en `codigo`**. |
| `ReglaDeDominioException` y `TransicionInvalidaException` (subclase) | 400 | mensaje | No | `ExceptionMiddleware.cs:60` |
| `CredencialesInvalidasException` | 401 | `"Credenciales inválidas."` | No | Solo login |
| `ExternalServiceException` | 502 | mensaje | No | Falla de un servicio externo (pasarela, ARCA, DNRPA) |
| `ServicioNoDisponibleException` | 503 | mensaje | No | Además header `Retry-After: 15` (`ExceptionMiddleware.cs:48-49`, `ServicioNoDisponibleException.cs:6`). Ver sección 9 |
| Cualquier otra excepción | 500 | `"Ocurrió un error inesperado."` | No | No filtra detalles. Incluye `traceId` [TEST: `ExceptionMiddlewareTests.cs:77-94`] |

### 3.3 Validación por campo (status 400, origen D)

Un request con DTO inválido (DataAnnotations en `LoginRequest.cs`, `CrearUsuarioRequest.cs`, `PolizaFiltro.cs:21-25` para `pagina`/`tamano`, etc.) responde 400 con `ValidationProblemDetails`. La clave de `errors` es el **nombre de la propiedad C#** (PascalCase). [TEST: `backend/Aseguradora.Tests/Api/PublicoConsultaControllerTests.cs:123-131` valida `problema.Errors.ContainsKey("NumeroPoliza")`.]

Un query con enum inválido (por ejemplo `?estado=Inexistente`) también responde 400 con `application/problem+json` [TEST: `PolizasControllerTests.cs:192-202`].

### 3.4 Tipo TypeScript de error

Un solo tipo para todas las fuentes. Todo es opcional excepto `status`, porque no todas las fuentes emiten los mismos campos.

```ts
// Forma común de error del back (application/problem+json).
// Fuentes: ExceptionMiddleware (A), auth (B), RN20 (C), validación automática (D).
export interface ProblemDetails {
  status: number;                       // siempre presente
  type?: string | null;                 // A y C: no lo asignan (null). D: URI de RFC 9110 (default)
  title?: string | null;                // A y C: texto de ASP.NET en inglés. No mostrar al usuario
  detail?: string | null;               // A: mensaje en español. C: "Se superó el límite de intentos. Volvé a intentarlo en un minuto."
  instance?: string | null;             // A y C: path del request, sin query string
  traceId?: string | null;              // A, C y D. Útil para soporte
  codigo?: string;                      // Solo NotFound con código (hoy: "CLIENTE_NO_ENCONTRADO")
  errors?: Record<string, string[]>;    // Solo D (400 de validación). Claves = nombre C# (PascalCase)
}
```

Lectura recomendada para el front:

- Errores de campo: `errors` (clave PascalCase, por ejemplo `Email`, `Password`, `NumeroPoliza`).
- Errores de negocio: `detail`. Para `VEHICULO_NO_ENCONTRADO`, el código está al inicio de `detail` (hay que comparar el prefijo).
- Mapear por `status` y, cuando exista, por `codigo`.

### 3.5 Ejemplos de body (forma real)

```json
{
  "status": 404,
  "title": "Not Found",
  "detail": "No existe un cliente con ese DNI.",
  "instance": "/api/externo/clientes/30123456/deuda",
  "traceId": "00-...-01",
  "codigo": "CLIENTE_NO_ENCONTRADO"
}
```

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": { "NumeroPoliza": ["El número de póliza tiene un formato inválido."] },
  "traceId": "00-...-01"
}
```

El segundo ejemplo sigue el formato del framework [DEFAULT]. El mensaje del campo es ilustrativo: el texto real sale del `ErrorMessage` del DataAnnotation correspondiente.

---

## 4. Rate limit RN20 (`/api/publico/*`)

Fuente: `backend/Aseguradora.Api/Security/PublicoRateLimitExtensions.cs`.

| Dato | Valor | Origen |
|---|---|---|
| Alcance | **Todo** request cuyo path empieza con `/api/publico` (cualquier método), case-insensitive | `PublicoRateLimitExtensions.cs:16,55` |
| Límite | **10 requests** por IP | `PublicoRateLimitExtensions.cs:18,36`, `appsettings.json:17-21` (`RateLimiting:Publico:PermitLimit`) |
| Ventana | **60 segundos fija** (no deslizante) | `PublicoRateLimitExtensions.cs:19,37,62` (`WindowSeconds`) |
| Cola | Ninguna: el request que excede se rechaza al instante | `PublicoRateLimitExtensions.cs:64` |
| Status de rechazo | `429 Too Many Requests` | `PublicoRateLimitExtensions.cs:50,86` |
| Body | ProblemDetails (3.1, fuente C) con `detail` fijo en español | `PublicoRateLimitExtensions.cs:25,77-84` |
| `Retry-After` | **No se envía** | `PublicoRateLimitExtensions.cs:74-89` (no hay header). [TEST: `backend/Aseguradora.Tests/Api/PublicoRateLimitTests.cs:51-65` verifica 429 y `status`, no headers] |
| Endpoints fuera del límite | `/api/planes`, `/api/auth/*`, backoffice en general | No empiezan con `/api/publico` |

Consecuencias para la UI (recomendación, a validar con el equipo):

- Los endpoints públicos comparten **un solo contador por IP** (consulta, factura y pagos). Un usuario que consulta 10 veces seguidas queda bloqueado para pagar durante hasta 60 s.
- El mensaje del back dice "en un minuto" aunque la configuración cambie. Si cambia la ventana, el texto queda desactualizado.
- No reintentar automáticamente. TanStack Query no debe reintentar mutaciones (por defecto no lo hace en v5) ni queries de `/api/publico` ante 429.
- Como el `Retry-After` no existe, el front muestra un mensaje fijo de espera de 60 s.

---

## 5. Serialización JSON

Config del serializador: no hay `AddJsonOptions`, `ConfigureHttpJsonOptions` ni `JsonConverter` en el código de la API ni de Application (búsqueda completa en `backend/`, excluyendo tests y `obj/bin`). Los únicos `JsonStringEnumConverter` están en el cliente saliente de DNRPA (`backend/Aseguradora.Integrations/Dnrpa/DnrpaHttpService.cs:22`) y no afectan lo que recibe el front.

Por lo tanto aplica el default de ASP.NET Core 8 (`JsonSerializerDefaults.Web`) [DEFAULT]:

| Tema | Regla | Evidencia |
|---|---|---|
| Nombres de propiedad | **camelCase** (`numeroPoliza`, `expiraEn`, `tamanoPagina`) | [TEST: `PublicoConsultaControllerTests.cs:164` lista `numeroPoliza`, `coberturaVigente`...; `AuthControllerTests.cs:40` lee `expiraEn`] |
| Campos null | **Se emiten con `null`**, no se omiten (default `WhenWritingNull` no está activo) | [DEFAULT]. [TEST: `PublicoConsultaControllerTests.cs:164-168` exige que los campos existan] |
| Query string | Binding case-insensitive por nombre de parámetro (`estado`, `clienteId`, `patente`, `pagina`, `tamano`) | [CÓDIGO: `PolizaFiltro.cs`] |
| Body JSON | Acepta camelCase y PascalCase (case-insensitive) | [DEFAULT] |

### 5.1 Enums: formato de envío y recepción

**Regla central: el back no tiene `JsonStringEnumConverter`. Los enums de dominio viajan como número entero** (el valor es la posición en el enum de C#, empezando en 0). En el back se usa `ToString()` para algunos campos (ver tabla 5.2), así que hay **tres formatos distintos según el DTO**.

Los enums de dominio están en `backend/Aseguradora.Domain/Enums/`. Sus valores numéricos:

| Enum (archivo) | Valor 0 | 1 | 2 | 3 | 4 |
|---|---|---|---|---|---|
| `EstadoPoliza` (`EstadoPoliza.cs:5-9`) | Pendiente | Vigente | Suspendida | Cancelada | Vencida |
| `EstadoCuota` (`EstadoCuota.cs:5-8`) | Pendiente | Vencida | Pagada | Anulada | — |
| `EstadoPago` (`EstadoPago.cs:5-7`) | Pendiente | Aprobado | Rechazado | — | — |
| `MedioPago` (`MedioPago.cs:5-7`) | Pasarela | PagoFacil | Caja | — | — |
| `EstadoFactura` (`EstadoFactura.cs:5-6`) | PendienteCae | Autorizada | — | — | — |
| `TipoVehiculo` (`TipoVehiculo.cs:5-7`) | Auto | Moto | Camioneta | — | — |
| `UsoVehiculo` (`UsoVehiculo.cs:5-6`) | Particular | Comercial | — | — | — |
| `OrigenCotizacion` (`OrigenCotizacion.cs:5-7`) | Web | Panel | Externo | — | — |

**Tabla 5.2: qué formato llega en cada campo**

| DTO.campo | Tipo C# | Formato en JSON | Origen |
|---|---|---|---|
| `PolizaListItemResponse.estado` | `EstadoPoliza` | **número** | `backend/Aseguradora.Application/Dtos/Polizas/PolizaListItemResponse.cs:15` |
| `PolizaDetalleResponse.estado` | `EstadoPoliza` | **número** | `Dtos/Polizas/PolizaDetalleResponse.cs:43` |
| `CuotaResponse.estado` | `EstadoCuota` | **número** | `Dtos/Polizas/CuotaResponse.cs:21` |
| `VehiculoResponse.tipo` / `uso` | `TipoVehiculo` / `UsoVehiculo` | **número** | `Dtos/VehiculoResponse.cs:25-26` |
| `CotizacionDto.origen` | `OrigenCotizacion` | **número** | `Dtos/CotizacionDto.cs:27` |
| `PagoResponse.estado` | `string` (de `EstadoPago`) | **string** `PENDIENTE` / `APROBADO` / `RECHAZADO` | `Dtos/PagoResponse.cs:5`, mapeo en `Services/PagoService.cs:87-92`, constantes en `Dtos/ValoresPagoResponse.cs:6-8` |
| `PagoResponse.medio` | `string` (de `MedioPago`) | **string** `PASARELA` / `PAGO_FACIL` / `CAJA` | `PagoService.cs:93-98`, `ValoresPagoResponse.cs:9-11` |
| `FacturaResponse.estado` | `string` (de `EstadoFactura`) | **string** `PENDIENTE_CAE` / `AUTORIZADA` | `Dtos/FacturaResponse.cs:6`, `PagoService.cs:123`, `ValoresPagoResponse.cs:12-13` |
| `ConsultaPublicaResponse.estado` y `CuotaPublica.estado` | `string` (`Etiqueta(enum)`) | **string en MAYÚSCULAS** del nombre del enum: `VIGENTE`, `PENDIENTE`, `VENCIDA`, `PAGADA`, `ANULADA`, `SUSPENDIDA`, `CANCELADA` | `Application/Publico/ConsultaPublicaService.cs:30,39`; `ConsultaPublicaService.cs:43` (`ToString().ToUpperInvariant()`) |
| `DeudaExternaCuota.estado` | `string` | **string en MAYÚSCULAS**: `PENDIENTE` o `VENCIDA` (el filtro excluye las demás) | `Application/Services/DeudaExternaService.cs:29,69` |

Consecuencia de la tabla: el **mismo nombre** puede llegar como número o como string según el endpoint. Ejemplo: `Vencida` es `4` en `EstadoPoliza` y `1` en `EstadoCuota`. El mapper del front debe usar la clave **(dominio, valor)**, no solo el valor.

**Enums en request bodies: van como número.** Un DTO con enum se deserializa solo desde número (default de System.Text.Json [DEFAULT]). Afecta:

- `VehiculoAltaRequest.uso` (`backend/Aseguradora.Application/Dtos/VehiculoAltaRequest.cs:27`)
- `ModificarUsoRequest.uso` (`Dtos/ModificarUsoRequest.cs:14`)
- `CotizacionExternaRequest.tipoVehiculo` y `uso` (`Dtos/CotizacionExternaRequest.cs:14,16`)

Enviar `"Particular"` en el body produce 400 de deserialización [DEFAULT, no probado en el repo]. Los comentarios XML de esos DTOs dicen "Particular, Comercial", pero el wire es número (ver sección 9).

**Enums en query string: se acepta el nombre o el número.** `GET /api/polizas?estado=Vigente` está probado [TEST: `PolizasControllerTests.cs:122,143`]. Un valor inexistente responde 400 [TEST: `PolizasControllerTests.cs:192-202`].

### 5.3 Fechas

| Tipo C# | Formato JSON | Zona | Campos típicos | Origen |
|---|---|---|---|---|
| `DateOnly` | `"yyyy-MM-dd"` (sin hora ni zona) | Es la fecha de negocio ya calculada en Argentina | `fechaInicio`, `fechaFin`, `fechaVencimiento`, `vencimiento`, `vigenteDesde`, `vigenteHasta`, `fechaPrimerVencimiento`, `fechaRendicion`, `vencimientoCae`, `fechaNacimiento` | `Application/Tiempo/FechaArgentina.cs:17-20` (zona `America/Argentina/Buenos_Aires`) |
| `DateTime` | ISO 8601 **en UTC** (ver nota) | UTC por convención | `fechaCreacion`, `fechaAcreditacion`, `fechaEmision`, `fechaCotizacion`, `fechaVencimiento` (cotización), `fechaExpiracion`, `fechaProceso` | Se calcula con `reloj.GetUtcNow().UtcDateTime` (`Application/Services/PolizaService.cs:37`, `CotizacionService.cs:63`) |
| `DateTimeOffset` | ISO 8601 con offset `+00:00` | UTC | `expiraEn` (login) | `Application/Security/ITokenService.cs:14`, `JwtTokenService.cs:27` |

Nota sobre `DateTime` [INFERIDO, a confirmar]: el repo no tiene `HasConversion` ni `ValueConverter` (búsqueda en `backend/`), así que EF Core no normaliza a UTC al leer. SQL Server devuelve `datetime2` con `Kind = Unspecified`, y el serializador escribe esos valores **sin `Z`**. Los valores recién calculados sí llevan `Z`. Por eso el front debe **tratar todo `DateTime` como UTC**, con o sin `Z`. Ver sección 9.

Reglas para el front:

- `DateOnly` no debe pasarse a `new Date("yyyy-MM-dd")`: JavaScript lo interpreta como medianoche UTC y en Argentina (UTC-3) el día mostrado queda uno antes. Mostrarlo como fecha de calendario sin conversión de zona.
- `DateTime` se muestra convirtiéndolo a `America/Argentina/Buenos_Aires`.
- Un único formateador en `@nexa/api` o `@nexa/ui` (regla FB4 de `00-decisiones-base.md`).

### 5.4 Decimales y dinero

| Dato | Regla | Origen |
|---|---|---|
| Tipo C# | `decimal` | Todos los DTOs (`primaMensual`, `importe`, `recargo`, `total`, `importeTotal`, `primaBase`) |
| Formato JSON | **número** (no string). Se conserva la escala: `12000.00` | [DEFAULT] |
| Precisión en base | `decimal(18,2)` | `backend/Aseguradora.Data/Configurations/CuotaConfiguration.cs:17-18`, `PagoConfiguration.cs:17`, `PolizaConfiguration.cs:19` |
| Redondeo | 2 decimales, mitad hacia afuera de cero (`MidpointRounding.AwayFromZero`) | `Application/Services/DeudaExternaService.cs:74` |
| Moneda | **ARS**, fija. No viaja en los DTOs de la API. Solo aparece como constante en la integración de pasarela (`Application/Services/PagoService.cs:29`) | — |
| IVA | 21 % incluido en el precio (`Application/Services/FacturacionService.cs:32`, `FactorIva = 1.21m`) | — |

Reglas para el front:

- No hacer aritmética de plata con `number` en el front. Mostrar lo que devuelve el back y formatear con `Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })` desde un único formateador.
- El back es la fuente del total: el front no recalcula recargos ni totales.

### 5.5 Guid, nulls y textos

| Tema | Regla |
|---|---|
| `Guid` | String, formato hiphenado en minúsculas (ejemplo `c1000000-0000-0000-0000-000000000001`). Tipo TS: `string` |
| Nullable | `T \| null` (no `?:`). Un campo nullable siempre aparece en el JSON, con valor `null` |
| Texto | UTF-8. Textos de error en español |
| `char` (`FacturaResponse.tipo`) | Un caracter string |

---

## 6. Paginación, orden y filtros

### 6.1 Convención común

Solo hay **una** convención de paginación: `PaginaResponse<T>` (`backend/Aseguradora.Application/Comun/PaginaResponse.cs:10`), usada hoy por `GET /api/polizas` (`PolizasController.cs:35-42`).

```ts
// backend/Aseguradora.Application/Comun/PaginaResponse.cs:10
// JSON real (camelCase): items, pagina, tamanoPagina, total
export interface PaginaResponse<T> {
  items: T[];          // registros de la página
  pagina: number;      // página actual, desde 1
  tamanoPagina: number;// tamaño pedido (o el default)
  total: number;       // total de registros que cumplen el filtro
}
```

Otros listados (planes, vehículos por cliente, cuotas de una póliza, historial de rendiciones) devuelven **array directo**, sin paginación. Origen: `PlanesController.cs:20`, `VehiculosController.cs:39`, `PolizasController.cs:66`, `PagoFacilController.cs:55`.

### 6.2 Query de `GET /api/polizas`

| Parámetro | Tipo | Regla | Origen |
|---|---|---|---|
| `estado` | `EstadoPoliza` (nombre o número) | Opcional | `PolizaFiltro.cs:15` |
| `clienteId` | Guid | Opcional | `PolizaFiltro.cs:16` |
| `patente` | string | Opcional; sin distinguir mayúsculas ni espacios | `PolizaFiltro.cs:18-19` |
| `pagina` | int | `1` a `PaginaMaxima` (`int.MaxValue / 100`). Default `1` | `PolizaFiltro.cs:21-22` |
| `tamano` | int | `1` a `100`. Default **20** | `PolizaFiltro.cs:9-10,24-25` |

Orden: fijo, por `FechaEmision` descendente (`Application/Services/PolizaService.cs:104`). No hay parámetro de orden.

Fuera de rango: 400 (fuente D). [TEST: `PolizasControllerTests.cs:176-183` verifica `pagina` y `tamanoPagina`.]

Tipo TypeScript de la query:

```ts
export interface PolizasQuery {
  estado?: 'Pendiente' | 'Vigente' | 'Suspendida' | 'Cancelada' | 'Vencida'; // o número 0..4
  clienteId?: string;   // Guid
  patente?: string;
  pagina?: number;      // >= 1; default 1
  tamano?: number;      // 1..100; default 20
}
```

---

## 7. Idempotencia, headers especiales, uploads y límites

### 7.1 Idempotencia

- **No existe** header `Idempotency-Key` ni equivalente en el back (búsqueda en `backend/`: sin resultados).
- Los POST crean recursos cada vez que se envían, salvo que la lógica de negocio lo impida (por ejemplo, un pago ya aprobado).
- Las integraciones salientes marcan los POST como no reintentables (`backend/Aseguradora.Integrations/Http/ClienteHttpBase.cs:39-43`). Eso es del back hacia otros servicios, no afecta al front.
- Regla para el front: deshabilitar el botón de envío mientras la mutación está pendiente y **no** reintentar POST automáticamente.

### 7.2 Headers especiales

| Header | Quién lo usa | Origen |
|---|---|---|
| `Authorization: Bearer <jwt>` | Front, en todo endpoint protegido | Sección 2.2 |
| `X-Api-Key` | Sistemas externos (no el front) | `ApiKeyAuthenticationHandler.cs:26` |
| `CF-Connecting-IP` | Cloudflare (no el front) | `ClientIpResolver.cs:13` |
| `Location` (respuestas 201) | Solo lo emite el back. **No es legible desde JavaScript** (sección 9). El front toma el id del body | `PolizasControllerTests.cs:74` (test usa `Location`) |
| `Retry-After` (503 y no en 429) | Solo lo emite el back en 503 | `ExceptionMiddleware.cs:48-49` |

### 7.3 Upload de archivos

| Dato | Valor | Origen |
|---|---|---|
| Endpoint | `POST /api/pagofacil/rendiciones` | `PagoFacilController.cs:37-38` |
| Content-Type | `multipart/form-data` | `PagoFacilController.cs:46` (`IFormFile`) |
| Campo del archivo | `archivo` | `PagoFacilController.cs:46` |
| Tamaño máximo del archivo | **5 MB** (5 242 880 bytes). Por encima: 400 de negocio | `backend/Aseguradora.Application/PagoFacil/RendicionService.cs:32,164`. [TEST: `RendicionControllerTests.cs:196`] |
| Límite del request multipart | `10 MB` (`2 × 5 MB`) para dejar margen al envelope | `PagoFacilController.cs:40-41,76-78` |
| Límite de cuerpo general | Default de Kestrel (**30 MB**), sin configurar | [DEFAULT]. Ver sección 9 |

Recomendación para el front: validar `file.size <= 5 * 1024 * 1024` antes de enviar, para no llegar al 400 de negocio.

Descarga (`GET /api/pagofacil/base-positiva`): responde `text/plain` con el nombre de archivo en `Content-Disposition` (`PagoFacilController.cs:66-74`, [TEST: `BasePositivaControllerTests.cs:46`]). Como el header no está expuesto por CORS (sección 9), el front debe **armar el nombre del archivo él mismo** y descargar como blob.

---

## 8. Lista de enums y badges del diseño

### 8.1 Enums y formato de cada valor (resumen de 5.1 y 5.2)

```ts
// Valores numéricos (enums de dominio que viajan como número)
export type EstadoPolizaNum = 0 | 1 | 2 | 3 | 4;   // Pendiente | Vigente | Suspendida | Cancelada | Vencida
export type EstadoCuotaNum  = 0 | 1 | 2 | 3;       // Pendiente | Vencida | Pagada | Anulada
export type EstadoPagoNum   = 0 | 1 | 2;           // Pendiente | Aprobado | Rechazado (no se expone como número; ver 8.2)
export type MedioPagoNum    = 0 | 1 | 2;           // Pasarela | PagoFacil | Caja (no se expone como número)
export type EstadoFacturaNum = 0 | 1;              // PendienteCae | Autorizada (no se expone como número)
export type TipoVehiculoNum = 0 | 1 | 2;           // Auto | Moto | Camioneta
export type UsoVehiculoNum  = 0 | 1;               // Particular | Comercial
export type OrigenCotizacionNum = 0 | 1 | 2;       // Web | Panel | Externo

// Valores string que el back emite (mayúsculas)
export type EstadoPagoStr    = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
export type MedioPagoStr     = 'PASARELA' | 'PAGO_FACIL' | 'CAJA';
export type EstadoFacturaStr = 'PENDIENTE_CAE' | 'AUTORIZADA';
export type EstadoPublicoStr = 'PENDIENTE' | 'VIGENTE' | 'SUSPENDIDA' | 'CANCELADA' | 'VENCIDA' | 'PAGADA' | 'ANULADA';
```

Nota: `EstadoPublicoStr` lo emite `ConsultaPublica` (poliza y cuotas) y `DeudaExterna` solo usa `PENDIENTE | VENCIDA`.

### 8.2 Badges del diseño

El diseño define 9 badges. Esta tabla dice de qué dato sale cada uno. Donde el diseño dice una sola palabra y el back tiene varios dominios, se indica el dominio.

| Badge (diseño) | Dato del back | Valor en JSON | Dónde aparece | Observación |
|---|---|---|---|---|
| Pendiente | `EstadoPoliza.Pendiente` | `0` (backoffice) / `PENDIENTE` (público) | Póliza | Ambiguo: también existe `EstadoCuota.Pendiente` (`0` / `PENDIENTE`) y `EstadoPago.Pendiente` (`PENDIENTE`). Mapear con dominio |
| Vigente | `EstadoPoliza.Vigente` | `1` / `VIGENTE` | Póliza | |
| Suspendida | `EstadoPoliza.Suspendida` | `2` / `SUSPENDIDA` | Póliza | |
| Cancelada | `EstadoPoliza.Cancelada` | `3` / `CANCELADA` | Póliza | |
| Vencida | `EstadoPoliza.Vencida` | `4` / `VENCIDA` | Póliza | Colisión: `EstadoCuota.Vencida` es `1` / `VENCIDA` |
| Vencida (cuota) | `EstadoCuota.Vencida` | `1` / `VENCIDA` | Cuota | Usar la clave (cuota, 1) |
| Pagada | `EstadoCuota.Pagada` | `2` / `PAGADA` | Cuota | |
| Anulada | `EstadoCuota.Anulada` | `3` / `ANULADA` | Cuota | |
| Validado | **No es un enum.** `VehiculoResponse.validadoDnrpa: boolean` (`Dtos/VehiculoResponse.cs:27`) | `true` / `false` | Vehículo | Es un booleano. Decidir cómo se dibuja (sección 9) |
| Pendiente CAE | `EstadoFactura.PendienteCae` | `"PENDIENTE_CAE"` | Factura (`FacturaResponse.estado`) | Único origen del badge |

Estados que el back emite y **no tienen badge en el diseño** (sección 9): `APROBADO`, `RECHAZADO` (pago), `AUTORIZADA` (factura), `PASARELA`, `PAGO_FACIL`, `CAJA` (medio), `Pagada`/`Anulada` en `DeudaExterna` (no se emiten).

Tipo TypeScript del mapeo de badges (propuesta):

```ts
export type BadgeEstado =
  | 'Pendiente' | 'Vigente' | 'Suspendida' | 'Cancelada' | 'Vencida'
  | 'Pagada' | 'Anulada' | 'Validado' | 'Pendiente CAE';
```

---

## 9. Dudas

Cada duda indica qué decide quién. Las que dicen **[verificar]** se confirman con un request real a la API local (`http://localhost:8080`, en Development) antes de implementar.

1. **Enums como número [decisión backend].** Hoy los enums de dominio viajan como número en los DTOs y como string en otros. Recomendación (no implementada): `JsonStringEnumConverter` global en `Program.cs`. Impacto: cambia el wire de todos los endpoints que devuelven enums y de los request bodies. Hasta decidirlo, el front usa la tabla 5.2 tal cual.
2. **Fechas `DateTime` sin `Z` [verificar + decisión backend].** Confirmar con `GET /api/polizas` (fecha de emisión) si llega sin `Z`. Si llega sin `Z`, decidir si el back normaliza a UTC con un `ValueConverter` o el front asume UTC siempre.
3. **Campos de `errors` [verificar].** El test pinnea `NumeroPoliza` (PascalCase). Confirmar con `POST /api/auth/login` sin `password` si la clave es `Password`. Si la clave cambia, ajustar la sección 3.4.
4. **Cuerpo de 401 y 403 [verificar].** Los tests fijan `status` y content-type. Confirmar con un request sin token si el body incluye `title`, `type` y `traceId`, y si `WWW-Authenticate` viene en el header.
5. **404 de rutas inexistentes [verificar].** No hay test que fije el body de un 404 por ruta inexistente (`Program.cs:91` activa `UseStatusCodePages`). Confirmar si responde problem+json o texto plano.
6. **`Retry-After` y `Location` no son legibles desde el navegador.** CORS no expone headers (`Program.cs:49-54`). Si el front necesita el `Location` o el `Retry-After`, el back debe agregar `WithExposedHeaders`. Mientras tanto: el id sale del body y el reintento de 503 es fijo de 15 s.
7. **Badge "Validado".** Es un booleano, no un estado. Decidir: ¿badge sobre `validadoDnrpa`, o no se muestra badge en la pantalla de vehículos? Igual para cliente (`validadoRenaper`): confirmar en el contrato de clientes.
8. **Estados sin badge.** `APROBADO`, `RECHAZADO`, `AUTORIZADA`, `PASARELA`, `PAGO_FACIL`, `CAJA`. Decidir si se muestran y con qué texto.
9. **Errores de negocio sin `codigo`.** `VEHICULO_NO_ENCONTRADO` va como prefijo de `detail` (`VehiculoService.cs:55`), mientras que `CLIENTE_NO_ENCONTRADO` va en `codigo`. Inconsistente. Decidir si todos los códigos van en `codigo` (cambio de contrato, requiere aviso al equipo).
10. **Rate limit sin `Retry-After`, texto fijo "en un minuto".** Decidir la UX de espera (sección 4) y si el back agrega el header.
11. **Ventana del rate limit por IP compartida.** Consulta, factura y pagos comparten 10 por minuto. ¿Es lo que quiere producto? Decisión de producto.
12. **Almacenamiento del token.** Sin decidir en el front (localStorage, memoria, cookie). El back no tiene refresh ni logout, así que al vencer (480 min) el usuario vuelve a loguear. Decisión del equipo front.
13. **Upload.** Límite de negocio 5 MB, límite del request 10 MB, Kestrel 30 MB sin configurar. ¿Se quiere un límite explícito de request menor? Decisión backend.
14. **Pedidos sin paginación.** Listados de planes, vehículos y cuotas devuelven arrays completos. Confirmar que el volumen esperado es chico. Si no, pedir paginación.
15. **Comentarios XML de enums en requests.** `CotizacionExternaRequest` y `VehiculoAltaRequest` documentan "Particular, Comercial" pero el wire es número (sección 5.2). Corregir la doc del back o el wire (depende de la duda 1).
16. **HTTPS en Development con Docker [verificar].** `Program.cs:101-105` activa `UseHttpsRedirection` en Development. Con `docker compose` el API escucha solo HTTP en `8080`. Confirmar que un `GET http://localhost:8080/health` responde 200 y no redirige.
17. **Token inválido frente a login.** El 401 de login y el 401 de token vencido tienen el mismo status. Regla propuesta en sección 2.4. Confirmar con el equipo que no hay otra forma de distinguirlos.
18. **Idempotencia de pagos.** No hay `Idempotency-Key`. Un doble clic en "pagar" puede generar dos pagos según el flujo. Confirmar con el equipo de back qué protege el lock (`ExclusionWebhookSql.cs:27`) y qué no.
