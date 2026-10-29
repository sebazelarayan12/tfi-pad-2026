using System.ComponentModel.DataAnnotations;
using Aseguradora.Domain.Enums;

namespace Aseguradora.Application.Dtos.Polizas;

/// <summary>Filters and page of the policy list (CU11). Every filter is optional.</summary>
public sealed record PolizaFiltro
{
    public const int TamanoPorDefecto = 20;
    public const int TamanoMaximo = 100;

    public EstadoPoliza? Estado { get; init; }
    public Guid? ClienteId { get; init; }

    /// <summary>License plate; matched without regard to case or surrounding spaces.</summary>
    public string? Patente { get; init; }

    [Range(1, int.MaxValue)]
    public int Pagina { get; init; } = 1;

    [Range(1, TamanoMaximo)]
    public int Tamano { get; init; } = TamanoPorDefecto;
}
