using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using Aseguradora.Application.Security;
using Aseguradora.Tests.Support;

namespace Aseguradora.Tests.Security;

/// <summary>
/// Acceptance criteria of US-F1-01: JWT roles, the three policies and the API key scheme,
/// exercised through endpoints protected with the literal policy names (C10).
/// </summary>
public class AutorizacionTests
{
    private const string ProbeEmpleado = "/api/probe/empleado";
    private const string ProbeAdmin = "/api/probe/admin";
    private const string ProbeApiKey = "/api/probe/apikey";

    [Fact]
    public async Task Empleado_sin_credenciales_responde_401()
    {
        await using var factory = new AseguradoraWebFactoryTemporal();

        var response = await factory.CreateClient().GetAsync(ProbeEmpleado);

        await AssertProblemDetailsAsync(response, HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Rol_Empleado_en_Admin_responde_403()
    {
        await using var factory = new AseguradoraWebFactoryTemporal();
        var client = ClienteConToken(factory, Roles.Empleado);

        var response = await client.GetAsync(ProbeAdmin);

        await AssertProblemDetailsAsync(response, HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Rol_Administrador_pasa_Empleado_y_Admin()
    {
        await using var factory = new AseguradoraWebFactoryTemporal();
        var client = ClienteConToken(factory, Roles.Administrador);

        var empleado = await client.GetAsync(ProbeEmpleado);
        var admin = await client.GetAsync(ProbeAdmin);

        Assert.Equal(HttpStatusCode.OK, empleado.StatusCode);
        Assert.Equal(HttpStatusCode.OK, admin.StatusCode);
    }

    [Fact]
    public async Task Rol_Empleado_pasa_politica_Empleado()
    {
        // Regression: the JWT handler must expose the role as ClaimTypes.Role.
        await using var factory = new AseguradoraWebFactoryTemporal();
        var client = ClienteConToken(factory, Roles.Empleado);

        var response = await client.GetAsync(ProbeEmpleado);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Token_expirado_responde_401()
    {
        await using var factory = new AseguradoraWebFactoryTemporal();
        var client = ClienteConToken(factory, Roles.Empleado, TimeSpan.FromMinutes(-10));

        var response = await client.GetAsync(ProbeEmpleado);

        await AssertProblemDetailsAsync(response, HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ApiKey_valida_pasa_politica_ApiKey_con_claim_proveedor()
    {
        await using var factory = new AseguradoraWebFactoryTemporal();
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add(TokenDePrueba.ApiKeyHeader, TokenDePrueba.ApiKeyValida(TokenDePrueba.ProveedorValido));

        var response = await client.GetAsync(ProbeApiKey);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal(TokenDePrueba.ProveedorValido, body.RootElement.GetProperty("proveedor").GetString());
    }

    [Fact]
    public async Task ApiKey_en_politica_Empleado_responde_401()
    {
        await using var factory = new AseguradoraWebFactoryTemporal();
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add(TokenDePrueba.ApiKeyHeader, TokenDePrueba.ApiKeyValida(TokenDePrueba.ProveedorValido));

        var response = await client.GetAsync(ProbeEmpleado);

        await AssertProblemDetailsAsync(response, HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task JWT_en_politica_ApiKey_responde_401()
    {
        await using var factory = new AseguradoraWebFactoryTemporal();
        var client = ClienteConToken(factory, Roles.Administrador);

        var response = await client.GetAsync(ProbeApiKey);

        await AssertProblemDetailsAsync(response, HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ApiKey_ausente_o_incorrecta_responde_401()
    {
        await using var factory = new AseguradoraWebFactoryTemporal();
        var sinClave = factory.CreateClient();
        var incorrecta = factory.CreateClient();
        incorrecta.DefaultRequestHeaders.Add(TokenDePrueba.ApiKeyHeader, "clave-que-no-existe");

        var sinClaveResponse = await sinClave.GetAsync(ProbeApiKey);
        var incorrectaResponse = await incorrecta.GetAsync(ProbeApiKey);

        await AssertProblemDetailsAsync(sinClaveResponse, HttpStatusCode.Unauthorized);
        await AssertProblemDetailsAsync(incorrectaResponse, HttpStatusCode.Unauthorized);
    }

    private static HttpClient ClienteConToken(
        AseguradoraWebFactoryTemporal factory,
        string rol,
        TimeSpan? vigencia = null)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TokenDePrueba.Token(rol, vigencia));
        return client;
    }

    private static async Task AssertProblemDetailsAsync(HttpResponseMessage response, HttpStatusCode status)
    {
        Assert.Equal(status, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        using var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal((int)status, body.RootElement.GetProperty("status").GetInt32());
    }
}
