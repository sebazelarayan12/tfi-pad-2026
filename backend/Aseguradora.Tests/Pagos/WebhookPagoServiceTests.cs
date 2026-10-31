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
    [InlineData("RECHAZADO")]
    [InlineData("CANCELADO")]
    public async Task NoAprobado_RechazaSinPagarCuotas(string estado)
    {
        var request = WebhookTestSupport.Pedido(estado);
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
    }

    [Fact]
    public async Task ResultadoPendienteParaConciliacion_NoRechazaElPago()
    {
        var cuota = (await db.Cuotas.FindAsync(SeedData.CuotaId(2)))!;
        var pago = Aseguradora.Domain.Entities.Pago.CrearPendiente(SeedData.ClienteId, "PAG-abcdef", MedioPago.Pasarela,
            [cuota], DateTime.UtcNow, "pasarela1");
        await WebhookTestSupport.Crear(db).AplicarResultadoAsync(pago, "PENDIENTE", pago.ImporteTotal);
        Assert.Equal(EstadoPago.Pendiente, pago.Estado);
        Assert.Equal(EstadoCuota.Pendiente, cuota.Estado);
        Assert.Empty(await db.Facturas.ToListAsync());
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
