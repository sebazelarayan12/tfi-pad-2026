using Aseguradora.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Aseguradora.Tests.Data;

public sealed class ControlProcesoConfigurationTests : IDisposable
{
    private readonly SqliteDbFixture _fixture = new();

    public void Dispose() => _fixture.Dispose();

    [Fact]
    public async Task Nombre_EsUnico()
    {
        await using var context = _fixture.CreateContext();
        context.AddRange(
            new ControlProceso { Nombre = "VencimientosDiarios", UltimaFechaProcesada = new DateOnly(2026, 10, 28) },
            new ControlProceso { Nombre = "VencimientosDiarios", UltimaFechaProcesada = new DateOnly(2026, 10, 29) });

        await Assert.ThrowsAsync<DbUpdateException>(() => context.SaveChangesAsync());
    }
}
