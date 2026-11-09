# US-FE-B-12: Emitir póliza

Tipo: B · Oleada: 5 · Tamaño: M · Rama sugerida: `feature/US-FE-B-12-emitir-poliza` · Tarjeta Trello: `US-FE-B-12`

## 1. Objetivo

El Empleado o Administrador emite una póliza **Pendiente** desde `/polizas/nueva?cotizacionId=<guid>`. La pantalla muestra el resumen de la cotización, la vigencia (1, 6 o 12 meses), una vista previa de las cuotas, un panel de validaciones y un aviso. Al confirmar, `POST /api/polizas` devuelve 201 y la pantalla navega al detalle de la póliza (B-15). La emisión no cobra nada: la cuota 1 se cobra después (D10 de B8).

La vista previa de fechas de cuotas queda marcada como "a confirmar" hasta resolver PB-20 (contradicción Figma ↔ código). No se muestran las fechas del Figma.

## 2. Alcance

**Entra**
- Ruta `/polizas/nueva` (estática, antes de `/polizas/:id`; FC14), dentro del feature `polizas` (B-13 es dueño de `index.ts` y `routes.tsx`).
- Carga de la cotización (`GET /api/cotizaciones/{id}`) y de sus datos asociados (vehículo, plan, cliente).
- Resumen de cotización (cliente, vehículo, plan, prima mensual y validez).
- Selector de vigencia (1, 6 o 12 meses) con grupo de radios.
- Fecha de inicio de solo lectura (hoy, en Argentina).
- Tabla de cuotas previa (cantidad, importe y estado) con fechas "a confirmar".
- Panel de validaciones (sin verdes estáticos) y nota de emisión.
- `POST /api/polizas` con `{ cotizacionId, vigenciaMeses }`, sin reintento automático.
- Errores del back mostrados con su `detail`.

**No entra**
- Cobro de la cuota 1 (B-17 y B-18).
- Detalle de la póliza emitida (B-15).
- Cálculo de fechas de cuotas en el front (PB-20: se decide en el back).
- Endpoint de validación previa (D4 de B8): no existe; el back valida al emitir.
- Campana y Topbar (T-16).

## 3. Dependencias

- **Oleada:** 5.
- **Depende de:** US-FE-B-13, US-FE-T-04, US-FE-T-05, US-FE-T-06, US-FE-T-07, US-FE-T-08, US-FE-T-09, US-FE-T-10, US-FE-T-11, US-FE-T-13, US-FE-T-16, US-FE-T-19, US-FE-T-24, US-FE-T-26, US-FE-T-27, US-FE-T-28.
- **Puede empezar sin esperar a:** US-FE-B-10, US-FE-B-11 (solo navegación: la ruta de la cotización es la de B-10).
- **Bloqueada por pedidos al back:** PB-20 impide mostrar fechas definitivas en la vista previa. La emisión puede avanzar con la leyenda de fechas a confirmar.

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB3, FB4 (enums y fechas), FB5, FB7.9 (mutaciones sensibles), FB7.10, FB7.11.
- `docs/frontend/tareas/INDEX.md`: fila `US-FE-B-12`; FC2, FC9, FC10, FC11, FC14, FC16; "Ownership" (`features/polizas/`); D-03 y D-29.
- `docs/frontend/pantallas/B8-emitir-poliza.md`: §2 (ruta y guardas), §3 (estructura, para orientación), §4 (componentes propios), §5 (textos literales y textos de error del back), §6 (campos y validaciones), §7 (estados), §8 (acciones), §9 (endpoints, datos y tabla de errores), §10 (RN02 a RN07, RN19), §11 y §12 (accesibilidad). §13: D1, D2 (fechas), D3 (fecha de inicio), D4 (validaciones), D5 (vigencia por defecto), D6, D7, D9 (formato de cuota), D10 (cobro), D11 (cotización vencida), D12 (enums), D13 (RN19), D14 (cliente).
- `docs/frontend/contratos-api/polizas-cuotas-pagofacil.md`: §1.3 (enums), §1.5 (fechas), §4.1 (request), §4.2 (validaciones y mensajes exactos), §4.3 (qué se genera), §4.5 (respuesta 201), §5.3 (`PolizaDetalleResponse`).
- `docs/frontend/contratos-api/vehiculos-planes-cotizaciones.md`: §6.2 (`CotizacionDto`), §7 (cotización → póliza: `cotizacionId` es el `idCotizacion`), §2.3 (vehículo), §4.2 (plan por id).
- `docs/frontend/design-system.md`: §5.1 (Button con icono), §5.5 (Chip: Seleccionado y Sin seleccionar), §5.4 (Badge), §5.12 (Table), §8.2, §8.3.
- `docs/frontend/pedidos-al-back.md`: PB-14, PB-16, PB-20 (contradicción), PB-27.

## 5. Archivos a crear o modificar

Todos bajo `frontend/apps/backoffice/src/features/polizas/` (dueño de `index.ts` y `routes.tsx`: B-13).

| Archivo | Acción |
|---|---|
| `routes.tsx` | Modifica (dueño B-13): agrega `/polizas/nueva` antes de cualquier ruta dinámica |
| `pages/EmitirPolizaPage.tsx` | Crea |
| `components/CotizacionResumen.tsx` | Crea. 4 columnas: Cliente, Vehículo, Plan, Prima mensual |
| `components/VigenciaSelector.tsx` | Crea. Radiogroup 1, 6 y 12 meses |
| `components/CuotasPreview.tsx` | Crea. Tabla de cuotas previas |
| `components/ValidacionesPanel.tsx` | Crea. Cuatro textos sin estado (DP-B12-04) |
| `components/EmisionNota.tsx` | Crea. Nota de emisión y error |
| `components/AccionesEmision.tsx` | Crea. Emitir y Cancelar |
| `schemas/emisionSchema.ts` | Crea. zod para la vigencia |
| `api/useCotizacionEmision.ts` | Crea. Carga cotización + vehículo + plan + cliente |
| `api/useEmitirPoliza.ts` | Crea. `useMutation`, `retry: 0` |
| `index.ts` | Modifica (dueño B-13): sin exports nuevos obligatorios |
| `**/*.test.ts(x)` | Crea |

Sin editar: `packages/api/**` (T-24, T-26, T-27, T-28) y `packages/ui/**`.

## 6. Pasos de implementación

1. Leer la fila de B-12 y confirmar que B-13 está mergeado (feature y `routes.tsx`), y que T-04 a T-11, T-13, T-16, T-19, T-24, T-26, T-27 y T-28 están mergeados (o sus mocks).
2. **RED:** escribir los tests `schema:` y `form:` de §10.
3. `emisionSchema`: `vigenciaMeses: z.union([z.literal(1), z.literal(6), z.literal(12)])`. Sin valor por defecto (DP-B12-02).
4. Hook `useCotizacionEmision(cotizacionId)`: `useQuery` para la cotización (`cotizacionesKeys.detalle`). Cuando llega, dispara en paralelo las queries de vehículo (`vehiculoId`), plan (`planId`) y cliente (`clienteId`). Un fallo de cliente no bloquea la pantalla (ver §9). Todas en `features/polizas/api/`.
5. Hook `useEmitirPoliza()`: `useMutation({ mutationFn: emitirPoliza, retry: 0 })`. En `onSuccess` invalida `polizasKeys.lista` y navega a `/polizas/${id}` (B-15) con `state: { aviso }` (DP-B12-05).
6. `EmitirPolizaPage`:
   - `cotizacionId` de la query string. Si no es UUID, muestra error de ruta (DP-B12-06) sin request.
   - Enlace "Cotización" a `/cotizaciones/nueva?vehiculoId=…&clienteId=…` (ruta de B-10) con los datos de la cotización cargada.
   - Título `Emitir póliza` (h1).
   - Columna principal: `CotizacionResumen`, `VigenciaSelector`, bloque de fecha de inicio (solo lectura), `CuotasPreview`.
   - Rail (300 px): `ValidacionesPanel`, `EmisionNota`, `AccionesEmision`.
7. `CotizacionResumen`: Cliente (`{nombre} {apellido}` o "No disponible"); Vehículo (`{marca} {modelo} {anio}` y patente en mono); Plan (`{codigo} {nombre}`); Prima mensual (T-09, `$ 19.800,00`); debajo, `Válida hasta {dd/MM/yyyy}` con `fechaVencimiento` en fecha de Argentina.
8. `VigenciaSelector`: `role="radiogroup"` con etiqueta `Vigencia`. Tres radios nativos con aspecto de chip. Las flechas cambian la selección y cada control expone su estado al lector de pantalla. No hay valor inicial (DP-B12-02).
9. Fecha de inicio: solo lectura, muestra la fecha de hoy en Argentina (T-09). No es editable (D3, B8 §13). Sin helper de fecha de fin (DP-B12-07).
10. `CuotasPreview`: cantidad de filas igual a la vigencia elegida; sin vigencia elegida, la tabla muestra solo encabezados y el texto DP-B12-08. Cada fila: `Cuota`, `Vencimiento` = `A confirmar` (PB-20), `Importe` = `primaMensual` (T-09), `Estado` = `Pendiente` (Badge de T-05). Fila de total: `Total`, `{n} cuotas`, suma formateada. La leyenda DP-B12-01 va encima de la tabla.
11. `ValidacionesPanel`: cuatro textos del Figma sin íconos de check (DP-B12-04). No simula resultados.
12. `EmisionNota`: nota literal del Figma. Si la cotización está vencida (según el reloj del cliente), muestra el texto del back `La cotización está vencida (RN06).` y deshabilita Emitir. Muestra también el `detail` de cualquier error del `POST`.
13. `AccionesEmision`:
    - `Emitir póliza` (primario, con icono `ShieldCheck` de Phosphor): deshabilitado sin vigencia, si la cotización está vencida, o mientras corre. Con `aria-disabled` y `aria-busy` según corresponda.
    - `Cancelar` (secundario): navega a `/cotizaciones/nueva?vehiculoId=…&clienteId=…` (DP-B12-09); deshabilitado mientras corre.
14. Errores del `POST`: `ApiError` → `EmisionNota` con `role="alert"` y el `detail` tal cual. No se reintenta. Los siete mensajes del back de B8 §5 se muestran literal.
15. GREEN, luego refactor. `lint`, `typecheck`, `test` y `build`.

## 7. Contrato con el back

| Método y ruta | Estado | Uso |
|---|---|---|
| `GET /api/cotizaciones/{id}` | Implementado (PR #49) | Carga de la cotización: `clienteId`, `vehiculoId`, `planId`, `codigoPlan`, `primaMensual`, `fechaVencimiento`. |
| `GET /api/vehiculos/{id}` | Implementado | Marca, modelo, año, patente. |
| `GET /api/planes/{id}` | Implementado | Nombre del plan. |
| `GET /api/clientes/{id}` | Implementado (US-F1-06) | Nombre y apellido. Mock de T-24. |
| `POST /api/polizas` | Implementado (en `development`) | Emitir. 201 con `PolizaDetalleResponse`; `Location` no legible (PB-17). |

PB-14 (degrada): los errores llegan solo con `detail`; no hay código por causa. Workaround: mostrar el texto del back. PB-27 (degrada): el detalle de la póliza no trae emisor; esta pantalla no lo necesita. PB-16 (degrada): algunos `DateTime` llegan sin `Z`; el formateador de T-09 los trata como UTC. Si falla `GET /api/clientes/{id}`, el nombre queda como «No disponible» (B8 §7).

Nombres de funciones y keys (`obtenerCotizacion`, `obtenerVehiculo`, `obtenerPlan`, `obtenerCliente`, `emitirPoliza`, `polizasKeys.*`) son sugeridos; los exportan sus dueños.

Request (dueño T-28; no se redefine):

```ts
export interface EmitirPolizaRequest {
  cotizacionId: string;        // idCotizacion de la opción elegida
  vigenciaMeses: 1 | 6 | 12;   // RN07
}
```

Errores de `POST /api/polizas` (texto exacto, `polizas-cuotas-pagofacil.md §4.2`):

| Status | Texto del back | Tratamiento |
|---|---|---|
| 400 | `La cotización está vencida (RN06).` | Nota de emisión; Emitir deshabilitado. |
| 400 | `La cotización ya se usó para emitir una póliza.` | Nota de emisión. |
| 400 | `El cliente no está validado en Renaper (RN02).` | Nota de emisión. |
| 400 | `El vehículo no está validado en DNRPA (RN03).` | Nota de emisión. |
| 400 | `El vehículo no pertenece al cliente de la cotización (RN03).` | Nota de emisión. |
| 400 | `Otra emisión con la misma cotización o el mismo vehículo se guardó al mismo tiempo (RN04). Recargue los datos.` | Nota de emisión. |
| 400 | `El vehículo {patente} ya tiene una póliza pendiente, vigente o suspendida (RN04).` | Nota de emisión. |
| 400 | Otros (RN05, plan inactivo, vigencia) | Nota de emisión con el `detail`. |
| 404 | `La cotización {id} no existe.` | Pantalla de error en lugar del contenido (§9). |
| 401 / 403 | — | T-08 y T-13. |
| 500 / 502 / 503 | `detail` del back (`Ocurrió un error inesperado.` en 500) | Nota de emisión con el `detail`. |

Handlers MSW: `GET /api/cotizaciones/{id}`, `GET /api/vehiculos/{id}`, `GET /api/planes/{id}`, `POST /api/polizas` (T-26, T-27, T-28) y `GET /api/clientes/{id}` (T-24).

## 8. Contenido de UI (literal)

| Zona | Texto |
|---|---|
| Enlace de regreso | `Cotización` |
| Título (h1) | `Emitir póliza` |
| Sección | `Cotización` |
| Etiquetas | `Cliente`, `Vehículo`, `Plan`, `Prima mensual` |
| Valor plan | `{codigo} {nombre}` (ejemplo del Figma: `TC Terceros Completo`) |
| Helper de validez | `Válida hasta {dd/MM/yyyy}` |
| Sección | `Vigencia` |
| Chips | `1 mes`, `6 meses`, `12 meses` |
| Etiqueta de fecha | `Fecha de inicio` |
| Sección | `Cuotas que se generan` |
| Encabezados | `Cuota`, `Vencimiento`, `Importe`, `Estado` |
| Fila | `{n} de {total}` (DP-B12-03) |
| Estado de fila | `Pendiente` |
| Total | `Total`, `{n} cuotas`, `$ …` |
| Panel | `Validaciones` |
| Items | `Cliente validado en Renaper` · `Vehículo validado en DNRPA` · `Sin otra póliza activa para el vehículo` · `Plan compatible con el vehículo` |
| Nota | `La póliza nace Pendiente y pasa a Vigente al pagarse la cuota 1.` |
| Botones | `Emitir póliza`, `Cancelar` |

Textos del back que se muestran literal: los de la tabla de §7.

**No se renderizan:** `Válida hasta 12/11/2026` con fecha fija, `01/11/2026`, `10/11/2026` y demás fechas del Figma; el helper `La fecha de fin se calcula sola: 01/05/2027.`; el plan y el cliente de ejemplo como texto fijo.

## 9. Estados y casos borde

| Caso | Comportamiento |
|---|---|
| Cargando | Skeleton de la tarjeta de cotización y de la tabla. Botones deshabilitados. |
| Cotización 404 | Pantalla de error con el `detail` del back y enlace "Cotización" (DP-B12-09). Sin formulario. |
| `cotizacionId` que no es UUID | Error de ruta (DP-B12-06). Sin request. |
| Cliente sin dato (error o 404) | "No disponible" en Cliente; la pantalla sigue (B8 §7, FB7.11). |
| Vehículo o plan con error | `AlertaError` en la tarjeta correspondiente con `detail`. Emitir sigue deshabilitado si falta el dato. |
| Sin vigencia elegida | Emitir deshabilitado. Tabla sin filas. |
| Vigencia elegida | Filas según la vigencia; total = cantidad × prima. |
| Cotización vencida (reloj del cliente) | Nota con el texto del back; Emitir deshabilitado. |
| Emitiendo | Emitir con `aria-busy="true"` y deshabilitado; Cancelar deshabilitado; región `aria-live="polite"` con el anuncio DP-B12-10. |
| Doble clic | Una sola request. |
| 201 | Navega a `/polizas/{id}` con aviso (DP-B12-05). |
| 400 o 500 | Nota con `detail`. Sin reintento automático. El usuario decide si vuelve a emitir (FC11). |
| Fecha de inicio | Hoy en Argentina al montar. No se refresca al cambiar de día sin recargar (B8 §6). |

## 10. Tests requeridos

| Test | Afirma | Herramienta |
|---|---|---|
| `schema: acepta 1, 6 y 12` | Valores válidos | Vitest |
| `schema: rechaza 0, 3, "6" y ausencia` | Valores inválidos | Vitest |
| `form: sin vigencia Emitir está deshabilitado` | `aria-disabled` | Testing Library |
| `form: ninguna vigencia preseleccionada` | Radios sin `aria-checked` | Testing Library |
| `form: vigencia 6 actualiza la tabla a 6 filas` | Conteo de filas | Testing Library |
| `form: Emitir envía { cotizacionId, vigenciaMeses }` | Body exacto con número | Testing Library + MSW |
| `form: doble clic envía una sola request` | Conteo en 1 | Testing Library + MSW (delay) |
| `form: 500 no reintenta` | Una sola request | MSW |
| `form: 201 navega a /polizas/:id` | Ruta final | Testing Library + router en memoria |
| `tabla: Vencimiento muestra "A confirmar" en todas las filas` | Texto exacto | Testing Library |
| `tabla: total = cantidad × prima` | `$ 118.800,00` con 6 × 19.800 | Testing Library |
| `resumen: plan se muestra como "{codigo} {nombre}"` | `TC Terceros Completo` desde datos | Testing Library + MSW |
| `resumen: validez en fecha de Argentina` | `2026-11-12T02:30:00Z` → `11/11/2026` | Testing Library |
| `resumen: cliente 404 muestra No disponible y no bloquea` | Formulario habilitado | Testing Library + MSW |
| `nota: cotización vencida muestra el texto del back y deshabilita Emitir` | Texto exacto y `aria-disabled` | Testing Library |
| `nota: 400 "La cotización ya se usó…" se muestra tal cual` | `role="alert"` con texto exacto | Testing Library + MSW |
| `fecha de inicio es solo lectura y muestra hoy` | Sin input editable | Testing Library |
| `ruta: cotizacionId inválido no hace request` | Error de ruta | Testing Library + MSW |
| `ruta: /polizas/nueva se declara antes que /polizas/:id` | Orden en `routes.tsx` | Vitest |
| `a11y: radiogroup Vigencia con etiqueta y navegación con flechas` | Rol y teclas | Testing Library |
| `a11y: sin violaciones en estado con datos` | Axe sin violaciones | vitest-axe (T-19) |

## 11. Criterios de aceptación

1. La ruta `/polizas/nueva?cotizacionId=<guid>` renderiza la pantalla para Empleado o Administrador; `/polizas/nueva` se declara antes de `/polizas/:id`.
2. Un `cotizacionId` que no es UUID muestra error de ruta sin request.
3. Ninguna vigencia viene preseleccionada; Emitir está deshabilitado hasta elegir una.
4. La vigencia elegida (1, 6 o 12) define la cantidad de filas de la tabla.
5. La columna Vencimiento muestra "A confirmar" en todas las filas; no hay fechas del Figma.
6. El total es la cantidad de cuotas por la prima, con formato de T-09.
7. El resumen muestra la validez con `fechaVencimiento` en fecha de Argentina.
8. Con cotización vencida, Emitir está deshabilitado y se muestra el texto del back.
9. Emitir envía exactamente `{ cotizacionId, vigenciaMeses }` (número).
10. Durante la emisión el botón está deshabilitado y un doble clic produce una sola request.
11. Un 201 navega a `/polizas/{id}`.
12. Un error del `POST` muestra su `detail` tal cual, sin reintento automático.
13. Un error de cliente muestra "No disponible" sin bloquear la pantalla.
14. La fecha de inicio es de solo lectura y muestra la fecha de hoy.
15. No aparecen los checks verdes del Figma ni el helper de fecha de fin.
16. Todos los tests de §10 están en verde, sin axe violations.
17. `lint`, `typecheck`, `test` y `build` del backoffice están en verde.

## 12. Verificación manual

1. `VITE_USE_MOCKS=true npm run dev -w apps/backoffice`, sesión de Empleado.
2. Desde B-10 con una cotización del mock, pulsar **Continuar a emisión**. Verificar que la pantalla muestra el plan, la prima y `Válida hasta`.
3. Sin vigencia, Emitir está deshabilitado. Elegir `6 meses`: aparecen 6 filas con "A confirmar".
4. Emitir con el mock y verificar un único `POST /api/polizas` con respuesta 201 en la pestaña Red. La URL cambia a `/polizas/{id}`. La pantalla de destino se incorpora en B-15.
5. Con una respuesta del mock que tenga `fechaVencimiento` en el pasado, verificar el texto `La cotización está vencida (RN06).` y el botón deshabilitado.

Confirmar al responsable los pasos antes de abrir el PR.

## 13. Decisiones confirmadas

- **DP-B12-01.** Mostrar «Fechas a confirmar: se muestran al emitir.» (PB-20).
- **DP-B12-02.** Empezar sin vigencia seleccionada y con Emitir deshabilitado.
- **DP-B12-03.** Mostrar `{n} de {total}` bajo la columna «Cuota».
- **DP-B12-04.** Mostrar las cuatro validaciones como texto.
- **DP-B12-05.** Navegar a `/polizas/{id}` con el aviso «Póliza {numero} emitida.».
- **DP-B12-06.** Mostrar «No se pudo abrir la emisión. Volvé a la cotización.» con enlace «Cotización» cuando la ruta sea inválida.
- **DP-B12-07.** Omitir el texto auxiliar de fecha de fin hasta resolver PB-20.
- **DP-B12-08.** Mostrar «Elegí una vigencia para ver las cuotas.» cuando no haya selección.
- **DP-B12-09.** Volver a la cotización con el vehículo y el cliente cuando sus identificadores estén disponibles. Sin vehículo, volver a Clientes para retomar el flujo.
- **DP-B12-10.** Anunciar «Emitiendo póliza…» durante el envío.
- **PB-20** (bloquea): regla de fechas de cuotas. Decisión de negocio pendiente (B8 D1, D2, PB-20). Esta tarea no la resuelve; cuando se decida, se reemplaza "A confirmar" por la fecha que devuelve el back.
- **D-03** (índice): ruta única de Pago Fácil. No afecta esta tarea.

## 14. Riesgos y errores comunes

- Calcular la fecha de vencimiento de cada cuota en el front con `primerDiaDelMes + N meses`: reproduce el error de PB-20 y muestra fechas que el back no cobra.
- Mostrar las fechas del Figma (`10/11/2026`…): no coinciden con el código.
- Dejar Emitir habilitado con cotización vencida: el back responde 400; el front tiene que evitarlo cuando el reloj lo permite, pero el back decide (D11 de B8).
- Reintentar `POST /api/polizas` tras un error de red: puede haber creado la póliza (FC11).
- Leer el `Location` del 201: no está expuesto por CORS (PB-17); usar el `id` del body.
- Mostrar un check verde en las validaciones sin haberlas verificado.
- Pedir la vigencia por defecto a una constante del Figma: viola DP-B12-02.
- Mezclar `features/polizas` con `features/cotizaciones` por import: solo por ruta (FB3).

## 15. Definición de terminado

- `lint`, `typecheck`, `test` y `build` del backoffice en verde.
- Todos los criterios de §11 tildados con evidencia observada.
- Accesibilidad revisada con T-19 (incluye el contraste de `Válida hasta` que B8 §12 señala).
- Sin fechas fijas del Figma en el código.
- Pasos de §12 entregados y confirmados antes del PR a `development`.

## 16. Observaciones al índice

- Resuelto (triage final, default de la ficha): el texto de la leyenda sobre la tabla de cuotas. El INDEX no lo define; ver DP-B12-01 (default: `Fechas a confirmar: se muestran al emitir.`). Motivo: no figura en REVISION.md ni en FB8.
- Resuelto (RV-65): la fila de B-12 declara T-07, T-08, T-09, T-10 y T-13 (y T-06, T-11, T-19 por RV-04).
- Resuelto (triage final, default de la ficha): B-12 y B-15 usan el mismo formato de cuota (`{n} de {total}`); si el equipo lo cambia, cambian ambos archivos. Motivo: no figura en REVISION.md ni en FB8.
- Resuelto (RV-D12): el botón "Emitir póliza" de B-13 lleva a `/clientes`, así que la emisión empieza desde el cliente, el vehículo y la cotización (B-10).
