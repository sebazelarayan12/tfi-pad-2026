using Aseguradora.Application.Exceptions;
using Aseguradora.Application.Services;
using Aseguradora.Data;
using Aseguradora.Data.Repositories;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Tests.Builders;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Support;
using Microsoft.EntityFrameworkCore;

namespace Aseguradora.Tests.Application;

public sealed class CotizacionServiceTests : IDisposable
{
    // Reference year 2026: the seed vehicle (2021) is 5 years old, the seed client (born 1985-03-21) is 41.
    private static readonly DateTimeOffset Ahora = new(2026, 10, 29, 15, 0, 0, TimeSpan.Zero);

    private readonly SqliteDbFixture _fixture = new();

    public void Dispose() => _fixture.Dispose();

    private static CotizacionService CrearServicio(AseguradoraDbContext context) =>
        new(
            new EfRepository<Vehiculo>(context),
            new EfRepository<Cliente>(context),
            new EfRepository<Plan>(context),
            new EfRepository<Cotizacion>(context),
            new UnitOfWork(context),
            new RelojFalso(Ahora));

    private static async Task<Plan> AgregarPlanAsync(AseguradoraDbContext context, Action<Plan>? ajuste = null)
    {
        var builder = new PlanBuilder();
        if (ajuste is not null)
            builder.Con(ajuste);

        var plan = builder.Construir();
        context.Planes.Add(plan);
        await context.SaveChangesAsync();
        return plan;
    }

    private static async Task<Vehiculo> AgregarVehiculoAsync(
        AseguradoraDbContext context, Cliente cliente, Action<Vehiculo>? ajuste = null)
    {
        var builder = new VehiculoBuilder().DeCliente(cliente);
        if (ajuste is not null)
            builder.Con(ajuste);

        var vehiculo = builder.Construir();
        context.Vehiculos.Add(vehiculo);
        await context.SaveChangesAsync();
        return vehiculo;
    }

    private static async Task<Cliente> ClienteSeedAsync(AseguradoraDbContext context) =>
        await context.Clientes.SingleAsync(c => c.Id == SeedData.ClienteId);

    [Fact]
    public async Task CotizarVehiculo_devuelve_una_opcion_por_plan_compatible()
    {
        await using var context = _fixture.CreateContext();
        var extra = await AgregarPlanAsync(context, p => p.PrimaBase = 18000.00m);
        var service = CrearServicio(context);

        var resultado = await service.CotizarVehiculoAsync(SeedData.VehiculoId, CancellationToken.None);

        Assert.Equal(2, resultado.Opciones.Count);
        var rc = Assert.Single(resultado.Opciones, o => o.CodigoPlan == "RC");
        Assert.Equal(12000.00m, rc.PrimaMensual);
        var otra = Assert.Single(resultado.Opciones, o => o.CodigoPlan == extra.Codigo);
        Assert.Equal(18000.00m, otra.PrimaMensual);
        Assert.Equal(Ahora.UtcDateTime.AddDays(15), resultado.FechaVencimiento);
    }

    [Fact]
    public async Task CotizarVehiculo_excluye_planes_que_no_aceptan_el_tipo()
    {
        await using var context = _fixture.CreateContext();
        var soloAutos = await AgregarPlanAsync(context, p => p.TiposPermitidos = "Auto,Camioneta");
        var moto = await AgregarVehiculoAsync(context, await ClienteSeedAsync(context), v => v.Tipo = TipoVehiculo.Moto);
        var service = CrearServicio(context);

        var resultado = await service.CotizarVehiculoAsync(moto.Id, CancellationToken.None);

        Assert.DoesNotContain(resultado.Opciones, o => o.CodigoPlan == soloAutos.Codigo);
        Assert.Contains(resultado.Opciones, o => o.CodigoPlan == "RC");
    }

    [Fact]
    public async Task CotizarVehiculo_excluye_planes_por_antiguedad_maxima()
    {
        await using var context = _fixture.CreateContext();
        var conLimite = await AgregarPlanAsync(context, p => p.AntiguedadMaxima = 10);
        var viejo = await AgregarVehiculoAsync(context, await ClienteSeedAsync(context), v =>
        {
            v.Tipo = TipoVehiculo.Auto;
            v.Anio = 2000;
        });
        var service = CrearServicio(context);

        var resultado = await service.CotizarVehiculoAsync(viejo.Id, CancellationToken.None);

        Assert.DoesNotContain(resultado.Opciones, o => o.CodigoPlan == conLimite.Codigo);
        var rc = Assert.Single(resultado.Opciones, o => o.CodigoPlan == "RC");
        Assert.Equal(15000.00m, rc.PrimaMensual); // antigüedad 26 -> factor 1,25
    }

    [Fact]
    public async Task CotizarVehiculo_incluye_planes_con_antiguedad_igual_al_maximo()
    {
        await using var context = _fixture.CreateContext();
        var conLimite = await AgregarPlanAsync(context, p => p.AntiguedadMaxima = 10);
        var enElLimite = await AgregarVehiculoAsync(context, await ClienteSeedAsync(context), v =>
        {
            v.Tipo = TipoVehiculo.Auto;
            v.Anio = 2016;
        });
        var service = CrearServicio(context);

        var resultado = await service.CotizarVehiculoAsync(enElLimite.Id, CancellationToken.None);

        Assert.Contains(resultado.Opciones, o => o.CodigoPlan == conLimite.Codigo);
    }

    [Theory]
    [InlineData(2001, 10, 30, 15600.00)] // todavía no cumplió años: 24 -> factor 1,30
    [InlineData(2001, 10, 29, 12000.00)] // cumple hoy: 25 -> factor 1,00
    public async Task CotizarVehiculo_calcula_la_edad_desde_fecha_de_nacimiento(
        int anio, int mes, int dia, double primaEsperada)
    {
        await using var context = _fixture.CreateContext();
        var cliente = new ClienteBuilder().Con(c => c.FechaNacimiento = new DateOnly(anio, mes, dia)).Construir();
        context.Clientes.Add(cliente);
        await context.SaveChangesAsync();
        var vehiculo = await AgregarVehiculoAsync(context, cliente, v =>
        {
            v.Tipo = TipoVehiculo.Auto;
            v.Anio = 2021;
            v.Uso = UsoVehiculo.Particular;
        });
        var service = CrearServicio(context);

        var resultado = await service.CotizarVehiculoAsync(vehiculo.Id, CancellationToken.None);

        var rc = Assert.Single(resultado.Opciones, o => o.CodigoPlan == "RC");
        Assert.Equal((decimal)primaEsperada, rc.PrimaMensual);
    }

    [Fact]
    public async Task CotizarVehiculo_persiste_una_cotizacion_por_plan_con_vencimiento_15_dias()
    {
        await using var context = _fixture.CreateContext();
        await AgregarPlanAsync(context);
        var service = CrearServicio(context);

        var resultado = await service.CotizarVehiculoAsync(SeedData.VehiculoId, CancellationToken.None);

        var ids = resultado.Opciones.Select(o => o.IdCotizacion).ToList();
        var guardadas = await context.Cotizaciones.AsNoTracking().Where(c => ids.Contains(c.Id)).ToListAsync();
        Assert.Equal(resultado.Opciones.Count, guardadas.Count);
        Assert.All(guardadas, c =>
        {
            Assert.Equal(OrigenCotizacion.Panel, c.Origen);
            Assert.Equal(SeedData.VehiculoId, c.VehiculoId);
            Assert.Equal(SeedData.ClienteId, c.ClienteId);
            Assert.Equal(Ahora.UtcDateTime, c.FechaCotizacion);
            Assert.Equal(Ahora.UtcDateTime.AddDays(15), c.FechaVencimiento);
            Assert.Equal(41, c.EdadConductor);
            Assert.Equal(2021, c.AnioVehiculo);
        });
        Assert.Equal(guardadas.Count, guardadas.Select(c => c.PlanId).Distinct().Count());
    }

    [Fact]
    public async Task CotizarVehiculo_sin_planes_compatibles_lanza_BusinessRuleException()
    {
        await using var context = _fixture.CreateContext();
        foreach (var plan in await context.Planes.ToListAsync())
            plan.Activo = false;
        await context.SaveChangesAsync();
        var service = CrearServicio(context);
        var cantidadInicial = await context.Cotizaciones.CountAsync();

        var ex = await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.CotizarVehiculoAsync(SeedData.VehiculoId, CancellationToken.None));

        Assert.Contains("compatible", ex.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(cantidadInicial, await context.Cotizaciones.CountAsync());
    }

    [Fact]
    public async Task CotizarVehiculo_con_vehiculo_inexistente_lanza_NotFoundException()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            service.CotizarVehiculoAsync(Guid.NewGuid(), CancellationToken.None));
    }

    [Fact]
    public async Task CotizarVehiculo_con_vehiculo_dado_de_baja_lanza_BusinessRuleException()
    {
        await using var context = _fixture.CreateContext();
        var baja = await AgregarVehiculoAsync(context, await ClienteSeedAsync(context), v => v.Activo = false);
        var service = CrearServicio(context);

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.CotizarVehiculoAsync(baja.Id, CancellationToken.None));
    }

    [Fact]
    public async Task ObtenerAsync_devuelve_dto_con_EstaVigente()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context);
        var resultado = await service.CotizarVehiculoAsync(SeedData.VehiculoId, CancellationToken.None);
        var opcion = resultado.Opciones[0];

        var dto = await service.ObtenerAsync(opcion.IdCotizacion, CancellationToken.None);

        Assert.Equal(opcion.IdCotizacion, dto.Id);
        Assert.Equal(opcion.CodigoPlan, dto.CodigoPlan);
        Assert.Equal(opcion.PrimaMensual, dto.PrimaMensual);
        Assert.Equal(OrigenCotizacion.Panel, dto.Origen);
        Assert.True(dto.EstaVigente(Ahora.UtcDateTime));
        Assert.True(dto.EstaVigente(Ahora.UtcDateTime.AddDays(15)));
        Assert.False(dto.EstaVigente(Ahora.UtcDateTime.AddDays(15).AddSeconds(1)));
    }

    [Fact]
    public async Task ObtenerAsync_inexistente_lanza_NotFoundException()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            service.ObtenerAsync(Guid.NewGuid(), CancellationToken.None));
    }
}
