namespace Aseguradora.Application.Services;
/// <summary>Emite o reintenta la factura de un pago aprobado.</summary>
public interface IFacturacionService
{
    /// <summary>Reintenta las facturas pendientes de CAE sin reenviar las autorizadas.</summary>
    Task ReintentarPendientesAsync(CancellationToken ct = default);
    /// <summary>Solicita autorización a ARCA sin revertir el pago si la integración falla.</summary>
    Task EmitirAsync(Guid pagoId, CancellationToken ct = default);
}
