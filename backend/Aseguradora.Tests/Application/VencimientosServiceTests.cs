using Aseguradora.Application.Services;
using Aseguradora.Data;
using Aseguradora.Data.Repositories;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Tests.Builders;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Support;
using Microsoft.EntityFrameworkCore;

namespace Aseguradora.Tests.Application;

/// <summary>
/// Installments built with <see cref="CuotaBuilder"/> fall due on the 10th: cuota 1 on 10/11/2026,
/// cuota 2 on 10/12/2026, cuota 3 on 10/01/2027.
/// </summary>
public sealed class VencimientosServiceTests : IDisposable
{
    private static readonly DateTimeOffset Ahora = new(2026, 12, 11, 3, 10, 0, TimeSpan.Zero);

    private readonly SqliteDbFixture _fixture = new();

    public void Dispose() => _fixture.Dispose();

    [Fact]
    public async Task RecargoAVencidas()
    {
        var poliza = await CrearPolizaAsync(EstadoPoliza.Vigente, cuotasPagadas: 1, cuotas: 3);

        await EjecutarAsync(new DateOnly(2026, 12, 11));

        var cuota2 = await CuotaAsync(poliza, 2);
        Assert.Equal(EstadoCuota.Vencida, cuota2.Estado);
        Assert.Equal(600.00m, cuota2.Recargo);
        Assert.Equal(EstadoCuota.Pendiente, (await CuotaAsync(poliza, 3)).Estado);
    }

    [Fact]
    public async Task SinRecargoEnDiaDeVencimiento()
    {
        var poliza = await CrearPolizaAsync(EstadoPoliza.Vigente, cuotasPagadas: 1, cuotas: 3);

        await EjecutarAsync(new DateOnly(2026, 12, 10));

        var cuota2 = await CuotaAsync(poliza, 2);
        Assert.Equal(EstadoCuota.Pendiente, cuota2.Estado);
        Assert.Equal(0m, cuota2.Recargo);
    }

    [Fact]
    public async Task CancelaPolizaSiCuota1Vence()
    {
        var poliza = await CrearPolizaAsync(EstadoPoliza.Pendiente, cuotasPagadas: 0, cuotas: 3);

        await EjecutarAsync(new DateOnly(2026, 11, 11));

        await using var context = _fixture.CreateContext();
        var guardada = await context.Polizas.Include(p => p.Cuotas).SingleAsync(p => p.Id == poliza.Id);
        Assert.Equal(EstadoPoliza.Cancelada, guardada.Estado);
        Assert.Equal(Ahora.UtcDateTime, guardada.FechaCancelacion);
        Assert.Contains("RN19", guardada.MotivoCancelacion);
        Assert.All(guardada.Cuotas, c => Assert.Equal(EstadoCuota.Anulada, c.Estado));
    }

    [Fact]
    public async Task NoCancelaPendienteAntesDeQueVenzaLaCuota1()
    {
        var poliza = await CrearPolizaAsync(EstadoPoliza.Pendiente, cuotasPagadas: 0, cuotas: 3);

        await EjecutarAsync(new DateOnly(2026, 11, 10));

        Assert.Equal(EstadoPoliza.Pendiente, (await PolizaAsync(poliza)).Estado);
    }

    [Fact]
    public async Task SuspendeConDosVencidas()
    {
        var poliza = await CrearPolizaAsync(EstadoPoliza.Vigente, cuotasPagadas: 1, cuotas: 6);

        await EjecutarAsync(new DateOnly(2027, 1, 11));

        Assert.Equal(EstadoPoliza.Suspendida, (await PolizaAsync(poliza)).Estado);
    }

    [Fact]
    public async Task NoSuspendeConUnaVencida()
    {
        var poliza = await CrearPolizaAsync(EstadoPoliza.Vigente, cuotasPagadas: 1, cuotas: 6);

        await EjecutarAsync(new DateOnly(2026, 12, 11));

        Assert.Equal(EstadoPoliza.Vigente, (await PolizaAsync(poliza)).Estado);
    }

    [Theory]
    [InlineData(EstadoPoliza.Vigente)]
    [InlineData(EstadoPoliza.Suspendida)]
    public async Task VenceAlLlegarFechaFin(EstadoPoliza estado)
    {
        var hoy = new DateOnly(2026, 10, 20);
        var poliza = await CrearPolizaAsync(estado, cuotasPagadas: 1, cuotas: 1, fechaFin: hoy);

        await EjecutarAsync(hoy);

        Assert.Equal(EstadoPoliza.Vencida, (await PolizaAsync(poliza)).Estado);
    }

    [Fact]
    public async Task NoVenceAntesDeLaFechaFin()
    {
        var hoy = new DateOnly(2026, 10, 20);
        var poliza = await CrearPolizaAsync(EstadoPoliza.Vigente, cuotasPagadas: 1, cuotas: 1, fechaFin: hoy.AddDays(1));

        await EjecutarAsync(hoy);

        Assert.Equal(EstadoPoliza.Vigente, (await PolizaAsync(poliza)).Estado);
    }

    [Fact]
    public async Task PendienteConFechaFinCumplida_NoVence()
    {
        var hoy = new DateOnly(2026, 10, 20);
        var poliza = await CrearPolizaAsync(EstadoPoliza.Pendiente, cuotasPagadas: 0, cuotas: 1, fechaFin: hoy);

        await EjecutarAsync(hoy);

        Assert.Equal(EstadoPoliza.Pendiente, (await PolizaAsync(poliza)).Estado);
    }

    [Fact]
    public async Task EjecutarDosVeces_EsIdempotente()
    {
        var suspendida = await CrearPolizaAsync(EstadoPoliza.Vigente, cuotasPagadas: 1, cuotas: 6);
        var cancelada = await CrearPolizaAsync(EstadoPoliza.Pendiente, cuotasPagadas: 0, cuotas: 6);
        var hoy = new DateOnly(2027, 1, 11);

        var primera = await EjecutarAsync(hoy);
        var recargoTrasPrimera = (await CuotaAsync(suspendida, 2)).Recargo;
        var segunda = await EjecutarAsync(hoy);

        Assert.True(primera.CuotasVencidas >= 2);
        Assert.Equal(new ResumenVencimientos(0, 0, 0, 0), segunda);
        Assert.Equal(recargoTrasPrimera, (await CuotaAsync(suspendida, 2)).Recargo);
        Assert.Equal(EstadoPoliza.Suspendida, (await PolizaAsync(suspendida)).Estado);
        Assert.Equal(EstadoPoliza.Cancelada, (await PolizaAsync(cancelada)).Estado);
    }

    private async Task<ResumenVencimientos> EjecutarAsync(DateOnly hoy)
    {
        await using var context = _fixture.CreateContext();
        return await CrearServicio(context).EjecutarAsync(hoy, CancellationToken.None);
    }

    private static VencimientosService CrearServicio(AseguradoraDbContext context) => new(
        new EfRepository<Poliza>(context),
        new EfRepository<Cuota>(context),
        new UnitOfWork(context),
        new RelojFalso(Ahora));

    private async Task<Poliza> CrearPolizaAsync(
        EstadoPoliza estado, int cuotasPagadas, int cuotas, DateOnly? fechaFin = null)
    {
        await using var context = _fixture.CreateContext();
        var cliente = new ClienteBuilder().Construir();
        var vehiculo = new VehiculoBuilder().DeCliente(cliente).Construir();
        var plan = new PlanBuilder().Construir();
        var poliza = new PolizaBuilder()
            .Para(cliente, vehiculo, plan)
            .Con(p =>
            {
                p.Estado = estado;
                p.VigenciaMeses = cuotas;
                p.FechaFin = fechaFin ?? new DateOnly(2027, 10, 15);
            })
            .Construir();

        for (var numero = 1; numero <= cuotas; numero++)
        {
            var pagada = numero <= cuotasPagadas;
            poliza.Cuotas.Add(new CuotaBuilder()
                .DePoliza(poliza)
                .Numero(numero)
                .Con(c =>
                {
                    if (!pagada)
                        return;
                    c.Estado = EstadoCuota.Pagada;
                    c.FechaPago = new DateTime(2026, 10, 15, 0, 0, 0, DateTimeKind.Utc);
                })
                .Construir());
        }

        context.Polizas.Add(poliza);
        await context.SaveChangesAsync();
        return poliza;
    }

    private async Task<Poliza> PolizaAsync(Poliza poliza)
    {
        await using var context = _fixture.CreateContext();
        return await context.Polizas.SingleAsync(p => p.Id == poliza.Id);
    }

    private async Task<Cuota> CuotaAsync(Poliza poliza, int numero)
    {
        await using var context = _fixture.CreateContext();
        return await context.Cuotas.SingleAsync(c => c.PolizaId == poliza.Id && c.Numero == numero);
    }
}
