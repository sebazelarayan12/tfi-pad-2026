using Aseguradora.Domain.Enums;

namespace Aseguradora.Application.Dtos;

/// <summary>
/// Read representation of a quote (CU09, RN06, RN16). Consumed by Frente 3 when issuing a policy (CU10)
/// and by the quote query endpoints.
/// </summary>
/// <param name="Id">Unique identifier of the quote.</param>
/// <param name="PlanId">Identifier of the coverage plan.</param>
/// <param name="CodigoPlan">Unique code of the coverage plan (e.g., RC, TC, TR).</param>
/// <param name="ClienteId">Identifier of the client, or <see langword="null"/> for external quotes.</param>
/// <param name="VehiculoId">Identifier of the vehicle, or <see langword="null"/> for external quotes.</param>
/// <param name="PrimaMensual">Calculated monthly premium in ARS rounded to 2 decimals (RN06, RN16).</param>
/// <param name="FechaCotizacion">UTC timestamp when the quote was created (RN16).</param>
/// <param name="FechaVencimiento">UTC expiration timestamp of the quote (RN06, RN16).</param>
/// <param name="Origen">Channel from which the quote was requested.</param>
public sealed record CotizacionDto(
    Guid Id,
    Guid PlanId,
    string CodigoPlan,
    Guid? ClienteId,
    Guid? VehiculoId,
    decimal PrimaMensual,
    DateTime FechaCotizacion,
    DateTime FechaVencimiento,
    OrigenCotizacion Origen)
{
    /// <summary>
    /// Determines whether the quote is valid at the given UTC moment (RN06).
    /// A quote is valid up to and including <see cref="FechaVencimiento"/>.
    /// </summary>
    /// <param name="ahoraUtc">Current UTC date and time to evaluate against.</param>
    /// <returns><see langword="true"/> if <paramref name="ahoraUtc"/> is less than or equal to <see cref="FechaVencimiento"/>; otherwise, <see langword="false"/>.</returns>
    public bool EstaVigente(DateTime ahoraUtc) => ahoraUtc <= FechaVencimiento;
}
