using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Aseguradora.Application.Security;
using Aseguradora.Tests.Fixtures;
using Aseguradora.Tests.Support;
using Microsoft.Extensions.DependencyInjection;

namespace Aseguradora.Tests.Api;

/// <summary>
/// Acceptance criteria of US-F1-09 against the real pipeline (real JWT, real policies): the login
/// flag, the 403 <c>PASSWORD_CAMBIO_REQUERIDO</c> and <c>POST /api/auth/cambiar-password</c>.
/// </summary>
public class CambioPasswordApiTests
{
    private const string Login = "/api/auth/login";
    private const string Cambiar = "/api/auth/cambiar-password";
    private const string ProbeEmpleado = "/api/probe/empleado";
    private const string ProbeAdmin = "/api/probe/admin";
    private const string EmailPendiente = "nuevo@example.com";
    private const string PasswordTemporal = "Temporal_Prueba1!";
    private const string PasswordNueva = "Definitiva_Prueba1!";

    [Fact]
    public async Task Login_ConCuentaMarcada_InformaLaBanderaYElTokenLlevaElClaim()
    {
        await using var factory = CrearFactory(out _);

        var (token, bandera) = await IniciarSesionAsync(factory.CreateClient(), EmailPendiente, PasswordTemporal);

        Assert.True(bandera);
        using var payload = LeerPayload(token);
        Assert.Equal("true", payload.RootElement.GetProperty("cambiar_password").GetString());
    }

    [Fact]
    public async Task Login_ConCuentaNoMarcada_InformaFalseYElTokenNoLlevaElClaim()
    {
        await using var factory = CrearFactory(out _);

        var (token, bandera) = await IniciarSesionAsync(
            factory.CreateClient(), UsuarioStoreFalso.EmailEmpleado, UsuarioStoreFalso.PasswordEmpleado);

        Assert.False(bandera);
        using var payload = LeerPayload(token);
        Assert.False(payload.RootElement.TryGetProperty("cambiar_password", out _));
    }

    [Theory]
    [InlineData(ProbeEmpleado)]
    [InlineData(ProbeAdmin)]
    public async Task TokenMarcado_EnRutaProtegida_Responde403ConCodigo(string ruta)
    {
        await using var factory = CrearFactory(out var store);
        store.Agregar("admin-pendiente@example.com", Roles.Administrador, PasswordTemporal, debeCambiarPassword: true);
        var email = ruta == ProbeAdmin ? "admin-pendiente@example.com" : EmailPendiente;
        var client = factory.CreateClient();
        var (token, _) = await IniciarSesionAsync(client, email, PasswordTemporal);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync(ruta);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        using var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("PASSWORD_CAMBIO_REQUERIDO", body.RootElement.GetProperty("code").GetString());
        Assert.Equal("PASSWORD_CAMBIO_REQUERIDO", body.RootElement.GetProperty("codigo").GetString());
    }

    [Fact]
    public async Task CambiarPassword_ConTokenMarcadoYDatosValidos_Responde200ConTokenSinClaimYElNuevoAccede()
    {
        await using var factory = CrearFactory(out var store);
        var client = factory.CreateClient();
        var (token, _) = await IniciarSesionAsync(client, EmailPendiente, PasswordTemporal);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.PostAsJsonAsync(Cambiar, new
        {
            passwordActual = PasswordTemporal,
            passwordNueva = PasswordNueva
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.False(body.RootElement.GetProperty("debeCambiarPassword").GetBoolean());
        var tokenNuevo = body.RootElement.GetProperty("token").GetString()!;
        using var payload = LeerPayload(tokenNuevo);
        Assert.False(payload.RootElement.TryGetProperty("cambiar_password", out _));
        Assert.False(store.DebeCambiarDe(EmailPendiente));

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tokenNuevo);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync(ProbeEmpleado)).StatusCode);
    }

    [Fact]
    public async Task CambiarPassword_ConActualIncorrecta_Responde400NoCambiaLaBandera()
    {
        await using var factory = CrearFactory(out var store);
        var client = await ClienteMarcadoAsync(factory);

        var response = await client.PostAsJsonAsync(Cambiar, new
        {
            passwordActual = "Incorrecta_Prueba1!",
            passwordNueva = PasswordNueva
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.False(string.IsNullOrWhiteSpace(body.RootElement.GetProperty("detail").GetString()));
        Assert.True(store.DebeCambiarDe(EmailPendiente));
    }

    [Fact]
    public async Task CambiarPassword_ConNuevaDebil_Responde400()
    {
        await using var factory = CrearFactory(out _);
        var client = await ClienteMarcadoAsync(factory);

        var response = await client.PostAsJsonAsync(Cambiar, new
        {
            passwordActual = PasswordTemporal,
            passwordNueva = "corta"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CambiarPassword_ConNuevaIgualALaActual_Responde400()
    {
        await using var factory = CrearFactory(out _);
        var client = await ClienteMarcadoAsync(factory);

        var response = await client.PostAsJsonAsync(Cambiar, new
        {
            passwordActual = PasswordTemporal,
            passwordNueva = PasswordTemporal
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CambiarPassword_SinToken_Responde401()
    {
        await using var factory = CrearFactory(out _);

        var response = await factory.CreateClient().PostAsJsonAsync(Cambiar, new
        {
            passwordActual = PasswordTemporal,
            passwordNueva = PasswordNueva
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private static AseguradoraWebFactory CrearFactory(out UsuarioStoreFalso store)
    {
        var falso = new UsuarioStoreFalso();
        falso.Agregar(EmailPendiente, Roles.Empleado, PasswordTemporal, debeCambiarPassword: true);
        store = falso;
        return new AseguradoraWebFactory
        {
            UsarAutenticacionReal = true,
            ConfigurarServicios = (_, services) => services.AddScoped<IUsuarioStore>(_ => falso)
        };
    }

    private static async Task<HttpClient> ClienteMarcadoAsync(AseguradoraWebFactory factory)
    {
        var client = factory.CreateClient();
        var (token, _) = await IniciarSesionAsync(client, EmailPendiente, PasswordTemporal);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    private static async Task<(string Token, bool DebeCambiar)> IniciarSesionAsync(
        HttpClient client,
        string email,
        string password)
    {
        var response = await client.PostAsJsonAsync(Login, new { email, password });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return (
            body.RootElement.GetProperty("token").GetString()!,
            body.RootElement.GetProperty("debeCambiarPassword").GetBoolean());
    }

    private static JsonDocument LeerPayload(string token)
    {
        var payload = token.Split('.')[1].Replace('-', '+').Replace('_', '/');
        payload = payload.PadRight(payload.Length + (4 - payload.Length % 4) % 4, '=');
        return JsonDocument.Parse(Convert.FromBase64String(payload));
    }
}
