# US-FE-T-24: API clientes: lectura, edición, baja y cuenta

Tipo T · Oleada 2 · Tamaño M · Rama sugerida `feature/US-FE-T-24-api-clientes-lectura` · Tarjeta Trello `US-FE-T-24`

## 1. Objetivo

Dejar en `@nexa/api` las funciones de request tipadas, los DTO, las query keys y los handlers MSW de los endpoints de clientes que US-FE-B-04 (listado), B-07 (ficha), B-08 (edición y baja), B-14 (búsqueda por DNI) y B-09/B-10/B-12 (nombre del cliente) consumen: listado paginado, detalle, modificación, baja lógica y cuenta (deuda). Listado, detalle, modificación y baja están implementados en `development` (US-F1-06, PR #58); sus mocks deben reproducir el contrato real. `/cuenta` sigue siendo una propuesta exclusiva de MSW (PB-28), sin habilitar el rail en la UI (D-33). Al terminar, cualquier feature del backoffice llama `listarClientes`, `obtenerCliente`, `modificarCliente`, `darDeBajaCliente` y `obtenerCuentaCliente` sin escribir `fetch`, y los tests verifican cada endpoint contra su contrato. La validación final con el harness de US-FE-T-23 se agrega al rebasar sobre esa tarea (FC5/RV-D31); mientras falte, ese criterio permanece pendiente y no se declara la tarjeta terminada.

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
- Vehículos, pólizas y cuotas: US-FE-T-26, T-28. T-28 ya publica `CuotaResponse`: se reutiliza mediante import de tipo y el alias `CuotaCuentaCliente`, según RV-55, sin duplicar sus campos.
- Cliente HTTP y `ApiError`: US-FE-T-08.
- Ampliar el DTO real del listado con validación Renaper o conteos: pendiente PB-03; no forma parte del contrato implementado ni se simula como si existiera.

## 3. Dependencias

- **Depende de:** US-FE-T-08, US-FE-T-11, US-FE-T-12 (mergeadas).
- **Oleada:** 2.
- **Puede empezar sin esperar a:** US-FE-B-04. T-28 también está mergeada y se reutiliza su tipo de cuota (RV-55).
- **PB-03, parcialmente resuelto:** US-F1-06 (PR #58) implementó listado, detalle, PUT y DELETE. Queda pendiente ampliar el resumen con `validadoRenaper`, `cantidadVehiculos` y `cantidadPolizasActivas`. El DTO del listado y su mock no incluyen esos campos. Los consumidores muestran el dato como no disponible (FB7.11), sin inventar cero, false ni consultas adicionales por fila.
- **PB-28:** `/api/clientes/{id}/cuenta` no existe. Se mantiene solo como contrato propuesto y mock; el rail continúa oculto (D-33).
- **T-23:** integrada en la base de esta implementación. Se usa su harness `contratoEndpoint` sin modificarlo; el criterio 11 se verifica con `npm run test:contract` en modo MSW.
- **MSW:** réplica del backend para los cuatro endpoints publicados; simulación identificada como propuesta para `/cuenta`. No modificar el flag global de mocks ni habilitar datos o pantallas pendientes por estar en modo mock.

## 4. Documentos a leer

- `docs/frontend/contratos-api/seguridad-clientes-publico.md`:
  - §0 (listado, detalle, PUT y DELETE implementados; `/cuenta` pendiente PB-28).
  - §1.1 (camelCase, `DateOnly`, `char` como string), §1.2 (formas de error A, B y C), §1.3 (códigos de estado del grupo).
  - §3.1, bloque `ClienteResponse`, contrastado con `backend/Aseguradora.Application/Clientes/DTOs/ClienteResponse.cs`.
  - §3.4 completo (listado, detalle, modificación y baja, con reglas y decisiones pendientes).
  - §5 (reglas de negocio visibles: RN01, RN02, RN15).
- `docs/frontend/pedidos-al-back.md`: PB-03 (ampliación pendiente del resumen real) y PB-28 (forma de `/cuenta`).
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
4. Completar `mocks/fixtures/clientes.ts`: dos clientes activos (uno con póliza activa que bloquea la baja) y uno inactivo (sección 10). Usar los ejemplos de `seguridad-clientes-publico.md` (FC4): DNI `30123456`, `Juan Carlos Pérez`; DNI `45123456`, `Lucía Fernández`.
5. Completar `mocks/handlers/clientes.ts`: `GET /api/clientes`, `GET /api/clientes/:id`, `PUT /api/clientes/:id`, `DELETE /api/clientes/:id`, `GET /api/clientes/:id/cuenta`. Reglas en la sección 9.
6. Agregar los exports al barrel (bloque de T-24).
7. Escribir `endpoints/clientes.test.ts`, `mocks/handlers/clientes.test.ts` y `test/contract/clientes.contract.test.ts` (sección 10).
8. Correr `npm run test` del paquete. Al integrar T-23, ejecutar `npm run test:contract`; no declarar ejecutado ese comando mientras no exista.
9. Actualizar el mock de PB-03 y PB-28 en el detalle de la tarea si el back cambia (FB7.7).

## 7. Contrato con el back

### 7.1 Tipos (`src/dto/clientes.ts`)

```ts
export type SexoCliente = 'M' | 'F' | 'X';

// Implementado: backend/Aseguradora.Application/Clientes/DTOs/ClienteResponse.cs (RN15).
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

// Implementado: backend/Aseguradora.Application/Clientes/DTOs/ClienteResumenResponse.cs.
// Renaper y conteos no forman parte del resumen; ampliación pendiente PB-03.
export interface ClienteResumenResponse {
  id: string;
  dni: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  activo: boolean;
}

// Query implementada por ClienteFiltro.cs: pagina 1..21474836, tamanoPagina 1..100.
export interface ClienteFiltro {
  dni?: string;            // exacto, implementado
  apellido?: string;       // contiene, sin distinguir mayúsculas, implementado
  pagina?: number;         // default 1
  tamanoPagina?: number;   // default 20, máximo 100, implementado
}

// Body implementado por ClienteModificacionRequest.cs (seguridad §3.4).
export interface ClienteModificacionRequest {
  email: string;
  telefono?: string | null;
  calle: string;
  numero: string;
  localidad: string;
  provincia: string;
  codigoPostal: string;
}

// T-28 ya está publicada: reutilizar el tipo (RV-55), sin editar dto/polizas.ts.
import type { CuotaResponse } from './polizas';
export type CuotaCuentaCliente = CuotaResponse;

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
| `GET /api/clientes` | Implementado (PR #58) | Query: `dni`, `apellido`, `pagina`, `tamanoPagina` | 200 `PaginaResponse<ClienteResumenResponse>` | 400 de validación con `errors` por paginación inválida; 401; 403 | Réplica del real |
| `GET /api/clientes/{id}` | Implementado (PR #58) | Path `id` (Guid) | 200 `ClienteResponse` | 404 con `codigo: CLIENTE_NO_ENCONTRADO` si no existe o está inactivo; 401; 403 | Réplica del real |
| `PUT /api/clientes/{id}` | Implementado (PR #58) | Body `ClienteModificacionRequest` | 200 `ClienteResponse` actualizado | 400 de validación con `errors` o de negocio con `detail`; 404; 401; 403 | Réplica del real |
| `DELETE /api/clientes/{id}` | Implementado (PR #58) | Path `id` | 204 sin body | 400 si tiene póliza Pendiente, Vigente o Suspendida; 404; 401; 403 | Réplica del real |
| `GET /api/clientes/{id}/cuenta` | NO EXISTE (PB-28) | Path `id` | 200 `CuentaClienteResponse` propuesto | 404; 401 (propuesta) | Solo mock |

Notas de contrato:
- Errores de negocio: forma A (`detail`); validación de atributos: forma B (`errors`). Auth: forma C. No exigir `detail` en errores de validación o auth (seguridad §1.2).
- Los cuatro endpoints reales usan `Politicas.Empleado`, que admite Empleado y Administrador; sin sesión: 401, sin rol permitido: 403.
- `GET /api/clientes?dni=` ya está implementado; lo consume B-14 sin cambiar los bloqueos propios de la búsqueda de pólizas (PB-06).
- DNI sin puntos en request y respuesta. No se normaliza silenciosamente desde la API card (FC9).
- El listado devuelve solo `id`, `dni`, `nombre`, `apellido`, `email`, `telefono` y `activo`; no enriquecerlo artificialmente en mocks.
- `PUT` no acepta DNI, nombre ni datos de Renaper. Comprueba email único incluso contra clientes inactivos y devuelve datos de contacto/domicilio recortados; teléfono vacío u omitido se normaliza a null.
- Baja lógica: el cliente continúa en la base, deja de aparecer en la lista y responde 404 en detalle y baja repetida.
- `/cuenta` no se consume contra el backend ni habilita el rail por activar MSW; conserva su estado propuesto.

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

Cada handler replica método, ruta, query, body, autenticación y respuesta de la tabla 7.2:
- Listado: solo activos; DNI exacto y apellido por contiene sin distinguir mayúsculas, ignorando espacios laterales. Orden estable por apellido, nombre y DNI. Pagina base 1, tamaño por defecto 20; pagina 1..21474836 y tamaño 1..100. Fuera del rango: 400 `ValidationProblemDetails` con claves `Pagina`/`TamanoPagina`.
- Detalle: 404 con `codigo: CLIENTE_NO_ENCONTRADO` para id inexistente o inactivo.
- PUT: valida los atributos de `ClienteModificacionRequest.cs` y replica sus errores de validación. Email de otro cliente, activo o inactivo: 400 de negocio, sin modificar nada. Solo modifica contacto y domicilio; preserva DNI, nombre y datos Renaper. Recorta strings y normaliza teléfono vacío/omitido a null como el servicio real.
- DELETE: 404 si no existe o ya está inactivo; 400 si tiene póliza Pendiente, Vigente o Suspendida; en otro caso marca inactivo y responde 204. Repetir devuelve 404.
- Cuenta: forma propuesta PB-28 con datos de fixture, sin afirmar disponibilidad real.
- Estado mutable de los fixtures aislado por test; no se filtran cambios entre casos.
- Los cuatro endpoints reales: 401 sin Authorization y 403 con rol no admitido. La cuenta mock usa la política propuesta de Empleado, pendiente del endpoint real.

## 8. Contenido de UI

No aplica: API card. Los textos de error llegan del back en `detail` y los muestra la feature (FC10, FB7.6). Esta tarea no agrega texto de pantalla.

## 9. Estados y casos borde

- **Lista vacía:** `items: []`, `total: 0` (no es error).
- **Página fuera de rango:** `items: []` con `total` correcto (no 404).
- **`tamanoPagina` 101:** 400 (`ValidationProblemDetails`, clave `TamanoPagina`). El front lo evita con el selector de tamaño de B3 (10 filas, D-01).
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
| `mocks/handlers/clientes.test.ts` | `tamanoPagina mayor que 100 responde 400` | Vitest + MSW | Forma B con `errors.TamanoPagina`. |
| `mocks/handlers/clientes.test.ts` | `PUT con email de otro cliente responde 400 y no modifica` | Vitest + MSW | Vuelve a leer el cliente y compara. |
| `mocks/handlers/clientes.test.ts` | `DELETE responde 204 y el cliente deja de listarse` | Vitest + MSW | RN15. |
| `mocks/handlers/clientes.test.ts` | `DELETE repetido responde 404` | Vitest + MSW | |
| `mocks/handlers/clientes.test.ts` | `sin Authorization responde 401` | Vitest + MSW | Forma C. |
| `test/contract/clientes.contract.test.ts` | Un `contratoEndpoint` por fila de la tabla 7.2 | Harness de T-23 | Status, content-type y esquema de éxito y error. |

Cobertura mínima por API card (FC5): un caso por endpoint y por código de error de la tabla, incluyendo 403 en los endpoints reales, validación con `errors`, email ocupado por un inactivo y ausencia de campos inventados en la lista. Los tests funcionales con MSW se escriben ahora; el bloque `contratoEndpoint` se integra al rebasar T-23 (RV-D31). La evidencia funcional no reemplaza al harness final.

## 11. Criterios de aceptación

1. `dto/clientes.ts` exporta los tipos de §7.1. `ClienteResumenResponse` reproduce únicamente los siete campos reales, sin Renaper ni conteos. El detalle conserva `validadoRenaper`; la cuenta se documenta como propuesta.
2. `endpoints/clientes.ts` exporta las cinco funciones y `clientesKeys` con la firma de la sección 7.3.
3. `modificarCliente` no permite pasar `dni` ni `nombre` (error de tipo en TypeScript, comprobado con `typecheck`).
4. `GET /api/clientes?pagina=2&tamanoPagina=1` devuelve el segundo elemento y `total` correcto en MSW.
5. `GET /api/clientes?apellido=pér` devuelve clientes con apellido que contenga `pér`, sin distinguir mayúsculas.
6. `tamanoPagina=101` responde 400 con `errors.TamanoPagina` (sin exigir `detail`).
7. `GET /api/clientes/{id}` con id inexistente responde 404 y el cliente de `activo=false` también.
8. `PUT` con email de otro cliente responde 400 y no modifica el registro.
9. `DELETE` responde 204, deja `activo=false` y el cliente no aparece en el listado.
10. Sin token, todos los endpoints responden 401 en MSW; los cuatro reales también tienen tests de 403 para rol no admitido.
11. Al rebasar sobre T-23, su harness valida los cinco endpoints (`npm run test:contract`), identificando `/cuenta` como solo mock. Si el harness o comando no están disponibles, registrar este criterio como pendiente; no declarar la tarjeta terminada.
12. `npm run lint`, `typecheck`, `test` y `build` en verde.
13. No hay `fetch` directo ni hook de TanStack Query en el diff.

## 12. Verificación manual

1. Correr `npm run dev` de `apps/backoffice` con `VITE_USE_MOCKS=true` y el worker MSW iniciado (si falta el bootstrap de B-01, iniciarlo explícitamente desde su módulo en la consola, sin editar archivos ajenos) y, desde la consola del navegador, llamar al handler de `GET /api/clientes?dni=30123456` (vía el cliente de T-08). Esperado: un cliente.
2. Repetir con `apellido=pér` y comprobar que devuelve Pérez.
3. Llamar `DELETE` de un id y luego `GET` del listado. Esperado: el cliente no aparece.

### Pasos reproducibles en el navegador (sin backend)

Desde `frontend/`, iniciar el backoffice:

```powershell
$env:VITE_USE_MOCKS='true'
npm run dev --workspace=@nexa/backoffice -- --host 127.0.0.1
```

Abrir la URL que informa Vite. No hace falta login real para esta prueba: el cliente MSW usa una etiqueta ficticia de sesión. Recargar la página antes de repetir la secuencia, para restaurar los fixtures.

En la consola del navegador (F12), ejecutar este bloque. Ajustar `rutaRepo` si el checkout está en otra carpeta; las URLs `/@fs/` son exclusivas del servidor de desarrollo Vite:

```js
const rutaRepo = 'D:/pad/tfi-pad-2026';
const rutaApi = `/@fs/${rutaRepo}/frontend/packages/api`;
const { worker } = await import(`${rutaApi}/mocks/browser.ts`);
await worker.start({ onUnhandledRequest: 'bypass' });
const clientesApi = await import(`${rutaApi}/src/index.ts`);
const datosMock = await import(`${rutaApi}/mocks/fixtures/clientes.ts`);
const clienteDemo = clientesApi.createApiClient({
  baseUrl: location.origin,
  getToken: () => datosMock.tokensMockClientes.empleado,
});

console.table((await clientesApi.listarClientes(clienteDemo, { dni: '30123456' })).items);
// Un resultado: Juan Carlos Pérez; siete campos, sin conteos ni Renaper.
console.table((await clientesApi.listarClientes(clienteDemo, { apellido: 'pér' })).items);
// Un resultado: Pérez.
console.log(await clientesApi.darDeBajaCliente(clienteDemo, datosMock.CLIENTE_LUCIA_ID));
// undefined; en Network el DELETE responde 204 sin cuerpo.
console.table((await clientesApi.listarClientes(clienteDemo)).items);
// Lucía ya no aparece; queda Juan Carlos Pérez.
```

**Estado de prueba manual:** pendiente de ejecución y confirmación por la persona responsable. Registrar el resultado antes de abrir el PR; los tests automáticos no sustituyen esta confirmación.

Confirmar con la persona responsable antes del PR (`docs/workflow.md`, regla 7). Esta tarea no tiene pantalla propia, así que la prueba visible llega con B-04.

## 13. Contrato confirmado y decisiones pendientes

**Confirmado por código del backend (PR #58), no por nuevas decisiones de producto:**
- DNI exacto; apellido por contiene sin distinguir mayúsculas; orden por apellido, nombre y DNI.
- Paginación por defecto 1/20, tamaño máximo 100 y validación por atributos con `errors`.
- PUT devuelve `ClienteResponse` actualizado, modifica solo contacto/domicilio y exige email único también contra inactivos.
- Baja bloqueada por pólizas Pendiente, Vigente o Suspendida; inexistente/inactivo responde 404.
- Resumen real de siete campos. No contiene Renaper ni conteos.

**Defaults técnicos y pendientes:**
1. Las funciones reciben `ApiClient` como primer argumento, según la convención de T-08.
2. **PB-03, pendiente parcial:** agregar `validadoRenaper`, `cantidadVehiculos` y `cantidadPolizasActivas` al resumen requiere un cambio posterior del backend. Por ahora no están en el tipo ni en el mock; las celdas de B3 muestran `—` como dato no disponible (FB7.11), sin interpretar Renaper como false/Pendiente. El detalle sí devuelve el estado Renaper.
3. **PB-28:** forma de cuenta propuesta de §7.1, solo mock; el rail sigue oculto (D-33), sin acuerdo nuevo de producto.
4. **PB-16:** `fechaValidacionRenaper` sigue siendo `string | null`; T-09 interpreta como UTC si no trae Z.
5. **T-23:** harness integrado; la evidencia de ejecución está en §18. No implica que los casos se hayan ejecutado contra el backend real.

No se requiere completar los tres campos adicionales ni publicar `/cuenta` para consumir los cuatro endpoints reales de esta tarea.

## 14. Riesgos y errores comunes

- **Mandar `dni` con puntos:** el back espera 8 dígitos. Los puntos son solo de presentación.
- **Enviar `dni` o `nombre` en el PUT:** el DTO no los incluye; la UI tampoco.
- **Invalidar solo el detalle después del PUT:** el listado queda con datos viejos. Invalidar también `listas()`.
- **Tomar un 404 de cliente inactivo como error técnico:** es un caso de negocio; la UI muestra `detail`.
- **Mockear el listado con `pagina` en base 0:** la convención es base 1 (`pagina=1` por defecto).
- **Olvidar `PaginaResponse<T>` en el listado:** el back devuelve el envoltorio, no un arreglo plano.
- **Usar `ClienteResponse` para la fila de B3:** esa pantalla usa `ClienteResumenResponse`.

## 15. Definición de terminado

- `lint`, `typecheck`, `test` y `build` en verde; React Doctor 100/100.
- Tras integrar T-23: `test:contract` en verde. Su ausencia permite avanzar en la implementación según FC5/RV-D31, pero no declarar cumplido el criterio 11 ni terminada la tarjeta.
- Accesibilidad: no aplica (API card); las pantallas que la usan pasan US-FE-T-19.
- Sin secretos ni credenciales; fixtures con ejemplos de `seguridad-clientes-publico.md`.
- Criterios 1 a 13 de la sección 11 tildados con evidencia observada (salida de los tests y del harness).

## 16. Observaciones al índice

- Resuelto (RV-15): T-24 crea `dto/clientes.ts`, `endpoints/clientes.ts` y `handlers/clientes.ts`; T-25 agrega su bloque y declara T-24 (RV-04).
- Resuelto (triage final, default de la ficha): "La carpeta `endpoints/` no está definida; FC2 dice solo 'en `@nexa/api`'". Motivo: no aparece en REVISION.md ni en FB8; la fila de ownership del INDEX ya la lista como `endpoints/<dominio>.ts` (API card del dominio). Cierre: `endpoints/<dominio>.ts` (INDEX, Ownership).
- Resuelto (RV-55): T-28 ya está publicada. T-24 importa `CuotaResponse` como tipo y exporta el alias `CuotaCuentaCliente`, sin duplicar campos ni editar archivos de T-28.

## 17. Corrección de alcance (2026-11-04)

Fuente revisada: `development` en `8e7df6f`, con US-F1-06 mergeada por PR #58 (`6356111`). Evidencia: `ClientesController.cs`, `ClienteFiltro.cs`, `ClienteResumenResponse.cs`, `ClienteResponse.cs`, `ClienteModificacionRequest.cs` y `ClienteService.cs` en `backend/`.

Esta corrección actualiza documentación; no implementa T-24 ni cambia el contrato del backend. PB-03 (solo los tres campos adicionales) y PB-28 permanecen pendientes. La implementación y la integración T-23 se verifican por separado en §18.


## 18. Evidencia de implementación

- `npm run lint` y `npm run typecheck`: correctos. `clientes.test-d.ts` prueba que DNI, nombre y estado Renaper no son campos editables y que el resumen tiene exactamente los siete campos reales.
- `npm run test`: 688 tests aprobados en los workspaces (backoffice 70, web pública 15, api 462, config 17 y ui 124).
- `npm run test:contract`: 193 tests aprobados en modo MSW. Los cinco endpoints de clientes se registran con `contratoEndpoint`; `/cuenta` lleva `soloMock: true` y PUT/DELETE son destructivos para el harness. De los 74 casos nuevos de clientes, 23 usan el harness.
- `npm run build`: ambas apps compiladas correctamente.
- React Doctor: **100/100**, 103 archivos revisados, sin problemas.
- No se modificaron manifiestos, lockfile, cliente HTTP ni código de otras features. Se actualizó el test existente del agregador MSW para quitar clientes de la lista de placeholders vacíos.

| Criterio de §11 | Evidencia |
| --- | --- |
| 1 | DTO del resumen de siete campos; el detalle sí tiene Renaper. Alias `CuotaCuentaCliente` reutiliza `CuotaResponse`. |
| 2 | Las cinco funciones y `clientesKeys` se importan desde el barrel en los tests. |
| 3 | Pruebas TypeScript con `@ts-expect-error` para DNI, nombre y Renaper en PUT. |
| 4–6 | Tests de segunda página/total, filtro parcial sin distinguir mayúsculas y paginación inválida con `errors.TamanoPagina`. |
| 7–9 | Tests de inexistente/inactivo, email duplicado también contra inactivos, edición sin alterar identidad, 204 vacío, exclusión del listado y 404 en repetición. |
| 10 | Tests sin sesión, clave ficticia inválida y rol no admitido en cada endpoint; también se admite administrador. |
| 11 | Cinco definiciones del harness T-23 con esquemas de éxito y casos de error; ejecución MSW en verde. |
| 12 | Lint, typecheck, test, test:contract, build y React Doctor completados. |
| 13 | Requests delegadas a `ApiClient`; sin fetch directo ni hooks de TanStack Query. |

### Alcance de los mocks y del modo real

El estado de clientes es local a cada fábrica `crearHandlersClientes`; los escenarios de póliza activa/cuenta se fijan en el fixture y no sincronizan mutaciones con otros dominios MSW. Las pruebas instalan una fábrica nueva por caso y verifican que las semillas no se modifican. MSW acepta etiquetas opacas de sesión; `tokensMockClientes` distingue explícitamente un token inválido y un rol sin permiso. No valida JWT de producción.

No se ejecutaron contratos reales. Si se usa ese modo, además de las variables de T-23, el detalle necesita `CONTRACT_CLIENTE_ID`. PUT/DELETE permanecen omitidos salvo `CONTRACT_ALLOW_WRITES=true`; para DELETE se requieren un cliente de prueba eliminable en `CONTRACT_CLIENTE_BAJA_ID` y otro con póliza activa en `CONTRACT_CLIENTE_CON_POLIZA_ID`. PUT conserva los valores actuales del cliente elegido. Nunca se elige automáticamente un cliente arbitrario para eliminarlo. Los casos de rol no admitido y email duplicado usan escenarios MSW; no se falsifica un JWT para forzar un 403 real.

PB-03 y PB-28 conservan el estado del alcance corregido. La prueba manual de §12 y las revisiones/CI del PR siguen pendientes; no mover la tarjeta a QA hasta completar los pasos correspondientes del workflow.
