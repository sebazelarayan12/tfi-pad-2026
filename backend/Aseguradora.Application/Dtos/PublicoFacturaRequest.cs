using System.ComponentModel.DataAnnotations;

namespace Aseguradora.Application.Dtos;

/// <summary>Datos del titular para consultar una factura sin sesión (RN20).</summary>
public sealed record PublicoFacturaRequest
{
    [Required]
    [RegularExpression(@"^\d{8}$", ErrorMessage = "El DNI debe tener 8 dígitos.")]
    public string Dni { get; init; } = string.Empty;

    [Required]
    [StringLength(20)]
    public string NumeroPago { get; init; } = string.Empty;
}
