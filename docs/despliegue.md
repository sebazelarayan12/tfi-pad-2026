# Despliegue — API en Azure con Cloudflare Tunnel

Procedimiento para publicar la API de Nexa Seguros en una VM de Azure, accesible por HTTPS desde Internet a través de un Cloudflare Tunnel con dominio propio. Implementa US-T-05 y cubre los puntos 11.1 a 11.5 de la spec.

## Arquitectura

```
Internet ──HTTPS──> Cloudflare (WAF, rate limiting) ──Tunnel──> cloudflared ──red interna──> api:8080 ──> sqlserver:1433
                                                                  └────────── VM Linux en Azure (solo SSH abierto) ──────────┘
```

- La API y la base corren en una VM de Azure con Docker Compose (tres servicios: `api`, `sqlserver`, `cloudflared`).
- Cloudflare es una capa de seguridad y acceso, no el lugar donde corre la API (11.1).
- El túnel sale desde la VM hacia Cloudflare: **no se abre ningún puerto de entrada salvo SSH (22)**.
- La API solo publica el puerto en `127.0.0.1` de la VM. Que `cloudflared` sea el único camino de entrada es lo que permite confiar en el header `CF-Connecting-IP` (11.4).

| Dato | Valor |
| --- | --- |
| Dominio | `nexaseguros.me` (DNS en Cloudflare, plan Free) |
| URL pública de la API | `https://api.nexaseguros.me` |
| Túnel | `nexaseguros-api`, ruta publicada `api.nexaseguros.me` → `http://api:8080` |
| VM | Azure for Students, región Chile Central, `Standard_B2als_v2` (2 vCPU, 4 GB RAM), Ubuntu Server 24.04 LTS x64, disco SSD estándar de 30 GB |
| Costo aproximado | 0,0526 USD/h (unos 38 USD al mes) más la IP pública estática. Una VM desasignada no cobra cómputo |

La VM debe ser **x64 con al menos 4 GB de RAM**: SQL Server 2022 solo corre en x64 y no arranca bien con menos.

## 1. Crear la VM en Azure

1. Portal de Azure → Máquinas virtuales → Crear.
2. Región con el tamaño disponible para la suscripción. En Azure for Students algunas regiones bloquean ciertos tamaños (por ejemplo `eastus` y `Brazil South` bloquearon la serie B). En el selector de tamaños, buscar `b2` y elegir uno que no figure en "Tamaño no disponible".
3. Imagen Ubuntu Server 24.04 LTS x64, autenticación por clave SSH (`azureuser`), puertos de entrada públicos: **solo SSH (22)**.
4. Disco SSD estándar de 30 GB; marcar "Eliminar IP pública y NIC al eliminar la VM".
5. Descargar la clave privada y guardarla fuera del repositorio (por ejemplo `~/.ssh/`). No se puede volver a descargar.
6. Anotar la IP pública de la VM.

Verificar el acceso:

```bash
ssh -i ~/.ssh/<clave>.pem azureuser@<IP_PUBLICA>
```

Si la conexión da timeout, revisar que el grupo de seguridad de red de la VM tenga una regla de entrada para el puerto 22.

## 2. Instalar Docker en la VM

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker azureuser   # requiere volver a abrir la sesión SSH
```

Si el usuario todavía no está en el grupo `docker`, anteponer `sudo` a los comandos `docker`.

## 3. Obtener el código

```bash
git clone https://github.com/sebazelarayan12/tfi-pad-2026.git ~/tfi
cd ~/tfi
git checkout development   # o la rama que se quiera desplegar
```

## 4. Configurar el `.env`

Los secretos van en `~/tfi/.env`, que **no se sube a Git**. En el repositorio solo existe `.env.example` con valores falsos. Crear el archivo en la VM y protegerlo:

```bash
nano ~/tfi/.env
chmod 600 ~/tfi/.env
```

Variables que lee `docker-compose.yml`:

| Variable | Uso | Valor en producción |
| --- | --- | --- |
| `ASPNETCORE_ENVIRONMENT` | Entorno de ASP.NET | `Production` |
| `MSSQL_SA_PASSWORD` | Clave del usuario `sa` (mayúscula, minúscula, número y símbolo; evitar `+`, `/` y `=`) | Aleatoria |
| `MSSQL_MEMORY_LIMIT_MB` | Tope de memoria de SQL Server | `2048` en una VM de 4 GB (el valor por defecto, 4096, dejaría sin memoria al resto) |
| `JWT_KEY` | Clave de firma del JWT | Aleatoria, 64 caracteres o más |
| `MIGRACIONES_APLICAR_AL_INICIAR` | Migrar al arrancar la API | `false` (se migra a mano con `--migrar`) |
| `SWAGGER_HABILITADO` | Publicar Swagger | `false` |
| `SEED_ADMINISTRADOR_EMAIL` y `SEED_ADMINISTRADOR_PASSWORD` | Administrador inicial | Los del equipo |
| `APIKEY_PASARELA1` y `APIKEY_PASARELA2` | Claves que las pasarelas envían en `X-Api-Key` para llamar al webhook. Las define Nexa y se entregan a cada grupo | Aleatorias |
| `INTEGRACIONES_RENAPER_APIKEY`, `INTEGRACIONES_DNRPA_APIKEY`, `INTEGRACIONES_ARCA_APIKEY`, `INTEGRACIONES_PASARELA1_APIKEY` y `INTEGRACIONES_PASARELA2_APIKEY` | Claves con las que la API llama a los servicios de otros grupos. Las emite cada grupo | Las reales cuando existan; mientras tanto, un valor cualquiera |
| `CORS_ORIGIN_BACKOFFICE` y `CORS_ORIGIN_PUBLIC` | Orígenes permitidos (dominios de Cloudflare Pages de los dos fronts) | Dominios de Pages |
| `CLOUDFLARE_TUNNEL_TOKEN` | Token del conector del túnel | Ver el paso 6 |

Para generar valores aleatorios:

```bash
openssl rand -base64 48        # JWT_KEY y API keys
openssl rand -hex 24           # base para claves sin símbolos; agregar al final "Aa1!"
```

Para cambiar una clave de otro grupo cuando la entreguen: editar la línea del `.env` y recrear la API con `docker compose up -d --force-recreate api`.

## 5. Levantar la base y migrar

```bash
cd ~/tfi
docker compose build api
docker compose up -d sqlserver          # esperar a que figure "healthy": docker compose ps
docker compose run --rm api --migrar
```

`--migrar` aplica las migraciones de EF Core, ejecuta los seeders idempotentes (planes, roles, administrador inicial) y **termina con código 0**. Si algo falla, termina con código 1 y deja el error en el log. Es idempotente: se puede ejecutar de nuevo en cada despliegue sin efectos adicionales.

Para verificarlo:

```bash
docker compose run --rm api --migrar; echo "codigo: $?"     # 0
docker compose run --rm api --migrar; echo "codigo: $?"     # 0 de nuevo
```

## 6. Cloudflare

### 6.1 Dominio y DNS

El dominio `nexaseguros.me` se registró con el beneficio de GitHub Student Pack (Namecheap, primer año gratis, renovación automática desactivada). Sus nameservers apuntan a Cloudflare (plan Free). Al crear el túnel con un nombre de host, Cloudflare crea solo el registro `CNAME api` → `<id-del-túnel>.cfargotunnel.com`, con proxy activado.

### 6.2 Túnel con nombre

1. Zero Trust → Networks → Tunnels → crear un túnel `cloudflared` llamado `nexaseguros-api`.
2. En el túnel, agregar una **ruta de aplicación publicada**: hostname `api.nexaseguros.me`, servicio `http://api:8080`. Apunta a `api` porque `cloudflared` corre en la misma red de Docker Compose y resuelve el nombre del servicio.
3. Elegir el entorno **Docker** en "Install and run connectors" y copiar el comando. El **token** es solo la cadena larga (más de 150 caracteres, empieza con `eyJ`) que va después de `--token`.
4. Ponerlo en el `.env` de la VM, en una sola línea, sin comillas ni espacios:

   ```
   CLOUDFLARE_TUNNEL_TOKEN=eyJ...
   ```

   Errores frecuentes: pegar el Tunnel ID (un UUID) en lugar del token, o pegar el comando completo. En ambos casos `cloudflared` termina con "Provided Tunnel token is not valid".
5. No poner el token en el `.env` de ninguna otra máquina ni en archivos versionados: dos conectores con el mismo token reparten el tráfico y los pedidos que caen fuera de la VM fallan.

### 6.3 Levantar el túnel

El servicio `cloudflared` está en el perfil `tunnel` del compose:

```bash
cd ~/tfi
docker compose --profile tunnel up -d
docker compose logs cloudflared | grep -i "Registered tunnel connection"
```

Deben aparecer varias conexiones registradas (el panel de Cloudflare pasa a "Healthy").

### 6.4 Seguridad en el borde (11.1, 11.4 y 11.5)

Configurar en el panel de Cloudflare, sobre la zona `nexaseguros.me`:

| Elemento | Configuración | Motivo |
| --- | --- | --- |
| Managed Rules (WAF) | Activar el conjunto gratuito | Bloquea ataques web comunes. Inspecciona cuerpos de hasta 1 MB |
| Rate limiting | Una regla sobre `/api/publico/*` contando por IP, ventana de 10 s | Filtro grueso del borde. **No aplica RN20**: la regla gratuita no llega a "10 intentos por minuto". RN20 la aplica el limitador de la API con la IP real (F1) |
| Bot Fight Mode | **Apagado** | `/api/webhooks` y `/api/externo` los llaman servidores de otros grupos y el modo puede desafiar ese tráfico. En el plan gratuito no se puede excluir con reglas propias. Esas rutas se protegen con `X-Api-Key` y WAF |

### 6.5 IP real del cliente (RN20)

Detrás del túnel la API ve la dirección de `cloudflared`. `ClientIpResolver` (límite RN20 de `/api/publico/*`) lee la IP del header `CF-Connecting-IP`, pero solo cuando la conexión viene de una red listada en `ForwardedHeaders:RedesConfiables`; si no, usa la IP de la conexión. El middleware `ForwardedHeaders` de `Program.cs` ya no toca la IP, solo restaura el esquema (`X-Forwarded-Proto`).

El compose completa esa lista con `REDES_CONFIABLES` (por defecto `172.16.0.0/12`, el rango privado de Docker donde vive `cloudflared`). Si se vacía, el header se ignora y todos los visitantes comparten un único contador de 10 intentos por minuto. Es seguro confiar en el header porque la API **no publica puertos a la red** (solo `127.0.0.1` en la VM) y la VM solo tiene el SSH abierto: la única vía de entrada es el túnel.

## 7. Flags y configuración del contenedor

| Elemento | Detalle |
| --- | --- |
| `Swagger__Habilitado` | Controla `UseSwagger`/`UseSwaggerUI`. Por defecto `true` en Development y `false` en Production. En compose viene de `SWAGGER_HABILITADO` (por defecto `false`) |
| `--migrar` | Argumento de la API: migra, siembra y termina. Ver el paso 5 |
| `TimeProvider` | Registrado como singleton con `TimeProvider.System`. Las fechas de negocio (RN08, RN09, RN14) se calculan con él, no con `DateTime.Now`, en la zona `America/Argentina/Buenos_Aires` |
| `TZ` | `America/Argentina/Buenos_Aires` en el contenedor de la API |
| `tzdata` | La imagen de ASP.NET trae un sistema mínimo; el `Dockerfile` instala `tzdata` para que exista `/usr/share/zoneinfo/America/Argentina/Buenos_Aires` |
| `healthcheck` | `curl http://localhost:8080/health` (la imagen instala `curl`). `GET /health` consulta la base |
| Réplicas | Una sola `api`. Con dos, `VencimientosJob` correría dos veces |

La zona horaria del contenedor se comprueba con:

```bash
docker compose exec api ls /usr/share/zoneinfo/America/Argentina/Buenos_Aires
docker compose exec api date          # debe mostrar -03
```

## 8. Verificación final

Desde cualquier máquina con Internet:

```bash
curl -i https://api.nexaseguros.me/health                 # 200
curl -i https://api.nexaseguros.me/swagger/index.html     # 404 (Swagger deshabilitado)
```

En la VM:

```bash
docker compose --profile tunnel ps          # api y sqlserver "healthy", cloudflared "Up"
docker compose run --rm api --migrar        # código 0, repetible
```

Un `530` desde Cloudflare indica que el túnel no tiene un conector activo: revisar `docker compose logs cloudflared`.

### Pendiente: webhook con `X-Api-Key` por el túnel

El criterio "un request con `X-Api-Key` válido llega a `/api/webhooks/pasarela/{proveedor}` por el túnel y el limitador ve la IP del cliente" **depende de US-F4-05** (`WebhooksController`) y de F1 (limitador de RN20), que todavía no existen en el código. Hoy esa ruta responde 404 desde la propia API, lo que confirma que el túnel y la API funcionan.

Cuando F4-05 esté desplegada, verificar con la clave real de la pasarela (sin pegarla en chats ni en archivos versionados):

```bash
curl -i -X POST https://api.nexaseguros.me/api/webhooks/pasarela/pasarela1 \
  -H "X-Api-Key: <APIKEY_PASARELA1>" -H "Content-Type: application/json" -d "{}"
```

Resultado esperado: la API responde (por ejemplo 400 o 422 por el cuerpo vacío), no 401. Con una clave inválida debe responder 401. Para la IP real, repetir pedidos al limitador de F1 desde dos redes distintas y comprobar que cuentan por separado.

## 9. Operación

- **Actualizar la API:** traer los cambios (`git pull`), `docker compose build api`, `docker compose run --rm api --migrar` y `docker compose --profile tunnel up -d`.
- **Ahorrar crédito:** apagar la VM desde el portal ("Detener" deja la VM desasignada y no cobra cómputo). El autoapagado no está disponible en la región Chile Central. Al encenderla de nuevo, los tres servicios arrancan solos (`restart: unless-stopped` en el compose), siempre que no se hayan detenido a mano con `docker compose stop`; en ese caso, `docker compose --profile tunnel up -d`.
- **Datos de SQL Server:** viven en el volumen `sqlserver-data`. Los backups no están definidos en la spec: pendiente de decisión del equipo.
- **Costos:** controlar el crédito de Azure for Students en Cost Management. La IP pública estática se cobra aunque la VM esté apagada.
