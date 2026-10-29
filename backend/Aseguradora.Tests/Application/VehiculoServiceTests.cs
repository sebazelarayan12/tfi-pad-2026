using Aseguradora.Application.Dtos;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.External;
using Aseguradora.Application.Services;
using Aseguradora.Data;
using Aseguradora.Data.Repositories;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Integrations.Dnrpa;
using Aseguradora.Tests.Data;
using Microsoft.EntityFrameworkCore;

namespace Aseguradora.Tests.Application;

public sealed class VehiculoServiceTests : IDisposable
{
    private readonly SqliteDbFixture _fixture = new();

    public void Dispose() => _fixture.Dispose();

    private sealed class DnrpaCaidoFake : IDnrpaService
    {
        public Task<DatosDnrpa?> ObtenerVehiculoAsync(string patente, CancellationToken ct = default) =>
            throw new ExternalServiceException("DNRPA no disponible.");
    }

    private static VehiculoService CrearServicio(AseguradoraDbContext context, IDnrpaService? dnrpa = null) =>
        new(
            new EfRepository<Vehiculo>(context),
            new EfRepository<Cliente>(context),
            dnrpa ?? new DnrpaMockService(),
            new UnitOfWork(context));

    [Fact]
    public async Task AltaAsync_valido_guarda_vehiculo_validado()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context);

        var creado = await service.AltaAsync(new VehiculoAltaRequest
        {
            ClienteId = SeedData.ClienteId,
            Patente = "AE789FG",
            Uso = UsoVehiculo.Particular
        }, CancellationToken.None);

        Assert.NotEqual(Guid.Empty, creado.Id);
        Assert.Equal(SeedData.ClienteId, creado.ClienteId);
        Assert.Equal("AE789FG", creado.Patente);
        Assert.Equal("Toyota", creado.Marca);
        Assert.Equal("Hilux SRX", creado.Modelo);
        Assert.Equal(2023, creado.Anio);
        Assert.Equal(TipoVehiculo.Camioneta, creado.Tipo);
        Assert.Equal(UsoVehiculo.Particular, creado.Uso);
        Assert.True(creado.ValidadoDnrpa);
        Assert.True(creado.Activo);

        var enBase = await context.Vehiculos.AsNoTracking().SingleOrDefaultAsync(v => v.Id == creado.Id);
        Assert.NotNull(enBase);
        Assert.True(enBase.ValidadoDnrpa);
    }

    [Fact]
    public async Task AltaAsync_normaliza_patente_a_mayusculas()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context);

        var creado = await service.AltaAsync(new VehiculoAltaRequest
        {
            ClienteId = SeedData.ClienteId,
            Patente = " ae789fg ",
            Uso = UsoVehiculo.Comercial
        }, CancellationToken.None);

        Assert.Equal("AE789FG", creado.Patente);
        Assert.Equal(UsoVehiculo.Comercial, creado.Uso);
    }

    [Fact]
    public async Task AltaAsync_con_patente_duplicada_lanza_BusinessRuleException()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context);
        var cantidadInicial = await context.Vehiculos.CountAsync();

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.AltaAsync(new VehiculoAltaRequest
            {
                ClienteId = SeedData.ClienteId,
                Patente = "AB123CD",
                Uso = UsoVehiculo.Particular
            }, CancellationToken.None));

        Assert.Equal(cantidadInicial, await context.Vehiculos.CountAsync());
    }

    [Fact]
    public async Task AltaAsync_con_titular_distinto_lanza_BusinessRuleException()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context);
        var cantidadInicial = await context.Vehiculos.CountAsync();

        var ex = await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.AltaAsync(new VehiculoAltaRequest
            {
                ClienteId = SeedData.ClienteId,
                Patente = "AC456EF",
                Uso = UsoVehiculo.Particular
            }, CancellationToken.None));

        Assert.Contains("RN03", ex.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(cantidadInicial, await context.Vehiculos.CountAsync());
    }

    [Fact]
    public async Task AltaAsync_sin_datos_en_dnrpa_lanza_BusinessRuleException()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context);

        var ex = await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.AltaAsync(new VehiculoAltaRequest
            {
                ClienteId = SeedData.ClienteId,
                Patente = "ZZ999ZZ",
                Uso = UsoVehiculo.Particular
            }, CancellationToken.None));

        Assert.Contains(VehiculoService.CodigoVehiculoNoEncontrado, ex.Message, StringComparison.Ordinal);
    }

    [Fact]
    public async Task AltaAsync_con_cliente_inexistente_lanza_NotFoundException()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            service.AltaAsync(new VehiculoAltaRequest
            {
                ClienteId = Guid.NewGuid(),
                Patente = "AE789FG",
                Uso = UsoVehiculo.Particular
            }, CancellationToken.None));
    }

    [Fact]
    public async Task AltaAsync_con_cliente_inactivo_lanza_BusinessRuleException()
    {
        await using var context = _fixture.CreateContext();
        var cliente = await context.Clientes.SingleAsync(c => c.Id == SeedData.ClienteId);
        cliente.Activo = false;
        await context.SaveChangesAsync();

        var service = CrearServicio(context);
        var cantidadInicial = await context.Vehiculos.CountAsync();

        var ex = await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.AltaAsync(new VehiculoAltaRequest
            {
                ClienteId = SeedData.ClienteId,
                Patente = "AE789FG",
                Uso = UsoVehiculo.Particular
            }, CancellationToken.None));

        Assert.Contains("dado de baja", ex.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(cantidadInicial, await context.Vehiculos.CountAsync());
    }

    [Fact]
    public async Task AltaAsync_sin_uso_lanza_BusinessRuleException()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context);
        var cantidadInicial = await context.Vehiculos.CountAsync();

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.AltaAsync(new VehiculoAltaRequest
            {
                ClienteId = SeedData.ClienteId,
                Patente = "AE789FG",
                Uso = null
            }, CancellationToken.None));

        Assert.Equal(cantidadInicial, await context.Vehiculos.CountAsync());
    }

    [Fact]
    public async Task AltaAsync_con_dnrpa_caido_no_persiste_nada()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context, new DnrpaCaidoFake());
        var cantidadInicial = await context.Vehiculos.CountAsync();

        await Assert.ThrowsAsync<ExternalServiceException>(() =>
            service.AltaAsync(new VehiculoAltaRequest
            {
                ClienteId = SeedData.ClienteId,
                Patente = "AE789FG",
                Uso = UsoVehiculo.Particular
            }, CancellationToken.None));

        Assert.Equal(cantidadInicial, await context.Vehiculos.CountAsync());
    }
}
