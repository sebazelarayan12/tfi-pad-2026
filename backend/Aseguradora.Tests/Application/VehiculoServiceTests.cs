using Aseguradora.Application.Dtos;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.External;
using Aseguradora.Application.Services;
using Aseguradora.Data;
using Aseguradora.Data.Repositories;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Support;
using Microsoft.EntityFrameworkCore;

namespace Aseguradora.Tests.Application;

public sealed class VehiculoServiceTests : IDisposable
{
    private readonly SqliteDbFixture _fixture = new();

    public void Dispose() => _fixture.Dispose();

    private static VehiculoService CrearServicio(AseguradoraDbContext context) =>
        new(
            new EfRepository<Vehiculo>(context),
            new EfRepository<Cliente>(context),
            new EfRepository<Poliza>(context),
            new UnitOfWork(context));

    [Fact]
    public async Task AltaAsync_valido_guarda_los_datos_cargados_sin_validar_en_dnrpa()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context);

        var creado = await service.AltaAsync(new VehiculoAltaRequest
        {
            ClienteId = SeedData.ClienteId,
            Patente = "AE789FG",
            Marca = "Toyota",
            Modelo = "Hilux SRX",
            Anio = 2023,
            Tipo = TipoVehiculo.Camioneta,
            NumeroMotor = "MOT123456",
            NumeroChasis = "CHA123456",
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
        Assert.False(creado.ValidadoDnrpa);
        Assert.True(creado.Activo);

        var enBase = await context.Vehiculos.AsNoTracking().SingleOrDefaultAsync(v => v.Id == creado.Id);
        Assert.NotNull(enBase);
        Assert.False(enBase.ValidadoDnrpa);
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
            Marca = "Toyota",
            Modelo = "Hilux SRX",
            Anio = 2023,
            Tipo = TipoVehiculo.Camioneta,
            NumeroMotor = "MOT123456",
            NumeroChasis = "CHA123456",
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
                Marca = "Toyota",
            Modelo = "Hilux SRX",
            Anio = 2023,
            Tipo = TipoVehiculo.Camioneta,
            NumeroMotor = "MOT123456",
            NumeroChasis = "CHA123456",
            Uso = UsoVehiculo.Particular
            }, CancellationToken.None));

        Assert.Equal(cantidadInicial, await context.Vehiculos.CountAsync());
    }

    [Fact]
    public async Task AltaAsync_con_patente_que_dnrpa_no_conoce_igual_crea_el_vehiculo()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context);

        var creado = await service.AltaAsync(new VehiculoAltaRequest
        {
            ClienteId = SeedData.ClienteId,
            Patente = "ZZ999ZZ",
            Marca = "Ford",
            Modelo = "Focus",
            Anio = 2019,
            Tipo = TipoVehiculo.Auto,
            NumeroMotor = "MOT1",
            NumeroChasis = "CHA1",
            Uso = UsoVehiculo.Particular
        }, CancellationToken.None);

        Assert.Equal("ZZ999ZZ", creado.Patente);
        Assert.Equal("Ford", creado.Marca);
    }

    [Theory]
    [InlineData("", "Focus", 2019)]
    [InlineData("Ford", "  ", 2019)]
    [InlineData("Ford", "Focus", 1900)]
    [InlineData("Ford", "Focus", 3000)]
    public async Task AltaAsync_con_marca_modelo_o_anio_invalidos_lanza_BusinessRuleException(
        string marca, string modelo, int anio)
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context);
        var cantidadInicial = await context.Vehiculos.CountAsync();

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.AltaAsync(new VehiculoAltaRequest
            {
                ClienteId = SeedData.ClienteId,
                Patente = "ZZ999ZZ",
                Marca = marca,
                Modelo = modelo,
                Anio = anio,
                Tipo = TipoVehiculo.Auto,
                NumeroMotor = "MOT1",
                NumeroChasis = "CHA1",
                Uso = UsoVehiculo.Particular
            }, CancellationToken.None));

        Assert.Equal(cantidadInicial, await context.Vehiculos.CountAsync());
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
                Marca = "Toyota",
            Modelo = "Hilux SRX",
            Anio = 2023,
            Tipo = TipoVehiculo.Camioneta,
            NumeroMotor = "MOT123456",
            NumeroChasis = "CHA123456",
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
                Marca = "Toyota",
            Modelo = "Hilux SRX",
            Anio = 2023,
            Tipo = TipoVehiculo.Camioneta,
            NumeroMotor = "MOT123456",
            NumeroChasis = "CHA123456",
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
    public async Task ListarPorClienteAsync_no_devuelve_inactivos()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context);
        var activo = await service.AltaAsync(new VehiculoAltaRequest
        {
            ClienteId = SeedData.ClienteId,
            Patente = "AE789FG",
            Marca = "Toyota",
            Modelo = "Hilux SRX",
            Anio = 2023,
            Tipo = TipoVehiculo.Camioneta,
            NumeroMotor = "MOT123456",
            NumeroChasis = "CHA123456",
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
            Marca = "Toyota",
            Modelo = "Hilux SRX",
            Anio = 2023,
            Tipo = TipoVehiculo.Camioneta,
            NumeroMotor = "MOT123456",
            NumeroChasis = "CHA123456",
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

    [Fact]
    public async Task DarDeBajaAsync_sobre_vehiculo_ya_inactivo_es_idempotente()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context);
        var creado = await service.AltaAsync(new VehiculoAltaRequest
        {
            ClienteId = SeedData.ClienteId,
            Patente = "AE789FG",
            Marca = "Toyota",
            Modelo = "Hilux SRX",
            Anio = 2023,
            Tipo = TipoVehiculo.Camioneta,
            NumeroMotor = "MOT123456",
            NumeroChasis = "CHA123456",
            Uso = UsoVehiculo.Particular
        }, CancellationToken.None);
        await service.DarDeBajaAsync(creado.Id, CancellationToken.None);

        await service.DarDeBajaAsync(creado.Id, CancellationToken.None);

        var enBase = await context.Vehiculos.AsNoTracking().SingleAsync(v => v.Id == creado.Id);
        Assert.False(enBase.Activo);
    }

    [Fact]
    public async Task ModificarUsoAsync_sobre_vehiculo_inactivo_lanza_BusinessRuleException()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context);
        var creado = await service.AltaAsync(new VehiculoAltaRequest
        {
            ClienteId = SeedData.ClienteId,
            Patente = "AE789FG",
            Marca = "Toyota",
            Modelo = "Hilux SRX",
            Anio = 2023,
            Tipo = TipoVehiculo.Camioneta,
            NumeroMotor = "MOT123456",
            NumeroChasis = "CHA123456",
            Uso = UsoVehiculo.Particular
        }, CancellationToken.None);
        await service.DarDeBajaAsync(creado.Id, CancellationToken.None);

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.ModificarUsoAsync(creado.Id, UsoVehiculo.Comercial, CancellationToken.None));

        var enBase = await context.Vehiculos.AsNoTracking().SingleAsync(v => v.Id == creado.Id);
        Assert.Equal(UsoVehiculo.Particular, enBase.Uso);
    }
}
