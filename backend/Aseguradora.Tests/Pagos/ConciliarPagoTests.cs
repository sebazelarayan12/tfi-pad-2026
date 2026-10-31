using Aseguradora.Application.Dtos;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.External;
using Aseguradora.Data;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Tests.Data;
using Microsoft.EntityFrameworkCore;

namespace Aseguradora.Tests.Pagos;

public sealed class ConciliarPagoTests : IDisposable
{
    private readonly SqliteDbFixture fixture = new();
    private readonly AseguradoraDbContext db;
    private readonly PasarelaFalsa pasarela = new();
    public ConciliarPagoTests() => db = fixture.CreateContext();
    public void Dispose() { db.Dispose(); fixture.Dispose(); }

    private async Task<Pago> AgregarPagoAsync(MedioPago medio = MedioPago.Pasarela)
    {
        var cuota = (await db.Cuotas.FindAsync(SeedData.CuotaId(2)))!;
        var pago = Pago.CrearPendiente(SeedData.ClienteId, "PAG-abcdef", medio, [cuota], DateTime.UtcNow,
            medio == MedioPago.Pasarela ? "pasarela1" : null);
        pago.IdExterno = "PSR-prueba";
        db.Pagos.Add(pago);
        await db.SaveChangesAsync();
        return pago;
    }

    [Fact]
    public async Task AprobadoEnPasarela_ApruebaPagaYFacturaUnaVez()
    {
        var pago = await AgregarPagoAsync();
        pasarela.Estado = "APROBADO";
        var servicio = ServiciosPagoDePrueba.Crear(db, pasarela: pasarela);
        var respuesta = await servicio.ConciliarAsync(pago.Id);
        Assert.Equal("APROBADO", respuesta.Estado);
        Assert.Equal("AUTORIZADA", respuesta.Factura?.Estado);
        Assert.Equal(pasarela.Fecha, respuesta.FechaAcreditacion);
        Assert.Equal(EstadoCuota.Pagada, (await db.Cuotas.FindAsync(SeedData.CuotaId(2)))!.Estado);
        await servicio.ConciliarAsync(pago.Id);
        Assert.Equal(1, pasarela.Llamadas);
        Assert.Equal(1, await db.Facturas.CountAsync(f => f.PagoId == pago.Id));
    }

    [Fact]
    public async Task PendienteEnPasarela_ConservaPagoYCuotas()
    {
        var pago = await AgregarPagoAsync();
        var respuesta = await ServiciosPagoDePrueba.Crear(db, pasarela: pasarela).ConciliarAsync(pago.Id);
        Assert.Equal("PENDIENTE", respuesta.Estado);
        Assert.Null(respuesta.Factura);
        Assert.Equal(EstadoCuota.Pendiente, (await db.Cuotas.FindAsync(SeedData.CuotaId(2)))!.Estado);
        Assert.Equal(1, pasarela.Llamadas);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task PagoFinalizado_NoConsultaLaPasarela(bool aprobado)
    {
        var pago = await AgregarPagoAsync();
        if (aprobado) pago.Aprobar(DateTime.UtcNow); else pago.Rechazar();
        await db.SaveChangesAsync();
        var respuesta = await ServiciosPagoDePrueba.Crear(db, pasarela: pasarela).ConciliarAsync(pago.Id);
        Assert.Equal(aprobado ? "APROBADO" : "RECHAZADO", respuesta.Estado);
        Assert.Equal(0, pasarela.Llamadas);
    }

    [Fact]
    public async Task Caja_NoPermiteConciliacion()
    {
        var pago = await AgregarPagoAsync(MedioPago.Caja);
        await Assert.ThrowsAsync<BusinessRuleException>(() => ServiciosPagoDePrueba.Crear(db, pasarela: pasarela).ConciliarAsync(pago.Id));
        Assert.Equal(0, pasarela.Llamadas);
    }

    [Fact]
    public async Task Inexistente_NoEncontrado()
    {
        await Assert.ThrowsAsync<NotFoundException>(() => ServiciosPagoDePrueba.Crear(db, pasarela: pasarela).ConciliarAsync(Guid.NewGuid()));
        Assert.Equal(0, pasarela.Llamadas);
    }

    [Fact]
    public async Task SinIdExterno_NoConsulta()
    {
        var pago = await AgregarPagoAsync();
        pago.IdExterno = null;
        await db.SaveChangesAsync();
        await Assert.ThrowsAsync<BusinessRuleException>(() => ServiciosPagoDePrueba.Crear(db, pasarela: pasarela).ConciliarAsync(pago.Id));
        Assert.Equal(0, pasarela.Llamadas);
    }

    [Theory]
    [InlineData("RECHAZADO")]
    [InlineData("CANCELADO")]
    public async Task ResultadoNegativo_RechazaSinPagarCuotas(string estado)
    {
        var pago = await AgregarPagoAsync();
        pasarela.Estado = estado;
        var respuesta = await ServiciosPagoDePrueba.Crear(db, pasarela: pasarela).ConciliarAsync(pago.Id);
        Assert.Equal("RECHAZADO", respuesta.Estado);
        Assert.Null(respuesta.Factura);
        Assert.Equal(EstadoCuota.Pendiente, (await db.Cuotas.FindAsync(SeedData.CuotaId(2)))!.Estado);
    }

    [Fact]
    public async Task ImporteDistinto_NoAprueba()
    {
        var pago = await AgregarPagoAsync();
        pasarela.Estado = "APROBADO";
        pasarela.Importe = 1;
        var respuesta = await ServiciosPagoDePrueba.Crear(db, pasarela: pasarela).ConciliarAsync(pago.Id);
        Assert.Equal("PENDIENTE", respuesta.Estado);
        Assert.Null(respuesta.Factura);
        Assert.Equal(EstadoCuota.Pendiente, (await db.Cuotas.FindAsync(SeedData.CuotaId(2)))!.Estado);
    }

    [Fact]
    public async Task RespuestaDeOtroPago_NoAplica()
    {
        var pago = await AgregarPagoAsync();
        pasarela.IdRespuesta = "OTRO";
        await Assert.ThrowsAsync<ExternalServiceException>(() => ServiciosPagoDePrueba.Crear(db, pasarela: pasarela).ConciliarAsync(pago.Id));
        Assert.Equal(EstadoPago.Pendiente, pago.Estado);
    }

    [Fact]
    public async Task WebhookDuranteConsulta_NoDuplicaFactura()
    {
        var pago = await AgregarPagoAsync();
        pasarela.Estado = "APROBADO";
        pasarela.AntesDeResponder = async () =>
        {
            await using var otro = fixture.CreateContext();
            await WebhookTestSupport.Crear(otro).ProcesarAsync("pasarela1", WebhookTestSupport.Pedido() with
            { IdPago = pago.IdExterno!, ReferenciaExterna = pago.Numero, IdCuotas = null });
        };
        var respuesta = await ServiciosPagoDePrueba.Crear(db, pasarela: pasarela).ConciliarAsync(pago.Id);
        Assert.Equal("APROBADO", respuesta.Estado);
        Assert.Equal(1, await db.Facturas.CountAsync(f => f.PagoId == pago.Id));
    }

    [Theory]
    [InlineData("DESCONOCIDO", 12000)]
    [InlineData("APROBADO", 0)]
    [InlineData("RECHAZADO", -1)]
    [InlineData("PENDIENTE", 0)]
    public async Task ContratoInvalidoDePasarela_ErrorExternoSinModificar(string estado, int importe)
    {
        var pago = await AgregarPagoAsync();
        pasarela.Estado = estado;
        pasarela.Importe = importe;
        await Assert.ThrowsAsync<ExternalServiceException>(() => ServiciosPagoDePrueba.Crear(db, pasarela: pasarela).ConciliarAsync(pago.Id));
        Assert.Equal(EstadoPago.Pendiente, pago.Estado);
        Assert.Equal(EstadoCuota.Pendiente, (await db.Cuotas.FindAsync(SeedData.CuotaId(2)))!.Estado);
        Assert.Empty(await db.Facturas.ToListAsync());
    }

    [Fact]
    public async Task ReferenciaDeOtroPago_ErrorExternoSinAplicar()
    {
        var pago = await AgregarPagoAsync();
        pasarela.Referencia = "PAG-OTRO";
        await Assert.ThrowsAsync<ExternalServiceException>(() => ServiciosPagoDePrueba.Crear(db, pasarela: pasarela).ConciliarAsync(pago.Id));
        Assert.Equal(EstadoPago.Pendiente, pago.Estado);
    }

    [Fact]
    public async Task ArcaCaido_ConservaAprobacionYFacturaPendiente()
    {
        var pago = await AgregarPagoAsync();
        pasarela.Estado = "APROBADO";
        var respuesta = await ServiciosPagoDePrueba.Crear(db, fallaArca: true, pasarela: pasarela).ConciliarAsync(pago.Id);
        Assert.Equal("APROBADO", respuesta.Estado);
        Assert.Equal("PENDIENTE_CAE", respuesta.Factura?.Estado);
        Assert.Null(respuesta.Factura!.Cae);
        Assert.Equal(EstadoCuota.Pagada, (await db.Cuotas.FindAsync(SeedData.CuotaId(2)))!.Estado);
        Assert.Equal(1, await db.Facturas.CountAsync(f => f.PagoId == pago.Id));
    }

    private sealed class PasarelaFalsa : IPasarelaResolver, IPasarelaService
    {
        public int Llamadas { get; private set; }
        public string Estado { get; set; } = "PENDIENTE";
        public decimal Importe { get; set; } = 12000;
        public string? IdRespuesta { get; set; }
        public string Referencia { get; set; } = "PAG-abcdef";
        public Func<Task>? AntesDeResponder { get; set; }
        public DateTime Fecha { get; } = new(2026, 10, 31, 3, 0, 0, DateTimeKind.Utc);
        public IPasarelaService Obtener(string proveedor) => this;
        public async Task<PasarelaPagoResponse> ConsultarPagoAsync(string idPago, CancellationToken ct)
        {
            Llamadas++;
            if (AntesDeResponder is not null) await AntesDeResponder();
            return new PasarelaPagoResponse(IdRespuesta ?? idPago, Referencia, Estado, Importe, Fecha, null);
        }
        public Task<PasarelaCrearPagoResponse> CrearPagoAsync(PasarelaCrearPagoRequest request, CancellationToken ct) =>
            throw new NotSupportedException();
    }
}
