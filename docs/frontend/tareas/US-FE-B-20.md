# US-FE-B-20: Pago Fácil: subir rendición

Tipo B · Oleada 4 · Tamaño M · Rama sugerida `feature/US-FE-B-20-pago-facil-rendicion` · Tarjeta Trello `US-FE-B-20`

## 1. Objetivo

Al terminar, `/pago-facil` (B12) permite subir el archivo `.txt` de la rendición diaria de Pago Fácil con validación previa, y muestra el resultado de la carga: resumen, líneas rechazadas (201 parcial) o el motivo de un 400 (archivo duplicado, formato, tamaño). El resultado se puede copiar o descargar antes de salir de la pantalla, porque el back no lo guarda (PB-19). Usuarios: Empleado y Administrador. La tabla del historial y la base positiva son de US-FE-B-21.

## 2. Alcance

**Entra**
- Página `apps/backoffice/src/features/pago-facil/pages/PagoFacilPage.tsx` (creada aquí; la edita B-21 por bloques).
- Ruta `/pago-facil` (D-03: una sola ruta) en `features/pago-facil/routes.tsx`.
- Tarjeta `Rendición diaria`: título, ayuda, dropzone y resultado de la carga.
- Validación previa del archivo (extensión `.txt`, tamaño, nombre).
- Mutación de subida con `POST /api/pagofacil/rendiciones` (multipart, campo `archivo`).
- Aviso de archivo ya procesado (400 de duplicado).
- Tabla de líneas rechazadas (`Línea` y `Motivo`) dentro del resultado.
- Acciones `Copiar resultado` y `Descargar resultado` (workaround de PB-19).
- `features/pago-facil/index.ts` (dueño, FC1) y `routes.tsx`.

**NO entra**
- Tabla `Archivos procesados` (historial de rendiciones) y tarjeta `Base positiva`: US-FE-B-21. Sí se deja el hueco en `PagoFacilPage` para que B-21 agregue su bloque.
- Historial persistido de resultados: no existe en el back (PB-19).
- Cupón de Pago Fácil: no hay bloque de cupón en B12 (B12 §13.1).
- Reintento de factura o de rendición: no existe (fuera de alcance).
- Validar el contenido de las líneas en el front: lo hace el back (`RendicionParser`).

## 3. Dependencias

- **Oleada (INDEX):** 4.
- **Puede empezar sin esperar a:** `US-FE-B-21` (mismo feature, la tabla y la base positiva se suman después).
- **Depende de:** `US-FE-T-07`, `US-FE-T-08`, `US-FE-T-10`, `US-FE-T-11`, `US-FE-T-16`, `US-FE-T-19`, `US-FE-T-30`.
- **Pedidos al back (INDEX):** PB-19 (degrada: resultado no persistido).
- **Qué entrega T-30 que esta tarea consume:** función de subida (recibe un `File`, arma el `FormData` con el campo `archivo` y devuelve `RendicionResponse`) y tipos `RendicionResponse` y `ErrorLineaRendicion`.
- **Degradaciones:** PB-19: el 201 con líneas rechazadas se trata como resultado parcial y se ofrece copiar o descargar; no hay GET por id de la rendición. PB-17 (`Content-Disposition` y `Location` no expuestos por CORS): no afecta esta tarea. PB-14 (400 de negocio sin código): el duplicado se identifica por el texto de `detail`, sin comparar texto para lógica.
- **Workaround MSW (FB7.7):** no aplica. El endpoint es real; en tests se usan los handlers de T-30 con `server.use`.

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB3 (reglas 1 a 4), FB4, FB7.6 (mensajes), FB7.9 (no reenviar pagos a ciegas: aquí aplica como no reenviar la subida).
- `docs/frontend/tareas/INDEX.md`: FC1 (esta tarea es dueña de `index.ts` de `pago-facil`), FC2, FC10 (errores), FC11 (`retry: 0`), FC13 (todo por el cliente de T-08), FC16, D-03 (una ruta), D-12 (historial de bases oculto).
- `docs/frontend/pantallas/B12-pago-facil.md`:
  - §2 (ruta y guardas), §3 (tarjeta 1: título, ayuda, dropzone 1046×121, aviso, tabla).
  - §5 (textos literales de la tarjeta 1: `Rendición diaria`, ayuda, `Arrastrá el archivo .txt o `, `elegilo desde tu equipo`, `Formato de rendición Pago Fácil, hasta 5 MB`, aviso de duplicado y su formato).
  - §6 (tabla "Carga de rendición": extensión, tamaño, nombre, contenido, duplicado).
  - §7 (estados: reposo, subiendo, aceptado, error, duplicado; los NO DEFINIDO).
  - §8 (acción `Subir`).
  - §12 (accesibilidad: input de archivo por teclado, `role="alert"`).
  - §13 puntos 1 a 5 y 8 (cupón, resultado por línea, fecha del duplicado, errores sin código, extensión).
- `docs/frontend/contratos-api/polizas-cuotas-pagofacil.md`:
  - §7.1 (formato del archivo: ancho fijo, 60 caracteres por línea).
  - §7.2 (`POST /api/pagofacil/rendiciones`: límites, nombre, errores de formato y de negocio, orden de validación).
  - §7.4 (`RendicionResponse`, `ErrorLineaRendicion`, motivos y receta de UI).
  - §11.1 (receta de subida multipart).
- `docs/frontend/contratos-api/convenciones-transversales.md`: §3.3 (`ValidationProblemDetails`), §3.4 (`ProblemDetails`), §7.3 (upload: 5 MB, campo `archivo`).
- `docs/frontend/design-system.md`: §5.13 (Card/Widget), §5.1 (Button), §8.3 (foco), §8.2 (error de campo).
- `docs/frontend/pedidos-al-back.md`: fichas PB-14, PB-17 y PB-19.

## 5. Archivos a crear o modificar

Bajo `frontend/apps/backoffice/src/features/pago-facil/`. Dueño de todos: US-FE-B-20, salvo lo indicado.

| Archivo | Acción | Nota |
|---|---|---|
| `pages/PagoFacilPage.tsx` | crear | Compone `RendicionCard`. Deja un contenedor `<div data-bloque="base-positiva">` para B-21 (sin contenido en esta tarea). |
| `routes.tsx` | crear | `export const pagoFacilRoutes: RouteObject[] = [{ path: '/pago-facil', element: <PagoFacilPage /> }];`. Reemplaza el stub de T-14 si existe. |
| `index.ts` | crear | Exporta `pagoFacilRoutes`. Las tareas siguientes agregan su bloque. |
| `components/RendicionCard.tsx` | crear | Tarjeta `Rendición diaria`: título, ayuda, dropzone, aviso y resultado. |
| `components/RendicionDropzone.tsx` | crear | Zona de arrastre con input de archivo y botón `elegilo desde tu equipo`. |
| `components/RendicionAviso.tsx` | crear | Aviso de error de la carga (duplicado, formato, tamaño). |
| `components/RendicionResultado.tsx` | crear | Resumen de la carga y las acciones `Copiar resultado` y `Descargar resultado`. |
| `components/ErroresLineasTable.tsx` | crear | Tabla `Línea` / `Motivo`. |
| `api/useSubirRendicion.ts` | crear | `useMutation` sobre la función de T-30. `retry: 0`. |
| `schemas/archivoRendicion.ts` | crear | Validación del `File` (extensión, tamaño, nombre). |
| `schemas/parseErroresRendicion.ts` | crear | Función pura que separa el `detail` de líneas mal formadas. |
| `types/rendicion.ts` | crear | `ResultadoSubida` (`{ tipo: 'ok' \| 'error' ... }`). |
| Tests en la misma carpeta (§10) | crear | |

No se editan `packages/*`. El tipo `RendicionResponse` y la función de subida los exporta T-30.

## 6. Pasos de implementación

1. Confirmar en `@nexa/api` la función de T-30 para `POST /api/pagofacil/rendiciones` (recibe un `File`, arma el `FormData` con el campo `archivo` y devuelve `RendicionResponse`) y los tipos `RendicionResponse` y `ErrorLineaRendicion`. Si el nombre es otro, se usa el de T-30.
2. Crear `schemas/archivoRendicion.ts`:
   ```ts
   import { z } from 'zod';
   export const MAX_BYTES_RENDICION = 5 * 1024 * 1024; // RendicionService.cs:32
   export const NOMBRE_RENDICION = /^[A-Za-z0-9._-]{1,90}$/; // RendicionService.cs:176
   export function validarArchivoRendicion(file: File): string | null {
     if (!/\.txt$/i.test(file.name)) return 'Elegí un archivo .txt.';
     if (file.size > MAX_BYTES_RENDICION) return 'El archivo supera el máximo de 5 MB.';
     if (!NOMBRE_RENDICION.test(file.name)) return 'El nombre solo puede tener letras sin acento, números, ".", "-" o "_" (máximo 90 caracteres).';
     return null;
   }
   ```
   Los textos de error de validación previa son propuesta (B12 §7: NO DEFINIDO). El texto de 5 MB es el del back (`RendicionService.cs:170-171`). Un test cubre cada regla.
3. Crear `schemas/parseErroresRendicion.ts`: función `parseLineasMalFormadas(detail: string): string[] | null` que, si `detail` empieza con `El archivo de rendición tiene líneas mal formadas: `, devuelve el resto separado por `; `. Si no, devuelve `null`. Es una función pura: sin React ni red.
4. Crear `api/useSubirRendicion.ts`: `useMutation({ mutationFn: subirRendicion, retry: 0 })`. En `onSuccess` invalida `pagoFacilKeys.rendiciones` (RV-12): B-21 refresca el historial con esa key.
5. Crear `RendicionDropzone`:
   - `<input type="file" accept=".txt" hidden>` con `ref`. El texto `Arrastrá el archivo .txt o ` va seguido de un `<button>` con el texto `elegilo desde tu equipo` (subrayado, SemiBold), que abre el input (accesible por teclado).
   - Soporta `onDragOver` y `onDrop`; al soltar un archivo, usa el mismo flujo que el input.
   - Línea de formato: `Formato de rendición Pago Fácil, hasta 5 MB`.
   - Mientras sube: el input y el botón quedan deshabilitados.
6. Crear `RendicionCard`:
   - Título `Rendición diaria` (16/22 SemiBold) y ayuda `Subí el archivo de rendición del día. Cada archivo se procesa una sola vez.`.
   - Estado local `ResultadoSubida`: `{ tipo: 'ninguno' } | { tipo: 'ok', resultado: RendicionResponse } | { tipo: 'error', mensaje: string, lineas?: string[], duplicado?: boolean }`.
   - Al elegir archivo: `validarArchivoRendicion`. Si hay error, se muestra en `RendicionAviso` sin llamar a la API.
   - Si pasa, `mutate(file)`.
   - Éxito (201): `ResultadoSubida` `ok`. Si `rechazadas > 0`, se muestra `RendicionResultado` con la tabla; si no, solo el resumen.
   - Error: se mapea `ApiError` así:
     - 400 con `detail` que empieza con "ya fue procesado" → duplicado (`role="alert"`, texto del back).
     - 400 con `detail` de líneas mal formadas → `lineas` = `parseLineasMalFormadas(detail)`.
     - 400 con `errors.archivo` (`ValidationProblemDetails`) → mensaje `errors.archivo[0]`.
     - Otros 400 y 500 → `detail` o `Ocurrió un error inesperado.`.
     - 401 y 403: los maneja T-08 y T-16 (403: texto `No tenés permiso para subir rendiciones.`, propuesta).
   - Nunca se muestra un toast de error para 201 con rechazos (contrato §7.4, punto 4).
7. Crear `RendicionResultado` con props `{ resultado: RendicionResponse }`:
   - Resumen: `Líneas procesadas: {procesadas} de {cantidadRegistros}.`, `Líneas rechazadas: {rechazadas}.`, `Importe total: {importeTotal}` (con T-09). Textos propuesta.
   - Si `rechazadas > 0`: `ErroresLineasTable` con `errores`.
   - Acciones: `Copiar resultado` (`navigator.clipboard.writeText` dentro de try/catch; si falla, muestra `No se pudo copiar. Seleccioná el texto y copialo a mano.` propuesta) y `Descargar resultado` (genera un `Blob` `text/plain` con el resumen y las líneas, nombre `resultado_<NombreArchivo>.txt`).
8. Crear `ErroresLineasTable`: `<table>` con `<th scope="col">Línea</th>` y `<th scope="col">Motivo</th>`, y `<caption>` visualmente oculto `Líneas rechazadas`. Filas de 48 px.
9. Crear `PagoFacilPage` que renderiza `RendicionCard` dentro de una columna de ancho completo (1096 px en desktop, B12 §3) y el contenedor vacío `data-bloque="base-positiva"` para B-21.
10. Crear `routes.tsx` e `index.ts`.
11. Escribir los tests de §10 antes de implementar.

## 7. Contrato con el back

| Método y ruta | Estado | Request | Respuesta | Errores que maneja la UI |
|---|---|---|---|---|
| `POST /api/pagofacil/rendiciones` | Implementado (`PagoFacilController.cs:38-51`) | `multipart/form-data`, campo `archivo` | 201 `RendicionResponse` (aunque haya líneas rechazadas) | 400 (`detail`: duplicado, nombre, tamaño, líneas mal formadas, archivo vacío); 400 `ValidationProblemDetails` (falta `archivo`); 401; 403; 500 |

Tipos (de `polizas-cuotas-pagofacil.md` §7.4; los exporta T-30 en `packages/api/src/dto/pagofacil.ts`):

```ts
export interface RendicionResponse {
  id: string;
  nombreArchivo: string;
  cantidadRegistros: number;   // líneas válidas del archivo
  importeTotal: number;
  procesadas: number;          // cantidadRegistros - rechazadas
  rechazadas: number;          // errores.length
  errores: ErrorLineaRendicion[];
}

export interface ErrorLineaRendicion {
  linea: number;               // desde 1; cuenta las líneas en blanco
  motivo: string;
}
```

Mensajes de 400 que llegan en `detail` (`polizas-cuotas-pagofacil.md` §7.2):
- `El nombre del archivo debe tener entre 1 y 90 caracteres: letras sin acento, dígitos, '.', '-' o '_'.`
- `El archivo supera el máximo de 5 MB.`
- `El archivo de rendición tiene líneas mal formadas: línea {n}: {motivo}; línea {m}: {motivo}`
- `El archivo de rendición está vacío.`
- `El archivo {nombre} ya fue procesado (RN18).`

Motivos de línea rechazada (201, dentro de `errores`): ver `polizas-cuotas-pagofacil.md` §7.4. La UI los muestra tal cual.

Handlers MSW: los escribe T-30 en `packages/api/mocks/handlers/pagofacil.ts`; esta tarea no los modifica.

## 8. Contenido de UI

Textos literales del Figma (B12 §5):

| Elemento | Texto |
|---|---|
| Título topbar | `Pago Fácil` |
| Título de la tarjeta | `Rendición diaria` |
| Ayuda | `Subí el archivo de rendición del día. Cada archivo se procesa una sola vez.` |
| Dropzone, texto | `Arrastrá el archivo .txt o ` (texto normal) |
| Dropzone, link | `elegilo desde tu equipo` (subrayado, SemiBold) |
| Dropzone, formato | `Formato de rendición Pago Fácil, hasta 5 MB` |
| Aviso de duplicado (formato) | `{texto del back}` (ver nota) |
| Headers de la tabla de líneas (propuesta de B12 §13.2) | `Línea`, `Motivo` |

Nota sobre el aviso de duplicado: el Figma muestra `RENDPF_20261027.txt ya fue procesado el 27/10/2026 18:05. No se volvió a procesar.`. Ese texto es de muestra. El 400 del back no trae fecha. Default (B12 §13.3, opción a): se muestra el `detail` del back tal cual. Ver D-B20-02.

Textos que el Figma no define (propuesta, B12 §7 "NO DEFINIDO"):

| Elemento | Texto propuesto |
|---|---|
| Validación de extensión | `Elegí un archivo .txt.` |
| Validación de tamaño | `El archivo supera el máximo de 5 MB.` (texto del back) |
| Validación de nombre | `El nombre solo puede tener letras sin acento, números, ".", "-" o "_" (máximo 90 caracteres).` |
| Subiendo | `Subiendo archivo…` |
| Resumen | `Líneas procesadas: {procesadas} de {cantidadRegistros}.` / `Líneas rechazadas: {rechazadas}.` / `Importe total: {importe}.` |
| Caption de la tabla | `Líneas rechazadas` (visualmente oculto) |
| Copiar | `Copiar resultado` |
| Descargar | `Descargar resultado` |
| Error al copiar | `No se pudo copiar. Seleccioná el texto y copialo a mano.` |
| Error 500 | `Ocurrió un error inesperado.` + `Si el error se repite, subí el mismo contenido con otro nombre.` (B12 contrato §7.2) |
| 403 | `No tenés permiso para subir rendiciones.` |
| Aviso de cuidado antes de salir | `El resultado no se guarda. Copialo o descargalo antes de salir.` |

## 9. Estados y casos borde

| Caso | Comportamiento |
|---|---|
| Reposo | Dropzone con texto y link. Sin aviso ni resultado. |
| Archivo no `.txt` | Error de validación previa; no se llama a la API. |
| Archivo mayor de 5 MB | Error de validación previa (5.242.880 bytes). |
| Nombre inválido (acentos, espacios, más de 90) | Error de validación previa. |
| Subiendo | Dropzone deshabilitada; `Subiendo archivo…`. Un solo envío (`retry: 0`). |
| Arrastrar un segundo archivo durante la subida | Se ignora. |
| 201 sin rechazos | Solo resumen. |
| 201 con rechazos | Resumen + tabla. No es un error (no hay toast ni `role="alert"`). |
| 400 duplicado | `RendicionAviso` con `role="alert"` y el texto del back. |
| 400 líneas mal formadas | Lista con cada `línea {n}: {motivo}` separada por `; `. |
| 400 `ValidationProblemDetails` (falta `archivo`) | Mensaje de `errors.archivo[0]` en la dropzone. |
| 400 `El archivo de rendición está vacío.` | `detail` tal cual. |
| 500 | `Ocurrió un error inesperado.` + texto de reintento con otro nombre. |
| Sin red | Mensaje `No se pudo conectar. Revisá la conexión y volvé a intentar.` (propuesta); no se reenvía solo. |
| Salir de la pantalla con resultado | Se pierde (PB-19). El aviso de §8 se muestra junto al resultado. |
| Copiar sin permiso del navegador | Mensaje de error de copiado (§8). |

## 10. Tests requeridos

Herramientas: Vitest, Testing Library, MSW (handlers de T-30 con `server.use`), `vitest-axe`.

`schemas/archivoRendicion.test.ts`:
1. `rechaza_extension_que_no_es_txt`: `archivo.csv` devuelve `Elegí un archivo .txt.`.
2. `acepta_txt_en_mayusculas`: `ARCHIVO.TXT` pasa.
3. `rechaza_mas_de_5_mb`: un `File` de 5.242.881 bytes devuelve el mensaje de tamaño.
4. `acepta_exactamente_5_mb`: 5.242.880 bytes pasa.
5. `rechaza_nombre_con_acentos_o_espacios`: `rendición 1.txt` falla.
6. `rechaza_nombre_de_mas_de_90_caracteres`: 91 caracteres falla; 90 pasa.

`schemas/parseErroresRendicion.test.ts`:
7. `separa_lineas_por_punto_y_coma`: el detail con dos líneas devuelve dos elementos.
8. `devuelve_null_si_no_es_lineas_mal_formadas`.

`components/RendicionCard.test.tsx`:
9. `no_llama_api_si_la_validacion_falla`: contador de MSW = 0.
10. `envia_el_archivo_en_el_campo_archivo`: MSW captura `formData.get('archivo')` y el nombre.
11. `201_sin_rechazos_muestra_solo_resumen`: no existe la tabla `Líneas rechazadas`.
12. `201_con_rechazos_muestra_tabla_linea_motivo`: aparecen `Línea` y `Motivo`; no hay `role="alert"`.
13. `400_duplicado_muestra_aviso_con_role_alert`: texto del back dentro de `role="alert"`.
14. `400_lineas_mal_formadas_lista_cada_linea`: tres items.
15. `subida_no_se_reenvia_ante_error_de_red`: contador = 1.
16. `dropzone_deshabilitada_mientras_sube`.
17. `link_elegilo_es_boton_activable_con_teclado`: `Enter` abre el selector (spy sobre `click` del input).

`api/useSubirRendicion.test.tsx`:
21. `subida_ok_invalida_rendiciones`: tras un 201, `pagoFacilKeys.rendiciones` queda invalidada (spy sobre `queryClient.invalidateQueries`).

`components/RendicionResultado.test.tsx`:
18. `copiar_escribe_en_portapapeles`: spy sobre `navigator.clipboard.writeText`.
19. `copiar_con_error_muestra_mensaje`.
20. `a11y_sin_violaciones`: `vitest-axe` con 201 con rechazos.

## 11. Criterios de aceptación

1. `/pago-facil` muestra la tarjeta `Rendición diaria` con su título, su ayuda y el texto `Formato de rendición Pago Fácil, hasta 5 MB`.
2. El link `elegilo desde tu equipo` es un `button` accesible por teclado que abre el selector de archivo.
3. Un archivo que no es `.txt`, pesa más de 5 MB o tiene un nombre inválido no llama a la API (tests 1, 3 y 5 y test 9).
4. El campo del multipart se llama `archivo` (test 10).
5. Un 201 con rechazos muestra la tabla `Línea` / `Motivo` y no se presenta como error (test 12).
6. Un 400 de duplicado muestra el texto del back en `role="alert"` (test 13).
7. Un 400 de líneas mal formadas muestra una línea por cada motivo (test 14).
8. La subida no se reenvía sola ante error de red (test 15), y tras un 201 se invalida `pagoFacilKeys.rendiciones` (test 21).
9. `Copiar resultado` y `Descargar resultado` están disponibles mientras el resultado se muestra (tests 18 y 19).
10. El aviso `El resultado no se guarda. Copialo o descargalo antes de salir.` aparece junto al resultado.
11. `PagoFacilPage` deja el contenedor `data-bloque="base-positiva"` para B-21.
12. Los tests 1 a 21 están en verde, con `vitest-axe` sin violaciones.
13. `npm run lint`, `typecheck`, `test` y `build` están en verde en `apps/backoffice`.

## 12. Verificación manual

1. Con `VITE_USE_MOCKS=true`, abrir `/pago-facil`.
2. Elegir un archivo `.csv` y verificar el error de extensión sin request (pestaña Red).
3. Elegir un `.txt` válido: verificar el resumen y, si el mock devuelve rechazos, la tabla `Línea` / `Motivo`.
4. Elegir el mismo nombre otra vez: verificar el aviso de duplicado.
5. Pulsar `Copiar resultado` y pegar en un editor: verificar el texto.
6. Navegar con Tab hasta `elegilo desde tu equipo` y pulsar Enter.
Confirmar los resultados antes de abrir el PR (regla 7 de `docs/workflow.md`).

## 13. Decisiones pendientes con default

- **D-B20-01: resultado no persistido (PB-19).** Default: copiar o descargar desde la pantalla. Confirmar si el equipo prefiere pedir el GET por id al back.
- **D-B20-02: fecha del duplicado.** B12 §13.3: opción (a) mostrar el texto del back tal cual (sin fecha). Opción (b): buscar en el historial y usar `FechaProceso` (lo hace B-21). Default: (a).
- **D-B20-03: validación de extensión.** B12 §6: el back no valida `.txt`; el front es la única validación. Default: validar en el front.
- **D-B20-04: forma del aviso.** Default: el texto del back tal cual, en `role="alert"`, sin el texto de muestra del Figma.
- **D-B20-05: resumen y tabla.** Propuesta de B12 §13.2 (banner y tabla `Línea`/`Motivo`); confirmar con diseño, que no lo define.
- **D-B20-06: 403.** Default: texto propio (§8); el 403 no tiene cuerpo definido (convenciones §2.4).
- **D-B20-07 (RV-12): invalidación tras la subida. Resuelto.** La hace el hook de esta tarea: `pagoFacilKeys.rendiciones` en `onSuccess`.

## 14. Riesgos y errores comunes

- **Reenvío de un archivo ya cobrado.** El back cobra línea por línea. Si la subida falla a mitad (500), las líneas anteriores ya quedaron cobradas y el nombre queda tomado. No reintentar con el mismo nombre; el texto de §8 lo aclara.
- **Confundir 201 con éxito total.** Un 201 puede traer rechazos; leer siempre `rechazadas`.
- **Partir mal el `detail`.** Las líneas van separadas por `; `. No usar `split(',')`.
- **Nombre con acentos.** El back rechaza letras acentuadas y espacios (`RendicionService.cs:176`). Validar antes de enviar.
- **Límite de 5 MB.** El back usa 5.242.880 bytes; el multipart admite hasta 10 MB, así que un archivo de 6 MB llega al back y recibe 400 de negocio. Validar antes.
- **Contraste.** El texto de ayuda usa `text/secondary`, no `text/tertiary` (3,30:1, `design-system.md §8.1`).
- **Datos de muestra.** `RENDPF_20261027.txt` y la fecha del aviso son de muestra del Figma. No deben quedar como texto fijo.

## 15. Definición de terminado

- `npm run lint`, `typecheck`, `test` y `build` en verde.
- Accesibilidad revisada con T-19 en `/pago-facil` (input de archivo accesible, `role="alert"`, tabla con `scope="col"`).
- Sin secretos ni credenciales.
- Criterios 1 a 13 de §11 tildados con evidencia observada.

## 16. Observaciones al índice

- Resuelto (RV-12 / RV-11): el aviso de duplicado queda en `RendicionCard` de esta tarea. La tabla de historial la agrega B-21 en el mismo bloque, y la invalidación de `pagoFacilKeys.rendiciones` la hace el hook de esta tarea.
