using Aseguradora.Application.Services;
using Microsoft.Extensions.Options;

namespace Aseguradora.Api.BackgroundJobs;

/// <summary>Reintenta las facturas sin CAE al iniciar y periódicamente, para una sola réplica.</summary>
public sealed class ReintentoFacturasJob(IServiceScopeFactory scopes, TimeProvider reloj,
    IOptions<ReintentoFacturasOpciones> opciones, ILogger<ReintentoFacturasJob> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var config = opciones.Value;
        if (!config.ReintentosHabilitados) return;
        var intervalo = TimeSpan.FromMinutes(config.IntervaloReintentoMinutos);
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await using var scope = scopes.CreateAsyncScope();
                await scope.ServiceProvider.GetRequiredService<IFacturacionService>().ReintentarPendientesAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { return; }
            catch (Exception ex)
            {
                logger.LogError(ex, "Falló reintento de facturas; nueva corrida en {Intervalo}.", intervalo);
            }
            try { await Task.Delay(intervalo, reloj, stoppingToken); }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { return; }
        }
    }
}
