using System.Linq.Expressions;
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
using Aseguradora.Domain.Interfaces;
using Aseguradora.Tests.Fixtures;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace Aseguradora.Tests.Pagos;

[Collection(SqlServerCollection.Nombre)]
public class ConcurrenciaCuotaTests(SqlServerContainerFixture fixture)
{
    [Fact(Skip = "SQLite no genera RowVersion. Ejecutar DosContextosCobrandoLaMismaCuotaSoloPersistenUnCobro con ASEGURADORA_TESTS_DOCKER=1; CI: concurrencia-sqlserver.")]
    public void SqliteNoSoportaRowVersion() { }

    [SkippableFact]
    public async Task DosContextosCobrandoLaMismaCuotaSoloPersistenUnCobro()
    {
        Skip.IfNot(fixture.Disponible, SqlServerContainerFixture.MotivoOmision);
        await using var primero = fixture.CrearContexto();
        await using var segundo = fixture.CrearContexto();
        var una = await primero.Cuotas.FirstAsync(c => c.Estado == EstadoCuota.Pendiente);
        var otra = await segundo.Cuotas.SingleAsync(c => c.Id == una.Id);
        var pago1 = Pago.CrearPendiente(SeedData.ClienteId, "PAG-" + Guid.NewGuid().ToString("N")[..6],
            MedioPago.Caja, [una], DateTime.UtcNow);
        var pago2 = Pago.CrearPendiente(SeedData.ClienteId, "PAG-" + Guid.NewGuid().ToString("N")[..6],
            MedioPago.Caja, [otra], DateTime.UtcNow);
        primero.Pagos.Add(pago1);
        segundo.Pagos.Add(pago2);
        var factura = new FacturacionFake();
        var servicio1 = new AprobacionPagoService(new EfRepository<Cuota>(primero),
            new EfRepository<Poliza>(primero), new UnitOfWork(primero),
            new ActualizadorEstadoPoliza(new EfRepository<Poliza>(primero), new EfRepository<Cuota>(primero)),
            factura, NullLogger<AprobacionPagoService>.Instance, new EfRepository<Factura>(primero));
        var servicio2 = new AprobacionPagoService(new EfRepository<Cuota>(segundo),
            new EfRepository<Poliza>(segundo), new UnitOfWork(segundo),
            new ActualizadorEstadoPoliza(new EfRepository<Poliza>(segundo), new EfRepository<Cuota>(segundo)),
            factura, NullLogger<AprobacionPagoService>.Instance, new EfRepository<Factura>(segundo));
        await servicio1.AprobarAsync(pago1, DateTime.UtcNow, default);
        var error = await Assert.ThrowsAsync<BusinessRuleException>(() => servicio2.AprobarAsync(pago2, DateTime.UtcNow, default));
        Assert.IsType<DbUpdateConcurrencyException>(error.InnerException);
        await using var lectura = fixture.CrearContexto();
        Assert.Equal(EstadoCuota.Pagada, (await lectura.Cuotas.SingleAsync(c => c.Id == una.Id)).Estado);
        Assert.False(await lectura.Pagos.AnyAsync(p => p.Id == pago2.Id));
        Assert.Equal(1, factura.Llamadas);
    }

    [SkippableFact]
    public async Task DosPedidosDeCajaParaLaMismaCuota_SoloUnoPersiste()
    {
        Skip.IfNot(fixture.Disponible, SqlServerContainerFixture.MotivoOmision);
        await using var primero = fixture.CrearContexto();
        await using var segundo = fixture.CrearContexto();
        var cuota = await primero.Cuotas.FirstAsync(c => c.Estado == EstadoCuota.Pendiente);
        // Ambos pedidos leyeron la misma versión antes de que el ganador guardara.
        await segundo.Cuotas.SingleAsync(c => c.Id == cuota.Id);
        var pedido = new PagoCajaRequest { CuotaIds = [cuota.Id] };
        var ganador = await ServiciosPagoDePrueba.Crear(primero).RegistrarCajaAsync(pedido);
        var error = await Assert.ThrowsAsync<BusinessRuleException>(() =>
            ServiciosPagoDePrueba.Crear(segundo).RegistrarCajaAsync(pedido));
        Assert.IsType<DbUpdateConcurrencyException>(error.InnerException);
        await using var lectura = fixture.CrearContexto();
        Assert.Equal(1, await lectura.PagoCuotas.CountAsync(pc => pc.CuotaId == cuota.Id));
        Assert.Equal(1, await lectura.Facturas.CountAsync(f => f.PagoId == ganador.Id));
        Assert.Equal(EstadoCuota.Pagada, (await lectura.Cuotas.FindAsync(cuota.Id))!.Estado);
    }

    [SkippableFact]
    public async Task DosPedidosDePagoOnlineParaLaMismaCuota_SoloUnoCreaElPago()
    {
        Skip.IfNot(fixture.Disponible, SqlServerContainerFixture.MotivoOmision);
        await using var primero = fixture.CrearContexto();
        await using var segundo = fixture.CrearContexto();
        var poliza = await primero.Polizas.SingleAsync(p => p.Numero == "POL-0000001");
        var cuotaId = (await primero.Cuotas.FirstAsync(c => c.PolizaId == poliza.Id && c.Estado == EstadoCuota.Pendiente)).Id;
        // The second request read the installment before the first one saved its payment.
        await segundo.Cuotas.SingleAsync(c => c.Id == cuotaId);

        var pedido = new PagoPublicoRequest
        {
            Dni = "30123456",
            NumeroPoliza = "POL-0000001",
            CuotaIds = [cuotaId],
            Proveedor = "pasarela1"
        };
        await CrearServicio(primero, cuotasEnCurso: true).IniciarPagoOnlineAsync(pedido);
        // Its C8 check ran before the first payment existed, so it sees no payment in progress.
        var error = await Assert.ThrowsAsync<BusinessRuleException>(
            () => CrearServicio(segundo, cuotasEnCurso: false).IniciarPagoOnlineAsync(pedido));

        Assert.IsType<DbUpdateConcurrencyException>(error.InnerException);
        await using var lectura = fixture.CrearContexto();
        Assert.Equal(1, await lectura.PagoCuotas.CountAsync(pc => pc.CuotaId == cuotaId));
    }

    private static PagoService CrearServicio(AseguradoraDbContext contexto, bool cuotasEnCurso)
    {
        var pagos = cuotasEnCurso
            ? (IRepository<Pago>)new EfRepository<Pago>(contexto)
            : new PagosQueNoVenOtrosPedidos(contexto);
        var opciones = new PagoOnlineOpciones
        {
            UrlBaseApi = "https://api.example.com",
            UrlRetornoExito = "https://web.example.com/pago/exito",
            UrlRetornoError = "https://web.example.com/pago/error",
            ReservaMinutos = 60
        };
        var verificador = new VerificadorPublico(
            new EfRepository<Cliente>(contexto), new EfRepository<Poliza>(contexto), new EfRepository<Pago>(contexto));
        return new PagoService(
            verificador, new EfRepository<Cuota>(contexto), new EfRepository<Cliente>(contexto), pagos,
            new PasarelaSiempreAcepta(), new UnitOfWork(contexto), opciones, TimeProvider.System,
            new EfRepository<Poliza>(contexto), new EfRepository<Factura>(contexto), ServiciosPagoDePrueba.CrearAprobacion(contexto));
    }

    /// <summary>Simulates a concurrent request: the C8 check runs before the other payment was saved.</summary>
    private sealed class PagosQueNoVenOtrosPedidos(AseguradoraDbContext contexto) : IRepository<Pago>
    {
        private readonly EfRepository<Pago> _real = new(contexto);

        public Task<bool> AnyAsync(Expression<Func<Pago, bool>> predicate, CancellationToken cancellationToken = default) =>
            Task.FromResult(false);

        public Task<Pago?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
            _real.GetByIdAsync(id, cancellationToken);
        public Task<IReadOnlyList<Pago>> GetAllAsync(CancellationToken cancellationToken = default) =>
            _real.GetAllAsync(cancellationToken);
        public Task<IReadOnlyList<Pago>> FindAsync(Expression<Func<Pago, bool>> predicate, CancellationToken cancellationToken = default) =>
            _real.FindAsync(predicate, cancellationToken);
        public Task AddAsync(Pago entity, CancellationToken cancellationToken = default) =>
            _real.AddAsync(entity, cancellationToken);
        public void Update(Pago entity) => _real.Update(entity);
        public void Tocar(Pago entity) => _real.Tocar(entity);
        public void Remove(Pago entity) => _real.Remove(entity);
        public IQueryable<Pago> Query() => _real.Query();
    }

    private sealed class PasarelaSiempreAcepta : IPasarelaResolver, IPasarelaService
    {
        public IPasarelaService Obtener(string proveedor) => this;

        public Task<PasarelaCrearPagoResponse> CrearPagoAsync(PasarelaCrearPagoRequest request, CancellationToken ct) =>
            Task.FromResult(new PasarelaCrearPagoResponse(
                $"PSR-{request.ReferenciaExterna}", "PENDIENTE", $"https://pasarela.example/{request.ReferenciaExterna}",
                DateTime.UtcNow.AddHours(1)));

        public Task<PasarelaPagoResponse> ConsultarPagoAsync(string idPago, CancellationToken ct) =>
            throw new NotSupportedException();
    }

    private sealed class FacturacionFake : IFacturacionService
    {
        public int Llamadas { get; private set; }
        public Task EmitirAsync(Guid pagoId, CancellationToken ct = default) { Llamadas++; return Task.CompletedTask; }
    }
}
