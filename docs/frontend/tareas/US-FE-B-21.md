# US-FE-B-21: Pago Fácil: historial y base positiva

Tipo B · Oleada 5 · Tamaño M · Rama sugerida `feature/US-FE-B-21-pago-facil-historial-base` · Tarjeta Trello `US-FE-B-21`

## 1. Objetivo

Al terminar, `/pago-facil` (B12) muestra la tabla `Archivos procesados` con el historial de rendiciones del back, y la tarjeta `Base positiva` con el botón `Generar base positiva`. El botón descarga el archivo `BASEPOS_<empresa>_<yyyyMMdd>.txt` con el token de sesión, y solo si la respuesta es un `text/plain` válido. Usuarios: Empleado y Administrador. El historial de bases generadas no se muestra (D-12).

## 2. Alcance

**Entra**
- Tabla `Archivos procesados` con los datos de `GET /api/pagofacil/rendiciones`, debajo de la tarjeta de rendición de B-20.
- Tarjeta `Base positiva` con texto de ayuda y botón `Generar base positiva`.
- Descarga de la base positiva como blob con el header `Authorization` (lo hace la función de T-30).
- Validación de la respuesta antes de guardar nada (`res.ok` y `Content-Type`).
- Armado del nombre del archivo desde el registro `H` (empresa y fecha), porque `Content-Disposition` no es legible cross-origin (PB-17).
- Refresco del historial después de una subida (la key la invalida B-20).

**NO entra**
- Tarjeta `Rendición diaria`, dropzone y resultado de la subida: US-FE-B-20.
- `Historial de bases generadas` con `Últimas bases generadas` y botón `Descargar` por fila: no existe en el back (D-12, B12 §13.6). No se muestra ni como oculto.
- Cupón de Pago Fácil: no hay bloque de cupón en B12.
- Envío automático a Pago Fácil: no hay API; el archivo se entrega a mano (`polizas-cuotas-pagofacil.md` §8.4).
- Cambios en `packages/api`.

## 3. Dependencias

- **Oleada (INDEX):** 5.
- **Puede empezar sin esperar a:** —.
- **Depende de:** `US-FE-B-20`, `US-FE-T-11`, `US-FE-T-19`, `US-FE-T-30`.
- **Pedidos al back (INDEX):** PB-17 (degrada: nombre armado en el front), PB-18 (degrada: desborde).
- **Requisitos sobre T-30 y B-20 (RV-18, RV-12):** la función de descarga de la base positiva de T-30 devuelve status, `Content-Type` y texto, para que esta tarea valide la respuesta antes de guardar; B-20 invalida `pagoFacilKeys.rendiciones` tras cada subida.
- **Degradaciones:** PB-17: `Content-Disposition` no es legible cross-origin; el nombre se arma desde el registro `H`. PB-18: con cuotas mayores a ~$95.237 el back devuelve 400 y falla el archivo entero; la UI lo muestra. PB-16: `fechaProceso` se trata como UTC con T-09.
- **Workaround MSW (FB7.7):** no aplica; ambos endpoints están Implementados. En tests se usan los handlers de T-30 con `server.use`.

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB3 (reglas 1 a 4), FB4 (fechas y formato único), FB7.6 (mensajes).
- `docs/frontend/tareas/INDEX.md`: FC2, FC9 (importes y fechas), FC10 (errores), FC12 (sin cookies, sin `localStorage`: el blob no se guarda), FC13 (todo por el cliente de T-08), FC16, D-12 (historial de bases oculto), D-24 (contraste).
- `docs/frontend/pantallas/B12-pago-facil.md`:
  - §3 (tarjeta 1, tabla de rendiciones: anchos 260, 170, 110, 170, 170, 164; tarjeta 2: título, ayuda, botón).
  - §5 (textos literales: `Archivos procesados`, headers de la tabla 1, badge `Procesado`, `Base positiva`, ayuda de la base, `Generar base positiva`).
  - §6 (descarga de base positiva: sin campos).
  - §7 (estados: historial vacío, cargando, error, generando, base lista).
  - §8 (acción `Generar base positiva` y el requisito de token).
  - §9 (mapeo de `HistorialRendicionResponse` a columnas; contrato propuesto de bases NO EXISTE).
  - §13 puntos 6, 7, 8, 9, 11, 12 (decisiones sobre la tabla de bases, `Content-Disposition`, UTC, estado constante).
- `docs/frontend/contratos-api/polizas-cuotas-pagofacil.md`:
  - §7.3 (`HistorialRendicionResponse`, orden descendente, sin paginación).
  - §8.1 (`GET /api/pagofacil/base-positiva`: `text/plain`, errores `application/problem+json`, 400 por desborde).
  - §8.2 (formato: registro `H` con empresa en posiciones 1 a 5 y fecha en 6 a 13).
  - §8.3 (cómo se descarga desde el front; nombre armado en el front).
  - §11.2 (receta de descarga: revisar `res.ok` y `Content-Type` antes de guardar).
- `docs/frontend/contratos-api/convenciones-transversales.md`: §3.4 (`ProblemDetails`), §5.3 (fechas: `DateTime` en UTC, `DateOnly`), §5.4 (formato de dinero), §7.3 (descarga como blob).
- `docs/frontend/design-system.md`: §5.4 (badge `Procesado` = token vigente), §5.12 (Table/Header 40 px y Table/Row 48 px), §5.1 (Button M y S), §8.1 (`text/tertiary` no para texto informativo), §8.3 (foco).
- `docs/frontend/pedidos-al-back.md`: fichas PB-17 y PB-18.

## 5. Archivos a crear o modificar

Bajo `frontend/apps/backoffice/src/features/pago-facil/`.

| Archivo | Acción | Dueño | Nota |
|---|---|---|---|
| `components/HistorialRendicionesTable.tsx` | crear | B-21 | Tabla `Archivos procesados`. |
| `components/HistorialRendicionRow.tsx` | crear | B-21 | Una fila. |
| `components/EstadoRendicionBadge.tsx` | crear | B-21 | Badge `Procesado` (token vigente). |
| `components/BasePositivaCard.tsx` | crear | B-21 | Tarjeta `Base positiva`. |
| `api/useHistorialRendiciones.ts` | crear | B-21 | `useQuery` sobre `GET /api/pagofacil/rendiciones`. |
| `api/useDescargarBasePositiva.ts` | crear | B-21 | `useMutation` que descarga y valida. |
| `api/descargarTextoComoArchivo.ts` | crear | B-21 | Función pura de DOM: crea el `Blob`, el `a` y dispara el `click`. Sin React. |
| `schemas/nombreBasePositiva.ts` | crear | B-21 | `armarNombreBasePositiva(texto)`: devuelve el nombre o `null`. |
| `components/RendicionCard.tsx` | editar (bloque) | B-20 (dueño) | Agregar el label `Archivos procesados` y `HistorialRendicionesTable` al final de la tarjeta. Declarar dependencia en el PR. |
| `pages/PagoFacilPage.tsx` | editar (bloque) | B-20 (dueño) | Renderizar `BasePositivaCard` en `data-bloque="base-positiva"`. |
| Tests (§10) | crear | B-21 | |

No se editan `packages/*`. Las funciones de request y las keys vienen de T-30.

## 6. Pasos de implementación

1. Confirmar en `@nexa/api` (T-30): función para `GET /api/pagofacil/rendiciones` (devuelve `HistorialRendicionResponse[]`), función para `GET /api/pagofacil/base-positiva` (devuelve status, `Content-Type` y texto, RV-18), y `pagoFacilKeys.rendiciones`. Si la forma de retorno es otra, se usa la de T-30 y se documenta el ajuste en el PR.
2. Crear `schemas/nombreBasePositiva.ts`:
   ```ts
   const PREFIJO_H = 'H';
   export function armarNombreBasePositiva(texto: string): string | null {
     const encabezado = texto.slice(0, 14);
     if (encabezado.length < 14 || encabezado[0] !== PREFIJO_H) return null;
     const empresa = encabezado.slice(1, 6);
     const fecha = encabezado.slice(6, 14);
     if (!/^\d{5}$/.test(empresa) || !/^\d{8}$/.test(fecha)) return null;
     return `BASEPOS_${empresa}_${fecha}.txt`;
   }
   ```
   El formato sale de `polizas-cuotas-pagofacil.md` §8.2 (registro `H`: `H` + empresa de 5 + fecha de 8, `yyyyMMdd`).
3. Crear `api/descargarTextoComoArchivo.ts`:
   - Recibe `(nombre: string, texto: string)`, crea `new Blob([texto], { type: 'text/plain' })`, un `URL.createObjectURL`, un `<a download>` y llama `click()`.
   - Revoca el object URL con `setTimeout(() => URL.revokeObjectURL(url), 0)`. La receta de `polizas-cuotas-pagofacil.md` §11.2 lo revoca al instante; en algunos navegadores la descarga no arranca así.
4. Crear `api/useDescargarBasePositiva.ts`:
   - `useMutation({ mutationFn: pedirBasePositiva, retry: 0, onSuccess: ... })`.
   - `pedirBasePositiva` llama la función de T-30, que devuelve status, `Content-Type` y texto (RV-18). Si `ok` es falso o el `contentType` no empieza con `text/plain`, lanza `ApiError` con el `detail` del `problem+json`. No guarda nada en ese caso.
   - `onSuccess`: arma el nombre con `armarNombreBasePositiva(texto)`. Si es `null`, lanza error propio (§8). Si no, llama `descargarTextoComoArchivo(nombre, texto)`.
   - Sin caché: no es una query. Ninguna key se invalida.
5. Crear `api/useHistorialRendiciones.ts`: `useQuery({ queryKey: pagoFacilKeys.rendiciones, queryFn: listarRendiciones })`. Sin paginación.
6. Crear `EstadoRendicionBadge` con texto `Procesado` y token `status/vigente` (`design-system.md §5.4`). Único estado posible (B12 §9).
7. Crear `HistorialRendicionesTable` con `Table/Header` y `Table/Row` (T-06). Columnas y anchos (B12 §3): Archivo 260, Fecha de proceso 170, Líneas 110, Pagos generados 170, Importe total 170, Estado 164.
8. Crear `HistorialRendicionRow` con las celdas:
   - `Archivo`: `nombreArchivo`, en fuente mono.
   - `Fecha de proceso`: `fechaProceso` (UTC) convertida a `America/Argentina/Buenos_Aires` con T-09, formato `dd/mm/aaaa hh:mm`.
   - `Líneas`: `cantidadRegistros`.
   - `Pagos generados`: `pagosAprobados`.
   - `Importe total`: `importeTotal` con T-09, `$ 4.318.750,00`, alineado a la derecha.
   - `Estado`: `EstadoRendicionBadge`.
9. Agregar a `RendicionCard` (editar bloque de B-20): label `Archivos procesados` (12 px Medium, `text/secondary`) y `HistorialRendicionesTable` al final de la tarjeta. El orden queda como en §8, con el aviso de B-20 antes de la tabla (D-B21-01).
10. Crear `BasePositivaCard`:
    - Título `Base positiva` (16/22 SemiBold), ayuda `Genera el archivo con los cupones vigentes para que Pago Fácil los acepte en caja.`, botón `Generar base positiva` (`variant="primary"`, `size="m"`, con ícono de archivo; nombre de ícono a verificar al importar, `design-system.md §9.15`).
    - El botón se deshabilita mientras `isPending`. Muestra `Generando base positiva…` (propuesta) mientras corre.
    - No muestra `Últimas bases generadas`, ni `Descargar`, ni la tabla de bases (D-12).
    - Errores: `AlertaError` de T-07 con `role="alert"`, con el `detail` del back o el texto propio de §8.
11. Editar `PagoFacilPage.tsx` (bloque de B-20): renderizar `BasePositivaCard` dentro de `data-bloque="base-positiva"`.
12. Escribir los tests de §10 antes de implementar.

## 7. Contrato con el back

| Método y ruta | Estado | Request | Respuesta | Errores que maneja la UI |
|---|---|---|---|---|
| `GET /api/pagofacil/rendiciones` | Implementado (`PagoFacilController.cs:54-59`) | sin parámetros | 200 `HistorialRendicionResponse[]`, ordenado por `fechaProceso` descendente, sin paginación | 401, 403, 500 |
| `GET /api/pagofacil/base-positiva` | Implementado (`PagoFacilController.cs:66-74`) | sin body ni query; header `Authorization` obligatorio | 200 `text/plain` con `Content-Disposition` de adjunto (no legible cross-origin) | 400 `application/problem+json` (desborde, PB-18); 401; 403; 500 |
| Historial de bases generadas | **NO EXISTE** | — | — | No se usa (D-12). |

Tipo (de `polizas-cuotas-pagofacil.md` §7.3; lo exporta T-30):

```ts
export interface HistorialRendicionResponse {
  id: string;
  nombreArchivo: string;
  fechaRendicion: string;     // yyyy-MM-dd, día de proceso en Argentina (no se muestra en el Figma)
  fechaProceso: string;       // ISO UTC (PB-16)
  cantidadRegistros: number;  // líneas válidas leídas
  importeTotal: number;
  pagosAprobados: number;     // pagos de ese archivo en estado Aprobado
}
```

Respuesta de la base positiva: el cuerpo es el texto del archivo, con registros de 97 caracteres y fin de línea `\r\n` (`polizas-cuotas-pagofacil.md` §8.2). No se normaliza el texto: se guarda tal cual.

Errores de la base positiva: `ProblemDetails` con `detail` como `El importe {x} no entra en el código de Pago Fácil.` (§8.1). Falla el archivo entero.

Handlers MSW: los escribe T-30 en `packages/api/mocks/handlers/pagofacil.ts`.

## 8. Contenido de UI

Textos literales del Figma (B12 §5):

| Elemento | Texto |
|---|---|
| Label de la tabla | `Archivos procesados` |
| Headers de la tabla | `Archivo`, `Fecha de proceso`, `Líneas`, `Pagos generados`, `Importe total`, `Estado` |
| Badge de fila | `Procesado` |
| Título de la tarjeta | `Base positiva` |
| Ayuda | `Genera el archivo con los cupones vigentes para que Pago Fácil los acepte en caja.` |
| Botón | `Generar base positiva` |

Textos que el Figma no define (propuesta, B12 §7 "NO DEFINIDO"):

| Elemento | Texto propuesto |
|---|---|
| Historial vacío | `No hay rendiciones procesadas.` |
| Historial cargando | Skeleton de 3 filas de 48 px (sin texto) |
| Error del historial | `No se pudo cargar el historial.` + `detail` del back |
| Generando | `Generando base positiva…` |
| Error de la base (400/500) | `detail` del back, o `No se pudo generar la base positiva.` |
| Respuesta con formato inesperado | `La base positiva llegó con un formato inesperado. No se descargó.` |
| 403 | `No tenés permiso para generar la base positiva.` |
| Sin red | `No se pudo conectar. Revisá la conexión y volvé a intentar.` |

Formato de importes y fechas: solo con T-09 (`$ 4.318.750,00`, `27/10/2026 18:05`).

Valores de muestra (no son texto fijo): `RENDPF_20261028.txt`, `28/10/2026 09:12`, `192`, `188`, `$ 4.318.750,00`, `BASEPOS_20261028.txt`.

## 9. Estados y casos borde

| Caso | Comportamiento |
|---|---|
| Historial cargando | Skeleton de 3 filas. |
| Historial vacío | `No hay rendiciones procesadas.` |
| Historial con error | Mensaje y `detail` en `role="alert"`. El botón de base sigue disponible. |
| Historial de un archivo con `pagosAprobados` < `cantidadRegistros` | Se muestra tal cual (no hay estado parcial en el back, B12 §13.12). |
| Base: 200 `text/plain` válido | Se descarga `BASEPOS_<empresa>_<yyyyMMdd>.txt`. |
| Base: 200 con `Content-Type` `application/problem+json` | No se descarga. Se muestra el error. |
| Base: 400 (desborde) | No se descarga. Se muestra el `detail`. |
| Base: 401 | Lo resuelve T-08 (sesión). |
| Base: encabezado `H` inválido | No se descarga. Se muestra `La base positiva llegó con un formato inesperado. No se descargó.`. |
| Doble clic | Un solo GET (botón deshabilitado durante `isPending`). |
| Sin red | Mensaje de §8; no se reintenta. |
| Subida exitosa (B-20) | El historial se refresca (invalidación de `pagoFacilKeys.rendiciones`). |
| Rol | Empleado y Administrador. |

## 10. Tests requeridos

Herramientas: Vitest, Testing Library, MSW (handlers de T-30 con `server.use`), `vitest-axe`.

`schemas/nombreBasePositiva.test.ts`:
1. `arma_nombre_desde_registro_h`: `H1234520261120` + resto da `BASEPOS_12345_20261120.txt`.
2. `devuelve_null_si_no_empieza_con_h`.
3. `devuelve_null_si_fecha_no_tiene_8_digitos`.
4. `devuelve_null_si_texto_corto`.

`components/HistorialRendicionesTable.test.tsx`:
5. `headers_del_figma_en_orden`: `Archivo`, `Fecha de proceso`, `Líneas`, `Pagos generados`, `Importe total`, `Estado`.
6. `fecha_de_proceso_en_argentina`: `fechaProceso` `2026-10-27T21:05:00Z` se muestra `27/10/2026 18:05`.
7. `importe_con_formato_es_ar`: `4318750` se muestra `$ 4.318.750,00`.
8. `estado_siempre_procesado`: cada fila muestra `Procesado`.
9. `vacio_muestra_mensaje`.
10. `error_muestra_detail_en_role_alert`.
11. `refresca_al_invalidar_la_key`: invalidar `pagoFacilKeys.rendiciones` vuelve a pedir el listado (contador en MSW = 2).

`components/BasePositivaCard.test.tsx`:
12. `no_muestra_historial_de_bases`: no aparecen `Últimas bases generadas` ni `Descargar`.
13. `descarga_con_nombre_armado_desde_h`: con 200 `text/plain` y texto `H1234520261120...`, el `a.download` es `BASEPOS_12345_20261120.txt` (spy sobre `URL.createObjectURL` y `HTMLAnchorElement.prototype.click`).
14. `no_descarga_si_content_type_es_problem_json`: 200 con `application/problem+json`: no se llama `createObjectURL`.
15. `400_muestra_detail_y_no_descarga`: handler responde 400 con `detail` "El importe 99999999.99 no entra en el código de Pago Fácil.": aparece en `role="alert"`; no hay descarga.
16. `encabezado_invalido_no_descarga`.
17. `doble_clic_genera_un_solo_get`: contador = 1.
18. `boton_deshabilitado_mientras_genera`.
19. `a11y_sin_violaciones`.

`descargarTextoComoArchivo.test.ts`:
20. `revoca_el_object_url_despues_del_click`: se llama `URL.revokeObjectURL` (con fake timers).

## 11. Criterios de aceptación

1. La tabla `Archivos procesados` muestra las seis columnas del Figma, en orden, con `Procesado` en la columna `Estado`.
2. `Fecha de proceso` muestra la hora de Argentina (`dd/mm/aaaa hh:mm`), desde una fecha UTC (test 6).
3. `Importe total` muestra el formato `$ 4.318.750,00` (test 7).
4. La tarjeta `Base positiva` tiene el título, la ayuda y el botón `Generar base positiva` del Figma.
5. No se muestran `Últimas bases generadas`, ni la tabla de bases, ni botones `Descargar` (D-12).
6. La descarga usa el header `Authorization` (lo hace T-30 o la función de §6.4) y no un `<a href>` directo.
7. No se descarga nada si `res.ok` es falso o si el `Content-Type` no es `text/plain` (tests 14 y 15).
8. El nombre sale del registro `H` y tiene la forma `BASEPOS_<empresa>_<yyyyMMdd>.txt` (tests 1 a 4 y 13).
9. Tras una subida exitosa, el historial se refresca (test 11).
10. Doble clic en `Generar base positiva` genera una sola request (test 17).
11. Los tests 1 a 20 están en verde, con `vitest-axe` sin violaciones.
12. `npm run lint`, `typecheck`, `test` y `build` están en verde en `apps/backoffice`.

## 12. Verificación manual

1. Con `VITE_USE_MOCKS=true` o la API local, abrir `/pago-facil`.
2. Verificar la tabla `Archivos procesados`: la fecha en hora de Argentina, el importe con formato `es-AR` y el badge `Procesado`.
3. Pulsar `Generar base positiva`: verificar que se descarga `BASEPOS_<empresa>_<fecha>.txt`, con el contenido del mock.
4. Forzar un 400 en el mock (desborde): verificar que no se descarga nada y aparece el mensaje.
5. Subir una rendición con B-20 y verificar que la tabla se actualiza sin recargar.
Confirmar los resultados antes de abrir el PR (regla 7 de `docs/workflow.md`).

## 13. Decisiones pendientes con default

- **D-B21-01: orden dentro de la tarjeta de rendición.** Figma (B12 §3): label `Archivos procesados`, aviso, tabla. Default: aviso (de B-20) antes del label, para que quede junto a la dropzone. Confirmar con diseño.
- **D-B21-02: historial de bases (D-12).** Oculto. Confirmar que no se agrega el contrato propuesto de B12 §9.
- **D-B21-03: `Generar base positiva` es `GET`.** El back genera y devuelve el archivo sin guardarlo (B12 §13.6). Default: la UI descarga el archivo; no hay tabla de bases.
- **D-B21-04: nombre del archivo.** Default: armado en el front desde el registro `H` (PB-17). Si el back expone `Content-Disposition` en CORS, se puede usar ese nombre.
- **D-B21-05: texto vacío del historial.** Propuesta (§8).
- **D-B21-06: texto de error de encabezado inválido.** Propuesta (§8). No se descarga en ese caso.

## 14. Riesgos y errores comunes

- **Guardar un JSON como `.txt`.** Un error `application/problem+json` no es un archivo. Revisar `res.ok` y `Content-Type` antes de crear el blob (`polizas-cuotas-pagofacil.md` §8.3, §11.2).
- **Link directo.** `<a href="…/base-positiva">` no envía el token. Usar la función de T-30 con `Authorization`.
- **Nombre desde `Content-Disposition`.** No es legible desde otro origen (PB-17). Usar el registro `H`.
- **Revocar el object URL al instante.** Revocar con `setTimeout` (§6.3).
- **Tratar `fechaProceso` como hora local.** Es UTC (PB-16 puede omitir `Z`). T-09 la trata como UTC.
- **Mostrar `Procesado` como dato.** Es un valor constante; el back no tiene campo de estado (B12 §13.12).
- **Desborde silencioso.** Con cuotas mayores a ~$95.237 el archivo entero falla (PB-18). Mostrar el `detail`, no un archivo parcial.
- **Descarga doble.** Deshabilitar el botón mientras corre (FC11).

## 15. Definición de terminado

- `npm run lint`, `typecheck`, `test` y `build` en verde.
- Accesibilidad revisada con T-19 en `/pago-facil` (tablas con `scope="col"`, botón con texto visible, alerta con `role="alert"`).
- Sin secretos; no se guarda el texto de la base en `localStorage` ni `sessionStorage` (FC12).
- Criterios 1 a 12 de §11 tildados con evidencia observada.

## 16. Observaciones al índice

- Resuelto (RV-18): T-30 devuelve status, `Content-Type` y texto de la base positiva. Sin cambio de ola.
- Resuelto (RV-12): la invalidación de `pagoFacilKeys.rendiciones` tras subir la hace el hook de B-20 (ver B-20 §6, paso 4).
- Resuelto (RV-11): la tabla de historial se agrega en el bloque de `RendicionCard` de B-20, declarado en §5.
