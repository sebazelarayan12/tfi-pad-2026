# US-FE-B-17: Pagos: cobro en caja y factura

Tipo B · Oleada 3 · Tamaño M · Rama sugerida `feature/US-FE-B-17-cobro-caja-factura` · Tarjeta Trello `US-FE-B-17`

## 1. Objetivo

Al terminar, existe la feature `pagos` del backoffice con cuatro piezas reutilizables: (a) `CobroCaja`, la selección de cuotas impagas y el cobro en caja con `POST /api/pagos/caja`; (b) el hook `useCobrarCuotas`, que usan B10 (botón del encabezado en B-16 y widget de deuda en B-18) y B11 (rail, B-19) para cobrar; (c) `CobrarVencidasButton`, el botón "Registrar pago en caja" que cobra las cuotas vencidas de una póliza con un clic (RV-D10); (d) `FacturaPanel`, la vista de la factura de un pago (estados `PENDIENTE_CAE` y `AUTORIZADA`). Usuarios: Empleado y Administrador. Esta tarea no tiene ruta propia: las pantallas que la componen son B-16, B-18 y B-19.

## 2. Alcance

**Entra**
- Feature `apps/backoffice/src/features/pagos/` con `api/`, `components/`, `schemas/`, `types/`, `routes.tsx` e `index.ts` (FC1: esta es la primera tarea que crea la feature y es dueña de `index.ts` y de `routes.tsx`).
- `routes.tsx`: exporta `pagosRoutes` como array vacío. B-19 agrega la ruta `/pagos`. Si T-14 dejó un stub de este archivo, se reemplaza.
- Hooks TanStack Query en `features/pagos/api/usePagos.ts`: `useCobrarCuotas`, `usePago(pagoId)`, `useFactura(pagoId)`.
- Componentes: `CobroCaja`, `CuotaCheckItem`, `CobrarVencidasButton`, `FacturaPanel`, `EstadoFacturaBadge`, `EstadoPagoBadge`.
- Schema zod `cobroCajaSchema` en `schemas/cobroCaja.ts`.
- Tipo `CuotaCobrable` en `types/cobro.ts`.
- Tests de la sección 10.

**NO entra**
- Pantalla `/pagos` y su rail con búsqueda por póliza: US-FE-B-19.
- Widget "Deuda vencida", widget "Pagos" y rail de la ficha de póliza B10: US-FE-B-18 (reutiliza `CobrarVencidasButton`).
- Colocar el botón "Registrar pago en caja" en la barra de acciones de la póliza: US-FE-B-16 (RV-D10). Cupón y cancelar: US-FE-B-16.
- Total previo a cobrar o suma en el front: no entra (RV-D14).
- Cupón de Pago Fácil: US-FE-B-16.
- Reintento de factura (`Reintentar`) y descarga de PDF: fuera de alcance (D-12, `pagos-facturas.md` §7.3). No se implementan ni como botón oculto.
- Listado de pagos (`GET /api/pagos`) y `GET /api/polizas/{id}/pagos`: no existen (PB-05). Esta tarea no los consume.
- Cualquier edición de `packages/api`, `packages/ui` o `packages/config`.

## 3. Dependencias

- **Oleada (INDEX):** 3.
- **Puede empezar sin esperar a:** `US-FE-B-15` (misma feature en otro PR; esta tarea no importa nada de `features/polizas`).
- **Depende de:** `US-FE-T-04`, `US-FE-T-05`, `US-FE-T-07`, `US-FE-T-09`, `US-FE-T-10`, `US-FE-T-11`, `US-FE-T-19`, `US-FE-T-28`, `US-FE-T-29`.
- **Pedidos al back (INDEX):** PB-12 (degrada), PB-25 (no se muestra forma de pago).
- **Degradaciones:** PB-12 (sin `Idempotency-Key`): mitigación con botón deshabilitado durante el envío, `retry: 0` y no reenviar tras error de red (FB7.9, FC11). PB-25: no se muestra forma de pago. PB-16: las fechas se formatean con T-09, que trata todo `DateTime` sin offset como UTC.
- **Qué entrega T-29 que esta tarea consume:** funciones de request para `POST /api/pagos/caja`, `GET /api/pagos/{id}` y `GET /api/pagos/{id}/factura`; tipos `PagoResponse`, `FacturaResponse`, `PagoCajaRequest`; y las query keys `pagosKeys` (p. ej. `pagosKeys.detalle(id)`, `pagosKeys.factura(id)`). Si T-29 usa otros nombres, se usan los de T-29. Si falta algo, se pide a T-29; esta tarea no lo escribe.
- **Qué entrega T-28 que esta tarea consume:** tipo `CuotaResponse` y query keys `polizasKeys` (para invalidar cuotas y detalle tras cobrar).
- **Mocks MSW:** no se crean handlers. En tests se usan los handlers de T-29 con `server.use(...)` para simular 201, 400, 404 y error de red.

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB1 (stack), FB3 (reglas 1 a 5), FB4 (fechas y dinero), FB7.3 (enums), FB7.6 (mensajes), FB7.9 (mutaciones sensibles).
- `docs/frontend/tareas/INDEX.md`: FC1 (ownership), FC2 (hooks solo en `features/<dominio>/api/`), FC9 (enums, fechas y dinero), FC10 (errores), FC11 (mutaciones sensibles), FC16 (accesibilidad).
- `docs/frontend/pantallas/B10-detalle-poliza.md`: §5 (textos `Pagos`, `Medio`, `Factura`, `Facturada`, `Pendiente CAE`, `Registrar pago en caja`), §7 (tabla "Estado de pago" y "Éxito de pago en caja"), §9 (origen del campo factura), D1 y D8 de §13.
- `docs/frontend/pantallas/B11-pagos-y-facturas.md`: §4 (variantes de badge: `Aprobado`, `Pendiente`, `Rechazado`, `Pendiente de CAE`), §5 (checkbox `Cuota {N}`, `Total a registrar`, `Registrar pago`, `Se emite la factura con CAE al confirmar.`), §6 (tabla "Cuotas (checkbox)": solo Pendiente o Vencida; rechazo de Pagada y Anulada).
- `docs/frontend/contratos-api/pagos-facturas.md`: §3 (tipos TS compartidos), §6.3 (validaciones y códigos de caja), §6.4 (respuesta 201), §7.1 y §7.2 (estados y campos de factura), §9.2 (doble clic y reenvío), §10.1, §10.2 y §10.3 (endpoints).
- `docs/frontend/contratos-api/polizas-cuotas-pagofacil.md`: §2 (`EstadoCuota`: 0 Pendiente, 1 Vencida, 2 Pagada, 3 Anulada) y §5.5 (`CuotaResponse`).
- `docs/frontend/contratos-api/convenciones-transversales.md`: §3.4 (tipo `ProblemDetails`), §5.1 (enums: `PagoResponse` y `FacturaResponse` llegan como string), §5.3 (fechas), §5.4 (dinero: el back es la fuente del total).
- `docs/frontend/design-system.md`: §5.1 (Button), §5.4 (Badge/Estado y sus tokens), §5.13 (Card/Widget para `FacturaPanel`), §8.3 (foco visible).
- `docs/frontend/pedidos-al-back.md`: fichas PB-12, PB-16 y PB-25.
- Back, para verificar el mensaje del 400 de `cuotaIds` vacío: `backend/Aseguradora.Application/Dtos/PagoCajaRequest.cs:9` (`"Debe indicar al menos una cuota."`).

## 5. Archivos a crear o modificar

Todos bajo `frontend/apps/backoffice/src/features/pagos/`. Dueño de todos: US-FE-B-17.

| Archivo | Qué contiene |
|---|---|
| `routes.tsx` | `export const pagosRoutes: RouteObject[] = [];` |
| `index.ts` | Exporta `CobroCaja`, `FacturaPanel`, `CobrarVencidasButton`, `useCobrarCuotas`, `usePago`, `useFactura`, `cobroCajaSchema`, `pagosRoutes` y los tipos `CuotaCobrable`, `CobroCajaProps`. Las tareas siguientes agregan su bloque. |
| `api/usePagos.ts` | Hooks `useCobrarCuotas`, `usePago`, `useFactura`. |
| `components/CobroCaja.tsx` | Lista de cuotas con checkbox y botón de cobro. Sin total previo (RV-D14). |
| `components/CuotaCheckItem.tsx` | Una fila: checkbox, `Cuota {N}`, badge de estado e importe. |
| `components/CobrarVencidasButton.tsx` | Botón "Registrar pago en caja": cobra las cuotas Vencida de una póliza con un clic. Lo coloca B-16 en la barra de acciones y lo reutiliza B-18 en el widget (RV-D10). |
| `components/FacturaPanel.tsx` | Vista de la factura de un pago. |
| `components/EstadoFacturaBadge.tsx` | Mapea `EstadoFactura` a texto y token de `Badge/Estado`. |
| `components/EstadoPagoBadge.tsx` | Mapea `EstadoPago` a texto y token de `Badge/Estado`. |
| `schemas/cobroCaja.ts` | `cobroCajaSchema` (zod). |
| `types/cobro.ts` | `CuotaCobrable`. |
| `components/CobroCaja.test.tsx`, `components/CobrarVencidasButton.test.tsx`, `components/FacturaPanel.test.tsx`, `api/usePagos.test.tsx`, `schemas/cobroCaja.test.ts` | Tests de la sección 10. |

No se editan archivos de otros dueños. Los mapas `(dominio, valor)` de medio, estado de pago y estado de factura salen de `@nexa/api` (T-10). Si T-10 no los tiene, se pide a T-10; no se definen números crudos en componentes.

## 6. Pasos de implementación

1. Confirmar en `packages/api` (ya mergeado por T-29, T-28, T-09 y T-10) los exports listados en §3 y §7. Si falta alguno, detener la tarea y pedirlo al dueño.
2. Crear `types/cobro.ts`:
   ```ts
   import type { CuotaResponse } from '@nexa/api';
   export type CuotaCobrable = Pick<CuotaResponse, 'id' | 'numero' | 'importe' | 'recargo' | 'estado' | 'fechaVencimiento'>;
   ```
   Si T-28 exporta `CuotaResponse` con otro nombre, se usa ese nombre.
3. Crear `schemas/cobroCaja.ts`:
   ```ts
   import { z } from 'zod';
   export const cobroCajaSchema = z.object({
     cuotaIds: z.array(z.string().min(1)).min(1, 'Debe indicar al menos una cuota.'),
   });
   export type CobroCajaValues = z.infer<typeof cobroCajaSchema>;
   ```
   El mensaje es el del back (`PagoCajaRequest.cs:9`), para que el front y el back digan lo mismo. Las cuotas se deduplican antes de validar.
4. Crear `api/usePagos.ts`:
   - `useCobrarCuotas(polizaId?: string)`: `useMutation` con `mutationFn` = la función de request de T-29 para `POST /api/pagos/caja`, `retry: 0` (FC11), y `onSuccess` que invalida `polizasKeys.all` y `pagosKeys.all`. Se invalida `all` porque la caja puede cobrar cuotas de varias pólizas del mismo cliente (`pagos-facturas.md` §8). El parámetro `polizaId` se acepta por compatibilidad y se usa solo para la key `polizasKeys.cuotas(polizaId)` si se pasa.
   - `usePago(pagoId: string)`: `useQuery` sobre `GET /api/pagos/{id}`, key `pagosKeys.detalle(pagoId)`, `enabled: pagoId.length > 0`.
   - `useFactura(pagoId: string)`: `useQuery` sobre `GET /api/pagos/{id}/factura`, key `pagosKeys.factura(pagoId)`. Un 404 con `detail` "No se encontró la factura del pago." se devuelve como error de `ApiError` sin reintentos (`retry` en 404 = false).
5. Crear `EstadoPagoBadge` y `EstadoFacturaBadge` con los mapas de T-10 y el `Badge/Estado` de T-05. Textos y tokens en §8.
6. Crear `CuotaCheckItem`: `<label>` que envuelve un `<input type="checkbox">` nativo estilizado con Tailwind. El texto visible es `Cuota {N}`. Fila de 48 px de alto (B11 §3). Importe a la derecha con formato mono. Badge con el estado de la cuota (T-10 `(cuota, estado)`).
7. Sin total previo: no se suma en el front (RV-D14). `CobroCaja` no muestra ningún importe agregado antes del cobro. Tras el 201, el aviso muestra el importe confirmado, `PagoResponse.importe` formateado con T-09 (§8).
8. Crear `CobroCaja` con props `CobroCajaProps`:
   ```ts
   interface CobroCajaProps {
     cuotas: ReadonlyArray<CuotaCobrable>; // puede traer cuotas de cualquier estado
     etiquetaBoton: string;                 // "Registrar pago" (B11)
     ayuda?: string;                        // solo B11 pasa "Se emite la factura con CAE al confirmar."
     onCobrado?: (pago: PagoResponse) => void;
   }
   ```
   - Muestra solo las cuotas con `estado` 0 (Pendiente) o 1 (Vencida). Las de estado 2 (Pagada) y 3 (Anulada) no se renderizan.
   - Ninguna cuota preseleccionada (D-19).
   - Estado local: `Set` de ids marcados. Sin total previo (paso 7).
   - Botón `etiquetaBoton`, `variant="primary"`, `size="m"`. Deshabilitado si no hay cuotas marcadas o si la mutación está en curso. Al enviar se valida con `cobroCajaSchema` y se llama a `mutate({ cuotaIds })`.
   - Éxito: limpia la selección, muestra el aviso de éxito con el importe (§8) y llama `onCobrado`.
   - Error: muestra `detail` del `ApiError` dentro de un contenedor con `role="alert"`. No cambia la selección marcada.
9. Crear `CobrarVencidasButton` con props `{ polizaId: string; cuotas: ReadonlyArray<CuotaCobrable> }` (RV-D10):
   - `cuotaIds` = ids de las cuotas con `estado === 1` (Vencida), en orden de `numero`.
   - Llama `useCobrarCuotas(polizaId)` y `mutate({ cuotaIds })`.
   - Deshabilitado si `cuotaIds` está vacío o si `isPending` es true.
   - Etiqueta fija `Registrar pago en caja` (B10 §5), `variant="primary"`, `size="m"`, con ícono de billetera (Phosphor, nombre a verificar al importar, D15 de `design-system.md §9`).
   - Éxito: muestra `Pago registrado.` en `role="status"`. Error: muestra `detail` dentro de `role="alert"` (FC10).
   - No dispara ninguna request al montar.
10. Crear `FacturaPanel` con prop `pagoId: string`. Usa `usePago` y `useFactura`. Renderiza el contenido de §8 y el badge de estado. Si `numero` es `""`, muestra `Pendiente de numeración`. Si `cae` o `vencimientoCae` son `null`, no renderiza esa fila.
11. Crear `index.ts` y `routes.tsx` (§5). `index.ts` exporta solo lo listado en §5; no exporta tipos internos.
12. Escribir los tests de §10 antes de implementar los componentes (test-first de FB/ODD cuando hay regla de UI).

## 7. Contrato con el back

| Método y ruta | Estado | Request | Respuesta éxito | Errores que maneja la UI |
|---|---|---|---|---|
| `POST /api/pagos/caja` | Implementado (US-F4-03) | `PagoCajaRequest` | 201 `PagoResponse` (header `Location`) | 400 (`errors.CuotaIds` o `detail`), 401, 403, 404 (`detail`) |
| `GET /api/pagos/{id}` | Implementado | sin body; `id` en ruta | 200 `PagoResponse` | 404 `"El pago no existe."`; 401; 403 |
| `GET /api/pagos/{id}/factura` | Implementado | sin body; `id` en ruta | 200 `FacturaResponse` | 404 `"No se encontró la factura del pago."`; 401; 403 |

Tipos TypeScript (copiados de `contratos-api/pagos-facturas.md` §3; los exporta T-29 en `packages/api/src/dto/pagos.ts`; no se redefinen aquí):

```ts
export type EstadoPago = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
export type MedioPagoApi = 'CAJA' | 'PASARELA' | 'PAGO_FACIL';
export type EstadoFactura = 'PENDIENTE_CAE' | 'AUTORIZADA';
export type TipoFactura = 'B';

export interface FacturaResponse {
  id: string;
  pagoId: string;
  numero: string;                // "" mientras estado = PENDIENTE_CAE
  tipo: TipoFactura;
  importe: number;               // IVA incluido
  estado: EstadoFactura;
  cae: string | null;
  vencimientoCae: string | null; // "yyyy-MM-dd"
  fechaEmision: string;          // ISO UTC
}

export interface PagoResponse {
  id: string;
  clienteId: string;
  numero: string;                // "PAG-" + 6 caracteres
  estado: EstadoPago;
  medio: MedioPagoApi;
  importe: number;
  fechaCreacion: string;
  fechaAcreditacion: string | null;
  factura: FacturaResponse | null;
}

export interface PagoCajaRequest {
  cuotaIds: string[];            // mínimo 1
}
```

`CuotaResponse` (T-28, de `polizas-cuotas-pagofacil.md` §5.5): `id: string; numero: number; importe: number; recargo: number; fechaVencimiento: string; estado: EstadoCuota (0..3); fechaPago: string | null`.

Handlers MSW: los escribe T-29 en `packages/api/mocks/handlers/pagos.ts`. Esta tarea no los modifica.

## 8. Contenido de UI

Textos literales del Figma (usar tal cual):

| Elemento | Texto | Origen |
|---|---|---|
| Etiqueta de cada cuota | `Cuota {N}` (muestra: `Cuota 6`) | B11 §5 |
| Badge de cuota Pendiente | `Pendiente` (token `status/pendiente`) | B11 §5, Badge 11:99 |
| Badge de cuota Vencida | `Vencida` (token `status/vencida`) | B11 §5, Badge 11:107; ver D-B17-02 |
| Total previo | No se muestra ni se suma en el front (RV-D14). Tras el cobro: `Importe: {importe}` | B11 §5 ("Total a registrar" eliminado por RV-D14) |
| Botón (B11) | `Registrar pago` | B11 §5 |
| Botón (B10) | `Registrar pago en caja` | B10 §5 |
| Ayuda (solo B11) | `Se emite la factura con CAE al confirmar.` | B11 §5 |
| Badge de factura con CAE | `Facturada` (token `status/vigente`) | B10 §5 |
| Badge de factura pendiente | `Pendiente CAE` (token `status/suspendida`, Badge 11:115; RV-D15) | B10 §5 |
| Badge de pago Aprobado | `Aprobado` (token `status/vigente`) | B11 §4 |
| Badge de pago Pendiente | `Pendiente` (token `status/pendiente`) | B11 §4 |
| Badge de pago Rechazado | `Rechazado` (token `status/cancelada`) | B11 §4 |
| Medio | `Caja`, `Pago Fácil`, `Pasarela` | B11 §9 (mapeo); `Pasarela` sin A/B, D-09 |

Textos que el Figma no define (propuesta, marcada como NO DEFINIDO en B10 §5 y B11 §7):

| Elemento | Texto propuesto |
|---|---|
| Éxito del cobro | `Pago registrado.` + `Importe: {importe}` (`PagoResponse.importe` con T-09, RV-D14) |
| Éxito con factura pendiente | `Pago registrado. La factura quedó pendiente de CAE.` |
| Error de red en el envío | `No se pudo confirmar el cobro. Revisá el estado de las cuotas antes de intentar de nuevo.` |
| Error sin `detail` | `Ocurrió un error inesperado.` |
| 403 | `No tenés permiso para registrar pagos.` |
| Cargando factura | `Cargando factura…` |
| Etiquetas de `FacturaPanel` | `Número`, `Tipo`, `Importe (IVA incluido)`, `CAE`, `Vencimiento del CAE`, `Fecha de emisión`, `Estado` |
| Número vacío | `Pendiente de numeración` (`pagos-facturas.md` §7.2) |
| Sin cuotas cobrables | `No hay cuotas para cobrar.` |

Valores de ejemplo del Figma (no son texto fijo): `Lucía Benítez`, `$ 10.500,00`, `$ 22.050,00`. No se usan como texto fijo (FC4).

## 9. Estados y casos borde

| Caso | Comportamiento |
|---|---|
| Sin cuotas marcadas | Botón deshabilitado. |
| `CobrarVencidasButton` sin cuotas Vencida | Deshabilitado; no hace request (D-B18-03). |
| Envío en curso | Botón deshabilitado con `aria-disabled="true"`. Las cuotas quedan bloqueadas. No hay segundo POST (FC11). |
| Doble clic | El segundo clic no dispara request, porque el botón ya está deshabilitado en el mismo ciclo de render. Test §10. |
| Error de red en el POST | No se reenvía (`retry: 0`, FB7.9). Se muestra el texto de error de red de §8 y se invalidan las cuotas para que la UI muestre el estado real. |
| 400 `Las cuotas no pueden repetirse.` / `Solo se pueden pagar cuotas pendientes o vencidas (RN11).` / `Alguna de las cuotas indicadas no existe.` / `Todas las cuotas deben pertenecer al mismo cliente.` | Se muestra `detail` y se invalidan cuotas. |
| 400 de concurrencia `El pago o sus cuotas fueron modificados por otro cobro. Recargue los datos.` | Se muestra `detail` tal cual y se invalidan cuotas. No se reintenta automáticamente. |
| 400 de validación (`errors.CuotaIds`) | Solo puede ocurrir si la validación zod no corrió. Se muestra `errors.CuotaIds[0]` en el contenedor de alerta. |
| 401 | Lo resuelve T-08 (`onUnauthorized` → `/login`). Esta tarea no lo maneja. |
| 403 | Se muestra el texto de 403 de §8. |
| 404 de factura | Se muestra el `detail` del back. No se ofrece reintento (D-12). |
| 500 / 502 / 503 | Se muestra `detail` si existe; si no, `Ocurrió un error inesperado.`. |
| Factura `PENDIENTE_CAE` | Badge `Pendiente CAE`. No aparecen `CAE` ni `Vencimiento del CAE`. Sin botón de reintento. |
| Factura `AUTORIZADA` | Badge `Facturada`. Se muestran `CAE` y `Vencimiento del CAE`. |
| `numero` = `""` | `Pendiente de numeración` en la fila `Número`. |
| `cae` o `vencimientoCae` = `null` | No se renderiza la fila. |
| Cuota con estado fuera de 0 y 1 | No se renderiza y no se puede marcar. |
| Cuotas de varias pólizas del mismo cliente | Se aceptan; el back valida. |
| Pago sin factura (`factura: null`) | En `FacturaPanel` no se llama `useFactura` y se muestra el `detail` del 404 si se entra igual. |

## 10. Tests requeridos

Herramientas: Vitest, Testing Library, MSW (handlers de T-29 con `server.use`), `vitest-axe` (harness de T-19).

`components/CobroCaja.test.tsx`:
1. `no_muestra_cuotas_pagadas_ni_anuladas`: con cuotas en estados 0, 1, 2 y 3, hay exactamente 2 checkboxes.
2. `no_preselecciona_ninguna_cuota`: todos los checkboxes están sin marcar y el botón está deshabilitado.
3. `no_muestra_total_previo`: marcar cuotas 6 y 7 (importe 10.500, recargo 525 cada una) no muestra `Total a registrar` ni ningún importe sumado (RV-D14).
4. `boton_deshabilitado_mientras_corre_el_post`: con el handler en espera, el botón tiene `aria-disabled="true"` y un segundo clic no genera segunda request (contador en MSW = 1).
5. `no_reintenta_ante_error_de_red`: handler con `HttpResponse.error()`; contador = 1; aparece el texto de error de red de §8.
6. `muestra_detail_del_400_en_role_alert`: handler responde 400 con `detail` "El pago o sus cuotas fueron modificados por otro cobro. Recargue los datos."; ese texto está dentro de `role="alert"`.
7. `exito_con_factura_pendiente_muestra_aviso`: handler responde 201 con `factura.estado = "PENDIENTE_CAE"` e `importe` 22050; aparece `Pago registrado. La factura quedó pendiente de CAE.` en `role="status"` y `Importe: $ 22.050,00` con el importe de la respuesta (RV-D14).
8. `ayuda_solo_si_se_recibe`: sin prop `ayuda` no aparece `Se emite la factura con CAE al confirmar.`; con la prop, aparece.
9. `a11y_sin_violaciones`: `vitest-axe` sobre el componente con tres cuotas.

`components/FacturaPanel.test.tsx`:
10. `pendiente_cae_sin_cae_ni_vencimiento`: factura `PENDIENTE_CAE`, `numero` `""`: aparece `Pendiente CAE` y `Pendiente de numeración`; no aparecen `CAE` ni `Vencimiento del CAE`.
11. `autorizada_muestra_cae_y_vencimiento`: factura `AUTORIZADA` con `cae` y `vencimientoCae` `"2026-11-18"`: aparece `Facturada` y la fecha `18/11/2026`.
12. `404_muestra_detail`: handler 404 con `detail` "No se encontró la factura del pago.": aparece ese texto y no hay botón de reintento.

`api/usePagos.test.tsx`:
13. `cobrar_no_reintenta`: `useCobrarCuotas` tiene `retry` igual a 0 (test sobre la opción del hook o el contador en MSW con error 503).
14. `cobrar_invalida_polizas_y_pagos_al_exito`: tras 201, `polizasKeys.all` y `pagosKeys.all` quedan invalidadas (spy sobre `queryClient.invalidateQueries`).

`schemas/cobroCaja.test.ts`:
15. `rechaza_lista_vacia_con_mensaje_del_back`: `cobroCajaSchema.safeParse({ cuotaIds: [] })` falla con `Debe indicar al menos una cuota.`.
16. `acepta_una_cuota`.

`components/CobrarVencidasButton.test.tsx` (movidos desde B-18; RV-D10):
17. `envia_solo_ids_de_vencidas`: el body del POST contiene `cuotaIds` con los ids de estado 1 (MSW captura el body).
18. `no_dispara_al_montar`: renderizar el componente no genera ninguna request (contador en MSW = 0). Sin cuotas Vencida, el botón está deshabilitado y no hace request.
19. `doble_clic_genera_un_solo_post`: contador = 1.
20. `error_400_muestra_detail_en_role_alert`.

## 11. Criterios de aceptación

1. `features/pagos/` existe con `api/`, `components/`, `schemas/`, `types/`, `routes.tsx` e `index.ts`, y solo importa de `@nexa/ui`, `@nexa/api` y de sí misma.
2. `index.ts` exporta exactamente `CobroCaja`, `FacturaPanel`, `CobrarVencidasButton`, `useCobrarCuotas`, `usePago`, `useFactura`, `cobroCajaSchema`, `pagosRoutes` y los tipos `CuotaCobrable` y `CobroCajaProps`.
3. `CobroCaja` no renderiza cuotas con estado Pagada ni Anulada.
4. Ninguna cuota está marcada al montar el componente.
5. No hay total previo ni suma en el front (RV-D14, test 3); tras el 201 el importe mostrado es `PagoResponse.importe` con T-09 (test 7).
6. El botón está deshabilitado sin cuotas marcadas y durante el envío; durante el envío no se dispara un segundo POST (test 4).
7. `useCobrarCuotas` tiene `retry: 0`, y un error de red no provoca reenvío (test 5).
8. Tras un 201, se invalidan `polizasKeys.all` y `pagosKeys.all` (test 14).
9. Un 400 o 404 muestra el `detail` del back dentro de `role="alert"`, sin texto propio ni prefijos `RNxx:` (test 6).
10. `CobrarVencidasButton` no hace request al montar, envía solo ids Vencida y no genera un segundo POST (tests 17 a 19).
11. `FacturaPanel` muestra `Pendiente CAE` sin CAE ni vencimiento cuando la factura está `PENDIENTE_CAE`, y `Facturada` con CAE y vencimiento cuando está `AUTORIZADA`.
12. `FacturaPanel` no tiene botón de reintento ni de descarga.
13. Ningún componente usa números crudos de enum: todo pasa por los mapas de T-10.
14. Ninguna fecha se formatea a mano: todo pasa por T-09.
15. Los tests 1 a 20 están en verde, con `vitest-axe` sin violaciones en `CobroCaja` y `CobrarVencidasButton`.
16. `npm run lint`, `typecheck`, `test` y `build` están en verde en el workspace `apps/backoffice`.

## 12. Verificación manual

Sin prueba manual en esta tarea: no tiene ruta propia y los componentes se prueban en los tests. La prueba manual corre en US-FE-B-16 (botón del encabezado de B10), US-FE-B-18 (widget y rail de B10) y US-FE-B-19 (rail de `/pagos`). Se le pasan a la persona responsable los pasos de esas tareas.

## 13. Decisiones pendientes con default

- [CONFIRMAR] **D-B17-01 (D1 de B10; RV-D11): selección de cuotas en B10.** Default: el botón de B10 (B-16) y el widget (B-18) cobran todas las cuotas vencidas con `CobrarVencidasButton`, sin checkboxes; `CobroCaja` con checkboxes se usa solo en B11 (B-19). No cerrar sin confirmación del equipo: producto, antes de B-18.
- **D-B17-02 (D7 de B10): color de la cuota Vencida.** Default: token `status/vencida` de `design-system.md §5.4`, no el de Cancelada que muestra el Figma. Confirmar con diseño.
- **D-B17-03 (RV-D14): total previo. Resuelto.** No se suma en el front. No hay total previo y el importe confirmado es `PagoResponse.importe` (default (a) de RV-D14, aplicado por FB8).
- **D-B17-04 (RV-D15): texto de `PENDIENTE_CAE`. Resuelto por default.** Badge `Pendiente CAE`; celda `Pendiente de CAE` (B-19), hasta que diseño confirme.
- **D-B17-05: textos no definidos por el Figma** (§8, filas de propuesta). Revisar en la reunión de equipo.
- **D-B17-06: vista de factura.** No hay ruta propia; `FacturaPanel` se abre desde B-18 o B-19. Default: se monta dentro del contenedor que lo use (sin ruta). Confirmar.
- **D-B17-07 (RV-D10): botón del encabezado. Resuelto.** `CobrarVencidasButton` lo exporta esta tarea; B-16 lo coloca en la barra de acciones y B-18 lo reutiliza en el widget.

## 14. Riesgos y errores comunes

- **Doble cobro.** Dos POST de caja con las mismas cuotas: la segunda recibe 400 "ya pagadas" o de concurrencia. No reenviar tras error de red; invalidar cuotas y dejar que el usuario revise.
- **Enums como números.** `PagoResponse.estado` y `medio` llegan como string; `CuotaResponse.estado` llega como número. Usar siempre el mapa `(dominio, valor)` de T-10.
- **Fechas.** `fechaCreacion` y `fechaEmision` son `DateTime` (UTC, puede no tener `Z`); `vencimientoCae` es `DateOnly` (`yyyy-MM-dd`). No usar `new Date("yyyy-MM-dd")` para `DateOnly`: en Argentina muestra el día anterior.
- **Dinero.** No sumar en el front (RV-D14): mostrar `PagoResponse.importe` con T-09. No usar `toFixed` ni `toLocaleString` a mano.
- **Invalidación incompleta.** Si no se invalidan las keys de cuotas, el widget de deuda (B-18) y la tabla de cuotas (B-15) muestran datos viejos.
- **Mezcla de pólizas.** La caja permite cuotas de varias pólizas del mismo cliente. No asumir una sola póliza en el componente.
- **Medio sin A/B.** `Pasarela` no tiene "Pasarela A" ni "Pasarela B" en el back (PB-22). No inventar esos nombres.

## 15. Definición de terminado

- `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` en verde.
- Accesibilidad revisada con el harness de T-19 en `CobroCaja` y `FacturaPanel`.
- Sin secretos ni credenciales en el código.
- Criterios 1 a 15 de §11 tildados con evidencia observada (salida de los tests o de los comandos).

## 16. Observaciones al índice

- Resuelto (RV-D10): el botón "Registrar pago en caja" del encabezado de B10 lo coloca B-16 con `CobrarVencidasButton` de esta tarea. No bloquea B-17.
