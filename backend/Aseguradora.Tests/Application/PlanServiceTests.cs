using Aseguradora.Application.Dtos;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.Services;
using Aseguradora.Data.Repositories;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Entities;
using Aseguradora.Tests.Data;
using Microsoft.EntityFrameworkCore;

namespace Aseguradora.Tests.Application;

public sealed class PlanServiceTests : IDisposable
{
    private readonly SqliteDbFixture _fixture = new();

    public void Dispose() => _fixture.Dispose();

    private static PlanRequest RequestValido(
        string codigo = "TR2",
        decimal primaBase = 25000.00m,
        string tiposPermitidos = "Auto,Camioneta",
        int? antiguedadMaxima = 10) => new()
    {
        Codigo = codigo,
        Nombre = "Plan Todo Riesgo Plus",
        Descripcion = "Cobertura completa con granizo y cristales.",
        PrimaBase = primaBase,
        TiposPermitidos = tiposPermitidos,
        AntiguedadMaxima = antiguedadMaxima
    };

    [Fact]
    public async Task CrearAsync_con_datos_validos_persiste_el_plan()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context);

        var creado = await service.CrearAsync(RequestValido(codigo: "tr2"), CancellationToken.None);

        Assert.NotEqual(Guid.Empty, creado.Id);
        Assert.Equal("TR2", creado.Codigo);
        Assert.Equal(25000.00m, creado.PrimaBase);
        Assert.Equal("Auto,Camioneta", creado.TiposPermitidos);
        Assert.Equal(10, creado.AntiguedadMaxima);
        Assert.True(creado.Activo);

        var persistido = await context.Planes.FindAsync(creado.Id);
        Assert.NotNull(persistido);
        Assert.Equal("TR2", persistido.Codigo);
    }

    [Fact]
    public async Task CrearAsync_con_codigo_duplicado_lanza_BusinessRuleException()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context);

        var ex = await Assert.ThrowsAsync<BusinessRuleException>(
            () => service.CrearAsync(RequestValido(codigo: "RC"), CancellationToken.None));

        Assert.Contains("RC", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CrearAsync_con_tipo_inexistente_lanza_BusinessRuleException()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context);

        await Assert.ThrowsAsync<BusinessRuleException>(
            () => service.CrearAsync(RequestValido(tiposPermitidos: "Bicicleta"), CancellationToken.None));
    }

    [Fact]
    public async Task CrearAsync_con_antiguedad_negativa_lanza_BusinessRuleException()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context);

        await Assert.ThrowsAsync<BusinessRuleException>(
            () => service.CrearAsync(RequestValido(antiguedadMaxima: -1), CancellationToken.None));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-100)]
    public async Task CrearAsync_con_prima_no_positiva_lanza_BusinessRuleException(decimal primaBase)
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context);

        await Assert.ThrowsAsync<BusinessRuleException>(
            () => service.CrearAsync(RequestValido(primaBase: primaBase), CancellationToken.None));
    }

    [Fact]
    public async Task DesactivarAsync_marca_inactivo_y_no_borra_la_fila()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context);
        var creado = await service.CrearAsync(RequestValido(codigo: "TEMP"), CancellationToken.None);

        await service.DesactivarAsync(creado.Id, CancellationToken.None);

        var enBase = await context.Planes.AsNoTracking().SingleOrDefaultAsync(p => p.Id == creado.Id);
        Assert.NotNull(enBase);
        Assert.False(enBase.Activo);

        var activos = await service.ListarActivosAsync(CancellationToken.None);
        Assert.DoesNotContain(activos, p => p.Id == creado.Id);
    }

    [Fact]
    public async Task ActualizarAsync_no_modifica_la_prima_de_polizas_emitidas()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context);

        var actualizado = await service.ActualizarAsync(
            SeedData.PlanRcId,
            RequestValido(codigo: "RC", primaBase: 19500.00m, tiposPermitidos: "Auto,Moto,Camioneta", antiguedadMaxima: null),
            CancellationToken.None);

        Assert.Equal(19500.00m, actualizado.PrimaBase);

        var polizaSeed = await context.Polizas.AsNoTracking().SingleAsync(p => p.Id == SeedData.PolizaId);
        Assert.Equal(12000.00m, polizaSeed.PrimaMensual);
    }

    [Fact]
    public async Task ObtenerActivoAsync_con_plan_inactivo_lanza_NotFoundException()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context);
        var creado = await service.CrearAsync(RequestValido(codigo: "INACT"), CancellationToken.None);
        await service.DesactivarAsync(creado.Id, CancellationToken.None);

        await Assert.ThrowsAsync<NotFoundException>(
            () => service.ObtenerActivoAsync(creado.Id, CancellationToken.None));
    }

    private static PlanService CrearServicio(Aseguradora.Data.AseguradoraDbContext context) =>
        new(new EfRepository<Plan>(context), new UnitOfWork(context));
}
