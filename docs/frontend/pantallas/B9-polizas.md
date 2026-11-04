# B9 · Pólizas (listado)

Pantalla de backoffice (desktop 1440 px) para listar, filtrar y paginar las pólizas (CU11, RN10).

Referencia Figma: frame `B9 Pólizas`, nodo `23:2016`, página `02 Backoffice`.
URL: https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=23-2016

Convenciones: `Implementado` = existe en `development`. `Especificado` = solo en spec o tareas. `NO DEFINIDO` = ni el Figma ni el back lo definen (ver sección 13).

---

## 1. Propósito y quién la usa

- **Propósito:** ver el listado de pólizas, filtrar por estado, buscar por número, DNI o patente y entrar al detalle de una póliza (B10) o emitir una nueva (B8).
- **Rol:** Empleado (Mariela Quiroga en el Figma). El Administrador también, por la política `Politicas.Empleado` (`backend/Aseguradora.Api/Security/AuthenticationExtensions.cs:65`).

## 2. Ruta propuesta y guardas de acceso

- **Ruta propuesta (no está en el Figma):** `/polizas`.
- Mismas guardas que B8: JWT válido (401 → login), rol `Empleado` o `Administrador` (403 → acceso denegado; texto `NO DEFINIDO`).
- Los filtros se guardan en la URL como query (`?estado=&patente=&planCodigo=&pagina=&tamano=`), para que el listado se pueda recargar o compartir. Propuesta; el Figma no lo define.

## 3. Estructura visual (de arriba a abajo)

Panel shell de **1392 × 976** en `left 24, top 24` dentro de un lienzo de 1440 × 1024, radio 24, misma sombra que B8. Sidebar de 232 px (mismo que B8, con `Pólizas` activo). Columna principal con padding 24/32 y gap 24:

1. **Topbar** (alto 64, `justify-between`): título `Pólizas` (H2 20/26 semibold) a la izquierda y botón primario `Emitir póliza` a la derecha (alto 40, pill, icono `shield-check`).
2. **Filtros** (gap 12):
   - **Chips de estado** (fila, gap 8, alto 28): seis chips.
   - **Búsqueda y plan** (fila, gap 12): campo de búsqueda con flex 1 (mínimo 0) y select de plan de **200 px** a la derecha. Cada uno con etiqueta arriba y helper debajo.
3. **Tabla de pólizas** (borde hairline, radio 12, fondo blanco):
   - Encabezado (alto 40, fondo `surface-subtle`).
   - Filas (alto 48, divisor de 1 px entre filas).
   - Columnas, con ancho fijo del Figma: Número 124, Cliente 176, Vehículo 210, Plan 76, Vigencia 212, Estado 124, Próx. vencimiento 132, menú 40.
4. **Paginación** (alto 32, `justify-between`): texto de rango a la izquierda y botones `Anterior` / `Siguiente` (secundarios, alto 32) a la derecha.

Sin rail derecho en esta pantalla. El ancho de la columna principal queda en el resto del panel (1392 − 232 = 1160 px menos padding).

## 4. Componentes del design system y componentes propios

Del design system (nombres del Figma):

- `Logo/Nexa` (nodo 14:5), `NavItem` (nodo 14:99), `Icon/*`.
- `Button` (nodo 11:42): primario `Emitir póliza` (tamaño M, alto 40) y secundarios `Anterior` / `Siguiente` (tamaño S, alto 32).
- `Chip` (nodo 11:126): chips de estado (`Seleccionado` para `Todas 390`; `Sin seleccionar` para el resto) y chips de plan dentro de la tabla (`Neutro`, fondo `surface-subtle`).
- `Input` (nodo 11:66): búsqueda (`Buscar por número, DNI o patente`).
- `Select` (nodo 11:95): plan.
- `Badge/Estado` (nodo 11:117): estado de cada póliza en la columna `Estado`.

Componentes propios (a crear en `features/polizas/components`):

- `PolizasFiltros`: chips de estado, búsqueda y select de plan.
- `PolizasTabla`: tabla con su encabezado, filas y menú de acciones por fila.
- `PolizaVehiculoCelda`: celda con marca, modelo y año arriba y patente en mono debajo (ver D6 sobre de dónde sale).
- `PaginacionPolizas`: rango y botones.

## 5. Contenido textual literal

| Elemento | Texto |
|---|---|
| Título | `Pólizas` |
| Botón | `Emitir póliza` |
| Chip 1 (seleccionado) | `Todas 390` |
| Chip 2 | `Pendiente 27` |
| Chip 3 | `Vigente 312` |
| Chip 4 | `Suspendida 9` |
| Chip 5 | `Cancelada 15` |
| Chip 6 | `Vencida 27` |
| Etiqueta búsqueda | `Buscar por número, DNI o patente` |
| Placeholder búsqueda | `Ej. POL-0000042` |
| Helper búsqueda | `Número de póliza, DNI del titular o patente.` |
| Etiqueta select | `Plan` |
| Valor select (por defecto) | `Todos los planes` |
| Helper select | `Filtra por tipo de cobertura.` |
| Encabezados de tabla | `Número`, `Cliente`, `Vehículo`, `Plan`, `Vigencia`, `Estado`, `Próx. vencimiento` |
| Valor de "sin próximo vencimiento" | `No aplica` |
| Rango de paginación | `1-10 de 390` |
| Botón anterior | `Anterior` |
| Botón siguiente | `Siguiente` |

Datos de ejemplo del diseño (no son textos fijos, son los datos que el Figma muestra; vienen de la API):

| Número | Cliente | Vehículo | Plan | Vigencia | Estado | Próx. vencimiento |
|---|---|---|---|---|---|---|
| POL-0000035 | Ezequiel Robles | Ford Ranger 2017 / AE345PQ | TR | 27/10/2025 a 27/10/2026 | Vencida | No aplica |
| POL-0000036 | Agustina Paz | Volkswagen Amarok 2020 / AC789KL | TR | 01/12/2026 a 01/12/2027 | Pendiente | 10/12/2026 |
| POL-0000039 | Rocío Medina | Fiat Cronos 2021 / AE456FG | RC | 10/04/2026 a 10/04/2027 | Suspendida | 10/09/2026 |
| POL-0000040 | Lucía Benítez | Peugeot 208 2022 / AF678RS | TC | 01/09/2026 a 01/09/2027 | Cancelada | No aplica |
| POL-0000041 | Agustina Paz | Chevrolet Onix 2018 / AD012MN | TC | 01/01/2026 a 01/01/2027 | Vigente | 10/11/2026 |
| POL-0000042 | Tomás Iturralde | Toyota Etios 2019 / AB123CD | TC | 01/03/2026 a 01/03/2027 | Vigente | 10/11/2026 |
| POL-0000043 | Lucía Benítez | Renault Kwid 2023 / AG901TU | RC | 15/05/2026 a 15/05/2027 | Vigente | 10/11/2026 |
| POL-0000044 | Tomás Iturralde | Honda CB 190R 2021 / A123BCD | RC | 01/07/2026 a 01/07/2027 | Vigente | 10/11/2026 |
| POL-0000045 | Facundo Gallardo | Hyundai HB20 2019 / AH234XY | TR | 01/02/2026 a 01/02/2027 | Vigente | 10/11/2026 |
| POL-0000046 | Rocío Medina | Volkswagen Gol Trend 2016 / AA567BC | RC | 01/04/2026 a 01/10/2026 | Vencida | No aplica |

Nota: en el Figma, `Vehículo` tiene dos líneas (marca, modelo y año arriba; patente en mono abajo). El texto de la línea superior es un dato de ejemplo.

Textos que el Figma no define: título de la tabla vacía, mensaje de error de carga, texto del menú de cada fila (`⋯`), texto del botón de fila para ver detalle, aria-labels. `NO DEFINIDO`.

## 6. Campos y validaciones

**Búsqueda** (`Buscar por número, DNI o patente`):

| Aspecto | Regla |
|---|---|
| Tipo | Texto libre, una línea. |
| Obligatorio | No. |
| Recorte | Quitar espacios al inicio y al final antes de enviar. |
| Mapeo al back | Solo `patente` (`PolizaFiltro.Patente`: sin distinguir mayúsculas ni espacios). **No hay parámetro para número de póliza ni para DNI.** Ver D2. |
| Longitud máxima | No definida en el back ni en el Figma: `NO DEFINIDO`. |

**Select `Plan`:**

| Aspecto | Regla |
|---|---|
| Opciones | Lista de `GET /api/planes` (Implementado, público; `PlanResponse.Codigo`, `Nombre`). |
| Valor por defecto | `Todos los planes` (sin filtro). |
| Mapeo al back | **Ningún parámetro de `PolizaFiltro` filtra por plan.** Ver D3. |

**Chips de estado:**

| Chip | Valor enviado |
|---|---|
| `Todas` | sin filtro de estado |
| `Pendiente` | `Estado=Pendiente` (o su número, ver D7) |
| `Vigente` | `Estado=Vigente` |
| `Suspendida` | `Estado=Suspendida` |
| `Cancelada` | `Estado=Cancelada` |
| `Vencida` | `Estado=Vencida` |

Los números de los chips (`390`, `27`, etc.) son conteos. El back no los devuelve (ver D4).

**Paginación:**

| Parámetro | Regla |
|---|---|
| `pagina` | Entero, mínimo 1, máximo `PolizaFiltro.PaginaMaxima` (`int.MaxValue / 100`). Cambiar cualquier filtro vuelve a `pagina = 1`. |
| `tamano` | Entero entre 1 y 100 (`TamanoMaximo`). Por defecto 20. El Figma muestra 10 filas: enviar `tamano=10` (ver D5). |

Coherencia con el back: `PolizaFiltro` valida rangos con `[Range]`. Enviar valores fuera de rango devuelve 400 con `ProblemDetails`.

## 7. Estados

| Estado | Qué se muestra |
|---|---|
| Cargando | Skeleton de la tabla con 10 filas y la paginación desactivada. Texto: `NO DEFINIDO`. |
| Vacío (sin resultados) | Mensaje dentro de la tabla. Texto: `NO DEFINIDO`. Propuesta: `No hay pólizas que coincidan con los filtros.` (no definido por el Figma). |
| Vacío (sin pólizas en el sistema) | Mismo mensaje o ilustración: `NO DEFINIDO`. |
| Error de carga (5xx, 502, 503) | Mensaje de error dentro de la tabla con botón `Reintentar`. Texto: `NO DEFINIDO`. |
| Error de filtro (400) | Se mantiene la tabla anterior y se muestra el mensaje del back (`ProblemDetails.detail`). |
| Éxito (datos cargados) | Tabla con datos, rango de paginación y chips con su conteo (ver D4). |
| Seleccionado (chip de estado) | Fondo `action-primary` con texto `on-primary` (Chip `Seleccionado`). Único activo a la vez. |
| Deshabilitado | `Anterior` en la primera página. `Siguiente` en la última. |
| Foco | Anillo de foco visible en chips, campo, select, filas con menú y botones. Estado de foco del Figma: `NO DEFINIDO`. |

## 8. Acciones y navegación

| Acción | Destino | Regla |
|---|---|---|
| `Emitir póliza` | B8, `/polizas/nueva` (propuesta; ver B8 §2) | Siempre habilitado. |
| Chip de estado | Recarga la tabla con `estado` y `pagina = 1` | Selección única. |
| Campo de búsqueda | Recarga con `patente` (ver D2). Debounce de 300 ms (propuesta). | Se dispara al escribir o al presionar Enter. Definir cuál: `NO DEFINIDO`. |
| Select de plan | Recarga con el plan (ver D3) | Sin efecto real hasta resolver D3. |
| `Anterior` / `Siguiente` | Cambia `pagina` | Ver estados. |
| Fila (clic en la fila) | B10, `/polizas/:id` (propuesta) | El Figma no lo define: `NO DEFINIDO`. |
| Menú `⋯` de la fila | Contenido: `NO DEFINIDO`. Propuesta: `Ver detalle` (B10). | El Figma no define las opciones. |

Acciones por estado de la póliza en la fila: el listado no ejecuta acciones; cada una se resuelve en B10 (ver B10 §8). Solo el menú `⋯` depende del estado (`NO DEFINIDO`).

## 9. Datos: endpoints y origen de cada campo

Endpoints:

| Método y ruta | Estado | Uso |
|---|---|---|
| `GET /api/polizas` | Implementado | Listado paginado. Query: `estado`, `clienteId`, `patente`, `pagina`, `tamano`. Devuelve `PaginaResponse<PolizaListItemResponse>` con `Items`, `Pagina`, `TamanoPagina`, `Total`. |
| `GET /api/planes` | Implementado | Opciones del select `Plan`. |
| `GET /api/clientes/{id}` | Especificado (US-F1-06) | Nombre del cliente de cada fila, si no viene del listado. Ver D1. |
| `GET /api/clientes?dni=` | Especificado (US-F1-06; `docs/AnalisisBack.md` §7 lista filtros `dni` y `apellido`) | Resolver un DNI a `clienteId` para el buscador. Ver D2. |
| `GET /api/vehiculos/{id}` | Implementado | Marca, modelo y año de cada vehículo, si la lista no los trae. Ver D6. |

Mapeo columna por columna (DTO `PolizaListItemResponse`: `Id`, `Numero`, `ClienteId`, `Patente`, `CodigoPlan`, `PrimaMensual`, `FechaInicio`, `FechaFin`, `Estado`):

| Columna | Campo | Origen | Estado |
|---|---|---|---|
| Número | `Numero` | Lista | Implementado |
| Cliente | Nombre de `ClienteId` | Clientes | Especificado (D1) |
| Vehículo (línea 1) | Marca, modelo y año | Vehículos | `PolizaListItemResponse` no trae marca, modelo ni año (D6) |
| Vehículo (línea 2) | `Patente` | Lista | Implementado |
| Plan | `CodigoPlan` | Lista | Implementado |
| Vigencia | `FechaInicio` a `FechaFin` (formato `dd/MM/yyyy a dd/MM/yyyy`) | Lista | Implementado |
| Estado | `Estado` (badge) | Lista | Implementado (D7 sobre el formato del enum) |
| Próx. vencimiento | Fecha de la próxima cuota impaga | No hay campo | `NO DEFINIDO` (D5) |
| Menú | — | — | `NO DEFINIDO` |

Chips de estado con conteo: `NO DEFINIDO` (D4).

Paginación: `Total` de `PaginaResponse` da `1-10 de 390` (`(Pagina - 1) * TamanoPagina + 1` a `min(Pagina * TamanoPagina, Total)`).

Orden: el back lista "de más nuevo a más viejo" (`PolizasController.cs:34`, doc del endpoint). El Figma no muestra un orden seleccionado: el front no ofrece ordenamiento por columna (`NO DEFINIDO`).

Errores de `GET /api/polizas` (ProblemDetails): 400 (parámetros fuera de rango), 401, 403. Sin 404.

## 10. Reglas de negocio visibles (RN##)

- **RN10.** Solo una póliza Vigente da cobertura. Para el servicio externo "¿tiene seguro vigente?", Pendiente, Suspendida, Cancelada y Vencida responden que no. En el listado, el estado solo se muestra; no cambia la cobertura.
- **RN09.** Con 2 cuotas vencidas impagas la póliza pasa a Suspendida (badge `Suspendida` en el listado).
- **RN13.** Cancelar una póliza anula sus cuotas no pagadas (no aparece en esta pantalla; se ve en B10).
- **RN14.** Al llegar la fecha de fin, la póliza pasa a Vencida (badge `Vencida`).
- **RN19.** Póliza Pendiente con cuota 1 vencida sin pagar pasa a Cancelada (badge `Cancelada`).

## 11. Responsive

Solo desktop. Sin frame mobile en el Figma. Propuesta:

- Menos de 1024 px: la tabla pasa a scroll horizontal dentro de su contenedor; los filtros se apilan (chips con scroll horizontal y campo y select en columna).
- La paginación queda fija al final de la columna.

## 12. Accesibilidad

- Tabla con `<table>`, `<th scope="col">` y `<caption>` visualmente oculto (`Pólizas`).
- Chips de estado: `role="radiogroup"` con etiqueta `Estado de la póliza`; cada chip con `role="radio"` y `aria-checked`. Texto del grupo: `NO DEFINIDO`.
- Badges: el estado va como texto, no solo por color.
- Montos: mono y alineados a la derecha (si se muestran, ver D6).
- Número de póliza en mono (`POL-0000035`) con `lang` neutro.
- Paginación: `aria-label="Paginación"` en el contenedor; botones `Anterior` y `Siguiente` con `aria-disabled` en los extremos.
- Búsqueda: etiqueta visible (`Buscar por número, DNI o patente`), no placeholder como etiqueta.
- Carga: región `aria-live="polite"` que anuncie `Cargando pólizas` o el total encontrado (texto propio: `NO DEFINIDO`).
- Filas clicables: el elemento clicable es un enlace real (`<a>`) en la celda del número, no un `onClick` en la fila.

## 13. Dudas e inconsistencias Figma ↔ back

**D1. Nombre del cliente (crítica).** La lista trae `ClienteId`, no el nombre. El Figma muestra nombres en la columna `Cliente`. Opciones: (a) enriquecer `PolizaListItemResponse` con `NombreCliente`, (b) llamar `GET /api/clientes/{id}` por fila (N+1 sobre 10 filas), (c) un endpoint de lote. Decidir antes de cerrar la tabla. Hoy el endpoint de cliente está `Especificado` (US-F1-06).

**D2. Búsqueda por número y DNI (crítica).** El Figma busca por `número, DNI o patente`. `PolizaFiltro` solo tiene `Patente` (y `ClienteId`). No hay filtro por número de póliza. El DNI requiere resolver primero un `clienteId` con `GET /api/clientes?dni=` (Especificado). Decidir: ampliar el filtro en el back o acotar el texto del campo a lo que existe.

**D3. Filtro por plan (crítica).** El select `Plan` no tiene parámetro en `PolizaFiltro`. Filtrar solo en el front sobre la página actual daría resultados incorrectos. Decidir: agregar `planCodigo` (o `planId`) al back, o quitar el select.

**D4. Conteos de los chips (media).** Los números (`390`, `27`, `312`, `9`, `15`, `27`) no tienen endpoint. `PaginaResponse.Total` solo da el total del filtro activo. Se requieren seis consultas (una por estado) o un endpoint de conteos. Sin definir.

**D5. Próximo vencimiento (media).** Columna sin campo en `PolizaListItemResponse`. Requiere la cuota impaga más cercana por póliza. Opciones: campo nuevo en la lista, o consulta por fila a `GET /api/polizas/{id}/cuotas`. Además, la regla para "No aplica" no está escrita: el Figma lo muestra en `Vencida` y `Cancelada`; ¿y en `Suspendida`? (en el Figma, `Suspendida` muestra `10/09/2026`).

**D6. Marca, modelo y año en la lista (media).** `PolizaListItemResponse` no trae marca, modelo ni año. El Figma muestra `Ford Ranger 2017`. Opciones: agregar campos a la lista o consultar `GET /api/vehiculos/{id}` por fila (la lista no trae `VehiculoId`, así que hoy ni siquiera se puede consultar). Hay que agregar `VehiculoId` o los campos.

**D7. Formato del enum en query y en JSON (media).** Ver B8 D12. Afecta a `estado` en el filtro y al badge.

**D8. Tamaño de página (baja).** El Figma muestra 10 filas; el back usa 20 por defecto. El front envía `tamano=10` explícitamente. Confirmar que 10 es el valor de diseño.

**D9. Menú `⋯` de cada fila (media).** El Figma muestra el ícono pero no las opciones. Sin definir.

**D11. Vacío y error (media).** El Figma no muestra estado vacío, de error ni de carga. Todo lo de la sección 7 marcado como `NO DEFINIDO` debe definirse antes del desarrollo.

**D12. Paleta de `Cancelada` (baja).** El Figma pinta `Vencida` con `status-vencida` (`#eeefec`) y `Cancelada` con `#fbe5e2` / `#b03a2e`. La doc de Badge/Estado asigna a `Anulada` los colores de `Vencida` y no menciona `Cancelada`. Confirmar la paleta de `Cancelada`.

**D13. Fechas de vigencia mostradas.** Las filas de ejemplo tienen fechas de inicio en distintos días del mes (ej. `27/10/2025`). Es coherente con que el inicio sea el día de emisión (`PolizaService.cs:61`).

**D14. Recuento de la paginación (baja).** `1-10 de 390` muestra el rango de la página actual. Si `Total` cambia entre páginas (una póliza se emite en medio), el rango se recalcula en cada carga: normal, pero debe documentarse.

## 14. Referencia Figma

| Elemento | Nodo | URL con node-id |
|---|---|---|
| Frame B9 | `23:2016` | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=23-2016 |
| Panel shell | `23:2018` | …?node-id=23-2018 |
| Columna principal | `23:2090` | …?node-id=23-2090 |
| Topbar | `23:2091` | …?node-id=23-2091 |
| Botón Emitir póliza | `23:2095` | …?node-id=23-2095 |
| Filtros | `23:2099` | …?node-id=23-2099 |
| Chips de estado | `23:2100` | …?node-id=23-2100 |
| Búsqueda y plan | `23:2113` | …?node-id=23-2113 |
| Tabla pólizas | `23:2126` | …?node-id=23-2126 |
| Encabezado de tabla | `23:2127` | …?node-id=23-2127 |
| Fila POL-0000035 | `23:2242` | …?node-id=23-2242 |
| Paginación | `23:2471` | …?node-id=23-2471 |
