# US-FE-B-13: Pólizas: listado y filtro por estado

Tipo: B · Oleada: 4 · Tamaño: M · Rama sugerida: `feature/US-FE-B-13-polizas-listado` · Tarjeta Trello: `US-FE-B-13`

## 1. Objetivo

El Empleado o Administrador ve el listado paginado de pólizas en `/polizas`, filtra por estado con chips de selección única y entra al detalle de una póliza desde su número. Queda creado el feature `features/polizas`, dueño de su `index.ts` y de su `routes.tsx`, que B-12, B-14, B-15, B-16 y B-18 completan después.

El buscador y el filtro por plan no se muestran en esta tarea: el buscador es B-14 y el filtro por plan está bloqueado por PB-06.

## 2. Alcance

**Entra**
- Ruta `/polizas` (propuesta de B9 §2), guardas de sesión y rol.
- Chips de estado (Todas, Pendiente, Vigente, Suspendida, Cancelada, Vencida) como radiogroup de selección única.
- Tabla con columnas Número, Cliente, Vehículo, Plan, Vigencia, Estado y Próx. vencimiento, con los campos que sí existen en la lista.
- Paginación con `tamano=10` y botones Anterior y Siguiente.
- Estados de carga, vacío, error y error de filtro (400).
- Filtros en la URL (`estado`, `pagina`).
- Botón "Emitir póliza" en la cabecera.
- Tests.

**No entra**
- Buscador por número, DNI o patente (B-14).
- Filtro por plan y su select (PB-06: se oculta).
- Conteos en los chips (D4 de B9, sin endpoint).
- Menú "⋯" por fila (D9 de B9): el número ya es el enlace al detalle.
- Detalle de póliza (B-15).
- Topbar, campana y sidebar (T-16).

## 3. Dependencias

- **Oleada (INDEX):** 4.
- **Puede empezar sin esperar a:** `US-FE-B-10` (solo navegación a la emisión).
- **Depende de:** `US-FE-T-04`, `US-FE-T-05`, `US-FE-T-06`, `US-FE-T-09`, `US-FE-T-10`, `US-FE-T-11`, `US-FE-T-13`, `US-FE-T-16`, `US-FE-T-19`, `US-FE-T-28`.
- **Pedidos al back (INDEX):** PB-06 (filtro de plan oculto).
- **Degradaciones:** D1 de B9 (cliente), D5 (próximo vencimiento) y D6 (marca, modelo y año): se muestran como "No disponible" (FB7.11, DP-B13-01).
- **Workaround MSW:** no aplica; `GET /api/polizas` está Implementado. Los tests usan el mock de T-28.
- Nombres de keys (`polizasKeys.lista(filtros)`) y funciones son sugeridos; los exporta T-28.

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB3 (estructura y ownership), FB4 (enums y fechas), FB5, FB7.7, FB7.10 (sidebar), FB7.11.
- `docs/frontend/tareas/INDEX.md`: fila `US-FE-B-13`; FC1 (dueño de `index.ts`), FC2, FC9, FC10, FC14, FC16; "Ownership" (`features/polizas/routes.tsx` e `index.ts`); D-01 (10 filas), D-03 (ruta única de Pago Fácil, no afecta).
- `docs/frontend/pantallas/B9-polizas.md`: §2 (ruta y query), §3 (estructura, sin el rail), §4 (componentes), §5 (textos literales), §6 (paginación y estado de los filtros), §7 (estados), §8 (acciones de la lista), §9 (campos de la tabla y origen), §11, §12 (accesibilidad de tabla, chips y paginación), §13 D4, D5, D6, D8, D9, D11, D12, D14.
- `docs/frontend/contratos-api/polizas-cuotas-pagofacil.md`: §1.3 (enums en query: nombre; en JSON: número), §1.4 (dos formas de error), §2 (`PaginaResponse`), §3.1 (estados), §5.2 (`GET /api/polizas`, `PolizaFiltroQuery`), §5.2.1 (`PolizaListItemResponse`).
- `docs/frontend/design-system.md`: §5.5 (Chip), §5.4 (Badge/Estado), §5.12 (Table), §5.1 (Button), §8.3 (foco).
- `docs/frontend/pedidos-al-back.md`: PB-06, PB-16 (formato de fechas).

## 5. Archivos a crear o modificar

Todos bajo `frontend/apps/backoffice/src/features/polizas/` (dueño: B-13).

| Archivo | Acción |
|---|---|
| `routes.tsx` | Implementa el stub de T-14 con la ruta `/polizas`. Dueño B-13 |
| `index.ts` | Crea. Exporta las rutas del feature |
| `pages/PolizasListadoPage.tsx` | Crea |
| `components/PolizasFiltros.tsx` | Crea. Solo chips de estado |
| `components/PolizasTabla.tsx` | Crea |
| `components/PolizaVehiculoCelda.tsx` | Crea. Línea 1 "No disponible"; línea 2 patente en mono |
| `components/PaginacionPolizas.tsx` | Crea |
| `api/usePolizasListado.ts` | Crea. `useQuery` sobre `GET /api/polizas` |
| `schemas/polizasListadoQuery.ts` | Crea. zod para los parámetros de la URL |
| `**/*.test.ts(x)` | Crea |

Sin editar: `app/router.tsx` (T-14), `packages/api/**` (T-28), `packages/ui/**` (T-05, T-06).

## 6. Pasos de implementación

1. Leer la fila de B-13. Confirmar las dependencias de §3 (T-04, T-05, T-06, T-09, T-10, T-11, T-13, T-16, T-19 y T-28).
2. **RED:** escribir los tests de `polizasListadoQuery` y de la query enviada (§10).
3. `polizasListadoQuery` (zod):
   - `estado` opcional, uno de los nombres `Pendiente | Vigente | Suspendida | Cancelada | Vencida` (por nombre, no por número: contrato §1.3).
   - `pagina` entero mayor o igual a 1, por defecto 1.
   - Valores inválidos en la URL caen al valor por defecto (no bloquean la pantalla).
4. `usePolizasListado(filtros)`: `useQuery` con key `polizasKeys.lista(filtros)` y `placeholderData: keepPreviousData` (para mantener la tabla durante el cambio de página). Envía `pagina`, `tamano=10` y `estado` solo si hay un estado elegido. Nunca envía `numero`, `dni` ni `planCodigo` (no existen en el back, PB-06).
5. Cambiar el chip de estado: actualiza la URL con `estado` y `pagina=1`. Elegir "Todas" quita el parámetro `estado`.
6. Cambiar de página: actualiza `pagina`. Anterior queda deshabilitado en la página 1; Siguiente, en la última (`pagina * tamano >= total`).
7. `PolizasTabla`: `<table>` con `<caption>` oculto `Pólizas`; encabezados con `scope="col"`. Filas con altura de 48 px (T-06). Columnas:
   - Número: `<a href="/polizas/{id}">` en mono (el enlace es el elemento clicable; B9 §12).
   - Cliente: "No disponible" (DP-B13-01).
   - Vehículo: `PolizaVehiculoCelda` con "No disponible" arriba y patente en mono abajo.
   - Plan: `codigoPlan`.
   - Vigencia: `{dd/MM/yyyy} a {dd/MM/yyyy}` desde `fechaInicio` y `fechaFin` (DateOnly, T-09).
   - Estado: `Badge` con la etiqueta de T-10 para `EstadoPoliza`.
   - Próx. vencimiento: "No disponible" (DP-B13-01).
8. `PolizasFiltros`: radiogroup con etiqueta `Estado de la póliza`. Seis `Chip` (`Seleccionado` para el activo, `Sin seleccionar` para el resto). Flechas para moverse entre chips.
9. Cabecera: h1 `Pólizas` y botón `Emitir póliza` que navega a `/clientes` (DP-B13-03).
10. Estados de §9. El estado vacío y los de error van dentro de la tabla.
11. Mapeo de errores: 400 de filtro muestra `detail` y conserva la tabla anterior (`placeholderData`). 5xx o red muestra `AlertaError` con botón `Reintentar` (es un GET).
12. `routes.tsx` (B-13) declara `/polizas`. Las rutas `/polizas/nueva` (B-12) y `/polizas/:id` (B-15) se agregan después, en ese orden (FC14).
13. GREEN, luego refactor. `lint`, `typecheck`, `test` y `build`.

## 7. Contrato con el back

| Método y ruta | Estado | Uso |
|---|---|---|
| `GET /api/polizas?estado=&pagina=&tamano=` | Implementado | Listado. Devuelve `PaginaResponse<PolizaListItemResponse>`. |

Query (dueño T-28; no se redefine):

```ts
export interface PolizaFiltroQuery {
  estado?: EstadoPolizaNombre; // nombre, p. ej. "Vigente"
  pagina?: number;             // 1..int.MaxValue/100
  tamano?: number;             // 1..100; aquí siempre 10
}
```

Respuesta (`polizas-cuotas-pagofacil.md §5.2.1`):

```ts
export interface PolizaListItemResponse {
  id: string;
  numero: string;        // "POL-0000001"
  clienteId: string;     // no trae el nombre (D1 de B9)
  patente: string;
  codigoPlan: string;    // "RC" | "TC" | "TR"
  primaMensual: number;
  fechaInicio: string;   // yyyy-MM-dd
  fechaFin: string;      // yyyy-MM-dd
  estado: EstadoPoliza;  // número: 0 Pendiente, 1 Vigente, 2 Suspendida, 3 Cancelada, 4 Vencida
}
```

Errores: 400 de validación de framework (`errors.pagina` o `errors.tamano`, o `estado` inválido), con forma `ValidationProblemDetails`; 401; 403. La pantalla muestra el `detail` de la forma `ProblemDetails` y no marca campos (es un filtro de URL).

Campos que faltan (PB-06, D1, D5, D6): cliente, marca, modelo, año y próximo vencimiento. Se muestran como "No disponible" (FB7.11).

Handler MSW: `GET /api/polizas` (T-28). Los tests sobreescriben con `server.use(...)`.

## 8. Contenido de UI (literal)

| Zona | Texto |
|---|---|
| Título (h1) | `Pólizas` |
| Botón | `Emitir póliza` |
| Chips | `Todas`, `Pendiente`, `Vigente`, `Suspendida`, `Cancelada`, `Vencida` (sin conteo, DP-B13-02) |
| Radiogroup | `Estado de la póliza` |
| Caption de tabla (oculto) | `Pólizas` |
| Encabezados | `Número`, `Cliente`, `Vehículo`, `Plan`, `Vigencia`, `Estado`, `Próx. vencimiento` |
| Valor vacío de cliente, vehículo y próximo vencimiento | `No disponible` (DP-B13-01) |
| Paginación | `{desde}-{hasta} de {total}` (por ejemplo `1-10 de 390`) |
| Botones | `Anterior`, `Siguiente` |
| Sin resultados | `No hay pólizas que coincidan con los filtros.` (DP-B13-04) |

Los datos de ejemplo del Figma (`POL-0000035`, `Ezequiel Robles`, `Ford Ranger 2017`) no se usan como texto fijo (FC4).

## 9. Estados y casos borde

| Caso | Comportamiento |
|---|---|
| Cargando (primera carga) | Skeleton de 10 filas. Paginación deshabilitada. |
| Cargando (cambio de página o filtro) | Se mantiene la tabla anterior con `aria-busy="true"`. |
| Éxito con datos | Tabla, rango de paginación y chip seleccionado. |
| Vacío | Texto DP-B13-04 dentro de la tabla, sin filas. |
| Error 5xx o red | `AlertaError` con `detail` (o DP-B13-05) y botón `Reintentar`. |
| Error 400 de filtro | Se conserva la tabla anterior y se muestra el `detail` en `AlertaError`. |
| Estado en la URL no válido | Cae a "Todas" (sin error visible). |
| Página fuera de rango | El back devuelve lista vacía; se muestra el estado vacío y el rango `0-0 de {total}`. |
| Anterior en página 1 | Deshabilitado con `aria-disabled="true"`. |
| Siguiente en la última página | Deshabilitado. |
| Cambio de chip | Vuelve a `pagina=1`. |
| Permisos | Empleado o Administrador (T-13). Sin sesión, `/login`. |

## 10. Tests requeridos

| Test | Afirma | Herramienta |
|---|---|---|
| `query: estado inválido en la URL cae a Todas` | Sin parámetro `estado` | Vitest |
| `query: pagina < 1 cae a 1` | Valor por defecto | Vitest |
| `request: primera carga envía pagina=1 y tamano=10 sin estado` | Query exacta de MSW | Testing Library + MSW |
| `request: elegir Vigente envía estado=Vigente` | Nombre, no número | Testing Library + MSW |
| `request: nunca envía numero, dni ni planCodigo` | Ausencia de esos parámetros | Testing Library + MSW |
| `chips: solo uno seleccionado a la vez` | `aria-checked` único | Testing Library |
| `chips: cambiar estado vuelve a pagina=1` | Query con `pagina=1` | Testing Library + MSW |
| `paginación: rango 1-10 de 390 en la primera página` | Texto exacto | Testing Library + MSW |
| `paginación: Anterior deshabilitado en la página 1` | `aria-disabled` | Testing Library |
| `paginación: Siguiente deshabilitado en la última` | `aria-disabled` | Testing Library |
| `tabla: el número es un enlace a /polizas/:id` | `href` correcto | Testing Library |
| `tabla: vigencia con formato dd/MM/yyyy a dd/MM/yyyy` | Texto de fechas DateOnly | Testing Library |
| `tabla: estado muestra la etiqueta de T-10` | Badge con texto (no solo color) | Testing Library |
| `tabla: cliente, vehículo y próximo vencimiento dicen No disponible` | Texto exacto | Testing Library |
| `tabla: vehículo muestra la patente en mono` | Clase `font-mono` | Testing Library |
| `vacío: muestra el texto DP-B13-04` | Sin filas y texto | Testing Library + MSW |
| `error 5xx: muestra AlertaError y Reintentar` | `role="alert"` y botón | Testing Library + MSW |
| `error 400: conserva la tabla anterior y muestra detail` | Tabla visible y alerta | Testing Library + MSW |
| `cabecera: Emitir póliza navega a /clientes` | Ruta final | Testing Library |
| `a11y: caption oculto y th scope=col` | Estructura de tabla | Testing Library |
| `a11y: sin violaciones con datos` | Axe sin violaciones | vitest-axe (T-19) |

## 11. Criterios de aceptación

1. La ruta `/polizas` renderiza para Empleado o Administrador dentro de `LayoutBackoffice`.
2. La primera carga envía `pagina=1` y `tamano=10`, sin `estado`.
3. Elegir un estado envía su nombre (no su número) y vuelve a `pagina=1`.
4. Solo un chip está seleccionado a la vez; ninguno muestra conteo.
5. Los parámetros `numero`, `dni` y `planCodigo` nunca se envían.
6. El rango muestra `{desde}-{hasta} de {total}` según la página.
7. Anterior y Siguiente se deshabilitan en los extremos con `aria-disabled`.
8. El número de cada fila es un enlace a `/polizas/{id}`.
9. Las vigencias muestran `dd/MM/yyyy a dd/MM/yyyy`.
10. El estado se muestra como texto con la etiqueta de T-10.
11. Cliente, vehículo (línea superior) y próximo vencimiento muestran "No disponible".
12. Sin resultados, aparece el texto DP-B13-04.
13. Un 5xx o error de red muestra alerta y botón Reintentar; un 400 conserva la tabla anterior.
14. No aparecen el buscador, el select de plan, ni los conteos de chips.
15. Todos los tests de §10 están en verde, sin axe violations.
16. `lint`, `typecheck`, `test` y `build` del backoffice están en verde.

## 12. Verificación manual

1. `VITE_USE_MOCKS=true npm run dev -w apps/backoffice`, sesión de Empleado.
2. Abrir `/polizas`: 10 filas y rango `1-10 de {total del mock}`.
3. Elegir `Vigente`: la URL tiene `estado=Vigente` y la página vuelve a 1.
4. Ir a Siguiente y volver a Anterior; Anterior queda deshabilitado en la página 1.
5. Clic en un número de póliza: navega a `/polizas/{id}`.
6. Con un escenario de error 500 del mock: aparece la alerta y el botón Reintentar.

Confirmar al responsable antes del PR.

## 13. Decisiones pendientes

- **DP-B13-01** Cliente, vehículo (línea superior) y próximo vencimiento, por falta de datos (D1, D5, D6 de B9). Default: `No disponible`. Alternativas: N+1 con `GET /api/clientes/{id}` (agrega dependencia de T-24) o un campo nuevo en la lista (PB nuevo).
- **DP-B13-02** Conteos de los chips (D4 de B9). Default: sin conteo. Alternativa: seis llamadas o endpoint de conteos.
- **DP-B13-03** (RV-D12, default aplicado) Destino del botón "Emitir póliza" (D-B13): B8 espera `cotizacionId`; no hay pantalla para elegir cotización sin pasar por B-10. Default: `/clientes`, donde el empleado elige cliente, vehículo y cotización.
- **DP-B13-04** Texto de lista vacía (B9 §7, NO DEFINIDO). Default: `No hay pólizas que coincidan con los filtros.`
- **DP-B13-05** Texto de error sin `detail`. Default: `No se pudieron cargar las pólizas. Intentá de nuevo.`
- **DP-B13-06** Menú "⋯" por fila (D9). Default: no se implementa; el número ya es el enlace al detalle.
- **DP-B13-07** Orden de la lista: el back ordena por `fechaEmision` descendente (contrato §5.2). Default: no se ofrece ordenamiento por columna.
- **PB-06** (bloquea el filtro por plan): se oculta el select. Se reactiva cuando el back publique `planCodigo`.
- **D-01** (índice): 10 filas por página (`tamano=10`). Implementado.

## 14. Riesgos y errores comunes

- Enviar `estado` como número: el back lo espera como nombre en la query (contrato §1.3).
- Mostrar el nombre del cliente llamando a `GET /api/clientes/{id}` por fila sin decidir DP-B13-01: es N+1 y no está en las dependencias del índice.
- Llamar a `GET /api/vehiculos/{id}` por fila: la lista no trae `vehiculoId` (D6 de B9), así que no se puede.
- Usar `GET /api/planes` para el select de plan: el select está oculto (PB-06); la llamada no hace falta.
- Filtrar por plan o número en el front sobre la página actual: da resultados incorrectos (D3 de B9).
- Perder la tabla al cambiar de página: usar `placeholderData`.
- Mezclar el número del badge con la etiqueta (`0` en vez de `Pendiente`): usar T-10.

## 15. Definición de terminado

- `lint`, `typecheck`, `test` y `build` del backoffice en verde.
- Todos los criterios de §11 tildados con evidencia observada.
- Accesibilidad revisada con T-19 (tabla, radiogroup de chips y paginación).
- El archivo `routes.tsx` y `index.ts` de `features/polizas` quedan listos para que B-12, B-14, B-15 y B-16 agreguen sus bloques.
- Pasos de §12 entregados y confirmados antes del PR a `development`.

## 16. Observaciones al índice

- Resuelto (RV-31): se quitó `GET /api/vehiculos/{id}` de la fila. La lista no trae `vehiculoId`, así que la celda de vehículo muestra "No disponible" hasta un PB nuevo.
- Resuelto (RV-31): se quitó `GET /api/planes` de la fila. El select de plan está oculto por PB-06.
- Resuelto (RV-04 / RV-31): la fila suma T-05, T-09, T-10 y T-13 a "Depende de". T-27 queda fuera mientras el select esté oculto.
- Resuelto (RV-D12): "Emitir póliza" lleva a `/clientes`.
