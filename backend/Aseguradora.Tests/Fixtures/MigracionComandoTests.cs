using Aseguradora.Api.Comandos;
using Aseguradora.Data;
using Aseguradora.Tests.Api;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Aseguradora.Tests.Fixtures;

/// <summary>
/// The <c>--migrar</c> command against a real SQL Server. Each test migrates its own empty database
/// inside the shared container, so it proves the first run (creates everything) and the second run
/// (changes nothing). Skipped unless <c>ASEGURADORA_TESTS_DOCKER=1</c>.
/// </summary>
[Collection(SqlServerCollection.Nombre)]
public class MigracionComandoTests(SqlServerContainerFixture contenedor)
{
    [SkippableFact]
    public async Task Migrar_ConBaseDisponible_TerminaConCero()
    {
        Skip.IfNot(contenedor.Disponible, SqlServerContainerFixture.MotivoOmision);
        var conexion = BaseVacia();
        await using var factory = CrearFactory(conexion);

        var codigo = await MigracionComando.EjecutarAsync(factory.Services);

        Assert.Equal(0, codigo);
        await using var contexto = CrearContexto(conexion);
        Assert.Empty(await contexto.Database.GetPendingMigrationsAsync());
        Assert.True(await contexto.Planes.AnyAsync());
        await contexto.Database.EnsureDeletedAsync();
    }

    [SkippableFact]
    public async Task Migrar_SegundaVez_EsIdempotente()
    {
        Skip.IfNot(contenedor.Disponible, SqlServerContainerFixture.MotivoOmision);
        var conexion = BaseVacia();
        await using var factory = CrearFactory(conexion);
        Assert.Equal(0, await MigracionComando.EjecutarAsync(factory.Services));
        var antes = await ContarAsync(conexion);

        var codigo = await MigracionComando.EjecutarAsync(factory.Services);

        Assert.Equal(0, codigo);
        Assert.Equal(antes, await ContarAsync(conexion));
        await using var contexto = CrearContexto(conexion);
        await contexto.Database.EnsureDeletedAsync();
    }

    private string BaseVacia() =>
        new SqlConnectionStringBuilder(contenedor.ConnectionString)
        {
            InitialCatalog = $"migrar_{Guid.NewGuid():N}"
        }.ConnectionString;

    private static ApiFactory CrearFactory(string conexion) =>
        new("Production", new Dictionary<string, string> { ["ConnectionStrings:Default"] = conexion });

    private static AseguradoraDbContext CrearContexto(string conexion) =>
        new(new DbContextOptionsBuilder<AseguradoraDbContext>().UseSqlServer(conexion).Options);

    private static async Task<(int Planes, int Clientes, int Polizas)> ContarAsync(string conexion)
    {
        await using var contexto = CrearContexto(conexion);
        return (await contexto.Planes.CountAsync(), await contexto.Clientes.CountAsync(),
            await contexto.Polizas.CountAsync());
    }
}
