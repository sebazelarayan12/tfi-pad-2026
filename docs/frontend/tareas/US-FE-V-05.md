# US-FE-V-05: Verificación visual contra el Figma: Backoffice: Pago Fácil, planes y usuarios

V · Ola 7 · Tamaño M · Rama sugerida `feature/US-FE-V-05-verificacion-visual-backoffice-pagofacil-planes-usuarios` · Tarjeta Trello `US-FE-V-05`

## 1. Objetivo

Comprobar que las pantallas B12, B13, B14 ya implementadas en la app backoffice coinciden con el Figma `Nexa Seguros` y corregir las diferencias que sí son del front. Esta tarea no agrega funcionalidad: cierra las pantallas con evidencia visual (capturas lado a lado) en el PR.

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
- **Depende de:** US-FE-B-20, US-FE-B-21, US-FE-B-22, US-FE-B-23, US-FE-B-24, US-FE-B-25.
- **Bloqueada por pedidos al back (PB-NN):** — (los datos que faltan en el back se ven con MSW o "no disponible", y eso se registra como excepción aceptada, no como diferencia).
- **Workaround MSW (FB7.7):** la app corre con `VITE_USE_MOCKS=true`.

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB7 (contrastes registrados, "no disponible", MSW) y FB8.
- `docs/frontend/pantallas/B12-pago-facil.md` (B12)
- `docs/frontend/pantallas/B13-planes.md` (B13)
- `docs/frontend/pantallas/B14-usuarios.md` (B14)
- `docs/frontend/design-system.md`: tokens (§3), componentes (§5) y registro de contrastes (§9).
- Las fichas de las tareas del grupo (B-20, B-21, B-22, B-23, B-24, B-25), solo su sección 8 (textos de UI) y su sección 13 (decisiones y excepciones).
- Figma `https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros`. Nodos principales: 23:2911 (B12), 24:1513 (B13), 33:1294 (B14).

## 5. Archivos a crear o modificar

| Archivo | Dueño |
|---|---|
| Archivos de las tareas del grupo (componentes, páginas, estilos) | Se modifican solo para corregir diferencias visuales; el dueño sigue siendo la tarea original |
| `docs/frontend/tareas/US-FE-V-05.md` (sección 13) | US-FE-V-05 |
| Capturas en el PR (no se commitean al repo) | US-FE-V-05 |

No se crean archivos nuevos de código. No se editan archivos compartidos de otro dueño salvo para una corrección visual mínima; si hace falta más, se avisa y se hace en la tarea dueña (INDEX, Ownership).

## 6. Pasos de implementación

1. Verificar que todas las dependencias de la sección 3 estén mergeadas y actualizar la rama desde `development`.
2. Levantar la app backoffice con `VITE_USE_MOCKS=true`.
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

Fernando Chumba confirmó DP-1, DP-2 y DP-3 para esta revisión.

| Pantalla | Diferencia | Resolución |
|---|---|---|
| B12, B13 y B14 | El encabezado mostraba el buscador global, ausente en los tres frames. | Se oculta en estas rutas. Se conserva el buscador de la navegación lateral. |
| B13 | Tipos permitidos en texto plano, códigos sin etiqueta y tabla con desplazamiento horizontal a 1440 px. | Chips neutros, códigos con fondo y columnas proporcionales. |
| B13 | El control Activo aparecía antes de los campos del editor. | Se muestra después de Antigüedad máxima. |
| B12 | Figma muestra un historial de bases positivas. | Se omite según D-12 de B-21. La API no ofrece ese historial. |
| B13 | Los importes y la descripción de los planes pueden diferir del ejemplo. | Se muestran los valores de la API (DP-1). |
| B14 | Figma muestra Último ingreso y más usuarios que el mock. | Se omite la columna según B-25 y PB-04. Se muestran los usuarios de MSW (DP-1). |
| B13 y B14 | Las acciones de alta aparecen sobre la tabla en la app, debajo del encabezado compartido. | Se conserva su ubicación en el contenido de cada feature. |
| Todas | Contrastes registrados en el sistema de diseño. | Se conservan según DP-2 y FB7. |

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
