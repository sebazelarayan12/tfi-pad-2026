namespace Aseguradora.Application.Dtos;

/// <summary>
/// Result of quoting a vehicle across all compatible plans (CU09, RN05, RN06).
/// </summary>
/// <param name="FechaVencimiento">UTC expiration date shared by all generated options.</param>
/// <param name="Opciones">List of quote options, one per compatible coverage plan.</param>
public sealed record CotizacionResultado(
    DateTime FechaVencimiento,
    IReadOnlyList<OpcionCotizacion> Opciones);

/// <summary>
/// A single coverage plan option generated during a quote (CU09, contract 9.5 C).
/// </summary>
/// <param name="IdCotizacion">Persisted quote identifier for this plan option.</param>
/// <param name="CodigoPlan">Unique code of the coverage plan (e.g., RC, TC, TR).</param>
/// <param name="Plan">Display name of the coverage plan.</param>
/// <param name="PrimaMensual">Calculated monthly premium in ARS rounded to 2 decimals (RN06).</param>
public sealed record OpcionCotizacion(
    Guid IdCotizacion,
    string CodigoPlan,
    string Plan,
    decimal PrimaMensual);
