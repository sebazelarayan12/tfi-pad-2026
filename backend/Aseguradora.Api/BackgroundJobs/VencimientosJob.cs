using Aseguradora.Application.Services;
using Aseguradora.Application.Tiempo;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Interfaces;

namespace Aseguradora.Api.BackgroundJobs;

/// <summary>
/// Runs <see cref="IVencimientosService"/> once a day at 00:05 Argentina time (CU14, spec 11.3). On startup
/// it runs right away if today is not processed yet, so a restart in the middle of the day neither skips
/// nor repeats the day. The last processed date lives in <see cref="ControlProceso"/>. The API runs as a
/// single replica (spec 11.2), so no lock between instances is needed.
/// </summary>
public sealed class VencimientosJob(
    IServiceScopeFactory scopeFactory,
    TimeProvider reloj,
    IConfiguration configuration,
    ILogger<VencimientosJob> logger) : BackgroundService
{
    /// <summary>Key of this process in <see cref="ControlProceso"/>.</summary>
    public const string NombreProceso = "VencimientosDiarios";

    /// <summary>Set to false to turn the job off (the integration tests do).</summary>
    public const string ClaveHabilitado = "Vencimientos:Habilitado";

    /// <summary>Daily run time, Argentina time.</summary>
    public static readonly TimeOnly HoraEjecucion = new(0, 5);

    // After a failure (database down, for example) the job retries instead of waiting for the next day.
    private static readonly TimeSpan EsperaTrasError = TimeSpan.FromMinutes(5);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!configuration.GetValue(ClaveHabilitado, defaultValue: true))
        {
            logger.LogInformation("Proceso de vencimientos deshabilitado por {Clave}.", ClaveHabilitado);
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            var espera = EsperaTrasError;
            try
            {
                await EjecutarSiCorrespondeAsync(stoppingToken);
                espera = HastaLaProximaEjecucion(reloj);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception ex)
            {
                // Never let a failure stop the host: log it and retry later.
                logger.LogError(ex, "Falló el proceso de vencimientos; se reintenta en {Espera}.", EsperaTrasError);
            }

            try
            {
                await Task.Delay(espera, reloj, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                return;
            }
        }
    }

    /// <summary>
    /// Runs the process for today (Argentina) unless it already ran today.
    /// </summary>
    /// <returns>True if it ran; false if today was already processed.</returns>
    public async Task<bool> EjecutarSiCorrespondeAsync(CancellationToken ct)
    {
        var hoy = FechaArgentina.Hoy(reloj);

        await using var scope = scopeFactory.CreateAsyncScope();
        var controles = scope.ServiceProvider.GetRequiredService<IRepository<ControlProceso>>();
        var control = (await controles.FindAsync(c => c.Nombre == NombreProceso, ct)).SingleOrDefault();
        if (control is not null && control.UltimaFechaProcesada >= hoy)
            return false;

        // Left pending in the scope's unit of work: the single SaveChanges of the service stores it with
        // the day's changes, so a failure never leaves the changes saved with the old control date.
        if (control is null)
            await controles.AddAsync(new ControlProceso { Nombre = NombreProceso, UltimaFechaProcesada = hoy }, ct);
        else
            control.UltimaFechaProcesada = hoy;

        var servicio = scope.ServiceProvider.GetRequiredService<IVencimientosService>();
        var resumen = await servicio.EjecutarAsync(hoy, ct);

        logger.LogInformation(
            "Vencimientos del {Fecha}: {Cuotas} cuotas vencidas, {Canceladas} pólizas canceladas, {Suspendidas} suspendidas y {Vencidas} vencidas.",
            hoy, resumen.CuotasVencidas, resumen.PolizasCanceladas, resumen.PolizasSuspendidas, resumen.PolizasVencidas);
        return true;
    }

    /// <summary>Time left until the next 00:05 in Argentina, according to <paramref name="reloj"/>.</summary>
    public static TimeSpan HastaLaProximaEjecucion(TimeProvider reloj)
    {
        ArgumentNullException.ThrowIfNull(reloj);
        var ahora = reloj.GetUtcNow();
        var hoy = FechaArgentina.Hoy(reloj);
        var proxima = FechaArgentina.AUtc(hoy, HoraEjecucion);
        if (proxima <= ahora)
            proxima = FechaArgentina.AUtc(hoy.AddDays(1), HoraEjecucion);

        return proxima - ahora;
    }
}
