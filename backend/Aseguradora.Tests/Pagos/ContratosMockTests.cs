using Aseguradora.Application.Dtos;
using Aseguradora.Application.External;
using Aseguradora.Application.Exceptions;
using Aseguradora.Integrations.Arca;
using Aseguradora.Integrations.Pasarela;
using Aseguradora.Integrations.Pagos;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
namespace Aseguradora.Tests.Pagos;
public class ContratosMockTests
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
        Assert.Equal(request.ImporteTotal, request.ImporteNeto + request.ImporteIva);
        Assert.Equal(factura, await arca.ConsultarFacturaAsync(factura.NumeroComprobante, default));
    }
    [Fact]
    public async Task PasarelasSonIndependientesYConservanEstado()
    {
        using var provider = new ServiceCollection().AddPagosIntegrations(new ConfigurationBuilder().Build()).BuildServiceProvider();
        var resolver = provider.GetRequiredService<IPasarelaResolver>();
        var uno = resolver.Obtener("pasarela1");
        var dos = resolver.Obtener("pasarela2");
        Assert.IsType<PasarelaMockService>(uno);
        Assert.IsType<PasarelaMockService>(dos);
        Assert.NotSame(uno, dos);
        Assert.Throws<NotFoundException>(() => resolver.Obtener("otra"));
        var pago = await uno.CrearPagoAsync(new("PAG-1", 100m, "ARS", "Cuota", new("Cliente", "30123456", "test@example.com"),
            "https://example.com/exito", "https://example.com/error", "https://example.com/webhook"), default);
        Assert.Equal("PSR-PAG-1", pago.IdPago);
        Assert.False(string.IsNullOrWhiteSpace(pago.UrlPago));
        Assert.Equal("PENDIENTE", (await uno.ConsultarPagoAsync(pago.IdPago, default)).Estado);
        await Assert.ThrowsAsync<NotFoundException>(() => dos.ConsultarPagoAsync(pago.IdPago, default));
        Assert.IsType<ArcaMockService>(provider.GetRequiredService<IArcaService>());
    }
    [Theory]
    [InlineData("Integraciones:Arca:UsarMock")]
    [InlineData("Integraciones:Pasarelas:pasarela1:UsarMock")]
    [InlineData("Integraciones:Pasarelas:pasarela2:UsarMock")]
    public void ClienteRealSinImplementacionFalla(string key)
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string,string?> { [key] = "false" }).Build();
        var error = Assert.Throws<InvalidOperationException>(() => new ServiceCollection().AddPagosIntegrations(config));
        Assert.Contains("US-F4-08", error.Message);
    }
}
