using System.Net;
using System.Net.Http.Json;
using Aseguradora.Application.Services;
using Aseguradora.Data;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Fixtures;
using Aseguradora.Tests.Support;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Aseguradora.Tests.Pagos;

public sealed class WebhooksControllerTests : IDisposable
{
    private readonly SqliteDbFixture sqlite = new();
    private readonly AseguradoraWebFactory factory;
    public WebhooksControllerTests()
    {
        factory = new AseguradoraWebFactory
        {
            ConfigurarServicios = (_, services) =>
            {
                services.RemoveAll<DbContextOptions<AseguradoraDbContext>>();
                services.RemoveAll<AseguradoraDbContext>();
                services.AddScoped<AseguradoraDbContext>(_ => sqlite.CreateContext());
                services.RemoveAll<IExclusionWebhook>();
                services.AddSingleton<IExclusionWebhook, WebhookTestSupport.SinExclusion>();
            }
        };
        factory.Ajustes["Integraciones:Pasarelas:pasarela1:ConfirmarWebhook"] = "false";
    }
    public void Dispose() { factory.Dispose(); sqlite.Dispose(); }

    [Fact]
    public async Task AvisoValido_200Recibido()
    {
        using var cliente = factory.CreateClient();
        cliente.DefaultRequestHeaders.Add(TokenDePrueba.ApiKeyHeader, TokenDePrueba.ApiKeyValida("pasarela1"));
        var response = await cliente.PostAsJsonAsync("/api/webhooks/pasarela/pasarela1", WebhookTestSupport.Pedido());
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True((await response.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>()).GetProperty("recibido").GetBoolean());
    }

    [Theory]
    [InlineData(null, "pasarela1", HttpStatusCode.Unauthorized)]
    [InlineData("pasarela2", "pasarela1", HttpStatusCode.Unauthorized)]
    [InlineData("pasarela1", "desconocido", HttpStatusCode.NotFound)]
    public async Task SeguridadYProveedor(string? clave, string proveedor, HttpStatusCode esperado)
    {
        using var cliente = factory.CreateClient();
        if (clave is not null) cliente.DefaultRequestHeaders.Add(TokenDePrueba.ApiKeyHeader, TokenDePrueba.ApiKeyValida(clave));
        var response = await cliente.PostAsJsonAsync($"/api/webhooks/pasarela/{proveedor}", WebhookTestSupport.Pedido());
        Assert.Equal(esperado, response.StatusCode);
    }
}
