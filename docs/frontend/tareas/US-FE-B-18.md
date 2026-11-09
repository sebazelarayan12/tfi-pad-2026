# US-FE-B-18: Detalle de póliza: rail de cobro y pagos

Tipo B · Oleada 6 · Tamaño M · Rama sugerida `feature/US-FE-B-18-rail-cobro-pagos` · Tarjeta Trello `US-FE-B-18`

## 1. Objetivo

Al terminar, la ficha de póliza `/polizas/:id` (B10) tiene el rail derecho de 300 px con dos widgets: `Deuda vencida` (monto y cuotas vencidas, con el botón `Registrar pago en caja` que cobra las cuotas vencidas con `CobrarVencidasButton` de B-17) y `Pagos` (últimos pagos de la póliza con su medio y su estado de factura). El botón del encabezado no es de esta tarea: lo coloca B-16 con el mismo componente (RV-D10). Usuarios: Empleado y Administrador.

## 2. Alcance

**Entra**
- Componentes en `frontend/apps/backoffice/src/features/polizas/components/`: `PolizaRail.tsx` (contenedor del rail), `DeudaVencidaWidget.tsx`, `PagosWidget.tsx` y `PagoResumenItem.tsx`.
- Reutiliza `CobrarVencidasButton` de `@/features/pagos` (B-17): no lo crea ni lo copia.
- Hook en `frontend/apps/backoffice/src/features/polizas/api/usePagosPoliza.ts`: `usePagosPoliza(polizaId)`.
- Composición del rail dentro de la página `features/polizas/pages/PolizaDetallePage.tsx` (creada por B-15; se edita por bloques).
- Responsive de B10 §11 para el rail (menos de 1024 px: el rail baja debajo de la columna principal, en el orden deuda y pagos).

**NO entra**
- Columna principal: encabezado, ciclo de vida, aviso de suspensión, datos y tabla de cuotas (US-FE-B-15).
- Barra de acciones: `Registrar pago en caja`, `Cupón Pago Fácil` y `Cancelar póliza` (US-FE-B-16, RV-D10).
- `CobroCaja`, `useCobrarCuotas`, `CobrarVencidasButton` y `FacturaPanel` (US-FE-B-17).
- Selector de cuotas con checkboxes en el widget (ver D-B18-01).
- Clic en una fila de pago para ver factura (default: sin acción; ver §13).
- Lista de pagos con `factura` completa: `GET /api/polizas/{id}/pagos` no existe; se mockea (PB-05).
- Historial de estados del ciclo de vida (PB-27).

## 3. Dependencias

- **Oleada (INDEX):** 6.
- **Puede empezar sin esperar a:** `US-FE-B-16` (no comparten archivos: el botón del encabezado lo agrega B-16 con `CobrarVencidasButton`, RV-D10).
- **Depende de:** `US-FE-B-15`, `US-FE-B-17`, `US-FE-T-11`, `US-FE-T-19`, `US-FE-T-29`.
- **Pedidos al back (INDEX):** PB-05 (MSW), PB-25.
- **Degradaciones:** PB-05: `GET /api/polizas/{id}/pagos` no existe; el widget `Pagos` usa el mock de T-29 con la forma `PagoResponse[]` con `factura` (RV-D13). No bloquea el rail de deuda. PB-16: fechas sin `Z`, se tratan como UTC con T-09. PB-25: sin forma de pago, no se muestra.
- **Workaround MSW (FB7.7):** `GET /api/polizas/{id}/pagos` se mockea con el handler de T-29 (`packages/api/mocks/handlers/pagos.ts`), activo con `VITE_USE_MOCKS=true`. La forma del mock es la de §7 (incluye `factura`).

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB3 (reglas 1 a 4: `pages/` compone; un feature importa de otro solo por su `index.ts`), FB7.7 (MSW), FB7.9 (pagos sin doble clic).
- `docs/frontend/tareas/INDEX.md`: FC1, FC2 (hooks solo en el feature propio; `pagosKeys` de T-29), FC11 (mutaciones sensibles), D-12 (historial de facturas oculto), D-33 (rail "Cuenta" oculto).
- `docs/frontend/pantallas/B10-detalle-poliza.md`:
  - §3: tabla "Rail derecho" (posiciones 24,24 y 24,234; tamaños 252×194 y 252×458) y "Divisor entre columna y rail".
  - §5: textos `Deuda vencida`, `Registrar pago en caja`, `Pagos`, `Medio (ejemplo)`, `Factura (ejemplo)`, `Facturada`, `Pendiente CAE`, y la nota sobre `Cuotas 6 y 7, con recargo del 5%`.
  - §6 y §7: estado de pago y de cuota, y la tabla "Estados de carga y error" (filas de carga y de acción en curso).
  - §8: fila `Registrar pago en caja` (encabezado y widget).
  - §9: "Deuda vencida" (cálculo de `Importe + Recargo`) y "Pagos" (mapeo de medio y factura).
  - §11: responsive por debajo de 1024 px.
  - §12: accesibilidad del aviso y de las acciones.
  - §13: D1 (cobro en caja), D8 (medios del widget), D10 (historial), D5 (emisor).
- `docs/frontend/contratos-api/pagos-facturas.md`: §6 (caja y errores), §9.2 (un solo POST en vuelo, sin reenvío), §10.1 (`POST /api/pagos/caja`), §3 (`PagoResponse`, `FacturaResponse`).
- `docs/frontend/contratos-api/polizas-cuotas-pagofacil.md`: §5.5 (`CuotaResponse`), §2 (`EstadoCuota`: 0 Pendiente, 1 Vencida, 2 Pagada, 3 Anulada), §1.5 (fechas).
- `docs/frontend/contratos-api/convenciones-transversales.md`: §5.4 (dinero: el back es la fuente del total; no recalcular recargos), §5.3 (fechas).
- `docs/frontend/design-system.md`: §5.1 (Button primario M), §5.4 (Badge/Estado, tokens de `Facturada` = vigente y `Pendiente CAE` = suspendida), §5.13 (Card/Widget: padding 20 px, título H3, radio 16 px), §7.4 (breakpoints), §8.3 (foco).
- `docs/frontend/pedidos-al-back.md`: fichas PB-05, PB-16, PB-25.

## 5. Archivos a crear o modificar

Bajo `frontend/apps/backoffice/src/features/polizas/`:

| Archivo | Acción | Dueño | Nota |
|---|---|---|---|
| `components/PolizaRail.tsx` | crear | US-FE-B-18 | Contenedor `aside` de 300 px con padding 24 px. Compone los dos widgets. |
| `components/DeudaVencidaWidget.tsx` | crear | US-FE-B-18 | Widget `Deuda vencida`. Usa `CobrarVencidasButton` de B-17. |
| `components/PagosWidget.tsx` | crear | US-FE-B-18 | Widget `Pagos`. |
| `components/PagoResumenItem.tsx` | crear | US-FE-B-18 | Una fila del widget `Pagos`. |
| `api/usePagosPoliza.ts` | crear | US-FE-B-18 | Hook `usePagosPoliza(polizaId)`. |
| `pages/PolizaDetallePage.tsx` | editar | US-FE-B-15 (dueño) | Agregar el `PolizaRail` en la columna derecha. Declarar dependencia en el PR. |
| `index.ts` | editar (bloque) | US-FE-B-13 (dueño) | Exportar `PolizaRail`. |

No se editan `packages/*` ni `components/PolizaAcciones.tsx` (lo edita B-16, RV-D10). El hook de pagos usa `pagosKeys` de T-29.

## 6. Pasos de implementación

1. Confirmar que existen `usePolizaDetalle(polizaId)` (B-15; el detalle trae `cuotas`, RV-32), `CobrarVencidasButton`, `CobroCaja`, `useCobrarCuotas` y `FacturaPanel` (B-17, desde `@/features/pagos`). Si falta alguno, detener la tarea.
2. Crear `api/usePagosPoliza.ts`: `useQuery` con key `pagosKeys.dePoliza(polizaId)` (de T-29) y función de request de T-29 para `GET /api/polizas/{id}/pagos`. `enabled` solo si `polizaId` no está vacío.
3. Crear `DeudaVencidaWidget` con props `{ polizaId, cuotas }`:
   - Filtra cuotas con `estado === 1` (Vencida).
   - Monto: suma en centavos de `importe + recargo` con formateador de T-09. Ejemplo del Figma: `$ 22.050,00`. Ver ABIERTO en §16.
   - Detalle: texto de §8 según la cantidad de cuotas.
   - Contiene `CobrarVencidasButton` de `@/features/pagos` con `polizaId` y `cuotas`, sin copia de la lógica.
   - Sin cuotas vencidas: texto `Sin cuotas vencidas.`; el botón queda deshabilitado (lo resuelve B-17).
4. Crear `PagoResumenItem` con props `{ pago: PagoResponse }`: fecha (T-09, `dd/mm/aaaa`), importe (T-09), medio (T-10), badge de factura (`Facturada` o `Pendiente CAE`, o nada si `factura` es `null`). Sin acción de clic.
5. Crear `PagosWidget` con props `{ polizaId }`:
   - Usa `usePagosPoliza`. Muestra skeleton mientras carga, `Sin pagos registrados.` si la lista está vacía, y error con `detail` si falla.
   - Muestra hasta 5 pagos (`slice(0, 5)`), ordenados por `fechaCreacion` descendente.
   - No muestra `Ver todos` (no está en el diseño).
6. Crear `PolizaRail` que compone `DeudaVencidaWidget` y `PagosWidget` en orden: deuda primero, pagos después (B10 §3).
7. Editar `PolizaDetallePage.tsx`: agregar el `PolizaRail` en el layout de dos columnas (columna principal 859 px, divisor de 1 px, rail de 300 px). Por debajo de 1024 px, el rail va debajo de la columna principal.
8. Escribir los tests de §10 antes de implementar.

## 7. Contrato con el back

| Método y ruta | Estado | Uso en esta tarea | Respuesta |
|---|---|---|---|
| `GET /api/polizas/{id}` | Implementado | Lo lee B-15 (`usePolizaDetalle`); las cuotas vienen en el detalle (RV-32). Esta tarea solo consume la caché. | `PolizaDetalleResponse` con `cuotas` |
| `POST /api/pagos/caja` | Implementado | Lo llama `CobrarVencidasButton` (B-17) desde el widget. | 201 `PagoResponse` |
| `GET /api/polizas/{id}/pagos` | **NO EXISTE** (PB-05). Mock de T-29. | Widget `Pagos`. | `PagoResponse[]` con `factura` (RV-D13) |

Forma del mock de `GET /api/polizas/{id}/pagos` (la define T-29; esta tarea la consume):

```ts
// Forma de mock: usa PagoResponse completo para poder mostrar factura. La propuesta de PB-05 (PagoResumen) no trae factura.
GET /api/polizas/{id}/pagos  -> 200 PagoResponse[]
```

Tipos (de `contratos-api/pagos-facturas.md` §3 y `polizas-cuotas-pagofacil.md` §5.5): `PagoResponse`, `FacturaResponse` y `CuotaResponse`; no se redefinen.

Errores de la lectura: 404 de póliza (`La póliza {id} no existe.`) lo resuelve B-15; el widget solo muestra su propio error con `detail`.

## 8. Contenido de UI

Textos literales del Figma (B10 §5):

| Elemento | Texto |
|---|---|
| Título del widget de deuda | `Deuda vencida` |
| Monto | `$ 22.050,00` (mono, color `status-cancelada-text`) — valor de muestra, se calcula |
| Detalle, 2 cuotas | `Cuotas 6 y 7, con recargo del 5%` |
| Botón | `Registrar pago en caja` |
| Título del widget de pagos | `Pagos` |
| Medio (valores posibles) | `Caja`, `Pago Fácil`, `Pasarela` (sin A/B, PB-22, D8) |
| Badge de factura con CAE | `Facturada` (token vigente) |
| Badge de factura pendiente | `Pendiente CAE` (token suspendida) |

Textos que el Figma no define (propuesta, B10 §5 "NO DEFINIDO"):

| Elemento | Texto propuesto |
|---|---|
| Detalle, 1 cuota | `Cuota 6, con recargo del 5%` |
| Detalle, 3 o más cuotas | `Cuotas 6, 7 y 8, con recargo del 5%` |
| Sin cuotas vencidas | `Sin cuotas vencidas.` |
| Pagos vacíos | `Sin pagos registrados.` |
| Error de pagos | `No se pudieron cargar los pagos.` |
| Cargando | sin texto; skeleton de 3 filas |
| Éxito de cobro | `Pago registrado.` |

Formato de importes y fechas: solo con T-09 (`$ 22.050,00`, `dd/mm/aaaa`).

## 9. Estados y casos borde

| Caso | Comportamiento |
|---|---|
| Cargando cuotas (B-15) | El rail muestra el widget de deuda con skeleton y el botón deshabilitado. |
| Sin cuotas vencidas | Monto no se muestra; `Sin cuotas vencidas.`; botón deshabilitado. |
| Cobro en curso | El botón del widget se deshabilita (`aria-disabled="true"`). El de la barra de acciones (B-16) usa el mismo componente. |
| Doble clic | Un solo POST por acción (FB7.9). Test §10. |
| Error de red | No se reenvía (`retry: 0`). Se invalidan cuotas y pagos. |
| 400 `El pago o sus cuotas fueron modificados por otro cobro. Recargue los datos.` | Se muestra `detail` y se invalidan cuotas y pagos. |
| 400 `Solo se pueden pagar cuotas pendientes o vencidas (RN11).` | Se muestra `detail`; se invalidan cuotas. |
| 403 en el POST | Se muestra el texto de 403 de B-17. |
| Pagos: lista vacía | `Sin pagos registrados.` |
| Pagos: error | `No se pudieron cargar los pagos.` y el `detail` del back. Las cuotas siguen visibles. |
| Pago sin `factura` (`null`) | Sin badge. |
| Cuota vencida con `recargo = 0` | Se suma `importe + 0`. El texto `con recargo del 5%` es literal del Figma (ver riesgo §14). |
| Póliza `Cancelada` o `Vencida` | Sin acción de cobro: el botón se deshabilita si no hay cuotas vencidas (cobro de pólizas vencidas: PB-30; cancelada → cuotas anuladas). |
| Viewport < 1024 px | El rail baja debajo de la columna principal, en el orden deuda y pagos. |

## 10. Tests requeridos

Herramientas: Vitest, Testing Library, MSW (handlers de T-29 con `server.use`), `vitest-axe`.

`features/polizas/components/DeudaVencidaWidget.test.tsx`:
1. `suma_importe_mas_recargo_de_las_vencidas`: cuotas 6 y 7 (10.500 + 525 cada una) muestran `$ 22.050,00`.
2. `texto_de_detalle_dos_cuotas`: aparece `Cuotas 6 y 7, con recargo del 5%`.
3. `sin_vencidas_muestra_texto_y_boton_deshabilitado`: aparece `Sin cuotas vencidas.` y el botón `Registrar pago en caja` está deshabilitado.
4. `ignora_pendientes_y_pagadas`: cuotas con estados 0, 2 y 3 no suman al monto.

Los tests del botón (envío solo de vencidas, no disparo al montar, doble clic, error 400) son de `CobrarVencidasButton` en B-17 (tests 17 a 20), porque el componente es de esa tarea.

`features/polizas/components/PagosWidget.test.tsx`:
5. `muestra_maximo_5_pagos_ordenados_por_fecha_desc`: con 7 pagos, se ven 5 y el primero es el más reciente.
6. `badge_factura_segun_estado`: `AUTORIZADA` → `Facturada`; `PENDIENTE_CAE` → `Pendiente CAE`; `factura: null` → sin badge.
7. `vacio_muestra_sin_pagos_registrados`.
8. `error_muestra_mensaje_y_detail`.

`features/polizas/components/PolizaRail.test.tsx`:
9. `orden_deuda_antes_que_pagos`: en el DOM, `Deuda vencida` aparece antes que `Pagos`.
10. `a11y_sin_violaciones`: `vitest-axe` sobre el rail.

## 11. Criterios de aceptación

1. El rail muestra `Deuda vencida` y `Pagos`, en ese orden, con ancho de 300 px en desktop y debajo de la columna principal por debajo de 1024 px.
2. El monto de `Deuda vencida` es la suma de `importe + recargo` de las cuotas con estado Vencida, formateada con T-09 (ver ABIERTO en §16).
3. El botón `Registrar pago en caja` del widget es `CobrarVencidasButton` de B-17: envía solo los ids de cuotas Vencida y no se dispara al montar (tests 17 y 18 de B-17).
4. El botón del encabezado lo coloca B-16 con el mismo componente (RV-D10); esta tarea no lo edita.
5. Un segundo clic durante el envío no genera un segundo POST (test 19 de B-17).
6. Los errores 400 muestran `detail` dentro de `role="alert"` (test 20 de B-17).
7. El widget `Pagos` muestra como máximo 5 pagos, ordenados por `fechaCreacion` descendente.
8. Los badges de factura usan `Facturada` y `Pendiente CAE` según el estado de la factura; sin factura no hay badge.
9. Ninguna fecha ni importe se formatea a mano (T-09); ningún enum se muestra como número (T-10).
10. Los tests 1 a 10 están en verde, con `vitest-axe` sin violaciones en el rail.
11. `npm run lint`, `typecheck`, `test` y `build` están en verde en `apps/backoffice`.

## 12. Verificación manual

Pasos para la persona responsable (con `VITE_USE_MOCKS=true` y la API local si está disponible):
1. Entrar a `/polizas/{id}` de una póliza con cuotas vencidas (en el mock, la póliza del Figma `POL-0000057`).
2. Verificar que el rail muestra `Deuda vencida` con `$ 22.050,00` y `Cuotas 6 y 7, con recargo del 5%`.
3. Verificar que `Pagos` muestra hasta 5 filas con fecha, importe, medio y badge de factura.
4. Pulsar `Registrar pago en caja` (widget). Verificar que el botón queda deshabilitado durante el envío y que aparece `Pago registrado.`.
5. Achicar la ventana por debajo de 1024 px y verificar que el rail baja debajo de la tabla de cuotas.
Confirmar los resultados antes de abrir el PR (regla 7 de `docs/workflow.md`).

## 13. Decisiones pendientes con default

- **D-B18-01 (D1 de B10; RV-D11): cobro desde el widget. DECIDIDA el 2026-11-09 por el usuario (dueño de producto en la sesión): opción B.** El empleado elige qué cuotas vencidas cobrar con checkboxes en el widget, ninguna marcada de entrada; el botón se habilita con al menos una marcada y envía solo esas `cuotaIds`. La selección manual se implementó en esta tarea; B-19 ya tiene la suya en la pantalla de pagos (`CobroCaja`), son independientes. El botón del encabezado de B-16 sigue cobrando todas las vencidas. Sin documento de producto extra: la decisión se registra acá y en el PR.
- **D-B18-02: confirmación antes de cobrar. DECIDIDA el 2026-11-09 por el usuario: sí.** `CobrarVencidasButton` abre un diálogo "Confirmar pago en caja" que nombra las cuotas ("las cuotas 6 y 7"), con `Cancelar` (foco inicial) y `Confirmar pago`; el éxito se avisa con `toast.success('Pago registrado.')` (FC19) en lugar del texto inline. Aplica también al botón del encabezado de B-16, que usa el mismo componente. Los errores del back siguen como `AlertaError` bajo el botón.
- **D-B18-03: habilitación del botón.** B10 §7 dice "Habilitado si hay cuotas Pendiente o Vencida". Default: habilitado solo si hay cuotas Vencida, igual que el widget. Lo aplica `CobrarVencidasButton` (B-17), que también usa B-16.
- **D-B18-04 (RV-D13): forma de `GET /api/polizas/{id}/pagos`. Resuelto.** `PagoResponse[]` con `factura` para el widget. PB-05 se actualiza en el doc PR para que el back lo confirme. Si el back elige otra forma, se ajusta el mock de T-29 y `PagoResumenItem`.
- **D-B18-05: fila de pago.** B10 §8 dice "NO DEFINIDO". Default: sin acción de clic; el detalle y la factura se ven en B-19.
- **D-B18-06: texto del detalle con 1 o más de 2 cuotas.** Ver §8 (propuesta).
- **D-B18-07: pagos mostrados.** Default: los 5 más recientes, sin `Ver todos` (B10 §5).
- **D-B18-08 (RV-D10): botón del encabezado. Resuelto.** Lo coloca B-16; esta tarea no edita `PolizaAcciones.tsx`.

## 14. Riesgos y errores comunes

- **Cobro de vencidas con recargo en cero.** Si el job de vencimientos no corrió, la cuota puede seguir `Pendiente` con `recargo = 0` (`pagos-facturas.md` §8). El texto `con recargo del 5%` es literal; no calcular el recargo en el front.
- **Monto del widget distinto del cobro.** El back calcula el total del cobro; el monto del widget es informativo. Tras el 201, mostrar `PagoResponse.importe` si se necesita ese dato.
- **Invalidación.** Después de cobrar, B-15 (cuotas) y el widget `Pagos` deben refrescarse. Usar las keys de T-28 y T-29 que expone B-17.
- **Mock con forma distinta.** Si el mock de T-29 tiene una forma distinta a §7, el widget falla en silencio. Tests 9 a 12 lo cubren.
- **Rail duplicado.** No copiar la lógica de cobro en el rail; siempre `CobrarVencidasButton` de B-17.

## 15. Definición de terminado

- `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` en verde.
- Accesibilidad revisada con el harness de T-19 (rail y widgets).
- Sin secretos en el código.
- Criterios 1 a 12 de §11 tildados con evidencia observada.

## 16. Observaciones al índice

- Resuelto (RV-D10): el botón "Registrar pago en caja" del encabezado lo coloca B-16 con `CobrarVencidasButton` de B-17. Esta tarea no edita `PolizaAcciones.tsx`.
- Resuelto (RV-D10 / RV-66): la dependencia de B-16 deja de ser necesaria para esta tarea; el INDEX la deja como "Puede empezar sin esperar a".
- RESUELTO el 2026-11-09 (decisión del usuario en la sesión): el front ayuda en el cálculo. "Deuda vencida" y "Total a cobrar" (suma de las cuotas marcadas) se suman en el front con `importe + recargo`, solo como ayuda informativa; el importe real lo confirma el back en `PagoResponse.importe`. Excepción acotada a `convenciones-transversales.md §5.4`.
