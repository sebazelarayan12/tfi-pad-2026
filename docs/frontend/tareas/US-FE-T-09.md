# US-FE-T-09: @nexa/api: formateadores

T · Ola 0 · Tamaño S · Rama sugerida `feature/US-FE-T-09-formateadores` · Tarjeta Trello `US-FE-T-09`

## 1. Objetivo

Queda un único módulo de formateo en `@nexa/api` para importes en pesos, fechas `DateOnly` y `DateTime`, y DNI. Todas las pantallas lo usan (FC9, FB4). Ningún componente formatea a mano ni llama a `toLocaleString`. Destinatarios: features de backoffice y web pública, y `packages/ui`.

## 2. Alcance

**Entra**
- `frontend/packages/api/src/format/constantes.ts`: `TEXTO_SIN_DATO` y `ZONA_ARGENTINA`.
- `frontend/packages/api/src/format/importe.ts`: `formatearImporte`.
- `frontend/packages/api/src/format/fecha.ts`: `formatearFechaCalendario`, `parsearFechaUtc`, `formatearFechaHora`.
- `frontend/packages/api/src/format/dni.ts`: `formatearDni`, `quitarFormatoDni`.
- `frontend/packages/api/src/format/index.ts` y su bloque en `frontend/packages/api/src/index.ts`.
- Tests en `frontend/packages/api/test/format/`.

**NO entra**
- Mapas de enums y traducción de mensajes: US-FE-T-10.
- Cliente HTTP, DTO y barrel base: US-FE-T-08 y US-FE-T-12.
- Schemas zod de cada feature (DNI, importes): cada feature llama a `quitarFormatoDni` al normalizar; no se define acá.
- Máscaras de input para DNI o importe (no definidas en Figma).

## 3. Dependencias

- **Puede empezar sin esperar a:** Nada.
- **Depende de:** — (rebase sobre T-01 y T-02, RV-D02).
- **Bloqueada por pedidos al back (PB-NN):** —.
- **Workaround MSW (FB7.7):** no aplica. PB-16 (`DateTime` sin `Z`) se resuelve en el front con FB7.4; no bloquea.

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB4 (fechas, plata, un solo formateador) y FB7.4 (zona horaria y UTC).
- `docs/frontend/contratos-api/convenciones-transversales.md` §5.3 (fechas `DateOnly` y `DateTime`) y §5.4 (dinero).
- `docs/frontend/analisis-front.md` §7.3 (formato de datos).
- `docs/frontend/pedidos-al-back.md` PB-16 (solo la ficha, para entender el origen del problema).
- `docs/frontend/pantallas/B3-clientes.md` §5 (columna DNI) y §13 D-10 (DNI con puntos en pantalla, sin puntos al enviar).
- `docs/frontend/tareas/INDEX.md`, sección Ownership: `packages/api/src/format/*` es de US-FE-T-09.

## 5. Archivos a crear o modificar

| Archivo | Dueño |
|---|---|
| `frontend/packages/api/src/format/constantes.ts`, `importe.ts` (incluye `parseImporteEsAR`, RV-26), `fecha.ts`, `dni.ts`, `index.ts` | US-FE-T-09 |
| `frontend/packages/api/src/index.ts` (agregar bloque `export * from './format'`) | US-FE-T-12 (barrel); T-09 agrega su bloque y se rebasa |
| `frontend/packages/api/test/format/importe.test.ts`, `fecha.test.ts`, `dni.test.ts` | US-FE-T-09 |

## 6. Pasos de implementación

1. `constantes.ts`: `export const TEXTO_SIN_DATO = '—'` (U+2014) y `export const ZONA_ARGENTINA = 'America/Argentina/Buenos_Aires'`.
2. `importe.ts`: crear una sola instancia `new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })` a nivel de módulo. Si el valor no es un `number` finito, devolver `TEXTO_SIN_DATO`. No sumar ni redondear antes de formatear (convenciones §5.4).
3. `fecha.ts`, `formatearFechaCalendario(valor)`: aceptar solo `^\d{4}-\d{2}-\d{2}$`. Validar que la fecha exista con `Date.UTC(anio, mes - 1, dia)` y comparar el round-trip. Armar `dd/mm/aaaa` cortando el string. No usar `new Date(string)`.
4. `fecha.ts`, `parsearFechaUtc(valor)`: (a) si el texto no termina en `Z` ni tiene offset `[+-]\d{2}:\d{2}` o `[+-]\d{4}`, agregar `Z`; (b) recortar la fracción de segundos a 3 dígitos con `/\.(\d{3})\d+/` → `.$1`; (c) `Date.parse`. Si es `NaN`, devolver `null`.
5. `fecha.ts`, `formatearFechaHora(valor)`: usar `parsearFechaUtc`; si es `null`, devolver `TEXTO_SIN_DATO`. Si no, `new Intl.DateTimeFormat('es-AR', { timeZone: ZONA_ARGENTINA, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })` y armar `dd/mm/aaaa HH:mm` con `formatToParts`. No usar la salida por defecto de `es-AR`: con `hour12` o sin `hourCycle` produce "a. m." o agrega coma.
6. `dni.ts`: `quitarFormatoDni(valor)` hace `trim` y quita puntos y espacios. `formatearDni(valor)`: si `null` o `undefined`, `TEXTO_SIN_DATO`; si el resultado sin formato cumple `^\d{8}$`, devolver `NN.NNN.NNN`; si no, devolver el valor recibido sin cambios.
7. `format/index.ts` reexporta los cuatro archivos. Agregar el bloque en `packages/api/src/index.ts`.
8. Escribir los tests de §10 (un archivo por módulo).
9. Verificar con `rg` que fuera de `packages/api/src/format/` no hay `toLocaleString` ni `Intl.DateTimeFormat` en el código del front.

## 7. Contrato con el back

No aplica: la tarea no hace requests. Trabaja con los valores que devuelve el back: `decimal` como `number` (convenciones §5.4), `DateOnly` como `string` `yyyy-MM-dd`, `DateTime` y `DateTimeOffset` como `string` ISO 8601 (convenciones §5.3) y DNI como `string` de 8 dígitos (seguridad §4.1).

Firmas públicas:

```ts
export const TEXTO_SIN_DATO = '—';
export function formatearImporte(valor: number | null | undefined): string;
export function formatearFechaCalendario(valor: string | null | undefined): string;
export function parsearFechaUtc(valor: string | null | undefined): Date | null;
export function formatearFechaHora(valor: string | null | undefined): string;
export function quitarFormatoDni(valor: string): string;
export function formatearDni(valor: string | null | undefined): string;
```

## 8. Contenido de UI

Salidas literales (verificadas en Node 22 con ICU completo):

| Entrada | Salida |
|---|---|
| `25000` | `$ 25.000,00` (el espacio es U+00A0) |
| `-1500.25` | `-$ 1.500,25` |
| `12000.5` | `$ 12.000,50` |
| `0` | `$ 0,00` |
| `"2026-11-10"` (DateOnly) | `10/11/2026` |
| `"2026-11-01T12:00:00Z"` | `01/11/2026 09:00` |
| `"2026-11-01T02:30:00"` (sin Z, se trata como UTC) | `31/10/2026 23:30` |
| `"2026-11-01T12:00:00.1234567"` | `01/11/2026 09:00` |
| `"2026-11-01T12:00:00+00:00"` | `01/11/2026 09:00` |
| `"30512468"` | `30.512.468` |
| `"30.512.468"` (con `quitarFormatoDni`) | `30512468` |

Los importes del Figma (`$ 25.000,00`, `$ 18.900,00`) son de muestra (FC4). Esta tarea no los hardcodea.

## 9. Estados y casos borde

- `null`, `undefined`, `NaN`, `Infinity` en importes: `—`.
- Importe `0`: `$ 0,00`. Negativos: `-$ 1.500,25`.
- DateOnly vacía, con formato distinto (`10/11/2026`) o fecha inexistente (`2026-02-30`): `—`.
- DateTime `null`, vacía o no parseable: `—`.
- DateTime sin offset: se interpreta como UTC, nunca como hora local del navegador.
- DNI con 7 o 9 dígitos, letras o vacío: `formatearDni` devuelve el valor sin cambios; `quitarFormatoDni` solo quita puntos y espacios.

## 10. Tests requeridos

Vitest, sin DOM (no aplica Testing Library).

- `test/format/importe.test.ts`
  - "formatea 25000 como `$ 25.000,00` con U+00A0": compara `charCodeAt` de cada posición, no un regex con espacio normal.
  - "formatea -1500.25 como `-$ 1.500,25`".
  - "muestra dos decimales fijos: 12000.5 da `$ 12.000,50`".
  - "devuelve `—` para `null`, `undefined` y `NaN`".
- `test/format/fecha.test.ts`
  - "DateOnly `2026-11-10` se muestra `10/11/2026` (sin cambio de día)".
  - "DateOnly `2026-02-30` y formato `10/11/2026` devuelven `—`".
  - "DateTime `2026-11-01T12:00:00Z` se muestra `01/11/2026 09:00`".
  - "DateTime sin Z `2026-11-01T02:30:00` se muestra `31/10/2026 23:30`".
  - "DateTime con 7 dígitos de fracción no es `Invalid Date`".
  - "DateTimeOffset con `+00:00` da el mismo resultado que con `Z`".
  - "el resultado no depende de la zona del proceso": la suite se ejecuta dos veces, con `TZ=UTC` y con `TZ=America/Argentina/Buenos_Aires` (script de `test` del package o dos corridas de CI).
- `test/format/dni.test.ts`
  - "formatea `30512468` como `30.512.468`".
  - "`quitarFormatoDni(' 30.512.468 ')` devuelve `30512468`".
  - "`formatearDni` con 7 dígitos devuelve el valor sin cambios".
  - "`formatearDni(null)` devuelve `—`".

## 11. Criterios de aceptación

1. `formatearImporte(25000)` devuelve exactamente `$ 25.000,00` con U+00A0 entre el símbolo y el número.
2. `formatearImporte` devuelve `—` para `null`, `undefined` y `NaN`.
3. `formatearFechaCalendario('2026-11-10')` devuelve `10/11/2026` en ambas corridas de TZ (UTC y Buenos Aires).
4. `formatearFechaCalendario` no crea objetos `Date` a partir del string (revisión del código y test de `2026-02-30`).
5. `formatearFechaHora('2026-11-01T02:30:00')` devuelve `31/10/2026 23:30`.
6. Una fecha con 7 dígitos de fracción no produce `Invalid Date`.
7. `formatearDni('30512468')` devuelve `30.512.468` y `quitarFormatoDni('30.512.468')` devuelve `30512468`.
8. Todas las funciones se exportan desde `@nexa/api` (barrel).
9. Fuera de `packages/api/src/format/` no hay `toLocaleString` ni `Intl.DateTimeFormat` en el código del front (`rg` sin resultados).
10. `npm run lint`, `npm run typecheck`, `npm run test` del package en verde, con evidencia de la salida.

## 12. Verificación manual

Sin prueba manual: el módulo no tiene UI. Se verifica con los tests de §10 y con la búsqueda de §6, paso 9.

## 13. Decisiones pendientes

- **DP-1 Dato faltante.** Default: `—` (U+2014). Alternativa: cadena vacía. Tradeoff: `—` marca el hueco en tablas; vacío lo oculta y el usuario no distingue "no hay dato" de "no cargado".
- **DP-2 Símbolo de moneda.** Default: `$` de `Intl` (como el Figma: `$ 25.000,00`). Alternativa: "ARS" explícito. Cambia solo el literal.
- **DP-3 Ubicación del formateador de DNI.** Default: `@nexa/api` (FC9 y ownership de T-09). B3 D-10 menciona `@nexa/ui`. Alternativa: re-exportarlo desde `@nexa/ui`. No bloquea.
- **DP-4 DNI que no tiene 8 dígitos.** Default: se muestra sin cambios. Alternativa: `—`. Tradeoff: sin cambios muestra el dato crudo que llegó.

## 14. Riesgos y errores comunes

- `new Date('2026-11-01')` es medianoche UTC; en Argentina (UTC-3) el día mostrado queda uno antes (convenciones §5.3). Por eso no se usa `Date` para DateOnly.
- `new Date('2026-11-01T02:30:00')` sin `Z` se interpreta en la zona local del proceso (verificado: el resultado depende de la máquina). Por eso se agrega `Z` antes de parsear.
- La salida por defecto de `es-AR` con fecha y hora usa coma y "a. m." según opciones. Usar `hourCycle: 'h23'` y `formatToParts`.
- El espacio entre `$` y el número es U+00A0. Un test que compare con espacio normal falla sin motivo visible.
- `Intl` redondea a 2 decimales con mitad hacia afuera de cero, igual que el back (`AwayFromZero`). No sumar antes de formatear.
- Dos instancias de `Intl.NumberFormat` por render degradan performance; una sola a nivel de módulo.

## 15. Definición de terminado

`npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` en verde en el workspace. Criterios de §11 tildados con evidencia observada. Sin secretos. Accesibilidad: no aplica (sin UI).

## 16. Observaciones al índice

- Resuelto (triage final, default de la ficha): `packages/api/src/index.ts` pertenece a US-FE-T-12. T-09 agrega su bloque, así que se mergea después de T-12 o rebasa sobre él (regla de barrels de INDEX, Ownership). No cambia la ola. (No figura en REVISION ni en FB8: RV-14 solo cubre a T-08 y a las API cards.)
- Resuelto (RV-59): el formateo de DNI lo hace `@nexa/api` (FC9 y fila de T-09 del INDEX). La corrección de B3 D-10 va en el PR de documentación aparte.

## 17. Evidencia de implementación y verificación (2026-11-03)

Se aplican los defaults de DP-1 a DP-4 sin declararlos acuerdos nuevos del equipo: `—` para dato faltante, símbolo `$` de ARS, DNI en `@nexa/api` y conservación del DNI inválido sin cambios.

`parseImporteEsAR` (RV-26) se exporta desde el barrel con firma `(valor: string | null | undefined): number | null`. Acepta dígitos con agrupación de miles es-AR opcional, coma con uno o dos decimales y signo negativo. También acepta la salida monetaria del formateador (`$` y U+00A0). Devuelve `null` para entrada vacía, formato incorrecto o resultado no finito; no convierte el vacío en cero ni calcula totales. La validación de prima positiva corresponde al schema de la feature.

### Criterios verificados

| Criterio de §11 | Evidencia observada |
| --- | --- |
| 1 | `importe.test.ts`: igualdad exacta y códigos de caracteres para `$\u00a025.000,00`. |
| 2 | Tests de importes para null, undefined, NaN e infinitos. |
| 3 | DateOnly `2026-11-10` devuelve `10/11/2026` en las dos corridas de TZ. |
| 4 | Revisión de `fecha.ts`: `Date.UTC` con componentes numéricos y round-trip; sin constructor Date desde string. Tests de fechas inexistentes, bisiestos y límites de año. |
| 5 | DateTime sin Z `2026-11-01T02:30:00` devuelve `31/10/2026 23:30` en ambas TZ. |
| 6 | Tests de siete dígitos de fracción, con y sin Z, y verificación de milisegundos conservados. |
| 7 | `dni.test.ts`: `30512468` ↔ `30.512.468`, ceros iniciales y entradas inválidas. |
| 8 | Los tres archivos de tests importan las funciones y constantes desde `@nexa/api`. |
| 9 | Búsqueda con `rg` en código de apps y packages, excluyendo format, node_modules y dist: sin `toLocaleString` ni `Intl.DateTimeFormat` fuera del módulo. |
| 10 | Lint, typecheck y test en verde; comandos y resultados debajo. |

### Comandos ejecutados desde frontend/

- `npm run lint`: correcto.
- `npm run typecheck`: correcto en todos los workspaces.
- `npm run test`: 179 tests aprobados (api: 92; config: 17; ui: 70). Las apps aún no tienen tests. El entorno jsdom de los tests existentes de UI informa su limitación de canvas, sin fallos.
- `npm run build`: ambas apps compiladas correctamente.
- `npx --no-install prettier --check packages/api/src/format packages/api/test/format packages/api/src/index.ts`: correcto.
- `npx -y react-doctor@latest . --yes --verbose`: **100/100**, 23 archivos escaneados y ningún problema.

Corridas adicionales del paquete en procesos separados de PowerShell:

```powershell
$env:TZ='UTC'
npm run test --workspace=@nexa/api
# 3 archivos, 92 tests aprobados.

$env:TZ='America/Argentina/Buenos_Aires'
npm run test --workspace=@nexa/api
# 3 archivos, 92 tests aprobados; mismas salidas literales.
```

Entorno local observado: Node v26.5.0 y npm 11.17.0. Los tests y build se ejecutaron fuera del sandbox porque este impide renombrar archivos temporales de Vite. No se modifican manifiestos ni lockfile.

Sin prueba manual: módulo sin UI, según §12. Verificación con tests, revisión de código y búsqueda de formatos duplicados. CI y revisiones del PR quedan pendientes hasta su publicación por la persona responsable.
