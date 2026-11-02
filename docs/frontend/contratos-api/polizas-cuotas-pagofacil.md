# Contrato API: pólizas, cuotas y Pago Fácil (lado empleados)

- **Fecha de análisis:** 2026-11-01.
- **Fuente de verdad:** el código del back en `origin/development` (commit `4ba3d4b`, igual a `HEAD` del repo al momento del análisis; `git diff origin/development -- backend` vacío). Para lo no implementado: `docs/AnalisisBack.md` y `docs/tareas-divididas.md` (Frente 3). Regla de estados: `docs/frontend/00-decisiones-base.md` (FB4).
- **Alcance:** `PolizasController`, `PagoFacilController` (cupón, rendiciones, base positiva), `ExternoSeguroController` (solo mencionado) y sus DTOs, servicios y reglas.
- **Convención de citas:** `ruta/archivo.cs:línea` relativa a la raíz del repo.
- **Idioma:** español neutro. Los textos de error son los del back, citados tal cual.
- **Ejemplos:** los valores de los ejemplos JSON son ilustrativos (salvo donde se indica que salen de la base de pruebas). No son datos reales.

---

## 0. Resumen para el front

1. **Los enums de pólizas y cuotas viajan como número** (`estado: 1`), no como texto. Ver §1.3 y el mapa en §2. Es la decisión más importante de este documento (ver Dudas D1).
2. **Hay dos formas de error 400.** Las validaciones automáticas del framework tienen forma `ValidationProblemDetails` (con `errors`). Las reglas de negocio tienen la forma `ProblemDetails` del `ExceptionMiddleware` (con `detail`). Ver §1.4.
3. **El detalle de una póliza no trae pagos, facturas, nombre del cliente ni motivo de cancelación.** No existe endpoint que liste pagos por póliza o por cuota. Ver §10 y Dudas D2 a D4.
4. **Cupón de Pago Fácil:** solo se emite para cuotas `Pendiente` o `Vencida`. El código de barras de 42 dígitos se genera en cada pedido y no se guarda. Ver §6.
5. **Rendición:** un archivo con líneas mal formadas se rechaza entero con 400. Un archivo válido responde **201 aunque todas las líneas fallen**; los errores de línea van en `errores[]`. Ver §7.
6. **Base positiva:** es una descarga de texto plano con `Authorization`. El front no puede usar `window.open` ni un `<a href>` directo. Ver §8 y la receta en §11.
7. **Todos los endpoints de este documento están Implementados** (en `origin/development`), salvo `POST /api/publico/cupon`, que solo está especificado (§13).

---

## 1. Convenciones de esta página

### 1.1 Autenticación y roles

| Concepto | Valor | Fuente |
|---|---|---|
| Esquema | `Authorization: Bearer <JWT>` | `backend/Aseguradora.Api/Security/AuthenticationExtensions.cs:30-38` |
| Política de los endpoints de empleados | `Politicas.Empleado`: JWT válido con rol `Empleado` **o** `Administrador` | `backend/Aseguradora.Api/Controllers/PolizasController.cs:16`, `backend/Aseguradora.Api/Controllers/PagoFacilController.cs:16`, `backend/Aseguradora.Api/Security/AuthenticationExtensions.cs:62-65`, `backend/Aseguradora.Application/Security/Roles.cs:8-9` |
| Respuesta sin token | 401 | `backend/Aseguradora.Api/Program.cs:20-21`. El comentario dice que 401 y 403 sin cuerpo se convierten en ProblemDetails. No verificado en runtime. |
| Rol sin permiso | 403 | Mismo origen. Los atributos `ProducesResponseType` de cupón y base positiva no declaran 403, pero aplica igual. |

Los endpoints de `ExternoSeguroController` usan la política `Politicas.ApiKey` (`X-Api-Key`). El front no los usa (§9).

### 1.2 Serialización de tipos

| Tipo C# | JSON | TS | Nota |
|---|---|---|---|
| `Guid` | string | `string` | Rutas usan `{id:guid}`: un id mal formado no matchea la ruta y responde 404, no 400 (`PolizasController.cs:45`, `PagoFacilController.cs:26`). |
| `decimal` | number | `number` | Pesos (RN16). Mostrar con el formateador compartido (FB4). No formatear a mano. |
| `DateOnly` | string `yyyy-MM-dd` | `string` | Fechas de negocio en Argentina (`FechaInicio`, `FechaFin`, `FechaVencimiento`, `FechaRendicion`, vencimientos del cupón). |
| `DateTime` | string ISO 8601 | `string` | Timestamps UTC (RN16). Ver §1.5: el sufijo `Z` no es uniforme. |
| `enum` | **number** | ver §2 | Ver §1.3. |
| `int` / `long` | number | `number` | |

### 1.3 Enums: llegan como número

- `backend/Aseguradora.Api/Program.cs:19` registra solo `AddControllers()`. No hay `JsonStringEnumConverter` ni `ConfigureHttpJsonOptions` en `backend/Aseguradora.Api` ni en `backend/Aseguradora.Application`. Por lo tanto, `EstadoPoliza` y `EstadoCuota` se serializan con su valor entero.
- El `JsonStringEnumConverter` que aparece en `backend/Aseguradora.Integrations/Dnrpa/DnrpaHttpService.cs:22` es solo para leer la respuesta de DNRPA. No afecta a la API.
- La base también guarda enums como entero: `backend/Aseguradora.Data/Configurations/PolizaConfiguration.cs:31` filtra con `[Estado] IN ({(int)EstadoPoliza.Pendiente}, ...)`.
- **Incoherencia entre endpoints:** `PagoResponse.Estado` y `PagoResponse.Medio` están declarados como `string` (`backend/Aseguradora.Application/Dtos/PagoResponse.cs:5`). Los estados de pólizas y cuotas son número. El front tiene que manejar las dos formas (ver D1).
- **Query string:** el test de integración filtra con el nombre: `GET /api/polizas?estado=Vigente` (`backend/Aseguradora.Tests/Api/PolizasControllerTests.cs:142-143`). Por lo tanto, el front **envía el nombre en la query** y **lee el número en el JSON**.

### 1.4 Formas de error

Hay dos formas. El front tiene que aceptar las dos.

**a) Reglas de negocio** (`backend/Aseguradora.Api/Middleware/ExceptionMiddleware.cs`). Content-Type `application/problem+json`:

```ts
// Forma que arma ExceptionMiddleware (ExceptionMiddleware.cs:33-41).
export interface ProblemDetails {
  type?: string | null;   // ProblemDetails.Type, en general null
  title: string;          // Reason phrase HTTP: "Bad Request", "Not Found", ...
  status: number;         // 400 | 401 | 403 | 404 | 500 | 502 | 503
  detail: string;         // Mensaje de la excepción (en español) o "Ocurrió un error inesperado." en 500
  instance: string;       // Path del request
  traceId: string;        // Para cruzar con el log del server
  codigo?: string;        // Solo NotFoundException con Codigo (ExceptionMiddleware.cs:43-44). En pólizas y cupón no se setea.
}
```

Mapeo (`ExceptionMiddleware.cs:54-65`): `NotFoundException` → 404; `BusinessRuleException` → 400; `ReglaDeDominioException` y su subclase `TransicionInvalidaException` → 400; `ExternalServiceException` → 502; `ServicioNoDisponibleException` → 503; cualquier otra → 500.

**b) Validación automática del framework** (`[ApiController]`, `Program.cs:19`). Ocurre antes de llegar al servicio. Es un `ValidationProblemDetails`, no el `ProblemDetails` anterior:

```ts
// Forma estándar de ASP.NET Core para errores de validación del modelo.
// No verificado en runtime: el nombre exacto de cada clave de "errors" depende del binder.
export interface ValidationProblemDetails {
  type?: string | null;
  title: string;                      // "One or more validation errors occurred."
  status: 400;
  errors: Record<string, string[]>;   // p. ej. "pagina", "tamano", "motivo", "archivo"
  traceId?: string;
}
```

Disparan esta forma:

- `GET /api/polizas`: `pagina` fuera de `1..PaginaMaxima` o `tamano` fuera de `1..100`, y un `estado` que no sea un valor válido del enum (`PolizaFiltro.cs:21-25`).
- `POST /api/polizas/{id}/cancelar`: `motivo` vacío o solo espacios (`[Required(AllowEmptyStrings=false)]`) o de más de 200 caracteres después de trim (`CancelarPolizaRequest.cs:14-19`).
- `POST /api/pagofacil/rendiciones`: falta el campo `archivo`, porque es un `IFormFile` no nullable en un proyecto con `Nullable` habilitado (`PagoFacilController.cs:46`). Esto es lo esperado; no verificado.

Para el front: manejar `ValidationProblemDetails` como error de formulario (mostrar en el campo) y `ProblemDetails` como error de negocio (mostrar `detail`).

### 1.5 Fechas y zona horaria: resultado de la revisión

- No hay conversión de `DateTime` a UTC en `backend/Aseguradora.Data` (sin `ValueConverter`, `HasConversion`, `SpecifyKind` ni `ConfigureConventions` fuera de migraciones y seed). Los `DateTime` que salen de la base llegan con `Kind = Unspecified`, y `System.Text.Json` los serializa **sin `Z`**.
- En cambio, las respuestas construidas en memoria en la misma petición sí llevan `Z`: en `POST /api/polizas`, `FechaEmision` viene de `reloj.GetUtcNow().UtcDateTime` (`backend/Aseguradora.Application/Services/PolizaService.cs:37,60`).
- **Consecuencia:** el mismo campo puede llegar con o sin `Z` según el endpoint. Ejemplos: `fechaEmision` en `POST` (con `Z`) y en `GET` (sin `Z`); `fechaPago` de una cuota en `GET .../cuotas` (sin `Z`).
- **Regla para el front:** un formateador único (FB4) que trate **todo `DateTime` sin offset como UTC** (`new Date(valor.endsWith('Z') ? valor : valor + 'Z')`) y muestre la hora en `America/Argentina/Buenos_Aires`. No comprobado en runtime con datos reales de SQL Server (D5).

---

## 2. Tipos compartidos

```ts
// Mapa de enums numéricos (§1.3). Los nombres son los del back y son los que se envían en query strings.
export const EstadoPoliza = {
  Pendiente: 0,
  Vigente: 1,
  Suspendida: 2,
  Cancelada: 3,
  Vencida: 4,
} as const;
export type EstadoPolizaNombre = keyof typeof EstadoPoliza;   // "Pendiente" | "Vigente" | ...
export type EstadoPoliza = (typeof EstadoPoliza)[EstadoPolizaNombre];

export const EstadoCuota = {
  Pendiente: 0,
  Vencida: 1,
  Pagada: 2,
  Anulada: 3,
} as const;
export type EstadoCuotaNombre = keyof typeof EstadoCuota;
export type EstadoCuota = (typeof EstadoCuota)[EstadoCuotaNombre];
```

Fuentes: `backend/Aseguradora.Domain/Enums/EstadoPoliza.cs:3-10`, `backend/Aseguradora.Domain/Enums/EstadoCuota.cs:3-9`. El orden de los valores es el de declaración; si el back agrega valores, esta tabla cambia.

```ts
// Paginado. Fuente: backend/Aseguradora.Application/Comun/PaginaResponse.cs:10
// Ojo: el request usa "tamano" y el response devuelve "tamanoPagina".
export interface PaginaResponse<T> {
  items: T[];
  pagina: number;
  tamanoPagina: number;
  total: number;
}
```

---

## 3. Ciclo de vida de la póliza

### 3.1 Estados

| Estado | Significado | Da cobertura (RN10) |
|---|---|---|
| `Pendiente` (0) | Emitida, la cuota 1 todavía no se pagó (RN07) | No |
| `Vigente` (1) | Cuota 1 pagada y vigencia en curso | **Sí** |
| `Suspendida` (2) | Dos o más cuotas vencidas impagas (RN09) | No |
| `Cancelada` (3) | Cancelada por el usuario o por RN19. Estado terminal | No |
| `Vencida` (4) | Llegó a `FechaFin` (RN14). Estado terminal | No |

### 3.2 Transiciones

| Desde | Hacia | Disparador | Condición | Código |
|---|---|---|---|---|
| (nada) | `Pendiente` | `POST /api/polizas` | Cotización válida y reglas de emisión (§4) | `backend/Aseguradora.Application/Services/PolizaService.cs:63` |
| `Pendiente` | `Vigente` | Pago aprobado que incluye la **cuota 1** (caja, pasarela, rendición Pago Fácil o conciliación; cobro de F4) | `Numero == 1` y `Estado == Pagada` | `backend/Aseguradora.Domain/Entities/Poliza.cs:39-43` (`Activar`), `:96-105` (`ReevaluarEstado`); `backend/Aseguradora.Application/Services/AprobacionPagoService.cs:64-67` |
| `Vigente` | `Suspendida` | Job diario 00:05 (AR) | Dos o más cuotas en `Vencida` | `backend/Aseguradora.Application/Services/VencimientosService.cs:19`, `:65-70` |
| `Suspendida` | `Vigente` | Pago aprobado que incluye cuotas de la póliza | Ninguna cuota en `Vencida` después del pago | `backend/Aseguradora.Domain/Entities/Poliza.cs:106-109` |
| `Pendiente` | `Cancelada` | Job diario | La cuota 1 está en `Vencida` (RN19) | `VencimientosService.cs:56-62` |
| `Pendiente`, `Vigente`, `Suspendida` | `Cancelada` | `POST /api/polizas/{id}/cancelar` | Motivo de 1 a 200 caracteres (RN13) | `backend/Aseguradora.Application/Services/PolizaService.cs:134-144`; `backend/Aseguradora.Domain/Entities/Poliza.cs:65-82` |
| `Vigente`, `Suspendida` | `Vencida` | Job diario | `FechaFin <= hoy` (RN14) | `VencimientosService.cs:74-78` |
| `Pendiente` | `Vencida` | **No ocurre** | Una póliza `Pendiente` queda igual aunque pase `FechaFin` (nota abierta del Frente 3) | `VencimientosService.cs:72-73` |

Notas:

- `Poliza.Reactivar()` existe (`Poliza.cs:53-60`), pero no tiene llamadores en el código. La reactivación ocurre solo por `ReevaluarEstado` tras un pago.
- Las transiciones inválidas responden 400 con `TransicionInvalidaException`. Ejemplos de mensaje: `"No se puede pasar una póliza de Vencida a Cancelada."` y `"No se puede pasar una póliza de Cancelada a Cancelada."` (`Poliza.cs:112-116`).
- Ninguna transición de póliza se dispara por un request del front, salvo la cancelación. Los cambios por pago son inmediatos al aprobar el pago. Los cambios por vencimiento aparecen **después del job de las 00:05 (Argentina)** del día siguiente. Configuración: `Vencimientos:Habilitado` (`VencimientosJob.cs:24`, `:34`). Ver §3.4.

### 3.3 Ciclo de la cuota

| Desde | Hacia | Disparador | Condición | Código |
|---|---|---|---|---|
| (nada) | `Pendiente` | Emisión | Se generan `vigenciaMeses` cuotas con `Recargo = 0` | `backend/Aseguradora.Domain/Services/CalculadorCuotas.cs:26-36` |
| `Pendiente` | `Vencida` | Job diario | `FechaVencimiento < hoy` (vence el día siguiente, RN08). Suma `Recargo = 5%` del importe, una sola vez | `backend/Aseguradora.Domain/Entities/Cuota.cs:32-39`; `VencimientosService.cs:38-45`; `backend/Aseguradora.Domain/Services/TasaRecargoMora.cs:6,9-10` |
| `Pendiente` o `Vencida` | `Pagada` | Pago aprobado (`IAprobacionPagoService`, F4) | La cuota no está `Pagada` ni `Anulada`. Guarda `FechaPago` | `backend/Aseguradora.Domain/Entities/Cuota.cs:42-49`; `AprobacionPagoService.cs:64` |
| `Pendiente` o `Vencida` | `Anulada` | Cancelación de la póliza (manual o RN19) | La póliza cambia a `Cancelada` | `backend/Aseguradora.Domain/Entities/Poliza.cs:76-77`; `Cuota.cs:52-58` |

- Estados terminales: `Pagada` y `Anulada`.
- Un pago que incluye una cuota ya `Pagada` no cambia la cuota. Marca el pago como `RequiereRevisionPorDuplicado` (`AprobacionPagoService.cs:57-63`).
- El recargo no se acumula: el job solo actúa sobre `Pendiente` (`Cuota.cs:34`).

### 3.4 Qué ve el usuario y cuándo

- La pantalla debe leer el estado del servidor en cada carga. Los cambios por vencimiento no tienen evento en tiempo real.
- Un cambio por vencimiento aparece en el **primer request posterior al job de las 00:05 (AR)**. Un cambio por pago aparece en la respuesta del pago.
- El job corre una vez por día y se registra en `ControlProceso`. Si el back se reinicia, corre al arrancar si el día todavía no se procesó (`VencimientosJob.cs:9-12`, `:73-97`).
- No hay endpoint para disparar el job. El front no lo llama.

### 3.5 Acciones de UI según el estado

Sí = el back lo acepta. No = el back responde 400 (por eso la UI debe deshabilitarlo).

**Acciones sobre la póliza**

| Estado de la póliza | Ver detalle | Cancelar póliza | Ver cuotas | Cupón de una cuota | Pagar una cuota (F4, fuera de este doc) |
|---|---|---|---|---|---|
| `Pendiente` | Sí | **Sí** | Sí | Sí, si la cuota es `Pendiente` o `Vencida` | Sí, si la cuota es `Pendiente` o `Vencida` |
| `Vigente` | Sí | **Sí** | Sí | Sí, si la cuota es `Pendiente` o `Vencida` | Sí, si la cuota es `Pendiente` o `Vencida` |
| `Suspendida` | Sí | **Sí** | Sí | Sí, si la cuota es `Pendiente` o `Vencida` | Sí, si la cuota es `Pendiente` o `Vencida` |
| `Cancelada` | Sí | **No** (400 si se intenta) | Sí (todas `Anulada` o `Pagada`) | No (todas las cuotas quedan `Anulada` o `Pagada`) | No |
| `Vencida` | Sí | **No** (400 si se intenta) | Sí | Técnicamente el back lo permite si la cuota está `Pendiente` o `Vencida`. Ver D6 | Ver D6 |

**Acciones sobre la cuota**

| Estado de la cuota | Mostrar | Cupón | Pagar |
|---|---|---|---|
| `Pendiente` | Vencimiento. `recargo = 0` | Sí | Sí |
| `Vencida` | Vencimiento, y el recargo del 5% (`recargo > 0`) | Sí | Sí |
| `Pagada` | `fechaPago` | No | No |
| `Anulada` | Marca "Anulada" | No | No (RN11: las anuladas no se cobran) |

El cupón se valida solo por el estado de la cuota (`CuponPagoFacilService.cs:29-30`). No valida el estado de la póliza.

---

## 4. Emisión de una póliza (CU10, RN02 a RN07)

### 4.1 Request

```ts
// POST /api/polizas
// Fuente: backend/Aseguradora.Application/Dtos/Polizas/EmitirPolizaRequest.cs:8
export interface EmitirPolizaRequest {
  cotizacionId: string;        // Guid de una cotización existente, no vencida y no usada
  vigenciaMeses: 1 | 6 | 12;   // RN07. Otro valor: 400 "La vigencia debe ser de 1, 6 o 12 meses."
}
```

El request no trae cliente, vehículo ni plan. Todo se toma de la cotización.

### 4.2 Validaciones, en el orden en que se ejecutan

El servicio valida en este orden y corta en el primer error (`PolizaService.cs:33-81`). Nada se guarda si una regla falla.

| # | Regla | Código HTTP | Mensaje (`detail`) exacto | Origen |
|---|---|---|---|---|
| 1 | La cotización existe | 404 | `La cotización {id} no existe.` | `PolizaService.cs:170-171` |
| 2 | La cotización está vigente (hasta inclusive su vencimiento) | 400 | `La cotización está vencida (RN06).` | `PolizaService.cs:174-175` |
| 3 | La cotización no se usó antes | 400 | `La cotización ya se usó para emitir una póliza.` | `PolizaService.cs:177-178` |
| 4 | La cotización tiene cliente y vehículo (no es externa) | 400 | `La cotización no tiene cliente ni vehículo registrados: no se puede emitir una póliza desde una cotización externa.` | `PolizaService.cs:180-182` |
| 5 | El cliente existe y está activo | 400 | `El cliente de la cotización no existe o no está activo.` | `PolizaService.cs:190-191` |
| 6 | El cliente está validado en Renaper (RN02) | 400 | `El cliente no está validado en Renaper (RN02).` | `PolizaService.cs:193-194` |
| 7 | El vehículo existe y está activo | 400 | `El vehículo de la cotización no existe o no está activo.` | `PolizaService.cs:202-203` |
| 8 | El vehículo está validado en DNRPA (RN03) | 400 | `El vehículo no está validado en DNRPA (RN03).` | `PolizaService.cs:205-206` |
| 9 | El vehículo pertenece al cliente (RN03) | 400 | `El vehículo no pertenece al cliente de la cotización (RN03).` | `PolizaService.cs:208-209` |
| 10 | El vehículo no tiene otra póliza Pendiente, Vigente o Suspendida (RN04) | 400 | `El vehículo {patente} ya tiene una póliza pendiente, vigente o suspendida (RN04).` | `PolizaService.cs:211-215` |
| 11 | El plan existe y está activo | 400 | `El plan de la cotización no existe o no está activo.` | `PolizaService.cs:223-224` |
| 12 | El plan acepta el tipo de vehículo (RN05) | 400 | `El plan {codigo} no acepta vehículos de tipo {tipo} (RN05).` | `PolizaService.cs:228-229` |
| 13 | El plan acepta la antigüedad (RN05) | 400 | `El plan {codigo} acepta vehículos de hasta {maxima} años y este tiene {antiguedad} (RN05).` | `PolizaService.cs:231-234` |
| 14 | La vigencia es 1, 6 o 12 (RN07) | 400 | `La vigencia debe ser de 1, 6 o 12 meses.` | `backend/Aseguradora.Domain/Services/CalculadorCuotas.cs:19-20` |
| 15 | La prima mensual es mayor que cero | 400 | `La prima mensual debe ser mayor que cero.` | `CalculadorCuotas.cs:21-22` |
| 16 | Dos emisiones simultáneas (índices únicos) | 400 | `Otra emisión con la misma cotización o el mismo vehículo se guardó al mismo tiempo (RN04). Recargue los datos.` | `PolizaService.cs:72-78` |

Errores de autenticación: 401 (sin token) y 403 (rol no autorizado).

Nota sobre el orden: la vigencia se valida **después** de las reglas de cotización, cliente, vehículo y plan. Un request con cotización vencida y vigencia 3 responde por la cotización.

### 4.3 Qué se genera

- **Número:** `POL-` + 7 dígitos (`INumeradorPolizas`; el formato del barcode usa solo los dígitos, `RendicionService.cs:40-41`).
- **Estado inicial:** `Pendiente` (`PolizaService.cs:63`).
- **Prima:** `primaMensual` se copia de la cotización y no se recalcula (RN06, `PolizaService.cs:57-58`).
- **Fechas:** `fechaInicio` = hoy (AR). `fechaFin` = `fechaInicio` más `vigenciaMeses` meses (`PolizaService.cs:61-62`).
- **Cuotas:** `vigenciaMeses` cuotas, numeradas de 1 a N. Cada una tiene `importe = primaMensual`, `recargo = 0` y `estado = Pendiente`. Su vencimiento es el **día 10 del mes siguiente al inicio, más N meses**: la cuota N vence el día 10 del mes `inicio + N` (`CalculadorCuotas.cs:24-36`).
- **Transacción:** póliza y cuotas se guardan en un único `SaveChangesAsync` (RN07, `PolizaService.cs:67-70`).

**Ejemplo ilustrativo:** emisión con inicio `2026-11-01`, vigencia 6 meses y prima `12000`.

| Cuota | Vencimiento | Importe | Recargo | Estado |
|---|---|---|---|---|
| 1 | 2026-12-10 | 12000 | 0 | Pendiente |
| 2 | 2027-01-10 | 12000 | 0 | Pendiente |
| 3 | 2027-02-10 | 12000 | 0 | Pendiente |
| 4 | 2027-03-10 | 12000 | 0 | Pendiente |
| 5 | 2027-04-10 | 12000 | 0 | Pendiente |
| 6 | 2027-05-10 | 12000 | 0 | Pendiente |

`fechaFin` = `2027-05-01`. La cuota 6 vence **después** de `fechaFin`. El propio código lo contempla (`VencimientosService.cs:34-35`).

### 4.4 Primer pago

- La póliza nace `Pendiente`. Pasa a `Vigente` cuando se aprueba el pago de la **cuota 1** (RN07). Pagar otra cuota antes no la activa (`Poliza.cs:101-104`).
- El pago lo registra F4, no este módulo. Caja: `POST /api/pagos/caja` (`backend/Aseguradora.Api/Controllers/PagosController.cs:28-35`). Su contrato está fuera de este documento.
- Si la cuota 1 vence sin pagarse, el job cancela la póliza (RN19, §3.2).

### 4.5 Response

- **201 Created**, con header `Location` apuntando a `GET /api/polizas/{id}` (`PolizasController.cs:31`).
- **Body:** `PolizaDetalleResponse` (§5.3).

---

## 5. Endpoints de pólizas

Todos los endpoints de esta sección están **Implementados** (`backend/Aseguradora.Api/Controllers/PolizasController.cs`, último cambio `fb96bd7` en `origin/development`). Todos requieren `Politicas.Empleado` (`PolizasController.cs:16`).

### 5.1 `POST /api/polizas`: emitir

- **Estado:** Implementado. **Auth:** Empleado.
- **Request:** `EmitirPolizaRequest` (§4.1).
- **Response:** `201 Created` + `PolizaDetalleResponse` (§5.3). `Location: /api/polizas/{id}`.
- **Errores:** los de §4.2 (400 y 404 por reglas de negocio); 400 de validación del framework si el body no se puede deserializar; 401; 403.
- **Notas para el front:**
  - Deshabilitar el botón de emisión mientras no haya cotización seleccionada y vigencia válida (1, 6 o 12).
  - Mostrar el `detail` del 400 tal cual. Es texto de usuario en español. El mensaje de la regla 16 pide recargar los datos.

### 5.2 `GET /api/polizas`: listar

- **Estado:** Implementado. **Auth:** Empleado.
- **Query (`PolizaFiltro`):**

```ts
// GET /api/polizas?estado=Vigente&clienteId=...&patente=AB123CD&pagina=1&tamano=20
// Fuente: backend/Aseguradora.Application/Dtos/Polizas/PolizaFiltro.cs:7-25
export interface PolizaFiltroQuery {
  estado?: EstadoPolizaNombre;   // nombre, p. ej. "Vigente". Ver §1.3
  clienteId?: string;            // Guid
  patente?: string;              // coincidencia EXACTA, sin distinguir mayúsculas ni espacios de los bordes (PolizaService.cs:94-97). No es búsqueda parcial.
  pagina?: number;               // default 1. Rango 1..int.MaxValue/100
  tamano?: number;               // default 20. Rango 1..100
}
```

- **Response:** `PaginaResponse<PolizaListItemResponse>` (§5.2.1).
- **Orden:** `fechaEmision` descendente y luego `numero` descendente (`PolizaService.cs:102-105`).
- **Errores:** 400 de validación del framework si `pagina` o `tamano` están fuera de rango, o si `estado` no es un nombre válido (§1.4 b). 401; 403.
- **Notas:** `tamano` es el request y `tamanoPagina` es el response.

#### 5.2.1 `PolizaListItemResponse`

```ts
// Fuente: backend/Aseguradora.Application/Dtos/Polizas/PolizaListItemResponse.cs:6-15
export interface PolizaListItemResponse {
  id: string;
  numero: string;          // "POL-0000001"
  clienteId: string;
  patente: string;
  codigoPlan: string;      // p. ej. "RC", "TC", "TR"
  primaMensual: number;
  fechaInicio: string;     // yyyy-MM-dd
  fechaFin: string;        // yyyy-MM-dd
  estado: EstadoPoliza;    // número, §2
}
```

### 5.3 `GET /api/polizas/{id}`: detalle

- **Estado:** Implementado. **Auth:** Empleado.
- **Response:** `PolizaDetalleResponse`.
- **Errores:** 404 `La póliza {id} no existe.` (`PolizaService.cs:149`). 401; 403.

```ts
// Fuente: backend/Aseguradora.Application/Dtos/Polizas/PolizaDetalleResponse.cs:26-44
export interface PolizaDetalleResponse {
  id: string;
  numero: string;                 // "POL-0000001"
  clienteId: string;
  vehiculoId: string;
  patente: string;
  marca: string;
  modelo: string;
  planId: string;
  codigoPlan: string;
  nombrePlan: string;
  cotizacionId: string | null;
  primaMensual: number;
  vigenciaMeses: number;          // 1 | 6 | 12
  fechaEmision: string;           // ISO, ver §1.5
  fechaInicio: string;            // yyyy-MM-dd
  fechaFin: string;               // yyyy-MM-dd
  estado: EstadoPoliza;
  cuotas: CuotaResponse[];        // ordenadas por numero
}
```

Lo que **no** trae este detalle (ver §10): datos del cliente (nombre, DNI), `fechaCancelacion`, `motivoCancelacion`, pagos y facturas.

Ejemplo ilustrativo:

```json
{
  "id": "d1000000-0000-0000-0000-000000000001",
  "numero": "POL-0000001",
  "clienteId": "c1000000-0000-0000-0000-000000000001",
  "vehiculoId": "b1000000-0000-0000-0000-000000000001",
  "patente": "AB123CD",
  "marca": "Toyota",
  "modelo": "Corolla XEi",
  "planId": "a1000000-0000-0000-0000-000000000001",
  "codigoPlan": "RC",
  "nombrePlan": "Responsabilidad civil",
  "cotizacionId": "e1000000-0000-0000-0000-000000000001",
  "primaMensual": 12000.0,
  "vigenciaMeses": 6,
  "fechaEmision": "2026-11-01T14:03:00",
  "fechaInicio": "2026-11-01",
  "fechaFin": "2027-05-01",
  "estado": 1,
  "cuotas": [
    { "id": "f1000000-0000-0000-0000-000000000001", "numero": 1, "importe": 12000.0, "recargo": 0.0, "fechaVencimiento": "2026-12-10", "estado": 2, "fechaPago": "2026-12-03T13:10:00" }
  ]
}
```

Los IDs y el plan son ilustrativos. La cuota pagada muestra `estado: 2` (`Pagada`). `fechaEmision` y `fechaPago` vienen sin `Z`, como en §1.5.

### 5.4 `POST /api/polizas/{id}/cancelar`: cancelar

- **Estado:** Implementado. **Auth:** Empleado.
- **Request:**

```ts
// Fuente: backend/Aseguradora.Application/Dtos/Polizas/CancelarPolizaRequest.cs:6-20
export interface CancelarPolizaRequest {
  motivo: string;   // obligatorio, 1..200 caracteres después de trim
}
```

- **Response:** `200` + `PolizaDetalleResponse` ya cancelado. Las cuotas no pagadas aparecen como `estado: 3` (`Anulada`).
- **Efecto (RN13):** la póliza pasa a `Cancelada`. Las cuotas `Pendiente` y `Vencida` pasan a `Anulada`. Las pagadas no cambian. No hay reintegros (RN13).
- **Errores:**
  - 404 `La póliza {id} no existe.` (`PolizaService.cs:149`).
  - 400 de validación del framework si `motivo` está vacío, es solo espacios o supera 200 caracteres (§1.4 b).
  - 400 `TransicionInvalidaException`: `No se puede pasar una póliza de {Estado} a Cancelada.` cuando la póliza está `Cancelada` o `Vencida` (`Poliza.cs:74`, `:115`). Los `{Estado}` son los nombres del enum en español, que es lo que ve el usuario.
  - 401; 403.
- **Notas:** deshabilitar el botón en `Cancelada` y `Vencida` (§3.5). Confirmar con el usuario antes de enviar: la acción anula cuotas y no tiene vuelta atrás.

### 5.5 `GET /api/polizas/{id}/cuotas`: cuotas

- **Estado:** Implementado. **Auth:** Empleado.
- **Response:** `CuotaResponse[]`, ordenadas por `numero` (`PolizaService.cs:129-130`). Sin paginación.
- **Errores:** 404 `La póliza {id} no existe.` (`PolizaService.cs:127`). 401; 403.

```ts
// Fuente: backend/Aseguradora.Application/Dtos/Polizas/CuotaResponse.cs:15-22
export interface CuotaResponse {
  id: string;
  numero: number;                 // 1..N
  importe: number;                // primaMensual de la póliza (RN07)
  recargo: number;                // 0 hasta que la cuota pasa a Vencida; luego 5% (RN08)
  fechaVencimiento: string;       // yyyy-MM-dd
  estado: EstadoCuota;            // número, §2
  fechaPago: string | null;       // ISO, ver §1.5; null mientras no esté pagada
}
```

Importe a cobrar de una cuota: `importe + recargo` (`Pago.cs:26`). Para el cupón, ver §6.2.

---

## 6. Cupón de Pago Fácil (CU20)

### 6.1 `GET /api/pagofacil/cuotas/{cuotaId}/cupon`

- **Estado:** Implementado (`backend/Aseguradora.Api/Controllers/PagoFacilController.cs:26-32`). **Auth:** Empleado.
- **Path:** `cuotaId` es un Guid. Un valor mal formado responde 404 por la ruta.
- **Response:** 200 + `CuponPagoFacilResponse`.
- **Errores:**
  - 404 `La cuota no existe.` (`CuponPagoFacilService.cs:27-28`).
  - 400 `No se puede generar el cupón de una cuota en estado {Estado} (RN11).` cuando la cuota está `Pagada` o `Anulada` (`CuponPagoFacilService.cs:29-30`).
  - 404 `La póliza de la cuota no existe.` (`CuponPagoFacilService.cs:32-33`). No debería pasar.
  - 400 `El importe {importe:0.00} no entra en el código de Pago Fácil.` cuando el importe no entra en el campo del barcode (§6.3, regla de desborde).
  - 400 `El número de póliza {numero} no tiene un formato válido.` (`CuponPagoFacilService.cs:73`). No debería pasar con el numerador actual.
  - 500 `Ocurrió un error inesperado.` cuando el número de póliza tiene más de 7 dígitos (`ArgumentOutOfRangeException` en `CodigoBarrasPagoFacil.cs:95-101`, sin mapeo en el middleware). Ver D8.
  - 401; 403.

```ts
// Fuente: backend/Aseguradora.Application/Dtos/PagoFacil/CuponPagoFacilResponse.cs:4-12
export interface CuponPagoFacilResponse {
  cuotaId: string;
  numeroPoliza: string;               // "POL-0000001"
  numeroCuota: number;
  importePrimerVencimiento: number;   // pesos
  fechaPrimerVencimiento: string;     // yyyy-MM-dd
  importeSegundoVencimiento: number;  // pesos
  fechaSegundoVencimiento: string;    // yyyy-MM-dd
  codigoBarras: string;               // 42 dígitos
}
```

Ejemplo ilustrativo (cuota 1 de `POL-0000001`, prima 12000, vencimiento `2026-12-10`, consultado el `2026-11-20`):

```json
{
  "cuotaId": "f1000000-0000-0000-0000-000000000001",
  "numeroPoliza": "POL-0000001",
  "numeroCuota": 1,
  "importePrimerVencimiento": 12000.0,
  "fechaPrimerVencimiento": "2026-12-10",
  "importeSegundoVencimiento": 12600.0,
  "fechaSegundoVencimiento": "2026-12-20",
  "codigoBarras": "123450120000020261210000000100112600001026"
}
```

El código de barras de este ejemplo fue calculado con el mismo algoritmo del back, con código de empresa ficticio `12345`. Sirve para validar la forma; no es un cupón real.

### 6.2 Reglas de importes y fechas

Hoy = fecha de Argentina (`FechaArgentina.Hoy`). Referencia: `CuponPagoFacilService.cs:42-65`.

| Campo | Regla | Código |
|---|---|---|
| `importePrimerVencimiento` | Si la cuota es `Pendiente` **y** `hoy > fechaVencimiento`: `importe + 5%` (calculado, no guardado). En otro caso: `importe + recargo` guardado. | `CuponPagoFacilService.cs:46-49` |
| `fechaPrimerVencimiento` | `fechaVencimiento` si es posterior a hoy. Si no, **hoy**. | `CuponPagoFacilService.cs:51` |
| `importeSegundoVencimiento` | Siempre `importe + 5%` (RN08). | `CuponPagoFacilService.cs:50` |
| `fechaSegundoVencimiento` | `fechaPrimerVencimiento + 10 días`. El 10 es una propuesta por defecto (`DiasAlSegundoVencimiento`, `CuponPagoFacilService.cs:22`). | `CuponPagoFacilService.cs:52` |
| Recargo | 5% sobre el importe, redondeado a centavos (`TasaRecargoMora.Calcular`). | `backend/Aseguradora.Domain/Services/TasaRecargoMora.cs:9-10` |
| Código de barras | Se genera en cada pedido. **No se guarda**, porque incluye importes y fechas que cambian (RN18, `docs/AnalisisBack.md:343`). | `CuponPagoFacilService.cs:54-61` |

Casos:

- Cuota `Pendiente` con vencimiento futuro: `importe1 = importe`, `fecha1 = vencimiento`, `importe2 = importe + 5%`, `fecha2 = vencimiento + 10 días`.
- Cuota `Vencida`: `importe1 = importe + recargo` (5%), `fecha1 = hoy`, `importe2 = importe + 5%`, `fecha2 = hoy + 10 días`.
- Cuota `Pendiente` con vencimiento anterior a hoy (el job todavía no corrió): `importe1 = importe + 5%` y `fecha1 = hoy`. Ver D9.

### 6.3 Código de barras de 42 dígitos

Fuente: `backend/Aseguradora.Application/PagoFacil/CodigoBarrasPagoFacil.cs`. El layout es una **propuesta por defecto** hasta tener el PDF de Pago Fácil (comentario en `CodigoBarrasPagoFacil.cs:19-23`). Tratar el código como texto opaco: **no** parsearlo en el front.

| Campo | Posición (base 0) | Ancho | Contenido | Ejemplo |
|---|---|---|---|---|
| Código de empresa | 0 a 4 | 5 | `PagoFacil:CodigoEmpresa`, con ceros a la izquierda | `12345` |
| Importe 1er vencimiento | 5 a 12 | 8 | Centavos (`importePrimerVencimiento * 100`) | `01200000` |
| Fecha 1er vencimiento | 13 a 20 | 8 | `yyyyMMdd` | `20261210` |
| Número de póliza | 21 a 27 | 7 | Solo los dígitos de `POL-0000001` | `0000001` |
| Número de cuota | 28 a 30 | 3 | Número de cuota | `001` |
| Importe 2do vencimiento | 31 a 37 | **7** | Centavos (`importeSegundoVencimiento * 100`) | `1260000` |
| Días al 2do vencimiento | 38 a 39 | 2 | `10` | `10` |
| Verificador 1 | 40 | 1 | Módulo 10 sobre los 40 dígitos anteriores | `2` |
| Verificador 2 | 41 | 1 | Módulo 10 sobre los 41 dígitos anteriores | `6` |

**Cálculo de verificadores** (`CodigoBarrasPagoFacil.cs:112-119`): para cada dígito en la posición `i` (base 0), peso `3` si `i` es par y `1` si es impar. Suma. Verificador = `(10 - suma % 10) % 10`. El primer verificador se calcula sobre 40 dígitos y el segundo sobre 41 (incluido el primero). Un dígito alterado siempre falla (`CodigoBarrasPagoFacil.cs:22-23`).

**Desborde:** los importes en centavos entran así: primer importe hasta `$999.999,99` (8 dígitos); **segundo importe hasta `$99.999,99` (7 dígitos)**. Como el segundo importe es el importe con el 5% de recargo, una cuota con importe mayor a aproximadamente `$95.237` responde 400 en el cupón (`CodigoBarrasPagoFacil.cs:103-110`). Ver D7.

**Cómo renderizarlo:**

- Mostrar los **42 dígitos completos debajo del código de barras**, en fuente monoespaciada, como texto de respaldo. Pago Fácil y el cajero leen el número.
- Copiar al portapapeles: el texto sin espacios.
- La **simbología gráfica** (qué tipo de código de barras dibujar) **NO DEFINIDA** en el repo ni en `AnalisisBack.md`. Si el equipo elige una librería, es una decisión de UI. Ver D6.
- **No cachear el cupón entre días.** Depende de la fecha de Argentina (§6.2). Pedirlo otra vez cada vez que se muestre.
- No guardar el cupón en la base del front. El back no lo guarda, y cambia.

### 6.4 Pago Fácil y el importe a rendir

Cuando Pago Fácil paga, el archivo de rendición (§7) trae el mismo código de barras y el importe cobrado. El back compara el importe contra `importe + recargo` **guardado** de la cuota (`RendicionService.cs:128-130`). Por eso el cupón de una cuota `Pendiente` vencida que todavía no tiene el recargo guardado no coincide hasta que corra el job (ver D9).

---

## 7. Rendiciones de Pago Fácil (CU21)

### 7.1 Formato del archivo que sube el empleado

Fuente: `backend/Aseguradora.Application/PagoFacil/LayoutRendicionPagoFacil.cs:4-22`. **Propuesta de layout de ancho fijo** hasta tener el PDF de Pago Fácil (SEPSA). Docs de referencia: `docs/rendicion-pagofacil.md`.

| Campo | Posición (base 0) | Ancho | Formato |
|---|---|---|---|
| Código de barras | 0 | 42 | Dígitos con verificadores válidos (§6.3) |
| Fecha de pago | 42 | 8 | `yyyyMMdd` |
| Importe pagado | 50 | 10 | Centavos con ceros a la izquierda |

- Longitud de línea: **60 caracteres**, solo dígitos ASCII (`RendicionParser.cs:56-59`).
- Fin de línea: `\n` o `\r\n`. Las líneas en blanco se saltan, pero **cuentan para la numeración** (`RendicionParser.cs:36-38`).
- Codificación: ASCII. Caracteres no ASCII se leen como `?` y fallan la validación.
- Importe `0` no es válido (`RendicionParser.cs:69-70`).

Ejemplo de línea (60 caracteres). Código de barras del §6.1, fecha de pago `2026-12-05`, importe `12000`:

```
123450120000020261210000000100112600001026202612050001200000
```

Partes: `123450120000020261210000000100112600001026` (42) + `20261205` (8) + `0001200000` (10).

### 7.2 `POST /api/pagofacil/rendiciones`: subir

- **Estado:** Implementado (`PagoFacilController.cs:38-51`). **Auth:** Empleado.
- **Request:** `multipart/form-data`, con un único campo de archivo llamado **`archivo`** (`PagoFacilController.cs:46`).
- **Límites:**
  - Tamaño: **5 MB** (`5 * 1024 * 1024` bytes = 5.242.880; `RendicionService.cs:32`). Por encima: 400 `El archivo supera el máximo de 5 MB.` (`RendicionService.cs:170-171`).
  - El límite del formulario en el servidor es el doble (10 MB, `PagoFacilController.cs:76-78`). Un archivo entre 5 y 10 MB llega al servicio y recibe el 400 de negocio. Un archivo más grande lo corta el servidor. Ver D10.
  - Nombre: se toma `Path.GetFileName` del nombre enviado, se hace trim, y debe cumplir **todo** lo siguiente (`RendicionService.cs:152-159`, `:176`): entre 1 y 90 caracteres; solo `A-Z`, `a-z`, `0-9`, `.`, `_` y `-`. Letras acentuadas y espacios fallan.
- **Response:** **201** + `RendicionResponse` (§7.4). Ojo: el 201 llega aunque haya líneas rechazadas.
- **Errores de formato (400, el archivo no se guarda):**
  - `El nombre del archivo debe tener entre 1 y 90 caracteres: letras sin acento, dígitos, '.', '-' o '_'.`
  - `El archivo supera el máximo de 5 MB.`
  - `El archivo de rendición tiene líneas mal formadas: línea {n}: {motivo}; línea {m}: {motivo}`. Motivos posibles: `La línea tiene {x} caracteres y deben ser 60.`, `La línea solo puede tener dígitos.`, `La fecha de pago {texto} no es válida.`, `El importe pagado no puede ser cero.`. **Todas** las líneas mal formadas aparecen juntas en el `detail`, separadas por `; `. El front tiene que partirlo para mostrarlo línea por línea, o mostrar el texto tal cual.
  - `El archivo de rendición está vacío.` (`RendicionParser.cs:48-49`): sin líneas, o solo líneas en blanco.
- **Errores de negocio (400, el archivo no se guarda):**
  - `El archivo {nombre} ya fue procesado (RN18).` Un nombre ya procesado no se vuelve a procesar nunca (`RendicionService.cs:59-60`).
- **Errores de servidor:** 500 `Ocurrió un error inesperado.` si hay una falla no prevista **a mitad del archivo**. Las líneas anteriores ya quedaron cobradas y el nombre queda tomado. Para recuperar, se sube el mismo contenido con otro nombre (`docs/rendicion-pagofacil.md`, sección "Error inesperado").
- **401; 403.**

**Orden de validación** (`RendicionService.cs:50-92`): nombre → tamaño → formato de líneas → vacío → nombre ya procesado → guardar encabezado → líneas en orden.

### 7.3 `GET /api/pagofacil/rendiciones`: historial

- **Estado:** Implementado (`PagoFacilController.cs:54-59`). **Auth:** Empleado.
- **Response:** `HistorialRendicionResponse[]`, ordenado por `fechaProceso` descendente. **Sin paginación.**
- **Errores:** 401; 403.

```ts
// Fuente: backend/Aseguradora.Application/Dtos/PagoFacil/HistorialRendicionResponse.cs:11-18
export interface HistorialRendicionResponse {
  id: string;
  nombreArchivo: string;
  fechaRendicion: string;     // yyyy-MM-dd, día de proceso en Argentina
  fechaProceso: string;       // ISO, ver §1.5
  cantidadRegistros: number;  // líneas válidas leídas
  importeTotal: number;       // suma de los importes del archivo
  pagosAprobados: number;     // pagos de ese archivo en estado Aprobado
}
```

Nota: `pagosAprobados` es el único indicador de cuántas líneas se aplicaron. El historial no muestra cuántas fueron rechazadas (ver §7.4).

### 7.4 Resultado de una rendición

```ts
// Fuente: backend/Aseguradora.Application/Dtos/PagoFacil/RendicionResponse.cs:11-18
// Fuente de cada error: backend/Aseguradora.Application/Dtos/PagoFacil/ErrorLineaRendicion.cs:6
export interface RendicionResponse {
  id: string;
  nombreArchivo: string;
  cantidadRegistros: number;   // líneas válidas del archivo
  importeTotal: number;        // suma de todas las líneas
  procesadas: number;          // cantidadRegistros - rechazadas
  rechazadas: number;          // errores.length
  errores: ErrorLineaRendicion[];
}

export interface ErrorLineaRendicion {
  linea: number;   // número de línea en el archivo, desde 1 (cuenta las líneas en blanco)
  motivo: string;  // texto en español, tal como lo arma el back
}
```

**Motivos de línea rechazada (201, dentro de `errores`):**

| Motivo (texto del back) | Qué pasó | Código |
|---|---|---|
| `El código de barras no es válido (dígito verificador).` | Un verificador no coincide | `RendicionService.cs:110-111` |
| `El código de barras es de la empresa {x}, no de esta aseguradora.` | El código de empresa no es el configurado | `RendicionService.cs:114-115` |
| `La póliza {POL-…} no existe.` | El número de póliza del código no existe | `RendicionService.cs:118-120` |
| `La cuota {n} de la póliza {POL-…} no existe.` | La póliza existe pero no tiene esa cuota | `RendicionService.cs:122-124` |
| `La cuota {n} de la póliza {POL-…} está {Estado} (RN11).` | La cuota está `Pagada` o `Anulada`. Una segunda línea de la misma cuota cae acá (ya quedó `Pagada`) | `RendicionService.cs:125-126` |
| `El importe pagado {x} no coincide con el de la cuota ({y}).` | `x` ≠ `importe + recargo` guardado | `RendicionService.cs:128-130` |
| Texto de la excepción de F4 (`BusinessRuleException` o `ReglaDeDominioException`) | El cobro fue rechazado al aprobarse. El `Pago` queda `Pendiente` para revisión manual | `RendicionService.cs:139-149` |

**Cómo mostrar el resultado** (receta de UI):

1. Banner de resumen: `procesadas` de `cantidadRegistros` aplicadas, `rechazadas` con errores, `importeTotal`.
2. Si `rechazadas > 0`, una tabla con columnas `Línea` y `Motivo`, con `errores` tal cual.
3. Si `rechazadas === 0`, solo el resumen.
4. Un 201 con `rechazadas > 0` **no es un error de red**. No mostrar un toast de error.
5. **Persistencia del resultado:** el resultado solo viene en el POST. No hay `GET` por id de rendición, y el historial no guarda los errores. Si el usuario sale de la pantalla, pierde la lista de errores. Ofrecer copiarla o descargarla antes de navegar (decisión de UI, ver D11).
6. Un 400 con "ya fue procesado" no significa que el archivo falló: significa que el nombre ya está en el historial. Mostrar el mensaje y sugerir revisar el historial.

Qué no se ve desde el front: los pagos creados por cada línea y los que quedaron `Pendiente` por rechazo de F4. No hay endpoint que los liste por rendición. El `IdExterno` de cada pago es `nombre#línea` (`RendicionService.cs:134`), pero no se expone en ningún response de este módulo.

---

## 8. Base positiva (CU22)

### 8.1 `GET /api/pagofacil/base-positiva`: descargar

- **Estado:** Implementado (`PagoFacilController.cs:66-74`). **Auth:** Empleado.
- **Request:** sin body ni query.
- **Response:** **200** con `Content-Type: text/plain`, `Content-Disposition: attachment; filename="BASEPOS_<empresa>_<yyyyMMdd>.txt"` (`PagoFacilController.cs:73`, `BasePositivaService.cs:72-75`). El contenido es ASCII, con fin de línea `\r\n`.
- **Respuesta de error:** `application/problem+json` (ver abajo).
- **Efecto:** ninguno en la base. Es un cálculo al vuelo. No guarda nada (`BasePositivaService.cs:27-76`).

**Qué incluye (RN18):** todas las cuotas `Pendiente` o `Vencida` de las pólizas `Pendiente`, `Vigente` o `Suspendida` (`BasePositivaService.cs:21-24`, `:30-35`). Quedan **afuera** las cuotas de pólizas `Cancelada` o `Vencida`, aunque la cuota esté impaga y el cupón individual sí se pueda generar (D6).

**Errores:**

- 400 (`ProblemDetails`): cuando una cuota no se puede armar. Por ejemplo, importe con desborde en el segundo vencimiento (`El importe {x} no entra en el código de Pago Fácil.`, §6.3). **Falla el archivo entero.** Los DNI mal formados no fallan el archivo: esa cuota se omite y se loguea en el server (`BasePositivaService.cs:46-54`). Ver D12.
- 401 y 403: como en el resto.
- 500 `Ocurrió un error inesperado.` en los mismos casos que el cupón (número de póliza de más de 7 dígitos).

El front tiene que chequear `res.ok` y el `Content-Type` antes de guardar nada. Un error JSON guardado como `.txt` es un fallo silencioso. Ver §11.2.

### 8.2 Formato del archivo

Fuente: `backend/Aseguradora.Application/PagoFacil/LayoutBasePositivaPagoFacil.cs:4-41`. Layout propio hasta tener el PDF de Pago Fácil. Todos los registros tienen **97 caracteres** ASCII y terminan en `\r\n`. Los números van con ceros a la izquierda. Los importes van en centavos. Las fechas van en `yyyyMMdd`.

| Registro | Tipo | Campos (ancho) | Relleno |
|---|---|---|---|
| Encabezado | `H` | empresa (5), fecha de generación (8) | Espacios hasta 97 |
| Detalle | `D` | DNI (8), número de cliente = número de póliza (7), cuota (3), importe 1 (10, centavos), fecha 1 (8), importe 2 (10, centavos), fecha 2 (8), código de barras (42) | Ninguno (exacto 97) |
| Final | `T` | cantidad de registros (7), total en centavos (15) | Espacios hasta 97 |

Detalle: 1 + 8 + 7 + 3 + 10 + 8 + 10 + 8 + 42 = **97**.

Ejemplo de registros (cuota 1 de `POL-0000001`, DNI `30123456`, empresa ficticia `12345`, generado el `2026-11-20`, una sola cuota):

```
H1234520261120
D301234560000001001000120000020261210000126000020261220123450120000020261210000000100112600001026
T0000001000000001200000
```

El registro `H` tiene 14 caracteres y el `T` tiene 23: ambos se rellenan con espacios hasta 97. El registro `D` tiene 97 caracteres exactos y no lleva relleno. En el ejemplo no se muestran los espacios.

Notas del formato:

- El DNI se normaliza a 8 dígitos con ceros a la izquierda. Un DNI de 7 dígitos `1234567` queda `01234567` (`BasePositivaService.cs:81-87`).
- El número de cliente es el número de póliza sin `POL-` (7 dígitos).
- El total del `T` es la suma de los **importes 1** en centavos (`BasePositivaService.cs:57`, `:70`).
- Importe 1 y fecha 1 son los mismos que el cupón del día (`BasePositivaService.cs:56`, `CuponPagoFacilService.Armar`).

### 8.3 Cómo se descarga desde el front

- No se puede usar `<a href="…/base-positiva">` directo: el endpoint requiere `Authorization: Bearer`, y un link no lo manda.
- Hay que hacer `fetch` con el header, leer la respuesta como blob o texto, y disparar la descarga con un object URL (receta en §11.2).
- **El nombre del archivo no se puede leer del header en un front en otro origen.** La configuración de CORS (`backend/Aseguradora.Api/Program.cs:50-54`) no declara `WithExposedHeaders`, así que el navegador no expone `Content-Disposition`. El front puede armar el nombre desde el registro `H` (empresa y fecha, posiciones 1 a 5 y 6 a 13 del primer renglón). Ver D13.
- La empresa (`PagoFacil__CodigoEmpresa`) es configuración del back y **NO DEFINIDA** para el front. Por eso el nombre se toma del archivo, no de una constante.

### 8.4 Qué hace el usuario con el archivo

Pago Fácil no tiene API: el archivo se entrega a mano (`docs/AnalisisBack.md`, `docs/tareas-divididas.md` US-F3-08). La pantalla solo tiene que descargar el archivo. No hay envío automático.

---

## 9. ExternoSeguroController (solo mención)

- `GET /api/externo/vehiculos/{patente}/seguro-vigente` (`backend/Aseguradora.Api/Controllers/ExternoSeguroController.cs:15-25`). Estado: Implementado (último cambio `ddd0926`).
- Auth: **API key** (`Politicas.ApiKey`, `ExternoSeguroController.cs:16`). No lo usa el front de empleados ni el de la web pública.
- Lo consumen otros grupos (`docs/AnalisisBack.md` §7 y §9.5). Su contrato no se documenta acá.

---

## 10. Detalle de póliza: de dónde sale cada bloque

La pantalla de detalle de una póliza combina endpoints. Esta tabla dice de dónde sale cada bloque y qué falta.

| Bloque de la pantalla | Endpoint de origen | Estado | Qué falta |
|---|---|---|---|
| Número, estado, vigencia, prima, fechas | `GET /api/polizas/{id}` | Implementado | Nada |
| Vehículo (patente, marca, modelo) | `GET /api/polizas/{id}` | Implementado | Nada |
| Plan (código y nombre) | `GET /api/polizas/{id}` | Implementado | Nada |
| Cuotas (importe, recargo, vencimiento, estado, fecha de pago) | `GET /api/polizas/{id}` (campo `cuotas`) o `GET /api/polizas/{id}/cuotas` | Implementado | Nada |
| Cupón por cuota | `GET /api/pagofacil/cuotas/{cuotaId}/cupon` | Implementado | Nada |
| Motivo y fecha de cancelación | **No está en el DTO** | NO DEFINIDO en el contrato | Las entidades lo tienen (`Poliza.cs:24-25`), pero `PolizaDetalleResponse` no. Ver D3. |
| Datos del cliente (nombre, DNI, contacto) | `GET /api/clientes/{id}` | **En PR #50** (US-F1-05, abierto). `ClientesController` no existe en `origin/development` | Ver D4 |
| Pagos de la póliza | **Ningún endpoint** | NO DEFINIDO | No hay listado de pagos por póliza ni por cuota. Ver D2. |
| Facturas de la póliza | `GET /api/pagos/{id}/factura` (necesita el id del pago) | Implementado, pero requiere `pagoId` | El id del pago no viene en ningún response de póliza o cuota. Ver D2. |

Con lo que hay hoy, la pantalla puede mostrar el historial de cuotas (pagadas con su `fechaPago`), pero no puede enlazar cada cuota pagada con su pago ni con su factura.

---

## 11. Recetas para el front

### 11.1 Subir una rendición (multipart)

```ts
const MAX_BYTES = 5 * 1024 * 1024; // 5.242.880; RendicionService.cs:32
const NOMBRE_VALIDO = /^[A-Za-z0-9._-]+$/; // RendicionService.cs:176

export async function subirRendicion(
  apiBase: string,
  token: string,
  archivo: File,
): Promise<RendicionResponse> {
  // Validar antes de enviar: el back valida lo mismo, pero el front evita el viaje.
  if (archivo.size > MAX_BYTES) throw new Error('El archivo supera 5 MB.');
  if (archivo.name.length > 90 || !NOMBRE_VALIDO.test(archivo.name)) {
    throw new Error('Nombre inválido: solo letras sin acento, dígitos, ".", "-" o "_" (máx. 90).');
  }

  const form = new FormData();
  form.append('archivo', archivo, archivo.name); // el campo debe llamarse "archivo"
  // No setear Content-Type: el navegador agrega el boundary del multipart.

  const res = await fetch(`${apiBase}/api/pagofacil/rendiciones`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (res.status === 201) return (await res.json()) as RendicionResponse; // validar con zod en el front (FB1)
  throw await leerErrorDelBack(res); // ProblemDetails o ValidationProblemDetails (§1.4)
}
```

`leerErrorDelBack` es una función del `packages/api` (FB2) que parsea ambos formatos. No se incluye acá.

### 11.2 Descargar la base positiva

```ts
export async function descargarBasePositiva(apiBase: string, token: string): Promise<void> {
  const res = await fetch(`${apiBase}/api/pagofacil/base-positiva`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Un error viene como application/problem+json. No guardar nada en ese caso.
  const tipo = res.headers.get('Content-Type') ?? '';
  if (!res.ok || !tipo.startsWith('text/plain')) {
    throw await leerErrorDelBack(res);
  }

  const texto = await res.text();
  // Nombre desde el registro H (empresa 1..5, fecha 6..13). Content-Disposition no es legible cross-origin (§8.3).
  const encabezado = texto.slice(0, 14);
  const nombre = `BASEPOS_${encabezado.slice(1, 6)}_${encabezado.slice(6, 14)}.txt`;

  const url = URL.createObjectURL(new Blob([texto], { type: 'text/plain' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}
```

---

## 12. Dudas

Cada duda dice qué se sabe, qué se asumió y a quién preguntar. Las marcadas como **bloqueante** frenan una pantalla concreta.

**D1. Enums como número (bloqueante para todas las pantallas de pólizas).**
- Hecho: los estados viajan como número (§1.3). `PagoResponse` los devuelve como texto. Son dos criterios distintos en la misma API.
- Opciones con trade-off: (a) el front mapea números con las constantes de §2. No requiere cambio en el back, pero acopla al front al orden de los valores del enum. (b) El back agrega `JsonStringEnumConverter` global. El contrato queda legible, pero cambia el JSON de todo enum que hoy viaja como número (pólizas, cuotas y cualquier otro expuesto directo). `PagoResponse` ya usa `string` y no cambia. Recomendado: (b) antes de que el front consuma los endpoints, y mientras tanto (a).
- A quién: equipo back, en la convención transversal.

**D2. No hay pagos ni facturas por póliza o cuota (bloqueante para la pantalla de detalle de cobros).**
- Hecho: no existe `GET` de pagos por póliza ni por cuota. `CuotaResponse` no trae `pagoId`. `GET /api/pagos/{id}/factura` necesita el `pagoId`.
- Pregunta: ¿se agrega `pagoId` a `CuotaResponse`, o un endpoint `GET /api/polizas/{id}/pagos`?

**D3. Motivo y fecha de cancelación fuera del detalle.**
- Hecho: `Poliza.MotivoCancelacion` y `FechaCancelacion` existen (`backend/Aseguradora.Domain/Entities/Poliza.cs:24-25`). `PolizaDetalleResponse` no los trae (`PolizaDetalleResponse.cs:26-44`). La cancelación automática por RN19 no tiene motivo visible para el usuario.
- Pregunta: ¿se suman al DTO?

**D4. Datos del cliente en el detalle.**
- Hecho: el detalle solo trae `clienteId`. `ClientesController` no está en `origin/development`. Está en PR #50 (abierto).
- Pregunta: ¿el nombre del titular se muestra desde `GET /api/clientes/{id}` cuando se mergee #50, o se agrega al detalle?

**D5. Zona horaria de `DateTime` (bloqueante para mostrar horas).**
- Hecho: sin `Z` cuando sale de la base; con `Z` cuando se arma en memoria (§1.5).
- Pregunta: ¿el back normaliza a `Kind = Utc` al leer (por ejemplo con un `ValueConverter`), o el front aplica la regla de §1.5? Hasta que se confirme con datos reales de SQL Server, el front debe tolerar ambos.

**D6. Póliza `Vencida` o `Cancelada` con cuotas impagas.**
- Hecho: el cupón se valida solo por el estado de la cuota (`CuponPagoFacilService.cs:29`), no por el de la póliza. Una póliza `Vencida` no anula sus cuotas impagas (RN14 solo la pasa a `Vencida`). Esas cuotas quedan `Pendiente` o `Vencida` y el back les da cupón y las acepta en un pago. La base positiva **sí** excluye las pólizas `Vencida` (`BasePositivaService.cs:23-24`).
- Pregunta: ¿una cuota de una póliza `Vencida` debe cobrarse? ¿Se deshabilita el cupón en el front, o se cambia el back para que la rechace? Hasta responder, el front la muestra como impaga y habilita el cupón.

**D7. Desborde del segundo importe del cupón (bloqueante para primas altas).**
- Hecho: el campo tiene 7 dígitos (centavos), así que el máximo es `$99.999,99`. Con el 5% de recargo, una cuota de más de aproximadamente `$95.237` no tiene cupón: responde 400 (`CodigoBarrasPagoFacil.cs:103-110`). El mismo desborde corta la base positiva entera (§8.1).
- Pregunta: ¿se amplía el campo (y entonces hay que cambiar el layout de Pago Fácil), o se acepta la limitación? Depende del PDF de Pago Fácil.

**D8. Número de póliza de más de 7 dígitos (500).**
- Hecho: `CodigoBarrasPagoFacil.Campo` lanza `ArgumentOutOfRangeException` (`CodigoBarrasPagoFacil.cs:95-101`) y el middleware no la mapea: responde 500. El numerador hoy emite `POL-0000001`, así que no debería pasar pronto.
- Pregunta: ¿se mapea a 400 o se deja como límite? Solo afecta a cupones y base positiva.

**D9. Cupón de una cuota `Pendiente` vencida antes del job.**
- Hecho: el cupón suma el 5% (`CuponPagoFacilService.cs:46-47`), pero el recargo guardado sigue en 0 hasta el job. La rendición compara contra el importe guardado (`RendicionService.cs:128-130`). Si Pago Fácil paga ese cupón antes de que corra el job, la línea se rechaza con "no coincide". Hoy el job corre a las 00:05, así que la ventana es chica, pero existe.
- Pregunta: ¿la rendición debe aceptar `importe + 5%` si la cuota está `Pendiente` y vencida por fecha?

**D10. Archivo de rendición entre 10 MB y el tope del servidor.**
- Hecho: el límite de formulario es 10 MB (`PagoFacilController.cs:76-78`). Un archivo por encima lo corta el servidor. Responde 413 o 500 según el manejo de la excepción; el `ExceptionMiddleware` no mapea `BadHttpRequestException`. **No verificado.** Un comentario de código dice que la respuesta es 413, pero no hay prueba.
- Pregunta: el front valida 5 MB antes de subir. ¿Hace falta un test de integración para este caso?

**D11. Resultado de la rendición no persistido.**
- Hecho: los errores de línea solo existen en la respuesta del POST (§7.4). No hay `GET` por id ni historial de errores.
- Pregunta: ¿se agrega `GET /api/pagofacil/rendiciones/{id}` con los errores, o el front los exporta al momento?

**D12. Base positiva y el DNI inválido.**
- Hecho: una cuota con DNI inválido se omite en silencio para el usuario (solo queda en el log, `BasePositivaService.cs:46-54`). El archivo no dice cuántas se omitieron (el `T` trae la cantidad de las incluidas).
- Pregunta: ¿se muestra un aviso al empleado? ¿Cómo se cobra esa deuda, solo por cupón?

**D13. Nombre del archivo de base positiva.**
- Hecho: `Content-Disposition` no está en `WithExposedHeaders` (`Program.cs:50-54`). El front arma el nombre desde el registro `H` (§11.2).
- Pregunta: ¿se agrega `WithExposedHeaders("Content-Disposition")`? Es un cambio chico en el back y deja de depender de un parseo del archivo.

**D14. Simbología del código de barras (NO DEFINIDO).**
- Hecho: el repo no define el tipo de código de barras que se dibuja.
- Pregunta: ¿lo define el diseño (Figma, pantalla de cupón) o Pago Fácil en su PDF?

**D15. Layouts pendientes del PDF de Pago Fácil (bloqueante para integración real).**
- Hecho: código de barras, rendición y base positiva son propuestas (`CodigoBarrasPagoFacil.cs:19`, `LayoutRendicionPagoFacil.cs:4-6`, `LayoutBasePositivaPagoFacil.cs:4-5`). `docs/tareas-divididas.md` los marca como bloqueantes de US-F3-06 a US-F3-08.
- Pregunta: ¿cuándo llega el PDF? Hasta entonces el front trata el código como opaco.

**D16. Primer vencimiento y emisión (de `docs/AnalisisBack.md` §10).**
- Hecho: `docs/AnalisisBack.md` §10 dice "una póliza emitida el día 9 se cancelaría al día siguiente". El código no lo reproduce: la cuota 1 vence el día 10 del **mes siguiente** al inicio (`CalculadorCuotas.cs:33`). El plazo entre emisión y cuota 1 va de unos 10 días (emisión el día 31) a unos 40 días (emisión el día 1). Además, `CalculadorCuotas.cs:14-15` dice que el plazo mínimo es una decisión abierta.
- Pregunta: ¿el plazo mínimo lo define el equipo? ¿El front avisa al empleado al emitir si la cuota 1 queda muy cerca?

**D17. Cuotas posteriores a `fechaFin` (§4.3).**
- Hecho: la última cuota puede vencer después de `fechaFin` (ejemplo: cuota 6 el `2027-05-10`, `fechaFin` `2027-05-01`). Al llegar `fechaFin` la póliza pasa a `Vencida`, pero el paso 1 de `VencimientosService` mira todas las cuotas `Pendiente` con vencimiento pasado, sin filtrar por estado de la póliza (`VencimientosService.cs:38`). Por eso la cuota 6 igual pasa a `Vencida` con recargo del 5%. Ver D6.
- Pregunta: ¿la UI muestra esa cuota como deuda de una póliza ya vencida, o se muestra de otra forma?

**D18. Filtro de patente exacto.**
- Hecho: coincidencia exacta (`PolizaService.cs:94-97`). Un empleado que busca `AB12` no encuentra `AB123CD`.
- Pregunta: ¿el filtro debe ser parcial? Hoy el front no puede hacer búsqueda incremental.

---

## 13. Tabla resumen: endpoint → estado

Estado según `docs/frontend/00-decisiones-base.md` (FB4). **Implementado** = existe en `origin/development` (verificado el `2026-11-01`). **En PR** = hay PR abierto con el endpoint (ninguno en este alcance). **Especificado** = solo en docs.

| Método | Ruta | Estado | Auth | Ref. |
|---|---|---|---|---|
| POST | `/api/polizas` | Implementado | Empleado | §5.1 |
| GET | `/api/polizas` | Implementado | Empleado | §5.2 |
| GET | `/api/polizas/{id}` | Implementado | Empleado | §5.3 |
| POST | `/api/polizas/{id}/cancelar` | Implementado | Empleado | §5.4 |
| GET | `/api/polizas/{id}/cuotas` | Implementado | Empleado | §5.5 |
| GET | `/api/pagofacil/cuotas/{cuotaId}/cupon` | Implementado | Empleado | §6.1 |
| POST | `/api/pagofacil/rendiciones` | Implementado | Empleado | §7.2 |
| GET | `/api/pagofacil/rendiciones` | Implementado | Empleado | §7.3 |
| GET | `/api/pagofacil/base-positiva` | Implementado | Empleado | §8.1 |
| POST | `/api/publico/cupon` | **Especificado** (no existe en el código; depende de US-F1-07) | Público | `docs/AnalisisBack.md` §7; `docs/tareas-divididas.md` US-F3-06 |
| GET | `/api/externo/vehiculos/{patente}/seguro-vigente` | Implementado (no es del front) | API key | §9 |

Pendiente de otros frentes (fuera de este doc): `GET /api/clientes/{id}` (**En PR #50**, `ClientesController` no está en `development`), `POST /api/pagos/caja` y `GET /api/pagos/{id}/factura` (F4, Implementados pero fuera de alcance).
