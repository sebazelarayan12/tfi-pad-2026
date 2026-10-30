# Tareas divididas del back — TFI Aseguradora

Borrador generado a partir de `docs/AnalisisBack.md`. Cada tarea es una tarjeta de Trello: una tarjeta = una rama = un PR hacia `development` (ver `docs/workflow.md`). Al terminar todas, el back cubre CU01 a CU22, las RN, los endpoints de la sección 7, las integraciones y mocks, los jobs y el despliegue.

**Cómo se evita esperar a otro:** cada frente publica primero sus contratos (interfaces, DTOs, mocks) y las demás tareas consumen mocks o datos de seed. Cada tarea indica en "Puede empezar sin esperar a" con qué arranca.

**Frentes e IDs:** F1 Seguridad, clientes y web pública · F2 Vehículos, planes y cotización · F3 Pólizas, cuotas y Pago Fácil · F4 Pagos y facturación · T Transversal (Fase 0 restante, tests, resiliencia, Fase 2, despliegue).

## Para revisar antes de cargar a Trello

**Desvíos respecto de `AnalisisBack.md` (confirmar con el equipo):**
- API key como `AuthenticationHandler` en lugar de `ApiKeyMiddleware.cs` (integra con `[Authorize(Policy)]`).
- Un controller por frente bajo `/api/externo` en lugar de un único `ExternoController`.
- Respuesta de 9.5 C con un `idCotizacion` por opción (hay una cotización por plan). Toca el contrato con otros grupos.
- Tabla de control del job de vencimientos (el modelo pasa de 10 a 11 tablas).
- `RowVersion` en `Pago` y `Cuota` para el pago duplicado.
- `AseguradoraDbContext` pasa a `IdentityDbContext`.

**Decisiones a cerrar en la reunión (cada tarea trae un default):**
- IVA 21 % en facturas (deducido del ejemplo de 9.2).
- Primer vencimiento y plazo mínimo entre emisión y primera cuota (RN07 y RN19).
- Pago duplicado por dos medios.
- Renaper caído en el alta de cliente: 201 con `validadoRenaper=false` o 502.
- Prima base de RC (12000 en el seed vs 10000 en el ejemplo 9.5 C) y prima de TR (30000, no está en la spec).
- Valor del rol admin que usan los tests (`X-Test-Role`).
- Layouts de Pago Fácil (código de barras, rendición, base positiva): dependen del PDF de la cátedra y bloquean US-F3-06 a US-F3-08.

## Convenciones y prerrequisitos (fuente de verdad: todas las tareas se alinean a esto)

**Punto de partida.** US-01 (PR #6 y #7), el Docker/Cloudflare (PR #4) y el CI (PR #8) ya están mergeados en `development`: hay entidades, `DbContext`, migración inicial, `EfRepository`, `IUnitOfWork`, middleware de errores, Dockerfile, `docker-compose.yml`, `/health` básico y el workflow de CI. No hay prerrequisito: toda rama sale de `development` actualizado.

**CI y reglas del repo (ya activas).** Cada PR a `development` o `main` corre los checks `backend` (restore, build Release y test), `branch-name` (`feature/`, `fix/`, `docs/`, `chore/`) y `secrets-scan` (gitleaks). Un ruleset protege `main` y `development`: PR con 1 aprobación de otra persona, threads resueltos, checks `backend` y `branch-name` en verde, sin force-push ni borrado, y Copilot revisa cada PR y cada push. Criterio común de toda tarea: el PR pasa esos checks.

**Primera ola (se pueden tomar en paralelo desde ya):** US-T-01, US-T-02, US-T-03, US-F1-01, US-F2-01, US-F3-01, US-F4-01.

**C1. Framework de tests.** xUnit (ya está en el repo). No usar MSTest, Moq ni FluentAssertions salvo que una tarea agregue el paquete explícitamente; la skill `dotnet-best-practices` se aplica en lo demás (XML docs, primary constructors, async, logging estructurado). Ninguna tarea reabre esta duda.

**C2. Dueño del dominio de pólizas y cuotas.** US-F3-01 es dueño de los métodos de transición de `Poliza` y `Cuota` en Domain, de la excepción de dominio (`TransicionInvalidaException`) y de su mapeo en `ExceptionMiddleware`. Ningún otro frente crea ni redefine esas piezas: las consumen.

**C3. Dueño del cobro.** US-F4-02 es dueño de `IAprobacionPagoService` (crea `Pago` y `PagoCuota`, marca cuotas pagadas llamando a los métodos de F3-01, emite factura). Webhook (F4-05), caja (F4-03), conciliación (F4-06) y la rendición de Pago Fácil (F3-08) usan ese servicio y no reimplementan el cobro. Así la facturación RN12 de los pagos de Pago Fácil también tiene dueño.

**C4. Clientes HTTP a otros grupos.** US-T-02 es dueño de la configuración compartida: `AddStandardResilienceHandler` (timeout y reintentos acotados) y el selector mock/real por servicio. Las tareas de cliente real (F1 Renaper, F2 DNRPA, F4 pasarelas y ARCA) usan ese helper y no definen timeouts ni reintentos propios; mientras T-02 no esté mergeado, usan los mismos defaults inline.

**C5. `Program.cs`, DI y seed.** Cada frente registra sus servicios en su propio método de extensión (`AddFrente1(...)`, `AddFrente2(...)`, etc., en su proyecto) y `Program.cs` recibe una sola línea por frente. US-T-01 y US-F1-01 son los únicos dueños de la estructura de `Program.cs` (auth, `public partial class Program`, health). El seed se divide: un seeder por frente (clase propia), invocados desde `SeedData`.

**C6. Migraciones.** Cada tarea genera su migración solo después de rebasear sobre `development`. Nadie edita una migración ajena. Si el `ModelSnapshot` choca en un merge, se borra la migración propia y se regenera. US-F1-02 (Identity) va en la primera ola de migraciones; F3 (tabla de control del job, si hace falta) y F4 (`RowVersion`) migran después, rebaseando.

**C7. Rutas y autorización.**
- `/api/publico/*`: RN20 (límite de intentos) aplica a todo el prefijo, incluidas las rutas de pago y factura que agrega F4 (`PublicoPagosController`). Lo implementa US-F1-07.
- `/api/externo/*`: autenticación por API key con la política `ApiKey`. Cada frente crea su propio controller bajo ese prefijo para evitar conflictos de merge.
- Nombres de políticas y claims: los publica US-F1-01 en una tabla literal (política `Empleado`, `Admin`, `ApiKey`, claim `proveedor`, etc.) y todas las demás tareas usan exactamente esos strings. Si hay que cambiar uno, se cambia en F1-01 primero.

**C8. Decisiones por defecto mientras la duda esté abierta (sección 10 de la spec).** Cada tarea que depende de una duda la lista en "Decisiones pendientes" con su default; el equipo las cierra en la reunión y se actualiza la tarea antes de tomarla. Defaults recurrentes: primer vencimiento el día 10 del mes `FechaInicio + N` con plazo mínimo entre emisión y vencimiento; IVA 21 % en facturas; pago duplicado: el segundo pago se registra como excedente y se informa, sin reabrir la cuota; Renaper caído en el alta: 201 con `validadoRenaper=false`.

**C9. Trello.** Los IDs `US-F1-01`, `US-T-01`, etc. reemplazan a las tarjetas US-02 a US-05 actuales (a archivar al cargar estas). La carga a Trello se hace después de que el equipo revise este documento.

## Decisiones de alineación entre frentes (cierran los choques detectados en la revisión)

**C10. Nombres canónicos de seguridad (los publica US-F1-01, tabla literal).** Políticas: `Politicas.Empleado`, `Politicas.Admin`, `Politicas.ApiKey`. Claim del proveedor externo: `proveedor`. Esquema JWT: `Bearer`. Prohibido `[Authorize(Roles = "...")]` con strings sueltos y nombres como `Administrador`, `Externo` o `grupo_externo`.

**C11. Excepciones de dominio.** `ReglaDeDominioException` y su subclase `TransicionInvalidaException` las crea US-F3-01 (Domain) y las mapea en `ExceptionMiddleware`. Métodos de dominio: `Cuota.Pagar(...)` y las transiciones de `Poliza` de F3-01. Nadie usa `Cuota.MarcarPagada` ni define otra excepción.

**C12. Cobro.** `IAprobacionPagoService.AprobarAsync(...)` (US-F4-02) recibe un `Pago` ya creado en estado pendiente (con sus `PagoCuota`) y lo aprueba: marca cuotas con `Cuota.Pagar`, llama a `IActualizadorEstadoPoliza.ReevaluarAsync` (dueño: US-F3-01) y emite la factura. Quien origina el pago (caja F4-03, pasarela F4-04/05/06, rendición F3-07) crea el `Pago` pendiente y llama a ese método. Hasta que F4-02 esté mergeado, F3-07 usa el stub `AprobacionPagoPendienteStub` (`TryAddScoped`, con la regla de borrarlo al mergear F4-02).

**C13. Integraciones.** Nombre único del registro: `AddIntegraciones` / `AgregarIntegracion` (US-T-02, dueña de `Integrations/DependencyInjection.cs`). Selector en configuración: `Integraciones:<Servicio>:UsarMock = true|false`. Pasarelas: `Integraciones:Pasarelas:<proveedor>`. Nada usa `AddIntegrations`.

**C14. DI por frente.** Un único patrón para los cuatro frentes: `backend/Aseguradora.Api/Frentes/Frente<N>/Frente<N>Extensions.cs` con `AddFrente<N>(this IServiceCollection services, IConfiguration config)`, y una sola línea en `Program.cs`. Se elimina todo `AddApplication()` compartido. Seed: cada frente implementa `ISeeder` idempotente (patrón que deja armado US-T-01); el administrador inicial de F1 también es un `ISeeder`, no un `IHostedService`. Cada frente crea su propio `Frente<N>Extensions.cs` en su primera tarea y descomenta su propia línea en `Program.cs`; US-T-01 solo deja las líneas comentadas, para que la primera ola no genere conflictos add/add.

**C15. Rate limit público.** RN20 se aplica con un `GlobalLimiter` por prefijo `/api/publico/*` (US-F1-07). Los controllers públicos de F3 y F4 NO llevan `[EnableRateLimiting]` ni lo reimplementan.

**C16. Arnés de tests.** US-T-03 es dueña de `AseguradoraWebFactory` (con `TestAuthHandler` bajo el esquema `Bearer` y la opción `UsarAutenticacionReal` para los tests de JWT de F1). US-F1-01 no crea otro factory definitivo: si T-03 no está mergeada usa uno mínimo temporal que borra al mergear T-03.

**C17. IDs de F3 tras la revisión.** F3 queda con 8 tareas: F3-01 dominio + transiciones + `IActualizadorEstadoPoliza`; F3-02 emisión; F3-03 endpoints de pólizas; F3-04 seguro vigente; F3-05 job de vencimientos; F3-06 código de barras y cupón; F3-07 rendición; F3-08 base positiva. Todo archivo que cite F3-NN usa estos IDs (la numeración vieja F3-02..F3-09 ya no existe).

---

## Índice de tareas

| ID | Título | Tamaño |
| --- | --- | --- |
| US-T-01 | Cerrar la Fase 0: Program.cs, /health con base de datos, Docker Compose y .env | S |
| US-T-02 | Cliente HTTP resiliente y selector mock/real para integraciones | M |
| US-T-03 | Infraestructura de tests compartida: WebApplicationFactory y SQL Server en contenedor | M |
| US-T-04 | Prueba de punta a punta de la Fase 2 y colección HTTP del flujo completo | L |
| US-T-05 | Despliegue en Azure con Cloudflare Tunnel y zona horaria del job | M |
| US-F1-01 | Esquema de autenticación: JWT, roles, políticas y API key | L |
| US-F1-02 | Identity: usuarios, roles y administrador inicial | M |
| US-F1-03 | Login con JWT y alta de empleados (CU01 y CU03) | M |
| US-F1-04 | Renaper: interfaz, mock y cliente real (CU04, validación) | M |
| US-F1-05 | Alta de cliente con validación en Renaper (CU04) | M |
| US-F1-06 | Consulta, modificación y baja lógica de clientes (CU05) | M |
| US-F1-07 | Límite de intentos de la web pública (RN20, por prefijo) y verificador de póliza | M |
| US-F1-08 | Consulta pública de póliza y cuotas (CU02) | M |
| US-F2-01 | Publicar contratos de cotización, cálculo de prima, fake para F3 y punto de registro del frente | M |
| US-F2-02 | ABM de planes (CU08) y seed de planes TC y TR | M |
| US-F2-03 | Servicio DNRPA: mock y cliente HTTP sobre el helper de resiliencia | M |
| US-F2-04 | Alta de vehículo con validación DNRPA (CU06) | M |
| US-F2-05 | Consulta, modificación y baja de vehículos (CU07) | S |
| US-F2-06 | Cotizar un vehículo en los planes compatibles (CU09 interno) | L |
| US-F2-07 | Cotización externa sin cliente (CU09, actor Sistema externo; 9.5 C) | M |
| US-F3-01 | Dominio de Póliza y Cuota: transiciones, excepciones de dominio y reevaluación de estado tras el pago | L |
| US-F3-02 | Emisión de póliza desde cotización (CU10, servicio) | L |
| US-F3-03 | Endpoints de pólizas: emitir, consultar, cancelar y ver cuotas (CU10, CU11, CU12, CU13) | M |
| US-F3-04 | Seguro vigente para sistemas externos (CU19) | S |
| US-F3-05 | Proceso diario de vencimientos y tarea programada (CU14) | L |
| US-F3-06 | Código de barras, cupón de Pago Fácil y cupón público (CU20) | L |
| US-F3-07 | Rendición diaria de Pago Fácil (CU21) | L |
| US-F3-08 | Base positiva de Pago Fácil (CU22) | S |
| US-F4-01 | Publicar contratos de pasarelas, ARCA y aprobación con mocks | M |
| US-F4-02 | Aprobar pagos y emitir factura con CAE (núcleo compartido) | L |
| US-F4-03 | Registrar pago en caja y consultar pagos y facturas | M |
| US-F4-04 | Iniciar pago online con la pasarela elegida | M |
| US-F4-05 | Recibir el webhook de la pasarela de forma idempotente | L |
| US-F4-06 | Conciliar pagos con la pasarela cuando no llegó el webhook | S |
| US-F4-07 | Deuda de cliente para sistemas externos | S |
| US-F4-08 | Clientes HTTP reales de pasarelas y ARCA (contratos 9.2 y 9.3 reales, auth y mapeo de errores) | M |
| US-F4-09 | Reintentar facturas pendientes de CAE | S |

---

## Transversal

Este frente no implementa casos de uso propios: deja listos la base de ejecución (Fase 0 pendiente), la infraestructura de pruebas, el cliente HTTP resiliente para todas las integraciones, el flujo de punta a punta de la Fase 2 y el despliegue. Depende de US-01 (PR #6 y #7, abiertos y no mergeados) y del PR #4 (`chore/docker-compose`), que hoy está abierto y **no** está en `development`.

Dependencias: **hacia** los frentes, US-T-01 (`Program.cs`, `/health`, Swagger y esquemas de seguridad) debe estar en `development` antes de que los frentes registren servicios o pruebas de integración; US-T-02 provee el registro de integraciones que usan F1 (Renaper), F2 (DNRPA), F4 (pasarela y ARCA); US-T-03 provee los fixtures que F1 a F4 reutilizan. **Desde** los frentes, US-T-04 (Fase 2) depende de F1 a F4 terminados; sus archivos (`.http`, checklist de integraciones) pueden esbozarse antes, pero la prueba de punta a punta solo pasa al final.

Orden recomendado: primera ola US-T-01, US-T-02, US-T-03, F1-01, F2-01, F3-01 y F4-01 (convenciones), en paralelo desde ya. US-T-01 y US-T-02 solo se cruzan en una línea de `Program.cs`. Luego los frentes, y al final US-T-04 y US-T-05.

**Reglas comunes de este frente (fuente: convenciones C4 a C7):**
- **Config de integraciones (C4, C13):** selector `Integraciones:{Servicio}:UsarMock` (bool, default `true`). Servicios: `Renaper`, `Dnrpa`, `Arca` (clave `Integraciones:Arca`) y pasarelas bajo `Integraciones:Pasarelas:<proveedor>` (`pasarela1`, `pasarela2`). Pago Fácil no tiene cliente HTTP y no entra. API completa en US-T-02 (`AddIntegraciones`, `AgregarIntegracion`, `AgregarClienteResiliente`).
- **Resiliencia (C4):** ningún frente define timeouts ni reintentos propios. Lo hace US-T-02. Mientras T-02 no esté mergeado, los clientes reales usan los mismos defaults inline (timeout 10 s por intento, 2 reintentos, circuito que abre con 5 fallos en 30 s).
- **Program.cs y seeders (C5, C14):** ver US-T-01 "Patrón de registro por frente".
- **Migraciones (C6):** ver US-T-03 "Regla de migraciones".

### US-T-01 · Cerrar la Fase 0: Program.cs, /health con base de datos, Docker Compose y .env

- **Frente:** Transversal · **Rama sugerida:** `feature/US-T-01-cerrar-fase-0` · **Tamaño:** S
- **Casos de uso / Reglas:** ninguno directo (base) · RN16 y RN17 solo en lo que toca configuración de secretos y formatos · **Secciones de la spec:** 6 (mejoras 1 a 3), 8 (Fase 0), 11.2, 11.4

**Propósito:** terminar lo que falta de la Fase 0 sobre la base ya mergeada: `/health` con chequeo de base, esquemas de seguridad en Swagger, `public partial class Program` y el patrón de seeders y de registro por frente que usan los demás. Sin esto ningún frente puede probar la API contra SQL Server real ni registrar sus servicios sin pisarse.

**Estado de los items de la Fase 0 (verificado contra `development`):**
- Solución con 5 proyectos, entidades y enums del Domain, `AseguradoraDbContext`, configuraciones, migración `InitialCreate`, `EfRepository`, `IUnitOfWork` y middleware de errores: **ya hecho** (US-01, PR #2, #6 y #7).
- Dockerfile, `docker-compose.yml` (con `healthcheck` del servicio `sqlserver`), `.env.example`, CORS por `Cors:AllowedOrigins`, `CF-Connecting-IP` y `UseHttpsRedirection` solo en Development: **ya hecho** (PR #4 y merge de #7).
- CI de GitHub Actions y reglas de protección de ramas: **ya hecho** (PR #8 y ruleset).
- **Pendiente:** `/health` con chequeo de base (hoy solo `AddHealthChecks()`); esquemas de seguridad `Bearer` y `ApiKey` en Swagger (sin lógica de auth; F1 la implementa); `public partial class Program`; `healthcheck` del servicio `api` en compose; claves de JWT, API keys e integraciones en `.env.example`; líneas comentadas por frente en `Program.cs`; infraestructura de `ISeeder`; `Migraciones:AplicarAlIniciar`; `traceId` en `ProblemDetails`.

**Alcance (incluye):**
- `backend/Aseguradora.Api/Program.cs` (dueño de la estructura, junto con F1-01): `AddHealthChecks().AddDbContextCheck<AseguradoraDbContext>()`; `public partial class Program { }` al final (lo agrega T-01 y ninguna otra tarea; lo necesitan `WebApplicationFactory` de US-T-03 y los tests de F1); esquemas de seguridad `Bearer` y `ApiKey` (header `X-Api-Key`) en `AddSwaggerGen`; aplicar migraciones al iniciar si `Migraciones:AplicarAlIniciar` es `true`, y después ejecutar los seeders (ver "Patrón de registro por frente").
- **Patrón de registro por frente (C5), que T-01 deja armado:**
  - Cada frente tiene su carpeta `backend/Aseguradora.Api/Frentes/Frente<N>/` con `Frente<N>Extensions.cs`, que define `public static IServiceCollection AddFrente<N>(this IServiceCollection services, IConfiguration config)` (N = 1 a 4; C14). Cada frente crea su propio archivo en su primera tarea (F1-01, F2-01, F3-01, F4-01); T-01 no lo crea, para que la primera ola no genere conflictos add/add. Cada frente registra sus servicios dentro de su `AddFrente<N>`. `AddIntegraciones` no sigue este patrón: es de US-T-02 y vive en `backend/Aseguradora.Integrations/DependencyInjection.cs` (C13).
  - `Program.cs` recibe **una línea por frente**, literal: `builder.Services.AddFrente1(builder.Configuration);` hasta `builder.Services.AddFrente4(builder.Configuration);`, en ese orden, después de la configuración y antes de `app.Build()`. T-01 deja cinco líneas comentadas como placeholder (`// builder.Services.AddFrente1(builder.Configuration);` hasta `AddFrente4`, y `// builder.Services.AddIntegraciones(builder.Configuration);`); cada tarea dueña descomenta solo su línea, así los PR no se pisan. El `VencimientosJob` de F3 y el `ReintentoFacturasJob` de F4 se registran dentro de su `AddFrente<N>`, no como líneas sueltas en `Program.cs`.
  - **Seeders (C5):** existen dos tipos y T-01 crea la infraestructura de ambos:
    1. Datos que deben existir en cualquier base (roles, planes): `HasData` dentro de `SeedData.Apply(ModelBuilder)` y viajan en la migración. Cambiarlos genera una migración nueva según C6.
    2. Datos idempotentes de arranque (administrador inicial, cuotas o cotizaciones de prueba): interfaz `ISeeder` en `Aseguradora.Data/Seed/ISeeder.cs` con `Task SembrarAsync(IServiceProvider services, CancellationToken ct)`. Cada frente tiene su clase, registrada con `services.AddScoped<ISeeder, ...>()` dentro de su `AddFrente<N>`. El administrador inicial de F1 también es un `ISeeder` idempotente, no un `IHostedService` (C14). `SeedData.EjecutarAsync(IServiceProvider)` recorre `IEnumerable<ISeeder>`; T-01 lo invoca al arrancar después de migrar, y `--migrar` (US-T-05) también lo invoca.
- `backend/Aseguradora.Api/Aseguradora.Api.csproj`: paquete `Microsoft.Extensions.Diagnostics.HealthChecks.EntityFrameworkCore` en la versión 8.0.x que corresponda a EF Core 8.0.11.
- `backend/Aseguradora.Api/Middleware/ExceptionMiddleware.cs`: agregar `Extensions["traceId"] = context.TraceIdentifier` al `ProblemDetails`.
- `backend/Aseguradora.Api/appsettings.Development.json`: `Migraciones:AplicarAlIniciar = true`; `appsettings.json`: `Migraciones:AplicarAlIniciar = false`.
- `backend/Dockerfile`: instalar lo necesario para el `HEALTHCHECK` (ver decisiones) en la imagen de runtime.
- `docker-compose.yml`: `healthcheck` del servicio `api` contra `http://localhost:8080/health`; variable `Migraciones__AplicarAlIniciar` configurable.
- `.env.example`: agregar `JWT__Key`, `ApiKeys__*` (una por grupo externo) y las variables `Integraciones__<Servicio>__*` que documenta US-T-02. Valores falsos, nunca reales.

**Fuera de alcance:**
- Lógica de JWT, roles y API key: tareas de F1 (`AuthController`, middleware de API key).
- Clientes HTTP y la clave `Integraciones:*` en `appsettings`: US-T-02.
- Flag `Swagger:Habilitado` para producción, `--migrar` y `docs/despliegue.md`: US-T-05.
- Limitador por IP de RN20: F1 (`PublicoController`). Esta tarea solo deja la IP real disponible.
- Prueba con SQL Server en contenedor: US-T-03. Esta tarea prueba lo que no necesita Docker (ver tests).

**Puede empezar sin esperar a:** nada. Parte del `development` actual (US-01, Docker y CI ya mergeados). No depende de ninguna otra tarea ni frente.

**Entrega a otros (contratos que publica):**
- `GET /health` (anónimo): 200 `Healthy` con base accesible, 503 si no.
- Esquemas de seguridad Swagger `Bearer` y `ApiKey`, para que F1 y US-T-04 los referencien.
- `Program.cs` con el orden fijo de pipeline y el bloque de registros por frente. F1-01 agrega la autenticación; cada frente completa su `Frentes/Frente<N>/Frente<N>Extensions.cs` (`AddFrente<N>`) y su línea ya existe; US-T-02 activa la línea de `AddIntegraciones`.
- `Aseguradora.Data/Seed/ISeeder.cs` y `SeedData.EjecutarAsync`: cada frente agrega su seeder de arranque sin tocar `SeedData`.
- `ProblemDetails` con `traceId`.

**Criterios de aceptación:**
- [ ] `GET /health` responde 200 con base disponible y 503 cuando la cadena apunta a un servidor inexistente.
- [ ] `GET /health` responde sin credenciales (no queda bloqueado por un fallback de autorización que agregue F1).
- [ ] Con `ASPNETCORE_ENVIRONMENT=Production`, `GET /swagger/v1/swagger.json` responde 404 y no hay redirección HTTPS.
- [ ] Con `ASPNETCORE_ENVIRONMENT=Development`, Swagger declara los esquemas `Bearer` y `ApiKey`.
- [ ] Un origen listado en `Cors:AllowedOrigins` recibe `Access-Control-Allow-Origin`; uno no listado, no.
- [ ] Un 500 devuelve `ProblemDetails` con `traceId` no vacío y sin detalle interno.
- [ ] `docker compose config` valida; `docker compose up -d --wait` deja `api` y `sqlserver` en estado `healthy`; `curl http://127.0.0.1:8080/health` devuelve 200.
- [ ] `.env.example` contiene cada variable que lee `docker-compose.yml` y ninguna credencial real. `.env` sigue en `.gitignore`.
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos** (xunit, `WebApplicationFactory<Program>`, sin Docker):
- `Health_ConBaseInaccesible_RetornaUnhealthy`: cadena a `Server=127.0.0.1,1` devuelve 503.
- `Health_ServidorAnonimo_NoRequiereCredenciales`.
- `Swagger_EnProduction_RetornaNotFound`.
- `Swagger_EnDevelopment_DeclaraEsquemasBearerYApiKey`.
- `Cors_OrigenListado_RecibeHeader` y `Cors_OrigenNoListado_NoRecibeHeader`.
- `ExceptionMiddleware_Error500_IncluyeTraceId` (en `Aseguradora.Tests/Api`, junto al test existente de US-01).
- `Migraciones_AplicarAlIniciarFalso_NoEjecutaMigrate` (la base inaccesible debe provocar que no se intente migrar).
- Prueba de humo manual del compose (criterios de arriba), documentada en el PR, no automatizada.

**Decisiones pendientes:**
- `HEALTHCHECK` de la imagen: propuesta por defecto instalar `curl` en la etapa de runtime de `backend/Dockerfile`. Alternativa: sonda TCP con bash (solo verifica el puerto, no la base). Verificar al construir la imagen que `mcr.microsoft.com/dotnet/aspnet:8.0` no lo trae.
- Migraciones: propuesta por defecto `Migraciones:AplicarAlIniciar=true` en Development y en compose local; en Production, `false` y migración manual con `--migrar` (US-T-05). La spec (11.2) lo deja a confirmar.
- Logging estructurado (Serilog u otro): no lo exige la spec. Propuesta: solo `traceId` y el logging de `Microsoft.Extensions.Logging` existente.

---

### US-T-02 · Cliente HTTP resiliente y selector mock/real para integraciones

- **Frente:** Transversal · **Rama sugerida:** `feature/US-T-02-http-resiliente` · **Tamaño:** M
- **Casos de uso / Reglas:** habilita CU04 (Renaper, RN02), CU06 (DNRPA, RN03), CU18 (ARCA, RN12) y CU15/CU16 (pasarela, RN11/RN12) · **Secciones de la spec:** 2, 6 (mejora 4), 9 (intro), 10 (timeouts y reintentos), 6 (`Aseguradora.Integrations`)

**Propósito:** que cada integración (interfaz en Application, mock y real en Integrations) se registre siempre igual, con timeout, reintentos acotados y circuito abierto, y que cualquier falla del otro grupo llegue a la API como `ExternalServiceException` (502). Así una pasarela lenta no cuelga la API, y el cambio de mock a real es solo configuración.

**Alcance (incluye):**
- `backend/Aseguradora.Integrations/Configuration/IntegracionOptions.cs`: `UsarMock` (default `true`), `BaseUrl`, `ApiKey`, `TimeoutSegundos` (default 10), `ReintentosMaximos` (default 2). Validación con Data Annotations y `ValidateOnStart`; si `UsarMock=false` y falta `BaseUrl` o `ApiKey`, el arranque falla nombrando la clave. Un servicio con más opciones (por ejemplo, F4 con `ConfirmarWebhook`) hereda de `IntegracionOptions` en su propio proyecto; no cambia la clave base.
- `backend/Aseguradora.Integrations/DependencyInjection.cs` (dueño único de este archivo; F1-03, F2 y F4 no lo crean): `public static IServiceCollection AddIntegraciones(this IServiceCollection services, IConfiguration configuration)`. Registra la infraestructura común y no registra servicios concretos por sí mismo.
- `backend/Aseguradora.Integrations/Http/ResilienciaExtensions.cs`: `public static IHttpClientBuilder AgregarResiliencia(this IHttpClientBuilder builder, IntegracionOptions opciones)`. Llama a `AddStandardResilienceHandler` y fija:
  - `AttemptTimeout` = `TimeoutSegundos` por intento.
  - `Retry.MaxRetryAttempts` = `ReintentosMaximos`, con backoff exponencial.
  - `TotalRequestTimeout` = `TimeoutSegundos × (ReintentosMaximos + 1) + 5 s` de margen para el backoff. Así el total acota a los reintentos, como documenta el handler (el timeout total corre antes que el retry y el timeout por intento va al final de la cadena).
  - `CircuitBreaker`: `MinimumThroughput = 5`, `FailureRatio = 1.0`, `SamplingDuration = 30 s`. Esto aproxima "5 fallos seguidos en 30 s"; el circuito no es exactamente consecutivo.
  - Header `X-Api-Key` con `opciones.ApiKey` en `DefaultRequestHeaders` del cliente.
- `AgregarIntegracion<TInterfaz, TMock, TReal>(this IServiceCollection, IConfiguration, string nombre)`: lee `Integraciones:{nombre}:UsarMock` y registra una sola implementación con lifetime `Scoped`. Si `UsarMock=false`, registra `TReal` con `AddHttpClient<TReal>()` + `AgregarResiliencia`. Sirve para servicios de implementación única (`Renaper`, `Dnrpa`, `Arca`).
- `Pasarelas` (F4): como hay dos implementaciones por proveedor y un resolver (`IPasarelaResolver`), T-02 **no** las registra con `AgregarIntegracion`. Expone `AgregarClienteResiliente<TOpciones>(this IServiceCollection, IConfiguration, string seccion)`: lee `Integraciones:{seccion}` y devuelve el `IHttpClientBuilder` ya con `AgregarResiliencia`. Así F4 registra `pasarela1` y `pasarela2` con los mismos defaults y sin duplicar la lógica.
- `backend/Aseguradora.Integrations/Http/ClienteHttpBase.cs`: clase base protegida con `EnviarAsync(HttpRequestMessage, CancellationToken, bool esIdempotente)`. Traduce timeouts, errores de red, respuestas 5xx y circuito abierto a `ExternalServiceException`. Las respuestas 4xx se devuelven al cliente tipado para que decida (por ejemplo, `PERSONA_NO_ENCONTRADA`). El reintento de POST no idempotente se bloquea marcando la request y consultando esa marca en `ShouldHandle` del retry (ver Decisiones).
- `backend/Aseguradora.Integrations/Aseguradora.Integrations.csproj`: paquetes `Microsoft.Extensions.Http` y `Microsoft.Extensions.Http.Resilience` 8.x.
- `backend/Aseguradora.Api/Program.cs`: una línea `builder.Services.AddIntegraciones(builder.Configuration)`, después de T-01.

**Fuera de alcance:**
- Interfaces `IRenaperService`, `IDnrpaService`, `IArcaService`, `IPasarelaService` (en `Application/External`) y sus mocks/reales: cada frente en sus tareas (F1, F2, F4). Pago Fácil no es HTTP.
- Claves reales de integraciones en `appsettings`: solo en `.env` (T-01 documenta los nombres).

**Puede empezar sin esperar a:** solo necesita `ExternalServiceException` (ya existe en `Aseguradora.Application/Exceptions`). Arranca ya, desde `development` (primera ola); no espera a US-T-01. El único punto de contacto es la línea de `Program.cs`: si T-01 ya está mergeada, activa el placeholder comentado; si no, agrega la línea.

**Entrega a otros (contratos que publica):**
- `AddIntegraciones(IServiceCollection, IConfiguration)`: lo llama `Program.cs` en una línea (la de T-02). Es el nombre único: ningún frente crea otro método de DI de integraciones.
- `AgregarIntegracion<TInterfaz, TMock, TReal>(services, configuration, nombre)`: F1 (Renaper), F2 (Dnrpa) y F4 (Arca) lo usan para su interfaz de implementación única.
- `AgregarClienteResiliente<TOpciones>(services, configuration, seccion)` y `AgregarResiliencia(builder, opciones)`: F4 lo usa para las dos pasarelas.
- `ClienteHttpBase` con `EnviarAsync`: los clientes reales lo heredan; nadie lanza `HttpRequestException` a la capa de Application.
- Configuración (una clave por servicio, con UsarMock como selector):
  - `Integraciones:Renaper:{UsarMock|BaseUrl|ApiKey|TimeoutSegundos|ReintentosMaximos}` (la ApiKey va en variable de entorno `Integraciones__Renaper__ApiKey`).
  - `Integraciones:Dnrpa:{...}` y `Integraciones:Arca:{...}`.
  - `Integraciones:Pasarelas:<proveedor>:{...}` (proveedores `pasarela1` y `pasarela2`). Clave de ARCA: `Integraciones:Arca` (C13).
  - Pago Fácil no tiene clave porque no es HTTP. El `Integraciones:Pasarela` singular que figuraba antes se elimina.

**Criterios de aceptación:**
- [ ] Con `Integraciones:Renaper:UsarMock=true` se resuelve el mock; con `false`, la real.
- [ ] Con `UsarMock=false` y `BaseUrl` vacía, la aplicación no arranca y el mensaje nombra `Integraciones:<Servicio>:BaseUrl`.
- [ ] Un timeout del otro grupo se traduce en `ExternalServiceException` y el middleware responde 502.
- [ ] Un GET que recibe 503 se reintenta `ReintentosMaximos` veces y luego lanza `ExternalServiceException`.
- [ ] Un POST no idempotente (creación de pago en la pasarela) se envía exactamente una vez, aunque falle.
- [ ] Con 5 fallos en 30 s el circuito abre y la siguiente llamada falla sin salir a la red (aproximación del circuit breaker de Polly; ver Decisiones).
- [ ] Un 404 del otro grupo no se reintenta y llega al cliente tipado como respuesta 4xx.
- [ ] La API key viaja en `X-Api-Key` y no aparece en logs.
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos** (xunit, `HttpMessageHandler` falso, sin Docker):
- `Timeout_LanzaExternalServiceException`.
- `Get503_ReintentaHastaReintentosMaximos_LuegoLanza` (cuenta de llamadas exacta).
- `Post_NoIdempotente_NoSeReintenta`.
- `Circuito_AbreTrasFallosConsecutivos_FallaSinRed`.
- `Respuesta404_NoSeReintenta_NoLanza`.
- `Options_UsarMockFalso_SinBaseUrl_FallaAlArrancar`.
- `AgregarIntegracion_UsarMockTrue_ResuelveMock` y `..._False_ResuelveReal` (con `ServiceCollection`).
- Casos nulos: `AgregarIntegracion` y `EnviarAsync` con argumentos nulos lanzan `ArgumentNullException`.

**Decisiones pendientes:**
- Sección 10 (timeouts y reintentos). Propuesta por defecto: timeout de 10 s por intento, 2 reintentos con backoff exponencial, circuito que abre con 5 fallos en 30 s. A confirmar por el equipo. Mientras T-02 no esté mergeado, los clientes reales usan estos mismos valores inline.
- Exclusión de reintentos para no idempotentes: la doc consultada (Microsoft.Extensions.Http.Resilience) confirma el orden de la cadena (rate limiter, timeout total, retry, circuit breaker, timeout por intento), pero no confirma que la 8.x tenga una opción para desactivar el retry en métodos no seguros. Verificarlo al implementar en la versión fijada. Si no existe, `ShouldHandle` del retry consulta una marca de la request que pone `ClienteHttpBase` cuando `esIdempotente=false`.
- Validación de la regla de circuito: no está confirmado en la doc consultada que `SamplingDuration` deba ser al menos el doble de `AttemptTimeout`. Con 10 s por intento, 30 s cumple esa proporción de todos modos. Verificarlo al implementar y, si el handler lo exige, ajustar la prueba de arranque.
- Idempotencia de ARCA: 9.2 dice que ARCA "debería" devolver la misma factura para la misma `referenciaExterna`. Propuesta por defecto: reintentar el POST de ARCA y no el de la pasarela. Confirmar con el grupo de ARCA antes de activar el reintento.

---

### US-T-03 · Infraestructura de tests compartida: WebApplicationFactory y SQL Server en contenedor

- **Frente:** Transversal · **Rama sugerida:** `feature/US-T-03-infra-tests` · **Tamaño:** M
- **Casos de uso / Reglas:** ninguno directo; implementa la estrategia de pruebas de la sección 10 y el criterio de `dotnet test` en verde de `docs/workflow.md` · **Secciones de la spec:** 10 (estrategia de tests), 6 (`Aseguradora.Tests` implícito en la solución)

**Propósito:** dejar armados los fixtures que F1 a F4 y US-T-04 reutilizan: la API levantada en memoria, una base SQL Server 2022 real en contenedor migrada y con seed, auth de prueba por rol y builders de entidades. Cada frente escribe sus pruebas de integración sin reinventar la base.

**Alcance (incluye):**
- `backend/Aseguradora.Tests/Fixtures/AseguradoraWebFactory.cs`: `WebApplicationFactory<Program>` que inyecta `ConnectionStrings:Default` con el contenedor, fuerza `Integraciones:*:UsarMock=true` y, salvo que `UsarAutenticacionReal` sea `true`, reemplaza el esquema `Bearer` por `TestAuthHandler` (C16).
- `backend/Aseguradora.Tests/Fixtures/SqlServerContainerFixture.cs`: `IAsyncLifetime` con Testcontainers para SQL Server 2022; espera readiness, aplica `Database.MigrateAsync()` y el seed de `SeedData`; `DisposeAsync` elimina el contenedor.
- `backend/Aseguradora.Tests/Fixtures/SqlServerCollection.cs`: `[CollectionDefinition("SqlServer")]` para compartir el contenedor entre clases.
- `backend/Aseguradora.Tests/Fixtures/TestAuthHandler.cs`: `AuthenticationHandler` que lee `X-Test-Role` (valor de rol de F1-01; ver Decisiones pendientes) y `X-Test-UserId`. Se registra **bajo el nombre de esquema `Bearer`** (reemplazando JWT solo en el factory), no con un esquema `Test` aparte. Motivo: las políticas `Politicas.Empleado` y `Politicas.Admin` (C10) están atadas a `Bearer`; con un esquema distinto, las pruebas de los frentes no pasarían la autorización real. No emite JWT ni valida credenciales (eso es de F1). Las pruebas de F1 que validan JWT real usan `UsarAutenticacionReal = true` y no usan este handler (C16).
- `backend/Aseguradora.Tests/Builders/TestBuilder.cs` y builders de las entidades que ya existen en Domain (`Cliente`, `Vehiculo`, `Plan`, `Poliza`, `Cuota`), con valores válidos por defecto según RN01, RN03 y RN07. Los frentes agregan los suyos.
- `backend/Aseguradora.Tests/Aseguradora.Tests.csproj`: `Microsoft.AspNetCore.Mvc.Testing` 8.0.11, `Testcontainers.MsSql` y `Xunit.SkippableFact` (versiones estables verificadas al implementar). El framework es **xUnit** (C1): no se agregan MSTest, Moq ni FluentAssertions salvo que una tarea los agregue explícitamente. Los fakes se escriben a mano.
- Mantener `SqliteDbFixture` de US-01 para pruebas de Data sin SQL Server. Las pruebas que dependen del provider (índices únicos, `decimal`, transacciones) usan SQL Server.
- **Regla de migraciones (C6), aplica a todas las tareas que agregan migraciones:**
  1. Cada tarea genera su migración solo después de rebasear sobre `development`.
  2. Nadie edita una migración ajena (`Migrations/*.cs` ni `AseguradoraDbContextModelSnapshot.cs` de otra tarea).
  3. Si el `ModelSnapshot` choca en un merge: se borra la migración propia, se rebasea y se regenera con `dotnet ef migrations add`. Nunca se resuelve a mano.
  4. Orden de migraciones: F1-02 (Identity) va primero entre las de la primera ola; F3 (tabla de control del job, si hace falta) y F4 (`RowVersion`) migran después, rebaseando. El seed de planes de F2 no migra: es un `ISeeder`.
  5. Una sola persona crea migraciones a la vez por frente.
  Esta regla vive en esta tarea (fixture y guía de migraciones de `Aseguradora.Tests`).
- **Dueño único del factory (C16):** `AseguradoraWebFactory` es el factory compartido. F1-01 no crea uno definitivo: si T-03 no está mergeada, usa uno mínimo temporal que se borra al mergear T-03.

**Fuera de alcance:**
- Pruebas de dominio y de servicios de cada frente: cada frente.
- Pruebas de `/health`, Swagger y CORS: US-T-01 (no necesitan contenedor, salvo el caso healthy, que va aquí).
- Pruebas de flujo completo: US-T-04.

**Puede empezar sin esperar a:** `SqlServerContainerFixture`, `TestAuthHandler` y los builders no dependen de nadie y pueden empezar ya. `AseguradoraWebFactory` necesita `public partial class Program` de US-T-01 mergeado.

**Entrega a otros (contratos que publica):**
- `AseguradoraWebFactory : WebApplicationFactory<Program>` (namespace `Aseguradora.Tests.Fixtures`) y `SqlServerCollection`: los frentes usan `[Collection("SqlServer")]` y `IClassFixture<AseguradoraWebFactory>`.
- Opción `public bool UsarAutenticacionReal { get; set; } = false;`, fijada antes del primer `CreateClient()`. Con `false`, el esquema `Bearer` lo ocupa `TestAuthHandler`; con `true`, queda la autenticación JWT real de F1-01. Solo F1 la activa.
- Método `CrearCliente(string rol)` en el factory que devuelve un `HttpClient` con `X-Test-Role` (con `UsarAutenticacionReal = false`).
- F1-01 puede usar un factory mínimo temporal con la misma opción `UsarAutenticacionReal` mientras T-03 no esté mergeada; al mergear T-03 lo reemplaza por `AseguradoraWebFactory` y lo borra.
- Convención: pruebas que necesitan Docker llevan `[SkippableFact]` y se saltan con mensaje claro cuando no hay Docker o no está `ASEGURADORA_TESTS_DOCKER=1`.

**Criterios de aceptación:**
- [ ] `dotnet test` en una máquina sin Docker queda en verde: las pruebas de contenedor se saltan con mensaje, no fallan.
- [ ] Con `ASEGURADORA_TESTS_DOCKER=1`, el fixture levanta SQL Server 2022, aplica migraciones y seed, y el contenedor desaparece al terminar.
- [ ] El factory fuerza `UsarMock=true`: `IRenaperService` resuelve el tipo mock aunque la configuración diga `false`.
- [ ] `CrearCliente("Empleado")` llega autenticado con rol Empleado; un rol inexistente responde 401.
- [ ] Los builders producen entidades válidas por defecto (pasan las validaciones de dominio existentes).
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos:**
- `Factory_ConMockForzado_ResuelveMockAunqueConfigDigaReal` (sin Docker).
- `Factory_UsarAutenticacionRealTrue_NoReemplazaBearer` (sin Docker).
- `TestAuthHandler_RolInvalido_Responde401` (sin Docker).
- `Builders_ValoresPorDefecto_SonEntidadesValidas` (sin Docker).
- `Fixture_ConDocker_AplicaMigracionesYSeed` (Docker): comprueba el seed que existe hoy en `SeedData` (plan RC, cliente `30123456`, vehículo `AB123CD`, póliza Vigente `SeedData.PolizaId`). No asserta TC, TR ni el administrador: esos datos llegan con F2-02 (TC y TR) y F1-02 (administrador), y sus propias pruebas los verifican cuando estén mergeados. Así T-03 no depende de otro frente.
- `Fixture_ConDocker_DisposeEliminaContenedor` (Docker).
- Casos nulos: `TestBuilder` y `CrearCliente` con argumento nulo o vacío lanzan `ArgumentException` o `ArgumentNullException`.

**Decisiones pendientes:**
- Docker en el equipo: el CI ya existe (`.github/workflows/ci.yml`, job `backend`) y corre `dotnet test` en cada PR. Propuesta por defecto: las pruebas con contenedor se ejecutan localmente con Docker Desktop y `ASEGURADORA_TESTS_DOCKER=1`; sin la variable se omiten y `dotnet test` pasa igual. Si el equipo quiere correrlas en el CI, se agrega un job aparte (los runners de GitHub traen Docker).
- Valor del rol administrador en `X-Test-Role`: C10 fija la política `Politicas.Admin`, pero no el nombre del rol. Propuesta por defecto: el mismo valor que la constante de rol de F1-01 (hoy `Administrador` en su archivo); confirmar antes de tomar T-03 o F1-01.

---

### US-T-04 · Prueba de punta a punta de la Fase 2 y colección HTTP del flujo completo

- **Frente:** Transversal · **Rama sugerida:** `feature/US-T-04-e2e-flujo` · **Tamaño:** L
- **Casos de uso / Reglas:** CU04, CU06, CU09, CU10, CU15, CU16, CU18, CU19 · RN01, RN02, RN03, RN05, RN06, RN07, RN10, RN11, RN12 · **Secciones de la spec:** 7, 8 (Fase 2), 9.1 a 9.5

**Propósito:** demostrar que el back completo recorre el flujo de la sección 8 con los mocks (alta de cliente, alta de vehículo, cotización, emisión, pago, webhook, factura y seguro vigente), y dejar un archivo `.http` que cualquiera del equipo ejecuta paso a paso en Swagger o REST Client. Es la prueba de integración de todo el back: se escribe en paralelo y pasa al final.

**Alcance (incluye):**
- `backend/Aseguradora.Tests/EndToEnd/FlujoCompletoTests.cs`: un test que usa `AseguradoraWebFactory` y `SqlServerCollection`, con los pasos de la sección 8 y sus códigos de respuesta de la sección 7.
- `backend/Aseguradora.Tests/EndToEnd/IntegracionesRegistroTests.cs`: por reflexión, verifica que cada interfaz de `Application/External` tiene mock y real registrados. Las interfaces de implementación única (`IRenaperService`, `IDnrpaService`, `IArcaService`) se verifican con `AgregarIntegracion`. `IPasarelaService` se verifica por el resolver de F4 (`IPasarelaResolver`) con una implementación por proveedor (`pasarela1` y `pasarela2`), porque F4 no la registra con `AgregarIntegracion` (ver US-T-02).
- `backend/http/flujo-completo.http`: pasos en orden, con variables `@baseUrl`, `@apiKey` y `@jwt`, y la respuesta esperada como comentario en cada paso.
- `docs/integraciones.md`: tabla con los cinco servicios de la sección 2 (clave de configuración, mock, real, grupo responsable, estado).
- Prueba opcional contra APIs reales con `[SkippableFact]` que se activa solo con `E2E_REAL=1`.

**Fuera de alcance:**
- Implementación de cada endpoint y de cada servicio: frentes F1 a F4.
- Despliegue y dominio: US-T-05.

**Puede empezar sin esperar a:** la colección `.http` y `docs/integraciones.md` pueden escribirse ya desde las secciones 7 y 9 de la spec, con los endpoints que todavía no existen marcados como pendientes. **Depende de** F1 (clientes, auth), F2 (vehículos, cotización), F3 (emisión, póliza vigente, cuotas), F4 (pagos, webhook, factura), US-T-02 y US-T-03. El test de punta a punta no puede pasar antes de que los cuatro frentes estén mergeados.

**Entrega a otros (contratos que publica):**
- `backend/http/flujo-completo.http`: la guía para probar la API en Swagger, que los frentes usan para validar sus endpoints.
- `docs/integraciones.md`: el checklist de paso de mock a real que el equipo sigue al recibir cada API.

**Criterios de aceptación:**
- [ ] Con todos los mocks, `FlujoCompletoTests` recorre los ocho pasos y cada uno devuelve el código de la sección 7 (201 al crear, 200 al consultar, 400 ante regla de negocio).
- [ ] Tras el webhook con `estado: APROBADO`, la póliza pasa a Vigente (RN07, RN09) y `GET /api/externo/vehiculos/AB123CD/seguro-vigente` responde `tieneSeguro: true` con `vigenteHasta` igual a `FechaFin`.
- [ ] Reenviar el mismo webhook no crea un segundo pago ni una segunda factura (RN12).
- [ ] La factura queda con CAE devuelto por el mock de ARCA.
- [ ] `flujo-completo.http` se ejecuta de punta a punta cambiando solo `@apiKey` y `@jwt`.
- [ ] `docs/integraciones.md` lista los cinco servicios con su clave `Integraciones:*`.
- [ ] `TodasLasInterfacesExternasTienenMockYReal` pasa.
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos:**
- `FlujoCompletoTests.Flujo_AltaEmisionPagoWebhookFacturaSeguroVigente` (Docker).
- `FlujoCompletoTests.WebhookRepetido_NoDuplicaPagoNiFactura` (Docker).
- `FlujoCompletoTests.SeguroVigente_PolizaNoVigente_RespondeTieneSeguroFalse` (Docker): caso de RN10.
- `IntegracionesRegistroTests.TodasLasInterfacesExternasTienenMockYReal` (sin Docker).
- `FlujoCompletoRealTests` con `[SkippableFact]` y `E2E_REAL=1` (manual).

**Decisiones pendientes:**
- Ubicación de la colección: propuesta por defecto `backend/http/flujo-completo.http` (REST Client de VS Code o Rider). Alternativa: colección de Postman exportada en JSON. Tradeoff: el `.http` se versiona como texto y se diff-ea; Postman necesita exportar y es más pesado para revisar.
- Datos de la prueba: propuesta por defecto DNI `30123456` y patente `AB123CD`, tomados de los ejemplos de 9.1 y 9.4, que el seed debe contener.
- Pasarela en la prueba: mientras no haya una real, la pasarela mock de F4 cumple el rol. Cuando haya real, el plan B de la sección 2 (MercadoPago en sandbox) se usa en `FlujoCompletoRealTests`.

---

### US-T-05 · Despliegue en Azure con Cloudflare Tunnel y zona horaria del job

- **Frente:** Transversal · **Rama sugerida:** `feature/US-T-05-despliegue` · **Tamaño:** M
- **Casos de uso / Reglas:** soporta CU14 (zona horaria de RN08, RN09, RN14), CU16 (URL estable del webhook, RN12) y CU19 (acceso externo) · RN16 (UTC), RN20 (IP real detrás del túnel) · **Secciones de la spec:** 6 (mejora 5), 10 (Swagger público, Azure, dominio), 11.1 a 11.6

**Propósito:** dejar la API corriendo en un servidor Azure, accesible por HTTPS desde Internet con dominio fijo a través de Cloudflare Tunnel, con Swagger controlado, CORS para los dominios de Pages, imagen con zona horaria de Buenos Aires verificada y un procedimiento de migración y despliegue escrito.

**Alcance (incluye):**
- Código, `backend/Aseguradora.Api/Program.cs`: flag `Swagger:Habilitado` (default `true` en Development, `false` en Production) que controla `UseSwagger`/`UseSwaggerUI`; `TimeProvider.System` registrado como singleton para que F3 calcule fechas en `America/Argentina/Buenos_Aires` sin usar `DateTime.Now`.
- Código, `backend/Aseguradora.Api/Program.cs`: argumento `--migrar` que aplica `MigrateAsync()`, ejecuta `SeedData.EjecutarAsync` (seeders idempotentes de T-01) y termina con código 0. Es idempotente.
- `backend/Dockerfile`: verificar que la imagen tiene `tzdata` (`/usr/share/zoneinfo/America/Argentina/Buenos_Aires`) y documentarlo.
- `docker-compose.yml` y `.env.example`: `CORS_ORIGIN_BACKOFFICE` y `CORS_ORIGIN_PUBLIC` con los dominios de Pages; `Swagger__Habilitado`; `TZ=America/Argentina/Buenos_Aires` para el contenedor.
- `docs/despliegue.md`: pasos de VM (Docker, `.env`, `docker compose up -d`, `--migrar`, perfil `tunnel`), configuración de Cloudflare (túnel con nombre, registro DNS, WAF Managed Rules, regla de rate limiting sobre `/api/publico/*` como filtro grueso, Bot Fight Mode apagado para `/api/webhooks` y `/api/externo` según 11.5) y verificación final.
- Azure: aprovisionar la VM Linux x64 con Docker. SQL Server 2022 solo corre en x64, y se necesitan al menos 4 GB de RAM.

**Fuera de alcance:**
- Lógica del job diario y del cálculo de vencimientos: F3 (`VencimientosJob`). Esta tarea solo garantiza la zona horaria y `TimeProvider`.
- Limitador de RN20 (10 intentos por minuto por IP): F1. Esta tarea solo verifica que llegue la IP real.
- Backups de SQL Server: la spec no los menciona (ver Dudas).

**Puede empezar sin esperar a:** el aprovisionamiento de Azure, la compra o asignación de dominio y la configuración de Cloudflare no dependen de código y pueden empezar ya. La parte de código depende de US-T-01 (`Program.cs` y `/health`).

**Entrega a otros (contratos que publica):**
- `TimeProvider` registrado como singleton: F3 lo inyecta en `VencimientosJob`.
- Flags `Swagger:Habilitado` y `--migrar`, documentados en `docs/despliegue.md`.
- URL pública estable del webhook de pasarela, que US-T-02 y F4 configuran en `urlNotificacion`.

**Criterios de aceptación:**
- [ ] `https://<dominio>/health` responde 200 desde Internet (verificación manual).
- [ ] Con Swagger deshabilitado en Production, `https://<dominio>/swagger/index.html` responde 404.
- [ ] `docker compose run --rm api --migrar` termina con código 0 y se puede volver a ejecutar sin error.
- [ ] Dentro del contenedor, `TimeZoneInfo.FindSystemTimeZoneById("America/Argentina/Buenos_Aires")` resuelve (verificación manual con `docker compose exec`).
- [ ] Un request con `X-Api-Key` válido llega a `/api/webhooks/pasarela/{proveedor}` por el túnel, y la IP que ve el limitador de F1 es la del cliente y no la de Cloudflare.
- [ ] `docs/despliegue.md` cubre cada punto de 11.1 a 11.5 con lo decidido.
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos:**
- `Swagger_EnProduction_Deshabilitado` y `Swagger_EnProduction_HabilitadoPorFlag_Responde200` (sin Docker, `WebApplicationFactory`).
- `Migrar_ConBaseDisponible_TerminaConCero` y `Migrar_SegundaVez_EsIdempotente` (Docker).
- `TimeProvider_EsSingletonDelSistema` (sin Docker).

**Decisiones pendientes:**
- Servicio de Azure (sección 10 y 11.1): propuesta por defecto VM Linux con Docker. Alternativa: servicios administrados. Tradeoff: la VM reutiliza el compose de US-T-01 tal cual; los administrados obligan a reescribir el despliegue y separar SQL Server.
- Dominio propio (sección 10): sin dominio no hay túnel con nombre fijo ni URL estable para webhooks. Propuesta por defecto: pedirlo al equipo; mientras tanto, solo un túnel temporal para pruebas, sin webhooks reales.
- Swagger en producción (sección 10): propuesta por defecto deshabilitado en Production, habilitado para el equipo con `Swagger__Habilitado=true` en un entorno restringido.
- Migraciones en producción (sección 11.2): propuesta por defecto `--migrar` manual, nunca al iniciar.
- Bot Fight Mode (11.5): propuesta por defecto apagado, porque el plan gratis no permite excluir rutas.

---

## Trazabilidad: Fase 0, Fase 2 y transversal -> tarea

| Item (fuente) | Estado | Tarea |
| --- | --- | --- |
| Crear solución con 5 proyectos (Fase 0) | ya hecho (PR #2, `4c870de`) | US-01 |
| Entidades y enums del Domain (Fase 0) | ya hecho (PR #6) | US-01 |
| `AseguradoraDbContext`, configuraciones y migración (Fase 0) | ya hecho (PR #7) | US-01 |
| `EfRepository`, `IUnitOfWork` y middleware de errores (Fase 0) | ya hecho (PR #7) | US-01 |
| Swagger (Fase 0) | ya hecho en Development; esquemas de seguridad pendientes | US-T-01 |
| CORS (Fase 0) | ya hecho (PR #4); dominios de prod pendientes | US-T-05 |
| `appsettings` con cadena de conexión (Fase 0) | ya hecho (PR #4 y #7); falta `Migraciones:AplicarAlIniciar` | US-T-01 |
| `Dockerfile` de la API (Fase 0, 11.2) | ya hecho (PR #4); falta lo del `HEALTHCHECK` | US-T-01 |
| `docker-compose.yml` (Fase 0, 11.2) | ya hecho (PR #4); `healthcheck` del servicio `api` pendiente | US-T-01 |
| `.env.example` (Fase 0, 11.2) | ya hecho (PR #4); variables de JWT, API keys e integraciones pendientes | US-T-01 |
| `/health` con chequeo de base (Fase 0, 11.2) | pendiente | US-T-01 |
| Forwarded headers / `CF-Connecting-IP` (11.4) | ya hecho (PR #4) | US-F1-07 (IP real para RN20) |
| `UseHttpsRedirection` solo en Development | ya hecho (PR #4) | — |
| Migraciones al iniciar en Development (11.2) | pendiente | US-T-01 (prod: US-T-05) |
| Correlación `traceId` en errores (transversal, bajo costo) | pendiente | US-T-01 |
| Timeouts y reintentos de `HttpClient` (sección 10, 6 mejora 4) | pendiente | US-T-02 |
| Selector mock/real por configuración (sección 2, 6 mejora 4) | pendiente | US-T-02 (por servicio: cada frente) |
| Estrategia de tests (sección 10) | pendiente | US-T-03 |
| Fixtures compartidos para frentes (transversal) | pendiente | US-T-03 |
| Framework de tests xUnit, sin Moq/FluentAssertions salvo que una tarea los agregue (C1) | decidido | US-T-03 |
| Regla de migraciones: rebase, no editar ajenas, regenerar si choca el snapshot (C6) | decidido | US-T-03 (guía) |
| `Program.cs`: estructura, pipeline, `public partial class Program` (C5) | pendiente | US-T-01 (F1-01 agrega auth) |
| `Frentes/Frente<N>/Frente<N>Extensions.cs` con `AddFrente<N>` + una línea en `Program.cs` (C5, C14) | pendiente | US-T-01 (líneas comentadas); cada frente (su archivo y su línea) |
| Seeders por frente (`ISeeder` invocados desde `SeedData`) (C5, C14) | pendiente | US-T-01 (infraestructura); cada frente (su seeder); F1-02 (administrador) |
| Config de integraciones `Integraciones:{Servicio}:UsarMock` y selector mock/real (C4, C13) | pendiente | US-T-02 (cada frente usa su servicio) |
| `AddIntegraciones`, `AgregarIntegracion`, `AgregarClienteResiliente`; claves `Integraciones:Pasarelas:<proveedor>` e `Integraciones:Arca` (C13) | pendiente | US-T-02 (dueña de `Integrations/DependencyInjection.cs`) |
| Políticas `Politicas.Empleado`, `Politicas.Admin`, `Politicas.ApiKey`, claim `proveedor`, esquema `Bearer` (C10) | pendiente | US-F1-01 (tabla fuente) |
| Helper de resiliencia `AgregarResiliencia` (timeout, reintentos, circuito) (C4) | pendiente | US-T-02 |
| Factory compartido `AseguradoraWebFactory` (opción `UsarAutenticacionReal`) y `TestAuthHandler` con esquema `Bearer` (C16) | pendiente | US-T-03 (F1-01 con factory temporal hasta mergear) |
| Prueba de punta a punta del flujo completo (Fase 2, sección 8) | pendiente | US-T-04 |
| Colección Swagger / HTTP del flujo (Fase 2) | pendiente | US-T-04 |
| Checklist de reemplazo mock -> real (Fase 2, sección 2) | pendiente | US-T-04 (`docs/integraciones.md`) |
| Azure, despliegue y VM con Docker (11.1) | ya hecho (PR #19) | US-T-05 |
| Cloudflare: Tunnel, WAF, rate limiting, Bot Fight Mode (11.1, 11.5) | pendiente | US-T-05 |
| Zona horaria `America/Argentina/Buenos_Aires` y tzdata (11.3, 6 mejora 5) | pendiente (lógica del job: F3) | US-T-05 |
| Swagger público en producción (sección 10, 11) | pendiente (decisión abierta) | US-T-05 |
| Dominio propio (sección 10, 11.1) | ya hecho (PR #19) | US-T-05 |
| Migraciones en producción (11.2) | pendiente | US-T-05 |
| Pago duplicado / confianza en webhook (sección 10) | fuera de transversal | F4 |
| Limitador RN20 y `/api/publico/*` (11.4) | fuera de transversal | F1 |
| Facturas pendientes de CAE (sección 10) | fuera de transversal | F4 |

## Notas abiertas del frente transversal

- **Los tests actuales usan SQLite** (`SqliteDbFixture`), y la spec pide SQL Server en contenedor. Se mantienen ambos (US-T-03).
- **Timeouts en el handler estándar.** La doc (Microsoft.Extensions.Http.Resilience) no confirma `DisableForUnsafeHttpMethods` en la versión 8.x ni la regla de `SamplingDuration`. Se verifica al implementar US-T-02 (ver Decisiones de T-02).
- **Sin definir en la spec:** backups de SQL Server, CI (qué corre `dotnet test` y dónde), y monitoreo o alertas en producción.
- **Sin validar en esta tarea:** que `mcr.microsoft.com/dotnet/aspnet:8.0` incluya `curl` y `tzdata`; se verifica al construir la imagen (US-T-01 y US-T-05). No se pudo construir la imagen ni ejecutar `dotnet test` desde este análisis: solo se leyó el repo y el historial de git.
- **Sección 10 deja abiertas** timeouts (US-T-02), estrategia de tests (US-T-03), Swagger público, Azure y dominio (US-T-05). Las propuestas por defecto están en cada tarea.
- **Pago duplicado y confianza en el webhook** siguen abiertos en la sección 10 y son de F4; no se resuelven aquí.
- Inconsistencia en la spec: 9.5 B dice que el webhook de pago sin `referenciaExterna` manda `idCuotas` (lista), pero el JSON del webhook de 9.3 paso 2 no tiene ese campo. Lo resuelve F4.

---

## Frente 1 — Seguridad, clientes y web pública

Este frente deja listo el esquema de autenticación (JWT para empleados y administradores, API key para sistemas externos) y las políticas `Politicas.Empleado`, `Politicas.Admin` y `Politicas.ApiKey`, cuyo nombre literal se publica en la tabla de US-F1-01. Después implementa clientes (CU04 y CU05), el servicio de Renaper (mock y real), el login y el alta de empleados (CU01 y CU03), y la web pública de consulta de póliza (CU02) con su límite de intentos (RN20). No depende de ningún otro frente: usa solo lo que ya existe en `backend/` (entidades, seed con el cliente 30123456 y la póliza POL-0000001).

**Dependencias hacia otros frentes (cerradas en este documento):**
- US-F1-01 publica la tabla literal de políticas (`Politicas.Empleado`, `Politicas.Admin`, `Politicas.ApiKey`, claim `proveedor`, esquema `Bearer`) y el arnés de tests (`TokenDePrueba`, `ProbeController`). F2, F3 y F4 usan esos nombres exactos (C10).
- US-F1-02 cambia la base de `AseguradoraDbContext` y crea la migración `AddIdentity`, que es la primera migración del repo después de US-01 (C6). Los demás frentes rebasan antes de crear sus migraciones.
- US-F1-07 aplica RN20 a todo `/api/publico/*` por prefijo, de forma global. F3 (CU20, `POST /api/publico/cupon`) y F4 (CU15, `POST /api/publico/pagos`; CU18, `POST /api/publico/factura`) agregan sus endpoints sin atributo de rate limit y sin reimplementar el contador.

**Convenciones que aplica este frente:** xUnit para todos los tests, sin Moq ni FluentAssertions (C1). Registro de DI en `AddFrente1(services, config)`, en `backend/Aseguradora.Api/Frentes/Frente1/Frente1Extensions.cs`, con una sola línea en `Program.cs` (C5, C14). Timeouts y reintentos del cliente real de Renaper vienen del helper de US-T-02, sin valores propios (C4). Migraciones con la regla de rebase de US-F1-02 (C6).

**Tareas en orden:** F1-01 (auth base, políticas y arnés) → F1-02 (Identity y seed) → F1-03 (login y alta de empleados) → F1-04 (Renaper: interfaz, mock y real) → F1-05 (alta de cliente y validación Renaper) → F1-06 (consulta, modificación y baja de clientes) → F1-07 (límite RN20 por prefijo y verificador público) → F1-08 (consulta pública de póliza).

### US-F1-01 · Esquema de autenticación: JWT, roles, políticas y API key

- **Frente:** Seguridad, clientes y web pública · **Rama sugerida:** `feature/US-F1-01-auth-jwt-roles-apikey` · **Tamaño:** L
- **Casos de uso / Reglas:** CU01, CU03 (base) / RN17 · **Secciones de la spec:** 2 (autenticación por API key y JWT), 4 (RN17), 5 (usuarios y roles), 6 (estructura `Api/Middleware` y `Api/Security`), 7 (endpoints de sistemas externos)

**Propósito:** Deja funcionando la autenticación para todo el back (base de CU01 y CU03): JWT para empleados y administradores, API key `X-Api-Key` para sistemas externos, y la tabla de políticas `Politicas.Empleado`, `Politicas.Admin` y `Politicas.ApiKey` que todos los frentes usan con su nombre literal. Al terminar, cualquier controller puede poner `[Authorize(Policy = Politicas.Empleado)]` (o `Admin` o `ApiKey`) y un test puede pedir un token o una API key con el arnés compartido.

**Tabla literal de políticas, roles y claims (fuente única para todos los frentes).** Si hay que cambiar un nombre, se cambia aquí primero (C10). Ningún frente define otro nombre.

| Política (constante C#, valor literal) | Quién la cumple | Esquema que la valida | Uso |
| --- | --- | --- | --- |
| `Politicas.Empleado` | Rol `Empleado` **o** rol `Administrador` | `Bearer` (JWT) | Endpoints de empleados y administradores |
| `Politicas.Admin` | Rol `Administrador` | `Bearer` (JWT) | Endpoints solo de administrador (alta de usuarios, ABM de planes) |
| `Politicas.ApiKey` | Principal con API key válida | Esquema `ApiKey` (header `X-Api-Key`) | `/api/externo/*` y `/api/webhooks/*` |

| Claim | Valor | Dónde viaja | Quién lo usa |
| --- | --- | --- | --- |
| `sub` | Id del usuario | JWT | Auditoría |
| `email` | Email del usuario | JWT | Auditoría |
| `role` (`ClaimTypes.Role`) | `Administrador` o `Empleado` | JWT | Políticas `Politicas.Empleado` y `Politicas.Admin` |
| `proveedor` | Nombre de la clave en `ApiKeys` (por ejemplo `pasarela1`) | Principal de API key | F4-05: el `{proveedor}` de la ruta del webhook debe coincidir |

Nombres de rol (Application): `Roles.Administrador = "Administrador"`, `Roles.Empleado = "Empleado"`. El nombre del esquema de API key es `ApiKey`.

**Alcance (incluye):**
- `backend/Aseguradora.Application/Security/Roles.cs`: constantes `Roles.Administrador` y `Roles.Empleado` (única fuente de los nombres de rol).
- `backend/Aseguradora.Api/Security/JwtOpciones.cs` y `ApiKeyOpciones.cs`: opciones tipadas (`Issuer`, `Audience`, `Key` con mínimo 32 caracteres, `ExpiracionMinutos`; `ApiKeys` como diccionario proveedor → clave), con `ValidateDataAnnotations().ValidateOnStart()`. Las claves se leen de variables de entorno (`Jwt__Key`, `ApiKeys__<proveedor>`), nunca de `appsettings.json`.
- `backend/Aseguradora.Api/Security/ApiKeyAuthenticationHandler.cs`: `AuthenticationHandler` con esquema propio `ApiKey`. Lee `X-Api-Key`, compara con `CryptographicOperations.FixedTimeEquals` y crea un `ClaimsPrincipal` con el claim `proveedor` (tabla de arriba). Sin clave o clave incorrecta → sin resultado (401).
- `backend/Aseguradora.Api/Security/AuthenticationExtensions.cs` (`AddSeguridad(configuration)`): JWT Bearer como esquema por defecto, con nombre `Bearer` (C10) (valida issuer, audience, lifetime y firma; `TokenValidationParameters.RoleClaimType = ClaimTypes.Role`), esquema `ApiKey`, y las tres políticas de la tabla.
- `backend/Aseguradora.Api/Security/Politicas.cs`: constantes `Politicas.Empleado = "Empleado"`, `Politicas.Admin = "Admin"`, `Politicas.ApiKey = "ApiKey"`.
- `backend/Aseguradora.Api/Frentes/Frente1/Frente1Extensions.cs`: método `AddFrente1(this IServiceCollection services, IConfiguration config)`. Es el único punto de registro de DI del frente (C5, C14). Esta tarea lo crea y llama a `AddSeguridad`; las tareas siguientes agregan su línea aquí, no en `Program.cs`.
- `backend/Aseguradora.Api/Program.cs` (dueño de la estructura junto con US-T-01):
  - `builder.Services.AddFrente1(builder.Configuration);` (una sola línea del frente).
  - Pipeline con `app.UseAuthentication();` **antes** de `app.UseAuthorization();`, y ambos antes de `MapControllers()`. Hoy solo está `UseAuthorization`.
  - `public partial class Program { }` al final, necesario para `WebApplicationFactory<Program>`. Si US-T-01 ya lo agregó, no se duplica.
- Paquete `Microsoft.AspNetCore.Authentication.JwtBearer` en `Aseguradora.Api`, versión 8.0.11 (igual que EF Core).
- `backend/Aseguradora.Tests/Support/TokenDePrueba.cs`: emite un JWT firmado con la clave de prueba para un rol dado (o sin rol) y genera el header `X-Api-Key` válido para un proveedor.
- `backend/Aseguradora.Tests/Support/ProbeController.cs`: controller de prueba con un endpoint por política, bajo `api/probe/empleado`, `api/probe/admin` y `api/probe/apikey`. Solo se registra en el factory con `AddApplicationPart`.
- Factory de tests (C16): se usa `AseguradoraWebFactory` de US-T-03 con la opción `UsarAutenticacionReal = true`, que no reemplaza el esquema `Bearer` por `TestAuthHandler`. Si US-T-03 no está mergeada, se usa un factory mínimo temporal que se borra al mergear T-03; no se crea un factory definitivo en esta tarea.

**Fuera de alcance:** emitir tokens desde un login real (F1-03); Identity y usuarios en base (F1-02); la política de rate limit (F1-07).

**Puede empezar sin esperar a:** las opciones, el handler, las políticas y `AddFrente1` no dependen de nadie. Los tests de integración usan `AseguradoraWebFactory` de US-T-03 (opción `UsarAutenticacionReal`) y `public partial class Program` de US-T-01. Si T-03 no está mergeada, usan el factory mínimo temporal de C16, que se borra al mergear T-03; ninguno bloquea el resto de la tarea. Usa el seed existente solo para la base de SQLite.

**Entrega a otros (contratos que publica):**
- Tabla literal de políticas y claims (arriba). Constantes `Politicas.Empleado`, `Politicas.Admin`, `Politicas.ApiKey` (Api) y `Roles.Administrador`, `Roles.Empleado` (Application).
- `AddFrente1(configuration)` como punto de registro de F1 en `Program.cs`.
- `TokenDePrueba` (Tests): `Token(rol)`, `ApiKeyValida(proveedor)`, `ApiKeyHeader`.
- Claim `proveedor` en el principal de API key: F4-05 lo usa para validar que la clave corresponda al `{proveedor}` del webhook, sin cambiar F1.

**Criterios de aceptación:**
- [ ] Un endpoint con `Politicas.Empleado` sin token ni API key responde 401 con ProblemDetails.
- [ ] Un token con rol Empleado pasa `Politicas.Empleado` y recibe 403 en `Politicas.Admin`.
- [ ] Un token con rol Administrador pasa `Politicas.Empleado` y `Politicas.Admin`.
- [ ] Un token con rol Empleado pasa una política que exige Empleado (regresión del `RoleClaimType`).
- [ ] Un token expirado responde 401.
- [ ] Un `X-Api-Key` válido pasa `Politicas.ApiKey` y deja el claim `proveedor` con el nombre de la clave; el mismo header en `Politicas.Empleado` responde 401.
- [ ] Un JWT válido en `Politicas.ApiKey` responde 401.
- [ ] Un `X-Api-Key` ausente o incorrecto responde 401.
- [ ] La aplicación no arranca si falta `Jwt__Key` o tiene menos de 32 caracteres (validación al arrancar).
- [ ] En `Program.cs`, `UseAuthentication()` aparece antes que `UseAuthorization()`.
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos (xUnit; `Aseguradora.Tests` no usa Moq ni FluentAssertions):**
- `AutorizacionTests`: cada escenario de los criterios anteriores, con `WebApplicationFactory`. Nombres: `Empleado_sin_credenciales_responde_401`, `Rol_Empleado_en_Admin_responde_403`, `Rol_Administrador_pasa_Empleado_y_Admin`, `Token_expirado_responde_401`, `ApiKey_valida_pasa_politica_ApiKey_con_claim_proveedor`, `ApiKey_en_politica_Empleado_responde_401`, `JWT_en_politica_ApiKey_responde_401`.
- `ApiKeyAuthenticationHandlerTests`: clave correcta, ausente, incorrecta y con espacios en el header.
- `OpcionesValidacionTests`: el arranque falla sin `Jwt__Key` y con clave corta.

**Decisiones pendientes:**
- Desvío de la spec: la sección 6 pide `Middleware/ApiKeyMiddleware.cs`. Propuesta: `AuthenticationHandler` con esquema propio, porque solo así `[Authorize(Policy = ...)]` funciona con API key. Confirmar.
- Vigencia del JWT: propuesta 480 minutos (8 horas), configurable. La spec no lo define.
- Código de respuesta ante rol insuficiente: propuesta 403. La spec solo tabula 401 para API key.
- Almacenamiento de las API keys: propuesta texto plano en variables de entorno, comparado en tiempo constante. Hash no necesario por ahora.
- Base de los tests de autorización: cerrada por C16. Usa la base SQLite (`SqliteDbFixture`) para correr sin Docker, y la opción `UsarAutenticacionReal` de `AseguradoraWebFactory` (US-T-03), que no reemplaza el esquema `Bearer`. No queda abierta.
- Frentes ya escritos que usan `[Authorize(Roles = "...")]` en lugar de `Politicas`: propuesta que cada frente lo cambie a `Politicas.Empleado` o `Politicas.Admin` al rebasear sobre esta tarea, para que haya una sola fuente de nombres.

---

### US-F1-02 · Identity: usuarios, roles y administrador inicial

- **Frente:** Seguridad, clientes y web pública · **Rama sugerida:** `feature/US-F1-02-identity-roles-seed` · **Tamaño:** M
- **Casos de uso / Reglas:** CU01 (usuarios), CU03 (base) / RN17 · **Secciones de la spec:** 5 (usuarios y roles, datos iniciales), 6 (Data), 10 (una persona por migración)

**Propósito:** Agrega las tablas de ASP.NET Identity (`AspNetUsers`, `AspNetRoles`, `AspNetUserRoles`) con los roles `Administrador` y `Empleado` (base de CU01 y CU03), y siembra un administrador inicial desde configuración para que el login de F1-03 tenga datos reales.

**Regla de migraciones (C6):**
- Esta tarea es la primera ola de migraciones: es la primera migración del repo después de US-01.
- Antes de generar la migración, rebasar sobre `development` actualizado. Generar con `dotnet ef migrations add AddIdentity`. Nadie edita una migración ajena.
- Si al rebasear o mergear el `ModelSnapshot` choca, se borra `AddIdentity` (solo la propia), se rebasa y se regenera sobre el snapshot nuevo. No se resuelve el snapshot a mano.
- Una sola persona crea migraciones a la vez (sección 6). Después de mergear esta tarea, F2 (seed de planes), F3 (tabla de control del job, si hace falta) y F4 (`RowVersion`) rebasan y crean su migración encima de `AddIdentity`.

**Alcance (incluye):**
- `backend/Aseguradora.Data/Identity/Usuario.cs`: `Usuario : IdentityUser` con `Nombre` y `Apellido` (propuesta, ver decisiones).
- `backend/Aseguradora.Data/AseguradoraDbContext.cs`: pasa a `IdentityDbContext<Usuario>`. `OnModelCreating` llama `base.OnModelCreating(modelBuilder)` antes de `ApplyConfigurationsFromAssembly` y de `SeedData.Apply`.
- `backend/Aseguradora.Data/Seed/IdentityRolesSeed.cs`: roles con Ids fijos, en `HasData`, con los nombres de `Roles` (Application). Lo invoca `SeedData.Apply`.
- `backend/Aseguradora.Data/Identity/IdentityExtensions.cs` (`AddIdentityAseguradora()`): `AddIdentityCore<Usuario>().AddRoles<IdentityRole>().AddEntityFrameworkStores<AseguradoraDbContext>()`. Lo llama `AddFrente1` (C14), no `AddData`.
- `backend/Aseguradora.Data/Seed/AdministradorInicialSeeder.cs`: `AdministradorInicialSeeder : ISeeder` (contrato `ISeeder` de US-T-01, C14), idempotente. Crea el administrador con `UserManager<Usuario>` usando `Seed:Administrador:Email` y `Seed:Administrador:Password` (variables de entorno `Seed__Administrador__Email` y `Seed__Administrador__Password`). Si faltan, registra un warning y no crea nada.
- Registro en `AddFrente1` del `AdministradorInicialSeeder` como `ISeeder` (scoped, porque `UserManager<Usuario>` es scoped; C14). No se crea `IHostedService`: `Program.cs` no gana otra línea.
- Migración `AddIdentity` en `backend/Aseguradora.Data/Migrations/`. Solo crea tablas de Identity: ninguna tabla de negocio cambia.

**Fuera de alcance:** endpoints de login y alta de usuarios (F1-03); políticas (F1-01, ya hechas).

**Puede empezar sin esperar a:** ningún frente. Depende de F1-01 (`AddFrente1`, ya en `development`) y del contrato `ISeeder` de US-T-01 (C14). No comparte archivos de lógica con otra tarea del frente.

**Entrega a otros (contratos que publica):**
- `Usuario` y `UserManager<Usuario>` disponibles por DI.
- Nombres de rol iguales a `Roles` (Application).
- Migración `AddIdentity` como última migración del repo al mergear.

**Criterios de aceptación:**
- [ ] `dotnet ef migrations list` muestra `AddIdentity` como última; `dotnet ef database update` crea `AspNetUsers`, `AspNetRoles` y `AspNetUserRoles`.
- [ ] La migración no modifica ni elimina columnas de las tablas de negocio (revisión del `Up` generado).
- [ ] Con `Seed__Administrador__Email` y `Seed__Administrador__Password` definidas, al arrancar existen los roles Administrador y Empleado y el usuario administrador en el rol Administrador.
- [ ] Dos arranques seguidos no duplican usuario ni roles.
- [ ] Sin variables de seed, el arranque no falla, no crea administrador y deja un warning.
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos:**
- `AdministradorInicialSeederTests`: crea roles y administrador; es idempotente; sin credenciales no crea nada; una contraseña que no cumple la política no rompe el arranque (se registra error).
- `IdentityModelTests`: las tablas de Identity existen en el modelo SQLite del factory y los datos de negocio del seed (cliente 30123456, póliza POL-0000001) siguen presentes.

**Decisiones pendientes:**
- Campos de `Usuario`: propuesta `Nombre` y `Apellido` (nvarchar 100), y el email como `UserName`. La spec no define los campos de empleado.
- Política de contraseñas: propuesta la de Identity por defecto (largo 6, mayúscula, número y símbolo). La spec no la define.
- Bloqueo por intentos de login: no está en la spec; no se implementa en esta tarea.
- Seeder del administrador: no va en `HasData` porque depende de credenciales de entorno. Cerrada por C14: `ISeeder` idempotente registrado por `AddFrente1`, no `IHostedService`. No queda abierta.

---

### US-F1-03 · Login con JWT y alta de empleados (CU01 y CU03)

- **Frente:** Seguridad, clientes y web pública · **Rama sugerida:** `feature/US-F1-03-auth-login-altas` · **Tamaño:** M
- **Casos de uso / Reglas:** CU01 (login con JWT), CU03 (crear empleados) / RN17 · **Secciones de la spec:** 7 (AuthController), 5 (usuarios y roles), 6 (capas: la API no accede a Data directo)

**Propósito:** Cumple CU01: un empleado o administrador inicia sesión y recibe un JWT con su rol. Cumple CU03: un administrador crea empleados y administradores. Las reglas viven en Application y la persistencia de Identity queda detrás de una interfaz.

**Alcance (incluye):**
- `backend/Aseguradora.Application/Security/IUsuarioStore.cs`: `BuscarPorEmailAsync`, `VerificarPasswordAsync`, `ObtenerRolesAsync`, `CrearAsync(email, password, rol, nombre, apellido)`, `EmailExisteAsync`.
- `backend/Aseguradora.Application/Security/ITokenService.cs` y `AutenticacionService.cs` (primary constructor, `ArgumentNullException` en dependencias): login (valida credenciales, emite token) y `CrearEmpleadoAsync` (valida que el rol sea Administrador o Empleado y que el email sea único).
- `backend/Aseguradora.Application/Exceptions/CredencialesInvalidasException.cs`: se mapea a 401 en `ExceptionMiddleware`, con el mismo mensaje para email inexistente y contraseña incorrecta.
- `backend/Aseguradora.Data/Identity/IdentityUsuarioStore.cs`: implementa `IUsuarioStore` con `UserManager<Usuario>`.
- `backend/Aseguradora.Api/Security/JwtTokenService.cs`: firma el JWT con las opciones de F1-01 y los claims de la tabla (`sub`, `email`, `role`).
- `backend/Aseguradora.Application/Security/DTOs`: `LoginRequest(Email, Password)`, `LoginResponse(Token, Rol, ExpiraEn)`, `CrearUsuarioRequest(Email, Password, Rol, Nombre, Apellido)` (Data Annotations; `Rol` limitado a Administrador o Empleado), `UsuarioResponse(Id, Email, Rol)`.
- `backend/Aseguradora.Api/Controllers/AuthController.cs` (`[Route("api/auth")]`):
  - `POST /api/auth/login`: `[AllowAnonymous]`, 200.
  - `POST /api/auth/usuarios`: `[Authorize(Policy = Politicas.Admin)]`, 201.
- `backend/Aseguradora.Api/Middleware/ExceptionMiddleware.cs`: mapeo nuevo de `CredencialesInvalidasException` → 401.
- Registro de `IUsuarioStore`, `ITokenService` y `AutenticacionService` dentro de `AddFrente1` (C14).

**Fuera de alcance:** renovar tokens o cerrar sesión (no está en la spec); cualquier login de clientes (no tienen usuario, RN17).

**Puede empezar sin esperar a:** F1-01 y F1-02 (ya en `development`). Los tests unitarios de `AutenticacionService` usan un `IUsuarioStore` falso.

**Entrega a otros (contratos que publica):** `POST /api/auth/login` devuelve el JWT que los demás frentes usan en sus pruebas manuales en Swagger. Token con claims `sub`, `email` y `role`.

**Criterios de aceptación:**
- [ ] `POST /api/auth/login` con credenciales correctas responde 200 con `token`, `rol` y `expiraEn`; el claim `role` del token es el rol del usuario.
- [ ] Email inexistente y contraseña incorrecta responden 401 con el mismo mensaje.
- [ ] `POST /api/auth/usuarios` sin token responde 401; con token de Empleado responde 403; con token de Administrador responde 201.
- [ ] La respuesta de alta no incluye la contraseña ni la entidad `Usuario`.
- [ ] Un email ya registrado responde 400.
- [ ] Un rol distinto de Administrador o Empleado (por ejemplo `Cliente`) responde 400.
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos:**
- `AutenticacionServiceTests`: login correcto, email inexistente, contraseña incorrecta, rol inválido, email duplicado (con `IUsuarioStore` falso).
- `AuthControllerTests`: login 200 y 401; alta con 401, 403, 201 y 400; el token emitido pasa `Politicas.Empleado` (integración con F1-01).

**Decisiones pendientes:**
- Código de respuesta ante credenciales inválidas: propuesta 401 con mensaje genérico ("Credenciales inválidas.").
- Email como `UserName` y como identificador de login: propuesta sí (ver F1-02).
- Respuesta de login: propuesta `token`, `rol` y `expiraEn`; sin datos personales.

---

### US-F1-04 · Renaper: interfaz, mock y cliente real (CU04, validación)

- **Frente:** Seguridad, clientes y web pública · **Rama sugerida:** `feature/US-F1-04-renaper-mock-real` · **Tamaño:** M
- **Casos de uso / Reglas:** CU04 (validación Renaper, base del alta) / RN02 · **Secciones de la spec:** 2 (Renaper, interfaz con mock y real), 9.1 (contrato Renaper), 6 (capa Integrations), 10 (timeouts y reintentos)

**Propósito:** Deja el servicio de Renaper detrás de `IRenaperService`, con un mock fijo (sin depender del otro grupo) y un cliente HTTP real, elegidos por configuración. Es la base que CU04 usa en F1-05 para validar al cliente. Es también el patrón para DNRPA, ARCA y las pasarelas.

**Alcance (incluye):**
- `backend/Aseguradora.Application/External/IRenaperService.cs`: `Task<PersonaRenaper?> ObtenerPorDniAsync(string dni, CancellationToken ct)`. Devuelve `null` si no existe; lanza `ExternalServiceException` si el servicio falla o responde mal.
- `backend/Aseguradora.Application/External/PersonaRenaper.cs`: `PersonaRenaper` (dni, cuil, nombre, apellido, fechaNacimiento, sexo, domicilio, estado, fechaFallecimiento) y `DomicilioRenaper` (calle, numero, piso, depto, localidad, provincia, codigoPostal), más `EstadoRenaper` (`Vigente`, `Fallecido`).
- `backend/Aseguradora.Integrations/Renaper/RenaperMockService.cs`: datos fijos. El DNI 30123456 devuelve Juan Carlos Pérez (igual que el seed). Los otros DNIs de prueba están en decisiones pendientes.
- `backend/Aseguradora.Integrations/Renaper/RenaperHttpService.cs`: `HttpClient` que llama `GET {BaseUrl}/api/personas/{dni}` con header `X-Api-Key`. 200 → mapea; 404 con `codigo: PERSONA_NO_ENCONTRADA` → `null`; otros estados, timeout o JSON inválido → `ExternalServiceException`.
- Configuración: `Integraciones:Renaper:{UsarMock|BaseUrl|ApiKey|TimeoutSegundos|ReintentosMaximos}`, con la clase `IntegracionOptions` de US-T-02. `ApiKey` viene de la variable `Integraciones__Renaper__ApiKey`. Esta tarea no crea una clase de opciones propia.
- Selector y registro (C13): `AddFrente1` llama `AgregarIntegracion<IRenaperService, RenaperMockService, RenaperHttpService>("Renaper")`, helper de US-T-02, con el selector `Integraciones:Renaper:UsarMock`. Esta tarea NO crea ni es dueña de `Integrations/DependencyInjection.cs` (es de US-T-02) y no toca la línea `AddIntegraciones` de `Program.cs`.
- Timeouts y reintentos: los define US-T-02 (`ResilienciaExtensions`, `AddStandardResilienceHandler`). Esta tarea no fija valores propios (C4). Mientras US-T-02 no esté mergeada, el `AddHttpClient` de Renaper usa los mismos defaults inline de US-T-02 (10 s por intento, 2 reintentos), y al mergear se reemplaza por el helper sin cambiar la interfaz.

**Fuera de alcance:** usar el servicio desde los clientes (F1-05); DNRPA (frente 2); ARCA y pasarelas (frente 4); el helper de resiliencia, el selector genérico y `Integrations/DependencyInjection.cs` (US-T-02, C13).

**Puede empezar sin esperar a:** el mock no depende de nadie. El cliente real se prueba con un `HttpMessageHandler` falso. Si US-T-02 no está mergeada, aplican los defaults inline indicados arriba.

**Entrega a otros (contratos que publica):**
- `IRenaperService` y `PersonaRenaper` (Application).
- Registro de Renaper dentro de `AddFrente1`, con el selector de US-T-02.

**Criterios de aceptación:**
- [ ] Con `UsarMock=true`, `ObtenerPorDniAsync("30123456")` devuelve Juan Carlos Pérez con estado Vigente.
- [ ] Con el mock, un DNI no registrado devuelve `null`.
- [ ] Con el HTTP real, un 200 mapea todos los campos, incluidos `piso` y `depto` nulos.
- [ ] Con el HTTP real, un 404 con `PERSONA_NO_ENCONTRADA` devuelve `null`.
- [ ] Con el HTTP real, un 500, un timeout o un JSON inválido lanzan `ExternalServiceException`.
- [ ] El header `X-Api-Key` se envía con el valor de `Integraciones:Renaper:ApiKey`.
- [ ] Con `UsarMock=false`, la DI resuelve `RenaperHttpService`.
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos:**
- `RenaperMockServiceTests`: DNI conocido, DNI vigente, DNI fallecido, DNI inexistente.
- `RenaperHttpServiceTests` (con `HttpMessageHandler` falso): 200 completo, 404 → null, 500, timeout, JSON inválido, header de API key.
- `RenaperRegistroTests`: qué implementación se resuelve según `UsarMock`, con el registro de `AddFrente1`.

**Decisiones pendientes:**
- DNIs de prueba del mock (propuesta): `30123456` vivo (seed); `45123456` vivo y menor de 18 años (nacido 2010); `20111222` fallecido; cualquier otro, inexistente.
- Timeout y reintentos: los define US-T-02 (C4). Esta tarea no propone valores.
- Si Renaper responde 401 porque nuestra clave está mal, se trata como `ExternalServiceException` (502). Confirmar.

---

### US-F1-05 · Alta de cliente con validación en Renaper (CU04)

- **Frente:** Seguridad, clientes y web pública · **Rama sugerida:** `feature/US-F1-05-clientes-alta-renaper` · **Tamaño:** M
- **Casos de uso / Reglas:** CU04 (alta de cliente con validación Renaper) / RN01, RN02, RN16 · **Secciones de la spec:** 3 (CU04), 4 (RN01, RN02), 7 (ClientesController: POST, POST validar-renaper, GET renaper/{dni}), 9.1, 11.3 (zona horaria de Argentina)

**Propósito:** Cumple CU04: un empleado da de alta un cliente con validación en Renaper, reintenta la validación cuando Renaper estuvo caído, y consulta lo que devuelve Renaper antes de cargar el formulario. Las reglas viven en `ClienteService`.

**Alcance (incluye):**
- `backend/Aseguradora.Application/Clientes/ClienteService.cs` (primary constructor): `AltaAsync`, `ValidarRenaperAsync(id)`, `PreviewRenaperAsync(dni)`.
- `backend/Aseguradora.Application/Clientes/DTOs`: `ClienteAltaRequest` (Dni de 8 dígitos, Email, Telefono opcional, Nombre, Apellido, Cuil, FechaNacimiento, Sexo, domicilio: Calle, Numero, Localidad, Provincia, CodigoPostal), `ClienteResponse`, `PersonaRenaperResponse`.
- `backend/Aseguradora.Api/Controllers/ClientesController.cs` (`[Route("api/clientes")]`, `[Authorize(Policy = Politicas.Empleado)]`):
  - `POST /api/clientes`: 201 con `Location`.
  - `POST /api/clientes/{id}/validar-renaper`: 200.
  - `GET /api/clientes/renaper/{dni}`: 200.
- Registro en `AddFrente1`: `ClienteService` como scoped. No hay registro compartido de Application (C14). `TimeProvider` se registra con `TryAddSingleton(TimeProvider.System)` si todavía no está (US-T-05 lo registra también; `TryAdd` evita el duplicado).
- Reglas en `ClienteService`:
  - Alta: DNI y email únicos (RN01); edad mínima 18 años calculada con `TimeProvider` y la zona `America/Argentina/Buenos_Aires` (11.3); Renaper `VIGENTE` pisa nombre, apellido, cuil, fecha de nacimiento, sexo y domicilio (RN02), y marca `ValidadoRenaper=true` con `FechaValidacionRenaper` en UTC (RN16).
  - Validación posterior: reintenta sobre un cliente existente; si Renaper vuelve y el estado es Vigente, marca la validación.

**Fuera de alcance:** listar, modificar y dar de baja clientes (F1-06); validación de la póliza que exige RN02 al emitir (frente 3).

**Puede empezar sin esperar a:** F1-04 (`IRenaperService` y mock). Depende de esa tarea del mismo frente.

**Entrega a otros (contratos que publica):**
- `ClienteService` y `ClienteResponse` (Application). Frente 3 puede usar el cliente de seed (`ClienteId` en `SeedData`) sin esperar esta tarea.

**Criterios de aceptación:**
- [ ] `POST /api/clientes` con DNI 30123456 responde 201 y el cliente tiene nombre "Juan Carlos" y `validadoRenaper=true` (los datos de Renaper pisan los cargados a mano).
- [ ] Un DNI de menor de 18 años (45123456) responde 400 (RN01).
- [ ] Un DNI o email ya registrados responden 400 (RN01).
- [ ] Un DNI inexistente en Renaper (por ejemplo 99999999) responde 400.
- [ ] Un DNI fallecido (20111222) responde 400.
- [ ] Con Renaper caído, `POST /api/clientes` responde 201 con `validadoRenaper=false` (ver decisiones pendientes).
- [ ] `POST /api/clientes/{id}/validar-renaper` marca `validadoRenaper=true` cuando Renaper responde Vigente; con cliente inexistente responde 404.
- [ ] `GET /api/clientes/renaper/{dni}` devuelve los datos de Renaper; con DNI inexistente responde 404; con Renaper caído responde 502.
- [ ] Sin token responde 401; con token de Administrador responde igual que con Empleado.
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos:**
- `ClienteServiceTests` (con `IRenaperService` y repositorio falsos): alta vigente, pisado de datos, menor de 18 con `TimeProvider` fijo, DNI y email duplicados, fallecido, inexistente, Renaper caído, reintento exitoso, reintento con cliente inexistente.
- `ClientesControllerTests` (integración con SQLite y el factory de F1-01): los criterios HTTP de arriba, para las rutas `POST /api/clientes`, `POST /api/clientes/{id}/validar-renaper` y `GET /api/clientes/renaper/{dni}`.

**Decisiones pendientes:**
- Datos que carga el empleado: propuesta que el alta acepte todos los datos (nombre, apellido, cuil, fecha, sexo y domicilio). Renaper los pisa si responde (RN02). Sin Renaper, quedan los cargados a mano y `validadoRenaper=false`.
- Renaper caído en el alta: propuesta no bloquear el alta (201, `validadoRenaper=false`) para que el empleado no pierda la carga; el reintento queda en `validar-renaper`. Confirmar: la alternativa es responder 502.
- Cliente fallecido o inexistente en el alta: propuesta 400 (no se da de alta). La spec no lo define explícitamente.
- Formato del DNI: propuesta 8 dígitos (`varchar(8)` de la spec, sección 5).

---

### US-F1-06 · Consulta, modificación y baja lógica de clientes (CU05)

- **Frente:** Seguridad, clientes y web pública · **Rama sugerida:** `feature/US-F1-06-clientes-consulta-baja` · **Tamaño:** M
- **Casos de uso / Reglas:** CU05 (consultar, modificar y dar de baja clientes) / RN01, RN15 · **Secciones de la spec:** 3 (CU05), 4 (RN15), 5 (tabla Clientes), 7 (ClientesController: GET, GET {id}, PUT, DELETE)

**Propósito:** Cumple CU05: el empleado busca, consulta y modifica clientes, y los da de baja lógica sin borrarlos físicamente.

**Alcance (incluye):**
- `backend/Aseguradora.Application/Comun/PaginaResponse.cs`: `PaginaResponse<T>(Items, Pagina, TamanoPagina, Total)`.
- `backend/Aseguradora.Application/Clientes/ClienteService.cs`: `ListarAsync(ClienteFiltro)`, `ObtenerAsync(id)`, `ModificarAsync(id, ClienteModificacionRequest)`, `DarDeBajaAsync(id)`.
- `backend/Aseguradora.Application/Clientes/DTOs`: `ClienteFiltro` (Dni, Apellido, Pagina=1, TamanoPagina=20), `ClienteResumenResponse`, `ClienteModificacionRequest` (Email, Telefono, Calle, Numero, Localidad, Provincia, CodigoPostal).
- `backend/Aseguradora.Api/Controllers/ClientesController.cs` (mismo controller de F1-05), con `[Authorize(Policy = Politicas.Empleado)]`:
  - `GET /api/clientes`: listado con filtros y paginado.
  - `GET /api/clientes/{id}`: detalle.
  - `PUT /api/clientes/{id}`: 200.
  - `DELETE /api/clientes/{id}`: 204.
- Reglas:
  - Listado y detalle solo muestran clientes con `Activo=true`.
  - `PUT` modifica solo contacto y domicilio; el email nuevo debe ser único (RN01), ignorando el propio cliente. DNI, nombre y datos de Renaper no se tocan desde aquí.
  - `DELETE` pone `Activo=false` (RN15): el registro sigue en la base.

**Fuera de alcance:** alta y validación Renaper (F1-05); vehículos del cliente (frente 2).

**Puede empezar sin esperar a:** F1-05 (comparte `ClienteService`, `ClienteResponse` y el controller).

**Entrega a otros (contratos que publica):** `PaginaResponse<T>` como formato de listados paginados del back.

**Criterios de aceptación:**
- [ ] `GET /api/clientes?dni=30123456` devuelve solo ese cliente.
- [ ] `GET /api/clientes?apellido=pér` filtra por coincidencia parcial sin distinguir mayúsculas.
- [ ] Con `pagina=2&tamanoPagina=1`, devuelve el segundo elemento y el `total` correcto.
- [ ] `tamanoPagina` mayor que 100 responde 400.
- [ ] `GET /api/clientes/{id}` con id inexistente responde 404.
- [ ] `PUT /api/clientes/{id}` con un email que usa otro cliente responde 400 y no modifica nada.
- [ ] `PUT /api/clientes/{id}` no permite cambiar DNI ni nombre (el DTO no los incluye).
- [ ] `DELETE /api/clientes/{id}` responde 204, el cliente queda con `Activo=false` en la base y deja de aparecer en `GET /api/clientes` (RN15).
- [ ] Sin token responde 401.
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos:**
- `ClienteServiceTests`: filtros, paginación con límites, email duplicado en PUT, baja lógica, detalle de inactivo.
- `ClientesControllerTests` (integración): los criterios HTTP de arriba.

**Decisiones pendientes:**
- Filtro por DNI: propuesta exacto; por apellido: propuesta coincidencia parcial sin distinguir mayúsculas.
- Paginación: propuesta `tamanoPagina` por defecto 20 y máximo 100.
- Baja de un cliente con póliza activa (Pendiente, Vigente o Suspendida): propuesta bloquearla con 400, igual que la baja de vehículos ("si no tiene póliza activa"). La spec solo lo dice para vehículos.
- Cliente ya dado de baja: propuesta 404 en `GET`, `PUT` y `DELETE`.

---

### US-F1-07 · Límite de intentos de la web pública (RN20, por prefijo) y verificador de póliza

- **Frente:** Seguridad, clientes y web pública · **Rama sugerida:** `feature/US-F1-07-publico-limite-verificador` · **Tamaño:** M
- **Casos de uso / Reglas:** CU02 (límite de la consulta), CU15, CU18, CU20 (lo usan otros frentes) / RN20 · **Secciones de la spec:** 4 (RN20), 7 (PublicoController), 11.4 (IP detrás de Cloudflare, rate limit en todo `/api/publico`)

**Propósito:** Aplica RN20 a **todo el prefijo `/api/publico/*`** con 10 intentos por minuto por IP y respuesta 429. El límite se engancha por prefijo, de forma global: no depende de que cada controller agregue un atributo. Así `PublicoController` (F1-08, F3 para cupón) y `PublicoPagosController` (F4 para pago y factura) quedan limitados sin reimplementar nada. También deja un verificador reutilizable que comprueba que DNI y número (de póliza o de pago) correspondan al mismo registro.

**Mecanismo (decisión de esta tarea, la usan F3 y F4):**
- `AddPublicoRateLimit` configura un `GlobalLimiter` particionado por IP. La partición aplica un `FixedWindowLimiter` cuando `Request.Path` empieza con `/api/publico`; en cualquier otra ruta devuelve `RateLimitPartition.GetNoLimiter`.
- Los controllers bajo `/api/publico` **no** llevan `[EnableRateLimiting]`. Una ruta nueva bajo el prefijo queda limitada sin tocar nada. Esta tarea es dueña única del `GlobalLimiter` (C15): F3 y F4 no usan `[EnableRateLimiting]` ni lo reimplementan.
- `app.UseRateLimiter()` se ubica en el pipeline antes de `UseAuthentication()`.

**Alcance (incluye):**
- `backend/Aseguradora.Api/Security/PublicoRateLimitExtensions.cs` (`AddPublicoRateLimit(configuration)`): `AddRateLimiter` con `RejectionStatusCode = 429`, cuerpo ProblemDetails y el `GlobalLimiter` por prefijo descrito arriba. Límite y ventana desde `RateLimiting:Publico:PermitLimit` (10) y `WindowSeconds` (60).
- `backend/Aseguradora.Api/Security/ClientIpResolver.cs`: IP del `RemoteIpAddress`. Si la conexión viene de una red en `ForwardedHeaders:RedesConfiables`, toma `CF-Connecting-IP`. Sin IP remota (TestServer), usa una partición fija `desconocida`.
- `backend/Aseguradora.Api/Controllers/PublicoController.cs`: `[Route("api/publico")]`, `[AllowAnonymous]`, sin atributo de rate limit. Sin endpoints todavía (los agrega F1-08; después F3 y F4 agregan los suyos).
- `backend/Aseguradora.Api/Frentes/Frente1/Frente1Extensions.cs`: `AddPublicoRateLimit` se llama desde `AddFrente1`.
- `backend/Aseguradora.Api/Program.cs`: una línea `app.UseRateLimiter();` antes de `UseAuthentication()`.
- `backend/Aseguradora.Application/Publico/IVerificadorPublico.cs` y `VerificadorPublico.cs`:
  - `VerificarPolizaAsync(dni, numeroPoliza)`: devuelve la póliza si pertenece al cliente.
  - `VerificarPagoAsync(dni, numeroPago)`: devuelve el pago si pertenece al cliente (para la factura de F4).
  - Si el DNI no coincide, o el registro no existe, lanza `NotFoundException` con un único mensaje: "No se encontró un registro con los datos indicados."
- `backend/Aseguradora.Api/appsettings.json`: valores por defecto de `RateLimiting` y `ForwardedHeaders` (lista vacía).

**Fuera de alcance:** los endpoints de consulta (F1-08), pago (F4-04), cupón (F3) y factura (F4-03).

**Puede empezar sin esperar a:** F1-01 (el arnés de tests). Los tests usan un controller de prueba bajo el prefijo (`Aseguradora.Tests/Support/ProbeLimiteController.cs`, ruta `api/publico/prueba-limite`), registrado en el factory.

**Entrega a otros (contratos que publica):**
- Mecanismo por prefijo (C15): F3 (CU20, `POST /api/publico/cupon`) y F4 (CU15, `POST /api/publico/pagos`; CU18, `POST /api/publico/factura`) agregan sus endpoints en sus controllers sin `[EnableRateLimiting]` ni reimplementación.
- `PublicoController` como clase base de los endpoints públicos de consulta.
- `IVerificadorPublico` con `VerificarPolizaAsync` (F3 para CU20) y `VerificarPagoAsync` (F4 para CU18).

**Criterios de aceptación:**
- [ ] El intento 11 desde la misma IP dentro de la ventana responde 429 (no 503, que es el valor por defecto de ASP.NET).
- [ ] Dos IPs distintas tienen contadores separados.
- [ ] Con `CF-Connecting-IP` desde una red confiable, el contador usa esa IP; desde una red no confiable, lo ignora.
- [ ] Una ruta nueva bajo `/api/publico` queda limitada sin agregarle ningún atributo (prueba con la ruta de prueba).
- [ ] Una ruta fuera de `/api/publico` no se limita por este mecanismo.
- [ ] `VerificarPolizaAsync` con DNI que no es del titular y con número inexistente lanza el mismo mensaje y el mismo tipo de excepción.
- [ ] `VerificarPagoAsync` aplica la misma regla con el número de pago.
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos:**
- `PublicoRateLimitTests` (integración con `ProbeLimiteController`): intento 11 → 429; IPs separadas; ventana configurable en 1 segundo con un test de reinicio; ruta nueva bajo el prefijo queda limitada sin atributo (simulada con un segundo endpoint de prueba); ruta fuera del prefijo no se limita.
- `ClientIpResolverTests`: red confiable, red no confiable, sin IP remota.
- `VerificadorPublicoTests`: póliza correcta, DNI de otro cliente, número inexistente, pago correcto, pago de otro cliente.

**Decisiones pendientes:**
- Qué cuenta como intento: propuesta cada request a `/api/publico/*`, sin distinguir si fue exitoso. La spec dice "10 intentos por minuto" sin aclarar. Aplica igual a `/consulta`, `/pagos`, `/cupon` y `/factura`.
- Redes confiables para `CF-Connecting-IP`: propuesta lista vacía por defecto; el compose la completa con la red interna de `cloudflared` (11.2). Sin esa configuración, el header se ignora.
- Mecanismo de IP: la spec (11.4) menciona `ForwardedHeaders`, pero ese middleware lee `X-Forwarded-For`, no `CF-Connecting-IP`. Propuesta: leer `CF-Connecting-IP` directamente en `ClientIpResolver`, solo desde redes confiables.

---

### US-F1-08 · Consulta pública de póliza y cuotas (CU02)

- **Frente:** Seguridad, clientes y web pública · **Rama sugerida:** `feature/US-F1-08-publico-consulta-poliza` · **Tamaño:** M
- **Casos de uso / Reglas:** CU02 (consultar una póliza y sus cuotas con DNI y número) / RN10, RN20 · **Secciones de la spec:** 3 (CU02), 4 (RN10, RN20), 7 (PublicoController: POST /consulta), 9.3 (flujo web, sin login)

**Propósito:** Cumple CU02: un cliente, sin login, consulta el estado de su póliza con DNI y número, y ve su vehículo, su plan y sus cuotas. Solo se muestra lo que corresponde a esa póliza (RN20). El límite de intentos lo aplica F1-07 por prefijo.

**Alcance (incluye):**
- `backend/Aseguradora.Application/Publico/DTOs/ConsultaPublicaRequest.cs`: `Dni` (8 dígitos) y `NumeroPoliza` (formato `POL-` + 7 dígitos), con Data Annotations.
- `backend/Aseguradora.Application/Publico/DTOs/ConsultaPublicaResponse.cs`: `numeroPoliza`, `estado`, `coberturaVigente` (`true` solo si la póliza está Vigente, RN10), `vigenteDesde`, `vigenteHasta`, `plan` (codigo, nombre), `vehiculo` (patente, marca, modelo, anio), `cuotas` (numero, importe, recargo, total, vencimiento, estado) ordenadas por número.
- `backend/Aseguradora.Application/Publico/ConsultaPublicaService.cs`: usa `IVerificadorPublico.VerificarPolizaAsync` (F1-07) y los repositorios (`IRepository<T>`) para vehículo, plan y cuotas. No usa `Include` de EF Core, porque Application no referencia EF.
- `backend/Aseguradora.Api/Controllers/PublicoController.cs`: `POST /api/publico/consulta` (200), con `[AllowAnonymous]` (heredado de F1-07).

**Fuera de alcance:** pagos (`POST /api/publico/pagos`, CU15, frente 4), cupón (`POST /api/publico/cupon`, CU20, frente 3), factura (`POST /api/publico/factura`, CU18, frente 4). Calcular el recargo o marcar cuotas Vencidas (CU14, frente 3): acá se muestra el estado guardado.

**Puede empezar sin esperar a:** F1-07 (verificador y clase del controller). Usa el seed existente (cliente 30123456, póliza POL-0000001).

**Entrega a otros (contratos que publica):** `POST /api/publico/consulta` como referencia de respuesta para la web pública.

**Criterios de aceptación:**
- [ ] `POST /api/publico/consulta` con DNI 30123456 y POL-0000001 responde 200 con `estado` VIGENTE, `coberturaVigente=true`, 6 cuotas y la primera PAGADA.
- [ ] DNI correcto con una póliza de otro cliente responde 404 con el mismo mensaje que una póliza inexistente (RN20).
- [ ] Un DNI con formato inválido responde 400.
- [ ] Una póliza Pendiente o Suspendida responde `coberturaVigente=false` (RN10).
- [ ] La respuesta no incluye ids internos de cliente ni entidades.
- [ ] El undécimo intento en un minuto contra `POST /api/publico/consulta` responde 429 (F1-07).
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos:**
- `ConsultaPublicaServiceTests` (repositorios falsos): cálculo de `coberturaVigente` por estado, orden de cuotas, cuotas con recargo.
- `PublicoControllerTests` (integración con SQLite): los criterios HTTP de arriba, incluyendo DNI de otro cliente y formato inválido.

**Decisiones pendientes:**
- Datos del cliente (nombre, apellido) en la respuesta: propuesta no incluirlos; el DNI ya lo envió el cliente.
- Estado de cuotas Vencidas: propuesta mostrar el estado guardado hasta que corra `VencimientosJob` (frente 3).
- Formato del número de póliza: propuesta `POL-` + 7 dígitos, según el seed (`POL-0000001`).

---

## Trazabilidad CU / RN / endpoints del Frente 1

| Referencia | Tarea(s) |
| --- | --- |
| CU01 Iniciar sesión y obtener JWT | US-F1-03 (base: US-F1-01 y US-F1-02) |
| CU02 Consultar póliza con DNI y número | US-F1-08 (límite por prefijo y verificador: US-F1-07) |
| CU03 Crear empleados | US-F1-03 (base: US-F1-02) |
| CU04 Alta de cliente con validación Renaper | US-F1-04 (interfaz y mock/real), US-F1-05 (alta y reintento) |
| CU05 Consultar, modificar y dar de baja clientes | US-F1-06 |
| RN01 DNI y email únicos, 18 años | US-F1-05, US-F1-06 |
| RN02 Validación Renaper antes de emitir | US-F1-04, US-F1-05 (la verificación al emitir la hace el frente 3) |
| RN10 Solo Vigente da cobertura | US-F1-08 (`coberturaVigente`) |
| RN15 Baja lógica | US-F1-06 |
| RN16 Importes y fechas en UTC | US-F1-05 (`FechaValidacionRenaper`) |
| RN17 Roles y API key para externos | US-F1-01 (tabla de políticas), US-F1-02 (roles), US-F1-03 (login y altas) |
| RN20 10 intentos por minuto por IP, todo `/api/publico/*` | US-F1-07 (mecanismo por prefijo), US-F1-08 (consulta). Heredan F3 (cupón) y F4 (pagos y factura) |
| Políticas `Politicas.Empleado`, `Politicas.Admin`, `Politicas.ApiKey` y claim `proveedor` | US-F1-01 (tabla literal) |
| `POST /api/auth/login` | US-F1-03 |
| `POST /api/auth/usuarios` | US-F1-03 |
| `GET /api/clientes` | US-F1-06 |
| `GET /api/clientes/{id}` | US-F1-06 |
| `POST /api/clientes` | US-F1-05 |
| `PUT /api/clientes/{id}` | US-F1-06 |
| `DELETE /api/clientes/{id}` | US-F1-06 |
| `POST /api/clientes/{id}/validar-renaper` | US-F1-05 |
| `GET /api/clientes/renaper/{dni}` | US-F1-05 |
| `POST /api/publico/consulta` | US-F1-08 |
| `POST /api/publico/pagos` | No es de F1: CU15, frente 4. Hereda el límite por prefijo de US-F1-07 |
| `POST /api/publico/cupon` | No es de F1: CU20, frente 3. Hereda el límite por prefijo de US-F1-07 |
| `POST /api/publico/factura` | No es de F1: CU18, frente 4. Hereda el límite por prefijo de US-F1-07 |
| Esquema y política `ApiKey` (uso en `/api/externo` y `/api/webhooks`) | US-F1-01 (la aplicación en esos endpoints es de frentes 2, 3 y 4) |
| Cliente de Renaper `GET /api/personas/{dni}` (9.1) | US-F1-04 |

---

## Frente 2 · Vehículos, planes y cotización

Este frente cubre CU06 a CU09: **CU06** alta de vehículo con validación en DNRPA (RN03); **CU07** consulta, modificación y baja lógica de vehículos (RN15, RN04); **CU08** ABM de planes de cobertura, a cargo del Administrador (RN05, RN15); **CU09** cotizar un seguro para un vehículo, por el Empleado (US-F2-06) y por el Sistema externo (US-F2-07) (RN05, RN06). **Objetivo:** que el back ofrezca un precio de seguro para cualquier vehículo y deje los vehículos validados listos para emitir póliza.

**Dependencias hacia otros frentes:** de US-F1-01 usa solo las políticas `Politicas.Empleado`, `Politicas.Admin` y `Politicas.ApiKey` (esquema `Bearer` para JWT, C10), y el arnés de pruebas `AseguradoraWebFactory` con `TestAuthHandler` de US-T-03 (C16). No consume servicios del Frente 1: lee `Cliente` por `IRepository<Cliente>`. De US-F1-02 necesita `AddIdentity` mergeada antes de generar su propia migración (C6). De US-T-02 usa `AgregarIntegracion` y `ClienteHttpBase` para DNRPA (C4, C13).

**Dependencias desde este frente:** F3 no necesita un `ICotizacionService` de F2 para arrancar: US-F3-02 (emisión) arranca con una cotización creada por seed. Igual, US-F2-01 publica `ICotizacionService` y `CotizacionDto` (y un `FakeCotizacionService` en tests) para que F3 los consuma cuando existan; la implementación real llega en US-F2-06.

**Registro de DI (C5):** cada tarea del frente agrega sus registros dentro de `AddFrente2(this IServiceCollection services, IConfiguration config)`, en `backend/Aseguradora.Api/Frentes/Frente2/Frente2Extensions.cs` (creado en US-F2-01, C14). `Program.cs` recibe una sola línea: `builder.Services.AddFrente2(builder.Configuration);`. Se define en Api porque es el único proyecto que referencia Application e Integrations.

### US-F2-01 · Publicar contratos de cotización, cálculo de prima, fake para F3 y punto de registro del frente

- **Frente:** Vehículos, planes y cotización · **Rama sugerida:** `feature/US-F2-01-contratos-cotizacion` · **Tamaño:** M
- **Casos de uso / Reglas:** CU09 / RN06, RN16 · **Secciones de la spec:** 4 (RN06), 5 (tabla Cotizaciones), 9.5 C

**Propósito:** Publica los contratos que el Frente 3 podrá consumir (`ICotizacionService`, `CotizacionDto`; F3 no espera a ellos para arrancar) y la fórmula de RN06 como función pura. Crea `AddFrente2` y la única línea de `Program.cs` del frente. Al terminar, F3 puede programar la emisión contra el fake, y el ejemplo de 9.5 C da 9.100,00 (RC) y 16.380,00 (TC).

**Alcance (incluye):**
- `backend/Aseguradora.Application/Services/ICotizacionService.cs`: `ObtenerAsync(Guid id, CancellationToken ct)` (lanza `NotFoundException`) y `CotizarVehiculoAsync(Guid vehiculoId, CancellationToken ct)` (devuelve `CotizacionResultado`).
- `backend/Aseguradora.Application/Services/ICotizacionExternaService.cs`: `CotizarExternoAsync(CotizacionExternaRequest request, CancellationToken ct)`. Se publica aquí para que la firma quede fija; la implementación llega en US-F2-07.
- `backend/Aseguradora.Application/Dtos/CotizacionDto.cs`: `record` con `Id`, `PlanId`, `CodigoPlan`, `ClienteId?`, `VehiculoId?`, `PrimaMensual`, `FechaCotizacion`, `FechaVencimiento`, `Origen`, y el método `bool EstaVigente(DateTime ahoraUtc)` (vigente si `ahoraUtc <= FechaVencimiento`).
- `backend/Aseguradora.Application/Dtos/CotizacionResultado.cs`: `CotizacionResultado(DateTime FechaVencimiento, IReadOnlyList<OpcionCotizacion> Opciones)` y `OpcionCotizacion(Guid IdCotizacion, string CodigoPlan, string Plan, decimal PrimaMensual)`.
- `backend/Aseguradora.Application/Dtos/CotizacionExternaRequest.cs`: `TipoVehiculo`, `Anio`, `Uso`, `EdadConductor` (enums y `int` tipados, sin atributos de serialización).
- `backend/Aseguradora.Application/Services/CalculoPrima.cs`: método estático `Calcular(decimal primaBase, TipoVehiculo tipo, int anioVehiculo, int anioReferencia, int edadConductor, UsoVehiculo uso)`. Factores RN06 como constantes nombradas (sin números mágicos). Antigüedad = `anioReferencia - anioVehiculo`, con piso en 0. Redondeo a 2 decimales con `MidpointRounding.AwayFromZero`. El año de referencia llega por parámetro, nunca desde el reloj, para que los tests sean deterministas.
- `backend/Aseguradora.Tests/Fakes/FakeCotizacionService.cs`: implementación en memoria con una cotización vigente de id fijo (`FakeCotizacionService.CotizacionVigenteId`) y otra vencida, más `NotFoundException` para ids desconocidos.
- `backend/Aseguradora.Api/Frentes/Frente2/Frente2Extensions.cs`: método de extensión `AddFrente2(this IServiceCollection services, IConfiguration config)` (C14). En esta tarea no registra servicios todavía; cada tarea posterior agrega su línea dentro.
- `backend/Aseguradora.Api/Program.cs`: una sola línea `builder.Services.AddFrente2(builder.Configuration);`. Nada más en `Program.cs` (la estructura es de US-T-01 y US-F1-01).
- Convención de código: primary constructors, documentación XML en miembros públicos y `ArgumentNullException` en constructores (skill `dotnet-best-practices`). Todos los métodos de acceso a datos `async`.
- Convención de tests (C1): xUnit (`[Fact]`, `[Theory]`), fakes escritos a mano. Sin Moq ni FluentAssertions. Los MSTest de la skill no se usan.

**Fuera de alcance:** la lógica de compatibilidad de planes y la persistencia de cotizaciones (US-F2-06); los endpoints (US-F2-06 y US-F2-07).

**Puede empezar sin esperar a:** las entidades `Plan`, `Cotizacion`, `Vehiculo` y los enums `TipoVehiculo`, `UsoVehiculo`, `OrigenCotizacion` ya existen en Domain (US-01). No depende de otra tarea del frente ni de otro frente. Es la primera tarea del frente y entra en la primera ola. F3 no espera a esta tarea para arrancar: US-F3-02 (emisión) arranca con una cotización creada por seed. Cuando F3 quiera usar `ICotizacionService`, lo inyecta por la interfaz; la implementación real se registra en `AddFrente2` con US-F2-06, y F3 no registra su propia implementación. Hasta entonces F3 puede usar `FakeCotizacionService` en sus tests.

**Entrega a otros (contratos que publica):** `ICotizacionService`, `CotizacionDto`, `CotizacionResultado`, `OpcionCotizacion`, `ICotizacionExternaService`, `CotizacionExternaRequest`, `FakeCotizacionService` y `AddFrente2`. Lo consumirá F3 (emisión, CU10) cuando lo necesite; no es requisito para que F3 arranque (ver "Puede empezar sin esperar a"). Lo consumen también los controllers de US-F2-06 y US-F2-07.

**Criterios de aceptación:**
- [ ] `CalculoPrima.Calcular(10000, Moto, 2024, 2026, 23, Particular)` devuelve `9100.00` (ejemplo 9.5 C, RC con base de prueba).
- [ ] `CalculoPrima.Calcular(18000, Moto, 2024, 2026, 23, Particular)` devuelve `16380.00` (ejemplo 9.5 C, TC).
- [ ] Factores de edad: 24 → 1,30; 25 → 1,00; 65 → 1,00; 66 → 1,15.
- [ ] Factores de antigüedad: 0 y 5 → 1,00; 6 y 10 → 1,10; 11 → 1,25.
- [ ] Factores de tipo (Auto 1,00 · Moto 0,70 · Camioneta 1,20) y de uso (Particular 1,00 · Comercial 1,40).
- [ ] `CotizacionDto.EstaVigente` es `true` hasta `FechaVencimiento` inclusive y `false` después.
- [ ] `FakeCotizacionService.ObtenerAsync` devuelve la cotización vigente y lanza `NotFoundException` con un id desconocido.
- [ ] `Program.cs` tiene una sola línea nueva, `AddFrente2`, y `AddFrente2` compila sin registrar nada.
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos:**
- `CalculoPrimaTests`: `Calcular_ejemplo_9_5_C_devuelve_9100_para_RC_y_16380_para_TC` (Theory); `Calcular_aplica_factor_de_edad_en_los_limites` (Theory con 24, 25, 65, 66); `Calcular_aplica_factor_de_antiguedad_en_los_limites` (Theory con 5, 6, 10, 11); `Calcular_redondea_a_dos_decimales_away_from_zero`; `Calcular_con_anio_futuro_trata_la_antiguedad_como_cero`.
- `CotizacionDtoTests`: `EstaVigente_es_true_hasta_la_fecha_de_vencimiento_inclusive`; `EstaVigente_es_false_despues_del_vencimiento`.
- `FakeCotizacionServiceTests`: `ObtenerAsync_con_id_conocido_devuelve_la_cotizacion`; `ObtenerAsync_con_id_desconocido_lanza_NotFoundException`.

**Decisiones pendientes:** ninguna en esta tarea. El año de referencia para la antigüedad lo toma US-F2-06 de `TimeProvider` (año UTC, RN16); esta tarea solo lo recibe por parámetro.

---

### US-F2-02 · ABM de planes (CU08) y seed de planes TC y TR

- **Frente:** Vehículos, planes y cotización · **Rama sugerida:** `feature/US-F2-02-abm-planes` · **Tamaño:** M
- **Casos de uso / Reglas:** CU08 / RN05, RN15, RN16 · **Secciones de la spec:** 3 (CU08), 4 (RN05, RN15), 5 (Planes y datos iniciales), 7 (PlanesController)

**Propósito:** El administrador gestiona los planes (CU08); el público ve solo los activos. El seed agrega TC y TR, que la spec deja a este módulo. El RC de US-01 no cambia.

**Alcance (incluye):**
- `backend/Aseguradora.Application/Services/IPlanService.cs` y `PlanService.cs`: `ListarActivosAsync`, `ObtenerActivoAsync`, `CrearAsync`, `ActualizarAsync`, `DesactivarAsync`. Validaciones en Application: `Codigo` único (400), `TiposPermitidos` solo con valores de `TipoVehiculo` (400), `AntiguedadMaxima` mayor o igual a 0 o null (400), `PrimaBase` mayor que 0 (400).
- `backend/Aseguradora.Application/Dtos/PlanRequest.cs` y `PlanResponse.cs`, con Data Annotations en el request (`Required`, `StringLength` según la tabla Planes de la spec).
- `backend/Aseguradora.Api/Controllers/PlanesController.cs`:
  - `GET /api/planes`: `[AllowAnonymous]`, devuelve solo `Activo = true`.
  - `GET /api/planes/{id}`: `[AllowAnonymous]`; plan inactivo → 404.
  - `POST /api/planes`: `[Authorize(Policy = Politicas.Admin)]`.
  - `PUT /api/planes/{id}`: `[Authorize(Policy = Politicas.Admin)]`.
  - `DELETE /api/planes/{id}`: `[Authorize(Policy = Politicas.Admin)]`; desactiva (`Activo = false`), no borra.
- Registro: `IPlanService` → `PlanService` dentro de `AddFrente2`.
- Seed (C5, C14): `backend/Aseguradora.Data/Seed/PlanesSeeder.cs`, clase `PlanesSeeder : ISeeder` (`SembrarAsync(IServiceProvider services, CancellationToken ct)`, US-T-01) que inserta TC y TR con ids fijos solo si no existen (búsqueda por `Codigo`, idempotente). Se registra con `services.AddScoped<ISeeder, PlanesSeeder>()` dentro de `AddFrente2`; `SeedData` no se toca. El RC de US-01 no se mueve.
- Sin migración de seed: TC y TR van por `ISeeder` (C14), no por `HasData`, así que no se genera `AgregarPlanesSeed` ni se toca el `ModelSnapshot`. La regla C6 no aplica a este seed.

**Fuera de alcance:** consulta de compatibilidad por vehículo (US-F2-06). Coberturas en tabla aparte (la spec dice que no existe, sección 10).

**Puede empezar sin esperar a:** `Plan` y `PlanConfiguration` (índice único en `Codigo`) ya existen. El seed ya tiene RC (`SeedData.PlanRcId`). `ISeeder` y `SeedData.EjecutarAsync` son de US-T-01. Las pruebas de autorización usan `AseguradoraWebFactory` y `TestAuthHandler` de US-T-03 (C16); si T-03 aún no está mergeada, esos tests quedan para el final, y el resto de la tarea puede avanzar.

**Entrega a otros (contratos que publica):** ninguno para otros frentes. F3 y F4 leen `Plan` por `IRepository<Plan>` usando los ids del seed. Los ids fijos de TC y TR quedan definidos en `PlanesSeeder`.

**Criterios de aceptación:**
- [ ] `GET /api/planes` sin token devuelve solo planes con `Activo = true`: RC, TC y TR tras el seed.
- [ ] `GET /api/planes/{id}` de un plan activo responde 200; de un plan inactivo, 404.
- [ ] `POST /api/planes` con un `Codigo` ya existente responde 400 con un mensaje que nombra el código duplicado.
- [ ] `POST /api/planes` con `TiposPermitidos = "Bicicleta"` responde 400.
- [ ] `DELETE /api/planes/{id}` responde 204, deja la fila (`Activo = false`) y el plan deja de aparecer en `GET /api/planes` (RN15).
- [ ] Un usuario con rol Empleado recibe 403 en `POST /api/planes`, `PUT /api/planes/{id}` y `DELETE /api/planes/{id}`.
- [ ] `PUT /api/planes/{id}` cambia `PrimaBase`, y la póliza seed `PolizaId` conserva `PrimaMensual = 12000.00` (no cambia por el plan, RN06 / tabla Polizas).
- [ ] Tras ejecutar `SeedData` sobre base limpia, existen TC y TR con sus ids fijos y RC no cambia; ejecutar el seeder dos veces no duplica planes.
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos:**
- `PlanServiceTests`: `CrearAsync_con_datos_validos_persiste_el_plan`; `CrearAsync_con_codigo_duplicado_lanza_BusinessRuleException`; `CrearAsync_con_tipo_inexistente_lanza_BusinessRuleException`; `CrearAsync_con_antiguedad_negativa_lanza_BusinessRuleException`; `DesactivarAsync_marca_inactivo_y_no_borra_la_fila`; `ActualizarAsync_no_modifica_la_prima_de_polizas_emitidas`; `ObtenerActivoAsync_con_plan_inactivo_lanza_NotFoundException`.
- `PlanesControllerTests` (`AseguradoraWebFactory` de US-T-03, base SQLite de `SqliteDbFixture`): `GET_sin_token_devuelve_solo_activos`; `GET_plan_inactivo_devuelve_404`; `POST_como_empleado_devuelve_403`; `POST_codigo_duplicado_devuelve_400_problem_json`.
- `PlanesSeederTests` (Data, SQLite): `SembrarAsync_agrega_TC_y_TR_con_codigos_unicos`; `SembrarAsync_dos_veces_no_duplica_planes`.

**Decisiones pendientes:**
- Primas base de TC (18.000, de la spec 9.5 C) y de TR: propuesta **30.000** para TR, a confirmar. TR: `TiposPermitidos = "Auto,Camioneta"` y `AntiguedadMaxima = 10` (RN05, ejemplo "a confirmar" de la spec). TC: `TiposPermitidos = "Auto,Moto,Camioneta"`, sin antigüedad máxima (según el ejemplo 9.5 C, que cotiza moto en TC).
- `GET /api/planes/{id}` de un plan inactivo: propuesta **404** para el público.

---

### US-F2-03 · Servicio DNRPA: mock y cliente HTTP sobre el helper de resiliencia

- **Frente:** Vehículos, planes y cotización · **Rama sugerida:** `feature/US-F2-03-dnrpa-service` · **Tamaño:** M
- **Casos de uso / Reglas:** CU06 / RN03 · **Secciones de la spec:** 2 (integraciones, DNRPA), 9.4 (DNRPA), 6 (Integrations/Dnrpa)

**Propósito:** Proveer `IDnrpaService` con dos implementaciones: `DnrpaMockService` (lo usamos desde el día uno) y `DnrpaHttpService` contra el contrato 9.4. La elección es por configuración (`Integraciones:Dnrpa:UsarMock`), así que la alta de vehículo (US-F2-04) recibe datos del DNRPA sin saber cuál está activo.

**Alcance (incluye):**
- `backend/Aseguradora.Application/External/IDnrpaService.cs`: `Task<DatosDnrpa?> ObtenerVehiculoAsync(string patente, CancellationToken ct)`. Devuelve `null` si DNRPA no conoce la patente; lanza `ExternalServiceException` ante fallas.
- `backend/Aseguradora.Application/External/DatosDnrpa.cs`: `record` con `Patente`, `Marca`, `Modelo`, `Anio`, `Tipo` (`TipoVehiculo`), `NumeroMotor`, `NumeroChasis`, `TitularDni`, `TitularNombre`.
- `backend/Aseguradora.Integrations/Dnrpa/DnrpaMockService.cs`: datos fijos. `AB123CD` (Toyota Corolla XEi 2021, Auto, titular 30123456, igual que `SeedData`), `AE789FG` (titular 30123456, para alta válida) y `AC456EF` (titular 27111222, para probar RN03).
- `backend/Aseguradora.Integrations/Dnrpa/DnrpaHttpService.cs`: hereda de `ClienteHttpBase` (US-T-02). Llama `GET {Integraciones:Dnrpa:BaseUrl}/api/vehiculos/{patente}` (9.4) con `EnviarAsync(..., esIdempotente: true)`. Mapea camelCase; `404` → `null`. Los `5xx`, timeouts y errores de red los traduce `ClienteHttpBase` a `ExternalServiceException`. **No define timeout ni reintentos propios** (C4).
- Registro (C5, C13, C14): dentro de `AddFrente2` (`backend/Aseguradora.Api/Frentes/Frente2/Frente2Extensions.cs`) se agrega `AgregarIntegracion<IDnrpaService, DnrpaMockService, DnrpaHttpService>("Dnrpa")` de US-T-02, que elige la implementación por `Integraciones:Dnrpa:UsarMock`. No se crea ni se modifica ningún `DependencyInjection.cs` compartido de Integrations (es de US-T-02).

**Fuera de alcance:** la alta de vehículo que usa el servicio (US-F2-04). Renaper, ARCA, pasarelas (otros frentes). Timeout, reintentos y circuito (US-T-02).

**Puede empezar sin esperar a:** no depende de otra tarea del frente. El mock no necesita red ni base de datos. La clase base `ClienteHttpBase`, el helper `AgregarIntegracion` y los tests de timeout dependen de US-T-02: si aún no está mergeada, esos puntos esperan; el DTO, la interfaz y el mock avanzan.

**Entrega a otros (contratos que publica):** `IDnrpaService` y `DatosDnrpa`. Los consume solo US-F2-04.

**Criterios de aceptación:**
- [ ] `DnrpaMockService.ObtenerVehiculoAsync("AB123CD")` devuelve Toyota, Anio 2021, Tipo Auto y titular 30123456.
- [ ] `DnrpaMockService.ObtenerVehiculoAsync("ZZ999ZZ")` devuelve `null`.
- [ ] `DnrpaHttpService` mapea un `200` al `DatosDnrpa`, un `404` a `null`, y un `500` o un timeout a `ExternalServiceException`.
- [ ] Con `Integraciones:Dnrpa:UsarMock = true` el contenedor resuelve `DnrpaMockService`; con `false`, `DnrpaHttpService`.
- [ ] `DnrpaHttpService` no declara timeout ni reintentos propios (la configuración viene de US-T-02).
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos:**
- `DnrpaMockServiceTests`: `ObtenerVehiculoAsync_con_patente_conocida_devuelve_datos`; `ObtenerVehiculoAsync_con_patente_desconocida_devuelve_null`.
- `DnrpaHttpServiceTests` (con `HttpMessageHandler` falso): `Mapea_200_a_DatosDnrpa`; `Devuelve_null_con_404`; `Lanza_ExternalServiceException_con_500`; `Lanza_ExternalServiceException_con_timeout`; `Ignora_campos_desconocidos_del_json`.
- `DnrpaRegistroTests` (`ServiceCollection` con `AddFrente2`): `UsarMock_true_resuelve_mock`; `UsarMock_false_resuelve_http`.

**Decisiones pendientes:**
- DNRPA no tiene grupo (sección 2): `DnrpaHttpService` queda como adaptador contra el contrato 9.4 con `BaseUrl` configurable. Propuesta: `UsarMock = true` en `appsettings`, y el HTTP sin uso hasta que exista un servicio real.
- Timeout y reintentos: los fija US-T-02 (C4, C13) en `IntegracionOptions` (`TimeoutSegundos`, `ReintentosMaximos`), no esta tarea. Esta tarea no define valores propios.

---

### US-F2-04 · Alta de vehículo con validación DNRPA (CU06)

- **Frente:** Vehículos, planes y cotización · **Rama sugerida:** `feature/US-F2-04-alta-vehiculo` · **Tamaño:** M
- **Casos de uso / Reglas:** CU06 / RN03 · **Secciones de la spec:** 3 (CU06), 4 (RN03), 5 (Vehiculos), 7 (VehiculosController `POST /api/vehiculos`)

**Propósito:** El empleado da de alta un vehículo a un cliente. La API valida la patente, consulta DNRPA y comprueba que el titular sea el DNI del cliente. Al terminar, el vehículo queda con `ValidadoDnrpa = true` y listo para cotizar o emitir.

**Alcance (incluye):**
- `backend/Aseguradora.Application/Services/IVehiculoService.cs` y `VehiculoService.cs`: `AltaAsync(VehiculoAltaRequest request, CancellationToken ct)`.
- `backend/Aseguradora.Application/Dtos/VehiculoAltaRequest.cs`: `ClienteId`, `Patente` (regex `^([A-Z]{2}[0-9]{3}[A-Z]{2}|[A-Z]{3}[0-9]{3})$`, la patente se normaliza a mayúsculas antes de validar), `Uso` (`UsoVehiculo`).
- `backend/Aseguradora.Application/Dtos/VehiculoResponse.cs`: `Id`, `ClienteId`, `Patente`, `Marca`, `Modelo`, `Anio`, `Tipo`, `Uso`, `ValidadoDnrpa`, `Activo`.
- Flujo de `AltaAsync`: (1) cliente activo por `IRepository<Cliente>` (si no existe, `NotFoundException`); (2) patente única (400); (3) `IDnrpaService.ObtenerVehiculoAsync` (null → 400 `VEHICULO_NO_ENCONTRADO`); (4) `TitularDni == cliente.Dni` (RN03, 400); (5) guardar el `Vehiculo` con `ValidadoDnrpa = true` y `IUnitOfWork.SaveChangesAsync`.
- `backend/Aseguradora.Api/Controllers/VehiculosController.cs`: `POST /api/vehiculos` → 201 con `Location` a `GET /api/vehiculos/{id}` (ese `GET` llega en US-F2-05). `[Authorize(Policy = Politicas.Empleado)]` (política definida en US-F1-01).
- Registro: `IVehiculoService` → `VehiculoService` dentro de `AddFrente2`.

**Fuera de alcance:** consulta, modificación y baja (US-F2-05). Validación de año futuro (decisión pendiente).

**Puede empezar sin esperar a:** `IDnrpaService` de US-F2-03; si esa tarea no está mergeada, usar un fake local de `IDnrpaService` escrito a mano en tests. El cliente del seed (`SeedData.ClienteId`, DNI 30123456) ya existe; no depende del servicio de clientes del Frente 1. Los tests de controller usan `AseguradoraWebFactory` de US-T-03.

**Entrega a otros (contratos que publica):** ninguno. `VehiculoResponse` queda disponible, pero F3 y F4 leen `Vehiculo` directo por `IRepository<Vehiculo>`.

**Criterios de aceptación:**
- [ ] `POST /api/vehiculos` con `clienteId` del seed, patente `ae789fg` y uso `Particular` responde 201, `patente` en mayúsculas, `marca` "Toyota" y `validadoDnrpa = true`.
- [ ] `POST /api/vehiculos` con patente `AB123CD` (ya existe en el seed) responde 400 y no crea fila.
- [ ] `POST /api/vehiculos` con patente `AC456EF` (titular 27111222 distinto del DNI del cliente) responde 400 con un mensaje de RN03.
- [ ] `POST /api/vehiculos` con patente `ZZ999ZZ` (no existe en DNRPA) responde 400 con el código `VEHICULO_NO_ENCONTRADO` en el mensaje.
- [ ] `POST /api/vehiculos` con `clienteId` inexistente responde 404.
- [ ] `POST /api/vehiculos` con patente con formato inválido (`AB12CDE`) responde 400 por validación de formato.
- [ ] `POST /api/vehiculos` con DNRPA lanzando `ExternalServiceException` responde 502 y no se guarda nada.
- [ ] Sin token, `POST /api/vehiculos` responde 401; con token sin rol, 403.
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos:**
- `VehiculoServiceTests` (fake de `IDnrpaService`, SQLite de `SqliteDbFixture`): `AltaAsync_valido_guarda_vehiculo_validado`; `AltaAsync_normaliza_patente_a_mayusculas`; `AltaAsync_con_patente_duplicada_lanza_BusinessRuleException`; `AltaAsync_con_titular_distinto_lanza_BusinessRuleException`; `AltaAsync_sin_datos_en_dnrpa_lanza_BusinessRuleException`; `AltaAsync_con_cliente_inexistente_lanza_NotFoundException`; `AltaAsync_con_dnrpa_caido_no_persiste_nada`.
- `PatenteRegexTests` (Theory): acepta `AB123CD` y `ABC123`; rechaza `AB12CDE`, `ABC1234`, `A123`.
- `VehiculosControllerTests` (`AseguradoraWebFactory` y `TestAuthHandler` de US-T-03): `POST_valido_devuelve_201_con_location`; `POST_sin_rol_devuelve_403`.

**Decisiones pendientes:**
- Cliente con `Activo = false`: propuesta **400** (regla de negocio), no 404.
- `VEHICULO_NO_ENCONTRADO` de DNRPA: propuesta **400**, porque es una regla de negocio no cumplida (sección 9, tabla de códigos). Alternativa: 404.
- Año de fabricación futuro: la spec no lo define. Propuesta: rechazar con 400 si `Anio > año actual + 1`, con el año tomado de `TimeProvider`. Requiere confirmación.

---

### US-F2-05 · Consulta, modificación y baja de vehículos (CU07)

- **Frente:** Vehículos, planes y cotización · **Rama sugerida:** `feature/US-F2-05-consulta-baja-vehiculos` · **Tamaño:** S
- **Casos de uso / Reglas:** CU07 / RN15, RN04 (solo la comprobación de baja) · **Secciones de la spec:** 3 (CU07), 4 (RN04, RN15), 7 (VehiculosController)

**Propósito:** El empleado lista los vehículos de un cliente, consulta uno, cambia su uso y da de baja lógica los que no tienen póliza activa. Completa el controller de vehículos.

**Alcance (incluye):**
- `VehiculoService`: `ListarPorClienteAsync(Guid clienteId)` (solo `Activo = true`), `ObtenerAsync(Guid id)`, `ModificarUsoAsync(Guid id, UsoVehiculo uso)`, `DarDeBajaAsync(Guid id)`.
- `backend/Aseguradora.Application/Dtos/ModificarUsoRequest.cs`: `record ModificarUsoRequest(UsoVehiculo Uso)`. Es el único campo editable (la spec dice "Modifica uso").
- `backend/Aseguradora.Api/Controllers/VehiculosController.cs` (creado en US-F2-04), todos con `[Authorize(Policy = Politicas.Empleado)]`:
  - `GET /api/vehiculos?clienteId=` (400 si falta el parámetro).
  - `GET /api/vehiculos/{id}`.
  - `PUT /api/vehiculos/{id}` (cambia solo el uso).
  - `DELETE /api/vehiculos/{id}` → 204.
- Baja: si existe una `Poliza` con `VehiculoId` y estado `Pendiente`, `Vigente` o `Suspendida`, responde 400 (RN04; estos tres estados son los que RN04 define como póliza activa). Si no, `Activo = false` (RN15; sin borrado físico).

**Fuera de alcance:** alta (US-F2-04). Emisión de pólizas y la regla RN04 completa al emitir (F3).

**Puede empezar sin esperar a:** depende de US-F2-04 (`VehiculoService` y `VehiculosController` ya existen). El seed tiene un vehículo con póliza Vigente (`SeedData.VehiculoId`), suficiente para probar el bloqueo.

**Entrega a otros (contratos que publica):** ninguno.

**Criterios de aceptación:**
- [ ] `GET /api/vehiculos?clienteId=<seed>` devuelve solo vehículos activos de ese cliente.
- [ ] `GET /api/vehiculos` sin `clienteId` responde 400.
- [ ] `PUT /api/vehiculos/{id}` con `uso = "COMERCIAL"` cambia el uso y no cambia la patente.
- [ ] `DELETE /api/vehiculos/{id}` sobre `SeedData.VehiculoId` (póliza Vigente) responde 400 con mensaje de póliza activa.
- [ ] `DELETE /api/vehiculos/{id}` sobre un vehículo sin póliza activa responde 204 y deja la fila con `Activo = false` (RN15).
- [ ] `GET /api/vehiculos/{id}` con id inexistente responde 404.
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos:**
- `VehiculoServiceTests`: `ListarPorClienteAsync_no_devuelve_inactivos`; `DarDeBajaAsync_con_poliza_Vigente_lanza_BusinessRuleException`; `DarDeBajaAsync_con_poliza_Pendiente_o_Suspendida_lanza_BusinessRuleException` (Theory); `DarDeBajaAsync_con_polizas_Cancelada_o_Vencida_permite_la_baja` (Theory); `DarDeBajaAsync_no_borra_la_fila`; `ModificarUsoAsync_cambia_solo_el_uso`; `ObtenerAsync_inexistente_lanza_NotFoundException`.
- `VehiculosControllerTests`: `GET_sin_clienteId_devuelve_400`; `GET_id_inexistente_devuelve_404`; `DELETE_con_poliza_activa_devuelve_400`; `DELETE_valido_devuelve_204`.

**Decisiones pendientes:**
- `GET /api/vehiculos/{id}` de un vehículo dado de baja: propuesta **200** con `activo = false` (trazabilidad). Alternativa: 404.
- Modificar `Uso` no cambia cotizaciones ni pólizas ya emitidas (la prima se copia al emitir, tabla Polizas). Se anota en la respuesta de la API; no requiere decisión.

---

### US-F2-06 · Cotizar un vehículo en los planes compatibles (CU09 interno)

- **Frente:** Vehículos, planes y cotización · **Rama sugerida:** `feature/US-F2-06-cotizacion-vehiculo` · **Tamaño:** L
- **Casos de uso / Reglas:** CU09 / RN05, RN06, RN16 · **Secciones de la spec:** 3 (CU09), 4 (RN05, RN06), 5 (Cotizaciones), 7 (CotizacionesController `POST /api/cotizaciones`, `GET /api/cotizaciones/{id}`)

**Propósito:** El empleado cotiza un vehículo. El sistema filtra los planes compatibles (RN05), calcula la prima de cada uno (RN06), guarda una `Cotizacion` por plan con vencimiento a 15 días y devuelve las opciones. Implementa `ICotizacionService` de US-F2-01, así que el Frente 3 pasa del fake a la implementación real.

**Alcance (incluye):**
- `backend/Aseguradora.Application/Services/CotizacionService.cs` que implementa `ICotizacionService`:
  - `CotizarVehiculoAsync`: carga el `Vehiculo` y su `Cliente` (edad del conductor a partir de `FechaNacimiento`), filtra planes `Activo` con `TiposPermitidos` que incluya el tipo del vehículo y `AntiguedadMaxima` null o mayor o igual a la antigüedad (RN05), calcula con `CalculoPrima` y persiste una `Cotizacion` por plan con `Origen = Panel` y `FechaVencimiento = ahora + 15 días`.
  - `ObtenerAsync`: devuelve `CotizacionDto` o `NotFoundException`.
- Motor compartido `MotorCotizacion` (Application/Services) que US-F2-07 reutiliza para la cotización externa.
- `backend/Aseguradora.Api/Controllers/CotizacionesController.cs`, con `[Authorize(Policy = Politicas.Empleado)]`:
  - `POST /api/cotizaciones` (body `{ vehiculoId }`, 201).
  - `GET /api/cotizaciones/{id}` (200 / 404).
- Tiempo por `TimeProvider` inyectado, no `DateTime.UtcNow` directo. `AddFrente2` lo registra con `TryAddSingleton(TimeProvider.System)` para no chocar con el registro de US-T-05.
- Registro: `ICotizacionService` → `CotizacionService` dentro de `AddFrente2`.

**Fuera de alcance:** cotización externa sin cliente (US-F2-07). Emisión de póliza a partir de la cotización (F3, CU10).

**Puede empezar sin esperar a:** US-F2-01 (contratos y `CalculoPrima`). Para la base de tests, los planes del seed (RC en `SeedData`). Los tests de compatibilidad crean sus propios planes en el fixture, así que no esperan a US-F2-02 (TC y TR). El vehículo y el cliente del seed ya existen. Los tests de controller usan `AseguradoraWebFactory` de US-T-03.

**Entrega a otros (contratos que publica):** la implementación real de `ICotizacionService` que F3 usa para emitir (CU10). Endpoints `POST /api/cotizaciones` y `GET /api/cotizaciones/{id}`.

**Criterios de aceptación:**
- [ ] `POST /api/cotizaciones` con `vehiculoId = SeedData.VehiculoId` (Auto 2021, Particular, cliente de 41 años) responde 201 con RC `12000.00` (seed), y con TC `18000.00` y TR `30000.00` cuando US-F2-02 está mergeada. Los importes suponen año de referencia 2026: antigüedad 5 → factor 1,00.
- [ ] `POST /api/cotizaciones` con un vehículo Moto no devuelve TR (RN05: TR acepta solo Auto y Camioneta).
- [ ] `POST /api/cotizaciones` con un vehículo de 2000 (antigüedad 26) no devuelve TR (antigüedad máxima 10) y aplica factor 1,25 en RC y TC.
- [ ] Cada opción tiene su `idCotizacion` persistido, con `FechaVencimiento` a 15 días y `Origen = Panel`.
- [ ] `GET /api/cotizaciones/{id}` devuelve el `CotizacionDto`; un id inexistente responde 404.
- [ ] `POST /api/cotizaciones` sin planes compatibles responde 400 (ver decisiones).
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos:**
- `CotizacionServiceTests` (SQLite, `TimeProvider` propio: subclase de `TimeProvider` que sobrescribe `GetUtcNow`, sin paquete extra): `CotizarVehiculo_devuelve_una_opcion_por_plan_compatible`; `CotizarVehiculo_excluye_planes_que_no_aceptan_el_tipo`; `CotizarVehiculo_excluye_planes_por_antiguedad_maxima`; `CotizarVehiculo_calcula_la_edad_desde_fecha_de_nacimiento`; `CotizarVehiculo_persiste_una_cotizacion_por_plan_con_vencimiento_15_dias`; `CotizarVehiculo_sin_planes_compatibles_lanza_BusinessRuleException`; `CotizarVehiculo_con_vehiculo_inexistente_lanza_NotFoundException`; `ObtenerAsync_devuelve_dto_con_EstaVigente`.
- `CotizacionesControllerTests`: `POST_devuelve_201_con_opciones`; `GET_inexistente_devuelve_404`.

**Decisiones pendientes:**
- Sin planes compatibles: propuesta **400** con mensaje ("Ningún plan es compatible con el vehículo"). Alternativa: 201 con `opciones` vacío.
- Año de referencia: propuesta `TimeProvider` y año UTC (RN16). La edad del conductor se calcula con la fecha UTC de hoy.
- Una `Cotizacion` por plan (la relación Plan → Cotización de la spec es 1 a N). Esto cambia la forma de la respuesta de la sección 9.5 C; ver US-F2-07.

---

### US-F2-07 · Cotización externa sin cliente (CU09, actor Sistema externo; 9.5 C)

- **Frente:** Vehículos, planes y cotización · **Rama sugerida:** `feature/US-F2-07-cotizacion-externa` · **Tamaño:** M
- **Casos de uso / Reglas:** CU09 (actor Sistema externo) / RN05, RN06 · **Secciones de la spec:** 2 (servicios ofrecidos, C), 7 (ExternoController, dividido por frente según C7), 9.5 C

**Propósito:** Ventas de motos y otros sistemas cotizan un seguro sin tener cliente registrado. El caso de test de referencia es el ejemplo de 9.5 C (moto, 2024, particular, conductor de 23 años → RC 9.100,00 y TC 16.380,00 con bases de prueba 10.000 y 18.000).

**Alcance (incluye):**
- `backend/Aseguradora.Application/Services/CotizacionExternaService.cs` que implementa `ICotizacionExternaService` y reutiliza `MotorCotizacion` de US-F2-06. No hay cliente ni vehículo: `ClienteId` y `VehiculoId` quedan null, `Origen = Externo`.
- `backend/Aseguradora.Api/Controllers/ExternoCotizacionesController.cs`, con `[Route("api/externo/cotizaciones")]` y `[HttpPost]`, que expone `POST /api/externo/cotizaciones` (201). `[Authorize(Policy = Politicas.ApiKey)]`: autenticación por API key `X-Api-Key` de US-F1-01.
- Body HTTP en Api: `backend/Aseguradora.Api/Externo/CotizacionExternaBody.cs`, con los enums en mayúsculas (`MOTO`, `PARTICULAR`) mediante `backend/Aseguradora.Api/Serialization/UpperSnakeEnumConverter.cs`. El converter se aplica solo a este body. El `CotizacionExternaRequest` de Application queda sin atributos de serialización (la capa Application no depende de la serialización) y el controller mapea body → request.
- Respuesta según 9.5 C: `{ fechaVencimiento, opciones: [{ idCotizacion, codigoPlan, plan, primaMensual }] }` (ver decisiones).
- Registro: `ICotizacionExternaService` → `CotizacionExternaService` dentro de `AddFrente2`.

**Fuera de alcance:** `GET /api/externo/vehiculos/{patente}/seguro-vigente` (F3, `ExternoSeguroController`) y `GET /api/externo/clientes/{dni}/deuda` (F4). Cada frente tiene su propio controller bajo `/api/externo` (C7).

**Puede empezar sin esperar a:** US-F2-06 (`MotorCotizacion`) para la lógica. Para la autenticación, `Politicas.ApiKey` de US-F1-01 (header `X-Api-Key`) y el arnés de US-T-03 (`AseguradoraWebFactory`, `TestAuthHandler`).

**Entrega a otros (contratos que publica):** `POST /api/externo/cotizaciones`, documentado en Swagger para Ventas de motos y Municipalidad (9.5 C).

**Criterios de aceptación:**
- [ ] `POST /api/externo/cotizaciones` con `{ "tipoVehiculo": "MOTO", "anio": 2024, "uso": "PARTICULAR", "edadConductor": 23 }` y una API key válida responde 201 con RC `9100.00` y TC `16380.00` (bases de prueba del test), sin TR (el plan no acepta motos).
- [ ] `POST /api/externo/cotizaciones` sin `X-Api-Key` responde 401; con una clave incorrecta, 401.
- [ ] Cada opción se guarda como `Cotizacion` con `Origen = Externo`, `ClienteId` y `VehiculoId` null.
- [ ] La respuesta no incluye datos de ningún cliente ni vehículo.
- [ ] `POST /api/externo/cotizaciones` con `uso = "COMERCIAL"` aplica factor 1,40.
- [ ] `POST /api/externo/cotizaciones` con un valor fuera de enum (`tipoVehiculo = "BICICLETA"`) responde 400.
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos:**
- `CotizacionExternaServiceTests` (planes del fixture con `PrimaBase` 10.000 y 18.000): `CotizarExterno_ejemplo_9_5_C_devuelve_9100_y_16380`; `CotizarExterno_persiste_cotizaciones_sin_cliente_ni_vehiculo`; `CotizarExterno_uso_comercial_aplica_1_40`; `CotizarExterno_sin_planes_compatibles_lanza_BusinessRuleException`.
- `CotizacionExternaTests` (Theory, edad): 24 → 1,30; 25 → 1,00; 65 → 1,00; 66 → 1,15.
- `ExternoCotizacionesControllerTests`: `POST_sin_api_key_devuelve_401`; `POST_con_api_key_valida_devuelve_201_con_contrato_9_5_C`; `POST_con_enum_invalido_devuelve_400`.
- `UpperSnakeEnumConverterTests`: lee `"MOTO"` y escribe `"MOTO"`; rechaza `"moto"` y valores desconocidos (ver decisiones).

**Decisiones pendientes:**
- **Primas base:** el seed de RC (US-01) tiene `PrimaBase = 12000`, pero el ejemplo 9.5 C usa 10.000 ("primas base de prueba"). Propuesta: no tocar el seed; el test fija 10.000 y 18.000 explícitamente en sus planes del fixture.
- **Forma de la respuesta:** la spec 9.5 C tiene un `idCotizacion` de nivel superior, pero con una cotización por plan no hay un único id. Propuesta: quitar el id superior y que cada opción lleve su `idCotizacion`. Es un cambio respecto de la spec que requiere acordarlo con Ventas de motos y la Municipalidad.
- **Enums en mayúsculas:** propuesta aplicar el converter solo al body de `/api/externo/cotizaciones`, y dejar el resto de la API con el formato por defecto. Propuesta: rechazar minúsculas (`"moto"` → 400), porque el contrato de 9.5 C usa mayúsculas.
- **Rango de `edadConductor` y `anio`:** la spec no los define. Propuesta: edad entre 0 y 120 (límites técnicos) y `anio <= año actual + 1`, con el año de `TimeProvider`. A confirmar.
- **Sin planes compatibles:** igual que US-F2-06 (400).

---

## Trazabilidad CU / RN / endpoints del Frente 2

| Referencia | Tarea(s) |
| --- | --- |
| CU06 · Alta de vehículo con validación DNRPA (RN03) | US-F2-03, US-F2-04 |
| CU07 · Consultar, modificar y dar de baja vehículos (RN15, RN04) | US-F2-05 |
| CU08 · ABM de planes de cobertura (RN05, RN15) | US-F2-02 |
| CU09 · Cotizar un seguro para un vehículo (RN05, RN06) | US-F2-01, US-F2-06 (Empleado), US-F2-07 (Sistema externo) |
| RN03 · Patente única, validación DNRPA, titular = DNI | US-F2-03, US-F2-04 |
| RN04 · Comprobación de póliza activa al dar de baja | US-F2-05 (la regla completa al emitir es de F3) |
| RN05 · Planes compatibles (tipo, antigüedad) | US-F2-02, US-F2-06, US-F2-07 |
| RN06 · Fórmula de prima y factores | US-F2-01, US-F2-06, US-F2-07 |
| RN15 · Baja lógica | US-F2-02, US-F2-05 |
| RN16 · Importes en pesos decimal(18,2), fechas UTC | US-F2-01, US-F2-02, US-F2-06 |
| Sección 2 y 9.4 · DNRPA mock + HTTP | US-F2-03 |
| Sección 5 · Seed de planes TC y TR | US-F2-02 |
| Sección 2 y 9.5 C · Cotización externa | US-F2-07 |

| Endpoint (sección 7) | Tarea |
| --- | --- |
| `GET /api/vehiculos?clienteId=` | US-F2-05 |
| `GET /api/vehiculos/{id}` | US-F2-05 |
| `POST /api/vehiculos` | US-F2-04 |
| `PUT /api/vehiculos/{id}` | US-F2-05 |
| `DELETE /api/vehiculos/{id}` | US-F2-05 |
| `GET /api/planes` | US-F2-02 |
| `GET /api/planes/{id}` | US-F2-02 |
| `POST /api/planes` | US-F2-02 |
| `PUT /api/planes/{id}` | US-F2-02 |
| `DELETE /api/planes/{id}` | US-F2-02 |
| `POST /api/cotizaciones` | US-F2-06 |
| `GET /api/cotizaciones/{id}` | US-F2-06 |
| `POST /api/externo/cotizaciones` (sección 7 y 9.5 C) | US-F2-07 |

---

## Frente 3 · Pólizas, cuotas y Pago Fácil

**Objetivo.** Emitir pólizas con vigencia de 1, 6 o 12 meses a partir de una cotización (CU10), consultarlas y cancelarlas (CU11 a CU13), mantener sus estados por la tarea diaria de vencimientos (CU14), exponer el seguro vigente a sistemas externos (CU19) y cubrir Pago Fácil: cupón con código de barras, rendición diaria y base positiva (CU20 a CU22). Al terminar el frente, una póliza se emite, se suspende o vence sola, los externos consultan si un vehículo está asegurado, y la rendición de Pago Fácil cobra por el mismo camino que el resto de los medios (US-F4-02).

**Dependencias.** *Desde otros frentes:* F2 aporta `Cotizacion` (CU09). F1 aporta el cliente validado en Renaper, el JWT y las políticas `Politicas.Empleado`, `Politicas.Admin` y `Politicas.ApiKey` (C10), el verificador público `IVerificadorPublico` (US-F1-07) y el paginado `PaginaResponse<T>` (US-F1-06). Transversal aporta el arnés de tests `AseguradoraWebFactory` y `TestAuthHandler` (US-T-03, C16). F4 aporta las interfaces `IActualizadorEstadoPoliza` (US-F4-01, esta tarea la implementa) e `IAprobacionPagoService` (US-F4-01 la declara, US-F4-02 la implementa). Mientras F2 no publique cotizaciones, F3 usa una cotización creada en el test o por el seed propio (US-F3-02).
*Hacia otros frentes:* F4 consume las entidades `Poliza`/`Cuota` con sus transiciones y `IActualizadorEstadoPoliza` (US-F3-01). El cobro de cuotas no es de F3: lo hace `IAprobacionPagoService` (US-F4-02, dueño del cobro). F3-07 (rendición) solo llama a ese servicio.
*Orden dentro del frente:* F3-01 → F3-02 → F3-03 → F3-04. F3-05 depende de F3-01; F3-06 depende de F3-01 y de F1-07 (GlobalLimiter, C15); F3-07 depende de F3-06 y del servicio de cobro de F4-02 (C12); F3-08 depende de F3-06 (y de F3-01 por `Cuota`).

**Nota transversal sobre archivos compartidos (convenciones C5, C6, C7).**
- `backend/Aseguradora.Api/Program.cs`: F3 agrega una sola línea, `builder.Services.AddFrente3(builder.Configuration);`, creada en US-F3-01 (C14). Todo el registro de F3 vive en `Frente3Extensions.AddFrente3(services, config)` (`backend/Aseguradora.Api/Frentes/Frente3/Frente3Extensions.cs`), que crea US-F3-01 y amplían las tareas siguientes.
- Seed: F3 no toca `backend/Aseguradora.Data/Seed/SeedData.cs` (C14). `SeedFrente3` (`backend/Aseguradora.Data/Seed/SeedFrente3.cs`, creada en US-F3-02) implementa `ISeeder` idempotente y se registra en `AddFrente3` con `services.AddScoped<ISeeder, SeedFrente3>()`.
- `backend/Aseguradora.Api/Middleware/ExceptionMiddleware.cs`: F3 agrega solo el mapeo de `ReglaDeDominioException` (y su subclase `TransicionInvalidaException`) a 400, en US-F3-01. Avisar a F1 y F4.
- F3 no crea ni edita `Aseguradora.Application/DependencyInjection.cs` (C14): su registro va en `AddFrente3`, sin `AddApplication()` compartido.
- Migraciones de F3 (US-F3-02 y US-F3-05): cada una se genera solo después de rebasar sobre `development` (regla C6, abajo en US-F3-05).

---

### US-F3-01 · Dominio de Póliza y Cuota: transiciones, excepciones de dominio y reevaluación de estado tras el pago

- **Frente:** Frente 3 · **Rama sugerida:** `feature/US-F3-01-dominio-poliza-cuota` · **Tamaño:** L
- **Casos de uso / Reglas:** CU10, CU12, CU14 (reglas de dominio) / RN07, RN08, RN09, RN10, RN13, RN14, RN16, RN19
- **Secciones de la spec:** 4 (RN07 a RN14, RN19), 5 (Polizas, Cuotas), 6 (transiciones como métodos de la entidad)

**Propósito:** Dejar en Domain la máquina de estados de `Poliza`, las reglas de `Cuota`, el cálculo de cuotas por vigencia y las excepciones de dominio (dueño: F3, convención C2). Además implementa la reevaluación de la póliza después de un pago (RN07, RN09): F4 marca las cuotas pagadas y llama a esta reevaluación; la regla de "cuándo activar o reactivar" es de F3. Todo lo de Domain es testeable sin base de datos.

**Alcance (incluye):**
- Dueño único (C11) de `ReglaDeDominioException`, de su subclase `TransicionInvalidaException`, de `Cuota.Pagar(DateTime fecha)` y de las transiciones de `Poliza` listadas abajo. Nadie define otra excepción ni `Cuota.MarcarPagada`.
- `backend/Aseguradora.Domain/Entities/Poliza.cs`: métodos
  - `Activar()`: Pendiente → Vigente (RN07).
  - `Suspender()`: Vigente → Suspendida (RN09).
  - `Reactivar()`: Suspendida → Vigente, solo si no quedan cuotas en estado Vencida (RN09).
  - `Cancelar(string motivo, DateTime fecha)`: Pendiente, Vigente o Suspendida → Cancelada; guarda `FechaCancelacion` y `MotivoCancelacion`; el motivo es obligatorio y de hasta 200 caracteres; las cuotas Pendiente o Vencida pasan a Anulada, las Pagada no cambian (RN13).
  - `Vencer()`: Vigente o Suspendida → Vencida (RN14).
  - `bool DaCobertura` → `Estado == Vigente` (RN10).
  - `ReevaluarEstado(IEnumerable<Cuota> cuotas)`: si está Pendiente y la cuota Numero 1 está Pagada, llama a `Activar()`; si está Suspendida y no tiene cuotas Vencida, llama a `Reactivar()`; en otro caso no cambia nada (RN07, RN09). No cambia estado si no corresponde. Recibe las cuotas por parámetro para no depender de la navegación `Cuotas`.
- `backend/Aseguradora.Domain/Entities/Cuota.cs`: métodos
  - `Vencer(DateOnly hoy)`: si Estado es Pendiente y `hoy > FechaVencimiento`, pasa a Vencida y `Recargo = Round(Importe * TasaRecargoMora, 2)` (RN08).
  - `Pagar(DateTime fecha)`: Pendiente o Vencida → Pagada y `FechaPago`. Es el único método de pago de cuota; US-F4-02 lo llama (no existe `MarcarPagada`). Desde Pagada o Anulada lanza `TransicionInvalidaException`.
  - `Anular()`: Pendiente o Vencida → Anulada.
- `backend/Aseguradora.Domain/Services/TasaRecargoMora.cs`: constante `0.05m` (RN08).
- `backend/Aseguradora.Domain/Services/CalculadorCuotas.cs`: `IReadOnlyList<Cuota> GenerarCuotas(Guid polizaId, decimal primaMensual, DateOnly fechaInicio, int vigenciaMeses)`. Valida vigencia en {1, 6, 12} y prima mayor que cero; genera cuotas Numero 1..N, `Importe = primaMensual`, `Recargo = 0`, Estado Pendiente, `FechaVencimiento` día 10 (ver Decisiones pendientes). `FechaFin = fechaInicio.AddMonths(vigenciaMeses)` se calcula en la póliza.
- `backend/Aseguradora.Domain/Exceptions/ReglaDeDominioException.cs`: excepción base para reglas de dominio no cumplidas (vigencia inválida, prima no positiva, motivo vacío).
- `backend/Aseguradora.Domain/Exceptions/TransicionInvalidaException.cs`: `TransicionInvalidaException : ReglaDeDominioException`, para transiciones de estado no permitidas. Dueño de la excepción (C2); US-F4-02 la usa y no la crea.
- `backend/Aseguradora.Api/Middleware/ExceptionMiddleware.cs`: mapear `ReglaDeDominioException` (incluye `TransicionInvalidaException`) a 400 con ProblemDetails.
- `backend/Aseguradora.Application/Services/IActualizadorEstadoPoliza.cs`: `Task ReevaluarAsync(Guid polizaId, CancellationToken ct)`. La interfaz la publica US-F4-01 con esta misma firma; si esa tarea no está en `development` cuando se empieza, se crea el archivo idéntico y se resuelve el conflicto al mergear (quien llegue primero).
- `backend/Aseguradora.Application/Services/ActualizadorEstadoPoliza.cs`: implementa `IActualizadorEstadoPoliza`. Carga la póliza con `IRepository<Poliza>.GetByIdAsync` y sus cuotas con `IRepository<Cuota>.FindAsync(c => c.PolizaId == polizaId)`, después llama `poliza.ReevaluarEstado(cuotas)`. No usa `Include` (Application no referencia EF, como en US-F1-08). No llama a `SaveChanges`: lo hace quien llama (US-F4-02) con `IUnitOfWork`. Póliza inexistente → `NotFoundException`.
- `backend/Aseguradora.Api/Frentes/Frente3/Frente3Extensions.cs` (C14): método `AddFrente3(this IServiceCollection services, IConfiguration config)`, que registra `IActualizadorEstadoPoliza` (scoped). Esta tarea crea el archivo; las tareas siguientes de F3 agregan sus registros aquí.
- `backend/Aseguradora.Api/Program.cs`: una línea `builder.Services.AddFrente3(builder.Configuration);`.

**Fuera de alcance:** persistencia y migraciones de pólizas (ya están en US-01; la secuencia de numeración en US-F3-02, la tabla de control en US-F3-05), emisión (US-F3-02), endpoints (US-F3-03), tarea diaria (US-F3-05), cobro (creación de `Pago`/`PagoCuota`, `Pago.Aprobar` y factura: US-F4-02), rendición (US-F3-07).

**Puede empezar sin esperar a:** nada de dominio: es Domain puro sobre las entidades de US-01. `ActualizadorEstadoPoliza` usa solo `IRepository<T>` y la interfaz de US-F4-01 (ver la regla de conflicto arriba); sus tests usan repositorios falsos.

**Entrega a otros (contratos que publica):** `Poliza.Activar/Suspender/Reactivar/Cancelar/Vencer/DaCobertura/ReevaluarEstado`, `Cuota.Vencer/Pagar/Anular`, `CalculadorCuotas.GenerarCuotas`, `TasaRecargoMora`, `ReglaDeDominioException`, `TransicionInvalidaException` (C11: dueño único), la implementación de `IActualizadorEstadoPoliza` (la llama US-F4-02 después de marcar cuotas pagadas) y `Frente3Extensions.AddFrente3(services, config)`. Los consumen US-F3-02 a US-F3-08 y F4.

**Criterios de aceptación:**
- [ ] `Poliza` en Pendiente: `Activar()` pasa a Vigente; `Activar()` desde Vigente lanza `TransicionInvalidaException`.
- [ ] `Suspender()` desde Vigente pasa a Suspendida; `Reactivar()` con una cuota Vencida lanza excepción y sin cuotas Vencidas pasa a Vigente (RN09).
- [ ] `Cancelar(motivo, fecha)` desde Pendiente, Vigente o Suspendida pasa a Cancelada, guarda fecha y motivo, y anula las cuotas impagas conservando las Pagadas (RN13).
- [ ] `Cancelar` desde Vencida o Cancelada lanza excepción; motivo vacío o de más de 200 caracteres lanza `ReglaDeDominioException`.
- [ ] `Vencer()` desde Vigente o Suspendida pasa a Vencida (RN14); desde otro estado lanza excepción.
- [ ] `DaCobertura` es verdadero solo en Vigente (RN10, los cinco estados).
- [ ] `Cuota.Vencer(hoy)` aplica recargo del 5% solo si `hoy > FechaVencimiento`. Ejemplo de la spec 9.5 B: importe 25000.00 → recargo 1250.00.
- [ ] `ReevaluarEstado` con cuota 1 Pagada pasa una póliza Pendiente a Vigente (RN07); una Suspendida sin vencidas pasa a Vigente; una Suspendida con una cuota Vencida sigue Suspendida (RN09).
- [ ] `ReevaluarAsync` con póliza inexistente lanza `NotFoundException`; no llama a `SaveChanges`.
- [ ] Una `TransicionInvalidaException` llega como 400 en ProblemDetails por el middleware.
- [ ] `GenerarCuotas` con vigencia 1, 6 o 12 devuelve 1, 6 o 12 cuotas numeradas desde 1, con importe igual a la prima; vigencia 3 o 24 lanza `ReglaDeDominioException`.
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos (xUnit, sin base de datos salvo el middleware):**
- `PolizaTransicionesTests`: `Activar_DesdePendiente_PasaAVigente`, `Activar_DesdeVigente_Lanza`, `Suspender_DesdeVigente`, `Reactivar_SinCuotasVencidas`, `Reactivar_ConCuotaVencida_Lanza`, `Cancelar_DesdeEstadoActivo` (theory con los tres estados), `Cancelar_DesdeVencida_Lanza`, `Cancelar_MotivoVacio_Lanza`, `Cancelar_AnulaImpagasYConservaPagadas`, `Vencer_DesdeVigente`, `Vencer_DesdePendiente_Lanza`, `DaCobertura_SoloVigente` (theory de cinco estados).
- `PolizaReevaluacionTests`: `ReevaluarEstado_CuotaUnoPagada_ActivaPendiente`, `ReevaluarEstado_SuspendidaSinVencidas_Reactiva`, `ReevaluarEstado_SuspendidaConVencida_SigueSuspendida`, `ReevaluarEstado_SinCambiosAplicables_NoTocaEstado`.
- `CuotaTests`: `Vencer_DespuesDelVencimiento_AplicaRecargo5`, `Vencer_MismoDia_NoVence`, `Vencer_YaVencida_NoRecalculaRecargo` (idempotencia), `Pagar_DesdeAnulada_Lanza`, `Anular_DesdePagada_Lanza`.
- `CalculadorCuotasTests`: `GenerarCuotas_VigenciaValida_CantidadCorrecta` (theory 1, 6, 12), `GenerarCuotas_VigenciaInvalida_Lanza` (theory 0, 3, 24), `GenerarCuotas_ImportesIgualesAPrima`, `GenerarCuotas_VencimientoDia10DelMesSiguiente`, `GenerarCuotas_PrimaCeroONegativa_Lanza`.
- `ActualizadorEstadoPolizaTests` (repositorios falsos): `ReevaluarAsync_PolizaInexistente_LanzaNotFound`, `ReevaluarAsync_LlamaReevaluarEstadoConLasCuotasDeLaPoliza`, `ReevaluarAsync_NoPersiste`.
- `ExceptionMiddlewareTests` (junto al test de US-01): `TransicionInvalida_Responde400ProblemDetails`.

**Decisiones pendientes:**
- Primer vencimiento (spec 10, abierta). Default (C8): la cuota N vence el día 10 del mes `FechaInicio + N`, de modo que la cuota 1 vence el día 10 del mes siguiente al inicio. Se ajusta cuando el equipo defina el plazo mínimo.
- `Vencer()` desde Pendiente: propuesta, no permitido. RN19 cancela esas pólizas antes.
- Motivo de la cancelación automática por RN19: propuesta, texto fijo "Cuota 1 vencida sin pago".
- Nombre de la excepción de regla general: `ReglaDeDominioException` como base, para no mezclarla con `BusinessRuleException` de Application (que sigue en 400 por el mismo middleware). Cerrado por C11.

---

### US-F3-02 · Emisión de póliza desde cotización (CU10, servicio)

- **Frente:** Frente 3 · **Rama sugerida:** `feature/US-F3-02-emision-poliza` · **Tamaño:** L
- **Casos de uso / Reglas:** CU10 / RN02, RN03, RN04, RN05, RN06 (usa la prima guardada, no recalcula), RN07, RN16
- **Secciones de la spec:** 3 (ejemplo detallado CU10), 4 (RN02 a RN07), 5 (Polizas, Cuotas), 6 (recorrido de una petición)

**Propósito:** `PolizaService.EmitirAsync` valida todas las reglas de emisión y crea la póliza Pendiente con sus cuotas en una sola transacción. Si una validación falla, no se guarda nada y la excepción llega como 400 por el middleware. Devuelve un DTO, nunca la entidad. Esta tarea también aporta el seed de prueba de cotizaciones (`SeedFrente3`) hasta que F2 publique sus endpoints.

**Alcance (incluye):**
- `backend/Aseguradora.Application/Dtos/Polizas/EmitirPolizaRequest.cs`: `record EmitirPolizaRequest(Guid CotizacionId, int VigenciaMeses)`.
- `backend/Aseguradora.Application/Dtos/Polizas/PolizaDetalleResponse.cs` y `CuotaResponse.cs`: records de salida.
- `backend/Aseguradora.Application/Services/PolizaService.cs`: `EmitirAsync(EmitirPolizaRequest, CancellationToken)`. Validaciones en este orden, cada una con `BusinessRuleException` (salvo la vigencia, que la valida `CalculadorCuotas` con `ReglaDeDominioException`):
  1. Cotización existente (si no, `NotFoundException`) y vigente: `FechaVencimiento >= hoy` (RN06).
  2. La cotización no tiene póliza (`Cotizacion.Poliza == null`).
  3. Cliente activo y `ValidadoRenaper` (RN02).
  4. Vehículo activo, `ValidadoDnrpa`, y `Vehiculo.ClienteId == Cliente.Id` (RN03).
  5. El vehículo no tiene póliza en Pendiente, Vigente o Suspendida (RN04).
  6. Plan activo, `TiposPermitidos` incluye el tipo del vehículo y antigüedad `anioActual - Anio <= AntiguedadMaxima` cuando no es nula (RN05).
  7. Vigencia 1, 6 o 12 (lo valida `CalculadorCuotas`, US-F3-01).
- Creación: `Numero` del numerador, `PrimaMensual = cotizacion.PrimaMensual`, `FechaEmision` en UTC, `FechaInicio` (propuesta: hoy en zona Argentina), `FechaFin = FechaInicio.AddMonths(VigenciaMeses)`, Estado Pendiente, cuotas de `CalculadorCuotas`. Un solo `SaveChangesAsync`.
- `backend/Aseguradora.Application/Services/INumeradorPolizas.cs`: `Task<string> SiguienteNumeroAsync(CancellationToken)` que devuelve `POL-0000001`.
- `backend/Aseguradora.Data/Numeracion/NumeradorPolizasSql.cs`: `NEXT VALUE FOR dbo.SeqNumeroPoliza` con formato de 7 dígitos.
- `backend/Aseguradora.Data/Migrations/*_AgregarSecuenciaNumeroPoliza.cs`: `CREATE SEQUENCE dbo.SeqNumeroPoliza AS bigint START WITH 1 INCREMENT BY 1`. Se genera después de rebasar sobre `development` (C6); nadie edita migraciones ajenas.
- `backend/Aseguradora.Data/Seed/SeedFrente3.cs`: clase propia que implementa `ISeeder` (US-T-01, `SembrarAsync(IServiceProvider, CancellationToken)`), idempotente, con `AgregarCotizacionDePrueba`, solo para Development, hasta que F2 publique `CotizacionesController`. Se registra en `AddFrente3` (C14); no toca `SeedData`.
- `backend/Aseguradora.Api/Frentes/Frente3/Frente3Extensions.cs`: registra `PolizaService`, `INumeradorPolizas` → `NumeradorPolizasSql`.

**Fuera de alcance:** endpoints HTTP (US-F3-03), cancelación HTTP (US-F3-03), cálculo de la prima (F2), creación de la tabla de control del job (US-F3-05).

**Puede empezar sin esperar a:** F2 mediante una cotización creada en el test o por `SeedFrente3.AgregarCotizacionDePrueba`. Depende de US-F3-01 (mismo frente): usa `Poliza`, `Cuota`, `CalculadorCuotas` y `IActualizadorEstadoPoliza` registrado en `AddFrente3`. Depende de US-T-01 para la interfaz `ISeeder` (C14).

**Entrega a otros (contratos que publica):** `PolizaService.EmitirAsync(EmitirPolizaRequest, CancellationToken) : Task<PolizaDetalleResponse>`, `INumeradorPolizas`, DTOs `EmitirPolizaRequest`, `PolizaDetalleResponse`, `CuotaResponse`. Lo consume US-F3-03.

**Criterios de aceptación:**
- [ ] Con cotización vigente, cliente validado y vehículo validado, `EmitirAsync` devuelve `Numero = POL-0000001`, Estado Pendiente y las cuotas.
- [ ] Vigencia 1, 6 y 12 generan 1, 6 y 12 cuotas con importe igual a `PrimaMensual` de la cotización (RN07).
- [ ] Cotización vencida, cotización ya usada, cliente no validado (RN02), vehículo no validado o titular distinto (RN03), vehículo con póliza activa (RN04), o plan que no acepta el tipo o la antigüedad (RN05) lanzan `BusinessRuleException` con mensaje claro.
- [ ] Un vehículo con póliza Cancelada o Vencida sí puede emitir de nuevo (RN04).
- [ ] Ante cualquier fallo no queda ninguna fila nueva en `Polizas` ni en `Cuotas`.
- [ ] Dos emisiones seguidas generan `POL-0000001` y `POL-0000002`.
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos:**
- `PolizaServiceEmisionTests` (unit con `INumeradorPolizas` falso y `SqliteDbFixture`): `Emitir_CotizacionValida_CreaPolizaPendienteConCuotas` (theory 1, 6, 12), `Emitir_CotizacionVencida_Lanza`, `Emitir_CotizacionYaUsada_Lanza`, `Emitir_ClienteNoValidadoRenaper_Lanza`, `Emitir_VehiculoNoValidadoDnrpa_Lanza`, `Emitir_TitularDistinto_Lanza`, `Emitir_VehiculoConPolizaActiva_Lanza` (theory Pendiente, Vigente, Suspendida), `Emitir_VehiculoConPolizaCancelada_Permite`, `Emitir_PlanNoAceptaTipo_Lanza`, `Emitir_AntiguedadExcedida_Lanza`, `Emitir_FallaValidacion_NoGuardaNada`, `Emitir_NumerosConsecutivos`, `Emitir_ArgumentoNulo_Lanza`.
- `NumeradorPolizasSqlTests`: `[Collection("SqlServer")]` y `[SkippableFact]`, se omite sin SQL Server (convención de US-T-03).

**Decisiones pendientes:**
- `FechaInicio` (CU10 no lo pide). Propuesta: fecha de emisión en zona Argentina.
- Numeración (no definida en la spec). Propuesta: secuencia SQL Server. Alternativa: `MAX + 1` con UQ y reintento, más simple pero con riesgo de carrera.
- Antigüedad: `anioActual` según zona Argentina (propuesta).

---

### US-F3-03 · Endpoints de pólizas: emitir, consultar, cancelar y ver cuotas (CU10, CU11, CU12, CU13)

- **Frente:** Frente 3 · **Rama sugerida:** `feature/US-F3-03-endpoints-polizas` · **Tamaño:** M
- **Casos de uso / Reglas:** CU10, CU11, CU12, CU13 (consulta de cuotas de la póliza) / RN10, RN13, RN15, RN17
- **Secciones de la spec:** 7 (PolizasController), 6 (Mejoras 1 y 4, convenciones)

**Propósito:** `PolizasController` expone la emisión, la consulta, la cancelación y las cuotas de una póliza. Todas las respuestas son DTOs, los errores pasan por el middleware y los roles son Empleado o Administrador (`Politicas.Empleado`, C7).

**Alcance (incluye):**
- `backend/Aseguradora.Api/Controllers/PolizasController.cs` con `[Authorize(Policy = Politicas.Empleado)]` (RN17), ruta `api/polizas`:
  - `POST /api/polizas` → 201 con `Location` (usa `PolizaService.EmitirAsync`).
  - `GET /api/polizas?estado=&clienteId=&patente=&pagina=&tamano=` → paginado.
  - `GET /api/polizas/{id}` → detalle con vehículo, plan y cuotas.
  - `POST /api/polizas/{id}/cancelar` → body `CancelarPolizaRequest(string Motivo)`.
  - `GET /api/polizas/{id}/cuotas` → cuotas ordenadas por `Numero`.
- `backend/Aseguradora.Application/Services/PolizaService.cs`: `ListarAsync`, `ObtenerAsync`, `ObtenerCuotasAsync`, `CancelarAsync`. `CancelarAsync` llama a `Poliza.Cancelar` de US-F3-01.
- `backend/Aseguradora.Application/Dtos/Polizas/CancelarPolizaRequest.cs` (`[Required]`, `[StringLength(200)]`), `PolizaListItemResponse.cs`. Paginado: `PaginaResponse<T>` de US-F1-06 (no se crea otro).
- `backend/Aseguradora.Api/Frentes/Frente3/Frente3Extensions.cs`: sin registros nuevos salvo los que necesite `PolizaService` de consulta.

**Fuera de alcance:** emisión (US-F3-02, servicio), transiciones (US-F3-01), consulta pública con DNI (F1, `PublicoController`), deuda para externos (F4, `DeudaExternaController`).

**Puede empezar sin esperar a:** US-T-03 para JWT: las pruebas usan `AseguradoraWebFactory` y `TestAuthHandler` (esquema `Bearer`, C16). Depende de US-F3-02 y US-F3-01.

**Entrega a otros (contratos que publica):** rutas `POST /api/polizas`, `GET /api/polizas`, `GET /api/polizas/{id}`, `POST /api/polizas/{id}/cancelar`, `GET /api/polizas/{id}/cuotas`; DTOs `PolizaListItemResponse`, `PolizaDetalleResponse`, `CuotaResponse`.

**Criterios de aceptación:**
- [ ] `POST /api/polizas` con cotización válida responde 201 con `Location` y la póliza con sus cuotas.
- [ ] `POST /api/polizas` con vigencia 3 responde 400 en formato `ProblemDetails`.
- [ ] Un usuario con rol que no es Empleado ni Administrador recibe 403; sin token, 401.
- [ ] `GET /api/polizas?estado=Vigente` solo devuelve pólizas Vigentes; `?patente=AB123CD` filtra por vehículo.
- [ ] `GET /api/polizas/{id}` devuelve vehículo, plan y cuotas; un id inexistente responde 404.
- [ ] `GET /api/polizas/{id}/cuotas` devuelve las cuotas ordenadas por número.
- [ ] `POST /api/polizas/{id}/cancelar` con motivo responde 200 y estado Cancelada; sin motivo responde 400; una póliza Vencida responde 400 (RN13).
- [ ] Ningún endpoint devuelve entidades: una prueba por reflexión verifica que los tipos de respuesta son DTOs.
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos:**
- `PolizasControllerTests` (`AseguradoraWebFactory` de US-T-03, C16, con Sqlite): `Post_EmiteYDevuelve201`, `Post_VigenciaInvalida_400`, `Post_RolNoAutorizado_403`, `Post_SinToken_401`, `Get_FiltraPorEstado`, `Get_FiltraPorPatente`, `Get_Detalle_IncluyeCuotas`, `Get_IdInexistente_404`, `Get_Cuotas_Ordenadas`, `Cancelar_Ok_200`, `Cancelar_SinMotivo_400`, `Cancelar_PolizaVencida_400`.
- `PolizaServiceConsultaTests` y `PolizaServiceCancelarTests`: paginado, filtros, cancelar anula cuotas impagas (RN13).
- `ContratosDtoTests`: ningún tipo de respuesta de `PolizasController` expone una entidad.

**Decisiones pendientes:**
- Paginación por defecto: 20 elementos, máximo 100, la que fije US-F1-06 (propuesta).

---

### US-F3-04 · Seguro vigente para sistemas externos (CU19)

- **Frente:** Frente 3 · **Rama sugerida:** `feature/US-F3-04-seguro-vigente-externo` · **Tamaño:** S
- **Casos de uso / Reglas:** CU19 / RN10, RN17
- **Secciones de la spec:** 7 (ExternoController, seguro vigente), 9.5 A, 2 (servicios que ofrecemos)

**Propósito:** `GET /api/externo/vehiculos/{patente}/seguro-vigente` responde si el vehículo tiene una póliza Vigente en la fecha de hoy. Nunca responde 404 por falta de seguro y no revela datos del titular.

**Alcance (incluye):**
- `backend/Aseguradora.Application/Services/SeguroVigenteService.cs`: `ConsultarAsync(string patente, DateOnly hoy, CancellationToken)`. Normaliza la patente (mayúsculas, sin espacios), busca la póliza Vigente del vehículo con `FechaInicio <= hoy <= FechaFin` (RN10).
- `backend/Aseguradora.Application/Dtos/Externo/SeguroVigenteResponse.cs`: `Patente`, `TieneSeguro`, `NumeroPoliza?`, `Plan?`, `VigenteDesde?`, `VigenteHasta?`.
- `backend/Aseguradora.Api/Controllers/ExternoSeguroController.cs`: `[Route("api/externo")]`, `[Authorize(Policy = Politicas.ApiKey)]` (C10: la API key y el claim `proveedor` los publica US-F1-01; el controller no lo lee). Ruta literal `GET /api/externo/vehiculos/{patente}/seguro-vigente`. Controller propio para no chocar con F2 (cotizaciones) ni F4 (deuda), C7.
- `backend/Aseguradora.Api/Frentes/Frente3/Frente3Extensions.cs`: registra `SeguroVigenteService`.

**Fuera de alcance:** la API key y su middleware (F1), deuda (F4), cotización externa (F2).

**Puede empezar sin esperar a:** US-T-03 (`AseguradoraWebFactory`). El factory reemplaza solo `Bearer` por `TestAuthHandler` (C16); el esquema real `ApiKey` de US-F1-01 queda activo, así que las pruebas de API key válida e inválida dependen de US-F1-01 (C10). Usa `DaCobertura` de US-F3-01 solo si el servicio lo necesita; la consulta se apoya en `Estado == Vigente` y las fechas.

**Entrega a otros (contratos que publica):** `GET /api/externo/vehiculos/{patente}/seguro-vigente` y `SeguroVigenteResponse`.

**Criterios de aceptación:**
- [ ] Una póliza Vigente con hoy dentro de la vigencia responde 200 con `tieneSeguro: true`, `numeroPoliza`, `plan`, `vigenteDesde` y `vigenteHasta`.
- [ ] Una póliza Pendiente, Suspendida, Cancelada o Vencida responde 200 con `tieneSeguro: false` y el resto en null (RN10, spec 9.5 A).
- [ ] Patente sin vehículo responde 200 con `tieneSeguro: false`.
- [ ] La respuesta no incluye DNI ni datos del cliente.
- [ ] Sin `X-Api-Key` o con una incorrecta responde 401.
- [ ] Patente con formato inválido responde 400 (AB123CD o ABC123).
- [ ] La patente en minúsculas se normaliza y se encuentra.
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos:**
- `SeguroVigenteServiceTests` (theory por estado), `SeguroVigenteServiceTests_Vigencia` (fuera de rango de fechas da false), `SeguroVigenteServiceTests_Normalizacion`.
- `ExternoSeguroControllerTests` (`AseguradoraWebFactory` de US-T-03, C16): `Get_ConSeguro_200`, `Get_SinSeguro_200False`, `Get_PatenteInexistente_200False`, `Get_FormatoInvalido_400`, `Get_SinApiKey_401`, `Get_RespuestaSinDatosDelTitular`.

**Decisiones pendientes:**
- Patente inexistente: 200 con `tieneSeguro: false` (propuesta, coherente con "responde sí o no").
- Formato de patente inválido: 400 (propuesta).

---

### US-F3-05 · Proceso diario de vencimientos y tarea programada (CU14)

- **Frente:** Frente 3 · **Rama sugerida:** `feature/US-F3-05-vencimientos-job` · **Tamaño:** L
- **Casos de uso / Reglas:** CU14 / RN08, RN09, RN14, RN19, RN16
- **Secciones de la spec:** 4, 5 (modelo: tabla de control, ver Decisiones), 6 (mejora 5), 11.2 (una sola réplica), 11.3 (zona horaria y repetibilidad)

**Propósito:** Una vez por día, en la zona `America/Argentina/Buenos_Aires`, el sistema pasa cuotas a Vencida con recargo, cancela pólizas con la cuota 1 vencida, suspende pólizas con 2 cuotas vencidas y vence pólizas cuya fecha de fin llegó. Es repetible: correrlo dos veces el mismo día no aplica dos veces el recargo.

**Alcance (incluye):**
- `backend/Aseguradora.Application/Services/VencimientosService.cs`: `EjecutarAsync(DateOnly hoy, CancellationToken)` con el orden:
  1. Cuotas Pendiente con `FechaVencimiento < hoy` → `Vencer(hoy)` (RN08).
  2. Pólizas Pendiente cuya cuota 1 quedó Vencida → `Cancelar(motivo, hoy)` (RN19).
  3. Pólizas Vigente con 2 o más cuotas Vencidas → `Suspender()` (RN09).
  4. Pólizas Vigente o Suspendida con `FechaFin <= hoy` → `Vencer()` (RN14).
  Devuelve un resumen con cantidades. El recargo solo se aplica en la transición Pendiente → Vencida, por eso es idempotente.
- `backend/Aseguradora.Domain/Entities/ControlProceso.cs`: `Nombre` (UQ) y `UltimaFechaProcesada` (date).
- `backend/Aseguradora.Data/Configurations/ControlProcesoConfiguration.cs` y migración `AgregarControlProcesos` (tabla `ControlesProceso`).
- `backend/Aseguradora.Api/BackgroundJobs/VencimientosJob.cs`: `BackgroundService` que corre a las 00:05 hora de Buenos Aires. Al arrancar, si el día de hoy no está procesado, lo corre. Lee y escribe `ControlProceso` con la clave `VencimientosDiarios`. Recibe `TimeProvider` para tests.
- `backend/Aseguradora.Api/Frentes/Frente3/Frente3Extensions.cs`: registra `VencimientosService`, `AddHostedService<VencimientosJob>()` y `TryAddSingleton(TimeProvider.System)`. Usa `TryAdd` para no chocar con el registro de US-T-05.

**Regla de migración (C6):** la migración `AgregarControlProcesos` se genera solo después de rebasar sobre `development` con las migraciones ya mergeadas (`AddIdentity` de US-F1-02 y, si ya están, las de F2 y F3-02). Nadie edita una migración ajena. Si el `ModelSnapshot` choca en un merge, se borra la migración propia y se regenera desde el modelo rebaseado.

**Fuera de alcance:** pagos (US-F4-02), cupones y rendiciones (US-F3-06 y US-F3-07), notificaciones.

**Puede empezar sin esperar a:** nada externo. Depende de US-F3-01 (mismo frente).

**Entrega a otros (contratos que publica):** `VencimientosService.EjecutarAsync(DateOnly, CancellationToken)`. Ninguno más.

**Criterios de aceptación:**
- [ ] Una cuota Pendiente con vencimiento ayer pasa a Vencida con recargo del 5%; con vencimiento hoy sigue Pendiente (RN08).
- [ ] Ejecutar dos veces el mismo día no cambia el recargo ni los estados.
- [ ] Una póliza Vigente con dos cuotas Vencidas pasa a Suspendida; con una sola, sigue Vigente (RN09).
- [ ] Una póliza Pendiente cuya cuota 1 venció pasa a Cancelada y sus cuotas quedan Anuladas (RN19).
- [ ] Una póliza Vigente con `FechaFin == hoy` pasa a Vencida (RN14).
- [ ] El job no corre si `UltimaFechaProcesada` ya es hoy; si el contenedor reinicia a mitad del día, corre una vez al arrancar.
- [ ] Con UTC 02:00 del día 25 (23:00 en Argentina del día 24) usa la fecha del 24 (spec 11.3).
- [ ] La migración crea la tabla `ControlesProceso` con UQ sobre `Nombre`.
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos:**
- `VencimientosServiceTests`: un test por regla (`RecargoAVencidas`, `SinRecargoEnDiaDeVencimiento`, `CancelaPolizaSiCuota1Vence`, `SuspendeConDosVencidas`, `NoSuspendeConUnaVencida`, `VenceAlLlegarFechaFin`), `EjecutarDosVeces_EsIdempotente`.
- `VencimientosJobTests` con `TimeProvider` falso: `NoCorreSiYaProcesoHoy`, `CorreAlArrancarSiNoProcesoHoy`, `UsaFechaArgentina`, `ReiniciarAMitadDeDia_NoDuplica`.
- `ControlProcesoConfigurationTests` sobre Sqlite: UQ en `Nombre`.

**Decisiones pendientes:**
- Tabla `ControlesProceso`: el modelo tiene 10 tablas; esta sería la 11. Propuesta: aceptarla y documentarla. Alternativa: guardar la fecha en un archivo local del contenedor, peor porque no sobrevive a un contenedor nuevo.
- Hora de ejecución: 00:05 de Buenos Aires (propuesta).
- RN19 se aplica literal. El plazo mínimo entre emisión y primer vencimiento (spec 10) queda pendiente.

---

### US-F3-06 · Código de barras, cupón de Pago Fácil y cupón público (CU20)

- **Frente:** Frente 3 · **Rama sugerida:** `feature/US-F3-06-cupon-pagofacil` · **Tamaño:** L
- **Casos de uso / Reglas:** CU20 / RN18, RN08 (el segundo vencimiento aplica el mismo 5%), RN11, RN17, RN20
- **Secciones de la spec:** 2 (flujo Pago Fácil), 5 (Cuotas: el código se genera cada vez), 7 (PagoFacilController y PublicoController, `POST /cupon`), 9.4 (Pago Fácil simulado)

**Propósito:** Generar el cupón de una cuota con código de barras de 42 dígitos, sin guardarlo. Se regenera cada vez porque incluye el importe con recargo. Lo usan el endpoint de empleados y el endpoint público de la web (CU20 actor Cliente, sin login), que cumple el límite de RN20 de F1.

**Alcance (incluye):**
- `backend/Aseguradora.Application/PagoFacil/CodigoBarrasPagoFacil.cs`: `Generar(...)` y `Validar(string codigo)`. Ver Decisiones para el layout.
- `backend/Aseguradora.Application/PagoFacil/ICuponPagoFacilService.cs` y `CuponPagoFacilService.cs`: `GenerarAsync(Guid cuotaId, DateOnly hoy, CancellationToken)`. Solo cuotas Pendiente o Vencida (RN11); si son Pagada o Anulada lanza `BusinessRuleException`. Importe 1.º vencimiento = `Importe + Recargo`; 2.º vencimiento = `Importe * (1 + TasaRecargoMora)` redondeado a 2 decimales.
- `backend/Aseguradora.Application/Dtos/PagoFacil/CuponPagoFacilResponse.cs`: `CuotaId`, `NumeroPoliza`, `NumeroCuota`, importes y fechas de ambos vencimientos, `CodigoBarras` (42 caracteres).
- `backend/Aseguradora.Api/Controllers/PagoFacilController.cs` (`/api/pagofacil`), `[Authorize(Policy = Politicas.Empleado)]`: `GET /api/pagofacil/cuotas/{cuotaId}/cupon`. US-F3-07 y US-F3-08 agregan acciones a este mismo controller.
- `backend/Aseguradora.Api/Controllers/PublicoCuponController.cs` (`/api/publico`, C7 y F1-07): `[AllowAnonymous]`, sin `[EnableRateLimiting]` (C15: RN20 lo aplica el `GlobalLimiter` por prefijo `/api/publico/*` de US-F1-07), `POST /api/publico/cupon` con body `CuponPublicoRequest(Dni, NumeroPoliza, NumeroCuota)` (Data Annotations). Usa `IVerificadorPublico.VerificarPolizaAsync` (US-F1-07), busca la cuota por número y llama a `ICuponPagoFacilService.GenerarAsync`. DNI o póliza que no corresponden → el mismo mensaje genérico de F1.
- `backend/Aseguradora.Api/Frentes/Frente3/Frente3Extensions.cs`: registra `ICuponPagoFacilService`.

**Fuera de alcance:** rendición (US-F3-07), base positiva (US-F3-08), límite de intentos y verificador (F1-07).

**Puede empezar sin esperar a:** US-F3-01 (mismo frente), por `TasaRecargoMora` y `Cuota.Recargo`. El servicio y el código de barras no necesitan emisión: se prueban con una póliza creada en el test. El endpoint `POST /api/publico/cupon` espera a US-F1-07 (`IVerificadorPublico` y el `GlobalLimiter` por prefijo `/api/publico/*`, C15); el resto de la tarea no.

**Entrega a otros (contratos que publica):** `ICuponPagoFacilService.GenerarAsync`, `CodigoBarrasPagoFacil.Validar`, y las rutas `GET /api/pagofacil/cuotas/{cuotaId}/cupon` y `POST /api/publico/cupon`. Lo consumen US-F3-07, US-F3-08 y F1.

**Criterios de aceptación:**
- [ ] Una cuota Pendiente genera un código de exactamente 42 dígitos (solo dígitos).
- [ ] `CodigoBarrasPagoFacil.Validar` acepta el código generado y rechaza uno con un dígito alterado.
- [ ] Mismos datos y mismo día dan el mismo código (determinista).
- [ ] Una cuota Vencida con recargo genera un código distinto al de la misma cuota sin recargo.
- [ ] Número de póliza y de cuota se recuperan del código (ida y vuelta).
- [ ] Cuota Pagada o Anulada responde 400; cuota inexistente responde 404.
- [ ] El 2.º vencimiento es `Importe * 1.05` con 2 decimales (RN08).
- [ ] `GET /api/pagofacil/cuotas/{cuotaId}/cupon` responde 200 a un Empleado, 401 sin token.
- [ ] `POST /api/publico/cupon` con DNI y póliza correctos y cuota válida responde 200 con el cupón; con DNI o póliza incorrectos responde 404 con el mismo mensaje (RN20); el undécimo intento en un minuto responde 429 (F1-07).
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos:**
- `CodigoBarrasPagoFacilTests`: `Generar_Tiene42DigitosNumericos`, `Validar_CodigoGenerado_OK`, `Validar_DigitoAlterado_Falla` (theory), `Generar_Determinista`, `Generar_ImporteDistinto_CodigoDistinto`, `IdaYVuelta_RecuperaPolizaYCuota`.
- `CuponPagoFacilServiceTests`: `Cupon_CuotaPendiente_UsaImporteSinRecargo`, `Cupon_CuotaVencida_UsaImporteConRecargo`, `Cupon_SegundoVencimiento_Mas5Por100`, `Cupon_CuotaPagada_Lanza`, `Cupon_CuotaAnulada_Lanza`, `Cupon_CuotaInexistente_NotFound`.
- `PagoFacilControllerCuponTests`: `Get_Empleado_200`, `Get_SinToken_401`.
- `PublicoCuponControllerTests` (con `AseguradoraWebFactory` de US-T-03, C16, y el `GlobalLimiter` de US-F1-07): `Post_DatosCorrectos_200`, `Post_DniDeOtroTitular_404MismoMensaje`, `Post_SinRateLimit_429Al11`.

**Decisiones pendientes:**
- **Layout exacto de 42 dígitos (bloqueante para la validez del código).** La spec remite a la especificación de Pago Fácil (PDF que pasó el profesor, no está en el repo). Propuesta por defecto, a validar contra ese PDF: empresa 5 + importe 1.º vencimiento en centavos 8 + fecha 1.º vencimiento AAAAMMDD 8 + número de cliente (póliza 7 dígitos + cuota 3) 10 + importe 2.º vencimiento en centavos 7 + días al 2.º vencimiento 2 + dígitos verificadores 2 = 42. Verificadores: módulo 10 sobre los 40 anteriores (propuesta).
- Código de empresa: valor en configuración `PagoFacil:CodigoEmpresa`, con un valor falso en `.env.example`.
- 2.º vencimiento: propuesta, 10 días después del 1.º (la spec no fija el plazo).
- Forma del cupón: propuesta, JSON con el código; el PDF queda fuera de alcance.

---

### US-F3-07 · Rendición diaria de Pago Fácil (CU21)

- **Frente:** Frente 3 · **Rama sugerida:** `feature/US-F3-07-rendicion-pagofacil` · **Tamaño:** L
- **Casos de uso / Reglas:** CU21 (el cobro lo hace CU17/CU18 vía US-F4-02) / RN12, RN18, RN11
- **Secciones de la spec:** 2 (flujo Pago Fácil, pasos 3 y 4), 5 (Pagos con medio PagoFacil, RendicionesPagoFacil), 9.4

**Propósito:** Un empleado sube el archivo de rendición de ancho fijo. Cada línea identifica una cuota por su código de barras y genera un `Pago` con medio PagoFacil, que se aprueba con `IAprobacionPagoService` de US-F4-02. Así la rendición no reimplementa el cobro y la factura de RN12 la emite F4 por el mismo camino. Cada archivo se procesa una sola vez.

**Alcance (incluye):**
- `backend/Aseguradora.Application/PagoFacil/LayoutRendicionPagoFacil.cs`: una sola clase con la posición de cada campo, para reemplazarla cuando llegue el PDF (ver Decisiones).
- `backend/Aseguradora.Application/PagoFacil/RendicionParser.cs`: lee el texto y devuelve líneas `LineaRendicion(Numero, CodigoBarras, Fecha, Importe)`, o errores de formato por línea.
- `backend/Aseguradora.Application/PagoFacil/RendicionService.cs`: `ProcesarAsync(string nombreArchivo, Stream contenido, CancellationToken)`. Se registra en `AddFrente3` (scoped). Para cada línea:
  - valida el código con `CodigoBarrasPagoFacil.Validar` (US-F3-06);
  - identifica la póliza por `Numero` con `IRepository<Poliza>.FindAsync` y la cuota por `Numero`;
  - verifica antes de cobrar que la cuota esté Pendiente o Vencida y que el importe leído sea `Importe + Recargo`; si no, es error de línea (esta comprobación es de F3 y no depende de F4);
  - crea `Pago` en estado Pendiente (Medio PagoFacil, `IdExterno = NombreArchivo + "#" + Numero`, `RendicionId`, `Numero` con formato PAG-xxxxxx) con su `PagoCuota` (importe = `Importe + Recargo`), y lo guarda con `IUnitOfWork.SaveChangesAsync`;
  - llama `IAprobacionPagoService.AprobarAsync(pago, fechaAcreditacion, ct)` (firma de US-F4-01/F4-02, C12; el `Pago` lo crea esta tarea, idealmente con `Pago.CrearPendiente(...)` de US-F4-02), que es quien marca la cuota Pagada, reevalúa la póliza y emite la factura.
  Errores de línea se reportan y no detienen el archivo. `RendicionPagoFacil` se guarda siempre con `NombreArchivo` único.
- `backend/Aseguradora.Application/Pagos/AprobacionPagoPendienteStub.cs`: stub de producción de `IAprobacionPagoService` que lanza `NotImplementedException("Requiere US-F4-02")`. Se registra en `AddFrente3` con `TryAddScoped`, para que la API arranque (DI validado en Development) mientras F4-02 no esté. Se borra al mergear F4-02, que registra la implementación real con `AddScoped` (ver hueco).
- `backend/Aseguradora.Application/Dtos/PagoFacil/RendicionResponse.cs` (procesadas, rechazadas, errores por línea) e `HistorialRendicionResponse.cs`.
- `backend/Aseguradora.Api/Controllers/PagoFacilController.cs`, `[Authorize(Policy = Politicas.Empleado)]`: `POST /api/pagofacil/rendiciones` (multipart) y `GET /api/pagofacil/rendiciones` (historial ordenado por `FechaProceso` descendente).

**Fuera de alcance:** cobro en sí (US-F4-02), factura y CAE (US-F4-02, que la emite dentro de `AprobarAsync`), base positiva (US-F3-08), cupón (US-F3-06).

**Puede empezar sin esperar a:** US-F4-01 (interfaz `IAprobacionPagoService`) y el stub de arriba. Con el fake `FakeAprobacionPagoService` en `Aseguradora.Tests/Fakes` se prueba la parte de F3 completa. Depende de US-F3-06 (validación de código) del mismo frente.

**Entrega a otros (contratos que publica):** `RendicionService.ProcesarAsync`, rutas `POST /api/pagofacil/rendiciones` y `GET /api/pagofacil/rendiciones`, `RendicionResponse`.

**Criterios de aceptación:**
- [ ] Un archivo con tres líneas, una con cuota inexistente, responde 201 con dos procesadas y un error con número de línea y motivo; se crean dos `Pago` (medio PagoFacil) y se llama a `AprobarAsync` dos veces.
- [ ] [Tras US-F4-02] Cada cuota aplicada queda Pagada; si era la cuota 1 de una póliza Pendiente, la póliza pasa a Vigente.
- [ ] [Tras US-F4-02] Cada cobro genera su factura (RN12): queda `Autorizada` con CAE o `PendienteCae`.
- [ ] Subir dos veces el mismo `NombreArchivo` responde 400 y no crea pagos (RN18).
- [ ] Una línea con verificador inválido se reporta y no se aprueba.
- [ ] Una línea con importe distinto al de la cuota, o con cuota ya Pagada, se reporta y no se aprueba.
- [ ] `IdExterno` es único entre archivos (`NombreArchivo#Numero`).
- [ ] Archivo vacío o con línea mal formada responde 400 con el detalle.
- [ ] Archivo mayor al límite responde 400 (límite propuesto de 5 MB).
- [ ] `GET /api/pagofacil/rendiciones` lista el historial ordenado por fecha de proceso descendente.
- [ ] Sin token responde 401; con rol no autorizado, 403.
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos:**
- `RendicionParserTests`: `Parsea_LineaValida`, `LineaMalFormada_DevuelveErrorConNumero` (theory), `ArchivoVacio_Lanza`.
- `RendicionServiceTests` (Sqlite y `FakeAprobacionPagoService`): `Procesa_ArchivoMixto_AplicaValidasYReportaErrores`, `ArchivoRepetido_Lanza` (RN18), `Linea_VerificadorInvalido_NoAprueba`, `Linea_ImporteDistinto_NoAprueba`, `Linea_CuotaYaPagada_NoAprueba`, `IdExternoUnicoEntreArchivos`, `CreaPagoPendienteAntesDeAprobar`.
- `RendicionIntegracionTests` (tras US-F4-02): `ActivaPolizaCuota1`, `FacturaCadaPagoDePagoFacil`.
- `RendicionControllerTests` (`AseguradoraWebFactory` de US-T-03, C16): `Post_201`, `Post_Repetido_400`, `Post_SinToken_401`, `Get_HistorialOrdenado`.

**Decisiones pendientes:**
- **Layout del archivo de rendición (bloqueante para procesar archivos reales).** Está en el PDF de Pago Fácil (SEPSA) que pasó el profesor, no en el repo. Propuesta: layout propio del mock, en una sola clase, para reemplazarlo con el real.
- Procesamiento: parcial con errores por línea (propuesta). Alternativa: todo o nada.
- Cuota ya pagada (pago duplicado, spec 10 abierta): se reporta como error de línea (propuesta, C8). La regla general de pago duplicado la decide US-F4-02.
- `RendicionPagoFacil.ImporteTotal`: suma de importes de todas las líneas del archivo (propuesta).
- Límite de tamaño: 5 MB (propuesta).

---

### US-F3-08 · Base positiva de Pago Fácil (CU22)

- **Frente:** Frente 3 · **Rama sugerida:** `feature/US-F3-08-base-positiva` · **Tamaño:** S
- **Casos de uso / Reglas:** CU22 / RN18
- **Secciones de la spec:** 2 (flujo Pago Fácil, paso 5), 9.4

**Propósito:** Genera el archivo de ancho fijo con todas las deudas, para que Pago Fácil permita pagar al cliente solo con su DNI, sin cupón. Se genera bajo demanda con `GET`.

**Alcance (incluye):**
- `backend/Aseguradora.Application/PagoFacil/BasePositivaService.cs`: `GenerarAsync(DateOnly hoy, CancellationToken)`, registrado en `AddFrente3` (scoped). Incluye cuotas Pendiente o Vencida de pólizas Pendiente, Vigente o Suspendida; excluye Pagadas, Anuladas, Canceladas y Vencidas. Registro de encabezado (empresa y fecha de generación), un registro por cuota (DNI del cliente, número de cliente, importes y vencimientos), y registro final (cantidad y total).
- `backend/Aseguradora.Application/PagoFacil/LayoutBasePositivaPagoFacil.cs`: layout de una sola clase, como en US-F3-07.
- `backend/Aseguradora.Api/Controllers/PagoFacilController.cs`: `GET /api/pagofacil/base-positiva`, con `text/plain` y `Content-Disposition` de adjunto, `[Authorize(Policy = Politicas.Empleado)]`.

**Fuera de alcance:** envío automático a Pago Fácil (no hay API; el archivo se entrega a mano), cobro (US-F4-02, vía US-F3-07).

**Puede empezar sin esperar a:** US-F3-06 (mismo frente) para el código y el número de cliente. Puede usar un layout propio hasta recibir el PDF.

**Entrega a otros (contratos que publica):** `BasePositivaService.GenerarAsync` y `GET /api/pagofacil/base-positiva`.

**Criterios de aceptación:**
- [ ] Con dos cuotas pendientes y una vencida de pólizas Vigentes, el archivo tiene tres registros de detalle y el total es la suma de los importes con recargo.
- [ ] Pagadas, Anuladas y pólizas Canceladas o Vencidas no aparecen (RN18).
- [ ] Todas las líneas de detalle tienen la misma longitud.
- [ ] Encabezado y registro final coinciden con la cantidad y el total de los detalles.
- [ ] Sin deudas, el archivo tiene 0 detalles y total `0.00`.
- [ ] `GET` responde 200 con `text/plain` y adjunto; sin token, 401.
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos:**
- `BasePositivaServiceTests`: `Incluye_PendientesYVencidas`, `Excluye_PagadasAnuladasYPolizasInactivas` (theory), `LineasDeAnchoFijo`, `EncabezadoYTotalConsistentes`, `SinDeudas_ArchivoVacio`.
- `BasePositivaControllerTests`: `Get_200_TextPlainAdjunto`, `Get_SinToken_401`.

**Decisiones pendientes:**
- **Layout del archivo (bloqueante para el envío real).** Mismo PDF pendiente que US-F3-06 y US-F3-07.
- Cuotas de pólizas Pendientes: se incluyen (propuesta, pueden pagar la cuota 1).
- Generación: bajo demanda por `GET` (propuesta). Alternativa: diaria, con la tarea de US-F3-05.

---

## Trazabilidad

**CU de mi frente**

| CU | Tareas |
|----|--------|
| CU10 Emitir póliza | US-F3-01, US-F3-02, US-F3-03 |
| CU11 Consultar pólizas y su estado | US-F3-03 |
| CU12 Cancelar póliza | US-F3-01, US-F3-03 |
| CU13 Consultar cuotas de una póliza | US-F3-03 (`GET /api/polizas/{id}/cuotas`). La deuda de un cliente para externos es de F4. |
| CU14 Vencimientos y suspensiones | US-F3-01, US-F3-05 |
| CU19 Seguro vigente para externos | US-F3-04 |
| CU20 Cupón con código de barras | US-F3-06 (`GET /api/pagofacil/cuotas/{cuotaId}/cupon` y `POST /api/publico/cupon`) |
| CU21 Rendición diaria | US-F3-07 (el cobro lo hace US-F4-02) |
| CU22 Base positiva | US-F3-08 |

**Reglas de negocio**

| RN | Tareas |
|----|--------|
| RN02 Renaper antes de emitir | US-F3-02 |
| RN03 DNRPA y titular | US-F3-02 |
| RN04 Una póliza activa por vehículo | US-F3-02 |
| RN05 Plan compatible | US-F3-02 |
| RN06 Prima de la cotización | US-F3-02 |
| RN07 Vigencia y cuotas | US-F3-01, US-F3-02. La activación al pagar la cuota 1 la dispara US-F4-02 (`IActualizadorEstadoPoliza`). |
| RN08 Recargo 5% | US-F3-01, US-F3-05, US-F3-06 |
| RN09 Suspensión y reactivación | US-F3-01, US-F3-05. La reactivación al pagar la dispara US-F4-02. |
| RN10 Solo Vigente da cobertura | US-F3-01, US-F3-03, US-F3-04 |
| RN11 Pago de cuotas, no anuladas | US-F3-06, US-F3-07. El cobro de cualquier medio: US-F4-02, US-F4-03, US-F4-04. |
| RN12 Pago aprobado (parte de cuotas) | US-F3-07 (aplica vía US-F4-02). La factura con CAE es de F4 (US-F4-02, CU18). |
| RN13 Cancelación | US-F3-01, US-F3-03 |
| RN14 Vencimiento por fecha de fin | US-F3-01, US-F3-05 |
| RN16 Importes y UTC | US-F3-01, US-F3-02 |
| RN17 Roles y API key | US-F3-03, US-F3-04, US-F3-06, US-F3-07, US-F3-08 |
| RN18 Pago Fácil | US-F3-06, US-F3-07, US-F3-08 |
| RN19 Cuota 1 vencida cancela | US-F3-01, US-F3-05 |
| RN20 Límite de intentos público | El límite lo aplica F1 (US-F1-07, `GlobalLimiter` por prefijo). US-F3-06 agrega `POST /api/publico/cupon` sin `[EnableRateLimiting]` (C15) y usa el verificador de F1. |

**Endpoints de la sección 7 de mi frente**

| Método y ruta | Tarea |
|---------------|-------|
| POST `/api/polizas` | US-F3-03 |
| GET `/api/polizas` | US-F3-03 |
| GET `/api/polizas/{id}` | US-F3-03 |
| POST `/api/polizas/{id}/cancelar` | US-F3-03 |
| GET `/api/polizas/{id}/cuotas` | US-F3-03 |
| GET `/api/externo/vehiculos/{patente}/seguro-vigente` | US-F3-04 |
| GET `/api/pagofacil/cuotas/{cuotaId}/cupon` | US-F3-06 |
| POST `/api/publico/cupon` | US-F3-06 |
| POST `/api/pagofacil/rendiciones` | US-F3-07 |
| GET `/api/pagofacil/rendiciones` | US-F3-07 |
| GET `/api/pagofacil/base-positiva` | US-F3-08 |

---

#### Notas abiertas del frente 3

1. **Layouts de Pago Fácil no están en el repo** (código de barras de 42 dígitos, archivo de rendición y base positiva). Los tres son bloqueantes para la validez real. Hace falta el PDF SEPSA del profesor. Hasta entonces, las tareas usan propuestas explícitas.
2. **Primer vencimiento abierto** (spec 10): sin esto no se puede cerrar US-F3-01 ni el job. Propuesta en US-F3-01.
3. **Fecha de inicio de la póliza**: CU10 no la pide. Propuesta: fecha de emisión.
4. **Tabla de control del job**: el modelo tiene 10 tablas. Se propone una más (US-F3-05), migrada después de rebasar (C6).
5. **Numeración de pólizas**: no definida. Propuesta: secuencia SQL (US-F3-02).
6. **Pago duplicado** (spec 10 abierta): la regla general es de US-F4-02; F3-07 solo valida la cuota antes de aprobar.
7. **Facturación de pagos de Pago Fácil**: cubierta por US-F4-02 (se emite dentro de `AprobarAsync`) una vez mergeada. Hasta entonces la rendición no factura.
8. **CU13 para empleados**: la spec no tiene endpoint de deuda para empleados, solo el de externos (F4). Se dejó con `GET /api/polizas/{id}/cuotas`.
9. **Archivos compartidos**: `Program.cs` (una línea `AddFrente3(builder.Configuration)`) y `ExceptionMiddleware.cs` (mapeo de domain exceptions). F3 no toca `SeedData`: `SeedFrente3` es `ISeeder` (C14). Coordinar con F1, F2 y F4.
10. **Mapeo de `ReglaDeDominioException` a 400**: F3-01 cambia el middleware. Avisar a F1.
11. **Vencer desde Pendiente** (RN14 no lo aclara): se propone no permitirlo. Confirmar.
12. **Segundo vencimiento del cupón** (RN18 menciona "días" sin valor): propuesta de 10 días.
13. **Registro de `IAprobacionPagoService` (para F4-02):** debe registrarse con `AddScoped` y borrar `AprobacionPagoPendienteStub`; F3 registra el stub con `TryAddScoped`.
14. **Puntos de F3 que F1 debe confirmar:** `IVerificadorPublico.VerificarPolizaAsync` (US-F1-07) y `PaginaResponse<T>` (US-F1-06) con esas firmas.

---

## Frente 4 · Pagos y facturación

Este frente cubre CU15 (pago online con pasarela, `POST /api/publico/pagos`), CU16 (webhook de la pasarela, `POST /api/webhooks/pasarela/{proveedor}`), CU17 (pago manual en caja, `POST /api/pagos/caja`) y CU18 (factura con CAE de ARCA, `GET /api/pagos/{id}/factura` y `POST /api/publico/factura`), y expone la deuda de cada cliente a sistemas externos (CU13 vista externa, 9.5 B). Su núcleo es una sola operación de aprobación, `IAprobacionPagoService` (dueño: US-F4-02), que consumen caja (US-F4-03), webhook (US-F4-05), conciliación (US-F4-06) y la rendición de Pago Fácil del Frente 3 (US-F3-07, CU21). Así el cobro se aplica igual sin importar el medio.

**Dependencias.** *Desde el Frente 1:* `Politicas.Empleado` y `Politicas.ApiKey` (claim `proveedor`) de US-F1-01, y `IVerificadorPublico` de US-F1-07 (RN20; el límite de intentos de `/api/publico/*` lo aplica F1-07 con su `GlobalLimiter`, no este frente). *Desde el Frente 3:* las transiciones de `Poliza` y `Cuota` (`Poliza.Activar()`, `Poliza.Reactivar()`, `Cuota.Pagar(fecha)`), la excepción `TransicionInvalidaException` (subclase de `ReglaDeDominioException`) y `IActualizadorEstadoPoliza` (`ReevaluarAsync`), todos de US-F3-01 (C2, C11). Mientras US-F3-01 no esté mergeada, F4-02 arranca con transiciones mínimas en su rama y con las cuotas del seed (`SeedData`, póliza `d1000000-…-000000000001`, cuotas 2..N en `Pendiente`); esas transiciones provisorias se reemplazan al rebasear sobre F3-01 y no llegan a `development`. *Hacia otros frentes:* F4 publica `IAprobacionPagoService` en la tarea 01 (contrato, firma de C12) y lo implementa en la tarea 02. **Pago Fácil (US-F3-07) usa `IAprobacionPagoService.AprobarAsync` para cada línea de rendición y no reimplementa el cobro.**

**Ubicación de la inyección.** Este frente registra sus servicios en `backend/Aseguradora.Api/Frentes/Frente4/Frente4Extensions.cs` (método `AddFrente4(this IServiceCollection services, IConfiguration config)`, C14), que llama a `AddPagosIntegrations` de Integrations. `Program.cs` recibe una sola línea: `builder.Services.AddFrente4(builder.Configuration);`. Este frente no agrega datos al seed; si una tarea necesita datos de pagos, crea un `PagosSeeder` propio que implementa `ISeeder` (idempotente, C14) e invoca desde `SeedData`.

**Tests de controladores (C16).** Los tests de controladores usan `AseguradoraWebFactory` de US-T-03 con `TestAuthHandler` bajo el esquema `Bearer`. Si US-T-03 no está mergeada, usan el factory mínimo temporal de US-F1-01, que se borra al mergear T-03.

### US-F4-01 · Publicar contratos de pasarelas, ARCA y aprobación con mocks

- **Frente:** Pagos y facturación · **Rama sugerida:** `feature/US-F4-01-contratos-integraciones-mock` · **Tamaño:** M
- **Casos de uso / Reglas:** CU15 a CU18 / RN11, RN12 · **Secciones de la spec:** 2, 6, 9.2, 9.3

**Propósito:** Publica las interfaces, DTOs y mocks que consumen las demás tareas de este frente y el Frente 3, para que todo se pruebe sin esperar a las APIs reales de los grupos. Al terminar, `IPasarelaResolver` devuelve el mock de `pasarela1` o `pasarela2` según configuración, y `IArcaService` emite facturas de prueba con formato de 9.2.

**Alcance (incluye):**
- `backend/Aseguradora.Application/External/IPasarelaService.cs`: `CrearPagoAsync(PasarelaCrearPagoRequest, CancellationToken)` y `ConsultarPagoAsync(string idPago, CancellationToken)`.
- `backend/Aseguradora.Application/External/IPasarelaResolver.cs`: `IPasarelaService Obtener(string proveedor)`. Proveedor desconocido lanza `NotFoundException`.
- `backend/Aseguradora.Application/External/IArcaService.cs`: `EmitirFacturaAsync(ArcaFacturaRequest, CancellationToken)` y `ConsultarFacturaAsync(string numeroComprobante, CancellationToken)`.
- `backend/Aseguradora.Application/Dtos/Pasarela*.cs` y `backend/Aseguradora.Application/Dtos/Arca*.cs`: records con los campos de 9.3 (pasos 1 y 2) y 9.2 (`POST /api/facturas`), camelCase.
- `backend/Aseguradora.Application/Services/IAprobacionPagoService.cs`: `Task<Pago> AprobarAsync(Pago pago, DateTime fechaAcreditacion, CancellationToken ct)` (firma exacta, C12). Recibe un `Pago` ya creado en estado pendiente con sus `PagoCuota`. Solo se declara; la implementación va en la tarea 02.
- `backend/Aseguradora.Integrations/Pasarela/PasarelaMockService.cs`: una instancia por proveedor. Devuelve `idPago` determinista (`PSR-` + referencia) y `urlPago` fija. Queda en estado `PENDIENTE`; los resultados se disparan con el webhook de prueba (9.3, paso 2).
- `backend/Aseguradora.Integrations/Pasarela/PasarelaResolver.cs`.
- `backend/Aseguradora.Integrations/Arca/ArcaMockService.cs`: idempotente por `referenciaExterna` (misma referencia, misma factura). CAE de 14 dígitos determinista. Vencimiento = fecha de emisión + 10 días (ejemplo 9.2). Neto + IVA = total.
- Opciones con DataAnnotations: `backend/Aseguradora.Integrations/Options/PasarelaOptions.cs` y `ArcaOptions.cs`, leídas de `Integraciones:Pasarelas:<proveedor>` e `Integraciones:Arca` (`UsarMock`, `BaseUrl`, `ApiKey` desde variable de entorno). Solo `UsarMock`, `BaseUrl` y `ApiKey`: los timeouts y reintentos no son de este frente (US-T-02).
- `backend/Aseguradora.Integrations/Pagos/DependencyInjection.cs` (`AddPagosIntegrations`), invocado desde `AddFrente4` (Api). No se toca el `DependencyInjection` compartido de Integrations. Si `UsarMock` es `false` y todavía no hay implementación HTTP (tarea 08), el arranque falla con un mensaje claro.

**Fuera de alcance:** la lógica de aprobación (tarea 02), los endpoints (tareas 03 a 07), los clientes HTTP reales (tarea 08), y el selector mock/real genérico, que es de US-T-02 (`AgregarIntegracion`). Si T-02 no está mergeada, esta tarea usa su propio `UsarMock` como se describe arriba. `IActualizadorEstadoPoliza` no se declara aquí: es de US-F3-01 (C11).

**Puede empezar sin esperar a:** ninguna tarea. Solo usa tipos de Domain ya existentes y no depende de los frentes 1 ni 3.

**Entrega a otros (contratos que publica):** `IPasarelaService`, `IPasarelaResolver`, `IArcaService`, los DTOs `Pasarela*` y `Arca*`, `IAprobacionPagoService` (firma de C12; lo consumen US-F3-07 para CU21 y las tareas 03, 05 y 06 de este frente).

**Criterios de aceptación:**
- [ ] `IPasarelaResolver.Obtener("pasarela1")` y `Obtener("pasarela2")` devuelven el mock de cada proveedor con `UsarMock: true`.
- [ ] `Obtener("otra")` lanza `NotFoundException`.
- [ ] `EmitirFacturaAsync` con la misma `referenciaExterna` dos veces devuelve la misma factura (mismo CAE y número).
- [ ] La factura mock cumple `importeNeto + importeIva = importeTotal` y `vencimientoCae = fecha + 10 días`.
- [ ] Con `UsarMock: false` y sin implementación HTTP, el arranque falla con mensaje claro.
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos** (xUnit, proyecto `Aseguradora.Tests`; fakes escritos a mano, sin Moq):
- `PasarelaResolverTests`: proveedor conocido devuelve mock; desconocido lanza `NotFoundException`.
- `ArcaMockServiceTests`: misma referencia → misma factura; referencias distintas → facturas distintas; vencimiento; neto + IVA = total (caso 9.2: total 51250.00 → neto 42355.37, IVA 8894.63).
- `PasarelaMockServiceTests`: `CrearPagoAsync` devuelve `idPago` y `urlPago` no vacíos; `ConsultarPagoAsync` del id creado devuelve el mismo estado.
- `PagosIntegrationsDiTests`: resolución del servicio según `UsarMock`; `UsarMock: false` sin implementación falla al construir.

**Decisiones pendientes:**
- Claves de proveedor: `pasarela1` y `pasarela2`, como en la URL de notificación de 9.3. Default aplicado.
- Simulación de resultados: sin endpoint extra. Los resultados se prueban con el webhook (tarea 05). Alternativa, solo en Development: un endpoint de simulación; requiere aprobación.

### US-F4-02 · Aprobar pagos y emitir factura con CAE (núcleo compartido)

- **Frente:** Pagos y facturación · **Rama sugerida:** `feature/US-F4-02-aprobacion-pago-factura` · **Tamaño:** L
- **Casos de uso / Reglas:** CU16, CU17, CU18 / RN07, RN09, RN12, RN16 · **Secciones de la spec:** 4, 5 (Pagos, PagoCuotas, Facturas), 6 (Unit of Work), 9.2

**Propósito:** Implementa la única operación que marca un pago como aprobado: pasa sus cuotas a `Pagada` (con las transiciones de F3-01), actualiza la póliza (RN07, RN09) y emite la factura con CAE. Si ARCA falla, el pago queda aprobado y la factura pendiente de CAE (RN12). Caja, webhook, conciliación y la rendición de Pago Fácil usan este mismo camino.

**Alcance (incluye):**
- Dominio, propio de F4: `backend/Aseguradora.Domain/Entities/Pago.cs`: `Aprobar(DateTime fechaAcreditacion)` (solo desde `Pendiente`), `Rechazar()` (solo desde `Pendiente`) y el factory `Pago.CrearPendiente(...)`, que arma el `Pago` en `Pendiente` con sus `PagoCuota` (importe = importe + recargo por cuota). Lo usan todos los originadores de cobro (C12). Ante una transición inválida lanzan `TransicionInvalidaException` (subclase de `ReglaDeDominioException`, creada en US-F3-01).
- Dominio, transiciones de F3 (no se crean aquí): `Cuota.Pagar(DateTime fecha)` de US-F3-01 (desde `Pendiente` o `Vencida`). Esta tarea no agrega métodos a `Cuota`.
- Dominio, propio de F4: `backend/Aseguradora.Domain/Entities/Factura.cs`: `Autorizar(string numero, string cae, DateOnly vencimientoCae)` y un factory `CrearPendienteCae(...)`.
- Data: `backend/Aseguradora.Data/Configurations/PagoConfiguration.cs` y `CuotaConfiguration.cs`: columna `RowVersion` (`byte[]`, `IsRowVersion()`) para control de concurrencia.
- **Regla de migración (C6):** la migración de `RowVersion` se genera solo después de rebasear sobre `development`. Nadie edita una migración ajena. Si el `ModelSnapshot` choca en un merge, se borra la migración propia y se regenera.
- Application: `backend/Aseguradora.Application/Services/AprobacionPagoService.cs` (implementa `IAprobacionPagoService`, firma de C12: `Task<Pago> AprobarAsync(Pago pago, DateTime fechaAcreditacion, CancellationToken ct)`). Recibe el `Pago` ya creado en pendiente con sus `PagoCuota`; no lo busca por id. Si ya está `Aprobado`, no hace nada (idempotente). Llama a `Cuota.Pagar` de F3-01 por cada cuota del pago, aprueba el pago y guarda (`IUnitOfWork`). Después llama a `IActualizadorEstadoPoliza.ReevaluarAsync` (US-F3-01) con el id de la póliza de las cuotas y a `IFacturacionService.EmitirAsync`.
- Application: `backend/Aseguradora.Application/Services/FacturacionService.cs` (`IFacturacionService.EmitirAsync(Guid pagoId)`). Arma `ArcaFacturaRequest` según 9.2: tipo `B`, concepto `SERVICIOS`, receptor DNI del cliente con `CONSUMIDOR_FINAL`, items `Póliza {numero} - Cuota {n} de {N}` con `precioUnitario` = importe + recargo, `referenciaExterna` = `Pago.Numero`. Calcula neto = total / 1,21 redondeado a 2 decimales e IVA = total − neto. Si ARCA responde `APROBADA`, guarda CAE y vencimiento y pasa a `Autorizada`. Si lanza `ExternalServiceException`, guarda la factura en `PendienteCae` y no revierte el pago.
- Application: `Pago.ImporteTotal` = suma de `PagoCuota.Importe`.
- Configuración de facturación: `Facturacion:Cuit`, `Facturacion:PuntoVenta` (sin valores en código).

**Fuera de alcance:** endpoints de pagos (tareas 03 a 06), reintentos de facturas pendientes (tarea 09), clientes HTTP reales (tarea 08), y la creación de `TransicionInvalidaException` y de las transiciones de `Poliza` y `Cuota` (US-F3-01).

**Puede empezar sin esperar a:** tarea 01 (contratos y mock ARCA). Mientras US-F3-01 no esté mergeada: (a) las cuotas salen del seed (póliza `d1000000-…-000000000001`); (b) la rama agrega provisoriamente `Cuota.Pagar` y `Poliza.Activar`/`Reactivar` mínimos, que se borran al rebasear sobre F3-01; (c) `IActualizadorEstadoPoliza` se reemplaza por un fake en los tests.

**Entrega a otros (contratos que publica):** `IAprobacionPagoService.AprobarAsync(Pago pago, DateTime fechaAcreditacion, CancellationToken ct)`, que devuelve el `Pago` aprobado. Quien origina el cobro crea el `Pago` pendiente con `Pago.CrearPendiente` y llama a este método: caja (US-F4-03), webhook (US-F4-05), conciliación (US-F4-06, vía `AplicarResultadoAsync`) y la rendición de Pago Fácil (US-F3-07). La pasarela online (US-F4-04) solo crea el pago pendiente; el aviso aprobado llega por US-F4-05 o US-F4-06, que es donde se llama a `AprobarAsync`. `IFacturacionService.EmitirAsync` lo usa la tarea 09.

**Criterios de aceptación:**
- [ ] Aprobar un pago marca todas sus cuotas `Pagada` con `FechaPago` en UTC y deja el pago `Aprobado` con `FechaAcreditacion` (RN12, RN16).
- [ ] Aprobar dos veces el mismo pago no cambia cuotas, no crea otra factura y no vuelve a llamar a ARCA (RN12).
- [ ] Tras la aprobación, la factura queda `Autorizada` con CAE, `VencimientoCae` y `Numero` (`0001-…`), y su `Importe` coincide con `ImporteTotal`.
- [ ] Si ARCA falla con `ExternalServiceException`, el pago queda `Aprobado` y la factura en `PendienteCae` sin CAE (RN12).
- [ ] Se invoca `IActualizadorEstadoPoliza.ReevaluarAsync` con el id de la póliza de las cuotas aprobadas.
- [ ] Dos aprobaciones concurrentes sobre la misma cuota: una gana y la otra falla con `BusinessRuleException`; la cuota no se cobra dos veces.
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos** (xUnit, base `SqliteDbFixture`):
- `PagoTests`: `Aprobar` solo desde `Pendiente`; `Rechazar` solo desde `Pendiente`; transición inválida lanza `TransicionInvalidaException`.
- `AprobacionPagoServiceTests`: aprobación marca cuotas (vía `Cuota.Pagar`); idempotencia; orden de llamadas (cuotas → póliza → factura).
- `FacturacionServiceTests`: ARCA OK → `Autorizada`; ARCA `ExternalServiceException` → `PendienteCae` sin CAE y pago `Aprobado`; caso 9.2 (51250.00 → neto 42355.37, IVA 8894.63); `referenciaExterna` = `Pago.Numero`.
- `ConcurrenciaCuotaTests`: dos contextos sobre la misma cuota con `RowVersion`. Si SQLite no soporta `RowVersion`, se marca `Skip` con motivo y se cubre en integración con SQL Server.

**Decisiones pendientes:**
- **Pago duplicado (sección 10, C8).** Default: `RowVersion` en `Cuota` y `Pago`. Si llega un pago aprobado sobre una cuota que ya está `Pagada` por otro medio, el pago queda `Aprobado` sin modificar cuotas, no se factura, y se registra un error de log `PAGO_DUPLICADO_REQUIERE_REVISION`. La devolución es manual y queda fuera de alcance.
- **IVA 21 %.** No está escrito en la spec; se deduce del ejemplo de 9.2 (51250.00 = 42355.37 + 8894.63). Default: 21 %. Confirmar con el equipo.
- **Número de factura antes del CAE.** Default: `Numero` queda vacío (`""`) mientras está `PendienteCae`, y se completa con `numeroComprobante` de ARCA al autorizar.

### US-F4-03 · Registrar pago en caja y consultar pagos y facturas

- **Frente:** Pagos y facturación · **Rama sugerida:** `feature/US-F4-03-caja-consultas-pagos` · **Tamaño:** M
- **Casos de uso / Reglas:** CU17, CU18 (consulta y factura pública), CU02 (factura pública con DNI) / RN11, RN12, RN17, RN20 · **Secciones de la spec:** 4, 7 (PagosController y PublicoController: `/factura`)

**Propósito:** Un empleado cobra en caja las cuotas elegidas (aprobado al instante, con factura). Se pueden consultar el estado de un pago y su factura, y el cliente puede pedir su factura con DNI y número de pago.

**Alcance (incluye):**
- `backend/Aseguradora.Application/Dtos/PagoCajaRequest.cs` (`IReadOnlyList<Guid> CuotaIds`), `PagoResponse.cs`, `FacturaResponse.cs`, `PublicoFacturaRequest.cs` (`Dni`, `NumeroPago`), con DataAnnotations.
- `backend/Aseguradora.Application/Services/PagoService.cs`: `RegistrarCajaAsync`, `ObtenerPagoAsync`, `ObtenerFacturaAsync` y `ObtenerFacturaPublicaAsync`.
  - Caja: exige al menos una cuota, sin repetidos, todas del mismo cliente, sin `Anulada` ni `Pagada`. Crea el `Pago` pendiente con `Pago.CrearPendiente` (F4-02) con `Medio = Caja` y `Numero` `PAG-` + 6 hex, y luego llama a `IAprobacionPagoService.AprobarAsync(pago, fechaAcreditacion, ct)` (C12).
  - Factura pública: llama a `IVerificadorPublico.VerificarPagoAsync(dni, numeroPago)` de US-F1-07; no reimplementa la validación. Si el DNI o el número no coinciden, responde "no encontrado" sin decir cuál falla (RN20).
- `backend/Aseguradora.Api/Controllers/PagosController.cs` (`[Route("api/pagos")]`):
  - `POST /api/pagos/caja` → `[Authorize(Policy = Politicas.Empleado)]`.
  - `GET /api/pagos/{id}` → `Politicas.Empleado`.
  - `GET /api/pagos/{id}/factura` → `Politicas.Empleado`.
- `backend/Aseguradora.Api/Controllers/PublicoPagosController.cs` (`[Route("api/publico")]`): crea el controller con `POST /api/publico/factura` (público, sin atributo de autorización y sin `[EnableRateLimiting]`: RN20 lo aplica el `GlobalLimiter` de US-F1-07 a todo `/api/publico/*`, C15). La tarea 04 agrega `POST /api/publico/pagos` en este mismo controller.

**Fuera de alcance:** pagos online (tarea 04), webhook (tarea 05), conciliación (tarea 06). El control de intentos por IP de `/api/publico/*` es de US-F1-07.

**Puede empezar sin esperar a:** tarea 02 (`IAprobacionPagoService`), que es dependencia del mismo frente. `IVerificadorPublico` se reemplaza por un fake en tests hasta que F1-07 esté mergeada. Las políticas de F1-01 (`Politicas.Empleado`) se usan por nombre; en tests se usa el `TestAuthHandler` de `AseguradoraWebFactory` (US-T-03, C16).

**Entrega a otros (contratos que publica):** `PagoResponse` (estado, medio, importe, numero, factura) y los endpoints `POST /api/pagos/caja`, `GET /api/pagos/{id}`, `GET /api/pagos/{id}/factura`, `POST /api/publico/factura`.

**Criterios de aceptación:**
- [ ] `POST /api/pagos/caja` con cuotas pendientes de un mismo cliente devuelve 201 con pago `Aprobado`, `medio: CAJA`, cuotas `Pagada` y factura (RN11, RN12).
- [ ] Cuota `Anulada` o `Pagada`, lista vacía, cuotas repetidas o de dos clientes distintos → 400 con motivo.
- [ ] Cuota inexistente → 404.
- [ ] `GET /api/pagos/{id}` devuelve el estado; id inexistente → 404.
- [ ] `GET /api/pagos/{id}/factura` devuelve número, CAE y vencimiento cuando la factura está `Autorizada`.
- [ ] `POST /api/publico/factura` con DNI y número de pago correctos devuelve la factura; con DNI o número incorrectos devuelve 404 con el mismo mensaje (RN20).
- [ ] Sin JWT, `/api/pagos/*` responde 401; sin JWT de empleado, 403.
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos:**
- `PagoServiceCajaTests`: pago único; varias cuotas; cuota anulada; cuota pagada; cuotas de dos clientes; lista vacía; cuotas repetidas; numeración `PAG-` con 6 hex.
- `PagoServiceFacturaPublicaTests`: DNI correcto + número correcto; DNI incorrecto; número incorrecto; ambos mensajes iguales (con fake de `IVerificadorPublico`).
- `PagosControllerTests` (`AseguradoraWebFactory` de US-T-03, C16, con `TestAuthHandler`): 201 en caja; 400 con regla; 404 en GET; 401 sin token; 403 con rol no válido.

**Decisiones pendientes:**
- `GET /api/pagos/{id}/factura` cuando la factura está `PendienteCae`. Default: 200 con `estado: PENDIENTE_CAE` y `cae: null`. Alternativa: 409.
- Caja con cuotas de varias pólizas del mismo cliente. Default: se permite. La spec no lo dice (RN11 habla de "las cuotas impagas que quiera").
- El estado del pago en la respuesta de caja es siempre `APROBADO` (default), porque el cobro es inmediato.

### US-F4-04 · Iniciar pago online con la pasarela elegida

- **Frente:** Pagos y facturación · **Rama sugerida:** `feature/US-F4-04-pago-online-pasarela` · **Tamaño:** M
- **Casos de uso / Reglas:** CU15 / RN11, RN16, RN20 · **Secciones de la spec:** 2 (flujo de pago con pasarela), 7 (`POST /api/publico/pagos`), 9.3 (paso 1), 11.4

**Propósito:** El cliente de la web elige sus cuotas y la pasarela; el sistema crea un `Pago` pendiente y devuelve el link de pago. Usa la pasarela mock de la tarea 01 o la real de la tarea 08 sin cambiar nada de este caso de uso.

**Alcance (incluye):**
- `backend/Aseguradora.Application/Dtos/PagoPublicoRequest.cs` (`Dni`, `NumeroPoliza`, `CuotaIds`, `Proveedor`, con DataAnnotations) y `PagoPublicoResponse.cs` (`NumeroPago`, `IdPago`, `UrlPago`, `FechaExpiracion`).
- `backend/Aseguradora.Application/Services/PagoService.cs`: `IniciarPagoOnlineAsync`.
  - Valida DNI + número de póliza con `IVerificadorPublico.VerificarPolizaAsync(dni, numeroPoliza)` de US-F1-07 (RN20). Si no coinciden, responde "no encontrada" sin distinguir cuál falla.
  - Valida que las cuotas pertenezcan a esa póliza, estén en `Pendiente` o `Vencida`, y que no tengan un pago pendiente en curso (ver Decisiones pendientes). Si alguna falla → 400.
  - En una sola transacción (`IUnitOfWork`), crea el `Pago` pendiente con `Pago.CrearPendiente` (F4-02; `Medio = Pasarela`, `Proveedor`, `Numero`, `FechaCreacion` UTC) y su `PagoCuota` por cuota con importe + recargo. `ImporteTotal` es la suma.
  - Llama a `IPasarelaResolver.Obtener(proveedor).CrearPagoAsync` con `referenciaExterna = Pago.Numero`, pagador (nombre, DNI, email del cliente), URLs de retorno y `urlNotificacion` = `Pagos:UrlBaseApi` + `/api/webhooks/pasarela/{proveedor}`.
  - Si la pasarela responde, guarda `IdExterno` y `LinkPago`. Si falla (`ExternalServiceException`), el pago queda `Rechazado` y las cuotas no cambian.
- `backend/Aseguradora.Api/Controllers/PublicoPagosController.cs`: agrega `POST /api/publico/pagos` (público, sin `[EnableRateLimiting]`, C15). Responde 201 con `PagoPublicoResponse`.
- Configuración: `Pagos:UrlBaseApi`, `Pagos:ReservaMinutos` (ver Decisiones pendientes).

**Fuera de alcance:** webhook (tarea 05), conciliación (tarea 06), clientes HTTP reales (tarea 08), límite de intentos por IP (US-F1-07). La aprobación del pago no se hace aquí: la llama el webhook o la conciliación (C12).

**Puede empezar sin esperar a:** tarea 01 (`IPasarelaResolver` con mock). Frente 3: usa cuotas del seed (`SeedData`) o cuotas de prueba cargadas en el test. Frente 1: `IVerificadorPublico` se reemplaza por un fake en los tests.

**Entrega a otros (contratos que publica):** `POST /api/publico/pagos` (contrato de la web pública, 7). `PagoPublicoResponse` con `numeroPago`, que el cliente usa para pedir su factura en `POST /api/publico/factura` (tarea 03).

**Criterios de aceptación:**
- [ ] Con cuotas válidas de la póliza devuelve 201 con `numeroPago` `PAG-xxxxxx`, `urlPago` y `idPago`; el pago queda `Pendiente` con `IdExterno` guardado.
- [ ] `importe` del pago = suma de (importe + recargo) de las cuotas (caso 9.3: 51250.00).
- [ ] Cuota de otra póliza, `Anulada` o `Pagada` → 400.
- [ ] DNI y póliza que no coinciden → 404 con el mensaje genérico de RN20.
- [ ] Proveedor distinto de `pasarela1`/`pasarela2` → 400.
- [ ] Si la pasarela falla → 502, pago `Rechazado`, cuotas sin cambios.
- [ ] `urlNotificacion` enviada a la pasarela termina en `/api/webhooks/pasarela/{proveedor}`.
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos:**
- `PagoOnlineServiceTests`: camino feliz; cuotas de otra póliza; `Anulada`; `Pagada`; cuota con pago en curso; proveedor desconocido; pasarela falla (pago `Rechazado`); importe = suma; `urlNotificacion` correcta.
- `PublicoPagosControllerTests` (`AseguradoraWebFactory` de US-T-03, C16): 201 con cuerpo esperado; 404 genérico con DNI/póliza incorrectos; 400 por validación de Data Annotations.

**Decisiones pendientes:**
- **Pago duplicado (sección 10, C8).** Default: no se puede iniciar un pago si la cuota ya tiene un `Pago` `Pendiente` creado dentro de `Pagos:ReservaMinutos` (default 60). Pasado ese plazo, la cuota vuelve a poder pagarse. Si luego llega un aprobado tardío sobre una cuota ya `Pagada`, aplica la regla de la tarea 02.
- **Cuotas de varias pólizas en un pago online.** La web pública se limita a una póliza (RN20). Default: una póliza por pago online; la pasarela no recibe cuotas de otra póliza.
- **URL base de notificaciones.** Depende del dominio y del túnel de Cloudflare (sección 10, pendiente). Default: `Pagos:UrlBaseApi` en configuración; no hay valor fijo en código.

### US-F4-05 · Recibir el webhook de la pasarela de forma idempotente

- **Frente:** Pagos y facturación · **Rama sugerida:** `feature/US-F4-05-webhook-pasarela` · **Tamaño:** L
- **Casos de uso / Reglas:** CU16 / RN12, RN16, RN17 · **Secciones de la spec:** 2 (flujo de pago, paso 4), 9.3 (paso 2), 9.5 B (webhook con `idCuotas`), 10 (confianza en el webhook), 11.5

**Propósito:** La pasarela avisa el resultado del cobro. El sistema aplica el resultado una sola vez por `idPago`, valida que la API key pertenezca a la pasarela de la ruta y, si el aviso viene sin `referenciaExterna` (9.5 B), crea el pago a partir de `idCuotas`.

**Alcance (incluye):**
- `backend/Aseguradora.Application/Dtos/PasarelaWebhookRequest.cs`: `IdPago`, `ReferenciaExterna?`, `Estado` (`APROBADO`/`RECHAZADO`/`CANCELADO`), `Importe`, `Fecha`, `MedioPago?`, `IdCuotas?` (lista).
- `backend/Aseguradora.Application/Services/WebhookPagoService.cs`: `ProcesarAsync(string proveedor, PasarelaWebhookRequest)`, `AplicarResultadoAsync(Pago, string estadoExterno, decimal importeExterno)` (reutilizable por la tarea 06).
  - Busca el pago por `IdExterno` + `Proveedor`. Si ya está `Aprobado` o `Rechazado`, responde recibido sin cambios (RN12).
  - Si no existe y viene `idCuotas` sin `referenciaExterna` (9.5 B), crea el pago pendiente con `Pago.CrearPendiente` con esas cuotas (cuotas `Pendiente`/`Vencida`) y `IdExterno` = `idPago`.
  - Valida que `importe` = `ImporteTotal`. Si no coincide, no aprueba y registra `PAGO_IMPORTE_NO_COINCIDE`.
  - `APROBADO` → `IAprobacionPagoService.AprobarAsync(pago, fechaAcreditacion, ct)` con el `Pago` pendiente (C12). `RECHAZADO` o `CANCELADO` → `Pago.Rechazar()`.
- `backend/Aseguradora.Api/Controllers/WebhooksController.cs` (`[Route("api/webhooks")]`): `POST /api/webhooks/pasarela/{proveedor}`, con `[Authorize(Policy = Politicas.ApiKey)]`. Además, el claim `proveedor` del principal debe ser igual a `{proveedor}`; si no coincide, 401. Responde 200 con `{ "recibido": true }`.
- Confirmación opcional: si `Integraciones:Pasarelas:<proveedor>:ConfirmarWebhook` es `true`, consulta `ConsultarPagoAsync` y compara estado e importe antes de aplicar.

**Fuera de alcance:** conciliación manual (tarea 06), clientes HTTP reales (tarea 08), la validación de API key en sí (US-F1-01).

**Puede empezar sin esperar a:** tarea 02 (aprobación) y tarea 01 (mock de pasarela). Frente 1: se usa el `TestAuthHandler` de `AseguradoraWebFactory` (US-T-03, C16) que pone el claim `proveedor`.

**Entrega a otros (contratos que publica):** `WebhookPagoService.AplicarResultadoAsync` (la usa la tarea 06). Endpoint `POST /api/webhooks/pasarela/{proveedor}` con el contrato de 9.3.

**Criterios de aceptación:**
- [ ] `APROBADO` sobre pago `Pendiente` → 200 `{ "recibido": true }`; pago `Aprobado`, cuotas `Pagada`, factura emitida (RN12).
- [ ] El mismo `idPago` dos veces → la segunda responde 200 sin cambios y sin factura nueva (RN12).
- [ ] `RECHAZADO` o `CANCELADO` → pago `Rechazado`; cuotas sin cambios.
- [ ] Sin `referenciaExterna` y con `idCuotas` (9.5 B) → crea el pago y lo aprueba si el importe coincide con la suma de (importe + recargo).
- [ ] Importe distinto → no aprueba, no cambia cuotas, responde 200 y registra el error.
- [ ] API key de otro proveedor (claim `proveedor` distinto de `{proveedor}`) → 401.
- [ ] Sin API key → 401 (política `ApiKey`).
- [ ] Proveedor desconocido → 404.
- [ ] `idPago` desconocido sin `referenciaExterna` ni `idCuotas` → 404.
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos:**
- `WebhookPagoServiceTests`: aprobado; rechazado; cancelado (mapea a `Rechazado`); duplicado; importe no coincide; 9.5 B crea pago; `idCuotas` con cuota no payable → 400.
- `WebhooksControllerTests` (`AseguradoraWebFactory` de US-T-03, C16): 200 y body `{recibido: true}`; 401 con API key de otro proveedor; 401 sin API key; 404 con proveedor desconocido.
- `WebhookConcurrenciaTests`: dos webhooks simultáneos con el mismo `idPago` → una sola aprobación y una sola factura.

**Decisiones pendientes:**
- **Confianza en el webhook (sección 10).** Default: (a) la API key se valida contra el `{proveedor}` de la ruta mediante el claim `proveedor` (resuelto por US-F1-01; requiere que la clave del grupo se llame `pasarela1` o `pasarela2` en `ApiKeys`); responde 401 si no coincide; (b) el importe debe coincidir con `ImporteTotal`, si no, no se aprueba; (c) la consulta de confirmación `GET` a la pasarela queda activada por configuración, en `true` por defecto fuera de tests.
- **Importe distinto.** Default: 200 sin aprobar y log de error para revisión manual. Alternativa: 400, pero la pasarela reintentaría indefinidamente.
- **Pago desconocido.** Default: 404, para que la pasarela vea que no existe.

### US-F4-06 · Conciliar pagos con la pasarela cuando no llegó el webhook

- **Frente:** Pagos y facturación · **Rama sugerida:** `feature/US-F4-06-conciliacion-pagos` · **Tamaño:** S
- **Casos de uso / Reglas:** CU16 (apoyo) / RN12 · **Secciones de la spec:** 2 (flujo de pago, paso 6), 7 (`POST /api/pagos/{id}/conciliar`), 9.3 (paso 3)

**Propósito:** Un empleado pide que el sistema consulte a la pasarela el estado de un pago cuyo aviso nunca llegó, y lo aplica con la misma regla del webhook.

**Alcance (incluye):**
- `backend/Aseguradora.Api/Controllers/PagosController.cs`: `POST /api/pagos/{id}/conciliar` con `[Authorize(Policy = Politicas.Empleado)]`.
- `backend/Aseguradora.Application/Services/PagoService.cs`: `ConciliarAsync(Guid pagoId)`.
  - Si el pago es `Medio = Pasarela` y está `Pendiente`, consulta `ConsultarPagoAsync(IdExterno)` y llama a `WebhookPagoService.AplicarResultadoAsync`.
  - Si ya está `Aprobado` o `Rechazado`, devuelve el estado sin cambios.
  - Si `Medio` no es `Pasarela`, responde 400.

**Fuera de alcance:** el webhook en sí (tarea 05); la consulta a la pasarela real (tarea 08).

**Puede empezar sin esperar a:** tarea 05 (`AplicarResultadoAsync`), dependencia del mismo frente. Para tests se usa el mock de la tarea 01.

**Entrega a otros (contratos que publica):** `POST /api/pagos/{id}/conciliar`, con el mismo `PagoResponse` de la tarea 03.

**Criterios de aceptación:**
- [ ] Pago `Pendiente` cuya pasarela ya lo aprobó → 200, pago `Aprobado`, cuotas `Pagada`, factura emitida.
- [ ] Pago `Pendiente` aún no cobrado en la pasarela → 200, sigue `Pendiente`.
- [ ] Pago `Aprobado` o `Rechazado` → 200 sin consultar a la pasarela.
- [ ] Pago `Medio = Caja` → 400.
- [ ] Pago inexistente → 404.
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos:**
- `ConciliarPagoTests`: aprobado en pasarela; pendiente en pasarela; ya aprobado (sin llamada a la pasarela, verificada con fake); caja → 400; inexistente → 404.

**Decisiones pendientes:**
- Ninguna. Se reutiliza la regla de la tarea 05.

### US-F4-07 · Deuda de cliente para sistemas externos

- **Frente:** Pagos y facturación · **Rama sugerida:** `feature/US-F4-07-deuda-externa` · **Tamaño:** S
- **Casos de uso / Reglas:** CU13 (vista de sistema externo) / RN08, RN16, RN17 · **Secciones de la spec:** 7 (`ExternoController`, deuda), 9.5 B

**Propósito:** Pasarelas y otros grupos consultan por DNI cuánto debe un cliente, con cuotas `PENDIENTE` o `VENCIDA` y su recargo. Así pueden ofrecer el pago desde su sitio.

**Alcance (incluye):**
- `backend/Aseguradora.Application/Services/DeudaExternaService.cs`: `ObtenerDeudaAsync(string dni)`. Devuelve todas las cuotas `Pendiente` y `Vencida` de las pólizas del cliente. `total = importe + recargo` por cuota; `totalAdeudado` = suma (dos decimales).
- `backend/Aseguradora.Application/Dtos/DeudaExternaResponse.cs`: `dni`, `cliente`, `totalAdeudado`, `polizas[]` (`numeroPoliza`, `patente`, `cuotas[]`), con `idCuota`, `numero`, `importe`, `recargo`, `total`, `vencimiento`, `estado`.
- `backend/Aseguradora.Api/Controllers/DeudaExternaController.cs` (`[Route("api/externo/clientes")]`): `GET /api/externo/clientes/{dni}/deuda`, con `[Authorize(Policy = Politicas.ApiKey)]` (API key `X-Api-Key`). Cada frente tiene su propio controller bajo `/api/externo` (C7); no comparte el `ExternoController` del Frente 3 (`/api/externo/vehiculos/...`).

**Fuera de alcance:** la consulta de deuda para empleados (CU13, Frente 3); cálculo de recargos (Frente 3, `VencimientosJob`); el resto de `/api/externo` (Frente 3).

**Puede empezar sin esperar a:** seed existente (cliente de la póliza `d1000000-…`), y tests con datos cargados a mano. No depende de otras tareas de este frente.

**Entrega a otros (contratos que publica):** `GET /api/externo/clientes/{dni}/deuda` con el JSON de 9.5 B. La pasarela lo usa para ofrecer el pago desde su sitio.

**Criterios de aceptación:**
- [ ] Cliente con cuotas `PENDIENTE` y `VENCIDA` → 200 con `totalAdeudado` = suma y `polizas` agrupadas por póliza.
- [ ] Cliente sin deuda → 200, `totalAdeudado: 0.00`, `polizas: []`.
- [ ] Cuotas `PAGADA` o `ANULADA` no aparecen.
- [ ] DNI inexistente → 404 con `codigo: "CLIENTE_NO_ENCONTRADO"`.
- [ ] Sin API key o con una incorrecta → 401.
- [ ] Campos en camelCase y `estado` en mayúsculas (9.5 B).
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos:**
- `DeudaExternaServiceTests`: mezcla de estados; cliente sin deuda; cliente inexistente; recargo sumado al total; cuotas anuladas excluidas.
- `DeudaExternaControllerTests` (`AseguradoraWebFactory` de US-T-03, C16): 200 con contrato 9.5 B; 404 con código; 401 sin API key.

**Decisiones pendientes:**
- **Estado de cuotas vencidas.** Default: se muestra el estado almacenado. Si `VencimientosJob` (Frente 3) no corrió todavía, una cuota vencida puede verse como `PENDIENTE` con recargo 0. Alternativa: calcular `VENCIDA` al consultar. Requiere aprobación.
- **Pólizas incluidas.** Default: todas las pólizas del cliente con cuotas impagas. Las canceladas no aparecen porque sus cuotas quedan `ANULADA` (RN13).

### US-F4-08 · Clientes HTTP reales de pasarelas y ARCA (contratos 9.2 y 9.3 reales, auth y mapeo de errores)

- **Frente:** Pagos y facturación · **Rama sugerida:** `feature/US-F4-08-clientes-http-pasarela-arca` · **Tamaño:** M
- **Casos de uso / Reglas:** CU15, CU16, CU18 / RN12 · **Secciones de la spec:** 2 (estado de integraciones), 5 (API keys en variables de entorno), 9.2, 9.3, 11.2

**Propósito:** Implementa las versiones reales de `IPasarelaService` (una config por proveedor) e `IArcaService`, activables con `UsarMock: false`. Cumple el contrato de 9.2 y 9.3 sin cambiar la lógica de negocio. Timeouts, reintentos y circuito los define US-T-02; esta tarea solo decide qué llamada es idempotente.

**Alcance (incluye):**
- `backend/Aseguradora.Integrations/Pasarela/PasarelaHttpService.cs`: `CrearPagoAsync` (`POST /api/pagos`), `ConsultarPagoAsync` (`GET /api/pagos/{idPago}`). Envía `X-Api-Key` desde variable de entorno (`Integraciones__Pasarelas__{proveedor}__ApiKey`) y mapea errores a `ExternalServiceException`.
- `backend/Aseguradora.Integrations/Arca/ArcaHttpService.cs`: `EmitirFacturaAsync` (`POST /api/facturas`) y `ConsultarFacturaAsync` (`GET /api/facturas/{numeroComprobante}`). Mapea `201` con CAE y `APROBADA` a `ArcaFacturaResponse`. `X-Api-Key` desde `Integraciones__Arca__ApiKey`.
- Cliente HTTP: usa `AgregarClienteResiliente` de US-T-02 para las pasarelas (sección `Integraciones:Pasarelas:<proveedor>`), `AgregarIntegracion` para ARCA (`Integraciones:Arca`) y `ClienteHttpBase.EnviarAsync(..., esIdempotente)`, con sus defaults (C13). **Esta tarea no define timeouts ni reintentos propios.** Si T-02 no está mergeada, usa los mismos defaults de T-02, sin números propios, marcados para borrar al mergear T-02.
- Idempotencia por llamada (decisión de F4, no de T-02): `EmitirFacturaAsync` se marca `esIdempotente: true` (ARCA es idempotente por `referenciaExterna`); `CrearPagoAsync` se marca `esIdempotente: false` (crear dos cobros sería un error).
- Mapeo de errores de F4: 401 del otro grupo → `ExternalServiceException` (error de integración, no del cliente). Los 4xx de negocio que T-02 devuelve tipados se mapean aquí al contrato propio.
- `UsarMock: false` activa las implementaciones HTTP en `AddPagosIntegrations`.
- No se agrega ningún paquete NuGet nuevo.

**Fuera de alcance:** timeouts, reintentos y circuito (US-T-02); cambios en la lógica de los casos de uso; webhook (tarea 05); reintentos de facturas pendientes (tarea 09).

**Puede empezar sin esperar a:** tarea 01 (interfaces y DTOs). Las pruebas usan un `HttpMessageHandler` falso con las respuestas de 9.2 y 9.3. No necesita que los grupos tengan su API lista.

**Entrega a otros (contratos que publica):** ninguno; implementa contratos ya publicados.

**Criterios de aceptación:**
- [ ] El cuerpo serializado coincide con los JSON de 9.2 y 9.3 (test de contrato).
- [ ] `POST /api/facturas` se envía con `esIdempotente: true`; `POST /api/pagos` de la pasarela con `esIdempotente: false` (verificado con spy sobre el helper).
- [ ] 401 de cualquiera de los dos → `ExternalServiceException`.
- [ ] La API key sale de variable de entorno; no hay valores en `appsettings.json`.
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos:**
- `PasarelaHttpServiceTests`: contrato de `CrearPagoAsync` (cuerpo y `X-Api-Key`); respuesta 201; 401 → `ExternalServiceException`; `ConsultarPagoAsync` 200; `CrearPagoAsync` marcado no idempotente.
- `ArcaHttpServiceTests`: contrato de `POST /api/facturas`; `ConsultarFacturaAsync` 200; 404 en `GET` → `ExternalServiceException`; `EmitirFacturaAsync` marcado idempotente.
- Los tests de timeout y reintento viven en US-T-02, no aquí.

**Decisiones pendientes:**
- **`urlPdf` de ARCA.** Default: no se guarda (la factura no tiene columna). El PDF lo arma la API si hace falta (9.2, opcional).

### US-F4-09 · Reintentar facturas pendientes de CAE

- **Frente:** Pagos y facturación · **Rama sugerida:** `feature/US-F4-09-reintento-cae-facturas` · **Tamaño:** S
- **Casos de uso / Reglas:** CU18 / RN12 · **Secciones de la spec:** 4 (RN12), 5 (Facturas), 10 (facturas pendientes de CAE), 11.2 (una réplica), 11.3 (tarea repetible)

**Propósito:** Cierra el hueco de la sección 10: RN12 dice que las facturas `PendienteCae` se reintentan y ningún caso de uso lo hace. Este job las reintenta periódicamente hasta que ARCA autoriza.

**Alcance (incluye):**
- `backend/Aseguradora.Application/Services/FacturacionService.cs`: `ReintentarPendientesAsync(CancellationToken)` (factura `PendienteCae` → `EmitirAsync` del pago; omite `Autorizada`).
- `backend/Aseguradora.Api/BackgroundJobs/ReintentoFacturasJob.cs`: `BackgroundService` con intervalo `Facturacion:IntervaloReintentoMinutos`. Registrado desde `AddFrente4` (Api), no en `Program.cs`.
- Logs con contexto (id de factura, número de pago) y errores que no detienen el bucle.

**Fuera de alcance:** la emisión inicial (tarea 02); la consulta de facturas ya emitidas (tarea 03); cambios en `VencimientosJob` (Frente 3).

**Puede empezar sin esperar a:** tarea 02 (crea facturas `PendienteCae`) y tarea 01 (`ArcaMockService` con falla simulada en test).

**Entrega a otros (contratos que publica):** ninguno.

**Criterios de aceptación:**
- [ ] Una factura `PendienteCae` con ARCA disponible pasa a `Autorizada` con CAE en la siguiente corrida.
- [ ] Con ARCA caído, la factura sigue `PendienteCae`, sin excepción que detenga el job.
- [ ] Las facturas `Autorizada` no se vuelven a enviar a ARCA.
- [ ] Reiniciar el job en medio de una corrida no duplica facturas (ARCA idempotente por `referenciaExterna`).
- [ ] El intervalo sale de configuración.
- [ ] `dotnet build` sin errores y `dotnet test` en verde.

**Tests requeridos:**
- `FacturacionReintentosTests`: ARCA falla y luego responde → `Autorizada`; `Autorizada` se omite (verificado con fake); ARCA sigue caído → sigue `PendienteCae` sin excepción; dos corridas seguidas → una sola factura.
- `ReintentoFacturasJobTests`: el job llama a `ReintentarPendientesAsync` y continúa tras una excepción.

**Decisiones pendientes:**
- **Límite de intentos (sección 10).** Default: sin límite; el job sigue reintentando cada `IntervaloReintentoMinutos` (default 15). Alternativa: un máximo de N intentos con alerta; requiere aprobación.
- **Réplica única.** Default: el job es seguro para una sola réplica, como indica 11.2. Si se escala, requiere un lock en base de datos.

## Trazabilidad CU / RN / endpoint -> ID de tarea

**Casos de uso**

| CU | Tareas |
| --- | --- |
| CU13 (deuda, vista de sistema externo) | US-F4-07. La vista de empleado es del Frente 3 |
| CU15 (pago online con pasarela: `POST /api/publico/pagos`) | US-F4-01 (mock), US-F4-04, US-F4-08 (HTTP real) |
| CU16 (webhook de pasarela: `POST /api/webhooks/pasarela/{proveedor}`) | US-F4-02, US-F4-05, US-F4-06 |
| CU17 (pago manual en caja: `POST /api/pagos/caja`) | US-F4-02, US-F4-03 |
| CU18 (factura con CAE de ARCA: `GET /api/pagos/{id}/factura`, `POST /api/publico/factura`) | US-F4-01, US-F4-02, US-F4-03, US-F4-08, US-F4-09 |

**Reglas**

| Regla | Tareas |
| --- | --- |
| RN08 (recargo en deuda) | US-F4-07 |
| RN11 (pagar una, varias o todas) | US-F4-02, US-F4-03, US-F4-04 |
| RN12 (aprobación, idempotencia, CAE pendiente) | US-F4-02, US-F4-03, US-F4-05, US-F4-06, US-F4-09 |
| RN16 (importes decimal, UTC) | US-F4-02, US-F4-04, US-F4-07 |
| RN17 (roles y API key) | US-F4-03, US-F4-05, US-F4-07 |
| RN20 (DNI y póliza, límite de intentos) | US-F4-03 (factura pública), US-F4-04 (pagos públicos). El límite lo aplica US-F1-07 a todo `/api/publico/*` con su `GlobalLimiter` (C15) |

**Endpoints de la sección 7 (entrantes)**

| Método y ruta | Tarea |
| --- | --- |
| `POST /api/pagos/caja` | US-F4-03 |
| `GET /api/pagos/{id}` | US-F4-03 |
| `GET /api/pagos/{id}/factura` | US-F4-03 |
| `POST /api/pagos/{id}/conciliar` | US-F4-06 |
| `POST /api/webhooks/pasarela/{proveedor}` | US-F4-05 |
| `POST /api/publico/pagos` | US-F4-04 |
| `POST /api/publico/factura` | US-F4-03 |
| `GET /api/externo/clientes/{dni}/deuda` | US-F4-07 |

Fuera de este frente (no asignados aquí): `POST /api/publico/cupon` (Frente 3, US-F3-06 con RN20 de US-F1-07), `GET /api/externo/vehiculos/{patente}/seguro-vigente` y `POST /api/externo/cotizaciones` (Frentes 3 y 2), `POST /api/publico/consulta` (US-F1-08).

**Salientes (pasarela y ARCA)**

| Método y ruta | Tarea |
| --- | --- |
| `POST /api/pagos` (pasarela) | US-F4-01 (mock); US-F4-08 (HTTP real) |
| `GET /api/pagos/{idPago}` (pasarela) | US-F4-01 (mock); US-F4-08 (HTTP real) |
| `POST /api/facturas` (ARCA) | US-F4-01 (mock); US-F4-08 (HTTP real) |
| `GET /api/facturas/{numeroComprobante}` (ARCA) | US-F4-01 (mock); US-F4-08 (HTTP real) |

**Transversal**

| Referencia | Tareas |
| --- | --- |
| Sección 9.2 (ARCA) | US-F4-01, US-F4-08 |
| Sección 9.3 (pasarelas) | US-F4-01, US-F4-04, US-F4-05, US-F4-08 |
| Sección 9.5 B (deuda y webhook sin referencia) | US-F4-05, US-F4-07 |
| Autorización (C7/C10: `Politicas.Empleado`, `Politicas.ApiKey`, claim `proveedor`) | US-F4-03, US-F4-05, US-F4-06, US-F4-07 |
| Timeouts y reintentos (C4) | US-T-02 (no F4) |
| Cobro único, `IAprobacionPagoService` (C3, C12) | US-F4-02 (dueño); US-F4-03, US-F4-05, US-F4-06 y US-F3-07 lo llaman |
