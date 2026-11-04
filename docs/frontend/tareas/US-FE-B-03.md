# US-FE-B-03: Inicio del backoffice: cuotas vencidas recientes, promo de rendición y línea de resumen

Tipo: B · Oleada: 5 · Tamaño: M · Rama sugerida: `feature/US-FE-B-03-inicio-cuotas-promo` · Tarjeta Trello: `US-FE-B-03`

Pantalla: [B2 Inicio](../pantallas/B2-inicio.md). Índice: [INDEX](INDEX.md), fila US-FE-B-03.

---

## 1. Objetivo

Completar `/inicio` con tres piezas que faltaban en B-02: el widget "Cuotas vencidas recientes" (tabla de cinco filas en la columna principal), la tarjeta promo "Rendición de Pago Fácil disponible" (rail, solo si el día no tiene rendición) y la línea de resumen del saludo con la fecha de corte del servidor. Para: empleados y administradores. Esta tarea crea el feature `features/cuotas`.

## 2. Alcance

**Entra**
- `features/cuotas` (feature nuevo, dueño B-03): `WidgetCuotasVencidas`, `TablaCuotasVencidas` y su hook de lectura.
- Widget "Cuotas vencidas recientes" con cinco filas, estados de carga, vacío y error.
- Tarjeta `PromoRendicion` en `features/inicio/components/` con su visibilidad.
- Línea de resumen del saludo: `Hay {n} cuotas vencidas y {m} pólizas pendientes de pago al {fecha}.`, con la fecha de `fechaCorte` del resumen de inicio.
- Mock `packages/api/mocks/handlers/inicio.ts` (solo para `GET /api/inicio/resumen`, PB-08).
- Edición de `InicioPage.tsx` (dueño B-02) para ubicar las piezas nuevas, en el PR de esta tarea.

**NO entra**
- KPI 4 "Cuotas vencidas hoy", saludo, KPIs de pólizas y anillo: **US-FE-B-02** (ya hechos; esta tarea los reutiliza).
- Widget "Tareas del día": oculto (D-11). No se construye.
- Botón "Ver todas" del widget de cuotas: destino NO DEFINIDO (B2 §8). No se implementa (sección 13).
- Pantalla de cuotas por listado completo: no existe en el diseño.
- Request de `GET /api/cuotas` y su mock (T-28) y request de rendiciones (T-30).
- Ruta `/pago-facil` y su pantalla: **US-FE-B-20** y B-21.
- Formateadores de importe y fecha (T-09), tabla `Table` (T-06), `Badge` (T-05), mapa de enums (T-10).

## 3. Dependencias

- **Oleada:** 5.
- **Depende de:** US-FE-B-02, US-FE-T-05, US-FE-T-06, US-FE-T-09, US-FE-T-10, US-FE-T-11, US-FE-T-19, US-FE-T-28, US-FE-T-30.
- **Puede empezar sin esperar a:** US-FE-B-04 (listado de clientes; sin relación de datos).
- **Bloqueada por pedidos al back:** PB-08 (MSW; la línea de resumen usa un mock propio) y PB-24 (MSW; el widget usa el mock de T-28). Ver sección 7.

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB3 (features y reglas 1 a 5), FB4 (fechas `dd/mm/aaaa`, importes), FB7.7, FB7.11.
- `docs/frontend/pantallas/B2-inicio.md`: §3 (widget de cuotas, rail y promo, medidas), §4 (`Table/Header`, `Table/Row`, `Badge/Estado`, componentes propios), §5 (textos de cuotas, promo y saludo), §6 (no aplica), §7 (estados del widget y de la promo), §8 (acciones de fila y promo), §9 (filas de cuotas, fecha de corte, promo y "Historial de rendiciones"), §10 (RN08, RN18, estados de cuota), §12 (tabla con caption y th), §13 (D-2, D-4, D-8, D-12, D-13).
- `docs/frontend/contratos-api/polizas-cuotas-pagofacil.md`: §1.3 (enum de cuota: número en la respuesta), §3.3 (ciclo de la cuota), §5.5 (`CuotaResponse`), §7.3 (`HistorialRendicionResponse`, lista sin paginación).
- `docs/frontend/contratos-api/convenciones-transversales.md`: §5.1 (enums), §5.3 (fechas), §5.4 (dinero), §6.1 (paginación).
- `docs/frontend/design-system.md`: §5.4 (Badge/Estado: `Vencida`), §5.12 (Table/Header y Table/Row: anchos, alturas), §5.5 (Chip, no se usa aquí), §5.1 (Button Secondary S para "Ir a rendición"), §5.13 (Card/Widget).
- `docs/frontend/pedidos-al-back.md`: PB-08 (contrato propuesto de `ResumenInicioResponse`), PB-24 (contrato propuesto de la lista).
- `docs/frontend/tareas/INDEX.md`: FC2 (keys, hooks por feature), FC4 (sin datos de muestra fijos), FC9 (formateadores), FC13 (cliente único), FC16.

## 5. Archivos a crear o modificar

Bajo `frontend/apps/backoffice/src/` (salvo que se indique):

| Archivo | Dueño | Notas |
|---|---|---|
| `features/cuotas/index.ts` | US-FE-B-03 | Primer task de `features/cuotas`. Exporta `WidgetCuotasVencidas`. |
| `features/cuotas/components/WidgetCuotasVencidas.tsx` | US-FE-B-03 | Card/Widget con título y estados. Ver sección 16 sobre el nombre `CuentaWidget`. |
| `features/cuotas/components/TablaCuotasVencidas.tsx` | US-FE-B-03 | `Table` de T-06 con caption y `th scope="col"`. |
| `features/cuotas/api/useCuotasVencidas.ts` | US-FE-B-03 | Hook `useQuery` sobre la request de T-28 con `estado: "Vencida"`, `pagina: 1`, `tamano: 5`, `orden: "fechaVencimiento"`. |
| `features/inicio/api/useResumenInicio.ts` | US-FE-B-03 | Request `GET /api/inicio/resumen` con el cliente de T-08 y su hook. Excepción a FC2 hasta PB-08 (RV-D16). |
| `features/inicio/types/resumenInicio.ts` | US-FE-B-03 | Tipo `ResumenInicioResponse`. |
| `features/inicio/components/PromoRendicion.tsx` | US-FE-B-03 | Tarjeta promo. Ubicación por default en `features/inicio` (RV-37). |
| `features/inicio/api/useRendicionPendienteHoy.ts` | US-FE-B-03 | Lee el historial de T-30 y decide la visibilidad. |
| `features/inicio/components/SaludoInicio.tsx` | US-FE-B-02 | B-03 agrega la línea de resumen. Declara la dependencia. |
| `features/inicio/pages/InicioPage.tsx` | US-FE-B-02 | B-03 agrega el widget en la columna principal y la promo en el rail. |
| `packages/api/mocks/handlers/inicio.ts` | US-FE-B-03 | Llena el placeholder de T-11 (RV-13). Solo `GET /api/inicio/resumen`. |
| `packages/api/mocks/handlers/index.ts` | US-FE-T-11 | Solo para registrar el export de `inicio.ts` en el mismo PR, acordado con T-11 (RV-13). |

No editar: `packages/api/src/dto/*` (T-28 y T-30), `packages/ui/*`, `app/*`, `features/auth/*`, `package.json` (FC17).

## 6. Pasos de implementación

1. Confirmar que B-02, T-05, T-06, T-09, T-10, T-11, T-19, T-28 y T-30 están mergeadas. Leer los exports reales (`listarCuotas`, `CuotaListItem`, `listarRendiciones`, `HistorialRendicionResponse`); los nombres de §7 son sugeridos.
2. Crear `features/inicio/types/resumenInicio.ts` y `features/inicio/api/useResumenInicio.ts` (request con el cliente de T-08 y hook con `retry: false`). No crear nada en `features/cuotas` para el resumen.
3. Crear `handlers/inicio.ts` con el mock de `GET /api/inicio/resumen`. Usar fixtures de `packages/api/mocks/fixtures` (T-11), no datos nuevos en el archivo de handler.
4. Crear `useCuotasVencidas`: una query con la key `cuotasKeys.lista(filtro)` (de T-28). Sin reintento automático para errores 4xx.
5. Crear `TablaCuotasVencidas`: columnas `Cliente`, `Póliza`, `Cuota y vencimiento`, `Importe`, `Estado`. Anchos del Table/Header de design-system §5.12 para dos o más columnas. La tabla va en un contenedor con `overflow-x: auto`, nunca en la página.
6. Formatear: importe = `importe + recargo` con el formateador de T-09 (FC9); fecha con `DateOnly` sin zona. El estado se convierte con el mapa de cuotas de T-10 y se muestra con `Badge` (`Vencida`).
7. `WidgetCuotasVencidas`: título `Cuotas vencidas recientes`, sin link "Ver todas" (sección 13). Estados: skeleton de cinco filas de 49 px; vacío; error con "Reintentar".
8. `PromoRendicion`: solo si `useRendicionPendienteHoy` dice que no hay rendición del día (ver §8, regla de visibilidad). Botón Secondary S "Ir a rendición" que navega a `/pago-facil`.
9. `SaludoInicio`: agregar la línea de resumen solo cuando `useResumenInicio` trae `fechaCorte`. El número de cuotas viene de `useCuotasVencidasTotal` (B-02); el de pólizas pendientes, de `useConteosPolizas` (B-02).
10. `InicioPage`: colocar el widget debajo de los KPI (columna principal) y la promo debajo del anillo (rail).
11. Escribir los tests de §10 antes de los componentes; correr `lint`, `typecheck`, `test`, `build`.

## 7. Contrato con el back

| Método y ruta | Estado | Uso en B-03 |
|---|---|---|
| `GET /api/cuotas?estado=Vencida&pagina=1&tamano=5&orden=fechaVencimiento` | NO EXISTE (PB-24; mock de T-28) | Tabla de cuotas recientes. |
| `GET /api/pagofacil/rendiciones` | Implementado | Visibilidad de la promo. Array sin paginación. |
| `GET /api/inicio/resumen` | NO EXISTE (PB-08; mock de esta tarea) | Solo `fechaCorte`. |

Tipos de lectura (no redefinir los de T-28 y T-30):

```ts
// Sugerido por PB-24; el DTO real lo define T-28 en @nexa/api
export interface CuotaListItem {
  cuotaId: string;
  polizaId: string;
  numeroPoliza: string;      // "POL-0000042"
  clienteNombre: string;
  clienteApellido: string;
  numeroCuota: number;
  fechaVencimiento: string;  // "yyyy-MM-dd"
  importe: number;
  recargo: number;
  estado: number;            // EstadoCuota por número (Pendiente=0, Vencida=1, Pagada=2, Anulada=3)
}

// De T-30 (polizas-cuotas §7.3). Lista sin paginación, orden fechaProceso desc.
export interface HistorialRendicionResponse {
  id: string;
  nombreArchivo: string;
  fechaRendicion: string;    // "yyyy-MM-dd", día de proceso en Argentina
  fechaProceso: string;
  cantidadRegistros: number;
  importeTotal: number;
  pagosAprobados: number;
}

// Propio de B-03 (PB-08, propuesta de pedidos-al-back). Solo se usa fechaCorte.
export interface ResumenInicioResponse {
  fechaCorte: string;        // "yyyy-MM-dd", día de Argentina
  polizasPorEstado: Record<'Pendiente' | 'Vigente' | 'Suspendida' | 'Cancelada' | 'Vencida', number>;
  cuotasVencidas: { total: number; recargoPorcentaje: number; recientes: CuotaListItem[] };
  rendicionPendienteHoy: boolean;
  facturasPendientesCae: number;
}
```

- Mock `GET /api/inicio/resumen` (handler de esta tarea): responde 200 con `fechaCorte` y los campos de arriba. Usa una fecha fija de fixtures (no la fecha real), y la prueba fija el reloj.
- Errores: 401 lo maneja T-08. 404 o 500 en el resumen: la línea de resumen no se muestra (degradación, no error visible).
- Ninguno de estos endpoints usa `retry` en mutaciones (no hay mutaciones en esta tarea).
- PB-08 no bloquea la promo: su visibilidad sale del historial de rendiciones, que existe. PB-08 solo afecta la línea de resumen.

## 8. Contenido de UI

Textos literales de B2 §5. El texto con cifras es plantilla; las cifras no se escriben a mano.

| Zona | Texto |
|---|---|
| Línea de resumen | `Hay {n} cuotas vencidas y {m} pólizas pendientes de pago al {dd/MM/yyyy}.` |
| Widget: título | `Cuotas vencidas recientes` |
| Widget: encabezados | `Cliente` · `Póliza` · `Cuota y vencimiento` · `Importe` · `Estado` |
| Widget: caption (visualmente oculto) | `Cuotas vencidas recientes` |
| Celda cuota y vencimiento | `Cuota {numeroCuota} · {dd/MM/yyyy}` (ver D-B03-2: el Figma dice "de {N}") |
| Badge | `Vencida` |
| Promo: título | `Rendición de Pago Fácil disponible` |
| Promo: descripción | `Subí el archivo .txt del día para registrar los pagos en efectivo.` |
| Promo: botón | `Ir a rendición` |
| Vacío del widget (propuesta, B2 §7) | `No hay cuotas vencidas.` |
| Error del widget (propuesta) | `No pudimos cargar las cuotas.` + botón `Reintentar` |

**Regla de visibilidad de la promo (B2 §9, RN18, D-12):** se muestra si el historial no tiene ninguna rendición cuyo `fechaRendicion` sea la fecha de hoy en `America/Argentina/Buenos_Aires`. Si el historial falla, la promo no se muestra.

**No renderizar:** `Tomás Iturralde`, `POL-0000042`, `$ 18.900,00` (muestras); `Foto: cupón de Pago Fácil` (anotación del Figma); "Procesar rendición", "3 facturas pendientes de CAE" y "Generar base positiva" (tareas, D-11).

## 9. Estados y casos borde

| Caso | Comportamiento |
|---|---|
| Carga | Skeleton de cinco filas de 49 px; la tabla conserva su alto. |
| Lista con datos | Cinco filas como máximo, orden por `fechaVencimiento` ascendente (lo define el back). |
| Lista vacía | Mensaje de §8 dentro del widget; la línea de resumen usa `total` = 0. |
| Error del widget | Mensaje y "Reintentar"; no afecta KPI ni anillo. |
| Importe con recargo | Se muestra `importe + recargo`; con recargo 0, igual importe. |
| `estado` fuera del mapa | Badge de texto "Desconocido" (propuesta), sin crashear. |
| Nombre de cliente largo | Truncado con `title` y el texto completo accesible. |
| Rendición del día existe | Promo oculta. |
| Historial vacío | Promo visible. |
| Historial con error | Promo oculta (no se adivina). |
| Reloj del navegador en otro día | Se compara contra el día de Argentina; el resultado depende del reloj del equipo (riesgo, §14). |
| Resumen con 404 o 500 | Línea de resumen oculta; el resto sigue igual. |
| Foco | Anillo de foco en el link de la póliza y en "Ir a rendición". |

## 10. Tests requeridos

Herramientas: Vitest, Testing Library, MSW. Fijar el reloj con `vi.setSystemTime` cuando se pruebe la promo.

| Test | Qué afirma |
|---|---|
| `muestra cinco filas con cliente, póliza, cuota y vencimiento, importe y badge Vencida` | Datos del mock. |
| `el importe es importe más recargo, formateado con T-09` | Con importe 18900 y recargo 0 → `$ 18.900,00`. |
| `la celda de cuota muestra "Cuota {numeroCuota} · dd/mm/aaaa"` | Formato de fecha `DateOnly`. |
| `pide la lista con estado Vencida, pagina 1, tamano 5 y orden fechaVencimiento` | Query params exactos. |
| `la tabla tiene caption y th scope="col"` | Accesibilidad de §12 del Figma. |
| `el número de póliza enlaza a /polizas/{polizaId}` | `href`. |
| `lista vacía muestra "No hay cuotas vencidas."` | Estado vacío. |
| `error muestra el mensaje y Reintentar vuelve a pedir la lista` | Estado de error. |
| `durante la carga hay cinco filas de skeleton` | Estado de carga. |
| `PromoRendicion aparece si el historial no tiene rendición de hoy` | Con reloj fijado y historial de ayer. |
| `PromoRendicion no aparece si hay una rendición con fechaRendicion de hoy` | Regla de visibilidad. |
| `PromoRendicion no aparece si el historial falla` | Degradación. |
| `"Ir a rendición" navega a /pago-facil` | Destino D-03. |
| `la línea de resumen usa fechaCorte y no la fecha del navegador` | Reloj del navegador distinto del `fechaCorte` del mock. |
| `la línea de resumen con cifras de cuotas y pólizas` | Texto con `n` y `m`. |
| `si el resumen falla, la línea no se muestra y el resto sigue` | Degradación con 500. |
| `no aparecen cifras ni nombres de muestra fijos` | Ausencia de "14", "27", "Tomás" en el DOM. |
| `no tiene violaciones de accesibilidad` | Helper de US-FE-T-19 (axe). |

## 11. Criterios de aceptación

1. El widget "Cuotas vencidas recientes" muestra como máximo cinco filas con las columnas `Cliente`, `Póliza`, `Cuota y vencimiento`, `Importe` y `Estado`.
2. La request es `GET /api/cuotas?estado=Vencida&pagina=1&tamano=5&orden=fechaVencimiento`.
3. El importe mostrado es `importe + recargo` con el formateador único de T-09.
4. La tabla tiene `<caption>` (visualmente oculto) y `<th scope="col">`.
5. El estado se muestra como texto `Vencida` con `Badge`, nunca como número.
6. El número de póliza enlaza a `/polizas/{polizaId}`.
7. Lista vacía, error y carga tienen los textos y comportamientos de §8 y §9.
8. La promo aparece solo si el historial de rendiciones no tiene una rendición de la fecha de hoy en `America/Argentina/Buenos_Aires`.
9. La promo no aparece si el historial falla.
10. "Ir a rendición" navega a `/pago-facil`.
11. La línea de resumen usa `fechaCorte` del resumen y no la fecha del navegador.
12. Si el resumen falla, la línea no se muestra y el resto de la pantalla sigue.
13. El mock `GET /api/inicio/resumen` vive en `packages/api/mocks/handlers/inicio.ts` y no tiene datos de muestra fijos fuera de fixtures.
14. No se muestra el widget de tareas del día ni "Ver todas".
15. Los tests de §10 están en verde y el test de axe no tiene violaciones.
16. `npm run lint`, `typecheck`, `test` y `build` están en verde en `apps/backoffice`.

## 12. Verificación manual

Requiere `VITE_USE_MOCKS=true` (para PB-08 y PB-24) o el back con esos endpoints.

1. Abrir `/inicio`. Ver la línea de resumen con la fecha de corte del mock, no la fecha de hoy del equipo.
2. Ver el widget de cuotas: cinco filas, importe con formato `$ 0.000,00`, badge `Vencida`.
3. Hacer clic en un número de póliza y ver la ruta `/polizas/{id}` (la pantalla llega con B-15).
4. Probar con el mock de rendiciones vacío (promo visible) y con una rendición de hoy (promo oculta).
5. Confirmar con la persona responsable los pasos 2 y 4 antes del PR (workflow regla 7).

## 13. Decisiones pendientes (con default)

- **D-B03-1. Botón "Ver todas".** Default: sin link (B2 §8, destino NO DEFINIDO). Cuando exista la pantalla de cuotas, se agrega.
- **D-B03-2. Texto de cuota ("de N").** Default: `Cuota {numeroCuota} · {fecha}` sin "de N". El Figma dice "Cuota 8 de 12". PB-24 no tiene `cantidadCuotas`. Pedir el campo al back.
- **D-B03-3. Importe.** Default: `importe + recargo` (B2 §6 y la regla de cobro de `CuotaResponse`). Confirmar si el Figma quiere solo el importe base.
- **D-B03-4. Visibilidad de la promo (B2 D-12, D-8).** Default: como en §8. Si el historial falla, se oculta.
- **D-B03-5. Fecha de corte.** Default: `fechaCorte` del mock de PB-08 hasta que el back lo publique; sin mock, no hay línea. No se usa la fecha del navegador para la línea.
- **D-B03-6. Imagen de la promo (B2 D-13).** Default: sin imagen. Pedir el asset.
- **D-B03-7. Destino de la promo.** Default: `/pago-facil` (D-03 del INDEX), no los subrutas de B2 §8.
- **D-B03-8. Tareas del día (D-11).** Oculto.

## 14. Riesgos y errores comunes

- **Mezclar la fecha de corte con la fecha del navegador:** el día de la promo y el de la línea pueden no coincidir. Solo la promo usa el reloj local, y se compara contra el día de Argentina.
- **Recargo ya sumado:** no sumarlo dos veces. `importe` es el base; el recargo se suma una vez.
- **Estado como número:** el badge se calcula con el mapa de T-10. Nunca comparar contra `1` directamente (FC9).
- **Dos caches para la misma cifra:** el total de cuotas del saludo y el KPI 4 deben salir de la misma key (`cuotasKeys`), no de dos requests distintas.
- **Caption oculto con `display: none`:** deja de ser leído. Usar clase de visualmente oculto.
- **Modificar `InicioPage` en paralelo con B-02:** es un archivo de otro dueño. Merge después de B-02 (sección 16).
- **Tabla desbordada:** el scroll horizontal va en el contenedor del widget, nunca en `body`.

## 15. Definición de terminado

- `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` en verde en `apps/backoffice`.
- Sin secretos ni credenciales en el código.
- Accesibilidad revisada con el helper de US-FE-T-19 en `/inicio`.
- Sin datos de muestra fijos fuera de fixtures; sin `any`; sin formateo manual.
- Criterios de §11 tildados con evidencia observada.

## 16. Observaciones al índice

- Resuelto (RV-04): la fila del INDEX declara T-05, T-06, T-09, T-10, T-11 y T-19 además de B-02, T-28 y T-30; §3 copia la fila.
- ABIERTO: la promo no depende de PB-08; su visibilidad sale del historial de rendiciones, que existe. El INDEX mantiene PB-08 como bloqueo de la tarea (MSW). Motivo: no figura en REVISION.md ni en FB8.
- Resuelto (RV-13): `handlers/inicio.ts` lo llena B-03 y registra su export en `handlers/index.ts` en el mismo PR, acordado con T-11.
- Resuelto (RV-D16): la request del resumen vive en `features/inicio/` como excepción a FC2 hasta que PB-08 se publique.
- Resuelto (RV-37): la promo vive en `features/inicio/components/PromoRendicion.tsx`; al moverla solo cambian imports.
- Resuelto (triage final, default de la ficha): nombre del widget. B5 §4 llama `CuentaWidget` a un widget de `features/cuotas`; aquí se llama `WidgetCuotasVencidas`, como en el INDEX. Motivo: no figura en REVISION.md ni en FB8.
- Resuelto (triage final, default de la ficha): merge después de B-02 porque esta tarea edita `InicioPage.tsx` y `SaludoInicio.tsx`. Motivo: no figura en REVISION.md ni en FB8 (RV-39 cubre solo `routes.tsx` de B-05 y B-07).

