using System.ComponentModel.DataAnnotations;
using Aseguradora.Domain.Enums;

namespace Aseguradora.Application.Dtos.Polizas;

/// <summary>Filters and page of the policy list (CU11). Every filter is optional.</summary>
public sealed record PolizaFiltro
{
    public const int TamanoPorDefecto = 20;
    public const int TamanoMaximo = 100;

    /// <summary>Highest page whose offset, (Pagina - 1) * TamanoMaximo, still fits in an int.</summary>
    public const int PaginaMaxima = int.MaxValue / TamanoMaximo;

    public EstadoPoliza? Estado { get; init; }
    public Guid? ClienteId { get; init; }

    /// <summary>License plate; matched without regard to case or surrounding spaces.</summary>
    public string? Patente { get; init; }

    [Range(1, PaginaMaxima)]
    public int Pagina { get; init; } = 1;

    [Range(1, TamanoMaximo)]
    public int Tamano { get; init; } = TamanoPorDefecto;
}
