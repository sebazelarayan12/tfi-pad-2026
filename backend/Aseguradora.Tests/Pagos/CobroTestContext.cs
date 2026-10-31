using Aseguradora.Application.Dtos;
using Aseguradora.Application.External;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.Services;
using Aseguradora.Data;
using Aseguradora.Data.Repositories;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Interfaces;
using Aseguradora.Tests.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace Aseguradora.Tests.Pagos;

internal sealed class CobroTestContext : IDisposable
{
    private readonly SqliteDbFixture fixture = new();
    public AseguradoraDbContext Db { get; }
    public ArcaFake Arca { get; } = new();
    public ActualizadorFake Actualizador { get; }
    public FacturacionService Facturacion { get; }
    public AprobacionPagoService Aprobacion { get; }
    public Pago Pago { get; }
    public RegistroLog<FacturacionService> Log { get; } = new();
    public FacturacionOpciones Opciones { get; } = new("30712345678", 1);

    public CobroTestContext(IEmisorFacturaAislado? emisorAislado = null)
    {
        Db = fixture.CreateContext();
        var cuota = Db.Cuotas.First(c => c.Estado == EstadoCuota.Pendiente);
        cuota.Importe = 51250m;
        cuota.Recargo = 0;
        Pago = Pago.CrearPendiente(SeedData.ClienteId, "PAG-TEST", MedioPago.Caja, [cuota], DateTime.UtcNow);
        Db.Pagos.Add(Pago);
        Db.SaveChanges();
        Actualizador = new(Db);
        var uow = new UnitOfWork(Db);
        Facturacion = new(new EfRepository<Pago>(Db), new EfRepository<Cuota>(Db),
            new EfRepository<Poliza>(Db), new EfRepository<Cliente>(Db), new EfRepository<Factura>(Db),
            uow, Arca, Opciones, TimeProvider.System, Log, emisorAislado);
        Arca.AntesDeEmitir = () => Assert.NotEmpty(Actualizador.Llamadas);
        Aprobacion = new(new EfRepository<Cuota>(Db), new EfRepository<Poliza>(Db), uow,
            Actualizador, Facturacion, NullLogger<AprobacionPagoService>.Instance, new EfRepository<Factura>(Db));
    }

    public void Dispose() { Db.Dispose(); fixture.Dispose(); }

    internal sealed class ActualizadorFake(AseguradoraDbContext db) : IActualizadorEstadoPoliza
    {
        public bool Fallar { get; set; }
        public List<Guid> Llamadas { get; } = [];
        public async Task ReevaluarAsync(Guid polizaId, CancellationToken ct)
        {
            Assert.All(db.ChangeTracker.Entries<Cuota>().Where(e => e.Entity.PagoCuotas.Any(p => p.Pago.Numero == "PAG-TEST")),
                e => Assert.Equal(EstadoCuota.Pagada, e.Entity.Estado));
            if (Fallar) throw new InvalidOperationException("Fallo de póliza simulado.");
            Llamadas.Add(polizaId);
            await new ActualizadorEstadoPoliza(new EfRepository<Poliza>(db), new EfRepository<Cuota>(db))
                .ReevaluarAsync(polizaId, ct);
        }
    }

    internal sealed class ArcaFake : IArcaService
    {
        public Action? AntesDeEmitir { get; set; }
        public string Estado { get; set; } = "APROBADA";
        public string Cae { get; set; } = "74123456789012";
        public int Llamadas { get; private set; }
        public bool Fallar { get; set; }
        public ArcaFacturaRequest? Request { get; private set; }
        public Task<ArcaFacturaResponse> EmitirFacturaAsync(ArcaFacturaRequest request, CancellationToken ct)
        {
            AntesDeEmitir?.Invoke();
            Llamadas++;
            Request = request;
            if (Fallar) throw new ExternalServiceException("ARCA no disponible.");
            return Task.FromResult(new ArcaFacturaResponse("0001-00000001", Cae,
                request.FechaEmision.AddDays(10), Estado, null));
        }
        public Task<ArcaFacturaResponse> ConsultarFacturaAsync(string numeroComprobante, CancellationToken ct)
            => throw new NotSupportedException();
    }
}
