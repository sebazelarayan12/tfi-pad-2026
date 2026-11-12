using System.ComponentModel.DataAnnotations;

namespace Aseguradora.Application.Dtos;

/// <summary>Datos del titular para consultar el estado de un pago sin sesión (PB-01, RN20).</summary>
public sealed record PublicoEstadoPagoRequest
{
    /// <summary>DNI del titular del pago: el número de pago solo no alcanza para consultarlo.</summary>
    [Required]
    [RegularExpression(@"^\d{8}$", ErrorMessage = "El DNI debe tener 8 dígitos.")]
    public string Dni { get; init; } = string.Empty;

    /// <summary>Número de pago (<c>PAG-xxxxxx</c>) que devolvió <c>POST /api/publico/pagos</c>.</summary>
    [Required]
    [StringLength(20)]
    public string NumeroPago { get; init; } = string.Empty;
}
