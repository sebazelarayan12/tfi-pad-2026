using Aseguradora.Api.BackgroundJobs;
using Aseguradora.Application.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace Aseguradora.Tests.BackgroundJobs;

public sealed class ReintentoFacturasJobTests
{
    [Fact]
    public async Task LlamaServicioYContinuaTrasExcepcion_UsaIntervaloConfigurado()
    {
        var fake = new FacturacionFalsa();
        var reloj = new RelojManual();
        await using var servicios = new ServiceCollection().AddScoped<IFacturacionService>(_ => fake).BuildServiceProvider();
        using var job = new ReintentoFacturasJob(servicios.GetRequiredService<IServiceScopeFactory>(), reloj,
            Options.Create(new ReintentoFacturasOpciones { IntervaloReintentoMinutos = 7 }), NullLogger<ReintentoFacturasJob>.Instance);
        await job.StartAsync(default);
        var timer = await reloj.Creado.Task.WaitAsync(TimeSpan.FromSeconds(5));
        Assert.Equal(1, fake.Llamadas);
        Assert.Equal(TimeSpan.FromMinutes(7), reloj.Espera);
        timer.Disparar();
        await fake.Segunda.Task.WaitAsync(TimeSpan.FromSeconds(5));
        await job.StopAsync(default);
        Assert.Equal(2, fake.Llamadas);
    }

    [Fact]
    public async Task Deshabilitado_NoConsultaBase()
    {
        await using var servicios = new ServiceCollection().BuildServiceProvider();
        using var job = new ReintentoFacturasJob(servicios.GetRequiredService<IServiceScopeFactory>(), TimeProvider.System,
            Options.Create(new ReintentoFacturasOpciones { ReintentosHabilitados = false }), NullLogger<ReintentoFacturasJob>.Instance);
        await job.StartAsync(default);
        await job.StopAsync(default);
    }

    private sealed class FacturacionFalsa : IFacturacionService
    {
        public int Llamadas { get; private set; }
        public TaskCompletionSource Segunda { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public Task ReintentarPendientesAsync(CancellationToken ct = default)
        {
            Llamadas++;
            if (Llamadas == 1) throw new InvalidOperationException("Fallo simulado.");
            Segunda.TrySetResult();
            return Task.CompletedTask;
        }
        public Task EmitirAsync(Guid pagoId, CancellationToken ct = default) => throw new NotSupportedException();
    }

    private sealed class RelojManual : TimeProvider
    {
        public TimeSpan Espera { get; private set; }
        public TaskCompletionSource<TimerManual> Creado { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public override ITimer CreateTimer(TimerCallback callback, object? state, TimeSpan dueTime, TimeSpan period)
        {
            Espera = dueTime;
            var timer = new TimerManual(callback, state);
            Creado.TrySetResult(timer);
            return timer;
        }
    }
    private sealed class TimerManual(TimerCallback callback, object? state) : ITimer
    {
        public void Disparar() => callback(state);
        public bool Change(TimeSpan dueTime, TimeSpan period) => true;
        public void Dispose() { }
        public ValueTask DisposeAsync() => ValueTask.CompletedTask;
    }
}
