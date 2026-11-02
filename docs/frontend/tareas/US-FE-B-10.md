# US-FE-B-10: Cotizar: planes y acción Cotizar

Tipo: B · Oleada: 4 · Tamaño: M · Rama sugerida: `feature/US-FE-B-10-cotizar-planes` · Tarjeta Trello: `US-FE-B-10`

## 1. Objetivo

El Empleado o Administrador abre `/cotizaciones/nueva?vehiculoId=&clienteId=` y ve el contexto del vehículo y del cliente. Pulsa **Cotizar**, que es la única llamada a `POST /api/cotizaciones`; nunca se dispara al montar la pantalla (FB7.9). Ve los planes compatibles ordenados por prima. Ninguno viene elegido. **Continuar a emisión** lleva a `/polizas/nueva?cotizacionId=<idCotizacion>` (B-12).

Queda creado el feature `features/cotizaciones`, dueño de su `index.ts` y de su `routes.tsx`. Deja vacío el slot `aside` del layout para que B-11 agregue el rail.

## 2. Alcance

**Entra**
- Ruta, validación de query params y guarda de sesión.
- Contexto: cliente (nombre, apellido, DNI) y vehículo (marca, modelo, año, patente).
- Botón **Cotizar** con mutación `POST /api/cotizaciones` al clic, sin reintento automático.
- Lista de opciones (grupo de radios) que devuelve `POST /api/cotizaciones` (RN05), con código, nombre y prima mensual. La descripción sale de `GET /api/planes` (RV-33).
- Vigencia con `fechaVencimiento` y estado "vencida".
- CTA **Continuar a emisión**, habilitado solo con una opción elegida y vigente. (RV-34: lo implementa esta tarea porque su habilitación depende de la selección y de la vigencia de esta pantalla.)
- Error con `detail` del back.

**No entra**
- Línea de cálculo y rail "Datos de la cotización" (B-11, PB-10).
- Vista de emisión (B-12).
- Botón "Guardar cotización" (D-B7-07: no tiene endpoint; se omite).
- Link "Cambiar datos" (D-B7-08: sin destino definido; se omite).
- Chip "Recomendado" (D-B7-04: no hay campo; se omite).
- Reconstruir la lista al recargar (PB-26: al recargar hay que cotizar otra vez a mano).
- Campana del Topbar (T-16).

## 3. Dependencias

- **Oleada:** 4.
- **Depende de:** US-FE-T-05, US-FE-T-06, US-FE-T-08, US-FE-T-09, US-FE-T-11, US-FE-T-13, US-FE-T-16, US-FE-T-19, US-FE-T-24, US-FE-T-26, US-FE-T-27.
- **Puede empezar sin esperar a:** US-FE-B-07 (solo navegación).
- **Bloqueada por pedidos al back:** PB-26 (degrada: cotizar al clic, sin recarga).

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB1, FB3, FB4 (importes, fechas y enums), FB5, FB7.9 (mutaciones sensibles), FB7.11 (datos faltantes).
- `docs/frontend/tareas/INDEX.md`: fila `US-FE-B-10`; FC2, FC9, FC10, FC11, FC14, FC16; "Ownership" (`features/cotizaciones/`); decisión D-18 (ninguna preseleccionada).
- `docs/frontend/pantallas/B7-cotizar.md`: §2 (ruta y guardas), §3 (solo la columna principal; el rail es de B-11), §4 (componentes), §5 (textos), §6 (validaciones de flujo), §7 (estados), §8 (acciones), §9 (filas de `POST /api/cotizaciones`, `GET /api/planes`, `GET /api/vehiculos/{id}`, `GET /api/clientes/{id}`), §10 (RN05, RN06, RN16), §11, §12, §13 D-B7-01, D-B7-03, D-B7-04, D-B7-05, D-B7-06, D-B7-07, D-B7-08, D-B7-09, D-B7-10, D-B7-11.
- `docs/frontend/contratos-api/vehiculos-planes-cotizaciones.md`: §0.1 (`ProblemDetails`), §2.3 (`GET /api/vehiculos/{id}`), §3.2 (`PlanResponse`), §4.1 (`GET /api/planes`), §5.4 (qué bloquea cotizar), §6.1 (`POST /api/cotizaciones`), §6.2 (`CotizacionDto`, solo para ver que no se usa aquí).
- `docs/frontend/design-system.md`: §5.1 (Button), §8.3 (foco visible). El radio no es componente del DS: se usa el radio nativo estilizado (ver §5).
- `docs/frontend/pedidos-al-back.md`: PB-10, PB-12, PB-26.

## 5. Archivos a crear o modificar

Todos bajo `frontend/apps/backoffice/src/`.

| Archivo | Acción | Dueño |
|---|---|---|
| `features/cotizaciones/routes.tsx` | Crea. Ruta `/cotizaciones/nueva` (estática) | B-10 |
| `features/cotizaciones/index.ts` | Crea. Exporta las rutas | B-10 |
| `features/cotizaciones/pages/NuevaCotizacionPage.tsx` | Crea. Compone; deja `<aside data-slot="rail">` vacío | B-10 |
| `features/cotizaciones/components/PlanesCompatibles.tsx` | Crea. H2 y `role="radiogroup"` | B-10 |
| `features/cotizaciones/components/PlanOpcionCard.tsx` | Crea. Una opción: `<label>` con `<input type="radio">` nativo estilizado | B-10 |
| `features/cotizaciones/components/VigenciaCotizacion.tsx` | Crea | B-10 |
| `features/cotizaciones/components/AccionesCotizacion.tsx` | Crea. Botón Cotizar y CTA Continuar | B-10 |
| `features/cotizaciones/components/ordenarOpciones.ts` | Crea. Orden por `primaMensual` ascendente (D-B7-06) | B-10 |
| `features/cotizaciones/schemas/parametrosCotizacion.ts` | Crea. zod para los query params | B-10 |
| `features/cotizaciones/api/useVehiculoContexto.ts` | Crea | B-10 |
| `features/cotizaciones/api/useClienteContexto.ts` | Crea | B-10 |
| `features/cotizaciones/api/usePlanesCatalogo.ts` | Crea | B-10 |
| `features/cotizaciones/api/useCotizar.ts` | Crea. `useMutation`, `retry: 0` | B-10 |
| `features/cotizaciones/**/*.test.ts(x)` | Crea | B-10 |

Sin editar: `app/router.tsx` (T-14 ya compone las rutas del feature), `packages/*` (T-05, T-08, T-09, T-24, T-26, T-27). Radio nativo: no se agrega `RadioCard` a `@nexa/ui` (FC2, FC17).

## 6. Pasos de implementación

1. Leer la fila de B-10 en el índice. Confirmar T-05, T-06, T-08, T-09, T-11, T-13, T-16, T-19, T-24, T-26 y T-27 (o sus mocks).
2. **RED:** escribir los tests `ordenarOpciones`, `no POST al montar` y `CTA deshabilitado sin selección` (§10) y verlos fallar.
3. `parametrosCotizacion`: `vehiculoId` es UUID obligatorio. `clienteId` es opcional; si falta, se toma de `VehiculoResponse.clienteId`. Sin `vehiculoId` redirige a `/clientes` (DP-B10-05).
4. Hooks (TanStack Query, solo en `features/cotizaciones/api/`):
   - `useVehiculoContexto(vehiculoId)` → `vehiculosKeys.detalle`.
   - `useClienteContexto(clienteId)` → `clientesKeys.detalle`.
   - `usePlanesCatalogo()` → `planesKeys.lista()`. Es un GET y puede cargar al montar.
   - `useCotizar()` → `useMutation({ mutationFn: (vehiculoId) => cotizarVehiculo({ vehiculoId }), retry: 0 })`. Esta es la única mutación de la pantalla.
5. `NuevaCotizacionPage`: h1 `Nueva cotización`, líneas de contexto, `AccionesCotizacion` y el slot `aside`. No llama a `cotizarVehiculo` en ningún efecto.
6. `AccionesCotizacion`: botón **Cotizar**. Mientras corre, `disabled` y texto DP-B10-02. Al éxito, guarda `data` en el estado de la mutación; no hay nada que restaurar al recargar.
7. Con `data.opciones`: `ordenarOpciones` (por `primaMensual` ascendente) → `PlanesCompatibles`. Cada `PlanOpcionCard` es un `<label>` con `<input type="radio" name="plan" value={idCotizacion}>`. La descripción sale de `planes` cruzando `codigoPlan` con `PlanResponse.codigo`; si no hay coincidencia, la línea se omite (sin texto inventado).
8. Ninguna opción queda marcada al llegar (D-18): `checked` solo tras un clic del usuario.
9. `VigenciaCotizacion`: con `fechaVencimiento` (UTC) usa el formateador de T-09 para mostrar la fecha en Argentina. Si `ahora > fechaVencimiento` (reloj del cliente), muestra la versión vencida (DP-B10-06) y deshabilita el CTA.
10. CTA **Continuar a emisión**: deshabilitado (`aria-disabled="true"`) sin selección o si está vencida, con el helper visible DP-B10-03. Habilitado: navega a `/polizas/nueva?cotizacionId=${opcion.idCotizacion}` (ruta de B-12; no es import, FB3).
11. Error de la mutación: `ApiError` → `AlertaError` (T-07) con el `detail` tal cual (FB7.6). Sin `detail`, DP-B10-04. El botón **Cotizar** queda habilitado para que el usuario decida; no hay reintento automático ni botón "Reintentar" (FB7.9, FC11).
12. `routes.tsx`: exporta `/cotizaciones/nueva`. El router de T-14 la compone; no se toca `app/router.tsx`.
13. GREEN, luego refactor. Correr `lint`, `typecheck`, `test` y `build` del backoffice.

## 7. Contrato con el back

| Método y ruta | Estado | Uso |
|---|---|---|
| `POST /api/cotizaciones` | Implementado (PR #49) | Cotizar al clic. 201 con `CotizacionResultado` (sin `Location`). |
| `GET /api/vehiculos/{id}` | Implementado (PR #47) | Contexto del vehículo. |
| `GET /api/planes` | Implementado (PR #23), anónimo | Descripción de cada plan. |
| `GET /api/clientes/{id}` | Especificado (US-F1-06) | Contexto del cliente. Mock de T-24. |
| `GET /api/cotizaciones/{id}` | Implementado | No se usa en esta pantalla (lo usa B-12). |

Tipos (dueño T-26 en `packages/api/src/dto/cotizaciones.ts`; no se redefinen):

```ts
export interface CotizarVehiculoRequest { vehiculoId: string; }

export interface OpcionCotizacion {
  idCotizacion: string; // id de la Cotizacion persistida para este plan; es el que usa B-12
  codigoPlan: string;   // RC | TC | TR
  plan: string;         // nombre del plan
  primaMensual: number; // ARS, 2 decimales
}

export interface CotizacionResultado {
  fechaVencimiento: string; // UTC, igual para todas las opciones
  opciones: OpcionCotizacion[];
}
```

Errores del `POST` (texto exacto, `vehiculos-planes-cotizaciones.md §6.1`):

| Status | Texto del back | Tratamiento |
|---|---|---|
| 400 | `Ningún plan es compatible con el vehículo.` | Alerta con el texto. |
| 400 | `El vehículo {id} está dado de baja y no se puede cotizar.` | Alerta con el texto. |
| 404 | `El vehículo {id} no existe.` | Alerta con el texto. |
| 404 | `El cliente {id} del vehículo no existe.` | Alerta con el texto. |
| 400 | `errors.vehiculoId` (validación de modelo) | No es alcanzable: la ruta exige UUID. Si llegara, alerta general. |
| 401 / 403 | — | T-08 y T-13. |

Handlers MSW: `POST /api/cotizaciones`, `GET /api/vehiculos/{id}`, `GET /api/planes` (T-26 y T-27), `GET /api/clientes/{id}` (T-24). Esta tarea no escribe handlers; los tests sobreescriben con `server.use(...)`.

Nombres de funciones y keys (`cotizarVehiculo`, `obtenerVehiculo`, `obtenerCliente`, `listarPlanes`, `vehiculosKeys.detalle`, `clientesKeys.detalle`, `planesKeys.lista`) son sugeridos; los exportan sus dueños.

PB-26 (degrada): sin listado ni recarga; cotizar al clic. PB-12 (degrada): sin `Idempotency-Key`; mitigación: botón deshabilitado y `retry: 0`. PB-10 bloquea B-11 (línea de cálculo), no esta tarea.

Ejemplo de respuesta para tests (del contrato §6.1, importes de prueba):

```json
{ "fechaVencimiento": "2026-11-12T02:30:00Z",
  "opciones": [
    { "idCotizacion": "0c1d2e3f-4a5b-4c6d-8e7f-901a2b3c4d5e", "codigoPlan": "RC", "plan": "Responsabilidad Civil", "primaMensual": 11000.00 },
    { "idCotizacion": "1d2e3f4a-5b6c-4d7e-9f80-012b3c4d5e6f", "codigoPlan": "TC", "plan": "Terceros Completo", "primaMensual": 19800.00 },
    { "idCotizacion": "2e3f4a5b-6c7d-4e8f-8091-123c4d5e6f70", "codigoPlan": "TR", "plan": "Todo Riesgo", "primaMensual": 30250.00 }
  ] }
```

Con ese `fechaVencimiento` (UTC), la fecha en Argentina es `11/11/2026`: sirve para probar la zona horaria (D-B7-11).

## 8. Contenido de UI (literal)

| Zona | Texto |
|---|---|
| Título (h1) | `Nueva cotización` |
| Contexto cliente | `Cliente: {nombre} {apellido}` (DP-B10-07) |
| Contexto vehículo | `Vehículo: {marca} {modelo} {anio}` y `{patente}` en mono debajo (DP-B10-07) |
| Botón | `Cotizar` (DP-B10-01) |
| Mientras corre | `Calculando planes…` (DP-B10-02) |
| H2 | `Planes compatibles` |
| Subtítulo | `Prima mensual = prima base x factores (RN06). La cotización vale 15 días.` |
| Opción | Código en mono (`RC`, `TC`, `TR`), nombre (`Responsabilidad Civil`…), descripción de `GET /api/planes`, etiqueta `Prima mensual`, monto con formato de T-09 (`$ 11.000,00`) |
| Vigencia | `Válida hasta el {dd/MM/yyyy}` |
| Vigencia vencida | `Vencida el {dd/MM/yyyy}` (DP-B10-06) |
| CTA | `Continuar a emisión` |
| Helper del CTA deshabilitado | `Seleccioná un plan para continuar` (DP-B10-03) |

Nombre accesible de cada opción: `{codigo} {plan}, prima mensual {monto en pesos}` (B7 §12). Sin el chip "Recomendado" (D-B7-04).

**No se renderizan:** `Guardar cotización`, `Cambiar datos`, chip `Recomendado`, rail "Datos de la cotización" (es de B-11).

## 9. Estados y casos borde

| Caso | Comportamiento |
|---|---|
| Carga inicial | Contexto con skeleton. Botón **Cotizar** habilitado si el vehículo cargó. Sin lista. |
| Sin `vehiculoId` | Redirige a `/clientes` (DP-B10-05). Sin request. |
| `vehiculoId` que no es UUID | Igual que sin `vehiculoId`. |
| Vehículo 404 o 5xx | `AlertaError` con el `detail`. Botón **Cotizar** deshabilitado. |
| Cotizando | **Cotizar** deshabilitado con `aria-busy="true"`; texto DP-B10-02. |
| Éxito | Lista de opciones ordenada por prima ascendente. Ninguna marcada. CTA deshabilitado. |
| Error 400 o 404 del POST | `AlertaError` con `detail`. **Cotizar** sigue habilitado; sin reintento automático. |
| Error 5xx o red del POST | `AlertaError` con `detail` o DP-B10-04. Sin reintento automático (un POST puede haber persistido). |
| Doble clic en Cotizar | Una sola request (el botón se deshabilita en el primer clic). |
| Seleccionar una opción | Radio marcado (`aria-checked="true"`), fondo de la fila resaltado, CTA habilitado. |
| Cotización vencida | Texto vencida (DP-B10-06), CTA deshabilitado, las opciones siguen visibles. |
| Cambio de vehículo en la URL | La lista y la selección se limpian. |
| Permisos | Empleado o Administrador (T-13). |

## 10. Tests requeridos

| Test | Afirma | Herramienta |
|---|---|---|
| `ordenarOpciones: ordena por primaMensual ascendente` | RC 11.000 < TC 19.800 < TR 30.250 | Vitest |
| `ordenarOpciones: no muta el arreglo de entrada` | Entrada intacta | Vitest |
| `schema: vehiculoId obligatorio y UUID` | Rechaza ausencia y texto | Vitest |
| `form: no hay POST al montar` | Contador de requests a `/api/cotizaciones` en 0 | Testing Library + MSW |
| `form: Cotizar envía exactamente un POST con { vehiculoId }` | Body y conteo en 1 | Testing Library + MSW |
| `form: doble clic en Cotizar envía una sola request` | Conteo en 1 con delay de MSW | Testing Library + MSW |
| `form: 500 no reintenta` | Una sola request | MSW |
| `lista: muestra las opciones en orden de prima` | Orden visual RC, TC, TR | Testing Library |
| `lista: ninguna opción preseleccionada` | `aria-checked` falso en todas; CTA deshabilitado | Testing Library |
| `lista: seleccionar TC habilita el CTA` | CTA habilitado | Testing Library |
| `cta: Continuar navega con el idCotizacion de la opción elegida` | Ruta `/polizas/nueva?cotizacionId=<id TC>` | Testing Library + router en memoria |
| `formato: importe con $ y separadores es-AR` | `$ 19.800,00` | Testing Library |
| `vigencia: 2026-11-12T02:30:00Z se muestra 11/11/2026` | Fecha en Argentina | Testing Library |
| `vigencia: fecha pasada muestra Vencida y CTA deshabilitado` | Texto y `aria-disabled` | Testing Library |
| `descripción: toma descripcion de GET /api/planes por codigo` | Texto de RC | Testing Library + MSW |
| `descripción: sin coincidencia omite la línea` | No aparece texto inventado | Testing Library |
| `error: 400 "Ningún plan es compatible..." se muestra tal cual` | `role="alert"` con el texto exacto | Testing Library + MSW |
| `vehiculoId faltante redirige a /clientes` | Sin request | Testing Library |
| `a11y: radiogroup con nombre accesible por opción` | `name` incluye código, plan y prima | Testing Library |
| `a11y: sin violaciones con lista cargada` | Axe sin violaciones | vitest-axe (T-19) |

## 11. Criterios de aceptación

1. La ruta `/cotizaciones/nueva` renderiza para Empleado o Administrador dentro de `LayoutBackoffice`.
2. Al montar la pantalla no se envía ningún `POST /api/cotizaciones` (contador en 0).
3. Un clic en **Cotizar** envía exactamente un `POST` con `{ vehiculoId }`.
4. Mientras corre la cotización, **Cotizar** está deshabilitado y un doble clic produce una sola request.
5. Las opciones se muestran ordenadas por `primaMensual` ascendente.
6. Ninguna opción queda seleccionada al llegar, y el CTA está deshabilitado.
7. Seleccionar una opción la marca con `aria-checked="true"` y habilita el CTA.
8. **Continuar a emisión** navega a `/polizas/nueva?cotizacionId=` con el `idCotizacion` de la opción elegida.
9. El importe se muestra con el formateador de T-09 (`$ 19.800,00`).
10. La vigencia se muestra en fecha de Argentina; con fecha pasada aparece "Vencida el …" y el CTA queda deshabilitado.
11. La descripción de cada plan sale de `GET /api/planes`; sin coincidencia no se muestra texto.
12. Un error del POST muestra su `detail` tal cual, sin reintento automático.
13. Sin `vehiculoId` la pantalla redirige a `/clientes` sin request.
14. No aparecen "Guardar cotización", "Cambiar datos" ni el chip "Recomendado".
15. El `<aside data-slot="rail">` existe y está vacío.
16. Todos los tests de §10 están en verde, sin axe violations.
17. `lint`, `typecheck`, `test` y `build` del backoffice están en verde.

## 12. Verificación manual

1. `VITE_USE_MOCKS=true npm run dev -w apps/backoffice`, sesión de Empleado.
2. Abrir `/cotizaciones/nueva?vehiculoId=<id-mock>&clienteId=<id-mock>`. Abrir la pestaña Network: no debe aparecer ningún POST.
3. Clic en **Cotizar**: un único POST. Verificar el orden RC, TC, TR por prima.
4. Seleccionar TC: el CTA se habilita. Clic: navega a `/polizas/nueva?cotizacionId=`.
5. Recargar la página: la lista desaparece y no se crea ninguna cotización hasta un nuevo clic (PB-26).
6. Con un vehículo sin planes compatibles en el mock, verificar el texto `Ningún plan es compatible con el vehículo.`

Confirmar al responsable los pasos antes de abrir el PR.

## 13. Decisiones pendientes

- **DP-B10-01** Texto del botón que dispara la cotización. La Figma no tiene botón (D-B7-01). Default: `Cotizar`.
- **DP-B10-02** Texto mientras cotiza (B7 §7, NO DEFINIDO). Default: `Calculando planes…`.
- **DP-B10-03** Helper del CTA deshabilitado (B7 §12, propuesta). Default: `Seleccioná un plan para continuar`.
- **DP-B10-04** Mensaje cuando el error no trae `detail`. Default: `No se pudo cotizar el vehículo. Intentá de nuevo.`
- **DP-B10-05** Sin `vehiculoId`: B7 §2 propone redirigir o mostrar error. Default: redirigir a `/clientes`.
- **DP-B10-06** Texto de cotización vencida (B7 §7, propuesta). Default: `Vencida el {dd/MM/yyyy}`.
- **DP-B10-07** Etiquetas de contexto `Cliente:` y `Vehículo:`. La Figma las muestra en el rail (B-11). Default: estos textos en la columna principal.
- **D-B7-01** (cuándo se crea la cotización): decidido en el índice (solo al clic). Esta tarea lo implementa.
- **D-B7-05**: ninguna preseleccionada (D-18 del índice). Implementado.
- **D-B7-06**: orden por prima ascendente. Implementado.
- **D-B7-07, D-B7-08, D-B7-04**: se omiten (ver §2).
- **D-B7-09, D-B7-11**: vencida y zona horaria. Implementado con los defaults de B7.
- **D-B7-03**: descripción desde `GET /api/planes`. Si el seed no tiene descripciones, la línea se omite.

## 14. Riesgos y errores comunes

- Llamar al `POST` en un `useEffect` o en el `useQuery` de la página. Viola FB7.9 y duplica cotizaciones en cada montaje.
- Usar `GET /api/planes` como lista de opciones. Esa lista no filtra por compatibilidad (RN05); las opciones salen solo del `POST`.
- Recalcular la prima en el front. La prima es la del back (RN06).
- Mostrar la fecha de `fechaVencimiento` en UTC: en la madrugada cambia el día (D-B7-11).
- Reintentar el `POST` automáticamente: ver §9.
- Dejar el slot `aside` sin definir: B-11 no tendría dónde montar el rail.
- Importar `features/cotizaciones` desde `features/polizas` (o al revés). Solo por la ruta, no por import (FB3).

## 15. Definición de terminado

- `lint`, `typecheck`, `test` y `build` del backoffice en verde.
- Todos los criterios de §11 tildados con evidencia observada.
- Accesibilidad revisada con T-19.
- Pasos de §12 entregados y confirmados antes del PR a `development`.

## 16. Observaciones al índice

- Resuelto (RV-33): la lista de opciones sale solo de `POST /api/cotizaciones`; `GET /api/planes` aporta la descripción. La fila de B-10 del INDEX ya lo dice.
- Resuelto (RV-34): el CTA "Continuar a emisión" lo implementa B-10; B-11 no lo incluye.
- Resuelto (RV-04): B-10 declara T-06, T-08, T-09 y T-13 además de las dependencias de la fila.

