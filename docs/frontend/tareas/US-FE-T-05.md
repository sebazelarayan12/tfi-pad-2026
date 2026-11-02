# US-FE-T-05: `@nexa/ui`: Button, Chip y Badge/Estado

Tipo: T · Oleada: 1 · Tamaño: M · Rama sugerida: `feature/US-FE-T-05-button-chip-badge` · Tarjeta Trello: `US-FE-T-05`

## 1. Objetivo

Al terminar, `@nexa/ui` exporta tres primitivos: `Button` (variantes Primary, Secondary y Ghost; tamaños M y S), `Chip` (cuatro tipos, dos de ellos seleccionables) y `EstadoBadge` (nueve estados del diseño). Además exporta el conjunto cerrado `BADGE_ESTADOS` y el tipo `BadgeEstado`, que es el contrato que consume US-FE-T-10 para mapear los valores del back. Para: todas las pantallas con acciones, filtros y estados (B1, B4, B5, B9, B10, B11, B13).

## 2. Alcance

**Entra:**
- `Button` con `variant`, `size`, `icon`, `label`, `disabled` y `type` por defecto `"button"`.
- `Chip` con `tipo` obligatorio (`destacado`, `neutro`, `seleccionado`, `sin-seleccionar`) y `onClick` opcional.
- `EstadoBadge` con `estado: BadgeEstado`, más `BADGE_ESTADOS` (array `as const` con los nueve literales) y `ESTADO_BADGE_TOKENS` (mapa estado → clases).
- Bloques de export en `packages/ui/src/index.ts`.
- Tests en `packages/ui/test/Button.test.tsx`, `Chip.test.tsx` y `EstadoBadge.test.tsx`.

**NO entra:**
- Mapeo de `(dominio, valor)` del back a `BadgeEstado` (enum `EstadoPoliza`, `EstadoCuota`, etc.): US-FE-T-10.
- Lógica de filtros con chips (qué chip está seleccionado): cada pantalla (B9, B11, B13).
- Área de toque de 44 px en mobile: pendiente (ver D-T05-3).
- Estados de carga y bloqueo de mutaciones (FC11): la pantalla pasa `disabled` mientras corre la mutación.

## 3. Dependencias

- **Puede empezar sin esperar a:** US-FE-T-04 y US-FE-T-06 (primitivos en carpetas distintas).
- **Depende de:** US-FE-T-02 (Vitest, ESLint) y US-FE-T-03 (tokens y preset).
- **Bloqueada por pedidos al back (PB-NN):** ninguna para el componente. El mapa de valores del back es de T-10 (PB-13).
- **Workaround MSW (FB7.7):** no aplica.

## 4. Documentos a leer

- `docs/frontend/design-system.md`:
  - §5.1 (Button: variantes, tamaños, alturas, paddings, tipografía, props propuestas).
  - §5.4 (Badge/Estado: nueve estados, colores por token, props propuestas, nota de valores frente al enum).
  - §5.5 (Chip: cuatro tipos, colores, props propuestas).
  - §1.1 (pares de contraste de estados; el par Suspendida no cumple AA).
  - §8.3 (foco visible propuesto para componentes sin foco en Figma).
  - §8.5 (tamaños táctiles y propuesta de 44 px en mobile).
  - §9 item 7 (estados no diseñados: hover, pressed, disabled de Button, Chip y NavItem).
  - §9 item 14 (valores del Badge contra el enum del back).
  - §6.1 (import Phosphor, `aria-hidden` en íconos decorativos).
- `docs/frontend/contratos-api/convenciones-transversales.md` §8.2 (qué dato del back corresponde a cada badge; solo referencia para T-10).
- `docs/frontend/pantallas/B5-ficha-cliente.md` §4 (variantes de Badge usadas en B5: Validado, Vigente, Vencida) y §4 (Button: Secondary "Editar", ghost "Dar de baja").
- `docs/frontend/00-decisiones-base.md` FB7.8 (contraste: se implementan los tokens como están).
- `docs/frontend/tareas/INDEX.md` FC11 (mutaciones: botón deshabilitado mientras corre; `retry: 0`).

## 5. Archivos a crear o modificar

Dueño de todos: US-FE-T-05, salvo el barrel (dueño T-03; esta tarea agrega sus bloques).

| Archivo | Contenido |
|---|---|
| `frontend/packages/ui/src/components/Button/Button.tsx` | `Button` |
| `frontend/packages/ui/src/components/Chip/Chip.tsx` | `Chip` |
| `frontend/packages/ui/src/components/EstadoBadge/estados.ts` | `BADGE_ESTADOS`, `BadgeEstado`, `ESTADO_BADGE_TOKENS` |
| `frontend/packages/ui/src/components/EstadoBadge/EstadoBadge.tsx` | `EstadoBadge` |
| `frontend/packages/ui/src/index.ts` | Bloques de export de los tres componentes y de `BADGE_ESTADOS`/`BadgeEstado` |
| `frontend/packages/ui/test/Button.test.tsx` | Tests de Button |
| `frontend/packages/ui/test/Chip.test.tsx` | Tests de Chip |
| `frontend/packages/ui/test/EstadoBadge.test.tsx` | Tests de EstadoBadge |

## 6. Pasos de implementación

1. **RED.** Escribir los tests de la sección 10. Ejecutar `npm run test --workspace @nexa/ui`: fallan. Anotar el resultado.
2. **`estados.ts`.** Definir:
   - `BADGE_ESTADOS = ["Pendiente", "Vigente", "Suspendida", "Cancelada", "Vencida", "Pagada", "Anulada", "Validado", "Pendiente CAE"] as const`.
   - `export type BadgeEstado = (typeof BADGE_ESTADOS)[number];`
   - `ESTADO_BADGE_TOKENS: Record<BadgeEstado, { fondo: string; texto: string }>` con las clases de la tabla de la sección 9.
   El `Record` obliga a cubrir los nueve valores; un valor faltante no compila.
3. **`EstadoBadge`.** `<span className="inline-flex h-6 items-center rounded-pill px-sp-12 py-sp-4 text-label {fondo} {texto}">{estado}</span>`. El texto visible es el literal del estado. Sin ícono ni punto (`design-system §5.4`).
4. **`Button`.** Props: `variant?: "primary" | "secondary" | "ghost"` (default `"primary"`), `size?: "m" | "s"` (default `"m"`), `icon?: ReactNode`, `label: string`, y `ButtonHTMLAttributes<HTMLButtonElement>` menos `children`. `type` por defecto `"button"`.
   - Alto: M `h-10` (40 px), S `h-8` (32 px). Padding horizontal: M `px-sp-16`, S `px-sp-12`. Gap `gap-sp-8`. Radio `rounded-pill`. Tipografía: M `text-body`, S `text-label`.
   - Variantes: Primary `bg-action-primary text-action-on-primary`; Secondary `border border-border-strong bg-surface-panel text-text-primary`; Ghost `bg-transparent text-text-primary`.
   - Ícono: `<span aria-hidden="true" className="inline-flex">{icon}</span>`. El ícono es decorativo; el texto `label` es el nombre accesible.
   - Foco (`design-system §8.3`): `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary`.
   - Deshabilitado (propuesta, el diseño no lo define): `disabled:cursor-not-allowed disabled:opacity-50`.
5. **`Chip`.** Props: `tipo: ChipTipo` (obligatorio), `label: string`, `onClick?: () => void`. Alto `h-7` (28 px), `px-sp-12 py-sp-4`, `rounded-pill`, `text-label`.
   - `destacado`: `bg-accent-lime text-text-primary`, no interactivo, renderiza `<span>`.
   - `neutro`: `bg-surface-subtle text-text-secondary`, no interactivo, `<span>`.
   - `seleccionado`: `bg-action-primary text-action-on-primary`, `<button type="button" aria-pressed="true">`.
   - `sin-seleccionar`: `border border-border-strong bg-surface-panel text-text-primary`, `<button type="button" aria-pressed="false">`.
   - Los dos interactivos reciben el foco de `Button` (`focus-visible`).
6. **Barrel.** Exportar `Button`, `Chip`, `EstadoBadge`, `BADGE_ESTADOS`, y los tipos `BadgeEstado`, `ButtonProps`, `ChipProps`.
7. **GREEN.** Ejecutar tests, typecheck y lint del workspace.

## 7. Contrato con el back

No aplica. El componente no llama al back. Su contrato con el back es la lista de nueve literales de `BADGE_ESTADOS`, que T-10 mapea desde los valores de cada enum (`convenciones-transversales.md §8.2`).

## 8. Contenido de UI

- `EstadoBadge`: los nueve textos son literales del diseño: `Pendiente`, `Vigente`, `Suspendida`, `Cancelada`, `Vencida`, `Pagada`, `Anulada`, `Validado`, `Pendiente CAE` (`design-system §5.4`).
- `Button`: el texto llega por `label`. Los textos de las pantallas (`Guardar cliente`, `Cancelar`, `Validar en Renaper`) los define cada pantalla y no van en el componente.
- `Chip`: el texto llega por `label`.

## 9. Estados y casos borde

**Badge (tokens por estado, de `design-system §5.4`):**

| Estado | Fondo | Texto |
|---|---|---|
| Pendiente | `bg-status-pendiente-bg` | `text-status-pendiente-text` |
| Vigente | `bg-status-vigente-bg` | `text-status-vigente-text` |
| Suspendida | `bg-status-suspendida-bg` | `text-status-suspendida-text` |
| Cancelada | `bg-status-cancelada-bg` | `text-status-cancelada-text` |
| Vencida | `bg-status-vencida-bg` | `text-status-vencida-text` |
| Pagada | igual a Vigente | igual a Vigente |
| Anulada | igual a Vencida | igual a Vencida |
| Validado | igual a Vigente | igual a Vigente |
| Pendiente CAE | igual a Suspendida | igual a Suspendida |

**Casos:**
- **Contraste de Suspendida y Pendiente CAE.** El par `#9a6400` sobre `#fbf0d6` da 4.42:1 y no cumple AA (`design-system §1.1`). Se implementa el token tal cual (FB7.8) y se registra como pedido a diseño en T-19.
- **Valor fuera de `BADGE_ESTADOS`.** TypeScript lo impide. En runtime, un valor inesperado no llega al componente: el mapeo de T-10 devuelve `null` y la pantalla no renderiza el badge. No hay fallback visual en este componente.
- **Button `type`.** Por defecto `"button"`, para que un botón dentro de un `<form>` no envíe el formulario sin querer (por ejemplo "Validar en Renaper" en B4). Para enviar, la pantalla pasa `type="submit"` explícitamente.
- **Button deshabilitado.** `disabled` bloquea el clic y el foco. La pantalla lo deshabilita mientras corre una mutación (FC11).
- **Button con `icon` y sin `label`.** No se permite: `label` es obligatorio. Un botón solo con ícono necesita `aria-label` y se resuelve en la pantalla que lo use (por ejemplo la campana de B2); no es parte de esta tarea.
- **Chip `destacado` y `neutro`.** No son botones: no tienen `onClick` ni foco. Pasar `onClick` a uno de ellos se ignora sin error (ver D-T05-4).
- **Chip seleccionable sin `onClick`.** Renderiza `<button>` igual, con `aria-pressed` correcto. Sirve para chips solo visuales dentro de un grupo que maneja el clic en el padre.

## 10. Tests requeridos

Herramientas: Vitest + Testing Library + `vitest-axe`.

| Test | Qué afirma |
|---|---|
| `Button: variante primary usa action-primary` | Clases `bg-action-primary` y `text-action-on-primary` |
| `Button: tamaño M tiene 40 px y S tiene 32 px` | Clases `h-10` en M y `h-8` en S; tipografía `text-body` en M y `text-label` en S |
| `Button: tipo por defecto button` | `getByRole("button")` tiene `type="button"` |
| `Button: type submit explícito` | Con `type="submit"` el atributo cambia |
| `Button: ícono decorativo oculto` | El `span` del ícono tiene `aria-hidden="true"` |
| `Button: disabled bloquea el clic` | `onClick` no se llama cuando `disabled` |
| `Button: foco visible con focus-visible` | Clases `focus-visible:outline-2` y `focus-visible:outline-action-primary` presentes |
| `Button: sin violaciones de accesibilidad` | `axe` sobre Primary, Secondary y Ghost sin violaciones |
| `Chip: destacado y neutro son span no interactivos` | No hay `button`; tienen clases `bg-accent-lime` y `bg-surface-subtle` |
| `Chip: seleccionado es button con aria-pressed true` | Rol `button`, `aria-pressed="true"`, clase `bg-action-primary` |
| `Chip: sin-seleccionar es button con aria-pressed false` | `aria-pressed="false"`, clase `border-border-strong` |
| `Chip: onClick se llama al hacer clic en seleccionado` | `onClick` se invoca una vez |
| `Chip: tipo obligatorio en el tipo` | Un `@ts-expect-error` sin `tipo` falla en `typecheck` |
| `EstadoBadge: muestra el literal del estado` | Para cada uno de los nueve valores, el texto visible es el valor |
| `EstadoBadge: Pagada usa los colores de Vigente` | Las clases de `Pagada` son iguales a las de `Vigente` |
| `EstadoBadge: Anulada usa los colores de Vencida` | Idem para Vencida |
| `EstadoBadge: Pendiente CAE usa los colores de Suspendida` | Idem para Suspendida |
| `BADGE_ESTADOS tiene nueve valores exactos` | Igualdad con la lista de la sección 6 (orden incluido) |
| `EstadoBadge: sin violaciones de accesibilidad` | `axe` sobre los nueve estados sin violaciones |

## 11. Criterios de aceptación

1. `Button`, `Chip`, `EstadoBadge`, `BADGE_ESTADOS` y los tipos `BadgeEstado`, `ButtonProps`, `ChipProps` se exportan desde `packages/ui/src/index.ts`.
2. `Button` renderiza `type="button"` por defecto.
3. `Button` M mide 40 px (`h-10`) y S mide 32 px (`h-8`).
4. Las tres variantes de `Button` usan los tokens de `design-system §5.1`.
5. El ícono de `Button` está dentro de un contenedor con `aria-hidden="true"`.
6. `Chip` exige `tipo`: un test `@ts-expect-error` lo verifica en typecheck.
7. `Chip` `seleccionado` y `sin-seleccionar` son `<button>` con `aria-pressed` correcto; `destacado` y `neutro` no son botones.
8. `BADGE_ESTADOS` contiene exactamente los nueve literales de `design-system §5.4`, en ese orden.
9. `EstadoBadge` muestra el literal del estado como texto visible, sin ícono.
10. Los nueve estados tienen clases de fondo y texto de tokens (`ESTADO_BADGE_TOKENS` cubre los nueve).
11. `EstadoBadge` implementa Pagada, Anulada, Validado y Pendiente CAE con los colores de Vigente, Vencida, Vigente y Suspendida, respectivamente.
12. `axe` no reporta violaciones en Button, Chip ni EstadoBadge.
13. `npm run test`, `npm run typecheck` y `npm run lint` del workspace `@nexa/ui` pasan.

## 12. Verificación manual

Sin prueba manual en esta tarea: no hay pantalla. La revisión visual de Button, Chip y Badge ocurre en US-FE-B-01 (Button) y US-FE-B-07 (Badge con Validado y Vigente, `B5 §4`).

## 13. Decisiones pendientes

- **D-T05-1. Estilo deshabilitado de Button.** `design-system §9` item 7 dice que Figma no diseña el estado Disabled de Button. Default propuesto: `opacity-50` y cursor de no permitido. Pendiente con diseño.
- **D-T05-2. `tipo` de Chip obligatorio.** `design-system §5.5` marca "default 'destacado' en el diseño". Default: sin valor por defecto, para no mostrar un chip destacado por omisión.
- **D-T05-3. Área de toque de 44 px en mobile.** `design-system §8.5` lo propone para Button, NavItem, Chip seleccionable y Bell. Default: no se aplica en esta tarea; lo decide T-19 con el resto de la accesibilidad.
- **D-T05-4. `onClick` en un chip no interactivo.** Default: se ignora. Alternativa: lanzar error de desarrollo. Se elige ignorar para no romper pantallas en runtime.
- **D-T05-5. Nombres del badge contra el enum del back.** `design-system §9` item 14 pide confirmarlos. `convenciones-transversales §8.2` ya confirma que los nueve nombres existen (en el back, con otros valores de wire). La confirmación queda hecha con la referencia; el mapeo de valores es de T-10.

## 14. Riesgos y errores comunes

- **Dos enums con el mismo nombre.** `Pendiente` existe en `EstadoPoliza`, `EstadoCuota` y `EstadoPago`, y `Vencida` en `EstadoPoliza` y `EstadoCuota`. El componente no conoce el dominio: el riesgo está en T-10. Este componente solo recibe el literal ya resuelto.
- **Badge de contraste insuficiente.** Suspendida y Pendiente CAE no cumplen AA. No cambiar el color por cuenta propia (FB7.8).
- **`type` omitido en un formulario.** Sin el default `"button"`, un botón dentro de `<form>` envía el formulario. El test de tipo lo cubre.
- **`aria-pressed` en un chip de filtro sin estado.** Si la pantalla no controla `tipo`, el chip queda siempre igual. La pantalla es responsable de cambiar `tipo` al hacer clic.
- **Clases dinámicas de Tailwind.** Construir clases con interpolación (`bg-${color}`) no se genera en el build. Todas las clases de esta tarea están escritas completas en `estados.ts` y en los componentes.

## 15. Definición de terminado

- `npm run test`, `npm run typecheck`, `npm run lint` en verde en `@nexa/ui`.
- Los 19 tests de la sección 10 pasan, con el RED inicial anotado.
- Criterios de la sección 11 con evidencia.
- `BADGE_ESTADOS` revisado contra la lista de `design-system §5.4`.
- Sin secretos.
- Diff revisado: solo archivos de la sección 5.

## 16. Observaciones al índice

- Resuelto (RV-D07): `EstadoBadgeValue` lo define T-10 en `@nexa/api` (`enums/badges.ts`). T-05 define su propia unión de nueve literales (`BADGE_ESTADOS`) y una prueba en una app compara ambos arrays. Ninguna ficha importa a la otra.
- Resuelto (triage final, default de la ficha): Badge/Pendiente en B5: `pantallas/B5-ficha-cliente.md §4` dice que `Badge/Pendiente` existe en B3. El design system lo define como `Pendiente` dentro de `Badge/Estado` (`design-system §5.4`). No hay conflicto de componente, pero el nombre del nodo de Figma difiere. Sin acción en esta tarea. (No figura en REVISION ni en FB8.)
