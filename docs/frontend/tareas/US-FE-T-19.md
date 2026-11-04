# US-FE-T-19: Accesibilidad transversal

Tipo T · Oleada 2 · Tamaño S · Rama sugerida `feature/US-FE-T-19-a11y-harness` · Tarjeta Trello `US-FE-T-19`

## 1. Objetivo

Dejar un harness de accesibilidad reutilizable (`vitest-axe`) que cualquier pantalla o primitivo pueda llamar en sus tests, una checklist de revisión por pantalla derivada de `analisis-front.md §9.2` y un registro en test de los pares de color que no cumplen AA, para que el pedido a diseño quede trazado. Al terminar, un test de pantalla puede escribir `await expectSinViolacionesA11y(container)` y el equipo sabe qué revisar a mano en cada pantalla.

Lo usan todas las pantallas B-NN y W-NN (FC8). Los primitivos (T-04 a T-07, T-15) usan `vitest-axe` directo (RV-49).

No cambia ningún color (FB7.8).

## 2. Alcance

**Entra**
- Helper `expectSinViolacionesA11y(elemento, opciones?)` en `packages/ui/src/testing/a11y.ts`, sobre `vitest-axe`.
- Uso del subpath de exportación `@nexa/ui/testing`, declarado por US-FE-T-01 (ver sección 13, decisión 1).
- Un test del propio helper: pasa con markup accesible y falla con un `<img>` sin `alt`.
- Test de pares de color: `packages/ui/src/testing/contraste.test.ts`, con los pares de design-system §8.1 y §1.1.
- Checklist de revisión manual por pantalla (sección 10.2), en la descripción de este documento y replicada en la tarjeta de Trello.

**NO entra**
- Cambios de colores o tokens: US-FE-T-03 y diseño (FB7.8).
- Los tests a11y de cada componente: lo agrega cada tarea de primitivo o pantalla con el helper.
- `packages/config` (Vitest): US-FE-T-02. Este helper no requiere cambios de configuración: extiende `expect` al importarse.
- Registro en `docs/frontend/pedidos-al-back.md`: lo mantiene el equipo de docs en un PR aparte (ver sección 16).

## 3. Dependencias

- **Depende de:** US-FE-T-04, US-FE-T-05, US-FE-T-06, US-FE-T-07.
- **Oleada:** 2.
- **Puede empezar sin esperar a:** Nada.
- **Prerrequisitos de rebase (RV-D02, no son dependencia):** T-01 (`vitest-axe` y `@testing-library/jest-dom` instalados, FC17) y T-02 (configuración de Vitest).
- **Bloqueada por pedidos al back (PB-NN):** ninguno.
- **Workaround MSW (FB7.7):** no aplica.

## 4. Documentos a leer

- `docs/frontend/analisis-front.md`: §8.1 (herramientas), §8.3 (cobertura mínima por tipo de tarea), §9.1 (contrastes que fallan), §9.2 (requisitos de accesibilidad, la lista a verificar).
- `docs/frontend/design-system.md`: §1.1 (pares texto/fondo por estado), §8.1 (tabla de pares problemáticos con ratio), §8.3 (foco visible), §8.5 (tamaños táctiles), §8.6 (idioma e íconos decorativos).
- `docs/frontend/00-decisiones-base.md`: FB1 (Vitest, Testing Library), FB7.8 (contraste).
- `docs/frontend/tareas/INDEX.md`: FC5 (tests mínimos por tipo), FC8 (verificación antes del PR), FC16 (requisitos de accesibilidad).

## 5. Archivos a crear o modificar

Bajo `frontend/packages/ui/`:

| Archivo | Dueño | Notas |
|---|---|---|
| `src/testing/a11y.ts` | T-19 | Helper. `packages/ui/src/testing/*` es de T-19 (RV-20). |
| `src/testing/a11y.test.tsx` | T-19 | Test del helper. |
| `src/testing/contraste.ts` | T-19 | Función `ratioContraste(hexA, hexB)` (WCAG 2.x). |
| `src/testing/contraste.test.ts` | T-19 | Pares documentados. |

No se edita `packages/ui/package.json` (FC17, RV-20). El subpath `./testing` lo declara T-01. No se toca `src/index.ts` (el helper no se exporta desde el barrel de runtime).

## 6. Pasos de implementación

1. Confirmar que `vitest-axe` y `@testing-library/jest-dom` están instalados por T-01. Si no, pedirlo a T-01 (FC17).
2. Confirmar que el subpath `./testing` de `packages/ui/package.json` (`"exports"`, declarado por T-01) apunta a `src/testing/a11y.ts`. Si no, pedirlo a T-01. Sin ese subpath, el helper no es importable desde las apps.
3. Crear `src/testing/a11y.ts`:
   - Importar `axe` y `toHaveNoViolations` de `vitest-axe`, y `expect` de `vitest`.
   - Ejecutar `expect.extend({ toHaveNoViolations })` una sola vez al importar el módulo.
   - Exportar `async function expectSinViolacionesA11y(elemento: Element, opciones: { ignorar?: string[] } = {})`.
   - Dentro: `const resultado = await axe(elemento, { rules: { 'color-contrast': { enabled: false } } })` y luego `expect(resultado).toHaveNoViolations()`.
   - Motivo de desactivar `color-contrast`: jsdom no calcula estilos reales. El contraste se prueba en `contraste.test.ts`.
   - `opciones.ignorar` agrega reglas a `rules` con `enabled: false`. Cada uso debe justificarse en un comentario en el test que lo usa.
4. Crear `src/testing/contraste.ts` con `ratioContraste(a: string, b: string): number` (hexadecimal de 6 dígitos, fórmula WCAG de luminancia relativa, redondeo a dos decimales).
5. Crear `src/testing/contraste.test.ts` con la tabla de la sección 10.1. Cada fila afirma el ratio documentado y el resultado AA (`cumple: boolean`).
6. Crear `src/testing/a11y.test.tsx` (ver sección 10).
7. Verificar que el helper no entra en el bundle de las apps: `npm run build` de `apps/backoffice` y `apps/web-publica` no debe incluir `axe-core` (buscar la cadena `axe` en `dist/` con `rg`).
8. Escribir en la descripción del PR la lista de pedidos a diseño (sección 10.1, filas con `cumple: false`) y registrarla en `docs/frontend/design-system.md` §9 (RV-D25).

## 7. Contrato con el back

No aplica.

## 8. Contenido de UI

No aplica. Ningún texto de pantalla cambia.

## 9. Estados y casos borde

- **Elemento vacío:** `expectSinViolacionesA11y` sobre un contenedor sin hijos pasa.
- **Regla desactivada en `opciones.ignorar`:** el test que la usa debe tener un comentario con la razón. Sin razón, el PR no pasa revisión.
- **`color-contrast` en jsdom:** siempre deshabilitada en el helper; la cobertura de contraste está en `contraste.test.ts`.
- **Componentes con portal (dialog):** el helper debe recibir el nodo del portal, no el `document` completo, salvo que el test lo necesite.

## 10. Tests requeridos

### 10.1 Pares de color (`contraste.test.ts`)

Un test por fila. Los valores son los de design-system §8.1 y §1.1. El test afirma que el ratio calculado coincide con el documentado (±0,01) y que `cumple` coincide con AA (4,5:1 texto normal, 3:1 componente no textual).

| Par | Uso | Ratio documentado | Cumple AA |
|---|---|---|---|
| `text/tertiary` (#8A8E93) sobre `surface/panel` (#FFFFFF) | Helper de Input y Select, caption de footer | 3.30 | No |
| `text/tertiary` sobre `surface/sidebar` (#F5F5F2) | Rol en Sidebar | 3.02 | No |
| `status/suspendida/text` (#9A6400) sobre `status/suspendida/bg` (#FBF0D6) | Badge Suspendida | 4.42 | No |
| `border/strong` (#D3D5CE) sobre `surface/panel` | Borde de Input y Select | 1.48 | No (1.4.11) |
| `status/cancelada/text` sobre panel | Borde y helper de error | 6.02 | Sí |
| `action/primary` sobre panel | Foco de Input y Select | 17.61 | Sí |
| `text/primary` sobre `accent/lime` | Chip Destacado | 13.54 | Sí |
| `action/on-primary` sobre `action/primary` | Botón primario | 17.61 | Sí |

Los valores hexadecimales de cada token se copian de `design-system.md §1` y `§8.1`. Si T-03 cambia un token, el test falla y obliga a actualizar esta tabla.

### 10.2 Helper (`a11y.test.tsx`)

| Test | Afirma |
|---|---|
| `pasa con un botón con texto` | `expectSinViolacionesA11y` no lanza. |
| `falla con un img sin alt` | Dentro de `expect(...).rejects`, el helper lanza. Prueba que el harness detecta errores. |
| `falla con un input sin label` | Mismo patrón. |
| `ignora solo las reglas listadas en opciones.ignorar` | Con `ignorar: ['region']` un `<main>` faltante no hace fallar; sin `ignorar` sí. |

### 10.3 Checklist de revisión manual por pantalla

Revisar en cada pantalla antes del PR (FC8). Cada ítem sale de `analisis-front.md §9.2`:

1. Labels visibles asociados a cada campo (`htmlFor`/`id`); ningún placeholder usado como label.
2. Error de campo con `aria-invalid="true"` y `aria-describedby` apuntando al mensaje específico.
3. Alerta de resultado con `role="alert"` (o `aria-live`).
4. Foco inicial según la pantalla: primer campo con error, o `h1` (W5 y W6 al `h1`; B4 y B1 al campo tras error).
5. Tablas con `<th scope="col">` y `<caption>`.
6. Pestañas con `tablist`, `tab` y `tabpanel` (B5).
7. Diálogo de baja con `role="alertdialog"` y foco inicial en Cancelar (B5).
8. Íconos decorativos con `aria-hidden="true"`; botones solo con ícono con `aria-label`.
9. Foco visible en todos los interactivos (anillo de 2 px).
10. `lang="es"` en el `<html>` de la app.
11. Estado nunca comunicado solo por color (texto o ícono acompañante).
12. Sin scroll horizontal de página en 390 px.

## 11. Criterios de aceptación

1. `expectSinViolacionesA11y` está disponible desde `@nexa/ui/testing`.
2. El helper falla con un `img` sin `alt` (test de la sección 10.2).
3. `color-contrast` está deshabilitada solo dentro del helper, con comentario que explica por qué.
4. La tabla de la sección 10.1 tiene una fila por par y todas pasan.
5. Ningún color ni token cambió en el diff (`git diff` sin cambios en `tokens.css` ni en `design-system.md`).
6. `axe-core` no aparece en `dist/` de las apps (verificado con `rg` después de `build`).
7. La checklist de la sección 10.3 está en la descripción de este documento y en la tarjeta de Trello.
8. `npm run lint`, `npm run typecheck` y `npm run test` del paquete en verde.

## 12. Verificación manual

1. Abrir la lista de pares de la sección 10.1 y comparar con `design-system.md §8.1`. Esperado: mismos valores y mismo veredicto.
2. Romper a propósito un `label` en un test de prueba temporal. Esperado: el helper falla. Revertir antes del commit.
3. `npm run build` y `rg -c "axe" apps/web-publica/dist` (y el de backoffice). Esperado: cero coincidencias de la librería.

Confirmar con el equipo antes del PR (`docs/workflow.md`, regla 7).

## 13. Decisiones pendientes (con default)

1. **Subpath `@nexa/ui/testing`:** default: T-01 lo declara en `packages/ui/package.json`. Alternativa: exportar desde `src/index.ts`, pero eso mete `vitest` y `axe-core` en el barrel de runtime. Se descarta.
2. **Regla `color-contrast` en jsdom:** default: deshabilitada en el helper; la cobertura es la tabla de pares.
3. **Pedido de contraste a diseño:** default (RV-D25): los pares con `cumple: false` se registran en `docs/frontend/design-system.md` §9 y van a la descripción del PR. `pedidos-al-back.md` queda para el back. FB7.8: no se cambia ningún color.
4. **Umbral para componentes no textuales:** default 3:1 (WCAG 1.4.11).

## 14. Riesgos y errores comunes

- **Pasar `document` al helper en un test de página con portal:** el resultado incluye nodos fuera de la pantalla. Pasar el contenedor.
- **Confiar en el test de accesibilidad como única revisión:** axe no ve foco, orden de lectura ni texto de error específico. La checklist de la sección 10.3 cubre esos puntos.
- **Usar `ignorar` para "pasar" un test:** prohibido sin justificación escrita.
- **Cambiar un color para que pase el test de contraste:** prohibido (FB7.8). El test se actualiza solo si el token cambió en el diseño.
- **Importar `@nexa/ui/testing` en código de producción:** rompe el bundle. Solo en `*.test.*`.

## 15. Definición de terminado

- `lint`, `typecheck` y `test` en verde en `packages/ui`.
- `build` de las apps sin `axe-core` en el bundle.
- Accesibilidad: helper probado con un caso que falla y uno que pasa.
- Criterios 1 a 8 de la sección 11 tildados con evidencia observada.
- Sin secretos ni datos de muestra.

## 16. Observaciones al índice

- Resuelto (RV-D25 / D-38): los pedidos de contraste y de diseño se registran en `design-system.md` §9; `pedidos-al-back.md` queda para el back.
- Resuelto (RV-20): `packages/ui/src/testing/*` es de T-19 (fila del INDEX). T-19 no edita `packages/ui/package.json`; el subpath lo declara T-01.
- Resuelto (RV-49 / RV-04): la dependencia de §3 es la de la fila del INDEX (T-04 a T-07, primer uso del helper en pantallas). Los primitivos usan `vitest-axe` directo.
