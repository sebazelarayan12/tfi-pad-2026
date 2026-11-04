using System.ComponentModel.DataAnnotations;

namespace Aseguradora.Application.Dtos;

/// <summary>Cuotas del mismo cliente que se cobran en caja.</summary>
public sealed record PagoCajaRequest
{
    [Required]
    [MinLength(1, ErrorMessage = "Debe indicar al menos una cuota.")]
    public IReadOnlyList<Guid> CuotaIds { get; init; } = [];
}
