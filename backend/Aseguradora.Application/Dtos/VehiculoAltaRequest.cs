using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;
using Aseguradora.Domain.Enums;

namespace Aseguradora.Application.Dtos;

/// <summary>
/// Request payload to register a vehicle for a client with DNRPA validation (CU06, RN03).
/// </summary>
public sealed partial record VehiculoAltaRequest
{
    /// <summary>
    /// Canonical license plate regular expression matching Mercosur (<c>AA000AA</c>) and legacy (<c>AAA000</c>) formats in uppercase.
    /// </summary>
    public const string PatronPatente = @"^([A-Z]{2}[0-9]{3}[A-Z]{2}|[A-Z]{3}[0-9]{3})$";

    /// <summary>Identifier of the client who owns the vehicle.</summary>
    [Required]
    public Guid ClienteId { get; init; }

    /// <summary>Vehicle license plate. Normalized to uppercase before regex validation.</summary>
    [Required]
    public string Patente { get; init; } = string.Empty;

    /// <summary>Declared use of the vehicle (<see cref="UsoVehiculo.Particular"/> or <see cref="UsoVehiculo.Comercial"/>).</summary>
    public UsoVehiculo Uso { get; init; }

    /// <summary>
    /// Normalizes a license plate to trimmed uppercase and checks whether it matches <see cref="PatronPatente"/>.
    /// </summary>
    /// <param name="patente">Raw license plate input.</param>
    /// <returns><see langword="true"/> if the normalized plate matches the valid format; otherwise, <see langword="false"/>.</returns>
    public static bool EsPatenteValida(string? patente)
    {
        if (string.IsNullOrWhiteSpace(patente))
            return false;

        var normalizada = NormalizarPatente(patente);
        return RegexPatente().IsMatch(normalizada);
    }

    /// <summary>
    /// Trims and converts a license plate string to uppercase invariant culture.
    /// </summary>
    /// <param name="patente">Raw license plate string.</param>
    /// <returns>Normalized uppercase license plate.</returns>
    public static string NormalizarPatente(string patente)
    {
        ArgumentNullException.ThrowIfNull(patente);
        return patente.Trim().ToUpperInvariant();
    }

    [GeneratedRegex(PatronPatente, RegexOptions.CultureInvariant)]
    private static partial Regex RegexPatente();
}
