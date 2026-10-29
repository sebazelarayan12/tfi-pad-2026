using Aseguradora.Api.BackgroundJobs;
using Aseguradora.Application.Services;
using Aseguradora.Data;
using Aseguradora.Data.Repositories;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Interfaces;
using Aseguradora.Tests.Builders;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Support;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

namespace Aseguradora.Tests.BackgroundJobs;

public sealed class VencimientosJobTests : IDisposable
{
    // 00:10 in Argentina on 11/12/2026: cuota 2 (due 10/12) is one day overdue.
    private static readonly DateTimeOffset OnceDeDiciembre = new(2026, 12, 11, 3, 10, 0, TimeSpan.Zero);

    private readonly SqliteDbFixture _fixture = new();

    public void Dispose() => _fixture.Dispose();

    [Fact]
    public async Task CorreAlArrancarSiNoProcesoHoy()
    {
        var cuotaId = await CrearCuotaVencidaAsync();

        var corrio = await CrearJob(OnceDeDiciembre).EjecutarSiCorrespondeAsync(CancellationToken.None);

        Assert.True(corrio);
        await using var context = _fixture.CreateContext();
        Assert.Equal(EstadoCuota.Vencida, (await context.Cuotas.SingleAsync(c => c.Id == cuotaId)).Estado);
        var control = await context.Set<ControlProceso>().SingleAsync(c => c.Nombre == VencimientosJob.NombreProceso);
        Assert.Equal(new DateOnly(2026, 12, 11), control.UltimaFechaProcesada);
    }

    [Fact]
    public async Task GuardaCambiosYControlEnUnSoloSaveChanges()
    {
        var cuotaId = await CrearCuotaVencidaAsync();
        var guardados = new List<int>();

        await CrearJob(OnceDeDiciembre, guardados: guardados).EjecutarSiCorrespondeAsync(CancellationToken.None);

        // One SaveChanges stores the overdue installment and the control row together.
        Assert.Single(guardados);
        await using var context = _fixture.CreateContext();
        Assert.Equal(EstadoCuota.Vencida, (await context.Cuotas.SingleAsync(c => c.Id == cuotaId)).Estado);
        Assert.True(await context.Set<ControlProceso>().AnyAsync(c => c.Nombre == VencimientosJob.NombreProceso));
    }

    [Fact]
    public async Task SiFallaElGuardado_NoQuedaNiElControlNiLosCambios()
    {
        var cuotaId = await CrearCuotaVencidaAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            CrearJob(OnceDeDiciembre, fallaAlGuardar: true).EjecutarSiCorrespondeAsync(CancellationToken.None));

        await using var context = _fixture.CreateContext();
        Assert.Equal(EstadoCuota.Pendiente, (await context.Cuotas.SingleAsync(c => c.Id == cuotaId)).Estado);
        Assert.False(await context.Set<ControlProceso>().AnyAsync());
    }

    [Fact]
    public async Task NoCorreSiYaProcesoHoy()
    {
        var cuotaId = await CrearCuotaVencidaAsync();
        await using (var context = _fixture.CreateContext())
        {
            context.Add(new ControlProceso
            {
                Nombre = VencimientosJob.NombreProceso,
                UltimaFechaProcesada = new DateOnly(2026, 12, 11)
            });
            await context.SaveChangesAsync();
        }

        var corrio = await CrearJob(OnceDeDiciembre).EjecutarSiCorrespondeAsync(CancellationToken.None);

        Assert.False(corrio);
        await using var verificacion = _fixture.CreateContext();
        Assert.Equal(EstadoCuota.Pendiente, (await verificacion.Cuotas.SingleAsync(c => c.Id == cuotaId)).Estado);
    }

    [Fact]
    public async Task UsaFechaArgentina()
    {
        // 02:00 UTC on 11/12 is 23:00 on 10/12 in Argentina (spec 11.3): cuota 2 is due today, not overdue.
        var cuotaId = await CrearCuotaVencidaAsync();

        await CrearJob(new DateTimeOffset(2026, 12, 11, 2, 0, 0, TimeSpan.Zero))
            .EjecutarSiCorrespondeAsync(CancellationToken.None);

        await using var context = _fixture.CreateContext();
        Assert.Equal(EstadoCuota.Pendiente, (await context.Cuotas.SingleAsync(c => c.Id == cuotaId)).Estado);
        var control = await context.Set<ControlProceso>().SingleAsync(c => c.Nombre == VencimientosJob.NombreProceso);
        Assert.Equal(new DateOnly(2026, 12, 10), control.UltimaFechaProcesada);
    }

    [Fact]
    public async Task ReiniciarAMitadDeDia_NoDuplica()
    {
        var cuotaId = await CrearCuotaVencidaAsync();
        Assert.True(await CrearJob(OnceDeDiciembre).EjecutarSiCorrespondeAsync(CancellationToken.None));

        // A new instance is what a container restart at 15:00 the same day gets.
        var reiniciado = CrearJob(OnceDeDiciembre.AddHours(15));
        Assert.False(await reiniciado.EjecutarSiCorrespondeAsync(CancellationToken.None));

        await using var context = _fixture.CreateContext();
        Assert.Equal(600.00m, (await context.Cuotas.SingleAsync(c => c.Id == cuotaId)).Recargo);
        Assert.Equal(1, await context.Set<ControlProceso>().CountAsync());
    }

    [Fact]
    public async Task AlDiaSiguiente_VuelveACorrer()
    {
        await CrearCuotaVencidaAsync();
        Assert.True(await CrearJob(OnceDeDiciembre).EjecutarSiCorrespondeAsync(CancellationToken.None));

        Assert.True(await CrearJob(OnceDeDiciembre.AddDays(1)).EjecutarSiCorrespondeAsync(CancellationToken.None));

        await using var context = _fixture.CreateContext();
        var control = await context.Set<ControlProceso>().SingleAsync();
        Assert.Equal(new DateOnly(2026, 12, 12), control.UltimaFechaProcesada);
    }

    [Theory]
    [InlineData(15, 0, 12 * 60 + 5)]   // 12:00 in Argentina: next run tomorrow at 00:05.
    [InlineData(3, 0, 5)]              // 00:00 in Argentina: today at 00:05.
    [InlineData(3, 5, 24 * 60)]        // 00:05 exactly: already ran, next one tomorrow.
    public void HastaLaProximaEjecucion_ApuntaALas0005DeArgentina(int horaUtc, int minutoUtc, int minutosEsperados)
    {
        var reloj = new RelojFalso(new DateTimeOffset(2026, 10, 29, horaUtc, minutoUtc, 0, TimeSpan.Zero));

        Assert.Equal(TimeSpan.FromMinutes(minutosEsperados), VencimientosJob.HastaLaProximaEjecucion(reloj));
    }

    [Fact]
    public async Task UnaFallaNoDetieneElHost()
    {
        var services = new ServiceCollection();
        services.AddScoped<IRepository<ControlProceso>>(_ => throw new InvalidOperationException("Base caída."));
        await using var proveedor = services.BuildServiceProvider();
        var job = new VencimientosJob(
            proveedor.GetRequiredService<IServiceScopeFactory>(),
            new RelojFalso(OnceDeDiciembre),
            new ConfigurationBuilder().Build(),
            NullLogger<VencimientosJob>.Instance);

        await job.StartAsync(CancellationToken.None);
        await Task.Delay(TimeSpan.FromMilliseconds(200));

        Assert.NotNull(job.ExecuteTask);
        Assert.False(job.ExecuteTask.IsFaulted);
        await job.StopAsync(CancellationToken.None);
    }

    [Fact]
    public async Task Deshabilitado_NoCorre()
    {
        var cuotaId = await CrearCuotaVencidaAsync();
        var configuracion = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { [VencimientosJob.ClaveHabilitado] = "false" })
            .Build();
        var job = CrearJob(OnceDeDiciembre, configuracion);

        await job.StartAsync(CancellationToken.None);
        await job.ExecuteTask!;

        await using var context = _fixture.CreateContext();
        Assert.Equal(EstadoCuota.Pendiente, (await context.Cuotas.SingleAsync(c => c.Id == cuotaId)).Estado);
        Assert.False(await context.Set<ControlProceso>().AnyAsync());
    }

    private VencimientosJob CrearJob(
        DateTimeOffset ahora, IConfiguration? configuracion = null, List<int>? guardados = null, bool fallaAlGuardar = false)
    {
        var reloj = new RelojFalso(ahora);
        var services = new ServiceCollection();
        services.AddScoped<AseguradoraDbContext>(_ => _fixture.CreateContext());
        services.AddScoped(typeof(IRepository<>), typeof(EfRepository<>));
        services.AddScoped<IUnitOfWork>(sp =>
            new UnitOfWorkObservado(new UnitOfWork(sp.GetRequiredService<AseguradoraDbContext>()), guardados, fallaAlGuardar));
        services.AddScoped<IVencimientosService, VencimientosService>();
        services.AddSingleton<TimeProvider>(reloj);
        var proveedor = services.BuildServiceProvider();

        return new VencimientosJob(
            proveedor.GetRequiredService<IServiceScopeFactory>(),
            reloj,
            configuracion ?? new ConfigurationBuilder().Build(),
            NullLogger<VencimientosJob>.Instance);
    }

    /// <summary>A Vigente policy whose cuota 2 falls due on 10/12/2026; returns that installment's id.</summary>
    private async Task<Guid> CrearCuotaVencidaAsync()
    {
        await using var context = _fixture.CreateContext();
        var cliente = new ClienteBuilder().Construir();
        var vehiculo = new VehiculoBuilder().DeCliente(cliente).Construir();
        var plan = new PlanBuilder().Construir();
        var poliza = new PolizaBuilder()
            .Para(cliente, vehiculo, plan)
            .Con(p => p.Estado = EstadoPoliza.Vigente)
            .Construir();
        var cuota1 = new CuotaBuilder().DePoliza(poliza).Numero(1)
            .Con(c =>
            {
                c.Estado = EstadoCuota.Pagada;
                c.FechaPago = new DateTime(2026, 10, 15, 0, 0, 0, DateTimeKind.Utc);
            })
            .Construir();
        var cuota2 = new CuotaBuilder().DePoliza(poliza).Numero(2).Construir();
        poliza.Cuotas.Add(cuota1);
        poliza.Cuotas.Add(cuota2);

        context.Polizas.Add(poliza);
        await context.SaveChangesAsync();
        return cuota2.Id;
    }

    /// <summary>Records each SaveChanges, or fails it, to check how the job saves.</summary>
    private sealed class UnitOfWorkObservado(IUnitOfWork real, List<int>? guardados, bool falla) : IUnitOfWork
    {
        public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            if (falla)
                throw new InvalidOperationException("Falla simulada al guardar.");

            var filas = await real.SaveChangesAsync(cancellationToken);
            guardados?.Add(filas);
            return filas;
        }
    }
}
