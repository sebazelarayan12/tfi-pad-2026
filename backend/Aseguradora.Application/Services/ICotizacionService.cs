using Aseguradora.Application.Dtos;
using Aseguradora.Application.Exceptions;

namespace Aseguradora.Application.Services;

/// <summary>
/// Service contract for quoting registered vehicles and retrieving persisted quotes (CU09, CU10).
/// </summary>
public interface ICotizacionService
{
    /// <summary>
    /// Retrieves a quote by its identifier.
    /// </summary>
    /// <param name="id">Unique identifier of the quote.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The matching <see cref="CotizacionDto"/>.</returns>
    /// <exception cref="NotFoundException">Thrown when no quote exists with the given <paramref name="id"/>.</exception>
    Task<CotizacionDto> ObtenerAsync(Guid id, CancellationToken ct = default);

    /// <summary>
    /// Generates and persists one quote per compatible active plan for the specified vehicle (CU09, RN05, RN06).
    /// </summary>
    /// <param name="vehiculoId">Identifier of the registered vehicle to quote.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>A <see cref="CotizacionResultado"/> containing the expiration date and generated plan options.</returns>
    Task<CotizacionResultado> CotizarVehiculoAsync(Guid vehiculoId, CancellationToken ct = default);
}
