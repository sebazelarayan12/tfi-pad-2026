using System.ComponentModel.DataAnnotations;

namespace Aseguradora.Application.Dtos;

/// <summary>
/// Request payload to create or update a coverage plan (CU08, RN05).
/// </summary>
public sealed record PlanRequest
{
    /// <summary>Unique short code of the coverage plan (e.g., RC, TC, TR).</summary>
    [Required]
    [StringLength(10)]
    public string Codigo { get; init; } = string.Empty;

    /// <summary>Display name of the coverage plan.</summary>
    [Required]
    [StringLength(80)]
    public string Nombre { get; init; } = string.Empty;

    /// <summary>Detailed description of the coverage plan.</summary>
    [Required]
    [StringLength(500)]
    public string Descripcion { get; init; } = string.Empty;

    /// <summary>Base monthly premium in ARS (must be greater than zero).</summary>
    public decimal PrimaBase { get; init; }

    /// <summary>Comma-separated allowed vehicle types (e.g., "Auto,Moto,Camioneta").</summary>
    [Required]
    [StringLength(50)]
    public string TiposPermitidos { get; init; } = string.Empty;

    /// <summary>Maximum vehicle age in years, or <see langword="null"/> if there is no age limit (RN05).</summary>
    public int? AntiguedadMaxima { get; init; }
}
