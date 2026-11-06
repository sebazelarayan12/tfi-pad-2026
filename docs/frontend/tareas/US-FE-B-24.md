# US-FE-B-24: Usuarios: alta de empleado o administrador

Tipo B · Oleada 4 · Tamaño S · Rama sugerida `feature/US-FE-B-24-usuarios-alta` · Tarjeta Trello `US-FE-B-24`

## 1. Objetivo

Al terminar, `/usuarios` (B14) muestra el panel `Nuevo empleado` y permite crear un empleado o un administrador con `POST /api/auth/usuarios`. Pide nombre, apellido, email, rol (sin preselección) y una contraseña temporal que el front genera con el botón `Generar` (RV-D18, decidido por el usuario el 2026-11-06). El empleado debe cambiarla en su primer ingreso (US-F1-09 y US-FE-B-26). El back valida la política al crear. Con 201 limpia el formulario y borra la contraseña de la memoria de la pantalla. Usuario: solo Administrador. La tabla de usuarios es de US-FE-B-25.

## 2. Alcance

**Entra**
- Feature `apps/backoffice/src/features/usuarios/`: `api/`, `components/`, `pages/`, `schemas/`, `types/`, `routes.tsx` e `index.ts`. Esta tarea es la primera de la feature (FC1).
- Ruta `/usuarios` protegida con `RequireRol` (T-13) con rol `Administrador`.
- Panel `NuevoEmpleadoPanel` con `react-hook-form` y zod (360 px).
- Componentes `PasswordField` (campo con botón `Generar` y mostrar u ocultar) y `RolSelector` (radiogroup con chips).
- Generador `generarPasswordTemporal()` (`schemas/generarPassword.ts`) con `crypto.getRandomValues`.
- Hook `useCrearUsuario` (mutación, `retry: 0`).
- Schema `crearUsuarioSchema` con los mensajes del DTO.
- Botón `Nuevo empleado` de la topbar: limpia el formulario y enfoca `Nombre`.

**NO entra**
- Tabla `Usuario / Rol / Estado`, edición y activación: US-FE-B-25.
- Último ingreso (no existe en el back; PB-04).
- Búsqueda oculta por DNI o apellido: no se renderiza (B14 §5).
- Campana y menú de usuario: T-16.
- Confirmación por email o envío de la contraseña: fuera de alcance del front (B14 §6, "Compartila por un canal seguro.").
- Cambio obligatorio de la contraseña en el primer ingreso (pantalla, guarda y endpoint): US-FE-B-26 y US-F1-09 (PB-31). Esta tarea solo genera la temporal.
- Validar en el front la política de Identity: el back es la autoridad. El generador solo produce una contraseña que la cumple (D-B24-02).

## 3. Dependencias

- **Oleada (INDEX):** 4.
- **Puede empezar sin esperar a:** `US-FE-B-25` (lo consume B-25; B-25 declara dependencia).
- **Depende de:** `US-FE-T-04`, `US-FE-T-05`, `US-FE-T-10`, `US-FE-T-11`, `US-FE-T-13`, `US-FE-T-16`, `US-FE-T-19`, `US-FE-T-32`.
- **Pedidos al back (INDEX):** PB-15 (degrada).
- **Degradaciones:** PB-15 (mensajes de validación en inglés en `errors`): el front mapea cada clave a un mensaje propio (FB7.6). PB-14 (400 de negocio sin código): el email repetido se muestra por `detail`, sin marcar campo.
- **Workaround MSW (FB7.7):** no aplica. El endpoint está Implementado. Tests con handlers de T-32.

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB3 (reglas 1 a 4), FB7.5 (sesión: nada en `localStorage`), FB7.6 (mensajes), FB7.10 (Usuarios solo Admin), FB8 (RV-D18 y RV-D24).
- `docs/frontend/tareas/INDEX.md`: FC1, FC2, FC10, FC11, FC12 (almacenamiento), FC16, D-20 (rol sin preselección), D-21 (política de contraseña: la valida el back), D-24.
- `docs/frontend/pantallas/B14-usuarios.md`:
  - §2 (ruta y guardas).
  - §3 (panel `Nuevo empleado` 360 px: orden de campos y alturas).
  - §4 (componentes: `Input`, `Button`, `Chip`; `PasswordField`; `RolSelector`).
  - §5 (textos literales del panel: `Nuevo empleado`, `Nombre`, `Apellido`, `Email`, `Contraseña temporal`, `Compartila por un canal seguro.`, `Rol`, chips `Empleado` y `Administrador`, `Cancelar`, `Crear empleado`).
  - §6 (reglas de cada campo).
  - §7 (estados: creando, éxito, error de email repetido).
  - §8 (acciones: `Nuevo empleado`, `Cancelar`, `Crear empleado`).
  - §9 (`POST /api/auth/usuarios` y el body `CrearUsuarioRequest`).
  - §11 (responsive) y §12 (accesibilidad: label visible, `aria-describedby` del helper, botón mostrar u ocultar, `radiogroup` para el rol).
  - §13 puntos 1, 6, 7, 8, 10, 11, 12.
- `docs/frontend/contratos-api/seguridad-clientes-publico.md`:
  - §2.5 (`CrearUsuarioRequest`, validaciones con mensajes, política de contraseña de Identity, `UsuarioResponse`, tabla de errores, notas para el front).
  - §2.2 (`RolUsuario`).
- `docs/frontend/contratos-api/convenciones-transversales.md`: §3.3 (`ValidationProblemDetails`, claves PascalCase), §3.4 (`ProblemDetails`).
- `docs/frontend/design-system.md`: §5.2 (Input, helper y estados), §5.5 (Chip: `Seleccionado`, `Sin seleccionar`), §5.1 (Button), §8.2 (error de campo), §8.3 (foco).
- `docs/frontend/pedidos-al-back.md`: PB-15 (mensajes en inglés) y PB-14 (códigos de 400).

## 5. Archivos a crear o modificar

Bajo `frontend/apps/backoffice/src/features/usuarios/`. Dueño de todos: US-FE-B-24.

| Archivo | Acción | Nota |
|---|---|---|
| `routes.tsx` | crear | `[{ path: '/usuarios', element: <UsuariosPage />, handle: { titulo: 'Usuarios' } }]`. Reemplaza el stub de T-14. La guarda de rol vive en `UsuariosPage` con `useRol` de `features/auth`: `eslint-plugin-boundaries` prohíbe que un feature importe `app/guards/RequireRol` (FB3-4). Mismo texto y comportamiento que `RequireRol`. |
| `index.ts` | crear | Exporta `usuariosRoutes`. B-25 agrega sus exports. |
| `pages/UsuariosPage.tsx` | crear | Topbar (`Usuarios`, `Nuevo empleado`) y las dos columnas: tabla (B-25, bloque vacío) y panel. |
| `components/NuevoEmpleadoPanel.tsx` | crear | Formulario de alta. |
| `components/PasswordField.tsx` | crear | `Input` de `Contraseña temporal` con el botón `Generar` (secundario S, 73 × 32 px, Figma), el botón `Copiar` (D-B24-05) y el botón de mostrar u ocultar. |
| `schemas/generarPassword.ts` | crear | `generarPasswordTemporal()`: 16 caracteres con mayúscula, minúscula, dígito y símbolo, con `crypto.getRandomValues` (D-B24-02). |
| `components/RolSelector.tsx` | crear | `radiogroup` con dos chips. |
| `api/useCrearUsuario.ts` | crear | `useMutation` sobre `POST /api/auth/usuarios`. `retry: 0`. |
| `schemas/crearUsuarioSchema.ts` | crear | zod + mensajes del DTO. |
| `types/usuarios.ts` | crear | `NuevoEmpleadoValues`. |
| Tests (§10) | crear | |

No se editan `packages/*`. El DTO `CrearUsuarioRequest` y `UsuarioResponse` los exporta T-32.

## 6. Pasos de implementación

1. Confirmar en `@nexa/api` (T-32): `crearUsuario(body)`, tipo `CrearUsuarioRequest`, `UsuarioResponse` y `RolUsuario`. Si falta alguno, pedirlo a T-32.
2. Escribir los tests de §10 antes de implementar.
3. Crear `schemas/crearUsuarioSchema.ts`:
   ```ts
   import { z } from 'zod';
   export const ROLES_ASIGNABLES = ['Administrador', 'Empleado'] as const;
   export const crearUsuarioSchema = z.object({
     nombre: z.string().trim().min(1, 'El nombre es obligatorio.').max(100, 'El nombre no puede superar los 100 caracteres.'),
     apellido: z.string().trim().min(1, 'El apellido es obligatorio.').max(100, 'El apellido no puede superar los 100 caracteres.'),
     email: z.string().trim().min(1, 'El email es obligatorio.').email('El email no tiene un formato válido.').max(256, 'El email no puede superar los 256 caracteres.'),
     password: z.string().min(1, 'La contraseña es obligatoria.'),
     rol: z.enum(ROLES_ASIGNABLES, { errorMap: () => ({ message: 'El rol es obligatorio.' }) }),
   });
   ```
   - Los mensajes son los del DTO (`seguridad-clientes-publico.md` §2.5).
   - `password` solo exige que no esté vacía. El front no valida la política al enviar: la valida el back. Si el administrador edita la contraseña generada, se envía tal cual.
   - `rol` sin valor inicial: el formulario arranca con `rol: undefined` (D-20).
4. Crear `schemas/generarPassword.ts` con `generarPasswordTemporal(): string`:
   - 16 caracteres, con al menos una mayúscula, una minúscula, un dígito y un símbolo (alfabeto sin caracteres ambiguos: `0 O 1 l I`).
   - Solo `crypto.getRandomValues` (nunca `Math.random`) y selección sin sesgo de módulo (descartar valores fuera del múltiplo del alfabeto).
   - Mezcla final (Fisher-Yates con el mismo origen aleatorio) para que las posiciones de las clases no sean predecibles.
   - El campo arranca vacío; la contraseña aparece solo al pulsar `Generar` (RV-D18, decidido por el usuario).
5. Crear `api/useCrearUsuario.ts`: `useMutation({ mutationFn: crearUsuario, retry: 0 })`. `onSuccess` invalida `usuariosKeys.all` (la tabla de B-25 se refresca).
6. Crear `PasswordField`:
   - `Input` de T-04 con label `Contraseña temporal` y `type="password"`. El helper `Compartila por un canal seguro.` se muestra como en el Figma.
   - Botón `Generar` a la derecha del campo (Figma): pone la contraseña generada en el campo y la deja visible (`type="text"`) para que el administrador pueda leerla y pasarla.
   - Botón `Copiar` (D-B24-05, decidido por el usuario): con `navigator.clipboard.writeText` copia el valor actual del campo y avisa `Contraseña copiada.` (`role="status"`). Deshabilitado si el campo está vacío. Si el portapapeles no está disponible o rechaza, muestra `No se pudo copiar. Copiala a mano.` y la contraseña sigue visible. El texto copiado no se guarda en ningún otro lado.
   - Botón de mostrar u ocultar con `aria-label` `Mostrar contraseña` / `Ocultar contraseña` (propuesta, B14 §12). Cambia `type` entre `password` y `text`.
7. Crear `RolSelector`: `<div role="radiogroup" aria-labelledby>` con label `Rol`, y dos `<input type="radio">` estilizados como `Chip` de T-05 (`Empleado` y `Administrador`). Ninguno seleccionado al montar (D-20).
8. Crear `NuevoEmpleadoPanel` (360 px, padding 24 px):
   - Título `Nuevo empleado` (16/22 SemiBold).
   - `Input` `Nombre`, `Input` `Apellido`, `Input` `Email` (alto 64 px con label y helper).
   - Fila `PasswordField`.
   - `RolSelector`.
   - Footer: `Cancelar` (secundario M) y `Crear empleado` (primario M), alineados a la derecha.
   - `Cancelar` limpia el formulario (B14 §8).
   - `Crear empleado` llama `useCrearUsuario` con `handleSubmit`. Deshabilitado mientras corre.
9. Lógica de errores de la mutación:
   - 201: limpia el formulario, borra la contraseña del estado (`reset` con `password: ''`), muestra `Usuario creado.` (propuesta) y devuelve el foco a `Nombre`.
   - 400 con `errors` (`ValidationProblemDetails`, claves PascalCase `Nombre`, `Apellido`, `Email`, `Password`, `Rol`): cada mensaje se muestra bajo el campo con el texto propio de §8 (PB-15). Nunca el texto en inglés del back.
   - 400 con `detail` (`El email ya está registrado.`, o el texto unido de Identity cuando la contraseña no cumple la política): alerta general del panel con `role="alert"`. No se marca ningún campo (FC10).
   - 401: lo resuelve T-08. 403: texto de §8. 500: `detail` o texto de error inesperado.
10. Botón `Nuevo empleado` de la topbar (B14 §8, NO DEFINIDO): limpia el formulario y enfoca `Nombre` (default, D-B24-01).
11. Crear `UsuariosPage` y `routes.tsx` e `index.ts`.
12. No guardar la contraseña en `sessionStorage`, `localStorage`, la URL ni la caché de TanStack Query (FC12). La mutación no deja la respuesta en caché.

## 7. Contrato con el back

| Método y ruta | Estado | Auth | Request | Respuesta | Errores que maneja la UI |
|---|---|---|---|---|---|
| `POST /api/auth/usuarios` | Implementado (`AuthController.cs:30`) | `Administrador` (`Politicas.Admin`) | `CrearUsuarioRequest` | 201 `UsuarioResponse` (`id`, `email`, `rol`) | 400 `errors` (PascalCase); 400 `detail`: `El email ya está registrado.` y los errores de Identity unidos por espacio (incluida la política de contraseña); 401; 403 (token de Empleado); 500 `Ocurrió un error inesperado.` |

Tipos (de `seguridad-clientes-publico.md` §2.2 y §2.5; los exporta T-32 y T-12):

```ts
export type RolUsuario = 'Administrador' | 'Empleado';

export interface CrearUsuarioRequest {
  email: string;        // obligatorio, formato email, máx. 256
  password: string;     // obligatorio; la política la valida el back (RV-D18)
  // el back marca la cuenta como DebeCambiarPassword (US-F1-09, PB-31)
  rol: RolUsuario;      // 'Administrador' | 'Empleado' (exacto)
  nombre: string;       // obligatorio, máx. 100
  apellido: string;     // obligatorio, máx. 100
}

export interface UsuarioResponse {
  id: string;           // string (Identity), no GUID tipado
  email: string;
  rol: RolUsuario;
}
```

Claves de `errors` (PascalCase): `Email`, `Password`, `Rol`, `Nombre`, `Apellido`.

Handlers MSW: T-32 (`packages/api/mocks/handlers/usuarios.ts`).

## 8. Contenido de UI

Textos literales del Figma (B14 §5):

| Elemento | Texto |
|---|---|
| Título del panel | `Nuevo empleado` |
| Label nombre | `Nombre` |
| Label apellido | `Apellido` |
| Label email | `Email` |
| Label contraseña | `Contraseña temporal` |
| Helper contraseña | `Compartila por un canal seguro.` |
| Label rol | `Rol` |
| Chip 1 | `Empleado` |
| Chip 2 | `Administrador` |
| Botón cancelar | `Cancelar` |
| Botón crear | `Crear empleado` |

Textos que el Figma no define (propuesta, B14 §7 "NO DEFINIDO"):

| Elemento | Texto propuesto |
|---|---|
| Éxito | `Usuario creado.` |
| Creando | `Creando usuario…` |
| Mostrar contraseña | `Mostrar contraseña` / `Ocultar contraseña` (aria-label) |
| Generar | `Generar` (Figma, B14 §5); `aria-label` `Generar contraseña temporal` (propuesta) |
| Copiar | `Copiar`; `aria-label` `Copiar contraseña temporal` (propuesta) |
| Copiado | `Contraseña copiada.` |
| Copiado falló | `No se pudo copiar. Copiala a mano.` |
| Rol obligatorio | `El rol es obligatorio.` (texto del DTO) |
| Errores de `errors` | `Nombre` → `El nombre es obligatorio.` / `El nombre no puede superar los 100 caracteres.`; `Apellido` → `El apellido es obligatorio.` / `El apellido no puede superar los 100 caracteres.`; `Email` → `El email es obligatorio.` / `El email no tiene un formato válido.` / `El email no puede superar los 256 caracteres.`; `Password` → `La contraseña es obligatoria.` (vacía) o `La contraseña no cumple la política de seguridad.` (rechazo del back, propuesta); `Rol` → `El rol debe ser Administrador o Empleado.` |
| 403 | `No tenés permiso para crear usuarios.` |
| Error sin `detail` | `Ocurrió un error inesperado.` |

Valores de muestra (no son texto fijo): `Hernán Sosa`, `Julieta`, `Ávila`, `julieta.avila@nexaseguros.com.ar`, `••••••••••••`.

## 9. Estados y casos borde

| Caso | Comportamiento |
|---|---|
| Formulario vacío | Ningún rol seleccionado; `Crear empleado` habilitado; el envío muestra errores de campo y no llama a la API. |
| Rol sin elegir | `El rol es obligatorio.` bajo el selector. No se envía. |
| Email inválido | Error de campo; no se envía. |
| Contraseña vacía | `La contraseña es obligatoria.`; no se envía. |
| Contraseña generada o editada por el admin | Se envía tal cual; el front no valida su política. Si el back la rechaza, llega como `detail` (fila siguiente). |
| Creando | Botón deshabilitado; un solo POST (FC11). |
| 201 | Formulario limpio; contraseña borrada del estado; `Usuario creado.`; foco en `Nombre`. |
| 400 email repetido (`detail`) | Alerta del panel con `role="alert"`; no marca el campo. |
| 400 contraseña rechazada por Identity (`detail`) | Alerta con el texto de Identity (español) tal cual. |
| 400 `errors` | Mensaje bajo el campo con el texto de §8 (nunca el texto en inglés de ASP.NET). |
| 401 | Sesión vencida: lo resuelve T-08. |
| 403 | `No tenés permiso para crear usuarios.` |
| Usuario en sesión que crea un Administrador | Permitido. |
| Doble clic | Un solo POST. |
| Reenvío tras error de red | No se reenvía (`retry: 0`). |
| Rol Empleado en la URL | `RequireRol` lo bloquea y muestra el panel "sin permiso" en la misma URL (RV-D24; B-24 test 21). |

## 10. Tests requeridos

Herramientas: Vitest, Testing Library, MSW (handlers de T-32 con `server.use`), `vitest-axe`.

`schemas/crearUsuarioSchema.test.ts`:
1. `rechaza_email_invalido`: `El email no tiene un formato válido.`.
2. `rechaza_email_de_mas_de_256`.
3. `rechaza_rol_ausente`: `El rol es obligatorio.`.
4. `rechaza_password_vacia`: `La contraseña es obligatoria.`.
5. `no_impone_politica_de_password_en_el_front`: `password: "abc"` pasa el schema (la política la valida el back, RV-D18).

`schemas/generarPassword.test.ts`:
5a. `genera_16_caracteres_con_las_cuatro_clases`: en 200 corridas, siempre 16 caracteres con mayúscula, minúscula, dígito y símbolo.
5b. `usa_crypto_getRandomValues_y_nunca_math_random`: spy sobre `crypto.getRandomValues` (llamado) y sobre `Math.random` (no llamado).
5c. `no_repite_entre_llamadas`: 100 contraseñas distintas.
5d. `no_usa_caracteres_ambiguos`: ninguna contiene `0 O 1 l I`.
6. `no_recorta_la_password`: una contraseña con espacios en los bordes se envía sin recortar.

`components/NuevoEmpleadoPanel.test.tsx`:
7. `muestra_textos_literales_del_figma`: `Nuevo empleado`, labels y `Compartila por un canal seguro.`.
8. `rol_sin_preseleccion`: ningún radio marcado.
9. `envia_body_con_los_cinco_campos`: MSW captura `email`, `password`, `rol: "Empleado"`, `nombre`, `apellido`.
10. `201_limpia_formulario_y_borra_password`: el campo contraseña queda vacío y aparece `Usuario creado.`.
11. `400_errors_muestra_texto_en_espanol_bajo_el_campo`: `errors.Email` con `Email is invalid.` (texto en inglés) muestra `El email no tiene un formato válido.`.
12. `400_detail_email_repetido_en_alerta_sin_marcar_campo`: `El email ya está registrado.` en `role="alert"`; `aria-invalid` ausente en `Email`.
13. `400_detail_identity_muestra_texto_completo`: el texto de Identity que rechaza la contraseña aparece completo en `role="alert"`.
14. `403_muestra_texto_propio`.
15. `doble_clic_envia_un_post`: contador = 1.
16. `generar_llena_el_campo_con_una_password_valida`: el campo arranca vacío; al pulsar `Generar` queda con 16 caracteres, visible, y el POST la envía tal cual.
16a. `copiar_envia_la_password_al_portapapeles`: tras `Generar`, `Copiar` llama `navigator.clipboard.writeText` con el valor del campo y muestra `Contraseña copiada.`; con el campo vacío está deshabilitado.
16b. `copiar_con_portapapeles_rechazado_muestra_aviso`: si `writeText` rechaza, aparece `No se pudo copiar. Copiala a mano.` y la contraseña sigue en el campo.
17. `mostrar_ocultar_cambia_type_y_aria_label`.
18. `cancelar_limpia_el_formulario`.
19. `password_no_se_guarda_en_storage`: spy sobre `sessionStorage.setItem` y `localStorage.setItem` no recibe la contraseña.
20. `a11y_sin_violaciones`.

`pages/UsuariosPage.test.tsx`:
21. `empleado_no_ve_el_formulario`: con sesión de Empleado, no aparece `Nuevo empleado` y se ve el panel "sin permiso" (RV-D24).
22. `boton_nuevo_empleado_enfoca_nombre`.

## 11. Criterios de aceptación

1. `/usuarios` solo es accesible para `Administrador` (test 21).
2. El panel `Nuevo empleado` muestra los campos, labels, helper y botones del Figma (test 7).
3. El rol no tiene preselección y es obligatorio (tests 3 y 8).
4. El POST envía `CrearUsuarioRequest` completo con el rol elegido (test 9).
5. Con 201, el formulario se limpia, la contraseña se borra del estado y no queda en storage (tests 10 y 19).
6. Los `errors` del back se muestran en español bajo el campo; nunca el texto en inglés (test 11).
7. El `detail` (email repetido o contraseña rechazada por Identity) se muestra en la alerta del panel, sin marcar campo (tests 12 y 13).
8. La contraseña temporal la genera el front con `crypto.getRandomValues` (16 caracteres, cuatro clases) y el front no aplica la política de Identity: la valida el back (tests 5, 5a a 5d, 6 y 16; RV-D18). Un botón `Copiar` pasa la contraseña generada al portapapeles (tests 16a y 16b; D-B24-05).
9. Un doble clic genera un solo POST (test 15).
10. `Cancelar` limpia el formulario (test 18).
11. Los tests 1 a 22 (incluidos 5a a 5d, 16a y 16b) están en verde, con `vitest-axe` sin violaciones.
12. `npm run lint`, `typecheck`, `test` y `build` están en verde en `apps/backoffice`.

## 12. Verificación manual

1. Entrar como Administrador a `/usuarios`.
2. Pulsar `Crear empleado` sin datos: verificar los mensajes de campo y que no hay request (pestaña Red).
3. Completar los campos, elegir `Empleado`, escribir una contraseña inicial y verificar con el botón de mostrar que se lee.
4. Crear el usuario: verificar `Usuario creado.` y que el formulario quedó vacío.
5. Repetir con el mismo email: verificar el mensaje `El email ya está registrado.` en la alerta.
6. Entrar como Empleado y verificar que la pantalla no aparece.
Confirmar los resultados antes de abrir el PR (regla 7 de `docs/workflow.md`).

## 13. Decisiones pendientes con default

- **D-B24-01: botón `Nuevo empleado` de la topbar (B14 §8, NO DEFINIDO).** Default: limpia el formulario y enfoca `Nombre`.
- **D-B24-02 (RV-D18): contraseña inicial. Decidido por el usuario (2026-11-06).** El front genera la contraseña temporal con el botón `Generar` (como en el Figma). Es temporal: el empleado debe cambiarla en su primer ingreso (US-F1-09 y US-FE-B-26, PB-31). Hasta que esas tareas existan, la temporal no vence. Pendiente de confirmación del equipo (seguridad).
- **D-B24-03: rol por defecto (B14 §13.8).** Default: sin preselección, obligatorio (D-20).
- **D-B24-04: texto de éxito y de estado tras crear (B14 §13.12).** Propuesta de §8.
- **D-B24-05 (RV-D18): ver y copiar la contraseña generada. Decidido por el usuario (2026-11-06).** Tras `Generar` la contraseña queda visible en el campo y hay un botón `Copiar` que la pasa al portapapeles, para que el administrador se la entregue al empleado por un canal seguro. Riesgo aceptado: la contraseña pasa por el portapapeles del sistema, fuera del control de la app; la temporal se cambia en el primer ingreso (US-FE-B-26).
- **D-B24-06: panel fijo o modal (B14 §13.11).** Default: panel fijo, como en el Figma.
- **D-B24-07 (RV-D24): acceso denegado.** Default: panel "sin permiso" en la misma URL (default de T-13).

## 14. Riesgos y errores comunes

- **Contraseña en storage.** No usar `sessionStorage` ni `localStorage` para el borrador (FC12). El formulario vive en memoria.
- **Contraseña en la caché.** La mutación no debe dejar la respuesta ni el body en TanStack Query.
- **Texto en inglés.** Los `errors` vienen en inglés cuando el DTO no tiene `ErrorMessage` (PB-15). Mapear por clave, nunca mostrar el texto del back.
- **Campo marcado por `detail`.** Si el email repetido se marca como error de campo, se confunde con un error de formato. Mostrar en la alerta (FC10).
- **Rol Administrador por error.** El chip `Administrador` queda en el mismo radiogroup que `Empleado`. Que el usuario elija el rol a propósito: no hay default.
- **Generador débil o sesgado.** Nada de `Math.random`; selección sin sesgo de módulo. Si la política del back sube (por ejemplo, US-F1-09 pide 12 caracteres), 16 con cuatro clases sigue cumpliendo.
- **Política duplicada en el front.** El front no valida la política al enviar: solo el generador la cumple por construcción. El back es la autoridad.
- **Temporal sin vencimiento.** Mientras no exista el cambio obligatorio (US-F1-09 y US-FE-B-26), la contraseña temporal sigue valiendo. Avisarlo en el PR.

## 15. Definición de terminado

- `npm run lint`, `typecheck`, `test` y `build` en verde.
- Accesibilidad revisada con T-19 (labels visibles, `aria-describedby`, `radiogroup` con nombre, botón de mostrar y ocultar con nombre).
- Sin secretos ni contraseñas en el código ni en los tests (los tests usan contraseñas de prueba ficticias).
- Criterios 1 a 12 de §11 tildados con evidencia observada.

## 16. Observaciones al índice

- Corregido al implementar: la ficha pedía `RequireRol` en `routes.tsx`, pero la regla de límites de ESLint prohíbe que un feature importe el app-shell. La guarda se hizo en `UsuariosPage` con `useRol`. Si el equipo prefiere `RequireRol`, hay que envolver la ruta en `app/router.tsx` (archivo de T-14).
- El botón `Nuevo empleado` vive en la página (columna izquierda), no en la topbar: `Topbar` es del layout y no admite acciones por ruta.
- Resuelto (RV-D18, decidido por el usuario el 2026-11-06): el front genera la contraseña temporal (`Generar`, como en el Figma) y el empleado la cambia en el primer ingreso (US-F1-09 y US-FE-B-26, PB-31). Pendiente de confirmación del equipo (seguridad, ver §13). D-B24-05 decidida: botón `Copiar` (usuario, 2026-11-06).
