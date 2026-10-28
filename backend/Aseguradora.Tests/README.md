# Aseguradora.Tests

Pruebas del back (xUnit; fakes escritos a mano, sin Moq ni FluentAssertions). Este archivo es la guía de la infraestructura compartida de US-T-03.

## Correr los tests

```powershell
dotnet test
```

Sin Docker las pruebas de contenedor se **omiten** con un mensaje claro y `dotnet test` queda en verde. Para correrlas (Docker Desktop encendido):

```powershell
$env:ASEGURADORA_TESTS_DOCKER = "1"
dotnet test
```

El CI no define la variable: no corre las pruebas de contenedor. Si el equipo quiere correrlas en el CI, se agrega un job aparte (los runners de GitHub traen Docker).

## Fixtures (`Fixtures/`)

| Clase | Para qué |
|-------|----------|
| `SqlServerContainerFixture` | SQL Server 2022 en contenedor, migrado y con el seed de `SeedData`. Solo arranca con `ASEGURADORA_TESTS_DOCKER=1`; si no, `Disponible` es `false`. El contenedor se elimina al terminar. |
| `SqlServerCollection` | Comparte un solo contenedor entre las clases con `[Collection(SqlServerCollection.Nombre)]`. |
| `AseguradoraWebFactory` | La API levantada en memoria. Sin argumentos de constructor: se configura con propiedades antes del primer `CreateClient()`. |
| `TestAuthHandler` | Ocupa el esquema `Bearer` en lugar del JWT y lee el rol de `X-Test-Role` (`Administrador` o `Empleado`) y el usuario de `X-Test-UserId`. Un rol inexistente responde 401. |

### Cómo escribir una prueba de integración

```csharp
[Collection(SqlServerCollection.Nombre)]
public class MiFrenteTests(SqlServerContainerFixture contenedor, AseguradoraWebFactory factory)
    : IClassFixture<AseguradoraWebFactory>
{
    [SkippableFact]                       // necesita Docker: se omite sin la variable
    public async Task Algo()
    {
        factory.UsarBase(contenedor);     // omite la prueba si no hay contenedor
        var cliente = factory.CrearCliente(Roles.Empleado);
        // ...
    }
}
```

- Sin base (por defecto) la API apunta a un puerto cerrado: lo que toque la base falla rápido. Las pruebas que no necesitan base usan `[Fact]` normal.
- Con `UsarBase`, el host migra y corre los `ISeeder` al arrancar (`Migraciones:AplicarAlIniciar`).
- `UsarAutenticacionReal = true` deja la autenticación JWT real (solo Frente 1). Con `false`, `CrearCliente(rol)` devuelve un cliente con `X-Test-Role`.
- `Ajustes` agrega configuración; `ConfigurarServicios` agrega registros de servicios.

### Mocks forzados

El factory fuerza `Integraciones:<sección>:UsarMock = true` aunque la configuración diga `false`. La configuración no admite comodines, así que las secciones están en `AseguradoraWebFactory.IntegracionesForzadasAMock`:

`Renaper`, `Dnrpa`, `Arca`, `Pasarelas:pasarela1`, `Pasarelas:pasarela2`

**Si tu tarea agrega una integración nueva, agregá su sección a esa lista.**

## Builders (`Builders/`)

`ClienteBuilder`, `VehiculoBuilder`, `PlanBuilder`, `PolizaBuilder` y `CuotaBuilder` producen entidades válidas por defecto (RN01, RN03, RN07) y únicas en cada llamada (DNI, email, patente, código de plan y número de póliza no chocan entre sí ni con el seed). Se ajustan con `Con(entidad => ...)`. Cada frente agrega los suyos heredando de `TestBuilder<TEntidad, TBuilder>`.

## Regla de migraciones (C6)

Aplica a todas las tareas que agregan migraciones:

1. Cada tarea genera su migración solo después de rebasear sobre `development`.
2. Nadie edita una migración ajena (`Migrations/*.cs` ni `AseguradoraDbContextModelSnapshot.cs` de otra tarea).
3. Si el `ModelSnapshot` choca en un merge: se borra la migración propia, se rebasea y se regenera con `dotnet ef migrations add`. Nunca se resuelve a mano.
4. Orden de migraciones: F1-02 (Identity) va primero entre las de la primera ola; F3 (tabla de control del job, si hace falta) y F4 (`RowVersion`) migran después, rebaseando. El seed de planes de F2 no migra: es un `ISeeder`.
5. Una sola persona crea migraciones a la vez por frente.

## Otros fixtures

- `Data/SqliteDbFixture`: SQLite en memoria con el modelo real, para pruebas de Data sin SQL Server. Lo que depende del provider (índices únicos, `decimal`, transacciones) se prueba con SQL Server.
- `Api/ApiFactory`: API en memoria de las pruebas de la Fase 0 (`/health`, Swagger, CORS).
