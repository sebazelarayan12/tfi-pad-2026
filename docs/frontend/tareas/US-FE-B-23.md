# US-FE-B-23: Planes: alta, desactivación, inactivos y reactivación

Tipo B · Oleada 5 · Tamaño S · Rama sugerida `feature/US-FE-B-23-planes-alta-baja` · Tarjeta Trello `US-FE-B-23`

## 1. Objetivo

Al terminar, el Administrador puede crear un plan (`Nuevo plan`, `POST /api/planes`), desactivar un plan con el toggle `Activo` (`DELETE /api/planes/{id}`, con confirmación), y ver los planes inactivos con un filtro. El filtro de inactivos y la reactivación quedan implementados contra mock pero ocultos hasta que el back publique el PB-09 (RV-D29). Usuario: solo Administrador.

## 2. Alcance

**Entra**
- Botón `Nuevo plan` en la topbar de `PlanesPage` (B-22) y modo alta en `PlanEditPanel`.
- Columna `Activo` en `PlanesTable` con `TogglePlan` (`role="switch"`).
- Diálogo de confirmación para desactivar, compuesto con `Dialogo` de `@nexa/ui` (RV-D05) con `role="alertdialog"`.
- Filtro `Mostrar inactivos` (con mock de `GET /api/planes?incluirInactivos=true`) y badge `Inactivo` en esas filas, ambos detrás de `FILTRO_INACTIVOS_DISPONIBLE = false` (RV-D29).
- Hook `useActivarPlan` (`PATCH /api/planes/{id}/activo`, mock) y su código de UI oculto tras la constante `MOSTRAR_REACTIVAR = false`.
- Hooks `useCrearPlan`, `useDesactivarPlan` y `usePlanesInactivos`.

**NO entra**
- Tabla, panel de edición y `PUT`: US-FE-B-22.
- Reactivación visible: depende de PB-09. Queda oculta (ver D-B23-03).
- Historial de cambios de estado de un plan: no existe en el back.
- Desactivar a un plan desde una pantalla distinta de B13.

## 3. Dependencias

- **Oleada (INDEX):** 5.
- **Puede empezar sin esperar a:** —.
- **Depende de:** `US-FE-B-22`, `US-FE-T-07`, `US-FE-T-09`, `US-FE-T-11`, `US-FE-T-19`, `US-FE-T-27`.
- **Pedidos al back (INDEX):** PB-09 (MSW, reactivar oculto).
- **Degradaciones:** PB-09: el listado de inactivos y la reactivación son mock; el filtro y la reactivación quedan ocultos (RV-D29, D-B23-03). `Dialogo` de `@nexa/ui` (RV-D05) para el diálogo de baja.
- **Workaround MSW (FB7.7):** `GET /api/planes?incluirInactivos=true` y `PATCH /api/planes/{id}/activo` son mock de T-27. El código no lee `VITE_USE_MOCKS` (FC3).

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB7.7 (MSW), FB7.9 (no reenviar mutaciones), FB7.10 (solo Admin).
- `docs/frontend/tareas/INDEX.md`: FC1, FC2, FC3, FC10, FC11, FC16, D-33 (no aplica).
- `docs/frontend/pantallas/B13-planes.md`:
  - §3 (columna `Activo` 60 px; topbar con `Nuevo plan` a la derecha; panel con el toggle `Activo` y su posición).
  - §4 (`Button` primario con ícono `+`; `Chip`; toggles `Activo` como frames sueltos).
  - §5 (texto `Nuevo plan`, header `Activo`, label `Activo`).
  - §7 (toggle encendido: negro, pastilla a la derecha; alta sin frame: NO DEFINIDO; guardando; éxito; error).
  - §8 (acciones: `Nuevo plan`, toggle `Activo`: apagar = `DELETE`, encender = NO EXISTE, confirmación previa NO DEFINIDO).
  - §9 (`POST /api/planes`, `DELETE /api/planes/{id}`, planes inactivos NO EXISTE, contrato propuesto de inactivos).
  - §10 (RN15: baja lógica; RN06).
  - §12 (toggle `role="switch"` con `aria-checked`; label `Activo`).
  - §13 puntos 2, 3, 5, 8.
- `docs/frontend/contratos-api/vehiculos-planes-cotizaciones.md`: §4.3 (`POST /api/planes`, 201, `Location`, errores de alta), §4.5 (`DELETE /api/planes/{id}`, 204, idempotente, 404).
- `docs/frontend/pedidos-al-back.md`: PB-09 (contrato mínimo propuesto: `GET /api/planes?incluirInactivos=true` y `PATCH /api/planes/{id}/activo`).
- `docs/frontend/design-system.md`: §5.1 (Button), §5.5 (Chip), §5.14 (Backdrop), §8.3 (foco visible), §8.5 (tamaños táctiles del toggle).

## 5. Archivos a crear o modificar

Bajo `frontend/apps/backoffice/src/features/planes/`. Dueño de los nuevos: US-FE-B-23. Los que se editan son de US-FE-B-22.

| Archivo | Acción | Dueño | Nota |
|---|---|---|---|
| `components/TogglePlan.tsx` | crear | B-23 | `role="switch"` con `aria-checked` y nombre `Activo`. |
| `components/ConfirmarDesactivarDialog.tsx` | crear | B-23 | Compone `Dialogo` de `@nexa/ui` (RV-D05) con `role="alertdialog"`. Foco inicial en `Cancelar`. |
| `components/PlanInactivoBadge.tsx` | crear | B-23 | Badge `Inactivo`. |
| `components/FiltroInactivos.tsx` | crear | B-23 | Checkbox `Mostrar inactivos`. Solo se renderiza si `FILTRO_INACTIVOS_DISPONIBLE` es `true` (RV-D29). |
| `api/useCrearPlan.ts` | crear | B-23 | `useMutation` sobre `POST /api/planes`. `retry: 0`. |
| `api/useDesactivarPlan.ts` | crear | B-23 | `useMutation` sobre `DELETE /api/planes/{id}`. `retry: 0`. |
| `api/useActivarPlan.ts` | crear | B-23 | `useMutation` sobre `PATCH /api/planes/{id}/activo` (mock). Sin UI visible en esta tarea. |
| `api/usePlanesInactivos.ts` | crear | B-23 | `useQuery` sobre `GET /api/planes?incluirInactivos=true` (mock). Solo se habilita con el filtro activo y la constante en `true`. |
| `config.ts` | crear | B-23 | `export const MOSTRAR_REACTIVAR = false;` (ver D-B23-03) y `export const FILTRO_INACTIVOS_DISPONIBLE = false;` (RV-D29, PB-09). |
| `pages/PlanesPage.tsx` | editar (bloque) | B-22 | Agregar `Nuevo plan` a la topbar y `FiltroInactivos`. |
| `components/PlanesTable.tsx` | editar (bloque) | B-22 | Agregar columna `Activo`. |
| `components/PlanRow.tsx` | editar (bloque) | B-22 | Renderizar `TogglePlan` o `PlanInactivoBadge`. |
| `components/PlanEditPanel.tsx` | editar (bloque) | B-22 | Modo alta; toggle `Activo` en el panel. |
| `index.ts` | editar (bloque) | B-22 | Exportar nada nuevo salvo lo que lo requiera. |
| Tests (§10) | crear | B-23 | |

No se editan `packages/*`.

## 6. Pasos de implementación

1. Confirmar en `@nexa/api` (T-27): `crearPlan(body)`, `desactivarPlan(id)`, `listarPlanes({ incluirInactivos })`, `activarPlan(id, { activo })` (mock), `planesKeys.inactivos`. Si falta alguno, pedirlo a T-27.
2. Escribir primero los tests de §10 (test-first, FB: regla de UI).
3. Crear `config.ts`: `export const MOSTRAR_REACTIVAR = false;` con comentario "PB-09: reactivar oculto hasta que el back publique PATCH /api/planes/{id}/activo", y `export const FILTRO_INACTIVOS_DISPONIBLE = false;` con comentario "PB-09: filtro de inactivos oculto (RV-D29)".
4. Modo alta en `PlanEditPanel`: prop `modo: 'editar' | 'crear'`.
   - Título `Nuevo plan` (propuesta; no hay frame de alta).
   - `Código` editable (max 10), sin helper de `El código no se puede cambiar.`.
   - Mismos campos y mismo `planSchema` que B-22.
   - Footer: `Cancelar` y `Guardar cambios`. `Guardar cambios` llama `useCrearPlan`.
   - Al `201`: selecciona el plan nuevo (`Location` o `id` del body), cierra el modo alta y refresca la lista.
5. `Nuevo plan` (botón topbar): `Button` primario M con ícono `plus` (`aria-hidden`). Abre el panel en modo `crear` con todos los campos vacíos.
6. Columna `Activo` en `PlanesTable` (60 px). Para planes activos: `TogglePlan` con `checked`. Para inactivos: `PlanInactivoBadge` (sin toggle) mientras `MOSTRAR_REACTIVAR` sea `false`.
7. `TogglePlan` (`role="switch"`, `aria-checked`, `aria-label="Activo"`): al pasar de activo a inactivo abre `ConfirmarDesactivarDialog`. No cambia el estado hasta confirmar.
8. `ConfirmarDesactivarDialog`:
   - Compone `Dialogo` de `@nexa/ui` (RV-D05) con `role="alertdialog"`, `aria-labelledby` (título) y `aria-describedby` (cuerpo).
   - Foco inicial en `Cancelar`. `Escape` cierra sin acción.
   - `Desactivar plan` llama `useDesactivarPlan`. Deshabilitado mientras corre.
9. Al `204`: refresca `planesKeys.all`, cierra el diálogo, muestra `Plan desactivado.` (propuesta) y, si el plan estaba seleccionado, cierra el panel.
10. `FiltroInactivos`: checkbox `Mostrar inactivos`. Mientras `FILTRO_INACTIVOS_DISPONIBLE` sea `false` (RV-D29), no se renderiza ni hay request. Al marcarlo, `usePlanesInactivos` se habilita y la tabla muestra también los inactivos con `PlanInactivoBadge`.
11. `TogglePlan` del panel (`PlanEditPanel`): mismo comportamiento que el de la fila (abre el mismo diálogo).
12. `useActivarPlan` se escribe con su test contra el mock, pero no se renderiza ningún control de reactivación mientras `MOSTRAR_REACTIVAR` sea `false`. Si se cambia la constante, el control aparece en `PlanRow` con el mismo `TogglePlan`.
13. Escribir las pruebas de §10 y verificar que pasan.

## 7. Contrato con el back

| Método y ruta | Estado | Auth | Request | Respuesta | Errores que maneja la UI |
|---|---|---|---|---|---|
| `POST /api/planes` | Implementado (PR #23) | `Administrador` | `PlanRequest` | 201 `PlanResponse` (header `Location: /api/planes/{id}`) | 400 `detail`: `Ya existe un plan con el código '{C}'.` (sin campo: PB-14), y los de validación de §4.3 del contrato; 400 `ValidationProblemDetails`; 401; 403 |
| `DELETE /api/planes/{id}` | Implementado (PR #23) | `Administrador` | — | 204 (idempotente: repetir no falla) | 404 `El plan {id} no existe.`; 401; 403 |
| `GET /api/planes?incluirInactivos=true` | **NO EXISTE** (PB-09). Mock de T-27. | `Administrador` | query `incluirInactivos=true` | 200 `PlanResponse[]` (activos e inactivos) | 401; 403 |
| `PATCH /api/planes/{id}/activo` | **NO EXISTE** (PB-09). Mock de T-27. | `Administrador` | `{ activo: boolean }` | 200 `PlanResponse` | 404; 401; 403 |

Forma de los mocks (propuesta de PB-09, que T-27 implementa):

```ts
// GET /api/planes?incluirInactivos=true   (Politicas.Admin cuando incluirInactivos=true)
// PATCH /api/planes/{id}/activo  { activo: boolean }  -> 200 PlanResponse   (Politicas.Admin)
```

Tipos (de `vehiculos-planes-cotizaciones.md` §3.2 y §4; los exporta T-27): `PlanRequest`, `PlanResponse`, y `{ activo: boolean }` para el `PATCH`.

Handlers MSW: T-27 (`packages/api/mocks/handlers/planes.ts`).

## 8. Contenido de UI

Textos literales del Figma (B13 §5):

| Elemento | Texto |
|---|---|
| Botón | `Nuevo plan` |
| Header | `Activo` |
| Label del toggle | `Activo` |

Textos que el Figma no define (propuesta, B13 §7 y §8 "NO DEFINIDO"):

| Elemento | Texto propuesto |
|---|---|
| Título del panel en alta | `Nuevo plan` |
| Éxito de alta | `Plan creado.` |
| Título del diálogo | `Desactivar plan {codigo}` |
| Cuerpo del diálogo | `El plan deja de aparecer en la lista pública y no se puede cotizar. Las pólizas ya emitidas no cambian.` (RN15, RN06) |
| Botón del diálogo | `Cancelar` (foco inicial) y `Desactivar plan` |
| Éxito de desactivación | `Plan desactivado.` |
| 404 al desactivar | `El plan {id} no existe.` (texto del back) |
| Checkbox de inactivos | `Mostrar inactivos` |
| Badge de plan inactivo | `Inactivo` (token `status/vencida`) |
| Error de alta con código duplicado | texto del back: `Ya existe un plan con el código '{C}'.` |
| Guardando alta | `Guardando…` |

## 9. Estados y casos borde

| Caso | Comportamiento |
|---|---|
| Alta: formulario con errores de campo | No se envía el POST (mismo `planSchema` que B-22). |
| Alta: código duplicado | Alerta del panel con el `detail`. No se marca un campo (PB-14). |
| Alta: 201 | Plan seleccionado, lista refrescada, mensaje `Plan creado.`. |
| Alta en curso | Botón deshabilitado; un solo POST (FC11). |
| Toggle `Activo` de un plan activo | Abre el diálogo. El toggle no cambia hasta confirmar. |
| Diálogo: `Cancelar` o `Escape` | Cierra sin request. El toggle queda como estaba. |
| Diálogo: confirmar | Un solo DELETE. Botón deshabilitado durante la request. |
| DELETE 204 | Lista refrescada: el plan sale de la tabla. Si estaba seleccionado, el panel se cierra. |
| DELETE 404 | Alerta con `El plan {id} no existe.` y refresco. |
| Plan inactivo visto con `Mostrar inactivos` (constante en `true`) | Badge `Inactivo`, sin toggle (PB-09). |
| Reactivar | Oculto (`MOSTRAR_REACTIVAR = false`). |
| Mostrar inactivos (constante en `true`) sin datos del mock | Mensaje de tabla vacía de B-22 (`No hay planes activos.`) se reemplaza por `No hay planes para mostrar.` (propuesta). |
| Rol Empleado | No ve la pantalla (B-22). |
| Desactivar el último plan | Permitido: el back no lo impide. Sin regla (NO DEFINIDA). |

## 10. Tests requeridos

Herramientas: Vitest, Testing Library, MSW (handlers de T-27 con `server.use`), `vitest-axe`.

`pages/PlanesPage.alta.test.tsx`:
1. `nuevo_plan_abre_formulario_vacio_con_codigo_editable`: el input `Código` no está deshabilitado y no aparece el helper de código inmutable.
2. `alta_envia_post_con_body_completo`: MSW captura el body con `codigo`, `nombre`, `descripcion`, `primaBase` (número), `tiposPermitidos` y `antiguedadMaxima`.
3. `alta_201_selecciona_el_plan_nuevo`: el panel muestra `Editar plan {codigo}` del plan creado.
4. `alta_400_codigo_duplicado_muestra_alerta_sin_marcar_campo`: `detail` `Ya existe un plan con el código 'TR'.` en `role="alert"`; ningún campo con `aria-invalid="true"`.
5. `alta_doble_clic_envia_un_post`: contador = 1.

`pages/PlanesPage.baja.test.tsx`:
6. `toggle_activo_abre_dialogo_sin_request`: al pulsar el switch, aparece `role="alertdialog"` y contador de DELETE = 0.
7. `foco_inicial_en_cancelar`.
8. `cancelar_no_envia_delete`.
9. `escape_cierra_el_dialogo_sin_request`.
10. `confirmar_envia_un_delete_y_quita_el_plan`: contador DELETE = 1; el plan ya no está en la tabla.
11. `confirmar_doble_clic_envia_un_delete`.
12. `delete_404_muestra_alerta`.
13. `toggle_del_panel_abre_el_mismo_dialogo`.

`pages/PlanesPage.inactivos.test.tsx`:
14. `inactivos_ocultos_mientras_la_constante_es_false`: sin `FILTRO_INACTIVOS_DISPONIBLE`, no se renderiza el checkbox y no se pide `incluirInactivos` (contador 0).
15. `mostrar_inactivos_pide_el_listado_con_query` (constante en `true`, sobreescrita en el test): contador de la request con `incluirInactivos=true`.
16. `inactivo_muestra_badge_y_no_toggle` (constante en `true`): aparece `Inactivo` y no hay `role="switch"` en esa fila.
17. `no_hay_control_de_reactivar_mientras_MOSTRAR_REACTIVAR_es_false`.

`api/useActivarPlan.test.ts`:
18. `patch_envia_activo_true_al_mock`: el body es `{ activo: true }` y la ruta es `/api/planes/{id}/activo`.

`components/TogglePlan.test.tsx`:
19. `role_switch_con_aria_checked_y_nombre_activo`.
20. `a11y_sin_violaciones` sobre la tabla con el toggle y el diálogo abierto.

## 11. Criterios de aceptación

1. El botón `Nuevo plan` abre el panel en modo alta con todos los campos vacíos y el código editable (test 1).
2. El alta envía `PlanRequest` completo y, con 201, deja seleccionado el plan creado (tests 2 y 3).
3. Un código duplicado muestra el `detail` en una alerta y no marca ningún campo (test 4).
4. Desactivar exige confirmación en `role="alertdialog"` con foco inicial en `Cancelar`; `Escape` y `Cancelar` no envían nada (tests 6, 7, 8, 9).
5. Confirmar envía un único `DELETE` y el plan sale de la tabla (tests 10 y 11).
6. Un 404 al desactivar muestra el texto del back y refresca la lista (test 12).
7. Mientras `FILTRO_INACTIVOS_DISPONIBLE` sea `false` (RV-D29), el filtro `Mostrar inactivos` no aparece ni pide nada (test 14); con `true`, pide el listado con `incluirInactivos=true` y muestra los inactivos (test 15).
8. Los inactivos muestran el badge `Inactivo` y no un toggle (test 16).
9. No hay ningún control de reactivación visible mientras `MOSTRAR_REACTIVAR` sea `false` (test 17).
10. `useActivarPlan` envía `{ activo: boolean }` a la ruta del PB-09 (test 18).
11. El toggle es `role="switch"` con `aria-checked` y nombre `Activo` (test 19).
12. Los tests 1 a 20 están en verde, con `vitest-axe` sin violaciones.
13. `npm run lint`, `typecheck`, `test` y `build` están en verde en `apps/backoffice`.

## 12. Verificación manual

1. Entrar como Administrador a `/planes`.
2. Pulsar `Nuevo plan`, completar los campos con código `XX` y guardar: verificar que aparece `Plan creado.` y la fila nueva.
3. Intentar crear otro plan con código `TR`: verificar el mensaje de código duplicado.
4. Apagar el toggle `Activo` de `XX`: verificar el diálogo, pulsar `Cancelar` y comprobar que nada cambia.
5. Apagar el toggle otra vez y confirmar: verificar que `XX` sale de la tabla y que `Plan desactivado.` aparece.
6. Con `FILTRO_INACTIVOS_DISPONIBLE` en `true` (solo en el entorno del equipo), marcar `Mostrar inactivos`: verificar que `XX` aparece con `Inactivo` y sin toggle.
Confirmar los resultados antes de abrir el PR (regla 7 de `docs/workflow.md`).

## 13. Decisiones pendientes con default

- **D-B23-01: título del panel de alta y código editable.** No hay frame de alta (B13 §13.5). Default: título `Nuevo plan` y código editable.
- **D-B23-02: confirmación al desactivar (B13 §13.8).** Default: diálogo con confirmación (`Dialogo` de `@nexa/ui`, RV-D05), con el mismo patrón que B-08 (foco en `Cancelar`).
- **D-B23-03: reactivación.** PB-09 (Degrada). Default: código implementado y oculto con `MOSTRAR_REACTIVAR = false` hasta que el back publique `PATCH /api/planes/{id}/activo`.
- **D-B23-04 (RV-D29): forma de ver inactivos.** NO DEFINIDO. Default: checkbox `Mostrar inactivos` arriba de la tabla, oculto mientras `FILTRO_INACTIVOS_DISPONIBLE` sea `false` (PB-09).
- **D-B23-05: desactivar el último plan.** Sin regla (NO DEFINIDA). Default: permitido; el back no lo impide.
- **D-B23-06: texto del diálogo.** Propuesta de §8 basada en RN15 y RN06. Confirmar con el equipo.

## 14. Riesgos y errores comunes

- **Toggle que cambia antes de confirmar.** Si el estado visual cambia y luego se cancela, la tabla queda desincronizada. El toggle se controla desde el estado del servidor.
- **DELETE sin confirmación.** Es una baja lógica, pero afecta cotizaciones. No llamar `DELETE` desde el `onChange` del toggle.
- **Mostrar inactivos sin permisos.** `incluirInactivos=true` es solo Admin. La pantalla ya lo exige (B-22).
- **Reactivar por accidente.** Con `MOSTRAR_REACTIVAR = false`, no existe el control. No duplicar la lógica de reactivación en otro componente.
- **Plan desactivado en el panel.** Si el plan seleccionado se desactiva, el panel debe cerrarse; si no, el `PUT` posterior falla con 400 o 404.

## 15. Definición de terminado

- `npm run lint`, `typecheck`, `test` y `build` en verde.
- Accesibilidad revisada con T-19 en el diálogo (foco, `Escape`, `aria-labelledby`) y en el toggle.
- Sin secretos.
- Criterios 1 a 12 de §11 tildados con evidencia observada.

## 16. Observaciones al índice

- Resuelto (RV-D29): el filtro `Mostrar inactivos` queda oculto tras `FILTRO_INACTIVOS_DISPONIBLE` hasta PB-09 (ver §13, D-B23-04). Sin otras observaciones.
