# Contrato API: vehículos, planes y cotizaciones

Fuente de verdad del contrato: código del back (`backend/Aseguradora.Api/Controllers`, `backend/Aseguradora.Application/Dtos` y `Services`, `backend/Aseguradora.Domain`). Para el alcance y las decisiones de la spec: `docs/AnalisisBack.md` (§3, §4, §7, §9.4, §9.5 C, §10) y `docs/tareas-divididas.md` (Frente 2, US-F2-01 a US-F2-07). Los datos son de la rama `docs/frontend-analisis-tareas` con `development` a la fecha 2026-11-01 (incluye los merges de los PR #22 a #49).

Las referencias van como `ruta:línea` relativas a la raíz del repo. Los ejemplos JSON con ids son ilustrativos: los ids reales de seed son fijos (ver §4.2), los demás varían.

---

## 0. Convenciones que aplican a todos los endpoints de este documento

| Tema | Regla verificada | Origen |
|------|------------------|--------|
| Formato JSON | camelCase en propiedades (default de ASP.NET MVC). Sin `JsonStringEnumConverter` global: **los enums viajan como número**. | `backend/Aseguradora.Api/Program.cs:19` (sin converter); `backend/Aseguradora.Integrations/Dnrpa/DnrpaHttpService.cs:22` (converter solo en el cliente HTTP saliente, no aplica a la API) |
| Ids | `Guid` serializado como string UUID en minúsculas. | Tipos `Guid` en los DTO |
| Importes | `decimal` ARS con 2 decimales, serializado como número JSON. Usar el formateador de `@nexa/api`. | `backend/Aseguradora.Application/Services/CalculoPrima.cs:58` |
| Fechas | `DateTime` UTC (RN16). En la respuesta del POST de cotizaciones llegan con sufijo `Z`. En el GET de una cotización pueden no traer sufijo: ver Dudas D9. | `backend/Aseguradora.Application/Services/CotizacionService.cs:63`; `backend/Aseguradora.Tests/Pagos/PagoServiceCajaTests.cs:139` (evidencia de `DateTimeKind.Unspecified` al leer desde la base) |
| Errores de negocio | `BusinessRuleException` → 400; `NotFoundException` → 404; `ExternalServiceException` → 502; cualquier otra → 500 con texto genérico. El cuerpo es `ProblemDetails` (`application/problem+json`) con `detail` = mensaje. | `backend/Aseguradora.Api/Middleware/ExceptionMiddleware.cs:12-13, 54-65` |
| Errores de validación de modelo | Atributos `[Required]`, `[StringLength]` en el body: respuesta 400 con `ValidationProblemDetails` por defecto de ASP.NET (`errors` por campo). No hay `InvalidModelStateResponseFactory` personalizado. | `backend/Aseguradora.Api/Program.cs` (sin personalización); verificado por búsqueda, sin test de forma en este alcance |
| 401 / 403 | Sin cuerpo desde el middleware de auth, convertidos a ProblemDetails por `AddProblemDetails`. | `backend/Aseguradora.Api/Program.cs:20-21` |
| Código estable | El campo `codigo` del ProblemDetails solo se llena con `NotFoundException` que trae `Codigo`. **Ninguno de los errores de este documento lo usa** (ver Dudas D2). | `ExceptionMiddleware.cs:43-44`; `backend/Aseguradora.Application/Exceptions/NotFoundException.cs:7, 16` |

### 0.1 Tipos TypeScript comunes

```ts
/** Enum numérico. Orden de declaración: Auto=0, Moto=1, Camioneta=2. */
export type TipoVehiculo = 0 | 1 | 2;

/** Particular=0, Comercial=1. */
export type UsoVehiculo = 0 | 1;

/** Web=0, Panel=1, Externo=2. Las cotizaciones de esta sección se guardan con Panel (1). */
export type OrigenCotizacion = 0 | 1 | 2;

/** Forma del ProblemDetails que devuelve el back. */
export interface ProblemDetails {
  type?: string;
  title: string;            // p. ej. "Bad Request", "Not Found", "Solicitud inválida"
  status: number;
  detail?: string;          // mensaje en español (ver cada endpoint)
  instance?: string;        // path de la solicitud
  traceId?: string;         // presente en errores del ExceptionMiddleware
  codigo?: string;          // solo en NotFoundException con código; en esta sección no se usa
  errors?: Record<string, string[]>; // solo en 400 de validación de modelo
}
```

Origen de los enums: `backend/Aseguradora.Domain/Enums/TipoVehiculo.cs:3-8`, `UsoVehiculo.cs:3-7`, `OrigenCotizacion.cs:3-8`.

### 0.2 Autorización

Políticas: `backend/Aseguradora.Api/Security/Politicas.cs:10, 13, 16`.

| Política | Requisito | Origen |
|----------|-----------|--------|
| `Empleado` | JWT (`Bearer`) con rol `Empleado` **o** `Administrador` | `backend/Aseguradora.Api/Security/AuthenticationExtensions.cs:62-65` |
| `Admin` | JWT (`Bearer`) con rol `Administrador` | `AuthenticationExtensions.cs:67-70` |
| Anónimo | `[AllowAnonymous]` | `PlanesController.cs:21, 28` |

---

## 1. Cómo se identifica un vehículo (punto a)

### 1.1 Patente (la única clave de entrada)

- **Entrada del front**: solo `patente` en `POST /api/vehiculos`. Marca, modelo, año y tipo **no** se envían: los trae DNRPA.
- **Normalización**: `Trim()` y `ToUpperInvariant()` antes de validar (`backend/Aseguradora.Application/Dtos/VehiculoAltaRequest.cs:48-52`). Por eso `ae789fg` se guarda como `AE789FG`.
- **Formato válido** (regex, `VehiculoAltaRequest.cs:15`):

```text
^([A-Z]{2}[0-9]{3}[A-Z]{2}|[A-Z]{3}[0-9]{3})$
```

  - Mercosur `AA000AA` (por ejemplo `AE789FG`).
  - Formato anterior `AAA000` (por ejemplo `ABC123`).
  - No acepta espacios ni guiones internos. `AB 123CD` es inválida.
  - Inválidas según el test del plan: `AB12CDE`, `ABC1234`, `A123` (`docs/tareas-divididas.md:1133`).
- **Unicidad**: el servicio rechaza la patente si ya existe **cualquier** vehículo con esa patente, activo o dado de baja (`backend/Aseguradora.Application/Services/VehiculoService.cs:50-52`). Además hay índice único en base (`backend/Aseguradora.Data/Configurations/VehiculoConfiguration.cs:21`). Consecuencia: ver Dudas D4.
- **Longitud en base**: `varchar(7)` (`VehiculoConfiguration.cs:15`).

### 1.2 VIN / número de chasis y motor

- La entidad guarda `NumeroMotor` y `NumeroChasis` (`backend/Aseguradora.Domain/Entities/Vehiculo.cs:14-15`) y DNRPA los devuelve (`backend/Aseguradora.Application/External/DatosDnrpa.cs:13-14`, `NumeroChasis` documentado como "Chassis / VIN serial number").
- **No se exponen** en `VehiculoResponse` (`backend/Aseguradora.Application/Dtos/VehiculoResponse.cs:18-28`). El front **no puede mostrar el VIN** con la API actual (ver Dudas D1).

### 1.3 Año, marca, modelo y tipo

- Vienen **de DNRPA** al dar de alta (`VehiculoService.cs:66-69`): `Marca`, `Modelo`, `Anio`, `Tipo`.
- **No hay catálogo**: son texto libre tal como lo devuelve DNRPA (`nvarchar(60)` en base, `VehiculoConfiguration.cs:16-17`).
- **No son editables** desde la API: `PUT /api/vehiculos/{id}` solo cambia `uso`.
- `Tipo` (`TipoVehiculo`, número) define qué planes acepta el vehículo (RN05).
- Año: el usuario no lo carga y el servicio no valida que no sea futuro (no hay regla implementada; ver Dudas D6).

### 1.4 Uso

- `uso` es `UsoVehiculo` (0 Particular, 1 Comercial). Es **lo único editable** del vehículo.
- Afecta la prima (factor de uso, RN06). Cambiarlo **no** modifica cotizaciones ni pólizas ya emitidas (`VehiculosController.cs:67`).

### 1.5 Titular

- DNRPA devuelve el DNI del titular. El alta exige que coincida con el DNI del cliente (RN03, `VehiculoService.cs:57-59`).
- Si no coincide, el mensaje de error incluye ambos DNI (`VehiculoService.cs:58-59`). Como el endpoint es solo para empleados, es aceptable; no mostrarlo en pantallas públicas.

### 1.6 Valor del vehículo

- **NO DEFINIDO.** No existe campo de valor, suma asegurada ni valor de mercado en `Vehiculo.cs`, en `DatosDnrpa.cs`, en `VehiculoResponse.cs` ni en la spec.
- La prima **no** depende de un valor del vehículo: `CalculoPrima.Calcular` recibe solo `primaBase`, `tipo`, `anioVehiculo`, `anioReferencia`, `edadConductor` y `uso` (`CalculoPrima.cs:42-48`).

### 1.7 Datos de prueba del mock DNRPA

Con `Integraciones:Dnrpa:UsarMock = true` (es el modo de desarrollo), `backend/Aseguradora.Integrations/Dnrpa/DnrpaMockService.cs:15-44` responde:

| Patente | Marca | Modelo | Año | Tipo | Titular DNI | Nota |
|---------|-------|--------|-----|------|-------------|------|
| `AB123CD` | Toyota | Corolla XEi | 2021 | 0 (Auto) | 30123456 | Ya existe en seed (vehículo con póliza Vigente) |
| `AE789FG` | Toyota | Hilux SRX | 2023 | 2 (Camioneta) | 30123456 | Alta válida para el cliente seed |
| `AC456EF` | Honda | CB250 Twister | 2022 | 1 (Moto) | 27111222 | Titular distinto: dispara RN03 |

Cualquier otra patente devuelve "no figura en DNRPA" (`DnrpaMockService.cs:53-54`).

---

## 2. Vehículos

Controller: `backend/Aseguradora.Api/Controllers/VehiculosController.cs` (ruta base `api/vehiculos`, línea 14). Todos los endpoints llevan `[Authorize(Policy = Politicas.Empleado)]` (línea 15).

### 2.1 `POST /api/vehiculos`: alta de vehículo (CU06, RN03)

- **Estado**: Implementado (PR #24, mergeado a `development` el 2026-10-29). Ajuste posterior en PR #27.
- **Auth**: `Empleado` (JWT).
- **Flujo del servicio** (`VehiculoService.cs:30-81`), en este orden:
  1. Patente vacía → 400.
  2. Patente con formato inválido → 400.
  3. `uso` nulo o fuera de enum → 400.
  4. Cliente inexistente → 404.
  5. Cliente dado de baja → 400.
  6. Patente ya registrada (activa o dada de baja) → 400.
  7. Consulta a DNRPA. Sin datos → 400 con `VEHICULO_NO_ENCONTRADO`. Falla de servicio → 502.
  8. Titular DNRPA ≠ DNI del cliente → 400 (RN03).
  9. Persistencia con `ValidadoDnrpa = true` y `Activo = true`.
- No persiste nada si falla cualquier paso (`SaveChangesAsync` solo al final, línea 78).

**Request**

```ts
export interface VehiculoAltaRequest {
  /** UUID del cliente dueño. Obligatorio en el contrato. */
  clienteId: string;
  /** Patente. Se normaliza a mayúsculas y se recorta antes de validar. */
  patente: string;
  /** Uso declarado. Obligatorio. */
  uso: UsoVehiculo;
}
```

Validaciones exactas:

| Campo | Regla | Respuesta si falla | Origen |
|-------|-------|--------------------|--------|
| `clienteId` | Tipo `Guid` no nulo. `[Required]` no tiene efecto sobre un tipo valor, así que si se omite llega `Guid.Empty` y el servicio responde 404 (inferido de la anotación y del flujo; no hay test que lo fije). | 404 `El cliente 00000000-0000-0000-0000-000000000000 no existe.` | `VehiculoAltaRequest.cs:18-19`; `VehiculoService.cs:44-45` |
| `patente` | `[Required]`: no vacía ni solo espacios. Después: formato del §1.1. | 400 validación (vacía); 400 `La patente '{P}' no tiene un formato válido (AA000AA o AAA000).` | `VehiculoAltaRequest.cs:22-23`; `VehiculoService.cs:34-39` |
| `uso` | `[Required]`. Valor numérico fuera de rango pasa el binder y lo rechaza el servicio. | 400 validación (falta); 400 `El uso del vehículo es obligatorio y debe ser válido.` | `VehiculoAltaRequest.cs:26-27`; `VehiculoService.cs:41-42` |
| Otros campos | `marca`, `modelo`, `anio`, `tipo`, `validadoDnrpa`, `activo` **no** pertenecen al DTO: si se envían, se ignoran. | — | `VehiculoAltaRequest.cs:10-27` |

**Ejemplo de request**

```json
{
  "clienteId": "c1000000-0000-0000-0000-000000000001",
  "patente": "ae789fg",
  "uso": 0
}
```

**Response 201 Created** (`VehiculosController.cs:33`, header `Location: /api/vehiculos/{id}`)

```ts
export interface VehiculoResponse {
  id: string;
  clienteId: string;
  patente: string;          // en mayúsculas
  marca: string;            // texto de DNRPA
  modelo: string;           // texto de DNRPA
  anio: number;             // año de fabricación de DNRPA
  tipo: TipoVehiculo;
  uso: UsoVehiculo;
  validadoDnrpa: boolean;   // siempre true al crear
  activo: boolean;          // siempre true al crear
}
```

Origen: `backend/Aseguradora.Application/Dtos/VehiculoResponse.cs:18-28`.

```json
{
  "id": "5b0e1c2a-7f3d-4a61-9c2e-0d1f2a3b4c5d",
  "clienteId": "c1000000-0000-0000-0000-000000000001",
  "patente": "AE789FG",
  "marca": "Toyota",
  "modelo": "Hilux SRX",
  "anio": 2023,
  "tipo": 2,
  "uso": 0,
  "validadoDnrpa": true,
  "activo": true
}
```

**Errores**

| Status | Cuándo | `detail` (texto exacto del servicio) |
|--------|--------|--------------------------------------|
| 400 | Falta `patente` o `uso`, o `patente` vacía (validación de modelo) | `errors` por campo; `title` por defecto de ASP.NET |
| 400 | Formato de patente inválido | `La patente '{P}' no tiene un formato válido (AA000AA o AAA000).` |
| 400 | Uso fuera de enum | `El uso del vehículo es obligatorio y debe ser válido.` |
| 400 | Cliente dado de baja | `El cliente {ClienteId} está dado de baja.` |
| 400 | Patente ya registrada (incluye dadas de baja) | `Ya existe un vehículo registrado con la patente '{P}' (RN03).` |
| 400 | DNRPA no conoce la patente | `VEHICULO_NO_ENCONTRADO: La patente '{P}' no figura en el registro de DNRPA.` (`VehiculoService.cs:55`) |
| 400 | Titular DNRPA distinto del DNI del cliente | `RN03: El titular registral en DNRPA (DNI {X}) no coincide con el DNI del cliente ({Y}).` |
| 401 | Sin token | — |
| 403 | Token sin rol Empleado ni Administrador | — |
| 404 | Cliente inexistente | `El cliente {ClienteId} no existe.` |
| 502 | DNRPA no disponible, timeout o respuesta inválida | Texto del servicio externo (`ExternalServiceException`); no hay texto fijo. |

**Notas para el front**
- El código `VEHICULO_NO_ENCONTRADO` **no** viaja en el campo `codigo`: va dentro de `detail` (ver Dudas D2). Para distinguirlo hay que buscar el prefijo en el texto.
- El orden de validación importa: un vehículo ya registrado responde 400 por duplicado **antes** de consultar DNRPA.
- Para el mismo cliente con el mismo titular, el alta de una patente distinta no tiene otra restricción (no hay límite de vehículos por cliente).

---

### 2.2 `GET /api/vehiculos?clienteId={uuid}`: listar vehículos activos de un cliente (CU07)

- **Estado**: Implementado (PR #47, mergeado el 2026-10-31).
- **Auth**: `Empleado`.
- Lista solo `Activo = true` (`VehiculoService.cs:86`), ordenada por `patente` ordinal (`VehiculoService.cs:88`).

**Request**: query string `clienteId` (`Guid?`, `VehiculosController.cs:44`).

| Caso | Respuesta |
|------|-----------|
| Falta `clienteId` o es `00000000-0000-0000-0000-000000000000` | 400 (ver abajo) |
| `clienteId` no es un UUID válido | 400 de validación de binding (no es el mensaje personalizado) |
| Cliente inexistente | 200 con `[]`. **No** valida que el cliente exista (ver Dudas D13). |

Error 400 exacto (`VehiculosController.cs:46-50`), tipo `ProblemDetails` construido con `Problem(...)`:

```json
{
  "title": "Solicitud inválida",
  "status": 400,
  "detail": "El parámetro 'clienteId' es obligatorio."
}
```

**Response 200**

```ts
export type VehiculoListResponse = VehiculoResponse[];
```

```json
[
  {
    "id": "b1000000-0000-0000-0000-000000000001",
    "clienteId": "c1000000-0000-0000-0000-000000000001",
    "patente": "AB123CD",
    "marca": "Toyota",
    "modelo": "Corolla XEi",
    "anio": 2021,
    "tipo": 0,
    "uso": 0,
    "validadoDnrpa": true,
    "activo": true
  }
]
```

El id `b1000000-0000-0000-0000-000000000001` es el del seed (`backend/Aseguradora.Data/Seed/SeedData.cs:17`), y el cliente `c1000000-0000-0000-0000-000000000001` es el de `SeedData.cs:16`.

**Errores**: 400 (arriba), 401, 403.

**Notas**: no hay paginación ni filtro por patente. Un vehículo dado de baja **no** aparece en el listado (pero sí en el GET por id).

---

### 2.3 `GET /api/vehiculos/{id}`: detalle de un vehículo (CU07)

- **Estado**: Implementado (PR #47).
- **Auth**: `Empleado`.
- Ruta con restricción `{id:guid}` (`VehiculosController.cs:58`). Un id que no es UUID no coincide con la ruta y responde 404 sin pasar por el servicio.

**Request**: sin body.

**Response 200**: `VehiculoResponse` (§2.1). Devuelve también los vehículos dados de baja con `activo: false` (trazabilidad, `VehiculosController.cs:56`; decisión cerrada en `docs/tareas-divididas.md:1180`).

**Errores**

| Status | Cuándo | `detail` |
|--------|--------|----------|
| 404 | Id inexistente | `El vehículo {id} no existe.` (`VehiculoService.cs:97`) |
| 401 / 403 | Auth | — |

---

### 2.4 `PUT /api/vehiculos/{id}`: cambiar el uso del vehículo (CU07)

- **Estado**: Implementado (PR #47).
- **Auth**: `Empleado`.

**Request**

```ts
export interface ModificarUsoRequest {
  /** Obligatorio. Si falta responde 400 (no toma Particular por defecto). */
  uso: UsoVehiculo;
}
```

Origen: `backend/Aseguradora.Application/Dtos/ModificarUsoRequest.cs:10-14`. Es la única propiedad: otros campos enviados se ignoran.

```json
{ "uso": 1 }
```

**Response 200**: `VehiculoResponse` actualizado (`VehiculosController.cs:76`).

**Errores**

| Status | Cuándo | `detail` |
|--------|--------|----------|
| 400 | Falta `uso` (validación de modelo) | `errors.uso` |
| 400 | `uso` fuera de enum. Se valida **antes** de buscar el vehículo | `El uso del vehículo no es válido.` (`VehiculoService.cs:105-106`) |
| 400 | Vehículo dado de baja | `El vehículo {id} está dado de baja y no puede modificarse.` (`VehiculoService.cs:112`) |
| 404 | Id inexistente | `El vehículo {id} no existe.` (`VehiculoService.cs:109`) |

**Notas**: el cambio no afecta cotizaciones ni pólizas ya emitidas (`VehiculosController.cs:67`; la prima se copia al emitir, `AnalisisBack.md:323`).

---

### 2.5 `DELETE /api/vehiculos/{id}`: baja lógica (CU07, RN15, RN04)

- **Estado**: Implementado (PR #47).
- **Auth**: `Empleado`.
- **Lógica** (`VehiculoService.cs:122-144`):
  - Si ya está inactivo → 204 sin cambios (idempotente, línea 128-129).
  - Si tiene una póliza en estado `Pendiente`, `Vigente` o `Suspendida` → 400 (RN04, líneas 131-139). `Cancelada` y `Vencida` no bloquean.
  - Si no → `Activo = false`. Nunca borra la fila (RN15).

**Request**: sin body.

**Response 204 No Content.**

**Errores**

| Status | Cuándo | `detail` |
|--------|--------|----------|
| 400 | Póliza activa | `El vehículo {id} tiene una póliza activa (Pendiente, Vigente o Suspendida) y no puede darse de baja (RN04).` |
| 404 | Id inexistente | `El vehículo {id} no existe.` |
| 401 / 403 | Auth | — |

El seed tiene `AB123CD` (`b1000000-0000-0000-0000-000000000001`) con póliza Vigente: sirve para probar el 400 (`docs/tareas-divididas.md:1170`).

---

## 3. Planes y coberturas (puntos b y c)

### 3.1 Qué es un plan y qué cubre

- Entidad `Plan`: `Codigo`, `Nombre`, `Descripcion`, `PrimaBase`, `TiposPermitidos`, `AntiguedadMaxima`, `Activo` (`backend/Aseguradora.Domain/Entities/Plan.cs:5-16`).
- **No hay tabla de coberturas.** La cobertura se describe en texto libre en `Descripcion` (decisión cerrada: `AnalisisBack.md:931`, "alcanza con la descripción del plan").
- Los planes existentes son RC, TC y TR. RC viene de `backend/Aseguradora.Data/Seed/SeedData.cs:15, 22, 30-40`; TC y TR de `backend/Aseguradora.Data/Seed/PlanesSeeder.cs:11-54`.

Planes semilla (estado actual de la base de desarrollo):

| Código | Nombre | Id fijo | `PrimaBase` | `TiposPermitidos` | `AntiguedadMaxima` | Descripción (texto de la base) |
|--------|--------|---------|-------------|-------------------|--------------------|-------------------------------|
| RC | Responsabilidad Civil | `a1000000-0000-0000-0000-000000000001` | 12000.00 (`SeedData.cs:22`) | `Auto,Moto,Camioneta` | null (sin límite) | Cubre los daños que se le causan a terceros. |
| TC | Terceros Completo | `a1000000-0000-0000-0000-000000000002` | 18000.00 (`PlanesSeeder.cs:22`) | `Auto,Moto,Camioneta` | null | Cubre responsabilidad civil, robo, incendio y destrucción total. |
| TR | Todo Riesgo | `a1000000-0000-0000-0000-000000000003` | 30000.00 (`PlanesSeeder.cs:25`) | `Auto,Camioneta` | 10 (`PlanesSeeder.cs:28`) | Cubre terceros completo más daños parciales por accidente con franquicia. |

Los valores de TR (prima y antigüedad) son propuestas "a confirmar" en `docs/tareas-divididas.md:1055`.

### 3.2 Campos que se editan en el ABM (solo Admin)

`PlanRequest` (`backend/Aseguradora.Application/Dtos/PlanRequest.cs:8-34`) es el único body de alta y de edición. **No incluye `activo`**: no hay forma de reactivar un plan por la API (ver Dudas D7).

| Campo | Tipo | Obligatorio | Límite / regla | Origen |
|-------|------|-------------|----------------|--------|
| `codigo` | string | sí | máx. 10; se recorta y se pasa a MAYÚSCULAS; único | `PlanRequest.cs:11-13`; `PlanService.cs:125`; índice único `PlanConfiguration.cs:21` |
| `nombre` | string | sí | máx. 80; se recorta | `PlanRequest.cs:16-18`; `PlanService.cs:126` |
| `descripcion` | string | sí | máx. 500; se recorta | `PlanRequest.cs:21-23`; `PlanService.cs:127` |
| `primaBase` | decimal | no (si falta vale 0 y falla) | `> 0`; redondeo a 2 decimales (AwayFromZero) | `PlanRequest.cs:26`; `PlanService.cs:118-119, 128` |
| `tiposPermitidos` | string | sí | máx. 50; **lista separada por coma de nombres** de `TipoVehiculo` (`Auto`, `Moto`, `Camioneta`), sin distinguir mayúsculas. Se normaliza a nombre canónico, sin duplicados y sin espacios. | `PlanRequest.cs:29-31`; `PlanService.cs:133-154` |
| `antiguedadMaxima` | int \| null | no | `>= 0`; null = sin límite | `PlanRequest.cs:34`; `PlanService.cs:121-122` |

**Atención**: en `tiposPermitidos` van **nombres**, no números. En las respuestas, `tipo` es número. Es la única excepción de tipo de enum en la API actual (ver Dudas D8).

```ts
export interface PlanRequest {
  codigo: string;                 // máx 10
  nombre: string;                 // máx 80
  descripcion: string;            // máx 500
  primaBase: number;              // > 0
  tiposPermitidos: string;        // "Auto,Camioneta" (nombres, separados por coma), máx 50
  antiguedadMaxima?: number | null; // >= 0 o null
}
```

Respuesta de plan:

```ts
export interface PlanResponse {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  primaBase: number;
  tiposPermitidos: string;          // mismo formato que la request
  antiguedadMaxima: number | null;
  activo: boolean;
}
```

Origen: `backend/Aseguradora.Application/Dtos/PlanResponse.cs:14-22`.

**Qué puede hacer el Admin (y qué no)**
- Crear, editar (incluido el código) y desactivar. No puede borrar físicamente.
- Editar un plan **no** cambia las pólizas emitidas: la póliza guarda su propia `PrimaMensual` (`AnalisisBack.md:323`; `PlanService.cs` no toca pólizas).
- La edición de un plan inactivo **se permite** y responde 200, pero deja el plan inactivo (`PlanService.cs:69-93` no mira `Activo`).

### 3.3 Reglas que usan los planes

- **RN05**: cada plan define `TiposPermitidos` y `AntiguedadMaxima`. El plan es compatible con un vehículo si está activo, acepta su tipo y su antigüedad no supera el máximo (`backend/Aseguradora.Application/Services/MotorCotizacion.cs:46-59`).
- **RN15**: baja lógica (`Activo = false`); el plan desactivado sale de `GET /api/planes` y de las cotizaciones (`PlanService.cs:20-27`, `MotorCotizacion.cs:50-51`).
- **RN16**: importes en pesos con 2 decimales (`PlanService.cs:128`).

---

## 4. Endpoints de planes

Controller: `backend/Aseguradora.Api/Controllers/PlanesController.cs` (ruta base `api/planes`, línea 14). Servicio: `PlanService.cs`.

### 4.1 `GET /api/planes`: planes activos

- **Estado**: Implementado (PR #23, mergeado el 2026-10-29).
- **Auth**: anónimo (`PlanesController.cs:21`). La web pública la consume sin login.
- **Request**: sin parámetros.
- **Response 200**

```ts
export type PlanListResponse = PlanResponse[];
```

Ordenado por `codigo` sin distinguir mayúsculas (`PlanService.cs:22-24`). Solo `activo = true`.

```json
[
  {
    "id": "a1000000-0000-0000-0000-000000000001",
    "codigo": "RC",
    "nombre": "Responsabilidad Civil",
    "descripcion": "Cubre los daños que se le causan a terceros.",
    "primaBase": 12000.00,
    "tiposPermitidos": "Auto,Moto,Camioneta",
    "antiguedadMaxima": null,
    "activo": true
  },
  {
    "id": "a1000000-0000-0000-0000-000000000002",
    "codigo": "TC",
    "nombre": "Terceros Completo",
    "descripcion": "Cubre responsabilidad civil, robo, incendio y destrucción total.",
    "primaBase": 18000.00,
    "tiposPermitidos": "Auto,Moto,Camioneta",
    "antiguedadMaxima": null,
    "activo": true
  },
  {
    "id": "a1000000-0000-0000-0000-000000000003",
    "codigo": "TR",
    "nombre": "Todo Riesgo",
    "descripcion": "Cubre terceros completo más daños parciales por accidente con franquicia.",
    "primaBase": 30000.00,
    "tiposPermitidos": "Auto,Camioneta",
    "antiguedadMaxima": 10,
    "activo": true
  }
]
```

- **Errores**: ninguno propio. No hay paginación.

### 4.2 `GET /api/planes/{id}`: detalle de un plan activo

- **Estado**: Implementado (PR #23).
- **Auth**: anónimo (`PlanesController.cs:28`).
- **Response 200**: `PlanResponse`.
- **Errores**

| Status | Cuándo | `detail` |
|--------|--------|----------|
| 404 | Id inexistente **o** plan inactivo (mismo mensaje para los dos casos) | `El plan {id} no existe o no está activo.` (`PlanService.cs:33-34`) |

### 4.3 `POST /api/planes`: crear plan (CU08)

- **Estado**: Implementado (PR #23).
- **Auth**: `Admin` (`PlanesController.cs:36`).
- **Request**: `PlanRequest` (§3.2).
- **Response 201 Created**: `PlanResponse`, header `Location: /api/planes/{id}` (`PlanesController.cs:44`, `CreatedAtAction(nameof(Obtener))`).

Ejemplo de request (válido, código nuevo):

```json
{
  "codigo": "xx",
  "nombre": "Ejemplo de plan",
  "descripcion": "Descripción de prueba del plan.",
  "primaBase": 20000,
  "tiposPermitidos": "auto, Camioneta",
  "antiguedadMaxima": 8
}
```

Se guarda como `codigo: "XX"` y `tiposPermitidos: "Auto,Camioneta"`.

- **Validaciones** (cada fila es un error posible):

| Regla | Resultado |
|-------|-----------|
| `codigo` vacío o ausente | 400 validación de modelo (`[Required]`) o `El código del plan es obligatorio.` |
| `codigo` > 10, `nombre` > 80, `descripcion` > 500, `tiposPermitidos` > 50 | 400 validación de modelo (`[StringLength]`) |
| `nombre` / `descripcion` vacíos (tras recortar) | 400 `El nombre del plan es obligatorio.` / `La descripción del plan es obligatoria.` |
| `primaBase <= 0` | 400 `La prima base debe ser mayor que cero.` |
| `antiguedadMaxima < 0` | 400 `La antigüedad máxima debe ser mayor o igual a cero.` |
| `tiposPermitidos` vacío | 400 `Debe indicar al menos un tipo de vehículo permitido.` |
| Un tipo no es `Auto`/`Moto`/`Camioneta` | 400 `El tipo de vehículo '{X}' no es válido.` |
| `codigo` ya existe | 400 `Ya existe un plan con el código '{C}'.` |

- **Errores**: los de arriba, más 401 y 403. Sin cuerpo de error propio más allá de `detail`.

### 4.4 `PUT /api/planes/{id}`: editar plan (CU08)

- **Estado**: Implementado (PR #23).
- **Auth**: `Admin`.
- **Request**: `PlanRequest` (§3.2).
- **Response 200**: `PlanResponse`.
- Las mismas validaciones que el POST, con dos diferencias:
  - Código duplicado: `Ya existe otro plan con el código '{C}'.` (se excluye el propio plan, `PlanService.cs:78-80`).
  - Puede cambiar `codigo` y deja intacto `activo`.

| Status | Cuándo | `detail` |
|--------|--------|----------|
| 400 | Mismas reglas que §4.3 | ver §4.3 |
| 400 | Código de otro plan | `Ya existe otro plan con el código '{C}'.` |
| 404 | Id inexistente | `El plan {id} no existe.` (`PlanService.cs:74`) |
| 401 / 403 | Auth | — |

### 4.5 `DELETE /api/planes/{id}`: desactivar plan (RN15)

- **Estado**: Implementado (PR #23).
- **Auth**: `Admin`.
- **Lógica**: `Activo = false`, sin borrar la fila. Repetirlo no falla (`PlanService.cs:96-104`).
- **Response 204 No Content.**
- **Errores**

| Status | Cuándo | `detail` |
|--------|--------|----------|
| 404 | Id inexistente | `El plan {id} no existe.` |
| 401 / 403 | Auth | — |

---

## 5. Cotizaciones: cálculo, reglas y respuesta (puntos b y e)

### 5.1 Qué devuelve una cotización

- Una **cotización interna** es una orden de cálculo sobre **un vehículo**, y genera **una `Cotizacion` persistida por plan compatible** (`CotizacionService.cs:76-96`). Relación Plan → Cotización 1 a N (`AnalisisBack.md:246`).
- Respuesta del POST: un `fechaVencimiento` común y una lista de `opciones`, una por plan. Cada opción tiene su propio `idCotizacion`.
- **No genera cuotas**. Las cuotas nacen al emitir la póliza (RN07, F3).
- Vigencia: **15 días corridos** desde el momento de la cotización, en UTC (`CotizacionService.cs:21, 73`; RN06).
- Valor de vigencia (`EstaVigente`): válida hasta **inclusive** `fechaVencimiento` (`backend/Aseguradora.Application/Dtos/CotizacionDto.cs:29-35`). Es un **método**, no una propiedad: no viaja en el JSON (ver Dudas D10).
- Persistencia: origen `Panel` (`CotizacionService.cs:91`), `ClienteId` y `VehiculoId` no nulos.

### 5.2 Fórmula de prima (RN06)

```text
PrimaMensual = round( PrimaBase_plan × F_tipo × F_antigüedad × F_edad × F_uso , 2 , AwayFromZero )
```

Origen: `backend/Aseguradora.Application/Services/CalculoPrima.cs:42-59`.

| Factor | Condición | Valor | Origen |
|--------|-----------|-------|--------|
| Tipo | Auto | 1,00 | `CalculoPrima.cs:10, 63` |
| Tipo | Moto | 0,70 | `CalculoPrima.cs:11, 64` |
| Tipo | Camioneta | 1,20 | `CalculoPrima.cs:12, 65` |
| Antigüedad | 0 a 5 años | 1,00 | `CalculoPrima.cs:14, 16, 71` |
| Antigüedad | 6 a 10 años | 1,10 | `CalculoPrima.cs:15, 17, 72` |
| Antigüedad | más de 10 años | 1,25 | `CalculoPrima.cs:18, 73` |
| Edad del conductor | hasta 24 años | 1,30 | `CalculoPrima.cs:20, 22, 78` |
| Edad del conductor | 25 a 65 años | 1,00 | `CalculoPrima.cs:21, 23, 79` |
| Edad del conductor | más de 65 años | 1,15 | `CalculoPrima.cs:24, 80` |
| Uso | Particular | 1,00 | `CalculoPrima.cs:26, 85` |
| Uso | Comercial | 1,40 | `CalculoPrima.cs:27, 86` |

Definiciones de los insumos:
- **Antigüedad** = `max(0, anioReferencia − anioVehiculo)`, con `anioReferencia` = año UTC del reloj inyectado (`CotizacionService.cs:63, 68`; `MotorCotizacion.cs:32`). Nunca el reloj local.
- **Edad del conductor** = años cumplidos a la fecha UTC de hoy a partir de `Cliente.FechaNacimiento` (`CotizacionService.cs:64`; `MotorCotizacion.cs:62-69`).

**Ejemplo verificado contra la spec (9.5 C, con primas de prueba)**: moto 2024, edad 23, particular, base 10.000 → 10000 × 0,70 × 1,00 × 1,30 × 1,00 = **9.100,00**. Con base 18.000 → **16.380,00** (`docs/tareas-divididas.md:993-994`).

**Ejemplo con datos del seed** (vehículo `AB123CD`, Auto 2021, Particular; cliente de 41 años; año de referencia 2026): antigüedad 5 → factor 1,00; edad 41 → 1,00; uso 1,00. Resultado: RC 12.000,00, TC 18.000,00 y TR 30.000,00 (`docs/tareas-divididas.md:1215`).

### 5.3 Compatibilidad de planes (RN05)

Un plan activo es compatible si (`MotorCotizacion.cs:46-59`):
1. `Activo = true`.
2. `AntiguedadMaxima` es null o `antigüedad <= AntiguedadMaxima`.
3. `TiposPermitidos` contiene el tipo del vehículo.

Las opciones salen ordenadas por `codigo` sin distinguir mayúsculas (`MotorCotizacion.cs:36`).

Con el seed: un Moto no recibe TR; un Auto de 2000 (antigüedad 26) no recibe TR y paga factor 1,25 en RC y TC (`docs/tareas-divididas.md:1216-1217`).

### 5.4 Qué bloquea cotizar

| Caso | Resultado | Origen |
|------|-----------|--------|
| Vehículo inexistente | 404 `El vehículo {id} no existe.` | `CotizacionService.cs:54-55` |
| Vehículo dado de baja (`activo = false`) | 400 `El vehículo {id} está dado de baja y no se puede cotizar.` | `CotizacionService.cs:57-58` |
| Cliente del vehículo inexistente | 404 `El cliente {id} del vehículo no existe.` | `CotizacionService.cs:60-61` |
| Ningún plan compatible | 400 `Ningún plan es compatible con el vehículo.` | `CotizacionService.cs:70-71` |

**Lo que NO bloquea hoy** (importante para el front):
- Vehículo ya asegurado (tiene póliza activa). Solo bloquea la baja (RN04) y, al emitir, lo resolverá F3.
- Cliente dado de baja: **no se valida** al cotizar (ver Dudas D5).
- Edad del conductor: no hay mínimo ni máximo; solo cambia el factor.
- Valor del vehículo: no existe (§1.6).
- Consulta a DNRPA: no se hace al cotizar. Se usan los datos guardados en el vehículo.

---

## 6. Endpoints de cotizaciones

Controller: `backend/Aseguradora.Api/Controllers/CotizacionesController.cs` (ruta base `api/cotizaciones`, línea 13). Todos con `[Authorize(Policy = Politicas.Empleado)]` (línea 14).

### 6.1 `POST /api/cotizaciones`: cotizar un vehículo (CU09, interno)

- **Estado**: Implementado (PR #49, mergeado el 2026-10-31).
- **Auth**: `Empleado`.

**Request**

```ts
export interface CotizarVehiculoRequest {
  /** Obligatorio. Si falta, 400 de validación. */
  vehiculoId: string;
}
```

Origen: `backend/Aseguradora.Application/Dtos/CotizarVehiculoRequest.cs:9-13`.

```json
{ "vehiculoId": "b1000000-0000-0000-0000-000000000001" }
```

**Response 201 Created** (`CotizacionesController.cs:31`, sin header `Location`).

```ts
export interface OpcionCotizacion {
  /** Id de la Cotizacion persistida para este plan. Es el que se usa para emitir la póliza (§7). */
  idCotizacion: string;
  /** Código del plan (RC, TC, TR). */
  codigoPlan: string;
  /** Nombre del plan (no el código). */
  plan: string;
  /** Prima mensual en ARS, 2 decimales. */
  primaMensual: number;
}

export interface CotizacionResultado {
  /** UTC, ahora + 15 días. Igual para todas las opciones. */
  fechaVencimiento: string;
  /** Una opción por plan compatible, ordenadas por codigo. */
  opciones: OpcionCotizacion[];
}
```

Origen: `backend/Aseguradora.Application/Dtos/CotizacionResultado.cs:8-23`.

```json
{
  "fechaVencimiento": "2026-11-16T14:00:00Z",
  "opciones": [
    {
      "idCotizacion": "0c1d2e3f-4a5b-4c6d-8e7f-901a2b3c4d5e",
      "codigoPlan": "RC",
      "plan": "Responsabilidad Civil",
      "primaMensual": 12000.00
    },
    {
      "idCotizacion": "1d2e3f4a-5b6c-4d7e-9f80-012b3c4d5e6f",
      "codigoPlan": "TC",
      "plan": "Terceros Completo",
      "primaMensual": 18000.00
    },
    {
      "idCotizacion": "2e3f4a5b-6c7d-4e8f-8091-123c4d5e6f70",
      "codigoPlan": "TR",
      "plan": "Todo Riesgo",
      "primaMensual": 30000.00
    }
  ]
}
```

(Ids y fecha ilustrativos.)

**Errores**

| Status | Cuándo | `detail` |
|--------|--------|----------|
| 400 | Falta `vehiculoId` (validación de modelo; `Guid?` con `[Required]`) | `errors.vehiculoId` |
| 400 | Vehículo dado de baja | `El vehículo {id} está dado de baja y no se puede cotizar.` |
| 400 | Sin planes compatibles | `Ningún plan es compatible con el vehículo.` |
| 404 | Vehículo inexistente (incluye `00000000-…` porque llega como valor no nulo) | `El vehículo {id} no existe.` |
| 404 | Cliente del vehículo inexistente | `El cliente {id} del vehículo no existe.` |
| 401 / 403 | Auth | — |

**Notas**
- Es una sola operación: todas las `Cotizacion` se guardan en un único `SaveChangesAsync` (`CotizacionService.cs:98`).
- Si no hay planes compatibles no se crea nada.
- Decisiones de la tarea (propuesta aceptada): 400 sin planes, y 400 para vehículo dado de baja (`docs/tareas-divididas.md:1220, 1228, 1230`).

### 6.2 `GET /api/cotizaciones/{id}`: detalle de una cotización

- **Estado**: Implementado (PR #49).
- **Auth**: `Empleado`.
- **Request**: sin body. `id` es el `idCotizacion` de una opción (o de cualquier cotización guardada).

```ts
export interface CotizacionDto {
  id: string;
  planId: string;
  /** Código del plan (no el nombre). */
  codigoPlan: string;
  /** Siempre presente en cotizaciones internas. Null solo en las externas (PR #57). */
  clienteId: string | null;
  vehiculoId: string | null;
  primaMensual: number;
  /** Ver Dudas D9 sobre el sufijo de zona. */
  fechaCotizacion: string;
  fechaVencimiento: string;
  /** 0 Web, 1 Panel (interna), 2 Externo. */
  origen: OrigenCotizacion;
}
```

Origen: `backend/Aseguradora.Application/Dtos/CotizacionDto.cs:18-27` y `CotizacionService.cs:31-49`.

```json
{
  "id": "1d2e3f4a-5b6c-4d7e-9f80-012b3c4d5e6f",
  "planId": "a1000000-0000-0000-0000-000000000002",
  "codigoPlan": "TC",
  "clienteId": "c1000000-0000-0000-0000-000000000001",
  "vehiculoId": "b1000000-0000-0000-0000-000000000001",
  "primaMensual": 18000.00,
  "fechaCotizacion": "2026-11-01T14:00:00Z",
  "fechaVencimiento": "2026-11-16T14:00:00Z",
  "origen": 1
}
```

**Errores**

| Status | Cuándo | `detail` |
|--------|--------|----------|
| 404 | Id inexistente | `La cotización {id} no existe.` (`CotizacionService.cs:34`) |
| 404 | Plan de la cotización inexistente (no debería pasar por la FK) | `El plan {planId} de la cotización {id} no existe.` |
| 401 / 403 | Auth | — |

**Vigencia en el front**: no hay campo `vigente` ni `estado`. Hay que comparar `fechaVencimiento` con la hora actual (`ahora <= fechaVencimiento` es válido, RN06). Ver Dudas D10.

---

## 7. Cotización → póliza (punto d)

Solo enlace. El detalle de pólizas no está en este documento.

- Endpoint de emisión: **`POST /api/polizas`** (`backend/Aseguradora.Api/Controllers/PolizasController.cs:15, 22`).
- Body: `EmitirPolizaRequest { cotizacionId: Guid, vigenciaMeses: number }`, con `vigenciaMeses` en 1, 6 o 12 (RN07). Origen: `backend/Aseguradora.Application/Dtos/Polizas/EmitirPolizaRequest.cs:8`.
- Dato clave para el front: **`cotizacionId` es el `idCotizacion` de la opción elegida**, no el `fechaVencimiento` ni un id general. Cada opción es una `Cotizacion` distinta.
- Una cotización se usa para emitir como máximo una póliza (relación 1 a 0..1, `AnalisisBack.md:247`).
- Validaciones de vigencia de la cotización y del estado del vehículo al emitir: están en el dominio de pólizas (RN02 a RN07, RN04). No revisadas en este documento.

---

## 8. Uso de otros grupos (no lo consume el front)

- `POST /api/externo/cotizaciones`: cotización sin cliente para Ventas de motos y la Municipalidad. Protegido con `X-Api-Key` (`Politicas.ApiKey`).
- **Estado**: En PR. PR #57 (`feature/US-F2-07-cotizacion-externa`), abierto, base `development`. No mergeado.
- Según el PR, usa enums en MAYÚSCULAS solo en su body (`MOTO`, `PARTICULAR`), y cada opción lleva su propio `idCotizacion` sin id superior. Eso cambia la forma del ejemplo 9.5 C de la spec (`docs/tareas-divididas.md:1271-1272`).
- El front no lo consume.

---

## 9. Dudas

Cada duda indica lo que el código hace hoy y el efecto para el front. Propuesta cuando aplica.

- **D1. VIN, motor y chasis no están en la API.** `VehiculoResponse` no los incluye (`VehiculoResponse.cs:18-28`) aunque la entidad sí (`Vehiculo.cs:14-15`). Si el Figma muestra el VIN, hay que agregarlo al DTO de respuesta. ¿Lo muestra el Figma?
- **D2. `VEHICULO_NO_ENCONTRADO` no es un código estable.** Va como texto dentro de `detail` (`VehiculoService.cs:55`). Solo `NotFoundException` expone el campo `codigo` (`ExceptionMiddleware.cs:43-44`). El front tendría que buscar un prefijo en el texto. Propuesta: exponer un código en `codigo` del ProblemDetails.
- **D3. Estado HTTP de DNRPA sin datos.** Hoy es 400 (`VehiculoService.cs:55`, decisión propuesta en `docs/tareas-divididas.md:1138`). La spec 9.4 habla de 404, pero es el contrato del servicio simulado, no de nuestra API. Confirmar que 400 es lo acordado.
- **D4. Patente de un vehículo dado de baja no se puede volver a registrar.** La unicidad incluye inactivos (`VehiculoService.cs:50`, índice `VehiculoConfiguration.cs:21`) y no hay endpoint de reactivación. Hay que decidir si se reactiva el vehículo, se permite un alta nueva o se deja así.
- **D5. Cotizar no valida que el cliente esté activo.** El alta sí lo hace (`VehiculoService.cs:47-48`), pero `CotizarVehiculoAsync` no (`CotizacionService.cs:60-61`). Propuesta: 400 `El cliente {id} está dado de baja.` para coherencia.
- **D6. Año de fabricación futuro.** No hay validación. El año lo pone DNRPA y la spec deja la regla como decisión pendiente (`docs/tareas-divididas.md:1139`). Riesgo bajo para el front, porque el usuario no carga el año.
- **D7. Planes: no hay reactivación y el PUT no toca `activo`.** `PlanRequest` no tiene el campo (`PlanRequest.cs:8-34`) y el PUT de un plan inactivo responde 200 (`PlanService.cs:69-93`). Propuesta: agregar `activo` al PUT o un endpoint de reactivación.
- **D8. Enums numéricos frente a texto.** La API responde `tipo`, `uso` y `origen` como números (sin converter global; `docs/tareas-divididas.md:1182` lo fija así y dice que pasar a texto es un cambio global). Pero `tiposPermitidos` usa nombres y el contrato externo (PR #57) usa texto en mayúsculas. Confirmar que el front tipa los enums como números.
- **D9. Zona horaria de `fechaCotizacion` al leer.** La respuesta del POST trae `Z` porque el `DateTime` viene del reloj en UTC (`CotizacionService.cs:63`). El GET lee desde la base y no normaliza el `Kind`. Hay una evidencia del patrón en `PagoServiceCajaTests.cs:139` (`DateTimeKind.Unspecified`). **Inferencia no verificada con una llamada real**: el GET podría devolver la fecha sin sufijo. Propuesta: normalizar a UTC en Application, o que el front trate la fecha como UTC siempre.
- **D10. Vigencia de la cotización no viaja en el JSON.** `EstaVigente` es un método (`CotizacionDto.cs:35`) y no se serializa. El front tendría que comparar la fecha con su reloj. Propuesta: agregar un campo `vigente` calculado en el servidor.
- **D11. No hay listado de cotizaciones.** Solo `GET /api/cotizaciones/{id}`. Sin listado por vehículo ni por cliente. ¿Lo pide alguna pantalla del Figma?
- **D12. El GET de cotización no trae el nombre del plan.** El POST trae `plan` (nombre) y el GET trae `codigoPlan` (`CotizacionDto.cs:21`). Si la pantalla de detalle muestra el nombre, hay que resolverlo en el front con `GET /api/planes` o agregar el campo.
- **D13. Listado de vehículos con cliente inexistente.** Responde 200 con `[]` (`VehiculoService.cs:86`), sin 404. Confirmar que es lo esperado.
- **D14. Valores de TR son propuesta.** Prima 30.000, antigüedad máxima 10 y tipos `Auto,Camioneta` están marcados "a confirmar" (`docs/tareas-divididas.md:1055`).
- **D15. Valor del vehículo.** NO DEFINIDO en spec ni en código (§1.6). Confirmar que no hace falta para ninguna pantalla.
- **D16. Desajuste en el cliente de DNRPA (back, no afecta al front hoy).** `DnrpaHttpService` deserializa el JSON como plano (`DnrpaHttpService.cs:42`), pero la spec 9.4 define `titular: { dni, nombre }` anidado (`AnalisisBack.md:794-797`). Con `UsarMock = true` no se nota; al pasar al servicio real, el alta fallará. Lo reporto para el equipo de back.
- **D17. Respuesta 201 de `POST /api/cotizaciones` sin `Location`.** Es consistente con que el recurso son varias cotizaciones, pero no hay un id de "cotización" para seguir. Confirmar que el front usa `opciones[].idCotizacion`.

---

## 10. Tabla resumen: endpoint → estado

| Método | Ruta | Estado | Referencia | Acceso |
|--------|------|--------|-----------|--------|
| POST | `/api/vehiculos` | Implementado | PR #24 (merge 2026-10-29) | Empleado |
| GET | `/api/vehiculos?clienteId=` | Implementado | PR #47 (merge 2026-10-31) | Empleado |
| GET | `/api/vehiculos/{id}` | Implementado | PR #47 | Empleado |
| PUT | `/api/vehiculos/{id}` | Implementado | PR #47 | Empleado |
| DELETE | `/api/vehiculos/{id}` | Implementado | PR #47 | Empleado |
| GET | `/api/planes` | Implementado | PR #23 (merge 2026-10-29) | Anónimo |
| GET | `/api/planes/{id}` | Implementado | PR #23 | Anónimo |
| POST | `/api/planes` | Implementado | PR #23 | Admin |
| PUT | `/api/planes/{id}` | Implementado | PR #23 | Admin |
| DELETE | `/api/planes/{id}` | Implementado | PR #23 | Admin |
| POST | `/api/cotizaciones` | Implementado | PR #49 (merge 2026-10-31) | Empleado |
| GET | `/api/cotizaciones/{id}` | Implementado | PR #49 | Empleado |
| POST | `/api/externo/cotizaciones` | En PR #57 (abierto) | PR #57 | API key. Uso de otros grupos; el front no lo consume |
| POST | `/api/polizas` (enlace, §7) | Fuera de alcance | `PolizasController.cs:22` | Empleado |

Estado según la definición de `docs/frontend/00-decisiones-base.md` (FB4): **Implementado** = existe en `development`. Todas las filas "Implementado" están mergeadas a `development` según `git log` y `gh pr list`.
