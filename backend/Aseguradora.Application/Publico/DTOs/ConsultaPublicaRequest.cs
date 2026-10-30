using System.ComponentModel.DataAnnotations;

namespace Aseguradora.Application.Publico.DTOs;

/// <summary>Public query of a policy by holder DNI and policy number (CU02, RN20).</summary>
public sealed record ConsultaPublicaRequest
{
    /// <summary>Holder DNI, 8 digits.</summary>
    [Required]
    [RegularExpression(@"^\d{8}$", ErrorMessage = "El DNI debe tener 8 dígitos.")]
    public string Dni { get; init; } = string.Empty;

    /// <summary>Policy number: POL- followed by 7 digits (for example POL-0000001).</summary>
    [Required]
    [RegularExpression(@"^POL-\d{7}$", ErrorMessage = "El número de póliza debe tener el formato POL-0000000.")]
    public string NumeroPoliza { get; init; } = string.Empty;
}
