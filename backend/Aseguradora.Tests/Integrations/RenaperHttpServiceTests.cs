using System.Net;
using System.Text;
using System.Text.Json;
using Aseguradora.Api.Frentes.Frente1;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.External;
using Aseguradora.Integrations;
using Aseguradora.Integrations.Http;
using Aseguradora.Integrations.Renaper;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Aseguradora.Tests.Integrations;

/// <summary>The real client talks to OpenRENAPER (<c>POST /api/v1/consultas</c>, no authentication).</summary>
public class RenaperHttpServiceTests
{
    private const string BaseUrl = "https://openrenaper.example";

    private const string RespuestaCompleta = """
        {
          "nombre": "PEREZ JUAN CARLOS",
          "dni": "30123456",
          "cuit": "20301234565",
          "edad": 41,
          "sexo": "Masculino",
          "provincia_ubicacion": "TUCUMAN"
        }
        """;

    private static ServiceProvider CrearProveedor(
        ContadorHandler handler,
        int timeoutSegundos = 5,
        int reintentosMaximos = 0)
    {
        var ajustes = new Dictionary<string, string?>
        {
            ["Integraciones:Renaper:UsarMock"] = "false",
            ["Integraciones:Renaper:RequiereApiKey"] = "false",
            ["Integraciones:Renaper:BaseUrl"] = BaseUrl,
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

    private static IRenaperService Renaper(IServiceProvider provider) => provider.GetRequiredService<IRenaperService>();

    [Fact]
    public async Task Consulta_por_dni_con_POST_y_mapea_solo_lo_que_publica_la_fuente()
    {
        string? cuerpo = null;
        var handler = new ContadorHandler(async (pedido, token) =>
        {
            cuerpo = await pedido.Content!.ReadAsStringAsync(token);
            return JsonRespuesta(HttpStatusCode.OK, RespuestaCompleta);
        });
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();

        var persona = await Renaper(scope.ServiceProvider).ObtenerPorDniAsync("30123456", CancellationToken.None);

        Assert.Equal(HttpMethod.Post, handler.UltimoPedido?.Method);
        Assert.Equal("/api/v1/consultas", handler.UltimoPedido?.RequestUri?.AbsolutePath);
        using (var documento = JsonDocument.Parse(cuerpo!))
        {
            Assert.Equal("dni", documento.RootElement.GetProperty("tipo").GetString());
            Assert.Equal("30123456", documento.RootElement.GetProperty("numero").GetString());
        }

        Assert.NotNull(persona);
        Assert.Equal("30123456", persona.Dni);
        Assert.Equal("20301234565", persona.Cuil);
        Assert.Equal("PEREZ JUAN CARLOS", persona.Nombre);
        Assert.Equal('M', persona.Sexo);
        Assert.Equal(41, persona.Edad);
        Assert.Equal(EstadoRenaper.Vigente, persona.Estado);
        // The source does not publish these and nothing is invented.
        Assert.Null(persona.Apellido);
        Assert.Null(persona.FechaNacimiento);
        Assert.Null(persona.Domicilio);
        Assert.Null(persona.FechaFallecimiento);
    }

    [Theory]
    [InlineData("Sebastian ZELARAYAN", "Sebastian", "ZELARAYAN")]
    [InlineData("Juan Carlos DE LA CRUZ", "Juan Carlos", "DE LA CRUZ")]
    [InlineData("PEREZ JUAN CARLOS", "PEREZ JUAN CARLOS", null)]
    [InlineData("Sebastian", "Sebastian", null)]
    [InlineData("ZELARAYAN Sebastian", "ZELARAYAN Sebastian", null)]
    public void Separa_el_nombre_solo_cuando_el_formato_es_inequivoco(string completo, string nombre, string? apellido)
    {
        Assert.Equal((nombre, apellido), RenaperHttpService.SepararNombre(completo));
    }

    [Fact]
    public async Task Consulta_por_cuil_usa_tipo_cuit()
    {
        string? cuerpo = null;
        var handler = new ContadorHandler(async (pedido, token) =>
        {
            cuerpo = await pedido.Content!.ReadAsStringAsync(token);
            return JsonRespuesta(HttpStatusCode.OK, RespuestaCompleta);
        });
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();

        var persona = await Renaper(scope.ServiceProvider).ObtenerPorCuilAsync("20301234565", CancellationToken.None);

        using var documento = JsonDocument.Parse(cuerpo!);
        Assert.Equal("cuit", documento.RootElement.GetProperty("tipo").GetString());
        Assert.Equal("20301234565", documento.RootElement.GetProperty("numero").GetString());
        Assert.Equal("20301234565", persona?.Cuil);
    }

    [Fact]
    public async Task Todos_los_campos_opcionales_en_null_se_conservan_como_null()
    {
        const string json = """
            { "nombre": "PEREZ JUAN CARLOS", "dni": null, "cuit": null, "edad": null, "sexo": null, "provincia_ubicacion": null }
            """;
        var handler = new ContadorHandler((_, _) => Task.FromResult(JsonRespuesta(HttpStatusCode.OK, json)));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();

        var persona = await Renaper(scope.ServiceProvider).ObtenerPorDniAsync("30123456", CancellationToken.None);

        Assert.NotNull(persona);
        Assert.Equal("30123456", persona.Dni);
        Assert.Null(persona.Cuil);
        Assert.Null(persona.Edad);
        Assert.Null(persona.Sexo);
    }

    [Fact]
    public async Task Consulta_por_cuil_sin_dni_en_la_respuesta_toma_el_dni_del_medio_del_cuil()
    {
        const string json = """
            { "nombre": "PEREZ JUAN CARLOS", "dni": null, "cuit": "20301234565", "edad": 41, "sexo": "Masculino", "provincia_ubicacion": null }
            """;
        var handler = new ContadorHandler((_, _) => Task.FromResult(JsonRespuesta(HttpStatusCode.OK, json)));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();

        var persona = await Renaper(scope.ServiceProvider).ObtenerPorCuilAsync("20301234565", CancellationToken.None);

        Assert.Equal("30123456", persona?.Dni);
    }

    [Fact]
    public async Task Consulta_por_cuit_de_empresa_sin_dni_no_inventa_un_dni()
    {
        const string json = """
            { "nombre": "TRANSPORTE DELLEPIANE SOCIEDAD ANONIMA", "dni": null, "cuit": "30712345671", "edad": null, "sexo": null, "provincia_ubicacion": null }
            """;
        var handler = new ContadorHandler((_, _) => Task.FromResult(JsonRespuesta(HttpStatusCode.OK, json)));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();

        var persona = await Renaper(scope.ServiceProvider).ObtenerPorCuilAsync("30712345671", CancellationToken.None);

        Assert.Equal("30712345671", persona?.Dni);
        Assert.Equal("30712345671", persona?.Cuil);
    }

    [Theory]
    [InlineData("Femenino", 'F')]
    [InlineData("Masculino", 'M')]
    [InlineData("Otro", null)]
    public async Task Mapea_el_sexo_publicado(string sexo, char? esperado)
    {
        var json = RespuestaCompleta.Replace("\"Masculino\"", $"\"{sexo}\"");
        var handler = new ContadorHandler((_, _) => Task.FromResult(JsonRespuesta(HttpStatusCode.OK, json)));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();

        var persona = await Renaper(scope.ServiceProvider).ObtenerPorDniAsync("30123456", CancellationToken.None);

        Assert.Equal(esperado, persona?.Sexo);
    }

    [Fact]
    public async Task No_envia_X_Api_Key_porque_OpenRENAPER_no_la_usa()
    {
        var handler = new ContadorHandler((_, _) => Task.FromResult(JsonRespuesta(HttpStatusCode.OK, RespuestaCompleta)));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();

        await Renaper(scope.ServiceProvider).ObtenerPorDniAsync("30123456", CancellationToken.None);

        Assert.False(handler.UltimoPedido!.Headers.Contains(ResilienciaExtensions.ApiKeyHeader));
    }

    [Fact]
    public async Task Devuelve_null_con_404_sin_resultados()
    {
        const string json = """{ "codigo": "sin_resultados", "mensaje": "Sin coincidencias.", "fuente": null, "detalles": [] }""";
        var handler = new ContadorHandler((_, _) => Task.FromResult(JsonRespuesta(HttpStatusCode.NotFound, json)));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();

        var persona = await Renaper(scope.ServiceProvider).ObtenerPorDniAsync("99999999", CancellationToken.None);

        Assert.Null(persona);
        Assert.Equal(1, handler.Llamadas);
    }

    [Fact]
    public async Task Un_dni_ambiguo_lanza_PersonaAmbiguaException()
    {
        const string json = """{ "codigo": "consulta_ambigua", "mensaje": "consultar por CUIT.", "fuente": null, "detalles": [] }""";
        var handler = new ContadorHandler((_, _) => Task.FromResult(JsonRespuesta(HttpStatusCode.Conflict, json)));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();

        await Assert.ThrowsAsync<PersonaAmbiguaException>(
            () => Renaper(scope.ServiceProvider).ObtenerPorDniAsync("30123456", CancellationToken.None));
    }

    [Fact]
    public async Task Un_conflicto_por_datos_contradictorios_lanza_ExternalServiceException_sin_ser_ambigua()
    {
        const string json = """{ "codigo": "datos_contradictorios", "mensaje": "x", "fuente": null, "detalles": [] }""";
        var handler = new ContadorHandler((_, _) => Task.FromResult(JsonRespuesta(HttpStatusCode.Conflict, json)));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();

        var ex = await Assert.ThrowsAsync<ExternalServiceException>(
            () => Renaper(scope.ServiceProvider).ObtenerPorDniAsync("30123456", CancellationToken.None));

        Assert.IsNotType<PersonaAmbiguaException>(ex);
    }

    [Theory]
    [InlineData(HttpStatusCode.TooManyRequests)]
    [InlineData(HttpStatusCode.UnprocessableEntity)]
    [InlineData(HttpStatusCode.BadRequest)]
    [InlineData(HttpStatusCode.InternalServerError)]
    [InlineData(HttpStatusCode.BadGateway)]
    [InlineData(HttpStatusCode.ServiceUnavailable)]
    [InlineData(HttpStatusCode.GatewayTimeout)]
    public async Task Los_otros_errores_del_servicio_lanzan_ExternalServiceException(HttpStatusCode estado)
    {
        var handler = new ContadorHandler((_, _) => Task.FromResult(new HttpResponseMessage(estado)));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();

        await Assert.ThrowsAsync<ExternalServiceException>(
            () => Renaper(scope.ServiceProvider).ObtenerPorDniAsync("30123456", CancellationToken.None));
    }

    [Fact]
    public async Task Una_respuesta_sin_nombre_lanza_ExternalServiceException()
    {
        const string json = """{ "nombre": null, "dni": "30123456", "cuit": null, "edad": null, "sexo": null, "provincia_ubicacion": null }""";
        var handler = new ContadorHandler((_, _) => Task.FromResult(JsonRespuesta(HttpStatusCode.OK, json)));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();

        await Assert.ThrowsAsync<ExternalServiceException>(
            () => Renaper(scope.ServiceProvider).ObtenerPorDniAsync("30123456", CancellationToken.None));
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

        await Assert.ThrowsAsync<ExternalServiceException>(
            () => Renaper(scope.ServiceProvider).ObtenerPorDniAsync("30123456", CancellationToken.None));
    }

    [Fact]
    public async Task Lanza_ExternalServiceException_con_json_invalido()
    {
        var handler = new ContadorHandler((_, _) =>
            Task.FromResult(JsonRespuesta(HttpStatusCode.OK, "{ esto no es json")));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();

        await Assert.ThrowsAsync<ExternalServiceException>(
            () => Renaper(scope.ServiceProvider).ObtenerPorDniAsync("30123456", CancellationToken.None));
    }
}
