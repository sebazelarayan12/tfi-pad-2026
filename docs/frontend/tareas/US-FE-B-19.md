# US-FE-B-19: Pagos y facturas: listado

Tipo B · Oleada 4 · Tamaño M · Rama sugerida `feature/US-FE-B-19-pagos-listado` · Tarjeta Trello `US-FE-B-19`

## 1. Objetivo

Al terminar, la ruta `/pagos` (B11) muestra la tabla de pagos con filtros de medio y de estado, paginación de 10 filas y el número de factura o su estado en cada fila. El rail derecho permite buscar una póliza por número (detrás de una constante hasta PB-06, RV-D29), ver sus cuotas impagas y registrar el cobro en caja con `CobroCaja` (US-FE-B-17). Usuarios: Empleado y Administrador.

## 2. Alcance

**Entra**
- Página `apps/backoffice/src/features/pagos/pages/PagosPage.tsx` (delgada: compone).
- Ruta `/pagos` agregada a `features/pagos/routes.tsx` (creado por B-17).
- Componentes en `features/pagos/components/`: `PagosFilters` (Medio y Estado), `PagosTable` y `PagoRow`, `FacturaCell`, `Paginacion`, `CajaRail` (rail de B11, con búsqueda de póliza, `Cliente`, `Cuotas impagas`, `CobroCaja` de B-17).
- Hook `features/pagos/api/usePagosListado.ts`: `usePagosListado(filtros)` y `useBuscarPolizaPorNumero(numero)`.
- Constante `BUSQUEDA_POLIZA_NUMERO_DISPONIBLE` en `features/pagos/config.ts`, en `false` hasta PB-06 (RV-D29).
- Schema zod `schemas/filtrosPagos.ts` y `schemas/buscarPoliza.ts`.
- Tests de §10.

**NO entra**
- `CobroCaja`, `useCobrarCuotas` y `FacturaPanel`: US-FE-B-17 (esta tarea los importa de `features/pagos/index.ts`).
- Pestaña `Facturas` (ver D-B19-01): no se construye.
- Filtro `Período` (NO EXISTE el filtro en el back; ver D-B19-02).
- Reintento de factura `Reintentar` (D-12).
- Historial de bases y descarga de base positiva (US-FE-B-21).
- Topbar con campana y menú de usuario: los hace T-16.
- Búsqueda por DNI o patente: no está en la pantalla.
- Acciones de `Conciliar` (`POST /api/pagos/{id}/conciliar`): no aparece en el Figma (B11 §13 punto 15).

## 3. Dependencias

- **Oleada (INDEX):** 4.
- **Puede empezar sin esperar a:** `US-FE-B-18` (misma ficha de póliza, otra feature).
- **Depende de:** `US-FE-B-17`, `US-FE-T-04`, `US-FE-T-05`, `US-FE-T-06`, `US-FE-T-07`, `US-FE-T-11`, `US-FE-T-16`, `US-FE-T-19`, `US-FE-T-28`, `US-FE-T-29`.
- **Pedidos al back (INDEX):** PB-05 (MSW), PB-06 (MSW).
- **Degradaciones:** PB-05 (`GET /api/pagos` no existe): la tabla usa el mock de T-29. PB-06 (`GET /api/polizas?numero=` no existe): la búsqueda por número queda detrás de `BUSQUEDA_POLIZA_NUMERO_DISPONIBLE` (RV-D29). PB-16: fechas sin `Z`, T-09 las trata como UTC. PB-25: sin forma de pago, no se muestra. PB-27 y PB-28 no aplican.
- **Workaround MSW (FB7.7):** handlers de T-29 y T-28 activos con `VITE_USE_MOCKS=true`. El código de la feature nunca lee el flag (FC3).

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB3 (reglas 1 a 4), FB4, FB7.7 (MSW), FB7.9 (pagos).
- `docs/frontend/tareas/INDEX.md`: FC2 (consumo de funciones de `@nexa/api`, no hooks de otro feature), FC9 (formato de importes y fechas), FC16 (accesibilidad), D-01 (10 filas por página), D-03 (ruta de Pago Fácil, no aplica), D-12 (reintento y historial ocultos), D-19 (cuotas sin preselección), D-14 (sin forma de pago), D-24 (contraste AA).
- `docs/frontend/pantallas/B11-pagos-y-facturas.md`:
  - §2 (ruta `/pagos`, guardas).
  - §3 (estructura: topbar, tabs, filtros, tabla, paginación, rail; anchos de columnas).
  - §4 (variantes de badge; `Select`, `Input`, `Button` usados).
  - §5 (todos los textos literales: títulos, headers, filtros, `Mostrando {desde} a {hasta} de {total} pagos`, `Pendiente de CAE`, `Sin factura`, `Registrar pago en caja`, `Registrar pago`, `Se emite la factura con CAE al confirmar.`).
  - §6 (campos del rail y del filtro; formato `POL-0000001`; cuotas impagas).
  - §7 (estados: tabla, error, vacío; sin frames en el Figma para la mayoría).
  - §8 (acciones).
  - §9 (endpoints, mapeo de valores y "Contrato mínimo propuesto para el listado").
  - §13 (dudas 1, 4, 7, 8, 12, 13).
- `docs/frontend/contratos-api/pagos-facturas.md`: §3 (tipos), §6.3 y §6.4 (caja), §7.2 (campos de factura), §9.2 (un POST en vuelo).
- `docs/frontend/contratos-api/polizas-cuotas-pagofacil.md`: §5.2.1 (`PolizaListItemResponse`: verificar `id` y `numero` con T-28), §5.5 (`CuotaResponse`), §2 (`EstadoCuota`).
- `docs/frontend/contratos-api/convenciones-transversales.md`: §6.1 (`PaginaResponse<T>`: request `tamano`, response `tamanoPagina`), §5.1 (enums de `PagoResponse` como string), §5.3 (fechas).
- `docs/frontend/design-system.md`: §5.3 (Select), §5.2 (Input, helper), §5.4 (Badge/Estado), §5.12 (Table/Header y Table/Row: 40 px y 48 px), §8.3 (foco visible), §8.1 (contraste de `text/tertiary`: no usar para texto informativo).
- `docs/frontend/pedidos-al-back.md`: fichas PB-05, PB-06, PB-16, PB-25.

## 5. Archivos a crear o modificar

Bajo `frontend/apps/backoffice/src/features/pagos/`. Dueño: US-FE-B-17, salvo los indicados.

| Archivo | Acción | Nota |
|---|---|---|
| `pages/PagosPage.tsx` | crear (B-19) | Compone topbar de contenido, filtros, tabla, paginación y rail. |
| `routes.tsx` | editar (bloque, dueño B-17) | Agregar `{ path: '/pagos', element: <PagosPage /> }`. Ruta estática. |
| `index.ts` | editar (bloque, dueño B-17) | Exportar `PagosPage` solo si otra feature lo necesita; por defecto no se exporta. |
| `config.ts` | crear (B-19) | `export const BUSQUEDA_POLIZA_NUMERO_DISPONIBLE = false;` (RV-D29, PB-06). |
| `components/PagosFilters.tsx` | crear (B-19) | `Medio` y `Estado`. |
| `components/PagosTable.tsx` | crear (B-19) | Tabla con `Table/Header` y `Table/Row` de T-06. |
| `components/PagoRow.tsx` | crear (B-19) | Una fila. |
| `components/FacturaCell.tsx` | crear (B-19) | Celda `Factura`. |
| `components/Paginacion.tsx` | crear (B-19) | Conteo y `Anterior` / `Siguiente`. |
| `components/CajaRail.tsx` | crear (B-19) | Rail de cobro de B11 (§3 y §5 del Figma). Con la constante en `false`, sin campo de búsqueda (§6, paso 10). |
| `api/usePagosListado.ts` | crear (B-19) | `usePagosListado`. |
| `api/useBuscarPolizaPorNumero.ts` | crear (B-19) | Búsqueda por número. Usa la función de T-28 y la constante de `config.ts`. |
| `schemas/filtrosPagos.ts` | crear (B-19) | zod: `medio`, `estado`, `pagina`. |
| `schemas/buscarPoliza.ts` | crear (B-19) | zod: `numero` con formato `POL-\d{7}`. |
| `types/filtrosPagos.ts` | crear (B-19) | `FiltrosPagos`. |
| Tests en la misma carpeta (§10) | crear (B-19) | |

No se editan `packages/*`. Las funciones de request y las keys vienen de T-28 (pólizas) y T-29 (pagos).

## 6. Pasos de implementación

1. Confirmar que existen en `@nexa/api`: función de T-29 para `GET /api/pagos` (mock), `pagosKeys.listado(filtros)`; función de T-28 para `GET /api/polizas?numero=` (mock), `polizasKeys`; y, de B-17, `CobroCaja`, `useCobrarCuotas`. Si falta algo, pedirlo al dueño.
2. Crear `schemas/filtrosPagos.ts`:
   ```ts
   import { z } from 'zod';
   export const filtrosPagosSchema = z.object({
     medio: z.enum(['Todos', 'CAJA', 'PAGO_FACIL', 'PASARELA']).default('Todos'),
     estado: z.enum(['Todos', 'PENDIENTE', 'APROBADO', 'RECHAZADO']).default('Todos'),
     pagina: z.number().int().min(1).default(1),
   });
   ```
   El valor `'Todos'` no se envía al back: se omite el parámetro.
3. Crear `schemas/buscarPoliza.ts`: `numero` con `z.string().trim().regex(/^POL-\d{7}$/, 'Usá el formato POL-0000001.')`. El mensaje es propuesta (NO DEFINIDO en B11 §6).
4. Crear `api/usePagosListado.ts`: `useQuery` con key `pagosKeys.listado(filtros)`, `tamano: 10` (D-01), `placeholderData: keepPreviousData` (TanStack v5) para no parpadear al paginar. El filtro de período no se envía.
5. Crear `api/useBuscarPolizaPorNumero.ts`: `useQuery` con key `polizasKeys.porNumero(numero)`, `enabled` solo si `buscarPolizaSchema` valida y `BUSQUEDA_POLIZA_NUMERO_DISPONIBLE` es `true` (RV-D29). Llama `GET /api/polizas?numero=` (mock de T-28) y toma el item cuyo `numero` coincide exactamente. Si no hay coincidencia, devuelve `null`.
6. Crear `PagosFilters`: dos `Select` de T-04 (`Medio`, `Estado`), valor inicial `Todos`. Al cambiar, se vuelve a la página 1.
7. Crear `PagoRow` y `PagosTable` con `Table/Header` y `Table/Row` (T-06). Columnas, en orden, con los anchos del Figma (B11 §3): Fecha 99, Cliente 121, Póliza 102, Cuotas 50, Medio 84, Importe 102 (alineado a la derecha, mono), Estado 91, Factura 144. Texto `Cliente` y `Póliza` según §8.
8. Crear `FacturaCell` (§8 y §9): recibe `factura: { numero, estado } | null`.
9. Crear `Paginacion`: conteo `Mostrando {desde} a {hasta} de {total} pagos`, y los botones `Anterior` y `Siguiente` (`Button` secundario S de T-05). `Anterior` deshabilitado en la página 1; `Siguiente` deshabilitado en la última.
10. Crear `CajaRail`:
    - Con `BUSQUEDA_POLIZA_NUMERO_DISPONIBLE` en `false` (RV-D29), no renderiza el campo de búsqueda: muestra `Todavía no se puede buscar por número.` y no hay bloque de cuotas ni request.
    - Título `Registrar pago en caja` (16/22 SemiBold).
    - `Input` de T-04 con label `Póliza`, valor en fuente mono. La búsqueda se dispara con Enter o al salir del campo (blur) (default, D-B19-03).
    - Bloque `Cliente`: label `Cliente` y valor `No disponible` (default, ver D-B19-04).
    - Bloque `Cuotas impagas`: label y `CobroCaja` de B-17 con `cuotas` = cuotas de la póliza cargada (`polizasKeys.cuotas(id)`, de B-15 o de T-28), `etiquetaBoton="Registrar pago"` y `ayuda="Se emite la factura con CAE al confirmar."`. Sin preselección (D-19).
    - Si no hay póliza cargada, el bloque de cuotas no se muestra.
11. Crear `PagosPage`: topbar de contenido con el título `Pagos y facturas` (H2), la tabla de pagos (columna principal de 859 px) y el `CajaRail` (300 px, a la derecha, con divisor de 1 px). Por debajo de 1280 px, el rail pasa debajo de la tabla y la tabla tiene scroll horizontal dentro de su contenedor (B11 §11).
12. Agregar la ruta a `routes.tsx`.
13. Escribir los tests de §10 antes de implementar.

## 7. Contrato con el back

| Método y ruta | Estado | Uso | Forma |
|---|---|---|---|
| `GET /api/pagos` | **NO EXISTE** (PB-05). Mock de T-29. | Tabla de `/pagos`. | Ver abajo. |
| `GET /api/polizas?numero=POL-0000057` | **NO EXISTE** (PB-06). Mock de T-28. | Rail: buscar póliza, detrás de `BUSQUEDA_POLIZA_NUMERO_DISPONIBLE` (RV-D29). | `PaginaResponse<PolizaListItemResponse>` |
| `GET /api/polizas/{id}/cuotas` | Implementado | Rail: cuotas impagas. | `CuotaResponse[]` (B-15 o T-28) |
| `POST /api/pagos/caja` | Implementado | Cobro del rail (lo hace `CobroCaja`, B-17). | 201 `PagoResponse` |
| `GET /api/clientes/{id}` | Especificado (F1-06). No se llama en esta tarea. | Nombre del cliente en el rail: no disponible. | — |

Forma mínima del listado (la define T-29 como mock; es la propuesta de B11 §9):

```ts
// GET /api/pagos?medio=CAJA&estado=APROBADO&pagina=1&tamano=10   (sin desde/hasta: no existe el filtro)
// -> 200 PaginaResponse<PagoListadoResponse>
export interface PagoListadoResponse {
  id: string;
  numero: string;                  // "PAG-xxxxxx"
  fechaCreacion: string;           // ISO UTC (PB-16)
  clienteNombre: string;
  numeroPoliza: string;            // "POL-0000001"
  cuotas: number[];                // números de cuota
  medio: MedioPagoApi;             // 'CAJA' | 'PASARELA' | 'PAGO_FACIL'
  importe: number;
  estado: EstadoPago;              // 'PENDIENTE' | 'APROBADO' | 'RECHAZADO'
  factura: { numero: string; estado: EstadoFactura } | null;
}
```

Notas:
- `PaginaResponse<T>` (de `convenciones-transversales.md` §6.1): response con `items`, `pagina`, `tamanoPagina`, `total`. El request usa `tamano`.
- Búsqueda de póliza: `PolizaListItemResponse` (de `polizas-cuotas-pagofacil.md` §5.2.1). Esta tarea usa `id` y `numero`; verificar los campos al implementar.
- El mock de `GET /api/polizas?numero=` de T-28 devuelve `PaginaResponse`, no un objeto suelto. Si el back elige `GET /api/polizas/por-numero/{numero}` (alternativa de B11 §9), se cambia el hook y no la UI.

Tipos (`@nexa/api`, no se redefinen): `PagoResponse`, `FacturaResponse`, `EstadoPago`, `MedioPagoApi`, `EstadoFactura`, `CuotaResponse`, `PaginaResponse`.

## 8. Contenido de UI

Textos literales del Figma (B11 §5):

| Elemento | Texto |
|---|---|
| Título (H2) | `Pagos y facturas` |
| Tab activa | `Pagos` (no se construye la tab `Facturas`; ver D-B19-01) |
| Filtro 1 | `Período` (no se construye; ver D-B19-02) |
| Filtro 2 | `Medio` |
| Filtro 3 | `Estado` |
| Valor inicial de los selects | `Todos` |
| Headers de la tabla | `Fecha`, `Cliente`, `Póliza`, `Cuotas`, `Medio`, `Importe`, `Estado`, `Factura` |
| Conteo | `Mostrando {desde} a {hasta} de {total} pagos` |
| Botones de paginación | `Anterior`, `Siguiente` |
| Estados de pago | `Aprobado`, `Pendiente`, `Rechazado` |
| Factura con número | el número (ej. `A-0003-00000187`) |
| Factura pendiente | `Pendiente de CAE` (sin link `Reintentar`, D-12) |
| Sin factura | `Sin factura` (texto terciario en el Figma; ver contraste en §14) |
| Título del rail | `Registrar pago en caja` |
| Label del campo | `Póliza` |
| Label del bloque | `Cliente`, `Cuotas impagas` |
| Ítem de cuota | `Cuota {N}` |
| Botón | `Registrar pago` |
| Ayuda | `Se emite la factura con CAE al confirmar.` |
| Búsqueda por número no disponible (RV-D29) | `Todavía no se puede buscar por número.` (propuesta) |

Valores de ejemplo (no son texto fijo): `Lucía Benítez`, `POL-0000057`, `01/10/2026 a 28/10/2026`, `Mostrando 1 a 9 de 74 pagos`, `A-0003-00000187`.

Textos propuestos (no están en el Figma, B11 §7 "NO DEFINIDO"):

| Elemento | Texto propuesto |
|---|---|
| Columna `Cuotas` con una cuota | `{N}` |
| Columna `Cuotas` con dos o más | `{N} y {M}`; con tres o más, `{N}, {M} y {K}` |
| Tabla vacía | `No hay pagos para mostrar.` |
| Error de la tabla | `No se pudieron cargar los pagos.` + `detail` del back |
| Póliza no encontrada | `No se encontró ninguna póliza con ese número.` |
| Formato inválido de número | `Usá el formato POL-0000001.` |
| Cliente sin dato | `No disponible` |
| Cargando | skeleton de 10 filas de 48 px |

## 9. Estados y casos borde

| Caso | Comportamiento |
|---|---|
| Carga de la tabla | Skeleton de 10 filas de 48 px (B11 §7). |
| Tabla vacía | `No hay pagos para mostrar.` dentro de la tabla. |
| Error de la tabla | Texto de error con `detail` dentro del contenedor de la tabla. |
| Filtro cambia | Vuelve a página 1. Se muestra el skeleton. Los filtros no se resetean al paginar. |
| Página 1 | `Anterior` deshabilitado. |
| Última página | `Siguiente` deshabilitado. |
| Constante `BUSQUEDA_POLIZA_NUMERO_DISPONIBLE` en `false` | Sin campo de búsqueda ni request; mensaje de §8. |
| Póliza con formato inválido | No se llama a la API; se muestra el error del campo (`role` de error, `aria-invalid`). |
| Póliza no encontrada (404 o lista vacía) | Se muestra `No se encontró ninguna póliza con ese número.` en el rail; no se cargan cuotas. |
| Póliza sin cuotas impagas | `CobroCaja` muestra su estado vacío (B-17); botón deshabilitado. |
| Cobro exitoso | `CobroCaja` limpia la selección y muestra `Pago registrado.`; la tabla y las cuotas se invalidan (B-17). |
| Factura `PENDIENTE_CAE` | `Pendiente de CAE`, sin link. |
| Factura `AUTORIZADA` | Muestra el número de factura. |
| `factura: null` | `Sin factura`. |
| Doble clic en `Registrar pago` | Un solo POST (B-17). |
| Viewport < 1280 px | Rail debajo de la tabla; tabla con scroll horizontal. |
| Rol | Empleado y Administrador. Sin acceso: pantalla de acceso denegado (NO DEFINIDO en B11 §2); el back responde 403. |

## 10. Tests requeridos

Los tests 12 a 17 sobreescriben `BUSQUEDA_POLIZA_NUMERO_DISPONIBLE` en `true`, como en B-14.

Herramientas: Vitest, Testing Library, MSW (handlers de T-29 y T-28 con `server.use`), `vitest-axe`.

`pages/PagosPage.test.tsx`:
1. `tabla_muestra_headers_del_figma`: aparecen `Fecha`, `Cliente`, `Póliza`, `Cuotas`, `Medio`, `Importe`, `Estado`, `Factura`, en ese orden.
2. `filtros_envian_medio_y_estado_al_listado`: elegir `Caja` y `Aprobado` genera una request con `medio=CAJA&estado=APROBADO`.
3. `todos_no_envia_parametro`: con `Todos`, la request no tiene `medio` ni `estado`.
4. `paginacion_muestra_conteo_y_botones`: con `total: 74`, `pagina: 1`, `tamanoPagina: 10`, aparece `Mostrando 1 a 10 de 74 pagos`; `Anterior` deshabilitado.
5. `no_muestra_tab_facturas_ni_filtro_periodo`: no existen `Facturas` ni `Período`.
6. `tabla_vacia_muestra_mensaje`.
7. `error_muestra_detail`.
8. `a11y_sin_violaciones`: `vitest-axe` sobre la página con datos.

`components/FacturaCell.test.tsx`:
9. `pendiente_cae_sin_link_reintentar`: no existe el texto `Reintentar`; aparece `Pendiente de CAE`.
10. `autorizada_muestra_numero`: aparece `A-0003-00000187`.
11. `null_muestra_sin_factura`.

`components/CajaRail.test.tsx`:
12. `formato_invalido_no_llama_api`: `POL-123` no genera request (contador en MSW = 0) y muestra `Usá el formato POL-0000001.`.
13. `numero_valido_carga_cuotas_impagas`: con `POL-0000057` la lista muestra `Cuota 8`, `Cuota 9`; no muestra cuotas Pagadas.
14. `sin_preseleccion`: ninguna cuota marcada (D-19).
15. `cliente_muestra_no_disponible`.
16. `registrar_pago_envia_cuotas_seleccionadas`: marcar `Cuota 8` y pulsar `Registrar pago` envía `cuotaIds` con el id de esa cuota.
17. `numero_no_encontrado_muestra_mensaje`.

`api/usePagosListado.test.tsx`:
18. `filtros_no_envian_periodo`: la request no tiene `desde` ni `hasta`.
19. `busqueda_oculta_con_constante_false`: con la constante en `false`, no hay campo de búsqueda, no hay request por número y aparece `Todavía no se puede buscar por número.`.

## 11. Criterios de aceptación

1. La ruta `/pagos` existe y la página muestra el título `Pagos y facturas` (H2).
2. La tabla muestra los 8 headers de §8, en orden, con los anchos del Figma.
3. Los filtros `Medio` y `Estado` tienen valor inicial `Todos` y envían solo los valores elegidos.
4. La paginación usa 10 filas por página (D-01) y muestra `Mostrando {desde} a {hasta} de {total} pagos`.
5. No se muestran la pestaña `Facturas`, el filtro `Período` ni el link `Reintentar` (D-12).
6. La columna `Factura` muestra el número cuando la factura está autorizada, `Pendiente de CAE` sin link cuando está pendiente y `Sin factura` cuando no existe.
7. Con `BUSQUEDA_POLIZA_NUMERO_DISPONIBLE` en `false` (RV-D29), el rail no busca por número ni hace requests (test 19). Con `true`, la búsqueda usa el formato `POL-0000001` y un formato inválido no llama a la API (test 12).
8. El rail muestra solo cuotas Pendiente o Vencida, sin preselección (tests 13 y 14).
9. `Registrar pago` usa `CobroCaja` de B-17 con la ayuda `Se emite la factura con CAE al confirmar.`.
10. El cliente del rail muestra `No disponible` (sin endpoint).
11. Ninguna fecha ni importe se formatea a mano (T-09); ningún enum se muestra como número (T-10).
12. Los tests 1 a 19 están en verde.
13. `npm run lint`, `typecheck`, `test` y `build` están en verde en `apps/backoffice`.

## 12. Verificación manual

1. Con `VITE_USE_MOCKS=true`, abrir `/pagos`.
2. Verificar la tabla: 10 filas, la columna `Factura` con número, `Pendiente de CAE` y `Sin factura`.
3. Filtrar por `Medio` = `Caja` y verificar que la tabla cambia.
4. Paginar con `Siguiente` y verificar el conteo.
5. Con la constante en `false` (rama principal), el rail muestra `Todavía no se puede buscar por número.`. Con la constante en `true` (solo en el entorno del equipo), escribir `POL-0000057` y pulsar Enter: verificar `Cuota 8` y `Cuota 9` y que no aparecen cuotas Pagadas.
6. Marcar una cuota y pulsar `Registrar pago`. Verificar `Pago registrado.`.
7. Con la constante en `true`, escribir `POL-123` y verificar el mensaje de formato.
Confirmar los resultados antes de abrir el PR (regla 7 de `docs/workflow.md`).

## 13. Decisiones pendientes con default

- **D-B19-01: pestaña `Facturas`.** B11 §8: "NO DEFINIDO" (sin frame). Default: no se construye. Confirmar con diseño.
- **D-B19-02: filtro `Período`.** No hay endpoint ni rango en el back (B11 §6). Default: no se muestra. Si se agrega el endpoint, se suma el filtro.
- **D-B19-03: disparo de la búsqueda de póliza.** B11 §6: NO DEFINIDO. Default: Enter o al salir del campo.
- **D-B19-04: `Cliente` en el rail.** Requiere `GET /api/clientes/{id}`, que no está en PR #50 (B11 §13, punto 8). Default: `No disponible` (FB7.11).
- [CONFIRMAR] **D-B19-05 (D-19 y RV-D11): selección de cuotas.** Default: ninguna preseleccionada (D-19), aunque el Figma marca las cuotas 6 y 7; la selección por cuota queda en esta tarea. No cerrar sin confirmación del equipo: producto, antes de B-18.
- **D-B19-06 (RV-D13): forma del listado. Resuelto.** `PaginaResponse<PagoListadoResponse>` (B11 §9). PB-05 se actualiza en el doc PR para que el back lo confirme.
- **D-B19-07: tamaño de página.** D-01 dice 10; el Figma muestra 9 filas y `de 74`. Default: 10.
- **D-B19-08 (RV-D29): búsqueda por número del rail.** Default: `BUSQUEDA_POLIZA_NUMERO_DISPONIBLE = false` hasta que PB-06 publique `numero`. No se activa con `VITE_USE_MOCKS`.

## 14. Riesgos y errores comunes

- **Contraste de `Sin factura` y de `Pendiente de CAE`.** El Figma usa `text/tertiary` (3,30:1, `design-system.md §8.1`). Default: usar `text/secondary` para texto informativo y reservar tertiary para deshabilitados.
- **Búsqueda de póliza sin endpoint.** El mock de T-28 es la única fuente hasta PB-06. No asumir que `numero` es un filtro parcial.
- **Cuotas de una póliza `Vencida`.** Sin regla del back (PB-30). La UI muestra la cuota como impaga y permite cobrar hasta que el back decida.
- **Filtros y caché.** Cambiar un filtro debe cambiar la key `pagosKeys.listado(filtros)`; si la key no incluye los filtros, la tabla muestra datos viejos.
- **Caja con póliza sin cliente.** `CobroCaja` no conoce al cliente. Si el back rechaza cuotas de dos clientes, mostrar el `detail`.

## 15. Definición de terminado

- `npm run lint`, `typecheck`, `test` y `build` en verde.
- Accesibilidad revisada con T-19 en `/pagos` (tabla con `scope="col"` y `caption` visual oculto `Pagos`).
- Sin secretos ni credenciales.
- Criterios 1 a 13 de §11 tildados con evidencia observada.

## 16. Observaciones al índice

- Resuelto (RV-D29): el filtro de búsqueda por número del rail queda detrás de `BUSQUEDA_POLIZA_NUMERO_DISPONIBLE` hasta PB-06 (ver §13, D-B19-08).
- Resuelto (triage final, default de la ficha): el INDEX no lista T-04 (Select, Input), T-05 (Button, Badge) ni T-07 (Card) que esta tarea usa directamente. Motivo: la observación no aparece en REVISION.md ni en FB8.
