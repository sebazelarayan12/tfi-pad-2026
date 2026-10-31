using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Aseguradora.Application.Dtos;
using Aseguradora.Application.Security;
using Aseguradora.Application.Services;
using Aseguradora.Data;
using Aseguradora.Data.Seed;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Fixtures;
using Aseguradora.Tests.Support;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Aseguradora.Tests.Pagos;

public sealed class ConciliarPagoControllerTests : IDisposable
{
    private readonly SqliteDbFixture sqlite = new();
    private readonly AseguradoraWebFactory factory;
    public ConciliarPagoControllerTests() => factory = CrearFactory();
    private AseguradoraWebFactory CrearFactory(bool autenticacionReal = false) => new()
    {
        UsarAutenticacionReal = autenticacionReal,
        ConfigurarServicios = (_, services) =>
        {
            services.RemoveAll<DbContextOptions<AseguradoraDbContext>>();
            services.RemoveAll<AseguradoraDbContext>();
            services.AddScoped<AseguradoraDbContext>(_ => sqlite.CreateContext());
            services.RemoveAll<IExclusionWebhook>();
            services.AddSingleton<IExclusionWebhook>(new WebhookTestSupport.SinExclusion());
        }
    };
    public void Dispose() { factory.Dispose(); sqlite.Dispose(); }

    [Theory]
    [InlineData(Roles.Empleado)]
    [InlineData(Roles.Administrador)]
    public async Task CheckoutPendiente_200ConContratoPago(string rol)
    {
        using var anonimo = factory.CreateClient();
        var creado = await anonimo.PostAsJsonAsync("/api/publico/pagos", new
        {
            dni = "30123456", numeroPoliza = "POL-0000001", proveedor = "pasarela1",
            cuotaIds = new[] { SeedData.CuotaId(2) }
        });
        Assert.Equal(HttpStatusCode.Created, creado.StatusCode);
        var checkout = await creado.Content.ReadFromJsonAsync<PagoPublicoResponse>();
        using var empleado = factory.CrearCliente(rol);
        var response = await empleado.PostAsync($"/api/pagos/{checkout!.IdPago}/conciliar", null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var pago = await response.Content.ReadFromJsonAsync<PagoResponse>();
        Assert.Equal("PENDIENTE", pago!.Estado);
        Assert.Equal(checkout.IdPago, pago.Id);
        Assert.Equal(12000m, pago.Importe);
        Assert.Null(pago.Factura);
    }

    [Fact]
    public async Task Caja_400()
    {
        using var cliente = factory.CrearCliente(Roles.Empleado);
        Assert.Equal(HttpStatusCode.BadRequest,
            (await cliente.PostAsync($"/api/pagos/{SeedData.PagoId}/conciliar", null)).StatusCode);
    }

    [Fact]
    public async Task Inexistente_404()
    {
        using var cliente = factory.CrearCliente(Roles.Empleado);
        Assert.Equal(HttpStatusCode.NotFound, (await cliente.PostAsync($"/api/pagos/{Guid.NewGuid()}/conciliar", null)).StatusCode);
    }

    [Fact]
    public async Task SinJwt_401()
    {
        using var cliente = factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await cliente.PostAsync($"/api/pagos/{Guid.NewGuid()}/conciliar", null)).StatusCode);
    }

    [Fact]
    public async Task JwtSinPermiso_403()
    {
        using var host = CrearFactory(autenticacionReal: true);
        using var cliente = host.CreateClient();
        cliente.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", TokenDePrueba.Token("Cliente"));
        Assert.Equal(HttpStatusCode.Forbidden, (await cliente.PostAsync($"/api/pagos/{Guid.NewGuid()}/conciliar", null)).StatusCode);
    }
}
