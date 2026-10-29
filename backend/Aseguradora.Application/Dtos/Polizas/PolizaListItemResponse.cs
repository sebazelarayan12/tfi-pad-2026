using Aseguradora.Domain.Enums;

namespace Aseguradora.Application.Dtos.Polizas;

/// <summary>One row of the policy list (CU11).</summary>
public sealed record PolizaListItemResponse(
    Guid Id,
    string Numero,
    Guid ClienteId,
    string Patente,
    string CodigoPlan,
    decimal PrimaMensual,
    DateOnly FechaInicio,
    DateOnly FechaFin,
    EstadoPoliza Estado);
