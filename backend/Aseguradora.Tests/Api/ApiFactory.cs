using Aseguradora.Tests.Support;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Aseguradora.Tests.Api;

/// <summary>
/// Hosts the real API in memory without Docker. The database points to a closed port, so anything
/// that touches it fails fast, and startup migrations are off unless a test turns them on.
/// </summary>
public sealed class ApiFactory(string environment, IReadOnlyDictionary<string, string>? settings = null)
    : WebApplicationFactory<Program>
{
    public const string UnreachableDatabase =
        "Server=127.0.0.1,1;Database=Aseguradora;TrustServerCertificate=True;Connect Timeout=1";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment(environment);

        // UseSetting lands before Program.cs reads configuration at builder time.
        builder.UseSetting("Facturacion:Cuit", "00000000000");
        builder.UseSetting("Facturacion:PuntoVenta", "1");
        builder.UseSetting("ConnectionStrings:Default", UnreachableDatabase);
        builder.UseSetting("Migraciones:AplicarAlIniciar", "false");
        // Frente 1 validates Jwt__Key on startup; tests keep the same key as TokenDePrueba.
        builder.UseSetting("Jwt:Key", TokenDePrueba.ClaveJwt);

        foreach (var (key, value) in settings ?? new Dictionary<string, string>())
            builder.UseSetting(key, value);
    }
}
