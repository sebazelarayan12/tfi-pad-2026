using Aseguradora.Application.Clientes;
using Aseguradora.Application.Clientes.DTOs;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.External;
using Aseguradora.Data;
using Aseguradora.Data.Repositories;
using Aseguradora.Domain.Entities;
using Aseguradora.Integrations.Renaper;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Support;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace Aseguradora.Tests.Application;

public sealed class ClienteServiceTests : IDisposable
{
    private static readonly DateTimeOffset Ahora = new(2026, 10, 30, 15, 0, 0, TimeSpan.Zero);

    private readonly SqliteDbFixture _fixture = new();

    public void Dispose() => _fixture.Dispose();

    private sealed class RenaperFalso : IRenaperService
    {
        private readonly RenaperMockService _mock = new();

        public bool Caido { get; set; }

        public Task<PersonaRenaper?> ObtenerPorDniAsync(string dni, CancellationToken ct = default) =>
            Caido
                ? throw new ExternalServiceException("Renaper no está disponible.")
                : _mock.ObtenerPorDniAsync(dni, ct);
    }

    private static ClienteService CrearServicio(AseguradoraDbContext context, IRenaperService renaper) =>
        new(
            new EfRepository<Cliente>(context),
            renaper,
            new UnitOfWork(context),
            new RelojFalso(Ahora),
            NullLogger<ClienteService>.Instance);

    private static ClienteAltaRequest Request(
        string dni = "30123456",
        string email = "nuevo@example.com",
        string nombre = "Nombre cargado a mano") => new()
        {
            Dni = dni,
            Email = email,
            Telefono = "3815551234",
            Nombre = nombre,
            Apellido = "Apellido cargado a mano",
            Cuil = "20111111112",
            FechaNacimiento = new DateOnly(1990, 1, 1),
            Sexo = 'F',
            Calle = "Calle cargada a mano",
            Numero = "999",
            Localidad = "Localidad manual",
            Provincia = "Provincia manual",
            CodigoPostal = "4000"
        };

    [Fact]
    public async Task AltaAsync_con_persona_vigente_pisa_los_datos_cargados()
    {
        await using var context = _fixture.CreateContext();
        await ClienteDeSeed.LiberarAsync(context);
        var service = CrearServicio(context, new RenaperFalso());

        var creado = await service.AltaAsync(Request(), CancellationToken.None);

        Assert.Equal("30123456", creado.Dni);
        Assert.Equal("Juan Carlos", creado.Nombre);
        Assert.Equal("Pérez", creado.Apellido);
        Assert.Equal("20301234565", creado.Cuil);
        Assert.Equal(new DateOnly(1985, 3, 21), creado.FechaNacimiento);
        Assert.Equal('M', creado.Sexo);
        Assert.Equal("San Martín", creado.Calle);
        Assert.Equal("1234", creado.Numero);
        Assert.Equal("San Miguel de Tucumán", creado.Localidad);
        Assert.Equal("Tucumán", creado.Provincia);
        Assert.Equal("4000", creado.CodigoPostal);
        Assert.Equal("nuevo@example.com", creado.Email);
        Assert.Equal("3815551234", creado.Telefono);
        Assert.True(creado.ValidadoRenaper);
        Assert.Equal(Ahora.UtcDateTime, creado.FechaValidacionRenaper);
        Assert.True(creado.Activo);

        var enBase = await context.Clientes.AsNoTracking().SingleAsync(c => c.Id == creado.Id);
        Assert.Equal("Juan Carlos", enBase.Nombre);
        Assert.True(enBase.ValidadoRenaper);
        Assert.Equal(Ahora.UtcDateTime, enBase.FechaValidacionRenaper);
    }

    [Fact]
    public async Task AltaAsync_con_menor_de_edad_lanza_BusinessRuleException()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context, new RenaperFalso());
        var cantidadInicial = await context.Clientes.CountAsync();

        var ex = await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.AltaAsync(Request(dni: "45123456"), CancellationToken.None));

        Assert.Contains("RN01", ex.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(cantidadInicial, await context.Clientes.CountAsync());
    }

    [Fact]
    public async Task AltaAsync_con_dni_duplicado_lanza_BusinessRuleException()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context, new RenaperFalso());
        var cantidadInicial = await context.Clientes.CountAsync();

        var ex = await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.AltaAsync(Request(dni: "30123456"), CancellationToken.None));

        Assert.Contains("RN01", ex.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(cantidadInicial, await context.Clientes.CountAsync());
    }

    [Fact]
    public async Task AltaAsync_con_email_duplicado_lanza_BusinessRuleException()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context, new RenaperFalso());
        var cantidadInicial = await context.Clientes.CountAsync();

        var ex = await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.AltaAsync(Request(dni: "30123457", email: "juan.perez@example.com"), CancellationToken.None));

        Assert.Contains("RN01", ex.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(cantidadInicial, await context.Clientes.CountAsync());
    }

    [Fact]
    public async Task AltaAsync_con_dni_inexistente_en_renaper_lanza_BusinessRuleException()
    {
        await using var context = _fixture.CreateContext();
        await ClienteDeSeed.LiberarAsync(context);
        var service = CrearServicio(context, new RenaperFalso());
        var cantidadInicial = await context.Clientes.CountAsync();

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.AltaAsync(Request(dni: "99999999"), CancellationToken.None));

        Assert.Equal(cantidadInicial, await context.Clientes.CountAsync());
    }

    [Fact]
    public async Task AltaAsync_con_persona_fallecida_lanza_BusinessRuleException()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context, new RenaperFalso());
        var cantidadInicial = await context.Clientes.CountAsync();

        var ex = await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.AltaAsync(Request(dni: "20111222"), CancellationToken.None));

        Assert.Contains("RN02", ex.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(cantidadInicial, await context.Clientes.CountAsync());
    }

    [Fact]
    public async Task AltaAsync_con_renaper_caido_guarda_sin_validar()
    {
        await using var context = _fixture.CreateContext();
        await ClienteDeSeed.LiberarAsync(context);
        var service = CrearServicio(context, new RenaperFalso { Caido = true });

        var creado = await service.AltaAsync(Request(), CancellationToken.None);

        Assert.False(creado.ValidadoRenaper);
        Assert.Null(creado.FechaValidacionRenaper);
        Assert.Equal("Nombre cargado a mano", creado.Nombre);
        Assert.Equal("Calle cargada a mano", creado.Calle);

        var enBase = await context.Clientes.AsNoTracking().SingleAsync(c => c.Id == creado.Id);
        Assert.False(enBase.ValidadoRenaper);
        Assert.Equal("Nombre cargado a mano", enBase.Nombre);
    }

    [Fact]
    public async Task ValidarRenaperAsync_marca_validado_y_actualiza_los_datos()
    {
        await using var context = _fixture.CreateContext();
        await ClienteDeSeed.LiberarAsync(context);
        var cliente = CrearClienteSinValidar();
        context.Clientes.Add(cliente);
        await context.SaveChangesAsync();
        var service = CrearServicio(context, new RenaperFalso());

        var actualizado = await service.ValidarRenaperAsync(cliente.Id, CancellationToken.None);

        Assert.True(actualizado.ValidadoRenaper);
        Assert.Equal(Ahora.UtcDateTime, actualizado.FechaValidacionRenaper);
        Assert.Equal("Juan Carlos", actualizado.Nombre);
        Assert.Equal("Pérez", actualizado.Apellido);

        var enBase = await context.Clientes.AsNoTracking().SingleAsync(c => c.Id == cliente.Id);
        Assert.True(enBase.ValidadoRenaper);
        Assert.Equal("Juan Carlos", enBase.Nombre);
    }

    [Fact]
    public async Task ValidarRenaperAsync_con_cliente_inexistente_lanza_NotFoundException()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context, new RenaperFalso());

        var ex = await Assert.ThrowsAsync<NotFoundException>(() =>
            service.ValidarRenaperAsync(Guid.NewGuid(), CancellationToken.None));

        Assert.Equal(ClienteService.CodigoClienteNoEncontrado, ex.Codigo);
    }

    [Fact]
    public async Task PreviewRenaperAsync_devuelve_los_datos_de_renaper()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context, new RenaperFalso());

        var persona = await service.PreviewRenaperAsync("30123456", CancellationToken.None);

        Assert.Equal("30123456", persona.Dni);
        Assert.Equal("Juan Carlos", persona.Nombre);
        Assert.Equal("Pérez", persona.Apellido);
        Assert.Equal("VIGENTE", persona.Estado);
        Assert.Equal("San Martín", persona.Domicilio.Calle);
        Assert.Equal("4000", persona.Domicilio.CodigoPostal);
    }

    [Fact]
    public async Task PreviewRenaperAsync_con_dni_inexistente_lanza_NotFoundException()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context, new RenaperFalso());

        var ex = await Assert.ThrowsAsync<NotFoundException>(() =>
            service.PreviewRenaperAsync("99999999", CancellationToken.None));

        Assert.Equal(ClienteService.CodigoDniNoEncontrado, ex.Codigo);
    }

    [Fact]
    public async Task PreviewRenaperAsync_con_renaper_caido_lanza_ExternalServiceException()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context, new RenaperFalso { Caido = true });

        await Assert.ThrowsAsync<ExternalServiceException>(() =>
            service.PreviewRenaperAsync("30123456", CancellationToken.None));
    }

    private static Cliente CrearClienteSinValidar() => new()
    {
        Id = Guid.NewGuid(),
        Dni = "30123456",
        Cuil = "20111111112",
        Nombre = "Nombre cargado a mano",
        Apellido = "Apellido cargado a mano",
        FechaNacimiento = new DateOnly(1990, 1, 1),
        Sexo = 'F',
        Email = "manual@example.com",
        Calle = "Calle cargada a mano",
        Numero = "999",
        Localidad = "Localidad manual",
        Provincia = "Provincia manual",
        CodigoPostal = "4000",
        ValidadoRenaper = false,
        FechaValidacionRenaper = null,
        Activo = true
    };
}
