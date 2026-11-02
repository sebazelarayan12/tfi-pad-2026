# US-FE-W-06: Elegir medio de pago (Pasarela A, Pasarela B, Pago Fácil)

Tipo W · Oleada 5 · Tamaño M · Rama sugerida `feature/US-FE-W-06-medio-de-pago` · Tarjeta Trello `US-FE-W-06`

## 1. Objetivo

Al terminar, `/poliza/pagar/medio-de-pago` muestra las cuotas elegidas, un grupo de tres medios de pago y el resumen con el total. Con "Pasarela A" o "Pasarela B" hace `POST /api/publico/pagos`, guarda solo el `numeroPago` en `sessionStorage` y redirige al checkout de la pasarela. Con "Pago Fácil" navega a W5 sin llamar a la API. Sin estado válido, redirige. Para el cliente anónimo que va a pagar.

## 2. Alcance

**Entra**
- Feature `pagos` de la web (`apps/web-publica/src/features/pagos/`): `routes.tsx` (ruta de W4; W-08 agrega la de `/pago/exito`), `index.ts`, `pages/MedioDePagoPage.tsx`, componentes del grupo de opciones y del resumen, `api/usePagarOnline.ts`, `api/almacenamientoPago.ts` (guarda y lee `numeroPago`), `api/redireccion.ts` (`redirigirA(url)`), `schemas/estadoNavegacion.ts`.
- Opciones: Pasarela A → `pasarela1`; Pasarela B → `pasarela2`; Pago Fácil (tercera opción) → navega a W-07 por ruta, sin llamar a la API y sin dependencia de W-07 (RV-46).
- Resumen de cuotas con el total (suma de `total` en centavos) y el detalle de recargos.
- Manejo de errores 400, 404, 429, 502 y de red.
- Reuso de `shared/formato/listaCuotas.ts` (dueña W-04, RV-47).
- Bootstrap de mocks en `apps/web-publica/src/main.tsx` (`iniciarMocksSiCorresponde`, T-11; RV-D03).

**NO entra**
- Pantalla W5 (US-FE-W-07) y W6 (US-FE-W-08).
- Endpoint `GET /api/publico/medios-pago` (NO existe, PB-22): los nombres y el orden son fijos en el front (D-09).
- Webhook de la pasarela y confirmación del pago: lo hace el back.
- Cambiar el proveedor después de iniciar el pago.

## 3. Dependencias

- **Puede empezar sin esperar a:** US-FE-W-07 (solo se navega a su ruta; sin dependencia, RV-46).
- **Depende de** (fila del INDEX):
  - US-FE-T-04 (fila del INDEX; esta pantalla no tiene campos de texto).
  - US-FE-T-05 (`Button` Primary "Continuar", Secondary).
  - US-FE-T-07 (`CardWidget` para "Resumen de pago" y "Detalle de cuotas"; `AlertaError` con `role="alert"`).
  - US-FE-T-09 (`formatearImporte`, `formatearFechaDateOnly`).
  - US-FE-T-11 (MSW base; bootstrap de mocks en `main.tsx`, RV-D03).
  - US-FE-T-18 (`PublicLayout`, `PublicNav`, `PublicFooter`).
  - US-FE-T-19 (harness de accesibilidad).
  - US-FE-T-31 (función `iniciarPagoPublico` y tipos `PagoPublicoRequest` / `PagoPublicoResponse` en `@nexa/api`; handler MSW).
  - US-FE-W-03 (`EstadoPagoPublico` y `leerEstadoNavegacion` exportados desde `features/polizas/index.ts`).
  - US-FE-W-04 (dueña de `shared/formato/listaCuotas.ts`, que esta tarea reusa; RV-47).
- **Bloqueada por pedidos al back:**
  - PB-22 (MSW, bloquea los nombres de las pasarelas): los nombres son "Pasarela A" y "Pasarela B" (D-09).
  - PB-12 (degrada): sin `Idempotency-Key`; la protección es el doble clic en el front (FC11).
  - PB-01 (no bloquea esta pantalla): sin endpoint de estado público; W-08 lo necesita.
- **Workaround MSW:** `POST /api/publico/pagos` está Implementado; el handler lo escribe T-31 para los tests.

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB3 (features y `index.ts`), FB4 (contrato), FB7.9 (mutaciones sensibles), FB7.5 y FB7.4.
- `docs/frontend/tareas/INDEX.md`: FC9 (importes), FC10 (errores: `detail`), FC11 (mutaciones: `retry: 0`, botón deshabilitado, sin reenvío ciego, nunca en el montaje), FC12 (solo `numeroPago` en `sessionStorage`), FC13 (no reintentar `/api/publico/*` ante 429), FC16, D-09.
- `docs/frontend/pantallas/W4-elegir-medio-pago.md`:
  - §1 (propósito), §2 (ruta, estado, guardas),
  - §3 (estructura: encabezado, grupo de opciones, botón, privacidad, resumen y detalle de cuotas),
  - §4 (componentes: `OpcionMedioPago` propio, `Card/Widget`, iconos),
  - §5 (textos literales; incluye "Vas a pagar las cuotas..."),
  - §6 (campos y mapeo de proveedor; validaciones del back),
  - §7 (estados del envío y errores),
  - §8 (acciones; retorno de la pasarela y `numeroPago`),
  - §9.1 (datos de cada cuota), §9.2 (totales), §9.3 (`POST /api/publico/pagos`: request y response),
  - §10 (RN11, RN08, RN20, C8),
  - §11 (390 px),
  - §12 (accesibilidad: `radiogroup`, `label` con radio, foco al `h1`),
  - §13 (dudas D1 a D16; bloqueantes D1, D2, D3; leer D4, D5, D13, D14, D16).
- `docs/frontend/contratos-api/pagos-facturas.md`:
  - §3 (tipos `PagoPublicoRequest` y `PagoPublicoResponse`),
  - §4.2 y §4.4 (pasarelas: `pasarela1`, `pasarela2`, nombres no definidos),
  - §5 paso 1 y paso 2 (qué hace el back; respuesta 201),
  - §5 paso 3 y paso 4 (redirección y retorno; persistir `numeroPago`),
  - §10.6 (errores de `POST /api/publico/pagos`).
- `docs/frontend/contratos-api/convenciones-transversales.md` §3.3 (errores de validación) y §4 (rate limit).
- `docs/frontend/design-system.md`: §5.1 (Button), §5.13 (Card/Widget), §5.4 (Badge "Pendiente" y "Vencida"), §8.1 (contraste de `text/secondary` sobre `accent/lime-soft`: verificar), §8.3 (foco).

## 5. Archivos a crear o modificar

Todos bajo `frontend/apps/web-publica/src/`:

| Archivo | Acción | Dueño |
|---|---|---|
| `features/pagos/routes.tsx` | crear: ruta `/poliza/pagar/medio-de-pago` → `MedioDePagoPage` | W-06 (primer task del feature `pagos` web) |
| `features/pagos/index.ts` | crear: exporta `pagosRoutes`, `leerNumeroPagoEnCurso` (para W-08) | W-06 |
| `features/pagos/pages/MedioDePagoPage.tsx` | crear | W-06 |
| `features/pagos/components/OpcionMedioPago.tsx` | crear (`label` + `input type="radio"`; props `seleccionada`, `icono`, `titulo`, `descripcion`) | W-06 |
| `features/pagos/components/ResumenPagoOnline.tsx` | crear (resumen y detalle de cuotas) | W-06 |
| `features/pagos/api/usePagarOnline.ts` | crear: `useMutation` sobre `iniciarPagoPublico` | W-06 |
| `features/pagos/api/almacenamientoPago.ts` | crear: `guardarNumeroPagoEnCurso`, `leerNumeroPagoEnCurso` con try/catch | W-06 |
| `features/pagos/api/redireccion.ts` | crear: `redirigirA(url)` (envuelve `window.location.assign`, para poder mockearlo) | W-06 |
| `features/pagos/schemas/estadoNavegacion.ts` | crear: zod para `EstadoPagoPublico` con el cupo de cuotas | W-06 |
| `features/pagos/**/*.test.tsx` | crear | W-06 |
| `main.tsx` | modificar: bootstrap de mocks (`iniciarMocksSiCorresponde`, T-11); dueño T-17 | W-06 agrega el bloque (RV-D03) |

Usa sin modificar: `packages/api` (T-31, T-09, T-12), `packages/ui` (T-05, T-07), `apps/web-publica/src/app/*` (T-17, T-18), `shared/formato/listaCuotas.ts` (W-04, RV-47). No editar `package.json` (FC17).

## 6. Pasos de implementación

1. **Estado de navegación**: `leerEstadoNavegacion(useLocation().state)` de `features/polizas`. Si devuelve `null`, `<Navigate to="/consultar-poliza" replace />`. Si `cuotaIds` está vacío, o tiene más de 24 o repetidos, `<Navigate to="/poliza" state={...} replace />` con el mismo `dni`, `numeroPoliza` y `consulta` (W4 §2). Si el estado no tiene `consulta`, volver a W2.
2. **Almacenamiento** (`almacenamientoPago.ts`):
   - `guardarNumeroPagoEnCurso(numeroPago)`: `sessionStorage.setItem('nexa.publico.numeroPago', numeroPago)` dentro de `try/catch`. Si falla, no interrumpe el flujo.
   - `leerNumeroPagoEnCurso()`: devuelve `string | null`, también con `try/catch`.
   - Solo se guarda `numeroPago`. Nunca el DNI ni el número de póliza (FC12, W4 D15).
3. **Mutación** (`usePagarOnline.ts`):
   - `useMutation({ mutationFn: iniciarPagoPublico, retry: 0 })`.
   - Cuando responde 201: `guardarNumeroPagoEnCurso(data.numeroPago)` y `redirigirA(data.urlPago)`.
   - Un ref `enCurso` evita el doble envío además del `disabled` (FC11).
   - No reenviar automáticamente ante error de red.
4. **Página** (`MedioDePagoPage.tsx`):
   - `h1` "Elegí tu medio de pago" y subtítulo. El foco va al `h1` al montar (W4 §12).
   - Grupo `role="radiogroup"` con `aria-labelledby` apuntando a la etiqueta "Medio de pago".
   - Ninguna opción preseleccionada (DN-W6-1). "Continuar" `disabled` hasta elegir.
   - "Continuar":
     - Pasarela A/B: dispara la mutación con `{ dni, numeroPoliza, cuotaIds, proveedor }`.
     - Pago Fácil: `navigate('/poliza/pagar/pago-facil', { state })` sin POST.
   - "Cambiar cuotas": `Link` a `/poliza` con `{ dni, numeroPoliza, consulta }` (sin `cuotaIds` para que W3 no tome selección, y W3 vuelve a mostrar la selección de W-04 desde cero; DN-W6-4).
5. **Opciones** (`OpcionMedioPago.tsx`): cada una es un `label` que envuelve `input type="radio" name="medio"`. Estados visuales: seleccionada con `accent-lime-soft` y borde `accent-lime`; no seleccionada con `surface-panel` y `border-strong`. Icono 24 px decorativo (`alt=""`). Check-circle a la derecha solo en la seleccionada. Alto mínimo 56 px.
6. **Resumen** (`ResumenPagoOnline.tsx`):
   - `CardWidget` "Resumen de pago" con la acción "Cambiar cuotas" y la línea `Póliza POL-0000042 · Plan TC Terceros Completo`.
   - Una tarjeta "Detalle de cuotas" con, por cuota: título "Cuota N de T", vencimiento, badge, "Importe de la cuota" y, si `recargo > 0`, "Recargo por vencimiento (5%)" y "Total cuota N".
   - Total: "Total a pagar (N cuotas)" con "Incluye el recargo de la cuota X" si alguna tiene recargo. Suma en centavos enteros (`Math.round(x * 100)`).
   - Importes con `formatearImporte`; fechas con `formatearFechaDateOnly`.
7. Mapeo de errores de la mutación (sección 9): ver la tabla de estados.
8. `index.ts`: exporta `pagosRoutes` y `leerNumeroPagoEnCurso`. No exporta componentes internos (FB3 regla 1).
9. Escribir los tests de la sección 10 y ejecutarlos.

## 7. Contrato con el back

**`POST /api/publico/pagos`** (`PublicoPagosController`, anónimo, RN20)

- Estado: **Implementado** (US-F4-04). Sin `Location` en la respuesta.
- Request: `PagoPublicoRequest`.
- Response 201: `PagoPublicoResponse`.
- Errores: 400 (validación, proveedor inválido, cuotas de otra póliza o no pagables, pago en curso dentro de la ventana C8, cuotas repetidas), 404 (DNI y póliza no coinciden), 429 (RN20), 502 (la pasarela falla; el pago queda `RECHAZADO` y las cuotas no cambian).

```ts
// packages/api/src/dto/publico.ts (dueño: US-FE-T-31)
export type ProveedorPasarela = 'pasarela1' | 'pasarela2';
export interface PagoPublicoRequest {
  dni: string;              // ^\d{8}$
  numeroPoliza: string;     // máx. 20, p. ej. "POL-0000001"
  cuotaIds: string[];       // uuid, min 1, max 24, sin repetidos
  proveedor: ProveedorPasarela;
}
export interface PagoPublicoResponse {
  numeroPago: string;       // "PAG-xxxxxx"
  idPago: string;           // uuid
  urlPago: string;          // checkout de la pasarela
  fechaExpiracion: string;  // ISO UTC con Z
}
```

Ejemplo de request (`pagos-facturas.md` §5 paso 1):

```json
{ "dni": "30123456", "numeroPoliza": "POL-0000042",
  "cuotaIds": ["f1000000-0000-0000-0000-000000000008", "f1000000-0000-0000-0000-000000000009"],
  "proveedor": "pasarela1" }
```

Mapeo de la opción al valor `proveedor` (W4 §6): Pasarela A → `pasarela1`; Pasarela B → `pasarela2` (propuesta, ver DN-W6-2). Pago Fácil no llama a este endpoint.

Mensajes de error que devuelve el back (`pagos-facturas.md` §10.6), que la UI muestra desde `detail` (FC10):

- 400: "El proveedor de pago indicado no existe.", "Todas las cuotas deben pertenecer a la póliza indicada.", "Solo se pueden pagar cuotas pendientes o vencidas (RN11).", "Alguna de las cuotas ya tiene un pago en curso. Intente de nuevo más tarde.", "Las cuotas no pueden repetirse."
- 404: "No se encontró un registro con los datos indicados."
- 502 y 429: ver la sección 9.

Handler MSW: lo escribe US-FE-T-31. En los tests, `server.use(...)` para cada respuesta.

## 8. Contenido de UI

| Zona | Texto literal |
|---|---|
| Nav | Planes · Contacto · Consultar póliza (T-18) |
| `h1` | Elegí tu medio de pago |
| Subtítulo | Vas a pagar las cuotas 8 y 9 de la póliza POL-0000042. |
| Subtítulo, 1 cuota (propuesta, NO DEFINIDO) | Vas a pagar la cuota 8 de la póliza POL-0000042. |
| Etiqueta del grupo | Medio de pago |
| Opción 1 título | Pasarela A |
| Opción 1 descripción | Pago online con tarjeta o dinero en cuenta. |
| Opción 2 título | Pasarela B |
| Opción 2 descripción | Pago online con tarjeta o dinero en cuenta. |
| Opción 3 título | Pago Fácil |
| Opción 3 descripción | Efectivo con cupón de código de barras. Acreditación hasta 72 h hábiles. (sin el "(dato de ejemplo)" del Figma; DN-W6-5) |
| Botón | Continuar |
| Botón durante el envío (propuesta) | Continuar (con spinner y `aria-busy="true"`) |
| Privacidad | Tus datos viajan cifrados y no se guardan en este dispositivo. |
| Resumen, título | Resumen de pago |
| Resumen, acción | Cambiar cuotas |
| Resumen, línea | Póliza POL-0000042 · Plan TC Terceros Completo |
| Detalle, título de cuota | Cuota 8 de 12 |
| Detalle, vencimiento | Vencimiento 10/10/2026 |
| Detalle, badges | Vencida · Pendiente |
| Detalle, filas | Importe de la cuota · Recargo por vencimiento (5%) · Total cuota 8 |
| Total | Total a pagar (2 cuotas) · Incluye el recargo de la cuota 8 · `$ 51.250,00` |
| Error 400 | (el `detail` del back; ver sección 7) |
| Error 404 | (el `detail` del back) |
| Error 429 (literal del Figma de W2, reutilizado) | Hiciste muchos intentos. Esperá un minuto y volvé a probar. |
| Error 502 sin `detail` (propuesta, NO DEFINIDO) | No pudimos conectar con la pasarela. Intentá de nuevo en unos minutos. |
| Error de red (propuesta, NO DEFINIDO) | No pudimos iniciar el pago. Revisá tu conexión e intentá de nuevo. |
| Pie | Teléfono · A confirmar · Email · A confirmar · Ubicación · Dirección a confirmar · Horarios · Lunes a viernes, horario a confirmar · © 2026 Nexa Seguros. Todos los derechos reservados. (T-18) |

Importes: `$ 25.000,00` con `formatearImporte`. La etiqueta de cuotas usa `formatearListaCuotas` de `shared/formato/listaCuotas.ts` (1: `8`; 2: `8 y 9`; 3 o más: `8, 9 y 10`, DN-W5-2).

## 9. Estados y casos borde

| Estado | Comportamiento |
|---|---|
| Sin estado o inválido | Redirige a `/consultar-poliza`. |
| `cuotaIds` vacío, repetido o de más de 24 | Redirige a `/poliza` con el estado. |
| Inicial, sin opción | Opciones sin marcar; "Continuar" `disabled`. |
| Opción elegida | Estilo lime y `aria-checked` (radio nativo). |
| Enviando (pasarela) | "Continuar" `disabled` y `aria-busy="true"`; las opciones quedan `disabled` para no cambiar el proveedor a mitad del envío. |
| 201 | Guarda `numeroPago` y redirige a `urlPago` (`redirigirA`). Sin pantalla intermedia. |
| 400 | `AlertaError` (`role="alert"`) con el `detail`. Se conserva la opción; el usuario puede reintentar. |
| 404 | `AlertaError` con el `detail`. |
| 429 | `AlertaError` con el texto de 429 (sección 8). Sin reintento automático (FC13). |
| 502 | `AlertaError` con el `detail` si lo trae; si no, el texto de 502. |
| Red / 500 | `AlertaError` con el texto de red. Sin reintento automático (FC11). |
| Pago Fácil | Navega a W5 con el estado. Sin POST. |
| `sessionStorage` no disponible | El flujo continúa: la guarda falla en silencio y el número no queda para W6 (DN-W6-6). |
| Doble clic | Una sola petición (ref + `disabled`). |

Accesibilidad de los errores: `role="alert"` y foco al `AlertaError` al aparecer (propuesta; FC16).

## 10. Tests requeridos

Vitest + Testing Library + MSW. `redirigirA` mockeado con `vi.mock('features/pagos/api/redireccion')`. Un test por regla (FC5).

| Test | Afirma | Herramienta |
|---|---|---|
| `sin estado redirige a /consultar-poliza` | URL final | MemoryRouter |
| `cuotaIds vacío redirige a /poliza` | URL final `/poliza` | MemoryRouter |
| `más de 24 cuotas redirige a /poliza` | ídem con 25 ids | MemoryRouter |
| `cuotaIds repetidos redirige a /poliza` | ídem | MemoryRouter |
| `h1 y subtítulo con las cuotas y la póliza` | "Vas a pagar las cuotas 8 y 9 de la póliza POL-0000042." | Testing Library |
| `subtítulo singular con una cuota` | "Vas a pagar la cuota 8 de la póliza…" | Testing Library |
| `tres opciones en un radiogroup sin preseleccionar` | 3 radios sin `checked` y `aria-labelledby` del grupo | Testing Library |
| `Continuar deshabilitado hasta elegir una opción` | `disabled` antes y habilitado tras elegir | Testing Library |
| `Pago Fácil navega a W5 sin POST` | ruta `/poliza/pagar/pago-facil`, sin petición a `/api/publico/pagos` | MSW + MemoryRouter |
| `Pasarela A envía proveedor pasarela1 con el body de contrato` | body exacto `{dni, numeroPoliza, cuotaIds, proveedor: 'pasarela1'}` | MSW |
| `Pasarela B envía proveedor pasarela2` | ídem con `pasarela2` | MSW |
| `201 guarda solo numeroPago y redirige a urlPago` | `sessionStorage` solo con `numeroPago`; `redirigirA` llamado con `urlPago` | MSW + spy |
| `el DNI no se guarda en storage` | ninguna clave con el DNI en `sessionStorage` ni `localStorage` | spy |
| `sessionStorage que lanza no rompe el flujo` | `redirigirA` igual llamado | spy que lanza |
| `doble clic envía una sola petición` | una petición | MSW + userEvent |
| `mientras envía, el botón está deshabilitado y aria-busy` | atributos | MSW con retardo |
| `400 muestra el detail del back` | "Alguna de las cuotas ya tiene un pago en curso. Intente de nuevo más tarde." | MSW |
| `404 muestra el detail del back` | "No se encontró un registro con los datos indicados." | MSW |
| `429 muestra el texto fijo y no reintenta` | texto de 429 y una sola petición | MSW + spy |
| `502 sin detail muestra el texto de pasarela` | texto propuesto | MSW |
| `error de red muestra el texto de red y no reintenta` | texto y una petición | MSW con `HttpResponse.error()` |
| `el total suma los totales en centavos y muestra el recargo` | "$ 51.250,00" y "Incluye el recargo de la cuota 8" | Testing Library |
| `detalle muestra recargo solo en cuotas con recargo` | la cuota 9 no tiene fila de recargo | Testing Library |
| `no tiene violaciones de accesibilidad` | axe | vitest-axe |

## 11. Criterios de aceptación

1. Sin estado válido, `/poliza/pagar/medio-de-pago` redirige (tests).
2. Con `cuotaIds` inválidos (vacío, repetidos o más de 24), redirige a W3 (tests).
3. El `h1` y el subtítulo muestran cuotas y póliza con los textos de la sección 8; el foco va al `h1` (test).
4. Las tres opciones están en un `radiogroup`; ninguna preseleccionada; "Continuar" deshabilitado hasta elegir (tests).
5. Pago Fácil navega a W5 sin petición de pago (test).
6. Pasarela A y B envían el body exacto de `PagoPublicoRequest` con el proveedor que corresponde (tests).
7. Con 201 se guarda solo `numeroPago` en `sessionStorage` y se redirige a `urlPago` (test).
8. Ningún dato del cliente se escribe en storage (test).
9. Doble clic produce una sola petición; el botón se deshabilita y `aria-busy` está presente durante el envío (tests).
10. 400 y 404 muestran el `detail` del back; 429 muestra el texto fijo sin reintento; 502 y red muestran sus textos sin reintento (tests).
11. El total se calcula en centavos y coincide con la suma de los `total` (test).
12. En 390 px la lista de opciones ocupa el ancho y "Continuar" queda a ancho completo (verificación manual).
13. `lint`, `typecheck`, `test` y `build` en verde (FC8).

## 12. Verificación manual

1. Consultar una póliza, elegir cuotas 8 y 9 en W3 y pulsar "Pagar seleccionadas": llega a W4.
2. Verificar encabezado, subtítulo, tres opciones y resumen con $ 51.250,00 y "Incluye el recargo de la cuota 8".
3. Elegir "Pasarela A" y pulsar "Continuar": se ve el estado de envío y, con el backend local, la redirección a `urlPago` (dominio `.example` del mock).
4. Abrir DevTools > Application > Session Storage: solo debe aparecer `nexa.publico.numeroPago`; no debe haber DNI.
5. Volver a W4 desde el historial y elegir "Pago Fácil": llega a W5 (puede estar vacía si W-07 aún no se mergeó).
6. Pulsar "Continuar" dos veces seguidas: una sola petición en la pestaña Network.
7. Cortar la red y pulsar "Continuar": aparece el texto de error sin reintento automático.
8. Confirmar al equipo los puntos D1, D2 y D8 de W4 (bloqueantes) antes del PR (ver sección 13).

## 13. Decisiones pendientes con su default

| ID | Tema | Default | Fuente |
|---|---|---|---|
| D-09 | Nombres de pasarelas | "Pasarela A" = `pasarela1`; "Pasarela B" = `pasarela2`; fijos hasta PB-22 | INDEX D-09 |
| W4 D1 (bloqueante) | Pago Fácil con varias cuotas | Se navega con todas las cuotas; W-07 muestra un cupón por cuota (D-04) | W4 §13 |
| W4 D2 (bloqueante) | Mapeo y nombre visible de las pasarelas | Mapeo de D-09; el nombre visible es el del Figma | W4 §13 |
| W4 D8 (bloqueante) | Retorno de la pasarela sin `numeroPago` | `numeroPago` en `sessionStorage` antes de salir (sección 6, paso 2). Lo usa W-08 | W4 §8, §13 |
| DN-W6-1 | Opción preseleccionada | Ninguna (el Figma muestra Pasarela A marcada: W4 D13). Consistente con D-18 y D-20 | W4 §6, §13 D13 |
| DN-W6-2 | Mapeo de Pasarela B a `pasarela2` | Propuesta de W4 §6 | W4 §6 |
| DN-W6-3 | Texto de "Continuar" al salir a la pasarela | Se mantiene "Continuar" (el Figma no define otro) | W4 D16 |
| DN-W6-4 | "Cambiar cuotas" | Vuelve a W3 con `dni`, `numeroPoliza` y `consulta`, sin `cuotaIds`; W3 empieza sin selección. Conservar la selección exigiría pasar `cuotaIds` (decisión del equipo) | W4 §8, D6 |
| DN-W6-5 | Descripción de Pago Fácil | Se omite "(dato de ejemplo)"; se conserva "Acreditación hasta 72 h hábiles." (el dato no tiene fuente en el back) | W4 D4 |
| DN-W6-6 | `sessionStorage` no disponible | El flujo sigue sin `numeroPago` | W4 D15 |
| DN-W6-7 | Texto de error 502 y de red | Propuestas de la sección 8 | W4 §7 |
| DN-W6-8 | Vencimiento del link (`fechaExpiracion`) | No se muestra; si el link expira, la pasarela lo informa | W4 §9.3 |
| DN-W6-9 (D-45, RV-D17) | **[CONFIRMAR]** seguridad, antes de W-06: `numeroPago` sin DNI en el retorno | Solo `numeroPago` en `sessionStorage` (FC12); el back acepta `numeroPago` sin DNI en W-08 (PB-01, MSW mientras tanto). No cerrar sin confirmación del equipo: seguridad | RV-D17; W4 D15 |

## 14. Riesgos y errores comunes

- **Doble pago:** un segundo `POST` mientras el primero está en curso crea un segundo pago y, si el primero se acredita, deja un excedente (`pagos-facturas.md` §5 paso 7). Ref + `disabled`, y `retry: 0` (FC11).
- **Guardar el DNI:** prohibido (FC12). El test de storage lo impide.
- **Reintento automático en 429 o red:** rompe RN20 y puede crear pagos duplicados. No reintentar (FC13).
- **`window.location.assign` directo en el componente:** dificulta el test. Usar `redirigirA`.
- **Montos a mano:** el total sale de los `total` de `consulta` en centavos; no escribir importes.
- **Estado en la URL:** `cuotaIds` y el DNI solo en `state`. Un test verifica `location.search` vacío.
- **Cuota con "pago en curso" (C8):** el back responde 400; mostrar el `detail` y no volver a intentar sola.

## 15. Definición de terminado

- `lint`, `typecheck`, `test` y `build` en verde (FC8).
- Accesibilidad con US-FE-T-19: `radiogroup` con nombre, radios con `label`, foco al `h1`, `role="alert"` en errores.
- Sin secretos ni credenciales; solo `numeroPago` en `sessionStorage` (test).
- Los 13 criterios de la sección 11 tildados con evidencia observada (FC6).
- W4 D1, D2 y D8 resueltos o con el default de la sección 13 aprobado por el equipo antes del PR.

## 16. Observaciones al índice

- Resuelto (RV-46): Pago Fácil entra en el alcance (sección 2), navega a W-07 por ruta y no agrega dependencia.
- Resuelto (RV-45): el INDEX dice "tipos de `location.state` para W3 a W5"; W-06 recibe el estado de W-03 con `consulta` (ver W-03 §16).
- Resuelto (RV-D17): FC12 se mantiene (solo `numeroPago` en `sessionStorage`). El DNI que necesita W-08 no se guarda: el back debe aceptar `numeroPago` sin DNI (PB-01, MSW mientras tanto).
- Resuelto (RV-47): `shared/formato/listaCuotas.ts` lo crea W-04 y W-06 lo reusa; W-06 declara W-04.
