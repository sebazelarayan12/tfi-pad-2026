# B12 · Pago Fácil

- **Pantalla:** B12 Pago Fácil (backoffice, desktop 1440 px). Frame de 1440 × 1259 px.
- **Figma:** nodo `23:2911`, página `02 Backoffice`.
- **Bloques del frame:** (1) `Rendición diaria` (carga y listado de archivos), (2) `Base positiva` (generación y listado). **El frame no tiene bloque de cupón.** Ver §13, punto 1.
- **Contrato verificado contra:** `development` (HEAD `4ba3d4b`). Código: `PagoFacilController`, `RendicionService`, `ExceptionMiddleware`, DTOs de `Dtos/PagoFacil/`.
- **Leyenda de estado de endpoint:** **Implementado**, **En PR #N**, **Especificado**, **NO EXISTE**.

---

## 1. Propósito y quién la usa

- **Propósito:** (a) subir el archivo de rendición diario que manda Pago Fácil, para registrar los cobros en efectivo; (b) generar y descargar la base positiva, el archivo con las deudas vigentes que se entrega a Pago Fácil.
- **Rol:** Empleado (`Politicas.Empleado` en `PagoFacilController`). Según `docs/rendicion-pagofacil.md` los dos endpoints usan la misma política.
- **Dato en el Figma:** el footer muestra `Mariela Quiroga` con rol `Empleado`.

## 2. Ruta propuesta y guardas de acceso

- **Ruta:** `/pago-facil`.
- **Feature:** `apps/backoffice/src/features/pago-facil` (FB3, nombre de dominio en español con guion).
- **Guardas:** igual que B11. JWT válido, rol Empleado o Administrador. Sin acceso: pantalla de acceso denegado (**NO DEFINIDO**).
- **Sidebar:** `Pago Fácil` activo. Ver Dudas: el Figma muestra `Planes` y `Usuarios` al Empleado.

## 3. Estructura visual (de arriba a abajo, medidas del Figma)

Panel shell: 1392 × 1211 px en (24, 24). Sidebar de 232 px. Columna principal de 1160 px con padding 32 px. **No hay rail derecho en esta pantalla.**

| Región | Medidas | Contenido |
|---|---|---|
| Topbar | alto 64 px, en y=32 | Título `Pago Fácil` (H2) a la izquierda, campana 36 × 36 a la derecha |
| Contenido | ancho 1096 px, en y=120, gap vertical 24 px | Dos tarjetas apiladas |
| Tarjeta 1: `Rendición diaria` | 1096 × 636 px, en y=0 de contenido | Fondo panel, borde hairline, radio 16 px, padding 24 px, gap 16 px |
| Tarjeta 2: `Base positiva` | 1096 × 399 px, en y=660 de contenido | Misma tarjeta |

**Tarjeta 1, de arriba abajo:**
1. Título `Rendición diaria` (16/22 SemiBold).
2. Texto de ayuda (13 px, secundario).
3. Dropzone: 1046 × 121 px, borde punteado de 1.5 px, fondo `surface-subtle`, radio 16 px, centrado. Dentro: ícono de archivo (20 px), texto con link, texto de formato.
4. Label `Archivos procesados` (12 px Medium).
5. Aviso amarillo (`status-suspendida`): ícono de advertencia + texto. Alto 42 px, radio 12 px.
6. Tabla `Archivos procesados`: 1046 px de ancho, borde hairline, radio 12 px. Header 40 px. Filas de 48 px.

**Anchos de columnas de la tabla de rendiciones (px):** Archivo 260 · Fecha de proceso 170 · Líneas 110 · Pagos generados 170 · Importe total 170 · Estado 164.

**Tarjeta 2, de arriba abajo:**
1. Título `Base positiva` (16/22 SemiBold).
2. Texto de ayuda (13 px).
3. Botón `Generar base positiva` (primario, alto 40 px, ícono de archivo a la izquierda).
4. Label `Últimas bases generadas` (12 px Medium).
5. Tabla de bases generadas: 1046 px, header 40 px, filas de 48 px. Columnas: Archivo 260 · Fecha de generación 230 · Cupones incluidos 300 · Acción (resto, alineada a la derecha).
6. Cada fila tiene un botón `Descargar` (secundario S, 110 × 32 px, ícono de descarga).

## 4. Componentes del design system y componentes propios

**Del design system (nombre en Figma):**
- `Logo/Nexa` (nodo 14:5). Descripción: "Nexa monogram plus wordmark. The only hand-made brand mark."
- `NavItem` (nodo 14:99). Descripción: "Sidebar nav item: 2px indicator bar at the left edge and darker text when Active=true. Icon is a Phosphor Regular glyph."
- `Button` (nodo 11:42). Descripción: "Pill button. Primary for the main action of a screen, Secondary for alternatives, Ghost for inline actions. Size M is 40px high, S is 32px high." Usos: `Generar base positiva` (primario M) y `Descargar` (secundario S).
- `Badge/Estado` (nodo 11:117). Descripción: "Status badge for policy and cuota states. Colors map to semantic status tokens only." Usos: `Procesado` (verde).

**Tokens de estado usados:**
- `Procesado`: `status-vigente` (fondo `#e3f4ea`, texto `#1f7a4d`).
- Aviso de archivo ya procesado: `status-suspendida` (fondo `#fbf0d6`, texto `#9a6400`).

**Sin instancia de componente (frames sueltos del Figma):** dropzone, tablas, divisores, íconos.

**Componentes propios (propuesta de nombres):**
- `RendicionPage` (page delgada).
- `RendicionDropzone` (arrastrar o elegir archivo, con validación de tamaño y extensión).
- `RendicionAviso` (aviso de archivo ya procesado).
- `RendicionesTable` y `RendicionRow`.
- `BasePositivaSection`, `BasesGeneradasTable`, `DescargarButton`.
- `EstadoRendicionBadge`.

## 5. Contenido textual literal

| Elemento | Texto literal |
|---|---|
| Título topbar | `Pago Fácil` |
| Título tarjeta 1 | `Rendición diaria` |
| Ayuda tarjeta 1 | `Subí el archivo de rendición del día. Cada archivo se procesa una sola vez.` |
| Dropzone, texto 1 | `Arrastrá el archivo .txt o ` (texto normal) |
| Dropzone, link | `elegilo desde tu equipo` (subrayado, SemiBold) |
| Dropzone, formato | `Formato de rendición Pago Fácil, hasta 5 MB` |
| Label tabla 1 | `Archivos procesados` |
| Aviso (muestra) | `RENDPF_20261027.txt ya fue procesado el 27/10/2026 18:05. No se volvió a procesar.` |
| Header tabla 1 | `Archivo`, `Fecha de proceso`, `Líneas`, `Pagos generados`, `Importe total`, `Estado` |
| Badge de fila | `Procesado` |
| Título tarjeta 2 | `Base positiva` |
| Ayuda tarjeta 2 | `Genera el archivo con los cupones vigentes para que Pago Fácil los acepte en caja.` |
| Botón | `Generar base positiva` |
| Label tabla 2 | `Últimas bases generadas` |
| Header tabla 2 | `Archivo`, `Fecha de generación`, `Cupones incluidos` |
| Botón de fila | `Descargar` |

**Datos de muestra del Figma (no son texto fijo):** `RENDPF_20261028.txt`, `28/10/2026 09:12`, `192`, `188`, `$ 4.318.750,00`, `BASEPOS_20261028.txt`, `1.138`.

**Nota:** en el Figma el link `elegilo desde tu equipo` y el texto `Arrastrá el archivo .txt o ` son dos nodos separados en la misma línea. Renderizarlos como una sola línea con un link.

## 6. Campos y validaciones

**Carga de rendición (dropzone):**

| Campo | Tipo | Obligatorio | Regla | Estado del back |
|---|---|---|---|---|
| Archivo | `multipart/form-data`, campo `archivo` | sí | Extensión `.txt` (`accept=".txt"`). El Figma dice "Formato de rendición Pago Fácil". **El back no valida la extensión** (no aparece en `RendicionService`). | Implementado |
| Tamaño | — | — | Máximo 5 MB (`5 * 1024 * 1024`). Validar en el front. Si supera, el back responde 400 `El archivo supera el máximo de 5 MB.` | Implementado |
| Nombre | — | — | Máximo 90 caracteres (`NombreArchivoMaximo`). El mensaje de error del back **no está verificado**; el front no debe depender de él | Implementado |
| Contenido | — | — | Líneas mal formadas: el back responde 400 para todo el archivo (`El archivo de rendición tiene líneas mal formadas: ...`). Líneas con regla de negocio no aplicable: se reportan por línea en `Errores` (201) | Implementado |
| Duplicado | — | — | Un archivo con el mismo nombre no se procesa dos veces (RN18). Responde 400 `El archivo {nombre} ya fue procesado (RN18).` | Implementado |

**Descarga de base positiva:** sin campos de entrada. La fecha la define el back (día de Argentina).

## 7. Estados

| Estado | Qué muestra | Fuente |
|---|---|---|
| Dropzone en reposo | Borde punteado, texto de ayuda y link | Figma |
| Dropzone arrastrando (drag over) | **NO DEFINIDO** | — |
| Subiendo archivo | **NO DEFINIDO**. Propuesta: deshabilitar la dropzone y mostrar progreso | Propuesta |
| Archivo aceptado (201) | **NO DEFINIDO**. El Figma no muestra el resultado de una carga. Ver §13, punto 2 | — |
| Resultado por línea (`Errores`) | **NO DEFINIDO** en el Figma | — |
| Archivo ya procesado (400) | Aviso amarillo `status-suspendida` con el texto del Figma. Ver §13, punto 3 | Figma |
| Historial vacío | **NO DEFINIDO** | — |
| Historial cargando | **NO DEFINIDO** | — |
| Error al cargar historial | **NO DEFINIDO** | — |
| Generando base positiva | **NO DEFINIDO**. Propuesta: botón deshabilitado con indicador | Propuesta |
| Base positiva lista | Descarga automática del archivo | Propuesta (el Figma no lo muestra) |
| Historial de bases vacío | **NO DEFINIDO** | — |
| Badge `Procesado` | Verde | Figma |
| Botón deshabilitado | **NO DEFINIDO** | — |

## 8. Acciones y navegación

| Acción | Qué hace | Destino |
|---|---|---|
| Arrastrar archivo o hacer click en `elegilo desde tu equipo` | Abre el selector y pone el archivo en la carga | Misma pantalla |
| Subir (al elegir el archivo) | `POST /api/pagofacil/rendiciones` (multipart `archivo`). Éxito: 201 con `RendicionResponse`, refrescar el historial. Error: mostrar el mensaje del 400 | Misma pantalla |
| `Generar base positiva` | `GET /api/pagofacil/base-positiva`. El back devuelve el `.txt` como archivo adjunto. El front descarga el blob | Descarga |
| `Descargar` (fila de base) | **NO EXISTE** endpoint para bases pasadas. Ver §9 | — |
| Campana (topbar) | **NO DEFINIDO** | — |
| Sidebar y usuario | Igual que B11 | Rutas propuestas |

**Descarga de base positiva:** el endpoint exige JWT en el header `Authorization`. Un `<a href>` directo no envía el token. Pedir el archivo como blob con el cliente de `@nexa/api`, leer el nombre de `Content-Disposition` y disparar la descarga desde el blob. Esto requiere que CORS exponga `Content-Disposition` (**verificar**: `Program.cs` no expone headers; sin `WithExposedHeaders` el front no puede leer el nombre del archivo).

## 9. Datos: endpoints y mapeo de campos

| Dato o acción | Método y ruta | Estado | Campo del DTO → UI |
|---|---|---|---|
| Subir rendición | `POST /api/pagofacil/rendiciones` (multipart `archivo`) | Implementado | 201 `RendicionResponse` (ver abajo) |
| Historial de rendiciones | `GET /api/pagofacil/rendiciones` | Implementado | Ver mapeo de historial abajo |
| Base positiva (generar y bajar) | `GET /api/pagofacil/base-positiva` | Implementado | Archivo `text/plain` adjunto. Nombre en `Content-Disposition` (el DTO `ArchivoBasePositiva.NombreArchivo`) |
| Historial de bases generadas | — | **NO EXISTE**. La base no se guarda ni se lista | — |
| Descargar una base pasada | — | **NO EXISTE** | — |
| Cupones incluidos en una base | — | **NO EXISTE** en la respuesta (`ArchivoBasePositiva.CantidadRegistros` no se expone) | — |
| Cupón de una cuota | `GET /api/pagofacil/cuotas/{cuotaId}/cupon` | Implementado. **No aparece en este frame del Figma** | `CodigoBarras` (42 dígitos) y demás campos de `CuponPagoFacilResponse` |

**Mapeo de la tabla `Archivos procesados` (`HistorialRendicionResponse`):**

| Columna | Campo del DTO | Formato |
|---|---|---|
| Archivo | `NombreArchivo` | texto mono |
| Fecha de proceso | `FechaProceso` (UTC) | `dd/mm/aaaa hh:mm`, convertido a hora de Argentina (UTC−3) |
| Líneas | `CantidadRegistros` | entero |
| Pagos generados | `PagosAprobados` | entero |
| Importe total | `ImporteTotal` | `$ 4.318.750,00` |
| Estado | — (no hay campo) | constante `Procesado` (todo archivo del historial está procesado) |

`FechaRendicion` (DateOnly, día de Argentina) no aparece en el Figma; usarlo solo si se quiere mostrar el día.

**Mapeo de `RendicionResponse` (201 de la carga):** `NombreArchivo`, `CantidadRegistros`, `ImporteTotal`, `Procesadas`, `Rechazadas`, `Errores[]` (`Linea`, `Motivo`). Ninguno aparece en el Figma; ver §13, punto 2.

**Mapeo del aviso de duplicado:** el 400 trae el mensaje `El archivo {nombre} ya fue procesado (RN18).` sin fecha. La fecha `27/10/2026 18:05` del Figma sale de `FechaProceso` del historial, no del error (ver §13, punto 3).

**Errores HTTP (`ExceptionMiddleware`):** `BusinessRuleException` → 400 con el mensaje de la excepción. No hay código de error propio. El front no puede distinguir "duplicado" de "tamaño" o "formato" sin comparar el texto: ver §13.

**Contrato propuesto para bases positivas (NO EXISTE hoy), si el Figma necesita la tabla:**

```
POST /api/pagofacil/bases-positivas                 → 201 BasePositivaResponse
GET  /api/pagofacil/bases-positivas                 → 200 BasePositivaResponse[]  (más nuevas primero)
GET  /api/pagofacil/bases-positivas/{id}/archivo    → 200 text/plain adjunto

BasePositivaResponse {
  id: guid,
  nombreArchivo: string,          // "BASEPOS_20261028.txt"
  fechaGeneracion: datetime UTC,  // columna Fecha de generación
  cuponesIncluidos: int           // columna Cupones incluidos
}
```

El Figma dice `Generar base positiva` y el back hoy tiene `GET` que genera y devuelve el archivo sin guardar nada. Decidir si el botón hace `GET` (lo que existe) o `POST` (lo que la tabla necesita).

## 10. Reglas de negocio visibles

- **RN18:** cada archivo de rendición se procesa una sola vez, y se guarda su nombre. El aviso de duplicado lo muestra.
- **RN18 (cupón, spec):** el cupón sigue la especificación de 42 dígitos. No aparece en este frame.
- **Rendición (CU21, RN18, spec §4):** cada línea válida crea un `Pago` con medio `PagoFacil`. Las líneas con error se devuelven en `Errores`.
- **Base positiva (CU22):** contiene todas las deudas todavía pagables, en texto ASCII de ancho fijo. Se entrega a Pago Fácil a mano.
- **Límite de 5 MB** del archivo de rendición (`RendicionService.TamanoMaximoBytes`).

## 11. Responsive

Solo desktop. El Figma no tiene frame móvil del backoffice (1440 px).

**Propuesta, a confirmar:** por debajo de 1280 px, las tablas tienen scroll horizontal dentro de su tarjeta. La dropzone ocupa el ancho disponible.

## 12. Accesibilidad

El Figma no define accesibilidad. Propuesta:
- La dropzone es un `<input type="file">` accesible por teclado. El texto `elegilo desde tu equipo` es un botón o link con foco visible.
- El aviso de duplicado usa `role="alert"` para que lo lea un lector de pantalla.
- Las tablas usan `<table>` con `<th scope="col">`.
- Los botones `Descargar` llevan el nombre del archivo en el texto accesible (ej. `Descargar BASEPOS_20261028.txt`), porque hay varios iguales en la tabla.
- Contraste: el texto terciario `#8a8e93` sobre blanco da aproximadamente 3,3:1. Ver Dudas en B11.

## 13. Dudas e inconsistencias Figma ↔ back

1. **No hay bloque de cupón en B12.** El pedido mencionaba un cupón de una cuota. El frame tiene solo `Rendición diaria` y `Base positiva`. El endpoint del cupón existe (`GET /api/pagofacil/cuotas/{cuotaId}/cupon`), pero no tiene pantalla definida. **NO DEFINIDO.** Decidir: ¿se agrega el cupón a B11 (rail, por cuota), a B12, o a ninguna pantalla de backoffice?
2. **Resultado de la carga por línea no está en el Figma.** `RendicionResponse` trae `Procesadas`, `Rechazadas` y `Errores[]` (línea y motivo). El Figma no muestra qué pasa después de subir. **NO DEFINIDO.** Propuesta: panel de resumen (procesadas, rechazadas) con tabla de `Línea` y `Motivo`. Confirmar.
3. **Aviso de duplicado: fecha.** El Figma dice `ya fue procesado el 27/10/2026 18:05`. El 400 del back no trae fecha. Opciones: (a) mostrar el mensaje del back tal cual, sin fecha; (b) buscar el archivo en el historial y usar `FechaProceso`. Decidir.
4. **Los errores de negocio no tienen código.** Duplicado, tamaño y formato son todos 400 con texto. Si el Figma necesita mensajes distintos por caso, el back debe devolver un código.
5. **Formato `.txt`.** El back no valida la extensión. La validación en el front es la única. Confirmar que el back no va a aceptar otros formatos.
6. **`Generar base positiva` es un `GET`.** Genera y devuelve el archivo sin guardarlo. La tabla `Últimas bases generadas` con `Descargar` **NO EXISTE** en el back. Decidir: (a) quitar la tabla y dejar solo el botón, o (b) agregar el contrato propuesto en §9.
7. **`Cupones incluidos` no se devuelve.** La cantidad solo existe dentro de `ArchivoBasePositiva`. Si se mantiene la tabla, hace falta persistir la base.
8. **Descarga con token.** El `GET` de base positiva necesita JWT. Un link directo no funciona. Ver §8.
9. **CORS y `Content-Disposition`.** Sin `WithExposedHeaders("Content-Disposition")`, el front no puede leer el nombre del archivo descargado. Verificar.
10. **Significado de `Líneas` y `Pagos generados`.** `Líneas` es `CantidadRegistros` y `Pagos generados` es `PagosAprobados`. En el Figma, `192` y `188`: la diferencia equivale a líneas no aprobadas. Confirmar con el equipo que esa es la intención.
11. **Fecha de proceso en UTC.** `FechaProceso` llega en UTC. Convertir a hora de Argentina antes de mostrar.
12. **Estado `Procesado` constante.** No hay campo de estado en el historial. Si el back llega a tener archivos parciales o fallidos, la columna Estado no alcanza. Confirmar.
13. **Sidebar del Empleado.** El Figma muestra `Planes` y `Usuarios` al Empleado (ver B11, punto 14).
14. **Dropzone sin estados de arrastre, carga ni error.** **NO DEFINIDO** (ver §7).
15. **Sin rail ni acción de cupón.** Si la pantalla va a tener cupón, hace falta el diseño (ver punto 1).

## 14. Referencia Figma

- Pantalla: nodo `23:2911`. URL: `https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros?node-id=23-2911`.
- Subnodos útiles: tarjeta rendición `23:3217`, dropzone `23:3220`, aviso de duplicado `23:3228`, tabla de rendiciones `23:3232`, tarjeta base positiva `23:3321`, botón generar `23:3328`, tabla de bases `23:3335`.
