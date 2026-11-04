# W5 · Cupón Pago Fácil

Pantalla de la web pública (`apps/web-publica`, sin login). Figma: página `01 Web publica`, frame `W5 Cupón Pago Fácil`.

Endpoints usados:
- `POST /api/publico/cupon`: **Especificado** (no existe en `backend/Aseguradora.Api/Controllers/`; lo agrega US-F3-06 en `PublicoCuponController`, ver `docs/tareas-divididas.md` §US-F3-06). Esta pantalla depende de él.
- `GET /api/pagofacil/cuotas/{cuotaId}/cupon`: **Implementado**, pero **solo para Empleado** (`[Authorize(Policy = Politicas.Empleado)]`). La web pública no puede usarlo.

---

## 1. Propósito y quién la usa

- **Quién:** cliente titular de una póliza, sin login, que eligió pagar en efectivo en Pago Fácil desde W4.
- **Qué hace:** muestra el cupón de pago de la cuota para que el cliente lo lleve a una sucursal de Pago Fácil. Permite descargarlo en PDF (**no definido**, ver D7) o imprimirlo.
- **Qué NO hace:** no cobra ni registra el pago. El cobro llega después por rendición de Pago Fácil (CU21).

## 2. Ruta propuesta y guardas de acceso

- **Ruta propuesta:** `/poliza/pagar/pago-facil` (propuesta).
- **Datos de entrada:** estado de navegación desde W4: `{ dni, numeroPoliza, cuotaIds }`. El DNI no va en la URL (`docs/AnalisisBack.md` §7: POST "para que el DNI viaje en el cuerpo y no quede en la URL").
- **Guardas:**
  - Sin estado de navegación (refresh o acceso directo): redirigir a W2 "Consultar póliza". Ruta **NO DEFINIDA**.
  - `cuotaIds` vacío: redirigir a W4.
  - Con más de una cuota: ver D1 (bloqueante). Hoy Figma muestra un solo cupón.

## 3. Estructura visual (de arriba a abajo, frame 1440 × 1061)

- **Backdrop** (node 18:2082): 1440 × 1061, degradado `143.617°` de `rgb(238,242,184)` 0% a `rgb(213,221,227)` 100%.
- **Contenedor de página** (node 18:2081): padding 24, columna, ancho completo.
- **Shell** (node 18:2083): fondo `var(--nexa-surface-panel, white)`, radio 24, sombra `0 24px 60px 0 #3C46281A`, `overflow clip`, ancho completo.
  - **Contenido** (node 18:2084): padding 24, columna.
    1. **PublicNav** (node 14:179 como instancia): alto 72, `padding 0 24`, gap 32. Igual que W4: logo a la izquierda; "Planes", "Contacto" y botón "Consultar póliza" a la derecha.
    2. **Cuerpo** (node 18:2095): padding vertical 40, gap 24, columna centrada.
       - **Cupón de pago** (node 18:2096): tarjeta fondo blanco, borde 1 px `var(--nexa-border-hairline, #e7e8e3)`, radio 16, `padding 40`, gap 24, **ancho fijo 720**, columna.
         - Logo `Logo/Nexa` (node 14:5), gap 8.
         - Título "Cupón de pago" (20/26 SemiBold).
         - **Datos** (node 18:2102): columna, gap 12, texto 13/18. Cuatro filas (`Fila/Póliza`, `Fila/Cuota`, `Fila/Titular`, `Fila/DNI`), cada una con `justify-between`: etiqueta a la izquierda y valor a la derecha.
         - Divisor 1 px (node 18:2115).
         - **Vencimientos** (node 18:2116): dos cajas en fila, gap 16. Cada caja: fondo `var(--nexa-surface-subtle, #f1f2ee)`, radio 12, `padding 16`, gap 4, `flex 1`.
           - Caja 1 "1er vencimiento" (node 18:2117): etiqueta 11/14 Medium, fecha 14/20 regular, importe mono medium 22/28.
           - Caja 2 "2do vencimiento, con recargo 5%" (node 18:2121): misma estructura.
         - **Código de barras** (node 18:2125): columna centrada, gap 8.
           - Barras (node 18:1985): contenedor fila de **560 × 72**, `justify-between`, 95 barras negras de alto 72 (ver punto 4 y D8).
           - Texto de dígitos (node 18:2126): mono 13/18, centrado, ancho 560.
    3. **Acciones** (node 18:2127): fila, gap 12, centrada.
       - Botón "Descargar PDF" (node 18:2132): primario, alto 40, pill, `px 16`, gap 8, icono `icon/Button Descargar PDF` 16 × 16 a la izquierda.
       - Botón "Imprimir" (node 18:2142): secundario, fondo `var(--nexa-surface-panel, white)`, borde 1 px `var(--nexa-border-strong, #d3d5ce)`, alto 40, pill, icono `icon/Button Imprimir` 16 × 16.
    4. Texto de ayuda (node 18:2148): 13/18 regular, color secundario, centrado, ancho 560.
    5. **PublicFooter** (node 18:2322 en la página): ancho completo, fondo `var(--nexa-surface-sidebar, #f5f5f2)`, radio 16, padding 32 40, gap 24.

Medidas clave: tarjeta del cupón 720 px de ancho, padding 40 px, barras 560 × 72 px.

## 4. Componentes del design system que usa (nombres del Figma)

| Componente Figma | Node | Uso en W5 | Descripción de uso (según Figma) |
|---|---|---|---|
| `Shell` | 15:104 | Contenedor blanco | "Floating white app shell: 24px radius, only element with a drop shadow" |
| `Logo/Nexa` | 14:5 | Logo en la tarjeta y en la barra | "Nexa monogram plus wordmark. The only hand-made brand mark." |
| `Button` | 11:42 | "Consultar póliza" (nav), "Descargar PDF" (primario) e "Imprimir" (secundario) | "Primary for the main action of a screen, Secondary for alternatives, Ghost for inline actions. Size M is 40px high" |
| `PublicNav` / `PublicFooter` | 14:179 / 14:189 | Barra y pie | Componentes de página pública |
| `Card/Widget` | 15:49 | No se usa como instancia. La tarjeta del cupón es un frame propio con radio 16 y borde hairline | "Widget container: 16px radius, hairline border, no shadow" (la tarjeta del cupón es más ancha y no tiene título con acción, por eso no se usa) |

Notas de implementación:
- **Barras del código de barras** (nodes 18:1986 a 18:2080, "bar 1" a "bar 95"): son 95 frames rectangulares negros de alto 72 px. El ancho de cada barra es 1, 2, 3 o 4 px según un listado fijo. El contenedor reparte las barras con `justify-between` hasta 560 px. **Este patrón es fijo y no sale de los 42 dígitos del cupón.** Ver punto 6 y D8.
- Los frames `Barcode` de la página (nodes 18:2732 y 18:2734) son **iconos sueltos de 256 × 256** (el icono de escáner con corchetes; ambos usan el mismo asset `fceb1.svg`). Están fuera de W5 en el árbol de nodos y **no** forman parte del cupón. No se implementan en W5.
- Iconos de botones (16 px): `icon/Button Descargar PDF` (download-simple) e `icon/Button Imprimir` (printer). Son assets de Figma: se descargan al repo.

## 5. Contenido textual literal

Copiado tal cual del Figma.

**Barra superior**
- "Planes", "Contacto", "Consultar póliza", marca "N" y "Nexa Seguros" (igual que W4).

**Cupón**
- Título: "Cupón de pago"
- "Póliza" / "POL-0000042"
- "Cuota" / "9 de 12"
- "Titular" / "Tomás Iturralde" (ver D5)
- "DNI" / "30.123.456" (ver D5)
- Caja: "1er vencimiento" / "10/11/2026" / "$ 25.000,00"
- Caja: "2do vencimiento, con recargo 5%" / "17/11/2026" / "$ 26.250,00" (ver D4)
- Código de barras (texto): "104300004212026031000250000000420812000003" (42 dígitos)

**Acciones y ayuda**
- Botón: "Descargar PDF"
- Botón: "Imprimir"
- Ayuda: "Pagá en cualquier sucursal de Pago Fácil. La acreditación puede demorar hasta 72 h hábiles."

**Pie**
- "Teléfono" / "A confirmar"; "Email" / "A confirmar"; "Ubicación" / "Dirección a confirmar"; "Horarios" / "Lunes a viernes, horario a confirmar"; "© 2026 Nexa Seguros. Todos los derechos reservados."

**Textos NO definidos en Figma:** errores de generación del cupón, estado de carga, mensaje de cupón ya pagado o anulado, texto de "tenés más cuotas para pagar" (ver D1).

Formato: importes `$ 25.000,00`; fechas `dd/mm/aaaa`; DNI con puntos (`30.123.456`). El formato del DNI se hace en el front; el back lo envía sin puntos (`^\d{8}$`).

## 6. Campos y validaciones

No hay campos de entrada. La pantalla solo muestra datos.

Entrada para pedir el cupón (`POST /api/publico/cupon`, **Especificado**):
- `dni`: 8 dígitos, `^\d{8}$`. Viene del estado de navegación.
- `numeroPoliza`: máximo 20 caracteres.
- `cuotaId` (una sola cuota por request, según `docs/AnalisisBack.md` §7: "Recibe DNI, número de póliza y cuota").

Reglas del back que definen qué se puede mostrar (`backend/Aseguradora.Application/PagoFacil/CuponPagoFacilService.cs`):
- Solo cuotas **Pendiente** o **Vencida** (RN11). Otra cuota responde error "No se puede generar el cupón de una cuota en estado {Estado} (RN11)." **Texto de Figma NO DEFINIDO** (D6).
- DNI o póliza incorrectos: 404 con el mismo mensaje que cualquier otro error de búsqueda (RN20). El front no debe distinguir los motivos.

### Cómo se calcula cada dato (para entender la pantalla)

Fuente: `CuponPagoFacilService.Armar`.

- **Importe 1er vencimiento:** `Importe + recargo`.
  - Si la cuota es **Vencida**: `recargo = cuota.Recargo` (fijado al vencer, RN08).
  - Si es **Pendiente** y hoy es posterior a su vencimiento (todavía no corrió el job): `recargo = TasaRecargoMora.Calcular(Importe)`.
  - Si no: `recargo = 0`.
- **Fecha 1er vencimiento:** `max(FechaVencimiento, hoy)`.
- **Importe 2do vencimiento:** `Importe + TasaRecargoMora.Calcular(Importe)` (5%, redondeo a centavos).
- **Fecha 2do vencimiento:** `Fecha 1er vencimiento + 10 días` (`CuponPagoFacilService.DiasAlSegundoVencimiento = 10`). Ver D4.
- **Código de barras:** `CodigoBarrasPagoFacil.Generar(...)`, 42 dígitos, con dos dígitos verificadores (módulo 10, pesos 3 y 1; ver el comentario en `backend/Aseguradora.Application/PagoFacil/CodigoBarrasPagoFacil.cs`). El código **no se guarda**: se regenera en cada pedido.

Para la cuota 9 del ejemplo (Pendiente, vence 10/11/2026, importe 25.000,00, recargo 5% = 1.250,00): 1er vencimiento 10/11/2026 por $ 25.000,00; 2do vencimiento 20/11/2026 por $ 26.250,00 (10 días después). Figma muestra 17/11/2026. Ver D4.

## 7. Estados

| Estado | Qué se muestra | Fuente |
|---|---|---|
| Cargando el cupón | **NO DEFINIDO**. Propuesta: esqueleto de la tarjeta con la misma medida (720 px) y "Descargar PDF" / "Imprimir" deshabilitados. | Propuesta |
| Cupón listo | Todo el diseño. | Figma + back |
| Cupón con 2do vencimiento vencido | Figma no lo contempla. Hoy la fecha 2do vencimiento se muestra igual; si ya pasó, marcarla (diseño **NO DEFINIDO**). | Propuesta |
| Error 400 (cuota pagada, anulada o inexistente) | Mensaje del back. Texto y diseño **NO DEFINIDOS**. | Back |
| Error 404 (DNI o póliza incorrectos) | Mensaje genérico de RN20. Texto **NO DEFINIDO**. | Back |
| Error 429 | Mensaje de RN20 (10 intentos por minuto). Texto **NO DEFINIDO**. | Back |
| Error de red | **NO DEFINIDO**. | - |
| Varias cuotas | Ver D1 (bloqueante). | - |
| Vacío | No aplica. Sin cuotas, la guarda del punto 2 redirige a W4. | Propuesta |
| Éxito de descarga/impresión | **NO DEFINIDO**. | - |
| Foco | **NO DEFINIDO**. Igual que W4. | - |

## 8. Acciones y navegación

| Elemento | Acción | Destino |
|---|---|---|
| "Descargar PDF" | Descargar el cupón en PDF. **No hay endpoint de PDF** (D7). | **NO DEFINIDO**. |
| "Imprimir" | Abrir el diálogo de impresión del navegador (`window.print()`) con una hoja de estilos de impresión que oculta barra, pie y botones. | Propuesta. Sin navegación. |
| "Consultar póliza" (nav) | Ir a W2. | W2 (ruta **NO DEFINIDA**). |
| "Planes", "Contacto" (nav) | Igual que W4. | Ver W4 (D7 de W4). |
| Enlaces del pie | No hay enlaces en Figma. | - |
| Volver a W4 o a W3 | **No hay botón de volver en Figma** (D9). | - |

## 9. Datos: endpoints y de qué campo sale cada dato

Respuesta de `POST /api/publico/cupon` = `CuponPagoFacilResponse` (`backend/Aseguradora.Application/Dtos/PagoFacil/CuponPagoFacilResponse.cs`):

| Campo del DTO | Tipo | Se muestra en W5 como | Observación |
|---|---|---|---|
| `CuotaId` | Guid | No se muestra | Clave de la cuota. |
| `NumeroPoliza` | string | "Póliza" | Ej. `POL-0000042`. |
| `NumeroCuota` | int | "Cuota" → "9 de 12" | Falta el total (ver D3). |
| `ImportePrimerVencimiento` | decimal | Importe de la caja "1er vencimiento" | Formato `$ 25.000,00`. |
| `FechaPrimerVencimiento` | DateOnly | Fecha de la caja "1er vencimiento" | Formato `dd/mm/aaaa`. |
| `ImporteSegundoVencimiento` | decimal | Importe de la caja "2do vencimiento" | Formato `$ 26.250,00`. |
| `FechaSegundoVencimiento` | DateOnly | Fecha de la caja "2do vencimiento" | 10 días después del 1er vencimiento (D4). |
| `CodigoBarras` | string (42) | Texto de dígitos bajo las barras | El back lo valida con `CodigoBarrasPagoFacil.Validar` al procesar rendiciones (US-F3-07). El cupón no se vuelve a validar en el front. |

Datos que Figma muestra y que **no están en el DTO**:
- **Titular** ("Tomás Iturralde"): no hay campo. `ConsultaPublicaResponse` tampoco trae el nombre (D5).
- **DNI** ("30.123.456"): no viene del DTO. Es el dato que el cliente tipeó en W2/W3; el front lo puede mostrar desde el estado de navegación (D5).
- **Total de cuotas** ("de 12"): no hay campo en el DTO (D3).
- **N° de cupón**: no existe en Figma ni en el DTO. **No aplica**.
- **CAE**: **no aplica** al cupón de Pago Fácil. El CAE es de la factura (W6).

## 10. Reglas de negocio visibles (RN)

- **RN08**: el recargo del 5% aplica a la cuota vencida. En el cupón aparece como el 2do vencimiento y como el 1er vencimiento si la cuota ya es Vencida.
- **RN11**: solo cuotas Pendientes o Vencidas tienen cupón.
- **RN18**: el cupón sigue el formato de 42 dígitos con dos dígitos verificadores (`CodigoBarrasPagoFacil`). La especificación de layout (la posición de cada campo) **no está en el repo**: está en el PDF de Pago Fácil que pasó la cátedra (`docs/tareas-divididas.md`, US-F3-06, "bloqueante").
- **RN20**: límite de intentos por IP en `/api/publico/*`. Con dos cuotas, el cliente hace dos requests de cupón además de los de consulta.
- **Ayuda en pantalla**: "La acreditación puede demorar hasta 72 h hábiles." No hay regla en el back que defina ese plazo (D10).

## 11. Responsive

No hay frame mobile para W5. **Propuesta** a validar con diseño:
- Tarjeta del cupón a ancho completo con gutter de 16 px (en vez de 720 px fijos). Padding interno 20 px en vez de 40 px.
- Las dos cajas de vencimiento se apilan en columna.
- Código de barras: el contenedor de barras ocupa el ancho disponible y mantiene proporción (no fijar 560 px). Alto 72 px fijo.
- Los 42 dígitos en mono 13/18 ocupan unos 330 px de ancho: caben en un teléfono de 390 px. Si no entran, se puede partir en dos líneas (**propuesta**, diseño **NO DEFINIDO**).
- Botones "Descargar PDF" e "Imprimir" en columna, a ancho completo.
- Barra superior y pie como en W4 (ver W4 punto 11).

## 12. Accesibilidad

- El código de barras visual es decorativo: el contenedor de barras lleva `aria-hidden="true"`.
- El texto de 42 dígitos es visible y se lee como texto. Para que la lectura sea clara, agregar `aria-label` al bloque: "Código de barras: {CodigoBarras}" (el lector lee los dígitos uno por uno si se usa solo el texto; **verificar** con un lector de pantalla).
- Vencimientos y montos: cada caja como bloque con etiqueta y valor juntos. Las fechas en `dd/mm/aaaa` y los montos en fuente mono se leen tal cual.
- Botones con texto visible. Los iconos llevan `alt=""`.
- "Imprimir" abre el diálogo nativo; el foco queda donde estaba al cerrar.
- Orden de foco: barra superior → "Descargar PDF" → "Imprimir" → pie.
- Al cargar, el foco va al título "Cupón de pago" (`h1` o `h2`).

## 13. Dudas e inconsistencias Figma ↔ back

- **D1 (bloqueante). Más de una cuota.** En W4, con Pago Fácil y dos cuotas, la pantalla muestra un solo cupón (cuota 9), pero el cupón es por cuota. ¿Se muestran N cupones (uno por cuota) o no se permite Pago Fácil con más de una cuota?
- **D2 (bloqueante). Endpoint público de cupón inexistente.** `POST /api/publico/cupon` está **Especificado** (US-F3-06). Sin él no hay datos reales. Mientras tanto, la pantalla puede construirse con MSW (regla FB4 de `docs/frontend/00-decisiones-base.md`).
- **D3. Total de cuotas.** "9 de 12": el DTO solo trae `NumeroCuota`. Pedir al back que agregue el total de cuotas de la póliza, o calcularlo desde W3 (`cuotas.length` de la consulta; supuesto).
- **D4 (bloqueante para el dato). Fecha del 2do vencimiento.** Figma muestra **17/11/2026**. El back calcula `1er vencimiento + 10 días` (`DiasAlSegundoVencimiento = 10`), lo que da **20/11/2026** para el 1er vencimiento del 10/11/2026. Hay que corregir el Figma o cambiar la constante. Es un dato de negocio: lo confirma el equipo de back y de diseño.
- **D5. Titular y DNI.** "Tomás Iturralde" no existe en ningún DTO del cupón ni de la consulta. Si el titular debe aparecer, hay que agregar el nombre al DTO del cupón (o a la consulta). El DNI sí se puede mostrar desde el estado de navegación, pero formateado con puntos.
- **D6. Mensajes de error del back.** El texto "No se puede generar el cupón de una cuota en estado {Estado} (RN11)." no tiene diseño en Figma. Confirmar si se muestra tal cual (incluye el código "RN11") o se reemplaza por texto de usuario.
- **D7. Descargar PDF e Imprimir.** No hay endpoint de PDF. `docs/tareas-divididas.md` (US-F3-06) dice que la forma del cupón es JSON y "el PDF queda fuera de alcance". "Imprimir" se resuelve con `window.print()` (propuesta). "Descargar PDF" necesita decisión: quitarlo, generar el PDF en el front (librería a definir, fuera de alcance del back), o agregar un endpoint.
- **D8 (bloqueante para el código de barras). Cómo se dibuja.** El Figma dibuja 95 barras con anchos fijos (1 a 4 px) y las reparte con `justify-between`. No codifica los 42 dígitos. El back no define el esquema de barras: la especificación está en el PDF de Pago Fácil (no está en el repo, `docs/tareas-divididas.md` US-F3-06, "bloqueante"). Opciones:
  1. Pedir al back que devuelva el patrón de barras (lista de anchos), para que el front lo dibuje. Es lo más seguro para la validez del cupón, pero requiere un cambio en el back.
  2. Dibujar en el front con un esquema estándar. Propuesta: **Interleaved 2 of 5 (ITF)**, porque 42 dígitos es una longitud par y ITF codifica pares de dígitos. **Requiere validar contra el PDF de Pago Fácil antes de usarlo**; si no coincide, el cupón no se puede pagar en sucursal.
  3. No dibujar barras reales hasta resolver el layout; mostrar solo el texto de 42 dígitos. Es la opción más segura mientras no haya PDF.
  La decisión es del equipo de back y de cátedra. Hasta entonces, **no** copiar el patrón fijo de Figma como si fuera el código.
- **D9. Sin botón de volver.** Figma no muestra cómo volver a W4 o a W3. Definir si se agrega un enlace "Volver a medios de pago" (**propuesta**).
- **D10. Plazo de acreditación.** "La acreditación puede demorar hasta 72 h hábiles." No hay regla de plazo en el back. Confirmar el texto final (ya aparece en W4 con "(dato de ejemplo)", ver W4 D4).
- **D11. Fecha en el pasado.** Si el cupón se pide después del 2do vencimiento, el back sigue generando el cupón con `fecha1 = hoy`. Figma no muestra ese caso; confirmar el comportamiento visible.

## 14. Referencia Figma

| Elemento | Node ID | URL |
|---|---|---|
| W5 Cupón Pago Fácil (frame) | 18:2081 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2081 |
| Backdrop | 18:2082 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2082 |
| Shell | 18:2083 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2083 |
| Contenido | 18:2084 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2084 |
| Cuerpo | 18:2095 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2095 |
| Cupón de pago (tarjeta) | 18:2096 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2096 |
| Datos | 18:2102 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2102 |
| Vencimientos | 18:2116 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2116 |
| Vencimiento 1er | 18:2117 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2117 |
| Vencimiento 2do (recargo 5%) | 18:2121 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2121 |
| Código de barras (bloque) | 18:2125 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2125 |
| Código de barras (barras, contenedor 560 × 72) | 18:1985 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-1985 |
| Texto de 42 dígitos | 18:2126 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2126 |
| Acciones | 18:2127 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2127 |
| Botón Descargar PDF | 18:2132 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2132 |
| Botón Imprimir | 18:2142 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2142 |
| Texto de ayuda | 18:2148 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2148 |
| Frame suelto "Barcode" (icono 256 × 256) | 18:2732 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2732 |
| Frame suelto "Barcode" (icono 256 × 256, duplicado) | 18:2734 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2734 |
