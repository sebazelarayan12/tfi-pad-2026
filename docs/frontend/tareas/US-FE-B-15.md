# US-FE-B-15: Detalle de póliza: encabezado, ciclo y cuotas

Tipo: B · Oleada: 5 · Tamaño: M · Rama sugerida: `feature/US-FE-B-15-detalle-poliza` · Tarjeta Trello: `US-FE-B-15`

## 1. Objetivo

El Empleado o Administrador abre `/polizas/:id` y ve la póliza: número y estado en el encabezado, la línea de vida de la póliza (5 pasos), los datos de la póliza y la tabla de cuotas con su estado, vencimiento e importe. La pantalla deja vacíos tres slots (la barra de acciones, la columna derecha y el aviso) para que B-16 y B-18 los completen. Los datos que el back no devuelve se muestran como "No disponible".

## 2. Alcance

**Entra**
- Ruta `/polizas/:id` (dinámica, después de `/polizas/nueva`; FC14), dentro de `features/polizas` (dueño B-13).
- Carga de `GET /api/polizas/{id}` y del vehículo (`GET /api/vehiculos/{vehiculoId}`) para el año.
- Encabezado: número en mono (h1) y badge de estado.
- Barra de acciones vacía (slot `PolizaAcciones`) y slot de la columna derecha vacío.
- Aviso de suspensión.
- Ciclo de vida de 5 pasos con estado actual.
- Datos de la póliza.
- Tabla de cuotas con estado y nota de recargo.
- Estados de carga, 404, 403 y error.
- Tests.

**No entra**
- Botones de la barra de acciones: "Registrar pago en caja" (B-16, con `CobrarVencidasButton` de B-17, RV-D10), "Cupón Pago Fácil" y "Cancelar póliza" (B-16).
- Columna derecha con deuda y pagos (B-18); el cobro lo hace B-17.
- Historial de estados y emisor (PB-27).
- Lista de pagos (PB-05).
- Cambios de datos de la póliza (no hay endpoint).

## 3. Dependencias

- **Oleada (INDEX):** 5.
- **Puede empezar sin esperar a:** `US-FE-B-12` (solo navegación: la emisión termina en esta pantalla).
- **Depende de:** `US-FE-B-13`, `US-FE-T-05`, `US-FE-T-06`, `US-FE-T-09`, `US-FE-T-10`, `US-FE-T-11`, `US-FE-T-16`, `US-FE-T-19`, `US-FE-T-24`, `US-FE-T-26`, `US-FE-T-28`.
- **Pedidos al back (INDEX):** PB-27 (degrada: sin motivo ni historial).
- **Degradaciones:** PB-27: no hay historial de estados, motivo, fecha de cancelación ni emisor; el paso 3 del ciclo va sin fecha (D10 de B10). PB-05: los pagos no se listan aquí (es B-18).
- **Workaround MSW (FB7.7):** `GET /api/clientes/{id}` (T-24) para nombre y DNI. Si falla, "No disponible" sin bloquear la pantalla.
- Nombres de keys (`polizasKeys.detalle(id)`) y funciones son sugeridos.

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB3, FB4 (enums, fechas), FB5, FB7.11.
- `docs/frontend/tareas/INDEX.md`: fila `US-FE-B-15`; FC2, FC9, FC10, FC14, FC16; "Ownership" (`features/polizas/routes.tsx`); D-33 (rail "Cuenta" oculto no aplica aquí).
- `docs/frontend/pantallas/B10-detalle-poliza.md`: §2 (ruta y guardas), §3 (estructura, posiciones de encabezado, línea de vida, datos y cuotas; el rail no es de esta tarea), §4 (componentes propios), §5 (textos literales de encabezado, ciclo, aviso, datos y cuotas), §6 (solo para no implementar el motivo), §7 (estado de la póliza, badge de cuota y estados de carga y error; no las columnas de acciones), §9 (mapeo de cada bloque), §10 (RN07, RN08, RN14), §11, §12. §13: D7 (colores de cuota), D9 (formato de cuota), D10 (ciclo), D11 (fechas), D12 (enum), D13 (formato de plan), D14 (año del vehículo), D15 (número).
- `docs/frontend/contratos-api/polizas-cuotas-pagofacil.md`: §1.2 (tipos), §1.3 (enums: número), §1.5 (`DateTime` sin `Z`), §2 (enums y tipos), §3.1 (estados), §3.5 (qué se ve por estado), §5.3 (`PolizaDetalleResponse`), §5.5 (`CuotaResponse`).
- `docs/frontend/contratos-api/vehiculos-planes-cotizaciones.md`: §2.3 (`GET /api/vehiculos/{id}`).
- `docs/frontend/design-system.md`: §5.4 (Badge: estados de póliza y cuota), §5.12 (Table), §5.6 (solo si se usa NavItem: no aplica), §8.3 (foco), §8.1 (contraste de `status/cancelada/text`, que B10 §12 señala).
- `docs/frontend/pedidos-al-back.md`: PB-27, PB-16.

## 5. Archivos a crear o modificar

Todos bajo `frontend/apps/backoffice/src/features/polizas/` (dueño de `routes.tsx` y `index.ts`: B-13).

| Archivo | Acción |
|---|---|
| `routes.tsx` | Modifica (dueño B-13): agrega `/polizas/:id` después de `/polizas/nueva` |
| `pages/PolizaDetallePage.tsx` | Crea. Compone; deja slots de acciones y de columna derecha |
| `components/PolizaEncabezado.tsx` | Crea. h1 y badge |
| `components/PolizaAcciones.tsx` | Crea. Contenedor vacío con `children` (B-16 agrega los botones, incluido "Registrar pago en caja", RV-D10) |
| `components/CicloDeVida.tsx` | Crea. `<ol>` de 5 pasos |
| `components/AvisoSuspension.tsx` | Crea |
| `components/PolizaDatos.tsx` | Crea. Tarjeta con filas etiqueta y valor |
| `components/CuotasTabla.tsx` | Crea |
| `lib/cicloDeVida.ts` | Crea. Función pura: estado y fechas → pasos |
| `lib/importeCuota.ts` | Crea. `importe + recargo` (DP-B15-04) |
| `api/usePolizaDetalle.ts` | Crea. `useQuery` sobre `GET /api/polizas/{id}` |
| `api/useVehiculoAnio.ts` | Crea. `useQuery` sobre `GET /api/vehiculos/{id}` |
| `api/useClienteDatos.ts` | Crea. `useQuery` sobre `GET /api/clientes/{id}` (degrada) |
| `**/*.test.ts(x)` | Crea |

Sin editar: `packages/api/**` (T-24, T-26, T-28).

## 6. Pasos de implementación

1. Leer la fila de B-15 y confirmar que B-13 está mergeado.
2. **RED:** escribir los tests de `cicloDeVida` e `importeCuota` (§10).
3. `usePolizaDetalle(id)`: `useQuery` con key `polizasKeys.detalle(id)`. Valida `id` como UUID antes de la request; si no lo es, el estado es "no encontrada" sin request.
4. `useVehiculoAnio(vehiculoId)` y `useClienteDatos(clienteId)` se habilitan (`enabled`) cuando llega el detalle. Un error de cualquiera de ellas no bloquea la pantalla: el dato queda como "No disponible" (FB7.11).
5. `importeCuota(cuota)` = `importe + recargo`, con el formateador de T-09. Es la única fórmula de esta pantalla (DP-B15-04).
6. `cicloDeVida(poliza)` devuelve los 5 pasos (§8) con: estado de cada paso, fecha o nota, y el paso actual (`aria-current="step"`) según el estado (DP-B15-06).
7. `PolizaEncabezado`: h1 con `numero` en mono (`POL-0000057`), y `Badge` con la etiqueta de T-10 para `EstadoPoliza`.
8. `PolizaAcciones`: contenedor `<div role="group" aria-label="Acciones de la póliza">` con `children`. Sin botones propios.
9. `CicloDeVida`: `<ol>` de 5 `<li>`. Cada paso: estado (12 px medium) y fecha o nota (11 px medium). El paso actual tiene el círculo de 16 px (B10 §3). Sin paso actual (Cancelada) no hay `aria-current` (DP-B15-06).
10. `AvisoSuspension`: aparece solo si `estado === Suspendida`. Texto literal. Con `role="status"` si la póliza cambió durante la sesión; texto normal si viene de la carga.
11. `PolizaDatos`: filas de etiqueta y valor (§8). Campos sin dato: `No disponible`.
12. `CuotasTabla`: `<table>` con `<caption>` oculto `Cuotas de la póliza`, `th scope="col"`, la nota literal del Figma encima, y una fila por cuota ordenada por `numero`. Columnas: Cuota, Vencimiento, Importe, Estado (Badge de T-10 para `EstadoCuota`). Recargo visible solo en la fórmula de DP-B15-04.
13. `PolizaDetallePage`: `cotizacionId` no se usa. Layout de dos columnas: la principal (encabezado, acciones, ciclo, aviso, datos, cuotas) y el `aside` vacío para B-18. Enlace de regreso `Pólizas` a `/polizas`.
14. Errores (§9): 404 → estado "no encontrada" con el `detail` (`La póliza {id} no existe.`) y enlace `Pólizas`. 403 → acceso denegado (DP-B15-07). 5xx o red → `AlertaError` con botón Reintentar.
15. GREEN, luego refactor. `lint`, `typecheck`, `test` y `build`.

## 7. Contrato con el back

| Método y ruta | Estado | Uso |
|---|---|---|
| `GET /api/polizas/{id}` | Implementado | Encabezado, datos, ciclo y cuotas (`cuotas` viene dentro de `PolizaDetalleResponse`). |
| `GET /api/vehiculos/{id}` | Implementado | `anio` (el detalle de póliza no lo trae; D14 de B10). |
| `GET /api/clientes/{id}` | Especificado (US-F1-06; mock de T-24) | `nombre`, `apellido`, `dni`. |
| `GET /api/polizas/{id}/cuotas` | Implementado | No se llama desde esta tarea: `cuotas` ya viene en el detalle (RV-32). |

Tipos (dueño T-28; no se redefinen):

```ts
export interface PolizaDetalleResponse {
  id: string; numero: string; clienteId: string; vehiculoId: string;
  patente: string; marca: string; modelo: string;
  planId: string; codigoPlan: string; nombrePlan: string;
  cotizacionId: string | null; primaMensual: number; vigenciaMeses: number;
  fechaEmision: string;   // DateTime, puede venir sin Z (PB-16)
  fechaInicio: string;    // yyyy-MM-dd
  fechaFin: string;       // yyyy-MM-dd
  estado: EstadoPoliza;   // número
  cuotas: CuotaResponse[];
}
export interface CuotaResponse {
  id: string; numero: number; importe: number; recargo: number;
  fechaVencimiento: string; // yyyy-MM-dd
  estado: EstadoCuota;      // número: 0 Pendiente, 1 Vencida, 2 Pagada, 3 Anulada
  fechaPago: string | null; // DateTime o null
}
```

Errores (`polizas-cuotas-pagofacil.md §5.3`): 404 `La póliza {id} no existe.`; 401; 403.

Handlers MSW: `GET /api/polizas/{id}` (T-28), `GET /api/vehiculos/{id}` (T-26), `GET /api/clientes/{id}` (T-24).

## 8. Contenido de UI (literal)

**Encabezado y regreso**

| Zona | Texto |
|---|---|
| Regreso | `Pólizas` |
| Título (h1) | `{numero}` en mono (ejemplo del Figma: `POL-0000057`) |
| Badge | Etiqueta de `EstadoPoliza` (T-10) |

**Ciclo de vida** (título `Ciclo de vida`)

| Paso | Estado | Fecha o nota |
|---|---|---|
| 1 | `Pendiente` | `Emitida {dd/MM/yyyy}` con `fechaEmision` (fecha de Argentina, T-09) |
| 2 | `Vigente` | `{dd/MM/yyyy}, cuota 1 pagada` si la cuota 1 está `Pagada` con `fechaPago`; si no, vacío |
| 3 | `Suspendida` | `No disponible` (PB-27, D10) |
| 4 | `Vigente` | `Al pagar las vencidas` (texto fijo del Figma) |
| 5 | `Vencida` | `{dd/MM/yyyy}` con `fechaFin` |

**Aviso** (solo si `Suspendida`): `Se suspendió por 2 cuotas vencidas impagas. Vuelve a Vigente al pagarlas.`

**Datos** (título `Datos`)

| Etiqueta | Valor |
|---|---|
| `Cliente` | `{nombre} {apellido}` o `No disponible` |
| `DNI` | `{dni formateado}` en mono o `No disponible` |
| `Vehículo` | `{marca} {modelo} {anio}` o `{marca} {modelo}` si el año no llega |
| `Patente` | `{patente}` en mono |
| `Plan` | `{nombrePlan} ({codigoPlan})` (DP-B15-08) |
| `Prima` | `$ …` en mono 22 (T-09) |
| `Vigencia` | `{vigenciaMeses} meses, {dd/MM/yyyy} a {dd/MM/yyyy}` |
| `Emitida por` | `No disponible` (PB-27) |

**Cuotas** (título `Cuotas`)

| Zona | Texto |
|---|---|
| Nota | `Vencen el día 10 de cada mes. Recargo del 5% al vencer.` |
| Caption oculto | `Cuotas de la póliza` |
| Encabezados | `Cuota`, `Vencimiento`, `Importe`, `Estado` |
| Fila | `{n} de {vigenciaMeses}` (DP-B15-03) |
| Estado | Etiqueta de `EstadoCuota` (T-10): `Pagada`, `Pendiente`, `Vencida`, `Anulada` |

**Estados de carga y error**

| Estado | Texto |
|---|---|
| No encontrada | `La póliza {id} no existe.` (texto del back) y enlace `Pólizas` |
| Error | `AlertaError` con `detail` o DP-B15-05 |

**No se renderiza:** los botones de la barra de acciones `Registrar pago en caja`, `Cupón Pago Fácil` y `Cancelar póliza` (B-16), el widget de deuda y el de pagos (B-18), `Ver todos`, el aviso de historial.

## 9. Estados y casos borde

| Caso | Comportamiento |
|---|---|
| Cargando | Skeleton de encabezado, datos, cuotas y ciclo. Sin acciones. |
| `id` que no es UUID | "No encontrada" sin request. |
| 404 | "No encontrada" con el `detail` del back. |
| 403 | Acceso denegado (DP-B15-07). |
| 5xx o red | `AlertaError` y Reintentar. |
| Cliente o vehículo sin dato | "No disponible" en el campo; la pantalla sigue. |
| Estado Pendiente | Paso 1 actual. Sin aviso. |
| Estado Vigente | Paso 2 actual. Sin aviso. |
| Estado Suspendida | Paso 3 actual. Aviso visible. |
| Estado Vencida | Paso 5 actual. Sin aviso. |
| Estado Cancelada | Sin paso actual (DP-B15-06). Badge `Cancelada`. |
| Cuota 1 no pagada | Paso 2 sin nota. |
| Cuota con `recargo > 0` | Importe muestra `importe + recargo`. |
| Cuotas vacías | Tabla sin filas y texto DP-B15-09. |
| Fecha `DateTime` sin `Z` | Se trata como UTC (PB-16, T-09). |

## 10. Tests requeridos

| Test | Afirma | Herramienta |
|---|---|---|
| `cicloDeVida: Pendiente marca paso 1 como actual` | `current = 1` | Vitest |
| `cicloDeVida: Vigente marca paso 2 como actual` | `current = 2` | Vitest |
| `cicloDeVida: Suspendida marca paso 3 y muestra No disponible` | `current = 3` y nota | Vitest |
| `cicloDeVida: Vencida marca paso 5 con fechaFin` | `current = 5` y fecha | Vitest |
| `cicloDeVida: Cancelada no marca paso actual` | `current` vacío | Vitest |
| `cicloDeVida: paso 2 muestra fecha de cuota 1 pagada` | Texto `dd/MM/yyyy, cuota 1 pagada` | Vitest |
| `importeCuota: importe + recargo` | 10.500 + 525 = 11.025 | Vitest |
| `encabezado: h1 con el número y badge con la etiqueta` | Texto y rol | Testing Library + MSW |
| `datos: Cliente y DNI muestran No disponible si el cliente falla` | Texto exacto | Testing Library + MSW |
| `datos: Vehículo muestra año si llega y sin año si no` | Texto | Testing Library + MSW |
| `datos: Emitida por dice No disponible` | Texto exacto | Testing Library |
| `datos: Vigencia en formato 12 meses, dd/MM/yyyy a dd/MM/yyyy` | Texto | Testing Library + MSW |
| `cuotas: fila muestra "n de total"` | Texto exacto | Testing Library + MSW |
| `cuotas: importe muestra importe + recargo` | 11.025,00 en cuota vencida | Testing Library + MSW |
| `cuotas: estado Anulada usa la etiqueta de T-10` | Texto del badge | Testing Library + MSW |
| `aviso: solo visible en Suspendida` | Presencia y texto exacto | Testing Library + MSW |
| `slots: PolizaAcciones y aside existen vacíos` | Contenedores presentes | Testing Library |
| `404: muestra el detail y enlace a Pólizas` | Texto y `href` | Testing Library + MSW |
| `id inválido no hace request` | Conteo en 0 | Testing Library + MSW |
| `error 500: muestra AlertaError y Reintentar` | Rol alert y botón | Testing Library + MSW |
| `a11y: ol con aria-current en el paso actual` | Atributo | Testing Library |
| `a11y: tabla con caption oculto y th scope=col` | Estructura | Testing Library |
| `a11y: sin violaciones con datos` | Axe sin violaciones | vitest-axe (T-19) |

## 11. Criterios de aceptación

1. La ruta `/polizas/:id` renderiza para Empleado o Administrador; está declarada después de `/polizas/nueva`.
2. El h1 muestra el número en mono y el badge muestra la etiqueta de T-10 del estado.
3. El ciclo de vida muestra 5 pasos con el paso actual marcado con `aria-current="step"`, según el estado.
4. Con estado Suspendida aparece el aviso literal; con cualquier otro estado no aparece.
5. Los datos muestran cliente, DNI, vehículo, patente, plan, prima, vigencia y "Emitida por", con "No disponible" cuando falte el dato.
6. La tabla de cuotas muestra una fila por cuota con `n de total`, vencimiento `dd/MM/yyyy`, importe `importe + recargo` y el estado con etiqueta de T-10.
7. La nota literal de recargo aparece encima de la tabla.
8. Un 404 muestra el `detail` del back y un enlace a `/polizas`.
9. Un id que no es UUID no hace request.
10. Los contenedores `PolizaAcciones` y `aside` existen y están vacíos (para B-16 y B-18).
11. No aparecen botones de cancelar, cupón, cobro ni el widget de pagos.
12. Todos los tests de §10 están en verde, sin axe violations.
13. `lint`, `typecheck`, `test` y `build` del backoffice están en verde.

## 12. Verificación manual

1. `VITE_USE_MOCKS=true npm run dev -w apps/backoffice`, sesión de Empleado.
2. Abrir `/polizas/<id-del-mock>` para una póliza Pendiente, otra Vigente, otra Suspendida y otra Vencida: el paso actual cambia.
3. Verificar que la suspendida muestra el aviso y las cuotas vencidas muestran importe con recargo.
4. Abrir `/polizas/00000000-0000-0000-0000-000000000000`: aparece "No encontrada" y el texto del back.

Confirmar al responsable antes del PR.

## 13. Decisiones pendientes

- **DP-B15-01** Cliente y DNI, que no vienen en el detalle (PB-27, D5 de B10). Default: se piden con `GET /api/clientes/{id}` (mock de T-24); si falla, "No disponible". Alternativa: que el back agregue el nombre al detalle.
- **DP-B15-02** Año del vehículo (D14 de B10). Default: segunda llamada a `GET /api/vehiculos/{id}`. Si el equipo prefiere una sola llamada, PB nuevo.
- **DP-B15-03** Formato de la cuota (D9 de B10 y D9 de B8). Default: `{n} de {total}`, bajo el encabezado `Cuota`. Igual que B-12.
- **DP-B15-04** Importe de la cuota vencida (D7 de B10). Default: `importe + recargo`, porque es lo que se cobra (contrato §5.5 y §6.4).
- **DP-B15-05** Texto de error sin `detail`. Default: `No se pudo cargar la póliza. Intentá de nuevo.`
- **DP-B15-06** Paso actual para estado Cancelada y nota de paso sin fecha. Default: sin paso actual; el badge muestra `Cancelada`.
- **DP-B15-07** Texto de acceso denegado (B10 §2, NO DEFINIDO). Default: `No tenés permiso para ver esta póliza.`
- **DP-B15-08** Formato del plan (D13 de B10). Default: `{nombrePlan} ({codigoPlan})` (B10 §5). B8 usa otro formato; el equipo elige uno y se corrige en B-12.
- **DP-B15-09** Texto de tabla sin cuotas (NO DEFINIDO). Default: `No hay cuotas para esta póliza.`
- **PB-27** (degrada): historial, motivo, emisor. Paso 3 sin fecha.
- **PB-16** (degrada): `DateTime` sin `Z`. Se trata como UTC.

## 14. Riesgos y errores comunes

- Armar el paso 3 con una fecha inventada (`fechaFin` u otra): el back no tiene la fecha de suspensión (D10 de B10).
- Mostrar el importe sin recargo: no coincide con lo que se cobra en caja o por cupón.
- Calcular el estado de cada cuota en el front a partir de fechas: el estado lo devuelve el back.
- Mostrar el `Estado` como número: usar T-10.
- Confundir `fechaFin` (paso 5) con `fechaInicio` (vigencia).
- Olvidar que `fechaEmision` puede no traer `Z` y tratarla como local.
- Dejar botones de B-16 o B-18 dentro de este archivo: ocupan lugar de otra tarea y generan conflictos de merge.
- Llamar a `/cuotas` además del detalle sin necesidad: duplica la carga.

## 15. Definición de terminado

- `lint`, `typecheck`, `test` y `build` en verde.
- Todos los criterios de §11 tildados con evidencia observada.
- Accesibilidad revisada con T-19.
- Slots `PolizaAcciones` y `aside` documentados para B-16 y B-18.
- Pasos de §12 entregados y confirmados antes del PR a `development`.

## 16. Observaciones al índice

- Resuelto (RV-04): se agregan T-24 y T-26 a "Depende de" (cliente y año del vehículo), y también T-05, T-09 y T-10.
- Resuelto (RV-32): `GET /api/polizas/{id}/cuotas` sale de la fila de endpoints; el detalle ya trae `cuotas`.
- Resuelto (RV-D10): el botón "Registrar pago en caja" del encabezado lo coloca B-16 con `CobrarVencidasButton` de B-17. Esta tarea solo deja el slot de acciones.
