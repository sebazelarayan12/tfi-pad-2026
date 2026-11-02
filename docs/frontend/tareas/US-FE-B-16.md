# US-FE-B-16: Detalle de póliza: cancelar y cupón de empleado

Tipo: B · Oleada: 6 · Tamaño: M · Rama sugerida: `feature/US-FE-B-16-cancelar-cupon-poliza` · Tarjeta Trello: `US-FE-B-16`

## 1. Objetivo

Desde el detalle de la póliza (B-15), el Empleado o Administrador puede:

- **Cancelar la póliza** con un diálogo que pide un motivo obligatorio (1 a 200 caracteres). `POST /api/polizas/{id}/cancelar` se envía una sola vez, sin reintento. Al confirmarse, la póliza queda Cancelada y sus cuotas no pagadas, Anuladas.
- **Registrar el cobro en caja** de las cuotas vencidas con el botón "Registrar pago en caja", que usa `CobrarVencidasButton` de B-17 (RV-D10).
- **Pedir el cupón de Pago Fácil** de una cuota (`GET /api/pagofacil/cuotas/{cuotaId}/cupon`). El cupón se pide cada vez y no se guarda: muestra los 42 dígitos y los importes de primer y segundo vencimiento.

Las dos acciones se habilitan según el estado de la póliza y de sus cuotas (B10 §7). Solo el Empleado y el Administrador las ven; el cupón nunca aparece en la web pública.

## 2. Alcance

**Entra**
- Botones "Registrar pago en caja" (primero), "Cupón Pago Fácil" y "Cancelar póliza" en la barra de acciones (`PolizaAcciones`, slot de B-15). El primero es `CobrarVencidasButton` de `@/features/pagos` (B-17), sin lógica propia.
- Diálogo de cancelación con foco atrapado, motivo con etiqueta visible y contador.
- `POST /api/polizas/{id}/cancelar` con `{ motivo }` recortado.
- Panel del cupón: 42 dígitos, importes y fechas de vencimiento, y copia del código.
- Reglas de habilitación por estado de póliza y cuota.
- Tests.

**No entra**
- Lógica del cobro, `CobroCaja` y `useCobrarCuotas` (B-17). Columna de rail con deuda y pagos (B-18).
- Selector de cuota para el cupón (ver DP-B16-02: se usa la primera cuota elegible).
- Simbología gráfica del código de barras (B10 D6, sin definir).
- Suspender o reactivar (acciones automáticas, RN09).
- Reintegros de pagos (RN13: no existen).

## 3. Dependencias

- **Oleada (INDEX):** 6.
- **Puede empezar sin esperar a:** `US-FE-B-18` (misma pantalla; no comparten archivos, el botón del encabezado vive en `PolizaAcciones`).
- **Depende de:** `US-FE-B-15`, `US-FE-B-17`, `US-FE-T-05`, `US-FE-T-07`, `US-FE-T-08`, `US-FE-T-09`, `US-FE-T-10`, `US-FE-T-11`, `US-FE-T-19`, `US-FE-T-28`, `US-FE-T-30`.
- **Pedidos al back (INDEX):** PB-30 (degrada: cupón de póliza Vencida).
- **Degradaciones:** PB-18: importes altos no entran en el código; el back responde 400 y se muestra su `detail`. PB-14: los 400 no tienen código; se usa el `detail`. PB-15: el `motivo` vacío llega con mensaje en inglés en `errors.motivo`; el front usa su propio texto.
- **Uso de T-07:** `Backdrop` para el fondo del diálogo y `AlertaError`.
- **Workaround MSW (FB7.7):** los endpoints de cancelar y cupón están Implementados; los tests usan mocks de T-28 y T-30. El cobro usa el handler de T-29 (vía B-17).

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB7.9 (mutaciones sensibles), FB7.11, FB4, FB5.
- `docs/frontend/tareas/INDEX.md`: fila `US-FE-B-16`; FC10, FC11 (`retry: 0`, botón deshabilitado, sin reenvío a ciegas), FC12 (sin almacenamiento del cupón), FC13 (sin `fetch` suelto), FC16 (foco y `aria-*`).
- `docs/frontend/pantallas/B10-detalle-poliza.md`: §5 (solo los textos de los botones), §6 (motivo: reglas y recorte), §7 (tabla de habilitación de cancelar y cupón por estado; estados de acción en curso y éxito), §8 (acciones y destinos de cancelar y cupón), §9 (endpoints de cancelar y cupón, errores), §10 (RN11, RN13, RN18), §12 (diálogo modal, foco, `aria-live`). §13: D2 (motivo), D3 (cuota del cupón), D4 (qué mostrar del cupón), D6 (cobro y pagos), D7 (colores).
- `docs/frontend/contratos-api/polizas-cuotas-pagofacil.md`: §3.5 (qué acciones acepta el back por estado), §5.4 (`CancelarPolizaRequest` y errores de cancelar), §6.1 (`CuponPagoFacilResponse` y errores), §6.2 (reglas de importes, solo para entender), §6.3 (código de 42 dígitos y "tratar como texto opaco").
- `docs/frontend/design-system.md`: §5.1 (Button: Secondary y Ghost), §5.14 (Backdrop), §8.1 (contraste de `status/cancelada/text`, que B10 §12 señala), §8.3 (foco visible).
- `docs/frontend/pedidos-al-back.md`: PB-14, PB-15, PB-18, PB-30.

## 5. Archivos a crear o modificar

Todos bajo `frontend/apps/backoffice/src/features/polizas/` (dueño B-13; B-15 y B-18 también escriben aquí).

| Archivo | Acción |
|---|---|
| `components/PolizaAcciones.tsx` | Modifica (dueño B-15): B-16 agrega los tres botones dentro del slot; "Registrar pago en caja" es `CobrarVencidasButton` importado de `@/features/pagos` (B-17) |
| `components/CancelarPolizaDialog.tsx` | Crea. Diálogo modal con formulario de motivo |
| `components/CuponPanel.tsx` | Crea. Resultado del cupón y botón Copiar |
| `lib/reglasAcciones.ts` | Crea. Función pura: `(estadoPoliza, cuotas) → { puedeCancelar, puedeCupon, cuotaCupon }` |
| `lib/motivo.ts` | Crea. Recorte y conteo de caracteres del motivo |
| `schemas/cancelarPolizaSchema.ts` | Crea. zod para el motivo |
| `api/useCancelarPoliza.ts` | Crea. `useMutation`, `retry: 0` |
| `api/useCuponPagoFacil.ts` | Crea. Consulta sin caché (ver §6) |
| `**/*.test.ts(x)` | Crea |

Sin editar: `packages/api/**` (T-28, T-30) y `app/**`.

## 6. Pasos de implementación

1. Leer la fila de B-16 y confirmar que B-15 está mergeado (con `PolizaAcciones` y `aside`) y que B-17 exporta `CobrarVencidasButton`.
2. **RED:** escribir los tests de `reglasAcciones` y `motivo` (§10) y el test de la tabla de habilitación por estado.
3. `reglasAcciones(poliza)`:
   - `puedeCancelar`: `estado` en `Pendiente`, `Vigente` o `Suspendida`. Cancelada y Vencida no (B10 §7; el back responde 400 para ambas).
   - `puedeCupon`: hay una cuota con estado `Pendiente` o `Vencida` y la póliza no está Cancelada. Vencida se habilita si hay cuotas elegibles (PB-30, DP-B16-03).
   - `cuotaCupon`: la cuota elegible con menor `numero` (DP-B16-02).
4. `motivo`: `recortar(texto)` quita espacios de los bordes; `largo(texto)` cuenta los caracteres después de recortar. Validación: 1 a 200.
5. `cancelarPolizaSchema`: `motivo: z.string().trim().min(1, MSG_MOTIVO_VACIO).max(200, MSG_MOTIVO_LARGO)`.
6. `useCancelarPoliza(polizaId)`: `useMutation({ mutationFn: (motivo) => cancelarPoliza(polizaId, { motivo }), retry: 0 })`. En `onSuccess` invalida `polizasKeys.detalle(polizaId)` y `polizasKeys.cuotas(polizaId)` y cierra el diálogo. En error de red (sin respuesta), no reintenta y muestra DP-B16-06.
7. `CancelarPolizaDialog`:
   - `role="dialog"`, `aria-modal="true"`, `aria-labelledby` apuntando al título.
   - Fondo con `Backdrop` (T-07).
   - Foco inicial en el campo de motivo. Tab y Shift+Tab quedan dentro del diálogo (foco atrapado).
   - Escape cierra el diálogo y devuelve el foco al botón "Cancelar póliza".
   - Campo `Motivo de cancelación` con label visible, contador `{n} de 200`, `aria-describedby` al contador.
   - Botón "Confirmar cancelación" (primario): deshabilitado si el motivo recortado está vacío, o mientras corre. Botón "Volver" (secundario) cierra sin enviar.
8. Errores del `POST`: `errors.motivo` (400 de validación del framework) → error de campo con DP-B16-04 (no el texto en inglés, PB-15). `detail` → alerta dentro del diálogo, tal cual (TransicionInvalidaException, 404).
9. `useCuponPagoFacil(cuotaId)`: `useQuery` con `enabled: false` y `refetch()` al clic, `staleTime: 0` y `gcTime: 0`: cada clic pide un cupón nuevo (no se cachea entre días). `retry: false` (es una consulta de un solo intento; FB7.9).
10. `CuponPanel`: muestra el cupón después de la respuesta. Campos y etiquetas en §8. El código de 42 dígitos va en mono, sin espacios. Botón "Copiar código" copia el texto de 42 dígitos sin espacios (`navigator.clipboard`, con `try/catch`; si falla, DP-B16-07).
11. `PolizaAcciones` (de B-15), en este orden: "Registrar pago en caja" (`CobrarVencidasButton` de B-17, sin lógica propia y sin request al montar), "Cupón Pago Fácil" (secundario) y "Cancelar póliza" (texto con color `status/cancelada/text`, sin borde). Cupón y cancelar siguen `reglasAcciones`; el cobro se habilita solo con cuotas Vencida (D-B18-03, vía B-17). Deshabilitados con `aria-disabled` cuando corresponde.
12. Éxito de cancelación: la pantalla de detalle se actualiza (badge `Cancelada`, cuotas Anuladas, acciones deshabilitadas). Texto de éxito DP-B16-05.
13. GREEN, luego refactor. `lint`, `typecheck`, `test` y `build`.

## 7. Contrato con el back

| Método y ruta | Estado | Uso |
|---|---|---|
| `POST /api/polizas/{id}/cancelar` | Implementado | Cancelar. Body `{ motivo }`. 200 con `PolizaDetalleResponse`. |
| `GET /api/pagofacil/cuotas/{cuotaId}/cupon` | Implementado (solo Empleado) | Cupón de una cuota. 200 con `CuponPagoFacilResponse`. |
| `POST /api/pagos/caja` | Implementado | Lo llama `CobrarVencidasButton` (B-17) desde la barra de acciones. Esta tarea no hace esa request. | 201 `PagoResponse` |

Tipos (dueño T-28 y T-30; no se redefinen):

```ts
export interface CancelarPolizaRequest {
  motivo: string; // 1..200 caracteres después de recortar
}

export interface CuponPagoFacilResponse {
  cuotaId: string;
  numeroPoliza: string;               // "POL-0000001"
  numeroCuota: number;
  importePrimerVencimiento: number;   // pesos
  fechaPrimerVencimiento: string;     // yyyy-MM-dd
  importeSegundoVencimiento: number;  // pesos
  fechaSegundoVencimiento: string;    // yyyy-MM-dd
  codigoBarras: string;               // 42 dígitos; texto opaco
}
```

Errores de cancelar (texto exacto, `polizas-cuotas-pagofacil.md §5.4`):

| Status | Texto del back | Tratamiento |
|---|---|---|
| 400 | `errors.motivo` (vacío o más de 200; mensaje en inglés, PB-15) | Error de campo con DP-B16-04 |
| 400 | `No se puede pasar una póliza de {Estado} a Cancelada.` | Alerta en el diálogo con el texto |
| 404 | `La póliza {id} no existe.` | Alerta en el diálogo |
| 401 / 403 | — | T-08 y T-13 |

Errores del cupón (texto exacto, `polizas-cuotas-pagofacil.md §6.1`):

| Status | Texto del back | Tratamiento |
|---|---|---|
| 400 | `No se puede generar el cupón de una cuota en estado {Estado} (RN11).` | Panel de cupón con el texto |
| 400 | `El importe {x} no entra en el código de Pago Fácil.` | Panel con el texto (PB-18) |
| 404 | `La cuota no existe.` | Panel con el texto |
| 404 | `La póliza de la cuota no existe.` | Panel con el texto |
| 500 | `Ocurrió un error inesperado.` | Panel con el texto |

Handlers MSW: `POST /api/polizas/{id}/cancelar` (T-28) y `GET /api/pagofacil/cuotas/{cuotaId}/cupon` (T-30). El cobro usa el handler de T-29 (vía B-17).

## 8. Contenido de UI (literal)

**Botones (barra de acciones)**

| Zona | Texto |
|---|---|
| Cobro | `Registrar pago en caja` (B10 §5; componente de B-17) |
| Cupón | `Cupón Pago Fácil` |
| Cancelar | `Cancelar póliza` |

**Diálogo de cancelación** (B10 §5 y §6: el Figma no define estos textos; defaults de DP-B16-01 a DP-B16-04)

| Zona | Texto |
|---|---|
| Título | `Cancelar póliza {numero}` |
| Texto | `Esta acción anula las cuotas no pagadas y no se puede deshacer.` |
| Label | `Motivo de cancelación` |
| Contador | `{n} de 200` |
| Confirmar | `Confirmar cancelación` |
| Volver | `Volver` |
| Error de vacío | `Ingresá un motivo para cancelar la póliza.` |
| Error de largo | `El motivo no puede tener más de 200 caracteres.` |

**Panel de cupón**

| Zona | Texto |
|---|---|
| Título | `Cupón de Pago Fácil` |
| Cuota | `Cuota {numeroCuota} de {vigenciaMeses}` (DP-B16-02) |
| Etiquetas | `Primer vencimiento`, `Segundo vencimiento`, `Código de barras` (DP-B16-08) |
| Valores | `{importe} el {dd/MM/yyyy}` para cada vencimiento |
| Botón | `Copiar código` (DP-B16-07) |

**Textos de éxito y de error de red:** DP-B16-05 y DP-B16-06.

**No se renderizan:** la simbología gráfica del código de barras (B10 D6), el selector de cuota, la descarga o impresión del cupón (D4 de B10: se muestra en pantalla).

## 9. Estados y casos borde

| Caso | Comportamiento |
|---|---|
| Sin cuotas Vencida | "Registrar pago en caja" deshabilitado (D-B18-03, vía B-17). Sin request. |
| Póliza Cancelada | "Cancelar póliza" y "Cupón Pago Fácil" deshabilitados. |
| Póliza Vencida | "Cancelar póliza" deshabilitado. "Cupón Pago Fácil" habilitado si hay cuotas elegibles (PB-30). |
| Póliza Pendiente, Vigente o Suspendida | Cancelar habilitado. Cupón habilitado si hay cuotas `Pendiente` o `Vencida`. |
| Sin cuotas elegibles | Cupón deshabilitado con `aria-disabled`. |
| Diálogo abierto y motivo vacío | "Confirmar cancelación" deshabilitado. Sin request. |
| Motivo con 201 caracteres | Error de largo. "Confirmar" deshabilitado. |
| Motivo con espacios en los bordes | Se recorta antes de contar y enviar. |
| Confirmando | "Confirmar cancelación" con `aria-busy="true"` y deshabilitado; "Volver" deshabilitado; anuncio en `aria-live="polite"`. |
| Doble clic en confirmar | Una sola request. |
| 200 | Diálogo cerrado; detalle recargado; badge Cancelada. |
| Error de red en cancelar | Sin reintento. Mensaje DP-B16-06 en el diálogo: el usuario recarga para ver el estado. |
| 400 de `errors.motivo` | Error de campo; el diálogo queda abierto. |
| 400 o 404 con `detail` | Alerta dentro del diálogo; queda abierto. |
| Cupón: clic | Request nueva; el panel muestra "cargando" y luego el resultado. |
| Cupón: dos clics seguidos | Dos requests, cada una con su resultado; no se guarda nada. |
| Cupón: error 400 o 404 | Panel con el `detail` tal cual. |
| Copiar en un navegador sin permiso | Mensaje DP-B16-07; no falla la pantalla. |
| Escape con diálogo abierto | Cierra; el foco vuelve a "Cancelar póliza". |
| Permisos | Empleado y Administrador (T-13). |

## 10. Tests requeridos

| Test | Afirma | Herramienta |
|---|---|---|
| `reglas: Pendiente, Vigente y Suspendida pueden cancelar` | `puedeCancelar = true` | Vitest (tabla) |
| `reglas: Cancelada y Vencida no pueden cancelar` | `puedeCancelar = false` | Vitest (tabla) |
| `reglas: Cancelada no tiene cupón` | `puedeCupon = false` | Vitest |
| `reglas: sin cuotas Pendiente ni Vencida no hay cupón` | `puedeCupon = false` | Vitest |
| `reglas: cuotaCupon es la de menor número elegible` | Número esperado | Vitest |
| `reglas: Vencida con cuotas elegibles tiene cupón` | `puedeCupon = true` | Vitest |
| `motivo: recorta espacios y cuenta después de recortar` | `largo("  hola  ") = 4` | Vitest |
| `motivo: 201 caracteres falla y 200 pasa` | Límites | Vitest |
| `motivo: vacío o solo espacios falla` | Mensaje de vacío | Vitest |
| `diálogo: confirmar deshabilitado con motivo vacío y sin request` | `aria-disabled` y conteo 0 | Testing Library + MSW |
| `diálogo: envía { motivo } recortado` | Body exacto | Testing Library + MSW |
| `diálogo: doble clic envía una sola request` | Conteo en 1 | Testing Library + MSW (delay) |
| `diálogo: error de red no reintenta` | Conteo en 1 y mensaje DP-B16-06 | Testing Library + MSW |
| `diálogo: 400 de errors.motivo muestra error de campo con el texto propio` | No aparece texto en inglés | Testing Library + MSW |
| `diálogo: 400 con detail de transición inválida se muestra` | Texto exacto | Testing Library + MSW |
| `diálogo: role dialog, aria-modal y título asociado` | Atributos | Testing Library |
| `diálogo: foco inicial en el motivo` | `document.activeElement` | Testing Library |
| `diálogo: Tab no sale del diálogo` | Foco se queda dentro | Testing Library (user-event) |
| `diálogo: Escape cierra y devuelve el foco` | Foco en el botón de origen | Testing Library (user-event) |
| `diálogo: éxito cierra y recarga el detalle` | Badge Cancelada y cuotas Anuladas | Testing Library + MSW |
| `cupón: muestra los 42 dígitos y los dos importes` | Texto exacto | Testing Library + MSW |
| `cupón: cada clic hace una request nueva` | Dos clics = dos requests | Testing Library + MSW |
| `cupón: no se guarda entre montajes` | Sin request al volver a montar | Testing Library + MSW |
| `cupón: 400 muestra el detail` | Texto exacto | Testing Library + MSW |
| `cupón: copiar envía los 42 dígitos sin espacios` | Texto copiado | Testing Library (mock de clipboard) |
| `cupón: copiar sin permiso muestra DP-B16-07` | Mensaje y pantalla estable | Testing Library |
| `acciones: tabla de habilitación por estado` | Ambos botones según estado | Testing Library + MSW |
| `acciones: Registrar pago en caja es el primer botón y se deshabilita sin cuotas Vencida` | Orden de la barra y `aria-disabled`; sin request al montar | Testing Library + MSW |
| `a11y: sin violaciones con el diálogo abierto` | Axe sin violaciones | vitest-axe (T-19) |

## 11. Criterios de aceptación

1. "Cancelar póliza" está habilitado solo en Pendiente, Vigente y Suspendida; en Cancelada y Vencida aparece deshabilitado.
2. "Cupón Pago Fácil" está deshabilitado en Cancelada y sin cuotas elegibles; en las demás, pide el cupón de la cuota elegible de menor número.
3. "Registrar pago en caja" es el primer botón de la barra y es el `CobrarVencidasButton` de B-17: se deshabilita sin cuotas Vencida, no hace request al montar y envía solo esas cuotas (RV-D10).
4. El diálogo es `role="dialog"` con `aria-modal="true"`, título asociado y motivo con label visible.
5. El foco inicial está en el motivo; Tab no sale del diálogo; Escape lo cierra y devuelve el foco a "Cancelar póliza".
6. "Confirmar cancelación" está deshabilitado con motivo vacío o solo espacios, y no hace request.
7. El motivo se envía recortado y tiene como máximo 200 caracteres.
8. Confirmar envía una sola request `POST /api/polizas/{id}/cancelar`, aun con doble clic.
9. Con 200, el diálogo se cierra y la póliza muestra Cancelada con sus cuotas Anuladas.
10. Un error de red no se reintenta y muestra el mensaje DP-B16-06.
11. Un 400 de `errors.motivo` muestra el mensaje propio, no el texto en inglés del back.
12. Un 400 o 404 con `detail` muestra ese texto dentro del diálogo.
13. Cada clic en "Cupón Pago Fácil" hace una request nueva; el resultado no se guarda entre montajes.
14. El panel muestra el código de 42 dígitos completo, en mono, y los dos importes con sus fechas.
15. "Copiar código" copia los 42 dígitos sin espacios; si el navegador no lo permite, muestra el mensaje y la pantalla sigue.
16. Todos los tests de §10 están en verde, sin axe violations.
17. `lint`, `typecheck`, `test` y `build` del backoffice están en verde.

## 12. Verificación manual

1. `VITE_USE_MOCKS=true npm run dev -w apps/backoffice`, sesión de Empleado.
2. Abrir una póliza Vigente del mock: "Cupón Pago Fácil" y "Cancelar póliza" habilitados.
3. Pedir el cupón: aparecen 42 dígitos y los importes. Pedirlo dos veces: dos requests en Network.
4. Abrir "Cancelar póliza": el foco está en el motivo; Tab no sale; Escape cierra y devuelve el foco.
5. Confirmar sin motivo: el botón está deshabilitado. Escribir un motivo y confirmar: una sola request; la póliza queda Cancelada.
6. Abrir una póliza Cancelada: los dos botones están deshabilitados.

Confirmar al responsable antes del PR. Esta acción es irreversible en el sistema: probar solo con datos de prueba.

## 13. Decisiones pendientes

- **DP-B16-01** (RV-D21, default aplicado) Título y texto del diálogo de cancelación (B10 §13 D2: NO DEFINIDO). Default: los textos de §8.
- **DP-B16-02** Cuota del cupón (B10 D3). Default: la de menor número elegible, con el número visible en el panel. Alternativa: selector de cuota (cambia B-15: una columna con acción por fila).
- **DP-B16-03** Cupón de una póliza Vencida (PB-30, B10 D6). Default: habilitado si hay cuotas elegibles, hasta que el back decida.
- **DP-B16-04** Texto de error de motivo vacío o largo. Default: los textos de §8; no se usan los del back (PB-15).
- **DP-B16-05** Texto de éxito de la cancelación. NO DEFINIDO. Default: `Póliza cancelada.`
- **DP-B16-06** Texto de error de red al cancelar: no se sabe si se guardó. Default: `No se pudo confirmar la cancelación. Recargá la póliza para ver su estado.`
- **DP-B16-07** Texto del botón de copiar y de su fallo. Default: `Copiar código`; si el navegador no permite copiar: `No se pudo copiar. Seleccionalo y copialo a mano.`
- **DP-B16-08** Etiquetas del cupón. NO DEFINIDO. Default: las de §8.
- **DP-B16-09** (RV-D10): el botón "Registrar pago en caja" del encabezado lo coloca esta tarea con `CobrarVencidasButton` de B-17. Texto y habilitación son los de B-17 (D-B18-03).
- **D4** (B10): el cupón se muestra en pantalla. Implementado con este default; descargar o imprimir queda para una tarea aparte.
- **D6** (B10): simbología del código de barras. No se dibuja código gráfico; solo el texto de 42 dígitos (contrato §6.3).
- **PB-18** (degrada): importes altos. Se muestra el `detail` del back.

## 14. Riesgos y errores comunes

- Reintentar `POST /api/polizas/{id}/cancelar` tras un error de red: la cancelación puede haberse aplicado (FC11).
- Enviar el motivo sin recortar: el back lo cuenta después de recortar; contar distinto da errores de largo.
- Mostrar el texto en inglés de `errors.motivo`: PB-15; usar el texto propio.
- Cachear el cupón con `useQuery` normal: vence cada día (contrato §6.3, "no cachear entre días").
- Mostrar el código de barras con espacios o formatearlo: el contrato lo trata como texto opaco.
- Armar el foco sin devolverlo al botón de origen: falla la accesibilidad (FC16).
- Ofrecer el cupón de una cuota `Pagada` o `Anulada`: el back responde 400.
- Dejar el diálogo sin `aria-modal` o sin atrapar el foco.

## 15. Definición de terminado

- `lint`, `typecheck`, `test` y `build` en verde.
- Todos los criterios de §11 tildados con evidencia observada.
- Accesibilidad del diálogo revisada con T-19 (foco, Escape, nombre accesible).
- Pasos de §12 entregados y confirmados antes del PR a `development`.

## 16. Observaciones al índice

- Resuelto (RV-D21): el texto del diálogo de cancelación (NO DEFINIDO en B10) queda con los defaults de §8 (DP-B16-01).
- Resuelto (RV-04): se agregan T-07, T-08, T-09 y B-17 a "Depende de". T-11 y T-19 quedan por convención.
- Resuelto (RV-D10 / RV-66): el botón "Registrar pago en caja" del encabezado lo coloca esta tarea con `CobrarVencidasButton` de B-17.
- ABIERTO: confirmación de PB-30 (cupón de póliza Vencida). Motivo: la observación no aparece en REVISION.md ni en FB8; el degradado ya figura en el INDEX.
