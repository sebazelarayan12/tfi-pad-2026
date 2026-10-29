using Aseguradora.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Aseguradora.Tests.Pagos;

public class FacturacionServiceTests
{
    [Fact]
    public async Task Caso92UsaIvaIncluidoYReferenciaDelPago()
    {
        using var test = new CobroTestContext();
        await test.Aprobacion.AprobarAsync(test.Pago, DateTime.UtcNow, default);
        var request = Assert.IsType<Aseguradora.Application.Dtos.ArcaFacturaRequest>(test.Arca.Request);
        Assert.Equal(51250m, request.ImporteTotal);
        Assert.Equal(42355.37m, request.ImporteNeto);
        Assert.Equal(8894.63m, request.ImporteIva);
        Assert.Equal(test.Pago.Numero, request.ReferenciaExterna);
        Assert.Equal("B", request.TipoComprobante);
        Assert.Equal("SERVICIOS", request.Concepto);
        Assert.Equal("DNI", request.Receptor.TipoDocumento);
        Assert.Equal("CONSUMIDOR_FINAL", request.Receptor.CondicionIva);
        Assert.Equal(51250m, Assert.Single(request.Items).PrecioUnitario);
        Assert.StartsWith("Póliza ", Assert.Single(request.Items).Descripcion);
        await test.Facturacion.EmitirAsync(test.Pago.Id);
        Assert.Equal(1, test.Arca.Llamadas);
    }

    [Fact]
    public async Task ArcaCaidoConservaCobroYFacturaPendienteQuePuedeReintentarse()
    {
        using var test = new CobroTestContext();
        test.Arca.Fallar = true;
        await test.Aprobacion.AprobarAsync(test.Pago, DateTime.UtcNow, default);
        var factura = await test.Db.Facturas.SingleAsync(f => f.PagoId == test.Pago.Id);
        Assert.Equal(EstadoPago.Aprobado, test.Pago.Estado);
        Assert.Equal(EstadoFactura.PendienteCae, factura.Estado);
        Assert.Null(factura.Cae);
        Assert.Equal("", factura.Numero);
        test.Arca.Fallar = false;
        await test.Facturacion.EmitirAsync(test.Pago.Id);
        Assert.Equal(EstadoFactura.Autorizada, factura.Estado);
        Assert.Single(await test.Db.Facturas.Where(f => f.PagoId == test.Pago.Id).ToListAsync());
    }

    [Fact]
    public async Task ReintentoCargaDetalleAunqueLaNavegacionNoEsteCargada()
    {
        using var test = new CobroTestContext();
        test.Arca.Fallar = true;
        await test.Aprobacion.AprobarAsync(test.Pago, DateTime.UtcNow, default);
        test.Db.ChangeTracker.Clear();
        test.Arca.Fallar = false;
        await test.Facturacion.EmitirAsync(test.Pago.Id);
        Assert.Single(test.Arca.Request!.Items);
        Assert.Equal(51250m, Assert.Single(test.Arca.Request.Items).PrecioUnitario);
        Assert.Equal(EstadoFactura.Autorizada,
            (await test.Db.Facturas.SingleAsync(f => f.PagoId == test.Pago.Id)).Estado);
    }
}
