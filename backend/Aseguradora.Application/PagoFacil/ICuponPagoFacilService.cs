using Aseguradora.Application.Dtos.PagoFacil;

namespace Aseguradora.Application.PagoFacil;

/// <summary>Builds the Pago Fácil coupon of an installment (CU20). Nothing is stored.</summary>
public interface ICuponPagoFacilService
{
    /// <exception cref="Exceptions.NotFoundException">The installment does not exist.</exception>
    /// <exception cref="Exceptions.BusinessRuleException">The installment is Pagada or Anulada (RN11).</exception>
    Task<CuponPagoFacilResponse> GenerarAsync(Guid cuotaId, DateOnly hoy, CancellationToken ct = default);
}
