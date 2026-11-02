using System.ComponentModel.DataAnnotations;

namespace Aseguradora.Application.Dtos;

/// <summary>
/// Request payload to quote a registered vehicle (CU09). <see cref="VehiculoId"/> is nullable and required so an
/// omitted value is rejected instead of becoming <see cref="Guid.Empty"/>.
/// </summary>
public sealed record CotizarVehiculoRequest
{
    /// <summary>Identifier of the vehicle to quote.</summary>
    [Required]
    public Guid? VehiculoId { get; init; }
}
