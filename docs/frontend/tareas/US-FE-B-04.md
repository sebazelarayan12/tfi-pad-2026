# US-FE-B-04: Clientes del backoffice: listado con búsqueda y paginación

Tipo: B · Oleada: 4 · Tamaño: M · Rama sugerida: `feature/US-FE-B-04-clientes-listado` · Tarjeta Trello: `US-FE-B-04`

Pantalla: [B3 Clientes](../pantallas/B3-clientes.md). Índice: [INDEX](INDEX.md), fila US-FE-B-04.

---

## 1. Objetivo

El empleado o el administrador abre `/clientes` y ve la lista de clientes activos con su DNI, email, teléfono, cantidad de vehículos, estado de validación Renaper y cantidad de pólizas activas. Puede buscar por DNI o apellido, paginar de 10 en 10 y llegar a la ficha de un cliente o al alta de uno nuevo. Esta tarea crea el feature `features/clientes` y es dueña de su `index.ts` y de su `routes.tsx`.

## 2. Alcance

**Entra**
- Ruta `/clientes` en `apps/backoffice/src/features/clientes/routes.tsx` y `pages/ClientesPage.tsx`.
- Título `Clientes` y botón `Nuevo cliente` (enlace a `/clientes/nuevo`) en el slot `accion` del layout de T-16 (RV-42).
- Campo de búsqueda con normalización (DNI u apellido), debounce y reinicio de página.
- Tabla de siete columnas con `BadgeRenaper`, filas de 48 px y enlace en el nombre a `/clientes/:id`.
- Paginación de 10 filas (`1-10 de 128`), Anterior y Siguiente, y chip con el total.
- Estados de carga, lista con datos, sin resultados, sin clientes, error.
- Aviso de alta (`location.state.aviso` con `{ tipo, texto }`, RV-41), que producen B-05 y B-08 (sección 13, D-B04-5).

**NO entra**
- Filtro "Estado Renaper" y filtro "Activo": sin parámetro en el back (sección 13, D-B04-1 y D-B04-2).
- Menú de acciones por fila (tres puntos) y "Validar en Renaper" por fila: sin definir (D-B04-3).
- Alta de cliente: **US-FE-B-05**. Validación Renaper: **US-FE-B-06**. Ficha: **US-FE-B-07**. Edición y baja: **US-FE-B-08**.
- Topbar del layout (título, campana) y `LayoutBackoffice`: **US-FE-T-16**.
- Función de request de clientes, DTO y mock de `GET /api/clientes`: **US-FE-T-24**.
- Formateadores (DNI con puntos): **US-FE-T-09**.

## 3. Dependencias

- **Oleada:** 4.
- **Depende de:** US-FE-T-04, US-FE-T-05, US-FE-T-06, US-FE-T-09, US-FE-T-11, US-FE-T-16, US-FE-T-19, US-FE-T-24.
- **Puede empezar sin esperar a:** US-FE-T-25 (alta y Renaper; no comparten datos en la lista).
- **Bloqueada por pedidos al back:** PB-03 (MSW; la lista usa el mock de T-24 con la forma de PB-03). Ver sección 7.

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB3 (feature `clientes`, reglas 1 a 5), FB4 (DNI sin puntos en el wire), FB7.7, FB7.11.
- `docs/frontend/pantallas/B3-clientes.md`: §2 (ruta y guardas), §3 (estructura: topbar, filtros, tabla, paginación, anchos de columna), §4 (componentes propios), §5 (contenido literal), §6 (campos y reglas de búsqueda), §7 (estados), §8 (acciones), §9 (datos y endpoints, JSON de ejemplo), §10 (RN01, RN02, RN15), §12 (accesibilidad), §13 (D-1, D-2, D-5, D-7, D-9, D-10).
- `docs/frontend/contratos-api/seguridad-clientes-publico.md`: §3.4 (listado: `ClienteFiltro`, `PaginaResponse`, nota de `activo=true`), §1.2 (formas de error).
- `docs/frontend/contratos-api/convenciones-transversales.md`: §6.1 (`PaginaResponse`, pero clientes usa `tamanoPagina`).
- `docs/frontend/design-system.md`: §5.2 (Input), §5.3 (Select, solo referencia), §5.5 (Chip Neutro), §5.12 (Table/Header y Table/Row), §5.4 (Badge Renaper: Validado y Pendiente), §5.1 (Button Primary M y Secondary S), §8.3 (foco).
- `docs/frontend/pedidos-al-back.md`: PB-03 (contrato mínimo del listado).
- `docs/frontend/tareas/INDEX.md`: FC2 (keys), FC5, FC9 (DNI), FC13, FC14, FC16, y el detalle de ownership de `features/clientes`.

## 5. Archivos a crear o modificar

Bajo `frontend/apps/backoffice/src/features/clientes/` (dueño B-04):

| Archivo | Notas |
|---|---|
| `index.ts` | Primer task del feature: dueño. Exporta lo que otros features necesiten (por ahora nada salvo `routes`). |
| `routes.tsx` | Ruta `/clientes`. Deja el orden preparado para `/clientes/nuevo` (B-05) antes que `/clientes/:clienteId` (B-07), FC14. |
| `pages/ClientesPage.tsx` | Compone encabezado, filtros, tabla, paginación y aviso. Delgada. |
| `components/FiltrosClientes.tsx` | Campo de búsqueda y chip de conteo. Usa el esquema zod de `schemas/`. |
| `components/TablaClientes.tsx` | Usa `Table` de `@nexa/ui`. Columnas de §8. |
| `components/BadgeRenaper.tsx` | Mapea `validadoRenaper` a `Badge` (`Validado` o `Pendiente`). |
| `components/PaginacionTabla.tsx` | "1-10 de N", Anterior y Siguiente en `<nav aria-label="Paginación">`. Si se reutiliza en B2 o B11, pasa a `shared/`. |
| `components/AvisoAlta.tsx` | Banner del aviso que llega por `location.state`. |
| `schemas/busquedaClientes.ts` | Esquema zod de la búsqueda y normalización. |
| `api/useClientes.ts` | `useQuery` sobre la request de T-24, con `clientesKeys.lista(filtro)`. |
| `pages/ClientesPage.test.tsx`, `components/*.test.tsx`, `schemas/busquedaClientes.test.ts` | Tests de §10. |

Compartidos (no editar): `packages/api/src/**` y `mocks/**` (T-24, T-11); `packages/ui/**` (T-04, T-05, T-06); `app/**` (T-16).

## 6. Pasos de implementación

1. Confirmar que T-24 y T-09 están mergeadas y leer sus exports (`listarClientes`, `ClienteResumenResponse`, `clientesKeys`, formateador de DNI). Los nombres de §7 son sugeridos.
2. Crear `busquedaClientes.ts` (zod): `trim()`, quitar puntos, `max(100)`. Si queda exactamente 8 dígitos, el filtro es `{ dni }`. Si no, `{ apellido }`. Si queda vacío, sin filtro.
3. Crear `useClientes`: parámetros `{ dni?, apellido?, pagina, tamanoPagina: 10 }`. `retry: false` para 4xx; el reintento queda en el botón de §9.
4. `FiltrosClientes`: `Input` con label `Buscar por DNI o apellido`, ayuda `Buscar por DNI completo o apellido.` (`aria-describedby`), `maxLength={100}`. Debounce de 300 ms. Cada cambio de búsqueda reinicia `pagina` a 1.
5. Chip Neutro con `{n} clientes` (plural según §8), `aria-live="polite"` para anunciar el cambio.
6. `TablaClientes`: anchos de B3 §3 (Nombre 210, DNI 116, Email 226, Teléfono 124, Vehículos 104, Renaper 130, Pólizas activas 146). Las filas tienen 48 px. DNI con `font-mono`, formateado con T-09. Teléfono `null` muestra `—`.
7. `BadgeRenaper`: `true` → `Validado`; `false` → `Pendiente`. Texto siempre visible (no solo color).
8. Nombre: `nombre apellido` como enlace a `/clientes/{id}` (la ruta la agrega B-07; antes de B-07 el enlace puede apuntar igual).
9. `PaginacionTabla`: "1-10 de 128" con la fórmula de B3 §9. Anterior deshabilitado en la página 1; Siguiente deshabilitado al llegar a la última (`Math.ceil(total / 10)`).
10. `AvisoAlta`: lee `location.state.aviso` una vez; si existe, muestra el texto con su tipo.
11. Estados: skeleton de filas de 48 px; el chip y la paginación muestran `—` mientras carga; error con banner y "Reintentar" sobre la tabla (la tabla no se muestra vacía).
12. Escribir los tests de §10 antes de los componentes; correr `lint`, `typecheck`, `test`, `build`.

## 7. Contrato con el back

| Método y ruta | Estado | Request | Response 200 | Errores |
|---|---|---|---|---|
| `GET /api/clientes` | Especificado (PB-03, US-F1-06) | Query: `dni?`, `apellido?`, `pagina`, `tamanoPagina` | `PaginaResponse<ClienteResumenResponse>` | 400 si `tamanoPagina` > 100; 401; 403 |

```ts
// Tipos en @nexa/api (dueño US-FE-T-24, dto/clientes.ts). No redefinir.
export interface ClienteFiltro {
  dni?: string;          // 8 dígitos sin puntos (exacto, propuesta de la spec)
  apellido?: string;     // coincidencia parcial sin distinguir mayúsculas (propuesta)
  pagina?: number;       // default 1
  tamanoPagina?: number; // esta tarea envía 10 (D-01). Máximo 100
}

export interface PaginaResponse<T> {
  items: T[];
  pagina: number;
  tamanoPagina: number;
  total: number;
}

// Forma propuesta por PB-03. La spec no define los campos (B3 D-7).
export interface ClienteResumenResponse {
  id: string;
  dni: string;               // 8 dígitos, sin puntos
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  validadoRenaper: boolean;
  activo: boolean;           // el back solo devuelve activos (RN15)
  cantidadVehiculos: number;
  cantidadPolizasActivas: number;
}
```

- Handler MSW: **No aplica** en esta tarea. Lo escribe T-24 (`handlers/clientes.ts`), con los mismos nombres de campo de esta sección.
- Query key: `clientesKeys.lista(filtro)` de T-24.
- No hay mutaciones en esta tarea.
- PB-03 bloquea la lista: `GET /api/clientes` está Especificado, no existe en `development` ni en el PR #50. Workaround: MSW de T-24 con la forma propuesta por PB-03.
- Campos no definidos en el back (B3 D-7): `cantidadVehiculos`, `cantidadPolizasActivas` y `validadoRenaper` en el resumen. Se usan los nombres de PB-03. Si el back define otros, cambia el mapeo, no la UI.
- Workaround MSW (FB7.7): el handler `handlers/clientes.ts` lo escribe T-24. Esta tarea no escribe handlers.

## 8. Contenido de UI

Textos literales de B3 §5. Los de "muestra" no se escriben.

| Zona | Texto |
|---|---|
| Título de página | `Clientes` |
| Botón primario | `Nuevo cliente` (con icono `user-plus` 16 px) |
| Label de búsqueda | `Buscar por DNI o apellido` |
| Ayuda de búsqueda | `Buscar por DNI completo o apellido.` |
| Placeholder de búsqueda | `Ej. 30.512.468` |
| Chip | `{n} clientes`; con 1 cliente, `1 cliente` (propuesta) |
| Encabezados | `Nombre` · `DNI` · `Email` · `Teléfono` · `Vehículos` · `Renaper` · `Pólizas activas` |
| Badge | `Validado` · `Pendiente` |
| Paginación | `1-10 de {total}` · `Anterior` · `Siguiente` |
| Caption de la tabla | `Clientes` |
| Sin resultados (propuesta, B3 §7) | `No hay clientes que coincidan con la búsqueda.` + botón `Limpiar filtros` |
| Sin clientes en el sistema (propuesta) | `Todavía no hay clientes cargados.` |
| Error de carga (propuesta) | `No pudimos cargar los clientes.` + botón `Reintentar` |
| Aviso de alta (propuesta, de B-05) | `Cliente guardado.` (éxito) · `Cliente guardado sin validar en Renaper.` (advertencia) |

**No renderizar:** `Tomás Iturralde`, `30.512.468`, `tomas.iturralde@gmail.com`, `128 clientes` y `1-10 de 128` (muestras). El texto de la capa "Consultar" del botón (B3 D-8) no se usa.

## 9. Estados y casos borde

| Caso | Comportamiento |
|---|---|
| Carga | Siete columnas con skeleton y filas de 48 px; chip y paginación con `—`. |
| Lista con datos | Hasta 10 filas. |
| Búsqueda sin resultados | Fila única de la tabla con el mensaje de §8 y "Limpiar filtros" (vuelve a búsqueda vacía). |
| Sin clientes en el sistema | Mismo lugar, sin "Limpiar filtros". |
| Error | Banner sobre la tabla con "Reintentar"; no se muestra la tabla vacía. |
| 401 | Lo maneja T-08 (redirige a `/login`). |
| Página 1 | Anterior deshabilitado (`disabled`). |
| Última página | Siguiente deshabilitado. |
| Cambio de búsqueda | `pagina` vuelve a 1 y se pide de nuevo. |
| Búsqueda de 8 dígitos con puntos | Se envía sin puntos como `dni`. |
| Búsqueda de 3 a 7 dígitos | Se envía como `apellido` (propuesta B3 §6). |
| Teléfono vacío | `—`. |
| Aviso de alta presente | Banner arriba de la tabla; desaparece al navegar. |
| Foco | Anillo de foco en el enlace del nombre, en los botones y en los campos. |

## 10. Tests requeridos

Herramientas: Vitest, Testing Library, MSW.

| Test | Qué afirma |
|---|---|
| `muestra el título Clientes y el botón Nuevo cliente que enlaza a /clientes/nuevo` | Encabezado y `href`. |
| `muestra siete columnas con sus encabezados en orden` | Textos de §8. |
| `pide la lista con pagina=1 y tamanoPagina=10 al entrar` | Query params. |
| `formatea el DNI con puntos sin enviarlo con puntos` | Visual con puntos; request sin puntos. |
| `el teléfono null se muestra como —` | Caso borde. |
| `BadgeRenaper: true muestra Validado y false muestra Pendiente` | Texto del badge. |
| `busca un DNI de 8 dígitos como dni` | Query `dni=30512468`. |
| `busca texto como apellido` | Query `apellido=...`. |
| `busca 3051 (no es DNI completo) como apellido` | Regla de §6. |
| `el debounce espera 300 ms antes de pedir` | Con fake timers. |
| `cambiar la búsqueda reinicia la página a 1` | `pagina=1`. |
| `Anterior está deshabilitado en la página 1 y Siguiente en la última` | `disabled`. |
| `1-10 de 128 con pagina 2 muestra 11-20 de 128` | Fórmula de paginación. |
| `el chip muestra 1 cliente y n clientes con aria-live` | Plural y región. |
| `lista vacía por búsqueda muestra el mensaje y Limpiar filtros` | Estado vacío. |
| `sistema sin clientes no muestra Limpiar filtros` | Estado vacío distinto. |
| `error muestra el banner y Reintentar vuelve a pedir` | Estado de error. |
| `durante la carga hay skeleton y el chip muestra —` | Estado de carga. |
| `el aviso de location.state se muestra una vez` | Aviso de alta. |
| `no aparecen tomás, 30.512.468 ni 128 clientes como texto fijo` | Sin muestras. |
| `no tiene violaciones de accesibilidad` | Helper de US-FE-T-19 (axe). |

## 11. Criterios de aceptación

1. `/clientes` muestra el título `Clientes` y el botón `Nuevo cliente` que lleva a `/clientes/nuevo`.
2. La tabla tiene siete columnas en el orden de B3 y `<caption>` `Clientes` con `th scope="col"`.
3. La request es `GET /api/clientes` con `pagina`, `tamanoPagina=10` y solo `dni` o `apellido`.
4. El DNI se muestra con puntos y se envía sin puntos.
5. Un DNI de 8 dígitos se busca como `dni`; cualquier otro texto, como `apellido`.
6. Cambiar la búsqueda reinicia la página a 1; la búsqueda se dispara 300 ms después de dejar de escribir.
7. La paginación muestra `1-10 de {total}` con la fórmula de §9 y deshabilita Anterior y Siguiente en los bordes.
8. El chip muestra `{n} clientes` y se anuncia con `aria-live="polite"`.
9. Badge Renaper muestra `Validado` o `Pendiente` como texto.
10. Sin resultados, sin clientes y error tienen los textos y acciones de §8 y §9.
11. El aviso de `location.state.aviso` se muestra una vez.
12. No hay filtros de Renaper ni de Activo, ni menú de fila (D-B04-1, D-B04-2, D-B04-3).
13. No hay datos de muestra fijos.
14. Los tests de §10 están en verde y el test de axe no tiene violaciones.
15. `npm run lint`, `typecheck`, `test` y `build` están en verde en `apps/backoffice`.

## 12. Verificación manual

Requiere `VITE_USE_MOCKS=true` (PB-03) o el back con `GET /api/clientes` publicado.

1. Abrir `/clientes`. Ver el título, la tabla con diez filas, el chip y la paginación.
2. Escribir un DNI de 8 dígitos con puntos. Ver una sola fila y el chip en `1 cliente`.
3. Escribir un apellido parcial. Ver la lista filtrada y la página en 1.
4. Ir a la página siguiente y volver. Ver el rango correcto.
5. Escribir algo sin resultados. Ver el mensaje y "Limpiar filtros".
6. Confirmar con la persona responsable los pasos 2 a 5 antes del PR (workflow regla 7).

## 13. Decisiones pendientes (con default)

- **D-B04-1. Filtro "Estado Renaper" (B3 D-1).** Default: no se muestra (opción b de B3). El back no tiene parámetro. Si el equipo elige agregarlo, es un cambio de spec y de back.
- **D-B04-2. Filtro "Activo" (B3 D-2).** Default: no se muestra. RN15 solo lista activos.
- **D-B04-3. Menú de fila (tres puntos) y "Validar en Renaper" por fila.** Default: no se implementa. El nombre es el único enlace de la fila. Pendiente de decisión del equipo (B3 D-6).
- **D-B04-4. Ubicación del título y del botón "Nuevo cliente".** Default (RV-42): van en el slot `accion` de T-16 (DP-6: cada página pasa su acción), no dentro de `ClientesPage`.
- **D-B04-5. Aviso de alta (B-05 y B3 §7).** Default: B-05 y B-08 navegan a `/clientes` con `location.state.aviso = { tipo, texto }` (RV-41), y esta tarea lo muestra. Si el aviso no está, no pasa nada.
- **D-B04-6. Búsqueda con debounce o Enter (B3 §6).** Default: debounce de 300 ms (propuesta de B3).
- **D-B04-7. Tamaño de página (D-01 / B3 D-5).** Default: 10 filas fijas. La spec permite 20 por defecto; se envía 10 explícito.
- **D-B04-8. Texto del chip con uno o cero clientes.** Default: `1 cliente` y `0 clientes`.
- **D-B04-9. Nombre de columna.** Default: `nombre apellido` en una sola columna (B3 D-9).
- **D-B04-10. Enlace de la ficha.** Default: el nombre enlaza a `/clientes/{id}`. La ruta existe con B-07.

## 14. Riesgos y errores comunes

- **Pedir `tamanoPagina=20` por costumbre:** el diseño muestra diez. Se envía 10.
- **Enviar el DNI con puntos:** el back lo rechaza o no lo encuentra. Quitar puntos antes de la request.
- **Búsqueda con `dni` y `apellido` a la vez:** solo uno. El zod decide.
- **Olvidar reiniciar la página:** el usuario ve una página vacía al buscar.
- **Mostrar la tabla vacía en error:** engaña. Mostrar el banner y no la tabla.
- **Confundir `Pendiente` de Renaper con `Pendiente` de póliza:** son tokens distintos; el badge de cliente usa la variante de Renaper.
- **Campos no confirmados:** `cantidadVehiculos` y `cantidadPolizasActivas` pueden cambiar de nombre. Mapear en un solo lugar (`useClientes`).
- **Debounce sin limpiar el timer** al desmontar: deja requests colgadas.

## 15. Definición de terminado

- `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` en verde en `apps/backoffice`.
- Sin secretos ni credenciales en el código.
- Accesibilidad revisada con el helper de US-FE-T-19 en `/clientes`.
- Sin datos de muestra fijos, sin `any`, sin formateo manual de DNI.
- Criterios de §11 tildados con evidencia observada.

## 16. Observaciones al índice

- Resuelto (RV-41): el aviso `location.state.aviso` lo muestra esta tarea (D-B04-5) y lo producen B-05 y B-08; el INDEX lo refleja en sus filas.
- Resuelto (RV-04 / RV-42): T-11 y T-19 se agregan a las dependencias. El helper de T-19 y el mock de T-11 son usos de test declarados en §3.
- Resuelto (FC1, REVISION §1 e): B-04 es la primera tarea de `features/clientes`; dueña de `index.ts` y `routes.tsx`.
- ABIERTO: campos de `ClienteResumenResponse`. La spec (US-F1-06) no los define (B3 D-7). Esta tarea usa los de PB-03. Pedir al back confirmación antes de cerrar el contrato. Motivo: no figura en REVISION.md ni en FB8.
- Resuelto (RV-42): el título y el botón "Nuevo cliente" van en el slot `accion` de T-16 (DP-6); D-B04-4 se alinea.

