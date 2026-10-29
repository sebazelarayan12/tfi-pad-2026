using Aseguradora.Application.Dtos;

namespace Aseguradora.Application.Services;

/// <summary>Casos de uso de pago de cuotas con una pasarela.</summary>
public interface IPagoService
{
    /// <summary>
    /// Crea un <c>Pago</c> pendiente para las cuotas indicadas, lo registra en la pasarela elegida y
    /// devuelve el link de pago (CU15). La aprobación llega después por el webhook o la conciliación.
    /// </summary>
    /// <exception cref="Exceptions.NotFoundException">El DNI y la póliza no coinciden (mensaje genérico, RN20).</exception>
    /// <exception cref="Exceptions.BusinessRuleException">Proveedor desconocido o cuotas que no se pueden pagar.</exception>
    /// <exception cref="Exceptions.ExternalServiceException">La pasarela falló; el pago queda rechazado.</exception>
    Task<PagoPublicoResponse> IniciarPagoOnlineAsync(PagoPublicoRequest request, CancellationToken ct = default);
}
