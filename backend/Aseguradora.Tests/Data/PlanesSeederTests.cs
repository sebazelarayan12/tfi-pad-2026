using Aseguradora.Data;
using Aseguradora.Data.Seed;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Aseguradora.Tests.Data;

public sealed class PlanesSeederTests : IDisposable
{
    private readonly SqliteDbFixture _fixture = new();

    public void Dispose() => _fixture.Dispose();

    [Fact]
    public async Task SembrarAsync_agrega_TC_y_TR_con_codigos_unicos()
    {
        await EjecutarSeederAsync();

        await using var context = _fixture.CreateContext();
        var planes = await context.Planes.OrderBy(p => p.Codigo).ToListAsync();

        Assert.Equal(["RC", "TC", "TR"], planes.Select(p => p.Codigo).ToArray());

        var rc = planes.Single(p => p.Codigo == "RC");
        Assert.Equal(SeedData.PlanRcId, rc.Id);
        Assert.Equal(12000.00m, rc.PrimaBase);

        var tc = planes.Single(p => p.Codigo == "TC");
        Assert.Equal(PlanesSeeder.PlanTcId, tc.Id);
        Assert.Equal(PlanesSeeder.PrimaBaseTc, tc.PrimaBase);
        Assert.Equal("Auto,Moto,Camioneta", tc.TiposPermitidos);
        Assert.Null(tc.AntiguedadMaxima);
        Assert.True(tc.Activo);

        var tr = planes.Single(p => p.Codigo == "TR");
        Assert.Equal(PlanesSeeder.PlanTrId, tr.Id);
        Assert.Equal(PlanesSeeder.PrimaBaseTr, tr.PrimaBase);
        Assert.Equal("Auto,Camioneta", tr.TiposPermitidos);
        Assert.Equal(PlanesSeeder.AntiguedadMaximaTr, tr.AntiguedadMaxima);
        Assert.True(tr.Activo);
    }

    [Fact]
    public async Task SembrarAsync_dos_veces_no_duplica_planes()
    {
        await EjecutarSeederAsync();
        await EjecutarSeederAsync();

        await using var context = _fixture.CreateContext();
        Assert.Equal(3, await context.Planes.CountAsync());
    }

    private async Task EjecutarSeederAsync()
    {
        var services = new ServiceCollection();
        services.AddScoped<AseguradoraDbContext>(_ => _fixture.CreateContext());
        services.AddScoped<ISeeder, PlanesSeeder>();

        await using var provider = services.BuildServiceProvider();
        await SeedData.EjecutarAsync(provider);
    }
}
