using Aseguradora.Application.Dtos;
using Aseguradora.Application.Exceptions;

namespace Aseguradora.Application.Services;

/// <summary>
/// Service contract for querying and managing insurance coverage plans (CU08, RN05, RN15).
/// </summary>
public interface IPlanService
{
    /// <summary>
    /// Lists all active coverage plans (<c>Activo = true</c>).
    /// </summary>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>A read-only list of active <see cref="PlanResponse"/> items.</returns>
    Task<IReadOnlyList<PlanResponse>> ListarActivosAsync(CancellationToken ct = default);

    /// <summary>
    /// Retrieves an active coverage plan by its identifier.
    /// </summary>
    /// <param name="id">Unique identifier of the plan.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The matching active <see cref="PlanResponse"/>.</returns>
    /// <exception cref="NotFoundException">Thrown when the plan does not exist or is inactive.</exception>
    Task<PlanResponse> ObtenerActivoAsync(Guid id, CancellationToken ct = default);

    /// <summary>
    /// Creates a new active coverage plan after validating business rules (CU08, RN05).
    /// </summary>
    /// <param name="request">Plan creation data.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The created <see cref="PlanResponse"/>.</returns>
    /// <exception cref="BusinessRuleException">Thrown when the code is duplicated or any field violates business rules.</exception>
    Task<PlanResponse> CrearAsync(PlanRequest request, CancellationToken ct = default);

    /// <summary>
    /// Updates an existing coverage plan after validating business rules (CU08, RN05).
    /// Updating the base premium does not alter premiums of already issued policies (RN06).
    /// </summary>
    /// <param name="id">Unique identifier of the plan to update.</param>
    /// <param name="request">Updated plan data.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The updated <see cref="PlanResponse"/>.</returns>
    /// <exception cref="NotFoundException">Thrown when the plan does not exist.</exception>
    /// <exception cref="BusinessRuleException">Thrown when the code is duplicated or any field violates business rules.</exception>
    Task<PlanResponse> ActualizarAsync(Guid id, PlanRequest request, CancellationToken ct = default);

    /// <summary>
    /// Soft-deletes a coverage plan by marking <c>Activo = false</c> without removing the database row (CU08, RN15).
    /// </summary>
    /// <param name="id">Unique identifier of the plan to deactivate.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <exception cref="NotFoundException">Thrown when the plan does not exist.</exception>
    Task DesactivarAsync(Guid id, CancellationToken ct = default);
}
