# B10 · Detalle de póliza

Pantalla de backoffice (desktop 1440 px) para ver una póliza con sus datos, su ciclo de vida, sus cuotas, sus pagos y sus acciones (CU11, CU12, CU13, CU17, CU20).

Referencia Figma: frame `B10 Detalle de póliza`, nodo `23:1455`, página `02 Backoffice`. Alto del frame: **1639 px**.
URL: https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=23-1455

Convenciones: `Implementado` = existe en `development`. `Especificado` = solo en spec o tareas. `NO DEFINIDO` = ni el Figma ni el back lo definen (ver sección 13).

---

## 1. Propósito y quién la usa

- **Propósito:** consultar una póliza, ver su estado en el ciclo de vida, revisar cuotas y pagos, y operar sobre ella: cobrar en caja, obtener el cupón de Pago Fácil o cancelarla.
- **Rol:** Empleado (en el Figma, Mariela Quiroga). El Administrador también, por la política `Politicas.Empleado` (`backend/Aseguradora.Api/Security/AuthenticationExtensions.cs:65`).

## 2. Ruta propuesta y guardas de acceso

- **Ruta propuesta:** `/polizas/:id`. El `:id` es el GUID de la póliza (`PolizaDetalleResponse.Id`).
- Guardas como B8 y B9: JWT válido (401 → login), rol `Empleado` o `Administrador` (403 → acceso denegado; texto `NO DEFINIDO`).
- `:id` inválido (no es GUID): error de ruta. Póliza inexistente: 404 del back (`La póliza {id} no existe.`), mostrar pantalla de no encontrada con enlace a B9. Texto de esa pantalla: `NO DEFINIDO`.

## 3. Estructura visual (de arriba a abajo)

Lienzo 1440 × 1639. Panel shell de **1392 × 1591** en `left 24, top 24`, radio 24, misma sombra que B8 y B9. Sidebar de 232 px a la izquierda. Tres áreas: columna principal (859 px), divisor (1 px) y rail derecho (300 px). El panel tiene el alto del frame menos el margen.

Columna principal (padding horizontal 32; contenido de 795 px). Posiciones relativas a la columna:

| Bloque | Posición (x, y) | Tamaño | Contenido |
|---|---|---|---|
| Enlace de regreso | 32, 32 | 64 × 16 | Icono de flecha izquierda (16 px) y texto `Pólizas` en 12 px `text-secondary`. |
| Encabezado de póliza | 32, 72 | 795 × 34 | Título `POL-0000057` (mono medium 28/34) y badge de estado a 197 px del inicio. |
| Acciones | 32, 130 | 795 × 40 | Tres botones de alto 40 en fila, con gap 8: `Registrar pago en caja` (205 px), `Cupón Pago Fácil` (174 px) y `Cancelar póliza` (158 px, sin borde). |
| Ciclo de vida | 32, 194 | 795 × 160 | Tarjeta (padding 24, radio 16, borde hairline). Título `Ciclo de vida` y línea de tiempo de 5 pasos. |
| Aviso de suspensión | 32, 378 | 795 × 50 | Franja con fondo `status-suspendida-bg`, icono 16 px y texto (ver §5). Se muestra solo si la póliza está Suspendida (ver §7). |
| Datos | 32, 452 | 795 × 296 | Tarjeta (padding 24, radio 16). Título `Datos` y 4 filas de 2 campos. |
| Cuotas | 32, 772 | 795 × 787 | Tarjeta (padding 24, radio 16). Encabezado (título y nota) y tabla de 12 filas. |

Detalle de la línea de tiempo (Ciclo de vida, 745 px de ancho, 5 pasos de 149 px):

- Cada paso tiene un nodo (círculo y dos tramos de 2 px a los lados) y debajo, el estado (12 px medium) y una fecha o nota (11 px medium).
- Círculo: 12 px para pasos futuros o pasados; 16 px para el paso actual (`Punto cur`, paso 3).
- Tramos: color `border-strong` para los segmentos que conectan con un paso ya alcanzado y hairline para los demás. El Figma marca el tramo izquierdo del paso 1 como ausente y el derecho del paso 5 como ausente.

Rail derecho (padding 24, 300 px; los bloques son posicionales dentro del rail):

| Bloque | Posición (x, y) | Tamaño | Contenido |
|---|---|---|---|
| Widget deuda vencida | 24, 24 | 252 × 194 | Tarjeta (padding 24, radio 16, borde hairline, gap 12). |
| Widget pagos | 24, 234 | 252 × 458 | Tarjeta (padding 24, radio 16). Lista de 5 pagos. |

Divisor entre columna y rail: rectángulo de 1 px a `x = 1091`, alto 1591, color `border-hairline`.

## 4. Componentes del design system y componentes propios

Del design system (nombres del Figma):

- `Logo/Nexa` (14:5), `NavItem` (14:99), `Icon/*`.
- `Button` (11:42): secundarios `Registrar pago en caja` y `Cupón Pago Fácil`; texto de cancelar sin borde (estilo de texto con color `status-cancelada-text`); primario `Registrar pago en caja` dentro del widget de deuda.
- `Badge/Estado` (11:117): estado de la póliza (encabezado), estados de cuota (tabla) y medio/factura (widget de pagos).
- `Chip` no aparece en esta pantalla.

Componentes propios (a crear en `features/polizas/components`):

- `PolizaEncabezado`: número en mono y badge.
- `PolizaAcciones`: fila de tres acciones.
- `CicloDeVida`: línea de tiempo de 5 pasos (ver D12 sobre cómo se arma).
- `AvisoSuspension`: franja de aviso.
- `PolizaDatos`: tarjeta de datos.
- `CuotasTabla`: tabla de cuotas.
- `DeudaVencidaWidget`: widget de deuda.
- `PagosWidget`: lista de pagos.

## 5. Contenido textual literal

| Elemento | Texto |
|---|---|
| Enlace de regreso | `Pólizas` |
| Título | `POL-0000057` |
| Badge de estado (encabezado) | `Suspendida` (ver nota) |
| Botón 1 | `Registrar pago en caja` |
| Botón 2 | `Cupón Pago Fácil` |
| Botón 3 | `Cancelar póliza` |
| Título ciclo | `Ciclo de vida` |
| Paso 1 | `Pendiente` / `Emitida 25/03/2026` |
| Paso 2 | `Vigente` / `10/04/2026, cuota 1 pagada` |
| Paso 3 | `Suspendida` / `11/10/2026` |
| Paso 4 | `Vigente` / `Al pagar las vencidas` |
| Paso 5 | `Vencida` / `01/04/2027` |
| Aviso | `Se suspendió por 2 cuotas vencidas impagas. Vuelve a Vigente al pagarlas.` |
| Título datos | `Datos` |
| Etiqueta / valor | `Cliente` / `Lucía Benítez` |
| Etiqueta / valor | `DNI` / `35.874.219` (mono) |
| Etiqueta / valor | `Vehículo` / `Fiat Cronos 2021` |
| Etiqueta / valor | `Patente` / `AE781JK` (mono) |
| Etiqueta / valor | `Plan` / `Responsabilidad Civil (RC)` |
| Etiqueta / valor | `Prima` / `$ 10.500,00` (mono 22) |
| Etiqueta / valor | `Vigencia` / `12 meses, 01/04/2026 a 01/04/2027` |
| Etiqueta / valor | `Emitida por` / `Mariela Quiroga` |
| Título cuotas | `Cuotas` |
| Nota cuotas | `Vencen el día 10 de cada mes. Recargo del 5% al vencer.` |
| Encabezados de tabla | `Cuota`, `Vencimiento`, `Importe`, `Estado` |
| Título deuda | `Deuda vencida` |
| Monto deuda | `$ 22.050,00` (mono 22, color `status-cancelada-text`) |
| Detalle deuda | `Cuotas 6 y 7, con recargo del 5%` |
| Botón del widget de deuda | `Registrar pago en caja` |
| Título pagos | `Pagos` |
| Medio (ejemplo) | `Pasarela A`, `Pago Fácil`, `Caja`, `Pasarela B` (ver D8) |
| Factura (ejemplo) | `Facturada`, `Pendiente CAE` |

Filas de la tabla de cuotas (Figma):

| Cuota | Vencimiento | Importe | Estado |
|---|---|---|---|
| `1 de 12` | `10/04/2026` | `$ 10.500,00` | `Pagada` |
| `2 de 12` | `10/05/2026` | `$ 10.500,00` | `Pagada` |
| `3 de 12` | `10/06/2026` | `$ 10.500,00` | `Pagada` |
| `4 de 12` | `10/07/2026` | `$ 10.500,00` | `Pagada` |
| `5 de 12` | `10/08/2026` | `$ 10.500,00` | `Pagada` |
| `6 de 12` | `10/09/2026` | `$ 11.025,00` | `Vencida` |
| `7 de 12` | `10/10/2026` | `$ 11.025,00` | `Vencida` |
| `8 de 12` | `10/11/2026` | `$ 10.500,00` | `Pendiente` |
| `9 de 12` | `10/12/2026` | `$ 10.500,00` | `Pendiente` |
| `10 de 12` | `10/01/2027` | `$ 10.500,00` | `Pendiente` |
| `11 de 12` | `10/02/2027` | `$ 10.500,00` | `Pendiente` |
| `12 de 12` | `10/03/2027` | `$ 10.500,00` | `Pendiente` |

Nota: el encabezado de la tabla no tiene fila de total en B10 (sí la tiene B8).

Notas sobre estos textos:

- `Suspendida` en el encabezado: el texto literal del badge (nodo `23:2149`) es `Suspendida`, confirmado con el nodo de componente `11:103`. Verificado.
- `Pago Fácil` como medio: el enum `MedioPago` tiene `Pasarela`, `PagoFacil` y `Caja` (ver D8).

Textos que el Figma no define: título y mensaje de confirmación de cancelación, texto del modal de motivo, mensaje de éxito de cada acción, texto del estado de carga, texto de error, aria-labels de cada botón e icono, texto del widget de pagos cuando no hay pagos (`NO DEFINIDO`), enlace `Ver todos` (no aparece en el diseño).

## 6. Campos y validaciones

Los campos de esta pantalla son de lectura, salvo el motivo de cancelación.

**Motivo de cancelación** (modal, no está en el Figma; ver D2):

| Aspecto | Regla |
|---|---|
| Obligatorio | Sí. |
| Recorte | Quitar espacios al inicio y al final antes de contar y enviar. |
| Longitud máxima | 200 caracteres, después de recortar (`CancelarPolizaRequest.Motivo`, `[StringLength(200)]`). |
| Texto vacío o solo espacios | Error: el back responde 400 (`El motivo de cancelación es obligatorio.`). El front bloquea el envío igual. |
| Mensaje de error de longitud | El back responde 400 con el mensaje de validación del DTO (`[StringLength(200)]`) o del dominio (`El motivo de cancelación no puede superar los 200 caracteres.`, `Poliza.cs:71`). El texto exacto que llega depende de cuál se dispara primero: confirmar en la implementación. |
| Etiqueta, placeholder y helper | `NO DEFINIDO`. |

**Monto para cobro en caja** (en la acción `Registrar pago en caja`): el back no recibe importe. Se envían solo `cuotaIds`, y el back calcula el total (`PagoCajaRequest`: lista de GUID con mínimo 1, `[MinLength(1)]`, mensaje `Debe indicar al menos una cuota.`). Ver D1.

**Cupón de Pago Fácil**: se pide por cuota (`cuotaId`), no por póliza. Ver D4.

## 7. Estados

**Estado de la póliza** (encabezado, badge y aviso). Las acciones dependen de este valor:

| Estado | Badge | Aviso de suspensión | Cancelar póliza | Registrar pago en caja | Cupón Pago Fácil |
|---|---|---|---|---|---|
| `Pendiente` | `Pendiente` | No | Habilitado | Habilitado si hay cuotas `Pendiente` | Habilitado si hay cuotas `Pendiente` o `Vencida` |
| `Vigente` | `Vigente` | No | Habilitado | Habilitado si hay cuotas `Pendiente` o `Vencida` | Habilitado si hay cuotas `Pendiente` o `Vencida` |
| `Suspendida` | `Suspendida` | Sí | Habilitado | Habilitado si hay cuotas `Vencida` o `Pendiente` | Habilitado si hay cuotas `Vencida` o `Pendiente` |
| `Cancelada` | `Cancelada` | No | Deshabilitado | Deshabilitado (todas las cuotas quedan `Anulada`) | Deshabilitado |
| `Vencida` | `Vencida` | No | Deshabilitado (el back solo cancela Pendiente, Vigente o Suspendida) | Deshabilitado si todas las cuotas están pagadas o anuladas | Deshabilitado si no hay cuotas pendientes |

Fuente de la tabla: `Poliza.Cancelar` (`backend/Aseguradora.Domain/Entities/Poliza.cs:74`) solo acepta `Pendiente`, `Vigente` y `Suspendida`. Las acciones de cobro y cupón salen de RN11 y RN18 (ver §10). La columna de cobro y de cupón es una propuesta: el Figma no define su habilitación (ver D1 y D4).

**Estados de carga y error**:

| Estado | Qué se muestra |
|---|---|
| Cargando | Skeleton de encabezado, datos, cuotas y widgets. Acciones deshabilitadas. Texto: `NO DEFINIDO`. |
| Póliza no encontrada (404) | `La póliza {id} no existe.` (texto del back). Enlace a B9. Texto del título: `NO DEFINIDO`. |
| Error del servidor (500, 502, 503) | Mensaje de error con reintento. Texto: `NO DEFINIDO`. |
| Acción en curso | Botón con spinner y deshabilitado; los demás botones deshabilitados. |
| Éxito de cancelación | Badge a `Cancelada`, cuotas pendientes a `Anulada`, acciones deshabilitadas. Texto de éxito: `NO DEFINIDO`. |
| Éxito de pago en caja | Recarga de cuotas y de deuda. El back devuelve `PagoResponse` (201); texto: `NO DEFINIDO`. |

**Estado de cada cuota** (`EstadoCuota`):

| Estado | Badge en el Figma | Color |
|---|---|---|
| `Pagada` | `Pagada` | Vigente (`status-vigente-bg/text`) |
| `Pendiente` | `Pendiente` | Pendiente (`status-pendiente-bg/text`) |
| `Vencida` | `Vencida` | En el Figma, las filas 6 y 7 usan **colores de Cancelada** (`#fbe5e2` / `#b03a2e`). Ver D7. |
| `Anulada` | No aparece en el Figma | Vencida (según la doc de Badge/Estado). Ver D7. |

**Estado de pago** (widget de pagos, `Medio` y `Factura`): `Facturada` (color Vigente) y `Pendiente CAE` (color Suspendida, según la doc de Badge/Estado). Ver D8.

**Foco**: anillo de foco visible en botones, filas de cuotas y pasos de la línea de tiempo (si son interactivos). Estado de foco del Figma: `NO DEFINIDO`.

## 8. Acciones y navegación

| Acción | Método y ruta | Destino y efecto | Regla |
|---|---|---|---|
| `Pólizas` (regreso) | — | B9, `/polizas` | Siempre habilitado. |
| `Registrar pago en caja` (encabezado) | `POST /api/pagos/caja` con `{ cuotaIds: [...] }` | 201 con `PagoResponse`. Recargar cuotas y deuda. | Ver §7 y D1. |
| `Cupón Pago Fácil` | `GET /api/pagofacil/cuotas/{cuotaId}/cupon` | Muestra el cupón. Ver D4. | Ver §7 y D4. |
| `Cancelar póliza` | `POST /api/polizas/{id}/cancelar` con `{ motivo }` | 200 con `PolizaDetalleResponse`. Recargar la pantalla. | Ver §6 y §7. Confirmación previa: `NO DEFINIDO` (D2). |
| `Registrar pago en caja` (widget de deuda) | `POST /api/pagos/caja` | Igual que el de encabezado. | Pre-seleccionar las cuotas vencidas (6 y 7 en el ejemplo) es una propuesta; ver D1. |
| Fila de cuota | `NO DEFINIDO` | Propuesta: seleccionar la cuota para cobrar o pedir su cupón. | Ver D1 y D4. |
| `Ver todos` (pagos) | — | No aparece en el diseño. | `NO DEFINIDO`. |
| Fila de pago | `NO DEFINIDO` | Propuesta: abrir el detalle del pago (`GET /api/pagos/{id}`) o su factura (`GET /api/pagos/{id}/factura`). | Ver D8. |

Acciones que el Figma **no** muestra y que el back tampoco expone como endpoint manual: suspender y reactivar. Son automáticas (RN09; `Poliza.Suspender` y `Reactivar` se llaman desde la tarea diaria, `docs/AnalisisBack.md` CU14). La pantalla no ofrece esas acciones.

Navegación a otras pantallas desde esta:

- Desde la póliza no hay enlace a la cotización. El back guarda `CotizacionId` (`PolizaDetalleResponse.CotizacionId`), pero el Figma no lo muestra: `NO DEFINIDO`.
- Desde el cliente (`Lucía Benítez`): no hay enlace (el Figma no lo muestra).

## 9. Datos: endpoints y origen de cada campo

Endpoints:

| Método y ruta | Estado | Uso |
|---|---|---|
| `GET /api/polizas/{id}` | Implementado | Carga del encabezado, datos, cuotas (`Cuotas` dentro de `PolizaDetalleResponse`) y ciclo de vida. |
| `GET /api/polizas/{id}/cuotas` | Implementado | Alternativa para refrescar solo las cuotas después de un cobro o cancelación. |
| `POST /api/polizas/{id}/cancelar` | Implementado | Cancelación. Body `{ "motivo": "..." }`. |
| `POST /api/pagos/caja` | Implementado | Cobro en caja. Body `{ "cuotaIds": ["<guid>", ...] }`. 201 con `PagoResponse`. |
| `GET /api/pagos/{id}` | Implementado | Detalle de un pago (si se abre desde el widget de pagos). |
| `GET /api/pagos/{id}/factura` | Implementado | Factura de un pago (con CAE o pendiente de CAE). |
| `GET /api/pagofacil/cuotas/{cuotaId}/cupon` | Implementado | Cupón de Pago Fácil de una cuota. |
| `GET /api/clientes/{id}` | Especificado (US-F1-06) | Nombre y DNI del cliente (`Lucía Benítez`, `35.874.219`). |
| `GET /api/vehiculos/{id}` | Implementado | Marca, modelo y año (`Fiat Cronos 2021`). `Patente` también viene en `PolizaDetalleResponse`. |
| `GET /api/planes/{id}` | Implementado | Nombre del plan. `PolizaDetalleResponse.NombrePlan` ya lo trae (ver abajo). |
| Lista de pagos de una póliza | **No existe en el back.** | Ver D8. |

Mapeo de cada bloque:

**Encabezado.**

| Elemento | Campo | Origen |
|---|---|---|
| Título `POL-0000057` | `Numero` | `GET /api/polizas/{id}` |
| Badge de estado | `Estado` (`EstadoPoliza`) | `GET /api/polizas/{id}` (ver D12) |

**Acciones.** No muestran datos; ver §7 y §8.

**Ciclo de vida** (ver D10 sobre cómo se arma):

| Paso | Estado | Fecha o nota | Origen |
|---|---|---|---|
| 1 | `Pendiente` | `Emitida 25/03/2026` | `FechaEmision` (UTC) → fecha en zona Argentina. Ver D11 (`FechaInicio` distinta). |
| 2 | `Vigente` | `10/04/2026, cuota 1 pagada` | Fecha de pago de la cuota 1 (`CuotaResponse.FechaPago` con `Numero = 1`). Ver D10. |
| 3 | `Suspendida` | `11/10/2026` | **Sin dato en el back** (no hay historial de estados). Ver D10. |
| 4 | `Vigente` | `Al pagar las vencidas` | Texto fijo, no es un dato. |
| 5 | `Vencida` | `01/04/2027` | `FechaFin` (`PolizaDetalleResponse`). |

**Aviso de suspensión.** Visible si `Estado == Suspendida`. Texto fijo con la regla RN09.

**Datos.**

| Campo mostrado | Origen | Estado |
|---|---|---|
| Cliente `Lucía Benítez` | `ClienteId` → `GET /api/clientes/{id}` → `Nombre` y `Apellido` | Especificado (US-F1-06) |
| DNI `35.874.219` | `ClienteId` → `GET /api/clientes/{id}` → campo DNI (nombre exacto a confirmar en US-F1-06) | Especificado (US-F1-06) |
| Vehículo `Fiat Cronos 2021` | `Marca` y `Modelo` de `PolizaDetalleResponse`; año (`Anio`) de `GET /api/vehiculos/{vehiculoId}`. `VehiculoId` viene en `PolizaDetalleResponse`. | Implementado (año de `VehiculoResponse.Anio`) |
| Patente `AE781JK` | `Patente` de `PolizaDetalleResponse` | Implementado |
| Plan `Responsabilidad Civil (RC)` | `NombrePlan` y `CodigoPlan` de `PolizaDetalleResponse`: `{NombrePlan} ({CodigoPlan})` | Implementado (formato a confirmar, ver D13) |
| Prima `$ 10.500,00` | `PrimaMensual` | Implementado |
| Vigencia `12 meses, 01/04/2026 a 01/04/2027` | `VigenciaMeses`, `FechaInicio`, `FechaFin` | Implementado |
| Emitida por `Mariela Quiroga` | **No existe en el back.** `PolizaDetalleResponse` no trae el empleado que emitió. | `NO DEFINIDO` (D5) |

**Cuotas.** Origen: `PolizaDetalleResponse.Cuotas` (`CuotaResponse`: `Id`, `Numero`, `Importe`, `Recargo`, `FechaVencimiento`, `Estado`, `FechaPago`).

| Columna | Campo | Regla |
|---|---|---|
| Cuota | `Numero` | Formato `{Numero} de {VigenciaMeses}` (ver D9 sobre el formato). |
| Vencimiento | `FechaVencimiento` | Formato `dd/MM/yyyy`. |
| Importe | `Importe + Recargo` | Ver D7 sobre si mostrar el total con recargo. |
| Estado | `Estado` (`EstadoCuota`) | Badge (ver §7). |

Nota de texto: `Vencen el día 10 de cada mes. Recargo del 5% al vencer.` es texto fijo de RN07 y RN08.

**Deuda vencida.** Calcular en el front a partir de `Cuotas` con `Estado == Vencida`: suma de `Importe + Recargo`. En el ejemplo: `(10.500 + 525) + (10.500 + 525) = 22.050`. El back no expone un total de deuda para el backoffice (solo el externo `GET /api/externo/clientes/{dni}/deuda`). Ver D1.

Detalle `Cuotas 6 y 7, con recargo del 5%`: lista de números de cuota vencidas + recargo. El formato para más de dos cuotas no está definido: `NO DEFINIDO`.

**Pagos** (lista del widget). Ver D8: **no existe endpoint para listar pagos de una póliza.** Los datos del diseño no se pueden cargar hoy:

| Campo del diseño | Campo del back | Observación |
|---|---|---|
| Fecha del pago | `PagoResponse.FechaAcreditacion` (o `FechaCreacion`) | Requiere el id del pago, que no viene en ningún endpoint de la póliza. |
| Importe | `PagoResponse.Importe` | Ídem. |
| Medio | `PagoResponse.Medio` (`MedioPago`: `Pasarela`, `PagoFacil`, `Caja`) | Las etiquetas `Pasarela A` y `Pasarela B` del Figma no existen en el enum. |
| Factura | `PagoResponse.Factura.Estado` (`EstadoFactura`: `PendienteCae`, `Autorizada`) | Mapeo propuesto: `Autorizada` → `Facturada`; `PendienteCae` → `Pendiente CAE`. Sin factura → sin badge. |

**Errores** de las acciones (ProblemDetails, campo `detail`):

| Acción | Código | Causa |
|---|---|---|
| Cancelar | 400 | Motivo vacío o más de 200 caracteres; estado no cancelable (`Cancelada`, `Vencida`). |
| Cancelar | 404 | Póliza inexistente. |
| Caja | 400 | `cuotaIds` vacío (`Debe indicar al menos una cuota.`); cuota anulada o ya pagada (ver el mensaje del back). |
| Cupón | 400 | La cuota no está `Pendiente` ni `Vencida` (`PagoFacilController.cs:25`). |
| Cupón | 404 | Cuota inexistente. |

## 10. Reglas de negocio visibles (RN##)

- **RN07.** Cada cuota vence el día 10 de cada mes, igual al valor de la prima. Figma: `Vencen el día 10 de cada mes.` (texto de la tarjeta de cuotas).
- **RN08.** Una cuota no pagada al día siguiente de su vencimiento pasa a Vencida y suma un recargo del 5%. Figma: `Recargo del 5% al vencer.`, `Cuotas 6 y 7, con recargo del 5%`, filas 6 y 7 con `Vencida`.
- **RN09.** Con 2 cuotas vencidas impagas, la póliza pasa a Suspendida. Al pagar todas las vencidas, vuelve a Vigente. Figma: aviso de suspensión y paso 4 del ciclo de vida.
- **RN11.** El cliente puede pagar en un solo pago las cuotas impagas que quiera: una, varias o todas, incluso las que todavía no vencieron. Las anuladas no se pueden pagar. Figma: `Registrar pago en caja` (cobro de una o varias cuotas).
- **RN12.** Un pago aprobado marca sus cuotas como Pagadas y genera una factura con CAE. Si ARCA falla, la factura queda `Pendiente CAE`. Figma: badge `Pendiente CAE` en el widget de pagos.
- **RN13.** Al cancelar una póliza, sus cuotas no pagadas pasan a Anulada. No hay reintegros de lo pagado. Figma: `Cancelar póliza`.
- **RN14.** Al llegar la fecha de fin, la póliza pasa a Vencida. Figma: paso 5 del ciclo de vida, `01/04/2027`.
- **RN18.** El cupón de Pago Fácil tiene 42 dígitos y se genera cada vez que se pide. Figma: `Cupón Pago Fácil`.
- **RN19.** Póliza Pendiente con cuota 1 vencida sin pagar pasa a Cancelada.

RN10 y RN20 no aplican a esta pantalla (son del servicio externo y de la web pública).

## 11. Responsive

Solo desktop. Sin frame mobile en el Figma. Propuesta:

- Menos de 1024 px: el rail derecho baja debajo de la columna principal, en el orden: deuda vencida, pagos.
- Las tres acciones del encabezado pasan a una columna de botones de ancho completo.
- La línea de tiempo se convierte en lista vertical (un paso por fila).
- La tabla de cuotas tiene scroll horizontal dentro de su contenedor.

## 12. Accesibilidad

- Título con `<h1>` (`POL-0000057`). Enlace de regreso con texto visible.
- Badge de estado con texto (no solo color).
- Tabla de cuotas con `<table>`, `<th scope="col">` y `<caption>` visualmente oculto `Cuotas de la póliza`.
- Línea de tiempo: `<ol>` con `aria-current="step"` en el paso actual (paso 3). Cada paso con su estado y su fecha como texto.
- Aviso de suspensión: `role="status"` si aparece después de una acción; si está desde la carga, texto normal.
- Acciones: botones con nombre visible. `Cancelar póliza` abre un diálogo modal con foco atrapado, título, motivo con etiqueta visible y contador de caracteres (texto `NO DEFINIDO`), y botón de cierre con `Escape`.
- Acción en curso: `aria-disabled="true"` y región `aria-live="polite"` para el resultado.
- Montos en mono y alineados a la derecha.
- Filas de cuota clicables (si se definen, ver D1): enlace o botón con nombre accesible que incluya cuota y estado.
- Contraste del texto `status-cancelada-text` (`#b03a2e`) sobre blanco y sobre `#fbe5e2`: revisar con la herramienta de contraste antes de cerrar.

## 13. Dudas e inconsistencias Figma ↔ back

**D1. Cobro en caja: selección de cuotas (crítica).** `Registrar pago en caja` manda `cuotaIds`. El Figma no muestra selección de cuotas ni monto. El widget de deuda sugiere cobrar las cuotas 6 y 7 (vencidas). No está definido si el botón cobra todas las vencidas, muestra un selector, o cobra una cuota por vez. Decidir antes de implementar.

**D2. Motivo de cancelación (crítica).** `Cancelar póliza` necesita `motivo` (obligatorio, máximo 200 caracteres). El Figma no muestra modal ni campo, ni texto de confirmación. Decidir: diálogo con campo de motivo y confirmación. Textos: `NO DEFINIDO`.

**D3. Cuotas para la deuda y para el cupón (crítica).** El cupón (`GET /api/pagofacil/cuotas/{cuotaId}/cupon`) pide una cuota, pero el botón `Cupón Pago Fácil` está a nivel de póliza. Decidir: selector de cuota, o cupón de la primera vencida o pendiente. Hoy no hay forma de elegir la cuota en el Figma.

**D4. Cupón: qué mostrar (media).** El Figma no muestra el cupón. El back devuelve `CuponPagoFacilResponse` (código de barras de 42 dígitos, importes y fechas de primer y segundo vencimiento). Decidir si el cupón se muestra en pantalla, se descarga o se imprime.

**D5. Emitida por (media).** El Figma muestra `Mariela Quiroga` como emisor. `PolizaDetalleResponse` no trae el empleado. Sin campo en el back. Decidir si se agrega `EmitidaPorNombre` a la respuesta o se quita el campo.

**D6. Lista de pagos de la póliza (crítica).** No hay endpoint que devuelva los pagos de una póliza. Los `GET /api/pagos/{id}` requieren el id del pago, y ninguna respuesta de póliza o cuota lo trae. Sin este dato, el widget de pagos no tiene fuente. Opciones: `GET /api/polizas/{id}/pagos`, o `pagoId` en `CuotaResponse`. No está en `docs/AnalisisBack.md` §7 ni en `docs/tareas-divididas.md`. Decidir y agregarlo a la spec.

**D7. Importe de cuota vencida y colores de estado (media).** (a) El Figma muestra `$ 11.025,00` en las cuotas vencidas, que es `Importe + Recargo`. El back separa `Importe` (10.500) y `Recargo` (525). Decidir si la columna muestra el total o si se agrega una columna de recargo. (b) El Figma pinta `Vencida` con colores de `Cancelada` (`#fbe5e2`/`#b03a2e`). La doc de `Badge/Estado` asigna a `Vencida` los colores de `status-vencida` (`#eeefec`/`#5c6066`), y dice que `Anulada` usa los de `Vencida`. Confirmar la paleta de `Vencida` de cuota.

**D8. Medios de pago del widget (media).** `Pasarela A` y `Pasarela B` no existen en `MedioPago` (`Pasarela`, `PagoFacil`, `Caja`). Sin id de pasarela en `PagoResponse`. Decidir si se muestra solo `Pasarela`.

**D9. Formato de la cuota (baja).** B10 muestra `1 de 12` bajo el encabezado `Cuota`. B8 muestra `Cuota 1 de 6`. Confirmar formato único.

**D10. Historial de estados del ciclo de vida (crítica).** El back no guarda historial de estados: no hay fecha de suspensión (paso 3: `11/10/2026`) ni de cada cambio. El paso 2 (`10/04/2026, cuota 1 pagada`) se puede armar con `FechaPago` de la cuota 1. El paso 3 no tiene fuente. Opciones: agregar historial de estados, o quitar la fecha del paso 3.

**D11. Fecha de emisión e inicio (media).** El Figma muestra `Emitida 25/03/2026` y `Vigencia 01/04/2026 a 01/04/2027`. En el back, `FechaInicio` = día de emisión (`PolizaService.cs:61`), así que emisión e inicio deberían ser el mismo día. Además, `CalculadorCuotas` pone la cuota 1 en `10/05/2026` para inicio `01/04/2026` (ver B8 D1 y D2): el Figma pone `10/04/2026`. Confirmar la regla.

**D12. Formato del enum en JSON (media).** `Estado` del encabezado y de las cuotas: ver B8 D12. Si llega como número, el mapeo a badge debe hacerse en el front.

**D13. Formato de plan (baja).** `Responsabilidad Civil (RC)` combina `NombrePlan` y `CodigoPlan` con paréntesis. En B8 el mismo plan aparece sin código (`TC Terceros Completo`). Elegir un formato único.

**D14. Año del vehículo (baja).** `PolizaDetalleResponse` no trae el año. Se toma de `GET /api/vehiculos/{id}` (`Anio`). Confirmar que es aceptable una segunda llamada.

**D15. Número de póliza en el título (baja).** El título del Figma usa `POL-0000057`. `PolizaDetalleResponse.Numero` lo trae con el mismo formato (`POL-0000001`). Sin inconsistencia; anotado para verificar en implementación.

**D16. Acción de suspender (baja).** No hay acción manual en el Figma ni en el back. Confirmar que es lo esperado (RN09, automático).

## 14. Referencia Figma

| Elemento | Nodo | URL con node-id |
|---|---|---|
| Frame B10 | `23:1455` | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=23-1455 |
| Panel shell | `23:1457` | …?node-id=23-1457 |
| Columna principal | `23:1459` | …?node-id=23-1459 |
| Volver a pólizas | `23:2143` | …?node-id=23-2143 |
| Encabezado póliza | `23:2147` | …?node-id=23-2147 |
| Título póliza | `23:2148` | …?node-id=23-2148 |
| Badge (encabezado) | `23:2149` | …?node-id=23-2149 |
| Acciones de póliza | `23:2151` | …?node-id=23-2151 |
| Ciclo de vida | `23:2170` | …?node-id=23-2170 |
| Línea de tiempo | `23:2172` | …?node-id=23-2172 |
| Aviso de suspensión | `23:2208` | …?node-id=23-2208 |
| Datos | `23:2212` | …?node-id=23-2212 |
| Cuotas | `23:2699` | …?node-id=23-2699 |
| Tabla cuotas | `23:2703` | …?node-id=23-2703 |
| Rail derecho | `23:1492` | …?node-id=23-1492 |
| Widget deuda vencida | `23:2816` | …?node-id=23-2816 |
| Widget pagos | `23:2822` | …?node-id=23-2822 |
| Lista de pagos | `23:2824` | …?node-id=23-2824 |
