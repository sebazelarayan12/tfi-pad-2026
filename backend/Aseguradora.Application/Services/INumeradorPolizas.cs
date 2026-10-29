namespace Aseguradora.Application.Services;

/// <summary>
/// Hands out consecutive policy numbers. Each call consumes a number, even if the policy is
/// never saved, so numbers may have gaps but never repeat.
/// </summary>
public interface INumeradorPolizas
{
    /// <summary>Returns the next policy number, formatted as <c>POL-0000001</c>.</summary>
    /// <param name="ct">Cancellation token.</param>
    Task<string> SiguienteNumeroAsync(CancellationToken ct = default);
}
