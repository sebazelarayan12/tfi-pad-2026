# W4 · Elegir medio de pago

Pantalla de la web pública (`apps/web-publica`, sin login). Figma: página `01 Web publica`, frame `W4 Elegir medio de pago`.

Estado de los endpoints usados (código del repo en la rama actual):
- `POST /api/publico/consulta`: **Implementado** (`backend/Aseguradora.Api/Controllers/PublicoConsultaController.cs`).
- `POST /api/publico/pagos`: **Implementado** (`backend/Aseguradora.Api/Controllers/PublicoPagosController.cs`, con integraciones en mock).
- `POST /api/publico/cupon`: **Especificado** (no existe en `Controllers/`; lo agrega US-F3-06).

---

## 1. Propósito y quién la usa

- **Quién:** cliente titular de una póliza, sin login. Llega desde W3 "Mi póliza" con las cuotas que quiere pagar ya elegidas (ver punto 9.1).
- **Qué decide:** el medio de pago para las cuotas seleccionadas:
  - **Pasarela A** o **Pasarela B**: pago online. El cliente sale a la página de checkout de la pasarela.
  - **Pago Fácil**: pago en efectivo en sucursal con cupón de código de barras. Continúa en W5.
- **Qué NO hace esta pantalla:** no muestra el resultado del pago (eso es W6) ni el cupón (eso es W5).

## 2. Ruta propuesta y guardas de acceso

- **Ruta propuesta:** `/poliza/pagar/medio-de-pago` (propuesta; la ruta final la define `apps/web-publica/src/app`).
- **Datos de entrada:** se pasan por el estado de navegación del router (`location.state`), **no por query string**. `docs/AnalisisBack.md` §7 justifica usar POST "para que el DNI viaje en el cuerpo y no quede en la URL". Por la misma razón el DNI no se guarda en `localStorage`. Esto además respalda el texto de la pantalla "no se guardan en este dispositivo" (D15).
  - Campos del estado: `dni` (8 dígitos), `numeroPoliza` (ej. `POL-0000042`), `cuotaIds` (array de UUID, 1 a 24).
- **Guardas:**
  - Sin `location.state` válido (refresh sin estado, acceso directo): redirigir a W2 "Consultar póliza". Ruta de W2 **NO DEFINIDA** (D7).
  - `cuotaIds` vacío o con más de 24 elementos: no renderizar y redirigir a W3. El límite 24 viene de `PagoPublicoRequest.MaximoCuotas` (`backend/Aseguradora.Application/Dtos/PagoPublicoRequest.cs`).
  - La ruta es pública: no hay roles ni JWT.

## 3. Estructura visual (de arriba a abajo, medidas de Figma, frame 1440 × 1024)

- **Backdrop** (`Backdrop`, node 15:102): 1440 × 1024, degradado lineal `144.58°` de `rgb(238,242,184)` 0% a `rgb(213,221,227)` 100%.
- **Shell** (`Shell`, node 15:104): posición `left 24 / top 24`, 1392 × 976, radio 24, fondo `var(--nexa-surface-panel, white)`, sombra `0 24px 60px 0 #3C46281A`. Es el único elemento con sombra.
- **Contenido** (node 18:1022): `left 24 / top 24`, 1392 × 976, `padding 0 24 24 24`, columna vertical, sin scroll propio.
  1. **PublicNav** (`PublicNav`, node 14:179): alto 72, `padding 0 24`, gap 32, centrado vertical. Contiene:
     - Logo (`Logo/Nexa`, node 14:5) a la izquierda.
     - Espaciador flexible.
     - Link "Planes", link "Contacto", botón "Consultar póliza" (Button primario) a la derecha.
  2. **Cuerpo** (node 18:1033): alto 742, `padding 56 112 48 112`, gap 80, fila horizontal, `overflow clip`.
     - **Columna izquierda "Medio de pago"** (node 18:1049): ancho 560, gap 24, columna.
       - Encabezado (node 18:1050), gap 8: título H1 (28/34 SemiBold, ancho completo) y subtítulo (14/20 regular, color secundario).
       - Etiqueta "Medio de pago" (16/22 SemiBold).
       - Grupo de opciones (node 18:1054), ancho 560, gap 12, columna. Tres tarjetas de opción, cada una a ancho completo, `padding 20`, radio 16, borde 1 px sólido, gap 16, alineación centrada:
         - Icono 24 × 24 a la izquierda.
         - Bloque de texto (gap 4): título (16/22 SemiBold) y descripción (13/18 regular, color secundario).
         - Icono de estado a la derecha: check-circle 24 × 24 en la seleccionada; en las no seleccionadas, un frame vacío de 24 × 24.
       - Estados visuales de la tarjeta:
         - Seleccionada: fondo `var(--nexa-accent-lime-soft, #f3f7c9)`, borde `var(--nexa-accent-lime, #dceb6b)`.
         - No seleccionada: fondo `var(--nexa-surface-panel, white)`, borde `var(--nexa-border-strong, #d3d5ce)`.
       - Botón "Continuar" (instancia de `Button`, alto 40, `padding 0 16`, pill).
       - Línea de privacidad (node 18:1079, gap 8): icono candado 16 × 16 + texto 13/18 regular, color secundario, sin wrap.
     - **Columna derecha "Resumen de pago"** (node 18:1083): ancho 480, gap 16, columna.
       - **Card "Resumen de pago"** (`Card/Widget`, node 18:1084): fondo blanco, borde 1 px `var(--nexa-border-hairline, #e7e8e3)`, radio 16, `padding 20`, gap 16, ancho completo.
         - Encabezado (fila, centrado vertical): título "Resumen de pago" (16/22 SemiBold) · espaciador flexible · acción "Cambiar cuotas" (icono flecha-arriba-derecha 16 × 16 + texto 12/16 Medium, gap 4).
         - Línea de datos: "Póliza POL-0000042 · Plan TC Terceros Completo" (13/18 regular, color secundario, alto 20).
       - **Card "Detalle de cuotas"** (node 18:1093): fondo blanco, borde hairline, radio 16, `padding 24`, gap 16, ancho completo. Contiene, en orden:
         1. Fila "Cuota 8" (node 18:1094): a la izquierda bloque de datos (título 16/22 SemiBold + vencimiento 13/18); a la derecha el badge "Vencida".
         2. Filas de importe (13/18): "Importe de la cuota" y "Recargo por vencimiento (5%)". Etiqueta a la izquierda en color secundario, valor a la derecha en fuente mono `JetBrains Mono` 13/18.
         3. Fila "Total cuota 8" (14/20 regular, color primario) con valor mono 13/18.
         4. Divisor 1 px `var(--nexa-border-hairline)`.
         5. Fila "Cuota 9" (node 18:1110): datos (título + vencimiento) y badge "Pendiente" a la derecha. **No tiene fila de recargo en Figma** (D12).
         6. Fila "Importe de la cuota" con valor mono.
         7. Divisor.
         8. Fila "Total a pagar" (node 18:1120): a la izquierda título 16/22 SemiBold "Total a pagar (2 cuotas)" y debajo 13/18 "Incluye el recargo de la cuota 8"; a la derecha importe mono medium 22/28.
  3. **PublicFooter** (node 14:189): ancho completo, fondo `var(--nexa-surface-sidebar, #f5f5f2)`, radio 16, `padding 32 40`, gap 24. Fila de 4 columnas de contacto con `gap 48` y línea de copyright. Textos en punto 5.

Medidas clave: columna izquierda 560 px, columna derecha 480 px, gap entre columnas 80 px, padding lateral del cuerpo 112 px.

## 4. Componentes del design system que usa (nombres del Figma)

| Componente Figma | Node | Uso en W4 | Descripción de uso (según Figma) |
|---|---|---|---|
| `Shell` | 15:104 | Contenedor blanco flotante | "Floating white app shell: 24px radius, only element with a drop shadow" |
| `Backdrop` | 15:102 | Fondo degradado | Sin descripción |
| `Logo/Nexa` | 14:5 | Logo en nav | "Nexa monogram plus wordmark. The only hand-made brand mark." |
| `Button` | 11:42 | "Consultar póliza" (nav) y "Continuar" (instancia en código: 11:6) | "Primary for the main action of a screen, Secondary for alternatives, Ghost for inline actions. Size M is 40px high" |
| `Card/Widget` | 15:49 | "Resumen de pago" y "Detalle de cuotas" | "Widget container: 16px radius, hairline border, no shadow. Title plus optional action link. Use only where grouping matters." |
| `Badge/Estado` | 11:117 | "Pendiente" (cuota 9) | "Colors map to semantic status tokens only" |
| `PublicNav` | 14:179 | Barra superior | Componente de página pública (sin descripción en Figma) |
| `PublicFooter` | 14:189 | Pie | Componente de página pública (sin descripción en Figma) |

Notas de implementación:
- El badge "Vencida" (node 18:1098, nombre `Badge/Cuota Vencida`) **no es una instancia** de `Badge/Estado`. Es un frame propio con fondo `--nexa-status-cancelada-bg` y texto `--nexa-status-cancelada-text`. Ver D10.
- Las tarjetas de opción de pago (`Opción Pasarela A`, `Opción Pasarela B`, `Opción Pago Fácil`) no tienen componente en el design system. Proponer componente propio `OpcionMedioPago` en `features/pagos/components` (nombre a confirmar por el equipo), con props `seleccionada`, `icono`, `titulo`, `descripcion`.
- Iconos (24 px salvo indicación): `icon/card`, `icon/wallet`, `icon/barcode`, `icon/check-circle` (seleccionada), `icon/lock-key` (16 px), `icon/arrow-up-right` (16 px, acción "Cambiar cuotas"). Son assets SVG de Figma: se descargan al repo y se referencian localmente. No se redibujan ni se reemplazan por otra librería de iconos.

## 5. Contenido textual literal

Copiado tal cual del Figma (tildes, mayúsculas, puntuación).

**Barra superior**
- Logo: marca "N" y texto "Nexa Seguros".
- Link: "Planes"
- Link: "Contacto"
- Botón: "Consultar póliza"

**Encabezado**
- Título: "Elegí tu medio de pago"
- Subtítulo: "Vas a pagar las cuotas 8 y 9 de la póliza " + "POL-0000042" (fuente mono) + "."
  - Plantilla: `Vas a pagar las cuotas {lista} de la póliza {numeroPoliza}.` "8 y 9" y "POL-0000042" son datos. Formato de la lista para 3 o más cuotas: **NO DEFINIDO** (propuesta: "8, 9 y 10"). Para 1 cuota, "las cuotas" debe pasar a "la cuota": **NO DEFINIDO** en Figma (D14).

**Sección de medios**
- Etiqueta: "Medio de pago"
- Opción 1 (título): "Pasarela A"
- Opción 1 (descripción): "Pago online con tarjeta o dinero en cuenta."
- Opción 2 (título): "Pasarela B"
- Opción 2 (descripción): "Pago online con tarjeta o dinero en cuenta."
- Opción 3 (título): "Pago Fácil"
- Opción 3 (descripción): "Efectivo con cupón de código de barras. Acreditación hasta 72 h hábiles (dato de ejemplo)." (ver D4)
- Botón: "Continuar"
- Privacidad: "Tus datos viajan cifrados y no se guardan en este dispositivo." (ver D15)

**Resumen de pago**
- Título: "Resumen de pago"
- Acción: "Cambiar cuotas"
- Línea: "Póliza POL-0000042 · Plan TC Terceros Completo"
- Cuota 8: "Cuota 8 de 12" / "Vencimiento 10/10/2026" / badge "Vencida"
- "Importe de la cuota" / "$ 25.000,00"
- "Recargo por vencimiento (5%)" / "$ 1.250,00"
- "Total cuota 8" / "$ 26.250,00"
- Cuota 9: "Cuota 9 de 12" / "Vencimiento 10/11/2026" / badge "Pendiente"
- "Importe de la cuota" / "$ 25.000,00"
- "Total a pagar (2 cuotas)" / "Incluye el recargo de la cuota 8" / "$ 51.250,00"

**Pie**
- "Teléfono" / "A confirmar"
- "Email" / "A confirmar"
- "Ubicación" / "Dirección a confirmar"
- "Horarios" / "Lunes a viernes, horario a confirmar"
- "© 2026 Nexa Seguros. Todos los derechos reservados."

**Textos NO definidos en Figma** (pedirlos antes de construir): todos los mensajes de error y de carga del punto 7, el texto de "cuota con pago en curso", el texto de foco.

Formato de importes: `$ 25.000,00` (punto de miles, coma decimal, espacio después del signo). Un único formateador en `@nexa/api` o `@nexa/ui` (FB4).

## 6. Campos y validaciones

No hay campos de texto. Hay un **grupo de selección única** (radio).

| Campo | Tipo | Obligatorio | Regla | Origen |
|---|---|---|---|---|
| Medio de pago | radio (3 opciones) | Sí | Exactamente una opción. Figma muestra "Pasarela A" seleccionada; la regla de preselección **NO DEFINIDA** (D13). | Figma |
| `cuotaIds` (del estado) | UUID[] | Sí | Entre 1 y 24, sin repetidos. `PagoPublicoRequest.CuotaIds` (`MaximoCuotas = 24`); `PagoService.CargarCuotasPagablesAsync` rechaza repetidos. | Back |
| `dni` (del estado) | string | Sí | 8 dígitos, `^\d{8}$` (`PagoPublicoRequest.Dni`). | Back |
| `numeroPoliza` (del estado) | string | Sí | Máximo 20 caracteres. | Back |

Mapeo de la opción al valor `proveedor` de `POST /api/publico/pagos`:
- Pasarela A → `pasarela1` (**propuesta**; el back acepta solo `pasarela1` y `pasarela2`, ver `PagoService.ProveedoresValidos`). Confirmar en D2.
- Pasarela B → `pasarela2` (**propuesta**, mismo motivo).
- Pago Fácil → no llama a `/pagos`.

Validaciones del back que la UI debe poder mostrar (los textos no están en Figma, ver punto 7):
- Cuota que no es Pendiente ni Vencida → 400 (RN11).
- Cuota de otra póliza → 400.
- Cuota con pago en curso dentro de la ventana de reserva (C8) → 400, mensaje del back: "Alguna de las cuotas ya tiene un pago en curso. Intente de nuevo más tarde."
- Proveedor inexistente → 400, mensaje del back: "El proveedor de pago indicado no existe."
- DNI y póliza que no coinciden → 404 con mensaje genérico (RN20).

Los mensajes llegan en `ProblemDetails`. Confirmar si se muestran tal cual o se reemplazan por textos de Figma (D14).

## 7. Estados

| Estado | Qué se muestra | Fuente |
|---|---|---|
| Inicial (con selección) | Tarjetas, resumen y "Continuar" habilitado. Pasarela A marcada en el diseño. | Figma |
| Opción seleccionada | Borde y fondo lime, icono check-circle. | Figma |
| Foco en una opción | **NO DEFINIDO** en Figma. Propuesta: anillo de foco de 2 px con un token de foco (token **NO DEFINIDO**). | Propuesta |
| Enviando (`POST /api/publico/pagos` en curso) | "Continuar" deshabilitado, `aria-busy="true"`. Indicador y texto **NO DEFINIDOS**. Propuesta: mantener "Continuar" y agregar un spinner. | Propuesta |
| Éxito online (201) | Sin pantalla propia. Redirigir a `urlPago` (checkout externo). | Back + propuesta |
| Éxito Pago Fácil | Sin POST. Navegar a W5 con el mismo estado de navegación. | Propuesta |
| Error de validación 400 | Mensaje del `ProblemDetails`. Diseño **NO DEFINIDO**. | Back |
| No encontrado 404 | Mensaje genérico de RN20 del `ProblemDetails`. Diseño **NO DEFINIDO**. | Back |
| Demasiados intentos 429 | Mensaje de RN20. Texto **NO DEFINIDO**. | Back |
| Pasarela caída 502 | Mensaje de error de la pasarela. Texto **NO DEFINIDO**. | Back |
| Error de red | **NO DEFINIDO**. | - |
| Sin estado de navegación | Redirigir a W2 (punto 2). | Propuesta |
| Vacío | No aplica: sin cuotas, la guarda del punto 2 redirige. | Propuesta |

## 8. Acciones y navegación

| Elemento | Acción | Destino |
|---|---|---|
| Tarjeta "Pasarela A" / "Pasarela B" / "Pago Fácil" | Selecciona la opción (única). | Sin navegación. |
| "Continuar" con Pasarela A o B | `POST /api/publico/pagos` con `{ dni, numeroPoliza, cuotaIds, proveedor }`. Si responde 201: guardar `numeroPago` (ver nota) y `window.location.assign(urlPago)`. | Checkout de la pasarela (dominio externo). |
| "Continuar" con Pago Fácil | Navegar a W5 con el estado `{ dni, numeroPoliza, cuotaIds }`. | W5 (`/poliza/pagar/pago-facil`, propuesta). |
| "Cambiar cuotas" | Volver a W3 con el mismo estado para no perder la selección. | W3 "Mi póliza". Ruta **NO DEFINIDA** (D6). |
| "Consultar póliza" (nav) | Ir a W2. | W2. Ruta **NO DEFINIDA** (D7). |
| "Planes" (nav) | Ir a la lista de planes. | Ruta **NO DEFINIDA** (propuesta `/planes`) (D7). |
| "Contacto" (nav) | Ir a contacto. | **NO DEFINIDO** (D7). |
| Links del pie | No hay links en Figma (solo texto). | - |

Retorno de la pasarela: la pasarela devuelve al cliente a `Pagos:UrlRetornoExito` o `Pagos:UrlRetornoError` (variables de entorno; ver `backend/Aseguradora.Application/Services/PagoOnlineOpciones.cs`). Ni el front ni el back definen qué parámetros trae ese retorno para identificar el pago. Si W6 necesita `numeroPago`, hay que guardarlo antes de salir. Propuesta: `sessionStorage` solo con `numeroPago`, nunca con el DNI (D8).

## 9. Datos: endpoints y de qué campo sale cada dato

### 9.1 Entrada desde W3 (qué cuotas paga)

W3 llama a `POST /api/publico/consulta` (**Implementado**, body `{ dni, numeroPoliza }`). Respuesta `ConsultaPublicaResponse` (`backend/Aseguradora.Application/Publico/DTOs/ConsultaPublicaResponse.cs`). Cada elemento de `cuotas` es `CuotaPublica`:

| Campo del DTO | Tipo | Se muestra en W4 como | Observación |
|---|---|---|---|
| `IdCuota` | Guid | `cuotaIds` del POST y clave de la fila | Se envía al back. |
| `Numero` | int | "Cuota {Numero}" | |
| `Importe` | decimal | "Importe de la cuota" | |
| `Recargo` | decimal | "Recargo por vencimiento (5%)" | Mostrar solo si `Recargo > 0`. Ver D12. |
| `Total` | decimal | "Total cuota {Numero}" | Figma muestra `Importe + Recargo`. Verificar que `Total` lo cumple. |
| `Vencimiento` | DateOnly | "Vencimiento dd/mm/aaaa" | Formato `dd/mm/aaaa`. |
| `Estado` | string | Badge "Vencida" o "Pendiente" | Valores exactos del string **no verificados** en un contrato. Ver `CuotaPublica`. Para pagar solo llegan Pendiente y Vencida (RN11). |

- "Cuota {N} de {total}": el total sale de la cantidad de elementos de `cuotas` de la póliza. **Supuesto a confirmar** (D5).
- "Plan TC Terceros Completo": `plan.nombre` de la misma respuesta (`PlanPublico`).
- "POL-0000042": `numeroPoliza`.
- Las cuotas que W4 muestra son las que W3 pasó por el estado de navegación, no todas las de la póliza.

### 9.2 Totales (cálculo)

- "Total a pagar (N cuotas)" = suma de `Total` de las cuotas seleccionadas. Figma: 26.250,00 + 25.000,00 = 51.250,00.
- El back cobra `pago.ImporteTotal` (`PagoService.IniciarPagoOnlineAsync`). Si el front suma y el back no coincide, el cliente ve un monto distinto al cobrado (D11).
- "Incluye el recargo de la cuota 8": texto de Figma. Con cuotas sin recargo, la regla del texto **NO DEFINIDA**.

### 9.3 Envío al back al elegir medio

**Pasarela A o B** (`POST /api/publico/pagos`, **Implementado**):

```
POST /api/publico/pagos
{ "dni": "30123456", "numeroPoliza": "POL-0000042",
  "cuotaIds": ["<IdCuota cuota 8>", "<IdCuota cuota 9>"], "proveedor": "pasarela1" }
```

Respuesta 201 (`PagoPublicoResponse`, `backend/Aseguradora.Application/Dtos/PagoPublicoResponse.cs`):
- `numeroPago` (`PAG-xxxxxx`): guardar para W6 y para `POST /api/publico/factura`.
- `idPago`: no se usa en W4.
- `urlPago`: destino de `window.location.assign`.
- `fechaExpiracion` (UTC): no se muestra en Figma. Si el link vence antes de que el cliente pague, el mensaje es **NO DEFINIDO** (D14).

**Pago Fácil**: no se llama a `/pagos`. Ver W5.

### 9.4 Qué hace la pasarela (mock)

- En dev, las pasarelas son mocks en memoria (`docs/pagos-mocks.md`). La `urlPago` apunta a dominios `.example` y no procesa cobros. El webhook (`docs/webhook-pasarela.md`, `WebhookPagoService`) es quien confirma el pago en el back.
- W4 no depende del webhook. Lo que W6 muestra sí depende de él (ver W6).

### 9.5 Endpoints de Pago Fácil desde W4

W4 no llama a ningún endpoint de Pago Fácil. El cupón se pide en W5 con `POST /api/publico/cupon` (**Especificado**, D3).

## 10. Reglas de negocio visibles (RN)

- **RN11**: solo se pagan cuotas Pendientes o Vencidas. Por eso W4 lista solo esas cuotas (`PagoService.CargarCuotasPagablesAsync`).
- **RN08**: recargo del 5% sobre la cuota que pasó a Vencida (`TasaRecargoMora.Valor = 0.05m`; `Cuota.Vencer` fija `Recargo`). Figma lo muestra solo en la cuota 8.
- **RN20**: límite de intentos por IP en `/api/publico/*` (10 por minuto según la spec). Un 429 puede aparecer al continuar.
- **RN18**: el cupón de Pago Fácil sigue el formato de 42 dígitos. Solo se ve en W5.
- **C8 (regla de tareas)**: no se inicia un pago online si hay un pago pendiente en curso para alguna de las cuotas.
- Límite de 24 cuotas por pago online (`PagoPublicoRequest.MaximoCuotas`).

## 11. Responsive

No hay frame mobile para W4 (solo existen `W2m` y `W3m mobile`). **Propuesta** a validar con diseño:
- Una columna. Orden: encabezado → "Medio de pago" → "Resumen de pago" → "Continuar" → privacidad → pie.
- Barra superior: logo a la izquierda y botón "Consultar póliza" a la derecha. "Planes" y "Contacto" pasan a un menú o se ocultan (decisión **NO DEFINIDA**).
- Gutter lateral de 16 px, sin scroll horizontal.
- Tarjetas de opción a ancho completo, alto mínimo 56 px para zona táctil.
- "Continuar" a ancho completo.
- "Resumen de pago" debajo de las opciones (no lado a lado).
- Pie apilado en columna.

## 12. Accesibilidad

- Grupo de opciones con `role="radiogroup"` y `aria-labelledby` apuntando a "Medio de pago". Cada tarjeta es un `<label>` que envuelve un `<input type="radio">`, para que toda el área sea clicable.
- Las flechas del teclado mueven la selección dentro del grupo (comportamiento nativo del radio).
- El estado seleccionado no depende solo del color: el icono check-circle y el radio nativo lo indican. El check es decorativo (`alt=""`).
- Iconos decorativos con `alt=""` o `aria-hidden="true"`.
- "Continuar": `type="button"`. Durante el envío, `aria-busy="true"` y `disabled`.
- Resumen: `<section aria-labelledby>` con el título "Resumen de pago". Cada cuota como bloque con etiqueta y valor juntos (`<dl>`).
- Montos en fuente mono: el lector lee los dígitos tal cual.
- Orden de foco: barra superior → opciones → "Continuar" → privacidad → resumen (acción "Cambiar cuotas").
- Contraste de texto secundario `#5c6066` sobre blanco y sobre `#f3f7c9`: **verificar** con una herramienta de contraste antes de aprobar.
- Al entrar a W4, el foco va al `h1`.

## 13. Dudas e inconsistencias Figma ↔ back

(Las marcadas **bloqueante** impiden construir el flujo completo.)

- **D1 (bloqueante). Pago Fácil con 2 cuotas.** W4 muestra "Total a pagar (2 cuotas)" y la opción Pago Fácil. El cupón es por cuota (`GET /api/pagofacil/cuotas/{cuotaId}/cupon` y `POST /api/publico/cupon` reciben una sola cuota), y W5 muestra un solo cupón (cuota 9). ¿Pago Fácil genera un cupón por cuota (N cupones en W5), o solo se permite con una cuota?
- **D2 (bloqueante). Pasarela A / B ↔ `pasarela1` / `pasarela2`.** Figma no define el mapeo ni el nombre comercial. El back solo acepta `pasarela1` y `pasarela2`. Confirmar el mapeo y el nombre visible.
- **D3 (bloqueante). Cupón público inexistente.** `POST /api/publico/cupon` está **Especificado** (US-F3-06). Sin él, W5 no puede mostrar datos reales. `GET /api/pagofacil/cuotas/{cuotaId}/cupon` existe, pero está restringido a Empleado (`[Authorize(Policy = Politicas.Empleado)]`), así que la web pública no lo puede usar.
- **D4.** El texto "Acreditación hasta 72 h hábiles (dato de ejemplo)" contiene la anotación "(dato de ejemplo)". No debe llegar a producción. Confirmar el texto final. El back no define ese plazo.
- **D5.** "Cuota 8 de 12": `CuponPagoFacilResponse` trae `NumeroCuota`, pero el total de cuotas no está en ningún DTO público. Confirmar que sale de la cantidad de cuotas de `ConsultaPublicaResponse.cuotas`.
- **D6.** "Cambiar cuotas" no tiene ruta definida. Confirmar destino y si conserva la selección.
- **D7.** Destinos de "Consultar póliza", "Planes" y "Contacto" no definidos. "Contacto" no tiene destino en Figma.
- **D8.** Retorno de la pasarela: el back no define parámetros de retorno (ni `numeroPago` ni `idPago`). W6 no puede saber qué pago mostrar si no se guarda `numeroPago` antes de salir. Definir: parámetros en la URL de retorno (hay que pedir al equipo de back que los agregue a `UrlRetornoExito`) o `sessionStorage` solo con `numeroPago`.
- **D9.** Pie de página: "A confirmar" para teléfono, email, dirección y horarios. Son placeholders de Figma. `docs/AnalisisBack.md` §7 dice que los datos de contacto son "texto fijo del front". Confirmar los datos reales.
- **D10.** Badge "Vencida": `Badge/Estado` describe "Anulada usa colores de Vencida", y en W4 "Vencida" usa tokens de "cancelada". Confirmar la tabla de colores por estado para no mezclar Vencida con Anulada.
- **D11.** Total: el front suma `Total` de cada cuota; el back cobra `pago.ImporteTotal`. Confirmar que coinciden, incluido el caso de un recargo aplicado mientras la pantalla está abierta.
- **D12.** Cuota 9 (Pendiente) no tiene fila de recargo en W4, pero en W5 su segundo vencimiento tiene un 5% de recargo. Es coherente con las reglas (el recargo se aplica al vencer), pero hay que dejarlo explícito: el monto de una cuota Pendiente puede cambiar si vence durante la sesión.
- **D13.** Figma muestra "Pasarela A" seleccionada. No está definido si es la selección por defecto.
- **D14.** No hay mensajes de error, de carga ni de foco en Figma. Todos los textos de los estados del punto 7 están pendientes. Incluye el texto para "1 cuota" en el encabezado.
- **D15.** "Tus datos viajan cifrados y no se guardan en este dispositivo." Es una afirmación de confianza. Verificar que el front no guarde el DNI en `localStorage` ni en `sessionStorage` (punto 2). Si se guarda `numeroPago`, la frase sigue siendo válida, pero conviene revisarla.
- **D16.** El botón dice "Continuar", pero en pasarela la acción sale de la web al checkout externo. Confirmar si el texto debe cambiar en ese caso.
- **D17. Espaciados fuera de la escala** (detectado en US-FE-V-07). El cuerpo (`18:1033`) usa gap 80 entre columnas y padding superior 56; la escala de espaciado llega a `spacing/64` y no tiene 56 ni 80. La app usa 64 y 48 para no agregar valores sueltos. Pregunta a diseño: ¿se agregan esos tokens o el frame pasa a 64 y 48? NO DEFINIDO.
- **D18. Nav pegada al borde superior** (detectado en US-FE-V-07). Como en W2 y W3, la nav arranca sin padding arriba; en W1 y W5 tiene 24 px. La app usa 24 px en todas las pantallas (ver W3 §13.18).

## 14. Referencia Figma

| Elemento | Node ID | URL |
|---|---|---|
| W4 Elegir medio de pago (frame) | 18:1019 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-1019 |
| Contenido | 18:1022 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-1022 |
| Cuerpo | 18:1033 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-1033 |
| Medio de pago (columna izquierda) | 18:1049 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-1049 |
| Opciones de pago | 18:1054 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-1054 |
| Opción Pasarela A (seleccionada) | 18:1055 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-1055 |
| Opción Pasarela B | 18:1063 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-1063 |
| Opción Pago Fácil | 18:1070 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-1070 |
| Botón Continuar (instancia `Button`) | 11:6 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=11-6 |
| Privacidad | 18:1079 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-1079 |
| Resumen de pago (columna derecha) | 18:1083 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-1083 |
| Card resumen | 18:1084 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-1084 |
| Detalle de cuotas | 18:1093 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-1093 |
| Cuota 8 | 18:1094 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-1094 |
| Badge Cuota Vencida | 18:1098 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-1098 |
| Cuota 9 | 18:1110 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-1110 |
| Total a pagar | 18:1120 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-1120 |
| PublicNav | 14:179 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=14-179 |
| PublicFooter | 14:189 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=14-189 |
| Componente Shell (design system) | 15:104 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=15-104 |
| Componente Button (design system) | 11:42 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=11-42 |
| Componente Card/Widget (design system) | 15:49 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=15-49 |
| Componente Badge/Estado (design system) | 11:117 | https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=11-117 |
