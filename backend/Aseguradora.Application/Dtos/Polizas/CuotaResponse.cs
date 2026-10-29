using Aseguradora.Domain.Enums;

namespace Aseguradora.Application.Dtos.Polizas;

/// <summary>
/// Read representation of a policy installment (RN07, RN08).
/// </summary>
/// <param name="Id">Unique identifier of the installment.</param>
/// <param name="Numero">Installment number, from 1 to the policy term in months.</param>
/// <param name="Importe">Monthly premium of the policy.</param>
/// <param name="Recargo">Late surcharge; zero until the installment becomes overdue (RN08).</param>
/// <param name="FechaVencimiento">Due date.</param>
/// <param name="Estado">Current state of the installment.</param>
/// <param name="FechaPago">UTC payment timestamp, or <see langword="null"/> while unpaid.</param>
public sealed record CuotaResponse(
    Guid Id,
    int Numero,
    decimal Importe,
    decimal Recargo,
    DateOnly FechaVencimiento,
    EstadoCuota Estado,
    DateTime? FechaPago);
