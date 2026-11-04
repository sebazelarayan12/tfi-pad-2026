# B3 · Clientes del backoffice

Especificación del listado de clientes (asegurados) del panel interno. Fuente visual: Figma `B3 Clientes` (nodo 18:2387). Fuente de contrato: código del back y spec. Los endpoints de listado todavía no están publicados: el listado es **US-F1-06** (CU05) y el controller de clientes está en el PR #50 (abierto, rama `feature/US-F1-05-clientes-alta-renaper`, que incluye solo el alta y la previsualización de Renaper).

Convención: "Implementado" = existe en `development`/código actual; "En PR (#50)" = en el PR abierto; "Especificado" = solo en la spec o las tareas. Según FB4, el front trabaja con MSW hasta que el back publique los endpoints.

## 1. Propósito y quién la usa

- **Propósito:** buscar y consultar clientes por DNI o apellido, ver su validación en Renaper y su cantidad de vehículos y pólizas activas, y llegar al alta de un cliente nuevo (B4).
- **Quién la usa:** rol **Empleado** y rol **Administrador** (`Politicas.Empleado` incluye a ambos). Es la pantalla de trabajo diario del empleado (CU05, "Consultar, modificar y dar de baja clientes").

## 2. Ruta propuesta y guardas de acceso

- **Ruta:** `/clientes` (Propuesta).
- **Guarda:** sesión válida. Sin sesión, redirigir a `/login`.
- **Rol:** Empleado o Administrador. Los endpoints de clientes usan `[Authorize(Policy = Politicas.Empleado)]` (spec §7, `ClientesController`).
- **Sin permiso (403):** no aplica para estos roles. Para un token sin rol válido, el back responde 403 y el front cierra la sesión.
- **Ruta hija:** `/clientes/nuevo` → B4.

## 3. Estructura visual

Frame de escritorio de 1440 × 1024 px (solo escritorio, ver sección 11). Mismo shell que B2 y B4: sidebar de 232 px con "Clientes" activo, y columna principal.

Columna principal (`Columna principal`, 1160 px de ancho desde `x=232`, padding 32 px, contenido de 1096 px). Regiones de arriba abajo:

1. **Topbar** (`Topbar`, 1096 × 64 px, `y=32`): título "Clientes" a la izquierda (20/26 px SemiBold), espaciador flexible, botón campana (`Bell`, 36 × 36 px, radio pill, borde strong) y botón primario "Nuevo cliente" (40 px de alto, padding 16 px, icono `user-plus` de 16 px a la izquierda del texto). `gap` 16 px. El campo de búsqueda del topbar existe en el Figma pero está oculto (`hidden`): no se muestra (ver D-3).
2. **Filtros** (`Filtros`, 1096 × 88 px, `y=120`, `gap` 12 px):
   - Campo "Buscar por DNI o apellido" (`Input`), ancho flexible (569 px en el diseño).
   - Select "Estado Renaper" (`Select`), 200 px de ancho.
   - Select "Activo" (`Select`), 200 px de ancho.
   - Chip de conteo "128 clientes" (`Chip`, 91 × 28 px), alineado al centro vertical del bloque de filtros (`y=30`). Sin interacción.
3. **Tabla clientes** (`Tabla clientes`, 1096 × 531 px, `y=232`): contenedor con borde hairline y radio 12 px.
   - Encabezado (`Table/Header`, 40 px de alto, fondo `--nexa-surface-subtle`).
   - Filas (`Table/Row`, 48 px de alto cada una, divisor hairline de 1 px).
   - La tabla muestra 10 filas en el diseño.
   - Anchos de columna (suman 1096 px): Nombre 210 · DNI 116 · Email 226 · Teléfono 124 · Vehículos 104 · Renaper 130 · Pólizas activas 146 · menú 40. Padding horizontal de celda: 16 px.
4. **Paginación** (`Paginación`, 1096 × 32 px, `y=787`): a la izquierda "1-10 de 128" (13/18 px, texto secundario). A la derecha, dos botones secundarios de 32 px de alto: "Anterior" (73 px) y "Siguiente" (81 px), con `gap` 8 px.

Tipografía: encabezados de columna 12/16 px Medium en `--nexa-text-secondary`; celdas de texto 13/18 px Regular; DNI y pólizas (si aplica) en `JetBrains Mono` 13/18 px (Nexa/Mono); "Renaper" con `Badge/Estado` de 24 px de alto.

## 4. Componentes del design system y componentes propios

Componentes del Figma:

| Nombre en Figma | Id | Uso en esta pantalla |
|---|---|---|
| `Logo/Nexa` | 14:5 | Sidebar. |
| `NavItem` | 14:99 | Sidebar; "Clientes" con estado Active (barra indicadora de 2 px y texto oscuro). |
| `Input` | 11:66 | Campo de búsqueda. Estados: Default, Focus, Error, Disabled. Nota del componente: no usar el placeholder como label. |
| `Select` | 11:95 | Filtros "Estado Renaper" y "Activo". Mismos estados que `Input`. |
| `Chip` | 11:126 | Conteo "128 clientes" (variante Neutro, fondo `--nexa-surface-subtle`). |
| `Button` | 11:42 | "Nuevo cliente" (Primary M, 40 px) y "Anterior"/"Siguiente" (Secondary S, 32 px). |
| `Table/Header` | 15:62 | Encabezado de tabla (fondo subtle, radio superior 12 px, columnas de igual ancho según nota del componente; en el diseño los anchos son distintos, ver D-4). |
| `Table/Row` | 15:78 | Fila con divisor. "Usar `Badge/Estado` para la columna Renaper y Nexa/Mono para identificadores". |
| `Badge/Estado` | 11:117 | Columna Renaper: variantes `Validado` (tokens Vigente) y `Pendiente` (tokens Pendiente). Nota: solo tokens semánticos. |

Componentes propios:

- `ClientesPage` (pantalla, `features/clientes/pages`): compone filtros, tabla y paginación. Delgada: no calcula.
- `FiltrosClientes` (`features/clientes/components`): campo de búsqueda + dos selects + chip. Usa `zod` para normalizar la búsqueda (ver sección 6).
- `TablaClientes` (`features/clientes/components`): tabla con columnas; reutiliza `Table/Header` y `Table/Row` de `@nexa/ui`.
- `BadgeRenaper`: referencia visual del Figma, fuera del alcance actual del listado porque el resumen no incluye `validadoRenaper`. Mostrar `—` en esa celda hasta resolver PB-03.
- `PaginacionTabla` (`shared/` si se reutiliza en B2/B3; si no, en el feature): "1-10 de 128" + Anterior/Siguiente.
- `LayoutBackoffice` (`app/`): sidebar y topbar compartidos con B2 y B4.

Nota sobre el layout: el sidebar y el topbar son los mismos que B2; no duplicar. El topbar de B3 cambia solo el título y los botones de la derecha.

## 5. Contenido textual literal

| Elemento | Texto |
|---|---|
| Título del topbar | `Clientes` |
| Botón primario del topbar | `Nuevo cliente` |
| Label del campo de búsqueda | `Buscar por DNI o apellido` |
| Valor/placeholder del campo de búsqueda (color de placeholder) | `Ej. 30.512.468` |
| Ayuda bajo el campo de búsqueda | `Buscar por DNI completo o apellido.` |
| Label del select de Renaper | `Estado Renaper` |
| Valor mostrado en el select de Renaper (color de placeholder) | `Todos` |
| Ayuda bajo el select de Renaper | `Filtra por resultado de validación.` |
| Label del select de activo | `Activo` |
| Valor mostrado en el select de activo (color de placeholder) | `Todos` |
| Ayuda bajo el select de activo | `Con póliza activa.` |
| Chip de conteo | `128 clientes` (el número es dinámico: ver sección 9) |
| Encabezados de columna | `Nombre`, `DNI`, `Email`, `Teléfono`, `Vehículos`, `Renaper`, `Pólizas activas` |
| Badge Renaper | `Validado` · `Pendiente` |
| Paginación | `1-10 de 128` (dinámico) · `Anterior` · `Siguiente` |
| Sidebar (contexto común) | `Inicio`, `Clientes`, `Vehículos`, `Cotizaciones`, `Pólizas`, `Pagos y facturas`, `Pago Fácil`, `Planes`, `Usuarios` |

Textos del Figma que NO son copy final:

- Los datos de las filas (Tomás Iturralde, 30.512.468, tomas.iturralde@gmail.com, etc.) son de muestra.
- El texto del botón de la topbar tiene la capa llamada "Consultar" (nombre de capa heredado del componente `Button`), pero el texto visible es "Nuevo cliente". Usar el texto visible. Ver D-8.
- "Buscar" en el sidebar y "Buscar por DNI o apellido" en el topbar oculto: no son copy de esta pantalla.

Textos NO DEFINIDOS en el Figma:

- Estado vacío (sin resultados), estado de carga, estado de error.
- Opciones de los selects "Estado Renaper" y "Activo" (solo se ve "Todos").
- Títulos y textos de acciones de la fila (menú de tres puntos).
- Mensaje de error de la paginación o de la carga.

## 6. Campos y validaciones

Campos de búsqueda y filtros. Ninguno es un formulario que se envíe al back: son parámetros de consulta.

| Campo | Tipo | Obligatorio | Regla | Parámetro del back |
|---|---|---|---|---|
| Buscar por DNI o apellido | texto | No | Si el valor, sin puntos ni espacios, tiene exactamente 8 dígitos, se envía como `dni`. Si no, se envía como `apellido`. Los puntos del formato `30.512.468` se quitan antes de enviar. Longitud máxima: NO DEFINIDO. Propuesta: 100. | `dni` **o** `apellido` (el back los recibe por separado; `ClienteFiltro`, spec US-F1-06) |
| Estado Renaper | select | No | Valores NO DEFINIDOS en el Figma. Derivados de los badges: `Todos`, `Validado`, `Pendiente`. | **No hay parámetro en el back** (`ClienteFiltro` solo tiene Dni, Apellido, Pagina, TamanoPagina). Ver D-1. |
| Activo | select | No | Valores NO DEFINIDOS. La spec solo lista clientes con `Activo=true` (RN15). | **No hay parámetro.** Ver D-2. |
| Paginación | número | Sí (implícito) | `pagina` ≥ 1; `tamanoPagina` entre 1 y 100 (spec: por defecto 20, máximo 100). El diseño muestra 10 filas. | `pagina`, `tamanoPagina` (Ver D-5). |

Reglas de forma (zod):

- Búsqueda: `trim`, quitar puntos, validar longitud máxima. Si contiene dígitos que no forman un DNI de 8 cifras (por ejemplo `3051`), la búsqueda se hace por apellido. Propuesta, confirmar con el equipo.
- Cambio de búsqueda: reiniciar a `pagina=1`. Propuesta.
- Búsqueda al escribir con debounce de 300 ms, o al presionar Enter. NO DEFINIDO en el Figma. Propuesta: debounce.

## 7. Estados

| Estado | Qué se muestra | Estado en el Figma |
|---|---|---|
| Cargando la lista | Filas esqueleto con el mismo alto de 48 px; el chip y la paginación muestran guiones. | NO DEFINIDO. Propuesta. |
| Lista con datos | Tabla y paginación como en el diseño. | Diseñado. |
| Sin resultados (la búsqueda no encuentra nada) | Fila única dentro de la tabla: "No hay clientes que coincidan con la búsqueda." con botón "Limpiar filtros". Chip en `0 clientes`. | NO DEFINIDO. Propuesta. |
| Sin clientes en el sistema | Igual que el anterior, sin botón de limpiar. | NO DEFINIDO. Propuesta. |
| Error al cargar (5xx, sin conexión) | Banner encima de la tabla con reintentar. La tabla no se muestra vacía de forma engañosa. | NO DEFINIDO. Propuesta. |
| Sesión vencida (401) | Redirigir a `/login`. | Propuesta. |
| Badge Renaper `Validado` | Tokens Vigente (verde). | Diseñado. |
| Badge Renaper `Pendiente` | Tokens Pendiente (violeta). | Diseñado. |
| Fila con cliente dado de baja | No aparece (RN15: el listado solo muestra `Activo=true`). | Spec. |
| Foco y hover en filas | NO DEFINIDO. Propuesta: fila con fondo `--nexa-surface-subtle` en hover y foco visible en el enlace del nombre. | NO DEFINIDO. |
| Select o campo deshabilitado | Mientras carga la lista, los filtros siguen activos (Propuesta). | NO DEFINIDO. |

## 8. Acciones y navegación

| Elemento | Acción | Destino |
|---|---|---|
| Botón "Nuevo cliente" | Abre el alta de cliente. | `/clientes/nuevo` (B4). |
| Campo de búsqueda | Filtra la lista (sección 6). | Misma pantalla, `pagina=1`. |
| Select "Estado Renaper" | Filtra por estado de validación. | **NO DEFINIDO** en back (ver D-1). |
| Select "Activo" | Filtra por activo/inactivo. | **NO DEFINIDO** en back (ver D-2). |
| Botón "Anterior" | `pagina - 1`. | Misma pantalla. Deshabilitado en la primera página: NO DEFINIDO. |
| Botón "Siguiente" | `pagina + 1`. | Misma pantalla. Deshabilitado en la última página: NO DEFINIDO. |
| Botón campana | Notificaciones. | **NO DEFINIDO** (no hay endpoint). |
| Icono de tres puntos (menú de fila) | Abre opciones de la fila. | **NO DEFINIDO.** La spec tiene `GET /api/clientes/{id}` (detalle), `PUT /api/clientes/{id}` (modificar contacto y domicilio) y `DELETE /api/clientes/{id}` (baja lógica). Propuesta: "Ver detalle", "Modificar", "Dar de baja", y "Validar en Renaper" solo en filas con badge `Pendiente` (`POST /api/clientes/{id}/validar-renaper`, en PR #50). Ver D-6. |
| Fila (clic en cualquier parte) | Abre el detalle del cliente. | **NO DEFINIDO**. No hay pantalla de detalle en el Figma. |
| Sidebar | Navegación general. | Ver B2. |

## 9. Datos: endpoints y origen de cada dato

Actualización de alcance 2026-11-04: listado/detalle de US-F1-06 implementados (PR #58). El Figma no agrega campos al contrato real (FB4/FB7.11).

| Dato en pantalla | Endpoint | Estado | Campo o cálculo |
|---|---|---|---|
| Lista de clientes | `GET /api/clientes?dni=&apellido=&pagina=&tamanoPagina=` | Implementado | `PaginaResponse<ClienteResumenResponse>`: `items`, `pagina`, `tamanoPagina`, `total`. Solo activos. |
| Chip y paginación | Mismo endpoint | Implementado | Chip: `total`. Rango: `(pagina - 1) * tamanoPagina + 1` a `min(pagina * tamanoPagina, total)`; mostrar el estado vacío cuando `total = 0`. |
| Nombre, DNI, Email, Teléfono | Mismo endpoint | Implementado | `nombre` + `apellido`, `dni`, `email`, `telefono`. DNI con puntos usando T-09 de `@nexa/api`; nulos como `—`. |
| Vehículos | Mismo endpoint | Campo no disponible (PB-03) | `cantidadVehiculos` no existe en el resumen. Mostrar `—`, no cero. |
| Renaper | Mismo endpoint | Campo no disponible (PB-03) | `validadoRenaper` existe en el detalle, no en el resumen. Mostrar `—`, sin badge Validado/Pendiente. |
| Pólizas activas | Mismo endpoint | Campo no disponible (PB-03) | `cantidadPolizasActivas` no existe en el resumen. Mostrar `—`, no cero. |
| Detalle | `GET /api/clientes/{id}` | Implementado | `ClienteResponse`; aquí sí está `validadoRenaper`. |
| Validar en Renaper | `POST /api/clientes/{id}/validar-renaper` | Implementado | Acción fuera de B-04; su comportamiento se define en T-25/B-06. No inferir su disponibilidad desde un badge de lista que no existe. |

Ejemplo de forma del resumen real (los valores son de prueba; no renderizarlos como texto fijo):

```json
{
  "id": "c1000000-0000-0000-0000-000000000001",
  "dni": "30123456",
  "nombre": "Juan Carlos",
  "apellido": "Pérez",
  "email": "juan.perez@example.com",
  "telefono": null,
  "activo": true
}
```

Se preservan las columnas del diseño con el estado de dato no disponible. No añadir campos ficticios al DTO o mock, ni consultar detalle por fila para ocultar el hueco del listado. La ampliación se mantiene abierta en PB-03. Los conteos no se calculan en esta pantalla.

## 10. Reglas de negocio visibles

- **RN01.** DNI y email únicos. El listado muestra el DNI como identificador de cliente único.
- **RN02.** Antes de emitir una póliza, el cliente debe estar validado en Renaper. La columna Renaper muestra esa validación. El badge `Pendiente` indica que el cliente todavía no fue validado.
- **RN15.** No se borran clientes: se dan de baja con `Activo = false`. El listado y el detalle solo muestran `Activo=true`. Por eso el select "Activo" del diseño no tiene un valor que devuelva inactivos (ver D-2).
- **RN03.** Un vehículo debe estar validado en DNRPA y su titular debe ser el cliente. No se muestra en esta pantalla, pero la columna Vehículos cuenta los vehículos que pasaron esa validación (propuesta a confirmar).

## 11. Responsive

- El Figma solo tiene frame de escritorio (1440 px). **No hay frame mobile del backoffice.** Esta pantalla es solo escritorio según el diseño.
- Propuesta por debajo de 1280 px: la tabla conserva su ancho mínimo (1096 px de columnas) dentro de un contenedor con scroll horizontal. La página no hace scroll horizontal.
- Propuesta por debajo de 1024 px: los dos selects pasan a una segunda fila de filtros. No diseñado.
- Propuesta: columnas Email y Teléfono ocultas en pantallas angostas. No diseñado.

## 12. Accesibilidad

- La tabla es una `<table>` real con `<caption>` ("Clientes") y `<th scope="col">` en cada encabezado.
- Cada fila tiene un enlace accesible con el nombre del cliente, o el botón de menú con `aria-label` "Acciones de {nombre}" (el `aria-label` incluye el nombre porque el icono de tres puntos no dice nada por sí mismo).
- Los labels de los filtros son visibles y asociados con `htmlFor`. Las ayudas van con `aria-describedby`.
- El chip de conteo es un texto simple. Cuando cambia el total tras buscar, anunciarlo con una región `aria-live="polite"` (propuesta).
- El badge Renaper se lee como texto ("Validado" / "Pendiente"), no solo por color.
- La paginación va en un `<nav aria-label="Paginación">`. "Anterior" y "Siguiente" deshabilitados llevan `disabled`, no solo color.
- Foco visible en botones, selects, campos y enlaces de fila.

## 13. Dudas e inconsistencias Figma ↔ back

- **D-1. Filtro "Estado Renaper".** `ClienteFiltro` no tiene parámetro de validación Renaper (spec US-F1-06: solo Dni, Apellido, Pagina, TamanoPagina). Opciones: (a) agregar `validadoRenaper` al filtro del back (cambio de spec), o (b) quitar el select del diseño. Decisión del equipo.
- **D-2. Filtro "Activo".** El back solo lista clientes activos (RN15). Un filtro "Inactivos" no tiene datos en el listado. Confirmar: ¿se necesita ver inactivos? Si no, quitar el select.
- **D-3. Campo de búsqueda del topbar oculto.** El Figma tiene un `Search` en el topbar con `hidden="true"`. No se muestra. Confirmar que no debe aparecer (el de la búsqueda real está en los filtros).
- **D-4. Anchos de columna.** El `Table/Header` dice "columnas de igual ancho (layoutGrow)" en la nota del componente, pero en B3 las columnas tienen anchos distintos (210, 116, 226, 124, 104, 130, 146, 40). Confirmar que el diseño es el correcto. Propuesta: usar los anchos del diseño.
- **D-5. Tamaño de página.** El Figma muestra 10 filas ("1-10 de 128"). La spec dice `tamanoPagina` por defecto 20 y máximo 100 (US-F1-06). Propuesta: 10 por defecto, consistente con el diseño.
- **D-6. Acciones de la fila.** El icono de tres puntos no tiene opciones en el Figma. Los endpoints de detalle, modificación y baja ya están implementados (PR #58). Confirmar las opciones y si la baja necesita confirmación (el backend de US-F1-06 bloquea la baja si hay póliza Pendiente, Vigente o Suspendida). Propuesta adicional: "Validar en Renaper" en filas `Pendiente`, que reintenta la validación caída (endpoint del PR #50).
- **D-7. Campos de `ClienteResumenResponse`.** Resuelto el contrato base por US-F1-06/PR #58: siete campos reales en §9. La ampliación Renaper/conteos sigue pendiente PB-03. Hasta entonces, mostrar `—` en esas celdas (FB7.11), sin inventar valores.
- **D-8. Nombre del botón de la topbar.** La capa del Figma se llama "Consultar" (heredada del componente `Button`), pero el texto visible es "Nuevo cliente". Usar el texto visible. Confirmar con diseño.
- **D-9. Nombre completo en una columna.** El Figma muestra un solo campo "Nombre" con el nombre completo (`Tomás Iturralde`). El back tiene `nombre` y `apellido` separados. Propuesta: mostrar `nombre apellido` en una columna. Confirmar orden y si se quiere ordenar por apellido.
- **D-10. Formato del DNI.** El Figma muestra `30.512.468` (con puntos) en la tabla y en el campo de búsqueda. El back guarda y devuelve 8 dígitos. Propuesta: mostrar con puntos y enviar sin puntos (sección 6).
- **D-11. Estados vacío, error y carga.** No diseñados (sección 7).
- **D-12. Opciones de los selects.** Solo se ve "Todos" (y con color de placeholder). Confirmar si "Todos" es una opción real o un placeholder.
- **D-13. Acciones y clic en fila.** No definidos (sección 8).

## 14. Referencia Figma

- Frame principal: `B3 Clientes`, nodo **18:2387**.
  URL: https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2387
- Nodos clave:
  - Panel shell: 18:2389
  - Sidebar: 18:2390
  - Columna principal: 18:2465
  - Topbar: 34:1591 (botón "Nuevo cliente": 34:1605; campo oculto: 34:1594)
  - Filtros: 18:2483
  - Tabla clientes: 18:2505
  - Table/Header: 18:2506
  - Fila 1: 18:2522 (primera fila con datos)
  - Paginación: 18:2721
- Página: `02 Backoffice`.

**Nota sobre assets:** los iconos (campana, lupa, usuario con más, tres puntos, flechas de navegación) son SVG temporales de Figma que expiran en 7 días. Exportarlos al proyecto. Los iconos de navegación son Phosphor Regular (nota de `NavItem`).
