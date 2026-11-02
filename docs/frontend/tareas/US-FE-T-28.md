# US-FE-T-28: API pólizas y cuotas

Tipo T · Oleada 2 · Tamaño M · Rama sugerida `feature/US-FE-T-28-api-polizas-cuotas` · Tarjeta Trello `US-FE-T-28`.

## 1. Objetivo

Dejar tipados, con función de request, claves de caché y handlers MSW, la emisión, la consulta y la cancelación de pólizas, y el listado de sus cuotas: `POST /api/polizas`, `GET /api/polizas`, `GET /api/polizas/{id}`, `GET /api/polizas/{id}/cuotas`, `POST /api/polizas/{id}/cancelar`. Más dos mocks de búsqueda y de cuotas vencidas que no existen en el back (PB-06, PB-24). Consumidores: B-07, B-12, B-13, B-14, B-15, B-16, B-02 y B-03.

Todos los endpoints reales están en `development`.

## 2. Alcance

**Entra**
- `dto/polizas.ts` (dueño T-28): tipos reales y los mock de PB-06 y PB-24.
- `endpoints/polizas.ts`: `emitirPoliza`, `listarPolizas`, `obtenerPoliza`, `listarCuotasDePoliza`, `cancelarPoliza`, y los mocks `buscarPolizasMock` y `listarCuotasVencidasMock`.
- Claves: `polizasKeys.all`, `polizasKeys.lista(filtro)`, `polizasKeys.detalle(id)`, `polizasKeys.cuotas(id)`, y `cuotasKeys.vencidas(opciones)` (mock).
- MSW en `mocks/handlers/polizas.ts` y `mocks/handlers/cuotas.ts`.

**NO entra**
- Pagos y cupón: T-29 y T-30.
- Hooks: los escriben B-12, B-13, B-14, B-15, B-16, B-02 y B-03 en sus features (FC2). Excepción: `cuotasKeys` y el mock de cuotas vencidas los usa B-03, que crea `features/cuotas` (INDEX).
- Filtro por plan visible (PB-06 oculto en B-13).

## 3. Dependencias

- **Depende de:** US-FE-T-08, US-FE-T-11, US-FE-T-12.
- **Oleada:** 2.
- **Puede empezar sin esperar a:** US-FE-B-13, US-FE-B-12.
- **Bloqueada por pedidos al back (PB-NN):** PB-06 (MSW), PB-24 (MSW).
- **Workaround MSW:** búsqueda por número, DNI y plan solo en el handler; cuotas vencidas globales solo en el handler.

## 4. Documentos a leer

- `contratos-api/polizas-cuotas-pagofacil.md` §0 (resumen), §1.2 a §1.5 (tipos y fechas), §2 (enums y tipos compartidos), §3.1 a §3.5 (ciclo de vida y acciones por estado), §4.1 a §4.5 (emisión: tabla de 16 reglas), §5.1 a §5.5 (endpoints), §10 (de dónde sale cada bloque del detalle), §12 dudas D1, D2, D3, D5, D6, D17, D18.
- `contratos-api/convenciones-transversales.md` §5.3 (fechas), §5.4 (dinero), §6.1 (paginación), §3.4 (`ProblemDetails`).
- `pedidos-al-back.md` PB-06, PB-13, PB-16, PB-20, PB-24, PB-27, PB-30.
- `pantallas/B9-polizas.md` (listado y filtro; D2, D3, D8, D18 del contrato), `pantallas/B8-emitir-poliza.md` (vigencia 1, 6 o 12; leyenda "fechas a confirmar", PB-20), `pantallas/B10-detalle-poliza.md` (cancelar, cuotas), `pantallas/B2-inicio.md` §8 y §9 (cuotas vencidas, PB-24/PB-08).
- `00-decisiones-base.md` FB4, FB7.9, FB7.11.
- `tareas/INDEX.md` FC2, FC3, FC5, FC9, FC10, FC11; decisiones D-01 (tamaño de página 10), D-11, D-12, D-19 (cuotas sin preseleccionar).
- Back: `backend/Aseguradora.Api/Controllers/PolizasController.cs` (`[HttpPost]`, `[HttpGet]`, `[HttpGet("{id:guid}")]`, `[HttpPost("{id:guid}/cancelar")]`, `[HttpGet("{id:guid}/cuotas")]`, `[Authorize(Policy = Politicas.Empleado)]` en la clase). DTO verificados: `Application/Dtos/Polizas/EmitirPolizaRequest.cs` (`Guid CotizacionId, int VigenciaMeses`), `PolizaFiltro.cs` (`EstadoPoliza? Estado`, `Guid? ClienteId`, `string? Patente`, `int Pagina`, `int Tamano`), `CancelarPolizaRequest.cs`, `PolizaListItemResponse.cs`, `PolizaDetalleResponse.cs`, `CuotaResponse.cs`.

## 5. Archivos a crear o modificar

| Archivo | Acción |
|---|---|
| `packages/api/src/dto/polizas.ts` | nuevo (dueño T-28) |
| `packages/api/src/endpoints/polizas.ts` | nuevo |
| `packages/api/src/endpoints/cuotas.ts` | nuevo (solo mock de PB-24) |
| `packages/api/mocks/handlers/polizas.ts` | nuevo (dueño T-28) |
| `packages/api/mocks/handlers/cuotas.ts` | nuevo (dueño T-28; el agregador lo lee) |
| `packages/api/test/contract/polizas.contract.test.ts` y `packages/api/test/contract/cuotas.contract.test.ts` | nuevos (RV-D31) |
| `packages/api/src/index.ts` | bloque de export (dueño T-12) |

No se edita ningún `package.json` ni `apps/*`. La carpeta `apps/*/src/features/cuotas/` es de B-03, no de esta tarea.

## 6. Pasos de implementación

1. Confirmar con T-08, T-11 y T-12 (cliente, agregador, `PaginaResponse`).
2. Escribir `dto/polizas.ts`: `EstadoPolizaNumero`, `EstadoCuotaNumero`, `EstadoPolizaNombre`, `PolizaFiltroQuery`, `EmitirPolizaRequest`, `CancelarPolizaRequest`, `PolizaListItemResponse`, `PolizaDetalleResponse`, `CuotaResponse`, y los mock de §7.
3. Escribir las cinco funciones reales y las dos mock. Ninguna reintenta.
4. Exportar las claves de §2.
5. Escribir los handlers: éxito por defecto y variantes con nombre.
6. Escribir los tests de §10 y el bloque de export.
7. Correr `lint`, `typecheck`, `test`.

## 7. Contrato con el back

Política: `Politicas.Empleado` en todos los endpoints (rol Empleado o Administrador). Sin token: 401. Sin rol: 403.

Enums: viajan como **número** en las respuestas (`estado: 1`) y como **nombre** en la query (`?estado=Vigente`) (contrato §1.3, PB-13, D1). Los tipos de respuesta usan el número; los consumidores aplican el mapa de T-10 (FC9).

```ts
// dto/polizas.ts
export const ESTADO_POLIZA_NUMERO = { Pendiente: 0, Vigente: 1, Suspendida: 2, Cancelada: 3, Vencida: 4 } as const;
export type EstadoPolizaNumero = 0 | 1 | 2 | 3 | 4;
export type EstadoPolizaNombre = 'Pendiente' | 'Vigente' | 'Suspendida' | 'Cancelada' | 'Vencida';

export const ESTADO_CUOTA_NUMERO = { Pendiente: 0, Vencida: 1, Pagada: 2, Anulada: 3 } as const;
export type EstadoCuotaNumero = 0 | 1 | 2 | 3;

export interface PolizaFiltroQuery {
  estado?: EstadoPolizaNombre;   // nombre en la query
  clienteId?: string;
  patente?: string;              // coincidencia exacta en el back (PB-06 / D18)
  pagina?: number;               // default 1
  tamano?: number;               // 1..100, default 20 en el back
}

export interface EmitirPolizaRequest {
  cotizacionId: string;          // idCotizacion de la opción elegida (no la fecha de vencimiento)
  vigenciaMeses: 1 | 6 | 12;     // RN07
}

export interface CancelarPolizaRequest {
  motivo: string;                // 1..200 caracteres tras trim
}

export interface PolizaListItemResponse {
  id: string;
  numero: string;                // "POL-0000001"
  clienteId: string;
  patente: string;
  codigoPlan: string;
  primaMensual: number;
  fechaInicio: string;           // "yyyy-MM-dd"
  fechaFin: string;              // "yyyy-MM-dd"
  estado: EstadoPolizaNumero;
}

export interface CuotaResponse {
  id: string;
  numero: number;
  importe: number;
  recargo: number;               // 0 hasta Vencida; luego 5 %
  fechaVencimiento: string;      // "yyyy-MM-dd"
  estado: EstadoCuotaNumero;
  fechaPago: string | null;      // puede venir sin Z (PB-16)
}

export interface PolizaDetalleResponse {
  id: string;
  numero: string;
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
  vigenciaMeses: number;
  fechaEmision: string;          // puede venir con o sin Z (PB-16)
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoPolizaNumero;
  cuotas: CuotaResponse[];
}
```

### 7.1 `POST /api/polizas` (emitir)

- **Estado:** Implementado. **Request:** `EmitirPolizaRequest`. **Response:** 201 con `PolizaDetalleResponse` (`Location` no legible: usar `id` del body, PB-17).
- **Función:** `emitirPoliza(body: EmitirPolizaRequest): Promise<PolizaDetalleResponse>`.
- **Clave al éxito:** `polizasKeys.all` (invalida listas y detalles).
- **Hook (lo escribe B-12):** `useEmitirPoliza()`, `useMutation`, `retry: 0`, no se reenvía tras error de red (FB7.9, FC11). El botón se deshabilita mientras corre.
- **MSW:** `http.post('*/api/polizas')`. Éxito: 201 con la póliza del ejemplo del contrato §5.3 (POL-0000001, RC, 6 meses). Variantes de §7.1.1.

#### 7.1.1 Errores de `POST /api/polizas`

Cada fila es una forma de error distinta, no un test por mensaje. El detalle exacto es el del back (contrato §4.2).

| Status | Forma | Cuándo | `detail` |
|---|---|---|---|
| 404 | `ProblemDetails` | cotización inexistente | `"La cotización {id} no existe."` |
| 400 | `ProblemDetails` | cotización vencida (RN06) | `"La cotización está vencida (RN06)."` |
| 400 | `ProblemDetails` | cotización ya usada | `"La cotización ya se usó para emitir una póliza."` |
| 400 | `ProblemDetails` | cotización externa (sin cliente ni vehículo) | `"La cotización no tiene cliente ni vehículo registrados: no se puede emitir una póliza desde una cotización externa."` |
| 400 | `ProblemDetails` | cliente inexistente o inactivo | `"El cliente de la cotización no existe o no está activo."` |
| 400 | `ProblemDetails` | cliente sin validar en Renaper (RN02) | `"El cliente no está validado en Renaper (RN02)."` |
| 400 | `ProblemDetails` | vehículo inexistente o inactivo | `"El vehículo de la cotización no existe o no está activo."` |
| 400 | `ProblemDetails` | vehículo sin validar en DNRPA (RN03) | `"El vehículo no está validado en DNRPA (RN03)."` |
| 400 | `ProblemDetails` | vehículo de otro cliente (RN03) | `"El vehículo no pertenece al cliente de la cotización (RN03)."` |
| 400 | `ProblemDetails` | ya tiene póliza activa (RN04) | `"El vehículo {patente} ya tiene una póliza pendiente, vigente o suspendida (RN04)."` |
| 400 | `ProblemDetails` | plan inexistente o inactivo | `"El plan de la cotización no existe o no está activo."` |
| 400 | `ProblemDetails` | plan no acepta el tipo (RN05) | `"El plan {codigo} no acepta vehículos de tipo {tipo} (RN05)."` |
| 400 | `ProblemDetails` | plan no acepta la antigüedad (RN05) | `"El plan {codigo} acepta vehículos de hasta {maxima} años y este tiene {antiguedad} (RN05)."` |
| 400 | `ProblemDetails` | vigencia distinta de 1, 6 o 12 | `"La vigencia debe ser de 1, 6 o 12 meses."` |
| 400 | `ProblemDetails` | prima mensual no positiva | `"La prima mensual debe ser mayor que cero."` |
| 400 | `ProblemDetails` | emisión simultánea (índice único) | `"Otra emisión con la misma cotización o el mismo vehículo se guardó al mismo tiempo (RN04). Recargue los datos."` |
| 400 | `ValidationProblemDetails` | body no deserializable | sin texto propio |
| 401 / 403 | sin cuerpo | auth | (no usar texto del back) |

Orden: la vigencia se valida **después** de cotización, cliente, vehículo y plan. Una cotización vencida con vigencia 3 responde por la cotización (contrato §4.2).

### 7.2 `GET /api/polizas` (listado)

- **Estado:** Implementado. **Response:** 200 con `PaginaResponse<PolizaListItemResponse>`. Orden: `fechaEmision` descendente y luego `numero` descendente.
- **Función:** `listarPolizas(filtro: PolizaFiltroQuery): Promise<PaginaResponse<PolizaListItemResponse>>`.
- **Clave:** `polizasKeys.lista(filtro)` = `['polizas', 'lista', filtro]`.
- **Hook (lo escribe B-13):** `usePolizas(filtro)`, `useQuery`, `placeholderData: keepPreviousData` (paginación estable).
- **MSW:** `http.get('*/api/polizas')`. Éxito: página con POL-0000001 y POL-0000002. Variantes: `polizasFiltroInvalido` (400 `ValidationProblemDetails` con `errors.Estado` o `errors.Pagina`), `sinToken` (401).
- **Errores:** 400 de validación si `pagina` o `tamano` están fuera de rango o `estado` no es un nombre válido (`ValidationProblemDetails` con claves `Pagina`, `Tamano`, `Estado`; clave no verificada en runtime).

### 7.3 `GET /api/polizas/{id}`

- **Estado:** Implementado. **Response:** 200 con `PolizaDetalleResponse`.
- **Función:** `obtenerPoliza(id: string): Promise<PolizaDetalleResponse>`. **Clave:** `polizasKeys.detalle(id)`. **Hook (lo escribe B-15):** `usePoliza(id)`, `useQuery`.
- **Errores:** 404 `ProblemDetails` `"La póliza {id} no existe."`.
- **MSW:** éxito con POL-0000001 (contrato §5.3). Variante `polizaNoExiste` (404).
- **Limitación (§10 del contrato):** el detalle no trae datos del cliente, motivo ni fecha de cancelación, pagos ni facturas (PB-27, D3, D4).

### 7.4 `GET /api/polizas/{id}/cuotas`

- **Estado:** Implementado. **Response:** 200 con `CuotaResponse[]`, ordenadas por `numero`. Sin paginación.
- **Función:** `listarCuotasDePoliza(id: string): Promise<CuotaResponse[]>`. **Clave:** `polizasKeys.cuotas(id)`. **Hook (lo escribe B-15 y B-18):** `useCuotasPoliza(id)`, `useQuery`.
- **Errores:** 404 `"La póliza {id} no existe."`.
- **MSW:** éxito con seis cuotas (importe 12000, la cuota 1 PAGADA con `fechaPago` sin `Z`). Variante `cuotasPolizaNoExiste` (404).

### 7.5 `POST /api/polizas/{id}/cancelar`

- **Estado:** Implementado. **Request:** `CancelarPolizaRequest`. **Response:** 200 con `PolizaDetalleResponse` cancelado. Las cuotas `Pendiente` y `Vencida` pasan a `Anulada` (RN13). No hay reintegros.
- **Función:** `cancelarPoliza(id: string, body: CancelarPolizaRequest): Promise<PolizaDetalleResponse>`.
- **Clave al éxito:** `polizasKeys.detalle(id)`, `polizasKeys.cuotas(id)`, `polizasKeys.all`.
- **Hook (lo escribe B-16):** `useCancelarPoliza(id)`, `useMutation`, `retry: 0`. Requiere confirmación previa (RN13, B-16).
- **Errores:**

| Status | Forma | Cuándo | Texto |
|---|---|---|---|
| 400 | `ValidationProblemDetails` | `motivo` vacío, solo espacios o mayor de 200 | `errors.Motivo` (clave no verificada; texto ASP.NET en inglés) |
| 400 | `ProblemDetails` | póliza `Cancelada` o `Vencida` | `"No se puede pasar una póliza de {Estado} a Cancelada."` (nombre del enum en español) |
| 404 | `ProblemDetails` | póliza inexistente | `"La póliza {id} no existe."` |
| 401 / 403 | sin cuerpo | auth | (no usar texto del back) |

- **MSW:** éxito con la póliza cancelada y cuotas en `Anulada` (estado 3). Variantes: `cancelarEstadoInvalido` (400), `cancelarMotivoVacio` (400 con `errors.Motivo`), `polizaNoExiste` (404).

### 7.6 Mock de búsqueda por número, DNI y plan (PB-06, MOCK)

- **Estado:** **NO EXISTE**. El back ignora `numero`, `dni` y `planCodigo` y devuelve 200 con el listado filtrado solo por los parámetros reales (ver §14).
- **Función mock:** `buscarPolizasMock(filtro: PolizaBusquedaMock): Promise<PaginaResponse<PolizaListItemResponse>>`. **Clave:** `polizasKeys.lista(filtro)`.
- **MSW:** `http.get('*/api/polizas')` con los parámetros nuevos. Éxito: POL-0000001 para `numero=POL-0000001`. Variante `busquedaSinResultados` (200 con `items: []`).

```ts
// dto/polizas.ts (MOCK, PB-06)
export interface PolizaBusquedaMock extends PolizaFiltroQuery {
  numero?: string;               // coincidencia parcial ^POL-?\d*
  dni?: string;                  // ^\d{8}$; resuelto por el back contra el cliente
  planCodigo?: 'RC' | 'TC' | 'TR';
}
```

### 7.7 Mock de cuotas vencidas globales (PB-24, MOCK)

- **Estado:** **NO EXISTE**. Único implementador: el handler MSW (`GET /api/cuotas?estado=Vencida`).
- **Función mock:** `listarCuotasVencidasMock(opciones: { pagina?: number; tamano?: number }): Promise<PaginaResponse<CuotaListItemMock>>`. **Clave:** `cuotasKeys.vencidas(opciones)`. **Hook (lo escribe B-03):** `useCuotasVencidas(opciones)`, `useQuery`, dentro de `features/cuotas/api/`.

```ts
// dto/polizas.ts (MOCK, PB-24)
export interface CuotaListItemMock {
  cuotaId: string;
  polizaId: string;
  numeroPoliza: string;
  clienteNombre: string;
  clienteApellido: string;
  numeroCuota: number;
  fechaVencimiento: string;      // "yyyy-MM-dd"
  importe: number;
  recargo: number;
  estado: 'Vencida';
}
```

- **MSW:** `http.get('*/api/cuotas')`. Éxito: página con una cuota vencida (estado texto "Vencida", ya que PB-13 queda abierto). Variante `cuotasSinVencidas` (200 con `items: []`).

## 8. Contenido de UI

No aplica (sin UI en esta tarea). Textos de error del back: los consumen B-12 y B-16 (`detail` sin transformar, FC10). Textos de pantalla en `pantallas/B9-polizas.md`, `pantallas/B10-detalle-poliza.md` y `pantallas/B8-emitir-poliza.md`.

## 9. Estados y casos borde

- **Cotización usada o vencida al emitir:** 400 `detail`. B-12 ofrece volver a cotizar; no reintenta.
- **Doble clic al emitir:** botón deshabilitado. Un segundo POST con la misma cotización da 400 (RN04). Nunca se reenvía tras error de red (FB7.9).
- **Cancelar sin confirmar:** la acción no se envía sin confirmación (RN13, B-16).
- **Póliza `Vencida` o `Cancelada`:** el back responde 400 al cancelar. B-10 deshabilita el botón (contrato §3.5).
- **Fechas:** `fechaEmision` y `fechaPago` pueden venir con o sin `Z` (PB-16). Formatear con T-09 tratando un valor sin offset como UTC.
- **`fechaVencimiento` de la cuota 1:** el back devuelve su regla (día 10 del mes siguiente al inicio más N meses), que no coincide con el Figma de B-08 (PB-20). Mostrar siempre la del back.
- **Cuota pagada:** `fechaPago` tiene valor; `recargo` puede ser 0.
- **Paginación:** `tamano` 10 por defecto en las pantallas (D-01); el back acepta 1 a 100.
- **Token vencido:** 401 y cierre de sesión (T-08).

## 10. Tests requeridos

Vitest + MSW. Un test por forma de error (FC5). No hay un test por cada mensaje de §7.1.1: se cubren los casos de forma distinta y un `it.each` con los textos de negocio.

1. `POST polizas devuelve 201 con PolizaDetalleResponse`.
2. `POST polizas devuelve 404 con detail de cotización inexistente`.
3. `POST polizas devuelve 400 de negocio para cada detail de §7.1.1` (`it.each`).
4. `POST polizas devuelve 400 de validación cuando el body no deserializa`.
5. `POST polizas no reintenta ante 502` (una sola request).
6. `GET polizas devuelve PaginaResponse con tamanoPagina y no tamano`.
7. `GET polizas envía estado como nombre en la query y lee el número en el resultado`.
8. `GET polizas devuelve 400 de validación con errors` (`it.each`: pagina, tamano, estado).
9. `GET poliza por id devuelve PolizaDetalleResponse`.
10. `GET poliza por id devuelve 404 con detail "La póliza {id} no existe."`.
11. `GET cuotas devuelve CuotaResponse[] ordenadas por numero`.
12. `GET cuotas devuelve 404 si la póliza no existe`.
13. `POST cancelar devuelve 200 y cuotas en estado 3`.
14. `POST cancelar devuelve 400 de validación con errors.Motivo` (`it.each`: vacío, espacios, 201 caracteres).
15. `POST cancelar devuelve 400 con detail de transición inválida`.
16. `POST cancelar devuelve 404 si la póliza no existe`.
17. `La búsqueda mock (PB-06) se marca MOCK y devuelve PaginaResponse`.
18. `Las cuotas vencidas mock (PB-24) se marcan MOCK y devuelven estado "Vencida"`.
19. `Las funciones devuelven 401 sin token` (`it.each` sobre las funciones reales).

## 11. Criterios de aceptación

1. Los tipos de §7 existen en `dto/polizas.ts` con los nombres exactos.
2. Las cinco funciones reales existen y ninguna reintenta.
3. Las dos funciones mock están marcadas como MOCK.
4. Las claves de §2 se exportan desde `@nexa/api`.
5. Los handlers tienen éxito por defecto y variantes con nombre para cada forma de error de §7.
6. Los tests de §10 pasan en verde.
7. El barrel exporta solo el bloque de T-28.
8. `lint`, `typecheck`, `test`, `build` en verde.
9. Las tablas de error coinciden con `contratos-api/polizas-cuotas-pagofacil.md` §4.2, §5.1 a §5.5.
10. La advertencia de búsqueda silenciosa (§14) está en el handler como comentario.

## 12. Verificación manual

Sin prueba manual de UI en esta tarjeta.

Contra el back local: los cinco endpoints reales están **Implementados**. Con seed, correr los tests de contrato contra `http://localhost:8080`. La emisión (`POST`) modifica datos: correrla contra una base de pruebas, no contra la compartida. Los mocks PB-06 y PB-24 no tienen prueba contra el back: no existen.

## 13. Decisiones pendientes

- **D-28-1 (PB-06):** default (RV-D29): `numero`, `dni` y `planCodigo` existen solo en MSW y se ocultan tras una constante, no con `VITE_USE_MOCKS`; B-14 y el filtro de plan de B-13 quedan ocultos hasta el PB.
- **D-28-2 (PB-24):** default: mock de cuotas vencidas; B-03 oculta el widget hasta el PB.
- **D-28-3 (enum en el estado de cuota del mock):** default: el mock devuelve el nombre ("Vencida") mientras PB-13 esté abierto; la función real devuelve número.
- **D-28-4 (fecha de la cuota 1, PB-20):** default: se muestra la del back; el Figma de B-08 se registra como pedido a diseño.
- **D-API-1 (hooks en features, FC2).** Default (RV-44): los hooks los escriben B-12, B-13, B-14, B-15, B-16, B-02 y B-03 en sus `features/*/api/`; `@nexa/api` solo exporta funciones, tipos y claves.

## 14. Riesgos y errores comunes

- **Búsqueda que no busca (PB-06):** ASP.NET ignora `numero`, `dni` y `planCodigo` si el back no los declara en `PolizaFiltro`. Responde 200 con todas las pólizas que pasen los filtros reales. Si B-14 se monta contra el back real, mostraría resultados que no corresponden al término buscado, sin error. Mitigación: B-14 se oculta hasta PB-06; el mock no se usa en producción.
- **Cuotas vencidas globales (PB-24):** `GET /api/cuotas` no existe en el back. Con `VITE_USE_MOCKS=false`, B-03 recibe 404 visible. Mitigación: el widget no se monta hasta PB-24.
- **Enum en query y en respuesta:** la query lleva nombre y la respuesta número. Mezclar los dos rompe el filtro. Mitigación: T-10 y la función de T-28 usan cada uno en su lugar.
- **Cancelar es irreversible:** anula cuotas (RN13). Mitigación: confirmación en B-16 y botón deshabilitado durante la mutación.
- **Fecha `fechaEmision` sin `Z`:** un formateador que no normaliza muestra la hora mal (PB-16). Mitigación: T-09.
- **`tamano` 10 en pantalla y 20 por defecto en el back:** si la pantalla no lo envía, el total no coincide. Mitigación: la pantalla siempre envía `tamano`.

## 15. Definición de terminado

- `lint`, `typecheck`, `test`, `build` en verde (FC8).
- Sin secretos. Sin `fetch` directo (FC13).
- Los 10 criterios de §11 con evidencia observada.

## 16. Observaciones al índice

- Resuelto (RV-56): cuando PB-24 se resuelva se suma T-10 como dependencia; hoy no hay dependencia nueva.
- Resuelto (RV-13): T-28 es dueño de `handlers/cuotas.ts`; B-03 solo consume y el `inicio.ts` lo llena B-03.
- Resuelto (RV-23 / RV-D29): los filtros que el back ignora (PB-06) quedan ocultos tras constante (ver §14 y D-28-1). La advertencia para el PB-06 va a `pedidos-al-back.md` en un PR de docs aparte.
