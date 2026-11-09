using Aseguradora.Application.Exceptions;
using Aseguradora.Application.Services;
using Aseguradora.Data.Repositories;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Aseguradora.Tests.Pagos;

public class FacturaPdfServiceTests
{
    private static FacturaPdfService Crear(CobroTestContext test) =>
        new(new EfRepository<Factura>(test.Db), test.Arca);

    [Fact]
    public async Task FacturaAutorizada_PideElPdfPorNumeroYTipo()
    {
        using var test = new CobroTestContext();
        await test.Aprobacion.AprobarAsync(test.Pago, DateTime.UtcNow, default);
        var factura = await test.Db.Facturas.SingleAsync(f => f.PagoId == test.Pago.Id);

        var pdf = await Crear(test).ObtenerAsync(test.Pago.Id);

        Assert.Equal([37, 80, 68, 70], pdf.Contenido);
        Assert.Equal($"factura-{factura.Tipo}-{factura.Numero}.pdf", pdf.NombreArchivo);
        Assert.Equal((factura.Numero, factura.Tipo), test.Arca.PdfPedido);
    }

    [Fact]
    public async Task FacturaPendienteDeCae_RechazaConReglaDeNegocioSinLlamarAlServicio()
    {
        using var test = new CobroTestContext();
        test.Arca.Fallar = true;
        await test.Aprobacion.AprobarAsync(test.Pago, DateTime.UtcNow, default);
        Assert.Equal(EstadoFactura.PendienteCae, (await test.Db.Facturas.SingleAsync()).Estado);

        await Assert.ThrowsAsync<BusinessRuleException>(() => Crear(test).ObtenerAsync(test.Pago.Id));

        Assert.Null(test.Arca.PdfPedido);
    }

    [Fact]
    public async Task PagoSinFactura_LanzaNotFound()
    {
        using var test = new CobroTestContext();

        await Assert.ThrowsAsync<NotFoundException>(() => Crear(test).ObtenerAsync(test.Pago.Id));
    }
}
