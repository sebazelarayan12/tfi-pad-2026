using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Exceptions;

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

    private const int MotivoCancelacionMaxLength = 200;

    /// <summary>Only a Vigente policy covers the vehicle (RN10).</summary>
    public bool DaCobertura => Estado == EstadoPoliza.Vigente;

    /// <summary>Pendiente -> Vigente (RN07).</summary>
    public void Activar()
    {
        ExigirEstado(EstadoPoliza.Vigente, EstadoPoliza.Pendiente);
        Estado = EstadoPoliza.Vigente;
    }

    /// <summary>Vigente -> Suspendida (RN09).</summary>
    public void Suspender()
    {
        ExigirEstado(EstadoPoliza.Suspendida, EstadoPoliza.Vigente);
        Estado = EstadoPoliza.Suspendida;
    }

    /// <summary>Suspendida -> Vigente, only when no installment is Vencida (RN09).</summary>
    public void Reactivar()
    {
        ExigirEstado(EstadoPoliza.Vigente, EstadoPoliza.Suspendida);
        if (Cuotas.Any(c => c.Estado == EstadoCuota.Vencida))
            throw new TransicionInvalidaException("No se puede reactivar una póliza con cuotas vencidas.");

        Estado = EstadoPoliza.Vigente;
    }

    /// <summary>
    /// Pendiente, Vigente or Suspendida -> Cancelada. Unpaid installments are voided, paid ones are kept (RN13).
    /// </summary>
    public void Cancelar(string motivo, DateTime fecha)
    {
        var motivoLimpio = motivo?.Trim();
        if (string.IsNullOrEmpty(motivoLimpio))
            throw new ReglaDeDominioException("El motivo de cancelación es obligatorio.");
        if (motivoLimpio.Length > MotivoCancelacionMaxLength)
            throw new ReglaDeDominioException(
                $"El motivo de cancelación no puede superar los {MotivoCancelacionMaxLength} caracteres.");

        ExigirEstado(EstadoPoliza.Cancelada, EstadoPoliza.Pendiente, EstadoPoliza.Vigente, EstadoPoliza.Suspendida);

        foreach (var cuota in Cuotas.Where(c => c.Estado is EstadoCuota.Pendiente or EstadoCuota.Vencida))
            cuota.Anular();

        Estado = EstadoPoliza.Cancelada;
        FechaCancelacion = fecha;
        MotivoCancelacion = motivoLimpio;
    }

    /// <summary>Vigente or Suspendida -> Vencida when the end date is reached (RN14).</summary>
    public void Vencer()
    {
        ExigirEstado(EstadoPoliza.Vencida, EstadoPoliza.Vigente, EstadoPoliza.Suspendida);
        Estado = EstadoPoliza.Vencida;
    }

    /// <summary>
    /// After a payment: activates a Pendiente policy whose first installment is paid (RN07) and reactivates a
    /// Suspendida one with no overdue installments (RN09). Anything else is left as is. The installments come as
    /// a parameter so the check does not depend on the <see cref="Cuotas"/> navigation being loaded.
    /// </summary>
    public void ReevaluarEstado(IEnumerable<Cuota> cuotas)
    {
        ArgumentNullException.ThrowIfNull(cuotas);
        var lista = cuotas as IReadOnlyCollection<Cuota> ?? cuotas.ToList();

        if (Estado == EstadoPoliza.Pendiente
            && lista.Any(c => c.Numero == 1 && c.Estado == EstadoCuota.Pagada))
        {
            Activar();
        }
        else if (Estado == EstadoPoliza.Suspendida && lista.All(c => c.Estado != EstadoCuota.Vencida))
        {
            Estado = EstadoPoliza.Vigente;
        }
    }

    private void ExigirEstado(EstadoPoliza destino, params EstadoPoliza[] origenesPermitidos)
    {
        if (!origenesPermitidos.Contains(Estado))
            throw new TransicionInvalidaException($"No se puede pasar una póliza de {Estado} a {destino}.");
    }
}
