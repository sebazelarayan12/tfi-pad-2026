# US-FE-T-20: Docker y despliegue del front

Tipo T · Oleada 2 · Tamaño M · Rama sugerida `feature/US-FE-T-20-docker-front` · Tarjeta Trello `US-FE-T-20`

## 1. Objetivo

Empaquetar las dos apps del front (backoffice y web pública) como imágenes Docker de servidor estático, con un `frontend/docker-compose.yml` propio que las levanta en `127.0.0.1:5173` y `127.0.0.1:5174`, los mismos puertos que el CORS del back acepta. `VITE_API_BASE_URL` entra como argumento de build (es público y se incrusta en el bundle). Al terminar, `docker compose up --build` dentro de `frontend/` sirve ambas apps y el back de la raíz las acepta como origen.

Lo usan: la persona que despliega el front y US-FE-T-22 (README, documenta los comandos).

El compose del back (raíz) no se toca (INDEX, ownership).

## 2. Alcance

**Entra**
- `frontend/Dockerfile.backoffice` y `frontend/Dockerfile.web-publica`: multi-stage, build con Node 20 y servidor estático nginx.
- `frontend/docker/nginx.conf`: configuración compartida con fallback de SPA (`try_files`) y cabeceras básicas.
- `frontend/.dockerignore`: excluye `node_modules`, `dist`, `.env` y cualquier `.env.*` que no sea `.env.example`.
- `frontend/docker-compose.yml`: dos servicios, `backoffice` y `web-publica`, con build args y puertos en loopback.
- `frontend/.env.example`: placeholders para las variables de build de compose (sin valores reales).

**NO entra**
- Cambios en `docker-compose.yml` de la raíz ni en `backend/Dockerfile`.
- Hosting público del front (Cloudflare Pages u otro): NO DEFINIDO (sección 13).
- Pipeline de CI o publicación de imágenes: US-FE-T-01 (job `frontend`, sin tocar `backend`).
- Variables de CORS del back: se cambian en el `.env` de la raíz, no aquí.
- Scripts de build de las apps: US-FE-T-14 y T-17.

## 3. Dependencias

- **Depende de:** US-FE-T-14, US-FE-T-17.
- **Oleada:** 2.
- **Puede empezar sin esperar a:** Nada.
- **Bloqueada por pedidos al back (PB-NN):** ninguno.
- **Workaround MSW (FB7.7):** `VITE_USE_MOCKS=false` en las imágenes. Una imagen de despliegue nunca arranca con mocks.

## 4. Documentos a leer

- `docs/frontend/00-decisiones-base.md`: FB1 (Node 20, npm workspaces), FB7.7 (`VITE_USE_MOCKS`).
- `docs/frontend/contratos-api/convenciones-transversales.md`: §1.1 (puertos y URLs; Docker Compose del back en `http://localhost:8080`), §1.2 (`VITE_API_BASE_URL` es solo origen y es pública), §1.3 (Swagger off en producción), §1.4 (CORS: origen exacto, `localhost:5173` y `localhost:5174`).
- `docs/frontend/analisis-front.md`: §7.5 (variables y puertos del front), §8.4 (CI `frontend`).
- `docs/despliegue.md`: "Arquitectura" (API en VM con Docker Compose; el túnel ve solo `api:8080`) y §7 (flags y configuración del contenedor). Leer solo para no duplicar ni contradecir la configuración del back.
- Compose del back, raíz del repo: `docker-compose.yml` líneas 14-15 (`Cors__AllowedOrigins__0` y `__1` desde `CORS_ORIGIN_BACKOFFICE` y `CORS_ORIGIN_PUBLIC`) y línea 49 (puerto en loopback con `127.0.0.1:`).
- `docs/frontend/tareas/INDEX.md`: FC13 (red), ownership de `frontend/docker-compose.yml` y `frontend/Dockerfile*`.

## 5. Archivos a crear o modificar

Bajo `frontend/`:

| Archivo | Dueño | Notas |
|---|---|---|
| `Dockerfile.backoffice` | T-20 | Ownership del INDEX (`Dockerfile*`). |
| `Dockerfile.web-publica` | T-20 | Ídem. |
| `docker/nginx.conf` | T-20 | Ownership del INDEX (RV-07 a). |
| `docker-compose.yml` | T-20 | Archivo propio del front. |
| `.dockerignore` | T-20 | |
| `.env.example` | T-20 | Solo placeholders de build (sección 7). |

No se modifican `frontend/package.json` ni `package-lock.json` (FC17).

## 6. Pasos de implementación

1. Crear `Dockerfile.backoffice` con dos etapas:
   - `FROM node:20-alpine AS build`. `WORKDIR /repo`. Copiar `package.json`, `package-lock.json` y los `package.json` de cada workspace; ejecutar `npm ci`. Después copiar el resto del código.
   - `ARG VITE_API_BASE_URL` y `ARG VITE_USE_MOCKS=false`. Declararlos con `ENV` solo en esta etapa para que Vite los incruste.
   - `RUN npm run build --workspace=apps/backoffice` (el nombre exacto del workspace lo define T-01).
   - `FROM nginx:1.27-alpine` (versión a fijar al implementar; ver sección 13). Copiar `docker/nginx.conf` a `/etc/nginx/conf.d/default.conf` y `apps/backoffice/dist` a `/usr/share/nginx/html`. `EXPOSE 80`.
2. Crear `Dockerfile.web-publica` con los mismos pasos, workspace `apps/web-publica`.
3. Crear `docker/nginx.conf`:
   - `listen 80;`, `root /usr/share/nginx/html;`, `index index.html;`.
   - `location / { try_files $uri $uri/ /index.html; }` (fallback de SPA).
   - Cabeceras `X-Content-Type-Options nosniff` y `Referrer-Policy strict-origin-when-cross-origin`.
   - `location ~* \.(js|css|woff2)$ { expires 1y; add_header Cache-Control "public, immutable"; }` (los assets de Vite tienen hash).
   - No `add_header Access-Control-Allow-Origin`: el CORS lo resuelve el back.
4. Crear `.dockerignore`: `**/node_modules`, `**/dist`, `.env`, `.env.*`, `!.env.example`, `.git`, `**/coverage`.
5. Crear `docker-compose.yml`:
   - Servicio `backoffice`: `build: { context: ., dockerfile: Dockerfile.backoffice, args: { VITE_API_BASE_URL: ${VITE_API_BASE_URL:-http://localhost:8080}, VITE_USE_MOCKS: ${VITE_USE_MOCKS:-false} } }`; `ports: ["127.0.0.1:5173:80"]`; `restart: unless-stopped`.
   - Servicio `web-publica`: igual con `Dockerfile.web-publica` y `127.0.0.1:5174:80`.
   - No definir `depends_on` ni red propia: el front no depende del back para arrancar (la API se consume desde el navegador).
6. Crear `frontend/.env.example` con `VITE_API_BASE_URL=http://localhost:8080` y `VITE_USE_MOCKS=false`.
7. Probar: `docker compose -f frontend/docker-compose.yml build`, luego `up -d`, abrir `http://localhost:5173` y `http://localhost:5174`.
8. Verificar CORS contra el back local con `CORS_ORIGIN_BACKOFFICE` y `CORS_ORIGIN_PUBLIC` por defecto (sección 10).
9. Verificar que las imágenes no contienen `.env` ni `node_modules` del host (`docker run --rm <imagen> ls /usr/share/nginx/html` y revisar que no haya `.env`).

## 7. Contrato con el back

No aplica: no hay requests. Variables de build:

```dotenv
# frontend/.env.example (placeholders; no son secretos)
VITE_API_BASE_URL=http://localhost:8080
VITE_USE_MOCKS=false
```

- `VITE_API_BASE_URL` es público: queda en el JavaScript del bundle. Nunca poner `X-Api-Key` ni secretos (convenciones §1.2).
- El valor de producción de la API es `https://api.nexaseguros.me` (convenciones §1.1, `docs/despliegue.md`).
- En el back, el origen de cada front se configura en la raíz con `CORS_ORIGIN_BACKOFFICE` y `CORS_ORIGIN_PUBLIC`. Deben coincidir exactamente con `http://localhost:5173` y `http://localhost:5174` en local (convenciones §1.4).

## 8. Contenido de UI

No aplica.

## 9. Estados y casos borde

- **Ruta profunda (`/clientes/123` en backoffice) con recarga:** nginx sirve `index.html` por el `try_files`; la app resuelve la ruta. Sin esto, 404 de nginx.
- **Build sin `VITE_API_BASE_URL`:** compose usa el default `http://localhost:8080`. En producción el valor debe pasarse explícitamente; si queda el default, el front llama a localhost del navegador del usuario.
- **Puerto 5173 o 5174 ocupado:** compose falla al publicar el puerto. No cambiar el mapeo sin cambiar también CORS del back.
- **Acceso por `127.0.0.1:5173` en lugar de `localhost:5173`:** el origen es distinto y CORS rechaza la llamada. Documentar en el README (US-FE-T-22).
- **Imagen reconstruida sin cambios en el código:** compose reutiliza la caché; `docker compose build --no-cache` solo si cambió el `package-lock.json`.

## 10. Tests requeridos

Esta tarea no tiene tests de unidad. Verificación con comandos y un script de chequeo:

| Verificación | Comando | Esperado |
|---|---|---|
| Build de la imagen backoffice | `docker compose -f frontend/docker-compose.yml build backoffice` | Termina sin error. |
| Build de la imagen web | `docker compose -f frontend/docker-compose.yml build web-publica` | Termina sin error. |
| Fallback SPA | `curl -sI http://localhost:5173/clientes/1` | `200` y el HTML de `index.html`. |
| Assets con cache | `curl -sI http://localhost:5173/assets/<archivo>.js` | `Cache-Control: public, immutable`. |
| Sin `.env` en la imagen | `docker run --rm --entrypoint sh <imagen> -c "ls -a /usr/share/nginx/html"` | No aparece `.env`. |
| Sin mocks | `docker run --rm --entrypoint sh <imagen> -c "grep -l mockServiceWorker /usr/share/nginx/html/* || true"` | Sin archivo del worker de MSW. Si aparece, `VITE_USE_MOCKS` se incrustó como `true`. |
| CORS con back local | Back levantado con su compose; desde `http://localhost:5173`, la consola no muestra error de CORS al consultar `GET /health` o un endpoint público | Sin error de CORS. |

## 11. Criterios de aceptación

1. Existen `frontend/Dockerfile.backoffice` y `frontend/Dockerfile.web-publica`, cada uno con etapa de build en `node:20-alpine` y etapa de servidor en nginx.
2. `frontend/docker-compose.yml` publica `127.0.0.1:5173:80` (backoffice) y `127.0.0.1:5174:80` (web pública).
3. `VITE_API_BASE_URL` y `VITE_USE_MOCKS` llegan como build args, no como variables de runtime.
4. Con `docker compose build` ambas imágenes construyen sin error.
5. `curl` a una ruta profunda devuelve `index.html` con código 200.
6. Los assets con hash tienen `Cache-Control: public, immutable`.
7. Ninguna imagen contiene `.env` ni `node_modules`.
8. Ninguna imagen contiene el worker de MSW (`VITE_USE_MOCKS=false`).
9. El compose de la raíz y `backend/Dockerfile` no aparecen en el diff.
10. Con el back local, los dos fronts se consultan sin error de CORS desde `localhost:5173` y `localhost:5174`.
11. No hay secretos en `.env.example` ni en el diff.

## 12. Verificación manual

1. En `frontend/`, copiar `.env.example` a `.env` local (no se commitea) y correr `docker compose up -d --build`.
2. Abrir `http://localhost:5173` y `http://localhost:5174`. Esperado: cada app carga su pantalla vacía (o el login del backoffice cuando exista).
3. Con el back de la raíz levantado (`docker compose up -d` en la raíz), abrir la consola del navegador en `http://localhost:5173` y recargar. Esperado: sin error de CORS.
4. `docker compose down` al terminar.

Pasos para confirmar con la persona responsable antes del PR (`docs/workflow.md`, regla 7).

## 13. Decisiones pendientes (con default)

1. **[CONFIRMAR] Hosting de producción del front:** NO DEFINIDO. `.env.example` de la raíz menciona dominios de Cloudflare Pages para los dos fronts (convenciones §1.4), pero no hay decisión. Default (RV-D19): esta tarea entrega imágenes que sirven en cualquier host; el hosting final se decide aparte y los orígenes se cargan en `CORS_ORIGIN_*` del back. No cerrar sin confirmación del equipo: infraestructura.
2. **Versión de nginx:** default `nginx:1.27-alpine`, fijada al implementar. Si la versión está fuera de soporte al momento de implementar, usar la vigente y dejar constancia en el PR.
3. **Publicación de imágenes en un registro:** NO DEFINIDO. Default: no se publican en esta tarea (solo build local o en la VM).
4. **Puerto de servicio interno:** default 80 dentro del contenedor, mapeado a 5173 y 5174 en el host.

## 14. Riesgos y errores comunes

- **Copiar `.env` al contenedor:** el `.dockerignore` lo evita; verificar con la prueba de la sección 10.
- **Pasar `VITE_*` como `ENV` en la etapa de servidor:** no tiene efecto; Vite las incrusta en build. Deben ir en la etapa de build.
- **Olvidar `try_files`:** las rutas profundas dan 404 al recargar.
- **Mapear `5173:5173`:** nginx escucha en 80. El mapeo correcto es `127.0.0.1:5173:80`.
- **Usar `localhost` en un build de producción:** el bundle llamaría al localhost de cada usuario. Pasar `VITE_API_BASE_URL` siempre.
- **Tocar el compose de la raíz para "unificar":** prohibido por el INDEX; el front tiene su propio compose.

## 15. Definición de terminado

- `lint`, `typecheck`, `test` y `build` del front en verde (requisito del job `frontend`, FC8).
- Ambas imágenes construyen y pasan las verificaciones de la sección 10.
- Sin secretos en el diff; `.env` no commiteado.
- Criterios 1 a 11 de la sección 11 tildados con evidencia observada (salida de `docker compose` y `curl`).

## 16. Observaciones al índice

- Resuelto (RV-07 a): `frontend/docker/nginx.conf` es de T-20 (fila de ownership del INDEX).
- Resuelto (RV-D19): hosting sin decidir; las imágenes sirven en cualquier host. La decisión de hosting queda pendiente de confirmación de infraestructura (sección 13, ítem 1).
- Resuelto (RV-01): §3 copia la fila del INDEX (T-14 y T-17). No se agrega T-16 ni las API cards.
