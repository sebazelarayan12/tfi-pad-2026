using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Aseguradora.Application.Clientes.DTOs;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.External;
using Aseguradora.Application.Security;
using Aseguradora.Data;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Entities;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Fixtures;
using Aseguradora.Tests.Support;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Aseguradora.Tests.Api;

public sealed class ClientesControllerTests : IDisposable
{
    private const string RutaClientes = "/api/clientes";

    private readonly SqliteDbFixture _sqlite = new();

    public void Dispose() => _sqlite.Dispose();

    private AseguradoraWebFactory CrearFactory(
        IRenaperService? renaperOverride = null,
        bool usarAutenticacionReal = false) =>
        new()
        {
            UsarAutenticacionReal = usarAutenticacionReal,
            ConfigurarServicios = (_, services) =>
            {
                services.RemoveAll<DbContextOptions<AseguradoraDbContext>>();
                services.RemoveAll<AseguradoraDbContext>();
                services.AddScoped<AseguradoraDbContext>(_ => _sqlite.CreateContext());

                if (renaperOverride is not null)
                {
                    services.RemoveAll<IRenaperService>();
                    services.AddScoped<IRenaperService>(_ => renaperOverride);
                }
            }
        };

    private sealed class RenaperCaidoStub : IRenaperService
    {
        public Task<PersonaRenaper?> ObtenerPorDniAsync(string dni, CancellationToken ct = default) =>
            throw new ExternalServiceException("El servicio Renaper no está disponible.");
    }

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
    public async Task POST_valido_devuelve_201_con_los_datos_de_renaper()
    {
        await LiberarClienteDeSeedAsync();
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.PostAsJsonAsync(RutaClientes, Request());

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var creado = await response.Content.ReadFromJsonAsync<ClienteResponse>();
        Assert.NotNull(creado);
        Assert.Equal("Juan Carlos", creado.Nombre);
        Assert.Equal("Pérez", creado.Apellido);
        Assert.True(creado.ValidadoRenaper);
        Assert.NotNull(creado.FechaValidacionRenaper);
        Assert.NotNull(response.Headers.Location);
        Assert.Contains($"/api/clientes/{creado.Id}", response.Headers.Location.ToString(), StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task POST_con_menor_de_edad_devuelve_400()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.PostAsJsonAsync(RutaClientes, Request(dni: "45123456"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        await using var context = _sqlite.CreateContext();
        Assert.False(await context.Clientes.AnyAsync(c => c.Dni == "45123456"));
    }

    [Fact]
    public async Task POST_con_dni_ya_registrado_devuelve_400()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.PostAsJsonAsync(RutaClientes, Request(dni: "30123456"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        await using var context = _sqlite.CreateContext();
        Assert.Equal(1, await context.Clientes.CountAsync(c => c.Dni == "30123456"));
    }

    [Fact]
    public async Task POST_con_email_ya_registrado_devuelve_400()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.PostAsJsonAsync(
            RutaClientes,
            Request(dni: "30123457", email: "juan.perez@example.com"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        await using var context = _sqlite.CreateContext();
        Assert.False(await context.Clientes.AnyAsync(c => c.Dni == "30123457"));
    }

    [Fact]
    public async Task POST_con_dni_inexistente_en_renaper_devuelve_400()
    {
        await LiberarClienteDeSeedAsync();
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.PostAsJsonAsync(RutaClientes, Request(dni: "99999999"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task POST_con_dni_fallecido_devuelve_400()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.PostAsJsonAsync(RutaClientes, Request(dni: "20111222"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task POST_con_renaper_caido_devuelve_201_sin_validar()
    {
        await LiberarClienteDeSeedAsync();
        await using var factory = CrearFactory(new RenaperCaidoStub());
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.PostAsJsonAsync(RutaClientes, Request());

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var creado = await response.Content.ReadFromJsonAsync<ClienteResponse>();
        Assert.NotNull(creado);
        Assert.False(creado.ValidadoRenaper);
        Assert.Null(creado.FechaValidacionRenaper);
        Assert.Equal("Nombre cargado a mano", creado.Nombre);
    }

    [Fact]
    public async Task POST_validar_renaper_marca_validado()
    {
        await LiberarClienteDeSeedAsync();
        var id = await CrearClienteSinValidarAsync();
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.PostAsync($"{RutaClientes}/{id}/validar-renaper", content: null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var actualizado = await response.Content.ReadFromJsonAsync<ClienteResponse>();
        Assert.NotNull(actualizado);
        Assert.True(actualizado.ValidadoRenaper);
        Assert.NotNull(actualizado.FechaValidacionRenaper);
        Assert.Equal("Juan Carlos", actualizado.Nombre);
    }

    [Fact]
    public async Task POST_validar_renaper_con_cliente_inexistente_devuelve_404()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.PostAsync($"{RutaClientes}/{Guid.NewGuid()}/validar-renaper", content: null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GET_renaper_devuelve_los_datos_de_renaper()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.GetAsync($"{RutaClientes}/renaper/30123456");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var persona = await response.Content.ReadFromJsonAsync<PersonaRenaperResponse>();
        Assert.NotNull(persona);
        Assert.Equal("Juan Carlos", persona.Nombre);
        Assert.Equal("Pérez", persona.Apellido);
        Assert.Equal("VIGENTE", persona.Estado);
        Assert.Equal("San Martín", persona.Domicilio.Calle);
    }

    [Fact]
    public async Task GET_renaper_con_dni_inexistente_devuelve_404()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.GetAsync($"{RutaClientes}/renaper/99999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GET_renaper_con_renaper_caido_devuelve_502()
    {
        await using var factory = CrearFactory(new RenaperCaidoStub());
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.GetAsync($"{RutaClientes}/renaper/30123456");

        Assert.Equal(HttpStatusCode.BadGateway, response.StatusCode);
    }

    [Fact]
    public async Task Sin_token_devuelve_401_y_admin_responde_igual_que_empleado()
    {
        await using var factory = CrearFactory(usarAutenticacionReal: true);
        var anonimo = factory.CreateClient();
        var empleado = factory.CreateClient();
        empleado.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TokenDePrueba.Token(Roles.Empleado));
        var admin = factory.CreateClient();
        admin.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TokenDePrueba.Token(Roles.Administrador));

        var respAnonimo = await anonimo.GetAsync($"{RutaClientes}/renaper/30123456");
        var respEmpleado = await empleado.GetAsync($"{RutaClientes}/renaper/30123456");
        var respAdmin = await admin.GetAsync($"{RutaClientes}/renaper/30123456");

        Assert.Equal(HttpStatusCode.Unauthorized, respAnonimo.StatusCode);
        Assert.Equal(HttpStatusCode.OK, respEmpleado.StatusCode);
        Assert.Equal(HttpStatusCode.OK, respAdmin.StatusCode);
        Assert.Equal(
            await respEmpleado.Content.ReadAsStringAsync(),
            await respAdmin.Content.ReadAsStringAsync());
    }

    private async Task LiberarClienteDeSeedAsync()
    {
        await using var context = _sqlite.CreateContext();
        await ClienteDeSeed.LiberarAsync(context);
    }

    private async Task<Guid> CrearClienteSinValidarAsync()
    {
        await using var context = _sqlite.CreateContext();
        var cliente = new Cliente
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
        context.Clientes.Add(cliente);
        await context.SaveChangesAsync();
        return cliente.Id;
    }
}
