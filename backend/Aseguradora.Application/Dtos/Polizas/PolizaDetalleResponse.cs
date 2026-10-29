using Aseguradora.Domain.Enums;

namespace Aseguradora.Application.Dtos.Polizas;

/// <summary>
/// Read representation of a policy with its installments (CU10, CU11).
/// </summary>
/// <param name="Id">Unique identifier of the policy.</param>
/// <param name="Numero">Policy number, formatted as <c>POL-0000001</c>.</param>
/// <param name="ClienteId">Identifier of the policy holder.</param>
/// <param name="VehiculoId">Identifier of the insured vehicle.</param>
/// <param name="Patente">License plate of the insured vehicle.</param>
/// <param name="Marca">Make of the insured vehicle.</param>
/// <param name="Modelo">Model of the insured vehicle.</param>
/// <param name="PlanId">Identifier of the coverage plan.</param>
/// <param name="CodigoPlan">Code of the coverage plan (e.g., RC, TC, TR).</param>
/// <param name="NombrePlan">Name of the coverage plan.</param>
/// <param name="CotizacionId">Identifier of the quote the policy was issued from.</param>
/// <param name="PrimaMensual">Monthly premium copied from the quote (RN06).</param>
/// <param name="VigenciaMeses">Policy term in months (RN07).</param>
/// <param name="FechaEmision">UTC issue timestamp.</param>
/// <param name="FechaInicio">Start date of coverage.</param>
/// <param name="FechaFin">End date of coverage.</param>
/// <param name="Estado">Current state of the policy.</param>
/// <param name="Cuotas">Installments ordered by number.</param>
public sealed record PolizaDetalleResponse(
    Guid Id,
    string Numero,
    Guid ClienteId,
    Guid VehiculoId,
    string Patente,
    string Marca,
    string Modelo,
    Guid PlanId,
    string CodigoPlan,
    string NombrePlan,
    Guid? CotizacionId,
    decimal PrimaMensual,
    int VigenciaMeses,
    DateTime FechaEmision,
    DateOnly FechaInicio,
    DateOnly FechaFin,
    EstadoPoliza Estado,
    IReadOnlyList<CuotaResponse> Cuotas);
