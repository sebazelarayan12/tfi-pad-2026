# US-FE-W-05: Mi póliza: vista móvil (390 px) y acciones

Tipo W · Oleada 5 · Tamaño S · Rama sugerida `feature/US-FE-W-05-mi-poliza-movil` · Tarjeta Trello `US-FE-W-05`

## 1. Objetivo

Al terminar, `/poliza` muestra en pantallas menores de 768 px (diseño de referencia 390 px) una sola columna: encabezado, datos, lista de cuotas en tarjetas con casilla, botón de cupón de ancho completo, ciclo de la póliza y pie. El total y el botón "Pagar" van en una barra fija al pie. La selección, el tope y las rutas hacia W4 y W5 son los de US-FE-W-04. Para el cliente anónimo que consulta su póliza desde el celular.

## 2. Alcance

**Entra**
- Rama móvil de `PolizaPublicaPage` (la página ya existe por W-04). Se elige con `useEsEscritorio()`.
- Componentes móviles: `ListaCuotasMobile` (lista de tarjetas) y `BarraPagoMobile` (barra fija con total y botón "Pagar").
- Layout móvil: inset de 16 px en el contenedor, sin scroll horizontal, padding inferior para que la barra no tape la última cuota.

**NO entra**
- Lógica de selección, tope y total: ya está en `useSeleccionCuotas` (US-FE-W-04). Esta tarea solo la consume.
- Vista de escritorio: US-FE-W-04.
- Pantallas W4 y W5 (US-FE-W-06 y US-FE-W-07).
- Barra de navegación y pie: US-FE-T-18 (`PublicNav` móvil y `PublicFooter` apilado).

## 3. Dependencias

- **Puede empezar sin esperar a:** US-FE-W-06 (solo se navega a su ruta).
- **Depende de** (fila del INDEX):
  - US-FE-T-05 (`Button` Primary para "Pagar", Secondary para el cupón; `Badge/Estado`).
  - US-FE-T-09 (formateadores).
  - US-FE-T-11 (MSW base para los tests).
  - US-FE-T-18 (`PublicNav` móvil, `PublicFooter`).
  - US-FE-T-19 (harness de accesibilidad).
  - US-FE-W-04 (página, `useSeleccionCuotas`, `DatosPoliza`, `CicloPoliza`, `useEsEscritorio`, `shared/formato/listaCuotas.ts`).
- **Bloqueada por pedidos al back:** PB-07 (degrada; sin titular, como en W-04).
- **Workaround MSW:** no aplica.

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB7.4 (fechas), FB7.8 (contraste).
- `docs/frontend/tareas/INDEX.md`: FC16 (accesibilidad), FC13 (red), D-26 (padding de 16 px hasta medir), D-30 (texto "Pagar" en móvil), D-03 y D-04 (cupón por cuota).
- `docs/frontend/pantallas/W3-mi-poliza.md`:
  - §3.2 (frame W3m: barra superior, contenido, cuotas en tarjetas, cupón, ciclo, pie de contacto, barra de pago fija),
  - §3.1 "Diferencias desktop ↔ mobile" (último bloque de la sección 3.2),
  - §11 (responsive: lista sin encabezado, barra fija, pie en columna),
  - §12 (accesibilidad de la lista: `li` o `role="row"`, casillas con etiqueta, total con `aria-live`, orden de foco),
  - §13 (dudas 7, 12, 13 y 17: texto del botón móvil, barra fija, mensaje de vencimiento, padding móvil).
- `docs/frontend/design-system.md`: §7.4 (390 px: inset de 16 px, 358 px útiles), §8.5 (tamaños táctiles: 44 px recomendados), §5.4 (badges).
- `docs/frontend/pantallas/W2-consultar-poliza.md` §11 (barra superior móvil de referencia; mismo patrón de logo y menú).

## 5. Archivos a crear o modificar

Todos bajo `frontend/apps/web-publica/src/features/polizas/`:

| Archivo | Acción | Dueño |
|---|---|---|
| `pages/PolizaPublicaPage.tsx` | modificar: agregar la rama móvil con `useEsEscritorio()` y el padding inferior para la barra | W-04 (dueño); W-05 edita en su PR (FC1) |
| `pages/PolizaPublicaPage.test.tsx` | modificar: agregar tests móviles | W-04 |
| `components/ListaCuotasMobile.tsx` | crear | W-05 |
| `components/ListaCuotasMobile.test.tsx` | crear | W-05 |
| `components/BarraPagoMobile.tsx` | crear | W-05 |
| `components/BarraPagoMobile.test.tsx` | crear | W-05 |

Usa sin modificar: `useSeleccionCuotas` (`features/polizas/hooks/`), `DatosPoliza`, `CicloPoliza`, `BadgeEstadoPoliza` (W-04); `shared/hooks/useMediaQuery.ts` y `shared/formato/listaCuotas.ts` (W-04); `packages/ui` (T-05, T-07); `PublicNav` y `PublicFooter` (T-18). No editar `package.json` (FC17).

## 6. Pasos de implementación

1. En `PolizaPublicaPage`, si `useEsEscritorio()` es `false`, renderizar la vista móvil; si no, la de escritorio (W-04). Las dos ramas comparten el mismo estado de navegación, el mismo `useSeleccionCuotas` y las mismas rutas. Nunca llamar a `useSeleccionCuotas` dos veces.
2. Layout móvil (`Shell` con inset de 16 px, `design-system §7.4`, D-26):
   - Barra superior: `PublicNav` móvil de T-18 (logo a la izquierda, `icon/menu` a la derecha). No se muestra el botón "Consultar póliza" en la barra móvil (W3 §3.2 y W2 §11).
   - Encabezado: `h1` "Mi póliza", número y `BadgeEstadoPoliza`.
   - `DatosPoliza` (W-04) en columna.
   - `ListaCuotasMobile`.
   - Botón "Descargar cupón Pago Fácil" de ancho completo, alto 40 px, `Secondary`, `disabled` sin selección.
   - `CicloPoliza` (W-04) en columna.
   - Pie: `PublicFooter` de T-18 apilado.
   - `BarraPagoMobile` fija al pie de la ventana, con `padding-bottom` del contenido igual a su alto para que no tape la última cuota.
3. `ListaCuotasMobile`:
   - `<ul>` de `<li>`, uno por cuota, en orden de `numero`. Sin encabezado de tabla (W3 §3.2).
   - Cada fila: casilla de 20 px dentro de un `label` que ocupa al menos 44 × 44 px de zona de toque (paso de `design-system §8.5`); `aria-label` de la casilla: "Seleccionar cuota N de T" (sección 8, propuesta de W3 §12).
   - Texto: "Cuota N de T" (Body 14/20) y, debajo, el vencimiento con `, recargo 5%` si corresponde (Caption 11/14 Medium, secundario).
   - Columna derecha alineada a la derecha: `total` en Mono 13/18 y, debajo, `BadgeEstadoCuota` (W-04).
   - PAGADA y ANULADA: sin casilla; la fila muestra igual sus datos.
   - Mismo tope de 24 y mismas reglas que en escritorio (lo da `useSeleccionCuotas`).
4. `BarraPagoMobile`:
   - Fondo `surface-panel`, borde superior `border-hairline`, padding 20 px / 16 px, `justify-between`.
   - Izquierda: etiqueta "Total a pagar (cuotas 8 y 9)" (Caption 11/14 Medium) y el importe en Mono-lg 22/28 Medium. Con cero cuotas: "Total a pagar" y `$ 0,00`.
   - Derecha: `Button` Primary, size M, label "Pagar", `disabled` sin selección.
   - `aria-live="polite"` en el importe.
   - Ambos textos usan `formatearListaCuotas` (de `shared/formato/listaCuotas.ts`, sección 8) y `formatearImporte` (T-09).
5. "Pagar" navega a `/poliza/pagar/medio-de-pago` con el mismo estado que escritorio (`EstadoPagoPublico` con `cuotaIds` ordenados).
6. El cupón navega a `/poliza/pagar/pago-facil` con el mismo estado.
7. Verificar el alto de la barra con un test de layout simple (`getBoundingClientRect` no está disponible en jsdom: usar la clase del contenedor de padding y verificar en manual).
8. Escribir los tests de la sección 10 y ejecutarlos.

## 7. Contrato con el back

No aplica. Igual que W-04, esta tarea no llama a la API. El estado llega de W2 (`ConsultaPublicaResponse`, `seguridad-clientes-publico.md` §6.3).

## 8. Contenido de UI (móvil)

| Zona | Texto literal |
|---|---|
| Barra superior | Logo "N" y "Nexa Seguros" (T-18); `icon/menu` con `aria-label` "Abrir menú" (propuesta; el destino del menú es NO DEFINIDO) |
| `h1`, encabezado | Mi póliza |
| Cuotas: título y acciones | Cuotas · Seleccionar impagas (desde W-04) |
| Casilla (aria-label) | Seleccionar cuota N de T |
| Fila | Cuota N de T · `10/10/2026, recargo 5%` (cuando hay recargo) |
| Botón del cupón | Descargar cupón Pago Fácil |
| Barra, etiqueta | Total a pagar (cuotas 8 y 9) |
| Barra, sin selección (propuesta) | Total a pagar · `$ 0,00` |
| Barra, botón | Pagar |
| Lista de cuotas en la etiqueta | `8` (1 cuota, "Total a pagar (cuota 8)" propuesta), `8 y 9`, `8, 9 y 10` (3 o más; propuesta NO DEFINIDA) |
| Pie | Teléfono · A confirmar · Email · A confirmar · Ubicación · Dirección a confirmar · Horarios · Lunes a viernes, horario a confirmar · © 2026 Nexa Seguros. Todos los derechos reservados. (lo pone T-18) |

Diferencias con escritorio (W3 §11): el botón del escritorio dice "Pagar seleccionadas" y el móvil "Pagar" (D-30). El pie móvil del Figma ("Pie de contacto") se reemplaza por el `PublicFooter` apilado (DN-W5-3).

## 9. Estados y casos borde

| Estado | Comportamiento |
|---|---|
| Sin selección | Barra con `$ 0,00` y "Pagar" deshabilitado; cupón deshabilitado. |
| Selección de 1 a 24 | Barra y botones activos; la etiqueta se actualiza. |
| Tope de 24 | Casillas restantes `disabled`. |
| 390 px | Una columna; sin scroll horizontal. Los 42 dígitos del cupón van en W-07 (no aquí). |
| Teclado en pantalla | La barra fija puede tapar un campo; no hay campos en esta pantalla. |
| Rotación o cambio de ancho cruzando 768 px | `useEsEscritorio` cambia la rama; el estado de selección vive en la página, no en la rama, así que no se pierde. |
| Póliza sin cuotas | Mismo texto de vacío que escritorio (W-04). |

## 10. Tests requeridos

Vitest + Testing Library. Con `useEsEscritorio` forzado a `false` (mock de `useMediaQuery`).

| Test | Afirma | Herramienta |
|---|---|---|
| `en móvil la lista es una lista de 12 items sin tabla` | 12 `listitem` y ninguna `table` | Testing Library |
| `cada casilla tiene el aria-label con cuota y total` | "Seleccionar cuota 8 de 12" | Testing Library |
| `la barra muestra el total de las cuotas seleccionadas` | al marcar 8 y 9: "Total a pagar (cuotas 8 y 9)" y "$ 51.250,00" | Testing Library + userEvent |
| `la barra con una cuota usa la forma singular` | "Total a pagar (cuota 8)" | Testing Library |
| `la barra con tres cuotas usa la forma de lista con coma` | "8, 9 y 10" | Testing Library |
| `Pagar deshabilitado sin selección y navega con el estado al seleccionar` | `disabled` y, con selección, `/poliza/pagar/medio-de-pago` con `cuotaIds` | MemoryRouter |
| `el botón del cupón navega a W5 con el mismo estado` | ruta `/poliza/pagar/pago-facil` | MemoryRouter |
| `el importe de la barra tiene aria-live` | `aria-live="polite"` | Testing Library |
| `PAGADA no tiene casilla en móvil` | no hay casilla en la fila de cuota 1 | Testing Library |
| `el DNI no aparece en la URL al navegar` | `location.search` vacío y el pathname sin DNI | MemoryRouter |
| `no tiene violaciones de accesibilidad en móvil` | axe | vitest-axe |

Las pruebas de 390 px (scroll, barra sin tapar) son manuales (sección 12).

## 11. Criterios de aceptación

1. En menos de 768 px la vista muestra una sola columna y la lista de cuotas en `li` (test).
2. Cada casilla tiene etiqueta accesible "Seleccionar cuota N de T" (test).
3. La barra fija muestra el total y el botón "Pagar"; el texto cambia con la selección (tests).
4. "Pagar" y el cupón están deshabilitados sin selección y navegan con el mismo estado que escritorio (tests).
5. El texto de la etiqueta de la barra sigue la forma singular, de dos y de lista (tests).
6. El DNI no aparece en la URL (test).
7. A 390 px no hay scroll horizontal y la barra no tapa la última cuota (verificación manual).
8. Las zonas de toque de las casillas tienen al menos 44 × 44 px (verificación manual con DevTools).
9. Sin violaciones de axe en la vista móvil (test).
10. `lint`, `typecheck`, `test` y `build` en verde (FC8).

## 12. Verificación manual

1. En DevTools, 390 × 844 px. Consultar una póliza (W2) y llegar a `/poliza`.
2. Verificar: barra superior con logo y menú; `h1`; datos; lista de 12 cuotas en tarjetas; botón del cupón a ancho completo; ciclo; pie apilado.
3. Sin scroll horizontal (la barra de scroll inferior no aparece).
4. Marcar cuotas 8 y 9: la barra cambia a "Total a pagar (cuotas 8 y 9)" y "$ 51.250,00".
5. Desplazarse hasta la última cuota: la barra no la tapa.
6. Pulsar "Pagar": llega a `/poliza/pagar/medio-de-pago`.
7. Girar el dispositivo a un ancho mayor de 768 px: la vista cambia a escritorio y la selección se mantiene.
8. Confirmar al equipo el texto "Pagar" (D-30) y el alto del padding (D-26) antes del PR.

## 13. Decisiones pendientes con su default

| ID | Tema | Default | Fuente |
|---|---|---|---|
| D-26 | Padding móvil de W3m | 16 px hasta medir | INDEX D-26, W3 §13.17 |
| D-30 | Texto del botón móvil | "Pagar" (según el Figma de W3m) | INDEX D-30, W3 §13.7 |
| DN-W5-1 | Barra fija o al final del contenido | Fija al pie de la ventana, con padding del contenido igual a su alto (decisión menor, reversible; D-36 del INDEX) | W3 §11 y §13.12; RV-48 |
| DN-W5-2 | Forma de la lista de cuotas en la etiqueta de la barra | 1 cuota: "cuota N"; 2: "N y M"; 3 o más: "N, M y P" (propuesta) | W3 §3.2; W4 §5 |
| DN-W5-3 | Pie móvil | `PublicFooter` apilado de T-18 (no el "Pie de contacto" del Figma) | W3 §3.2 |
| DN-W5-4 | Orden de foco de la barra | La barra se renderiza al final del DOM; el foco llega a ella después del cupón y del ciclo | W3 §12 |
| DN-W5-5 | Tamaño de la zona de toque | 44 × 44 px (recomendación AAA, design-system §8.5) con padding invisible | design-system §8.5 |

## 14. Riesgos y errores comunes

- **Barra fija que tapa contenido:** sin padding inferior en el contenido, la última cuota queda debajo de la barra. Medir el alto real de la barra en manual.
- **Tabla en móvil:** no usar `<table>` en la vista de 390 px; la lista es semántica (`ul`/`li`).
- **Scroll horizontal:** las tarjetas de cuota no deben usar anchos fijos de 720 px ni de 560 px.
- **Estado perdido al cambiar de vista:** no guardar la selección dentro de la rama móvil; debe vivir en la página o en el hook de W-04.
- **Casilla sin etiqueta:** un `input` sin `aria-label` ni `label` se anuncia como "casilla"; el test de la sección 10 lo impide.
- **Total con `aria-live` en todo el bloque:** anunciar solo el importe, no la barra completa.

## 15. Definición de terminado

- `lint`, `typecheck`, `test` y `build` en verde (FC8).
- Accesibilidad con US-FE-T-19: lista semántica, casillas con etiqueta, `aria-live` en el importe, sin violaciones de axe.
- Sin secretos; DNI nunca en la URL (test).
- Los 10 criterios de la sección 11 tildados con evidencia (FC6).
- Verificación manual a 390 px registrada en el PR (sección 12).

## 16. Observaciones al índice

- Resuelto (RV-47): W-05 declara W-04 (ya en el INDEX), que crea `useEsEscritorio`, `useSeleccionCuotas` y `shared/formato/listaCuotas.ts`.
- ABIERTO: **Pie móvil.** El Figma W3m tiene un pie propio. La fila de W-05 dice "Variante mobile" sin decir el pie; propongo usar `PublicFooter` (DN-W5-3).
- Resuelto (RV-48 / D-36): la barra fija de W5 (DN-W5-1) queda como decisión menor en el INDEX (D-36, RV-68).
