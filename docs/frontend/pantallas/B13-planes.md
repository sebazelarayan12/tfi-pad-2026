# B13 · Planes

- **Pantalla:** B13 Planes (backoffice, desktop 1440 px).
- **Figma:** nodo `24:1513`, página `02 Backoffice`.
- **Contrato verificado contra:** `development` (HEAD `4ba3d4b`). Código: `PlanesController`, `PlanRequest`, `PlanResponse`, `PlanService`. Tareas: US-F2-02 (`docs/tareas-divididas.md`, línea 1012).
- **Leyenda de estado de endpoint:** **Implementado**, **En PR #N**, **Especificado**, **NO EXISTE**.

---

## 1. Propósito y quién la usa

- **Propósito:** administrar el catálogo de planes de cobertura (CU08): ver los planes activos, crear uno nuevo, editar sus datos y desactivarlo.
- **Rol:** solo Administrador. Los endpoints de escritura son `Politicas.Admin`. La lectura es pública (`[AllowAnonymous]`), pero esta pantalla es del backoffice.
- **Dato en el Figma:** el footer del sidebar muestra `Hernán Sosa` con rol `Administrador`.

## 2. Ruta propuesta y guardas de acceso

- **Ruta:** `/planes`.
- **Feature:** `apps/backoffice/src/features/planes` (FB3).
- **Guardas:** JWT válido con rol `Administrador`. Un Empleado que entre por URL debe ver acceso denegado (**NO DEFINIDO** en el Figma). Un 403 del back en escritura se muestra como error, no como redirección.
- **Sidebar:** `Planes` activo (`NavItem` con `Active=true`, grupo `Nav admin`).

## 3. Estructura visual (de arriba a abajo, medidas del Figma)

Panel shell: 1392 × 976 px en (24, 24). Sidebar de 232 px. Columna principal de 839 px (x=232). Panel derecho de edición de 320 px (x=1072), separado por un divisor de 1 px en x=1071.

| Región | Medidas | Contenido |
|---|---|---|
| Topbar | en x=24, y=32, ancho 791, alto 64 px | Título `Planes` a la izquierda; campana 36 × 36 y botón `Nuevo plan` a la derecha |
| Tabla de planes | en x=24, y=120, ancho 791, alto 213 px, borde hairline, radio 12 px | Header de 52 px, 3 filas de 52 px con divisores |
| Panel `Editar plan` | 320 px de ancho, padding 24 px, fondo panel | Título, formulario, espacio flexible, footer con dos botones |

**Anchos de columnas de la tabla (px):** Código 60 · Nombre 229 · Prima base 104 · Tipos permitidos 216 · Antigüedad máxima 88 · Activo 60 · Acción (lápiz) 32.

**Fila seleccionada:** la fila `TR` tiene fondo `accent-lime-soft` (`#f3f7c9`). Las demás, fondo panel.

**Panel `Editar plan TR`, de arriba abajo (gap 20 px):**
1. Título `Editar plan TR` (16/22 SemiBold).
2. `Input Código` (disabled), con helper.
3. `Input Nombre`.
4. `Descripción` (textarea de 80 px de alto).
5. `Prima base mensual` (campo con prefijo `$`), con helper.
6. `Tipos permitidos` (tres chips).
7. `Antigüedad máxima` (campo numérico con sufijo `años`).
8. Fila `Activo` con toggle a la derecha.
9. Espacio flexible.
10. Footer: `Cancelar` (secundario, 133 px) y `Guardar cambios` (primario, 131 px), alto 40 px.

## 4. Componentes del design system y componentes propios

**Del design system (nombre en Figma):**
- `Logo/Nexa` (nodo 14:5).
- `NavItem` (nodo 14:99). Descripción: "Sidebar nav item: 2px indicator bar at the left edge and darker text when Active=true. Icon is a Phosphor Regular glyph."
- `Button` (nodo 11:42). Descripción: "Pill button. Primary for the main action of a screen, Secondary for alternatives, Ghost for inline actions. Size M is 40px high, S is 32px high." Usos: `Nuevo plan` (primario M con ícono +), `Cancelar` (secundario M), `Guardar cambios` (primario M).
- `Chip` (nodo 11:126). Descripción: "Chip. Destacado (lime) marks the one thing that matters on a widget. Neutro is informational. Seleccionado and Sin seleccionar are selectable filter chips." Usos: tabla (`Neutro`) y selector de tipos del panel (`Seleccionado` y `Sin seleccionar`).
- `Input` (nodo 11:66). Descripción: "Input field with label above, field, and helper text below. States: Default, Focus, Error, Disabled. Never use the placeholder as the label." Usos: `Código` (Disabled) y `Nombre` (Default). `Prima base mensual` y `Antigüedad máxima` usan frames equivalentes, no la instancia.

**Sin instancia de componente (frames sueltos):** tabla, toggles `Activo` (elipse dentro de frame), íconos de lápiz y de campana, divisores, textarea de `Descripción`.

**Componentes propios (propuesta de nombres):**
- `PlanesPage` (page delgada).
- `PlanesTable` y `PlanRow` (con estado seleccionado).
- `TiposPermitidosChips` (selector multi con `Seleccionado` / `Sin seleccionar`) y `TiposPermitidosTags` (solo lectura para la tabla).
- `PlanEditPanel` (formulario con zod y react-hook-form).
- `ActivoToggle`.
- `AntiguedadMaximaField`.
- `PrimaBaseField` (formato `$ 27.500,00`).

## 5. Contenido textual literal

| Elemento | Texto literal |
|---|---|
| Título topbar | `Planes` |
| Botón | `Nuevo plan` |
| Header 1 | `Código` |
| Header 2 | `Nombre` |
| Header 3 | `Prima base` |
| Header 4 | `Tipos permitidos` |
| Header 5 | `Antigüedad máxima` (en dos líneas en el Figma) |
| Header 6 | `Activo` |
| Fila 1 (muestra) | `RC` · `Responsabilidad Civil` · `$ 10.000,00` · `Sin límite` |
| Fila 2 (muestra) | `TC` · `Terceros Completo` · `$ 18.000,00` · `Sin límite` |
| Fila 3 (muestra) | `TR` · `Todo Riesgo` · `$ 27.500,00` · `10 años` |
| Chips de tipos | `Auto`, `Moto`, `Camioneta` |
| Título panel | `Editar plan TR` (plantilla: `Editar plan {codigo}`) |
| Label código | `Código` |
| Helper código | `El código no se puede cambiar.` |
| Label nombre | `Nombre` |
| Valor de muestra nombre | `Todo Riesgo` |
| Label descripción | `Descripción` |
| Valor de muestra descripción | `Cubre casi todo, incluso choques parciales` |
| Label prima | `Prima base mensual` |
| Prefijo prima | `$` |
| Helper prima | `El cambio no afecta pólizas ya emitidas.` |
| Label tipos | `Tipos permitidos` |
| Label antigüedad | `Antigüedad máxima` |
| Sufijo antigüedad | `años` |
| Label activo | `Activo` |
| Botón cancelar | `Cancelar` |
| Botón guardar | `Guardar cambios` |

**Notas:**
- En la tabla, `Sin límite` es texto del Figma para antigüedad nula. `10 años` es el valor numérico con la unidad.
- En el Figma el campo de código aparece con valor `TR`; el de nombre con `Todo Riesgo`; el de prima con `27.500,00`.

## 6. Campos y validaciones

Reglas tomadas del back (`PlanRequest` y `PlanService`). Los textos de error salen del back y se muestran tal cual.

| Campo | Tipo | Obligatorio | Regla exacta | Coherencia con el Figma |
|---|---|---|---|---|
| Código | texto | sí | Máximo 10 caracteres. Único entre planes (400 `Ya existe otro plan con el código '{codigo}'.` al editar, `Ya existe un plan con el código '{codigo}'.` al crear). Ver Dudas: el back **sí** permite cambiarlo en PUT | El Figma lo muestra **deshabilitado** con `El código no se puede cambiar.`. Conflicto |
| Nombre | texto | sí | Máximo 80 caracteres. Mensaje del back: `El nombre del plan es obligatorio.` | Sin conflicto |
| Descripción | texto multilínea | sí | Máximo 500 caracteres. Mensaje del back: `La descripción del plan es obligatoria.` | Textarea de 80 px en el Figma |
| Prima base mensual | número decimal | sí | Mayor que cero. Mensaje del back: `La prima base debe ser mayor que cero.` Formato `27.500,00` con prefijo `$` | Coherente |
| Tipos permitidos | multi-selección | sí | Valores válidos de `TipoVehiculo`: `Auto`, `Moto`, `Camioneta`. Se guarda como texto separado por coma (`"Auto,Moto,Camioneta"`). Al menos uno: **NO DEFINIDO** en el Figma; el back exige el campo no vacío (`Required`) | Coherente con los tres chips |
| Antigüedad máxima | entero o vacío | no | Mayor o igual a 0, o `null` = sin límite (según US-F2-02). Vacío = `Sin límite`: **NO DEFINIDO** en el Figma (el campo muestra `10` con `años`) | Ver Dudas |
| Activo | booleano | — | El `PlanRequest` **no tiene** campo `Activo`. Solo se puede pasar a inactivo (DELETE). Ver §9 | El Figma muestra el toggle encendido; no define cómo se reactiva |

**Formato de la prima:** `$ 27.500,00` en la tabla y en el campo. Entrada en formato es-AR, enviada como número (punto decimal) al back.

## 7. Estados

| Estado | Qué muestra | Fuente |
|---|---|---|
| Cargando la tabla | **NO DEFINIDO**. Propuesta: skeleton de 3 filas de 52 px | Propuesta |
| Tabla vacía (sin planes activos) | **NO DEFINIDO**. Propuesta: mensaje dentro de la tabla | Propuesta |
| Error al cargar | **NO DEFINIDO** | — |
| Fila seleccionada | Fondo `accent-lime-soft` (fila `TR`) | Figma |
| Panel sin plan seleccionado | **NO DEFINIDO** (el Figma siempre muestra un plan en edición) | — |
| Alta de plan nuevo | **NO DEFINIDO**: no hay frame de alta. Ver §8 | — |
| Campo código deshabilitado | Fondo `surface-subtle`, texto terciario, helper `El código no se puede cambiar.` | Figma |
| Campo código: editable | **Conflicto** con el back (ver §13) | — |
| Input Default / Focus / Error | Default en Figma. Focus y Error definidos en el componente, sin frame | Componente |
| Chip Seleccionado (Auto, Camioneta) | Fondo `action-primary` (negro), texto blanco | Figma |
| Chip Sin seleccionar (Moto) | Borde, fondo panel, texto oscuro | Figma |
| Toggle Activo encendido | Negro, pastilla a la derecha | Figma |
| Guardando | **NO DEFINIDO**. Propuesta: botón deshabilitado con indicador | Propuesta |
| Éxito al guardar | **NO DEFINIDO**. Propuesta: toast y refresco de la tabla | Propuesta |
| Error de validación del back | **NO DEFINIDO** en el Figma. Propuesta: mostrar el mensaje del 400 debajo del campo o como aviso del panel | Propuesta |

## 8. Acciones y navegación

| Acción | Qué hace | Destino |
|---|---|---|
| `Nuevo plan` | Abre un formulario de alta. **NO DEFINIDO**: el Figma no tiene frame de alta. Propuesta: el mismo panel con los campos vacíos y `Código` editable | Misma pantalla |
| Click en la fila o en el lápiz | Carga el plan en el panel `Editar plan` | Misma pantalla |
| `Guardar cambios` | `PUT /api/planes/{id}` con el body completo (`codigo`, `nombre`, `descripcion`, `primaBase`, `tiposPermitidos`, `antiguedadMaxima`). Éxito: 200, refrescar tabla y cerrar o mantener el panel (**NO DEFINIDO**) | Misma pantalla |
| `Cancelar` | Descarta los cambios del panel | Misma pantalla |
| Toggle `Activo` | Apagar: `DELETE /api/planes/{id}` (204), el plan sale de la tabla. Encender: **NO EXISTE** endpoint. Confirmación previa: **NO DEFINIDO** | — |
| Campana (topbar) | **NO DEFINIDO** | — |
| Sidebar y usuario | Igual que B11 | Rutas propuestas |

## 9. Datos: endpoints y mapeo de campos

| Dato o acción | Método y ruta | Estado | Campo del DTO → UI |
|---|---|---|---|
| Listar planes activos | `GET /api/planes` | Implementado (solo devuelve `Activo = true`) | `PlanResponse[]`: `Codigo` → Código; `Nombre` → Nombre; `PrimaBase` → Prima base; `TiposPermitidos` (texto con comas) → chips; `AntiguedadMaxima` → Antigüedad (null = `Sin límite`); `Activo` → toggle |
| Detalle de un plan activo | `GET /api/planes/{id}` | Implementado (inactivo → 404) | `PlanResponse` para cargar el panel |
| Crear plan | `POST /api/planes` (body `PlanRequest`) | Implementado. Admin. Responde 201 con `PlanResponse` | Campos del panel |
| Editar plan | `PUT /api/planes/{id}` (body `PlanRequest`) | Implementado. Admin. Responde 200 con `PlanResponse` | Campos del panel |
| Desactivar plan | `DELETE /api/planes/{id}` | Implementado. Admin. 204. Soft delete (`Activo = false`) | Toggle `Activo` apagado |
| Listar planes inactivos (admin) | — | **NO EXISTE**. `GET /api/planes` solo devuelve activos | — |
| Detalle de plan inactivo | `GET /api/planes/{id}` | **NO EXISTE** para admin: devuelve 404 si está inactivo | — |
| Reactivar plan | — | **NO EXISTE**. `PlanRequest` no tiene `Activo` y no hay endpoint | — |

**Body de `PUT` y `POST` (`PlanRequest`):**

```
{
  "codigo": "TR",             // requerido, máx. 10
  "nombre": "Todo Riesgo",    // requerido, máx. 80
  "descripcion": "...",       // requerido, máx. 500
  "primaBase": 27500.00,      // > 0
  "tiposPermitidos": "Auto,Camioneta",   // requerido, máx. 50, valores de TipoVehiculo
  "antiguedadMaxima": 10      // int? (null = sin límite)
}
```

**Formato de los enums en el wire:** `tiposPermitidos` viaja como texto con comas; no es un enum serializado. `TipoVehiculo` no aparece como campo JSON.

**Contrato propuesto para la gestión de inactivos (NO EXISTE hoy), si el Figma muestra el toggle en estado real:**

```
GET   /api/planes?incluirInactivos=true     → PlanResponse[] (solo Administrador)
POST  /api/planes/{id}/activar              → 200 PlanResponse (solo Administrador)
```

Alternativa: `PUT` con campo `activo` en `PlanRequest` (cambia el contrato existente, requiere migración del acuerdo con el back).

## 10. Reglas de negocio visibles

- **RN05:** tipos permitidos (`Auto`, `Moto`, `Camioneta`) y antigüedad máxima del vehículo. Lo que se edita aquí es lo que el back usa para cotizar.
- **RN06 / RN16:** la prima base mensual. El texto `El cambio no afecta pólizas ya emitidas.` lo expresa.
- **RN15:** baja lógica. Desactivar no borra la fila; el plan deja de aparecer en la lista pública.
- **RN06:** `PUT` no modifica la prima mensual de pólizas emitidas (US-F2-02, criterio de aceptación).

## 11. Responsive

Solo desktop. El Figma no tiene frame móvil del backoffice (1440 px).

**Propuesta, a confirmar:** por debajo de 1280 px, el panel `Editar plan` se muestra como drawer o debajo de la tabla. La tabla usa scroll horizontal dentro de su contenedor.

## 12. Accesibilidad

El Figma no define accesibilidad. Propuesta:
- Cada input tiene label visible arriba. El helper de `Código` se asocia con `aria-describedby`.
- El toggle `Activo` es un `role="switch"` con `aria-checked` y label `Activo`.
- Los chips de tipos son botones con `aria-pressed`.
- La fila seleccionada se marca con `aria-selected` o `aria-current`, no solo con color.
- La textarea de descripción tiene contador de caracteres (500) si se confirma en el diseño.

## 13. Dudas e inconsistencias Figma ↔ back

1. **Código: editable en el back, deshabilitado en el Figma.** `PlanService.ActualizarAsync` cambia `plan.Codigo` y valida unicidad. El Figma dice `El código no se puede cambiar.` Decidir: (a) el back deja de aceptar cambios de `Codigo` en PUT (el front lo reenvía igual), o (b) el Figma permite editarlo.
2. **Activo no es reversible.** `GET` y `PUT` solo ven activos. `DELETE` desactiva y el admin no puede volver a activar un plan ni verlo. El toggle del Figma sugiere que es reversible. Decidir: ¿se agrega reactivación (ver §9)?
3. **La tabla muestra solo activos, por lo tanto la columna `Activo` siempre está encendida.** El Figma muestra tres planes activos. Confirmar que el toggle de la fila solo sirve para desactivar.
4. **Antigüedad vacía.** El Figma no define si un campo vacío equivale a `Sin límite`. El back acepta `null`. Decidir la regla de la UI.
5. **Alta de plan sin diseño.** `Nuevo plan` no tiene frame de alta. El formulario del panel es de edición. **NO DEFINIDO.**
6. **Al menos un tipo permitido.** El back rechaza un campo vacío. El Figma no muestra qué pasa si no hay chips seleccionados. **NO DEFINIDO.**
7. **Mensajes de error del back.** Los 400 son textos en español (`Ya existe un plan con el código...`). El Figma no define dónde se muestran. **NO DEFINIDO.**
8. **Confirmación al desactivar.** El Figma no tiene diálogo de confirmación. Desactivar un plan es una acción de impacto: decidir si lleva confirmación.
9. **Título del panel.** El Figma usa `Editar plan TR` (con el código del plan). Confirmar la plantilla `Editar plan {codigo}` para todos los planes.
10. **Sin paginación.** El back devuelve la lista completa. Con tres planes no hace falta. Confirmar que no se espera más de 20 planes.
11. **Formato de la prima.** `$ 27.500,00` en la tabla. El back guarda decimal. Confirmar la precisión (2 decimales).

## 14. Referencia Figma

- Pantalla: nodo `24:1513`. URL: `https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=24-1513`.
- Subnodos útiles: tabla `33:1607`, fila RC `33:1625`, fila TC `33:1651`, fila TR (seleccionada) `33:1677`, panel `24:1608`, formulario `33:1701`, footer `33:1741`.
