# US-FE-T-21: Smoke e2e

Tipo T · Oleada 6 · Tamaño M · Rama sugerida `feature/US-FE-T-21-smoke-e2e` · Tarjeta Trello `US-FE-T-21`

## 1. Objetivo

Agregar dos pruebas de navegador que recorren los flujos críticos de punta a punta, con las dos apps levantadas contra MSW (`VITE_USE_MOCKS=true`):

1. **Backoffice:** login (`/login`) hasta `/inicio`.
2. **Web pública:** consulta de póliza (`/consultar-poliza`) hasta `/poliza` con los datos de la póliza.

Al terminar, `npm run e2e` levanta ambas apps, corre los dos flujos con Playwright y los deja en verde. Lo usan la persona que hace el PR y el job `frontend` cuando se decida incluirlo en CI (sin cambios de CI en esta tarea).

## 2. Alcance

**Entra**
- `frontend/playwright.config.ts`: dos `webServer` (backoffice en 5173 y web en 5174), ambos con `VITE_USE_MOCKS=true`, `reuseExistingServer` en local, un solo proyecto de navegador (Chromium), viewport 1440×900.
- `frontend/e2e/login-inicio.spec.ts` (flujo 1).
- `frontend/e2e/consulta-poliza.spec.ts` (flujo 2).
- Dependencia `@playwright/test` y script `e2e` en `frontend/package.json` y `package-lock.json`: los agrega T-21 de acuerdo con US-FE-T-01 (excepción a FC17 indicada en el INDEX, línea de ownership de `package.json`).

**NO entra**
- Otros flujos (cotizar, emitir, pagar, Pago Fácil): quedan fuera del smoke.
- Pruebas contra el back real: esta tarea es solo MSW.
- Accesibilidad en navegador: la cubre US-FE-T-19 en tests de componente.
- Cambios de CI: solo se documenta el comando (US-FE-T-22).
- Mock handlers de login o consulta: US-FE-T-11 (login y MSW base) y US-FE-T-31 (`POST /api/publico/consulta`). Esta tarea los consume.

## 3. Dependencias

- **Depende de:** US-FE-B-01, US-FE-B-03, US-FE-T-11, US-FE-T-31, US-FE-W-03, US-FE-W-04.
- **Oleada:** 6.
- **Puede empezar sin esperar a:** —
- **Bloqueada por pedidos al back (PB-NN):** ninguno que bloquee el smoke, porque corre contra MSW. El login real y la consulta real no se usan.
- **Workaround MSW (FB7.7):** `VITE_USE_MOCKS=true` en ambas apps durante el test.

## 4. Documentos a leer

- `docs/frontend/pantallas/B1-login.md`: §5 (texto del botón `Ingresar`, label `Email`, label `Contraseña`), §6 (campos y validaciones), §8 (destino `/inicio`), §9 (`POST /api/auth/login`, respuesta `LoginResponse`).
- `docs/frontend/pantallas/W2-consultar-poliza.md`: §5 (título, label `DNI`, label `Número de póliza`, botón `Consultar`), §6 (regex de DNI y de póliza, con ejemplos `30123456` y `POL-0000042`), §8 (destino de éxito: W3), §9.1 (endpoint `POST /api/publico/consulta`).
- `docs/frontend/pantallas/B2-inicio.md`: §5 (título `Hola, Mariela` como ejemplo de H1 dinámico; la prueba no depende del nombre).
- `docs/frontend/analisis-front.md`: §5.1 (flujo login de empleado), §5.4 (consulta pública hasta pago), §8.2 (qué se prueba por capa; flujos críticos con MSW).
- `docs/frontend/00-decisiones-base.md`: FB7.5 (sesión en `sessionStorage`), FB7.7 (MSW con `VITE_USE_MOCKS`).
- `docs/frontend/tareas/INDEX.md`: D-27 (herramienta E2E: Playwright, propuesta, solo para T-21).
- `docs/frontend/contratos-api/seguridad-clientes-publico.md`: §2.6 (login) y §6.2 (request de consulta).

## 5. Archivos a crear o modificar

| Archivo | Dueño | Notas |
|---|---|---|
| `frontend/playwright.config.ts` | T-21 | Nuevo; la herramienta la agrega T-01 (FC17). |
| `frontend/e2e/login-inicio.spec.ts` | T-21 | Flujo 1. |
| `frontend/e2e/consulta-poliza.spec.ts` | T-21 | Flujo 2. |
| `frontend/package.json` (dependencia `@playwright/test`, script `e2e`) | T-21, de acuerdo con T-01 (excepción FC17 del INDEX) | Solo estas dos entradas. |
| `frontend/package-lock.json` | T-21 (consecuencia de la línea anterior) | |

No se toca ningún archivo de `apps/` ni de `packages/`.

## 6. Pasos de implementación

1. Agregar `@playwright/test` como devDependency en la raíz y el script `"e2e": "playwright test"`, acordado con T-01 (excepción FC17). Ver sección 13.
2. Crear `playwright.config.ts`:
   - `testDir: './e2e'`, `workers: 1`, `retries: 0`, `reporter: 'list'`, `use: { trace: 'retain-on-failure', viewport: { width: 1440, height: 900 } }`.
   - `projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]`. Usar el viewport explícito de arriba, que pisa el del dispositivo.
   - `webServer`: dos entradas. Cada una con `command` que corre el dev server de su workspace en `strictPort` (5173 y 5174), `url` de la app, `reuseExistingServer: !process.env.CI`, y `env: { VITE_USE_MOCKS: 'true' }`.
3. Verificar que `public/mockServiceWorker.js` existe en ambas apps (ownership del INDEX: T-14 para backoffice y T-17 para web, RV-07 f). Si falta, el test falla antes de navegar; no ignorarlo.
4. Escribir `login-inicio.spec.ts`:
   - `page.goto('/login')`.
   - `getByLabel('Email')` → `fill` con el email de los fixtures de T-11 (sección 7).
   - `getByLabel('Contraseña')` → `fill` con la contraseña de fixture.
   - `getByRole('button', { name: 'Ingresar' })` → `click`.
   - `await expect(page).toHaveURL(/\/inicio$/)`.
   - `await expect(page.getByRole('heading', { level: 1 })).toBeVisible()`.
5. Escribir `consulta-poliza.spec.ts`:
   - `page.goto('/consultar-poliza')`.
   - `getByLabel('DNI')` → `fill('30123456')`.
   - `getByLabel('Número de póliza')` → `fill('POL-0000042')`.
   - `getByRole('button', { name: 'Consultar' })` → `click`.
   - `await expect(page).toHaveURL(/\/poliza$/)`.
   - `await expect(page.getByText('POL-0000042')).toBeVisible()`.
6. Correr `npm run e2e` desde `frontend/`. Esperado: dos tests pasan.
7. Si un test falla, abrir el trace (`npx playwright show-trace`) antes de cambiar nada (`systematic-debugging`).

## 7. Contrato con el back

No aplica: los flujos corren contra MSW. Los handlers que se consumen y sus contratos:

- `POST /api/auth/login` (Implementado): request `LoginRequest { email, password }`; respuesta `LoginResponse { token, rol, expiraEn }` (`seguridad-clientes-publico.md §2.6`). Handler en `packages/api/mocks/handlers/auth.ts`, dueño T-32 (funciones de `/api/auth/*`, RV-D04). Con credenciales válidas de fixture devuelve 200 y un `rol`.
- `POST /api/publico/consulta` (Implementado): request `ConsultaPublicaRequest { dni: string, numeroPoliza: string }`; respuesta 200 `ConsultaPublicaResponse` con `numeroPoliza: "POL-0000042"` para el par `30123456` / `POL-0000042` (`seguridad-clientes-publico.md §6.2` y §6.3). Handler en `packages/api/mocks/handlers/publico.ts` (T-31).

Credenciales de login: valores de fixture de T-11 (`packages/api/mocks/fixtures`). Esta tarea no inventa credenciales ni las deja en texto plano en otro archivo. Si los fixtures usan un nombre distinto, el spec lo importa desde el fixture en lugar de copiar el valor.

## 8. Contenido de UI

Textos literales usados por los specs (no se cambian):

| Pantalla | Selector accesible | Texto |
|---|---|---|
| B1 Login | `getByLabel` | `Email`, `Contraseña` |
| B1 Login | `getByRole('button')` | `Ingresar` |
| W2 Consultar póliza | `getByLabel` | `DNI`, `Número de póliza` |
| W2 Consultar póliza | `getByRole('button')` | `Consultar` |
| B2 Inicio | `getByRole('heading', { level: 1 })` | Título dinámico (`Hola, …`). El test no compara el texto. |

## 9. Estados y casos borde

- **Login correcto:** redirige a `/inicio` con el token en `sessionStorage` (FB7.5). El test no verifica el storage.
- **Login incorrecto:** fuera de alcance de este smoke (lo cubre B-01).
- **Consulta sin resultado (404) o con demasiados intentos (429):** fuera de alcance; lo cubre W-03.
- **Recarga del navegador en `/inicio`:** no se prueba en el smoke.
- **Mocks no levantados:** el test falla con timeout de navegación. Verificar primero que `VITE_USE_MOCKS=true` llegó al `webServer`.
- **Puerto ocupado por otra app:** con `strictPort` el `webServer` falla; no reutilizar un puerto de otro proyecto. Con `reuseExistingServer` en local solo se reutiliza si es la misma app.

## 10. Tests requeridos

Playwright (`@playwright/test`), con Chromium.

| Archivo | Test | Afirma |
|---|---|---|
| `login-inicio.spec.ts` | `ingresar con credenciales válidas lleva a /inicio` | URL termina en `/inicio` y hay un `h1` visible. |
| `consulta-poliza.spec.ts` | `consultar una póliza válida muestra sus datos en /poliza` | URL termina en `/poliza` y el número `POL-0000042` es visible. |

Tests de componente de los mismos formularios no son parte de esta tarea: los hacen B-01 y W-03 con Testing Library.

## 11. Criterios de aceptación

1. `playwright.config.ts` levanta backoffice en `5173` y web en `5174` con `VITE_USE_MOCKS=true`.
2. `npm run e2e` desde `frontend/` corre los dos specs y termina en verde.
3. El spec de login usa `getByLabel` y `getByRole` (sin selectores CSS frágiles ni `nth`).
4. El spec de consulta llega a `/poliza` y muestra `POL-0000042`.
5. No hay credenciales en texto plano fuera del fixture de T-11.
6. Los specs no usan `waitForTimeout`; las esperas son de expectativas de Playwright.
7. `retries: 0` y `workers: 1` en la configuración.
8. El trace se guarda solo en fallo (`retain-on-failure`).
9. `npm run lint` y `npm run typecheck` pasan con los archivos de `e2e/` incluidos.
10. No hay cambios fuera de `playwright.config.ts`, `e2e/`, y las entradas de `package.json` y `package-lock.json` de la sección 5.

## 12. Verificación manual

Esta tarea es automatizada. Antes del PR, la persona responsable:

1. Corre `npm run e2e` en su máquina y confirma en la salida que los dos tests pasaron.
2. Abre el reporte o la consola y verifica que ninguno se saltó (`skipped` = 0).
3. Opcional: corre el login a mano en `http://localhost:5173/login` con las mismas credenciales de fixture y confirma que llega a `/inicio`.

Confirmar el resultado con el equipo antes del PR (`docs/workflow.md`, regla 7).

## 13. Decisiones pendientes (con default)

1. **Herramienta E2E:** D-27 propone Playwright. Default: Playwright. Si el equipo elige otra, se reescriben los dos specs; el resto de la tarea no cambia.
2. **Instalación de Playwright y navegadores:** default: T-21 agrega la devDependency (excepción FC17, acordada con T-01); el navegador se instala con `npx playwright install chromium` (documentado por T-22). No se instala en el job de CI en esta tarea.
3. **Credenciales de login para el smoke:** NO DEFINIDO en el back. Default: fixture de MSW de T-11; sin credenciales reales en el repo (RV-D28).
4. **Inclusión en CI:** NO DEFINIDO. Default (RV-D28): E2E fuera de CI por ahora; no se agrega al job `frontend` en esta tarea; se decide aparte.

Decididas por el usuario el 2026-11-08, antes de implementar (regla 12): se confirmaron los cuatro defaults (Playwright, devDependency con Chromium instalado aparte, fixture de MSW de T-11 sin credenciales reales y E2E fuera de CI).

## 14. Riesgos y errores comunes

- **Selectores que dependen del texto dinámico:** el H1 de `/inicio` cambia con el nombre. Usar solo el rol y el nivel.
- **Usar `page.waitForTimeout`:** introduce tiempos fijos. Usar `expect(...).toBeVisible()`.
- **Olvidar `VITE_USE_MOCKS=true` en el `webServer`:** el login llama a la API real (inexistente) y falla con timeout.
- **Copiar credenciales al spec:** mantenerlas en el fixture.
- **Ejecutar sin `mockServiceWorker.js`:** MSW no intercepta y el test falla. Verificar la sección 6, paso 3.
- **Confundir "Consultar" del botón con el título de la página:** usar `getByRole('button', { name: 'Consultar' })` para evitar coincidencias.

## 15. Definición de terminado

- `npm run e2e`, `lint`, `typecheck` y `build` en verde.
- Accesibilidad: los selectores del spec son por rol y label (sirve de chequeo indirecto de la sección 10 de US-FE-T-19).
- Sin secretos en el diff.
- Criterios 1 a 10 de la sección 11 tildados con evidencia observada (salida de `npm run e2e`).

## 16. Observaciones al índice

- Resuelto (RV-05): W-08 sale de las dependencias; el flujo 2 termina en W3 (`/poliza`), que es US-FE-W-04.
- Resuelto (RV-05): se agrega US-FE-B-01 (el flujo 1 empieza en `/login`). Deps finales: B-01, B-03, T-11, T-31, W-03, W-04 (fila del INDEX).
- Resuelto (RV-D01 / D-43): el mensaje de login es el del Figma; esta tarea no asserta el texto de error (lo decide US-FE-B-01).
- Resuelto (RV-53): la fila del INDEX menciona que el smoke usa login (B-01) y que Playwright es excepción de FC17.
- Desvío al implementar (login): el único usuario que el MSW de login acepta (`cambio.pendiente@example.test`) devuelve `debeCambiarPassword: true` (US-FE-B-26), así que el login no llega a `/inicio` sino a `/cambiar-password`. Decidido por el usuario el 2026-11-08: el spec completa el cambio forzado de contraseña y recién ahí verifica `/inicio`. Usa el fixture `usuarioMockCambioPendiente` y una contraseña nueva ficticia que solo existe en el MSW del navegador. No se agregó un segundo usuario al handler para no tocar `packages/`.
- Desvío al implementar (consulta): el handler de `POST /api/publico/consulta` devuelve siempre la póliza `POL-0000001`, no la `POL-0000042` de la ficha. El spec consulta y verifica `POL-0000001`.
- La web pública necesita el arranque de MSW en `main.tsx` (lo agregó US-FE-W-06, #142): sin él el flujo 2 falla con el error de red. T-21 se toma después de ese PR.
- `outputDir` apunta a `node_modules/.cache` para que las trazas no ensucien git sin tocar `.gitignore` (dueño T-01). Se agregó `e2e/tsconfig.json` para tipar los specs; `npm run typecheck` no lo recorre (solo recorre los workspaces).
