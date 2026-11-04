# US-FE-T-03: `@nexa/ui`: tokens, preset Tailwind y fuentes

Tipo: T · Oleada: 0 · Tamaño: M · Rama sugerida: `feature/US-FE-T-03-tokens-preset` · Tarjeta Trello: `US-FE-T-03`

## 1. Objetivo

Al terminar, los valores del diseño existen en un único lugar del código: las variables CSS `--nexa-*` en `packages/ui/src/tokens.css` (39 variables), el preset de Tailwind `@nexa/config/tailwind/nexa.preset` que las expone como clases (`bg-surface-panel`, `text-h1`, `p-sp-12`, `rounded-input`, `bg-backdrop`, `shadow-shell`), y las fuentes Plus Jakarta Sans y JetBrains Mono instaladas localmente con `@fontsource`. Desde esta tarea, cualquier primitivo de `@nexa/ui` usa clases del preset y nunca hex ni valores de píxel sueltos. Para: T-04 a T-07 y todas las pantallas.

## 2. Alcance

**Entra:**
- `packages/ui/src/tokens.css`: las 39 variables de `design-system.md §1.2` (25 de color, 4 de radio, 10 de espaciado), con los valores exactos, e imports de las fuentes `@fontsource` al inicio del archivo.
- `packages/config/tailwind/nexa.preset.js`: preset CommonJS con el contenido de `design-system.md §4`.
- `packages/ui/src/index.ts`: reemplaza el stub de T-01 por el barrel vacío. Cada primitivo agrega su bloque de export (ownership del INDEX).
- Tests en `packages/ui/test/tokens.test.ts` y `packages/ui/test/preset.test.ts`.

**NO entra:**
- Primitivos (Input, Button, etc.): T-04 a T-07.
- `content` de Tailwind de cada app y el `tailwind.config.*` de cada app: T-14 (backoffice) y T-17 (web).
- Importar `tokens.css` en `main.tsx` de cada app: T-14 y T-17.
- Modo oscuro: el diseño no lo define (`design-system.md §1.2`).
- `index.html` con `<link>` a Google Fonts: no se agrega (ver decisión D-T03-2).

## 3. Dependencias

- **Puede empezar sin esperar a:** Nada.
- **Depende de:** — (rebase sobre T-01).
- **Bloqueada por pedidos al back (PB-NN):** —.
- **Workaround MSW (FB7.7):** no aplica.

## 4. Documentos a leer

- `docs/frontend/design-system.md`:
  - §0 (valores de partida confirmados).
  - §1 (tabla de tokens de color, §1.1 pares de contraste solo como referencia, §1.2 bloque CSS de variables).
  - §2.1 (familias y pesos) y §2.2 (los 10 estilos: nombres `text-display`, `text-h1`, `text-h2`, `text-h3`, `text-body`, `text-body-sm`, `text-label`, `text-caption`, `text-mono`, `text-mono-lg`).
  - §3.1 (espaciado), §3.2 (radios), §3.4 (sombra `Nexa/Shadow/Shell`), §3.5 (fondo backdrop: `to bottom right`).
  - §4 (preset completo: se copia tal cual, paso 3 de la sección 6).
- `docs/frontend/00-decisiones-base.md` FB1 (Tailwind 3.4 con los tokens en un preset compartido; sin estilos inline para valores del diseño) y FB7.2 (fuentes por `@fontsource`, local, sin CDN).
- `docs/frontend/tareas/INDEX.md`: fila US-FE-T-03 y ownership (`packages/config/tailwind/*` y `packages/ui/src/tokens.css` → T-03; `packages/ui/src/index.ts` → T-03).
- `docs/frontend/analisis-front.md` §3.4 (compartido).

## 5. Archivos a crear o modificar

Dueño de todos: US-FE-T-03.

| Archivo | Contenido |
|---|---|
| `frontend/packages/ui/src/tokens.css` | Imports de fuentes (`@import`, primeras líneas) y bloque `:root` con las 39 variables de `design-system §1.2` |
| `frontend/packages/config/tailwind/nexa.preset.js` | `module.exports = { theme: { extend: { ... } } }` tal como `design-system §4` |
| `frontend/packages/ui/src/index.ts` | Reemplaza el stub. Contenido: `export {};` y un comentario de una línea que indica que cada primitivo agrega su bloque |
| `frontend/packages/ui/test/tokens.test.ts` | Tests de variables CSS |
| `frontend/packages/ui/test/preset.test.ts` | Tests del preset (theme resuelto y generación de clases) |

**Imports de fuentes** (dentro de `tokens.css`, antes de `:root`):
- `@import "@fontsource/plus-jakarta-sans/400.css";` y los pesos `500`, `600` y `700`.
- `@import "@fontsource/jetbrains-mono/400.css";` y `500`.

Verificar la ruta exacta de cada archivo con `fd -t f "400.css" frontend/node_modules/@fontsource/plus-jakarta-sans` antes de escribir los imports. Si la ruta difiere, se corrige el import y se anota en el PR.

## 6. Pasos de implementación

1. **RED.** Escribir `tokens.test.ts` y `preset.test.ts` (sección 10). Ejecutar `npm run test --workspace @nexa/ui`: fallan porque `tokens.css` y el preset no existen. Anotar el resultado.
2. **`tokens.css`.** Copiar el bloque de `design-system.md §1.2` sin cambiar valores ni nombres (en minúscula, como está). Agregar los `@import` de fuentes arriba de todo, porque el CSS exige que `@import` vaya antes de cualquier regla.
3. **Preset.** Copiar `design-system.md §4` a `nexa.preset.js` sin cambios de nombres ni valores. Mantener `module.exports` (CommonJS, decisión D-T01-7). `require('tailwindcss/defaultTheme')` funciona porque `tailwindcss` está en la raíz.
4. **Barrel.** Reemplazar el stub de `packages/ui/src/index.ts` por `export {};` más el comentario de la sección 5.
5. **GREEN.** Ejecutar `npm run test --workspace @nexa/ui` y `npm run lint`.
6. **Verificación de no-regresión.** Buscar `googleapis` y `fonts.googleapis` en `frontend/packages` y `frontend/apps`: no debe haber resultados.

## 7. Contrato con el back

No aplica. No hay endpoints.

## 8. Contenido de UI

No aplica como texto. Los nombres de los 10 estilos tipográficos y de las 39 variables son identificadores técnicos (FB5): van en inglés o como los define el diseño (`text-h1`, `--nexa-surface-panel`), no se traducen.

## 9. Estados y casos borde

- **Valores exactos.** Un valor de token distinto del diseño es un defecto, aunque el contraste mejore. Ejemplo: `--nexa-status-suspendida-text: #9a6400` queda igual aunque no cumpla AA (4.42:1). El cambio es un pedido a diseño (FB7.8).
- **Backdrop.** `bg-backdrop` usa `linear-gradient(to bottom right, ...)`. No usar un ángulo fijo (`design-system §3.5`).
- **Sombra única.** `shadow-shell` es la única sombra del sistema. No se agregan otras sombras (`design-system §3.4`).
- **Espaciado extendido, no reemplazado.** Las claves son `sp-N`. `p-4` de Tailwind sigue siendo 16 px; no se reescribe la escala por defecto.
- **Modo oscuro.** No existe en el diseño. No se agrega `prefers-color-scheme` ni `data-theme`.
- **Fuentes sin CDN.** Ningún `<link>` a Google Fonts (FB7.2). Si `index.html` de una app lo trae, es un defecto que se corrige en T-14 o T-17.
- **Variable no usada.** `--nexa-accent-promo` existe, pero no hay componente que la use (`design-system §1`, uso "reservado"). Se define igual y no se elimina.

## 10. Tests requeridos

Herramienta: Vitest (jsdom por defecto de `packages/ui`). Lectura de archivos con `node:fs` y `node:path`.

| Test | Qué afirma |
|---|---|
| `tokens.css define las 39 variables de design-system §1.2` | Se extraen las declaraciones `--nexa-*` de `:root` y son exactamente 39 nombres |
| `cada variable tiene el valor exacto del diseño` | Comparación de cada variable contra una tabla en el test con los valores de `design-system §1.2` |
| `tokens.css importa las fuentes de @fontsource` | Existen los `@import` de `plus-jakarta-sans` 400, 500, 600, 700 y `jetbrains-mono` 400, 500 |
| `tokens.css no referencia Google Fonts` | `tokens.css` no contiene `googleapis` |
| `preset: colores semánticos resuelven a var(--nexa-*)` | `theme.colors.surface.panel === 'var(--nexa-surface-panel)'` y lo mismo para `text.primary`, `status.cancelada.text` |
| `preset: espaciado sp-N` | `theme.spacing['sp-12'] === '12px'` y `sp-64 === '64px'` |
| `preset: tipografía con line-height y peso` | `theme.fontSize.h1` es `['28px', { lineHeight: '34px', fontWeight: '600', letterSpacing: '0' }]` |
| `preset: radios y sombra` | `theme.borderRadius.input === '12px'`, `theme.boxShadow.shell === '0px 24px 60px 0px rgba(60, 70, 40, 0.1)'` |
| `preset: backdrop con to bottom right` | `theme.backgroundImage.backdrop` contiene `to bottom right` |
| `preset genera bg-surface-panel` | Tailwind con el preset sobre `<div class="bg-surface-panel">` produce `background-color: var(--nexa-surface-panel)` |
| `preset genera p-sp-12 y text-h1` | El CSS generado contiene `padding: 12px` (en la clase `p-sp-12`) y `font-size: 28px` (en `text-h1`) |
| `preset genera bg-backdrop` | El CSS generado contiene `linear-gradient(to bottom right, var(--nexa-bg-backdrop-start), var(--nexa-bg-backdrop-end))` |

## 11. Criterios de aceptación

1. `packages/ui/src/tokens.css` existe y declara exactamente 39 variables `--nexa-*` dentro de `:root`.
2. Cada una de las 39 variables tiene el valor exacto de `design-system.md §1.2` (test `cada variable tiene el valor exacto`).
3. `tokens.css` importa Plus Jakarta Sans (400, 500, 600, 700) y JetBrains Mono (400, 500) desde `@fontsource`.
4. `tokens.css` no contiene `googleapis` y ningún archivo de `frontend/` lo contiene.
5. `packages/config/tailwind/nexa.preset.js` coincide con `design-system.md §4` en nombres de clave y valores (test `theme`).
6. El preset genera `background-color: var(--nexa-surface-panel)` para `bg-surface-panel` (test de generación).
7. El preset genera `padding: 12px` para `p-sp-12` y `font-size: 28px` para `text-h1`.
8. El preset genera el degradado `to bottom right` para `bg-backdrop`.
9. `packages/ui/src/index.ts` exporta solo el barrel vacío (`export {};`) y el comentario, sin primitivos.
10. `npm run test` en `packages/ui` pasa con los 12 tests de la sección 10.
11. `npm run lint` y `npm run typecheck` pasan.
12. Ningún archivo de `apps/` cambió en esta tarea.

## 12. Verificación manual

Sin prueba manual: no hay pantalla en esta tarea. La comprobación visual de tokens y fuentes ocurre en US-FE-T-04 (Input) y en US-FE-T-14 (scaffold backoffice, donde se ve la fuente cargada).

## 13. Decisiones pendientes

- **D-T03-1. Ruta de `tokens.css` (resuelta).** `design-system.md §1.2` propone `frontend/packages/ui/src/styles/tokens.css`. El INDEX (ownership y fila de T-03) fija `packages/ui/src/tokens.css`. Se usa la ruta del INDEX, porque el INDEX es la fuente de ownership. Corregir la ruta en `design-system §1.2` en el PR de esta tarea o en un PR `docs/` aparte.
- **D-T03-2. Fuentes (resuelta).** `design-system.md §2.1` propone cargar Google Fonts con `<link>`. FB7.2 (que manda) dice `@fontsource` local, sin CDN. Se usa `@fontsource`. `design-system §2.1` queda como referencia no implementada.
- **D-T03-3. Import de `tokens.css`.** Default: no se importa desde `index.ts`. Cada app lo importa en su entrada (`import '@nexa/ui/tokens.css'` en `main.tsx`, T-14 y T-17). Así el barrel no tiene efectos secundarios de CSS.
- **D-T03-4. `content` del preset.** El preset no define `content` (`design-system §4`, nota de uso). Cada app lo define sobre `src/**` y `../../packages/ui/src/**`. Ownership en T-14 y T-17 (`tailwind.config.*`, ver T-01 D-T01-6).
- **D-T03-5. Accent promo sin uso.** Default: definida y sin componente que la use (ver sección 9).

## 14. Riesgos y errores comunes

- **Orden de `@import` en CSS.** Un `@import` después de una regla se ignora en silencio: las fuentes no cargan y el texto usa la fuente del sistema. Verificar que los `@import` son las primeras líneas.
- **Nombres de archivo de `@fontsource`.** Cambian según la versión del paquete. Verificar las rutas antes de escribir (sección 5).
- **Preset CommonJS desde código ESM.** Las apps (ESM) importan el preset con `import preset from '@nexa/config/tailwind/nexa.preset'`, y Node lo convierte. Si una herramienta no lo resuelve, la mitigación es `require` desde el `tailwind.config.js` de la app. No cambiar el preset a ESM sin acordarlo (D-T01-7).
- **Tailwind 4.** Tailwind 4 cambia la forma de configuración y el preset deja de aplicar. FB1 fija 3.4. No actualizar.
- **Valor copiado con error.** Un hex mal copiado no rompe nada visible, pero rompe el contraste y la consistencia. El test de valores exactos está para eso: no bajar el test.
- **Forma de `fontSize` con objeto.** El preset usa `[tamaño, { lineHeight, fontWeight, letterSpacing }]`. Si `theme.fontSize.h1` no tiene esa forma en la versión instalada de Tailwind 3.4, el test de la sección 10 lo muestra; corregir el preset al formato que Tailwind 3.4 documenta (verificar en su README local), no el test.

## 15. Definición de terminado

- `npm run test`, `npm run lint`, `npm run typecheck` en verde desde `frontend/`.
- Los 12 tests de la sección 10 pasan, con su RED inicial anotado.
- Criterios de la sección 11 con evidencia.
- `rg googleapis frontend` sin resultados.
- Sin secretos ni rutas absolutas en los archivos.
- Diff revisado: solo los cinco archivos de la sección 5.

## 16. Observaciones al índice

- Resuelto (RV-60): la ruta de `tokens.css` es `packages/ui/src/tokens.css`, como fija el INDEX, y no `src/styles/`. La corrección de `design-system.md` §1.2 va en el PR de documentación aparte (D-T03-1).
- Resuelto (RV-60): las fuentes son `@fontsource` locales (FB7.2), no Google Fonts. `design-system.md` §2.1 queda como referencia no implementada (D-T03-2).
- Resuelto (RV-23): `apps/*/tailwind.config.*` y el `content` de Tailwind son de T-14 (backoffice) y T-17 (web) (D-T03-4).
- ABIERTO: Pendiente de diseño, no del INDEX: `design-system §9` item 17 pide confirmar la licencia de las fuentes. Esta tarea usa SIL OFL (declarado en `design-system §2.1`), sin cambio. (No figura en REVISION ni en FB8.)
