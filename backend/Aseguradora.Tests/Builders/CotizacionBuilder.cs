using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;

namespace Aseguradora.Tests.Builders;

/// <summary>
/// A panel quote (CU09) of 12000 a month that expires far in the future. It points to random ids
/// until <see cref="Para"/> ties it to real entities.
/// </summary>
public sealed class CotizacionBuilder : TestBuilder<Cotizacion, CotizacionBuilder>
{
    public CotizacionBuilder Para(Cliente cliente, Vehiculo vehiculo, Plan plan)
    {
        ArgumentNullException.ThrowIfNull(cliente);
        ArgumentNullException.ThrowIfNull(vehiculo);
        ArgumentNullException.ThrowIfNull(plan);
        return Con(cotizacion =>
        {
            cotizacion.ClienteId = cliente.Id;
            cotizacion.VehiculoId = vehiculo.Id;
            cotizacion.PlanId = plan.Id;
            cotizacion.TipoVehiculo = vehiculo.Tipo;
            cotizacion.AnioVehiculo = vehiculo.Anio;
            cotizacion.Uso = vehiculo.Uso;
        });
    }

    protected override Cotizacion CrearPorDefecto() => new()
    {
        Id = Guid.NewGuid(),
        PlanId = Guid.NewGuid(),
        ClienteId = Guid.NewGuid(),
        VehiculoId = Guid.NewGuid(),
        TipoVehiculo = TipoVehiculo.Auto,
        AnioVehiculo = 2020,
        Uso = UsoVehiculo.Particular,
        EdadConductor = 35,
        PrimaMensual = 12000.00m,
        FechaCotizacion = new DateTime(2026, 10, 15, 0, 0, 0, DateTimeKind.Utc),
        FechaVencimiento = new DateTime(2099, 12, 31, 23, 59, 59, DateTimeKind.Utc),
        Origen = OrigenCotizacion.Panel
    };
}
