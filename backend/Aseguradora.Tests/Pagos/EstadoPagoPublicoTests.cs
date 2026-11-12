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
using Aseguradora.Tests.Data;
using Microsoft.EntityFrameworkCore;

namespace Aseguradora.Tests.Pagos;

/// <summary>Estado público del pago (PB-01): DNI + número de pago, conciliando el pago de pasarela pendiente.</summary>
public sealed class EstadoPagoPublicoTests : IDisposable
{
    private const string Dni = "30123456";
    private const string NumeroPoliza = "POL-0000001";
    private const int ReservaMinutos = 60;

    private readonly SqliteDbFixture _fixture = new();
    private readonly AseguradoraDbContext _db;
    private readonly PasarelaConfigurable _pasarela = new();
    private readonly RelojMovil _reloj = new(new DateTimeOffset(2026, 10, 29, 15, 0, 0, TimeSpan.Zero));
    private readonly PagoService _servicio;

    public EstadoPagoPublicoTests()
    {
        _db = _fixture.CreateContext();
        var opciones = new PagoOnlineOpciones
        {
            UrlBaseApi = "https://api.example.com/",
            UrlRetornoExito = "https://web.example.com/pago/exito",
            UrlRetornoError = "https://web.example.com/pago/error",
            ReservaMinutos = ReservaMinutos
        };
        var verificador = new VerificadorPublico(
            new EfRepository<Cliente>(_db), new EfRepository<Poliza>(_db), new EfRepository<Pago>(_db));
        _servicio = new PagoService(
            verificador, new EfRepository<Cuota>(_db), new EfRepository<Cliente>(_db),
            new EfRepository<Pago>(_db), _pasarela, new UnitOfWork(_db), opciones, _reloj,
            new EfRepository<Poliza>(_db), new EfRepository<Factura>(_db), ServiciosPagoDePrueba.CrearAprobacion(_db),
            WebhookTestSupport.Crear(_db));
    }

    public void Dispose()
    {
        _db.Dispose();
        _fixture.Dispose();
    }

    private async Task<PagoPublicoResponse> IniciarAsync() => await _servicio.IniciarPagoOnlineAsync(new PagoPublicoRequest
    {
        Dni = Dni,
        NumeroPoliza = NumeroPoliza,
        CuotaIds = [SeedData.CuotaId(2)],
        Proveedor = "pasarela1"
    });

    private Task<EstadoPagoPublicoResponse> ConsultarAsync(string numeroPago, string dni = Dni) =>
        _servicio.ConsultarEstadoPublicoAsync(new PublicoEstadoPagoRequest { Dni = dni, NumeroPago = numeroPago });

    private Pago Guardado(string numero) => _db.Pagos.AsNoTracking().Single(p => p.Numero == numero);

    [Fact]
    public async Task Pendiente_ConsultaLaPasarelaYDevuelveElLink()
    {
        var iniciado = await IniciarAsync();

        var estado = await ConsultarAsync(iniciado.NumeroPago);

        Assert.Equal(1, _pasarela.Consultas);
        Assert.Equal(iniciado.NumeroPago, estado.NumeroPago);
        Assert.Equal("PENDIENTE", estado.Estado);
        Assert.Equal(iniciado.UrlPago, estado.UrlPago);
        Assert.Null(estado.FechaAcreditacion);
        Assert.Null(estado.Factura);
    }

    [Fact]
    public async Task PasarelaAprobo_AplicaElPagoYDevuelveAprobadoConFactura()
    {
        var iniciado = await IniciarAsync();
        _pasarela.Estado = "APROBADO";
        _pasarela.Importe = Guardado(iniciado.NumeroPago).ImporteTotal;

        var estado = await ConsultarAsync(iniciado.NumeroPago);

        Assert.Equal("APROBADO", estado.Estado);
        Assert.Null(estado.UrlPago);
        Assert.NotNull(estado.FechaAcreditacion);
        Assert.Equal(DateTimeKind.Utc, estado.FechaAcreditacion!.Value.Kind);
        Assert.NotNull(estado.Factura);
        Assert.Equal(EstadoPago.Aprobado, Guardado(iniciado.NumeroPago).Estado);
    }

    [Fact]
    public async Task PasarelaCancelo_DevuelveRechazadoSinLink()
    {
        var iniciado = await IniciarAsync();
        _pasarela.Estado = "CANCELADO";

        var estado = await ConsultarAsync(iniciado.NumeroPago);

        Assert.Equal("RECHAZADO", estado.Estado);
        Assert.Null(estado.UrlPago);
        Assert.Equal(EstadoPago.Rechazado, Guardado(iniciado.NumeroPago).Estado);
    }

    [Theory]
    [InlineData(typeof(ExternalServiceException))]
    [InlineData(typeof(ServicioNoDisponibleException))]
    [InlineData(typeof(NotFoundException))]
    public async Task PasarelaFalla_DevuelveElEstadoGuardadoSinError(Type excepcion)
    {
        var iniciado = await IniciarAsync();
        _pasarela.Falla = (Exception)Activator.CreateInstance(excepcion, "falla de prueba")!;

        var estado = await ConsultarAsync(iniciado.NumeroPago);

        Assert.Equal("PENDIENTE", estado.Estado);
        Assert.Equal(EstadoPago.Pendiente, Guardado(iniciado.NumeroPago).Estado);
    }

    [Fact]
    public async Task YaResuelto_NoConsultaLaPasarela()
    {
        var iniciado = await IniciarAsync();
        _pasarela.Estado = "CANCELADO";
        await ConsultarAsync(iniciado.NumeroPago);

        var estado = await ConsultarAsync(iniciado.NumeroPago);

        Assert.Equal("RECHAZADO", estado.Estado);
        Assert.Equal(1, _pasarela.Consultas);
    }

    [Fact]
    public async Task PendienteFueraDeLaReserva_NoDevuelveElLink()
    {
        var iniciado = await IniciarAsync();
        _reloj.Avanzar(TimeSpan.FromMinutes(ReservaMinutos + 1));

        var estado = await ConsultarAsync(iniciado.NumeroPago);

        Assert.Equal("PENDIENTE", estado.Estado);
        Assert.Null(estado.UrlPago);
    }

    [Theory]
    [InlineData("99999999", null)]
    [InlineData(Dni, "PAG-ffffff")]
    public async Task DniONumeroQueNoCoinciden_404Generico(string dni, string? numero)
    {
        var iniciado = await IniciarAsync();

        var ex = await Assert.ThrowsAsync<NotFoundException>(() => ConsultarAsync(numero ?? iniciado.NumeroPago, dni));

        Assert.Equal(VerificadorPublico.MensajeNoEncontrado, ex.Message);
        Assert.Equal(0, _pasarela.Consultas);
    }

    [Fact]
    public async Task PagoDeCaja_NoConsultaLaPasarela()
    {
        // The seed's PAG-000001 belongs to the same client and is not a gateway payment.
        var estado = await ConsultarAsync("PAG-000001");

        Assert.Equal(0, _pasarela.Consultas);
        Assert.Null(estado.UrlPago);
    }

    private sealed class RelojMovil(DateTimeOffset inicio) : TimeProvider
    {
        private DateTimeOffset _ahora = inicio;
        public void Avanzar(TimeSpan lapso) => _ahora += lapso;
        public override DateTimeOffset GetUtcNow() => _ahora;
    }

    private sealed class PasarelaConfigurable : IPasarelaResolver, IPasarelaService
    {
        public string Estado { get; set; } = "PENDIENTE";
        public decimal? Importe { get; set; }
        public Exception? Falla { get; set; }
        public int Consultas { get; private set; }

        public IPasarelaService Obtener(string proveedor) => this;

        public Task<PasarelaCrearPagoResponse> CrearPagoAsync(PasarelaCrearPagoRequest request, CancellationToken ct)
        {
            var id = $"LNK-{request.ReferenciaExterna}";
            return Task.FromResult(new PasarelaCrearPagoResponse(
                id, "PENDIENTE", $"https://padi.example/checkout/{id}", DateTime.UtcNow.AddMinutes(50)));
        }

        public Task<PasarelaPagoResponse> ConsultarPagoAsync(string idPago, CancellationToken ct)
        {
            Consultas++;
            if (Falla is not null) throw Falla;
            return Task.FromResult(new PasarelaPagoResponse(
                idPago, null, Estado, Importe ?? 1m, new DateTime(2026, 10, 29, 15, 5, 0, DateTimeKind.Utc), "Card"));
        }
    }
}
