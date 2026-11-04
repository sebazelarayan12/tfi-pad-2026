# B7 · Cotizar (backoffice)

Pantalla del backoffice donde el empleado ve los planes compatibles para un vehículo, con la prima mensual de cada uno, y elige uno para pasar a emitir la póliza (B8).

Fuente de verdad: Figma `02 Backoffice`, frame B7 (nodo 22:594). Contrato: `backend/Aseguradora.Api/Controllers/CotizacionesController.cs`, `backend/Aseguradora.Application/Dtos/CotizarVehiculoRequest.cs`, `CotizacionResultado.cs` (`CotizacionResultado`, `OpcionCotizacion`), `CotizacionDto.cs`, `PlanResponse.cs`, y `docs/AnalisisBack.md` §3 (CU09, CU10), §4 (RN05, RN06), §7. Estado de endpoints según `development`. Textos verificados contra la captura del frame (`get_screenshot`).

---

## 1. Propósito y quién la usa

- **Propósito:** cotizar un vehículo. El back filtra los planes compatibles (RN05), calcula la prima de cada uno (RN06) y devuelve las opciones con su vencimiento. El empleado elige un plan y pasa a emitir la póliza.
- **Roles:** Empleado y Administrador.
- Casos de uso: CU09 (cotización interna) y CU10 (emisión, B8). La cotización vale 15 días.

## 2. Ruta propuesta y guardas de acceso

- Ruta: `/cotizaciones/nueva?vehiculoId=:vehiculoId&clienteId=:clienteId`.
- Se llega desde B5 con el link **Cotizar** de un vehículo sin póliza activa. El `vehiculoId` es obligatorio (`CotizarVehiculoRequest.VehiculoId` tiene `[Required]`). El `clienteId` se usa para el contexto.
- Sin `vehiculoId`: no hay nada que cotizar. Redirigir a `/clientes` o mostrar el estado de error de sección 7. Ver D-B7-01 para la alternativa de elegir vehículo.
- Guarda: sesión con rol Empleado o Administrador (`Politicas.Empleado`). Sin sesión: B1 Login.
- Vehículo o cliente inexistente: 404 del back.

## 3. Estructura visual (de arriba a abajo)

Frame 1440 × 1024. Shell 1392 × 976 en (24, 24). Sidebar 232 px; Columna principal 859 px con padding 32 px (contenido 795 px); Divider rail 1 px; Rail derecho 300 px con padding 24 px.

**Sidebar.** Igual que B5 y B6. Ítem activo: **Cotizaciones**. Ver D-B7-12 sobre los ítems admin.

**Columna principal.**
1. **Topbar** (y 32, alto 64): título H2 `Nueva cotización` y botón campana circular 36 px a la derecha.
2. **Contenido cotización** (y 120, ancho 795, separación vertical 24 px):
   a. **Encabezado planes** (alto 48): título H2 `Planes compatibles` (20 px semibold) y, debajo, texto Body-sm secundario `Prima mensual = prima base x factores (RN06). La cotización vale 15 días.`
   b. **Lista de planes** (contenedor de 795 px, borde hairline, radio 16 px, alto 328). Tres filas en orden. Cada fila:
      - Radio de 20 px a la izquierda (x 24), borde `border-strong` 1,5 px. Seleccionado: círculo interior negro (`text-primary`).
      - Bloque de datos (x 60, ancho 547): línea 1 con código de plan en Mono (`RC`, `TC`, `TR`) y nombre del plan en SemiBold 16 px; si aplica, chip **Recomendado**. Línea 2: descripción en Body-sm. Línea 3: detalle de cálculo en Mono 13 px (`10.000,00 x 1,00 x 1,10 x 1,00 x 1,00`).
      - Bloque de prima (a la derecha, alineado a la derecha): etiqueta `Prima mensual` (Caption 11 px gris) y monto en Mono 22 px medium (`$ 11.000,00`).
      - Fila seleccionada (TC en el Figma): fondo `accent-lime-soft`. Alto de cada fila: 107, 113 y 106 px (el Figma; la altura real la da el contenido).
      - Separadores de 1 px entre filas.
   c. **Vigencia cotización** (alto 18): icono calendario 16 px + texto `Válida hasta el 12/11/2026`.
   d. **Acciones** (alineadas a la derecha, separación 12 px, alto 40): **Guardar cotización** (Secondary) y **Continuar a emisión** (Primary, con icono de flecha a la derecha, según la captura).

**Rail derecho (x 1092, 300 px).**
1. Widget **Datos de la cotización** (tarjeta blanca, borde hairline, radio 16 px, padding 20 px, ancho 252 px):
   - Título H3 `Datos de la cotización`.
   - Lista de filas etiqueta/valor, con la etiqueta a la izquierda (color secundario) y el valor a la derecha, alineado a la derecha:
     `Cliente` / `Tomás Iturralde`
     `Vehículo` / `Volkswagen Gol Trend 2017` y debajo `AC456FG` (Mono, secundario)
     `Tipo` / `Auto (1,00)`
     `Antigüedad` / `9 años (1,10)`
     `Conductor` / `35 años (1,00)`
     `Uso` / `Particular (1,00)`
   - Link `Cambiar datos` con icono lápiz 16 px, texto Label 12 px.

## 4. Componentes del design system y componentes propios

**Del design system (nombres del Figma):**
- `Button` (11:42): Secondary para "Guardar cotización", Primary para "Continuar a emisión". Tamaño M, 40 px.
- `Chip` (11:126). Variante **Destacado** (fondo lime `accent-lime`, texto `text-primary`, alto 28 px, radio pill). El Figma lo define como "el único que importa en un widget". Texto `Recomendado`. Ver D-B7-04.
- `NavItem` (14:99) y `Logo/Nexa` (14:5): igual que B5.
- Radio: el Figma no lo nombra como componente del DS (los frames se llaman `Radio RC`, `Radio TC`, `Radio TR`). Proponer `RadioCard` como primitivo en `@nexa/ui`, o usar el radio nativo estilizado. Ver Dudas.
- Iconos: calendario de vigencia (en Figma se llama `Frame`, nodo 22:855; renombrarlo a `Icon/calendar` en la librería), `Icon/pencil-simple`, `Icon/bell`, flecha derecha del botón Continuar (nombre no identificado en el árbol; ver D-B7-15).
- Tipografía: `Nexa/H2` (títulos), `Nexa/H3` (nombre del plan, título del widget), `Nexa/Body-sm` (descripciones, filas del widget), `Nexa/Body` (valores), `Nexa/Caption` (etiqueta de prima), `Nexa/Mono` (código de plan, detalle de cálculo, patente), `Nexa/Mono-lg` (monto de prima, 22/28 medium).

**Componentes propios:**
- `PlanesCompatibles` (features/cotizaciones/components): encabezado y lista de tarjetas.
- `PlanOpcionCard` (features/cotizaciones/components): una tarjeta de plan (radio, datos, prima).
- `DatosCotizacionWidget` (features/cotizaciones/components): rail derecho.
- `VigenciaCotizacion` (features/cotizaciones/components): texto de validez.
- Las tarjetas se exponen con `features/cotizaciones/index.ts`. El widget del vehículo y del cliente se alimenta desde `features/vehiculos` y `features/clientes` por sus `index.ts` (FB3, regla 1).

## 5. Contenido textual literal

| Zona | Texto literal |
|---|---|
| Título | `Nueva cotización` |
| Encabezado | `Planes compatibles` |
| Subtítulo | `Prima mensual = prima base x factores (RN06). La cotización vale 15 días.` |
| Plan RC | `RC` · `Responsabilidad Civil` · `Cubre daños a terceros` · `10.000,00 x 1,00 x 1,10 x 1,00 x 1,00` · `Prima mensual` · `$ 11.000,00` |
| Plan TC | `TC` · `Terceros Completo` · chip `Recomendado` · `Cubre daños a terceros, robo e incendio` · `18.000,00 x 1,00 x 1,10 x 1,00 x 1,00` · `Prima mensual` · `$ 19.800,00` |
| Plan TR | `TR` · `Todo Riesgo` · `Cubre daños propios y a terceros` · `27.500,00 x 1,00 x 1,10 x 1,00 x 1,00` · `Prima mensual` · `$ 30.250,00` |
| Vigencia | `Válida hasta el 12/11/2026` |
| Botones | `Guardar cotización`, `Continuar a emisión` |
| Rail título | `Datos de la cotización` |
| Rail etiquetas | `Cliente`, `Vehículo`, `Tipo`, `Antigüedad`, `Conductor`, `Uso` |
| Rail valores | `Tomás Iturralde` · `Volkswagen Gol Trend 2017` · `AC456FG` · `Auto (1,00)` · `9 años (1,10)` · `35 años (1,00)` · `Particular (1,00)` |
| Link | `Cambiar datos` |

Textos NO DEFINIDOS: estado sin planes compatibles, estado de error al cotizar, texto de cotización vencida, texto de "seleccionar un plan" (tooltip del botón deshabilitado), texto de carga.

## 6. Campos y validaciones

Esta pantalla no tiene campos editables. Las validaciones son de flujo:

| Regla | Dónde | Comportamiento |
|---|---|---|
| `vehiculoId` obligatorio | Ruta | Sin valor: no llamar al back. Mostrar estado de error (sección 7). |
| Un plan seleccionado para continuar | Botón Continuar | Deshabilitado sin selección (propuesta; ver D-B7-05). |
| Cotización vigente para continuar | Botón Continuar | Deshabilitado si `fechaVencimiento` ya pasó (propuesta; ver D-B7-09). |

**Formato de salida:**
- Montos: `$ 11.000,00` (prefijo `$` con espacio, miles con punto, decimales con coma; `primaMensual` es `decimal` en ARS, RN16). Un solo formateador (FB4).
- Fecha de vigencia: `dd/MM/yyyy` en hora de Argentina (ver D-B7-11).
- Cálculo de la línea de factores: `primaBase x tipo x antigüedad x edad x uso`, en ese orden, según RN06. Hoy esos valores no vienen del back (D-B7-02).

## 7. Estados

| Estado | Qué se muestra |
|---|---|
| Cargando | Skeleton de tres tarjetas de plan (alto 107 px cada una) y skeleton del rail. El cálculo de la cotización puede tardar: mostrar texto `Calculando planes…` (NO DEFINIDO en el Figma). |
| Éxito | Tres tarjetas con datos. Ninguna seleccionada (propuesta; el Figma muestra TC seleccionada, ver D-B7-05). |
| Sin planes compatibles | NO DEFINIDO. Propuesta: mensaje `No hay planes compatibles para este vehículo.` con link `Volver al cliente`. |
| Error al cotizar (400, 404 o 5xx) | Alerta inline con el `detail` de `ProblemDetails`. Texto NO DEFINIDO. Botón `Reintentar` solo para 5xx o red. |
| Cotización vigente | Texto `Válida hasta el dd/MM/yyyy`. |
| Cotización vencida | NO DEFINIDO. Propuesta: `Vencida el dd/MM/yyyy`, botón Continuar deshabilitado y botón para volver a cotizar. |
| Seleccionado | Fondo `accent-lime-soft`, radio con punto interior, `aria-checked="true"`. |
| Deshabilitado | `Continuar a emisión` deshabilitado sin selección (propuesta). `Guardar cotización` deshabilitado si D-B7-07 se resuelve como eliminar. |
| Foco | Anillo de foco en cada tarjeta (todo el bloque es el control de selección) y en los botones. |

## 8. Acciones y navegación

| Elemento | Acción | Destino |
|---|---|---|
| Campana | Ver notificaciones | NO DEFINIDO |
| Tarjeta de plan (clic o radio) | Seleccionar la opción | Ninguna navegación |
| Continuar a emisión | Navegar a emisión con la cotización elegida | `/polizas/nueva?cotizacionId=:idCotizacion` (B8). El `idCotizacion` es el de la opción seleccionada (`OpcionCotizacion.IdCotizacion`), no el del vehículo. |
| Guardar cotización | NO DEFINIDO (ver D-B7-07) | — |
| Cambiar datos | NO DEFINIDO (ver D-B7-08) | — |
| Sidebar | Navegación | Igual que B5 y B6 |

Vigencia de la póliza (1, 6 o 12 meses): se elige en B8 (CU10 paso 1: "El empleado elige una cotización vigente del cliente y la vigencia"). B7 no pide vigencia.

## 9. Datos: endpoints y origen de cada dato

| Método y ruta | Estado (`development`) | Uso en B7 |
|---|---|---|
| `POST /api/cotizaciones` (body `{ vehiculoId }`) | **Implementado** | Genera una cotización por plan compatible (RN05) y devuelve `CotizacionResultado`. Responde 201. **Escribe en la base** (ver D-B7-01). |
| `GET /api/cotizaciones/{id}` | Implementado | Devuelve una sola cotización (`CotizacionDto`). No devuelve la lista de planes. Útil para B8 o para leer una opción. |
| `GET /api/planes` | Implementado (público) | Descripción de cada plan (`PlanResponse.descripcion`), uniendo por `codigo` con `codigoPlan` (ver D-B7-03). |
| `GET /api/vehiculos/{id}` | Implementado | Widget: `marca`, `modelo`, `anio`, `patente`, `tipo`, `uso`. |
| `GET /api/clientes/{id}` | **Especificado** (US-F1-06); no está en `development` ni en PR #50 | Widget: nombre del cliente y `fechaNacimiento` para la edad del conductor. Mock hasta que se publique. |
| `POST /api/polizas` (B8) | Implementado | Fuera de esta pantalla. Body `{ cotizacionId, vigenciaMeses }` (`EmitirPolizaRequest`). |

**Respuesta de `POST /api/cotizaciones` (`CotizacionResultado`), con nombres JSON camelCase por defecto:**

```json
{
  "fechaVencimiento": "<fecha y hora UTC del vencimiento>",
  "opciones": [
    { "idCotizacion": "guid", "codigoPlan": "RC", "plan": "Responsabilidad Civil", "primaMensual": 11000.00 },
    { "idCotizacion": "guid", "codigoPlan": "TC", "plan": "Terceros Completo", "primaMensual": 19800.00 },
    { "idCotizacion": "guid", "codigoPlan": "TR", "plan": "Todo Riesgo", "primaMensual": 30250.00 }
  ]
}
```

Nota: el ejemplo muestra los importes del Figma. La forma de la respuesta es la del DTO; los nombres JSON camelCase son el comportamiento por defecto de ASP.NET (`Program.cs` no configura naming policy). Enums: ver D-B6-05.

**Origen de cada dato en pantalla:**

| Dato | Fuente |
|---|---|
| Código (`RC`, `TC`, `TR`) | `opciones[].codigoPlan` |
| Nombre del plan | `opciones[].plan` |
| Prima mensual | `opciones[].primaMensual` (ya calculada por el back, RN06) |
| Vigencia "Válida hasta" | `fechaVencimiento` (UTC) |
| Descripción del plan | `GET /api/planes` → `descripcion` (ver D-B7-03) |
| Detalle de cálculo (`10.000,00 x 1,00 x 1,10 x 1,00 x 1,00`) | **No viene del back.** `primaBase` está en `GET /api/planes`; los factores no están en ningún DTO. Ver D-B7-02. |
| Chip `Recomendado` | **No viene del back.** Ver D-B7-04. |
| Vehículo, patente | `GET /api/vehiculos/{id}` |
| Tipo `Auto (1,00)` y factor | `tipo` del vehículo; el factor **no viene del back** (D-B7-02) |
| Antigüedad `9 años (1,10)` | `anio` del vehículo: 2026 − 2017 = 9 años. Factor 1,10 de la faja 6 a 10 años (RN06). Factor no viene del back. |
| Conductor `35 años (1,00)` | Edad calculada desde `fechaNacimiento` del cliente. Factor no viene del back. |
| Uso `Particular (1,00)` | `uso` del vehículo. Factor no viene del back. |

**Verificación de cifras (hecha para este documento):** los tres montos del Figma son consistentes con RN06 y con la tabla de factores: RC 10.000 × 1,00 × 1,10 × 1,00 × 1,00 = 11.000; TC 18.000 × 1,10 = 19.800; TR 27.500 × 1,10 = 30.250. La vigencia 12/11/2026 es 15 días después del 28/10/2026. Los datos del Figma son coherentes entre sí. Lo que falta es que el back devuelva los factores.

## 10. Reglas de negocio visibles (RN##)

- **RN05:** cada plan define qué tipos de vehículo acepta y una antigüedad máxima. Solo aparecen en B7 los planes que pasan el filtro del back. La pantalla no muestra los planes excluidos.
- **RN06:** prima = prima base × factor tipo × factor antigüedad × factor edad × factor uso. Texto del encabezado: `Prima mensual = prima base x factores (RN06). La cotización vale 15 días.` Factores de la tabla: Auto 1,00 · Moto 0,70 · Camioneta 1,20; antigüedad 0 a 5 años 1,00, 6 a 10 años 1,10, más de 10 años 1,25; edad menor de 25 años 1,30, 25 a 65 años 1,00, más de 65 años 1,15; uso Particular 1,00, Comercial 1,40.
- **RN06 (validez):** la cotización vale 15 días. Se muestra en el encabezado y en `Válida hasta`.
- **RN16:** importes en pesos con decimal(18,2); fechas en UTC.
- **CU10 (emisión):** la póliza se emite desde una cotización vigente. Por eso B7 tiene que impedir continuar con una cotización vencida (D-B7-09).

## 11. Responsive

Solo desktop (no hay frame mobile del backoffice). Propuesta (a confirmar): ancho mínimo 1280 px. Por debajo, el rail derecho se apila debajo de la lista y las tarjetas de plan pasan a dos líneas (nombre y prima en la primera, descripción y detalle en la segunda).

## 12. Accesibilidad

- `h1` "Nueva cotización". Encabezado "Planes compatibles" en `h2`.
- La lista de planes es un grupo de radios: `role="radiogroup"` con etiqueta `Planes compatibles`; cada tarjeta es un `radio` con nombre accesible compuesto por código, nombre y prima (por ejemplo, "TC Terceros Completo, prima mensual 19.800,00 pesos, Recomendado").
- Navegación de radios con flechas; `Tab` entra y sale del grupo.
- El chip `Recomendado` es texto dentro del nombre accesible, no solo color.
- Montos legibles por lector de pantalla: `aria-label` con "$ 11.000,00 pesos" si el formato visual se lee mal.
- Fila seleccionada: el estado no depende solo del fondo lime; el radio marca la selección.
- Botón "Continuar a emisión" deshabilitado: usar `aria-disabled` y explicar la causa con texto visible (propuesta: "Seleccioná un plan para continuar").
- Errores con `role="alert"`.

## 13. Dudas e inconsistencias Figma ↔ back

**D-B7-01 · Cuándo se crea la cotización (bloqueante del flujo).** `POST /api/cotizaciones` persiste una cotización por plan compatible. El Figma no tiene botón "Cotizar": muestra directamente los planes. Si B7 llama al POST al montar la pantalla, cada recarga crea tres cotizaciones nuevas. Además, `GET /api/cotizaciones/{id}` devuelve una sola cotización, así que al recargar no hay forma de reconstruir la lista de planes a partir del id. Alternativas:
- (a) Llamar al POST al entrar y guardar el resultado en memoria. Contra: duplica cotizaciones en cada recarga y al volver atrás.
- (b) Llamar al POST desde B5 (link Cotizar), y navegar a B7 con el resultado en el estado de navegación. Contra: al recargar la pantalla se pierde la lista.
- (c) Agregar al back una consulta de la cotización agrupada, por ejemplo `GET /api/cotizaciones?vehiculoId=…&vigentes=true`, que devuelva las opciones vigentes. Pro: recargable y sin duplicar. Contra: cambio de back.
Recomendación: (c) para el comportamiento, y (b) como solución de transición con mock. Decisión del equipo.

**D-B7-02 · Factores y prima base no vienen en la respuesta (bloqueante de la línea de cálculo y del widget).** `OpcionCotizacion` solo trae `idCotizacion`, `codigoPlan`, `plan` y `primaMensual`. El Figma muestra `10.000,00 x 1,00 x 1,10 x 1,00 x 1,00` en cada plan y los factores entre paréntesis en el widget (`Auto (1,00)`, `9 años (1,10)`, etc.). Alternativas:
- (a) Agregar `primaBase` y los factores (tipo, antigüedad, edad, uso) a `OpcionCotizacion` (o un objeto `calculo`). Pro: el front muestra lo que calculó el back; la regla RN06 queda en Application. Contra: cambio de contrato (US-F2-01 y US-F2-06).
- (b) El front calcula los factores desde `anio`, `fechaNacimiento`, `tipo` y `uso`, con la tabla de RN06. Contra: duplica una regla de negocio en el front, lo que va en contra de FB4 y de la regla de CLAUDE.md de que las reglas viven en Application.
Recomendación: (a). El Figma no define qué pasa si no hay factores; por eso el detalle de cálculo queda NO DEFINIDO hasta decidir.

**D-B7-03 · Descripción del plan.** Las descripciones del Figma (`Cubre daños a terceros`, etc.) no vienen en `CotizacionResultado`. Se toman de `GET /api/planes` → `descripcion` (campo de `PlanResponse`). Confirmar que el seed (US-F2-02) carga esos textos. Si no, el texto del Figma es la referencia y hay que cargarlo en el seed.

**D-B7-04 · Chip "Recomendado".** No hay campo que indique la recomendación. Alternativas: (a) marcar TC en el front (regla hardcodeada; no recomendado); (b) agregar un campo (por ejemplo `destacado` en `PlanResponse`) que administre el ADMIN desde el ABM de planes (CU08); (c) quitar el chip. Decisión de producto.

**D-B7-05 · Selección por defecto.** El Figma muestra TC seleccionado. El back no define una opción por defecto. Propuesta: ninguna seleccionada, y Continuar deshabilitado hasta elegir (evita emitir por error). Alternativa: preseleccionar el recomendado (depende de D-B7-04).

**D-B7-06 · Orden de las tarjetas.** El Figma las muestra RC, TC, TR, que también es orden por prima ascendente (11.000 < 19.800 < 30.250). El back no define el orden. Propuesta: ordenar por `primaMensual` ascendente en el front (es presentación, no regla de negocio).

**D-B7-07 · "Guardar cotización" no tiene sentido con el back actual.** Cada cotización ya queda guardada al crearse (`CotizacionService` persiste una por plan). No hay endpoint de "guardar". Propuesta: quitar el botón o convertirlo en "Volver al cliente". Confirmar con el diseñador.

**D-B7-08 · "Cambiar datos" (link del widget).** El destino no está definido. Si cambia el uso o el vehículo, la cotización actual deja de servir y hay que cotizar de nuevo. Propuesta: el link lleva a B6 para cambiar el uso (que hoy se modifica con `PUT /api/vehiculos/{id}`, `ModificarUso`) y, después, vuelve a cotizar. Confirmar.

**D-B7-09 · Cotización vencida.** RN06 dice que la cotización vale 15 días. CU10 pide "una cotización vigente". El Figma no muestra el estado vencido. Propuesta: mostrar `Vencida el dd/MM/yyyy`, deshabilitar Continuar y ofrecer volver a cotizar. Confirmar.

**D-B7-10 · Sin planes compatibles.** El Figma no lo dibuja. Propuesta de texto en la sección 7. Confirmar el texto y si el back responde 200 con lista vacía o 400/404.

**D-B7-11 · Zona horaria de "Válida hasta".** `fechaVencimiento` es `DateTime` en UTC (RN16). Mostrar la fecha en hora de Argentina (UTC−3) puede cambiar el día si la cotización vence de madrugada. Confirmar el criterio (propuesta: mostrar la fecha local del vencimiento).

**D-B7-12 · Sidebar con ítems admin para Empleado.** Igual que B5 (D-B5-11). El Figma muestra Planes y Usuarios al rol Empleado.

**D-B7-13 · Edad del conductor.** `35 años (1,00)` requiere `fechaNacimiento` del cliente (`GET /api/clientes/{id}`, Especificado). La edad se calcula a la fecha de hoy (propuesta). Confirmar si la cotización usa la edad del momento de cotizar o la del alta (el back ya la calcula al cotizar, CU09).

**D-B7-14 · Formato de enums en el JSON (`tipo`, `uso`).** Igual que D-B6-05: sin `JsonStringEnumConverter`, `TipoVehiculo` y `UsoVehiculo` llegan como números. El Figma muestra `Auto (1,00)` y `Particular (1,00)`. Resolver junto con D-B6-05.

**D-B7-15 · Icono de la flecha del botón "Continuar a emisión".** En el árbol del nodo no se identifica el nombre del icono (aparece como `Frame`). Verificar el nombre en Figma para el mapeo a la librería de iconos.

## 14. Referencia Figma

- Frame B7 Cotizar, nodo `22:594`: https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=22-594
- Subnodos citados: encabezado de planes `22:814`, lista de planes `22:817`, plan RC `22:818`, plan TC `22:829`, plan TR `22:843`, vigencia `22:854`, acciones `22:858`, rail `22:631`, widget de datos `22:777`.
- Componentes: Button `11:42`, Chip `11:126`, Logo/Nexa `14:5`, NavItem `14:99`.
