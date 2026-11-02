# US-FE-T-04: `@nexa/ui`: Input y Select

Tipo: T · Oleada: 1 · Tamaño: M · Rama sugerida: `feature/US-FE-T-04-input-select` · Tarjeta Trello: `US-FE-T-04`

## 1. Objetivo

Al terminar, `@nexa/ui` exporta `Input` y `Select` con los cuatro estados del diseño (Default, Focus, Error, Disabled), label visible asociado, helper con `aria-describedby`, `aria-invalid` en error, y una referencia reenviada al elemento nativo para que `react-hook-form` pueda registrar el campo. Para: todos los formularios (B1 login, B4 alta de cliente, B6, B8, B14, W2, W4) y, a través de ellos, los usuarios de backoffice y de la web pública.

## 2. Alcance

**Entra:**
- `Input` (`<input>`) y `Select` (`<select>` nativo con caret Phosphor) en `packages/ui/src/components/`.
- `FieldFrame`: contenedor interno que dibuja label, campo y helper, y genera los IDs. Lo usan `Input` y `Select`; no se exporta como primitivo público.
- Bloque de export en `packages/ui/src/index.ts` (barrel de T-03).
- Tests en `packages/ui/test/Input.test.tsx` y `packages/ui/test/Select.test.tsx`.

**NO entra:**
- Mensajes de error específicos por campo (texto): lo pasa cada pantalla (`design-system.md §8.2`). Este componente solo muestra lo que recibe en `helper`.
- Formularios, validación zod, `useForm`: las features (B1, B4, etc.).
- Harness de accesibilidad de US-FE-T-19: en esta tarea el test de accesibilidad usa `vitest-axe` directamente (ver sección 10).
- Botones, chips, badges, tabla y tabs: T-05 y T-06.

## 3. Dependencias

- **Puede empezar sin esperar a:** US-FE-T-05 y US-FE-T-06 (primitivos en carpetas distintas).
- **Depende de:** US-FE-T-02 (Vitest, jest-dom, ESLint con R7 de accesibilidad) y US-FE-T-03 (`tokens.css` y preset de Tailwind con las clases de estado).
- **Bloqueada por pedidos al back (PB-NN):** ninguna.
- **Workaround MSW (FB7.7):** no aplica.

## 4. Documentos a leer

- `docs/frontend/design-system.md`:
  - §5.2 (Input: anatomía, tabla de estados con nodos, props propuestas, nota de salto de 1 px).
  - §5.3 (Select: estados, placeholder "Seleccioná una opción", props propuestas, caret `caret-down` 16×16).
  - §3.3 (bordes: Hairline, Strong, Foco 2 px, Error 1 px).
  - §8.2 (helper de error específico), §8.3 (foco visible), §8.4 (salto de layout del borde).
  - §6.1 (import Phosphor por archivo y `aria-hidden`).
- `docs/frontend/analisis-front.md` §9.2 (requisitos de accesibilidad de Input y Select: label visible, `aria-invalid`, `aria-describedby`, placeholder nunca como label).
- `docs/frontend/tareas/INDEX.md`: FC16 (accesibilidad de formularios: labels visibles, `aria-invalid`, `aria-describedby`, `role="alert"`, foco al primer error) y FB7.8 (contraste: tokens como están).
- `docs/frontend/pantallas/B4-nuevo-cliente.md` §3 (medidas de referencia: inputs de 40 px, radio 12 px, borde strong, padding 12 px).

## 5. Archivos a crear o modificar

Dueño de todos: US-FE-T-04, salvo el barrel (dueño T-03; esta tarea agrega su bloque).

| Archivo | Contenido |
|---|---|
| `frontend/packages/ui/src/components/Field/FieldFrame.tsx` | Label, campo (hijo), helper; IDs con `useId`; `data-state` |
| `frontend/packages/ui/src/components/Input/Input.tsx` | `Input` con `forwardRef` |
| `frontend/packages/ui/src/components/Select/Select.tsx` | `Select<T>` con `forwardRef` |
| `frontend/packages/ui/src/index.ts` | Bloque: `export { Input } ...` y `export { Select } ...` |
| `frontend/packages/ui/test/Input.test.tsx` | Tests de Input (sección 10) |
| `frontend/packages/ui/test/Select.test.tsx` | Tests de Select (sección 10) |

No se modifica ningún `package.json` (FC17).

## 6. Pasos de implementación

1. **RED.** Escribir los tests de Input y Select (sección 10). Ejecutar `npm run test --workspace @nexa/ui`: fallan porque los componentes no existen. Anotar el resultado.
2. **`FieldFrame`.** Props: `id?: string`, `label: string`, `helper?: string`, `state: "default" | "focus" | "error" | "disabled"`, `children: (ids: { inputId: string; helperId?: string }) => ReactNode`. Genera `inputId` con `useId()` (o usa `id` si lo recibe) y `helperId = `${inputId}-helper``. Renderiza:
   - `<div className="flex flex-col gap-sp-8">` (gap 8 px, columna).
   - `<label htmlFor={inputId} className="text-label text-text-secondary">` con `disabled` → `opacity-60` (ver 9).
   - El hijo (el campo).
   - Si hay `helper`: `<p id={helperId} className="text-label ...">`. Color: `text-status-cancelada-text` en error; `text-text-tertiary` en el resto.
   - Atributo `data-state={state}` en el contenedor raíz.
3. **`Input`.** `forwardRef<HTMLInputElement, InputProps>`. Props: `label: string`, `helper?: string`, `state?: FieldState`, `error?: boolean`, y `React.InputHTMLAttributes<HTMLInputElement>` menos `children`. Estado derivado: si `disabled` → `"disabled"`; si `error` o `state === "error"` → `"error"`; si no, `state ?? "default"`. El foco no es prop: se resuelve con clases `focus:` de Tailwind (sección 9).
   - `aria-invalid={estado === "error" ? true : undefined}`.
   - `aria-describedby={helper ? helperId : undefined}`.
   - Clases del campo: `box-border h-10 w-full rounded-input border border-border-strong bg-surface-panel px-sp-12 text-body text-text-primary placeholder:text-text-tertiary focus:border-action-primary focus:outline-none focus:ring-1 focus:ring-inset focus:ring-action-primary`, más las variantes por estado (error: `border-status-cancelada-text`; disabled: `border-border-hairline bg-surface-subtle text-text-tertiary`).
   - Spread de `...rest` antes de `ref` y de los atributos de accesibilidad, para que `name`, `onChange`, `onBlur` y `ref` de `react-hook-form` lleguen al `<input>`.
4. **`Select`.** `forwardRef<HTMLSelectElement, SelectProps<T>>` con la misma forma de props de `design-system §5.3` (`label`, `options`, `value`, `placeholder`, `helper`, `state`, `error`, `onChange`).
   - Opción placeholder: `<option value="" disabled hidden>{placeholder ?? "Seleccioná una opción"}</option>` al inicio. `value={value ?? ""}`.
   - `onChange={(e) => onChange?.(e.target.value as T)}`. El `as T` es la única conversión; documentar que `T` es un literal que la app garantiza.
   - Caret: `<CaretDownIcon size={16} weight="regular" />` dentro de `<span aria-hidden="true" className="pointer-events-none absolute right-sp-12 top-1/2 -translate-y-1/2">`. Import por archivo (`@phosphor-icons/react/dist/csr/CaretDown`, verificar la ruta instalada).
   - Clases del `<select>`: las de Input más `appearance-none pr-sp-40` (espacio para el caret).
   - `aria-invalid`, `aria-describedby` y `data-state` como en Input.
5. **Barrel.** Agregar el bloque de exports en `packages/ui/src/index.ts`.
6. **GREEN.** Ejecutar `npm run test --workspace @nexa/ui`, `npm run typecheck --workspace @nexa/ui` y `npm run lint`.

## 7. Contrato con el back

No aplica. No hay endpoints.

## 8. Contenido de UI

Textos literales de este componente (del Figma, `design-system §5.3`):
- Placeholder por defecto de Select: `Seleccioná una opción`.

Los demás textos (labels, helpers y mensajes de error) los pasan las pantallas. Ejemplos de referencia, no se hardcodean: `Debe ser mayor de 18 años.` (B4 §3), `El DNI debe tener 7 u 8 dígitos` (ejemplo de `design-system §8.2`, a confirmar por diseño).

## 9. Estados y casos borde

| Estado | Atributo | Borde | Fondo | Texto | Label | Helper |
|---|---|---|---|---|---|---|
| Default | `data-state="default"` | 1 px `border-strong` | `surface-panel` | placeholder `text-tertiary` | `text-secondary` | `text-tertiary` |
| Focus (CSS, no prop) | sin cambio | color `action-primary` + anillo interior 1 px (ver D-T04-1) | `surface-panel` | `text-primary` | `text-secondary` | `text-tertiary` |
| Error | `data-state="error"`, `aria-invalid="true"` | 1 px `status-cancelada-text` | `surface-panel` | `text-primary` | `text-secondary` | `status-cancelada-text` |
| Disabled | `data-state="disabled"`, `disabled` nativo | 1 px `border-hairline` | `surface-subtle` | `text-tertiary` | `text-secondary` con `opacity-60` | `text-tertiary` |

Casos:
- **Foco y salto de layout (`design-system §8.4`).** Con `box-border` y alto fijo de 40 px, pasar de 1 px a 2 px de borde mueve el texto 1 px. Por eso el foco usa borde de color `action-primary` (1 px) más `ring-1 ring-inset` del mismo color, lo que se ve como 2 px sin mover el contenido.
- **Helper de error.** El componente no genera texto de error. Si `error` es `true` y no hay `helper`, el campo se marca `aria-invalid` sin texto: el caller debe pasar `helper` (`design-system §8.2`).
- **Helper sin error.** Un `helper` sin error se muestra con `text-tertiary` y se referencia con `aria-describedby`.
- **Campo sin helper.** No se renderiza el `<p>` y no existe `aria-describedby`.
- **Select sin valor.** `value` `undefined` o `""` muestra el placeholder (la opción está `hidden`, pero es el valor seleccionado).
- **Select con valor fuera de `options`.** El navegador muestra la primera opción. No se corrige en el componente: la pantalla pasa valores de `options`.
- **Disabled.** Un campo deshabilitado no recibe foco (nativo) y no cambia de estado con el foco.
- **Ref.** `ref` apunta al `<input>` o `<select>` nativo, no al contenedor.
- **Textos largos.** El texto del campo se corta con el ancho del campo; el label puede envolver. No hay `truncate`.

## 10. Tests requeridos

Herramientas: Vitest + Testing Library (`render`, `screen`, `fireEvent`/`userEvent`) + `vitest-axe` (accesibilidad directa, sin harness de T-19).

| Test | Qué afirma |
|---|---|
| `Input: el label es visible y está asociado al campo` | `getByLabelText("Email")` devuelve el `<input>` |
| `Input: estado default` | `data-state="default"`, sin `aria-invalid`, clase `border-border-strong` |
| `Input: estado focus usa clases de foco sin cambiar el ancho del borde` | Clases `focus:border-action-primary`, `focus:ring-1`, `box-border` presentes; ninguna clase `border-2` en el campo |
| `Input: estado error marca aria-invalid y asocia el helper` | `aria-invalid="true"`, `aria-describedby` igual al `id` del helper, helper con `text-status-cancelada-text` |
| `Input: estado disabled` | `disabled` nativo, `data-state="disabled"`, clase `bg-surface-subtle`, label con `opacity-60` |
| `Input: sin helper no tiene aria-describedby` | El `<input>` no tiene el atributo |
| `Input: reenvía ref al input nativo` | `createRef` queda con `HTMLInputElement` |
| `Input: pasa name y onChange (compatible con register)` | `onChange` se llama al escribir; `name` está en el DOM |
| `Input: sin violaciones de accesibilidad en estado error` | `axe(container)` sin violaciones (`vitest-axe`) |
| `Select: muestra el placeholder Seleccioná una opción sin valor` | El `combobox` tiene valor `""` y la opción placeholder tiene el texto |
| `Select: llama onChange con el valor de la opción` | Al elegir una opción, `onChange` recibe el `value` de esa opción |
| `Select: estado error` | `aria-invalid="true"`, helper asociado, `data-state="error"` |
| `Select: estado disabled` | `disabled` nativo y `data-state="disabled"` |
| `Select: caret decorativo` | El caret tiene un ancestro con `aria-hidden="true"` |
| `Select: reenvía ref al select nativo` | `createRef` queda con `HTMLSelectElement` |
| `Select: sin violaciones de accesibilidad` | `axe(container)` sin violaciones |
| `Input y Select: label obligatorio en el tipo` | Un `@ts-expect-error` sin `label` falla en `typecheck` (un caso por componente) |

## 11. Criterios de aceptación

1. `Input` y `Select` se exportan desde `packages/ui/src/index.ts`.
2. `label` es obligatorio en ambos (un test `@ts-expect-error` en `Input.test.tsx` lo verifica en typecheck).
3. Los cuatro estados se distinguen por `data-state` (`default`, `error`, `disabled`; el foco por clases CSS).
4. En estado error, el campo tiene `aria-invalid="true"` y `aria-describedby` apunta al `id` del helper.
5. Sin helper, el campo no tiene `aria-describedby`.
6. Input y Select reenvían `ref` al elemento nativo (dos tests).
7. Input pasa `name` y `onChange` al `<input>` (compatible con `register`).
8. Select usa `<select>` nativo y el placeholder `Seleccioná una opción` cuando no hay valor.
9. El caret de Select tiene `aria-hidden="true"`.
10. El campo tiene alto de 40 px (`h-10`), radio `rounded-input`, padding `px-sp-12` y `box-border`.
11. Ninguna clase de color es hex: todas usan tokens (`border-border-strong`, `text-text-primary`, etc.).
12. `axe` no reporta violaciones en Input en estado error ni en Select en estado default.
13. `npm run test`, `npm run typecheck` y `npm run lint` del workspace `@nexa/ui` pasan.

## 12. Verificación manual

Sin prueba manual: no hay pantalla en esta tarea. El campo se verifica visualmente en US-FE-B-01 (login), que es la primera pantalla con Input.

## 13. Decisiones pendientes

- **D-T04-1. Foco: borde 2 px o anillo interior (default: anillo).** `design-system §5.2` pide borde de 2 px en foco; `§8.4` advierte el salto de 1 px y recomienda anillo interior. Default: borde de 1 px con color de foco más `ring-1 ring-inset`, que se ve como 2 px y no mueve el contenido. Si diseño confirma borde real de 2 px, se cambia a `border-2` y se compensa el padding. Pendiente con diseño.
- **D-T04-2. Select nativo o listbox propio (default: nativo).** Un `<select>` nativo ya tiene roles, teclado y lectores de pantalla. Un listbox propio requiere implementar lo mismo. Default: nativo, con el caret del diseño encima.
- **D-T04-3. Texto de error específico.** `design-system §8.2` pide un mensaje específico por campo, y el diseño no lo define. Default: el caller pasa `helper` con el texto de error. El texto de cada campo se resuelve en la tarea de la pantalla.
- **D-T04-4. Color de label en disabled.** `design-system §5.2` dice `text/secondary` con opacidad 60 %. Default: `opacity-60` sobre el label.

## 14. Riesgos y errores comunes

- **`forwardRef` ausente o `rest` después de `ref`:** `react-hook-form` no encuentra el campo y el valor no se envía. El test de ref y el test de `name`/`onChange` lo detectan.
- **Foco que cambia el ancho:** si se agrega `border-2` sin compensar, el texto se mueve. Revisar con foco real en el paso de prueba manual de B-01.
- **Select controlado sin `value` ni `""`:** React advierte si `value` pasa de `undefined` a un valor. Usar siempre `value ?? ""`.
- **Placeholder como label:** prohibido por FC16. El placeholder del Select es una opción `hidden`, no reemplaza al label.
- **IDs repetidos:** `useId` evita colisiones entre instancias. No usar IDs fijos.
- **Caret con `pointer-events`:** sin `pointer-events-none`, el caret intercepta el clic y el select no se abre en algunos navegadores.
- **Iconos Phosphor:** el import por archivo (`dist/csr/CaretDown`) cambia entre versiones. Verificar la ruta en `node_modules/@phosphor-icons/react/dist/csr/` antes de escribir.

## 15. Definición de terminado

- `npm run test`, `npm run typecheck`, `npm run lint` en verde en `@nexa/ui`.
- Los 17 tests de la sección 10 pasan; el RED inicial queda anotado en el PR.
- Criterios de la sección 11 con evidencia.
- Diseño revisado contra `design-system §5.2` y `§5.3` (captura de Storybook no aplica: la verificación visual queda en B-01).
- Sin secretos.
- Diff revisado: solo archivos de la sección 5.

## 16. Observaciones al índice

- Resuelto (RV-49): FC8 se aclara: los primitivos usan `vitest-axe` directo y T-19 es el helper para pantallas. T-04 no espera a T-19.
- Resuelto (RV-D27): el foco se implementa con anillo interior (`ring-1 ring-inset`), default de D-T04-1, pendiente de confirmación con diseño.
