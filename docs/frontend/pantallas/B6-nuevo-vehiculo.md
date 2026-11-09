# B6 · Nuevo vehículo (backoffice)

Pantalla del backoffice para dar de alta un vehículo a un cliente existente (CU06, RN03).

> **Cambio posterior al Figma:** como no hay acceso a DNRPA, el alta ya no consulta ni valida contra DNRPA ni compara el titular con el DNI del cliente. El formulario pide patente, marca, modelo, año, tipo, motor, chasis y uso, y el vehículo se guarda con `validadoDnrpa = false`. El resto de este documento describe el diseño original del Figma.

Fuente de verdad: Figma `02 Backoffice`, frame B6 (nodo 22:881). Contrato: `backend/Aseguradora.Application/Dtos/VehiculoAltaRequest.cs`, `VehiculoResponse.cs`, `backend/Aseguradora.Api/Controllers/VehiculosController.cs`, y `docs/tareas-divididas.md` US-F2-04. Estado de endpoints según `development`. Textos verificados contra la captura del frame (`get_screenshot`), que resuelve una diferencia entre el árbol del nodo y el código de referencia: el botón dice **Validar en DNRPA** y el de acción final **Guardar vehículo**.

---

## 1. Propósito y quién la usa

- **Propósito:** un empleado registra un vehículo del cliente. Ingresa la patente, consulta los datos a DNRPA, elige el uso y guarda. El back valida que la patente sea única y que el titular informado por DNRPA sea el DNI del cliente.
- **Roles:** Empleado y Administrador.
- Caso de uso: CU06 (alta de vehículo con validación DNRPA). Reglas: RN03 (patente única, vehículo validado en DNRPA, titular = DNI del cliente), RN06 (factor de uso).

## 2. Ruta propuesta y guardas de acceso

- Ruta: `/clientes/:clienteId/vehiculos/nuevo`.
- Se llega desde B5 con el link **Agregar vehículo**. El `clienteId` viene de la ruta, no se elige en el formulario.
- Guarda: sesión activa con rol Empleado o Administrador (`Politicas.Empleado`). Sin sesión: B1 Login.
- `clienteId` inexistente: el back responde 404 (`NotFoundException` en `VehiculoService.AltaAsync`, según US-F2-04). Mostrar estado 404 de cliente (ver sección 7).

## 3. Estructura visual (de arriba a abajo)

Frame 1440 × 1024. Shell 1392 × 976 en (24, 24). Sidebar 232 px; Columna principal 859 px con padding 32 px (contenido 795 px); Divider rail 1 px; Rail derecho 300 px con padding 24 px.

**Sidebar.** Igual que B5 (logo, buscar, navegación principal, navegación admin, usuario al pie). En B6 el ítem activo es **Vehículos**. Ver D-B6-07 sobre los ítems admin.

**Columna principal.**
1. **Volver al cliente** (y 32, alto 16): icono flecha izquierda + texto con el nombre del cliente, `Tomás Iturralde`. Vuelve a `/clientes/:clienteId` (B5).
2. **Topbar** (y 68, alto 64): título H2 `Nuevo vehículo` a la izquierda; botón circular 36 px con campana a la derecha.
3. **Contexto cliente** (y 152, alto 18): texto de 13 px en color secundario: `Cliente: Tomás Iturralde, DNI 30.123.456`.
4. **Fila patente** (y 190, alto 88, separación horizontal 12 px):
   - **Input Patente** (ancho 380): label arriba, campo de 40 px de alto con fuente monoespaciada, helper debajo.
   - **Botón "Validar en DNRPA"** (ancho 172, alto 40, estilo Secondary con icono `car-profile` a la izquierda), alineado a la base del campo (padding superior 24 px).
5. **Bloque "Datos informados por DNRPA"** (y 298, ancho 795, alto 408): tarjeta con borde `border-hairline`, radio 16 px, padding 20 px. Título H3. Lista de 7 filas de 36 px de alto con fondo `surface-subtle` y radio 12 px. Cada fila: etiqueta (ancho 200 px, Label 12 px) y valor (Body 14 px, o Mono 13 px para motor, chasis y DNI). Al final, caja verde de confirmación (alto 40).
6. **Select Uso** (ancho 380): label arriba, campo de 40 px con valor `Particular` y icono caret-down; helper debajo.
7. **Acciones** (alineadas a la derecha, separación 12 px, alto 40): **Cancelar** (Secondary) y **Guardar vehículo** (Primary).

**Rail derecho (x 1092, 300 px).**
1. Widget **Reglas** (tarjeta blanca, radio 16 px, padding 20 px): título `Reglas` y tres párrafos (ver sección 5).
2. Bloque **Ejemplo de error** (etiqueta Caption gris + caja roja con icono `x-circle` y texto). Es un ejemplo visual del Figma, no un estado real. Ver D-B6-03.

## 4. Componentes del design system y componentes propios

**Del design system (nombres del Figma):**
- `Logo/Nexa` (14:5), `NavItem` (14:99): igual que B5.
- `Input` (11:66): label arriba, campo, helper debajo. Estados Default, Focus, Error, Disabled. Usar **Input** para Patente (con `font-mono`, según el Figma). Nunca usar placeholder como label.
- `Select` (11:95): label arriba, campo, helper. Mismos estados. Para Uso.
- `Button` (11:42): Primary para "Guardar vehículo", Secondary para "Cancelar" y "Validar en DNRPA". Tamaño M (40 px).
- Icono: `Icon/car-profile`, `Icon/arrow-left`, `Icon/caret-down`, `Icon/check-circle`, `Icon/x-circle`, `Icon/bell`.
- Tipografía: `Nexa/H2` (título), `Nexa/Body-sm` (contexto y helpers), `Nexa/Label` (labels), `Nexa/Body` (valores), `Nexa/Mono` (patente y datos de identificación).

**Componentes propios:**
- `VehiculoAltaForm` (features/vehiculos/components): formulario completo; schema zod en `features/vehiculos/schemas`.
- `DatosDnrpa` (features/vehiculos/components): bloque de datos informados.
- `AlertaInline` (`@nexa/ui`, propuesto): caja verde de éxito y caja roja de error. No está en la lista de primitivos de FB2.
- `ReglasWidget` (features/vehiculos/components): tarjeta de reglas.

## 5. Contenido textual literal

| Zona | Texto literal |
|---|---|
| Volver | `Tomás Iturralde` (nombre del cliente) |
| Título | `Nuevo vehículo` |
| Contexto | `Cliente: Tomás Iturralde, DNI 30.123.456` |
| Label patente | `Patente` |
| Valor patente de ejemplo | `AC456FG` |
| Helper patente | `Formato AB123CD o ABC123` |
| Botón DNRPA | `Validar en DNRPA` |
| Título bloque | `Datos informados por DNRPA` |
| Etiquetas del bloque | `Marca`, `Modelo`, `Año`, `Tipo`, `Número de motor`, `Número de chasis`, `DNI del titular` |
| Valores de ejemplo | `Volkswagen`, `Gol Trend`, `2017`, `Auto`, `CFZ482913`, `9BWAB45U7HT031254`, `30.123.456` |
| Confirmación | `El titular coincide con el cliente.` |
| Label uso | `Uso` |
| Valor uso | `Particular` |
| Helper uso | `Comercial aplica factor 1,40 en la cotización.` |
| Botones | `Cancelar`, `Guardar vehículo` |
| Rail: título | `Reglas` |
| Rail: reglas | `La patente es única.` · `El titular informado por DNRPA debe ser el cliente.` · `Un vehículo tiene una sola póliza activa.` |
| Rail: ejemplo | `Ejemplo de error` (etiqueta) · `El titular informado por DNRPA no coincide con el cliente.` |

Textos NO DEFINIDOS en el Figma: errores de validación de campo (patente con formato inválido, patente vacía), error de patente ya registrada, error de vehículo no encontrado en DNRPA, mensaje de éxito al guardar, texto de loading del botón DNRPA.

## 6. Campos y validaciones

| Campo | Tipo | Obligatorio | Máscara o normalización | Regla exacta | Fuente en el back |
|---|---|---|---|---|---|
| Patente | texto | Sí | Se hace `trim()` y `toUpperCase()` antes de validar (propuesta: convertir a mayúsculas mientras se escribe, para que lo que se ve sea lo que se envía). | Regex `^([A-Z]{2}[0-9]{3}[A-Z]{2}\|[A-Z]{3}[0-9]{3})$` (Mercosur `AA000AA` o legado `AAA000`). | `VehiculoAltaRequest.PatronPatente` (`[Required]`, normaliza a mayúsculas antes de validar). |
| Uso | selección | Sí | Sin valor por defecto en el back (`UsoVehiculo? Uso`, `[Required]`). | Valores: `Particular` (1,00) o `Comercial` (1,40). | `UsoVehiculo`, RN06 |
| Cliente | (ruta) | Sí | No es un campo del formulario. | Cliente activo existente. | `clienteId` en `VehiculoAltaRequest.ClienteId` (`Guid`, `[Required]`) |

**Validación del titular (RN03):** no es un campo. La hace el back contra DNRPA: el DNI del titular informado por DNRPA debe ser igual al `DNI` del cliente. El front no envía el DNI del titular.

**Validaciones del front (propuesta):** en el submit, bloquear si la patente no cumple la regex o si `Uso` está vacío, sin llamar al back. Mostrar el error bajo el campo. El texto del error es NO DEFINIDO.

**Formato de salida:** patente en mayúsculas, sin espacios. Año como número entero sin separador de miles. Tipo y Uso como etiquetas en español (ver D-B6-05 sobre el formato de los enums en el JSON).

## 7. Estados

| Estado | Qué se muestra |
|---|---|
| Inicial (sin validar) | Input vacío. El bloque "Datos informados por DNRPA" no aparece. Botón DNRPA habilitado solo con patente válida. **Estado NO DIBUJADO en el Figma** (el frame muestra el estado con datos). Propuesta: bloque oculto. |
| Validando en DNRPA | Botón "Validar en DNRPA" con spinner y deshabilitado. Input de patente en solo lectura. Texto del botón durante carga: NO DEFINIDO. |
| Validado (datos cargados) | Bloque DNRPA visible con los datos. Caja verde `El titular coincide con el cliente.` Input de patente en solo lectura, con enlace "Cambiar" (NO DEFINIDO). **Estado mostrado en el Figma.** |
| Error de DNRPA (vehículo no encontrado) | Caja roja con el mensaje del back. El back responde 400 con código `VEHICULO_NO_ENCONTRADO` (US-F2-04). Texto NO DEFINIDO. |
| Error de titular (RN03) | Caja roja. Texto de ejemplo del Figma: `El titular informado por DNRPA no coincide con el cliente.` Verificar que coincide con el `detail` del back. |
| Patente duplicada | 400 del back. Mostrar bajo el campo Patente. Texto NO DEFINIDO. |
| Cliente inexistente | 404 del back. Pantalla de "Cliente no encontrado" con link a `/clientes`. Texto NO DEFINIDO. |
| Guardando | Botón "Guardar vehículo" con spinner, deshabilitado. Botón Cancelar deshabilitado. |
| Éxito | Redirigir a B5 (`/clientes/:clienteId`) con aviso de éxito. Texto NO DEFINIDO. El back devuelve 201 con `Location` a `GET /api/vehiculos/{id}`. |
| Error de guardado (red o 5xx) | Alerta inline con el mensaje de `ProblemDetails.detail`. Texto NO DEFINIDO. |
| Deshabilitado | "Guardar vehículo" deshabilitado hasta que el estado sea Validado (propuesta; ver D-B6-01). |
| Foco | Anillo de foco visible en los campos, el select y los botones. Tokens NO DEFINIDOS en el Figma. |

## 8. Acciones y navegación

| Elemento | Acción | Destino |
|---|---|---|
| Volver al cliente | Navegar | `/clientes/:clienteId` (B5) |
| Campana | Ver notificaciones | NO DEFINIDO |
| Validar en DNRPA | Llamar al back para validar y mostrar los datos | Ver D-B6-01: el back no tiene endpoint de vista previa de DNRPA. |
| Cambiar (patente validada) | Volver a editar la patente | NO DEFINIDO (no está en el Figma) |
| Uso (select) | Elegir Particular o Comercial | Ninguna |
| Cancelar | Descartar y volver | `/clientes/:clienteId` (B5) |
| Guardar vehículo | `POST /api/vehiculos` | Éxito: `/clientes/:clienteId`. Error: se queda en la pantalla. |
| Sidebar | Navegación | Igual que B5 |

## 9. Datos: endpoints y origen de cada campo

| Método y ruta | Estado (`development`) | Uso |
|---|---|---|
| `POST /api/vehiculos` | **Implementado** (US-F2-04 en `development`) | Guardar. Body: `{ clienteId, patente, uso }` (ver D-B6-05 sobre el formato de `uso`). Responde 201 con `VehiculoResponse` y `Location`. |
| `GET /api/clientes/{id}` | **Especificado** (US-F1-06), no está en `development` ni en PR #50 | Contexto del cliente (`Tomás Iturralde`, DNI). Mock hasta que se publique (FB4). |
| `GET /api/vehiculos/{id}` | Implementado | Lectura posterior al guardar (opcional) |
| Vista previa DNRPA por patente | **No existe en el back** | Botón "Validar en DNRPA" y bloque de datos. Ver D-B6-01. |

**Origen de los datos del bloque DNRPA (cuando se valide, según el contrato actual):**

| Campo en pantalla | Campo de `VehiculoResponse` | Nota |
|---|---|---|
| Marca | `marca` | Existe |
| Modelo | `modelo` | Existe |
| Año | `anio` | Existe (número) |
| Tipo | `tipo` | Enum `TipoVehiculo`: Auto, Moto, Camioneta. Ver D-B6-05. |
| Número de motor | — | **No existe en `VehiculoResponse`** (D-B6-02) |
| Número de chasis | — | **No existe en `VehiculoResponse`** (D-B6-02) |
| DNI del titular | — | **No existe en `VehiculoResponse`** (D-B6-02) |
| Confirmación titular | — | El back solo responde 201 (coincide) o 400 (no coincide). No devuelve el DNI del titular. |

**Dato de contexto:** `Cliente: Tomás Iturralde, DNI 30.123.456` sale de `ClienteResponse.nombre`, `apellido` y `dni` (`GET /api/clientes/{id}`, Especificado).

## 10. Reglas de negocio visibles (RN##)

- **RN03:** patente única. Mensaje en el widget Reglas: `La patente es única.`
- **RN03:** el titular informado por DNRPA debe ser el cliente. Mensaje: `El titular informado por DNRPA debe ser el cliente.` Se ve en el bloque de confirmación y en el ejemplo de error.
- **RN04:** un vehículo tiene una sola póliza activa. Mensaje: `Un vehículo tiene una sola póliza activa.` Se aplica en emisión, no en el alta. El texto del widget es informativo.
- **RN06:** factor de uso. Helper: `Comercial aplica factor 1,40 en la cotización.` Coincide con AnalisisBack §4: Particular 1,00, Comercial 1,40.

## 11. Responsive

Solo desktop (no hay frame mobile del backoffice). Propuesta (a confirmar): ancho mínimo 1280 px. Por debajo, el rail derecho se apila debajo del formulario y los campos Patente y Uso pasan a ancho completo.

## 12. Accesibilidad

- `h1` "Nuevo vehículo". Título del bloque DNRPA en `h2`.
- Cada campo con `label` asociado (no placeholder). Helpers vinculados con `aria-describedby`.
- Errores de validación con `aria-invalid="true"` y mensaje en un nodo con `role="alert"` o región `aria-live="polite"`.
- Botón "Validar en DNRPA" con `aria-busy` mientras carga.
- Caja de confirmación y de error con icono y texto (no solo color).
- La lista de datos DNRPA se puede leer como `dl` (término y descripción).
- Select Uso: usar el control nativo o un listbox accesible; no un div sin rol.
- Foco al entrar: en el campo Patente.
- Números de motor, chasis y patente con `lang` neutro y fuente monoespaciada (no es un problema de contraste; verificar AA del verde de la caja de confirmación).

## 13. Dudas e inconsistencias Figma ↔ back

**D-B6-01 · "Validar en DNRPA" no tiene endpoint de vista previa (bloqueante del flujo del Figma).** El Figma muestra dos pasos: validar la patente con DNRPA, mostrar los datos y después guardar. El back hace todo en un solo `POST /api/vehiculos` (valida, consulta DNRPA y guarda). No existe una consulta previa por patente. Hay dos caminos:
- (a) El botón "Validar en DNRPA" es solo un paso visual y la validación real ocurre al guardar. El usuario no ve los datos antes de guardar. Pro: no requiere cambios en el back. Contra: no cumple el flujo del Figma, y si DNRPA rechaza el vehículo el error aparece recién al guardar.
- (b) Agregar un endpoint de vista previa, por analogía con `GET /api/clientes/renaper/{dni}` de PR #50: por ejemplo `GET /api/vehiculos/dnrpa/{patente}`. Pro: cumple el Figma y muestra el titular antes de guardar. Contra: cambio de back (nuevo contrato y tarea nueva en US-F2-04 o siguiente).
Recomendación: (b), porque es la única forma de mostrar el bloque DNRPA antes de guardar tal como lo dibuja el Figma. Decisión del equipo.

**D-B6-02 · Campos DNRPA que no existen en el contrato.** `VehiculoResponse` no tiene número de motor, número de chasis ni DNI del titular. El Figma los muestra. Opciones: (a) agregarlos al DTO (cambio de back, y datos sensibles para la vista previa); (b) quitarlos del diseño. Decisión del equipo y del diseñador.

**D-B6-03 · Texto de error del titular y ejemplo del rail.** El texto `El titular informado por DNRPA no coincide con el cliente.` es un ejemplo del Figma. El back responde 400 para RN03, pero el texto del `detail` no está definido en la documentación leída. Si no coincide, el front mostrará el texto del back. Confirmar el código de error (propuesta: `TITULAR_NO_COINCIDE`) y el texto.

**D-B6-04 · Confirmación "El titular coincide con el cliente."** Solo tiene sentido si el back devuelve el DNI del titular o un booleano. Con el contrato actual, el 201 implica coincidencia, así que la caja verde se puede mostrar después del 201, pero no antes de guardar. Ligado a D-B6-01.

**D-B6-05 · Formato de los enums en el JSON.** El API no configura conversión de enums a texto: `backend/Aseguradora.Api/Program.cs` tiene `builder.Services.AddControllers();` sin `JsonStringEnumConverter`. Con la configuración por defecto de System.Text.Json, `TipoVehiculo` (Auto, Moto, Camioneta), `UsoVehiculo` (Particular, Comercial) y `EstadoPoliza` se serializan como **número** (0, 1, 2...), no como texto. Esto afecta al body de `POST /api/vehiculos` (campo `uso`) y a todas las respuestas. Opciones: (a) agregar `JsonStringEnumConverter` en `Program.cs` (cambio de contrato, pero lo que el Figma muestra es texto); (b) que el front mapee los números a etiquetas. Recomendación: (a), antes de que el front empiece a consumir contratos. Confirmar en la configuración del proyecto que no exista otra conversión (solo se encontró en `Aseguradora.Integrations/Dnrpa/DnrpaHttpService.cs`, que es el cliente saliente).

**D-B6-06 · Sin estado de vehículo sin validar.** El Figma solo dibuja el estado validado. Falta el estado inicial (sin bloque) y el de "Cambiar" (volver a editar la patente). Ver sección 7.

**D-B6-07 · Ítems admin en el sidebar para Empleado.** Igual que B5 (D-B5-11): el Figma muestra Planes y Usuarios a la usuaria con rol Empleado. Confirmar con el diseñador.

**D-B6-08 · Valor por defecto de Uso.** El Figma muestra `Particular` seleccionado. El back exige el campo (`[Required]`). Confirmar si el default es `Particular` en el front (propuesta) o si el usuario debe elegirlo.

**D-B6-09 · Botón "Guardar vehículo" antes de validar.** Propuesta: deshabilitado hasta validar (depende de D-B6-01 opción b). Si se elige la opción (a), el botón se habilita con patente válida y uso elegido.

**D-B6-10 · Texto de la regla RN04 en el widget de Reglas.** "Un vehículo tiene una sola póliza activa." se aplica en la emisión (CU10), no en el alta del vehículo. Confirmar si se deja en esta pantalla como información.

**D-B6-11 · Contexto del cliente.** La pantalla necesita `GET /api/clientes/{id}`, que está Especificado (D-B5-01). Hasta que exista, mock con MSW.

## 14. Referencia Figma

- Frame B6 Nuevo vehículo, nodo `22:881`: https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=22-881
- Subnodos citados: patente `22:980`, validar `22:985`, bloque DNRPA `22:996`, uso `22:1024`, acciones `22:1031`, rail `22:961`, reglas `22:1036`, error `22:1041`.
- Componentes: Input `11:66`, Select `11:95`, Button `11:42`, Logo/Nexa `14:5`, NavItem `14:99`.
