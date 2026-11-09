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
    /// <exception cref="PersonaAmbiguaException">
    /// Thrown when the DNI matches several people; the caller can retry with
    /// <see cref="ObtenerPorCuilAsync"/> (a DNI can belong to a man and a woman).
    /// </exception>
    Task<PersonaRenaper?> ObtenerPorDniAsync(string dni, CancellationToken ct = default);

    /// <summary>
    /// Queries Renaper for a person by CUIL or CUIT. Unique per person, so it settles the ambiguity of a shared DNI.
    /// </summary>
    /// <param name="cuil">Eleven digits, without dashes.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The matching <see cref="PersonaRenaper"/>, or <see langword="null"/> when it does not exist.</returns>
    /// <exception cref="ExternalServiceException">Thrown when Renaper fails, times out, or returns an invalid payload.</exception>
    Task<PersonaRenaper?> ObtenerPorCuilAsync(string cuil, CancellationToken ct = default);
}
