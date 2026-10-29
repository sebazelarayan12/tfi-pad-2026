using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Exceptions;
using Aseguradora.Domain.Services;

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

    /// <summary>
    /// Pendiente -> Vencida once <paramref name="hoy"/> is past the due date, adding the late surcharge (RN08).
    /// Any other state is left alone, so running it twice never charges the surcharge twice.
    /// </summary>
    public void Vencer(DateOnly hoy)
    {
        if (Estado != EstadoCuota.Pendiente || hoy <= FechaVencimiento)
            return;

        Estado = EstadoCuota.Vencida;
        Recargo = TasaRecargoMora.Calcular(Importe);
    }

    /// <summary>The only way to pay an installment: Pendiente or Vencida -> Pagada.</summary>
    public void Pagar(DateTime fecha)
    {
        if (Estado is not (EstadoCuota.Pendiente or EstadoCuota.Vencida))
            throw new TransicionInvalidaException($"No se puede pagar una cuota en estado {Estado}.");

        Estado = EstadoCuota.Pagada;
        FechaPago = fecha;
    }

    /// <summary>Pendiente or Vencida -> Anulada.</summary>
    public void Anular()
    {
        if (Estado is not (EstadoCuota.Pendiente or EstadoCuota.Vencida))
            throw new TransicionInvalidaException($"No se puede anular una cuota en estado {Estado}.");

        Estado = EstadoCuota.Anulada;
    }
}
