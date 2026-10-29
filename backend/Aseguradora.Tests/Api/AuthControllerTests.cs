using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.Security;
using Aseguradora.Tests.Fixtures;
using Aseguradora.Tests.Support;
using Microsoft.Extensions.DependencyInjection;

namespace Aseguradora.Tests.Api;

/// <summary>
/// Acceptance criteria of US-F1-03 against the real pipeline: login (CU01), employee creation
/// (CU03) and the token issued by the service passing the policies of US-F1-01.
/// </summary>
public class AuthControllerTests
{
    private const string Login = "/api/auth/login";
    private const string Usuarios = "/api/auth/usuarios";
    private const string ProbeEmpleado = "/api/probe/empleado";

    [Fact]
    public async Task Login_ConCredencialesCorrectas_Responde200ConTokenRolYExpiracion()
    {
        var store = new UsuarioStoreFalso();
        await using var factory = CrearFactory(store);

        var response = await factory.CreateClient().PostAsJsonAsync(Login, new
        {
            email = UsuarioStoreFalso.EmailAdministrador,
            password = UsuarioStoreFalso.PasswordAdministrador
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var token = body.RootElement.GetProperty("token").GetString();
        Assert.False(string.IsNullOrWhiteSpace(token));
        Assert.Equal(Roles.Administrador, body.RootElement.GetProperty("rol").GetString());
        Assert.True(body.RootElement.GetProperty("expiraEn").GetDateTimeOffset() > DateTimeOffset.UtcNow);

        using var payload = LeerPayload(token!);
        Assert.Equal(store.IdDe(UsuarioStoreFalso.EmailAdministrador), payload.RootElement.GetProperty("sub").GetString());
        Assert.Equal(UsuarioStoreFalso.EmailAdministrador, payload.RootElement.GetProperty("email").GetString());
        Assert.Equal(Roles.Administrador, payload.RootElement.GetProperty("role").GetString());
    }

    [Fact]
    public async Task Login_ConEmailInexistenteYPasswordIncorrecta_Responde401ConElMismoMensaje()
    {
        await using var factory = CrearFactory(new UsuarioStoreFalso());
        var client = factory.CreateClient();

        var inexistente = await client.PostAsJsonAsync(Login, new
        {
            email = "no-existe@example.com",
            password = UsuarioStoreFalso.PasswordAdministrador
        });
        var incorrecta = await client.PostAsJsonAsync(Login, new
        {
            email = UsuarioStoreFalso.EmailAdministrador,
            password = "Password_Incorrecta1!"
        });

        var detalleInexistente = await AssertProblemDetailAsync(inexistente, HttpStatusCode.Unauthorized);
        var detalleIncorrecta = await AssertProblemDetailAsync(incorrecta, HttpStatusCode.Unauthorized);
        Assert.Equal(CredencialesInvalidasException.Mensaje, detalleInexistente);
        Assert.Equal(detalleInexistente, detalleIncorrecta);
    }

    [Fact]
    public async Task Alta_SinToken_Responde401()
    {
        await using var factory = CrearFactory(new UsuarioStoreFalso());

        var response = await factory.CreateClient().PostAsJsonAsync(Usuarios, AltaValida());

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Alta_ConTokenDeEmpleado_Responde403()
    {
        await using var factory = CrearFactory(new UsuarioStoreFalso());

        var response = await factory.CrearCliente(Roles.Empleado).PostAsJsonAsync(Usuarios, AltaValida());

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Alta_ConTokenDeAdministrador_Responde201SinPasswordNiEntidad()
    {
        var store = new UsuarioStoreFalso();
        await using var factory = CrearFactory(store);

        var response = await factory.CrearCliente(Roles.Administrador).PostAsJsonAsync(Usuarios, AltaValida());

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var texto = await response.Content.ReadAsStringAsync();
        using var body = JsonDocument.Parse(texto);
        Assert.Equal(
            ["email", "id", "rol"],
            body.RootElement.EnumerateObject().Select(propiedad => propiedad.Name).Order().ToArray());
        Assert.Equal("nuevo@example.com", body.RootElement.GetProperty("email").GetString());
        Assert.Equal(Roles.Empleado, body.RootElement.GetProperty("rol").GetString());
        Assert.DoesNotContain("password", texto, StringComparison.OrdinalIgnoreCase);
        Assert.Single(store.Creaciones);
    }

    [Fact]
    public async Task Alta_ConEmailYaRegistrado_Responde400()
    {
        await using var factory = CrearFactory(new UsuarioStoreFalso());

        var response = await factory.CrearCliente(Roles.Administrador).PostAsJsonAsync(Usuarios, new
        {
            email = UsuarioStoreFalso.EmailEmpleado,
            password = "Nuevo_Empleado1!",
            rol = Roles.Empleado,
            nombre = "Nuevo",
            apellido = "Empleado"
        });

        await AssertProblemDetailAsync(response, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Alta_ConRolCliente_Responde400()
    {
        await using var factory = CrearFactory(new UsuarioStoreFalso());

        var response = await factory.CrearCliente(Roles.Administrador).PostAsJsonAsync(Usuarios, new
        {
            email = "cliente@example.com",
            password = "Cliente_Prueba1!",
            rol = "Cliente",
            nombre = "Cliente",
            apellido = "Prueba"
        });

        await AssertProblemDetailAsync(response, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task TokenEmitido_PasaLaPoliticaEmpleado_DeF101()
    {
        await using var factory = CrearFactory(new UsuarioStoreFalso(), usarAutenticacionReal: true);
        var client = factory.CreateClient();

        var login = await client.PostAsJsonAsync(Login, new
        {
            email = UsuarioStoreFalso.EmailEmpleado,
            password = UsuarioStoreFalso.PasswordEmpleado
        });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);

        using var body = JsonDocument.Parse(await login.Content.ReadAsStringAsync());
        Assert.Equal(Roles.Empleado, body.RootElement.GetProperty("rol").GetString());
        var token = body.RootElement.GetProperty("token").GetString();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync(ProbeEmpleado);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    private static AseguradoraWebFactory CrearFactory(
        UsuarioStoreFalso store,
        bool usarAutenticacionReal = false) =>
        new()
        {
            UsarAutenticacionReal = usarAutenticacionReal,
            ConfigurarServicios = (_, services) => services.AddScoped<IUsuarioStore>(_ => store)
        };

    private static object AltaValida() => new
    {
        email = "nuevo@example.com",
        password = "Nuevo_Empleado1!",
        rol = Roles.Empleado,
        nombre = "Nuevo",
        apellido = "Empleado"
    };

    private static JsonDocument LeerPayload(string token)
    {
        var payload = token.Split('.')[1].Replace('-', '+').Replace('_', '/');
        payload = payload.PadRight(payload.Length + (4 - payload.Length % 4) % 4, '=');
        return JsonDocument.Parse(Convert.FromBase64String(payload));
    }

    private static async Task<string?> AssertProblemDetailAsync(
        HttpResponseMessage response,
        HttpStatusCode status)
    {
        Assert.Equal(status, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        using var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal((int)status, body.RootElement.GetProperty("status").GetInt32());
        return body.RootElement.TryGetProperty("detail", out var detail) ? detail.GetString() : null;
    }
}
