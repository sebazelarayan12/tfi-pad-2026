using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Interfaces;

namespace Aseguradora.Application.Services;

/// <summary>Own payment reference (e.g. PAG-6f1c2a), shared by every way a payment is created.</summary>
public static class NumeroPago
{
    private const int IntentosNumeroUnico = 5;

    /// <summary>A PAG- reference that no saved payment uses yet.</summary>
    public static async Task<string> GenerarAsync(IRepository<Pago> pagos, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(pagos);
        for (var intento = 0; intento < IntentosNumeroUnico; intento++)
        {
            var numero = $"PAG-{Guid.NewGuid():N}"[..10];
            if (!await pagos.AnyAsync(p => p.Numero == numero, ct))
                return numero;
        }

        throw new InvalidOperationException("No se pudo generar un número de pago único.");
    }
}
