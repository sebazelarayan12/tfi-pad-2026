# B1 · Login del backoffice

Especificación de la pantalla de acceso al panel interno (backoffice). Fuente visual: Figma `B1 Login` (nodo 18:2178). Fuente de contrato: código del back (`backend/Aseguradora.Api/Controllers/AuthController.cs`, `backend/Aseguradora.Application/Security/`) y `docs/tareas-divididas.md` (US-F1-03). Las reglas de `00-decisiones-base.md` aplican: TypeScript estricto, TanStack Query para la llamada, react-hook-form + zod para el formulario, sin `fetch` suelto en componentes.

Convención de este documento: "Figma" = lo que muestra el diseño; "Back" = lo que implementa el código; "Propuesta" = decisión que el diseño no toma y que el equipo debe confirmar (aparece también en la sección 13).

## 1. Propósito y quién la usa

- **Propósito:** que un empleado o un administrador ingrese al panel interno con email y contraseña y reciba un JWT con su rol.
- **Quién la usa:** rol **Empleado** y rol **Administrador**. Ambos entran por el mismo formulario.
- **Quién NO la usa:** los clientes. No tienen usuario ni login (RN17, tareas US-F1-03 "Fuera de alcance"). La web pública (`apps/web-publica`) no tiene pantalla de login.

## 2. Ruta propuesta y guardas de acceso

- **Ruta:** `/login` (Propuesta; el diseño no define la ruta).
- **Guarda pública:** la ruta es accesible sin sesión.
- **Usuario ya autenticado** (hay token guardado y `expiraEn` es futuro): redirigir a `/inicio` (Propuesta).
- **Redirección tras login exitoso:** `/inicio` para ambos roles (Propuesta). El diseño no muestra una pantalla de inicio distinta por rol. El campo `rol` de la respuesta vale `"Administrador"` o `"Empleado"` (constantes de `backend/Aseguradora.Application/Security/Roles.cs`).
- **Guardas de rutas internas (fuera de esta pantalla, para el router):**
  - Sin token o token vencido: redirigir a `/login` y, si se puede, recordar la ruta de origen para volver después del login (Propuesta).
  - Rutas solo de administrador: `Politicas.Admin` en el back (`POST /api/auth/usuarios`, `POST/PUT/DELETE /api/planes`). En el front deben mostrarse solo con `rol === "Administrador"`. Ver duda D3.

## 3. Estructura visual

Frame de escritorio de 1440 × 1024 px (solo escritorio, ver sección 11).

De arriba abajo y de afuera hacia adentro:

1. **Backdrop** (`Backdrop`, 1440 × 1024): degradado lineal de fondo, de `rgb(238,242,184)` (0%) a `rgb(213,221,227)` (100%), ángulo 144.58°.
2. **Shell** (contenedor principal): posición `left 24 / top 24`, 1392 × 976 px. Fondo `--nexa-surface-panel` (blanco), radio `--nexa-radius-shell` (24 px), padding `--nexa-spacing-16` (16 px), sombra `Nexa/Shadow/Shell` (0 24 60, color `#3C4628` al 10 %). Contiene dos columnas en fila sin espacio entre ellas.
   - **Columna izquierda "Acceso formulario"**: 680 × 944 px (con 16 px de padding del shell). Padding interno 48 px. Contenido centrado en vertical y horizontal dentro de la columna. Fondo blanco.
     - **Formulario**: 360 px de ancho, columna flex con `gap` de 24 px. Apila, de arriba abajo: logo, encabezado, campos, botón, alerta de error.
       1. **Logo** (`Logo/Nexa`): 143 × 28 px.
       2. **Encabezado**: 360 × 78 px, `gap` 8 px. Título y subtítulo.
       3. **Campos**: 360 × 192 px. Campo Email (88 px de alto con su label), campo Contraseña (104 px, con el icono del ojo absoluto a `left 324 / top 34` dentro del campo y el enlace de ayuda debajo, alineado a la derecha).
       4. **Botón "Ingresar"**: 360 × 40 px, ancho completo.
       5. **Alerta de error** (`Ejemplo error de acceso`): 360 × 44 px. Solo visible cuando el login falla (ver sección 7). Radio 16 px, padding 16 / 12, icono 20 px a la izquierda, texto a 44 px de la izquierda.
   - **Columna derecha "Panel de marca"**: 680 × 944 px. Fondo `--nexa-accent-lime-soft` (`#f3f7c9`), radio 16 px, padding 24 px, `gap` 24 px.
     - **Área de imagen** (`IMG sede atencion 592x320`): 632 × 820 px, radio 16 px, fondo `--nexa-surface-subtle` (`#f1f2ee`). Ver duda D6: el diseño no trae la imagen real.
     - **Texto del panel** (`Texto panel`): 632 × 52 px, bloque inferior con título y descripción separados 8 px.

Medidas clave del formulario: título a 28 px (interlineado 34), subtítulo 13 px (interlineado 18), labels 12 px (interlineado 16), campos de 40 px de alto con radio `--nexa-radius-input` (12 px) y borde de 1 px `--nexa-border-strong` (`#d3d5ce`), padding horizontal de `--nexa-spacing-12` (12 px). Botón de 40 px de alto, radio pill (`--nexa-radius-pill`, 999 px), padding horizontal 16 px.

## 4. Componentes del design system y componentes propios

Componentes del Figma (nombres exactos):

| Nombre en Figma | Id | Uso en esta pantalla |
|---|---|---|
| `Logo/Nexa` | 14:5 | Marca en la parte superior del formulario. Es "el único logo hecho a mano" según la nota del componente. |
| `Input` | 11:66 | Campos Email y Contraseña. Estados del componente: Default, Focus, Error, Disabled. La nota dice: "Nunca usar el placeholder como label". |
| `Button` | 11:42 | Botón "Ingresar": variante Primary, tamaño M (40 px). |
| `Backdrop` | (instancia) | Fondo de pantalla completa. |

Iconos del Figma (no son componentes; ver nota sobre assets en la sección 14):

- `icon/eye` (18:2202, 20 × 20 px): alterna visibilidad de la contraseña (comportamiento no definido, ver D-10 en la sección 13).
- `icon/warning-circle` (18:2207, 20 × 20 px): icono de la alerta de error.

Componentes propios de la pantalla (no están en el design system, proponer en `packages/ui` solo si se reutilizan):

- `LoginForm` (pantalla): compone `Logo`, `Encabezado`, dos `Input`, `Button` y la alerta.
- `AlertaError` (inline): caja con icono y texto. Se puede reutilizar en otras pantallas (Figma la usa también en B4 con el mismo patrón).
- `PanelDeMarca` (pantalla): área de imagen y texto. Solo en B1.

Layout: esta pantalla no usa el shell del backoffice (no tiene sidebar). No debe usar `features/auth` para el layout del panel; va en `app/` como layout de acceso (regla FB3-4).

## 5. Contenido textual literal

Copiado del Figma. Tildes y puntuación tal como aparecen.

| Elemento | Texto |
|---|---|
| Logo (texto junto a la marca) | `Nexa Seguros` |
| Título (H1, 28 px) | `Ingresar al panel` |
| Subtítulo (13 px) | `Acceso para empleados y administradores de Nexa Seguros.` |
| Label campo email | `Email` |
| Valor de ejemplo del campo email (estado de muestra) | `mariela.quiroga@nexaseguros.com.ar` |
| Label campo contraseña | `Contraseña` |
| Valor de ejemplo del campo contraseña (estado de muestra) | `••••••••••` |
| Enlace de ayuda bajo la contraseña (texto alineado a la derecha) | `¿Olvidaste tu contraseña? Pedila a un administrador.` |
| Botón | `Ingresar` |
| Mensaje de error de acceso | `Email o contraseña incorrectos.` |
| Título del panel de marca (20 px) | `Panel interno de Nexa Seguros` |
| Descripción del panel (13 px) | `Clientes, pólizas, cuotas y cobros en un solo lugar.` |

Textos que aparecen en el Figma pero NO son copy de UI (no renderizar):

- `Foto: sede de atención`: rótulo de la imagen de muestra. Es una anotación.
- Los valores `mariela.quiroga@…` y `••••••••••` son datos de muestra. Ver D-8.

Textos de validación de campos: **NO DEFINIDO en el Figma.** El back devuelve estos mensajes para `LoginRequest` (archivo `backend/Aseguradora.Application/Security/DTOs/LoginRequest.cs`), que el front puede usar como base mientras diseño los confirme:

- `El email es obligatorio.`
- `El email no tiene un formato válido.`
- `La contraseña es obligatoria.`

## 6. Campos y validaciones

| Campo | Tipo | Obligatorio | Regla exacta | Fuente |
|---|---|---|---|---|
| Email | texto, `type="email"`, `autocomplete="username"` | Sí | Formato de email válido (`[EmailAddress]` del back). Se recorta espacios al inicio y final (Propuesta). | `LoginRequest.Email` |
| Contraseña | texto, `type="password"`, `autocomplete="current-password"` | Sí | Solo obligatoria. El back no valida longitud mínima en el login. | `LoginRequest.Password` |

Reglas de forma:

- El body del request es `{ "email": string, "password": string }` (JSON camelCase; ver `LoginRequest`).
- La validación del front debe coincidir con la del back: si el email no tiene formato válido, el front lo marca antes de enviar. El back sigue siendo la fuente de verdad.
- **Momento de validación: NO DEFINIDO.** Propuesta: validar al enviar el formulario y revalidar el campo al cambiarlo una vez que ya tuvo error.
- Sin "Recordarme", sin captcha y sin bloqueo local por intentos. La limitación de intentos (RN20) aplica solo a `/api/publico/*`, no al login del panel. Ver duda D-4.

## 7. Estados

| Estado | Qué se muestra |
|---|---|
| Inicial (vacío) | Campos vacíos, botón "Ingresar" habilitado, sin alerta. |
| Foco en campo | Borde del `Input` en estado Focus. El Figma tiene el estado en el componente, pero no muestra el color: usar el token de foco del design system (NO DEFINIDO en el Figma). |
| Error de validación de campo | `Input` en estado Error, con mensaje bajo el campo (copy en sección 5, "no definido en Figma"). |
| Enviando (cargando) | **NO DEFINIDO en el Figma.** Propuesta: campos deshabilitados y botón "Ingresar" deshabilitado con indicador de carga. El texto del botón se mantiene. |
| Error de acceso (401) | Alerta `Ejemplo error de acceso` debajo del botón con el texto `Email o contraseña incorrectos.` El campo contraseña se vacía (Propuesta). Ver D-1 sobre el texto que devuelve el back. |
| Error de red / servidor (5xx, timeout, sin conexión) | **NO DEFINIDO.** Propuesta: alerta con texto genérico, sin cambiar el texto del 401. |
| Deshabilitado | `Input` y botón en estado Disabled mientras se envía. |
| Éxito | Sin pantalla propia: se guarda la sesión y se redirige a `/inicio`. |
| Sesión vencida (redirigido desde otra pantalla) | **NO DEFINIDO.** Propuesta: mostrar en `/login` el texto `Tu sesión venció. Volvé a ingresar.` (copy no diseñado). |

## 8. Acciones y navegación

| Elemento | Acción | Destino |
|---|---|---|
| Botón `Ingresar` | Valida el formulario. Si es válido, hace `POST /api/auth/login`. En 200 guarda la sesión (sección 9) y navega. | `/inicio` (Propuesta). |
| Enlace `¿Olvidaste tu contraseña? Pedila a un administrador.` | Es texto, no un link. El Figma no le asigna destino. | Ninguno. Ver D-4. |
| Icono `eye` | Alterna la visibilidad de la contraseña. | **NO DEFINIDO** en el Figma. Propuesta: `aria-label` "Mostrar contraseña" / "Ocultar contraseña". |
| Tecla Enter dentro de un campo | Envía el formulario (Propuesta, comportamiento estándar de `<form>`). | Igual que el botón. |

## 9. Datos: endpoints y origen de cada dato

Esta pantalla no muestra datos de negocio. Solo consume autenticación.

| Método y ruta | Estado | Request | Response 200 | Errores |
|---|---|---|---|---|
| `POST /api/auth/login` | **Implementado** (`AuthController.cs`, `[AllowAnonymous]`) | `LoginRequest { email, password }` | `LoginResponse { token, rol, expiraEn }` | `401` con `ProblemDetails` y `detail: "Credenciales inválidas."` (mismo mensaje para email inexistente y contraseña incorrecta, `CredencialesInvalidasException`). `400` por validación del modelo (formato estándar de ASP.NET; confirmar con `contratos-api/convenciones-transversales.md`). `500` con mensaje genérico. |

Campos que la UI usa de la respuesta:

- `token`: JWT. Se envía como `Authorization: Bearer <token>` en las siguientes llamadas.
- `rol`: `"Administrador"` o `"Empleado"`. Decide el menú (ver D-3).
- `expiraEn`: `DateTimeOffset` en UTC. La UI lo compara con el reloj local para saber cuándo cerrar la sesión.

Almacenamiento de la sesión: **NO DEFINIDO en el Figma ni en el back.** Opciones con su tradeoff (decidir en la reunión, ver D-2):

- `localStorage`: sobrevive al cierre del navegador. Un script malicioso en la página puede leer el token.
- `sessionStorage`: se borra al cerrar la pestaña. Mismo riesgo de lectura por script, con vida más corta.
- Solo memoria (estado de la aplicación): no se puede leer desde el storage, pero se pierde al recargar. El usuario debe volver a ingresar en cada recarga.

Propuesta: `sessionStorage` con `token`, `rol` y `expiraEn`, y verificación de `expiraEn` al arrancar la app. No usar `localStorage` para el token.

Expiración: el JWT vence según `Jwt:ExpiracionMinutos` (default 480 minutos, ocho horas; `JwtOpciones.cs`). No hay endpoint de renovación ni de cierre de sesión (fuera de alcance según US-F1-03). Consecuencia para el front:

- Al llegar a `expiraEn`, o ante cualquier `401` de otra llamada, borrar la sesión y redirigir a `/login`.
- No intentar renovar el token.

## 10. Reglas de negocio visibles

- **RN17.** Roles: Administrador y Empleado. Los clientes no tienen usuario, por lo que esta pantalla no tiene alta de cuenta de cliente ni login de cliente. El alta de empleados (CU03) es `POST /api/auth/usuarios`, solo para administrador, y no está en esta pantalla.
- **RN20.** No aplica a esta pantalla. Pertenece a `/api/publico/*`. El login del panel no tiene límite de intentos definido en el análisis. Ver D-4.

## 11. Responsive

- El Figma solo tiene frame de escritorio de 1440 px. **No hay frame mobile del backoffice.** Esta pantalla es solo escritorio según el diseño.
- Propuesta de comportamiento por debajo de 1024 px (no diseñado): ocultar `PanelDeMarca` y centrar el formulario en la pantalla. El formulario mantiene 360 px de ancho máximo.
- El shell (`Shell`, radio 24 px) no debe quedar pegado a los bordes: sin scroll horizontal en ningún ancho.

## 12. Accesibilidad

- Cada `Input` tiene su `label` visible asociado con `htmlFor`/`id`. No usar el placeholder como label (nota del componente `Input`).
- El mensaje de error de campo va asociado con `aria-describedby` y el campo marca `aria-invalid="true"`.
- La alerta de error de acceso tiene `role="alert"` para que los lectores de pantalla la anuncien.
- Tras un error, el foco vuelve al campo email (Propuesta).
- El botón del ojo necesita `aria-label` (no está en el Figma) y `aria-pressed` si es un toggle.
- Los iconos decorativos (`icon/eye` en el campo, `icon/warning-circle` en la alerta) tienen `alt=""` o `aria-hidden="true"`. El icono del ojo es interactivo: va con `aria-label`.
- Contraste: el texto secundario `--nexa-text-secondary` (`#5c6066`) sobre blanco supera 4.5:1. El texto de la alerta (`--nexa-status-cancelada-text`, `#b03a2e`) sobre `--nexa-status-cancelada-bg` (`#fbe5e2`) cumple para texto de 13 px. Verificar en el build con la herramienta de contraste.
- El `PanelDeMarca` decorativo no debe ser leído por el lector de pantalla si no aporta: `aria-hidden` sobre la imagen. El título del panel sí es contenido.

## 13. Dudas e inconsistencias Figma ↔ back

- **D-1. Texto del error de acceso.** El Figma muestra `Email o contraseña incorrectos.`. El back devuelve `Credenciales inválidas.` en el `detail` del 401 (`CredencialesInvalidasException.Mensaje`). Propuesta: la UI muestra el texto del Figma y no usa el `detail` del back para este caso. Confirmar con diseño.
- **D-2. Almacenamiento del token.** Ni el Figma ni las tareas definen dónde guardar el JWT. Ver opciones en la sección 9. Propuesta: `sessionStorage`. Decisión del equipo.
- **D-3. Menú por rol.** El sidebar de B2 (Inicio) muestra "Planes" y "Usuarios" a una usuaria con rol **Empleado** (Mariela Quiroga, "Empleado"). En el back, `POST /api/planes` y `PUT`/`DELETE` son solo `Politicas.Admin`, y `POST /api/auth/usuarios` también. ¿El Empleado debe ver esos ítems, o el diseño es incorrecto? Esta pantalla no lo resuelve, pero afecta la redirección y las guardas.
- **D-4. Recuperación de contraseña y límite de intentos.** El texto dice "Pedila a un administrador", por lo que no hay flujo de recuperación en la app. Consistente con el back (no hay endpoint de cambio de contraseña en las tareas). Confirmar que el enlace de ayuda no navega a ningún lado. El login del panel no tiene límite de intentos: ¿se quiere uno?
- **D-5. Cierre de sesión.** No hay botón de logout en B1. El menú de usuario del sidebar (B2) tiene un icono de tres puntos sin acción definida. Sin endpoint de logout en el back, el cierre de sesión sería solo borrar el token en el cliente. Confirmar.
- **D-6. Imagen del panel de marca.** El Figma tiene un frame `IMG sede atencion 592x320` sin imagen real. **NO DEFINIDO qué imagen va.** Pedir el asset al diseño antes de construir; no inventar una foto.
- **D-7. Estados sin diseño.** Cargando, foco, error de campo, deshabilitado y error de red no tienen valores visuales definidos. Usar los tokens del design system y pedir confirmación.
- **D-8. Valores de ejemplo.** El email `mariela.quiroga@nexaseguros.com.ar` y la contraseña `••••••••••` están cargados en el Figma. Confirmar que son ejemplos y que el campo arranca vacío.
- **D-9. Copy de validaciones.** Los mensajes de la sección 5 no están en el Figma. Tomados del back. Confirmar.
- **D-10. Icono del ojo.** Sin definición de comportamiento ni de estado (mostrar/ocultar). Ver sección 8.

## 14. Referencia Figma

- Frame principal: `B1 Login`, nodo **18:2178**.
  URL: https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=18-2178
- Nodos clave:
  - Shell: 18:2180
  - Acceso formulario: 18:2181
  - Formulario: 18:2182
  - Encabezado: 18:2187
  - Campos: 18:2190
  - Input Email: 18:2191
  - Input Contraseña: 18:2197
  - Icono del ojo `icon/eye`: 18:2202
  - Botón "Ingresar": 18:2204
  - Alerta de error: 18:2206
  - Panel de marca: 18:2210
  - Imagen de muestra: 18:2212
  - Texto del panel: 18:2728
- Página: `02 Backoffice`.

**Nota sobre assets:** los iconos (`icon/eye`, `icon/warning-circle`) y la marca vienen como SVG temporales de Figma (`figma.com/api/mcp/asset/...`) que expiran en 7 días. Al implementar, exportarlos a la carpeta de assets del proyecto y referenciarlos localmente. El `NavItem` de la nota del Figma indica que los iconos son "Phosphor Regular": usar el set Phosphor equivalente si el design system lo define (confirmar).
