# US-FE-W-04: Mi póliza: resumen y selección de cuotas (escritorio)

Tipo W · Oleada 4 · Tamaño M · Rama sugerida `feature/US-FE-W-04-mi-poliza-escritorio` · Tarjeta Trello `US-FE-W-04`

## 1. Objetivo

Al terminar, `/poliza` muestra en escritorio (≥ 768 px) los datos de la póliza, la tabla de cuotas con casillas para las impagas, el resumen con el total de las cuotas elegidas y dos acciones: "Pagar seleccionadas" (hacia W4) y "Descargar cupón Pago Fácil" (hacia W5). Sin estado de navegación válido, redirige a `/consultar-poliza`. Para el cliente anónimo que ya consultó su póliza en W2. No llama a la API: usa el resultado que W2 dejó en `location.state`.

## 2. Alcance

**Entra**
- Página `PolizaPublicaPage` de la web: guarda de estado, selector de vista (escritorio en esta tarea) y composición.
- Componentes de escritorio: `DatosPoliza`, `TablaCuotas`, `ResumenPago`, `CicloPoliza`.
- Hook de selección `useSeleccionCuotas` (total, tope de 24 y "Seleccionar impagas").
- Hook `useEsEscritorio` en `shared/hooks/useMediaQuery.ts` (la primera tarea que lo necesite lo crea; aquí es W-04).
- Navegación a W4 y W5 con el mismo estado.

**NO entra**
- Vista móvil (390 px), lista de cuotas móvil y barra de pago fija: US-FE-W-05. En esta tarea la vista de escritorio se muestra en todos los anchos y W-05 agrega la rama móvil.
- Pantallas W4 y W5: US-FE-W-06 y US-FE-W-07.
- Llamada a `POST /api/publico/consulta`: no se repite (W-03 ya la hizo).
- Titular y DNI del Figma: no hay dato en el back (PB-07, D-10).
- Cupón (`POST /api/publico/cupon`): lo llama W-07, no W-04.

## 3. Dependencias

- **Puede empezar sin esperar a:** US-FE-W-06 y US-FE-W-07 (solo se navega a sus rutas; no se importan).
- **Depende de:**
  - US-FE-T-05 (`Button` Primary/Secondary, `Badge/Estado`).
  - US-FE-T-06 (`Table/Header` y `Table/Row` para la tabla de cuotas; ver paso 5).
  - US-FE-T-07 (`CardWidget`, `Dato`).
  - US-FE-T-09 (`formatearImporte`, `formatearFechaDateOnly`, `formatearDni`).
  - US-FE-T-11 (MSW base para los tests).
  - US-FE-T-18 (`PublicLayout`, `PublicNav`, `PublicFooter`).
  - US-FE-T-19 (harness de accesibilidad).
  - US-FE-W-03 (`features/polizas/index.ts` exporta `EstadoMiPoliza`, `EstadoPagoPublico`, `leerEstadoNavegacion`).
- **Bloqueada por pedidos al back:** PB-07 (degrada): no hay titular; se omite el bloque (D-10).
- **Workaround MSW:** no aplica; no hay request.

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB3 (`pages` delgada, hooks en el feature), FB4 (fechas y dinero), FB7.4 (`DateOnly` sin zona).
- `docs/frontend/tareas/INDEX.md`: FC9 (importes y fechas con formateadores), FC16 (accesibilidad), D-04, D-10, D-19, D-26 (no aplica aquí), D-30, D-33.
- `docs/frontend/pantallas/W3-mi-poliza.md`:
  - §2 (ruta `/poliza`, datos por `location.state`, redirección si no hay estado),
  - §3.1 (estructura desktop completa: columnas 1 y 300, datos, cuotas, resumen, ciclo; tabla de 12 filas con su tabla de datos),
  - §4 (componentes propios y `Badge/Estado`),
  - §5 (textos literales desktop),
  - §6 (selección: solo impagas; máximo 24; mínimo 1 para pagar),
  - §7 (estados),
  - §8 (acciones y navegación),
  - §9.1 (cada campo de `ConsultaPublicaResponse` y su transformación),
  - §10 (RN07, RN08, RN10, RN11),
  - §12 (accesibilidad de tabla y casillas),
  - §13 (dudas 1, 2, 3, 4, 5, 9, 10, 11 y 13).
- `docs/frontend/contratos-api/seguridad-clientes-publico.md` §6.3 (tipos de `ConsultaPublicaResponse`) y §6.4 (estados de póliza y cuota).
- `docs/frontend/design-system.md`: §5.4 (`Badge/Estado`: valores y colores; "Vencida" usa `status/vencida` según §5.4, ver D-23), §5.6 no aplica, §5.13 (`Card/Widget`), §5.12 (`Table`), §7.4 (breakpoint 768 px).
- `docs/frontend/contratos-api/convenciones-transversales.md` §5.3 (`DateOnly` sin zona) y §5.4 (importes: el back es la fuente del total).

## 5. Archivos a crear o modificar

Todos bajo `frontend/apps/web-publica/`:

| Archivo | Acción | Dueño |
|---|---|---|
| `src/shared/hooks/useMediaQuery.ts` (y `useEsEscritorio`) | crear | W-04 (primera en necesitarlo) |
| `src/shared/hooks/useMediaQuery.test.ts` | crear | W-04 |
| `src/features/polizas/routes.tsx` | modificar: agregar la ruta `/poliza` → `PolizaPublicaPage` (W-03 dejó el stub) | W-03 (dueño); W-04 edita en su PR y lo declara como dependencia (FC1) |
| `src/features/polizas/index.ts` | modificar: exportar `PolizaPublicaPage` solo si hace falta; no exportar componentes internos | W-03 |
| `src/features/polizas/pages/PolizaPublicaPage.tsx` | crear | W-04 |
| `src/features/polizas/components/DatosPoliza.tsx` | crear | W-04 |
| `src/features/polizas/components/TablaCuotas.tsx` | crear (escritorio) | W-04 |
| `src/features/polizas/components/ResumenPago.tsx` | crear (escritorio) | W-04 |
| `src/features/polizas/components/CicloPoliza.tsx` | crear | W-04 |
| `src/features/polizas/hooks/useSeleccionCuotas.ts` | crear (hook de UI en `hooks/`, RV-D26) | W-04 |
| `src/features/polizas/hooks/useSeleccionCuotas.test.ts` | crear | W-04 |
| `src/features/polizas/components/BadgeEstadoPoliza.tsx` | crear (mapa `estado` → `Badge/Estado`; ver paso 3) | W-04 |
| `src/shared/formato/listaCuotas.ts` | crear (W-04 es la primera en usarlo; W-05, W-06 y W-07 lo reusan) | W-04 (RV-47) |
| `src/features/polizas/pages/PolizaPublicaPage.test.tsx` | crear | W-04 |

Usa sin modificar: `packages/ui` (T-05, T-06, T-07), `packages/api` (T-09), `apps/web-publica/src/app/*` (T-17, T-18). No editar `package.json` (FC17).

## 6. Pasos de implementación

1. `useMediaQuery(query)` con `window.matchMedia` y limpieza del listener. `useEsEscritorio()` devuelve `useMediaQuery('(min-width: 768px)')`. Si no existe `matchMedia` (jsdom), devolver `true`. Tests con `matchMedia` mockeado.
2. `PolizaPublicaPage`:
   - Lee `useLocation().state` y lo pasa por `leerEstadoNavegacion`. Si devuelve `null`: `<Navigate to="/consultar-poliza" replace />`.
   - Si la póliza no tiene cuotas (`cuotas.length === 0`): el estado de vacío de la sección 9.
   - Compone el encabezado (`h1` "Mi póliza", número y `BadgeEstadoPoliza`) y, en escritorio, la fila principal: columna izquierda (`DatosPoliza` + `TablaCuotas` + `CicloPoliza`) y columna derecha de 300 px (`ResumenPago`).
   - `PublicFooter` al final (T-18).
   - La rama móvil (`useEsEscritorio() === false`) queda para W-05; en esta tarea se renderiza la misma vista de escritorio.
3. `BadgeEstadoPoliza`: mapea `EstadoPoliza` → `EstadoBadgeValue` de T-05: `VIGENTE` → 'Vigente', `PENDIENTE` → 'Pendiente', `SUSPENDIDA` → 'Suspendida', `CANCELADA` → 'Cancelada', `VENCIDA` → 'Vencida'. Los textos de Suspendida, Cancelada y Vencida son propuestas (DN-W4-4).
4. `useSeleccionCuotas(cuotas)`:
   - Elegible: `estado` `PENDIENTE` o `VENCIDA`. `PAGADA` y `ANULADA` no son elegibles (RN11).
   - Tope de 24 cuotas (`MaximoCuotas`): al llegar a 24, las demás casillas quedan deshabilitadas (DN-W4-6).
   - `seleccionarImpagas()`: agrega todas las elegibles hasta el tope, sin quitar las ya marcadas.
   - Total: suma de `total` de las cuotas seleccionadas en **centavos enteros** (`Math.round(total * 100)`), y se formatea con `formatearImporte`. No usar `number` para sumar plata sin redondeo (convenciones §5.4).
   - Devuelve `cuotaIds` ordenados por `numero`, `total`, `cantidadSeleccionadas`, `numerosSeleccionados` (para la lista "8 y 9").
5. `TablaCuotas` (escritorio): `<table>` con `<caption class="sr-only">Cuotas de la póliza</caption>`, encabezados `th scope="col"`: casilla (texto accesible "Seleccionar"), "Cuota", "Vencimiento", "Importe", "Estado". Columnas en el orden del Figma. Las filas `PAGADA` y `ANULADA` tienen la celda de casilla vacía (sin checkbox). Las demás tienen `<input type="checkbox">` con etiqueta "Seleccionar cuota N de T" (sección 8).
   - "Cuota N de T" con `T = cuotas.length`.
   - Vencimiento con `formatearFechaDateOnly(vencimiento)`. Si `recargo > 0`, agregar ", recargo 5%" (texto fijo RN08).
   - Importe: `formatearImporte(total)` (el total, no `importe`; W3 §9.1).
   - Estado: `BadgeEstadoCuota` (PAGADA → 'Pagada', PENDIENTE → 'Pendiente', VENCIDA → 'Vencida', ANULADA → 'Anulada').
   - Encabezado de la tabla con tokens `surface-subtle`; filas con borde inferior `border-hairline`.
6. `DatosPoliza`: tarjeta con título "Datos de la póliza" (H3) y campos: "Vehículo" (`marca modelo anio` y "Patente {patente}"), "Plan" (`${plan.nombre} (${plan.codigo})`), "Vigencia" (`${dd/MM/yyyy} a ${dd/MM/yyyy}` y "{N} meses"). **No** renderizar "Titular" ni DNI (PB-07). Los meses se calculan entre `vigenteDesde` y `vigenteHasta` con los componentes de fecha, sin `Date` con zona (DN-W4-5).
7. `CicloPoliza`: tarjeta con "Ciclo de la póliza", la fila "Pendiente" › "Vigente" y el texto "Pasa de Pendiente a Vigente al pagarse la cuota 1." (fijo, DN-W4-7).
8. `ResumenPago`: `CardWidget` "Resumen de pago"; "Cuotas seleccionadas" con `numerosSeleccionados` formateados (sección 8); "Total a pagar" con el importe en `Mono-lg`; `aria-live="polite"` en el total; botón "Pagar seleccionadas" (Primary, M, ancho completo, `disabled` sin selección); botón "Descargar cupón Pago Fácil" (Secondary, ancho completo, `disabled` sin selección).
   - "Pagar seleccionadas": `navigate('/poliza/pagar/medio-de-pago', { state: { dni, numeroPoliza, consulta, cuotaIds } })`.
   - "Descargar cupón Pago Fácil": `navigate('/poliza/pagar/pago-facil', { state: { dni, numeroPoliza, consulta, cuotaIds } })`.
   - Ambos pasan el mismo estado (`EstadoPagoPublico`).
9. `CicloPoliza`, `DatosPoliza` y `ResumenPago` van en una sola carpeta `components/` del feature (FB3).
10. Escribir los tests de la sección 10 y ejecutarlos.

## 7. Contrato con el back

No hay request en esta tarea. Los datos llegan de W2 en `location.state` y tienen la forma de `ConsultaPublicaResponse` (`seguridad-clientes-publico.md` §6.3, dueño de tipos: US-FE-T-31 en `@nexa/api`).

Estados de póliza y de cuota que se usan (`seguridad-clientes-publico.md` §6.4):

- Póliza: `PENDIENTE`, `VIGENTE`, `SUSPENDIDA`, `CANCELADA`, `VENCIDA`.
- Cuota: `PENDIENTE`, `VENCIDA`, `PAGADA`, `ANULADA`.

El back ya ordena `cuotas` por `numero`. El front no recalcula recargos ni estados (W3 §9.1, nota).

## 8. Contenido de UI (escritorio)

| Zona | Texto literal |
|---|---|
| `h1` | Mi póliza |
| Número y estado | `POL-0000042` (monoespaciada) · badge `Vigente` |
| Card "Datos de la póliza" (H3) | Datos de la póliza |
| Campo Vehículo | Vehículo · `Toyota Etios 2019` · `Patente AB123CD` (formato: `${marca} ${modelo} ${anio}` y `Patente ${patente}`) |
| Campo Plan | Plan · `Terceros Completo (TC)` (formato: `${nombre} (${codigo})`) |
| Campo Vigencia | Vigencia · `12 meses` · `01/03/2026 a 01/03/2027` |
| Cuotas (H3) | Cuotas |
| Acción de cuotas (propuesta del Figma) | Seleccionar impagas |
| Ayuda | Vencen el día 10 de cada mes. Recargo del 5% al vencer. |
| Encabezados de tabla | Cuota · Vencimiento · Importe · Estado |
| Fila | Cuota N de T (ej. `Cuota 8 de 12`) |
| Vencimiento con recargo | `10/10/2026, recargo 5%` |
| Badges | Pagada · Pendiente · Vencida · Anulada |
| Casilla (aria-label) | Seleccionar cuota N de T (propuesta, W3 §12) |
| Card "Resumen de pago" (H3) | Resumen de pago |
| Resumen, etiqueta | Cuotas seleccionadas |
| Resumen, valor | `8 y 9` (ver lista abajo) |
| Resumen, total | Total a pagar |
| Resumen, importe | `$ 51.250,00` |
| Botón | Pagar seleccionadas |
| Botón secundario | Descargar cupón Pago Fácil |
| Ciclo (H3) | Ciclo de la póliza |
| Ciclo, estados | Pendiente › Vigente |
| Ciclo, texto | Pasa de Pendiente a Vigente al pagarse la cuota 1. |
| Sin selección (propuesta) | — (guión) en "Cuotas seleccionadas" y `$ 0,00` en total |
| Sin cuotas (propuesta, NO DEFINIDO) | Esta póliza no tiene cuotas para mostrar. |

**Lista de números de cuota (propuesta, NO DEFINIDO en Figma para 3 o más):** 1 cuota → `8`; 2 cuotas → `8 y 9`; 3 o más → `8, 9 y 10`. Se comparte con W-05, W-06 y W-07 desde `shared/formato/listaCuotas.ts`.

Textos omitidos a propósito: "Titular", "Tomás Iturralde", "DNI 30.123.456" (PB-07, D-10), "Pago Fácil acredita hasta 72 h hábiles (dato de referencia)." (DN-W4-8).

## 9. Estados y casos borde

| Estado | Comportamiento |
|---|---|
| Sin `location.state` o inválido | Redirige a `/consultar-poliza` (W2 §2). No hay estado de carga. |
| Póliza sin cuotas | Texto de la sección 8; no hay tabla ni resumen. |
| Sin selección | "Pagar seleccionadas" y "Descargar cupón" deshabilitados; total `$ 0,00`. |
| Selección de 1 a 24 | Botones activos; el total se actualiza en el momento. |
| Tope de 24 | Las casillas restantes quedan `disabled`; se mantiene la selección. |
| Póliza `VENCIDA`, `CANCELADA`, `SUSPENDIDA` | Se muestra el badge y las cuotas con su estado. No se bloquea la selección de las cuotas elegibles en esta tarea (DN-W4-9). |
| Cuota con recargo | Badge "Vencida" y `, recargo 5%` en el vencimiento; el importe es `total` (con recargo). |
| Cuota `ANULADA` | Badge "Anulada", sin casilla. |
| Recarga de la página | El estado persiste en el historial del router; si no hay estado válido, redirige (sección 9, primera fila). |
| Error de la tabla | No aplica: no hay request. |

Accesibilidad de la tabla: `<table>` con `th scope="col"`. La celda de casilla de la cabecera tiene texto accesible "Seleccionar" (solo lector de pantalla).

## 10. Tests requeridos

Vitest + Testing Library con `MemoryRouter` y `initialEntries` con `state`. Un test por regla de UI (FC5).

| Test | Afirma | Herramienta |
|---|---|---|
| `sin estado redirige a /consultar-poliza` | la URL final es `/consultar-poliza` | MemoryRouter |
| `estado inválido (sin consulta) redirige` | igual que arriba | MemoryRouter |
| `no muestra Titular ni DNI del titular` | no aparece "Titular" ni "DNI" | Testing Library |
| `vigencia formatea DateOnly sin desfase de zona` | con `vigenteDesde: "2026-03-01"` aparece "01/03/2026" | Testing Library |
| `calcula 12 meses entre vigenteDesde y vigenteHasta` | aparece "12 meses" | Testing Library |
| `muestra una fila por cuota con "Cuota N de T"` | 12 filas con sus textos | Testing Library |
| `solo PENDIENTE y VENCIDA tienen casilla` | 9 casillas en el fixture de 12 (1 a 7 pagadas, 8 y 9 elegibles, etc.) | Testing Library |
| `la cuota VENCIDA muestra total con recargo y el texto de recargo` | "$ 26.250,00" y "recargo 5%" | Testing Library |
| `seleccionar cuotas 8 y 9 actualiza cuotas seleccionadas y total` | "8 y 9" y "$ 51.250,00" con `aria-live` | Testing Library + userEvent |
| `Seleccionar impagas marca solo PENDIENTE y VENCIDA` | las casillas elegibles quedan marcadas; las pagadas no existen | Testing Library |
| `el tope de 24 deshabilita las casillas restantes` | con 25 cuotas sintéticas, se pueden marcar 24 | Vitest (hook) + Testing Library |
| `el total se suma en centavos` | `26.250 + 25.000` da `51.250,00` sin error de punto flotante | Vitest (hook) |
| `Pagar seleccionadas deshabilitado sin selección` | `disabled` | Testing Library |
| `Pagar seleccionadas navega a W4 con el estado y cuotaIds ordenados` | ruta `/poliza/pagar/medio-de-pago`, `state.cuotaIds` por número | MemoryRouter |
| `Descargar cupón navega a W5 con el mismo estado` | ruta `/poliza/pagar/pago-facil` | MemoryRouter |
| `el badge de la póliza usa el texto del mapa` | "Vigente" para VIGENTE | Testing Library |
| `no escribe en storage` | spies sin llamadas | spies |
| `no tiene violaciones de accesibilidad` | axe sobre la tabla con selección | vitest-axe |

## 11. Criterios de aceptación

1. Sin estado válido, `/poliza` redirige a `/consultar-poliza` (test).
2. La vista de escritorio muestra datos de la póliza, tabla de cuotas, resumen y ciclo con los textos de la sección 8 (tests).
3. No se muestra "Titular" ni DNI del titular (test; PB-07).
4. Las fechas `DateOnly` se formatean sin desfase de zona (test).
5. Solo las cuotas PENDIENTE y VENCIDA tienen casilla; PAGADA y ANULADA no (test).
6. El total usa el campo `total` y se suma en centavos enteros (tests).
7. El tope de 24 cuotas se respeta en la UI (test).
8. "Seleccionar impagas" marca solo las elegibles, hasta el tope (test).
9. "Pagar seleccionadas" y "Descargar cupón" están deshabilitados sin selección y navegan con el mismo estado y `cuotaIds` ordenados (tests).
10. Ningún dato se escribe en storage ni en la URL (test).
11. La tabla tiene `caption`, `th scope="col"` y casillas con etiqueta accesible (test).
12. `lint`, `typecheck`, `test` y `build` en verde (FC8).

## 12. Verificación manual

1. Consultar en W2 una póliza de seed (DNI 30123456, POL-0000001) y llegar a `/poliza`.
2. Verificar en escritorio: título, número con badge, datos sin titular, tabla con 12 filas y casillas en las impagas.
3. Marcar cuotas: "Cuotas seleccionadas" y el total cambian al momento.
4. Pulsar "Seleccionar impagas": quedan marcadas las pendientes y vencidas.
5. Pulsar "Descargar cupón Pago Fácil": llega a `/poliza/pagar/pago-facil` (la pantalla W5 puede no existir aún).
6. Abrir `/poliza` en una pestaña nueva: redirige a `/consultar-poliza`.
7. Confirmar al equipo el default del texto "Seleccionar impagas" y del tope de 24 antes del PR (DN-W4-6).

## 13. Decisiones pendientes con su default

| ID | Tema | Default | Fuente |
|---|---|---|---|
| D-04 | Cupón con varias cuotas | Se navega con todas las cuotas; W-07 muestra un cupón por cuota | INDEX D-04, W3 §13.5 |
| D-10 | Titular | Se omite el bloque (sin dato) | INDEX D-10, PB-07 |
| D-23 | Color de "Vencida" | Tokens de `status/vencida` (design-system §5.4) | INDEX D-23 |
| D-30 | Texto del botón | "Pagar seleccionadas" en escritorio (W-05 usa "Pagar" en móvil) | INDEX D-30 |
| D-33 | Rail "Cuenta" | No aplica a W3 | INDEX D-33 |
| DN-W4-1 | Tope de 24 | Las casillas restantes quedan `disabled` con aviso propuesto "Podés pagar hasta 24 cuotas por vez." (propuesta, NO DEFINIDO; confirmar con diseño, RV-D21) | W3 §6; RV-D21 |
| DN-W4-2 | Botón sin selección | `disabled` | W3 §7 |
| DN-W4-3 | "Seleccionar impagas" si ya hay selección | Agrega las elegibles; no quita las marcadas | W3 §6 |
| DN-W4-4 | Textos de Suspendida, Cancelada y Vencida (póliza) | "Suspendida", "Cancelada", "Vencida" (propuesta; colores de §5.4) | W3 §13.3 |
| DN-W4-5 | Meses de vigencia | Se calculan entre `vigenteDesde` y `vigenteHasta` | W3 §9.1, §13.2 |
| DN-W4-6 | Orden de la lista de cuotas en el resumen | Por `numero` ascendente, como devuelve el back | W3 §9.1 |
| DN-W4-7 | Bloque "Ciclo de la póliza" | Texto fijo como indica el Figma (propuesta de §13.11: fijo) | W3 §13.11 |
| DN-W4-8 | Nota "Pago Fácil acredita hasta 72 h hábiles (dato de referencia)." | Se omite hasta que alguien confirme el dato | W3 §13.10 |
| DN-W4-9 | Selección en pólizas no vigentes | Permitida para cuotas elegibles | W3 §7 |

## 14. Riesgos y errores comunes

- **Dinero en `number`:** sumar con `+` acumula errores de punto flotante. Sumar en centavos enteros (paso 4).
- **Fechas con `new Date('yyyy-MM-dd')`:** en Argentina muestra el día anterior. Usar `formatearFechaDateOnly` (convenciones §5.3).
- **Mostrar el `importe` en lugar del `total`:** la cuota 8 debe mostrar 26.250,00.
- **Titular inventado:** no escribir "Tomás Iturralde" ni ningún nombre: no hay dato.
- **Navegar con el DNI en la URL:** solo `state`. Un test debe verificar que `location.search` queda vacío.
- **Doble fuente de estado:** no volver a llamar a `consultar` desde W-04; si el usuario recarga, el `state` del historial basta.
- **Import de internos de otro feature:** W-06 y W-07 importan `EstadoPagoPublico` desde `features/polizas/index.ts`, no desde `types/`.

## 15. Definición de terminado

- `lint`, `typecheck`, `test` y `build` en verde (FC8).
- Accesibilidad con US-FE-T-19: tabla y casillas accesibles; el total con `aria-live`; sin violaciones de axe.
- Sin secretos; ningún dato del cliente en storage ni URL.
- Los 12 criterios de la sección 11 tildados con evidencia (FC6).
- DN-W4-1, DN-W4-4 y DN-W4-8 comunicados a diseño antes del PR.

## 16. Observaciones al índice

- Resuelto (RV-D26 / D-39): FB3 suma `hooks/` a la estructura de feature; `useSeleccionCuotas` va en `features/polizas/hooks/` (sección 5).
- Resuelto (RV-47): `shared/formato/listaCuotas.ts` tiene dueña fija, W-04 (primera en usarlo); W-05, W-06 y W-07 lo reusan y lo declaran.
- Resuelto (RV-45): W3 §8 debe incluir `consulta` porque W-04 §9.1 lo necesita; el estado de W-03 ya lo transporta.
- Resuelto (RV-68 / D-35): el breakpoint es 768 px (design-system §7.4, D-35) y lo usan T-18 y W-04.
