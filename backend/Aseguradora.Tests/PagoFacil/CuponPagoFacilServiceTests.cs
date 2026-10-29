using Aseguradora.Application.Exceptions;
using Aseguradora.Application.PagoFacil;
using Aseguradora.Data;
using Aseguradora.Data.Repositories;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Tests.Data;

namespace Aseguradora.Tests.PagoFacil;

/// <summary>Uses the seeded policy POL-0000001: installment 2 is Pendiente, due 2026-12-10, for 12000.</summary>
public sealed class CuponPagoFacilServiceTests : IDisposable
{
    private const int CodigoEmpresa = 12345;
    private static readonly Guid CuotaId = SeedData.CuotaId(2);
    private static readonly DateOnly Vencimiento = new(2026, 12, 10);
    private static readonly DateOnly AntesDelVencimiento = new(2026, 11, 20);

    private readonly SqliteDbFixture _fixture = new();

    public void Dispose() => _fixture.Dispose();

    [Fact]
    public async Task Cupon_CuotaPendiente_UsaImporteSinRecargo()
    {
        var cupon = await GenerarAsync(AntesDelVencimiento);

        Assert.Equal(CuotaId, cupon.CuotaId);
        Assert.Equal("POL-0000001", cupon.NumeroPoliza);
        Assert.Equal(2, cupon.NumeroCuota);
        Assert.Equal(12000.00m, cupon.ImportePrimerVencimiento);
        Assert.Equal(Vencimiento, cupon.FechaPrimerVencimiento);
        Assert.Equal(Vencimiento.AddDays(CuponPagoFacilService.DiasAlSegundoVencimiento), cupon.FechaSegundoVencimiento);
        Assert.Equal(42, cupon.CodigoBarras.Length);
        Assert.True(CodigoBarrasPagoFacil.Validar(cupon.CodigoBarras));
    }

    [Fact]
    public async Task Cupon_CuotaVencida_UsaImporteConRecargo()
    {
        var hoy = Vencimiento.AddDays(1);
        var sinRecargo = await GenerarAsync(AntesDelVencimiento);
        await CambiarCuotaAsync(c => c.Vencer(hoy));

        var cupon = await GenerarAsync(hoy);

        Assert.Equal(12600.00m, cupon.ImportePrimerVencimiento);
        Assert.Equal(hoy, cupon.FechaPrimerVencimiento);
        Assert.NotEqual(sinRecargo.CodigoBarras, cupon.CodigoBarras);
    }

    [Fact]
    public async Task Cupon_SegundoVencimiento_Mas5Por100()
    {
        await CambiarCuotaAsync(c => c.Importe = 12345.67m);

        var cupon = await GenerarAsync(AntesDelVencimiento);

        // 12345.67 * 1.05 = 12962.9535 -> 12962.95 (RN08).
        Assert.Equal(12962.95m, cupon.ImporteSegundoVencimiento);
    }

    [Fact]
    public async Task Cupon_CuotaPendienteYaVencida_CobraElRecargo()
    {
        // Due 10/12 and asked on 11/12 before the daily job marked it Vencida.
        var hoy = Vencimiento.AddDays(1);

        var cupon = await GenerarAsync(hoy);

        Assert.Equal(12600.00m, cupon.ImportePrimerVencimiento);
        Assert.Equal(hoy, cupon.FechaPrimerVencimiento);
        Assert.Equal(12600.00m, cupon.ImporteSegundoVencimiento);

        // Same coupon as once the job runs and the installment is Vencida.
        await CambiarCuotaAsync(c => c.Vencer(hoy));
        Assert.Equal(cupon.CodigoBarras, (await GenerarAsync(hoy)).CodigoBarras);
    }

    [Fact]
    public async Task Cupon_RedondeoEnPuntoMedio_SubeElCentavo()
    {
        await CambiarCuotaAsync(c => c.Importe = 10.10m);

        var cupon = await GenerarAsync(AntesDelVencimiento);

        // 10.10 * 0.05 = 0.505 -> 0.51 (half away from zero).
        Assert.Equal(10.61m, cupon.ImporteSegundoVencimiento);
    }

    [Fact]
    public async Task Cupon_ImporteQueNoEntraEnElCodigo_LanzaBusinessRule()
    {
        // The 2nd amount has 7 digits of cents (up to 99999.99): 95238.10 * 1.05 = 100000.01.
        await CambiarCuotaAsync(c => c.Importe = 95238.10m);

        var ex = await Assert.ThrowsAsync<BusinessRuleException>(() => GenerarAsync(AntesDelVencimiento));
        Assert.Contains("Pago Fácil", ex.Message);
    }

    [Fact]
    public async Task Cupon_ImporteMaximoQueEntra_Genera()
    {
        // 95238.09 * 1.05 = 99999.99, the largest 2nd amount that fits.
        await CambiarCuotaAsync(c => c.Importe = 95238.09m);

        var cupon = await GenerarAsync(AntesDelVencimiento);

        Assert.Equal(99999.99m, cupon.ImporteSegundoVencimiento);
        Assert.True(CodigoBarrasPagoFacil.Validar(cupon.CodigoBarras));
    }

    [Fact]
    public async Task Cupon_MismoDia_MismoCodigo()
    {
        var primero = await GenerarAsync(AntesDelVencimiento);
        var segundo = await GenerarAsync(AntesDelVencimiento);

        Assert.Equal(primero.CodigoBarras, segundo.CodigoBarras);
    }

    [Fact]
    public async Task Cupon_IdaYVuelta_RecuperaPolizaYCuota()
    {
        var cupon = await GenerarAsync(AntesDelVencimiento);

        var leidos = CodigoBarrasPagoFacil.Leer(cupon.CodigoBarras);

        Assert.Equal(CodigoEmpresa, leidos.CodigoEmpresa);
        Assert.Equal(1, leidos.NumeroPoliza);
        Assert.Equal(2, leidos.NumeroCuota);
        Assert.Equal(cupon.ImportePrimerVencimiento, leidos.ImportePrimerVencimiento);
        Assert.Equal(cupon.ImporteSegundoVencimiento, leidos.ImporteSegundoVencimiento);
    }

    [Fact]
    public async Task Cupon_CuotaPagada_Lanza()
    {
        await CambiarCuotaAsync(c => c.Pagar(new DateTime(2026, 11, 1, 0, 0, 0, DateTimeKind.Utc)));

        await Assert.ThrowsAsync<BusinessRuleException>(() => GenerarAsync(AntesDelVencimiento));
    }

    [Fact]
    public async Task Cupon_CuotaAnulada_Lanza()
    {
        await CambiarCuotaAsync(c => c.Anular());

        await Assert.ThrowsAsync<BusinessRuleException>(() => GenerarAsync(AntesDelVencimiento));
    }

    [Fact]
    public async Task Cupon_CuotaInexistente_NotFound()
    {
        await using var context = _fixture.CreateContext();

        await Assert.ThrowsAsync<NotFoundException>(() =>
            CrearServicio(context).GenerarAsync(Guid.NewGuid(), AntesDelVencimiento));
    }

    private async Task<Aseguradora.Application.Dtos.PagoFacil.CuponPagoFacilResponse> GenerarAsync(DateOnly hoy)
    {
        await using var context = _fixture.CreateContext();
        return await CrearServicio(context).GenerarAsync(CuotaId, hoy);
    }

    private async Task CambiarCuotaAsync(Action<Cuota> cambio)
    {
        await using var context = _fixture.CreateContext();
        var cuota = await context.Cuotas.FindAsync(CuotaId);
        Assert.NotNull(cuota);
        Assert.Equal(EstadoCuota.Pendiente, cuota.Estado);
        cambio(cuota);
        await context.SaveChangesAsync();
    }

    private static CuponPagoFacilService CrearServicio(AseguradoraDbContext context) =>
        new(new EfRepository<Cuota>(context), new EfRepository<Poliza>(context),
            new PagoFacilOpciones { CodigoEmpresa = CodigoEmpresa });
}
