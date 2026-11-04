using System.ComponentModel.DataAnnotations;

namespace Aseguradora.Application.Clientes.DTOs;

/// <summary>Filters and page of the client list (CU05). Every filter is optional.</summary>
public sealed record ClienteFiltro
{
    public const int TamanoPorDefecto = 20;
    public const int TamanoMaximo = 100;

    /// <summary>Highest page whose offset, (Pagina - 1) * TamanoMaximo, still fits in an int.</summary>
    public const int PaginaMaxima = int.MaxValue / TamanoMaximo;

    /// <summary>Document number; matched exactly.</summary>
    public string? Dni { get; init; }

    /// <summary>Last name; matched partially, without regard to case or surrounding spaces.</summary>
    public string? Apellido { get; init; }

    [Range(1, PaginaMaxima)]
    public int Pagina { get; init; } = 1;

    [Range(1, TamanoMaximo)]
    public int TamanoPagina { get; init; } = TamanoPorDefecto;
}
