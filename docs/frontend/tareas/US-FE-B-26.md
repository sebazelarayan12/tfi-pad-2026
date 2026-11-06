# US-FE-B-26: Cambio obligatorio de contraseña en el primer ingreso

Tipo B · Oleada 4 · Tamaño M · Rama sugerida `feature/US-FE-B-26-cambio-password-obligatorio` · Tarjeta Trello `US-FE-B-26`

## 1. Objetivo

Al terminar, un empleado o administrador cuya cuenta fue creada con una contraseña temporal (B-24) no puede usar el backoffice hasta cambiarla. Después del login, si la sesión trae `debeCambiarPassword`, la guarda lo manda a `/cambiar-password`. Esa pantalla pide la contraseña temporal, la nueva y su repetición, muestra a la vista los requisitos de una contraseña fuerte y llama a `POST /api/auth/cambiar-password`. Con 200 reemplaza la sesión por la que devuelve el back y entra a `/inicio`. Origen: decisión del usuario del 2026-11-06 (RV-D18, opción B con cambio obligatorio) y pedido al back PB-31. Usuario: Empleado y Administrador con la bandera activa.

## 2. Alcance

**Entra**
- Ruta `/cambiar-password` y página `CambiarPasswordPage` en `features/auth` (comparte `LayoutAcceso` con el login).
- Formulario con `react-hook-form` y zod: contraseña temporal, contraseña nueva y repetir contraseña nueva.
- Lista de requisitos de contraseña fuerte, visible desde el inicio y marcada en vivo (D-B26-02).
- Función `cambiarPassword(cliente, body)` en `@nexa/api` y su handler MSW (excepción de ownership, INDEX).
- Campo `debeCambiarPassword` en `LoginResponse`, en `Sesion` y en `iniciarSesion` (excepción de ownership).
- Redirección de `LoginPage` y guarda de `RequireSesion`: con la bandera activa, toda ruta protegida va a `/cambiar-password`.
- Manejo defensivo del 403 `PASSWORD_CAMBIO_REQUERIDO` en cualquier request: lleva a `/cambiar-password` sin cerrar la sesión.
- Acción `Cerrar sesión` en la pantalla (la persona puede salir sin cambiar).

**NO entra**
- Cambio voluntario de contraseña desde el menú de usuario ("Mi cuenta"): no existe en el Figma ni en el alcance (D-B26-06).
- Recuperación de contraseña olvidada: fuera de alcance.
- Vencimiento periódico de contraseñas: fuera de alcance.
- Generar contraseñas en esta pantalla: la generación es de B-24. Aquí la persona elige su propia contraseña.
- Implementar el endpoint, la bandera del usuario o la política en el back: US-F1-09 (PB-31).
- Medidor de fortaleza con librería externa (zxcvbn): no se agrega dependencia (FC17).

## 3. Dependencias

- **Oleada (INDEX):** 4.
- **Puede empezar sin esperar a:** `US-F1-09` (back) y `US-FE-B-24`. Trabaja contra MSW (`VITE_USE_MOCKS=true`).
- **Depende de:** `US-FE-T-04`, `US-FE-T-05`, `US-FE-T-10`, `US-FE-T-11`, `US-FE-T-13`, `US-FE-T-19`, `US-FE-T-32`, `US-FE-B-01`.
- **Pedidos al back (INDEX):** PB-31 (degrada).
- **Degradaciones:** PB-31 (endpoint y bandera inexistentes en el back real): el front trabaja con MSW y el handler replica el contrato propuesto. Con el back real actual, `LoginResponse` no trae `debeCambiarPassword`: el campo se lee como ausente (`false`) y el flujo no se dispara. La pantalla no rompe nada.
- **Workaround MSW (FB7.7):** handler de `POST /api/auth/cambiar-password` y usuario de prueba cuyo login devuelve `debeCambiarPassword: true`. Un filtro o comportamiento que el back real ignora no se activa con el flag (FB8).

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB3 (reglas 1 a 4), FB7.5 (sesión: nada en `localStorage`), FB7.6 (mensajes), FB8 (RV-D18 y RV-D24).
- `docs/frontend/tareas/INDEX.md`: FC10 (errores), FC11 (mutaciones sensibles: `retry: 0`, `networkMode: 'always'`), FC12 (almacenamiento), FC17 (sin tocar `package.json`), FC18 (`ApiClient` primer parámetro), Ownership (excepciones de B-26).
- `docs/frontend/pantallas/B1-login.md`: §3 (layout de acceso), §4 (componentes `Input`, `Button`, `CampoContrasena`), §5 (textos), §7 (estados) y §12 (accesibilidad).
- `docs/frontend/pantallas/B14-usuarios.md`: §13 punto 7 (decisión del botón `Generar`).
- `docs/frontend/pedidos-al-back.md`: PB-31 (contrato propuesto), PB-14 (400 sin código).
- `docs/frontend/contratos-api/seguridad-clientes-publico.md`: §2.1 a §2.4 (`LoginRequest`, `LoginResponse`, claims del JWT).
- `docs/frontend/contratos-api/convenciones-transversales.md`: §3.4 (`ProblemDetails`).
- `docs/frontend/design-system.md`: §5.1 (Button), §5.2 (Input, helper y error), §8.2 (error de campo), §8.3 (foco).

## 5. Archivos a crear o modificar

Frontend bajo `frontend/`. Dueño de los archivos nuevos: US-FE-B-26. Los marcados "excepción" son de otra tarea y solo se tocan en lo indicado (INDEX, Ownership).

| Archivo | Acción | Nota |
|---|---|---|
| `packages/api/src/auth/cambiarPassword.ts` | crear (excepción T-32) | `cambiarPassword(cliente, body): Promise<LoginResponse>` sobre `POST /api/auth/cambiar-password`. |
| `packages/api/src/dto/auth.ts` | modificar (excepción T-12) | `LoginResponse.debeCambiarPassword?: boolean` y `CambiarPasswordRequest`. |
| `packages/api/src/index.ts` | modificar | Exporta la función y el tipo nuevo. |
| `packages/api/mocks/handlers/auth.ts` | modificar (excepción T-11) | Login de un usuario de prueba con `debeCambiarPassword: true`; handler de `POST /api/auth/cambiar-password` con las reglas de PB-31. |
| `apps/backoffice/src/features/auth/types/sesion.ts` | modificar (excepción B-01) | `Sesion.debeCambiarPassword: boolean`. |
| `apps/backoffice/src/features/auth/sesion/store.ts` | modificar (excepción T-13) | `iniciarSesion(respuesta, ahoraMs)` guarda la bandera (en memoria, FC12). Reemplazar la sesión al cambiar la contraseña. |
| `apps/backoffice/src/features/auth/pages/LoginPage.tsx` | modificar (excepción B-01) | Con bandera activa, navega a `/cambiar-password` en vez de `/inicio`. |
| `apps/backoffice/src/app/guards/RequireSesion.tsx` | modificar (excepción T-13) | Con bandera activa y ruta distinta de `/cambiar-password`, redirige allí. |
| `apps/backoffice/src/features/auth/pages/CambiarPasswordPage.tsx` | crear | Pantalla y formulario. |
| `apps/backoffice/src/features/auth/components/RequisitosPassword.tsx` | crear | Lista de requisitos con estado en vivo. |
| `apps/backoffice/src/features/auth/schemas/cambiarPasswordSchema.ts` | crear | zod con los requisitos y la repetición. |
| `apps/backoffice/src/features/auth/api/useCambiarPassword.ts` | crear | `useMutation`, `retry: 0`, `networkMode: 'always'`. |
| `apps/backoffice/src/features/auth/routes.tsx` | modificar (excepción B-01) | Agrega `/cambiar-password` (ruta con sesión, sin `RequireRol`). |
| Tests (§10) | crear | |

No se edita ningún `package.json` (FC17).

## 6. Pasos de implementación

1. Confirmar en `@nexa/api` (T-12 y T-32): `LoginResponse`, `loginRequest`, `useApiClient`. Agregar `debeCambiarPassword` y `cambiarPassword` solo en lo que indica §5.
2. Escribir los tests de §10 antes de implementar.
3. Crear `schemas/cambiarPasswordSchema.ts`:
   ```ts
   import { z } from 'zod';
   export const REQUISITOS_PASSWORD = {
     longitudMinima: 12,
   } as const;
   export const cambiarPasswordSchema = z
     .object({
       passwordActual: z.string().min(1, 'Ingresá la contraseña temporal.'),
       passwordNueva: z
         .string()
         .min(12, 'Usá al menos 12 caracteres.')
         .regex(/[A-Z]/, 'Agregá una mayúscula.')
         .regex(/[a-z]/, 'Agregá una minúscula.')
         .regex(/\d/, 'Agregá un número.')
         .regex(/[^A-Za-z0-9]/, 'Agregá un símbolo.'),
       repetir: z.string().min(1, 'Repetí la contraseña nueva.'),
     })
     .refine((v) => v.passwordNueva === v.repetir, { path: ['repetir'], message: 'Las contraseñas no coinciden.' })
     .refine((v) => v.passwordNueva !== v.passwordActual, { path: ['passwordNueva'], message: 'La contraseña nueva debe ser distinta de la temporal.' });
   ```
   - Ninguna contraseña se recorta (los espacios cuentan).
   - El front valida la política para dar feedback inmediato. El back sigue siendo la autoridad: si la rechaza, el mensaje llega como `detail` (D-B26-02).
4. Crear `components/RequisitosPassword.tsx`: lista con los cinco requisitos (`Al menos 12 caracteres`, `Una mayúscula`, `Una minúscula`, `Un número`, `Un símbolo`). Cada ítem indica cumplido o pendiente con texto accesible (`Cumplido` / `Pendiente`), no solo con color. Contenedor `aria-live="polite"` que no repite el anuncio por cada tecla (se anuncia el requisito que cambia de estado).
5. Crear `api/useCambiarPassword.ts`: `useMutation({ mutationFn: (body) => cambiarPassword(cliente, body), retry: 0, networkMode: 'always' })`. La respuesta no queda en la caché de TanStack Query ni en `localStorage` (FC12).
6. Crear `CambiarPasswordPage` sobre `LayoutAcceso`:
   - Título `Cambiá tu contraseña`; texto de apoyo `Es tu primer ingreso. Elegí una contraseña nueva para seguir.`.
   - `CampoContrasena` (de B-01) para `Contraseña temporal`, `Contraseña nueva` y `Repetir contraseña nueva`, con botón de mostrar u ocultar cada uno.
   - `RequisitosPassword` bajo `Contraseña nueva`, enlazado con `aria-describedby`.
   - Botón primario `Cambiar contraseña` (deshabilitado mientras corre, FC11) y acción secundaria `Cerrar sesión`.
   - Foco inicial en `Contraseña temporal`.
7. Lógica de la mutación:
   - 200: `iniciarSesion(respuesta, ahoraMs)` reemplaza la sesión (token nuevo, sin la bandera), limpia el formulario y navega a `/inicio` con `replace`.
   - 400 con `detail` (contraseña actual incorrecta, política rechazada por el back): alerta del formulario con `role="alert"`, sin marcar campo (FC10). La contraseña actual incorrecta llega como 400 y no como 401 (PB-31), así que no dispara el cierre de sesión de T-08.
   - 400 con `errors`: mapear cada clave a un texto propio de §8; nunca el texto en inglés del back.
   - 401: lo resuelve T-08 (sesión vencida).
   - 403: texto de §8.
   - Error de red: `No pudimos cambiar la contraseña. Revisá tu conexión e intentá de nuevo.`; no se reenvía solo (`retry: 0`).
8. Extender `Sesion`, `iniciarSesion` y `LoginPage` con `debeCambiarPassword`: solo en memoria. Con `false` o ausente, el flujo actual no cambia (test de no regresión del login).
9. `RequireSesion`: si `sesion.debeCambiarPassword` y la ruta actual no es `/cambiar-password`, redirige a `/cambiar-password`. En `/cambiar-password` sin bandera, redirige a `/inicio` (no hay nada que cambiar).
10. Manejo del 403 `PASSWORD_CAMBIO_REQUERIDO`: el interceptor de errores de T-08 lo trata como "marcar la sesión con la bandera y llevar a `/cambiar-password`", sin cerrarla. Si T-08 no expone ese gancho, se registra en la sección 16 y se trata en la tarea dueña.
11. Handler MSW (PB-31): `POST /api/auth/cambiar-password` valida la política (12 caracteres, mayúscula, minúscula, número y símbolo), compara `passwordActual` con la del usuario de prueba (400 `detail` `La contraseña actual es incorrecta.` si no coincide) y responde 200 con un `LoginResponse` sin la bandera. Usuario de prueba con login que devuelve `debeCambiarPassword: true`.
12. No guardar ninguna de las tres contraseñas en `sessionStorage`, `localStorage`, la URL ni la caché (FC12).

## 7. Contrato con el back

| Método y ruta | Estado | Auth | Request | Respuesta | Errores que maneja la UI |
|---|---|---|---|---|---|
| `POST /api/auth/login` | Implementado (`AuthController.cs:21`) | Anónimo | `LoginRequest` | 200 `LoginResponse` (+ `debeCambiarPassword`, PB-31) | 401 credenciales; 400 `errors` |
| `POST /api/auth/cambiar-password` | NO (PB-31, US-F1-09) | Empleado o Administrador (token con la bandera) | `CambiarPasswordRequest` | 200 `LoginResponse` nuevo (token sin la bandera) | 400 `detail` (actual incorrecta, política); 400 `errors`; 401; 403; 500 |
| Cualquier endpoint protegido con la bandera activa | NO (PB-31) | Empleado o Administrador | — | 403 `PASSWORD_CAMBIO_REQUERIDO` | La UI lleva a `/cambiar-password` |

Tipos propuestos (PB-31):

```ts
export interface LoginResponse {
  token: string;
  rol: RolUsuario;
  expiraEn: string;
  debeCambiarPassword?: boolean; // PB-31: ausente = false
}

export interface CambiarPasswordRequest {
  passwordActual: string; // obligatorio
  passwordNueva: string;  // obligatorio; política fuerte validada por el back
}
```

Claves de `errors` (PascalCase, propuesta): `PasswordActual`, `PasswordNueva`. El 403 trae `code: 'PASSWORD_CAMBIO_REQUERIDO'` en `ProblemDetails`.

## 8. Contenido de UI

Sin frame en Figma (D-B26-01). Textos propuestos; la pantalla reutiliza el layout, el campo de contraseña y los botones del login (B1).

| Elemento | Texto propuesto |
|---|---|
| Título | `Cambiá tu contraseña` |
| Apoyo | `Es tu primer ingreso. Elegí una contraseña nueva para seguir.` |
| Label 1 | `Contraseña temporal` |
| Label 2 | `Contraseña nueva` |
| Label 3 | `Repetir contraseña nueva` |
| Requisitos | `Al menos 12 caracteres` · `Una mayúscula` · `Una minúscula` · `Un número` · `Un símbolo` |
| Estado de requisito | `Cumplido` / `Pendiente` (texto accesible) |
| Botón principal | `Cambiar contraseña` |
| Botón secundario | `Cerrar sesión` |
| Mostrar contraseña | `Mostrar contraseña` / `Ocultar contraseña` (aria-label) |
| Enviando | `Cambiando contraseña…` |
| Error `passwordActual` vacía | `Ingresá la contraseña temporal.` |
| Error política | `Usá al menos 12 caracteres.` · `Agregá una mayúscula.` · `Agregá una minúscula.` · `Agregá un número.` · `Agregá un símbolo.` |
| Error repetición | `Las contraseñas no coinciden.` |
| Error igual a la temporal | `La contraseña nueva debe ser distinta de la temporal.` |
| 403 | `No tenés permiso para cambiar la contraseña.` |
| Red | `No pudimos cambiar la contraseña. Revisá tu conexión e intentá de nuevo.` |
| Error sin `detail` | `Ocurrió un error inesperado.` |

## 9. Estados y casos borde

| Caso | Comportamiento |
|---|---|
| Login con `debeCambiarPassword: true` | `LoginPage` navega a `/cambiar-password`; ninguna otra ruta protegida es accesible. |
| Login con la bandera `false` o ausente | Flujo actual a `/inicio` (no regresión). |
| Ruta protegida con bandera activa | `RequireSesion` redirige a `/cambiar-password`. |
| `/cambiar-password` sin sesión | Redirige a `/login` (T-13). |
| `/cambiar-password` con sesión sin bandera | Redirige a `/inicio`. |
| Formulario vacío | Errores de campo; no llama a la API. |
| Nueva no cumple un requisito | Requisito `Pendiente` y mensaje de campo al enviar; no se envía. |
| Repetición distinta | `Las contraseñas no coinciden.` bajo `Repetir contraseña nueva`. |
| Nueva igual a la temporal | `La contraseña nueva debe ser distinta de la temporal.` |
| Enviando | Botón deshabilitado, un solo POST (FC11). |
| 200 | Sesión reemplazada, formulario limpio, navega a `/inicio` con `replace`. |
| 400 contraseña actual incorrecta (`detail`) | Alerta con `role="alert"`; no cierra sesión; foco en `Contraseña temporal`. |
| 400 política rechazada por el back (`detail`) | Alerta con el texto del back tal cual. |
| 401 | Sesión vencida: lo resuelve T-08. |
| 403 `PASSWORD_CAMBIO_REQUERIDO` en otra pantalla | Lleva a `/cambiar-password` sin cerrar la sesión. |
| Error de red | Mensaje de §8; no se reenvía solo. |
| `Cerrar sesión` | Borra la sesión y va a `/login`. |
| Botón Atrás tras cambiar | No vuelve a `/cambiar-password` (navegación con `replace`). |
| Recarga de la página | La sesión vive en memoria (FC12): vuelve a `/login`. |

## 10. Tests requeridos

Herramientas: Vitest, Testing Library, MSW (handlers de §6 con `server.use`), `vitest-axe`.

`schemas/cambiarPasswordSchema.test.ts`:
1. `rechaza_menos_de_12_caracteres`.
2. `rechaza_sin_mayuscula`, `rechaza_sin_minuscula`, `rechaza_sin_numero` y `rechaza_sin_simbolo` (un caso por regla).
3. `acepta_una_password_fuerte`.
4. `rechaza_repeticion_distinta`.
5. `rechaza_nueva_igual_a_la_temporal`.
6. `no_recorta_las_passwords`: espacios en los bordes cuentan.

`components/RequisitosPassword.test.tsx`:
7. `marca_cada_requisito_en_vivo`: al escribir una contraseña, cada ítem pasa de `Pendiente` a `Cumplido`.
8. `el_estado_no_depende_solo_del_color`: el texto accesible está presente.

`pages/CambiarPasswordPage.test.tsx`:
9. `muestra_textos_y_foco_inicial`: título, labels, requisitos y foco en `Contraseña temporal`.
10. `envia_el_body_con_actual_y_nueva`: MSW captura `passwordActual` y `passwordNueva` (sin `repetir`).
11. `200_reemplaza_la_sesion_y_navega_a_inicio`: la sesión nueva no tiene bandera y la navegación es con `replace`.
12. `400_actual_incorrecta_muestra_alerta_y_no_cierra_sesion`.
13. `400_politica_rechazada_muestra_el_texto_del_back`.
14. `400_errors_muestra_texto_en_espanol`: nunca el texto en inglés.
15. `403_muestra_texto_propio`.
16. `error_de_red_muestra_mensaje_y_no_reenvia`: contador = 1 (`retry: 0`).
17. `doble_clic_envia_un_post`.
18. `mostrar_ocultar_cambia_type_y_aria_label`.
19. `cerrar_sesion_va_a_login`.
20. `las_passwords_no_se_guardan_en_storage`: spies de `sessionStorage` y `localStorage`.
21. `a11y_sin_violaciones`.

`app/guards/RequireSesion.test.tsx` y `features/auth/pages/LoginPage.test.tsx`:
22. `con_bandera_redirige_a_cambiar_password`: cualquier ruta protegida.
23. `en_cambiar_password_sin_bandera_redirige_a_inicio`.
24. `login_con_bandera_navega_a_cambiar_password`.
25. `login_sin_bandera_sigue_yendo_a_inicio`: no regresión del flujo actual.
26. `403_password_cambio_requerido_lleva_a_cambiar_password_sin_cerrar_sesion` (si T-08 expone el gancho, ver §6 paso 10).

## 11. Criterios de aceptación

1. Con `debeCambiarPassword: true`, el login lleva a `/cambiar-password` y ninguna otra ruta protegida es accesible (tests 22 y 24).
2. Sin la bandera (o ausente), el login y la navegación no cambian (tests 23 y 25).
3. La pantalla pide temporal, nueva y repetición, y muestra los cinco requisitos con estado en vivo y accesible (tests 7, 8 y 9).
4. La nueva debe cumplir la política fuerte, coincidir con la repetición y ser distinta de la temporal (tests 1 a 6).
5. El POST envía solo `passwordActual` y `passwordNueva` (test 10).
6. Con 200, la sesión se reemplaza por la nueva sin bandera y se navega a `/inicio` con `replace` (test 11).
7. La contraseña actual incorrecta (400) se muestra en la alerta sin cerrar la sesión (test 12).
8. Los `errors` se muestran en español bajo el campo y el `detail`, en la alerta (tests 13 y 14).
9. Un doble clic genera un solo POST y no hay reintentos automáticos (tests 16 y 17).
10. Ninguna contraseña queda en storage, URL ni caché (test 20).
11. `Cerrar sesión` está disponible en la pantalla (test 19).
12. El 403 `PASSWORD_CAMBIO_REQUERIDO` lleva a la pantalla sin cerrar la sesión (test 26).
13. Los tests 1 a 26 están en verde, con `vitest-axe` sin violaciones.
14. `npm run lint`, `typecheck`, `test` y `build` están en verde; React Doctor 100/100 (regla 10 de `docs/workflow.md`).

## 12. Verificación manual

Con `VITE_USE_MOCKS=true`:

1. Entrar con el usuario de prueba con cambio pendiente: verificar que se llega a `/cambiar-password`.
2. Intentar ir a `/inicio` escribiendo la URL: verificar que vuelve a `/cambiar-password`.
3. Escribir una nueva de 8 caracteres: verificar los requisitos `Pendiente` y el error al enviar.
4. Escribir una repetición distinta: verificar `Las contraseñas no coinciden.`.
5. Escribir una temporal incorrecta con una nueva válida: verificar la alerta y que la sesión sigue abierta.
6. Completar bien el formulario: verificar que se entra a `/inicio` y que el botón Atrás no vuelve a la pantalla.
7. Cerrar sesión, volver a entrar con la contraseña nueva: verificar que ya no pide el cambio.
8. Con el back real (cuando exista US-F1-09), repetir 1 a 7 y verificar el 403 `PASSWORD_CAMBIO_REQUERIDO` con un token viejo.
Confirmar los resultados antes de abrir el PR (regla 7 de `docs/workflow.md`).

## 13. Decisiones pendientes con default

Todas son `[CONFIRMAR]`: el usuario decide antes de implementar cada parte afectada (regla 12 de `docs/workflow.md`). Los defaults son propuestas, no decisiones tomadas.

- [CONFIRMAR] **D-B26-01: diseño de la pantalla (sin frame en Figma).** Default: reutilizar el layout, los campos y los botones del login (B1), con los textos de §8. Alternativa: pedir el frame al diseño antes de implementar.
- [CONFIRMAR] **D-B26-02: dónde se valida la política de contraseña.** Default: el front valida los cinco requisitos para dar feedback inmediato y el back es la autoridad. Riesgo: si el back cambia la política, el front queda desfasado y el mensaje del back llega como `detail`. Alternativa: solo el back valida.
- [CONFIRMAR] **D-B26-03: política mínima (seguridad).** Default: 12 caracteres con mayúscula, minúscula, número y símbolo (PB-31). Debe coincidir con US-F1-09. Confirmación del equipo pendiente.
- [CONFIRMAR] **D-B26-04: botón `Cerrar sesión` en la pantalla.** Default: sí, para que la persona pueda salir sin cambiar. Alternativa: sin salida hasta que cambie.
- [CONFIRMAR] **D-B26-05: la nueva no puede ser igual a la temporal.** Default: se rechaza en el front (y el back en US-F1-09).
- [CONFIRMAR] **D-B26-06: cambio voluntario de contraseña ("Mi cuenta").** Default: fuera de alcance. Alternativa: tarjeta nueva con una pantalla propia que reutilice esta.
- [CONFIRMAR] **D-B26-07: qué hace el 403 `PASSWORD_CAMBIO_REQUERIDO` en el resto de la app.** Default: lleva a `/cambiar-password` sin cerrar la sesión. Depende de que T-08 exponga el gancho.

## 14. Riesgos y errores comunes

- **Barrera solo de UI.** Si el back no rechaza los tokens con la bandera (US-F1-09, PB-31), cualquiera con el token usa la API sin cambiar la contraseña. Dejar dicho en el PR que el front es una guarda de experiencia y la seguridad la pone el back.
- **Bandera persistida.** `debeCambiarPassword` vive en memoria con la sesión (FC12). No guardarla en storage ni en la URL.
- **401 por contraseña incorrecta.** Si el back responde 401 por la actual incorrecta, T-08 cierra la sesión global. PB-31 pide 400; si el back real difiere, avisar.
- **Bucle de redirecciones.** `RequireSesion` no debe redirigir si la ruta actual ya es `/cambiar-password`, ni `/cambiar-password` redirigir a sí misma.
- **Política duplicada.** Las reglas del front y del back pueden divergir. Mantener la constante en un solo lugar y registrar el desfase en PB-31.
- **Contraseñas en la caché o el log.** La mutación no guarda body ni respuesta en TanStack Query; no hacer `console.log` de los valores.
- **Anuncio excesivo del lector de pantalla.** `aria-live` en la lista de requisitos se anuncia solo cuando un requisito cambia de estado, no en cada tecla.
- **Atrás tras el cambio.** Navegar con `replace` para no volver a una pantalla que ya no aplica.
- **Foco.** En error, el foco vuelve al primer campo inválido o a la alerta (T-19).

## 15. Definición de terminado

- `npm run lint`, `typecheck`, `test` y `build` en verde y React Doctor en 100/100.
- Accesibilidad revisada con T-19 (labels visibles, `aria-describedby` de los requisitos, botones de mostrar u ocultar con nombre, alerta con `role="alert"`).
- Sin secretos ni contraseñas reales en el código ni en los tests (contraseñas de prueba ficticias).
- Handler MSW y brecha registrados en PB-31; el PR aclara que el back real no impone el cambio hasta US-F1-09.
- Criterios 1 a 14 de §11 tildados con evidencia observada.

## 16. Observaciones al índice

- Tarea nueva (2026-11-06), nacida de la decisión del usuario sobre RV-D18: el administrador genera una contraseña temporal en B-24 y el empleado la cambia en su primer ingreso.
- Depende del back `US-F1-09` (PB-31) para ser efectiva de punta a punta. Hasta entonces el front funciona con MSW y no rompe con el back actual.
- Excepciones de ownership declaradas en el INDEX: `cambiarPassword.ts`, `debeCambiarPassword` en `dto/auth.ts`, handler en `mocks/handlers/auth.ts`, `Sesion`/`iniciarSesion`/`LoginPage` y `RequireSesion`.
- Pendiente: confirmar con T-08 si expone un gancho para el 403 `PASSWORD_CAMBIO_REQUERIDO` (D-B26-07). Si no, se agrega en la tarea dueña.
- Pendiente de confirmación del equipo (seguridad): política de contraseña y obligatoriedad del cambio.
