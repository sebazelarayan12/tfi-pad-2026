using Aseguradora.Integrations;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Aseguradora.Tests.Integrations;

/// <summary>Builds a service provider with the real registration helpers and a fake HTTP handler.</summary>
internal static class IntegracionesTestHost
{
    public const string Servicio = "Renaper";
    public const string ApiKey = "clave-secreta-de-prueba";

    public static Dictionary<string, string?> Ajustes(
        int? timeoutSegundos = null,
        int? reintentosMaximos = null,
        bool usarMock = false,
        string? baseUrl = "https://renaper.example",
        string? apiKey = ApiKey)
    {
        var ajustes = new Dictionary<string, string?>
        {
            [$"Integraciones:{Servicio}:UsarMock"] = usarMock ? "true" : "false",
            [$"Integraciones:{Servicio}:BaseUrl"] = baseUrl,
            [$"Integraciones:{Servicio}:ApiKey"] = apiKey
        };

        if (timeoutSegundos is not null)
            ajustes[$"Integraciones:{Servicio}:TimeoutSegundos"] = timeoutSegundos.Value.ToString();

        if (reintentosMaximos is not null)
            ajustes[$"Integraciones:{Servicio}:ReintentosMaximos"] = reintentosMaximos.Value.ToString();

        return ajustes;
    }

    public static ServiceProvider Proveedor(
        ContadorHandler handler,
        IReadOnlyDictionary<string, string?> ajustes,
        CapturingLoggerProvider? logs = null)
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(ajustes).Build();

        var services = new ServiceCollection();
        services.AddLogging(builder =>
        {
            if (logs is not null)
                builder.AddProvider(logs);
        });
        services.AddSingleton<IConfiguration>(configuration);
        services.AddIntegraciones(configuration);
        services.AgregarIntegracion<IServicioFalso, MockFalso, RealFalso>(configuration, Servicio);
        services.AddHttpClient<RealFalso>().ConfigurePrimaryHttpMessageHandler(() => handler);

        return services.BuildServiceProvider(new ServiceProviderOptions { ValidateScopes = true });
    }
}
