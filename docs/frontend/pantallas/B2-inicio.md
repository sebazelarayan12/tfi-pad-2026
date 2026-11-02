# B2 · Inicio del backoffice

Especificación del tablero de inicio del panel interno. Fuente visual: Figma `B2 Inicio` (nodo 18:236). Fuente de contrato: código del back (`PolizasController`, `PagoFacilController`, `AuthController`, `Dtos/`), `docs/AnalisisBack.md` (§4 reglas, §7 endpoints) y `docs/tareas-divididas.md`.

Convención: "Implementado" = existe en el código actual; "En PR (#N)" = en un PR abierto; "Especificado" = solo en la spec o las tareas. **"Especificado: falta endpoint"** = el dato se muestra en el diseño y no hay endpoint que lo devuelva; el front no puede construir el widget sin mock hasta que el back lo publique (regla FB4).

> Importante: todas las fechas y cifras del Figma son de muestra ("al 28/10/2026", "Mariela", "14 cuotas"). Calcular fechas y totales en tiempo de ejecución. La fecha de hoy la define el servidor (`FechaArgentina.Hoy`, zona `America/Argentina/Buenos_Aires`).

## 1. Propósito y quién la usa

- **Propósito:** resumen del estado de la cartera para el día: saludo, cuatro indicadores, cuotas vencidas recientes, distribución de pólizas por estado, tareas pendientes y un acceso a la rendición de Pago Fácil.
- **Quién la usa:** rol **Empleado** y rol **Administrador**. El diseño muestra la vista de una empleada (Mariela Quiroga, "Empleado"). No hay vista distinta por rol en el Figma. Ver D-3 y D-9.

## 2. Ruta propuesta y guardas de acceso

- **Ruta:** `/inicio` (Propuesta; el diseño no define rutas).
- **Guarda:** requiere sesión válida (token no vencido). Sin sesión: redirigir a `/login` (ver `B1-login.md`, sección 2).
- **Rol:** cualquier rol del panel (`Empleado` o `Administrador`). La política del back para estos datos es `Politicas.Empleado` (incluye a Administrador). Ningún dato de esta pantalla requiere `Politicas.Admin`.
- **Sin permisos (403):** no aplica aquí; ambos roles pueden entrar.

## 3. Estructura visual

Frame de escritorio de 1440 × 1024 px (solo escritorio, ver sección 11). Mismo shell que B3 y B4.

De arriba abajo y de izquierda a derecha, dentro del shell (1392 × 976 px en `left 24 / top 24`, radio 24 px, sombra `Nexa/Shadow/Shell`, sin padding en el shell; el padding vive en cada columna):

1. **Sidebar** (`Sidebar`): columna fija de **232 px**, alto 976 px, fondo `--nexa-surface-sidebar` (`#f5f5f2`), padding 16 px, `gap` 16 px. Contenido de arriba abajo: logo; campo de búsqueda; grupo "Nav main" (7 ítems); divisor; grupo "Nav admin" (2 ítems); espaciador flexible; bloque de usuario al pie.
2. **Columna principal** (`Columna principal`): ancho flexible (859 px en el diseño), padding 32 px, `gap` 24 px. Contenido de arriba abajo:
   - **Topbar**: 795 × 64 px (ancho de contenido), a `y=32`. Título "Inicio", espaciador, campo de búsqueda de 280 px, botón campana de 36 px y botón primario "Nueva cotización" de 40 px. `gap` 16 px.
   - **Saludo** (`Saludo`): a `y=120`, 795 × 58 px, `gap` 4 px. Título H1 de 28 px y línea de resumen de 14 px.
   - **KPIs** (`KPIs`): a `y=202`, 795 × 158 px. Cuatro tarjetas en fila de igual ancho (`flex 1`), `gap` 16 px. Cada tarjeta: 186.75 px de ancho, padding 20 px, radio 16 px, borde `--nexa-border-hairline`, fondo blanco, `gap` 8 px.
   - **Widget "Cuotas vencidas recientes"** (`Widget cuotas vencidas`): a `y=384`, 795 × 361 px, padding 20 px, radio 16 px, borde hairline, `gap` 12 px. Contiene el encabezado de la tarjeta (`Card/Widget`, título + acción "Ver todas") y la tabla (`Tabla cuotas vencidas`, 753 × 285 px, 1 encabezado de 40 px y 5 filas de 49 px).
3. **Divisor del rail** (`Divider rail`): línea vertical de 1 px a `x=1091`.
4. **Rail derecho** (`Rail derecho`): 300 px de ancho, padding 24 px, `gap` 16 px. Contiene, de arriba abajo:
   - **Widget "Pólizas por estado"** (252 px de ancho, 370 px de alto, a `y=24`): título, anillo de 160 × 160 px con total al centro (`390` / `pólizas`), y leyenda de 5 filas (cada una de 18 px de alto con `gap` 8 px).
   - **Widget "Tareas del día"** (252 × 228 px, a `y=410`): título con acción "Ver todas" y tres filas separadas por divisores de 1 px.
   - **Tarjeta promo "Rendición de Pago Fácil"** (252 × 300 px, a `y=654`): fondo `--nexa-accent-promo` (`#f6e7a8`), radio 16 px, padding 16 px. Imagen (220 × 120 px), título, descripción y botón secundario de 32 px.

Medidas clave: título H1 28/34 px SemiBold; títulos de widget 16/22 px SemiBold; cifras de KPI 28/34 px SemiBold; etiquetas 12/16 px Medium; datos de tabla 13/18 px Regular; identificadores y montos en `JetBrains Mono` 13/18 px (Nexa/Mono).

## 4. Componentes del design system y componentes propios

Componentes del Figma (nombres exactos y ids):

| Nombre en Figma | Id | Uso |
|---|---|---|
| `Logo/Nexa` | 14:5 | Marca en el sidebar. |
| `NavItem` | 14:99 | Ítems del sidebar. Estado Active: barra indicadora de 2 px a la izquierda y texto más oscuro. Icono Phosphor Regular. |
| `Button` | 11:42 | "Nueva cotización" (Primary M, 40 px), "Ir a rendición" (Secondary S, 32 px). |
| `Chip` | 11:126 | "Atender hoy" (variante Destacado, lime). Destacado marca "lo que importa del widget". |
| `Card/Widget` | 15:49 | Contenedor de widget: radio 16 px, borde hairline, sin sombra. Título y acción opcional. |
| `Table/Header` | 15:62 | Encabezado de tabla sobre `--nexa-surface-subtle`, radio superior 12 px. Columnas de igual ancho (layoutGrow) según la nota del componente. |
| `Table/Row` | 15:78 | Fila con divisor inferior hairline. Usar `Badge/Estado` para estados y Nexa/Mono para identificadores. |
| `Badge/Estado` | 11:117 | Estado de cuota/póliza. Colores solo por tokens semánticos: Pagada/Validado usan colores "Vigente"; Pendiente CAE usa colores "Suspendida"; Anulada usa colores "Vencida". |
| `NavItem` (sidebar) y `Input`/campo de búsqueda | 11:66 / 14:105 | El campo "Buscar" del sidebar y el de la topbar. |

Componentes propios (no están en el design system; crear en `features/` del dominio o en `packages/ui` si se reutilizan):

- `SaludoInicio` (pantalla): saludo y resumen. Depende de datos del resumen (sección 9).
- `KpiCard` (reutilizable): título, cifra, nota y chip opcional. Usado 4 veces.
- `WidgetCuotasVencidas` (feature `cuotas`): usa `Table` y `Badge/Estado`.
- `DonutPolizasPorEstado` (feature `polizas`): **no usar los arcos del Figma**. Ver nota abajo.
- `WidgetTareasDelDia` (pantalla): lista de tres tareas con acción.
- `PromoRendicion` (feature `pago-facil`): tarjeta promocional.
- `LayoutBackoffice` (`app/`): sidebar y topbar compartidos por B2, B3 y B4.

**Nota sobre el donut:** los cinco arcos del Figma (`Arco Vigente`, `Arco Pendiente`, `Arco Suspendida`, `Arco Cancelada`, `Arco Vencida`) son SVG exportados con la forma fija del ejemplo (80 / 7 / 2 / 4 / 7 %). Los datos son dinámicos, así que el componente debe calcular los segmentos a partir de los conteos (por ejemplo, un SVG con `stroke-dasharray` o un `conic-gradient`). No usar los SVG del Figma como imagen. El centro (cifra total y "pólizas") es texto.

**Nota sobre el sidebar:** es el mismo en B2, B3 y B4. En B2 el ítem activo es "Inicio"; en B3, "Clientes". El ítem activo se marca con el estado `active` del `NavItem`.

## 5. Contenido textual literal

Copiado del Figma. Las cifras y fechas son de muestra y se calculan en runtime (ver el aviso al inicio).

**Topbar**

- Título: `Inicio`
- Campo de búsqueda (placeholder con texto visible): `Buscar cliente o póliza`
- Botón primario: `Nueva cotización`
- Botón campana: sin texto visible (icono `Icon/bell`).

**Saludo**

- Título (H1): `Hola, Mariela`. Ver D-1: el nombre no viene del back hoy.
- Resumen: `Hay 14 cuotas vencidas y 27 pólizas pendientes de pago al 28/10/2026.`

**KPIs**

| Tarjeta | Título | Cifra (muestra) | Nota |
|---|---|---|---|
| 1 | `Pólizas vigentes` | `312` | `80% de las pólizas` |
| 2 | `Pendientes de pago` | `27` | `Con cuota 1 sin pagar` |
| 3 | `Suspendidas` | `9` | `Con 2 cuotas vencidas` |
| 4 | `Cuotas vencidas hoy` | `14` | `Recargo 5% aplicado` + chip `Atender hoy` |

**Widget "Cuotas vencidas recientes"**

- Título: `Cuotas vencidas recientes`
- Acción: `Ver todas` (con icono de flecha)
- Encabezados de tabla: `Cliente`, `Póliza`, `Cuota y vencimiento`, `Importe`, `Estado`
- Ejemplo de fila (muestra): `Tomás Iturralde` · `POL-0000042` · `Cuota 8 de 12 · 10/10/2026` · `$ 18.900,00` · badge `Vencida`

**Widget "Pólizas por estado"**

- Título: `Pólizas por estado`
- Centro del anillo: `390` / `pólizas`
- Leyenda (etiqueta y porcentaje): `Vigente` 80% · `Pendiente` 7% · `Suspendida` 2% · `Cancelada` 4% · `Vencida` 7%

**Widget "Tareas del día"**

- Título: `Tareas del día`
- Acción: `Ver todas`
- Tarea 1: `Procesar rendición Pago Fácil` / `Archivo del día sin procesar`
- Tarea 2: `3 facturas pendientes de CAE` / `Reintentar la emisión en ARCA`
- Tarea 3: `Generar base positiva` / `Cierre de octubre de 2026`

**Tarjeta promo**

- Rótulo de imagen de muestra: `Foto: cupón de Pago Fácil` (anotación, no renderizar).
- Título: `Rendición de Pago Fácil disponible`
- Descripción: `Subí el archivo .txt del día para registrar los pagos en efectivo.`
- Botón: `Ir a rendición`

**Sidebar**

- Búsqueda: `Buscar`
- Nav main: `Inicio`, `Clientes`, `Vehículos`, `Cotizaciones`, `Pólizas`, `Pagos y facturas`, `Pago Fácil`
- Nav admin: `Planes`, `Usuarios`
- Usuario: iniciales `MQ`, nombre `Mariela Quiroga`, rol `Empleado` (ver D-1 y D-9).

Textos NO DEFINIDOS en el Figma:

- Estados vacíos, cargando y error de cada widget.
- Texto de la campana (notificaciones).
- Texto de la fila de tarea cuando no hay tareas.
- Texto del botón de menú del usuario (tres puntos).
- Títulos de página para las rutas que no están en este Figma (Vehículos, Cotizaciones, Pagos y facturas, Pago Fácil, Planes, Usuarios).

## 6. Campos y validaciones

B2 no tiene formularios. Tiene un campo de búsqueda en la topbar y otro en el sidebar, que no tienen regla definida:

| Campo | Tipo | Regla | Estado |
|---|---|---|---|
| Buscar cliente o póliza (topbar) | texto libre | **NO DEFINIDO.** El back tiene búsqueda de clientes por DNI o apellido (`GET /api/clientes`, especificado) y filtro de pólizas por `clienteId`, `patente` y `estado` (`GET /api/polizas`, implementado). No hay búsqueda por número de póliza. | Propuesta: si tiene 8 dígitos o formato DNI (`30.512.468`), buscar cliente por DNI; si no, por apellido. Ver D-6. |
| Buscar (sidebar) | texto libre | **NO DEFINIDO.** Mismo problema que el de la topbar. El Figma muestra dos campos de búsqueda; no se sabe si hacen lo mismo. | Ver D-6. |

## 7. Estados

Cada widget tiene su propio ciclo. La pantalla no tiene estado global de carga en el diseño.

| Estado | Qué se muestra | Estado en el Figma |
|---|---|---|
| Cargando (cada widget) | Esqueleto del widget (cifra y filas vacías con el mismo alto) para no mover el layout. | NO DEFINIDO. Propuesta. |
| Vacío — cuotas vencidas | Mensaje dentro de la tarjeta. | NO DEFINIDO. |
| Vacío — tareas del día | Mensaje "No hay tareas pendientes para hoy." | NO DEFINIDO. Propuesta. |
| Vacío — pólizas por estado (sin pólizas) | Anillo vacío con `0` / `pólizas`; leyenda con 0 %. | NO DEFINIDO. Propuesta. |
| Error (cualquier widget) | Mensaje dentro del widget con reintentar. El resto de la pantalla sigue visible: un widget caído no tumba la página (Propuesta). | NO DEFINIDO. |
| Sin permiso / sesión vencida (401) | Redirigir a `/login` (ver `B1-login.md`). | Propuesta. |
| Éxito | Estado normal con datos. | Diseñado. |
| Chip "Atender hoy" | Lime (Destacado). Sin estado de interacción definido. | Diseñado (solo el estado mostrado). |
| Foco y hover en filas y acciones | No definidos. | NO DEFINIDO. |

## 8. Acciones y navegación

| Elemento | Acción | Destino |
|---|---|---|
| Nav "Inicio" | Ítem activo. | `/inicio` |
| Nav "Clientes" | Navega. | `/clientes` (B3) |
| Nav "Vehículos", "Cotizaciones", "Pólizas", "Pagos y facturas", "Pago Fácil", "Planes", "Usuarios" | Navega. | **NO DEFINIDO**: no hay pantallas en este Figma para estas rutas. |
| Botón "Nueva cotización" | Abre el alta de cotización. | **NO DEFINIDO**: no hay pantalla de cotización en el Figma. El back tiene `POST /api/cotizaciones` (implementado). Ver D-5. |
| Campana | Muestra notificaciones. | **NO DEFINIDO** (no hay endpoint de notificaciones). |
| "Ver todas" (cuotas vencidas) | Lista completa de cuotas vencidas. | **NO DEFINIDO** (no hay pantalla de cuotas en el Figma). |
| Fila de cuota vencida | Abre la póliza de la cuota. | **NO DEFINIDO**. Propuesta: `/polizas/{id}` (pantalla no diseñada). |
| "Ver todas" (tareas del día) | Lista de tareas. | **NO DEFINIDO**. |
| Tarea "Procesar rendición Pago Fácil" (icono flecha) | Abre la pantalla de rendición. | Propuesta: `/pago-facil/rendiciones` (no diseñada en este Figma). |
| Tarea "3 facturas pendientes de CAE" (icono flecha) | Reintenta la emisión. | **NO DEFINIDO**. No hay pantalla ni acción. |
| Tarea "Generar base positiva" (icono flecha) | Abre la generación de base positiva. | Propuesta: `/pago-facil/base-positiva` (no diseñada). |
| Botón "Ir a rendición" (promo) | Abre la rendición. | Propuesta: `/pago-facil/rendiciones`. |
| Menú de usuario (tres puntos) | Abre opciones de cuenta. | **NO DEFINIDO**. Ver D-7. |

## 9. Datos: endpoints y origen de cada dato

Estado de los endpoints según el código y la spec. Responses paginadas usan `PaginaResponse<T>` (`{ items, pagina, tamanoPagina, total }`, `backend/Aseguradora.Application/Comun/PaginaResponse.cs`).

| Dato en pantalla | Endpoint | Estado | Campo / cálculo |
|---|---|---|---|
| Nombre del saludo y del usuario ("Mariela", "Mariela Quiroga") | No existe | **Especificado: falta endpoint.** El login devuelve `token`, `rol` y `expiraEn` (`LoginResponse`). El JWT trae `sub`, `email` y `role`, no nombre. `Identity` sí guarda `Nombre` y `Apellido` (`CrearUsuarioRequest`). | Propuesta: `GET /api/auth/yo` → `{ id, email, nombre, apellido, rol }` con `Politicas.Empleado`. Alternativa: agregar `nombre` como claim en `JwtTokenService`. |
| Iniciales "MQ" y rol "Empleado" en el sidebar | Igual que el anterior | Especificado: falta endpoint | Iniciales = primera letra de nombre y apellido. Rol: `rol` del login. |
| Pólizas vigentes: `312` | `GET /api/polizas?estado=Vigente&pagina=1&tamano=1` | **Implementado.** Usar `total`. | `total`. |
| Pólizas vigentes: "80% de las pólizas" | Dos llamadas más: `GET /api/polizas?pagina=1&tamano=1` (sin filtro) | Implementado | `vigentes / totalGeneral`, redondeado a entero. |
| Pendientes de pago: `27` | `GET /api/polizas?estado=Pendiente&pagina=1&tamano=1` | Implementado | `total`. Inferencia a confirmar: el estado `Pendiente` de póliza corresponde a "Con cuota 1 sin pagar". Ver D-8. |
| Suspendidas: `9` | `GET /api/polizas?estado=Suspendida&pagina=1&tamano=1` | Implementado | `total`. Suspendidas = dos cuotas vencidas (RN09). |
| Cuotas vencidas hoy: `14` | No existe | **Especificado: falta endpoint.** La spec solo tiene `GET /api/polizas/{id}/cuotas` (por póliza). | Propuesta: `GET /api/cuotas?estado=Vencida&pagina=&tamano=` que devuelva `total` y la lista. Ver D-8. |
| Recargo 5% aplicado | Mismo que la anterior | Especificado: falta endpoint | Propuesta: el resumen incluye `porcentajeRecargo` (RN08: 5 %). El texto "aplicado" es de muestra. |
| Tabla "Cuotas vencidas recientes" (5 filas): `Cliente`, `Póliza`, `Cuota y vencimiento`, `Importe`, `Estado` | No existe | **Especificado: falta endpoint.** Propuesta: `GET /api/cuotas?estado=Vencida&pagina=1&tamano=5&orden=fechaVencimiento` con por fila: `cuotaId`, `polizaId`, `numeroPoliza`, `clienteNombre`, `clienteApellido`, `numeroCuota`, `cantidadCuotas`, `fechaVencimiento`, `importe`, `recargo`, `estado`. | Ver D-8. |
| Pólizas por estado (anillo y leyenda) | Cinco llamadas `GET /api/polizas?estado=X&pagina=1&tamano=1` (estados: Vigente, Pendiente, Suspendida, Cancelada, Vencida) | Implementado | `total` por estado; total general = suma de los cinco (debe coincidir con el "390" del centro). Porcentaje = `total_estado / total_general`. Alternativa preferible: un endpoint de resumen que devuelva los cinco conteos en una llamada. |
| Total "390" en el centro | Igual que el anterior | Implementado (suma) | Suma de los cinco totales. |
| Tareas del día (tres filas) | No existe | **Especificado: falta endpoint.** Las tareas no están en la spec. | Propuesta: `GET /api/tareas/hoy` con `tipo`, `titulo`, `subtitulo`, `destino`. Ver D-8. |
| Cantidad de "facturas pendientes de CAE" | No existe | Especificado: falta endpoint (ARCA es frente 4, `IArcaService`) | Propuesta: incluir en el resumen de tareas. |
| Promo "Rendición de Pago Fácil disponible" (cuándo mostrarla) | No existe | **Especificado: falta endpoint.** Las rendiciones están en `GET /api/pagofacil/rendiciones` (historial, implementado) pero no hay "pendiente de hoy". | Propuesta: mostrar la promo si el historial no tiene una rendición con `fechaRendicion` = hoy. Ver D-8. |
| Historial de rendiciones (para la promo) | `GET /api/pagofacil/rendiciones` | Implementado (`PagoFacilController.cs`, `HistorialRendicionResponse`) | `fechaRendicion`, `nombreArchivo`, `pagosAprobados`. |
| Fecha de corte del resumen ("al 28/10/2026") | No existe | Especificado: falta endpoint | Propuesta: `fecha` en el resumen. No usar la fecha del navegador. |

Formato de datos (FB4): importes en pesos con el formateador de `@nexa/ui` o `@nexa/api` (`$ 18.900,00`, separador de miles con punto y decimales con coma). Fechas en `dd/mm/aaaa`. Nadie formatea a mano.

**Enums en la respuesta:** `Program.cs` solo llama `AddControllers()` y el API no tiene `JsonStringEnumConverter`, así que `estado` de `PolizaListItemResponse` y de `CuotaResponse` llega como **número**, no como texto. Orden de `EstadoPoliza`: `Pendiente`=0, `Vigente`=1, `Suspendida`=2, `Cancelada`=3, `Vencida`=4. Orden de `EstadoCuota`: `Pendiente`=0, `Vencida`=1, `Pagada`=2, `Anulada`=3. El filtro `?estado=Vigente` por nombre sí funciona (hay test con ese valor en `PolizasControllerTests`). Confirmar con una respuesta real. Si el equipo prefiere texto en las respuestas, pedir `JsonStringEnumConverter` al back (es un cambio de contrato y requiere decisión).

## 10. Reglas de negocio visibles

- **RN08.** Recargo del 5 % por cuota vencida. Se muestra en la KPI "Cuotas vencidas hoy" ("Recargo 5% aplicado").
- **RN09.** Con dos cuotas vencidas impagas, la póliza pasa a Suspendida. El KPI "Suspendidas" y su nota "Con 2 cuotas vencidas" dependen de esa regla.
- **Estados de póliza.** Los estados `Vigente`, `Pendiente`, `Suspendida`, `Cancelada` y `Vencida` coinciden con `EstadoPoliza` (`backend/Aseguradora.Domain/Enums/EstadoPoliza.cs`). El anillo debe mostrar exactamente esos cinco.
- **RN18.** Cada archivo de rendición de Pago Fácil se procesa una sola vez. La promo de rendición debe ocultarse cuando ya se procesó el archivo del día (propuesta; ver sección 9).
- **Estados de cuota** (`EstadoCuota`): `Pendiente`, `Vencida`, `Pagada`, `Anulada`. La tabla muestra solo `Vencida`. El estado `Vencida` se calcula con el job diario (`VencimientosJob`, US-F3-05). Hasta que corra, la cuota puede seguir como `Pendiente` (decisión pendiente de la tarea de estado de cuotas vencidas, `docs/tareas-divididas.md` línea ~2110).

## 11. Responsive

- El Figma solo tiene frame de escritorio (1440 px). **No hay frame mobile del backoffice.** Esta pantalla es solo escritorio según el diseño.
- Propuesta por debajo de 1280 px (no diseñado): el rail derecho pasa debajo de la columna principal, en una sola columna.
- Propuesta por debajo de 1024 px: el sidebar se colapsa a iconos (sin texto) o pasa a un menú desplegable. No diseñado.
- La tabla de cuotas no debe romper el layout: scroll horizontal dentro del contenedor de la tabla (no de la página).

## 12. Accesibilidad

- El sidebar es una `<nav>` con `aria-label="Principal"`. El ítem activo lleva `aria-current="page"`.
- Los KPI son texto. Cada tarjeta puede ser un `<section>` con su título como encabezado; la cifra no debe leerse sin su título.
- La tabla de cuotas es una `<table>` real con `<th scope="col">` y `<caption>` (puede ser visualmente oculto: "Cuotas vencidas recientes").
- El estado del badge se lee como texto ("Vencida"), no solo por color. Los colores cumplen el contraste de texto sobre el fondo del badge (verificar).
- El anillo del donut es decorativo si la leyenda da los mismos datos: `aria-hidden="true"` sobre el SVG y la leyenda como lista (`<ul>`) con porcentaje y cifra.
- Icono de flecha en las tareas: `aria-hidden="true"`; el enlace tiene el título de la tarea como texto accesible.
- La campana necesita `aria-label` ("Notificaciones") porque no tiene texto.
- El chip "Atender hoy" no es interactivo: texto simple.
- Foco visible en todos los controles (nav, botones, filas de tabla con enlace).

## 13. Dudas e inconsistencias Figma ↔ back

- **D-1. Nombre del usuario.** El saludo, el avatar y el sidebar necesitan nombre y apellido. El login no los devuelve y el JWT no los incluye. Propuesta: endpoint `GET /api/auth/yo` o claim de nombre en el token. Decisión del back y del equipo.
- **D-2. Cifras de la tabla "Cuotas vencidas hoy" (14) vs fechas de las filas.** La KPI dice "vencidas hoy", pero las filas muestran vencimientos del 10/10/2026 y del 10/09/2026, no del día de hoy. Hay dos lecturas: "estado Vencida" (cualquier fecha) o "vence hoy". Confirmar cuál es. Propuesta: el texto dice "Cuotas vencidas" y cuenta el estado `Vencida`.
- **D-3. Ítems de admin para Empleado.** La sidebar muestra "Planes" y "Usuarios" en "Nav admin" a un usuario con rol Empleado. En el back, `POST/PUT/DELETE /api/planes` y `POST /api/auth/usuarios` son solo Administrador (`Politicas.Admin`). Confirmar si el Empleado ve esos ítems (y entonces el backend tiene que permitir algo más) o si no deben aparecer.
- **D-4. Cuotas vencidas: sin endpoint de listado global.** La tabla y la KPI necesitan un listado de cuotas por estado. La spec solo define `GET /api/polizas/{id}/cuotas`. Sin endpoint nuevo, el widget no se puede construir.
- **D-5. "Nueva cotización".** El botón primario lleva a un flujo que no está en este Figma. Confirmar si es un atajo a `/cotizaciones/nueva` (pantalla que no se diseñó).
- **D-6. Búsqueda en topbar y sidebar.** Dos campos "Buscar" sin definición de alcance ni de destino. ¿Buscan clientes, pólizas o ambos? Sin endpoint de búsqueda por número de póliza.
- **D-7. Menú de usuario.** Tres puntos sin opciones. Sin "Cerrar sesión" en el Figma (ver también `B1-login.md`, D-5).
- **D-8. Widgets sin endpoint.** Faltan endpoints para: nombre del usuario (D-1), cuotas vencidas (listado y conteo), tareas del día, y "promo de rendición pendiente". Propuesta general: un único `GET /api/inicio/resumen` que devuelva todo lo que necesita B2 en una llamada (conteos de pólizas por estado, cuotas vencidas con importe y recargo, tareas, promo, fecha de corte). Es más fácil de mantener que cinco llamadas. Requiere cambio en la spec y decisión del back.
- **D-9. Vista por rol.** Un único diseño con rol Empleado. ¿El Administrador ve lo mismo? Confirmar.
- **D-10. Colores del donut vs la tabla.** En la leyenda, "Vencida" tiene el swatch gris (`--nexa-status-vencida-text`, `#5c6066`). En la tabla, el badge "Vencida" usa colores rojos (`--nexa-status-cancelada-*`, `#b03a2e`). El mismo estado aparece con dos colores distintos, y "Cancelada" es el rojo. Confirmar qué color es el de "Vencida" y si el badge de cuota usa el mismo token de póliza.
- **D-11. Tareas del día.** No hay lista de tareas en la spec. Confirmar el origen de cada fila (una "tarea" es un trabajo pendiente del día, o un recordatorio fijo). Los subtítulos ("Cierre de octubre de 2026", "Archivo del día sin procesar") pueden ser dinámicos o fijos: no definido.
- **D-12. Promo de rendición.** ¿Cuándo se muestra? Propuesta: solo si no hay una rendición con la fecha de hoy. Confirmar.
- **D-13. Imagen de la promo.** El frame `IMG cupón Pago Fácil 220x120` no trae imagen (solo el rótulo "Foto: cupón de Pago Fácil"). Pedir el asset al diseño. No inventar.
- **D-14. Cálculo de "80%".** Confirmar que es vigentes / total de todas las pólizas (390). La cifra 390 cuadra con la suma de los cinco estados: 312 + 27 + 9 + 15 + 27 = 390 (Cancelada = 15 da el 4 %). Esto se valida con los datos reales.
- **D-15. Sidebar: "Vehículos", "Cotizaciones", "Pagos y facturas", "Pago Fácil".** Están en la navegación principal y no tienen pantalla en este Figma. Confirmar si se diseñan (B5 en adelante) o si hoy llevan a una pantalla vacía.

## 14. Referencia Figma

- Frame principal: `B2 Inicio`, nodo **18:236**.
  URL: https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-236
- Nodos clave:
  - Sidebar: 18:239
  - Columna principal: 18:306
  - Topbar: 18:309
  - Saludo: 18:321
  - KPIs: 18:324 (tarjetas 18:325, 18:329, 18:333, 18:337)
  - Widget cuotas vencidas: 18:376 (tabla 18:386)
  - Divider rail: 18:307
  - Rail derecho: 18:308
  - Widget pólizas por estado: 18:645 (donut 18:655, leyenda 18:664)
  - Widget tareas del día: 18:685
  - Tarjeta promo: 18:715
- Página: `02 Backoffice`.

**Nota sobre assets:** los iconos del sidebar, la campana, las flechas, los tres puntos y los arcos del donut vienen como SVG temporales de Figma (`figma.com/api/mcp/asset/...`) que expiran en 7 días. Los arcos del donut no se usan como assets (ver sección 4). Los iconos de navegación son Phosphor Regular (nota del componente `NavItem`): usar el set Phosphor del design system.
