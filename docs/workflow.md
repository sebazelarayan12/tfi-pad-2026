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
2. Buscar la tarjeta en Trello y leer su sección completa en `docs/tareas-divididas.md` (fuente de verdad)
3. Verificar "Puede empezar sin esperar a" y las decisiones pendientes de la tarea; mover a Sprint (si está en Backlog) y luego a Todo
4. git checkout development && git pull
5. git checkout -b feature/US-XX-nombre-descriptivo
6. Mover a En Progreso
7. Analizar código existente, la spec y la sección de la tarea
8. Plan de implementación (usar la checklist "Criterios de aceptación" de la tarjeta)
9. Implementar
10. Verificar build y tests, y cada criterio de aceptación de la tarea en `docs/tareas-divididas.md`
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

El cuerpo del PR incluye: tarjeta de Trello, resumen de cambios, cómo se probó (tests y prueba manual local, o "sin prueba manual" con el motivo).

## Tareas divididas y tarjetas

- Las tarjetas se llaman `US-F1-01`, `US-T-02`, etc. (F1 a F4 son los frentes, T es transversal) y son un **resumen**: propósito, dependencias, link y una checklist con los criterios de aceptación.
- La fuente de verdad de cada tarea es su sección en `docs/tareas-divididas.md`: alcance, archivos, tests, decisiones pendientes y criterios de aceptación. Si la tarjeta y el documento difieren, manda el documento.
- Una tarea está **lista** solo cuando se cumplen todos los criterios de aceptación de su sección del documento y está tildada la checklist de la tarjeta. Solo entonces va a QA.
- La rama de una tarea sigue el ID: `feature/US-F1-01-nombre-descriptivo`.
- Si el documento tiene un error o una decisión pendiente que bloquea, no inventar: avisar al usuario, y si se corrige el documento hacerlo en un PR `docs/` aparte.

## Contexto técnico

- **Back:** C# .NET 8, API REST, SQL Server, EF Core. Capas: Domain / Data / Application / Integrations / Api. Auth: JWT (empleados/admin) y API key (grupos externos).
- **Front:** dos apps React (backoffice y web pública).
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

### Frontend (React)
- [ ] `npm run build` sin errores
- [ ] Componentes reutilizables, lógica en hooks custom
- [ ] `useEffect` con dependencias correctas

### General
- [ ] El CI del PR está en verde (`backend`, `branch-name`, `secrets-scan`) y se atendió la review de Copilot
- [ ] Cada criterio de aceptación de la tarea en `docs/tareas-divididas.md` está cumplido
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
