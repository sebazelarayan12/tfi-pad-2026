using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;

namespace Aseguradora.Tests.Builders;

/// <summary>
/// A Pendiente policy of six months (RN07) with a unique number (the seed uses POL-0000001).
/// It points to random ids until <see cref="Para"/> ties it to real entities.
/// </summary>
public sealed class PolizaBuilder : TestBuilder<Poliza, PolizaBuilder>
{
    private const int VigenciaMeses = 6;
    private static readonly DateOnly Inicio = new(2026, 10, 15);

    public PolizaBuilder Para(Cliente cliente, Vehiculo vehiculo, Plan plan)
    {
        ArgumentNullException.ThrowIfNull(cliente);
        ArgumentNullException.ThrowIfNull(vehiculo);
        ArgumentNullException.ThrowIfNull(plan);
        return Con(poliza =>
        {
            poliza.ClienteId = cliente.Id;
            poliza.Cliente = cliente;
            poliza.VehiculoId = vehiculo.Id;
            poliza.Vehiculo = vehiculo;
            poliza.PlanId = plan.Id;
            poliza.Plan = plan;
        });
    }

    protected override Poliza CrearPorDefecto() => new()
    {
        Id = Guid.NewGuid(),
        Numero = $"POL-9{Secuencia:D6}",
        ClienteId = Guid.NewGuid(),
        VehiculoId = Guid.NewGuid(),
        PlanId = Guid.NewGuid(),
        PrimaMensual = 12000.00m,
        VigenciaMeses = VigenciaMeses,
        FechaEmision = new DateTime(2026, 10, 15, 0, 0, 0, DateTimeKind.Utc),
        FechaInicio = Inicio,
        FechaFin = Inicio.AddMonths(VigenciaMeses),
        Estado = EstadoPoliza.Pendiente
    };
}
