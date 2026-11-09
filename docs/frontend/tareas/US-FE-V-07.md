# US-FE-V-07: Verificación visual contra el Figma: Web pública: mi póliza y pago

V · Ola 7 · Tamaño M · Rama sugerida `feature/US-FE-V-07-verificacion-visual-web-poliza-pago` · Tarjeta Trello `US-FE-V-07`

## 1. Objetivo

Comprobar que las pantallas W3, W4, W5, W6 ya implementadas en la app web pública coinciden con el Figma `Nexa Seguros` y corregir las diferencias que sí son del front. Esta tarea no agrega funcionalidad: cierra las pantallas con evidencia visual (capturas lado a lado) en el PR.

## 2. Alcance

**Entra**
- Comparar cada pantalla del grupo, en desktop y, si el Figma lo define, en móvil (390 px), contra su nodo de Figma.
- Corregir diferencias de tokens, textos, espaciado, tipografía, estados y comportamiento visual dentro de los archivos de las tareas del grupo.
- Registrar en la sección 13 de esta ficha cada diferencia que NO se corrige y el motivo.
- Adjuntar al PR las capturas del Figma y de la app de cada pantalla.

**NO entra**
- Funcionalidad nueva, endpoints nuevos o cambios de contrato con el back.
- Cambiar el Figma o el design system. Si el Figma tiene un error, se registra y se avisa (workflow, "Tareas del front", regla 10).
- Arreglar los fallos de contraste ya registrados en `design-system.md` §9 (decisión FB7: se registran, no se cambian).
- Cambiar datos que vienen del back por valores del Figma (fechas de cuotas, segundo vencimiento, precios: manda el back; ver `pedidos-al-back.md`).

## 3. Dependencias

- **Puede empezar sin esperar a:** nada. Se toma cuando todas las tareas de "Depende de" están mergeadas en `development`.
- **Depende de:** US-FE-W-04, US-FE-W-05, US-FE-W-06, US-FE-W-07, US-FE-W-08.
- **Bloqueada por pedidos al back (PB-NN):** — (los datos que faltan en el back se ven con MSW o "no disponible", y eso se registra como excepción aceptada, no como diferencia).
- **Workaround MSW (FB7.7):** la app corre con `VITE_USE_MOCKS=true`.

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB7 (contrastes registrados, "no disponible", MSW) y FB8.
- `docs/frontend/pantallas/W3-mi-poliza.md` (W3)
- `docs/frontend/pantallas/W4-elegir-medio-pago.md` (W4)
- `docs/frontend/pantallas/W5-cupon-pago-facil.md` (W5)
- `docs/frontend/pantallas/W6-pago-aprobado.md` (W6)
- `docs/frontend/design-system.md`: tokens (§3), componentes (§5) y registro de contrastes (§9).
- Las fichas de las tareas del grupo (W-04, W-05, W-06, W-07, W-08), solo su sección 8 (textos de UI) y su sección 13 (decisiones y excepciones).
- Figma `https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros`. Nodos principales: 18:47 desktop y 18:1772 móvil (W3); W4, W5 y W6 en sus secciones de referencias.

## 5. Archivos a crear o modificar

| Archivo | Dueño |
|---|---|
| Archivos de las tareas del grupo (componentes, páginas, estilos) | Se modifican solo para corregir diferencias visuales; el dueño sigue siendo la tarea original |
| `docs/frontend/tareas/US-FE-V-07.md` (sección 13) | US-FE-V-07 |
| Capturas en el PR (no se commitean al repo) | US-FE-V-07 |

No se crean archivos nuevos de código. No se editan archivos compartidos de otro dueño salvo para una corrección visual mínima; si hace falta más, se avisa y se hace en la tarea dueña (INDEX, Ownership).

## 6. Pasos de implementación

1. Verificar que todas las dependencias de la sección 3 estén mergeadas y actualizar la rama desde `development`.
2. Levantar la app web pública con `VITE_USE_MOCKS=true`.
3. Por cada pantalla del grupo, cargar el contexto de Figma con las herramientas del MCP de Figma: `get_design_context` y `get_screenshot` sobre el nodo de la pantalla (y el móvil si existe). Es una referencia visual, no código para copiar.
4. Capturar la pantalla de la app en el mismo ancho que el nodo (1440 px desktop, 390 px móvil).
5. Comparar lado a lado con la lista de la sección 9 y anotar cada diferencia.
6. Clasificar cada diferencia: corregir (es del front), excepción aceptada (back, contraste registrado, dato no disponible) o error del Figma (avisar al usuario).
7. Corregir las diferencias a corregir, usando tokens del design system y sin valores de diseño sueltos.
8. Repetir 4 a 6 hasta que solo queden excepciones documentadas.
9. Completar la sección 13 con las excepciones y adjuntar las capturas finales al PR.

## 7. Contrato con el back

No aplica: esta tarea no agrega ni cambia endpoints. Los datos son los de MSW o los del back real según cada tarea del grupo.

## 8. Contenido de UI

Los textos son los literales del Figma. Comparar uno por uno con la sección 8 de cada tarea del grupo. Cualquier texto distinto del Figma se corrige, salvo que la ficha original documente una excepción (por ejemplo un texto que viene del back).

## 9. Estados y casos borde

Checklist por pantalla (marcar en el PR):
- Tokens: colores, tipografía (familia, tamaño, peso, interlineado), radios, sombras y espaciados.
- Textos: literales del Figma, mayúsculas/minúsculas, signos, formato de fechas y montos (T-09).
- Layout: anchos, alineaciones, gaps y orden de los elementos.
- Componentes: variante correcta (tamaño, estado, icono Phosphor equivalente).
- Estados: cargando, vacío, error, sin permiso y los que dibuja el Figma (hover, foco, deshabilitado, seleccionado).
- Responsive: desktop 1440 px y móvil 390 px donde el Figma lo defina.
- Accesibilidad básica: foco visible, labels, roles; no empeorar los contrastes ya registrados.

## 10. Tests requeridos

No se agregan tests nuevos de comportamiento. Si una corrección cambia el DOM, se actualizan los tests existentes de la tarea afectada. `npm run lint`, `npm run typecheck`, `npm test` y `npm run build` siguen en verde.

## 11. Criterios de aceptación

1. Cada pantalla del grupo tiene captura del Figma y captura de la app, lado a lado, adjuntas al PR.
2. Cada diferencia detectada está corregida o figura en la sección 13 con su motivo.
3. No quedan valores de diseño sueltos en lo que se tocó (solo tokens).
4. Los textos de UI coinciden con el Figma, salvo excepciones documentadas.
5. No se tocó ningún contrato con el back ni se inventaron campos.
6. `npm run lint`, `npm run typecheck`, `npm test` y `npm run build` en verde, con evidencia.

## 12. Verificación manual

La persona responsable abre la app con MSW, recorre cada pantalla del grupo con el Figma al lado y confirma que se ven iguales (regla 7 de `docs/workflow.md`). Pasos: login (si es backoffice), navegar a cada pantalla, probar los estados de la sección 9 y el ancho móvil si aplica.

## 13. Decisiones pendientes con su default

- **DP-1 Diferencia por dato del back.** Default: manda el back; se documenta como excepción aceptada.
- **DP-2 Diferencia por contraste.** Default: no se cambia (FB7); ya está en `design-system.md` §9.
- **DP-3 Error del Figma.** Default: no inventar; avisar al usuario y corregir el documento en un PR `docs/` aparte.

Decisiones DP-1, DP-2 y DP-3: se aplican los tres defaults, elegidos por Martin el 2026-11-09 (regla 12).

### 13.1 Diferencias corregidas

| Pantalla | Diferencia | Corrección |
|---|---|---|
| W3, W3m | Título, número y badge iban en una sola fila; en el Figma el título va solo y debajo la fila número + badge (gap 8). | Encabezado en columna (W-04). |
| W3 | El contenido tenía 24 px de padding y gap 24; el Figma usa padding 40 y gap 32 (nodo 18:60) y 32 entre columnas. | `md:px-sp-16 md:pt-sp-40 md:pb-sp-40`, `md:gap-sp-32` y `gap-sp-32` en la grilla (W-04). |
| W3, W3m | "Datos de la póliza" iba en tres columnas y la patente y las fechas en Body secundario; el Figma usa dos columnas (gap 32) y Nexa/Mono 13/18. | `md:grid-cols-2` y `font-mono text-mono` (W-04). |
| W3, W3m | "Seleccionar impagas" era un botón Secondary con borde; en el Figma es texto Label sin borde, alineado a la derecha. | `Button` Ghost S alineado al borde (W-04, W-05). |
| W3 | Columnas de la tabla de igual ancho, importe a la izquierda, "Cuota N de M" en Body-sm y vencimiento en primario; el Figma usa 20/160/flex/140/120, importe a la derecha, Body 14/20 y vencimiento Body-sm secundario. | `table-fixed` con `colgroup` y estilos de celda del Figma (W-04). |
| W3, W3m | Casilla nativa de 16 px con `accent-color`; el Figma dibuja un cuadrado de 20 px con borde `border-strong` y, marcado, fondo `action-primary` con check blanco de 14 px. | `CasillaCuota` (input nativo con `appearance-none` y `CheckIcon`), compartida por tabla y lista; en móvil conserva la zona de toque de 44 px (DN-W5-5) (W-04, W-05). |
| W3m | "Cuota N de M" en Body-sm; el Figma usa Body 14/20. | `text-body` (W-05). |
| W3 | "Cuotas seleccionadas" iba apilado (etiqueta arriba, valor abajo); en el Figma es una fila con la etiqueta (Body-sm secundario) a la izquierda y el valor (Body) a la derecha. | `dl` en fila en `ResumenPago` (W-04). |
| W3, W3m | El botón "Descargar cupón Pago Fácil" no tenía el ícono de código de barras. | `BarcodeIcon` de 16 px (Phosphor) (W-04, W-05). |
| W3 | "Ciclo de la póliza" iba en la columna principal y el resumen se estiraba a todo el alto; en el Figma el ciclo va en la columna lateral debajo del resumen (nodo 18:69, gap 24) y las tarjetas se alinean arriba. La ficha W-04 §6 lo ubicaba en la columna izquierda: manda el Figma. | Columna lateral con `ResumenPago` + `CicloPoliza` e `items-start` (W-04). |
| W3, W3m | El ciclo usaba "›" como texto y el párrafo sin estilo; el Figma usa `icon/caret-right` 16 px y Body-sm secundario. | `CaretRightIcon` y `text-body-sm text-text-secondary` (W-04). |
| W4 | Etiqueta "Medio de pago", opciones, "Continuar" y privacidad iban a 12 px; la columna del Figma (nodo 18:1049) usa gap 24. | `gap-sp-24` (W-06). |
| W4 | Las filas del detalle de cuotas iban a 8 y 12 px; la card del Figma (nodo 18:1093) usa gap 16. | `gap-sp-16` en `ResumenPagoOnline` (W-06). |
| W5 | Póliza y DNI del cupón en Body-sm; el Figma los dibuja en Nexa/Mono. | `Fila` con `mono` (W-07). |
| W5 | "Imprimir" era un botón Primary; en el Figma es Secondary (nodo 18:2142). | `variant="secondary"` (W-07). |
| W6 | La tarjeta quedaba centrada en el alto del cuerpo; en el Figma arranca arriba, a 40 px de la nav. | `items-start` en la página (W-08). |

### 13.2 Excepciones aceptadas (no se corrigen)

| Pantalla | Diferencia | Motivo |
|---|---|---|
| W3 a W6 | Póliza, plan, vehículo, vigencia, cuotas, fechas e importes distintos del Figma (MSW: POL-0000001, plan RC, 3 cuotas, $ 12.000,00). | DP-1: manda el back; la app muestra lo que devuelve MSW con el contrato de cada ficha. |
| W3, W3m, W5 | No se muestran "Titular" ni "Tomás Iturralde" / "DNI 30.123.456" en los datos de la póliza ni en el cupón. | DP-1: `ConsultaPublicaResponse` no trae el titular (D-10, PB-07). |
| W3 | No se muestra la nota "Pago Fácil acredita hasta 72 h hábiles (dato de referencia).". | DP-1: DN-W4-8, el dato no tiene fuente en el back. |
| W4 | Ninguna opción viene marcada; el Figma muestra Pasarela A seleccionada. | DN-W6-1 (W4 D13). |
| W4 | La descripción de Pago Fácil no dice "(dato de ejemplo)". | DN-W6-5. |
| W4 | "Incluye el recargo de la cuota N", "Recargo por vencimiento (5%)" y "Total cuota N" solo aparecen si la cuota tiene recargo. | DP-1: dependen de `recargo` del back; con MSW ninguna cuota tiene recargo. |
| W5 | No se muestran "Descargar PDF" ni la ayuda "Pagá en cualquier sucursal… 72 h hábiles.". | DN-W7-2 (no hay endpoint de PDF, PB-11) y DN-W7-3 (el plazo no está en el back). |
| W5 | El segundo vencimiento (fecha e importe) no coincide con el Figma. | DP-1: viene del DTO (D-05, PB-21). |
| W6 | No se muestran "Total pagado", la fila "Cuotas" con su badge, el subtítulo con cuotas ni "Descargar comprobante". | DN-W8-2, DN-W8-3 y D-06: el back no expone esos datos ni el comprobante. |
| W6 | La nota "La factura está en proceso…" solo aparece con factura `PENDIENTE_CAE` y sin la segunda frase. | DN-W8-5 y DN-W8-6. |
| W3, W3m | El valor de `Dato` (`@nexa/ui`) va en Body-sm 13/18; el Figma usa Body 14/20 en los valores de "Datos de la póliza". | Es una diferencia del front, pero `Dato` es de T-07 (estilo propuesto D-T07-1) y cambiarlo afecta al backoffice. Se avisa y se corrige en la tarea dueña. |
| W3, W4 | En el Figma la nav de W3 y W4 arranca pegada al borde superior del Shell y en W5 y W6 a 24 px; el pie de W3 ocupa todo el ancho del Shell y en W4 a W6 va con margen de 24 px. | DP-3: los frames del Figma no coinciden entre sí. La app usa el marco de V-06 (24 px arriba y pie con margen). Se registra en `pantallas/W3-mi-poliza.md` §13 y `pantallas/W4-elegir-medio-pago.md` §13 en un PR `docs/` aparte. |
| W3m | El Figma usa margen de 12 px, barra superior de 60 px, contenido con padding 20 y "Pie de contacto" con fondo `surface-subtle`. | D-26 y DN-W5-3: la app mantiene el marco móvil de T-18 (16 px, nav de 72 px y `PublicFooter` apilado); la inconsistencia entre W2m y W3m ya está registrada en V-06. |
| W4 | El cuerpo del Figma usa gap 80 entre columnas y padding superior 56. | DP-3: 80 y 56 no están en la escala de espaciado (máximo `spacing/64`). La app usa `gap-sp-64` y `py-sp-48`. Se registra en `pantallas/W4-elegir-medio-pago.md` §13. |
| W5 | El título "Cupón de pago" va fuera de la tarjeta y centrado; en el Figma va dentro, debajo del logo. | DP-3: el Figma dibuja un solo cupón y la app muestra uno por cuota (D-04); con varias tarjetas el `h1` queda una sola vez afuera. Se registra en `pantallas/W5-cupon-pago-facil.md` §13. |
| W4, W5, W6 móvil | No hay frame móvil en el Figma. | Se verificó la propuesta de cada ficha de pantalla: una columna, sin scroll horizontal. |
| Todas | Contrastes ya registrados en `design-system.md` §9. | DP-2 (FB7): no se cambian; no apareció ninguno nuevo. |

## 14. Riesgos y errores comunes

- Copiar el código que devuelve `get_design_context`: es referencia, se adapta al proyecto y a sus componentes.
- "Arreglar" una fecha o un precio al valor del Figma cuando el back manda otro.
- Corregir un archivo de otro dueño más allá de lo mínimo.
- Comparar solo desktop y olvidar el móvil.
- Dar por buena la pantalla sin abrirla: sin capturas no hay verificación.

## 15. Definición de terminado

Criterios de la sección 11 tildados con evidencia observada, capturas en el PR, lint/typecheck/test/build en verde, sin secretos. Accesibilidad: no empeorada.

## 16. Observaciones al índice

- Tarea agregada tras el cierre de la planificación original (verificación visual por grupo de pantallas). Corre en la Ola 7, después de todas las tareas del grupo.
