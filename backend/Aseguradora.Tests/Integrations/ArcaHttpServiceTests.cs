using System.Net;
using System.Text;
using System.Text.Json;
using Aseguradora.Application.Dtos;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.External;
using Aseguradora.Integrations;
using Aseguradora.Integrations.Arca;
using Aseguradora.Integrations.Http;
using Aseguradora.Integrations.Pagos;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Aseguradora.Tests.Integrations;

public class ArcaHttpServiceTests
{
    private const string BaseUrl = "https://arca-grupo.example";
    private const string ApiKey = "clave-arca-prueba";
    private const string NumeroComprobante = "0001-00000123";

    private const string RespuestaFactura = """
        {
          "numeroComprobante": "0001-00000123",
          "cae": "74123456789012",
          "vencimientoCae": "2026-11-18",
          "estado": "APROBADA",
          "urlPdf": "https://arca-grupo.example/facturas/0001-00000123.pdf"
        }
        """;

    private static ServiceProvider CrearProveedor(ContadorHandler handler)
    {
        var ajustes = new Dictionary<string, string?>
        {
            ["Integraciones:Arca:UsarMock"] = "false",
            ["Integraciones:Arca:BaseUrl"] = BaseUrl,
            ["Integraciones:Arca:ApiKey"] = ApiKey,
            ["Integraciones:Arca:TimeoutSegundos"] = "5",
            ["Integraciones:Arca:ReintentosMaximos"] = "0"
        };

        var configuration = new ConfigurationBuilder().AddInMemoryCollection(ajustes).Build();
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddIntegraciones(configuration);
        services.AddPagosIntegrations(configuration);
        services.AddHttpClient<ArcaHttpService>().ConfigurePrimaryHttpMessageHandler(() => handler);

        return services.BuildServiceProvider(new ServiceProviderOptions { ValidateScopes = true });
    }

    private static HttpResponseMessage Json(HttpStatusCode estado, string json) => new(estado)
    {
        Content = new StringContent(json, Encoding.UTF8, "application/json")
    };

    private static ArcaFacturaRequest SolicitudFactura() => new(
        CuitEmisor: "30712345678",
        PuntoVenta: 1,
        TipoComprobante: "B",
        Concepto: "SERVICIOS",
        FechaEmision: new DateOnly(2026, 11, 8),
        Receptor: new ArcaReceptor("DNI", "30123456", "Juan Carlos Pérez", "CONSUMIDOR_FINAL"),
        Items:
        [
            new ArcaItem("Póliza POL-0000042 - Cuota 3 de 12", 1m, 26250.00m),
            new ArcaItem("Póliza POL-0000042 - Cuota 4 de 12", 1m, 25000.00m)
        ],
        ImporteNeto: 42355.37m,
        ImporteIva: 8894.63m,
        ImporteTotal: 51250.00m,
        ReferenciaExterna: "PAG-6f1c2a");

    private static IArcaService Arca(IServiceProvider provider) => provider.GetRequiredService<IArcaService>();

    [Fact]
    public async Task EmitirFactura_envia_el_contrato_9_2_con_la_api_key()
    {
        string? metodo = null;
        string? ruta = null;
        string? apiKey = null;
        string? cuerpo = null;
        var handler = new ContadorHandler(async (pedido, token) =>
        {
            metodo = pedido.Method.Method;
            ruta = pedido.RequestUri?.AbsolutePath;
            apiKey = pedido.Headers.GetValues("X-Api-Key").Single();
            cuerpo = await pedido.Content!.ReadAsStringAsync(token);
            return Json(HttpStatusCode.Created, RespuestaFactura);
        });
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();

        await Arca(scope.ServiceProvider).EmitirFacturaAsync(SolicitudFactura(), CancellationToken.None);

        Assert.Equal("POST", metodo);
        Assert.Equal("/api/facturas", ruta);
        Assert.Equal(ApiKey, apiKey);

        using var documento = JsonDocument.Parse(cuerpo!);
        var raiz = documento.RootElement;
        Assert.Equal(
            new[] { "cuitEmisor", "puntoVenta", "tipoComprobante", "concepto", "fechaEmision", "receptor", "items", "importeNeto", "importeIva", "importeTotal", "referenciaExterna" },
            raiz.EnumerateObject().Select(propiedad => propiedad.Name));
        Assert.Equal("30712345678", raiz.GetProperty("cuitEmisor").GetString());
        Assert.Equal(1, raiz.GetProperty("puntoVenta").GetInt32());
        Assert.Equal("B", raiz.GetProperty("tipoComprobante").GetString());
        Assert.Equal("SERVICIOS", raiz.GetProperty("concepto").GetString());
        Assert.Equal("2026-11-08", raiz.GetProperty("fechaEmision").GetString());
        Assert.Equal(
            new[] { "tipoDocumento", "numeroDocumento", "nombre", "condicionIva" },
            raiz.GetProperty("receptor").EnumerateObject().Select(propiedad => propiedad.Name));
        Assert.Equal("CONSUMIDOR_FINAL", raiz.GetProperty("receptor").GetProperty("condicionIva").GetString());
        Assert.Equal(2, raiz.GetProperty("items").GetArrayLength());
        var primerItem = raiz.GetProperty("items")[0];
        Assert.Equal(
            new[] { "descripcion", "cantidad", "precioUnitario" },
            primerItem.EnumerateObject().Select(propiedad => propiedad.Name));
        Assert.Equal("Póliza POL-0000042 - Cuota 3 de 12", primerItem.GetProperty("descripcion").GetString());
        Assert.Equal(26250.00m, primerItem.GetProperty("precioUnitario").GetDecimal());
        Assert.Equal(42355.37m, raiz.GetProperty("importeNeto").GetDecimal());
        Assert.Equal(8894.63m, raiz.GetProperty("importeIva").GetDecimal());
        Assert.Equal(51250.00m, raiz.GetProperty("importeTotal").GetDecimal());
        Assert.Equal("PAG-6f1c2a", raiz.GetProperty("referenciaExterna").GetString());
    }

    [Fact]
    public async Task EmitirFactura_mapea_la_respuesta_201_con_CAE()
    {
        var handler = new ContadorHandler((_, _) => Task.FromResult(Json(HttpStatusCode.Created, RespuestaFactura)));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();

        var factura = await Arca(scope.ServiceProvider).EmitirFacturaAsync(SolicitudFactura(), CancellationToken.None);

        Assert.Equal(NumeroComprobante, factura.NumeroComprobante);
        Assert.Equal("74123456789012", factura.Cae);
        Assert.Equal(new DateOnly(2026, 11, 18), factura.VencimientoCae);
        Assert.Equal("APROBADA", factura.Estado);
        Assert.Equal("https://arca-grupo.example/facturas/0001-00000123.pdf", factura.UrlPdf);
    }

    [Fact]
    public async Task EmitirFactura_se_envia_como_idempotente()
    {
        var marcadoNoIdempotente = true;
        var handler = new ContadorHandler((pedido, _) =>
        {
            marcadoNoIdempotente = pedido.Options.TryGetValue(ClienteHttpBase.SinReintento, out var valor) && valor;
            return Task.FromResult(Json(HttpStatusCode.Created, RespuestaFactura));
        });
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();

        await Arca(scope.ServiceProvider).EmitirFacturaAsync(SolicitudFactura(), CancellationToken.None);

        Assert.False(marcadoNoIdempotente);
    }

    [Fact]
    public async Task EmitirFactura_con_401_lanza_ExternalServiceException()
    {
        var handler = new ContadorHandler((_, _) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.Unauthorized)));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();

        await Assert.ThrowsAsync<ExternalServiceException>(
            () => Arca(scope.ServiceProvider).EmitirFacturaAsync(SolicitudFactura(), CancellationToken.None));
    }

    [Fact]
    public async Task ConsultarFactura_mapea_la_respuesta_200()
    {
        var handler = new ContadorHandler((_, _) => Task.FromResult(Json(HttpStatusCode.OK, RespuestaFactura)));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();

        var factura = await Arca(scope.ServiceProvider).ConsultarFacturaAsync(NumeroComprobante, CancellationToken.None);

        Assert.Equal("/api/facturas/0001-00000123", handler.UltimoPedido?.RequestUri?.AbsolutePath);
        Assert.Equal(NumeroComprobante, factura.NumeroComprobante);
        Assert.Equal("74123456789012", factura.Cae);
        Assert.Equal("APROBADA", factura.Estado);
    }

    [Fact]
    public async Task ConsultarFactura_con_404_lanza_ExternalServiceException()
    {
        var handler = new ContadorHandler((_, _) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound)));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();

        await Assert.ThrowsAsync<ExternalServiceException>(
            () => Arca(scope.ServiceProvider).ConsultarFacturaAsync(NumeroComprobante, CancellationToken.None));
    }
}
