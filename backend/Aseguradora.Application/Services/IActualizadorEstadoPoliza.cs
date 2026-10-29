namespace Aseguradora.Application.Services;

/// <summary>
/// Re-evaluates a policy after its installments changed (RN07, RN09). It does not save:
/// the caller commits through the unit of work.
/// </summary>
public interface IActualizadorEstadoPoliza
{
    Task ReevaluarAsync(Guid polizaId, CancellationToken ct);
}
