# W2 Consultar póliza (web pública)

Estado de la especificación: borrador para el equipo de front. Fuentes visuales: Figma W2 desktop (nodo 18:90) y W2m mobile (nodo 18:150). Fuente de contrato: `backend/Aseguradora.Api/Controllers/PublicoConsultaController.cs`, `backend/Aseguradora.Application/Publico/DTOs/*`, `backend/Aseguradora.Application/Publico/VerificadorPublico.cs`, `Security/PublicoRateLimitExtensions.cs`, `docs/AnalisisBack.md` §3 (CU02), §4 (RN10, RN20) y §7.

## 1. Propósito y quién la usa

- Cliente sin login que quiere ver el estado de su póliza, sus cuotas y pagar (CU02, RN20).
- Único formulario de la web pública. Recibe DNI y número de póliza y consulta al back con `POST /api/publico/consulta`.
- No guarda nada en el dispositivo (texto del Figma: "Tus datos viajan cifrados y no se guardan en este dispositivo."). El front no usa `localStorage`, `sessionStorage` ni cookies para estos datos.

## 2. Ruta propuesta y guardas de acceso

- Ruta propuesta: `/consultar-poliza` (app `web-publica`). PROPUESTA; el Figma no define rutas.
- Guardas: ninguna de sesión. Es pública.
- Rate limit (RN20): 10 intentos por minuto por IP, aplicado al prefijo `/api/publico/*`. El front no lo implementa; sólo muestra el estado "demasiados intentos" cuando el back responde 429.
- Salida a W3 (`Mi póliza`, propuesta `/poliza`) tras una consulta exitosa. El resultado viaja en el estado de navegación del router (`location.state`), igual que en W4 (`W4-elegir-medio-pago.md` §2). Ver sección 13.

## 3. Estructura visual

### 3.1 Desktop (frame 1440 × 1024, nodo 18:90)

Fondo y contenedor (igual a W1, con alto 1024):
- `Backdrop` (nodo 15:102): 1440×1024, degradado lineal 144.58° de `rgb(238,242,184)` a `rgb(213,221,227)`.
- `Shell` (nodo 15:104): 1392×976, posición left 24, top 24. Fondo `--nexa-surface-panel`, radio 24 px, sombra `Nexa/Shadow/Shell`. Padding interior 24 px en horizontal (el contenido se posiciona dentro de "Contenido", nodo 18:93, de 1392×976 con `pb 24` y `px 24`).

Regiones, de arriba a abajo:

1. **`PublicNav`** (nodo 14:179), alto 72 px, padding horizontal 24 px, gap 32 px. Logo `Logo/Nexa` a la izquierda; "Planes" y "Contacto" (Body 14/20, `--nexa-text-secondary`) y botón Primary "Consultar póliza" a la derecha. Mismo contenido que W1.

2. **Cuerpo** (nodo 18:104), flex 1, centrado en horizontal y vertical, gap 80 px, alto restante del Shell.
   - **Card consulta** (nodo 18:105): ancho 560 px, fondo `--nexa-surface-panel`, borde 1 px `--nexa-border-hairline`, radio 16 px, padding 40 px, gap 20 px. Contenido en columna.
     - Título "Consultá tu póliza": H1 28/34 SemiBold, `--nexa-text-primary`.
     - Bajada "Ingresá tu DNI y el número de póliza para ver su estado y pagar sus cuotas.": Body 14/20, `--nexa-text-secondary`. Ocupa 2 líneas.
     - **Input DNI** (nodo 18:108), gap 8 px, ancho completo:
       - Label "DNI": Label 12/16 Medium, `--nexa-text-secondary`.
       - Campo (nodo I18:108;11:48, "Field"): alto 40 px, ancho completo, fondo `--nexa-surface-panel`, borde 1 px `--nexa-border-strong` (#D3D5CE), radio `--nexa-radius-input` (12 px), padding horizontal 12 px, contenido centrado verticalmente. Texto de ejemplo "30123456" en JetBrains Mono Regular 13/18, color `--nexa-text-tertiary`.
       - Texto de ayuda "Sin puntos ni espacios.": Label 12/16 Medium, `--nexa-text-tertiary`.
     - **Input Número de póliza** (nodo 18:113): misma estructura. Label "Número de póliza". Campo con ejemplo "POL-0000042" en JetBrains Mono Regular 13/18, `--nexa-text-tertiary`. Ayuda "Los datos figuran en tu póliza.".
     - **Botón "Consultar"** (Button Primary, size M, nodo 11:6): ancho completo, alto 40 px, pill, fondo `--nexa-action-primary`, texto "Consultar" blanco Regular 14/20.
     - **Fila de privacidad** (nodo 18:120), gap 8 px: icono `icon/lock-key` 16 px (nodo 18:121) y texto "Tus datos viajan cifrados y no se guardan en este dispositivo." (Body-sm 13/18, `--nexa-text-secondary`, ocupa todo el ancho menos el icono).

   - **Mensajes de error** (nodo 18:124), columna de ancho 480 px, gap 12 px, alineada arriba. El Figma muestra los dos estados a la vez como ejemplos (ver sección 7):
     - Etiqueta "Estado: póliza no encontrada" (Label 12/16 Medium, `--nexa-text-secondary`, nodo 18:125).
     - Alerta (nodo 18:126): fondo `--nexa-status-cancelada-bg` (#FBE5E2), radio 12 px, padding 16 px, gap 12 px, alineada arriba. Icono `icon/warning-circle` 20 px (nodo 18:127). Texto de 14/20 en `--nexa-status-cancelada-text` (#B03A2E), ocupa el resto.
     - Etiqueta "Estado: demasiados intentos" (nodo 18:130).
     - Alerta (nodo 18:131): fondo `--nexa-status-suspendida-bg` (#FBF0D6), radio 12 px, padding 16 px. Icono `icon/clock` 20 px (nodo 18:132). Texto 14/20 en `--nexa-status-suspendida-text` (#9A6400).

3. **`PublicFooter`** (nodo 14:189), fondo `--nexa-surface-sidebar` (#F5F5F2), radio 16 px, padding 32/40, gap 24. Mismo contenido que W1: cuatro columnas (Teléfono, Email, Ubicación, Horarios) con valores "A confirmar", "A confirmar", "Dirección a confirmar", "Lunes a viernes, horario a confirmar", y el copyright.

### 3.2 Mobile (frame 390 × 1076, nodo 18:150; ver sección 11)

Ver sección 11.

## 4. Componentes del design system y propios

| Componente (nombre Figma) | Nodo | Uso | Descripción de Figma |
|---|---|---|---|
| `Shell` | 15:104 | Contenedor blanco | "Floating white app shell: 24px radius, only element with a drop shadow (Nexa/Shadow/Shell). Sits 24px inside the Backdrop." |
| `Logo/Nexa` | 14:5 | Nav | "Nexa monogram plus wordmark. The only hand-made brand mark." |
| `Button` (Primary, M) | 11:42 | "Consultar" (ancho completo) y nav "Consultar póliza" | "Pill button. Primary for the main action of a screen, Secondary for alternatives, Ghost for inline actions. Size M is 40px high, S is 32px high." |
| `Input` | 11:66 | DNI y Número de póliza | "Input field with label above, field, and helper text below. States: Default, Focus, Error, Disabled. Never use the placeholder as the label." |
| `Badge/Estado` | 11:117 | No se usa en W2 | |
| `PublicNav`, `PublicFooter` | 14:179, 14:189 | Barra y pie | |
| Íconos | `icon/lock-key` (18:121), `icon/warning-circle` (18:127), `icon/clock` (18:132) | Privacidad, alertas | Imágenes SVG; usar el SVG descargado con su tamaño raíz. |

Componentes propios de la pantalla:
- `FormularioConsultaPoliza` (card con dos `Input`, botón y fila de privacidad). Dominio `polizas`, carpeta `features/polizas/components/`. Una sola responsabilidad: presentación. La lógica (validación, mutación) va en un hook.
- `AlertaEstadoConsulta` (alerta con tono `error` o `aviso`, icono y texto). Se reutiliza en W3/W4 si aplica.

Notas del Figma sobre `Input`: "States: Default, Focus, Error, Disabled." El Figma muestra sólo Default. Ver sección 7.

## 5. Contenido textual literal

| Ubicación | Texto literal |
|---|---|
| Nav | `Planes`, `Contacto`, `Consultar póliza` |
| Título | `Consultá tu póliza` |
| Bajada | `Ingresá tu DNI y el número de póliza para ver su estado y pagar sus cuotas.` |
| Label DNI | `DNI` |
| Placeholder/ejemplo DNI | `30123456` |
| Ayuda DNI | `Sin puntos ni espacios.` |
| Label póliza | `Número de póliza` |
| Placeholder/ejemplo póliza | `POL-0000042` |
| Ayuda póliza | `Los datos figuran en tu póliza.` |
| Botón | `Consultar` |
| Privacidad | `Tus datos viajan cifrados y no se guardan en este dispositivo.` |
| Estado 1, etiqueta | `Estado: póliza no encontrada` |
| Estado 1, alerta | `No encontramos una póliza con esos datos. Revisá el DNI y el número de póliza.` |
| Estado 2, etiqueta | `Estado: demasiados intentos` |
| Estado 2, alerta | `Hiciste muchos intentos. Esperá un minuto y volvé a probar.` |
| Footer | `Teléfono`, `A confirmar`, `Email`, `A confirmar`, `Ubicación`, `Dirección a confirmar`, `Horarios`, `Lunes a viernes, horario a confirmar`, `© 2026 Nexa Seguros. Todos los derechos reservados.` |

Nota: el Figma usa la etiqueta "Estado: ..." como encabezado visible de cada alerta. Ver sección 13 (si es texto de UI o una anotación del diseño).

## 6. Campos y validaciones

| Campo | Tipo | Obligatorio | Máscara / formato | Regla exacta (back) | Mensaje (back) | Mensaje (Figma) |
|---|---|---|---|---|---|---|
| DNI (`dni`) | texto numérico | Sí | Sólo dígitos, sin puntos ni espacios | `[Required]` y `^\d{8}$` (`ConsultaPublicaRequest.Dni`) | "El DNI debe tener 8 dígitos." | Ayuda: "Sin puntos ni espacios." Sin mensaje de error en el Figma. NO DEFINIDO. |
| Número de póliza (`numeroPoliza`) | texto | Sí | Formato `POL-` + 7 dígitos, en mayúsculas | `[Required]` y `^POL-\d{7}$` (`ConsultaPublicaRequest.NumeroPoliza`) | "El número de póliza debe tener el formato POL-0000000." | Ayuda: "Los datos figuran en tu póliza." Sin mensaje de error en el Figma. NO DEFINIDO. |

Reglas de envío:
- El body de `POST /api/publico/consulta` es JSON: `{ "dni": "30123456", "numeroPoliza": "POL-0000042" }` (camelCase por defecto de ASP.NET; no hay `PropertyNamingPolicy` en el proyecto).
- Validación de formato en el front: coherente con el back (mismo regex). El front valida antes de llamar y muestra el error en el campo. Los textos del error de campo NO DEFINIDOS en el Figma: ver sección 13.
- El back devuelve 400 con `ValidationProblemDetails` (errores por campo) cuando falla la validación de DataAnnotations. Verificado: `Program.cs` no tiene `ApiBehaviorOptions`, `InvalidModelStateResponseFactory` ni `SuppressModelStateInvalidFilter`, así que rige el comportamiento por defecto de `[ApiController]`. Forma: `{ type, title, status: 400, errors: { <campo>: [mensaje] } }`. No verificado si la clave de `errors` sale como `dni` o como `Dni`: el front la lee como la devuelva el back y lo fija con un test de contrato.
- Si el usuario pega "pol-0000042" en minúsculas: NO DEFINIDO si el front lo pasa a mayúsculas. El back la rechaza.
- Botón "Consultar" deshabilitado mientras la consulta está en curso: NO DEFINIDO en el Figma (ver sección 7).

## 7. Estados

| Estado | Qué se ve | Fuente |
|---|---|---|
| Default | Card con campos vacíos, botón "Consultar" activo, sin alertas. | Figma: sólo Default está dibujado para los campos. |
| Foco (campo) | Borde y foco visibles. | Figma component `Input`: "States: Default, Focus, Error, Disabled." Los estados Focus, Error y Disabled no tienen frame en esta pantalla. NO DEFINIDO: colores y bordes de foco/error. |
| Error de campo (formato inválido en el front) | NO DEFINIDO en el Figma. | |
| Cargando (consulta en curso) | NO DEFINIDO en el Figma. Propuesta: botón con spinner y deshabilitado; campos deshabilitados. | |
| Éxito | Navega a W3 (ver sección 13). No hay frame de éxito en W2. | |
| Póliza no encontrada (404) | Alerta roja con "Estado: póliza no encontrada" y texto "No encontramos una póliza con esos datos. Revisá el DNI y el número de póliza." | Figma (nodo 18:126). Back: 404 `ProblemDetails` con `detail` = "No se encontró un registro con los datos indicados." (`VerificadorPublico.MensajeNoEncontrado`). El texto del Figma no es el del back. Ver sección 13. |
| Demasiados intentos (429) | Alerta amarilla con "Estado: demasiados intentos" y texto "Hiciste muchos intentos. Esperá un minuto y volvé a probar." | Figma (nodo 18:131). Back: 429 `ProblemDetails` (`PublicoRateLimitExtensions.EscribirRechazoAsync`), ventana fija de 60 s, 10 permisos. |
| Error de servidor (500) / sin conexión | NO DEFINIDO en el Figma. Propuesta: alerta genérica con texto a definir. | |
| Deshabilitado | Botón deshabilitado durante la consulta y después de un 429 hasta que pase el minuto. NO DEFINIDO en el Figma. | |

Qué se muestra cuando hay un error: el Figma muestra las alertas en la columna derecha (desktop) y debajo del botón (mobile). En runtime sólo aparece la alerta que corresponde al último resultado. El Figma muestra los dos estados juntos como documentación. Confirmar. Ver sección 13.

## 8. Acciones y navegación

| Elemento | Acción | Destino |
|---|---|---|
| "Consultar" (submit) | Valida; si es válido llama a `POST /api/publico/consulta` | Éxito: W3 (ruta NO DEFINIDA). Error: mostrar alerta (sección 7). |
| Nav "Consultar póliza" | Link | Esta misma pantalla (`/consultar-poliza`). NO DEFINIDO si debe ir a esta ruta o quedar sin acción. |
| Nav "Planes" | Link | NO DEFINIDO (propuesta: `/#planes`, W1). |
| Nav "Contacto" | Link | NO DEFINIDO (propuesta: ancla del footer). |
| Logo | Link | NO DEFINIDO (propuesta: `/`, W1). |
| Footer | Sin acciones | |
| Icono de privacidad | Sin acción | |
| Mobile: ícono `icon/list` (menú) | Abre menú | NO DEFINIDO. |

## 9. Datos: endpoints y campos

### 9.1 Endpoint principal

| Método y ruta | Estado | Body | Respuesta exitosa | Errores |
|---|---|---|---|---|
| `POST /api/publico/consulta` | Implementado (existe en `development`, `PublicoConsultaController.cs`). | `ConsultaPublicaRequest`: `dni` (8 dígitos), `numeroPoliza` (`POL-` + 7 dígitos). | 200 `ConsultaPublicaResponse` | 400 (validación), 404 (no encontrada: mismo mensaje si el DNI o la póliza no coinciden, RN20), 429 (rate limit), 500. |

Pasar DNI en el body, no en la URL (`AnalisisBack.md` §7): nunca en query string ni en log de URL.

### 9.2 Campos del `ConsultaPublicaResponse` (JSON camelCase)

| Campo JSON | Tipo | Dato en pantalla | Nota |
|---|---|---|---|
| `numeroPoliza` | string | Número de póliza (en W3, no en W2) | |
| `estado` | string | Estado de la póliza (en W3) | Viene en MAYÚSCULAS (`Etiqueta` = `ToUpperInvariant`): "VIGENTE", "PENDIENTE", "SUSPENDIDA", "CANCELADA", "VENCIDA". |
| `coberturaVigente` | bool | No se muestra en W2 | RN10 |
| `vigenteDesde`, `vigenteHasta` | DateOnly (ISO `YYYY-MM-DD`) | Vigencia (W3) | |
| `plan.codigo`, `plan.nombre` | string | Plan (W3) | |
| `vehiculo.patente`, `vehiculo.marca`, `vehiculo.modelo`, `vehiculo.anio` | string/int | Vehículo (W3) | |
| `cuotas[].idCuota` | Guid | Id para pagar (W3/W4) | |
| `cuotas[].numero`, `importe`, `recargo`, `total`, `vencimiento`, `estado` | int/decimal/DateOnly/string | Cuotas (W3) | `estado` en MAYÚSCULAS. |

W2 no muestra datos de la respuesta: sólo navega a W3 si la consulta es exitosa. Los datos viajan en `location.state` del router (no van en la URL ni en storage). Ver sección 13.

### 9.3 Mapeo de errores HTTP

| Código | Fuente en el back | Mensaje a mostrar |
|---|---|---|
| 400 | DataAnnotations (`ValidationProblemDetails`) | Mensaje del campo (ver sección 6). |
| 404 | `NotFoundException(MensajeNoEncontrado)` → `ProblemDetails` con `title` "Not Found", `detail` "No se encontró un registro con los datos indicados.". No trae `codigo`. | Alerta "Estado: póliza no encontrada" con el texto del Figma. El `detail` NO se muestra. |
| 429 | `EscribirRechazoAsync` (`PublicoRateLimitExtensions.cs:74-90`) → `ProblemDetails` con `detail` "Se superó el límite de intentos. Volvé a intentarlo en un minuto." y `traceId` en `extensions`. No envía `Retry-After`. | Alerta "Estado: demasiados intentos" con el texto del Figma. El `detail` no se muestra. |
| 500 | `ExceptionMiddleware` → `ProblemDetails` | NO DEFINIDO (ver sección 7). |

## 10. Reglas de negocio visibles

- **RN20.** La consulta exige DNI y número de póliza, y los dos deben corresponder a la misma póliza. Si no coinciden, se responde "no encontrada" sin decir cuál de los dos está mal. El texto del Figma respeta esto: "Revisá el DNI y el número de póliza." (no dice cuál).
- **RN20 (rate limit).** 10 intentos por minuto por IP (`PermitLimitPorDefecto` = 10, `VentanaSegundosPorDefecto` = 60). Se refleja en "Esperá un minuto y volvé a probar.".
- **RN10.** Sólo una póliza Vigente da cobertura. No se muestra en W2; aplica en W3.
- **RN16.** Los importes están en pesos. Aplica en W3.

## 11. Responsive (mobile, frame 390 × 1076, nodo 18:150)

Descripción completa del frame W2m (`W2 Consultar póliza mobile`):

- `Backdrop` (nodo 15:102): 390×1076, mismo degradado de W2.
- `Shell` (nodo 15:104): 358×1044, posición left 16, top 16, radio 24 px, sombra `Nexa/Shadow/Shell`, fondo `--nexa-surface-panel`.
- **Barra superior** "Navegación" (nodo 18:154): alto 72 px, padding horizontal 20 px, `justify-between`. A la izquierda `Logo/Nexa` (nodo 14:5). A la derecha, ícono `icon/list` 24 px (nodo 18:159). No hay botón "Consultar póliza" en la barra mobile (en desktop sí).
- **Cuerpo** "Cuerpo" (nodo 18:161): padding horizontal 20 px, vertical 24 px, gap 16 px, ancho completo.
  - Título "Consultá tu póliza" (H1 28/34 SemiBold).
  - Bajada "Ingresá tu DNI y el número de póliza para ver su estado y pagar sus cuotas." (Body 14/20, ocupa 2 líneas).
  - "Input DNI" (nodo 18:164), gap 8 px, igual que desktop, ancho completo.
  - "Input Número de póliza" (nodo 18:169), igual que desktop.
  - Botón "Consultar" (Primary, M, 40 px), ancho completo (en el código de referencia no tiene `data-node-id` propio; es la instancia de `Button`).
  - Fila privacidad (nodo 18:176): icono `icon/lock-key` 16 px (nodo 18:177) y texto (nodo 18:179) de 13/18 `--nexa-text-secondary`, que ocupa 2 líneas.
  - "Mensajes de error" (nodo 18:180), gap 12 px, ancho completo:
    - "Estado: póliza no encontrada" (nodo 18:181), Label 12/16 Medium.
    - Alerta (nodo 18:182): fondo `--nexa-status-cancelada-bg`, radio 12, padding 16, icono `icon/warning-circle` 20 px (nodo 18:183), texto 14/20 `--nexa-status-cancelada-text` (nodo 18:185): "No encontramos una póliza con esos datos. Revisá el DNI y el número de póliza." (3 líneas en 390 px).
    - "Estado: demasiados intentos" (nodo 18:186).
    - Alerta (nodo 18:187): fondo `--nexa-status-suspendida-bg`, icono `icon/clock` (nodo 18:188), texto 14/20 `--nexa-status-suspendida-text` (nodo 18:190): "Hiciste muchos intentos. Esperá un minuto y volvé a probar." (2 líneas).
- **Pie** "Pie" (nodo 18:191): padding superior 24, inferior 32, horizontal 20, gap 8 px. En columna, no como `PublicFooter`:
  - "Teléfono" (Medium 12/16, primario) y "A confirmar" (Regular 13/18, secundario).
  - "Email" y "A confirmar".
  - "Ubicación" y "Dirección a confirmar".
  - "Horarios" y "Lunes a viernes, horario a confirmar".
  - "© 2026 Nexa Seguros. Todos los derechos reservados." (Caption 11/14, tertiary).
- No hay `PublicFooter` en mobile; el pie tiene su propio layout (nodo 18:191).

Diferencias desktop ↔ mobile:
- Desktop: nav completa con botón "Consultar póliza"; mobile: sólo logo y menú.
- Desktop: card y alertas en dos columnas (card 560 px y alertas 480 px). Mobile: todo apilado en una columna a ancho completo.
- Desktop: alertas a la derecha de la card. Mobile: alertas debajo del botón y de la privacidad.
- Desktop: footer con cuatro columnas en fila. Mobile: lista vertical de etiqueta y valor.

## 12. Accesibilidad

- Un solo `h1` ("Consultá tu póliza"). Las etiquetas "Estado: ..." son `h2`, `h3` o `p` con `role` NO DEFINIDO; proponer `p`.
- Cada `Input` con `<label>` asociado (no sólo placeholder: el Figma lo indica en la descripción de `Input`: "Never use the placeholder as the label"). Los textos "30123456" y "POL-0000042" son ejemplos de placeholder, no label.
- Ayudas (`Sin puntos ni espacios.`, `Los datos figuran en tu póliza.`) asociadas al campo con `aria-describedby`.
- Errores de campo: `aria-invalid="true"` y el mensaje asociado con `aria-describedby`. Textos NO DEFINIDOS en el Figma.
- Alertas de resultado (404, 429): `role="alert"` (o `aria-live="assertive"`) para que el lector de pantalla anuncie el error al aparecer.
- Botón "Consultar": tipo `submit`. Estado de carga con `aria-busy` o texto accesible; NO DEFINIDO.
- Ícono de alerta: `alt=""` (decorativo) porque el texto ya dice el estado. El ícono de privacidad también es decorativo.
- Foco: los campos y el botón deben tener anillo de foco. El Figma tiene un estado "Focus" en el componente `Input`, pero no está dibujado en esta pantalla. NO DEFINIDO.
- Contraste: no verificado. Revisar `--nexa-status-suspendida-text` (#9A6400) sobre `--nexa-status-suspendida-bg` (#FBF0D6) y `--nexa-status-cancelada-text` (#B03A2E) sobre `--nexa-status-cancelada-bg` (#FBE5E2). Verificar antes de dar por aceptado.
- Tamaño de toque mobile: el botón mide 40 px de alto. WCAG 2.2 nivel AA (2.5.8) pide al menos 24×24 px, así que cumple; 44 px es la recomendación AAA (2.5.5). Confirmar la meta del proyecto. El Figma no define tamaños de toque.
- Orden de tabulación: nav → DNI → Número de póliza → Consultar → privacidad (no interactiva) → footer.

## 13. Dudas e inconsistencias Figma ↔ back

1. **Texto del 404.** El Figma dice "No encontramos una póliza con esos datos. Revisá el DNI y el número de póliza.". El back devuelve `detail` = "No se encontró un registro con los datos indicados.". Decisión: el front muestra el texto del Figma (no el del back) porque el back no da un código específico. Confirmar con el equipo de diseño y el de back. Recomendado: no mostrar el `detail` del back para no filtrar información (RN20).
2. **"Estado: ..." como texto visible.** Cada alerta tiene una etiqueta "Estado: póliza no encontrada" / "Estado: demasiados intentos". ¿Es texto de la UI o una anotación del diseño que muestra qué estado representa cada alerta? Si es anotación, no se renderiza. NO DEFINIDO.
3. **Estados mostrados juntos.** El Figma muestra las dos alertas al mismo tiempo. Según la lógica, sólo puede aparecer una por vez (el último resultado). ¿Confirmar que son ejemplos y no un estado simultáneo?
4. **Destino tras una consulta exitosa.** El Figma no tiene frame de éxito en W2. El front pasa a W3 (`Mi póliza`). Falta definir: (a) la ruta de W3 (propuesta: `/poliza`, igual que el prefijo de W4); (b) cómo llegan los datos: propuesta `location.state` del router, como W4 (`W4-elegir-medio-pago.md` §2), nunca en la URL (`AnalisisBack.md` §7: el DNI viaja en el body). Si se recarga la página, el router conserva el estado de la entrada; si se abre W3 sin estado, redirigir a W2. Confirmar.
5. **Errores de campo.** El Figma no dibuja el estado Error del `Input`. No hay texto para "DNI inválido" ni "número de póliza inválido". El back sí define los mensajes ("El DNI debe tener 8 dígitos.", "El número de póliza debe tener el formato POL-0000000."). ¿Se usan los del back o hay que diseñar el estado? NO DEFINIDO.
6. **Estado de carga y botón deshabilitado.** No hay frames para la consulta en curso ni para el botón deshabilitado. NO DEFINIDO.
7. **Bloqueo por 429.** El Figma dice "Esperá un minuto y volvé a probar." pero no define si el botón queda bloqueado un minuto ni cuánto dura el contador. Verificado: `EscribirRechazoAsync` no envía `Retry-After`, así que el front no sabe cuánto esperar (la ventana del back es fija de 60 s). Pregunta: ¿el botón queda deshabilitado 60 s desde el 429 con un contador en el front, o queda activo? NO DEFINIDO. Pedir al back que agregue `Retry-After` es opción de menor riesgo.
8. **Nav "Consultar póliza" en W2.** Está presente en la nav aunque la pantalla ya es esa consulta. ¿Debe ir a la misma ruta, quedar inactivo o ocultarse? NO DEFINIDO.
9. **Acceso a W3 directo por URL.** Si alguien entra a `/poliza` sin estado de consulta, ¿redirige a W2? Propuesta: sí. NO DEFINIDO en el Figma.
10. **Datos del titular en W3.** W3 muestra "Titular: Tomás Iturralde" y "DNI 30.123.456". `ConsultaPublicaResponse` NO trae nombre del titular ni DNI (RN20: no devuelve ids de cliente; sólo datos del producto, vehículo y cuotas). Este dato no tiene fuente en el back. Ver W3, sección 13.
11. **Mayúsculas de la póliza.** El back exige `POL-` en mayúsculas. ¿El front convierte el texto a mayúsculas al escribir? NO DEFINIDO.
12. **Validación de `Input` en el Figma.** El texto "Sin puntos ni espacios." es ayuda, no error. ¿Se muestra siempre o sólo cuando hay error? NO DEFINIDO.
13. **Nav y pie mobile distintos entre W2m y W3m** (detectado en US-FE-V-06). Los dos frames mobile dibujan el marco de otra forma y la app no puede seguir a los dos:
    - W2m (`18:150`): Shell a 16 px del borde, nav de 72 px con padding horizontal 20 px, pie (`18:191`) sin fondo, con label `Nexa/Label` en `--nexa-text-primary` y valor `Nexa/Body-sm` en `--nexa-text-secondary`, gap 8 px.
    - W3m (`18:1772`): Shell a 12 px del borde, barra de 60 px con padding 16 px, pie (`18:2164`) con fondo `--nexa-surface-subtle`, label `Nexa/Label` en `--nexa-text-secondary` y valor `Nexa/Body` en `--nexa-text-primary`, gap 12 px.
    Mientras diseño no unifique un solo marco mobile, la app mantiene el de `US-FE-T-18` (Shell a 16 px, nav de 72 px y el `PublicFooter` apilado con fondo). Pregunta a diseño: ¿cuál de los dos es el correcto? NO DEFINIDO.
14. **Padding superior del Shell en W2 desktop** (detectado en US-FE-V-06). En W2 (`18:90`) la nav arranca pegada al borde superior del Shell; en W1 (`18:201`) y W3 (`18:47`) tiene 24 px arriba. La app usa el mismo padding de 24 px en todas las pantallas. Confirmar con diseño.

## 14. Referencia Figma

- Página `01 Web publica`.
- W2 desktop: nodo `18:90`. URL: https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-90
- W2m mobile: nodo `18:150`. URL: https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-150
- Subnodos clave desktop: Cuerpo `18:104`; Card consulta `18:105`; Input DNI `18:108`; Input Número de póliza `18:113`; Privacidad `18:120`; Mensajes de error `18:124`; Alerta 1 `18:126`; Alerta 2 `18:131`.
- Subnodos clave mobile: Navegación `18:154`; Cuerpo `18:161`; Input DNI `18:164`; Input Número `18:169`; Privacidad `18:176`; Mensajes de error `18:180`; Alerta 1 `18:182`; Alerta 2 `18:187`; Pie `18:191`.
