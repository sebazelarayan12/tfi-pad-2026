using System.ComponentModel.DataAnnotations;
using Aseguradora.Domain.Enums;

namespace Aseguradora.Application.Dtos;

/// <summary>
/// Request payload to change the declared use of a vehicle, the only editable field (CU07).
/// <see cref="Uso"/> is nullable and required so an omitted value is rejected instead of defaulting to Particular.
/// </summary>
public sealed record ModificarUsoRequest
{
    /// <summary>New declared use of the vehicle.</summary>
    [Required]
    public UsoVehiculo? Uso { get; init; }
}
