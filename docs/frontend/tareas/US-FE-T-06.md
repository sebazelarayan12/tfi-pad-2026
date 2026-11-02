# US-FE-T-06: `@nexa/ui`: Table y Tabs

Tipo: T · Oleada: 1 · Tamaño: M · Rama sugerida: `feature/US-FE-T-06-table-tabs` · Tarjeta Trello: `US-FE-T-06`

## 1. Objetivo

Al terminar, `@nexa/ui` exporta `Table<T>` (encabezado y filas con `<th scope="col">`, `<caption>` obligatorio, columnas tipadas y menú de fila opcional) y `Tabs` con `TabPanel` (patrón `tablist`/`tab`/`tabpanel`, controlado por `value`, con flechas de teclado). Para: los listados de B3 clientes, B9 pólizas, B11 pagos, B13 planes y B14 usuarios, y las pestañas de la ficha de cliente (B5, `?tab=`).

## 2. Alcance

**Entra:**
- `Table<T>` en `packages/ui/src/components/Table/Table.tsx`.
- `Tabs` y `TabPanel` en `packages/ui/src/components/Tabs/Tabs.tsx`, con el contexto interno de IDs.
- Bloques de export en `packages/ui/src/index.ts`.
- Tests en `packages/ui/test/Table.test.tsx` y `packages/ui/test/Tabs.test.tsx`.

**NO entra:**
- Paginación, orden por columna, filtros y estado vacío con mensaje: cada pantalla (B3, B9, B11, B13, B14). La tabla no tiene estado de carga ni de vacío propio.
- Pestaña "Vehículos" de la ficha de cliente, su contenido y la sincronización con `?tab=` de la URL: US-FE-B-07. Este componente solo recibe `value` y `onValueChange`.
- Badges dentro de celdas: los compone la pantalla con `EstadoBadge` (T-05) en `render`.
- Harness de accesibilidad de T-19: aquí se usa `vitest-axe` directamente.

## 3. Dependencias

- **Puede empezar sin esperar a:** US-FE-T-04 y US-FE-T-05 (primitivos en carpetas distintas).
- **Depende de:** US-FE-T-02 (Vitest, ESLint) y US-FE-T-03 (tokens y preset).
- **Bloqueada por pedidos al back (PB-NN):** ninguna.
- **Workaround MSW (FB7.7):** no aplica.

## 4. Documentos a leer

- `docs/frontend/design-system.md`:
  - §5.12 (Table/Header y Table/Row: medidas, props propuestas `TableColumn<T>` y `TableProps<T>`, alturas de 40 y 48 px, padding de 16 px, divisor hairline).
  - §3.2 (radio superior 12 px del header de tabla).
  - §9 item 3 (conflicto entre "columnas de igual ancho (layoutGrow)" y los anchos fijos del código de referencia; ver D-T06-1).
  - §8.3 (foco visible propuesto).
- `docs/frontend/analisis-front.md` §9.2 (tablas: `<th scope="col">` y `<caption>`; pestañas: patrón `tablist`/`tab`/`tabpanel`).
- `docs/frontend/pantallas/B5-ficha-cliente.md` §12 (accesibilidad de pestañas: `tablist`/`tab`/`tabpanel`, navegación con flechas, el `tabpanel` queda asociado a la pestaña activa) y §4 (`ClienteTabs` propuesto; este componente es la base genérica).
- `docs/frontend/pantallas/B11-pagos-y-facturas.md` §3 (medidas de Tabs: alto 30 px, gap 24 px, pestaña activa con indicador negro de 2 px) y §3 (tabla: radio 12 px, header de 40 px, filas de 48 px).

## 5. Archivos a crear o modificar

Dueño de todos: US-FE-T-06, salvo el barrel (dueño T-03; esta tarea agrega sus bloques).

| Archivo | Contenido |
|---|---|
| `frontend/packages/ui/src/components/Table/Table.tsx` | `Table<T>`, `TableColumn<T>`, `TableProps<T>` |
| `frontend/packages/ui/src/components/Tabs/Tabs.tsx` | `Tabs`, `TabPanel`, `TabItem`, `TabsProps` |
| `frontend/packages/ui/src/index.ts` | Bloques de export |
| `frontend/packages/ui/test/Table.test.tsx` | Tests de Table |
| `frontend/packages/ui/test/Tabs.test.tsx` | Tests de Tabs |

## 6. Pasos de implementación

1. **RED.** Escribir los tests de la sección 10. Ejecutar `npm run test --workspace @nexa/ui`: fallan. Anotar el resultado.
2. **`Table<T>`.** Props:
   - `columns: ReadonlyArray<TableColumn<T>>` con `key: keyof T & string`, `header: string`, `width?: number` (px), `render?: (row: T) => ReactNode`, `mono?: boolean`.
   - `rows: ReadonlyArray<T>`, `getRowKey: (row: T) => string`, `caption: string` (obligatorio), `onRowMenu?: (row: T) => void`.
   - Markup: `<table className="w-full table-fixed border-separate border-spacing-0">`. `<caption className="sr-only">{caption}</caption>`.
   - `<thead><tr className="bg-surface-subtle">` con un `<th scope="col" className="h-10 px-sp-16 text-left text-label text-text-secondary">` por columna. El primer `th` lleva `rounded-tl-input` y el último `rounded-tr-input` (radio superior 12 px).
   - Si hay `onRowMenu`, una columna extra de 24 px (`w-6`) con `<th scope="col"><span className="sr-only">Acciones</span></th>`.
   - `<tbody>`: una `<tr className="h-12">` por fila, con `key={getRowKey(row)}`. Cada `<td className="border-b border-border-hairline px-sp-16 align-middle">`. Texto: `text-body-sm text-text-primary` (o `font-mono text-mono` si `mono`). Si la columna tiene `render`, se usa su resultado; si no, `String(row[key])`.
   - Ancho: si `width` está definido, `style={{ width: `${width}px` }}` en el `th`. Si no, el reparto es igual (`table-fixed`). El `style` solo lleva el ancho que pasa el caller (no es un valor del diseño).
   - Menú: `<button type="button" aria-label="Acciones de la fila" onClick={() => onRowMenu(row)}>` con `<span aria-hidden="true"><DotsThreeIcon size={16} weight="regular" /></span>`.
3. **`Tabs`.** Props: `label: string` (aria-label del `tablist`), `items: ReadonlyArray<{ id: string; label: string }>`, `value: string`, `onValueChange: (id: string) => void`.
   - Contexto interno con `baseId = useId()`, `value`. IDs: `${baseId}-tab-${id}` y `${baseId}-panel-${id}`.
   - `<div role="tablist" aria-label={label} className="flex h-[30px] gap-sp-24">`.
   - Cada tab: `<button role="tab" id aria-selected aria-controls={panelId} tabIndex={selected ? 0 : -1} type="button">`. Estilo: `text-body-sm`; seleccionada `text-text-primary border-b-2 border-action-primary`; no seleccionada `text-text-secondary border-b-2 border-transparent`. Foco visible (`focus-visible:outline-2 ...`, como T-05).
   - Si `value` no coincide con ningún `id`, la primera pestaña tiene `tabIndex={0}` (ver sección 9).
   - Teclado: `ArrowRight` y `ArrowLeft` mueven al siguiente y anterior con vuelta al inicio o al final; `Home` y `End` van al primero y al último. Al mover, se enfoca la pestaña nueva y se llama `onValueChange(id)` (activación automática).
4. **`TabPanel`.** Props: `tabId: string`, `children`. Lee el contexto. `<div role="tabpanel" id={panelId} aria-labelledby={tabId} hidden={value !== tabId} tabIndex={0}>`. Si está oculto, sigue montado con `hidden` (ver D-T06-3).
5. **Barrel.** Exportar `Table`, `TableColumn`, `TableProps`, `Tabs`, `TabPanel`, `TabItem`, `TabsProps`.
6. **GREEN.** Ejecutar tests, typecheck y lint del workspace.

## 7. Contrato con el back

No aplica. El componente recibe datos ya tipados por la pantalla.

## 8. Contenido de UI

- `Table`: encabezados y `caption` se pasan por props. El texto del `caption` no se muestra (es `sr-only`) y lo define cada pantalla. Ejemplos del Figma, solo como referencia: encabezados `Nombre`, `DNI`, `Email`, `Teléfono`, `Vehículos`, `Renaper`, `Pólizas activas` (`design-system §5.12`). No se hardcodean en el componente.
- `Acciones` (texto solo lector de pantalla del menú de fila) y `aria-label` `Acciones de la fila`: propuestas de accesibilidad, no están en el Figma (ver D-T06-2).
- `Tabs`: `label` y los títulos de las pestañas los pasa la pantalla. Ejemplos de referencia: `Pagos`, `Facturas` (B11 §3); `Vehículos`, `Pólizas` (B5 §4).

## 9. Estados y casos borde

- **Tabla sin filas.** Se renderiza solo el encabezado y `tbody` vacío. El mensaje de vacío lo pone la pantalla fuera de la tabla.
- **Tabla con `rows` cambiando.** `getRowKey` debe ser estable. Una clave repetida hace que React avise y reuse filas mal; el test de claves lo cubre.
- **Celda sin `render` y valor `null`.** `String(null)` produce "null" en pantalla. Por eso `null` lo resuelve `render` de la pantalla (por ejemplo "No disponible", FB7.11). El componente no oculta el valor nulo.
- **Columna `mono`.** DNI y pólizas usan `font-mono text-mono` (`design-system §5.12`).
- **Tabs con `value` inválido.** Ninguna pestaña queda seleccionada; la primera recibe `tabIndex={0}` para que la tabla de pestañas siga siendo alcanzable con Tab.
- **Tabs con un solo ítem.** Las flechas no se mueven; `Home` y `End` quedan en el mismo.
- **Foco al cambiar con flechas.** El foco va a la pestaña nueva. Si `onValueChange` no actualiza `value` (componente padre no controlado), la pestaña enfocada no queda seleccionada: es un error de la pantalla, no del componente.
- **Panel oculto.** `hidden` oculta el contenido sin desmontarlo. El contenido de B5 mantiene su estado al cambiar de pestaña.
- **Menú de fila sin `onRowMenu`.** No se renderiza la columna extra.

## 10. Tests requeridos

Herramientas: Vitest + Testing Library (`render`, `screen`, `within`, `userEvent` o `fireEvent`) + `vitest-axe`.

| Test | Qué afirma |
|---|---|
| `Table: tiene caption accesible` | `getByRole("table", { name: caption })` |
| `Table: encabezados con scope col` | Cada `th` del `thead` tiene `scope="col"` |
| `Table: caption obligatorio en el tipo` | Un `@ts-expect-error` sin `caption` falla en `typecheck` |
| `Table: una fila por elemento de rows` | El número de `tr` en `tbody` es igual al de `rows` |
| `Table: usa getRowKey` | Un `key` duplicado produce advertencia en consola (spy sobre `console.error`) y se evita con claves únicas en el test |
| `Table: render sobrescribe el valor de la celda` | Con `render`, el texto de la celda es el devuelto por `render` |
| `Table: columna mono usa font-mono` | La celda de una columna `mono` tiene clase `font-mono` |
| `Table: width fija la columna con style` | Una columna con `width: 120` tiene `style` con `width: 120px` |
| `Table: sin width reparte el ancho por igual` | Sin `width`, el `th` no tiene `style` de ancho y la tabla tiene `table-fixed` |
| `Table: menú de fila llama onRowMenu con la fila` | Clic en "Acciones de la fila" llama con la fila correcta |
| `Table: sin onRowMenu no hay columna de menú` | No existe el botón "Acciones de la fila" |
| `Table: sin violaciones de accesibilidad` | `axe` sin violaciones con encabezado y dos filas |
| `Tabs: roles tablist, tab y tabpanel` | `tablist` con `aria-label`; tabs con `role="tab"`; paneles con `role="tabpanel"` |
| `Tabs: aria-selected y tabIndex de la pestaña activa` | La activa tiene `aria-selected="true"` y `tabIndex=0`; las demás `-1` |
| `Tabs: aria-controls y aria-labelledby se corresponden` | El `aria-controls` de cada tab es el `id` de su panel, y el `aria-labelledby` del panel es el `id` del tab |
| `Tabs: ArrowRight mueve la selección y llama onValueChange` | Tras `ArrowRight`, el foco está en la siguiente pestaña y `onValueChange` recibe su `id` |
| `Tabs: ArrowLeft vuelve con envoltura` | En la primera, `ArrowLeft` va a la última |
| `Tabs: Home y End` | `End` va a la última y `Home` a la primera |
| `TabPanel: solo el panel activo es visible` | El panel no activo tiene atributo `hidden` |
| `Tabs: value inválido deja la primera con tabIndex 0` | Ninguna `aria-selected="true"` y la primera con `tabIndex=0` |
| `Tabs: sin violaciones de accesibilidad` | `axe` sobre el conjunto de tabs y un panel |

## 11. Criterios de aceptación

1. `Table`, `TableColumn`, `TableProps`, `Tabs`, `TabPanel` se exportan desde `packages/ui/src/index.ts`.
2. `caption` es obligatorio en `Table` (un `@ts-expect-error` lo verifica en typecheck).
3. Cada `th` de `thead` tiene `scope="col"`.
4. La tabla tiene un `<caption>` con el texto recibido, oculto visualmente con `sr-only`.
5. La fila mide 48 px (`h-12`) y las celdas tienen `px-sp-16` y divisor `border-border-hairline`.
6. El encabezado mide 40 px (`h-10`), fondo `bg-surface-subtle`, y el primer y último `th` tienen radio superior de 12 px.
7. Una columna con `width` fija el ancho con `style`; sin `width` no se fija ningún ancho.
8. `onRowMenu` agrega la columna de menú con el botón `Acciones de la fila`; sin `onRowMenu` no existe.
9. `Tabs` tiene `role="tablist"`, cada pestaña `role="tab"` y cada panel `role="tabpanel"`, con `aria-controls` y `aria-labelledby` que se corresponden.
10. Solo la pestaña activa tiene `tabIndex=0`.
11. `ArrowRight`, `ArrowLeft`, `Home` y `End` mueven la selección; `ArrowRight` en la última va a la primera.
12. `Tabs` es controlado: cambia la selección solo cuando cambia `value`; el cambio de tecla llama `onValueChange`.
13. El `tablist` mide 30 px (`h-[30px]`) y las pestañas tienen gap de 24 px (`gap-sp-24`).
14. `axe` no reporta violaciones en Table ni en Tabs.
15. `npm run test`, `npm run typecheck` y `npm run lint` del workspace `@nexa/ui` pasan.

## 12. Verificación manual

Sin prueba manual en esta tarea: no hay pantalla. La primera verificación visual es B3 (listado de clientes, US-FE-B-04) para la tabla y B5 (ficha de cliente, US-FE-B-07) para las pestañas. Pasos para la persona que pruebe en B-04: abrir `/clientes`, revisar que la tabla tiene encabezado gris y filas de 48 px, y navegar con Tab a las acciones de fila.

## 13. Decisiones pendientes

- **D-T06-1. Ancho de columnas (resuelta por defecto).** `design-system §9` item 3 contradice la descripción de Figma (columnas iguales, `layoutGrow`) con el código de referencia (anchos fijos). Default: `width` opcional; sin `width`, las columnas se reparten por igual (`table-fixed`); con `width`, se fija en píxeles. La pantalla decide por columna. Pendiente con diseño para confirmar la regla general.
- **D-T06-2. Texto del menú de fila.** Default: `aria-label` "Acciones de la fila" y texto de lector de pantalla "Acciones". Son propuestas de accesibilidad (no están en el Figma). Pendiente con diseño.
- **D-T06-3. Paneles desmontados o solo ocultos.** Default: se montan con `hidden`, para conservar el estado de la pestaña al cambiar (B5). Alternativa: no montar el panel inactivo, más liviano pero sin estado. Se elige por defecto la primera.
- **D-T06-4. Activación de pestaña.** Default: automática (la pestaña se activa al moverse con la flecha). Alternativa: manual con `Enter`/`Space`. El patrón ARIA admite las dos; B5 dice "navegación con flechas" sin distinguir.
- **D-T06-5. Estilo de las pestañas.** `pantallas/B11 §3` da alto, gap e indicador, pero no tipografía. Default: `text-body-sm` (13/18). Pendiente con diseño.

## 14. Riesgos y errores comunes

- **`<table>` con ancho fijo en mobile.** Con `table-fixed` y muchas columnas, el contenido se corta. El ancho mínimo y el scroll horizontal dependen de la pantalla (B3 y B9 se diseñan para 1440 px; `design-system §7.4`). No se resuelve en esta tarea.
- **`key` no estable o duplicada.** React reordena o reusa filas mal. Usar un id de la entidad (no el índice).
- **Pestañas sin `aria-controls` correspondiente.** Un `id` mal generado rompe la asociación. Los IDs salen del mismo `baseId` por contexto, no de strings a mano.
- **Clic en pestaña sin `onValueChange` en la pantalla.** La pestaña nunca cambia. Es la forma correcta de un componente controlado; la pantalla debe conectar `value` a `?tab=`.
- **Panel oculto con formularios.** Un formulario dentro de un panel oculto sigue en el DOM. Su validación no corre hasta que se muestra; no usar paneles ocultos para formularios que deban validar antes de mostrarse.
- **Clases de altura con corchetes (`h-[30px]`).** Son valores arbitrarios de Tailwind, no tokens. Solo se usan porque el diseño da 30 px y el preset no tiene token de 30 px; no extender el preset para esto sin acuerdo.

## 15. Definición de terminado

- `npm run test`, `npm run typecheck`, `npm run lint` en verde en `@nexa/ui`.
- Los 21 tests de la sección 10 pasan, con el RED inicial anotado.
- Criterios de la sección 11 con evidencia.
- Sin secretos.
- Diff revisado: solo archivos de la sección 5.

## 16. Observaciones al índice

- Resuelto (triage final, default de la ficha): Ubicación de las pestañas. `pantallas/B5 §4` propone `ClienteTabs` dentro de `features/clientes/components`, y el INDEX asigna `Tabs` a `@nexa/ui` (T-06). No hay contradicción: esta tarea deja un `Tabs` genérico y la feature de clientes lo compone con su `?tab=`. Pedido: confirmar en `pantallas/B5 §4` que `ClienteTabs` es la composición y no un componente nuevo. (No figura en REVISION ni en FB8.)
- Resuelto (RV-D27): el ancho de columnas es opcional, con reparto igual por defecto (D-T06-1). La regla general queda pendiente con diseño.
