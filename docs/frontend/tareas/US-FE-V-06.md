# US-FE-V-06: Verificación visual contra el Figma: Web pública: inicio y consulta

V · Ola 7 · Tamaño S · Rama sugerida `feature/US-FE-V-06-verificacion-visual-web-inicio-consulta` · Tarjeta Trello `US-FE-V-06`

## 1. Objetivo

Comprobar que las pantallas W1, W2 ya implementadas en la app web pública coinciden con el Figma `Nexa Seguros` y corregir las diferencias que sí son del front. Esta tarea no agrega funcionalidad: cierra las pantallas con evidencia visual (capturas lado a lado) en el PR.

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
- **Depende de:** US-FE-W-01, US-FE-W-02, US-FE-W-03, US-FE-T-18.
- **Bloqueada por pedidos al back (PB-NN):** — (los datos que faltan en el back se ven con MSW o "no disponible", y eso se registra como excepción aceptada, no como diferencia).
- **Workaround MSW (FB7.7):** la app corre con `VITE_USE_MOCKS=true`.

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB7 (contrastes registrados, "no disponible", MSW) y FB8.
- `docs/frontend/pantallas/W1-inicio.md` (W1)
- `docs/frontend/pantallas/W2-consultar-poliza.md` (W2)
- `docs/frontend/design-system.md`: tokens (§3), componentes (§5) y registro de contrastes (§9).
- Las fichas de las tareas del grupo (W-01, W-02, W-03, T-18), solo su sección 8 (textos de UI) y su sección 13 (decisiones y excepciones).
- Figma `https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros`. Nodos principales: los de las secciones de referencias de W1 y W2.

## 5. Archivos a crear o modificar

| Archivo | Dueño |
|---|---|
| Archivos de las tareas del grupo (componentes, páginas, estilos) | Se modifican solo para corregir diferencias visuales; el dueño sigue siendo la tarea original |
| `docs/frontend/tareas/US-FE-V-06.md` (sección 13) | US-FE-V-06 |
| Capturas en el PR (no se commitean al repo) | US-FE-V-06 |

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

Decisiones DP-1, DP-2 y DP-3: se aplican los tres defaults, elegidos por Martin el 2026-11-08 (regla 12).

### 13.1 Diferencias corregidas

| Pantalla | Diferencia | Corrección |
|---|---|---|
| W1, W2 | El `PublicLayout` sumaba 24 px entre la nav, el contenido y el pie; el Figma no tiene esa separación (en W1 el hero arranca a 48 px de la nav por su propio padding). | Sin `gap` en el layout (T-18). |
| W2 | El Shell medía lo que el contenido; en el Figma ocupa el alto de la ventana menos el margen (976 px en 1024) y el pie queda abajo. | `Shell` acepta `className` (T-07) y el layout lo estira con `min-h-dvh`; `main` crece. |
| W2 | La card y las alertas quedaban alineadas arriba; el Figma las centra en vertical en el cuerpo. | `md:flex-1 md:items-center` en la página (W-03). |
| W2, W2m | Título y bajada iban juntos con 8 px; en el Figma son hijos directos de la card con su gap (20 px desktop, 16 px mobile). | Sin grupo intermedio (W-03). |
| W2, W2m | DNI y número de póliza se escribían en Plus Jakarta 14/20; el Figma usa Nexa/Mono 13/18. | `font-mono text-mono` en los dos `Input` (W-03). |
| W2m | En mobile el formulario iba dentro de una card con borde; W2m no tiene card. | Card solo desde `md` (W-03). |
| W2, W2m | Las alertas de 404 y 429 usaban Body-sm 13/18 y radio 16; el Figma usa 14/20 y radio 12. | `text-body` y `rounded-input` (W-03). |
| W1 | El chip "Valores de referencia" quedaba arriba; en el Figma está centrado en vertical con el título y el subtítulo. | `md:items-center` en el encabezado de Planes (W-01). |

### 13.2 Excepciones aceptadas (no se corrigen)

| Pantalla | Diferencia | Motivo |
|---|---|---|
| W1 | Importes RC $ 12.000 / TR $ 30.000 en lugar de $ 10.000 / $ 27.500. | DP-1: manda el back (`GET /api/planes`); D-07 y DN-W1-5 cerrados por Martin el 2026-11-08. |
| W1 | La tabla de planes no tiene columna "Cobertura" ni filas con tildes; las tres columnas de plan reparten el ancho. | D-08: la matriz de coberturas está fuera de alcance (W-02 §13). |
| W1 | La tarjeta "Efectivo con Pago Fácil" no muestra "Ver ejemplo de cupón". | DN-W1-1 (RV-D21). |
| W1 | Marcador "Foto: auto y moto" en lugar de una foto. | DN-W1-2: diseño no entregó la imagen. |
| W1 | La bajada del hero va en Body 14/20; el Figma la dibuja en Regular 16/20. | El Figma no le asigna un estilo con nombre (W1 §3) y el design system no tiene un token 16/20 regular; no se agregan valores sueltos. Se avisa a diseño. |
| W2, W2m | No se muestran las etiquetas "Estado: póliza no encontrada" / "Estado: demasiados intentos" ni las dos alertas a la vez. | DN-W3-2: son anotaciones de diseño; la app muestra solo la alerta del error que ocurrió. |
| W2m | La nav y el pie mobile no siguen W2m (márgenes, alto de la nav, pie sin fondo y apilado). | DP-3: los frames mobile del Figma no coinciden entre sí. W2m: margen 16, nav de 72 px con padding 20 y pie sin fondo (label primario, valor Body-sm secundario). W3m: margen 12, nav de 60 px con padding 16 y pie con fondo `surface-subtle` (label secundario, valor Body primario). No se inventa uno; se reporta a diseño y se registra en `pantallas/W2-consultar-poliza.md` §13 en un PR `docs/` aparte. |
| W2 | En el Figma la nav de W2 arranca pegada al borde superior del Shell (sin padding arriba) y en W1 a 24 px. | DP-3: inconsistencia del Figma. La app usa el mismo padding en todas las pantallas (el de W1). |
| W1 mobile | No hay frame mobile de W1. | W1 §11; se verificó solo que no haya scroll horizontal y que quede en una columna. |
| Todas | Contrastes ya registrados en `design-system.md` §9. | DP-2 (FB7): no se cambian. |

Efecto fuera del grupo: sacar el `gap` del layout acerca 24 px el contenido de W3 a W7 a la nav; esas pantallas se verifican en US-FE-V-07.

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
