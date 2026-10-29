using Aseguradora.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Aseguradora.Tests.Pagos;

public class AprobacionPagoServiceTests
{
    [Fact]
    public async Task ApruebaCuotasReevaluaPolizaYFacturaUnaSolaVez()
    {
        using var test = new CobroTestContext();
        var fecha = DateTime.UtcNow;
        var pago = await test.Aprobacion.AprobarAsync(test.Pago, fecha, default);
        Assert.Equal(EstadoPago.Aprobado, pago.Estado);
        Assert.Equal(fecha, pago.FechaAcreditacion);
        var detalle = Assert.Single(pago.PagoCuotas);
        Assert.Equal(EstadoCuota.Pagada, detalle.Cuota.Estado);
        Assert.Equal(fecha, detalle.Cuota.FechaPago);
        Assert.Contains(detalle.Cuota.PolizaId, test.Actualizador.Llamadas);
        var factura = await test.Db.Facturas.SingleAsync(f => f.PagoId == pago.Id);
        Assert.Equal(EstadoFactura.Autorizada, factura.Estado);
        Assert.Equal(pago.ImporteTotal, factura.Importe);
        Assert.Equal("0001-00000001", factura.Numero);
        Assert.NotNull(factura.Cae);
        Assert.NotNull(factura.VencimientoCae);

        await test.Aprobacion.AprobarAsync(pago, fecha.AddDays(1), default);
        Assert.Equal(fecha, pago.FechaAcreditacion);
        Assert.Equal(1, test.Arca.Llamadas);
        Assert.Single(test.Actualizador.Llamadas);
        Assert.Single(await test.Db.Facturas.Where(f => f.PagoId == pago.Id).ToListAsync());
    }

    [Fact]
    public async Task PagoDuplicadoSeApruebaSinTocarCuotasNiFacturar()
    {
        using var test = new CobroTestContext();
        var cuota = Assert.Single(test.Pago.PagoCuotas).Cuota;
        var fechaOriginal = DateTime.UtcNow.AddHours(-1);
        cuota.Pagar(fechaOriginal);
        await test.Db.SaveChangesAsync();
        await test.Aprobacion.AprobarAsync(test.Pago, DateTime.UtcNow, default);
        Assert.Equal(EstadoPago.Aprobado, test.Pago.Estado);
        Assert.Equal(fechaOriginal, cuota.FechaPago);
        Assert.Equal(0, test.Arca.Llamadas);
        Assert.Empty(test.Actualizador.Llamadas);
        Assert.Empty(await test.Db.Facturas.Where(f => f.PagoId == test.Pago.Id).ToListAsync());
    }

    [Fact]
    public async Task AprobarVariasCuotasPagaTodasYFacturaElTotal()
    {
        using var test = new CobroTestContext();
        var adicional = await test.Db.Cuotas.FirstAsync(c =>
            c.Estado == EstadoCuota.Pendiente && c.Id != test.Pago.PagoCuotas.First().CuotaId);
        adicional.Recargo = 100m;
        var importeAdicional = adicional.Importe + adicional.Recargo;
        test.Pago.PagoCuotas.Add(new Aseguradora.Domain.Entities.PagoCuota {
            PagoId = test.Pago.Id, Pago = test.Pago, CuotaId = adicional.Id,
            Cuota = adicional, Importe = importeAdicional });
        await test.Db.SaveChangesAsync();
        var fecha = DateTime.UtcNow;
        await test.Aprobacion.AprobarAsync(test.Pago, fecha, default);
        Assert.Equal(2, test.Pago.PagoCuotas.Count);
        Assert.All(test.Pago.PagoCuotas, detalle => {
            Assert.Equal(EstadoCuota.Pagada, detalle.Cuota.Estado);
            Assert.Equal(fecha, detalle.Cuota.FechaPago);
        });
        Assert.Equal(51250m + importeAdicional, test.Pago.ImporteTotal);
        Assert.Equal(test.Pago.ImporteTotal, test.Arca.Request!.ImporteTotal);
        Assert.Equal(2, test.Arca.Request.Items.Count);
    }
}
