using Aseguradora.Application.Exceptions;
using Aseguradora.Application.Services;
using Aseguradora.Data.Repositories;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
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

    private sealed class FacturacionFake : IFacturacionService
    {
        public int Llamadas { get; private set; }
        public Task EmitirAsync(Guid pagoId, CancellationToken ct = default) { Llamadas++; return Task.CompletedTask; }
    }
}
