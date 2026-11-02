# US-FE-W-07: Cupón Pago Fácil (un cupón por cuota)

Tipo W · Oleada 5 · Tamaño M · Rama sugerida `feature/US-FE-W-07-cupon-pago-facil` · Tarjeta Trello `US-FE-W-07`

## 1. Objetivo

Al terminar, `/poliza/pagar/pago-facil` muestra, para cada cuota elegida, un cupón de Pago Fácil con sus dos vencimientos, el importe de cada uno y el código de 42 dígitos. Los cupones se piden a `POST /api/publico/cupon` (hoy Especificado: se trabaja con MSW). "Imprimir" abre el diálogo del navegador. Sin estado válido, redirige. Para el cliente anónimo que eligió pagar en efectivo.

## 2. Alcance

**Entra**
- Feature `pago-facil` de la web (`apps/web-publica/src/features/pago-facil/`): `routes.tsx` (ruta `/poliza/pagar/pago-facil`), `index.ts`, `pages/CuponPagoFacilPage.tsx`, `components/CuponPagoFacil.tsx`, `components/CodigoBarrasTexto.tsx`, `api/useCuponesPublicos.ts`, `components/imprimir.css`.
- Una solicitud por cuota (`numeroCuota`), con sus estados de carga, error y reintento manual.
- Botón "Imprimir" con `window.print()` y estilos de impresión que ocultan barra, pie y botones.
- Texto de los 42 dígitos (sin dibujar barras; ver sección 13, DN-W7-1).

**NO entra**
- Descargar PDF: no hay endpoint (PB-11, D-06 de W6). Se omite (DN-W7-2).
- Dibujar las barras del código de barras: se espera la decisión de back y cátedra (W5 D8).
- Pagos online y pantalla W6 (US-FE-W-06 y US-FE-W-08).
- Implementar `POST /api/publico/cupon`: lo mockea US-FE-T-31 y lo implementa el back en US-F3-06.
- `GET /api/pagofacil/cuotas/{id}/cupon`: es solo de Empleado; **esta tarea no lo usa nunca**.

## 3. Dependencias

- **Puede empezar sin esperar a:** US-FE-W-06 (solo se navega hacia W5 desde W4; el estado es el mismo).
- **Depende de** (fila del INDEX):
  - US-FE-T-05 (`Button` Primary "Imprimir"/Secondary).
  - US-FE-T-07 (`AlertaError`).
  - US-FE-T-09 (`formatearImporte`, `formatearFechaDateOnly`, `formatearDni`).
  - US-FE-T-11 (MSW base; el handler de cupón lo escribe T-31).
  - US-FE-T-18 (`PublicLayout`, `PublicNav`, `PublicFooter`).
  - US-FE-T-19 (harness de accesibilidad).
  - US-FE-T-31 (`solicitarCuponPublico` y tipos `CuponPublicoRequest`, `CuponPagoFacilResponse`; `publicoKeys.cupon`; handler MSW).
  - US-FE-W-03 (`EstadoPagoPublico`, `leerEstadoNavegacion` en `features/polizas/index.ts`).
  - US-FE-W-04 (mismo cálculo de cuotas y formateo de DNI; dueña de `shared/formato/listaCuotas.ts`, RV-47).
- **Bloqueada por pedidos al back:**
  - PB-02 (bloquea): `POST /api/publico/cupon` no existe. Se trabaja con MSW con el contrato de la sección 7.
  - PB-21 (bloquea): segundo vencimiento de 10 días vs 7 del Figma. Se muestra la fecha que devuelve el DTO, nunca la del Figma (D-05).
  - PB-18 (degrada): desborde del código en importes altos ("no disponible para este importe").
  - W5 D8 (bloqueante para dibujar barras): se muestran solo los dígitos (DN-W7-1).
- **Workaround MSW:** handler de T-31 con el contrato de PB-02 (`numeroCuota`).

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB3, FB4 (contrato y formato), FB7.4 (fechas sin zona), FB7.6 (mensajes en español).
- `docs/frontend/tareas/INDEX.md`: FC2 (requests en `@nexa/api`), FC5 (tests), FC9 (importes y DNI con formateador), FC10 (errores), FC12 (nada en storage), FC13 (no reintentar `/api/publico/*` ante 429), FC16 (foco al `h1`), D-03, D-04, D-05, D-06, D-10, D-31, D-32.
- `docs/frontend/pantallas/W5-cupon-pago-facil.md`:
  - §1 (propósito: no cobra ni registra el pago),
  - §2 (ruta, estado de navegación y guardas: sin estado → W2; `cuotaIds` vacío → W4),
  - §3 (estructura: tarjeta de 720 px, datos, vencimientos, código de barras, acciones, ayuda, pie),
  - §4 (componentes: `Button`, `PublicNav`, `PublicFooter`; barras decorativas NO se implementan),
  - §5 (textos literales),
  - §6 (entrada del endpoint y reglas del back),
  - §6 "Cómo se calcula cada dato" (importes y fechas: se muestran los del DTO),
  - §7 (estados), §8 (acciones; sin botón de volver),
  - §9 (campos de `CuponPagoFacilResponse`; datos que no están en el DTO),
  - §10 (RN08, RN11, RN18, RN20),
  - §11 (390 px: tarjeta a ancho completo, cajas en columna, código en dos líneas si hace falta),
  - §12 (accesibilidad: aria-hidden de las barras, `aria-label` del código, foco al título),
  - §13 (dudas D1 a D11; bloqueantes D1, D2, D4, D8).
- `docs/frontend/contratos-api/polizas-cuotas-pagofacil.md` §6.1 (`CuponPagoFacilResponse`), §6.2 (reglas de importes y fechas), §6.3 (42 dígitos: texto opaco; no parsear en el front; mostrar completo debajo), §6.3 "Cómo renderizarlo" (copiar sin espacios; no cachear entre días).
- `docs/frontend/pedidos-al-back.md`: PB-02 (contrato propuesto del cupón público), PB-18, PB-21.
- `docs/frontend/contratos-api/seguridad-clientes-publico.md` §1.4 (límite RN20).
- `docs/frontend/design-system.md`: §5.1 (Button), §8.3 (foco), §7.4 (breakpoint 768), §8.1 (contraste del texto de caption 11 px `text/tertiary`).

## 5. Archivos a crear o modificar

Todos bajo `frontend/apps/web-publica/src/features/pago-facil/` salvo que se indique:

| Archivo | Acción | Dueño |
|---|---|---|
| `routes.tsx` | crear: ruta `/poliza/pagar/pago-facil` → `CuponPagoFacilPage` | W-07 (primer task del feature `pago-facil` web) |
| `index.ts` | crear: exporta `pagoFacilRoutes` | W-07 |
| `pages/CuponPagoFacilPage.tsx` | crear | W-07 |
| `components/CuponPagoFacil.tsx` | crear (una tarjeta por cuota) | W-07 |
| `components/CodigoBarrasTexto.tsx` | crear (texto de 42 dígitos con `aria-label`) | W-07 |
| `components/imprimir.css` | crear (`@media print`: oculta nav, pie y botones) | W-07 |
| `api/useCuponesPublicos.ts` | crear: `useQueries` por cuota con `retry: false` | W-07 |
| `pages/CuponPagoFacilPage.test.tsx`, `components/*.test.tsx`, `api/*.test.ts` | crear | W-07 |

Usa sin modificar: `packages/api` (T-31, T-09), `packages/ui` (T-05, T-07), `apps/web-publica/src/app/*` (T-17, T-18), `features/polizas/index.ts` (W-03), `shared/formato/listaCuotas.ts` (W-04, RV-47). No editar `package.json` (FC17).

## 6. Pasos de implementación

1. **Estado**: `leerEstadoNavegacion(state)` de `features/polizas`. Si es `null`, `<Navigate to="/consultar-poliza" replace />`. Si `cuotaIds` está vacío, `<Navigate to="/poliza/pagar/medio-de-pago" state={state} replace />` (W5 §2).
2. **Consultas** (`api/useCuponesPublicos.ts`):
   - Una consulta por `cuotaId`: `useQueries` con `queryKey: publicoKeys.cupon(numeroPoliza, cuotaId)` (exportada desde `@nexa/api`, T-31) y `queryFn: () => solicitarCuponPublico({ dni, numeroPoliza, numeroCuota })`.
   - `numeroCuota` sale de `consulta.cuotas.find(c => c.idCuota === cuotaId).numero`.
   - `retry: false` (FC13). `staleTime: 0`: el cupón se pide cada vez que se muestra (W5 §6.3).
   - No es una mutación (no cambia datos), pero se carga solo al entrar a la pantalla, nunca en otra parte de la app.
3. **Página** (`CuponPagoFacilPage.tsx`):
   - `h1` "Cupón de pago" con foco al montar (W5 §12).
   - Una `CuponPagoFacil` por consulta, en orden de `numeroCuota`.
   - Mientras carga: esqueleto de la tarjeta con la misma altura; "Imprimir" deshabilitado (propuesta, W5 §7).
   - Si una consulta falla, esa tarjeta muestra su `AlertaError` y el botón "Reintentar" de esa cuota; las demás siguen mostrándose.
   - Barra superior y pie de T-18.
4. **Tarjeta del cupón** (`CuponPagoFacil.tsx`):
   - Tarjeta de 720 px (desktop), padding 40 px, borde `border-hairline`, radio 16 px; ancho completo con padding de 20 px en móvil.
   - Logo `Logo/Nexa` decorativo (T-03/T-18).
   - Filas "Póliza" → `numeroPoliza`; "Cuota" → `${numeroCuota} de ${consulta.cuotas.length}`; "DNI" → `formatearDni(dni)` (`30.123.456`, de T-09). **Sin "Titular"** (PB-07, D-10).
   - Dos cajas de vencimiento (`surface-subtle`, radio 12 px, padding 16 px):
     - "1er vencimiento": `formatearFechaDateOnly(fechaPrimerVencimiento)` y `formatearImporte(importePrimerVencimiento)`.
     - "2do vencimiento, con recargo 5%": `formatearFechaDateOnly(fechaSegundoVencimiento)` y `formatearImporte(importeSegundoVencimiento)`.
   - Código: `CodigoBarrasTexto` con los 42 dígitos en Mono 13/18, centrado y `aria-label` "Código de barras: {dígitos}". Si `codigoBarras` no tiene exactamente 42 dígitos numéricos, mostrar "No disponible para este importe." (propuesta) en lugar del código.
   - Acciones: "Imprimir" (Primary, size M, con `icon/printer` decorativo), `window.print()`. Sin "Descargar PDF" (DN-W7-2).
   - Sin texto de ayuda sobre 72 h (DN-W7-3).
5. **Errores por consulta** (sección 9): mapear el `ProblemDetails`: 400 → texto de la sección 8 (con "no entra" → "No disponible para este importe."); 404 → texto de la sección 8; 429 → texto del Figma de W2 (reutilizado), sin reintento automático; red o 500 → texto genérico con "Reintentar".
6. `imprimir.css`: `@media print` oculta `PublicNav`, `PublicFooter`, los botones y el texto de ayuda; la tarjeta ocupa todo el ancho.
7. Escribir los tests de la sección 10 y ejecutarlos.

## 7. Contrato con el back

**`POST /api/publico/cupon`** (`PublicoCuponController`, anónimo, RN20)

- Estado: **Especificado** (US-F3-06, sin PR abierta). Se trabaja con MSW (`00-decisiones-base.md` FB7.7).
- Request: `CuponPublicoRequest` con `numeroCuota` (número de cuota, no `idCuota`; ver DN-W7-5).
- Response 200: `CuponPagoFacilResponse`.
- Errores: 400 si la cuota está Pagada o Anulada (RN11), 404 con el mismo mensaje genérico si DNI o póliza no coinciden o la cuota no es de la póliza, 429 por RN20.

```ts
// packages/api/src/dto/publico.ts (dueño: US-FE-T-31). W-07 lo consume.
export interface CuponPublicoRequest {
  dni: string;          // ^\d{8}$
  numeroPoliza: string; // ^POL-\d{7}$
  numeroCuota: number;  // número de cuota, 1..N
}
export interface CuponPagoFacilResponse {
  cuotaId: string;                  // uuid
  numeroPoliza: string;             // "POL-0000001"
  numeroCuota: number;
  importePrimerVencimiento: number; // pesos
  fechaPrimerVencimiento: string;   // "yyyy-MM-dd" (DateOnly)
  importeSegundoVencimiento: number;
  fechaSegundoVencimiento: string;  // "yyyy-MM-dd": la fecha del DTO, nunca la del Figma (PB-21)
  codigoBarras: string;             // 42 dígitos; texto opaco, no parsear
}
```

Ejemplo de respuesta (contrato de `polizas-cuotas-pagofacil.md` §6.1, datos ficticios):

```json
{ "cuotaId": "f1000000-0000-0000-0000-000000000009", "numeroPoliza": "POL-0000042", "numeroCuota": 9,
  "importePrimerVencimiento": 25000.0, "fechaPrimerVencimiento": "2026-11-10",
  "importeSegundoVencimiento": 26250.0, "fechaSegundoVencimiento": "2026-11-20",
  "codigoBarras": "123450120000020261210000000100112600001026" }
```

Este ejemplo usa el layout de referencia del back. El código de barras real no se valida en el front (W5 §9).

Handler MSW: lo escribe US-FE-T-31 con `numeroCuota`. En los tests, `server.use(...)` para 400, 404, 429 y 500.

**No usar** `GET /api/pagofacil/cuotas/{cuotaId}/cupon`: requiere rol Empleado y la web pública no tiene sesión (W5 §0, `polizas-cuotas-pagofacil.md` §6.1).

## 8. Contenido de UI

| Zona | Texto literal |
|---|---|
| Nav | Planes · Contacto · Consultar póliza (T-18) |
| `h1` | Cupón de pago |
| Fila | Póliza · POL-0000042 |
| Fila | Cuota · 9 de 12 |
| Fila | DNI · 30.123.456 |
| Caja 1 | 1er vencimiento · 10/11/2026 · $ 25.000,00 |
| Caja 2 | 2do vencimiento, con recargo 5% · 20/11/2026 · $ 26.250,00 (fecha y importe del DTO) |
| Código (texto) | 42 dígitos, sin espacios, en Mono (ejemplo de la respuesta de §7) |
| Código (aria-label) | Código de barras: {42 dígitos} |
| Código no disponible (propuesta) | No disponible para este importe. |
| Botón | Imprimir |
| Error 400 (propuesta; NO DEFINIDO) | Esta cuota no se puede pagar con cupón. |
| Error 400 por importe (INDEX, W5 §7) | No disponible para este importe. |
| Error 404 (propuesta; NO DEFINIDO) | No pudimos generar el cupón. Volvé a consultar tu póliza. |
| Error 429 (literal de W2, reutilizado) | Hiciste muchos intentos. Esperá un minuto y volvé a probar. |
| Error de red o 500 (propuesta) | No pudimos generar el cupón. |
| Reintentar (propuesta) | Reintentar |
| Cargando (propuesta) | Cargando cupón… (solo para el lector de pantalla) |
| Pie | Teléfono · A confirmar · Email · A confirmar · Ubicación · Dirección a confirmar · Horarios · Lunes a viernes, horario a confirmar · © 2026 Nexa Seguros. Todos los derechos reservados. (T-18) |

Textos omitidos a propósito: "Titular" y "Tomás Iturralde" (PB-07, D-10), "Descargar PDF" (DN-W7-2), la ayuda "La acreditación puede demorar hasta 72 h hábiles." (DN-W7-3), "de 12" del número de cuota cuando no hay `consulta` (no aplica: siempre hay `consulta`).

Formatos: importes `$ 25.000,00`; fechas `dd/MM/yyyy`; DNI `30.123.456`. Las fechas se formatean como `DateOnly` sin zona (`formatearFechaDateOnly`).

## 9. Estados y casos borde

| Estado | Comportamiento |
|---|---|
| Sin estado o inválido | Redirige a `/consultar-poliza`. |
| `cuotaIds` vacío | Redirige a W4 con el estado. |
| Una cuota | Una tarjeta. Mismo cálculo que N cuotas. |
| N cuotas (varias) | N tarjetas en orden de `numeroCuota`, una por consulta (D-04). |
| Cargando | Esqueleto de la tarjeta; "Imprimir" deshabilitado. |
| 200 | Tarjeta con todos los datos. |
| 400 | Texto de la sección 8 (con "no entra en el código" → "No disponible para este importe."). Sin reintento. |
| 404 | Texto de 404 con "Reintentar" manual. |
| 429 | Texto fijo de 429. Sin reintento automático, FC13 (DN-W7-4). |
| Red o 500 | Texto genérico con "Reintentar" manual. |
| `codigoBarras` con longitud distinta de 42 o no numérico | "No disponible para este importe." en lugar del código. |
| Cupón con segundo vencimiento ya pasado | Se muestra la fecha del DTO sin marca (DN-W7-6). |
| Varias cuotas y una falla | Las otras tarjetas se muestran igual. |
| Impresión | `window.print()`; `imprimir.css` oculta lo que no va en el papel. |

**Límite de RN20:** cada cupón es una petición contra el mismo contador por IP (10 por minuto). Con varias cuotas, las peticiones pueden agotarlo (ver sección 14).

## 10. Tests requeridos

Vitest + Testing Library + MSW (`onUnhandledRequest: 'error'` para garantizar que no se llama a `/api/pagofacil/*`).

| Test | Afirma | Herramienta |
|---|---|---|
| `sin estado redirige a /consultar-poliza` | URL final | MemoryRouter |
| `cuotaIds vacío redirige a W4` | URL final `/poliza/pagar/medio-de-pago` | MemoryRouter |
| `una petición por cuota con numeroCuota` | con 2 cuotas, 2 peticiones con `numeroCuota` 8 y 9 | MSW |
| `nunca llama a GET /api/pagofacil/cuotas/.../cupon` | MSW sin handler para esa ruta y `onUnhandledRequest: 'error'` | MSW |
| `h1 "Cupón de pago" con foco` | `document.activeElement` es el `h1` | Testing Library |
| `muestra póliza, cuota "9 de 12" y DNI formateado` | "POL-0000042", "9 de 12", "30.123.456" | Testing Library |
| `no muestra Titular ni nombre del titular` | no aparece "Titular" | Testing Library |
| `vencimientos del DTO, no del Figma` | "20/11/2026" y "$ 26.250,00" del fixture; no "17/11/2026" | Testing Library |
| `fechas DateOnly no se desplazan por zona` | "10/11/2026" con `2026-11-10` | Testing Library |
| `muestra los 42 dígitos y el aria-label` | texto de 42 dígitos y `aria-label` "Código de barras: …" | Testing Library |
| `código de longitud distinta muestra no disponible` | 41 dígitos → "No disponible para este importe." | Testing Library |
| `Imprimir llama a window.print` | spy de `window.print` | spy |
| `no hay botón Descargar PDF` | `queryByRole('button', { name: /PDF/ })` vacío | Testing Library |
| `400 por importe muestra el texto de desborde` | "No disponible para este importe." | MSW |
| `400 genérico muestra el texto de cuota no pagable` | "Esta cuota no se puede pagar con cupón." | MSW |
| `404 muestra el texto y permite reintentar a mano` | "Reintentar" dispara una nueva petición | MSW + userEvent |
| `429 muestra el texto fijo sin reintento automático` | una sola petición tras 429 | MSW + spy |
| `una tarjeta con error no oculta las demás` | 2 cuotas, una falla: aparecen ambas partes | MSW |
| `no guarda nada en storage` | spies de `localStorage`/`sessionStorage` sin llamadas | spy |
| `no tiene violaciones de accesibilidad` | axe | vitest-axe |

## 11. Criterios de aceptación

1. Sin estado válido, la ruta redirige a `/consultar-poliza`; sin cuotas, a W4 (tests).
2. Se pide un cupón por cuota con `numeroCuota` (test MSW).
3. Nunca se llama a `GET /api/pagofacil/cuotas/{cuotaId}/cupon` (test).
4. Los vencimientos y los importes son los del DTO; no aparecen "17/11/2026" del Figma (test).
5. Las fechas `DateOnly` se muestran sin desfase (test).
6. Los 42 dígitos aparecen como texto con `aria-label`; con longitud distinta se muestra "No disponible para este importe." (tests).
7. "Imprimir" llama a `window.print()`; no hay "Descargar PDF" (tests).
8. Los errores 400, 404, 429 y red muestran sus textos; 429 no reintenta sola (tests).
9. Un error en una cuota no oculta las demás (test).
10. Nada se guarda en storage (test).
11. En 390 px la tarjeta ocupa el ancho disponible, sin scroll horizontal (verificación manual).
12. `lint`, `typecheck`, `test` y `build` en verde (FC8).

## 12. Verificación manual

1. Desde W4 con una cuota (cuota 9 de la póliza de seed) y pagar con "Pago Fácil": llega a `/poliza/pagar/pago-facil`.
2. Verificar `h1`, póliza, "9 de 12", DNI con puntos, dos cajas de vencimiento con fechas del backend (o del MSW) y los 42 dígitos.
3. Pulsar "Imprimir": se abre el diálogo de impresión; la vista previa no muestra el menú ni el pie.
4. Con dos cuotas elegidas: aparecen dos cupones.
5. Abrir `/poliza/pagar/pago-facil` en una pestaña nueva: redirige a `/consultar-poliza`.
6. DevTools en 390 px: la tarjeta ocupa el ancho; los 42 dígitos se parten en dos líneas si no entran.
7. Confirmar al equipo el default de barras (DN-W7-1) y de "Descargar PDF" (DN-W7-2) antes del PR.

## 13. Decisiones pendientes con su default

| ID | Tema | Default | Fuente |
|---|---|---|---|
| W5 D1 (bloqueante) | Más de una cuota | N cupones, uno por cuota (D-04) | W5 §13 D1; W3 §13.5 |
| W5 D2 / PB-02 (bloqueante) | Endpoint público inexistente | MSW con el contrato de la sección 7 | W5 §13 D2 |
| DN-W7-1 (W5 D8, bloqueante) | Cómo dibujar el código | No se dibujan barras; se muestran los 42 dígitos como texto. El patrón fijo del Figma no se usa | W5 §13 D8 |
| DN-W7-2 (W5 D7) | "Descargar PDF" | Se omite (no hay endpoint, PB-11) | W5 §13 D7 |
| D-05 / PB-21 (bloqueante) | Segundo vencimiento | Fecha e importe del DTO | INDEX D-05; W5 D4 |
| D-06 | Comprobante | No aplica a W5 | INDEX D-06 |
| D-31 | Imprimir | `window.print()` con estilos de impresión | INDEX D-31 |
| DN-W7-3 | Ayuda "La acreditación puede demorar hasta 72 h hábiles." | Se omite hasta que alguien confirme el plazo (no está en el back) | W5 §10, D10 |
| DN-W7-4 | Reintento tras 429 | Texto fijo de 60 s (D-32), sin reintento automático; "Reintentar" solo por clic | INDEX D-32; convenciones §4 |
| DN-W7-5 | Campo de cuota en el request | `numeroCuota` (contrato de US-F3-06 y PB-02), no `cuotaId` como dice W5 §6 | PB-02; W5 §6 |
| DN-W7-6 | Segundo vencimiento ya vencido | Se muestra la fecha sin marca | W5 §7, D11 |
| DN-W7-7 | Total de cuotas "de 12" | Se calcula como `consulta.cuotas.length` | W5 D3 |
| DN-W7-8 | Textos de error | Propuestas de la sección 8 | W5 §5 |

## 14. Riesgos y errores comunes

- **Peticiones de más contra RN20:** con seis cuotas más la consulta, se agotan 10 por minuto. Mostrar el texto de 429 y no reintentar; considerar pedir el cupón de una cuota por vez (decisión de producto, DN-W7-4).
- **Usar el endpoint de empleado:** `GET /api/pagofacil/cuotas/{id}/cupon` da 401/403 a un cliente. Un test lo impide.
- **Fecha del Figma:** "17/11/2026" no es lo que calcula el back (10 días). Mostrar siempre el DTO (PB-21).
- **Dibujar barras por las dudas:** el patrón del Figma es fijo, no codifica los dígitos y puede dejar el cupón sin validez en Pago Fácil (W5 D8). No dibujar.
- **Cache entre días:** el cupón cambia con la fecha. Usar `staleTime: 0` y no guardar el cupón en storage (W5 §6.3, FC12).
- **Parsear el código:** tratarlo como texto opaco. No validar el dígito verificador en el front (W5 §9).
- **Titular inventado:** no escribir un nombre aunque el Figma lo muestre.

## 15. Definición de terminado

- `lint`, `typecheck`, `test` y `build` en verde (FC8).
- Accesibilidad con US-FE-T-19: `h1` con foco, código con `aria-label`, iconos decorativos, botones con texto, sin violaciones de axe.
- Sin secretos; nada en storage; ninguna llamada a `/api/pagofacil/*` (test).
- Los 12 criterios de la sección 11 tildados con evidencia (FC6).
- W5 D1, D2 y D8 y PB-21 comunicados a back y diseño antes del PR.

## 16. Observaciones al índice

- Resuelto (RV-D21): el enlace "Ver ejemplo de cupón" de W1 no es interactivo; W-01 no enlaza a W5 sin estado (DN-W1-1), así que la guarda de esta ruta no se activa desde la home.
- Resuelto (PB-02, decisión del orquestador): `POST /api/publico/cupon` usa `numeroCuota`; esta tarea lo usa (DN-W7-5). W5 §6 dice `cuotaId` y debe corregirse en el documento de pantalla.
- Resuelto (RV-28): `publicoKeys.cupon` lo exporta T-31 junto al handler; esta tarea lo importa de `@nexa/api`.
