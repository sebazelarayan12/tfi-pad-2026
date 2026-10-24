using Aseguradora.Domain.Enums;

namespace Aseguradora.Domain.Entities;

public class Cuota : EntityBase
{
    public Guid PolizaId { get; set; }

    /// <summary>1 to N, where N is the VigenciaMeses of the policy.</summary>
    public int Numero { get; set; }
    public decimal Importe { get; set; }

    /// <summary>Zero until the installment becomes overdue.</summary>
    public decimal Recargo { get; set; }

    public DateOnly FechaVencimiento { get; set; }
    public EstadoCuota Estado { get; set; } = EstadoCuota.Pendiente;
    public DateTime? FechaPago { get; set; }

    public Poliza Poliza { get; set; } = null!;
    public ICollection<PagoCuota> PagoCuotas { get; set; } = new List<PagoCuota>();
}
