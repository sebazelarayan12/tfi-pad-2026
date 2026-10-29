using Aseguradora.Application.Dtos.Polizas;
using Aseguradora.Application.Exceptions;
using Aseguradora.Domain.Exceptions;

namespace Aseguradora.Application.Services;

/// <summary>
/// Service contract for issuing insurance policies (CU10).
/// </summary>
public interface IPolizaService
{
    /// <summary>
    /// Issues a Pendiente policy with its installments from a quote, in a single transaction
    /// (CU10, RN02 to RN07). Nothing is saved when a rule fails.
    /// </summary>
    /// <param name="request">Quote and term of the new policy.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The issued policy with its installments.</returns>
    /// <exception cref="NotFoundException">Thrown when the quote does not exist.</exception>
    /// <exception cref="BusinessRuleException">Thrown when an issuing rule fails.</exception>
    /// <exception cref="ReglaDeDominioException">Thrown when the term is not 1, 6 or 12 months.</exception>
    Task<PolizaDetalleResponse> EmitirAsync(EmitirPolizaRequest request, CancellationToken ct = default);
}
