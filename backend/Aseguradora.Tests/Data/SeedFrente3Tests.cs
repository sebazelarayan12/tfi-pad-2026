using Aseguradora.Application.Dtos.Polizas;
using Aseguradora.Application.Services;
using Aseguradora.Data.Repositories;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Tests.Builders;
using Aseguradora.Tests.Fakes;
using Aseguradora.Tests.Support;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace Aseguradora.Tests.Data;

public sealed class SeedFrente3Tests : IDisposable
{
    private readonly SqliteDbFixture _fixture = new();

    public void Dispose() => _fixture.Dispose();

    [Fact]
    public async Task Sembrar_EnDevelopment_AgregaClienteVehiculoYCotizacion()
    {
        await using (var context = _fixture.CreateContext())
            await new SeedFrente3(context, new Entorno(Environments.Development))
                .SembrarAsync(EmptyServiceProvider.Instance, CancellationToken.None);

        await using var verificacion = _fixture.CreateContext();
        var cotizacion = await verificacion.Cotizaciones.SingleAsync(c => c.Id == SeedFrente3.CotizacionPruebaId);
        Assert.Equal(SeedFrente3.ClientePruebaId, cotizacion.ClienteId);
        Assert.Equal(SeedFrente3.VehiculoPruebaId, cotizacion.VehiculoId);
        Assert.Equal(SeedData.PlanRcId, cotizacion.PlanId);
        Assert.True(await verificacion.Clientes.AnyAsync(c => c.Id == SeedFrente3.ClientePruebaId && c.ValidadoRenaper));
        Assert.True(await verificacion.Vehiculos.AnyAsync(v => v.Id == SeedFrente3.VehiculoPruebaId && v.ValidadoDnrpa));
    }

    [Fact]
    public async Task Sembrar_DosVeces_EsIdempotente()
    {
        for (var vez = 0; vez < 2; vez++)
        {
            await using var context = _fixture.CreateContext();
            await new SeedFrente3(context, new Entorno(Environments.Development))
                .SembrarAsync(EmptyServiceProvider.Instance, CancellationToken.None);
        }

        await using var verificacion = _fixture.CreateContext();
        Assert.Equal(1, await verificacion.Cotizaciones.CountAsync(c => c.Id == SeedFrente3.CotizacionPruebaId));
        Assert.Equal(1, await verificacion.Clientes.CountAsync(c => c.Id == SeedFrente3.ClientePruebaId));
    }

    [Fact]
    public async Task Sembrar_FueraDeDevelopment_NoAgregaNada()
    {
        await using (var context = _fixture.CreateContext())
            await new SeedFrente3(context, new Entorno(Environments.Production))
                .SembrarAsync(EmptyServiceProvider.Instance, CancellationToken.None);

        await using var verificacion = _fixture.CreateContext();
        Assert.False(await verificacion.Cotizaciones.AnyAsync(c => c.Id == SeedFrente3.CotizacionPruebaId));
    }

    [Fact]
    public async Task CotizacionDePrueba_PermiteEmitirUnaPoliza()
    {
        await using var context = _fixture.CreateContext();
        var cotizacion = await SeedFrente3.AgregarCotizacionDePrueba(context, CancellationToken.None);
        Assert.NotNull(cotizacion);
        var service = new PolizaService(
            new EfRepository<Cotizacion>(context),
            new EfRepository<Cliente>(context),
            new EfRepository<Vehiculo>(context),
            new EfRepository<Plan>(context),
            new EfRepository<Poliza>(context),
            new EfRepository<Cuota>(context),
            // Starts at 2 like the real sequence: the seeded policy already is POL-0000001.
            new NumeradorPolizasFalso(primero: 2),
            new UnitOfWork(context),
            new RelojFalso(new DateTimeOffset(2026, 10, 29, 15, 0, 0, TimeSpan.Zero)));

        var poliza = await service.EmitirAsync(new EmitirPolizaRequest(cotizacion.Id, 6), CancellationToken.None);

        Assert.Equal(EstadoPoliza.Pendiente, poliza.Estado);
        Assert.Equal(SeedFrente3.PrimaMensualPrueba, poliza.PrimaMensual);
        Assert.Equal(6, poliza.Cuotas.Count);
    }

    [Theory]
    [InlineData("dni")]
    [InlineData("email")]
    [InlineData("patente")]
    public async Task Sembrar_DatoUnicoOcupadoPorOtro_NoAgregaNadaNiFalla(string ocupado)
    {
        await using (var context = _fixture.CreateContext())
        {
            // Another client (with its own id) already uses the DNI, email or plate of the test data.
            var otro = new ClienteBuilder().Construir();
            if (ocupado == "dni")
                otro.Dni = "31000001";
            if (ocupado == "email")
                otro.Email = "maria.prueba.f3@example.com";
            context.Clientes.Add(otro);
            if (ocupado == "patente")
                context.Vehiculos.Add(new VehiculoBuilder().DeCliente(otro).Con(v => v.Patente = "AC456EF").Construir());
            await context.SaveChangesAsync();
        }

        await using (var context = _fixture.CreateContext())
            await new SeedFrente3(context, new Entorno(Environments.Development))
                .SembrarAsync(EmptyServiceProvider.Instance, CancellationToken.None);

        await using var verificacion = _fixture.CreateContext();
        Assert.False(await verificacion.Cotizaciones.AnyAsync(c => c.Id == SeedFrente3.CotizacionPruebaId));
        Assert.False(await verificacion.Clientes.AnyAsync(c => c.Id == SeedFrente3.ClientePruebaId));
    }

    private sealed class Entorno(string nombre) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = nombre;
        public string ApplicationName { get; set; } = "Aseguradora.Tests";
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }

    private sealed class EmptyServiceProvider : IServiceProvider
    {
        public static readonly EmptyServiceProvider Instance = new();

        public object? GetService(Type serviceType) => null;
    }
}
