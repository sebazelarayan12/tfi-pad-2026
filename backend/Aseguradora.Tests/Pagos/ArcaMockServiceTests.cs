using Aseguradora.Application.Dtos;
using Aseguradora.Integrations.Arca;
namespace Aseguradora.Tests.Pagos;
public class ArcaMockServiceTests
{
    private static ArcaFacturaRequest Factura(string referencia) => new("30712345678", 1, "B", "SERVICIOS",
        new(2026, 11, 8), new("DNI", "30123456", "Cliente", "CONSUMIDOR_FINAL"),
        new[] { new ArcaItem("Cuota", 1, 51250m) }, 42355.37m, 8894.63m, 51250m, referencia);
    [Fact]
    public async Task ArcaEsIdempotenteYRespetaFormato()
    {
        var arca = new ArcaMockService();
        var request = Factura("PAG-1");
        var factura = await arca.EmitirFacturaAsync(request, default);
        Assert.Equal(factura, await arca.EmitirFacturaAsync(request, default));
        Assert.NotEqual(factura.NumeroComprobante, (await arca.EmitirFacturaAsync(Factura("PAG-2"), default)).NumeroComprobante);
        Assert.Matches(@"^[0-9]{14}$", factura.Cae);
        Assert.Matches(@"^0001-[0-9]{8}$", factura.NumeroComprobante);
        Assert.Equal(request.FechaEmision.AddDays(10), factura.VencimientoCae);

        Assert.Equal(factura, await arca.ConsultarFacturaAsync(factura.NumeroComprobante, default));
    }

    [Fact]
    public async Task RechazaTotalInconsistente()
    {
        var arca = new ArcaMockService();
        var request = Factura("PAG-ERROR") with { ImporteTotal = 1m };
        await Assert.ThrowsAsync<ArgumentException>(() => arca.EmitirFacturaAsync(request, default));
    }

    [Fact]
    public async Task Caso92EsAceptadoYConsultable()
    {
        var arca = new ArcaMockService();
        var factura = await arca.EmitirFacturaAsync(Factura("PAG-92"), default);
        Assert.Equal("APROBADA", factura.Estado);
        Assert.Equal(factura, await arca.ConsultarFacturaAsync(factura.NumeroComprobante, default));
    }

    [Fact]
    public async Task EmisionConcurrenteNoConsumeNumerosParaLaMismaReferencia()
    {
        var arca = new ArcaMockService();
        var facturas = await Task.WhenAll(Enumerable.Range(0, 30).Select(_ =>
            Task.Run(() => arca.EmitirFacturaAsync(Factura("PAG-1"), default))));
        Assert.All(facturas, factura => Assert.Equal(facturas[0], factura));
        var siguiente = await arca.EmitirFacturaAsync(Factura("PAG-2"), default);
        Assert.Equal("0001-00000002", siguiente.NumeroComprobante);
    }
}
