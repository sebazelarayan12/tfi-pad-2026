using Aseguradora.Domain.Enums;

namespace Aseguradora.Domain.Entities;

public class Pago : EntityBase
{
    public Guid ClienteId { get; set; }

    /// <summary>Sum of the paid installments plus surcharges.</summary>
    public decimal ImporteTotal { get; set; }

    /// <summary>Own reference (e.g. PAG-6f1c2a) sent to the payment gateway.</summary>
    public string Numero { get; set; } = string.Empty;
    public MedioPago Medio { get; set; }

    /// <summary>Which gateway was used when Medio is Pasarela.</summary>
    public string? Proveedor { get; set; }
    public EstadoPago Estado { get; set; } = EstadoPago.Pendiente;

    /// <summary>Payment id at the gateway, or the settlement-file line for Pago Facil.</summary>
    public string? IdExterno { get; set; }
    public Guid? RendicionId { get; set; }
    public string? LinkPago { get; set; }
    public DateTime FechaCreacion { get; set; }
    public DateTime? FechaAcreditacion { get; set; }

    public Cliente Cliente { get; set; } = null!;
    public RendicionPagoFacil? Rendicion { get; set; }
    public Factura? Factura { get; set; }
    public ICollection<PagoCuota> PagoCuotas { get; set; } = new List<PagoCuota>();
}
