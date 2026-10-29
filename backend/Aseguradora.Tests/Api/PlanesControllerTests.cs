using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Aseguradora.Application.Dtos;
using Aseguradora.Application.Security;
using Aseguradora.Data;
using Aseguradora.Data.Seed;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Fixtures;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Aseguradora.Tests.Api;

public sealed class PlanesControllerTests : IDisposable
{
    private const string RutaPlanes = "/api/planes";

    private readonly SqliteDbFixture _sqlite = new();
    private readonly AseguradoraWebFactory _factory;

    public PlanesControllerTests()
    {
        _factory = new AseguradoraWebFactory
        {
            ConfigurarServicios = (_, services) =>
            {
                services.RemoveAll<DbContextOptions<AseguradoraDbContext>>();
                services.RemoveAll<AseguradoraDbContext>();
                services.AddScoped<AseguradoraDbContext>(_ => _sqlite.CreateContext());
            }
        };
    }

    public void Dispose()
    {
        _factory.Dispose();
        _sqlite.Dispose();
    }

    private static PlanRequest NuevoPlanRequest(
        string codigo = "TR",
        decimal primaBase = 30000.00m,
        string tiposPermitidos = "Auto,Camioneta",
        int? antiguedadMaxima = 10) => new()
    {
        Codigo = codigo,
        Nombre = "Todo Riesgo",
        Descripcion = "Cobertura completa con franquicia.",
        PrimaBase = primaBase,
        TiposPermitidos = tiposPermitidos,
        AntiguedadMaxima = antiguedadMaxima
    };

    [Fact]
    public async Task GET_sin_token_devuelve_solo_activos()
    {
        await SeedData.EjecutarAsync(_factory.Services);

        var admin = _factory.CrearCliente(Roles.Administrador);
        var creadoResp = await admin.PostAsJsonAsync(RutaPlanes, NuevoPlanRequest(codigo: "TEMP"));
        Assert.Equal(HttpStatusCode.Created, creadoResp.StatusCode);
        var creado = await creadoResp.Content.ReadFromJsonAsync<PlanResponse>();
        Assert.NotNull(creado);

        var deleteResp = await admin.DeleteAsync($"{RutaPlanes}/{creado.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResp.StatusCode);

        var anonimo = _factory.CreateClient();
        var response = await anonimo.GetAsync(RutaPlanes);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var planes = await response.Content.ReadFromJsonAsync<List<PlanResponse>>();
        Assert.NotNull(planes);
        Assert.Equal(["RC", "TC", "TR"], planes.Select(p => p.Codigo).OrderBy(c => c).ToArray());
        Assert.All(planes, p => Assert.True(p.Activo));
    }

    [Fact]
    public async Task GET_plan_inactivo_devuelve_404()
    {
        var admin = _factory.CrearCliente(Roles.Administrador);
        var creadoResp = await admin.PostAsJsonAsync(RutaPlanes, NuevoPlanRequest(codigo: "BAJA"));
        Assert.Equal(HttpStatusCode.Created, creadoResp.StatusCode);
        var creado = await creadoResp.Content.ReadFromJsonAsync<PlanResponse>();
        Assert.NotNull(creado);

        var anonimo = _factory.CreateClient();
        var activoResp = await anonimo.GetAsync($"{RutaPlanes}/{creado.Id}");
        Assert.Equal(HttpStatusCode.OK, activoResp.StatusCode);

        var deleteResp = await admin.DeleteAsync($"{RutaPlanes}/{creado.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResp.StatusCode);

        var inactivoResp = await anonimo.GetAsync($"{RutaPlanes}/{creado.Id}");
        Assert.Equal(HttpStatusCode.NotFound, inactivoResp.StatusCode);

        await using var context = _sqlite.CreateContext();
        var enBase = await context.Planes.AsNoTracking().SingleOrDefaultAsync(p => p.Id == creado.Id);
        Assert.NotNull(enBase);
        Assert.False(enBase.Activo);
    }

    [Fact]
    public async Task POST_como_empleado_devuelve_403()
    {
        var empleado = _factory.CrearCliente(Roles.Empleado);

        var postResp = await empleado.PostAsJsonAsync(RutaPlanes, NuevoPlanRequest(codigo: "EMP1"));
        var putResp = await empleado.PutAsJsonAsync($"{RutaPlanes}/{SeedData.PlanRcId}", NuevoPlanRequest(codigo: "RC"));
        var deleteResp = await empleado.DeleteAsync($"{RutaPlanes}/{SeedData.PlanRcId}");

        Assert.Equal(HttpStatusCode.Forbidden, postResp.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, putResp.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, deleteResp.StatusCode);
    }

    [Fact]
    public async Task POST_codigo_duplicado_devuelve_400_problem_json()
    {
        var admin = _factory.CrearCliente(Roles.Administrador);

        var response = await admin.PostAsJsonAsync(RutaPlanes, NuevoPlanRequest(codigo: "RC"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        using var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var detail = body.RootElement.GetProperty("detail").GetString();
        Assert.NotNull(detail);
        Assert.Contains("RC", detail, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task POST_con_tipo_vehiculo_invalido_devuelve_400()
    {
        var admin = _factory.CrearCliente(Roles.Administrador);

        var response = await admin.PostAsJsonAsync(
            RutaPlanes,
            NuevoPlanRequest(codigo: "BICI", tiposPermitidos: "Bicicleta"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task PUT_actualiza_prima_base_y_conserva_prima_de_poliza_seed()
    {
        var admin = _factory.CrearCliente(Roles.Administrador);

        var response = await admin.PutAsJsonAsync(
            $"{RutaPlanes}/{SeedData.PlanRcId}",
            NuevoPlanRequest(codigo: "RC", primaBase: 15000.00m, tiposPermitidos: "Auto,Moto,Camioneta", antiguedadMaxima: null));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var actualizado = await response.Content.ReadFromJsonAsync<PlanResponse>();
        Assert.NotNull(actualizado);
        Assert.Equal(15000.00m, actualizado.PrimaBase);

        await using var context = _sqlite.CreateContext();
        var polizaSeed = await context.Polizas.AsNoTracking().SingleAsync(p => p.Id == SeedData.PolizaId);
        Assert.Equal(12000.00m, polizaSeed.PrimaMensual);
    }
}
