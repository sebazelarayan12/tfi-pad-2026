using Aseguradora.Application.External;
using Aseguradora.Integrations.Arca;
using Aseguradora.Integrations.Pasarela;
using Aseguradora.Integrations.Pagos;
using Aseguradora.Integrations.Padi;
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

    private const string SecretoPadi = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

    private static Dictionary<string, string?> ConfigPadi(string proveedor = "pasarela1") => new()
    {
        [$"Integraciones:Pasarelas:{proveedor}:UsarMock"] = "false",
        [$"Integraciones:Pasarelas:{proveedor}:Tipo"] = "Padi",
        [$"Integraciones:Pasarelas:{proveedor}:BaseUrl"] = "https://padi.example.test",
        [$"Integraciones:Pasarelas:{proveedor}:ApiKey"] = "test-key",
        [$"Integraciones:Pasarelas:{proveedor}:WebhookSecret"] = SecretoPadi
    };

    private static ServiceProvider Construir(IDictionary<string, string?> ajustes) =>
        new ServiceCollection().AddLogging()
            .AddPagosIntegrations(new ConfigurationBuilder().AddInMemoryCollection(ajustes).Build())
            .BuildServiceProvider();

    [Fact]
    public void ConfigPorDefecto_SigueRegistrandoMockYPadiInactivo()
    {
        using var provider = Construir(new Dictionary<string, string?>());

        Assert.IsType<PasarelaMockService>(provider.GetRequiredService<IPasarelaResolver>().Obtener("pasarela1"));
        Assert.False(provider.GetRequiredService<PadiWebhookReceptor>().Activo);
    }

    [Fact]
    public void RealSinTipo_SigueRegistrandoPasarelaHttpService()
    {
        var ajustes = ConfigPadi();
        ajustes.Remove("Integraciones:Pasarelas:pasarela1:Tipo");
        using var provider = Construir(ajustes);

        Assert.IsType<PasarelaHttpService>(provider.GetRequiredService<IPasarelaResolver>().Obtener("pasarela1"));
        Assert.False(provider.GetRequiredService<PadiWebhookReceptor>().Activo);
    }

    [Fact]
    public void TipoPadiConMock_SigueUsandoElMock()
    {
        var ajustes = ConfigPadi();
        ajustes["Integraciones:Pasarelas:pasarela1:UsarMock"] = "true";
        using var provider = Construir(ajustes);

        Assert.IsType<PasarelaMockService>(provider.GetRequiredService<IPasarelaResolver>().Obtener("pasarela1"));
        Assert.False(provider.GetRequiredService<PadiWebhookReceptor>().Activo);
    }

    [Fact]
    public void TipoPadiReal_RegistraPadiSoloEnPasarela1()
    {
        using var provider = Construir(ConfigPadi());
        var resolver = provider.GetRequiredService<IPasarelaResolver>();

        Assert.IsType<PadiPasarelaService>(resolver.Obtener("pasarela1"));
        Assert.IsType<PasarelaMockService>(resolver.Obtener("pasarela2"));
        Assert.True(provider.GetRequiredService<PadiWebhookReceptor>().Activo);
    }

    [Fact]
    public void TipoPadiEnPasarela2_FallaAlIniciar()
    {
        Assert.Throws<InvalidOperationException>(() => Construir(ConfigPadi("pasarela2")));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("corto")]
    public void TipoPadiSinSecretoValido_FallaAlIniciar(string? secreto)
    {
        var ajustes = ConfigPadi();
        ajustes["Integraciones:Pasarelas:pasarela1:WebhookSecret"] = secreto;

        Assert.Throws<InvalidOperationException>(() => Construir(ajustes));
    }

    [Theory]
    [InlineData("60", "60")]
    [InlineData("10", null)]
    public void TtlQueNoVenceAntesQueLaReserva_FallaAlIniciar(string reserva, string? ttl)
    {
        var ajustes = ConfigPadi();
        ajustes["Pagos:ReservaMinutos"] = reserva;
        ajustes["Integraciones:Pasarelas:pasarela1:TtlMinutos"] = ttl;

        Assert.Throws<InvalidOperationException>(() => Construir(ajustes));
    }

    [Fact]
    public void TipoDesconocido_FallaAlIniciar()
    {
        var ajustes = ConfigPadi();
        ajustes["Integraciones:Pasarelas:pasarela1:Tipo"] = "Otro";

        Assert.ThrowsAny<System.ComponentModel.DataAnnotations.ValidationException>(() => Construir(ajustes));
    }
}
