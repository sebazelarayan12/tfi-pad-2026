using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Exceptions;

namespace Aseguradora.Domain.Entities;

public class Pago : EntityBase
{
    /// <summary>Token generado por SQL Server para detectar aprobaciones concurrentes.</summary>
    public byte[]? RowVersion { get; set; }

    /// <summary>Crea un pago con el importe de cada cuota más su recargo.</summary>
    public static Pago CrearPendiente(Guid clienteId, string numero, MedioPago medio,
        IEnumerable<Cuota> cuotas, DateTime fechaCreacion, string? proveedor = null)
    {
        ArgumentNullException.ThrowIfNull(cuotas);
        ArgumentException.ThrowIfNullOrWhiteSpace(numero);
        var seleccion = cuotas.ToList();
        if (seleccion.Count == 0 || seleccion.Select(c => c.Id).Distinct().Count() != seleccion.Count)
            throw new ReglaDeDominioException("Debe seleccionar cuotas sin repetir.");
        if (seleccion.Any(c => c.Estado is EstadoCuota.Pagada or EstadoCuota.Anulada))
            throw new ReglaDeDominioException("Las cuotas deben estar pendientes o vencidas.");
        var pago = new Pago { ClienteId = clienteId, Numero = numero, Medio = medio,
            Proveedor = proveedor, FechaCreacion = ExigirUtc(fechaCreacion) };
        foreach (var cuota in seleccion)
            pago.PagoCuotas.Add(new PagoCuota { PagoId = pago.Id, Pago = pago, CuotaId = cuota.Id,
                Cuota = cuota, Importe = cuota.Importe + cuota.Recargo });
        pago.ImporteTotal = pago.PagoCuotas.Sum(c => c.Importe);
        return pago;
    }

    /// <summary>Aprueba solamente un pago pendiente, con fecha de acreditación UTC.</summary>
    public void Aprobar(DateTime fechaAcreditacion)
    {
        if (Estado != EstadoPago.Pendiente)
            throw new TransicionInvalidaException($"No se puede aprobar un pago {Estado}.");
        FechaAcreditacion = ExigirUtc(fechaAcreditacion);
        Estado = EstadoPago.Aprobado;
    }

    /// <summary>Rechaza solamente un pago pendiente.</summary>
    public void Rechazar()
    {
        if (Estado != EstadoPago.Pendiente)
            throw new TransicionInvalidaException($"No se puede rechazar un pago {Estado}.");
        Estado = EstadoPago.Rechazado;
    }

    private static DateTime ExigirUtc(DateTime fecha)
    {
        if (fecha.Kind == DateTimeKind.Unspecified)
            throw new ReglaDeDominioException("La fecha debe especificar una zona horaria.");
        return fecha.ToUniversalTime();
    }

    /// <summary>Excedente que requiere revisión manual y nunca debe facturarse automáticamente (C8).</summary>
    public bool RequiereRevisionPorDuplicado { get; set; }

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
