# TFI PAD 2026 — Aseguradora de Vehículos

Sistema de gestión para una aseguradora de autos, motos y camionetas: clientes, vehículos, cotizaciones, pólizas, cuotas mensuales y cobros. Es el Trabajo Final Integrador de Programación de Aplicaciones Distribuidas (UTN, 4.º año), y se integra con los sistemas de otros grupos de la cursada.

> [!NOTE]
> **Estado:** el back (API, datos, integraciones mock y tests) está en desarrollo y desplegado en `https://api.nexaseguros.me`. Los fronts en React y varios endpoints todavía no existen. Las tareas se siguen en [`docs/tareas-divididas.md`](docs/tareas-divididas.md).

## Qué hace

Una persona quiere asegurar su vehículo. Un empleado la da de alta y el sistema valida su identidad (Renaper) y que sea la titular del vehículo (DNRPA). Después cotiza un plan, emite la póliza y genera una cuota por mes de vigencia (1, 6 o 12). El cliente paga online o en efectivo. Si deja de pagar, la póliza se suspende y deja de cubrir.

- **Dentro del alcance:** clientes, vehículos, planes, cotizaciones, pólizas, cuotas, pagos, facturas, usuarios con roles, integraciones (con mocks), cobro por Pago Fácil con código de barras y servicios para otros grupos.
- **Fuera por ahora:** los fronts en React, siniestros y renovación automática.

| Actor | Qué hace |
| --- | --- |
| Cliente | Sin usuario. Consulta su póliza y paga cuotas en la web con DNI y número de póliza |
| Empleado | Carga y valida clientes, vehículos, cotizaciones y pólizas; cancela pólizas y consulta pagos |
| Administrador | Todo lo del empleado, más gestionar planes y usuarios |

### Ciclo de vida de una póliza

```mermaid
stateDiagram-v2
    [*] --> Pendiente: emisión
    Pendiente --> Vigente: se paga la cuota 1
    Pendiente --> Cancelada: vence la cuota 1 sin pagar
    Vigente --> Suspendida: 2 cuotas vencidas impagas
    Suspendida --> Vigente: se pagan las vencidas
    Vigente --> Vencida: llega la fecha de fin
```

La cancelación manual por un empleado también existe; el detalle de las transiciones sigue en revisión.

## Arquitectura

API REST en C# .NET 8 con SQL Server y Entity Framework Core, en cinco capas dentro de una misma solución.

| Proyecto | Responsabilidad |
| --- | --- |
| `Aseguradora.Domain` | Entidades, enums y reglas propias de cada entidad |
| `Aseguradora.Data` | `DbContext`, configuraciones de EF Core, repositorios, migraciones y seed |
| `Aseguradora.Application` | Servicios de casos de uso, DTOs, excepciones e interfaces de servicios externos |
| `Aseguradora.Integrations` | Implementaciones mock y reales de cada servicio externo |
| `Aseguradora.Api` | Controllers, middleware, autenticación, Swagger y tarea programada de vencimientos |

```mermaid
flowchart LR
    Api --> Application
    Api --> Data
    Api --> Integrations
    Integrations --> Application
    Data --> Domain
    Application --> Domain
```

Los consumidores serán dos fronts en React (etapa posterior): un backoffice para empleados y una web pública para clientes. Autenticación con JWT para empleados y administradores, y API key (`X-Api-Key`) para otros grupos.

## Integraciones

Cada servicio externo se usa detrás de una interfaz con dos implementaciones: un mock con datos de prueba y la real. Se elige por configuración, así nadie queda bloqueado esperando a otro grupo.

| Servicio | Rol | Estado |
| --- | --- | --- |
| Renaper | Valida personas | Otro grupo, mock por ahora |
| ARCA (AFIP) | Autoriza facturas (CAE) | Otro grupo, mock por ahora |
| Pasarelas de pago (2) | Cobro online con webhook | Dos grupos, mock por ahora |
| DNRPA | Valida vehículo y titular | Mock propio |
| Pago Fácil | Cobro en efectivo con código de barras de 42 dígitos | Simulado por nosotros |

Servicios que ofrecemos a otros grupos: seguro vigente por patente, deuda por DNI, cotización externa y webhook de pagos.

## API

Swagger lo controla `SWAGGER_HABILITADO` en el `.env`: viene en `true` en `.env.example` (local) y apagado por defecto en producción.

| Área | Ruta base | Acceso | Estado |
| --- | --- | --- | --- |
| Autenticación y usuarios | `/api/auth` | Público / Admin | Disponible |
| Planes | `/api/planes` | Público (lectura) / Admin | Disponible |
| Vehículos | `/api/vehiculos` | Empleado | Disponible |
| Pólizas | `/api/polizas` | Empleado | Disponible |
| Pago Fácil | `/api/pagofacil` | Empleado | Parcial |
| Seguro vigente (externo) | `/api/externo` | API key | Disponible |
| Clientes, cotizaciones, pagos | `/api/clientes`, `/api/cotizaciones`, `/api/pagos` | Empleado | Pendiente |
| Web pública | `/api/publico` | Sin login, con DNI y número de póliza | Parcial |
| Webhooks de pasarelas | `/api/webhooks` | API key | Pendiente |

## Correr en local

Requisitos: Docker y el SDK de .NET 8.

```bash
cp .env.example .env   # completar los valores; nunca se sube a Git
docker compose up -d --build --wait   # espera a que la API esté healthy (puede tardar un minuto)
curl http://localhost:8080/health
```

> [!IMPORTANT]
> La API no arranca si faltan `FACTURACION_CUIT` y `FACTURACION_PUNTO_VENTA` en el `.env`.

Tests del back:

```bash
cd backend
dotnet test
```

Las pruebas de integración con SQL Server solo corren con `ASEGURADORA_TESTS_DOCKER=1` (y Docker disponible); sin esa variable se omiten. Detalle en [`backend/Aseguradora.Tests/README.md`](backend/Aseguradora.Tests/README.md).

## Trabajar en el proyecto

El flujo es obligatorio para personas y asistentes de IA: una tarjeta de Trello, una rama y un PR hacia `development`. Nunca se commitea directo en `main` ni en `development`.

```
main  ←  development  ←  feature/US-XX-nombre-descriptivo
```

Detalle completo en [`docs/workflow.md`](docs/workflow.md).

> [!IMPORTANT]
> Los asistentes de IA leen [`AGENTS.md`](AGENTS.md) o [`CLAUDE.md`](CLAUDE.md), que les indican seguir ese flujo. Lo que realmente bloquea los pushes directos es la protección de ramas de GitHub.

## Documentación

- [`docs/workflow.md`](docs/workflow.md): flujo de ramas, Trello y PRs.
- [`docs/tareas-divididas.md`](docs/tareas-divididas.md): una sección por tarjeta, con criterios de aceptación.
- [`docs/despliegue.md`](docs/despliegue.md): API en Azure con Cloudflare Tunnel.
- [`docs/pagos-mocks.md`](docs/pagos-mocks.md) y [`docs/aprobacion-pagos.md`](docs/aprobacion-pagos.md): pasarelas mock y aprobación de pagos.
- `docs/AnalisisBack.md`: spec completa del back (casos de uso, reglas de negocio, modelo de datos, endpoints y contratos de integración). No está versionada: pedírsela al equipo.