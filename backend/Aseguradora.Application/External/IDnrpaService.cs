using Aseguradora.Application.Exceptions;

namespace Aseguradora.Application.External;

/// <summary>
/// External service contract for querying vehicle registration and ownership in DNRPA (CU06, RN03, contract 9.4).
/// </summary>
public interface IDnrpaService
{
    /// <summary>
    /// Queries DNRPA for a vehicle by its license plate.
    /// </summary>
    /// <param name="patente">License plate to look up.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The matching <see cref="DatosDnrpa"/> if found, or <see langword="null"/> if the license plate is unknown to DNRPA.</returns>
    /// <exception cref="ExternalServiceException">Thrown when the external DNRPA service fails, times out, or returns an invalid payload.</exception>
    Task<DatosDnrpa?> ObtenerVehiculoAsync(string patente, CancellationToken ct = default);
}
