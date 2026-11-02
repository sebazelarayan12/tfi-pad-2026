# US-FE-T-27: API planes

Tipo T · Oleada 2 · Tamaño S · Rama sugerida `feature/US-FE-T-27-api-planes` · Tarjeta Trello `US-FE-T-27`.

## 1. Objetivo

Dejar tipados, con función de request, claves de caché y handlers MSW, el ABM de planes y su lectura pública: `GET /api/planes` (anónimo, lo usan la web y el backoffice), `GET /api/planes/{id}`, `POST`, `PUT` y `DELETE` (solo Administrador). Consumidores: W-02 (tabla pública), B-22 (listado y edición), B-23 (alta, baja y reactivación oculta), B-12 (detalle del plan al emitir).

Lo implementado está en `development` (PR #23). Los inactivos (`incluirInactivos`) y la reactivación (`PATCH .../activo`) son PB-09: solo MSW.

## 2. Alcance

**Entra**
- `dto/planes.ts` (dueño T-27): `PlanRequest`, `PlanResponse`, `PlanListResponse`, y los tipos mock de PB-09.
- `endpoints/planes.ts`: `listarPlanes`, `obtenerPlan`, `crearPlan`, `actualizarPlan`, `desactivarPlan`, y los mocks `listarPlanesIncluyendoInactivos` y `reactivarPlan`.
- Claves: `planesKeys.lista(opciones)`, `planesKeys.detalle(id)`.
- MSW en `mocks/handlers/planes.ts`.
- `incluirInactivos` y `PATCH .../activo` solo en MSW. Su filtro se oculta tras una constante, no con `VITE_USE_MOCKS` (RV-D29).

**NO entra**
- Hooks TanStack Query: los escriben W-02 (web), B-22 y B-23 (backoffice), en sus `features/*/api/` (FC2).
- Validaciones zod del formulario de plan: B-22 y B-23.
- Pantallas y textos: B-13 (planes en el sidebar, PB-09 aparte).

## 3. Dependencias

- **Depende de:** US-FE-T-08, US-FE-T-11, US-FE-T-12.
- **Oleada:** 2.
- **Puede empezar sin esperar a:** US-FE-W-02, US-FE-B-22.
- **Bloqueada por pedidos al back:** PB-09 (inactivos y reactivación). Sin el endpoint, el listado de inactivos y el botón de reactivar quedan ocultos (B-13 y B-23, decisión D-B13 de `pantallas/B13-planes.md`).
- **Workaround MSW:** `incluirInactivos=true` y `PATCH /activo` solo existen en el handler. Ver riesgo de §14: el back ignora el query param y devuelve 200 con activos.

## 4. Documentos a leer

- `contratos-api/vehiculos-planes-cotizaciones.md` §3.1 (qué es un plan), §3.2 (campos del ABM, tabla y `PlanRequest`), §3.3 (RN05, RN15, RN16), §4.1 a §4.5 (endpoints y errores), §9 dudas D7, D8, D14.
- `pedidos-al-back.md` PB-09.
- `pantallas/B13-planes.md` (listado, edición, alta, desactivación, reactivación oculta; D-B13).
- `pantallas/W1-inicio.md` §13 #2 (precio "desde" = PrimaBase, D-07).
- `00-decisiones-base.md` FB4, FB7.9 (`retry: 0` en mutaciones), FB7.10 (Planes solo Admin).
- `tareas/INDEX.md` FC2, FC3, FC5, FC10, FC11, FC13; decisiones D-07, D-08, D-09.
- Back: `backend/Aseguradora.Api/Controllers/PlanesController.cs` (`[HttpGet]` y `[HttpGet("{id:guid}")]` con `[AllowAnonymous]`; `[HttpPost]`, `[HttpPut("{id:guid}")]`, `[HttpDelete("{id:guid}")]` con `[Authorize(Policy = Politicas.Admin)]`). DTO verificado: `Application/Dtos/PlanRequest.cs` (`Codigo` 10, `Nombre` 80, `Descripcion` 500, `PrimaBase` decimal, `TiposPermitidos` 50, `AntiguedadMaxima` int?). `PlanResponse.cs` (record).

## 5. Archivos a crear o modificar

| Archivo | Acción |
|---|---|
| `packages/api/src/dto/planes.ts` | nuevo (dueño T-27) |
| `packages/api/src/endpoints/planes.ts` | nuevo |
| `packages/api/mocks/handlers/planes.ts` | nuevo (dueño T-27) |
| `packages/api/test/contract/planes.contract.test.ts` | nuevo (RV-D31) |
| `packages/api/src/index.ts` | bloque de export (dueño T-12) |

No se edita ningún `package.json`, ni `apps/*`.

## 6. Pasos de implementación

1. Confirmar con T-08 el cliente y `ApiError`; con T-11 el agregador; con T-12 `ProblemDetails`.
2. Escribir `dto/planes.ts` con `PlanRequest` (campos y límites de §7), `PlanResponse` y `PlanListResponse`.
3. Escribir las cinco funciones de §7 y las dos mock de PB-09, marcadas como MOCK en el nombre o en un comentario.
4. Exportar `planesKeys.lista({ incluirInactivos? })` = `['planes', 'lista', { incluirInactivos }]` y `planesKeys.detalle(id)`. La lista pública y la de admin usan claves distintas.
5. Escribir los handlers: éxito con RC, TC y TR del contrato, y variantes con nombre (§7).
6. Escribir los tests de §10 y agregar el bloque de export.
7. Correr `lint`, `typecheck`, `test`.

## 7. Contrato con el back

Política: `GET` y `GET {id}` son anónimos (`[AllowAnonymous]`). `POST`, `PUT` y `DELETE` requieren `Politicas.Admin` (rol Administrador). Un Empleado recibe 403. Sin token en las rutas de Admin: 401.

Tipos de `PlanResponse` y `PlanRequest` (`tiposPermitidos` usa **nombres** de `TipoVehiculo`, no números; es la única excepción de enum de la API, contrato §3.2, D8).

```ts
// dto/planes.ts
export interface PlanRequest {
  codigo: string;                    // máx. 10. El back lo pasa a MAYÚSCULAS y lo hace único
  nombre: string;                    // máx. 80
  descripcion: string;               // máx. 500
  primaBase: number;                 // > 0. Redondeo a 2 decimales en el back
  tiposPermitidos: string;           // nombres separados por coma: "Auto,Moto,Camioneta". máx. 50
  antiguedadMaxima?: number | null;  // >= 0, o null = sin límite
}

export interface PlanResponse {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  primaBase: number;
  tiposPermitidos: string;           // mismo formato que la request
  antiguedadMaxima: number | null;
  activo: boolean;
}

export type PlanListResponse = PlanResponse[];
```

### 7.1 `GET /api/planes`

- **Estado:** Implementado (PR #23). **Auth:** anónimo. **Response:** 200 con `PlanListResponse`, solo `activo: true`, ordenado por `codigo` sin distinguir mayúsculas.
- **Función:** `listarPlanes(): Promise<PlanResponse[]>`. **Clave:** `planesKeys.lista({})`. **Hook (lo escribe W-02):** `usePlanesPublicos()`, `useQuery`, con reintento por defecto de TanStack (no es `/api/publico`, FC13).
- **MSW:** `http.get('*/api/planes')`. Éxito: RC, TC y TR del contrato §3.1. Variante: `planesError500` (500 con `"Ocurrió un error inesperado."`).

### 7.2 `GET /api/planes/{id}`

- **Estado:** Implementado (PR #23). **Auth:** anónimo. **Response:** 200 con `PlanResponse`.
- **Función:** `obtenerPlan(id: string): Promise<PlanResponse>`. **Clave:** `planesKeys.detalle(id)`. **Hook (lo escribe B-12):** `usePlan(id)`, `useQuery`.
- **Errores:** 404 `ProblemDetails` con `detail: "El plan {id} no existe o no está activo."` (mismo mensaje para inexistente e inactivo).
- **MSW:** éxito con TR. Variante `planNoActivo` (404).

### 7.3 `POST /api/planes`

- **Estado:** Implementado (PR #23). **Auth:** `Admin`. **Request:** `PlanRequest`. **Response:** 201 con `PlanResponse` (`Location` no legible, PB-17).
- **Función:** `crearPlan(body: PlanRequest): Promise<PlanResponse>`. **Clave al éxito:** `planesKeys.lista({})`, `planesKeys.lista({ incluirInactivos: true })`.
- **Hook (lo escribe B-23):** `useCrearPlan()`, `useMutation`, `retry: 0` (FB7.9).
- **MSW:** `http.post('*/api/planes')`. Éxito: 201 con el plan normalizado (código en mayúsculas, tipos sin espacios). Variantes de §7.3.1.

#### 7.3.1 Errores de `POST /api/planes` y `PUT /api/planes/{id}`

| Status | Forma | Cuándo | Texto del back |
|---|---|---|---|
| 400 | `ValidationProblemDetails` | `codigo` vacío, o largos superados (`[StringLength]`) | claves `errors.Codigo`, `errors.Nombre`, `errors.Descripcion`, `errors.TiposPermitidos` (texto ASP.NET en inglés: mostrar texto propio) |
| 400 | `ProblemDetails` | nombre o descripción vacíos tras recortar | `"El nombre del plan es obligatorio."` / `"La descripción del plan es obligatoria."` |
| 400 | `ProblemDetails` | `primaBase <= 0` | `"La prima base debe ser mayor que cero."` |
| 400 | `ProblemDetails` | `antiguedadMaxima < 0` | `"La antigüedad máxima debe ser mayor o igual a cero."` |
| 400 | `ProblemDetails` | `tiposPermitidos` vacío | `"Debe indicar al menos un tipo de vehículo permitido."` |
| 400 | `ProblemDetails` | un tipo no es Auto, Moto o Camioneta | `"El tipo de vehículo '{X}' no es válido."` |
| 400 | `ProblemDetails` | código duplicado en alta | `"Ya existe un plan con el código '{C}'."` |
| 400 | `ProblemDetails` | código duplicado en edición (otro plan) | `"Ya existe otro plan con el código '{C}'."` |
| 404 | `ProblemDetails` | id inexistente en PUT | `"El plan {id} no existe."` |
| 401 / 403 | sin cuerpo | token ausente o rol Empleado | (no usar texto del back) |

Nota: en PUT, `activo` no cambia y un plan inactivo se puede editar con 200 y sigue inactivo (D7). La UI de B-22 lo advierte; esta tarea no lo oculta.

### 7.4 `PUT /api/planes/{id}`

- **Estado:** Implementado (PR #23). **Auth:** `Admin`. **Request:** `PlanRequest`. **Response:** 200 con `PlanResponse`.
- **Función:** `actualizarPlan(id: string, body: PlanRequest): Promise<PlanResponse>`. **Clave:** `planesKeys.detalle(id)` y `planesKeys.lista(...)`.
- **Hook (lo escribe B-22):** `useActualizarPlan(id)`, `useMutation`, `retry: 0`.
- **MSW:** `http.put('*/api/planes/:id')`. Éxito: 200. Variantes: `planNoExiste` (404), `codigoDeOtroPlan` (400), `planValidacion` (400 con `errors`).

### 7.5 `DELETE /api/planes/{id}` (desactivar)

- **Estado:** Implementado (PR #23). **Auth:** `Admin`. **Response:** 204 sin cuerpo. Repetirlo no falla (RN15).
- **Función:** `desactivarPlan(id: string): Promise<void>`. **Clave al éxito:** `planesKeys.lista({})`, `planesKeys.lista({ incluirInactivos: true })`, `planesKeys.detalle(id)`.
- **Hook (lo escribe B-23):** `useDesactivarPlan()`, `useMutation`, `retry: 0`.
- **MSW:** `http.delete('*/api/planes/:id')`. Éxito: 204. Variante: `planNoExiste` (404 `"El plan {id} no existe."`).

### 7.6 `GET /api/planes?incluirInactivos=true` (PB-09, MOCK)

- **Estado:** **NO EXISTE** en el back. El back ignora el parámetro (ver §14) y devuelve solo activos con 200.
- **Política propuesta:** `Admin` cuando `incluirInactivos=true`.
- **Función mock:** `listarPlanesIncluyendoInactivos(): Promise<PlanResponse[]>`. **Clave:** `planesKeys.lista({ incluirInactivos: true })`.
- **MSW:** responde activos e inactivos solo si el handler recibe `incluirInactivos=true`. Variante `planesInactivos` con un plan con `activo: false`.

### 7.7 `PATCH /api/planes/{id}/activo` (PB-09, MOCK)

- **Estado:** **NO EXISTE**. Único implementador: el handler MSW.
- **Request:** `ActivoPlanRequest { activo: boolean }`. **Response (propuesta):** 200 con `PlanResponse`.
- **Función mock:** `reactivarPlan(id: string, activo: boolean): Promise<PlanResponse>`. **Hook (lo escribe B-23, oculto):** `useActivarPlan(id)`, `useMutation`, `retry: 0`.
- **MSW:** `http.patch('*/api/planes/:id/activo')`. Éxito: 200 con el plan activado. Variante `planNoExiste` (404).

```ts
// dto/planes.ts (MOCK, PB-09)
export interface ActivoPlanRequest {
  activo: boolean;
}
```

## 8. Contenido de UI

No aplica (sin UI en esta tarea). Textos de error del back: los consumen B-22 y B-23 tal cual (`detail` sin transformar). El nombre del plan en el listado público y las etiquetas de `tiposPermitidos` (chips) los define W-02 y B-22. Ver `pantallas/B13-planes.md` y `pantallas/W1-inicio.md`.

## 9. Estados y casos borde

- **Plan inactivo en `GET {id}`:** 404 (no se muestra en el detalle público).
- **Código en minúsculas:** el back lo guarda en mayúsculas (`xx` → `XX`). La UI no debe asumir el texto enviado.
- **Tipos en orden libre:** el back normaliza (`auto, Camioneta` → `Auto,Camioneta`). El MSW debe replicarlo.
- **`antiguedadMaxima` null:** "Sin límite" (decisión de B-22).
- **Doble clic en alta, edición o baja:** botón deshabilitado (FC11). Un código repetido da 400.
- **Token vencido en rutas de Admin:** 401 y cierre de sesión (T-08).
- **Empleado en rutas de Admin:** 403. El sidebar oculta el ítem (FB7.10), pero la función no lo filtra.
- **PB-09 en modo real:** `incluirInactivos` se ignora y `PATCH` no existe. Ver §14.

## 10. Tests requeridos

Vitest + MSW. Un test por código de error (FC5).

1. `GET planes devuelve PlanResponse[] solo activos, ordenados por codigo`.
2. `GET planes no requiere token` (no envía `Authorization`).
3. `GET plan por id devuelve PlanResponse`.
4. `GET plan por id inactivo devuelve 404 con detail "El plan {id} no existe o no está activo."`.
5. `POST planes devuelve 201 con codigo en mayúsculas`.
6. `POST planes devuelve 400 de validación con errors en PascalCase` (`Codigo`).
7. `POST planes devuelve 400 de negocio para cada detail de §7.3.1` (`it.each`, siete textos).
8. `POST planes devuelve 400 con código duplicado` (texto de alta).
9. `PUT planes devuelve 400 con código de otro plan` (texto de edición).
10. `PUT planes devuelve 404 si el plan no existe`.
11. `DELETE planes devuelve 204`.
12. `DELETE planes devuelve 404 si el plan no existe`.
13. `POST, PUT y DELETE devuelven 403 con rol Empleado` (MSW variante).
14. `Las rutas de Admin devuelven 401 sin token` (`it.each`).
15. `Las funciones mock de PB-09 se marcan como MOCK y devuelven el tipo de PlanResponse`.
16. `Ninguna mutación se reintenta en la función` (una request ante 500).

## 11. Criterios de aceptación

1. `PlanRequest`, `PlanResponse` y `PlanListResponse` existen en `dto/planes.ts` con los campos de §7.
2. `listarPlanes`, `obtenerPlan`, `crearPlan`, `actualizarPlan` y `desactivarPlan` existen y coinciden con los endpoints implementados.
3. Las funciones mock de PB-09 están marcadas como MOCK. `incluirInactivos` y `PATCH .../activo` quedan ocultos tras una constante hasta que PB-09 se publique, no tras `VITE_USE_MOCKS` (RV-D29).
4. Las claves `planesKeys.lista` diferencian pública y admin.
5. Todos los handlers devuelven éxito por defecto y tienen variantes con nombre para cada error de §7.
6. Los tests de §10 pasan en verde.
7. `lint`, `typecheck`, `test`, `build` de `@nexa/api` en verde.
8. Las tablas de error coinciden con `contratos-api/vehiculos-planes-cotizaciones.md` §4.2 a §4.5.
9. La advertencia de §14 sobre `incluirInactivos` queda registrada en el handler como comentario.

## 12. Verificación manual

Sin prueba manual de UI en esta tarjeta.

Contra el back local: `GET /api/planes` y `GET /api/planes/{id}` están **Implementados**. Con el back en `http://localhost:8080`, correr los tests de contrato (T-23) y confirmar que `GET /api/planes` devuelve RC, TC y TR del seed. `PATCH` y `incluirInactivos` no tienen prueba contra el back: el endpoint no existe.

## 13. Decisiones pendientes

- **D-27-1 (PB-09):** default: los mocks existen y B-23 oculta el listado de inactivos y la reactivación (D-B13). Se activan cuando el back publique PB-09.
- **D-27-2 (`PUT` de plan inactivo):** default: la función envía el body sin cambios; B-22 advierte que el plan queda inactivo (D7).
- **D-27-3 (normalización):** default: el MSW replica la normalización del back (mayúsculas, sin espacios). La UI no normaliza por su cuenta.
- **D-API-1 (hooks en features, FC2).** Default (RV-44): los hooks los escriben W-02, B-22 y B-23 en sus `features/*/api/`; `@nexa/api` solo exporta funciones, tipos y claves.

## 14. Riesgos y errores comunes

- **Query param ignorado sin error (B-14 y B-23):** ASP.NET ignora `incluirInactivos` si el back no lo soporta. `GET /api/planes?incluirInactivos=true` devuelve 200 con solo activos, sin error. Si la UI llega a montarse en modo real, el listado de inactivos muestra activos y parece correcto. Mitigación: B-23 se oculta hasta PB-09; la función mock no se conecta a la vista hasta entonces.
- **`PATCH` inexistente en real:** con `VITE_USE_MOCKS=false` la función recibe 404 sin cuerpo de negocio. Mitigación: el hook de reactivar no se monta (D-27-1).
- **Plan inactivo editable:** el PUT responde 200 y lo deja inactivo (D7). Mitigación: advertencia en B-22.
- **Caché pública y de admin mezcladas:** si comparten clave, un listado sin inactivos puede pisar al de admin. Mitigación: claves distintas (§6.4).
- **`tiposPermitidos` como texto:** comparar con una lista fija de nombres (`Auto`, `Moto`, `Camioneta`). El back rechaza otros valores con 400.
- **Precio "desde" (W-02):** usar `primaBase` tal cual (D-07). No recalcular.

## 15. Definición de terminado

- `lint`, `typecheck`, `test`, `build` en verde (FC8).
- Sin secretos. Sin `fetch` directo (FC13).
- Los 9 criterios de §11 con evidencia observada.

## 16. Observaciones al índice

- Resuelto (RV-30): `GET /api/planes?incluirInactivos=true` responde 200 con solo activos. El pedido va a `pedidos-al-back.md` PB-09 en un PR de docs aparte; ninguna tarea de front lo edita. El filtro queda oculto (RV-D29).
- Resuelto (RV-01): §3 sigue la fila del INDEX; no hay dependencias adicionales.
