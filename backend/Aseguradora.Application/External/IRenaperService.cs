using Aseguradora.Application.Exceptions;

namespace Aseguradora.Application.External;

/// <summary>
/// External service contract for validating and completing a person's data in Renaper
/// (CU04, RN02, contract 9.1).
/// </summary>
public interface IRenaperService
{
    /// <summary>
    /// Queries Renaper for a person by DNI.
    /// </summary>
    /// <param name="dni">DNI to look up.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The matching <see cref="PersonaRenaper"/>, or <see langword="null"/> when the DNI does not exist.</returns>
    /// <exception cref="ExternalServiceException">Thrown when Renaper fails, times out, or returns an invalid payload.</exception>
    Task<PersonaRenaper?> ObtenerPorDniAsync(string dni, CancellationToken ct = default);
}
