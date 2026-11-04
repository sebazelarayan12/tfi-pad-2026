using Aseguradora.Application.External;
using Aseguradora.Integrations.Arca;
using Aseguradora.Integrations.Pasarela;
using Aseguradora.Integrations.Pagos;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
namespace Aseguradora.Tests.Pagos;
public class PagosIntegrationsDiTests
{
    [Fact]
    public void ArcaRealResuelveArcaHttpService()
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Integraciones:Arca:UsarMock"] = "false",
            ["Integraciones:Arca:BaseUrl"] = "https://arca.example.test",
            ["Integraciones:Arca:ApiKey"] = "test-key"
        }).Build();
        var services = new ServiceCollection().AddLogging().AddPagosIntegrations(config);
        using var provider = services.BuildServiceProvider();
        using var scope = provider.CreateScope();

        Assert.IsType<ArcaHttpService>(scope.ServiceProvider.GetRequiredService<IArcaService>());
    }

    [Theory]
    [InlineData("pasarela1", "pasarela2")]
    [InlineData("pasarela2", "pasarela1")]
    public void PasarelaRealResuelvePasarelaHttpServiceSoloEnSuProveedor(string real, string mock)
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            [$"Integraciones:Pasarelas:{real}:UsarMock"] = "false",
            [$"Integraciones:Pasarelas:{real}:BaseUrl"] = "https://pasarela.example.test",
            [$"Integraciones:Pasarelas:{real}:ApiKey"] = "test-key"
        }).Build();
        var services = new ServiceCollection().AddLogging().AddPagosIntegrations(config);
        using var provider = services.BuildServiceProvider();

        var resolver = provider.GetRequiredService<IPasarelaResolver>();

        Assert.IsType<PasarelaHttpService>(resolver.Obtener(real));
        Assert.IsType<PasarelaMockService>(resolver.Obtener(mock));
    }

    [Fact]
    public void UsarMockTrueResuelveServicios()
    {
        var config = new ConfigurationBuilder().Build();
        using var provider = new ServiceCollection().AddPagosIntegrations(config).BuildServiceProvider();
        Assert.IsType<ArcaMockService>(provider.GetRequiredService<IArcaService>());
        Assert.IsType<PasarelaMockService>(provider.GetRequiredService<IPasarelaResolver>().Obtener("pasarela1"));
    }
}
