# Workflow de trabajo — TFI Aseguradora de Vehículos

Flujo obligatorio para humanos y asistentes de IA. Una historia de usuario (tarjeta de Trello) = una rama = un PR hacia `development`.

## Reglas duras (no negociables)

1. **Prohibido commitear directo en `main` o `development`.** Siempre se trabaja en una rama propia.
2. **Prohibido crear ramas desde `main`.** Toda rama sale de `development` actualizada.
3. **Todo cambio entra por Pull Request hacia `development`.** `main` solo recibe merges de `development` (releases), también por PR.
4. **Antes de cualquier commit, verificar la rama actual** (`git branch --show-current`). Si es `main` o `development`: parar, crear rama, y recién ahí commitear.
5. **No hacer push, abrir PR ni mergear sin pedido explícito del usuario**, salvo que la instrucción sea ejecutar el flujo completo ("Hacé la tarjeta US-XX").
6. Commits en formato Conventional Commits: `feat(backend): US-XX descripcion`, `fix(front): ...`, `docs: ...`.
7. **Prueba manual local antes del PR.** Si el cambio tiene algo que se pueda probar a mano (un endpoint, una pantalla, un comando, el stack de Docker), la persona responsable lo prueba en su máquina y confirma que funciona antes de abrir el PR. Un asistente de IA no abre el PR sin esa confirmación, aunque esté ejecutando el flujo completo: le pasa al usuario los pasos concretos para probar y espera. Si no hay nada que probar a mano (solo docs, tests o refactor interno), se dice explícitamente y se sigue.
8. **Atender los comentarios de los compañeros en tus PRs.** Antes de abrir un PR nuevo, revisar los comentarios en tus propios PRs (abiertos y ya mergeados): fixes sugeridos, preguntas, observaciones, sean bloqueantes o no. Cada comentario se resuelve: se aplica el cambio (en la misma rama si el PR sigue abierto, o en una rama `fix/` nueva si ya se mergeó) o se responde explicando por qué no. Ningún comentario queda sin respuesta.
9. **Compartir las skills que usás.** Si usás una skill de un lenguaje, framework o herramienta del proyecto, agregala a la tabla de "Skills del equipo" (con su comando `npx skills add`) para que el resto pueda instalarla. **Instalar las skills de la tabla es obligatorio** para quien trabaja en esa área, y los asistentes de IA las usan siempre que la tarea toca su área. Si falta una, el asistente pide instalarla antes de seguir.
10. **React Doctor en 100/100 antes de abrir un PR del front.** Si el PR toca código de `frontend/`, se corre desde `frontend/`: `npx -y react-doctor@latest . --yes --verbose`. El score tiene que ser **100/100**. Se corrigen los hallazgos y se vuelve a correr; no se desactivan reglas ni se baja la vara para llegar al 100. Si un hallazgo parece un falso positivo, se avisa al usuario y se decide con él. El asistente de IA no abre el PR sin ese 100/100 y pone el resultado en el cuerpo del PR. Si el cambio es solo de docs o del back, no aplica y se dice explícitamente.

## Nombres de rama

```
feature/US-XX-nombre-descriptivo
fix/US-XX-nombre-descriptivo
docs/nombre-descriptivo
chore/nombre-descriptivo
```

## Tablero de Trello

Tablero: https://trello.com/b/Lo6WcbfU/pad

Listas (confirmar nombres exactos contra el tablero real antes de mover tarjetas):

`Backlog` → `Sprint` → `Todo` → `En Progreso` → `QA` → `Hecho` (más `Blocked` para bloqueos)

- `QA`: el PR está abierto y espera el CI, la review de Copilot y la aprobación de otra persona del equipo.
- `Hecho`: el PR se mergeó a `development`.

Cada movimiento de tarjeta lleva un comentario corto (quién, qué, fecha).

## Flujo completo

```
1. Recibir instrucción: "Hacé la tarjeta US-XX"
2. Buscar la tarjeta en Trello y leer su detalle (fuente de verdad): si el ID es `US-F*` o `US-T-*`, su sección en `docs/tareas-divididas.md`; si es `US-FE-*`, su ficha en `docs/frontend/tareas/` (ver "Tareas del front")
3. Verificar "Puede empezar sin esperar a" y las decisiones pendientes de la tarea; mover a Sprint (si está en Backlog) y luego a Todo
4. git checkout development && git pull
5. git checkout -b feature/US-XX-nombre-descriptivo
6. Mover a En Progreso
7. Analizar código existente, la spec y la sección de la tarea
8. Plan de implementación (usar la checklist "Criterios de aceptación" de la tarjeta)
9. Implementar
10. Verificar build y tests, y cada criterio de aceptación de la tarea (en `docs/tareas-divididas.md` o en su ficha `US-FE-*`); si toca `frontend/`, React Doctor en 100/100 (regla 10)
11. Review propio contra los criterios de calidad
12. Si falla: corregir y volver al 9 (máx. 3 iteraciones)
13. Revisar los comentarios de los compañeros en tus PRs propios (abiertos y mergeados) y resolver cada uno, bloqueante o no (regla 8)
14. Prueba manual local: si hay algo que se pueda probar a mano, pasar los pasos al usuario y esperar su confirmación (regla 7)
15. Si está bloqueada: mover a Blocked, avisar y parar
16. Commit, push de la rama, PR hacia development; mover a QA con comentario + URL del PR
17. Atender los comentarios que lleguen al PR (compañeros y Copilot) hasta que se mergee
18. Al mergearse el PR, mover a Hecho con comentario
19. Devolver al usuario: URL del PR, resumen, archivos modificados
```

### Trello: movimientos y comentarios

| Paso | Acción | Comentario sugerido |
|------|--------|---------------------|
| 3 | Backlog → Sprint → Todo | `📋 Movido a Sprint` / `📝 Listo para implementar` |
| 6 | Todo → En Progreso | `🚀 Iniciado por [quien] — [fecha]` |
| 15 | → Blocked | `⚠️ BLOCKED: [razón]` |
| 16 | En Progreso → QA | `🔎 En revisión — PR: [url]` |
| 18 | QA → Hecho | `✅ Completado — PR: [url]` |

Si no se encuentra la tarjeta: informar al usuario y terminar.

### Commit, push y PR

```bash
git branch --show-current   # confirmar que NO es main ni development
git add <archivos>
git commit -m "feat(backend): US-XX descripcion"
git push -u origin feature/US-XX-nombre-descriptivo
gh pr create --base development --head feature/US-XX-nombre-descriptivo \
  --title "feat(backend): US-XX descripcion" --body "..."
```

El cuerpo del PR incluye: tarjeta de Trello, resumen de cambios, cómo se probó (tests y prueba manual local, o "sin prueba manual" con el motivo) y, en PRs del front, el resultado de React Doctor (`100/100`).

## Tareas divididas y tarjetas

- Las tarjetas se llaman `US-F1-01`, `US-T-02`, etc. (F1 a F4 son los frentes, T es transversal) y son un **resumen**: propósito, dependencias, link y una checklist con los criterios de aceptación.
- La fuente de verdad de cada tarea es su sección en `docs/tareas-divididas.md`: alcance, archivos, tests, decisiones pendientes y criterios de aceptación. Si la tarjeta y el documento difieren, manda el documento.
- Una tarea está **lista** solo cuando se cumplen todos los criterios de aceptación de su sección del documento y está tildada la checklist de la tarjeta. Solo entonces va a QA.
- La rama de una tarea sigue el ID: `feature/US-F1-01-nombre-descriptivo`.
- Si el documento tiene un error o una decisión pendiente que bloquea, no inventar: avisar al usuario, y si se corrige el documento hacerlo en un PR `docs/` aparte.

## Tareas del front

El front (React + TypeScript, arquitectura screaming, dos apps) tiene su propia documentación en `docs/frontend/`. Las tarjetas se llaman `US-FE-T-NN` (transversal), `US-FE-B-NN` (backoffice), `US-FE-W-NN` (web pública) y `US-FE-V-NN` (verificación visual contra el Figma, una por grupo de pantallas, en la última ola). **No leer los `.md` completos: se llega a la tarea por este camino y se lee solo lo que enlaza.**

1. **Elegir tarea:** `docs/frontend/tareas/INDEX.md` (índice corto: oleada, dependencias, bloqueos, tamaño y dueño de archivos compartidos).
2. **Leer su ficha:** `docs/frontend/tareas/<ID>.md` (por ejemplo `US-FE-B-12.md`). Es autosuficiente: objetivo, alcance, archivos exactos, contrato con el back, textos de UI, tests, criterios de aceptación y verificación manual. Su sección 4 lista los documentos a leer con las secciones exactas; leer solo esas.
3. **Reglas que aplican a toda tarea del front:** `docs/frontend/00-decisiones-base.md` (stack, monorepo, arquitectura screaming, decisiones FB1 a FB8; si choca con otro `.md` del front, manda este) y las convenciones `FC` del INDEX.
4. **Fuentes por tema** (consultar solo si la ficha lo pide o hay una duda): `analisis-front.md` (rutas, features, flujos), `design-system.md` (tokens y componentes), `pantallas/<ID>.md` (una pantalla del Figma), `contratos-api/*.md` (endpoints y DTOs del back), `pedidos-al-back.md` (huecos del back, `PB-NN`).
5. **Dependencias:** una tarea no se toma si alguna tarea de "Depende de" no está mergeada en `development`. T-01 y T-02 son prerrequisitos de rebase, no de oleada (ver INDEX).
6. **Endpoints que no existen todavía:** se trabaja contra MSW (`VITE_USE_MOCKS=true`) con el contrato mínimo de la ficha. Un filtro que el back real ignora no se activa con el flag (ver FB8, RV-D29). No inventar campos.
7. **Archivos compartidos:** cada archivo compartido tiene un único dueño (INDEX, "Ownership"). Nadie edita un archivo ajeno salvo lo que la ficha autoriza; si hace falta, se avisa y se agrega en la tarea dueña.
8. **Decisiones marcadas `[CONFIRMAR]`** (producto, seguridad, infraestructura): no cerrarlas por cuenta propia; avisar al usuario antes de implementar la parte afectada.
9. **Si el front necesita algo del back que no existe** (endpoint, campo, código de error): se registra en `docs/frontend/pedidos-al-back.md` con un `PB-NN` y se sigue con el workaround de la ficha.
10. **Errores del plan:** si una ficha, el INDEX o un `.md` del front tiene un error o una contradicción, no inventar: avisar al usuario y corregirlo en un PR `docs/` aparte (misma regla que arriba).

## Skills del equipo

Regla 9: cuando alguien usa una skill específica de un lenguaje, framework o herramienta del proyecto (ej. .NET, React), la agrega a esta tabla en el mismo PR. Así el resto del equipo puede instalarla. **Las skills de esta tabla son obligatorias**: cada persona las instala antes de tomar una tarjeta de su área (back: .NET; front: React, diseño y e2e) y el asistente las carga y aplica al escribir o revisar código de esa área.

Cómo se usa la tabla (para asistentes de IA):

- Solo se mira cuando la tarea toca el área de una skill de la tabla. No se revisa al arrancar la sesión.
- Se compara contra la lista de skills disponibles que ya está en el contexto de la sesión; no hace falta buscar en disco.
- Si la skill falta: pedir su instalación antes de seguir con la tarea, con el comando y el motivo, y no avanzar con esa parte hasta que esté instalada (salvo que el usuario diga explícitamente que sigas sin ella). Si ya está instalada, usarla sin avisar.
- Si ya está instalada: no decir nada.

Instalación: `npx skills add <repo>` (reiniciar la sesión del asistente después para que la cargue). Catálogo para buscar skills y copiar su comando: https://skills.sh/

| Skill | Para qué | Instalar |
|-------|----------|----------|
| `dotnet-best-practices` | Buenas prácticas de C#/.NET al escribir o revisar el back | `npx skills add github/awesome-copilot --skill dotnet-best-practices -g` |
| `vercel-react-best-practices` | Rendimiento y buenas prácticas de React al escribir o revisar el front | `npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices -g` |
| `web-design-guidelines` | Revisar accesibilidad y UX de interfaces contra guías de diseño web | `npx skills add vercel-labs/agent-skills --skill web-design-guidelines -g` |
| `frontend-design` | Construir componentes y pantallas con calidad de diseño (siempre contra el Figma y los tokens) | `npx skills add anthropics/skills --skill frontend-design -g` |
| `ui-ux-pro-max` | Criterios de UI/UX: estados, tamaños táctiles, accesibilidad y responsive | `npx skills add nextlevelbuilder/ui-ux-pro-max-skill --skill ui-ux-pro-max -g` |
| `playwright-cli` | Tests e2e y pruebas de navegador del front (US-FE-T-21) | `npx skills add microsoft/playwright-cli --skill playwright-cli -g` |

## Contexto técnico

- **Back:** C# .NET 8, API REST, SQL Server, EF Core. Capas: Domain / Data / Application / Integrations / Api. Auth: JWT (empleados/admin) y API key (grupos externos).
- **Front:** monorepo `frontend/` (npm workspaces) con dos apps React + TypeScript (backoffice y web pública) y paquetes compartidos `@nexa/ui`, `@nexa/api` y `@nexa/config`. Arquitectura screaming (carpetas por dominio). Diseño en Figma (`Nexa Seguros`). Documentación y tareas en `docs/frontend/` (ver "Tareas del front").
- **Spec del back:** `docs/AnalisisBack.md` (local, ignorado por git; pedirlo al equipo).
- **Tareas del back:** `docs/tareas-divididas.md` (versionado; una sección por tarjeta, con convenciones comunes C1 a C17).
- **Reglas de negocio:** se citan por código (RN08, RN19, etc.) tal como figuran en la spec.

## Criterios de calidad antes del PR

### Backend (.NET)
- [ ] `dotnet build` sin errores y `dotnet test` en verde
- [ ] Separación de capas respetada (la API no accede a Data directo)
- [ ] DTOs: no se exponen entidades
- [ ] Validaciones y reglas de negocio en la capa Application
- [ ] Manejo de errores consistente
- [ ] Endpoints protegidos con el esquema de auth correcto (JWT / API key)

### Frontend (React + TypeScript)
- [ ] `npm run lint`, `npm run typecheck`, `npm test` y `npm run build` sin errores (desde `frontend/`)
- [ ] React Doctor en 100/100: `npx -y react-doctor@latest . --yes --verbose` desde `frontend/` (regla 10)
- [ ] Arquitectura screaming respetada: un feature solo importa de otro por su `index.ts`; sin imports que `eslint-plugin-boundaries` prohíba
- [ ] Sin `any` explícito; DTOs y enums del back tipados en `@nexa/api` (los enums viajan como número y se mapean, nunca se usan crudos en la UI)
- [ ] Sin `fetch` suelto en componentes: todo por el cliente de `@nexa/api` y TanStack Query; `retry: 0` en mutaciones
- [ ] Estilos con tokens del design system (sin valores de diseño sueltos); textos de UI literales del Figma
- [ ] Componentes reutilizables, lógica en hooks custom
- [ ] `useEffect` con dependencias correctas
- [ ] Estados cargando / vacío / error / sin permiso cubiertos, y accesibilidad básica (foco visible, labels, roles)
- [ ] Endpoints inexistentes cubiertos con handler MSW del contrato de la ficha, sin campos inventados

### General
- [ ] El CI del PR está en verde (`backend`, `branch-name`, `secrets-scan`, y `frontend` cuando exista: lo agrega `US-FE-T-01`) y se atendió la review de Copilot
- [ ] Cada criterio de aceptación de la tarea (en `docs/tareas-divididas.md`, o en su ficha `docs/frontend/tareas/US-FE-*.md`) está cumplido
- [ ] Probado a mano en local por la persona responsable (si aplica)
- [ ] Sin comentarios de compañeros pendientes en tus PRs propios
- [ ] SOLID / DRY / KISS
- [ ] Naming claro y consistente
- [ ] Sin magic numbers/strings, imports ni variables sin usar
- [ ] Sin secretos ni credenciales en el código

## Fallback: sin MCP de Trello o GitHub

Si las herramientas de Trello o GitHub no están disponibles en la sesión, no intentar invocarlas: continuar con lo que sí se puede hacer.

- **Sin Trello:** omitir los movimientos y comentarios de tarjeta; ejecutar rama, implementación, build y review. Al terminar, listar al usuario los pasos de Trello pendientes (mover a Hecho y comentar la URL del PR).
- **Sin GitHub:** ejecutar hasta el `git push` de la rama. No crear el PR; avisar al usuario para que lo abra manualmente hacia `development`.
- **Ambos presentes:** flujo completo sin cambios.

## Manejo de errores

- **Build falla:** informar el error, corregir y reintentar (máx. 3 veces).
- **Tarjeta no encontrada:** pedir al usuario que verifique el ID.
- **Bloqueado:** mover a Blocked, indicar razón, dependencia y qué debe hacer el usuario. Parar.
- **Estás en `main`/`development` con cambios sin commitear:** crear la rama con `git checkout -b <rama>` (los cambios se llevan) y seguir desde ahí.
