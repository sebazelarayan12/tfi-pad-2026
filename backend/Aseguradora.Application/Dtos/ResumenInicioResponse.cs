using Aseguradora.Domain.Enums;

namespace Aseguradora.Application.Dtos;

/// <summary>Everything the backoffice home page needs in one call (PB-08).</summary>
/// <param name="FechaCorte">Today in Argentina, the day every figure refers to.</param>
/// <param name="PolizasPorEstado">Count of policies per state; every state is present, with 0 when empty.</param>
/// <param name="RendicionPendienteHoy"><c>true</c> when no Pago Fácil settlement is registered for today yet.</param>
/// <param name="FacturasPendientesCae">Invoices still waiting for their CAE from ARCA.</param>
public sealed record ResumenInicioResponse(
    DateOnly FechaCorte,
    IReadOnlyDictionary<string, int> PolizasPorEstado,
    CuotasVencidasResumen CuotasVencidas,
    bool RendicionPendienteHoy,
    int FacturasPendientesCae);

/// <param name="Total">Number of overdue installments.</param>
/// <param name="RecargoPorcentaje">Late surcharge applied to an installment when it becomes overdue (RN08).</param>
/// <param name="Recientes">The most recently due overdue installments, newest due date first.</param>
public sealed record CuotasVencidasResumen(
    int Total,
    decimal RecargoPorcentaje,
    IReadOnlyList<CuotaVencidaResumen> Recientes);

public sealed record CuotaVencidaResumen(
    Guid CuotaId,
    Guid PolizaId,
    string NumeroPoliza,
    string ClienteNombre,
    string ClienteApellido,
    int NumeroCuota,
    DateOnly FechaVencimiento,
    decimal Importe,
    decimal Recargo,
    EstadoCuota Estado);
