using System.Net;
using System.Text;
using System.Text.Json;
using Aseguradora.Application.Dtos;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.External;
using Aseguradora.Integrations;
using Aseguradora.Integrations.Padi;
using Aseguradora.Integrations.Pagos;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Aseguradora.Tests.Integrations;

public class PadiPasarelaServiceTests
{
    private const string BaseUrl = "https://padi.example";
    private const string ApiKey = "clave-padi-prueba";
    private const string Proveedor = "pasarela1";
    private const string IdLink = "3f1a7c2e-9b4d-4e1a-8c5f-2d6b7a9e0c11";
    private const string OtroLink = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    private const string Secreto = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

    private static string Link(string estado = "Active") => $$"""
        {
          "id": "{{IdLink}}", "token": "tok123", "amount": 51250.00, "currency": "ARS",
          "title": "PAG-6f1c2a - Cuotas", "description": null, "status": "{{estado}}", "type": "SingleUse",
          "createdAt": "2026-11-08T14:00:00+00:00", "expiresAt": "2026-11-08T14:50:00+00:00",
          "checkoutUrl": "https://padi.example/checkout/tok123", "qrCodeUrl": "https://padi.example/qr/tok123"
        }
        """;

    private static string Pago(string link, string estado, string moneda = "ARS", decimal importe = 51250.00m) => $$"""
        {
          "id": "{{Guid.NewGuid()}}", "paymentLinkId": "{{link}}", "destinationWalletId": "{{Guid.NewGuid()}}",
          "amount": {{importe.ToString(System.Globalization.CultureInfo.InvariantCulture)}}, "currency": "{{moneda}}",
          "paymentMethod": "Card", "status": "{{estado}}", "transferId": null, "authorizationCode": "AUTH1",
          "failureReason": null, "createdAt": "2026-11-08T14:31:00+00:00", "completedAt": "2026-11-08T14:32:10+00:00"
        }
        """;

    private static ServiceProvider CrearProveedor(ContadorHandler handler, IDictionary<string, string?>? extra = null)
    {
        var ajustes = new Dictionary<string, string?>
        {
            ["Integraciones:Pasarelas:pasarela1:UsarMock"] = "false",
            ["Integraciones:Pasarelas:pasarela1:Tipo"] = "Padi",
            ["Integraciones:Pasarelas:pasarela1:BaseUrl"] = BaseUrl,
            ["Integraciones:Pasarelas:pasarela1:ApiKey"] = ApiKey,
            ["Integraciones:Pasarelas:pasarela1:WebhookSecret"] = Secreto,
            ["Integraciones:Pasarelas:pasarela1:TimeoutSegundos"] = "5",
            // Retries on so the test proves creation is still sent only once.
            ["Integraciones:Pasarelas:pasarela1:ReintentosMaximos"] = "2"
        };
        foreach (var (clave, valor) in extra ?? new Dictionary<string, string?>())
            ajustes[clave] = valor;

        var configuration = new ConfigurationBuilder().AddInMemoryCollection(ajustes).Build();
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddIntegraciones(configuration);
        services.AddPagosIntegrations(configuration);
        services.AddHttpClient($"Pasarelas:{Proveedor}").ConfigurePrimaryHttpMessageHandler(() => handler);
        return services.BuildServiceProvider(new ServiceProviderOptions { ValidateScopes = true });
    }

    private static HttpResponseMessage Json(HttpStatusCode estado, string json) => new(estado)
    {
        Content = new StringContent(json, Encoding.UTF8, "application/json")
    };

    // Answers the link and the received-payments list by path.
    private static ContadorHandler Consulta(string estadoLink, params string[] pagos) => new((pedido, _) =>
        Task.FromResult(pedido.RequestUri!.AbsolutePath.EndsWith("/received-payments", StringComparison.Ordinal)
            ? Json(HttpStatusCode.OK, $"[{string.Join(",", pagos)}]")
            : Json(HttpStatusCode.OK, Link(estadoLink))));

    private static PasarelaCrearPagoRequest SolicitudPago(string descripcion = "Cuotas de la póliza POL-0000042") => new(
        ReferenciaExterna: "PAG-6f1c2a",
        Importe: 51250.00m,
        Moneda: "ARS",
        Descripcion: descripcion,
        Pagador: new PasarelaPagador("Juan Carlos Pérez", "30123456", "juan.perez@mail.com"),
        UrlRetornoExito: "https://aseguradora.example/pago/exito",
        UrlRetornoError: "https://aseguradora.example/pago/error",
        UrlNotificacion: "https://api-aseguradora.example/api/webhooks/pasarela/pasarela1");

    private static IPasarelaService Pasarela(IServiceProvider provider) =>
        provider.GetRequiredService<IPasarelaResolver>().Obtener(Proveedor);

    [Fact]
    public async Task CrearPago_EnviaElLinkYMapeaLaRespuesta()
    {
        string? cuerpo = null;
        var handler = new ContadorHandler(async (pedido, ct) =>
        {
            cuerpo = await pedido.Content!.ReadAsStringAsync(ct);
            return Json(HttpStatusCode.Created, Link());
        });
        using var provider = CrearProveedor(handler);

        var respuesta = await Pasarela(provider).CrearPagoAsync(SolicitudPago(), CancellationToken.None);

        Assert.IsType<PadiPasarelaService>(Pasarela(provider));
        Assert.Equal(HttpMethod.Post, handler.UltimoPedido!.Method);
        Assert.Equal($"{BaseUrl}/api/v1/integrations/payment-links", handler.UltimoPedido.RequestUri!.ToString());
        Assert.Equal(ApiKey, handler.UltimoPedido.Headers.GetValues("X-Api-Key").Single());
        using var json = JsonDocument.Parse(cuerpo!);
        var raiz = json.RootElement;
        Assert.Equal(51250.00m, raiz.GetProperty("amount").GetDecimal());
        Assert.Equal("PAG-6f1c2a - Cuotas de la póliza POL-0000042", raiz.GetProperty("title").GetString());
        Assert.Equal("ARS", raiz.GetProperty("currency").GetString());
        Assert.Equal("SingleUse", raiz.GetProperty("type").GetString());
        // Default Pagos:ReservaMinutos is 60, so the link lives 50 minutes.
        Assert.Equal(50, raiz.GetProperty("ttlMinutes").GetInt32());

        Assert.Equal(IdLink, respuesta.IdPago);
        Assert.Equal("PENDIENTE", respuesta.Estado);
        Assert.Equal("https://padi.example/checkout/tok123", respuesta.UrlPago);
        Assert.Equal(new DateTime(2026, 11, 8, 14, 50, 0, DateTimeKind.Utc), respuesta.FechaExpiracion);
        Assert.Equal(DateTimeKind.Utc, respuesta.FechaExpiracion.Kind);
    }

    [Fact]
    public async Task CrearPago_TtlSigueAReservaMinutosYElTituloSeRecortaA128()
    {
        string? cuerpo = null;
        var handler = new ContadorHandler(async (pedido, ct) =>
        {
            cuerpo = await pedido.Content!.ReadAsStringAsync(ct);
            return Json(HttpStatusCode.Created, Link());
        });
        using var provider = CrearProveedor(handler, new Dictionary<string, string?> { ["Pagos:ReservaMinutos"] = "30" });

        await Pasarela(provider).CrearPagoAsync(SolicitudPago(new string('x', 600)), CancellationToken.None);

        using var json = JsonDocument.Parse(cuerpo!);
        Assert.Equal(20, json.RootElement.GetProperty("ttlMinutes").GetInt32());
        Assert.Equal(PadiPasarelaService.LargoMaximoTitulo, json.RootElement.GetProperty("title").GetString()!.Length);
        Assert.Equal(PadiPasarelaService.LargoMaximoDescripcion, json.RootElement.GetProperty("description").GetString()!.Length);
    }

    [Theory]
    [InlineData(HttpStatusCode.ServiceUnavailable)]
    [InlineData(HttpStatusCode.InternalServerError)]
    public async Task CrearPago_ErrorDelServidor_NoReintentaYLanzaExternalServiceException(HttpStatusCode estado)
    {
        var handler = new ContadorHandler((_, _) => Task.FromResult(new HttpResponseMessage(estado)));
        using var provider = CrearProveedor(handler);

        await Assert.ThrowsAsync<ExternalServiceException>(
            () => Pasarela(provider).CrearPagoAsync(SolicitudPago(), CancellationToken.None));

        Assert.Equal(1, handler.Llamadas);
    }

    [Fact]
    public async Task CrearPago_ErrorDeRed_NoReintenta()
    {
        var handler = new ContadorHandler((_, _) => throw new HttpRequestException("sin red"));
        using var provider = CrearProveedor(handler);

        await Assert.ThrowsAsync<ExternalServiceException>(
            () => Pasarela(provider).CrearPagoAsync(SolicitudPago(), CancellationToken.None));

        Assert.Equal(1, handler.Llamadas);
    }

    [Fact]
    public async Task CrearPago_400ConCodigo_IncluyeElCodigoEnElMensaje()
    {
        var handler = new ContadorHandler((_, _) => Task.FromResult(Json(HttpStatusCode.BadRequest,
            """{"title":"Datos inválidos","status":400,"code":"INVALID_INPUT"}""")));
        using var provider = CrearProveedor(handler);

        var ex = await Assert.ThrowsAsync<ExternalServiceException>(
            () => Pasarela(provider).CrearPagoAsync(SolicitudPago(), CancellationToken.None));

        Assert.Contains("INVALID_INPUT", ex.Message);
    }

    [Fact]
    public async Task CrearPago_401_LanzaExternalServiceException()
    {
        var handler = new ContadorHandler((_, _) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.Unauthorized)));
        using var provider = CrearProveedor(handler);

        var ex = await Assert.ThrowsAsync<ExternalServiceException>(
            () => Pasarela(provider).CrearPagoAsync(SolicitudPago(), CancellationToken.None));

        Assert.Contains("401", ex.Message);
    }

    [Fact]
    public async Task CrearPago_RespuestaSinCheckoutUrl_LanzaExternalServiceException()
    {
        var handler = new ContadorHandler((_, _) => Task.FromResult(Json(HttpStatusCode.Created,
            Link().Replace("\"checkoutUrl\": \"https://padi.example/checkout/tok123\"", "\"checkoutUrl\": null"))));
        using var provider = CrearProveedor(handler);

        await Assert.ThrowsAsync<ExternalServiceException>(
            () => Pasarela(provider).CrearPagoAsync(SolicitudPago(), CancellationToken.None));
    }

    [Fact]
    public async Task Consultar_LinkActivoSinPagos_Pendiente()
    {
        var handler = Consulta("Active", Pago(OtroLink, "Succeeded"));
        using var provider = CrearProveedor(handler);

        var pago = await Pasarela(provider).ConsultarPagoAsync(IdLink, CancellationToken.None);

        Assert.Equal(IdLink, pago.IdPago);
        Assert.Null(pago.ReferenciaExterna);
        Assert.Equal("PENDIENTE", pago.Estado);
        Assert.Equal(51250.00m, pago.Importe);
        Assert.Equal(new DateTime(2026, 11, 8, 14, 0, 0, DateTimeKind.Utc), pago.Fecha);
        Assert.Null(pago.MedioPago);
    }

    [Fact]
    public async Task Consultar_PagoSucceeded_Aprobado()
    {
        var handler = Consulta("Completed", Pago(OtroLink, "Succeeded"), Pago(IdLink, "Succeeded"));
        using var provider = CrearProveedor(handler);

        var pago = await Pasarela(provider).ConsultarPagoAsync(IdLink, CancellationToken.None);

        Assert.Equal(IdLink, pago.IdPago);
        Assert.Equal("APROBADO", pago.Estado);
        Assert.Equal(51250.00m, pago.Importe);
        Assert.Equal(new DateTime(2026, 11, 8, 14, 32, 10, DateTimeKind.Utc), pago.Fecha);
        Assert.Equal("Card", pago.MedioPago);
        Assert.Contains("limit=100", handler.UltimoPedido!.RequestUri!.Query);
    }

    [Theory]
    [InlineData("Expired")]
    [InlineData("Cancelled")]
    public async Task Consultar_LinkVencidoOCancelado_Cancelado(string estado)
    {
        using var provider = CrearProveedor(Consulta(estado));

        var pago = await Pasarela(provider).ConsultarPagoAsync(IdLink, CancellationToken.None);

        Assert.Equal("CANCELADO", pago.Estado);
    }

    [Fact]
    public async Task Consultar_IntentoFallidoConLinkActivo_SiguePendiente()
    {
        // The customer can retry on the same link, so a failed attempt must not close our payment.
        using var provider = CrearProveedor(Consulta("Active", Pago(IdLink, "Failed")));

        var pago = await Pasarela(provider).ConsultarPagoAsync(IdLink, CancellationToken.None);

        Assert.Equal("PENDIENTE", pago.Estado);
    }

    [Fact]
    public async Task Consultar_LinkCompletedSinPagoVisible_NoApruebaSinImporteConfirmado()
    {
        using var provider = CrearProveedor(Consulta("Completed"));

        var pago = await Pasarela(provider).ConsultarPagoAsync(IdLink, CancellationToken.None);

        Assert.Equal("PENDIENTE", pago.Estado);
    }

    [Fact]
    public async Task Consultar_PagoEnOtraMoneda_LanzaExternalServiceException()
    {
        using var provider = CrearProveedor(Consulta("Completed", Pago(IdLink, "Succeeded", moneda: "USD")));

        await Assert.ThrowsAsync<ExternalServiceException>(
            () => Pasarela(provider).ConsultarPagoAsync(IdLink, CancellationToken.None));
    }

    [Fact]
    public async Task Consultar_LinkInexistente_LanzaExternalServiceException()
    {
        var handler = new ContadorHandler((_, _) => Task.FromResult(Json(HttpStatusCode.NotFound,
            """{"status":404,"code":"PAYMENT_INTENT_NOT_FOUND"}""")));
        using var provider = CrearProveedor(handler);

        await Assert.ThrowsAsync<ExternalServiceException>(
            () => Pasarela(provider).ConsultarPagoAsync(IdLink, CancellationToken.None));
    }

    [Fact]
    public async Task Consultar_IdQueNoEsGuid_NoLlamaAPadi()
    {
        var handler = Consulta("Active");
        using var provider = CrearProveedor(handler);

        await Assert.ThrowsAsync<ExternalServiceException>(
            () => Pasarela(provider).ConsultarPagoAsync("PSR-123", CancellationToken.None));

        Assert.Equal(0, handler.Llamadas);
    }

    [Fact]
    public async Task Consultar_ErrorTransitorio_SeReintentaPorqueEsIdempotente()
    {
        var llamadas = 0;
        var handler = new ContadorHandler((pedido, _) =>
        {
            llamadas++;
            if (llamadas == 1) return Task.FromResult(new HttpResponseMessage(HttpStatusCode.ServiceUnavailable));
            return Task.FromResult(pedido.RequestUri!.AbsolutePath.EndsWith("/received-payments", StringComparison.Ordinal)
                ? Json(HttpStatusCode.OK, "[]")
                : Json(HttpStatusCode.OK, Link()));
        });
        using var provider = CrearProveedor(handler);

        var pago = await Pasarela(provider).ConsultarPagoAsync(IdLink, CancellationToken.None);

        Assert.Equal("PENDIENTE", pago.Estado);
        Assert.Equal(3, handler.Llamadas);
    }
}
