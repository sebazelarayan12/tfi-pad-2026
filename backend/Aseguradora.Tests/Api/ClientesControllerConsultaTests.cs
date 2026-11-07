using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Aseguradora.Application.Clientes.DTOs;
using Aseguradora.Application.Comun;
using Aseguradora.Application.Security;
using Aseguradora.Data;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Entities;
using Aseguradora.Tests.Builders;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Fixtures;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Aseguradora.Tests.Api;

/// <summary>CU05 through HTTP: list, detail, modification and soft deletion of clients.</summary>
public sealed class ClientesControllerConsultaTests : IDisposable
{
    private const string RutaClientes = "/api/clientes";
    private const string ProblemJson = "application/problem+json";

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    private readonly SqliteDbFixture _sqlite = new();

    public void Dispose() => _sqlite.Dispose();

    private AseguradoraWebFactory CrearFactory(bool usarAutenticacionReal = false) => new()
    {
        UsarAutenticacionReal = usarAutenticacionReal,
        ConfigurarServicios = (_, services) =>
        {
            services.RemoveAll<DbContextOptions<AseguradoraDbContext>>();
            services.RemoveAll<AseguradoraDbContext>();
            services.AddScoped<AseguradoraDbContext>(_ => _sqlite.CreateContext());
        }
    };

    private async Task<Cliente> AgregarClienteAsync(string apellido = "Alvarez")
    {
        await using var context = _sqlite.CreateContext();
        var cliente = new ClienteBuilder().Construir();
        cliente.Apellido = apellido;
        context.Clientes.Add(cliente);
        await context.SaveChangesAsync();
        return cliente;
    }

    private static ClienteModificacionRequest Modificacion(string email = "nuevo@example.com") => new()
    {
        Email = email,
        Telefono = "3815551234",
        Calle = "Calle Nueva",
        Numero = "742",
        Localidad = "Yerba Buena",
        Provincia = "Tucumán",
        CodigoPostal = "4107"
    };

    [Fact]
    public async Task Get_FiltraPorDni()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var pagina = await empleado.GetFromJsonAsync<PaginaResponse<ClienteResumenResponse>>(
            $"{RutaClientes}?dni=30123456", Json);

        Assert.NotNull(pagina);
        var item = Assert.Single(pagina.Items);
        Assert.Equal(SeedData.ClienteId, item.Id);
        Assert.Equal("30123456", item.Dni);
        Assert.Equal(1, pagina.Total);
    }

    [Fact]
    public async Task Get_FiltraPorApellidoParcialSinDistinguirMayusculasNiTildes()
    {
        await AgregarClienteAsync("Peralta");
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var pagina = await empleado.GetFromJsonAsync<PaginaResponse<ClienteResumenResponse>>(
            $"{RutaClientes}?apellido={Uri.EscapeDataString("PEREZ")}", Json);

        Assert.NotNull(pagina);
        var item = Assert.Single(pagina.Items);
        Assert.Equal(SeedData.ClienteId, item.Id);
        Assert.Equal("Pérez", item.Apellido);
        Assert.Equal(1, pagina.Total);
    }

    [Fact]
    public async Task Get_PaginadoDevuelveElSegundoElementoYElTotal()
    {
        await AgregarClienteAsync("Alvarez");
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var pagina = await empleado.GetFromJsonAsync<PaginaResponse<ClienteResumenResponse>>(
            $"{RutaClientes}?pagina=2&tamanoPagina=1", Json);

        // Ordered by last name: Alvarez, Pérez (seeded).
        Assert.NotNull(pagina);
        var item = Assert.Single(pagina.Items);
        Assert.Equal(SeedData.ClienteId, item.Id);
        Assert.Equal(2, pagina.Pagina);
        Assert.Equal(1, pagina.TamanoPagina);
        Assert.Equal(2, pagina.Total);
    }

    [Theory]
    [InlineData("?tamanoPagina=101")]
    [InlineData("?tamanoPagina=0")]
    [InlineData("?pagina=0")]
    public async Task Get_ParametrosDePaginaInvalidos_400(string consulta)
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.GetAsync(RutaClientes + consulta);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(ProblemJson, response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task Get_DetalleDevuelveElCliente()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var cliente = await empleado.GetFromJsonAsync<ClienteResponse>(
            $"{RutaClientes}/{SeedData.ClienteId}", Json);

        Assert.NotNull(cliente);
        Assert.Equal(SeedData.ClienteId, cliente.Id);
        Assert.Equal("30123456", cliente.Dni);
        Assert.Equal("Pérez", cliente.Apellido);
        Assert.True(cliente.Activo);
    }

    [Fact]
    public async Task Get_IdInexistente_404()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.GetAsync($"{RutaClientes}/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Put_con_email_de_otro_cliente_400_y_no_modifica_nada()
    {
        await using var context = _sqlite.CreateContext();
        var otro = new ClienteBuilder().Construir();
        otro.Email = "otro@example.com";
        context.Clientes.Add(otro);
        await context.SaveChangesAsync();
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.PutAsJsonAsync(
            $"{RutaClientes}/{SeedData.ClienteId}", Modificacion(otro.Email));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(ProblemJson, response.Content.Headers.ContentType?.MediaType);
        await using var verificacion = _sqlite.CreateContext();
        var enBase = await verificacion.Clientes.AsNoTracking().SingleAsync(c => c.Id == SeedData.ClienteId);
        Assert.Equal("juan.perez@example.com", enBase.Email);
        Assert.Equal("San Martín", enBase.Calle);
        Assert.Equal("1234", enBase.Numero);
    }

    [Fact]
    public async Task Put_no_permite_cambiar_dni_ni_nombre()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);
        var cuerpo = new
        {
            email = "nuevo@example.com",
            telefono = "3815551234",
            calle = "Calle Nueva",
            numero = "742",
            localidad = "Yerba Buena",
            provincia = "Tucumán",
            codigoPostal = "4107",
            // Not part of ClienteModificacionRequest: the API must ignore them.
            dni = "99999999",
            nombre = "Nombre cambiado",
            apellido = "Apellido cambiado"
        };

        var response = await empleado.PutAsJsonAsync($"{RutaClientes}/{SeedData.ClienteId}", cuerpo);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var modificado = await response.Content.ReadFromJsonAsync<ClienteResponse>(Json);
        Assert.NotNull(modificado);
        Assert.Equal("30123456", modificado.Dni);
        Assert.Equal("Juan Carlos", modificado.Nombre);
        Assert.Equal("Pérez", modificado.Apellido);

        await using var verificacion = _sqlite.CreateContext();
        var enBase = await verificacion.Clientes.AsNoTracking().SingleAsync(c => c.Id == SeedData.ClienteId);
        Assert.Equal("30123456", enBase.Dni);
        Assert.Equal("Juan Carlos", enBase.Nombre);
        Assert.Equal("Pérez", enBase.Apellido);
        Assert.Equal("nuevo@example.com", enBase.Email);
        Assert.Equal("Calle Nueva", enBase.Calle);
    }

    [Fact]
    public async Task Delete_da_de_baja_logica_y_el_cliente_deja_de_aparecer()
    {
        var cliente = await AgregarClienteAsync();
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.DeleteAsync($"{RutaClientes}/{cliente.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        await using var verificacion = _sqlite.CreateContext();
        var enBase = await verificacion.Clientes.AsNoTracking().SingleAsync(c => c.Id == cliente.Id);
        Assert.False(enBase.Activo);

        var pagina = await empleado.GetFromJsonAsync<PaginaResponse<ClienteResumenResponse>>(
            $"{RutaClientes}?dni={cliente.Dni}", Json);
        Assert.NotNull(pagina);
        Assert.Empty(pagina.Items);
        Assert.Equal(0, pagina.Total);
    }

    [Fact]
    public async Task Delete_de_un_cliente_con_poliza_activa_400_y_sigue_activo()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        // The seeded client has a Vigente policy (SeedData).
        var response = await empleado.DeleteAsync($"{RutaClientes}/{SeedData.ClienteId}");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        await using var verificacion = _sqlite.CreateContext();
        var enBase = await verificacion.Clientes.AsNoTracking().SingleAsync(c => c.Id == SeedData.ClienteId);
        Assert.True(enBase.Activo);
    }

    [Fact]
    public async Task SinToken_401()
    {
        await AgregarClienteAsync();
        await using var factory = CrearFactory(usarAutenticacionReal: true);
        var sinToken = factory.CreateClient();

        var listado = await sinToken.GetAsync(RutaClientes);
        var detalle = await sinToken.GetAsync($"{RutaClientes}/{SeedData.ClienteId}");
        var modificacion = await sinToken.PutAsJsonAsync(
            $"{RutaClientes}/{SeedData.ClienteId}", Modificacion());
        var baja = await sinToken.DeleteAsync($"{RutaClientes}/{SeedData.ClienteId}");

        Assert.Equal(HttpStatusCode.Unauthorized, listado.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, detalle.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, modificacion.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, baja.StatusCode);
    }
}
