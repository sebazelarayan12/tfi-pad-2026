# B14 · Usuarios

- **Pantalla:** B14 Usuarios (backoffice, desktop 1440 px).
- **Figma:** nodo `33:1294`, página `02 Backoffice`.
- **Contrato verificado contra:** `development` (HEAD `4ba3d4b`). Código: `AuthController`, `CrearUsuarioRequest`, `UsuarioResponse`, `LoginResponse`, `Roles`. Spec §7 y tareas US-F1-02 y US-F1-03.
- **Hallazgo principal:** el back solo tiene **alta** de usuarios. No hay listado, edición, activación/desactivación ni último ingreso. Casi toda la pantalla depende de endpoints que no existen.
- **Leyenda de estado de endpoint:** **Implementado**, **En PR #N**, **Especificado**, **NO EXISTE**.

---

## 1. Propósito y quién la usa

- **Propósito:** dar de alta empleados y administradores del sistema (CU03) y ver la lista de usuarios con su rol y estado.
- **Rol:** solo Administrador (`Politicas.Admin` en `AuthController`). Un Empleado no puede crear usuarios: el back responde 403.
- **Dato en el Figma:** el footer muestra `Hernán Sosa` con rol `Administrador`.

## 2. Ruta propuesta y guardas de acceso

- **Ruta:** `/usuarios`.
- **Feature:** `apps/backoffice/src/features/usuarios` (FB3).
- **Guardas:** JWT válido con rol `Administrador`. Un Empleado que entre por URL ve acceso denegado (**NO DEFINIDO** en el Figma).
- **Sidebar:** `Usuarios` activo (`NavItem` con `Active=true`, grupo `Nav admin`).

## 3. Estructura visual (de arriba a abajo, medidas del Figma)

Panel shell: 1392 × 976 px en (24, 24). Sidebar de 232 px. Columna principal de 799 px (x=232), con padding 32 px. Divisor de 1 px en x=1031. **Panel derecho `Nuevo empleado` de 360 px (x=1032)**, que en el Figma está siempre visible, no como modal.

| Región | Medidas | Contenido |
|---|---|---|
| Topbar | en x=32, y=32, ancho 735, alto 64 px | Título `Usuarios`; campana 36 × 36; botón `Nuevo empleado` (alto 40 px) |
| Tabla de usuarios | en x=32, y=120, ancho 735, alto 497 px, borde hairline, radio 12 px | Header de 40 px (fondo `surface-subtle`), filas de 64 px con divisor de 1 px |
| Panel `Nuevo empleado` | 360 px de ancho, padding 24 px | Título, 3 inputs, 1 input de contraseña con botón, selector de rol, espacio flexible, divisor, footer |

**Anchos de columnas de la tabla (px):** Usuario 300 · Rol 130 · Estado 105 · Último ingreso 160 · Acción (menú) 40.

**Fila de usuario:** avatar circular de 32 px con iniciales, nombre (14 px) y email (11 px, secundario) apilados, chip de rol, badge de estado, fecha de último ingreso, botón de menú `...`.

**Panel `Nuevo empleado`, de arriba abajo:**
1. Título `Nuevo empleado` (16/22 SemiBold).
2. `Input Nombre` (alto 64 px).
3. `Input Apellido` (alto 64 px).
4. `Input Email` (alto 64 px).
5. Fila de contraseña: `Input Contraseña temporal` (231 px) y botón `Generar` (secundario S, 73 × 32 px) alineado con el campo.
6. Selector `Rol` (label y dos chips).
7. Espacio flexible.
8. Divisor de 1 px.
9. Footer: `Cancelar` (secundario, 94 px) y `Crear empleado` (primario, 141 px), alto 40 px, alineados a la derecha.

## 4. Componentes del design system y componentes propios

**Del design system (nombre en Figma):**
- `Logo/Nexa` (nodo 14:5).
- `NavItem` (nodo 14:99). Descripción: "Sidebar nav item: 2px indicator bar at the left edge and darker text when Active=true. Icon is a Phosphor Regular glyph."
- `Button` (nodo 11:42). Descripción: "Pill button. Primary for the main action of a screen, Secondary for alternatives, Ghost for inline actions. Size M is 40px high, S is 32px high." Usos: `Nuevo empleado` (primario M con ícono), `Cancelar` (secundario M), `Crear empleado` (primario M), `Generar` (secundario S).
- `Input` (nodo 11:66). Descripción: "Input field with label above, field, and helper text below. States: Default, Focus, Error, Disabled. Never use the placeholder as the label." Usos: Nombre, Apellido, Email, Contraseña temporal.
- `Chip` (nodo 11:126). Descripción: "Chip. Destacado (lime) marks the one thing that matters on a widget. Neutro is informational. Seleccionado and Sin seleccionar are selectable filter chips." Usos: rol en la tabla (`Administrador` Destacado, `Empleado` Neutro) y selector de rol (`Empleado` Seleccionado, `Administrador` Sin seleccionar).
- `Badge/Activo` y `Badge/Inactivo` (nodos de badge). `Badge/Estado` (nodo 11:117) con token de estado. Ver §5.

**Tokens de estado usados:**
- `Activo`: `status-vigente` (fondo `#e3f4ea`, texto `#1f7a4d`).
- `Inactivo`: `status-vencida` (fondo `#eeefec`, texto `#5c6066`).

**Sin instancia de componente (frames sueltos):** tabla, divisores, avatar, íconos de campana, menú y usuario.

**Componentes propios (propuesta de nombres):**
- `UsuariosPage` (page delgada).
- `UsuariosTable` y `UsuarioRow`.
- `UsuarioAvatar` (iniciales).
- `RolChip` (mapea `Administrador` o `Empleado` a chip).
- `EstadoUsuarioBadge`.
- `NuevoEmpleadoPanel` (formulario con zod y react-hook-form).
- `PasswordField` con botón `Generar`.
- `RolSelector`.

## 5. Contenido textual literal

| Elemento | Texto literal |
|---|---|
| Título topbar | `Usuarios` |
| Botón | `Nuevo empleado` |
| Header 1 | `Usuario` |
| Header 2 | `Rol` |
| Header 3 | `Estado` |
| Header 4 | `Último ingreso` |
| Estado (texto del badge) | `Activo`, `Inactivo` |
| Último ingreso sin registro | `Nunca ingresó` |
| Rol (chip) | `Administrador`, `Empleado` |
| Título panel | `Nuevo empleado` |
| Label nombre | `Nombre` |
| Label apellido | `Apellido` |
| Label email | `Email` |
| Label contraseña | `Contraseña temporal` |
| Helper contraseña | `Compartila por un canal seguro.` |
| Botón generar | `Generar` |
| Label rol | `Rol` |
| Chip seleccionable 1 | `Empleado` |
| Chip seleccionable 2 | `Administrador` |
| Botón cancelar | `Cancelar` |
| Botón crear | `Crear empleado` |

**Datos de muestra del Figma (no son texto fijo):** `Hernán Sosa`, `hernan.sosa@nexaseguros.com.ar`, `Mariela Quiroga`, `Ezequiel Robles`, `Agustina Paz`, `Facundo Gallardo`, `Rocío Medina`, `Natalia Ferreyra`, fechas `28/10/2026 08:45`, `Julieta`, `Ávila`, `julieta.avila@nexaseguros.com.ar`, contraseña de muestra `••••••••••••`.

**Nota sobre el buscador oculto:** el Figma tiene una caja de búsqueda con el texto `Buscar por DNI o apellido` marcada como **oculta** (`hidden`). No se renderiza. Ver §13.

## 6. Campos y validaciones

Reglas tomadas de `CrearUsuarioRequest` (Data Annotations). Los mensajes son los del back.

| Campo | Tipo | Obligatorio | Regla exacta | Coherencia con el Figma |
|---|---|---|---|---|
| Nombre | texto | sí | Máximo 100. Mensajes: `El nombre es obligatorio.`, `El nombre no puede superar los 100 caracteres.` | Coherente |
| Apellido | texto | sí | Máximo 100. Mensajes: `El apellido es obligatorio.`, `El apellido no puede superar los 100 caracteres.` | Coherente |
| Email | email | sí | Formato válido (`El email no tiene un formato válido.`). Máximo 256 (`El email no puede superar los 256 caracteres.`). Único: el back rechaza un email repetido (F1-03; texto del mensaje **a confirmar**) | Coherente |
| Contraseña temporal | texto (enmascarado) | sí | Obligatoria (`La contraseña es obligatoria.`). **Sin longitud ni complejidad definida en el DTO**. No hay configuración explícita de Identity en el código, así que aplican los defaults de ASP.NET Identity (verificar) | El Figma no muestra reglas ni helper de requisitos |
| Generar (botón) | acción | — | Genera una contraseña temporal. **No hay endpoint**. Dónde se genera (front o back) y qué reglas cumple: **NO DEFINIDO** | — |
| Rol | selección única | sí | Solo `Administrador` o `Empleado` (`El rol debe ser Administrador o Empleado.`, `El rol es obligatorio.`). Valor inicial: el Figma muestra `Empleado` seleccionado, pero la regla de default **NO DEFINIDO** | Coherente |

**Nota de seguridad:** el Figma dice `Compartila por un canal seguro.`. La contraseña temporal viaja en el body del `POST`, por lo que el front no debe guardarla después de crear el usuario.

## 7. Estados

| Estado | Qué muestra | Fuente |
|---|---|---|
| Cargando la tabla | **NO EXISTE** el endpoint de listado. Sin datos que cargar. **NO DEFINIDO** qué mostrar | — |
| Tabla vacía | **NO DEFINIDO** | — |
| Error al cargar | **NO DEFINIDO** (no hay endpoint) | — |
| Fila Activo | Badge verde con texto `Activo` | Figma |
| Fila Inactivo | Badge gris con texto `Inactivo` | Figma |
| Último ingreso vacío | Texto `Nunca ingresó` en color terciario | Figma |
| Chip Administrador (en tabla) | Lime (`Destacado`) | Figma |
| Chip Empleado (en tabla) | Gris (`Neutro`) | Figma |
| Chip Seleccionado (Empleado en el panel) | Fondo negro, texto blanco | Figma |
| Chip Sin seleccionar (Administrador en el panel) | Borde, fondo panel | Figma |
| Input Default | Figma | Figma |
| Input Focus / Error | Definidos en el componente, sin frame | Componente |
| Creando usuario | **NO DEFINIDO**. Propuesta: botón deshabilitado con indicador | Propuesta |
| Éxito al crear | **NO DEFINIDO**. Propuesta: limpiar el formulario y mostrar confirmación. Con el back actual no hay listado para refrescar | Propuesta |
| Error al crear (email repetido, validación) | **NO DEFINIDO** en el Figma. Propuesta: mensaje del 400 junto al campo `Email` | Propuesta |
| Generar contraseña | **NO DEFINIDO** | — |
| Menú de fila abierto | **NO DEFINIDO** (ver §8) | — |

## 8. Acciones y navegación

| Acción | Qué hace | Destino |
|---|---|---|
| `Nuevo empleado` (topbar) | El panel ya está visible en el Figma. **NO DEFINIDO** si el botón limpia el formulario, enfoca el primer campo o abre un modal | Misma pantalla |
| `Generar` (contraseña) | Genera una contraseña temporal y la pone en el campo. **NO DEFINIDO** cómo ni dónde | — |
| `Cancelar` | Limpia el formulario | Misma pantalla |
| `Crear empleado` | `POST /api/auth/usuarios` con `email`, `password`, `rol`, `nombre`, `apellido`. Éxito: 201 con `UsuarioResponse` (`id`, `email`, `rol`). El resto del flujo **NO DEFINIDO** | Misma pantalla |
| Menú `...` de cada fila | **NO DEFINIDO** (el Figma no muestra opciones) | — |
| Desactivar / activar usuario | **NO EXISTE** endpoint | — |
| Editar usuario | **NO EXISTE** endpoint | — |
| Campana (topbar) | **NO DEFINIDO** | — |
| Buscar (oculto) | No se renderiza (ver §13) | — |
| Sidebar y usuario | Igual que B11 | Rutas propuestas |

## 9. Datos: endpoints y mapeo de campos

| Dato o acción | Método y ruta | Estado | Campo del DTO → UI |
|---|---|---|---|
| Crear usuario | `POST /api/auth/usuarios` | Implementado. Admin. 201 | Body `CrearUsuarioRequest` (ver abajo). Respuesta `UsuarioResponse`: `Id`, `Email`, `Rol` |
| Listar usuarios | `GET /api/usuarios` | **NO EXISTE**. No está en spec §7 ni en tareas | — |
| Detalle de usuario | — | **NO EXISTE** | — |
| Editar nombre, apellido o rol | — | **NO EXISTE** | — |
| Desactivar o activar usuario | — | **NO EXISTE**. No hay campo de estado en el usuario | — |
| Último ingreso | — | **NO EXISTE**. No se guarda la fecha del último login | — |
| Login (referencia) | `POST /api/auth/login` | Implementado. Devuelve `Token`, `Rol`, `ExpiraEn`. No la usa esta pantalla | — |

**Body de alta (`CrearUsuarioRequest`):**

```
{
  "email": "julieta.avila@nexaseguros.com.ar",   // requerido, email, máx. 256
  "password": "••••••••••••",                     // requerido, sin regla en el DTO
  "rol": "Empleado",                              // "Administrador" | "Empleado"
  "nombre": "Julieta",                            // requerido, máx. 100
  "apellido": "Ávila"                             // requerido, máx. 100
}
```

**Respuesta de alta (`UsuarioResponse`):** `{ "id": "string", "email": "string", "rol": "string" }`. **No devuelve** nombre, apellido, estado ni último ingreso. Si la tabla necesita esos datos, hay que guardar el alta localmente o agregar campos (ver §13).

**Formato del rol:** `Roles.Administrador` y `Roles.Empleado` son strings con mayúscula inicial (`"Administrador"`, `"Empleado"`), no enums numéricos.

**Id de usuario:** `string`, no `guid` (`UsuarioResponse.Id` es `string` por ser de Identity). Tenerlo en cuenta al tipar en `@nexa/api`.

**Contrato propuesto para la pantalla completa (NO EXISTE hoy):**

```
GET   /api/usuarios?pagina=1&tamano=20        → 200 PaginaResponse<UsuarioListadoResponse>   (solo Administrador)
PUT   /api/usuarios/{id}                      { nombre, apellido, rol }                      → 200 UsuarioListadoResponse
PATCH /api/usuarios/{id}/activo               { activo: boolean }   → 200 UsuarioListadoResponse   (RV-D30 / FB8)

UsuarioListadoResponse {
  id: string,
  email: string,
  nombre: string,               // columna Usuario (nombre)
  apellido: string,             // columna Usuario (apellido)
  rol: "Administrador" | "Empleado",   // columna Rol
  activo: boolean,              // columna Estado
  ultimoIngreso: datetime UTC | null   // columna Último ingreso ("Nunca ingresó" si null)
}
```

`ultimoIngreso` exige registrar la fecha en el login (`AutenticacionService.LoginAsync`), que hoy no la guarda.

## 10. Reglas de negocio visibles

- **RN17:** solo los empleados y administradores tienen usuario. Los clientes no tienen login. Esta pantalla no muestra clientes.
- **RN17 (roles):** los roles son `Administrador` y `Empleado`. El alta solo acepta esos dos valores.
- **CU03:** solo un administrador crea empleados y administradores.
- **Spec §5:** los usuarios usan las tablas de ASP.NET Identity (`AspNetUsers`, `AspNetRoles`). Los campos `Nombre` y `Apellido` son propuesta de F1-02, no definidos en la spec.

## 11. Responsive

Solo desktop. El Figma no tiene frame móvil del backoffice (1440 px).

**Propuesta, a confirmar:** por debajo de 1280 px, el panel `Nuevo empleado` se apila debajo de la tabla. La tabla usa scroll horizontal dentro de su contenedor.

## 12. Accesibilidad

El Figma no define accesibilidad. Propuesta:
- Cada input tiene label visible arriba. El helper de contraseña se asocia con `aria-describedby`.
- El campo de contraseña tiene un botón para mostrar u ocultar el valor, con label accesible.
- Los chips de rol son botones con `aria-pressed` (o un `radiogroup` con dos `radio`, que es más preciso para selección única).
- Las iniciales del avatar son decorativas si el nombre ya aparece en la fila.
- El badge de estado lleva el texto (`Activo`, `Inactivo`), no solo el color.
- El menú `...` es un botón con label accesible (`Acciones de {nombre}`), aunque el Figma no define su contenido.
- Contraste: el texto terciario (`Nunca ingresó`, helper del campo) tiene el mismo problema que en B11 (aproximadamente 3,3:1).

## 13. Dudas e inconsistencias Figma ↔ back

1. **Pantalla sin listado.** No existe `GET /api/usuarios`. La tabla completa depende de él. Decidir: ¿se agrega el endpoint de listado (contrato propuesto en §9) o la pantalla se reduce a alta en esta versión?
2. **Sin activo/inactivo.** El Figma muestra `Activo` e `Inactivo` por fila, y el menú de fila sugiere acciones. El back no tiene estado de usuario ni endpoint para desactivar. **NO EXISTE.** Decidir si se agrega (y cómo se impide que un Administrador se desactive a sí mismo o al último Administrador, regla **NO DEFINIDA**).
3. **Sin último ingreso.** El Figma muestra fechas y `Nunca ingresó`. El back no guarda la fecha del login. **NO EXISTE.**
4. **La respuesta del alta no trae nombre ni apellido.** `UsuarioResponse` solo tiene `Id`, `Email` y `Rol`. Si la tabla muestra nombre, hace falta el listado o ampliar la respuesta.
5. **Buscador oculto por DNI.** El Figma tiene una búsqueda `Buscar por DNI o apellido` marcada como oculta. Los usuarios no tienen DNI (no está en `Usuario` ni en `CrearUsuarioRequest`). Decidir si se elimina.
6. **Política de contraseña.** El DTO no define longitud ni complejidad. Los defaults de Identity aplican si no se cambiaron (verificar). El Figma no muestra requisitos. Decidir cuál es la regla y mostrarla en el helper.
7. **Botón `Generar`.** No hay endpoint. Decidir: (a) generar en el front con una regla que cumpla la política, o (b) agregar un endpoint. En ambos casos, el Figma no define cómo se muestra la contraseña generada ni cómo se entrega. **NO DEFINIDO.** **Decidido por el usuario (2026-11-06): (a), el front genera la contraseña temporal** y el empleado debe cambiarla en el primer ingreso (US-FE-B-26, PB-31). Cómo se muestra y si se copia sigue abierto (D-B24-05 de `US-FE-B-24.md`).
8. **Rol por defecto.** El Figma muestra `Empleado` seleccionado. No hay regla. **NO DEFINIDO.**
9. **Chip `Destacado` para `Administrador` en la tabla.** La descripción del componente dice que Destacado "marks the one thing that matters on a widget". Confirmar que el lime en la tabla es la intención y no un error de uso.
10. **Email repetido.** El back lo rechaza (F1-03). El texto y el código del error **no están verificados**. Confirmar el mensaje antes de mostrarlo.
11. **Panel siempre visible vs. modal.** El Figma muestra el panel `Nuevo empleado` en la misma pantalla que la tabla. El botón `Nuevo empleado` de la topbar no tiene función clara. **NO DEFINIDO.**
12. **Qué pasa después de crear.** Sin listado, no hay refresco. **NO DEFINIDO.** Propuesta: mostrar confirmación y limpiar el formulario.
13. **Sidebar del Empleado.** El Figma muestra `Usuarios` al Empleado en B11 y B12. Esta pantalla es solo de Administrador. Decidir si se oculta para Empleado.
14. **Datos de muestra.** Los nombres, emails con dominio `@nexaseguros.com.ar` y fechas son muestra del Figma. Usar datos reales del back.

## 14. Referencia Figma

- Pantalla: nodo `33:1294`. URL: `https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=33-1294`.
- Subnodos útiles: tabla `33:1404`, encabezado `33:1405`, fila Hernán Sosa `33:1416`, panel `33:1549`, campo contraseña `33:1566`, selector de rol `33:1575`, footer `33:1584`.
