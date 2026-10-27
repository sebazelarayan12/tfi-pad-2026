using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;

namespace Aseguradora.Tests.Builders;

/// <summary>
/// A Pendiente installment due on the 10th of the month after the issue (RN07). Installment numbers
/// are unique per policy, so build several for one policy with <see cref="Numero"/>.
/// </summary>
public sealed class CuotaBuilder : TestBuilder<Cuota, CuotaBuilder>
{
    private static readonly DateOnly PrimerVencimiento = new(2026, 11, 10);

    public CuotaBuilder DePoliza(Poliza poliza)
    {
        ArgumentNullException.ThrowIfNull(poliza);
        return Con(cuota =>
        {
            cuota.PolizaId = poliza.Id;
            cuota.Poliza = poliza;
        });
    }

    public CuotaBuilder Numero(int numero)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(numero, 1);
        return Con(cuota =>
        {
            cuota.Numero = numero;
            cuota.FechaVencimiento = PrimerVencimiento.AddMonths(numero - 1);
        });
    }

    protected override Cuota CrearPorDefecto() => new()
    {
        Id = Guid.NewGuid(),
        PolizaId = Guid.NewGuid(),
        Numero = 1,
        Importe = 12000.00m,
        Recargo = 0m,
        FechaVencimiento = PrimerVencimiento,
        Estado = EstadoCuota.Pendiente
    };
}
