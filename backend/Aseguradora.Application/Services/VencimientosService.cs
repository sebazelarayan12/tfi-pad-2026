using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Interfaces;

namespace Aseguradora.Application.Services;

/// <summary>
/// Daily expiry process (CU14). Loads the policies that can still change (Pendiente, Vigente and
/// Suspendida) with their installments, applies the rules in the order of the spec and saves once,
/// together with any change the caller left pending in the same unit of work.
/// Every transition only fires from its source state, so a second run on the same day is a no-op.
/// </summary>
public sealed class VencimientosService(
    IRepository<Poliza> polizas,
    IRepository<Cuota> cuotas,
    IUnitOfWork unitOfWork,
    TimeProvider reloj) : IVencimientosService
{
    private const int CuotasVencidasParaSuspender = 2;
    private const string MotivoCancelacionPrimeraCuota =
        "Cuota 1 vencida sin pago (RN19).";

    private static readonly EstadoPoliza[] EstadosQueCambian =
        [EstadoPoliza.Pendiente, EstadoPoliza.Vigente, EstadoPoliza.Suspendida];

    /// <inheritdoc />
    public async Task<ResumenVencimientos> EjecutarAsync(DateOnly hoy, CancellationToken ct = default)
    {
        var abiertas = await polizas.FindAsync(p => EstadosQueCambian.Contains(p.Estado), ct);
        var ids = abiertas.Select(p => p.Id).ToList();
        var cuotasPorPoliza = (await cuotas.FindAsync(c => ids.Contains(c.PolizaId), ct))
            .ToLookup(c => c.PolizaId);

        // 1. RN08: every unpaid installment past its due date, also those of a policy that is no longer
        //    open (the last installment can fall due after FechaFin). The tracked instances are the same
        //    as in the lookup above, so the rules below see the new states. Vencer only acts on
        //    Pendiente ones, so the surcharge is never applied twice.
        var atrasadas = await cuotas.FindAsync(c => c.Estado == EstadoCuota.Pendiente && c.FechaVencimiento < hoy, ct);
        var cuotasVencidas = 0;
        foreach (var cuota in atrasadas)
        {
            cuota.Vencer(hoy);
            if (cuota.Estado == EstadoCuota.Vencida)
                cuotasVencidas++;
        }

        int canceladas = 0, suspendidas = 0, vencidas = 0;
        var ahora = reloj.GetUtcNow().UtcDateTime;

        foreach (var poliza in abiertas)
        {
            var cuotasDeLaPoliza = cuotasPorPoliza[poliza.Id].ToList();

            // 2. RN19: a Pendiente policy whose first installment expired is cancelled. Cancelar voids
            //    the unpaid installments through the Cuotas navigation, filled in by the query above.
            if (poliza.Estado == EstadoPoliza.Pendiente
                && cuotasDeLaPoliza.Any(c => c.Numero == 1 && c.Estado == EstadoCuota.Vencida))
            {
                poliza.Cancelar(MotivoCancelacionPrimeraCuota, ahora);
                canceladas++;
                continue;
            }

            // 3. RN09: two or more overdue installments suspend a Vigente policy.
            if (poliza.Estado == EstadoPoliza.Vigente
                && cuotasDeLaPoliza.Count(c => c.Estado == EstadoCuota.Vencida) >= CuotasVencidasParaSuspender)
            {
                poliza.Suspender();
                suspendidas++;
            }

            // 4. RN14: a Vigente or Suspendida policy expires on its end date. Pendiente ones are left
            //    alone (open note 11 of Frente 3).
            if (poliza.Estado is EstadoPoliza.Vigente or EstadoPoliza.Suspendida && poliza.FechaFin <= hoy)
            {
                poliza.Vencer();
                vencidas++;
            }
        }

        await unitOfWork.SaveChangesAsync(ct);

        return new ResumenVencimientos(cuotasVencidas, canceladas, suspendidas, vencidas);
    }
}
