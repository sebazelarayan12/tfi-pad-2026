# US-FE-B-22: Planes: listado y edición

Tipo B · Oleada 4 · Tamaño M · Rama sugerida `feature/US-FE-B-22-planes-listado-edicion` · Tarjeta Trello `US-FE-B-22`

## 1. Objetivo

Al terminar, `/planes` (B13) muestra la tabla de planes activos (código, nombre, prima base, tipos permitidos y antigüedad máxima) y un panel `Editar plan {codigo}` para cambiar nombre, descripción, prima base, tipos permitidos y antigüedad máxima con `PUT /api/planes/{id}`. El código no se puede cambiar desde la UI. Usuario: solo Administrador. Un Empleado que entra por URL ve acceso denegado.

## 2. Alcance

**Entra**
- Feature `apps/backoffice/src/features/planes/`: `api/`, `components/`, `pages/`, `schemas/`, `types/`, `routes.tsx` e `index.ts`. Esta tarea es la primera de la feature (FC1): es dueña de `index.ts` y de `routes.tsx`.
- Ruta `/planes` protegida con `RequireRol` de T-13 (rol `Administrador`).
- Tabla `PlanesTable` y `PlanRow` (sin columna `Activo`: la agrega B-23).
- Panel `PlanEditPanel` en modo edición, con `react-hook-form` y zod.
- Componentes `TiposPermitidosChips`, `TiposPermitidosTags` (solo lectura, para la tabla), `PrimaBaseField`, `AntiguedadMaximaField`, `PlanDescripcionField`.
- Hooks `usePlanes`, `usePlan(id)` y `useActualizarPlan` en `features/planes/api/`.
- Schema `planSchema` (zod) y funciones de mapeo `PlanRequest` ↔ formulario.

**NO entra**
- Alta de plan (`Nuevo plan`, `POST /api/planes`): US-FE-B-23.
- Columna `Activo`, toggle y desactivación: US-FE-B-23.
- Listado de inactivos y reactivación: US-FE-B-23 (con mock).
- Confirmación de desactivar: US-FE-B-23.
- Campana y topbar: T-16.

## 3. Dependencias

- **Oleada (INDEX):** 4.
- **Puede empezar sin esperar a:** `US-FE-B-23` (lo consume este PR; B-23 declara dependencia de B-22).
- **Depende de:** `US-FE-T-04`, `US-FE-T-05`, `US-FE-T-06`, `US-FE-T-09`, `US-FE-T-11`, `US-FE-T-13`, `US-FE-T-16`, `US-FE-T-19`, `US-FE-T-27`.
- **Pedidos al back (INDEX):** —.
- **Degradaciones:** PB-13 (enums): `tiposPermitidos` viaja como texto con comas, no es un enum; no aplica el mapa de enums. PB-15 (mensajes en inglés en `errors`): el front mapea cada clave a un mensaje propio (FB7.6).
- **Parseo de importes:** `parseImporteEsAR` de T-09 (RV-26). `PlanDescripcionField` es un componente local de la feature (plan de correcciones, fila 100); no se pide a T-04.
- **Workaround MSW:** no aplica (todos Implementados). Tests con handlers de T-27.

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB1 (zod + react-hook-form), FB3 (reglas 1 a 4), FB4 (formato de dinero), FB7.6 (mensajes en español), FB7.10 (Planes solo Admin).
- `docs/frontend/tareas/INDEX.md`: FC1, FC2, FC9 (dinero), FC10 (errores), FC16, D-07 (no aplica), D-08 (coberturas fuera de alcance), D-25 (ancho mínimo 1280 px).
- `docs/frontend/pantallas/B13-planes.md`:
  - §2 (ruta `/planes`, guardas).
  - §3 (estructura: tabla 791 px, panel 320 px, anchos de columnas, fila seleccionada).
  - §3 "Panel Editar plan TR" (orden de campos).
  - §4 (componentes: `Input`, `Chip`, `Button`; propuestas de `TiposPermitidosChips`, `PrimaBaseField`, `AntiguedadMaximaField`).
  - §5 (textos literales: títulos, headers, labels, helpers, botones).
  - §6 (reglas de campos: código, nombre, descripción, prima, tipos, antigüedad).
  - §7 (estados: cargando, vacío, error, fila seleccionada, chips, guardando, éxito, error de validación).
  - §8 (acciones: fila o lápiz, `Guardar cambios`, `Cancelar`).
  - §9 (endpoints y el body de `PUT`; mapeo de `PlanResponse`).
  - §12 (accesibilidad: `aria-describedby` en el helper de código; chips con `aria-pressed`; fila con `aria-selected` o `aria-current`).
  - §13 puntos 1, 4, 5, 6, 9 y 11.
- `docs/frontend/contratos-api/vehiculos-planes-cotizaciones.md`:
  - §3.2 (campos de `PlanRequest`, límites, normalización de `tiposPermitidos`).
  - §4.1 (`GET /api/planes`), §4.2 (`GET /api/planes/{id}`), §4.4 (`PUT /api/planes/{id}`) con sus errores.
- `docs/frontend/contratos-api/convenciones-transversales.md`: §3.3 (`ValidationProblemDetails`: claves en PascalCase), §3.4 (`ProblemDetails`), §5.4 (dinero: decimal con 2 decimales).
- `docs/frontend/design-system.md`: §5.1 (Button), §5.2 (Input: estados, `aria-describedby`), §5.5 (Chip: `Seleccionado`, `Sin seleccionar`), §5.12 (Table: 52 px en planes), §8.3 (foco visible), §8.1 (contraste).
- `docs/frontend/pedidos-al-back.md`: PB-13 y PB-15 (solo lectura).

## 5. Archivos a crear o modificar

Bajo `frontend/apps/backoffice/src/features/planes/`. Dueño de todos: US-FE-B-22, salvo lo indicado.

| Archivo | Acción | Nota |
|---|---|---|
| `routes.tsx` | crear | `[{ path: '/planes', element: <RequireRol rol="Administrador"><PlanesPage /></RequireRol> }]`. Reemplaza el stub de T-14 si existe. |
| `index.ts` | crear | Exporta `planesRoutes`. B-23 agrega su bloque. |
| `pages/PlanesPage.tsx` | crear | Compone la tabla y el panel en dos columnas (tabla 791 px, panel 320 px, divisor de 1 px). |
| `components/PlanesTable.tsx` | crear | Tabla con `Table/Header` (52 px) y `Table/Row`. |
| `components/PlanRow.tsx` | crear | Una fila. Estado seleccionado con `accent-lime-soft`. |
| `components/TiposPermitidosTags.tsx` | crear | Texto de tipos para la tabla (sin chips). |
| `components/TiposPermitidosChips.tsx` | crear | Selector `Auto`, `Moto`, `Camioneta`: chips con `aria-pressed`. |
| `components/PlanEditPanel.tsx` | crear | Formulario de edición. B-23 le agrega el modo alta y el toggle `Activo`. |
| `components/PrimaBaseField.tsx` | crear | Campo con prefijo `$` y formato es-AR al salir del campo. |
| `components/AntiguedadMaximaField.tsx` | crear | Campo numérico con sufijo `años`. |
| `components/PlanDescripcionField.tsx` | crear | Área de texto (ver §3). |
| `api/usePlanes.ts` | crear | `usePlanes()` sobre `GET /api/planes`. |
| `api/usePlan.ts` | crear | `usePlan(id)` sobre `GET /api/planes/{id}`. |
| `api/useActualizarPlan.ts` | crear | `useMutation` sobre `PUT /api/planes/{id}`. `retry: 0`. |
| `schemas/planSchema.ts` | crear | zod + mapeo de `PlanResponse` a valores de formulario y de valores a `PlanRequest`. |
| `types/planes.ts` | crear | `PlanFormValues`. |
| Tests (§10) | crear | |

No se editan `packages/*`. El DTO `PlanRequest` y `PlanResponse` los exporta T-27 en `packages/api/src/dto/planes.ts`.

## 6. Pasos de implementación

1. Confirmar en `@nexa/api` (T-27): `listarPlanes()`, `obtenerPlan(id)`, `actualizarPlan(id, body)`, `planesKeys` (`all`, `lista`, `detalle(id)`), y los tipos `PlanRequest`/`PlanResponse`. Confirmar en T-09 `parseImporteEsAR` (RV-26). Si falta, pedirla al dueño: no escribirla aquí.
2. Crear `schemas/planSchema.ts`:
   ```ts
   import { z } from 'zod';
   export const TIPOS_VEHICULO = ['Auto', 'Moto', 'Camioneta'] as const;
   export const planSchema = z.object({
     codigo: z.string().trim().min(1, 'El código del plan es obligatorio.').max(10, 'El código no puede superar los 10 caracteres.'),
     nombre: z.string().trim().min(1, 'El nombre del plan es obligatorio.').max(80, 'El nombre no puede superar los 80 caracteres.'),
     descripcion: z.string().trim().min(1, 'La descripción del plan es obligatoria.').max(500, 'La descripción no puede superar los 500 caracteres.'),
     primaBase: z.number({ invalid_type_error: 'Ingresá un importe válido.' }).gt(0, 'La prima base debe ser mayor que cero.'),
     tiposPermitidos: z.array(z.enum(TIPOS_VEHICULO)).min(1, 'Debe indicar al menos un tipo de vehículo permitido.'),
     antiguedadMaxima: z.number().int().min(0, 'La antigüedad máxima debe ser mayor o igual a cero.').nullable(),
   });
   ```
   - Los mensajes de nombre, descripción, prima, tipos y antigüedad son los del back (`contratos-api/vehiculos-planes-cotizaciones.md` §4.3). Los de longitud máxima son propuesta: el back los responde en inglés (PB-15).
   - Función `aPlanRequest(values)`: `tiposPermitidos` = tipos en orden canónico unidos con `,` (`"Auto,Camioneta"`); `antiguedadMaxima` = `null` si el campo está vacío.
   - Función `desdePlanResponse(plan)`: `tiposPermitidos.split(',')` y `antiguedadMaxima ?? null`.
3. Crear `api/usePlanes.ts` (`useQuery`, key `planesKeys.lista`), `api/usePlan.ts` (`useQuery`, key `planesKeys.detalle(id)`), y `api/useActualizarPlan.ts`:
   - `useMutation({ mutationFn: ({ id, body }) => actualizarPlan(id, body), retry: 0 })`.
   - `onSuccess`: invalida `planesKeys.all`.
4. Crear `TiposPermitidosChips` con props `{ value: TipoVehiculo[]; onChange(next): void }`: tres `Chip` de T-05 (`tipo="seleccionado"` o `"sin-seleccionar"`), cada uno un `<button aria-pressed>`.
5. Crear `PrimaBaseField` con `react-hook-form` (`Controller`): prefijo `$` como `span` decorativo, texto de ayuda `El cambio no afecta pólizas ya emitidas.`. Al salir del campo muestra el importe con el formateador de T-09. Al enviar, convierte con la función de parseo de T-09.
6. Crear `AntiguedadMaximaField`: `Input` numérico con `inputMode="numeric"`, sufijo `años` y helper `Dejalo vacío para sin límite.` (propuesta, §8).
7. Crear `PlanDescripcionField`: `textarea` de 80 px con label `Descripción`.
8. Crear `PlanEditPanel`:
   - Título `Editar plan {codigo}` (16/22 SemiBold).
   - `Input` `Código` deshabilitado con helper `El código no se puede cambiar.` asociado con `aria-describedby`.
   - `Input` `Nombre`, `PlanDescripcionField`, `PrimaBaseField`, `TiposPermitidosChips` con label `Tipos permitidos`, `AntiguedadMaximaField`.
   - Footer: `Cancelar` (secundario) y `Guardar cambios` (primario). Ambos a la derecha.
   - `Cancelar` restablece el formulario a los valores de `usePlan`. No cierra el panel.
   - `Guardar cambios`: `handleSubmit` → `useActualizarPlan`. Deshabilitado mientras corre.
   - Errores del back (§7): `detail` en alerta del panel con `role="alert"`; `errors` por clave (PascalCase) se muestra bajo el campo correspondiente con el mensaje propio de §8.
9. Crear `PlanesTable` y `PlanRow`:
   - Columnas y anchos (B13 §3): Código 60, Nombre 229, Prima base 104, Tipos permitidos 216, Antigüedad máxima 88, Acción (lápiz) 32.
   - Prima con formato `$ 10.000,00` (T-09), `Antigüedad máxima` con `Sin límite` si es `null`, o `{n} años`.
   - Clic en la fila o en el botón lápiz selecciona el plan. La fila seleccionada tiene `aria-current="true"` y fondo `accent-lime-soft`.
   - El lápiz es un `<button>` con `aria-label="Editar plan {codigo}"` (propuesta).
9. Crear `PlanesPage`:
   - Topbar de contenido con el título `Planes` (el H2 del contenido; la campana la pone T-16).
   - Sin plan seleccionado: el panel muestra `Seleccioná un plan para editarlo.` (propuesta, §8).
10. Crear `routes.tsx` e `index.ts`.
11. Escribir los tests de §10 antes de implementar.

## 7. Contrato con el back

| Método y ruta | Estado | Auth | Request | Respuesta | Errores que maneja la UI |
|---|---|---|---|---|---|
| `GET /api/planes` | Implementado (PR #23) | anónimo | — | 200 `PlanResponse[]` (solo activos, ordenados por código) | sin errores propios |
| `GET /api/planes/{id}` | Implementado | anónimo | — | 200 `PlanResponse` | 404 `El plan {id} no existe o no está activo.` |
| `PUT /api/planes/{id}` | Implementado | `Administrador` | `PlanRequest` | 200 `PlanResponse` | 400 (`detail`): `El nombre del plan es obligatorio.`, `La descripción del plan es obligatoria.`, `La prima base debe ser mayor que cero.`, `La antigüedad máxima debe ser mayor o igual a cero.`, `Debe indicar al menos un tipo de vehículo permitido.`, `El tipo de vehículo '{X}' no es válido.`, `Ya existe otro plan con el código '{C}'.`; 400 `ValidationProblemDetails` (`errors` en PascalCase); 404 `El plan {id} no existe.`; 401; 403 |

Tipos (de `vehiculos-planes-cotizaciones.md` §3.2; los exporta T-27):

```ts
export interface PlanRequest {
  codigo: string;                   // máx 10; el back lo pasa a mayúsculas
  nombre: string;                   // máx 80
  descripcion: string;              // máx 500
  primaBase: number;                // > 0; 2 decimales
  tiposPermitidos: string;          // "Auto,Camioneta"; máx 50; nombres separados por coma
  antiguedadMaxima?: number | null; // >= 0 o null (sin límite)
}

export interface PlanResponse {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  primaBase: number;
  tiposPermitidos: string;
  antiguedadMaxima: number | null;
  activo: boolean;
}
```

Body de `PUT`: el formulario completo. `codigo` se envía igual al valor cargado, porque el back lo acepta y el campo está deshabilitado (decisión D-B22-01).

Clave de `errors` para `ValidationProblemDetails` (PascalCase): `Codigo`, `Nombre`, `Descripcion`, `PrimaBase`, `TiposPermitidos`, `AntiguedadMaxima`.

Handlers MSW: T-27 (`packages/api/mocks/handlers/planes.ts`). No se agregan aquí.

## 8. Contenido de UI

Textos literales del Figma (B13 §5):

| Elemento | Texto |
|---|---|
| Título topbar | `Planes` |
| Headers | `Código`, `Nombre`, `Prima base`, `Tipos permitidos`, `Antigüedad máxima` |
| Título del panel | `Editar plan {codigo}` (muestra: `Editar plan TR`) |
| Label código | `Código` |
| Helper código | `El código no se puede cambiar.` |
| Label nombre | `Nombre` |
| Label descripción | `Descripción` |
| Label prima | `Prima base mensual` |
| Prefijo prima | `$` |
| Helper prima | `El cambio no afecta pólizas ya emitidas.` |
| Label tipos | `Tipos permitidos` |
| Chips | `Auto`, `Moto`, `Camioneta` |
| Label antigüedad | `Antigüedad máxima` |
| Sufijo antigüedad | `años` |
| Antigüedad nula en la tabla | `Sin límite` |
| Botón cancelar | `Cancelar` |
| Botón guardar | `Guardar cambios` |

Textos que el Figma no define (propuesta, B13 §7 "NO DEFINIDO"):

| Elemento | Texto propuesto |
|---|---|
| Sin plan seleccionado | `Seleccioná un plan para editarlo.` |
| Éxito | `Cambios guardados.` (el panel queda abierto con los valores guardados) |
| Helper antigüedad | `Dejalo vacío para sin límite.` |
| Carga de la tabla | skeleton de 3 filas de 52 px |
| Tabla vacía | `No hay planes activos.` |
| Error de la tabla | `No se pudieron cargar los planes.` + `detail` |
| Guardando | `Guardando…` en el botón |
| Error sin `detail` | `Ocurrió un error inesperado.` |
| Longitud de código | `El código no puede superar los 10 caracteres.` |
| Longitud de nombre | `El nombre no puede superar los 80 caracteres.` |
| Longitud de descripción | `La descripción no puede superar los 500 caracteres.` |
| Prima no numérica | `Ingresá un importe válido.` |
| Mensajes de `errors` (PB-15) | `Codigo` → `El código del plan es obligatorio.`; `Nombre` → `El nombre del plan es obligatorio.`; `Descripcion` → `La descripción del plan es obligatoria.`; `PrimaBase` → `La prima base debe ser mayor que cero.`; `TiposPermitidos` → `Debe indicar al menos un tipo de vehículo permitido.`; `AntiguedadMaxima` → `La antigüedad máxima debe ser mayor o igual a cero.` |

Valores de muestra del Figma (no son texto fijo): `RC`, `Responsabilidad Civil`, `$ 10.000,00`, `TC`, `Terceros Completo`, `$ 18.000,00`, `TR`, `Todo Riesgo`, `$ 27.500,00`, `10 años`, `Cubre casi todo, incluso choques parciales`.

## 9. Estados y casos borde

| Caso | Comportamiento |
|---|---|
| Cargando la tabla | Skeleton de 3 filas de 52 px. |
| Tabla vacía | `No hay planes activos.` |
| Error de la tabla | Mensaje y `detail` en `role="alert"`. |
| Sin plan seleccionado | `Seleccioná un plan para editarlo.` |
| Código | Deshabilitado; nunca se edita desde la UI (D-B22-01). |
| Prima con coma | Se parsea con T-09 al enviar; se formatea al salir del campo. |
| Prima 0 o negativa | Error de campo (`La prima base debe ser mayor que cero.`); no se envía. |
| Tipos vacíos | Error de campo; no se envía. |
| Antigüedad vacía | Se envía `null`. |
| Antigüedad negativa | Error de campo. |
| Guardar en curso | Botón deshabilitado con `aria-disabled="true"`. Un solo PUT (FC11). |
| 400 `detail` (negocio) | Alerta del panel con `role="alert"`. |
| 400 `errors` | Mensaje propio bajo el campo, con el mapeo de §8. |
| 404 (plan inexistente) | Alerta `El plan {id} no existe.` y refresco de la lista. |
| 401 / 403 | Lo resuelve T-08 / T-13. |
| Cancelar | Restablece los valores cargados; no envía nada. |
| Cambio de selección con cambios sin guardar | Se descartan los cambios (sin diálogo; NO DEFINIDO). Ver D-B22-04. |
| Viewport < 1280 px | El panel baja debajo de la tabla (B13 §11). |

## 10. Tests requeridos

Herramientas: Vitest, Testing Library, MSW (handlers de T-27 con `server.use`), `vitest-axe`.

`schemas/planSchema.test.ts`:
1. `rechaza_nombre_vacio_con_mensaje_del_back`: `El nombre del plan es obligatorio.`.
2. `rechaza_prima_cero`: `La prima base debe ser mayor que cero.`.
3. `rechaza_tipos_vacios`: `Debe indicar al menos un tipo de vehículo permitido.`.
4. `antiguedad_vacia_es_null`: `aPlanRequest` deja `antiguedadMaxima: null`.
5. `tipos_en_orden_canonico`: `['Camioneta','Auto']` produce `"Auto,Camioneta"`.

`pages/PlanesPage.test.tsx`:
6. `tabla_muestra_headers_del_figma`.
7. `muestra_planes_con_formato`: `RC` con `$ 10.000,00` y `Sin límite`; `TR` con `10 años`.
8. `clic_en_fila_carga_el_panel`: aparece `Editar plan TR`.
9. `codigo_deshabilitado_con_helper_asociado`: el input `Código` tiene `disabled` y `aria-describedby` apunta a `El código no se puede cambiar.`.
10. `chips_reflejan_tipos_guardados`: en TR, `Auto` y `Camioneta` tienen `aria-pressed="true"`; `Moto` `"false"`.
11. `sin_tipos_no_envia_put`: desmarcar todos muestra `Debe indicar al menos un tipo de vehículo permitido.`; contador PUT = 0.
12. `nombre_vacio_no_envia_put`.
13. `guardar_envia_put_con_codigo_igual_y_tipos_separados_por_coma`: body `codigo: "TR"`, `tiposPermitidos: "Auto,Camioneta"`, `primaBase: 27500`.
14. `exito_muestra_cambios_guardados`.
15. `400_errors_muestra_mensaje_bajo_el_campo`: `errors.PrimaBase` muestra `La prima base debe ser mayor que cero.` y no el texto en inglés.
16. `400_detail_muestra_alerta`: `Ya existe otro plan con el código 'TR'.` en `role="alert"`.
17. `404_muestra_alerta_y_refresca_lista`.
18. `cancelar_restablece_valores`.
19. `doble_clic_guardar_envia_un_put`: contador = 1.
20. `error_de_lista_muestra_mensaje`.
21. `a11y_sin_violaciones`: `vitest-axe` sobre la página con datos.

`routes.test.tsx`:
22. `empleado_no_ve_la_pagina`: con sesión de rol `Empleado`, `RequireRol` muestra el panel "sin permiso" en la misma URL (RV-D24; texto por defecto de T-13); el test comprueba que no aparece `Editar plan`.

## 11. Criterios de aceptación

1. `/planes` solo es visible para rol `Administrador`; un `Empleado` que entra por URL ve el panel "sin permiso" y no la tabla (RV-D24; test 22).
2. La tabla muestra las columnas `Código`, `Nombre`, `Prima base`, `Tipos permitidos`, `Antigüedad máxima` y la columna de acción, con los anchos de B13 §3.
3. `Prima base` se muestra con formato `$ 27.500,00`; `Antigüedad máxima` muestra `Sin límite` para `null` y `{n} años` para un número (test 7).
4. Hacer clic en una fila (o en el lápiz) carga `Editar plan {codigo}` en el panel y marca la fila como seleccionada con `aria-current`.
5. El campo `Código` está deshabilitado y su helper está asociado con `aria-describedby` (test 9).
6. Los chips de `Tipos permitidos` usan `aria-pressed` y reflejan los tipos guardados (test 10).
7. Sin tipos seleccionados, sin nombre, o con prima 0, no se envía el PUT (tests 11, 12 y 2).
8. `Guardar cambios` envía `PlanRequest` completo, con `codigo` igual al cargado y `tiposPermitidos` en orden canónico (test 13).
9. Un 400 con `errors` muestra el mensaje en español bajo el campo; un 400 con `detail` muestra la alerta del panel (tests 15 y 16).
10. `Cancelar` restablece los valores cargados sin enviar nada (test 18).
11. `Guardar cambios` no dispara dos PUT (test 19).
12. Ninguna prima se formatea a mano: formato con T-09 y parseo con la función de T-09 (§3).
13. Los tests 1 a 22 están en verde, con `vitest-axe` sin violaciones.
14. `npm run lint`, `typecheck`, `test` y `build` están en verde en `apps/backoffice`.

## 12. Verificación manual

1. Con la API local (o `VITE_USE_MOCKS=true`), entrar como Administrador a `/planes`.
2. Verificar la tabla con RC, TC y TR, y los valores `Sin límite` y `10 años`.
3. Hacer clic en `TR`: verificar `Editar plan TR`, el código deshabilitado y los chips `Auto` y `Camioneta` marcados.
4. Cambiar la prima a `28500,00` y guardar: verificar `Cambios guardados.` y el valor `$ 28.500,00` en la tabla.
5. Desmarcar todos los chips y verificar el mensaje sin envío.
6. Entrar como Empleado y verificar que no se ve la pantalla.
Confirmar los resultados antes de abrir el PR (regla 7 de `docs/workflow.md`).

## 13. Decisiones pendientes con default

- **D-B22-01: código editable en el back, deshabilitado en el Figma (B13 §13.1).** Default: deshabilitado en la UI; el body reenvía el código igual. Confirmar si el back deja de aceptar cambios de `Codigo` en `PUT`.
- **D-B22-02: antigüedad vacía.** Default: `null` = `Sin límite` (B13 §13.4).
- **D-B22-03: título del panel.** Default: `Editar plan {codigo}` para todos los planes (B13 §13.9).
- **D-B22-04: cambios sin guardar al elegir otro plan.** NO DEFINIDO. Default: se descartan sin aviso. Si el equipo quiere aviso, es un diálogo nuevo.
- **D-B22-05: panel después de guardar.** NO DEFINIDO (B13 §8). Default: el panel queda abierto con los valores guardados.
- **D-B22-06: precisión de la prima.** B13 §13.11 pregunta 2 decimales. Default: 2 decimales (`PlanService.cs:128`, AwayFromZero).
- **D-B22-07: mínimo de un tipo.** B13 §13.6. Default: obligatorio, mensaje del back.
- **D-B22-08 (RV-D24): acceso denegado. Resuelto.** Panel "sin permiso" en la misma URL (default de T-13), no redirección.

## 14. Riesgos y errores comunes

- **Formato de prima.** `27.500,00` no es un número en JS. Parsear solo con la función de T-09; no usar `parseFloat` ni `replace` a mano.
- **Código enviado distinto.** Si el formulario manda un código con otra capitalización, el back lo pasa a mayúsculas: el valor cargado debe reenviarse tal cual.
- **Tipos en el wire.** `tiposPermitidos` es texto con comas, no un array ni un enum. Un array enviado tal cual produce 400.
- **Planes inactivos.** `GET /api/planes` solo devuelve activos. Si se edita un plan inactivo, el back responde 200 y lo deja inactivo. No aparece en la tabla (B-23 ve inactivos con mock).
- **Chips sin nombre accesible.** Cada chip es un botón con texto visible; no usar solo color.
- **Mensajes en inglés.** Los `errors` vienen en inglés (PB-15). Nunca mostrar el texto del back en `errors`.

## 15. Definición de terminado

- `npm run lint`, `typecheck`, `test` y `build` en verde.
- Accesibilidad revisada con T-19 en `/planes` (tabla con `scope="col"`, `caption`, chips con `aria-pressed`, helper asociado).
- Sin secretos ni credenciales.
- Criterios 1 a 13 de §11 tildados con evidencia observada.

## 16. Observaciones al índice

- Resuelto (RV-26): T-09 exporta `parseImporteEsAR` y su fila lo declara; esta tarea lo usa.
- Resuelto (RV-04 / plan de correcciones, fila 100): `PlanDescripcionField` queda local a la feature; no se pide a T-04.
