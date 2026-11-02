# US-FE-W-02: Planes públicos: tabla de planes

Tipo W · Oleada 3 · Tamaño S · Rama sugerida `feature/US-FE-W-02-planes-publicos` · Tarjeta Trello `US-FE-W-02`

## 1. Objetivo

Al terminar, la feature `planes` de la web pública expone `TablaPlanes`: una tabla con los planes activos (RC, TC, TR) tomados de `GET /api/planes` (anónimo), con el precio "desde" igual a `primaBase`, carga, error con reintento y vista móvil. La consume la home (US-FE-W-01). Para el cliente anónimo que compara planes.

## 2. Alcance

**Entra**
- Feature `planes` de la web (`apps/web-publica/src/features/planes/`): `index.ts`, `api/usePlanesPublicos.ts`, `components/TablaPlanes.tsx`, `routes.tsx` (stub; no tiene página propia en W1).
- Encabezado de cada plan (código, nombre), fila de precio "desde", texto "por mes", destacado del plan TC.
- Estados de carga, vacío y error con reintento.
- Variante móvil (sección 9).

**NO entra**
- Matriz de coberturas (filas "Responsabilidad civil a terceros", "Robo e incendio total", "Daños por choque al vehículo" y las marcas por plan). Fuera de alcance: no hay endpoint (D-08).
- La sección "Planes" de la home (título, subtítulo, chip, ancla): lo hace US-FE-W-01.
- Las funciones de request, DTO `PlanResponse` y handler MSW de `GET /api/planes`: los hace US-FE-T-27 en `@nexa/api`.
- Backoffice (`GET /api/planes` de administración): US-FE-B-22.

## 3. Dependencias

- **Puede empezar sin esperar a:** US-FE-W-03 (sin relación de código).
- **Depende de** (fila del INDEX):
  - US-FE-T-05 (`Button` para "Reintentar"), US-FE-T-06 (`Table`, si se usa el primitivo; ver paso 4), US-FE-T-07 (`AlertaError`).
  - US-FE-T-09 (formateador de importes `es-AR`).
  - US-FE-T-11 (MSW base para los tests).
  - US-FE-T-17 (scaffold de la web pública, alias de `src/`).
  - US-FE-T-19 (harness de accesibilidad).
  - US-FE-T-27 (`listarPlanes()` y `PlanResponse` en `@nexa/api`; `planesKeys` para la query key).
- **Bloqueada por pedidos al back:** ninguno (`—` en el INDEX). `GET /api/planes` está Implementado (PR #23, mergeado).
- **Workaround MSW:** no aplica.

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB3 (regla 1: imports de otro feature solo por `index.ts`), FB4 (importes con un solo formateador), FB7.8 (contraste sin cambio de colores).
- `docs/frontend/tareas/INDEX.md`: FC2 (hooks en `features/<dominio>/api/`, query keys de `@nexa/api`), FC5 (tests mínimos de pantalla y de primitivo), FC9 (importes), FC13 (red: `fetch` solo vía `@nexa/api`), D-07, D-08, D-24.
- `docs/frontend/pantallas/W1-inicio.md`:
  - §4 (`TablaPlanes` es un componente propio; la sección "Planes" del Figma),
  - §5 (textos de la tabla: "RC", "Responsabilidad Civil", "TC", "Terceros Completo", "TR", "Todo Riesgo", "desde", "por mes", "Cobertura"),
  - §7 (estados: carga, error y vacío NO DEFINIDOS en el Figma),
  - §9 (datos: `GET /api/planes`, campos de `PlanResponse`, formato `$ 10.000,00`),
  - §11 (390 px: la tabla de 4 columnas no entra),
  - §13 (dudas 2, 3 y 4).
- `docs/frontend/contratos-api/vehiculos-planes-cotizaciones.md`:
  - §4.1 (`GET /api/planes`: respuesta `PlanResponse[]`, ordenada por `codigo`, solo activos, sin paginación, sin errores propios),
  - §0 (enums numéricos y `ProblemDetails` común).
- `docs/frontend/contratos-api/convenciones-transversales.md` §5.4 (importes: número JSON, sin aritmética en el front).
- `docs/frontend/design-system.md`: §5.12 (Table/Header y Table/Row), §5.13 (Card/Widget), §7.4 (breakpoint 768 px, propuesta), §8.1 (contraste de `text/tertiary` sobre panel: 3,30, no cumple AA; no cambiar colores).

## 5. Archivos a crear o modificar

Todos bajo `frontend/apps/web-publica/src/features/planes/`:

| Archivo | Acción | Dueño |
|---|---|---|
| `index.ts` | crear: exporta `TablaPlanes` y `planesRoutes` (stub) | W-02 (primer task del feature `planes` web) |
| `routes.tsx` | crear stub: `planesRoutes: RouteObject[] = []` | W-02 |
| `api/usePlanesPublicos.ts` | crear: hook TanStack Query sobre `listarPlanes()` | W-02 |
| `api/usePlanesPublicos.test.tsx` | crear | W-02 |
| `components/TablaPlanes.tsx` | crear | W-02 |
| `components/TablaPlanes.test.tsx` | crear | W-02 |

Dueños de archivos compartidos que W-02 **usa** y no modifica: `frontend/packages/api/src/dto/planes.ts`, `packages/api/src/index.ts` (US-FE-T-27 y T-12), `packages/ui/src/index.ts` (T-03; primitivos de T-05, T-06, T-07). Si falta un export, pedirlo a su dueño (FC17). No editar `package.json`.

## 6. Pasos de implementación

1. Crear `api/usePlanesPublicos.ts`:
   - `useQuery({ queryKey: planesKeys.lista(), queryFn: listarPlanes, retry: false })`. `retry: false` porque `GET /api/planes` no está bajo el rate limit de `/api/publico`, pero el reintento lo decide el usuario con el botón (FC13: no reintentar en silencio).
   - `planesKeys` y `listarPlanes` vienen de `@nexa/api` (T-27). No llamar a `fetch` aquí.
2. Crear `components/TablaPlanes.tsx`:
   - Lee el hook. Renderiza según el estado: carga (skeleton), error (`AlertaError` de T-07 con el texto de la sección 8 y un `Button` "Reintentar" que llama a `refetch()`), vacío (texto de la sección 8), éxito (tabla).
   - Tabla con `<table>`: `<caption class="sr-only">Planes de cobertura de referencia</caption>`, `<thead>` con una `<th scope="col">` por plan (código en H3 16/22 SemiBold, nombre en Body-sm 13/18 `text-text-secondary`), `<tbody>` con una sola fila: celda de precio con etiqueta "desde", importe formateado y "por mes".
   - Los planes se renderizan en el orden de la respuesta (el back ya ordena por `codigo`).
   - Importe: `formatearImporte(plan.primaBase)` de `@nexa/api` (T-09). Nunca `toFixed` ni formatos a mano.
   - Plan con `codigo === 'TC'`: `data-destacado="true"` y fondo `accent-lime-soft` en su columna (así está en el Figma; el destacado no es el único indicador porque el código "TC" y el nombre ya lo identifican, W1 §12).
3. Responsive: por debajo de 768 px la tabla se apila (cada `th` y `td` pasa a bloque, con `data-label` en la celda de precio), sin scroll horizontal. Una sola estructura en el DOM; no duplicar el contenido para móvil.
4. Si `Table/Header` y `Table/Row` de T-06 cubren este caso, usarlos en lugar de `table` a mano, manteniendo `scope="col"` y `caption`.
5. `index.ts`: exportar `TablaPlanes` y `planesRoutes`. Nada más (FB3 regla 1).
6. Escribir los tests de la sección 10 y ejecutarlos.

## 7. Contrato con el back

**`GET /api/planes`** (`PlanesController`, anónimo)

- Estado: **Implementado** (PR #23, mergeado). No hay paginación ni envoltorio.
- Request: sin parámetros, sin body.
- Response 200: lista plana de planes activos, ordenada por `codigo` sin distinguir mayúsculas.
- Errores: ninguno propio. 500 genérico del `ExceptionMiddleware` (`ProblemDetails`, `detail` "Ocurrió un error inesperado.").

```ts
// packages/api/src/dto/planes.ts (dueño: US-FE-T-27). W-02 lo consume, no lo redefine.
export interface PlanResponse {
  id: string;                  // uuid
  codigo: string;              // "RC" | "TC" | "TR" en el seed
  nombre: string;              // "Responsabilidad Civil" | "Terceros Completo" | "Todo Riesgo" en el seed
  descripcion: string;
  primaBase: number;           // decimal ARS, número JSON
  tiposPermitidos: string;     // texto separado por comas, p. ej. "Auto,Moto,Camioneta" (no es un array)
  antiguedadMaxima: number | null;
  activo: boolean;             // siempre true en esta respuesta
}
export type PlanListResponse = PlanResponse[];
```

Ejemplo de respuesta (contrato, `vehiculos-planes-cotizaciones.md` §4.1; datos del seed):

```json
[
  { "id": "a1000000-0000-0000-0000-000000000001", "codigo": "RC", "nombre": "Responsabilidad Civil",
    "descripcion": "Cubre los daños que se le causan a terceros.", "primaBase": 12000.00,
    "tiposPermitidos": "Auto,Moto,Camioneta", "antiguedadMaxima": null, "activo": true },
  { "id": "a1000000-0000-0000-0000-000000000002", "codigo": "TC", "nombre": "Terceros Completo",
    "descripcion": "Cubre responsabilidad civil, robo, incendio y destrucción total.", "primaBase": 18000.00,
    "tiposPermitidos": "Auto,Moto,Camioneta", "antiguedadMaxima": null, "activo": true },
  { "id": "a1000000-0000-0000-0000-000000000003", "codigo": "TR", "nombre": "Todo Riesgo",
    "descripcion": "Cubre terceros completo más daños parciales por accidente con franquicia.", "primaBase": 30000.00,
    "tiposPermitidos": "Auto,Camioneta", "antiguedadMaxima": 10, "activo": true }
]
```

Handler MSW: lo escribe US-FE-T-27 (`packages/api/mocks/handlers/planes.ts`). W-02 no agrega handlers; en sus tests usa el handler de T-27 o `server.use(...)` con esta misma respuesta.

## 8. Contenido de UI

| Zona | Texto literal |
|---|---|
| Columna RC | RC · Responsabilidad Civil |
| Columna TC | TC · Terceros Completo |
| Columna TR | TR · Todo Riesgo |
| Etiqueta del precio | desde |
| Unidad del precio | por mes |
| Caption de la tabla (solo lector de pantalla) | Planes de cobertura de referencia |
| Carga | Cargando planes… (propuesta: skeleton visual; el texto solo para el lector de pantalla, `aria-busy="true"` en la tabla) |
| Error (propuesta, NO DEFINIDO en Figma) | No pudimos cargar los planes. |
| Error, botón | Reintentar (propuesta) |
| Vacío (propuesta, NO DEFINIDO en Figma) | Por el momento no hay planes disponibles. |

Importe: `$ 12.000,00` con el formateador de T-09 (separador de miles con punto, decimales con coma, "$ " con espacio). El texto "La prima final depende del vehículo y se informa al cotizar." es de W-01, no de esta tarea.

Los textos de la fila de coberturas del Figma no se construyen (fuera de alcance, D-08).

## 9. Estados y casos borde

| Estado | Comportamiento |
|---|---|
| Cargando | Skeleton con la misma altura de la tabla; `aria-busy="true"`. No hay spinner que tape el resto de la home. |
| Éxito | Tabla con un `th` por plan y el precio en la fila. |
| Error (cualquier código o red) | Se oculta la tabla y se muestra `AlertaError` con "No pudimos cargar los planes." y "Reintentar". El reintento llama a `refetch()` solo por clic. |
| Vacío (array vacío) | Texto de la sección 8 en lugar de la tabla. |
| Un solo plan o más de tres | La tabla renderiza tantas columnas como planes vengan; no hay límite fijo. |
| Plan sin `primaBase` numérico | No aplica: el DTO lo tipa como `number` (si llegara `null`, mostrar "Consultar" y registrar el caso en el PR; propuesta). |
| 390 px | Vista apilada (paso 3). El precio sigue con su etiqueta "desde". |
| Destacado TC | Solo si `codigo === 'TC'`. Si el código cambia en el back, el destacado se pierde: está en la sección 13. |

No hay roles ni sesión: la tabla es igual para todos.

## 10. Tests requeridos

Vitest + Testing Library + MSW. Un test por estado y por regla (FC5).

| Test (`TablaPlanes.test.tsx`, `usePlanesPublicos.test.tsx`) | Afirma | Herramienta |
|---|---|---|
| `muestra una columna por plan en el orden de la respuesta` | aparecen RC, TC y TR en ese orden | MSW + Testing Library |
| `formatea primaBase con el formateador de es-AR` | RC muestra "$ 12.000,00" (fixture del contrato, no del Figma) | MSW + Testing Library |
| `muestra las etiquetas desde y por mes en cada plan` | `getAllByText('desde')` y `getAllByText('por mes')` con 3 elementos | Testing Library |
| `destaca solo la columna TC` | `data-destacado="true"` únicamente en TC | Testing Library |
| `no muestra filas de coberturas` | no aparecen "Robo e incendio total" ni "Daños por choque al vehículo" | Testing Library |
| `estado de carga: aria-busy y skeleton` | la tabla tiene `aria-busy="true"` antes de responder | MSW con retardo |
| `estado de error: muestra AlertaError con reintento` | `role="alert"` con el texto de error | MSW con 500 |
| `reintentar vuelve a pedir los planes solo por clic` | tras 500 y luego 200, el clic en "Reintentar" muestra la tabla; sin clic, hay una sola petición | MSW + userEvent |
| `estado vacío` | con `[]` aparece el texto de vacío y no hay tabla | MSW |
| `la query no reintenta sola` | con 500, `retry` es 0 (una petición tras el error) | MSW + spy |
| `usePlanesPublicos usa planesKeys.lista()` | la query key coincide con la de `@nexa/api` | Vitest |
| `no tiene violaciones de accesibilidad` | axe sobre la tabla con datos | vitest-axe |

## 11. Criterios de aceptación

1. `features/planes/index.ts` exporta `TablaPlanes` y `planesRoutes`, y nada más (test o revisión).
2. La tabla muestra RC, TC y TR en el orden de la respuesta, con `th scope="col"` y `caption`.
3. El importe de cada plan es `primaBase` formateado con el formateador de T-09 (test con el fixture de §7).
4. Cada plan muestra "desde" y "por mes".
5. Solo la columna TC tiene `data-destacado="true"`.
6. No se renderiza ninguna fila de coberturas (test).
7. Carga, error, vacío y éxito tienen tests propios; el error ofrece "Reintentar" por clic.
8. La petición no se repite sola tras un error (test).
9. Por debajo de 768 px la tabla se apila sin scroll horizontal (verificación manual, sección 12).
10. Sin violaciones de axe (test).
11. `lint`, `typecheck`, `test` y `build` en verde (FC8).

## 12. Verificación manual

1. Levantar la web pública con el backend local o con MSW (`VITE_USE_MOCKS=true`).
2. Abrir `/` y bajar a "Planes": deben verse tres columnas con sus precios de la respuesta (RC $ 12.000,00, TC $ 18.000,00, TR $ 30.000,00 con el seed actual).
3. Cortar la red en DevTools y recargar: aparece el error con "Reintentar"; al volver la red, el clic en "Reintentar" muestra la tabla.
4. DevTools en 390 px: la tabla se apila, no hay scroll horizontal y "desde" queda visible en cada plan.
5. Confirmar con el equipo que el precio mostrado es el esperado antes del PR (DN-W2-1).

## 13. Decisiones pendientes con su default

| ID | Tema | Default | Fuente |
|---|---|---|---|
| D-07 | **[CONFIRMAR]** (RV-D22). Precio "desde" | `primaBase` tal cual, sin recalcular | INDEX D-07, W1 §13.2 |
| D-08 | Matriz de coberturas | Fuera de alcance; no se renderiza | INDEX D-08 |
| DN-W2-1 | **[CONFIRMAR]** negocio/diseño (RV-D22). Valores del Figma no coinciden con el seed: Figma RC $10.000, TC $18.000, TR $27.500; seed RC 12.000, TC 18.000, TR 30.000 | Se muestran los valores del endpoint. Los valores del Figma no se escriben en el código. No cerrar sin confirmación del equipo: negocio y diseño | W1 §13.2; RV-D22; `PB-18` |
| DN-W2-2 | **[CONFIRMAR]** negocio (RV-D22). "desde" con factores de RN06 (moto 0,70) | `primaBase` puede ser mayor que el precio mínimo real de una moto. Decisión de negocio: se muestra "desde" igual que el DTO hasta que negocio confirme. No cerrar sin confirmación del equipo: negocio | `vehiculos-planes-cotizaciones.md` §5.2; RV-D22 |
| DN-W2-3 | Destacado TC | Hardcodeado por `codigo === 'TC'`, como en el Figma | W1 §3 |
| DN-W2-4 | Vista móvil | Tabla apilada (paso 3). W1 §11 deja la decisión al equipo: tarjetas por plan o scroll horizontal dentro del contenedor | W1 §11 |
| DN-W2-5 | Textos de carga, error y vacío | Propuestas de la sección 8 hasta que diseño las confirme | W1 §7 |

## 14. Riesgos y errores comunes

- **Copiar los precios del Figma:** los números de $ 27.500,00 y $ 10.000,00 no existen en el back. Si se escriben a mano, la home y la cotización no coinciden (FC9, FB4).
- **Formatear con `toFixed`:** da "12000.00" en lugar de "$ 12.000,00". Usar siempre el formateador de T-09.
- **`tiposPermitidos` como array:** es un string separado por comas (`"Auto,Moto,Camioneta"`). No hacer `.map` sobre él.
- **Reintento automático:** dejar `retry` por defecto en TanStack Query v5 reintenta tres veces ante 500 y deja la UI cargando. Usar `retry: false` (sección 6, paso 1).
- **Filtrar por `codigo` en el front:** el orden lo define el back; no reordenar en el front.
- **Destacado con solo color:** el Figma usa lime en la columna TC, pero el código "TC" y el nombre ya lo distinguen. No agregar texto nuevo sin decisión.

## 15. Definición de terminado

- `lint`, `typecheck`, `test` y `build` en verde para `apps/web-publica` (FC8).
- Accesibilidad revisada con el harness de US-FE-T-19: tabla con `caption`, `th scope="col"`, sin violaciones de axe.
- Sin secretos ni credenciales.
- Los 11 criterios de la sección 11 tildados con evidencia observada (FC6).
- DN-W2-1 y DN-W2-2 registrados en el PR para negocio.

## 16. Observaciones al índice

- Resuelto (RV-D22): el INDEX (D-07) ya registra que el seed no coincide con el Figma (RC 12.000 vs 10.000; TR 30.000 vs 27.500) y que el "desde" queda **[CONFIRMAR]**.
- Resuelto (RV-D27 / RV-68): la vista móvil es una propuesta de la sección 9 (tabla apilada bajo 768 px, DN-W2-4), con el breakpoint de D-35.
- ABIERTO: **Dueño de `planesRoutes`.** W-02 crea un stub de rutas porque `features/planes` existe en la web y `W-01` no necesita ruta propia. Confirmar que el router de T-17 acepta un módulo de rutas vacío. (Ni REVISION ni FB8 lo resuelven.)
