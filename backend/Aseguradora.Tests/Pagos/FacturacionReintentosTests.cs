using Aseguradora.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Aseguradora.Application.Services;
using Aseguradora.Domain.Entities;
using Aseguradora.Data.Seed;

namespace Aseguradora.Tests.Pagos;

public sealed class FacturacionReintentosTests
{
    [Fact]
    public async Task ErrorAislado_NoImpideIntentarLasDemasFacturas()
    {
        var emisor = new EmisorFallido();
        using var ctx = new CobroTestContext(emisor);
        ctx.Arca.Fallar = true;
        await ctx.Aprobacion.AprobarAsync(ctx.Pago, DateTime.UtcNow, default);
        var otroPago = (await ctx.Db.Pagos.FindAsync(SeedData.PagoId))!;
        ctx.Db.Facturas.Add(Factura.CrearPendienteCae(otroPago, DateTime.UtcNow));
        await ctx.Db.SaveChangesAsync();
        await ctx.Facturacion.ReintentarPendientesAsync();
        Assert.Equal(2, emisor.Pagos.Count);
        Assert.Contains(ctx.Pago.Id, emisor.Pagos);
        Assert.Contains(otroPago.Id, emisor.Pagos);
        Assert.Equal(2, ctx.Log.Entradas.Count(e => e.Texto.Contains("FACTURA_REINTENTO_ERROR")));
    }

    private sealed class EmisorFallido : IEmisorFacturaAislado
    {
        public List<Guid> Pagos { get; } = [];
        public Task EmitirAsync(Guid pagoId, CancellationToken ct)
        {
            Pagos.Add(pagoId);
            throw new InvalidOperationException("Scope fallido simulado.");
        }
    }

    [Fact]
    public async Task ArcaFallaYLuegoResponde_AutorizaLaMismaFactura()
    {
        using var ctx = new CobroTestContext();
        ctx.Arca.Fallar = true;
        await ctx.Aprobacion.AprobarAsync(ctx.Pago, DateTime.UtcNow, default);
        var pendiente = await ctx.Db.Facturas.SingleAsync(f => f.PagoId == ctx.Pago.Id);
        var id = pendiente.Id;
        ctx.Arca.Fallar = false;
        ctx.Db.ChangeTracker.Clear();
        await ctx.Facturacion.ReintentarPendientesAsync();
        var autorizada = await ctx.Db.Facturas.SingleAsync(f => f.Id == id);
        Assert.Equal(EstadoFactura.Autorizada, autorizada.Estado);
        Assert.Equal(ctx.Arca.Cae, autorizada.Cae);
        Assert.Equal(1, await ctx.Db.Facturas.CountAsync(f => f.PagoId == ctx.Pago.Id));
        Assert.Equal(2, ctx.Arca.Llamadas);
        await ctx.Facturacion.ReintentarPendientesAsync();
        Assert.Equal(2, ctx.Arca.Llamadas);
    }

    [Fact]
    public async Task Autorizada_NoSeEnviaOtraVez()
    {
        using var ctx = new CobroTestContext();
        await ctx.Aprobacion.AprobarAsync(ctx.Pago, DateTime.UtcNow, default);
        await ctx.Facturacion.ReintentarPendientesAsync();
        Assert.Equal(1, ctx.Arca.Llamadas);
    }

    [Fact]
    public async Task ArcaSigueCaido_ConservaPendienteSinExcepcion()
    {
        using var ctx = new CobroTestContext();
        ctx.Arca.Fallar = true;
        await ctx.Aprobacion.AprobarAsync(ctx.Pago, DateTime.UtcNow, default);
        await ctx.Facturacion.ReintentarPendientesAsync();
        await ctx.Facturacion.ReintentarPendientesAsync();
        var factura = await ctx.Db.Facturas.SingleAsync(f => f.PagoId == ctx.Pago.Id);
        Assert.Equal(EstadoFactura.PendienteCae, factura.Estado);
        Assert.Null(factura.Cae);
        Assert.Equal(1, await ctx.Db.Facturas.CountAsync(f => f.PagoId == ctx.Pago.Id));
        Assert.Equal(3, ctx.Arca.Llamadas);
    }
}
