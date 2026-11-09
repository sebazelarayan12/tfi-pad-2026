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

/// <summary>The real client talks to FacturAR (<c>POST /v1/comprobantes</c>), not to a made-up ARCA contract.</summary>
public class ArcaHttpServiceTests
{
    private const string BaseUrl = "https://facturar.example";
    private const string ApiKey = "clave-de-prueba-facturar";

    private const string RespuestaComprobante = """
        {
          "id": "4a4f3f4e-7d7a-4f4e-9a5e-2f6b8c9d0e1f",
          "tipoComprobante": 6,
          "tipoComprobanteDescripcion": "Factura B",
          "puntoVenta": 1,
          "numero": 123,
          "fechaEmision": "2026-11-08T15:30:00Z",
          "cae": "74123456789012",
          "caeVencimiento": "2026-11-18T00:00:00Z",
          "receptor": { "documentoTipo": "DNI", "documentoNumero": "30123456", "razonSocial": "Juan Carlos Pérez", "condicionIva": 5 },
          "importeNeto": 51250,
          "importeIva": 0,
          "importeTotal": 51250,
          "moneda": "ARS",
          "estado": "Emitido"
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
    public async Task EmitirFactura_envia_el_contrato_de_FacturAR_con_la_api_key_y_la_clave_de_idempotencia()
    {
        string? metodo = null;
        string? ruta = null;
        string? apiKey = null;
        string? idempotencia = null;
        string? cuerpo = null;
        var handler = new ContadorHandler(async (pedido, token) =>
        {
            metodo = pedido.Method.Method;
            ruta = pedido.RequestUri?.AbsolutePath;
            apiKey = pedido.Headers.GetValues("X-Api-Key").Single();
            idempotencia = pedido.Headers.GetValues("Idempotency-Key").Single();
            cuerpo = await pedido.Content!.ReadAsStringAsync(token);
            return Json(HttpStatusCode.Created, RespuestaComprobante);
        });
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();

        await Arca(scope.ServiceProvider).EmitirFacturaAsync(SolicitudFactura(), CancellationToken.None);

        Assert.Equal("POST", metodo);
        Assert.Equal("/v1/comprobantes", ruta);
        Assert.Equal(ApiKey, apiKey);
        Assert.Equal("PAG-6f1c2a", idempotencia);

        using var documento = JsonDocument.Parse(cuerpo!);
        var raiz = documento.RootElement;
        // The issuing company comes from the API key: CUIT, concept and the IVA split are not sent.
        Assert.Equal(
            new[] { "puntoVenta", "tipoComprobante", "receptor", "items", "importeTotal", "observaciones" },
            raiz.EnumerateObject().Select(propiedad => propiedad.Name));
        Assert.Equal(1, raiz.GetProperty("puntoVenta").GetInt32());
        Assert.Equal(6, raiz.GetProperty("tipoComprobante").GetInt32());
        Assert.Equal(51250.00m, raiz.GetProperty("importeTotal").GetDecimal());
        Assert.Equal("Pago PAG-6f1c2a", raiz.GetProperty("observaciones").GetString());

        var receptor = raiz.GetProperty("receptor");
        Assert.Equal("DNI", receptor.GetProperty("documentoTipo").GetString());
        Assert.Equal("30123456", receptor.GetProperty("documentoNumero").GetString());
        Assert.Equal("Juan Carlos Pérez", receptor.GetProperty("razonSocial").GetString());
        Assert.Equal(5, receptor.GetProperty("condicionIva").GetInt32());

        Assert.Equal(2, raiz.GetProperty("items").GetArrayLength());
        var primerItem = raiz.GetProperty("items")[0];
        Assert.Equal("Póliza POL-0000042 - Cuota 3 de 12", primerItem.GetProperty("descripcion").GetString());
        Assert.Equal(1m, primerItem.GetProperty("cantidad").GetDecimal());
        Assert.Equal(26250.00m, primerItem.GetProperty("precioUnitario").GetDecimal());
        Assert.Equal(21m, primerItem.GetProperty("alicuotaIva").GetDecimal());
    }

    [Fact]
    public async Task EmitirFactura_mapea_la_respuesta_201_con_numero_con_formato_CAE_y_estado_aprobada()
    {
        var handler = new ContadorHandler((_, _) => Task.FromResult(Json(HttpStatusCode.Created, RespuestaComprobante)));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();

        var factura = await Arca(scope.ServiceProvider).EmitirFacturaAsync(SolicitudFactura(), CancellationToken.None);

        Assert.Equal("0001-00000123", factura.NumeroComprobante);
        Assert.Equal("74123456789012", factura.Cae);
        Assert.Equal(new DateOnly(2026, 11, 18), factura.VencimientoCae);
        Assert.Equal("APROBADA", factura.Estado);
        Assert.Null(factura.UrlPdf);
    }

    [Fact]
    public async Task EmitirFactura_acepta_el_200_del_reintento_idempotente()
    {
        var handler = new ContadorHandler((_, _) => Task.FromResult(Json(HttpStatusCode.OK, RespuestaComprobante)));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();

        var factura = await Arca(scope.ServiceProvider).EmitirFacturaAsync(SolicitudFactura(), CancellationToken.None);

        Assert.Equal("0001-00000123", factura.NumeroComprobante);
    }

    [Fact]
    public async Task EmitirFactura_se_envia_como_idempotente()
    {
        var marcadoNoIdempotente = true;
        var handler = new ContadorHandler((pedido, _) =>
        {
            marcadoNoIdempotente = pedido.Options.TryGetValue(ClienteHttpBase.SinReintento, out var valor) && valor;
            return Task.FromResult(Json(HttpStatusCode.Created, RespuestaComprobante));
        });
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();

        await Arca(scope.ServiceProvider).EmitirFacturaAsync(SolicitudFactura(), CancellationToken.None);

        Assert.False(marcadoNoIdempotente);
    }

    [Theory]
    [InlineData("A", 1)]
    [InlineData("C", 11)]
    public async Task EmitirFactura_traduce_la_letra_al_codigo_de_tipo_de_comprobante(string letra, int codigo)
    {
        string? cuerpo = null;
        var handler = new ContadorHandler(async (pedido, token) =>
        {
            cuerpo = await pedido.Content!.ReadAsStringAsync(token);
            return Json(HttpStatusCode.Created, RespuestaComprobante);
        });
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();

        await Arca(scope.ServiceProvider).EmitirFacturaAsync(SolicitudFactura() with { TipoComprobante = letra }, CancellationToken.None);

        using var documento = JsonDocument.Parse(cuerpo!);
        Assert.Equal(codigo, documento.RootElement.GetProperty("tipoComprobante").GetInt32());
    }

    [Fact]
    public async Task EmitirFactura_con_tipo_de_comprobante_desconocido_no_llama_al_servicio()
    {
        var handler = new ContadorHandler((_, _) => Task.FromResult(Json(HttpStatusCode.Created, RespuestaComprobante)));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();

        await Assert.ThrowsAsync<ArgumentException>(
            () => Arca(scope.ServiceProvider).EmitirFacturaAsync(SolicitudFactura() with { TipoComprobante = "Z" }, CancellationToken.None));

        Assert.Equal(0, handler.Llamadas);
    }

    [Fact]
    public async Task EmitirFactura_con_401_lanza_ExternalServiceException()
    {
        var handler = new ContadorHandler((_, _) =>
            Task.FromResult(Json(HttpStatusCode.Unauthorized, """{ "codigo": "API_KEY_INVALIDA", "mensaje": "x" }""")));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();

        var ex = await Assert.ThrowsAsync<ExternalServiceException>(
            () => Arca(scope.ServiceProvider).EmitirFacturaAsync(SolicitudFactura(), CancellationToken.None));

        Assert.Contains("API_KEY_INVALIDA", ex.Message);
    }

    [Theory]
    [InlineData(HttpStatusCode.BadRequest, "VALIDACION")]
    [InlineData(HttpStatusCode.Conflict, "IDEMPOTENCIA_CONFLICTO")]
    public async Task EmitirFactura_con_error_de_negocio_lanza_ExternalServiceException_con_el_codigo(HttpStatusCode estado, string codigo)
    {
        var handler = new ContadorHandler((_, _) =>
            Task.FromResult(Json(estado, $$"""{ "codigo": "{{codigo}}", "mensaje": "El documentoTipo no es válido." }""")));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();

        var ex = await Assert.ThrowsAsync<ExternalServiceException>(
            () => Arca(scope.ServiceProvider).EmitirFacturaAsync(SolicitudFactura(), CancellationToken.None));

        Assert.Contains(codigo, ex.Message);
        Assert.Contains("El documentoTipo no es válido.", ex.Message);
    }

    [Fact]
    public async Task EmitirFactura_con_comprobante_no_emitido_lanza_ExternalServiceException()
    {
        var handler = new ContadorHandler((_, _) =>
            Task.FromResult(Json(HttpStatusCode.Created, RespuestaComprobante.Replace("\"Emitido\"", "\"Rechazado\""))));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();

        await Assert.ThrowsAsync<ExternalServiceException>(
            () => Arca(scope.ServiceProvider).EmitirFacturaAsync(SolicitudFactura(), CancellationToken.None));
    }

    [Fact]
    public async Task EmitirFactura_con_500_lanza_ExternalServiceException()
    {
        var handler = new ContadorHandler((_, _) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.InternalServerError)));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();

        await Assert.ThrowsAsync<ExternalServiceException>(
            () => Arca(scope.ServiceProvider).EmitirFacturaAsync(SolicitudFactura(), CancellationToken.None));
    }

    [Fact]
    public async Task ConsultarFactura_no_esta_disponible_y_no_llama_al_servicio()
    {
        var handler = new ContadorHandler((_, _) => Task.FromResult(Json(HttpStatusCode.OK, RespuestaComprobante)));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();

        await Assert.ThrowsAsync<ExternalServiceException>(
            () => Arca(scope.ServiceProvider).ConsultarFacturaAsync("0001-00000123", CancellationToken.None));

        Assert.Equal(0, handler.Llamadas);
    }
}
