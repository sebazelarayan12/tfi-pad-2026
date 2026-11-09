using Aseguradora.Application.Dtos;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.Services;
using Aseguradora.Data;
using Aseguradora.Data.Repositories;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Support;

namespace Aseguradora.Tests.Pagos;

public sealed class PagoConsultaServiceTests : IDisposable
{
    private static readonly DateTime Base = new(2026, 11, 1, 12, 0, 0, DateTimeKind.Utc);

    private readonly SqliteDbFixture _fixture = new();

    public void Dispose() => _fixture.Dispose();

    private static PagoConsultaService CrearServicio(AseguradoraDbContext db) => new(
        new EfRepository<Pago>(db), new EfRepository<Factura>(db), new EfRepository<Poliza>(db));

    private static Pago AgregarPago(
        AseguradoraDbContext db, string numero, MedioPago medio, DateTime fecha, params int[] cuotas)
    {
        var seleccion = db.Cuotas.Where(c => c.PolizaId == SeedData.PolizaId).ToList()
            .Where(c => cuotas.Contains(c.Numero)).ToList();
        var pago = Pago.CrearPendiente(SeedData.ClienteId, numero, medio, seleccion, fecha);
        db.Pagos.Add(pago);
        db.SaveChanges();
        return pago;
    }

    private static void Facturar(AseguradoraDbContext db, Pago pago, bool autorizar)
    {
        pago.Aprobar(pago.FechaCreacion.AddMinutes(1));
        var factura = Factura.CrearPendienteCae(pago, pago.FechaCreacion.AddMinutes(1));
        if (autorizar) factura.Autorizar("0001-00000001", "74123456789012", new DateOnly(2026, 11, 11));
        db.Facturas.Add(factura);
        db.SaveChanges();
    }

    [Fact]
    public async Task Listar_SinFiltros_DevuelveElMasNuevoPrimeroConClientePolizaYCuotas()
    {
        await using var db = _fixture.CreateContext();
        AgregarPago(db, "PAG-VIEJO", MedioPago.Caja, Base, 2);
        AgregarPago(db, "PAG-NUEVO", MedioPago.PagoFacil, Base.AddDays(1), 4, 3);

        var pagina = await CrearServicio(db).ListarAsync(new PagoFiltro());

        // The seeded payment (PAG-000001, 15/10) is the oldest.
        Assert.Equal(["PAG-NUEVO", "PAG-VIEJO", "PAG-000001"], pagina.Items.Select(p => p.Numero));
        Assert.Equal(3, pagina.Total);
        var nuevo = pagina.Items[0];
        Assert.Equal("Juan Carlos Pérez", nuevo.ClienteNombre);
        Assert.Equal("POL-0000001", nuevo.NumeroPoliza);
        Assert.Equal([3, 4], nuevo.Cuotas);
        Assert.Equal("PAGO_FACIL", nuevo.Medio);
        Assert.Equal("PENDIENTE", nuevo.Estado);
        Assert.Equal(DateTimeKind.Utc, nuevo.FechaCreacion.Kind);
        Assert.Null(nuevo.Factura);
    }

    [Fact]
    public async Task Listar_ConFactura_DevuelveSuNumeroYEstado()
    {
        await using var db = _fixture.CreateContext();
        var autorizado = AgregarPago(db, "PAG-A", MedioPago.Caja, Base, 2);
        var sinCae = AgregarPago(db, "PAG-B", MedioPago.Caja, Base.AddHours(1), 3);
        Facturar(db, autorizado, autorizar: true);
        Facturar(db, sinCae, autorizar: false);

        var pagina = await CrearServicio(db).ListarAsync(new PagoFiltro());

        var filaSinCae = pagina.Items.Single(p => p.Numero == "PAG-B");
        Assert.Equal("PENDIENTE_CAE", filaSinCae.Factura!.Estado);
        var filaAutorizada = pagina.Items.Single(p => p.Numero == "PAG-A");
        Assert.Equal("AUTORIZADA", filaAutorizada.Factura!.Estado);
        Assert.Equal("0001-00000001", filaAutorizada.Factura.Numero);
        Assert.Equal("APROBADO", filaAutorizada.Estado);
    }

    [Fact]
    public async Task Listar_FiltraPorMedioYEstadoSinImportarMayusculas()
    {
        await using var db = _fixture.CreateContext();
        var caja = AgregarPago(db, "PAG-CAJA", MedioPago.Caja, Base, 2);
        AgregarPago(db, "PAG-PASARELA", MedioPago.Pasarela, Base.AddHours(1), 3);
        Facturar(db, caja, autorizar: true);
        var servicio = CrearServicio(db);

        var porMedio = await servicio.ListarAsync(new PagoFiltro { Medio = "pasarela" });
        var porEstado = await servicio.ListarAsync(new PagoFiltro { Estado = "APROBADO" });

        Assert.Equal("PAG-PASARELA", Assert.Single(porMedio.Items).Numero);
        // The seeded payment is also APROBADO.
        Assert.Equal(["PAG-CAJA", "PAG-000001"], porEstado.Items.Select(p => p.Numero));
    }

    [Fact]
    public async Task Listar_FiltraPorNumeroDePoliza()
    {
        await using var db = _fixture.CreateContext();
        AgregarPago(db, "PAG-1", MedioPago.Caja, Base, 2);
        var servicio = CrearServicio(db);

        var coincide = await servicio.ListarAsync(new PagoFiltro { NumeroPoliza = " pol-0000001 " });
        var noCoincide = await servicio.ListarAsync(new PagoFiltro { NumeroPoliza = "POL-9999999" });

        Assert.Equal(["PAG-1", "PAG-000001"], coincide.Items.Select(p => p.Numero));
        Assert.Empty(noCoincide.Items);
        Assert.Equal(0, noCoincide.Total);
    }

    [Fact]
    public async Task Listar_Paginado_DevuelveSoloLaPaginaPedidaYElTotal()
    {
        await using var db = _fixture.CreateContext();
        AgregarPago(db, "PAG-1", MedioPago.Caja, Base, 2);
        AgregarPago(db, "PAG-2", MedioPago.Caja, Base.AddDays(1), 3);
        AgregarPago(db, "PAG-3", MedioPago.Caja, Base.AddDays(2), 4);

        var pagina = await CrearServicio(db).ListarAsync(new PagoFiltro { Pagina = 2, Tamano = 2 });

        // Newest first: PAG-3, PAG-2 | PAG-1, seeded PAG-000001.
        Assert.Equal(["PAG-1", "PAG-000001"], pagina.Items.Select(p => p.Numero));
        Assert.Equal(4, pagina.Total);
        Assert.Equal(2, pagina.Pagina);
        Assert.Equal(2, pagina.TamanoPagina);
    }

    [Theory]
    [InlineData("ANULADO", null)]
    [InlineData(null, "EFECTIVO")]
    public async Task Listar_ConEstadoOMedioDesconocido_LanzaReglaDeNegocio(string? estado, string? medio)
    {
        await using var db = _fixture.CreateContext();

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            CrearServicio(db).ListarAsync(new PagoFiltro { Estado = estado, Medio = medio }));
    }

    [Fact]
    public async Task ListarPorPoliza_DevuelveSusPagosConFacturaDelMasNuevoAlMasViejo()
    {
        await using var db = _fixture.CreateContext();
        var viejo = AgregarPago(db, "PAG-VIEJO", MedioPago.Caja, Base, 2);
        var nuevo = AgregarPago(db, "PAG-NUEVO", MedioPago.Caja, Base.AddDays(1), 3);
        Facturar(db, nuevo, autorizar: true);

        var pagos = await CrearServicio(db).ListarPorPolizaAsync(SeedData.PolizaId);

        Assert.Equal([nuevo.Id, viejo.Id, SeedData.PagoId], pagos.Select(p => p.Id));
        Assert.Equal("AUTORIZADA", pagos[0].Factura!.Estado);
        Assert.Null(pagos[1].Factura);
    }

    [Fact]
    public async Task ListarPorPoliza_SinPagos_DevuelveListaVacia()
    {
        await using var db = _fixture.CreateContext();
        var sinPagos = await PolizasDePrueba.AgregarPolizaAsync(db, EstadoPoliza.Pendiente, Base);

        Assert.Empty(await CrearServicio(db).ListarPorPolizaAsync(sinPagos.Id));
    }

    [Fact]
    public async Task ListarPorPoliza_ConPolizaInexistente_LanzaNotFound()
    {
        await using var db = _fixture.CreateContext();

        await Assert.ThrowsAsync<NotFoundException>(() =>
            CrearServicio(db).ListarPorPolizaAsync(Guid.NewGuid()));
    }
}
