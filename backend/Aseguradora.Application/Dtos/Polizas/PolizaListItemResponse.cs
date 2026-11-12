using Aseguradora.Domain.Enums;

namespace Aseguradora.Application.Dtos.Polizas;

/// <summary>
/// One row of the policy list (CU11). <paramref name="ClienteNombre"/> is "Nombre Apellido" and
/// <paramref name="ProximoVencimiento"/> is the due date of the first <c>Pendiente</c> installment
/// (lowest number), or <c>null</c> when the policy has none.
/// </summary>
public sealed record PolizaListItemResponse(
    Guid Id,
    string Numero,
    Guid ClienteId,
    string ClienteNombre,
    string Patente,
    string VehiculoMarca,
    string VehiculoModelo,
    int VehiculoAnio,
    string CodigoPlan,
    decimal PrimaMensual,
    DateOnly FechaInicio,
    DateOnly FechaFin,
    EstadoPoliza Estado,
    DateOnly? ProximoVencimiento);
