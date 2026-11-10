using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Aseguradora.Application.Security;
using Aseguradora.Data;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Fixtures;
using Aseguradora.Tests.Support;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Aseguradora.Tests.Grupos;

/// <summary>
/// The whole self-service flow over HTTP with the real JWT and API key schemes (C16):
/// register, sign in, approval, key generation, use of the key and revocation.
/// </summary>
public sealed class GruposControllerTests : IDisposable
{
    private const string Password = "Clave-Segura-2026!";
    private const string RutaServicio = "/api/externo/vehiculos/AB123CD/seguro-vigente";

    private readonly SqliteDbFixture _sqlite = new();
    private readonly AseguradoraWebFactory _factory;

    public GruposControllerTests()
    {
        _factory = new AseguradoraWebFactory
        {
            UsarAutenticacionReal = true,
            ConfigurarServicios = (_, services) =>
            {
                services.RemoveAll<DbContextOptions<AseguradoraDbContext>>();
                services.RemoveAll<AseguradoraDbContext>();
                services.AddScoped<AseguradoraDbContext>(_ => _sqlite.CreateContext());
            }
        };
    }

    public void Dispose()
    {
        _factory.Dispose();
        _sqlite.Dispose();
    }

    private static HttpClient ConToken(HttpClient cliente, string token)
    {
        cliente.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return cliente;
    }

    private HttpClient Admin() => ConToken(_factory.CreateClient(), TokenDePrueba.Token(Roles.Administrador));

    private async Task<Guid> RegistrarAsync(string email = "equipo@example.com", string nombre = "Estacionamiento Sur")
    {
        var respuesta = await _factory.CreateClient().PostAsJsonAsync("/api/publico/grupos/registro", new
        {
            email,
            password = Password,
            nombre,
            contacto = "Ana Perez",
            descripcion = "Consultar seguro vigente por patente."
        });
        Assert.Equal(HttpStatusCode.Created, respuesta.StatusCode);
        using var cuerpo = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        return cuerpo.RootElement.GetProperty("id").GetGuid();
    }

    private async Task<HttpClient> IngresarAsync(string email = "equipo@example.com")
    {
        var login = await _factory.CreateClient().PostAsJsonAsync(
            "/api/publico/grupos/login", new { email, password = Password });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        using var cuerpo = JsonDocument.Parse(await login.Content.ReadAsStringAsync());
        Assert.Equal("Grupo", cuerpo.RootElement.GetProperty("rol").GetString());
        return ConToken(_factory.CreateClient(), cuerpo.RootElement.GetProperty("token").GetString()!);
    }

    private async Task<string> GenerarClaveAsync(HttpClient grupo)
    {
        var respuesta = await grupo.PostAsync("/api/grupos/mi-cuenta/clave", null);
        Assert.Equal(HttpStatusCode.Created, respuesta.StatusCode);
        using var cuerpo = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        return cuerpo.RootElement.GetProperty("clave").GetString()!;
    }

    private async Task<HttpStatusCode> LlamarServicioAsync(string clave)
    {
        var cliente = _factory.CreateClient();
        cliente.DefaultRequestHeaders.Add(TokenDePrueba.ApiKeyHeader, clave);
        return (await cliente.GetAsync(RutaServicio)).StatusCode;
    }

    [Fact]
    public async Task Flujo_completo_registro_aprobacion_clave_uso_y_revocacion()
    {
        var id = await RegistrarAsync();
        var grupo = await IngresarAsync();

        // Pending: it can read its account but cannot get a key yet.
        var cuenta = await grupo.GetFromJsonAsync<JsonElement>("/api/grupos/mi-cuenta");
        Assert.Equal(0, cuenta.GetProperty("estado").GetInt32());
        Assert.False(cuenta.GetProperty("tieneClave").GetBoolean());
        Assert.Equal(HttpStatusCode.BadRequest, (await grupo.PostAsync("/api/grupos/mi-cuenta/clave", null)).StatusCode);

        var admin = Admin();
        Assert.Equal(HttpStatusCode.OK, (await admin.PostAsync($"/api/grupos/{id}/aprobar", null)).StatusCode);

        var clave = await GenerarClaveAsync(grupo);
        Assert.Equal(HttpStatusCode.OK, await LlamarServicioAsync(clave));

        // A new key invalidates the old one.
        var nueva = await GenerarClaveAsync(grupo);
        Assert.Equal(HttpStatusCode.Unauthorized, await LlamarServicioAsync(clave));
        Assert.Equal(HttpStatusCode.OK, await LlamarServicioAsync(nueva));

        var revocar = await admin.PostAsJsonAsync($"/api/grupos/{id}/revocar", new { motivo = "Uso indebido." });
        Assert.Equal(HttpStatusCode.OK, revocar.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, await LlamarServicioAsync(nueva));
    }

    [Fact]
    public async Task La_respuesta_de_la_cuenta_nunca_incluye_el_hash_ni_la_clave_completa()
    {
        var id = await RegistrarAsync();
        await Admin().PostAsync($"/api/grupos/{id}/aprobar", null);
        var grupo = await IngresarAsync();
        var clave = await GenerarClaveAsync(grupo);

        var texto = await grupo.GetStringAsync("/api/grupos/mi-cuenta");

        Assert.DoesNotContain(clave, texto);
        Assert.DoesNotContain("passwordHash", texto, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("claveHash", texto, StringComparison.OrdinalIgnoreCase);
        Assert.Contains(clave[..8], texto);
    }

    [Fact]
    public async Task Un_grupo_solo_entra_a_su_panel_y_un_empleado_no_entra_al_panel_del_grupo()
    {
        await RegistrarAsync();
        var grupo = await IngresarAsync();

        Assert.Equal(HttpStatusCode.Forbidden, (await grupo.GetAsync("/api/usuarios")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await grupo.GetAsync("/api/grupos")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await grupo.GetAsync("/api/clientes")).StatusCode);

        var empleado = ConToken(_factory.CreateClient(), TokenDePrueba.Token(Roles.Empleado));
        Assert.Equal(HttpStatusCode.Forbidden, (await empleado.GetAsync("/api/grupos/mi-cuenta")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await empleado.GetAsync("/api/grupos")).StatusCode);
    }

    [Fact]
    public async Task Rechazar_deja_el_motivo_visible_para_el_grupo()
    {
        var id = await RegistrarAsync();

        var rechazo = await Admin().PostAsJsonAsync($"/api/grupos/{id}/rechazar", new { motivo = "Falta el contacto." });

        Assert.Equal(HttpStatusCode.OK, rechazo.StatusCode);
        var cuenta = await (await IngresarAsync()).GetFromJsonAsync<JsonElement>("/api/grupos/mi-cuenta");
        Assert.Equal(2, cuenta.GetProperty("estado").GetInt32());
        Assert.Equal("Falta el contacto.", cuenta.GetProperty("motivo").GetString());
    }

    [Fact]
    public async Task Listar_devuelve_los_grupos_y_filtra_por_estado()
    {
        var a = await RegistrarAsync("a@example.com", "Grupo A");
        await RegistrarAsync("b@example.com", "Grupo B");
        await Admin().PostAsync($"/api/grupos/{a}/aprobar", null);

        var pendientes = await Admin().GetFromJsonAsync<JsonElement>("/api/grupos?estado=0");

        Assert.Equal(1, pendientes.GetProperty("total").GetInt32());
        Assert.Equal("Grupo B", pendientes.GetProperty("items")[0].GetProperty("nombre").GetString());
    }

    [Fact]
    public async Task Registrar_con_email_repetido_responde_400()
    {
        await RegistrarAsync();

        var respuesta = await _factory.CreateClient().PostAsJsonAsync("/api/publico/grupos/registro", new
        {
            email = "equipo@example.com",
            password = Password,
            nombre = "Otro",
            contacto = "Beto",
            descripcion = "Algo."
        });

        Assert.Equal(HttpStatusCode.BadRequest, respuesta.StatusCode);
    }

    [Fact]
    public async Task Login_con_contrasena_incorrecta_responde_401()
    {
        await RegistrarAsync();

        var respuesta = await _factory.CreateClient().PostAsJsonAsync(
            "/api/publico/grupos/login", new { email = "equipo@example.com", password = "Otra-Clave-2026!" });

        Assert.Equal(HttpStatusCode.Unauthorized, respuesta.StatusCode);
    }

    [Fact]
    public async Task Una_clave_inventada_con_el_prefijo_de_los_grupos_responde_401()
    {
        Assert.Equal(HttpStatusCode.Unauthorized, await LlamarServicioAsync("nxk_clave-inventada"));
    }

    [Fact]
    public async Task Una_clave_de_grupo_no_sirve_en_los_endpoints_de_empleados()
    {
        var id = await RegistrarAsync();
        await Admin().PostAsync($"/api/grupos/{id}/aprobar", null);
        var clave = await GenerarClaveAsync(await IngresarAsync());
        var cliente = _factory.CreateClient();
        cliente.DefaultRequestHeaders.Add(TokenDePrueba.ApiKeyHeader, clave);

        Assert.Equal(HttpStatusCode.Unauthorized, (await cliente.GetAsync("/api/grupos")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await cliente.GetAsync("/api/usuarios")).StatusCode);
    }
}
