using System.Net;
using Aseguradora.Application.Exceptions;
using Microsoft.Extensions.DependencyInjection;

namespace Aseguradora.Tests.Integrations;

public class ResilienciaTests
{
    [Fact]
    public async Task Timeout_LanzaExternalServiceException()
    {
        var handler = new ContadorHandler(async (_, token) =>
        {
            await Task.Delay(TimeSpan.FromSeconds(30), token);
            return new HttpResponseMessage(HttpStatusCode.OK);
        });
        await using var provider = IntegracionesTestHost.Proveedor(handler,
            IntegracionesTestHost.Ajustes(timeoutSegundos: 1, reintentosMaximos: 0));
        using var scope = provider.CreateScope();
        var cliente = (RealFalso)scope.ServiceProvider.GetRequiredService<IServicioFalso>();

        await Assert.ThrowsAsync<ExternalServiceException>(
            () => cliente.Enviar(new HttpRequestMessage(HttpMethod.Get, "/personas/1")));

        // A timeout is not retried: the other group already had its full attempt.
        Assert.Equal(1, handler.Llamadas);
    }

    [Fact]
    public async Task Get503_ReintentaHastaReintentosMaximos_LuegoLanza()
    {
        var handler = new ContadorHandler((_, _) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.ServiceUnavailable)));
        await using var provider = IntegracionesTestHost.Proveedor(handler,
            IntegracionesTestHost.Ajustes(reintentosMaximos: 2, timeoutSegundos: 1));
        using var scope = provider.CreateScope();
        var cliente = (RealFalso)scope.ServiceProvider.GetRequiredService<IServicioFalso>();

        await Assert.ThrowsAsync<ExternalServiceException>(
            () => cliente.Enviar(new HttpRequestMessage(HttpMethod.Get, "/personas/1")));

        // First attempt plus ReintentosMaximos retries.
        Assert.Equal(3, handler.Llamadas);
    }

    [Fact]
    public async Task Post_NoIdempotente_NoSeReintenta()
    {
        var handler = new ContadorHandler((_, _) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.ServiceUnavailable)));
        await using var provider = IntegracionesTestHost.Proveedor(handler,
            IntegracionesTestHost.Ajustes(reintentosMaximos: 2, timeoutSegundos: 1));
        using var scope = provider.CreateScope();
        var cliente = (RealFalso)scope.ServiceProvider.GetRequiredService<IServicioFalso>();
        var pago = new HttpRequestMessage(HttpMethod.Post, "/pagos")
        {
            Content = new StringContent("""{"monto":1500}""")
        };

        await Assert.ThrowsAsync<ExternalServiceException>(
            () => cliente.Enviar(pago, CancellationToken.None, esIdempotente: false));

        // A gateway payment creation must reach the other group exactly once.
        Assert.Equal(1, handler.Llamadas);
    }

    [Fact]
    public async Task Circuito_AbreTrasFallosConsecutivos_FallaSinRed()
    {
        var handler = new ContadorHandler((_, _) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.ServiceUnavailable)));
        await using var provider = IntegracionesTestHost.Proveedor(handler,
            IntegracionesTestHost.Ajustes(reintentosMaximos: 0, timeoutSegundos: 1));
        using var scope = provider.CreateScope();
        var cliente = (RealFalso)scope.ServiceProvider.GetRequiredService<IServicioFalso>();

        for (var intento = 0; intento < 5; intento++)
            await Assert.ThrowsAsync<ExternalServiceException>(
                () => cliente.Enviar(new HttpRequestMessage(HttpMethod.Get, "/personas/1")));

        Assert.Equal(5, handler.Llamadas);

        // The circuit is open: the next call fails without reaching the network.
        await Assert.ThrowsAsync<ExternalServiceException>(
            () => cliente.Enviar(new HttpRequestMessage(HttpMethod.Get, "/personas/1")));
        Assert.Equal(5, handler.Llamadas);
    }

    [Fact]
    public async Task Respuesta404_NoSeReintenta_NoLanza()
    {
        var handler = new ContadorHandler((_, _) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound)));
        await using var provider = IntegracionesTestHost.Proveedor(handler,
            IntegracionesTestHost.Ajustes(reintentosMaximos: 2, timeoutSegundos: 1));
        using var scope = provider.CreateScope();
        var cliente = (RealFalso)scope.ServiceProvider.GetRequiredService<IServicioFalso>();

        var respuesta = await cliente.Enviar(new HttpRequestMessage(HttpMethod.Get, "/personas/999"));

        // 4xx reaches the typed client, which decides what it means (PERSONA_NO_ENCONTRADA).
        Assert.Equal(HttpStatusCode.NotFound, respuesta.StatusCode);
        Assert.Equal(1, handler.Llamadas);
    }

    [Fact]
    public async Task ApiKey_ViajaEnHeader_YNoApareceEnLogs()
    {
        var logs = new CapturingLoggerProvider();
        var handler = new ContadorHandler((_, _) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.InternalServerError)));
        await using var provider = IntegracionesTestHost.Proveedor(handler,
            IntegracionesTestHost.Ajustes(reintentosMaximos: 0, timeoutSegundos: 1), logs);
        using var scope = provider.CreateScope();
        var cliente = (RealFalso)scope.ServiceProvider.GetRequiredService<IServicioFalso>();

        await Assert.ThrowsAsync<ExternalServiceException>(
            () => cliente.Enviar(new HttpRequestMessage(HttpMethod.Get, "/personas/1")));

        Assert.NotNull(handler.UltimoPedido);
        Assert.True(handler.UltimoPedido!.Headers.TryGetValues("X-Api-Key", out var valores));
        Assert.Equal(IntegracionesTestHost.ApiKey, Assert.Single(valores!));
        Assert.DoesNotContain(logs.Entradas, entrada => entrada.Contains(IntegracionesTestHost.ApiKey));
    }

    [Fact]
    public async Task EnviarAsync_PedidoNulo_LanzaArgumentNullException()
    {
        var handler = new ContadorHandler((_, _) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)));
        await using var provider = IntegracionesTestHost.Proveedor(handler, IntegracionesTestHost.Ajustes());
        using var scope = provider.CreateScope();
        var cliente = (RealFalso)scope.ServiceProvider.GetRequiredService<IServicioFalso>();

        await Assert.ThrowsAsync<ArgumentNullException>(() => cliente.Enviar(null!));
    }
}
