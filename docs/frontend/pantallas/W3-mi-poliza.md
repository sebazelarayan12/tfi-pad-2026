# W3 Mi póliza (web pública)

Estado de la especificación: borrador para el equipo de front. Fuentes visuales: Figma W3 desktop (nodo 18:47, 1440×1374) y W3m mobile (nodo 18:1772, 390×2065). Fuente de contrato: `backend/Aseguradora.Application/Publico/DTOs/ConsultaPublicaResponse.cs`, `backend/Aseguradora.Application/Dtos/PagoPublicoRequest.cs`, `backend/Aseguradora.Api/Controllers/PublicoPagosController.cs`, `backend/Aseguradora.Api/Controllers/PublicoConsultaController.cs`, `docs/AnalisisBack.md` §3 (CU02, CU15, CU20), §4 (RN07, RN08, RN10, RN11, RN18, RN19, RN20) y §7.

## 1. Propósito y quién la usa

- Cliente sin login que consultó su póliza en W2 y ve el detalle: datos de la póliza, cuotas, resumen de pago y ciclo de la póliza.
- Desde aquí elige cuotas impagas y va a pagar (W4) o descarga el cupón de Pago Fácil (W5).
- No modifica datos. Las acciones de pago y cupón salen hacia otras pantallas.

## 2. Ruta propuesta y guardas de acceso

- Ruta propuesta: `/poliza` (PROPUESTA; el Figma no define rutas). Alineada con el prefijo `/poliza/pagar/...` de `W4-elegir-medio-pago.md`.
- Sin sesión. Pública.
- **Datos por `location.state` (propuesta, igual que W4):** la pantalla necesita el resultado de `POST /api/publico/consulta` y el DNI que el usuario ingresó en W2. Ninguno va en la URL ni en `localStorage` (texto del Figma en W2: "no se guardan en este dispositivo"). Si no hay estado de navegación (acceso directo), redirigir a W2 `/consultar-poliza`. Confirmar en el equipo; ver sección 13.
- El DNI y el número de póliza se necesitan también para `POST /api/publico/pagos` y `POST /api/publico/cupon`. Viajan en el mismo estado de navegación.

## 3. Estructura visual

### 3.1 Desktop (frame 1440 × 1374, nodo 18:47)

Contenedor:
- `Backdrop` (nodo 18:48): 1440×1374, degradado lineal 136.34° de `rgb(238,242,184)` a `rgb(213,221,227)`.
- `Shell` (nodo 18:49): ancho 1392 px (desde padding 24 px), radio 24 px, sombra `Nexa/Shadow/Shell`, fondo `--nexa-surface-panel`. Único elemento con sombra.

Regiones de arriba a abajo:

1. **`PublicNav`** (nodo 14:179): alto 72 px, padding horizontal 24 px, gap 32 px. Logo `Logo/Nexa` a la izquierda; "Planes", "Contacto" y botón Primary "Consultar póliza" a la derecha. Igual que W1 y W2.

2. **Contenido** (nodo 18:60): padding 40 px en todos los lados, gap 32 px, columna, ancho completo.
   - **Encabezado** (nodo 18:61), gap 8 px, columna:
     - Título "Mi póliza": H1 28/34 SemiBold, `--nexa-text-primary`, una línea.
     - **Estado de la póliza** (nodo 18:63), fila con gap 12 px, alineada al centro:
       - Número "POL-0000042": JetBrains Mono Regular 13/18, `--nexa-text-secondary`.
       - Badge "Vigente" (Badge/Estado, nodo 11:117): alto 24 px, padding horizontal 12 px y vertical 4 px, pill. Colores de Vigente: fondo `--nexa-status-vigente-bg` (#E3F4EA), texto `--nexa-status-vigente-text` (#1F7A4D). Texto Label 12/16 Medium.

   - **Principal** (nodo 18:67), fila con gap 32 px, alineada arriba. Dos columnas:

     **Columna principal** (nodo 18:68), flex 1, gap 24 px:
     - **Datos de la póliza** (nodo 18:70): fondo `--nexa-surface-panel`, borde 1 px `--nexa-border-hairline`, radio 16 px, padding 20 px, gap 16 px, ancho completo.
       - Título "Datos de la póliza": H3 16/22 SemiBold.
       - Fila 1 (nodo 18:72), gap 32 px, dos columnas de ancho igual (flex 1):
         - "Campo Titular" (nodo 18:73): etiqueta "Titular" (Label 12/16 Medium, `--nexa-text-secondary`), valor "Tomás Iturralde" (Body 14/20 Regular, primario), línea "DNI 30.123.456" (Mono 13/18, secundario). Ver sección 9 y 13: el back no devuelve este dato.
         - "Campo Vehículo" (nodo 18:77): etiqueta "Vehículo", valor "Toyota Etios 2019", línea "Patente AB123CD" (Mono 13/18).
       - Fila 2 (nodo 18:81), gap 32 px:
         - "Campo Plan" (nodo 18:82): etiqueta "Plan", valor "Terceros Completo (TC)".
         - "Campo Vigencia" (nodo 18:86): etiqueta "Vigencia", valor "12 meses", línea "01/03/2026 a 01/03/2027" (Mono 13/18).

     - **Cuotas** (nodo 18:1485), gap 12 px, ancho completo:
       - Título row (nodo 18:1486), `justify-between`, gap 16 px: "Cuotas" (H3 16/22 SemiBold) a la izquierda y "Seleccionar impagas" (Label 12/16 Medium, primario) a la derecha.
       - Texto de ayuda "Vencen el día 10 de cada mes. Recargo del 5% al vencer." (Body-sm 13/18, `--nexa-text-secondary`).
       - **Tabla cuotas** (nodo 18:1490): borde 1 px `--nexa-border-hairline`, radio 12 px (`--nexa-radius-input`), ancho completo, `overflow` oculto.
         - Encabezado (nodo 18:1491), fondo `--nexa-surface-subtle` (#F1F2EE), padding 16/12 px, gap 16 px. Celdas en este orden (de izquierda a derecha):
           1. Espacio de 20 px para el checkbox (nodo 18:1492).
           2. "Cuota" (Label 12/16 Medium, secundario), ancho 160 px.
           3. "Vencimiento" (Label, secundario), flex 1.
           4. "Importe" (Label, secundario, alineado a la derecha), ancho 140 px.
           5. "Estado" (Label, secundario), ancho 120 px.
         - Filas (ver tabla de datos abajo). Cada fila: padding 16/12 px, gap 16 px, borde inferior 1 px `--nexa-border-hairline` (la última también).
           - Checkbox: cuadrado de 20 px. Tres variantes en el Figma:
             a. Sin borde ni fondo (filas Pagada): el Figma dibuja el ícono `check` (nodo 18:1499 y similares) pero en el render no se ve nada. Ver sección 13.
             b. Marcado (fila 8 y 9): fondo `--nexa-action-primary` (#17191C), borde 1 px del mismo color, ícono check blanco de 14 px (nodo I18:1568;18:1499 para la fila 8; I18:1579;18:1499 para la fila 9).
             c. Sin marcar (filas 10 a 12): fondo `--nexa-surface-panel`, borde 1 px `--nexa-border-strong` (#D3D5CE).
           - Texto "Cuota N de 12" (Body 14/20, primario), ancho 160 px.
           - Vencimiento (Body-sm 13/18, secundario), flex 1.
           - Importe (JetBrains Mono Regular 13/18, primario), alineado a la derecha, ancho 140 px.
           - Estado: badge de 24 px (ver colores en sección 4).

     **Columna lateral** (nodo 18:69), ancho 300 px, gap 24 px, alineada arriba:
     - **Resumen de pago** (nodo 18:1296): fondo blanco, borde 1 px `--nexa-border-hairline`, radio 16 px, padding 20 px, gap 16 px, ancho completo.
       - Título "Resumen de pago" (H3 16/22 SemiBold).
       - Fila "Cuotas seleccionadas" (nodo 18:1298), `justify-between`: etiqueta "Cuotas seleccionadas" (Body-sm 13/18, secundario) y valor "8 y 9" (Body 14/20, primario).
       - Bloque "Total a pagar" (nodo 18:1301), gap 4 px: etiqueta "Total a pagar" (Label 12/16 Medium, secundario) y valor "$ 51.250,00" (JetBrains Mono Medium 22/28, primario).
       - Botón "Pagar seleccionadas" (Button Primary, M, nodo 11:42): ancho completo, alto 40 px.
       - Botón secundario "Descargar cupón Pago Fácil" (nodo 18:2736, "Boton cupon"): ancho completo, alto 40 px, fondo `--nexa-surface-panel`, borde 1 px `--nexa-border-strong`, pill. Ícono `Icon/barcode` 16 px (nodo 18:2737, con la imagen de código de barras dentro, nodo 18:2740) y texto "Descargar cupón Pago Fácil" (Body 14/20, primario).
       - Nota "Pago Fácil acredita hasta 72 h hábiles (dato de referencia)." (Caption 11/14 Medium, `--nexa-text-tertiary`).
     - **Ciclo de la póliza** (nodo 18:1311): fondo blanco, borde 1 px `--nexa-border-hairline`, radio 16 px, padding 20 px, gap 16 px.
       - Título "Ciclo de la póliza" (H3 16/22 SemiBold).
       - Fila de estados (nodo 18:1313), gap 8 px: badge "Pendiente" (fondo `--nexa-status-pendiente-bg` #ECEDF7, texto `--nexa-status-pendiente-text` #5A5F8C), ícono `Icon/caret-right` 16 px (nodo 18:1316), badge "Vigente" (colores de Vigente).
       - Texto "Pasa de Pendiente a Vigente al pagarse la cuota 1." (Body-sm 13/18, secundario).

3. **`PublicFooter`** (nodo 14:189): igual a W1 y W2: fondo `--nexa-surface-sidebar`, radio 16 px, padding 32/40, gap 24. Columnas "Teléfono", "Email", "Ubicación", "Horarios" con los valores "A confirmar" y los demás fijos.

**Datos de la tabla de cuotas (desktop, Figma):**

| Fila | Cuota (texto) | Vencimiento | Importe (Figma) | Estado | Checkbox (Figma) |
|---|---|---|---|---|---|
| 1 | Cuota 1 de 12 | 10/03/2026 | $ 25.000,00 | Pagada | sin casilla visible |
| 2 | Cuota 2 de 12 | 10/04/2026 | $ 25.000,00 | Pagada | sin casilla visible |
| 3 | Cuota 3 de 12 | 10/05/2026 | $ 25.000,00 | Pagada | sin casilla visible |
| 4 | Cuota 4 de 12 | 10/06/2026 | $ 25.000,00 | Pagada | sin casilla visible |
| 5 | Cuota 5 de 12 | 10/07/2026 | $ 25.000,00 | Pagada | sin casilla visible |
| 6 | Cuota 6 de 12 | 10/08/2026 | $ 25.000,00 | Pagada | sin casilla visible |
| 7 | Cuota 7 de 12 | 10/09/2026 | $ 25.000,00 | Pagada | sin casilla visible |
| 8 | Cuota 8 de 12 | 10/10/2026, recargo 5% | $ 26.250,00 | Vencida | marcada |
| 9 | Cuota 9 de 12 | 10/11/2026 | $ 25.000,00 | Pendiente | marcada |
| 10 | Cuota 10 de 12 | 10/12/2026 | $ 25.000,00 | Pendiente | sin marcar |
| 11 | Cuota 11 de 12 | 10/01/2027 | $ 25.000,00 | Pendiente | sin marcar |
| 12 | Cuota 12 de 12 | 10/02/2027 | $ 25.000,00 | Pendiente | sin marcar |

Fila 8 "Vencida": el importe mostrado ($ 26.250,00) es el total con recargo (25.000 + 5%). Por eso la columna "Importe" muestra `total`, no `importe`.

### 3.2 Mobile (frame 390 × 2065, nodo 18:1772)

Descripción completa del frame W3m:

- `Backdrop` (nodo 18:1773): 390×2065, degradado lineal 100.70° de `rgb(238,242,184)` a `rgb(213,221,227)`.
- `Shell` (nodo 18:1774): ancho 366 px (padding 12 px del contenedor), radio 24 px, sombra, fondo blanco.
- **Barra superior** "Barra superior" (nodo 18:1775): padding 16 px, `justify-between`. `Logo/Nexa` a la izquierda (nodo 14:5) e `icon/menu` 20 px a la derecha (nodo 18:1780).
- **Contenido** (nodo 18:1782): padding superior 8 px, inferior 24 px, horizontal 20 px, gap 24 px.
  - Encabezado (nodo 18:1783): "Mi póliza" (H1 28/34), y debajo la fila "POL-0000042" + badge "Vigente".
  - **Datos de la póliza** (nodo 18:1789): tarjeta con padding 16 px, gap 16 px. Título y luego cuatro campos apilados, cada uno con etiqueta (Label 12/16 Medium), valor (Body 14/20) y, cuando aplica, línea mono:
    - "Titular" / "Tomás Iturralde" / "DNI 30.123.456" (nodo 18:1791).
    - "Vehículo" / "Toyota Etios 2019" / "Patente AB123CD" (nodo 18:1795).
    - "Plan" / "Terceros Completo (TC)" (nodo 18:1799).
    - "Vigencia" / "12 meses" / "01/03/2026 a 01/03/2027" (nodo 18:1802).
  - **Cuotas** (nodo 18:1806), gap 12 px:
    - Fila de título (nodo 18:1807): "Cuotas" (H3 16/22) a la izquierda y "Seleccionar impagas" (Label 12/16) a la derecha.
    - Ayuda "Vencen el día 10 de cada mes. Recargo del 5% al vencer." (Body-sm 13/18, secundario).
    - **Tabla cuotas** (nodo 18:1811): borde 1 px `--nexa-border-hairline`, radio 12 px. A diferencia del desktop, **no tiene fila de encabezado**. Cada fila es una tarjeta de lista (nodo "Cuota/Fila movil", 18:1823 y similares), padding 16/12 px, gap 12 px, borde inferior 1 px:
      - Checkbox 20 px (mismas tres variantes que desktop).
      - Columna de textos (flex 1): "Cuota N de 12" (Body 14/20) y debajo la fecha de vencimiento (Caption 11/14 Medium, secundario). Para la cuota 8: "10/10/2026, recargo 5%".
      - Columna de importes (alineada a la derecha, gap 4 px): importe o total en JetBrains Mono 13/18 y debajo el badge de estado.
      - Filas en orden 1 a 12. Las filas 1 a 7 son Pagada; la 8 Vencida y marcada; la 9 Pendiente y marcada; la 10 a 12 Pendiente sin marcar.
  - Botón secundario "Descargar cupón Pago Fácil" (nodo 18:2742): ancho completo, alto 40 px, pill, borde 1 px `--nexa-border-strong`, ícono barcode 16 px (nodo 18:2743) y texto (nodo 18:2745).
  - **Ciclo de la póliza** (nodo 18:1954): tarjeta, padding 16 px, gap 12 px. Título, fila de badges "Pendiente" > "Vigente" (nodo 18:1956) y el texto "Pasa de Pendiente a Vigente al pagarse la cuota 1." (nodo 18:1963, Body-sm 13/18).

- **Pie de contacto** (nodo 18:2164): fondo `--nexa-surface-subtle` (#F1F2EE), padding 20 px, gap 12 px. Cuatro bloques en columna (etiqueta Label 12/16 Medium, secundario, y valor Body 14/20 primario): "Teléfono" / "A confirmar", "Email" / "A confirmar", "Ubicación" / "Dirección a confirmar", "Horarios" / "Lunes a viernes, horario a confirmar". Debajo, copyright (Caption 11/14, tertiary).

- **Barra de pago fija** "Barra de pago" (nodo 18:1979): al pie del frame, fondo blanco, borde superior 1 px `--nexa-border-hairline`, padding 20/16 px, `justify-between`:
  - Izquierda "Total" (nodo 18:1980): etiqueta "Total a pagar (cuotas 8 y 9)" (Caption 11/14 Medium, secundario) y valor "$ 51.250,00" (Mono-lg 22/28 Medium, primario).
  - Derecha: botón Primary, size M, label "Pagar".

Diferencias desktop ↔ mobile:
- Desktop: tabla con encabezado y cuatro columnas. Mobile: lista de tarjetas sin encabezado.
- Desktop: "Resumen de pago" en la columna lateral con los botones "Pagar seleccionadas" y "Descargar cupón Pago Fácil". Mobile: no hay columna lateral; el cupón queda debajo de la tabla y el total y el botón van en una barra fija al pie.
- Desktop: el botón dice "Pagar seleccionadas". Mobile: "Pagar". Los dos textos son del Figma; ver sección 13.
- Desktop: el ciclo de la póliza va en la columna lateral. Mobile: va después de la tabla.
- Desktop: pie con cuatro columnas en fila (`PublicFooter`). Mobile: pie "Pie de contacto" en columna.

## 4. Componentes del design system y propios

| Componente (nombre Figma) | Nodo | Uso en W3 | Descripción de Figma |
|---|---|---|---|
| `Shell` | 18:49 (desktop) / 18:1774 (mobile) | Contenedor | "Floating white app shell: 24px radius, only element with a drop shadow (Nexa/Shadow/Shell). Sits 24px inside the Backdrop." |
| `Logo/Nexa` | 14:5 | Nav / barra superior | "Nexa monogram plus wordmark. The only hand-made brand mark." |
| `Button` (Primary, M) | 11:42 | "Pagar seleccionadas" (desktop), "Pagar" (mobile barra), "Consultar póliza" (nav) | "Pill button. Primary for the main action of a screen, Secondary for alternatives, Ghost for inline actions. Size M is 40px high, S is 32px high." |
| `Button` (outlined, "Boton cupon") | sin nodo de componente (instancia en 18:2736 y 18:2742) | "Descargar cupón Pago Fácil" | Figma no lo define como variante del componente `Button`. Ver sección 13. |
| `Badge/Estado` | 11:117 | Estado de la póliza, de cada cuota y ciclo | "Status badge for policy and cuota states. Colors map to semantic status tokens only. Pagada and Validado use Vigente colors, Pendiente CAE uses Suspendida colors, Anulada uses Vencida colors." |
| `Cuota/Fila` | 18:1507 (desktop) | Fila de la tabla de cuotas | Componente propio del Figma (no tiene descripción). |
| `Cuota/Fila movil` | 18:1823 (mobile) | Fila de la lista mobile | Componente propio. |
| `Checkbox` | 18:1498 / 18:1813 | Selección de cuotas | Sin descripción en el Figma. Tres variantes dibujadas (sin borde, marcado, sin marcar). |
| `PublicNav`, `PublicFooter` | 14:179, 14:189 | Barra y pie desktop | |
| Íconos | `icon/check` (18:1499 y similares), `icon/barcode` (18:2737), `icon/caret-right` (18:1316), `icon/menu` (18:1780) | Checkbox, cupón, ciclo, barra mobile | SVG; usar el asset descargado con sus medidas raíz. |

Componentes propios de la pantalla (dominio `polizas` o `pagos`, decisión del equipo):
- `DatosPoliza` (tarjeta con cuatro campos).
- `TablaCuotas` (desktop) y `ListaCuotasMobile` (mobile). Un solo componente con dos presentaciones, o dos componentes con un hook compartido (`useSeleccionCuotas`). Recomendación: hook compartido para la selección y el total, y dos componentes de presentación.
- `ResumenPago` (desktop) y `BarraPagoMobile` (mobile). Mismo cálculo.
- `CicloPoliza` (tarjeta de estados; ver sección 13 sobre si es dinámica).

Regla del equipo: el cálculo de selección y total va en un hook (`useSeleccionCuotas`), no en el componente de página. La página sólo compone (FB3).

## 5. Contenido textual literal

| Ubicación | Texto literal |
|---|---|
| Título | `Mi póliza` |
| Número de póliza | `POL-0000042` |
| Estado (badge) | `Vigente` |
| Card "Datos de la póliza", título | `Datos de la póliza` |
| Titular, etiqueta | `Titular` |
| Titular, valor | `Tomás Iturralde` |
| Titular, documento | `DNI 30.123.456` |
| Vehículo, etiqueta | `Vehículo` |
| Vehículo, valor | `Toyota Etios 2019` |
| Vehículo, patente | `Patente AB123CD` |
| Plan, etiqueta | `Plan` |
| Plan, valor | `Terceros Completo (TC)` |
| Vigencia, etiqueta | `Vigencia` |
| Vigencia, valor | `12 meses` |
| Vigencia, fechas | `01/03/2026 a 01/03/2027` |
| Cuotas, título | `Cuotas` |
| Cuotas, acción | `Seleccionar impagas` |
| Cuotas, ayuda | `Vencen el día 10 de cada mes. Recargo del 5% al vencer.` |
| Encabezado tabla (desktop) | `Cuota`, `Vencimiento`, `Importe`, `Estado` |
| Filas | `Cuota 1 de 12` … `Cuota 12 de 12` |
| Vencimiento con recargo | `10/10/2026, recargo 5%` |
| Estados | `Pagada`, `Vencida`, `Pendiente`, `Vigente` |
| Resumen, título | `Resumen de pago` |
| Resumen, etiqueta | `Cuotas seleccionadas` |
| Resumen, valor de ejemplo | `8 y 9` |
| Resumen, total | `Total a pagar` |
| Botón desktop | `Pagar seleccionadas` |
| Botón cupón | `Descargar cupón Pago Fácil` |
| Nota cupón | `Pago Fácil acredita hasta 72 h hábiles (dato de referencia).` |
| Ciclo, título | `Ciclo de la póliza` |
| Ciclo, estados | `Pendiente` > `Vigente` |
| Ciclo, texto | `Pasa de Pendiente a Vigente al pagarse la cuota 1.` |
| Barra mobile, etiqueta | `Total a pagar (cuotas 8 y 9)` |
| Barra mobile, botón | `Pagar` |
| Pie | `Teléfono`, `A confirmar`, `Email`, `A confirmar`, `Ubicación`, `Dirección a confirmar`, `Horarios`, `Lunes a viernes, horario a confirmar`, `© 2026 Nexa Seguros. Todos los derechos reservados.` |

Importes en el Figma: `$ 25.000,00`, `$ 26.250,00`, `$ 51.250,00`.

## 6. Campos y validaciones

No hay campos de entrada. Las casillas de cuota son la única selección.

Reglas de selección (RN11, `AnalisisBack.md` §4):
- Se puede seleccionar cualquier cuota impaga: Pendiente o Vencida, incluso si todavía no venció (RN11).
- No se puede seleccionar Pagada.
- No se puede seleccionar Anulada (RN11: "Las anuladas no se pueden pagar").
- El back exige que todas las cuotas sean de la misma póliza (`PagoPublicoRequest.CuotaIds`: "Todas deben ser de la póliza indicada.").
- El back limita a 24 cuotas por pago (`PagoPublicoRequest.MaximoCuotas` = 24). El Figma no muestra este límite. Ver sección 13.
- Mínimo: 1 cuota (`[MinLength(1)]`, mensaje "Debe indicar al menos una cuota."). El botón "Pagar seleccionadas" sin selección: NO DEFINIDO en el Figma (ver sección 7).
- Si se intenta pagar con 0 cuotas, el back responde 400 con "Debe indicar al menos una cuota.". El front no debe llegar a enviar esa petición.

Cálculo del total (propuesta, verificar con RN16 y RN08):
- Total de una cuota = `total` del DTO (`importe + recargo`).
- Total a pagar = suma de `total` de las cuotas seleccionadas. Con las cuotas 8 y 9 del Figma: 26.250 + 25.000 = 51.250. Coincide con el Figma.
- Formato: `$ 51.250,00` con un formateador compartido (FB4).

Casillas de "Seleccionar impagas": selecciona todas las cuotas con estado Pendiente o Vencida (NO DEFINIDO si ya seleccionadas quedan igual).

## 7. Estados

| Estado | Qué se ve | Fuente |
|---|---|---|
| Cargando la póliza | NO DEFINIDO en el Figma. Propuesta: esqueleto de la card de datos y de la tabla. | |
| Vacío (póliza sin cuotas) | NO DEFINIDO. Por RN07 una póliza tiene al menos una cuota. | |
| Sin estado de navegación (acceso directo) | Redirige a W2 (propuesta, sección 2). | NO DEFINIDO |
| Póliza Vigente | Badge "Vigente" verde. | Figma (nodo 18:63). |
| Póliza Pendiente / Suspendida / Cancelada / Vencida | NO DEFINIDO en el Figma: sólo está dibujada la Vigente. El back devuelve `VIGENTE`, `PENDIENTE`, `SUSPENDIDA`, `CANCELADA`, `VENCIDA`. Falta el texto y el color de Suspendida, Cancelada y Vencida. | |
| Cuota Pagada | Badge "Pagada" verde, sin casilla visible. | Figma (filas 1 a 7). |
| Cuota Pendiente, sin marcar | Badge "Pendiente", casilla vacía con borde. | Figma (filas 10 a 12). |
| Cuota Pendiente, marcada | Casilla oscura con check, badge "Pendiente". | Figma (fila 9). |
| Cuota Vencida, marcada | Casilla oscura, badge "Vencida" (rojo), importe con recargo. | Figma (fila 8). |
| Cuota Anulada | NO DEFINIDO en el Figma. Propuesta: badge "Anulada" con colores de Vencida (según la descripción de Badge/Estado). Sin casilla (RN11). | |
| Ninguna cuota marcada | "Cuotas seleccionadas" vacío o "—"; total "$ 0,00"; botón "Pagar seleccionadas" deshabilitado. NO DEFINIDO. | |
| Error al cargar (consulta fallida) | NO DEFINIDO. | |
| Pago iniciado | Navega a W4 con las cuotas. | Ver W4. |
| Cupón en curso | NO DEFINIDO. Propuesta: botón con spinner. | |
| Cupón con error | NO DEFINIDO. | |

## 8. Acciones y navegación

| Elemento | Acción | Destino |
|---|---|---|
| Casilla de cuota (pagada: no) | Selecciona o quita la cuota del resumen | Sin navegación. Actualiza "Cuotas seleccionadas" y el total. |
| "Seleccionar impagas" | Marca todas las cuotas Pendiente y Vencida | Sin navegación. |
| "Pagar seleccionadas" (desktop) / "Pagar" (mobile) | Envía las cuotas elegidas a W4 | W4 (`Elegir medio de pago`), ruta NO DEFINIDA. Pasar `dni`, `numeroPoliza` y `cuotaIds` (solo en memoria, no en URL). |
| "Descargar cupón Pago Fácil" | Pide el cupón de Pago Fácil de la cuota seleccionada | W5 (`Cupón Pago Fácil`). Ver sección 9: el endpoint del cupón es Especificado. |
| Nav "Consultar póliza", "Planes", "Contacto", logo | Igual que W2 | Ver W1 y W2. |
| Footer | Sin acciones | |

Preguntas de navegación:
- Cupón: el Figma dice "Descargar" pero el destino es W5 (`Cupón Pago Fácil`). ¿Descarga directa o pantalla intermedia? El Figma usa la palabra "Descargar" (en la acción) y W5 es una pantalla. Ver sección 13.
- Si hay varias cuotas seleccionadas, ¿el cupón cubre sólo una? El endpoint recibe **una** cuota (`numeroCuota`). El botón del Figma no pide elegir cuota. NO DEFINIDO. Ver sección 13.

## 9. Datos: endpoints y campos

### 9.1 Carga de la pantalla

Usa el resultado de `POST /api/publico/consulta` obtenido en W2 (no vuelve a llamarse salvo que el equipo lo decida). Estado: **Implementado** (existe en `development`, `PublicoConsultaController.cs`).

| Dato en pantalla | Campo JSON de `ConsultaPublicaResponse` | Transformación |
|---|---|---|
| "POL-0000042" | `numeroPoliza` | Tal cual. |
| Badge de estado | `estado` | Mapear desde MAYÚSCULAS: `VIGENTE` → "Vigente", etc. Los textos de Suspendida, Cancelada y Vencida son NO DEFINIDOS (sección 13). |
| "Terceros Completo (TC)" | `plan.nombre`, `plan.codigo` | Propuesta: `${plan.nombre} (${plan.codigo})`. Confirmar con el seed que `codigo` sea "TC" para el plan Terceros Completo. |
| "Toyota Etios 2019" | `vehiculo.marca`, `vehiculo.modelo`, `vehiculo.anio` | `${marca} ${modelo} ${anio}`. |
| "Patente AB123CD" | `vehiculo.patente` | `Patente ${patente}`. |
| "12 meses" | No viene en la respuesta | NO DEFINIDO: propuesta, calcular la cantidad de meses entre `vigenteDesde` y `vigenteHasta`. Confirmar. |
| "01/03/2026 a 01/03/2027" | `vigenteDesde`, `vigenteHasta` (ISO `YYYY-MM-DD`) | Formato `dd/MM/yyyy`. `DateOnly` no tiene hora ni zona, así que se formatea directo sin conversión. |
| "Tomás Iturralde" / "DNI 30.123.456" | No viene en la respuesta | NO DEFINIDO: el back no devuelve el titular (sección 13). |
| Lista de cuotas | `cuotas[]` | Ordenada por `numero` (el back ya ordena por `numero`). |
| "Cuota N de 12" | `cuotas[].numero` y cantidad de elementos de `cuotas` | El denominador es `cuotas.length`. |
| Vencimiento | `cuotas[].vencimiento` | `dd/MM/yyyy`. |
| Vencimiento con recargo | `cuotas[].recargo > 0` | Mostrar `dd/MM/yyyy, recargo 5%`. El "5%" está fijo en el Figma (RN08). |
| Importe de la fila | `cuotas[].total` | Total con recargo (en la fila 8 vale $ 26.250,00). |
| Estado de la cuota | `cuotas[].estado` | Mapear: `PAGADA` → Pagada, `PENDIENTE` → Pendiente, `VENCIDA` → Vencida, `ANULADA` → Anulada (texto NO DEFINIDO en el Figma). |
| Id de la cuota (para pagar) | `cuotas[].idCuota` | Se envía en `cuotaIds` de `POST /api/publico/pagos` (W4). |

Nota de estados: el back define la mora (`VENCIDA` y el recargo) en F3 (CU14), por eso el estado guardado puede estar atrasado respecto de la fecha. `ConsultaPublicaService` lo dice: "The surcharge and the Vencida state are owned by F3 (CU14), so this shows what is saved." El front muestra lo que llega. NO recalcular recargos ni estados en el front.

### 9.2 Pagar (sale a W4)

`POST /api/publico/pagos` (Implementado, `PublicoPagosController.cs`). Lo consume W4, no W3. Body `PagoPublicoRequest`:
- `dni` (8 dígitos).
- `numeroPoliza` (texto de hasta 20 caracteres).
- `cuotaIds`: lista de `Guid` (mínimo 1, máximo 24).
- `proveedor`: `pasarela1` o `pasarela2` (texto hasta 30 caracteres; lo elige W4).

W3 sólo arma `cuotaIds` y pasa `dni` y `numeroPoliza` a W4.

### 9.3 Cupón de Pago Fácil (W5)

- `POST /api/publico/cupon`: **Especificado**. Está en `AnalisisBack.md` §7 (línea 551) y en la tarea US-F3-06 de `docs/tareas-divididas.md` (línea 1602): controller `PublicoCuponController`, body `CuponPublicoRequest(Dni, NumeroPoliza, NumeroCuota)`. `NumeroCuota` es el número de cuota, no el `idCuota`. No existe en `development` y ninguna PR abierta lo agrega (las abiertas son #57 y #50). Respuesta prevista: `CuponPagoFacilResponse` (`CuotaId`, `NumeroPoliza`, `NumeroCuota`, importes, fechas, `CodigoBarras` de 42 caracteres). Hasta que el back lo publique, W5 se trabaja con MSW (`00-decisiones-base.md` FB4).
- `GET /api/pagofacil/cuotas/{cuotaId}/cupon` existe, pero tiene `[Authorize(Policy = Politicas.Empleado)]` (`PagoFacilController.cs`). **No usar desde la web pública**: devuelve 401 o 403 a un cliente sin login.

### 9.4 Errores que pueden aparecer en W3

| Código | Cuándo | Qué mostrar |
|---|---|---|
| 400 | Cuotas vacías o más de 24 | NO DEFINIDO en el Figma. El front valida antes. |
| 404 | La póliza ya no coincide (DNI o número), o una cuota no es de la póliza | NO DEFINIDO. Propuesta: volver a W2 con el mensaje "No encontramos una póliza con esos datos..." (texto de W2). |
| 429 | Más de 10 intentos por minuto por IP (RN20) | Mismo texto que W2: "Hiciste muchos intentos. Esperá un minuto y volvé a probar." |
| 502 / 503 | Falla la pasarela (W4) o el back | NO DEFINIDO en W3 (corresponde a W4). |

## 10. Reglas de negocio visibles

- **RN07.** Una póliza de 12 meses tiene 12 cuotas mensuales que vencen el día 10. El texto "Vencen el día 10 de cada mes." y la lista de 12 cuotas lo reflejan. La póliza nace Pendiente y pasa a Vigente al pagarse la cuota 1: texto del ciclo.
- **RN08.** Una cuota no pagada al día siguiente de su vencimiento pasa a Vencida y suma 5 %. El Figma muestra ", recargo 5%" en la cuota 8 y el importe con recargo ($ 26.250,00 = 25.000 + 5 %).
- **RN09.** Con 2 cuotas vencidas, la póliza pasa a Suspendida. Ningún elemento de W3 lo muestra; el estado Suspendida no tiene texto en el Figma (sección 13).
- **RN10.** Sólo una póliza Vigente da cobertura. El badge "Vigente" lo muestra. Pendiente, Suspendida, Cancelada y Vencida no dan cobertura: el Figma no dice esto en W3 (NO DEFINIDO).
- **RN11.** Puede pagar una, varias o todas las cuotas impagas, incluso las que todavía no vencieron. Las anuladas no se pueden pagar. Reglas de selección en la sección 6.
- **RN18.** El cupón de Pago Fácil tiene 42 dígitos y se genera al pedirlo. La nota "Pago Fácil acredita hasta 72 h hábiles (dato de referencia)." viene del Figma; RN18 no define plazos de acreditación. Confirmar la fuente del dato (sección 13).
- **RN19.** Si la cuota 1 de una póliza Pendiente vence sin pagarse, la póliza pasa a Cancelada. El Figma no lo muestra; el ciclo sólo tiene Pendiente > Vigente.
- **RN20.** Mismo DNI y número en todas las llamadas. 10 intentos por minuto por IP.

## 11. Responsive (mobile, frame 390 × 2065, nodo 18:1772)

Ver sección 3.2 para la descripción completa de W3m. Resumen de cambios:

- Un solo panel vertical: encabezado, datos, cuotas, cupón, ciclo, pie.
- La tabla de cuotas pasa a lista de tarjetas sin encabezado (sección 3.2).
- El resumen de pago desaparece como columna. El total y el botón "Pagar" pasan a una barra fija al pie. El cupón queda como botón de ancho completo debajo de la lista.
- Barra fija: en el Figma está al final del frame, no fija a la ventana. Confirmar si el comportamiento es `position: sticky` o `fixed` al pie de la ventana. NO DEFINIDO. Propuesta: fija al pie, con `padding-bottom` en el contenido para que no tape la última cuota.
- El pie de contacto va en columna y con fondo `--nexa-surface-subtle` (no `PublicFooter`).

## 12. Accesibilidad

- Un `h1` ("Mi póliza"). Secciones "Datos de la póliza", "Cuotas", "Resumen de pago" y "Ciclo de la póliza" como `h2` o `h3`.
- Tabla desktop: `<table>` con `<th scope="col">` para Cuota, Vencimiento, Importe y Estado. La columna de checkbox con `<th>` de texto accesible "Seleccionar" o similar. NO DEFINIDO.
- Lista mobile: cada fila como `li` o como fila con `role="row"` si se mantiene la semántica de tabla. Decidir una sola estructura.
- Casillas: `<input type="checkbox">` con etiqueta accesible. Texto propuesto: "Seleccionar cuota 8 de 12" (el texto del Figma no lo define). Estado marcado y "Pagada" no seleccionable deben ser deshabilitados (`disabled`) y comunicarse con `aria-disabled` o con el texto "Pagada".
- Casillas deshabilitadas (Pagada): el Figma no las muestra; el lector de pantalla no debe anunciar una casilla que no se puede usar. Ocultarlas o deshabilitarlas: NO DEFINIDO (sección 13).
- Badges: el texto del badge ya dice el estado. No depender del color (verde / rojo / gris): el texto es la fuente.
- "Total a pagar" con `aria-live="polite"` para anunciar el cambio cuando se marca o desmarca una cuota. NO DEFINIDO.
- Botón "Pagar seleccionadas" deshabilitado sin selección: usar `disabled` (no sólo color). NO DEFINIDO.
- Botón "Descargar cupón Pago Fácil": ícono barcode decorativo (`alt=""`).
- Foco: anillo de foco en casillas, botones y links. NO DEFINIDO en el Figma.
- Contraste a verificar: badge "Vencida" (#B03A2E sobre #FBE5E2), badge "Pendiente" (#5A5F8C sobre #ECEDF7), badge "Vigente" (#1F7A4D sobre #E3F4EA), y la nota "Pago Fácil acredita..." (11 px, #8A8E93) sobre blanco (probable que no cumpla 4,5:1). Verificar antes de dar por aceptado.
- Orden de tabulación desktop: nav → casillas de cuota (de arriba abajo) → "Seleccionar impagas" → "Pagar seleccionadas" → "Descargar cupón Pago Fácil" → footer.
- Mobile: orden → encabezado → datos → cuotas → cupón → ciclo → pie → barra de pago. La barra de pago al final en el DOM: decidir si se queda al final del DOM (si es fija, el foco llega tarde). NO DEFINIDO.

## 13. Dudas e inconsistencias Figma ↔ back

1. **Titular.** Figma: "Tomás Iturralde" y "DNI 30.123.456". `ConsultaPublicaResponse` NO trae titular ni DNI (RN20: no devuelve ids ni datos de cliente, sólo producto, vehículo y cuotas). Evidencia: `ConsultaPublicaResponse.cs:3-7`; `docs/frontend/contratos-api/seguridad-clientes-publico.md` (línea 745) lo confirma; `PublicoConsultaControllerTests.cs:150-171` verifica las claves exactas del JSON. El front tiene el DNI que escribió el usuario, pero no el nombre. ¿El back agrega `titular` con el nombre (y el DNI enmascarado), o se quita del diseño? NO DEFINIDO. No inventar el nombre en el front.
2. **Vigencia "12 meses".** La respuesta no trae la cantidad de meses. Propuesta: calcularla de `vigenteDesde` y `vigenteHasta`. Confirmar que siempre coincide con la cantidad de cuotas (RN07: una cuota por mes). NO DEFINIDO si el back debe exponerla.
3. **Estados sin texto en el Figma.** Suspendida, Cancelada y Vencida (póliza) y Anulada (cuota) no están dibujadas. Propuesta de textos: "Suspendida", "Cancelada", "Vencida", "Anulada". La descripción de Badge/Estado asigna colores de Vencida a Anulada, y de Suspendida a "Pendiente CAE" (que es de factura, no de cuota). No hay asignación explícita para la Suspendida y la Cancelada de la póliza. Confirmar textos y colores. NO DEFINIDO.
4. **Filas Pagada sin casilla visible.** El Figma tiene un ícono `check` en las filas Pagada, pero en el render no se ve nada. ¿Se muestra la casilla deshabilitada, o no se muestra? Propuesta: sin casilla (no seleccionables). Confirmar.
5. **Cupón por cuota.** El endpoint (US-F3-06) recibe `numeroCuota`, una cuota por llamada. El botón global "Descargar cupón Pago Fácil" no indica cuota. ¿Con varias cuotas marcadas, el botón (a) queda deshabilitado, (b) abre W5 con un cupón por cuota, o (c) pide sólo una cuota? NO DEFINIDO. Propuesta: (b).
6. **Endpoint del cupón.** Estado Especificado (US-F3-06, sin PR abierta). Ver sección 9.3. El `GET /api/pagofacil/cuotas/{id}/cupon` existe, pero requiere rol Empleado: no sirve al cliente.
7. **Texto del botón.** El Figma dice "Pagar seleccionadas" en desktop y "Pagar" en mobile. Se mantiene cada texto en su frame. Pregunta: ¿el texto móvil es intencional? NO DEFINIDO.
8. **Límite de 24 cuotas.** El back rechaza más de 24 cuotas por pago (`MaximoCuotas`). El Figma no lo menciona ni tiene un estado de error. ¿Se muestra un mensaje? NO DEFINIDO. Por la regla de negocio de 12 meses, el caso no se da con pólizas de 12 cuotas.
9. **Recargo fijo 5% en el texto.** El texto "Recargo del 5% al vencer." y "recargo 5%" son literales del Figma. Si el porcentaje cambia en el back (RN08 lo fija en 5%), el texto quedará desactualizado. Confirmar si el front lo toma del back o es texto fijo. Propuesta: texto fijo, por RN08.
10. **"Pago Fácil acredita hasta 72 h hábiles (dato de referencia)."** Se muestra literal según el Figma. La búsqueda por "acredit" y "72" en `AnalisisBack.md` y `tareas-divididas.md` no tuvo resultados. Pregunta: ¿quién confirma el dato antes de publicarlo? NO DEFINIDO.
11. **Ciclo de la póliza.** Es un bloque fijo que explica el paso de Pendiente a Vigente, o un estado dinámico de la póliza. Según el Figma, es estático (siempre muestra Pendiente > Vigente, incluso en una póliza Vigente). Propuesta: texto fijo de ayuda. Confirmar.
12. **Barra de pago mobile fija.** El Figma no define si es fija a la ventana o al final del contenido. Ver sección 11.
13. **Vencimiento de la cuota 8.** "10/10/2026, recargo 5%" es el texto del Figma. Si el recargo no está aplicado en el back (F3 todavía no corrió), el estado y el importe no coincidirían con el Figma. El front muestra lo que devuelve el back: no calcular el 5 % en el front.
14. **Denominación "Terceros Completo (TC)".** Confirmar que el `plan.codigo` sea "TC" y que `plan.nombre` sea "Terceros Completo" en el seed. Si no, el texto con código no sale del DTO.
15. **Pago Fácil y pago online: mismo número de póliza.** El Figma muestra el número en el encabezado. Confirmar que la respuesta del cupón (cuando exista) y el pago online traigan el mismo `numeroPoliza`.
16. **Redirección al volver de la pasarela.** Si el pago se hace en otra pestaña o la pasarela redirige de vuelta, la pantalla W3 queda sin estado de navegación. Ver W4 y W6. NO DEFINIDO.
17. **Inset móvil.** En W3m el contenedor tiene padding de 12 px y el Shell ocupa 366 px. `docs/frontend/design-system.md` (§7.4 y línea 1021) asume 16 px y advierte que no se midió W3m. Confirmar 12 o 16 px.

## 14. Referencia Figma

- Página `01 Web publica`.
- W3 desktop: nodo `18:47`. URL: https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-47
- W3m mobile: nodo `18:1772`. URL: https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-1772
- Subnodos clave desktop: Shell `18:49`; Contenido `18:60`; Encabezado `18:61`; Estado de la póliza `18:63`; Principal `18:67`; Columna principal `18:68`; Datos de la póliza `18:70`; Cuotas `18:1485`; Tabla cuotas `18:1490`; Cuota/Fila (fila 8) `18:1568`; Cuota/Fila (fila 9) `18:1579`; Columna lateral `18:69`; Resumen de pago `18:1296`; Botón cupón `18:2736`; Ciclo de la póliza `18:1311`.
- Subnodos clave mobile: Shell `18:1774`; Barra superior `18:1775`; Contenido `18:1782`; Datos de la póliza `18:1789`; Cuotas `18:1806`; Tabla cuotas `18:1811`; Cuota/Fila movil (fila 8) `18:1890`; Cuota/Fila movil (fila 9) `18:1902`; Botón cupón `18:2742`; Ciclo de la póliza `18:1954`; Pie de contacto `18:2164`; Barra de pago `18:1979`.
