using System.Globalization;
using System.Net;
using System.Text;
using Aseguradora.Application.Services;
using Aseguradora.Data;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Integrations.Padi;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Fixtures;
using Aseguradora.Tests.Integrations;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Aseguradora.Tests.Pagos;

public sealed class PadiWebhooksControllerTests : IDisposable
{
    private const string Ruta = "/api/webhooks/padi";
    private const string Secreto = "secreto-de-prueba-de-al-menos-32-caracteres";
    private const string IdLink = "3f1a7c2e-9b4d-4e1a-8c5f-2d6b7a9e0c11";

    private readonly SqliteDbFixture sqlite = new();
    private readonly AseguradoraWebFactory factory;
    private PadiWebhookReceptor receptor = new(activo: true, Secreto);

    public PadiWebhooksControllerTests()
    {
        factory = new AseguradoraWebFactory
        {
            ConfigurarServicios = (_, services) =>
            {
                services.RemoveAll<DbContextOptions<AseguradoraDbContext>>();
                services.RemoveAll<AseguradoraDbContext>();
                services.AddScoped<AseguradoraDbContext>(_ => sqlite.CreateContext());
                services.RemoveAll<IExclusionWebhook>();
                services.AddSingleton<IExclusionWebhook, WebhookTestSupport.SinExclusion>();
                // The factory forces pasarela1 to the mock; the receiver stands in for a PADI configuration.
                services.RemoveAll<PadiWebhookReceptor>();
                services.AddSingleton(_ => receptor);
            }
        };
        factory.Ajustes["Integraciones:Pasarelas:pasarela1:ConfirmarWebhook"] = "false";
    }

    public void Dispose() { factory.Dispose(); sqlite.Dispose(); }

    private static StringContent Contenido(string cuerpo) => new(cuerpo, Encoding.UTF8, "application/json");

    private async Task<HttpResponseMessage> EnviarAsync(string cuerpo, string? firma)
    {
        using var cliente = factory.CreateClient();
        using var pedido = new HttpRequestMessage(HttpMethod.Post, Ruta) { Content = Contenido(cuerpo) };
        if (firma is not null) pedido.Headers.Add(PadiWebhookReceptor.HeaderFirma, firma);
        return await cliente.SendAsync(pedido);
    }

    private async Task<(Guid Id, decimal Importe)> SembrarPagoPendienteAsync()
    {
        using var db = sqlite.CreateContext();
        var cuota = (await db.Cuotas.FindAsync(SeedData.CuotaId(2)))!;
        var pago = Pago.CrearPendiente(SeedData.ClienteId, "PAG-a1b2c3", MedioPago.Pasarela, [cuota], DateTime.UtcNow, "pasarela1");
        pago.IdExterno = IdLink;
        db.Pagos.Add(pago);
        await db.SaveChangesAsync();
        return (pago.Id, pago.ImporteTotal);
    }

    [Fact]
    public async Task AvisoFirmado_AplicaElPagoDelLink()
    {
        var (id, importe) = await SembrarPagoPendienteAsync();
        var cuerpo = PadiWebhookReceptorTests.Aviso(link: IdLink, importe: importe.ToString("0.00", CultureInfo.InvariantCulture));

        var response = await EnviarAsync(cuerpo, PadiWebhookReceptorTests.Firmar(cuerpo));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var db = sqlite.CreateContext();
        Assert.Equal(EstadoPago.Aprobado, (await db.Pagos.FindAsync(id))!.Estado);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("0000000000000000000000000000000000000000000000000000000000000000")]
    public async Task FirmaAusenteOInvalida_401SinTocarElPago(string? firma)
    {
        var (id, importe) = await SembrarPagoPendienteAsync();
        var cuerpo = PadiWebhookReceptorTests.Aviso(link: IdLink, importe: importe.ToString("0.00", CultureInfo.InvariantCulture));

        var response = await EnviarAsync(cuerpo, firma);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        using var db = sqlite.CreateContext();
        Assert.Equal(EstadoPago.Pendiente, (await db.Pagos.FindAsync(id))!.Estado);
    }

    [Fact]
    public async Task OtroEvento_200SinProcesar()
    {
        var cuerpo = PadiWebhookReceptorTests.Aviso("payment.failed");

        var response = await EnviarAsync(cuerpo, PadiWebhookReceptorTests.Firmar(cuerpo));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task CuerpoFirmadoInvalido_400()
    {
        const string cuerpo = """{"event":"payment.succeeded"}""";

        var response = await EnviarAsync(cuerpo, PadiWebhookReceptorTests.Firmar(cuerpo));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PadiInactivo_404()
    {
        receptor = new PadiWebhookReceptor(activo: false, null);
        var cuerpo = PadiWebhookReceptorTests.Aviso();

        var response = await EnviarAsync(cuerpo, PadiWebhookReceptorTests.Firmar(cuerpo));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
