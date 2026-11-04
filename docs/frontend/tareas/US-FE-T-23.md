# US-FE-T-23: Harness de contract tests

Tipo T · Oleada 2 · Tamaño M · Rama sugerida `feature/US-FE-T-23-contract-harness` · Tarjeta Trello `US-FE-T-23`

## 1. Objetivo

Dejar en `packages/api/test/contract/` un harness que valida, en runtime y con el mismo código, que una respuesta (de un handler MSW o del back real) cumple el contrato de `docs/frontend/contratos-api/*.md`: status, content-type, forma del body (con esquemas zod) y forma de los errores `ProblemDetails` / `ValidationProblemDetails`. Al terminar, cada API card (T-24 a T-32) puede agregar su archivo `<dominio>.contract.test.ts` con una lista declarativa de endpoints, y el mismo conjunto corre contra MSW (por defecto) o contra `VITE_API_BASE_URL` cuando el back esté disponible.

Lo usan: US-FE-T-24 a T-32 (API cards) y el equipo cuando el back publique un endpoint (FB7.7, "pasar de mock a real").

## 2. Alcance

**Entra**
- `packages/api/test/contract/harness.ts`: función `contratoEndpoint(definicion)` que registra los `describe`/`it` del endpoint, y funciones puras de validación (`validarProblemDetails`, `validarRespuesta`).
- `packages/api/test/contract/setup.ts`: arranca MSW (`mocks/server.ts` de T-11) en modo mock, o valida la configuración en modo real.
- `packages/api/test/contract/harness.test.ts`: tests del propio harness (sección 10).
- `packages/api/test/contract/esquemas-comunes.ts`: zod de `ProblemDetails` y `ValidationProblemDetails`, espejo de los tipos de T-12 (`dto/comunes.ts`).
- Scripts `test:contract` y `test:contract:real` vía pedido a T-01 (sección 13).

**NO entra**
- Los archivos `<dominio>.contract.test.ts` con endpoints reales: los agrega cada API card (T-24 a T-32).
- Handlers MSW: T-11 (base) y cada API card (`mocks/handlers/<dominio>.ts`).
- Tipos DTO: T-12 y cada API card.
- Config de Vitest: T-02 (el archivo de tests de contrato usa `// @vitest-environment node`).
- Escritura de datos en el back real por defecto: prohibido sin `CONTRACT_ALLOW_WRITES=true` (sección 9).

## 3. Dependencias

- **Depende de:** US-FE-T-08, US-FE-T-11, US-FE-T-12.
- **Oleada:** 2.
- **Puede empezar sin esperar a:** Nada.
- **Bloqueada por pedidos al back (PB-NN):** ninguno. El modo real se usa cuando el back publique cada endpoint; el modo mock funciona sin back.
- **Workaround MSW (FB7.7):** el modo por defecto es MSW. Esta tarea es el mecanismo que valida que el mock sigue al contrato.

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB1 (Vitest, MSW), FB4 (fuente de verdad del contrato, errores `ProblemDetails`), FB7.7 (transición de mock a real).
- `docs/frontend/analisis-front.md`: §7.4 (MSW y transición), §8.2 (qué se prueba en `packages/api`), §8.3 (cobertura mínima de API cards).
- `docs/frontend/contratos-api/convenciones-transversales.md`: §3.1 y §3.2 (qué emite cada fuente de error), §3.4 (tipo TypeScript de error), §3.5 (ejemplos de body), §5 (serialización: enums, fechas, decimales).
- `docs/frontend/contratos-api/seguridad-clientes-publico.md`: §1.1 (formato JSON camelCase), §1.2 (formas de error A, B y C).
- Tablas resumen de cada contrato (`pagos-facturas.md §13`, `seguridad-clientes-publico.md`, "Tabla resumen: endpoint → estado", y las de `vehiculos-planes-cotizaciones.md` y `polizas-cuotas-pagofacil.md`): para saber qué endpoints y estados existen.

## 5. Archivos a crear o modificar

Bajo `frontend/packages/api/`:

| Archivo | Dueño | Notas |
|---|---|---|
| `test/contract/harness.ts` | T-23 | Dueña por el INDEX. |
| `test/contract/setup.ts` | T-23 | |
| `test/contract/esquemas-comunes.ts` | T-23 | Espejo zod de T-12. |
| `test/contract/harness.test.ts` | T-23 | |
| `test/contract/<dominio>.contract.test.ts` | Cada API card (T-24 a T-32) | Agregan su archivo al rebasar sobre T-23 (RV-D31, RV-21). Sección 16. |

No se edita `packages/api/package.json` (FC17, RV-21). Los scripts y las devDependencies `zod` y `cross-env` los declara T-01 (RV-24).

## 6. Pasos de implementación

1. Confirmar que `zod` y `cross-env` están en los `package.json` de T-01. Si no, pedirlo a T-01.
2. Crear `esquemas-comunes.ts`:
   - `esquemaProblemDetails`: `z.object({ type: z.string().nullable().optional(), title: z.string().optional(), status: z.number().int(), detail: z.string().optional(), instance: z.string().optional(), traceId: z.string().optional() })`. Usar `.passthrough()` para no rechazar campos extra del back (`codigo`, `extensions`).
   - `esquemaValidationProblemDetails`: igual, con `status: z.literal(400)` y `errors: z.record(z.array(z.string()))`.
   - Ambos mirror de los tipos de `contratos-api/convenciones-transversales.md §3.4`.
3. Crear `setup.ts`:
   - Leer `process.env.CONTRACT_TARGET` (`'mock'` por defecto; `'real'`).
   - En `mock`: `beforeAll(() => server.listen())`, `afterEach(() => server.resetHandlers())`, `afterAll(() => server.close())` usando el `server` de T-11.
   - En `real`: `beforeAll` exige `VITE_API_BASE_URL` (si falta, lanzar error con mensaje claro, sin saltar la suite). Si el endpoint requiere sesión, hace `POST /api/auth/login` con `CONTRACT_EMAIL` y `CONTRACT_PASSWORD`; si faltan, lanza error. Guarda el token en memoria (no en archivo).
4. Crear `harness.ts` con:
   - `type MetodoContrato = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'`.
   - `interface CasoError { nombre: string; request: () => Promise<Response>; estado: number; esquema: 'problem' | 'validation' }`.
   - `interface DefinicionEndpoint { nombre: string; metodo: MetodoContrato; ruta: string; requiereSesion: boolean; destructivo: boolean; soloMock?: boolean; exito: { estado: number; esquema?: ZodTypeAny; request: () => Promise<Response> }; errores: CasoError[] }`.
   - `contratoEndpoint(def)`: registra un `describe(def.nombre)` con: un `it` por la respuesta de éxito (status, content-type, esquema); un `it` por cada caso de error (status, content-type `application/problem+json`, esquema de error).
   - Si `def.destructivo` y `CONTRACT_ALLOW_WRITES !== 'true'` y `CONTRACT_TARGET === 'real'`: el `describe` se registra con `it.skip` y el motivo en el nombre (visible en el reporte).
   - Si `def.soloMock` y `CONTRACT_TARGET === 'real'`: igual, `it.skip` con motivo.
   - Funciones puras exportadas: `validarRespuesta(esquema, cuerpo)` (lanza un error con la ruta del fallo de zod) y `validarProblemDetails(cuerpo)`.
5. Crear `harness.test.ts` (sección 10).
6. Agregar a `package.json` (vía T-01): `"test:contract": "vitest run packages/api/test/contract"` y `"test:contract:real": "cross-env CONTRACT_TARGET=real vitest run packages/api/test/contract"`.
7. Verificar que el harness corre sin endpoints registrados (solo sus tests) y en verde.
8. Dejar una plantilla comentada de uso al inicio de `harness.ts` (un ejemplo de `contratoEndpoint` con un `GET`), sin endpoints reales.

## 7. Contrato con el back

No aplica directamente: el harness no define endpoints. Define la forma que cada API card debe cumplir al registrar un endpoint. Las formas de error son las de `contratos-api/convenciones-transversales.md §1.2` y `§3`:

```ts
// Forma A (error de dominio o aplicación)
interface ProblemDetails { type?: string | null; title?: string; status: number; detail?: string; instance?: string; traceId?: string }

// Forma B (validación de modelo, claves en PascalCase)
interface ValidationProblemDetails extends ProblemDetails { status: 400; errors: Record<string, string[]> }
```

Las claves de `errors` llegan en PascalCase (`Dni`, `NumeroPoliza`) según `convenciones §1.2`. El harness no las renombra; valida la forma y deja la traducción a `US-FE-T-10`.

Forma C (401 y 403 sin body): el harness acepta cuerpo vacío o `ProblemDetails` sin `detail` garantizado (`seguridad-clientes-publico.md §1.2`, forma C).

## 8. Contenido de UI

No aplica.

## 9. Estados y casos borde

- **Modo mock (por defecto):** corre en CI y en local sin back. Valida que los handlers MSW siguen al contrato.
- **Modo real:** corre contra `VITE_API_BASE_URL`. Sin esa variable la suite falla al iniciar, no se salta.
- **Endpoint `soloMock`:** existe en el mock pero el back real no puede reproducir el escenario de error (por ejemplo `429` de `/api/publico/*` con datos controlados). En modo real se marca como `skip` con su motivo.
- **Endpoint `destructivo`** (`POST`, `PUT`, `DELETE`): en modo real no se ejecuta salvo `CONTRACT_ALLOW_WRITES=true`. Motivo: no escribir datos de un entorno compartido.
- **Credenciales ausentes en modo real para endpoint con sesión:** la suite falla con mensaje que nombra la variable faltante.
- **Content-type:** el éxito es `application/json` (o vacío en 204); los errores son `application/problem+json` (`seguridad §1.2`). Una respuesta de error con `text/html` es un fallo, no un skip.
- **Campos extra del back:** se aceptan (`passthrough`); un campo faltante requerido sí falla.
- **`ApiError` (US-FE-T-08):** el harness no lo usa para validar; valida la respuesta cruda. Así un bug del cliente no oculta un bug del contrato.

## 10. Tests requeridos

Vitest, entorno `node` (`// @vitest-environment node`).

| Archivo | Test | Afirma |
|---|---|---|
| `harness.test.ts` | `validarRespuesta acepta un cuerpo que cumple el esquema` | Devuelve el cuerpo tipado. |
| `harness.test.ts` | `validarRespuesta rechaza un campo requerido faltante` | Lanza, y el mensaje menciona la ruta del campo. |
| `harness.test.ts` | `validarRespuesta acepta campos extra` | `passthrough` no rechaza `codigo`. |
| `harness.test.ts` | `validarProblemDetails acepta ProblemDetails sin detail` | Pasa (forma C). |
| `harness.test.ts` | `validarProblemDetails rechaza status como texto` | Lanza. |
| `harness.test.ts` | `validarProblemDetails de validación exige errors con arreglos de texto` | Rechaza `errors: { Dni: 'x' }` y acepta `errors: { Dni: ['x'] }`. |
| `harness.test.ts` | `en modo mock, un handler que devuelve forma incorrecta hace fallar el endpoint` | Con `server.use` que devuelve `{ id: 1 }` para un esquema con `id: string`, el caso de éxito falla. Prueba que el harness detecta el error (prueba negativa). |
| `harness.test.ts` | `un endpoint destructivo se omite en modo real sin CONTRACT_ALLOW_WRITES` | Con `CONTRACT_TARGET=real` y la variable ausente, el caso queda `skipped` con motivo. |
| `harness.test.ts` | `un endpoint soloMock se omite en modo real` | Ídem con `soloMock`. |
| `harness.test.ts` | `en modo real sin VITE_API_BASE_URL la suite falla al iniciar` | Lanza con mensaje que nombra la variable. |

Los tests de las API cards (no de esta tarea) siguen el patrón: un `contratoEndpoint` por endpoint, con un caso de error por código de su tabla (FC5).

## 11. Criterios de aceptación

1. `packages/api/test/contract/harness.ts` exporta `contratoEndpoint`, `validarRespuesta` y `validarProblemDetails`.
2. `esquemas-comunes.ts` tiene `ProblemDetails` y `ValidationProblemDetails` con `passthrough`.
3. `setup.ts` lee `CONTRACT_TARGET` y, en modo real, exige `VITE_API_BASE_URL`.
4. Los diez tests de la sección 10 pasan.
5. La prueba negativa (handler con forma incorrecta) falla como se espera, y el test lo afirma.
6. `npm run test:contract` corre en verde sin endpoints de dominio registrados.
7. `npm run test:contract:real` sin `VITE_API_BASE_URL` falla con mensaje claro (no se salta).
8. Endpoints `destructivo` y `soloMock` aparecen como `skipped` con motivo en modo real.
9. No hay `any` explícito en el harness.
10. Ningún dato de fixture real ni credencial está en el código; las credenciales llegan por variables de entorno.
11. Sin cambios fuera de `packages/api/test/contract/` y el pedido a T-01 para `package.json`.

## 12. Verificación manual

1. Correr `npm run test:contract`. Esperado: solo los tests de `harness.test.ts`, en verde.
2. Editar temporalmente un handler de prueba para que devuelva `{}` y correr el test de la prueba negativa. Esperado: el test de la prueba negativa sigue pasando porque afirma que el harness falla; revertir cualquier cambio de prueba que no corresponda.
3. Correr `npm run test:contract:real` sin variables. Esperado: error que nombra `VITE_API_BASE_URL`.
4. Con el back local levantado y `VITE_API_BASE_URL=http://localhost:8080` (y `CONTRACT_EMAIL`/`CONTRACT_PASSWORD` de un usuario local de prueba, nunca commitidos), correr la suite real con los endpoints que ya estén en `Implementado`. Esperado: los `GET` pasan; los `destructivo` aparecen como `skipped`.

Confirmar el resultado con el equipo antes del PR (`docs/workflow.md`, regla 7).

## 13. Decisiones pendientes (con default)

1. **Nombre y firma de `createApiClient` (US-FE-T-08):** default: el harness usa el cliente con `baseUrl` inyectable que expone T-08 (dependencia declarada, RV-21). Si T-08 expone otro nombre, se usa ese y se anota aquí.
2. **Escritura en el back real:** default: bloqueada por `CONTRACT_ALLOW_WRITES=true`.
3. **Credenciales de modo real:** NO DEFINIDO en la documentación. Default (RV-D28): variables `CONTRACT_EMAIL` y `CONTRACT_PASSWORD` locales, sin valores en el repo. Quién crea el usuario de prueba en el back local: NO DEFINIDO (el seed de `docker-compose.yml` usa `SEED_ADMINISTRADOR_EMAIL` y `SEED_ADMINISTRADOR_PASSWORD`, que es el candidato).
4. **Cross-env:** default: `cross-env` como devDependency para que el script funcione en Windows (la máquina del equipo es Windows).
5. **Ejecución en CI:** default: `test:contract` (mock) se incluye en el job `frontend` solo si T-01 lo agrega; `test:contract:real` nunca corre en CI.

## 14. Riesgos y errores comunes

- **Probar el handler y no el contrato:** un test que solo llama al handler y mira el status no detecta una forma incorrecta. Siempre validar el esquema.
- **Hacer `passthrough` en un esquema que debe ser estricto:** los DTO de request sí pueden ser estrictos; los de response no.
- **Saltar silenciosamente un endpoint:** el skip debe llevar motivo y quedar visible en el reporte.
- **Credenciales en un archivo de prueba:** prohibido. Solo variables de entorno.
- **Escribir datos en el back compartido:** prohibido sin `CONTRACT_ALLOW_WRITES`.
- **Usar `ApiError` para validar la forma:** oculta bugs del contrato detrás del cliente. Validar la respuesta cruda.
- **Olvidar el `// @vitest-environment node`:** MSW en jsdom puede fallar con `fetch` en tests de contrato.

## 15. Definición de terminado

- `lint`, `typecheck`, `test` y `test:contract` en verde.
- `test:contract:real` falla con mensaje claro sin `VITE_API_BASE_URL` (no se salta).
- Accesibilidad: no aplica (no hay UI).
- Sin secretos ni credenciales en el diff.
- Criterios 1 a 11 de la sección 11 tildados con evidencia observada.

## 16. Observaciones al índice

- Resuelto (RV-21 / RV-D31): T-23 es dueña del harness en `test/contract/`; cada API card agrega su `<dominio>.contract.test.ts` al rebasar sobre T-23, sin dependencia declarada.
- Resuelto (RV-24): `zod` (devDep de `packages/api`) y `cross-env` los declara T-01; FB1 se amplía en el PR de docs.
- Resuelto (RV-21): T-08 ya figura en la fila del INDEX de T-23 y fija `createApiClient` con `baseUrl` inyectable (sección 13, decisión 1).
