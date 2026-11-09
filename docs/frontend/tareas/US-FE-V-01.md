# US-FE-V-01: Verificación visual contra el Figma: Backoffice: acceso e inicio

V · Ola 7 · Tamaño S · Rama sugerida `feature/US-FE-V-01-verificacion-visual-backoffice-acceso-inicio` · Tarjeta Trello `US-FE-V-01`

## 1. Objetivo

Comprobar que las pantallas B1, B2 ya implementadas en la app backoffice coinciden con el Figma `Nexa Seguros` y corregir las diferencias que sí son del front. Esta tarea no agrega funcionalidad: cierra las pantallas con evidencia visual (capturas lado a lado) en el PR.

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
- **Depende de:** US-FE-B-01, US-FE-B-02, US-FE-B-03, US-FE-T-16.
- **Bloqueada por pedidos al back (PB-NN):** — (los datos que faltan en el back se ven con MSW o "no disponible", y eso se registra como excepción aceptada, no como diferencia).
- **Workaround MSW (FB7.7):** la app corre con `VITE_USE_MOCKS=true`.

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB7 (contrastes registrados, "no disponible", MSW) y FB8.
- `docs/frontend/pantallas/B1-login.md` (B1)
- `docs/frontend/pantallas/B2-inicio.md` (B2)
- `docs/frontend/design-system.md`: tokens (§3), componentes (§5) y registro de contrastes (§9).
- Las fichas de las tareas del grupo (B-01, B-02, B-03, T-16), solo su sección 8 (textos de UI) y su sección 13 (decisiones y excepciones).
- Figma `https://www.figma.com/design/nkiHNA713jSg1zgdz9WIWn/Nexa-Seguros`. Nodos principales: 18:2178 (B1) y 18:236 (B2).

## 5. Archivos a crear o modificar

| Archivo | Dueño |
|---|---|
| Archivos de las tareas del grupo (componentes, páginas, estilos) | Se modifican solo para corregir diferencias visuales; el dueño sigue siendo la tarea original |
| `docs/frontend/tareas/US-FE-V-01.md` (sección 13) | US-FE-V-01 |
| Capturas en el PR (no se commitean al repo) | US-FE-V-01 |

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

**Respuestas del usuario (2026-11-09, antes de empezar):**
- DP-1: las diferencias por dato (nombres, cifras y fechas de muestra del Figma) no importan; el Figma muestra cómo se ve la página. No se corrigen.
- DP-2: **se corrigen** los contrastes de las pantallas verificadas (cambia el default de FB7 solo para B1 y B2).
- DP-3: default (no inventar; avisar y corregir el documento en un PR `docs/` aparte).

**Corregido (medido en un viewport de 1440 × 1024 contra los nodos 18:2178 y 18:236):**
- B1: el Shell ocupa 976 px de alto (antes 928); las columnas miden 680 px sin separación (antes 672 con gap 16); el espacio bajo cada campo es de 24 px (el correo y la contraseña quedan a 88 px, el botón a 104 px de la contraseña, como en el Figma).
- B2: el buscador del Topbar lleva el icono de lupa y texto de 13 px; las notas de los KPI usan el estilo Caption (11 px) y las tarjetas miden 158 px de alto; la tabla de cuotas vencidas fija el ancho de sus columnas (160, 130, 200 y 100 px) para que "Cuota y vencimiento" no se parta en dos líneas.
- Contraste (P-C1 y P-C2): texto informativo con `text/secondary` en lugar de `text/tertiary` en el helper y el placeholder de `Input` (`FieldFrame`), el rol del Sidebar y las notas de los KPI.

**Excepciones aceptadas (no se corrigen en esta tarea):**
- Datos de muestra del Figma (Mariela Quiroga, 312, 390 pólizas, "Cuota 8 de 12"): manda el back o el mock (DP-1).
- Foto del panel de marca de B1 (marco gris 632 × 820 con "Foto: sede de atención"): el Figma no trae imagen real; sigue D-B01-3 (sin imagen ni texto de anotación).
- Widget "Tareas del día" y la línea de cuotas del saludo con datos del Figma: ocultos por D-11 y D-B02-4.
- Planes, Usuarios y el pie con el usuario en el Sidebar: dependen del rol (FB7.10).
- Móvil (390 px): el Figma de B1 y B2 no lo define.
- Altura de fila de la tabla (48 px contra 49 px del Figma): viene del primitivo `Table` (T-06), fuera del alcance mínimo.
- Separación del icono de lupa (4 px contra 8 px): se reutiliza el espaciado del buscador del Sidebar para no agregar un token nuevo.

**Pendientes de decisión del usuario (no se resolvieron por cuenta propia):**
- Estructura de la columna derecha de B2: en el Figma el rail ocupa todo el alto, con un separador de 1 px, y el Topbar mide 795 px. En la app el Topbar abarca todo el ancho y el rail está dentro de la página. Corregirlo implica un slot de rail en `LayoutBackoffice` (T-16) que afecta a otras pantallas.
- Botón "Nueva cotización" del Topbar (D-B02-4 y DP-6 de T-16).
- P-C3 (Badge Suspendida, 4,42) y P-C4 (borde de campos, 1,48): requieren cambiar tokens y se alejarían del Figma en todas las pantallas.

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
