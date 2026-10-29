using System.Net;
using System.Text.Json;
using Aseguradora.Tests.Fixtures;
using Aseguradora.Tests.Support;

namespace Aseguradora.Tests.Security;

/// <summary>
/// Edge cases of the X-Api-Key header: present, absent, wrong and with surrounding spaces.
/// </summary>
public class ApiKeyAuthenticationHandlerTests
{
    private const string ProbeApiKey = "/api/probe/apikey";

    [Fact]
    public async Task Clave_correcta_autentica_con_el_proveedor()
    {
        await using var factory = new AseguradoraWebFactory { UsarAutenticacionReal = true };
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add(TokenDePrueba.ApiKeyHeader, TokenDePrueba.ApiKeyValida("pasarela2"));

        var response = await client.GetAsync(ProbeApiKey);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("pasarela2", body.RootElement.GetProperty("proveedor").GetString());
    }

    [Fact]
    public async Task Clave_ausente_responde_401()
    {
        await using var factory = new AseguradoraWebFactory { UsarAutenticacionReal = true };

        var response = await factory.CreateClient().GetAsync(ProbeApiKey);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Clave_incorrecta_responde_401()
    {
        await using var factory = new AseguradoraWebFactory { UsarAutenticacionReal = true };
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add(TokenDePrueba.ApiKeyHeader, TokenDePrueba.ApiKeyValida("pasarela1") + "x");

        var response = await client.GetAsync(ProbeApiKey);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Clave_con_espacios_en_el_header_responde_401()
    {
        await using var factory = new AseguradoraWebFactory { UsarAutenticacionReal = true };
        var client = factory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Get, ProbeApiKey);
        request.Headers.TryAddWithoutValidation(
            TokenDePrueba.ApiKeyHeader,
            $" {TokenDePrueba.ApiKeyValida("pasarela1")} ");

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
