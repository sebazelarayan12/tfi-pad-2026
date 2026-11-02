# US-FE-B-14: Pólizas: búsqueda por número, DNI y patente

Tipo: B · Oleada: 5 · Tamaño: S · Rama sugerida: `feature/US-FE-B-14-polizas-busqueda` · Tarjeta Trello: `US-FE-B-14`

## 1. Objetivo

Un buscador único en el listado de pólizas (B-13) acepta un número de póliza, un DNI o una patente. El texto se clasifica en el front y cada tipo llama al endpoint que corresponde: la patente con el filtro exacto que ya existe; el DNI resolviendo primero el cliente; el número con el filtro que el back todavía no tiene. Como el back no soporta número ni DNI (PB-06), esas dos búsquedas quedan detrás de una constante de la feature hasta que el back las publique.

## 2. Alcance

**Entra**
- Campo de búsqueda con label visible, placeholder de ejemplo y helper.
- Clasificación del texto (número, DNI, patente o inválido).
- Búsqueda por patente exacta (`GET /api/polizas?patente=`).
- Búsqueda por DNI en dos pasos (`GET /api/clientes?dni=`, luego `GET /api/polizas?clienteId=`), detrás de la constante `BUSQUEDA_NUMERO_DNI_DISPONIBLE` (RV-43).
- Búsqueda por número (`GET /api/polizas?numero=`), detrás de la misma constante.
- Combinación con el filtro de estado de B-13.
- Tests de clasificación y de las requests.

**No entra**
- Filtro por plan (PB-06): sigue oculto.
- Cambios al listado, a la tabla o a la paginación (B-13).
- Parámetros nuevos del back: se piden a PB-06.
- Persistir el texto de búsqueda en la URL (ver DP-B14-04).

## 3. Dependencias

- **Oleada (INDEX):** 5.
- **Puede empezar sin esperar a:** —.
- **Depende de:** `US-FE-B-13`, `US-FE-T-04`, `US-FE-T-05`, `US-FE-T-11`, `US-FE-T-19`, `US-FE-T-24`, `US-FE-T-28`.
- **Pedidos al back (INDEX):** PB-06, PB-03 (MSW).
- **Degradaciones:** PB-06 bloquea número y DNI: el back actual ignora `numero` y `dni` y mostraría todas las pólizas, por eso la constante (DP-B14-01). PB-03: `GET /api/clientes?dni=` no está publicado y se mockea con T-24.
- **Workaround MSW (FB7.7):** `numero` y DNI con los mocks de T-28 y T-24.
- Nombres de funciones (`buscarClientesPorDni`, `listarPolizas`) son sugeridos; los exporta T-24 y T-28.

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB3, FB4, FB7.7 (MSW), FB7.11.
- `docs/frontend/tareas/INDEX.md`: fila `US-FE-B-14`; FC2 (hooks solo en `features/polizas/api/`), FC3 (el código de feature no lee `VITE_USE_MOCKS`), FC10, FC16; decisión D-03 no aplica aquí.
- `docs/frontend/pantallas/B9-polizas.md`: §6 (campo de búsqueda: reglas, recorte, mapeo, longitud), §5 (textos de la búsqueda), §8 (acción de búsqueda, debounce propuesto), §9 (endpoints), §12 (etiqueta visible), §13 D2 (búsqueda por número y DNI).
- `docs/frontend/contratos-api/polizas-cuotas-pagofacil.md`: §5.2 (`PolizaFiltroQuery`: `patente` exacta, `clienteId`), §5.2 nota sobre `patente` exacta.
- Contrato de `GET /api/clientes?dni=`: lo define T-24 en `packages/api/src/dto/clientes.ts`. Está Especificado y no hay un documento de `contratos-api/` que lo describa; si T-24 no lo tiene publicado, usar su mock.
- `docs/frontend/design-system.md`: §5.2 (Input: label, helper, estados), §8.2 (mensaje de error específico).
- `docs/frontend/pedidos-al-back.md`: PB-03, PB-06, PB-29 (DNI de 7 dígitos).

## 5. Archivos a crear o modificar

Todos bajo `frontend/apps/backoffice/src/features/polizas/`.

| Archivo | Acción |
|---|---|
| `components/BuscadorPolizas.tsx` | Crea. Input con label, helper y error |
| `lib/clasificarBusqueda.ts` | Crea. Función pura: texto → `{ tipo: 'numero' \| 'dni' \| 'patente' \| 'invalido', valor }` |
| `lib/busquedaDisponible.ts` | Crea. `export const BUSQUEDA_NUMERO_DNI_DISPONIBLE = false;` (DP-B14-01) |
| `api/useBusquedaPolizas.ts` | Crea. Combina la clasificación con las queries (DNI en dos pasos) |
| `pages/PolizasListadoPage.tsx` | Modifica (dueño B-13): agrega `BuscadorPolizas` encima de los filtros |
| `api/usePolizasListado.ts` | Modifica (dueño B-13): acepta `patente`, `clienteId` y `numero` (este último solo si la constante lo permite) |
| `**/*.test.ts(x)` | Crea |

Sin editar: `packages/api/**` (T-24, T-28).

## 6. Pasos de implementación

1. Leer la fila de B-14. Confirmar que B-13 está mergeado y que T-24 y T-28 tienen sus mocks.
2. **RED:** escribir los tests de `clasificarBusqueda` (§10).
3. `clasificarBusqueda(texto)`: recorta espacios y pasa a mayúsculas, luego aplica en orden:
   - Número: `/^POL-\d{7}$/` → `numero`. Ejemplo `POL-0000042`.
   - DNI: `/^\d{7,8}$/` → `dni` (DP-B14-05).
   - Patente: `/^([A-Z]{2}\d{3}[A-Z]{2}|[A-Z]{3}\d{3})$/` → `patente`.
   - Lo demás → `invalido`.
   Vacío → sin búsqueda (no es inválido).
4. `busquedaDisponible.ts`: `BUSQUEDA_NUMERO_DNI_DISPONIBLE = false`. Con `false`, un texto `numero` o `dni` no hace request: muestra DP-B14-01 ("Todavía no se puede buscar por número ni DNI."). Se cambia a `true` solo cuando PB-06 esté publicado (RV-43, RV-D29).
5. `useBusquedaPolizas(texto, filtros)`:
   - `patente`: pasa `patente` a `usePolizasListado`. Filtro exacto del back (Implementado).
   - `dni` (solo con la constante en `true`): `useQuery` que llama a `buscarClientesPorDni(dni)`. Si devuelve un cliente, pasa `clienteId` a `usePolizasListado`. Si devuelve cero clientes, la tabla queda vacía sin llamar al listado.
   - `numero`: con la constante en `true`, pasa `numero` a `usePolizasListado`. Con `false`, no hace nada.
6. `BuscadorPolizas`: `Input` con label `Buscar por número, DNI o patente`, placeholder `Ej. POL-0000042`, helper `Número de póliza, DNI del titular o patente.`. Dispara la búsqueda con 300 ms de debounce y con Enter (DP-B14-03). Si el texto es `invalido`, muestra el error de campo DP-B14-02 con `aria-invalid="true"`.
7. Al cambiar el texto de búsqueda: `pagina=1` y se conserva el filtro de estado de B-13 (los dos se combinan).
8. El texto de búsqueda vive en el estado del componente, no en la URL (DP-B14-04).
9. No se agrega el select de plan (PB-06).
10. GREEN, luego refactor. `lint`, `typecheck`, `test` y `build`.

## 7. Contrato con el back

| Llamada | Estado | Uso |
|---|---|---|
| `GET /api/polizas?patente=` | Implementado (coincidencia exacta, sin distinguir mayúsculas ni espacios de los bordes) | Búsqueda por patente. |
| `GET /api/clientes?dni=` | Especificado (US-F1-06; T-24 mock) | Resolver DNI a `clienteId`. |
| `GET /api/polizas?clienteId=` | Implementado | Pólizas del cliente. |
| `GET /api/polizas?numero=` | NO EXISTE (PB-06). Mock de T-28 | Búsqueda por número. Detrás de la constante. |
| `GET /api/polizas?dni=` | NO EXISTE (PB-06). No se usa | El DNI se resuelve en dos pasos. |

Tipos: `PolizaFiltroQuery` de T-28 (`patente`, `clienteId`, `estado`, `pagina`, `tamano`). `numero` no está en ese tipo hoy: se agrega en el mock de T-28 y se usa con un cast controlado dentro de `usePolizasListado`, solo cuando la constante es `true`. Cuando PB-06 se publique, T-28 agrega el campo al tipo.

Respuesta del cliente (`GET /api/clientes?dni=`, T-24): lista de `ClienteResponse` (`id`, `nombre`, `apellido`, `dni`). Si la lista está vacía, no hay póliza que mostrar.

Errores: 400 de validación del listado (B-13 los maneja). `GET /api/clientes?dni=` con DNI mal formado: alerta general con `detail` (no se marca el campo de búsqueda salvo que llegue `errors`, FC10).

## 8. Contenido de UI (literal)

| Zona | Texto |
|---|---|
| Label (visible) | `Buscar por número, DNI o patente` |
| Placeholder (ejemplo, no label) | `Ej. POL-0000042` |
| Helper | `Número de póliza, DNI del titular o patente.` |
| Error de formato | `Ingresá un número de póliza, un DNI o una patente válida.` (DP-B14-02) |
| Búsqueda por número o DNI no disponible | `Todavía no se puede buscar por número ni DNI.` (DP-B14-01) |
| Sin resultados | El texto de B-13 (`No hay pólizas que coincidan con los filtros.`) |

No hay texto de ejemplo fijo de DNI, número ni patente (FC4) más allá del placeholder del Figma.

## 9. Estados y casos borde

| Caso | Comportamiento |
|---|---|
| Campo vacío | Sin búsqueda; lista con el filtro de estado de B-13. |
| Patente válida | Request `patente=` con la clasificación; la tabla muestra el resultado. |
| Patente en minúsculas con espacios | Se recorta y se pasa a mayúsculas antes de consultar. |
| DNI de 7 u 8 dígitos (constante en `true`) | Dos pasos; si no hay cliente, tabla vacía; si hay, sus pólizas. Con `false`, ver fila anterior. |
| DNI con letras | `invalido`: error de formato, sin request. |
| Número o DNI con la constante en `false` | Sin request; mensaje DP-B14-01; la tabla no cambia. |
| Número con la constante en `true` | Request `numero=`. |
| Texto inválido | Error de campo; sin request. |
| Cambio de texto con debounce | Una sola request al terminar de escribir (300 ms). |
| Enter | Búsqueda inmediata; cancela el debounce pendiente. |
| Cambio de estado con búsqueda activa | Combina ambos filtros; `pagina=1`. |
| Error de `GET /api/clientes?dni=` (5xx o red) | `AlertaError` con `detail` y la tabla queda como estaba. |
| Permisos | Igual que B-13. |

## 10. Tests requeridos

Los tests de número y DNI sobreescriben `BUSQUEDA_NUMERO_DNI_DISPONIBLE` en `true`, salvo el de constante en `false`.

| Test | Afirma | Herramienta |
|---|---|---|
| `clasificar: POL-0000042 → numero` | Tipo y valor | Vitest |
| `clasificar: 30123456 y 30.123.456 → dni` | Solo dígitos de 7 u 8; el formato con puntos se rechaza | Vitest |
| `clasificar: AE789FG y ABC123 → patente` | Ambos formatos | Vitest |
| `clasificar: ae789fg con espacios → patente AE789FG` | Recorte y mayúsculas | Vitest |
| `clasificar: texto libre → invalido` | Sin tipo válido | Vitest |
| `clasificar: vacío → sin tipo` | No es inválido | Vitest |
| `búsqueda: patente hace GET con patente= y no con numero ni dni` | Query exacta de MSW | Testing Library + MSW |
| `búsqueda: DNI hace GET de clientes con dni= y luego polizas con clienteId=` (constante en `true`) | Orden y parámetros | Testing Library + MSW |
| `búsqueda: DNI sin cliente deja la tabla vacía sin pedir pólizas` (constante en `true`) | Conteo de requests a polizas en 0 | Testing Library + MSW |
| `búsqueda: número y DNI con la constante en false no hacen request` | Conteo en 0 y mensaje DP-B14-01 | Testing Library + MSW |
| `búsqueda: número con la constante en true envía numero=` | Query exacta (la constante se sobreescribe en el test) | Testing Library + MSW |
| `búsqueda: texto inválido muestra error de campo y no hace request` | `aria-invalid` y conteo en 0 | Testing Library + MSW |
| `búsqueda: debounce de 300 ms envía una sola request` | Conteo en 1 | Vitest (fake timers) + Testing Library |
| `búsqueda: Enter busca de inmediato` | Request sin esperar | Testing Library |
| `búsqueda: combina con el estado y reinicia pagina=1` | Query con ambos parámetros | Testing Library + MSW |
| `búsqueda: no aparece el select de plan` | Ausencia del select | Testing Library |
| `búsqueda: error del cliente muestra AlertaError y conserva la tabla` | `role="alert"` | Testing Library + MSW |
| `a11y: label visible y helper vinculado con aria-describedby` | Asociación | Testing Library |
| `a11y: sin violaciones con error de formato visible` | Axe sin violaciones | vitest-axe (T-19) |

## 11. Criterios de aceptación

1. El campo tiene la etiqueta visible `Buscar por número, DNI o patente`, el placeholder `Ej. POL-0000042` y el helper `Número de póliza, DNI del titular o patente.`.
2. Una patente válida (en cualquier mayúscula o minúscula, con espacios en los bordes) consulta `GET /api/polizas?patente=` con el valor en mayúsculas.
3. Con la constante en `true`, un DNI de 7 u 8 dígitos consulta primero `GET /api/clientes?dni=` y después `GET /api/polizas?clienteId=`.
4. Con la constante en `true`, un DNI sin cliente deja la tabla vacía sin pedir pólizas.
5. Con `BUSQUEDA_NUMERO_DNI_DISPONIBLE = false`, un número o un DNI no hacen request y muestran el mensaje DP-B14-01.
6. Con `BUSQUEDA_NUMERO_DNI_DISPONIBLE = true`, un número consulta `GET /api/polizas?numero=`.
7. Un texto que no es número, DNI ni patente muestra el error de campo y no hace request.
8. La búsqueda se dispara 300 ms después de la última tecla o al presionar Enter; no hay una request por tecla.
9. La búsqueda se combina con el filtro de estado y reinicia `pagina` a 1.
10. No aparece el select de plan.
11. El texto de búsqueda no aparece en la URL.
12. Todos los tests de §10 están en verde, sin axe violations.
13. `lint`, `typecheck`, `test` y `build` del backoffice están en verde.

## 12. Verificación manual

1. `VITE_USE_MOCKS=true npm run dev -w apps/backoffice`, sesión de Empleado, pantalla `/polizas`.
2. Escribir una patente del mock y verificar en Network una sola request `patente=`.
3. Con la constante en `true` (solo en el entorno de desarrollo del equipo), escribir un DNI del mock: dos requests (clientes y pólizas). Con `false` (rama principal), no hay request.
4. Escribir `POL-0000042` con la constante en `false`: mensaje y sin request. (Con la constante en `true` se verifica el request, solo en el entorno de desarrollo del equipo.)
5. Escribir `hola 123`: error de formato y sin request.

Confirmar al responsable antes del PR. Recordar que la constante queda en `false` en la rama principal hasta PB-06.

## 13. Decisiones pendientes

- **DP-B14-01** Búsqueda por número y DNI detrás de constante (RV-43; RV-D29: no se activa con `VITE_USE_MOCKS`). Default: `BUSQUEDA_NUMERO_DNI_DISPONIBLE = false` hasta que PB-06 publique `numero`. Motivo: el back actual ignora el parámetro y mostraría todas las pólizas. Texto cuando está oculta: `Todavía no se puede buscar por número.`
- **DP-B14-02** Texto de error de formato (B9 §6, NO DEFINIDO). Default: `Ingresá un número de póliza, un DNI o una patente válida.`
- **DP-B14-03** Cuándo se dispara la búsqueda (B9 §8, NO DEFINIDO). Default: debounce de 300 ms y Enter.
- **DP-B14-04** Texto en la URL. Default: no se guarda, para no exponer DNI en la URL.
- **DP-B14-05** (RV-D27, default aplicado) Longitud del DNI. PB-29 señala que el back público exige 8 dígitos. Default: acepta 7 u 8, porque el empleado puede tener clientes con DNI de 7 dígitos; el back decide si no encuentra nada.
- **PB-06** (bloquea número y DNI como filtro directo): cuando se publique, se simplifica el DNI a un solo request y se activa la constante.
- **PB-03** (degrada): `GET /api/clientes?dni=` mockeado hasta su publicación.

## 14. Riesgos y errores comunes

- Enviar `numero=` al back actual: ignora el parámetro y devuelve todas las pólizas como si fuera la búsqueda (riesgo de dato incorrecto). Por eso la constante.
- Hacer el DNI en un solo request a `polizas?dni=`: el back no lo tiene (PB-06).
- Clasificar `AE789FG` como número por error de orden de las reglas: el orden es número, DNI, patente.
- Aceptar patentes con guion o espacio interno: el formato no las admite.
- Hacer una request por tecla sin debounce.
- Llevar el texto de búsqueda a la URL y exponer el DNI.
- Olvidar que un DNI sin cliente no tiene que llamar al listado (una lista de `clienteId` vacía devolvería todo).

## 15. Definición de terminado

- `lint`, `typecheck`, `test` y `build` en verde.
- Todos los criterios de §11 tildados con evidencia observada.
- Accesibilidad revisada con T-19.
- Constante `BUSQUEDA_NUMERO_DNI_DISPONIBLE` documentada en el código con referencia a PB-06.
- Pasos de §12 entregados y confirmados antes del PR a `development`.

## 16. Observaciones al índice

- Resuelto (RV-43): la fila dice que número y DNI quedan detrás de `BUSQUEDA_NUMERO_DNI_DISPONIBLE` hasta PB-06 (DP-B14-01), y T-04 y T-05 se agregan a "Depende de".
- ABIERTO: confirmar la dependencia de PB-03 para el DNI (mock de T-24). Motivo: la observación no aparece en REVISION.md ni en FB8; no hay cambio de ficha pendiente.
