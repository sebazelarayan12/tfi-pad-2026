using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Exceptions;

namespace Aseguradora.Domain.Services;

/// <summary>Builds the installments of a policy from its monthly premium and term (RN07).</summary>
public static class CalculadorCuotas
{
    private const int DiaDeVencimiento = 10;
    private static readonly int[] VigenciasPermitidas = [1, 6, 12];

    /// <summary>
    /// Installment N is due on the 10th of the month <c>fechaInicio + N</c>, so the first one falls on the
    /// 10th of the month after the start. The minimum lead time is still an open team decision.
    /// </summary>
    public static IReadOnlyList<Cuota> GenerarCuotas(Guid polizaId, decimal primaMensual, DateOnly fechaInicio, int vigenciaMeses)
    {
        if (!VigenciasPermitidas.Contains(vigenciaMeses))
            throw new ReglaDeDominioException("La vigencia debe ser de 1, 6 o 12 meses.");
        if (primaMensual <= 0)
            throw new ReglaDeDominioException("La prima mensual debe ser mayor que cero.");

        var primerDiaDelMesDeInicio = new DateOnly(fechaInicio.Year, fechaInicio.Month, 1);

        return Enumerable.Range(1, vigenciaMeses)
            .Select(numero => new Cuota
            {
                PolizaId = polizaId,
                Numero = numero,
                Importe = primaMensual,
                Recargo = 0m,
                FechaVencimiento = primerDiaDelMesDeInicio.AddMonths(numero).AddDays(DiaDeVencimiento - 1),
                Estado = EstadoCuota.Pendiente
            })
            .ToList();
    }
}
