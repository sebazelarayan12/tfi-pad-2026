# US-FE-T-10: @nexa/api: mapas de enums y mensajes

T · Ola 1 · Tamaño M · Rama sugerida `feature/US-FE-T-10-mapas-enums-mensajes` · Tarjeta Trello `US-FE-T-10`

## 1. Objetivo

`@nexa/api` expone un mapa indexado por **(dominio, valor)** para cada enum que devuelve el back, con literal, etiqueta de UI y valor del componente `Badge/Estado`. También traduce los mensajes de error que llegan en inglés de ASP.NET y limpia `detail` (prefijo `RNxx:`). Ningún componente usa números crudos (FC9) ni muestra texto en inglés (FC10). Destinatarios: API cards T-24..T-32 y todas las pantallas.

## 2. Alcance

**Entra**
- `frontend/packages/api/src/enums/badges.ts`: tipo `EstadoBadgeValue` (nueve valores de `design-system.md §5.4`).
- `frontend/packages/api/src/enums/dominios.ts`: tipo `Dominio` y tablas por dominio.
- `frontend/packages/api/src/enums/index.ts`: `obtenerEnum`, `etiquetaEnum`, `badgeEnum`.
- `frontend/packages/api/src/messages/validacion.ts`: `traducirMensajeValidacion`.
- `frontend/packages/api/src/messages/detalle.ts`: `leerMensajeDetalle` y `CODIGOS_EN_PREFIJO`.
- `frontend/packages/api/src/messages/index.ts` y su bloque en el barrel `packages/api/src/index.ts`.
- Tests en `frontend/packages/api/test/enums/` y `frontend/packages/api/test/messages/`.

**NO entra**
- Componente `Badge/Estado` visual: US-FE-T-05 (en `@nexa/ui`); consume `EstadoBadgeValue`.
- Textos de validación de cada formulario (por ejemplo B-01, B-05): cada feature usa sus propios textos por campo (FC10). El traductor es solo fallback.
- Mapa de `PlanRequest.tiposPermitidos`: viaja con nombres, no con números (`vehiculos-planes-cotizaciones.md §3.2`); lo tipa US-FE-T-27.
- `validadoRenaper` y `validadoDnrpa`: son booleanos, no enums.

## 3. Dependencias

- **Puede empezar sin esperar a:** US-FE-T-11 (MSW) y las API cards T-24..T-32, que usan estos tipos.
- **Depende de:** US-FE-T-08 (tipo `ApiError`, solo como tipo) y US-FE-T-12 (tipo `ProblemDetails`). Los nombres exactos de `ApiError` se confirman al mergear T-08.
- **Bloqueada por pedidos al back (PB-NN):** PB-13 (mapa por dominio, sin converter global). No bloquea: se trabaja con mapa por dominio (FB7.3, D-29). PB-14 y PB-15 degradan (no figuran en la fila del INDEX): `leerMensajeDetalle` usa `codigo` si llega, y `traducirMensajeValidacion` cubre los mensajes en inglés.
- **Workaround MSW (FB7.7):** no aplica.

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB7.3 (enums), FB7.6 (errores del back).
- `docs/frontend/contratos-api/convenciones-transversales.md` §3.2 (tabla excepción → status → detail), §3.4 (tipo `ProblemDetails`), §5.1 (enums: formato por campo), §5.2 (tabla de wire por campo), §8.1 (valores numéricos y string), §8.2 (badges).
- `docs/frontend/contratos-api/polizas-cuotas-pagofacil.md` §1.3 (enums que llegan como número).
- `docs/frontend/contratos-api/seguridad-clientes-publico.md` §1.2 (formas de error), §3 tabla de RN01 y RN02 (ejemplos de `detail` con prefijo), §4.2 (mensajes en inglés).
- `docs/frontend/analisis-front.md` §6.2 (mapa de enums) y §7.2 (manejo de errores).
- `docs/frontend/design-system.md` §5.4 (props de `Badge/Estado`).
- `docs/frontend/pedidos-al-back.md` PB-13, PB-14 y PB-15 (solo las fichas).

## 5. Archivos a crear o modificar

| Archivo | Dueño |
|---|---|
| `frontend/packages/api/src/enums/*` (incluye `badges.ts` con `EstadoBadgeValue`, RV-22 y RV-D07) | US-FE-T-10 |
| `frontend/packages/api/src/messages/*` | US-FE-T-10 |
| `frontend/packages/api/src/index.ts` (bloque) | US-FE-T-12 (barrel); T-10 agrega su bloque |
| `frontend/packages/api/test/enums/dominios.test.ts`, `frontend/packages/api/test/messages/*.test.ts` | US-FE-T-10 |

## 6. Pasos de implementación

1. `enums/badges.ts`: `export type EstadoBadgeValue = 'Pendiente' | 'Vigente' | 'Suspendida' | 'Cancelada' | 'Vencida' | 'Pagada' | 'Anulada' | 'Validado' | 'Pendiente CAE';`. Es el mismo conjunto que `design-system.md §5.4`.
2. `enums/dominios.ts`: `export type Dominio = 'EstadoPoliza' | 'EstadoPolizaPublico' | 'EstadoCuota' | 'EstadoCuotaPublico' | 'EstadoPago' | 'MedioPago' | 'EstadoFactura' | 'TipoVehiculo' | 'UsoVehiculo' | 'OrigenCotizacion' | 'Sexo' | 'Rol';`. Una tabla `as const` por dominio, con la forma `{ valor, literal, etiqueta, badge }`. Los valores y etiquetas salen de la tabla de §7.
3. `obtenerEnum<D extends Dominio>(dominio: D, valor: unknown)`: busca por igualdad estricta (`===`) dentro de la tabla de ese dominio. `0` y `'0'` son valores distintos. Devuelve la entrada o `null`. No lanza.
4. `etiquetaEnum(dominio, valor)`: devuelve la etiqueta, o `TEXTO_SIN_DATO` (importado de US-FE-T-09) si no hay entrada.
5. `badgeEnum(dominio, valor)`: devuelve `EstadoBadgeValue` o `null`.
6. `messages/validacion.ts`, `traducirMensajeValidacion(mensaje, campo)`: si el mensaje no empieza con `The ` (ya viene en español, por ejemplo "El email es obligatorio."), devolverlo sin cambios. Si empieza con `The `, aplicar los patrones de §8 en orden. Si ninguno aplica, devolver "Revisá este campo.".
7. `messages/detalle.ts`, `leerMensajeDetalle(problema)`: (a) si `codigo` viene, usarlo; (b) si `detail` empieza con un código de `CODIGOS_EN_PREFIJO` (hoy `['VEHICULO_NO_ENCONTRADO']`) seguido de `:`, extraerlo y quitar el prefijo; (c) quitar siempre `^RN\d{2}:\s*` (FB7.6); (d) si queda vacío, "Ocurrió un error inesperado." (convenciones §3.2). Devuelve `{ codigo: string | null; mensaje: string }`.
8. Barrel de `enums/` y `messages/`, y bloque en `packages/api/src/index.ts`.
9. Escribir los tests de §10.

## 7. Contrato con el back

No aplica: no hay endpoint. Esta tabla es el wire real que la tarea debe reflejar (convenciones §5.1, §5.2 y §8.1). El mapeo es por dominio, nunca solo por valor: `Vencida` es `4` en `EstadoPoliza` y `1` en `EstadoCuota`.

| Dominio | Wire | Valor → literal → etiqueta → badge |
|---|---|---|
| `EstadoPoliza` (backoffice) | número | 0 `Pendiente` → "Pendiente" → Pendiente; 1 `Vigente` → "Vigente" → Vigente; 2 `Suspendida`; 3 `Cancelada`; 4 `Vencida` |
| `EstadoPolizaPublico` | string | `PENDIENTE`, `VIGENTE`, `SUSPENDIDA`, `CANCELADA`, `VENCIDA` → etiqueta con mayúscula inicial → badge del mismo nombre |
| `EstadoCuota` (backoffice) | número | 0 `Pendiente`; 1 `Vencida`; 2 `Pagada` → badge Pagada; 3 `Anulada` → badge Anulada |
| `EstadoCuotaPublico` | string | `PENDIENTE`, `VENCIDA`, `PAGADA`, `ANULADA` → mismo badge que el backoffice |
| `EstadoPago` | string | `PENDIENTE` → "Pendiente"; `APROBADO` → "Aprobado"; `RECHAZADO` → "Rechazado"; badge `null` |
| `MedioPago` | string | `PASARELA` → "Pasarela"; `PAGO_FACIL` → "Pago Fácil"; `CAJA` → "Caja"; badge `null` |
| `EstadoFactura` | string | `PENDIENTE_CAE` → "Pendiente CAE" → badge Pendiente CAE; `AUTORIZADA` → "Autorizada"; badge `null` |
| `TipoVehiculo` | número | 0 Auto; 1 Moto; 2 Camioneta |
| `UsoVehiculo` | número | 0 Particular; 1 Comercial |
| `OrigenCotizacion` | número | 0 Web; 1 Panel; 2 Externo (no se muestra en UI) |
| `Sexo` | string (char) | `M` → "Masculino"; `F` → "Femenino"; `X` → "X" |
| `Rol` | string | `Administrador`; `Empleado` (Chip en B14) |

Tipos TypeScript de valor de wire:

```ts
export type EstadoPolizaNum = 0 | 1 | 2 | 3 | 4;
export type EstadoCuotaNum = 0 | 1 | 2 | 3;
export type EstadoPagoStr = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
export type MedioPagoStr = 'PASARELA' | 'PAGO_FACIL' | 'CAJA';
export type EstadoFacturaStr = 'PENDIENTE_CAE' | 'AUTORIZADA';
export type EstadoPublicoStr = 'PENDIENTE' | 'VIGENTE' | 'SUSPENDIDA' | 'CANCELADA' | 'VENCIDA' | 'PAGADA' | 'ANULADA';
```

"Badge" es el valor de la prop `estado` de `Badge/Estado` (design-system §5.4). Los colores de `Pagada`, `Validado`, `Pendiente CAE` y `Anulada` los define US-FE-T-05. La columna "Variante Badge" de `analisis-front.md §6.2` describe el color ("= Vigente"), no un valor distinto.

## 8. Contenido de UI

Patrones de traducción de `traducirMensajeValidacion` (solo para mensajes que empiezan con `The `):

| Mensaje del back (inglés) | Texto que muestra la UI |
|---|---|
| `The <Campo> field is required.` | "Este campo es obligatorio." (propuesta) |
| `The <Campo> field is not a valid e-mail address.` | "Ingresá un email válido." (propuesta) |
| `The field <Campo> must be a string or array type with a maximum length of '<N>'.` | "Supera el largo máximo de <N> caracteres." (propuesta) |
| Cualquier otro mensaje que empiece con `The ` | "Revisá este campo." (propuesta) |

Mensajes de `detail` que pasan sin cambios: "Credenciales inválidas.", "Ocurrió un error inesperado." y los de negocio en español. Ejemplo: `RN01: Ya existe un cliente con el DNI '{dni}'.` se muestra como "Ya existe un cliente con el DNI '{dni}'." (fuente: seguridad §3, tabla RN01).

Etiquetas de enums: las de la tabla de §7 son propuestas donde el Figma no define texto (`EstadoPago`, `MedioPago`, `EstadoFactura` "Autorizada", `Sexo`). Los badges con texto de diseño (Pendiente, Vigente, Suspendida, Cancelada, Vencida, Pagada, Anulada, Pendiente CAE) usan el texto del Figma tal cual.

## 9. Estados y casos borde

- Valor no mapeado (`5` en `EstadoPoliza`, `'vigente'` en minúscula, `null`): `obtenerEnum` devuelve `null`; la UI muestra `—` y no rompe.
- `'1'` (string) en un dominio numérico: no matchea (`null`).
- `EstadoPoliza` `4` y `EstadoCuota` `1` devuelven "Vencida" en cada dominio y no se cruzan.
- `detail` `null` o vacío: "Ocurrió un error inesperado.".
- `errors` con una clave desconocida: se aplica el mismo traductor por patrón.
- Mensaje en español del back (por ejemplo "El email es obligatorio."): no se reemplaza.

## 10. Tests requeridos

Vitest (FB1, analisis §8.2 para `packages/api`).

- `test/enums/dominios.test.ts`
  - "`EstadoPoliza` 4 devuelve Vencida".
  - "`EstadoCuota` 1 devuelve Vencida y no se mezcla con EstadoPoliza".
  - "`EstadoPoliza` con `'VENCIDA'` devuelve null (wire numérico)".
  - "`EstadoPolizaPublico` con `'VENCIDA'` devuelve Vencida".
  - "`'1'` no matchea en un dominio numérico".
  - "cada dominio cubre todos los valores de la tabla de §7 (test table-driven)".
  - "`EstadoCuota` 2 tiene badge Pagada y 3 tiene badge Anulada; `EstadoPoliza` 0 tiene badge Pendiente".
  - "`EstadoFactura` `PENDIENTE_CAE` tiene badge Pendiente CAE; `AUTORIZADA` no tiene badge".
  - "`etiquetaEnum` de valor desconocido devuelve `—`".
- `test/messages/validacion.test.ts`
  - "traduce `The Dni field is required.`".
  - "traduce el mensaje de e-mail".
  - "traduce el largo máximo y muestra el N".
  - "no modifica un mensaje en español".
  - "un `The ...` que no coincide con patrones devuelve 'Revisá este campo.'".
- `test/messages/detalle.test.ts`
  - "quita el prefijo `RN01:` y devuelve el mensaje".
  - "extrae `VEHICULO_NO_ENCONTRADO` como `codigo` y quita el prefijo".
  - "usa `codigo` si llega en el problema".
  - "`detail` vacío devuelve el mensaje genérico".
  - "`RN01` no se toma como código".

## 11. Criterios de aceptación

1. `obtenerEnum` devuelve la entrada correcta para cada fila de la tabla de §7 (test table-driven en verde).
2. Dos dominios con el mismo literal (`Vencida`) no se confunden: `EstadoPoliza` 4 y `EstadoCuota` 1 devuelven el mismo literal solo dentro de su dominio.
3. Ningún valor numérico matchea un string y viceversa.
4. `traducirMensajeValidacion` devuelve el texto de §8 para cada patrón y no altera mensajes en español.
5. `leerMensajeDetalle` quita `RNxx:` y extrae `VEHICULO_NO_ENCONTRADO` como código.
6. Ningún archivo fuera de `packages/api/src/enums/` tiene mapas de enum propios (`rg` sobre `apps/` y `packages/ui/` sin resultados de `=== 0` o `case 1:` sobre estados).
7. Tipos sin `any`; el parámetro de entrada de `obtenerEnum` es `unknown`.
8. `npm run lint`, `npm run typecheck`, `npm run test` en verde, con evidencia.

## 12. Verificación manual

Sin prueba manual: no hay UI en esta tarea. La validación visual de los badges llega con las pantallas que los usan (B-03, B-05, B-07, B-17) y con US-FE-T-05.

## 13. Decisiones pendientes

- **DP-1 Etiquetas sin Figma** (`EstadoPago`, `MedioPago`, `EstadoFactura` "Autorizada", `Sexo`). Default: propuesta de §7. Confirmar con diseño y con B11 y B12.
- **DP-2 Textos de traducción de validación**. Default: propuesta de §8. Confirmar con producto.
- **DP-3 Ubicación de `EstadoBadgeValue`**. Default: en `@nexa/api`, para que los mapas no dependan de `@nexa/ui`; US-FE-T-05 lo importa. Alternativa: definirlo en `@nexa/ui` y que `@nexa/api` no lo conozca (los mapas devolverían solo el literal). Tradeoff: la alternativa separa más pero obliga a mapear dos veces.
- **DP-4 Retiro del prefijo `VEHICULO_NO_ENCONTRADO`.** Si PB-14 llega y el back manda `codigo`, se borra la rama (b) de `leerMensajeDetalle`.

## 14. Riesgos y errores comunes

- Mapear solo por valor: `4` es "Vencida" en póliza y `1` es "Vencida" en cuota. Siempre con dominio.
- Comparación laxa (`==`) hace que `'1'` matchee `1`. Usar `===`.
- Tipar la entrada como `number` en el mapa rompe los dominios string (`PAGADA`). La entrada es `unknown`.
- Mostrar `errors[...][0]` del back: viene en inglés (FC10, PB-15). El texto por campo lo define cada feature.
- Crear badges propios en una feature en lugar de usar `badgeEnum` (duplica la fuente de verdad).

## 15. Definición de terminado

`npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` en verde. Criterios de §11 tildados con evidencia observada. Sin secretos. Accesibilidad: no aplica (sin UI).

## 16. Observaciones al índice

- Resuelto (RV-22 / RV-D07): `EstadoBadgeValue` tiene dueño T-10 en `packages/api/src/enums/badges.ts`. T-05 no lo importa: define su propia unión de nueve literales, y una prueba en una app compara ambos arrays.
- Resuelto (triage final, default de la ficha): `analisis-front.md §6.2` y `convenciones §8.2` describen distinto la columna "badge" de `Pagada` y `Anulada` ("= Vigente" frente a badge propio). Se resuelve así: la etiqueta del badge es el valor de `EstadoBadgeValue` y el color lo define T-05 (`design-system §5.4`). No hay cambio de INDEX. (No figura en REVISION ni en FB8.)
