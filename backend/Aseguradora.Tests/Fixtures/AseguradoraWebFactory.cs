using Aseguradora.Api.Security;
using Aseguradora.Tests.Support;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Aseguradora.Tests.Fixtures;

/// <summary>
/// The shared API host for integration tests (C16). It is a class fixture, so it has no constructor
/// arguments: set the options below before the first <c>CreateClient()</c>.
/// By default it runs in Production with mocks forced, the <c>Bearer</c> scheme served by
/// <see cref="TestAuthHandler"/>, and a database that is unreachable (anything that touches it fails
/// fast). Call <see cref="UsarBase"/> to point it at the SQL Server container.
/// </summary>
public sealed class AseguradoraWebFactory : WebApplicationFactory<Program>
{
    public const string BaseInaccesible =
        "Server=127.0.0.1,1;Database=Aseguradora;TrustServerCertificate=True;Connect Timeout=1";

    /// <summary>
    /// Sections under <c>Integraciones:</c> whose <c>UsarMock</c> is forced to true. Configuration has
    /// no wildcard, so a front that adds an integration adds its section here.
    /// </summary>
    public static readonly IReadOnlyList<string> IntegracionesForzadasAMock =
        ["Renaper", "Dnrpa", "Arca", "Pasarelas:pasarela1", "Pasarelas:pasarela2"];

    private bool _iniciado;
    private bool _usarAutenticacionReal;
    private string? _claveJwt = TokenDePrueba.ClaveJwt;
    private string? _connectionString;

    /// <summary>
    /// False (default): <see cref="TestAuthHandler"/> takes the <c>Bearer</c> scheme and
    /// <see cref="CrearCliente"/> authenticates by role. True: the real JWT authentication stays;
    /// only Frente 1 needs it.
    /// </summary>
    public bool UsarAutenticacionReal
    {
        get => _usarAutenticacionReal;
        set { AsegurarNoIniciado(); _usarAutenticacionReal = value; }
    }

    /// <summary>JWT signing key. Null leaves it unset, to test the startup validation.</summary>
    public string? ClaveJwt
    {
        get => _claveJwt;
        set { AsegurarNoIniciado(); _claveJwt = value; }
    }

    /// <summary>Extra configuration, applied after the defaults and before the forced mocks.</summary>
    public IDictionary<string, string> Ajustes { get; } = new Dictionary<string, string>();

    /// <summary>Extra service registrations; receives the configuration the host was built with.</summary>
    public Action<IConfiguration, IServiceCollection>? ConfigurarServicios { get; set; }

    /// <summary>
    /// Points the API at the container, migrated and seeded; skips the test if there is none.
    /// Calling it again with the same container is a no-op, so every test of a class can call it.
    /// </summary>
    public void UsarBase(SqlServerContainerFixture contenedor)
    {
        ArgumentNullException.ThrowIfNull(contenedor);
        Skip.IfNot(contenedor.Disponible, SqlServerContainerFixture.MotivoOmision);
        if (_connectionString == contenedor.ConnectionString)
            return;

        AsegurarNoIniciado();
        _connectionString = contenedor.ConnectionString;
    }

    /// <summary>A client authenticated with <paramref name="rol"/> (<see cref="UsarAutenticacionReal"/> false).</summary>
    /// <remarks>A role the API does not define reaches the handler and gets 401.</remarks>
    public HttpClient CrearCliente(string rol)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(rol);
        if (UsarAutenticacionReal)
            throw new InvalidOperationException("CrearCliente needs UsarAutenticacionReal = false.");

        var cliente = CreateClient();
        cliente.DefaultRequestHeaders.Add(TestAuthHandler.HeaderRol, rol);
        return cliente;
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        _iniciado = true;
        return base.CreateHost(builder);
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Production");

        // UseSetting lands before Program.cs reads configuration at builder time.
        builder.UseSetting("ConnectionStrings:Default", _connectionString ?? BaseInaccesible);
        // With a container the host migrates and runs the ISeeder implementations at startup.
        builder.UseSetting("Migraciones:AplicarAlIniciar", _connectionString is null ? "false" : "true");
        builder.UseSetting("Jwt:Issuer", TokenDePrueba.Emisor);
        builder.UseSetting("Jwt:Audience", TokenDePrueba.Audiencia);
        if (_claveJwt is not null)
            builder.UseSetting("Jwt:Key", _claveJwt);

        foreach (var (proveedor, clave) in TokenDePrueba.ClavesApi())
            builder.UseSetting($"{ApiKeyOpciones.Seccion}:{proveedor}", clave);

        foreach (var (clave, valor) in Ajustes)
            builder.UseSetting(clave, valor);

        // Last, so a test (or an appsettings file) saying UsarMock=false cannot reach a real client.
        foreach (var integracion in IntegracionesForzadasAMock)
            builder.UseSetting($"Integraciones:{integracion}:UsarMock", "true");

        builder.ConfigureServices((contexto, services) =>
            ConfigurarServicios?.Invoke(contexto.Configuration, services));

        builder.ConfigureTestServices(services =>
        {
            // Controllers of the test assembly (ProbeController) are not discovered on their own.
            services.AddControllers().AddApplicationPart(typeof(ProbeController).Assembly);

            if (!_usarAutenticacionReal)
                services.Configure<AuthenticationOptions>(opciones =>
                    opciones.Schemes
                        .Single(esquema => esquema.Name == JwtBearerDefaults.AuthenticationScheme)
                        .HandlerType = typeof(TestAuthHandler));
        });
    }

    private void AsegurarNoIniciado()
    {
        if (_iniciado)
            throw new InvalidOperationException("Set the factory options before the first CreateClient().");
    }
}
