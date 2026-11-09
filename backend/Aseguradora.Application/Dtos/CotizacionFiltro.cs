using System.ComponentModel.DataAnnotations;

namespace Aseguradora.Application.Dtos;

/// <summary>Filters and page of the quote list (CU09). Every filter is optional.</summary>
public sealed record CotizacionFiltro
{
    public const int TamanoPorDefecto = 20;
    public const int TamanoMaximo = 100;

    /// <summary>Highest page whose offset, (Pagina - 1) * TamanoMaximo, still fits in an int.</summary>
    public const int PaginaMaxima = int.MaxValue / TamanoMaximo;

    /// <summary><c>true</c> only quotes still valid today (RN06); <c>false</c> only expired ones.</summary>
    public bool? Vigente { get; init; }

    public Guid? ClienteId { get; init; }

    public Guid? VehiculoId { get; init; }

    /// <summary>License plate; matched without regard to case or surrounding spaces.</summary>
    public string? Patente { get; init; }

    [Range(1, PaginaMaxima)]
    public int Pagina { get; init; } = 1;

    [Range(1, TamanoMaximo)]
    public int Tamano { get; init; } = TamanoPorDefecto;
}
