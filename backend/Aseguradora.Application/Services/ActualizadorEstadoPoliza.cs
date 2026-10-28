using Aseguradora.Application.Exceptions;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Interfaces;

namespace Aseguradora.Application.Services;

/// <summary>
/// Loads a policy with its installments and lets the policy decide its next state. It never saves:
/// the caller commits through <see cref="IUnitOfWork"/>, in the same transaction as the payment.
/// </summary>
public class ActualizadorEstadoPoliza(IRepository<Poliza> polizas, IRepository<Cuota> cuotas) : IActualizadorEstadoPoliza
{
    public async Task ReevaluarAsync(Guid polizaId, CancellationToken ct)
    {
        var poliza = await polizas.GetByIdAsync(polizaId, ct)
            ?? throw new NotFoundException($"La póliza {polizaId} no existe.");
        var cuotasDeLaPoliza = await cuotas.FindAsync(c => c.PolizaId == polizaId, ct);

        poliza.ReevaluarEstado(cuotasDeLaPoliza);
    }
}
