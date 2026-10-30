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
using Aseguradora.Tests.Support;
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
            new EfRepository<Poliza>(context),
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

    [Fact]
    public async Task ListarPorClienteAsync_no_devuelve_inactivos()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context);
        var activo = await service.AltaAsync(new VehiculoAltaRequest
        {
            ClienteId = SeedData.ClienteId,
            Patente = "AE789FG",
            Uso = UsoVehiculo.Particular
        }, CancellationToken.None);
        await service.DarDeBajaAsync(activo.Id, CancellationToken.None);

        var lista = await service.ListarPorClienteAsync(SeedData.ClienteId, CancellationToken.None);

        Assert.All(lista, v => Assert.True(v.Activo));
        Assert.DoesNotContain(lista, v => v.Id == activo.Id);
        Assert.Contains(lista, v => v.Id == SeedData.VehiculoId);
    }

    [Fact]
    public async Task DarDeBajaAsync_con_poliza_Vigente_lanza_BusinessRuleException()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context);

        var ex = await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.DarDeBajaAsync(SeedData.VehiculoId, CancellationToken.None));

        Assert.Contains("póliza activa", ex.Message, StringComparison.OrdinalIgnoreCase);
        var enBase = await context.Vehiculos.AsNoTracking().SingleAsync(v => v.Id == SeedData.VehiculoId);
        Assert.True(enBase.Activo);
    }

    [Theory]
    [InlineData(EstadoPoliza.Pendiente)]
    [InlineData(EstadoPoliza.Suspendida)]
    public async Task DarDeBajaAsync_con_poliza_Pendiente_o_Suspendida_lanza_BusinessRuleException(EstadoPoliza estado)
    {
        await using var context = _fixture.CreateContext();
        var poliza = await PolizasDePrueba.AgregarPolizaAsync(context, estado, DateTime.UtcNow);
        var service = CrearServicio(context);

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.DarDeBajaAsync(poliza.VehiculoId, CancellationToken.None));
    }

    [Theory]
    [InlineData(EstadoPoliza.Cancelada)]
    [InlineData(EstadoPoliza.Vencida)]
    public async Task DarDeBajaAsync_con_polizas_Cancelada_o_Vencida_permite_la_baja(EstadoPoliza estado)
    {
        await using var context = _fixture.CreateContext();
        var poliza = await PolizasDePrueba.AgregarPolizaAsync(context, estado, DateTime.UtcNow);
        var service = CrearServicio(context);

        await service.DarDeBajaAsync(poliza.VehiculoId, CancellationToken.None);

        var enBase = await context.Vehiculos.AsNoTracking().SingleAsync(v => v.Id == poliza.VehiculoId);
        Assert.False(enBase.Activo);
    }

    [Fact]
    public async Task DarDeBajaAsync_no_borra_la_fila()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context);
        var creado = await service.AltaAsync(new VehiculoAltaRequest
        {
            ClienteId = SeedData.ClienteId,
            Patente = "AE789FG",
            Uso = UsoVehiculo.Particular
        }, CancellationToken.None);
        var cantidadInicial = await context.Vehiculos.CountAsync();

        await service.DarDeBajaAsync(creado.Id, CancellationToken.None);

        Assert.Equal(cantidadInicial, await context.Vehiculos.CountAsync());
        var enBase = await context.Vehiculos.AsNoTracking().SingleAsync(v => v.Id == creado.Id);
        Assert.False(enBase.Activo);
    }

    [Fact]
    public async Task ModificarUsoAsync_cambia_solo_el_uso()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context);
        var antes = await service.ObtenerAsync(SeedData.VehiculoId, CancellationToken.None);
        var nuevoUso = antes.Uso == UsoVehiculo.Comercial ? UsoVehiculo.Particular : UsoVehiculo.Comercial;

        var despues = await service.ModificarUsoAsync(SeedData.VehiculoId, nuevoUso, CancellationToken.None);

        Assert.Equal(nuevoUso, despues.Uso);
        Assert.Equal(antes with { Uso = nuevoUso }, despues);
        var enBase = await context.Vehiculos.AsNoTracking().SingleAsync(v => v.Id == SeedData.VehiculoId);
        Assert.Equal(nuevoUso, enBase.Uso);
        Assert.Equal(antes.Patente, enBase.Patente);
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