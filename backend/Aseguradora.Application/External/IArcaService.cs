using Aseguradora.Application.Dtos;
namespace Aseguradora.Application.External;
/// <summary>Define IArcaService para la integración de pagos y facturación.</summary>
public interface IArcaService
{
    /// <summary>Autoriza una factura idempotente y valida que neto más IVA coincida con el total.</summary>
    Task<ArcaFacturaResponse> EmitirFacturaAsync(ArcaFacturaRequest request, CancellationToken ct);
    /// <summary>Consulta una factura autorizada por su número de comprobante.</summary>
    Task<ArcaFacturaResponse> ConsultarFacturaAsync(string numeroComprobante, CancellationToken ct);
}
