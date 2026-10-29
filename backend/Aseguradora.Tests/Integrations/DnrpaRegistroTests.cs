using Aseguradora.Api.Frentes.Frente2;
using Aseguradora.Application.External;
using Aseguradora.Integrations;
using Aseguradora.Integrations.Dnrpa;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Aseguradora.Tests.Integrations;

public class DnrpaRegistroTests
{
    private static ServiceProvider ConstruirProveedor(bool usarMock)
    {
        var ajustes = new Dictionary<string, string?>
        {
            ["Integraciones:Dnrpa:UsarMock"] = usarMock ? "true" : "false",
            ["Integraciones:Dnrpa:BaseUrl"] = "https://dnrpa.example",
            ["Integraciones:Dnrpa:ApiKey"] = "clave-dnrpa"
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(ajustes)
            .Build();

        var services = new ServiceCollection();
        services.AddLogging();
        services.AddIntegraciones(configuration);
        services.AddFrente2(configuration);

        return services.BuildServiceProvider(new ServiceProviderOptions { ValidateScopes = true });
    }

    [Fact]
    public void UsarMock_true_resuelve_mock()
    {
        using var provider = ConstruirProveedor(usarMock: true);
        using var scope = provider.CreateScope();

        var service = scope.ServiceProvider.GetRequiredService<IDnrpaService>();

        Assert.IsType<DnrpaMockService>(service);
    }

    [Fact]
    public void UsarMock_false_resuelve_http()
    {
        using var provider = ConstruirProveedor(usarMock: false);
        using var scope = provider.CreateScope();

        var service = scope.ServiceProvider.GetRequiredService<IDnrpaService>();

        Assert.IsType<DnrpaHttpService>(service);
    }
}
