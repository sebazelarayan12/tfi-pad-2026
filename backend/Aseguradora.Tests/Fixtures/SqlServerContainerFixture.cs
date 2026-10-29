using Aseguradora.Data;
using Microsoft.EntityFrameworkCore;
using Testcontainers.MsSql;

namespace Aseguradora.Tests.Fixtures;

/// <summary>
/// SQL Server 2022 in a throwaway container, migrated and seeded. It only starts when
/// <c>ASEGURADORA_TESTS_DOCKER=1</c>; otherwise it does nothing and <see cref="Disponible"/> is false,
/// so tests that need it skip with <see cref="MotivoOmision"/> instead of failing.
/// </summary>
public sealed class SqlServerContainerFixture : IAsyncLifetime
{
    public const string VariableDocker = "ASEGURADORA_TESTS_DOCKER";

    public const string MotivoOmision =
        $"Docker tests are off: start Docker Desktop and set {VariableDocker}=1 to run them.";

    // Same tag as docker-compose.yml, so the tests run against the database the team runs locally.
    private const string Imagen = "mcr.microsoft.com/mssql/server:2022-latest";

    private MsSqlContainer? _contenedor;

    public static bool DockerHabilitado =>
        Environment.GetEnvironmentVariable(VariableDocker) == "1";

    /// <summary>True once the container is running, migrated and seeded.</summary>
    public bool Disponible => _contenedor is not null;

    public string ConnectionString =>
        _contenedor?.GetConnectionString()
        ?? throw new InvalidOperationException(MotivoOmision);

    public async Task InitializeAsync()
    {
        if (!DockerHabilitado)
            return;

        var contenedor = new MsSqlBuilder(Imagen).Build();
        // StartAsync returns once SQL Server accepts connections.
        await contenedor.StartAsync();

        // The seed of SeedData is part of the model (HasData), so migrating also seeds it.
        await using (var contexto = CrearContexto(contenedor.GetConnectionString()))
            await contexto.Database.MigrateAsync();

        _contenedor = contenedor;
    }

    public async Task DisposeAsync()
    {
        if (_contenedor is not null)
            await _contenedor.DisposeAsync();
        _contenedor = null;
    }

    public AseguradoraDbContext CrearContexto() => CrearContexto(ConnectionString);

    private static AseguradoraDbContext CrearContexto(string connectionString) =>
        new(new DbContextOptionsBuilder<AseguradoraDbContext>().UseSqlServer(connectionString).Options);
}
