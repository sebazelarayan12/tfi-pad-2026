using System.ComponentModel.DataAnnotations;

namespace Aseguradora.Application.Dtos;

/// <summary>Pedido de la web pública para pagar cuotas de una póliza con una pasarela (CU15, RN11, RN20).</summary>
public sealed record PagoPublicoRequest
{
    /// <summary>Máximo de cuotas por pago online (una póliza dura hasta 24 meses).</summary>
    public const int MaximoCuotas = 24;

    /// <summary>DNI del titular de la póliza, de 8 dígitos.</summary>
    [Required]
    [RegularExpression(@"^\d{8}$", ErrorMessage = "El DNI debe tener 8 dígitos.")]
    public string Dni { get; init; } = string.Empty;

    /// <summary>Número de la póliza a la que pertenecen las cuotas (por ejemplo POL-0000001).</summary>
    [Required]
    [StringLength(20)]
    public string NumeroPoliza { get; init; } = string.Empty;

    /// <summary>Cuotas que se quieren pagar. Todas deben ser de la póliza indicada.</summary>
    [Required]
    [MinLength(1, ErrorMessage = "Debe indicar al menos una cuota.")]
    [MaxLength(MaximoCuotas, ErrorMessage = "Demasiadas cuotas en un solo pago.")]
    public List<Guid> CuotaIds { get; init; } = [];

    /// <summary>Pasarela elegida: <c>pasarela1</c> o <c>pasarela2</c>.</summary>
    [Required]
    [StringLength(30)]
    public string Proveedor { get; init; } = string.Empty;
}
