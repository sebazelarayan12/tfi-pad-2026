using Aseguradora.Application.Dtos.PagoFacil;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.PagoFacil;
using Aseguradora.Data;
using Aseguradora.Data.Repositories;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Fakes;
using Aseguradora.Tests.Support;
using Microsoft.EntityFrameworkCore;

namespace Aseguradora.Tests.PagoFacil;

public sealed class RendicionServiceTests : IDisposable
{
    // 12:00 in Argentina (UTC-3) on 06/11/2026.
    private static readonly DateTimeOffset Ahora = new(2026, 11, 6, 15, 0, 0, TimeSpan.Zero);
    private const decimal ImporteCuota = 12000m;

    private readonly SqliteDbFixture _fixture = new();
    private readonly FakeAprobacionPagoService _aprobacion = new();

    public void Dispose() => _fixture.Dispose();

    private RendicionService CrearServicio(AseguradoraDbContext context) => new(
        new EfRepository<RendicionPagoFacil>(context),
        new EfRepository<Poliza>(context),
        new EfRepository<Cuota>(context),
        new EfRepository<Pago>(context),
        _aprobacion,
        new UnitOfWork(context),
        new PagoFacilOpciones { CodigoEmpresa = RendicionesDePrueba.CodigoEmpresa },
        new RelojFalso(Ahora));

    // Seed: policy POL-0000001 (number 1 in the barcode), installment 1 Pagada, 2 to 6 Pendiente.
    private static string LineaSemilla(int cuota, decimal importe = ImporteCuota) =>
        RendicionesDePrueba.LineaDeCuota(1, cuota, importe);

    private async Task<(RendicionResponse Resultado, AseguradoraDbContext Context)> ProcesarAsync(
        string nombre, params string[] lineas)
    {
        var context = _fixture.CreateContext();
        using var archivo = RendicionesDePrueba.Archivo(lineas);
        return (await CrearServicio(context).ProcesarAsync(nombre, archivo), context);
    }

    [Fact]
    public async Task Procesa_ArchivoMixto_AplicaValidasYReportaErrores()
    {
        var (resultado, context) = await ProcesarAsync("rendicion-20261106.txt",
            LineaSemilla(2), LineaSemilla(99), LineaSemilla(3));
        await using var _ = context;

        Assert.Equal(2, resultado.Procesadas);
        Assert.Equal(1, resultado.Rechazadas);
        Assert.Equal(3, resultado.CantidadRegistros);
        Assert.Equal(3 * ImporteCuota, resultado.ImporteTotal);
        var error = Assert.Single(resultado.Errores);
        Assert.Equal(2, error.Linea);
        Assert.Contains("cuota 99", error.Motivo, StringComparison.OrdinalIgnoreCase);

        Assert.Equal(2, _aprobacion.Llamadas.Count);
        await using var verificacion = _fixture.CreateContext();
        var pagos = await verificacion.Pagos.Include(p => p.PagoCuotas)
            .Where(p => p.Medio == MedioPago.PagoFacil).ToListAsync();
        Assert.Equal(2, pagos.Count);
        Assert.All(pagos, p =>
        {
            Assert.Equal(resultado.Id, p.RendicionId);
            Assert.Equal(SeedData.ClienteId, p.ClienteId);
            Assert.StartsWith("PAG-", p.Numero, StringComparison.Ordinal);
            Assert.Equal(ImporteCuota, Assert.Single(p.PagoCuotas).Importe);
        });
        Assert.Equal(
            [SeedData.CuotaId(2), SeedData.CuotaId(3)],
            pagos.Select(p => p.PagoCuotas.Single().CuotaId).Order());

        var rendicion = await verificacion.RendicionesPagoFacil.SingleAsync();
        Assert.Equal("rendicion-20261106.txt", rendicion.NombreArchivo);
        Assert.Equal(new DateOnly(2026, 11, 6), rendicion.FechaRendicion);
    }

    [Fact]
    public async Task AprobarAsync_RecibeLaFechaDePagoComoAcreditacion()
    {
        var (_, context) = await ProcesarAsync("fecha.txt", LineaSemilla(2));
        await using var _ = context;

        // 05/11/2026 00:00 in Argentina is 03:00 UTC.
        var (_, _, fecha) = Assert.Single(_aprobacion.Llamadas);
        Assert.Equal(new DateTime(2026, 11, 5, 3, 0, 0, DateTimeKind.Utc), fecha);
        Assert.Equal(DateTimeKind.Utc, fecha.Kind);
    }

    [Fact]
    public async Task ArchivoRepetido_Lanza()
    {
        var (_, context) = await ProcesarAsync("repetido.txt", LineaSemilla(2));
        await context.DisposeAsync();
        _aprobacion.Llamadas.Clear();

        var ex = await Assert.ThrowsAsync<BusinessRuleException>(() => ProcesarAsync("repetido.txt", LineaSemilla(3)));

        Assert.Contains("RN18", ex.Message, StringComparison.Ordinal);
        Assert.Empty(_aprobacion.Llamadas);
        await using var verificacion = _fixture.CreateContext();
        Assert.Equal(1, await verificacion.Pagos.CountAsync(p => p.Medio == MedioPago.PagoFacil));
        Assert.Equal(1, await verificacion.RendicionesPagoFacil.CountAsync());
    }

    [Fact]
    public async Task Linea_VerificadorInvalido_NoAprueba()
    {
        var codigo = RendicionesDePrueba.Codigo(1, 2, ImporteCuota);
        var alterado = codigo[..^1] + (char)('0' + (codigo[^1] - '0' + 1) % 10);

        var (resultado, context) = await ProcesarAsync("verificador.txt", RendicionesDePrueba.Linea(alterado, ImporteCuota));
        await using var _ = context;

        Assert.Contains("verificador", Assert.Single(resultado.Errores).Motivo, StringComparison.OrdinalIgnoreCase);
        await AsegurarQueNoSeCobroAsync();
    }

    [Fact]
    public async Task Linea_ImporteDistinto_NoAprueba()
    {
        var codigo = RendicionesDePrueba.Codigo(1, 2, ImporteCuota);

        var (resultado, context) = await ProcesarAsync("importe.txt", RendicionesDePrueba.Linea(codigo, ImporteCuota - 1m));
        await using var _ = context;

        Assert.Contains("importe", Assert.Single(resultado.Errores).Motivo, StringComparison.OrdinalIgnoreCase);
        await AsegurarQueNoSeCobroAsync();
    }

    [Fact]
    public async Task Linea_CuotaConRecargo_EsperaImporteMasRecargo()
    {
        await using (var context = _fixture.CreateContext())
        {
            var cuota = await context.Cuotas.SingleAsync(c => c.Id == SeedData.CuotaId(2));
            cuota.Estado = EstadoCuota.Vencida;
            cuota.Recargo = 600m;
            await context.SaveChangesAsync();
        }

        var (resultado, contexto) = await ProcesarAsync("recargo.txt", LineaSemilla(2, ImporteCuota + 600m));
        await using var _ = contexto;

        Assert.Empty(resultado.Errores);
        Assert.Equal(ImporteCuota + 600m, Assert.Single(_aprobacion.Llamadas).Pago.ImporteTotal);
    }

    [Fact]
    public async Task Linea_CuotaYaPagada_NoAprueba()
    {
        var (resultado, context) = await ProcesarAsync("pagada.txt", LineaSemilla(1));
        await using var _ = context;

        Assert.Contains("Pagada", Assert.Single(resultado.Errores).Motivo, StringComparison.Ordinal);
        await AsegurarQueNoSeCobroAsync();
    }

    [Theory]
    [InlineData("poliza")]
    [InlineData("empresa")]
    public async Task Linea_DeOtraPolizaOEmpresa_NoAprueba(string caso)
    {
        var codigo = caso == "poliza"
            ? RendicionesDePrueba.Codigo(4242, 2, ImporteCuota)
            : RendicionesDePrueba.Codigo(1, 2, ImporteCuota, empresa: 99999);

        var (resultado, context) = await ProcesarAsync("otra.txt", RendicionesDePrueba.Linea(codigo, ImporteCuota));
        await using var _ = context;

        Assert.Single(resultado.Errores);
        await AsegurarQueNoSeCobroAsync();
    }

    [Fact]
    public async Task IdExternoUnicoEntreArchivos()
    {
        var (_, primero) = await ProcesarAsync("dia-1.txt", LineaSemilla(2), LineaSemilla(3));
        await primero.DisposeAsync();
        var (_, segundo) = await ProcesarAsync("dia-2.txt", LineaSemilla(4));
        await segundo.DisposeAsync();

        await using var verificacion = _fixture.CreateContext();
        var ids = await verificacion.Pagos.Where(p => p.Medio == MedioPago.PagoFacil)
            .Select(p => p.IdExterno).OrderBy(id => id).ToListAsync();
        Assert.Equal(["dia-1.txt#1", "dia-1.txt#2", "dia-2.txt#1"], ids);
    }

    [Fact]
    public async Task CreaPagoPendienteAntesDeAprobar()
    {
        var guardadoAlAprobar = false;
        _aprobacion.AlAprobar = async pago =>
        {
            await using var otro = _fixture.CreateContext();
            guardadoAlAprobar = await otro.Pagos.AnyAsync(p => p.Id == pago.Id && p.Estado == EstadoPago.Pendiente);
        };

        var (_, context) = await ProcesarAsync("pendiente.txt", LineaSemilla(2));
        await using var _ = context;

        var (pago, estado, _) = Assert.Single(_aprobacion.Llamadas);
        Assert.Equal(EstadoPago.Pendiente, estado);
        Assert.Equal(MedioPago.PagoFacil, pago.Medio);
        Assert.Equal("pendiente.txt#1", pago.IdExterno);
        Assert.True(guardadoAlAprobar);
    }

    [Fact]
    public async Task AprobacionRechazada_SeReportaYNoDetieneElArchivo()
    {
        _aprobacion.AlAprobar = pago => pago.PagoCuotas.Single().CuotaId == SeedData.CuotaId(2)
            ? throw new BusinessRuleException("Rechazado por F4.")
            : Task.CompletedTask;

        var (resultado, context) = await ProcesarAsync("rechazo.txt", LineaSemilla(2), LineaSemilla(3));
        await using var _ = context;

        Assert.Equal(1, resultado.Procesadas);
        var error = Assert.Single(resultado.Errores);
        Assert.Equal(1, error.Linea);
        Assert.Equal("Rechazado por F4.", error.Motivo);
    }

    [Fact]
    public async Task LineaMalFormada_LanzaConElDetalleYNoGuardaNada()
    {
        var ex = await Assert.ThrowsAsync<BusinessRuleException>(() =>
            ProcesarAsync("mal.txt", LineaSemilla(2), "123"));

        Assert.Contains("línea 2", ex.Message, StringComparison.Ordinal);
        await AsegurarQueNoSeCobroAsync();
        await using var verificacion = _fixture.CreateContext();
        Assert.False(await verificacion.RendicionesPagoFacil.AnyAsync());
    }

    [Fact]
    public async Task ArchivoMayorAlLimite_Lanza()
    {
        await using var context = _fixture.CreateContext();
        using var grande = new MemoryStream(new byte[RendicionService.TamanoMaximoBytes + 1]);

        var ex = await Assert.ThrowsAsync<BusinessRuleException>(() => CrearServicio(context).ProcesarAsync("grande.txt", grande));

        Assert.Contains("5 MB", ex.Message, StringComparison.Ordinal);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("rendición.txt")]
    [InlineData("con espacio.txt")]
    public async Task NombreInvalido_Lanza(string nombre)
    {
        await Assert.ThrowsAsync<BusinessRuleException>(() => ProcesarAsync(nombre, LineaSemilla(2)));
    }

    [Fact]
    public async Task NombreConRuta_GuardaSoloElNombre()
    {
        var (resultado, context) = await ProcesarAsync("C:\\descargas/rendicion.txt", LineaSemilla(2));
        await using var _ = context;

        Assert.Equal("rendicion.txt", resultado.NombreArchivo);
    }

    [Fact]
    public async Task Listar_DevuelveDeLaMasNuevaALaMasVieja()
    {
        await using (var context = _fixture.CreateContext())
        {
            context.RendicionesPagoFacil.AddRange(
                new RendicionPagoFacil { NombreArchivo = "vieja.txt", FechaProceso = Ahora.UtcDateTime.AddDays(-2) },
                new RendicionPagoFacil { NombreArchivo = "nueva.txt", FechaProceso = Ahora.UtcDateTime },
                new RendicionPagoFacil { NombreArchivo = "media.txt", FechaProceso = Ahora.UtcDateTime.AddDays(-1) });
            await context.SaveChangesAsync();
        }

        await using var lectura = _fixture.CreateContext();
        var historial = await CrearServicio(lectura).ListarAsync();

        Assert.Equal(["nueva.txt", "media.txt", "vieja.txt"], historial.Select(h => h.NombreArchivo));
    }

    private async Task AsegurarQueNoSeCobroAsync()
    {
        Assert.Empty(_aprobacion.Llamadas);
        await using var verificacion = _fixture.CreateContext();
        Assert.False(await verificacion.Pagos.AnyAsync(p => p.Medio == MedioPago.PagoFacil));
    }
}
