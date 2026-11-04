# US-FE-B-09: Nuevo vehículo

Tipo: B · Oleada: 4 · Tamaño: M · Rama sugerida: `feature/US-FE-B-09-nuevo-vehiculo` · Tarjeta Trello: `US-FE-B-09`

## 1. Objetivo

Un Empleado o Administrador da de alta un vehículo a un cliente existente desde `/clientes/:clienteId/vehiculos/nuevo`. Carga la patente y el uso; el back valida en DNRPA y guarda (201). La pantalla vuelve a la ficha del cliente (B-07) con un aviso. Queda creado el feature `features/vehiculos`, dueño de su `index.ts` y de su `routes.tsx`.

El alta es en un solo paso: no hay botón "Validar en DNRPA" ni bloque de datos DNRPA, porque el back no tiene vista previa (PB-23; decisión D-13 del índice).

## 2. Alcance

**Entra**
- Ruta, pantalla y formulario de alta (patente y uso).
- Contexto del cliente en la cabecera (nombre y DNI) con `GET /api/clientes/{id}`.
- Validación de formato en el front (zod) antes de cualquier request.
- `POST /api/vehiculos`, navegación de éxito y de cancelación.
- Mapeo de errores del back: `errors` por campo y `detail` general.
- Tests de la pantalla.

**No entra**
- Botón "Validar en DNRPA" y bloque "Datos informados por DNRPA" (PB-23, D-13). No hay `GET` de DNRPA.
- Bloque "Ejemplo de error" del rail (es un ejemplo visual del Figma; DP-B09-03).
- Cambio de uso de un vehículo existente y baja (ficha de cliente, B-07 y B-08; `PUT` y `DELETE` ya los expone T-26).
- Topbar, campana y sidebar: son de `US-FE-T-16`.
- Handlers MSW y DTO `vehiculos.ts`: son de `US-FE-T-26`. Esta tarea no los escribe.

## 3. Dependencias

- **Oleada:** 4.
- **Depende de:** US-FE-T-04, US-FE-T-05, US-FE-T-07, US-FE-T-08, US-FE-T-10, US-FE-T-11, US-FE-T-12, US-FE-T-13, US-FE-T-14, US-FE-T-16, US-FE-T-19, US-FE-T-24, US-FE-T-26.
- **Puede empezar sin esperar a:** US-FE-B-07 (solo se navega a su ruta; no se importa nada de ella).
- **Bloqueada por pedidos al back:** PB-23 (sin paso DNRPA), PB-13 (uso numérico).

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB3 (estructura y reglas de imports), FB4 (enums y errores), FB5 (IDs y textos en español), FB7.5 (sesión), FB7.6 (`detail` y mensajes), FB7.7 (MSW), FB7.11 (datos faltantes).
- `docs/frontend/tareas/INDEX.md`: fila `US-FE-B-09`; "Convenciones comunes" FC1, FC2, FC4, FC5, FC9, FC10, FC11, FC14, FC16, FC17; "Ownership" (filas de `features/<dominio>/routes.tsx` e `index.ts`); "Decisiones pendientes" D-13, D-25, D-29.
- `docs/frontend/pantallas/B6-nuevo-vehiculo.md`: §2 (ruta y guarda), §5 (textos), §6 (campos y validaciones), §7 (estados), §8 (acciones), §9 solo la fila de `POST /api/vehiculos`, §11 (responsive), §12 (accesibilidad), §13 D-B6-03, D-B6-05, D-B6-08. No usar §3 ni §4 para el bloque DNRPA: no se implementa.
- `docs/frontend/contratos-api/vehiculos-planes-cotizaciones.md`: §0 (convenciones), §0.1 (`TipoVehiculo`, `UsoVehiculo`, `ProblemDetails`), §1.1 (regex de patente), §1.7 (patentes de prueba del mock DNRPA), §2.1 (request, response y errores de `POST /api/vehiculos`).
- `docs/frontend/design-system.md`: §5.1 (Button), §5.2 (Input), §5.3 (Select), §8.2 (mensaje de error), §8.3 (foco visible).
- `docs/frontend/pedidos-al-back.md`: PB-13, PB-14, PB-15, PB-23.
- Back, solo para verificar textos y orden de validación: `backend/Aseguradora.Application/Services/VehiculoService.cs` (líneas 30 a 81) y `backend/Aseguradora.Application/Dtos/VehiculoAltaRequest.cs`.

## 5. Archivos a crear o modificar

Todos bajo `frontend/apps/backoffice/src/`.

| Archivo | Acción | Dueño |
|---|---|---|
| `features/vehiculos/routes.tsx` | Reemplaza el stub de T-14 con la ruta `/clientes/:clienteId/vehiculos/nuevo` | B-09 (primera tarea del feature) |
| `features/vehiculos/index.ts` | Crea. Exporta las rutas del feature | B-09 |
| `features/vehiculos/pages/NuevoVehiculoPage.tsx` | Crea | B-09 |
| `features/vehiculos/components/VehiculoAltaForm.tsx` | Crea | B-09 |
| `features/vehiculos/components/ClienteContexto.tsx` | Crea (línea de contexto y estado "Cliente no encontrado") | B-09 |
| `features/vehiculos/schemas/vehiculoAltaSchema.ts` | Crea | B-09 |
| `features/vehiculos/api/useClienteContexto.ts` | Crea. `useQuery` sobre la función de `@nexa/api` | B-09 |
| `features/vehiculos/api/useAltaVehiculo.ts` | Crea. `useMutation` sobre la función de `@nexa/api` | B-09 |
| `features/vehiculos/api/errorAlta.ts` | Crea. Convierte `ApiError` en `{ campo?: 'patente', mensaje: string }` | B-09 |
| `features/vehiculos/**/*.test.ts(x)` | Crea | B-09 |

Compartidos que se usan sin editar: `app/router.tsx` (ya compone `features/vehiculos/routes.tsx`, T-14), `packages/api/src/**` (T-08, T-10, T-12, T-24, T-26), `packages/ui/src/**` (T-04, T-05, T-07). Si falta un export, se pide al dueño; esta tarea no lo edita (FC2, FC17).

## 6. Pasos de implementación

1. Leer la fila de B-09 en `tareas/INDEX.md`. Confirmar que T-04, T-05, T-07, T-08, T-10, T-11, T-12, T-13, T-14, T-16, T-19, T-24 y T-26 están mergeados. Si T-24 o T-26 no están, trabajar con sus mocks de MSW (FB7.7).
2. **RED:** escribir los tests `schema:` de §10 y verlos fallar.
3. Crear `vehiculoAltaSchema` con zod:
   ```ts
   const patenteRegex = /^([A-Z]{2}[0-9]{3}[A-Z]{2}|[A-Z]{3}[0-9]{3})$/;
   export const vehiculoAltaSchema = z.object({
     patente: z.string().trim().toUpperCase().regex(patenteRegex, MSG_PATENTE_INVALIDA),
     uso: z.enum(['0', '1']), // valor del Select (string). Default '0' = Particular
   });
   export type VehiculoAltaValues = z.infer<typeof vehiculoAltaSchema>;
   ```
   `MSG_PATENTE_INVALIDA` es DP-B09-01. El `Select` de T-04 recibe `string`, por eso el valor es `'0' | '1'`.
4. Función pura `toVehiculoAltaRequest(values, clienteId)` que devuelve `{ clienteId, patente, uso: Number(values.uso) }`. Es el único punto donde `uso` pasa a número (FC9).
5. Hook `useClienteContexto(clienteId)`: `useQuery` con key `clientesKeys.detalle(clienteId)` y la función `obtenerCliente`. No reintenta un 404 (`retry` solo para errores que no sean 404).
6. Hook `useAltaVehiculo(clienteId)`: `useMutation` con `retry: 0`. En `onSuccess` invalida `vehiculosKeys.porCliente(clienteId)` y `clientesKeys.detalle(clienteId)`, y navega a `/clientes/${clienteId}` con `state: { aviso }` (DP-B09-02).
7. `VehiculoAltaForm` con react-hook-form y `zodResolver(vehiculoAltaSchema)`:
   - `Input` "Patente": la vista muestra mayúsculas mientras se escribe; `font-mono`; foco al montar.
   - `Select` "Uso": opciones desde el mapa `uso` de T-10 (`'0'` Particular, `'1'` Comercial). Sin opción vacía.
   - "Cancelar" (secundario) navega a `/clientes/:clienteId` sin request.
   - "Guardar vehículo" (primario, `type="submit"`), deshabilitado mientras `isPending`.
8. Error del `POST`: `errorAlta(apiError)` devuelve `campo: 'patente'` solo si llega `errors.patente`. El resto va a `AlertaError` con el `detail` ya limpio: sin prefijo `RNxx:` (T-10) y sin prefijo `VEHICULO_NO_ENCONTRADO: ` (`errorAlta.ts`).
9. `NuevoVehiculoPage`: lee `clienteId` con `useParams`. Si no es UUID (`z.string().uuid()`), muestra el estado "Cliente no encontrado" sin request. Compone `ClienteContexto`, el formulario y, en el rail, un `CardWidget` "Reglas" (T-07).
10. Estados de cliente (§9): mientras carga, el formulario queda deshabilitado; con 404, no se renderiza el formulario.
11. GREEN, luego refactor. Correr `npm run lint -w apps/backoffice`, `npm run typecheck -w apps/backoffice`, `npm run test -w apps/backoffice` y `npm run build -w apps/backoffice`.

## 7. Contrato con el back

| Método y ruta | Estado | Uso en esta tarea |
|---|---|---|
| `POST /api/vehiculos` | Implementado (PR #24, en `development`) | Guardar. Responde 201 con `VehiculoResponse` y `Location` (el `Location` no es legible desde el navegador, PB-17; no se usa). |
| `GET /api/clientes/{id}` | Especificado (US-F1-06) | Contexto: `nombre`, `apellido`, `dni`. Se mockea con T-24 hasta que se publique. |
| `GET /api/vehiculos/dnrpa/{patente}` | NO EXISTE (PB-23) | No se llama. |

PB-14 (degrada): `VEHICULO_NO_ENCONTRADO` y el texto de RN03 van dentro de `detail`; el front quita el prefijo. PB-13 (D-29): `uso` viaja como número; la etiqueta sale del mapa de T-10.

Tipos (en `packages/api/src/dto/vehiculos.ts`, dueño T-26; no se redefinen aquí):

```ts
export interface VehiculoAltaRequest {
  clienteId: string;
  patente: string;   // ya en mayúsculas y sin espacios
  uso: UsoVehiculo;  // 0 Particular | 1 Comercial (número; PB-13)
}
```

Errores que la pantalla maneja (texto exacto del back, `vehiculos-planes-cotizaciones.md §2.1`):

| Status | Texto del back | Tratamiento |
|---|---|---|
| 400 | `errors.patente` (validación de modelo, en inglés; PB-15) | Campo `patente` con DP-B09-01. No se muestra el texto en inglés. |
| 400 | `La patente '{P}' no tiene un formato válido (AA000AA o AAA000).` | Alerta general. El front ya valida, así que no debería llegar. |
| 400 | `Ya existe un vehículo registrado con la patente '{P}' (RN03).` | Alerta general (DP-B09-06). |
| 400 | `VEHICULO_NO_ENCONTRADO: La patente '{P}' no figura en el registro de DNRPA.` | Alerta con el texto sin el prefijo `VEHICULO_NO_ENCONTRADO: `. |
| 400 | `RN03: El titular registral en DNRPA (DNI {X}) no coincide con el DNI del cliente ({Y}).` | Alerta con el texto sin el prefijo `RN03: `. |
| 400 | `El cliente {ClienteId} está dado de baja.` | Alerta general. |
| 404 | `El cliente {id} no existe.` | Estado "Cliente no encontrado" (DP-B09-04). |
| 401 | — | Lo resuelve T-08 (`onUnauthorized` a `/login`). |
| 403 | — | Alerta general con `detail` o DP-B09-07. |
| 502 | Texto del servicio externo | Alerta general con `detail`. |

Handlers MSW: `POST /api/vehiculos` (T-26) y `GET /api/clientes/{id}` (T-24). B-09 no escribe handlers; en sus tests sobreescribe respuestas con `server.use(...)` (T-11). Las patentes del mock están en `vehiculos-planes-cotizaciones.md §1.7` (`AE789FG` válida, `AC456EF` titular distinto, `ZZ999ZZ` no figura).

## 8. Contenido de UI (literal)

| Zona | Texto |
|---|---|
| Título (h1) | `Nuevo vehículo` |
| Enlace de regreso | Nombre completo del cliente (`{nombre} {apellido}`), a `/clientes/:clienteId`. No hay texto fijo (FC4). |
| Contexto | `Cliente: {nombre} {apellido}, DNI {dni formateado}` (formato de DNI de T-09) |
| Label patente | `Patente` |
| Helper patente | `Formato AB123CD o ABC123` |
| Label uso | `Uso` |
| Opciones uso | `Particular`, `Comercial` |
| Helper uso | `Comercial aplica factor 1,40 en la cotización.` |
| Botón | `Cancelar` |
| Botón | `Guardar vehículo` |
| Rail: título | `Reglas` |
| Rail: reglas | `La patente es única.` · `El titular informado por DNRPA debe ser el cliente.` · `Un vehículo tiene una sola póliza activa.` |

**No se renderizan:** `Validar en DNRPA`, `Datos informados por DNRPA` y sus filas, `El titular coincide con el cliente.` (sin paso previo, D-B6-04), y `Ejemplo de error` con su caja roja (DP-B09-03). Tampoco se muestran valores de ejemplo del Figma (`Tomás Iturralde`, `AC456FG`, `30.123.456`) como texto fijo (FC4).

## 9. Estados y casos borde

| Caso | Comportamiento |
|---|---|
| Cargando cliente | Skeleton en la línea de contexto. Formulario deshabilitado. |
| Cliente 404 | Estado "Cliente no encontrado" (DP-B09-04) con enlace a `/clientes`. Sin formulario y sin `POST`. |
| Cliente 5xx o red | `AlertaError` con `detail` (o DP-B09-07 si no llega) y botón "Reintentar" (es un GET). |
| `clienteId` que no es UUID | Igual que 404, sin request. |
| Patente vacía o solo espacios | Error de campo (DP-B09-01). Sin request. |
| Patente con formato inválido | Error de campo (DP-B09-01). Sin request. |
| Patente en minúsculas | Se muestra en mayúsculas y se envía sin espacios (`ab123cd ` → `AB123CD`). |
| Uso | Valor inicial `Particular` (`'0'`). Nunca vacío. |
| Guardando | "Guardar vehículo" deshabilitado con `aria-busy="true"`. "Cancelar" deshabilitado. |
| Doble clic | Una sola request (el botón se deshabilita en el primer clic). |
| 201 | Navega a `/clientes/:clienteId` con el aviso (DP-B09-02). |
| 400 con `errors.patente` | Campo con `aria-invalid="true"` y mensaje en `role="alert"`. |
| 400 solo con `detail` | `AlertaError` (`role="alert"`) con el texto limpio. No marca ningún campo (FC10). |
| 500 | `AlertaError` con `detail` ("Ocurrió un error inesperado." del back). Sin reintento automático. |
| Retry | Mutación con `retry: 0`. |
| Permisos | Solo Empleado y Administrador (`RequireRol`, T-13). Sin sesión, `/login`. |

## 10. Tests requeridos

| Test | Afirma | Herramienta |
|---|---|---|
| `schema: acepta AB123CD y ABC123` | Ambos formatos válidos | Vitest |
| `schema: rechaza AB12CDE, ABC1234, A123 y cadena vacía` | Formatos inválidos | Vitest |
| `schema: normaliza " ab123cd " a AB123CD` | `trim` y mayúsculas antes de validar | Vitest |
| `schema: uso por defecto es "0"` | Particular es el valor inicial | Vitest |
| `form: patente inválida no envía POST` | Contador de requests de MSW en 0 | Testing Library + MSW |
| `form: el campo muestra la patente en mayúsculas` | Regla de UI de mayúsculas | Testing Library |
| `form: el Select Uso ofrece Particular y Comercial sin opción vacía` | Opciones exactas | Testing Library |
| `form: Comercial envía uso numérico 1` | Body `{ clienteId, patente, uso: 1 }` | Testing Library + MSW |
| `form: 201 navega a /clientes/:clienteId` | Ruta final y aviso en el state | Testing Library + router en memoria |
| `form: doble clic envía una sola request` | Un solo POST; botón deshabilitado | Testing Library + MSW (delay) |
| `form: 500 no reintenta` | Una sola request con 500 | MSW |
| `error: errors.patente marca el campo` | `aria-invalid="true"` y `aria-describedby` | Testing Library |
| `error: solo detail muestra alerta y no marca campo` | `role="alert"` con el texto; sin `aria-invalid` | Testing Library |
| `error: prefijo VEHICULO_NO_ENCONTRADO se quita` | Texto visible sin prefijo | Testing Library |
| `error: prefijo RN03 se quita` | Texto visible sin `RN03: ` | Testing Library |
| `error: 502 muestra detail` | Alerta con el texto del back | Testing Library + MSW |
| `cliente: 404 no muestra formulario ni hace POST` | "Cliente no encontrado" y contador en 0 | Testing Library + MSW |
| `página: no renderiza Validar en DNRPA ni bloque DNRPA` | Ausencia de esos textos | Testing Library |
| `página: Cancelar navega sin POST` | Ruta final y contador en 0 | Testing Library |
| `a11y: sin violaciones en estado inicial y con error` | Axe sin violaciones | vitest-axe (T-19) |
| `a11y: foco inicial en Patente` | `document.activeElement` | Testing Library |

## 11. Criterios de aceptación

1. La ruta `/clientes/:clienteId/vehiculos/nuevo` renderiza la pantalla dentro de `LayoutBackoffice` para un Empleado o Administrador.
2. El h1 dice `Nuevo vehículo` y el foco inicial está en el campo `Patente`.
3. Los labels `Patente` y `Uso` son visibles; ninguno es placeholder.
4. Con patente inválida no hay request y el error aparece bajo el campo con `aria-invalid="true"`.
5. Una patente en minúsculas con espacios se envía en mayúsculas y sin espacios.
6. El uso inicial es `Particular` y el body envía `uso` como número (0 o 1).
7. El `POST` envía exactamente `{ clienteId, patente, uso }`.
8. Un 201 navega a `/clientes/:clienteId`.
9. Durante la petición "Guardar vehículo" está deshabilitado y un doble clic produce una sola request.
10. Un 400 con `errors.patente` marca el campo; un 400 solo con `detail` muestra alerta general sin marcar campo.
11. Los prefijos `VEHICULO_NO_ENCONTRADO: ` y `RN03: ` no se muestran.
12. Un 404 del cliente muestra "Cliente no encontrado" y no muestra el formulario.
13. No aparecen "Validar en DNRPA", "Datos informados por DNRPA" ni "Ejemplo de error".
14. "Cancelar" navega a `/clientes/:clienteId` sin request.
15. Ninguna mutación se reintenta automáticamente (500 produce una sola request).
16. Todos los tests de §10 están en verde, sin axe violations.
17. `lint`, `typecheck`, `test` y `build` del backoffice están en verde.

## 12. Verificación manual

Sin prueba manual obligatoria en la app real; el back no está desplegado para este flujo. Para la revisión local con mocks:

1. `VITE_USE_MOCKS=true npm run dev -w apps/backoffice`.
2. Iniciar sesión con el usuario Empleado del mock de T-11.
3. Abrir `/clientes/<id-del-mock>/vehiculos/nuevo`. Verificar el texto de contexto y que no aparece "Validar en DNRPA".
4. Patente `ae789fg`: se guarda como `AE789FG` y vuelve a la ficha del cliente con el aviso.
5. Patente `AC456EF`: muestra el texto de RN03 sin el prefijo `RN03: `.
6. Patente `ZZ999ZZ`: muestra el texto de no figura en DNRPA sin el prefijo.
7. Patente `AB12CDE`: muestra error de campo y no hay request (pestaña Network).
8. Hacer doble clic en "Guardar vehículo": una sola request.

Confirmar al responsable los pasos antes de abrir el PR (regla 7 del workflow).

## 13. Decisiones pendientes

- **DP-B09-01** Texto del error de campo `Patente` (formato) y del error de patente vacía. NO DEFINIDO en B6 §5 y §7. Default: `Ingresá una patente con formato AB123CD o ABC123.`
- **DP-B09-02** Aviso de éxito en la ficha del cliente. NO DEFINIDO en B6 §7. Default: `Vehículo {patente} agregado.`
- **DP-B09-03** Bloque "Ejemplo de error" del rail. Default: no se implementa; es un ejemplo visual (B6 §3, punto 2).
- **DP-B09-04** Estado "Cliente no encontrado" (B6 §7, NO DEFINIDO). Default: título `Cliente no encontrado` y enlace `Ir a clientes` a `/clientes`.
- **DP-B09-05** Valor inicial de `Uso`. Default: `Particular` (D-B6-08). El back exige el campo, así que el front siempre envía uno.
- **DP-B09-06** Patente duplicada. B6 §7 la pone bajo el campo; FC10 solo permite marcar un campo con `errors`. Default: alerta general con el `detail`, hasta que PB-14 publique un código.
- **DP-B09-07** Texto cuando el error no trae `detail`. Default: `No se pudo completar la operación. Intentá de nuevo.`
- **D-13** (índice): alta en un solo paso. Ya decidido; esta tarea lo implementa.
- **D-B6-01** y **D-B6-02** (vista previa DNRPA y campos DNRPA ausentes): se resuelven en PB-23. Esta tarea no depende de su resultado.
- **D-B6-07** (ítems admin en el sidebar para Empleado): lo resuelve T-16.
- Campana (B6 §8): pertenece al Topbar de T-16; sin acción por ahora.

## 14. Riesgos y errores comunes

- Enviar `uso` como string (`"0"`) produce 400: el enum viaja como número. Convertir con `Number()` en un único punto.
- Validar antes de normalizar rechaza `ab123cd`. Orden: `trim`, mayúsculas, regex.
- Mostrar el `detail` con el prefijo `VEHICULO_NO_ENCONTRADO:` o `RN03:`. Limpiarlo siempre con la misma función.
- Marcar el campo `patente` con cualquier 400. Solo con `errors.patente`.
- Reintentar el `POST` tras un 500 o un error de red: el alta puede haberse guardado. Sin reintento.
- Llamar a un endpoint de DNRPA que no existe (PB-23). No hacerlo.
- Mostrar el DNI del titular como dato propio. El back no lo devuelve en el 201; solo aparece en el texto de RN03 (ya permitido, contrato §1.5).
- Usar un nombre de query key distinto del que exporta T-26 y no invalidar la lista de vehículos.

## 15. Definición de terminado

- `npm run lint`, `typecheck`, `test` y `build` del backoffice en verde.
- Todos los criterios de §11 tildados con evidencia observada (salida de tests o captura).
- Accesibilidad revisada con el harness de T-19 en la pantalla.
- Sin secretos ni credenciales en el código ni en `.env.example`.
- Pasos de §12 entregados al responsable y confirmados antes de abrir el PR a `development`.

## 16. Observaciones al índice

- Resuelto (RV-63 / RV-04): la fila de B-09 suma T-07, T-10 y T-13 (y T-08, T-11, T-19 por RV-04); la lista de `Depende de` del INDEX es la de §3.
- Resuelto (RV-04): T-08 figura como dependencia directa de B-09 en el INDEX; deja de ser transitiva.

