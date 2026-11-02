# US-FE-T-18: Web: PublicNav, PublicFooter y PublicLayout

Tipo T · Oleada 2 · Tamaño S · Rama sugerida `feature/US-FE-T-18-public-layout` · Tarjeta Trello `US-FE-T-18`

## 1. Objetivo

Dejar listo el marco visual de la web pública: la barra superior `PublicNav` (72 px), el pie `PublicFooter` con los datos de contacto "A confirmar" como texto fijo, y `PublicLayout`, que los compone alrededor de un `Shell` blanco sobre el `Backdrop`. Al terminar, cualquier ruta de `apps/web-publica` muestra el marco con navegación y pie, y las pantallas W-01 a W-08 solo deben poner contenido dentro de `<main>`.

Lo usan: US-FE-W-01 a W-08 (todas van dentro de este layout).

## 2. Alcance

**Entra**
- `packages/ui/src/components/PublicNav/PublicNav.tsx` y `index.ts` del componente.
- `packages/ui/src/components/PublicFooter/PublicFooter.tsx` y `index.ts` del componente.
- Bloque de exports de ambos en `packages/ui/src/index.ts` (cada primitivo agrega su bloque, INDEX).
- `apps/web-publica/src/app/layouts/PublicLayout.tsx`: reemplaza el stub de US-FE-T-17. Compone `Backdrop` y `Shell` (ambos de `@nexa/ui`, US-FE-T-07, RV-D06), `PublicNav`, `<main>` con `<Outlet />` y `PublicFooter`.
- Tests de los tres componentes (sección 10).

**NO entra**
- Pantallas, contenido de `<main>`, `TablaPlanes`, `HeroPublico`, `MedioDePagoCard`: US-FE-W-01 en adelante.
- Matriz de coberturas, menú mobile con destino real: NO DEFINIDO (sección 13).
- Accesibilidad en tests: `vitest-axe` directo (RV-49, FC8). El helper de pantallas de US-FE-T-19 no se importa en esta tarea.
- Router: US-FE-T-17 (no se toca `router.tsx`).
- Tokens, preset de Tailwind y fuentes: US-FE-T-03. Este archivo solo usa sus nombres.
- `Logo/Nexa`: lo entrega US-FE-T-07 en `@nexa/ui`; `PublicNav` lo importa.

## 3. Dependencias

- **Depende de:** US-FE-T-07, US-FE-T-17.
- **Oleada:** 2.
- **Puede empezar sin esperar a:** US-FE-W-02.
- **Bloqueada por pedidos al back (PB-NN):** ninguno.
- **Workaround MSW (FB7.7):** no aplica. El layout no hace requests.

## 4. Documentos a leer

- `docs/frontend/design-system.md`: §5.7 (Logo/Nexa), §5.10 (PublicNav, props y anatomía), §5.11 (PublicFooter, props y anatomía), §5.15 (Shell), §7.3 (Estructura Shell de la web pública W3), §7.4 (breakpoints, propuesta), §8.3 (foco visible), §8.5 (tamaños táctiles).
- `docs/frontend/pantallas/W1-inicio.md`: §3 puntos 1 (barra de navegación) y 7 (footer), §5 (textos literales de nav y footer), §8 (destinos de navegación), §11 (responsive, propuesta), §12 (accesibilidad).
- `docs/frontend/analisis-front.md`: §9.2 (requisitos de accesibilidad), §3.4 (qué vive en `@nexa/ui`).
- `docs/frontend/00-decisiones-base.md`: FB7.8 (contraste: se implementan los tokens como están), FC16 (accesibilidad).
- `docs/frontend/tareas/INDEX.md`: convenciones FC15 (textos en español del Figma), FC16, y la fila de US-FE-T-18.

## 5. Archivos a crear o modificar

| Archivo | Dueño | Notas |
|---|---|---|
| `frontend/packages/ui/src/components/PublicNav/PublicNav.tsx` | T-18 | Ownership del INDEX (RV-09). |
| `frontend/packages/ui/src/components/PublicNav/index.ts` | T-18 | |
| `frontend/packages/ui/src/components/PublicFooter/PublicFooter.tsx` | T-18 | |
| `frontend/packages/ui/src/components/PublicFooter/index.ts` | T-18 | |
| `frontend/packages/ui/src/index.ts` | T-03 (dueño); T-18 agrega su bloque | Solo un bloque `export { PublicNav } ...` y `export { PublicFooter } ...`. |
| `frontend/packages/ui/src/components/PublicNav/PublicNav.test.tsx` | T-18 | |
| `frontend/packages/ui/src/components/PublicFooter/PublicFooter.test.tsx` | T-18 | |
| `frontend/apps/web-publica/src/app/layouts/PublicLayout.tsx` | T-18 (reemplaza el stub de T-17) | Contiene la constante de contacto. Importa `Shell` de `@nexa/ui` (RV-D06). |
| `frontend/apps/web-publica/src/app/layouts/PublicLayout.test.tsx` | T-18 | |

No se crea `Shell` en esta tarea: vive en `@nexa/ui` (T-07, RV-D06).

## 6. Pasos de implementación

1. Verificar que `Backdrop`, `Shell` y `Logo/Nexa` se exportan de `@nexa/ui` (US-FE-T-07, RV-D06). Si no, detener y pedirlo a T-07.
2. `PublicNav`: implementar la anatomía de design-system §5.10 con las props `links`, `ctaLabel`, `ctaHref` (ver sección 7). Altura 72 px, padding horizontal 24 px, gap 32 px, alineado al centro vertical. Usar `<header>` con `<nav aria-label="Principal">` alrededor de los links.
3. `PublicNav`, mobile: en viewport menor a 768 px, ocultar los links y el botón primario, y mostrar un botón de ícono `icon/list` con `aria-label` y `aria-expanded`. Al activarlo, mostrar los mismos links apilados (sección 13, decisión 2).
4. `PublicFooter`: implementar design-system §5.11 con las props `contacto` y `copyright`. Usar `<footer>` y aceptar un `id` opcional para que el layout pueda anclar `#contacto`.
5. `PublicLayout`: en orden, `Backdrop` (fondo, posición absoluta, ancho 100 % y alto al contenido de la página), luego `Shell` de `@nexa/ui` (fondo blanco, radio 24 px, sombra `Nexa/Shadow/Shell`, padding 24 px), dentro: `PublicNav`, `<main id="contenido">` con `<Outlet />`, y `PublicFooter` con `id="contacto"`.
6. Definir en `PublicLayout.tsx` la constante de contacto con las cuatro entradas de W1 §5 (ver sección 7) y pasarla a `PublicFooter`.
7. Pasar a `PublicNav` los links `{ label: 'Planes', href: '#planes' }` y `{ label: 'Contacto', href: '#contacto' }`, y `ctaLabel: 'Consultar póliza'`, `ctaHref: '/consultar-poliza'`.
8. Logo: el `Logo/Nexa` apunta a `/` (propuesta de W1 §8, sección 13).
9. Correr el test de accesibilidad con `vitest-axe` directo sobre el layout (RV-49, FC8; sección 10).
10. Verificar en 1440 px y en 390 px (sección 12).

## 7. Contrato con el back

No aplica: la tarea no toca API. Props de los componentes (propuestas de design-system §5.10 y §5.11, sin cambios de nombre):

```ts
// packages/ui/src/components/PublicNav/PublicNav.tsx
export interface PublicNavProps {
  links: ReadonlyArray<{ label: string; href: string }>;
  ctaLabel: string;   // 'Consultar póliza'
  ctaHref: string;    // '/consultar-poliza'
  logoHref?: string;  // default '/'
}

// packages/ui/src/components/PublicFooter/PublicFooter.tsx
export interface PublicFooterProps {
  contacto: ReadonlyArray<{ label: string; value: string }>;
  copyright: string;
  id?: string;
}

// apps/web-publica/src/app/layouts/PublicLayout.tsx (constante)
export const CONTACTO_PUBLICO = [
  { label: 'Teléfono', value: 'A confirmar' },
  { label: 'Email', value: 'A confirmar' },
  { label: 'Ubicación', value: 'Dirección a confirmar' },
  { label: 'Horarios', value: 'Lunes a viernes, horario a confirmar' },
] as const;
export const COPYRIGHT_PUBLICO = '© 2026 Nexa Seguros. Todos los derechos reservados.';
```

Los valores "A confirmar" son texto provisional de diseño, no contenido final (design-system §5.11, W1 §13 #10). No se reemplazan por valores de muestra.

## 8. Contenido de UI

Textos literales de W1 §5, copiados sin cambios:

| Ubicación | Texto |
|---|---|
| Nav, marca | `Nexa Seguros` (con monograma `N` en el logo) |
| Nav, links | `Planes`, `Contacto` |
| Nav, botón | `Consultar póliza` |
| Footer, etiquetas | `Teléfono`, `Email`, `Ubicación`, `Horarios` |
| Footer, valores | `A confirmar`, `A confirmar`, `Dirección a confirmar`, `Lunes a viernes, horario a confirmar` |
| Footer, copyright | `© 2026 Nexa Seguros. Todos los derechos reservados.` |

No hay texto fijo para el menú mobile ni para el botón de ícono; ver sección 13.

## 9. Estados y casos borde

- **Menú mobile cerrado** (default): links ocultos; botón con `aria-expanded="false"`.
- **Menú mobile abierto:** links visibles; botón con `aria-expanded="true"`. Tecla `Escape` lo cierra y devuelve el foco al botón.
- **Viewport ≥ 768 px:** links y botón primario visibles; botón de ícono oculto.
- **Sin links:** `PublicNav` renderiza solo logo y botón (no hay error si `links` está vacío).
- **Sin datos de contacto:** `PublicFooter` renderiza solo el copyright si `contacto` está vacío.
- **Foco:** todos los interactivos (logo, links, botón, botón de ícono) muestran `focus-visible` con anillo de 2 px y `outline-offset` de 2 px (design-system §8.3, propuesta). No quitar el outline sin reemplazo.
- **Tamaño táctil en mobile:** los interactivos tienen área mínima de 44 px (`min-h-11`, design-system §8.5, propuesta).

## 10. Tests requeridos

Vitest + Testing Library. Un test por regla de UI.

| Archivo | Test | Afirma |
|---|---|---|
| `PublicNav.test.tsx` | `muestra la marca y el monograma` | Texto `Nexa Seguros` visible y logo enlazado a `/`. |
| `PublicNav.test.tsx` | `renderiza los links con su href` | Un `<a>` por link con el `href` de la prop. |
| `PublicNav.test.tsx` | `el botón primario apunta a ctaHref` | Enlace `Consultar póliza` → `/consultar-poliza`. |
| `PublicNav.test.tsx` | `el menú mobile tiene aria-expanded y lo alterna` | Clic cambia `aria-expanded` de `false` a `true` y muestra los links. |
| `PublicNav.test.tsx` | `Escape cierra el menú mobile y devuelve el foco` | Foco vuelve al botón. |
| `PublicNav.test.tsx` | `no tiene violaciones de accesibilidad` | `vitest-axe` directo sobre el contenedor (RV-49). |
| `PublicFooter.test.tsx` | `muestra las cuatro etiquetas y sus valores` | Etiquetas y valores de `contacto` en orden. |
| `PublicFooter.test.tsx` | `muestra el copyright exacto` | Texto `© 2026 Nexa Seguros. Todos los derechos reservados.` |
| `PublicFooter.test.tsx` | `usa un footer con el id recibido` | Elemento `footer` con `id="contacto"`. |
| `PublicLayout.test.tsx` | `compone nav, main y footer dentro del shell` | Con `MemoryRouter`, existen `header`, `main#contenido` con el contenido de la ruta, y `footer#contacto`. |
| `PublicLayout.test.tsx` | `renderiza el contenido de la ruta dentro de main` | Ruta hija con texto de prueba aparece dentro de `main`. |

## 11. Criterios de aceptación

1. `PublicNav` mide 72 px de alto y usa padding horizontal de 24 px (verificado con clase/token, no con estilo inline).
2. `PublicNav` muestra `Nexa Seguros`, `Planes`, `Contacto` y `Consultar póliza` con el texto literal de W1 §5.
3. El botón primario apunta a `/consultar-poliza`.
4. En viewport menor a 768 px, el menú se controla con un botón con `aria-label` y `aria-expanded`.
5. `PublicFooter` muestra las cuatro etiquetas y los cuatro valores de la sección 7 sin cambiar el texto.
6. El copyright coincide carácter por carácter con W1 §5.
7. `PublicLayout` coloca `main#contenido` entre el nav y el footer, y renderiza `<Outlet />` dentro.
8. El layout no contiene ningún dato de muestra ni nombre de persona.
9. `PublicNav` y `PublicFooter` pasan `vitest-axe` directo (RV-49, FC8).
10. `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` del workspace y de la app en verde.

## 12. Verificación manual

1. Correr `npm run dev` de `apps/web-publica` y abrir `http://localhost:5174` a 1440 px. Esperado: barra superior de 72 px, `Consultar póliza` a la derecha, pie con cuatro bloques de contacto y copyright.
2. Reducir el ancho a 390 px. Esperado: links ocultos, botón de menú visible; al activarlo, aparecen los links; `Escape` cierra el menú.
3. Navegar con `Tab` por nav y pie. Esperado: anillo de foco visible en cada interactivo.
4. Confirmar que no hay scroll horizontal de página en 390 px.

Confirmar el resultado con el equipo antes del PR (`docs/workflow.md`, regla 7).

## 13. Decisiones pendientes (con default)

1. **Destino del logo, "Planes" y "Contacto":** NO DEFINIDO en Figma (W1 §8, §13 #7). Default: logo a `/`, `Planes` a `#planes`, `Contacto` a `#contacto` (propuestas de W1 §8).
2. **Menú mobile:** el Figma solo dibuja `icon/list` sin acción (INDEX T-18). Default de la ficha (RV-D21): el botón despliega los mismos links apilados. Texto del `aria-label`: NO DEFINIDO en Figma; default `Abrir menú` / `Cerrar menú` (cambia según el estado). Confirmar con diseño.
3. **Ancho de referencia mobile:** W1 no tiene frame mobile (W1 §11). Default: breakpoint de 768 px (design-system §7.4, propuesta), layout en una columna por debajo.
4. **Datos de contacto:** NO DEFINIDO (W1 §13 #10). Default: texto fijo "A confirmar" del diseño.
5. **Nombre de los tokens:** los nombres de clases o variables de color y radio se toman del preset que publique US-FE-T-03 (design-system §4). Si el nombre cambia allí, se ajusta aquí.

## 14. Riesgos y errores comunes

- **Poner los textos de contacto como constantes con valores reales inventados:** prohibido. Solo "A confirmar".
- **Usar `text/tertiary` para el texto del footer:** el contraste no cumple AA (design-system §8.1, 3.30:1). Usar lo que dice el diseño y registrar el pedido (FB7.8, `design-system.md` §9, RV-D25); no cambiar el color por cuenta propia.
- **Olvidar `aria-expanded` en el botón mobile:** lo detecta el test de accesibilidad.
- **Mover la lógica de navegación a `PublicLayout`:** el layout solo compone; el destino de cada link llega por props.
- **Editar `router.tsx`:** no es de esta tarea (ownership, US-FE-T-17).
- **Pantalla W-01 con su propio `<header>`:** duplicaría la barra. El contenido de W-01 empieza dentro de `<main>`.

## 15. Definición de terminado

- `lint`, `typecheck`, `test` y `build` en verde (workspace `packages/ui` y app `apps/web-publica`).
- Accesibilidad: `vitest-axe` aprobado en `PublicNav` y `PublicFooter` (RV-49); foco visible verificado en la sección 12.
- Sin secretos ni datos de muestra.
- Criterios 1 a 10 de la sección 11 tildados con evidencia observada.

## 16. Observaciones al índice

- Resuelto (RV-09): `PublicNav` y `PublicFooter` viven en `@nexa/ui` y su dueña es T-18 (`packages/ui/src/components/PublicNav/` y `PublicFooter/`, fila del INDEX).
- Resuelto (RV-D06): `Shell` vive en `@nexa/ui` (T-07). T-16 y T-18 lo importan; no hay `Shell` privado en esta tarea ni duplicado en `app/layouts`.
