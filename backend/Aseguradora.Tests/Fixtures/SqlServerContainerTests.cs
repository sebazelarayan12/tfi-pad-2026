using System.Net;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Enums;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Aseguradora.Tests.Fixtures;

/// <summary>
/// The SQL Server container fixture. Tests that need Docker are skippable: they run only with
/// <c>ASEGURADORA_TESTS_DOCKER=1</c> and skip with a clear message otherwise. This class is also the
/// reference for fronts: <c>[Collection]</c> for the container, <c>IClassFixture</c> for the factory.
/// </summary>
[Collection(SqlServerCollection.Nombre)]
public class SqlServerContainerTests(SqlServerContainerFixture contenedor, AseguradoraWebFactory factory)
    : IClassFixture<AseguradoraWebFactory>
{
    [SkippableFact]
    public async Task Fixture_ConDocker_AplicaMigracionesYSeed()
    {
        Skip.IfNot(contenedor.Disponible, SqlServerContainerFixture.MotivoOmision);

        await using var contexto = contenedor.CrearContexto();

        Assert.Empty(await contexto.Database.GetPendingMigrationsAsync());
        Assert.True(await contexto.Planes.AnyAsync(p => p.Id == SeedData.PlanRcId && p.Codigo == "RC"));
        Assert.True(await contexto.Clientes.AnyAsync(c => c.Id == SeedData.ClienteId && c.Dni == "30123456"));
        Assert.True(await contexto.Vehiculos.AnyAsync(v => v.Id == SeedData.VehiculoId && v.Patente == "AB123CD"));
        Assert.True(await contexto.Polizas.AnyAsync(p =>
            p.Id == SeedData.PolizaId && p.Estado == EstadoPoliza.Vigente));
    }

    [SkippableFact]
    public async Task Factory_ConBase_HealthRespondeHealthy()
    {
        factory.UsarBase(contenedor);

        var respuesta = await factory.CreateClient().GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        Assert.Equal("Healthy", await respuesta.Content.ReadAsStringAsync());
    }

    [SkippableFact]
    public async Task Fixture_ConDocker_DisposeEliminaContenedor()
    {
        Skip.IfNot(SqlServerContainerFixture.DockerHabilitado, SqlServerContainerFixture.MotivoOmision);

        // Its own instance: disposing the shared one would break the other tests of the collection.
        var propio = new SqlServerContainerFixture();
        await propio.InitializeAsync();
        var conexion = new SqlConnectionStringBuilder(propio.ConnectionString)
        {
            ConnectTimeout = 3,
            Pooling = false
        }.ConnectionString;

        await using (var abierta = new SqlConnection(conexion))
            await abierta.OpenAsync();

        await propio.DisposeAsync();

        Assert.False(propio.Disponible);
        await Assert.ThrowsAnyAsync<SqlException>(async () =>
        {
            await using var cerrada = new SqlConnection(conexion);
            await cerrada.OpenAsync();
        });
    }

    [SkippableFact]
    public void Fixture_SinDocker_NoEstaDisponibleYNoExponeConexion()
    {
        Skip.If(SqlServerContainerFixture.DockerHabilitado, "Only meaningful without ASEGURADORA_TESTS_DOCKER=1.");

        Assert.False(contenedor.Disponible);
        Assert.Throws<InvalidOperationException>(() => contenedor.ConnectionString);
    }
}
