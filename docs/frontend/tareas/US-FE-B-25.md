# US-FE-B-25: Usuarios: listado, edición y activación

Tipo B · Oleada 5 · Tamaño M · Rama sugerida `feature/US-FE-B-25-usuarios-listado-edicion` · Tarjeta Trello `US-FE-B-25`

## 1. Objetivo

Al terminar, la pantalla `/usuarios` (B14) muestra a la izquierda la tabla de usuarios (nombre, email, rol y estado), con un menú por fila para editar nombre, apellido y rol (`PUT`), y para activar o desactivar al usuario (`PATCH`). Todo el listado y las acciones funcionan contra mock (PB-04) hasta que el back publique los endpoints. Usuario: solo Administrador.

## 2. Alcance

**Entra**
- Tabla `UsuariosTable` y `UsuarioRow` dentro de `UsuariosPage` (bloque que B-24 dejó vacío).
- Avatar con iniciales `UsuarioAvatar` (decorativo) y `RolChip` (`Administrador` destacado, `Empleado` neutro).
- Badge de estado `EstadoUsuarioBadge` (`Activo`, `Inactivo`).
- Menú por fila `MenuUsuario` con `Editar` y `Desactivar` / `Activar`.
- Panel de edición `EditarUsuarioPanel` que reemplaza el panel de alta mientras se edita (ver D-B25-04).
- Diálogo de confirmación para desactivar (mismo patrón que B-23).
- Hooks `useUsuarios`, `useEditarUsuario`, `useActivarUsuario` en `features/usuarios/api/`.
- Schema `editarUsuarioSchema`.
- Tests de §10.

**NO entra**
- Alta de empleado o administrador (`NuevoEmpleadoPanel`): US-FE-B-24.
- Columna `Último ingreso` y el texto `Nunca ingresó`: no existe el dato (PB-04). Se omite la columna (INDEX B-25: "Sin último ingreso").
- Búsqueda oculta por DNI o apellido: no se renderiza (B14 §5).
- Editar el email: el `PUT` no lo acepta (`{ nombre, apellido, rol }`).
- Cambiar la contraseña de un usuario existente: no hay endpoint.

## 3. Dependencias

- **Oleada (INDEX):** 5.
- **Puede empezar sin esperar a:** —.
- **Depende de:** `US-FE-B-24`, `US-FE-T-04`, `US-FE-T-06`, `US-FE-T-07`, `US-FE-T-11`, `US-FE-T-19`, `US-FE-T-32`.
- **Pedidos al back (INDEX):** PB-04 (MSW).
- **Degradación:** PB-15 (mensajes de validación en inglés): mapeo propio por clave de `errors` (FB7.6). `Backdrop` de T-07 para el diálogo.
- **Workaround MSW (FB7.7):** los tres endpoints son mock de T-32 (`packages/api/mocks/handlers/usuarios.ts`), activos con `VITE_USE_MOCKS=true`. El código de la feature nunca lee el flag (FC3).

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB3 (reglas 1 a 4), FB7.7 (MSW), FB7.10 (Usuarios solo Admin).
- `docs/frontend/tareas/INDEX.md`: FC1, FC2 (hooks solo en `features/usuarios/api/`; `usuariosKeys` de T-32), FC3 (los mocks no leen el flag), FC10, FC11, FC16, D-20 (rol sin preselección), D-21 (contraseña: no se edita aquí).
- `docs/frontend/pantallas/B14-usuarios.md`:
  - §3 (tabla: columnas `Usuario` 300, `Rol` 130, `Estado` 105, `Último ingreso` 160, `Acción` 40; filas de 64 px; avatar de 32 px; contenido de cada fila).
  - §4 (componentes: `Chip` Destacado y Neutro, `Badge/Activo` y `Badge/Inactivo`, `UsuarioAvatar`, `RolChip`, `EstadoUsuarioBadge`, menú `...`).
  - §5 (textos literales: headers `Usuario`, `Rol`, `Estado`; `Activo`, `Inactivo`; chips `Administrador`, `Empleado`; labels del panel; `Cancelar`).
  - §6 (reglas de nombre, apellido y rol).
  - §7 (estados: fila Activo e Inactivo, chips, último ingreso omitido).
  - §8 (acciones: menú `...` NO DEFINIDO; desactivar y editar: NO EXISTE endpoint).
  - §9 (contrato propuesto: `GET /api/usuarios`, `PUT /api/usuarios/{id}`, `POST .../desactivar`, `POST .../activar`, `UsuarioListadoResponse`).
  - §12 (accesibilidad: avatar decorativo, badge con texto, menú con nombre `Acciones de {nombre}`).
  - §13 puntos 1, 2, 4, 9, 14.
- `docs/frontend/pedidos-al-back.md`: PB-04 (contrato mínimo propuesto: `GET /api/usuarios?pagina=&tamanoPagina=`, `PUT`, `PATCH /api/usuarios/{id}/activo`, `UsuarioListItem`). Ver D-B25-03 por la diferencia con B14 §9.
- `docs/frontend/contratos-api/seguridad-clientes-publico.md`: §2.2 (`RolUsuario`), §2.5 (`UsuarioResponse`, validaciones de nombre y apellido).
- `docs/frontend/contratos-api/convenciones-transversales.md`: §6.1 (`PaginaResponse<T>`: request `tamano`, response `tamanoPagina`), §3.3 (`ValidationProblemDetails`).
- `docs/frontend/design-system.md`: §5.12 (Table/Header y Row), §5.5 (Chip), §5.4 (Badge/Estado: `Activo` = vigente, `Inactivo` = vencida), §5.14 (Backdrop), §8.3 (foco visible).

## 5. Archivos a crear o modificar

Bajo `frontend/apps/backoffice/src/features/usuarios/`.

| Archivo | Acción | Dueño | Nota |
|---|---|---|---|
| `components/UsuariosTable.tsx` | crear | B-25 | Tabla de tres columnas (`Usuario`, `Rol`, `Estado`) y la columna de acción. |
| `components/UsuarioRow.tsx` | crear | B-25 | Una fila de 64 px. |
| `components/UsuarioAvatar.tsx` | crear | B-25 | Iniciales de 32 px, `aria-hidden="true"`. |
| `components/RolChip.tsx` | crear | B-25 | `Administrador` (destacado) o `Empleado` (neutro). |
| `components/EstadoUsuarioBadge.tsx` | crear | B-25 | `Activo` o `Inactivo`. |
| `components/MenuUsuario.tsx` | crear | B-25 | Botón `...` y menú (`role="menu"`). |
| `components/EditarUsuarioPanel.tsx` | crear | B-25 | Panel de edición de 360 px (ver D-B25-04). |
| `components/ConfirmarDesactivarUsuarioDialog.tsx` | crear | B-25 | `<dialog>` `role="alertdialog"`. |
| `api/useUsuarios.ts` | crear | B-25 | `useQuery` sobre `GET /api/usuarios` (mock). |
| `api/useEditarUsuario.ts` | crear | B-25 | `useMutation` sobre `PUT /api/usuarios/{id}` (mock). |
| `api/useActivarUsuario.ts` | crear | B-25 | `useMutation` sobre `PATCH /api/usuarios/{id}/activo` (mock). |
| `schemas/editarUsuarioSchema.ts` | crear | B-25 | zod para nombre, apellido y rol. |
| `pages/UsuariosPage.tsx` | editar (bloque) | B-24 (dueño) | Renderizar `UsuariosTable` en la columna izquierda. |
| `index.ts` | editar (bloque) | B-24 (dueño) | Sin exports nuevos salvo los necesarios. |
| Tests (§10) | crear | B-25 | |

No se editan `packages/*`.

## 6. Pasos de implementación

1. Confirmar en `@nexa/api` (T-32): `listarUsuarios({ pagina, tamano })`, `actualizarUsuario(id, body)`, `activarUsuario(id, { activo })` (mock), tipos `UsuarioListadoResponse` y `PaginaResponse`, y `usuariosKeys`. Si falta alguno, pedirlo a T-32.
2. Escribir los tests de §10.
3. Crear `schemas/editarUsuarioSchema.ts`:
   ```ts
   import { z } from 'zod';
   export const editarUsuarioSchema = z.object({
     nombre: z.string().trim().min(1, 'El nombre es obligatorio.').max(100, 'El nombre no puede superar los 100 caracteres.'),
     apellido: z.string().trim().min(1, 'El apellido es obligatorio.').max(100, 'El apellido no puede superar los 100 caracteres.'),
     rol: z.enum(['Administrador', 'Empleado'], { errorMap: () => ({ message: 'El rol es obligatorio.' }) }),
   });
   ```
   Los mensajes son los del DTO de alta (`seguridad-clientes-publico.md` §2.5).
4. Crear `api/useUsuarios.ts`: `useQuery` con key `usuariosKeys.lista`, `queryFn` = `listarUsuarios({ pagina: 1, tamano: 100 })` (D-B25-01). Devuelve `items`.
5. Crear `api/useEditarUsuario.ts`: `useMutation({ mutationFn: ({ id, body }) => actualizarUsuario(id, body), retry: 0 })`, con `onSuccess` que invalida `usuariosKeys.all`. El body es solo `{ nombre, apellido, rol }`.
6. Crear `api/useActivarUsuario.ts`: `useMutation({ mutationFn: ({ id, activo }) => activarUsuario(id, { activo }), retry: 0 })`, con `onSuccess` que invalida `usuariosKeys.all`.
7. Crear `UsuarioAvatar`: iniciales `nombre[0] + apellido[0]` en mayúscula, sobre fondo `surface/subtle`. `aria-hidden="true"`.
8. Crear `RolChip`: `Administrador` con `tipo="destacado"` (lime) y `Empleado` con `tipo="neutro"` (B14 §4). Confirmar D-B25-05.
9. Crear `EstadoUsuarioBadge`: `Activo` con token `status/vigente` e `Inactivo` con token `status/vencida` (B14 §4).
10. Crear `UsuariosTable` con `Table/Header` de 40 px y filas de 64 px. Columnas: `Usuario` (avatar, nombre y apellido en una línea; email debajo en 11 px `text/secondary`), `Rol`, `Estado`, y la columna de acción con `MenuUsuario`.
11. Crear `MenuUsuario`: botón con `aria-label="Acciones de {nombre}"` y ícono de tres puntos (`aria-hidden`). Al abrir muestra `role="menu"` con:
    - `Editar` (siempre).
    - `Desactivar` si `activo` es true; `Activar` si es false.
    Teclado: flechas para moverse, `Escape` cierra y devuelve el foco al botón.
12. Acción `Editar`: muestra `EditarUsuarioPanel` con el usuario cargado.
13. Crear `EditarUsuarioPanel` (360 px, padding 24 px):
    - Título `Editar usuario` (propuesta; ver §8).
    - `Input` `Nombre`, `Input` `Apellido`.
    - `Input` `Email` deshabilitado, con valor del usuario. Sin helper.
    - `RolSelector` de B-24 con el rol cargado.
    - Footer: `Cancelar` (secundario M) y `Guardar cambios` (primario M).
    - `Cancelar` vuelve a los valores cargados y cierra el panel de edición.
    - `Guardar cambios` llama `useEditarUsuario` con `{ nombre, apellido, rol }`. Deshabilitado mientras corre.
14. Acción `Desactivar`: abre `ConfirmarDesactivarUsuarioDialog` (`<dialog role="alertdialog">`, foco inicial en `Cancelar`, `Escape` cierra). Confirmar llama `useActivarUsuario({ activo: false })`.
15. Acción `Activar`: llama `useActivarUsuario({ activo: true })` sin diálogo (D-B25-06).
16. Errores:
    - 400 `errors` (PascalCase: `Nombre`, `Apellido`, `Rol`): mensaje bajo el campo con el texto propio.
    - 400 `detail` o 404 o 500: alerta del panel con `role="alert"`.
    - Error de `PATCH`: alerta encima de la tabla.
17. Escribir la página de estados (cargando, vacío, error) en `UsuariosTable`.

## 7. Contrato con el back

| Método y ruta | Estado | Auth | Request | Respuesta | Errores que maneja la UI |
|---|---|---|---|---|---|
| `GET /api/usuarios` | **NO EXISTE** (PB-04). Mock de T-32. | `Administrador` | query `pagina=1&tamano=100` | 200 `PaginaResponse<UsuarioListadoResponse>` | 401, 403, 500 |
| `PUT /api/usuarios/{id}` | **NO EXISTE** (PB-04). Mock de T-32. | `Administrador` | `{ nombre, apellido, rol }` | 200 `UsuarioListadoResponse` | 400 `errors` (`Nombre`, `Apellido`, `Rol`); 404; 401; 403 |
| `PATCH /api/usuarios/{id}/activo` | **NO EXISTE** (PB-04). Mock de T-32. | `Administrador` | `{ activo: boolean }` | 200 `UsuarioListadoResponse` | 404; 401; 403 |

Tipos (propuesta de B14 §9 y PB-04; los exporta T-32):

```ts
export type RolUsuario = 'Administrador' | 'Empleado';

export interface UsuarioListadoResponse {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: RolUsuario;
  activo: boolean;
  ultimoIngreso: string | null;   // no se muestra en esta tarea
}

export interface EditarUsuarioRequest {
  nombre: string;                 // máx. 100
  apellido: string;               // máx. 100
  rol: RolUsuario;
}

export interface ActivarUsuarioRequest {
  activo: boolean;
}
```

Notas:
- La lista usa `pagina` y `tamano` (B14 §9) y responde `PaginaResponse` (`items`, `pagina`, `tamanoPagina`, `total`). PB-04 propone `tamanoPagina` como parámetro. Ver D-B25-03.
- La activación usa `PATCH` (INDEX de B-25 y PB-04). B14 §9 propone `POST .../activar` y `POST .../desactivar` con 204. Ver D-B25-03.

Handlers MSW: T-32 (`packages/api/mocks/handlers/usuarios.ts`). Esta tarea no los modifica.

## 8. Contenido de UI

Textos literales del Figma (B14 §5):

| Elemento | Texto |
|---|---|
| Header 1 | `Usuario` |
| Header 2 | `Rol` |
| Header 3 | `Estado` |
| Estado Activo | `Activo` |
| Estado Inactivo | `Inactivo` |
| Chip rol 1 | `Administrador` |
| Chip rol 2 | `Empleado` |
| Label nombre | `Nombre` |
| Label apellido | `Apellido` |
| Label email | `Email` |
| Label rol | `Rol` |
| Botón cancelar | `Cancelar` |
| Botón guardar | `Guardar cambios` |

Textos que el Figma no define (propuesta, B14 §7 y §8 "NO DEFINIDO"):

| Elemento | Texto propuesto |
|---|---|
| Título del panel de edición | `Editar usuario` |
| Acción de la fila | `Acciones de {nombre}` (aria-label) |
| Opciones del menú | `Editar`, `Desactivar`, `Activar` |
| Título del diálogo | `Desactivar a {nombre}` |
| Cuerpo del diálogo | `Deja de poder ingresar al sistema hasta que lo actives de nuevo.` |
| Botones del diálogo | `Cancelar` (foco inicial) y `Desactivar` |
| Éxito al guardar | `Cambios guardados.` |
| Éxito al activar o desactivar | `Usuario actualizado.` |
| Tabla vacía | `No hay usuarios.` |
| Error de la lista | `No se pudieron cargar los usuarios.` + `detail` |
| Error de `PUT` sin `errors` | `detail` del back o `Ocurrió un error inesperado.` |
| Guardando | `Guardando…` |
| Mensajes de `errors` | `Nombre` → `El nombre es obligatorio.` / `El nombre no puede superar los 100 caracteres.`; `Apellido` → `El apellido es obligatorio.` / `El apellido no puede superar los 100 caracteres.`; `Rol` → `El rol debe ser Administrador o Empleado.` |

Valores de muestra del Figma (no son texto fijo): `Hernán Sosa`, `hernan.sosa@nexaseguros.com.ar`, `Mariela Quiroga`, `Ezequiel Robles`, `Agustina Paz`, `Facundo Gallardo`, `Rocío Medina`, `Natalia Ferreyra`, `Julieta Ávila`.

## 9. Estados y casos borde

| Caso | Comportamiento |
|---|---|
| Lista cargando | Skeleton de 3 filas de 64 px. |
| Lista vacía | `No hay usuarios.` |
| Lista con error | `No se pudieron cargar los usuarios.` y `detail`, en `role="alert"`. |
| Usuario inactivo | Badge `Inactivo`; en el menú aparece `Activar`. |
| Editar: sin cambios | `Guardar cambios` envía el `PUT` igual (no hay estado sucio que comparar). |
| Editar: rol vacío | Error de campo; no se envía. |
| Editar: `errors` del back | Mensaje bajo el campo con el texto de §8. |
| Editar: `detail` del back | Alerta del panel. |
| Editar en curso | Botón deshabilitado; un solo PUT. |
| Desactivar: diálogo | `Cancelar` y `Escape` no envían. Confirmar envía un solo PATCH `{ activo: false }`. |
| Activar | Un solo PATCH `{ activo: true }`. |
| PATCH 404 | Alerta `detail` y refresco de la lista. |
| Desactivarse a uno mismo | `Desactivar` deshabilitado con el motivo `No podés desactivar tu propia cuenta.` (D-B25-02). |
| Desactivar al último administrador activo | `Desactivar` deshabilitado con `Debe quedar al menos un administrador activo.`; en la edición, `Empleado` no se guarda (D-B25-02). |
| Viewport < 1280 px | Tabla con scroll horizontal dentro de su contenedor. |

## 10. Tests requeridos

Herramientas: Vitest, Testing Library, MSW (handlers de T-32 con `server.use`), `vitest-axe`.

`components/UsuariosTable.test.tsx`:
1. `headers_sin_ultimo_ingreso`: aparecen `Usuario`, `Rol` y `Estado`; no aparece `Último ingreso`.
2. `fila_muestra_nombre_email_rol_y_estado`: nombre y apellido, email, `Administrador` con el token destacado y `Activo`.
3. `avatar_es_decorativo`: las iniciales tienen `aria-hidden="true"`.
4. `estado_inactivo_muestra_inactivo`.
5. `lista_vacia_y_error`: `No hay usuarios.` y `No se pudieron cargar los usuarios.`.
6. `a11y_sin_violaciones`.

`components/MenuUsuario.test.tsx`:
7. `activo_muestra_editar_y_desactivar`.
8. `inactivo_muestra_activar`.
9. `escape_cierra_y_devuelve_foco`.
10. `boton_tiene_nombre_accesible`: `Acciones de Hernán Sosa`.

`components/EditarUsuarioPanel.test.tsx`:
11. `email_deshabilitado_y_sin_password`: el input `Email` está deshabilitado y no existe campo de contraseña.
12. `guardar_envia_put_con_nombre_apellido_y_rol`: el body tiene exactamente las tres claves.
13. `rol_vacio_no_envia_put`: `El rol es obligatorio.`; contador = 0.
14. `400_errors_muestra_texto_en_espanol`: `errors.Nombre` muestra `El nombre es obligatorio.`.
15. `doble_clic_envia_un_put`: contador = 1.
16. `cancelar_restablece_valores`.

`components/ConfirmarDesactivarUsuarioDialog.test.tsx`:
17. `desactivar_abre_alertdialog_con_foco_en_cancelar`.
18. `cancelar_no_envia_patch`.
19. `confirmar_envia_patch_activo_false`: body `{ activo: false }`; la fila pasa a `Inactivo`.

`api/useActivarUsuario.test.ts`:
20. `activar_envia_activo_true_sin_dialogo`: body `{ activo: true }` y contador = 1 sin pasar por el diálogo.
21. `patch_404_muestra_detail`.

`pages/UsuariosPage.listado.test.tsx`:
22. `pide_listado_con_pagina_y_tamano`: la request tiene `pagina=1` y `tamano=100`.
23. `tras_editar_refresca_la_tabla`: `usuariosKeys` se invalida y la lista se vuelve a pedir.

## 11. Criterios de aceptación

1. La tabla muestra `Usuario`, `Rol` y `Estado`, sin columna `Último ingreso` (test 1).
2. Cada fila muestra nombre y apellido, email, chip de rol y badge de estado con su texto (test 2).
3. El avatar con iniciales es decorativo (test 3).
4. El menú de cada fila tiene el nombre accesible `Acciones de {nombre}` y muestra `Editar`, y `Desactivar` o `Activar` según el estado (tests 7, 8 y 10).
5. `Editar` abre el panel con los valores cargados y el email deshabilitado; `Guardar cambios` envía solo `{ nombre, apellido, rol }` (tests 11 y 12).
6. Un `errors` del back se muestra en español bajo el campo (test 14).
7. `Desactivar` abre un diálogo `alertdialog` con foco en `Cancelar`; solo confirmar envía el PATCH (tests 17, 18 y 19).
8. `Activar` envía `{ activo: true }` sin diálogo (test 20).
9. Un doble clic en `Guardar cambios` o en `Desactivar` envía una sola request (tests 15 y 19).
10. La lista se pide con `pagina=1` y `tamano=100` (test 22), y se refresca tras cada cambio (test 23).
11. Los tests 1 a 23 están en verde, con `vitest-axe` sin violaciones.
12. `npm run lint`, `typecheck`, `test` y `build` están en verde en `apps/backoffice`.

## 12. Verificación manual

1. Con `VITE_USE_MOCKS=true`, entrar como Administrador a `/usuarios`.
2. Verificar la tabla: nombres, emails, chips `Administrador` (lime) y `Empleado` (gris), y badges `Activo` e `Inactivo`.
3. Abrir `Acciones de Hernán Sosa` con el teclado (Enter sobre el botón, flechas y Escape).
4. Elegir `Editar`, cambiar el apellido y guardar: verificar `Cambios guardados.` y el nuevo valor en la fila.
5. Elegir `Desactivar` en un usuario activo: verificar el diálogo, pulsar `Cancelar` y luego repetir y confirmar. Verificar `Inactivo`.
6. Elegir `Activar` en ese mismo usuario y verificar `Activo`.
Confirmar los resultados antes de abrir el PR (regla 7 de `docs/workflow.md`).

## 13. Decisiones tomadas

Decididas por Sebastián el 2026-11-07 (regla 12): aceptó los defaults de D-B25-01 y D-B25-03 a D-B25-07 y cambió D-B25-02 a bloquear en la UI.

- **D-B25-01: paginación.** El Figma no muestra paginación; B14 propone `pagina` y `tamano` (sin límite de página en la UI). Default: `tamano=100` y sin controles de paginación. Si hay más de 100 usuarios, confirmar la paginación con diseño.
- **D-B25-02: reglas de desactivación (B14 §13.2, NO DEFINIDA). Decidido: bloquear en la UI.** No se puede desactivar la propia cuenta (se compara el email de la fila con el de la sesión, sin distinguir mayúsculas) ni al único administrador activo, ni pasarlo a `Empleado` desde la edición. `Desactivar` queda deshabilitado en el menú (`aria-disabled`) con el motivo leído por `aria-describedby`: `No podés desactivar tu propia cuenta.` / `Debe quedar al menos un administrador activo.`. Al editar al último administrador, `Empleado` no se puede guardar: error de campo con el segundo texto. El back sigue siendo la autoridad; si rechaza, se muestra su `detail`.
- **D-B25-03 (RV-D30): forma del contrato. Resuelto.** B14 §9 propone `POST .../desactivar` y `POST .../activar` (204) y `GET /api/usuarios?pagina=1&tamano=20`. PB-04 propone `PATCH /api/usuarios/{id}/activo` y `?pagina=&tamanoPagina=`. El INDEX de B-25 usa `PATCH`. Default: `PATCH` y `tamano` (RV-D30); B14 §9 y PB-04 se ajustan en el doc PR.
- **D-B25-04: panel de edición.** B14 §3 muestra solo el panel de alta. Default: el panel de edición reemplaza al de alta mientras se edita, y `Cancelar` vuelve al alta vacía. Confirmar con diseño.
- **D-B25-05: color de `Administrador` en la tabla (B14 §13.9).** Default: destacado (lime), como el Figma. Confirmar que no es un error de uso del componente.
- **D-B25-06: diálogo al activar.** Default: sin diálogo para `Activar`; con diálogo para `Desactivar`.
- **D-B25-07: contenido del menú.** B14 §8: NO DEFINIDO. Default: `Editar` y `Desactivar` o `Activar`.

## 14. Riesgos y errores comunes

- **Email editable por error.** El `PUT` no acepta email. El campo va deshabilitado y el body no lo incluye.
- **Contraseña en el `PUT`.** No hay contraseña en la edición. No agregar ningún campo de contraseña.
- **Mezclar alta y edición.** `EditarUsuarioPanel` es un componente aparte de `NuevoEmpleadoPanel` (B-24). No cambiar el modo de B-24.
- **Estado desincronizado.** Tras `PATCH`, la fila debe reflejar el `UsuarioListadoResponse` que devuelve el back, no el valor local.
- **Texto del menú sin nombre.** El botón `...` sin `aria-label` no se entiende en un lector de pantalla. Usar `Acciones de {nombre}`.
- **Mock con forma distinta.** Si T-32 usa `tamanoPagina` como parámetro, la lista no se pide bien. Tests 22 lo cubren.
- **Email repetido o duplicado en edición.** No aplica: no se edita el email.

## 15. Definición de terminado

- `npm run lint`, `typecheck`, `test` y `build` en verde.
- Accesibilidad revisada con T-19: tabla con `scope="col"`, menú con nombre accesible y navegación por teclado, diálogo con foco y `Escape`, avatar decorativo.
- Sin secretos ni contraseñas.
- Criterios 1 a 12 de §11 tildados con evidencia observada.

## 16. Observaciones al índice

- Resuelto (RV-61): T-07 (`AlertaError`, `Backdrop`) agregado a "Depende de".
- Resuelto (triage final, default de la ficha): el INDEX no lista T-04 (`Input`), que la tarea usa para Nombre, Apellido y Email. Motivo: la observación no aparece en REVISION.md ni en FB8.

## 16. Observaciones al implementar

- Nombres reales de T-32: los tipos y funciones llevan el sufijo `Mock` (`UsuarioListItemMock`, `ActualizarUsuarioMock`, `listarUsuariosMock`, `actualizarUsuarioMock`, `cambiarActivoUsuarioMock`); esta tarea los usa tal cual y no los renombra.
- `UsuariosTable` reutiliza `Table` de `@nexa/ui` con una columna `Acciones` cuyo contenido es `MenuUsuario` (el `onRowMenu` del componente no admite nombre accesible por fila ni menú).
- La edición reemplaza al panel de alta; `Nuevo empleado` cierra la edición. Tras guardar con éxito el panel vuelve al alta.
- El error de un `PATCH` se muestra como alerta sobre la tabla y la lista se vuelve a pedir siempre (`onSettled`).
- Los avisos de éxito (`Cambios guardados.`, `Usuario actualizado.`) son toast (FC19).
- La cuenta propia se detecta por email: el contrato mock no tiene un `GET /api/auth/yo` real (PB-04), y el JWT trae el email.
- ABIERTO: con el back real, el mismo bloqueo debería aplicarse en el servidor (desactivarse a uno mismo, quedarse sin administrador). Hasta PB-04 es solo UI.
