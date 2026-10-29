using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Aseguradora.Application.Dtos;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.External;
using Aseguradora.Application.Security;
using Aseguradora.Application.Services;
using Aseguradora.Data;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Enums;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Fixtures;
using Aseguradora.Tests.Support;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Aseguradora.Tests.Api;

public sealed class VehiculosControllerTests : IDisposable
{
    private const string RutaVehiculos = "/api/vehiculos";

    private readonly SqliteDbFixture _sqlite = new();

    public void Dispose() => _sqlite.Dispose();

    private AseguradoraWebFactory CrearFactory(
        IDnrpaService? dnrpaOverride = null,
        bool usarAutenticacionReal = false) =>
        new()
        {
            UsarAutenticacionReal = usarAutenticacionReal,
            ConfigurarServicios = (_, services) =>
            {
                services.RemoveAll<DbContextOptions<AseguradoraDbContext>>();
                services.RemoveAll<AseguradoraDbContext>();
                services.AddScoped<AseguradoraDbContext>(_ => _sqlite.CreateContext());

                if (dnrpaOverride is not null)
                {
                    services.RemoveAll<IDnrpaService>();
                    services.AddScoped<IDnrpaService>(_ => dnrpaOverride);
                }
            }
        };

    private sealed class DnrpaCaidoStub : IDnrpaService
    {
        public Task<DatosDnrpa?> ObtenerVehiculoAsync(string patente, CancellationToken ct = default) =>
            throw new ExternalServiceException("El servicio DNRPA no está disponible.");
    }

    [Fact]
    public async Task POST_valido_devuelve_201_con_location()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.PostAsJsonAsync(RutaVehiculos, new VehiculoAltaRequest
        {
            ClienteId = SeedData.ClienteId,
            Patente = "ae789fg",
            Uso = UsoVehiculo.Particular
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var creado = await response.Content.ReadFromJsonAsync<VehiculoResponse>();
        Assert.NotNull(creado);
        Assert.Equal("AE789FG", creado.Patente);
        Assert.Equal("Toyota", creado.Marca);
        Assert.True(creado.ValidadoDnrpa);
        Assert.NotNull(response.Headers.Location);
        Assert.Contains($"/api/vehiculos/{creado.Id}", response.Headers.Location.ToString(), StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task POST_con_patente_duplicada_devuelve_400_y_no_crea_fila()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.PostAsJsonAsync(RutaVehiculos, new VehiculoAltaRequest
        {
            ClienteId = SeedData.ClienteId,
            Patente = "AB123CD",
            Uso = UsoVehiculo.Particular
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        await using var context = _sqlite.CreateContext();
        Assert.Equal(1, await context.Vehiculos.CountAsync());
    }

    [Fact]
    public async Task POST_con_titular_distinto_devuelve_400_con_mensaje_RN03()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.PostAsJsonAsync(RutaVehiculos, new VehiculoAltaRequest
        {
            ClienteId = SeedData.ClienteId,
            Patente = "AC456EF",
            Uso = UsoVehiculo.Particular
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var detail = doc.RootElement.GetProperty("detail").GetString();
        Assert.NotNull(detail);
        Assert.Contains("RN03", detail, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task POST_con_patente_inexistente_en_dnrpa_devuelve_400_con_VEHICULO_NO_ENCONTRADO()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.PostAsJsonAsync(RutaVehiculos, new VehiculoAltaRequest
        {
            ClienteId = SeedData.ClienteId,
            Patente = "ZZ999ZZ",
            Uso = UsoVehiculo.Particular
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var detail = doc.RootElement.GetProperty("detail").GetString();
        Assert.NotNull(detail);
        Assert.Contains(VehiculoService.CodigoVehiculoNoEncontrado, detail, StringComparison.Ordinal);
    }

    [Fact]
    public async Task POST_con_cliente_inexistente_devuelve_404()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.PostAsJsonAsync(RutaVehiculos, new VehiculoAltaRequest
        {
            ClienteId = Guid.NewGuid(),
            Patente = "AE789FG",
            Uso = UsoVehiculo.Particular
        });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task POST_con_patente_formato_invalido_devuelve_400()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.PostAsJsonAsync(RutaVehiculos, new VehiculoAltaRequest
        {
            ClienteId = SeedData.ClienteId,
            Patente = "AB12CDE",
            Uso = UsoVehiculo.Particular
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task POST_con_dnrpa_lanzando_ExternalServiceException_devuelve_502_y_no_guarda()
    {
        await using var factory = CrearFactory(dnrpaOverride: new DnrpaCaidoStub());
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.PostAsJsonAsync(RutaVehiculos, new VehiculoAltaRequest
        {
            ClienteId = SeedData.ClienteId,
            Patente = "AE789FG",
            Uso = UsoVehiculo.Particular
        });

        Assert.Equal(HttpStatusCode.BadGateway, response.StatusCode);
        await using var context = _sqlite.CreateContext();
        Assert.Equal(1, await context.Vehiculos.CountAsync());
    }

    [Fact]
    public async Task POST_sin_rol_devuelve_403()
    {
        await using var factory = CrearFactory(usarAutenticacionReal: true);
        var anonimo = factory.CreateClient();
        var sinRol = factory.CreateClient();
        sinRol.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TokenDePrueba.Token(rol: null));

        var payload = new VehiculoAltaRequest
        {
            ClienteId = SeedData.ClienteId,
            Patente = "AE789FG",
            Uso = UsoVehiculo.Particular
        };

        var respSinToken = await anonimo.PostAsJsonAsync(RutaVehiculos, payload);
        var respSinRol = await sinRol.PostAsJsonAsync(RutaVehiculos, payload);

        Assert.Equal(HttpStatusCode.Unauthorized, respSinToken.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, respSinRol.StatusCode);
    }
}
