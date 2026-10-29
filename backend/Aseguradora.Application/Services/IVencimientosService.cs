namespace Aseguradora.Application.Services;

/// <summary>
/// Daily expiry process (CU14): overdue installments, cancellations, suspensions and expired policies.
/// </summary>
public interface IVencimientosService
{
    /// <summary>
    /// Applies RN08, RN19, RN09 and RN14 for <paramref name="hoy"/> and saves the changes. Running it twice
    /// for the same day changes nothing the second time.
    /// </summary>
    /// <param name="hoy">Business date in Argentina.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>How many installments and policies changed state.</returns>
    Task<ResumenVencimientos> EjecutarAsync(DateOnly hoy, CancellationToken ct = default);
}

/// <summary>Counts of the changes made by one run of the daily expiry process.</summary>
/// <param name="CuotasVencidas">Installments that became Vencida, with surcharge (RN08).</param>
/// <param name="PolizasCanceladas">Pendiente policies cancelled because installment 1 expired (RN19).</param>
/// <param name="PolizasSuspendidas">Vigente policies suspended with two or more overdue installments (RN09).</param>
/// <param name="PolizasVencidas">Policies that reached their end date (RN14).</param>
public sealed record ResumenVencimientos(
    int CuotasVencidas,
    int PolizasCanceladas,
    int PolizasSuspendidas,
    int PolizasVencidas);
