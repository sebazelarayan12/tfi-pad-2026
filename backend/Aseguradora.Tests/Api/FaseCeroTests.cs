using System.Net;
using System.Text.Json;

namespace Aseguradora.Tests.Api;

public class FaseCeroTests
{
    private const string Development = "Development";
    private const string Production = "Production";
    private const string AllowedOrigin = "http://localhost:5173";
    private const string UnlistedOrigin = "http://otro-origen.example";

    [Fact]
    public async Task Health_ConBaseInaccesible_RetornaUnhealthy()
    {
        await using var factory = new ApiFactory(Production);

        var response = await factory.CreateClient().GetAsync("/health");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.Equal("Unhealthy", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Health_ServidorAnonimo_NoRequiereCredenciales()
    {
        await using var factory = new ApiFactory(Production);
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = null;

        var response = await client.GetAsync("/health");

        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.NotEqual(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Swagger_EnProduction_RetornaNotFound()
    {
        await using var factory = new ApiFactory(Production);
        var client = factory.CreateClient(new() { AllowAutoRedirect = false });

        var swagger = await client.GetAsync("/swagger/v1/swagger.json");
        var health = await client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.NotFound, swagger.StatusCode);
        // No HTTPS redirect outside Development: TLS ends at Cloudflare.
        Assert.NotEqual(HttpStatusCode.TemporaryRedirect, health.StatusCode);
        Assert.NotEqual(HttpStatusCode.PermanentRedirect, health.StatusCode);
    }

    [Fact]
    public async Task Swagger_EnDevelopment_DeclaraEsquemasBearerYApiKey()
    {
        await using var factory = new ApiFactory(Development);

        var json = await factory.CreateClient().GetStringAsync("/swagger/v1/swagger.json");

        var schemes = JsonDocument.Parse(json).RootElement.GetProperty("components").GetProperty("securitySchemes");
        var bearer = schemes.GetProperty("Bearer");
        Assert.Equal("http", bearer.GetProperty("type").GetString());
        Assert.Equal("bearer", bearer.GetProperty("scheme").GetString());
        var apiKey = schemes.GetProperty("ApiKey");
        Assert.Equal("apiKey", apiKey.GetProperty("type").GetString());
        Assert.Equal("header", apiKey.GetProperty("in").GetString());
        Assert.Equal("X-Api-Key", apiKey.GetProperty("name").GetString());
    }

    [Fact]
    public async Task Cors_OrigenListado_RecibeHeader()
    {
        var response = await GetHealthFromOriginAsync(AllowedOrigin);

        Assert.True(response.Headers.TryGetValues("Access-Control-Allow-Origin", out var values));
        Assert.Equal(AllowedOrigin, Assert.Single(values));
    }

    [Fact]
    public async Task Cors_OrigenNoListado_NoRecibeHeader()
    {
        var response = await GetHealthFromOriginAsync(UnlistedOrigin);

        Assert.False(response.Headers.Contains("Access-Control-Allow-Origin"));
    }

    [Fact]
    public async Task Migraciones_AplicarAlIniciarFalso_NoEjecutaMigrate()
    {
        // With an unreachable database, any attempt to migrate would make startup throw.
        await using var factory = new ApiFactory(Development);

        var response = await factory.CreateClient().GetAsync("/health");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
    }

    [Fact]
    public async Task Migraciones_AplicarAlIniciarVerdadero_IntentaMigrar()
    {
        await using var factory = new ApiFactory(Production, new Dictionary<string, string>
        {
            ["Migraciones:AplicarAlIniciar"] = "true"
        });

        await Assert.ThrowsAnyAsync<Exception>(() => factory.CreateClient().GetAsync("/health"));
    }

    private static async Task<HttpResponseMessage> GetHealthFromOriginAsync(string origin)
    {
        await using var factory = new ApiFactory(Production, new Dictionary<string, string>
        {
            ["Cors:AllowedOrigins:0"] = AllowedOrigin
        });
        var request = new HttpRequestMessage(HttpMethod.Get, "/health");
        request.Headers.Add("Origin", origin);

        return await factory.CreateClient().SendAsync(request);
    }
}
