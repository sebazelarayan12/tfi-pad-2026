# US-FE-T-22: README del front

Tipo T · Oleada 3 · Tamaño S · Rama sugerida `feature/US-FE-T-22-readme-front` · Tarjeta Trello `US-FE-T-22`

## 1. Objetivo

Escribir `frontend/README.md` para que cualquier persona del equipo (o una IA) pueda instalar, correr, probar con mocks y desplegar el front leyendo solo ese archivo. Debe cubrir comandos, variables de entorno, puertos, cómo correr con MSW, cómo agregar una feature y las reglas de ownership de archivos compartidos.

Lo usan: todo el equipo del front y las IAs que toman tareas de `docs/frontend/tareas/`.

## 2. Alcance

**Entra**
- `frontend/README.md` con las secciones de la sección 6.
- Comandos reales: los scripts que existan en `frontend/package.json` al momento de escribir el README (los define US-FE-T-01). El README se verifica contra el archivo, no contra la especificación.
- Variables de entorno de `apps/backoffice/.env.example` y `apps/web-publica/.env.example` (T-14 y T-17) y de `frontend/.env.example` (T-20).
- Puertos 5173 (backoffice) y 5174 (web pública), con la advertencia de `localhost` frente a `127.0.0.1`.
- Enlace a `docs/frontend/tareas/INDEX.md` y a `docs/frontend/00-decisiones-base.md`.

**NO entra**
- Documentación de arquitectura nueva (ya vive en `analisis-front.md` y `00-decisiones-base.md`). El README enlaza, no duplica.
- Cambios en código, scripts o `package.json` (FC17).
- Documentación de API (vive en `docs/frontend/contratos-api/`).
- Guía de despliegue en producción: la hace US-FE-T-20 o queda como NO DEFINIDO.

## 3. Dependencias

- **Depende de:** US-FE-T-11, US-FE-T-14, US-FE-T-17, US-FE-T-20.
- **Oleada:** 3.
- **Puede empezar sin esperar a:** Nada.
- **Bloqueada por pedidos al back (PB-NN):** ninguno.
- **Workaround MSW (FB7.7):** el README lo documenta; no aplica como bloqueo.

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB1 (stack y comandos base), FB2 (estructura del monorepo), FB3 (reglas de features), FB5 (IDs y ramas), FB7.5 (sesión), FB7.7 (mocks).
- `docs/frontend/tareas/INDEX.md`: sección "Convenciones comunes" (FC1, FC2, FC3, FC14, FC17) y sección "Ownership de archivos compartidos" (para la regla de ownership del README).
- `docs/frontend/analisis-front.md`: §3.1 (reglas FB3), §3.5 (árbol de carpetas), §7.5 (variables y puertos).
- `docs/frontend/contratos-api/convenciones-transversales.md`: §1.1 (URLs), §1.2 (`VITE_API_BASE_URL`), §1.4 (CORS, puertos exactos).
- `frontend/package.json` (raíz) y los `package.json` de `apps/*`, `packages/*`: leer los `scripts` para copiar nombres exactos. Es la fuente de verdad del README para comandos.
- `frontend/.env.example` y los `.env.example` de cada app.

## 5. Archivos a crear o modificar

| Archivo | Dueño | Notas |
|---|---|---|
| `frontend/README.md` | T-22 | Único archivo de la tarea. |

No se crea ningún otro `.md` (ni en `docs/frontend/`).

## 6. Pasos de implementación

1. Leer `frontend/package.json` y los `package.json` de workspaces. Anotar cada script y su nombre exacto.
2. Escribir `frontend/README.md` con estas secciones, en este orden:
   1. **Qué es:** dos apps (backoffice y web pública) y tres paquetes compartidos (`@nexa/ui`, `@nexa/api`, `@nexa/config`). Enlace a `docs/frontend/analisis-front.md`.
   2. **Requisitos:** Node 20 LTS y npm (workspaces, sin pnpm ni yarn, FB1). Versión exacta de `node -v` esperada.
   3. **Instalación:** `npm ci` desde `frontend/`.
   4. **Comandos:** tabla con los scripts de la raíz (`lint`, `typecheck`, `test`, `build`, `e2e` si existe) y los de cada app (`dev`, `build`). Con el nombre exacto del script.
   5. **Puertos:** backoffice `5173`, web pública `5174`, ambos con `strictPort`. Advertencia: usar `http://localhost:…` (no `127.0.0.1`) porque CORS del back compara el origen exacto.
   6. **Variables de entorno:** tabla con `VITE_API_BASE_URL` y `VITE_USE_MOCKS`, valores de ejemplo local y de producción, y la regla de que las `VITE_*` son públicas (nunca secretos). Indicar que `.env` no se commitea.
   7. **Trabajar con mocks (MSW):** `VITE_USE_MOCKS=true` en `.env` local; el worker `public/mockServiceWorker.js` lo genera `msw init` (si el script existe, nombrarlo). Aclarar que solo el bootstrap de `src/main.tsx` lee el flag (RV-D03).
   8. **Conectar con el back real:** levantar la API con el compose de la raíz (`docker compose up -d` en la raíz del repo), poner `VITE_API_BASE_URL=http://localhost:8080` y `VITE_USE_MOCKS=false`. Aclarar los puertos que el back acepta de CORS.
   9. **Docker del front:** `docker compose -f frontend/docker-compose.yml up -d --build` (de US-FE-T-20).
   10. **Cómo agregar una feature:** pasos según FB3 y FC1: crear `src/features/<dominio>/` con `api/`, `components/`, `pages/`, `schemas/`, `types/` e `index.ts`; el `index.ts` es lo único que otro feature importa; las rutas van en `routes.tsx` y el router solo las compone (FC14); los DTO compartidos van en `@nexa/api`.
   11. **Reglas de ownership:** texto breve con la regla (un archivo compartido, un dueño; barrels por bloques) y enlace a la sección "Ownership de archivos compartidos" de `tareas/INDEX.md`. No repetir la tabla (RV-54).
   12. **Pruebas:** qué cubre cada capa (FB1, `analisis-front §8.2`) y el comando de e2e con la instalación del navegador (`npx playwright install chromium`) si la tarea US-FE-T-21 ya está mergeada.
   13. **Documentos del proyecto:** enlaces a `docs/frontend/00-decisiones-base.md`, `docs/frontend/tareas/INDEX.md` y `docs/workflow.md`.
3. Verificar cada comando del README corriéndolo en la raíz (`npm run <script>`). Si un script no existe, quitarlo del README o pedir el script a T-01. No dejar comandos que no corren.
4. Verificar cada enlace relativo con `fd` o `Read`.

## 7. Contrato con el back

No aplica. El README solo referencia `VITE_API_BASE_URL` y los puertos de CORS (convenciones §1.2 y §1.4).

## 8. Contenido de UI

No aplica.

## 9. Estados y casos borde

- **Script inexistente:** el README no documenta comandos que no corren en el repo.
- **Variable sin valor:** la tabla de variables indica el default de `.env.example`; una variable sin valor en el `.env` produce un error de build o de llamada, y el README lo menciona en "Problemas frecuentes".
- **Puerto ocupado:** el README indica que `strictPort` falla en vez de moverse.
- **Mocks activados en producción:** el README indica explícitamente `VITE_USE_MOCKS=false` para cualquier build de despliegue.

## 10. Tests requeridos

No aplica. La verificación es mecánica: cada comando de la sección 6 se corre y cada enlace se abre. Ningún test automatizado.

## 11. Criterios de aceptación

1. `frontend/README.md` existe y tiene las trece secciones de la sección 6, paso 2, en ese orden.
2. Cada comando del README corre sin error en una copia limpia (`npm ci` seguido del comando).
3. Los nombres de script coinciden con `frontend/package.json` (verificado con `rg` sobre el archivo).
4. Los puertos son 5173 y 5174 y el README advierte sobre `localhost` frente a `127.0.0.1`.
5. La tabla de variables de entorno coincide con los `.env.example` de cada app.
6. El README no contiene valores reales de secretos, ni tokens, ni la contraseña de ningún fixture.
7. Todos los enlaces relativos apuntan a archivos que existen.
8. La sección de ownership enlaza al INDEX y no repite su tabla (RV-54).
9. El README está en español neutro, con voseo solo cuando cita textos de UI.
10. No hay cambios fuera de `frontend/README.md`.

## 12. Verificación manual

1. Clonar el branch en una carpeta nueva, seguir el README desde cero (`npm ci`, `npm run lint`, `npm run dev` de cada app, `docker compose up`). Anotar cada paso que no funcione y corregir el README.
2. Abrir `http://localhost:5173` y `http://localhost:5174` siguiendo las instrucciones de puertos.

Confirmar el resultado con el equipo antes del PR (`docs/workflow.md`, regla 7).

## 13. Decisiones pendientes (con default)

1. **Idioma del README:** default español neutro (FB5).
2. **Sección de e2e:** default incluirla solo si US-FE-T-21 está mergeada; si no, omitirla y anotarlo en el PR.
3. **Sección de despliegue en producción:** NO DEFINIDO (US-FE-T-20, decisión 1). Default: el README solo documenta Docker local.
4. **Badge de CI:** default no incluirlo.

## 14. Riesgos y errores comunes

- **Copiar comandos de memoria:** el nombre real de un script puede diferir del que aparece en la especificación. Leer `package.json`.
- **Documentar `127.0.0.1` como URL de desarrollo:** CORS la rechaza. Usar `localhost`.
- **Duplicar el contenido de `analisis-front.md`:** el README enlaza; no copia reglas que pueden cambiar.
- **Poner una contraseña de fixture en el README:** no se publica ningún valor de login.
- **Olvidar actualizar el README al agregar un script:** cada tarea que agregue un script lo anota en su PR (regla de este README).

## 15. Definición de terminado

- `lint` de Markdown o revisión manual sin errores de enlace.
- Los comandos del README corren en una instalación limpia (sección 12).
- Sin secretos ni datos de fixture.
- Criterios 1 a 10 de la sección 11 tildados con evidencia observada.

## 16. Observaciones al índice

- Resuelto (RV-D02 / RV-01): T-01 es prerrequisito de rebase (scripts del README), no dependencia; §3 sigue la fila del INDEX (T-11, T-14, T-17, T-20).
- Resuelto (RV-54): la sección de ownership enlaza al INDEX y no repite su tabla.
