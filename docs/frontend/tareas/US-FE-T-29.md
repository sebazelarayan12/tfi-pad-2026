# US-FE-T-29: API pagos y factura

Tipo T · Oleada 2 · Tamaño M · Rama sugerida `feature/US-FE-T-29-api-pagos-factura` · Tarjeta Trello `US-FE-T-29`.

## 1. Objetivo

Dejar tipados, con función de request, claves de caché y handlers MSW, el cobro en caja y la consulta de pagos y facturas del empleado: `POST /api/pagos/caja`, `GET /api/pagos/{id}` y `GET /api/pagos/{id}/factura`. Incluye los mocks de listado de pagos (PB-05) y de PDF de factura (PB-11). Consumidores: B-17 (cobro y factura), B-18 (rail de cobro en la póliza), B-19 (listado).

Los tres endpoints reales están en `development` (PR #48).

## 2. Alcance

**Entra**
- `dto/pagos.ts` (dueño T-29): `EstadoPago`, `MedioPagoApi`, `EstadoFactura`, `PagoCajaRequest`, `PagoResponse`, `FacturaResponse`, y los mock de PB-05 y PB-11.
- `endpoints/pagos.ts`: `cobrarEnCaja`, `obtenerPago`, `obtenerFacturaDePago`, y los mock `listarPagosMock` y `listarPagosDePolizaMock`.
- Claves: `pagosKeys.detalle(id)`, `pagosKeys.factura(id)`, `pagosKeys.lista(filtro)` (mock), `pagosKeys.porPoliza(polizaId)` (mock).
- MSW en `mocks/handlers/pagos.ts`.

**NO entra**
- `POST /api/pagos/{id}/conciliar` (implementado en back, Empleado): no lo usa el front (contrato §10.4). Ver §16.
- Pago online y `POST /api/publico/factura`: T-31.
- Cupón de Pago Fácil y rendiciones: T-30.
- Hooks: los escriben B-17, B-18 y B-19 dentro de `features/pagos/api/` (FC2).

## 3. Dependencias

- **Depende de:** US-FE-T-08, US-FE-T-11, US-FE-T-12.
- **Oleada:** 2.
- **Puede empezar sin esperar a:** US-FE-B-17, US-FE-B-18.
- **Bloqueada por pedidos al back (PB-NN):** PB-05 (MSW), PB-11 (MSW, sin botón de PDF).
- **Workaround MSW:** `GET /api/pagos` y `GET /api/polizas/{id}/pagos` solo en el handler. `urlPdf` solo en el handler.

## 4. Documentos a leer

- `contratos-api/pagos-facturas.md` §2.1 (JSON), §2.2 (errores), §3 (tipos), §6.1 a §6.5 (caja: validaciones, respuesta, consultas), §7.1 a §7.4 (facturas), §8 (varias cuotas), §9.1 a §9.3 (idempotencia y doble clic), §10.1 a §10.3 (endpoints), §12 dudas 5, 6, 7 y 12.
- `contratos-api/convenciones-transversales.md` §5.3 (fechas), §5.4 (dinero).
- `pedidos-al-back.md` PB-05, PB-11, PB-12, PB-16, PB-25.
- `pantallas/B10-detalle-poliza.md` (cobro en caja y rail de cobro; D-14 forma de pago oculta), `pantallas/B11-pagos-y-facturas.md` (listado de pagos y factura; D-12 reintento oculto; #10 cuotas sin preseleccionar, D-19).
- `00-decisiones-base.md` FB4, FB7.9.
- `tareas/INDEX.md` FC2, FC3, FC5, FC9, FC10, FC11; decisiones D-12, D-14, D-19.
- Back: `backend/Aseguradora.Api/Controllers/PagosController.cs` (`[HttpPost("caja")]`, `[HttpGet("{id:guid}")]`, `[HttpGet("{id:guid}/factura")]`, `[Authorize(Policy = Politicas.Empleado)]` en la clase). DTO verificado: `Application/Dtos/PagoCajaRequest.cs` (`IReadOnlyList<Guid> CuotaIds`), `PagoResponse.cs` (record), `FacturaResponse.cs` (record).

## 5. Archivos a crear o modificar

| Archivo | Acción |
|---|---|
| `packages/api/src/dto/pagos.ts` | nuevo (dueño T-29) |
| `packages/api/src/endpoints/pagos.ts` | nuevo |
| `packages/api/mocks/handlers/pagos.ts` | nuevo (dueño T-29) |
| `packages/api/test/contract/pagos.contract.test.ts` | nuevo (RV-D31) |
| `packages/api/src/index.ts` | bloque de export (dueño T-12) |

No se edita ningún `package.json` ni `apps/*`.

## 6. Pasos de implementación

1. Confirmar con T-08, T-11 y T-12.
2. Escribir `dto/pagos.ts` con los tipos de §7. `EstadoPago`, `MedioPagoApi`, `EstadoFactura` son **strings** (no números).
3. Escribir las tres funciones reales y las dos mock. Ninguna reintenta.
4. Exportar `pagosKeys`.
5. Escribir los handlers: éxito por defecto y variantes con nombre (§7).
6. Escribir los tests de §10 y el bloque de export.
7. Correr `lint`, `typecheck`, `test`.

## 7. Contrato con el back

Política: `Politicas.Empleado`. Sin token: 401. Sin rol: 403.

Formato: `estado` y `medio` de `PagoResponse` y `estado` de `FacturaResponse` viajan como **string en mayúsculas** (`PENDIENTE`, `APROBADO`, `PASARELA`, `PAGO_FACIL`, `CAJA`, `PENDIENTE_CAE`, `AUTORIZADA`). No es el formato numérico de pólizas (contrato §5.1, PB-13). Los fechas `DateTime` vienen con `Z` (creadas en memoria) o sin él (leídas de la base); formatear con T-09.

```ts
// dto/pagos.ts
export type EstadoPago = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
export type MedioPagoApi = 'CAJA' | 'PASARELA' | 'PAGO_FACIL';
export type EstadoFactura = 'PENDIENTE_CAE' | 'AUTORIZADA';
export type TipoFactura = 'B';   // fijo hoy

export interface FacturaResponse {
  id: string;
  pagoId: string;
  numero: string;                 // "" mientras PENDIENTE_CAE: mostrar "Pendiente de numeración"
  tipo: TipoFactura;
  importe: number;                // total con IVA incluido
  estado: EstadoFactura;
  cae: string | null;             // 14 dígitos; null mientras PENDIENTE_CAE
  vencimientoCae: string | null;  // "yyyy-MM-dd"
  fechaEmision: string;           // ISO UTC con Z
}

export interface PagoResponse {
  id: string;
  clienteId: string;
  numero: string;                 // "PAG-" + 6 caracteres hex
  estado: EstadoPago;
  medio: MedioPagoApi;
  importe: number;
  fechaCreacion: string;
  fechaAcreditacion: string | null;
  factura: FacturaResponse | null;
}

export interface PagoCajaRequest {
  cuotaIds: string[];             // mínimo 1. Sin importe, sin cliente, sin medio: el back lo deduce
}
```

### 7.1 `POST /api/pagos/caja`

- **Estado:** Implementado (PR #48). **Request:** `PagoCajaRequest`. **Response:** 201 con `PagoResponse` (`estado: "APROBADO"`, `medio: "CAJA"`, cuotas `Pagada`). `Location` no legible: usar `id` del body (PB-17).
- **Función:** `cobrarEnCaja(body: PagoCajaRequest): Promise<PagoResponse>`.
- **Clave al éxito:** `pagosKeys.detalle(pago.id)`. La invalidación de `polizasKeys` para refrescar cuotas la hace el hook de B-17 en `features/pagos/api/` (RV-27).
- **Hook (lo escribe B-17):** `useCobrarEnCaja()`, `useMutation`, `retry: 0`. El botón "Cobrar" se deshabilita desde el envío hasta la respuesta (FC11, `pagos-facturas.md` §9.2). **Nunca se dispara al montar.**
- **MSW:** `http.post('*/api/pagos/caja')`. Éxito: 201 con el ejemplo del contrato §10.1 (`PAG-6f1c2a`, `APROBADO`, factura `AUTORIZADA`). Variantes en §7.1.1.

#### 7.1.1 Errores de `POST /api/pagos/caja`

| Status | Forma | Cuándo | Texto del back |
|---|---|---|---|
| 400 | `ValidationProblemDetails` | `cuotaIds` vacío o ausente | `errors.CuotaIds` = `"Debe indicar al menos una cuota."` (no va en `detail`) |
| 400 | `ProblemDetails` | IDs repetidos | `"Las cuotas no pueden repetirse."` |
| 404 | `ProblemDetails` | alguna cuota no existe | `"Alguna de las cuotas indicadas no existe."` |
| 400 | `ProblemDetails` | alguna cuota `Anulada` o `Pagada` | `"Solo se pueden pagar cuotas pendientes o vencidas (RN11)."` |
| 404 | `ProblemDetails` | póliza de una cuota no existe | `"Alguna de las pólizas indicadas no existe."` |
| 400 | `ProblemDetails` | cuotas de dos clientes | `"Todas las cuotas deben pertenecer al mismo cliente."` |
| 400 | `ProblemDetails` | conflicto de concurrencia (RowVersion) | `"El pago o sus cuotas fueron modificados por otro cobro. Recargue los datos."` |
| 401 / 403 | sin cuerpo | auth | (no usar texto del back) |

Caso especial: si ARCA no responde, el cobro queda `APROBADO` y `factura.estado` es `PENDIENTE_CAE`. Es **201**, no error.

### 7.2 `GET /api/pagos/{id}`

- **Estado:** Implementado (PR #48). **Response:** 200 con `PagoResponse`.
- **Función:** `obtenerPago(id: string): Promise<PagoResponse>`. **Clave:** `pagosKeys.detalle(id)`. **Hook (lo escribe B-17):** `usePago(id)`, `useQuery`.
- **Errores:** 404 `ProblemDetails` `"El pago no existe."`.
- **MSW:** éxito con `PAG-6f1c2a`. Variante `pagoNoExiste` (404).

### 7.3 `GET /api/pagos/{id}/factura`

- **Estado:** Implementado (PR #48). **Response:** 200 con `FacturaResponse` (incluye `PENDIENTE_CAE`).
- **Función:** `obtenerFacturaDePago(id: string): Promise<FacturaResponse>`. **Clave:** `pagosKeys.factura(id)`. **Hook (lo escribe B-17):** `useFacturaDePago(id)`, `useQuery`.
- **Errores:** 404 `ProblemDetails` `"No se encontró la factura del pago."`.
- **MSW:** éxito con factura `AUTORIZADA`. Variantes: `facturaPendienteCae` (200 con `estado: 'PENDIENTE_CAE'`, `numero: ""`, `cae: null`), `facturaNoExiste` (404).

### 7.4 Mock de listado de pagos (PB-05, MOCK)

- **Estado:** **NO EXISTE**. `GET /api/pagos` y `GET /api/polizas/{id}/pagos` no están en el back.
- **Funciones mock:** `listarPagosMock(filtro)` y `listarPagosDePolizaMock(polizaId)`. **Claves:** `pagosKeys.lista(filtro)`, `pagosKeys.porPoliza(polizaId)`. **Hooks (los escriben B-19 y B-18):** `usePagosListado(filtro)` y `usePagosDePoliza(polizaId)`.

```ts
// dto/pagos.ts (MOCK, PB-05)
export interface PagoResumenMock {
  id: string;
  numero: string;
  estado: EstadoPago;
  medio: MedioPagoApi;
  importe: number;
  fechaCreacion: string;
  fechaAcreditacion: string | null;
  cuotaIds: string[];
}

export interface PagoListadoFiltroMock {
  estado?: EstadoPago;
  medio?: MedioPagoApi;
  numeroPoliza?: string;          // PB-06
  pagina?: number;
  tamano?: number;
}
```

- **MSW:** `http.get('*/api/pagos')` y `http.get('*/api/polizas/:id/pagos')`. Éxito: lista de un pago `APROBADO` y uno `RECHAZADO`. Variante `pagosVacios` (200 con `items: []`).

### 7.5 Mock de PDF de factura (PB-11, MOCK)

- **Estado:** **NO EXISTE**. `FacturaResponse` no tiene `urlPdf`. B-17 oculta el botón de descarga.

```ts
// dto/pagos.ts (MOCK, PB-11)
export interface FacturaConPdfMock extends FacturaResponse {
  urlPdf: string | null;          // null mientras PENDIENTE_CAE
}
```

- **MSW:** la variante `facturaConPdf` de `GET /api/pagos/:id/factura` devuelve `urlPdf` con una URL de prueba. Ningún componente la usa en producción (D-29-2).

## 8. Contenido de UI

No aplica (sin UI en esta tarea). Textos del back: los consume B-17 tal cual en `detail` (FC10). Los estados `PENDIENTE_CAE` y `AUTORIZADA` tienen badge en `design-system.md` y en `contratos-api/convenciones-transversales.md` §8.2 (B-17 decide el texto del badge). Referencias: `pantallas/B10-detalle-poliza.md`, `pantallas/B11-pagos-y-facturas.md`.

## 9. Estados y casos borde

- **Cobro, doble clic:** botón deshabilitado; segundo POST da 400 `"Solo se pueden pagar cuotas pendientes o vencidas (RN11)."` (cuotas ya pagadas). No es un error a reintentar.
- **Cobro, corte de red tras el 201:** la respuesta se pierde y el `id` del pago no llega. **No reenviar a ciegas** (FB7.9): mostrar el error y consultar la póliza (`GET /api/polizas/{id}/cuotas` de T-28) para ver si las cuotas quedaron `Pagada`.
- **Cobro, conflicto de RowVersion:** 400 `"El pago o sus cuotas fueron modificados por otro cobro. Recargue los datos."`. La UI recarga y no reenvía.
- **Factura pendiente de CAE:** `numero` vacío, `cae` y `vencimientoCae` null. Se muestra "Pendiente de numeración", sin fecha estimada. El reintento automático corre cada 15 min en el back (sin acción del front).
- **Pago `RECHAZADO` o `PENDIENTE`:** no tiene factura. `GET .../factura` da 404 (no es error de sesión).
- **Fechas:** `fechaCreacion` y `fechaAcreditacion` en UTC (con o sin `Z`). Formatear con T-09.
- **Importes:** `importe` es total con IVA incluido. El front no recalcula (contrato §5.4).
- **Token vencido:** 401 y cierre de sesión (T-08).

## 10. Tests requeridos

Vitest + MSW. Un test por forma de error (FC5).

1. `POST caja devuelve 201 con PagoResponse APROBADO y medio CAJA`.
2. `POST caja devuelve 400 de validación con errors.CuotaIds` (`cuotaIds` vacío).
3. `POST caja devuelve 400 de negocio para cada detail de §7.1.1` (`it.each`, cuatro textos de 400).
4. `POST caja devuelve 404 con detail para cuota y póliza inexistentes` (`it.each`).
5. `POST caja devuelve 400 por RowVersion con el texto de recarga`.
6. `POST caja no reintenta ante 502` (una sola request).
7. `POST caja con factura PENDIENTE_CAE devuelve 201 (no error)`.
8. `GET pago por id devuelve PagoResponse con estado en mayúsculas`.
9. `GET pago por id devuelve 404 con detail "El pago no existe."`.
10. `GET factura devuelve FacturaResponse AUTORIZADA con cae de 14 dígitos`.
11. `GET factura devuelve PENDIENTE_CAE con numero vacío y cae null`.
12. `GET factura devuelve 404 con detail "No se encontró la factura del pago."`.
13. `El mock de PDF (PB-11) devuelve urlPdf null mientras PENDIENTE_CAE`.
14. `El mock de listado (PB-05) se marca MOCK y devuelve PaginaResponse`.
15. `Las funciones devuelven 401 sin token`.

## 11. Criterios de aceptación

1. Los tipos de §7 existen en `dto/pagos.ts` con los nombres y valores string exactos.
2. Las tres funciones reales existen, ninguna reintenta, y `cobrarEnCaja` no se llama desde efectos de montaje.
3. Las funciones mock de PB-05 y el tipo de PB-11 están marcados como MOCK.
4. `pagosKeys` se exporta desde `@nexa/api`.
5. Los handlers tienen éxito por defecto y variantes con nombre para cada error de §7.
6. Los tests de §10 pasan en verde.
7. El barrel exporta solo el bloque de T-29.
8. `lint`, `typecheck`, `test`, `build` en verde.
9. Las tablas de error coinciden con `contratos-api/pagos-facturas.md` §6.3, §10.1 a §10.3.
10. `POST /api/pagos/{id}/conciliar` queda documentado como fuera de alcance del front (§16).

## 12. Verificación manual

Sin prueba manual de UI en esta tarjeta.

Contra el back local: los tres endpoints reales están **Implementados**. El `POST caja` modifica cuotas: correrlo solo contra una base de pruebas. Confirmar en la base de seed que `GET /api/pagos/{id}` devuelve estado en mayúsculas y que `factura` con `PENDIENTE_CAE` llega como `numero: ""`. Los mocks de PB-05 y PB-11 no tienen prueba contra el back.

## 13. Decisiones pendientes

- **D-29-1 (forma de pago en caja, PB-25):** default: no se envía ni se muestra. `PagoCajaRequest` no cambia.
- **D-29-2 (descarga de PDF, PB-11):** default: sin botón de descarga; `FacturaConPdfMock` solo en MSW.
- **D-29-3 (listado de pagos, PB-05):** default: B-19 se publica sin tabla de listado hasta el PB; los mocks existen solo para la pantalla de diseño.
- **D-29-4 (`conciliar`):** default: no se implementa en el front.
- **D-29-5 (`Idempotency-Key`, PB-12):** default: sin header; protección por botón deshabilitado y `retry: 0`.
- **D-API-1 (hooks en features, FC2).** Default (RV-44): los hooks los escriben B-17, B-18 y B-19 en `features/pagos/api/`; `@nexa/api` solo exporta funciones, tipos y claves.

## 14. Riesgos y errores comunes

- **Reenvío de caja tras corte de red:** el segundo POST devuelve 400 aunque el primero cobró. Mitigación: no reenviar; consultar antes (§9).
- **Mezclar formatos de enum:** `estado` de pago es string, `estado` de cuota es número (T-28). Mitigación: tipos distintos y mapas separados (FC9).
- **Factura de `PENDIENTE_CAE` vista como error:** es 200 y `estado` distinto. Mitigación: tratar el campo, no el status.
- **Pago online sin id:** el listado de caja no lo trae. Sin PB-05 no se puede recuperar un cobro perdido (contrato §9.3).
- **Cache de factura:** el back puede pasar a `AUTORIZADA` después del reintento. Mitigación: `staleTime` corto en `pagosKeys.factura(id)` (decisión de B-17).
- **Dos clases de error en caja:** la de RowVersion y la de RN11 son 400 con texto distinto. Mitigación: mostrar `detail`, no comparar.

## 15. Definición de terminado

- `lint`, `typecheck`, `test`, `build` en verde (FC8).
- Sin secretos. Sin `fetch` directo (FC13).
- Los 10 criterios de §11 con evidencia observada.

## 16. Observaciones al índice

- Resuelto (RV-D09): `FacturaResponse` lo copia T-31 en `dto/publico.ts`; no hay importación desde T-29 ni dependencia entre ambas.
- Resuelto (RV-27): T-29 no importa `polizasKeys` de T-28; la invalidación cruzada la hace el hook de B-17.
- Resuelto (RV-57): `POST /api/pagos/{id}/conciliar` existe en el back y queda fuera del front (contrato §10.4); la nota va a la fila del INDEX.
- Resuelto (triage final, default de la ficha): "PB-16 (fechas) en la tabla de consumo: el INDEX no asigna a T-29 aunque `fechaCreacion` y `fechaAcreditacion` lo sufren". Motivo: no aparece en REVISION.md ni en FB8. La mitigación con T-09 ya figura en §9 y §14. Cierre: se consume con `parsearFechaUtc` de T-09 (FB7).
