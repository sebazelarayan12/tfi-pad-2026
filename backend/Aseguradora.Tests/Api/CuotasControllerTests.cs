using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Aseguradora.Application.Comun;
using Aseguradora.Application.Dtos;
using Aseguradora.Application.Security;
using Aseguradora.Data;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Fixtures;
using Aseguradora.Tests.Support;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Aseguradora.Tests.Api;

public sealed class CuotasControllerTests : IDisposable
{
    private const string RutaCuotas = "/api/cuotas";

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
    public async Task GET_devuelve_las_cuotas_paginadas_para_un_empleado()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.GetAsync($"{RutaCuotas}?pagina=1&tamano=2");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var pagina = await response.Content.ReadFromJsonAsync<PaginaResponse<CuotaListItemResponse>>();
        Assert.NotNull(pagina);
        Assert.Equal(2, pagina.Items.Count);
        Assert.Equal(6, pagina.Total);
        Assert.Equal(1, pagina.Items[0].NumeroCuota);
    }

    [Fact]
    public async Task GET_acepta_el_estado_por_nombre_y_el_orden_por_fecha_de_vencimiento()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.GetAsync($"{RutaCuotas}?estado=Pendiente&orden=fechaVencimiento");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var pagina = await response.Content.ReadFromJsonAsync<PaginaResponse<CuotaListItemResponse>>();
        Assert.Equal(5, pagina?.Total);
    }

    [Theory]
    [InlineData("orden=importe")]
    [InlineData("estado=Inexistente")]
    [InlineData("tamano=101")]
    [InlineData("pagina=0")]
    public async Task GET_con_parametros_invalidos_devuelve_400(string consulta)
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.GetAsync($"{RutaCuotas}?{consulta}");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Sin_token_devuelve_401_y_sin_rol_403()
    {
        await using var factory = CrearFactory(usarAutenticacionReal: true);
        var anonimo = factory.CreateClient();
        var sinRol = factory.CreateClient();
        sinRol.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TokenDePrueba.Token(rol: null));

        var respSinToken = await anonimo.GetAsync(RutaCuotas);
        var respSinRol = await sinRol.GetAsync(RutaCuotas);

        Assert.Equal(HttpStatusCode.Unauthorized, respSinToken.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, respSinRol.StatusCode);
    }
}
