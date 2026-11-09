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

/// <summary>Listado de cotizaciones (<c>GET /api/cotizaciones</c>).</summary>
public sealed class CotizacionesListadoControllerTests : IDisposable
{
    private const string Ruta = "/api/cotizaciones";

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

    [Fact]
    public async Task Get_SinToken_401()
    {
        await using var factory = CrearFactory(usarAutenticacionReal: true);

        var response = await factory.CreateClient().GetAsync(Ruta);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Get_DevuelveLaCotizacionDePruebaConElContratoDelFront()
    {
        await using (var context = _sqlite.CreateContext())
            Assert.NotNull(await SeedFrente3.AgregarCotizacionDePrueba(context, CancellationToken.None));
        await using var factory = CrearFactory();

        var response = await factory.CrearCliente(Roles.Empleado).GetAsync(Ruta);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var pagina = await response.Content.ReadFromJsonAsync<PaginaResponse<CotizacionListItemResponse>>(Json);
        Assert.NotNull(pagina);
        var fila = Assert.Single(pagina.Items);
        Assert.Equal(SeedFrente3.CotizacionPruebaId, fila.Id);
        Assert.Equal("AC456EF", fila.Patente);
        Assert.Equal(1, pagina.Total);
    }

    [Fact]
    public async Task Get_FiltraPorVigencia()
    {
        await using (var context = _sqlite.CreateContext())
            Assert.NotNull(await SeedFrente3.AgregarCotizacionDePrueba(context, CancellationToken.None));
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        // The test quote is dated in October 2026 and expires 15 days later, long before today's real clock.
        var vigentes = await empleado.GetFromJsonAsync<PaginaResponse<CotizacionListItemResponse>>(
            $"{Ruta}?vigente=true", Json);
        var vencidas = await empleado.GetFromJsonAsync<PaginaResponse<CotizacionListItemResponse>>(
            $"{Ruta}?vigente=false", Json);

        Assert.NotNull(vigentes);
        Assert.NotNull(vencidas);
        Assert.Equal(1, vigentes.Total + vencidas.Total);
    }

    [Theory]
    [InlineData("?tamano=0")]
    [InlineData("?pagina=0")]
    [InlineData("?vigente=quizas")]
    public async Task Get_ConFiltroInvalido_400(string query)
    {
        await using var factory = CrearFactory();

        var response = await factory.CrearCliente(Roles.Empleado).GetAsync(Ruta + query);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
