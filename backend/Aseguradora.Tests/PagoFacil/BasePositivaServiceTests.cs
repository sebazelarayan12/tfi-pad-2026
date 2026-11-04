using System.Globalization;
using Aseguradora.Application.Dtos.PagoFacil;
using Aseguradora.Application.PagoFacil;
using Aseguradora.Data;
using Aseguradora.Data.Repositories;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Support;
using Microsoft.Extensions.Logging.Abstractions;
using static Aseguradora.Application.PagoFacil.LayoutBasePositivaPagoFacil;

namespace Aseguradora.Tests.PagoFacil;

/// <summary>
/// Uses the seeded policy POL-0000001 (Vigente, client DNI 30123456): installment 1 is Pagada and 2 to 6
/// are Pendiente for 12000, due on the 10th from 10/12/2026.
/// </summary>
public sealed class BasePositivaServiceTests : IDisposable
{
    private const int CodigoEmpresa = 12345;
    private const string DniSeed = "30123456";

    /// <summary>Installment 2 (due 10/12/2026) is already past due; 3 to 6 are not.</summary>
    private static readonly DateOnly Hoy = new(2026, 12, 15);

    // Offsets of the detail record, as documented in LayoutBasePositivaPagoFacil.
    private const int InicioDni = 1;
    private const int InicioNumeroCliente = InicioDni + AnchoDni;
    private const int InicioNumeroCuota = InicioNumeroCliente + AnchoNumeroCliente;
    private const int InicioImporte1 = InicioNumeroCuota + AnchoNumeroCuota;
    private const int InicioCodigoBarras = LongitudRegistro - AnchoCodigoBarras;

    private readonly SqliteDbFixture _fixture = new();

    public void Dispose() => _fixture.Dispose();

    [Fact]
    public async Task Incluye_PendientesYVencidas()
    {
        await CambiarCuotasAsync((cuota, _) =>
        {
            if (cuota.Numero == 2) cuota.Vencer(Hoy);
            if (cuota.Numero >= 5) cuota.Pagar(DateTime.UtcNow);
        });

        var archivo = await GenerarAsync();
        var detalles = Detalles(archivo);

        Assert.Equal(3, archivo.CantidadRegistros);
        Assert.Equal(new[] { 2, 3, 4 }, detalles.Select(NumeroCuota));
        // 12600 (installment 2 with the 5% surcharge, RN08) + 12000 + 12000.
        Assert.Equal(36600.00m, archivo.ImporteTotal);
        Assert.Equal(archivo.ImporteTotal, detalles.Sum(Importe1));
        Assert.All(detalles, d => Assert.Equal(DniSeed, d.Substring(InicioDni, AnchoDni)));
        Assert.All(detalles, d => Assert.Equal("0000001", d.Substring(InicioNumeroCliente, AnchoNumeroCliente)));
        Assert.All(detalles, d => Assert.True(CodigoBarrasPagoFacil.Validar(d[InicioCodigoBarras..])));
    }

    [Fact]
    public async Task Detalle_UsaElMismoCodigoQueElCupon()
    {
        var archivo = await GenerarAsync();

        await using var context = _fixture.CreateContext();
        var cupon = await new CuponPagoFacilService(
                new EfRepository<Cuota>(context), new EfRepository<Poliza>(context), Opciones())
            .GenerarAsync(SeedData.CuotaId(2), Hoy);
        Assert.Equal(cupon.CodigoBarras, Detalles(archivo).First()[InicioCodigoBarras..]);
    }

    [Theory]
    [InlineData(EstadoCuota.Pagada, EstadoPoliza.Vigente)]
    [InlineData(EstadoCuota.Anulada, EstadoPoliza.Vigente)]
    [InlineData(EstadoCuota.Pendiente, EstadoPoliza.Cancelada)]
    [InlineData(EstadoCuota.Pendiente, EstadoPoliza.Vencida)]
    [InlineData(EstadoCuota.Vencida, EstadoPoliza.Cancelada)]
    public async Task Excluye_PagadasAnuladasYPolizasInactivas(EstadoCuota estadoCuota, EstadoPoliza estadoPoliza)
    {
        await CambiarCuotasAsync((cuota, poliza) =>
        {
            cuota.Estado = estadoCuota;
            poliza.Estado = estadoPoliza;
        });

        var archivo = await GenerarAsync();

        Assert.Empty(Detalles(archivo));
    }

    [Theory]
    [InlineData(EstadoPoliza.Pendiente)]
    [InlineData(EstadoPoliza.Suspendida)]
    public async Task Incluye_PolizasPendientesYSuspendidas(EstadoPoliza estadoPoliza)
    {
        await CambiarCuotasAsync((_, poliza) => poliza.Estado = estadoPoliza);

        var archivo = await GenerarAsync();

        Assert.Equal(5, archivo.CantidadRegistros);
    }

    [Fact]
    public async Task DniMalFormado_DejaAfueraSoloEsaPoliza()
    {
        await using (var context = _fixture.CreateContext())
        {
            var otra = await PolizasDePrueba.AgregarPolizaAsync(context, EstadoPoliza.Vigente, DateTime.UtcNow);
            var cliente = await context.Clientes.FindAsync(otra.ClienteId);
            Assert.NotNull(cliente);
            cliente.Dni = "12A45";
            await context.SaveChangesAsync();
        }

        var archivo = await GenerarAsync();

        // Only the 5 Pendiente installments of the seeded policy; the file is still generated.
        Assert.Equal(5, archivo.CantidadRegistros);
        Assert.All(Detalles(archivo), d => Assert.Equal(DniSeed, d.Substring(InicioDni, AnchoDni)));
        // 5 x 12000, plus the 5% of installment 2, already past due on Hoy (RN08).
        Assert.Equal(60600.00m, archivo.ImporteTotal);
    }

    [Fact]
    public async Task LineasDeAnchoFijo()
    {
        await using (var context = _fixture.CreateContext())
            await PolizasDePrueba.AgregarPolizaAsync(context, EstadoPoliza.Vigente, DateTime.UtcNow);

        var archivo = await GenerarAsync();
        var lineas = Lineas(archivo);

        Assert.True(Detalles(archivo).Count > 5);
        Assert.All(lineas, l => Assert.Equal(LongitudRegistro, l.Length));
        Assert.All(lineas, l => Assert.True(l.All(char.IsAscii)));
        Assert.EndsWith(FinDeLinea, archivo.Contenido);
    }

    [Fact]
    public async Task EncabezadoYTotalConsistentes()
    {
        await CambiarCuotasAsync((cuota, _) => cuota.Vencer(Hoy));

        var archivo = await GenerarAsync();
        var lineas = Lineas(archivo);
        var detalles = Detalles(archivo);
        var encabezado = lineas[0];
        var final = lineas[^1];

        Assert.Equal(TipoEncabezado, encabezado[0]);
        Assert.Equal("12345", encabezado.Substring(1, AnchoCodigoEmpresa));
        Assert.Equal("20261215", encabezado.Substring(1 + AnchoCodigoEmpresa, AnchoFecha));
        Assert.Equal(TipoFinal, final[0]);
        Assert.Equal(detalles.Count, int.Parse(final.Substring(1, AnchoCantidad), CultureInfo.InvariantCulture));
        Assert.Equal(detalles.Sum(Importe1), Centavos(final.Substring(1 + AnchoCantidad, AnchoTotal)));
        Assert.Equal(archivo.ImporteTotal, detalles.Sum(Importe1));
        Assert.Equal(detalles.Count + 2, lineas.Count);
        Assert.Equal("BASEPOS_12345_20261215.txt", archivo.NombreArchivo);
    }

    [Fact]
    public async Task SinDeudas_ArchivoVacio()
    {
        await CambiarCuotasAsync((_, poliza) => poliza.Estado = EstadoPoliza.Cancelada);

        var archivo = await GenerarAsync();
        var final = Lineas(archivo)[^1];

        Assert.Empty(Detalles(archivo));
        Assert.Equal(2, Lineas(archivo).Count);
        Assert.Equal(0, archivo.CantidadRegistros);
        Assert.Equal(0.00m, archivo.ImporteTotal);
        Assert.Equal(0.00m, Centavos(final.Substring(1 + AnchoCantidad, AnchoTotal)));
    }

    private async Task<ArchivoBasePositiva> GenerarAsync()
    {
        await using var context = _fixture.CreateContext();
        return await new BasePositivaService(
            new EfRepository<Cuota>(context), Opciones(), NullLogger<BasePositivaService>.Instance).GenerarAsync(Hoy);
    }

    /// <summary>Applies a change to installments 2 to 6 of the seeded policy and to the policy itself.</summary>
    private async Task CambiarCuotasAsync(Action<Cuota, Poliza> cambio)
    {
        await using var context = _fixture.CreateContext();
        var poliza = await context.Polizas.FindAsync(SeedData.PolizaId);
        Assert.NotNull(poliza);
        foreach (var cuota in context.Cuotas.Where(c => c.PolizaId == SeedData.PolizaId && c.Numero > 1).ToList())
            cambio(cuota, poliza);
        await context.SaveChangesAsync();
    }

    private static PagoFacilOpciones Opciones() => new() { CodigoEmpresa = CodigoEmpresa };

    private static List<string> Lineas(ArchivoBasePositiva archivo) =>
        archivo.Contenido.Split(FinDeLinea, StringSplitOptions.RemoveEmptyEntries).ToList();

    private static List<string> Detalles(ArchivoBasePositiva archivo) =>
        Lineas(archivo).Where(l => l[0] == TipoDetalle).ToList();

    private static int NumeroCuota(string detalle) =>
        int.Parse(detalle.Substring(InicioNumeroCuota, AnchoNumeroCuota), CultureInfo.InvariantCulture);

    private static decimal Importe1(string detalle) => Centavos(detalle.Substring(InicioImporte1, AnchoImporte));

    private static decimal Centavos(string campo) =>
        long.Parse(campo, NumberStyles.None, CultureInfo.InvariantCulture) / CentavosPorPeso;
}
