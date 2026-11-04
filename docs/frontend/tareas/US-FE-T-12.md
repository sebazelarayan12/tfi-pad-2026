# US-FE-T-12: @nexa/api: barrel, DTO comunes y auth

T · Ola 0 · Tamaño S · Rama sugerida `feature/US-FE-T-12-barrel-dto-comunes-auth` · Tarjeta Trello `US-FE-T-12`

## 1. Objetivo

`@nexa/api` tiene su barrel `src/index.ts` con bloques por archivo y los tipos compartidos del contrato: `ProblemDetails`, `ValidationProblemDetails`, `PaginaRequest`, `PaginaResponse<T>`, `RolUsuario`, `LoginRequest` y `LoginResponse`. Existe un archivo `dto/` por dominio (vacío, salvo comunes y auth) para que cada API card solo agregue su bloque. Destinatarios: todas las features y las API cards T-24..T-32.

## 2. Alcance

**Entra**
- `frontend/packages/api/src/index.ts`: barrel, con un bloque por archivo.
- `frontend/packages/api/src/dto/comunes.ts`: `ProblemDetails`, `ValidationProblemDetails`, `PaginaRequest`, `PaginaResponse<T>`.
- `frontend/packages/api/src/dto/auth.ts`: `RolUsuario`, `LoginRequest`, `LoginResponse`. (`CrearUsuarioRequest` y `UsuarioResponse` van en `dto/usuarios.ts`, dueña US-FE-T-32; RV-D04.)
- `frontend/packages/api/src/dto/{clientes,vehiculos,planes,cotizaciones,polizas,pagos,pagofacil,publico}.ts`: ocho archivos vacíos (`export {};`) con el ID de la API card dueña en un comentario.
- `frontend/packages/api/test/dto/tipos.test-d.ts`: pruebas de tipos.

**NO entra**
- DTO de dominios (T-24..T-32).
- Cliente HTTP y `ApiError` (US-FE-T-08).
- Funciones de request de auth, por ejemplo `loginRequest` (ver §16: FC2 las asigna a T-12, pero esta tarea no depende de T-08).
- Mapas de enums y mensajes (US-FE-T-10).
- `package.json` y lockfile (US-FE-T-01).

## 3. Dependencias

- **Puede empezar sin esperar a:** Nada.
- **Depende de:** — (ninguna).
- **Bloqueada por pedidos al back (PB-NN):** —.
- **Workaround MSW (FB7.7):** no aplica.

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB2 (paquete `api` y alias `@nexa/api`), FB3 regla 5 (los campos de DTO se usan tal cual los devuelve la API).
- `docs/frontend/analisis-front.md` §6.1 (tipos que expone `@nexa/api`).
- `docs/frontend/contratos-api/convenciones-transversales.md` §2.1 (login y alta de usuario: request y response), §3.4 (`ProblemDetails`), §5.5 (`Guid` como `string`, nulos como `T | null`), §6.1 (`PaginaResponse<T>`).
- `docs/frontend/contratos-api/seguridad-clientes-publico.md` §1.2 (formas de error A, B y C) y §2.2 (`RolUsuario`).
- `docs/frontend/tareas/INDEX.md`, sección Ownership: `packages/api/src/index.ts`, `dto/comunes.ts` y `dto/auth.ts` son de T-12; `dto/<dominio>.ts` es de la API card.

## 5. Archivos a crear o modificar

| Archivo | Dueño |
|---|---|
| `frontend/packages/api/src/index.ts` | US-FE-T-12 (cada API card agrega su bloque) |
| `frontend/packages/api/src/dto/comunes.ts`, `dto/auth.ts` (solo tipos de `/api/auth/*`) | US-FE-T-12 |
| `frontend/packages/api/src/dto/{clientes,vehiculos,planes,cotizaciones,polizas,pagos,pagofacil,publico}.ts` | Creados por T-12 vacíos; la API card del dominio los llena |
| `frontend/packages/api/src/dto/usuarios.ts` | US-FE-T-32 (RV-07; T-12 no lo crea) |
| `frontend/packages/api/test/dto/tipos.test-d.ts` | US-FE-T-12 |

## 6. Pasos de implementación

1. Crear `dto/comunes.ts` con los tipos de §7.
2. Crear `dto/auth.ts` con los tipos de §7 (`RolUsuario`, `LoginRequest`, `LoginResponse`; los tipos de usuarios son de T-32, ver DP-1).
3. Crear los ocho archivos de dominio vacíos, cada uno con `export {};` y un comentario `// Dueño: US-FE-T-NN`.
4. Crear `src/index.ts` con `export * from './dto/comunes';` y `export * from './dto/auth';`. Un comentario al inicio: "un bloque por archivo; cada API card agrega el suyo".
5. Escribir `test/dto/tipos.test-d.ts` con `expectTypeOf` (§10).
6. Correr el typecheck del package. Si pasa, los tipos están listos para importar desde `@nexa/api`.

## 7. Contrato con el back

No hay endpoint nuevo en esta tarea. Los tipos reflejan request y response de:

| Endpoint | Estado | Tipos |
|---|---|---|
| `POST /api/auth/login` | Implementado (`AuthController.cs:21-23`) | `LoginRequest` → `LoginResponse` |
| `POST /api/auth/usuarios` | Implementado (`AuthController.cs:29-34`, policy Admin) | `CrearUsuarioRequest` → `UsuarioResponse` (201): los tipos los define US-FE-T-32 en `dto/usuarios.ts`, no esta tarea |

```ts
// dto/comunes.ts  (convenciones §3.4, §6.1)
export interface ProblemDetails {
  status: number;
  type?: string | null;
  title?: string | null;
  detail?: string | null;
  instance?: string | null;
  traceId?: string | null;
  codigo?: string;
  errors?: Record<string, string[]>;
}

export interface ValidationProblemDetails extends ProblemDetails {
  status: 400;
  errors: Record<string, string[]>;
}

export interface PaginaRequest {
  pagina?: number;   // >= 1, default 1
  tamano?: number;   // 1 a 100, default 20
}

export interface PaginaResponse<T> {
  items: T[];
  pagina: number;
  tamanoPagina: number;   // en la respuesta; el request usa "tamano"
  total: number;
}

// dto/auth.ts  (convenciones §2.1; seguridad §2.2 y §2.6)
export type RolUsuario = 'Administrador' | 'Empleado';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;     // JWT, va en "Authorization: Bearer"
  rol: RolUsuario;
  expiraEn: string;  // ISO 8601 con offset "+00:00"
}
```

`CrearUsuarioRequest` y `UsuarioResponse` NO se definen acá: los escribe US-FE-T-32 en `dto/usuarios.ts` (contrato en `contratos-api/seguridad-clientes-publico.md` §2.6).

El MSW de estos endpoints no se escribe acá: el de login lo escribe US-FE-T-11 o B-01 según corresponda, y el de alta lo escribe US-FE-T-32.

## 8. Contenido de UI

No aplica: no hay textos de UI.

## 9. Estados y casos borde

- `codigo` puede faltar: solo lo trae el 404 de algunos casos.
- `errors` solo aparece en 400 de validación automática; los 400 de negocio traen `detail` sin `errors`.
- `type` puede venir `null` o ausente: no se usa para decidir nada (seguridad §1.2).
- `expiraEn` siempre lleva offset; no se asume formato sin zona.
- `Guid` llega como `string` en minúsculas. No se convierte a otro tipo.

## 10. Tests requeridos

Pruebas de tipos con `expectTypeOf` (Vitest). Se ejecutan con el typecheck (US-FE-T-02).

- "`ProblemDetails` exige `status` y el resto es opcional o nulo".
- "`ValidationProblemDetails` fija `status` en 400 y exige `errors`".
- "`RolUsuario` es exactamente `'Administrador' | 'Empleado'`".
- "`LoginResponse` tiene exactamente las claves `token`, `rol` y `expiraEn`".
- "`PaginaResponse<T>` usa `tamanoPagina` en la respuesta".
- "`LoginRequest` exige `email` y `password` como string (`@ts-expect-error` si falta alguno)".
- "el barrel `src/index.ts` reexporta `LoginResponse` y `ProblemDetails`".

## 11. Criterios de aceptación

1. `src/index.ts` existe y reexporta `dto/comunes` y `dto/auth`.
2. Los tipos de §7 coinciden campo por campo con convenciones §2.1 y §3.4 (revisión y pruebas de tipos).
3. Los ocho archivos de dominio existen, están vacíos y tienen el comentario de dueño.
4. No hay `any` en el package (`rg ': any' packages/api` sin resultados).
5. No hay código de runtime en `dto/` (solo tipos y `export {}`).
6. Las pruebas de §10 pasan y `npm run typecheck` en `packages/api` está en verde.
7. `npm run lint` en verde, con evidencia.

## 12. Verificación manual

Sin prueba manual: solo tipos. Se verifica con el typecheck y las pruebas de §10.

## 13. Decisiones pendientes

- **DP-1 Ubicación de `CrearUsuarioRequest` y `UsuarioResponse` (resuelta por el INDEX).** Default: en `dto/usuarios.ts` de T-32, según la tabla de ownership. Corregido en §1, §2, §6, §7 y §10 de esta ficha.
- **DP-2 `codigo` como string genérico.** Default: `codigo?: string`. Alternativa: unión cerrada (`'CLIENTE_NO_ENCONTRADO' | 'PERSONA_NO_ENCONTRADA'`). Tradeoff: la unión da más seguridad, pero rompe cuando el back agrega códigos (PB-14).
- **DP-3 `type` y `title`.** Default: `string | null` opcionales, como el wire real (convenciones §3.4). Alternativa: solo `string`. No cambia el uso.

## 14. Riesgos y errores comunes

- `status` opcional en `ProblemDetails` impide el narrowing por status en el cliente. Por eso `status` es obligatorio.
- `export *` de dos archivos con el mismo nombre (por ejemplo `PaginaResponse` en un dominio) rompe el barrel. Solo `dto/comunes.ts` exporta tipos genéricos; los dominios no redefinen `PaginaResponse`.
- Tipar `expiraEn` como `Date`: el JSON trae string. La conversión la hace `parsearFechaUtc` (T-09), no el tipo.
- Usar `number` para importes sin formateo: los importes son `number` en JSON pero se formatean con T-09 (FB4).
- `rol` como `string` en lugar de la unión: pierde la validación de guardas (T-13).

## 15. Definición de terminado

`npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` en verde en `packages/api`. Criterios de §11 tildados con evidencia observada. Sin secretos. Accesibilidad: no aplica.

## 16. Observaciones al índice

- Resuelto (RV-D04): `loginRequest` lo escribe T-32 en `packages/api/src/auth/login.ts`. T-12 queda con tipos de `/api/auth/*`; las funciones de request no entran aquí, y T-12 no necesita T-08 para ellas.
- Resuelto (RV-D04): según la corrección del INDEX (fila `dto/<dominio>.ts`), `dto/usuarios.ts` es de T-32 (`CrearUsuarioRequest` y `UsuarioResponse` allí), según el INDEX. Ya corregido en esta ficha (DP-1). T-32 crea `dto/usuarios.ts`; T-12 no lo crea.
