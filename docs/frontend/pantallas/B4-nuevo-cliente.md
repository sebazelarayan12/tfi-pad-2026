# B4 · Nuevo cliente (alta con validación Renaper)

Especificación del formulario de alta de cliente del panel interno. Fuente visual: Figma `B4 Nuevo cliente` (nodo 22:366). Fuente de contrato: `ClienteService` y `ClientesController` del **PR #50** (abierto, rama `feature/US-F1-05-clientes-alta-renaper`, no mergeado) y la spec US-F1-05 (CU04, RN01, RN02, RN16) en `docs/tareas-divididas.md`. Hasta que el PR se mergee, el front trabaja con MSW (FB4).

Convención: "En PR (#50)" = en el PR abierto; "Especificado" = solo en spec/tareas.

## 1. Propósito y quién la usa

- **Propósito:** dar de alta un cliente (asegurado) con sus datos personales, contacto y domicilio, y validarlo contra Renaper (CU04). Renaper pisa los datos cargados a mano cuando responde (RN02).
- **Quién la usa:** rol **Empleado** y rol **Administrador** (`Politicas.Empleado`). Es el paso 2 del flujo de alta de un seguro: "un empleado lo carga en el sistema y verifica que la persona exista".

## 2. Ruta propuesta y guardas de acceso

- **Ruta:** `/clientes/nuevo` (Propuesta).
- **Guarda:** sesión válida. Sin sesión: `/login`.
- **Rol:** Empleado o Administrador (`POST /api/clientes` y `GET /api/clientes/renaper/{dni}` requieren `Politicas.Empleado`).
- **Volver:** el enlace "Clientes" lleva a `/clientes` (B3).
- **Salir con cambios sin guardar:** NO DEFINIDO (ver sección 7).

## 3. Estructura visual

Frame de escritorio de **1440 × 1226 px** (más alto que B2 y B3, que son de 1024 px). Mismo shell y mismo sidebar que B2 y B3, con "Clientes" activo. El sidebar y el shell miden 1178 px de alto en el diseño; el contenido necesita scroll vertical dentro de la página.

Columna principal (`Columna principal`, desde `x=232`, ancho 859 px, padding 32 px, contenido de 795 px). De arriba abajo:

1. **Volver a Clientes** (`Volver a Clientes`, `y=32`, 75 × 18 px): icono flecha izquierda de 16 px y texto "Clientes" 13/18 px. Es un enlace.
2. **Topbar** (`Topbar`, `y=74`, 795 × 64 px): título "Nuevo cliente" (20/26 px SemiBold) y botón campana a la derecha (36 px). No tiene botón primario: el guardado está al pie del formulario.
3. **Formulario** (`Formulario`, `y=162`, 795 × 912 px). Tres grupos separados por divisores de 1 px. Cada grupo tiene título 16/22 px SemiBold, `gap` 20 px entre título y campos. Las filas de campos son de dos columnas iguales (389.5 px cada una) con `gap` de 16 px.
   - **Datos personales** (`Grupo Datos personales`, 795 × 406 px). Padding inferior 24 px.
     - Fila 1 (64 px): **DNI** (`Input`, 389.5 px) | **Acción Renaper**: botón secundario "Validar en Renaper" de 40 px de alto con icono, centrado en el alto de la fila (ocupa `y=24` a `y=64`).
     - Fila 2 (64 px, `y=80`): **Sexo** (`Select`) | **Nombre** (`Input`).
     - Fila 3 (64 px, `y=160`): **Apellido** (`Input`) | **CUIL** (`Input`, Nexa/Mono).
     - Fila 4 (100 px, `y=240`): **Fecha de nacimiento** (`Input`, con ayuda "Debe ser mayor de 18 años.") | espacio vacío.
   - Divisor (`Divider`, `y=406`).
   - **Contacto** (`Grupo Contacto`, `y=407`, 795 × 154 px). Fila: **Email** | **Teléfono**.
   - Divisor (`Divider`, `y=561`).
   - **Domicilio** (`Grupo Domicilio`, `y=562`, 795 × 350 px). Filas: **Calle** | **Número**; **Localidad** | **Provincia** (`Select`); **Código postal** | espacio vacío.
4. **Acciones** (`Acciones`, `y=1098`, 795 × 48 px): alineadas a la derecha, `gap` 12 px. Botón secundario "Cancelar" (40 px de alto, a `x=555`) y botón primario "Guardar cliente" (40 px, a `x=661`, ancho 134 px).

**Rail derecho** (`Rail derecho`, 300 px de ancho desde `x=1092`, padding 24 px, `gap` 16 px, columna completa de alto):

- Divisor vertical (`Divider rail`) de 1 px a `x=1091`.
- **Widget "Validación Renaper"** (`Widget validación Renaper`, 252 × 244 px, `y=24`): padding 20 px, radio 16 px, borde hairline. Contiene el título, el badge de estado, dos pares de dato (Estado y Fecha de validación) y una nota.
- **Texto "Ejemplo de error"** (`Ejemplo de error`, `y=284`): ver nota abajo.
- **Caja de error** (`Ejemplo de error caja`, 252 × 86 px, `y=316`): fondo `--nexa-status-cancelada-bg`, radio 16 px, padding 16 px, icono `x-circle` de 16 px y texto a la derecha.

**Nota importante sobre el rail:** el texto "Ejemplo de error" y la caja de error están en el diseño como *anotación de ejemplo* de un estado de error. No son parte de la pantalla final. El error del DNI va en el campo (ver sección 7). La caja de error del rail puede usarse como alerta general, pero es una decisión (ver D-3).

Medidas clave: título H2 20/26; títulos de grupo 16/22 SemiBold; labels 12/16 Medium en `--nexa-text-secondary`; inputs de 40 px de alto (radio 12 px, borde strong `#d3d5ce`, padding 12 px); texto de input 14/20 (o mono 13/18 para DNI y CUIL); ayuda 12/16 Medium en `--nexa-text-tertiary`.

## 4. Componentes del design system y componentes propios

Componentes del Figma:

| Nombre en Figma | Id | Uso |
|---|---|---|
| `Logo/Nexa` | 14:5 | Sidebar. |
| `NavItem` | 14:99 | Sidebar; "Clientes" activo. |
| `Input` | 11:66 | DNI, Nombre, Apellido, CUIL, Fecha de nacimiento, Email, Teléfono, Calle, Número, Localidad, Código postal. Estados Default, Focus, Error, Disabled. Nota: "Nunca usar el placeholder como label". |
| `Select` | 11:95 | Sexo y Provincia. Mismos estados que `Input`. |
| `Button` | 11:42 | "Validar en Renaper" (Secondary M con icono), "Cancelar" (Secondary M), "Guardar cliente" (Primary M). Nota: "Primary para la acción principal de la pantalla, Secondary para alternativas. Tamaño M 40 px, S 32 px." |
| `Badge/Estado` | 11:117 | Rail: badge "Validado" (variante con tokens Vigente). Nota: solo tokens semánticos. |

Iconos del Figma (no son componentes): `icon/identification-card` (botón Renaper), `icon/caret-down` (selects), `icon/x-circle` (caja de error), `icon/arrow-left` (volver), `icon/bell`, y los iconos del sidebar.

Componentes propios:

- `AltaClientePage` (pantalla): compone el formulario y el rail. Delgada.
- `FormularioAltaCliente` (`features/clientes/components`): react-hook-form + zod (el esquema zod es la fuente del tipo, FB1). Tres grupos (`DatosPersonales`, `Contacto`, `Domicilio`).
- `AccionRenaper` (`features/clientes/components`): botón "Validar en Renaper" + manejo de su resultado (sección 8).
- `WidgetValidacionRenaper` (`features/clientes/components`): rail con badge, estado, fecha y nota.
- `AlertaError` (`shared/` o `@nexa/ui`): caja de error con icono. Lo comparte con B1.
- `LayoutBackoffice` (`app/`): sidebar y topbar, igual que B2 y B3.

Campos "Input" con ancho 389.5 px: en el sistema de grid de dos columnas, usar `flex 1` con `gap` 16 px (no ancho fijo).

## 5. Contenido textual literal

| Elemento | Texto |
|---|---|
| Enlace de volver | `Clientes` |
| Título | `Nuevo cliente` |
| Título de grupo 1 | `Datos personales` |
| Título de grupo 2 | `Contacto` |
| Título de grupo 3 | `Domicilio` |
| Label DNI | `DNI` |
| Label Sexo | `Sexo` |
| Label Nombre | `Nombre` |
| Label Apellido | `Apellido` |
| Label CUIL | `CUIL` |
| Label Fecha de nacimiento | `Fecha de nacimiento` |
| Ayuda de fecha de nacimiento | `Debe ser mayor de 18 años.` |
| Label Email | `Email` |
| Label Teléfono | `Teléfono` |
| Label Calle | `Calle` |
| Label Número | `Número` |
| Label Localidad | `Localidad` |
| Label Provincia | `Provincia` |
| Label Código postal | `Código postal` |
| Botón de Renaper | `Validar en Renaper` |
| Botón cancelar | `Cancelar` |
| Botón guardar | `Guardar cliente` |
| Rail: título | `Validación Renaper` |
| Rail: badge | `Validado` (muestra; ver sección 7 sobre cuándo aplica) |
| Rail: label de dato 1 | `Estado` |
| Rail: valor dato 1 | `Vigente` |
| Rail: label de dato 2 | `Fecha de validación` |
| Rail: valor dato 2 | `28/10/2026 10:41` (muestra; ver D-4) |
| Rail: nota | `Los datos de Renaper reemplazan los cargados a mano.` |
| Mensaje de error de Renaper (caja) | `El DNI no existe en Renaper. Revisá el número e intentá de nuevo.` |

Textos del Figma que NO son copy de UI:

- `Ejemplo de error` (texto sobre la caja de error): anotación. No renderizar.
- Valores de los campos (`35.874.219`, `F`, `Lucía`, `Benítez`, `27-35874219-6`, `14/02/1991`, `lucia.benitez@correo.com`, `381 555 0148`, `Av. Mate de Luna`, `1450`, `San Miguel de Tucumán`, `Tucumán`, `4000`): datos de muestra.

Textos NO DEFINIDOS en el Figma (proponer y confirmar):

- Placeholders de cada campo (el Figma no los muestra).
- Mensajes de validación de campo (obligatorio, formato, máximo de caracteres).
- Opciones del select Sexo (solo se ve `F`).
- Opciones del select Provincia (solo se ve `Tucumán`).
- Mensajes de éxito, de guardado en curso y de error de servidor.
- Mensajes de Renaper caído y de persona fallecida.
- Texto de confirmación al cancelar con datos cargados.

## 6. Campos y validaciones

Regla general: el back es la fuente de verdad. El front valida lo mismo para dar feedback rápido, sin inventar reglas.

| Campo | Tipo | Obligatorio | Regla exacta (back, PR #50) | Formato en el front | Copy de error (propuesta, no diseñado) |
|---|---|---|---|---|---|
| DNI | texto | Sí | Exactamente 8 dígitos (`^\d{8}$`). Único (RN01): no puede existir otro cliente con ese DNI. | Acepta `35.874.219` y `35874219`; se envía sin puntos (8 dígitos). Input `inputMode="numeric"`. | Formato: "El DNI debe tener 8 dígitos." (texto del back). Duplicado: "Ya existe un cliente con este DNI." (propuesta). |
| Sexo | select | Sí | `M`, `F` o `X` (un carácter, `char`). | Select nativo. Opciones: NO DEFINIDO. Propuesta: "Femenino" (F), "Masculino" (M), "X" (X). | "Elegí el sexo." (propuesta) |
| Nombre | texto | Sí | Máximo 100 caracteres. Renaper lo pisa si responde (RN02). | Máximo 100. | Default de .NET en inglés si el back valida; el front muestra "Ingresá el nombre." (propuesta). |
| Apellido | texto | Sí | Máximo 100 caracteres. Renaper lo pisa si responde (RN02). | Máximo 100. | "Ingresá el apellido." (propuesta) |
| CUIL | texto | Sí | Exactamente 11 dígitos (`^\d{11}$`). Renaper lo pisa si responde. No se valida el dígito verificador. | Máscara `XX-XXXXXXXX-X` (como en el Figma); se envía sin guiones. | "El CUIL debe tener 11 dígitos." (texto del back) |
| Fecha de nacimiento | fecha (`DateOnly`) | Sí | Obligatoria. El cliente debe tener **18 años o más** (RN01), calculado con la zona `America/Argentina/Buenos_Aires`. Si Renaper responde, se usa su fecha, no la cargada. | Formato `dd/mm/aaaa`. Selector de fecha: NO DEFINIDO. Se envía como `yyyy-mm-dd`. | "La fecha de nacimiento es obligatoria." (texto del back). Menor de edad: "El cliente debe tener 18 años o más." (propuesta de copy, el back dice "RN01: El cliente debe tener 18 años o más.") |
| Email | texto | Sí | Formato de email (`[EmailAddress]`), máximo 150 caracteres. Único (RN01), sin distinguir mayúsculas. | Máximo 150. Se recorta espacios. | "Ya existe un cliente con este email." (propuesta) |
| Teléfono | texto | No | Máximo 20 caracteres. Sin formato definido. | Texto libre. Ejemplo del Figma: `381 555 0148`. | "—" si queda vacío (la respuesta lo devuelve como nulo) |
| Calle | texto | Sí | Máximo 150 caracteres. | — | "Ingresá la calle." (propuesta) |
| Número | texto | Sí | Máximo 20 caracteres. El back lo guarda como texto (no solo números). | Texto. Ejemplo del Figma: `1450`. | "Ingresá el número." (propuesta) |
| Localidad | texto | Sí | Máximo 100 caracteres. | — | "Ingresá la localidad." (propuesta) |
| Provincia | select (texto) | Sí | Máximo 100 caracteres. El back guarda texto libre, no un código. | Select con la lista de provincias (fuente NO DEFINIDA, ver D-6). | "Elegí la provincia." (propuesta) |
| Código postal | texto | Sí | Máximo 10 caracteres. | Texto. Ejemplo del Figma: `4000` (no se fija formato numérico en el back). | "Ingresá el código postal." (propuesta) |

Dos formas distintas de 400 en el alta, que el front trata por separado:

- **Validación de modelo** (`[ApiController]`, antes de llegar al servicio): `ValidationProblemDetails` con un diccionario `errors` por propiedad. El proyecto no personaliza la respuesta (no hay `InvalidModelStateResponseFactory`, `ConfigureApiBehaviorOptions` ni `SuppressModelStateInvalidFilter` en `backend/`), así que es el formato estándar de ASP.NET Core. Es el único 400 que se puede mapear a un campo. Los atributos `[Required]`, `[MaxLength]` y `[EmailAddress]` de `ClienteAltaRequest` no tienen mensaje en español: el texto que llegue es el de ASP.NET (en inglés). El front usa su propio copy de la sección 6, y el mapeo a campo depende de la clave de `errors`. **Capitalización de las claves (`dni` o `Dni`) no verificada en el código: confirmar con una respuesta real del back antes de implementar el mapeo.**
- **Regla de negocio** (`BusinessRuleException`, `ClienteService`): 400 con solo `detail` y sin `codigo`. Incluye DNI duplicado, email duplicado, menor de 18, fallecido y "no figura en Renaper". No se puede mapear a un campo sin leer texto. Regla del front: se muestra como alerta general, con el `detail` sin el prefijo `RN01:` / `RN02:`.

El `codigo` del `ProblemDetails` solo aparece en los 404 con código (`ExceptionMiddleware` lo agrega solo a `NotFoundException` con código): `PERSONA_NO_ENCONTRADA` en `GET /api/clientes/renaper/{dni}` y `CLIENTE_NO_ENCONTRADO` en `POST /api/clientes/{id}/validar-renaper`. El alta (`POST /api/clientes`) no tiene 404 de este tipo.

Mensajes de negocio del back (`ClienteService`), tal como salen en `detail` del `ProblemDetails` (400). Algunos llevan el prefijo de la regla (`RN01:`, `RN02:`): el front no debe mostrar el prefijo (D-7):

- `El DNI debe tener 8 dígitos.`
- `El sexo debe ser M, F o X.`
- `La fecha de nacimiento es obligatoria.`
- `RN01: Ya existe un cliente con el DNI '{dni}'.`
- `RN01: Ya existe un cliente con el email '{email}'.`
- `RN02: La persona figura como fallecida en Renaper.`
- `El DNI '{dni}' no figura en Renaper.`
- `RN01: El cliente debe tener 18 años o más.`

## 7. Estados

El alta tiene tres partes que pueden fallar por separado: el formulario (validación local y del back), la **validación Renaper** (botón "Validar en Renaper", que solo consulta) y el **guardado** (`POST`, que además valida en Renaper al crear).

| Estado | Qué se muestra | Estado en el Figma |
|---|---|---|
| Inicial | Campos vacíos. "Validar en Renaper" habilitado. Rail con el widget sin datos. | El Figma muestra el estado con datos y el rail con la validación. El estado vacío no está diseñado (NO DEFINIDO). |
| Campo con error (validación local) | `Input` o `Select` en estado Error: borde de error y mensaje debajo (ayuda reemplazada por el error). | El componente tiene el estado Error. Visual del borde de error: NO DEFINIDO. |
| Validando en Renaper (consulta en curso) | Botón "Validar en Renaper" con indicador de carga y deshabilitado. | NO DEFINIDO. Propuesta. |
| Renaper: persona encontrada y vigente | Rail: badge "Validado" (tokens Vigente), dato "Estado" = "Vigente". Fecha de validación: NO se muestra (ver D-4). El resto de los datos de Renaper puede precargarse en el formulario (ver D-5). | Diseñado (muestra). |
| Renaper: persona fallecida | Rail: estado "Fallecido" con tokens de error. Guardar queda bloqueado con el mensaje del back. | NO DEFINIDO. Propuesta. |
| Renaper: DNI no existe. En la previsualización (`GET`), 404 con `codigo` `PERSONA_NO_ENCONTRADA`: error en el campo DNI con el texto del Figma y caja del rail. En el alta (`POST`), el mismo caso llega como 400 sin `codigo` (`El DNI '{dni}' no figura en Renaper.`): alerta general con el texto del Figma, no 404. | Diseñado (caja del rail). |
| Renaper caído (502 o timeout en la consulta) | Alerta: "Renaper no responde. Podés guardar el cliente y validarlo después." (propuesta). | NO DEFINIDO. |
| Guardando (`POST` en curso) | Botón "Guardar cliente" deshabilitado con indicador de carga. Campos deshabilitados. | NO DEFINIDO. Propuesta. |
| Éxito (201, validado) | Redirigir a `/clientes` con aviso "Cliente guardado." (propuesta). | NO DEFINIDO. |
| Éxito con Renaper caído (201, `validadoRenaper=false`) | Redirigir a `/clientes` con aviso de advertencia: "Cliente guardado sin validar en Renaper." (propuesta). El cliente aparece con badge "Pendiente". Desde B3 se reintenta con la acción "Validar en Renaper" de la fila (`POST /api/clientes/{id}/validar-renaper`, sección 9). | NO DEFINIDO. Comportamiento del back: PR #50, decisión pendiente C8. |
| Error de negocio al guardar (400: DNI o email duplicado, menor de 18, fallecido, no figura en Renaper) | Alerta general arriba del formulario con el `detail` del back, sin el prefijo `RNxx:`. Los datos cargados se conservan. El back no indica el campo afectado: no marcar un campo salvo que el back devuelva códigos estables (D-18). | NO DEFINIDO. |
| Error de servidor (5xx) o sin conexión | Alerta general arriba del formulario. Los datos cargados se conservan. | NO DEFINIDO. |
| Sesión vencida (401) | Redirigir a `/login` conservando la ruta, para volver al formulario. | Propuesta. |
| Cancelar con datos cargados | Confirmación antes de salir: "¿Descartar los datos cargados?" (propuesta). | NO DEFINIDO. |
| Foco | Borde del `Input` en estado Focus (token del design system). | Componente. Visual NO DEFINIDO. |
| Deshabilitado | Botón "Validar en Renaper" deshabilitado mientras el DNI no tenga 8 dígitos (propuesta). | NO DEFINIDO. |

## 8. Acciones y navegación

| Elemento | Acción | Llamada | Destino o resultado |
|---|---|---|---|
| "Clientes" (enlace de volver) | Vuelve al listado. | — | `/clientes` |
| "Validar en Renaper" | Consulta a Renaper con el DNI del formulario. No guarda nada. Muestra el resultado en el rail. Si Renaper devuelve datos, precarga el formulario (propuesta; ver D-5). | `GET /api/clientes/renaper/{dni}` | Rail con el resultado. Error en el campo DNI si 404. |
| "Cancelar" | Descarta el formulario. | — | `/clientes`, con confirmación si hay cambios (propuesta). |
| "Guardar cliente" | Valida el formulario, luego crea el cliente. Renaper se consulta en el servidor durante el alta. | `POST /api/clientes` | 201: a `/clientes` con aviso. El `Location` del 201 apunta a `/api/clientes/{id}` (sin pantalla de detalle en el Figma, ver D-8). |
| Select Sexo y select Provincia | Elegir valor. | — | — |
| Campana | Notificaciones. | **NO DEFINIDO** (no hay endpoint). | — |
| Sidebar | Navegación general. | — | Ver B2. |

Orden recomendado del flujo (propuesta): completar DNI → "Validar en Renaper" (opcional) → completar el resto → "Guardar cliente". El alta valida con Renaper por su cuenta, así que el botón de validación no es obligatorio.

## 9. Datos: endpoints y origen de cada dato

| Método y ruta | Estado | Request | Response | Errores |
|---|---|---|---|---|
| `POST /api/clientes` | **En PR (#50)** (`ClientesController.Alta`, `[Authorize(Policy = Politicas.Empleado)]`). Ruta `api/clientes`. | `ClienteAltaRequest`: `dni` (8 dígitos), `email`, `telefono` (opcional), `nombre`, `apellido`, `cuil` (11 dígitos), `fechaNacimiento` (`yyyy-mm-dd`), `sexo` (`M`/`F`/`X`), `calle`, `numero`, `localidad`, `provincia`, `codigoPostal`. | `201` con `Location` y `ClienteResponse`: `id`, `dni`, `cuil`, `nombre`, `apellido`, `fechaNacimiento`, `sexo`, `email`, `telefono`, `calle`, `numero`, `localidad`, `provincia`, `codigoPostal`, `validadoRenaper`, `fechaValidacionRenaper` (UTC), `activo`. | `400` (negocio y validación, `ProblemDetails`); `401`; `403`. Renaper caído NO es error: responde `201` con `validadoRenaper=false` (PR #50). |
| `GET /api/clientes/renaper/{dni}` | **En PR (#50)**. | Path `dni` (8 dígitos). | `200` con `PersonaRenaperResponse`: `dni`, `cuil`, `nombre`, `apellido`, `fechaNacimiento`, `sexo`, `domicilio` (`calle`, `numero`, `piso` (opcional), `depto` (opcional), `localidad`, `provincia`, `codigoPostal`), `estado` (`VIGENTE` / `FALLECIDO`), `fechaFallecimiento` (solo si falleció). | `400` (formato del DNI); `404` con `codigo: "PERSONA_NO_ENCONTRADA"` (el front usa `codigo`, no el texto); `401`; `403`; `502` (Renaper caído o respuesta inválida). |
| `POST /api/clientes/{id}/validar-renaper` | **En PR (#50)** (`ClientesController.ValidarRenaper`, `[Authorize(Policy = Politicas.Empleado)]`). Se usa desde B3 (acción de fila) para clientes con `validadoRenaper=false`. | Sin body. | `200` con `ClienteResponse` actualizado (`validadoRenaper=true`, `fechaValidacionRenaper` en UTC). | `400` sin `codigo` (no figura en Renaper, fallecido o menor de 18: solo `detail`); `404` con `codigo: "CLIENTE_NO_ENCONTRADO"`; `502` (Renaper caído); `401`; `403`. |

Mapeo de datos mostrados:

| Dato en pantalla | Fuente | Estado |
|---|---|---|
| Badge "Validado" / "Pendiente" del rail | `validadoRenaper` del `ClienteResponse` (después de guardar). Antes de guardar, solo hay `estado` de la previsualización. | Ver D-4. |
| Estado "Vigente" / "Fallecido" | `estado` de `PersonaRenaperResponse`. El Figma muestra "Vigente". | En PR (#50). |
| Fecha de validación "28/10/2026 10:41" | `fechaValidacionRenaper` del `ClienteResponse` (UTC). Mostrar en `America/Argentina/Buenos_Aires` con el formateador de `@nexa/ui`. | Solo después del alta (ver D-4). |
| Lista de provincias | No hay catálogo en el back (`Provincia` es texto libre). | NO DEFINIDO (D-6). |

Cuando el alta se guarda sin validar (`validadoRenaper=false`), el back deja los datos cargados a mano. Cuando Renaper responde, sus datos reemplazan los cargados (RN02): el usuario puede ver otros datos después de guardar que los que escribió. Ver D-5.

## 10. Reglas de negocio visibles

- **RN01.** DNI y email únicos (sin distinguir mayúsculas en el email). Mayoría de edad: 18 años o más, calculado con la zona `America/Argentina/Buenos_Aires`. Se muestra en la ayuda de "Fecha de nacimiento" y en los errores.
- **RN02.** Antes de emitir una póliza, el cliente debe estar validado en Renaper: el DNI existe y el estado es vigente (no fallecido). **Renaper pisa los datos cargados a mano** cuando responde. El texto de la nota del rail lo dice: "Los datos de Renaper reemplazan los cargados a mano."
- **RN16.** `fechaValidacionRenaper` se guarda en UTC. La pantalla la muestra en hora de Buenos Aires.
- Caso de alta con Renaper caído: el back (PR #50) guarda el cliente con `validadoRenaper=false`, según la decisión propuesta en la spec (C8). Pendiente de confirmación en la reunión de equipo.

## 11. Responsive

- El Figma solo tiene frame de escritorio (1440 px). **No hay frame mobile del backoffice.** Esta pantalla es solo escritorio según el diseño.
- Propuesta por debajo de 1280 px: el rail pasa debajo del formulario, en una sola columna.
- Propuesta: en filas de dos columnas, por debajo de 768 px, apilar los campos en una columna.
- El botón "Guardar cliente" queda al pie del formulario, no fijo. Propuesta: fijo al pie en pantallas angostas para no perder la acción al hacer scroll. NO DEFINIDO.

## 12. Accesibilidad

- Cada campo tiene `label` visible asociado (`htmlFor`/`id`). El placeholder no reemplaza al label (nota del componente `Input`).
- Cada grupo (`Datos personales`, `Contacto`, `Domicilio`) es un `<fieldset>` con `<legend>` igual al título.
- Los errores de campo van con `aria-describedby` y `aria-invalid="true"`. Al enviar con errores, el foco va al primer campo con error.
- El error de Renaper del DNI y la caja del rail se anuncian con `role="alert"` (o `aria-live="assertive"`).
- El resultado de "Validar en Renaper" (validado / no encontrado) se anuncia con `aria-live="polite"`.
- DNI y CUIL: `inputMode="numeric"`; el CUIL con máscara debe seguir siendo legible (el lector de pantalla lee los guiones o no: decidir).
- Selects nativos (`<select>`), no componentes personalizados, para que el teclado y los lectores funcionen sin trabajo extra.
- Botón de volver: texto "Clientes" con icono decorativo (`aria-hidden`).
- Foco visible en todos los controles.
- Contraste: texto de ayuda `--nexa-text-tertiary` (`#8a8e93`) sobre blanco: revisar contraste en el build (puede quedar bajo 4.5:1 para 12 px).

## 13. Dudas e inconsistencias Figma ↔ back

- **D-1. Formato del DNI y del CUIL.** El Figma muestra `35.874.219` y `27-35874219-6`. El back exige 8 y 11 dígitos sin separadores. Propuesta: el front acepta el formato con separadores y envía solo dígitos.
- **D-2. Texto del error de Renaper.** El Figma: "El DNI no existe en Renaper. Revisá el número e intentá de nuevo." El back: "El DNI '{dni}' no figura en Renaper." (cuando el alta lo rechaza) y el código `PERSONA_NO_ENCONTRADA` (cuando responde 404 la previsualización). Propuesta: mostrar el texto del Figma, usando el código `PERSONA_NO_ENCONTRADA` y no el texto del back.
- **D-3. Dónde va el error de Renaper.** El Figma lo muestra en la caja del rail, pero es un "ejemplo de error" (anotación). Propuesta: error en el campo DNI y, además, el aviso en el rail. Confirmar.
- **D-4. Fecha de validación.** El Figma muestra "28/10/2026 10:41" en el rail. La previsualización (`GET`) no devuelve fecha de validación: esa fecha existe solo después del alta (`fechaValidacionRenaper`). Confirmar qué se muestra antes de guardar (propuesta: "Sin guardar" en lugar de la fecha).
- **D-5. Qué hace "Validar en Renaper" con el formulario.** El Figma no muestra si precarga los campos. La spec dice "consulta lo que devuelve Renaper antes de cargar el formulario". Propuesta: precargar nombre, apellido, CUIL, fecha, sexo y domicilio, y marcarlos como "Dato de Renaper". Confirmar. Además, el alta igual pisa los datos con Renaper: el usuario debe saberlo antes de guardar.
- **D-6. Lista de provincias.** No hay catálogo en el back ni en el Figma. El back guarda texto libre. Propuesta: lista fija de las 24 jurisdicciones en el front (sin endpoint), guardada como texto. Confirmar.
- **D-7. Mensajes de validación.** Los `[Required]`, `[MaxLength]` y `[EmailAddress]` del back no tienen mensaje en español (salen por defecto en inglés). Los mensajes de negocio llevan prefijos `RN01:` / `RN02:` que no deben verse en pantalla. Confirmar el copy final con diseño y pedir al back que quite el prefijo (o que devuelva un código de error).
- **D-8. Qué pasa después de guardar.** No hay pantalla de detalle de cliente en el Figma. El `201` devuelve el `id`. Propuesta: volver a `/clientes` con aviso. Confirmar, o diseñar el detalle (B5).
- **D-9. Renaper caído.** El backend publicado guarda el cliente con `validadoRenaper=false` (201), conforme C8. T-25 conserva ese contrato; B-06 muestra el aviso previsto por D-16 del INDEX y permite el reintento explícito.
- **D-10. Fecha de nacimiento y la regla de 18 años.** El front valida la edad con la fecha cargada. El back usa la fecha de Renaper si responde, y entonces la fecha cargada puede no ser la que cuenta. Propuesta: el front solo avisa; el back decide. Confirmar. Además, el formato de entrada (`dd/mm/aaaa`) y el selector de fecha no están definidos.
- **D-11. Sexo.** Figma muestra `F`. Las etiquetas de las opciones no están definidas (`M`, `F`, `X`). Propuesta: "Femenino", "Masculino", "X". Confirmar con diseño.
- **D-12. Número y código postal.** El back los acepta como texto (no solo números). Confirmar si el Figma debe marcar "solo números" (el ejemplo es `1450` y `4000`).
- **D-13. Teléfono.** Sin formato ni código de país en el back. El ejemplo del Figma es `381 555 0148`. Confirmar si se valida algo.
- **D-14. Rail sin datos iniciales.** El Figma muestra el rail con datos de un cliente ya validado. El estado inicial (antes de validar) no está diseñado.
- **D-15. Cancelar.** No hay confirmación definida. Propuesta: confirmar si hay cambios.
- **D-16. Backend de alta y Renaper publicado.** Los tres endpoints de US-F1-05 están implementados en `development`. T-25 replica el contrato con MSW y pruebas de contrato contra el backend; B-05/B-06 consumen sus funciones tipadas.
- **D-18. Códigos estables en el alta.** Los 400 de negocio del `POST` no tienen `codigo`: el front no puede distinguir duplicado de menor de edad sin leer texto. Pedir al back códigos en el `ProblemDetails` (`codigo`): `DNI_DUPLICADO`, `EMAIL_DUPLICADO`, `MENOR_DE_EDAD`, `PERSONA_FALLECIDA`, `PERSONA_NO_ENCONTRADA`. Con esos códigos, el front marca el campo correcto y deja de depender del texto. Requiere cambio en `ClienteService` (PR #50) y decisión del back.
- **D-19. Errores de validación de modelo en inglés.** Ver sección 6: el texto por defecto de `[Required]`, `[MaxLength]` y `[EmailAddress]` no está en español. Pedir mensajes en español en `ClienteAltaRequest` o usar solo el copy del front.
- **D-17. Piso y departamento.** `PersonaRenaperResponse.Domicilio` trae `piso` y `depto` (opcionales), pero el alta (`ClienteAltaRequest`) no tiene esos campos y el Figma tampoco. Si Renaper responde con piso o depto, el dato se pierde al guardar. Confirmar si se agregan al alta y al diseño, o si se ignoran.

## 14. Referencia Figma

- Frame principal: `B4 Nuevo cliente`, nodo **22:366** (1440 × 1226).
  URL: https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=22-366
- Nodos clave:
  - Panel shell: 22:368
  - Sidebar: 22:369
  - Columna principal: 22:444
  - Volver a Clientes: 22:445
  - Topbar: 22:449
  - Formulario: 22:461
  - Grupo Datos personales: 22:462 (DNI 22:466, Acción Renaper 22:471, Botón Renaper 22:476, Sexo 22:483, Nombre 22:490, Apellido 22:496, CUIL 22:501, Fecha de nacimiento 22:507)
  - Grupo Contacto: 22:514 (Email 22:518, Teléfono 22:523)
  - Grupo Domicilio: 22:529 (Calle 22:533, Número 22:538, Localidad 22:544, Provincia 22:549, Código postal 22:557)
  - Acciones: 22:563 (Cancelar 22:564, Guardar cliente 22:566)
  - Divider rail: 22:568
  - Rail derecho: 22:569
  - Widget validación Renaper: 22:570
  - Caja de error: 22:590
- Página: `02 Backoffice`.

**Nota sobre assets:** los iconos (`identification-card`, `caret-down`, `x-circle`, `arrow-left`, `bell` y los del sidebar) son SVG temporales de Figma que expiran en 7 días. Exportarlos al proyecto. Los iconos de navegación son Phosphor Regular (nota de `NavItem`).
