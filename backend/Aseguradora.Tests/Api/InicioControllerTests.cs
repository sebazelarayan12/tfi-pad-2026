using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using Aseguradora.Application.Security;
using Aseguradora.Data;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Fixtures;
using Aseguradora.Tests.Support;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Aseguradora.Tests.Api;

public sealed class InicioControllerTests : IDisposable
{
    private const string Ruta = "/api/inicio/resumen";

    private readonly SqliteDbFixture _sqlite = new();

    public void Dispose() => _sqlite.Dispose();

    private AseguradoraWebFactory CrearFactory(bool usarAutenticacionReal = false) =>
        new()
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
    public async Task GET_devuelve_el_resumen_con_la_forma_del_contrato()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.GetAsync(Ruta);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var raiz = body.RootElement;
        Assert.Matches(@"^\d{4}-\d{2}-\d{2}$", raiz.GetProperty("fechaCorte").GetString());
        Assert.Equal(1, raiz.GetProperty("polizasPorEstado").GetProperty("Vigente").GetInt32());
        Assert.Equal(0, raiz.GetProperty("cuotasVencidas").GetProperty("total").GetInt32());
        Assert.Equal(5m, raiz.GetProperty("cuotasVencidas").GetProperty("recargoPorcentaje").GetDecimal());
        Assert.Equal(JsonValueKind.Array, raiz.GetProperty("cuotasVencidas").GetProperty("recientes").ValueKind);
        Assert.Equal(JsonValueKind.True, raiz.GetProperty("rendicionPendienteHoy").ValueKind);
        Assert.Equal(0, raiz.GetProperty("facturasPendientesCae").GetInt32());
    }

    [Fact]
    public async Task Sin_token_devuelve_401_y_sin_rol_403()
    {
        await using var factory = CrearFactory(usarAutenticacionReal: true);
        var anonimo = factory.CreateClient();
        var sinRol = factory.CreateClient();
        sinRol.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TokenDePrueba.Token(rol: null));

        Assert.Equal(HttpStatusCode.Unauthorized, (await anonimo.GetAsync(Ruta)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await sinRol.GetAsync(Ruta)).StatusCode);
    }
}
