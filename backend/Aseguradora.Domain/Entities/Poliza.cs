using Aseguradora.Domain.Enums;

namespace Aseguradora.Domain.Entities;

public class Poliza : EntityBase
{
    public string Numero { get; set; } = string.Empty;
    public Guid ClienteId { get; set; }
    public Guid VehiculoId { get; set; }
    public Guid PlanId { get; set; }
    public Guid? CotizacionId { get; set; }

    /// <summary>Copied from the quote when issued; later plan changes do not affect it.</summary>
    public decimal PrimaMensual { get; set; }

    /// <summary>1, 6 or 12 months; defines how many installments are generated.</summary>
    public int VigenciaMeses { get; set; }

    public DateTime FechaEmision { get; set; }
    public DateOnly FechaInicio { get; set; }
    public DateOnly FechaFin { get; set; }
    public EstadoPoliza Estado { get; set; } = EstadoPoliza.Pendiente;
    public DateTime? FechaCancelacion { get; set; }
    public string? MotivoCancelacion { get; set; }

    public Cliente Cliente { get; set; } = null!;
    public Vehiculo Vehiculo { get; set; } = null!;
    public Plan Plan { get; set; } = null!;
    public Cotizacion? Cotizacion { get; set; }
    public ICollection<Cuota> Cuotas { get; set; } = new List<Cuota>();
}
