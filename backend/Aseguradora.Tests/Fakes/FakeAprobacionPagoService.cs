using Aseguradora.Application.Services;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;

namespace Aseguradora.Tests.Fakes;

/// <summary>
/// Records the approvals that US-F3-07 asks for without charging anything, so the settlement can be
/// tested apart from F4. <see cref="AlAprobar"/> lets a test look at the state at call time.
/// </summary>
public sealed class FakeAprobacionPagoService : IAprobacionPagoService
{
    public List<(Pago Pago, EstadoPago EstadoAlLlamar, DateTime FechaAcreditacion)> Llamadas { get; } = [];

    public Func<Pago, Task>? AlAprobar { get; set; }

    public async Task<Pago> AprobarAsync(Pago pago, DateTime fechaAcreditacion, CancellationToken ct)
    {
        Llamadas.Add((pago, pago.Estado, fechaAcreditacion));
        if (AlAprobar is not null)
            await AlAprobar(pago);
        return pago;
    }
}
