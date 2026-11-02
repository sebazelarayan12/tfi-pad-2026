using System.Reflection;
using Aseguradora.Api.Frentes.Frente1;
using Aseguradora.Api.Frentes.Frente2;
using Aseguradora.Api.Frentes.Frente3;
using Aseguradora.Api.Frentes.Frente4;
using Aseguradora.Application.External;
using Aseguradora.Integrations;
using Aseguradora.Integrations.Arca;
using Aseguradora.Integrations.Dnrpa;
using Aseguradora.Integrations.Pasarela;
using Aseguradora.Integrations.Renaper;
using Aseguradora.Tests.Fixtures;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Aseguradora.Tests.EndToEnd;

/// <summary>
/// US-T-04: every interface under <c>Application/External</c> has a mock and a real implementation
/// registered, chosen by <c>Integraciones:*:UsarMock</c>. This is the checklist behind
/// <c>docs/integraciones.md</c>: when a group delivers its API, the team flips the flag and this test
/// shows the real client is wired. It needs no Docker.
/// </summary>
public sealed class IntegracionesRegistroTests
{
    private static readonly string[] Proveedores = ["pasarela1", "pasarela2"];

    private static ServiceProvider Construir(bool usarMock)
    {
        var valor = usarMock ? "true" : "false";
        var ajustes = new Dictionary<string, string?>
        {
            ["ConnectionStrings:Default"] = AseguradoraWebFactory.BaseInaccesible,
            ["Facturacion:Cuit"] = "00000000000",
            ["Facturacion:PuntoVenta"] = "1",
            ["Pagos:UrlBaseApi"] = "https://api.example.com",
            ["Pagos:UrlRetornoExito"] = "https://web.example.com/pago/exito",
            ["Pagos:UrlRetornoError"] = "https://web.example.com/pago/error"
        };

        foreach (var nombre in new[] { "Renaper", "Dnrpa", "Arca", "Pasarelas:pasarela1", "Pasarelas:pasarela2" })
        {
            ajustes[$"Integraciones:{nombre}:UsarMock"] = valor;
            if (!usarMock)
            {
                ajustes[$"Integraciones:{nombre}:BaseUrl"] = $"https://{nombre.Replace(':', '-').ToLowerInvariant()}.example.com";
                ajustes[$"Integraciones:{nombre}:ApiKey"] = "clave-de-prueba";
            }
        }

        var configuracion = new ConfigurationBuilder().AddInMemoryCollection(ajustes).Build();
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddFrente1(configuracion);
        services.AddFrente2(configuracion);
        services.AddFrente3(configuracion);
        services.AddFrente4(configuracion);
        services.AddIntegraciones(configuracion);
        return services.BuildServiceProvider();
    }

    private static T Resolver<T>(ServiceProvider provider) where T : notnull
    {
        using var alcance = provider.CreateScope();
        return alcance.ServiceProvider.GetRequiredService<T>();
    }

    [Fact]
    public void TodasLasInterfacesExternasTienenMockYReal()
    {
        var interfaces = typeof(IRenaperService).Assembly.GetTypes()
            .Where(t => t.IsInterface && t.IsPublic && t.Namespace == typeof(IRenaperService).Namespace)
            .Select(t => t.Name)
            .Order()
            .ToArray();

        // A new interface under Application/External must be added here and to docs/integraciones.md.
        string[] conocidas = [nameof(IArcaService), nameof(IDnrpaService), nameof(IPasarelaResolver), nameof(IPasarelaService), nameof(IRenaperService)];
        Assert.Equal(conocidas.Order().ToArray(), interfaces);

        using var mocks = Construir(usarMock: true);
        using var reales = Construir(usarMock: false);

        // Single-implementation services: AgregarIntegracion picks the mock or the HTTP client.
        Assert.IsType<RenaperMockService>(Resolver<IRenaperService>(mocks));
        Assert.IsType<RenaperHttpService>(Resolver<IRenaperService>(reales));
        Assert.IsType<DnrpaMockService>(Resolver<IDnrpaService>(mocks));
        Assert.IsType<DnrpaHttpService>(Resolver<IDnrpaService>(reales));
        Assert.IsType<ArcaMockService>(Resolver<IArcaService>(mocks));
        Assert.IsType<ArcaHttpService>(Resolver<IArcaService>(reales));

        // The gateway has one implementation per provider, reached through the resolver (see US-T-02).
        var resolverMock = Resolver<IPasarelaResolver>(mocks);
        var resolverReal = Resolver<IPasarelaResolver>(reales);
        foreach (var proveedor in Proveedores)
        {
            Assert.IsType<PasarelaMockService>(resolverMock.Obtener(proveedor));
            Assert.IsType<PasarelaHttpService>(resolverReal.Obtener(proveedor));
        }
    }
}
