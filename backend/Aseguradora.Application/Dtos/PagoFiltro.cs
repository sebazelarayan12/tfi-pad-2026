using System.ComponentModel.DataAnnotations;

namespace Aseguradora.Application.Dtos;

/// <summary>Filters and page of the payment list (CU18). Every filter is optional.</summary>
public sealed record PagoFiltro
{
    public const int TamanoPorDefecto = 20;
    public const int TamanoMaximo = 100;

    /// <summary>Highest page whose offset, (Pagina - 1) * TamanoMaximo, still fits in an int.</summary>
    public const int PaginaMaxima = int.MaxValue / TamanoMaximo;

    /// <summary><c>PENDIENTE</c>, <c>APROBADO</c> or <c>RECHAZADO</c>, without regard to case.</summary>
    public string? Estado { get; init; }

    /// <summary><c>CAJA</c>, <c>PASARELA</c> or <c>PAGO_FACIL</c>, without regard to case.</summary>
    public string? Medio { get; init; }

    /// <summary>Policy number; matches the payments that include an installment of that policy.</summary>
    public string? NumeroPoliza { get; init; }

    [Range(1, PaginaMaxima)]
    public int Pagina { get; init; } = 1;

    [Range(1, TamanoMaximo)]
    public int Tamano { get; init; } = TamanoPorDefecto;
}
