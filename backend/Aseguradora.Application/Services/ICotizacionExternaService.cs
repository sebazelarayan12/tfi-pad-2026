using Aseguradora.Application.Dtos;

namespace Aseguradora.Application.Services;

/// <summary>
/// Service contract for external systems to request vehicle insurance quotes without a registered client (CU09, contract 9.5 C).
/// </summary>
public interface ICotizacionExternaService
{
    /// <summary>
    /// Generates and persists quotes for all compatible active plans based on the external request data (CU09, RN05, RN06).
    /// </summary>
    /// <param name="request">Vehicle and driver parameters provided by the external system.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>A <see cref="CotizacionResultado"/> with the expiration timestamp and compatible plan options.</returns>
    Task<CotizacionResultado> CotizarExternoAsync(CotizacionExternaRequest request, CancellationToken ct = default);
}
