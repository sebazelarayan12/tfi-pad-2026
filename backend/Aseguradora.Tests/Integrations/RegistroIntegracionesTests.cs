using System.Net;
using Aseguradora.Integrations;
using Aseguradora.Integrations.Configuration;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Aseguradora.Tests.Integrations;

public class RegistroIntegracionesTests
{
    [Fact]
    public void AgregarIntegracion_UsarMockTrue_ResuelveMock()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(IntegracionesTestHost.Ajustes(usarMock: true))
            .Build();
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddIntegraciones(configuration);
        services.AgregarIntegracion<IServicioFalso, MockFalso, RealFalso>(configuration, IntegracionesTestHost.Servicio);
        using var provider = services.BuildServiceProvider();
        using var scope = provider.CreateScope();

        var servicio = scope.ServiceProvider.GetRequiredService<IServicioFalso>();

        Assert.IsType<MockFalso>(servicio);
    }

    [Fact]
    public void AgregarIntegracion_UsarMockFalse_ResuelveReal()
    {
        var handler = new ContadorHandler((_, _) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)));
        using var provider = IntegracionesTestHost.Proveedor(handler, IntegracionesTestHost.Ajustes(usarMock: false));
        using var scope = provider.CreateScope();

        var servicio = scope.ServiceProvider.GetRequiredService<IServicioFalso>();

        Assert.IsType<RealFalso>(servicio);
    }

    [Fact]
    public void Options_UsarMockFalso_SinBaseUrl_FallaAlArrancar()
    {
        var handler = new ContadorHandler((_, _) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)));
        using var provider = IntegracionesTestHost.Proveedor(handler,
            IntegracionesTestHost.Ajustes(usarMock: false, baseUrl: ""));

        var exception = Assert.Throws<OptionsValidationException>(
            () => provider.GetRequiredService<IStartupValidator>().Validate());

        Assert.Contains(exception.Failures, falla => falla.Contains("Integraciones:Renaper:BaseUrl"));
    }

    [Fact]
    public void Options_UsarMockFalso_SinApiKey_FallaAlArrancar()
    {
        var handler = new ContadorHandler((_, _) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)));
        using var provider = IntegracionesTestHost.Proveedor(handler,
            IntegracionesTestHost.Ajustes(usarMock: false, apiKey: ""));

        var exception = Assert.Throws<OptionsValidationException>(
            () => provider.GetRequiredService<IStartupValidator>().Validate());

        Assert.Contains(exception.Failures, falla => falla.Contains("Integraciones:Renaper:ApiKey"));
    }

    [Fact]
    public void Options_UsarMockTrue_NoExigeBaseUrlNiApiKey()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(IntegracionesTestHost.Ajustes(usarMock: true, baseUrl: null, apiKey: null))
            .Build();
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddIntegraciones(configuration);
        services.AgregarIntegracion<IServicioFalso, MockFalso, RealFalso>(configuration, IntegracionesTestHost.Servicio);
        using var provider = services.BuildServiceProvider();

        provider.GetRequiredService<IStartupValidator>().Validate();
    }

    [Fact]
    public void AgregarClienteResiliente_ConfiguraBaseAddressYApiKey()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Integraciones:Pasarelas:pasarela1:UsarMock"] = "false",
                ["Integraciones:Pasarelas:pasarela1:BaseUrl"] = "https://pasarela1.example",
                ["Integraciones:Pasarelas:pasarela1:ApiKey"] = "clave-pasarela",
                ["Integraciones:Pasarelas:pasarela1:TimeoutSegundos"] = "5",
                ["Integraciones:Pasarelas:pasarela1:ReintentosMaximos"] = "2"
            })
            .Build();
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddIntegraciones(configuration);

        var builder = services.AgregarClienteResiliente<IntegracionOptions>(configuration, "Pasarelas:pasarela1");

        Assert.NotNull(builder);
        using var provider = services.BuildServiceProvider();
        var cliente = provider.GetRequiredService<IHttpClientFactory>().CreateClient("Pasarelas:pasarela1");
        Assert.Equal(new Uri("https://pasarela1.example"), cliente.BaseAddress);
        Assert.Equal("clave-pasarela", Assert.Single(cliente.DefaultRequestHeaders.GetValues("X-Api-Key")));
    }

    [Fact]
    public void Options_PasarelaSinBaseUrl_NombraLaSeccionCompleta()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Integraciones:Pasarelas:pasarela2:UsarMock"] = "false",
                ["Integraciones:Pasarelas:pasarela2:ApiKey"] = "clave-pasarela"
            })
            .Build();
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddIntegraciones(configuration);
        services.AgregarClienteResiliente<IntegracionOptions>(configuration, "Pasarelas:pasarela2");
        using var provider = services.BuildServiceProvider();

        var exception = Assert.Throws<OptionsValidationException>(
            () => provider.GetRequiredService<IStartupValidator>().Validate());

        Assert.Contains(exception.Failures, falla => falla.Contains("Integraciones:Pasarelas:pasarela2:BaseUrl"));
    }

    [Fact]
    public void AgregarIntegracion_ArgumentosNulos_LanzanArgumentNullException()
    {
        var configuration = new ConfigurationBuilder().Build();
        var services = new ServiceCollection();

        Assert.Throws<ArgumentNullException>(() =>
            DependencyInjection.AgregarIntegracion<IServicioFalso, MockFalso, RealFalso>(null!, configuration, "Renaper"));
        Assert.Throws<ArgumentNullException>(() =>
            services.AgregarIntegracion<IServicioFalso, MockFalso, RealFalso>(null!, "Renaper"));
        Assert.Throws<ArgumentNullException>(() =>
            DependencyInjection.AddIntegraciones(null!, configuration));
        Assert.Throws<ArgumentNullException>(() =>
            services.AddIntegraciones(null!));
        Assert.ThrowsAny<ArgumentException>(() =>
            services.AgregarIntegracion<IServicioFalso, MockFalso, RealFalso>(configuration, " "));
    }
}
