using Aseguradora.Application.Services;

namespace Aseguradora.Api.BackgroundJobs;

/// <summary>Evita compartir cambios rastreados entre dos reintentos.</summary>
public sealed class EmisorFacturaAislado(IServiceScopeFactory scopes) : IEmisorFacturaAislado
{
    public async Task EmitirAsync(Guid pagoId, CancellationToken ct)
    {
        await using var scope = scopes.CreateAsyncScope();
        await scope.ServiceProvider.GetRequiredService<IFacturacionService>().EmitirAsync(pagoId, ct);
    }
}
