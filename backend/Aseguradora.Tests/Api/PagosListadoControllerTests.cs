using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Aseguradora.Application.Comun;
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

/// <summary>Listado de pagos (<c>GET /api/pagos</c>) y pagos de una póliza (<c>GET /api/polizas/{id}/pagos</c>).</summary>
public sealed class PagosListadoControllerTests : IDisposable
{
    private const string RutaPagos = "/api/pagos";
    private static readonly string RutaPagosDePoliza = $"/api/polizas/{SeedData.PolizaId}/pagos";

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

    [Theory]
    [InlineData("/api/pagos")]
    [InlineData("/api/polizas/d1000000-0000-0000-0000-000000000001/pagos")]
    public async Task Get_SinToken_401(string ruta)
    {
        await using var factory = CrearFactory(usarAutenticacionReal: true);

        var response = await factory.CreateClient().GetAsync(ruta);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetListado_DevuelveLaPaginaConElContratoDelFront()
    {
        await using var factory = CrearFactory();

        var response = await factory.CrearCliente(Roles.Empleado).GetAsync(RutaPagos);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var pagina = await response.Content.ReadFromJsonAsync<PaginaResponse<PagoListadoResponse>>(Json);
        Assert.NotNull(pagina);
        var fila = Assert.Single(pagina.Items);
        Assert.Equal("PAG-000001", fila.Numero);
        Assert.Equal("CAJA", fila.Medio);
        Assert.Equal("APROBADO", fila.Estado);
        Assert.Equal("POL-0000001", fila.NumeroPoliza);
        Assert.Equal(1, pagina.Total);
    }

    [Fact]
    public async Task GetListado_FiltraPorMedio()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.GetAsync($"{RutaPagos}?medio=PASARELA");

        var pagina = await response.Content.ReadFromJsonAsync<PaginaResponse<PagoListadoResponse>>(Json);
        Assert.NotNull(pagina);
        Assert.Empty(pagina.Items);
    }

    [Theory]
    [InlineData("?estado=ANULADO")]
    [InlineData("?medio=EFECTIVO")]
    [InlineData("?tamano=0")]
    [InlineData("?pagina=0")]
    public async Task GetListado_ConFiltroInvalido_400(string query)
    {
        await using var factory = CrearFactory();

        var response = await factory.CrearCliente(Roles.Empleado).GetAsync(RutaPagos + query);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetPagosDePoliza_DevuelveLosPagosConSuFactura()
    {
        await using var factory = CrearFactory();

        var response = await factory.CrearCliente(Roles.Empleado).GetAsync(RutaPagosDePoliza);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var pagos = await response.Content.ReadFromJsonAsync<List<PagoResponse>>(Json);
        Assert.NotNull(pagos);
        var pago = Assert.Single(pagos);
        Assert.Equal(SeedData.PagoId, pago.Id);
        Assert.Equal("CAJA", pago.Medio);
    }

    [Fact]
    public async Task GetPagosDePoliza_ConPolizaInexistente_404()
    {
        await using var factory = CrearFactory();

        var response = await factory.CrearCliente(Roles.Empleado).GetAsync($"/api/polizas/{Guid.NewGuid()}/pagos");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
