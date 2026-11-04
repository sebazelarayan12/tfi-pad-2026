# Contrato API: pagos y facturas

Contrato del backend para el frente. Fuente de verdad: código del back (`backend/`), con `docs/AnalisisBack.md` como spec de referencia y los docs de cada tarea (`docs/pagos-caja.md`, `docs/aprobacion-pagos.md`, `docs/webhook-pasarela.md`, `docs/conciliacion-pagos.md`, `docs/reintento-facturas.md`). Si algo de esta página choca con `00-decisiones-base.md`, manda ese archivo.

Las citas usan `archivo.cs:línea`. La ruta completa de cada archivo está en el **Anexo A**.

## Índice

1. Estado de los endpoints y alcance
2. Convenciones de transporte (JSON, errores, fechas, montos)
3. Tipos TypeScript compartidos
4. Medios de pago (a)
5. Flujo de pago online paso a paso (b)
6. Pago en caja por empleado (c)
7. Facturas (d)
8. Varias cuotas en un pago (e)
9. Idempotencia y doble clic (f)
10. Endpoints (detalle)
11. Fuera del alcance del front
12. Dudas
13. Resumen endpoint → estado

---

## 1. Estado de los endpoints y alcance

Criterio de `00-decisiones-base.md` (FB4): **Implementado** = existe en `development`. Verificado con lectura de `origin/development` (sin modificar nada): los controladores `PagosController.cs`, `PublicoPagosController.cs`, `WebhooksController.cs` y `DeudaExternaController.cs` están en `development`, y no hay diferencias con `HEAD` en `backend/Aseguradora.Api/Controllers`, `Application/Services`, `Application/Dtos` ni `Domain`.

| Endpoint | Estado | Origen (merge en development) |
|----------|--------|-------------------------------|
| `POST /api/pagos/caja` | Implementado | US-F4-03, PR #48 (`79fae56`) |
| `GET /api/pagos/{id}` | Implementado | US-F4-03, PR #48 |
| `GET /api/pagos/{id}/factura` | Implementado | US-F4-03, PR #48 |
| `POST /api/publico/factura` | Implementado | US-F4-03, PR #48 |
| `POST /api/publico/pagos` | Implementado | US-F4-04 (`54f5ca0`, `a011d2f`) |
| `POST /api/pagos/{id}/conciliar` | Implementado | US-F4-06, PR #53 (`8f1730f`) |

Alcance de este documento: `PagosController` y `PublicoPagosController`, más los DTO y servicios que sostienen su comportamiento (`PagoService`, `AprobacionPagoService`, `FacturacionService`, `WebhookPagoService` en lo que afecta al estado del pago).

Fuera de alcance del front: ver sección 11.

---

## 2. Convenciones de transporte

Las convenciones transversales (formato de error, auth, etc.) están referenciadas en `00-decisiones-base.md` (FB4) como `contratos-api/convenciones-transversales.md`. **Ese archivo no existe todavía en el repo.** Lo que sigue sale del código.

### 2.1 JSON

- No hay `JsonOptions` configuradas (`backend/Aseguradora.Api/Program.cs:19`: `AddControllers()` sin opciones). Por defecto ASP.NET serializa **propiedades en camelCase** (`numeroPago`, `urlPago`, `cuotaIds`).
- Los estados y medios viajan como **strings en mayúsculas** definidos en `backend/Aseguradora.Application/Dtos/ValoresPagoResponse.cs:6-13`, no como enteros del enum de Domain.
- `Guid` → string UUID.
- `decimal` → number (`importe`, `importeTotal`). Formatear con el formateador de `@nexa/ui` / `@nexa/api` (FB4); no formatear a mano.
- `DateTime` (`fechaCreacion`, `fechaAcreditacion`, `fechaExpiracion`, `fechaEmision`) → ISO 8601 en UTC con sufijo `Z` (`backend/Aseguradora.Application/Services/PagoService.cs:127-129`, `docs/pagos-caja.md:40-42`).
- `DateOnly` (`vencimientoCae`) → `"yyyy-MM-dd"`, sin hora ni zona.
- `char` (`tipo` de factura) → string de un carácter.

### 2.2 Errores (ProblemDetails)

Todos los errores de negocio pasan por `backend/Aseguradora.Api/Middleware/ExceptionMiddleware.cs`:

| Excepción | HTTP | Lugar |
|-----------|------|-------|
| `NotFoundException` | 404 | `ExceptionMiddleware.cs:56` |
| `BusinessRuleException` | 400 | `:57` |
| `ReglaDeDominioException` (y `TransicionInvalidaException`) | 400 | `:60` |
| `CredencialesInvalidasException` | 401 | `:58` |
| `ExternalServiceException` | 502 | `:61` |
| `ServicioNoDisponibleException` | 503 + `Retry-After` | `:48-49, :62` |
| Otra | 500, mensaje genérico `Ocurrió un error inesperado.` | `:64` |

Cuerpo (`ExceptionMiddleware.cs:33-44`, content-type `application/problem+json`):

```ts
export interface ProblemDetails {
  title: string;      // "Bad Request", "Not Found", "Bad Gateway", ...
  status: number;
  detail: string;     // mensaje de negocio en español (ver tablas por endpoint)
  instance: string;   // path de la request
  traceId: string;    // para soporte; mostrarlo en el error genérico
  codigo?: string;    // solo en algunos 404 (NotFoundException.Codigo)
}
```

Errores de validación de DataAnnotations (`[ApiController]`; `Program.cs` no registra `InvalidModelStateResponseFactory`). Este 400 **no pasa por `ExceptionMiddleware`**. El formato verificado es `ValidationProblemDetails` con `application/problem+json`, probado en `Tests/Api/PublicoConsultaControllerTests.cs:123-131` (misma pipeline que `PublicoPagosController`):

```ts
export interface ValidationProblemDetails {
  title?: string;
  status?: number;
  errors: Record<string, string[]>; // clave = nombre de la propiedad C# (PascalCase): "Dni", "NumeroPoliza" (test :120-122). Para cuotas: "CuotaIds"
  traceId?: string;
}
```

Los tests de pagos (`Tests/Pagos/PublicoPagosControllerTests.cs`) verifican el 400 por status, no por cuerpo. `detail` e `instance` no están verificados para este caso: el front lee `errors`, no `detail`.

El 429 de la web pública (RN20) tiene su propio cuerpo: `backend/Aseguradora.Api/Security/PublicoRateLimitExtensions.cs:74-86` (`ProblemDetails` con `status: 429`, `title: "Too Many Requests"`, `detail` fijo, `instance`, `traceId`).

Los 401 y 403 de autorización los produce el pipeline de auth, no el middleware; el cuerpo no está definido en el código (`NO DEFINIDO`). El front debe tratarlos por status, no por cuerpo.

### 2.3 Auth

- **Empleado / administrador:** `Politicas.Empleado` = JWT con rol `Empleado` o `Administrador` (`backend/Aseguradora.Api/Security/AuthenticationExtensions.cs:62-65`). Sin token: 401. Token válido sin rol: 403 (`docs/pagos-caja.md:67-68`).
- **Público:** `PublicoController` tiene `[AllowAnonymous]` y `[Route("api/publico")]` (`backend/Aseguradora.Api/Controllers/PublicoController.cs:12-13`). RN20: límite global de 10 intentos por minuto por IP sobre todo `/api/publico/*` (`docs/AnalisisBack.md:228`; el límite global lo registra `PublicoRateLimitExtensions.cs:47-60`). Exceso: 429.

---

## 3. Tipos TypeScript compartidos

Los tipos siguen el JSON real de los DTO. Los nombres de los DTO C# se conservan (FB3 regla 5).

```ts
// Valores públicos (ValoresPagoResponse.cs:6-13)
export type EstadoPago = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
export type MedioPagoApi = 'CAJA' | 'PASARELA' | 'PAGO_FACIL';
export type EstadoFactura = 'PENDIENTE_CAE' | 'AUTORIZADA';

// Proveedores online habilitados (PagoService.cs:27). El back hace Trim + ToLowerInvariant (PagoService.cs:136).
export type ProveedorPasarela = 'pasarela1' | 'pasarela2';

// Hoy siempre "B" (FacturacionService.cs:95, valor por defecto de Factura.Tipo en Factura.cs:35).
export type TipoFactura = 'B';

// Application/Dtos/FacturaResponse.cs:4-6. Sin datos personales del titular (comentario de la clase).
export interface FacturaResponse {
  id: string;                    // uuid
  pagoId: string;                // uuid
  numero: string;                // "" mientras estado = PENDIENTE_CAE (Factura.cs:15); luego número de ARCA
  tipo: TipoFactura;
  importe: number;               // total del pago, IVA incluido (FacturacionService.cs:94-98)
  estado: EstadoFactura;
  cae: string | null;            // 14 dígitos; null mientras PENDIENTE_CAE
  vencimientoCae: string | null; // "yyyy-MM-dd"; null mientras PENDIENTE_CAE
  fechaEmision: string;          // ISO UTC con Z
}

// Application/Dtos/PagoResponse.cs:4-6
export interface PagoResponse {
  id: string;
  clienteId: string;
  numero: string;                 // "PAG-" + 6 hex (NumeroPago.cs:17), p. ej. "PAG-6f1c2a"
  estado: EstadoPago;
  medio: MedioPagoApi;
  importe: number;                // Pago.ImporteTotal (Pago.cs:61)
  fechaCreacion: string;          // ISO UTC
  fechaAcreditacion: string | null;
  factura: FacturaResponse | null;
}

// Application/Dtos/PagoCajaRequest.cs:8-10
export interface PagoCajaRequest {
  cuotaIds: string[];             // mínimo 1; sin máximo declarado en el DTO
}

// Application/Dtos/PublicoFacturaRequest.cs:8-14
export interface PublicoFacturaRequest {
  dni: string;                    // regex ^\d{8}$
  numeroPago: string;             // máx. 20 caracteres, obligatorio
}

// Application/Dtos/PagoPublicoRequest.cs:12-30
export interface PagoPublicoRequest {
  dni: string;                    // regex ^\d{8}$
  numeroPoliza: string;           // máx. 20, p. ej. "POL-0000001"
  cuotaIds: string[];             // min 1, max 24 (PagoPublicoRequest.MaximoCuotas, línea 9)
  proveedor: ProveedorPasarela;   // máx. 30; cualquier otro valor -> 400
}

// Application/Dtos/PagoPublicoResponse.cs:8-12
export interface PagoPublicoResponse {
  numeroPago: string;             // PAG-xxxxxx: el número que luego pide la factura
  idPago: string;                 // uuid del pago en el sistema
  urlPago: string;                // link de checkout de la pasarela
  fechaExpiracion: string;        // ISO UTC; vencimiento del link según la pasarela
}
```

---

## 4. Medios de pago (a)

### 4.1 Enum de dominio

`backend/Aseguradora.Domain/Enums/MedioPago.cs:3-8`:

| Enum (C#) | Valor en API (`medio`) | Quién lo origina | Lo ve el cliente |
|-----------|------------------------|------------------|------------------|
| `Pasarela` | `PASARELA` | `POST /api/publico/pagos` (`PagoService.cs:148-149`) | Sí, es el único medio que el cliente puede iniciar |
| `PagoFacil` | `PAGO_FACIL` | Rendición de Pago Fácil (`RendicionService.cs:132`) | No se inicia desde la web pública |
| `Caja` | `CAJA` | `POST /api/pagos/caja` (`PagoService.cs:77`) | No: solo empleados |

### 4.2 Qué ve el cliente en "Elegir medio de pago"

Según el back, el cliente solo puede elegir **entre dos pasarelas online**, `pasarela1` y `pasarela2` (`PagoService.cs:27`; validación en `:136-138`). Cualquier otro valor → 400 `"El proveedor de pago indicado no existe."`.

- **Etiquetas visibles, orden y diseño de la pantalla:** `NO DEFINIDO` en el repo. `docs/frontend/` solo contiene `00-decisiones-base.md`; la pantalla no está documentada en `docs/frontend/pantallas/` todavía. No se leyó Figma para este documento.
- **Pago Fácil:** no es una opción online. El cupón de Pago Fácil existe solo para empleados: `GET /api/pagofacil/cuotas/{cuotaId}/cupon` con `[Authorize(Policy = Politicas.Empleado)]` (`backend/Aseguradora.Api/Controllers/PagoFacilController.cs:15-16, :26`). `AnalisisBack.md` §7 (línea 551) menciona `POST /api/publico/cupon`, pero **ese endpoint no existe en el código**.
- **Caja:** no es un medio que elija el cliente.

### 4.3 Efectivo u otro medio en caja

`PagoCajaRequest` solo tiene `cuotaIds` (`PagoCajaRequest.cs:8-10`). No hay campo para forma de pago (efectivo, tarjeta, etc.). El servicio siempre asigna `MedioPago.Caja` (`PagoService.cs:77`). **Consecuencia: el back no distingue efectivo de otros cobros en caja.** Si el equipo necesita esa distinción, es un cambio de contrato, `NO DEFINIDO` hoy.

### 4.4 Nombres técnicos de las pasarelas

`pasarela1` y `pasarela2` son los identificadores de ruta y de configuración (`docs/webhook-pasarela.md:7-8`). Los nombres comerciales de cada pasarela `NO DEFINIDO` en el repo. `AnalisisBack.md` §9.3 describe un contrato común (`POST /api/pagos` del otro grupo) pero no el nombre comercial.

---

## 5. Flujo de pago online paso a paso (b)

Referencia de la spec: `docs/AnalisisBack.md:113-120` (flujo) y `:725-776` (contrato 9.3).

### Paso 1. El front pide el link de pago

`POST /api/publico/pagos` con `PagoPublicoRequest`. Lo que hace el back, en orden (`PagoService.cs:132-166`):

1. Valida `proveedor` contra `pasarela1` / `pasarela2` (`:136-138`) → 400 si no coincide.
2. Verifica DNI + número de póliza con `VerificadorPublico.VerificarPolizaAsync` (`:140`, `Publico/VerificadorPublico.cs:21-29`). DNI o póliza incorrectos → 404 con mensaje genérico.
3. Carga las cuotas: deben pertenecer a esa póliza, sin repetidos, en `Pendiente` o `Vencida` (`:168-180`) → 400.
4. Reserva C8: si alguna cuota ya tiene un `Pago` `Pendiente` creado dentro de `Pagos:ReservaMinutos` (default 60, `PagoOnlineOpciones.cs:31`), → 400 `"Alguna de las cuotas ya tiene un pago en curso. Intente de nuevo más tarde."` (`PagoService.cs:184-195`).
5. Crea `Pago` `Pendiente` con `Medio = PASARELA`, `Proveedor`, `Numero` y un `PagoCuota` por cuota con importe + recargo (`Pago.cs:12-29`). Guarda, y toca las cuotas para RowVersion (`:148-155`).
6. Llama a la pasarela con `referenciaExterna = Numero`, pagador, URLs de retorno y `urlNotificacion = Pagos:UrlBaseApi + /api/webhooks/pasarela/{proveedor}` (`:197-208`).
7. Si la pasarela falla (`ExternalServiceException` u `OperationCanceledException`), el pago pasa a `Rechazado`, las cuotas no cambian y la respuesta es 502 (`:210-221`).
8. Si responde, guarda `IdExterno` y `LinkPago` (`:159-163`) y devuelve 201.

### Paso 2. Respuesta al front

```json
{
  "numeroPago": "PAG-6f1c2a",
  "idPago": "7d3e9f10-2b4a-4c1e-9a7d-3f2b1c0e5a11",
  "urlPago": "https://pasarela1.example/checkout/PSR-PAG-6f1c2a",
  "fechaExpiracion": "2026-10-30T21:00:00Z"
}
```

Ejemplo ilustrativo: la forma es la del DTO; la URL y la fecha salen del mock (`PasarelaMockService.cs:27-31`: `https://{proveedor}.example/checkout/...`, expiración = ahora + 1 hora). En real, el host y la expiración los define la pasarela (US-F4-08).

No hay `Location` en esta respuesta (`PublicoPagosController.cs:29-30`).

### Paso 3. Redirección a la pasarela

El front redirige al cliente a `urlPago`. La forma (misma pestaña o nueva) `NO DEFINIDO`.

Antes de redirigir, el front debe persistir `numeroPago`, `idPago`, `urlPago` y el `dni` en `sessionStorage` (solo en el navegador del cliente; no es un almacenamiento confiable). Motivo: la URL de retorno no trae parámetros (paso 4) y, sin esos datos, la página de retorno no puede consultar `POST /api/publico/factura` ni reanudar el flujo si el cliente vuelve atrás (ver sección 9.3).

### Paso 4. Retorno del cliente

Tras el pago, la pasarela devuelve al cliente a `Pagos:UrlRetornoExito` o `Pagos:UrlRetornoError` (`PagoOnlineOpciones.cs:19, :24`). Son **URLs fijas de configuración, no por request**: el back no agrega id, número de pago ni referencia a esas URLs. Qué parámetros agrega la pasarela al redirigir `NO DEFINIDO` en el repo. Ver Dudas.

### Paso 5. Confirmación del pago (webhook, no lo recibe el front)

La pasarela llama a `POST /api/webhooks/pasarela/{proveedor}` (`WebhooksController.cs:16-29`, auth por `X-Api-Key`). `WebhookPagoService.ProcesarAsync` (`Application/Services/WebhookPagoService.cs:19-66`):

- Si el pago ya está en estado final, responde sin cambios (`:30`).
- Si `ConfirmarWebhook` está activo (default `true`, `docs/webhook-pasarela.md:28`), consulta a la pasarela y compara identidad, estado e importe (`:32-47`).
- `APROBADO` → `AprobacionPagoService.AprobarAsync` (cuotas `Pagada`, reevaluación de póliza, factura) (`:101`).
- `RECHAZADO` / `CANCELADO` → `Pago.Rechazar()`, cuotas sin cambios (`:85-90`).
- Importe distinto con `APROBADO` → no aprueba, log `PAGO_IMPORTE_NO_COINCIDE`, 200 (`:91-98`).

El webhook devuelve `{ "recibido": true }` (`WebhooksController.cs:28`), nunca al front.

### Paso 6. Cómo se entera el front

**El front no tiene un endpoint público que devuelva el estado del pago.** Lo que hay:

| Opción | Endpoint | Qué devuelve | Sirve para el front |
|--------|----------|--------------|---------------------|
| A | `POST /api/publico/factura` `{dni, numeroPago}` | 200 `FacturaResponse` si el pago tiene factura (aprobado), 404 si no | **Parcial.** 200 = hay factura (aprobado). 404 = pendiente, rechazado, aprobado sin factura por duplicado, o DNI/número incorrectos: **mismo mensaje, no se distingue** (`PagoService.cs:112-119`, `VerificadorPublico.cs:17-18`). |
| B | `GET /api/pagos/{id}` | `PagoResponse` con `estado` | **No.** Solo `Empleado` (`PagosController.cs:12, :38`). |
| C | `POST /api/pagos/{id}/conciliar` | Consulta la pasarela y aplica | **No.** Solo `Empleado` (`PagosController.cs:19`). |

Consecuencias:

- Con la opción A, un pago **rechazado** y uno **pendiente** son indistinguibles para el cliente. El front no puede mostrar "pago rechazado" con datos del back.
- El front **puede** usar `POST /api/publico/factura` como polling para detectar la aprobación, con límite de 10 intentos por minuto por IP (RN20, `docs/AnalisisBack.md:228`). Exceder → 429.
- Un pago aprobado con factura siempre devuelve 200 aunque ARCA no haya respondido, porque la factura queda `PENDIENTE_CAE` (`docs/aprobacion-pagos.md:16-17`).

### Paso 7. Si el usuario vuelve sin pagar

- El back no cambia nada al volver. El pago queda `PENDIENTE` (la pasarela puede luego enviar `RECHAZADO` / `CANCELADO` por webhook, lo que lo pasa a `RECHAZADO`).
- **No existe job que venza pagos pendientes.** Los únicos jobs de fondo son `Api/BackgroundJobs/VencimientosJob.cs` (llama a `VencimientosService`, que solo vence cuotas y pólizas: `Application/Services/VencimientosService.cs:42, :76`) y `Api/BackgroundJobs/ReintentoFacturasJob.cs` (solo facturas pendientes). Un pago abandonado queda `PENDIENTE` indefinidamente.
- Las cuotas quedan bloqueadas para pago online durante `ReservaMinutos` (60 min por default). Un nuevo intento antes de ese plazo → 400 `"Alguna de las cuotas ya tiene un pago en curso. Intente de nuevo más tarde."`.
- Pasado el plazo, se puede crear un pago nuevo. Si el pago viejo se acredita después por webhook, queda como excedente: `RequiereRevisionPorDuplicado = true`, sin modificar cuotas y sin factura (`AprobacionPagoService.cs:57-63`; `docs/aprobacion-pagos.md:21-23`).

---

## 6. Pago en caja por empleado (c)

### 6.1 Datos requeridos

```json
{ "cuotaIds": ["f1000000-0000-0000-0000-000000000002"] }
```

- `cuotaIds`: obligatorio, al menos una. No hay medio, importe, cliente ni número: el cliente se deduce de las cuotas.
- El importe lo calcula el back (suma de importe + recargo guardado, `Pago.cs:26-27`). El front **no** envía importe.

### 6.2 Qué selecciona el empleado

Solo cuotas (`cuotaIds`). Puede mezclar cuotas de **varias pólizas del mismo cliente** (`docs/pagos-caja.md:21`; decisión por defecto en `docs/tareas-divididas.md:1947`).

### 6.3 Validaciones y códigos

En el orden en que se aplican (`PagoService.cs:56-80`):

| Caso | HTTP | Mensaje | Origen |
|------|------|---------|--------|
| `cuotaIds` vacío o ausente | 400 (validación) | `errors.CuotaIds = ["Debe indicar al menos una cuota."]` (no va en `detail`) | `PagoCajaRequest.cs:8-10` |
| IDs repetidos | 400 | `"Las cuotas no pueden repetirse."` | `PagoService.cs:62-63` |
| Alguna cuota no existe | 404 | `"Alguna de las cuotas indicadas no existe."` | `:65-66` |
| Alguna cuota `Anulada` o `Pagada` | 400 | `"Solo se pueden pagar cuotas pendientes o vencidas (RN11)."` | `:67-68` |
| Póliza de una cuota no existe | 404 | `"Alguna de las pólizas indicadas no existe."` | `:71-72` |
| Cuotas de dos clientes | 400 | `"Todas las cuotas deben pertenecer al mismo cliente."` | `:74-75` |
| Conflicto de concurrencia (RowVersion) | 400 | `"El pago o sus cuotas fueron modificados por otro cobro. Recargue los datos."` | `Data/Repositories/UnitOfWork.cs:15-18` |

No se valida el pago online en curso: caja puede cobrar una cuota con un checkout pendiente (`docs/pagos-caja.md:27-29`).

### 6.4 Respuesta

`201 Created` con `PagoResponse`, `estado: "APROBADO"`, `medio: "CAJA"`, cuotas `Pagada` (`docs/pagos-caja.md:8-11`; `PagosController.cs:28-35`). Header `Location: /api/pagos/{id}` (`PagosController.cs:34`).

Si ARCA no responde, el cobro queda aprobado y el campo `factura` viene con `estado: "PENDIENTE_CAE"` (`docs/pagos-caja.md:24-25`).

### 6.5 Consultas posteriores

- `GET /api/pagos/{id}`: 200 con `PagoResponse`; 404 `"El pago no existe."` (`PagoService.cs:85`).
- `GET /api/pagos/{id}/factura`: 200 con `FacturaResponse` (incluido `PENDIENTE_CAE`, decisión por defecto en `docs/tareas-divididas.md:1946`); 404 `"No se encontró la factura del pago."` (`PagoService.cs:107-108`).

---

## 7. Facturas (d)

### 7.1 Estados

Dominio: `EstadoFactura` = `PendienteCae`, `Autorizada` (`backend/Aseguradora.Domain/Enums/EstadoFactura.cs:3-7`). Valor en API (`PagoService.cs:123`):

| Estado | `numero` | `cae` | `vencimientoCae` | Cuándo |
|--------|----------|-------|------------------|--------|
| `PENDIENTE_CAE` | `""` | `null` | `null` | Pago aprobado y ARCA no respondió o no aprobó (`FacturacionService.cs:121-124`) |
| `AUTORIZADA` | número de ARCA | 14 dígitos (`Factura.cs:23-24`) | fecha `yyyy-MM-dd` | ARCA aprobó (`FacturacionService.cs:102-117`) |

Solo existen dos valores de `estado` en la API: `PENDIENTE_CAE` y `AUTORIZADA` (`ValoresPagoResponse.cs:12-13`, `EstadoFactura.cs:5-6`). No existe el estado "Validado" que aparece en algunas descripciones de la UI: no es un valor del contrato.

El reintento automático de facturas pendientes corre cada `Facturacion:IntervaloReintentoMinutos` (default 15, `docs/reintento-facturas.md:5-7`). El front puede mostrar "pendiente de CAE" sin fecha estimada.

### 7.2 Campos a mostrar

| Campo | Mostrar como |
|-------|--------------|
| `numero` | Número de comprobante. Si `""`, mostrar "Pendiente de numeración". |
| `tipo` | Tipo de factura (`B`, fijo). |
| `importe` | Total con IVA incluido. El back fija IVA 21 % (`FacturacionService.cs:32`); neto y IVA no se devuelven. |
| `cae` | Código de autorización de 14 dígitos. `null` → no mostrar. |
| `vencimientoCae` | Vencimiento del CAE. `null` → no mostrar. |
| `fechaEmision` | Fecha de emisión (UTC, convertir a zona de la UI). |
| `estado` | Badge. |

Campos que **no** vienen: datos personales del titular (`FacturaResponse.cs:3`), neto, IVA, cliente.

### 7.3 Descarga o visualización

**NO DEFINIDO.** No hay endpoint para descargar la factura en PDF. ARCA puede devolver `urlPdf` (`backend/Aseguradora.Application/Dtos/ArcaDtos.cs:27-32`), pero `FacturaResponse` no lo mapea (`FacturacionService` / `PagoService.MapearFactura`, `PagoService.cs:121-124`). Ver Dudas.

### 7.4 Dónde se consulta

- Empleado: `GET /api/pagos/{id}/factura` (sección 10).
- Cliente sin login: `POST /api/publico/factura` con `dni` + `numeroPago` (sección 10). Un DNI o número incorrectos, o un pago sin factura, dan el mismo 404 genérico `"No se encontró un registro con los datos indicados."` (`VerificadorPublico.cs:17-18`).

---

## 8. Varias cuotas en un pago (e)

- Un `Pago` agrupa N `PagoCuota` (`backend/Aseguradora.Domain/Entities/PagoCuota.cs:3-14`). Clave compuesta `(PagoId, CuotaId)`.
- Importe por cuota = `Cuota.Importe + Cuota.Recargo` al momento de crear el pago (`Pago.cs:24-26`). Total = suma (`Pago.cs:27`).
- El recargo lo guarda la cuota al vencer (`Cuota.Vencer`, `Cuota.cs:32-39`). Una cuota aún `Pendiente` con fecha vencida (si el job de vencimientos no corrió) se cobra con el `Recargo` guardado, que es cero (`Pago.cs:26`).
- **Orden obligatorio de cuotas: no existe.** Ninguna validación compara `Cuota.Numero` ni exige cuotas consecutivas (`PagoService.cs:168-180`, `:56-80`). Se pueden pagar cualquier subconjunto de cuotas `Pendiente` / `Vencida`, en cualquier orden, sin importar que sean la 2 y no la 1 (`docs/AnalisisBack.md:207`; checklist `:923`).
- Límites:
  - Online: 1 a 24 cuotas (`PagoPublicoRequest.cs:9, :24`), de **una sola póliza** (`PagoService.cs:140`, `:174-175`).
  - Caja: sin máximo declarado en el DTO; varias pólizas del mismo cliente (`PagoService.cs:69-75`).
- Cada cuota de la selección queda `Pagada` solo si el pago se aprueba (`AprobacionPagoService.cs:64`).

---

## 9. Idempotencia y doble clic (f)

El back **no** implementa `Idempotency-Key` ni token de un solo uso: `PagosController.cs` y `PublicoPagosController.cs` no lo leen y ningún servicio de pagos lo usa. La protección es por **estado de las cuotas**.

### 9.1 Qué protege el back

| Escenario | Qué pasa | Respuesta |
|-----------|----------|-----------|
| Respuesta de `POST /api/publico/pagos` perdida, o recarga de la página tras el `201` | Pago `PENDIENTE` con cuotas reservadas `ReservaMinutos`; ningún endpoint devuelve el `urlPago` de un pago existente | No hay forma de recuperar el link: un reintento devuelve 400 "en curso". Mitigación en la sección 5, paso 3 |
| Doble clic en pago online, segunda request llega después de que la primera creó el pago | Cuota con pago `Pendiente` en la ventana de reserva | 400 `"Alguna de las cuotas ya tiene un pago en curso. Intente de nuevo más tarde."` (`PagoService.cs:184-195`) |
| Dos requests online simultáneas | Ambas pasan la reserva; una gana el RowVersion de la cuota | La perdedora: 400 por conflicto (`UnitOfWork.cs:15-18`) |
| Doble clic en caja, después de que la primera cobró | Cuotas ya `Pagada` | 400 `"Solo se pueden pagar cuotas pendientes o vencidas (RN11)."` (`PagoService.cs:67-68`) |
| Dos cobros de caja simultáneos | Conflicto de RowVersion | 400 `"El pago o sus cuotas fueron modificados por otro cobro. Recargue los datos."` (`UnitOfWork.cs:18`; `docs/pagos-caja.md:30-33`) |
| Webhook duplicado | Pago ya final → sin cambios | Responde 200 sin cambios (`WebhookPagoService.cs:30`) |

### 9.2 Lo que debe hacer el front

1. **Un solo POST en vuelo por acción.** Deshabilitar el botón desde el envío hasta la respuesta (estado `isPending` de la mutación de TanStack Query).
2. **No reintentar automáticamente un POST de pago.** Las mutaciones de TanStack Query no reintentan por defecto; mantenerlo así y no sobreescribirlo.
3. **Tras un error de red en el POST, no reenviar a ciegas.** Antes de reenviar, consultar el estado de las cuotas o el pago (ver 9.3). Un reenvío de caja puede devolver 400 aunque el primer intento sí cobró.
4. **Un 400 "ya tiene un pago en curso" es información, no un error a reintentar.** Mostrar el mensaje y no volver a enviar durante la ventana de reserva.
5. **No generar claves en el cliente.** El back no las reconoce.

### 9.3 Límite real

Si la respuesta de caja se pierde (corte de red después del `201`), el front no recibe el `id` del pago ni el `Location`, y un reintento devuelve 400 porque la cuota ya está `Pagada`. **No hay endpoint para buscar pagos por cuota ni por póliza.** Ver Dudas.

En pago online ocurre lo mismo: si se pierde el `201` de `POST /api/publico/pagos`, el `urlPago` no se puede recuperar y las cuotas quedan reservadas durante `ReservaMinutos`. La mitigación del front es persistir la respuesta antes de redirigir (sección 5, paso 3).

---

## 10. Endpoints (detalle)

### 10.1 `POST /api/pagos/caja`

- **Estado:** Implementado (US-F4-03).
- **Auth:** `Politicas.Empleado` (JWT empleado o administrador). Origen: `PagosController.cs:12, :28`.
- **Request:** `PagoCajaRequest`.
- **Response:** `201 Created` con `PagoResponse`, header `Location`.

```ts
// Request
{ cuotaIds: string[] }

// Response 201
PagoResponse
```

```json
{
  "id": "5b0c1f2e-8a3d-4f6b-9c21-7e4d2a1b0c99",
  "clienteId": "c1000000-0000-0000-0000-000000000001",
  "numero": "PAG-6f1c2a",
  "estado": "APROBADO",
  "medio": "CAJA",
  "importe": 51250.00,
  "fechaCreacion": "2026-10-30T20:00:00Z",
  "fechaAcreditacion": "2026-10-30T20:00:00Z",
  "factura": {
    "id": "0e9d8c7b-6a5f-4e3d-8c2b-1a0f9e8d7c6b",
    "pagoId": "5b0c1f2e-8a3d-4f6b-9c21-7e4d2a1b0c99",
    "numero": "0001-00000123",
    "tipo": "B",
    "importe": 51250.00,
    "estado": "AUTORIZADA",
    "cae": "74123456789012",
    "vencimientoCae": "2026-11-18",
    "fechaEmision": "2026-10-30T20:00:00Z"
  }
}
```

Ejemplo ilustrativo; los importes y el CAE de ejemplo vienen de `docs/AnalisisBack.md` §9.2.

- **Errores:** 400 (regla de negocio o validación), 401 sin token, 403 rol inválido, 404 cuota o póliza inexistente. Ver 6.3.
- **Notas:**
  - El pago se guarda como `Aprobado` antes de facturar (`AprobacionPagoService.cs:65`). Si ARCA autoriza pero la persistencia de la factura falla, `FacturacionService.cs:112-117` relanza la excepción: la respuesta es error (500, no `ExternalServiceException`) con el pago ya `Aprobado`, y el CAE puede quedar sin guardar. El front no recibe el `id` en ese caso. Ver Dudas 6.

### 10.2 `GET /api/pagos/{id}`

- **Estado:** Implementado (US-F4-03).
- **Auth:** `Politicas.Empleado`. Origen: `PagosController.cs:38-41`.
- **Request:** `id` (uuid) en la ruta.
- **Response:** `200` con `PagoResponse`.

```ts
// Response 200
PagoResponse
```

- **Errores:** 404 `"El pago no existe."` (`PagoService.cs:85`); 401; 403.

### 10.3 `GET /api/pagos/{id}/factura`

- **Estado:** Implementado (US-F4-03).
- **Auth:** `Politicas.Empleado`. Origen: `PagosController.cs:44-47`.
- **Response:** `200` con `FacturaResponse` (incluye `PENDIENTE_CAE`).

```ts
// Response 200
FacturaResponse
```

- **Errores:** 404 `"No se encontró la factura del pago."` (`PagoService.cs:107-108`); 401; 403.

### 10.4 `POST /api/pagos/{id}/conciliar`

- **Estado:** Implementado (US-F4-06).
- **Auth:** `Politicas.Empleado`. Origen: `PagosController.cs:19-25`.
- **Request:** sin cuerpo.
- **Response:** `200` con `PagoResponse`.
- **Errores:**
  - 400 si el medio no es `PASARELA` (`PagoService.cs:35-36`; `docs/conciliacion-pagos.md:9`).
  - 404 si el pago no existe.
  - 502 si la pasarela responde estado o importe inválidos, o datos de otro pago (`PagoService.cs:43-47`).
  - 503 con `Retry-After` si expira el lock (`docs/conciliacion-pagos.md:24-25`).
- **Notas:** es la única forma de forzar la consulta a la pasarela desde el back. El front de cliente **no** la usa.

### 10.5 `POST /api/publico/factura`

- **Estado:** Implementado (US-F4-03).
- **Auth:** público (`[AllowAnonymous]` heredado de `PublicoController.cs:12`), límite RN20 (10/min por IP). Origen: `PublicoPagosController.cs:14-20`.
- **Request:** `PublicoFacturaRequest`.
- **Response:** `200` con `FacturaResponse`.

```ts
// Request
PublicoFacturaRequest // { dni: string; numeroPago: string }

// Response 200
FacturaResponse
```

- **Errores:**
  - 400 por validación (`dni` no son 8 dígitos; `numeroPago` vacío o > 20).
  - 404 `"No se encontró un registro con los datos indicados."` si el DNI no existe, el número no corresponde a ese cliente, o el pago no tiene factura (`VerificadorPublico.cs:17-18, :32-40`; `PagoService.cs:116-117`). **Mensaje idéntico en todos los casos (RN20).**
  - 429 si supera el límite (`PublicoRateLimitExtensions.cs:74-86`).
- **Notas:** el número de pago (`PAG-xxxxxx`) lo devuelve `POST /api/publico/pagos` en `numeroPago`.

### 10.6 `POST /api/publico/pagos`

- **Estado:** Implementado (US-F4-04).
- **Auth:** público (`PublicoController.cs:12`), límite RN20. Origen: `PublicoPagosController.cs:23-30`.
- **Request:** `PagoPublicoRequest`.
- **Response:** `201 Created` con `PagoPublicoResponse` (sin `Location`).

```ts
// Request
PagoPublicoRequest // { dni, numeroPoliza, cuotaIds, proveedor }

// Response 201
PagoPublicoResponse // { numeroPago, idPago, urlPago, fechaExpiracion }
```

- **Errores:**
  - 400 por validación de DataAnnotations (DNI, póliza, `cuotaIds` 1..24, `proveedor` ≤ 30).
  - 400 `"El proveedor de pago indicado no existe."` (`PagoService.cs:138`).
  - 400 `"Todas las cuotas deben pertenecer a la póliza indicada."` (`:175`).
  - 400 `"Solo se pueden pagar cuotas pendientes o vencidas (RN11)."` (`:177`).
  - 400 `"Alguna de las cuotas ya tiene un pago en curso. Intente de nuevo más tarde."` (`:194`).
  - 400 `"Las cuotas no pueden repetirse."` (`:171`).
  - 404 genérico si DNI + póliza no coinciden (`VerificadorPublico.cs:21-29`).
  - 429 por RN20.
  - 502 si la pasarela falla; el pago queda `RECHAZADO` y las cuotas no cambian (`PagoService.cs:210-221`).
- **Notas:**
  - `fechaExpiracion` es el vencimiento del link de la pasarela, no la ventana de reserva de 60 min (`ReservaMinutos`). Son dos plazos distintos.
  - Las URLs de retorno no las envía el front ni las recibe por request (`PagoService.cs:206-208`).

---

## 11. Fuera del alcance del front

- `POST /api/webhooks/pasarela/{proveedor}` (`WebhooksController.cs:16-29`): lo llama la pasarela con `X-Api-Key`. El front no lo consume (sección 5, paso 5).
- `GET /api/externo/clientes/{dni}/deuda` (`DeudaExternaController.cs:14-19`): para sistemas externos con API key. El front no lo consume.
- `PagoFacilController` (`/api/pagofacil/*`, `Politicas.Empleado`, `PagoFacilController.cs:15-16`): cupón, rendiciones y base positiva. No es parte de la web pública ni de este contrato.

---

## 12. Dudas

1. **Estado público del pago (bloqueante para la pantalla de resultado).** No hay endpoint público que devuelva `PENDIENTE` / `APROBADO` / `RECHAZADO`. El único punto público es `POST /api/publico/factura`, que da 404 tanto para pendiente como para rechazado. Opciones:
   - A) Agregar `GET` público (por ejemplo `POST /api/publico/pagos/estado` con `dni` + `numeroPago`, mismo mensaje genérico RN20) que devuelva `estado` y `factura?`. Requiere tarea de back. Ventaja: el front distingue rechazado de pendiente. Costo: una superficie pública más, que ya cuenta contra el límite de 10/min.
   - B) Dejar el polling sobre `/api/publico/factura` y tratar 404 como "pendiente". Sin tarea de back. Costo: un pago rechazado quedaría en "pendiente" para siempre.
2. **Parámetros del redirect de retorno.** `Pagos:UrlRetornoExito` / `UrlRetornoError` son fijas (`PagoOnlineOpciones.cs:19, :24`) y el back no agrega `numeroPago` ni `idPago`. ¿La pasarela agrega algún parámetro al redirigir? `NO DEFINIDO`. Sin eso, la página de retorno no sabe qué pago consultar.
3. **Descarga de factura en PDF.** No hay endpoint. `ArcaFacturaResponse.UrlPdf` (`ArcaDtos.cs:32`) no se mapea a `FacturaResponse`. ¿Se agrega `urlPdf` o un endpoint de descarga?
4. **Pagos abandonados.** No hay job que pase `PENDIENTE` a `RECHAZADO`. Un pago abandonado bloquea las cuotas 60 min, luego permite un pago nuevo, pero el viejo puede acreditarse después y quedar como excedente con revisión manual (sin factura). ¿Debe haber un vencimiento de pagos pendientes? Es decisión de negocio.
5. **Caja: efectivo u otro medio.** El back no distingue la forma de pago (`PagoCajaRequest.cs:8-10`, siempre `CAJA`). ¿Hace falta el campo?
6. **Caja: error con pago ya aprobado.** Si la persistencia de la factura falla después de que ARCA autorizó (`FacturacionService.cs:112-117`), el pago queda `APROBADO`, el cliente recibe error sin `id` y el CAE puede quedar sin guardar. La spec solo dice que los errores posteriores dejan un registro para conciliación manual (`docs/aprobacion-pagos.md:54-56`), sin procedimiento. ¿Qué respuesta recibe el front y cómo se localiza el pago?
7. **Búsqueda de pagos por cuota o póliza.** No hay endpoint para encontrar un pago a partir de sus cuotas. Esto deja sin recuperación al empleado si perdió la respuesta de caja (sección 9.3).
8. **Pantalla "Elegir medio de pago".** Etiquetas, orden y nombres comerciales de `pasarela1` / `pasarela2`: `NO DEFINIDO` en el repo. Hace falta leer la pantalla en Figma (`docs/frontend/pantallas/W*.md` todavía no existe).
9. **Cupón público de Pago Fácil.** `AnalisisBack.md` §7 (línea 551) lista `POST /api/publico/cupon`, pero el código solo tiene el cupón para empleados. ¿Se implementa para la web pública o se quita de la spec?
10. **Expiración de checkout en mock.** El mock devuelve `fechaExpiracion` = ahora + 1 h (`PasarelaMockService.cs:30`). La real la define la pasarela (US-F4-08). Hasta entonces el front no debe mostrar un temporizador basado en el mock.
11. **Doc de convenciones transversales.** `00-decisiones-base.md` (FB4) referencia `contratos-api/convenciones-transversales.md`, que no existe. Mientras tanto, la sección 2 de este documento es la fuente.
12. **Cupón y pago para la misma cuota.** Un cupón de Pago Fácil para una cuota `Pendiente` ya vencida suma recargo (`Application/PagoFacil/CuponPagoFacilService.cs:44-46`), mientras que el pago online o de caja usa el `Recargo` guardado en la cuota, que puede ser cero si el job no corrió (`Pago.cs:26`). Para la misma cuota, los importes pueden diferir. ¿Se unifica el cálculo?

---

## 13. Resumen endpoint → estado

| Endpoint | Método | Auth | Estado | Respuesta éxito |
|----------|--------|------|--------|-----------------|
| `/api/pagos/caja` | POST | Empleado | Implementado | 201 `PagoResponse` |
| `/api/pagos/{id}` | GET | Empleado | Implementado | 200 `PagoResponse` |
| `/api/pagos/{id}/factura` | GET | Empleado | Implementado | 200 `FacturaResponse` |
| `/api/pagos/{id}/conciliar` | POST | Empleado | Implementado | 200 `PagoResponse` |
| `/api/publico/pagos` | POST | Público (RN20) | Implementado | 201 `PagoPublicoResponse` |
| `/api/publico/factura` | POST | Público (RN20) | Implementado | 200 `FacturaResponse` |
| `/api/webhooks/pasarela/{proveedor}` | POST | API key | Implementado (fuera de alcance front) | 200 `{ recibido: true }` |
| `/api/externo/clientes/{dni}/deuda` | GET | API key | Implementado (fuera de alcance front) | 200 |

---

## Anexo A. Ruta completa de los archivos citados

Todas las rutas son relativas a la raíz del repo. Las citas de este documento usan solo el nombre del archivo.

| Cita | Ruta |
|------|------|
| `PagosController.cs` | `backend/Aseguradora.Api/Controllers/PagosController.cs` |
| `PublicoPagosController.cs` | `backend/Aseguradora.Api/Controllers/PublicoPagosController.cs` |
| `PublicoController.cs` | `backend/Aseguradora.Api/Controllers/PublicoController.cs` |
| `WebhooksController.cs` | `backend/Aseguradora.Api/Controllers/WebhooksController.cs` |
| `DeudaExternaController.cs` | `backend/Aseguradora.Api/Controllers/DeudaExternaController.cs` |
| `PagoFacilController.cs` | `backend/Aseguradora.Api/Controllers/PagoFacilController.cs` |
| `Program.cs` | `backend/Aseguradora.Api/Program.cs` |
| `ExceptionMiddleware.cs` | `backend/Aseguradora.Api/Middleware/ExceptionMiddleware.cs` |
| `PublicoRateLimitExtensions.cs` | `backend/Aseguradora.Api/Security/PublicoRateLimitExtensions.cs` |
| `AuthenticationExtensions.cs` | `backend/Aseguradora.Api/Security/AuthenticationExtensions.cs` |
| `VencimientosJob.cs` / `ReintentoFacturasJob.cs` | `backend/Aseguradora.Api/BackgroundJobs/` |
| `PagoService.cs` | `backend/Aseguradora.Application/Services/PagoService.cs` |
| `AprobacionPagoService.cs` | `backend/Aseguradora.Application/Services/AprobacionPagoService.cs` |
| `FacturacionService.cs` | `backend/Aseguradora.Application/Services/FacturacionService.cs` |
| `WebhookPagoService.cs` | `backend/Aseguradora.Application/Services/WebhookPagoService.cs` |
| `PagoOnlineOpciones.cs` | `backend/Aseguradora.Application/Services/PagoOnlineOpciones.cs` |
| `VencimientosService.cs` | `backend/Aseguradora.Application/Services/VencimientosService.cs` |
| `NumeroPago.cs` | `backend/Aseguradora.Application/Services/NumeroPago.cs` |
| `VerificadorPublico.cs` | `backend/Aseguradora.Application/Publico/VerificadorPublico.cs` |
| `PagoCajaRequest.cs`, `PagoPublicoRequest.cs`, `PagoPublicoResponse.cs`, `PagoResponse.cs`, `FacturaResponse.cs`, `PublicoFacturaRequest.cs`, `ValoresPagoResponse.cs`, `ArcaDtos.cs`, `PasarelaDtos.cs` | `backend/Aseguradora.Application/Dtos/` |
| `CuponPagoFacilService.cs`, `RendicionService.cs` | `backend/Aseguradora.Application/PagoFacil/` |
| `Pago.cs`, `PagoCuota.cs`, `Factura.cs`, `Cuota.cs` | `backend/Aseguradora.Domain/Entities/` |
| `MedioPago.cs`, `EstadoPago.cs`, `EstadoFactura.cs`, `EstadoCuota.cs` | `backend/Aseguradora.Domain/Enums/` |
| `PasarelaMockService.cs`, `PasarelaResolver.cs` | `backend/Aseguradora.Integrations/Pasarela/` |
| `UnitOfWork.cs` | `backend/Aseguradora.Data/Repositories/UnitOfWork.cs` |
| `PublicoConsultaControllerTests.cs` | `backend/Aseguradora.Tests/Api/PublicoConsultaControllerTests.cs` |
| `PublicoPagosControllerTests.cs` | `backend/Aseguradora.Tests/Pagos/PublicoPagosControllerTests.cs` |
| Documentos `*.md` | `docs/` (`aprobacion-pagos.md`, `pagos-caja.md`, `webhook-pasarela.md`, `conciliacion-pagos.md`, `reintento-facturas.md`, `pagos-mocks.md`), `docs/AnalisisBack.md`, `docs/tareas-divididas.md` |
