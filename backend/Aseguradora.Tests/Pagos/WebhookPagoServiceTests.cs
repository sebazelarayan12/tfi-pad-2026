using Aseguradora.Application.Dtos;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.External;
using Aseguradora.Data;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Enums;
using Aseguradora.Tests.Data;
using Microsoft.EntityFrameworkCore;
using Aseguradora.Application.Services;
using Microsoft.Extensions.Logging;

namespace Aseguradora.Tests.Pagos;

public sealed class WebhookPagoServiceTests : IDisposable
{
    private readonly SqliteDbFixture fixture = new();
    private readonly AseguradoraDbContext db;
    public WebhookPagoServiceTests() => db = fixture.CreateContext();
    public void Dispose() { db.Dispose(); fixture.Dispose(); }

    [Fact]
    public async Task AprobadoDesdeCuotas_CreaPagoFacturaYRepeticionNoDuplica()
    {
        var servicio = WebhookTestSupport.Crear(db);
        var request = WebhookTestSupport.Pedido();
        await servicio.ProcesarAsync("pasarela1", request);
        db.ChangeTracker.Clear();
        await servicio.ProcesarAsync("pasarela1", request);
        var pago = await db.Pagos.SingleAsync(p => p.IdExterno == request.IdPago);
        Assert.Equal(EstadoPago.Aprobado, pago.Estado);
        Assert.Equal(request.Fecha.UtcDateTime, pago.FechaAcreditacion);
        Assert.Equal(EstadoCuota.Pagada, (await db.Cuotas.FindAsync(SeedData.CuotaId(2)))!.Estado);
        Assert.Equal(1, await db.Facturas.CountAsync(f => f.PagoId == pago.Id));
    }

    [Theory]
    [InlineData("RECHAZADO", 12000)]
    [InlineData("CANCELADO", 12000)]
    [InlineData("RECHAZADO", 1)]
    [InlineData("CANCELADO", 1)]
    public async Task NoAprobado_RechazaSinPagarCuotas(string estado, int importe)
    {
        var request = WebhookTestSupport.Pedido(estado, importe);
        await WebhookTestSupport.Crear(db).ProcesarAsync("pasarela1", request);
        Assert.Equal(EstadoPago.Rechazado, (await db.Pagos.SingleAsync(p => p.IdExterno == request.IdPago)).Estado);
        Assert.Equal(EstadoCuota.Pendiente, (await db.Cuotas.FindAsync(SeedData.CuotaId(2)))!.Estado);
        Assert.Empty(await db.Facturas.ToListAsync());
    }

    [Fact]
    public async Task ImporteDistinto_NoApruebaNiModificaCuotas()
    {
        var request = WebhookTestSupport.Pedido(importe: 1);
        var log = new RegistroLog<WebhookPagoService>();
        await WebhookTestSupport.Crear(db, logger: log).ProcesarAsync("pasarela1", request);
        Assert.Contains(log.Entradas, e => e.Nivel == LogLevel.Error && e.Texto.Contains("PAGO_IMPORTE_NO_COINCIDE"));
        Assert.Equal(EstadoPago.Pendiente, (await db.Pagos.SingleAsync(p => p.IdExterno == request.IdPago)).Estado);
        Assert.Equal(EstadoCuota.Pendiente, (await db.Cuotas.FindAsync(SeedData.CuotaId(2)))!.Estado);
        Assert.Empty(await db.Facturas.ToListAsync());
    }

    [Theory]
    [InlineData(EstadoCuota.Pagada)]
    [InlineData(EstadoCuota.Anulada)]
    public async Task CuotaNoPagable_RechazaSinCrearPago(EstadoCuota estado)
    {
        (await db.Cuotas.FindAsync(SeedData.CuotaId(2)))!.Estado = estado;
        await db.SaveChangesAsync();
        await Assert.ThrowsAsync<BusinessRuleException>(() => WebhookTestSupport.Crear(db)
            .ProcesarAsync("pasarela1", WebhookTestSupport.Pedido()));
        Assert.Equal(1, await db.Pagos.CountAsync());
    }

    [Fact]
    public async Task DesconocidoSinReferenciaNiCuotas_NoEncontrado()
    {
        await Assert.ThrowsAsync<NotFoundException>(() => WebhookTestSupport.Crear(db)
            .ProcesarAsync("pasarela1", WebhookTestSupport.Pedido() with { IdCuotas = null }));
    }

    [Fact]
    public async Task PagoOnlineExistente_SeCargaSinNavegacionesYAprueba()
    {
        var cuota = (await db.Cuotas.FindAsync(SeedData.CuotaId(2)))!;
        var pago = Aseguradora.Domain.Entities.Pago.CrearPendiente(SeedData.ClienteId, "PAG-abcdef", MedioPago.Pasarela,
            [cuota], DateTime.UtcNow, "pasarela1");
        pago.IdExterno = "PSR-existente";
        db.Pagos.Add(pago);
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();
        await WebhookTestSupport.Crear(db).ProcesarAsync("pasarela1", WebhookTestSupport.Pedido() with
        { IdPago = pago.IdExterno, ReferenciaExterna = pago.Numero, IdCuotas = null });
        Assert.Equal(1, await db.Facturas.CountAsync(f => f.PagoId == pago.Id));
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task Confirmacion_ExigeCoincidencia(bool coincide)
    {
        var request = WebhookTestSupport.Pedido();
        var pasarela = new Confirmador(request, coincide);
        await WebhookTestSupport.Crear(db, true, pasarela).ProcesarAsync("pasarela1", request);
        Assert.Equal(1, pasarela.Llamadas);
        Assert.Equal(coincide ? 2 : 1, await db.Pagos.CountAsync());
        Assert.Equal(coincide ? EstadoCuota.Pagada : EstadoCuota.Pendiente,
            (await db.Cuotas.FindAsync(SeedData.CuotaId(2)))!.Estado);
    }

    [Fact]
    public async Task ResultadoPendienteParaConciliacion_NoRechazaElPago()
    {
        var cuota = (await db.Cuotas.FindAsync(SeedData.CuotaId(2)))!;
        var pago = Aseguradora.Domain.Entities.Pago.CrearPendiente(SeedData.ClienteId, "PAG-abcdef", MedioPago.Pasarela,
            [cuota], DateTime.UtcNow, "pasarela1");
        db.Pagos.Add(pago);
        await db.SaveChangesAsync();
        await WebhookTestSupport.Crear(db).AplicarResultadoAsync(pago, "PENDIENTE", pago.ImporteTotal);
        Assert.Equal(EstadoPago.Pendiente, pago.Estado);
        Assert.Equal(EstadoCuota.Pendiente, cuota.Estado);
        Assert.Empty(await db.Facturas.ToListAsync());
    }

    [Fact]
    public async Task FechaConOffset_SeAcreditaEnUtc()
    {
        var fecha = new DateTimeOffset(2026, 10, 30, 12, 0, 0, TimeSpan.FromHours(-3));
        var request = WebhookTestSupport.Pedido() with { Fecha = fecha };
        await WebhookTestSupport.Crear(db).ProcesarAsync("pasarela1", request);
        Assert.Equal(fecha.UtcDateTime, (await db.Pagos.SingleAsync(p => p.IdExterno == request.IdPago)).FechaAcreditacion);
    }

    [Fact]
    public async Task ReferenciaDesconocida_NoEncontrado()
    {
        await Assert.ThrowsAsync<NotFoundException>(() => WebhookTestSupport.Crear(db)
            .ProcesarAsync("pasarela1", WebhookTestSupport.Pedido() with { ReferenciaExterna = "PAG-noexiste", IdCuotas = null }));
        Assert.Equal(1, await db.Pagos.CountAsync());
    }

    [Fact]
    public async Task ReferenciaAsociadaAOtroExterno_NoReemplazaIdentificador()
    {
        var request = WebhookTestSupport.Pedido(importe: 1);
        await WebhookTestSupport.Crear(db).ProcesarAsync("pasarela1", request);
        var pago = await db.Pagos.SingleAsync(p => p.IdExterno == request.IdPago);
        await Assert.ThrowsAsync<BusinessRuleException>(() => WebhookTestSupport.Crear(db)
            .ProcesarAsync("pasarela1", request with { IdPago = "OTRO", ReferenciaExterna = pago.Numero, IdCuotas = null }));
        Assert.Equal(request.IdPago, pago.IdExterno);
        Assert.Equal(EstadoPago.Pendiente, pago.Estado);
    }

    [Fact]
    public async Task ConciliarConInstanciaObsoleta_RecargaDentroDelLock()
    {
        var request = WebhookTestSupport.Pedido(importe: 1);
        await WebhookTestSupport.Crear(db).ProcesarAsync("pasarela1", request);
        await using var otro = fixture.CreateContext();
        var obsoleto = await otro.Pagos.SingleAsync(p => p.IdExterno == request.IdPago);
        await WebhookTestSupport.Crear(db).ProcesarAsync("pasarela1", request with { Importe = obsoleto.ImporteTotal });
        Assert.Equal(EstadoPago.Pendiente, obsoleto.Estado);
        await WebhookTestSupport.Crear(otro).AplicarResultadoAsync(obsoleto, "APROBADO", obsoleto.ImporteTotal);
        Assert.Equal(EstadoPago.Aprobado, obsoleto.Estado);
        Assert.Equal(1, await otro.Facturas.CountAsync(f => f.PagoId == obsoleto.Id));
    }

    [Fact]
    public async Task MasDe50Cuotas_RechazaAntesDeConsultar()
    {
        await Assert.ThrowsAsync<BusinessRuleException>(() => WebhookTestSupport.Crear(db)
            .ProcesarAsync("pasarela1", WebhookTestSupport.Pedido() with { IdCuotas = Enumerable.Range(0, 51).Select(_ => Guid.NewGuid()).ToArray() }));
        Assert.Equal(1, await db.Pagos.CountAsync());
    }

    [Fact]
    public async Task DiscrepanciaDeImporteEnConfirmacion_UnSoloLogSinPagar()
    {
        var request = WebhookTestSupport.Pedido();
        var log = new RegistroLog<WebhookPagoService>();
        await WebhookTestSupport.Crear(db, true, new ConfirmadorImporte(request), logger: log).ProcesarAsync("pasarela1", request);
        Assert.Single(log.Entradas);
        Assert.Contains("PAGO_IMPORTE_NO_COINCIDE", log.Entradas[0].Texto);
        Assert.Equal(EstadoCuota.Pendiente, (await db.Cuotas.FindAsync(SeedData.CuotaId(2)))!.Estado);
    }

    [Theory]
    [InlineData("RECHAZADO")]
    [InlineData("CANCELADO")]
    public async Task ConfirmacionDeRechazo_ElImporteNoImpideRechazar(string estado)
    {
        var request = WebhookTestSupport.Pedido(estado);
        await WebhookTestSupport.Crear(db, true, new ConfirmadorImporte(request)).ProcesarAsync("pasarela1", request);
        Assert.Equal(EstadoPago.Rechazado, (await db.Pagos.SingleAsync(p => p.IdExterno == request.IdPago)).Estado);
        Assert.Equal(EstadoCuota.Pendiente, (await db.Cuotas.FindAsync(SeedData.CuotaId(2)))!.Estado);
        Assert.Empty(await db.Facturas.ToListAsync());
    }

    private sealed class ConfirmadorImporte(PasarelaWebhookRequest request) : IPasarelaResolver, IPasarelaService
    {
        public IPasarelaService Obtener(string proveedor) => this;
        public Task<PasarelaPagoResponse> ConsultarPagoAsync(string idPago, CancellationToken ct) =>
            Task.FromResult(new PasarelaPagoResponse(idPago, request.ReferenciaExterna, request.Estado, 1, request.Fecha.UtcDateTime, null));
        public Task<PasarelaCrearPagoResponse> CrearPagoAsync(PasarelaCrearPagoRequest request, CancellationToken ct) => throw new NotSupportedException();
    }

    private sealed class Confirmador(PasarelaWebhookRequest request, bool coincide) : IPasarelaResolver, IPasarelaService
    {
        public int Llamadas { get; private set; }
        public IPasarelaService Obtener(string proveedor) => this;
        public Task<PasarelaPagoResponse> ConsultarPagoAsync(string idPago, CancellationToken ct)
        {
            Llamadas++;
            return Task.FromResult(new PasarelaPagoResponse(idPago, request.ReferenciaExterna,
                coincide ? request.Estado : "PENDIENTE", request.Importe, request.Fecha.UtcDateTime, null));
        }
        public Task<PasarelaCrearPagoResponse> CrearPagoAsync(PasarelaCrearPagoRequest request, CancellationToken ct) =>
            throw new NotSupportedException();
    }
}
