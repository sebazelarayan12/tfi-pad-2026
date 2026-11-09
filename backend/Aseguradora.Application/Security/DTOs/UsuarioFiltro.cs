using System.ComponentModel.DataAnnotations;

namespace Aseguradora.Application.Security.DTOs;

/// <summary>Page of the account list (PB-04).</summary>
public sealed record UsuarioFiltro
{
    public const int TamanoPorDefecto = 20;
    public const int TamanoMaximo = 100;

    /// <summary>Highest page whose offset, (Pagina - 1) * TamanoMaximo, still fits in an int.</summary>
    public const int PaginaMaxima = int.MaxValue / TamanoMaximo;

    [Range(1, PaginaMaxima)]
    public int Pagina { get; init; } = 1;

    [Range(1, TamanoMaximo)]
    public int Tamano { get; init; } = TamanoPorDefecto;
}
