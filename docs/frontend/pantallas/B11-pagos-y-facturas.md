# B11 · Pagos y facturas

- **Pantalla:** B11 Pagos y facturas (backoffice, desktop 1440 px).
- **Figma:** nodo `23:1638`, página `02 Backoffice`.
- **Contrato verificado contra:** `development` (HEAD `4ba3d4b`, sin PR abierto de pagos). Código: `PagosController`, `PagoResponse`, `FacturaResponse`, `PolizasController`, `CuotaResponse`, `PagoService`.
- **Leyenda de estado de endpoint:** **Implementado** (existe en `development`), **En PR #N**, **Especificado** (solo en spec o tareas), **NO EXISTE** (ni código, ni PR, ni tarea que lo defina).

---

## 1. Propósito y quién la usa

- **Propósito:** consultar los pagos cobrados (caja, pasarela, Pago Fácil) con su factura, y registrar en caja el cobro de cuotas impagas de una póliza desde el rail derecho.
- **Rol:** Empleado. Los endpoints de pagos usan `Politicas.Empleado`, y según `docs/pagos-caja.md` ese acceso también lo tiene el Administrador. Verificar en la definición de la política antes de cerrar la guarda.
- **Dato en el Figma:** el footer del sidebar muestra `Mariela Quiroga` con rol `Empleado`.

## 2. Ruta propuesta y guardas de acceso

- **Ruta:** `/pagos`. La pestaña `Facturas` usa el query `?tab=facturas` (propuesta).
- **Feature:** `apps/backoffice/src/features/pagos` (FB3). Las facturas viven en la misma feature hasta que el Figma defina la pestaña.
- **Guardas:**
  - Sin JWT o JWT vencido: redirigir a login (401 del back).
  - Rol distinto de Empleado y Administrador: mostrar pantalla de acceso denegado. **NO DEFINIDO** en el Figma.
- **Sidebar:** el ítem `Pagos y facturas` está activo (`NavItem` con `Active=true`). Ver Dudas: el Figma muestra `Planes` y `Usuarios` (grupo `Nav admin`) al usuario Empleado.

## 3. Estructura visual (de arriba a abajo, medidas del Figma)

Panel shell: 1392 × 976 px en (24, 24), radio 24 px, sombra `Nexa/Shadow/Shell`.

| Región | Medidas | Contenido |
|---|---|---|
| Sidebar | 232 px de ancho, padding 16 px, fondo `surface-sidebar` | Logo, buscador, nav principal, divisor, nav admin, usuario al pie |
| Columna principal | 859 px de ancho, padding 32 px | Topbar, tabs, filtros, tabla, paginación |
| Topbar | alto 64 px, en y=32 | Título `Pagos y facturas` (H2) a la izquierda, botón campana 36 × 36 a la derecha |
| Tabs | alto 30 px, en y=120, gap 24 px | `Pagos` (activa, indicador negro 2 px) y `Facturas` |
| Filtros | alto 64 px, en y=174, gap 12 px | `Período` (flex, ~371 px), `Medio` (200 px), `Estado` (200 px) |
| Tabla | 795 px de ancho, en y=262, alto 483 px, borde hairline, radio 12 px | Header 40 px (fondo `surface-subtle`), 9 filas de 48 px con divisor de 1 px |
| Paginación | alto 32 px, en y=769 | Texto de conteo a la izquierda, `Anterior` (73 px) y `Siguiente` (81 px) a la derecha |
| Divisor del rail | 1 px, x=1091, alto 976 | Separa columna y rail |
| Rail derecho | 300 px, padding 24 px horizontal, 32 px superior | Título, campo Póliza, Cliente, Cuotas impagas, Total, botón, ayuda |

**Anchos de columnas de la tabla (px, del Figma):** Fecha 99 · Cliente 121 · Póliza 102 · Cuotas 50 · Medio 84 · Importe 102 (alineado a la derecha) · Estado 91 · Factura 144.

**Rail derecho, de arriba abajo:**
1. Título `Registrar pago en caja` (16/22 SemiBold), gap vertical 20 px.
2. Campo `Póliza` (input de 252 px, alto 40 px, fuente mono).
3. Bloque `Cliente`: etiqueta y nombre.
4. Bloque `Cuotas impagas`: una fila por cuota, alto 48 px, checkbox de 18 px, texto `Cuota N`, badge de estado, importe a la derecha. Divisores de 1 px entre filas.
5. Bloque `Total a registrar` (etiqueta 12 px y monto 22/28 mono).
6. Botón `Registrar pago` (ancho completo, alto 40 px, primario, con ícono de billetera).
7. Texto de ayuda `Se emite la factura con CAE al confirmar.` (13 px, secundario).

## 4. Componentes del design system y componentes propios

**Del design system (nombre en Figma):**
- `Logo/Nexa` (nodo 14:5). Descripción: "Nexa monogram plus wordmark. The only hand-made brand mark."
- `NavItem` (nodo 14:99). Indicador de 2 px a la izquierda, texto más oscuro cuando `Active=true`. Icono Phosphor Regular.
- `Button` (nodo 11:42). `Primary` M 40 px para `Registrar pago`. `Secondary` S 32 px para `Anterior`, `Siguiente` y `Descargar`.
- `Input` (nodo 11:66). Label arriba, campo, texto de ayuda abajo. Estados: Default, Focus, Error, Disabled. Usado para `Póliza`.
- `Select` (nodo 11:95). Label arriba, campo, texto de ayuda. Estados: Default, Focus, Error, Disabled. Usado en `Medio` y `Estado`.
- `Badge/Estado` (nodo 11:117). Descripción: "Colors map to semantic status tokens only. Pagada and Validado use Vigente colors, Pendiente CAE uses Suspendida colors, Anulada uses Vencida colors."

**Variantes de badge usadas en la pantalla (token → texto literal):**
- Verde `status-vigente` (fondo `#e3f4ea`, texto `#1f7a4d`): `Aprobado`.
- Lavanda `status-pendiente` (fondo `#ecedf7`, texto `#5a5f8c`): `Pendiente`.
- Rojo `status-cancelada` (fondo `#fbe5e2`, texto `#b03a2e`): `Rechazado`, y `Vencida` en cuotas.
- Amarillo `status-suspendida` (fondo `#fbf0d6`, texto `#9a6400`): `Pendiente de CAE`.

**Sin instancia de componente en el Figma (frames sueltos):** tabla (`Table/Header`, `Cell/*`, `Divider`), checkbox de cuota (`Checkbox 6..8`), avatar de usuario, separadores.

**Componentes propios de la pantalla (propuesta de nombres):**
- `PagosPage` (page delgada, compone).
- `PagosFilters` (Período, Medio, Estado).
- `PagosTable` y `PagoRow`.
- `FacturaCell`: muestra número de factura, o `Pendiente de CAE` con link `Reintentar`, o `Sin factura`.
- `EstadoPagoBadge` y `EstadoFacturaBadge`: mapean códigos del back a texto y token.
- `CajaRail`, `CuotaCheckItem`, `TotalAPagar`.
- `Paginacion`.

## 5. Contenido textual literal

Copiado del Figma tal cual (tildes y puntuación). Los valores entre llaves son datos.

| Elemento | Texto literal |
|---|---|
| Título topbar | `Pagos y facturas` |
| Tab 1 (activa) | `Pagos` |
| Tab 2 | `Facturas` |
| Label filtro 1 | `Período` |
| Valor de muestra del período | `01/10/2026 a 28/10/2026` |
| Label filtro 2 | `Medio` |
| Label filtro 3 | `Estado` |
| Valor por defecto de los selects | `Todos` |
| Header columna 1 | `Fecha` |
| Header columna 2 | `Cliente` |
| Header columna 3 | `Póliza` |
| Header columna 4 | `Cuotas` |
| Header columna 5 | `Medio` |
| Header columna 6 | `Importe` |
| Header columna 7 | `Estado` |
| Header columna 8 | `Factura` |
| Conteo de paginación | `Mostrando {desde} a {hasta} de {total} pagos` (muestra: `Mostrando 1 a 9 de 74 pagos`) |
| Botón paginación | `Anterior`, `Siguiente` |
| Estado de pago | `Aprobado`, `Pendiente`, `Rechazado` |
| Estado de factura | `Pendiente de CAE` (con link `Reintentar` debajo), `Sin factura`, o el número de factura (ej. `A-0003-00000187`) |
| Título rail | `Registrar pago en caja` |
| Label campo póliza | `Póliza` |
| Label cliente | `Cliente` |
| Nombre de cliente (muestra) | `Lucía Benítez` |
| Label cuotas | `Cuotas impagas` |
| Item cuota | `Cuota {N}` (muestra: `Cuota 6`, `Cuota 7`, `Cuota 8`) |
| Badge de cuota | `Vencida`, `Pendiente` |
| Label total | `Total a registrar` |
| Botón | `Registrar pago` |
| Texto de ayuda | `Se emite la factura con CAE al confirmar.` |

**Nota:** en el Figma, el nodo del botón se llama `Consultar` en su capa. El texto visible es `Registrar pago`. Usar el texto visible.

## 6. Campos y validaciones

| Campo | Tipo | Obligatorio | Regla | Estado del back |
|---|---|---|---|---|
| Período | rango de fechas (dd/mm/aaaa a dd/mm/aaaa) | no | Sin regla en el Figma. Valor por defecto **NO DEFINIDO** | **NO EXISTE** (ningún endpoint de listado acepta fechas) |
| Medio (select) | selección única | no | Valor inicial `Todos`. Opciones **NO DEFINIDO** | **NO EXISTE** filtro. Valores posibles en `MedioPago`: `Pasarela`, `PagoFacil`, `Caja` |
| Estado (select) | selección única | no | Valor inicial `Todos`. Opciones **NO DEFINIDO** | **NO EXISTE** filtro. Valores de `EstadoPago`: `Pendiente`, `Aprobado`, `Rechazado` |
| Póliza (rail) | texto | sí, para cargar cuotas | Formato `POL-0000001` (7 dígitos; el back lo documenta en `PolizaDetalleResponse.Numero`). Modo de búsqueda (Enter, al salir del campo, botón) **NO DEFINIDO** | **NO EXISTE** búsqueda por número (ver §9) |
| Cuotas (checkbox) | multi-selección | al menos 1 para registrar | Solo cuotas `Pendiente` o `Vencida`. El back rechaza `Pagada` y `Anulada` (400). Back exige `CuotaIds` no vacío (`MinLength 1`, mensaje `Debe indicar al menos una cuota.`) | Implementado (`POST /api/pagos/caja`) |
| Cuotas: selección inicial | — | — | El Figma muestra `Cuota 6` y `Cuota 7` marcadas y `Cuota 8` sin marcar. **NO DEFINIDO** si es preselección por defecto | — |
| Cuotas repetidas | — | — | El back rechaza repetidos (400) | Implementado |
| Cuotas de dos clientes | — | — | El back rechaza mezclar clientes (400) | Implementado |
| Total a registrar | monto calculado | — | Suma de las cuotas marcadas. El Figma muestra un importe por cuota; ver Dudas sobre recargo | — |
| Botón Registrar pago | — | — | Deshabilitado sin cuotas marcadas. **Propuesta** (el Figma no muestra el estado) | — |

**Formato:** importes en `$ 51.250,00` (punto de miles, coma decimal, fuente mono `JetBrains Mono`). Fechas en `dd/mm/aaaa`. Un formateador único en `@nexa/ui` o `@nexa/api` (FB4).

## 7. Estados

| Estado | Qué muestra | Fuente |
|---|---|---|
| Cargando (tabla) | **NO DEFINIDO**. Propuesta: skeleton de 9 filas con la misma altura de 48 px | Propuesta |
| Cargando (rail al elegir póliza) | **NO DEFINIDO**. Propuesta: indicador dentro del bloque `Cuotas impagas` | Propuesta |
| Vacío (tabla) | **NO DEFINIDO**. Propuesta: mensaje dentro de la tabla, sin texto inventado | Propuesta |
| Error de carga | **NO DEFINIDO**. Propuesta: mensaje del ProblemDetails dentro del contenedor de tabla | Propuesta |
| Póliza no encontrada | **NO DEFINIDO** | — |
| Éxito al registrar | **NO DEFINIDO** (no hay toast ni pantalla de confirmación en el Figma). Propuesta: refrescar el rail y limpiar la selección | Propuesta |
| Error al registrar | **NO DEFINIDO**. Propuesta: mostrar el `detail` del 400 del back (ej. `Debe indicar al menos una cuota.`) | Propuesta |
| Input Default / Disabled | Figma: `Póliza` en Default | Figma |
| Input Focus / Error | Definidos en el componente `Input`, **sin frame** en la pantalla | Componente |
| Checkbox marcado / sin marcar | Figma: `Cuota 6` y `Cuota 7` marcadas, `Cuota 8` sin marcar | Figma |
| Badge Aprobado / Pendiente / Rechazado / Pendiente de CAE / Sin factura | Ver §4 y §5 | Figma |
| Fila sin factura | Texto `Sin factura` en color terciario | Figma |

## 8. Acciones y navegación

| Acción | Qué hace | Destino |
|---|---|---|
| Tab `Pagos` | Muestra la tabla de pagos | Misma pantalla |
| Tab `Facturas` | Muestra la vista de facturas | **NO DEFINIDO** (no hay frame de la pestaña) |
| Cambiar Período / Medio / Estado | Vuelve a pedir la tabla con el filtro | **NO EXISTE** (ver §9) |
| Click en una fila | **NO DEFINIDO** | — |
| Link `Reintentar` (bajo `Pendiente de CAE`) | Reintenta la emisión de la factura | **NO EXISTE** endpoint (ver §9 y Dudas) |
| `Anterior` / `Siguiente` | Cambia de página | **NO EXISTE** paginación |
| Campo Póliza (búsqueda) | Trae póliza y sus cuotas | **NO EXISTE** búsqueda por número |
| Checkbox de cuota | Suma o resta del total | Local |
| `Registrar pago` | `POST /api/pagos/caja` con los `cuotaIds` marcados. Éxito: 201 con `PagoResponse`. Después recargar cuotas de la póliza | Misma pantalla |
| Campana (topbar) | **NO DEFINIDO** | — |
| Buscar (sidebar) | **NO DEFINIDO**. Sin endpoint de búsqueda global | — |
| Menú del usuario (`...`) | **NO DEFINIDO** | — |
| Ítems del sidebar | Inicio `/`, Clientes `/clientes`, Vehículos `/vehiculos`, Cotizaciones `/cotizaciones`, Pólizas `/polizas`, Pagos y facturas `/pagos`, Pago Fácil `/pago-facil`, Planes `/planes`, Usuarios `/usuarios` | Rutas propuestas |

## 9. Datos: endpoints y mapeo de campos

**Endpoints que usa la pantalla:**

| Dato o acción | Método y ruta | Estado | Campo del DTO → UI |
|---|---|---|---|
| Listado de pagos (tabla, filtros, paginación) | `GET /api/pagos` | **NO EXISTE** | — (ver contrato propuesto abajo) |
| Detalle de un pago | `GET /api/pagos/{id}` | Implementado | `PagoResponse.Estado` → badge de estado; `Medio` → columna Medio; `Importe` → columna Importe; `FechaCreacion` (UTC) → columna Fecha; `FechaAcreditacion` → sin uso en el Figma; `Factura` → columna Factura; `Numero` → sin columna en el Figma |
| Factura de un pago | `GET /api/pagos/{id}/factura` | Implementado | `FacturaResponse.Numero` → Factura (número), `Estado` → badge (`PENDIENTE_CAE` = `Pendiente de CAE`; `AUTORIZADA` = número) |
| Buscar póliza por número | `GET /api/polizas?numero=` | **NO EXISTE** (`PolizaFiltro` tiene Estado, ClienteId, Patente, Pagina, Tamano) | — |
| Listar pólizas (sin número) | `GET /api/polizas` | Implementado | No aplica a esta pantalla |
| Detalle de póliza | `GET /api/polizas/{id}` | Implementado | `Numero` → Póliza; `ClienteId` → para pedir el nombre |
| Nombre del cliente | `GET /api/clientes/{id}` | **Especificado** (F1-06). No está en PR #50 (ese PR trae `POST /api/clientes`, `POST /{id}/validar-renaper` y `GET /renaper/{dni}`) | Nombre → Cliente. Sin endpoint, el rail no puede mostrar el nombre |
| Cuotas de la póliza | `GET /api/polizas/{id}/cuotas` | Implementado | `Id` → valor del checkbox; `Numero` → `Cuota {N}`; `Importe` y `Recargo` → importe; `Estado` → badge; `FechaVencimiento` → sin uso en el Figma de B11 |
| Registrar pago en caja | `POST /api/pagos/caja` body `{ "cuotaIds": [guid] }` | Implementado | 201 con `PagoResponse` |
| Reintentar factura pendiente | — | **NO EXISTE**. US-F4-09 es un job (`ReintentoFacturasJob`), no define endpoint | — |
| Descargar PDF de factura | — | **NO EXISTE**. `FacturaResponse` no tiene URL del PDF | — |
| Conciliar pago con la pasarela | `POST /api/pagos/{id}/conciliar` | Implementado | No aparece en el Figma (ver Dudas) |

**Mapeo de valores (códigos del back → texto del Figma):**
- `PagoResponse.Estado`: `PENDIENTE` → `Pendiente`; `APROBADO` → `Aprobado`; `RECHAZADO` → `Rechazado`.
- `PagoResponse.Medio`: `CAJA` → `Caja`; `PAGO_FACIL` → `Pago Fácil`; `PASARELA` → **no hay texto en el Figma** para este caso (ver Dudas: el Figma muestra `Pasarela A` y `Pasarela B`).
- `FacturaResponse.Estado`: `PENDIENTE_CAE` → `Pendiente de CAE`; `AUTORIZADA` → se muestra el número.
- `CuotaResponse.Estado` (`EstadoCuota`): `Vencida` y `Pendiente`. Ver Dudas sobre el formato en el wire.

**Contrato mínimo propuesto para el listado (NO EXISTE hoy):**

```
GET /api/pagos?desde=2026-10-01&hasta=2026-10-28&medio=CAJA&estado=APROBADO&pagina=1&tamano=9
→ 200 PaginaResponse<PagoListadoResponse>   (PaginaResponse ya existe en Application/Comun)

PagoListadoResponse {
  id: guid,
  numero: string,                 // "PAG-xxxxxx"
  fechaCreacion: datetime UTC,    // columna Fecha
  clienteNombre: string,          // columna Cliente
  numeroPoliza: string,           // columna Póliza
  cuotas: int[],                  // columna Cuotas ("8 y 9")
  medio: "CAJA" | "PASARELA" | "PAGO_FACIL",
  importe: decimal,               // columna Importe
  estado: "PENDIENTE" | "APROBADO" | "RECHAZADO",
  factura: { numero, estado } | null
}
```

**Contrato mínimo propuesto para buscar por póliza (NO EXISTE hoy):** agregar `Numero` a `PolizaFiltro` y exponer `GET /api/polizas?numero=POL-0000057`, devolviendo `PaginaResponse<PolizaListItemResponse>`. Alternativa: `GET /api/polizas/por-numero/{numero}` → `PolizaDetalleResponse`.

**Formato de los estados en el wire (verificar antes de mapear):** `PagoResponse`, `FacturaResponse` y `Medio` son `string` con los valores de `ValoresPagoResponse` (`APROBADO`, `CAJA`, `PAGO_FACIL`, `PENDIENTE_CAE`). `CuotaResponse.Estado` y `PolizaListItemResponse.Estado` son enums (`EstadoCuota`, `EstadoPoliza`) y `Program.cs` no configura `JsonStringEnumConverter`. Por defecto, System.Text.Json los serializa como **número**. Confirmar en Swagger antes de implementar el mapeo de cuotas.

## 10. Reglas de negocio visibles

- **RN11:** se cobran cuotas impagas. El back rechaza `Anulada` y `Pagada` al cobrar en caja (US-F4-03).
- **RN12:** la factura se emite con CAE al confirmar el pago. El texto `Se emite la factura con CAE al confirmar.` lo expresa.
- **RN17:** acceso por roles (Empleado y Administrador en la política de pagos).
- **RN07 / RN08:** `CuotaResponse.Recargo` es el recargo por mora (cero hasta que la cuota vence). Ver Dudas sobre si el total muestra recargo.
- **Estados de pago** (spec, tabla de Pagos): `Pendiente`, `Aprobado`, `Rechazado`. **Medio** (spec): `Pasarela`, `PagoFacil`, `Caja`.
- **Facturas pendientes de CAE** (spec §10): RN12 dice que se reintentan. Lo hace el job de US-F4-09. No hay acción manual en el back.

## 11. Responsive

Solo desktop. El Figma no tiene frame móvil para el backoffice (1440 px).

**Propuesta, a confirmar:** por debajo de 1280 px, el rail derecho pasa debajo de la tabla y la tabla usa scroll horizontal dentro de su contenedor. No dejar que la página entera scrollee en horizontal.

## 12. Accesibilidad

El Figma no define accesibilidad. Propuesta:
- Cada campo tiene su label visible arriba (el Figma exige no usar el placeholder como label).
- La tabla usa `<table>` con `<th scope="col">`.
- Cada checkbox de cuota tiene label asociado (`Cuota 6`) y el estado se lee por el propio control.
- Los badges llevan el texto (`Aprobado`, `Rechazado`), no solo el color.
- Los íconos decorativos llevan `alt=""` o `aria-hidden`.
- El foco visible sale del estado `Focus` del componente `Input`.
- **Contraste:** el texto terciario `#8a8e93` sobre blanco da aproximadamente 3,3:1, por debajo de 4,5:1 para texto de 11 a 13 px. Ver Dudas.

## 13. Dudas e inconsistencias Figma ↔ back

1. **No existe listado de pagos (`GET /api/pagos`).** La tarea US-F4-03 dice "consultar pagos y facturas" en el título, pero su alcance solo define `GET /api/pagos/{id}` y `GET /api/pagos/{id}/factura`. La tabla entera depende de ese listado. Decidir: ¿se agrega el endpoint de listado (contrato propuesto en §9) o se quita la tabla de esta versión?
2. **Pestaña `Facturas` sin diseño.** El Figma no tiene frame para su contenido. **NO DEFINIDO.**
3. **Estado "Validado".** El pedido mencionaba `Validado` / `Pendiente CAE`. En el Figma de B11 el texto es **`Aprobado`** y **`Pendiente de CAE`**. `Validado` aparece en el Figma solo en otras pantallas (B3 Clientes). Se usa el texto literal de B11: `Aprobado`. Confirmar.
4. **Medio: `Pasarela A` / `Pasarela B` en el Figma vs. una sola `Pasarela` en el back.** `MedioPago` no tiene proveedor. Decidir si el back agrega el proveedor al pago o el Figma muestra solo `Pasarela`.
5. **"Descarga" en B11.** El pedido mencionaba descarga en B11, pero el Figma de B11 no tiene ninguna acción de descarga. La única descarga de la familia está en B12 (base positiva). Confirmar que no falta nada en B11.
6. **Link `Reintentar` sin endpoint.** Hay dos caminos: (a) quitar el link y dejar la factura pendiente en manos del job de US-F4-09, o (b) agregar `POST /api/pagos/{id}/factura/reintentar`. Decidir.
7. **Búsqueda de póliza por número.** `PolizaFiltro` no tiene número. El modo de búsqueda (Enter, blur, botón) tampoco está en el Figma.
8. **Nombre del cliente en el rail.** Requiere `GET /api/clientes/{id}`, que es Especificado (F1-06) y no está en PR #50.
9. **Recargo en el total.** Las cuotas `Vencida` del Figma muestran un importe único (`$ 11.025,00`). El back separa `Importe` y `Recargo`. Decidir si se muestra la suma. Verificar que 11.025 = Importe + Recargo.
10. **Preselección de cuotas.** El Figma muestra `Cuota 6` y `Cuota 7` marcadas por defecto. Confirmar si es una regla o solo un ejemplo.
11. **Formato de estados en el wire.** `EstadoCuota` y `EstadoPoliza` se serializan como número por defecto (ver §9). Confirmar en Swagger.
12. **Filtros sin endpoint y paginación sin endpoint.** `Período`, `Medio` y `Estado` no tienen backend, y `Mostrando 1 a 9 de 74 pagos` requiere total y página. Decidir si se agregan con el listado.
13. **Opciones de los selects `Medio` y `Estado`.** **NO DEFINIDO** en el Figma.
14. **Sidebar del Empleado.** El Figma muestra `Planes` y `Usuarios` al usuario Empleado. `Usuarios` es solo Administrador (`Politicas.Admin` en `AuthController`), y `Planes` (escritura) también. Decidir si se ocultan para Empleado.
15. **Conciliar sin pantalla.** `POST /api/pagos/{id}/conciliar` existe, pero el Figma no tiene la acción. Decidir si se agrega a la fila o al detalle.
16. **Búsqueda, campana y menú de usuario.** Sin acciones definidas. **NO DEFINIDO.**
17. **Contraste del texto terciario** (ver §12).
18. **Textos de ejemplo.** `Lucía Benítez`, `Tomás Iturralde` y demás nombres son datos de muestra del Figma. Usar datos reales del back.

## 14. Referencia Figma

- Pantalla: nodo `23:1638`. URL: `https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=23-1638`.
- Subnodos útiles: tabla `23:2485`, fila 1 `23:2504`, rail `23:1675`, cuota 6 `23:3412`, botón registrar `23:3449`.
