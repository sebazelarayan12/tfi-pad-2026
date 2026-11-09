using Aseguradora.Application.Dtos;
using Aseguradora.Application.Services;
using Aseguradora.Data;
using Aseguradora.Data.Repositories;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Support;

namespace Aseguradora.Tests.Application;

public sealed class CotizacionConsultaServiceTests : IDisposable
{
    private static readonly DateTimeOffset Ahora = new(2026, 11, 10, 12, 0, 0, TimeSpan.Zero);

    private readonly SqliteDbFixture _fixture = new();

    public void Dispose() => _fixture.Dispose();

    private static CotizacionConsultaService CrearServicio(AseguradoraDbContext db) =>
        new(new EfRepository<Cotizacion>(db), new RelojFalso(Ahora));

    private static Cotizacion Agregar(
        AseguradoraDbContext db, DateTime fecha, Guid? clienteId = null, Guid? vehiculoId = null,
        OrigenCotizacion origen = OrigenCotizacion.Panel)
    {
        var cotizacion = new Cotizacion
        {
            PlanId = SeedData.PlanRcId,
            ClienteId = clienteId,
            VehiculoId = vehiculoId,
            TipoVehiculo = TipoVehiculo.Auto,
            AnioVehiculo = 2022,
            Uso = UsoVehiculo.Particular,
            EdadConductor = 35,
            PrimaMensual = 12000m,
            FechaCotizacion = fecha,
            FechaVencimiento = fecha.AddDays(CotizacionService.DiasDeVigencia),
            Origen = origen,
        };
        db.Cotizaciones.Add(cotizacion);
        db.SaveChanges();
        return cotizacion;
    }

    [Fact]
    public async Task Listar_SinFiltros_DevuelveLaMasNuevaPrimeraConClienteYPatente()
    {
        await using var db = _fixture.CreateContext();
        var vieja = Agregar(db, Ahora.UtcDateTime.AddDays(-30));
        var nueva = Agregar(db, Ahora.UtcDateTime.AddDays(-1), SeedData.ClienteId, SeedData.VehiculoId);

        var pagina = await CrearServicio(db).ListarAsync(new CotizacionFiltro());

        Assert.Equal([nueva.Id, vieja.Id], pagina.Items.Select(c => c.Id));
        Assert.Equal(2, pagina.Total);
        var fila = pagina.Items[0];
        Assert.Equal("Juan Carlos Pérez", fila.ClienteNombre);
        Assert.Equal("AB123CD", fila.Patente);
        Assert.Equal(OrigenCotizacion.Panel, fila.Origen);
        Assert.Equal(12000m, fila.PrimaMensual);
        Assert.Equal(DateTimeKind.Utc, fila.FechaVencimiento.Kind);
        Assert.Null(pagina.Items[1].ClienteNombre);
        Assert.Null(pagina.Items[1].Patente);
    }

    [Fact]
    public async Task Listar_FiltraPorVigencia_ElDiaDelVencimientoSigueVigente()
    {
        await using var db = _fixture.CreateContext();
        var vencida = Agregar(db, Ahora.UtcDateTime.AddDays(-30));
        var venceHoy = Agregar(db, Ahora.UtcDateTime.AddDays(-CotizacionService.DiasDeVigencia));
        var vigente = Agregar(db, Ahora.UtcDateTime.AddDays(-1));
        var servicio = CrearServicio(db);

        var vigentes = await servicio.ListarAsync(new CotizacionFiltro { Vigente = true });
        var vencidas = await servicio.ListarAsync(new CotizacionFiltro { Vigente = false });

        Assert.Equal([vigente.Id, venceHoy.Id], vigentes.Items.Select(c => c.Id));
        Assert.All(vigentes.Items, c => Assert.True(c.Vigente));
        Assert.Equal(vencida.Id, Assert.Single(vencidas.Items).Id);
        Assert.False(vencidas.Items[0].Vigente);
    }

    [Fact]
    public async Task Listar_FiltraPorClienteVehiculoYPatente()
    {
        await using var db = _fixture.CreateContext();
        var delVehiculo = Agregar(db, Ahora.UtcDateTime.AddDays(-2), SeedData.ClienteId, SeedData.VehiculoId);
        Agregar(db, Ahora.UtcDateTime.AddDays(-1));
        var servicio = CrearServicio(db);

        var porCliente = await servicio.ListarAsync(new CotizacionFiltro { ClienteId = SeedData.ClienteId });
        var porVehiculo = await servicio.ListarAsync(new CotizacionFiltro { VehiculoId = SeedData.VehiculoId });
        var porPatente = await servicio.ListarAsync(new CotizacionFiltro { Patente = " ab123cd " });
        var sinCoincidencia = await servicio.ListarAsync(new CotizacionFiltro { Patente = "ZZ999ZZ" });

        Assert.Equal(delVehiculo.Id, Assert.Single(porCliente.Items).Id);
        Assert.Equal(delVehiculo.Id, Assert.Single(porVehiculo.Items).Id);
        Assert.Equal(delVehiculo.Id, Assert.Single(porPatente.Items).Id);
        Assert.Empty(sinCoincidencia.Items);
        Assert.Equal(0, sinCoincidencia.Total);
    }

    [Fact]
    public async Task Listar_Paginado_DevuelveSoloLaPaginaPedidaYElTotal()
    {
        await using var db = _fixture.CreateContext();
        var vieja = Agregar(db, Ahora.UtcDateTime.AddDays(-3));
        Agregar(db, Ahora.UtcDateTime.AddDays(-2));
        Agregar(db, Ahora.UtcDateTime.AddDays(-1));

        var pagina = await CrearServicio(db).ListarAsync(new CotizacionFiltro { Pagina = 2, Tamano = 2 });

        Assert.Equal(vieja.Id, Assert.Single(pagina.Items).Id);
        Assert.Equal(3, pagina.Total);
        Assert.Equal(2, pagina.Pagina);
        Assert.Equal(2, pagina.TamanoPagina);
    }
}
