using Aseguradora.Domain.Entities;
namespace Aseguradora.Application.Services;
/// <summary>Define IAprobacionPagoService para la integración de pagos y facturación.</summary>
public interface IAprobacionPagoService
{
    /// <summary>Aplica el cobro de un pago pendiente con sus cuotas y fecha de acreditación.</summary>
    Task<Pago> AprobarAsync(Pago pago, DateTime fechaAcreditacion, CancellationToken ct);
}
