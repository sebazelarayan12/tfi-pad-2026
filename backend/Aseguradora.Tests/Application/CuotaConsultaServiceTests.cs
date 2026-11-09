using Aseguradora.Application.Dtos;
using Aseguradora.Application.Services;
using Aseguradora.Data;
using Aseguradora.Data.Repositories;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Tests.Data;

namespace Aseguradora.Tests.Application;

/// <summary>The seed has one policy with six installments: the first Pagada, the other five Pendiente.</summary>
public sealed class CuotaConsultaServiceTests : IDisposable
{
    private readonly SqliteDbFixture _fixture = new();

    public void Dispose() => _fixture.Dispose();

    private static CuotaConsultaService CrearServicio(AseguradoraDbContext db) => new(new EfRepository<Cuota>(db));

    private static void Vencer(AseguradoraDbContext db, int numero, decimal recargo)
    {
        var cuota = db.Cuotas.Single(c => c.Id == SeedData.CuotaId(numero));
        cuota.Estado = EstadoCuota.Vencida;
        cuota.Recargo = recargo;
        db.SaveChanges();
    }

    [Fact]
    public async Task Listar_SinFiltros_DevuelveTodasLasCuotasConLaMasAntiguaPrimero()
    {
        await using var db = _fixture.CreateContext();

        var pagina = await CrearServicio(db).ListarAsync(new CuotaFiltro());

        Assert.Equal(6, pagina.Total);
        Assert.Equal(Enumerable.Range(1, 6), pagina.Items.Select(c => c.NumeroCuota));
        var fila = pagina.Items[0];
        Assert.Equal(SeedData.CuotaId(1), fila.CuotaId);
        Assert.Equal(SeedData.PolizaId, fila.PolizaId);
        Assert.Equal("Juan Carlos", fila.ClienteNombre);
        Assert.Equal("Pérez", fila.ClienteApellido);
        Assert.StartsWith("POL-", fila.NumeroPoliza);
    }

    [Fact]
    public async Task Listar_ConEstadoVencida_DevuelveSoloLasVencidasConSuRecargo()
    {
        await using var db = _fixture.CreateContext();
        Vencer(db, 2, 1500m);

        var pagina = await CrearServicio(db).ListarAsync(new CuotaFiltro { Estado = EstadoCuota.Vencida });

        var fila = Assert.Single(pagina.Items);
        Assert.Equal(1, pagina.Total);
        Assert.Equal(SeedData.CuotaId(2), fila.CuotaId);
        Assert.Equal(1500m, fila.Recargo);
        Assert.Equal(EstadoCuota.Vencida, fila.Estado);
    }

    [Fact]
    public async Task Listar_ConEstadoSinCoincidencias_DevuelveUnaPaginaVacia()
    {
        await using var db = _fixture.CreateContext();

        var pagina = await CrearServicio(db).ListarAsync(new CuotaFiltro { Estado = EstadoCuota.Vencida });

        Assert.Empty(pagina.Items);
        Assert.Equal(0, pagina.Total);
    }

    [Fact]
    public async Task Listar_FiltraPorPolizaYPorCliente()
    {
        await using var db = _fixture.CreateContext();
        var servicio = CrearServicio(db);

        var propias = await servicio.ListarAsync(new CuotaFiltro { PolizaId = SeedData.PolizaId, ClienteId = SeedData.ClienteId });
        var deOtraPoliza = await servicio.ListarAsync(new CuotaFiltro { PolizaId = Guid.NewGuid() });
        var deOtroCliente = await servicio.ListarAsync(new CuotaFiltro { ClienteId = Guid.NewGuid() });

        Assert.Equal(6, propias.Total);
        Assert.Equal(0, deOtraPoliza.Total);
        Assert.Equal(0, deOtroCliente.Total);
    }

    [Fact]
    public async Task Listar_Pagina_NoSolapaLasPaginasYInformaElTotal()
    {
        await using var db = _fixture.CreateContext();
        var servicio = CrearServicio(db);

        var primera = await servicio.ListarAsync(new CuotaFiltro { Pagina = 1, Tamano = 4 });
        var segunda = await servicio.ListarAsync(new CuotaFiltro { Pagina = 2, Tamano = 4 });

        Assert.Equal([1, 2, 3, 4], primera.Items.Select(c => c.NumeroCuota));
        Assert.Equal([5, 6], segunda.Items.Select(c => c.NumeroCuota));
        Assert.Equal(6, segunda.Total);
        Assert.Equal(4, segunda.TamanoPagina);
    }
}
