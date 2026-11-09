using System.ComponentModel.DataAnnotations;
using Aseguradora.Domain.Enums;

namespace Aseguradora.Application.Dtos;

/// <summary>Filters and page of the global installment list (PB-24). Every filter is optional.</summary>
public sealed record CuotaFiltro
{
    public const int TamanoPorDefecto = 20;
    public const int TamanoMaximo = 100;

    /// <summary>Highest page whose offset, (Pagina - 1) * TamanoMaximo, still fits in an int.</summary>
    public const int PaginaMaxima = int.MaxValue / TamanoMaximo;

    /// <summary>Only installments in this state; every state when omitted.</summary>
    public EstadoCuota? Estado { get; init; }

    /// <summary>Only the installments of this policy.</summary>
    public Guid? PolizaId { get; init; }

    /// <summary>Only the installments of this client's policies.</summary>
    public Guid? ClienteId { get; init; }

    /// <summary>Sort key. Only <c>fechaVencimiento</c> (oldest due date first) is supported, which is also the default.</summary>
    [RegularExpression("^fechaVencimiento$", ErrorMessage = "El orden admitido es 'fechaVencimiento'.")]
    public string? Orden { get; init; }

    [Range(1, PaginaMaxima)]
    public int Pagina { get; init; } = 1;

    [Range(1, TamanoMaximo)]
    public int Tamano { get; init; } = TamanoPorDefecto;
}
