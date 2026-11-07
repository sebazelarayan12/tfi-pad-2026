# US-FE-B-11: Cotizar: línea de cálculo y rail

Tipo: B · Oleada: 5 · Tamaño: S · Rama sugerida: `feature/US-FE-B-11-cotizar-calculo-rail` · Tarjeta Trello: `US-FE-B-11`

## 1. Objetivo

En la pantalla de cotizar (B-10) cada plan muestra la línea de cálculo `primaBase x factores` y la columna derecha muestra el widget **Datos de la cotización** con cliente, vehículo, tipo, uso y, si el back los devuelve, antigüedad y conductor. Mientras el back no publique el desglose (PB-10), la línea no se muestra y el rail usa solo los datos disponibles. La prima mensual siempre es la que devuelve el back; el front no la recalcula.

## 2. Alcance

**Entra**
- Línea de cálculo bajo el nombre de cada plan, solo si la opción trae `calculo` (PB-10).
- Widget "Datos de la cotización" (`CardWidget` de T-07) en el slot `aside` que B-10 dejó vacío.
- Filas del widget y su versión sin factores (cuando no hay `calculo`).
- Tipos locales para `calculo`, mientras T-26 no lo incluya.
- Tests de la línea y del rail.

**No entra**
- Cálculo de factores o de antigüedad/edad en el front (D-B7-02, opción (b) rechazada: duplica RN06).
- Link "Cambiar datos" (D-B7-08: se omite).
- CTA "Continuar a emisión" y botón Cotizar (B-10).
- Pedido a T-26 para agregar `calculo` al DTO (ver §16).

## 3. Dependencias

- **Oleada:** 5.
- **Depende de:** US-FE-B-10, US-FE-T-07, US-FE-T-09, US-FE-T-10, US-FE-T-11, US-FE-T-19, US-FE-T-26.
- **Puede empezar sin esperar a:** US-FE-B-12 (emisión; sin relación de datos).
- **Bloqueada por pedidos al back:** PB-10 (bloquea la línea de cálculo; MSW y degrada).

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB3 (estructura del feature), FB4 (importes y enums), FB7.11 (datos faltantes).
- `docs/frontend/tareas/INDEX.md`: fila `US-FE-B-11`; FC9 (formateadores y enums), FC16; decisión D-29.
- `docs/frontend/pantallas/B7-cotizar.md`: §3 (rail: estructura y filas), §5 (textos del rail y de la línea de cálculo), §6 (formato de salida: importe y cálculo de la línea), §9 (origen de cada dato del rail y la línea), §10 (RN06: orden de factores), §12 (accesibilidad del rail). §13: D-B7-02 (factores), D-B7-08 (cambiar datos), D-B7-14 (enums).
- `docs/frontend/contratos-api/vehiculos-planes-cotizaciones.md`: §5.2 (fórmula de prima y orden de factores), §6.1 (`OpcionCotizacion`).
- `docs/frontend/design-system.md`: §5.13 (Card/Widget), §3.1 y §3.5 solo si hace falta el token del fondo.
- `docs/frontend/pedidos-al-back.md`: PB-10 (contrato mínimo propuesto).

## 5. Archivos a crear o modificar

Todos bajo `frontend/apps/backoffice/src/features/cotizaciones/` (dueño: B-10).

| Archivo | Acción |
|---|---|
| `components/LineaCalculo.tsx` | Crea. Muestra `primaBase x factorTipo x factorAntiguedad x factorEdad x factorUso`; no renders si no hay `calculo` |
| `components/DatosCotizacionWidget.tsx` | Crea. `CardWidget` con las filas del rail |
| `components/formatoCalculo.ts` | Crea. Funciones puras para los textos de factores (usa el formateador numérico de T-09) |
| `types/calculo.ts` | Crea. `CalculoPrima` y `OpcionConCalculo` (ver §7) |
| `pages/NuevaCotizacionPage.tsx` | Modifica (dueño B-10): llena el slot `aside` con `DatosCotizacionWidget` |
| `components/PlanOpcionCard.tsx` | Modifica (dueño B-10): agrega `LineaCalculo` debajo del nombre |
| `**/*.test.tsx` y `**/*.test.ts` | Crea |

Compartidos sin editar: `packages/api/src/dto/cotizaciones.ts` (dueño T-26). Si T-26 agrega `calculo`, `types/calculo.ts` se borra y se usa el tipo de `@nexa/api`.

## 6. Pasos de implementación

1. Leer B-10 completa (§5 de su archivo) para conocer el slot `aside` y `PlanOpcionCard`.
2. **RED:** escribir los tests de §10 con `calculo` presente y ausente.
3. `formatoCalculo.ts`: funciones puras:
   - `formatoLinea(calculo)` → `10.000,00 x 1,00 x 1,10 x 1,00 x 1,00` (importes con separador de miles y dos decimales; factores con dos decimales y coma).
   - `formatoFactor(n)` → `1,10`.
   La función usa el formateador de T-09. No se escribe el formato a mano (FC9).
4. `LineaCalculo`: recibe `calculo?: CalculoPrima`. Si es `undefined`, devuelve `null` (no hay nodo vacío). Si existe, muestra la línea en mono 13 px (DS §2.2) con el texto literal de la fórmula.
5. `PlanOpcionCard` (de B-10): agrega `<LineaCalculo calculo={opcion.calculo} />` debajo de la línea de nombre. No cambia el `aria-label` del radio.
6. `DatosCotizacionWidget` (`CardWidget` de T-07, título `Datos de la cotización`):
   - Siempre: `Cliente` (nombre y apellido), `Vehículo` (marca, modelo y año; patente en mono debajo), `Tipo` (etiqueta del enum de T-10), `Uso` (etiqueta del enum de T-10).
   - Solo si hay `calculo`: `Tipo` agrega el factor entre paréntesis, `Uso` agrega su factor, y aparecen las filas `Antigüedad` y `Conductor` con su factor (DP-B11-02).
   - Sin link "Cambiar datos".
7. `NuevaCotizacionPage`: pasa a `DatosCotizacionWidget` el vehículo, el cliente y las opciones (de la mutación de B-10) y lo monta en `aside`.
8. Regla de integridad: `primaMensual` se muestra siempre desde `opciones[].primaMensual`. Nunca se recalcula a partir de `calculo`, aunque el producto no coincida (RN06, FB4).
9. Tipos locales: `types/calculo.ts`:
   ```ts
   export interface CalculoPrima {
     primaBase: number;
     factorTipo: number;
     factorAntiguedad: number;
     factorEdad: number;
     factorUso: number;
   }
   export type OpcionConCalculo = OpcionCotizacion & { calculo?: CalculoPrima | null };
   ```
   `CalculoPrima` sigue la propuesta de PB-10. Cuando el contrato real lo publique y `@nexa/api` lo exponga, se revisa el tipo local.
10. GREEN, luego refactor. `lint`, `typecheck`, `test` y `build` del backoffice.

## 7. Contrato con el back

| Método y ruta | Estado | Uso |
|---|---|---|
| `POST /api/cotizaciones` | Implementado (PR #49) | Sin campo `calculo` hoy. El desglose llega con PB-10. |

Contrato mínimo propuesto por PB-10 (pendiente, no publicado):

```ts
interface OpcionCotizacion {
  idCotizacion: string; codigoPlan: string; plan: string; primaMensual: number;
  calculo: { primaBase: number; factorTipo: number; factorAntiguedad: number; factorEdad: number; factorUso: number; };
}
```

La API publicada todavía no devuelve `calculo`. El mock de T-26 ya lo incluye para simular PB-10. B-11 valida el desglose antes de usarlo. Las pruebas simulan también la respuesta real sin el campo y los casos nulo e inválido.

Fórmula del orden de factores (RN06, `vehiculos-planes-cotizaciones.md §5.2`): `primaBase × tipo × antigüedad × edad × uso`. Se muestra en ese orden.

## 8. Contenido de UI (literal)

| Zona | Texto |
|---|---|
| Línea de cálculo | `{primaBase} x {factorTipo} x {factorAntiguedad} x {factorEdad} x {factorUso}` (ejemplo del Figma: `10.000,00 x 1,00 x 1,10 x 1,00 x 1,00`) |
| Título del widget | `Datos de la cotización` |
| Etiquetas | `Cliente`, `Vehículo`, `Tipo`, `Antigüedad`, `Conductor`, `Uso` |
| Valor cliente | `{nombre} {apellido}` |
| Valor vehículo | `{marca} {modelo} {anio}`; `{patente}` en mono debajo |
| Valor tipo | Etiqueta de T-10. Con `calculo`: `{etiqueta} ({factorTipo})` |
| Valor uso | Etiqueta de T-10. Con `calculo`: `{etiqueta} ({factorUso})` |
| Valor antigüedad (con `calculo`) | `({factorAntiguedad})` (DP-B11-02) |
| Valor conductor (con `calculo`) | `({factorEdad})` (DP-B11-02) |

Los números de factor usan el mismo formato que la línea (`1,10`). Ningún texto del Figma con datos de ejemplo se copia como fijo (`Tomás Iturralde`, `AC456FG`, `Auto (1,00)`), salvo la estructura.

## 9. Estados y casos borde

| Caso | Comportamiento |
|---|---|
| Opción sin `calculo` (estado actual) | No hay línea. El rail muestra Cliente, Vehículo, Tipo sin factor y Uso sin factor. |
| Opción con `calculo` | Línea visible; rail con factores; filas Antigüedad y Conductor visibles. |
| `calculo` con un factor no numérico | No se muestra la línea (se trata como ausente). Sin error visible. |
| `calculo` que no coincide con `primaMensual` | Se muestran ambos tal cual. No se corrige ni se recalcula. |
| Sin cotización todavía (antes de Cotizar) | El rail muestra solo cliente y vehículo, sin tipo ni uso de la cotización. Sin request. |
| Cambio de selección | Cada línea pertenece a su opción. El rail usa el desglose de la opción elegida y, antes de elegir, el primer desglose válido de la respuesta. |
| Error de carga del vehículo o cliente | El rail muestra el dato como "No disponible" (FB7.11, DP-B11-03). |

## 10. Tests requeridos

| Test | Afirma | Herramienta |
|---|---|---|
| `formatoLinea: formatea 10000, 1, 1.1, 1, 1` | `10.000,00 x 1,00 x 1,10 x 1,00 x 1,00` | Vitest |
| `formatoFactor: 1.1 → "1,10"` | Coma decimal y dos decimales | Vitest |
| `LineaCalculo: sin calculo no renderiza nada` | Sin nodo ni texto "x" | Testing Library |
| `LineaCalculo: con calculo muestra la fórmula en orden` | Texto exacto | Testing Library |
| `opción: primaMensual viene del back aunque calculo no coincida` | Muestra `primaMensual` y no el producto | Testing Library |
| `rail: sin calculo muestra filas sin factores y sin Antigüedad ni Conductor` | Filas exactas | Testing Library + MSW |
| `rail: con calculo muestra factores entre paréntesis` | `Auto (1,00)`, `(1,10)`, `Particular (1,00)` | Testing Library + MSW |
| `rail: no aparece "Cambiar datos"` | Ausencia del link | Testing Library |
| `rail: vehículo muestra patente en mono` | Clase `font-mono` en la patente | Testing Library |
| `rail: error de cliente muestra No disponible` | Texto sin inventar nombre | Testing Library + MSW |
| `a11y: el widget es una sección con título` | `h3` o `region` con nombre | Testing Library |
| `a11y: sin violaciones con calculo presente` | Axe sin violaciones | vitest-axe (T-19) |

## 11. Criterios de aceptación

1. Con una opción sin `calculo` no aparece ninguna línea de cálculo ni texto con "x".
2. Con `calculo` presente, la línea muestra `primaBase`, `factorTipo`, `factorAntiguedad`, `factorEdad` y `factorUso` en ese orden, con formato es-AR.
3. El rail se titula `Datos de la cotización` y está en el slot `aside`.
4. Sin `calculo`, el rail muestra Cliente, Vehículo, Tipo y Uso, sin factores, y no muestra Antigüedad ni Conductor.
5. Con `calculo`, el rail muestra factores entre paréntesis y las filas Antigüedad y Conductor.
6. La prima mostrada es siempre `opciones[].primaMensual`; el front no la recalcula.
7. No aparece el link "Cambiar datos".
8. Los tipos y uso se muestran con etiquetas de T-10, nunca con números crudos.
9. Un error al cargar cliente o vehículo muestra "No disponible" en el rail.
10. Todos los tests de §10 están en verde, sin axe violations.
11. `lint`, `typecheck`, `test` y `build` del backoffice están en verde.

## 12. Verificación manual

Verificación local con MSW antes de abrir el PR (regla 7 del workflow). PB-10 sigue pendiente en la API real.
1. Con `VITE_USE_MOCKS=true`, abrir la cotización de un vehículo del fixture. Antes de cotizar, verificar Cliente y Vehículo. Al cotizar, comprobar las líneas de cada opción y los factores del rail.
2. Simular la respuesta publicada sin `calculo`. Verificar que la prima mensual permanece visible, la línea desaparece y el rail muestra Cliente, Vehículo, Tipo y Uso sin factores.

## 13. Decisiones confirmadas

- **DP-B11-01** Línea de cálculo sin `calculo`. Confirmado: no se muestra (índice, B-11).
- **DP-B11-02** Antigüedad en años (`9 años`) y edad del conductor (`35 años`) del Figma. El front no conoce el año de referencia del servidor ni la edad a la fecha de cotización; calcularlo duplica RN06. Confirmado: mostrar solo el factor. Pedido: que PB-10 agregue `antiguedadAnios` y `edadConductor` al `calculo`.
- **DP-B11-03** Texto de dato no disponible en el rail. Confirmado: `No disponible` (FB7.11).
- **D-B7-02**: el front no calcula factores (opción (a) de B7, PB-10). Se resuelve en el back.
- **D-B7-14** (enums): se resuelve con el mapa de T-10 (D-29).
- **D-B7-13** (edad a la fecha de hoy o de alta): sin cálculo en el front, no aplica por ahora.

## 14. Riesgos y errores comunes

- Recalcular `primaMensual` con `calculo` y mostrar el resultado: rompe RN06 y FB4.
- Calcular la antigüedad con `new Date().getFullYear()`: el back usa el reloj UTC (`vehiculos-planes-cotizaciones.md §5.2`). Por eso no se calcula en el front (DP-B11-02).
- Formatear a mano con `toFixed(2)`: viola FC9. Usar el formateador de T-09.
- Mostrar el factor con punto decimal. Debe ser coma (`1,10`).
- Dejar un nodo vacío cuando no hay `calculo`: el `LineaCalculo` devuelve `null`.
- Importar el `CardWidget` desde un path interno de `@nexa/ui`: usar el export público.

## 15. Definición de terminado

- `lint`, `typecheck`, `test` y `build` en verde.
- Todos los criterios de §11 tildados con evidencia observada.
- Accesibilidad revisada con T-19.
- Sin cambios en `packages/api` ni en `features/cotizaciones` fuera de los archivos de §5.

## 16. Observaciones al índice

- Resuelto (RV-04): la fila de B-11 declara también T-07, T-09 y T-10 (CardWidget, formato numérico y etiquetas de tipo y uso).
- Resuelto (RV-34): el CTA "Emitir" lo implementa B-10; B-11 no lo incluye.
- ABIERTO (PB-10): el DTO del mock de T-26 ya incluye `calculo`. Hasta que se publique en la API real, B-11 usa el tipo local de `types/calculo.ts` y valida el campo opcional de la respuesta.
