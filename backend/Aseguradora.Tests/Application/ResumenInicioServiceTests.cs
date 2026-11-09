using Aseguradora.Application.Services;
using Aseguradora.Data;
using Aseguradora.Data.Repositories;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Support;

namespace Aseguradora.Tests.Application;

/// <summary>The seed has one Vigente policy, six installments (one Pagada) and no settlements or pending invoices.</summary>
public sealed class ResumenInicioServiceTests : IDisposable
{
    // 02:00 UTC is still the previous day in Argentina (UTC-3).
    private static readonly DateTimeOffset Ahora = new(2026, 11, 10, 2, 0, 0, TimeSpan.Zero);

    private readonly SqliteDbFixture _fixture = new();

    public void Dispose() => _fixture.Dispose();

    private static ResumenInicioService CrearServicio(AseguradoraDbContext db) =>
        new(
            new EfRepository<Poliza>(db),
            new EfRepository<Cuota>(db),
            new EfRepository<Factura>(db),
            new EfRepository<RendicionPagoFacil>(db),
            new RelojFalso(Ahora));

    [Fact]
    public async Task Obtener_UsaElDiaDeArgentinaComoFechaDeCorte()
    {
        await using var db = _fixture.CreateContext();

        var resumen = await CrearServicio(db).ObtenerAsync();

        Assert.Equal(new DateOnly(2026, 11, 9), resumen.FechaCorte);
    }

    [Fact]
    public async Task Obtener_CuentaLasPolizasPorEstadoIncluyendoLosEstadosSinPolizas()
    {
        await using var db = _fixture.CreateContext();

        var resumen = await CrearServicio(db).ObtenerAsync();

        Assert.Equal(1, resumen.PolizasPorEstado[nameof(EstadoPoliza.Vigente)]);
        Assert.Equal(0, resumen.PolizasPorEstado[nameof(EstadoPoliza.Cancelada)]);
        Assert.Equal(Enum.GetValues<EstadoPoliza>().Length, resumen.PolizasPorEstado.Count);
    }

    [Fact]
    public async Task Obtener_ListaLasCuotasVencidasMasRecientesPrimeroConElRecargo()
    {
        await using var db = _fixture.CreateContext();
        foreach (var numero in new[] { 2, 3 })
        {
            var cuota = db.Cuotas.Single(c => c.Id == SeedData.CuotaId(numero));
            cuota.Estado = EstadoCuota.Vencida;
            cuota.Recargo = 600m;
        }

        db.SaveChanges();

        var resumen = await CrearServicio(db).ObtenerAsync();

        Assert.Equal(2, resumen.CuotasVencidas.Total);
        Assert.Equal(5m, resumen.CuotasVencidas.RecargoPorcentaje);
        Assert.Equal([3, 2], resumen.CuotasVencidas.Recientes.Select(c => c.NumeroCuota));
        var fila = resumen.CuotasVencidas.Recientes[0];
        Assert.Equal("Juan Carlos", fila.ClienteNombre);
        Assert.Equal(600m, fila.Recargo);
        Assert.Equal(EstadoCuota.Vencida, fila.Estado);
    }

    [Fact]
    public async Task Obtener_SinCuotasVencidas_DevuelveTotalCeroYListaVacia()
    {
        await using var db = _fixture.CreateContext();

        var resumen = await CrearServicio(db).ObtenerAsync();

        Assert.Equal(0, resumen.CuotasVencidas.Total);
        Assert.Empty(resumen.CuotasVencidas.Recientes);
        Assert.Equal(0, resumen.FacturasPendientesCae);
    }

    [Fact]
    public async Task Obtener_LaRendicionDeHoyApagaLaAlerta()
    {
        await using var db = _fixture.CreateContext();
        var servicio = CrearServicio(db);
        Assert.True((await servicio.ObtenerAsync()).RendicionPendienteHoy);

        db.RendicionesPagoFacil.Add(new RendicionPagoFacil
        {
            FechaRendicion = new DateOnly(2026, 11, 9),
            FechaProceso = Ahora.UtcDateTime,
        });
        db.SaveChanges();

        Assert.False((await servicio.ObtenerAsync()).RendicionPendienteHoy);
    }
}
