# US-FE-T-30: API Pago Fácil (empleado)

Tipo T · Oleada 2 · Tamaño M · Rama sugerida `feature/US-FE-T-30-api-pagofacil` · Tarjeta Trello `US-FE-T-30`.

## 1. Objetivo

Dejar tipados, con función de request, claves de caché y handlers MSW, los cuatro endpoints de Pago Fácil del empleado: subir la rendición (`POST /api/pagofacil/rendiciones`, multipart), ver el historial (`GET /api/pagofacil/rendiciones`), descargar la base positiva (`GET /api/pagofacil/base-positiva`, texto plano) y obtener el cupón de una cuota (`GET /api/pagofacil/cuotas/{cuotaId}/cupon`, solo Empleado). Consumidores: B-20 y B-21 (Pago Fácil) y B-16 (cupón desde la ficha de póliza).

Los cuatro están **Implementados** en `development`.

## 2. Alcance

**Entra**
- `dto/pagofacil.ts` (dueño T-30): `RendicionResponse`, `ErrorLineaRendicion`, `HistorialRendicionResponse`, `CuponPagoFacilResponse`.
- `endpoints/pagofacil.ts`: `subirRendicion(archivo)`, `listarRendiciones()`, `descargarBasePositiva()` (expone la respuesta cruda: status, `Content-Type` y texto, RV-18), `obtenerCuponEmpleado(cuotaId)`.
- Claves: `pagoFacilKeys.rendiciones()`, `pagoFacilKeys.cuponEmpleado(cuotaId)`.
- MSW en `mocks/handlers/pagofacil.ts`.

**NO entra**
- Validación de archivo en la UI (5 MB, nombre): la hace B-20 antes de llamar. La función manda lo que recibe.
- Separación de errores de línea en filas: la hace B-20 (`detail` partido por `"; "`).
- Cupón público (`POST /api/publico/cupon`): T-31 (PB-02).
- Hooks: B-20 (`useSubirRendicion`), B-21 (`useHistorialRendiciones`, `useDescargarBasePositiva`), B-16 (`useCuponEmpleado`), en sus `features/*/api/` (FC2).

## 3. Dependencias

- **Depende de:** US-FE-T-08, US-FE-T-11, US-FE-T-12.
- **Oleada:** 2.
- **Puede empezar sin esperar a:** US-FE-B-20, US-FE-B-21.
- **Bloqueada por pedidos al back (PB-NN):** PB-17 (degrada: sin `Content-Disposition`), PB-19 (degrada). El nombre del archivo se arma desde el registro `H`. El desborde de importes y el DNI inválido (D12) quedan en §9 y §14.
- **Workaround:** nombre del archivo desde el registro `H`. Resultado de rendición: copiar o descargar antes de salir (B-20).

## 4. Documentos a leer

- `contratos-api/polizas-cuotas-pagofacil.md` §0 (puntos 4 a 6), §1.4 (formas de error), §6.1 (cupón: errores y respuesta), §6.2 (reglas de importes), §6.3 (código de barras: tratar como texto opaco), §7.1 (layout de rendición, 60 caracteres), §7.2 (subir: límites y errores), §7.3 (historial), §7.4 (resultado y motivos de línea), §8.1 (base positiva: errores), §8.2 (formato, 97 caracteres), §8.3 (descarga desde el front), §11.1 (receta de subida), §11.2 (receta de descarga). Dudas D7, D8, D9, D10, D11, D13.
- `contratos-api/convenciones-transversales.md` §7.3 (upload: 5 MB, `archivo`), §7.2 (headers).
- `pedidos-al-back.md` PB-17, PB-18, PB-19.
- `pantallas/B12-pago-facil.md` (subir, historial, base positiva; D-12 historial oculto) y `pantallas/B10-detalle-poliza.md` (cupón de cuota).
- `00-decisiones-base.md` FB4, FB7.9, FB7.11.
- `tareas/INDEX.md` FC2, FC3, FC5, FC10, FC13; decisión D-03 (una ruta `/pago-facil`).
- Back: `backend/Aseguradora.Api/Controllers/PagoFacilController.cs` (`[HttpGet("cuotas/{cuotaId:guid}/cupon")]`, `[HttpPost("rendiciones")]`, `[HttpGet("rendiciones")]`, `[HttpGet("base-positiva")]`, clase `[Authorize(Policy = Politicas.Empleado)]`). DTO verificados: `Application/Dtos/PagoFacil/RendicionResponse.cs` (record), `ErrorLineaRendicion.cs` (`int Linea, string Motivo`), `HistorialRendicionResponse.cs`, `CuponPagoFacilResponse.cs`.

## 5. Archivos a crear o modificar

| Archivo | Acción |
|---|---|
| `packages/api/src/dto/pagofacil.ts` | nuevo (dueño T-30) |
| `packages/api/src/endpoints/pagofacil.ts` | nuevo |
| `packages/api/mocks/handlers/pagofacil.ts` | nuevo (dueño T-30) |
| `packages/api/test/contract/pagofacil.contract.test.ts` | nuevo (RV-D31) |
| `packages/api/src/index.ts` | bloque de export (dueño T-12) |

No se edita ningún `package.json` ni `apps/*`.

## 6. Pasos de implementación

1. Confirmar que T-08 expone la respuesta cruda (status, `Content-Type` y texto, RV-18) antes de escribir `descargarBasePositiva` (D-30-1).
2. Escribir `dto/pagofacil.ts` con los tipos de §7.
3. Escribir las cuatro funciones de §7. `subirRendicion` arma `FormData` con el campo **`archivo`**. No fija `Content-Type` (lo pone el navegador con el boundary).
4. `descargarBasePositiva` verifica `res.ok` y `Content-Type` que empiece con `text/plain` **antes** de leer el contenido. Si no, lanza el error del back (§11.2 del contrato).
5. Exportar `pagoFacilKeys`.
6. Escribir handlers y tests (§10). El handler de base positiva devuelve texto plano con registros `H`, `D`, `T`.
7. Correr `lint`, `typecheck`, `test`.

## 7. Contrato con el back

Política: `Politicas.Empleado` en los cuatro endpoints. Sin token: 401. Sin rol: 403.

Serialización: `Guid` string; `decimal` número; `DateOnly` `"yyyy-MM-dd"`; `DateTime` ISO (con o sin `Z`, D9 y §1.5 del contrato). Enums: no se usan en estos tipos.

```ts
// dto/pagofacil.ts
export interface ErrorLineaRendicion {
  linea: number;                // desde 1; cuenta las líneas en blanco
  motivo: string;               // texto del back, en español
}

export interface RendicionResponse {
  id: string;
  nombreArchivo: string;
  cantidadRegistros: number;    // líneas válidas leídas
  importeTotal: number;         // suma de todas las líneas
  procesadas: number;           // cantidadRegistros - rechazadas
  rechazadas: number;           // errores.length
  errores: ErrorLineaRendicion[];
}

export interface HistorialRendicionResponse {
  id: string;
  nombreArchivo: string;
  fechaRendicion: string;       // "yyyy-MM-dd"
  fechaProceso: string;         // ISO, con o sin Z
  cantidadRegistros: number;
  importeTotal: number;
  pagosAprobados: number;       // no muestra cuántas fueron rechazadas
}

export interface CuponPagoFacilResponse {
  cuotaId: string;
  numeroPoliza: string;                // "POL-0000001"
  numeroCuota: number;
  importePrimerVencimiento: number;
  fechaPrimerVencimiento: string;      // "yyyy-MM-dd"
  importeSegundoVencimiento: number;
  fechaSegundoVencimiento: string;     // "yyyy-MM-dd". Mostrar la del DTO, nunca la del Figma (D-05, PB-21)
  codigoBarras: string;                // 42 dígitos, texto opaco
}
```

### 7.1 `POST /api/pagofacil/rendiciones`

- **Estado:** Implementado. **Request:** `multipart/form-data`, campo **`archivo`**. **Response:** 201 con `RendicionResponse`. El 201 llega aunque haya líneas rechazadas: **no es error** (PB-19).
- **Función:** `subirRendicion(archivo: File): Promise<RendicionResponse>`.
- **Clave al éxito:** `pagoFacilKeys.rendiciones()`.
- **Hook (lo escribe B-20):** `useSubirRendicion()`, `useMutation`, `retry: 0`. El botón se deshabilita mientras corre. **No se reenvía tras error de red** (FB7.9); el mismo contenido con otro nombre es la recuperación que indica el contrato (§7.2).
- **MSW:** `http.post('*/api/pagofacil/rendiciones')`. Éxito: 201 con `rechazadas: 0`. Variantes: `rendicionConRechazos` (201 con dos `errores`), `rendicionNombreInvalido` (400), `rendicionSuperaTamano` (400), `rendicionLineasMalFormadas` (400 con varios motivos separados por `"; "`), `rendicionVacia` (400), `rendicionYaProcesada` (400), `sinToken` (401).

#### 7.1.1 Errores de `POST /api/pagofacil/rendiciones`

| Status | Forma | Cuándo | Texto del back |
|---|---|---|---|
| 400 | `ProblemDetails` | nombre inválido | `"El nombre del archivo debe tener entre 1 y 90 caracteres: letras sin acento, dígitos, '.', '-' o '_'."` |
| 400 | `ProblemDetails` | tamaño mayor a 5 MB | `"El archivo supera el máximo de 5 MB."` |
| 400 | `ProblemDetails` | líneas mal formadas (el archivo no se guarda) | `"El archivo de rendición tiene líneas mal formadas: línea {n}: {motivo}; línea {m}: {motivo}"` |
| 400 | `ProblemDetails` | archivo sin líneas (o solo en blanco) | `"El archivo de rendición está vacío."` |
| 400 | `ProblemDetails` | nombre ya procesado (RN18) | `"El archivo {nombre} ya fue procesado (RN18)."` |
| 400 | `ValidationProblemDetails` | falta el campo `archivo` | `errors` con la clave del archivo (no verificada en runtime) |
| 413 o 500 | transporte o `ProblemDetails` | archivo entre 10 MB y el tope del servidor (D10, no verificado) | sin texto propio (D-30-3) |
| 500 | `ProblemDetails` | falla no prevista a mitad del archivo | `"Ocurrió un error inesperado."` (las líneas anteriores ya quedaron cobradas) |
| 401 / 403 | sin cuerpo | auth | (no usar texto del back) |

Motivos de línea rechazada (van dentro de `errores`, con 201): `"El código de barras no es válido (dígito verificador)."`, `"El código de barras es de la empresa {x}, no de esta aseguradora."`, `"La póliza {POL-…} no existe."`, `"La cuota {n} de la póliza {POL-…} no existe."`, `"La cuota {n} de la póliza {POL-…} está {Estado} (RN11)."`, `"El importe pagado {x} no coincide con el de la cuota ({y})."`, y el texto de la excepción de cobro (el pago queda `Pendiente` para revisión).

### 7.2 `GET /api/pagofacil/rendiciones`

- **Estado:** Implementado. **Response:** 200 con `HistorialRendicionResponse[]`, por `fechaProceso` descendente. Sin paginación.
- **Función:** `listarRendiciones(): Promise<HistorialRendicionResponse[]>`. **Clave:** `pagoFacilKeys.rendiciones()`. **Hook (lo escribe B-21):** `useHistorialRendiciones()`, `useQuery`. (Historial oculto según D-12; el hook existe para la promo de B-03.)
- **MSW:** éxito con una rendición. Variante `sinToken` (401).

### 7.3 `GET /api/pagofacil/base-positiva`

- **Estado:** Implementado. **Response:** 200 con `Content-Type: text/plain` y `Content-Disposition: attachment; filename="BASEPOS_<empresa>_<yyyyMMdd>.txt"`. El nombre **no es legible** desde otro origen (PB-17): armarlo desde el registro `H`.
- **Función:** `descargarBasePositiva(): Promise<{ nombreArchivo: string; contenido: string }>`. No usa `<a href>` directo (el endpoint exige `Authorization`).
- **Clave:** ninguna (descarga, no cache). **Hook (lo escribe B-21):** `useDescargarBasePositiva()`, `useMutation`, `retry: 0`.
- **Verificación obligatoria antes de guardar nada:** `res.ok === true` **y** `Content-Type` que empiece con `text/plain`. Si no, se lanza el error del back (un JSON guardado como `.txt` es un fallo silencioso).
- **Nombre:** `BASEPOS_` + empresa (posiciones 1 a 5 del registro `H`) + `_` + fecha (posiciones 6 a 13) + `.txt`.
- **Errores:**

| Status | Forma | Cuándo | Texto |
|---|---|---|---|
| 400 | `ProblemDetails` | una cuota no se puede armar (desborde) | `"El importe {x} no entra en el código de Pago Fácil."` (falla el archivo entero, PB-18) |
| 500 | `ProblemDetails` | mismos casos que el cupón | `"Ocurrió un error inesperado."` |
| 401 / 403 | sin cuerpo | auth | (no usar texto del back) |

- **MSW:** éxito con el formato del contrato §8.2: registros `H`, `D` y `T` de 97 caracteres con `\r\n`. Variantes: `basePositivaDesborde` (400 `ProblemDetails`), `basePositivaSinToken` (401), `basePositivaJsonConTextPlain` (200 con `Content-Type: application/json`, para probar la verificación).

### 7.4 `GET /api/pagofacil/cuotas/{cuotaId}/cupon`

- **Estado:** Implementado. **Auth:** Empleado. **Response:** 200 con `CuponPagoFacilResponse`. `cuotaId` es `Guid` en la ruta; un id mal formado da 404 de ruta.
- **Función:** `obtenerCuponEmpleado(cuotaId: string): Promise<CuponPagoFacilResponse>`.
- **Clave:** `pagoFacilKeys.cuponEmpleado(cuotaId)`. **Cache:** `staleTime: 0` y no se reutiliza entre días (contrato §6.3: el cupón depende de la fecha de Argentina).
- **Hook (lo escribe B-16):** `useCuponEmpleado(cuotaId)`, `useQuery`, `enabled` solo cuando el empleado pide el cupón.
- **Errores:**

| Status | Forma | Cuándo | `detail` |
|---|---|---|---|
| 404 | `ProblemDetails` | cuota inexistente | `"La cuota no existe."` |
| 400 | `ProblemDetails` | cuota `Pagada` o `Anulada` (RN11) | `"No se puede generar el cupón de una cuota en estado {Estado} (RN11)."` |
| 404 | `ProblemDetails` | póliza de la cuota no existe (no debería pasar) | `"La póliza de la cuota no existe."` |
| 400 | `ProblemDetails` | importe fuera del campo de Pago Fácil (PB-18) | `"El importe {importe:0.00} no entra en el código de Pago Fácil."` |
| 400 | `ProblemDetails` | número de póliza con formato inválido (no debería pasar) | `"El número de póliza {numero} no tiene un formato válido."` |
| 500 | `ProblemDetails` | número de póliza de más de 7 dígitos (D8, sin mapeo) | `"Ocurrió un error inesperado."` |
| 401 / 403 | sin cuerpo | auth | (no usar texto del back) |

- **MSW:** éxito con el ejemplo del contrato §6.1 (cuota 1 de POL-0000001, `codigoBarras` de 42 dígitos). Variantes: `cuponCuotaPagada` (400), `cuotaNoExiste` (404), `cuponDesborde` (400), `sinToken` (401).

## 8. Contenido de UI

No aplica (sin UI en esta tarea). Los textos de error se muestran como `detail` (FC10). Los motivos de línea del archivo los separa B-20 por `"; "`. El código de barras de 42 dígitos se muestra como texto de respaldo (contrato §6.3). La simbología gráfica no está definida (D14): no la define esta tarea. Textos de pantalla: `pantallas/B12-pago-facil.md` y `pantallas/B10-detalle-poliza.md`.

## 9. Estados y casos borde

- **Rendición con 201 y rechazos:** es resultado parcial, no error de red. No se muestra un toast de error (contrato §7.4).
- **Rendición, 400 "ya fue procesado":** el nombre ya está en el historial (RN18). Mostrar el mensaje y sugerir revisar el historial.
- **Rendición, resultado no persistido (PB-19):** el resultado solo llega en el POST. Si el empleado sale de la pantalla, se pierde la lista de errores. B-20 ofrece copiar o descargar antes de navegar.
- **Base positiva, respuesta JSON:** `res.ok` puede ser `true` con un tipo distinto. La verificación de §7.3 es obligatoria.
- **Base positiva, DNI inválido:** la cuota se omite sin aviso (D12). El archivo no lo informa; no inventar un aviso en la UI.
- **Cupón de cuota vencida:** el importe y la fecha de primer vencimiento dependen de la fecha del día. No cachear (§7.4).
- **Cupón, fecha de segundo vencimiento:** mostrar `fechaSegundoVencimiento` del DTO (D-05, PB-21). La fecha del Figma no se usa.
- **Token vencido:** 401 y cierre de sesión (T-08).

## 10. Tests requeridos

Vitest + MSW. Un test por forma de error (FC5).

1. `POST rendiciones devuelve 201 con rechazadas 0 y errores vacío`.
2. `POST rendiciones devuelve 201 con errores[] y no lanza error` (PB-19).
3. `POST rendiciones envía el campo archivo en multipart`.
4. `POST rendiciones devuelve 400 con detail para cada texto de §7.1.1` (`it.each`: nombre, tamaño, vacío, ya procesado).
5. `POST rendiciones devuelve 400 con líneas mal formadas en un solo detail separado por "; "`.
6. `POST rendiciones no reintenta ante 502` (una request).
7. `GET rendiciones devuelve HistorialRendicionResponse[] con fechaProceso`.
8. `GET base-positiva devuelve el contenido y el nombre armado desde el registro H` (`BASEPOS_12345_20261120.txt`).
9. `GET base-positiva rechaza una respuesta application/json aunque res.ok sea true`.
10. `GET base-positiva devuelve 400 con detail de desborde`.
11. `GET base-positiva devuelve 401 sin token`.
12. `GET cupón devuelve CuponPagoFacilResponse con codigoBarras de 42 dígitos`.
13. `GET cupón devuelve 400 para cuota pagada con detail del RN11`.
14. `GET cupón devuelve 404 si la cuota no existe`.
15. `GET cupón devuelve 400 para importe que no entra`.
16. `Cupón con staleTime 0 y clave que incluye cuotaId` (test de la clave exportada).

## 11. Criterios de aceptación

1. Los tipos de §7 existen en `dto/pagofacil.ts` con los nombres exactos.
2. `subirRendicion` envía el campo `archivo` y no fija `Content-Type`.
3. `descargarBasePositiva` verifica `res.ok` y `Content-Type` antes de leer el contenido, y arma el nombre desde el registro `H`.
4. `obtenerCuponEmpleado` devuelve `CuponPagoFacilResponse` y `pagoFacilKeys.cuponEmpleado(cuotaId)` tiene `staleTime` documentado.
5. Ninguna función reintenta.
6. Los handlers tienen éxito por defecto y variantes con nombre para cada error de §7.
7. Los tests de §10 pasan en verde.
8. El barrel exporta solo el bloque de T-30.
9. `lint`, `typecheck`, `test`, `build` en verde.
10. Las tablas de error coinciden con `contratos-api/polizas-cuotas-pagofacil.md` §6.1, §7.2, §7.3, §8.1.
11. `descargarBasePositiva` usa la respuesta cruda que expone T-08 (RV-18); la función no parsea JSON.

## 12. Verificación manual

Pasos para la persona responsable (regla 7), con el back local y seed:

1. Levantar el back (`docker compose up`) y el front con `VITE_USE_MOCKS=false` y `VITE_API_BASE_URL=http://localhost:8080`.
2. Con un Empleado, subir una rendición de prueba **con un nombre nuevo** (no usado). Confirmar que aparece el resumen y las líneas rechazadas con `línea` y `motivo`.
3. Subir el mismo nombre otra vez: confirmar el 400 "ya fue procesado".
4. Descargar la base positiva y confirmar que el archivo es `.txt` y que el nombre sigue `BASEPOS_<empresa>_<fecha>.txt`.
5. Pedir el cupón de una cuota `Pendiente` del seed y confirmar que `codigoBarras` tiene 42 dígitos.

Motivo de la prueba: los cuatro endpoints están Implementados y la descarga y la subida solo se verifican bien con el back real.

## 13. Decisiones pendientes

- **D-30-1 (respuesta cruda en T-08):** default (RV-18): T-08 expone la respuesta cruda (status, `Content-Type` y texto). T-30 la usa; no hay dependencia adicional.
- **D-30-2 (cabecera `Content-Disposition`, PB-17):** default: nombre armado desde `H`. Si el back agrega `WithExposedHeaders`, se lee el header.
- **D-30-3 (texto de 413 y de transporte):** default: sin texto propio hasta que el back confirme la respuesta (D10 del contrato). B-20 define el mensaje.
- **D-30-4 (historial):** default: el hook existe; B-21 lo oculta (D-12).
- **D-API-1 (hooks en features, FC2).** Default (RV-44): los hooks los escriben B-20, B-21 y B-16 en sus `features/*/api/`; `@nexa/api` solo exporta funciones, tipos y claves.

## 14. Riesgos y errores comunes

- **Guardar un error como archivo:** sin verificar `Content-Type` se guarda un JSON con nombre `.txt`. Mitigación: §7.3 y prueba 9.
- **Reenvío de rendición tras error de red:** el back rechaza el nombre repetido (RN18) o, si la falla fue a mitad del archivo, deja las líneas anteriores cobradas. Mitigación: nunca reenviar el mismo nombre sin revisar el historial.
- **Desborde del cupón y de la base positiva (PB-18):** cuotas de más de unos $95.237 fallan. La base positiva entera falla. Mitigación: mensaje de §7.4 en el cupón; no hay workaround para la base.
- **Caché del cupón entre días:** el importe cambia con la fecha. Mitigación: `staleTime 0`.
- **`detail` con varias líneas:** partir por `"; "` puede cortar motivos que contienen `;`. Mitigación: los motivos del back no contienen `;` (verificado en §7.4 del contrato); probar con el texto real.
- **CORS y `Authorization` en descarga:** un `<a href>` directo no manda el header. Mitigación: `fetch` con blob.

## 15. Definición de terminado

- `lint`, `typecheck`, `test`, `build` en verde (FC8).
- Sin secretos. Sin `fetch` fuera del cliente de T-08 (FC13). La excepción de §7.3 se resuelve con D-30-1.
- Los 11 criterios de §11 con evidencia observada.
- Prueba manual de §12 hecha y confirmada por el usuario (regla 7 del workflow).

## 16. Observaciones al índice

- Resuelto (RV-18): la respuesta cruda para la base positiva la expone T-08 (fila del INDEX de T-08). T-30 no agrega dependencia.
- ABIERTO: "Los handlers de texto plano necesitan que `handlers/index.ts` (T-11) acepte respuestas no JSON". Motivo: no aparece en REVISION.md ni en FB8.
- Resuelto (RV-01): sin dependencia de T-03 ni T-04; no hay UI en esta tarea.
- Resuelto (RV-11 / RV-12 / RV-28): el nombre canónico del objeto de claves es `pagoFacilKeys`; esta ficha lo usa.
- Resuelto (triage final, default de la ficha): "Dos tareas exportan `pagoFacilKeys` desde `@nexa/api`: esta (`rendiciones`, `cuponEmpleado(cuotaId)` del empleado) y T-31 (`cupon` público). Las dos claves `cupon` chocan". Motivo: RV-28 fija el nombre de T-31 y no separa los dos cupones; falta decidir el nombre de una de las dos claves antes de exportar desde el barrel. Cierre: T-30 exporta `pagoFacilKeys.cuponEmpleado(cuotaId)`; T-31 exporta `publicoKeys.cupon(numeroPoliza, cuotaId)`; `pagoFacilKeys` es solo de T-30 (un único export, sin choque en el barrel).
