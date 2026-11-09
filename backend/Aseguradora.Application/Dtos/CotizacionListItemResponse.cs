using Aseguradora.Domain.Enums;

namespace Aseguradora.Application.Dtos;

/// <summary>One row of the quote list (CU09).</summary>
/// <param name="ClienteNombre">Null when the quote was requested without a registered client.</param>
/// <param name="Patente">Null when the quote has no registered vehicle.</param>
/// <param name="Vigente">Whether the quote is still valid today (RN06).</param>
public sealed record CotizacionListItemResponse(
    Guid Id,
    Guid PlanId,
    string CodigoPlan,
    string NombrePlan,
    Guid? ClienteId,
    string? ClienteNombre,
    Guid? VehiculoId,
    string? Patente,
    decimal PrimaMensual,
    DateTime FechaCotizacion,
    DateTime FechaVencimiento,
    bool Vigente,
    OrigenCotizacion Origen);
