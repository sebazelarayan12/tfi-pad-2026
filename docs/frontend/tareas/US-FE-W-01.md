# US-FE-W-01: Inicio público: hero, planes, cómo pagar y footer

Tipo W · Oleada 4 · Tamaño S · Rama sugerida `feature/US-FE-W-01-inicio-publico` · Tarjeta Trello `US-FE-W-01`

## 1. Objetivo

Al terminar, `/` (web pública, sin login) muestra el hero con el CTA a la consulta de póliza, la sección "Planes" (componente `TablaPlanes` de US-FE-W-02) y la sección "Cómo pagar" con dos tarjetas, dentro del `PublicLayout` de US-FE-T-18. Para el cliente anónimo que llega al sitio. La pantalla no escribe datos, no guarda nada y no tiene formularios.

## 2. Alcance

**Entra**
- Feature `inicio` de la web pública (`apps/web-publica`): `routes.tsx` (ruta `/`), `index.ts`, `pages/InicioPage.tsx`, componentes del hero, de la sección planes y de "Cómo pagar".
- Composición de `TablaPlanes` importada desde `features/planes/index.ts` (regla FB3 1).
- Textos literales de W1 (sección 8 de este archivo) y el marcador de imagen del hero.

**NO entra**
- `TablaPlanes` y el hook de planes: lo hace US-FE-W-02.
- `PublicLayout`, `PublicNav`, `PublicFooter`: los hace US-FE-T-18. W-01 se monta dentro de ese layout.
- Imagen real del hero (pedido a diseño, ver sección 13).
- Destinos definidos de "Planes", "Contacto" del nav y del pie: no están en el Figma (ver sección 13).
- Matriz de coberturas (D-08, fuera de alcance).

## 3. Dependencias

- **Puede empezar sin esperar a:** US-FE-W-03 (no comparten código).
- **Depende de** (fila del INDEX):
  - US-FE-T-05 (`Button` Primary y Secondary; `Chip` Neutro).
  - US-FE-T-07 (`CardWidget` para las tarjetas de "Cómo pagar").
  - US-FE-T-11 (MSW base para los tests de planes).
  - US-FE-T-18 (`PublicLayout`, `PublicNav`, `PublicFooter`).
  - US-FE-T-19 (harness de accesibilidad).
  - US-FE-W-02 (`features/planes/index.ts` exporta `TablaPlanes`).
- **Bloqueada por pedidos al back:** ninguno (`—` en el INDEX). `GET /api/planes` está Implementado (`analisis-front.md §4`).
- **Workaround MSW:** no aplica. Los tests de planes usan el handler de US-FE-T-27.

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB1 (React Router, Vitest, Testing Library), FB3 (reglas 1 y 2 de features), FB7.8 (contraste sin cambiar colores), FB7.2 (fuentes).
- `docs/frontend/tareas/INDEX.md`: FC1, FC2, FC15 (textos en español con voseo), FC16 (accesibilidad), sección "Decisiones pendientes" D-02, D-07, D-08.
- `docs/frontend/pantallas/W1-inicio.md`:
  - §2 (ruta `/`, sin guardas),
  - §3 (estructura: Hero, divider, Planes, Cómo pagar, footer),
  - §4 (componentes; `Chip` Neutro es informativo, `Card/Widget`),
  - §5 (textos literales; se copian también en la sección 8 de este archivo),
  - §7 (estados: solo "Default" dibujado),
  - §8 (acciones y navegación),
  - §11 (responsive 390 px, propuesta),
  - §12 (accesibilidad),
  - §13 (dudas 1, 6, 7, 8 y 10).
- `docs/frontend/design-system.md`: §5.1 (Button), §5.5 (Chip), §5.13 (Card/Widget), §5.14 (Backdrop: no usar alto fijo), §7.4 (breakpoints), §8.3 (foco visible), §8.5 (tamaños táctiles).
- `docs/frontend/contratos-api/convenciones-transversales.md` §5.4 (importes; no se hace aritmética en el front).
- `docs/frontend/contratos-api/vehiculos-planes-cotizaciones.md` §4.1 (solo para entender lo que muestra W-02; W-01 no llama al endpoint directamente).

## 5. Archivos a crear o modificar

Todos bajo `frontend/apps/web-publica/src/`:

| Archivo | Acción | Dueño |
|---|---|---|
| `features/inicio/routes.tsx` | crear (exporta la ruta `/` con `InicioPage`) | W-01 (primer task del feature `inicio` web) |
| `features/inicio/index.ts` | crear (exporta `inicioRoutes`) | W-01 |
| `features/inicio/pages/InicioPage.tsx` | crear | W-01 |
| `features/inicio/pages/InicioPage.test.tsx` | crear | W-01 |
| `features/inicio/components/HeroPublico.tsx` | crear | W-01 |
| `features/inicio/components/SeccionPlanes.tsx` | crear (título, subtítulo, chip, `TablaPlanes`) | W-01 |
| `features/inicio/components/ComoPagar.tsx` | crear (dos tarjetas) | W-01 |

No se tocan: `app/router.tsx` (lo compone US-FE-T-17), `features/planes/*` (US-FE-W-02), `@nexa/ui` (US-FE-T-05, T-07, T-18), `package.json` (US-FE-T-01, FC17).

## 6. Pasos de implementación

1. Leer `routes.tsx` del stub creado por US-FE-T-17 y reemplazar su contenido: exportar `inicioRoutes` con `path: '/'` y `element: <InicioPage />`. El router de T-17 lo compone dentro de `PublicLayout`.
2. Crear `InicioPage.tsx` delgada: compone `HeroPublico`, `Divider` (1 px, `border-border-hairline`), `SeccionPlanes`, `Divider`, `ComoPagar`. No calcula nada.
3. `HeroPublico`:
   - `<h1>` con el título (estilo Display 40/44 Bold en desktop, 28/34 en 390 px).
   - Bajada en Body 16/20 `text-text-secondary`.
   - Fila de CTAs: `Button` variante Primary, label "Consultar póliza", navega a `/consultar-poliza`; `Button` Secondary, label "Ver planes", navega a `#planes`. Si el `Button` de US-FE-T-05 no permite renderizar como enlace, pedirlo a T-05. No duplicar el primitivo ni usar estilos inline.
   - Imagen placeholder: contenedor de 560×420 px (desktop) con `rounded-card` y `bg-surface-subtle`, texto "Foto: auto y moto", `aria-hidden="true"`. En 390 px: ancho completo, alto 220 px (propuesta, ver sección 13).
4. `SeccionPlanes`: `<h2>` "Planes", subtítulo, `Chip` Neutro "Valores de referencia" **no interactivo** (renderizar como `span`, no como `button`). Debajo, `<TablaPlanes />` importada de `@/features/planes` (la ruta del alias la define US-FE-T-17). Ancla `id="planes"` en el `section` que envuelve la sección.
5. `ComoPagar`: `<h2>` "Cómo pagar" y dos `CardWidget` (T-07) en fila (columna en 390 px):
   - Tarjeta A: título "Pago online", texto "Elegí Pasarela A o Pasarela B y pagá con tarjeta o dinero en cuenta.", acción "Consultar póliza" como enlace a `/consultar-poliza`.
   - Tarjeta B: título "Efectivo con Pago Fácil", texto "Pagá en efectivo con el cupón de Pago Fácil, que tiene un código de barras de 42 dígitos.", **sin acción**: "Ver ejemplo de cupón" del Figma no es interactivo (RV-D21; DN-W1-1).
   - Iconos `icon/credit-card` (tarjeta A) e `icon/barcode` (tarjeta B), 20 px, `aria-hidden="true"`. Usar los SVG de Figma descargados al repo; no reemplazarlos por otra librería.
6. Layout responsive: desktop según el Figma; en 390 px todo en una columna, sin scroll horizontal. Las tarjetas "Cómo pagar" van una debajo de otra a ancho completo.
7. Escribir los tests de la sección 10 y ejecutarlos.

## 7. Contrato con el back

No aplica. W-01 no llama a ningún endpoint propio. Los planes los consume `TablaPlanes` (US-FE-W-02) vía `GET /api/planes`, Implementado (contrato en `contratos-api/vehiculos-planes-cotizaciones.md` §4.1).

## 8. Contenido de UI (textos literales de W1)

Copiar tal cual, con tildes y puntuación (`pantallas/W1-inicio.md` §5).

| Zona | Texto literal |
|---|---|
| Hero, título (`h1`) | Tu vehículo asegurado, tu póliza siempre a mano. |
| Hero, bajada | Consultá el estado de tu póliza, revisá tus cuotas y pagalas online o en efectivo. |
| Hero, CTA 1 | Consultar póliza |
| Hero, CTA 2 | Ver planes |
| Hero, marcador de imagen (`aria-hidden`) | Foto: auto y moto |
| Planes, título (`h2`) | Planes |
| Planes, subtítulo | Cobertura de referencia para autos, motos y camionetas. |
| Planes, chip | Valores de referencia |
| Planes, nota al pie (de `TablaPlanes`, W-02) | La prima final depende del vehículo y se informa al cotizar. |
| Cómo pagar, título (`h2`) | Cómo pagar |
| Tarjeta A, título | Pago online |
| Tarjeta A, texto | Elegí Pasarela A o Pasarela B y pagá con tarjeta o dinero en cuenta. |
| Tarjeta A, acción | Consultar póliza |
| Tarjeta B, título | Efectivo con Pago Fácil |
| Tarjeta B, texto | Pagá en efectivo con el cupón de Pago Fácil, que tiene un código de barras de 42 dígitos. |

El pie (`PublicFooter`) y el nav (`PublicNav`) son de US-FE-T-18; sus textos son los de `pantallas/W1-inicio.md` §5 (footer: "Teléfono", "Email", "Ubicación", "Horarios", "A confirmar", "Dirección a confirmar", "Lunes a viernes, horario a confirmar", "© 2026 Nexa Seguros. Todos los derechos reservados.").

Ninguna cifra de precio se escribe a mano en esta tarea: los importes salen de `GET /api/planes` (FC9). Los valores del Figma ($ 10.000,00, $ 18.000,00, $ 27.500,00) **no** se usan como texto fijo (ver sección 13, DN-W1-5 y `US-FE-W-02`).

## 9. Estados y casos borde

- La pantalla es estática para el usuario. Los estados de carga, error y vacío de los planes pertenecen a `TablaPlanes` (US-FE-W-02); W-01 solo los muestra dentro de su sección.
- Sin datos del usuario: no leer ni escribir `localStorage`, `sessionStorage` ni cookies (FC12).
- "Ver ejemplo de cupón" no es interactivo (RV-D21): ni enlace ni botón (DN-W1-1). Un enlace a `/poliza/pagar/pago-facil` sin `location.state` redirige a `/consultar-poliza` por la guarda de US-FE-W-07, y el cliente nunca vería el ejemplo.
- Foco visible en botones y enlaces: anillo `focus-visible` de 2 px con `outline-offset: 2px` (design-system §8.3, propuesta).
- Enlaces "Planes" y "Contacto" del nav: fuera de esta tarea (T-18 aplica el default de sección 13).

## 10. Tests requeridos

Vitest + Testing Library + MSW (handler de `GET /api/planes` de US-FE-T-27). Un test por regla de UI.

| Test (`InicioPage.test.tsx`) | Afirma | Herramienta |
|---|---|---|
| `muestra el h1 del hero` | `getByRole('heading', { level: 1, name })` con el título literal | Testing Library |
| `CTA Consultar póliza enlaza a /consultar-poliza` | el enlace tiene `href="/consultar-poliza"` | Testing Library |
| `CTA Ver planes enlaza al ancla #planes` | `href="#planes"` y existe un elemento con `id="planes"` | Testing Library |
| `el chip Valores de referencia no es interactivo` | no existe `role="button"` con ese nombre | Testing Library |
| `la sección Planes muestra la tabla con los planes del endpoint` | aparecen RC, TC y TR tras la carga (MSW) | MSW + Testing Library |
| `Cómo pagar muestra dos tarjetas con los títulos literales` | textos "Pago online" y "Efectivo con Pago Fácil" | Testing Library |
| `la tarjeta B no tiene enlace ni botón` | no existe enlace ni botón "Ver ejemplo de cupón" (RV-D21) | Testing Library |
| `el marcador de imagen está oculto para lectores de pantalla` | el contenedor con "Foto: auto y moto" tiene `aria-hidden="true"` | Testing Library |
| `no hay campos de formulario` | `queryAllByRole('textbox')` vacío | Testing Library |
| `no escribe en almacenamiento` | `localStorage.setItem` y `sessionStorage.setItem` sin llamadas | spy de Vitest |
| `no tiene violaciones de accesibilidad` | axe sobre la página | vitest-axe (US-FE-T-19) |

El test de 390 px (sin scroll horizontal) no se automatiza en jsdom: se verifica en la sección 12.

## 11. Criterios de aceptación

1. La ruta `/` renderiza `InicioPage` dentro de `PublicLayout` (verificado en el router local).
2. El `h1` tiene el texto literal de la sección 8.
3. "Consultar póliza" del hero navega a `/consultar-poliza` (test).
4. "Ver planes" apunta a `#planes` y `#planes` existe en el DOM (test).
5. El chip "Valores de referencia" no es un botón (test).
6. La sección Planes muestra RC, TC y TR con importes de `GET /api/planes`, no números escritos a mano (test con MSW).
7. "Cómo pagar" tiene dos tarjetas con los textos literales; la tarjeta B no tiene enlace (test).
8. El marcador de imagen tiene `aria-hidden="true"` (test).
9. No hay campos de formulario ni llamadas de escritura de datos (tests).
10. Sin violaciones de axe (test).
11. En 390 px no hay scroll horizontal y todo queda en una columna (verificación manual, sección 12).
12. `npm run lint`, `typecheck`, `test` y `build` en verde para `apps/web-publica` (FC8).

## 12. Verificación manual

1. Levantar la web pública en local (script de `apps/web-publica`; ver README de US-FE-T-22). Abrir `http://localhost:5174/`.
2. Ver el hero, la sección Planes con los tres planes del backend y "Cómo pagar" con dos tarjetas.
3. Hacer clic en "Consultar póliza" del hero: debe abrir `/consultar-poliza`.
4. Hacer clic en "Ver planes": la página baja hasta la sección Planes.
5. DevTools en 390 px: no aparece barra de scroll horizontal; las tarjetas quedan apiladas.
6. Tab desde el inicio: el orden de foco es nav, CTAs del hero, planes (sin foco en el chip), tarjeta A, pie.
7. Confirmar al equipo que la pantalla quedó como se describe antes de abrir el PR (regla 7 de `docs/workflow.md`).

## 13. Decisiones pendientes con su default

| ID | Tema | Default (aplicar hasta que el equipo decida) | Fuente |
|---|---|---|---|
| D-02 | Ruta de inicio | `/` (la ruta del Figma es `/`) | INDEX D-02 |
| D-07 | **[CONFIRMAR]** (RV-D22). Precio "desde" de cada plan | `primaBase` tal cual, sin recalcular (lo hace W-02) | INDEX D-07 |
| D-08 | Matriz de coberturas | Fuera de alcance | INDEX D-08 |
| DN-W1-1 | Enlace "Ver ejemplo de cupón" (tarjeta B) | No interactivo (RV-D21): la tarjeta B no lo renderiza. Un enlace a W5 sin estado redirige a W2, por eso no se enlaza hasta definir si es un ejemplo estático o un cupón real | W1 §8, §13.6; RV-D21 |
| DN-W1-2 | Marcador "Foto: auto y moto" | Se muestra como placeholder con `aria-hidden`; se reemplaza por la imagen real cuando diseño la entregue | W1 §13.1 |
| DN-W1-3 | Imagen del hero en 390 px | Alto fijo 220 px, ancho completo | W1 §11 (propuesta) |
| DN-W1-4 | Destino de "Planes", "Contacto" del nav y de "Ver planes" | "Planes" y "Ver planes" a `#planes`; "Contacto" a `#contacto` (ancla del pie) | W1 §8, §13.7 |
| DN-W1-5 | Importes de los planes en el Figma | **[CONFIRMAR]** negocio/diseño (RV-D22). Se muestran los de `GET /api/planes`. El Figma usa $10.000 / $18.000 / $27.500 y el seed usa 12.000 / 18.000 / 30.000 (ver `US-FE-W-02` §13). No cerrar sin confirmación del equipo: negocio y diseño | W1 §13.2; RV-D22 |

## 14. Riesgos y errores comunes

- **Enlace roto a W5:** cualquier `Link` a `/poliza/pagar/pago-facil` sin `state` cae en la guarda de W-07 y vuelve a W2. No apuntar ahí desde W1 (DN-W1-1).
- **Chip como botón:** si `Chip` de T-05 renderiza `button` por defecto, pasar el elemento como `span` o usar la prop de no interactivo; un botón sin acción confunde al lector de pantalla.
- **Alto fijo del Backdrop:** el Figma mide 1024 px y el código de referencia 1834 px (W1 §13.9). No fijar alto: usar `min-h-dvh` (design-system §5.14).
- **Formato de importes:** `Intl` con `es-AR` puede dar un espacio no separable (U+00A0) después de "$". Los tests comparan normalizando los espacios; el formateador de T-09 debe producir `$ 10.000,00`.
- **Foco inicial:** W1 no define foco al cargar la página; no moverlo desde `InicioPage`.

## 15. Definición de terminado

- `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` en verde para `apps/web-publica` (FC8).
- Accesibilidad revisada con el harness de US-FE-T-19 (axe sin violaciones).
- Sin secretos ni credenciales.
- Los 11 criterios de la sección 11 tildados con evidencia observada (FC6).
- Las decisiones de la sección 13 quedan anotadas en el PR con el default aplicado.

## 16. Observaciones al índice

- Resuelto (RV-D21): el enlace "Ver ejemplo de cupón" no es interactivo; W-01 no enlaza a W5 hasta DN-W1-1 (sección 13).
- Resuelto (RV-D06): `Shell` vive en `@nexa/ui` (T-07) y lo importan T-16 y T-18; no hay un `Shell` público aparte. W-01 no lo crea.
- Resuelto (RV-04): sin otra inconsistencia de ID, dependencia u oleada; W-01 declara T-11 y T-19 como indica la fila del INDEX.
