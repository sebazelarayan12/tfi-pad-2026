# B8 · Emitir póliza

Pantalla de backoffice (desktop 1440 px) para emitir una póliza **Pendiente** a partir de una cotización vigente (CU10, RN07).

Referencia Figma: frame `B8 Emitir póliza`, nodo `23:1204`, página `02 Backoffice`.
URL: https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=23-1204

Convenciones de este documento: `Implementado` = endpoint existe en `development` (verificado por código y `git branch --contains` del commit `4ba3d4b`). `Especificado` = solo en `docs/AnalisisBack.md` §7 y `docs/tareas-divididas.md`. `NO DEFINIDO` = el Figma o el back no lo definen; ver sección 13.

---

## 1. Propósito y quién la usa

- **Propósito:** confirmar la emisión de una póliza desde una cotización (CU10). Muestra el resumen de la cotización, la vigencia elegida, las cuotas que se van a generar y las validaciones previas, y permite emitir o cancelar la operación.
- **Rol:** Empleado (en el Figma, Mariela Quiroga, rol `Empleado`). El Administrador también puede usarla: la política `Politicas.Empleado` exige rol `Empleado` **o** `Administrador` (`backend/Aseguradora.Api/Security/AuthenticationExtensions.cs:65`).

## 2. Ruta propuesta y guardas de acceso

- **Ruta propuesta (no está en el Figma):** `/polizas/nueva?cotizacionId=:cotizacionId`.
- **Origen esperado:** desde la cotización (`Volver a cotización` apunta a la cotización, ver sección 8). La ruta de la cotización no está definida en el Figma; propuesta `/cotizaciones/:id`.
- **Guardas:**
  - Sin sesión JWT: redirigir a login (respuesta 401).
  - Rol distinto de `Empleado` y `Administrador`: 403, mostrar pantalla de acceso denegado. Texto: `NO DEFINIDO`.
  - `cotizacionId` ausente o inválido (no es GUID): no renderizar la pantalla; mostrar error de ruta. Texto: `NO DEFINIDO`.

## 3. Estructura visual (de arriba a abajo, izquierda a derecha)

Lienzo del frame: 1440 × 1024. Dentro, un panel "Panel shell" de **1392 × 976** en `left 24, top 24`, radio `24`, sombra `0 24 60 rgba(60,70,40,0.10)`, fondo blanco.

Columnas del panel:

| Región | Ancho | Detalle |
|---|---|---|
| Sidebar | 232 px | Fondo `surface-sidebar`, padding 16, gap 16. Logo, buscador, navegación, divisor, navegación admin y pie de usuario. Ítem activo: `Pólizas`. |
| Columna principal | 859 px | Padding 24 vertical y 32 horizontal, gap 20. |
| Divisor | 1 px | Color `border-hairline`, alto 976. |
| Rail derecho | 300 px | Padding 24. Dos bloques: widgets arriba y acciones abajo (`justify-between`). |

Regiones de la columna principal, de arriba a abajo:

1. **Enlace de regreso** `Volver a cotización`: icono flecha izquierda 16 px + texto 13 px, color `action-primary`. Alto ≈ 18 px.
2. **Topbar** (alto 64, separación 16): título `Emitir póliza` (H2 20/26 semibold) y botón campana circular de 36 px a la derecha (borde `border-strong`).
3. **Tarjeta "Cotización"** (ancho completo, padding 24, radio 16, borde hairline, gap 16):
   - Título de sección `Cotización` (16/22 semibold).
   - Fila de 4 columnas iguales (flex 1, gap 24), cada una con etiqueta (11 px, `text-secondary`) y valor (14 px). La columna "Vehículo" agrega la patente en mono 13 px debajo; la columna "Prima mensual" usa el monto en mono 22 px y, debajo, `Válida hasta` en 12 px tertiary.
4. **Sección "Vigencia"** (gap 12): título 16/22 semibold; fila de chips (alto 28, gap 8); campo "Fecha de inicio" de **320 px** de ancho (etiqueta 12 px arriba, campo alto 40, radio 12, borde `border-strong`, icono calendario a la derecha, helper 12 px tertiary debajo).
5. **Sección "Cuotas que se generan"** (gap 12): título 16/22 semibold y tabla con borde hairline y radio 12:
   - Encabezado: fondo `surface-subtle`, alto 40, padding horizontal 16. Columnas Cuota (200), Vencimiento (200), Importe (200), Estado (resto).
   - Filas: alto 49 cada una, separadas por divisor de 1 px.
   - Fila de total: alto 56. Muestra `Total`, `6 cuotas`, `$ 118.800,00` (mono 22).
   - Nota: la tabla no tiene paginación (máximo 12 cuotas por vigencia).

Rail derecho:

6. **Widget "Validaciones"** (tarjeta, padding 20, gap 12, radio 16, borde hairline): título 16/22 semibold y cuatro ítems con icono de check (16 px) y texto 13 px.
7. **Nota de emisión** (fondo `accent-lime-soft`, padding 16, radio 16, icono de advertencia 16 px, texto 13 px).
8. **Acciones** (abajo del rail, gap 8): botón primario `Emitir póliza` a ancho completo (alto 40, pill) y botón secundario `Cancelar` a ancho completo (alto 40, pill).

## 4. Componentes del design system y componentes propios

Del design system (nombres del Figma):

- `Logo/Nexa` (nodo 14:5) en el sidebar.
- `NavItem` (nodo 14:99) para cada ítem del sidebar. Activo `Pólizas` con barra indicadora de 2 px a la izquierda.
- `Input` (nodo 11:66) para `Fecha de inicio`. Figma lo muestra con icono de calendario dentro del campo; ver Dudas sobre si es editable.
- `Chip` (nodo 11:126) para los tres chips de vigencia. Hay una inconsistencia de tipo (ver Dudas).
- `Badge/Estado` (nodo 11:117) para el estado `Pendiente` de cada cuota.
- `Button` (nodo 11:42): primario `Emitir póliza` con icono `icon/shield-check`, secundario `Cancelar`.
- `Icon/*` (arrow-left, bell, calendar-blank, check-circle, warning-circle, shield-check, magnifying-glass, dots-three, etc.).

Componentes propios de la pantalla (a crear en `features/polizas/components`):

- `CotizacionResumen`: tarjeta con 4 columnas (Cliente, Vehículo, Plan, Prima mensual).
- `VigenciaSelector`: grupo de tres chips de selección única (1 mes, 6 meses, 12 meses).
- `CuotasPreview`: tabla de cuotas calculadas en el front (ver sección 6 y Dudas D1 y D2).
- `ValidacionesPanel`: widget de cuatro ítems (ver Dudas D4).
- `EmisionNota`: callout de aviso.
- `AccionesEmision`: botones de emitir y cancelar.

## 5. Contenido textual literal

Copiar tal cual (tildes y puntuación incluidas):

| Elemento | Texto |
|---|---|
| Enlace de regreso | `Cotización` |
| Título | `Emitir póliza` |
| Tarjeta de cotización (título) | `Cotización` |
| Etiqueta | `Cliente` |
| Valor | `Tomás Iturralde` |
| Etiqueta | `Vehículo` |
| Valor | `Volkswagen Gol Trend 2017` |
| Valor (mono) | `AC456FG` |
| Etiqueta | `Plan` |
| Valor | `TC Terceros Completo` |
| Etiqueta | `Prima mensual` |
| Valor (mono 22) | `$ 19.800,00` |
| Helper | `Válida hasta 12/11/2026` |
| Sección | `Vigencia` |
| Chip | `1 mes` |
| Chip | `6 meses` |
| Chip | `12 meses` |
| Etiqueta del campo | `Fecha de inicio` |
| Valor del campo | `01/11/2026` |
| Helper | `La fecha de fin se calcula sola: 01/05/2027.` |
| Sección | `Cuotas que se generan` |
| Encabezados | `Cuota`, `Vencimiento`, `Importe`, `Estado` |
| Filas | `Cuota 1 de 6` … `Cuota 6 de 6` (ver Dudas D1 y D2 para las fechas) |
| Estado de cada fila | `Pendiente` |
| Total | `Total`, `6 cuotas`, `$ 118.800,00` |
| Widget (título) | `Validaciones` |
| Validación 1 | `Cliente validado en Renaper` |
| Validación 2 | `Vehículo validado en DNRPA` |
| Validación 3 | `Sin otra póliza activa para el vehículo` |
| Validación 4 | `Plan compatible con el vehículo` |
| Nota | `La póliza nace Pendiente y pasa a Vigente al pagarse la cuota 1.` |
| Botón primario | `Emitir póliza` |
| Botón secundario | `Cancelar` |

Textos de error que el back devuelve y la UI debe mostrar literal (vienen en `ProblemDetails.detail`, ver sección 9). Son los mensajes de `PolizaService` y `Poliza`, copiados tal cual:

- `La cotización está vencida (RN06).`
- `La cotización ya se usó para emitir una póliza.`
- `El cliente no está validado en Renaper (RN02).`
- `El vehículo no está validado en DNRPA (RN03).`
- `El vehículo no pertenece al cliente de la cotización (RN03).`
- `Otra emisión con la misma cotización o el mismo vehículo se guardó al mismo tiempo (RN04). Recargue los datos.`
- `La cotización no existe` (`La cotización {id} no existe.`, 404).

Mensaje de error de vigencia (solo si llega un valor fuera de rango; con chips no es alcanzable): `La vigencia debe ser de 1, 6 o 12 meses.`

Textos que el Figma no define y el equipo debe decidir (no inventar en código): aria-label de la campana, texto de carga del botón, mensaje de éxito, mensaje de error genérico, título de la pantalla de acceso denegado.

## 6. Campos y validaciones

Campos del formulario de emisión. El único campo que viaja al back es la vigencia; el resto es contexto.

| Campo | Tipo | Obligatorio | Origen y regla | Back |
|---|---|---|---|---|
| `cotizacionId` | GUID | Sí | Viene de la ruta o query (no hay campo visible). | `EmitirPolizaRequest.CotizacionId` |
| `Vigencia` (chips) | Entero | Sí | Selección única entre `1`, `6` o `12` (meses). Figma preselecciona `6 meses` (ver D5). | `EmitirPolizaRequest.VigenciaMeses`, valida `CalculadorCuotas` (RN07). |
| `Fecha de inicio` | Fecha | No se envía | Figma la muestra como campo con calendario. **El back no recibe fecha**: `FechaInicio` se toma de hoy (zona `America/Argentina/Buenos_Aires`, `PolizaService.cs:38, 61`). Mostrarla como texto de solo lectura (ver D3). | No existe en el request. |
| `Fecha de fin` | Fecha | — | Calculada en el front: inicio + vigencia meses. Figma: `01/11/2026` + 6 meses = `01/05/2027`. El back calcula `FechaFin = hoy.AddMonths(vigenciaMeses)`. | `PolizaDetalleResponse.FechaFin` después de emitir. |

Sin campos de texto ni máscaras. No hay validaciones de formato en el front más allá de la vigencia.

Coherencia del front con el back:

- La vigencia solo puede ser 1, 6 o 12. El back lo valida en `CalculadorCuotas` (RN07).
- La prima se muestra tal como viene de la cotización (`CotizacionDto.PrimaMensual`). El back **no la recalcula** (RN06).
- El back calcula la fecha de inicio como "hoy": si el usuario deja la pantalla abierta de un día para otro, la fecha que se muestra puede no coincidir con la que se guarda. Refrescar la fecha al montar la pantalla.

## 7. Estados

| Estado | Qué se muestra |
|---|---|
| Cargando (cotización) | Skeleton de la tarjeta "Cotización" y de la tabla de cuotas. Botones deshabilitados. Texto de carga: `NO DEFINIDO`. |
| Vacío | No aplica: si la cotización no existe, va a error. |
| Error de cotización (404) | Mensaje `La cotización {id} no existe.` (texto del back) en lugar del contenido. Botón `Volver a cotización`. Texto de volver: `NO DEFINIDO`. |
| Cotización vencida (400, RN06) | El back responde `La cotización está vencida (RN06).`. Mostrar el mensaje en la nota de emisión y deshabilitar `Emitir póliza` (ver D11). |
| Cotización ya usada (400) | Mostrar `La cotización ya se usó para emitir una póliza.` y deshabilitar `Emitir póliza`. |
| Validaciones fallidas (400) | El back corta en el primer error (ver D4). Mostrar el mensaje devuelto en la nota de emisión y mantener la pantalla. |
| Emitiendo (POST en curso) | `Emitir póliza` con spinner y deshabilitado. `Cancelar` deshabilitado. Evitar doble envío (ver sección 12). |
| Error del servidor (502, 503, 500) | Mensaje genérico. Texto del back para 502 y 503: `ExceptionMiddleware` pasa el `Message` de la excepción; texto para 500: `NO DEFINIDO` (el back no revela detalle). |
| Éxito (201) | Redirección a la póliza emitida (ver D6). Texto de confirmación: `NO DEFINIDO`. |
| Deshabilitado | `Emitir póliza` mientras hay validaciones pendientes, mientras emite, o si la cotización está vencida. `Cancelar` mientras emite. |
| Foco | Los chips de vigencia y el campo `Fecha de inicio` deben mostrar anillo de foco visible. Estado de foco del Figma: `NO DEFINIDO`. |

Error de cotización `Especificado` (ver sección 9): mientras `GET /api/clientes/{id}` no esté publicado, el nombre del cliente se muestra con MSW (decisiones base FB4). No bloquear la pantalla por ese dato.

## 8. Acciones y navegación

| Acción | Destino | Regla |
|---|---|---|
| `Volver a cotización` | Cotización (`/cotizaciones/:cotizacionId`, propuesta) | Siempre habilitada. |
| Chip `1 mes` / `6 meses` / `12 meses` | Cambia la vigencia y recalcula `Fecha de fin` y la tabla de cuotas | Selección única. |
| Campana | Sin acción en el Figma (`NO DEFINIDO`) | Sin endpoint de notificaciones. |
| `Emitir póliza` (primario) | `POST /api/polizas` con `{ cotizacionId, vigenciaMeses }`. Al 201, navegar a `/polizas/:id` (B10) | Deshabilitado si hay error de validación previa, si la cotización está vencida o ya usada, o mientras emite. |
| `Cancelar` (secundario) | Destino `NO DEFINIDO`. Propuesta: volver a `/cotizaciones/:cotizacionId` | Sin confirmación en el Figma. Si hay datos cargados, confirmar: texto `NO DEFINIDO`. |

Sidebar: ítems `Inicio`, `Clientes`, `Vehículos`, `Cotizaciones`, `Pólizas` (activo), `Pagos y facturas`, `Pago Fácil`, `Planes`, `Usuarios`. Destinos de cada ítem: `NO DEFINIDO` en este documento (son de otras pantallas).

Acciones por estado de la póliza: **no aplica**. La póliza todavía no existe en esta pantalla; el estado inicial es siempre `Pendiente` (RN07).

## 9. Datos: endpoints y origen de cada campo

Endpoints que la pantalla consume o envía:

| Método y ruta | Estado | Uso | Campos del DTO que se muestran |
|---|---|---|---|
| `GET /api/cotizaciones/{id}` | Implementado | Carga de la cotización. Devuelve `CotizacionDto`. | `ClienteId`, `VehiculoId`, `PlanId`, `CodigoPlan`, `PrimaMensual` → `Prima mensual`; `FechaVencimiento` → `Válida hasta`. |
| `GET /api/vehiculos/{id}` | Implementado | Datos del vehículo, con `VehiculoId` de la cotización. | `Marca` + `Modelo` + `Anio` → `Volkswagen Gol Trend 2017` (espacio simple entre campos). `Patente` → `AC456FG`. |
| `GET /api/planes/{id}` | Implementado | Nombre del plan, con `PlanId` de la cotización. | `Nombre` → `TC Terceros Completo`. `Codigo` (opcional, ej. `TC`). |
| `GET /api/clientes/{id}` | Especificado (US-F1-06, `docs/tareas-divididas.md`) | Nombre del cliente. | `Nombre` y `Apellido` → `Tomás Iturralde`. Hasta que esté publicado, usar MSW. |
| `POST /api/polizas` | Implementado | Emitir. Body `{ "cotizacionId": "<guid>", "vigenciaMeses": 1 | 6 | 12 }`. | 201: `PolizaDetalleResponse` con `Id` (para redirigir) y `Cuotas`. Header `Location` a `GET /api/polizas/{id}`. |

Notas sobre los datos:

- **Cliente.** `CotizacionDto` solo trae `ClienteId`. El nombre no está en la cotización ni en el request de emisión. Queda bloqueado hasta `GET /api/clientes/{id}` (Especificado).
- **Cuotas.** Antes de emitir, la tabla se calcula en el front con la misma regla de `CalculadorCuotas.GenerarCuotas` (ver D1 y D2): `Importe` = `PrimaMensual`, `Estado` = `Pendiente`, `Recargo` = 0. Después de emitir, la tabla de cuotas debe salir de `PolizaDetalleResponse.Cuotas`, no del cálculo del front.
- **Total.** Suma de los importes. `6 cuotas` = cantidad de cuotas. `$ 118.800,00` = `6 × 19.800,00`.
- **Validaciones.** Ver D4: no hay endpoint de validación previa.
- Formato de nombres en JSON: el default de ASP.NET Core es camelCase. No encontré configuración propia en `backend/Aseguradora.Api`; confirmar antes de fijar los tipos. Los enums (`EstadoPoliza`, `EstadoCuota`) por default de `System.Text.Json` se serializan como número. Ver D12.

Errores de `POST /api/polizas` (ProblemDetails, campo `detail`):

| Código | Causa | Fuente |
|---|---|---|
| 400 | `BusinessRuleException` (mensajes de la sección 5). | `ExceptionMiddleware` → 400. |
| 400 | `ReglaDeDominioException` (vigencia inválida). | `ExceptionMiddleware` → 400. |
| 404 | Cotización no existe. | `NotFoundException` → 404. |
| 401 | Sin JWT o token inválido. | Política. |
| 403 | Rol no permitido. | Política. |
| 500 | Error no controlado. Mensaje genérico del back. | `ExceptionMiddleware`. |

## 10. Reglas de negocio visibles (RN##)

- **RN02.** Antes de emitir, el cliente debe estar validado en Renaper: el DNI existe y el estado es vigente. Figma: `Cliente validado en Renaper`.
- **RN03.** La patente es única. El vehículo debe estar validado en DNRPA y el titular informado por DNRPA debe ser el mismo DNI que el cliente. Figma: `Vehículo validado en DNRPA`.
- **RN04.** Un vehículo puede tener una sola póliza activa (Pendiente, Vigente o Suspendida) a la vez. Figma: `Sin otra póliza activa para el vehículo`.
- **RN05.** Cada plan define qué tipos de vehículo acepta y una antigüedad máxima. Figma: `Plan compatible con el vehículo`.
- **RN06.** La cotización vence a los 15 días. La prima guardada en la cotización se usa tal cual, sin recalcular. Figma: `Válida hasta 12/11/2026`.
- **RN07.** Vigencia de 1, 6 o 12 meses; una cuota por mes, igual a la prima; cada cuota vence el día 10. La póliza nace `Pendiente` y pasa a `Vigente` al pagarse la cuota 1. Figma: chips de vigencia, tabla de cuotas y la nota de emisión.
- **RN19.** Si la cuota 1 de una póliza Pendiente vence sin pagarse, la póliza pasa a Cancelada. Relevante para la fecha de primer vencimiento (ver D1 y D13).

Los textos de RN02 a RN05 son los de `docs/AnalisisBack.md` §4 (líneas 181 a 187).

## 11. Responsive

Solo desktop. El backoffice no tiene frame mobile en el Figma. Comportamiento propuesto (no definido por el diseño):

- Menos de 1024 px: el sidebar se colapsa a íconos o pasa a menú; el rail derecho baja debajo de la columna principal y los botones de acción pasan a ancho completo y fijos al final.
- La tabla de cuotas admite scroll horizontal dentro de su contenedor, sin scroll de la página.

## 12. Accesibilidad

- `Fecha de inicio`: etiqueta visible arriba del campo (no usar placeholder como etiqueta). Si queda de solo lectura, usar texto y no un campo deshabilitado.
- Chips de vigencia: agrupar en `role="radiogroup"` con etiqueta `Vigencia`; cada chip con `role="radio"` y `aria-checked`. Navegación con flechas.
- Campana: botón con nombre accesible. Texto: `NO DEFINIDO`.
- Tabla de cuotas: usar `<table>` con `<th scope="col">`. El estado (`Pendiente`) va como texto, no solo por color.
- Montos: usar tabular nums (mono del design system) para que alineen.
- Botón `Emitir póliza` durante la emisión: `aria-disabled="true"` y anuncio de carga en región `aria-live="polite"`.
- Errores de validación y errores del back: región `role="alert"` con el mensaje literal.
- Íconos decorativos (`alt=""`). El check de validaciones tiene texto propio, así que el ícono no necesita nombre.
- Contraste: el texto de `Válida hasta` (`text-tertiary`, `#8a8e93`) sobre blanco queda cerca del límite AA para 12 px. Revisar con la herramienta de contraste antes de cerrar la tarea.

## 13. Dudas e inconsistencias Figma ↔ back

Ordenadas por impacto. Cada una necesita una decisión del equipo; hasta entonces, la pantalla no debe asumir una respuesta.

**D1. Fecha de vencimiento de la cuota 1 (crítica).** El Figma muestra la cuota 1 con vencimiento `10/11/2026` (inicio `01/11/2026`). El código calcula `primerDiaDelMes(inicio).AddMonths(n).AddDays(9)` (`backend/Aseguradora.Domain/Services/CalculadorCuotas.cs:33`), con `n` desde 1. Para inicio `01/11/2026`, la cuota 1 vence `10/12/2026`.

**D2. Desfasaje de todas las cuotas (crítica).** Figma: `10/11/2026`, `10/12/2026`, `10/01/2027`, `10/02/2027`, `10/03/2027`, `10/04/2027`. Código: `10/12/2026`, `10/01/2027`, `10/02/2027`, `10/03/2027`, `10/04/2027`, `10/05/2027`. Con `FechaFin` = `01/05/2027`, la cuota 6 del código vence después del fin de la póliza. Decidir la regla de RN07 (¿el mes de la primera cuota es el de inicio o el siguiente?) y corregir la otra parte. Esto también afecta a B10 (ver su archivo).

**D3. Fecha de inicio editable (alta).** El Figma muestra un campo con icono de calendario (`Input Fecha de inicio`). El back no recibe fecha: `FechaInicio` = hoy (`PolizaService.cs:61`). Si se muestra editable, el usuario elige una fecha que no se guarda. Propuesta: solo lectura, mostrando "hoy".

**D4. Checklist "Validaciones" (alta).** El Figma muestra cuatro checks en verde antes de emitir. El back no tiene endpoint de validación previa: `EmitirAsync` valida en secuencia y lanza el primer error (`PolizaService.cs:40-43`). Mostrar los cuatro checks como estáticos en verde sería un dato falso si alguna regla falla. Decidir: (a) checks estáticos con texto neutro, (b) un endpoint de validación previa, o (c) mostrar solo el resultado del POST.

**D5. Estilo y selección por defecto de la vigencia (media).** El Figma muestra `6 meses` con fondo lime (Destacado) y los otros dos como `Sin seleccionar`. La doc de `Chip` dice que los chips seleccionables son `Seleccionado` (oscuro) o `Sin seleccionar`, y que `Destacado` se usa para "lo que importa del widget". El valor por defecto (`6 meses`) no está escrito en ningún documento. Confirmar tipo y valor inicial.

**D6. Estado de éxito (alta).** El Figma no muestra qué pasa después de `Emitir póliza`. Propuesta: navegar a `/polizas/:id` (B10) con un aviso `Póliza POL-... emitida`. Texto y destino a confirmar.

**D7. Destino de `Cancelar` (media).** Sin definir. Propuesta: volver a la cotización sin guardar nada (no hay estado que deshacer en el back).

**D8. Campana (baja).** Sin acción ni endpoint de notificaciones. Confirmar si se elimina o queda como placeholder.

**D9. Formato de la cuota (baja).** B8 usa `Cuota 1 de 6`; B10 usa `1 de 12` bajo el encabezado `Cuota`. Elegir un formato único para la lista de cuotas.

**D10. Cobro al emitir (media).** El Figma no muestra ningún pago en esta pantalla. El back no cobra al emitir: la póliza nace `Pendiente` y la cuota 1 se cobra después (`POST /api/pagos/caja` o pasarela). Confirmar que no hay paso de cobro en la emisión.

**D11. Cotización vencida o ya usada (media).** El Figma no muestra estado para cotización vencida (RN06) ni para cotización ya usada. El back responde 400 con los mensajes de la sección 5. Propuesta: deshabilitar `Emitir póliza` si `FechaVencimiento` ya pasó, pero el back es quien decide; el front no debe ser la única barrera.

**D12. Serialización de enums (media).** No encontré `JsonStringEnumConverter` en `backend/Aseguradora.Api`. Con el default de `System.Text.Json`, `Estado` (`EstadoPoliza`, `EstadoCuota`) llega como número en JSON y en query (`?estado=1`). Confirmar en `Program.cs` antes de mapear los badges y los filtros.

**D13. Primer vencimiento y RN19 (media).** `docs/tareas-divididas.md` (lista de decisiones pendientes, línea ~938) dice que una póliza emitida el día 9 se cancelaría al día siguiente, porque la cuota 1 vence el 10. Sin un plazo mínimo, la pantalla puede emitir una póliza que se cancela sola. Decisión pendiente del equipo: no resuelta en este documento.

**D14. Datos del cliente (media).** `Tomás Iturralde` depende de `GET /api/clientes/{id}`, que está Especificado (US-F1-06). Hasta entonces, MSW.

## 14. Referencia Figma

| Elemento | Nodo | URL con node-id |
|---|---|---|
| Frame B8 | `23:1204` | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=23-1204 |
| Panel shell | `23:1206` | …?node-id=23-1206 |
| Sidebar | `23:1207` | …?node-id=23-1207 |
| Columna principal | `23:1282` | …?node-id=23-1282 |
| Topbar | `23:1283` | …?node-id=23-1283 |
| Cotización (resumen) | `23:1299` | …?node-id=23-1299 |
| Vigencia | `23:1316` | …?node-id=23-1316 |
| Fecha de inicio | `23:1325` | …?node-id=23-1325 |
| Cuotas que se generan | `23:1332` | …?node-id=23-1332 |
| Tabla cuotas | `23:1334` | …?node-id=23-1334 |
| Rail derecho | `23:1421` | …?node-id=23-1421 |
| Widget Validaciones | `23:1423` | …?node-id=23-1423 |
| Nota emisión | `23:1441` | …?node-id=23-1441 |
| Acciones | `23:1445` | …?node-id=23-1445 |
