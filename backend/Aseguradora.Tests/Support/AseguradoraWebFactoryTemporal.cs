using Aseguradora.Api.Security;
using Aseguradora.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Aseguradora.Tests.Support;

/// <summary>
/// TEMPORAL (C16): minimal replacement for the shared <c>AseguradoraWebFactory</c> of US-T-03
/// while that task is not merged. It keeps the real Bearer and ApiKey schemes active and runs
/// against in-memory SQLite. Delete this file when US-T-03 lands.
/// </summary>
public sealed class AseguradoraWebFactoryTemporal : WebApplicationFactory<Program>
{
    private const string BaseInaccesible =
        "Server=127.0.0.1,1;Database=Aseguradora;TrustServerCertificate=True;Connect Timeout=1";

    private readonly SqliteConnection _connection = new("DataSource=:memory:");
    private readonly IReadOnlyDictionary<string, string> _settings;
    private readonly string? _claveJwt;

    /// <param name="settings">Extra configuration applied after the test defaults.</param>
    /// <param name="claveJwt">JWT signing key; null leaves it unset to test startup validation.</param>
    public AseguradoraWebFactoryTemporal(
        IReadOnlyDictionary<string, string>? settings = null,
        string? claveJwt = TokenDePrueba.ClaveJwt)
    {
        _settings = settings ?? new Dictionary<string, string>();
        _claveJwt = claveJwt;

        _connection.Open();
        using var context = CrearContexto();
        context.Database.EnsureCreated();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Production");
        // The SQL Server registration is replaced below; this value only keeps startup offline.
        builder.UseSetting("ConnectionStrings:Default", BaseInaccesible);
        builder.UseSetting("Migraciones:AplicarAlIniciar", "false");
        builder.UseSetting("Jwt:Issuer", TokenDePrueba.Emisor);
        builder.UseSetting("Jwt:Audience", TokenDePrueba.Audiencia);

        if (_claveJwt is not null)
            builder.UseSetting("Jwt:Key", _claveJwt);

        foreach (var (proveedor, clave) in TokenDePrueba.ClavesApi())
            builder.UseSetting($"{ApiKeyOpciones.Seccion}:{proveedor}", clave);

        foreach (var (clave, valor) in _settings)
            builder.UseSetting(clave, valor);

        builder.ConfigureTestServices(services =>
        {
            services.AddControllers().AddApplicationPart(typeof(ProbeController).Assembly);

            // The API registers SQL Server; tests use one in-memory SQLite database per factory.
            services.RemoveAll<AseguradoraDbContext>();
            services.AddSingleton(_connection);
            services.AddScoped(_ => CrearContexto());
        });
    }

    private AseguradoraDbContext CrearContexto() =>
        new(new DbContextOptionsBuilder<AseguradoraDbContext>().UseSqlite(_connection).Options);
}
