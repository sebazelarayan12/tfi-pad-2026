# US-FE-T-26: API vehículos y cotizaciones

Tipo T · Oleada 2 · Tamaño M · Rama sugerida `feature/US-FE-T-26-api-vehiculos-cotizaciones` · Tarjeta Trello `US-FE-T-26`.

## 1. Objetivo

Dejar tipados, con función de request, claves de caché y handlers MSW, los endpoints de vehículos y cotizaciones que usan los empleados: listar vehículos de un cliente, ver un vehículo, dar de alta (`POST`), cotizar y ver una cotización. Consumidores: B-07 (ficha), B-09 (nuevo vehículo), B-10 y B-11 (cotizar), B-12 (emitir).

Todo lo implementado está en `development` (PR #24, #47, #49). Los mocks de vista DNRPA (PB-23) y del desglose `calculo` (PB-10) son solo MSW.

## 2. Alcance

**Entra**
- `dto/vehiculos.ts` y `dto/cotizaciones.ts` (ambos de esta tarea, según INDEX).
- Funciones en `endpoints/vehiculos.ts` y `endpoints/cotizaciones.ts`: `listarVehiculosDeCliente`, `obtenerVehiculo`, `crearVehiculo`, `cotizarVehiculo`, `obtenerCotizacion`.
- Claves: `vehiculosKeys.listaPorCliente(clienteId)`, `vehiculosKeys.detalle(id)`, `cotizacionesKeys.detalle(id)`.
- MSW en `mocks/handlers/vehiculos.ts` y `mocks/handlers/cotizaciones.ts`.
- Mocks de PB-23 (`GET /api/vehiculos/dnrpa/{patente}`) y PB-10 (`calculo`).

**NO entra**
- `PUT /api/vehiculos/{id}` y `DELETE /api/vehiculos/{id}` (implementados en PR #47, pero ninguna pantalla del INDEX los consume). Ver §16.
- `GET /api/clientes/{id}` (T-24) y `GET /api/planes` (T-27).
- Hooks TanStack Query: los escriben B-07, B-09, B-10, B-11 y B-12 dentro de su `features/*/api/` (FC2).
- Emisión de póliza desde la cotización: T-28.
- `POST /api/externo/cotizaciones` (PR #57, no lo consume el front).

## 3. Dependencias

- **Depende de:** US-FE-T-08, US-FE-T-11, US-FE-T-12.
- **Oleada:** 2.
- **Puede empezar sin esperar a:** US-FE-B-09, US-FE-B-10.
- **Bloqueada por pedidos al back:** PB-23 (vista DNRPA, mock opcional, oculto en B-09), PB-10 (desglose `calculo`, mock; bloquea la línea de cálculo de B-11), PB-26 (`POST /api/cotizaciones` no es idempotente y no hay listado).
- **Workaround MSW:** `calculo` y la vista DNRPA solo existen en el handler. Sin ellos, B-11 muestra `primaMensual` y B-09 no muestra el paso DNRPA (D-13).

## 4. Documentos a leer

- `contratos-api/vehiculos-planes-cotizaciones.md` §0 (convenciones y tipos comunes), §1.1 (patente y regex), §1.7 (datos del mock DNRPA), §2.1 (alta), §2.2 (listado), §2.3 (detalle), §5.2 (fórmula de prima), §5.4 (qué bloquea cotizar), §6.1 (POST cotizaciones), §6.2 (GET cotización), §9 dudas D2, D9, D10, D12, D13, D17.
- `pedidos-al-back.md` PB-10, PB-23, PB-26.
- `pantallas/B9-polizas.md` y `pantallas/B6-nuevo-vehiculo.md` (D-13, D-B6-08 para el uso por defecto).
- `pantallas/B7-cotizar.md` (D-B7-01 recarga sin duplicados, D-B7-05 ninguna preseleccionada).
- `00-decisiones-base.md` FB4, FB7.3, FB7.9.
- `tareas/INDEX.md` FC2, FC3, FC5, FC9, FC10, FC11, FC13; decisiones D-13, D-18.
- Back: `backend/Aseguradora.Api/Controllers/VehiculosController.cs` (rutas verificadas: `[HttpPost]`, `[HttpGet]`, `[HttpGet("{id:guid}")]`, `[HttpPut]`, `[HttpDelete]`), `CotizacionesController.cs` (`[HttpPost]`, `[HttpGet("{id:guid}")]`). DTO verificados: `Application/Dtos/VehiculoAltaRequest.cs`, `CotizarVehiculoRequest.cs` (`Guid? VehiculoId`), `CotizacionResultado.cs` (`OpcionCotizacion`).

## 5. Archivos a crear o modificar

| Archivo | Acción |
|---|---|
| `packages/api/src/dto/vehiculos.ts` | nuevo (dueño T-26) |
| `packages/api/src/dto/cotizaciones.ts` | nuevo (dueño T-26) |
| `packages/api/src/endpoints/vehiculos.ts` | nuevo |
| `packages/api/src/endpoints/cotizaciones.ts` | nuevo |
| `packages/api/mocks/handlers/vehiculos.ts` | nuevo (dueño T-26) |
| `packages/api/mocks/handlers/cotizaciones.ts` | nuevo (dueño T-26) |
| `packages/api/test/contract/vehiculos.contract.test.ts` y `packages/api/test/contract/cotizaciones.contract.test.ts` | nuevos (RV-D31) |
| `packages/api/src/index.ts` | bloque de export (dueño T-12) |

No se edita ningún `package.json`, ni `apps/*`.

## 6. Pasos de implementación

1. Confirmar con T-08 el cliente HTTP y `ApiError`; con T-11 el agregador `handlers/index.ts`; con T-12 `ProblemDetails`.
2. Escribir `dto/vehiculos.ts`: `TipoVehiculo`, `UsoVehiculo`, `VehiculoResponse`, `VehiculoAltaRequest`, `VehiculoListResponse`, y los tipos mock de §7.
3. Escribir `dto/cotizaciones.ts`: `OrigenCotizacion`, `CotizarVehiculoRequest`, `OpcionCotizacion`, `CotizacionResultado`, `CotizacionDto`, y el tipo mock `CalculoPrimaMock`.
4. Escribir las cinco funciones de §7 y sus claves. Ninguna reintenta.
5. Escribir los handlers: éxito por defecto y variantes con nombre de §7.
6. Escribir los tests de §10.
7. Agregar el bloque de export.
8. Correr `lint`, `typecheck`, `test`.

## 7. Contrato con el back

Política: `Politicas.Empleado` en todos los endpoints de vehículos y cotizaciones (rol Empleado o Administrador). Sin token: 401. Sin rol válido: 403. Los enums viajan como **número** (contrato §0): `TipoVehiculo` Auto=0, Moto=1, Camioneta=2; `UsoVehiculo` Particular=0, Comercial=1; `OrigenCotizacion` Web=0, Panel=1, Externo=2. Los consumidores traducen con el mapa de T-10 (FC9).

### 7.1 `GET /api/vehiculos?clienteId={uuid}`

- **Estado:** Implementado (PR #47). **Auth:** Empleado. **Response:** 200 con `VehiculoResponse[]`, solo vehículos `activo: true`, ordenados por patente.
- **Función:** `listarVehiculosDeCliente(clienteId: string): Promise<VehiculoResponse[]>`.
- **Clave:** `vehiculosKeys.listaPorCliente(clienteId)` = `['vehiculos', 'lista', clienteId]`.
- **Hook (lo escribe B-07):** `useVehiculosDeCliente(clienteId)`, `useQuery`.
- **MSW:** `http.get('*/api/vehiculos')`. Éxito: lista con el vehículo del contrato (`AB123CD`, Toyota Corolla XEi 2021). Variantes: `vehiculosClienteSinClienteId` (400), `vehiculosClienteInexistente` (200 con `[]`, D13), `sinToken` (401).

| Status | Forma | Cuándo | Texto |
|---|---|---|---|
| 400 | `ProblemDetails` con `title: "Solicitud inválida"` | falta `clienteId` o es `00000000-…` | `"El parámetro 'clienteId' es obligatorio."` |
| 400 | `ValidationProblemDetails` (binding) | `clienteId` no es UUID | sin texto propio |
| 401 / 403 | sin cuerpo garantizado | auth | (no usar texto del back) |

### 7.2 `GET /api/vehiculos/{id}`

- **Estado:** Implementado (PR #47). **Response:** 200 con `VehiculoResponse`. Devuelve también vehículos con `activo: false` (trazabilidad).
- **Función:** `obtenerVehiculo(id: string): Promise<VehiculoResponse>`. **Clave:** `vehiculosKeys.detalle(id)`. **Hook (lo escribe B-09 o B-10):** `useVehiculo(id)`, `useQuery`.
- **MSW:** `http.get('*/api/vehiculos/:id')`. Éxito: `AB123CD`. Variantes: `vehiculoNoExiste` (404), `sinToken` (401).
- **Errores:** 404 `ProblemDetails` `"El vehículo {id} no existe."`. Un id que no es UUID no llega al servicio: la ruta responde 404 sin cuerpo de negocio.

### 7.3 `POST /api/vehiculos`

- **Estado:** Implementado (PR #24). **Auth:** Empleado. **Request:** `VehiculoAltaRequest`. **Response:** 201 con `VehiculoResponse` (`Location` no legible, PB-17: usar `id` del body).
- **Función:** `crearVehiculo(body: VehiculoAltaRequest): Promise<VehiculoResponse>`.
- **Clave al éxito:** `vehiculosKeys.listaPorCliente(body.clienteId)`.
- **Hook (lo escribe B-09):** `useCrearVehiculo()`, `useMutation`, `retry: 0`, botón deshabilitado mientras corre.
- **MSW:** `http.post('*/api/vehiculos')`. Éxito: 201 con `AE789FG` (Toyota Hilux SRX 2023, tipo 2) según el contrato §1.7. Variantes de §7.3.1.

```ts
// dto/vehiculos.ts
export type TipoVehiculo = 0 | 1 | 2;
export type UsoVehiculo = 0 | 1;

export interface VehiculoAltaRequest {
  clienteId: string;     // Guid, obligatorio
  patente: string;       // se normaliza en el back (trim + mayúsculas). Regex ^([A-Z]{2}[0-9]{3}[A-Z]{2}|[A-Z]{3}[0-9]{3})$
  uso: UsoVehiculo;      // obligatorio
}

export interface VehiculoResponse {
  id: string;
  clienteId: string;
  patente: string;
  marca: string;         // texto de DNRPA
  modelo: string;        // texto de DNRPA
  anio: number;
  tipo: TipoVehiculo;
  uso: UsoVehiculo;
  validadoDnrpa: boolean;
  activo: boolean;
}

export type VehiculoListResponse = VehiculoResponse[];
```

#### 7.3.1 Errores de `POST /api/vehiculos`

| Status | Forma | Cuándo | Texto del back |
|---|---|---|---|
| 400 | `ValidationProblemDetails` | falta `patente` o `uso`, o patente vacía | claves `errors.Patente` / `errors.Uso` (texto ASP.NET en inglés: mostrar texto propio) |
| 400 | `ProblemDetails` | formato de patente | `"La patente '{P}' no tiene un formato válido (AA000AA o AAA000)."` |
| 400 | `ProblemDetails` | uso fuera de enum | `"El uso del vehículo es obligatorio y debe ser válido."` |
| 400 | `ProblemDetails` | cliente dado de baja | `"El cliente {ClienteId} está dado de baja."` |
| 400 | `ProblemDetails` | patente ya registrada (incluye dadas de baja) | `"Ya existe un vehículo registrado con la patente '{P}' (RN03)."` |
| 400 | `ProblemDetails` | DNRPA no conoce la patente | `"VEHICULO_NO_ENCONTRADO: La patente '{P}' no figura en el registro de DNRPA."` (el código va como prefijo, PB-14: T-10 lo quita para mostrar) |
| 400 | `ProblemDetails` | titular DNRPA distinto del DNI del cliente | `"RN03: El titular registral en DNRPA (DNI {X}) no coincide con el DNI del cliente ({Y})."` |
| 404 | `ProblemDetails` | cliente inexistente | `"El cliente {ClienteId} no existe."` |
| 502 | `ProblemDetails` | DNRPA caído o timeout | texto de la excepción, no fijo |
| 401 / 403 | sin cuerpo | auth | (no usar texto del back) |

Orden de validación del back: el duplicado de patente responde 400 **antes** de consultar DNRPA (contrato §2.1).

### 7.4 `POST /api/cotizaciones` (cotizar)

- **Estado:** Implementado (PR #49). **Auth:** Empleado. **Request:** `CotizarVehiculoRequest`. **Response:** 201 con `CotizacionResultado` (sin `Location`).
- **Función:** `cotizarVehiculo(body: CotizarVehiculoRequest): Promise<CotizacionResultado>`.
- **Efecto del back:** crea una `Cotizacion` persistida **por plan compatible** en cada llamada (PB-26). Nunca se llama al montar.
- **Hook (lo escribe B-10):** `useCotizarVehiculo()`, `useMutation`, `retry: 0`, botón "Cotizar" deshabilitado mientras corre (FC11). El resultado queda en memoria de la pantalla.
- **MSW:** `http.post('*/api/cotizaciones')`. Éxito: 201 con las tres opciones del contrato (RC 12000, TC 18000, TR 30000) ordenadas por código. Variantes: `cotizarSinPlanes` (400), `cotizarVehiculoDadoDeBaja` (400), `cotizarVehiculoNoExiste` (404), `cotizarClienteNoExiste` (404), `cotizarValidacion` (400 con `errors.VehiculoId`), `sinToken` (401).

```ts
// dto/cotizaciones.ts
export type OrigenCotizacion = 0 | 1 | 2;

export interface CotizarVehiculoRequest {
  vehiculoId: string;    // Guid, obligatorio
}

export interface OpcionCotizacion {
  idCotizacion: string;  // id de la Cotizacion persistida; es el que usa POST /api/polizas
  codigoPlan: string;    // RC, TC, TR
  plan: string;          // nombre del plan
  primaMensual: number;  // ARS, 2 decimales
}

export interface CotizacionResultado {
  fechaVencimiento: string;   // ISO UTC con Z; igual para todas las opciones (ahora + 15 días)
  opciones: OpcionCotizacion[];
}

export interface CotizacionDto {
  id: string;
  planId: string;
  codigoPlan: string;         // no trae el nombre del plan (D12)
  clienteId: string | null;
  vehiculoId: string | null;
  primaMensual: number;
  fechaCotizacion: string;    // puede venir sin Z (D9)
  fechaVencimiento: string;   // sin campo "vigente" (D10): comparar con el reloj
  origen: OrigenCotizacion;
}

// MOCK ÚNICAMENTE (PB-10). El back no devuelve "calculo". Opcional.
export interface CalculoPrimaMock {
  primaBase: number;
  factorTipo: number;
  factorAntiguedad: number;
  factorEdad: number;
  factorUso: number;
}
export interface OpcionCotizacionMock extends OpcionCotizacion {
  calculo?: CalculoPrimaMock | null;
}
```

Errores de `POST /api/cotizaciones`:

| Status | Forma | Cuándo | Texto |
|---|---|---|---|
| 400 | `ValidationProblemDetails` | falta `vehiculoId` | `errors.VehiculoId` (texto ASP.NET en inglés) |
| 400 | `ProblemDetails` | vehículo dado de baja | `"El vehículo {id} está dado de baja y no se puede cotizar."` |
| 400 | `ProblemDetails` | ningún plan compatible | `"Ningún plan es compatible con el vehículo."` |
| 404 | `ProblemDetails` | vehículo inexistente (incluye `00000000-…`) | `"El vehículo {id} no existe."` |
| 404 | `ProblemDetails` | cliente del vehículo inexistente | `"El cliente {id} del vehículo no existe."` |
| 401 / 403 | sin cuerpo | auth | (no usar texto del back) |

### 7.5 `GET /api/cotizaciones/{id}`

- **Estado:** Implementado (PR #49). **Response:** 200 con `CotizacionDto`.
- **Función:** `obtenerCotizacion(id: string): Promise<CotizacionDto>`. **Clave:** `cotizacionesKeys.detalle(id)`. **Hook (lo escribe B-12):** `useCotizacion(id)`, `useQuery`.
- **MSW:** `http.get('*/api/cotizaciones/:id')`. Éxito: cotización TC del contrato. Variantes: `cotizacionNoExiste` (404), `cotizacionPlanNoExiste` (404).
- **Errores:** 404 `"La cotización {id} no existe."`; 404 `"El plan {planId} de la cotización {id} no existe."` (no debería pasar por la FK).

### 7.6 Mock de vista DNRPA (PB-23), solo MSW

- `GET /api/vehiculos/dnrpa/{patente}`: **NO EXISTE**. Se mockea con el contrato mínimo propuesto. B-09 no lo llama (D-13). Política: `Empleado`.
- Función: `previsualizarDnrpaMock(patente)`. Sin clave de caché pública (no se usa en pantalla visible).

```ts
// dto/vehiculos.ts (MOCK, PB-23)
export interface VehiculoDnrpaPreviewMock {
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  tipo: TipoVehiculo;
  titularDniEnmascarado: string;      // p. ej. "***.456"; nunca el DNI completo
  coincideConCliente: boolean | null;
}
```

Estado del endpoint: **NO EXISTE**. Único implementador: el handler MSW (hasta que el back lo publique).

## 8. Contenido de UI

No aplica (sin UI en esta tarea). Los textos de error del back se muestran en B-09, B-10 y B-12 con las reglas de FC10 (`detail` tal cual, sin el prefijo `VEHICULO_NO_ENCONTRADO:` que quita T-10). Referencias: `pantallas/B9-polizas.md`, `pantallas/B7-cotizar.md`.

## 9. Estados y casos borde

- **Listado vacío:** 200 con `[]`; también cuando el cliente no existe (D13). La UI no distingue ambos casos.
- **Vehículo dado de baja:** aparece en el detalle (`activo: false`) y no en el listado.
- **Cotizar, doble clic:** el botón se deshabilita; se llama una sola vez. Un segundo POST crea otras tres cotizaciones (PB-26).
- **Cotizar, recarga de página:** la cotización no se recupera (no hay listado, PB-26). B-10 vuelve a cotizar al clic; no se persiste en el front.
- **Cotizar sin planes:** 400 `detail`; la UI no muestra opciones.
- **Fechas:** `fechaVencimiento` de la cotización es UTC. `fechaCotizacion` puede venir sin `Z` en el GET (D9). Formatear con T-09.
- **Enums:** `tipo`, `uso`, `origen` llegan como número. Ningún consumidor usa el número crudo (FC9).
- **Calculo ausente:** si `calculo` no viene (back real), B-11 muestra solo `primaMensual` (PB-10).
- **Token vencido:** 401 en cualquiera de los endpoints: T-08 cierra la sesión (FB7.5).

## 10. Tests requeridos

Vitest + MSW. Un test por cada código de error (FC5).

1. `GET vehiculos devuelve VehiculoResponse[] solo activos del cliente`.
2. `GET vehiculos sin clienteId devuelve 400 con detail "El parámetro 'clienteId' es obligatorio."`.
3. `GET vehiculos con cliente inexistente devuelve 200 con []` (D13).
4. `GET vehiculo por id devuelve activo false para un vehículo dado de baja`.
5. `GET vehiculo por id inexistente devuelve 404`.
6. `POST vehiculos devuelve 201 con VehiculoResponse`.
7. `POST vehiculos devuelve 400 de validación con errors en PascalCase` (`Patente`).
8. `POST vehiculos devuelve 400 de negocio para cada detail de §7.3.1` (`it.each` con los siete textos).
9. `POST vehiculos devuelve 404 cuando el cliente no existe`.
10. `POST vehiculos devuelve 502 sin texto fijo asumido`.
11. `POST cotizaciones devuelve 201 con opciones ordenadas por codigoPlan`.
12. `POST cotizaciones devuelve 400 sin planes compatibles`.
13. `POST cotizaciones devuelve 400 para vehículo dado de baja`.
14. `POST cotizaciones devuelve 404 para vehículo y cliente inexistentes` (`it.each`).
15. `POST cotizaciones hace una sola request ante 502` (sin reintento en la función).
16. `GET cotizaciones devuelve CotizacionDto con codigoPlan y sin campo vigente`.
17. `GET cotizaciones devuelve 404 con detail de cotización inexistente`.
18. `Las funciones devuelven 401 sin token` (`it.each` sobre las cinco funciones).
19. `El mock de calculo (PB-10) es opcional y no rompe el tipo OpcionCotizacion` (`expectTypeOf`).
20. `El handler DNRPA mock devuelve titularDniEnmascarado y nunca el DNI completo`.

## 11. Criterios de aceptación

1. Los tipos de §7 existen en `dto/vehiculos.ts` y `dto/cotizaciones.ts` con los nombres exactos.
2. Las cinco funciones de vehículos y cotizaciones existen, ninguna reintenta, y ninguna se llama desde un efecto de montaje.
3. Las tres claves se exportan desde `@nexa/api` con la forma de §7.
4. Los handlers devuelven el caso de éxito por defecto y tienen variantes con nombre para cada error de §7.
5. El handler de `calculo` y el de DNRPA están marcados como MOCK en el código.
6. Los tests de §10 pasan en verde.
7. El barrel exporta solo el bloque de T-26.
8. `lint`, `typecheck`, `test`, `build` de `@nexa/api` en verde.
9. Las tablas de error coinciden con `contratos-api/vehiculos-planes-cotizaciones.md` §2.1, §2.2, §2.3, §6.1, §6.2.
10. PUT y DELETE de vehículos quedan fuera de esta tarjeta y registrados en §16.

## 12. Verificación manual

Sin prueba manual de UI: no hay pantalla en esta tarjeta.

Contra el back local: los endpoints están **Implementados**. Con el back en `http://localhost:8080` y `VITE_API_BASE_URL` configurado, correr los tests de contrato del harness de T-23 y confirmar los casos 1, 2, 5, 6, 11 y 16 contra datos del seed (`AB123CD`, `c1000000-0000-0000-0000-000000000001`). Los casos DNRPA y PB-10 no tienen prueba contra el back: el endpoint no existe.

## 13. Decisiones pendientes

- **D-26-1 (calculo):** default: el tipo `OpcionCotizacionMock` queda solo en MSW. Si el back agrega `calculo`, pasarlo a `OpcionCotizacion`.
- **D-26-2 (mock DNRPA):** default: el handler existe y B-09 no lo llama (D-13).
- **D-26-3 (PUT y DELETE de vehículos):** default: fuera de T-26. Si una pantalla los necesita, se agrega en una tarjeta nueva.
- **D-26-4 (recarga de cotización):** default: no se persiste la cotización en el front (PB-26). Recarga = nueva cotización al clic.
- **D-API-1 (hooks en features, FC2).** Default (RV-44): los hooks los escriben B-07, B-09, B-10, B-11 y B-12 en `features/*/api/`; `@nexa/api` solo exporta funciones, tipos y claves.

## 14. Riesgos y errores comunes

- **Cotizar al montar:** duplica cotizaciones en cada recarga (PB-26). Mitigación: solo al clic (FC11).
- **Enum como número:** comparar `tipo === 'Auto'`. Mitigación: T-10 (FC9).
- **`fechaVencimiento` sin campo `vigente`:** la UI compara con el reloj local, que puede diferir del de servidor (D10). Mitigación: comparar en UTC.
- **Mock de `calculo` que llega a producción:** el back no lo devuelve, así que B-11 no debe asumir su presencia. Mitigación: campo opcional y consumo condicional.
- **Patente en mayúsculas:** el back normaliza. El formulario de B-09 también debe normalizar para mostrar lo que se guardó.
- **`GET vehiculos` con cliente inexistente:** devuelve `[]`, no 404 (D13). No usar la falta de resultados como validación de cliente.
- **Mocks de PB-23 y PB-10 son ficticios:** el handler nunca debe usarse para decisiones de negocio.

## 15. Definición de terminado

- `lint`, `typecheck`, `test`, `build` en verde (FC8).
- Sin secretos. Sin `fetch` directo (FC13).
- Los 10 criterios de §11 con evidencia observada.

## 16. Observaciones al índice

- Resuelto (RV-29 / D-26-3): `PUT` y `DELETE` de vehículos quedan fuera de alcance (implementados en PR #47, ninguna pantalla los consume). Si se necesitan, tarjeta propia.
- ABIERTO: "Sin dependencia de T-10 para la función; conviene confirmarlo con el dueño de T-10". Motivo: no aparece en REVISION.md ni en FB8. FC9 ya dice que la UI usa el mapa de T-10, pero no decide la pregunta.
