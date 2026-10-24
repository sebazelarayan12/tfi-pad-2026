using Aseguradora.Domain.Enums;

namespace Aseguradora.Domain.Entities;

public class Cotizacion : EntityBase
{
    public Guid PlanId { get; set; }

    /// <summary>Null on external quotes, which have no registered client.</summary>
    public Guid? ClienteId { get; set; }
    public Guid? VehiculoId { get; set; }

    public TipoVehiculo TipoVehiculo { get; set; }
    public int AnioVehiculo { get; set; }
    public UsoVehiculo Uso { get; set; }
    public int EdadConductor { get; set; }
    public decimal PrimaMensual { get; set; }
    public DateTime FechaCotizacion { get; set; }
    public DateTime FechaVencimiento { get; set; }
    public OrigenCotizacion Origen { get; set; }

    public Plan Plan { get; set; } = null!;
    public Cliente? Cliente { get; set; }
    public Vehiculo? Vehiculo { get; set; }
    public Poliza? Poliza { get; set; }
}
