using System.Text.RegularExpressions;
using Aseguradora.Application.Dtos;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.External;
using Aseguradora.Application.Publico;
using Aseguradora.Application.Services;
using Aseguradora.Data;
using Aseguradora.Data.Repositories;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Tests.Builders;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Support;
using Microsoft.EntityFrameworkCore;

namespace Aseguradora.Tests.Pagos;

public sealed class PagoOnlineServiceTests : IDisposable
{
    private const string Dni = "30123456";
    private const string NumeroPoliza = "POL-0000001";
    private static readonly DateTimeOffset Ahora = new(2026, 10, 29, 15, 0, 0, TimeSpan.Zero);

    private readonly SqliteDbFixture _fixture = new();
    private readonly AseguradoraDbContext _db;
    private readonly PasarelaFake _pasarela = new();
    private readonly PagoService _servicio;

    public PagoOnlineServiceTests()
    {
        _db = _fixture.CreateContext();
        var opciones = new PagoOnlineOpciones
        {
            UrlBaseApi = "https://api.example.com/",
            UrlRetornoExito = "https://web.example.com/pago/exito",
            UrlRetornoError = "https://web.example.com/pago/error",
            ReservaMinutos = 60
        };
        var verificador = new VerificadorPublico(
            new EfRepository<Cliente>(_db), new EfRepository<Poliza>(_db), new EfRepository<Pago>(_db));
        _servicio = new PagoService(
            verificador, new EfRepository<Cuota>(_db), new EfRepository<Cliente>(_db),
            new EfRepository<Pago>(_db), _pasarela, new UnitOfWork(_db), opciones, new RelojFalso(Ahora));
    }

    public void Dispose()
    {
        _db.Dispose();
        _fixture.Dispose();
    }

    private static PagoPublicoRequest Pedido(
        IEnumerable<Guid> cuotaIds, string proveedor = "pasarela1", string dni = Dni, string poliza = NumeroPoliza) =>
        new()
        {
            Dni = dni,
            NumeroPoliza = poliza,
            CuotaIds = cuotaIds.ToList(),
            Proveedor = proveedor
        };

    private static Guid[] Cuotas(params int[] numeros) => numeros.Select(SeedData.CuotaId).ToArray();

    private Pago PagoCreado() => _db.Pagos.AsNoTracking().Single(p => p.Numero != "PAG-000001");

    [Fact]
    public async Task IniciarPago_CuotasValidas_CreaPagoPendienteConIdExterno()
    {
        var respuesta = await _servicio.IniciarPagoOnlineAsync(Pedido(Cuotas(2, 3)));

        Assert.Matches(new Regex("^PAG-[0-9a-f]{6}$"), respuesta.NumeroPago);
        Assert.Equal($"https://pasarela.example/checkout/{respuesta.NumeroPago}", respuesta.UrlPago);
        Assert.Equal(Ahora.UtcDateTime.AddHours(1), respuesta.FechaExpiracion);
        var pago = PagoCreado();
        Assert.Equal(pago.Id, respuesta.IdPago);
        Assert.Equal(EstadoPago.Pendiente, pago.Estado);
        Assert.Equal(MedioPago.Pasarela, pago.Medio);
        Assert.Equal("pasarela1", pago.Proveedor);
        Assert.Equal($"PSR-{respuesta.NumeroPago}", pago.IdExterno);
        Assert.Equal(respuesta.UrlPago, pago.LinkPago);
        Assert.Equal(Ahora.UtcDateTime, pago.FechaCreacion);
    }

    [Fact]
    public async Task IniciarPago_ImporteEsLaSumaDeImporteMasRecargo()
    {
        var cuota2 = _db.Cuotas.Single(c => c.Id == SeedData.CuotaId(2));
        var cuota3 = _db.Cuotas.Single(c => c.Id == SeedData.CuotaId(3));
        cuota2.Importe = 25000m;
        cuota2.Recargo = 0m;
        cuota3.Importe = 25000m;
        cuota3.Recargo = 1250m;
        await _db.SaveChangesAsync();

        await _servicio.IniciarPagoOnlineAsync(Pedido(Cuotas(2, 3)));

        var pago = _db.Pagos.AsNoTracking().Include(p => p.PagoCuotas).Single(p => p.Numero != "PAG-000001");
        Assert.Equal(51250m, pago.ImporteTotal);
        Assert.Equal(51250m, _pasarela.Request!.Importe);
        Assert.Equal(2, pago.PagoCuotas.Count);
        Assert.Equal(51250m, pago.PagoCuotas.Sum(c => c.Importe));
    }

    [Fact]
    public async Task IniciarPago_ArmaLaUrlDeNotificacionYElPagador()
    {
        var respuesta = await _servicio.IniciarPagoOnlineAsync(Pedido(Cuotas(2), "pasarela2"));

        Assert.Equal("pasarela2", _pasarela.ProveedorSolicitado);
        var pedido = _pasarela.Request!;
        Assert.Equal("https://api.example.com/api/webhooks/pasarela/pasarela2", pedido.UrlNotificacion);
        Assert.Equal("https://web.example.com/pago/exito", pedido.UrlRetornoExito);
        Assert.Equal("https://web.example.com/pago/error", pedido.UrlRetornoError);
        Assert.Equal(respuesta.NumeroPago, pedido.ReferenciaExterna);
        Assert.Equal(Dni, pedido.Pagador.Dni);
        Assert.Equal("Juan Carlos Pérez", pedido.Pagador.Nombre);
        Assert.False(string.IsNullOrWhiteSpace(pedido.Pagador.Email));
    }

    [Fact]
    public async Task IniciarPago_CuotaDeOtraPoliza_LanzaBusinessRuleException()
    {
        var cliente = _db.Clientes.Single(c => c.Id == SeedData.ClienteId);
        var plan = _db.Planes.Single(p => p.Id == SeedData.PlanRcId);
        // One policy per vehicle (unique index), so the other policy needs its own vehicle.
        var otroVehiculo = new VehiculoBuilder().DeCliente(cliente).Construir();
        var otraPoliza = new PolizaBuilder().Para(cliente, otroVehiculo, plan).Construir();
        var cuotaAjena = new CuotaBuilder().DePoliza(otraPoliza).Construir();
        _db.Vehiculos.Add(otroVehiculo);
        _db.Polizas.Add(otraPoliza);
        _db.Cuotas.Add(cuotaAjena);
        await _db.SaveChangesAsync();

        await Assert.ThrowsAsync<BusinessRuleException>(
            () => _servicio.IniciarPagoOnlineAsync(Pedido([SeedData.CuotaId(2), cuotaAjena.Id])));

        Assert.Equal(0, _pasarela.Llamadas);
    }

    [Fact]
    public async Task IniciarPago_CuotaInexistente_LanzaBusinessRuleException()
    {
        await Assert.ThrowsAsync<BusinessRuleException>(
            () => _servicio.IniciarPagoOnlineAsync(Pedido([SeedData.CuotaId(2), Guid.NewGuid()])));
    }

    [Fact]
    public async Task IniciarPago_CuotaAnulada_LanzaBusinessRuleException()
    {
        _db.Cuotas.Single(c => c.Id == SeedData.CuotaId(2)).Estado = EstadoCuota.Anulada;
        await _db.SaveChangesAsync();

        await Assert.ThrowsAsync<BusinessRuleException>(() => _servicio.IniciarPagoOnlineAsync(Pedido(Cuotas(2))));

        Assert.Equal(0, _pasarela.Llamadas);
    }

    [Fact]
    public async Task IniciarPago_CuotaPagada_LanzaBusinessRuleException()
    {
        // Installment 1 of the seed is Pagada.
        await Assert.ThrowsAsync<BusinessRuleException>(() => _servicio.IniciarPagoOnlineAsync(Pedido(Cuotas(1))));
    }

    [Fact]
    public async Task IniciarPago_CuotaVencida_SePuedePagar()
    {
        _db.Cuotas.Single(c => c.Id == SeedData.CuotaId(2)).Estado = EstadoCuota.Vencida;
        await _db.SaveChangesAsync();

        var respuesta = await _servicio.IniciarPagoOnlineAsync(Pedido(Cuotas(2)));

        Assert.StartsWith("PAG-", respuesta.NumeroPago);
    }

    [Fact]
    public async Task IniciarPago_CuotasRepetidas_LanzaBusinessRuleException()
    {
        await Assert.ThrowsAsync<BusinessRuleException>(
            () => _servicio.IniciarPagoOnlineAsync(Pedido([SeedData.CuotaId(2), SeedData.CuotaId(2)])));
    }

    [Fact]
    public async Task IniciarPago_CuotaConPagoPendienteEnCurso_LanzaBusinessRuleException()
    {
        await AgregarPagoAsync(EstadoPago.Pendiente, minutosAtras: 30, cuota: 2);

        await Assert.ThrowsAsync<BusinessRuleException>(() => _servicio.IniciarPagoOnlineAsync(Pedido(Cuotas(2, 3))));

        Assert.Equal(0, _pasarela.Llamadas);
    }

    [Fact]
    public async Task IniciarPago_PagoPendienteConReservaVencida_PermiteReintentar()
    {
        await AgregarPagoAsync(EstadoPago.Pendiente, minutosAtras: 61, cuota: 2);

        var respuesta = await _servicio.IniciarPagoOnlineAsync(Pedido(Cuotas(2)));

        Assert.StartsWith("PAG-", respuesta.NumeroPago);
    }

    [Fact]
    public async Task IniciarPago_PagoRechazadoReciente_PermiteReintentar()
    {
        await AgregarPagoAsync(EstadoPago.Rechazado, minutosAtras: 5, cuota: 2);

        var respuesta = await _servicio.IniciarPagoOnlineAsync(Pedido(Cuotas(2)));

        Assert.StartsWith("PAG-", respuesta.NumeroPago);
    }

    [Fact]
    public async Task IniciarPago_ProveedorDesconocido_LanzaBusinessRuleException()
    {
        await Assert.ThrowsAsync<BusinessRuleException>(
            () => _servicio.IniciarPagoOnlineAsync(Pedido(Cuotas(2), "pasarela3")));

        Assert.Equal(0, _pasarela.Llamadas);
    }

    [Fact]
    public async Task IniciarPago_DniDeOtroCliente_LanzaNotFoundConMensajeGenerico()
    {
        var error = await Assert.ThrowsAsync<NotFoundException>(
            () => _servicio.IniciarPagoOnlineAsync(Pedido(Cuotas(2), dni: "99999999")));

        Assert.Equal(VerificadorPublico.MensajeNoEncontrado, error.Message);
    }

    [Fact]
    public async Task IniciarPago_PolizaInexistente_LanzaElMismoMensajeGenerico()
    {
        var error = await Assert.ThrowsAsync<NotFoundException>(
            () => _servicio.IniciarPagoOnlineAsync(Pedido(Cuotas(2), poliza: "POL-0099999")));

        Assert.Equal(VerificadorPublico.MensajeNoEncontrado, error.Message);
    }

    [Fact]
    public async Task IniciarPago_PasarelaFalla_DejaElPagoRechazadoYLasCuotasSinCambios()
    {
        _pasarela.Fallar = true;

        await Assert.ThrowsAsync<ExternalServiceException>(() => _servicio.IniciarPagoOnlineAsync(Pedido(Cuotas(2, 3))));

        _db.ChangeTracker.Clear();
        var pago = PagoCreado();
        Assert.Equal(EstadoPago.Rechazado, pago.Estado);
        Assert.Null(pago.IdExterno);
        Assert.Null(pago.LinkPago);
        Assert.All(
            _db.Cuotas.AsNoTracking().Where(c => c.Id == SeedData.CuotaId(2) || c.Id == SeedData.CuotaId(3)),
            c => Assert.Equal(EstadoCuota.Pendiente, c.Estado));
    }

    [Fact]
    public async Task IniciarPago_ClienteSeDesconectaDuranteLaPasarela_DejaElPagoRechazado()
    {
        using var desconexion = new CancellationTokenSource();
        _pasarela.AlLlamar = () =>
        {
            desconexion.Cancel();
            throw new OperationCanceledException(desconexion.Token);
        };

        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => _servicio.IniciarPagoOnlineAsync(Pedido(Cuotas(2, 3)), desconexion.Token));

        _db.ChangeTracker.Clear();
        Assert.Equal(EstadoPago.Rechazado, PagoCreado().Estado);
    }

    [Fact]
    public async Task IniciarPago_ClienteSeDesconectaTrasAceptarLaPasarela_GuardaIdExternoYLink()
    {
        using var desconexion = new CancellationTokenSource();
        _pasarela.AlLlamar = desconexion.Cancel;

        var respuesta = await _servicio.IniciarPagoOnlineAsync(Pedido(Cuotas(2, 3)), desconexion.Token);

        _db.ChangeTracker.Clear();
        var pago = PagoCreado();
        Assert.Equal(EstadoPago.Pendiente, pago.Estado);
        Assert.NotNull(pago.IdExterno);
        Assert.Equal(respuesta.UrlPago, pago.LinkPago);
    }

    private async Task AgregarPagoAsync(EstadoPago estado, int minutosAtras, int cuota)
    {
        var cuotaEntidad = _db.Cuotas.Single(c => c.Id == SeedData.CuotaId(cuota));
        var pago = Pago.CrearPendiente(
            SeedData.ClienteId, "PAG-PREVIO", MedioPago.Pasarela, [cuotaEntidad],
            Ahora.UtcDateTime.AddMinutes(-minutosAtras), "pasarela1");
        if (estado == EstadoPago.Rechazado)
            pago.Rechazar();
        _db.Pagos.Add(pago);
        await _db.SaveChangesAsync();
    }

    private sealed class PasarelaFake : IPasarelaResolver, IPasarelaService
    {
        public bool Fallar { get; set; }
        public Action? AlLlamar { get; set; }
        public int Llamadas { get; private set; }
        public string? ProveedorSolicitado { get; private set; }
        public PasarelaCrearPagoRequest? Request { get; private set; }

        public IPasarelaService Obtener(string proveedor)
        {
            ProveedorSolicitado = proveedor;
            return this;
        }

        public Task<PasarelaCrearPagoResponse> CrearPagoAsync(PasarelaCrearPagoRequest request, CancellationToken ct)
        {
            Llamadas++;
            Request = request;
            AlLlamar?.Invoke();
            if (Fallar)
                throw new ExternalServiceException("Pasarela no disponible.");

            return Task.FromResult(new PasarelaCrearPagoResponse(
                $"PSR-{request.ReferenciaExterna}",
                "PENDIENTE",
                $"https://pasarela.example/checkout/{request.ReferenciaExterna}",
                Ahora.UtcDateTime.AddHours(1)));
        }

        public Task<PasarelaPagoResponse> ConsultarPagoAsync(string idPago, CancellationToken ct) =>
            throw new NotSupportedException();
    }
}
