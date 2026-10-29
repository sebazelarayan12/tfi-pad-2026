using Aseguradora.Application.Dtos;
using Aseguradora.Application.External;
using Aseguradora.Application.Exceptions;
using Aseguradora.Integrations.Arca;
using Aseguradora.Integrations.Pasarela;
using Aseguradora.Integrations.Pagos;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
namespace Aseguradora.Tests.Pagos;
public class PagosIntegrationsDiTests
{
    [Theory]
    [InlineData("Integraciones:Arca:UsarMock")]
    [InlineData("Integraciones:Pasarelas:pasarela1:UsarMock")]
    [InlineData("Integraciones:Pasarelas:pasarela2:UsarMock")]
    public void ClienteRealSinImplementacionFalla(string key)
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string,string?> { [key] = "false" }).Build();
        var error = Assert.Throws<InvalidOperationException>(() => new ServiceCollection().AddPagosIntegrations(config));
        Assert.Contains("US-F4-08", error.Message);
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
