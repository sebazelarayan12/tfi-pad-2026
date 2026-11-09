# US-FE-V-03: Verificación visual contra el Figma: Backoffice: cotizar y emitir

V · Ola 7 · Tamaño S · Rama sugerida `feature/US-FE-V-03-verificacion-visual-backoffice-cotizar-emitir` · Tarjeta Trello `US-FE-V-03`

## 1. Objetivo

Comprobar que las pantallas B7, B8 ya implementadas en la app backoffice coinciden con el Figma `Nexa Seguros` y corregir las diferencias que sí son del front. Esta tarea no agrega funcionalidad: cierra las pantallas con evidencia visual (capturas lado a lado) en el PR.

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
- **Depende de:** US-FE-B-10, US-FE-B-11, US-FE-B-12.
- **Bloqueada por pedidos al back (PB-NN):** — (los datos que faltan en el back se ven con MSW o "no disponible", y eso se registra como excepción aceptada, no como diferencia).
- **Workaround MSW (FB7.7):** la app corre con `VITE_USE_MOCKS=true`.

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB7 (contrastes registrados, "no disponible", MSW) y FB8.
- `docs/frontend/pantallas/B7-cotizar.md` (B7)
- `docs/frontend/pantallas/B8-emitir-poliza.md` (B8)
- `docs/frontend/design-system.md`: tokens (§3), componentes (§5) y registro de contrastes (§9).
- Las fichas de las tareas del grupo (B-10, B-11, B-12), solo su sección 8 (textos de UI) y su sección 13 (decisiones y excepciones).
- Figma `https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros`. Nodos principales: 22:594 (B7); B8 en la sección de referencias de su pantalla.

## 5. Archivos a crear o modificar

| Archivo | Dueño |
|---|---|
| Archivos de las tareas del grupo (componentes, páginas, estilos) | Se modifican solo para corregir diferencias visuales; el dueño sigue siendo la tarea original |
| `docs/frontend/tareas/US-FE-V-03.md` (sección 13) | US-FE-V-03 |
| Capturas en el PR (no se commitean al repo) | US-FE-V-03 |

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

## 13. Verificación visual

Se confirmaron DP-1, DP-2 y DP-3. La comparación usa los frames B7 y B8 y la app con MSW a 1440 px. B7 §11 y B8 §11 indican que no hay frames móviles. Las capturas para el PR se guardan fuera del repositorio.

| Pantalla | Diferencia corregida |
|---|---|
| B7 y B8 | El panel lateral ahora tiene borde divisorio y espacio interior en escritorio. |
| B8 | La vigencia elegida usa el color lima y mantiene su anillo de foco. La fecha de inicio conserva la lectura solamente y muestra el icono de calendario. |
| B8 | El resumen usa el espacio del frame. La prima usa Nexa/Mono-lg y la validez se muestra junto a ella. |
| B8 | La vigencia queda fuera de una tarjeta. El borde de la tabla encierra las cuotas y el total, alineado con la columna Importe. |
| B8 | La nota usa el fondo lima suave y el icono de información. Emitir y Cancelar se alinean al final del panel en escritorio. |

| Pantalla | Diferencia aceptada | Motivo |
|---|---|---|
| B7 y B8 | Los clientes, vehículos, montos, descripciones y fechas difieren del ejemplo. | DP-1. Se usan los datos del contrato, simulados con MSW en las capturas, y el formato de T-09. |
| B7 | Cliente y vehículo aparecen en la columna principal. Se muestra el botón Cotizar. | B-10 los define como contexto y acción del flujo real. |
| B7 | Se omiten Recomendado, Guardar cotización y Cambiar datos. | B-10 §2 y B-11 §2. |
| B7 | Antigüedad y conductor muestran sus factores sin años. | DP-B11-02 y PB-10. |
| B8 | El frame preselecciona seis meses. El total y las filas aparecen al elegir. | DP-B12-02 y DP-B12-08. La captura muestra el estado después de elegir seis meses. |
| B8 | Vencimientos A confirmar, sin texto auxiliar de fecha de fin, y cuotas con formato «1 de 6». | PB-20 y DP-B12-01, DP-B12-03 y DP-B12-07. |
| B8 | Las validaciones aparecen como lista, sin checks. | DP-B12-04. El backend valida al emitir. |
| B7 y B8 | El panel comienza bajo el encabezado común, la campana queda en la barra superior y Cotización aparece bajo el título en B8. El menú lateral refleja el rol y las rutas disponibles. | El layout compartido de backoffice controla el encabezado y la navegación. Su revisión visual corresponde a V-01. |
| Ambas | Contrastes registrados en design-system §9. | DP-2 y FB7. |

El recorrido en Edge con MSW verifica un solo POST de emisión con 201, llegada al detalle B-15 y carga de sus cuotas.

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
