using System.Net;
using System.Text;
using Aseguradora.Api.Frentes.Frente2;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.External;
using Aseguradora.Domain.Enums;
using Aseguradora.Integrations;
using Aseguradora.Integrations.Dnrpa;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Aseguradora.Tests.Integrations;

public class DnrpaHttpServiceTests
{
    private const string BaseUrl = "https://dnrpa.example";
    private const string ApiKey = "clave-dnrpa-prueba";

    private static ServiceProvider CrearProveedor(
        ContadorHandler handler,
        int timeoutSegundos = 5,
        int reintentosMaximos = 0)
    {
        var ajustes = new Dictionary<string, string?>
        {
            ["Integraciones:Dnrpa:UsarMock"] = "false",
            ["Integraciones:Dnrpa:BaseUrl"] = BaseUrl,
            ["Integraciones:Dnrpa:ApiKey"] = ApiKey,
            ["Integraciones:Dnrpa:TimeoutSegundos"] = timeoutSegundos.ToString(),
            ["Integraciones:Dnrpa:ReintentosMaximos"] = reintentosMaximos.ToString()
        };

        var configuration = new ConfigurationBuilder().AddInMemoryCollection(ajustes).Build();
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddSingleton<IConfiguration>(configuration);
        services.AddIntegraciones(configuration);
        services.AddFrente2(configuration);
        services.AddHttpClient<DnrpaHttpService>().ConfigurePrimaryHttpMessageHandler(() => handler);

        return services.BuildServiceProvider(new ServiceProviderOptions { ValidateScopes = true });
    }

    private static HttpResponseMessage JsonRespuesta(string json) => new(HttpStatusCode.OK)
    {
        Content = new StringContent(json, Encoding.UTF8, "application/json")
    };

    [Fact]
    public async Task Mapea_200_a_DatosDnrpa()
    {
        const string json = """
            {
              "patente": "AB123CD",
              "marca": "Toyota",
              "modelo": "Corolla XEi",
              "anio": 2021,
              "tipo": "AUTO",
              "numeroMotor": "2ZR1234567",
              "numeroChasis": "9BRBL3HE5M0123456",
              "titularDni": "30123456",
              "titularNombre": "Juan Carlos Pérez"
            }
            """;

        var handler = new ContadorHandler((_, _) => Task.FromResult(JsonRespuesta(json)));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IDnrpaService>();

        var datos = await service.ObtenerVehiculoAsync("ab123cd", CancellationToken.None);

        Assert.NotNull(datos);
        Assert.Equal("AB123CD", datos.Patente);
        Assert.Equal("Toyota", datos.Marca);
        Assert.Equal("Corolla XEi", datos.Modelo);
        Assert.Equal(2021, datos.Anio);
        Assert.Equal(TipoVehiculo.Auto, datos.Tipo);
        Assert.Equal("2ZR1234567", datos.NumeroMotor);
        Assert.Equal("9BRBL3HE5M0123456", datos.NumeroChasis);
        Assert.Equal("30123456", datos.TitularDni);
        Assert.Equal("Juan Carlos Pérez", datos.TitularNombre);
        Assert.Equal("/api/vehiculos/AB123CD", handler.UltimoPedido?.RequestUri?.AbsolutePath);
    }

    [Fact]
    public async Task Devuelve_null_con_404()
    {
        var handler = new ContadorHandler((_, _) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound)));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IDnrpaService>();

        var datos = await service.ObtenerVehiculoAsync("ZZ999ZZ", CancellationToken.None);

        Assert.Null(datos);
        Assert.Equal(1, handler.Llamadas);
    }

    [Fact]
    public async Task Lanza_ExternalServiceException_con_500()
    {
        var handler = new ContadorHandler((_, _) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.InternalServerError)));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IDnrpaService>();

        await Assert.ThrowsAsync<ExternalServiceException>(
            () => service.ObtenerVehiculoAsync("AB123CD", CancellationToken.None));
    }

    [Fact]
    public async Task Lanza_ExternalServiceException_con_timeout()
    {
        var handler = new ContadorHandler(async (_, token) =>
        {
            await Task.Delay(TimeSpan.FromSeconds(30), token);
            return new HttpResponseMessage(HttpStatusCode.OK);
        });
        await using var provider = CrearProveedor(handler, timeoutSegundos: 1, reintentosMaximos: 0);
        using var scope = provider.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IDnrpaService>();

        await Assert.ThrowsAsync<ExternalServiceException>(
            () => service.ObtenerVehiculoAsync("AB123CD", CancellationToken.None));
    }

    [Fact]
    public async Task Ignora_campos_desconocidos_del_json()
    {
        const string json = """
            {
              "patente": "AE789FG",
              "marca": "Toyota",
              "modelo": "Hilux SRX",
              "anio": 2023,
              "tipo": "Camioneta",
              "numeroMotor": "1GD7654321",
              "numeroChasis": "8AJBA3CD2P0789123",
              "titularDni": "30123456",
              "titularNombre": "Juan Carlos Pérez",
              "radicacion": "San Miguel de Tucumán",
              "campoFuturo": 12345
            }
            """;

        var handler = new ContadorHandler((_, _) => Task.FromResult(JsonRespuesta(json)));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IDnrpaService>();

        var datos = await service.ObtenerVehiculoAsync("AE789FG", CancellationToken.None);

        Assert.NotNull(datos);
        Assert.Equal("AE789FG", datos.Patente);
        Assert.Equal(TipoVehiculo.Camioneta, datos.Tipo);
        Assert.Equal("30123456", datos.TitularDni);
    }
}
