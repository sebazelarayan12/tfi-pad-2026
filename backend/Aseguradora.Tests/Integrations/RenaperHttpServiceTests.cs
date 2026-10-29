using System.Net;
using System.Text;
using Aseguradora.Api.Frentes.Frente1;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.External;
using Aseguradora.Integrations;
using Aseguradora.Integrations.Http;
using Aseguradora.Integrations.Renaper;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Aseguradora.Tests.Integrations;

public class RenaperHttpServiceTests
{
    private const string BaseUrl = "https://renaper.example";
    private const string ApiKey = "clave-renaper-prueba";

    private static ServiceProvider CrearProveedor(
        ContadorHandler handler,
        int timeoutSegundos = 5,
        int reintentosMaximos = 0)
    {
        var ajustes = new Dictionary<string, string?>
        {
            ["Integraciones:Renaper:UsarMock"] = "false",
            ["Integraciones:Renaper:BaseUrl"] = BaseUrl,
            ["Integraciones:Renaper:ApiKey"] = ApiKey,
            ["Integraciones:Renaper:TimeoutSegundos"] = timeoutSegundos.ToString(),
            ["Integraciones:Renaper:ReintentosMaximos"] = reintentosMaximos.ToString()
        };

        var configuration = new ConfigurationBuilder().AddInMemoryCollection(ajustes).Build();
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddSingleton<IConfiguration>(configuration);
        services.AddIntegraciones(configuration);
        services.AddFrente1(configuration);
        services.AddHttpClient<RenaperHttpService>().ConfigurePrimaryHttpMessageHandler(() => handler);

        return services.BuildServiceProvider(new ServiceProviderOptions { ValidateScopes = true });
    }

    private static HttpResponseMessage JsonRespuesta(HttpStatusCode status, string json) => new(status)
    {
        Content = new StringContent(json, Encoding.UTF8, "application/json")
    };

    [Fact]
    public async Task Mapea_200_completo_incluidos_piso_y_depto_nulos()
    {
        const string json = """
            {
              "dni": "30123456",
              "cuil": "20301234565",
              "nombre": "Juan Carlos",
              "apellido": "Pérez",
              "fechaNacimiento": "1985-03-21",
              "sexo": "M",
              "domicilio": {
                "calle": "San Martín",
                "numero": "1234",
                "piso": null,
                "depto": null,
                "localidad": "San Miguel de Tucumán",
                "provincia": "Tucumán",
                "codigoPostal": "4000"
              },
              "estado": "VIGENTE",
              "fechaFallecimiento": null
            }
            """;

        var handler = new ContadorHandler((_, _) => Task.FromResult(JsonRespuesta(HttpStatusCode.OK, json)));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IRenaperService>();

        var persona = await service.ObtenerPorDniAsync("30123456", CancellationToken.None);

        Assert.NotNull(persona);
        Assert.Equal("30123456", persona.Dni);
        Assert.Equal("20301234565", persona.Cuil);
        Assert.Equal("Juan Carlos", persona.Nombre);
        Assert.Equal("Pérez", persona.Apellido);
        Assert.Equal(new DateOnly(1985, 3, 21), persona.FechaNacimiento);
        Assert.Equal('M', persona.Sexo);
        Assert.Equal("San Martín", persona.Domicilio.Calle);
        Assert.Equal("1234", persona.Domicilio.Numero);
        Assert.Null(persona.Domicilio.Piso);
        Assert.Null(persona.Domicilio.Depto);
        Assert.Equal("San Miguel de Tucumán", persona.Domicilio.Localidad);
        Assert.Equal("Tucumán", persona.Domicilio.Provincia);
        Assert.Equal("4000", persona.Domicilio.CodigoPostal);
        Assert.Equal(EstadoRenaper.Vigente, persona.Estado);
        Assert.Null(persona.FechaFallecimiento);
        Assert.Equal("/api/personas/30123456", handler.UltimoPedido?.RequestUri?.AbsolutePath);
    }

    [Fact]
    public async Task Envia_el_header_X_Api_Key_configurado()
    {
        const string json = """
            {
              "dni": "30123456",
              "cuil": "20301234565",
              "nombre": "Juan Carlos",
              "apellido": "Pérez",
              "fechaNacimiento": "1985-03-21",
              "sexo": "M",
              "domicilio": {
                "calle": "San Martín",
                "numero": "1234",
                "piso": null,
                "depto": null,
                "localidad": "San Miguel de Tucumán",
                "provincia": "Tucumán",
                "codigoPostal": "4000"
              },
              "estado": "VIGENTE",
              "fechaFallecimiento": null
            }
            """;

        var handler = new ContadorHandler((_, _) => Task.FromResult(JsonRespuesta(HttpStatusCode.OK, json)));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IRenaperService>();

        await service.ObtenerPorDniAsync("30123456", CancellationToken.None);

        Assert.NotNull(handler.UltimoPedido);
        Assert.True(handler.UltimoPedido.Headers.TryGetValues(ResilienciaExtensions.ApiKeyHeader, out var valores));
        Assert.Equal(ApiKey, Assert.Single(valores));
    }

    [Fact]
    public async Task Devuelve_null_con_404_y_codigo_persona_no_encontrada()
    {
        const string json = """{ "codigo": "PERSONA_NO_ENCONTRADA", "mensaje": "La persona no existe." }""";

        var handler = new ContadorHandler((_, _) =>
            Task.FromResult(JsonRespuesta(HttpStatusCode.NotFound, json)));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IRenaperService>();

        var persona = await service.ObtenerPorDniAsync("99999999", CancellationToken.None);

        Assert.Null(persona);
        Assert.Equal(1, handler.Llamadas);
    }

    [Fact]
    public async Task Lanza_ExternalServiceException_con_404_y_otro_codigo()
    {
        const string json = """{ "codigo": "ERROR_INTERNO" }""";

        var handler = new ContadorHandler((_, _) =>
            Task.FromResult(JsonRespuesta(HttpStatusCode.NotFound, json)));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IRenaperService>();

        await Assert.ThrowsAsync<ExternalServiceException>(
            () => service.ObtenerPorDniAsync("30123456", CancellationToken.None));
    }

    [Fact]
    public async Task Lanza_ExternalServiceException_con_500()
    {
        var handler = new ContadorHandler((_, _) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.InternalServerError)));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IRenaperService>();

        await Assert.ThrowsAsync<ExternalServiceException>(
            () => service.ObtenerPorDniAsync("30123456", CancellationToken.None));
    }

    [Fact]
    public async Task Lanza_ExternalServiceException_con_401_por_clave_invalida()
    {
        var handler = new ContadorHandler((_, _) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.Unauthorized)));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IRenaperService>();

        await Assert.ThrowsAsync<ExternalServiceException>(
            () => service.ObtenerPorDniAsync("30123456", CancellationToken.None));
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
        var service = scope.ServiceProvider.GetRequiredService<IRenaperService>();

        await Assert.ThrowsAsync<ExternalServiceException>(
            () => service.ObtenerPorDniAsync("30123456", CancellationToken.None));
    }

    [Fact]
    public async Task Lanza_ExternalServiceException_con_json_invalido()
    {
        var handler = new ContadorHandler((_, _) =>
            Task.FromResult(JsonRespuesta(HttpStatusCode.OK, "{ esto no es json")));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IRenaperService>();

        await Assert.ThrowsAsync<ExternalServiceException>(
            () => service.ObtenerPorDniAsync("30123456", CancellationToken.None));
    }
}
