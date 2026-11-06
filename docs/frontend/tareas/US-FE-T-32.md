# US-FE-T-32: API usuarios

Tipo T · Oleada 2 · Tamaño S · Rama sugerida `feature/US-FE-T-32-api-usuarios` · Tarjeta Trello `US-FE-T-32`.

## 1. Objetivo

Dejar tipado, con función de request y handler MSW, el alta de empleados y administradores (`POST /api/auth/usuarios`, implementado y solo para Administrador), y los mocks del ABM de usuarios que no existe en el back: listado, edición, activación y el endpoint de "yo" (PB-04). Consumidores: B-24 (alta) y B-25 (listado, edición y activación, detrás de PB-04). B-02 consume el "yo" con degradación a email.

## 2. Alcance

**Entra**
- `dto/usuarios.ts` (dueño T-32): `CrearUsuarioRequest`, `UsuarioResponse`, y los mock de PB-04.
- `packages/api/src/auth/login.ts`: `loginRequest` (RV-D04). T-12 queda solo con los tipos `LoginRequest` y `LoginResponse`.
- `endpoints/usuarios.ts`: `crearUsuario` (real) y los mock `listarUsuariosMock`, `actualizarUsuarioMock`, `cambiarActivoUsuarioMock`, `obtenerYoMock`.
- Claves: `usuariosKeys.lista(filtro)`, `usuariosKeys.yo()` (mock para B-02).
- MSW en `mocks/handlers/usuarios.ts`.

**NO entra**
- Hooks: B-24 y B-25 (en `features/usuarios/api/`), y B-02 para el "yo" (en `features/inicio/api/`) (FC2).
- Login y sesión: T-12 y T-13 (`POST /api/auth/login`).
- Validación de la política de contraseña: la hace el back; la UI muestra lo que devuelva (D-21).
- Rol inicial preseleccionado: no se preselecciona (D-20).

## 3. Dependencias

- **Depende de:** US-FE-T-08, US-FE-T-11, US-FE-T-12.
- **Oleada:** 2.
- **Puede empezar sin esperar a:** US-FE-B-25.
- **Bloqueada por pedidos al back (PB-NN):** PB-04 (MSW). El "yo" degrada a email del claim en B-02.
- **Workaround MSW:** los cuatro mocks solo existen en el handler.

## 4. Documentos a leer

- `contratos-api/seguridad-clientes-publico.md` §2.1 (modelo de sesión), §2.2 (roles), §2.3 (políticas), §2.4 (qué puede hacer cada rol), §2.5 (crear usuario: request, validaciones, errores y notas), §4.1 (email y largo), §5 (CU03, RN17), §8 dudas D3, D5 (usuarios solo tiene POST), D21.
- `contratos-api/convenciones-transversales.md` §2.1 (endpoints de auth), §2.3 (roles y políticas).
- `pedidos-al-back.md` PB-04 (contrato mínimo propuesto: `GET /api/auth/yo`, `GET/PUT/PATCH` de usuarios), PB-15.
- `pantallas/B14-usuarios.md` (alta: nombre, apellido, email, contraseña temporal, rol sin preselección; D-20, D-21; listado mock de PB-04).
- `pantallas/B2-inicio.md` (saludo y `GET /api/auth/yo`, degradación a email).
- `00-decisiones-base.md` FB4, FB7.5 (sesión), FB7.9, FB7.10 (usuarios solo Admin).
- `tareas/INDEX.md` FC2, FC3, FC5, FC10, FC11; decisiones D-20, D-21.
- Back: `backend/Aseguradora.Api/Controllers/AuthController.cs` (`[HttpPost("login")]` anónimo; `[HttpPost("usuarios")]` con `[Authorize(Policy = Politicas.Admin)]`). No hay `UsuariosController` en `development`. DTO: `Application/Security/DTOs/CrearUsuarioRequest.cs` y `UsuarioResponse.cs` (cita del contrato; no está en `Application/Dtos`).

## 5. Archivos a crear o modificar

| Archivo | Acción |
|---|---|
| `packages/api/src/dto/usuarios.ts` | nuevo (dueño T-32) |
| `packages/api/src/endpoints/usuarios.ts` | nuevo |
| `packages/api/mocks/handlers/usuarios.ts` | nuevo (dueño T-32) |
| `packages/api/src/auth/login.ts` | nuevo (dueño T-32, RV-D04) |
| `packages/api/test/contract/usuarios.contract.test.ts` | nuevo (RV-D31) |
| `packages/api/src/index.ts` | bloque de export (dueño T-12) |

No se edita ningún `package.json` ni `apps/*`.

## 6. Pasos de implementación

1. Confirmar con T-12 `RolUsuario` (`'Administrador' | 'Empleado'`) y `PaginaResponse`. Usar esos nombres.
2. Escribir `dto/usuarios.ts` con `CrearUsuarioRequest`, `UsuarioResponse` y los mock de §7.
3. Escribir `crearUsuario` (real) y las cuatro funciones mock. Las mock se marcan MOCK en el nombre o en un comentario. Escribir `loginRequest` en `packages/api/src/auth/login.ts` (RV-D04).
4. Exportar `usuariosKeys`.
5. Escribir handlers con éxito por defecto y variantes con nombre (§7).
6. Escribir los tests de §10 y el bloque de export.
7. Correr `lint`, `typecheck`, `test`.

## 7. Contrato con el back

Política del alta: `Politicas.Admin` (rol Administrador). Empleado recibe **403**. Sin token: **401**. Un 401 aquí significa token ausente o vencido (cierre de sesión), no credenciales.

```ts
// dto/usuarios.ts
import type { RolUsuario } from './auth';          // T-12
import type { PaginaResponse } from './comunes';   // T-12

export interface CrearUsuarioRequest {
  email: string;             // obligatorio, formato email, máx. 256
  password: string;          // obligatorio. Sin largo mínimo en el DTO; lo fija Identity (D-21)
  rol: RolUsuario;           // obligatorio. Exacto: 'Administrador' o 'Empleado'
  nombre: string;            // obligatorio, máx. 100
  apellido: string;          // obligatorio, máx. 100
}

export interface UsuarioResponse {
  id: string;                // Identity id (string)
  email: string;
  rol: RolUsuario;
}
```

### 7.1 `POST /api/auth/usuarios` (crear)

- **Estado:** Implementado. **Auth:** `Admin`. **Request:** `CrearUsuarioRequest`. **Response:** 201 con `UsuarioResponse`. Sin `Location` legible (PB-17). No incluye contraseña.
- **Función:** `crearUsuario(body: CrearUsuarioRequest): Promise<UsuarioResponse>`.
- **Clave al éxito:** `usuariosKeys.lista({})` (invalida el listado; mock).
- **Hook (lo escribe B-24):** `useCrearUsuario()`, `useMutation`, `retry: 0` (FB7.9). El botón se deshabilita mientras corre. **Nunca se dispara al montar.**
- **MSW:** `http.post('*/api/auth/usuarios')`. Éxito: 201 con `UsuarioResponse` (`rol` según el body). Variantes en §7.1.1.

#### 7.1.1 Errores de `POST /api/auth/usuarios`

| Status | Forma | Cuándo | Texto del back |
|---|---|---|---|
| 400 | `ValidationProblemDetails` | campo faltante o formato inválido | claves `errors.Email`, `errors.Password`, `errors.Rol`, `errors.Nombre`, `errors.Apellido` (PascalCase, no verificadas en runtime) con estos textos: `"El email es obligatorio."`, `"El email no tiene un formato válido."`, `"El email no puede superar los 256 caracteres."`, `"La contraseña es obligatoria."`, `"El rol es obligatorio."`, `"El rol debe ser Administrador o Empleado."`, `"El nombre es obligatorio."`, `"El nombre no puede superar los 100 caracteres."`, `"El apellido es obligatorio."`, `"El apellido no puede superar los 100 caracteres."` |
| 400 | `ProblemDetails` | email ya registrado | `"El email ya está registrado."` |
| 400 | `ProblemDetails` | contraseña que no cumple Identity | textos de `IdentityErrorDescriberEspanol.cs` unidos por espacio, en un solo `detail` (no es lista) |
| 401 | sin cuerpo | token ausente o vencido | (no usar texto del back) |
| 403 | sin cuerpo | token de Empleado | (no usar texto del back) |
| 500 | `ProblemDetails` | error no previsto | `"Ocurrió un error inesperado."` |

Nota: si la asignación de rol falla, el back borra el usuario recién creado. No queda usuario sin rol.

### 7.2 `GET /api/usuarios` (listado, MOCK PB-04)

- **Estado:** **NO EXISTE**. Único implementador: el handler MSW.
- **Política propuesta:** `Admin`.
- **Response propuesta:** `PaginaResponse<UsuarioListItemMock>`. **Función mock:** `listarUsuariosMock(filtro: { pagina?: number; tamano?: number }): Promise<PaginaResponse<UsuarioListItemMock>>`. **Clave:** `usuariosKeys.lista(filtro)`. **Hook (lo escribe B-25, detrás de PB-04):** `useUsuarios(filtro)`, `useQuery`.
- **MSW:** éxito con dos usuarios de ejemplo (sin nombres reales, FC4: usar `"Ana"` y `"Gómez"` del contrato §2.5). Variante `usuariosVacios` (200 con `items: []`).

### 7.3 `PUT /api/usuarios/{id}` (edición, MOCK PB-04)

- **Estado:** **NO EXISTE**. **Request propuesta:** `ActualizarUsuarioMock { nombre, apellido, rol }`. **Response propuesta:** `UsuarioListItemMock`.
- **Función mock:** `actualizarUsuarioMock(id, body)`. **Hook (lo escribe B-25):** `useActualizarUsuario(id)`, `useMutation`, `retry: 0`.
- **MSW:** `http.put('*/api/usuarios/:id')`. Éxito: 200. Variante `usuarioNoExiste` (404).

### 7.4 `PATCH /api/usuarios/{id}/activo` (activación, MOCK PB-04)

- **Estado:** **NO EXISTE**. **Request propuesta:** `{ activo: boolean }`. **Response propuesta:** `UsuarioListItemMock`.
- **Función mock:** `cambiarActivoUsuarioMock(id, activo)`. **Hook (lo escribe B-25):** `useCambiarActivoUsuario(id)`, `useMutation`, `retry: 0`.
- **MSW:** `http.patch('*/api/usuarios/:id/activo')`. Éxito: 200. Variante `usuarioNoExiste` (404).

### 7.5 `GET /api/auth/yo` (MOCK PB-04)

- **Estado:** **NO EXISTE**. **Response propuesta:** `{ id, email, nombre, apellido, rol }`. Política: `Empleado`.
- **Función mock:** `obtenerYoMock(): Promise<YoResponseMock>`. **Clave:** `usuariosKeys.yo()`. **Hook (lo escribe B-02 en `features/inicio/api/`):** `useYo()`, `useQuery`. Si la respuesta falla, B-02 muestra el email del claim `email` del JWT (degradación, PB-04).
- **MSW:** éxito con datos de ejemplo. Variante `yoNoDisponible` (404): simula el back real.

```ts
// dto/usuarios.ts (MOCK, PB-04)
export interface UsuarioListItemMock {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: RolUsuario;
  activo: boolean;
  ultimoIngreso: string | null;   // "ISO UTC". Sin último ingreso en el diseño (B-14)
}

export interface ActualizarUsuarioMock {
  nombre: string;
  apellido: string;
  rol: RolUsuario;
}

export interface YoResponseMock {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: RolUsuario;
}
```

## 8. Contenido de UI

No aplica (sin UI). Textos del back: los muestra B-24 como `detail` en el formulario, y los `errors` por clave con su texto propio (FC10). Referencias: `pantallas/B14-usuarios.md` (formulario y listado), `pantallas/B2-inicio.md` (saludo).

## 9. Estados y casos borde

- **Alta, rol vacío:** el back responde 400 con `errors.Rol`. El rol no se preselecciona (D-20).
- **Alta, contraseña:** el DTO solo exige que no esté vacía. Identity puede rechazar con varios textos en un solo `detail`. Se muestra tal cual (D-21).
- **Alta, email duplicado:** 400 `detail` `"El email ya está registrado."`. No hay código: se muestra como error del formulario (D2 del contrato).
- **Alta, doble clic:** botón deshabilitado. Un segundo POST con el mismo email da 400.
- **Empleado en alta:** 403. B-24 no está en el sidebar del Empleado (FB7.10); la función no lo filtra.
- **Listado, edición y activación (mock):** con PB-04 sin resolver, `VITE_USE_MOCKS=false` da 404 visible. B-25 no se monta hasta el PB.
- **Yo, degradación:** si `GET /api/auth/yo` no existe (real), B-02 usa el claim `email`. No se inventa el nombre (FB7.11).
- **Token vencido:** 401 y cierre de sesión (T-08).

## 10. Tests requeridos

Vitest + MSW. Un test por forma de error (FC5).

1. `POST auth/usuarios devuelve 201 con UsuarioResponse sin password`.
2. `POST auth/usuarios envía rol como texto exacto Administrador o Empleado`.
3. `POST auth/usuarios devuelve 400 de validación con errors.Email` (`it.each`: campos faltantes y email inválido).
4. `POST auth/usuarios devuelve 400 con detail "El email ya está registrado."`.
5. `POST auth/usuarios devuelve 400 con detail de política de contraseña unido por espacio`.
6. `POST auth/usuarios devuelve 401 sin token`.
7. `POST auth/usuarios devuelve 403 con token de Empleado`.
8. `POST auth/usuarios devuelve 500 con texto genérico`.
9. `POST auth/usuarios no reintenta ante 502` (una request).
10. `Mock de listado (PB-04) se marca MOCK y devuelve PaginaResponse`.
11. `Mock de PUT (PB-04) devuelve 404 para usuario inexistente`.
12. `Mock de PATCH activo (PB-04) devuelve el usuario con activo cambiado`.
13. `Mock de yo (PB-04) devuelve 404 en la variante yoNoDisponible`.
14. `La clave usuariosKeys.yo() es estable y no incluye datos del usuario`.

## 11. Criterios de aceptación

1. `CrearUsuarioRequest` y `UsuarioResponse` existen en `dto/usuarios.ts` y `RolUsuario` se importa de `dto/auth.ts`, sin redefinirlo.
2. `crearUsuario` existe, no reintenta y se llama solo desde una acción de usuario.
3. Las cuatro funciones mock están marcadas como MOCK.
4. El handler de alta devuelve 201 y variantes con nombre para cada error de §7.1.1.
5. Los tests de §10 pasan en verde.
6. El barrel exporta solo el bloque de T-32.
7. `lint`, `typecheck`, `test`, `build` en verde.
8. Las tablas de error coinciden con `contratos-api/seguridad-clientes-publico.md` §2.5.
9. Los datos de ejemplo del handler vienen de los contratos (FC4): sin nombres inventados.

## 12. Verificación manual

Pasos para la persona responsable (regla 7), con el back local y seed, y `VITE_USE_MOCKS=false`:

1. Iniciar sesión como Administrador del seed. Crear un Empleado con email nuevo: confirmar el 201 y que no aparece la contraseña en la respuesta.
2. Intentar el mismo email otra vez: confirmar el 400 "El email ya está registrado.".
3. Iniciar sesión como Empleado e intentar el alta (cuando B-24 exista): confirmar el 403.

Motivo: el alta está **Implementada** y depende de roles reales. El listado, la edición, la activación y el "yo" no tienen prueba contra el back: no existen.

## 13. Decisiones pendientes

- **D-32-1 (PB-04):** default: los mocks existen; B-25 y el "yo" de B-02 quedan con degradación hasta el PB.
- **D-32-2 (política de contraseña temporal, D-21, RV-D18): decidido por el usuario (2026-11-06).** La contraseña temporal la genera el front (B-24) y el empleado debe cambiarla en su primer ingreso (US-FE-B-26, que agrega `cambiarPassword` y el campo `debeCambiarPassword` a `@nexa/api`). Esta tarea no cambia. Pendiente de confirmación del equipo (seguridad).
- **D-32-3 (rol inicial, D-20):** default: sin preselección; el campo es obligatorio.
- **D-32-4 (email dentro del alta):** default: el DTO de `zod` del front solo valida formato; el back es la fuente de verdad (`[EmailAddress]` es menos estricto que zod).
- **D-API-1 (hooks en features, FC2).** Default (RV-44): los hooks los escriben B-24 y B-25 en `features/usuarios/api/` y B-02 en `features/inicio/api/`; `@nexa/api` solo exporta funciones, tipos y claves.

## 14. Riesgos y errores comunes

- **Mock de `yo` en producción:** si `VITE_USE_MOCKS=false`, `GET /api/auth/yo` da 404. B-02 debe degradar sin mostrar error. Mitigación: fallback a email del claim.
- **Listado de usuarios real inexistente:** con el flag desactivado, B-25 recibe 404 visible. Mitigación: B-25 no se monta hasta PB-04.
- **Rol como número:** `RolUsuario` es texto. Mitigación: el tipo es literal, no número.
- **Contraseña en logs:** no se loguea el body del alta. Mitigación: no `console.log` del body.
- **Email con mayúsculas:** el back no lo normaliza según el contrato (no verificado). Mitigación: enviar como lo ingresó el empleado.
- **Identity en inglés:** algunos textos de Identity pueden salir en inglés si el back no los traduce. Mitigación: mostrar el `detail` tal cual y registrar el caso.

## 15. Definición de terminado

- `lint`, `typecheck`, `test`, `build` en verde (FC8).
- Sin secretos ni contraseñas en logs. Sin `fetch` directo (FC13).
- Los 9 criterios de §11 con evidencia observada.
- Prueba manual de §12 confirmada por el usuario (regla 7).

## 16. Observaciones al índice

- Resuelto (RV-01): §3 sigue la fila del INDEX; B-02 ya declara T-32 en "Depende de".
- Resuelto (RV-D30 / D-41): el contrato de usuarios usa `PATCH /api/usuarios/{id}/activo` y `tamano`; B14 §9 y PB-04 se alinean en el PR de docs.
