using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Exceptions;

namespace Aseguradora.Domain.Entities;

public class Factura : EntityBase
{
    /// <summary>Crea la factura sin número ni CAE hasta que ARCA la autorice.</summary>
    public static Factura CrearPendienteCae(Pago pago, DateTime fechaEmision)
    {
        ArgumentNullException.ThrowIfNull(pago);
        if (pago.Estado != EstadoPago.Aprobado)
            throw new ReglaDeDominioException("Solo se facturan pagos aprobados.");
        return new Factura { PagoId = pago.Id, Pago = pago, Importe = pago.ImporteTotal,
            FechaEmision = fechaEmision, Numero = string.Empty };
    }

    /// <summary>Completa los datos fiscales de una factura pendiente.</summary>
    public void Autorizar(string numero, string cae, DateOnly vencimientoCae)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(numero);
        ArgumentNullException.ThrowIfNull(cae);
        if (cae.Length != 14 || cae.Any(c => !char.IsAsciiDigit(c)))
            throw new ReglaDeDominioException("El CAE debe tener 14 dígitos.");
        if (Estado != EstadoFactura.PendienteCae)
            throw new TransicionInvalidaException("La factura ya está autorizada.");
        Numero = numero;
        Cae = cae;
        VencimientoCae = vencimientoCae;
        Estado = EstadoFactura.Autorizada;
    }

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
