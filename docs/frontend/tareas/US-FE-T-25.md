# US-FE-T-25: API clientes: alta y Renaper

Tipo T · Oleada 3 · Tamaño S · Rama sugerida `feature/US-FE-T-25-api-clientes-alta-renaper` · Tarjeta Trello `US-FE-T-25`.

## 1. Objetivo

Dejar tipados, con función de request, clave de caché y handler MSW, los tres endpoints de alta de cliente con Renaper: `POST /api/clientes`, `GET /api/clientes/renaper/{dni}` y `POST /api/clientes/{id}/validar-renaper`. Quien los usa son los empleados de B-05 (alta) y B-06 (validación Renaper).

Los tres están **En PR #50** (no mergeada). Hasta que se mergee, todo se trabaja contra MSW (FB7.7, `VITE_USE_MOCKS=true`). El código de feature nunca lee el flag (FC3).

## 2. Alcance

**Entra**
- Tipos en `packages/api/src/dto/clientes.ts` (bloque de T-25): `SexoCliente`, `ClienteAltaRequest`, `ClienteResponse`, `PersonaRenaperResponse`, `DomicilioRenaperResponse`, `ErrorClienteCodigo`.
- Funciones de request en `packages/api/src/endpoints/clientes.ts` (bloque de T-25): `crearCliente`, `previsualizarRenaper`, `validarRenaper`.
- Claves de caché exportadas: `clientesKeys.renaper(dni)`, y uso de `clientesKeys.detalle(id)` y `clientesKeys.listas()` que define T-24.
- Handlers MSW en `packages/api/mocks/handlers/clientes.ts` (bloque de T-25): respuesta de éxito por defecto y variantes con nombre para los errores.
- Tests de contrato del alta y de Renaper.

**NO entra**
- `GET /api/clientes`, `GET /api/clientes/{id}`, `PUT`, `DELETE`, `GET /api/clientes/{id}/cuenta`: T-24.
- Hooks TanStack Query: los escriben B-05 y B-06 dentro de `features/clientes/api/` (FC2). Esta tarea solo especifica su nombre, tipo y clave (ver §7).
- Pantalla, formulario, zod y mapeo de errores a campos: B-05 y B-06.
- Renaper como validación para emitir una póliza (RN02 en frente 3): fuera de alcance.

## 3. Dependencias

- **Depende de:** US-FE-T-08, US-FE-T-11, US-FE-T-12, US-FE-T-23, US-FE-T-24.
- **Oleada:** 3.
- **Puede empezar sin esperar a:** US-FE-B-05.
- **Bloqueada por pedidos al back:** PB-14 (códigos estables en 400 de negocio; hoy se compara `detail`), PB-15 (mensajes de validación en inglés), PB-29 (CUIL sin dígito verificador, DNI de 7 dígitos).
- **Workaround MSW (FB7.7):** handler con el contrato mínimo de PR #50 (`contratos-api/seguridad-clientes-publico.md` §3.1 a §3.3). Sin código en el 400 de negocio: se usa `detail` tal cual.

## 4. Documentos a leer

- `contratos-api/seguridad-clientes-publico.md` §1.2 (formas de error), §1.3 (códigos), §3.1 (alta: request, response, reglas 3.1.1), §3.2 (validar-renaper), §3.3 (renaper), §4.1 (formatos DNI, CUIL, email, teléfono, sexo, fecha), §4.2 (mensajes en inglés), §5 (RN01, RN02, RN16, RN17), §8 dudas D2, D8, D12, D13, D14.
- `contratos-api/convenciones-transversales.md` §3.4 (`ProblemDetails`), §5.3 (fechas: `DateOnly`, `DateTime`).
- `pantallas/B4-nuevo-cliente.md` §6 (campos del formulario, para entender qué se envía), §13 D-9.
- `pedidos-al-back.md` PB-14, PB-15, PB-29.
- `00-decisiones-base.md` FB4, FB7.6, FB7.7, FB7.9.
- `tareas/INDEX.md` FC2, FC3, FC4, FC5, FC10, FC11, FC13; decisión D-16 (Renaper caído).
- Código del back: `backend/Aseguradora.Api/Controllers/` no tiene `ClientesController` en `development`. La verificación es contra el contrato (cita del PR #50). Re-verificar al mergear (D14).

## 5. Archivos a crear o modificar

Todas las rutas bajo `frontend/`:

| Archivo | Acción | Dueño (INDEX) |
|---|---|---|
| `packages/api/src/dto/clientes.ts` | bloque T-25 | T-24 crea el archivo; T-25 agrega su bloque (RV-15) |
| `packages/api/src/endpoints/clientes.ts` | bloque T-25 | T-24 crea el archivo; T-25 agrega sus funciones (RV-15) |
| `packages/api/src/index.ts` | bloque de export de T-25 | US-FE-T-12 (cada API card agrega su bloque, RV-14) |
| `packages/api/mocks/handlers/clientes.ts` | bloque T-25 | T-24 crea el archivo; T-25 agrega su bloque (RV-15) |
| `packages/api/test/contract/clientes.contract.test.ts` | bloque T-25 | T-24 crea el archivo; el directorio `test/contract/` es de T-23 (RV-D31) |

No se edita ningún `package.json`, ni `apps/*`, ni `.github/workflows/*` (FC17).

## 6. Pasos de implementación

1. Confirmar con T-08 el nombre del cliente HTTP y de la clase de error (`ApiError`), y con T-12 los tipos `ProblemDetails` y `ValidationProblemDetails`. Usar esos nombres exactos.
2. Agregar el bloque de T-25 en `dto/clientes.ts`, creado por T-24 (dependencia declarada).
3. Escribir los tipos de §7 con los nombres exactos. `fechaValidacionRenaper` es `string | null` y su parseo lo resuelve T-09 (D8).
4. Escribir las tres funciones en `endpoints/clientes.ts`. Cada una devuelve la respuesta tipada o lanza `ApiError`. Ninguna reintenta (los reintentos viven en los hooks; FB7.9).
5. Exportar `clientesKeys.renaper(dni)` como `['clientes', 'renaper', dni] as const`. Si T-24 no exporta `clientesKeys`, pedir el cambio a T-24 y no duplicar la clave.
6. Escribir en `mocks/handlers/clientes.ts` el handler por defecto de éxito (`POST` 201 con `validadoRenaper: true`, `GET` renaper 200 VIGENTE, `POST` validar 200) y exportar las variantes con nombre de §7.
7. Escribir los tests de contrato de §10 como bloque de T-25 en `test/contract/clientes.contract.test.ts`, con el harness de T-23.
8. Agregar el bloque de export en `packages/api/src/index.ts`.
9. Correr `lint`, `typecheck`, `test` del paquete `@nexa/api`.

## 7. Contrato con el back

Estado de los tres endpoints: **En PR #50** (`feat(backend): US-F1-05 alta de cliente con validación en Renaper`). Política: `Politicas.Empleado` (rol Empleado o Administrador). Sin token: 401.

### 7.1 `POST /api/clientes`

- **Estado:** En PR #50. **Auth:** Empleado. **Request:** JSON. **Response:** 201 con `ClienteResponse` (el `Location` no es legible desde el navegador, PB-17: usar `id` del body).
- **Función:** `crearCliente(body: ClienteAltaRequest): Promise<ClienteResponse>`.
- **Clave:** no aplica para lectura. Al éxito se invalidan `clientesKeys.listas()` (T-24).
- **Hook (lo escribe B-05, FC2):** `useCrearCliente()`, `useMutation`, con `retry: 0` (FB7.9, FC11). El botón se deshabilita mientras corre.
- **MSW:** `handlers/clientes.ts`, `http.post('*/api/clientes')`. Éxito: 201 con `ClienteResponse` que refleja el body (`validadoRenaper: true`). Variantes: `altaDniDuplicado`, `altaEmailDuplicado`, `altaRenaperFallecido`, `altaRenaperNoFigura`, `altaMenorDeEdad`, `altaRenaperCaido` (201 con `validadoRenaper: false`), `altaValidacionModelo` (400 con `errors`), `sinToken` (401).

```ts
// dto/clientes.ts (bloque T-25)
export type SexoCliente = 'M' | 'F' | 'X';

export interface ClienteAltaRequest {
  dni: string;                // ^\d{8}$. El back no hace trim: el formulario recorta antes (D-25-4)
  email: string;              // máx. 150
  telefono?: string | null;   // máx. 20. Vacío se envía como null
  nombre: string;             // máx. 100. Renaper lo pisa si valida
  apellido: string;           // máx. 100. Renaper lo pisa si valida
  cuil: string;               // ^\d{11}$. Sin dígito verificador (PB-29)
  fechaNacimiento: string;    // "yyyy-MM-dd"
  sexo: SexoCliente;          // enviar en mayúscula; el back acepta minúscula
  calle: string;              // máx. 150
  numero: string;             // máx. 20
  localidad: string;          // máx. 100
  provincia: string;          // máx. 100
  codigoPostal: string;       // máx. 10
}

export interface ClienteResponse {
  id: string;
  dni: string;
  cuil: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;          // "yyyy-MM-dd"
  sexo: SexoCliente;
  email: string;
  telefono: string | null;
  calle: string;
  numero: string;
  localidad: string;
  provincia: string;
  codigoPostal: string;
  validadoRenaper: boolean;
  fechaValidacionRenaper: string | null; // formato NO DEFINIDO (D8): parsear con T-09
  activo: boolean;
}
```

Errores de `POST /api/clientes`:

| Status | Forma | Cuándo | Texto del back (`detail` o clave de `errors`) |
|---|---|---|---|
| 400 | `ValidationProblemDetails` | falta o formato inválido en DTO | `errors.Dni` = `"El DNI debe tener 8 dígitos."`; `errors.Cuil` = `"El CUIL debe tener 11 dígitos."`. El resto de claves llega con texto ASP.NET en inglés (PB-15): mostrar el texto propio del campo, nunca `errors[...][0]` |
| 400 | `ProblemDetails` (`detail`) | DNI ya existe | `"RN01: Ya existe un cliente con el DNI '{dni}'."` |
| 400 | `ProblemDetails` | email ya existe (sin distinguir mayúsculas) | `"RN01: Ya existe un cliente con el email '{email}'."` |
| 400 | `ProblemDetails` | Renaper dice FALLECIDO | `"RN02: La persona figura como fallecida en Renaper."` |
| 400 | `ProblemDetails` | Renaper no tiene el DNI | `"El DNI '{dni}' no figura en Renaper."` |
| 400 | `ProblemDetails` | menor de 18 años | `"RN01: El cliente debe tener 18 años o más."` |
| 400 | `ProblemDetails` | sexo fuera de M/F/X (inalcanzable desde la UI) | `"El sexo debe ser M, F o X."` |
| 401 | sin cuerpo garantizado | token ausente o vencido | (no usar texto del back, D3) |
| 500 | `ProblemDetails` | error no previsto | `"Ocurrió un error inesperado."` |

No hay 409 ni 422 en este grupo (contrato §1.3). Renaper caído **no es error**: responde 201 con `validadoRenaper: false` (C8, D-16).

### 7.2 `GET /api/clientes/renaper/{dni}`

- **Estado:** En PR #50. **Auth:** Empleado. **Request:** `dni` en la ruta (8 dígitos). **Response:** 200 con `PersonaRenaperResponse`.
- **Función:** `previsualizarRenaper(dni: string): Promise<PersonaRenaperResponse>`.
- **Clave:** `clientesKeys.renaper(dni)`.
- **Hook (lo escribe B-06):** `useRenaperPreview(dni)`, `useQuery`, `enabled: false` hasta que el empleado pide la consulta (no en el montaje). Reintentos: no reintenta errores 4xx (D-25-2).
- **MSW:** `http.get('*/api/clientes/renaper/:dni')`. Éxito: 200 VIGENTE con datos de `contratos-api/seguridad-clientes-publico.md` §3.3. Variantes: `renaperFallecido` (200 con `estado: 'FALLECIDO'`, `fechaFallecimiento` con fecha), `renaperNoFigura` (404), `renaperDniInvalido` (400), `renaperCaido` (502).

```ts
// dto/clientes.ts (bloque T-25)
export interface DomicilioRenaperResponse {
  calle: string;
  numero: string;
  piso: string | null;
  depto: string | null;
  localidad: string;
  provincia: string;
  codigoPostal: string;
}

export interface PersonaRenaperResponse {
  dni: string;
  cuil: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;                   // "yyyy-MM-dd"
  sexo: SexoCliente;
  domicilio: DomicilioRenaperResponse;
  estado: 'VIGENTE' | 'FALLECIDO';
  fechaFallecimiento: string | null;         // "yyyy-MM-dd" solo si FALLECIDO
}
```

Errores de `GET /api/clientes/renaper/{dni}`:

| Status | Forma | Cuándo | Texto |
|---|---|---|---|
| 400 | `ProblemDetails` | DNI con formato inválido (el back valida en el service, no en la ruta) | `"El DNI debe tener 8 dígitos."` |
| 404 | `ProblemDetails` + `codigo: 'PERSONA_NO_ENCONTRADA'` | Renaper no conoce el DNI | `"El DNI '{dni}' no figura en Renaper."` |
| 401 | sin cuerpo garantizado | token | (no usar texto del back) |
| 502 | `ProblemDetails` | Renaper caído o timeout | texto de la excepción, **no fijo** (D-25-3) |

Nota: un fallecido **no** es error en esta consulta: llega como `estado: 'FALLECIDO'`.

### 7.3 `POST /api/clientes/{id}/validar-renaper`

- **Estado:** En PR #50. **Auth:** Empleado. **Request:** sin body. `id` es `Guid` en la ruta. **Response:** 200 con `ClienteResponse` actualizado.
- **Función:** `validarRenaper(id: string): Promise<ClienteResponse>`.
- **Clave al éxito:** `clientesKeys.detalle(id)` y `clientesKeys.listas()` (T-24).
- **Hook (lo escribe B-06 o B-08):** `useValidarRenaper(id)`, `useMutation`, `retry: 0`. No se dispara al montar.
- **MSW:** `http.post('*/api/clientes/:id/validar-renaper')`. Éxito: 200 con `validadoRenaper: true` y `fechaValidacionRenaper` con formato del back. Variantes: `validarRenaperNoFigura` (400), `validarRenaperFallecido` (400), `validarRenaperMenor` (400), `clienteNoExiste` (404 con `codigo: 'CLIENTE_NO_ENCONTRADO'`), `validarRenaperCaido` (502).

```ts
// dto/clientes.ts (bloque T-25)
export type ErrorClienteCodigo = 'CLIENTE_NO_ENCONTRADO' | 'PERSONA_NO_ENCONTRADA';

export interface ProblemDetailsConCodigo extends ProblemDetails {
  codigo?: ErrorClienteCodigo;
}
```

Errores de `POST .../validar-renaper`:

| Status | Forma | Cuándo | Texto |
|---|---|---|---|
| 400 | `ProblemDetails` | no figura en Renaper | `"El DNI '{dni}' no figura en Renaper."` |
| 400 | `ProblemDetails` | fallecido (RN02) | `"RN02: La persona figura como fallecida en Renaper."` |
| 400 | `ProblemDetails` | menor de 18 (RN01) | `"RN01: El cliente debe tener 18 años o más."` |
| 404 | `ProblemDetailsConCodigo` | id inexistente | `"El cliente {id} no existe."`, `codigo: 'CLIENTE_NO_ENCONTRADO'` |
| 401 | sin cuerpo | token | (no usar texto del back) |
| 502 | `ProblemDetails` | Renaper caído | texto de la excepción, no fijo |

Nota: en este endpoint "no figura" es **400**, y en `GET renaper/{dni}` es **404**. Las funciones no unifican ese manejo: cada pantalla mapea su caso.

### 7.4 Export y barrel

`packages/api/src/index.ts` exporta los tipos, las tres funciones y `clientesKeys` (solo lo que es de T-25). Las claves y funciones de lectura de T-24 no se tocan.

## 8. Contenido de UI

No aplica (sin UI). Los textos que se muestran están en `pantallas/B4-nuevo-cliente.md` §6 (campos) y en la sección de errores de B-05 y B-06. Esta tarea no define textos de pantalla: solo expone los `detail` del back sin transformar. El prefijo `RNxx:` lo quita T-10 (FB7.6, PB-15).

## 9. Estados y casos borde

- **Alta, cargando:** la mutación queda en `isPending`; el botón se deshabilita (FC11). No se reenvía tras error de red: se muestra el error y el empleado decide (FB7.9).
- **Alta, 400 de validación:** `ValidationProblemDetails` se entrega como `errors` por clave PascalCase (`Dni`, `Cuil`, `Email`, ...). B-05 marca el campo con esa clave.
- **Alta, 400 de negocio:** `detail` se entrega sin cambios. Como no hay `codigo`, el campo no se marca automáticamente (FC10). Comparar texto no es parte de esta tarea (D2).
- **Alta, 201 con `validadoRenaper: false`:** éxito con aviso. B-06 muestra el badge Pendiente y el reintento (D-16).
- **Alta, datos pisados:** Renaper pisa nombre, apellido, CUIL, fecha, sexo y domicilio. La UI muestra los datos de la respuesta, no los tipeados.
- **Renaper, DNI en la URL:** es dato personal en la URL (D13). Se acepta según la PR. No se loguea la URL completa.
- **Renaper, sin datos o fallecido:** 404 y 200 con `estado` distinto respectivamente. Ninguno se trata como error de red.
- **Validar-renaper, sin sesión:** 401 con cierre de sesión (lo maneja T-08 con `onUnauthorized`, FB7.5).
- **Fecha `fechaValidacionRenaper`:** puede llegar con o sin `Z` (D8). El parseo lo hace T-09 tratando un valor sin offset como UTC.

## 10. Tests requeridos

Herramienta: Vitest con MSW (`setupServer` de `mocks/server.ts`, T-11). Un test por cada código de error de la tabla (FC5).

1. `POST /api/clientes devuelve ClienteResponse con validadoRenaper true en el caso por defecto`: el body de respuesta cumple el tipo.
2. `POST /api/clientes expone errors en PascalCase en un 400 de validación`: claves `Dni` y `Cuil`.
3. `POST /api/clientes devuelve detail sin transformar en 400 de DNI duplicado`.
4. `POST /api/clientes devuelve detail sin transformar en 400 de email duplicado`.
5. `POST /api/clientes devuelve detail en 400 fallecido, no figura y menor de edad` (tres casos con `it.each`).
6. `POST /api/clientes devuelve 201 con validadoRenaper false cuando Renaper está caído` (D-16).
7. `POST /api/clientes devuelve 500 con el texto genérico del back`.
8. `GET renaper devuelve PersonaRenaperResponse VIGENTE`.
9. `GET renaper devuelve estado FALLECIDO con fechaFallecimiento sin error HTTP`.
10. `GET renaper devuelve 404 con codigo PERSONA_NO_ENCONTRADA`.
11. `GET renaper devuelve 400 con detail de DNI inválido`.
12. `GET renaper devuelve 502 sin texto fijo asumido`.
13. `POST validar-renaper devuelve ClienteResponse con validadoRenaper true`.
14. `POST validar-renaper devuelve 400 en no figura, fallecido y menor de edad` (`it.each`).
15. `POST validar-renaper devuelve 404 con codigo CLIENTE_NO_ENCONTRADO`.
16. `POST validar-renaper devuelve 502`.
17. `Las tres funciones devuelven ApiError con status 401 sin token` (variante `sinToken`).
18. `crearCliente hace una sola request ante 502` (el reintento no vive en la función; FB7.9).
19. `Los tipos ClienteResponse y PersonaRenaperResponse no tienen campos extra ni faltantes` (test de contrato con el harness de T-23).

## 11. Criterios de aceptación

1. Los tres tipos de request y response de §7 existen en `dto/clientes.ts` con los nombres exactos del bloque.
2. Las tres funciones existen en `endpoints/clientes.ts` y ninguna reintenta.
3. `clientesKeys.renaper(dni)` se exporta desde `@nexa/api` y su forma es `['clientes', 'renaper', dni]`.
4. El handler por defecto devuelve el caso de éxito de cada endpoint.
5. Cada variante de error de §7 se exporta con nombre y se puede activar con `server.use(...)`.
6. Todos los tests de §10 pasan en verde.
7. No hay `fetch` directo: todo pasa por el cliente de T-08.
8. Ninguna función lee `VITE_USE_MOCKS`.
9. El barrel `packages/api/src/index.ts` exporta el bloque de T-25 sin tocar el de T-24.
10. `lint`, `typecheck`, `test` y `build` de `@nexa/api` están en verde.
11. La tabla de errores de §7 coincide con `contratos-api/seguridad-clientes-publico.md` §3.1.1 y §3.2 y §3.3.
12. Se registra en §16 que el endpoint está en PR #50 y se re-verifica al mergearla.

## 12. Verificación manual

Sin prueba manual de UI en esta tarjeta: no hay pantalla. Las funciones se prueban con los tests de §10.

Contra el back: PR #50 no está mergeada en `development`, así que no hay prueba contra el back local. Al mergearla, correr `VITE_API_BASE_URL=http://localhost:8080` con el harness de T-23 y confirmar los tests de contrato.

## 13. Decisiones pendientes

- **D-25-1 (PR #50 puede cambiar):** default: MSW según el contrato actual. Al mergear PR #50, revalidar §7 (contrato D14).
- **D-25-2 (reintento de la consulta Renaper):** default (RV-D23): no reintentar errores 4xx; permitir 1 reintento ante 502.
- **D-25-3 (texto del 502 de Renaper):** default: mostrar el `detail` si llega; si no, un texto genérico que define diseño. No se inventa texto aquí.
- **D-25-4 (recorte de DNI y CUIL):** default: B-05 recorta espacios antes de llamar. La función envía el body tal cual.
- **D-25-5 (marcar el campo DNI con 404):** default (RV-D23): B-06 marca el campo DNI con `codigo === 'PERSONA_NO_ENCONTRADA'`, no con el texto. Es la excepción documentada en FC10.
- **D-25-6 (Location):** default: usar `id` del body (PB-17).
- **D-API-1 (hooks):** default (RV-44, FB3, FC2): FC2 manda. Los hooks viven en `features/clientes/api/` de B-05 y B-06; `@nexa/api` solo exporta funciones de request, tipos y claves.
- **D-API-2 (dueño de `dto/clientes.ts`, `endpoints/clientes.ts`, `handlers/clientes.ts`):** default (RV-15): T-24 los crea, T-25 agrega su bloque y mergea después.

## 14. Riesgos y errores comunes

- **Contrato en PR abierta:** PR #50 puede cambiar antes del merge. Mitigación: MSW con el contrato de §7, revalidar al mergear (D-25-1).
- **Textos en inglés en `errors`:** mostrar `errors[...][0]` tal cual deja mensajes en inglés (PB-15). Mitigación: mapear por clave a un texto propio.
- **Renaper caído en el alta es 201:** si la UI solo mira el status, el aviso no aparece. Mitigación: leer `validadoRenaper`.
- **Comparar texto para detectar duplicados:** el back no manda código (PB-14, D2). Si se compara `detail`, se rompe ante cualquier cambio de redacción. Mitigación: mostrar `detail`; no comparar.
- **Fecha sin formato definido:** `fechaValidacionRenaper` puede venir con o sin `Z` (D8). Mitigación: parseo de T-09.
- **DNI con espacios:** el DTO no hace trim y da 400. Mitigación: D-25-4.
- **Doble clic en el alta:** el back rechaza el duplicado con 400, pero el empleado ve un error falso. Mitigación: botón deshabilitado (FC11).
- **Mock que no coincide con el back:** si el handler devuelve 200 donde el back da 404, la pantalla pasa las pruebas y falla en real. Mitigación: los tests de contrato de §10 se corren contra el back cuando se mergee.

## 15. Definición de terminado

- `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` en verde (FC8).
- Accesibilidad: no aplica a esta tarea (sin UI); la revisión la hace B-05 y B-06 con T-19.
- Sin secretos ni credenciales.
- Los 12 criterios de §11 con evidencia observada (salida de los tests), no tildados sin prueba.

## 16. Observaciones al índice

- Resuelto (RV-15 / D-API-2): `dto/clientes.ts`, `endpoints/clientes.ts` y `handlers/clientes.ts` los crea T-24 y T-25 agrega su bloque; mergean en serie.
- Resuelto (RV-04): T-23 y T-24 figuran en "Depende de" de la fila del INDEX y de §3.
- Resuelto (RV-44 / FC2): hooks en `features/<dominio>/api/` (D-API-1).
- Resuelto (RV-D23): el campo DNI se marca con 404 por `codigo` (excepción documentada en FC10; D-25-5).
