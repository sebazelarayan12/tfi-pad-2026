using Aseguradora.Data.Repositories;
using Aseguradora.Domain.Enums;
using Aseguradora.Tests.Fixtures;
using Aseguradora.Tests.Support;
using Microsoft.EntityFrameworkCore;

namespace Aseguradora.Tests.Pagos;

[Collection(SqlServerCollection.Nombre)]
public sealed class WebhookConcurrenciaTests(SqlServerContainerFixture fixture)
{
    [SkippableFact]
    public async Task DosWebhooksSimultaneos_UnaAprobacionYUnaFactura()
    {
        Skip.IfNot(fixture.Disponible, SqlServerContainerFixture.MotivoOmision);
        Guid cuotaId;
        decimal importe;
        await using (var setup = fixture.CrearContexto())
        {
            var poliza = await PolizasDePrueba.AgregarPolizaAsync(setup, EstadoPoliza.Pendiente, DateTime.UtcNow);
            var cuota = poliza.Cuotas.First();
            cuotaId = cuota.Id;
            importe = cuota.Importe + cuota.Recargo;
        }
        var pedido = WebhookTestSupport.Pedido(importe: importe) with { IdCuotas = [cuotaId] };
        await using var db1 = fixture.CrearContexto();
        await using var db2 = fixture.CrearContexto();
        var uno = WebhookTestSupport.Crear(db1, exclusion: new ExclusionWebhookSql(db1));
        var dos = WebhookTestSupport.Crear(db2, exclusion: new ExclusionWebhookSql(db2));
        await Task.WhenAll(uno.ProcesarAsync("pasarela1", pedido), dos.ProcesarAsync("pasarela1", pedido));
        await using var lectura = fixture.CrearContexto();
        var pago = await lectura.Pagos.SingleAsync(p => p.IdExterno == pedido.IdPago);
        Assert.Equal(EstadoPago.Aprobado, pago.Estado);
        Assert.Equal(1, await lectura.Facturas.CountAsync(f => f.PagoId == pago.Id));
        Assert.Equal(1, await lectura.PagoCuotas.CountAsync(pc => pc.CuotaId == cuotaId));
        Assert.Equal(EstadoCuota.Pagada, (await lectura.Cuotas.FindAsync(cuotaId))!.Estado);
    }
}
