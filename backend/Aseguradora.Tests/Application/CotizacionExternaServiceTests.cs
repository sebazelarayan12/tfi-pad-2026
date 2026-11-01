using Aseguradora.Application.Dtos;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.Services;
using Aseguradora.Data;
using Aseguradora.Data.Repositories;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Tests.Builders;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Support;
using Microsoft.EntityFrameworkCore;

namespace Aseguradora.Tests.Application;

public sealed class CotizacionExternaServiceTests : IDisposable
{
    internal static readonly DateTimeOffset Ahora = new(2026, 10, 31, 15, 0, 0, TimeSpan.Zero);
    private readonly SqliteDbFixture _fixture = new();
    public void Dispose() => _fixture.Dispose();

    internal static CotizacionExternaService CrearServicio(AseguradoraDbContext contexto) => new(
        new EfRepository<Plan>(contexto), new EfRepository<Cotizacion>(contexto),
        new UnitOfWork(contexto), new RelojFalso(Ahora));

    internal static async Task PrepararPlanes(AseguradoraDbContext contexto)
    {
        var rc = await contexto.Planes.SingleAsync(p => p.Codigo == "RC");
        rc.PrimaBase = 10000m; // Contract 9.5 C uses test bases, not production seed values.
        contexto.Planes.Add(new PlanBuilder().Con(p =>
        {
            p.Codigo = "TC";
            p.PrimaBase = 18000m;
        }).Construir());
        contexto.Planes.Add(new PlanBuilder().Con(p =>
        {
            p.Codigo = "TR";
            p.PrimaBase = 30000m;
            p.AntiguedadMaxima = 10;
            p.TiposPermitidos = "Auto,Camioneta";
        }).Construir());
        await contexto.SaveChangesAsync();
    }

    private static CotizacionExternaRequest Pedido => new(TipoVehiculo.Moto, 2024, UsoVehiculo.Particular, 23);

    [Fact]
    public async Task CotizarExterno_ejemplo_9_5_C_devuelve_9100_y_16380()
    {
        await using var contexto = _fixture.CreateContext();
        await PrepararPlanes(contexto);
        var resultado = await CrearServicio(contexto).CotizarExternoAsync(Pedido);
        Assert.Equal(new[] { ("RC", 9100m), ("TC", 16380m) },
            resultado.Opciones.Select(o => (o.CodigoPlan, o.PrimaMensual)).ToArray());
    }

    [Fact]
    public async Task CotizarExterno_persiste_cotizaciones_sin_cliente_ni_vehiculo()
    {
        await using var contexto = _fixture.CreateContext();
        await PrepararPlanes(contexto);
        var resultado = await CrearServicio(contexto).CotizarExternoAsync(Pedido);
        await using var lectura = _fixture.CreateContext();
        var ids = resultado.Opciones.Select(o => o.IdCotizacion).ToArray();
        var guardadas = await lectura.Cotizaciones.Where(c => ids.Contains(c.Id)).ToListAsync();
        Assert.Equal(2, guardadas.Count);
        Assert.Equal(Ahora.UtcDateTime.AddDays(15), resultado.FechaVencimiento);
        Assert.All(guardadas, c =>
        {
            Assert.Equal(OrigenCotizacion.Externo, c.Origen);
            Assert.Null(c.ClienteId);
            Assert.Null(c.VehiculoId);
            Assert.Equal(Ahora.UtcDateTime, c.FechaCotizacion);
            Assert.Equal(resultado.FechaVencimiento, c.FechaVencimiento);
            Assert.Equal(Pedido.TipoVehiculo, c.TipoVehiculo);
            Assert.Equal(Pedido.Anio, c.AnioVehiculo);
            Assert.Equal(Pedido.Uso, c.Uso);
            Assert.Equal(Pedido.EdadConductor, c.EdadConductor);
            var opcion = Assert.Single(resultado.Opciones, o => o.IdCotizacion == c.Id);
            Assert.Equal(opcion.PrimaMensual, c.PrimaMensual);
        });
        Assert.Equal(2, guardadas.Select(c => c.PlanId).Distinct().Count());
    }

    [Fact]
    public async Task CotizarExterno_uso_comercial_aplica_1_40()
    {
        await using var contexto = _fixture.CreateContext();
        await PrepararPlanes(contexto);
        var resultado = await CrearServicio(contexto).CotizarExternoAsync(Pedido with { Uso = UsoVehiculo.Comercial });
        Assert.Equal(new[] { 12740m, 22932m }, resultado.Opciones.Select(o => o.PrimaMensual).ToArray());
    }

    [Fact]
    public async Task CotizarExterno_sin_planes_compatibles_lanza_BusinessRuleException()
    {
        await using var contexto = _fixture.CreateContext();
        foreach (var plan in await contexto.Planes.ToListAsync())
            plan.TiposPermitidos = "Auto";
        await contexto.SaveChangesAsync();
        var cantidad = await contexto.Cotizaciones.CountAsync();
        var error = await Assert.ThrowsAsync<BusinessRuleException>(() => CrearServicio(contexto).CotizarExternoAsync(Pedido));
        Assert.Equal("Ningún plan es compatible con el vehículo.", error.Message);
        Assert.Equal(cantidad, await contexto.Cotizaciones.CountAsync());
    }

    [Theory]
    [InlineData(-1, 2024, 1, 0)]
    [InlineData(121, 2024, 1, 0)]
    [InlineData(23, 1899, 1, 0)]
    [InlineData(23, 2028, 1, 0)]
    [InlineData(23, 2024, 999, 0)]
    [InlineData(23, 2024, 1, 999)]
    public async Task CotizarExterno_datos_invalidos_no_persisten(int edad, int anio, int tipo, int uso)
    {
        await using var contexto = _fixture.CreateContext();
        var cantidad = await contexto.Cotizaciones.CountAsync();
        await Assert.ThrowsAsync<BusinessRuleException>(() => CrearServicio(contexto).CotizarExternoAsync(
            new CotizacionExternaRequest((TipoVehiculo)tipo, anio, (UsoVehiculo)uso, edad)));
        Assert.Equal(cantidad, await contexto.Cotizaciones.CountAsync());
    }

    [Theory]
    [InlineData(0, 1900)]
    [InlineData(120, 2027)]
    public async Task CotizarExterno_acepta_limites_tecnicos(int edad, int anio)
    {
        await using var contexto = _fixture.CreateContext();
        var resultado = await CrearServicio(contexto).CotizarExternoAsync(Pedido with { EdadConductor = edad, Anio = anio });
        Assert.NotEmpty(resultado.Opciones);
    }

    [Fact]
    public async Task CotizarExterno_excluye_planes_inactivos_y_superados_por_antiguedad()
    {
        await using var contexto = _fixture.CreateContext();
        await PrepararPlanes(contexto);
        (await contexto.Planes.SingleAsync(p => p.Codigo == "TC")).Activo = false;
        await contexto.SaveChangesAsync();
        var resultado = await CrearServicio(contexto).CotizarExternoAsync(Pedido with { TipoVehiculo = TipoVehiculo.Auto, Anio = 2000 });
        Assert.Equal("RC", Assert.Single(resultado.Opciones).CodigoPlan);
    }
}
