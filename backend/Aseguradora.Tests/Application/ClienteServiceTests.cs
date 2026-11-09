using Aseguradora.Application.Clientes;
using Aseguradora.Application.Clientes.DTOs;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.External;
using Aseguradora.Data;
using Aseguradora.Data.Repositories;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Interfaces;
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

        /// <summary>When set, Renaper answers this person for any query instead of the mock's fixed ones.</summary>
        public PersonaRenaper? Forzada { get; set; }

        /// <summary>When true, a DNI query is ambiguous and only a CUIL query answers.</summary>
        public bool DniAmbiguo { get; set; }

        public List<string> Consultas { get; } = [];

        public Task<PersonaRenaper?> ObtenerPorDniAsync(string dni, CancellationToken ct = default)
        {
            Consultas.Add($"dni:{dni}");
            if (Caido)
                throw new ExternalServiceException("Renaper no está disponible.");
            if (DniAmbiguo)
                throw new PersonaAmbiguaException("Varias personas con ese DNI.");
            return Forzada is not null ? Task.FromResult<PersonaRenaper?>(Forzada) : _mock.ObtenerPorDniAsync(dni, ct);
        }

        public Task<PersonaRenaper?> ObtenerPorCuilAsync(string cuil, CancellationToken ct = default)
        {
            Consultas.Add($"cuil:{cuil}");
            if (Caido)
                throw new ExternalServiceException("Renaper no está disponible.");
            return Forzada is not null ? Task.FromResult<PersonaRenaper?>(Forzada) : _mock.ObtenerPorCuilAsync(cuil, ct);
        }
    }

    /// <summary>What OpenRENAPER really returns: one name string, CUIT and age; no birth date, address or last name.</summary>
    private static PersonaRenaper PersonaAbierta(int? edad = 40, string cuil = "20301234565") => new(
        Dni: "30123456",
        Cuil: cuil,
        Nombre: "PEREZ JUAN CARLOS",
        Apellido: null,
        FechaNacimiento: null,
        Sexo: 'M',
        Domicilio: null,
        Estado: EstadoRenaper.Vigente,
        FechaFallecimiento: null,
        Edad: edad);

    private static ClienteService CrearServicio(AseguradoraDbContext context, IRenaperService renaper) =>
        new(
            new EfRepository<Cliente>(context),
            new EfRepository<Poliza>(context),
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
    public async Task AltaAsync_con_persona_sin_domicilio_ni_fecha_conserva_lo_cargado_y_valida_por_edad()
    {
        await using var context = _fixture.CreateContext();
        await ClienteDeSeed.LiberarAsync(context);
        var service = CrearServicio(context, new RenaperFalso { Forzada = PersonaAbierta() });

        var creado = await service.AltaAsync(Request(), CancellationToken.None);

        // What OpenRENAPER publishes (CUIT and sex) overwrites; the rest stays as the employee typed it.
        Assert.Equal("20301234565", creado.Cuil);
        Assert.Equal('M', creado.Sexo);
        Assert.Equal("Nombre cargado a mano", creado.Nombre);
        Assert.Equal("Apellido cargado a mano", creado.Apellido);
        Assert.Equal(new DateOnly(1990, 1, 1), creado.FechaNacimiento);
        Assert.Equal("Calle cargada a mano", creado.Calle);
        Assert.Equal("Provincia manual", creado.Provincia);
        Assert.True(creado.ValidadoRenaper);
        Assert.Equal(Ahora.UtcDateTime, creado.FechaValidacionRenaper);
    }

    [Fact]
    public async Task AltaAsync_con_persona_menor_segun_la_edad_de_Renaper_lanza_RN01()
    {
        await using var context = _fixture.CreateContext();
        await ClienteDeSeed.LiberarAsync(context);
        var service = CrearServicio(context, new RenaperFalso { Forzada = PersonaAbierta(edad: 17) });
        var cantidadInicial = await context.Clientes.CountAsync();

        var ex = await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.AltaAsync(Request(), CancellationToken.None));

        Assert.Contains("RN01", ex.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(cantidadInicial, await context.Clientes.CountAsync());
    }

    [Fact]
    public async Task AltaAsync_sin_edad_en_Renaper_registra_al_cliente_sin_validar()
    {
        await using var context = _fixture.CreateContext();
        await ClienteDeSeed.LiberarAsync(context);
        var service = CrearServicio(context, new RenaperFalso { Forzada = PersonaAbierta(edad: null) });

        var creado = await service.AltaAsync(Request(), CancellationToken.None);

        Assert.False(creado.ValidadoRenaper);
        Assert.Null(creado.FechaValidacionRenaper);
        Assert.Equal("Nombre cargado a mano", creado.Nombre);
    }

    [Fact]
    public async Task AltaAsync_con_dni_ambiguo_consulta_por_el_cuil_cargado()
    {
        await using var context = _fixture.CreateContext();
        await ClienteDeSeed.LiberarAsync(context);
        var renaper = new RenaperFalso { DniAmbiguo = true, Forzada = PersonaAbierta() };
        var service = CrearServicio(context, renaper);
        var request = Request() with { Cuil = "20-30123456-5" };

        var creado = await service.AltaAsync(request, CancellationToken.None);

        Assert.Equal(["dni:30123456", "cuil:20301234565"], renaper.Consultas);
        Assert.True(creado.ValidadoRenaper);
    }

    [Fact]
    public async Task AltaAsync_con_dni_ambiguo_y_cuil_invalido_registra_sin_validar()
    {
        await using var context = _fixture.CreateContext();
        await ClienteDeSeed.LiberarAsync(context);
        var renaper = new RenaperFalso { DniAmbiguo = true, Forzada = PersonaAbierta() };
        var service = CrearServicio(context, renaper);
        var request = Request() with { Cuil = "123" };

        var creado = await service.AltaAsync(request, CancellationToken.None);

        Assert.Equal(["dni:30123456"], renaper.Consultas);
        Assert.False(creado.ValidadoRenaper);
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

    private sealed class UnitOfWorkConDuplicadoConcurrente : IUnitOfWork
    {
        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
            throw new ViolacionUnicidadException("Duplicado.", new InvalidOperationException("índice único"));
    }

    [Fact]
    public async Task AltaAsync_con_duplicado_concurrente_lanza_BusinessRuleException()
    {
        await using var context = _fixture.CreateContext();
        await ClienteDeSeed.LiberarAsync(context);
        var service = new ClienteService(
            new EfRepository<Cliente>(context),
            new EfRepository<Poliza>(context),
            new RenaperFalso(),
            new UnitOfWorkConDuplicadoConcurrente(),
            new RelojFalso(Ahora),
            NullLogger<ClienteService>.Instance);

        var ex = await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.AltaAsync(Request(), CancellationToken.None));

        Assert.IsType<ViolacionUnicidadException>(ex.InnerException);
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
