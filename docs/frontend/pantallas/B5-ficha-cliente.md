# B5 · Ficha de cliente (backoffice)

Pantalla del backoffice para empleados y administradores. Muestra los datos de un cliente, sus vehículos, sus pólizas y el estado de su cuenta.

Fuente de verdad: Figma `02 Backoffice`, frame B5 (nodo 23:922). Contrato del back: `backend/Aseguradora.Api/Controllers`, `backend/Aseguradora.Application/Dtos` y `docs/AnalisisBack.md` §3, §4, §7. Estado de los endpoints según `development` a la fecha de este documento. Las capturas del frame se revisaron con `get_screenshot`; los textos de esta página salen de esas capturas y del árbol del nodo.

---

## 1. Propósito y quién la usa

- **Propósito:** ver de un vistazo la ficha de un cliente (identidad, validación en Renaper), sus vehículos con el estado de cada póliza y de la validación DNRPA, sus pólizas y el resumen de su cuenta. Desde acá se disparan las acciones de cliente: editar, dar de baja, cotizar, agregar vehículo y registrar pago en caja.
- **Roles:** Empleado y Administrador (`Politicas.Empleado` acepta los roles Empleado y Administrador, `backend/Aseguradora.Api/Security/AuthenticationExtensions.cs:62-65`).
- Caso de uso: CU05 (consulta de clientes), CU07 (vehículos), CU11 (pólizas), CU13 (cuenta).

## 2. Ruta propuesta y guardas de acceso

- Ruta: `/clientes/:clienteId`. Las pestañas se representan con query param: `?tab=datos | vehiculos | polizas | pagos` (propuesta; ver Dudas D-B5-03).
- Guarda: usuario autenticado con rol Empleado o Administrador. Sin sesión: redirigir a B1 Login (`/login`) conservando la ruta de retorno.
- Sin rol válido: 403 con pantalla de acceso denegado (propuesta; el Figma no tiene frame para esto).
- `clienteId` inexistente: mostrar estado 404 (ver sección 7).
- Pestaña activa por defecto: el Figma muestra **Vehículos** seleccionada. Qué pestaña abre por defecto cuando no hay query param: NO DEFINIDO (ver Dudas).

## 3. Estructura visual (de arriba a abajo)

Medidas del frame: 1440 × 1024. Shell 1392 × 960 en (24, 24) con radio 24 px y sombra `Nexa/Shadow/Shell`. Layout de tres columnas: Sidebar 232 px, Columna principal 859 px, Divider 1 px, Rail derecho 300 px con padding 24 px. Nota: la altura del shell de B5 es 960 px; B6 y B7 usan 976 px. Confirmar la altura correcta con el diseñador.

**Sidebar (232 px, fondo `surface-sidebar`, padding 16 px).**
- Logo/Nexa (arriba).
- Buscar (input de 36 px de alto, deshabilitado en el Figma; ver Dudas).
- Navegación principal: Inicio, Clientes (activo en B5), Vehículos, Cotizaciones, Pólizas, Pagos y facturas, Pago Fácil.
- Divider.
- Navegación admin: Planes, Usuarios. Ver Dudas: el Figma las muestra con el usuario Empleado.
- Usuario al pie: avatar con iniciales, nombre y rol del usuario logueado (`Mariela Quiroga`, `Empleado`). Datos de sesión, no del cliente.

**Columna principal (x 232, padding 32 px, contenido 795 px).**
1. **Volver a clientes** (y 32, 72 × 16): icono flecha izquierda + texto "Clientes". Vuelve a la lista de clientes (B3).
2. **Encabezado cliente** (y 72, alto 66):
   - Avatar circular 56 px con iniciales (fondo `accent-lime-soft`).
   - Nombre en H2 (20 px semibold) y, debajo, metadatos en línea: "DNI 30.123.456", "CUIL 20-30123456-8", badge **Validado** y la etiqueta "Renaper".
   - Acciones a la derecha (x 558, alto 40): botón secundario **Editar** (con icono lápiz) y botón de peligro sin fondo **Dar de baja** (texto rojo, icono papelera).
3. **Pestañas** (y 162, alto 41): Datos, Vehículos, Pólizas, Pagos. Línea divisoria de 1 px en y 40. Pestaña activa con indicador de 2 px en la base.
4. **Lista de vehículos** (y 227, alto 218): una fila por vehículo, separadas por divider de 1 px. Cada fila tiene 109 px de alto:
   - Icono de tipo en caja de 40 × 40 (auto: `Icon/car`; moto: `Icon/motorcycle`).
   - Bloque de datos (x 56): título (Marca Modelo Año), línea de patente (etiqueta "Patente", valor en monoespaciada, y "Tipo · Uso"), y badge **Validado** + etiqueta "DNRPA".
   - Bloque de póliza a la derecha (x 665 aprox.): "Póliza" + número y badge de estado; si no hay póliza activa, texto "Sin póliza activa" y link **Cotizar** con icono de flecha.
5. **Pólizas** (debajo de la lista; el Figma lo muestra sin pestaña activa, ver Dudas): título H3 "Pólizas" y tabla con header y dos filas. Columnas: Número, Vehículo, Plan, Vigencia, Estado, Próx. vencimiento.
6. Posición vertical exacta de la sección Pólizas y de los bloques del rail: NO VERIFICADO en el árbol (la captura confirma el orden, no las coordenadas finales).

**Rail derecho (x 1092, 300 px).**
1. **Cuenta** (título H3 + link "Ver cuotas" a la derecha con icono de flecha):
   - Etiqueta "Deuda vencida" y monto grande en rojo, mono: `$ 26.250,00`. Debajo, texto de apoyo "Cuota 8 con recargo 5%".
   - Divider.
   - Etiqueta "Próxima cuota", fecha `10/11/2026` y monto mono grande `$ 25.000,00`.
2. **Acciones** (título H3) con tres filas-link, cada una con icono a la izquierda y flecha a la derecha: **Nueva cotización**, **Agregar vehículo**, **Registrar pago en caja**.

## 4. Componentes del design system y componentes propios

**Del design system (nombres del Figma):**
- `Logo/Nexa` (nodo 14:5). Marca. Es el único logo hecho a mano.
- `NavItem` (nodo 14:99). Indicador de 2 px a la izquierda; el ítem activo usa texto `text-primary`, los inactivos `text-secondary`. Ítems del Figma: Inicio, Clientes, Vehículos, Cotizaciones, Pólizas, Pagos y facturas, Pago Fácil, Planes, Usuarios.
- `Button` (nodo 11:42). Variantes usadas: Primary (no aplica en B5), Secondary (Editar), Ghost o de peligro para "Dar de baja" (el Figma no define una variante de peligro; ver Dudas D-B5-08). Tamaño M, 40 px.
- `Badge/Estado`. Variantes que aparecen en B5: **Validado** (fondo `status-vigente-bg`, texto verde), **Vigente** (mismo fondo verde), **Vencida** (fondo `status-vencida-bg` gris, sin rojo). Estados Pendiente, Suspendida y Cancelada: NO DEFINIDO en B5 (existe `Badge/Pendiente` en B3).
- `Card/Widget` (usado en el rail: Cuenta, Acciones).
- `Table/Header` y `Table/Row` (pólizas).
- `Icon/*`: arrow-left, pencil-simple, trash, car, motorcycle, arrow-up-right, plus, wallet, calculator, bell, magnifying-glass, dots-three, users, house, file-text, receipt, barcode, list, user-circle.
- Tipografía: `Nexa/H2` (20/26 semibold, título de cliente), `Nexa/H3` (16/22 semibold, títulos de sección), `Nexa/Body` (14/20), `Nexa/Body-sm` (13/18), `Nexa/Label` (12/16 medium), `Nexa/Caption` (11/14 medium), `Nexa/Mono` (JetBrains Mono 13/18, para DNI, CUIL, patente, número de póliza), `Nexa/Mono-lg` (JetBrains Mono 22/28 medium, para montos del rail).

**Componentes propios de la pantalla (propuesta de ubicación según `docs/frontend/00-decisiones-base.md` FB3):**
- `ClienteEncabezado` (features/clientes/components): avatar, nombre, metadatos y acciones.
- `ClienteTabs` (features/clientes/components): pestañas con `?tab=`. No está en la lista de primitivos de FB2; proponer su alta en `@nexa/ui` si se reutiliza.
- `VehiculoFila` (features/vehiculos/components): fila de vehículo. Se exporta desde `features/vehiculos/index.ts`.
- `PolizasTabla` (features/polizas/components), exportada por `features/polizas/index.ts`.
- `CuentaWidget` (features/cuotas/components), exportado por `features/cuotas/index.ts`. Ver Dudas D-B5-05.
- `AccionesRapidas` (features/clientes/components): lista de links del rail.
- `Dato` (par etiqueta/valor, componente de `@nexa/ui`, propuesto).
- `Tabla` (`@nexa/ui` Table, con header y filas).

## 5. Contenido textual literal

| Zona | Texto literal (Figma) |
|---|---|
| Volver | `Clientes` |
| Nombre | `Tomás Iturralde` (dato del cliente) |
| Metadatos | `DNI` `30.123.456` · `CUIL` `20-30123456-8` |
| Badge cliente | `Validado` · etiqueta `Renaper` |
| Botones | `Editar`, `Dar de baja` |
| Pestañas | `Datos`, `Vehículos`, `Pólizas`, `Pagos` |
| Vehículo 1 | `Toyota Etios 2019` · `Patente` `AB123CD` · `Auto · Particular` · badge `Validado` · etiqueta `DNRPA` · `Póliza` `POL-0000042` · badge `Vigente` |
| Vehículo 2 | `Honda CB 190R 2022` · `Patente` `A123BCD` · `Moto · Particular` · badge `Validado` · `DNRPA` · `Sin póliza activa` · link `Cotizar` |
| Título pólizas | `Pólizas` |
| Columnas pólizas | `Número`, `Vehículo`, `Plan`, `Vigencia`, `Estado`, `Próx. vencimiento` |
| Fila 1 pólizas | `POL-0000042` · `Toyota Etios` · `TC` · `01/03/2026 a 01/03/2027` · `Vigente` · `10/11/2026` |
| Fila 2 pólizas | `POL-0000011` · `Toyota Etios` · `RC` · `01/03/2025 a 01/03/2026` · `Vencida` · `-` |
| Cuenta | `Cuenta` · link `Ver cuotas` · `Deuda vencida` · `$ 26.250,00` · `Cuota 8 con recargo 5%` · `Próxima cuota` · `10/11/2026` · `$ 25.000,00` |
| Acciones | `Acciones` · `Nueva cotización` · `Agregar vehículo` · `Registrar pago en caja` |

Textos sin Figma (NO DEFINIDO): mensajes de estado vacío, de error de carga, de confirmación de baja, de error al dar de baja, y la leyenda del badge de Renaper cuando el cliente no está validado.

## 6. Campos y validaciones

Esta pantalla no tiene formularios. Los campos son de solo lectura, salvo lo que se abre con **Editar** (ver sección 8).

| Dato mostrado | Fuente (DTO, campo JSON) | Formato |
|---|---|---|
| Nombre + apellido | `ClienteResponse.nombre`, `apellido` | Texto tal cual |
| DNI | `ClienteResponse.dni` (8 dígitos sin puntos) | Se muestra con puntos de miles: `30.123.456`. Un solo formateador (FB4). |
| CUIL | `ClienteResponse.cuil` | Tal cual (`20-30123456-8`) |
| Validado Renaper | `ClienteResponse.validadoRenaper` | `true` → badge Validado |
| Fecha de validación Renaper | `ClienteResponse.fechaValidacionRenaper` | No se muestra en B5 (ver Dudas) |

Reglas de datos del back que condicionan la vista: RN01 (DNI único), RN02 (cliente validado en Renaper antes de emitir), RN15 (baja lógica, `Activo = false`).

## 7. Estados

| Estado | Qué se muestra |
|---|---|
| Cargando | Skeleton del encabezado (avatar circular + 2 bloques de texto), skeleton de 2 filas de vehículo y skeleton del rail. Sin spinner de página completa. |
| Vacío: sin vehículos | NO DEFINIDO en el Figma. Propuesta: texto "Este cliente no tiene vehículos." + botón Secondary "Agregar vehículo". |
| Vacío: sin pólizas | NO DEFINIDO. Propuesta: "Este cliente no tiene pólizas." |
| Cliente no validado en Renaper | Badge con texto `Pendiente` (variante de `Badge/Pendiente`). El texto de la etiqueta NO DEFINIDO en Figma. |
| Error de carga (red o 5xx) | NO DEFINIDO. Propuesta: alerta inline con el mensaje de `ProblemDetails.detail` y botón `Reintentar`. |
| 404 cliente inexistente | NO DEFINIDO. Propuesta: pantalla "Cliente no encontrado" con link `Volver a clientes`. |
| Éxito tras editar o dar de baja | Refrescar la ficha. Mensaje de éxito NO DEFINIDO. |
| Deshabilitado | `Dar de baja` deshabilitado si el cliente tiene pólizas activas (propuesta, ver Dudas). |
| Foco | Anillo de foco visible en links, botones, pestañas y filas de vehículo. Tokens de foco NO DEFINIDOS en el Figma. |

## 8. Acciones y navegación

| Elemento | Acción | Destino |
|---|---|---|
| Volver a clientes | Navegar | `/clientes` (B3) |
| Editar | Abrir edición de contacto y domicilio | NO DEFINIDO: ¿modal, pantalla o reutilizar B4 "Nuevo cliente"? (Dudas D-B5-02) |
| Dar de baja | Confirmar y ejecutar baja lógica | `DELETE /api/clientes/{id}`. Confirmación NO DEFINIDA. Al terminar, volver a `/clientes`. |
| Pestaña Datos / Vehículos / Pólizas / Pagos | Cambiar `?tab=` | Misma pantalla |
| Fila de vehículo | Abrir detalle del vehículo | NO DEFINIDO: no hay frame de detalle de vehículo en el Figma |
| Cotizar (vehículo sin póliza activa) | Navegar a cotización | `/cotizaciones/nueva?vehiculoId=:id&clienteId=:clienteId` (B7) |
| Número de póliza | Abrir detalle de póliza | NO DEFINIDO (ver B9 Pólizas y la ruta de detalle) |
| Ver cuotas | Abrir cuotas | NO DEFINIDO: ¿pantalla de cuotas por póliza o por cliente? (Dudas D-B5-05) |
| Nueva cotización | Elegir vehículo y cotizar | NO DEFINIDO: el Figma no pide vehículo; B7 necesita `vehiculoId`. Propuesta: abrir selector de vehículos del cliente, o usar solo el link "Cotizar" de cada fila. |
| Agregar vehículo | Navegar | `/clientes/:clienteId/vehiculos/nuevo` (B6) |
| Registrar pago en caja | Navegar | NO DEFINIDO: no hay frame del pago en caja en `02 Backoffice`. El endpoint existe (`POST /api/pagos/caja`). |
| Campana (topbar, si aparece) | Ver notificaciones | NO DEFINIDO |

## 9. Datos: endpoints y origen de cada bloque

Estado de clientes actualizado el 2026-11-04 contra `development` (`8e7df6f`, PR #58); el resto conserva sus fuentes originales.

| Método y ruta | Estado | Uso en B5 |
|---|---|---|
| `GET /api/clientes/{id}` | Implementado (US-F1-06, PR #58) | Encabezado: nombre, DNI, CUIL y badge Renaper del detalle real. No depende de los campos faltantes del resumen. |
| `PUT /api/clientes/{id}` | Implementado (US-F1-06, PR #58) | Editar (contacto y domicilio) |
| `DELETE /api/clientes/{id}` | Implementado (US-F1-06, PR #58) | Dar de baja (baja lógica, RN15) |
| `GET /api/clientes` con filtros | Implementado (US-F1-06, PR #58) | No se usa en B5 (sí en B3) |
| `POST /api/clientes` y `POST /api/clientes/{id}/validar-renaper` | Implementado | No se usan en B5 (sí en B4 y para reintentar validación; el botón de reintento NO está en el Figma) |
| `GET /api/vehiculos?clienteId={id}` | Implementado (en `development`) | Lista de vehículos (Marca, Modelo, Anio, Patente, Tipo, Uso, ValidadoDnrpa, Activo) |
| `GET /api/polizas?clienteId={id}` | Implementado (en `development`) | Pólizas por vehículo (badge del vehículo) y tabla de pólizas. Parámetros: `ClienteId`, `Patente`, `Estado`, `Pagina`, `Tamano` (máx. 100). |
| `GET /api/polizas/{id}/cuotas` | Implementado | Próxima cuota y "Ver cuotas" (por póliza) |
| `GET /api/planes` | Implementado | No se usa en B5 |
| `POST /api/pagos/caja` | Implementado | Solo si se abre "Registrar pago en caja" (pantalla no diseñada) |
| `GET /api/externo/clientes/{dni}/deuda` | Implementado, pero solo con API key (`Politicas.ApiKey`). **No sirve para el usuario logueado.** | No usar |
| Deuda consolidada del cliente para Empleado | **NO DEFINIDO** en el back. | Cuenta (Deuda vencida, Próxima cuota). Ver Dudas. |

**Origen de cada dato mostrado:**

| Dato en pantalla | Fuente |
|---|---|
| Nombre, DNI, CUIL, badge Validado | `GET /api/clientes/{id}` → `nombre`, `apellido`, `dni`, `cuil`, `validadoRenaper` |
| Avatar `TI` | Derivado en el front de las iniciales de `nombre` y `apellido` (no viene del back) |
| Título del vehículo `Toyota Etios 2019` | `VehiculoResponse.marca` + `modelo` + `anio` |
| Patente `AB123CD` | `VehiculoResponse.patente` (en mayúsculas) |
| `Auto · Particular` | `VehiculoResponse.tipo` (enum `TipoVehiculo`: Auto, Moto, Camioneta) + `uso` (`UsoVehiculo`: Particular, Comercial). Separador `·`. |
| Badge `Validado` + `DNRPA` del vehículo | `VehiculoResponse.validadoDnrpa` |
| Badge y número de póliza del vehículo | Primera póliza en estado Pendiente, Vigente o Suspendida de `GET /api/polizas?clienteId=…&patente=…` (RN04). Si no hay ninguna: `Sin póliza activa` + `Cotizar`. |
| Tabla de pólizas: Número, Plan, Vigencia, Estado | `PolizaListItemResponse`: `numero`, `codigoPlan`, `fechaInicio`, `fechaFin`, `estado` |
| Tabla de pólizas: Vehículo `Toyota Etios` | `PolizaListItemResponse` no trae marca ni modelo. Se cruza con la lista de vehículos por `patente`. |
| Tabla de pólizas: Próx. vencimiento | **No viene en `PolizaListItemResponse`.** Requiere `GET /api/polizas/{id}/cuotas`. Ver Dudas D-B5-04. |
| Cuenta: Deuda vencida, Próxima cuota | **NO DEFINIDO.** Ver Dudas D-B5-05. |

Formato de salida en el front: montos `$ 26.250,00` y fechas `dd/MM/yyyy` con un solo formateador de `@nexa/api` o `@nexa/ui` (FB4). Enums mostrados con su etiqueta en español (Auto, Moto, Camioneta; Particular, Comercial).

## 10. Reglas de negocio visibles (RN##)

- **RN01:** DNI y email únicos. No se muestra en B5, pero condiciona el alta.
- **RN02:** cliente validado en Renaper antes de emitir. El badge `Validado` del encabezado refleja este estado.
- **RN03:** patente única; vehículo validado en DNRPA y titular igual al DNI del cliente. El badge `Validado` + `DNRPA` de cada vehículo refleja `validadoDnrpa`.
- **RN04:** un vehículo tiene una sola póliza activa (Pendiente, Vigente o Suspendida). Define el texto `Sin póliza activa` y la aparición del link `Cotizar`.
- **RN08:** cuota no paga al día siguiente del vencimiento pasa a Vencida con recargo del 5%. Coincide con `Deuda vencida $ 26.250,00` = `$ 25.000,00 × 1,05` y con la leyenda `Cuota 8 con recargo 5%`.
- **RN14:** al llegar a la fecha de fin, la póliza pasa a Vencida. Coincide con la fila `POL-0000011` (vigencia que terminó el 01/03/2026, estado `Vencida`).
- **RN15:** la baja es lógica (`Activo = false`); no se borran clientes con historial.
- **RN07:** la cuota vence el día 10 de cada mes. Coincide con `Próxima cuota 10/11/2026` y con `Próx. vencimiento 10/11/2026` de POL-0000042 (vigencia desde 01/03/2026).

Nota de consistencia: la fila `POL-0000042` muestra `Próx. vencimiento 10/11/2026`, pero la cuota 8 (vencimiento 10/10/2026) sigue impaga. Ver Dudas D-B5-04.

## 11. Responsive

No hay frame mobile del backoffice. Solo desktop.

Propuesta (a confirmar): ancho mínimo de diseño 1280 px. Por debajo de eso, el rail derecho pasa debajo de la columna principal, y la tabla de pólizas pasa a scroll horizontal dentro de su contenedor (sin scroll de página).

## 12. Accesibilidad

- Encabezado con `h1` para el nombre del cliente; títulos de sección en `h2` (Vehículos, Pólizas, Cuenta, Acciones).
- Pestañas con patrón `tablist` / `tab` / `tabpanel` y navegación con flechas. El `tabpanel` queda asociado a la pestaña activa.
- Badges: el texto del badge es el estado (no solo color). Respetar el contraste AA del verde `status-vigente-text` sobre `status-vigente-bg`; el gris de `Vencida` tiene que cumplir AA también (verificar).
- Botón `Dar de baja`: texto rojo con icono. Confirmar con diálogo accesible (`role="alertdialog"`), foco inicial en `Cancelar`.
- Monto de deuda: el color rojo no debe ser el único indicador; el texto `Deuda vencida` ya lo dice.
- Montos y patentes con `lang="es-AR"` si se usa un formateador que los envuelva.
- Iconos decorativos con `alt=""`. Links con texto visible (`Cotizar`, `Ver cuotas`) y `aria-label` solo si hay ambigüedad (por ejemplo, "Cotizar Honda CB 190R 2022").

## 13. Dudas e inconsistencias Figma ↔ back

**D-B5-01 · Cliente: detalle disponible.** Resuelto por US-F1-06/PR #58. El detalle devuelve nombre, DNI, CUIL y estado Renaper. El pendiente PB-03 afecta solo los tres campos del resumen de B3, no el encabezado de B5. La cuenta/deuda continúa pendiente PB-28 y su rail oculto (D-33).

**D-B5-02 · Editar cliente: destino NO DEFINIDO.** Opciones: (a) modal con los campos de contacto y domicilio, que es lo que permite `PUT` (AnalisisBack §7: modifica contacto y domicilio); (b) reutilizar la pantalla B4 "Nuevo cliente" en modo edición. Tradeoff: (a) es más rápido y no toca B4; (b) reutiliza validaciones pero mezcla flujo de alta con edición. Decisión del equipo.

**D-B5-03 · Pestañas vs. secciones apiladas.** El Figma muestra cuatro pestañas (Datos, Vehículos, Pólizas, Pagos) con **Vehículos** activa, y a la vez debajo de la lista de vehículos aparece la sección **Pólizas**. Son dos modelos de navegación. Propuesta: sección Pólizas dentro de la pestaña Pólizas; el contenido de Vehículos queda en su pestaña. Pestaña "Datos" y "Pagos": sin contenido diseñado. Confirmar con el diseñador. Pestaña por defecto: NO DEFINIDA.

**D-B5-04 · "Próx. vencimiento" y cuotas.** `PolizaListItemResponse` no trae fecha de próximo vencimiento. Además hay una contradicción de definición: `POL-0000042` muestra `10/11/2026`, pero la cuota 8 (vence 10/10/2026) sigue impaga y forma parte de la `Deuda vencida`. Si "próximo vencimiento" significa "primera cuota no vencida", el valor correcto es 10/11/2026; si significa "primera cuota impaga", sería 10/10/2026. Hay que definirlo. Para `POL-0000011` el Figma muestra `-` (póliza vencida sin cuotas pendientes): confirmar que es la regla.

**D-B5-05 · Cuenta: deuda consolidada para el Empleado NO DEFINIDA (bloqueante para el rail).** El único endpoint de deuda por DNI es `GET /api/externo/clientes/{dni}/deuda`, que exige API key. Para un Empleado con JWT no hay endpoint. Alternativas:
- (a) Nuevo endpoint `GET /api/clientes/{id}/cuenta` (o similar) que devuelva deuda vencida, cuota vencida con recargo y próxima cuota. Pro: la lógica de RN08 queda en el back (regla de Application). Contra: cambio de back y de contrato.
- (b) El front arma la cuenta recorriendo pólizas y cuotas. Contra: N+1 requests, y la regla de recargo queda duplicada en el front. No recomendado.
Recomendación: (a). Mientras tanto, mock.
Además, "Ver cuotas" necesita definir si abre cuotas por póliza (existe `GET /api/polizas/{id}/cuotas`) o un listado por cliente.

**D-B5-06 · Estado del vehículo `Sin póliza activa` y CTA `Cotizar`.** La regla es RN04 (Pendiente, Vigente o Suspendida = activa). El Figma no dice si el link `Cotizar` aparece también cuando el vehículo tiene una póliza Vencida o Cancelada (sí, por RN04). Confirmar.

**D-B5-07 · Badge DNRPA.** El árbol del Figma usa el componente `Badge/Estado` con variante por defecto para los badges DNRPA. La captura muestra `Validado`. Confirmar en Figma que la variante es `Validado` y no `Vigente` (el componente por defecto es `Vigente`).

**D-B5-14 · Enums en el JSON.** Igual que D-B6-05: `Program.cs` no configura `JsonStringEnumConverter`, así que `tipo`, `uso` y `estado` (de vehículo y de póliza) llegan como **números**. Las etiquetas `Auto · Particular`, `Vigente`, `Vencida` de esta pantalla dependen de resolver ese punto (recomendación: convertir a texto en el back).

**D-B5-08 · Botón "Dar de baja".** El Figma lo muestra en texto rojo con icono. No hay variante de peligro en la lista de `Button` (Primary, Secondary, Ghost). Propuesta: variante Ghost con color `status-cancelada-text`. Comportamiento de negocio confirmado por US-F1-06/PR #58: el backend bloquea con 400 si existe póliza Pendiente, Vigente o Suspendida. La baja no cancela pólizas; la UI muestra el `detail` de ese error (D-15). La propuesta visual del botón conserva su estado original.

**D-B5-09 · Acción "Nueva cotización" sin vehículo.** B7 requiere `vehiculoId` (`CotizarVehiculoRequest.VehiculoId`, `[Required]`). El Figma no muestra selector. Decidir si se abre un selector de vehículos o si solo queda el link `Cotizar` de cada vehículo.

**D-B5-10 · Renaper: campos no mostrados.** `ClienteResponse` trae `fechaValidacionRenaper`, pero B5 no la muestra. Tampoco hay texto para el estado "no validado". Confirmar si se agrega.

**D-B5-11 · Sidebar con ítems admin para Empleado.** El Figma muestra Planes y Usuarios a la usuaria Mariela Quiroga, que tiene rol Empleado. Según CU03 (crear empleados, Administrador) y CU08 (ABM de planes, Administrador), esos ítems deberían ocultarse para Empleado. Confirmar con el diseñador. Este punto afecta a todas las pantallas del backoffice.

**D-B5-12 · Campo "Buscar" del sidebar.** En el Figma aparece habilitado (con icono) pero sin función definida. NO DEFINIDO qué busca (clientes, vehículos, pólizas).

**D-B5-13 · Pago en caja.** El acceso "Registrar pago en caja" no tiene frame en `02 Backoffice`. El endpoint existe (`POST /api/pagos/caja`, CU17). Pendiente de diseño.

## 14. Referencia Figma

- Frame B5 Ficha de cliente, nodo `23:922`: https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=23-922
- Página `02 Backoffice`, fileKey `nkiHNA713jSg1zgdz9WIWn`.
- Subnodos citados: encabezado `23:1005`, pestañas `23:1042`, lista de vehículos `23:1057`, Logo/Nexa `14:5`, NavItem `14:99`, Input `11:66`, Select `11:95`, Button `11:42`, Chip `11:126`.
