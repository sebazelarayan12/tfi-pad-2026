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
    public async Task POST_con_cliente_inactivo_devuelve_400()
    {
        await using (var setupContext = _sqlite.CreateContext())
        {
            var cliente = await setupContext.Clientes.SingleAsync(c => c.Id == SeedData.ClienteId);
            cliente.Activo = false;
            await setupContext.SaveChangesAsync();
        }

        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.PostAsJsonAsync(RutaVehiculos, new VehiculoAltaRequest
        {
            ClienteId = SeedData.ClienteId,
            Patente = "AE789FG",
            Uso = UsoVehiculo.Particular
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task POST_sin_uso_en_json_devuelve_400()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.PostAsJsonAsync(RutaVehiculos, new
        {
            clienteId = SeedData.ClienteId,
            patente = "AE789FG"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
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

    [Fact]
    public async Task GET_sin_clienteId_devuelve_400()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.GetAsync(RutaVehiculos);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GET_con_clienteId_devuelve_solo_vehiculos_activos_del_cliente()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.GetAsync($"{RutaVehiculos}?clienteId={SeedData.ClienteId}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var lista = await response.Content.ReadFromJsonAsync<List<VehiculoResponse>>();
        Assert.NotNull(lista);
        Assert.NotEmpty(lista);
        Assert.All(lista, v =>
        {
            Assert.Equal(SeedData.ClienteId, v.ClienteId);
            Assert.True(v.Activo);
        });
    }

    [Fact]
    public async Task GET_id_inexistente_devuelve_404()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.GetAsync($"{RutaVehiculos}/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task PUT_cambia_el_uso_y_no_la_patente()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.PutAsJsonAsync(
            $"{RutaVehiculos}/{SeedData.VehiculoId}",
            new ModificarUsoRequest { Uso = UsoVehiculo.Comercial });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var actualizado = await response.Content.ReadFromJsonAsync<VehiculoResponse>();
        Assert.NotNull(actualizado);
        Assert.Equal(UsoVehiculo.Comercial, actualizado.Uso);
        Assert.Equal("AB123CD", actualizado.Patente);
    }

    [Fact]
    public async Task PUT_sin_uso_devuelve_400()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.PutAsJsonAsync($"{RutaVehiculos}/{SeedData.VehiculoId}", new { });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task DELETE_con_poliza_activa_devuelve_400()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.DeleteAsync($"{RutaVehiculos}/{SeedData.VehiculoId}");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var detail = doc.RootElement.GetProperty("detail").GetString();
        Assert.NotNull(detail);
        Assert.Contains("póliza activa", detail, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task DELETE_valido_devuelve_204_y_deja_la_fila_inactiva()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);
        var alta = await empleado.PostAsJsonAsync(RutaVehiculos, new VehiculoAltaRequest
        {
            ClienteId = SeedData.ClienteId,
            Patente = "AE789FG",
            Uso = UsoVehiculo.Particular
        });
        var creado = await alta.Content.ReadFromJsonAsync<VehiculoResponse>();
        Assert.NotNull(creado);

        var response = await empleado.DeleteAsync($"{RutaVehiculos}/{creado.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        await using var context = _sqlite.CreateContext();
        var enBase = await context.Vehiculos.AsNoTracking().SingleAsync(v => v.Id == creado.Id);
        Assert.False(enBase.Activo);
    }

    [Theory]
    [InlineData("GET")]
    [InlineData("PUT")]
    [InlineData("DELETE")]
    public async Task Consulta_modificacion_y_baja_sin_token_devuelven_401_y_sin_rol_403(string metodo)
    {
        await using var factory = CrearFactory(usarAutenticacionReal: true);
        var anonimo = factory.CreateClient();
        var sinRol = factory.CreateClient();
        sinRol.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TokenDePrueba.Token(rol: null));

        HttpRequestMessage NuevaSolicitud()
        {
            var solicitud = new HttpRequestMessage(
                new HttpMethod(metodo),
                $"{RutaVehiculos}/{SeedData.VehiculoId}");
            if (metodo == "PUT")
                solicitud.Content = JsonContent.Create(new ModificarUsoRequest { Uso = UsoVehiculo.Comercial });
            return solicitud;
        }

        var respSinToken = await anonimo.SendAsync(NuevaSolicitud());
        var respSinRol = await sinRol.SendAsync(NuevaSolicitud());

        Assert.Equal(HttpStatusCode.Unauthorized, respSinToken.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, respSinRol.StatusCode);
    }

    [Fact]
    public async Task GET_listado_sin_token_devuelve_401_y_sin_rol_403()
    {
        await using var factory = CrearFactory(usarAutenticacionReal: true);
        var anonimo = factory.CreateClient();
        var sinRol = factory.CreateClient();
        sinRol.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TokenDePrueba.Token(rol: null));
        var ruta = $"{RutaVehiculos}?clienteId={SeedData.ClienteId}";

        Assert.Equal(HttpStatusCode.Unauthorized, (await anonimo.GetAsync(ruta)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await sinRol.GetAsync(ruta)).StatusCode);
    }

    [Fact]
    public async Task DELETE_repetido_sobre_vehiculo_inactivo_devuelve_204()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);
        var alta = await empleado.PostAsJsonAsync(RutaVehiculos, new VehiculoAltaRequest
        {
            ClienteId = SeedData.ClienteId,
            Patente = "AE789FG",
            Uso = UsoVehiculo.Particular
        });
        var creado = await alta.Content.ReadFromJsonAsync<VehiculoResponse>();
        Assert.NotNull(creado);
        await empleado.DeleteAsync($"{RutaVehiculos}/{creado.Id}");

        var segundo = await empleado.DeleteAsync($"{RutaVehiculos}/{creado.Id}");

        Assert.Equal(HttpStatusCode.NoContent, segundo.StatusCode);
    }

    [Fact]
    public async Task PUT_sobre_vehiculo_inactivo_devuelve_400()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);
        var alta = await empleado.PostAsJsonAsync(RutaVehiculos, new VehiculoAltaRequest
        {
            ClienteId = SeedData.ClienteId,
            Patente = "AE789FG",
            Uso = UsoVehiculo.Particular
        });
        var creado = await alta.Content.ReadFromJsonAsync<VehiculoResponse>();
        Assert.NotNull(creado);
        await empleado.DeleteAsync($"{RutaVehiculos}/{creado.Id}");

        var response = await empleado.PutAsJsonAsync(
            $"{RutaVehiculos}/{creado.Id}", new ModificarUsoRequest { Uso = UsoVehiculo.Comercial });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
