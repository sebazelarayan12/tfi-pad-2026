using Aseguradora.Api.Frentes.Frente1;
using Aseguradora.Application.External;
using Aseguradora.Integrations;
using Aseguradora.Integrations.Renaper;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Aseguradora.Tests.Integrations;

public class RenaperRegistroTests
{
    private static ServiceProvider ConstruirProveedor(bool usarMock)
    {
        var ajustes = new Dictionary<string, string?>
        {
            ["Integraciones:Renaper:UsarMock"] = usarMock ? "true" : "false",
            ["Integraciones:Renaper:BaseUrl"] = "https://renaper.example",
            ["Integraciones:Renaper:ApiKey"] = "clave-renaper"
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(ajustes)
            .Build();

        var services = new ServiceCollection();
        services.AddLogging();
        services.AddIntegraciones(configuration);
        services.AddFrente1(configuration);

        return services.BuildServiceProvider(new ServiceProviderOptions { ValidateScopes = true });
    }

    [Fact]
    public void UsarMock_true_resuelve_mock()
    {
        using var provider = ConstruirProveedor(usarMock: true);
        using var scope = provider.CreateScope();

        var service = scope.ServiceProvider.GetRequiredService<IRenaperService>();

        Assert.IsType<RenaperMockService>(service);
    }

    [Fact]
    public void UsarMock_false_resuelve_http()
    {
        using var provider = ConstruirProveedor(usarMock: false);
        using var scope = provider.CreateScope();

        var service = scope.ServiceProvider.GetRequiredService<IRenaperService>();

        Assert.IsType<RenaperHttpService>(service);
    }
}
