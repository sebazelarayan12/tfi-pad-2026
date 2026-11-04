# US-FE-T-24: API clientes: lectura, edición, baja y cuenta

Tipo T · Oleada 2 · Tamaño M · Rama sugerida `feature/US-FE-T-24-api-clientes-lectura` · Tarjeta Trello `US-FE-T-24`

## 1. Objetivo

Dejar en `@nexa/api` las funciones de request tipadas, los DTO, las query keys y los handlers MSW de los endpoints de clientes que US-FE-B-04 (listado), B-07 (ficha), B-08 (edición y baja), B-14 (búsqueda por DNI) y B-09/B-10/B-12 (nombre del cliente) consumen: listado paginado, detalle, modificación, baja lógica y cuenta (deuda). Todo contra MSW hasta que el back publique cada endpoint (FB7.7). Al terminar, cualquier feature del backoffice llama `listarClientes`, `obtenerCliente`, `modificarCliente`, `darDeBajaCliente` y `obtenerCuentaCliente` sin escribir `fetch`, y el harness de US-FE-T-23 valida cada endpoint contra el contrato.

Esta tarea no crea hooks de TanStack Query: cada feature los escribe en su `api/` (FC2).

## 2. Alcance

**Entra**
- `packages/api/src/dto/clientes.ts`: `SexoCliente`, `ClienteResponse`, `ClienteResumenResponse`, `ClienteFiltro`, `ClienteModificacionRequest`, `CuentaClienteResponse`.
- `packages/api/src/endpoints/clientes.ts`: funciones de request y `clientesKeys`.
- `packages/api/mocks/handlers/clientes.ts` (reemplaza el placeholder de US-FE-T-11) y `packages/api/mocks/fixtures/clientes.ts`.
- Bloques de export en `packages/api/src/index.ts` (dueño US-FE-T-12).
- Tests: `packages/api/src/endpoints/clientes.test.ts`, `packages/api/mocks/handlers/clientes.test.ts`, `packages/api/test/contract/clientes.contract.test.ts`.

**NO entra**
- Alta de cliente, validación Renaper y `ClienteAltaRequest`: US-FE-T-25. Comparte `dto/clientes.ts` y `endpoints/clientes.ts`; agrega su bloque (sección 16).
- Hooks TanStack Query, formularios y pantallas: US-FE-B-04, B-05, B-06, B-07, B-08, B-14.
- Vehículos, pólizas y cuotas: US-FE-T-26, T-28. `CuentaClienteResponse` usa un tipo local (`CuotaCuentaCliente`) que copia la forma de `CuotaResponse`, para no depender de T-28 al compilar.
- Cliente HTTP y `ApiError`: US-FE-T-08.

## 3. Dependencias

- **Depende de:** US-FE-T-08, US-FE-T-11, US-FE-T-12.
- **Oleada:** 2.
- **Puede empezar sin esperar a:** US-FE-B-04.
- **Bloqueada por pedidos al back (PB-NN):**
  - PB-03 (`GET /api/clientes` listado con `ClienteResumenResponse`, `GET /{id}`, `PUT`, `DELETE`): todos Especificados, sin PR. Se trabaja con MSW.
  - PB-28 (`GET /api/clientes/{id}/cuenta`): NO existe. Solo MSW, con la forma propuesta en PB-28 (rail oculto, D-33).
- **Workaround MSW (FB7.7):** handlers en `packages/api/mocks/handlers/clientes.ts` que replican método, URL, query, body y respuesta de la sección 7. Cada endpoint tiene el estado de la tabla de la sección 7.

## 4. Documentos a leer

- `docs/frontend/contratos-api/seguridad-clientes-publico.md`:
  - §0 (estado de cada grupo: el listado, detalle, PUT y DELETE están Especificados; `/cuenta` no aparece porque es PB-28).
  - §1.1 (camelCase, `DateOnly`, `char` como string), §1.2 (formas de error A, B y C), §1.3 (códigos de estado del grupo).
  - §3.1, bloque `ClienteResponse` (campos y tipos; sus líneas de PR #50 se usan solo como forma del DTO).
  - §3.4 completo (listado, detalle, modificación y baja, con reglas y decisiones pendientes).
  - §5 (reglas de negocio visibles: RN01, RN02, RN15).
- `docs/frontend/pedidos-al-back.md`: PB-03 (contrato mínimo propuesto de `ClienteResumenResponse`) y PB-28 (forma de `/cuenta`).
- `docs/frontend/pantallas/B3-clientes.md`: §6 (filtros DNI y apellido), §9 (origen de cada columna de la tabla y ejemplo de ítem).
- `docs/frontend/pantallas/B5-ficha-cliente.md`: §9 (endpoints y origen de cada bloque).
- `docs/frontend/contratos-api/convenciones-transversales.md`: §5.3 (fechas), §5.4 (decimales), §6.1 (paginación común).
- `docs/frontend/00-decisiones-base.md`: FB4 (contrato, errores), FB7.4 (fechas), FB7.6 (errores y `detail`), FB7.7 (mocks), FB7.11 (datos que el back no devuelve).
- `docs/frontend/tareas/INDEX.md`: FC2 (requests en `@nexa/api`, query keys), FC3 (handlers por dominio), FC4 (datos de ejemplo), FC5 (tests por API card), FC9 (DNI con puntos solo en presentación), FC10 (errores), FC17. Decisiones D-01, D-15, D-33.

## 5. Archivos a crear o modificar

Bajo `frontend/packages/api/`:

| Archivo | Dueño | Notas |
|---|---|---|
| `src/dto/clientes.ts` | T-24 (crea); T-25 agrega sus tipos de alta | Un archivo por dominio (INDEX). |
| `src/endpoints/clientes.ts` | T-24 (crea); T-25 agrega sus funciones | Ownership del INDEX: `endpoints/<dominio>.ts` (API card del dominio, FC2). |
| `src/endpoints/clientes.test.ts` | T-24 | |
| `src/index.ts` | T-12 (dueño); T-24 agrega su bloque | Dos líneas: `export * from './dto/clientes'` y `export * from './endpoints/clientes'`. |
| `mocks/handlers/clientes.ts` | T-11 deja el placeholder; T-24 lo completa | |
| `mocks/handlers/clientes.test.ts` | T-24 | |
| `mocks/fixtures/clientes.ts` | T-24 | Fixtures del dominio (RV-07 f); las comunes son de T-11. |
| `test/contract/clientes.contract.test.ts` | T-24 (crea); T-25 agrega su bloque | Usa el harness de T-23 (RV-D31). |

No se toca `src/dto/polizas.ts` (T-28) ni `src/client/*` (T-08).

## 6. Pasos de implementación

1. Leer el barrel `src/index.ts` y el placeholder de `mocks/handlers/clientes.ts`. Confirmar que T-08 y T-12 están mergeadas.
2. Crear `src/dto/clientes.ts` con los tipos de la sección 7 (copiar nombres y campos exactos).
3. Crear `src/endpoints/clientes.ts`:
   - Cinco funciones que reciben el cliente HTTP de T-08 como primer argumento (ver sección 13, decisión 1).
   - Serializar la query con `URLSearchParams`: omitir `undefined` y cadenas vacías; `apellido` con `trim()`; `pagina` y `tamanoPagina` como número.
   - `modificarCliente` envía el body tal cual lo recibe. El tipo `ClienteModificacionRequest` impide pasar `dni` o `nombre`.
   - `darDeBajaCliente` devuelve `Promise<void>` (204).
   - Exportar `clientesKeys` (sección 7).
4. Completar `mocks/fixtures/clientes.ts`: dos clientes activos, uno inactivo y un cliente con póliza activa para el caso de baja con 400 (sección 10). Usar los ejemplos de `seguridad-clientes-publico.md` (FC4): DNI `30123456`, `Juan Carlos Pérez`; DNI `45123456`, `Lucía Fernández`.
5. Completar `mocks/handlers/clientes.ts`: `GET /api/clientes`, `GET /api/clientes/:id`, `PUT /api/clientes/:id`, `DELETE /api/clientes/:id`, `GET /api/clientes/:id/cuenta`. Reglas en la sección 9.
6. Agregar los exports al barrel (bloque de T-24).
7. Escribir `endpoints/clientes.test.ts`, `mocks/handlers/clientes.test.ts` y `test/contract/clientes.contract.test.ts` (sección 10).
8. Correr `npm run test` y `npm run test:contract` del paquete.
9. Actualizar el mock de PB-03 y PB-28 en el detalle de la tarea si el back cambia (FB7.7).

## 7. Contrato con el back

### 7.1 Tipos (`src/dto/clientes.ts`)

```ts
export type SexoCliente = 'M' | 'F' | 'X';

// Estado: Especificado (PR #50 define ClienteResponse para alta; GET /{id} sin campos fijados).
// Forma propuesta = seguridad-clientes-publico.md §3.1 + activo (RN15). Ver sección 13.
export interface ClienteResponse {
  id: string;                              // Guid
  dni: string;                             // 8 dígitos, sin puntos
  cuil: string;                            // 11 dígitos
  nombre: string;
  apellido: string;
  fechaNacimiento: string;                 // "yyyy-MM-dd" (DateOnly)
  sexo: SexoCliente;
  email: string;
  telefono: string | null;
  calle: string;
  numero: string;
  localidad: string;
  provincia: string;
  codigoPostal: string;
  validadoRenaper: boolean;                // RN02
  fechaValidacionRenaper: string | null;   // formato NO DEFINIDO (FB7.4, PB-16)
  activo: boolean;                         // RN15
}

// Estado: Especificado. Campos propuestos por PB-03 (B3 pide conteos). Ver sección 13.
export interface ClienteResumenResponse {
  id: string;
  dni: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  validadoRenaper: boolean;
  activo: boolean;
  cantidadVehiculos: number;
  cantidadPolizasActivas: number;
}

// Query de GET /api/clientes. Estado: Especificado.
export interface ClienteFiltro {
  dni?: string;            // exacto (propuesta, decisión 2)
  apellido?: string;       // contiene, sin distinguir mayúsculas (propuesta, decisión 3)
  pagina?: number;         // default 1
  tamanoPagina?: number;   // default 20, máximo 100 (decisión 4)
}

// Body de PUT /api/clientes/{id}. Estado: Especificado (seguridad §3.4).
export interface ClienteModificacionRequest {
  email: string;
  telefono?: string | null;
  calle: string;
  numero: string;
  localidad: string;
  provincia: string;
  codigoPostal: string;
}

// Forma copiada de CuotaResponse (contratos-api/polizas-cuotas-pagofacil.md, línea 445).
// Local para no importar de dto/polizas.ts (T-28 corre en paralelo). estado: número (EstadoCuota).
export interface CuotaCuentaCliente {
  id: string;
  numero: number;
  importe: number;
  recargo: number;
  fechaVencimiento: string;   // "yyyy-MM-dd"
  estado: number;
  fechaPago: string | null;
}

// Respuesta de GET /api/clientes/{id}/cuenta. Estado: NO EXISTE (PB-28). Solo mock.
export interface CuentaClienteResponse {
  deudaVencida: number;                          // decimal, 2 decimales
  cuotaVencidaConRecargo: CuotaCuentaCliente | null;
  proximaCuota: CuotaCuentaCliente | null;
}
```

`PaginaResponse<T>` viene de US-FE-T-12 (`items`, `pagina`, `tamanoPagina`, `total`).

### 7.2 Endpoints

| Método y ruta | Estado | Request | Respuesta | Errores | Handler MSW |
|---|---|---|---|---|---|
| `GET /api/clientes` | Especificado (PB-03) | Query: `dni`, `apellido`, `pagina`, `tamanoPagina` | 200 `PaginaResponse<ClienteResumenResponse>` | 400 si `tamanoPagina > 100` (forma A, sección 13 decisión 5); 401 sin token (forma C) | Sí |
| `GET /api/clientes/{id}` | Especificado (PB-03) | Path `id` (Guid) | 200 `ClienteResponse` | 404 si no existe o `activo=false` (forma A); 401 | Sí |
| `PUT /api/clientes/{id}` | Especificado (PB-03) | Body `ClienteModificacionRequest` | 200 `ClienteResponse` (propuesta, decisión 6) | 400 email de otro cliente, forma A, sin modificar nada; 404; 401 | Sí |
| `DELETE /api/clientes/{id}` | Especificado (PB-03) | Path `id` | 204 sin body | 400 si tiene pólizas activas (propuesta, decisión 7); 404; 401 | Sí |
| `GET /api/clientes/{id}/cuenta` | NO EXISTE (PB-28) | Path `id` | 200 `CuentaClienteResponse` | 404; 401 | Solo mock |

Notas de contrato:
- Las respuestas de error usan forma A (`ProblemDetails` con `detail`). La UI muestra `detail` (FC10).
- `GET /api/clientes?dni=` es el mismo endpoint con un solo filtro: lo consume B-14 (búsqueda por DNI, `Especificado`).
- DNI sin puntos en request y en respuesta. El formato con puntos es solo de presentación (FC9).
- `PUT` no acepta `dni`, `cuil`, `nombre`, `apellido` ni datos de Renaper (spec, US-F1-06 criterio 810).
- Baja lógica (`activo = false`): el cliente sigue existiendo y deja de aparecer en el listado (RN15).

### 7.3 Funciones de request (`src/endpoints/clientes.ts`)

```ts
export function listarClientes(api: ApiClient, filtro?: ClienteFiltro): Promise<PaginaResponse<ClienteResumenResponse>>;
export function obtenerCliente(api: ApiClient, id: string): Promise<ClienteResponse>;
export function modificarCliente(api: ApiClient, id: string, cuerpo: ClienteModificacionRequest): Promise<ClienteResponse>;
export function darDeBajaCliente(api: ApiClient, id: string): Promise<void>;
export function obtenerCuentaCliente(api: ApiClient, id: string): Promise<CuentaClienteResponse>;

export const clientesKeys = {
  todos: ['clientes'] as const,
  listas: () => [...clientesKeys.todos, 'lista'] as const,
  lista: (filtro: ClienteFiltro) => [...clientesKeys.listas(), filtro] as const,
  detalles: () => [...clientesKeys.todos, 'detalle'] as const,
  detalle: (id: string) => [...clientesKeys.detalles(), id] as const,
  cuenta: (id: string) => [...clientesKeys.todos, 'cuenta', id] as const,
};
```

`ApiClient` es el tipo que exporte US-FE-T-08. Las funciones no capturan errores: `ApiError` sube a la feature.

Regla de invalidación (para las features): tras `modificarCliente` o `darDeBajaCliente`, invalidar `clientesKeys.detalle(id)`, `clientesKeys.cuenta(id)` y `clientesKeys.listas()`.

### 7.4 Handlers MSW

Cada handler replica método, ruta, query y body de la tabla de 7.2. Comportamiento:
- `GET` lista: filtra `dni` exacto y `apellido` por contiene sin distinguir mayúsculas, sobre clientes activos; pagina con `tamanoPagina` (default 20); `tamanoPagina > 100` responde 400 con `ProblemDetails`.
- `GET` detalle: 404 si el id no existe o `activo=false`.
- `PUT`: 400 si el email pertenece a otro cliente activo; no modifica nada en ese caso.
- `DELETE`: 404 si no existe o ya está inactivo; 400 si el cliente de fixture tiene póliza activa; si no, marca `activo=false` y responde 204. Un segundo `DELETE` del mismo id responde 404.
- `GET /cuenta`: responde la forma de PB-28 con datos de fixture.
- Sin `Authorization`: 401 en todos.

## 8. Contenido de UI

No aplica: API card. Los textos de error llegan del back en `detail` y los muestra la feature (FC10, FB7.6). Esta tarea no agrega texto de pantalla.

## 9. Estados y casos borde

- **Lista vacía:** `items: []`, `total: 0` (no es error).
- **Página fuera de rango:** `items: []` con `total` correcto (no 404).
- **`tamanoPagina` 101:** 400 (ProblemDetails). El front lo evita con el selector de tamaño de B3 (10 filas, D-01).
- **Id inexistente o inactivo:** 404 para GET, PUT y DELETE.
- **PUT con email de otro cliente:** 400, sin cambios. La ficha se recarga para mostrar el dato anterior.
- **DELETE con póliza activa:** 400 con `detail`. Esta tarea no cambia el estado.
- **DELETE repetido:** 404.
- **Renaper caído o datos sin validar:** fuera de esta tarea (T-25).
- **Cuenta sin cuotas:** `cuotaVencidaConRecargo: null`, `proximaCuota: null`, `deudaVencida: 0.00`.

## 10. Tests requeridos

| Archivo | Test | Herramienta | Afirma |
|---|---|---|---|
| `endpoints/clientes.test.ts` | `listarClientes envía solo los filtros con valor` | Vitest | Sin `dni` vacío ni `apellido` vacío en la query. |
| `endpoints/clientes.test.ts` | `apellido se envía sin espacios laterales` | Vitest | `' pér '` → `apellido=pér`. |
| `endpoints/clientes.test.ts` | `dni se envía sin puntos, tal como se recibe` | Vitest | Sin transformación (FC9). |
| `endpoints/clientes.test.ts` | `modificarCliente envía el body sin cambios` | Vitest | Mismo objeto de entrada en el body. |
| `endpoints/clientes.test.ts` | `darDeBajaCliente resuelve sin cuerpo con 204` | Vitest | Devuelve `undefined`. |
| `endpoints/clientes.test.ts` | `clientesKeys.lista distingue filtros distintos` | Vitest | Claves diferentes para `{dni}` y `{apellido}`. |
| `endpoints/clientes.test.ts` | `obtenerCliente con id inexistente lanza ApiError 404` | Vitest + MSW | `ApiError.status === 404` y `detail` presente. |
| `mocks/handlers/clientes.test.ts` | `filtra por dni exacto` | Vitest + MSW | Un solo resultado para `30123456`. |
| `mocks/handlers/clientes.test.ts` | `filtra apellido por contiene sin distinguir mayúsculas` | Vitest + MSW | `pér` encuentra `Pérez`. |
| `mocks/handlers/clientes.test.ts` | `pagina y total: pagina=2&tamanoPagina=1 devuelve el segundo y total correcto` | Vitest + MSW | Criterio de US-F1-06. |
| `mocks/handlers/clientes.test.ts` | `tamanoPagina mayor que 100 responde 400` | Vitest + MSW | Forma A. |
| `mocks/handlers/clientes.test.ts` | `PUT con email de otro cliente responde 400 y no modifica` | Vitest + MSW | Vuelve a leer el cliente y compara. |
| `mocks/handlers/clientes.test.ts` | `DELETE responde 204 y el cliente deja de listarse` | Vitest + MSW | RN15. |
| `mocks/handlers/clientes.test.ts` | `DELETE repetido responde 404` | Vitest + MSW | |
| `mocks/handlers/clientes.test.ts` | `sin Authorization responde 401` | Vitest + MSW | Forma C. |
| `test/contract/clientes.contract.test.ts` | Un `contratoEndpoint` por fila de la tabla 7.2 | Harness de T-23 | Status, content-type y esquema de éxito y error. |

Cobertura mínima por API card (FC5): un test de contrato por endpoint y un caso de error por código de la tabla.

## 11. Criterios de aceptación

1. `dto/clientes.ts` exporta `SexoCliente`, `ClienteResponse`, `ClienteResumenResponse`, `ClienteFiltro`, `ClienteModificacionRequest` y `CuentaClienteResponse` con los campos de la sección 7.1.
2. `endpoints/clientes.ts` exporta las cinco funciones y `clientesKeys` con la firma de la sección 7.3.
3. `modificarCliente` no permite pasar `dni` ni `nombre` (error de tipo en TypeScript, comprobado con `typecheck`).
4. `GET /api/clientes?pagina=2&tamanoPagina=1` devuelve el segundo elemento y `total` correcto en MSW.
5. `GET /api/clientes?apellido=pér` devuelve clientes con apellido que contenga `pér`, sin distinguir mayúsculas.
6. `tamanoPagina=101` responde 400.
7. `GET /api/clientes/{id}` con id inexistente responde 404 y el cliente de `activo=false` también.
8. `PUT` con email de otro cliente responde 400 y no modifica el registro.
9. `DELETE` responde 204, deja `activo=false` y el cliente no aparece en el listado.
10. Sin token, todos los endpoints responden 401.
11. El harness de T-23 valida los cinco endpoints (`npm run test:contract`).
12. `npm run lint`, `typecheck`, `test` y `build` en verde.
13. No hay `fetch` directo ni hook de TanStack Query en el diff.

## 12. Verificación manual

1. Correr `npm run dev` de `apps/backoffice` con `VITE_USE_MOCKS=true` y, desde la consola del navegador, llamar al handler de `GET /api/clientes?dni=30123456` (vía el cliente de T-08). Esperado: un cliente.
2. Repetir con `apellido=pér` y comprobar que devuelve Pérez.
3. Llamar `DELETE` de un id y luego `GET` del listado. Esperado: el cliente no aparece.

Confirmar con la persona responsable antes del PR (`docs/workflow.md`, regla 7). Esta tarea no tiene pantalla propia, así que la prueba visible llega con B-04.

## 13. Decisiones pendientes (con default)

1. **Firma de las funciones:** default: reciben `ApiClient` como primer argumento (testeable). Alternativa: importar una instancia por defecto de T-08. Se elige la primera.
2. **Filtro `dni`:** NO DEFINIDO (spec US-F1-06 propone exacto). Default: exacto.
3. **Filtro `apellido`:** propuesta de la spec: contiene, sin distinguir mayúsculas. Default: esta propuesta.
4. **Paginación:** spec propone default 20 y máximo 100; B3 pide 10 filas (D-01). Default: 20 y máximo 100 en el back; B3 envía 10.
5. **Tipo de error de `tamanoPagina > 100`:** NO DEFINIDO. Default: forma A (`ProblemDetails`); si el back usa DataAnnotations (forma B), el caso se ajusta en el contrato.
6. **Respuesta de `PUT`:** NO DEFINIDO (spec solo dice 200). Default: `ClienteResponse` actualizado.
7. **Baja con pólizas activas:** propuesta de la spec (bloquear con 400, como vehículos). Default: 400 con `detail` mostrado tal cual (D-15).
8. **Campos de `ClienteResumenResponse`:** PB-03 propone `cantidadVehiculos` y `cantidadPolizasActivas`. Default: esos campos, marcados como propuesta hasta que el back los confirme.
9. **Forma de `CuentaClienteResponse`:** PB-28 propone la forma de la sección 7.1. Default: esa forma, solo mock. El rail queda oculto (D-33).
10. **Formato de `fechaValidacionRenaper`:** NO DEFINIDO (FB7.4, PB-16). Default: se tipa `string | null` y el formateador de T-09 lo interpreta como UTC si no tiene `Z`.

## 14. Riesgos y errores comunes

- **Mandar `dni` con puntos:** el back espera 8 dígitos. Los puntos son solo de presentación.
- **Enviar `dni` o `nombre` en el PUT:** el DTO no los incluye; la UI tampoco.
- **Invalidar solo el detalle después del PUT:** el listado queda con datos viejos. Invalidar también `listas()`.
- **Tomar un 404 de cliente inactivo como error técnico:** es un caso de negocio; la UI muestra `detail`.
- **Mockear el listado con `pagina` en base 0:** la convención es base 1 (`pagina=1` por defecto).
- **Olvidar `PaginaResponse<T>` en el listado:** el back devuelve el envoltorio, no un arreglo plano.
- **Usar `ClienteResponse` para la fila de B3:** esa pantalla usa `ClienteResumenResponse`.

## 15. Definición de terminado

- `lint`, `typecheck`, `test`, `test:contract` y `build` en verde.
- Accesibilidad: no aplica (API card); las pantallas que la usan pasan US-FE-T-19.
- Sin secretos ni credenciales; fixtures con ejemplos de `seguridad-clientes-publico.md`.
- Criterios 1 a 13 de la sección 11 tildados con evidencia observada (salida de los tests y del harness).

## 16. Observaciones al índice

- Resuelto (RV-15): T-24 crea `dto/clientes.ts`, `endpoints/clientes.ts` y `handlers/clientes.ts`; T-25 agrega su bloque y declara T-24 (RV-04).
- Resuelto (triage final, default de la ficha): "La carpeta `endpoints/` no está definida; FC2 dice solo 'en `@nexa/api`'". Motivo: no aparece en REVISION.md ni en FB8; la fila de ownership del INDEX ya la lista como `endpoints/<dominio>.ts` (API card del dominio). Cierre: `endpoints/<dominio>.ts` (INDEX, Ownership).
- Resuelto (RV-55): `CuotaCuentaCliente` copia la forma de `CuotaResponse` en `dto/clientes.ts`; si T-28 publica el tipo, T-24 lo importa. La nota de deuda de tipos va al INDEX.
