# US-FE-T-15: @nexa/ui: NavItem y Sidebar

T · Ola 2 · Tamaño S · Rama sugerida `feature/US-FE-T-15-navitem-sidebar` · Tarjeta Trello `US-FE-T-15`

## 1. Objetivo

`@nexa/ui` exporta `NavItem` (estados Activo e Inactivo, foco visible, enlace inyectado) y `Sidebar` (logo, buscador, grupos de navegación separados por divisor, bloque de usuario). Ambos son presentacionales: reciben ítems y datos por prop y no filtran por rol (el filtro lo hace el layout, FB7.10). Destinatarios: US-FE-T-16 (layout backoffice) y, si se reutiliza, el web público.

## 2. Alcance

**Entra**
- `frontend/packages/ui/src/components/NavItem/NavItem.tsx`, `iconos.ts` (mapa `NavIcon` a componentes Phosphor) y `NavItem.test.tsx`.
- `frontend/packages/ui/src/components/Sidebar/Sidebar.tsx` y `Sidebar.test.tsx`.
- Bloque de exports en `frontend/packages/ui/src/index.ts` (dueño: US-FE-T-03).

**NO entra**
- Filtrado de ítems por rol: US-FE-T-16.
- Topbar, Shell y `LayoutBackoffice`: US-FE-T-16.
- Harness de accesibilidad `vitest-axe`: US-FE-T-19 (ver §13, DP-4).
- Logo y Backdrop: US-FE-T-07 (se importan, no se reescriben).
- Tokens y preset: US-FE-T-03.

## 3. Dependencias

- **Puede empezar sin esperar a:** US-FE-T-13.
- **Depende de:** US-FE-T-03 (tokens y preset Tailwind), US-FE-T-05 (la clase de anillo de foco visible que define el primitivo Button, reutilizada acá), US-FE-T-07 (`LogoNexa` y `Backdrop`).
- **Bloqueada por pedidos al back (PB-NN):** —.
- **Workaround MSW (FB7.7):** no aplica.

## 4. Documentos a leer

- `docs/frontend/design-system.md` §5.6 (NavItem: anatomía, ítems y props), §5.7 (`Logo/Nexa`), §5.8 (Sidebar: medidas, anatomía y props), §6.1 y §6.2 (íconos del NavItem), §8.1 (contraste: texto tertiary sobre sidebar), §8.3 (foco visible), §8.5 (tamaños táctiles), §9 ítems 2, 4, 9, 11 y 15.
- `docs/frontend/00-decisiones-base.md` FB3 (reglas de `@nexa/ui`: no conoce features), FB7.8 (los colores se implementan como están en Figma).
- `docs/frontend/analisis-front.md` §9.2 (foco, labels visibles, landmarks).
- `docs/frontend/tareas/INDEX.md` FC16 (labels visibles; placeholder nunca como label).
- `docs/frontend/pantallas/B2-inicio.md` §3 (sidebar: 232 px, padding 16 px, gap 16 px), §4 (nota del NavItem) y §5 (textos del sidebar).

## 5. Archivos a crear o modificar

| Archivo | Dueño |
|---|---|
| `packages/ui/src/components/NavItem/NavItem.tsx`, `iconos.ts`, `NavItem.test.tsx` | US-FE-T-15 (un primitivo, un dueño) |
| `packages/ui/src/components/Sidebar/Sidebar.tsx`, `Sidebar.test.tsx` | US-FE-T-15 |
| `packages/ui/src/index.ts` (bloque de exports) | US-FE-T-03; T-15 agrega su bloque |

## 6. Pasos de implementación

1. `NavItem/iconos.ts`: `export type NavIcon = 'house' | 'users' | 'car' | 'calculator' | 'file-text' | 'receipt' | 'barcode' | 'list' | 'user-circle';` y un mapa `NAV_ICONOS` a los componentes Phosphor de design-system §6.2: `HouseIcon`, `UsersIcon`, `CarIcon`, `CalculatorIcon`, `FileTextIcon`, `ReceiptIcon`, `BarcodeIcon`, `ListIcon`, `UserCircleIcon`. Confirmar los nombres al primer import (design §9 ítem 15). Peso `regular`, tamaño 16.
2. `NavItem.tsx`, props de §7. Estructura: un `div` relativo de alto 32 px y ancho completo. Dentro, una barra indicadora de 2 px × 20 px a la izquierda (`bg-action-primary` si `active`, transparente si no), el ícono `aria-hidden` y el texto `text-body-sm` (13/18).
3. Color del texto: `text-text-primary` si `active`, `text-text-secondary` si no.
4. Ítem activo: `aria-current="page"` en el enlace.
5. Enlace: si `href` está, `renderLink` (si viene) recibe `{ className, 'aria-current', children }` y devuelve el enlace; si no viene, se usa `<a href={href}>`. Si `href` falta, el ítem es `<span aria-disabled="true">`, sin foco y sin enlace (DP-1).
6. Foco visible: `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary`, la misma clase que T-05 (design §8.3).
7. `Sidebar.tsx`, props de §7. Estructura: `<aside aria-label="Navegación principal">` con `w-[232px] h-full bg-surface-sidebar p-sp-16 flex flex-col gap-sp-16`.
8. Orden interno del `aside`: `LogoNexa` (T-07); buscador; grupos; divisor implícito entre grupos; espaciador `flex-1`; bloque de usuario.
9. Buscador: `<form role="search">` con `<label className="sr-only">Buscar</label>`, un `input type="search"` con `placeholder="Buscar"`, alto 36 px, `rounded-input`, `bg-surface-panel`, `border border-border-hairline` (tal como Figma en §5.8) y un ícono `MagnifyingGlassIcon` de 16 px `aria-hidden`. Al enviar, `onSearch(texto.trim())` solo si el texto no está vacío (DP-5).
10. Grupos: cada grupo es un `<nav aria-label={grupo.titulo ?? 'Navegación'}>` con `flex flex-col gap-sp-4`. Entre grupos, un `<hr className="border-border-hairline" />`. Un grupo sin ítems no se renderiza.
11. Bloque de usuario: avatar de 32×32 `rounded-pill bg-accent-lime-soft` con `initials` en `text-caption` (11/14, medium); texto con `name` en `text-body-sm text-text-primary` (truncado, con `title`) y `role` en `text-caption text-text-tertiary` (color de Figma; ver §13, DP-6); `menuUsuario` a la derecha (el ícono `DotsThreeIcon` lo arma el layout, §8 de T-16).
12. `packages/ui/src/index.ts`: exportar `NavItem`, `NavIcon`, `Sidebar`, `GrupoNav`, `SidebarProps`, `NavItemProps`.
13. Escribir los tests de §10.

## 7. Contrato con el back

No aplica: no hay endpoints. Props públicas:

```ts
export type NavIcon =
  | 'house' | 'users' | 'car' | 'calculator' | 'file-text'
  | 'receipt' | 'barcode' | 'list' | 'user-circle';

export interface NavItemProps {
  label: string;
  icon: NavIcon;
  active?: boolean;                 // default false
  href?: string;                    // sin href: ítem no interactivo
  renderLink?: (props: {
    className: string;
    'aria-current'?: 'page';
    children: React.ReactNode;
  }) => React.ReactNode;            // default: <a href>
}

export interface GrupoNav {
  id: string;
  titulo?: string;
  items: ReadonlyArray<NavItemProps>;
}

export interface SidebarProps {
  grupos: ReadonlyArray<GrupoNav>;
  user: { initials: string; name: string; role: string };
  onSearch?: (query: string) => void;
  menuUsuario?: React.ReactNode;
}
```

`Sidebar` recibe los grupos por prop (INDEX: "recibe sus ítems por prop"). El diseño (§5.8) muestra `children`; ver §13, DP-3.

## 8. Contenido de UI

- Buscador: placeholder "Buscar" (Figma, B2 §5). Etiqueta accesible: "Buscar" (solo lector de pantalla).
- Ítems: los textos llegan por prop. Los nombres del Figma son "Inicio", "Clientes", "Vehículos", "Cotizaciones", "Pólizas", "Pagos y facturas", "Pago Fácil", "Planes" y "Usuarios" (B2 §5); los arma US-FE-T-16.
- Bloque de usuario: `initials`, `name` y `role` llegan por prop. El Figma muestra "MQ", "Mariela Quiroga" y "Empleado": son datos de muestra y no se hardcodean (FC4, design §9 ítem 16).

## 9. Estados y casos borde

- Ítem activo y ítem inactivo: ambos estados se renderizan con sus clases (tests de §10).
- Ítem sin `href`: se renderiza sin foco y con `aria-disabled="true"`.
- Grupo vacío: no se renderiza y no genera divisor.
- Nombre largo: se trunca con `truncate`; el nombre completo queda en `title`.
- Buscador con texto vacío o solo espacios: no se llama `onSearch`.
- Sin `onSearch`: el buscador se renderiza y no hace nada al enviar (DP-5).
- Sin `menuUsuario`: no se muestra el espacio del menú.

## 10. Tests requeridos

Vitest y Testing Library. Sin axe en esta tarea (ver §13, DP-4).

- `NavItem.test.tsx`
  - "inactivo: texto `text-text-secondary`, sin `aria-current` e indicador transparente".
  - "activo: `aria-current=\"page\"`, texto `text-text-primary` e indicador `bg-action-primary`".
  - "sin `href`: no es un enlace y tiene `aria-disabled=\"true\"`".
  - "con `renderLink` usa el componente recibido y no un `<a>` propio".
  - "tiene las clases de foco visible de 2 px con offset de 2 px".
  - "el ícono tiene `aria-hidden=\"true\"`".
- `Sidebar.test.tsx`
  - "renderiza los grupos en el orden recibido y un divisor solo entre grupos".
  - "un grupo sin ítems no se renderiza".
  - "muestra iniciales, nombre y rol del usuario".
  - "el nombre largo tiene `title` con el texto completo".
  - "enviar el buscador llama `onSearch` con el texto sin espacios de los bordes".
  - "enviar el buscador vacío no llama `onSearch`".
  - "el buscador tiene una etiqueta accesible 'Buscar'".

## 11. Criterios de aceptación

1. `NavItem` y `Sidebar` se exportan desde `@nexa/ui`.
2. Cada estado del ítem (activo, inactivo, sin `href`) tiene su test en verde.
3. El ítem activo tiene `aria-current="page"` y el indicador de 2 px × 20 px con `bg-action-primary`.
4. El color del texto es `text-text-primary` (activo) o `text-text-secondary` (inactivo), como en design §5.6.
5. `Sidebar` respeta 232 px de ancho, padding 16 px y gap 16 px (clases de design §5.8).
6. Ningún archivo de `packages/ui` importa de `apps/` ni de `features/`.
7. No hay colores fuera de los tokens de T-03 (`rg "#[0-9a-fA-F]{3,6}" packages/ui/src/components/NavItem packages/ui/src/components/Sidebar` sin resultados).
8. Tests de §10, `lint`, `typecheck` y `build` en verde, con evidencia.

## 12. Verificación manual

Sin prueba manual propia: esta tarea no tiene ruta. Se verifica en US-FE-T-16 (criterio de navegación del layout, ítem activo y ocultamiento por rol).

## 13. Decisiones pendientes

- **DP-1 Ítems sin destino.** Vehículos y Cotizaciones no tienen pantalla (B2 §8). Default: se renderizan sin enlace (`aria-disabled`). Alternativa: ocultarlos. Tradeoff: ocultar pierde el ítem del diseño; dejarlos sin enlace muestra que existen y todavía no están.
- **DP-2 Enlaces de React Router.** Default: `renderLink` inyectado por el consumidor, así `@nexa/ui` no depende de `react-router`. Alternativa: usar `Link` de React Router dentro de `@nexa/ui`. Tradeoff: la alternativa es más simple, pero acopla la librería a un router.
- **DP-3 Sidebar por datos o por `children`.** Default: `grupos` por prop (INDEX). Alternativa: `children` como en design §5.8. Tradeoff: los datos separan el filtro por rol del diseño; `children` deja la composición libre.
- **DP-4 Accesibilidad de esta tarea.** Default: no se corre axe aquí (T-19 es de la misma ola). La revisión axe del sidebar la hace T-19 o T-16.
- **DP-5 Buscador del sidebar.** Default: sin acción conectada, porque B2 D-6 dice "NO DEFINIDO". Alternativa: ocultarlo. Tradeoff: ocultar quita un elemento del diseño sin decisión de producto.
- **DP-6 Color del rol del usuario.** Figma usa `text/tertiary` (3.02:1 sobre el sidebar, design §8.1). Default: implementar el token de Figma (FB7.8) y registrar el pedido a diseño en T-19. Alternativa: `text/secondary`, que design §8.1 recomienda. Tradeoff: la alternativa cambia un color sin aprobación, lo que FB7.8 prohíbe.
- **DP-7 Etiqueta visible del buscador.** FC16 pide labels visibles; el Figma no tiene label visible. Default: etiqueta `sr-only` y placeholder visible. Alternativa: label visible "Buscar". Tradeoff: la alternativa cambia el diseño.

## 14. Riesgos y errores comunes

- Usar `<a href>` sin `renderLink` dentro de la app: la navegación recarga la página completa. La sesión se restaura desde `sessionStorage`, pero es lento y pierde estado de la página.
- Calcular "activo" a mano en el componente en lugar de recibir `active`: el layout debe decidirlo con la ruta actual.
- Un ícono con texto al lado sin `aria-hidden`: el lector anuncia el nombre dos veces.
- Colores hardcodeados en lugar de tokens: viola FB7.8 y el preset (design §4).
- Poner `Vehículos` con un `href` inventado: lleva a una ruta que no existe (DP-1).
- `<aside>` sin `aria-label`: el landmark queda ambiguo para lectores de pantalla.

## 15. Definición de terminado

`npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` en verde en `packages/ui`. Criterios de §11 tildados con evidencia observada. Sin secretos. Accesibilidad: foco visible en el enlace, `aria-current` en el activo, landmark `aside` con label, etiqueta del buscador. La revisión axe la hace US-FE-T-19.

## 16. Observaciones al índice

- Resuelto (RV-50 / RV-04): T-15 declara T-03 además de T-05 y T-07. No cambia la Ola 2.
- Resuelto (triage final, default de la ficha): La clase de foco visible la define T-05 (design §8.3) y se reutiliza acá. Si T-05 no la exporta, hay que acordarla con su dueño antes de implementar. (No figura en REVISION ni en FB8.)
