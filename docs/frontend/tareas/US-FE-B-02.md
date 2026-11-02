# US-FE-B-02: Inicio del backoffice: saludo, KPIs de pólizas y distribución por estado

Tipo: B · Oleada: 4 · Tamaño: M · Rama sugerida: `feature/US-FE-B-02-inicio-kpis` · Tarjeta Trello: `US-FE-B-02`

Pantalla: [B2 Inicio](../pantallas/B2-inicio.md). Índice: [INDEX](INDEX.md), fila US-FE-B-02.

---

## 1. Objetivo

Al entrar a `/inicio`, el empleado o el administrador ve el saludo, cuatro indicadores (pólizas vigentes, pendientes de pago, suspendidas y cuotas vencidas) y el anillo de pólizas por estado con su leyenda, en la columna principal y el rail derecho del shell de B2. Cada dato se calcula en tiempo de ejecución a partir de llamadas al back; ningún número ni fecha de muestra queda fijo. Para: empleados y administradores. Esta tarea crea el feature `features/inicio`.

## 2. Alcance

**Entra**
- Ruta `/inicio` en `apps/backoffice/src/features/inicio/routes.tsx` y `pages/InicioPage.tsx`.
- Saludo (`SaludoInicio`) con el nombre de `GET /api/auth/yo` (mock) o, si falla, el email del claim.
- Cuatro `KpiCard`: pólizas vigentes (con nota "N% de las pólizas"), pendientes de pago, suspendidas y cuotas vencidas hoy.
- `DonutPolizasPorEstado` con cinco segmentos calculados desde los conteos, centro con el total y leyenda en `<ul>`.
- Estados de carga, vacío y error por widget (un widget caído no tumba la página).
- Hooks de consulta del feature (`features/inicio/api/`).

**NO entra**
- Widget "Cuotas vencidas recientes" (tabla) y la línea de resumen del saludo "Hay N cuotas vencidas y M pólizas…": **US-FE-B-03**.
- Promo "Rendición de Pago Fácil" y su visibilidad: **US-FE-B-03**.
- Widget "Tareas del día": oculto (D-11). No se construye.
- Layout `LayoutBackoffice`, sidebar, topbar y botón "Nueva cotización": **US-FE-T-16** (ver sección 13, D-B02-4).
- Primitivos `Card/Widget`, `Button`, `Chip`, `Dato`: **US-FE-T-05 y T-07**.
- Funciones de request y query keys de pólizas y cuotas: **US-FE-T-28**; del yo: **US-FE-T-32**.

## 3. Dependencias

- **Oleada:** 4.
- **Depende de:** US-FE-T-07, US-FE-T-11, US-FE-T-13, US-FE-T-16, US-FE-T-19, US-FE-T-28, US-FE-T-32.
- **Puede empezar sin esperar a:** US-FE-B-04 (listado de clientes; sin relación de datos).
- **Bloqueada por pedidos al back:** PB-04 (degrada el saludo: sin `yo`, el saludo usa el email del claim). El KPI 4 usa el mock de cuotas de T-28 (ver sección 7).

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB1, FB3 (feature `inicio`, reglas 1 a 5), FB4 (sin datos de muestra fijos), FB7.7, FB7.11.
- `docs/frontend/pantallas/B2-inicio.md`: §1 (propósito y rol), §2 (ruta y guardas), §3 (estructura, medidas clave), §4 (componentes y nota del donut), §5 (contenido, solo los KPIs, el saludo y el rail), §7 (estados de widgets), §9 (filas 1 a 5 de "Pólizas vigentes", "Pendientes", "Suspendidas", "Total 390" y "Pólizas por estado"; fila de saludo), §10 (RN08, RN09, estados de póliza), §12 (accesibilidad de KPIs y donut), §13 (D-1, D-7, D-9, D-14).
- `docs/frontend/contratos-api/polizas-cuotas-pagofacil.md`: §1.3 (enum: el filtro va por nombre, la respuesta por número), §5.2 (`GET /api/polizas`, `PaginaResponse`, `tamano`), §5.2.1 (`PolizaListItemResponse`, solo para el conteo).
- `docs/frontend/contratos-api/convenciones-transversales.md`: §6.1 (`PaginaResponse`), §6.2 (query de polizas).
- `docs/frontend/contratos-api/seguridad-clientes-publico.md`: §2.1 (email del claim; no verificar la firma en el front).
- `docs/frontend/design-system.md`: §5.13 (Card/Widget), §5.5 (Chip Destacado), §5.4 (estados de badge; solo para la leyenda), §12 de B2 para aria.
- `docs/frontend/pedidos-al-back.md`: PB-04, PB-08, PB-24.
- `docs/frontend/tareas/INDEX.md`: FC2 (hooks por feature, keys de T-28 y T-32), FC4, FC9, FC13, FC14, FC16.

## 5. Archivos a crear o modificar

Bajo `frontend/apps/backoffice/src/features/inicio/` (feature nuevo, dueño B-02):

| Archivo | Notas |
|---|---|
| `pages/InicioPage.tsx` | Compone saludo, KPIs y rail. Delgada: no calcula. |
| `components/SaludoInicio.tsx` | H1 y nombre. La línea de resumen se agrega en B-03. |
| `components/KpiCard.tsx` | Reutilizable: título, cifra, nota opcional, chip opcional, estado de error. |
| `components/GridKpis.tsx` | Cuatro `KpiCard` en fila. |
| `components/DonutPolizasPorEstado.tsx` | SVG calculado, centro textual y leyenda `<ul>`. |
| `api/useConteosPolizas.ts` | `useQueries` con cinco claves `polizasKeys.lista({ estado, pagina: 1, tamano: 1 })` (T-28). |
| `api/useCuotasVencidasTotal.ts` | Total de cuotas vencidas (PB-24 mock). |
| `api/useSaludo.ts` | `yo` de T-32; fallback al email del claim. |
| `routes.tsx` | Ruta `/inicio`. |
| `index.ts` | API pública del feature. B-02 es el primer task de `features/inicio`: dueño de este archivo. |
| `pages/InicioPage.test.tsx`, `components/*.test.tsx` | Tests de §10. |

Compartidos (no editar):
- `packages/api/src/**` (T-28, T-32): funciones de request y keys.
- `packages/ui/src/**` (T-05, T-07): `Chip`, `CardWidget`, `Dato`.
- `app/**` (T-16): layout y router.

## 6. Pasos de implementación

1. Confirmar que T-28 y T-32 están mergeadas y leer sus exports reales (nombres de §7 son sugeridos).
2. Crear `useConteosPolizas`: cinco entradas con `estado` por nombre (`"Vigente"`, `"Pendiente"`, `"Suspendida"`, `"Cancelada"`, `"Vencida"`), `pagina: 1`, `tamano: 1`. Devuelve `{ conteos: Record<Estado, number> | undefined, total, estados: { isError, refetch } }`. El total es la **suma** de los cinco (D-14 de B2), no una sexta llamada.
3. Crear `useCuotasVencidasTotal`: llama a la función de T-28 con `estado: "Vencida"`, `pagina: 1`, `tamano: 1`. Devuelve `total` o `undefined` si falla.
4. Crear `useSaludo`: llama a `yo` de T-32. Si falla por cualquier motivo, devuelve el selector `emailSesion` de T-13 (RV-19), que es el email del claim del token.
5. `KpiCard`: `<section>` con el título como encabezado y la cifra. Si no hay dato, muestra "No disponible" (FB7.11). Chip opcional con variante `destacado`.
6. `GridKpis` con los cuatro KPI en este orden: `Pólizas vigentes`, `Pendientes de pago`, `Suspendidas`, `Cuotas vencidas hoy`.
7. Porcentaje de vigentes: `Math.round(vigentes * 100 / total)`; si `total` es 0, muestra `0%`. Nota: `{n}% de las pólizas`.
8. `DonutPolizasPorEstado`: SVG con `stroke-dasharray` calculado por segmento (los arcos del Figma no se usan, B2 §4). Calcula offsets a partir de los conteos. Con total 0, muestra el anillo vacío y `0` / `pólizas`. El SVG tiene `aria-hidden="true"`.
9. Leyenda en `<ul>` con etiqueta, cifra y porcentaje de cada estado, en el orden de B2 §5.
10. `InicioPage`: columna principal (saludo y KPIs) y rail (anillo y leyenda). El rail de B-03 se agrega debajo en su PR.
11. Cada widget muestra su propio estado de carga (skeleton con el mismo alto), error (texto y botón "Reintentar" que llama a `refetch`) y vacío.
12. Escribir los tests de §10 antes de los componentes y correr `lint`, `typecheck`, `test`, `build`.

## 7. Contrato con el back

| Método y ruta | Estado | Uso en B-02 |
|---|---|---|
| `GET /api/polizas?estado=<Nombre>&pagina=1&tamano=1` | Implementado | Cinco conteos (Vigente, Pendiente, Suspendida, Cancelada, Vencida). Se usa `total`. |
| `GET /api/cuotas?estado=Vencida&pagina=1&tamano=1` | NO EXISTE (PB-24, mock de T-28) | KPI 4. Se usa `total`. |
| `GET /api/auth/yo` | NO EXISTE (PB-04, mock de T-32) | Saludo. |

Tipos (en `@nexa/api`, dueños T-28 y T-32; no redefinir):

```ts
// Forma de la respuesta paginada de polizas (sugerido; manda T-28)
export interface PaginaResponse<T> {
  items: T[];
  pagina: number;
  tamanoPagina: number;
  total: number;
}

// Query: el estado va por nombre, no por número (polizas-cuotas §1.3)
export interface PolizaFiltroQuery {
  estado?: 'Pendiente' | 'Vigente' | 'Suspendida' | 'Cancelada' | 'Vencida';
  pagina?: number;
  tamano?: number;   // "tamano" en la query, "tamanoPagina" en la respuesta
}

// Para B-02 solo se lee `total`. No se lee `estado` de los items (llega como número).
```

- PB-08 (`GET /api/inicio/resumen`) no se consume en esta tarea: los conteos salen de cinco llamadas. La línea de resumen y su fecha de corte son de B-03.
- Respuesta de `yo` (PB-04, propuesta): `{ id: string; email: string; nombre: string; apellido: string; rol: RolUsuario }`.
- Handlers MSW: **No aplica** en esta tarea (los escriben T-28 y T-32).
- Query keys: `polizasKeys.lista(filtro)` (T-28) y la key de `yo` (T-32). No inventar keys nuevas.

## 8. Contenido de UI

Textos literales de B2 §5. Las cifras y fechas de muestra del Figma no se copian.

| Zona | Texto |
|---|---|
| Saludo (H1) | `Hola, {nombre}` (nombre de `yo`; si falla, el email del claim) |
| KPI 1 | Título `Pólizas vigentes` · cifra = vigentes · nota `{n}% de las pólizas` |
| KPI 2 | Título `Pendientes de pago` · cifra = pendientes · sin nota (D-B02-2) |
| KPI 3 | Título `Suspendidas` · cifra = suspendidas · sin nota (D-B02-2) |
| KPI 4 | Título `Cuotas vencidas hoy` · cifra = total de PB-24 · nota `Recargo 5% aplicado` · chip `Atender hoy` (destacado) |
| Widget anillo | Título `Pólizas por estado` · centro `{total}` / `pólizas` |
| Leyenda | `Vigente` · `Pendiente` · `Suspendida` · `Cancelada` · `Vencida`, cada una con cifra y `{p}%` |
| Vacío (anillo sin pólizas) | `0` / `pólizas`, leyenda con `0%` |
| Error de widget (propuesta) | `No pudimos cargar este dato.` + botón `Reintentar` |
| Sin dato de KPI 4 (propuesta) | `No disponible` |

**No renderizar:** `Mariela`, `Mariela Quiroga`, `Empleado` (muestra); `Hay 14 cuotas vencidas…` (B-03, depende de PB-08); el texto de la campana y las tres acciones del topbar (T-16).

## 9. Estados y casos borde

| Caso | Comportamiento |
|---|---|
| Carga | Cada KPI y el anillo muestran skeleton con el mismo alto. |
| Éxito | Cifras, porcentaje y anillo calculados. |
| Total 0 | Porcentaje `0%` (sin NaN); anillo vacío. |
| Error en un conteo | Ese KPI y el anillo muestran el error con "Reintentar"; el resto sigue. |
| Error en PB-24 | KPI 4 "No disponible"; no afecta el resto. |
| 401 en cualquier request | Lo maneja el cliente de T-08 (redirige a `/login`). Esta tarea no lo trata. |
| `yo` falla | Saludo con el email del claim. Sin error visible. |
| Sin email ni nombre | Saludo `Hola` sin coma (caso raro; no bloquear la página). |
| Suma de porcentajes distinta de 100 por redondeo | Se muestra cada porcentaje redondeado; no se corrige. |
| Foco | Anillo de foco visible en las acciones de reintento. |

## 10. Tests requeridos

Herramientas: Vitest, Testing Library, MSW (`server.use` por caso).

| Test | Qué afirma |
|---|---|
| `muestra "Hola, {nombre}" con el nombre de yo` | Saludo con datos del mock. |
| `si yo falla, muestra el email del claim` | Fallback con 404 de yo. |
| `muestra cuatro KPI con sus títulos en orden` | Títulos de §8. |
| `pide cinco conteos con estado por nombre, pagina=1 y tamano=1` | Captura de query params. |
| `el total del anillo es la suma de los cinco conteos` | Con mocks 312, 27, 9, 15, 27 → 390. |
| `Pólizas vigentes muestra "80% de las pólizas" con vigentes 312 y total 390` | Redondeo y texto. |
| `total 0 muestra 0% y no NaN` | Sin pólizas. |
| `un conteo en error muestra error en su widget y el resto sigue` | Aislamiento de errores. |
| `reintentar vuelve a pedir solo el conteo fallido` | Un request extra, al mismo endpoint. |
| `PB-24 con 500 muestra "No disponible" en KPI 4` | Degradación. |
| `KPI 4 muestra el chip "Atender hoy" y la nota "Recargo 5% aplicado"` | Literales. |
| `KPI 2 y KPI 3 no muestran nota` | Decisión D-B02-2. |
| `el SVG del anillo tiene aria-hidden y la leyenda es una lista` | `ul > li` con cifra y porcentaje. |
| `los segmentos del SVG suman la circunferencia` | Test unitario de la función de cálculo (sin snapshot). |
| `durante la carga hay skeleton y no cifras` | Estado de carga. |
| `no aparecen valores de muestra del Figma` | Ausencia de "312", "Mariela" y "14" como texto fijo cuando la respuesta es otra. |
| `no tiene violaciones de accesibilidad` | Helper de US-FE-T-19 (axe). |

## 11. Criterios de aceptación

1. `/inicio` carga dentro del shell de T-16 y muestra el saludo con el nombre de `yo` o, si falla, el email del claim.
2. Hay cuatro KPI en el orden `Pólizas vigentes`, `Pendientes de pago`, `Suspendidas`, `Cuotas vencidas hoy`.
3. Se hacen cinco requests `GET /api/polizas` con `estado` por nombre, `pagina=1` y `tamano=1`, sin requests extra para el total.
4. El total del anillo y el denominador del porcentaje son la suma de los cinco conteos.
5. "Pólizas vigentes" muestra `{n}% de las pólizas` con redondeo entero y `0%` cuando el total es 0.
6. El anillo se calcula desde los conteos y no usa los SVG del Figma.
7. El SVG del anillo tiene `aria-hidden="true"`; la leyenda es una `<ul>` con cifra y porcentaje.
8. KPI 4 consume el total de `GET /api/cuotas?estado=Vencida&pagina=1&tamano=1` y muestra "No disponible" si falla.
9. Un error en un widget no oculta los demás y ofrece "Reintentar" que vuelve a pedir solo ese dato.
10. No hay cifras, nombres ni fechas de muestra como texto fijo.
11. No se muestra el widget de tareas del día ni la línea de resumen del saludo.
12. Los tests de §10 están en verde y el test de axe no tiene violaciones.
13. `npm run lint`, `typecheck`, `test` y `build` están en verde en `apps/backoffice`.

## 12. Verificación manual

Requiere el back local (o MSW con `VITE_USE_MOCKS=true` para los endpoints sin implementar).

1. Ingresar con una cuenta de prueba confirmada por el equipo.
2. Abrir `/inicio`. Ver el saludo, cuatro KPI y el anillo con leyenda.
3. Comparar los conteos de vigentes, pendientes y suspendidas con los del listado de pólizas (B-13) cuando esté disponible, o con una consulta directa a `GET /api/polizas?estado=Vigente&tamano=1` en el navegador.
4. Simular un error de red (DevTools, "Offline") y ver el error de widget con "Reintentar".
5. Confirmar con la persona responsable los pasos 2 y 3 antes del PR (workflow regla 7).

## 13. Decisiones pendientes (con default)

- **D-B02-1. Nombre en el saludo (PB-04, B2 D-1).** Default: nombre de `yo` (mock); si falla, el email del claim. Cambiar a nombre real cuando el back publique PB-04.
- **D-B02-2. Notas de KPI 2 y 3.** Default: sin nota. B2 propone "Con cuota 1 sin pagar" y "Con 2 cuotas vencidas", pero son inferencias no confirmadas (B2 D-8 y RN09). Confirmar.
- **D-B02-3. Cifra de KPI 4 sin PB-24.** Default: "No disponible" si el mock falla; con el mock activo, la cifra del mock. B2 D-2 pregunta si "vencidas hoy" cuenta el estado `Vencida` (cualquier fecha) o vencimientos de hoy. Default: estado `Vencida`.
- **D-B02-4. Topbar y "Nueva cotización".** Fuera de esta tarea (T-16). Default: el botón lleva a un destino pendiente (B2 D-5); no se implementa aquí.
- **D-B02-5. Ubicación del donut y de KPI.** Default: en `features/inicio` (B2 §4 los ubica en `polizas`). Evita depender de B-13 y de un feature que todavía no existe. Ver sección 16.
- **D-B02-6. Colores del anillo.** Default: tokens de `Badge/Estado` (design-system §5.4). "Vencida" usa el token de su badge; B2 D-10 queda sin resolver.

## 14. Riesgos y errores comunes

- **Enum en la respuesta:** `estado` llega como número. Esta tarea no lee `estado` de los items. Si alguien lo necesita, usa el mapa de T-10. Nunca comparar contra números crudos (FC9).
- **Query por número:** `estado=1` devuelve error 400. Siempre por nombre.
- **Parámetro distinto:** pólizas usa `tamano` en la request y `tamanoPagina` en la respuesta. Clientes usa `tamanoPagina` (no aplica aquí).
- **Division por cero** y `NaN` en porcentajes.
- **Llamadas duplicadas:** las cinco entradas de `useQueries` deben usar las keys de T-28 para compartir caché con B-13.
- **Mezclar el resumen de cuotas de B-03 con el KPI 4:** el KPI 4 usa el total de la lista de cuotas; no inventar una cifra desde las pólizas.
- **Fecha del navegador:** no usar `new Date()` como fecha de corte (B2 §9); la fecha de corte viene de B-03 o de PB-08.

## 15. Definición de terminado

- `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` en verde en `apps/backoffice`.
- Sin secretos ni credenciales en el código.
- Accesibilidad revisada con el helper de US-FE-T-19 en `/inicio`.
- Sin datos de muestra fijos, sin `any`, sin formateo manual de números fuera del formateador de T-09.
- Criterios de §11 tildados, cada uno con evidencia observada.

## 16. Observaciones al índice

- Resuelto (triage final, default de la ficha): cuenta de llamadas. INDEX dice cinco llamadas; PB-08 dice seis (sin filtro). B2 D-14 confirma que la suma de los cinco estados da el total (390). Se usan cinco. Motivo: no figura en REVISION.md ni en FB8.
- Resuelto (RV-36): KPI 4 y donut son de B-02. La fila lista `GET /api/cuotas` (mock de T-28) para el KPI 4; PB-24 queda como mock en la sección 7 y no en la columna de bloqueos del INDEX.
- Resuelto (RV-36): el donut vive en `features/inicio`, carpeta que crea B-02. Si después se mueve a otro feature, solo cambian imports.
- Resuelto (RV-19): el fallback del saludo usa el selector `emailSesion` de T-13; B-02 declara T-13.

