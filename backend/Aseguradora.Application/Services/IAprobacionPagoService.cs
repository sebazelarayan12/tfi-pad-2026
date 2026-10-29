using Aseguradora.Domain.Entities;
namespace Aseguradora.Application.Services;
/// <summary>Contrato para aprobar un pago pendiente y aplicarlo a sus cuotas.</summary>
public interface IAprobacionPagoService
{
    /// <summary>Aplica el cobro de un pago pendiente con sus cuotas y fecha de acreditación.</summary>
    Task<Pago> AprobarAsync(Pago pago, DateTime fechaAcreditacion, CancellationToken ct);
}
