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
        var cuota = test.Pago.PagoCuotas.First().Cuota;
        var poliza = await test.Db.Polizas.SingleAsync(p => p.Id == cuota.PolizaId);
        Assert.Equal($"Póliza {poliza.Numero} - Cuota {cuota.Numero} de {poliza.VigenciaMeses}",
            Assert.Single(request.Items).Descripcion);
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

    [Theory]
    [InlineData("", 1)]
    [InlineData("30712345678", 0)]
    public async Task RechazaDatosFiscalesInvalidosSinLlamarArca(string cuit, int puntoVenta)
    {
        using var test = new CobroTestContext();
        test.Pago.Aprobar(DateTime.UtcNow);
        await test.Db.SaveChangesAsync();
        test.Opciones.Cuit = cuit;
        test.Opciones.PuntoVenta = puntoVenta;
        await Assert.ThrowsAsync<Aseguradora.Application.Exceptions.BusinessRuleException>(
            () => test.Facturacion.EmitirAsync(test.Pago.Id));
        Assert.Equal(0, test.Arca.Llamadas);
    }

    [Fact]
    public async Task RespuestaInvalidaDeArcaDejaDatosParaConciliacion()
    {
        using var test = new CobroTestContext();
        test.Arca.Cae = "INVALIDO";
        await Assert.ThrowsAsync<Aseguradora.Domain.Exceptions.ReglaDeDominioException>(
            () => test.Aprobacion.AprobarAsync(test.Pago, DateTime.UtcNow, default));
        Assert.Contains(test.Log.Entradas, e => e.Texto.Contains("ARCA_AUTORIZACION_RECIBIDA")
            && e.Texto.Contains("0001-00000001") && e.Texto.Contains("INVALIDO"));
        Assert.Contains(test.Log.Entradas, e => e.Texto.Contains("ARCA_AUTORIZACION_NO_PERSISTIDA"));
    }

    [Fact]
    public async Task EstadoNoAprobadoDeArcaQuedaPendienteYSeRegistra()
    {
        using var test = new CobroTestContext();
        test.Arca.Estado = "RECHAZADA";
        await test.Aprobacion.AprobarAsync(test.Pago, DateTime.UtcNow, default);
        Assert.Contains(test.Log.Entradas, e => e.Nivel == Microsoft.Extensions.Logging.LogLevel.Warning
            && e.Texto.Contains("RECHAZADA"));
        Assert.Equal(EstadoFactura.PendienteCae,
            (await test.Db.Facturas.SingleAsync(f => f.PagoId == test.Pago.Id)).Estado);
    }


    [Fact]
    public async Task FalloAlGuardarCaeRegistraRespuestaAntesDePropagar()
    {
        using var test = new CobroTestContext();
        test.Pago.Aprobar(DateTime.UtcNow);
        await test.Db.SaveChangesAsync();
        test.Arca.AntesDeEmitir = null;
        var uow = new FalloSegundoGuardado(new Aseguradora.Data.Repositories.UnitOfWork(test.Db));
        var facturacion = new Aseguradora.Application.Services.FacturacionService(
            new Aseguradora.Data.Repositories.EfRepository<Aseguradora.Domain.Entities.Pago>(test.Db),
            new Aseguradora.Data.Repositories.EfRepository<Aseguradora.Domain.Entities.Cuota>(test.Db),
            new Aseguradora.Data.Repositories.EfRepository<Aseguradora.Domain.Entities.Poliza>(test.Db),
            new Aseguradora.Data.Repositories.EfRepository<Aseguradora.Domain.Entities.Cliente>(test.Db),
            new Aseguradora.Data.Repositories.EfRepository<Aseguradora.Domain.Entities.Factura>(test.Db),
            uow, test.Arca, test.Opciones, TimeProvider.System, test.Log);
        await Assert.ThrowsAsync<InvalidOperationException>(() => facturacion.EmitirAsync(test.Pago.Id));
        Assert.Contains(test.Log.Entradas, e => e.Texto.Contains("ARCA_AUTORIZACION_RECIBIDA")
            && e.Texto.Contains("74123456789012") && e.Texto.Contains("0001-00000001"));
        Assert.Contains(test.Log.Entradas, e => e.Nivel == Microsoft.Extensions.Logging.LogLevel.Error
            && e.Texto.Contains("ARCA_AUTORIZACION_NO_PERSISTIDA") && e.Texto.Contains("74123456789012"));
        test.Db.ChangeTracker.Clear();
        Assert.Equal(EstadoFactura.PendienteCae,
            (await test.Db.Facturas.SingleAsync(f => f.PagoId == test.Pago.Id)).Estado);
    }

    private sealed class FalloSegundoGuardado(Aseguradora.Domain.Interfaces.IUnitOfWork real)
        : Aseguradora.Domain.Interfaces.IUnitOfWork
    {
        private int llamadas;
        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
            => ++llamadas == 2 ? throw new InvalidOperationException("Guardado de CAE fallido.")
                : real.SaveChangesAsync(cancellationToken);
    }
}
