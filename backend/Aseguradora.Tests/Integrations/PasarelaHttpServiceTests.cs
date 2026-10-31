using System.Net;
using System.Text;
using System.Text.Json;
using Aseguradora.Application.Dtos;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.External;
using Aseguradora.Integrations;
using Aseguradora.Integrations.Http;
using Aseguradora.Integrations.Pagos;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Aseguradora.Tests.Integrations;

public class PasarelaHttpServiceTests
{
    private const string BaseUrl = "https://pasarela1.example";
    private const string ApiKey = "clave-pasarela1-prueba";
    private const string Proveedor = "pasarela1";

    private const string RespuestaCrearPago = """
        {
          "idPago": "PSR-998877",
          "estado": "PENDIENTE",
          "urlPago": "https://pasarela.example/checkout/PSR-998877",
          "fechaExpiracion": "2026-11-08T15:30:00Z"
        }
        """;

    private const string RespuestaConsultarPago = """
        {
          "idPago": "PSR-998877",
          "referenciaExterna": "PAG-6f1c2a",
          "estado": "APROBADO",
          "importe": 51250.00,
          "fecha": "2026-11-08T14:32:10Z",
          "medioPago": "TARJETA_DEBITO"
        }
        """;

    private static ServiceProvider CrearProveedor(ContadorHandler handler)
    {
        var ajustes = new Dictionary<string, string?>
        {
            ["Integraciones:Pasarelas:pasarela1:UsarMock"] = "false",
            ["Integraciones:Pasarelas:pasarela1:BaseUrl"] = BaseUrl,
            ["Integraciones:Pasarelas:pasarela1:ApiKey"] = ApiKey,
            ["Integraciones:Pasarelas:pasarela1:TimeoutSegundos"] = "5",
            ["Integraciones:Pasarelas:pasarela1:ReintentosMaximos"] = "0"
        };

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

    private static PasarelaCrearPagoRequest SolicitudPago() => new(
        ReferenciaExterna: "PAG-6f1c2a",
        Importe: 51250.00m,
        Moneda: "ARS",
        Descripcion: "Póliza POL-0000042 - Cuotas 3 y 4",
        Pagador: new PasarelaPagador("Juan Carlos Pérez", "30123456", "juan.perez@mail.com"),
        UrlRetornoExito: "https://aseguradora.example/pago/exito",
        UrlRetornoError: "https://aseguradora.example/pago/error",
        UrlNotificacion: "https://api-aseguradora.example/api/webhooks/pasarela/pasarela1");

    private static IPasarelaService Pasarela(IServiceProvider provider) =>
        provider.GetRequiredService<IPasarelaResolver>().Obtener(Proveedor);

    [Fact]
    public async Task CrearPago_envia_el_contrato_9_3_con_la_api_key()
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
            return Json(HttpStatusCode.Created, RespuestaCrearPago);
        });
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();

        await Pasarela(scope.ServiceProvider).CrearPagoAsync(SolicitudPago(), CancellationToken.None);

        Assert.Equal("POST", metodo);
        Assert.Equal("/api/pagos", ruta);
        Assert.Equal(ApiKey, apiKey);

        using var documento = JsonDocument.Parse(cuerpo!);
        var raiz = documento.RootElement;
        Assert.Equal(
            new[] { "referenciaExterna", "importe", "moneda", "descripcion", "pagador", "urlRetornoExito", "urlRetornoError", "urlNotificacion" },
            raiz.EnumerateObject().Select(propiedad => propiedad.Name));
        Assert.Equal("PAG-6f1c2a", raiz.GetProperty("referenciaExterna").GetString());
        Assert.Equal(51250.00m, raiz.GetProperty("importe").GetDecimal());
        Assert.Equal("ARS", raiz.GetProperty("moneda").GetString());
        Assert.Equal("Póliza POL-0000042 - Cuotas 3 y 4", raiz.GetProperty("descripcion").GetString());
        Assert.Equal(
            new[] { "nombre", "dni", "email" },
            raiz.GetProperty("pagador").EnumerateObject().Select(propiedad => propiedad.Name));
        Assert.Equal("juan.perez@mail.com", raiz.GetProperty("pagador").GetProperty("email").GetString());
        Assert.Equal("https://api-aseguradora.example/api/webhooks/pasarela/pasarela1", raiz.GetProperty("urlNotificacion").GetString());
    }

    [Fact]
    public async Task CrearPago_mapea_la_respuesta_201()
    {
        var handler = new ContadorHandler((_, _) => Task.FromResult(Json(HttpStatusCode.Created, RespuestaCrearPago)));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();

        var respuesta = await Pasarela(scope.ServiceProvider).CrearPagoAsync(SolicitudPago(), CancellationToken.None);

        Assert.Equal("PSR-998877", respuesta.IdPago);
        Assert.Equal("PENDIENTE", respuesta.Estado);
        Assert.Equal("https://pasarela.example/checkout/PSR-998877", respuesta.UrlPago);
        Assert.Equal(new DateTime(2026, 11, 8, 15, 30, 0, DateTimeKind.Utc), respuesta.FechaExpiracion);
    }

    [Fact]
    public async Task CrearPago_se_envia_como_no_idempotente()
    {
        var marcadoNoIdempotente = false;
        var handler = new ContadorHandler((pedido, _) =>
        {
            marcadoNoIdempotente = pedido.Options.TryGetValue(ClienteHttpBase.SinReintento, out var valor) && valor;
            return Task.FromResult(Json(HttpStatusCode.Created, RespuestaCrearPago));
        });
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();

        await Pasarela(scope.ServiceProvider).CrearPagoAsync(SolicitudPago(), CancellationToken.None);

        Assert.True(marcadoNoIdempotente);
    }

    [Fact]
    public async Task CrearPago_con_401_lanza_ExternalServiceException()
    {
        var handler = new ContadorHandler((_, _) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.Unauthorized)));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();

        await Assert.ThrowsAsync<ExternalServiceException>(
            () => Pasarela(scope.ServiceProvider).CrearPagoAsync(SolicitudPago(), CancellationToken.None));
    }

    [Fact]
    public async Task ConsultarPago_mapea_la_respuesta_200()
    {
        var handler = new ContadorHandler((_, _) => Task.FromResult(Json(HttpStatusCode.OK, RespuestaConsultarPago)));
        await using var provider = CrearProveedor(handler);
        using var scope = provider.CreateScope();

        var pago = await Pasarela(scope.ServiceProvider).ConsultarPagoAsync("PSR-998877", CancellationToken.None);

        Assert.Equal("/api/pagos/PSR-998877", handler.UltimoPedido?.RequestUri?.AbsolutePath);
        Assert.Equal("PSR-998877", pago.IdPago);
        Assert.Equal("PAG-6f1c2a", pago.ReferenciaExterna);
        Assert.Equal("APROBADO", pago.Estado);
        Assert.Equal(51250.00m, pago.Importe);
        Assert.Equal(new DateTime(2026, 11, 8, 14, 32, 10, DateTimeKind.Utc), pago.Fecha);
        Assert.Equal("TARJETA_DEBITO", pago.MedioPago);
    }
}
