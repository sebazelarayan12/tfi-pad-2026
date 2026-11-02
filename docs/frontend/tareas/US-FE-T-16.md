# US-FE-T-16: Backoffice: Topbar, Shell y LayoutBackoffice

T · Ola 3 · Tamaño M · Rama sugerida `feature/US-FE-T-16-topbar-shell-layout` · Tarjeta Trello `US-FE-T-16`

## 1. Objetivo

El backoffice tiene el layout de B2: Backdrop, Shell blanco flotante, Sidebar filtrado por rol (Planes y Usuarios solo para Administrador), Topbar con título, buscador, campana y acción opcional, y `Outlet` para las páginas. Cada página define su título con `handle` en la ruta. Destinatarios: todas las pantallas protegidas del backoffice (B-02 a B-25).

## 2. Alcance

**Entra** (todo en `frontend/apps/backoffice/src/app/layouts/`)
- `LayoutBackoffice.tsx` (reemplaza el stub de US-FE-T-14).
- `Topbar.tsx`.
- `navegacionBackoffice.ts`: ítems de navegación con rol y `gruposParaRol(rol)`; tipo `HandleRuta`.
- Tests: `LayoutBackoffice.test.tsx`, `Topbar.test.tsx`, `navegacionBackoffice.test.ts`.

**NO entra**
- `Sidebar` y `NavItem`: US-FE-T-15.
- Sesión, `RequireSesion` y `RequireRol`: US-FE-T-13.
- Pantallas y su título y acción: cada feature.
- Búsqueda con endpoint (no definido, B2 D-6).
- Versión mobile: D-25 de INDEX (mínimo 1280 px).

## 3. Dependencias

- **Puede empezar sin esperar a:** US-FE-B-01 (login, sin layout) y US-FE-W-02 (frente web).
- **Depende de:** US-FE-T-05 (`Button` en el menú de usuario), US-FE-T-07 (`Backdrop` y `Shell`), US-FE-T-13 (`useSesion`, `useRol`, `cerrarSesion`), US-FE-T-14 (router con `handle`, stub reemplazado), US-FE-T-15 (`Sidebar`, `NavItem`, `NavIcon`, `GrupoNav`), US-FE-T-19 (harness de accesibilidad en los tests).
- **Bloqueada por pedidos al back (PB-NN):** —. PB-04 (nombre del usuario) degrada: se muestra el email del claim (B2 §9).
- **Workaround MSW (FB7.7):** no pide datos; no requiere mock.

## 4. Documentos a leer

- `docs/frontend/design-system.md` §5.9 (Topbar: anatomía, medidas y props), §5.15 (Shell: radio, sombra, inset), §7.2 (estructura del Shell de B2 con medidas), §7.4 (breakpoints, propuesta), §8.6 (íconos decorativos).
- `docs/frontend/pantallas/B2-inicio.md` §3 (estructura), §4 (componentes), §5 (textos de Topbar y Sidebar), §8 (navegación de cada ítem), §9 (nombre del usuario, PB-04), §11 (responsive), §13 D-6, D-7 y D-15.
- `docs/frontend/00-decisiones-base.md` FB7.5 (sesión) y FB7.10 (Planes y Usuarios solo para Admin).
- `docs/frontend/pantallas/B13-planes.md` §2 y `docs/frontend/pantallas/B14-usuarios.md` §2 (guardas de administrador y acceso denegado).
- `docs/frontend/analisis-front.md` §2.1 (rutas del backoffice) y §3.2 (features).

## 5. Archivos a crear o modificar

| Archivo | Dueño |
|---|---|
| `apps/backoffice/src/app/layouts/LayoutBackoffice.tsx` (reemplaza stub) | US-FE-T-16 |
| `apps/backoffice/src/app/layouts/Topbar.tsx`, `navegacionBackoffice.ts` | US-FE-T-16 (`Shell` se importa de `@nexa/ui`, T-07, RV-D06) |
| `apps/backoffice/src/app/layouts/*.test.tsx`, `navegacionBackoffice.test.ts` | US-FE-T-16 |

## 6. Pasos de implementación

1. `navegacionBackoffice.ts`:
   - `NAV_PRINCIPAL`, en este orden: Inicio (`house`, `/inicio`); Clientes (`users`, `/clientes`); Vehículos (`car`, sin `href`, DP-1); Cotizaciones (`calculator`, sin `href`, DP-1); Pólizas (`file-text`, `/polizas`); Pagos y facturas (`receipt`, `/pagos`); Pago Fácil (`barcode`, `/pago-facil`).
   - `NAV_ADMIN`: Planes (`list`, `/planes`) y Usuarios (`user-circle`, `/usuarios`), ambos con `roles: ['Administrador']`.
   - `gruposParaRol(rol: RolUsuario | null): GrupoNav[]`: si `rol` es `null`, devuelve `[]`. Si no, devuelve el grupo principal y, solo si `rol === 'Administrador'`, el grupo admin (FB7.10).
   - `export interface HandleRuta { titulo: string }`.
2. `Shell`: se importa de `@nexa/ui` (T-07, RV-D06) y no se redefine en `app/layouts`. Inset de 24 px dentro del Backdrop en desktop (ver DP-2 sobre el ancho).
3. `Topbar.tsx`, props de §7. Estructura `flex h-16 items-center gap-sp-16`:
   - Título como `h2` con `text-h2 text-text-primary` (solo si `titulo` no está vacío).
   - Espaciador `flex-1`.
   - Buscador de 280 px, alto 36 px, `rounded-input bg-surface-panel border border-border-strong` (Figma en la Topbar), con etiqueta `sr-only` "Buscar cliente o póliza" y placeholder visible del mismo texto. Solo llama `onBuscar` si está definido (DP-5).
   - Botón campana de 36 px circular `rounded-pill border border-border-strong bg-surface-panel` con `aria-label="Notificaciones"` y `BellIcon` `aria-hidden`.
   - `accion` (ReactNode) a la derecha; la define cada página (DP-6).
4. `LayoutBackoffice.tsx`:
   - Lee `rol` y `email` con `useSesion()`.
   - Lee el título de la última ruta con `handle` usando `useMatches()` y el tipo `HandleRuta`.
   - Arma `usuario = { initials: inicialesDe(email), name: email ?? '', role: rol ?? '' }`. `inicialesDe` toma la primera letra del email en mayúscula (DP-3).
   - Estructura:
     ```tsx
     <Backdrop>
       <Shell>
         <Sidebar grupos={gruposParaRol(rol)} user={usuario} menuUsuario={<MenuUsuario />} />
         <div className="flex flex-1 flex-col gap-sp-24 p-sp-32">
           <Topbar titulo={titulo} />
           <main id="contenido"><Outlet /></main>
         </div>
       </Shell>
     </Backdrop>
     ```
5. `MenuUsuario` (dentro de `LayoutBackoffice.tsx`): botón con `DotsThreeIcon` `aria-hidden` y `aria-label="Menú de usuario"`; al abrir muestra un menú con la opción "Cerrar sesión" (DP-4). Con Escape se cierra y el foco vuelve al botón. Al elegir la opción: `cerrarSesion('manual')` y `navigate('/login', { replace: true })`.
6. Las páginas definen su título con `handle: { titulo: 'Clientes' } satisfies HandleRuta` en su `RouteObject` (lo compone US-FE-T-14).
7. Escribir los tests de §10.

## 7. Contrato con el back

No aplica: no hay endpoints. Props públicas:

```ts
export interface TopbarProps {
  titulo?: string;
  buscadorPlaceholder?: string;        // default "Buscar cliente o póliza"
  onBuscar?: (query: string) => void;  // sin valor: no hace nada (DP-5)
  onNotificaciones?: () => void;       // sin valor: no hace nada (DP-7)
  accion?: React.ReactNode;
}

export interface HandleRuta { titulo: string; }
```

Los datos del usuario salen de `useSesion()` (US-FE-T-13). El nombre no existe en el back (PB-04): se usa el email del claim.

## 8. Contenido de UI

- Título de la Topbar: el de la página (`handle.titulo`). Sin `handle`, no se renderiza el `h2`.
- Buscador: placeholder "Buscar cliente o póliza" (B2 §5, texto literal del Figma). Etiqueta accesible igual.
- Campana: `aria-label` "Notificaciones" (propuesta de B2 §11), sin texto visible.
- Sidebar: los textos los define `gruposParaRol` (§6, paso 1), tomados de B2 §5.
- Menú de usuario: "Cerrar sesión" (propuesta; B2 D-7 dice "NO DEFINIDO").
- Rol visible: "Empleado" o "Administrador", tal como llega de la sesión.

## 9. Estados y casos borde

- Sin sesión (no debería llegar: lo impide RequireSesion): `rol` es `null`, la sidebar no tiene grupos y el usuario queda vacío.
- Empleado: no ve Planes ni Usuarios. Si escribe `/planes` en la URL, la página muestra el panel de RequireRol (US-FE-T-13); el ocultamiento no reemplaza la guarda.
- Administrador: ve los dos grupos.
- Ítem sin destino (Vehículos, Cotizaciones): no interactivo (DP-1 de T-15).
- Ruta sin `handle`: la topbar no muestra título.
- Campana sin acción: el botón se puede enfocar y no hace nada (DP-7).
- Ventana de 1280 px: no hay scroll horizontal en la página; la tabla de cada pantalla hace scroll dentro de su contenedor (B2 §11).
- Menú de usuario abierto: Escape cierra y el foco vuelve al botón.

## 10. Tests requeridos

Vitest, Testing Library, `MemoryRouter` con rutas de prueba y el store de sesión de US-FE-T-13 con datos cargados. El harness axe (US-FE-T-19) se usa para el layout completo.

- `navegacionBackoffice.test.ts`
  - "Administrador recibe el grupo admin con Planes y Usuarios".
  - "Empleado no recibe Planes ni Usuarios (FB7.10)".
  - "rol `null` devuelve lista vacía".
  - "Vehículos y Cotizaciones no tienen `href`".
- `Topbar.test.tsx`
  - "muestra el título como `h2`".
  - "sin título no renderiza `h2`".
  - "la campana tiene `aria-label` 'Notificaciones'".
  - "el buscador tiene etiqueta accesible 'Buscar cliente o póliza'".
  - "`accion` se renderiza dentro de la topbar".
  - "`onBuscar` se llama con el texto al enviar; sin `onBuscar` no falla".
  - "renderiza los hijos dentro del panel con clase `rounded-shell` y `shadow-shell`".
- `LayoutBackoffice.test.tsx`
  - "con rol Empleado la sidebar no muestra Planes ni Usuarios".
  - "con rol Administrador la sidebar muestra Planes y Usuarios".
  - "el título del `handle` de la ruta activa aparece en la topbar".
  - "el ítem de la ruta actual tiene `aria-current=\"page\"`".
  - "'Cerrar sesión' limpia la sesión y navega a `/login`".
  - "el layout no tiene violaciones de axe (harness de T-19)".

## 11. Criterios de aceptación

1. Con rol Empleado, la sidebar no muestra Planes ni Usuarios (test en verde).
2. Con rol Administrador, la sidebar muestra Planes y Usuarios (test en verde).
3. La topbar muestra el título del `handle` de la ruta activa y no muestra `h2` si no hay título.
4. El campo de la topbar y la campana tienen etiqueta accesible; la campana tiene `aria-label="Notificaciones"`.
5. El layout usa el `Shell` de `@nexa/ui` (T-07); no hay una segunda definición en `app/layouts`.
6. "Cerrar sesión" limpia la sesión y lleva a `/login` con `replace`.
7. El layout no tiene violaciones de axe (test en verde).
8. Con 1280 px de ancho, la página no tiene scroll horizontal (verificación manual de §12).
9. Tests, `lint`, `typecheck` y `build` en verde, con evidencia.

## 12. Verificación manual

1. `npm run dev` en `apps/backoffice`, sesión de Empleado (con B-01 o con la clave de sessionStorage de T-13 §12).
2. Verificar que la sidebar no muestra Planes ni Usuarios, y que `/planes` muestra el panel de acceso restringido.
3. Cambiar el rol de la sesión a Administrador y recargar: aparecen Planes y Usuarios.
4. Ancho de 1280 px: no hay scroll horizontal de la página.
5. Navegar con Tab: el foco visible aparece en los ítems del sidebar, en el buscador, en la campana y en el menú de usuario.
6. Abrir el menú de usuario, elegir "Cerrar sesión": vuelve a `/login` y la clave de sesión desaparece.

## 13. Decisiones pendientes

- **DP-1 Vehículos y Cotizaciones sin pantalla.** Default: sin enlace (no interactivos). Alternativa: enlazar a `/vehiculos` y `/cotizaciones` y dejar que muestren "Página no encontrada". Tradeoff: el enlace roto es peor que el ítem inactivo.
- **DP-2 Ancho del Shell.** Default: `w-full` con máximo 1392 px. Alternativa: 1392 px fijos (B2 §7.2). Tradeoff: el ancho fijo se corta en 1280 px (mínimo de D-25); el fluido sigue el diseño sin romper el mínimo.
- **DP-3 Iniciales sin nombre.** Default: primera letra del email en mayúscula (PB-04). Alternativa: mostrar "—". Tradeoff: la letra identifica un poco; el guion no identifica.
- **DP-4 Menú de usuario.** Default: opción "Cerrar sesión" (texto propuesto). Alternativa: sin menú, y la sesión termina solo por vencimiento. Tradeoff: sin menú el usuario no puede cerrar sesión; el back no tiene logout (convenciones §2.2).
- **DP-5 Buscador de la topbar.** Default: visible, sin acción mientras B2 D-6 esté sin definir. Alternativa: ocultarlo. Tradeoff: el diseño lo muestra; ocultarlo quita un elemento sin decisión de producto.
- **DP-6 Acción de página.** Default: cada página pasa su `accion` (B2 usa "Nueva cotización", design §5.9 usa "Nuevo cliente"). El layout no define acciones.
- **DP-7 Campana.** Default: botón sin acción. Alternativa: `disabled`. El Figma no define estado deshabilitado (design §9 ítem 7).

## 14. Riesgos y errores comunes

- Filtrar por rol en el sidebar y no en la ruta: ocultar no es seguridad. RequireRol en cada página de Administrador es obligatorio (B13, B14).
- `useMatches` sin tipar `handle` lleva a `any` implícito; usar `HandleRuta`.
- Poner el título de la topbar como `h1`: la pantalla tiene su propio `h1` (B2 "Hola, ..."). La topbar usa `h2` (design §5.9).
- Sombra en todos los contenedores: solo el Shell la tiene (design §5.15).
- Ancho fijo de 1392 px que rompe a 1280 px (ver DP-2).
- Ítems con `href` inventado (DP-1).
- Mostrar el email completo como nombre visible en la sidebar: es dato personal y se usa solo como fallback (FB7.5, convenciones §2.2).

## 15. Definición de terminado

`npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` en verde en `apps/backoffice`. Criterios de §11 tildados con evidencia observada. Sin secretos. Accesibilidad: test axe en verde (T-19), landmarks `nav` y `main`, foco visible en interactivos, `aria-current` en el activo, campana con `aria-label`.

## 16. Observaciones al índice

- Resuelto (RV-50): T-16 declara T-05, T-07 y T-19 (imports reales). No cambia su Ola 3.
- Resuelto (RV-D06): `Shell` vive en `@nexa/ui` (T-07) y T-16 lo importa. `Topbar` y `LayoutBackoffice` siguen en `app/layouts/`, según la tabla de ownership del INDEX.
- Resuelto (RV-68): DP-5, DP-6 y DP-7 corresponden a B2 D-6 y D-7, agregados como D-34 en el índice de decisiones. Quedan con el default de la ficha.
