using Aseguradora.Application.Comun;
using Aseguradora.Application.Dtos.Polizas;
using Aseguradora.Application.Exceptions;
using Aseguradora.Domain.Exceptions;

namespace Aseguradora.Application.Services;

/// <summary>
/// Service contract for issuing, querying and cancelling insurance policies (CU10 to CU13).
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

    /// <summary>Lists policies, newest first, filtered by state, client and plate (CU11).</summary>
    /// <param name="filtro">Optional filters and the page to return.</param>
    /// <param name="ct">Cancellation token.</param>
    Task<PaginaResponse<PolizaListItemResponse>> ListarAsync(PolizaFiltro filtro, CancellationToken ct = default);

    /// <summary>Gets a policy with its vehicle, plan and installments (CU11).</summary>
    /// <exception cref="NotFoundException">Thrown when the policy does not exist.</exception>
    Task<PolizaDetalleResponse> ObtenerAsync(Guid id, CancellationToken ct = default);

    /// <summary>Gets the installments of a policy ordered by number (CU13).</summary>
    /// <exception cref="NotFoundException">Thrown when the policy does not exist.</exception>
    Task<IReadOnlyList<CuotaResponse>> ObtenerCuotasAsync(Guid id, CancellationToken ct = default);

    /// <summary>Cancels a policy and voids its unpaid installments (CU12, RN13).</summary>
    /// <exception cref="NotFoundException">Thrown when the policy does not exist.</exception>
    /// <exception cref="ReglaDeDominioException">Thrown when the reason is empty or too long.</exception>
    /// <exception cref="TransicionInvalidaException">Thrown when the policy is Vencida or already Cancelada.</exception>
    Task<PolizaDetalleResponse> CancelarAsync(Guid id, CancelarPolizaRequest request, CancellationToken ct = default);
}
