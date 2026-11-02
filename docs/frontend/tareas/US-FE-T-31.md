# US-FE-T-31: API pública

Tipo T · Oleada 2 · Tamaño M · Rama sugerida `feature/US-FE-T-31-api-publica` · Tarjeta Trello `US-FE-T-31`.

## 1. Objetivo

Dejar tipados, con función de request, y handlers MSW, los endpoints de la web pública sin login (`/api/publico/*`): consulta de póliza, pago online y factura (implementados), y cupón, estado del pago y medios de pago (mock, no existen en el back). Consumidores: W-03 (consulta), W-06 (medio de pago), W-07 (cupón) y W-08 (pago aprobado).

Todas las rutas `/api/publico/*` comparten un límite de 10 requests por minuto por IP (RN20). **Ninguna se reintenta** (FC13).

## 2. Alcance

**Entra**
- `dto/publico.ts` (dueño T-31): `ConsultaPublicaRequest`, `ConsultaPublicaResponse` (con `PlanPublico`, `VehiculoPublico`, `CuotaPublica`), `PagoPublicoRequest`, `PagoPublicoResponse`, `PublicoFacturaRequest`, y los mock de PB-01, PB-02 y PB-22. Copia `FacturaResponse` y `CuponPagoFacilResponse` (RV-D09 b).
- `endpoints/publico.ts`: `consultarPoliza`, `crearPagoPublico`, `obtenerFacturaPublica`, y los mock `cuponPublicoMock`, `estadoPagoPublicoMock`, `listarMediosPagoMock`.
- Claves: `publicoKeys.mediosPago()` (mock) y `publicoKeys.cupon(numeroPoliza, cuotaId)`, exportadas en `endpoints/publico.ts` junto al handler y usadas por W-07 (RV-28, triage final: `pagoFacilKeys` es solo de T-30, para no exportar el mismo nombre dos veces).
- MSW en `mocks/handlers/publico.ts`.

**NO entra**
- Hooks: los escriben W-03, W-06, W-07 y W-08 en sus `features/*/api/` (FC2). Cada hook es `useMutation` (ver §7).
- Tipos de `location.state` entre pantallas: los define W-03.
- Límite de intentos en la UI (texto fijo de 60 s): lo implementa W-03 (D-32).
- Cupón del empleado (`GET /api/pagofacil/cuotas/{id}/cupon`): T-30.

## 3. Dependencias

- **Depende de:** US-FE-T-08, US-FE-T-11, US-FE-T-12.
- **Oleada:** 2.
- **Puede empezar sin esperar a:** US-FE-W-03, US-FE-W-07.
- **Bloqueada por pedidos al back (PB-NN):** PB-01, PB-02, PB-22 (MSW), PB-17 (degrada: sin `Retry-After` en 429, texto fijo de 60 s).
- **Workaround MSW:** tres endpoints mock. W-06 usa `proveedor` interno con opciones fijas (D-09).

## 4. Documentos a leer

- `contratos-api/seguridad-clientes-publico.md` §1.1 (JSON), §1.2 (formas de error), §1.4 (RN20: 10 por minuto, sin `Retry-After`, no reintentar), §4.1 (DNI y número de póliza: regex), §4.2 (mensajes en inglés), §5 (RN10, RN20), §6.1 (identificación sin login), §6.2 (request), §6.3 (response y estados), §6.4 (estados), §6.5 (errores), §8 (no aplica), D9.
- `contratos-api/pagos-facturas.md` §2.2 (errores), §3 (tipos: `PagoPublicoRequest`, `PagoPublicoResponse`, `PublicoFacturaRequest`), §5 (flujo online, pasos 1 a 7), §9.1, §9.2 (no reintentar POST de pago), §10.5, §10.6, §12 duda 1 (estado público del pago).
- `contratos-api/polizas-cuotas-pagofacil.md` §6.1 (cupón), §6.2 (importes y fechas de cupón).
- `pedidos-al-back.md` PB-01, PB-02, PB-07, PB-17, PB-21, PB-22.
- `pantallas/W2-consultar-poliza.md` (consulta; 404 y 429), `pantallas/W4-elegir-medio-pago.md` (medios y doble clic; D2), `pantallas/W5-cupon-pago-facil.md` (cupón; D4, D5), `pantallas/W6-pago-aprobado.md` (estado; D5, D6).
- `00-decisiones-base.md` FB4, FB7.9, FB7.11. Almacenamiento y ausencia de cookies: `tareas/INDEX.md` FC12.
- `tareas/INDEX.md` FC2, FC3, FC5, FC10, FC11, FC12, FC13; decisiones D-04, D-05, D-06, D-09, D-22, D-32.
- Back: `backend/Aseguradora.Api/Controllers/PublicoController.cs` (`[AllowAnonymous]`, `[Route("api/publico")]`), `PublicoConsultaController.cs` (`[HttpPost("consulta")]`), `PublicoPagosController.cs` (`[HttpPost("factura")]`, `[HttpPost("pagos")]`). DTO verificados: `Application/Dtos/PagoPublicoRequest.cs` (`string Dni`, `string NumeroPoliza` (20), `List<Guid> CuotaIds` (1 a 24), `string Proveedor` (30)), `PagoPublicoResponse.cs` (record), `PublicoFacturaRequest.cs` (`Dni`, `NumeroPago`).

## 5. Archivos a crear o modificar

| Archivo | Acción |
|---|---|
| `packages/api/src/dto/publico.ts` | nuevo (dueño T-31) |
| `packages/api/src/endpoints/publico.ts` | nuevo |
| `packages/api/mocks/handlers/publico.ts` | nuevo (dueño T-31) |
| `packages/api/test/contract/publico.contract.test.ts` | nuevo (RV-D31) |
| `packages/api/src/index.ts` | bloque de export (dueño T-12) |

No se edita ningún `package.json` ni `apps/*`.

## 6. Pasos de implementación

1. Confirmar con T-08 el cliente (`POST` con JSON) y que T-08 no reintenta.
2. Copiar en `dto/publico.ts` `FacturaResponse` y `CuponPagoFacilResponse` con la forma de T-29 y T-30 (RV-D09 b). T-23 valida la forma contra el contrato.
3. Escribir `dto/publico.ts` con los tipos de §7.
4. Escribir las tres funciones reales y las tres mock. Ninguna reintenta.
5. Exportar `publicoKeys.mediosPago()` solo para el mock de medios.
6. Escribir handlers y tests (§10). Las variantes de 429 no tienen `Retry-After`.
7. Correr `lint`, `typecheck`, `test`.

## 7. Contrato con el back

Política: anónimo (`[AllowAnonymous]`). Límite RN20: **10 requests por minuto por IP** para **todo** `/api/publico/*` (consulta, pagos, factura y cupón comparten el contador). Exceso: 429 con `detail` fijo, **sin `Retry-After`** (PB-17).

Regla de UI: un 429 se muestra con texto fijo de espera de 60 s (D-32). No se reintenta. Un 400 también consume cupo (contrato §6.5).

Formato: `estado` de la consulta y de las cuotas son strings en **mayúsculas** (`VIGENTE`, `PENDIENTE`, `VENCIDA`, `PAGADA`, `ANULADA`, `SUSPENDIDA`, `CANCELADA`). `estado` del pago es string (`PENDIENTE`, `APROBADO`, `RECHAZADO`). No son números.

```ts
// dto/publico.ts
// Copias de dto/pagos.ts (T-29) y dto/pagofacil.ts (T-30), RV-D09 (b).
export interface FacturaResponse {
  id: string;
  pagoId: string;
  numero: string;
  tipo: 'B';
  importe: number;
  estado: 'PENDIENTE_CAE' | 'AUTORIZADA';
  cae: string | null;
  vencimientoCae: string | null;
  fechaEmision: string;
}

export interface CuponPagoFacilResponse {
  cuotaId: string;
  numeroPoliza: string;
  numeroCuota: number;
  importePrimerVencimiento: number;
  fechaPrimerVencimiento: string;
  importeSegundoVencimiento: number;
  fechaSegundoVencimiento: string;
  codigoBarras: string;
}

export interface ConsultaPublicaRequest {
  dni: string;               // ^\d{8}$. Sin trim en el back: recortar antes
  numeroPoliza: string;      // ^POL-\d{7}$. Distingue mayúsculas: normalizar
}

export type EstadoPolizaPublico = 'PENDIENTE' | 'VIGENTE' | 'SUSPENDIDA' | 'CANCELADA' | 'VENCIDA';
export type EstadoCuotaPublica = 'PENDIENTE' | 'VENCIDA' | 'PAGADA' | 'ANULADA';

export interface PlanPublico { codigo: string; nombre: string; }
export interface VehiculoPublico { patente: string; marca: string; modelo: string; anio: number; }

export interface CuotaPublica {
  idCuota: string;           // único id expuesto; lo necesita POST /api/publico/pagos
  numero: number;
  importe: number;
  recargo: number;           // 0 hasta que venza
  total: number;             // importe + recargo
  vencimiento: string;       // "yyyy-MM-dd"
  estado: EstadoCuotaPublica;
}

export interface ConsultaPublicaResponse {
  numeroPoliza: string;
  estado: EstadoPolizaPublico;
  coberturaVigente: boolean; // true solo si estado === 'VIGENTE' (RN10)
  vigenteDesde: string;      // "yyyy-MM-dd"
  vigenteHasta: string;      // "yyyy-MM-dd"
  plan: PlanPublico;
  vehiculo: VehiculoPublico;
  cuotas: CuotaPublica[];    // ordenadas por numero
}

export interface PagoPublicoRequest {
  dni: string;               // ^\d{8}$
  numeroPoliza: string;      // máx. 20
  cuotaIds: string[];        // 1 a 24, de una sola póliza
  proveedor: 'pasarela1' | 'pasarela2';   // cualquier otro valor da 400
}

export interface PagoPublicoResponse {
  numeroPago: string;        // "PAG-xxxxxx". Lo pide la factura
  idPago: string;
  urlPago: string;           // link de checkout de la pasarela
  fechaExpiracion: string;   // ISO UTC; vencimiento del link, no la reserva de 60 min
}

export interface PublicoFacturaRequest {
  dni: string;               // ^\d{8}$
  numeroPago: string;        // máx. 20
}

export type FacturaPublica = FacturaResponse;   // respuesta 200 de POST /api/publico/factura
```

### 7.1 `POST /api/publico/consulta`

- **Estado:** Implementado. **Response:** 200 con `ConsultaPublicaResponse`.
- **Función:** `consultarPoliza(body: ConsultaPublicaRequest): Promise<ConsultaPublicaResponse>`.
- **Hook (lo escribe W-03):** `useConsultarPoliza()`, `useMutation`, **`retry: 0`** (contrato §1.4: es POST, no debe reintentar).
- **MSW:** `http.post('*/api/publico/consulta')`. Éxito: respuesta del contrato §6.3 (POL-0000001, VIGENTE). Variantes: `consultaNoEncontrada` (404), `consultaDniInvalido` (400 con `errors.Dni`), `consultaNumeroInvalido` (400 con `errors.NumeroPoliza`), `consulta429` (429), `sinCuerpoEnTransporte` (500).

| Status | Forma | Cuándo | Texto |
|---|---|---|---|
| 400 | `ValidationProblemDetails` | DNI con formato inválido | `errors.Dni` = `"El DNI debe tener 8 dígitos."` |
| 400 | `ValidationProblemDetails` | número con formato inválido | `errors.NumeroPoliza` = `"El número de póliza debe tener el formato POL-0000000."` |
| 400 | `ValidationProblemDetails` | campo ausente o vacío | texto ASP.NET en inglés (PB-15): mostrar texto propio por clave |
| 404 | `ProblemDetails` | DNI, número o pertenencia no coinciden (RN20, mismo mensaje) | `"No se encontró un registro con los datos indicados."` |
| 429 | `ProblemDetails` | cupo agotado (RN20) | `"Se superó el límite de intentos. Volvé a intentarlo en un minuto."` (sin `Retry-After`) |
| 500 | `ProblemDetails` | error no previsto | `"Ocurrió un error inesperado."` |

### 7.2 `POST /api/publico/pagos`

- **Estado:** Implementado (US-F4-04). **Response:** 201 con `PagoPublicoResponse` (sin `Location`).
- **Función:** `crearPagoPublico(body: PagoPublicoRequest): Promise<PagoPublicoResponse>`.
- **Hook (lo escribe W-06):** `useCrearPagoPublico()`, `useMutation`, **`retry: 0`**. El botón se deshabilita (doble clic bloqueado, FB7.9, `pagos-facturas.md` §9.2). No se reenvía tras error de red.
- **Después del éxito:** la pantalla guarda `numeroPago` en `sessionStorage` (solo ese dato, FC12) y redirige con `window.location.assign(urlPago)`.
- **MSW:** `http.post('*/api/publico/pagos')`. Éxito: 201 con el ejemplo de `pagos-facturas.md` §5 (paso 2). Variantes: `pagoProveedorInvalido`, `pagoCuotasDeOtraPoliza`, `pagoCuotaNoPagable`, `pagoEnCurso` (reserva de 60 min), `pagoCuotasRepetidas`, `pagoNoEncontrado` (404), `pagoRateLimit` (429), `pagoPasarelaCaida` (502), `pagoValidacion` (400 con `errors.CuotaIds`).

| Status | Forma | Cuándo | Texto |
|---|---|---|---|
| 400 | `ValidationProblemDetails` | DNI, número, cuotas (1 a 24) o proveedor fuera de regla | `errors.Dni`, `errors.CuotaIds` (`"Debe indicar al menos una cuota."` o `"Demasiadas cuotas en un solo pago."`), `errors.Proveedor` |
| 400 | `ProblemDetails` | proveedor no existe | `"El proveedor de pago indicado no existe."` |
| 400 | `ProblemDetails` | cuotas de otra póliza | `"Todas las cuotas deben pertenecer a la póliza indicada."` |
| 400 | `ProblemDetails` | cuota pagada o anulada | `"Solo se pueden pagar cuotas pendientes o vencidas (RN11)."` |
| 400 | `ProblemDetails` | cuota con pago en curso (reserva de 60 min) | `"Alguna de las cuotas ya tiene un pago en curso. Intente de nuevo más tarde."` |
| 400 | `ProblemDetails` | cuotas repetidas | `"Las cuotas no pueden repetirse."` |
| 404 | `ProblemDetails` | DNI y póliza no coinciden (RN20) | `"No se encontró un registro con los datos indicados."` |
| 429 | `ProblemDetails` | cupo agotado | `"Se superó el límite de intentos. Volvé a intentarlo en un minuto."` |
| 502 | `ProblemDetails` | pasarela falla; el pago queda RECHAZADO y las cuotas no cambian | texto de la excepción, no fijo |

### 7.3 `POST /api/publico/factura`

- **Estado:** Implementado (US-F4-03). **Response:** 200 con `FacturaResponse`.
- **Función:** `obtenerFacturaPublica(body: PublicoFacturaRequest): Promise<FacturaPublica>`.
- **Hook (lo escribe W-08):** `useFacturaPublica()`, `useMutation`, **`retry: 0`**. No hay polling automático: una consulta por acción del cliente (RN20: 10 por minuto).
- **Lectura del 404:** un 404 significa pendiente, rechazado o DNI/número incorrectos. **No se distingue** (contrato §5 paso 6). W-08 usa `consultarPoliza` para el resto (T-31, §7.1) o `obtenerEstadoPagoMock` para el estado de PB-01.
- **MSW:** `http.post('*/api/publico/factura')`. Éxito: 200 con factura `AUTORIZADA`. Variantes: `facturaNoEncontrada` (404), `facturaValidacion` (400 con `errors.NumeroPago`), `facturaRateLimit` (429), `facturaPendienteCae` (200 con `PENDIENTE_CAE`).

| Status | Forma | Cuándo | Texto |
|---|---|---|---|
| 400 | `ValidationProblemDetails` | DNI no son 8 dígitos o número vacío o mayor de 20 | `errors.Dni`, `errors.NumeroPago` (texto ASP.NET o `"El DNI debe tener 8 dígitos."`) |
| 404 | `ProblemDetails` | DNI, número, o pago sin factura (mismo mensaje) | `"No se encontró un registro con los datos indicados."` |
| 429 | `ProblemDetails` | cupo agotado | `"Se superó el límite de intentos. Volvé a intentarlo en un minuto."` |

### 7.4 Mock de cupón público (PB-02, MOCK)

- **Estado:** **Especificado**, no existe en el back (`POST /api/publico/cupon` no está en `Controllers/`).
- **Request propuesta:** `CuponPublicoRequest { dni, numeroPoliza, numeroCuota }`. **Response propuesta:** `CuponPagoFacilResponse` más `totalCuotas` (PB-02, decisión asociada).
- **Función mock:** `cuponPublicoMock(body): Promise<CuponPublicoRespuestaMock>`. **Hook (lo escribe W-07):** `useCuponPublico()`, `useMutation`, `retry: 0`.
- **Errores propuestos (PB-02):** 404 genérico (mismo mensaje de consulta) si DNI y póliza no coinciden o la cuota no pertenece; 400 si la cuota está `Pagada` o `Anulada` (texto a definir, D-31-2); 429.

```ts
// dto/publico.ts (MOCK, PB-02)
export interface CuponPublicoRequest { dni: string; numeroPoliza: string; numeroCuota: number; }
export interface CuponPublicoRespuestaMock extends CuponPagoFacilResponse {
  totalCuotas: number | null;   // "9 de 12" en W-05; hoy no hay dato
}
```

- **MSW:** `http.post('*/api/publico/cupon')`. Éxito: cupón con `fechaSegundoVencimiento` del DTO (no la del Figma, D-05). Variantes: `cuponNoEncontrado` (404), `cuponCuotaPagada` (400), `cupon429` (429).

### 7.5 Mock de estado del pago (PB-01, MOCK)

- **Estado:** **NO EXISTE**. Implementador: solo el handler.
- **Request propuesta:** `ConsultaEstadoPagoRequest { dni, numeroPago }` (DNI en el cuerpo, nunca en la URL). **Response propuesta:** `EstadoPagoPublicoMock { numeroPago, estado: EstadoPago, fechaAcreditacion, urlPago, factura }`.
- **Función mock:** `estadoPagoPublicoMock(body): Promise<EstadoPagoPublicoMock>`. **Hook (lo escribe W-08):** `useEstadoPagoPublico()`, `useMutation`, `retry: 0`.
- **Errores propuestos:** 404 genérico; 429.

```ts
// dto/publico.ts (MOCK, PB-01)
export interface ConsultaEstadoPagoRequest { dni: string; numeroPago: string; }
export interface EstadoPagoPublicoMock {
  numeroPago: string;
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  fechaAcreditacion: string | null;
  urlPago: string | null;       // solo si PENDIENTE y no expiró
  factura: FacturaPublica | null;
}
```

- **MSW:** `http.post('*/api/publico/pagos/estado')`. Éxito: `APROBADO` con factura. Variantes: `estadoPendiente`, `estadoRechazado`, `estadoNoEncontrado` (404), `estado429` (429).

### 7.6 Mock de medios de pago (PB-22, MOCK)

- **Estado:** **NO EXISTE**. Único implementador: el handler.
- **Response propuesta:** `MedioPagoPublicoMock[]`. **Función mock:** `listarMediosPagoMock(): Promise<MedioPagoPublicoMock[]>`. **Clave:** `publicoKeys.mediosPago()`. **Hook (lo escribe W-06):** `useMediosPagoPublicos()`, `useQuery`, con `staleTime` largo (no cambia por sesión).

```ts
// dto/publico.ts (MOCK, PB-22)
export interface MedioPagoPublicoMock {
  proveedor: 'pasarela1' | 'pasarela2';
  nombre: string;               // nombre comercial: NO DEFINIDO (D-22, PB-22)
  orden: number;
  activo: boolean;
}
```

- **MSW:** `http.get('*/api/publico/medios-pago')`. Éxito: dos opciones con `nombre` provisional "Pasarela A" y "Pasarela B" (D-09), `proveedor` interno. Variante `mediosPagoVacios` (200 con `[]`).

## 8. Contenido de UI

No aplica (sin UI). Textos del back que muestran W-02 a W-08 tal cual (`detail`, FC10). El texto fijo de espera de 60 s para 429 lo define W-03 (D-32). Referencias: `pantallas/W2-consultar-poliza.md`, `pantallas/W4-elegir-medio-pago.md`, `pantallas/W5-cupon-pago-facil.md`, `pantallas/W6-pago-aprobado.md`.

## 9. Estados y casos borde

- **RN20, cupo compartido:** consulta, pago, factura y cupón suman al mismo contador por IP. Un cliente que consulta 10 veces queda sin pagar hasta 60 s. La UI no reintenta.
- **404 genérico:** no se distingue DNI, número o pertenencia (RN20). No mostrar pistas.
- **Pago, doble clic:** botón deshabilitado. Un segundo POST dentro de la reserva da 400 "en curso".
- **Pago, corte de red tras el 201:** se pierde `urlPago`. Persistir `numeroPago` antes de redirigir (contrato §5 paso 3) y no reenviar a ciegas.
- **Pago rechazado:** la consulta de factura da 404, igual que pendiente. No hay forma de mostrar "rechazado" con datos reales (PB-01).
- **Vuelta sin pagar:** el pago queda `PENDIENTE` sin job de vencimiento (contrato §5 paso 7).
- **Fechas:** `fechaExpiracion` es la del link, no un temporizador (D10 del contrato de pagos). `vencimiento` de cuotas en `yyyy-MM-dd`.
- **Doble envío de consulta:** no hay idempotencia (PB-12). Mitigación: botón deshabilitado.

## 10. Tests requeridos

Vitest + MSW. Un test por forma de error (FC5). Los errores de 400 con `it.each` por clave.

1. `POST consulta devuelve ConsultaPublicaResponse VIGENTE con coberturaVigente true`.
2. `POST consulta no envía Authorization` (anónimo).
3. `POST consulta devuelve 400 con errors.Dni "El DNI debe tener 8 dígitos."`.
4. `POST consulta devuelve 400 con errors.NumeroPoliza "El número de póliza debe tener el formato POL-0000000."`.
5. `POST consulta devuelve 404 con el mensaje genérico`.
6. `POST consulta devuelve 429 con detail fijo y sin Retry-After`.
7. `POST consulta no reintenta ante 429` (una request).
8. `POST pagos devuelve 201 con PagoPublicoResponse`.
9. `POST pagos devuelve 400 de negocio para cada detail de §7.2` (`it.each`, cinco textos).
10. `POST pagos devuelve 404 genérico`.
11. `POST pagos devuelve 429`.
12. `POST pagos devuelve 502 y no reintenta` (una request).
13. `POST pagos rechaza proveedor distinto de pasarela1 o pasarela2` (tipo y validación).
14. `POST factura devuelve FacturaResponse AUTORIZADA`.
15. `POST factura devuelve 404 genérico para pendiente y rechazado` (un solo mensaje).
16. `POST factura devuelve 400 con errors.Dni`.
17. `POST factura devuelve 429`.
18. `Mock cupón (PB-02) devuelve 400 para cuota pagada y 404 genérico` (marcado MOCK).
19. `Mock estado de pago (PB-01) usa DNI en el cuerpo y nunca en la URL`.
20. `Mock medios de pago (PB-22) devuelve nombres provisionales y no los fija en el código` (`it`).

## 11. Criterios de aceptación

1. Los tipos de §7 existen en `dto/publico.ts` con los nombres exactos y los valores de estado en mayúsculas.
2. Las tres funciones reales existen y ninguna reintenta.
3. Los cuatro mocks (cupón, estado, medios, y el tipo de factura) están marcados como MOCK.
4. Ninguna función lee `VITE_USE_MOCKS` ni agrega `Authorization`.
5. Los handlers tienen éxito por defecto y variantes con nombre para cada error de §7.
6. Los tests de §10 pasan en verde.
7. El barrel exporta solo el bloque de T-31.
8. `lint`, `typecheck`, `test`, `build` en verde.
9. Las tablas de error coinciden con `contratos-api/seguridad-clientes-publico.md` §6.5 y `contratos-api/pagos-facturas.md` §10.5 y §10.6.
10. `FacturaResponse` y `CuponPagoFacilResponse` existen en `dto/publico.ts` con la misma forma que T-29 y T-30 (RV-D09).

## 12. Verificación manual

Pasos para la persona responsable (regla 7), con el back local, seed y `VITE_USE_MOCKS=false`:

1. Consultar `POL-0000001` con DNI `30123456` en W-03: confirmar la respuesta VIGENTE y la lista de cuotas.
2. Consultar con un número incorrecto: confirmar el 404 con el mensaje genérico.
3. Repetir la consulta hasta superar 10 intentos en un minuto: confirmar el 429 con el texto fijo y que no hay reintento automático en la red.
4. Iniciar un pago online en W-06 con una cuota del seed: confirmar el 201 con `numeroPago` y la redirección a la pasarela mock.

Motivo: los tres endpoints reales están **Implementados** y RN20 solo se verifica con el back real.

## 13. Decisiones pendientes

- **D-31-1 (PB-02 y PB-01 y PB-22):** default: mocks solo en MSW; W-07, W-08 y el selector de W-06 quedan con el workaround hasta el PB.
- **D-31-2 (texto de la cuota pagada en cupón público):** default: a definir por diseño. No se inventa.
- **D-31-3 (polling de factura en W-08):** default: sin polling automático; una consulta por acción (RN20).
- **D-31-4 (`totalCuotas`):** default: opcional y `null` hasta PB-02.
- **D-22 y D-09 (nombres de pasarelas):** default: "Pasarela A" y "Pasarela B" con `proveedor` interno.
- **D-API-1 (hooks en features, FC2).** Default (RV-44): los hooks los escriben W-03, W-06, W-07 y W-08 en sus `features/*/api/`; `@nexa/api` solo exporta funciones, tipos y claves.

## 14. Riesgos y errores comunes

- **Reintento automático de consulta:** TanStack reintenta queries por defecto. Consume el cupo de 10 por minuto. Mitigación: `retry: 0` en todas las mutaciones de esta API (FC13).
- **429 sin `Retry-After`:** el texto fijo puede no coincidir con la espera real. Mitigación: D-32.
- **Mensajes en inglés (PB-15):** `errors` de campos ausentes llega en inglés. Mitigación: mapeo por clave.
- **Pago rechazado tratado como pendiente:** el 404 de factura es igual para ambos. Mitigación: no inferir estado desde el 404.
- **Número de póliza sensible a mayúsculas:** `pol-0000001` da 400. Mitigación: normalizar antes de enviar (W-03).
- **DNI con espacios:** da 400 y gasta cupo. Mitigación: recortar y validar antes de enviar.
- **Mock de PB-01 usado en producción:** mostraría `APROBADO` sin confirmación real. Mitigación: el hook solo se monta si el flag está activo y el PB está resuelto.

## 15. Definición de terminado

- `lint`, `typecheck`, `test`, `build` en verde (FC8).
- Sin secretos ni DNI en la URL. Sin `fetch` directo (FC13).
- Los 10 criterios de §11 con evidencia observada.
- Prueba manual de §12 confirmada por el usuario (regla 7).

## 16. Observaciones al índice

- Resuelto (RV-D09): T-31 copia `FacturaResponse` y `CuponPagoFacilResponse` en `dto/publico.ts`; no importa de T-29 ni T-30. Sin cambio de Ola (sigue en 2).
- ABIERTO: "W-07 y el cupón público: el contrato de PB-02 pide un campo adicional (`totalCuotas`)". Motivo: no aparece en REVISION.md ni en FB8; hoy queda como mock opcional (D-31-4).
- Resuelto (triage final, default de la ficha): "El INDEX no dice si T-08 reintenta `POST` por defecto; confirmar". Motivo: no aparece en REVISION.md ni en FB8. Esta tarea no agrega reintentos (FC11). Cierre: T-08 no reintenta `POST` (FB7, `retry: 0`).
