using System.ComponentModel.DataAnnotations;

namespace Aseguradora.Application.Clientes.DTOs;

/// <summary>
/// Request payload to register a client with Renaper validation (CU04, RN01, RN02).
/// The employee can type every field; when Renaper knows the DNI, its data overwrites them.
/// </summary>
public sealed record ClienteAltaRequest
{
    /// <summary>Document number, exactly 8 digits (section 5).</summary>
    [Required]
    [RegularExpression(@"^\d{8}$", ErrorMessage = "El DNI debe tener 8 dígitos.")]
    public string Dni { get; init; } = string.Empty;

    /// <summary>Unique email of the client (RN01).</summary>
    [Required]
    [EmailAddress]
    [MaxLength(150)]
    public string Email { get; init; } = string.Empty;

    /// <summary>Optional contact phone.</summary>
    [MaxLength(20)]
    public string? Telefono { get; init; }

    /// <summary>First name typed by the employee; Renaper overwrites it when the person is valid.</summary>
    [Required]
    [MaxLength(100)]
    public string Nombre { get; init; } = string.Empty;

    /// <summary>Last name typed by the employee; Renaper overwrites it when the person is valid.</summary>
    [Required]
    [MaxLength(100)]
    public string Apellido { get; init; } = string.Empty;

    /// <summary>CUIL typed by the employee; Renaper overwrites it when the person is valid.</summary>
    [Required]
    [RegularExpression(@"^\d{11}$", ErrorMessage = "El CUIL debe tener 11 dígitos.")]
    public string Cuil { get; init; } = string.Empty;

    /// <summary>Birth date typed by the employee; used for the minimum age rule (RN01).</summary>
    [Required]
    public DateOnly? FechaNacimiento { get; init; }

    /// <summary>Sex as one character: <c>M</c>, <c>F</c> or <c>X</c>.</summary>
    [Required]
    public char? Sexo { get; init; }

    /// <summary>Street of the client's address.</summary>
    [Required]
    [MaxLength(150)]
    public string Calle { get; init; } = string.Empty;

    /// <summary>Street number of the client's address.</summary>
    [Required]
    [MaxLength(20)]
    public string Numero { get; init; } = string.Empty;

    /// <summary>City or town of the client's address.</summary>
    [Required]
    [MaxLength(100)]
    public string Localidad { get; init; } = string.Empty;

    /// <summary>Province of the client's address.</summary>
    [Required]
    [MaxLength(100)]
    public string Provincia { get; init; } = string.Empty;

    /// <summary>Postal code of the client's address.</summary>
    [Required]
    [MaxLength(10)]
    public string CodigoPostal { get; init; } = string.Empty;
}
