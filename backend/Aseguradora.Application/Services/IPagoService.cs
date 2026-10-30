using Aseguradora.Application.Dtos;

namespace Aseguradora.Application.Services;

/// <summary>Casos de uso de pagos en caja, pagos online y consultas de comprobantes.</summary>
public interface IPagoService
{
    /// <summary>Cobra cuotas de un mismo cliente, aprueba el pago y emite su factura (CU17).</summary>
    Task<PagoResponse> RegistrarCajaAsync(PagoCajaRequest request, CancellationToken ct = default);
    /// <summary>Consulta un pago con su factura, si existe (CU18).</summary>
    Task<PagoResponse> ObtenerPagoAsync(Guid id, CancellationToken ct = default);
    /// <summary>Consulta la factura de un pago, incluso pendiente de CAE (CU18).</summary>
    Task<FacturaResponse> ObtenerFacturaAsync(Guid id, CancellationToken ct = default);
    /// <summary>Consulta una factura verificando DNI y número de pago con error genérico (RN20).</summary>
    Task<FacturaResponse> ObtenerFacturaPublicaAsync(PublicoFacturaRequest request, CancellationToken ct = default);

    /// <summary>
    /// Crea un <c>Pago</c> pendiente para las cuotas indicadas, lo registra en la pasarela elegida y
    /// devuelve el link de pago (CU15). La aprobación llega después por el webhook o la conciliación.
    /// </summary>
    /// <exception cref="Exceptions.NotFoundException">El DNI y la póliza no coinciden (mensaje genérico, RN20).</exception>
    /// <exception cref="Exceptions.BusinessRuleException">Proveedor desconocido o cuotas que no se pueden pagar.</exception>
    /// <exception cref="Exceptions.ExternalServiceException">La pasarela falló; el pago queda rechazado.</exception>
    Task<PagoPublicoResponse> IniciarPagoOnlineAsync(PagoPublicoRequest request, CancellationToken ct = default);
}
