# Nexa Seguros: front

## Qué es

Monorepo con npm workspaces que contiene:

- **Apps:** `apps/backoffice` (empleados y administración) y `apps/web-publica` (clientes, sin login).
- **Paquetes compartidos:** `@nexa/ui` (componentes y tokens), `@nexa/api` (cliente HTTP, DTO, mocks MSW) y `@nexa/config` (configuración de lint, TypeScript y Vitest).

El análisis completo (rutas, features, flujos) está en [`docs/frontend/analisis-front.md`](../docs/frontend/analisis-front.md). Este archivo no lo repite.

## Requisitos

- Node 20 LTS o superior (`.nvmrc` fija `20`) y npm. El monorepo usa npm workspaces: no usar pnpm ni yarn.
- Docker, solo para levantar el back o el front en contenedores.

## Instalación

Desde `frontend/`:

```bash
npm ci
```

## Comandos

Todos se corren desde `frontend/`.

| Comando                      | Qué hace                                                                     |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `npm run lint`               | ESLint sobre todo el monorepo                                                |
| `npm run typecheck`          | `tsc --noEmit` en cada workspace                                             |
| `npm test`                   | Vitest en cada workspace                                                     |
| `npm run build`              | Build de las dos apps                                                        |
| `npm run format:check`       | Prettier en modo verificación                                                |
| `npm run test:contract`      | Tests de contrato de `@nexa/api` contra MSW                                  |
| `npm run test:contract:real` | Los mismos contra el back real (ver `packages/api/test/contract/harness.ts`) |

Por app (`--workspace=@nexa/backoffice` o `--workspace=@nexa/web-publica`):

| Comando                           | Qué hace                       |
| --------------------------------- | ------------------------------ |
| `npm run dev --workspace=<app>`   | Servidor de desarrollo de Vite |
| `npm run build --workspace=<app>` | Build de producción de esa app |

## Puertos

| App         | Puerto |
| ----------- | ------ |
| Backoffice  | `5173` |
| Web pública | `5174` |

Los dos usan `strictPort`: si el puerto está ocupado, Vite falla en lugar de moverse a otro.

Abrir siempre `http://localhost:5173` y `http://localhost:5174`, **no** `127.0.0.1`. El CORS del back compara el origen exacto (esquema, host y puerto), y `127.0.0.1` se rechaza.

## Variables de entorno

Cada app tiene su `.env.example`; copiarlo a `.env` (no se commitea). Las variables `VITE_*` quedan en el bundle y son **públicas**: nunca poner claves, tokens ni contraseñas.

| Variable            | Qué es                           | Local                   | Producción                   |
| ------------------- | -------------------------------- | ----------------------- | ---------------------------- |
| `VITE_API_BASE_URL` | Origen del back, sin `/api`      | `http://localhost:8080` | `https://api.nexaseguros.me` |
| `VITE_USE_MOCKS`    | `true` usa MSW en lugar del back | `true` o `false`        | siempre `false`              |

Valores de los `.env.example`: backoffice `VITE_USE_MOCKS=false`, web pública `VITE_USE_MOCKS=true`. El `frontend/.env.example` alimenta los build args de `docker-compose.yml`.

Una variable vacía produce un error de llamada o de build. Si el front no encuentra el back, revisar primero estas dos.

## Trabajar con mocks (MSW)

1. Poner `VITE_USE_MOCKS=true` en el `.env` de la app.
2. Levantar la app con `npm run dev --workspace=<app>`.

El worker `public/mockServiceWorker.js` ya está commiteado en cada app. Solo el bootstrap de `src/main.tsx` lee el flag: ningún otro archivo debe leer `VITE_USE_MOCKS`. Ese bootstrap lo agregan US-FE-B-01 (backoffice) y US-FE-W-06 (web pública); hasta que estén mergeadas, el flag no activa nada en esa app.

Los handlers y fixtures viven en `packages/api/mocks/`. Para un endpoint que el back no tiene, el mock es el contrato provisional y el hueco se registra en `docs/frontend/pedidos-al-back.md`.

Para un build de despliegue, usar siempre `VITE_USE_MOCKS=false`.

## Conectar con el back real

1. En la raíz del repo: `docker compose up -d` (el back queda en `http://localhost:8080`).
2. En el `.env` de la app: `VITE_API_BASE_URL=http://localhost:8080` y `VITE_USE_MOCKS=false`.
3. Abrir la app en `http://localhost:5173` o `http://localhost:5174`. El back solo acepta esos dos orígenes.

## Docker del front

Para correr las dos apps como imágenes estáticas (nginx):

```bash
docker compose -f frontend/docker-compose.yml up -d --build
```

Se corre desde la raíz del repo. Publica `5173` (backoffice) y `5174` (web pública) solo en loopback. No necesita el back para arrancar. Para producción, ver `docs/despliegue.md`.

## Cómo agregar una feature

Cada app organiza el código en `src/features/<dominio>/`:

1. Crear la carpeta con `api/`, `components/`, `pages/`, `schemas/`, `types/` e `index.ts`.
2. El `index.ts` es lo único que otro feature puede importar. `eslint-plugin-boundaries` rechaza el resto.
3. Declarar las rutas en el `routes.tsx` del feature. El router de `app/` solo las compone: rutas estáticas antes que dinámicas.
4. Los DTO y las funciones de request que comparten varios features van en `@nexa/api`, no en el feature.
5. Los features no importan de `app/`.

Detalle y razones en [`00-decisiones-base.md`](../docs/frontend/00-decisiones-base.md) (FB3) y en las convenciones FC1 y FC14 del [INDEX](../docs/frontend/tareas/INDEX.md).

## Reglas de ownership

Un archivo compartido tiene un único dueño: nadie edita un archivo ajeno salvo lo que la ficha de su tarea autoriza. Los barrels (`index.ts`) se amplían por bloques, uno por tarea. Cada tarea que agregue un script o una variable de entorno actualiza este README en su PR.

La tabla de dueños está en [`tareas/INDEX.md`, sección "Ownership de archivos compartidos"](../docs/frontend/tareas/INDEX.md#ownership-de-archivos-compartidos).

## Pruebas

- **Componentes y hooks:** Vitest con Testing Library y `jest-dom` (`npm test`).
- **Accesibilidad:** `expectSinViolacionesA11y` de `@nexa/ui/testing` en las pantallas; los primitivos usan `vitest-axe` directo.
- **API:** tests por endpoint con MSW y tests de contrato (`npm run test:contract`).
- **Calidad de React:** antes de abrir un PR que toque `frontend/`, correr `npx -y react-doctor@latest . --yes --verbose` y llegar a 100/100.

Los tests de extremo a extremo (US-FE-T-21) todavía no están mergeados; cuando lo estén, esta sección suma su comando.

## Problemas frecuentes

- **Error de CORS en el navegador:** se abrió la app con `127.0.0.1` o en otro puerto. Usar `localhost` y los puertos 5173 o 5174.
- **`Port 5173 is already in use`:** `strictPort` está activo. Cerrar lo que ocupa el puerto.
- **Las llamadas van a un host raro o fallan al construir:** falta `VITE_API_BASE_URL` en el `.env`.
- **Datos de mock en un despliegue:** el build se hizo con `VITE_USE_MOCKS=true`. Reconstruir con `false`.

## Documentos del proyecto

- [Decisiones base del front](../docs/frontend/00-decisiones-base.md)
- [Índice de tareas](../docs/frontend/tareas/INDEX.md)
- [Workflow del equipo](../docs/workflow.md)
