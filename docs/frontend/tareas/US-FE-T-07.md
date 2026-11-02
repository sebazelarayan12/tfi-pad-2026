# US-FE-T-07: `@nexa/ui`: Card/Widget, Dato, AlertaError, Backdrop y Logo

Tipo: T · Oleada: 1 · Tamaño: M · Rama sugerida: `feature/US-FE-T-07-card-alerta-logo` · Tarjeta Trello: `US-FE-T-07`

## 1. Objetivo

Al terminar, `@nexa/ui` exporta siete piezas de composición: `CardWidget` (contenedor con título y acción opcional), `Dato` (par etiqueta/valor), `AlertaError` (caja de error con `role="alert"`), `Backdrop` (fondo degradado de pantalla completa) `LogoNexa` (marca "N" y wordmark), `Dialogo` (diálogo de confirmación con `role="alertdialog"`) y `Shell` (contenedor blanco flotante). Para: el login (B1), el alta de cliente (B4, rail y alerta general), las tarjetas del rail de B4 y B5, y las pantallas de la web pública (W1 y siguientes).

## 2. Alcance

**Entra:**
- `CardWidget` en `packages/ui/src/components/CardWidget/CardWidget.tsx`.
- `Dato` en `packages/ui/src/components/Dato/Dato.tsx`.
- `AlertaError` en `packages/ui/src/components/AlertaError/AlertaError.tsx`.
- `Backdrop` en `packages/ui/src/components/Backdrop/Backdrop.tsx`.
- `LogoNexa` en `packages/ui/src/components/LogoNexa/LogoNexa.tsx`.
- `Dialogo` en `packages/ui/src/components/Dialogo/Dialogo.tsx` (lo importan B-05, B-08 y B-23 desde `@nexa/ui`, RV-D05).
- `Shell` en `packages/ui/src/components/Shell/Shell.tsx` (lo importan T-16 y T-18 desde `@nexa/ui`, RV-D06).
- Bloques de export en `packages/ui/src/index.ts`.
- Tests en `packages/ui/test/CardWidget.test.tsx`, `Dato.test.tsx`, `AlertaError.test.tsx`, `Backdrop.test.tsx`, `LogoNexa.test.tsx`, `Dialogo.test.tsx` y `Shell.test.tsx`.

**NO entra:**
- `Sidebar`, `NavItem`, `Topbar`: T-15 y T-16.
- `PublicNav` y `PublicFooter`: US-FE-T-18.
- Textos de muestra del diseño ("Ver todo", "A confirmar", "Tomás Iturralde", "$ 25.000,00"): no se hardcodean (FC4).
- Lógica de cuándo se muestra una alerta (por ejemplo, un 401 en el login): la pantalla decide y renderiza `AlertaError`.

## 3. Dependencias

- **Puede empezar sin esperar a:** US-FE-T-04 y US-FE-T-05 (primitivos en carpetas distintas).
- **Depende de:** US-FE-T-02 (Vitest, ESLint) y US-FE-T-03 (tokens y preset, incluido `bg-backdrop`).
- **Bloqueada por pedidos al back (PB-NN):** ninguna.
- **Workaround MSW (FB7.7):** no aplica.

## 4. Documentos a leer

- `docs/frontend/design-system.md`:
  - §5.7 (Logo/Nexa: cuadrado 28×28, radio 12 px, "N" en Bold 16 px, wordmark H3 16/22 SemiBold; props `showWordmark`).
  - §5.13 (Card/Widget: 360 px de muestra, padding 20 px, gap 16 px, radio 16 px, borde hairline, título H3, acción con `arrow-up-right`).
  - §5.14 (Backdrop: `bg-backdrop`, `min-h-dvh`, sin alto fijo de 1024).
  - §9 item 5 (la "N" de 16 px Bold no pertenece a los 10 estilos; decisión en D-T07-4).
  - §1.1 (par de error: `#b03a2e` sobre `#fbe5e2`, 4.99:1, cumple).
  - §6.1 y §6.2 (Phosphor: `WarningCircleIcon`, `ArrowUpRightIcon`, `XCircleIcon`).
  - §8.6 (`aria-hidden` en íconos decorativos).
- `docs/frontend/pantallas/B1-login.md` §3 (alerta de error: 360×44 px, radio 16 px, padding 16/12, ícono 20 px a la izquierda), §4 (`AlertaError` inline reutilizable), §12 (`role="alert"`, ícono decorativo con `aria-hidden`).
- `docs/frontend/pantallas/B4-nuevo-cliente.md` §3 (rail: widget de validación Renaper de padding 20 px, radio 16 px y borde hairline; caja de error con `x-circle` 16 px y padding 16 px) y §4 (`AlertaError` compartida con B1).
- `docs/frontend/pantallas/B5-ficha-cliente.md` §4 (`Card/Widget` en el rail; `Dato` propuesto como componente de `@nexa/ui`).
- `docs/frontend/pantallas/W1-inicio.md` §3 (tarjetas Card/Widget con padding 20, gap 16, radio 16 y borde hairline; logo de 28×28).
- `docs/frontend/00-decisiones-base.md` FB7.6 (la UI muestra `detail` del back; el texto propio va en la pantalla) y FB7.11 (datos faltantes: estado "no disponible").
- `docs/frontend/tareas/INDEX.md` FC4 (datos de ejemplo) y FC16 (`role="alert"` en alertas de resultado).

## 5. Archivos a crear o modificar

Dueño de todos: US-FE-T-07, salvo el barrel (dueño T-03; esta tarea agrega sus bloques).

| Archivo | Contenido |
|---|---|
| `frontend/packages/ui/src/components/CardWidget/CardWidget.tsx` | `CardWidget` |
| `frontend/packages/ui/src/components/Dato/Dato.tsx` | `Dato` |
| `frontend/packages/ui/src/components/AlertaError/AlertaError.tsx` | `AlertaError` |
| `frontend/packages/ui/src/components/Backdrop/Backdrop.tsx` | `Backdrop` |
| `frontend/packages/ui/src/components/LogoNexa/LogoNexa.tsx` | `LogoNexa` |
| `frontend/packages/ui/src/components/Dialogo/Dialogo.tsx` | `Dialogo` (RV-D05) |
| `frontend/packages/ui/src/components/Shell/Shell.tsx` | `Shell` (RV-D06) |
| `frontend/packages/ui/src/index.ts` | Bloques de export |
| `frontend/packages/ui/test/CardWidget.test.tsx` | Tests de CardWidget |
| `frontend/packages/ui/test/Dato.test.tsx` | Tests de Dato |
| `frontend/packages/ui/test/AlertaError.test.tsx` | Tests de AlertaError |
| `frontend/packages/ui/test/Backdrop.test.tsx` | Tests de Backdrop |
| `frontend/packages/ui/test/LogoNexa.test.tsx` | Tests de LogoNexa |
| `frontend/packages/ui/test/Dialogo.test.tsx` | Tests de Dialogo |
| `frontend/packages/ui/test/Shell.test.tsx` | Tests de Shell |

## 6. Pasos de implementación

1. **RED.** Escribir los tests de la sección 10. Ejecutar `npm run test --workspace @nexa/ui`: fallan. Anotar el resultado.
2. **`CardWidget`.** Props: `title: string`, `action?: { label: string; onClick: () => void }`, `children: ReactNode`.
   - Contenedor: `<section className="flex flex-col gap-sp-16 rounded-card border border-border-hairline bg-surface-panel p-sp-20">`.
   - Encabezado: `<div className="flex items-center justify-between">` con `<h3 className="text-h3 text-text-primary">{title}</h3>` (ver D-T07-3).
   - Acción (si existe): `<button type="button" className="inline-flex items-center gap-sp-4 text-label text-text-primary focus-visible:outline ...">` con `<span aria-hidden="true"><ArrowUpRightIcon size={16} weight="regular" /></span>` y el `label`.
   - Contenido: `<div className="text-body-sm text-text-secondary">{children}</div>`.
3. **`Dato`.** Props: `label: string`, `value: ReactNode | null | undefined`, `mono?: boolean`.
   - `<dl className="flex flex-col gap-sp-4">` con `<dt className="text-label text-text-secondary">{label}</dt>` y `<dd className={mono ? "font-mono text-mono text-text-primary" : "text-body-sm text-text-primary"}>{value ?? "No disponible"}</dd>`. Visual propuesto, no definido en el Figma (D-T07-1).
   - Si `value` es `""`, se muestra `No disponible` igual.
4. **`AlertaError`.** Props: `children: ReactNode` (el mensaje), `role` fijo en `"alert"`. Sin props de icono.
   - `<div role="alert" className="flex items-start gap-sp-12 rounded-card bg-status-cancelada-bg px-sp-16 py-sp-12 text-body-sm text-status-cancelada-text">`.
   - Ícono: `<span aria-hidden="true" className="shrink-0"><WarningCircleIcon size={20} weight="regular" /></span>` (ver D-T07-2).
   - Texto: `<p>{children}</p>` o `<span>`. El componente no tiene textos propios.
5. **`Backdrop`.** Props: `children: ReactNode`. `<div className="min-h-dvh bg-backdrop">{children}</div>`. Sin alto fijo.
6. **`LogoNexa`.** Props: `showWordmark?: boolean` (default `true`).
   - Contenedor: `<div className="inline-flex items-center gap-sp-8">`. Si `showWordmark` es `false`, el contenedor recibe `role="img"` y `aria-label="Nexa Seguros"`, y el wordmark no se renderiza.
   - Marca: `<span aria-hidden="true" className="flex size-7 items-center justify-center rounded-input bg-action-primary font-sans text-[16px] font-bold leading-normal text-action-on-primary">N</span>`. Tamaño `size-7` (28 px).
   - Wordmark (si `showWordmark`): `<span className="text-h3 text-text-primary">Nexa Seguros</span>`.
7. **`Dialogo`.** Props: `titulo: string`, `descripcion?: string`, `children: ReactNode` (acciones; los botones los pasa la pantalla, RV-D05). Contenedor con `role="alertdialog"`, `aria-labelledby` y `aria-describedby` que apuntan al título y a la descripción. No tiene botones propios: el foco inicial lo recibe la acción que marca la pantalla (B-08 pone el foco en Cancelar).
8. **`Shell`.** Props: `children: ReactNode`. `<div className="rounded-shell bg-surface-panel shadow-shell">`, única sombra del sistema (`design-system §3.4, §5.15`, RV-D06). El inset y el ancho los decide cada app (DP-2 de T-16).
9. **Barrel.** Exportar `CardWidget`, `Dato`, `AlertaError`, `Backdrop`, `LogoNexa`, `Dialogo`, `Shell` y sus tipos de props.
10. **GREEN.** Ejecutar tests, typecheck y lint del workspace.

## 7. Contrato con el back

No aplica. Ningún componente de esta tarea llama al back.

## 8. Contenido de UI

Textos literales de este componente:
- Wordmark: `Nexa Seguros` (`pantallas/B1 §5`, `W1 §3`).
- Letra de la marca: `N`.
- Texto de `Dato` cuando no hay valor: `No disponible` (FB7.11: "estado no disponible").

Textos que llegan por props, no se hardcodean:
- Título y acción de `CardWidget`. Ejemplo del Figma, solo referencia: `Ver todo` y `Efectivo con Pago Fácil` (`W1 §3`).
- Mensaje de `AlertaError`. Dos textos conviven: `Email o contraseña incorrectos.` (Figma, `pantallas/B1 §5`) y `Credenciales inválidas.` (`detail` del back, `convenciones §2.1`). Lo define cada pantalla (FB7.6 y D-T07-5).
- Labels y valores de `Dato`. Ejemplos del Figma: `Estado`, `Fecha de validación` (`pantallas/B4 §3`).

## 9. Estados y casos borde

- **`AlertaError` no se oculta solo.** Si la pantalla no lo renderiza, no existe en el DOM. El `role="alert"` anuncia la alerta cuando se inserta: la pantalla debe montarlo en el momento del error, no dejarlo siempre montado vacío.
- **`AlertaError` sin mensaje.** Se renderiza la caja vacía. La pantalla evita pasar `children` vacío.
- **`Dato` con valor `null`, `undefined` o `""`.** Se muestra `No disponible`. No se muestra `null` ni `undefined`.
- **`Dato` con `mono`.** Para DNI, CUIL y patente (`design-system §5.12`, B4 §3).
- **`CardWidget` sin `action`.** No se renderiza botón ni espacio vacío extra (el encabezado usa `justify-between`).
- **`CardWidget` con título largo.** El título envuelve; no se trunca.
- **`LogoNexa` sin wordmark.** El contenedor se anuncia como imagen con nombre `Nexa Seguros`. La letra "N" queda oculta para lectores de pantalla.
- **`Backdrop` sin hijos.** Renderiza solo el degradado; es válido.
- **Contraste de `AlertaError`.** Texto `#b03a2e` sobre `#fbe5e2` cumple AA (4.99:1, `design-system §1.1`). Verificable con `axe`.

## 10. Tests requeridos

Herramientas: Vitest + Testing Library + `vitest-axe`.

| Test | Qué afirma |
|---|---|
| `CardWidget: el título es un h3` | `getByRole("heading", { level: 3, name: title })` |
| `CardWidget: renderiza children` | El contenido aparece en el DOM |
| `CardWidget: sin action no hay botón` | `queryByRole("button")` es `null` |
| `CardWidget: con action llama onClick` | Clic en el botón con `label` llama `onClick` una vez |
| `CardWidget: el ícono de la acción es decorativo` | El `span` del ícono tiene `aria-hidden="true"` |
| `CardWidget: sin violaciones de accesibilidad` | `axe` sin violaciones con título, acción y contenido |
| `Dato: asocia label y valor como dt y dd` | `getByText(label)` es `dt` y el valor es `dd` |
| `Dato: valor null muestra No disponible` | Con `value={null}` el `dd` contiene `No disponible` |
| `Dato: valor cadena vacía muestra No disponible` | Con `value=""` el `dd` contiene `No disponible` |
| `Dato: mono usa font-mono` | Con `mono`, el `dd` tiene clase `font-mono` |
| `AlertaError: tiene role alert` | `getByRole("alert")` contiene el mensaje |
| `AlertaError: el ícono es decorativo` | El ícono tiene `aria-hidden="true"` |
| `AlertaError: colores de estado cancelada` | Clases `bg-status-cancelada-bg` y `text-status-cancelada-text` |
| `AlertaError: sin violaciones de accesibilidad` | `axe` sin violaciones |
| `Backdrop: degradado y alto mínimo` | Clases `bg-backdrop` y `min-h-dvh`; no tiene `h-[1024px]` ni clase de alto fijo |
| `Backdrop: renderiza children` | El contenido aparece dentro |
| `LogoNexa: muestra el wordmark por defecto` | Texto `Nexa Seguros` visible |
| `LogoNexa: la N es decorativa` | El `span` de la letra tiene `aria-hidden="true"` |
| `LogoNexa: sin wordmark se anuncia como imagen` | Con `showWordmark={false}`, `getByRole("img", { name: "Nexa Seguros" })` existe y no hay wordmark |
| `LogoNexa: sin violaciones de accesibilidad` | `axe` sin violaciones en las dos variantes |
| `Dialogo: role alertdialog con nombre y descripción` | `getByRole("alertdialog", { name: titulo })` y `aria-describedby` apunta a la descripción |
| `Dialogo: sin violaciones de accesibilidad` | `axe` sin violaciones con título, descripción y dos acciones |
| `Shell: clases rounded-shell y shadow-shell` | El contenedor tiene `rounded-shell` y `shadow-shell`, y renderiza `children` |

## 11. Criterios de aceptación

1. `CardWidget`, `Dato`, `AlertaError`, `Backdrop`, `LogoNexa`, `Dialogo` y `Shell` se exportan desde `packages/ui/src/index.ts`.
2. `CardWidget` usa `h3` para el título y no tiene botón si no hay `action`.
3. La acción de `CardWidget` es un `<button type="button">` cuyo ícono está en un contenedor `aria-hidden`.
4. `Dato` renderiza `dt` y `dd`, y muestra `No disponible` cuando el valor es `null`, `undefined` o `""`.
5. `AlertaError` tiene `role="alert"` y no contiene texto propio: todo llega por `children`.
6. El ícono de `AlertaError` es `WarningCircleIcon` de 20 px dentro de un contenedor `aria-hidden`.
7. `Backdrop` usa `bg-backdrop` y `min-h-dvh`, sin alto fijo.
8. `LogoNexa` muestra la "N" con `aria-hidden` y el wordmark `Nexa Seguros` por defecto.
9. `LogoNexa` con `showWordmark={false}` tiene `role="img"` y `aria-label="Nexa Seguros"`.
10. Ningún componente contiene un texto de muestra del Figma (`Ver todo`, `A confirmar`, nombres de personas, importes).
11. `axe` no reporta violaciones en CardWidget, AlertaError y LogoNexa (un test por componente). Dato y Backdrop no tienen test de `axe` propio: su markup no tiene roles ni controles.
12. `npm run test`, `npm run typecheck` y `npm run lint` del workspace `@nexa/ui` pasan.

## 12. Verificación manual

Sin prueba manual en esta tarea. `AlertaError` y `LogoNexa` se verifican en US-FE-B-01 (login, B1), donde el mensaje de error aparece al fallar el acceso y el logo está arriba del formulario. Pasos para esa prueba: intentar entrar con credenciales incorrectas y revisar que la caja aparece con ícono y texto, y que el lector de pantalla anuncia el mensaje.

## 13. Decisiones pendientes

- **D-T07-1. Estilo de `Dato`.** El Figma no define su tipografía (solo dice "par de dato" en B4 §3). Default propuesto: etiqueta `text-label text-text-secondary`, valor `text-body-sm text-text-primary`, separación `gap-sp-4`. Pendiente con diseño.
- **D-T07-2. Ícono y tamaño de `AlertaError` (B1 vs B4).** B1 §3 usa `warning-circle` de 20 px con padding 16/12. B4 §3 usa `x-circle` de 16 px con padding 16 px. Default: el de B1 (`WarningCircleIcon` 20 px, padding 16/12), porque es la pantalla que define el componente como reutilizable (B1 §4). Pendiente con diseño para unificar.
- **D-T07-3. Nivel del título de `CardWidget`.** Default: `h3`, que coincide con el estilo H3 del Figma. Si una pantalla necesita otro nivel (por ejemplo `h2` en la página), se pasa un prop `headingLevel` (no incluido en esta tarea; se agrega cuando haga falta).
- **D-T07-4. Letra "N" del logo.** `design-system §9` item 5 pide confirmar si se agrega un estilo o es un SVG. Default: clases arbitrarias de Tailwind (`text-[16px] font-bold leading-normal`) con la familia de `font-sans`, sin token nuevo. Pendiente con diseño.
- **[CONFIRMAR] D-T07-5. Texto del error de login (RV-D01, FB8).** Default: texto del Figma, `Email o contraseña incorrectos.`; `detail` del back solo en errores de negocio sin texto propio. El componente no decide el texto. No cerrar sin confirmación del equipo: diseño.
- **D-T07-6. Texto de `Dato` sin valor.** Default: `No disponible` (FB7.11). No está en el Figma. Pendiente de confirmar con diseño.

## 14. Riesgos y errores comunes

- **`role="alert"` que nunca se anuncia.** Un elemento con `role="alert"` ya montado y luego cambiado no siempre se anuncia. Montarlo al producirse el error (sección 9).
- **Alerta usada para éxito.** `AlertaError` es de error. Un mensaje de éxito necesita otro componente; no reutilizar la caja con otro color.
- **`h3` repetido sin estructura.** Varias tarjetas en una página generan una jerarquía de títulos confusa. Revisar en la pantalla con `axe` (regla `heading-order`).
- **Logo sin texto alternativo.** Si `showWordmark` es `false` y no hay `aria-label`, el logo es invisible para lectores de pantalla. El componente lo resuelve; no quitar el `aria-label`.
- **Clases `min-h-dvh` en navegadores viejos.** Sin soporte de `dvh`, el fondo queda corto en móvil. Aceptable para el alcance de los navegadores objetivo; no hay fallback.
- **Textos de muestra copiados del Figma.** `Ver todo`, `A confirmar` o nombres de personas no deben quedar como texto fijo (FC4, `design-system §9` item 16).

## 15. Definición de terminado

- `npm run test`, `npm run typecheck`, `npm run lint` en verde en `@nexa/ui`.
- Los 23 tests de la sección 10 pasan, con el RED inicial anotado.
- Criterios de la sección 11 con evidencia.
- `rg "Ver todo|A confirmar|Tomás|Mariela" frontend/packages/ui` sin resultados.
- Sin secretos.
- Diff revisado: solo archivos de la sección 5.

## 16. Observaciones al índice

- Resuelto (RV-D01): la alerta de login usa el texto del Figma, "Email o contraseña incorrectos.", y no `detail`. El componente recibe `children` y no decide el texto (D-T07-5, marcado [CONFIRMAR]).
- Resuelto (RV-D27): hay dos variantes de `AlertaError` en el diseño. Se implementa la de B1 (`WarningCircleIcon` de 20 px, padding 16/12) como default (D-T07-2).
- Resuelto (RV-D27): `Dato` usa el estilo propuesto de D-T07-1 (etiqueta `text-label`, valor `text-body-sm`, `gap-sp-4`), reversible con diseño.
