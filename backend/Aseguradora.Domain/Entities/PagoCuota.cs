namespace Aseguradora.Domain.Entities;

/// <summary>Join entity: one payment can cover several installments. Key is (PagoId, CuotaId).</summary>
public class PagoCuota
{
    public Guid PagoId { get; set; }
    public Guid CuotaId { get; set; }

    /// <summary>Amount paid for this installment, surcharge included.</summary>
    public decimal Importe { get; set; }

    public Pago Pago { get; set; } = null!;
    public Cuota Cuota { get; set; } = null!;
}
