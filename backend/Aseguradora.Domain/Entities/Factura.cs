using Aseguradora.Domain.Enums;

namespace Aseguradora.Domain.Entities;

public class Factura : EntityBase
{
    public Guid PagoId { get; set; }
    public string Numero { get; set; } = string.Empty;
    public char Tipo { get; set; } = 'B';
    public decimal Importe { get; set; }

    /// <summary>Null until ARCA authorizes the invoice.</summary>
    public string? Cae { get; set; }
    public DateOnly? VencimientoCae { get; set; }
    public EstadoFactura Estado { get; set; } = EstadoFactura.PendienteCae;
    public DateTime FechaEmision { get; set; }

    public Pago Pago { get; set; } = null!;
}
