# Workflow de trabajo — TFI Aseguradora de Vehículos

Flujo obligatorio para humanos y asistentes de IA. Una historia de usuario (tarjeta de Trello) = una rama = un PR hacia `development`.

## Reglas duras (no negociables)

1. **Prohibido commitear directo en `main` o `development`.** Siempre se trabaja en una rama propia.
2. **Prohibido crear ramas desde `main`.** Toda rama sale de `development` actualizada.
3. **Todo cambio entra por Pull Request hacia `development`.** `main` solo recibe merges de `development` (releases), también por PR.
4. **Antes de cualquier commit, verificar la rama actual** (`git branch --show-current`). Si es `main` o `development`: parar, crear rama, y recién ahí commitear.
5. **No hacer push, abrir PR ni mergear sin pedido explícito del usuario**, salvo que la instrucción sea ejecutar el flujo completo ("Hacé la tarjeta US-XX").
6. Commits en formato Conventional Commits: `feat(backend): US-XX descripcion`, `fix(front): ...`, `docs: ...`.

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

`Backlog` → `Sprint` → `Todo` → `En Progreso` → `Hecho` (más `Blocked` para bloqueos)

Cada movimiento de tarjeta lleva un comentario corto (quién, qué, fecha).

## Flujo completo

```
1. Recibir instrucción: "Hacé la tarjeta US-XX"
2. Buscar la tarjeta en Trello
3. Mover a Sprint (si está en Backlog) y luego a Todo
4. git checkout development && git pull
5. git checkout -b feature/US-XX-nombre-descriptivo
6. Mover a En Progreso
7. Analizar código existente y la spec
8. Plan de implementación (checklist en la tarjeta)
9. Implementar
10. Verificar build y tests
11. Review propio contra los criterios de calidad
12. Si falla: corregir y volver al 9 (máx. 3 iteraciones)
13. Si está bloqueada: mover a Blocked, avisar y parar
14. Commit, push de la rama, PR hacia development
15. Mover a Hecho con comentario + URL del PR
16. Devolver al usuario: URL del PR, resumen, archivos modificados
```

### Trello: movimientos y comentarios

| Paso | Acción | Comentario sugerido |
|------|--------|---------------------|
| 3 | Backlog → Sprint → Todo | `📋 Movido a Sprint` / `📝 Listo para implementar` |
| 6 | Todo → En Progreso | `🚀 Iniciado por [quien] — [fecha]` |
| 13 | → Blocked | `⚠️ BLOCKED: [razón]` |
| 15 | → Hecho | `✅ Completado — PR: [url]` |

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

El cuerpo del PR incluye: tarjeta de Trello, resumen de cambios, cómo se probó.

## Contexto técnico

- **Back:** C# .NET 8, API REST, SQL Server, EF Core. Capas: Domain / Data / Application / Integrations / Api. Auth: JWT (empleados/admin) y API key (grupos externos).
- **Front:** dos apps React (backoffice y web pública).
- **Spec del back:** `docs/AnalisisBack.md` (local, ignorado por git; pedirlo al equipo).
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
