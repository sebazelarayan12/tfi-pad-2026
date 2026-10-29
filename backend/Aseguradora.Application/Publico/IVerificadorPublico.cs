using Aseguradora.Application.Exceptions;
using Aseguradora.Domain.Entities;

namespace Aseguradora.Application.Publico;

/// <summary>
/// Reusable checker for the public web (RN20): the DNI and the policy or payment number must belong
/// to the same record. F3 uses <see cref="VerificarPolizaAsync"/> for the coupon (CU20) and F4 uses
/// <see cref="VerificarPagoAsync"/> for the invoice (CU18).
/// </summary>
public interface IVerificadorPublico
{
    /// <summary>Returns the policy when it belongs to the client with that DNI.</summary>
    /// <exception cref="NotFoundException">
    /// The DNI does not exist, or the policy does not belong to it. Both cases throw the same message.
    /// </exception>
    Task<Poliza> VerificarPolizaAsync(string dni, string numeroPoliza, CancellationToken ct = default);

    /// <summary>Returns the payment when it belongs to the client with that DNI.</summary>
    /// <exception cref="NotFoundException">
    /// The DNI does not exist, or the payment does not belong to it. Both cases throw the same message.
    /// </exception>
    Task<Pago> VerificarPagoAsync(string dni, string numeroPago, CancellationToken ct = default);
}
