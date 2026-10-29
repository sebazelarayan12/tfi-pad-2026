using Aseguradora.Application.Dtos.Polizas;
using Aseguradora.Application.Exceptions;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Enums;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Support;

namespace Aseguradora.Tests.Application;

public sealed class PolizaServiceConsultaTests : IDisposable
{
    private static readonly DateTime Emision = new(2026, 10, 20, 0, 0, 0, DateTimeKind.Utc);

    private readonly SqliteDbFixture _fixture = new();

    public void Dispose() => _fixture.Dispose();

    [Fact]
    public async Task Listar_SinFiltros_DevuelveTodasLasPolizasDeLaMasNuevaALaMasVieja()
    {
        await using var context = _fixture.CreateContext();
        var vieja = await PolizasDePrueba.AgregarPolizaAsync(context, EstadoPoliza.Cancelada, Emision);
        var nueva = await PolizasDePrueba.AgregarPolizaAsync(context, EstadoPoliza.Pendiente, Emision.AddDays(1));

        var pagina = await PolizasDePrueba.CrearServicio(context).ListarAsync(new PolizaFiltro());

        // The seeded policy was issued on 15/10, before both.
        Assert.Equal([nueva.Id, vieja.Id, SeedData.PolizaId], pagina.Items.Select(p => p.Id));
        Assert.Equal(3, pagina.Total);
        Assert.Equal(1, pagina.Pagina);
        Assert.Equal(PolizaFiltro.TamanoPorDefecto, pagina.TamanoPagina);
    }

    [Fact]
    public async Task Listar_Paginado_DevuelveSoloLaPaginaPedidaYElTotal()
    {
        await using var context = _fixture.CreateContext();
        await PolizasDePrueba.AgregarPolizaAsync(context, EstadoPoliza.Cancelada, Emision);
        await PolizasDePrueba.AgregarPolizaAsync(context, EstadoPoliza.Pendiente, Emision.AddDays(1));

        var pagina = await PolizasDePrueba.CrearServicio(context)
            .ListarAsync(new PolizaFiltro { Pagina = 2, Tamano = 2 });

        Assert.Equal(SeedData.PolizaId, Assert.Single(pagina.Items).Id);
        Assert.Equal(3, pagina.Total);
        Assert.Equal(2, pagina.Pagina);
        Assert.Equal(2, pagina.TamanoPagina);
    }

    [Fact]
    public async Task Listar_PaginaFueraDeRango_DevuelveVaciaConElTotal()
    {
        await using var context = _fixture.CreateContext();

        var pagina = await PolizasDePrueba.CrearServicio(context).ListarAsync(new PolizaFiltro { Pagina = 5 });

        Assert.Empty(pagina.Items);
        Assert.Equal(1, pagina.Total);
    }

    [Fact]
    public async Task Listar_FiltraPorEstado()
    {
        await using var context = _fixture.CreateContext();
        await PolizasDePrueba.AgregarPolizaAsync(context, EstadoPoliza.Cancelada, Emision);
        var pendiente = await PolizasDePrueba.AgregarPolizaAsync(context, EstadoPoliza.Pendiente, Emision);

        var pagina = await PolizasDePrueba.CrearServicio(context)
            .ListarAsync(new PolizaFiltro { Estado = EstadoPoliza.Pendiente });

        var item = Assert.Single(pagina.Items);
        Assert.Equal(pendiente.Id, item.Id);
        Assert.Equal(EstadoPoliza.Pendiente, item.Estado);
        Assert.Equal(1, pagina.Total);
    }

    [Fact]
    public async Task Listar_FiltraPorCliente()
    {
        await using var context = _fixture.CreateContext();
        await PolizasDePrueba.AgregarPolizaAsync(context, EstadoPoliza.Pendiente, Emision);

        var pagina = await PolizasDePrueba.CrearServicio(context)
            .ListarAsync(new PolizaFiltro { ClienteId = SeedData.ClienteId });

        Assert.Equal(SeedData.PolizaId, Assert.Single(pagina.Items).Id);
    }

    [Theory]
    [InlineData("AB123CD")]
    [InlineData(" ab123cd ")]
    public async Task Listar_FiltraPorPatenteSinImportarMayusculasNiEspacios(string patente)
    {
        await using var context = _fixture.CreateContext();
        await PolizasDePrueba.AgregarPolizaAsync(context, EstadoPoliza.Pendiente, Emision);

        var pagina = await PolizasDePrueba.CrearServicio(context).ListarAsync(new PolizaFiltro { Patente = patente });

        var item = Assert.Single(pagina.Items);
        Assert.Equal(SeedData.PolizaId, item.Id);
        Assert.Equal("POL-0000001", item.Numero);
        Assert.Equal("AB123CD", item.Patente);
        Assert.Equal("RC", item.CodigoPlan);
        Assert.Equal(SeedData.ClienteId, item.ClienteId);
    }

    [Fact]
    public async Task Listar_PatenteSinPolizas_DevuelveVacia()
    {
        await using var context = _fixture.CreateContext();

        var pagina = await PolizasDePrueba.CrearServicio(context).ListarAsync(new PolizaFiltro { Patente = "ZZ999ZZ" });

        Assert.Empty(pagina.Items);
        Assert.Equal(0, pagina.Total);
    }

    [Fact]
    public async Task Listar_FiltrosCombinados_DebenCumplirseTodos()
    {
        await using var context = _fixture.CreateContext();

        var pagina = await PolizasDePrueba.CrearServicio(context)
            .ListarAsync(new PolizaFiltro { Patente = "AB123CD", Estado = EstadoPoliza.Cancelada });

        Assert.Empty(pagina.Items);
    }

    [Fact]
    public async Task Listar_FiltroNulo_Lanza()
    {
        await using var context = _fixture.CreateContext();

        await Assert.ThrowsAsync<ArgumentNullException>(() => PolizasDePrueba.CrearServicio(context).ListarAsync(null!));
    }

    [Fact]
    public async Task Obtener_DevuelveVehiculoPlanYCuotasOrdenadas()
    {
        await using var context = _fixture.CreateContext();

        var poliza = await PolizasDePrueba.CrearServicio(context).ObtenerAsync(SeedData.PolizaId);

        Assert.Equal("POL-0000001", poliza.Numero);
        Assert.Equal(SeedData.VehiculoId, poliza.VehiculoId);
        Assert.Equal("AB123CD", poliza.Patente);
        Assert.Equal(SeedData.PlanRcId, poliza.PlanId);
        Assert.Equal("RC", poliza.CodigoPlan);
        Assert.Equal(EstadoPoliza.Vigente, poliza.Estado);
        Assert.Equal(Enumerable.Range(1, 6), poliza.Cuotas.Select(c => c.Numero));
        Assert.Equal(EstadoCuota.Pagada, poliza.Cuotas[0].Estado);
    }

    [Fact]
    public async Task Obtener_IdInexistente_LanzaNotFound()
    {
        await using var context = _fixture.CreateContext();

        await Assert.ThrowsAsync<NotFoundException>(() => PolizasDePrueba.CrearServicio(context).ObtenerAsync(Guid.NewGuid()));
    }

    [Fact]
    public async Task ObtenerCuotas_DevuelveLasDeLaPolizaOrdenadasPorNumero()
    {
        await using var context = _fixture.CreateContext();
        var otra = await PolizasDePrueba.AgregarPolizaAsync(context, EstadoPoliza.Pendiente, Emision);

        var cuotas = await PolizasDePrueba.CrearServicio(context).ObtenerCuotasAsync(otra.Id);

        Assert.Equal(Enumerable.Range(1, otra.VigenciaMeses), cuotas.Select(c => c.Numero));
        Assert.Equal(otra.Cuotas.Select(c => c.Id).Order(), cuotas.Select(c => c.Id).Order());
    }

    [Fact]
    public async Task ObtenerCuotas_PolizaInexistente_LanzaNotFound()
    {
        await using var context = _fixture.CreateContext();

        await Assert.ThrowsAsync<NotFoundException>(() =>
            PolizasDePrueba.CrearServicio(context).ObtenerCuotasAsync(Guid.NewGuid()));
    }
}
