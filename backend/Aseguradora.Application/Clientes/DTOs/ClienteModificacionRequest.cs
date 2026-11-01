using System.ComponentModel.DataAnnotations;

namespace Aseguradora.Application.Clientes.DTOs;

/// <summary>
/// Request payload to change the contact data and address of a client (CU05, RN01). DNI, name and
/// the data validated with Renaper are not part of this contract, so they cannot be changed here.
/// </summary>
public sealed record ClienteModificacionRequest
{
    /// <summary>New email; it must be unique (RN01).</summary>
    [Required]
    [EmailAddress]
    [MaxLength(150)]
    public string Email { get; init; } = string.Empty;

    /// <summary>Optional contact phone.</summary>
    [MaxLength(20)]
    public string? Telefono { get; init; }

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
