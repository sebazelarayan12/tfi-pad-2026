# W6 · Pago aprobado

Pantalla de la web pública (`apps/web-publica`, sin login). Figma: página `01 Web publica`, frame `W6 Pago aprobado`.

Esta pantalla es el **destino del retorno de la pasarela** (`Pagos:UrlRetornoExito`, ver `backend/Aseguradora.Application/Services/PagoOnlineOpciones.cs`). Figma la dibuja solo en el caso aprobado.

Endpoints usados y su estado (código del repo en la rama actual):
- `POST /api/publico/consulta`: **Implementado** (`backend/Aseguradora.Api/Controllers/PublicoConsultaController.cs`). Da el estado de cada cuota.
- `POST /api/publico/factura`: **Implementado** (`backend/Aseguradora.Api/Controllers/PublicoPagosController.cs`). Da la factura y su estado (CAE).
- **Estado del pago (aprobado / pendiente / rechazado): no existe endpoint público.** Ver D1.
- Descarga de comprobante: **no existe endpoint**. Ver D6.

---

## 1. Propósito y quién la usa

- **Quién:** cliente que pagó online con Pasarela A o B y volvió desde la pasarela.
- **Qué comunica:** que el pago se aprobó, qué cuotas cubre, el total pagado y el estado de la factura (en proceso, pendiente de CAE).
- **Qué NO hace:** no reintenta el pago ni muestra el cupón de Pago Fácil (eso es W5). No muestra el resultado de pagos rechazados o cancelados: no hay diseño (D2).

## 2. Ruta propuesta y guardas de acceso

- **Ruta propuesta:** `/pago/exito`. Coincide con el ejemplo `urlRetornoExito` de `docs/AnalisisBack.md` §7 (`https://aseguradora.../pago/exito`) y con el valor de prueba de `backend/Aseguradora.Tests/Fixtures/AseguradoraWebFactory.cs`. La URL real la fija el entorno (`Pagos:UrlRetornoExito`), así que hay que coordinar con el back.
- **Datos de entrada:** la pasarela vuelve **sin estado de navegación del front** (es una redirección externa). Qué parámetros trae la URL de retorno **NO está definido** (D3). Hoy el front no tiene ni `numeroPago` ni el DNI al volver.
- **Guardas:** no hay guarda de sesión (pública). Si no se puede identificar el pago (sin parámetros ni dato guardado), **no** mostrar "Pago aprobado": mostrar el estado de verificación (D1, D2).

## 3. Estructura visual (de arriba a abajo, frame 1440 × 1024)

- **Backdrop** (node 18:2309): 1440 × 1024, degradado `144.583°` de `rgb(238,242,184)` 0% a `rgb(213,221,227)` 100%.
- **Contenedor de página** (node 18:2308): fondo blanco, padding 24, columna, tamaño completo.
- **Shell** (node 18:2310): fondo `var(--nexa-surface-panel, white)`, radio 24, sombra `0 24px 60px 0 #3C46281A`, `overflow clip`, `padding bottom 24` y `padding horizontal 24`. Columna, `flex 1`.
  1. **PublicNav** (node 14:179 como instancia): alto 72, `padding 0 24`, gap 32. Igual que W4 (logo, "Planes", "Contacto", "Consultar póliza").
  2. **Cuerpo** (node 18:2321): `flex 1`, centrado horizontal y vertical, fondo blanco.
     - **Resultado de pago** (node 18:2337): tarjeta fondo blanco, borde 1 px `var(--nexa-border-hairline, #e7e8e3)`, radio 16, `padding 40`, gap 24, **ancho fijo 640**, columna centrada.
       - **Icono resultado** (node 18:2338): círculo de **72 × 72**, radio pill, fondo `var(--nexa-status-vigente-bg, #e3f4ea)`, centrado. Dentro, icono `icon/check-circle` de **40 × 40** (node 18:2339).
       - Título "Pago aprobado" (28/34 SemiBold, centrado, ancho mínimo del contenido).
       - Subtítulo (14/20, centrado, color secundario). Ver punto 5.
       - **Detalle del pago** (node 18:2343): columna, fondo blanco, ancho completo. Cuatro filas separadas por divisores de 1 px `var(--nexa-border-hairline)`:
         1. "Total pagado" (node 18:2345): etiqueta 13/18 a la izquierda; importe mono medium 22/28 a la derecha. `padding 16 0`.
         2. Divisor (node 18:2347).
         3. "Número de operación" (node 18:2349): etiqueta 13/18; valor mono 13/18 a la derecha.
         4. Divisor (node 18:2351).
         5. "Fecha" (node 18:2353): etiqueta 13/18; valor 14/20 a la derecha.
         6. Divisor (node 18:2355).
         7. "Cuotas" (node 18:2360): etiqueta 13/18; a la derecha el valor "8 y 9" (14/20) y el badge "Pagada" (node 18:2356 y 11:109), gap 8.
       - **Nota: factura en proceso** (node 18:2362): fila, fondo `var(--nexa-accent-promo, #f6e7a8)`, radio 16, `padding 16`, gap 12, ancho completo. Icono `icon/clock` 20 × 20 (node 18:2363) + texto 14/20 `flex 1`.
       - **Acciones** (node 18:2366): fila centrada, gap 12.
         - "Volver a mi póliza" (node 18:2371): botón primario, alto 40, pill, `px 16`, gap 8, icono `icon/arrow-left` 16 × 16 (node 18:2375).
         - "Descargar comprobante" (node 18:2381): botón secundario, fondo `var(--nexa-surface-panel, white)`, borde 1 px `var(--nexa-border-strong, #d3d5ce)`, alto 40, pill, icono `icon/download-simple` 16 × 16 (node 18:2385).
  3. **PublicFooter** (node 18:2322 en la página): fondo `var(--nexa-surface-sidebar, #f5f5f2)`, radio 16, `padding 32 40`, gap 24, ancho completo.

Medidas clave: tarjeta 640 px, padding 40 px, círculo de estado 72 px, icono 40 px, notas con radio 16.

## 4. Componentes del design system que usa (nombres del Figma)

| Componente Figma | Node | Uso en W6 | Descripción de uso (según Figma) |
|---|---|---|---|
| `Shell` | 15:104 | Contenedor blanco | "Floating white app shell: 24px radius, only element with a drop shadow" |
| `Logo/Nexa` | 14:5 | Barra superior | "Nexa monogram plus wordmark. The only hand-made brand mark." |
| `Button` | 11:42 | "Consultar póliza" (nav), "Volver a mi póliza" (primario) y "Descargar comprobante" (secundario) | "Primary for the main action of a screen, Secondary for alternatives, Ghost for inline actions. Size M is 40px high" |
| `Badge/Estado` | 11:117 | Badge "Pagada" (node 11:109 en el código) | "Status badge for policy and cuota states. Colors map to semantic status tokens only. Pagada and Validado use Vigente colors" |
| `PublicNav` / `PublicFooter` | 14:179 / 14:189 | Barra y pie | Componentes de página pública |

Notas de implementación:
- El badge "Pagada" usa el componente `Badge/Estado` con colores `--nexa-status-vigente-*`, según la descripción del componente en Figma.
- La "nota de factura en proceso" es un frame propio (node 18:2362), con fondo `--nexa-accent-promo`. No es un componente del design system.
- Iconos: `icon/check-circle` (40 px, dentro del círculo de estado; el mismo asset que el icono de W4 a 24 px), `icon/clock` (20 px), `icon/arrow-left` (16 px), `icon/download-simple` (16 px). Son assets SVG de Figma: se descargan al repo.
- El círculo de estado (node 18:2338) es un frame de 72 × 72 con radio pill: tratarlo como componente propio `EstadoResultadoPago`, reutilizable para un futuro estado de error o pendiente (**propuesta**).

## 5. Contenido textual literal

Copiado tal cual del Figma.

**Barra superior**
- "Planes", "Contacto", "Consultar póliza", marca "N" y "Nexa Seguros".

**Resultado**
- Título: "Pago aprobado"
- Subtítulo: "Pagaste las cuotas " + "8 y 9" + " de la póliza " + "POL-0000042" (mono) + " con " + "Pasarela A" + "."
  - Plantilla: `Pagaste las cuotas {lista} de la póliza {numeroPoliza} con {nombrePasarela}.`
  - "Pasarela A" viene de la opción elegida en W4 (ver D4). Para 1 cuota, "las cuotas" debe pasar a "la cuota" (**NO DEFINIDO**).

**Detalle del pago**
- "Total pagado" / "$ 51.250,00"
- "Número de operación" / "PA-7741-2093" (ver D5)
- "Fecha" / "28/10/2026 14:32" (ver D7)
- "Cuotas" / "8 y 9" / badge "Pagada"

**Nota**
- "La factura está en proceso (Pendiente de CAE). Te la enviamos por email apenas ARCA la autorice."

**Acciones**
- "Volver a mi póliza"
- "Descargar comprobante"

**Pie**
- "Teléfono" / "A confirmar"; "Email" / "A confirmar"; "Ubicación" / "Dirección a confirmar"; "Horarios" / "Lunes a viernes, horario a confirmar"; "© 2026 Nexa Seguros. Todos los derechos reservados."

**Textos NO definidos en Figma:** "verificando el pago" (estado de espera), "el pago no se pudo confirmar", "el pago fue rechazado", "el pago fue cancelado", errores de carga, texto de "nota" cuando la factura ya está autorizada (ver D8).

Formato: importes `$ 51.250,00`; fecha `dd/mm/aaaa hh:mm` en hora de Buenos Aires (ver D7).

## 6. Campos y validaciones

No hay campos de entrada.

Datos que el front necesita para armar la pantalla:
- `numeroPago` (`PAG-xxxxxx`): para `POST /api/publico/factura`. Viene de `POST /api/publico/pagos` (W4). **No llega en el retorno** (D3).
- `dni` (8 dígitos): para `POST /api/publico/consulta` y `POST /api/publico/factura`. **No llega en el retorno** (D3).
- `numeroPoliza`: para `POST /api/publico/consulta`. Igual que `dni`.

Sin los datos del punto anterior, el front no puede consultar nada. La pantalla debe mostrar un estado de "no pudimos identificar el pago" (**NO DEFINIDO**, D2).

## 7. Estados

| Estado | Qué se muestra | Fuente |
|---|---|---|
| Aprobado (diseño Figma) | Todo el diseño. | Figma |
| Verificando (pasarela devuelve al cliente antes de que llegue el webhook) | **NO DEFINIDO**. Propuesta: el mismo layout con el círculo en gris y el título "Verificando el pago" (texto **NO DEFINIDO**), y consulta periódica hasta confirmar. | Propuesta |
| Pendiente de confirmación prolongada | **NO DEFINIDO**. | - |
| Rechazado o cancelado | **No hay diseño** (D2). El back no tiene un estado público para esto. | - |
| Pago no identificado (sin datos de retorno) | **NO DEFINIDO**. | - |
| Factura pendiente de CAE (`PENDIENTE_CAE`) | Nota "La factura está en proceso (Pendiente de CAE)..." visible. | Figma + back |
| Factura autorizada (`AUTORIZADA`) | Figma no lo muestra. Propuesta: ocultar la nota y mostrar el CAE y su vencimiento (diseño **NO DEFINIDO**). | Propuesta |
| Factura inexistente (404 o aún no emitida) | **NO DEFINIDO**. Propuesta: ocultar la nota de factura. | Propuesta |
| Cargando | **NO DEFINIDO**. Propuesta: esqueleto de la tarjeta de 640 px. | Propuesta |
| Error de red o 429 | **NO DEFINIDO**. | - |
| Descarga de comprobante | Sin endpoint (D6). | - |

## 8. Acciones y navegación

| Elemento | Acción | Destino |
|---|---|---|
| "Volver a mi póliza" | Volver a W3 "Mi póliza". Para mostrar datos de la póliza, W3 necesita `dni` y `numeroPoliza`. | W3. Ruta **NO DEFINIDA**. Ver D3. |
| "Descargar comprobante" | **No hay endpoint** de comprobante (D6). | **NO DEFINIDO**. |
| "Consultar póliza" (nav) | Ir a W2. | W2. Ruta **NO DEFINIDA**. |
| "Planes", "Contacto" (nav) | Igual que W4. | Ver W4 D7. |
| Enlaces del pie | No hay enlaces en Figma. | - |

## 9. Datos: endpoints y de qué campo sale cada dato

### 9.1 Estado de cuotas ("Cuotas 8 y 9 · Pagada")

Fuente: `POST /api/publico/consulta` (**Implementado**), body `{ dni, numeroPoliza }`. Respuesta `ConsultaPublicaResponse` (`backend/Aseguradora.Application/Publico/DTOs/ConsultaPublicaResponse.cs`). Para cada cuota pagada, `cuotas[].estado`.
- Las cuotas que W6 muestra son las que el pago cubrió. Esa lista **no llega en el retorno** (D3). Si se guardó en W4 el `cuotaIds`, el front puede filtrar `cuotas[]` por `idCuota`.
- Badge "Pagada": `estado` de la cuota. Valores exactos del string **no verificados** en un contrato (ver `CuotaPublica`).

**Problema:** la consulta muestra la cuota como pagada solo cuando el webhook ya procesó el pago. Si el cliente vuelve antes, la cuota figura como pendiente aunque el pago esté en camino (D1).

### 9.2 Factura (nota "en proceso")

Fuente: `POST /api/publico/factura` (**Implementado**), body `{ dni, numeroPago }` (`PublicoFacturaRequest`). Respuesta `FacturaResponse` (`backend/Aseguradora.Application/Dtos/FacturaResponse.cs`):
- `estado`: `PENDIENTE_CAE` o `AUTORIZADA` (`backend/Aseguradora.Application/Dtos/ValoresPagoResponse.cs`). Con `PENDIENTE_CAE` se muestra la nota de Figma.
- `cae` y `vencimientoCae`: no se muestran en Figma. Si la factura está autorizada, el diseño **NO DEFINIDO** (D8).
- `numero`, `importe`, `fechaEmision`: no se muestran en Figma. Decidir si aparecen (D8).

Requisito de existencia: la factura se emite al aprobarse el pago (US-F4-02, `IAprobacionPagoService`). Si el pago aún no se aprobó, el back responde 404 o no hay factura (**comportamiento a confirmar**, D1).

### 9.3 Total, número de operación y fecha

- "Total pagado" ("$ 51.250,00"): en la respuesta de `POST /api/publico/pagos` (W4) no está el importe total; el total del pago es `pago.ImporteTotal` (back, interno). **No hay endpoint público que lo devuelva.** Propuesta: el front muestra el total que calculó en W4 solo si el pago está aprobado (ver D1). Sin confirmación, no mostrar el total como cobrado.
- "Número de operación" ("PA-7741-2093"): **no coincide con el formato del back**. El back genera `PAG-xxxxxx` (`backend/Aseguradora.Application/Services/NumeroPago.cs`, con 6 hex) y lo devuelve como `numeroPago` en W4. "PA-7741-2093" puede ser la referencia de la pasarela (`IdExterno`/`ReferenciaExterna`), pero no está definido (D5).
- "Fecha" ("28/10/2026 14:32"): el back guarda `FechaAcreditacion` en UTC (tabla de pagos de `docs/AnalisisBack.md`: "la segunda null hasta aprobarse"). No hay endpoint público que la devuelva. Convertir a hora de Buenos Aires (`America/Argentina/Buenos_Aires`, zona que `docs/tareas-divididas.md` usa para fechas de negocio). Ver D7.

### 9.4 Retorno de la pasarela

La pasarela redirige a `UrlRetornoExito`. Qué parámetros trae **no está definido** (D3). El webhook (`docs/webhook-pasarela.md`, `POST /api/webhooks/pasarela/{proveedor}`) confirma el pago en el back, no en el front.

## 10. Reglas de negocio visibles (RN)

- **RN11**: las cuotas pagadas pasan a "Pagada" solo cuando el pago se aprueba.
- **RN08**: el importe pagado incluye el recargo de la cuota vencida (W4, "Incluye el recargo de la cuota 8").
- **Factura y CAE**: la factura se emite con el pago aprobado y se autoriza en ARCA. El estado "Pendiente de CAE" es el que muestra Figma (`PENDIENTE_CAE`, `ValoresPagoResponse`).
- **RN20**: límite de intentos por IP en `/api/publico/*`. Consulta y factura cuentan para el límite.

## 11. Responsive

No hay frame mobile para W6. **Propuesta** a validar con diseño:
- Tarjeta a ancho completo con gutter de 16 px. Padding interno 20 px.
- Círculo de estado y título centrados. Subtítulo a ancho completo.
- Filas de "Detalle del pago": etiqueta arriba y valor debajo cuando no entran en una línea (el número de operación es el más largo).
- Nota de factura a ancho completo.
- Botones "Volver a mi póliza" y "Descargar comprobante" apilados a ancho completo.
- Barra superior y pie como en W4 (ver W4 punto 11).

## 12. Accesibilidad

- Al cargar, el foco va al título `h1` "Pago aprobado". Anunciar el resultado con `role="status"` (propuesta) para que el lector lo lea sin buscarlo.
- Icono de check decorativo (`alt=""`). El estado se lee desde el título.
- El badge "Pagada" lleva texto visible; no depende del color.
- "Detalle del pago" como `<dl>`: cada etiqueta con su valor.
- Número de operación en mono: el lector lo lee tal cual; **verificar** con lector de pantalla.
- Nota de factura: el icono de reloj es decorativo; el texto basta.
- Botones con texto visible. Orden de foco: barra superior → "Volver a mi póliza" → "Descargar comprobante" → pie.
- Contraste de la nota (texto `--nexa-text-primary` sobre `#f6e7a8`) y del badge "Pagada" (`#1f7a4d` sobre `#e3f4ea`): **verificar** antes de aprobar.

## 13. Dudas e inconsistencias Figma ↔ back

- **D1 (bloqueante). Estado del pago sin endpoint público.** La pantalla dice "Pago aprobado" como si fuera estático. Pero el back confirma el pago con un webhook asíncrono. El cliente puede volver a W6 antes de que llegue el webhook. **No hay endpoint público que diga si un pago (`PAG-xxxxxx`) está aprobado.** Sin ese endpoint, el front no puede mostrar "Pago aprobado" de forma confiable. Propuesta: un endpoint público de estado (por ejemplo `POST /api/publico/pagos/estado` con `{ dni, numeroPago }`, para no poner el DNI en la URL) que devuelva `PENDIENTE` / `APROBADO` / `RECHAZADO` (`ValoresPagoResponse`). Requiere trabajo de back.
- **D2 (bloqueante). Resultados que no son "aprobado".** Figma solo dibuja el caso aprobado. No hay diseño para pendiente, rechazado, cancelado, ni "no pudimos identificar tu pago". Pedir diseño de esos casos.
- **D3 (bloqueante). Datos del retorno.** La URL de retorno no trae parámetros definidos. Sin `numeroPago` o `dni`, W6 no puede consultar ni "Volver a mi póliza" puede pasar datos. Opciones:
  1. Pedir al back que agregue `numeroPago` como parámetro en la URL de retorno (cambiar la configuración `Pagos:UrlRetornoExito` por entorno, o que la pasarela lo agregue).
  2. Guardar `numeroPago` en `sessionStorage` antes de salir de W4 (ver W4, punto 8). Es un dato de sesión, no el DNI. Si el cliente vuelve en otra pestaña, no se encuentra.
  3. Guardar el DNI también: **no recomendado**; el DNI no debe quedar guardado en el navegador (ver W4 D15).
- **D4. Nombre de la pasarela.** "con Pasarela A" depende del mapeo de W4 (D2 de W4). El back no devuelve el nombre comercial en ningún endpoint público.
- **D5. "PA-7741-2093" vs `PAG-xxxxxx`.** Figma usa un formato que el back no genera. Definir si "Número de operación" es el `numeroPago` del back (`PAG-xxxxxx`) o la referencia de la pasarela, y cuál de los dos se muestra.
- **D6. Descargar comprobante.** No hay endpoint de comprobante ni de PDF (ver W5 D7). Decidir si se quita el botón, se genera el PDF en el front, o se agrega un endpoint.
- **D7. Fecha y hora.** "28/10/2026 14:32" no define la zona horaria. El back guarda en UTC. Confirmar el formato y que se muestra en hora de Buenos Aires. Además, no hay endpoint que devuelva la fecha de acreditación: depende de D1.
- **D8. Factura autorizada.** Figma solo muestra el caso "en proceso (Pendiente de CAE)". No define cómo se ve la factura autorizada (CAE, vencimiento del CAE, número de factura). Pedir diseño.
- **D9. Texto de la nota y envío por email.** "Te la enviamos por email apenas ARCA la autorice." No encontré en `docs/tareas-divididas.md` un requisito de envío por email de la factura. Confirmar que existe (si no, el texto de Figma promete algo que el back no hace).
- **D10. Cuotas en plural.** "Pagaste las cuotas 8 y 9" para una cuota no está definido (ver punto 5).
- **D11. Pie de página.** Mismos placeholders "A confirmar" que W4 (ver W4 D9).
- **D12. "Volver a mi póliza".** Destino y datos necesarios (`dni`, `numeroPoliza`) no definidos (ver D3).
- **D13. Nav pegada al borde superior** (detectado en US-FE-V-07). Como en W3 y W4, la nav arranca sin padding arriba; en W1 y W5 tiene 24 px. La app usa 24 px en todas las pantallas (ver W3 §13.18).

## 14. Referencia Figma

| Elemento | Node ID | URL |
|---|---|---|
| W6 Pago aprobado (frame) | 18:2308 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2308 |
| Backdrop | 18:2309 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2309 |
| Shell | 18:2310 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2310 |
| Cuerpo | 18:2321 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2321 |
| Resultado de pago (tarjeta) | 18:2337 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2337 |
| Icono resultado (círculo 72 px) | 18:2338 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2338 |
| Icono check-circle (40 px) | 18:2339 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2339 |
| Título "Pago aprobado" | 18:2341 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2341 |
| Subtítulo | 18:2342 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2342 |
| Detalle del pago | 18:2343 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2343 |
| Fila Total pagado | 18:2345 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2345 |
| Fila Número de operación | 18:2349 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2349 |
| Fila Fecha | 18:2353 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2353 |
| Fila Cuotas | 18:2360 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2360 |
| Valor cuotas + badge Pagada | 18:2356 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2356 |
| Nota: factura en proceso | 18:2362 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2362 |
| Acciones | 18:2366 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2366 |
| Botón Volver a mi póliza | 18:2371 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2371 |
| Botón Descargar comprobante | 18:2381 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2381 |
